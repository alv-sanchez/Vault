---
title: Obsidian Ingestion Toolkit — plugins for absorbing technical material faster
tags: [meta, obsidian, tooling, plugins]
---

# Obsidian Ingestion Toolkit

What actually moves the needle on *ingesting engineering material faster* in this vault. Ranked by payoff for how you work (code-referenced specs, ticket visuals, layered systems like BMS-4053 pricing). Everything here is a **Community Plugin** (Settings → Community plugins → Browse) unless noted.

## Tier 1 — install these first

| Plugin | What it buys you | Why it matters here |
|---|---|---|
| **Mermaid (core)** + **Mermaid Tools** | Native flowchart/sequence/state diagrams in fenced ` ```mermaid ` blocks; Tools adds pan/zoom + a palette. Core is built in — no install. | The `BMS-4053-pricing-layers.md` diagrams are text you can edit inline and diff in git, vs. a flat PNG. Far faster to iterate than ASCII. |
| **Excalidraw** | Infinite hand-drawn canvas; embeds live Mermaid, images, and links back to notes. | Best tool for *thinking through* a layered system — drag the FLP/promo/tier boxes around, annotate, link each box to the code note. This is your "sketch to understand" surface. |
| **Advanced Tables** | Tab-to-navigate, auto-format, sort, formulas in Markdown tables. | You build a lot of resolution matrices (per-item base/card/cart). Editing raw MD tables is painful without this. |
| **Dataview** | Query notes like a database (`TABLE ... FROM #pricing WHERE ticket = "BMS-4053"`). | Turns frontmatter (ticket, branch, status, packages_touched) into live dashboards across your Sprints vault — auto-index of every ticket visual. |

## Tier 2 — high value, situational

| Plugin | What it buys you |
|---|---|
| **Code Styler** (a.k.a. Code Block Enhancer) | Syntax highlighting, line numbers, filename headers, collapsible code blocks. Makes pasted Apex/JS readable — and line numbers line up with your `L283–304`-style citations. |
| **Kanban** | Board view backed by a Markdown file. Good for the "Shipped / Outstanding" lists you keep in ticket visuals. |
| **Canvas (core)** | Built-in node canvas (lighter than Excalidraw). Drop notes, images, and HTML/PNG cards on one board and draw arrows — great for a single-screen "map" of a feature. |
| **Iconize** | Per-note/folder icons. Trivial, but speeds visual scanning of a big Sprints tree. |

## Tier 3 — nice-to-have

- **Style Settings** — tweak themes/plugins without CSS.
- **Recent Files** / **Quick Switcher++** — faster nav across many ticket notes.
- **Image Toolkit** — click-to-zoom on embedded PNGs/screenshots (useful for your screen-capture artifacts).

## Faster ingestion, beyond plugins

1. **Prefer Mermaid `.md` over HTML when you'll edit it.** Diagram-as-text = editable, diff-able, AI-updatable. Keep the rich HTML for polished hand-offs (like the simulator), Mermaid for living docs.
2. **Use Callouts** (`> [!note]`, `> [!warning]`, `> [!tip]`) — core feature, no plugin. They chunk a wall of text into scannable highlights; you saw them in the layers `.md`.
3. **Embed HTML artifacts inline**: `<iframe src="BMS-4053-pricing-priority-walkthrough.html" width="100%" height="900"></iframe>` inside a note renders the interactive simulator *inside* Obsidian (needs the HTML in the vault, which it is).
4. **Lean on frontmatter + Dataview** so every BMS visual is auto-listed — you stop hunting for files.

## How this BMS-4053 set is meant to be used

- **`BMS-4053-pricing-priority-walkthrough.html`** — the interactive teaching surface (concept answers + per-layer priority + the live replay simulator). Open in browser or embed via iframe.
- **`BMS-4053-pricing-layers.md`** — the editable Mermaid reference + code map. Lives in Reading view.
- **`BMS-4053-pricing-layers-visual.html`** — your original data/SOQL overview (the seeded demo, relationships, worked trace).
