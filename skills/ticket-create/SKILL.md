---
name: ticket-create
description: Scaffold a new ticket as a DRAFT file in the Obsidian Anvil vault (Tickets/Drafts/). Pure draft-first, human-in-the-loop — Jira is never touched on initial invocation. Promotion to a real BMS issue happens only when the user explicitly says "push it". Supports bulk drafting with intra-batch dependency wiring. Reads settings from ~/.claude/skills/ticket-create/config.yml.
---

# ticket-create

Draft-first ticket scaffolding. Takes a short summary plus whatever context the user pastes (Slack thread, email, spec excerpt, stacktrace) and writes a **draft file in the Obsidian vault**. The draft is the source of truth until the user reviews it and explicitly asks to push it to Jira. Only then does the Atlassian MCP get called.

The most important invariant in this skill: **the initial `/ticket-create` invocation never creates a Jira issue.** Drafting in Obsidian is step 1. Pushing to Jira is a separate, opt-in step 2.

Self-contained — reads its own `config.yml`. If you want a local engineering note once a draft has been promoted, run `/engineering-notes <issueKey>` as a follow-up.

---

## Prerequisites

- Atlassian MCP installed and connected (`/mcp` should show `atlassian`) — only required for the promotion step.
- `~/.claude/skills/ticket-create/config.yml` in place (see Setup below).
- User running `/ticket-create` has write access to the Obsidian vault (`vault_path` in config).
- User has Jira permission to create issues in `project_key` (only matters at promotion time).

---

## Setup

1. Copy the example, or ask claude to do it for you:

   ```sh
   cp ~/.claude/skills/ticket-create/config.yml.example ~/.claude/skills/ticket-create/config.yml
   ```

2. Set `vault_path` to the absolute path of your Obsidian vault (the directory containing `Anvil/`). Default in the example: `$HOME/Documents/Obsidian/Vault`.

3. The `jira.*` defaults (`ohanafy.atlassian.net`, `BMS`, browse URL) are already correct for the Anvil team — leave them alone unless you're on a different Jira cloud or project.

4. **`engineer.jira_account_id` is only required for the promotion step.** Drafts can be written without it. When promoting:

   - **Auto-resolve (recommended):** leave it as `""` in the config. On first promotion, the skill calls `mcp__atlassian__atlassianUserInfo`, prints your account ID, and asks you to paste it back into `config.yml` so subsequent runs don't re-resolve.
   - **Manual:** ask Claude to run `mcp__atlassian__atlassianUserInfo` once and paste the `account_id` into the config now.

5. **`engineer.assigned_engineer_field_id`** is the Jira custom field ID for "Assigned Engineer" (e.g. `customfield_10234`). Required only if you want that field set on push. Auto-discovery flow: leave blank, and on first promotion the skill calls `mcp__atlassian__getJiraIssue` against a recent ticket with `fields: ["*all"]`, scans the response for a custom field whose name contains "engineer", asks you to confirm the match, and writes the ID back to config. Set manually if you already know it (Jira admin → Custom Fields).

6. `labels.allow_list` and `labels.max_inferred` govern label auto-inference (see Flow §4). `--labels=` flag values bypass both.

7. `links.type_map` maps logical link kinds (`blocked_by`, `blocks`, `relates_to`) to the literal Jira link-type names. Defaults work for stock Jira Cloud; edit only if your instance uses custom names ("Dependency", etc.).

---

## How the user invokes it

### Draft a single ticket

```
/ticket-create <short summary>
<optional multi-line pasted context>
```

Example:

```
/ticket-create Harden RPV warehouse combobox against mid-open re-renders
Playwright suite hit a flake on apr20TestOrg where
options.first().click() timed out because the combobox
re-rendered mid-open. See e2e/tests/returnPreVisibility.spec.ts:40.
```

Optional inline overrides (at end of the summary line):

- `--type=<Bug|Task|Story|Spike>` — default `Story`
- `--project=<KEY>` — override config default (`BMS`)
- `--labels=<csv>` — comma-separated labels (bypasses inference + cap)
- `--package=<Name>` — populate `package:` frontmatter (e.g. `OHFY-OMS`, `E-Commerce`, `Tooling`)
- `--assignee=<Name|me>` — frontmatter `assignee` (default: `me` → `engineer.name`)
- `--engineer=<Name|me>` — frontmatter `assigned_engineer` (default: `me` → `engineer.name`)

### Draft multiple linked tickets at once

```
/ticket-create --bulk
<multi-line pasted context of work items>
```

Bulk format rules:

- The block after `/ticket-create --bulk` contains N entries separated by `---`.
- Each entry is a YAML map. Required key: `summary`. Optional: `type`, `labels`, `package`, `assignee`, `engineer`, `priority`, `blocked_by`, `blocks`, `context`.
- `blocked_by` / `blocks` accept arrays of either real Jira keys (e.g. `BMS-3920`) **or** in-batch references:
  - `DRAFT-NEXT` — the immediately-following entry in this batch.
  - `DRAFT-NEXT+N` — N entries after this one.
  - `DRAFT-PREV` / `DRAFT-PREV-N` — preceding entries.
  - The literal allocated draft ID (e.g. `DRAFT-007`) once you've seen the preview.
