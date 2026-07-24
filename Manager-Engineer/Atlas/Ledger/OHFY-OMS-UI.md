---
area: OHFY-OMS-UI
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 OHFY-OMS-UI — Capabilities (3)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| posDeploymentCapture LWC — offline-first driver capture: reason codes, photo upload, lightning/mobileCapabilities geolocation, localStorage queue with per-row failure surfacing | [BMS-3854](https://ohanafy.atlassian.net/browse/BMS-3854) | `OHFY-OMS-UI/force-app/main/default/lwc/posDeploymentCapture/posDeploymentCapture.js:1` | `93c243612` | 2026-07-21 |
| POSDeploymentController — POS deployment assignment, offline-batch driver sync w/ cancelled-assignment conflict handling, dashboard aggregates, compliance report, 4-week pre/post ROI vs same-territory control group | [BMS-3854](https://ohanafy.atlassian.net/browse/BMS-3854) | `OHFY-OMS-UI/force-app/main/default/classes/controllers/posDeployment/POSDeploymentController.cls:1` | `93c243612` | 2026-07-21 |
| getLastSoldPrice(accountId, itemId) — cacheable @AuraEnabled lookup of the last invoice price an account paid for an item (Placement__c.Last_Invoice_Price__c), race-safe via an Id DESC tiebreaker on the ordering | [BMS-5431](https://ohanafy.atlassian.net/browse/BMS-5431) | `OHFY-OMS-UI/force-app/main/default/classes/wrappers/OMS_UI_Wrappers.cls:2247` | `6e8834204` | 2026-07-14 |
