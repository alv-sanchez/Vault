---
area: OHFY-OMS-UI
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 OHFY-OMS-UI — Capabilities (1)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| getLastSoldPrice(accountId, itemId) — cacheable @AuraEnabled lookup of the last invoice price an account paid for an item (Placement__c.Last_Invoice_Price__c), race-safe via an Id DESC tiebreaker on the ordering | [BMS-5431](https://ohanafy.atlassian.net/browse/BMS-5431) | `OHFY-OMS-UI/force-app/main/default/classes/wrappers/OMS_UI_Wrappers.cls:2247` | `6e8834204` | 2026-07-14 |
