# 💸 Session Kickoff — Short Pay (Epic BMS-4965)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the context seed.
> Last updated: 2026-07-01 (after Product review w/ Emily, Dave, Elliot).

## Scope of THIS session
The Short Pay epic BMS-4965. Do not touch Red Bull, Shift-End, or other tickets.

## Where the work lives
- **Branch:** `feat/short-pay-backoffice-bms-4965` (pushed, in sync with origin)
- **Dev org:** `ohfy-val-4965`
- **Back-office queue screen:** `sf org open -o ohfy-val-4965 -p /lightning/n/ohfy__Short_Pay_Review_Queue`
- **Docs (this folder):** `overview.html`, `short-pay-overview.html`, `short-pay-explained.html`

## ⭐ The big reframe (2026-07-01) — short pay is THREE use cases
Product/Gulf clarified v1 was built without full context. There are three distinct cases:
1. **Driver in-person** (check in hand at delivery) → **hard block** at Finalize Stop; driver can't leave until layers of management approval clear. *"All hands on deck."*
2. **EFT (Publix)** → caught at **Bank Reconciliation sync** (payment < balance), no in-person moment → **this is what the back-office queue I built actually fits.**
3. **AR aging (non-alc, net-30)** → show outstanding balances not yet due. *Tentative — Emily floated it, not confirmed.*
Rule of thumb: **alcohol = pay on delivery (legal, esp. AL); non-alc = net-30.**

## What's actually BUILT vs claimed (verified in code)
- ✅ Back-office queue of short-paid invoices (amount/age/warehouse/state) — `E_ShortPayReview.getWorklist`
- ✅ Resolve-with-credit / mark-collected — `S_ShortPayResolution` + `S_ShortPayConfig` (`Short_Pay_Status_Config__mdt`)
- ✅ Auto-escalation batch — `B_Invoice_ShortPayEscalation`: escalates when shortfall **large OR old**, per-state thresholds (`Short_Pay_Threshold__mdt`), thresholds are **placeholders/empty** so nothing escalates until Gulf gives numbers.
- ❌ **"Repeat offenders flagged" — NOT built** (no code; "Sunshine ×3" was just seed data).
- ❌ **"Alerts driver/manager" — NOT built**; code explicitly never touches driver capture.
- ⚠️ **"Under Review" status has no trigger** — recognized/filterable but nothing sets it (manual only, or a gap).

## Driver-side experience (for the hard-block / approval gate)
- **LWC:** `OHFY-OMS-UI/.../lwc/driverHomePage/` (`.js`/`.html`)
- **Apex:** `OHFY-OMS/.../classes/executables/driverHome/E_DriverHome.cls`
- **Hook point:** `driverHomePage.js` ~line 709–748 — the finalize/mark-delivered flow already validates short-pay reason + payment method before letting delivery through → the approval gate inserts here. `E_DriverHome` ~2660–2673 writes `Short_Pay_Reason__c` on the in-person Cash/Check/Money-Order path.

## 📌 Pinned tickets (epic BMS-4965)
| Ticket | What | Status |
|---|---|---|
| BMS-4059 | Ph 2 Compliance Escalation (FL/AL) | In Progress — **mine** (AC reads driver-centric but built as back-office) |
| BMS-4060 | Ph 3 Resolution, Reporting & History | In Progress — **mine** |
| BMS-4058 | Ph 1 Driver Detection & Reason Coding | Backlog (driver capture already partly in E_DriverHome) |
| **BMS-5625** | **Ph 4 Driver Finalize-Stop Approval Gate (Configurable)** — NEW | Backlog — **the demo target** |
| **BMS-5626** | **Ph 5 EFT Short Pay Detection via Bank Reconciliation** — NEW | Backlog (fits my back-office queue) |
| **BMS-5627** | **Ph 6 AR Aging (Net-30)** — NEW | Backlog — **Pending Product confirmation, do not build** |
| 4784 / 4785 / 4786 | Design/Prototype, Reporting spike/build | Backlog / To Do |

## ✅ Next steps (in order)
1. **Build the configurable approval placeholder** (metadata-driven approval-layer CMDT + placeholder gate in the LWC) → demo for review. This is **BMS-5625**'s core. Config is a **reusable component**; demo it inside the back-office LWC as a **stand-in** (real home = driverHomePage finalize flow). Move 5625 → In Progress.
2. Keep 4059/4060 In Progress — **do not rewrite**; escalation+resolution logic is reusable for EFT (5626).
3. **Review Ian's Gulf-sandbox approval examples** before building a real approval engine — reuse if it fits.
4. Add a **design spike** for real-time driver-blocking approval (native Approval Process vs custom platform-events/polling; handle offline handheld) before promising the full flow.

## ⛔ Blockers / waiting on
- **Gulf** — approval threshold ($ or %) below which drivers finalize without approval; who can approve in the field in real time; FL/AL escalation numbers.
- **Product (Elliot/Emily)** — ratify the 3 new tickets; confirm BMS-5626 scope (does Bank Rec sync already flag short pays, or must we build detection?); confirm/kill BMS-5627 (AR aging).
- **Dave** — sending Gong/Granola recording of the Publix example + yesterday's driver-view demo.
- Open questions are also tracked on the "Open-Questions-Sanchez" Notion page.

## Honest note to raise with Product
4059/4060 acceptance criteria are **driver-handheld-centric**, but what I built is the **back-office queue** — which aligns with the **EFT case (5626)**, not the driver AC. Flag so tickets reflect reality.
