#!/usr/bin/env python3
"""
Showcase Server — serve selected HTML files from the Obsidian vault
through a local server (+ optional ngrok tunnel).

Usage:
    python3 .tools/showcase.py                  # serve on port 8080
    python3 .tools/showcase.py --port 9000      # custom port
    python3 .tools/showcase.py --tunnel          # auto-start ngrok tunnel

Open the launcher at http://localhost:8080 to toggle pages on/off.
Share the ngrok URL for external access.
"""

import http.server
import json
import os
import re
import subprocess
import sys
import threading
import urllib.parse
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
PORT = 8080
STATE_FILE = VAULT / ".tools" / ".showcase-state.json"

def find_html_files():
    files = []
    for p in sorted(VAULT.rglob("*.html")):
        rel = p.relative_to(VAULT)
        parts = str(rel).split(os.sep)
        if parts[0] in (".obsidian", ".claude", ".tools", "node_modules"):
            continue
        files.append(str(rel))
    return files

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))

def extract_title(filepath):
    try:
        content = (VAULT / filepath).read_text(errors="ignore")[:4000]
        m = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        if m:
            return m.group(1).strip()
    except Exception:
        pass
    return Path(filepath).stem.replace("-", " ").replace("_", " ").title()

def categorize(filepath):
    parts = filepath.split(os.sep)
    if "Visuals" in parts or "Visualizer" in parts:
        return "Visuals"
    if "dev-reviews" in parts:
        return "Dev Reviews"
    if "Sprint" in filepath:
        return "Sprint Summaries"
    if "Claude Code Case" in filepath:
        return "Claude Code Case"
    if "Agents" in parts:
        return "Agents"
    return "Other"

def build_launcher(files, state):
    categories = {}
    for f in files:
        cat = categorize(f)
        categories.setdefault(cat, []).append(f)

    cards_html = ""
    for cat in sorted(categories.keys()):
        cards_html += f'<div class="cat-header">{cat}</div><div class="grid">'
        for f in categories[cat]:
            enabled = state.get(f, False)
            title = extract_title(f)
            short_path = f if len(f) < 60 else "..." + f[-57:]
            checked = "checked" if enabled else ""
            link_class = "link active" if enabled else "link disabled"
            cards_html += f'''
            <div class="card {'on' if enabled else 'off'}">
                <div class="card-top">
                    <label class="toggle">
                        <input type="checkbox" data-file="{f}" {checked} onchange="toggle(this)">
                        <span class="slider"></span>
                    </label>
                    <a class="{link_class}" href="/page/{urllib.parse.quote(f, safe='/')}" target="_blank">{title}</a>
                </div>
                <div class="path">{short_path}</div>
            </div>'''
        cards_html += '</div>'

    enabled_count = sum(1 for v in state.values() if v)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Showcase</title>
