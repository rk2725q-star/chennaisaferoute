"""
prepare_model_data.py
=====================
Full GIS data cleaning and feature engineering pipeline.
Produces the enriched final model-ready CSV:
  - Road Topology: road_id, osm_way_id, edge_id, start_node_id, end_node_id, node_degree, length_m
  - Meteorological: event_date, event_name, rain_3h, rain_24h
  - Hydrological & Terrain: elevation, slope, hand (Height Above Nearest Drainage),
    dist_to_drain_m, flow_accumulation, catchment_km2, twi, drainage_density
  - Water Bodies: dist_to_water_body_m, nearest_water_body_name, nearest_water_body_type
  - Urban & History: built_up, flood_history
  - Labels & Spatial: target, data_limited, road_name, highway_type, lat, lon, geometry
"""

import os, sys, csv, json, math, time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(DATA_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
from compute_hydrology import HydrologyEngine

OUTPUT_CSV = os.path.join(MODEL_DIR, "road_flood_features.csv")

# ---------------------------------------------------------------------------
# SPATIAL UTILITIES
# ---------------------------------------------------------------------------
def haversine_m(lat1, lon1, lat2, lon2):
    """Haversine distance in metres between two lat/lon points."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlam  = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def linestring_centroid(coords):
    """Return [lat, lon] centroid of a GeoJSON LineString coordinate list."""
    lon = sum(c[0] for c in coords) / len(coords)
    lat = sum(c[1] for c in coords) / len(coords)
    return lat, lon

def linestring_length_m(coords):
    total = 0.0
    for i in range(len(coords)-1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i+1]
        total += haversine_m(lat1, lon1, lat2, lon2)
    return total

# ---------------------------------------------------------------------------
# 1. LOAD DATASETS
# ---------------------------------------------------------------------------
print("[1/7] Loading datasets...")

# Roads
roads_path = os.path.join(DATA_DIR, "roads", "chennai_roads.geojson")
with open(roads_path, encoding="utf-8") as f:
    roads_data = json.load(f)["features"]

# Road Nodes degrees lookup
nodes_path = os.path.join(DATA_DIR, "roads", "chennai_road_nodes.csv")
node_degrees = {}
if os.path.exists(nodes_path):
    with open(nodes_path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            node_degrees[r["node_id"]] = int(r["degree"])
print(f"  Road nodes indexed: {len(node_degrees)}")

# Elevation points (Copernicus 90m DEM)
with open(os.path.join(DATA_DIR, "elevation", "chennai_elevation.csv"), encoding="utf-8") as f:
    elev_rows = list(csv.DictReader(f))
elev_points = [(float(r["latitude"]), float(r["longitude"]), float(r["elevation_m"])) for r in elev_rows]

# Drainage channels
with open(os.path.join(DATA_DIR, "drainage", "chennai_drainage.geojson"), encoding="utf-8") as f:
    drains_data = json.load(f)["features"]

# Historical rainfall
with open(os.path.join(DATA_DIR, "rainfall", "historical.csv"), encoding="utf-8") as f:
    rain_rows = list(csv.DictReader(f))

# Flood events (ground truth)
with open(os.path.join(DATA_DIR, "historical_floods", "flood_events.csv"), encoding="utf-8") as f:
    flood_rows = list(csv.DictReader(f))

# Hydrology Engine (HAND, flow accumulation, nearest water bodies)
hydro_engine = HydrologyEngine()

print(f"  Roads: {len(roads_data)}, Elev: {len(elev_points)}, Drains: {len(drains_data)}, Rain rows: {len(rain_rows)}, Flood events: {len(flood_rows)}")

# ---------------------------------------------------------------------------
# 2. CLEAN & VALIDATE DATASETS
# ---------------------------------------------------------------------------
print("[2/7] Cleaning datasets...")

CHENNAI_LAT_MIN, CHENNAI_LAT_MAX = 12.80, 13.26
CHENNAI_LON_MIN, CHENNAI_LON_MAX = 80.05, 80.34

def valid_coord(lat, lon):
    return (CHENNAI_LAT_MIN <= lat <= CHENNAI_LAT_MAX and
            CHENNAI_LON_MIN <= lon <= CHENNAI_LON_MAX)

# Clean roads: filter invalid geometry, compute centroid + topological properties
clean_roads = []
skipped = 0
for feat in roads_data:
    coords = feat["geometry"]["coordinates"]
    if len(coords) < 2:
        skipped += 1
        continue
    lat, lon = linestring_centroid(coords)
    if not valid_coord(lat, lon):
        skipped += 1
        continue
    
    props = feat.get("properties", {})
    osm_id = props.get("osm_id", feat["id"].replace("road-", ""))
    edge_id = props.get("edge_id", f"edge-{osm_id}")
    start_nid = props.get("start_node_id", "")
    end_nid = props.get("end_node_id", "")
    
    # Calculate degree as maximum connectivity of incident endpoints
    deg_start = node_degrees.get(start_nid, 1)
    deg_end = node_degrees.get(end_nid, 1)
    max_degree = max(deg_start, deg_end)

    length_m = props.get("length_m")
    if not length_m:
        length_m = round(linestring_length_m(coords), 2)

    clean_roads.append({
        "road_id": feat["id"],
        "osm_id": osm_id,
        "edge_id": edge_id,
        "start_node_id": start_nid,
        "end_node_id": end_nid,
        "node_degree": max_degree,
        "length_m": round(float(length_m), 2),
        "name": props.get("name", "Unnamed"),
        "highway": props.get("highway", "unclassified"),
        "lat": lat,
        "lon": lon,
        "coords": coords
    })
print(f"  Roads: {len(clean_roads)} valid ({skipped} skipped out-of-bounds/bad geometry)")

# Clean rainfall — parse datetime and rainfall value
clean_rain = []
for r in rain_rows:
    try:
        dt = r["datetime_utc"][:10]   # YYYY-MM-DD
        hr = int(r["datetime_utc"][11:13]) if len(r["datetime_utc"]) > 10 else 0
        mm = float(r["rainfall_mm"] or 0)
        lat = float(r["latitude"])
        lon = float(r["longitude"])
        station = r["station_name"]
        clean_rain.append({"date": dt, "hour": hr, "mm": mm, "lat": lat, "lon": lon, "station": station})
    except Exception:
        pass
print(f"  Rainfall rows cleaned: {len(clean_rain)}")

# Flood events: separate confirmed floods vs controls, clean coords
confirmed_floods = []
control_points = []
for r in flood_rows:
    try:
        lat = float(r["latitude"]); lon = float(r["longitude"])
        date = r["event_date"]
        rain24 = float(r["rainfall_24h_mm"] or 0)
        peak = float(r["peak_intensity_mm_hr"] or 0)
        wl = float(r["water_level_m"] or 0)
        occurred = int(r["flood_occurred"])
        if not valid_coord(lat, lon):
            continue
        rec = {"date": date, "lat": lat, "lon": lon, "rain24": rain24,
               "peak_intensity": peak, "water_level": wl, "occurred": occurred,
               "event_name": r["event_name"]}
        if occurred == 1:
            confirmed_floods.append(rec)
        else:
            control_points.append(rec)
    except Exception:
        pass
print(f"  Confirmed flood events: {len(confirmed_floods)}, Control (dry) events: {len(control_points)}")

# Drain centroids for density computation
drain_centroids = []
for feat in drains_data:
    coords = feat["geometry"]["coordinates"]
    if len(coords) < 2:
        continue
    lat, lon = linestring_centroid(coords)
    if valid_coord(lat, lon):
        seg_len = linestring_length_m(coords)
        drain_centroids.append((lat, lon, seg_len))
print(f"  Drain centroids computed: {len(drain_centroids)}")

# ---------------------------------------------------------------------------
# 3. BUILD SPATIAL LOOKUP STRUCTURES
# ---------------------------------------------------------------------------
print("[3/7] Building spatial lookup structures...")

# Build per-date rainfall lookup: date -> list of (lat, lon, hourly_mm, station)
rain_by_date = {}
for r in clean_rain:
    rain_by_date.setdefault(r["date"], []).append(r)

# Build per-date confirmed flood lookup
floods_by_date = {}
for f in confirmed_floods:
    floods_by_date.setdefault(f["date"], []).append(f)

# All event dates we care about (from flood_events.csv)
all_event_dates = sorted(set(r["date"] for r in confirmed_floods + control_points))
print(f"  Event dates to process: {all_event_dates}")

# ---------------------------------------------------------------------------
# 4. PER-ROAD FEATURE EXTRACTION (date-invariant spatial + hydrological features)
# ---------------------------------------------------------------------------
print("[4/7] Computing date-invariant spatial, hydrological, and water body features per road...")

DRAIN_RADIUS_M = 600.0
BUILT_UP_RADIUS_M = 400.0
FLOOD_HIST_RADIUS_M = 700.0
FLOOD_TARGET_RADIUS_M = 800.0
N_ELEV_NEIGHBOURS = 4

def nearest_elev_points(lat, lon, k=N_ELEV_NEIGHBOURS):
    """Return k nearest elevation records sorted by distance."""
    dists = [(haversine_m(lat, lon, e[0], e[1]), e) for e in elev_points]
    dists.sort(key=lambda x: x[0])
    return dists[:k]

def compute_elevation(lat, lon):
    """Distance-weighted average elevation from k nearest DEM points."""
    neighbours = nearest_elev_points(lat, lon)
    if not neighbours:
        return 10.0
    if neighbours[0][0] < 1.0:
        return neighbours[0][1][2]
    weights = [1.0 / max(d, 1.0) for d, _ in neighbours]
    elevs   = [e[2] for _, e in neighbours]
    return round(sum(w*e for w, e in zip(weights, elevs)) / sum(weights), 2)

def compute_slope(lat, lon):
    """
    Estimate slope (degrees) using elevation gradient between the two
    nearest DEM grid points that are at least 90m apart.
    """
    neighbours = nearest_elev_points(lat, lon, k=6)
    best_slope = 0.0
    for i in range(len(neighbours)):
        for j in range(i+1, len(neighbours)):
            d1, e1 = neighbours[i]
            d2, e2 = neighbours[j]
            horiz = haversine_m(e1[0], e1[1], e2[0], e2[1])
            if horiz < 90.0:
                continue
            vert = abs(e1[2] - e2[2])
            slope_deg = math.degrees(math.atan(vert / horiz))
            if slope_deg > best_slope:
                best_slope = slope_deg
    return round(best_slope, 4)

def compute_drainage_density(lat, lon, radius_m=DRAIN_RADIUS_M):
    """Total drain length (m) within radius / circle area (km²)."""
    total_len = 0.0
    for dlat, dlon, seg_len in drain_centroids:
        if haversine_m(lat, lon, dlat, dlon) <= radius_m:
            total_len += seg_len
    area_km2 = math.pi * (radius_m / 1000.0) ** 2
    return round(total_len / area_km2, 4)

def compute_built_up(lat, lon, roads_list, radius_m=BUILT_UP_RADIUS_M):
    """Count of road centroids within radius (built-up density proxy)."""
    count = 0
    for r in roads_list:
        if haversine_m(lat, lon, r["lat"], r["lon"]) <= radius_m:
            count += 1
    return count

def compute_flood_history(lat, lon, all_floods, radius_m=FLOOD_HIST_RADIUS_M):
    """Count of ALL confirmed past flood events within radius (across all dates)."""
    count = 0
    for f in all_floods:
        if haversine_m(lat, lon, f["lat"], f["lon"]) <= radius_m:
            count += 1
    return count

# Pre-compute stable spatial features for each road
t0 = time.time()
road_spatial = {}
total = len(clean_roads)

for idx, road in enumerate(clean_roads):
    if idx % 1000 == 0:
        elapsed = time.time() - t0
        print(f"    {idx}/{total} roads processed ({elapsed:.1f}s elapsed)...")
    lat, lon = road["lat"], road["lon"]
    elev = compute_elevation(lat, lon)
    slope = compute_slope(lat, lon)
    drain_density = compute_drainage_density(lat, lon)
    built_up = compute_built_up(lat, lon, clean_roads)
    flood_hist = compute_flood_history(lat, lon, confirmed_floods)

    # Hydrological computations
    hand, dist_to_drain, drain_elev = hydro_engine.get_hand(lat, lon, elev)
    flow_acc, catchment_km2, twi = hydro_engine.get_flow_and_twi(lat, lon)
    dist_wb, wb_name, wb_cat, wb_type = hydro_engine.get_nearest_water_body(lat, lon)

    road_spatial[road["road_id"]] = {
        "elevation": elev,
        "slope": slope,
        "hand": hand,
        "dist_to_drain_m": dist_to_drain,
        "flow_accumulation": flow_acc,
        "catchment_km2": catchment_km2,
        "twi": twi,
        "drainage_density": drain_density,
        "dist_to_water_body_m": dist_wb,
        "nearest_water_body_name": wb_name,
        "nearest_water_body_type": wb_cat,
        "built_up": built_up,
        "flood_history": flood_hist
    }

print(f"  All spatial & hydrological features computed for {len(road_spatial)} roads in {time.time()-t0:.1f}s")

# ---------------------------------------------------------------------------
# 5. PER-DATE RAINFALL FEATURE EXTRACTION
# ---------------------------------------------------------------------------
print("[5/7] Computing rainfall features per road × event date...")

def get_nearest_rain_station(lat, lon, date_rain_rows):
    """Find nearest rainfall station records for a given date."""
    stations = {}
    for r in date_rain_rows:
        key = r["station"]
        if key not in stations:
            stations[key] = {"lat": r["lat"], "lon": r["lon"], "rows": []}
        stations[key]["rows"].append(r)
    if not stations:
        return None, []
    nearest_key = min(stations.keys(), key=lambda k: haversine_m(lat, lon, stations[k]["lat"], stations[k]["lon"]))
    return nearest_key, stations[nearest_key]["rows"]

def compute_rain_features(lat, lon, event_date, event_rain24_fallback):
    """
    Compute rain_24h and rain_3h for a road centroid on a given event date.
    """
    date_rows = rain_by_date.get(event_date, [])
    if date_rows:
        _, station_rows = get_nearest_rain_station(lat, lon, date_rows)
        if station_rows:
            station_rows_sorted = sorted(station_rows, key=lambda r: r["hour"])
            rain_24h = round(sum(r["mm"] for r in station_rows_sorted), 2)
            vals = [r["mm"] for r in station_rows_sorted]
            rain_3h = max((sum(vals[i:i+3]) for i in range(len(vals)-2)), default=0.0)
            return round(rain_3h, 2), rain_24h

    # Fallback: spatially interpolate from nearest flood event for this date
    date_floods = floods_by_date.get(event_date, [])
    if date_floods:
        dists = [(haversine_m(lat, lon, f["lat"], f["lon"]), f) for f in date_floods]
        dists.sort(key=lambda x: x[0])
        nearest_dist, nearest_flood = dists[0]
        rain_24h = nearest_flood["rain24"]
        rain_3h = round(rain_24h * 0.35, 2)
        return rain_3h, rain_24h

    return 0.0, event_rain24_fallback

DATA_LIMITED_EVENTS = {"2022-12-09"}

EVENT_RADIUS_M = {
    "2015-12-01": 1000.0,
    "2016-12-12": 900.0,
    "2020-11-25": 900.0,
    "2021-11-07": 900.0,
    "2023-12-04": 900.0,
}

def is_flood_target(lat, lon, event_date):
    """Return 1 if this road was within scaled flood radius on event_date, else 0."""
    radius_m = EVENT_RADIUS_M.get(event_date, FLOOD_TARGET_RADIUS_M)
    date_floods = floods_by_date.get(event_date, [])
    for f in date_floods:
        if haversine_m(lat, lon, f["lat"], f["lon"]) <= radius_m:
            return 1
    return 0

# ---------------------------------------------------------------------------
# 6. BUILD FINAL FEATURE TABLE
# ---------------------------------------------------------------------------
print("[6/7] Building enriched road × event feature table...")

headers = [
    "road_id", "osm_way_id", "edge_id", "start_node_id", "end_node_id", "node_degree", "length_m",
    "event_date", "event_name",
    "rain_3h", "rain_24h",
    "elevation", "slope", "hand", "dist_to_drain_m",
    "flow_accumulation", "catchment_km2", "twi", "drainage_density",
    "dist_to_water_body_m", "nearest_water_body_name", "nearest_water_body_type",
    "built_up", "flood_history", "target", "data_limited",
    "road_name", "highway_type", "lat", "lon", "geometry"
]

rows = []

event_meta = {}
for r in flood_rows:
    d = r["event_date"]
    if d not in event_meta:
        event_meta[d] = {
            "event_name": r["event_name"],
            "rain24_fallback": float(r["rainfall_24h_mm"] or 0)
        }

t1 = time.time()
for di, event_date in enumerate(all_event_dates):
    event_name = event_meta.get(event_date, {}).get("event_name", "Unknown Event")
    rain24_fb = event_meta.get(event_date, {}).get("rain24_fallback", 0.0)
    date_target_count = 0

    for road in clean_roads:
        rid = road["road_id"]
        lat, lon = road["lat"], road["lon"]
        sp = road_spatial[rid]

        rain_3h, rain_24h = compute_rain_features(lat, lon, event_date, rain24_fb)
        target = is_flood_target(lat, lon, event_date)
        data_lim = 1 if event_date in DATA_LIMITED_EVENTS else 0
        if target == 1:
            date_target_count += 1

        geometry = f"POINT ({lon:.6f} {lat:.6f})"

        rows.append([
            rid, road["osm_id"], road["edge_id"], road["start_node_id"], road["end_node_id"],
            road["node_degree"], road["length_m"],
            event_date, event_name,
            rain_3h, rain_24h,
            sp["elevation"], sp["slope"], sp["hand"], sp["dist_to_drain_m"],
            sp["flow_accumulation"], sp["catchment_km2"], sp["twi"], sp["drainage_density"],
            sp["dist_to_water_body_m"], sp["nearest_water_body_name"], sp["nearest_water_body_type"],
            sp["built_up"], sp["flood_history"], target, data_lim,
            road["name"], road["highway"], lat, lon, geometry
        ])

    print(f"  [{di+1}/{len(all_event_dates)}] {event_date} | {event_name} | flood targets: {date_target_count}/{len(clean_roads)}")

print(f"  Total rows generated: {len(rows)} in {time.time()-t1:.1f}s")

# ---------------------------------------------------------------------------
# 7. WRITE OUTPUT & PRINT SUMMARY STATS
# ---------------------------------------------------------------------------
print("[7/7] Writing output CSV...")

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

file_kb = os.path.getsize(OUTPUT_CSV) / 1024.0
print(f"\nOutput written: {OUTPUT_CSV}")
print(f"  Total rows    : {len(rows):,}")
print(f"  File size     : {file_kb:.1f} KB")

targets_1 = sum(1 for r in rows if r[24] == 1)
targets_0 = sum(1 for r in rows if r[24] == 0)
print(f"  Target=1 (flooded road×event pairs) : {targets_1:,}")
print(f"  Target=0 (safe road×event pairs)    : {targets_0:,}")
print(f"  Class ratio (flood:safe)             : 1:{targets_0/max(targets_1,1):.1f}")

# Print first 3 rows
print("\nSample row headers and values:")
for h, v in zip(headers, rows[0]):
    print(f"  {h:<25}: {v}")
