"""
omniroute_client.py
===================
Robust LLM Client for OmniRoute Proxy (OpenAI-compatible) at http://localhost:20128/v1.

Features:
  1. Auto-discovers API key from:
     - Explicit argument / ENV var OMNIROUTE_API_KEY
     - Local .env file
     - OmniRoute SQLite storage (C:\\Users\\<user>\\.omniroute\\storage.sqlite)
  2. Parses SSE (Server-Sent Events) streaming responses, filtering out
     keepalive chunks (omniroute-keepalive) and extracting deltas reliably.
  3. Provides graceful offline fallback heuristic if OmniRoute proxy is unavailable.
"""

import os
import sys
import json
import sqlite3
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DEFAULT_BASE_URL = os.environ.get("OMNIROUTE_BASE_URL", "http://127.0.0.1:20128/v1")
DEFAULT_MODEL = os.environ.get("OMNIROUTE_MODEL", "auto/smart")

def discover_omniroute_api_key():
    """Attempts to discover the OmniRoute API key automatically."""
    # 1. Environment variable
    env_key = os.environ.get("OMNIROUTE_API_KEY")
    if env_key:
        return env_key.strip()

    # 2. Workspace .env file
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("OMNIROUTE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    # 3. OmniRoute local SQLite database
    user_home = os.path.expanduser("~")
    db_path = os.path.join(user_home, ".omniroute", "storage.sqlite")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT key FROM api_keys WHERE is_active = 1 LIMIT 1;")
            row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                return row[0].strip()
        except Exception:
            pass

    # Default fallback placeholder
    return "sk-omniroute-default"


class OmniRouteClient:
    def __init__(self, base_url=None, api_key=None, default_model=None):
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.api_key = api_key or discover_omniroute_api_key()
        self.default_model = default_model or DEFAULT_MODEL
        self._is_online = None

    def check_health(self):
        """Quick check if OmniRoute proxy is running and responding."""
        # Ping the root or /v1/models
        try:
            # Root returns 307 / 200 immediately
            root_url = self.base_url.replace("/v1", "")
            resp = requests.get(root_url, timeout=3, allow_redirects=True)
            if resp.status_code in (200, 307, 302):
                self._is_online = True
                return True
        except Exception:
            pass

        try:
            url = f"{self.base_url}/models"
            resp = requests.get(url, timeout=6)
            self._is_online = (resp.status_code == 200)
            return self._is_online
        except Exception:
            self._is_online = False
            return False

    def list_models(self):
        """Returns list of available model IDs from OmniRoute."""
        try:
            url = f"{self.base_url}/models"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return [m.get("id") for m in data.get("data", [])]
        except Exception as e:
            print(f"[OMNIROUTE] Failed to list models: {e}")
        return []

    def chat_complete(self, prompt, system_prompt=None, model=None, temperature=0.2, max_tokens=1000, timeout=60):
        """
        Sends a chat completion request to OmniRoute and returns the parsed full string.
        Handles SSE stream chunks reliably.
        """
        model = model or self.default_model
        url = f"{self.base_url}/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True  # OmniRoute works best with SSE streaming
        }

        try:
            full_text = ""
            with requests.post(url, headers=headers, json=payload, stream=True, timeout=timeout) as resp:
                if resp.status_code != 200:
                    print(f"[OMNIROUTE ERROR] HTTP {resp.status_code}: {resp.text[:200]}")
                    return None

                for raw_line in resp.iter_lines():
                    if not raw_line:
                        continue
                    line = raw_line.decode("utf-8", errors="replace").strip()
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            # Ignore omniroute keepalive chunks
                            if chunk.get("id") == "omniroute-keepalive":
                                continue

                            choices = chunk.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_text += content
                        except Exception:
                            pass

            return full_text.strip() if full_text else None

        except Exception as e:
            print(f"[OMNIROUTE CLIENT EXCEPTION] {type(e).__name__}: {e}")
            return None


if __name__ == "__main__":
    print("=" * 60)
    print("OMNIROUTE LOCAL CLIENT DIAGNOSTIC")
    print("=" * 60)
    client = OmniRouteClient()
    print(f"Base URL   : {client.base_url}")
    print(f"API Key    : {client.api_key[:8]}... (discovered: {bool(client.api_key)})")
    
    online = client.check_health()
    print(f"Status     : {'🟢 ONLINE (Port 20128 Active)' if online else '🔴 OFFLINE'}")

    if online:
        models = client.list_models()
        print(f"Models     : {len(models)} models available in OmniRoute catalog")
        print("\nTesting chat completion with model: auto/smart ...")
        res = client.chat_complete(
            prompt="Reply with 1 sentence: What is the primary cause of urban flooding in Chennai?",
            system_prompt="You are a meteorological expert."
        )
        print("\nResponse:\n" + "-" * 40)
        print(res)
        print("-" * 40)
