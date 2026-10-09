"""
serve_app.py
============
High-Performance, Zero-Dependency HTTP Server & API Backend for Chennai Flood Access & Risk Mapper.

Endpoints:
  GET  /            -> Serves web/index.html dashboard
  GET  /api/live    -> Live Open-Meteo weather station forecasts
  POST /api/route   -> Dijkstra shortest vs safe alternate route calculation
  POST /api/sitrep  -> Generates GCC emergency operations commander sitrep
  POST /api/chat    -> Natural language tactical AI queries (Tamil & English)
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))

from flood_ai_agent import ChennaiFloodAIAgent

# Global singleton agent
print("[SERVER] Initializing Chennai Flood AI Tactical Agent...")
agent = ChennaiFloodAIAgent()
print("[SERVER] AI Agent initialized and ready.")

WEB_DIR = os.path.join(BASE_DIR, "web")
INDEX_HTML_PATH = os.path.join(WEB_DIR, "index.html")


class FloodAppHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            if not os.path.exists(INDEX_HTML_PATH):
                self.send_error(404, "Web dashboard file not found")
                return
            with open(INDEX_HTML_PATH, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        elif self.path == "/api/live":
            stations = agent.predictor.fetch_live_multi_station_forecast()
            self._send_json({"stations": stations or {}})
            return

        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        try:
            payload = json.loads(raw_body) if raw_body else {}
        except Exception:
            payload = {}

        if self.path == "/api/route":
            orig = payload.get("origin", "velachery")
            dest = payload.get("destination", "airport")
            vehicle = payload.get("vehicle", "hatchback")
            rain = float(payload.get("rain", 140.0))

            res = agent.advise_route(orig, dest, vehicle_type=vehicle, rain_mm=rain)
            if "error" in res:
                self._send_json({"error": res["error"]}, status=400)
                return

            norm = res["normal_route"]
            safe = res["safe_route"]
            diff = res["route_comparison"]

            self._send_json({
                "origin": orig,
                "destination": dest,
                "vehicle": vehicle,
                "normal": {
                    "distance_km": norm["distance_km"],
                    "flooded_count": norm["flooded_segments_count"],
                    "coords": norm["coordinates"]
                },
                "safe": {
                    "distance_km": safe["distance_km"],
                    "detour_km": diff.get("detour_km", 0.0),
                    "floods_avoided": diff.get("floods_avoided", 0),
                    "coords": safe["coordinates"]
                },
                "ai_briefing": res.get("ai_briefing", "")
            })
            return

        elif self.path == "/api/sitrep":
            rain = float(payload.get("rain", 200.0))
            res = agent.generate_sitrep(scenario="cyclone", rain_mm=rain)
            self._send_json(res)
            return

        elif self.path == "/api/chat":
            query = payload.get("query", "")
            rain = float(payload.get("rain", 140.0))
            res = agent.ask(query, rain_mm=rain)
            resp_text = res.get("ai_briefing", res.get("sitrep", ""))
            self._send_json({"response": resp_text})
            return

        else:
            self.send_error(404, "Endpoint Not Found")

    def log_message(self, format, *args):
        # Concise logging
        print(f"[API] {self.command} {self.path} -> {args[1] if len(args)>1 else ''}")


def run_server(port=8050):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, FloodAppHandler)
    print("\n" + "=" * 70)
    print(f"🌊 CHENNAI FLOOD ACCESS & RISK MAPPER - WEB SERVER ACTIVE")
    print(f"🌐 Dashboard URL : http://localhost:{port}")
    print(f"🤖 Tactical Brain : Connected via OmniRoute (Port 20128)")
    print("=" * 70 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down.")
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8050
    run_server(port)
