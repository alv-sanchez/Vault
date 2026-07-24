# BMS-4965 Short Pay — QA AC Validation (live in `ohfy-val-shortPay`)

**Date:** 2026-07-17 · **Org:** `ohfy-val-shortPay` (00DEm00000TevV7MAJ, ns `ohfy`) · **Running user:** `test-hukqsmvfh9sh@example.com` (005Em00000i4urwIAA)
**Method:** live anonymous Apex against the deployed combined build (main-tip + BMS-5625 + BMS-4059/4060 + BMS-5631). Every "PASS (live)" verdict cites output observed in this org today. No product code, git, or Jira was touched. The org is left fully staged for the manual dry run (see §4 and the script in §3).

---

## 1. Per-ticket AC results

### BMS-5625 — Driver finalize approval gate (Ph4a)

| AC | Verdict | Evidence (observed live unless noted) |
|---|---|---|
| AC1 — below lowest threshold auto-approves | **PASS (live + unit)** | Lowest active layer is L1 with `Threshold_Min__c = 0`, so **no positive shortfall sits below the lowest threshold** in current config — only a non-short-pay does. Live: `evaluate(0.00, 500)` → `required=false, layer=null, src=null`. The true auto-approve branch (shortfall below a >0 lowest layer) is unit-proven in `S_ShortPayApprovalGate_T` via `layerOverride` injection. |
| AC2 — shortfall ≥ threshold → gate required, invoice enters Pending | **PASS (live)** | `evaluate(0.01, 500)` → `required=true, layer=1, src=Delivery_Supervisor`. Pending entry via workflow: `buildInitiation(DRVDEMO-1, 300, 500)` + commit → invoice a16Em0000056yrRIAQ read back as `Short_Pay_Approval_State__c=Pending, Layer=1, Shortfall=300`. Org's deployed `E_DriverHome.finalizeStop` blocks via `!S_ShortPayApprovalWorkflow.isClearedByState(...)` (line 2712) and initiates via `buildInitiation` (line 2730) — confirmed in the deployed class body. |
| AC6 — config change, no code (reads live CMDT) | **PASS (live)** | Boundary against deployed `Short_Pay_Approval_Layer__mdt` ($0/$250/$1000): `evaluate(249, 10000)` → layer **1** (Delivery_Supervisor); `evaluate(250, 10000)` → layer **2** (Sales_Manager); `evaluate(1000, 10000)` → layer **3** (Regional_Director). The chain is driven purely by the CMDT rows — editing `Threshold_Min__c` moves the boundary with zero code. |
| AC7 — in-app enforcement only | **PASS (code inspection)** | No geofencing/location/external enforcement anywhere in the gate, workflow, or the finalize block: grep for `geofenc|latitude|longitude|Location.getCurrent|distance` across `S_ShortPayApprovalGate` + `S_ShortPayApprovalWorkflow` → no matches. `finalizeStop` gate = evaluate → return `pendingApprovals` + `completed=false`; persist nothing; no callouts. |
| AC8 — coverage | **PASS (CI-known)** | Reported as known from the branch CI: gate **96%**, DTO **100%**, `E_DriverHome` **79%**. Not re-run (whole-suite re-run out of QA scope). |

### BMS-5631 — Sequential approval workflow (Ph4b)

$300 shortfall of $500 total → applicable chain observed live: `applicableLayers(300,500) = [1:Delivery_Supervisor, 2:Sales_Manager]` (L3 $1000 not applicable).

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — buildInitiation → Pending at first required layer | **PASS (live)** | DRVDEMO-1 (a16Em0000056yrRIAQ): before = `State=None`. After `buildInitiation(order, 300, 500)` + update: **`State=Pending, Layer=1, Shortfall=300`** (SOQL read-back). |
| AC2+AC3 — approve layer-by-layer → Approved; finalize cleared | **PASS (live)** | As staged approver: `recordDecision(DRVDEMO-1, true)` → returned `Pending`, read-back `Layer=2`. Second `recordDecision(true)` → returned `Approved`, read-back `State=Approved, approvedFor=300.00`. Then: `isClearedByState(inv, 300)=true`, `isClearedByState(inv, 250)=true` (smaller covered), `isClearedByState(inv, 400)=false` (larger forces fresh chain). `getPendingApprovals()` returned 1 for the authorized user before deciding. |
| AC4 — reject → Rejected | **PASS (live)** | DRVDEMO-2 (a16Em0000056yrSIAQ): fresh `buildInitiation(300, 500)` → Pending L1; `recordDecision(false)` → returned `Rejected`; read-back `State=Rejected, Layer=1`. |
| AC5 — authorization enforced | **PASS (live, both directions)** | **Before** approver staging: `recordDecision(DRVDEMO-1, true)` threw `ohfy.S_ShortPayApprovalWorkflow.ShortPayApprovalException: Only an approver for this short-pay layer can approve or reject it.` and `getPendingApprovals()` = **0** for the unauthorized user. **After** staging (3 permsets assigned): same user decided both layers successfully (AC2/3 above) and `isApprover` returned `true` for all three sources. |
| AC6 — tests on branch | **PASS (CI-verified)** | `S_ShortPayApprovalWorkflow_T`, `S_ShortPayApproverResolver_T`, `S_ShortPayApprovalNotifier_T`, `S_ShortPayApprovalGate_T` all present in the org (deployed with the branch). Not re-run. |

