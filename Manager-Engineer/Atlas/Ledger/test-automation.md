---
area: test-automation
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 test-automation — Capabilities (1)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| Worker subset-lock support for Playwright specs — registerSubsetLock(test, subset) serializes parallel workers touching the same shared org-data subset, preventing cross-test data collisions | [BMS-3768](https://ohanafy.atlassian.net/browse/BMS-3768) | `test-automation/support/subsets.ts:49` | `cf37cc150` | 2026-07-14 |
