# Safety Stock Controls (BMS-5068) — Source Script for NotebookLM Video

> Purpose of this document: hand this whole file to NotebookLM as a source. It's written as a narrated walkthrough (not bullet fragments) so NotebookLM's video/audio overview can turn it into a natural, easy-to-follow explainer. It covers what problem this epic solves, what each of the six tickets does, and how to actually use the finished feature.

---

## Part 1 — The problem, in plain language

Picture a warehouse planner responsible for keeping shelves stocked. Every product has a supplier, and every supplier has its own quirks — one ships reliably, another is occasionally late, another has seasonal spikes around holidays. To handle that uncertainty, planners keep a mental cushion of extra stock for the risky ones. In inventory terms, that cushion is measured in **Days of Inventory**, or DOI — literally, how many days the current stock would last before running out.

Before this project, that cushion existed only in planners' heads. There was no place in the system to write down "give this product an extra five days of buffer because the supplier is unreliable right now." Two consequences followed. First, that knowledge was fragile — if the planner went on vacation or left the company, the buffer knowledge left with them. Second, and more importantly, even if a planner *had* recorded an intention to carry more stock somewhere in the system, nothing downstream actually used it. The replenishment engine — the part of the system that decides how much to reorder — kept sizing orders exactly as if no risk existed. Planners were always reacting after a stockout happened, never staying ahead of it.

This epic, tracked in Jira as **BMS-5068, Safety Stock Controls**, exists to close that gap. It gives planners a real, auditable way to say "raise the buffer for this product, or for this whole supplier, right now, and here's why" — and it makes sure that raised buffer actually changes how much gets ordered. It ships as one pull request, but it's really six connected tickets, each solving one link in that chain. This script walks through all six, then explains how to actually use the feature that came out of them.

---

## Part 2 — The six tickets, and how they chain together

Think of these six tickets as a relay race. Each one hands something to the next.

### BMS-4217 — Make the target actually matter

Before this ticket, a product could have a "Target Days of Inventory" number sitting on a record, but the replenishment engine never looked at it when deciding order sizes. This ticket wires that number into the real math: the system calculates additional order cases as target days of inventory, multiplied by the product's daily depletion rate, divided by how many units fit in a case — then rounds that up to a full layer or pallet, because you can't order half a pallet. This one change is what makes every other ticket in this epic matter. Without it, an override is just a note nobody reads. With it, an override changes what physically gets ordered.

### BMS-5636 — Let a buffer apply to a whole supplier, and give it a real lifecycle

The original override mechanism could only target one specific product at one specific warehouse. But real-world disruptions rarely respect that boundary — if a supplier's shipping lane is delayed, *every* product from that supplier is at risk, not just one. This ticket adds a new "Scope" choice: an override can now target a single product, exactly as before, or an entire supplier at once. When both a product-level override and a supplier-level override are active for the same item, the more specific one — the product-level one — wins, because it's the more precise signal.

This ticket also gives overrides a proper lifecycle instead of a single on-or-off switch. An override can now be **Scheduled** for a future date and activate automatically when that date arrives; it can be **Active**; it can **Expire** automatically once its end date passes; or a planner can **Manually Close** it early if the situation resolves sooner than expected. Alongside that, overrides are now typed as either **Temporary**, meaning they must have an end date, or **Permanent**, meaning they may not — the system actively blocks you from accidentally creating a permanent override with an expiration date, which was a real validation gap caught and fixed during this epic's testing.

### BMS-5638 — Freeze the evidence, and warn before it lapses

Once BMS-4217 makes the target number drive real order sizes, a new risk appears: if a planner later changes or closes an override, any order generated last week would silently look, in hindsight, as if it used today's numbers. There would be no record of what was actually in effect at the moment that order was created. This ticket closes that gap by having every generated replenishment task permanently record, at the moment it's created, exactly what target it used and which tier of override — product-level, supplier-level, or the plain system default — produced that number. It's a permanent snapshot, not a live-updating field.

The second half of this ticket solves a related but separate problem: overrides expire silently. A planner could be relying on a buffer that quietly lapses without warning. This ticket adds a configurable notice period — four days by default, though that number can be changed — so the planner who created an override gets a real Salesforce notification before it expires, instead of finding out only after a stockout happens.

### BMS-5639 — Make sure the audit trail is trustworthy everywhere

The audit trail from BMS-5638 is only as good as its weakest link. It turns out task generation runs through two different code paths internally — one that processes a single record at a time, and a separate, more efficient one used for larger batches. This ticket makes sure both paths label the override source identically. This was actually caught as a real regression during this epic's own quality-assurance pass: the bulk path had been missed, so tasks generated in bulk were incorrectly recording "system default" instead of the correct override source. It was found, fixed, and re-verified with the full automated test suite before anything shipped.

### BMS-5640 — Give planners a real screen to work from

