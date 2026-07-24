---
area: OHFY-OMS
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 OHFY-OMS — Capabilities (2)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| Per-line supplier-receivables aging that ages each billback line off its own invoice date (falls back to header Charge_Date for non-invoice lines) | [BMS-5843](https://ohanafy.atlassian.net/browse/BMS-5843) | `OHFY-OMS/force-app/main/default/classes/services/billback/S_SupplierReceivables.cls:488` | `535d108de` | 2026-07-24 |
| Persistent per-agreement billback header keyed bb:agr:{id} / bb:sup:{id} with agreement-in-line-key retract+recreate for non-reparentable master-detail re-homing | [BMS-5843](https://ohanafy.atlassian.net/browse/BMS-5843) | `OHFY-OMS/force-app/main/default/classes/services/billback/S_BillbackCalculation.cls:478` | `535d108de` | 2026-07-24 |
