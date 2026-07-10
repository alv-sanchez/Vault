---
name: build-overview-scaffold
description: >
  On EPIC pickup, auto-create the Build-Overview workspace folder for that epic —
  `Manager-Engineer/Build-Overview/BMS-<epic>-<slug>/` with SESSION.md + overview.md + overview.html
  from templates. One folder per epic (a single ticket's docs live under its parent epic). Idempotent
  (never overwrites a session in progress). So you never hand-create that scaffold again. Invoke with
  "/build-overview-scaffold", "scaffold build overview", or "make the build folder for BMS-<epic>".
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# build-overview-scaffold 🗂️

Creates the per-**epic** **Build-Overview workspace** so you don't hand-make it every pickup. The folder is keyed to the epic (`BMS-<epic>-<slug>/`); a single ticket's SESSION/overview live under its parent epic's folder.

## Run — pass EITHER an epic or a ticket key
```bash
node ~/.claude/skills/build-overview-scaffold/scaffold.mjs --key BMS-5625            # ticket → its epic's folder
node ~/.claude/skills/build-overview-scaffold/scaffold.mjs --key BMS-5068            # epic  → its folder
node ~/.claude/skills/build-overview-scaffold/scaffold.mjs --key BMS-5625 --epic BMS-4965   # explicit override
  # optional: --title "…" --slug … --branch feat/… --org ohfy-val-… --domain "…"
```
Give it **any** BMS key. If it's a **ticket**, it resolves the **parent epic offline** (from `mission-control.json`, or the ticket note's `epic:`) and uses the epic's folder — a ticket never gets its own folder. If it can't resolve the epic (brand-new ticket not on the board), it tells you to pass `--epic`. **Reuses an existing `BMS-<epic>-*` folder** if one exists (no duplicates).
Creates `Build-Overview/BMS-XXXX-<slug>/` with:
- **SESSION.md** — the context seed (paste into a fresh session to resume).
- **overview.md** — frontmatter + user/impact/solution/next/demo skeleton.
- **overview.html** — the shareable one-pager (same skeleton, styled).

**Idempotent:** re-running only fills missing files — it never overwrites an in-progress SESSION/overview. Safe to run on every pickup.

## REQUIRED after scaffolding — populate from the ticket (scaffold ≠ done)
The script only lays down skeletons with placeholders. **You (with Jira/MCP) must then fill all three files from the live ticket content** — this is not optional:
- Pull the epic + its **children** (descriptions, ACs, status) from Jira, and read the epic note in `Epics/<domain>/`.
- **SESSION.md is a proper agent handoff** — written so a fresh Claude agent can pick up and work the item cold: orientation (repo + which package `CLAUDE.md` holds the DoD), scope, children with real detail, where the work lives (repo/packages/branch/org), open questions → PO, DoD, and an honest state (is it build-ready or does it need grooming?).
- **overview.md / overview.html** — real user · business impact · intended solution · next phase · demo, from the ticket, not placeholders.
Leaving the placeholders in is a failure — the whole point is a ready-to-work handoff.

## When it fires
- **Automatically** in the `me-engineer` Start step, **keyed to the EPIC**. Single-ticket pickup → resolve the ticket's parent epic (note `epic:` / Jira `parent`) and scaffold that epic's folder. Epic run → scaffold once with the epic key. Pass branch + org once known.
- **Manually** anytime via `/build-overview-scaffold BMS-<epic>`.

## Templates
Live in `Manager-Engineer/Templates/build-overview/` (`SESSION.md`, `overview.md`, `overview.html`). Edit those to change what every new workspace starts with. Placeholders: `{{KEY}} {{TITLE}} {{SLUG}} {{DATE}} {{JIRA}} {{BRANCH}} {{ORG}} {{DOMAIN}}`.

## Notes
- Slug is derived from the title if `--slug` omitted (lowercased, hyphenated, ≤48 chars).
- Branch/org default to `TBD` — fill them when known (re-running won't clobber, so update the files directly after).
