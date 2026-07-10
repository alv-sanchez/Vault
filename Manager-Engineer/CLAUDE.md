---
tags: [manager-engineer, operating-manual]
updated: 2026-07-01
---

# Manager-Engineer — operating manual

This vault is the papertrail + control surface for Alvaro's BMS Salesforce build pipeline. This file is the source of truth for **how the system works** — read it before touching anything here.

> [!important] If you read nothing else
> **Jira = truth for status, GitHub = truth for PRs, `sf` = truth for orgs.** The `Tickets/*.md` notes are a *partial* papertrail, never authoritative. Dashboards pull **live** — refresh, don't trust a stale note. MCP results are fat → **`jq` the saved file, never read it into context.** Jira **writes** happen only on explicit instruction.

## Quick commands
| Say | Runs |
|---|---|
| "refresh mission control" / `/mission-control` | 🛰️ rebuild the mother dashboard (epics → tickets → PR → org) |
| "refresh orgs" / `/branch-org-manager` | 🖥️ rebuild org ↔ branch ↔ ticket board |
| "I'm stuck" / "what's next" / `/the-corner` | 🥊 one next move, anti-overwhelm |
| "kick off the pipeline" / `/conductor` | full audit → plan → dispatch |

## Source of truth (read this first)
- **Jira is authoritative for ticket/epic status.** Dashboards pull it **live** via the Atlassian MCP (`parent = <epic>` per epic). They do **not** read the `Tickets/*.md` notes.
- **GitHub is authoritative for PRs** (open/merged/draft/review). Matched to tickets by BMS number.
- **`sf org list` is authoritative for dev orgs.** Matched to tickets/branches by BMS number.
- **The vault `.md`/`.html` files are a papertrail + planning surface, not the source.** Only *executable* tickets ever get a `Tickets/*.md` note, so most tracked tickets have no note. Never treat a `.md` as ground truth for status — re-pull from Jira.

If a `.md` disagrees with Jira/GitHub, Jira/GitHub win; refresh the note.

## Constants (verified this repo/site)
- Vault: `/Users/alvarosanchez_1/Documents/Obsidian/Vault` · me_root: `Manager-Engineer`
- Repo: `/Users/alvarosanchez_1/OHFY-Split` (branch `main`) · GitHub `Ohanafy/OHFY-Split`
- Jira cloudId: `12843674-078e-48ac-ae5c-d33914c3bfb7` · project `BMS` · browse `https://ohanafy.atlassian.net/browse`
- Engineer (Alvaro) accountId: `712020:38e713f0-defd-468b-b422-26423a878525`
- PO (Elliot Flores) accountId: `712020:7649b437-ff00-46df-a878-10ad1dfc5d56` (use an ADF mention node to actually notify)
- Epics JQL: `project = BMS AND issuetype = Epic AND labels = sf-tracker AND assignee = <engineer> [AND status = "In Progress"]`

