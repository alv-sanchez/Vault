#!/usr/bin/env node
// strata — code-verified orientation brief renderer.
// Two modes, auto-detected from the JSON:
//   • TICKET mode  — a single ticket brief (no `children`).
//   • EPIC mode    — `children:[…]` present → epic thesis + shared "bedrock" + a child-by-child walk,
//                    each child its own oriented block (thesis · why · delta · watch-out).
// Enforces the honesty rules VISUALLY in both:
//   - a "standing on" claim with no `cite` is flagged ⚠ uncited (never silently trusted)
//   - every `why` carries a source tag; [inferred] renders amber
//   - the SHA the archaeology ran against + the search scope are stamped on the page
//
// Usage: node render.mjs <orientation.json> [outDir]   (outDir defaults to the json's folder)

import fs from "node:fs";
import path from "node:path";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonPath = process.argv[2];
if (!jsonPath || !fs.existsSync(jsonPath)) { console.error("Usage: node render.mjs <orientation.json> [outDir]"); process.exit(1); }
const d = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const outDir = process.argv[3] || path.dirname(path.resolve(jsonPath));
const JIRA = "https://ohanafy.atlassian.net/browse";
const isEpic = Array.isArray(d.children) && d.children.length > 0;

// ---- shared fragment helpers (used by epic-level AND per-child) ----
const srcTag = (s) => {
  const k = (s || "inferred").toLowerCase();
  const cls = k.startsWith("infer") ? "src-infer" : (k === "jira" ? "src-jira" : (k === "commit" ? "src-commit" : "src-code"));
  const label = k.startsWith("infer") ? "inferred · not in code" : k;
  return `<span class="srctag ${cls}">${esc(label)}</span>`;
};
const verdictTag = (v) => {
  const k = (v || "").toLowerCase();
  const cls = k === "reuse" ? "vd-reuse" : (k === "extend" ? "vd-extend" : "vd-build");
  return `<span class="vd ${cls}">${esc(v || "build")}</span>`;
};
const statusPill = (s) => s ? `<span class="stt st-${(s || "").toLowerCase().replace(/[^a-z]/g, "")}">${esc(s)}</span>` : "";
const whyUl = (why = []) => `<ul>${why.length ? why.map((w) => `<li>${esc(w.text)} ${srcTag(w.source)}</li>`).join("") : "<li class='dim'>(no why captured)</li>"}</ul>`;
const standingUl = (so = []) => `<ul class="exist-block">${so.length ? so.map((s) => `<li><b style="color:#c9d4e8">${esc(s.cap)}</b>${s.ticket ? ` <a href="${JIRA}/${esc(s.ticket)}" class="tk">${esc(s.ticket)}</a>` : ""} ${s.cite ? `<span class="cite">${esc(s.cite)}</span>` : `<span class="uncited">⚠ uncited — verify</span>`}</li>`).join("") : "<li>(nothing relevant found — see scope)</li>"}</ul>`;
const deltaUl = (dl = []) => `<ul class="delta-block">${dl.length ? dl.map((x) => `<li>${verdictTag(x.verdict)}<b>${esc(x.change)}</b>${x.impact ? ` — ${esc(x.impact)}` : ""}</li>`).join("") : "<li>(no delta captured)</li>"}</ul>`;
const watchUl = (w = []) => `<ul>${w.length ? w.map((x) => `<li>${esc(x)}</li>`).join("") : "<li class='dim'>(none flagged)</li>"}</ul>`;
const shapeBox = (s) => `<div class="shape">${esc(s || "(no data-flow captured)")}</div>`;

// ---- per-child block (epic mode) ----
const childBlock = (c, i) => `<section class="child" id="c-${esc(c.key)}">
    <div class="chead"><span class="cnum">${i + 1}</span>
      <a class="ckey" href="${JIRA}/${esc(c.key)}">${esc(c.key)}</a>
      <b class="ctitle">${esc(c.title || "")}</b>${statusPill(c.status)}</div>
    <div class="cthesis">${esc(c.thesis || "_(no thesis — dig before building)_")}</div>
    <div class="cgrid">
      <div class="cbox"><h4 class="delta">🔨 Delta — what this child adds</h4>${deltaUl(c.delta)}</div>
      <div class="cbox"><h4 class="why">🎯 Why</h4>${whyUl(c.why)}</div>
    </div>
    ${(c.standingOn && c.standingOn.length) ? `<div class="cbox"><h4 class="exist">🏛️ Child-specific prior art</h4>${standingUl(c.standingOn)}</div>` : ""}
    ${c.shape ? `<div class="cbox"><h4 class="shape">🧭 Shape</h4>${shapeBox(c.shape)}</div>` : ""}
    ${(c.watchOut && c.watchOut.length) ? `<div class="cbox"><h4 class="warn">⚠️ Watch out</h4>${watchUl(c.watchOut)}</div>` : ""}
  </section>`;

