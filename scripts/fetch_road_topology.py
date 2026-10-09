"""
fetch_road_topology.py
======================
Extracts Chennai's road network topology (road segments, road edges, road nodes)
from OpenStreetMap using Overpass API and NetworkX.
Produces:
  1. data/roads/chennai_road_nodes.geojson & .csv
  2. data/roads/chennai_road_edges.geojson & .csv
  3. Enriches data/roads/chennai_roads.geojson with start_node_id, end_node_id, edge_id
"""

import os
import sys
import json
import csv
import math
import time
import requests
import networkx as nx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ROADS_DIR = os.path.join(BASE_DIR, "data", "roads")
os.makedirs(ROADS_DIR, exist_ok=True)

NODES_GEOJSON = os.path.join(ROADS_DIR, "chennai_road_nodes.geojson")
NODES_CSV     = os.path.join(ROADS_DIR, "chennai_road_nodes.csv")
EDGES_GEOJSON = os.path.join(ROADS_DIR, "chennai_road_edges.geojson")
EDGES_CSV     = os.path.join(ROADS_DIR, "chennai_road_edges.csv")
ROADS_GEOJSON = os.path.join(ROADS_DIR, "chennai_roads.geojson")

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def calculate_linestring_length_m(coords):
    total = 0.0
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i+1]
        total += haversine_m(lat1, lon1, lat2, lon2)
    return round(total, 2)

def query_overpass(query_str, max_retries=3):
    headers = {
        "User-Agent": "ChennaiRoadTopology/1.0 (manit.research@chennai.edu)",
        "Accept": "application/json"
    }
    for attempt in range(max_retries):
        for endpoint in OVERPASS_MIRRORS:
            try:
                print(f"  -> Querying Overpass mirror ({endpoint})...")
                resp = requests.post(endpoint, data={"data": query_str}, headers=headers, timeout=90)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code in (429, 500, 502, 504):
                    print(f"    Mirror returned {resp.status_code}, trying next...")
            except Exception as e:
                print(f"    Mirror error: {e}")
            time.sleep(1)
        time.sleep(3)
    return None

