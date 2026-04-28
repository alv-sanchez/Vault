---
title: OMS Bug Backlog
created: 2026-04-27
source: Claude Code session
status: needs-triage
module: OMS
view: sheet
---

# OMS Bug Backlog — Sheet View

10 real bugs in the OMS module. CS-facing — no file paths, no line numbers.

## Sheet (compact)

| #   | Title                                                      | Severity | Module | Experience       | Effort |
| --- | ---------------------------------------------------------- | -------- | ------ | ---------------- | ------ |
| 1   | Account Item upsert hides the real reason it failed        | Critical | OMS    | Invoice Creation | S      |
| 2   | Bulk invoice insert hits Salesforce governor limits        | Critical | OMS    | Invoice Creation | M      |
| 3   | Invoice can be created with zero line items                | Critical | OMS    | Invoice Creation | S      |
| 4   | Delivery date update can crash on cascade                  | High     | OMS    | Delivery Status  | XS     |
| 5   | Delivery status names are hardcoded all over the OMS       | Medium   | OMS    | Delivery Status  | S      |
| 6   | Promotions table re-renders the whole list every keystroke | High     | OMS    | Promotions Modal | XS     |
| 7   | Promotions modals silently swallow Apex errors             | Medium   | OMS    | Promotions Modal | S      |
| 8   | Dead public property on the promotions modal               | Low      | OMS    | Promotions Modal | XS     |
| 9   | Mobile invoice flow leaks an event listener every visit    | High     | OMS    | Mobile Lifecycle | XS     |
| 10  | Cancel-invoice failure shows no error to the user          | Medium   | OMS    | Cancel UX        | XS     |

## Just Descriptions

| #   | Description                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | When an invoice fails to create its Account Item records, support sees a generic error instead of the real reason — slowing down every triage.                   |
| 2   | Bulk invoice inserts (EDI, NSO sync, scheduled jobs, mobile catch-up) blow Salesforce governor limits and roll back the entire batch.                            |
| 3   | If the invoice-items query fails for any reason, the system still creates the invoice — with $0 and no line items — instead of stopping and reporting it.        |
| 4   | Reverting a delivery to an earlier status can crash mid-cascade, leaving some invoices updated and others not.                                                   |
| 5   | Delivery status names are hardcoded across the OMS — a routine picklist rename silently breaks the cross-object cascade and surfaces weeks later in the field.   |
| 6   | The promotions modal re-renders its full row list on every interaction — visible as lag, jumpiness, and flickering selection on mobile.                          |
| 7   | The promotions modals don't show errors when Apex calls fail — users believe a promotion was applied while nothing actually saved.                               |
| 8   | The promotions modal exposes a public property that nothing reads or supplies — leftover from a refactor, misleads anyone reading the component.                 |
| 9   | The mobile invoice flow leaks an event listener every time it's opened — long sales-rep sessions slow down and chew battery over the course of a route.          |
| 10  | When canceling an invoice fails, the user sees no toast or error — they assume the cancel worked and move on, sometimes after the customer is already re-billed. |

---



## Pivot — bugs per experience

| Experience       | Count | Severity Mix              |
| ---------------- | ----- | ------------------------- |
| Invoice Creation | 3     | 3 Critical                |
| Delivery Status  | 2     | 1 High · 1 Medium         |
| Promotions Modal | 3     | 1 High · 1 Medium · 1 Low |
| Mobile Lifecycle | 1     | 1 High                    |
| Cancel UX        | 1     | 1 Medium                  |

## Pivot — severity rollup

| Severity | Count |
| -------- | ----- |
| Critical | 3     |
| High     | 3     |
| Medium   | 3     |
| Low      | 1     |

---

## Triage notes

- **Bugs 1, 2, 3** are the same root experience (invoice creation post-insert path). One refactor pass on error propagation closes the design issue all three reflect. Recommend grouping into a single epic.
- **Bugs 4 and 5** travel together — extracting status constants makes it easier to reason about which paths still need null-guards.
- **Bugs 6, 7, 8** all live in the promotions modals — suggests this surface deserves a focused review pass, not three independent fixes. Same QA cycle covers all three.
- **Bug 7's pattern** (missing `.catch` on Apex calls) almost certainly repeats elsewhere in OMS. Worth a module-wide audit before refinement.
- Effort column is XS / S / M placeholder until planning poker.

