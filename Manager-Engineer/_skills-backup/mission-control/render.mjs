#!/usr/bin/env node
// Mission Control — the mother dashboard.
// Renders every active epic with its full ticket tree (status + PR/review) into one
// self-contained, auto-refreshing HTML page in the vault. Data is gathered live from
// Jira + GitHub by the skill and handed here as JSON.
//
// Usage: node render.mjs [path/to/mission-control.json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = {
  out_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Mission-Control",
  refresh_seconds: 900,
  jira_browse: "https://ohanafy.atlassian.net/browse",
  pr_base: "https://github.com/Ohanafy/OHFY-Split/pull",
};
function loadConfig() {
  const p = path.join(HERE, "config.json");
  let cfg = { ...DEFAULTS };
  if (fs.existsSync(p)) cfg = { ...cfg, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  else fs.writeFileSync(p, JSON.stringify(DEFAULTS, null, 2));
  return cfg;
}
const cfg = loadConfig();
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const dataPath = process.argv[2] || path.join(cfg.out_dir, "mission-control.json");
if (!fs.existsSync(dataPath)) { console.error(`No data file at ${dataPath}.`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const epics = data.epics || [];
const todoEpics = data.todoEpics || []; // assigned-to-me epics still in To Do — pick-up visibility
const stampHuman = data.generated || "";

// status category: "done" | "prog" | "todo"; plus fine-grained label styling
const catOf = (t) => {
  const s = (t.statusCategory || "").toLowerCase();
  if (s.includes("done")) return "done";
  if (s.includes("progress") || s.includes("indeterminate")) return "prog";
  return "todo";
};
const statusClass = (name) => {
  const n = (name || "").toLowerCase();
  if (n === "review") return "st-review";
  if (n === "in progress") return "st-prog";
  if (n === "done") return "st-done";
  if (n.includes("refin")) return "st-refine";
  return "st-todo";
};
// build-type flag: UI · Backend · Both · Spike · Docs — shown BEFORE the polish label.
const buildClass = (b) => ({ ui: "bd-ui", backend: "bd-be", both: "bd-both", spike: "bd-spike", docs: "bd-docs" }[(b || "").toLowerCase().replace(/[^a-z]/g, "")] || "bd-be");
const buildBadge = (t) => (t.build ? `<span class="tag bd ${buildClass(t.build)}" title="what gets built">${esc(t.build)}</span>` : "");
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function counts(tickets) {
  const c = { total: tickets.length, done: 0, prog: 0, todo: 0 };
  for (const t of tickets) c[catOf(t)]++;
  return c;
}
function bar(c) {
  const d = pct(c.done, c.total), p = pct(c.prog, c.total), t = 100 - d - p;
  return `<div class="bar" title="${c.done} done · ${c.prog} in progress · ${c.todo} to do of ${c.total}">
    <span class="seg done" style="width:${d}%"></span><span class="seg prog" style="width:${p}%"></span><span class="seg todo" style="width:${t}%"></span></div>`;
}
const prTag = (pr, status) => {
  if (pr.draft) return " <span class='tag draft'>draft</span>";
  if (pr.state === "merged" || pr.merged) return " <span class='tag merged'>merged</span>";
  if (pr.state === "closed") return " <span class='tag closed'>closed</span>";
  if (statusClass(status) === "st-review") return " <span class='tag rev'>review</span>";
  return "";
};
const prCell = (t) => {
  if (!t.pr) return catOf(t) === "done" ? "" : "<span class='dim'>—</span>";
  return `<a class="pr" href="${cfg.pr_base}/${t.pr.number}">#${t.pr.number}</a>${prTag(t.pr, t.status)}`;
};

// ---- attention band: anything in Review or with an open PR ----
const attention = [];
for (const e of [...epics, ...todoEpics]) for (const t of (e.tickets || []))
  if (statusClass(t.status) === "st-review" || t.pr) attention.push({ ...t, epicKey: e.key, epicTitle: e.title });

// ---- per-epic section (reused for active epics AND to-do epics with expanded trees) ----
const epicCard = (e) => {
  const tickets = e.tickets || [];
  const c = counts(tickets);
  const rows = tickets.map((t) => `<tr>
      <td class="k"><a href="${cfg.jira_browse}/${esc(t.key)}">${esc(t.key)}</a></td>
      <td class="ty"><span class="tag ty-${(t.type || "").toLowerCase().replace(/[^a-z]/g, "")}">${esc(t.type || "")}</span></td>
      <td class="tt">${esc(t.title || "")}${t.build ? " " + buildBadge(t) : ""}${t.polished ? ' <span class="tag pol" title="polished / bk-polish-complete">✨ polished</span>' : ""}${t.note ? `<div class="tnote">${esc(t.note)}</div>` : ""}</td>
      <td class="stt"><span class="st ${statusClass(t.status)}">${esc(t.status || "")}</span></td>
      <td class="org">${t.org ? `<code class="cpy" data-copy="sf org open --target-org ${esc(t.org)}" title="Copy: sf org open --target-org ${esc(t.org)}">${esc(t.org)}</code>${t.orgLive === false ? " <span class='tag exp'>⚠ expired</span>" : ""}` : "<span class='dim'>—</span>"}</td>
      <td class="prc">${prCell(t)}</td>
    </tr>`).join("\n");
  const epicOrgs = [...new Set(tickets.map((t) => t.org).filter(Boolean))];
  const orgLiveMap = {}; tickets.forEach((t) => { if (t.org && t.orgLive) orgLiveMap[t.org] = true; });
  return `<section class="epic">
    <div class="ehead">
      <div class="etitle"><a href="${cfg.jira_browse}/${esc(e.key)}">${esc(e.key)}</a> <b>${esc(e.title)}</b>
        ${e.pinned ? '<span class="tag pin">📌 pinned</span>' : ""}
        <span class="dom">${esc(e.domain || "")}${e.phase ? " · " + esc(e.phase) : ""}</span></div>
      <div class="eprog">${bar(c)}<span class="pnum"><b>${pct(c.done, c.total)}%</b> done · ${pct(c.done + c.prog, c.total)}% started</span></div>
    </div>
    ${e.summary ? `<div class="esum">${esc(e.summary)}</div>` : ""}
    ${(e.user || e.impact || e.solution) ? `<div class="ectx">
      ${e.user ? `<div class="ctx"><span class="cl cl-user">👤 User</span><span class="cv">${esc(e.user)}</span></div>` : ""}
      ${e.impact ? `<div class="ctx"><span class="cl cl-impact">💥 Impact</span><span class="cv">${esc(e.impact)}</span></div>` : ""}
      ${e.solution ? `<div class="ctx"><span class="cl cl-sol">🛠️ Solution</span><span class="cv">${esc(e.solution)}</span></div>` : ""}
    </div>` : ""}
    <div class="ecounts"><span class="pill done">${c.done} done</span><span class="pill prog">${c.prog} in progress</span><span class="pill todo">${c.todo} to do</span><span class="pill tot">${c.total} total</span>${(() => { const p = tickets.filter((t) => t.polished).length; return p ? `<span class="pill pol">✨ ${p}/${tickets.length} polished</span>` : ""; })()}${epicOrgs.length ? `<span class="orgchips">🖥️ ${epicOrgs.map((o) => `<code class="cpy" data-copy="sf org open --target-org ${esc(o)}" title="Copy: sf org open --target-org ${esc(o)}">${esc(o)}</code>${orgLiveMap[o] ? "" : " <span class='tag exp'>⚠</span>"}`).join(" ")}</span>` : ""}</div>
    <div class="twrap"><table class="tix">
      <thead><tr><th>Ticket</th><th>Type</th><th>Title</th><th>Status</th><th>Org</th><th>PR</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </section>`;
};
const sections = epics.map(epicCard).join("\n");

// ---- To Do epics (assigned to me, not started) ----
// Those with an expanded ticket tree render as full cards (children visible); any tree-less
// ones fall back to the compact pick-up grid.
const phaseClass = (p) => ({ crawl: "ph-crawl", walk: "ph-walk", run: "ph-run" }[(p || "").toLowerCase()] || "ph-crawl");
const todoWithTrees = todoEpics.filter((e) => (e.tickets || []).length);
const todoCompact = todoEpics.filter((e) => !(e.tickets || []).length);
const todoByPhase = { crawl: [], walk: [], run: [] };
for (const e of todoCompact) (todoByPhase[(e.phase || "crawl").toLowerCase()] || todoByPhase.crawl).push(e);
const todoCard = (e) => `<a class="tcard" href="${cfg.jira_browse}/${esc(e.key)}">
    <div class="tc-top"><span class="tkey">${esc(e.key)}</span><span class="ph ${phaseClass(e.phase)}">${esc(e.phase || "")}</span></div>
    <div class="tc-title">${esc(e.title)}</div>
    <div class="tc-dom">${esc(e.domain || "")}</div>
    ${e.summary ? `<div class="tc-sum">${esc(e.summary)}</div>` : ""}
    ${e.impact ? `<div class="tc-impact">💥 ${esc(e.impact)}</div>` : ""}
  </a>`;
const todoSection = todoEpics.length ? `<section class="todo-epics">
    <h2>📋 To Do — assigned to you · ${todoEpics.length} epics${todoWithTrees.length ? " (children expanded)" : " ready to pick up"}</h2>
    ${todoWithTrees.map(epicCard).join("\n")}
    ${todoCompact.length ? `${["crawl", "walk", "run"].filter((p) => todoByPhase[p].length).map((p) => `
      <div class="phgroup"><div class="phlabel"><span class="ph ${phaseClass(p)}">${p}</span> <span class="phn">${todoByPhase[p].length}</span></div>
      <div class="tgrid">${todoByPhase[p].map(todoCard).join("")}</div></div>`).join("")}` : ""}
  </section>` : "";

const allTix = epics.flatMap((e) => e.tickets || []);
const tot = counts(allTix);

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="${cfg.refresh_seconds}">
<title>Mission Control — Active Epics</title>
<style>
  :root{--bg:#0d1017;--card:#151925;--card2:#1a1f2e;--line:#252b3b;--txt:#e7e9f0;--dim:#8891a5;
    --done:#3fb950;--prog:#d29922;--todo:#333b4d;--review:#a371f7;--refine:#58a6ff;--accent:#58a6ff;}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--txt);
    font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:26px}
  h1{font-size:21px;margin:0 0 2px} .sub{color:var(--dim);font-size:13px;margin-bottom:20px}
  .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
  .sc{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;min-width:104px}
  .sc .n{font-size:24px;font-weight:700} .sc .l{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .sc.done .n{color:var(--done)} .sc.prog .n{color:var(--prog)} .sc.review .n{color:var(--review)} .sc.todo .n{color:var(--refine)}
  section.todo-epics{background:linear-gradient(180deg,#12151d,#111722);border:1px dashed #2c3346;border-radius:12px;padding:16px 18px;margin-bottom:16px}
  section.todo-epics>h2{font-size:13px;margin:0 0 14px;color:var(--refine);text-transform:uppercase;letter-spacing:.05em}
  .phgroup{margin-bottom:14px} .phgroup:last-child{margin-bottom:0}
  .phlabel{display:flex;align-items:center;gap:8px;margin:0 0 8px} .phlabel .phn{color:var(--dim);font-size:12px}
  .tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
  a.tcard{display:block;background:var(--card2);border:1px solid var(--line);border-radius:9px;padding:10px 12px;text-decoration:none;transition:.12s}
  a.tcard:hover{border-color:#3b4a6b;background:#1e2536;transform:translateY(-1px)}
  .tc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
  .tkey{color:var(--accent);font-weight:700;font-variant-numeric:tabular-nums;font-size:12.5px}
  .tc-title{color:var(--txt);font-weight:600;font-size:13px;line-height:1.35;margin-bottom:3px}
  .tc-dom{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px}
  .tc-sum{color:#9aa3b8;font-size:12px;line-height:1.4}
  .ph{display:inline-block;padding:1px 8px;border-radius:11px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .ph.ph-crawl{background:rgba(63,185,80,.16);color:var(--done)}
  .ph.ph-walk{background:rgba(210,153,34,.16);color:var(--prog)}
  .ph.ph-run{background:rgba(163,113,247,.18);color:var(--review)}
  .band{background:linear-gradient(180deg,#1c1526,#151925);border:1px solid #3a2d52;border-radius:12px;padding:14px 18px;margin-bottom:22px}
  .band h2{font-size:13px;margin:0 0 10px;color:var(--review);text-transform:uppercase;letter-spacing:.05em}
  .band .row{display:flex;gap:10px;align-items:center;padding:5px 0;flex-wrap:wrap}
  .band .row a.k{color:var(--accent);text-decoration:none;font-weight:600}
  .band .row .t{color:#c9cfe0} .band .row .ep{color:var(--dim);font-size:12px}
  section.epic{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:16px}
  .ehead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .etitle a{color:var(--accent);text-decoration:none;font-weight:600}
  .etitle b{font-weight:600} .dom{color:var(--dim);font-size:12px;margin-left:6px}
  .eprog{min-width:210px;text-align:right} .pnum{color:var(--dim);font-size:12px;margin-left:8px} .pnum b{color:var(--txt)}
  .esum{color:#b9c0d2;font-size:13px;margin:8px 0 10px;max-width:70ch}
  .ecounts{margin:8px 0 12px}
  .bar{display:inline-flex;vertical-align:middle;width:150px;height:8px;border-radius:5px;overflow:hidden;background:var(--todo)}
  .seg{height:100%} .seg.done{background:var(--done)}.seg.prog{background:var(--prog)}.seg.todo{background:var(--todo)}
  .twrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px}
  table.tix{border-collapse:collapse;width:100%;min-width:640px}
  table.tix th{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:8px 12px;background:var(--card2);border-bottom:1px solid var(--line)}
  table.tix td{padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  table.tix tr:last-child td{border-bottom:none}
  table.tix tr:hover td{background:var(--card2)}
  .k a{color:var(--accent);text-decoration:none;font-weight:600;font-variant-numeric:tabular-nums}
  .tt{color:#cdd3e2;max-width:44ch} .prc .dim,.dim{color:var(--dim)}
  a.pr{color:var(--accent);text-decoration:none;font-weight:600}
  .st{display:inline-block;padding:1px 8px;border-radius:11px;font-size:12px;font-weight:600;white-space:nowrap}
  .st-review{background:rgba(163,113,247,.18);color:var(--review)}
  .st-prog{background:rgba(210,153,34,.18);color:var(--prog)}
  .st-done{background:rgba(63,185,80,.18);color:var(--done)}
  .st-refine{background:rgba(88,166,255,.16);color:var(--refine)}
  .st-todo{background:rgba(136,145,165,.14);color:var(--dim)}
  .tag{display:inline-block;padding:0 7px;border-radius:6px;font-size:11px;font-weight:600;margin-left:4px}
  .tag.pin{background:rgba(210,153,34,.16);color:var(--prog)}
  .tag.rev{background:rgba(163,113,247,.2);color:var(--review)}
  .tag.merged{background:rgba(163,113,247,.2);color:#c9a5ff}
  .tag.closed{background:rgba(248,81,73,.16);color:#f85149}
  .tag.draft{background:rgba(136,145,165,.18);color:var(--dim)}
  .tag.exp{background:rgba(248,81,73,.16);color:#f85149}
  .tag.ty-story{background:#22283a;color:#9fb4e6}.tag.ty-spike{background:#2a2340;color:#c4a5f5}.tag.ty-demo{background:#243024;color:#8fce8f}
  .tag.pol{background:rgba(88,166,255,.16);color:#79c0ff}
  .tag.bd{border:1px solid transparent}
  .tag.bd.bd-ui{background:rgba(219,109,222,.16);color:#e29aff;border-color:rgba(219,109,222,.35)}
  .tag.bd.bd-be{background:rgba(88,166,255,.14);color:#8cc2ff;border-color:rgba(88,166,255,.32)}
  .tag.bd.bd-both{background:rgba(63,185,80,.15);color:#7ee787;border-color:rgba(63,185,80,.32)}
  .tag.bd.bd-spike{background:rgba(163,113,247,.18);color:#c4a5f5;border-color:rgba(163,113,247,.35)}
  .tag.bd.bd-docs{background:rgba(136,145,165,.16);color:#b3bccf;border-color:rgba(136,145,165,.32)}
  .tnote{color:#8891a5;font-size:12px;line-height:1.4;margin-top:3px}
  .ectx{display:flex;flex-direction:column;gap:5px;margin:2px 0 12px;padding:10px 12px;background:var(--card2);border:1px solid var(--line);border-radius:8px;max-width:78ch}
  .ectx .ctx{display:flex;gap:9px;align-items:baseline;font-size:12.5px;line-height:1.45}
  .ectx .cl{flex:0 0 92px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
  .ectx .cl-user{color:#8cc2ff} .ectx .cl-impact{color:var(--prog)} .ectx .cl-sol{color:var(--done)}
  .ectx .cv{color:#c9cfe0}
  .tc-impact{color:#c9a24a;font-size:11.5px;line-height:1.4;margin-top:5px}
  .pill{display:inline-block;border-radius:6px;padding:1px 8px;font-size:12px;font-weight:600;margin-right:5px}
  .pill.done{background:rgba(63,185,80,.16);color:var(--done)}.pill.prog{background:rgba(210,153,34,.16);color:var(--prog)}
  .pill.todo{background:rgba(136,145,165,.14);color:var(--dim)}.pill.tot{background:#222a3c;color:var(--txt)}
  .pill.pol{background:rgba(88,166,255,.16);color:#79c0ff}
  .orgchips{margin-left:6px;color:var(--dim);font-size:12px}
  td.org code,.orgchips code{background:#1f2634;color:#9ecbff;border-radius:5px;padding:1px 6px;font-size:12px}
  .cpy{cursor:pointer;transition:.12s} .cpy:hover{background:#2a3550 !important;color:#c9e0ff !important;outline:1px solid #3b4a6b}
  .cmdblock{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:9px;padding:9px 13px;margin:14px 0 4px;font-size:13px}
  .cmdblock .lbl{color:var(--dim)} .cmdblock code{background:#0d1017;border:1px solid var(--line);color:#9ecbff;border-radius:6px;padding:4px 9px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .cmdblock .hint{color:var(--dim);font-size:11.5px;margin-left:auto}
  .cpybtn{background:var(--accent);color:#08131f;border:none;border-radius:6px;padding:4px 12px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit}
  .cpybtn:hover{filter:brightness(1.08)}
  #toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);background:#1f2634;color:#e7e9f0;border:1px solid #3b4a6b;border-radius:8px;padding:9px 16px;font-size:13px;opacity:0;pointer-events:none;transition:.2s;box-shadow:0 6px 24px rgba(0,0,0,.4);z-index:99}
  #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
  footer{color:var(--dim);font-size:12px;margin-top:16px}
</style></head><body>
  <h1>🛰️ Mission Control</h1>
  <div class="sub">${epics.length} active epics · ${tot.total} tickets · refreshed <b>${esc(stampHuman)}</b> · auto-reloads every ${Math.round(cfg.refresh_seconds / 60)} min</div>
  <div class="cmdblock"><span class="lbl">Open a dev org →</span><code class="cpy" data-copy="sf org open --target-org &lt;orgName&gt;">sf org open --target-org &lt;orgName&gt;</code><button class="cpybtn" data-copy="sf org open --target-org &lt;orgName&gt;">Copy</button><span class="hint">tip: click any org below to copy its real command</span></div>

  <div class="cards">
    <div class="sc"><div class="n">${epics.length}</div><div class="l">Active epics</div></div>
    <div class="sc"><div class="n">${tot.total}</div><div class="l">Tickets</div></div>
    <div class="sc prog"><div class="n">${tot.prog}</div><div class="l">In progress</div></div>
    <div class="sc review"><div class="n">${attention.length}</div><div class="l">In review / PR</div></div>
    <div class="sc done"><div class="n">${tot.done}</div><div class="l">Done</div></div>
    ${todoEpics.length ? `<div class="sc todo"><div class="n">${todoEpics.length}</div><div class="l">To-do epics</div></div>` : ""}
  </div>

  ${attention.length ? `<div class="band"><h2>⚡ Needs your eyes — in review / open PR</h2>
    ${attention.map((t) => `<div class="row"><a class="k" href="${cfg.jira_browse}/${esc(t.key)}">${esc(t.key)}</a>
      <span class="st ${statusClass(t.status)}">${esc(t.status)}</span>
      <span class="t">${esc(t.title)}</span>${t.build ? " " + buildBadge(t) : ""}
      ${t.pr ? `<a class="pr" href="${cfg.pr_base}/${t.pr.number}">PR #${t.pr.number}${t.pr.draft ? " (draft)" : ""}</a>` : ""}
      <span class="ep">· ${esc(t.epicKey)}</span></div>`).join("")}
  </div>` : ""}

  ${sections}

  ${todoSection}

  <footer>🛰️ Generated by the <code>mission-control</code> skill from live Jira + GitHub. Status = Jira; PRs matched by BMS number on the branch. Re-run the skill (or <code>/loop</code> it) to refresh.</footer>
  <div id="toast"></div>
  <script>
    document.addEventListener('click', function(e){
      var el = e.target.closest('[data-copy]'); if(!el) return;
      var cmd = el.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(cmd) : Promise.reject()).catch(function(){
        var ta=document.createElement('textarea'); ta.value=cmd; document.body.appendChild(ta); ta.select();
        try{document.execCommand('copy');}catch(_){} document.body.removeChild(ta);
      });
      var t=document.getElementById('toast'); t.textContent='📋 Copied — '+cmd;
      t.classList.add('show'); clearTimeout(window._t); window._t=setTimeout(function(){t.classList.remove('show');},1700);
    });
  </script>
</body></html>`;

fs.mkdirSync(cfg.out_dir, { recursive: true });
fs.writeFileSync(path.join(cfg.out_dir, "mission-control.html"), html);
const stampFile = (data.stampFile || "snapshot").replace(/[^\dA-Za-z-]/g, "-");
const snapDir = path.join(cfg.out_dir, "Snapshots");
fs.mkdirSync(snapDir, { recursive: true });
fs.writeFileSync(path.join(snapDir, `${stampFile}.html`), html);
const logPath = path.join(cfg.out_dir, "refresh-log.md");
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "# Mission Control refresh log\n\n| When | Epics | Tickets | In progress | Review/PR | Done |\n|------|-------|---------|-------------|-----------|------|\n");
fs.appendFileSync(logPath, `| ${stampHuman} | ${epics.length} | ${tot.total} | ${tot.prog} | ${attention.length} | ${tot.done} |\n`);
console.log(`OK  epics=${epics.length} tickets=${tot.total} inProgress=${tot.prog} review/PR=${attention.length} done=${tot.done}`);
console.log(`HTML: ${path.join(cfg.out_dir, "mission-control.html")}`);
