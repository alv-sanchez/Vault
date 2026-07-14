# Starting point: owns the epic, can run it, lacks the whole-picture model

**Date:** 2026-07-13 · **Before:** Lessons 1–2

## Situation
Learner is the **assignee** on epic BMS-5068 (Safety Stock Controls), which is Done/merged (PR #442, single 4.4k-line PR, 6 stories). So this is not "learn a new domain from zero" — it's "build a confident mental model of work the learner already owns and shipped." Learner's exact words: *"I just haven't fully confidently known what is going on in the whole picture."*

## Diagnosis of the gap (drives the two lessons)
Two distinct confusions were bundled in the request:
1. **Mechanical** — *how* a planner's safety-stock decision propagates into a bigger purchase order. Root misconception risk: imagining "safety stock" as a stored quantity rather than an upward adjustment to target DOH resolved at calc time. → Lesson 1 (SET·RESOLVE·SIZE·FREEZE·CLOSE), grounded in `S_InventoryThresholds` + `S_ReplenishmentOrderSizing` + `Replenishment_Task__c` freeze fields.
2. **Structural** — *why* the epic decomposes into those six stories and why that's "tidy." Key insight the learner was missing: the epic **reused the shipped `SKU_Override__c`/resolver/batch stack** instead of building the demo's proposed net-new `Safety_Stock_Override__c` object → one additive seam per story. → Lesson 2 (Reuse-trunk, One-seam).

## Teaching choices
- Anchored everything to the learner's own merged epic + real class/field names (per NOTES: learns fastest anchored to prior real actions; time-constrained).
- Two short lessons, one win each, each ending in a mnemonic (standing NOTES requirement).
- Followed the code-review set's structure & visual identity, but factored the shared CSS + quiz JS into `assets/` (the code-review set inlined them) — first reusable components for this set. New accent (blue) distinguishes the topic on the shelf.

## Open thread for next session
PR #442's body is unusually honest about **gaps that shipped** (Override_Reason not mandatory; LWC never live-smoke-tested; merged without independent review due to Claude review spend cap). A natural **Lesson 3** = "reading a PR's own honesty section as a senior skill." Offered at the end of Lesson 2; build only if the learner bites — don't assume.

## Not yet verified about the learner
- Whether they can already read Apex fluently enough that pointing at `S_InventoryThresholds.cls` is useful vs. intimidating. Lessons hedge by quoting the header comment rather than the implementation. Watch their follow-up questions to calibrate.