### BMS-4059 — Per-state escalation batch

Config (deployed `Short_Pay_Threshold__mdt`): **FL** = $50 amount / 2% / 7d aging / 10d roll window; **AL** = $0 amount + 0d aging (always routes); **`*`** = all-null (never trips).

| AC | Verdict | Evidence |
|---|---|---|
| Per-state escalation flips `Short_Pay_Status__c` → Escalated per the right state's threshold | **PASS (live)** | `Database.executeBatch(new ohfy.B_Invoice_ShortPayEscalation(), 200)` → AsyncApexJob **Completed, 0 errors**. Flips observed: SEED-4965-**1** FL $125 Open→Escalated (**amount cap** ≥$50); SEED-4965-**2** FL $48.50 (< $50) Open→Escalated (**aging path**: invoice 2026-07-10, age 7d ≥ 7); SEED-4965-**3** FL $310.75 UR→Escalated (amount); SEED-4965-**4** AL $89 UR→Escalated (**AL $0 always-route**). Correct negative: SEED-4965-**7** FL $15.25 age 3d stayed **Rep Collection** (under both caps). Percent path couldn't fire live (seed rows have `Total_Due__c=0` — formula basis; percent is skipped by design) — percent branch is code-inspected + unit-covered in `B_Invoice_ShortPayEscalation_T`. |
| Changes I caused | Restored | All four flips were reverted to the original spread after validation (§4). A dry-run re-run of the batch will legitimately re-escalate SEED-1/2/3/4 — that IS the feature. |

### BMS-4060 — Back-office resolution + rollups + worklist

