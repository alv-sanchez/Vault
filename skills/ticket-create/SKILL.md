---
name: ticket-create
description: Scaffold a new ticket as a DRAFT file in the Obsidian Anvil vault (Tickets/Drafts/). Pure draft-first, human-in-the-loop — Jira is never touched on initial invocation. Promotion to a real BMS issue happens only when the user explicitly says "push it". Reads settings from ~/.claude/skills/ticket-create/config.yml.
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

1. Copy the example:

   ```sh
   cp ~/.claude/skills/ticket-create/config.yml.example ~/.claude/skills/ticket-create/config.yml
   ```

2. Set `vault_path` to the absolute path of your Obsidian vault (the directory containing `Anvil/`). Default in the example: `$HOME/Documents/Obsidian/Vault`.

3. The `jira.*` defaults (`ohanafy.atlassian.net`, `BMS`, browse URL) are already correct for the Anvil team — leave them alone unless you're on a different Jira cloud or project.

4. **`engineer.jira_account_id` is only required for the promotion step.** Drafts can be written without it. When promoting:

   - **Auto-resolve (recommended):** leave it as `""` in the config. On first promotion, the skill calls `mcp__atlassian__atlassianUserInfo`, prints your account ID, and asks you to paste it back into `config.yml` so subsequent runs don't re-resolve.
   - **Manual:** ask Claude to run `mcp__atlassian__atlassianUserInfo` once and paste the `account_id` into the config now.

---

## How the user invokes it

### Draft a new ticket

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
- `--labels=<csv>` — comma-separated labels
- `--package=<Name>` — populate `package:` frontmatter (e.g. `OHFY-OMS`, `E-Commerce`, `Tooling`)

### Promote a draft to Jira

Once a draft exists and the user has reviewed it, they say one of:

- `push it` / `push to Jira` / `promote` / `promote <draft-file-or-id>` / `create the Jira issue`

The skill then does the Jira push + vault move (see Flow § 6).

---

## Flow

### 1. Parse the message

- `summary` = text after `/ticket-create` up to the first newline, with any `--flag=...` tokens stripped.
- `context` = everything else in the message body (may be empty).
- `flags` = extracted `--type`, `--project`, `--labels`, `--package` overrides.
- If `summary` is missing or empty, ask **one** question for a summary. Do not auto-generate it.

### 2. Load config

Read `~/.claude/skills/ticket-create/config.yml`:

- `vault_path` → path to the Obsidian vault root. Accepts `~`, `$HOME`, and `${HOME}` — expand them before use (`os.path.expanduser` + `os.path.expandvars` semantics). After expansion, the path MUST be absolute; if it isn't, stop and tell the user.
- `jira.cloud_id` → Atlassian MCP `cloudId` (used at promotion only)
- `jira.project_key` → default project (overridable via `--project`)
- `jira.browse_url` → for the return link on promotion
- `engineer.jira_account_id` → reporter on Jira push (only required at promotion)
- `engineer.name` → populates the draft `assignee`/`reporter` frontmatter when blank

If the file is missing, point the user at `config.yml.example` and stop. If `vault_path` is missing, name it explicitly and stop — do not prompt inline. A missing `jira_account_id` only blocks promotion, not drafting.

Resolve vault paths:

- Drafts directory: `{vault_path}/Anvil/Tickets/Drafts/`
- Created-tickets directory: `{vault_path}/Anvil/Tickets/Created Tickets/`
- Template: `{vault_path}/Anvil/Templates/ticket-template.md`

### 3. Compute the draft ID

Scan BOTH `Anvil/Tickets/Drafts/` and `Anvil/Tickets/Created Tickets/` for files matching `DRAFT-(\d{3})-*.md`. Take the max and add 1, zero-padded to three digits (e.g. highest existing is `DRAFT-002` → new draft is `DRAFT-003`). Starting point when none exist: `DRAFT-001`.

**Do not** reuse IDs even from drafts that were already promoted — the DRAFT-NNN id persists in the Created-Tickets filename only if you choose to keep it; numbering monotonically avoids collisions either way.

### 4. Build the draft file

**Filename**: `DRAFT-NNN-<kebab-summary>.md` where `<kebab-summary>` is the first ~6 words of `summary` kebab-cased, lowercase, ASCII.

**Contents**:

1. Read `{vault_path}/Anvil/Templates/ticket-template.md` verbatim — both YAML frontmatter and body structure come from this file. Do not invent frontmatter keys or body sections.
2. Fill in frontmatter from parse results + config:
   - `ticket` → `DRAFT-NNN`
   - `title` → the summary (quote it)
   - `type` → flag or `Story`
   - `status` → `Backlog`
   - `priority` → `TBD` (user fills in)
   - `assignee`, `reporter` → `engineer.name` from config (if present)
   - `labels` → list from `--labels` flag (plus any sensible defaults from the template)
   - `package` → from `--package` flag, else leave blank (DO NOT default to `E-Commerce` when outside the ecom repo)
   - `created`, `updated` → today's ISO date
   - `jira` → blank (gets filled in at promotion)