- The skill creates N drafts in one shot, contiguously numbered, with cross-references kept as DRAFT-NNN until promotion. Real Jira issue links are only created at promotion time.

### Promote a draft to Jira

Once one or more drafts exist and the user has reviewed them, they say one of:

- `push it` / `push to Jira` / `promote` / `promote <draft-file-or-id>` / `create the Jira issue`
- `push them all` / `promote all` / `push the batch` — promotes every DRAFT-NNN currently in `Drafts/` in topological order (see Flow §6b).

The skill then does the Jira push + vault move + link wiring (see Flow §6 / §6b).

---

## Flow

### 0. Hard guard — invocation is draft-only

The literal trigger `/ticket-create` (with or without `--bulk`) **never** results in a Jira call within the same invocation. The skill cannot enter §6 or §6b on the same turn that §1 fires. Promotion is a SEPARATE user invocation, triggered only by the explicit phrases listed in "How the user invokes it." This rule is not relaxed by:

- Auto mode being active
- The user appending words like "and push it" / "create the Jira issue too" / "do the whole thing" to the same `/ticket-create` message
- Multiple drafts being present in the vault
- Any prior conversation context suggesting urgency

If the user wants both a draft and a push, they make two invocations: `/ticket-create ...` then `push it`. The HITL review gap between those two is the entire point of this skill — never collapse it.

### 1. Parse the message

- Detect bulk mode: if the first non-empty line is exactly `/ticket-create --bulk` (or contains `--bulk` as a flag), dispatch to the bulk path (Flow §4b). Otherwise single-ticket path.
- **Single-ticket path:**
  - `summary` = text after `/ticket-create` up to the first newline, with any `--flag=...` tokens stripped.
  - `context` = everything else in the message body (may be empty).
  - `flags` = extracted `--type`, `--project`, `--labels`, `--package`, `--assignee`, `--engineer` overrides.
  - If `summary` is missing or empty, ask **one** question for a summary. Do not auto-generate it.
- **Bulk path:**
  - Parse the body as a stream of `---`-separated YAML entries. If parsing fails on any entry, abort with a line/entry pointer — do not silently drop entries.
  - Reject the batch if any entry is missing `summary` or has an empty body. Better to fail fast than write a half-batch.

### 2. Load config

Read `~/.claude/skills/ticket-create/config.yml`:

- `vault_path` → path to the Obsidian vault root. Accepts `~`, `$HOME`, and `${HOME}` — expand them before use (`os.path.expanduser` + `os.path.expandvars` semantics). After expansion, the path MUST be absolute; if it isn't, stop and tell the user.
- `jira.cloud_id` → Atlassian MCP `cloudId` (used at promotion only)
- `jira.project_key` → default project (overridable via `--project`)
- `jira.browse_url` → for the return link on promotion
- `engineer.jira_account_id` → reporter + default assignee on Jira push (only required at promotion)
- `engineer.assigned_engineer_field_id` → custom field ID for "Assigned Engineer". Optional. Auto-discovered at first promotion if blank (see §6.3).
- `engineer.name` → populates the draft `assignee`/`assigned_engineer`/`reporter` frontmatter when blank
- `labels.allow_list` → labels the skill is allowed to infer (user `--labels=` overrides bypass)
- `labels.max_inferred` → cap on inferred labels (default 2 if missing)
- `links.type_map.{blocked_by, blocks, relates_to}` → Jira link-type names; defaults `"is blocked by"`, `"blocks"`, `"relates to"`

If the file is missing, point the user at `config.yml.example` and stop. If `vault_path` is missing, name it explicitly and stop — do not prompt inline. Missing `jira_account_id` only blocks promotion, not drafting. Missing `assigned_engineer_field_id` triggers the auto-discovery flow at first promotion (see §6.3) — it does not block drafting.

Resolve vault paths:

- Drafts directory: `{vault_path}/Anvil/Tickets/Drafts/`
- Created-tickets directory: `{vault_path}/Anvil/Tickets/Created Tickets/`
- Template: `{vault_path}/Anvil/Templates/ticket-template.md`

### 3. Compute the draft ID

Scan BOTH `Anvil/Tickets/Drafts/` and `Anvil/Tickets/Created Tickets/` for files matching `DRAFT-(\d{3})-*.md`. Take the max and add 1, zero-padded to three digits (e.g. highest existing is `DRAFT-002` → new draft is `DRAFT-003`). Starting point when none exist: `DRAFT-001`.

For bulk: allocate N contiguous IDs starting at the next free number (e.g. existing max is 005, batch of 3 → `DRAFT-006`, `DRAFT-007`, `DRAFT-008`). Resolve `DRAFT-NEXT[+N]` / `DRAFT-PREV[-N]` references against this allocated range **before** writing any files.

**Do not** reuse IDs even from drafts that were already promoted — the DRAFT-NNN id persists in the Created-Tickets filename only if you choose to keep it; numbering monotonically avoids collisions either way.

