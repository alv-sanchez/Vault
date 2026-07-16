---
record: 0001
epic: BMS-5161
date: 2026-07-14
kind: learning-record
---

# Starting point — can run/ship it, wants the durable whole-picture

## Where the learner is
Alvaro is the assignee on epic **BMS-5161** and has driven it end to end this session —
the three backend stories are built and demoed, and the BMS-5792 UI (freight-cost entry
quick action + visibility panel) was built, deployed to `bms-5113-5161-integration`, and
committed to `integration/bms-5161-validation` this session.

## The signal
Across the session he repeatedly circled the *framing* question — "what am I solving,"
"explain it as a whole, not just PO," "give me multiple one-liners." He can operate the
feature and reason about the trigger data; the gap is a **crisp, portable mental model** he
can say out loud to a PO / lead / exec without reconstructing it from code each time.

## What this set targets
- **Lesson 1** locks the business "why": the freight leak, and the reuse reframe (verify the
  premise against the code — the ticket's own "6-field" code-reality was stale).
- **Lesson 2** locks the mechanism: two doors (transfer-on-Complete, PO-on-reconciliation),
  one hallway (G·R·E·C), one Freight-type billback in the existing ledger.
- The #1 misconception to kill: the **PO path is NOT triggered by Status = Complete** — it
  fires on the freight-owed signal. Both lesson quizzes hammer this.

## Anchored to his own work (per workspace NOTES)
Every example uses what he built/demoed this session — the $480 / $120 numbers, the
`Supplier_Owes_Freight__c` trigger data he asked about, the real class names. No hypotheticals.

## Mnemonics issued
- "Gulf was eating freight suppliers owe — route it into the ledger we already had." (why)
- **G·R·E·C** through two doors. (how)

## To revisit
- Does he want a Lesson 3 on the *packaging / cross-tier* mechanics (why WMS→OMS goes through
  Service-Locator, the released-signature and namespace rules that constrained the build)?
  Decide after lessons 1–2 land.
