---
name: mission-control
description: >
  The mother dashboard. Tracks every active (In Progress) BMS epic with its full ticket tree —
  each ticket's status plus its GitHub PR / review state — in one self-contained, auto-refreshing
  HTML page in the Obsidian vault. Surfaces an "in review / open PR" band up top so nothing waiting
  on you gets lost. Writes mission-control.html + a timestamped snapshot into
  Manager-Engineer/Mission-Control. Invoke with "/mission-control", "refresh mission control",
  "mother dashboard", or "show me everything in flight".
license: MIT
metadata:
  author: alvaro
  version: "1.0"
---

# mission-control 🛰️

One page, everything live. Active epics → their tickets → status + PR/review. Data from **Jira** (status) + **GitHub** (PRs), rendered to HTML in the vault with a paper-trail snapshot each run.

## Constants
- Jira cloudId `12843674-078e-48ac-ae5c-d33914c3bfb7` · your accountId `712020:38e713f0-defd-468b-b422-26423a878525`
- Repo `Ohanafy/OHFY-Split` · browse `https://ohanafy.atlassian.net/browse` · PRs `https://github.com/Ohanafy/OHFY-Split/pull`
- Output: `…/Manager-Engineer/Mission-Control/` (configurable in `config.json` next to `render.mjs`)

## Run (steps)

### 1. Active epics
`searchJiraIssuesUsingJql`:
```
project = BMS AND issuetype = Epic AND labels = sf-tracker
  AND assignee = 712020:38e713f0-defd-468b-b422-26423a878525
  AND status = "In Progress" ORDER BY updated DESC
```

### 1b. To Do epics (assigned to me, not started) — pick-up visibility
Also pull the epics still in the backlog so the board shows what's available to pick up:
```
project = BMS AND issuetype = Epic AND labels = sf-tracker
  AND assignee = 712020:38e713f0-defd-468b-b422-26423a878525
  AND statusCategory != Done AND status != "In Progress" ORDER BY updated DESC
```
These go into a separate `todoEpics` array (see step 3). **Include their full child-ticket trees too** (same shape as active epics) — the board expands them so nothing hides behind a not-started epic. `render.mjs` renders any `todoEpics` entry that has a `tickets` array as a full card (children + PR/review visible); tree-less entries fall back to the compact pick-up grid.

### 2. Ticket tree per epic (active AND to-do epics)
For each epic: `parent = <EPIC-KEY> ORDER BY key` — **include `labels` in the requested fields** (needed for the polish flag below). Batch all epics with `parent IN (...)`. The Atlassian tool may return fat bodies → large results auto-save to a file. **Don't read them in;** `jq` the saved path for just what the tree needs (run twice or one query with labels):
```bash
# status + type + title, grouped by parent
jq -r '.issues.nodes[] | "\(.fields.parent.key)\t\(.key)\t[\(.fields.issuetype.name)]\t\(.fields.status.name)\t\(.fields.status.statusCategory.name)\t\(.fields.summary)"' "<saved-file>"
# labels → polish flag: a ticket is polished if labels include `polished` OR `bk-polish-complete`
#   (bare `bk-polish` = polish-in-progress, NOT counted)
jq -r '.issues.nodes[] | "\(.key)\t\(.fields.labels // [] | join(","))"' "<labels-file>"
```

