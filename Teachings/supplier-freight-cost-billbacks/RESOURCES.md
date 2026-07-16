# Resources — Supplier Freight Cost Billbacks (BMS-5161)

## This teaching set
- `MISSION.md` — why this set exists + the one idea to internalize.
- `lessons/0001-what-youre-solving.html` — the business hole + the reuse reframe (start here).
- `lessons/0002-two-doors-one-ledger.html` — the mechanism, end to end.
- `reference/erd-and-flows.md` / `.html` — DBML ERD + mermaid flowcharts (the fast reload).

## The epic + stories (Jira)
- Epic: **BMS-5161** — [REQ-234] Supplier Freight Cost Billbacks · https://ohanafy.atlassian.net/browse/BMS-5161
- **BMS-5789** — freight-cost capture fields on `Transfer_Group__c` (PR #511)
- **BMS-5790** — freight billback generation + freight/claim overlap audit (PR #514)
- **BMS-5791** — PO-side freight billback (PR #516)
- **BMS-5792** — the UI (freight-cost entry quick action + visibility panel) — built this session

## The rails it reused (don't rebuild)
- `Billback__c` / `Billback_Line__c` ledger (BMS-4141) — `OHFY-Data-Model/.../objects/Billback__c`
- `S_BillbackCalculation` idempotent recompute pattern — `OHFY-OMS/.../services/billback/S_BillbackCalculation.cls`
- `Supplier_Funding_Agreement__c` + `S_SupplierFundingAgreement` coverage cascade

## The code this epic added
- `S_FreightBillbackCalculation` / `S_POFreightBillbackCalculation` — the two generators (OHFY-OMS)
- `FreightBillbackService` / `POFreightBillbackService` — Tier-1 Service-Locator interfaces
- `TransferGroupTriggerService` / `PurchaseOrderTriggerService` — the two door triggers (OHFY-WMS)
- `FreightBillbackUIController` + `freightCostEntry` / `freightBillbackPanel` LWCs (OHFY-WMS-UI, BMS-5792)
- `B_FreightBillbackDetection` / `B_POFreightBillbackDetection` — nightly idempotent backstops
- `B_FreightClaimOverlapAudit` — stamps `Billback__c.Has_Related_Claim__c`

## Live demo (validated org `bms-5113-5161-integration`)
- `TG-00000001` — Riverbend Brewing Co., $1,200 cross-state freight @ 40% → **$480**
- PO path — $300 freight @ 40% → **$120**

## Build-overview papertrail
- `Manager-Engineer/Build-Overview/Sprint-9/BMS-5161-supplier-freight-cost-billbacks/` — SESSION.md, overview, strata orientation.
