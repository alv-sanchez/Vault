---
epic: BMS-4965
epic_name: "[REQ-038] Short Pay Automation"
epic_url: https://ohanafy.atlassian.net/browse/BMS-4965
source: Finance/Accounting - Demo Workshop (Gulf)
recorded: 2026-06-30
duration: 1h18m
tags: [gulf, short-pay, delivery, driver, transcript, action-items]
---

# Short Pay Automation — Action Items
### Source: Finance/Accounting Demo Workshop · Gulf · Jun 30, 2026

Epic: [BMS-4965 — [REQ-038] Short Pay Automation](https://ohanafy.atlassian.net/browse/BMS-4965) (In Progress · assignee: Alvaro Sanchez)

The demo covered several finance/accounting areas, but only the **Driver Finalize-Stop / check-scan protocol** section maps to this epic. Those items are pulled below, followed by the related open blockers surfaced in Slack the same week.

---

## 1. Driver check-scan protocol (from the demo)

These are the requirements/decisions demoed for the driver-side short-pay detection flow:

- **Configurable scan-attempt limit before manual entry.** Driver gets N attempts to capture a readable check image before the app unlocks manual entry of the check number and amount collected. Default demoed = **3**, but it's fully configurable (1–10). *Action: confirm the default Gulf wants; wire the value to config, not hard-code.*
- **OCR confidence gate.** OCR extracts check number + amount and **blocks** when confidence is too low (blurry/out-of-focus/bad image). Only after N failed attempts does manual entry unlock. *Action: define/confirm the confidence threshold.*
- **Failed verification → back-office review.** A check that can't be verified is flagged "couldn't verify," and finance/accounting gets an alert ("driver XYZ has an unverifiable check — review when they're back from route"). *Action: build the alert + review flag.*
- **Check image linked to the invoice.** Captured images attach to the invoice and are viewable while the driver is still on route, so back-office can investigate before the physical check arrives. *Action: confirm image→invoice linkage in the data model.*
- **Reconciliation integration.** Tie the unverifiable-check flag into a proactive reconciliation process — flag those invoices for verification rather than waiting for route return.
- **Per-user configurable policies.** Attempt limits / guardrails should be settable per user/driver (e.g., a highly trusted driver could get fewer attempts). Provide structure without over-friction. *Future iteration noted.*

## 2. Deliverables owed by Ohanafy (from the demo close)

- **New test scripts** covering today's demoed material (check-scan protocol, etc.) are NOT yet in the existing test scripts. Ohanafy to deliver "soon" — grace requested for the holiday week.
- Existing test scripts have embedded Loom video links; keep sending those with new items.

---

## 3. Related open blockers & decisions (same-week Slack context)

These aren't from the transcript but are live decisions on this epic and its child tickets — captured here so nothing's lost.

**Blocked on Gulf:**
- **Escalation rules** ([BMS-4059](https://ohanafy.atlassian.net/browse/BMS-4059)): what triggers a short-pay escalation — dollar amount, invoice age, or both — and the per-state thresholds. FL = amount ≥ $__ OR age ≥ __ days. AL = ≥ $0 (under-collecting on a beer delivery is a legal risk).
- **Approvers + number of approval layers** Gulf requires (process is reportedly very tedious).

**Committed / time-sensitive:**
- Build a **reusable, metadata-driven approval asset** — configurable approvers + number of layers, with placeholders to visualize. Elliot asked for it to be reusable (no central approval component exists today; all workflow-specific). Target: show in the review.

**Scope gaps in current tickets ([BMS-4059](https://ohanafy.atlassian.net/browse/BMS-4059) / [BMS-4060](https://ohanafy.atlassian.net/browse/BMS-4060)):** written around the driver in-person case. Not yet covered — likely new reqs/tickets:
- **Driver hard-block** — driver can't leave the stop until management approves (current flow only escalates/warns).
- **EFT short pays** (Publix / Bank Rec sync) — not covered.
- **AR aging / net-30 view** for non-alc outstanding balances — not covered.

**Design input to resolve for the reusable asset:** where the approver lives — `User.ManagerId` vs a new route/territory field (open question flagged on [BMS-4396](https://ohanafy.atlassian.net/browse/BMS-4396)); plus how many layers. Bryson also wants to eventually own a central approval component — coordinate to avoid duplicate work.

---

*Other topics in this workshop (budgeting, financial statements comparisons, contract management/prepaids, transfer variances) fall outside this epic and are not tracked here.*