const searched = d.searched || {};
const searchedLine = `<b>packages:</b> ${esc((searched.packages || d.packages || []).join(", ") || "—")} · <b>terms:</b> ${esc((searched.terms || []).join(", ") || "—")}`;
const ledgerBlock = (d.ledgerHits && d.ledgerHits.length) ? `<div class="ledger"><div class="lh">↩ prior art pushed from the capability ledger</div><ul>${d.ledgerHits.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : "";

// ---------- Markdown ----------
const mdChild = (c, i) => `\n### ${i + 1}. ${c.key} — ${c.title || ""}  ${c.status ? `\`${c.status}\`` : ""}
> **Thesis:** ${c.thesis || "_(none)_"}

**🔨 Delta:**
${(c.delta || []).length ? c.delta.map((x) => `- [${(x.verdict || "build").toUpperCase()}] **${x.change}**${x.impact ? ` — ${x.impact}` : ""}`).join("\n") : "- _(none captured)_"}

**🎯 Why:** ${(c.why || []).map((w) => `${w.text} \`[${w.source || "inferred"}]\``).join(" · ") || "_(none)_"}
${(c.standingOn && c.standingOn.length) ? `\n**🏛️ Child-specific prior art:**\n${c.standingOn.map((s) => `- **${s.cap}** — \`${s.cite || "⚠ uncited"}\``).join("\n")}` : ""}${(c.watchOut && c.watchOut.length) ? `\n**⚠️ Watch out:** ${c.watchOut.join(" · ")}` : ""}
`;
const md = `---
key: ${d.key || ""}
kind: strata-orientation${isEpic ? "-epic" : ""}
repo: ${d.repo || "OHFY-Split"}
verified_at_sha: ${d.sha || "UNKNOWN"}
generated: ${d.generated || ""}
packages_touched: [${(d.packages || []).map((p) => `"${p}"`).join(", ")}]
${isEpic ? `children: [${d.children.map((c) => `"${c.key}"`).join(", ")}]` : ""}
tags: [manager-engineer, strata, orientation${isEpic ? ", epic" : ""}]
---

# 🪨 Orientation${isEpic ? " (epic)" : ""} — ${d.key || ""} ${d.title || ""}

> **Thesis:** ${d.thesis || "_(missing — a brief without a one-line thesis is not oriented)_"}
> _Code-verified against \`${d.repo || "OHFY-Split"}\` @ \`${d.sha || "UNKNOWN"}\` · ${d.generated || ""}_

## 🎯 Why now
${(d.why || []).length ? d.why.map((w) => `- ${w.text}  \`[${w.source || "inferred"}]\``).join("\n") : "- _(no why captured)_"}

## 🏛️ Bedrock — what already exists (shared across the epic)
${(d.standingOn || []).length ? d.standingOn.map((s) => `- **${s.cap}**${s.ticket ? ` (${s.ticket})` : ""} — \`${s.cite || "⚠ UNCITED — verify"}\``).join("\n") : "- _(nothing relevant found — see scope)_"}
${(d.ledgerHits && d.ledgerHits.length) ? `\n**From the capability ledger:**\n${d.ledgerHits.map((l) => `- ${l}`).join("\n")}` : ""}
${d.shape ? `\n## 🧭 Shape\n\`${d.shape}\`` : ""}
${isEpic
  ? `\n## 🧱 The children — understood one by one\n${d.children.map(mdChild).join("\n")}`
  : `\n## 🔨 The delta — what THIS ticket adds\n${(d.delta || []).length ? d.delta.map((x) => `- [${(x.verdict || "build").toUpperCase()}] **${x.change}**${x.impact ? ` — ${x.impact}` : ""}`).join("\n") : "- _(no delta captured)_"}`}

## ⚠️ Watch out (epic-level)
${(d.watchOut || []).length ? d.watchOut.map((w) => `- ${w}`).join("\n") : "- _(none flagged)_"}

