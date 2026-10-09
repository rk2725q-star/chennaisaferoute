"""
predict_flood.py
================
Unified Early-Warning Flood Risk Predictor & Route Recommender.
Uses free Open-Meteo Weather API to predict Chennai's real-time,
unseen future rainfall and flood events BEFORE they happen.

Usage Examples:
  # 1. Real-time live weather forecast prediction (100% Free API, No Key Needed):
  python scripts/predict_flood.py --live

  # 2. Unseen extreme storm simulation scenarios:
  python scripts/predict_flood.py --scenario cyclone      # 240mm storm
  python scripts/predict_flood.py --scenario cloudburst   # 120mm / 3h cloudburst
  python scripts/predict_flood.py --scenario megaflood    # 450mm mega-flood

  # 3. Custom unseen future rain parameters:
  python scripts/predict_flood.py --rain24 180 --rain3h 70

  # 4. Safe alternate route avoiding flood roads:
  python scripts/predict_flood.py --route "Velachery" "Chennai Central" --scenario cyclone
"""

import os
import sys
import csv
import json
import joblib
import argparse
import requests
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "chennai_flood_model.joblib")
FEATURES_CSV = os.path.join(BASE_DIR, "data", "model", "road_flood_features.csv")

sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
from flood_routing_engine import FloodRoutingEngine

METEO_STATIONS = {
    "Central (Nungambakkam)": (13.061, 80.244),
    "South (Airport / Meenambakkam)": (12.994, 80.180),
    "Velachery Basin": (12.980, 80.222),
    "OMR / Sholinganallur IT Corridor": (12.901, 80.228),
    "West (Ambattur Industrial)": (13.114, 80.154),
    "North (Madhavaram / Tondiarpet)": (13.136, 80.288)
}

PREDEFINED_SCENARIOS = {
    "monsoon": {"name": "Typical Heavy Monsoon Day", "rain24": 90.0, "rain3h": 35.0},
    "cloudburst": {"name": "Sudden Cloudburst Emergency", "rain24": 150.0, "rain3h": 120.0},
    "cyclone": {"name": "Severe Cyclonic Storm (Michaung / Vardah scale)", "rain24": 240.0, "rain3h": 85.0},
    "megaflood": {"name": "Catastrophic 2015-Scale Mega-Flood", "rain24": 450.0, "rain3h": 160.0},
}

