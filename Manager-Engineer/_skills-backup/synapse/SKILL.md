---
name: synapse
description: >
  Weaves your logged work into an Obsidian connection web — every product AREA (OHFY-Split package)
  linked to the tickets/epics that touch it — so the Graph View, backlinks, and a Base light up and
  you can see the full picture of your development. Use it to context-switch: pick an area, see
  everything you've hit there (status · org · PR). Invoke with "/synapse", "connect my work",
  "product atlas", "where have I hit", or "weave the web".
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# synapse 🕸️

The connective tissue of your build. It answers *"which parts of the product have I touched, and which tickets live there?"* by cross-linking **areas ↔ tickets ↔ epics** as Obsidian wikilinks — turning the Graph View into a real map of your work.

## What it does
Scans every **logged** note under `Manager-Engineer/` (tickets, epics, build-overview) for the area signal (`packages_touched` + area mentions + BMS keys), enriches with Mission Control (status/org/PR), and writes into `Manager-Engineer/Atlas/`:
- **`Areas/<OHFY-Package>.md`** — one hub per product area: its purpose, the repo path + where its DoD lives (`<pkg>/CLAUDE.md`), and every ticket/epic that touches it (wikilinked → graph edges + backlinks).
- **`_MAP.md`** — the master MOC: coverage (how many areas you've hit), an areas table, an **area→epic Mermaid graph**, and how to use it to context-switch.
- **`atlas.base`** — an Obsidian Base grouping all notes by `packages_touched`.

## Run
```bash
node ~/.claude/skills/synapse/weave.mjs
```
Deterministic, read-only on the repo; only writes into `Atlas/`. Re-run anytime work changes.

## 🧱 Capability Ledger (the durable layer — powers `strata`)
Beyond the ticket↔area *links*, the Atlas carries an append-only **capability ledger** — the parts catalog of what's actually *built* per area, with provenance (capability · ticket · SHA · `file:line`). It's the anti-reinvention asset: `strata` queries it at ticket start to push prior art *before* you design; `/dev-review` appends confirmed new capabilities at wrap-up. Managed by a sibling script:
```bash
node ~/.claude/skills/synapse/ledger.mjs query --pkg OHFY-WMS   # what's built here (strata reads this)
node ~/.claude/skills/synapse/ledger.mjs add-json <file>        # dev-review appends at wrap-up
node ~/.claude/skills/synapse/ledger.mjs render                 # → Atlas/Ledger/<pkg>.md + _LEDGER.md
```
Source of truth: `Atlas/Ledger/ledger.json`. **Cited + shipped only** — no unmerged deltas, no uncited claims (a laundered guess is worse than a gap). `weave.mjs` surfaces each area's capabilities as a "🧱 Capabilities already built here" section on its hub, regenerated from the JSON every run (so it's always fresh, never clobbered).

## Maximizing Obsidian (the point)
- **Graph View** — filter `tag:#area`; area hubs cluster with their tickets. Where the graph is dense = where your work concentrates.
- **Backlinks** — open any ticket note → its area hubs show in backlinks automatically (the links are one-directional from the hub; backlinks make it two-way for free).
- **Base** (`atlas.base`) — table grouped by area; sort/filter by status or epic.
- **MOC** (`_MAP.md`) — the human entry point; pin it.

## The coverage truth
The web is only as rich as what's logged. The area↔ticket link is **`packages_touched`** in a note's frontmatter — so an area lights up only when a ticket/epic note declares it. Today that's sparse (few ticket notes exist). It deepens automatically as:
- `engineering-notes` / `me-engineer` write `packages_touched` on each ticket note (they do), and
- more tickets get notes.
To backfill fast, stamp `packages_touched` onto more notes (or have the manager audit populate it) and re-run. `synapse` never invents a link — no note, no edge.

## Ideas to go deeper (offer when asked)
- **Reverse links:** add an inline `area:: [[OHFY-OMS]]` field to each ticket note so edges are two-way at the source.
- **Heat/recency:** weight area hubs by recent activity (last-touched) to show *where you are now* vs historically.
- **Canvas:** generate an Obsidian `.canvas` placing area nodes with ticket cards for a spatial view.