### 4. Build the draft file — fully populated, no placeholders

**Filename**: `DRAFT-NNN-<kebab-summary>.md` where `<kebab-summary>` is the first ~6 words of `summary` kebab-cased, lowercase, ASCII.

**Auto-fill posture**: every section and every inferable frontmatter field MUST be filled in on the first pass using the summary + pasted context. Do not write `TBD`, leave template placeholders, or emit `*_tbd: true` markers. The engineer will edit a fully-populated draft, not fill in blanks.

**Placeholder elimination — explicit list.** The template (`ticket-template.md`) ships with bracket-style placeholders and pipe-delimited choice lines. Every one of these MUST be replaced with concrete content before the draft is written. Specifically:

- Title heading: `# BMS-XXXX: [Title]` → replace with `# DRAFT-NNN: <summary>`. The template no longer ships with a trailing `|<MODULE>|` tag — do not invent one. If the draft is unambiguously tied to a specific module, you may append `|OMS|` / `|WMS|` / `|REX|` / `|ECOM|` etc.; otherwise leave the heading unsuffixed.
- Header lines:
  - `**Priority**: Critical | High | Medium | Low` → `**Priority**: <picked priority>` (matching frontmatter).
  - `**Effort**: S | M | L` → `**Effort**: <picked effort>` (matching frontmatter, plus a short parenthetical like "S (a few hours)" / "M (1–2 days)" / "L (3+ days)").
  - `**Components**: [LWCs, Apex classes, objects touched]` → `**Components**: <comma-separated list of concrete artifacts>` (or remove the line entirely if no concrete components are knowable).
- Story Statement body: `As a [Actor], I want to [observable action], so that [business outcome].` → fully resolved sentence with the inferred actor + concrete action + concrete outcome.
- Acceptance Criteria scenarios:
  - `### SCENARIO: [Happy Path Title]` → `### SCENARIO: <concrete scenario name>`.
  - `### SCENARIO: [Failure/Edge Case Title]` → `### SCENARIO: <concrete scenario name>`.
  - `**GIVEN** [initial state]`, `**WHEN** [user action]`, `**THEN** [system response]`, `**AND** [additional outcome]` → all four lines become concrete sentences.
- Dependencies bullets: `[linked story or None]` → either a real `BMS-NNNN` key (only if explicitly mentioned in the paste — see "Dependency parsing" below) or the literal word `None`.
- Implementation Notes bullets: `[Key classes, methods, LWCs, objects]` and `[Anything hardcoded, incomplete, or missing error handling]` → 3–6 concrete bullets per the rules below.

**Verification pass before writing the file.** After building the draft body in memory but before calling `Write`, scan the output for residual placeholders:

- Any unescaped `[...]` bracket pair on a non-link line.
- Any ` | ` choice pattern (three or more options separated by ` | `).
- The literal strings `TBD`, `tbd`, `<!-- ... -->`, `_tbd:`.
- The literal token `BMS-XXXX` anywhere in the file (template default — appears in the title heading, `epic:` frontmatter, and `jira:` URL frontmatter; all must be replaced or cleared).
- The literal frontmatter line `jira: https://ohanafy.atlassian.net/browse/BMS-XXXX` (template default — must be cleared to `jira:` until promotion).
- The literal default `labels: [ecom]` and `tags: [ticket, ecom]` from the template — these are ecom-team defaults, not universal. Re-derive both from the actual draft (see Label inference and Tags handling below). The skill must NOT ship an ecom label/tag on a non-ecom draft just because the template defaults to it.

If any of these survive, re-fill the affected slots before writing. Do NOT write a draft that fails this check; that's the bug the engineer keeps catching, not the engineer's job to clean up after.

The only fields that may stay blank are external identifiers the agent cannot know:

- `epic` — Jira epic key
- `sprint` — see Sprint handling below
- `jira` — populated at promotion

`blocked_by` / `blocks` are populated from the paste (see "Dependency parsing" below) — they're no longer always blank.

**Sprint handling**: ask the user **once** at the start of the run: _"What sprint should this land in? (e.g. `Sprint 24`, or say `skip` to leave blank.)"_ If they answer with a sprint name, write it to `sprint:`. If they say `skip`, `none`, `blank`, or `later`, leave `sprint:` empty. Do not ask twice. (Sprint stays a frontmatter-only field — the skill does not push it to Jira at promotion. Set it manually in Jira if you want it tracked there.)

**Assignee + Assigned Engineer resolution**:

- If `--assignee=me` (or absent), fill frontmatter `assignee` with `engineer.name`. If `--assignee=<Other Name>`, fill with that name verbatim.
- Same for `assigned_engineer` via `--engineer=`.
- These are display strings in the draft. They get resolved to Atlassian account IDs at promotion (see §6.4).

**Label inference (capped)**:

- **Discard the template's default `labels: [ecom]` first.** Start from an empty list, then apply the rules below. The template ships ecom-defaulted because the ecom team owns the original copy; it is not a universal default.
- If `--labels=<csv>` is supplied, use exactly those labels. Skip inference. Don't mix in inferred ones.
- Otherwise, infer from the paste:
  - Match against `labels.allow_list` only. A label is candidate if its name (or an obvious synonym) appears in the summary, context, file paths, class names, or stacktrace.
  - Synonyms / signals (illustrative, not exhaustive): `bug` ← stacktrace, "broken", "regression", `--type=Bug`. `tech-debt` ← "refactor", "cleanup". `security` ← "auth", "permission", "CSRF", "XSS", "PII". `frontend` ← LWC, JS file paths, `.tsx`, "UI". `backend` ← Apex, trigger, `.cls`, "controller", flow. `ecom` ← storefront, Experience Cloud, "checkout", "shop". `wms` / `oms` / `rex` ← package names or those module references.
  - Cap at `labels.max_inferred` (default 2). When more than the cap match, prefer the most specific (`security` over `bug`; `wms` over `backend`).

**Tags handling (Obsidian frontmatter `tags`)**:

- The template ships `tags: [ticket, ecom]`. The first tag (`ticket`) is universal — keep it on every draft. The second (`ecom`) is an ecom-team default that must be re-derived per draft.
- Always include `ticket` as the first tag.
- Append a module tag matching the resolved `package` / module signal: `oms`, `wms`, `rex`, `pltfm`, `ecom`, `tooling`. If no module signal is present, omit the second tag — leave `tags: [ticket]`.
- Tags are Obsidian-only — never pushed to Jira.

**Dependency parsing (auto-populates `blocked_by` / `blocks`) — explicit-mention only**:

- A `BMS-NNNN` key may only land in `blocked_by` or `blocks` if the **literal key string** appears in the paste body. No "vibes-based" inference. No "the user mentioned a related ticket" without a key. No pulling keys from prior conversation history.
- Scan rule:
  - `BMS-NNNN` literally written in the paste, with the phrase "blocked by" / "depends on" / "after" / "waiting on" within the same line or the previous ~15 words → `blocked_by: [BMS-NNNN]`.
  - `BMS-NNNN` literally written with "unlocks" / "blocks" / "before" / "must ship before" in the same proximity → `blocks: [BMS-NNNN]`.
  - `BMS-NNNN` literally written with "ships with" / "relates to" / "see also" / "alongside" → recorded in the body's "Ships With" line (not in `blocked_by`/`blocks`). Pushed at promotion as `relates to` links.
  - A `BMS-NNNN` key with no nearby relationship signal → drop it. Don't guess the relationship.
- For bulk drafts, `DRAFT-NEXT[+N]` / `DRAFT-PREV[-N]` references in entry YAML resolve to the allocated DRAFT-NNN IDs in step 3 and land in frontmatter as `DRAFT-NNN`. These are explicit and safe — no inference.
- If no dependency signals exist, leave both arrays empty (`blocked_by:` / `blocks:` with no list items). The body's `## Dependencies` section gets `None` on each line.

**Never-invent rule for external identifiers.** The skill MUST leave the following blank if their value isn't either (a) literally present in the paste or (b) supplied via flag/config:

- `epic` — Jira epic key. Always blank in drafts. Never inferred from "this looks like it belongs to epic X" reasoning.
- `jira` — populated only at promotion from the real `issueKey`. Never written at draft time.
- `blocked_by` / `blocks` — only literal `BMS-NNNN` mentions per the rules above; never invented.
- `sprint` — only the value the user gave when asked once. Never inferred.
- Any `customfield_*` ID — only set via config or the auto-discovery flow in §6.3. Never guessed.
- Atlassian account IDs — only the resolved value from `engineer.jira_account_id` config or a verified MCP lookup. Never fabricated.
- Link type names — only what's in `links.type_map`. Never invented.

If the skill is tempted to fill any of these from prior conversation context, treat that temptation as the bug. Leave it blank and let the engineer fill in.

**Contents**:

1. Read `{vault_path}/Anvil/Templates/ticket-template.md` verbatim — both YAML frontmatter and body structure come from this file. Do not invent frontmatter keys or body sections.
2. Fill in frontmatter from parse results + config + inference:
   - `ticket` → `DRAFT-NNN`
   - `title` → the summary (quote it)
   - `type` → flag or `Story`
   - `status` → `Backlog`
   - `wip` → always `false` on initial draft. The skill never sets this to `true` — only the engineer does, manually, when they want to lock the draft against promotion. Obsidian-only — not pushed to Jira. See §6.0 for the gate behavior.
   - `priority` → infer from context (security/data-loss/blocking → `High`; visible bug or new feature → `Medium`; cleanup/polish → `Low`). Default `Medium` if signal is weak. Pushed to Jira at promotion.
   - `assignee`, `assigned_engineer`, `reporter` → resolved per the rules above (default `engineer.name`)
   - `labels` → **discard the template's default `[ecom]`**, then apply: `--labels` flag if present; else inferred + capped per the Label inference rules above.
   - `tags` → **discard the template's default `[ticket, ecom]`**, then re-derive per the Tags handling rules above. Always starts with `ticket`; second tag is the resolved module or omitted.
   - `package` → from `--package` flag, else infer from the paste (file paths, class names, repo signals); leave blank only if truly unknowable (DO NOT default to `E-Commerce` when outside the ecom repo). Obsidian-only — not pushed to Jira.
   - `effort` → infer from scope (single LWC tweak → `S`; multi-file feature → `M`; cross-package or schema change → `L`). Obsidian-only.
   - `components` → list classes/LWCs/objects mentioned in the paste; empty list if none referenced. Obsidian-only.
   - `blocked_by`, `blocks` → from dependency parsing; empty list if none.
   - `created`, `updated` → today's ISO date
   - `epic` → **clear the template default `BMS-XXXX`**; leave blank. Never inferred.
   - `jira` → **clear the template default `https://ohanafy.atlassian.net/browse/BMS-XXXX`**; leave blank. Populated only at promotion (§6.6).
   - `sprint` → blank, or per the user's answer to the once-asked sprint prompt (see Sprint handling above).