### Jira field IDs & workflow
- **Story Points:** `customfield_10026` — **set on child Stories only, NOT epics** (the field isn't on the Epic screen → `editJiraIssue` errors "cannot be set"). Point the children. · **Sprint:** `customfield_10020` (set the numeric sprint id, e.g. `1571`)
- **Active sprint:** find via `sprint in openSprints()` and read `customfield_10020` (id/name/state). As of 2026-07-01, **Sprint 7 = id 1571** (board 361). **Sprints are 1 week** (Sprint 7: 2026-06-29 → 07-06). Every day counts — late-sprint = close/merge, don't start unlandable scope.
- **Status categories:** To Do = Backlog / To Do / Needs Refinement / Needs Analysis · In Progress = In Progress / Review · Done = Done / Won't Do.
- **Transition path Backlog → In Progress is multi-hop** (no direct transition):
  - Backlog → **91** (Needs To Be Refined) → Needs Refinement → **2** (Refined) → To Do → **111** (In Development) → In Progress.
  - From Needs Refinement: just **2** then **111**. From To Do: just **111**.
  - Transition ids can vary by issue — call `getTransitionsForJiraIssue` to confirm before transitioning.
- **Labels:** `editJiraIssue` with `fields.labels` *overwrites* — always fetch current labels first and merge (don't clobber).

### MCP token hygiene (important)
The Atlassian & GitHub MCPs ignore the `fields` param and return fat bodies; large results auto-save to a file. **Never read those into context — `jq` the saved path** for only the fields you need (status, statusCategory, head.ref, title, etc.). Never request `description` in a multi-issue search.

## Folder map
- `Epics/<domain>/BMS-XXXX-*.md` — **the canonical home where epics are organized**, grouped by domain folder: `eCommerce · Warehouse-WMS · AR-Finance · Inventory-Replenishment · OMS-Delivery · Allocation-Launch-Planning · Supplier-Portal`. One epic note per file (frontmatter: status, verdict, blockers, release_phase). This folder is the source for an epic's **domain** (its folder) and canonical **slug** (its filename) — use it when building/scaffolding rather than re-deriving.
- `Tickets/BMS-XXXX-*.md` — per-**executable**-ticket notes (partial; not all tickets).
- `Mission-Control/` — 🛰️ mother dashboard (see below).
- `Branch-Org Manager/` — 🖥️ org ↔ branch ↔ ticket dashboard.
- `The-Corner/` — 🥊 direction check-ins (round cards + log).
- `Open-Questions/` — one note per blocker/decision routed to the PO.
- `Feedback/` — plain-language stakeholder pages per epic with open questions.
- `Daily/<date>.md` — daily plan. `Build-Order.md` — dependency-safe queue. `manager-engineer.base` — Obsidian Base views over all notes.
- `_skills-backup/` — copies of the custom skills (incl. `epic-progress-RETIRED`).

## Skills (live in `~/.claude/skills/`)
| Skill | Trigger | Does | Writes to |
|---|---|---|---|
| **conductor** | `/conductor`, "kick off pipeline" | Full pipeline: sync epics → audit/gate (`/polish`) → build order → route open questions → daily → dispatch engineers hybrid-by-risk | Epics/, Tickets/, Build-Order, Daily/, Open-Questions/, Feedback/ |
| **mission-control** 🛰️ | `/mission-control`, "refresh mission control", "mother dashboard" | Live board of active epics + full ticket tree + PR/review + tied org | `Mission-Control/` |
| **branch-org-manager** 🖥️ | `/branch-org-manager`, "refresh orgs" | Ties `sf` orgs ↔ git branches/worktrees ↔ tickets; flags orphans + expiry | `Branch-Org Manager/` |
| **the-corner** 🥊 | `/the-corner`, "I'm stuck", "what's next" | Reads the board, hands ONE next move (anti-overwhelm). Him vs the freeze. | `The-Corner/` |
| **engineering-notes** | starting/logging a ticket | Writes/updates `Tickets/BMS-XXXX` from live Jira | `Tickets/` |
| **newsletter** | "what shipped" | Digest from merged PRs | Artifact + Slack draft |
| **ticket-create** | creating a ticket | Scaffolds a new BMS ticket | Jira/vault |

`epic-progress` was **retired** (superseded by Mission Control) — archived in `_skills-backup/epic-progress-RETIRED/`.

## Dashboards — how they refresh
Each is a self-contained HTML page + a `.json` data file + `Snapshots/` (dated copies) + `refresh-log.md`, rendered by a `render.mjs`/`refresh.mjs` in the skill dir. Data is gathered live (MCP/sf/git), written to the `.json`, then the script renders HTML. Auto-reloads in a browser (`<meta refresh>`); the *numbers* only change when the skill re-runs. Loop for hands-off freshness (e.g. `/loop 30m /mission-control`) — keep it interactive since the Jira/GitHub MCPs need login.

### PR ↔ ticket matching (mission-control)
Match by BMS number in the **branch name AND the PR title/body** — **one PR can cover many tickets** (e.g. an epic-branch PR like `feat/safety-stock-controls-bms-5068` whose title lists `BMS-4217, BMS-5636, …`). Attach `{number, state, merged, draft}` to every referenced ticket. **Orgs span tickets** too — when a PR deploys a whole epic to one scratch org (e.g. #442 → `ohfy-val-4217`), stamp that org on every ticket in the PR.

## Working rules (Alvaro's standing preferences)
- **Concise, signal-dense** — no filler. A stressed brain can't parse a wall of text.
- **Build, don't wait** — blocked on a decision → make it configurable and build past it; keep the question visible for refinement.
- **Fix only this feature** — on red CI, fix only failures caused by this branch; leave unrelated specs alone.
- **Keep claimed orgs until merge** — don't release a claimed dev org until its PR is in `main`. Track every claimed org in the epic note + the Base's Claimed Orgs view.
- **Always post polish/polish-epic findings to the Jira ticket** automatically (don't ask).
- **Refinement labeling** — mark AI-assumed vs confirmed vs open in resolutions; the team ratifies AI-filled gaps in refinement meetings.
- **Stale `Needs Refinement` / `refinement-needed`** on a ticket that's fully specced + built is a leftover from pipeline auto-creation — clear it; don't take it at face value.

## Guardrails
- Dashboards & the corner are **read-only** on Jira/GitHub/repo (they only write into their vault folder). Jira **writes** (edit/transition) happen only on explicit instruction.
- `do_not_do: true` on an epic note → skip it entirely.
- Never touch an In Progress / In Review ticket that's being worked by hand.
