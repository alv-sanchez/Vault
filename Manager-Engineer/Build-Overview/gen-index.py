#!/usr/bin/env python3
"""Regenerate index.html listing ALL files in every ticket folder.
Epic folders live one level down, under their current Sprint-N/ folder
(Build-Overview/Sprint-9/BMS-4935-.../) — see gen-sprint-folders.py, which
physically moves a folder into its dedicated sprint folder as its sprint
stamp changes. Utility folders (build-map, understand-*) stay at the root.
Run from the Build-Overview directory:  python3 gen-index.py
"""
import os, html, re

ROOT = os.path.dirname(os.path.abspath(__file__))
TITLES = {
    "BMS-4935-red-bull-allocation": "Red Bull Allocation Import",
    "BMS-4965-short-pay": "Short Pay Automation",
    "BMS-5068-safety-stock": "Safety Stock Controls",
    "BMS-5070-shift-end": "Shift-End Workflow",
    "BMS-5083-pick-location-capacity": "Pick Location Capacity",
}
ICONS = {".html": "🌐", ".md": "📝", ".csv": "📊", ".apex": "⚡",
         ".png": "🖼️", ".jpg": "🖼️", ".pdf": "📄"}
SKIP = {".DS_Store"}
SPRINT_DIR_RE = re.compile(r"^Sprint-(\d+)$")


def icon(name):
    return ICONS.get(os.path.splitext(name)[1].lower(), "📄")


def sprint_info(epic_dir_abs):
    """Read sprint/sprint_status out of overview.md frontmatter; fall back to SESSION.md's
    '**Sprint:**' line for scaffold-only folders that have no overview.md yet."""
    p = os.path.join(epic_dir_abs, "overview.md")
    if os.path.isfile(p):
        with open(p, encoding="utf-8") as f:
            head = f.read(2000)
        fm = head.split("---")[1] if head.startswith("---") else ""
        sprint_m = re.search(r'^sprint:\s*"?([^"\n#]+?)"?\s*(?:#.*)?$', fm, re.M)
        status_m = re.search(r'^sprint_status:\s*"?([^"\n#]+?)"?\s*(?:#.*)?$', fm, re.M)
        if sprint_m:
            return sprint_m.group(1).strip(), (status_m.group(1).strip() if status_m else None)
    sp = os.path.join(epic_dir_abs, "SESSION.md")
    if os.path.isfile(sp):
        with open(sp, encoding="utf-8") as f:
            text = f.read(2000)
        m = re.search(r'\*\*Sprint:\*\*\s*(.+)', text)
        if m:
            line = m.group(1).strip()
            status = "dormant" if re.search(r'dormant', line, re.I) else "active"
            sprint = re.match(r'([^(—-]+)', line)
            return (sprint.group(1).strip() if sprint else line), status
    return None, None


def sprint_badge(epic_dir_abs):
    sprint, status = sprint_info(epic_dir_abs)
    if not sprint or sprint.upper() in ("TBD", "NONE"):
        return '<span class="sprint-badge sprint-none">no active sprint</span>'
    if status == "dormant":
        return f'<span class="sprint-badge sprint-dormant">🕓 {html.escape(sprint)} (dormant)</span>'
    return f'<span class="sprint-badge sprint-active">🟢 {html.escape(sprint)}</span>'


def file_links(base, href_prefix, rel=""):
    """base = absolute dir to read from; href_prefix = path from index.html's
    own location (ROOT) down to that dir — hrefs must include it or every link
    inside a Sprint-N/ card 404s (it'd resolve relative to ROOT, missing the
    Sprint-N/BMS-.../ segment)."""
    out = []
    full = os.path.join(base, rel)
    for entry in sorted(os.listdir(full)):
        if entry in SKIP or entry.startswith('.'):
            continue
        p = os.path.join(full, entry)
        relpath = os.path.join(rel, entry) if rel else entry
        if os.path.isdir(p):
            out.append(f'<li class="dir">📁 {html.escape(entry)}/<ul>' + "".join(file_links(base, href_prefix, relpath)) + '</ul></li>')
        else:
            href = html.escape(os.path.join(href_prefix, relpath))
            size = os.path.getsize(p)
            kb = f"{size/1024:.0f} KB" if size >= 1024 else f"{size} B"
            out.append(f'<li><a href="{href}">{icon(entry)} {html.escape(entry)}</a><span class="sz">{kb}</span></li>')
    return out


