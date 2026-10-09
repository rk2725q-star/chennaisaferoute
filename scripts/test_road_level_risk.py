"""
test_road_level_risk.py
=======================
Generates comprehensive Road-Level Flood Risk & Vulnerability Tests for Chennai.
Tests 4,531 road segments across 4 rainfall stress tiers:
  1. Light/Moderate Monsoon (50mm / 24h)
  2. Heavy Rain Warning (120mm / 24h)
  3. Severe Cyclonic Storm (240mm / 24h)
  4. Catastrophic Mega-Flood (400mm / 24h)

Computes for every road:
  - Flood Onset Threshold (Exact mm of rain where road transitions to Impassable)
  - Physical Failure Mechanism (Negative HAND, high TWI, or drainage shortfall)
  - Recommended Municipal Action (Pump deployment, light vehicle diversion, closure)

Outputs:
  - data/model/road_level_risk_test_report.csv
"""

import os
import sys
import csv
import json
import joblib
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "chennai_flood_model.joblib")
FEATURES_CSV = os.path.join(BASE_DIR, "data", "model", "road_flood_features.csv")
OUTPUT_REPORT_CSV = os.path.join(BASE_DIR, "data", "model", "road_level_risk_test_report.csv")

RAIN_TIERS = [
    ("50mm_Normal", 50.0, 18.0),
    ("120mm_Heavy", 120.0, 45.0),
    ("240mm_Cyclone", 240.0, 85.0),
    ("400mm_MegaFlood", 400.0, 150.0)
]

BENCHMARK_CORRIDORS = [
    "Velachery Main Road",
    "Grand Southern Trunk Road",
    "Rajiv Gandhi Salai",
    "Inner Ring Road",
    "Anna Salai",
    "Poonamallee High Road",
    "Pulianthope High Road",
    "D'Mellows Salai",
    "Kolathur Road",
    "Suryanarayana Street",
    "Haddows Road",
    "Sterling Road",
    "GNT Road",
    "Tank Bund Road",
    "Broadway Road"
]