3. Fill in the body, preserving the template section order. **Every section gets real content** — no placeholders, no `<!-- tbd -->` comments:
   - Replace the title line with `# DRAFT-NNN: <summary>`.
   - `## Story Statement` → if the paste contains a clearly-formed "As a X, I want Y, so that Z", use it verbatim. Otherwise infer one from summary + context. Always one sentence in that exact shape.

     **Actor inference** Pick the role from explicit signals in the paste + frontmatter:
       - **Retailer** — only when ecom-related: `package` is `E-Commerce`, labels include `ecom`, or the paste names the storefront / Experience Cloud / "My Orders" / product-browse / checkout surface. No ecom signal → not Retailer.
       - **Sales Rep** — sales-route or order-entry-on-behalf-of-account flows (OHFY-OMS).
       - **Driver** — delivery, load, route-execution, or offline-tagged workflows (OHFY-OMS / OHFY-WMS).
       - **Warehouse Supervisor** — picking, receiving, transfers, return pre-visibility, inventory adjustments (OHFY-WMS).
       - **Admin** — configuration surfaces: pricelists, promotions, CMDT edits, trigger configuration, user setup.
       - **Engineer** — tooling, CI, refactor, or test-infra tickets with no user-facing surface.
     If the signal is weak, default to **Engineer**. Retailer requires an affirmative ecom signal; Admin requires an explicit configuration-surface signal. When in doubt, Engineer is the safe default — never Retailer.
   - `## Acceptance Criteria` → if the paste contains GIVEN/WHEN/THEN or numbered criteria, preserve verbatim. Otherwise generate at least one happy-path scenario and one failure/edge-case scenario from the summary + context, in the template's GIVEN/WHEN/THEN format.
   - `## Dependencies` → fill from the paste (`Cannot Start Until`, `This Story Unlocks`, `Ships With`); use `None` for any line the paste doesn't address. Keep this in sync with frontmatter `blocked_by`/`blocks` — if the prose mentions a key, the frontmatter array must contain it.
   - `## Implementation Notes` → 3–6 concrete bullets pointing at the files/classes/LWCs/services the work touches. Each bullet names a real artifact (e.g. `homeFeaturedPromotionsBanner.js`, `OrderConfirmationService.send()`, `Promotion__c.IsFeatured__c`) plus a short note on the change. Do NOT dump the user's paste here verbatim — synthesize. If the paste contains a stacktrace or log excerpt worth preserving, add it as a single fenced code block AFTER the bullets, not as a replacement for them. (Obsidian-only; stripped at promotion.)

   The current template has exactly four body sections: `## Story Statement`, `## Acceptance Criteria`, `## Dependencies`, `## Implementation Notes`. Do not invent additional sections (no `## Testing Notes`, `## Notes`, `## QA`, etc.) — if you think one is missing, surface it to the engineer and update the template, don't silently emit it from this skill.

Write to `{vault_path}/Anvil/Tickets/Drafts/DRAFT-NNN-<slug>.md`. If a file with the same name already exists, abort and show the path — do not overwrite.

### 4b. Build bulk drafts (only when `--bulk` was detected)

1. After step 3 has allocated N contiguous DRAFT-NNN IDs, resolve all `DRAFT-NEXT[+N]` / `DRAFT-PREV[-N]` references in each entry's `blocked_by` / `blocks` against the allocated range. Out-of-range references abort the whole batch with a pointer to the offending entry.
2. Validate the dependency graph **across the batch** (in-batch DRAFT-NNN refs only — real BMS keys are not validated):
   - No self-references (`DRAFT-007.blocked_by: [DRAFT-007]`).
   - No cycles. Run a DFS / topological sort; if a cycle exists, abort with the cycle printed.
3. Ask for sprint **once for the whole batch**, not per entry. Apply the answer to all drafts (or leave all blank).
4. For each entry, run step 4 in single-ticket mode — same template, same auto-fill posture, same rules. Re-use the per-entry `summary`/`context`/flags.
5. Write all N draft files. If ANY file write fails, leave the partially-written ones in place and surface the failure with the list of what landed and what didn't — do not roll back, the user can re-run for the missing ones.

