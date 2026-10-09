"""
flood_ai_agent.py
=================
Autonomous Tactical Decision Agent & AI Commander for Chennai Flood Management.

Sits on top of:
  - Physics ML Ensemble (chennai_flood_model.joblib)
  - Topological Road Graph Routing Engine (flood_routing_engine.py)
  - Live Weather Multi-Station API (Open-Meteo)
  - OmniRoute LLM Proxy (http://localhost:20128/v1)

Provides:
  1. Citizen Travel & Vehicle Safety Advisory (Bilingual: Tamil & English)
  2. Disaster Management EOC SitRep & Pump Allocation (NDRF, GCC, Police)
  3. Natural Language Question Answering & Interactive Terminal Copilot
"""

import os
import sys
import json
import argparse
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))

from omniroute_client import OmniRouteClient
from predict_flood import ChennaiFloodPredictor, KNOWN_LANDMARKS, PREDEFINED_SCENARIOS
from flood_routing_engine import FloodRoutingEngine

# Enhanced landmarks dictionary for natural language location resolution
CHENNAI_POINTS = {
    "velachery": (12.9800, 80.2220),
    "airport": (12.9940, 80.1800),
    "meenambakkam": (12.9940, 80.1800),
    "guindy": (13.0070, 80.2050),
    "kathipara": (13.0070, 80.2050),
    "chennai central": (13.0830, 80.2750),
    "central": (13.0830, 80.2750),
    "tambaram": (12.9230, 80.1270),
    "anna nagar": (13.0850, 80.2100),
    "omr": (12.9010, 80.2280),
    "sholinganallur": (12.9010, 80.2280),
    "thoraipakkam": (12.9400, 80.2350),
    "marina": (13.0500, 80.2830),
    "koyambedu": (13.0690, 80.1940),
    "adyar": (13.0060, 80.2570),
    "t nagar": (13.0418, 80.2341),
    "porur": (13.0382, 80.1565),
    "ambattur": (13.1140, 80.1540),
    "madhavaram": (13.1360, 80.2880),
    "egmore": (13.0784, 80.2612),
    "chromepet": (12.9516, 80.1462),
    "perambur": (13.1090, 80.2430),
    "medavakkam": (12.9180, 80.1920),
    "pallavaram": (12.9675, 80.1491),
    "saidapet": (13.0210, 80.2230),
    "mylapore": (13.0368, 80.2676),
    "thoraipakkam": (12.9416, 80.2362),
    "kelambakkam": (12.7873, 80.2215),
    "siruseri": (12.8250, 80.2200),
}

VEHICLE_THRESHOLDS = {
    "bike": {
        "name": "Two-Wheeler / Motorcycle",
        "clearance_mm": 140,
        "critical_prob": 0.35,
        "max_safe_water_cm": 15,
        "risk_desc": "Air filter / silencer ingress risk; loss of balance in moving floodwaters."
    },
    "hatchback": {
        "name": "Small Hatchback (Swift / i10 / Kwid)",
        "clearance_mm": 165,
        "critical_prob": 0.45,
        "max_safe_water_cm": 25,
        "risk_desc": "Low air intake causes catastrophic hydrostatic engine seizure; light weight leads to floating."
    },
    "sedan": {
        "name": "Midsize Sedan (City / Verna / Dzire)",
        "clearance_mm": 170,
        "critical_prob": 0.50,
        "max_safe_water_cm": 25,
        "risk_desc": "Long wheelbase prone to getting stuck; underbody sensor and electrical ECU short circuit."
    },
    "suv": {
        "name": "High-Rider SUV (Thar / Scorpio / Fortuner / Creta)",
        "clearance_mm": 210,
        "critical_prob": 0.70,
        "max_safe_water_cm": 45,
        "risk_desc": "Can wade up to bumper level, but hidden submerged open manholes and strong cross-currents remain dangerous."
    },
    "ambulance": {
        "name": "Emergency Medical Ambulance / Bus",
        "clearance_mm": 230,
        "critical_prob": 0.75,
        "max_safe_water_cm": 50,
        "risk_desc": "High clearance, but critical patient life-support transit requires avoiding all waterlogged bottlenecks."
    }
}