---
_Honesty: reports only what was searched — packages: ${(searched.packages || d.packages || []).join(", ") || "—"} · terms: ${(searched.terms || []).join(", ") || "—"}. Absence = **not searched**, not **doesn't exist**. Every prior-art claim is cited to \`file:line\`/SHA or flagged uncited. "Why" is tagged by source; \`inferred\` = not confirmed in code. Regenerate — pinned to \`${d.sha || "UNKNOWN"}\`._
`;
fs.writeFileSync(path.join(outDir, "orientation.md"), md);

// ---------- HTML ----------
const childNav = isEpic ? `<div class="nav">${d.children.map((c, i) => `<a href="#c-${esc(c.key)}">${i + 1}·${esc(c.key)}</a>`).join("")}</div>` : "";
const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orientation — ${esc(d.key)} ${esc(d.title)}</title>
<style>
  :root{--bg:#0d1017;--card:#151925;--card2:#1a1f2e;--line:#252b3b;--txt:#e7e9f0;--dim:#8891a5;
    --why:#f0883e;--exist:#58a6ff;--delta:#3fb950;--warn:#d29922;--accent:#58a6ff;--infer:#d29922}
  *{box-sizing:border-box}
  body{margin:0 auto;max-width:920px;background:var(--bg);color:var(--txt);padding:32px 22px;
    font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  h1{font-size:22px;margin:0 0 4px}.key{color:var(--accent)}.key a{color:var(--accent);text-decoration:none}
  .stamp{color:var(--dim);font-size:12px;margin:0 0 8px}.stamp code{background:#1f2634;color:#9ecbff;border-radius:4px;padding:1px 6px}
  .pkgs{margin:0 0 4px}.pkgs code{background:#1f2634;color:#9ecbff;border-radius:4px;padding:1px 7px;font-size:12px;margin-right:5px}
  .thesis{background:linear-gradient(180deg,#161b27,#12151d);border:1px solid var(--line);border-left:4px solid var(--accent);
    border-radius:12px;padding:15px 18px;margin:12px 0 18px;font-size:17px;line-height:1.5}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin:22px 0 9px}
  h2.why{color:var(--why)}h2.exist{color:var(--exist)}h2.delta{color:var(--delta)}h2.shape{color:var(--accent)}h2.warn{color:var(--warn)}h2.kids{color:var(--txt)}
  h4{font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}
  h4.why{color:var(--why)}h4.exist{color:var(--exist)}h4.delta{color:var(--delta)}h4.shape{color:var(--accent)}h4.warn{color:var(--warn)}
  ul{margin:6px 0;padding-left:2px;list-style:none}
  li{margin:6px 0;padding-left:15px;position:relative}
  li::before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:var(--dim)}
  .exist-block li{color:#aab2c6}.exist-block li::before{background:var(--exist)}
  .cite{background:#141a24;color:#7fb0e6;border-radius:4px;padding:1px 6px;font-size:11.5px;font-family:ui-monospace,Menlo,monospace}
  .uncited{background:rgba(248,81,73,.14);color:#f8968f;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600}
  .tk{color:var(--dim);text-decoration:none;font-size:12px}
  .delta-block li{color:#e7e9f0}.delta-block li::before{background:var(--delta);width:6px;height:6px;top:8px}
  .delta-block b{color:#fff}
  .vd{display:inline-block;border-radius:5px;padding:0 7px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-right:6px}
  .vd-build{background:rgba(63,185,80,.18);color:#6fe08a}.vd-extend{background:rgba(88,166,255,.16);color:#89bcff}.vd-reuse{background:rgba(136,145,165,.16);color:#aab2c6}
  .srctag{display:inline-block;border-radius:5px;padding:0 6px;font-size:10.5px;font-weight:600;margin-left:5px}
  .src-jira{background:rgba(88,166,255,.14);color:#89bcff}.src-commit{background:rgba(163,113,247,.16);color:#c4a5f5}
  .src-code{background:rgba(63,185,80,.14);color:#6fe08a}.src-infer{background:rgba(210,153,34,.16);color:#e3b95f}
  .shape{background:var(--card2);border:1px solid var(--line);border-radius:9px;padding:11px 14px;font-family:ui-monospace,Menlo,monospace;font-size:13.5px;color:#9ecbff;overflow-x:auto}
  .ledger{background:rgba(88,166,255,.05);border:1px dashed #2c3346;border-radius:9px;padding:8px 14px;margin-top:8px}
  .ledger .lh{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
  .nav{position:sticky;top:0;background:rgba(13,16,23,.92);backdrop-filter:blur(6px);padding:9px 0;margin:6px 0 4px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--line);z-index:5}
  .nav a{font-size:11.5px;color:var(--dim);text-decoration:none;background:var(--card2);border:1px solid var(--line);border-radius:6px;padding:2px 8px}
  .nav a:hover{color:var(--accent);border-color:#3b4a6b}
  section.child{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:12px 0}
  .chead{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:7px}
  .cnum{width:22px;height:22px;border-radius:50%;background:var(--card2);border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:var(--dim);flex-shrink:0}
  .ckey{color:var(--accent);text-decoration:none;font-weight:700;font-variant-numeric:tabular-nums}
  .ctitle{font-weight:600}
  .cthesis{background:#12151d;border-left:3px solid var(--accent);border-radius:7px;padding:8px 12px;margin:2px 0 11px;font-size:14.5px;color:#dbe2f0}
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:640px){.cgrid{grid-template-columns:1fr}}
  .cbox{margin-top:10px}.cgrid .cbox{margin-top:0}
  .stt{display:inline-block;padding:1px 8px;border-radius:11px;font-size:11px;font-weight:600}
  .st-inprogress{background:rgba(210,153,34,.18);color:var(--warn)}.st-review{background:rgba(163,113,247,.18);color:#c4a5f5}
  .st-done{background:rgba(63,185,80,.18);color:var(--delta)}.st-backlog,.st-todo,.st-needsrefinement{background:rgba(136,145,165,.14);color:var(--dim)}
  .honesty{margin-top:22px;border-top:1px solid var(--line);padding-top:12px;color:var(--dim);font-size:12px;line-height:1.5}
  .honesty code{background:#1f2634;color:#9ecbff;border-radius:4px;padding:1px 5px}
</style></head><body>
  <h1>🪨 Orientation${isEpic ? " · epic" : ""} — <span class="key"><a href="${JIRA}/${esc(d.key)}">${esc(d.key)}</a></span> ${esc(d.title)}</h1>
  <p class="stamp">Code-verified against <code>${esc(d.repo || "OHFY-Split")}</code> @ <code>${esc(d.sha || "UNKNOWN")}</code> · ${esc(d.generated || "")}${isEpic ? ` · ${d.children.length} children` : ""}</p>
  <p class="pkgs">${(d.packages || []).map((p) => `<code>${esc(p)}</code>`).join("")}</p>

  <div class="thesis">${esc(d.thesis || "(missing thesis)")}</div>

  <h2 class="why">🎯 Why now</h2>
  ${whyUl(d.why)}

  <h2 class="exist">🏛️ Bedrock — what already exists${isEpic ? " (shared across the epic)" : ", reuse don't rebuild"}</h2>
  ${standingUl(d.standingOn)}
  ${ledgerBlock}

  ${d.shape ? `<h2 class="shape">🧭 Shape</h2>${shapeBox(d.shape)}` : ""}

  ${isEpic
    ? `<h2 class="kids">🧱 The children — understood one by one</h2>${childNav}${d.children.map(childBlock).join("")}`
    : `<h2 class="delta">🔨 The delta — what THIS ticket adds</h2>${deltaUl(d.delta)}`}

  <h2 class="warn">⚠️ Watch out${isEpic ? " (epic-level)" : ""}</h2>
  ${watchUl(d.watchOut)}

  <div class="honesty">
    <b>Honesty contract.</b> Reports only what was searched — ${searchedLine}.
    Absence = <b>not searched</b>, not <b>doesn't exist</b>. Every prior-art claim is cited to <code>file:line</code>/SHA or flagged <span class="uncited">⚠ uncited</span>. "Why" is tagged by source; <span class="srctag src-infer">inferred</span> = not confirmed in code.
    Pinned to <code>${esc(d.sha || "UNKNOWN")}</code> — <b>regenerate, don't trust stale.</b>
  </div>
</body></html>`;
fs.writeFileSync(path.join(outDir, "orientation.html"), html);

console.log(`strata OK — ${d.key}${isEpic ? ` (epic · ${d.children.length} children)` : ""} · ${(d.standingOn || []).length} bedrock · ${isEpic ? d.children.reduce((n, c) => n + (c.delta || []).length, 0) + " child-deltas" : (d.delta || []).length + " delta"} · @${d.sha || "?"}`);
console.log(`  ${path.join(outDir, "orientation.md")}`);
console.log(`  ${path.join(outDir, "orientation.html")}`);