def fetch_and_build_topology():
    print("[ROAD_TOPOLOGY] Fetching road ways and nodes from OpenStreetMap...")

    query = """
    [out:json][timeout:90];
    (
      way["highway"~"motorway|trunk|primary|secondary"](12.88,80.12,13.20,80.31);
    );
    out body;
    >;
    out skel qt;
    """

    data = query_overpass(query)
    elements = data.get("elements", []) if data else []

    if not elements:
        print("  Warning: Overpass query failed, falling back to local chennai_roads.geojson...")
        return build_topology_from_existing_geojson()

    ways = [e for e in elements if e.get("type") == "way"]
    node_elements = [e for e in elements if e.get("type") == "node"]
    print(f"[ROAD_TOPOLOGY] Scraped {len(ways)} road ways and {len(node_elements)} exact OSM nodes.")

    # Build node coordinate dictionary
    node_coords = {} # node_id -> (lat, lon)
    for n in node_elements:
        node_coords[n["id"]] = (n["lat"], n["lon"])

    # Build Graph to compute node degrees and topology
    G = nx.MultiDiGraph()
    for n_id, (lat, lon) in node_coords.items():
        G.add_node(n_id, lat=lat, lon=lon)

    edges_data = []
    enriched_features = []

    for w in ways:
        way_id = w["id"]
        tags = w.get("tags", {})
        nodes_seq = w.get("nodes", [])
        if len(nodes_seq) < 2:
            continue

        # Extract coordinates for this way
        coords = []
        valid_nodes = []
        for nid in nodes_seq:
            if nid in node_coords:
                lat, lon = node_coords[nid]
                coords.append([lon, lat])
                valid_nodes.append(nid)

        if len(coords) < 2:
            continue

        start_nid = valid_nodes[0]
        end_nid = valid_nodes[-1]
        length_m = calculate_linestring_length_m(coords)
        name = tags.get("name", "Unnamed Road")
        highway = tags.get("highway", "unclassified")
        oneway = tags.get("oneway", "no")
        is_oneway = (oneway == "yes")
        edge_id = f"edge-{way_id}-{start_nid}-{end_nid}"

        # Add to graph
        G.add_edge(start_nid, end_nid, key=edge_id, way_id=way_id, length_m=length_m, highway=highway)
        if not is_oneway:
            G.add_edge(end_nid, start_nid, key=f"rev-{edge_id}", way_id=way_id, length_m=length_m, highway=highway)

        edge_info = {
            "edge_id": edge_id,
            "osm_way_id": way_id,
            "start_node_id": f"node-{start_nid}",
            "end_node_id": f"node-{end_nid}",
            "name": name,
            "name_ta": tags.get("name:ta", ""),
            "highway": highway,
            "ref": tags.get("ref", ""),
            "lanes": tags.get("lanes", ""),
            "oneway": oneway,
            "surface": tags.get("surface", "asphalt"),
            "bridge": tags.get("bridge", "no"),
            "tunnel": tags.get("tunnel", "no"),
            "length_m": length_m,
            "node_count": len(valid_nodes),
            "start_coord": coords[0],
            "end_coord": coords[-1],
            "coords": coords
        }
        edges_data.append(edge_info)

        # Enriched road feature (GeoJSON compatible)
        enriched_features.append({
            "type": "Feature",
            "id": f"road-{way_id}",
            "properties": {
                "osm_id": way_id,
                "edge_id": edge_id,
                "start_node_id": f"node-{start_nid}",
                "end_node_id": f"node-{end_nid}",
                "node_count": len(valid_nodes),
                "name": name,
                "name_ta": tags.get("name:ta", ""),
                "highway": highway,
                "ref": tags.get("ref", ""),
                "lanes": tags.get("lanes", ""),
                "maxspeed": tags.get("maxspeed", ""),
                "oneway": oneway,
                "surface": tags.get("surface", "asphalt"),
                "bridge": tags.get("bridge", "no"),
                "tunnel": tags.get("tunnel", "no"),
                "length_m": length_m,
                "start_coord": coords[0],
                "end_coord": coords[-1],
                "city": "Chennai",
                "state": "Tamil Nadu"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        })

    # Prepare Road Nodes data
    print("[ROAD_TOPOLOGY] Processing road nodes and intersection degrees...")
    nodes_geojson_features = []
    nodes_csv_rows = []

    for nid in G.nodes():
        deg = G.degree(nid)
        # Keep nodes that are either connected to edges, or boundary endpoints/intersections
        if deg == 0 and nid not in node_coords:
            continue
        lat, lon = node_coords[nid]
        is_intersection = 1 if deg >= 3 else 0
        node_type = "intersection" if deg >= 3 else ("junction" if deg == 2 else "terminal")

        node_uid = f"node-{nid}"
        feature = {
            "type": "Feature",
            "id": node_uid,
            "properties": {
                "node_id": node_uid,
                "osm_node_id": nid,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "degree": deg,
                "is_intersection": is_intersection,
                "node_type": node_type,
                "city": "Chennai"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, 6), round(lat, 6)]
            }
        }
        nodes_geojson_features.append(feature)
        nodes_csv_rows.append([
            node_uid, nid, round(lat, 6), round(lon, 6),
            deg, is_intersection, node_type, "Chennai"
        ])

    # Prepare Road Edges GeoJSON & CSV
    print("[ROAD_TOPOLOGY] Processing road edges GeoJSON and CSV...")
    edges_geojson_features = []
    edges_csv_rows = []

    for e in edges_data:
        feature = {
            "type": "Feature",
            "id": e["edge_id"],
            "properties": {
                "edge_id": e["edge_id"],
                "osm_way_id": e["osm_way_id"],
                "start_node_id": e["start_node_id"],
                "end_node_id": e["end_node_id"],
                "name": e["name"],
                "highway": e["highway"],
                "length_m": e["length_m"],
                "lanes": e["lanes"],
                "oneway": e["oneway"],
                "node_count": e["node_count"],
                "city": "Chennai"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": e["coords"]
            }
        }
        edges_geojson_features.append(feature)

        edges_csv_rows.append([
            e["edge_id"], e["osm_way_id"], e["start_node_id"], e["end_node_id"],
            e["name"], e["highway"], e["length_m"], e["lanes"], e["oneway"],
            e["node_count"], e["start_coord"][1], e["start_coord"][0],
            e["end_coord"][1], e["end_coord"][0]
        ])

    # 1. Write chennai_road_nodes
    with open(NODES_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({
            "type": "FeatureCollection",
            "name": "chennai_road_nodes",
            "metadata": {
                "total_nodes": len(nodes_geojson_features),
                "intersections_count": sum(1 for r in nodes_csv_rows if r[5] == 1),
                "source": "OpenStreetMap",
                "extracted_at": "2026-09-09"
            },
            "features": nodes_geojson_features
        }, f, indent=2)

    with open(NODES_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["node_id", "osm_node_id", "latitude", "longitude", "degree", "is_intersection", "node_type", "city"])
        writer.writerows(nodes_csv_rows)

    # 2. Write chennai_road_edges
    with open(EDGES_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({
            "type": "FeatureCollection",
            "name": "chennai_road_edges",
            "metadata": {
                "total_edges": len(edges_geojson_features),
                "total_length_km": round(sum(e["length_m"] for e in edges_data) / 1000.0, 2),
                "source": "OpenStreetMap",
                "extracted_at": "2026-09-09"
            },
            "features": edges_geojson_features
        }, f, indent=2)

    with open(EDGES_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "edge_id", "osm_way_id", "start_node_id", "end_node_id",
            "name", "highway", "length_m", "lanes", "oneway",
            "node_count", "start_lat", "start_lon", "end_lat", "end_lon"
        ])
        writer.writerows(edges_csv_rows)

    # 3. Update chennai_roads.geojson
    with open(ROADS_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({
            "type": "FeatureCollection",
            "name": "chennai_roads_network",
            "metadata": {
                "total_segments": len(enriched_features),
                "source": "OpenStreetMap via Overpass API",
                "extracted_at": "2026-09-09",
                "region": "Greater Chennai Corporation (GCC)"
            },
            "features": enriched_features
        }, f, indent=2, ensure_ascii=False)

    print(f"[ROAD_TOPOLOGY] Successfully generated road topology datasets:")
    print(f"  - Road Nodes: {len(nodes_csv_rows):,} nodes ({sum(1 for r in nodes_csv_rows if r[5] == 1):,} intersections)")
    print(f"  - Road Edges: {len(edges_csv_rows):,} edges")
    print(f"  - Road Segments: {len(enriched_features):,} enriched features")

def build_topology_from_existing_geojson():
    """Fallback if Overpass is down: construct topological graph from existing geojson coordinates."""
    print("  Building topology from local chennai_roads.geojson...")
    with open(ROADS_GEOJSON, encoding="utf-8") as f:
        roads_data = json.load(f)["features"]

    G = nx.MultiDiGraph()
    coord_to_node = {}
    node_counter = 1

    edges_data = []
    enriched_features = []

    for feat in roads_data:
        props = feat["properties"]
        coords = feat["geometry"]["coordinates"]
        osm_id = props.get("osm_id")
        name = props.get("name", "Unnamed Road")
        highway = props.get("highway", "unclassified")
        oneway = props.get("oneway", "no")
        is_oneway = (oneway == "yes")
        length_m = props.get("length_m", calculate_linestring_length_m(coords))

        start_pt = tuple(round(c, 6) for c in coords[0])
        end_pt = tuple(round(c, 6) for c in coords[-1])

        for pt in [start_pt, end_pt]:
            if pt not in coord_to_node:
                node_id = f"node-{node_counter:06d}"
                coord_to_node[pt] = node_id
                G.add_node(node_id, lon=pt[0], lat=pt[1])
                node_counter += 1

        u = coord_to_node[start_pt]
        v = coord_to_node[end_pt]
        edge_id = f"edge-{osm_id}-{u}-{v}"

        G.add_edge(u, v, key=edge_id, way_id=osm_id, length_m=length_m, highway=highway)
        if not is_oneway:
            G.add_edge(v, u, key=f"rev-{edge_id}", way_id=osm_id, length_m=length_m, highway=highway)

        edge_info = {
            "edge_id": edge_id,
            "osm_way_id": osm_id,
            "start_node_id": u,
            "end_node_id": v,
            "name": name,
            "highway": highway,
            "lanes": props.get("lanes", ""),
            "oneway": oneway,
            "length_m": length_m,
            "node_count": len(coords),
            "start_coord": coords[0],
            "end_coord": coords[-1],
            "coords": coords
        }
        edges_data.append(edge_info)

        props["edge_id"] = edge_id
        props["start_node_id"] = u
        props["end_node_id"] = v
        props["node_count"] = len(coords)
        enriched_features.append(feat)

    # Write nodes & edges
    nodes_csv_rows = []
    nodes_geojson_features = []
    for nid in G.nodes():
        deg = G.degree(nid)
        lon = G.nodes[nid]["lon"]
        lat = G.nodes[nid]["lat"]
        is_int = 1 if deg >= 3 else 0
        node_type = "intersection" if deg >= 3 else ("junction" if deg == 2 else "terminal")
        nodes_geojson_features.append({
            "type": "Feature",
            "id": nid,
            "properties": {"node_id": nid, "latitude": lat, "longitude": lon, "degree": deg, "is_intersection": is_int, "node_type": node_type},
            "geometry": {"type": "Point", "coordinates": [lon, lat]}
        })
        nodes_csv_rows.append([nid, nid, lat, lon, deg, is_int, node_type, "Chennai"])

    with open(NODES_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": nodes_geojson_features}, f, indent=2)
    with open(NODES_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["node_id", "osm_node_id", "latitude", "longitude", "degree", "is_intersection", "node_type", "city"])
        writer.writerows(nodes_csv_rows)

    edges_csv_rows = []
    edges_geojson_features = []
    for e in edges_data:
        edges_geojson_features.append({
            "type": "Feature",
            "id": e["edge_id"],
            "properties": e,
            "geometry": {"type": "LineString", "coordinates": e["coords"]}
        })
        edges_csv_rows.append([
            e["edge_id"], e["osm_way_id"], e["start_node_id"], e["end_node_id"],
            e["name"], e["highway"], e["length_m"], e["lanes"], e["oneway"],
            e["node_count"], e["start_coord"][1], e["start_coord"][0],
            e["end_coord"][1], e["end_coord"][0]
        ])

    with open(EDGES_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": edges_geojson_features}, f, indent=2)
    with open(EDGES_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["edge_id", "osm_way_id", "start_node_id", "end_node_id", "name", "highway", "length_m", "lanes", "oneway", "node_count", "start_lat", "start_lon", "end_lat", "end_lon"])
        writer.writerows(edges_csv_rows)

    with open(ROADS_GEOJSON, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": enriched_features}, f, indent=2)

    print(f"[ROAD_TOPOLOGY] Fallback complete: {len(nodes_csv_rows)} nodes, {len(edges_csv_rows)} edges saved.")

if __name__ == "__main__":
    fetch_and_build_topology()
