#!/usr/bin/env node
// build-overview-scaffold — create the per-EPIC Build-Overview workspace on pickup.
// Accepts EITHER an epic key or a ticket key:
//   - epic key  → that epic's folder.
//   - ticket key → resolves its PARENT EPIC (offline, from mission-control.json) and uses the
//                  epic's folder. A ticket never gets its own folder — it lives under the epic.
// Writes SESSION.md + overview.md + overview.html from templates. IDEMPOTENT (never clobbers).
// Reuses an existing `BMS-<epic>-*` folder if one is already there (no duplicates).
//
// Usage:
//   node scaffold.mjs --key BMS-5625            # ticket → lands in its epic's folder
//   node scaffold.mjs --key BMS-5068            # epic  → its folder
//   node scaffold.mjs --key BMS-5625 --epic BMS-4965   # explicit epic override
//   [--title "…"] [--slug …] [--branch …] [--org …] [--domain "…"]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = {
  build_overview: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Build-Overview",
  templates: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Templates/build-overview",
  mission_control: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Mission-Control/mission-control.json",
  tickets_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Tickets",
  jira_browse: "https://ohanafy.atlassian.net/browse",
};
function loadConfig() {
  const p = path.join(HERE, "config.json");
  let cfg = { ...DEFAULTS };
  if (fs.existsSync(p)) cfg = { ...cfg, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  else fs.writeFileSync(p, JSON.stringify(DEFAULTS, null, 2));
  return cfg;
}
const cfg = loadConfig();

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i]?.replace(/^--/, "");
  if (k) args[k] = process.argv[i + 1] ?? "";
}
if (!args.key || !/^BMS-\d+$/.test(args.key)) { console.error("--key BMS-XXXX is required (epic OR ticket)"); process.exit(1); }

// ---- build epic maps from mission-control.json (offline ticket→epic resolution) ----
const epicTitle = {}; const ticketToEpic = {};
try {
  const d = JSON.parse(fs.readFileSync(cfg.mission_control, "utf8"));
  for (const e of d.epics || []) { epicTitle[e.key] = e.title; for (const t of e.tickets || []) ticketToEpic[t.key] = e.key; }
} catch {}
// fallback: a ticket note's `epic:` frontmatter
function epicFromTicketNote(key) {
  try {
    const f = fs.readdirSync(cfg.tickets_dir).find((n) => n.startsWith(key));
    if (!f) return null;
    const m = fs.readFileSync(path.join(cfg.tickets_dir, f), "utf8").match(/^epic:\s*(BMS-\d+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}

// ---- resolve the epic ----
let epicKey = args.epic;
if (!epicKey) {
  if (epicTitle[args.key]) epicKey = args.key;                 // key IS an epic
  else epicKey = ticketToEpic[args.key] || epicFromTicketNote(args.key); // key is a ticket → parent
}
if (!epicKey) {
  console.error(`Could not resolve the epic for ${args.key} (not found in mission-control.json or ticket notes).`);
  console.error(`Pass it explicitly:  --key ${args.key} --epic BMS-<epic> --title "<epic title>"`);
  process.exit(2);
}
const isTicket = epicKey !== args.key;
const title = args.title || epicTitle[epicKey] || epicKey;
const slug = (args.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

// reuse an existing BMS-<epic>-* folder if present, else create BMS-<epic>-<slug>
fs.mkdirSync(cfg.build_overview, { recursive: true });
const existing = fs.readdirSync(cfg.build_overview, { withFileTypes: true })
  .find((e) => e.isDirectory() && e.name.startsWith(epicKey + "-"));
const dirName = existing ? existing.name : `${epicKey}-${slug}`;
const dir = path.join(cfg.build_overview, dirName);
fs.mkdirSync(dir, { recursive: true });

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const vals = { KEY: epicKey, TITLE: title, SLUG: slug, DATE: date,
  JIRA: `${cfg.jira_browse}/${epicKey}`, BRANCH: args.branch || "TBD", ORG: args.org || "TBD", DOMAIN: args.domain || "TBD" };
const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] ?? `{{${k}}}`);

const created = [], skipped = [];
for (const f of ["SESSION.md", "overview.md", "overview.html"]) {
  const dest = path.join(dir, f);
  if (fs.existsSync(dest)) { skipped.push(f); continue; }
  const tpl = path.join(cfg.templates, f);
  if (!fs.existsSync(tpl)) { console.error(`missing template: ${tpl}`); continue; }
  fs.writeFileSync(dest, fill(fs.readFileSync(tpl, "utf8")));
  created.push(f);
}

console.log(`${isTicket ? `Ticket ${args.key} → parent epic ${epicKey}` : `Epic ${epicKey}`}`);
console.log(`Workspace: ${dir}${existing ? "  (reused existing folder)" : "  (new folder)"}`);
console.log(`  created: ${created.join(", ") || "(none — all present)"}`);
if (skipped.length) console.log(`  kept existing: ${skipped.join(", ")}`);
