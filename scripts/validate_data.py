"""
validate_data.py
Automated validation script to verify schema, completeness, GeoJSON RFC 7946 compliance,
and coordinate boundaries for all collected Chennai datasets.
"""

import os
import sys
import csv
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Chennai geographic bounding box (with slight buffer for regional basin catchments)
CHENNAI_LAT_MIN, CHENNAI_LAT_MAX = 12.80, 13.30
CHENNAI_LON_MIN, CHENNAI_LON_MAX = 80.00, 80.35

EXPECTED_FILES = {
    "rainfall_historical": os.path.join(DATA_DIR, "rainfall", "historical.csv"),
    "rainfall_forecast": os.path.join(DATA_DIR, "rainfall", "forecast.csv"),
    "elevation": os.path.join(DATA_DIR, "elevation", "chennai_elevation.csv"),
    "roads": os.path.join(DATA_DIR, "roads", "chennai_roads.geojson"),
    "drainage": os.path.join(DATA_DIR, "drainage", "chennai_drainage.geojson"),
    "historical_floods": os.path.join(DATA_DIR, "historical_floods", "flood_events.csv")
}

def validate_csv(filepath, min_rows, required_cols, lat_col="latitude", lon_col="longitude"):
    if not os.path.exists(filepath):
        return False, f"File missing: {filepath}"
    
    file_size_kb = os.path.getsize(filepath) / 1024.0
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        for col in required_cols:
            if col not in headers:
                return False, f"Missing column '{col}' in {filepath}. Available: {headers}"
        
        row_count = 0
        coord_errors = 0
        for row in reader:
            row_count += 1
            if lat_col in row and lon_col in row:
                try:
                    lat = float(row[lat_col])
                    lon = float(row[lon_col])
                    if not (CHENNAI_LAT_MIN <= lat <= CHENNAI_LAT_MAX and CHENNAI_LON_MIN <= lon <= CHENNAI_LON_MAX):
                        coord_errors += 1
                except ValueError:
                    coord_errors += 1

        if row_count < min_rows:
            return False, f"Insufficient rows ({row_count} < {min_rows}) in {filepath}"
        if coord_errors > 0:
            return False, f"{coord_errors} rows had out-of-bounds Chennai coordinates in {filepath}"
        
        return True, f"OK: {row_count} rows ({file_size_kb:.1f} KB)"

def validate_geojson(filepath, min_features):
    if not os.path.exists(filepath):
        return False, f"File missing: {filepath}"
    
    file_size_kb = os.path.getsize(filepath) / 1024.0
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return False, f"Invalid JSON syntax in {filepath}: {e}"

    if data.get("type") != "FeatureCollection":
        return False, f"GeoJSON root type is not FeatureCollection in {filepath}"

    features = data.get("features", [])
    if len(features) < min_features:
        return False, f"Insufficient features ({len(features)} < {min_features}) in {filepath}"

    # Verify first 100 features coordinates within Chennai bbox
    invalid_coords = 0
    for feat in features[:100]:
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])
        if geom.get("type") == "LineString":
            for lon, lat in coords:
                if not (CHENNAI_LAT_MIN <= lat <= CHENNAI_LAT_MAX and CHENNAI_LON_MIN <= lon <= CHENNAI_LON_MAX):
                    invalid_coords += 1
    if invalid_coords > 0:
        return False, f"{invalid_coords} coordinates outside Chennai bbox in sample of {filepath}"

    return True, f"OK: {len(features)} features ({file_size_kb:.1f} KB)"

def run_validation():
    print("=" * 70)
    print("🔍 CHENNAI DATASET INTEGRITY VALIDATOR")
    print("=" * 70)

    results = []
    
    # 1. Historical Rainfall
    ok, msg = validate_csv(
        EXPECTED_FILES["rainfall_historical"],
        min_rows=1000,
        required_cols=["station_name", "latitude", "longitude", "datetime_utc", "rainfall_mm", "intensity_class"]
    )
    results.append(("Rainfall Historical CSV", ok, msg))

    # 2. Forecast Rainfall
    ok, msg = validate_csv(
        EXPECTED_FILES["rainfall_forecast"],
        min_rows=500,
        required_cols=["station_name", "latitude", "longitude", "datetime_utc", "rainfall_mm", "precipitation_probability_pct"]
    )
    results.append(("Rainfall Forecast CSV", ok, msg))

    # 3. Elevation
    ok, msg = validate_csv(
        EXPECTED_FILES["elevation"],
        min_rows=50,
        required_cols=["point_id", "location_name", "latitude", "longitude", "elevation_m", "terrain_classification"]
    )
    results.append(("Elevation CSV", ok, msg))

    # 4. Roads GeoJSON
    ok, msg = validate_geojson(
        EXPECTED_FILES["roads"],
        min_features=500
    )
    results.append(("Roads Network GeoJSON", ok, msg))

    # 5. Drainage GeoJSON
    ok, msg = validate_geojson(
        EXPECTED_FILES["drainage"],
        min_features=50
    )
    results.append(("Drainage Network GeoJSON", ok, msg))

    # 6. Historical Floods CSV
    ok, msg = validate_csv(
        EXPECTED_FILES["historical_floods"],
        min_rows=10,
        required_cols=["event_id", "event_date", "event_name", "location_name", "water_level_m", "rainfall_24h_mm", "severity_class"]
    )
    results.append(("Historical Floods CSV", ok, msg))

    all_passed = True
    for name, ok, msg in results:
        status_icon = "✅" if ok else "❌"
        print(f"{status_icon} {name:<26}: {msg}")
        if not ok:
            all_passed = False

    print("=" * 70)
    if all_passed:
        print("🎉 ALL 6 CHENNAI DATASETS PASSED VALIDATION! Ready for modeling.")
    else:
        print("⚠️ One or more dataset validations failed.")
    print("=" * 70)
    return all_passed

if __name__ == "__main__":
    passed = run_validation()
    sys.exit(0 if passed else 1)
