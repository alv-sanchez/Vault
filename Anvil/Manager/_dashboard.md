---
type: Dashboard
scope: Go-Live Feedback
last_updated: 2026-04-13
tags:
  - manager
  - dashboard
---
%%  %%
# Manager — How to use this folder

> **The live triage view is in [[manager.base]].** Open that file and use the view tabs (🔥 Fight NOW, 🚨 Go-Live Blockers, ⏭ Next Sprint, etc.) to see items re-sorted in real time as frontmatter changes. This dashboard file is for the *rules* — how to think about each item — not the data itself.

---

## Views in `manager.base`

| View | What it shows | When to open it |
|---|---|---|
| 🔥 **Fight NOW** | `recommendation == "DO NOW"` and not completed | Daily — this is your active sprint |
| 🚨 **Go-Live Blockers** | `go_live_blocker == true` and not completed | Before every stakeholder sync |
| ⏭ **Next Sprint** | `recommendation == "NEXT SPRINT"` | Sprint planning |
| 🔍 **Investigate first** | `recommendation == "INVESTIGATE"` | When you have a free hour and want to unblock a verdict |
| ❄ **Deferred** | `recommendation == "DEFER"` | Post-launch grooming |
| ✅ **Completed** | `status == "Completed"` | Retro / audit |
| 📚 **All items** | Everything, sorted by verdict then priority | When a new stakeholder asks "what's on the list?" |
| 🧩 **By kind** | Grouped by Data/Config/Code/Hybrid/Process | When you want to batch similar work |
| 📥 **Intake** | Items with no verdict yet | When fresh feedback arrives — this is your inbox |

All views sort by the custom rank formulas (`priority_rank`, `effort_rank`, `verdict_rank`) defined at the top of the base, so `CRITICAL` sorts before `High` the way a human would expect instead of alphabetically.

---

## Decision rules (the manager's playbook)

These rules are encoded in the `manager` agent and should guide every note's verdict. Apply in order — the first one that matches wins.

1. **Is the retailer BLOCKED today?** → `DO NOW`. No other consideration overrides a broken user journey.
2. **Is a senior stakeholder (Theresa, Gulf lead) asking DIRECTLY and RECENTLY?** → `DO NOW` even for modest impact. Political capital is a real resource pre-launch.
3. **Is it data-only or config-only AND touches nothing risky (pricing, permissions, audit)?** → Low-risk, ship it early.
4. **Is it a brand-new surface area** (new page, new object, new integration)? → `DEFER` unless it's a go-live blocker. New surface area needs discovery, not a rush job.
5. **Is it merchandising polish** (filters, flags, badges)? → `DEFER`. Retailers don't care on day 1.
6. **Is the impact "visibility/trust" for a user flying blind today** (e.g. sales rep doesn't know orders happened)? → `DO NOW`. Cheap, trust-building, and the kind of win that buys goodwill for harder fights.
7. **Tiebreaker**: whichever option protects revenue or fixes a broken order path wins.

---

## How to intake a new item

1. Invoke the `manager` agent and paste the raw feedback
2. Agent copies `manager-template.md`, classifies the ask, and writes a verdict note to `Manager/<slug>.md`
3. The new note automatically appears in `manager.base` views based on its frontmatter
4. If the verdict is `DO NOW` or `NEXT SPRINT`, hand off to `business-analyst` to cut a ticket
5. If the verdict is `INVESTIGATE`, the open question goes into your own calendar as a spike

---

## Scorecard (snapshot)

These numbers drift as frontmatter updates — use `manager.base` for the live count.

- **Total items**: 13
- **Completed**: 3
- **Fight NOW**: 5
- **Next sprint**: 2
- **Deferred**: 3
- **Investigating**: 0

---

## Why the base + dashboard split?

- **The base** is a live query over the notes' frontmatter — it auto-updates as you change `status`, `recommendation`, or `go_live_blocker`. No stale tables.
- **This dashboard** is durable knowledge — the rules for how to triage, the view catalog, and the intake process. None of that belongs in a table; it belongs in prose.

Don't duplicate data between them. If you find yourself updating a table in this file, stop and update the base or a note's frontmatter instead.