<style>
  :root {{ --bg: #2b2b2b; --accent: #f5c518; --on: #10b981; --off: #94a3b8; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f0ede6; color:#1a1a1a; }}
  .header {{ background:var(--bg); padding:1.5rem; text-align:center; }}
  .header h1 {{ color:var(--accent); font-size:1.6rem; }}
  .header p {{ color:#999; font-size:0.85rem; margin-top:0.3rem; }}
  .stats {{ color:#ccc; font-size:0.8rem; margin-top:0.5rem; }}
  .stats strong {{ color:var(--on); }}
  .container {{ max-width:900px; margin:1.5rem auto; padding:0 1rem; }}
  .cat-header {{ font-size:1.1rem; font-weight:700; margin:1.5rem 0 0.75rem; padding-bottom:0.4rem; border-bottom:3px solid var(--accent); }}
  .grid {{ display:grid; grid-template-columns:1fr; gap:0.6rem; }}
  .card {{ background:#fff; border-radius:10px; padding:0.8rem 1rem; box-shadow:0 1px 4px rgba(0,0,0,0.06); border-left:4px solid var(--off); transition:border-color 0.2s; }}
  .card.on {{ border-left-color:var(--on); }}
  .card-top {{ display:flex; align-items:center; gap:0.75rem; }}
  .path {{ font-size:0.7rem; color:#999; font-family:'SF Mono','Fira Code',monospace; margin-top:0.3rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
  .link {{ font-weight:600; font-size:0.9rem; text-decoration:none; color:#1a1a1a; }}
  .link.disabled {{ color:#aaa; pointer-events:none; }}
  .link.active:hover {{ color:var(--accent); }}
  .toggle {{ position:relative; width:40px; height:22px; flex-shrink:0; }}
  .toggle input {{ opacity:0; width:0; height:0; }}
  .slider {{ position:absolute; inset:0; background:var(--off); border-radius:22px; cursor:pointer; transition:0.2s; }}
  .slider::before {{ content:""; position:absolute; height:16px; width:16px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.2s; }}
  .toggle input:checked + .slider {{ background:var(--on); }}
  .toggle input:checked + .slider::before {{ transform:translateX(18px); }}
  .actions {{ display:flex; gap:0.5rem; justify-content:center; margin-top:1rem; }}
  .btn {{ padding:0.4rem 1rem; border-radius:6px; border:2px solid var(--accent); background:transparent; font-weight:600; font-size:0.8rem; cursor:pointer; }}
  .btn:hover {{ background:var(--accent); color:#1a1a1a; }}
  .btn.danger {{ border-color:#ef4444; color:#ef4444; }}
  .btn.danger:hover {{ background:#ef4444; color:#fff; }}
</style>
</head>
<body>
<div class="header">
  <h1>Showcase</h1>
  <p>Toggle pages on/off, then share the link. Disabled pages return 404.</p>
  <div class="stats"><strong>{enabled_count}</strong> of {len(files)} pages enabled</div>
</div>
<div class="container">
  <div class="actions">
    <button class="btn" onclick="toggleAll(true)">Enable All</button>
    <button class="btn danger" onclick="toggleAll(false)">Disable All</button>
  </div>
  {cards_html}
</div>
<script>
function toggle(el) {{
  fetch('/api/toggle', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{file: el.dataset.file, enabled: el.checked}})
  }}).then(() => location.reload());
}}
function toggleAll(on) {{
  fetch('/api/toggle-all', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{enabled: on}})
  }}).then(() => location.reload());
}}
</script>
</body>
</html>'''


class ShowcaseHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        path = args[0] if args else ""
        if "/api/" not in str(path):
            super().log_message(format, *args)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)

        if path == "/" or path == "":
            files = find_html_files()
            state = load_state()
            html = build_launcher(files, state)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode())
            return

        if path.startswith("/page/"):
            rel_path = path[6:]
            state = load_state()
            if not state.get(rel_path, False):
                self.send_error(404, "Page not enabled in showcase")
                return
            full_path = VAULT / rel_path
            if not full_path.exists() or not full_path.is_file():
                self.send_error(404, "File not found")
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(full_path.read_bytes())
            return

        self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if path == "/api/toggle":
            state = load_state()
            state[body["file"]] = body["enabled"]
            save_state(state)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
            return

        if path == "/api/toggle-all":
            files = find_html_files()
            state = {f: body["enabled"] for f in files}
            save_state(state)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
            return

        self.send_error(404)


def start_ngrok(port):
    try:
        proc = subprocess.Popen(
            ["ngrok", "http", str(port)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        import time
        time.sleep(2)
        try:
            import urllib.request
            resp = urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels")
            data = json.loads(resp.read())
            for t in data.get("tunnels", []):
                if t.get("proto") == "https":
                    return t["public_url"]
            if data.get("tunnels"):
                return data["tunnels"][0]["public_url"]
        except Exception:
            pass
        return "(check http://127.0.0.1:4040 for the URL)"
    except FileNotFoundError:
        return None


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Showcase Server")
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--tunnel", action="store_true", help="Auto-start ngrok tunnel")
    args = parser.parse_args()

    print(f"\n  Showcase Server")
    print(f"  Vault: {VAULT}")
    print(f"  Local: http://localhost:{args.port}")

    if args.tunnel:
        url = start_ngrok(args.port)
        if url is None:
            print("  Tunnel: ngrok not found — install with: brew install ngrok")
        else:
            print(f"  Tunnel: {url}")

    print(f"\n  Open the launcher to toggle pages on/off.\n")

    server = http.server.HTTPServer(("0.0.0.0", args.port), ShowcaseHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()