def epic_card(sprint_dir, epic_name):
    """sprint_dir is e.g. 'Sprint-9' or '' for root-level utility folders."""
    rel = os.path.join(sprint_dir, epic_name) if sprint_dir else epic_name
    abs_dir = os.path.join(ROOT, rel)
    title = TITLES.get(epic_name, epic_name)
    items = "".join(file_links(abs_dir, rel))
    ticket_label = epic_name.split('-')[0] + '-' + epic_name.split('-')[1] if epic_name.startswith("BMS-") else epic_name
    badge = sprint_badge(abs_dir) if epic_name.startswith("BMS-") else ""
    return f'''  <details class="card" open>
    <summary><span class="ticket">{html.escape(ticket_label)}</span><span class="title">{html.escape(title)}</span>{badge}<span class="count"></span></summary>
    <ul class="files">{items}</ul>
  </details>'''


# Master files at root (non-folder)
root_files = sorted(f for f in os.listdir(ROOT)
                    if os.path.isfile(os.path.join(ROOT, f))
                    and f not in {"index.html", "gen-index.py", "gen-sprint-folders.py"} and f not in SKIP)

all_dirs = sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)) and not d.startswith('.'))
sprint_dirs = sorted((d for d in all_dirs if SPRINT_DIR_RE.match(d)),
                     key=lambda d: int(SPRINT_DIR_RE.match(d).group(1)), reverse=True)
utility_dirs = [d for d in all_dirs if not SPRINT_DIR_RE.match(d)]

sprint_sections = []
epic_count = 0
for sdir in sprint_dirs:
    epics = sorted(e for e in os.listdir(os.path.join(ROOT, sdir)) if os.path.isdir(os.path.join(ROOT, sdir, e)))
    epic_count += len(epics)
    cards = "\n".join(epic_card(sdir, e) for e in epics)
    n = SPRINT_DIR_RE.match(sdir).group(1)
    sprint_sections.append(f'  <div class="section-label">🗓️ Sprint {n} · {len(epics)} epic folder(s)</div>\n{cards}')

utility_cards = "\n".join(epic_card("", d) for d in utility_dirs)

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
  .sprint-badge {{ font-size:.72rem; font-weight:700; padding:.2rem .55rem; border-radius:20px; white-space:nowrap; }}
  .sprint-active {{ background:#e3ecdf; color:#3a6b4a; }}
  .sprint-dormant {{ background:#f3ecd8; color:#8a6d1f; }}
  .sprint-none {{ background:#eee; color:#888; }}
  .footer {{ text-align:center; color:#999; font-size:.75rem; padding:2rem 0; }}
</style>
</head>
<body>
<div class="header">
  <h1>Build Overview</h1>
  <p>Full contents of every ticket folder, organized by sprint</p>
</div>
<div class="container">
  <div class="section-label">Master Files</div>
  <div class="card master"><ul class="files">{root_list}</ul></div>

{chr(10).join(sprint_sections)}

  <div class="section-label">Reference / Utility</div>
{utility_cards}
</div>
<div class="footer">Manager-Engineer Pipeline · regenerate with <code>python3 gen-index.py</code></div>
</body>
</html>
'''

with open(os.path.join(ROOT, "index.html"), "w") as f:
    f.write(doc)
print("Wrote index.html with", epic_count, "epic folders across", len(sprint_dirs), "sprints,", len(utility_dirs), "utility folders,", len(root_files), "master files")
