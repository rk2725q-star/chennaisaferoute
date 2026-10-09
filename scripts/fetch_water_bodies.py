"""
fetch_water_bodies.py
======================
Scrapes Chennai's water bodies (lakes, eris, reservoirs, ponds, basins,
wetlands, temple tanks, and lagoons) from OpenStreetMap using Overpass API.
Produces:
  1. data/water_bodies/chennai_water_bodies.geojson
  2. data/water_bodies/chennai_water_bodies.csv
"""

import os
import sys
import json
import csv
import math
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "water_bodies")
GEOJSON_FILE = os.path.join(OUTPUT_DIR, "chennai_water_bodies.geojson")
CSV_FILE = os.path.join(OUTPUT_DIR, "chennai_water_bodies.csv")

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

def haversine_distance_m(coord1, coord2):
    """Haversine distance in meters between [lon1, lat1] and [lon2, lat2]."""
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def query_overpass(query_str, max_retries=3):
    headers = {
        "User-Agent": "ChennaiWaterBodiesCollector/1.0 (manit.research@chennai.edu)",
        "Accept": "application/json"
    }
    for attempt in range(max_retries):
        for endpoint in OVERPASS_MIRRORS:
            try:
                print(f"  -> Querying Overpass mirror ({endpoint})...")
                resp = requests.post(endpoint, data={"data": query_str}, headers=headers, timeout=60)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code in (429, 504, 502, 500):
                    print(f"    Mirror returned {resp.status_code}, trying next...")
            except Exception as e:
                print(f"    Mirror error: {e}")
            time.sleep(1)
        time.sleep(2)
    return None

def fetch_chennai_water_bodies():
    print("[WATER_BODIES] Scraping Chennai water bodies (lakes, eris, reservoirs, wetlands, ponds)...")

    # Greater Chennai Corporation & immediate metropolitan catchment
    # BBox: lat 12.85 to 13.25, lon 80.05 to 80.33
    query = """
    [out:json][timeout:60];
    (
      way["natural"="water"](12.85,80.05,13.25,80.33);
      way["landuse"="reservoir"](12.85,80.05,13.25,80.33);
      way["landuse"="basin"](12.85,80.05,13.25,80.33);
      way["natural"="wetland"](12.85,80.05,13.25,80.33);
      relation["natural"="water"]["name"](12.85,80.05,13.25,80.33);
      relation["leisure"="nature_reserve"]["name"~"Pallikaranai"](12.85,80.05,13.25,80.33);
      relation["landuse"="reservoir"]["name"](12.85,80.05,13.25,80.33);
    );
    out tags center;
    """

    data = query_overpass(query)
    elements = data.get("elements", []) if data else []

    if not elements:
        print("[WATER_BODIES] Query returned 0 elements. Trying fallback query...")
        fallback_query = """
        [out:json][timeout:45];
        (
          way["natural"="water"](12.88,80.10,13.20,80.30);
          way["landuse"="reservoir"](12.88,80.10,13.20,80.30);
        );
        out tags center;
        """
        data = query_overpass(fallback_query)
        elements = data.get("elements", []) if data else []

    print(f"[WATER_BODIES] Received {len(elements)} raw water body elements from OpenStreetMap.")

    features = []
    csv_rows = []
    seen_ids = set()

    for el in elements:
        osm_id = el.get("id")
        osm_type = el.get("type", "way")
        uid = f"wb-{osm_type}-{osm_id}"
        if uid in seen_ids:
            continue
        seen_ids.add(uid)

        center = el.get("center")
        if not center:
            continue
        lat = center.get("lat")
        lon = center.get("lon")
        if lat is None or lon is None:
            continue

        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ta")
        wb_type = (tags.get("water") or tags.get("natural") or
                   tags.get("landuse") or "water_body")
        
        # Categorize into high-level type
        category = "pond"
        if "lake" in wb_type or (name and ("lake" in name.lower() or "eri" in name.lower() or "aeri" in name.lower())):
            category = "lake"
        elif "reservoir" in wb_type:
            category = "reservoir"
        elif "wetland" in wb_type or "marsh" in wb_type or (name and "marsh" in name.lower()):
            category = "wetland"
        elif "basin" in wb_type:
            category = "basin"
        elif "creek" in wb_type or (name and "creek" in name.lower()):
            category = "estuary/creek"

        if not name:
            name = f"Unnamed {category.title()} ({uid})"

        feature = {
            "type": "Feature",
            "id": uid,
            "properties": {
                "osm_id": osm_id,
                "osm_type": osm_type,
                "name": name,
                "name_ta": tags.get("name:ta", ""),
                "category": category,
                "water_type": wb_type,
                "latitude": lat,
                "longitude": lon,
                "city": "Chennai",
                "state": "Tamil Nadu"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        }
        features.append(feature)

        csv_rows.append([
            uid, osm_id, osm_type, name, category, wb_type,
            round(lat, 6), round(lon, 6), "Chennai"
        ])

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save GeoJSON
    geojson_data = {
        "type": "FeatureCollection",
        "name": "chennai_water_bodies",
        "metadata": {
            "total_water_bodies": len(features),
            "source": "OpenStreetMap Overpass API",
            "extracted_at": "2026-09-09",
            "bounds": [80.05, 12.85, 80.33, 13.25]
        },
        "features": features
    }
    with open(GEOJSON_FILE, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, indent=2, ensure_ascii=False)

    # Save CSV
    csv_headers = [
        "water_body_id", "osm_id", "osm_type", "name",
        "category", "water_type", "latitude", "longitude", "city"
    ]
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(csv_headers)
        writer.writerows(csv_rows)

    print(f"[WATER_BODIES] Successfully saved {len(features)} water bodies:")
    print(f"  - GeoJSON: {GEOJSON_FILE}")
    print(f"  - CSV    : {CSV_FILE}")

    # Summary breakdown
    cat_counts = {}
    for r in csv_rows:
        cat_counts[r[4]] = cat_counts.get(r[4], 0) + 1
    print("  Category breakdown:", cat_counts)
    return len(features)

if __name__ == "__main__":
    fetch_chennai_water_bodies()
