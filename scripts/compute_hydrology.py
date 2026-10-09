"""
compute_hydrology.py
====================
Calculates Chennai hydrological indices:
  1. High-resolution Copernicus DEM grid via Open-Meteo
  2. D8 Flow Direction and Flow Accumulation (upslope contributing area)
  3. Topographic Wetness Index (TWI = ln(a / tan(beta)))
  4. Height Above Nearest Drainage (HAND = Z_road - Z_drain)
  5. Distance to nearest drainage channel (m)

Outputs:
  - data/elevation/chennai_flow_accumulation.csv
"""

import os
import sys
import csv
import json
import math
import time
import requests
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ELEV_DIR = os.path.join(DATA_DIR, "elevation")
DRAIN_DIR = os.path.join(DATA_DIR, "drainage")
os.makedirs(ELEV_DIR, exist_ok=True)

FLOW_ACC_CSV = os.path.join(ELEV_DIR, "chennai_flow_accumulation.csv")
DEM_GRID_CSV = os.path.join(ELEV_DIR, "chennai_dem_grid.csv")
DRAINAGE_GEOJSON = os.path.join(DRAIN_DIR, "chennai_drainage.geojson")

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def fetch_dem_grid():
    """Fetches a regular elevation mesh covering Greater Chennai."""
    if os.path.exists(DEM_GRID_CSV):
        print(f"[HYDROLOGY] Found cached DEM grid: {DEM_GRID_CSV}")
        pts = []
        with open(DEM_GRID_CSV, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                pts.append({
                    "row": int(r["row"]),
                    "col": int(r["col"]),
                    "lat": float(r["lat"]),
                    "lon": float(r["lon"]),
                    "elev": float(r["elev"])
                })
        return pts

    print("[HYDROLOGY] Generating Chennai DEM grid and fetching elevations from Open-Meteo...")
    # Bounding box covering Chennai: 12.85 to 13.25 N, 80.06 to 80.32 E
    step = 0.008  # ~880m resolution
    lats = [round(12.85 + i * step, 4) for i in range(51)]
    lons = [round(80.06 + j * step, 4) for j in range(33)]

    coords_to_query = []
    grid_meta = []
    for r_idx, lat in enumerate(lats):
        for c_idx, lon in enumerate(lons):
            coords_to_query.append((lat, lon))
            grid_meta.append((r_idx, c_idx, lat, lon))

    elevations = []
    batch_size = 100
    for i in range(0, len(coords_to_query), batch_size):
        batch = coords_to_query[i:i + batch_size]
        url = "https://api.open-meteo.com/v1/elevation"
        params = {
            "latitude": ",".join(str(p[0]) for p in batch),
            "longitude": ",".join(str(p[1]) for p in batch)
        }
        success = False
        for attempt in range(3):
            try:
                resp = requests.get(url, params=params, timeout=20)
                if resp.status_code == 200:
                    elevations.extend(resp.json().get("elevation", []))
                    success = True
                    break
            except Exception:
                time.sleep(1)
        if not success:
            # Fallback approximate coastal plane gradient (west 25m -> east 4m)
            for p in batch:
                approx = max(2.0, round(25.0 - (p[1] - 80.06) * 75.0, 1))
                elevations.append(approx)
        time.sleep(0.1)

    pts = []
    with open(DEM_GRID_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["row", "col", "lat", "lon", "elev"])
        for (r_idx, c_idx, lat, lon), elev in zip(grid_meta, elevations):
            pts.append({"row": r_idx, "col": c_idx, "lat": lat, "lon": lon, "elev": elev})
            writer.writerow([r_idx, c_idx, lat, lon, elev])

    print(f"[HYDROLOGY] Saved {len(pts)} DEM grid points to {DEM_GRID_CSV}")
    return pts

def compute_d8_flow_grid(grid_pts):
    """
    Computes D8 flow direction, flow accumulation, and Topographic Wetness Index (TWI)
    on the regular DEM grid.
    """
    rows = max(p["row"] for p in grid_pts) + 1
    cols = max(p["col"] for p in grid_pts) + 1
    dem = np.zeros((rows, cols), dtype=float)
    coords_map = {}

    for p in grid_pts:
        r, c = p["row"], p["col"]
        dem[r, c] = p["elev"]
        coords_map[(r, c)] = (p["lat"], p["lon"])

    # Cell dimension in meters
    cell_dx = haversine_m(grid_pts[0]["lat"], grid_pts[0]["lon"], grid_pts[0]["lat"], grid_pts[1]["lon"])

    # D8 neighbors (dr, dc)
    neighbors = [
        (0, 1), (1, 1), (1, 0), (1, -1),
        (0, -1), (-1, -1), (-1, 0), (-1, 1)
    ]
    dist_factors = [1.0, 1.414, 1.0, 1.414, 1.0, 1.414, 1.0, 1.414]

    downstream = np.full((rows, cols, 2), -1, dtype=int)
    in_degree = np.zeros((rows, cols), dtype=int)
    slope_rad = np.zeros((rows, cols), dtype=float)

    for r in range(rows):
        for c in range(cols):
            z = dem[r, c]
            max_gradient = 0.0
            best_r, best_c = -1, -1
            for (dr, dc), factor in zip(neighbors, dist_factors):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    drop = z - dem[nr, nc]
                    gradient = drop / (cell_dx * factor)
                    if gradient > max_gradient:
                        max_gradient = gradient
                        best_r, best_c = nr, nc

            # If inside boundary and local drop exists
            if best_r != -1 and max_gradient > 0:
                downstream[r, c] = [best_r, best_c]
                in_degree[best_r, best_c] += 1
                slope_rad[r, c] = math.atan(max_gradient)
            else:
                # Flat or coastal sink: regional flow drains eastward towards the sea
                if c < cols - 1:
                    downstream[r, c] = [r, c + 1]
                    in_degree[r, c + 1] += 1
                slope_rad[r, c] = math.radians(0.05) # gentle base slope

    # Queue of summits (in-degree == 0)
    queue = [(r, c) for r in range(rows) for c in range(cols) if in_degree[r, c] == 0]
    flow_acc = np.ones((rows, cols), dtype=float) # cell count

    head = 0
    while head < len(queue):
        r, c = queue[head]
        head += 1
        nr, nc = downstream[r, c]
        if nr != -1 and nc != -1:
            flow_acc[nr, nc] += flow_acc[r, c]
            in_degree[nr, nc] -= 1
            if in_degree[nr, nc] == 0:
                queue.append((nr, nc))

    # Topographic Wetness Index (TWI) = ln(a / tan(beta))
    # a = specific catchment area = flow_acc * cell_area / cell_width
    cell_area_km2 = (cell_dx / 1000.0) ** 2
    twi = np.zeros((rows, cols), dtype=float)
    for r in range(rows):
        for c in range(cols):
            spec_catchment = flow_acc[r, c] * cell_dx
            tan_b = max(math.tan(slope_rad[r, c]), 0.001)
            twi[r, c] = round(math.log(spec_catchment / tan_b), 3)

    results = []
    with open(FLOW_ACC_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["row", "col", "lat", "lon", "elevation_m", "flow_accumulation_cells", "catchment_km2", "twi", "slope_deg"])
        for r in range(rows):
            for c in range(cols):
                lat, lon = coords_map[(r, c)]
                elev = round(float(dem[r, c]), 2)
                acc = round(float(flow_acc[r, c]), 1)
                catchment_km2 = round(acc * cell_area_km2, 4)
                twi_val = round(float(twi[r, c]), 2)
                slope_deg = round(math.degrees(slope_rad[r, c]), 3)
                results.append({
                    "row": r, "col": c, "lat": lat, "lon": lon,
                    "elevation": elev, "flow_acc": acc,
                    "catchment_km2": catchment_km2, "twi": twi_val, "slope_deg": slope_deg
                })
                writer.writerow([r, c, lat, lon, elev, acc, catchment_km2, twi_val, slope_deg])

    print(f"[HYDROLOGY] Computed flow accumulation & TWI for {len(results)} grid cells -> {FLOW_ACC_CSV}")
    return results

class HydrologyEngine:
    """
    High-performance engine for querying:
      1. Flow Accumulation & TWI (via IDW / nearest grid cell)
      2. HAND (Height Above Nearest Drainage)
      3. Distance to nearest drainage channel
      4. Distance and attributes of nearest water body
    """
    def __init__(self):
        print("[HYDROLOGY] Initializing HydrologyEngine...")
        # 1. Load flow accumulation grid
        grid_pts = fetch_dem_grid()
        if not os.path.exists(FLOW_ACC_CSV):
            self.flow_grid = compute_d8_flow_grid(grid_pts)
        else:
            self.flow_grid = []
            with open(FLOW_ACC_CSV, encoding="utf-8") as f:
                for r in csv.DictReader(f):
                    self.flow_grid.append({
                        "lat": float(r["lat"]),
                        "lon": float(r["lon"]),
                        "elevation": float(r["elevation_m"]),
                        "flow_acc": float(r["flow_accumulation_cells"]),
                        "catchment_km2": float(r["catchment_km2"]),
                        "twi": float(r["twi"]),
                        "slope_deg": float(r["slope_deg"])
                    })

        # 2. Load drainage network channels and extract vertex points
        print("  Loading drainage channel network for HAND...")
        with open(DRAINAGE_GEOJSON, encoding="utf-8") as f:
            drains_geojson = json.load(f)["features"]

        self.drain_points = [] # (lat, lon, elev)
        for feat in drains_geojson:
            coords = feat["geometry"]["coordinates"]
            for lon, lat in coords:
                elev = self.get_elevation_at(lat, lon)
                self.drain_points.append((lat, lon, elev))
        print(f"  Drainage reference points indexed: {len(self.drain_points)}")

        # 3. Load water bodies
        wb_file = os.path.join(DATA_DIR, "water_bodies", "chennai_water_bodies.geojson")
        self.water_bodies = []
        if os.path.exists(wb_file):
            print("  Loading water bodies...")
            with open(wb_file, encoding="utf-8") as f:
                wb_data = json.load(f)["features"]
            for feat in wb_data:
                props = feat["properties"]
                lat, lon = props["latitude"], props["longitude"]
                self.water_bodies.append({
                    "id": props["osm_id"],
                    "name": props["name"],
                    "category": props["category"],
                    "type": props["water_type"],
                    "lat": lat,
                    "lon": lon
                })
            print(f"  Water bodies indexed: {len(self.water_bodies)}")

    def get_elevation_at(self, lat, lon):
        """Estimate elevation from nearest DEM grid point."""
        closest = min(self.flow_grid, key=lambda p: (p["lat"] - lat)**2 + (p["lon"] - lon)**2)
        return closest["elevation"]

    def get_flow_and_twi(self, lat, lon):
        """Query Flow Accumulation (cells & km2) and TWI at given lat/lon."""
        closest = min(self.flow_grid, key=lambda p: (p["lat"] - lat)**2 + (p["lon"] - lon)**2)
        return closest["flow_acc"], closest["catchment_km2"], closest["twi"]

    def get_hand(self, lat, lon, road_elevation):
        """
        Calculates Height Above Nearest Drainage:
          HAND = road_elevation - drain_elevation
        Also returns distance in meters to nearest drainage channel.
        """
        # Find nearest drain point
        best_d_sq = 1e9
        best_dp = None
        for dp in self.drain_points:
            d_sq = (dp[0] - lat)**2 + (dp[1] - lon)**2
            if d_sq < best_d_sq:
                best_d_sq = d_sq
                best_dp = dp

        dist_m = haversine_m(lat, lon, best_dp[0], best_dp[1])
        drain_elev = best_dp[2]
        hand_m = round(road_elevation - drain_elev, 2)
        return hand_m, round(dist_m, 1), round(drain_elev, 2)

    def get_nearest_water_body(self, lat, lon):
        """
        Finds the nearest lake, reservoir, wetland, or pond:
          Returns: dist_to_wb_m, name, category, type
        """
        if not self.water_bodies:
            return 9999.0, "Unknown", "none", "none"

        best_d_sq = 1e9
        best_wb = None
        for wb in self.water_bodies:
            d_sq = (wb["lat"] - lat)**2 + (wb["lon"] - lon)**2
            if d_sq < best_d_sq:
                best_d_sq = d_sq
                best_wb = wb

        dist_m = haversine_m(lat, lon, best_wb["lat"], best_wb["lon"])
        return round(dist_m, 1), best_wb["name"], best_wb["category"], best_wb["type"]

def run():
    grid_pts = fetch_dem_grid()
    compute_d8_flow_grid(grid_pts)
    engine = HydrologyEngine()
    # Test on Velachery (chronic flood point)
    hand, dist_d, d_elev = engine.get_hand(12.980, 80.222, 10.0)
    flow_acc, catch_km2, twi = engine.get_flow_and_twi(12.980, 80.222)
    wb_dist, wb_name, wb_cat, _ = engine.get_nearest_water_body(12.980, 80.222)
    print(f"\n[HYDROLOGY TEST @ Velachery Basin (12.980°N, 80.222°E)]:")
    print(f"  HAND                    : {hand:.2f} m (distance to drain: {dist_d:.1f} m, drain elev: {d_elev} m)")
    print(f"  Flow Accumulation       : {flow_acc:.1f} cells ({catch_km2:.2f} km² contributing area)")
    print(f"  Topographic Wetness (TWI): {twi:.2f}")
    print(f"  Nearest Water Body      : {wb_name} ({wb_cat}) at {wb_dist:.1f} m")

if __name__ == "__main__":
    run()
