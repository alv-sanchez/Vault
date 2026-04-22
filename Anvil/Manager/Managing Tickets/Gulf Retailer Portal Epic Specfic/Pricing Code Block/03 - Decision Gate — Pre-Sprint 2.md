---
title: Decision Gate — Pre-Sprint 2
created: 2026-04-22
updated: 2026-04-22
epic: Gulf Retailer Portal
owner: Alvaro Sanchez
status: proposed
tags: [gulf, pricing, decision-gate, sprint-planning]
---

# Decision Gate — Pre-Sprint 2

> **Use**: Walk this list once in a 30-minute meeting with Matt Keeter + Emily Shull + Elliot Flores before 2026-05-01. Every question has a **recommended default** so the meeting can run short if everyone agrees.

> **Scope**: Decisions needed before Sprint 2 commits so execution isn't gated mid-sprint.

---

## 1. Pricing data topology (Track A1)

**Question**: Where do the 154+ pricing codes per account physically live in Salesforce?

| Option | Pros | Cons |
|---|---|---|
| **A1.a — Reuse existing `Pricelist__c` + `Pricelist_Item__c`** | Fastest. OHFY-Ecom already reads from these. Sprint-2 ready. | May not natively support volume tiers and time-windowed promos without new fields. |
| **A1.b — Extend with `Pricing_Rule__c` junction** | Most expressive. Clean per-volume-tier, per-promo modelling. | New object, more metadata, slower Sprint-2. |
| **A1.c — Custom Metadata Types (CMDT)** | Fast read. Deployable. | 154+ records per account × 1000s of accounts blows past CMDT limits. Not viable. |

**Recommended default**: **A1.a for Sprint 2**. Extend to A1.b (add a `Pricing_Rule__c` child or sibling object) during Sprint 3 if Sprint-2 analysis shows A1.a can't express volume tiers cleanly.

**Decision owner**: Matt Keeter.

---

## 2. `PricingResolver` interface shape (Track B1)

**Question**: Confirm the Apex interface shape before any consumer binds to it.

Proposed:
```apex
public interface PricingResolver {
    PricingResult resolve(Id accountId, Id itemId, Decimal quantity, Datetime asOf);
    Map<Id, PricingResult> resolveBulk(Id accountId, Map<Id, Decimal> itemIdToQty, Datetime asOf);
}

public class PricingResult {
    public Decimal unitPrice;
    public String tierName;
    public String appliedCodeName;
    public Id sourceRecordId;
    public String explanation; // human-readable
    public Boolean isMock;
}
```

**Recommended default**: Accept as-is. Revisit only if a concrete consumer reveals a missing field.

**Decision owner**: Engineering lead.

---

## 3. Mock resolver behaviour (Track B2)

**Question**: What does the mock return when there is no real price configured for an account/item?

**Options**:
- **Option 1** — Return the existing `Pricelist__c` price (passthrough). Safest for Sprint-2 UI validation because nothing visually changes.
- **Option 2** — Return a sentinel (e.g., `unitPrice = 0, appliedCodeName = 'MOCK'`) and let the UI show a badge. Makes it obvious we're not on the real resolver yet.

**Recommended default**: **Option 1 (passthrough)** + a subtle "Mock" badge in dev/preview envs only. Production never runs the mock.

**Decision owner**: Engineering lead + product.

---

## 4. `Order__c` / `Invoice__c` owning package

**Question**: Which package owns the `Order__c` definition? Any package owning `Invoice__c`?

**Why it matters**:
- BMS-3929 needs a new `Order__c.Reorder_Source__c` field — must land in the owning package, not OHFY-Ecom.
- BMS-3930 Ph 1 ACs that reference `Invoice__c` can't be tightened without this.
- Track A2 field additions may need to land across two packages.

**Recommended default**: If OHFY-Data-Model owns `Order__c`, add a sub-task to that package for every field OHFY-Ecom needs. If it's somewhere else, same pattern.

**Decision owner**: Engineering lead — likely a 5-minute `git grep` exercise.

---

## 5. BMS-3930 — Outstanding_Balance source

**Question**: In Ph 1, where does `Account.Outstanding_Balance__c` get its value?

**Options**:
- **Manual** — AR types it in. Fastest Sprint-2 path. Stale-data trade-off.
- **Rollup** — requires `Invoice__c` (or equivalent) in the owning package with `Payment_Status__c` and `Amount__c`. If that exists, a rollup summary field is ideal. If it doesn't, this option is blocked on the owning-package work.
- **Deferred** — Ph 1 ships the display only; balance shows "Not yet available" until Ph 2 ERP sync lands.

