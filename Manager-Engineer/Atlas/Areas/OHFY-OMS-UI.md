---
tags: [atlas, area]
area: OHFY-OMS-UI
ticket_count: 4
---
# 🗺️ OHFY-OMS-UI
> OMS UI — driver & sales-rep screens

**Repo:** `OHFY-Split/OHFY-OMS-UI` · rules + DoD live in `OHFY-OMS-UI/CLAUDE.md`.

## 🎟️ Tickets that touch this area (4)
- [BMS-3853](https://ohanafy.atlassian.net/browse/BMS-3853)
- [BMS-5625](https://ohanafy.atlassian.net/browse/BMS-5625) Short Pay Automation — Ph 4: Driver Finalize-Stop Approval Gate (Configurable) — `Needs Refinement` · [#439](https://github.com/Ohanafy/OHFY-Split/pull/439)
- [BMS-5902](https://ohanafy.atlassian.net/browse/BMS-5902) Supplier Agreement Terms LWC — per-charge-type split editor — `Backlog`
- [BMS-5903](https://ohanafy.atlassian.net/browse/BMS-5903) Supplier Owed Dashboard LWC — calculated owed rollup — `Backlog`

## 🔗 Logged notes here
- [[BMS-3853-route-profitability-analytics]]
- [[BMS-5625-driver-finalize-approval-gate]]
- [[BMS-5902-supplier-agreement-terms-lwc]]
- [[BMS-5903-supplier-owed-dashboard-lwc]]

## 🧱 Capabilities already built here (1)
_Reach for these before building — the anti-reinvention catalog (cited + shipped). Full table: [[Ledger/OHFY-OMS-UI]]._
- **getLastSoldPrice(accountId, itemId) — cacheable @AuraEnabled lookup of the last invoice price an account paid for an item (Placement__c.Last_Invoice_Price__c), race-safe via an Id DESC tiebreaker on the ordering** (BMS-5431) — `OHFY-OMS-UI/force-app/main/default/classes/wrappers/OMS_UI_Wrappers.cls:2247`

## 🕸️ See the web
Open **Graph View** and filter `tag:#area` — this note is a hub; its links are the tickets/epics that hit this part of the product. Backlinks (bottom of pane) show everything pointing here.