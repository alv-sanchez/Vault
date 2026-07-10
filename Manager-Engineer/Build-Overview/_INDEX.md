---
title: Build-Overview — Master Index
updated: 2026-07-01
---

# 🧭 Build-Overview — Master Index

The single launcher for every ticket. Organized to match how you work: **one folder per epic, each fronted by a `SESSION.md`, tracked through the end-to-end loop (build → test → review → PR), with blockers surfaced.**

> Resume any ticket: open a session in its branch's worktree and say *"Read `<folder>/SESSION.md` first."*

## 📁 Folder convention (every epic folder looks the same)
| File | Purpose |
|---|---|
| `SESSION.md` | **Entry point** — what · branch · org · status · next step · blocker. Paste into a fresh session to resume. |
| `overview.md` / `overview.html` | Build overview (deeper) |
| `*-explained.html` | Plain-language explainer (comprehension) |
| `diagram.excalidraw.md` | Architecture sketch |
| `seed-data.apex` · `ui-firstpass.png` | Evidence / repro (where relevant) |

## 🟢 My active tickets — lifecycle & blockers
Lifecycle stages track your **Definition of Done**: **Impl** → **Tests** (≥90%) → **Review** → **PR**. (`✓` done · `–` not started · `✗` gap)

| Epic · Story | Impl | Tests | Review | PR | Branch · Org | Waiting on | Brief |
|---|:--:|:--:|:--:|:--:|---|---|---|
| **BMS-4935 · 4120** Red Bull | ✓ | ✗ | – | ✗ | `feat/redbull-allocation-import-bms-4120` · `ohfy-val-4120` | **Matt** (direction) | [→](BMS-4935-red-bull-allocation/SESSION.md) |
| **BMS-4965 · 5625** Short Pay | ◑ | ✗ | – | ✗ | `feat/short-pay-backoffice-bms-4965` · `ohfy-val-4965` | **Gulf/Emily** (rules) | [→](BMS-4965-short-pay/SESSION.md) |
| **BMS-5070 · 4078** Shift-End | ✓ | ✗ | – | ✗ | `feat/shift-end-workflow-bms-4078` · `ohfy-val-4078` | — (demo-ready) | [→](BMS-5070-shift-end/SESSION.md) |
| **BMS-5068 · 4217** Safety Stock | ✓ | ? | – | ✗ | `feat/safety-stock-doh-sizing-bms-4217` · `ohfy-val-4217` | — (backend, no screen) | [→](BMS-5068-safety-stock/SESSION.md) |
| **BMS-5062 · 3823** Inter-Warehouse Vis. | ✗ | ✗ | – | ✗ | not started (no branch/org yet) | needs a look | [→](BMS-5062-inter-warehouse-visibility/SESSION.md) |

*(`◑` Short Pay = queue built; driver approval gate 5625 in build; 4059/4060 on hold.)*

## ⚪ Reference (not my ticket)
| Epic · Story | What | Owner / status | Brief |
|---|---|---|---|
| **BMS-5083 · 4467** Pick Capacity | Capacity reports + `pickLocationCapacity` LWC | Bryson (epic **Done**) / chris (story) | [→ reference](BMS-5083-pick-location-capacity/SESSION.md) |

## 📌 Short Pay ticket map (epic BMS-4965)
- **On hold:** 4059 (escalation), 4060 (resolution).
- **New today:** [5625](https://ohanafy.atlassian.net/browse/BMS-5625) Driver Approval Gate *(building)* · [5626](https://ohanafy.atlassian.net/browse/BMS-5626) EFT Detection · [5627](https://ohanafy.atlassian.net/browse/BMS-5627) AR Aging *(pending Product)*.

## ⛔ Blocker snapshot (who I'm waiting on)
- **Matt** → Red Bull downstream direction.
- **Gulf / Emily** → Short Pay escalation thresholds · field-approval $/% cutoff · who approves.
- **Product (Elliot/Emily)** → ratify 5625/5626/5627 · confirm EFT scope · confirm/kill AR aging.
- **Dave** → Publix/driver-view recording.
- Live board: *Open-Questions-Sanchez* (Notion).

## 🔗 Whole-set views
- [demo-overview.html](demo-overview.html) — all builds on one page
- [index.html](index.html) — clickable menu of explainers/overviews

## 🧹 Housekeeping — needs your OK before I delete (draft-then-approve)
- **`BMS-5070-shift-end-workflow/`** = stale duplicate of `BMS-5070-shift-end/` (current). → delete the `-workflow` one?
- **`Full Output.md`** = stray dump. → delete?
- `gen-index.py`, `Build-Overview.{md,html,excalidraw.md}` = pre-existing; left untouched.
