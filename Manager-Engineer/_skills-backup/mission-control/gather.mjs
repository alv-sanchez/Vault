#!/usr/bin/env node
// Mission Control — enrichment gatherer.
// Input:  <out_dir>/mission-control.base.json  — epics + tickets from Jira (status only), no org/pr.
//         Shape: { generated, stampFile, epics:[ {key,title,domain,phase,pinned,summary,
//                    tickets:[ {key,title,type,status,statusCategory} ] } ] }
// Does:   attaches each ticket's PR (via `gh`) and dev org (via `sf`) DETERMINISTICALLY, then
//         writes <out_dir>/mission-control.json (what render.mjs draws).
// Why:    the PR/org join is the error-prone part when done by hand — this makes it code.
//
// Usage: node gather.mjs [base.json]

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS = {
  out_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Mission-Control",
  epics_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Epics",
  gh_repo: "Ohanafy/OHFY-Split",
  org_prefix: "ohfy-val-", // scratch-org alias convention: <prefix><bmsNumber> (fallback only)
};
function loadConfig() {
  const p = path.join(HERE, "config.json");
  let cfg = { ...DEFAULTS };
  if (fs.existsSync(p)) cfg = { ...cfg, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  return cfg;
}
const cfg = loadConfig();
const sh = (c, a) => { try { return execFileSync(c, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); } catch (e) { return e.stdout || ""; } };
const num = (k) => { const m = String(k).match(/(\d{3,4})/); return m ? m[1] : null; };
const hasBms = (s, n) => new RegExp("bms[-_ ]?" + n + "(?!\\d)", "i").test(String(s || ""));

const basePath = process.argv[2] || path.join(cfg.out_dir, "mission-control.base.json");
if (!fs.existsSync(basePath)) { console.error(`No base file at ${basePath}. Jira step must write it first.`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(basePath, "utf8"));

// ---- PRs (any state) ----
let prs = [];
try {
  prs = JSON.parse(sh("gh", ["pr", "list", "--repo", cfg.gh_repo, "--state", "all", "--limit", "300",
    "--json", "number,title,headRefName,state,isDraft"]));
} catch { console.error("gh pr list failed — PRs will be empty"); }
// Does PR p reference ticket number n? Handles multi-ticket titles like
// "BMS-4217/5636/5638" where only the first carries the BMS- prefix.
function matchesPR(n, p) {
  const hay = p.headRefName + " " + p.title;
  if (hasBms(hay, n)) return true; // explicit bms-<n> in branch or title
  // bare <n> token inside a BMS-tagged title (slashed/plus/comma lists)
  if (/bms[-_ ]?\d{3,4}/i.test(p.title) && new RegExp("(?<!\\d)" + n + "(?!\\d)").test(p.title)) return true;
  return false;
}
// ticket number -> best PR (prefer OPEN, then highest number)
function prFor(ticketNum) {
  const hits = prs.filter((p) => matchesPR(ticketNum, p));
  if (!hits.length) return null;
  hits.sort((a, b) => (a.state === "OPEN" ? -1 : 1) - (b.state === "OPEN" ? -1 : 1) || b.number - a.number);
  const p = hits[0];
  return { number: p.number, state: p.state.toLowerCase(), draft: !!p.isDraft };
}

// ---- Orgs ----
const orgAliases = new Set();
try {
  const r = JSON.parse(sh("sf", ["org", "list", "--json"]).replace(/^[^{]*/, ""));
  (r.result?.scratchOrgs || []).forEach((o) => o.alias && orgAliases.add(o.alias));
  (r.result?.nonScratchOrgs || []).forEach((o) => o.alias && orgAliases.add(o.alias));
} catch { console.error("sf org list failed — orgs will be empty"); }
const orgExists = (n) => n && orgAliases.has(cfg.org_prefix + n);

// ---- AUTHORITATIVE org source: the epic note's `org:` / `claimed_orgs:` frontmatter ----
// You maintain this per keep-orgs-till-merge; it records swaps/releases and non-convention names
// (e.g. `shortStock`). RELEASED entries are excluded. This wins over the alias convention.
const epicOrgCache = {};
function epicOrgs(epicKey) {
  if (epicOrgCache[epicKey]) return epicOrgCache[epicKey];
  let active = [], primary = null;
  try {
    let file = null;
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f);
        else if (e.name.startsWith(epicKey + "-") && e.name.endsWith(".md")) file = f;
      }
    })(cfg.epics_dir);
    if (file) {
      const txt = fs.readFileSync(file, "utf8");
      const fm = txt.startsWith("---") ? txt.slice(3, Math.max(3, txt.indexOf("\n---", 3))) : "";
      const clean = (v) => { v = (v || "").split(" #")[0].trim().replace(/^["']|["']$/g, ""); return (!v || v.startsWith("#")) ? "" : v; };
      const aliasOf = (item) => item.trim().replace(/^["']/, "").split(/[\s—:"]/)[0].trim();
      let cur = null;
      for (const line of fm.split("\n")) {
        const m = line.match(/^(\w+):\s*(.*)$/);
        if (m) { const k = m[1]; if (k === "org") { cur = "orgs"; const v = clean(m[2]); if (v) { primary = v; active.push(v); } } else if (k === "claimed_orgs") { cur = "orgs"; } else cur = null; continue; }
        const lm = line.match(/^\s+-\s*(.+)$/);
        if (lm && cur === "orgs") { if (!/released/i.test(lm[1])) { const a = aliasOf(lm[1]); if (a) active.push(a); } }
        else if (/^\S/.test(line)) cur = null;
      }
    }
  } catch {}
  active = [...new Set(active)];
  if (!primary) primary = active[0] || null;
  return (epicOrgCache[epicKey] = { active, primary });
}

// Org for a ticket: (1) epic note's claimed orgs — alias matching the ticket#, else the epic#,
// else the primary; (2) fallback to the ohfy-val-<num> convention only if the note records none.
function orgFor(ticketNum, epicNum, epicKey, pr) {
  const eo = epicOrgs(epicKey);
  if (eo.active.length) {
    return eo.active.find((a) => a.includes(ticketNum)) || eo.active.find((a) => a.includes(epicNum)) || eo.primary;
  }
  if (orgExists(ticketNum)) return cfg.org_prefix + ticketNum;
  if (orgExists(epicNum)) return cfg.org_prefix + epicNum;
  if (pr) { const bn = num(prs.find((p) => p.number === pr.number)?.headRefName || ""); if (orgExists(bn)) return cfg.org_prefix + bn; }
  return null;
}

// ---- enrich ----
let tCount = 0, prCount = 0, orgCount = 0, expiredCount = 0;
// Enrich active epics AND any to-do epics that carry an expanded ticket tree.
for (const epic of [...(data.epics || []), ...(data.todoEpics || [])]) {
  const epicNum = num(epic.key);
  for (const t of epic.tickets || []) {
    const tn = num(t.key);
    if (!t.build && /spike/i.test(t.type || "")) t.build = "Spike"; // fallback; base pull sets UI/Backend/Both/Docs
    t.pr = prFor(tn);
    t.org = orgFor(tn, epicNum, epic.key, t.pr);
    t.orgLive = t.org ? orgAliases.has(t.org) : null; // false = claimed but not in current sf auth (expired/other machine)
    tCount++; if (t.pr) prCount++; if (t.org) orgCount++; if (t.org && !t.orgLive) expiredCount++;
  }
}

fs.writeFileSync(path.join(cfg.out_dir, "mission-control.json"), JSON.stringify(data, null, 2));
console.log(`gather OK — ${data.epics?.length || 0} epics · ${tCount} tickets · ${prCount} with PR · ${orgCount} with org${expiredCount ? ` (⚠ ${expiredCount} claimed-but-expired)` : ""}`);
console.log(`wrote ${path.join(cfg.out_dir, "mission-control.json")} → now run render.mjs`);
