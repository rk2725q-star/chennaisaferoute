"""
verify_locations.py
Validates and prints detailed availability metrics for the 6 primary Chennai locations:
  1. Nungambakkam (Central)
  2. Meenambakkam (Airport / South)
  3. Velachery (Flood Basin)
  4. Sholinganallur / OMR (Southern IT Corridor)
  5. Ambattur (West Industrial/Residential)
  6. Tondiarpet / Madhavaram (North Coastal & Low Basin)
"""

import os
import sys
import csv
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

LOCATIONS = [
    {"key": "nungambakkam", "name": "Nungambakkam", "lat": 13.061, "lon": 80.244, "zone": "Zone 9 (Teynampet)"},
    {"key": "meenambakkam", "name": "Meenambakkam", "lat": 12.994, "lon": 80.180, "zone": "Zone 12 (Alandur)"},
    {"key": "velachery", "name": "Velachery", "lat": 12.980, "lon": 80.222, "zone": "Zone 13 (Adyar)"},
    {"key": "sholinganallur", "name": "Sholinganallur / OMR", "lat": 12.901, "lon": 80.228, "zone": "Zone 15 (Sholinganallur)"},
    {"key": "ambattur", "name": "Ambattur", "lat": 13.114, "lon": 80.154, "zone": "Zone 7 (Ambattur)"},
    {"key": "tondiarpet", "name": "Tondiarpet / Madhavaram", "lat": 13.136, "lon": 80.288, "zone": "Zones 3 & 4 (North Chennai)"}
]

def verify_all_locations():
    print("=" * 80)
    print("📍 CHENNAI 6-LOCATION MULTI-LAYER DATASET VERIFICATION")
    print("=" * 80)

    # 1. Rainfall
    with open(os.path.join(DATA_DIR, "rainfall", "historical.csv"), encoding="utf-8") as f:
        hist_rows = list(csv.DictReader(f))
    with open(os.path.join(DATA_DIR, "rainfall", "forecast.csv"), encoding="utf-8") as f:
        fc_rows = list(csv.DictReader(f))

    # 2. Elevation
    with open(os.path.join(DATA_DIR, "elevation", "chennai_elevation.csv"), encoding="utf-8") as f:
        elev_rows = list(csv.DictReader(f))

    # 3. Roads GeoJSON
    with open(os.path.join(DATA_DIR, "roads", "chennai_roads.geojson"), encoding="utf-8") as f:
        roads_data = json.load(f)
    roads = roads_data["features"]

    # 4. Drainage GeoJSON
    with open(os.path.join(DATA_DIR, "drainage", "chennai_drainage.geojson"), encoding="utf-8") as f:
        drain_data = json.load(f)
    drains = drain_data["features"]

    # 5. Flood Events
    with open(os.path.join(DATA_DIR, "historical_floods", "flood_events.csv"), encoding="utf-8") as f:
        flood_rows = list(csv.DictReader(f))

    print(f"\n{'Location':<26} | {'Rainfall Hist':<14} | {'Rainfall Fc':<12} | {'Elev (m)':<9} | {'Flood Records':<14} | {'Nearby Roads':<13} | {'Nearby Drains'}")
    print("-" * 115)

    for loc in LOCATIONS:
        lat, lon = loc["lat"], loc["lon"]
        key = loc["key"]

        # Rainfall matches
        hist_cnt = sum(1 for r in hist_rows if key in r["station_name"].lower() or (key == "tondiarpet" and "tondiarpet" in r["station_name"].lower()))
        fc_cnt = sum(1 for r in fc_rows if key in r["station_name"].lower() or (key == "tondiarpet" and "tondiarpet" in r["station_name"].lower()))

        # Elevation matches (within ~0.03 deg or by name)
        elev_matches = [r for r in elev_rows if key in r["location_name"].lower() or (abs(float(r["latitude"]) - lat) < 0.02 and abs(float(r["longitude"]) - lon) < 0.02)]
        elev_val = elev_matches[0]["elevation_m"] if elev_matches else "N/A"

        # Flood events matches (by keyword or zone)
        if key == "tondiarpet":
            flood_matches = [r for r in flood_rows if "tondiarpet" in r["location_name"].lower() or "madhavaram" in r["location_name"].lower()]
        elif key == "sholinganallur":
            flood_matches = [r for r in flood_rows if "sholinganallur" in r["location_name"].lower() or "omr" in r["location_name"].lower() or "semmancheri" in r["location_name"].lower()]
        else:
            flood_matches = [r for r in flood_rows if key in r["location_name"].lower()]

        # Nearby roads within ~0.025 degrees (~2.7 km radius)
        nearby_roads = 0
        for feat in roads:
            coords = feat["geometry"]["coordinates"]
            if any(abs(c[1] - lat) < 0.025 and abs(c[0] - lon) < 0.025 for c in coords):
                nearby_roads += 1

        # Nearby drains within ~0.03 degrees (~3.3 km radius)
        nearby_drains = 0
        for feat in drains:
            coords = feat["geometry"]["coordinates"]
            if any(abs(c[1] - lat) < 0.03 and abs(c[0] - lon) < 0.03 for c in coords):
                nearby_drains += 1

        print(f"{loc['name']:<26} | {hist_cnt:>10} hrs | {fc_cnt:>8} hrs | {elev_val:>7} m | {len(flood_matches):>10} evts | {nearby_roads:>9} rds | {nearby_drains:>10} waterways")

    print("-" * 115)
    print(f"\nTotal Dataset Footprint across all Chennai:")
    print(f"  • Total Historical Rainfall Hours  : {len(hist_rows):,} rows")
    print(f"  • Total 7-day Forecast Hours       : {len(fc_rows):,} rows")
    print(f"  • Total Elevation Sample Points     : {len(elev_rows):,} records")
    print(f"  • Total Road Segments               : {len(roads):,} segments")
    print(f"  • Total Waterway & Drain Segments   : {len(drains):,} channels")
    print(f"  • Total Verified Flood & Control Evts: {len(flood_rows):,} records")
    print("=" * 80)

if __name__ == "__main__":
    verify_all_locations()
