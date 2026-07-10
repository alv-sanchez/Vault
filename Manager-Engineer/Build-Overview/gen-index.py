#!/usr/bin/env python3
"""Regenerate index.html listing ALL files in every ticket folder.
Run from the Build-Overview directory:  python3 gen-index.py
"""
import os, html

ROOT = os.path.dirname(os.path.abspath(__file__))
TITLES = {
    "BMS-4935-red-bull-allocation": "Red Bull Allocation Import",
    "BMS-4965-short-pay": "Short Pay Automation",
    "BMS-5068-safety-stock": "Safety Stock Controls",
    "BMS-5070-shift-end-workflow": "Shift-End Workflow",
    "BMS-5083-pick-location-capacity": "Pick Location Capacity",
}
ICONS = {".html": "🌐", ".md": "📝", ".csv": "📊", ".apex": "⚡",
         ".png": "🖼️", ".jpg": "🖼️", ".pdf": "📄"}
SKIP = {".DS_Store"}

def icon(name):
    return ICONS.get(os.path.splitext(name)[1].lower(), "📄")

# Master files at root (non-folder)
root_files = sorted(f for f in os.listdir(ROOT)
                    if os.path.isfile(os.path.join(ROOT, f))
                    and f not in {"index.html", "gen-index.py"} and f not in SKIP)

folders = sorted(d for d in os.listdir(ROOT)
                 if os.path.isdir(os.path.join(ROOT, d)) and not d.startswith('.'))

def file_links(base, rel=""):
    out = []
    full = os.path.join(base, rel)
    for entry in sorted(os.listdir(full)):
        if entry in SKIP or entry.startswith('.'):
            continue
        p = os.path.join(full, entry)
        relpath = os.path.join(rel, entry) if rel else entry
        if os.path.isdir(p):
            out.append(f'<li class="dir">📁 {html.escape(entry)}/<ul>' + "".join(file_links(base, relpath)) + '</ul></li>')
        else:
            href = html.escape(os.path.join(os.path.basename(base), relpath))
            size = os.path.getsize(p)
            kb = f"{size/1024:.0f} KB" if size >= 1024 else f"{size} B"
            out.append(f'<li><a href="{href}">{icon(entry)} {html.escape(entry)}</a><span class="sz">{kb}</span></li>')
    return out

cards = []
for d in folders:
    title = TITLES.get(d, d)
    items = "".join(file_links(os.path.join(ROOT, d)))
    cards.append(f'''  <details class="card" open>
    <summary><span class="ticket">{html.escape(d.split('-')[0]+'-'+d.split('-')[1])}</span><span class="title">{html.escape(title)}</span><span class="count"></span></summary>
    <ul class="files">{items}</ul>
  </details>''')

root_list = "".join(
    f'<li><a href="{html.escape(f)}">{icon(f)} {html.escape(f)}</a></li>' for f in root_files)

doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Build Overview — Navigator</title>
<style>
  :root {{ --bg:#2b2b2b; --accent:#f5c518; --surface:#fff; --text:#1a1a1a; --muted:#666; --border:#e0e0e0; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f0ede6; color:var(--text); min-height:100vh; }}
  .header {{ background:var(--bg); padding:2rem 1.5rem; text-align:center; }}
  .header h1 {{ color:var(--accent); font-size:1.8rem; font-weight:800; }}
  .header p {{ color:#999; font-size:.9rem; margin-top:.4rem; }}
  .container {{ max-width:760px; margin:2rem auto; padding:0 1rem; }}
  .section-label {{ font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:1.5rem 0 .5rem; padding-left:.25rem; }}
  .card {{ background:var(--surface); border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); margin-bottom:.75rem; overflow:hidden; }}
  .card summary {{ display:flex; align-items:center; gap:1rem; padding:1.1rem 1.4rem; cursor:pointer; list-style:none; }}
  .card summary::-webkit-details-marker {{ display:none; }}
  .card summary::before {{ content:'▸'; color:var(--muted); transition:transform .15s; }}
  .card[open] summary::before {{ transform:rotate(90deg); }}
  .ticket {{ font-family:ui-monospace,'SF Mono',monospace; font-size:.8rem; font-weight:700; color:var(--accent); background:var(--bg); padding:.3rem .6rem; border-radius:6px; white-space:nowrap; }}
  .title {{ font-size:1rem; font-weight:600; flex:1; }}
  .files {{ list-style:none; padding:0 1.4rem 1rem 1.4rem; }}
  .files li {{ display:flex; align-items:center; padding:.45rem .5rem; border-top:1px solid var(--border); }}
  .files li:hover {{ background:#faf8f2; }}
  .files a {{ text-decoration:none; color:var(--text); flex:1; font-size:.92rem; }}
  .files a:hover {{ color:#000; text-decoration:underline; }}
  .files .sz {{ color:var(--muted); font-size:.75rem; font-family:ui-monospace,monospace; }}
  .files .dir {{ display:block; }}
  .files .dir ul {{ list-style:none; padding-left:1.2rem; }}
  .master {{ border-left:4px solid var(--accent); }}
  .footer {{ text-align:center; color:#999; font-size:.75rem; padding:2rem 0; }}
</style>
</head>
<body>
<div class="header">
  <h1>Build Overview</h1>
  <p>Full contents of every ticket folder</p>
</div>
<div class="container">
  <div class="section-label">Master Files</div>
  <div class="card master"><ul class="files">{root_list}</ul></div>

  <div class="section-label">Ticket Folders</div>
{chr(10).join(cards)}
</div>
<div class="footer">Manager-Engineer Pipeline · regenerate with <code>python3 gen-index.py</code></div>
</body>
</html>
'''

with open(os.path.join(ROOT, "index.html"), "w") as f:
    f.write(doc)
print("Wrote index.html with", len(folders), "folders,", len(root_files), "master files")