---

## Business case — token economics

The Anvil workflow (local-first Obsidian draft, then explicit `push it`) and the naïve alternative (Claude calls `createJiraIssue` immediately, then the engineer iterates on the live ticket) produce the same Jira ticket. They cost very different amounts of context.

**The big mover is iterations.** In the Anvil workflow, every revision after the first draft is a free, manual edit in the Obsidian markdown editor — zero AI tokens. In the direct-to-Jira workflow, every revision is an AI round-trip: re-load Atlassian MCP schemas, fetch the current ticket, send an `editJiraIssue` call, parse the response.

### Per-ticket token estimate (single ticket, ~2 review rounds)

| Step                        | Anvil (local-first) | Direct-to-Jira MCP |
| --------------------------- | ------------------- | ------------------ |
| Initial draft / create      | 8–12K               | 5–7K               |
| Review round 1 (revise)     | 0 (manual)          | 3–5K               |
| Review round 2 (revise)     | 0 (manual)          | 3–5K               |
| Push to Jira / link wiring  | 3–5K                | already in Jira    |
| **Total per ticket**        | **~11–17K**         | **~11–17K**        |

Roughly even on **1 ticket with 2 revisions**.

### Per-ticket token estimate (5-ticket bulk, ~2 review rounds each)

| Step                        | Anvil (local-first, `--bulk`) | Direct-to-Jira MCP (5 separate sessions) |
| --------------------------- | ----------------------------- | ---------------------------------------- |
| Initial drafts / creates    | ~12K (one bulk call)          | ~25–35K (5 × 5–7K)                       |
| Revisions across batch      | 0 (manual in vault)           | ~30–50K (5 × 2 × 3–5K)                   |
| Push to Jira (bulk promote) | ~5–7K                         | already in Jira                          |
| **Total for 5 tickets**     | **~17–19K**                   | **~55–85K**                              |
| **Per-ticket average**      | **~3.5K**                     | **~11–17K**                              |

**Bulk multiplier is where Anvil pays off — roughly 3–5× cheaper per ticket** when drafting more than one ticket at a time, even with conservative iteration counts.

### Why the gap widens with iterations

- **Schema reload cost.** Atlassian MCP schemas (`createJiraIssue`, `getJiraIssue`, `editJiraIssue`, `getTransitionsForJiraIssue`, link APIs) are several thousand tokens combined. Each new conversation reloads them. Anvil only pays this cost on the explicit `push it` step.
- **Round-trip cost.** Each "fix this wording" or "add an AC scenario" requires fetching the current state from Jira (because Claude has no memory of what's there), sending the edit, and parsing the response.
- **Bulk edits are nearly free in the vault.** Find/replace across 5 drafts in Obsidian costs nothing. Doing the same via MCP requires 5 separate `editJiraIssue` calls.
- **Polluted Jira history.** Every edit cycle in the direct-to-Jira flow leaves a "field changed" entry on the ticket — reviewers can't tell signal from churn. Anvil ships a clean ticket on first push.

### What the numbers don't capture (qualitative)

- **Engineer attention cost** — reviewing in Obsidian is a single context (one editor, one tab); reviewing on Jira after each AI call means tab-switching, refreshing, and waiting on Jira UI loads.
- **Recoverability** — a bad draft in Obsidian is a one-character change to delete. A bad ticket in Jira either stays as a polluted record or requires a delete + re-create cycle.
- **Audit trail** — Anvil's working notes are append-only; Jira's edit history flattens revisions into a noisy field-by-field diff.

### Caveats

These are estimates, not measurements — token costs vary by message size, MCP server response shape, and how much paste context the engineer provides. The shape of the comparison (Anvil flat-lines on iterations, Jira-direct scales linearly with them) is the load-bearing point, not the absolute numbers.