Everything built in the first four tickets works, but it lives on standard, fairly bare Salesforce record pages — functional, but not something a planner would want to use every day, and with no way to see the *cost* of a decision before committing to it. This ticket builds a dedicated screen called the **Safety Stock Manager**. It shows every override in one filterable list, and — critically — it includes an impact preview: a planner can propose a new target buffer for a product and immediately see how many additional cases that would mean ordering and roughly how many additional dollars of inventory that represents, before saving anything. It also adds a proper confirmation step for closing an override early, requiring a written reason. This screen was tested live in a real environment and covered by automated end-to-end tests that click through the actual interface, not just the underlying code.

### BMS-5641 — Give managers a way to review the history

The planning screen from BMS-5640 is built for someone actively managing overrides in the moment. Managers reviewing history later — what was raised, by whom, why, and for how long — need a standard report they can filter, export, and share, not a live application screen. This ticket adds a dedicated report type for exactly that. One honest gap: this report doesn't yet show the estimated dollar cost of currently active overrides the way the live impact preview does — that's a known, documented limitation, not an oversight that was missed.

### The throughline, one more time

A planner raises a buffer, either for one product or for an entire supplier — that's BMS-5636. The replenishment engine actually reacts to that buffer when sizing orders — that's BMS-4217. Every order generated permanently remembers what target and what source drove it, and the planner gets warned before the buffer lapses — that's BMS-5638 and BMS-5639 working together. The planner manages all of this from one dedicated screen instead of hunting through record pages — that's BMS-5640. And managers can review the whole history afterward through a standard report — that's BMS-5641.

---

## Part 3 — How to actually use the finished experience

This section is a practical walkthrough, written as if narrating someone using the screen for the first time.

### Finding the screen

Open the Salesforce app and look for the tab labeled **Safety Stock Manager**. That's the home base for everything in this feature.

### Reading the grid

The first thing you see is a table listing every safety stock override that currently exists. Each row shows: whether it's scoped to a single product ("SKU") or to an entire supplier; the product or supplier name; the warehouse location; the target days-of-inventory value; whether it's Temporary or Permanent; its current status — Scheduled, Active, Expired, or Manually Closed; its effective start and end dates; and the reason the planner gave when creating it. Above the table, a status filter lets you narrow the list down to just, say, Active overrides, if the full list is too much to scan at once.

### Creating an override

Overrides themselves are still created on the standard record page — open a new Safety Stock Override record, choose whether it applies to one product or a whole supplier, set your target days-of-inventory number, choose Temporary or Permanent, and write a reason. That reason field matters — it's what future planners see when they're trying to understand why a buffer exists.

If you set a Permanent override, be aware the system will not let you also set an end date on it — Permanent means indefinite by definition, and mixing the two is blocked with a clear error message telling you to switch to Temporary if you actually want it to expire.

### Previewing the cost before you commit

This is the feature planners will likely use the most before making a decision. At the top of the Safety Stock Manager screen sits an impact preview panel. Pick a product, pick a warehouse location, type in a proposed target days-of-inventory number, and click Preview. Within a second or two, the screen shows three numbers: how many SKUs would be affected — this is always one, since the preview is calculated per product — how many additional cases would need to be ordered to reach that new target, and roughly how much additional inventory value, in dollars, that represents. This calculation runs against the product's real, current velocity and case cost, so the number you see reflects reality, not a rough estimate. It's a genuine "look before you leap" tool: you can try a few different target numbers and see the cost implication of each before you ever save a new override.

### Closing an override early

Sometimes the situation that justified a buffer resolves sooner than expected — a supplier catches up, a seasonal spike passes early. From any row in the grid, open its action menu and choose "Close early." A confirmation window appears asking for a mandatory reason — the Close button stays disabled until you type something in, so you can't accidentally close an override without leaving a note explaining why. Once you confirm, that product or supplier immediately reverts to its standard target, and the system permanently records who closed it, exactly when, and the reason given.

### What happens automatically, without you touching anything

Two things run in the background without any manual action. First, a nightly process activates any Scheduled override the moment its start date arrives, and expires any Temporary override the moment its end date passes — you don't have to remember to flip a status. Second, a configurable number of days before a Temporary override is about to expire, the planner who created it receives a Salesforce notification, so an about-to-lapse buffer never comes as a silent surprise.

### The bottom line

Before this feature, safety stock buffers lived in a planner's head and had no effect on real ordering. Now, a planner can raise a buffer for one product or an entire supplier, see the exact cost of that decision before committing, know the system will actually size orders around it, get warned before it lapses, and trust that every order generated along the way permanently remembers what decision produced it.

---

*Source: BMS-5068 epic, pull request #442, Ohanafy OHFY-Split repository. Generated as a NotebookLM source document — feed this whole file in as-is for the video/audio overview feature.*
