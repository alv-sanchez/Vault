#!/usr/bin/env node
// Branch-Org Manager — refresh engine.
// Joins `sf org list` ⋈ git branches/worktrees ⋈ ticket-note frontmatter
// on the BMS ticket number, then writes a live dashboard + a timestamped
// snapshot (paper trail) into the vault folder.
//
// Usage: node refresh.mjs [--config path/to/config.json]
// All paths/knobs live in config.json next to this script (auto-created on first run).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- config ----------
const DEFAULTS = {
  repo_path: "/Users/alvarosanchez_1/OHFY-Split",
  vault_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Branch-Org Manager",
  tickets_dir: "/Users/alvarosanchez_1/Documents/Obsidian/Vault/Manager-Engineer/Tickets",
  expiry_warn_days: 3,
};

function loadConfig() {
  const argIdx = process.argv.indexOf("--config");
  const cfgPath = argIdx > -1 ? process.argv[argIdx + 1] : path.join(HERE, "config.json");
  let cfg = { ...DEFAULTS };
  if (fs.existsSync(cfgPath)) {
    cfg = { ...cfg, ...JSON.parse(fs.readFileSync(cfgPath, "utf8")) };
  } else {
    fs.writeFileSync(cfgPath, JSON.stringify(DEFAULTS, null, 2));
  }
  return cfg;
}

// ---------- helpers ----------
const sh = (cmd, args, opts = {}) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
  } catch (e) {
    return e.stdout || "";
  }
};

// Pull a 3-4 digit BMS ticket number out of any string.
// strict=true (branches): require an explicit `bms` prefix so agent-hash
// worktree names like `worktree-agent-…0033…` don't look like ticket 0033.
// strict=false (org aliases): also accept a bare 4-digit token (e.g. `ohfy-val-4078`).
const ticketKey = (s, strict = false) => {
  if (!s) return null;
  const m = String(s).toLowerCase().match(/bms[-_ ]?(\d{3,4})/);
  if (m) return m[1];
  if (strict) return null;
  const b = String(s).match(/(?<!\d)(\d{4})(?!\d)/);
  return b ? b[1] : null;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Math.ceil((d - new Date()) / 86400000);
};

// ---------- collectors ----------
function collectOrgs() {
  const raw = sh("sf", ["org", "list", "--json"]);
  let json;
  try { json = JSON.parse(raw.slice(raw.indexOf("{"))); } catch { return []; }
  const r = json.result || {};
  const seen = new Map();
  const push = (o, kind) => {
    const alias = o.alias || o.username;
    if (!alias) return;
    const prev = seen.get(alias) || {};
    seen.set(alias, {
      alias,
      username: o.username,
      instanceUrl: o.instanceUrl || prev.instanceUrl,
      kind: prev.kind === "scratch" ? "scratch" : kind, // prefer scratch classification
      expiration: o.expirationDate || prev.expiration || null,
      status: (o.connectedStatus || prev.status || "").replace(/\s+/g, " ").trim(),
      lastUsed: o.lastUsed || prev.lastUsed || null,
    });
  };
  (r.scratchOrgs || []).forEach((o) => push(o, "scratch"));
  (r.sandboxes || []).forEach((o) => push(o, "sandbox"));
  (r.nonScratchOrgs || []).forEach((o) => push(o, "nonScratch"));
  (r.other || []).forEach((o) => push(o, "other"));
  (r.devHubs || []).forEach((o) => push(o, "devHub"));
  return [...seen.values()];
}

function collectWorktrees(repo) {
  const out = sh("git", ["-C", repo, "worktree", "list", "--porcelain"]);
  const trees = [];
  let cur = {};
  for (const line of out.split("\n")) {
    if (line.startsWith("worktree ")) cur = { dir: line.slice(9) };
    else if (line.startsWith("branch ")) cur.branch = line.slice(7).replace("refs/heads/", "");
    else if (line.startsWith("HEAD ")) cur.head = line.slice(5, 12);
    else if (line === "") { if (cur.dir) trees.push(cur); cur = {}; }
  }
  if (cur.dir) trees.push(cur);
  return trees;
}

function collectBranches(repo) {
  const out = sh("git", ["-C", repo, "for-each-ref", "--format=%(refname:short)|%(committerdate:short)|%(authorname)", "refs/heads"]);
  return out.trim().split("\n").filter(Boolean).map((l) => {
    const [name, date, author] = l.split("|");
    return { name, lastCommit: date, author };
  });
}

