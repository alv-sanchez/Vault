---
key: BMS-5791
title: PO-side optional billback — freight-scoped supplier-owes-distributor origination
epic: BMS-5161
repo: OHFY-Split
status: Building
branch: feat/po-freight-billback-bms-5791
base_branch: feat/freight-billback-generation-bms-5790
depends_on: [BMS-5790, BMS-5789]
packages_touched: [OHFY-Data-Model, OHFY-Service-Locator, OHFY-OMS, OHFY-WMS]
ui: not-needed
risk:
dod_met: false
pr:
---

# BMS-5791 — PO-side freight billback origination

Third child of epic BMS-5161 (Supplier Freight Cost Billback). Stacked on BMS-5790
(freight billback pipeline). Base branch = `feat/freight-billback-generation-bms-5790`.

## DoD (from root + package CLAUDE.md, restated before build)
- Add `Billback_Line__c.Purchase_Order__c` lookup — fourth billback source alongside
  Invoice_Item / Inventory_Adjustment / Transfer_Group.
- Originate a `Type=Freight` billback with `Account=Supplier` when a PO reconciliation
  flags supplier-owed inbound freight — through the EXISTING pipeline, reusing the
  freight-billback calculation machinery (coverage cascade via
  `S_SupplierFundingAgreement.mostSpecific`, deterministic External_Id upsert,
  status preservation, stale-line retraction). No new coverage/calculation engine.
- Freight-scoped PO origination ONLY. Explicitly NOT a general PO-reconciliation-to-billback
  engine (short-pay, price variance) — that is BMS-4951, out of scope. Do not generalize.
- No raw SOQL/DML (QueryService/DmlService). Logger in every catch + flush. No `ohfy__`
  prefix in Apex. SYSTEM_MODE only with rule-citing comment. ≥90% coverage on touched files.

## Schema facts found (PO object, OHFY-Data-Model)
- `Purchase_Order__c.Supplier__c` = master-detail → Account (the supplier). This IS the
  billback account — no separate recoverable-account field needed.
- `Purchase_Order__c.Status__c` = restricted picklist (Status value set: New, In Progress,
  Complete, Cancelled, …). `Purchase_Order_Date__c` = date used as coverage as-of date.
- NO freight field, NO reconciliation flag shipped on the PO (confirms epic code audit —
  "no shipped PO reconciliation flag yet"). So I DEFINE the minimal origination trigger point.

## Judgment calls
- **No shipped PO-reconciliation trigger point existed** → added a minimal
  `Supplier_Owes_Freight__c` (Checkbox) + `Recoverable_Freight_Cost__c` (Currency) on the PO
  to represent "supplier owes inbound freight on this PO" (the reconciliation outcome). The
  real-time hook fires when the flag flips false→true with a freight cost + supplier present.
- **New `POFreightBillbackService` Tier-1 interface** (not a method added to 5790's
  `FreightBillbackService`) → keeps this fully additive, touches ZERO 5790 files, avoids a
  released-interface signature change and a merge collision with PR #514. Same cross-tier
  pattern (WMS resolves via ServiceLocator → OMS impl enqueues async generator).
- Type=Freight (freight-scoped). The ticket's "Generic if not cleanly freight" branch belongs
  to the out-of-scope general engine — not built here.

## Build log
- 2026-07-10 — Studied 5790 pipeline (S_FreightBillbackCalculation, service/queueable/batch/hook).
  Implementing parallel PO source: 3 Data-Model fields, POFreightBillbackService interface,
  S_POFreightBillbackCalculation + Q_ + B_ + S_ + impl + CMDT, WMS PO trigger hook + CMDT, tests.