3. Fill in the body, preserving the template section order:
   - Replace the title line with `# DRAFT-NNN: <summary>`.
   - Under `## Story Statement`: if the user's paste includes a clearly-formed "As a X, I want Y, so that Z" sentence, use it verbatim; else leave the template placeholder and add `<!-- story-statement-tbd -->`.
   - Under `## Acceptance Criteria`: if the paste contains GIVEN/WHEN/THEN or numbered criteria, preserve verbatim; else leave the template scenarios as placeholders and add `acceptance_criteria_tbd: true` to frontmatter.
   - Under `## Implementation Notes` or a new `## Context` block near the top: drop the user's paste verbatim. Do not rewrite, summarize, or invent content when the paste is empty.

Write to `{vault_path}/Anvil/Tickets/Drafts/DRAFT-NNN-<slug>.md`. If a file with the same name already exists, abort and show the path — do not overwrite.

### 5. Minimum-viable-requirements check + preview

After writing, check that the draft contains at minimum:

- non-empty `title`
- `type` set
- Story Statement NOT marked tbd OR an explicit plan to fill it in
- AC scenarios present OR `acceptance_criteria_tbd: true` in frontmatter (honest marker is fine)

Report back to the user:

```
Draft written (NOT in Jira):
  File  : {vault_path}/Anvil/Tickets/Drafts/DRAFT-NNN-<slug>.md
  Title : <summary>
  Type  : <type>
  Labels: <labels or "(none)">

  Minimum requirements:
    [x] title
    [x] type
    [ ] story statement  ← placeholder, needs your edit
    [ ] acceptance criteria  ← tbd, needs your edit

  Next:
    - Edit the draft in Obsidian.
    - When ready, say "push it" / "push to Jira" to promote to BMS.
```

**Stop here on the initial invocation.** Do not call `createJiraIssue`. Do not move the file.

### 6. Promotion (only when the user explicitly asks)

Triggered by phrases like `push it`, `push to Jira`, `promote`, `create the Jira issue`. If the user references a specific draft (`promote DRAFT-003`), target that file; if there is exactly one draft in `Drafts/` and the user doesn't name one, prompt to confirm. If there are multiple and no name, ask which one.

1. Read the draft file.
2. Split frontmatter from body. Strip frontmatter entirely from the Jira description — only the body after `---` goes to Jira. Also strip the leading `# DRAFT-NNN: ...` title line (Jira has its own summary field).
3. Call `mcp__atlassian__createJiraIssue`:

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
       "reporter": { "accountId": "<config.engineer.jira_account_id>" }
     }
   }
   ```

4. On success:
   - Capture `issueKey` (e.g. `BMS-3901`).
   - Update the draft's frontmatter:
     - `ticket: <issueKey>`
     - `jira: <browse_url>/<issueKey>`
     - `status: <status returned by Jira, default "To Do">`
     - `updated: <today>`
   - Rename the file: `DRAFT-NNN-<slug>.md` → `<issueKey>-<slug>.md`.
   - Move the file: `Tickets/Drafts/` → `Tickets/Created Tickets/`.
   - Update the first heading in the body from `# DRAFT-NNN: ...` to `# <issueKey>: ...`.

5. On failure:
   - Leave the draft file in `Drafts/` untouched.
   - Surface the MCP error verbatim.
   - Do not retry silently.

6. Report:

   ```
   Promoted DRAFT-NNN → <issueKey>
     File : {vault_path}/Anvil/Tickets/Created Tickets/<issueKey>-<slug>.md
     Jira : <browse_url>/<issueKey>
     Suggested branch : <type_prefix>/<issueKey>
     Next : /engineering-notes <issueKey> to scaffold an engineering note
   ```

Branch prefix mapping: `Story → story/`, `Bug → fix/`, `Task → chore/`, `Spike → spike/`.

---

## Guardrails

- **Draft first, always.** The initial `/ticket-create` invocation MUST result in a vault file and MUST NOT call `mcp__atlassian__createJiraIssue`. Even under auto mode. Even if the user sounds impatient. The user gets a preview + a file path, nothing more.
- **Push is a separate command.** Only explicit phrases (`push it`, `push to Jira`, `promote`) trigger the Jira call. "Create", "yes", "ok" are NOT push triggers — they're too ambiguous given this skill's draft-first shape.
- **Never invent context.** An empty paste means an empty `## Context` block or `acceptance_criteria_tbd: true` — do not pull from conversation history to fill in fields the user didn't provide.
- **Never overwrite a draft.** If the target filename already exists, abort and show the path.
- **Template wins.** Frontmatter keys and body sections come from `ticket-template.md` verbatim. If the template lacks a field you wish existed, surface it — don't silently invent one.
- **One ticket per invocation.** If the user pastes multiple distinct topics, ask which one to draft or offer to split into N invocations.
- **Do not fetch URLs in the paste.** Treat URLs as references; fetching them risks pulling sensitive data into the vault.
- **Do not post Jira comments** or @-mention people as part of this flow. The ticket (when promoted) is created clean.
- **On promotion failure, don't move the file.** The draft stays in `Drafts/` so the user can retry or edit and re-push.

---

## Quick reference

| Trigger | Mode | Reads | Writes | Calls Jira? |
|---|---|---|---|---|
| `/ticket-create <summary>` | Draft | template + config + Drafts/ + Created Tickets/ (for numbering) | `Drafts/DRAFT-NNN-*.md` | No |
| `push it` / `promote` (after a draft exists) | Promote | draft file + config | `Created Tickets/<issueKey>-*.md` (moved + renamed + frontmatter updated) | Yes — `mcp__atlassian__createJiraIssue` |