function collectTickets(dir) {
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const key = ticketKey(f);
    if (!key) continue;
    const txt = fs.readFileSync(path.join(dir, f), "utf8");
    const fm = txt.startsWith("---") ? txt.slice(3, txt.indexOf("\n---", 3)) : "";
    const get = (k) => {
      const m = fm.match(new RegExp("^" + k + ":[ \\t]*(.*)$", "m"));
      return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
    };
    map.set(key, {
      note: f,
      title: get("title"),
      status: get("status"),
      risk: get("risk"),
      stream: get("stream"),
      pr: get("pr"),
      branch: get("branch"),
      jira: get("jira"),
    });
  }
  return map;
}

// ---------- join ----------
function build(cfg) {
  const orgs = collectOrgs();
  const worktrees = collectWorktrees(cfg.repo_path);
  const branches = collectBranches(cfg.repo_path);
  const tickets = collectTickets(cfg.tickets_dir);

  const wtByBranch = new Map(worktrees.filter((w) => w.branch).map((w) => [w.branch, w]));

  // index branches by ticket key
  const branchByKey = new Map();
  for (const b of branches) {
    const k = ticketKey(b.name, true);
    if (k && !branchByKey.has(k)) branchByKey.set(k, b);
  }

  const rows = [];
  const usedBranchKeys = new Set();
  const standing = [];
  const unmatchedOrgs = [];

  for (const o of orgs) {
    const key = ticketKey(o.alias) || ticketKey(o.username);
    // Scratch orgs are per-ticket dev orgs — never treat one as standing.
    // Non-scratch orgs (sandbox/prod/devhub/shared demo) are always standing.
    if (o.kind !== "scratch") {
      standing.push(o);
      continue;
    }
    if (key && branchByKey.has(key)) {
      const b = branchByKey.get(key);
      usedBranchKeys.add(key);
      rows.push({ key, org: o, branch: b, wt: wtByBranch.get(b.name), ticket: tickets.get(key) });
    } else {
      unmatchedOrgs.push(o);
    }
  }

  // ticket branches that have no org claimed
  const orphanBranches = [];
  for (const [key, b] of branchByKey) {
    if (!usedBranchKeys.has(key)) orphanBranches.push({ key, branch: b, wt: wtByBranch.get(b.name), ticket: tickets.get(key) });
  }

  rows.sort((a, b) => Number(a.key) - Number(b.key));
  orphanBranches.sort((a, b) => Number(a.key) - Number(b.key));
  return { rows, standing, unmatchedOrgs, orphanBranches, counts: {
    matched: rows.length, standing: standing.length, unmatchedOrgs: unmatchedOrgs.length, orphanBranches: orphanBranches.length,
  }};
}

// ---------- render ----------
const short = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
const prCell = (pr) => (pr && pr.startsWith("http") ? `[PR](${pr})` : pr || "—");

function expiryBadge(org, warnDays) {
  const d = daysUntil(org.expiration);
  if (d === null) return "";
  if (d < 0) return `🔴 expired`;
  if (d <= warnDays) return `⚠️ ${d}d`;
  return `${d}d`;
}

function statusIcon(org) {
  const s = (org.status || "").toLowerCase();
  if (s.startsWith("connected")) return "🟢";
  if (s) return "🔴"; // has a status string but not connected (expired token, etc.)
  // scratch orgs carry no connectedStatus — infer from expiry
  const d = daysUntil(org.expiration);
  if (d !== null) return d < 0 ? "🔴" : "🟢";
  return "";
}

