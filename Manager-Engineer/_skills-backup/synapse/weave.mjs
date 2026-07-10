#!/usr/bin/env node
// synapse — weave logged work into an Obsidian connection web.
// Scans the Manager-Engineer vault for what's LOGGED (tickets, epics, build-overview notes),
// links each PRODUCT AREA (OHFY-Split package) to the tickets/epics that touch it, and writes
// Obsidian-native connective tissue: area hub notes (wikilinked → graph + backlinks), a master
// MAP MOC, and a Base. Enriches ticket meta from Mission Control.
//
// Usage: node weave.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = {
  vault_me: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer",
  jira_browse: "https://ohanafy.atlassian.net/browse",
  mission_control: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Mission-Control/mission-control.json",
};
function loadConfig() {
  const p = path.join(HERE, "config.json");
  let cfg = { ...DEFAULTS };
  if (fs.existsSync(p)) cfg = { ...cfg, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  else fs.writeFileSync(p, JSON.stringify(DEFAULTS, null, 2));
  return cfg;
}
const cfg = loadConfig();

// product areas (OHFY-Split packages) → human label. UI variants fold under their domain.
const AREAS = {
  "OHFY-Data-Model": "Data Model — objects, fields, schema (Tier-0, everything sits on it)",
  "OHFY-PLTFM": "Platform — inventory/replenishment, safety stock, thresholds",
  "OHFY-PLTFM-UI": "Platform UI — inventory config screens",
  "OHFY-OMS": "Order Management — orders, delivery, AR / short-pay",
  "OHFY-OMS-UI": "OMS UI — driver & sales-rep screens",
  "OHFY-WMS": "Warehouse — picking, shift-end, breakage, capacity",
  "OHFY-WMS-UI": "Warehouse UI — supervisor & picker screens",
  "OHFY-eCommerce": "eCommerce — storefront, cart, notifications",
  "OHFY-eCommerce-UI": "eCommerce UI — storefront screens",
  "OHFY-REX": "REX — routing / execution engine",
  "OHFY-REX-UI": "REX UI",
  "OHFY-Utilities": "Utilities — shared services & helpers",
};
const areaKeys = Object.keys(AREAS);

// ---- Mission Control ticket meta ----
const mc = {}; const epicMeta = {};
try {
  const d = JSON.parse(fs.readFileSync(cfg.mission_control, "utf8"));
  for (const e of d.epics || []) {
    epicMeta[e.key] = { title: e.title, domain: e.domain };
    for (const t of e.tickets || []) mc[t.key] = { ...t, epic: e.key };
  }
} catch {}

// ---- scan logged notes ----
const idx = {}; areaKeys.forEach((a) => (idx[a] = { notes: new Map(), tickets: new Set(), epics: new Set(), mentions: new Set() }));
const excludes = ["Atlas", "Templates", "_skills-backup", ".obsidian", "node_modules", "Snapshots"];
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludes.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith(".md")) acc.push(full);
  }
  return acc;
}
const files = walk(cfg.vault_me);
const bmsRe = /BMS-(\d{3,4})/g;
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  const base = path.basename(f, ".md");
  const fm = txt.startsWith("---") ? txt.slice(3, Math.max(3, txt.indexOf("\n---", 3))) : "";
  // packages_touched (yaml inline list or block)
  const pm = fm.match(/packages_touched:\s*(\[[^\]]*\]|(?:\n\s*-\s*.+)+)/);
  let pkgs = [];
  if (pm) {
    if (pm[1].startsWith("[")) pkgs = pm[1].replace(/[[\]]/g, "").split(",").map((s) => s.trim());
    else pkgs = pm[1].split("\n").map((s) => s.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  }
  pkgs = pkgs.map((p) => p.replace(/['"]/g, "")).filter((p) => areaKeys.includes(p));
  const isTicket = /^ticket:/m.test(fm) || /^BMS-\d/.test(base);
  const isEpic = /tags:[\s\S]*epic/.test(fm) || /^epic:/m.test(fm) && /Epics\//.test(f);
  const selfKey = (base.match(/BMS-\d{3,4}/) || [])[0] || (fm.match(/^ticket:\s*(BMS-\d+)/m) || [])[1] || (fm.match(/^epic:\s*(BMS-\d+)/m) || [])[1];
  const refs = [...txt.matchAll(bmsRe)].map((m) => "BMS-" + m[1]);
  for (const a of pkgs) {
    idx[a].notes.set(base, { key: selfKey, isTicket, path: f });
    if (selfKey) (isTicket ? idx[a].tickets : idx[a].epics).add(selfKey);
  }
  // secondary: body mentions of an area name in a note that didn't declare it
  for (const a of areaKeys) if (!pkgs.includes(a) && txt.includes(a)) idx[a].mentions.add(base);
}

// ---- render helpers ----
const esc = (s) => String(s ?? "");
const areaFile = (a) => a; // note basename = area key
const tLink = (key) => {
  const m = mc[key];
  const st = m ? ` — \`${m.status}\`${m.org ? " · " + m.org : ""}${m.pr ? " · [#" + m.pr.number + "](" + "https://github.com/Ohanafy/OHFY-Split/pull/" + m.pr.number + ")" : ""}` : "";
  const title = m?.title ? " " + m.title : "";
  return `- [${key}](${cfg.jira_browse}/${key})${title}${st}`;
};

fs.mkdirSync(path.join(cfg.vault_me, "Atlas", "Areas"), { recursive: true });

// ---- capability ledger (durable, append-only; surfaced per area — see ledger.mjs) ----
const ledgerPath = path.join(cfg.vault_me, "Atlas", "Ledger", "ledger.json");
const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, "utf8")) : {};

// ---- area hub notes ----
let hit = 0, cold = [];
for (const a of areaKeys) {
  const it = idx[a];
  const tickets = [...it.tickets].sort();
  const epics = [...it.epics].sort();
  const noteLinks = [...it.notes.keys()].filter((b) => b !== a);
  if (tickets.length || epics.length || noteLinks.length) hit++; else cold.push(a);
  const L = [];
  L.push("---");
  L.push("tags: [atlas, area]");
  L.push(`area: ${a}`);
  L.push(`ticket_count: ${tickets.length}`);
  L.push("---");
  L.push(`# 🗺️ ${a}`);
  L.push(`> ${AREAS[a]}`);
  L.push("");
  L.push(`**Repo:** \`OHFY-Split/${a}\` · rules + DoD live in \`${a}/CLAUDE.md\`.`);
  L.push("");
  L.push(`## 🎟️ Tickets that touch this area (${tickets.length})`);
  L.push(tickets.length ? tickets.map(tLink).join("\n") : "_None logged yet._");
  L.push("");
  if (epics.length) { L.push(`## 📦 Epics`); L.push(epics.map((k) => `- [[${findEpicNote(k) || k}]] ${epicMeta[k]?.title || ""}`).join("\n")); L.push(""); }
  if (noteLinks.length) { L.push(`## 🔗 Logged notes here`); L.push(noteLinks.map((b) => `- [[${b}]]`).join("\n")); L.push(""); }
  const caps = ledger[a] || [];
  L.push(`## 🧱 Capabilities already built here (${caps.length})`);
  if (caps.length) {
    L.push("_Reach for these before building — the anti-reinvention catalog (cited + shipped). Full table: [[Ledger/" + a + "]]._");
    L.push(caps.slice().sort((x, y) => (x.added < y.added ? 1 : -1)).map((e) => `- **${e.cap}**${e.ticket ? ` (${e.ticket})` : ""} — \`${e.cite || "—"}\``).join("\n"));
  } else {
    L.push("_None catalogued yet. As tickets ship here, `/dev-review` appends confirmed capabilities to the ledger._");
  }
  L.push("");
  L.push("## 🕸️ See the web");
  L.push("Open **Graph View** and filter `tag:#area` — this note is a hub; its links are the tickets/epics that hit this part of the product. Backlinks (bottom of pane) show everything pointing here.");
  fs.writeFileSync(path.join(cfg.vault_me, "Atlas", "Areas", a + ".md"), L.join("\n"));
}

function findEpicNote(key) {
  const hit = files.find((f) => path.basename(f).startsWith(key) && f.includes("/Epics/"));
  return hit ? path.basename(hit, ".md") : null;
}

// ---- master MAP ----
const M = [];
M.push("---"); M.push("tags: [atlas, moc]"); M.push("---");
M.push("# 🗺️ Product Atlas — where your work lives");
M.push("> Every product **area** (OHFY-Split package) ↔ the **tickets/epics** that hit it. The connective tissue of your build — use it to context-switch: pick an area, see everything you've touched there.");
M.push("");
M.push("## Coverage");
M.push(`**${hit}/${areaKeys.length}** areas have logged work. ${cold.length ? "Untouched: " + cold.map((a) => `[[${a}]]`).join(", ") : "Every area has activity."}`);
M.push("");
M.push("## Areas");
M.push("| Area | What it is | Tickets |");
M.push("|------|------------|---------|");
for (const a of areaKeys) M.push(`| [[${a}]] | ${AREAS[a].split(" — ")[1] || AREAS[a]} | ${idx[a].tickets.size || "—"} |`);
M.push("");
M.push("## Area → Epic map");
M.push("```mermaid");
M.push("graph LR");
for (const a of areaKeys) {
  const eps = [...idx[a].epics];
  if (!eps.length) continue;
  const an = a.replace(/-/g, "_");
  M.push(`  ${an}["${a}"]`);
  for (const e of eps) M.push(`  ${an} --> ${e.replace(/-/g, "_")}["${e} ${(epicMeta[e]?.title || "").slice(0, 22)}"]`);
}
M.push("```");
M.push("");
M.push("## How to use this (context-switching)");
M.push("1. **Jumping into an area?** Open its `[[area]]` note — every ticket you've touched there, with status + org + PR.");
M.push("2. **Graph View** (`tag:#area`) → the visual web. Clusters = where your work concentrates.");
M.push("3. **[[atlas]]** Base → group/filter all notes by area.");
M.push("4. Re-weave anytime: `/synapse` (or \"connect my work\").");
fs.writeFileSync(path.join(cfg.vault_me, "Atlas", "_MAP.md"), M.join("\n"));

// ---- Base: group notes by area (packages_touched) ----
const base = `filters:
  and:
    - file.inFolder("Manager-Engineer")
    - file.ext == "md"
    - 'packages_touched != null'
properties:
  file.link:
    displayName: Note
  packages_touched:
    displayName: Area(s)
  status:
    displayName: Status
  epic:
    displayName: Epic
views:
  - type: table
    name: 🗺️ By area
    order: [file.link, packages_touched, status, epic]
    columnSize:
      file.link: 320
      packages_touched: 260
      status: 120
`;
fs.writeFileSync(path.join(cfg.vault_me, "Atlas", "atlas.base"), base);

console.log(`synapse woven — ${hit}/${areaKeys.length} areas active · ${files.length} notes scanned`);
console.log(`areas with tickets: ${areaKeys.filter((a) => idx[a].tickets.size).map((a) => a + "(" + idx[a].tickets.size + ")").join(", ") || "none"}`);
console.log(`→ ${path.join(cfg.vault_me, "Atlas", "_MAP.md")}`);
