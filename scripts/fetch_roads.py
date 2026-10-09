"""
fetch_roads.py
Extracts Chennai's road network (motorway, trunk, primary, secondary, tertiary)
from OpenStreetMap using the Overpass API with multi-mirror fallback and Haversine length computation.
Outputs a standard RFC 7946 GeoJSON FeatureCollection to data/roads/chennai_roads.geojson.
"""

import os
import sys
import json
import math
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "roads")
ROADS_GEOJSON = os.path.join(OUTPUT_DIR, "chennai_roads.geojson")

OVERPASS_MIRRORS = [
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

def haversine_distance_m(coord1, coord2):
    """Calculate Haversine distance in meters between [lon1, lat1] and [lon2, lat2]."""
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371000.0  # Earth radius in meters
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
        "User-Agent": "ChennaiRoadRiskModel/1.0 (manit.research@chennai.edu)",
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

def fetch_chennai_roads():
    print("[ROADS] Querying OpenStreetMap for Chennai primary, secondary, trunk, and arterial roads...")

    # Bounding box covers Greater Chennai Corporation: (12.85, 80.10, 13.25, 80.33)
    # Filter for arterial, trunk, primary, and secondary roads
    query = """
    [out:json][timeout:90];
    (
      way["highway"~"motorway|trunk|primary|secondary"](12.88,80.12,13.20,80.31);
    );
    out geom;
    """

    data = query_overpass(query)
    elements = data.get("elements", []) if data else []

    if not elements:
        print("[ROADS] Primary query returned 0 elements, trying focused corridor extraction...")
        fallback_query = """
        [out:json][timeout:60];
        (
          way["highway"~"primary|secondary"](12.95,80.15,13.12,80.28);
        );
        out geom;
        """
        data = query_overpass(fallback_query)
        elements = data.get("elements", []) if data else []

    features = []
    print(f"[ROADS] Parsing {len(elements)} raw road ways into GeoJSON...")

    for el in elements:
        geom_points = el.get("geometry", [])
        if len(geom_points) < 2:
            continue

        # GeoJSON expects [longitude, latitude] coordinates
        coords = [[p["lon"], p["lat"]] for p in geom_points]
        tags = el.get("tags", {})
        length_m = calculate_linestring_length_m(coords)

        feature = {
            "type": "Feature",
            "id": f"road-{el.get('id')}",
            "properties": {
                "osm_id": el.get("id"),
                "name": tags.get("name", "Unnamed Segment"),
                "name_ta": tags.get("name:ta", ""),
                "highway": tags.get("highway", "unclassified"),
                "ref": tags.get("ref", ""),
                "lanes": tags.get("lanes", ""),
                "maxspeed": tags.get("maxspeed", ""),
                "oneway": tags.get("oneway", "no"),
                "surface": tags.get("surface", "asphalt"),
                "bridge": tags.get("bridge", "no"),
                "tunnel": tags.get("tunnel", "no"),
                "length_m": length_m,
                "start_coord": coords[0],
                "end_coord": coords[-1],
                "city": "Chennai",
                "state": "Tamil Nadu"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        }
        features.append(feature)

    geojson_output = {
        "type": "FeatureCollection",
        "name": "chennai_roads_network",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "metadata": {
            "total_segments": len(features),
            "source": "OpenStreetMap via Overpass API",
            "extracted_at": "2026-09-09",
            "region": "Greater Chennai Corporation (GCC)",
            "bounds": [80.12, 12.88, 80.31, 13.20]
        },
        "features": features
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(ROADS_GEOJSON, "w", encoding="utf-8") as f:
        json.dump(geojson_output, f, indent=2, ensure_ascii=False)

    total_km = sum(f["properties"]["length_m"] for f in features) / 1000.0
    print(f"[ROADS] Successfully wrote {len(features)} road segments ({total_km:.2f} total km) to {ROADS_GEOJSON}\n")
    return len(features)

if __name__ == "__main__":
    fetch_chennai_roads()
