---
tags: [manager-engineer, mission-control]
---

# Mission Control 🛰️

The mother dashboard — every **active epic** with its full ticket tree, each ticket's status + GitHub PR / review state, and an **⚡ in-review / open-PR band** up top so nothing waiting on you slips.

## Refresh (easy)
Say **"refresh mission control"** or **`/mission-control`** in Claude Code. Re-pulls Jira + GitHub and rewrites the HTML in place. Hands-off: `/loop 30m /mission-control`.

## What lives here
- **`mission-control.html`** — the dashboard. *Open in default app* (browser), or embed:
  `<iframe src="Mission-Control/mission-control.html" width="100%" height="900"></iframe>`
- **`mission-control.json`** — the data it renders from.
- **`Snapshots/`** — one dated HTML copy per refresh (paper trail).
- **[[refresh-log]]** — one row per refresh.

> [!note]
> Scope is your 5 **In Progress** epics. Status is from Jira; PRs are matched to tickets by the BMS number on the branch. A ticket can be in review with no PR, or have a PR while Jira lags — the board shows both honestly.