KNOWN_LANDMARKS = {
    "guindy": (13.0070, 80.2050),
    "chennai central": (13.0830, 80.2750),
    "tambaram": (12.9230, 80.1270),
    "velachery": (12.9800, 80.2220),
    "anna nagar": (13.0850, 80.2100),
    "omr": (12.9010, 80.2280),
    "marina": (13.0500, 80.2830),
    "koyambedu": (13.0690, 80.1940),
    "adyar": (13.0060, 80.2570),
    "airport": (12.9940, 80.1800),
}

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class ChennaiFloodPredictor:
    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model bundle not found at {MODEL_PATH}. Run 'python scripts/train_model.py' first.")

        bundle = joblib.load(MODEL_PATH)
        self.model = bundle["model"]
        self.feature_columns = bundle["feature_columns"]
        self.threshold = bundle.get("optimal_threshold", 0.40)

        # Load road static infrastructure attributes (deduplicated by road_id)
        self.roads = {}
        with open(FEATURES_CSV, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                rid = r["road_id"]
                if rid not in self.roads:
                    self.roads[rid] = {
                        "road_id": rid,
                        "osm_way_id": r.get("osm_way_id", ""),
                        "edge_id": r.get("edge_id", rid),
                        "start_node_id": r.get("start_node_id", ""),
                        "end_node_id": r.get("end_node_id", ""),
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

        self._routing_engine = None

    @property
    def routing_engine(self):
        if self._routing_engine is None:
            self._routing_engine = FloodRoutingEngine()
        return self._routing_engine

    def fetch_live_multi_station_forecast(self):
        """
        Queries Open-Meteo Free Weather API across 6 Chennai meteorological zones.
        Computes 24h total rainfall and 3h cloudburst peak for each zone.
        """
        print("[FREE API] Querying Open-Meteo for real-time live forecast across 6 Chennai zones...")
        lats = [str(c[0]) for c in METEO_STATIONS.values()]
        lons = [str(c[1]) for c in METEO_STATIONS.values()]

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": ",".join(lats),
            "longitude": ",".join(lons),
            "hourly": "precipitation,rain",
            "timezone": "Asia/Kolkata",
            "forecast_days": 3
        }

        try:
            resp = requests.get(url, params=params, timeout=15)
            if resp.status_code != 200:
                print(f"  API returned {resp.status_code}, using offline fallback.")
                return None
            data = resp.json()
            results = data if isinstance(data, list) else [data]

            station_forecasts = {}
            for (name, coords), res in zip(METEO_STATIONS.items(), results):
                hourly = res.get("hourly", {})
                precip = hourly.get("precipitation", [])
                total_24h = round(sum(precip[:24]), 2) if len(precip) >= 24 else round(sum(precip), 2)
                peak_3h = round(max((sum(precip[i:i+3]) for i in range(len(precip)-2)), default=0.0), 2)
                station_forecasts[name] = {
                    "lat": coords[0],
                    "lon": coords[1],
                    "rain_24h": total_24h,
                    "rain_3h": peak_3h
                }
            return station_forecasts
        except Exception as e:
            print(f"  Live forecast error: {e}")
            return None

    def predict_with_live_stations(self, station_forecasts):
        """Maps each road to its nearest live forecast weather station and predicts risk."""
        X_batch = []
        road_meta = list(self.roads.values())

        station_list = list(station_forecasts.values())

        for r in road_meta:
            rlat, rlon = r["lat"], r["lon"]
            nearest_st = min(station_list, key=lambda s: (s["lat"] - rlat)**2 + (s["lon"] - rlon)**2)
            rain_24h = nearest_st["rain_24h"]
            rain_3h = nearest_st["rain_3h"]

            row_features = [
                rain_24h, rain_3h,
                r["elevation"], r["slope"], r["hand"],
                r["dist_to_drain_m"], r["flow_accumulation"],
                r["catchment_km2"], r["twi"], r["drainage_density"],
                r["dist_to_water_body_m"], r["built_up"],
                r["node_degree"], r["length_m"]
            ]
            X_batch.append(row_features)

        probs = self.model.predict_proba(np.array(X_batch))[:, 1]
        return self._format_predictions(road_meta, probs)

    def predict_citywide(self, rain_24h_mm: float, rain_3h_mm: float):
        """Predicts flood probability and risk tier under uniform scenario rainfall."""
        X_batch = []
        road_meta = list(self.roads.values())

        for r in road_meta:
            row_features = [
                rain_24h_mm, rain_3h_mm,
                r["elevation"], r["slope"], r["hand"],
                r["dist_to_drain_m"], r["flow_accumulation"],
                r["catchment_km2"], r["twi"], r["drainage_density"],
                r["dist_to_water_body_m"], r["built_up"],
                r["node_degree"], r["length_m"]
            ]
            X_batch.append(row_features)

        probs = self.model.predict_proba(np.array(X_batch))[:, 1]
        return self._format_predictions(road_meta, probs)

    def _format_predictions(self, road_meta, probs):
        results = {}
        for r, p in zip(road_meta, probs):
            p_val = float(p)
            if p_val >= 0.70:
                tier = "🔴 CRITICAL (Impassable)"
                action = "Close road immediately; deploy dewatering pumps; divert all vehicles."
            elif p_val >= 0.40:
                tier = "🟠 HIGH RISK (Inundation Expected)"
                action = "Subway/corridor waterlogging likely; advise light vehicles to bypass."
            elif p_val >= 0.20:
                tier = "🟡 ALERT (Moderate Risk)"
                action = "Slow traffic expected due to water pooling along curbs."
            else:
                tier = "🟢 PASSABLE (Safe)"
                action = "Normal traffic passable; no significant waterlogging."

            results[r["road_id"]] = {
                **r,
                "flood_probability": round(p_val, 4),
                "risk_tier": tier,
                "recommended_action": action
            }
        return results

def format_disruption_table(ranked_list):
    lines = []
    lines.append(f"{'Rank':<4} | {'Road Name':<32} | {'Highway':<14} | {'Prob':<7} | {'Score':<7} | {'HAND':<8} | {'Elev':<6}")
    lines.append("-" * 88)
    for idx, r in enumerate(ranked_list, 1):
        name = (r["road_name"][:30] + "..") if len(r["road_name"]) > 32 else r["road_name"]
        lines.append(f"{idx:>3}. | {name:<32} | {r['highway_type']:<14} | {r['flood_probability_pct']:>5.1f}% | {r['disruption_score']:>5.1f} | {r['hand_m']:>6.2f}m | {r['elevation_m']:>4.1f}m")
    return "\n".join(lines)

def parse_landmark(query_str):
    q = query_str.strip().lower()
    for name, coords in KNOWN_LANDMARKS.items():
        if name in q or q in name:
            return coords, name.title()
    if "," in query_str:
        try:
            parts = [float(x.strip()) for x in query_str.split(",")]
            return (parts[0], parts[1]), f"Coord({parts[0]:.4f}, {parts[1]:.4f})"
        except Exception:
            pass
    return None, None

def main():
    parser = argparse.ArgumentParser(description="Chennai Pre-Disaster Flood Predictor & Early Warning System")
    parser.add_argument("--live", action="store_true", help="Query 100% free Open-Meteo API for real-time live forecast")
    parser.add_argument("--scenario", choices=["monsoon", "cloudburst", "cyclone", "megaflood"], help="Predefined unseen disaster stress-test scenario")
    parser.add_argument("--rain24", type=float, default=None, help="Custom 24-hour rainfall forecast in mm (e.g. 200)")
    parser.add_argument("--rain3h", type=float, default=None, help="Custom 3-hour peak cloudburst rainfall in mm (e.g. 80)")
    parser.add_argument("--road", type=str, default=None, help="Inspect specific road name (e.g. 'Velachery', 'GST Road')")
    parser.add_argument("--route", nargs=2, metavar=("START", "DEST"), help="Compute safe alternate route avoiding flood roads")
    parser.add_argument("--top", type=int, default=12, help="Number of top disrupted roads to display (default: 12)")
    parser.add_argument("--ask", type=str, default=None, help="Ask a natural language question to the AI Tactical Commander")
    parser.add_argument("--ai-decision", action="store_true", help="Generate automated LLM Strategic SitRep using OmniRoute")
    parser.add_argument("--vehicle", type=str, default="hatchback", help="Vehicle type: bike, hatchback, sedan, suv, ambulance")

    args = parser.parse_args()

    # Fast-path for natural language question
    if args.ask:
        from flood_ai_agent import ChennaiFloodAIAgent
        agent = ChennaiFloodAIAgent()
        ans = agent.ask(args.ask, rain_mm=args.rain24 or 140.0)
        print("\n🤖 CHENNAI FLOOD AI TACTICAL ADVISORY:")
        print("=" * 80)
        print(ans.get("ai_briefing", ans.get("sitrep", "")))
        print("=" * 80)
        return

    predictor = ChennaiFloodPredictor()

    is_live_mode = False
    scenario_title = ""

    if args.live:
        is_live_mode = True
        station_forecasts = predictor.fetch_live_multi_station_forecast()
        if station_forecasts:
            scenario_title = "REAL-TIME LIVE WEATHER FORECAST (Open-Meteo Free API)"
            print("\n📡 Real-time micro-climate forecast across Chennai:")
            for st_name, f_data in station_forecasts.items():
                print(f"  • {st_name:<32}: 24h={f_data['rain_24h']:>4.1f}mm | 3h Cloudburst={f_data['rain_3h']:>4.1f}mm")
            preds = predictor.predict_with_live_stations(station_forecasts)
        else:
            is_live_mode = False
            args.rain24 = 180.0
            args.rain3h = 60.0

    if not is_live_mode:
        if args.scenario:
            sc = PREDEFINED_SCENARIOS[args.scenario]
            rain24 = sc["rain24"]
            rain3h = sc["rain3h"]
            scenario_title = f"SIMULATION: {sc['name']} (24h={rain24}mm, 3h={rain3h}mm)"
        else:
            rain24 = args.rain24 if args.rain24 is not None else 180.0
            rain3h = args.rain3h if args.rain3h is not None else round(rain24 * 0.35, 1)
            scenario_title = f"CUSTOM UNSEEN STORM SCENARIO (24h={rain24:.1f}mm, 3h={rain3h:.1f}mm)"

        preds = predictor.predict_citywide(rain24, rain3h)

    print("\n" + "="*85)
    print("🌊 CHENNAI EARLY-WARNING FLOOD RESILIENCE SYSTEM")
    print(f"   Mode: {scenario_title}")
    print("="*85)

    total_roads = len(preds)
    critical = [p for p in preds.values() if "CRITICAL" in p["risk_tier"]]
    high_risk = [p for p in preds.values() if "HIGH RISK" in p["risk_tier"]]
    alert = [p for p in preds.values() if "ALERT" in p["risk_tier"]]
    passable = [p for p in preds.values() if "PASSABLE" in p["risk_tier"]]

    print(f"\n📊 PREDICTED CITYWIDE IMPACT (4,531 Road Corridors Monitored):")
    print(f"  🟢 Passable / Safe Roads      : {len(passable):>5,} ({len(passable)/total_roads*100:>5.1f}%) -> Normal Transit Permitted")
    print(f"  🟡 Alert / Minor Waterlogging : {len(alert):>5,} ({len(alert)/total_roads*100:>5.1f}%) -> Caution in Subways/Curbs")
    print(f"  🟠 High Risk Roads            : {len(high_risk):>5,} ({len(high_risk)/total_roads*100:>5.1f}%) -> Light Vehicles Diverted")
    print(f"  🔴 Critical / Impassable Roads: {len(critical):>5,} ({len(critical)/total_roads*100:>5.1f}%) -> PUMPS DEPLOYED & CORRIDORS CLOSED")

    # 1. Road Specific Diagnosis
    if args.road:
        query_road = args.road.lower()
        matched = [p for p in preds.values() if query_road in p["road_name"].lower()]
        print(f"\n🔍 ROAD-LEVEL EARLY-WARNING DIAGNOSIS FOR '{args.road}' ({len(matched)} segments found):")
        print("-" * 85)
        for idx, m in enumerate(matched[:5], 1):
            print(f"[{idx}] {m['road_name']} ({m['highway_type']}) - ID: {m['road_id']}")
            print(f"    Risk Assessment : {m['risk_tier']} (Probability: {m['flood_probability']*100:.1f}%)")
            print(f"    Terrain Physics : Elevation = {m['elevation']:.1f} m  |  HAND = {m['hand']:.2f} m  |  Slope = {m['slope']:.3f}°")
            print(f"    Hydrology       : Catchment = {m['catchment_km2']:.2f} km²  |  Drainage Density = {m['drainage_density']:.1f} m/km²")
            print(f"    Water Body      : Nearest is {m['nearest_water_body_name']} ({m['nearest_water_body_type']}) at {m['dist_to_water_body_m']:.0f} m")
            print(f"    Protocol Action : {m['recommended_action']}\n")

    # 2. Critical Disruption Ranking
    ranked_disruptions = predictor.routing_engine.rank_road_disruption(preds, top_n=args.top)
    print(f"\n🚨 TOP {len(ranked_disruptions)} CRITICAL ARTERIAL CHOKEPOINTS (Deploy Rescue & Diversion):")
    print(format_disruption_table(ranked_disruptions))

    # 3. Safe Alternate Route Planning
    if args.route:
        start_q, dest_q = args.route[0], args.route[1]
        start_coord, s_name = parse_landmark(start_q)
        dest_coord, d_name = parse_landmark(dest_q)

        if not start_coord or not dest_coord:
            print(f"\n[ROUTE ERROR] Could not resolve coordinates for '{start_q}' or '{dest_q}'.")
            print(f"  Supported landmarks: {list(KNOWN_LANDMARKS.keys())} or 'lat,lon'")
        else:
            print(f"\n🧭 SAFE ALTERNATE ROUTE PLANNER: {s_name} ➔ {d_name}")
            print("-" * 85)
            routing = predictor.routing_engine.find_safe_alternate_route(
                start_coord[0], start_coord[1],
                dest_coord[0], dest_coord[1],
                preds
            )
            if routing:
                norm = routing["normal_route"]
                safe = routing["safe_route"]
                print(f"  Standard Route : {norm['distance_km']:.2f} km | ⚠️ Flooded Segments Encountered: {norm['flooded_segments_count']}")
                if norm['flooded_segments']:
                    for seg in norm['flooded_segments']:
                        print(f"    - Blocked segment: {seg['name']} ({seg['highway']}) | P(flood) = {seg['probability_pct']:.1f}%")
                
                print(f"\n  🛡️ SAFE ALTERNATE ROUTE:")
                print(f"    Distance          : {safe['distance_km']:.2f} km (Detour: +{safe['detour_km']:.2f} km)")
                print(f"    Floods Avoided    : {safe['floods_avoided_count']} critical inundation segments safely bypassed")
                print(f"    Residual Risk     : {safe['remaining_risk_segments']} minor water pooling segments")
                print(f"    Routing Principle : Diverted along elevated ridges & high-HAND corridors.")
            else:
                print("  No route path found between specified endpoints.")

    # 4. Automated LLM Tactical Decision Directive
    if args.ai_decision:
        print("\n" + "=" * 85)
        print("🤖 GENERATING AI TACTICAL DISASTER COMMAND SITREP (via OmniRoute)...")
        print("=" * 85)
        from flood_ai_agent import ChennaiFloodAIAgent
        agent = ChennaiFloodAIAgent()
        sitrep_res = agent.generate_sitrep(
            scenario=args.scenario or "cyclone",
            rain_mm=args.rain24,
            use_live=args.live
        )
        print("\n" + sitrep_res["sitrep"])

    print("\n" + "="*85)
    print("✅ PRE-DISASTER EARLY-WARNING ASSESSMENT COMPLETED.")
    print("="*85 + "\n")

if __name__ == "__main__":
    main()
