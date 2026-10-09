"""
fetch_drainage.py
Extracts Chennai's drainage, canal, river, and stormwater network from OpenStreetMap
using Overpass API with multi-mirror fallback and attribute enrichment.
Outputs a standard RFC 7946 GeoJSON FeatureCollection to data/drainage/chennai_drainage.geojson.
"""

import os
import sys
import json
import math
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "drainage")
DRAINAGE_GEOJSON = os.path.join(OUTPUT_DIR, "chennai_drainage.geojson")

OVERPASS_MIRRORS = [
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

def haversine_distance_m(coord1, coord2):
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def calculate_linestring_length_m(coords):
    total = 0.0
    for i in range(len(coords) - 1):
        total += haversine_distance_m(coords[i], coords[i + 1])
    return round(total, 2)

def query_overpass(query_str, max_retries=3):
    headers = {
        "User-Agent": "ChennaiDrainageRiskModel/1.0 (manit.research@chennai.edu)",
        "Accept": "application/json"
    }
    for attempt in range(max_retries):
        for endpoint in OVERPASS_MIRRORS:
            try:
                print(f"  -> Querying Overpass mirror ({endpoint})...")
                resp = requests.post(endpoint, data={"data": query_str}, headers=headers, timeout=60)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429 or resp.status_code >= 500:
                    print(f"    Mirror returned {resp.status_code}, trying next mirror...")
            except Exception as e:
                print(f"    Mirror error: {e}")
            time.sleep(1)
        time.sleep(3)
    return None

CHENNAI_LAT_MIN, CHENNAI_LAT_MAX = 12.82, 13.26
CHENNAI_LON_MIN, CHENNAI_LON_MAX = 80.05, 80.34

def filter_coords_to_chennai(coords):
    """Splits and retains only coordinate segments strictly inside Chennai bounds."""
    segments = []
    current_seg = []
    for lon, lat in coords:
        if (CHENNAI_LON_MIN <= lon <= CHENNAI_LON_MAX) and (CHENNAI_LAT_MIN <= lat <= CHENNAI_LAT_MAX):
            current_seg.append([lon, lat])
        else:
            if len(current_seg) >= 2:
                segments.append(current_seg)
            current_seg = []
    if len(current_seg) >= 2:
        segments.append(current_seg)
    return segments

def fetch_chennai_drainage():
    print("[DRAINAGE] Querying OpenStreetMap for Chennai waterways, canals, and stormwater drains...")

    # Query for rivers, canals, drains, streams, and natural water channels within Chennai
    query = """
    [out:json][timeout:90];
    (
      way["waterway"~"river|canal|drain|stream|ditch"](12.86,80.10,13.24,80.33);
      way["water"~"canal|basin|reservoir"](12.86,80.10,13.24,80.33);
    );
    out geom;
    """

    data = query_overpass(query)
    elements = data.get("elements", []) if data else []

    features = []
    print(f"[DRAINAGE] Parsing and clipping {len(elements)} raw waterway elements into Chennai bounds...")

    for el in elements:
        geom_points = el.get("geometry", [])
        if len(geom_points) < 2:
            continue

        raw_coords = [[p["lon"], p["lat"]] for p in geom_points]
        valid_segments = filter_coords_to_chennai(raw_coords)

        tags = el.get("tags", {})
        waterway_val = tags.get("waterway", tags.get("water", "drainage_channel"))
        name = tags.get("name", "")
        if not name:
            name = f"Unnamed {waterway_val.title()} Segment"

        for sub_idx, coords in enumerate(valid_segments):
            length_m = calculate_linestring_length_m(coords)
            seg_id = f"drainage-{el.get('id')}" if len(valid_segments) == 1 else f"drainage-{el.get('id')}-{sub_idx+1}"

            feature = {
                "type": "Feature",
                "id": seg_id,
                "properties": {
                    "osm_id": el.get("id"),
                    "name": name,
                    "name_ta": tags.get("name:ta", ""),
                    "waterway_type": waterway_val,
                    "intermittent": tags.get("intermittent", "no"),
                    "covered": tags.get("covered", "no"),
                    "tunnel": tags.get("tunnel", "no"),
                    "width_m": tags.get("width", ""),
                    "length_m": length_m,
                    "city": "Chennai",
                    "catchment": "Adyar / Cooum / Kosasthalaiyar / Kovalam Basin"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                }
            }
            features.append(feature)

    geojson_output = {
        "type": "FeatureCollection",
        "name": "chennai_drainage_network",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "metadata": {
            "total_channels": len(features),
            "source": "OpenStreetMap waterways & canals",
            "key_waterways": [
                "Adyar River", "Cooum River", "Buckingham Canal",
                "Otteri Nullah", "Mambalam Canal", "Captain Cotton Canal",
                "Veerangal Odai", "Virugambakkam Canal"
            ],
            "extracted_at": "2026-09-09",
            "region": "Greater Chennai Corporation (GCC)",
            "bounds": [80.10, 12.86, 80.33, 13.24]
        },
        "features": features
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(DRAINAGE_GEOJSON, "w", encoding="utf-8") as f:
        json.dump(geojson_output, f, indent=2, ensure_ascii=False)

    total_km = sum(f["properties"]["length_m"] for f in features) / 1000.0
    print(f"[DRAINAGE] Successfully wrote {len(features)} drainage/waterway channels ({total_km:.2f} total km) to {DRAINAGE_GEOJSON}\n")
    return len(features)

if __name__ == "__main__":
    fetch_chennai_drainage()