| AC | Verdict | Evidence |
|---|---|---|
| Resolve-with-credit → Resolved-Credit + resolved date | **PASS (live)** | `E_ShortPayReview.resolveWithCredit(SEED-4965-1, null, null)` → Credit `a0OEm00000DlMNNMA3` ($125, "Pricing Issue") inserted; Credit after-insert trigger drove invoice to **`Short_Pay_Status__c=Resolved-Credit`, `Short_Pay_Resolved_Date__c=2026-07-17`** (read-back). |
| Roll-forward → source Rolled-Forward, target carries shortfall | **PASS (live)** | Created target invoice `QA-4060-ROLL-TARGET` (a16Em0000057fErIAI, Gulf Coast, dated 2026-07-17 — inside SEED-2's FL 10-day window from 2026-07-10). `rollToNextInvoice(SEED-4965-2)` returned the target Id. Read-back: source `Rolled-Forward, Resolved=2026-07-17, Short_Pay_Rolled_To__c=a16Em0000057fErIAI`; target `Carried_Forward_Short_Pay__c=48.50`, `Short_Pay_Amount__c=48.50`, `Short_Pay_Status__c=Open` (i.e., stays in the queue). |
| Rep-collection | **FAIL — Defect D1 (known, reproduced)** | `assignToRepForCollection(SEED-4965-7)` → `System.DmlException: Insert failed. First exception on row 0; first error: FIELD_INTEGRITY_EXCEPTION, Related To ID: id value of incorrect type: a16Em0000056ymhIAA: [WhatId]`. See §2. |
| TTM rollups populate | **PASS (live)** | `Database.executeBatch(new ohfy.B_Account_ShortPayRollup(), 200)` → Completed, 0 errors. `Account.Short_Pay_Count_TTM__c / Amount_TTM__c`: Gulf Coast **3 / $1,297**; Heart of Dixie **2 / $629**; Sunshine **3 / $451** — each matches SUM/COUNT of that account's `Short_Pay_Amount__c > 0` invoices in the TTM window (see D2 observation on double-count). |
| Worklist count + filters still correct after mutations | **PASS (live)** | Mid-validation: `getWorklist(null,null)`=**6** (SEED-1 Resolved-Credit and SEED-2 Rolled-Forward correctly excluded; QA roll target correctly included as Open $48.50); `getWorklist('Escalated',null)`=**4**; `getStateOptions()`=`AL,FL`. After final restore: `getWorklist(null,null)`=**7** (the original seven seeds). |

---

## 2. Defects

### D1 — `assignToRepForCollection` fails: Task.WhatId rejects Invoice Id (known, confirmed) — owner: BMS-4060 PR (#557)
- **Repro (live):** `ohfy.E_ShortPayReview.assignToRepForCollection('a16Em0000056ymhIAA')` →
  `FIELD_INTEGRITY_EXCEPTION, Related To ID: id value of incorrect type: a16Em0000056ymhIAA: [WhatId]`
- **Root cause (confirmed in source):** `OHFY-Data-Model/.../objects/Invoice__c/Invoice__c.object-meta.xml` has **`<enableActivities>false</enableActivities>`** — `Task.WhatId` only accepts activity-enabled objects, so the collection Task insert in `S_ShortPayResolution.assignToRepForCollection` can never succeed against `ohfy__Invoice__c`.
- **Suggested fix:** flip `enableActivities` to `true` on `Invoice__c` (OHFY-Data-Model change, released-metadata-safe: enabling activities is additive). Alternative if activities are deliberately off: create the Task without `WhatId` and reference the invoice in `Description` + a custom lookup. Note the invoice status update commits *before* the Task insert in the same method — if a caller swallows the exception the invoice is left in `Rep Collection` with no Task; make the two DML operations all-or-nothing when fixing.
- **Side effects during QA:** none persisted (transaction rolled back).

### D2 — Observation: TTM rollup double-counts rolled-forward balances — owner: BMS-4060
- `B_Account_ShortPayRollup` counts every invoice with `Short_Pay_Amount__c > 0`. A rolled-forward source keeps its positive `Short_Pay_Amount__c` (status `Rolled-Forward`) while the target gains the same amount via `Carried_Forward_Short_Pay__c` → the shortfall counts **twice** for the account. Observed live: Gulf Coast TTM = $1,297 = 48.50 (SEED-2, rolled) + 1,200 (SEED-6) + **48.50 again** (roll target). Suggested: exclude `Rolled-Forward` status (or subtract carried-forward) in the rollup query. Low severity — signal inflation only, no functional break.

### D3 — Observation (pre-existing, outside epic): Credit delete cascade fails on FLS
- Deleting the QA credit `a0OEm00000DlMNNMA3` fails: `CreditTriggerService.removeCreditFromInvoice` → `InvoiceAfterUpdate.setName` → `DmlService.doUpdate` → "fields being inaccessible on Sobject ohfy__Invoice__c". Not caused by this epic (Credit/Invoice trigger chain on main); logged for awareness. Consequence: the $125 QA credit remains attached to SEED-4965-1 (it does **not** affect the invoice's totals — `Credits_Applied__c=0`, `Short_Pay_Amount__c=125` verified post-restore).

---

## 3. DRY RUN SCRIPT (~10 min, click-by-click)

Login: `sf org open -o ohfy-val-shortPay`. You are already an authorized approver for **all three layers** and the driver on today's route. Thresholds: L1 $0 (Delivery Supervisor) → L2 $250 (Sales Manager) → L3 $1,000 (Regional Director).

**Part A — driver shorts a payment and gets blocked (3 min)**
1. Open the **Driver Home** tab. Today's route shows **1 stop — BMS4965 Sunshine Beverages (FL)** with two invoices: **DRVDEMO-1** and **DRVDEMO-2**, $500.00 due each.
2. Open the stop. On **DRVDEMO-1**, enter **Amount Paid = 200** (shortfall **$300**), pick Short Pay Reason **Partial Payment** (add any note).
3. Click **Finalize Stop** → **blocked banner**: approval required, Layer 1 (Delivery_Supervisor). Nothing is persisted as delivered; the invoice is now **Pending** at Layer 1.

**Part B — approve L1 + L2 (2 min)**
4. Open the **Short Pay Approvals** tab (`Short_Pay_Approvals`). DRVDEMO-1 appears: $300 shortfall of $500.
5. Click **Approve** → the row stays pending, now at **Layer 2** (a $300 shortfall must clear L1 and L2; L3 only fires ≥ $1,000).
6. Click **Approve** again → state becomes **Approved**; the row leaves the queue.

**Part C — driver finalizes (1 min)**
7. Back on **Driver Home**, Finalize the stop again with the same $200 paid → **succeeds** (approval covers a shortfall ≤ $300). Optional: repeat A on **DRVDEMO-2** and click **Reject** in the Approvals tab instead — the driver stays blocked (state Rejected).

**Part D — back-office review queue (4 min)** — open the **Short Pay Review Queue** tab (`Short_Pay_Review_Queue`). You'll see 7 rows (plus DRVDEMO-1 if you completed Part C): Open, Under Review, Escalated, Rep Collection across FL + AL.
8. **Resolve with credit:** pick **SEED-4965-3** ($310.75, Under Review, Sunshine) → resolve-with-credit action, accept the default (full) amount → row leaves the queue; the invoice record shows `Short Pay Status = Resolved-Credit` + today's resolved date. *(Avoid SEED-4965-1 for this step — it carries a leftover $125 QA credit; harmless, but a second credit would post.)*
9. **Roll forward:** pick **SEED-4965-2** ($48.50, Open, Gulf Coast) → roll-forward action → it rolls onto invoice **QA-4060-ROLL-TARGET** (Gulf Coast, dated today, inside the FL 10-day window). Source shows `Rolled-Forward`; the target appears in the queue as Open $48.50.
10. **Escalation view:** filter Status = **Escalated** → SEED-4965-5 ($540, AL) and SEED-4965-6 ($1,200, FL). To watch escalation live, run `Database.executeBatch(new ohfy.B_Invoice_ShortPayEscalation(), 200);` in Dev Console → SEED-1 (FL amount cap), and SEED-4 (AL always-route) flip to Escalated on refresh.
11. **Known defect:** do NOT expect the **assign-to-rep** action to work — it errors with the Task WhatId FIELD_INTEGRITY_EXCEPTION (D1).

---

## 4. Org final-state inventory

| Item | State |
|---|---|
| **DRVDEMO-1 / DRVDEMO-2** (a16Em0000056yrR / …yrS) | `Amount_Paid=0`, `Total_Due=$500` (via `Credits_Applied=-500`), `Status=Out For Delivery`, `Short_Pay_Approval_State=None`, layer/shortfall cleared |
| **SP-DEMO delivery** (a0SEm00000AMx0TMAT) | `Delivery_Date = 2026-07-17` (today), Driver = running user; `getTodaysRouteStops(null)` = **1 stop** ✔ |
| **SEED-4965-1…7** | Restored to original spread: 1=Open $125 FL · 2=Open $48.50 FL · 3=Under Review $310.75 FL · 4=Under Review $89 AL · 5=Escalated $540 AL · 6=Escalated $1,200 FL · 7=Rep Collection $15.25 FL. Worklist = **7 rows**, `getStateOptions()=AL,FL` ✔ |
| **QA-4060-ROLL-TARGET** (a16Em0000057fEr) | Clean Gulf Coast invoice dated today, no shortfall, `Status=New` — ready as the user's roll-forward target in step 9 |
| **Approver staging (left in place)** | Permission sets `Delivery_Supervisor` (0PSEm00000BMXBtOAP), `Sales_Manager` (0PSEm00000BMWN8OAP), `Regional_Director` (0PSEm00000BMPmFOAX) assigned to 005Em00000i4urwIAA; `isApprover` = true/true/true verified live |
| **Account TTM rollups** | Populated by the live batch run: Gulf Coast 3/$1,297 · Heart of Dixie 2/$629 · Sunshine 3/$451 |
| **Leftover QA artifact** | Credit `a0OEm00000DlMNNMA3` ($125, Pricing Issue) on SEED-4965-1 — could not be deleted (D3, pre-existing trigger FLS issue); does not affect SEED-1's totals or queue behavior |
| **Tabs** | `Driver_Home`, `Short_Pay_Review_Queue`, `Short_Pay_Approvals` confirmed present (metadata list) |
| **Pending approvals queue** | Empty (`getPendingApprovals()=0`) — clean slate for the dry run |
