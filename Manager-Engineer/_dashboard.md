---
type: Dashboard
scope: Manager-Engineer pipeline
last_updated: 2026-06-26
tags:
  - manager-engineer
  - dashboard
---
# Manager–Engineer — How this folder works

> **Live views are in [[manager-engineer.base]].** Open it and use the view tabs (🚀 Build Order, 🔨 Building, 🤝 Needs You, 🚧 Blocked, ✅ Done, 📥 Epics audit). This dashboard holds the *rules*; the data lives in the notes' frontmatter and the `.base` re-sorts it in real time.

The current dependency-ordered plan is **[[Build-Order]]**, regenerated every `/conductor` run.

---

## The two roles

| Role | Agent | Does | Never does |
|---|---|---|---|
| **Manager** | `me-manager` | Audits epics, decides what's executable (polish), builds the parallel Build Order, routes open questions to the PO, keeps the papertrail | Write product code |
| **Engineer** | `me-engineer` | Executes one stream's work in OHFY-Split `main`. Whole epic → drives `/work-epic` (merge-gated PRs, one at a time); single ticket → start-ticket → build → tests → code-review → set-risk → end-ticket. Updates the vault notes. | Touch work outside its assigned stream; merge a PR group early |

Kick the whole loop with **`/conductor`** (re-pulls Jira, re-audits, regenerates everything).

---

## Folder map

| Path | What |
|---|---|
| `Build-Order.md` | The master plan — streams, stages, wavefront. Regenerated each run. |
| `Epics/` | One note per in-scope epic — audit verdict, executable children, blockers. |
| `Tickets/` | One note per **executable** ticket — polish verdict, status, branch, PR, risk, DoD. |
| `Open-Questions/` | Granular PO deferrals (internal) — issue + attempted solution + options + file:line evidence. Mirrored to a Jira comment. |
| `Feedback/` | **The served feedback page** — one per epic, plain-language, 2-min skim (issue · business impact · solution direction · high-level visual · TL;DR decisions). Published to Notion for guest comments. Aggregates that epic's open questions. |
| `Daily/` | Per-day plan — timeboxed manual block + autonomous queue + blocked list. |
| `Runs/` | Papertrail — what each kickoff audited, decided, dispatched. |
| `Templates/` | Source templates for the above. |

---

## Rules of the pipeline

1. **Only executable tickets enter the plan.** A ticket is executable when it has a description + ACs, is not blocked by an open ticket, maps to real packages, **is not already In Progress / In Review** (those are being worked by hand — hands off), and `/polish` returns no `Contradicted` findings. Everything else is logged with a reason, not queued.
2. **No overlap.** Two tickets run in parallel only if they're mutually unblocked AND their `packages_touched` are disjoint. The shared `InventoryAdjustmentTriggerService` is a hard lock — one inventory-mutating ticket at a time.
3. **Blockers build first.** Topological order by Jira links + package tiers; the thing that unblocks the most work goes first.
4. **Hybrid-by-risk.** Low-risk → engineer builds + opens PR autonomously. Med/High → stops at Handoff for you. (`/set-risk` gates it.)
5. **UI/UX needs your sign-off.** Any ticket touching a `-UI` package / LWC / FlexiPage / Experience Cloud is flagged `ui: needed`. The engineer generates a mockup (`/mockup-ticket`), parks the ticket at `Awaiting-UI`, and builds the real component **only after you flip `ui: approved`** — regardless of risk. See the **🎨 UI/UX Approval** view.
6. **No silent blockers.** A blocker becomes an Open-Question note + a Jira comment tagging the PO. The ticket leaves the autonomous queue until answered.
7. **Definition of Done** = polish clean + built + tests pass + PR opened + no unresolved open question. No blocker raised ⇒ the ticket lands in DoD.

---

## Parking an epic — `do_not_do`
Set `do_not_do: true` (and a `do_not_do_reason:`) in an epic note to make the pipeline **skip it entirely** — no audit, no queue, no questions, no dispatch. It moves out of the audit board into the **🚫 Do Not Do** view. This is your manual veto; `/conductor` preserves it across runs. Flip it back to `false` to re-include.

## Don't duplicate data
Status lives in each note's frontmatter; the `.base` is the live query. If you're editing a table by hand, stop — update the note's frontmatter or run `/conductor`.

> Legacy reference: `Anvil/Manager/Managing Tickets/Quick Wins - Epic Prioritization` seeded the scoring approach. This folder supersedes it with a live, audited rebuild.
