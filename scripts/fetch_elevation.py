"""
fetch_elevation.py
Collects high-resolution elevation data (Copernicus 90m DEM) for Chennai
using Open-Meteo Elevation API across all 15 GCC zones, major transport junctions,
river corridors, and a regular topographical grid.
"""

import os
import sys
import csv
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "elevation")
ELEVATION_CSV = os.path.join(OUTPUT_DIR, "chennai_elevation.csv")

# 1. Critical Chennai reference landmarks, flood basins, and zone centroids
KEY_POINTS = [
    {"name": "Zone 1 - Thiruvottiyur", "lat": 13.1600, "lon": 80.3000, "type": "Zone Centroid"},
    {"name": "Zone 2 - Manali Industrial Basin", "lat": 13.1670, "lon": 80.2600, "type": "Low Basin"},
    {"name": "Zone 3 - Madhavaram", "lat": 13.1490, "lon": 80.2310, "type": "Zone Centroid"},
    {"name": "Zone 4 - Tondiarpet Coastal", "lat": 13.1280, "lon": 80.2890, "type": "Coastal Zone"},
    {"name": "Zone 5 - Royapuram / Port", "lat": 13.1090, "lon": 80.2940, "type": "Harbor Fringe"},
    {"name": "Zone 6 - Thiru-Vi-Ka Nagar / Otteri", "lat": 13.1070, "lon": 80.2430, "type": "Zone Centroid"},
    {"name": "Zone 7 - Ambattur", "lat": 13.1140, "lon": 80.1540, "type": "Zone Centroid"},
    {"name": "Zone 8 - Anna Nagar", "lat": 13.0850, "lon": 80.2100, "type": "Urban Core"},
    {"name": "Zone 9 - Teynampet / Central", "lat": 13.0410, "lon": 80.2500, "type": "Urban Core"},
    {"name": "Zone 10 - Kodambakkam", "lat": 13.0520, "lon": 80.2250, "type": "Zone Centroid"},
    {"name": "Zone 11 - Valasaravakkam", "lat": 13.0400, "lon": 80.1730, "type": "Zone Centroid"},
    {"name": "Zone 12 - Alandur / St Thomas Mt", "lat": 12.9970, "lon": 80.2010, "type": "Transit Hub"},
    {"name": "Zone 13 - Adyar Estuary", "lat": 13.0060, "lon": 80.2570, "type": "River Estuary"},
    {"name": "Zone 14 - Perungudi / Marsh Buffer", "lat": 12.9650, "lon": 80.2430, "type": "Marsh Buffer"},
    {"name": "Zone 15 - Sholinganallur / OMR", "lat": 12.9010, "lon": 80.2280, "type": "IT Corridor"},
    {"name": "Velachery Lake Low Basin", "lat": 12.9800, "lon": 80.2220, "type": "Chronic Flood Basin"},
    {"name": "Pallikaranai Marsh Wetland", "lat": 12.9350, "lon": 80.2180, "type": "Natural Sink"},
    {"name": "Mudichur Basin (Adyar upstream)", "lat": 12.9080, "lon": 80.0710, "type": "Vulnerable Lowland"},
    {"name": "Pulianthope Basin", "lat": 13.0980, "lon": 80.2680, "type": "Otteri Catchment"},
    {"name": "Vyasarpadi GNT Road Subway", "lat": 13.1110, "lon": 80.2610, "type": "Subway Depression"},
    {"name": "T. Nagar Usman Road Basin", "lat": 13.0400, "lon": 80.2330, "type": "Commercial Basin"},
    {"name": "Jafferkhanpet / Kasi Bridge", "lat": 13.0230, "lon": 80.2030, "type": "Adyar Floodplain"},
    {"name": "Kotturpuram River Corridor", "lat": 13.0180, "lon": 80.2400, "type": "Adyar Embankment"},
    {"name": "Tambaram GST Corridor", "lat": 12.9230, "lon": 80.1270, "type": "Transport Corridor"},
    {"name": "Kathipara Junction Guindy", "lat": 13.0070, "lon": 80.2050, "type": "Major Grade Separator"},
    {"name": "Koyambedu CMBT", "lat": 13.0690, "lon": 80.1940, "type": "Central Bus Terminal"},
    {"name": "Chennai Central / Ripon Building", "lat": 13.0830, "lon": 80.2750, "type": "Civic Headquarters"},
    {"name": "Marina Beach Promenade", "lat": 13.0500, "lon": 80.2830, "type": "Coastal Ridge"},
    {"name": "Ennore Creek North", "lat": 13.2200, "lon": 80.3200, "type": "Estuarine Basin"},
    {"name": "Porur Lake Surplus Channel", "lat": 13.0330, "lon": 80.1580, "type": "Lake Buffer"},
]