### 3. Write the Jira-only base file
Your ONLY hand-assembly step. From steps 1–2, write `…/Mission-Control/mission-control.base.json` — epics with their full ticket tree, **status only, no org, no pr** (the gatherer adds those):
```json
{ "generated": "YYYY-MM-DD HH:MM", "stampFile": "YYYY-MM-DD-HHMM",
  "epics": [ { "key":"BMS-XXXX","title":"...","domain":"...","phase":"crawl|walk|run",
    "pinned": false, "summary":"one crisp line",
    "user":"who it's for (one line)", "impact":"business impact (one line)", "solution":"intended solution, if any (one line)",
    "tickets": [ {"key":"BMS-YYYY","type":"Story|SPIKE|Demo","title":"...",
      "status":"<Jira status name>","statusCategory":"To Do|In Progress|Done",
      "build":"UI|Backend|Both|Spike|Docs", "note":"one-line what/why of this child",
      "polished": true|false} ] } ] }
```
Include **every** child of every in-progress epic (nest them all — that's the full-visibility contract). `pinned: true` for parked epics (📌). `polished` = labels include `polished` **or** `bk-polish-complete`.

**Epic context (`user`/`impact`/`solution`):** derive each as ONE tight line from the epic description — who benefits, the business pain/gain, and the intended solution (omit `solution` if none decided yet). Render as a labelled context block on the card.

**Ticket `build` flag + `note`:** `build` classifies *what gets built* and renders **immediately before** the ✨ polished label — `UI` (LWC/screen only), `Backend` (Apex/flow/data-model only), `Both` (UI + backend), `Spike` (investigation), `Docs` (docs-only). Infer from the ticket's title/labels/type (`spike`→Spike; `ui` label→UI or Both; `reporting`/data work→Backend; docs-only→Docs). `gather.mjs` auto-fills `Spike` for SPIKE-type tickets if you leave `build` unset, but set it explicitly for everything else. `note` is a short (<~10 word) clarifier that adds signal beyond the title; omit if the title already says it all.

Also add a sibling **`todoEpics`** array (from step 1b) — the assigned-to-me To Do epics, **with the same full `tickets` tree** (key/type/title/status/statusCategory/polished) so their children show on the board:
```json
"todoEpics": [ {"key":"BMS-XXXX","title":"...","domain":"...","phase":"crawl|walk|run","summary":"one-line note",
  "user":"...","impact":"...","solution":"...",
  "tickets": [ {"key":"BMS-YYYY","type":"...","title":"...","status":"...","statusCategory":"...","build":"...","note":"...","polished": true|false} ] } ]
```
Tree-less to-do epics render as compact cards — give them at least `impact` (shown as a 💥 line) so the pick-up grid is scannable. `user`/`impact`/`solution`/`build`/`note` are all optional and render only when present.
`gather.mjs` now enriches `todoEpics[].tickets` with PR/org too (same as epics); `render.mjs` draws each to-do epic that has tickets as a full card (children + polish + PR visible), and any tree-less ones in the compact pick-up grid. `statusCategory` drives the bar (In Progress/Review → started; Backlog/To Do/Needs Refinement → to-do; Done → done). Strip `[REQ-###]` from epic titles; keep summaries tight.

### 4. Gather — auto-attach PR + org (deterministic, scripted)
```bash
node ~/.claude/skills/mission-control/gather.mjs
```
This is the part that used to be hand-done and got things wrong — now it's code. It reads `base.json`, runs `gh pr list` + `sf org list`, and writes `mission-control.json` with each ticket's `pr` and `org` filled in:
- **PR match:** BMS number in the branch **or** title, incl. multi-ticket titles like `BMS-4217/5636/5638` (only the first carries the prefix). One PR → many tickets. Prefers OPEN, then newest.
- **Org match:** own-number org → else epic-number org → else PR-branch-number org — **only if the alias actually exists in `sf org list`.** So an expired org shows as *none* (truthful), and an epic-bundled PR lands the whole epic on `ohfy-val-<epic>`. Never invented.
- If a ticket sits in an open PR but has **no org**, that org likely expired — flag it (keep-orgs-till-merge).

### 5. Render
```bash
node ~/.claude/skills/mission-control/render.mjs
```
Writes `mission-control.html`, `Snapshots/<stamp>.html`, appends `refresh-log.md`. Prints a one-line summary.

**So the whole refresh is: Jira (MCP) → base.json → `gather.mjs` → `render.mjs`.** Only the Jira pull needs you/MCP; PRs + orgs are fully automated. (A Jira API token would let a script do step 1–3 too — offer it if he wants zero-touch.)

### 6. Report
State epics / tickets / in-progress / **in-review-or-PR** / done, and read out the ⚡ attention band (anything in Review or with an open PR — that's what's waiting on him). Point at `mission-control.html`.

## The dashboard
Summary cards → **⚡ Needs your eyes** band (Review / open-PR tickets, with PR links) → one card per epic: progress bar + counts + a ticket table (key · type · title · colored status · PR w/ draft/review tag). Dark, self-contained, `<meta refresh>` auto-reloads (15 min default).

## Refresh & viewing
- Refresh: `/mission-control` or "refresh mission control". Hands-off: `/loop 30m /mission-control` (interactive session — Jira MCP needs your login).
- View: open `mission-control.html` via *Open in default app*, or `<iframe src="Mission-Control/mission-control.html" width="100%" height="900"></iframe>` in a note.

## Guardrails
- **Read-only** on Jira, GitHub, and the repo; only writes into the Mission-Control folder.
- Never pull ticket/PR bodies into context — always `jq` the saved file for the fields you need.
- Scope is **active (In Progress) epics** by design. To include Done epics, widen the step-1 JQL and add them (Done ones can stay collapsed as one-liners).
