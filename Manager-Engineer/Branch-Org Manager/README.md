---
tags: [manager-engineer, branch-org-manager]
---

# Branch-Org Manager

Full visibility into which **Salesforce dev/scratch orgs** are tied to which **git branches, worktrees, and BMS tickets** — refreshed on demand, with a paper trail.

## Refresh
Run the `branch-org-manager` skill in Claude Code — say **"refresh orgs"** or **`/branch-org-manager`**. Or directly:
```bash
node ~/.claude/skills/branch-org-manager/refresh.mjs
```

## What lives here
- **[[_dashboard]]** — the live grid (overwritten each refresh). Org ↔ branch ↔ worktree ↔ ticket, expiry warnings, orphans.
- **`Snapshots/`** — one immutable dated copy per refresh = the paper trail (history you can diff).
- **[[refresh-log]]** — one row per refresh (when + counts).
- **`.last-refresh.json`** — machine-readable sidecar.

## The join
Everything ties on the **BMS ticket number** (e.g. scratch org `ohfy-val-4078` ↔ branch `feat/…-bms-4078` ↔ ticket `BMS-4078`). Sections: **tied**, **branches without an org**, **orphan scratch orgs** (delete candidates), **standing/shared orgs**.

> [!note] Keep-until-merge
> A claimed org stays claimed until its PR merges to `main`. Tied orgs are expected; only orphan scratch orgs (no branch) are cleanup candidates. The refresh is read-only — it never deletes an org.