class ChennaiFloodAIAgent:
    def __init__(self, model_name=None):
        print("[AI AGENT] Initializing Chennai Flood AI Tactical Commander...")
        self.client = OmniRouteClient(default_model=model_name or "auto/smart")
        self.predictor = ChennaiFloodPredictor()
        self.router = FloodRoutingEngine()
        print("[AI AGENT] Physics Predictor & Routing Engine loaded successfully.")

    def resolve_coords(self, place_str):
        """Resolves natural language location string or 'lat,lon' coordinates."""
        if not place_str:
            return None
        place_str = str(place_str).strip().lower()

        # Check direct coordinate format e.g. "12.98,80.22"
        coord_match = re.match(r"^[-+]?([0-9]*\.[0-9]+|[0-9]+)\s*,\s*[-+]?([0-9]*\.[0-9]+|[0-9]+)$", place_str)
        if coord_match:
            return float(coord_match.group(1)), float(coord_match.group(2))

        # Check landmarks dictionary
        for name, coords in CHENNAI_POINTS.items():
            if name in place_str:
                return coords

        return None

    def advise_route(self, origin, destination, vehicle_type="hatchback", rain_mm=120.0, use_live=False):
        """
        Synthesizes a bilingual, vehicle-aware tactical route navigation advisory.
        """
        orig_coords = self.resolve_coords(origin)
        dest_coords = self.resolve_coords(destination)

        if not orig_coords or not dest_coords:
            return {
                "error": f"Could not resolve locations: origin '{origin}', destination '{destination}'. "
                         f"Please use standard landmarks like 'Velachery', 'Airport', 'Tambaram', 'Central', 'OMR'."
            }

        v_type = vehicle_type.lower() if vehicle_type else "hatchback"
        v_meta = VEHICLE_THRESHOLDS.get(v_type, VEHICLE_THRESHOLDS["hatchback"])

        # 1. Run flood predictions
        if use_live:
            print("[AI AGENT] Fetching live multi-station rainfall for route evaluation...")
            stations = self.predictor.fetch_live_multi_station_forecast()
            if stations:
                predictions = self.predictor.predict_with_live_stations(stations)
                weather_desc = "Real-time Live Open-Meteo Satellite/Radar Forecast"
            else:
                predictions = self.predictor.predict_citywide(rain_mm, rain_mm * 0.4)
                weather_desc = f"Simulated Rainfall: {rain_mm} mm in 24h"
        else:
            predictions = self.predictor.predict_citywide(rain_mm, rain_mm * 0.4)
            weather_desc = f"Simulated Rainfall: {rain_mm} mm in 24h"

        # 2. Compute normal vs safe alternate routes
        route_plan = self.router.find_safe_alternate_route(
            orig_coords[0], orig_coords[1],
            dest_coords[0], dest_coords[1],
            predictions
        )

        if not route_plan:
            return {"error": "No viable path found on topological road graph between the specified points."}

        # 3. Analyze route chokepoints
        norm = route_plan["normal_route"]
        safe = route_plan["safe_route"]
        detour_km = safe.get("detour_km", 0.0)
        floods_avoided = safe.get("floods_avoided_count", 0)
        diff = {"detour_km": detour_km, "floods_avoided": floods_avoided}

        flooded_chokepoints = norm.get("flooded_segments", [])
        flooded_chokepoints.sort(key=lambda x: x.get("probability_pct", 0), reverse=True)
        top_dangers = flooded_chokepoints[:4]

        # 4. Prepare structured context for LLM prompt
        prompt = f"""
You are the Chennai Flood Tactical AI Commander (சென்னை வெள்ள தந்திரோபாய ஆலோசகர்).
Analyze the following ground-truth physics metrics from our ML model and topological routing engine:

--- COMMUTE CONTEXT ---
Origin: {origin.title()} ({orig_coords})
Destination: {destination.title()} ({dest_coords})
Commuter Vehicle: {v_meta['name']} (Clearance: {v_meta['clearance_mm']}mm, Safe limit: ~{v_meta['max_safe_water_cm']}cm)
Weather Condition: {weather_desc}

--- TOPOLOGICAL ROUTING GROUND TRUTH ---
1. Shortest Normal Route:
   - Distance: {norm['distance_km']} km
   - Flooded Road Corridors: {norm['flooded_segments_count']} segments
   - Critical Inundated Chokepoints:
{json.dumps(top_dangers, indent=2)}

2. Safe Alternate Bypass Route:
   - Distance: {safe['distance_km']} km (Detour: +{detour_km} km)
   - Flooded Corridors Avoided: {floods_avoided} high-risk segments avoided
   - Remaining Risk Segments: {safe['remaining_risk_segments']} segments

--- INSTRUCTIONS ---
Deliver an authoritative, highly practical tactical travel briefing formatted with clear Markdown headings:
1. 🚨 Danger Level (1/5 to 5/5) & Vehicle Feasibility Verdict (Pass / Divert / Strictly Do Not Travel)
2. 🚗 Vehicle-Specific Risk Analysis (explain what will happen to {v_meta['name']} on the shortest route)
3. 🛣️ Tactical Route Directive (Explain why the shortest route is blocked and detail the recommended Safe Bypass)
4. 💧 Critical Waterlogged Hotspots (Name the specific roads/landmarks to avoid based on the chokepoints data)
5. 🗣️ தமிழ்ப் பிரிவு (Tamil Section): Complete, natural Chennai-Tamil translation of the advisory explaining safety precautions in local everyday Tamil.

Keep the advice crisp, direct, and life-saving.
"""
        system_prompt = (
            "You are the Chennai Disaster Management Authority Tactical AI Commander. "
            "You provide life-saving, data-backed travel advisories in English and Chennai Tamil."
        )

        print("[AI AGENT] Consulting LLM Tactical Brain via OmniRoute...")
        ai_briefing = self.client.chat_complete(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=900
        )

        # Fallback if LLM is offline
        if not ai_briefing:
            ai_briefing = self._generate_fallback_route_advisory(origin, destination, v_meta, norm, safe, diff, top_dangers)

        return {
            "origin": origin,
            "destination": destination,
            "vehicle": v_meta['name'],
            "weather": weather_desc,
            "route_comparison": diff,
            "normal_route": norm,
            "safe_route": safe,
            "top_chokepoints": top_dangers,
            "ai_briefing": ai_briefing
        }

    def generate_sitrep(self, scenario="cyclone", rain_mm=None, use_live=False):
        """
        Generates an Emergency Operations Centre (EOC) SitRep for GCC, NDRF, and Traffic Police.
        """
        if use_live:
            print("[AI AGENT] Fetching live multi-station rainfall for Emergency SitRep...")
            stations = self.predictor.fetch_live_multi_station_forecast()
            if stations:
                predictions = self.predictor.predict_with_live_stations(stations)
                scenario_name = "Real-Time Weather Live Multi-Station Forecast"
                rain_summary = f"Live feed across 6 zones (Peak 24h: {max(s['rain_24h'] for s in stations.values())}mm)"
            else:
                predictions = self.predictor.predict_citywide(220.0, 85.0)
                scenario_name = "Live Weather Offline Fallback (220mm)"
                rain_summary = "220mm in 24h"
        else:
            sc_info = PREDEFINED_SCENARIOS.get(scenario, PREDEFINED_SCENARIOS["cyclone"])
            r24 = rain_mm if rain_mm is not None else sc_info["rain24"]
            r3 = r24 * 0.4
            predictions = self.predictor.predict_citywide(r24, r3)
            scenario_name = sc_info["name"]
            rain_summary = f"{r24}mm / 24h (Peak 3h: {r3:.1f}mm)"

        # 1. Citywide aggregated disruption
        total_roads = len(predictions)
        high_risk_roads = [r for r in predictions.values() if r["flood_probability"] >= 0.65]
        extreme_risk_roads = [r for r in predictions.values() if r["flood_probability"] >= 0.80]

        km_submerged = sum(r.get("length_m", 100.0) for r in high_risk_roads) / 1000.0
        pct_submerged = (len(high_risk_roads) / total_roads) * 100.0

        # 2. Priority pump allocation locations (low HAND, high TWI, near water body)
        pump_candidates = []
        for pred in high_risk_roads:
            if pred.get("hand", 1.0) < 1.0:
                pump_candidates.append({
                    "road_name": pred.get("road_name", "Unnamed Corridor"),
                    "hand_m": pred.get("hand"),
                    "elevation_m": pred.get("elevation"),
                    "flood_prob_pct": round(pred["flood_probability"] * 100, 1),
                    "highway": pred.get("highway_type")
                })
        pump_candidates.sort(key=lambda x: (x["hand_m"], -x["flood_prob_pct"]))
        top_pump_spots = pump_candidates[:6]

        # 3. Arterial chokepoints ranking
        disruption_ranking = self.router.rank_road_disruption(predictions, top_n=8)

        # 4. Prompt LLM for Disaster Management SitRep
        prompt = f"""
You are the Emergency Operations Commander at the Greater Chennai Corporation (GCC) Disaster Management Cell.
Based on the following ground-truth physics model calculations, produce an actionable Executive Emergency SitRep:

--- DISASTER SITUATION METRICS ---
Event / Scenario: {scenario_name}
Rainfall Influx: {rain_summary}
Total Network Scope: {total_roads:,} road segments (1,204.86 km)
Severely Inundated Roads: {len(high_risk_roads):,} segments ({km_submerged:.1f} km submerged, {pct_submerged:.1f}% of city network)
Catastrophic Critical Inundation: {len(extreme_risk_roads):,} segments

--- TOP ARTERIAL TRAFFIC CORRIDORS AT IMMINENT COLLAPSE ---
{json.dumps(disruption_ranking, indent=2)}

--- RECOMMENDED PUMP ALLOCATION TARGETS (Lowest HAND Elevation) ---
{json.dumps(top_pump_spots, indent=2)}

--- REQUIRED SITREP STRUCTURE ---
1. 📋 SITUATION SUMMARY & THREAT LEVEL (Code Red / Amber)
2. 🚧 CRITICAL ROAD CORRIDORS & MANDATORY TRAFFIC DIVERSIONS (Arterial roads like GST, OMR, Inner Ring Rd, Velachery)
3. 🚜 MOTOR PUMP DEPLOYMENT DIRECTIVES (Specify where GCC must position 100HP and 50HP heavy suction de-watering pumps)
4. 🏥 EMERGENCY LIFELINE & HOSPITAL ACCESS CORRIDORS (Action to keep access clear to RGGGH, Apollo, MIOT, Stanley)
5. 🚤 NDRF / SDRF WATER RESCUE BOAT POSITIONING (Low-lying sub-catchments: Velachery, Madipakkam, Ambattur)
6. 🗣️ பொதுமக்களுக்கான தமிழ் எச்சரிக்கை அறிவிப்பு (Official Public Warning Notice in Tamil).
"""
        system_prompt = (
            "You are the Chief Disaster Response Strategist for Greater Chennai Corporation. "
            "Provide rigorous, actionable, military-grade operational directives."
        )

        print("[AI AGENT] Generating Strategic SitRep via OmniRoute...")
        sitrep_text = self.client.chat_complete(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=1000
        )

        if not sitrep_text:
            sitrep_text = self._generate_fallback_sitrep(scenario_name, km_submerged, len(high_risk_roads), disruption_ranking, top_pump_spots)

        return {
            "scenario": scenario_name,
            "rainfall": rain_summary,
            "km_submerged": km_submerged,
            "submerged_roads_count": len(high_risk_roads),
            "disruption_ranking": disruption_ranking,
            "pump_targets": top_pump_spots,
            "sitrep": sitrep_text
        }

    def ask(self, query, rain_mm=120.0):
        """Answers arbitrary user natural language questions with model context."""
        # Detect if query mentions locations
        detected_places = []
        for name in CHENNAI_POINTS:
            if name in query.lower():
                detected_places.append(name)

        # Detect vehicle
        detected_vehicle = "hatchback"
        for v in VEHICLE_THRESHOLDS:
            if v in query.lower():
                detected_vehicle = v
                break

        # If user asks for travel between two places, route it!
        if len(detected_places) >= 2:
            orig = detected_places[0]
            dest = detected_places[1]
            return self.advise_route(orig, dest, vehicle_type=detected_vehicle, rain_mm=rain_mm)

        # Otherwise answer general flood query
        prompt = f"""
You are the Chennai Flood Tactical AI Assistant.
A citizen or official asks: "{query}"

Context:
- Current City Flood Scenario: {rain_mm}mm rainfall in 24h.
- Chennai Flood Risk Model features 4,531 road corridors, Height Above Nearest Drainage (HAND), Topographic Wetness Index (TWI), and 1,213 water bodies.

Answer the query accurately, authoritatively, and concisely in both English and Chennai Tamil. Include practical safety advice.
"""
        ans = self.client.chat_complete(prompt, system_prompt="You are the Chennai Flood Tactical AI Assistant.", max_tokens=600)
        if not ans:
            ans = f"Chennai Flood Advisory for '{query}': Under {rain_mm}mm rainfall, low-elevation areas (Velachery, Mudichur, Madipakkam, Ambattur) experience severe waterlogging. Avoid driving low-ground clearance vehicles."
        return {"query": query, "ai_briefing": ans}

    def interactive_session(self):
        """Runs an interactive conversational copilot session in terminal."""
        print("\n" + "=" * 70)
        print("🌊 CHENNAI FLOOD TACTICAL AI COPILOT (சென்னை வெள்ள AI ஆலோசகர்)")
        print("Powered by Physics ML Ensemble + OmniRoute LLM (Port 20128)")
        print("Type 'exit' or 'quit' to end session.")
        print("=" * 70)

        while True:
            try:
                user_input = input("\n[Citizen/Officer Query] > ").strip()
                if not user_input or user_input.lower() in ("exit", "quit", "q"):
                    print("[AI AGENT] Exiting Copilot. Stay safe!")
                    break

                res = self.ask(user_input)
                if "ai_briefing" in res:
                    print("\n" + res["ai_briefing"])
                elif "sitrep" in res:
                    print("\n" + res["sitrep"])
                print("\n" + "-" * 70)
            except (KeyboardInterrupt, EOFError):
                break

    # ---------------- FALLBACK GENERATORS (WHEN OFFLINE) ----------------
    def _generate_fallback_route_advisory(self, orig, dest, v_meta, norm, safe, diff, top_dangers):
        top_road_str = ", ".join([d["road_name"] for d in top_dangers[:2]]) if top_dangers else "Major lowlands"
        return f"""
🚨 DANGER RATING: 4/5 (HIGH RISK / அதிக அபாயம்)
==================================================
Commute: {orig.title()} ➔ {dest.title()}
Vehicle: {v_meta['name']} (Clearance: {v_meta['clearance_mm']}mm)

--- ENGLISH ADVISORY ---
⚠️ Shortest Route ({norm['distance_km']} km) is DANGEROUS.
Average flood risk is {norm['avg_flood_prob_pct']}%. Key chokepoints: {top_road_str}.
{v_meta['name']} faces critical risk of engine water-lock and electrical stalling.
✅ RECOMMENDED ACTION: Take the Safe Alternate Bypass ({safe['distance_km']} km, +{diff['detour_km']} km detour).
This bypass reduces your flood hazard exposure by {diff['risk_reduction_pct']}%.

--- தமிழ்ப் பிரிவு ---
⚠️ நேரடி சாலை ({norm['distance_km']} கி.மீ) கடுமையான வெள்ள அபாயம் கொண்டது ({top_road_str}).
{v_meta['name']} காரின் எஞ்சினில் தண்ணீர் புகுந்து பாதியிலேயே பழுதாகி நிற்கும் ஆபத்து உள்ளது.
✅ பரிந்துரை: {safe['distance_km']} கி.மீ தூரமுள்ள மாற்றுப் பாதையை (Safe Alternate Route) பயன்படுத்தவும். இது {diff['risk_reduction_pct']}% வெள்ள ஆபத்தைக் குறைக்கும்.
==================================================
"""

    def _generate_fallback_sitrep(self, sc_name, km_sub, n_sub, ranking, pump_spots):
        return f"""
📋 GCC EMERGENCY OPERATIONS SITREP
Scenario: {sc_name}
Total Roads Inundated: {n_sub} corridors ({km_sub:.1f} km submerged)
Top Chokepoints: {', '.join([r['road_name'] for r in ranking[:3]])}
Recommended Dewatering Pump Targets: {', '.join([p['road_name'] for p in pump_spots[:3]])}
Action: Deploy 100HP pumps immediately and divert traffic to arterial flyovers.
"""


