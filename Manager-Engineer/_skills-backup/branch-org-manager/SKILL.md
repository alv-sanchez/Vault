---
name: branch-org-manager
description: >
  One-command visibility into which Salesforce dev/scratch orgs are tied to which git branches,
  worktrees, and BMS tickets — plus a paper trail. Runs `sf org list`, joins it against the repo's
  branches/worktrees and the Manager-Engineer ticket notes on the BMS ticket number, and writes a
  live dashboard + a timestamped snapshot into the "Branch-Org Manager" vault folder. Flags orphan
  orgs (no branch), branches with no claimed org, and orgs expiring soon. Invoke with
  "/branch-org-manager", "refresh orgs", "which orgs are tied to which branches", or "org dashboard".
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# branch-org-manager

Quick, full-visibility refresh of **active orgs ⋈ tied branches**, with a paper trail. The join key is the **BMS ticket number**: scratch org `ohfy-val-4078` ↔ branch `feat/…-bms-4078` ↔ worktree ↔ ticket note `BMS-4078-*.md`.

## What one run does
1. Runs `sf org list --json`, `git worktree list`, `git for-each-ref` on the repo, and reads ticket-note frontmatter.
2. Joins them on the BMS number and classifies every org/branch.
3. Writes into `{vault}/Manager-Engineer/Branch-Org Manager/`:
   - **`_dashboard.md`** — the live view (overwritten each run; Obsidian-friendly frontmatter).
   - **`Snapshots/<YYYY-MM-DD-HHMM>.md`** — an immutable copy = the paper trail.
   - **`refresh-log.md`** — one appended row per run (when · counts).
   - **`.last-refresh.json`** — machine-readable sidecar for summarizing.

## How to run it
```bash
node ~/.claude/skills/branch-org-manager/refresh.mjs
```
Filter the CLI update warning with `2>&1 | grep -v Warning:` if you want clean output. It prints a one-line summary and the two file paths. **This is the whole skill** — a single deterministic script; don't re-derive the join by hand.

## After running
Read the printed summary line and, if the user wants detail, `.last-refresh.json` (not the whole dashboard). Report concisely (per the user's PR-review preference — signal, no filler):
- N orgs tied to branches; anything **expiring within `expiry_warn_days`** (call these out — they're about to vanish).
- **Orphan scratch orgs** (no branch) — candidates to `sf org delete scratch`. Never auto-delete; list them and let the user decide.
- **Branches without a claimed org** — a ticket in flight that may need an org.
- Point the user at `_dashboard.md` (or the Obsidian Base) for the full grid.

## Dashboard sections
- **🔗 Active — org ↔ branch ↔ ticket** — the tied set, with expiry, connect status (●), worktree dir, ticket status/risk, PR.
- **🌱 Branches without a claimed org** — ticket branches with no scratch org.
- **🧭 Orphan scratch orgs** — scratch orgs with no matching branch (delete candidates).
- **🏛️ Standing / shared orgs** — sandboxes, prod, dev hubs, demo orgs (never branch-tied).

## Config
`config.json` (auto-created next to the script on first run). Defaults point at `OHFY-Split`, the `Manager-Engineer/Tickets` notes, and the `Branch-Org Manager` folder. Knobs: `repo_path`, `vault_dir`, `tickets_dir`, `expiry_warn_days`.

## Guardrails
- **Read-only.** The script only reads `sf`/`git`/notes and writes markdown into the vault folder. It never deletes an org or touches the repo.
- **Keep-until-merge rule** (user standing preference): a claimed org stays claimed until its PR merges to `main` — so a tied org is *expected*, not stale. Only orphan scratch orgs (no branch at all) are cleanup candidates.
- Matching is by BMS number; branches require an explicit `bms-XXXX` token (avoids matching agent-hash worktree names).

## Recurring refresh (optional)
For hands-off visibility, wrap this in `/loop` (e.g. `/loop 30m /branch-org-manager`) or a `/schedule` cron. Each run stamps a fresh snapshot, so the paper trail builds itself.
