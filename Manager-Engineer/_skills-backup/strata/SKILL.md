---
name: strata
description: >
  Code-verified architecture orientation for a BMS ticket/epic — answers the three questions that
  cost the most time: what was ALREADY built (in the real OHFY-Split source, cited to file:line),
  what THIS ticket actually changes (big impactful deltas only, reuse-vs-build), and WHY (tagged by
  source). Runs an archaeology pass over the repo at a pinned commit, renders a one-screen brief into
  the epic's Build-Overview folder, and generates the SESSION.md "why this isn't a rebuild" section.
  It is the anti-reinvention move, systematized. Invoke with "/strata BMS-XXXX", "orient me on
  BMS-XXXX", "what already exists for this", or run it at the start of any ticket/epic pickup.
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# strata 🪨

New work is a layer deposited on legible layers of old work. This skill reads the rock before you drill: it establishes the **code-verified baseline** so you stop rebuilding what's already there, frames only the **big deltas**, and captures the **why** — on one screen, pinned to a commit.

> **The bottleneck it kills:** "is this already built?" — answered from the *actual source*, not from Jira (which lies or is silent). This is the manual code-archaeology move, made repeatable.

## Constants
- Repo: `/Users/alvarosanchez_1/OHFY-Split` (branch `main`) · GitHub `Ohanafy/OHFY-Split`
- Jira cloudId `12843674-078e-48ac-ae5c-d33914c3bfb7` · accountId `712020:38e713f0-defd-468b-b422-26423a878525`
- Build-Overview: `…/Manager-Engineer/Build-Overview/BMS-<epic>-<slug>/` · Atlas: `…/Manager-Engineer/Atlas/Areas/`

