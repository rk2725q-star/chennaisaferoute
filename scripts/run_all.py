"""
run_all.py
Master orchestrator to collect all 5 Chennai flood & rainfall risk datasets in sequence
and run the automated data integrity validation suite.
"""

import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fetch_rainfall import fetch_forecast_data, fetch_historical_data
from fetch_elevation import fetch_elevation_data
from fetch_roads import fetch_chennai_roads
from fetch_drainage import fetch_chennai_drainage
from fetch_flood_events import compile_flood_events
from validate_data import run_validation

def main():
    start_time = time.time()
    print("=" * 70)
    print("🚀 CHENNAI FLOOD RISK DATA COLLECTION PIPELINE")
    print("=" * 70)

    print("\n[Step 1/5] Collecting Rainfall Data (Historical & 7-day Forecast)...")
    fetch_forecast_data()
    fetch_historical_data()

    print("\n[Step 2/5] Collecting Elevation Data (Copernicus 90m DEM)...")
    fetch_elevation_data()

    print("\n[Step 3/5] Extracting Chennai Roads Network GeoJSON...")
    fetch_chennai_roads()

    print("\n[Step 4/5] Extracting Chennai Drainage & Waterway Network GeoJSON...")
    fetch_chennai_drainage()

    print("\n[Step 5/5] Compiling Historical Ground-Truth Flood Events...")
    compile_flood_events()

    print("\n[Verification] Running data integrity validation...")
    success = run_validation()

    elapsed = round(time.time() - start_time, 2)
    print(f"\n✨ Pipeline finished in {elapsed} seconds. Exit status: {'SUCCESS' if success else 'FAILURE'}\n")
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