function render(data, cfg, stamp) {
  const { rows, standing, unmatchedOrgs, orphanBranches, counts } = data;
  const L = [];
  L.push("---");
  L.push("tags: [manager-engineer, branch-org-dashboard]");
  L.push(`updated: ${stamp.iso}`);
  L.push(`matched: ${counts.matched}`);
  L.push(`orphan_branches: ${counts.orphanBranches}`);
  L.push(`unmatched_orgs: ${counts.unmatchedOrgs}`);
  L.push("---");
  L.push("");
  L.push("# 🖥️ Branch ⋈ Org Dashboard");
  L.push("");
  L.push(`> Refreshed **${stamp.human}** · ${counts.matched} tied · ${counts.orphanBranches} branches without an org · ${counts.unmatchedOrgs} orphan scratch orgs · ${counts.standing} standing orgs`);
  L.push("");

  // expiring soon banner
  const expiring = rows.map((r) => r.org).filter((o) => {
    const d = daysUntil(o.expiration);
    return d !== null && d <= cfg.expiry_warn_days;
  });
  if (expiring.length) {
    L.push(`> [!warning] ${expiring.length} tied org(s) expiring within ${cfg.expiry_warn_days}d`);
    L.push("> " + expiring.map((o) => `\`${o.alias}\` (${daysUntil(o.expiration)}d)`).join(", "));
    L.push("");
  }

  L.push("## 🔗 Active — org ↔ branch ↔ ticket");
  L.push("");
  L.push("| BMS | Org | Exp | ● | Branch | Worktree | Ticket status | PR |");
  L.push("|----|-----|-----|---|--------|----------|---------------|----|");
  for (const r of rows) {
    const wt = r.wt ? "✔ " + short(path.basename(r.wt.dir), 26) : "—";
    const t = r.ticket || {};
    const st = t.status ? `${t.status}${t.risk ? " · " + t.risk : ""}` : "—";
    L.push(`| ${r.key} | \`${r.org.alias}\` | ${expiryBadge(r.org, cfg.expiry_warn_days)} | ${statusIcon(r.org)} | \`${short(r.branch.name, 40)}\` | ${wt} | ${st} | ${prCell(t.pr)} |`);
  }
  if (!rows.length) L.push("| — | _none_ | | | | | | |");
  L.push("");

  L.push("## 🌱 Branches without a claimed org");
  L.push("");
  if (orphanBranches.length) {
    L.push("| BMS | Branch | Worktree | Ticket status | Last commit |");
    L.push("|----|--------|----------|---------------|-------------|");
    for (const o of orphanBranches) {
      const wt = o.wt ? "✔ " + short(path.basename(o.wt.dir), 26) : "—";
      const t = o.ticket || {};
      L.push(`| ${o.key} | \`${short(o.branch.name, 44)}\` | ${wt} | ${t.status || "—"} | ${o.branch.lastCommit || ""} |`);
    }
  } else L.push("_none — every ticket branch has an org._");
  L.push("");

  L.push("## 🧭 Orphan scratch orgs (no matching branch — candidates to delete)");
  L.push("");
  if (unmatchedOrgs.length) {
    L.push("| Org | Exp | ● | Username |");
    L.push("|-----|-----|---|----------|");
    for (const o of unmatchedOrgs) L.push(`| \`${o.alias}\` | ${expiryBadge(o, cfg.expiry_warn_days)} | ${statusIcon(o)} | ${short(o.username, 40)} |`);
  } else L.push("_none._");
  L.push("");

  L.push("## 🏛️ Standing / shared orgs (not branch-tied)");
  L.push("");
  L.push("| Org | Kind | ● | Username |");
  L.push("|-----|------|---|----------|");
  for (const o of standing.sort((a, b) => a.alias.localeCompare(b.alias)))
    L.push(`| \`${o.alias}\` | ${o.kind} | ${statusIcon(o)} | ${short(o.username, 40)} |`);
  L.push("");

  L.push("---");
  L.push(`<sub>Generated by the \`branch-org-manager\` skill · repo \`${cfg.repo_path}\`. Reflects claim state at refresh time — memory rule: keep a claimed org until its PR merges to main.</sub>`);
  return L.join("\n");
}

// ---------- main ----------
const cfg = loadConfig();
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = {
  iso: now.toISOString().slice(0, 10),
  human: `${now.toISOString().slice(0, 10)} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  file: `${now.toISOString().slice(0, 10)}-${pad(now.getHours())}${pad(now.getMinutes())}`,
};

const data = build(cfg);
const md = render(data, cfg, stamp);

fs.mkdirSync(cfg.vault_dir, { recursive: true });
const dashPath = path.join(cfg.vault_dir, "_dashboard.md");
fs.writeFileSync(dashPath, md);

const snapDir = path.join(cfg.vault_dir, "Snapshots");
fs.mkdirSync(snapDir, { recursive: true });
fs.writeFileSync(path.join(snapDir, `${stamp.file}.md`), md);

// append one-line history to the paper-trail log
const logPath = path.join(cfg.vault_dir, "refresh-log.md");
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "# Refresh log\n\n| When | Tied | Branches w/o org | Orphan orgs | Standing |\n|------|------|------------------|-------------|----------|\n");
fs.appendFileSync(logPath, `| ${stamp.human} | ${data.counts.matched} | ${data.counts.orphanBranches} | ${data.counts.unmatchedOrgs} | ${data.counts.standing} |\n`);

// machine-readable sidecar for the skill to summarize
fs.writeFileSync(path.join(cfg.vault_dir, ".last-refresh.json"), JSON.stringify({ stamp, counts: data.counts,
  tied: data.rows.map((r) => ({ bms: r.key, org: r.org.alias, branch: r.branch.name, exp: r.org.expiration, status: r.ticket?.status || null })),
  orphanBranches: data.orphanBranches.map((o) => ({ bms: o.key, branch: o.branch.name })),
  unmatchedOrgs: data.unmatchedOrgs.map((o) => o.alias),
}, null, 2));

console.log(`OK  tied=${data.counts.matched}  orphanBranches=${data.counts.orphanBranches}  orphanOrgs=${data.counts.unmatchedOrgs}  standing=${data.counts.standing}`);
console.log(`Dashboard: ${dashPath}`);
console.log(`Snapshot:  ${path.join(snapDir, stamp.file + ".md")}`);