def main():
    parser = argparse.ArgumentParser(description="Chennai Flood Tactical AI Agent")
    parser.add_argument("--from", dest="origin", help="Origin landmark or lat,lon (e.g. Velachery)")
    parser.add_argument("--to", dest="destination", help="Destination landmark or lat,lon (e.g. Airport)")
    parser.add_argument("--vehicle", default="hatchback", help="Vehicle type: bike, hatchback, sedan, suv, ambulance")
    parser.add_argument("--rain", type=float, default=140.0, help="Rainfall amount in mm (default: 140)")
    parser.add_argument("--live", action="store_true", help="Fetch live Open-Meteo rainfall forecast")
    parser.add_argument("--sitrep", action="store_true", help="Generate Disaster Emergency Operations SitRep")
    parser.add_argument("--scenario", default="cyclone", help="Disaster scenario: monsoon, cloudburst, cyclone, megaflood")
    parser.add_argument("--ask", type=str, help="Natural language flood query")
    parser.add_argument("--interactive", action="store_true", help="Launch interactive chat copilot")

    args = parser.parse_args()
    agent = ChennaiFloodAIAgent()

    if args.interactive:
        agent.interactive_session()
    elif args.sitrep:
        res = agent.generate_sitrep(scenario=args.scenario, rain_mm=args.rain, use_live=args.live)
        print("\n" + res["sitrep"])
    elif args.origin and args.destination:
        res = agent.advise_route(args.origin, args.destination, vehicle_type=args.vehicle, rain_mm=args.rain, use_live=args.live)
        if "error" in res:
            print("[ERROR]", res["error"])
        else:
            print("\n" + res["ai_briefing"])
    elif args.ask:
        res = agent.ask(args.ask, rain_mm=args.rain)
        print("\n" + res.get("ai_briefing", res.get("sitrep", "")))
    else:
        # Default demo: Velachery to Airport under 180mm rain
        print("[DEMO] Running tactical route advisory: Velachery ➔ Airport (Hatchback, 180mm rain)...")
        res = agent.advise_route("Velachery", "Airport", vehicle_type="hatchback", rain_mm=180.0)
        print("\n" + res["ai_briefing"])


if __name__ == "__main__":
    main()