**Recommended default**: **Manual for Ph 1**, with a clear field description noting Ph 2 will replace the writer. Reassess at the Sprint-3 retro.

**Decision owner**: Product + AR lead.

---

## 6. BMS-3930 scope — Ph 1 / Ph 2 split

**Question**: Do we approve splitting BMS-3930 into Ph 1 (Account fields + portal page) and Ph 2 (ERP sync + invoices + aging + PDFs + payment methods)?

**Recommended default**: **Yes.** Create BMS-3930-Ph1 and BMS-3930-Ph2 (new Jira keys). Close BMS-3930 once Ph 2 lands (Sprint 6+).

**Decision owner**: Product owner.

---

## 7. BMS-4258 — "Contacts to Multiple Accounts" org setting

**Question**: Is the org-level setting enabled on the Gulf production org? If not, who owns enabling it and when?

**Why it matters**: The setting is **not reversible**. Once on, it changes permission model semantics for every Contact. Must be enabled before BMS-4258 can work, but must be deliberate.

**Recommended default**: Enable in a Gulf sandbox for Sprint 2 dev; confirm production enablement before the first Gulf UAT demo.

**Decision owner**: Gulf admin + Matt Keeter.

---

## 8. BMS-3921 — notification channels in Phase 2

**Question**: Confirm Phase 2 notification channels — Email + SMS only, or include in-app notification center?

**Recommended default**: **Email + SMS only for Phase 2.** In-app notification center is a separate story in Phase 3+.

**Decision owner**: Emily Shull.

---

## 9. BMS-3921 — per-territory cutoff

**Question**: Is per-location cutoff (`ohfy__Warehouse_Cutoff_Time__c` on the fulfillment location) sufficient, or do we need per-route cutoffs?

**Recommended default**: **Per-location for Sprint 2.** Validate with Gulf ops during Sprint-2 refinement; if they need per-route, add `Route__c.Cutoff_Time__c` in Sprint 3.

**Decision owner**: Ian / Joey / Emily.

---

## 10. BMS-3929 — reorder page-size default

**Question**: Current order history page-size default is 10. Ticket ACs said 20. Which wins?

**Recommended default**: **Keep 10.** Changing the default is a separate UX decision and should not block this story.

**Decision owner**: Product owner.

---

## 11. Jira link cleanup

**Question**: BMS-3930 lists 13 tickets as "blocked by" it. Most are mis-scoped. Who unlinks and re-audits?

**Recommended default**: **Elliot Flores** runs a bulk-unlink (keep BMS-3928 / BMS-4052 links for cart gating; drop the rest). Do before Sprint 2 refinement so the backlog grooming picture is accurate.

**Decision owner**: Elliot Flores.

---

## 12. BMS-3921 — reuse vs. re-implement TBM notification work

**Question**: Emily's 2026-04-15 comment — "This feels like this duplicates work that Sanchez already completed for TBM." What reuses, what doesn't?

**Recommended default**: **30-min review with Sanchez before Sprint 2 refinement.** Likely outcome: TBM patterns reuse (Twilio service, preference model); Gulf templates and ContentSids are net-new.

**Decision owner**: Alvaro Sanchez + Emily Shull.

---

## Pre-Sprint 2 Meeting Agenda (30 min)

- 0:00–0:05 — Walkthrough of the four-track pricing decomposition ([[00 - README - Pricing Code Block & New Sprint Flow]])
- 0:05–0:15 — Sprint 2 commit: four pricing tracks + four polished tickets (BMS-3929, 3921, 4258, 3930 Ph 1). Confirm everything above.
- 0:15–0:25 — Walk this decision-gate list. Accept defaults where agreed; flag any that need a follow-up thread.
- 0:25–0:30 — Action items (Matt unlinks BMS-3930 dependencies, Gulf admin enables Contacts-to-Multiple-Accounts, etc.)

## Exit criteria

Sprint 2 commits when:
- ✅ Questions 1, 2, 3 have defaults accepted or custom answers.
- ✅ Question 4 (owning package) resolved with a name.
- ✅ Question 5 (Outstanding_Balance source) chosen.
- ✅ Question 6 (BMS-3930 split) approved.
- ✅ Question 7 (org setting) has an owner + ETA.
- ✅ Questions 8, 9, 10, 11, 12 accepted or explicitly deferred.

If any of 1–7 is unresolved by end of the meeting, that Sprint-2 commitment is at risk; pull the affected story out of Sprint 2 and rebuild.
