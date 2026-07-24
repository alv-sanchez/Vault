# Short Pay — Data Model (BMS-4965)

> What the Short Pay feature **pulls** (reads) and **modifies** (writes), object → field level.
> Every write is annotated with **where it is instantiated / set** (the "little comment").
> Source of truth: branch `demo/short-pay-epic-bms-4965` (PR #582). Namespace `ohfy`; Apex uses unqualified API names.

---

## 0. Two independent state axes — do not conflate

There are **two orthogonal short-pay state fields** on `Invoice__c`, owned by different subsystems:

| Field | Axis | Owned by | Values |
|---|---|---|---|
| `Short_Pay_Approval_State__c` | **Driver-finalize approval gate** (BMS-5625/5631) | `E_DriverHome` + `S_ShortPayApprovalWorkflow` | None · Pending · Approved · Rejected |
| `Short_Pay_Status__c` | **Back-office AR resolution lifecycle** (BMS-4965) | `E_ShortPayReview` + `S_ShortPayResolution` + batches | Open · Under Review · Escalated · Rep Collection · Resolved-Credit · Resolved-Collected · Rolled-Forward · Written Off |

They are set by different classes and **never cross**. The approval gate decides whether a driver can finalize a stop; the status lifecycle tracks how AR eventually resolves the dollars.

---

## 1. Objects touched

| Object | Kind | Role in short pay |
|---|---|---|
| **Invoice__c** | sObject | Central record. Carries driver capture, approval-gate state, and AR resolution state. Written by finalize, workflow, resolution, both batches. |
| **Credit__c** | sObject | The **resolution vehicle** — created by `E_ShortPayReview.resolveWithCredit`; its after-insert trigger routes back into `S_ShortPayResolution.resolveByPostedCredits`. |
| **Account** | sObject | Customer (`Invoice__c.Customer__r`). Read for BillingState / Sales_Rep__c / OwnerId; **written** by the TTM rollup batch. |
| **Task** | standard | Rep-collection task created by `S_ShortPayResolution.assignToRepForCollection`. |
| **User / UserRole / PermissionSetAssignment / Group / GroupMember** | standard | Read (SYSTEM_MODE) to resolve & notify approvers. |
| **Event / Delivery__c** | sObject | Route context + driver check-out events (supporting, not short-pay-specific). |
| **Short_Pay_Approval_Layer__mdt** | CMDT | Ordered approval-layer chain (the gate). Read by `S_ShortPayApprovalGate`. |
| **Short_Pay_Threshold__mdt** | CMDT | Per-state escalation caps + rollover window. Read by `S_ShortPayThresholds`. |
| **Short_Pay_Status_Config__mdt** | CMDT | Logical transition-key → target-status map. Read by `S_ShortPayConfig`. |
| **Configuration_Preference__mdt** | CMDT | Notification recipient CSV (read via `E_ConfigurationPreferenceMDT`). |

---

## 2. `Invoice__c` fields — pulled vs modified

Legend: **R** = read/queried, **W** = written (instantiated/set). Formula fields are read-only.

| Field | Type | R — read by | W — set by → value / when |
|---|---|---|---|
| `Short_Pay_Approval_State__c` | Picklist (None/Pending/Approved/Rejected) | E_DriverHome (get*Orders, getInvoicesForDelivery, finalizeStop); S_ShortPayApprovalWorkflow (isClearedByState, recordDecision, getPendingApprovals, getDecisionHistory) | **buildInitiation** → `'Pending'` on (re)initiation · **recordDecision** → `'Rejected'` on reject / `'Approved'` on final-layer approve |
| `Short_Pay_Approval_Layer__c` | Number(3,0) | finalizeStop; recordDecision; getPendingApprovals; getDecisionHistory | **buildInitiation** → `chain[0].requiredLayerSequence` (first required layer) · **recordDecision** → `nextLayer.requiredLayerSequence` when advancing a layer |
| `Short_Pay_Shortfall_Amount__c` | Currency(16,2) — **stamped** (not formula) | finalizeStop; isClearedByState; buildInitiation; recordDecision; getPendingApprovals; getDecisionHistory | **buildInitiation** → `shortfall` (the computed `Total_Due − Amount_Paid` at initiation) |
| `Short_Pay_Reason__c` | Picklist (valueSet `Short_Pay_Reason`) | get*Orders; getInvoicesForDelivery; getPendingApprovals; E_ShortPayReview.getWorklist | **finalizeStop** → from `updateMap['Short_Pay_Reason__c']`, **only when the row is short-paid** (drives `isShortPay`) |
| `Short_Pay_Note__c` | LongTextArea(500) | get*Orders; getInvoicesForDelivery; getPendingApprovals | **finalizeStop** → from `updateMap['Short_Pay_Note__c']` (or null) when short-paid |
| `Amount_Paid__c` | Currency(8,2) | getOrderTotals (SUM); finalizeStop reads incoming map value | **finalizeStop** → parsed `amountPaid` from the invoice update map |
| `Check_Number__c` | Text(30) | get*Orders; getInvoicesForDelivery | **finalizeStop** → `updateMap['Check_Number__c']` when present |
| `Payment_Method__c` | Picklist (`Payment_Method`) | get*Orders; getInvoicesForDelivery; getOrderTotals (filter Cash/Check/Money Order) | **finalizeStop** → `updateMap['Payment_Method__c']` when present |
| `Payment_Terms__c` | Picklist (`Payment_Terms`) | — | **finalizeStop** → `updateMap['Payment_Terms__c']` when present |
| `Status__c` | Picklist (`Status`) | Pervasive (most queries filter `!= 'Draft'`); finalizeStop guards `== 'Cancelled'`; resolution findRollTarget filters `!= 'Cancelled'` | **finalizeStop** → `'Delivered'` **only when the row is NOT a short pay** (short pays are held for the approval flow) |
| `Total_Due__c` | Currency(18,2) **formula** | get*Orders; getOrderTotals (SUM); finalizeStop (gate input); recordDecision; getPendingApprovals; escalation batch (percent cap) | — (formula) |
| `Short_Pay_Amount__c` | Currency(18,2) **formula** = `Total_Due − Amount_Paid + Carried_Forward_Short_Pay` | E_ShortPayReview (worklist/load filters `>0`); S_ShortPayResolution (all loads); both batches | — (formula) |
| `Carried_Forward_Short_Pay__c` | Currency(18,2) | S_ShortPayResolution.findRollTarget, rollToNextInvoice | **rollToNextInvoice** → `carried + source.Short_Pay_Amount__c` **on the roll TARGET invoice** |
| `Short_Pay_Status__c` | Picklist (Open … Written Off) | E_ShortPayReview (all worklist/load filters); S_ShortPayResolution (all loads); escalation batch | **rollToNextInvoice** → target `'Open'` (if not resolvable) / source `ROLLED_FORWARD` · **assignToRepForCollection** → `REP_COLLECTION` · **transitionInvoices** → passed target (CREDIT_POSTED / MANUAL_COLLECTED) · **B_Invoice_ShortPayEscalation** → `ESCALATED` |
| `Short_Pay_Resolved_Date__c` | Date | — | **rollToNextInvoice** & **transitionInvoices** → `System.today()` |
| `Short_Pay_Rolled_To__c` | Lookup(Invoice__c) | — | **rollToNextInvoice** → `target.Id` (on the source invoice) |
| `Credits_Applied__c` | Currency(18,2) | — (feeds `Total_Due__c` formula only) | — (not touched by any short-pay class) |
| `Sales_Rep__c` | Lookup(User) | S_ShortPayResolution.assignToRepForCollection (rep resolution) | — |
| `Invoice_Name__c` / `Invoice_Date__c` | text / Date | worklist display, age calc, rollover window | — |

---

## 3. Custom Metadata Types

### `Short_Pay_Approval_Layer__mdt` — the driver-finalize gate
Read **only** by `S_ShortPayApprovalGate.getActiveLayers` (SYSTEM_MODE; filter `Is_Active__c = true`, order `Sequence__c ASC`).

| Field | Type | Meaning |
|---|---|---|
| `Sequence__c` | Number(4,0) | Approval order; lower runs first. Add a row to append a layer with no code. |
| `Approver_Source__c` | Text(255) | Who approves — a Role DeveloperName / Permission Set API name / Queue DeveloperName. Interpreted by `S_ShortPayApproverResolver`. *(Placeholder pending Gulf sign-off.)* |
| `Threshold_Min__c` | Number(18,2) | Shortfall **dollars** at/above which this layer is required. Below the lowest active layer ⇒ auto-approve (no gate). |
| `Threshold_Percent__c` | Number(5,2) | Shortfall as **% of Total Due** at/above which the layer trips (either $ or %). Dormant on seeded defaults. |
| `Is_Active__c` | Checkbox | Row ignored when false. |

### `Short_Pay_Threshold__mdt` — AR escalation & rollover caps
Read **only** by `S_ShortPayThresholds.loadAll` (SYSTEM_MODE; `Is_Active__c = TRUE`); consumed by escalation batch + resolution rollover/rep windows.

| Field | Type | Meaning |
|---|---|---|
| `Compliance_State__c` | Text(10) | Two-letter state matched to `Account.BillingState` (upper-cased); `*` = wildcard fallback. |
| `Escalation_Amount__c` | Number(18,2) | Short_Pay_Amount at/above which an open short pay auto-escalates. |
| `Escalation_Percent__c` | Number(5,2) | Shortfall as % of Total_Due at/above which it escalates (O-1 lower-of dual cap). *FL default 2% — AI-assumed.* |
| `Aging_Days__c` | Number(4,0) | Invoice-age days at/beyond which an open short pay escalates regardless of amount. |
| `Rollover_Window_Days__c` | Number(4,0) | Collect window (days from invoice date) for rolling to the next invoice; also default rep-collection task due horizon. *FL default 10 — AI-assumed.* |
| `Is_Active__c` | Checkbox | Row ignored when false. |

### `Short_Pay_Status_Config__mdt` — transition → status map
Read **only** by `S_ShortPayConfig.loadConfig` (SYSTEM_MODE; `Is_Active__c = TRUE`).

| Field | Type | Meaning |
|---|---|---|
| `Transition_Key__c` | Text(80) | Logical event. Keys used: `CREDIT_POSTED`, `MANUAL_COLLECTED`, `ESCALATED`, `WRITTEN_OFF`, `ROLLED_FORWARD`, `REP_COLLECTION`. |
| `Target_Status__c` | Text(80) | `Short_Pay_Status__c` value to move to when the transition fires. |
| `Is_Active__c` | Checkbox | Mapping ignored when false. |

**Built-in fallback** (`S_ShortPayConfig.DEFAULTS`, used when no active row): CREDIT_POSTED→Resolved-Credit · MANUAL_COLLECTED→Resolved-Collected · ESCALATED→Escalated · WRITTEN_OFF→Written Off · ROLLED_FORWARD→Rolled-Forward · REP_COLLECTION→Rep Collection.

---

## 4. Per-class READ / WRITE detail (with set-site comments)

### `E_DriverHome` — driver capture + finalize gate
**`getInvoicesForDelivery` / `getTodaysOrders`** (reads only)
- **Reads** `Delivery__c`: Id (by driver + date). `Invoice__c`: Id, Name, Total_Due__c, Payment_Method__c, Amount_Paid__c, Check_Number__c, Status__c, Subtypes__c, **Short_Pay_Approval_State__c, Short_Pay_Shortfall_Amount__c, Short_Pay_Reason__c, Short_Pay_Note__c** (the 4 short-pay fields were added so the modal can rehydrate the block — BMS-5631).
- **Writes:** none.

**`finalizeStop`** — the core write path.
- **Reads** `Invoice__c`: Id, Customer__c, Customer__r.Name, Status__c, Total_Due__c, Short_Pay_Approval_State__c, Short_Pay_Approval_Layer__c, Short_Pay_Shortfall_Amount__c.
- Per invoice it **instantiates** `order = new Invoice__c(Id = orderId)` and conditionally **sets**:
  - `Amount_Paid__c` ← parsed from map · `Check_Number__c`, `Payment_Method__c`, `Payment_Terms__c` ← when present.
  - `isShortPay` = map has non-blank `Short_Pay_Reason__c` ⇒ sets `Short_Pay_Reason__c`, `Short_Pay_Note__c`.
  - Runs the gate: `shortfall = computeShortfall(...)`, `gate = S_ShortPayApprovalGate.evaluate(...)`. If `gate.required && !isClearedByState(...)` it builds a `PendingApproval` and (unless a same-shortfall reject) calls `buildInitiation`.
  - `Status__c = 'Delivered'` **only when NOT short-paid**.
- **Writes (two mutually-exclusive paths):**
  - **Blocked** (any pending approval): `DmlService.doUpdate(approvalInitiations)` — the **only** write; stamps `Short_Pay_Approval_State__c/Layer/Shortfall`. No invoice marked Delivered. Returns `completed=false, approvalRequired=true`.
  - **Clear**: `DmlService.doUpdate(ordersToUpdate)` — commits payment fields + `Status__c='Delivered'`, then inserts check-out `Event`s. Returns `completed=true`.
- The `PendingApproval.approvalState` returned is the **effective post-attempt** state (`'Pending'` on re-initiation, `'Rejected'` only when a same-shortfall reject sticks) — so the driver banner flips immediately on resubmit (BMS-5631 fix).

### `S_ShortPayApprovalWorkflow` — the gate state machine
- **`buildInitiation`** — returns `new Invoice__c(Id, Short_Pay_Approval_State__c='Pending', Short_Pay_Approval_Layer__c=firstLayer, Short_Pay_Shortfall_Amount__c=shortfall)`. **No DML itself** — the caller (`finalizeStop`) persists it. No-ops if chain empty or already-Pending-same-shortfall. Fires best-effort `notifyPending`.
- **`recordDecision(invoiceId, approved)`** — reads the invoice's gate fields; guards `state == Pending`; authorizes via `S_ShortPayApproverResolver.isApprover`. Writes `new Invoice__c(Id=…)`:
  - reject → `Short_Pay_Approval_State__c='Rejected'`, `doUpdate`, returns `'Rejected'`.
  - approve @ deepest layer → `Short_Pay_Approval_State__c='Approved'`, `doUpdate`, returns `'Approved'`.
  - approve @ non-final layer → `Short_Pay_Approval_Layer__c=nextLayer`, `doUpdate`, notify next, returns `'Pending'`.
- **`getPendingApprovals` / `getDecisionHistory`** — reads only (queue + last-25 decided). No DML.
- **`isClearedByState`** — in-memory read; true only if `state==Approved && shortfall <= approvedFor`.

### `S_ShortPayApprovalGate` — CMDT-driven gate
- Reads `Short_Pay_Approval_Layer__mdt` (Sequence__c, Approver_Source__c, Threshold_Min__c, Threshold_Percent__c, Is_Active__c). `evaluate` = deepest applicable layer; `applicableLayers` = full chain. No DML.

### `S_ShortPayApprovalNotifier` / `S_ShortPayApproverResolver` — approver resolution (SYSTEM_MODE, no sObject DML)
- Notifier reads `User` (Id, ManagerId), `CustomNotificationType` (Id by DeveloperName), recipients CSV via `Configuration_Preference__mdt`; sends `Messaging.CustomNotification`.
- Resolver reads `UserRole`, `User`, `PermissionSetAssignment`, `Group`(Queue), `GroupMember` to expand an `Approver_Source__c` into user Ids.

### `E_ShortPayReview` — back-office worklist + actions
- **`getWorklist` / `getStateOptions`** — read `Invoice__c` (Invoice_Name__c, Customer__r.Name, Short_Pay_Amount__c, Short_Pay_Reason__c, Short_Pay_Status__c, Invoice_Date__c, Fulfillment_Location__r.*) where `Short_Pay_Amount__c > 0` and status in {Open, Under Review, Escalated, Rep Collection}. Map → `ShortPayReviewRowDTO`. No DML.
- **`resolveWithCredit`** — **creates `Credit__c`**: `Invoice__c=invoiceId, Account__c=inv.Customer__c, Case_Quantity__c=1, Case_Price__c=creditAmount (supplied or full Short_Pay_Amount__c), Credit_Date__c=today, Reason__c=resolveCreditReason(reason)` (default `'Pricing Issue'`); `doInsert`. The Credit after-insert trigger then drives the invoice to Resolved-Credit via `S_ShortPayResolution`.
- **`markCollected` / `rollToNextInvoice` / `assignToRepForCollection`** — thin delegates to `S_ShortPayResolution`.

### `S_ShortPayResolution` — status lifecycle writes (SYSTEM_MODE, rule 4)
- **`rollToNextInvoice`** — finds a same-customer target invoice within the rollover window; **sets on TARGET** `Carried_Forward_Short_Pay__c += source.Short_Pay_Amount__c` (and `Short_Pay_Status__c='Open'` if not resolvable); **sets on SOURCE** `Short_Pay_Status__c=ROLLED_FORWARD`, `Short_Pay_Resolved_Date__c=today`, `Short_Pay_Rolled_To__c=target.Id`; `doUpdate({source,target})`.
- **`assignToRepForCollection`** — resolves rep (inv.Sales_Rep__c → Customer__r.Sales_Rep__c → Customer__r.OwnerId); **sets** `Short_Pay_Status__c=REP_COLLECTION`; **creates `Task`** (OwnerId=rep, WhatId=inv.Id, Subject/Description w/ amount + Invoice_Name__c, ActivityDate=today+window, Status='Not Started', Priority='High'); `doUpdate({inv})` + `doInsert({task})`.
- **`transitionInvoices`** (private) — for CREDIT_POSTED / MANUAL_COLLECTED: **sets** `Short_Pay_Status__c=target`, `Short_Pay_Resolved_Date__c=today`; `doUpdate(invoices, false)`.

### Batches
- **`B_Invoice_ShortPayEscalation`** — scans open short pays; if it crosses amount / percent / aging caps, **sets** `Short_Pay_Status__c=ESCALATED`; `doUpdate(SYSTEM_MODE)`.
- **`B_Account_ShortPayRollup`** — aggregates trailing-12-month short pays per account; **sets `Account`** `Short_Pay_Count_TTM__c`, `Short_Pay_Amount_TTM__c`; `doUpdate(SYSTEM_MODE)`.

---

## 5. DTO shapes (returned to the LWCs)

**`DriverFinalizeResultDTO`** (global) — `Boolean completed`, `Boolean approvalRequired`, `List<PendingApproval> pendingApprovals`.
- **`PendingApproval`** — `Id invoiceId`, `String customerName`, `Decimal shortfall`, `Integer requiredLayerSequence`, `String requiredApproverSource`, `String approvalState` (`'Pending'`|`'Rejected'`).

**`ShortPayReviewRowDTO`** (global) — `Id invoiceId`, `String invoiceName`, `String customerName`, `Decimal shortPayAmount`, `String reason`, `String status`, `String warehouse`, `String state`, `Integer ageDays`.

---

## 6. LWC → Apex map

| LWC | @AuraEnabled (OMS_UI_Wrappers) | Backend |
|---|---|---|
| **shortPayApprovals** | `getShortPayApprovals()` | `S_ShortPayApprovalWorkflow.getPendingApprovals()` |
| | `getShortPayDecisionHistory()` | `S_ShortPayApprovalWorkflow.getDecisionHistory()` |
| | `recordShortPayApprovalDecision(invoiceId, approved)` | `S_ShortPayApprovalWorkflow.recordDecision(...)` |
| **shortPayReviewQueue** | `getShortPayWorklist(statusFilter, stateFilter)` | `E_ShortPayReview.getWorklist(...)` |
| | `getShortPayStateOptions()` | `E_ShortPayReview.getStateOptions()` |
| | `resolveShortPayWithCredit(invoiceId, amount, reason)` | `E_ShortPayReview.resolveWithCredit(...)` |
| | `markShortPayCollected(invoiceId)` | `E_ShortPayReview.markCollected(...)` |
| | `rollShortPayToNextInvoice(invoiceId)` | `E_ShortPayReview.rollToNextInvoice(...)` |
| | `assignShortPayToRep(invoiceId)` | `E_ShortPayReview.assignToRepForCollection(...)` |
| **driverHomePage** | `getDriverShortPayReasonValues()` | `E_DriverHome.getShortPayReasonValues()` |
| | *(finalize)* `@salesforce/apex/E_DriverHome.markInvoicesAsDelivered` | `E_DriverHome.finalizeStop(...)` (direct — no wrapper) |

---

## 7. Quick answers

- **What's pulled?** `Invoice__c` (payment + both state axes + short-pay fields), `Delivery__c` (route), `Account` (compliance state / rep / owner), approver `User`/`Role`/`Group`/`PermSet`, and the 3 short-pay CMDTs.
- **What's modified, field-level?** On `Invoice__c`: the 4 driver-capture fields (`Amount_Paid__c`, `Payment_Method__c`, `Payment_Terms__c`, `Check_Number__c`, plus `Short_Pay_Reason__c`/`Note`), the 3 gate fields (`Short_Pay_Approval_State__c`/`Layer__c`/`Shortfall_Amount__c`), `Status__c` (Delivered, non-short-pay only), and the resolution fields (`Short_Pay_Status__c`, `Short_Pay_Resolved_Date__c`, `Short_Pay_Rolled_To__c`, `Carried_Forward_Short_Pay__c`). Plus **new `Credit__c`** on credit resolution, **new `Task`** on rep assignment, and **`Account` TTM rollups** by batch.
- **What's never written?** All formula fields (`Total_Due__c`, `Short_Pay_Amount__c`), and `Credits_Applied__c`.
