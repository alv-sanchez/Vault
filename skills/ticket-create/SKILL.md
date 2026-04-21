---
name: ticket-create
description: Create a new Jira ticket from a short summary + pasted context. Use when the user wants to open a Jira issue (e.g. "/ticket-create <summary>" with context pasted below). Reads Jira settings from ~/.claude/skills/ticket-create/config.yml.
---

# ticket-create

Jira ticket scaffolding. Takes a short summary plus whatever context the user pastes (Slack thread, email, spec excerpt, stacktrace) and creates the Jira issue via the Atlassian MCP.

Self-contained — reads its own `config.yml`. If you separately use the `engineering-notes` skill and want a local Obsidian note for the new ticket, run `/engineering-notes <issueKey>` as a follow-up.

---

## Prerequisites

- Atlassian MCP installed and connected (`/mcp` should show `atlassian`).
- `~/.claude/skills/ticket-create/config.yml` in place (see Setup below).
- User running `/ticket-create` has Jira permission to create issues in the configured project.

---

## Setup

1. Copy the example:

   ```sh
   cp ~/.claude/skills/ticket-create/config.yml.example ~/.claude/skills/ticket-create/config.yml
   ```

2. The `jira.*` defaults (`ohanafy.atlassian.net`, `BMS`, browse URL) are already correct for the Anvil team — leave them alone unless you're on a different Jira cloud or project.

3. **`engineer.jira_account_id` is required.** It's the Atlassian account ID used as the reporter on every created ticket. Two ways to fill it in:

   - **Auto-resolve (recommended):** leave it as `""` in the config. On first `/ticket-create` run, the skill calls `mcp__atlassian__atlassianUserInfo`, prints your account ID, and asks you to paste it back into `config.yml` so subsequent runs don't re-resolve.
   - **Manual:** ask Claude to run `mcp__atlassian__atlassianUserInfo` once and paste the `account_id` into the config now.

   Without a valid `jira_account_id`, Jira issue creation will fail or assign the wrong reporter — so don't skip this.

---

## How the user invokes it

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

---

## Flow

### 1. Parse the message

- `summary` = text after `/ticket-create` up to the first newline, with any `--flag=...` tokens stripped.
- `context` = everything else in the message body (may be empty).
- `flags` = extracted `--type`, `--project`, `--labels` overrides.
- If `summary` is missing or empty, ask **one** question for a summary. Do not auto-generate it.

### 2. Load config

Read `~/.claude/skills/ticket-create/config.yml`:

- `jira.cloud_id` → Atlassian MCP `cloudId`
- `jira.project_key` → default project (overridable via `--project`)
- `jira.browse_url` → for the return link
- `engineer.jira_account_id` → reporter (if empty, resolve once via `mcp__atlassian__atlassianUserInfo` and note that the user should paste the result back into config.yml)

If the file is missing, point the user at `config.yml.example` and stop. If a required key is missing, name it explicitly and stop — do not prompt for values inline.

### 3. Draft the issue

**Title**: use `summary` verbatim if ≤100 chars. If longer, propose a trimmed version and show the original so the user can choose.

**Description**: preserve the paste verbatim. Structure:

```
## Context
<verbatim user paste, or the literal "Context TBD — edit in Jira." if empty>

---
Created via /ticket-create on <YYYY-MM-DD>
```

Do **not** rewrite or summarize the paste. Do **not** invent context when the paste is empty.

**Issue type**: default `Story`. Override with `--type` flag.

**Labels**: optional, from `--labels`.

### 4. Preview + confirm

Show the user a compact preview:

```
Draft ticket (not yet created):
  Project : BMS
  Type    : Story
  Title   : Harden RPV warehouse combobox against mid-open re-renders
  Labels  : (none)
  Body    : ## Context
            Playwright suite hit a flake on apr20TestOrg where...
            (truncated — full description below)
```

Then wait for an explicit confirmation ("yes" / "ok" / "create" / "ship it"). Do NOT auto-create on ambiguous responses.

### 5. Create the Jira issue

Call `mcp__atlassian__createJiraIssue`:

```json
{
  "cloudId": "<config.jira.cloud_id>",
  "projectKey": "<config.jira.project_key or --project override>",
  "issueTypeName": "<flags.type || 'Story'>",
  "summary": "<drafted title>",
  "description": "<drafted description, plain markdown>",
  "labels": ["<...flags.labels>"],
  "reporterAccountId": "<config.engineer.jira_account_id>"
}
```

Capture the returned `issueKey` (e.g. `BMS-3901`). If the MCP call fails, surface the error verbatim and stop — do not retry silently.

### 6. Report back to the user

Single concise message:

```
Created <issueKey>
  Jira: <browse_url>/<issueKey>
  Suggested branch: <type_prefix>/<issueKey>
  Next: /engineering-notes <issueKey> to scaffold a local note
```

Branch prefix mapping: `Story → story/`, `Bug → fix/`, `Task → chore/`, `Spike → spike/`.

---

## Guardrails

- **Never create without explicit confirmation.** Preview first, always.
- **Never invent context.** An empty paste means empty `## Context` — do not pull from conversation history to fill it in.
- **One ticket per invocation.** If the user pastes multiple distinct topics, ask which one to ticket or offer to split into N invocations. Do not batch-create.
- **Do not fetch URLs in the paste.** Treat URLs as references; fetching them risks pulling sensitive data into the Jira description.
- **Do not post Jira comments** or @-mention people as part of this flow. The ticket is created clean; the user can add watchers/comments manually.
- **Auto mode does not bypass the preview.** Even under auto mode, the creation step needs confirmation — tickets are shared state with blast radius beyond the local workspace.