## The three honesty rules (non-negotiable — this is what makes it trustworthy)
1. **No `file:line`/SHA → the claim is omitted, not softened.** "Standing on" is cited or it's flagged `⚠ uncited`. A brief that launders a guess as "code-verified" is worse than none.
2. **Never claim completeness.** Record *what you searched* (packages + terms) in `searched`. Absence in the brief means *not searched*, never *doesn't exist* — Salesforce logic hides in flows/trigger handlers three layers deep.
3. **"Why" is tagged by source** — `jira` / `commit` / `code` / `inferred`. The "why" is usually NOT in the code (it's a PO/Slack decision); tag it `inferred` rather than assert it. This is the exact "described-as-done ≠ actually-there" trap — don't repeat it.

## Run (steps)

### 1. Resolve context
- Get the ticket/epic from Jira (`getJiraIssue` or `parent = <epic>`): title, story/AC, Gulf context → the **why**. Strip `[REQ-###]`.
- Resolve the parent epic + slug + domain from `Epics/<domain>/BMS-<epic>-*.md` (or `mission-control.json`), so the brief lands in the right `Build-Overview/BMS-<epic>-<slug>/`.
- Determine **touched packages**: ticket `packages_touched` if noted, else infer from the AC + the synapse Atlas area for the domain. These bound the archaeology.
- **Is the key an EPIC?** If so → **epic mode** (`parent = <epic> ORDER BY key`): you'll orient the **whole epic child by child**. Pull the child tree (title/status/type per child), and take the **union** of all children's touched packages as the epic-wide archaeology scope. Children that are `Done`/`Won't Do` are included but marked (understanding, not building). Single ticket → skip to normal flow.

### 2. Pin the commit + push prior art
- `git -C /Users/alvarosanchez_1/OHFY-Split fetch origin -q && git -C … rev-parse --short origin/main` → the **SHA** everything is verified against. Record it; the brief is only true "as of" this ref.
- **Read the capability ledger** for the touched packages — the anti-reinvention push, *before* design:
  ```bash
  node ~/.claude/skills/synapse/ledger.mjs query --pkg OHFY-Data-Model --pkg OHFY-WMS
  ```
  Fold each returned line into `ledgerHits`. These are already-shipped, cited capabilities in the areas you're about to touch — read them first, then let the archaeology (step 3) fill gaps the ledger doesn't yet cover.

### 3. Archaeology — code-verified baseline (spawn an Explore agent)
Dispatch **one Explore agent** over `/Users/alvarosanchez_1/OHFY-Split` scoped to the touched packages. Brief it to answer, **with `file:line` citations**:
- What relevant capability **already exists** (objects/fields, services `S_`, executables `E_`, batch `B_`, LWCs, report types, CMDTs) that this ticket would otherwise rebuild? → `standingOn`.
- What is genuinely **missing** vs. the AC → the raw material for `delta`.
- Explicitly report **what it searched** (dirs + grep terms) so rule 2 holds.
Tell the agent: cite or omit; do not infer "why"; a partial read is fine but must be labeled partial. (This is the same move done by hand for short-pay/5067 this session — now it's the skill's core.)

### 4. Distil the delta (big + impactful only)
From the archaeology, write **1–3** `delta` items — the architectural moves, not every field. Each gets a `verdict`: `reuse` / `extend` / `build`. If you have >3, the ticket is under-decomposed — say so in `watchOut`. Add the `shape` (a 3-hop data-flow) and 0–2 `watchOut` landmines (governor limits, shared triggers, frozen released signatures, another team's flaky spec).

**Epic mode — the child-by-child walk.** Do the archaeology in two tiers so you don't re-scan the repo N times:
1. **One shared bedrock pass** over the epic's union of packages → the epic-level `standingOn` + `ledgerHits` + `shape` + `thesis`/`why` (this substrate is common to all children).
2. **One lightweight pass per child** (fan out — spawn the child agents in parallel): each returns that child's `thesis`, `why`, `delta` (1–3, verdicted), optional child-specific `standingOn`, and `watchOut`. Each child is oriented *against the shared bedrock* — so its delta reads as "difference from known ground," which is the cheapest thing to understand. Assemble them into `children[]` (below).

### 5. Compose `orientation.json` + render
Assemble the structured brief and render:
```json
{ "key":"BMS-XXXX","epicKey":"BMS-YYYY","title":"…","domain":"…","repo":"OHFY-Split",
  "sha":"<short-sha>","generated":"YYYY-MM-DD HH:MM","packages":["OHFY-…"],
  "thesis":"BMS-X adds ⟨capability⟩ to ⟨area⟩ because ⟨forcing reason⟩.",
  "why":[{"text":"…","source":"jira|commit|code|inferred"}],
  "standingOn":[{"cap":"…","cite":"File.cls:44","ticket":"BMS-1102"}],
  "delta":[{"change":"…","verdict":"reuse|extend|build","impact":"…"}],
  "shape":"LWC → Apex Ctrl → S_Rollup → report type",
  "watchOut":["…"],
  "searched":{"packages":["OHFY-…"],"terms":["…"]},
  "ledgerHits":["…"] }
```
**Epic mode** — same top-level fields describe the epic + shared bedrock, plus a `children[]` array (the renderer auto-switches to the child-by-child walk when `children` is present):
```json
{ "key":"BMS-<epic>", "title":"…", "sha":"…", "packages":[…],
  "thesis":"epic thesis", "why":[…], "standingOn":[…shared bedrock, cited…],
  "shape":"epic architecture", "watchOut":[…epic-level…], "searched":{…}, "ledgerHits":[…],
  "children":[
    { "key":"BMS-YYYY","title":"…","status":"<Jira status>",
      "thesis":"one line","why":[{"text":"…","source":"jira|code|inferred"}],
      "delta":[{"change":"…","verdict":"reuse|extend|build","impact":"…"}],
      "standingOn":[{"cap":"…","cite":"File.cls:44"}],   // optional, child-specific
      "watchOut":["…"], "shape":"…" }
  ] }
```
```bash
node ~/.claude/skills/strata/render.mjs <path>/orientation.json   # → orientation.md + orientation.html in that folder
```
Write it into the epic's `Build-Overview/BMS-<epic>-<slug>/` (create via `build-overview-scaffold` if missing). In epic mode the one page IS the whole-epic understanding — epic thesis + shared bedrock, then each child as its own oriented block with a sticky nav.

### 6. Feed the handoff
Generate/refresh the `SESSION.md` **"History — why this isn't a rebuild"** section from `standingOn` + `delta` (this is currently hand-authored — strata is its code-verified generator). Do NOT clobber an in-progress SESSION; inject/update just that section.

### 7. Report
One block: thesis · #existing-cited · #delta (with verdicts) · the SHA · packages/terms searched. Point at `orientation.html`.

## The thesis sentence (top of every brief)
`BMS-X adds ⟨capability⟩ to ⟨area⟩ because ⟨forcing reason⟩.` It's the schema-activator — everything else elaborates it. If you can't write it in one line, you don't understand the ticket yet; that's the signal to dig more before building.

## Guardrails
- **Read-only** on the repo and Jira; only writes the orientation artifacts into the vault Build-Overview folder (+ the SESSION.md History section).
- **Disposable by design** — pinned to a SHA. When the code moves, **regenerate**; never trust a stale brief. The durable knowledge is the capability ledger, not this per-ticket page.
- Owns only "what exists + why". "What changed" post-hoc stays `/dev-review`; correctness stays `/code-review`. No competing surface.

## The compounding loop (Phases 2–3 — live)
- **Phase 2 — capability ledger (built):** `Atlas/Ledger/ledger.json` is the append-only, cited inventory of shipped capability per area, managed by `~/.claude/skills/synapse/ledger.mjs` (`query`/`add`/`add-json`/`render`). `synapse` surfaces it as a "🧱 Capabilities already built here" section on every area hub. strata step 2 queries it. **Only cited + shipped capabilities belong** — no unmerged deltas, no uncited claims.
- **Phase 3 — close the loop (built):** at ticket wrap-up, `/dev-review` appends the confirmed new capability into the ledger (`ledger.mjs add-json`). Build → review → ledger grows → the next ticket's prior-art push is richer. That's the flywheel: every shipped ticket makes the next orientation start from a fuller baseline.
