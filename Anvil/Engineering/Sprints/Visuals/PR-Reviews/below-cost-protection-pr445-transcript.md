---
title: Below-Cost Protection — Video Transcript
pr: 445
ticket: BMS-3903
source: https://github.com/Ohanafy/OHFY-Split/pull/445
companion: below-cost-protection-pr445.html
runtime_target: 90-120s
status: source for AI video generation — not a final script
---

# Below-Cost Protection — Transcript

Plain-text narration transcript for handoff to an AI video-generation tool. Timecodes are estimates based on a ~100–110 wpm narration pace; adjust to the tool's actual pacing. Each block is `[TIMECODE] VISUAL / ON-SCREEN / NARRATION` so a video model can align spoken audio to a scene cut without needing the HTML storyboard.

---

## [00:00–00:10] Scene 1 — Cold Open

**VISUAL:** A case of product on a loading dock. A price tag flips from $22.00 to $19.80 as overlapping discount stickers slap onto it one by one.

**ON-SCREEN TEXT:** BELOW-COST PROTECTION — BMS-3903

**NARRATION:**
> "Every discount your team applies is designed to win a sale. But when three of them land on the same line, nobody's watching whether the price that comes out the other end still covers what the case actually cost you."

---

## [00:10–00:22] Scene 2 — The Problem

**VISUAL:** Split screen. Four labeled boxes — Front-Line Pricing, Promotions, One-Day Sales, Manual Overrides — each with an arrow feeding into a single invoice line. Where a check should be, there's a question mark.

**ON-SCREEN TEXT:** (none — let the boxes carry it)

**NARRATION:**
> "Front-line pricing, promotions, one-day sales, manual overrides — each one prices independently. None of them check against the others. None of them check against cost."

---

## [00:22–00:36] Scene 3 — The Fix

**VISUAL:** The same four boxes from Scene 2, now all funneling into a single gate labeled "Below-Cost Check" before the line reaches the invoice.

**ON-SCREEN TEXT:** Net Case Price  vs.  Last Landed Case Cost

**NARRATION:**
> "Below-Cost Protection doesn't care how the price was set. It waits until the price is final, then compares it to one number: what the item actually costs to land."

---

## [00:36–00:52] Scene 4 — Worked Example

**VISUAL:** The $22.00 case from Scene 1. A "10% OFF" stamp lands on it; the price ticks down to $19.80. A red horizontal line draws in underneath, labeled "$20.00 cost floor" — the price sits visibly below it.

**ON-SCREEN TEXT:**
```
Case Price:            $22.00
Discount:               10%
Net Case Price:        $19.80
Cost Floor:             $20.00
------------------------------
Is_Below_Cost__c:       TRUE
Below_Cost_Variance__c: -$0.20
```

**NARRATION:**
> "A twenty-two dollar case. A ten percent promo. The net price lands at nineteen eighty — twenty cents under what it cost to get that case onto the truck. The system catches it instantly."

---

## [00:52–01:06] Scene 5 — Warn Mode

**VISUAL:** The invoice saves normally — a green checkmark animation — but a small flag icon lights up on the line. Cut to a report/list view filling with flagged rows.

**ON-SCREEN TEXT:** MODE: WARN (default)

**NARRATION:**
> "On day one, nothing stops. The line is flagged, not blocked. Pricing and finance get a clean list of every below-cost sale to review — before anyone decides to actually stop them."

---

## [01:06–01:22] Scene 6 — Flipping to Block

**VISUAL:** An admin's cursor toggles a switch in setup labeled "Block Invoice On Below Cost" from off to on. Cut to the same $19.80 line — now a red error banner appears when someone tries to save it.

**ON-SCREEN TEXT:**
> "This line is priced below the item cost floor. Adjust the pricing or disable below-cost blocking to proceed."

**NARRATION:**
> "When you're ready, one setting turns the flag into a wall. Now that same line can't be saved to a live order, and a draft that still has it can't be submitted — until the price is fixed."

---

## [01:22–01:36] Scene 7 — Two Independent Switches

**VISUAL:** Two clearly separate levers side by side, labeled "FLAG" and "BLOCK," each with its own on/off toggle. Toggling one visibly does nothing to the other.

**ON-SCREEN TEXT:** (none)

**NARRATION:**
> "And they're never tangled together. Need to bypass the flag for a data load? The block stays active. Need to pause enforcement for one edge case? The flag keeps recording. Each lever does exactly one job."

---

## [01:36–01:50] Scene 8 — Close

**VISUAL:** Pull back to the loading dock from Scene 1. The price tag now shows a green checkmark instead of discount stickers stacking past the cost line.

**ON-SCREEN TEXT:** BELOW-COST PROTECTION — live in warn mode today.

**NARRATION:**
> "Every discount still works exactly the way it always has. The only difference is that now, something is finally watching the floor."

---

## Full Narration (read-through, no timecodes)

> Every discount your team applies is designed to win a sale. But when three of them land on the same line, nobody's watching whether the price that comes out the other end still covers what the case actually cost you.
>
> Front-line pricing, promotions, one-day sales, manual overrides — each one prices independently. None of them check against the others. None of them check against cost.
>
> Below-Cost Protection doesn't care how the price was set. It waits until the price is final, then compares it to one number: what the item actually costs to land.
>
> A twenty-two dollar case. A ten percent promo. The net price lands at nineteen eighty — twenty cents under what it cost to get that case onto the truck. The system catches it instantly.
>
> On day one, nothing stops. The line is flagged, not blocked. Pricing and finance get a clean list of every below-cost sale to review — before anyone decides to actually stop them.
>
> When you're ready, one setting turns the flag into a wall. Now that same line can't be saved to a live order, and a draft that still has it can't be submitted — until the price is fixed.
>
> And they're never tangled together. Need to bypass the flag for a data load? The block stays active. Need to pause enforcement for one edge case? The flag keeps recording. Each lever does exactly one job.
>
> Every discount still works exactly the way it always has. The only difference is that now, something is finally watching the floor.

---

## Glossary (for narration consistency)

| Term | Definition |
|---|---|
| **Net case price** | What the customer actually pays per case, after every discount is applied. |
| **Cost floor** | The item's Last Landed Case Cost — the line under which a sale loses money on the case itself. |
| **Flag** | The always-on, no-side-effect record of a below-cost line (`Is_Below_Cost__c` / `Below_Cost_Variance__c`). |
| **Block** | The opt-in enforcement that rejects a save/submit while a below-cost line exists. |
| **Pipeline-agnostic** | The check works no matter which system set the price. |

## Reference facts (do not alter numbers in narration)

- Example uses: $22.00 case price, 10% discount → $19.80 net, $20.00 cost floor → -$0.20 variance.
- Ships in **warn mode** (inactive) by default; block mode is opt-in via `Configuration_Preference__mdt.blockInvoiceOnBelowCost`.
- Flag and block are independently switchable via separate `Trigger_Configuration__mdt` records (post-review fix in PR #445).
- Source: PR #445, BMS-3903, `S_BelowCostProtection.cls` (OHFY-OMS).
