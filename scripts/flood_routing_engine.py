"""
flood_routing_engine.py
=======================
Topological Disruption Ranking & Safe Alternate Route Planning Engine.
Uses:
  - Snapped topological road network graph from chennai_roads.geojson
  - Predicted flood probabilities per road segment

Provides:
  1. rank_road_disruption(): Prioritizes citywide emergency arterial chokepoints
  2. find_safe_alternate_route(): Calculates flood-bypassing safe alternate routes via Dijkstra
"""

import os
import sys
import json
import csv
import math
import networkx as nx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ROADS_GEOJSON = os.path.join(BASE_DIR, "data", "roads", "chennai_roads.geojson")

HIGHWAY_WEIGHTS = {
    "motorway": 5.0,
    "trunk": 5.0,
    "primary": 4.0,
    "secondary": 3.0,
    "tertiary": 2.0,
    "primary_link": 2.5,
    "secondary_link": 2.0,
    "unclassified": 1.0,
}

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class FloodRoutingEngine:
    def __init__(self):
        print("[ROUTING] Initializing Road Network Graph from road network geometry...")
        self.G = nx.Graph()
        self.roads_list = []
        self.edge_to_road = {}

        with open(ROADS_GEOJSON, encoding="utf-8") as f:
            features = json.load(f)["features"]

        for feat in features:
            props = feat["properties"]
            coords = feat["geometry"]["coordinates"]
            if len(coords) < 2:
                continue

            rid = feat["id"]
            osm_id = str(props.get("osm_id", ""))
            name = props.get("name", "Unnamed Road")
            highway = props.get("highway", "unclassified")
            length_m = float(props.get("length_m", 100.0))

            # Snap endpoints to ~10m grid (4 decimal places in degrees)
            u = (round(coords[0][0], 4), round(coords[0][1], 4))
            v = (round(coords[-1][0], 4), round(coords[-1][1], 4))

            if u == v:
                continue

            self.G.add_edge(u, v, road_id=rid, osm_id=osm_id, name=name, highway=highway, length_m=length_m, coords=coords)
            self.edge_to_road[(u, v)] = rid
            self.edge_to_road[(v, u)] = rid

            self.roads_list.append({
                "road_id": rid,
                "osm_id": osm_id,
                "name": name,
                "highway": highway,
                "u": u,
                "v": v,
                "length_m": length_m
            })

        # Identify largest connected component for routing
        comps = sorted(nx.connected_components(self.G), key=len, reverse=True)
        self.main_component = comps[0] if comps else set()
        print(f"[ROUTING] Road network graph loaded: {self.G.number_of_nodes():,} topological junctions, {self.G.number_of_edges():,} road corridors (main component: {len(self.main_component):,} junctions).")

    def find_nearest_node(self, lat, lon):
        """Find closest node on the main connected component to given coordinates."""
        best_d = 1e9
        best_node = None
        for (nlon, nlat) in self.main_component:
            d = (nlat - lat)**2 + (nlon - lon)**2
            if d < best_d:
                best_d = d
                best_node = (nlon, nlat)
        return best_node

    def rank_road_disruption(self, predictions_dict, top_n=25):
        """
        Rank roads based on anticipated economic, traffic, and emergency disruption.
        disruption_score = P(flood) * Highway_Weight * Connectivity * Length_Factor
        """
        ranked = []
        for rid, pred in predictions_dict.items():
            prob = pred["flood_probability"]
            if prob < 0.20:
                continue

            hwy = pred.get("highway_type", "unclassified")
            weight = HIGHWAY_WEIGHTS.get(hwy, 1.0)
            deg = pred.get("node_degree", 2)
            length = pred.get("length_m", 250.0)

            length_factor = min(length / 250.0, 3.0)
            connectivity_factor = 1.0 + 0.1 * min(deg, 8)
            
            raw_score = prob * weight * connectivity_factor * length_factor * 12.0
            disruption_score = min(round(raw_score, 1), 100.0)

            if disruption_score >= 25.0:
                ranked.append({
                    "road_id": rid,
                    "road_name": pred.get("road_name", "Unnamed Road"),
                    "highway_type": hwy,
                    "flood_probability_pct": round(prob * 100, 1),
                    "disruption_score": disruption_score,
                    "hand_m": pred.get("hand", 0.0),
                    "elevation_m": pred.get("elevation", 0.0),
                    "risk_tier": pred.get("risk_tier", "High Risk"),
                    "lat": pred.get("lat"),
                    "lon": pred.get("lon")
                })

        ranked.sort(key=lambda x: x["disruption_score"], reverse=True)
        return ranked[:top_n]

    def find_safe_alternate_route(self, start_lat, start_lon, end_lat, end_lon, predictions_dict):
        """
        Calculates:
          1. Normal Shortest Route (standard shortest distance path)
          2. Safe Alternate Route (penalizing high-risk flood roads via Dijkstra)
        """
        start_node = self.find_nearest_node(start_lat, start_lon)
        end_node = self.find_nearest_node(end_lat, end_lon)

        if not start_node or not end_node or start_node == end_node:
            return None

        # Helper risk lookup
        def get_edge_prob(u, v):
            rid = self.edge_to_road.get((u, v)) or self.edge_to_road.get((v, u))
            if rid and rid in predictions_dict:
                return predictions_dict[rid]["flood_probability"]
            return 0.0

        # 1. Normal Shortest Route
        try:
            normal_path = nx.shortest_path(self.G, start_node, end_node, weight="length_m")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            normal_path = []

        # 2. Assign flood penalty weights for Safe Route
        # Weight(e) = length * (1 + 100 * P(flood)^2)
        # If road has P(flood) >= 0.70, traversal cost increases by > 50x
        for u, v, data in self.G.edges(data=True):
            p_flood = get_edge_prob(u, v)
            base_len = data.get("length_m", 100.0)
            penalty_multiplier = 1.0 + 100.0 * (p_flood ** 2)
            data["safe_weight"] = base_len * penalty_multiplier

        try:
            safe_path = nx.shortest_path(self.G, start_node, end_node, weight="safe_weight")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            safe_path = normal_path

        def extract_route_details(node_seq):
            if not node_seq or len(node_seq) < 2:
                return 0.0, [], []

            total_km = 0.0
            coords = []
            flooded_segments = []

            for i in range(len(node_seq) - 1):
                u_curr = node_seq[i]
                v_curr = node_seq[i + 1]
                edge_data = self.G[u_curr][v_curr]
                length = edge_data.get("length_m", 100.0)
                total_km += length / 1000.0
                prob = get_edge_prob(u_curr, v_curr)

                coords.append([u_curr[0], u_curr[1]])

                if prob >= 0.40:
                    flooded_segments.append({
                        "name": edge_data.get("name", "Unnamed Road"),
                        "highway": edge_data.get("highway", "unclassified"),
                        "probability_pct": round(prob * 100, 1),
                        "coord": [u_curr[1], u_curr[0]]
                    })

            coords.append([node_seq[-1][0], node_seq[-1][1]])
            return round(total_km, 2), coords, flooded_segments

        norm_km, norm_coords, norm_floods = extract_route_details(normal_path)
        safe_km, safe_coords, safe_floods = extract_route_details(safe_path)

        detour_km = round(max(0.0, safe_km - norm_km), 2)
        floods_avoided = max(0, len(norm_floods) - len(safe_floods))

        return {
            "start": {"lat": start_lat, "lon": start_lon},
            "destination": {"lat": end_lat, "lon": end_lon},
            "normal_route": {
                "distance_km": norm_km,
                "flooded_segments_count": len(norm_floods),
                "flooded_segments": norm_floods[:6],
                "coordinates": norm_coords
            },
            "safe_route": {
                "distance_km": safe_km,
                "detour_km": detour_km,
                "floods_avoided_count": floods_avoided,
                "remaining_risk_segments": len(safe_floods),
                "coordinates": safe_coords
            }
        }
