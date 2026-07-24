# Dry Run Testing — paused mid-build (resume state)

**Paused 2026-07-17 by user (credits). Resume by asking Claude: "resume the dry-run testing doc".**

## Goal (unchanged)
Build the dry-run test doc in THIS folder: mermaid flow charts + record IDs + click-path + edge cases + screenshots of the 3 surfaces.

## Done before pause
- ✅ Seed verified + repaired: SEED-4965-7 reset to `Open` (was stuck `Rep Collection` from D1 repro). Worklist = 7. Driver stop = today (2026-07-17 — RE-DATE IF RESUMING A LATER DAY: update SP-DEMO delivery `ohfy__Delivery_Date__c` = today).
- ✅ All record IDs collected (table below).
- ⏸️ Screenshots: browser tab opened to Review Queue via frontdoor URL (new OTP needed on resume: `sf org open --target-org ohfy-val-shortPay --url-only --path "lightning/n/ohfy__Short_Pay_Review_Queue"`). Not yet captured.
- ⏸️ Doc itself: not yet written. Source content ready in `../Management/QA-AC-validation.md` (§3 click-path) + `EPIC-final-AC-pass.md`.

## Record IDs (verified live, org `ohfy-val-shortPay`, user test-hukqsmvfh9sh@example.com)
| Record | PO / Name | Id | State |
|---|---|---|---|
| Driver stop A | DRVDEMO-1 | `a16Em0000056yrRIAQ` | due $500 / paid 0 / None / Out For Delivery |
| Driver stop B | DRVDEMO-2 | `a16Em0000056yrSIAQ` | due $500 / paid 0 / None / Out For Delivery |
| Delivery (today) | SP-DEMO route | `a0SEm00000AMx0TMAT` | driver = org user |
| Roll-forward target | QA-4060-ROLL-TARGET | `a16Em0000057fErIAI` | New, Gulf Coast (FL) |
| Queue: Open $125 FL | SEED-4965-1 | `a16Em0000056ymbIAA` | ⚠️ carries leftover QA credit — avoid for resolve-credit |
| Queue: Open $48.50 FL | SEED-4965-2 | `a16Em0000056ymcIAA` | roll-forward demo row |
| Queue: UR $310.75 FL | SEED-4965-3 | `a16Em0000056ymdIAA` | resolve-credit demo row |
| Queue: UR $89 AL | SEED-4965-4 | `a16Em0000056ymeIAA` | |
| Queue: Esc $540 AL | SEED-4965-5 | `a16Em0000056ymfIAA` | |
| Queue: Esc $1200 FL | SEED-4965-6 | `a16Em0000056ymgIAA` | |
| Queue: Open $15.25 FL | SEED-4965-7 | `a16Em0000056ymhIAA` | reset to Open ✅ |

## Surfaces
- Driver Home: `lightning/n/ohfy__Driver_Home`
- Review Queue: `lightning/n/ohfy__Short_Pay_Review_Queue`
- Approvals: `lightning/n/ohfy__Short_Pay_Approvals`
- Approver permsets (Delivery_Supervisor / Sales_Manager / Regional_Director) assigned to org user ✅

## Remaining on resume
1. Re-verify/re-date seed (one apex script — see Management/build-status doc).
2. Screenshots: Driver Home (stop list + short-pay modal + blocked banner), Review Queue, Approvals — chrome-devtools `take_screenshot` with `filePath` into this folder.
3. Write `DRY-RUN-TEST.md` here: mermaid journey + gate flowchart, ID table above, 11-step click path (from QA-AC-validation §3), edge cases (below-threshold $0.01, exact-boundary $250/$1000, reject path, unauthorized approver, D1 rep-collection known-fail, day-rollover stop disappearance, SEED-1 credit residue).