def load_roads():
    roads = {}
    with open(FEATURES_CSV, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rid = r["road_id"]
            if rid not in roads:
                roads[rid] = {
                    "road_id": rid,
                    "osm_way_id": r.get("osm_way_id", ""),
                    "edge_id": r.get("edge_id", rid),
                    "road_name": r.get("road_name", "Unnamed Road"),
                    "highway_type": r.get("highway_type", "unclassified"),
                    "lat": float(r["lat"]),
                    "lon": float(r["lon"]),
                    "elevation": float(r["elevation"]),
                    "slope": float(r["slope"]),
                    "hand": float(r["hand"]),
                    "dist_to_drain_m": float(r["dist_to_drain_m"]),
                    "flow_accumulation": float(r["flow_accumulation"]),
                    "catchment_km2": float(r["catchment_km2"]),
                    "twi": float(r["twi"]),
                    "drainage_density": float(r["drainage_density"]),
                    "dist_to_water_body_m": float(r["dist_to_water_body_m"]),
                    "nearest_water_body_name": r.get("nearest_water_body_name", "None"),
                    "nearest_water_body_type": r.get("nearest_water_body_type", "None"),
                    "built_up": float(r.get("built_up", 10.0)),
                    "node_degree": float(r.get("node_degree", 2)),
                    "length_m": float(r.get("length_m", 250.0))
                }
    return list(roads.values())

def determine_cause(r):
    causes = []
    if r["hand"] < 0.0:
        causes.append(f"Sunken road sitting {abs(r['hand']):.1f}m below adjacent drainage level (Backwater overtopping)")
    elif r["hand"] < 1.0:
        causes.append(f"Critically low drainage relief (HAND={r['hand']:.2f}m)")
    
    if r["drainage_density"] < 200.0:
        causes.append("Severely deficient stormwater drain density (<200 m/km²)")
    
    if r["twi"] > 16.0:
        causes.append("High topographic wetness index (Natural runoff accumulation depression)")
    
    if r["dist_to_water_body_m"] < 300.0:
        causes.append(f"Proximity to {r['nearest_water_body_name']} ({r['nearest_water_body_type']}, {r['dist_to_water_body_m']:.0f}m away)")

    if not causes:
        if r["elevation"] < 8.0:
            causes.append(f"Low coastal elevation plain ({r['elevation']:.1f}m)")
        else:
            causes.append("Direct intense precipitation exceeding surface percolation capacity")

    return "; ".join(causes)

def determine_flood_onset(p_50, p_120, p_240, p_400):
    """Determines the critical rainfall onset bracket where road becomes impassable."""
    if p_50 >= 0.40:
        return "≤50 mm (Chronic Basin)"
    elif p_120 >= 0.40:
        return "50-120 mm (Cloudburst)"
    elif p_240 >= 0.40:
        return "120-240 mm (Severe Storm)"
    elif p_400 >= 0.40:
        return "240-400 mm (Mega-Flood)"
    else:
        return ">400 mm (High Ground)"

def run_road_risk_test():
    print("="*85)
    print("🚦 CHENNAI ROAD-LEVEL FLOOD RISK ASSESSMENT TEST SUITE")
    print("="*85)

    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return

    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    roads = load_roads()
    print(f"[DATA] Loaded {len(roads):,} unique road segments across Greater Chennai.")

    # 1. Batch Prediction across the 4 Rain Stress Tiers
    print("[TEST] Running risk predictions across 4 rainfall stress tiers (50mm to 400mm)...")
    
    tier_probs = {}
    for tier_name, rain24, rain3h in RAIN_TIERS:
        X_tier = []
        for r in roads:
            X_tier.append([
                rain24, rain3h, r["elevation"], r["slope"], r["hand"],
                r["dist_to_drain_m"], r["flow_accumulation"], r["catchment_km2"],
                r["twi"], r["drainage_density"], r["dist_to_water_body_m"],
                r["built_up"], r["node_degree"], r["length_m"]
            ])
        tier_probs[tier_name] = model.predict_proba(np.array(X_tier))[:, 1]

    # 2. Build Comprehensive Road Risk Report
    report_rows = []
    print("[ANALYSIS] Computing flood onset thresholds, failure mechanisms, and actions...")

    for i, r in enumerate(roads):
        p_50 = tier_probs["50mm_Normal"][i]
        p_120 = tier_probs["120mm_Heavy"][i]
        p_240 = tier_probs["240mm_Cyclone"][i]
        p_400 = tier_probs["400mm_MegaFlood"][i]

        # Cyclone status tier
        if p_240 >= 0.70:
            tier = "CRITICAL (Impassable)"
            action = "Close road corridor; deploy mobile pump units; redirect ambulances & emergency transit."
        elif p_240 >= 0.40:
            tier = "HIGH RISK (Severe Inundation)"
            action = "Waterlogging expected in subways/curbs; restrict light vehicles; advise high-clearance transit only."
        elif p_240 >= 0.20:
            tier = "ALERT (Moderate Pooling)"
            action = "Slow traffic advisory; clear curb inlets and storm drain grates."
        else:
            tier = "PASSABLE (Safe)"
            action = "Normal vehicular movement permitted; monitor drainage outflow."

        cause = determine_cause(r)
        onset = determine_flood_onset(p_50, p_120, p_240, p_400)

        report_rows.append({
            "road_id": r["road_id"],
            "road_name": r["road_name"],
            "highway_type": r["highway_type"],
            "length_m": r["length_m"],
            "elevation_m": r["elevation"],
            "hand_m": r["hand"],
            "slope_deg": r["slope"],
            "drainage_density": r["drainage_density"],
            "nearest_water_body": f"{r['nearest_water_body_name']} ({r['dist_to_water_body_m']:.0f}m)",
            "flood_onset_threshold": onset,
            "prob_50mm_pct": round(p_50 * 100, 1),
            "prob_120mm_pct": round(p_120 * 100, 1),
            "prob_240mm_pct": round(p_240 * 100, 1),
            "prob_400mm_pct": round(p_400 * 100, 1),
            "cyclone_risk_tier": tier,
            "physical_failure_cause": cause,
            "recommended_action": action,
            "lat": r["lat"],
            "lon": r["lon"]
        })

    # 3. Write Full CSV Report
    headers = [
        "road_id", "road_name", "highway_type", "length_m", "elevation_m", "hand_m", "slope_deg",
        "drainage_density", "nearest_water_body", "flood_onset_threshold",
        "prob_50mm_pct", "prob_120mm_pct", "prob_240mm_pct", "prob_400mm_pct",
        "cyclone_risk_tier", "physical_failure_cause", "recommended_action", "lat", "lon"
    ]
    with open(OUTPUT_REPORT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"\n[REPORT] Generated full road risk report -> {OUTPUT_REPORT_CSV} ({len(report_rows):,} road records)")

    # 4. Print Citywide Tier Statistics across the 4 Rain Levels
    print("\n" + "="*85)
    print("📊 SUMMARY: CITYWIDE ROAD PASSABILITY ACROSS 4 RAINFALL SCENARIOS")
    print("="*85)
    print(f"{'Rainfall Scenario':<22} | {'Passable (Safe)':<18} | {'Alert (Moderate)':<18} | {'High Risk':<14} | {'Critical (Blocked)':<18}")
    print("-" * 96)

    for tier_name, rain24, rain3h in RAIN_TIERS:
        probs = tier_probs[tier_name]
        c_pass = sum(1 for p in probs if p < 0.20)
        c_alert = sum(1 for p in probs if 0.20 <= p < 0.40)
        c_high = sum(1 for p in probs if 0.40 <= p < 0.70)
        c_crit = sum(1 for p in probs if p >= 0.70)
        total = len(probs)
        print(f"{tier_name:<22} | {c_pass:>5,} ({c_pass/total*100:>4.1f}%)       | {c_alert:>5,} ({c_alert/total*100:>4.1f}%)       | {c_high:>5,} ({c_high/total*100:>4.1f}%) | {c_crit:>5,} ({c_crit/total*100:>4.1f}%)")

    # 5. Display Benchmark Corridor Deep Dive Table
    print("\n" + "="*85)
    print("🔍 DEEP-DIVE TEST: MAJOR CHENNAI ARTERIAL CORRIDORS (CYCLONE 240mm SCENARIO)")
    print("="*85)
    print(f"{'Corridor Name':<28} | {'Type':<12} | {'Elev':<6} | {'HAND':<7} | {'Onset':<8} | {'P(240mm)':<8} | {'Risk Tier':<22}")
    print("-" * 96)

    shown_names = set()
    for b_name in BENCHMARK_CORRIDORS:
        matches = [r for r in report_rows if b_name.lower() in r["road_name"].lower()]
        if not matches:
            continue
        # Take the most vulnerable segment for this corridor
        worst = max(matches, key=lambda x: x["prob_240mm_pct"])
        if worst["road_name"] in shown_names:
            continue
        shown_names.add(worst["road_name"])

        p_str = f"{worst['prob_240mm_pct']:.1f}%"
        h_str = f"{worst['hand_m']:.2f}m"
        e_str = f"{worst['elevation_m']:.1f}m"
        print(f"{worst['road_name'][:28]:<28} | {worst['highway_type']:<12} | {e_str:<6} | {h_str:<7} | {worst['flood_onset_threshold']:<8} | {p_str:<8} | {worst['cyclone_risk_tier']:<22}")

    print("="*85 + "\n")

if __name__ == "__main__":
    run_road_risk_test()
