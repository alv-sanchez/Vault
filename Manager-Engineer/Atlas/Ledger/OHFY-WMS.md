---
area: OHFY-WMS
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 OHFY-WMS — Capabilities (3)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| S_TransferAlerts resolves close-to-code urgency against the RECEIVING warehouse's CTC_Threshold__mdt row (not the origin), giving per-warehouse/brand alert thresholds for free via existing CMDT rather than new schema | [BMS-3768](https://ohanafy.atlassian.net/browse/BMS-3768) | `OHFY-WMS/force-app/main/default/classes/services/transferAlert/S_TransferAlerts.cls:9` | `5cc70f086` | 2026-07-10 |
| Transfer_Alert__c + Transfer_Alert_Event__e: generic, Alert_Type__c-discriminated per-transfer alert record with idempotent (External_Id__c) redelivery-safe materialization and custom-permission-gated notification — extensible to new alert types without new schema | [BMS-3768](https://ohanafy.atlassian.net/browse/BMS-3768) | `OHFY-WMS/force-app/main/default/classes/executables/transferAlert/TransferAlertEventHandler.cls:12` | `5cc70f086` | 2026-07-10 |
| Days of Inventory report type — the inventory-health reporting surface | [BMS-3779](https://ohanafy.atlassian.net/browse/BMS-3779) | `OHFY-WMS/.../reportTypes/Days_of_Inventory.reportType-meta.xml` | `956df295` | 2026-07-08 |
