#!/usr/bin/env node
// Capability Ledger — the durable, append-only inventory of what's BUILT, per product area.
// The anti-reinvention asset: a parts catalog with provenance, NOT a ticket diary.
// Source of truth: Atlas/Ledger/ledger.json  →  { "<OHFY-Package>": [ {cap, ticket, sha, cite, added} ] }
// Only CITED, SHIPPED capabilities belong here (file:line + the merge SHA it was observed at).
//
// Used by:  strata (reads → prior-art push)  ·  synapse weave (surfaces in area hubs)  ·  dev-review (appends at wrap-up)
//
// Commands:
//   node ledger.mjs query --pkg OHFY-WMS [--pkg OHFY-Data-Model]   # prior-art lines for strata
//   node ledger.mjs add --pkg P --cap "…" --ticket BMS-1 --sha abc123 --cite "File.cls:44"
//   node ledger.mjs add-json <file.json>   # array of {pkg,cap,ticket,sha,cite} — for dev-review wrap-up
//   node ledger.mjs render                 # regenerate Atlas/Ledger/<pkg>.md + _LEDGER.md index
//   node ledger.mjs list

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = { vault_me: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer",
  jira_browse: "https://ohanafy.atlassian.net/browse" };
let cfg = { ...DEFAULTS };
const cfgP = path.join(HERE, "config.json");
if (fs.existsSync(cfgP)) cfg = { ...cfg, ...JSON.parse(fs.readFileSync(cfgP, "utf8")) };

const LEDGER_DIR = path.join(cfg.vault_me, "Atlas", "Ledger");
const LEDGER_JSON = path.join(LEDGER_DIR, "ledger.json");
fs.mkdirSync(LEDGER_DIR, { recursive: true });

function load() { return fs.existsSync(LEDGER_JSON) ? JSON.parse(fs.readFileSync(LEDGER_JSON, "utf8")) : {}; }
function save(d) { fs.writeFileSync(LEDGER_JSON, JSON.stringify(d, null, 2)); }
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
function today() { try { return new Date().toISOString().slice(0, 10); } catch { return ""; } }

// parse --flag value pairs
function flags(argv) {
  const o = { pkg: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pkg") o.pkg.push(argv[++i]);
    else if (a.startsWith("--")) o[a.slice(2)] = argv[++i];
  }
  return o;
}

// append one entry, idempotent on (pkg, normalized cap, cite)
function addEntry(d, { pkg, cap, ticket, sha, cite }) {
  if (!pkg || !cap) { console.error("skip: need --pkg and --cap"); return false; }
  d[pkg] = d[pkg] || [];
  const key = norm(cap) + "|" + norm(cite);
  const hit = d[pkg].find((e) => norm(e.cap) + "|" + norm(e.cite) === key);
  if (hit) { // refresh provenance if a newer sighting
    if (sha) hit.sha = sha; if (ticket) hit.ticket = ticket; return false;
  }
  d[pkg].push({ cap, ticket: ticket || "", sha: sha || "", cite: cite || "", added: today() });
  return true;
}

function renderAll(d) {
  const idx = ["# 🧱 Capability Ledger", "", "> The parts catalog. What's already built, per area, with provenance. strata reads this before you design; dev-review appends here at wrap-up. **Cited + shipped only.**", ""];
  const pkgs = Object.keys(d).sort();
  let total = 0;
  for (const pkg of pkgs) {
    const rows = d[pkg] || []; total += rows.length;
    const L = [`---`, `area: ${pkg}`, `kind: capability-ledger`, `tags: [manager-engineer, atlas, ledger]`, `---`, "", `# 🧱 ${pkg} — Capabilities (${rows.length})`, "",
      "> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.", "",
      "| Capability | Ticket | Where (cite) | SHA | Added |", "|---|---|---|---|---|"];
    for (const e of rows.sort((a, b) => (a.added < b.added ? 1 : -1))) {
      const tk = e.ticket ? `[${e.ticket}](${cfg.jira_browse}/${e.ticket})` : "—";
      L.push(`| ${e.cap} | ${tk} | \`${e.cite || "—"}\` | \`${e.sha || "—"}\` | ${e.added || "—"} |`);
    }
    L.push("");
    fs.writeFileSync(path.join(LEDGER_DIR, pkg + ".md"), L.join("\n"));
    idx.push(`- [[Ledger/${pkg}|${pkg}]] — ${rows.length} capabilit${rows.length === 1 ? "y" : "ies"}`);
  }
  idx.push("", `_${total} capabilities across ${pkgs.length} areas · regenerate: \`node ~/.claude/skills/synapse/ledger.mjs render\`_`);
  fs.writeFileSync(path.join(LEDGER_DIR, "_LEDGER.md"), idx.join("\n"));
  return { pkgs: pkgs.length, total };
}

// ---- CLI ----
const [cmd, ...rest] = process.argv.slice(2);
const d = load();

if (cmd === "query") {
  const f = flags(rest);
  const want = f.pkg.length ? f.pkg : Object.keys(d);
  const out = [];
  for (const pkg of want) for (const e of d[pkg] || [])
    out.push(`${pkg} · ${e.cap}${e.ticket ? ` (${e.ticket})` : ""}${e.cite ? ` — ${e.cite}` : ""}${e.sha ? ` @${e.sha}` : ""}`);
  if (!out.length) console.log("(ledger empty for: " + want.join(", ") + ")");
  else out.forEach((l) => console.log(l));
} else if (cmd === "add") {
  const f = flags(rest);
  const added = addEntry(d, { pkg: f.pkg[0], cap: f.cap, ticket: f.ticket, sha: f.sha, cite: f.cite });
  save(d); renderAll(d);
  console.log(added ? `added → ${f.pkg[0]}: ${f.cap}` : `already present (provenance refreshed) → ${f.pkg[0]}: ${f.cap}`);
} else if (cmd === "add-json") {
  const file = rest[0];
  if (!file || !fs.existsSync(file)) { console.error("add-json needs a JSON file (array of {pkg,cap,ticket,sha,cite})"); process.exit(1); }
  const arr = JSON.parse(fs.readFileSync(file, "utf8"));
  let n = 0; for (const e of (Array.isArray(arr) ? arr : arr.entries || [])) if (addEntry(d, e)) n++;
  save(d); const r = renderAll(d);
  console.log(`add-json: +${n} new · ${r.total} total across ${r.pkgs} areas`);
} else if (cmd === "render") {
  const r = renderAll(d); console.log(`ledger rendered — ${r.total} capabilities · ${r.pkgs} areas → ${LEDGER_DIR}`);
} else if (cmd === "list") {
  for (const pkg of Object.keys(d).sort()) { console.log(`\n### ${pkg} (${d[pkg].length})`); d[pkg].forEach((e) => console.log(`  - ${e.cap}  [${e.ticket}] ${e.cite} @${e.sha}`)); }
} else {
  console.log("usage: ledger.mjs query|add|add-json|render|list  (see header)");
}
