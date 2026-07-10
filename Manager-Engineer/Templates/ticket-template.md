---
ticket: BMS-XXXX
title: "[Ticket title]"
epic: BMS-XXXX
status: Queued          # Queued | Building | Awaiting-UI | Blocked | Handoff | Done
polish_verdict:         # Confirmed | Incomplete | Contradicted | Unverifiable
executable: false
risk:                   # Low | Med | High
ui:                     # ui_approval gate: na | needed | approved  (any -UI pkg / LWC / FlexiPage / Experience Cloud => needed)
stream:                 # S1..S6
track:                  # parallel-track id within a stage
packages_touched: []    # OHFY-Data-Model, OHFY-Utilities, OHFY-Service-Locator, OHFY-PLTFM, OHFY-OMS, OHFY-WMS, OHFY-REX, OHFY-PLTFM-UI, OHFY-OMS-UI, OHFY-WMS-UI, OHFY-REX-UI
blocked_by: []
blocks: []
branch:
pr:
dod_met: false
updated:
jira: https://ohanafy.atlassian.net/browse/BMS-XXXX
tags:
  - manager-engineer
  - ticket
---

# BMS-XXXX — [Ticket title]

> [!info] Status
> **{{status}}** · polish {{polish_verdict}} · risk {{risk}} · stream {{stream}} · UI {{ui}}

## 🎨 UI/UX approval (only if `ui: needed`)
Build stops here until you approve. Mockup generated via `/mockup-ticket` → `.claude/mockups/`.
- Mockup: [path / dragged into Jira]
- [ ] **Approved by you** — note date + any change requests below
- Change requests: …

## Polish findings (against OHFY-Split @ main)
| Claim | Verdict | Evidence (file:line) |
|---|---|---|

## Implementation brief
- Packages: {{packages_touched}}
- Approach: …
- Files expected to change: …

## Build log (append-only)
- YYYY-MM-DD — start-ticket / branch / decisions / gotchas

## Definition of Done
- [ ] Polish clean (no open Contradicted / blocker)
- [ ] Implemented per AC
- [ ] Tests pass
- [ ] PR opened
- [ ] No unresolved open question

## Handoff (only if risk ≥ Med)
What's built, what's left, why human input is needed.
