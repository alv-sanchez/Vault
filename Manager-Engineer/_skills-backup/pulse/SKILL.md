---
name: pulse
description: >
  One command to refresh your whole board — the heartbeat of the pipeline. Runs the full loop in
  order: conductor (sync epics from Jira → audit → build-order → daily) then refreshes Mission
  Control, Branch-Org Manager, and the synapse Atlas. Safe to loop: on a loop it runs conductor
  PLAN-ONLY (no auto-dispatch). Invoke with "/pulse", "refresh everything", "run the pulse", or
  loop it: "/loop 30m /pulse".
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# pulse 💓

The single "refresh everything" command. One run re-pulls the live picture and rebuilds every surface so you can context-switch with full visibility. Jira needs the MCP (no token), so this runs in an interactive session — loop it with `/loop 30m /pulse`.

## Guardrail (loop-safe)
On a periodic run, **conductor is PLAN-ONLY** — it syncs epics, audits executability, rebuilds the Build Order, writes the daily, and routes open questions, but **does NOT dispatch builds**. Dispatching real engineer builds stays a deliberate, separate `/conductor --live`. So looping `/pulse` never silently starts building.

## The run (in order)

### 1. Preconditions
Assert `{repo_path}` is on `main` and clean (`git -C {repo_path} status`). If not, report and skip the build-sensitive parts — never plan/build against a dirty tree.

### 2. conductor — plan-only  (Jira → Epics/ → Build Order → Daily)
Run the `conductor` flow in plan-only mode (delegates to `me-manager`): pull the live epic list, refresh `Epics/<domain>/` notes, audit executability via `/polish`, rebuild `Build-Order.md`, route new blockers to Open-Questions + Feedback, write `Daily/<today>.md`. **No dispatch.** This is what *adds/syncs* epics (e.g. new ones like 5484/5067 get organized in).

### 3. Mission Control — the base pull (MCP)
This is the only hand-step. Query **both** in-progress epics **and** the assigned To-Do epics, plus **each epic's children** (per `mission-control` skill steps 1–3), and write `Mission-Control/mission-control.base.json` (epics + tickets, status only). Requirements that must survive every pulse:
- **To-do epics get full child trees too** (`todoEpics[].tickets`), not just compact cards.
- **Request `labels`** on the children query and set each ticket's `polished` = labels include `polished` **or** `bk-polish-complete` (bare `bk-polish` = in-progress, not counted).
- **Epic context**: set `user` / `impact` / `solution` (one tight line each, from the epic description; omit `solution` if undecided).
- **Ticket `build` flag + `note`**: set `build` = `UI|Backend|Both|Spike|Docs` (what gets built — renders in front of the polish label) and an optional short `note`. Infer from title/labels/type; `gather.mjs` only auto-fills `Spike`. Carry these across pulses — don't drop them when updating statuses.

Domains come from the `Epics/<domain>/` folder; keep summaries tight.

### 4. Deterministic refreshers — one script
```bash
bash ~/.claude/skills/pulse/run-scripts.sh
```
Runs, with no further input:
- **Mission Control** `gather.mjs` (attaches PR via `gh` + **org from the epic-note `org:`/`claimed_orgs:`**, flags expired) → `render.mjs`.
- **Branch-Org Manager** `refresh.mjs` (orgs ⋈ branches ⋈ tickets, expiry/orphan flags).
- **synapse** `weave.mjs` (area ⋈ ticket connection web).

### 5. Consolidated report + trail
Report one block: epics/tickets/in-progress/**in-review-or-PR**/done · **⚠ expired orgs** · branches without an org · areas connected · new open questions. Point at `Mission-Control/mission-control.html`. Append one line to `Manager-Engineer/pulse-log.md` (`| when | epics | tickets | review/PR | expired-orgs | open-Qs |`; create with that header if missing).

## Loop it
`/loop 30m /pulse` (or `/loop 1h /pulse`) — keep it in an interactive session logged into Jira/GitHub. Each run re-syncs and re-renders; the dashboards' own `<meta refresh>` keeps their browser tabs current between pulses.

## What it does NOT do
- No dispatch/auto-build (that's `/conductor --live`).
- No Jira/GitHub writes beyond conductor's normal open-question routing.
- Read-only on the repo; only writes vault dashboards/notes + the pulse log.

## Chain
`conductor (plan-only)` → `mission-control` → `branch-org-manager` → `synapse`. Each is also runnable on its own; `pulse` is the batch.