def classify_terrain(elevation_m: float) -> str:
    if elevation_m < 4.0:
        return "Critical Low Basin (<4m) - Highest Risk"
    elif elevation_m < 8.0:
        return "Low-Lying Plain (4-8m) - High Risk"
    elif elevation_m < 15.0:
        return "Coastal / Fluvial Terrace (8-15m) - Moderate Risk"
    elif elevation_m < 25.0:
        return "Mid Elevation Plain (15-25m) - Low Risk"
    else:
        return "Elevated Ridge / Upland (>25m) - Minimal Risk"

def generate_chennai_grid_points():
    """Generate systematic sample points covering Greater Chennai."""
    points = []
    # Grid across Chennai bounds: lat 12.86 to 13.24 (step ~0.03°), lon 80.12 to 80.30 (step ~0.03°)
    lat_steps = [round(12.86 + i * 0.025, 4) for i in range(16)]
    lon_steps = [round(80.12 + j * 0.025, 4) for j in range(8)]

    idx = 1
    for lat in lat_steps:
        for lon in lon_steps:
            points.append({
                "name": f"Grid_Sample_{idx:03d}",
                "lat": lat,
                "lon": lon,
                "type": "Topographic Grid"
            })
            idx += 1
    return points

def fetch_elevation_data():
    all_points = KEY_POINTS + generate_chennai_grid_points()
    print(f"[ELEVATION] Preparing to query elevation for {len(all_points)} Chennai locations...")

    # Open-Meteo allows batch queries with comma-separated coordinates
    batch_size = 50
    results = []
    headers = ["point_id", "location_name", "location_type", "latitude", "longitude", "elevation_m", "terrain_classification", "source"]

    for i in range(0, len(all_points), batch_size):
        batch = all_points[i:i + batch_size]
        lats = ",".join(str(p["lat"]) for p in batch)
        lons = ",".join(str(p["lon"]) for p in batch)

        url = "https://api.open-meteo.com/v1/elevation"
        params = {"latitude": lats, "longitude": lons}

        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code == 200:
                elevs = resp.json().get("elevation", [])
                for idx, (p, elev) in enumerate(zip(batch, elevs)):
                    point_id = f"CHE-ELEV-{i + idx + 1:04d}"
                    elev_val = round(float(elev), 2)
                    results.append([
                        point_id,
                        p["name"],
                        p["type"],
                        p["lat"],
                        p["lon"],
                        elev_val,
                        classify_terrain(elev_val),
                        "Copernicus GLO-90 DEM (Open-Meteo)"
                    ])
                print(f"  ✓ Processed batch {i // batch_size + 1} ({len(batch)} points)")
            else:
                print(f"  ✗ Batch {i // batch_size + 1} failed: {resp.status_code} {resp.text[:100]}")
        except Exception as e:
            print(f"  ✗ Batch {i // batch_size + 1} exception: {e}")
        time.sleep(0.5)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(ELEVATION_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(results)

    print(f"[ELEVATION] Saved {len(results)} elevation records to {ELEVATION_CSV}\n")
    return len(results)

if __name__ == "__main__":
    fetch_elevation_data()
