---
ticket: BMS-4965
relates: [BMS-3844, BMS-4057, BMS-4058, BMS-4059, BMS-4060, BMS-4784, BMS-4785, BMS-4786, BMS-5561]
question: "Short Pay — reconcile with shipped capture (3844): extend Invoice__c or build parallel Short_Pay__c/Escalation__c? resolution model? AR suppression? FL/AL thresholds?"
status: Partially-answered      # approach locked; FL/AL threshold values pending Gulf
decided_by: Alvaro Sanchez (+ AR/finance SME, code-grounded)
method: AR/finance SME agent + OHFY-Split main code evidence + owner input
po: Elliot Flores
po_account_id: "712020:7649b437-ff00-46df-a878-10ad1dfc5d56"
jira_comment_url:
raised: 2026-06-29
updated: 2026-06-29
tags:
  - manager-engineer
  - open-question
  - refinement-agenda
---

# BMS-4965 — Short Pay Automation re-scope (resolution)

> [!success] Decision
> **Extend the shipped `Invoice__c` short-pay capture (BMS-3844) — build the back-office half on `Invoice__c` + reuse `Credit__c`, ZERO new objects.** Close the 8 children that reference invented objects. FL/AL escalation thresholds are **configurable per-state** (values pending Gulf). Drivers see capture only.

## Decisions

| # | Question | Decision | Status |
|---|---|---|---|
| Q1 | Extend vs parallel model | **Extend** `Invoice__c` capture; reuse `Credit__c` for resolution; **no new objects**. **Close** the invented-object children. | ✅ confirmed |
| Q2 | FL/AL compliance thresholds | **Configurable per-state** (CMDT: state → $ + aging-days). | ✅ structure confirmed; **values pending Gulf** |
| Q3 | What "resolution" means | **`Credit__c` posted = resolved** (write-off/deduction) + a manual **"collected"** close; manager-approval **optional**. Keep the status set + resolution path **configurable**. | ✅ confirmed |
| Q4 | AR suppression | **Drivers see capture only** — resolution status, escalation, and AR balance hidden from the driver profile (capture, don't chase). | ✅ confirmed |

### AI-assumed vs confirmed (refinement review)
- **AI-proposed, owner-confirmed:** extend-not-rebuild; zero new objects; reuse `Credit__c`; configurable per-state thresholds; Credit-posted=resolved + manual collected close; driver capture-only.
- **Code-verified facts:** capture shipped under 3844 (`Invoice__c.Short_Pay_Reason__c`/`Short_Pay_Note__c`, `E_DriverHome`, `driverHomePage`); the docs' "back-office approval flow that locks the invoice" **does not exist** — that's the real gap this epic fills; the children's `Short_Pay__c`/`Escalation__c`/`Repeat_Offender__c`/`OHFY-Core` don't exist.
- **Open (Gulf, via Elliot):** the actual FL vs AL threshold **values** + the legal driver.

## Minimal model (reuse-first; zero new objects)
- `Invoice__c.Short_Pay_Amount__c` (Currency/formula = `Total_Due__c − Amount_Paid__c`).
- `Invoice__c.Short_Pay_Status__c` (picklist: Open / Under Review / Escalated / Resolved-Credit / Resolved-Collected / Written Off) + `Short_Pay_Resolved_Date__c`. **This IS the review queue** (list view / LWC over Open/Under Review). ⚠ Use this, **not** `Is_Locked__c` (that's `B_Invoice_LockInvoices`' delivery-prep field — collision risk).
- **Compliance state:** reuse `Account` billing state if derivable; add `Invoice__c.Compliance_State__c` only if not.
- **Escalation:** per-state thresholds in a CMDT (values TBD Gulf) + a `B_` batch / trigger flipping `Short_Pay_Status__c` → Escalated.
- **Resolution:** reuse **`Credit__c`** (`Credit__c.Invoice__c`) — a posted credit closes the deduction (Resolved-Credit); manual "collected" close otherwise.
- **Repeat-offender:** `Account.Short_Pay_Count_TTM__c` / `Short_Pay_Amount_TTM__c` rollups (no `Repeat_Offender__c` object).
- **EOD reporting:** native Report/Dashboard on `Invoice__c` by reason/status/date.
- **AR suppression:** FLS / permission set hiding `Short_Pay_Status__c` + AR fields from the driver profile; `driverHomePage` never surfaces resolution state.

## Children disposition
- **Re-ground** to `Invoice__c`/`Credit__c` (drop `OHFY-Core`): escalation-state, resolution-queue, repeat-offender, EOD reporting.
- **Merge:** detection/reason-coding child(ren) → already shipped by 3844 (mark done); collapse the `Short_Pay__c`+`Escalation__c` children into one "back-office (status + queue)" story on `Invoice__c`.
- **Close as invalid:** any child whose sole deliverable is creating `Short_Pay__c`/`Escalation__c`/`Repeat_Offender__c` or the `OHFY-Core` package.

## Open — for Gulf (routed to Elliot)
- **FL vs AL escalation thresholds:** the $ amount and/or aging days that force escalation per state, and the legal driver (beer franchise / credit-law differences FL vs AL). Build is **configurable**, so this is a config value, not a code blocker.

## Risk / guardrail
- Do **not** re-touch the shipped 3844 capture (`E_DriverHome` short-pay branch / `driverHomePage` / the reason picklist) — duplicating it risks conflicting writes. BMS-4965 is strictly **back-office, downstream of capture**.
- Avoid the `Is_Locked__c` collision — use a distinct `Short_Pay_Status__c`.

---
<sub>Approach resolved 2026-06-29 (owner + AR/finance SME, code-grounded). FL/AL threshold values flagged to Elliot. Posted to BMS-4965.</sub>