### 5. Preview

**Single-ticket** report back:

```
Draft written (NOT in Jira):
  File          : {vault_path}/Anvil/Tickets/Drafts/DRAFT-NNN-<slug>.md
  Title         : <summary>
  Type          : <type>
  Priority      : <priority>
  Assignee      : <assignee>
  Engineer      : <assigned_engineer>
  Sprint        : <sprint or "(blank)">
  Labels        : <labels or "(none)">
  Blocked by    : <comma-separated keys, or "(none)">
  Blocks        : <comma-separated keys, or "(none)">

  Next:
    - Review the draft in Obsidian and edit anything that's wrong.
    - When ready, say "push it" / "push to Jira" to promote to BMS.
```

**Bulk** report back:

```
Bulk drafts written (NOT in Jira):
  DRAFT-006 — <title 1>      blocked_by: DRAFT-007   blocks: (none)
  DRAFT-007 — <title 2>      blocked_by: (none)      blocks: BMS-3930
  DRAFT-008 — <title 3>      blocked_by: DRAFT-006   blocks: (none)

  Next:
    - Review each draft in Obsidian.
    - Say "push them all" to promote the batch in dependency order with links wired up.
```

**Stop here on the initial invocation.** Do not call `createJiraIssue`. Do not move any file.

### 6. Promotion (only when the user explicitly asks for a single draft)

Triggered by phrases like `push it`, `push to Jira`, `promote`, `create the Jira issue`. If the user references a specific draft (`promote DRAFT-003`), target that file; if there is exactly one draft in `Drafts/` and the user doesn't name one, prompt to confirm. If there are multiple and no name, ask which one (or whether they meant the bulk path — see §6b).

#### 6.0 WIP gate

Before any other promotion step, read the target draft's frontmatter `wip` field:

- If `wip: true` (or any truthy YAML form: `true`, `yes`, `on`), **abort the promotion immediately**. Do not call `mcp__atlassian__createJiraIssue`. Do not move the file. Do not edit the draft. Surface this exact shape:

  ```
  Promotion blocked — DRAFT-NNN is marked WIP.

    File : {vault_path}/Anvil/Tickets/Drafts/DRAFT-NNN-<slug>.md

    To push: open the draft, set `wip: false` in the frontmatter, then re-run `push it`.
  ```

- If `wip: false` (or missing — treat as false for backwards compatibility with pre-`wip` drafts), proceed to §6.1.

The WIP flag is engineer-controlled and exists exactly to give a one-line "not ready yet, please don't push me" lock. The skill never flips it on the engineer's behalf.

#### 6.1 Read and split the draft

Read the draft file. Split frontmatter from body, then build the Jira description by stripping:

- The YAML frontmatter (everything between the leading `---` fences).
- The leading `# DRAFT-NNN: ...` title line (Jira has its own summary field).
- Any `## Related` section (Obsidian backlinks — meaningless in Jira).
- Any `## Context` section (legacy drafts only — never emitted by step 4 anymore, but strip if present).
- The `## Implementation Notes` section (engineer-private notes).

"Strip a section" means: remove the heading line and every line up to (but not including) the next `^## ` heading, or end-of-file if none follows. Collapse any resulting double-blank lines to a single blank.

#### 6.2 Resolve display names → account IDs

For frontmatter `assignee` and `assigned_engineer`:

- If the value matches `engineer.name` exactly, use `engineer.jira_account_id` from config.
- Otherwise, call `mcp__atlassian__lookupJiraAccountId` (or equivalent user-search endpoint) with the display name. If the lookup returns exactly one match, use it. If zero or multiple, surface the ambiguity — DO NOT push the issue, ask the user for the account ID.
- If frontmatter is blank for either field, omit it from the push (don't default to engineer when explicitly cleared by the user).

#### 6.3 Auto-discover `assigned_engineer_field_id` (one-time, only if blank)

If `engineer.assigned_engineer_field_id` is blank in config:

1. Call `mcp__atlassian__getJiraIssue` against any recent ticket (prefer `BMS-3930` if accessible, else any other ticket the user has touched), with `fields: ["*all"]` and `responseContentFormat: markdown`.
2. From the response, list every `customfield_*` whose schema name or display name contains the substring "engineer" (case-insensitive).
3. If exactly one match: print it ("Found Assigned Engineer field: customfield_10234 — write this back to config?") and wait for confirmation. On confirmation, edit `config.yml` to set the value, then proceed.
4. If multiple matches or none: print the candidate list and stop, asking the user to set the value manually in config.

#### 6.4 Build and call `createJiraIssue`

```json
{
  "cloudId": "<config.jira.cloud_id>",
  "projectKey": "<frontmatter override or config.jira.project_key>",
  "issueTypeName": "<frontmatter.type>",
  "summary": "<frontmatter.title>",
  "description": "<body-without-title-or-frontmatter>",
  "contentFormat": "markdown",
  "additional_fields": {
    "labels": [...],
    "priority": { "name": "<frontmatter.priority>" },
    "reporter": { "accountId": "<config.engineer.jira_account_id>" },
    "assignee": { "accountId": "<resolved from frontmatter.assignee>" },
    "<config.engineer.assigned_engineer_field_id>": { "accountId": "<resolved from frontmatter.assigned_engineer>" }
  }
}
```

Omit any `additional_fields` key whose source value is blank — don't send `"priority": null` or `"assignee": {}`.

#### 6.5 Wire up issue links

After `createJiraIssue` returns the new `issueKey`:

For each entry in frontmatter `blocked_by`:

```json
mcp__atlassian__createJiraIssueLink({
  "cloudId": "...",
  "issueKey": "<new issueKey>",
  "linkTypeName": "<config.links.type_map.blocked_by>",
  "outwardIssueKey": "<entry>"
})
```

For each entry in frontmatter `blocks`: same call, `linkTypeName` = `config.links.type_map.blocks`, `outwardIssueKey` = the entry.

For each `BMS-NNNN` mentioned on a "Ships With" line in the draft body: `linkTypeName` = `config.links.type_map.relates_to`.

Per-link error handling: if a link call fails, surface the error and continue with the next link. Do NOT delete the issue — partial linking is better than rolling back the whole creation. Report which links succeeded vs failed at the end.

#### 6.6 Update the draft file

On `createJiraIssue` success:

- Capture `issueKey` (e.g. `BMS-3901`).
- Update the draft's frontmatter:
  - `ticket: <issueKey>`
  - `jira: <browse_url>/<issueKey>`
  - `status: <status returned by Jira, default "To Do">`
  - `updated: <today>`
- Rename the file: `DRAFT-NNN-<slug>.md` → `<issueKey>-<slug>.md`.
- Move the file: `Tickets/Drafts/` → `Tickets/Created Tickets/`.
- Update the first heading in the body from `# DRAFT-NNN: ...` to `# <issueKey>: ...`.

On `createJiraIssue` failure:

- Leave the draft file in `Drafts/` untouched.
- Surface the MCP error verbatim.
- Do not retry silently.

#### 6.7 Report

```
Promoted DRAFT-NNN → <issueKey>
  File              : {vault_path}/Anvil/Tickets/Created Tickets/<issueKey>-<slug>.md
  Jira              : <browse_url>/<issueKey>
  Assignee          : <name>
  Assigned Engineer : <name>
  Priority          : <priority>
  Labels            : <labels>
  Links created     : <N> (of <M> attempted) — <list with status per link>
  Suggested branch  : <type_prefix>/<issueKey>
  Next              : /engineering-notes <issueKey> to scaffold an engineering note
```

Branch prefix mapping: `Story → story/`, `Bug → fix/`, `Task → chore/`, `Spike → spike/`.

### 6b. Bulk promotion (only when the user says "push them all" / "promote all")

1. Enumerate every `DRAFT-NNN-*.md` file in `Drafts/`. Read each, parse frontmatter.
1a. **WIP partition.** Split the enumerated drafts into two lists by frontmatter `wip` value:
   - `wip: true` → **skipped** (not pushed, not link-resolved, not moved). Collect these for the report at the end.
   - `wip: false` (or absent) → **promotable**, continue to step 2 with this filtered list.

   If the promotable list is empty (every draft is WIP), abort the bulk run with: `Every draft in Drafts/ is marked WIP — nothing to push. Un-flip the ones you want to promote and re-run.`

   The skipped WIP drafts must NOT be referenced by any promotable draft's `blocked_by` / `blocks`. If a promotable draft depends (via in-batch DRAFT-NNN ref) on a WIP draft, abort the whole bulk run with the offending pair printed — pushing one half of a dependency pair while the other stays in Drafts/ would leave a dangling unresolvable link.
2. Build a directed graph: for each draft, edges from this draft to every DRAFT-NNN appearing in its `blocked_by`. (Real `BMS-NNNN` keys are external — they don't participate in topological ordering.)
3. Topologically sort. If a cycle exists, abort and print the cycle — the user has to fix it before pushing.
4. For each draft in topo order:
   - Run §6.1–§6.4 to push the issue. Capture the resulting `BMS-NNNN`.
   - Maintain a `draft_to_issue` map (e.g. `{ "DRAFT-006": "BMS-3950", "DRAFT-007": "BMS-3951" }`).
   - In any subsequent draft's frontmatter `blocked_by` / `blocks`, substitute resolved `DRAFT-NNN → BMS-NNNN` before that draft's promotion.
5. After all issues are created, fire all `createJiraIssueLink` calls (§6.5) per draft. Doing links in a second pass ensures every key referenced in the batch already exists in Jira.
6. Run §6.6 (file move + rename + frontmatter update) for each promoted draft.
7. If any single push fails mid-batch:
   - Stop pushing further issues.
   - DO still attempt link creation for the issues that already landed (skipping links that reference unresolved DRAFT-NNN).
   - Surface a clear "promoted X of N, failed at DRAFT-NNN, the rest are still in Drafts/" report.
8. Final report:

```
Bulk promotion complete:
  DRAFT-006 → BMS-3950   (links: 1/1)
  DRAFT-007 → BMS-3951   (links: 2/2)
  DRAFT-008 → BMS-3952   (links: 0/1 — failed: blocks BMS-9999 not found)

  Created Tickets:
    {vault_path}/Anvil/Tickets/Created Tickets/BMS-3950-*.md
    {vault_path}/Anvil/Tickets/Created Tickets/BMS-3951-*.md
    {vault_path}/Anvil/Tickets/Created Tickets/BMS-3952-*.md

  Next: /engineering-notes <issueKey> per ticket as you start work.
```

---

## Guardrails

- **Draft first, always.** The initial `/ticket-create` invocation MUST result in vault file(s) and MUST NOT call `mcp__atlassian__createJiraIssue`. Even under auto mode. Even if the user sounds impatient. The user gets a preview + file paths, nothing more.
- **Push is a separate command.** Only explicit phrases (`push it`, `push to Jira`, `promote`, `push them all`) trigger the Jira call. "Create", "yes", "ok" are NOT push triggers — they're too ambiguous given this skill's draft-first shape.
- **WIP gate.** A draft with `wip: true` in its frontmatter is never pushed to Jira. Single promotion aborts cleanly with a "set wip: false and re-run" message. Bulk promotion skips WIP drafts entirely — and aborts the whole batch if a promotable draft depends on a WIP one (don't leave dangling links). The skill never flips `wip` on the engineer's behalf.
- **Fully populated on first pass.** Every body section gets real content and every inferable frontmatter field is filled in. No `TBD`, no template placeholders, no `*_tbd: true` markers. Run the §4 verification pass before writing — placeholders are a bug, not a deliverable.
- **Never invent external identifiers.** `epic`, `jira`, sprint values not given by the user, BMS keys not literally in the paste, account IDs, custom-field IDs, link-type names not in `links.type_map` — all stay blank. If tempted to fill from prior conversation history, that temptation is the bug.
- **Only these fields may stay blank**: `epic`, `sprint` (unless user names one), `jira`. `blocked_by`/`blocks` may be empty arrays but are populated only from BMS keys literally present in the paste — never inferred.
- **Ask for sprint exactly once**, at the start of the run (single or bulk). Accept a name, or `skip`/`none`/`blank`/`later` to leave it empty. Never ask twice.
- **Label cap is real.** Inferred labels are capped at `labels.max_inferred`. The `--labels=` flag bypasses both the allow-list and the cap — the user is taken at their word.
- **Assignee resolution is exact-match.** If the display name doesn't unambiguously resolve to an account ID at promotion, abort the push and ask. Do not guess.
- **Links never block issue creation.** A failed `createJiraIssueLink` call is logged and the next link is attempted. The issue itself is not rolled back.
- **Bulk dependency cycles abort the batch.** Detect with topo sort at draft time AND promotion time. Print the cycle.
- **In-batch DRAFT-NNN refs are resolved at promotion**, not at draft time. Drafts can stay in `Drafts/` indefinitely with DRAFT-NNN cross-references intact — they only become BMS keys when pushed.
- **Jira description omits Obsidian-only sections.** `## Related`, `## Context`, and `## Implementation Notes` MUST be stripped from the Jira description at promotion (see §6.1).
- **Never overwrite a draft.** If the target filename already exists, abort and show the path.
- **Template wins.** Frontmatter keys and body sections come from `ticket-template.md` verbatim. If the template lacks a field you wish existed, surface it — don't silently invent one.
- **Bulk parse failures abort the batch.** Don't write a partial batch on YAML errors; fix the input and re-run.
- **Do not fetch URLs in the paste.** Treat URLs as references; fetching them risks pulling sensitive data into the vault.
- **Do not post Jira comments** or @-mention people as part of this flow. The ticket (when promoted) is created clean.
- **On promotion failure, don't move the file.** The draft stays in `Drafts/` so the user can retry or edit and re-push.

---

## Quick reference

| Trigger | Mode | Reads | Writes | Calls Jira? |
|---|---|---|---|---|
| `/ticket-create <summary>` | Draft (single) | template + config + Drafts/ + Created Tickets/ (for numbering) | `Drafts/DRAFT-NNN-*.md` | No |
| `/ticket-create --bulk\n---\n...` | Draft (bulk) | template + config + Drafts/ + Created Tickets/ + parsed YAML entries | N × `Drafts/DRAFT-NNN-*.md` | No |
| `push it` / `promote` | Promote (single) | draft file + config | `Created Tickets/<issueKey>-*.md` (moved/renamed/updated) | Yes — `createJiraIssue` + `createJiraIssueLink` per dep · **blocked if `wip: true`** |
| `push them all` / `promote all` | Promote (bulk) | every draft file + config | N × `Created Tickets/<issueKey>-*.md` | Yes — N × `createJiraIssue` + M × `createJiraIssueLink` · **WIP drafts skipped; batch aborts if a promotable draft depends on a WIP draft** |
