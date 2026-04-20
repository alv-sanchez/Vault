---
name: engineering-notes
description: Create and iterate on engineering ticket notes in the Obsidian Anvil/Engineering vault. Use when starting work on a Jira ticket, logging mid-flight progress, or wrapping up a ticket. Pulls live Jira data via the Atlassian MCP, writes/updates `BMS-XXXX-description.md` from the engineering template, and keeps frontmatter (status, branch, PR, packages_touched, updated date) in sync with the actual work happening in the repo.
---

# engineering-notes

Maintains per-ticket engineering notes in an Obsidian vault. The vault location and user identity are read from a config file so the skill is portable across machines/users.

Each ticket gets one file: `{project_key}-XXXX-short-description.md` under `{vault_path}/Anvil/Engineering/`. The file is created on first contact with a ticket and iterated on during and after the work — never recreated from scratch.

## Config

Read `~/.claude/skills/engineering-notes/config.yml` at the start of every invocation. Required keys:

- `vault_path` — absolute path to the Obsidian vault root
- `engineer.name`, `engineer.jira_account_id`, `engineer.email`
- `jira.cloud_id`, `jira.project_key`, `jira.browse_url`

All paths below are relative to `vault_path` (e.g. `Engineering/` = `{vault_path}/Anvil/Engineering/`). All ticket keys use `{project_key}` (default `BMS`).

### First-run bootstrap

If `config.yml` does not exist, run this questionnaire before doing anything else and write the answers to `config.yml`:

1. **Vault path** — absolute path to the Obsidian vault root (the dir containing `Anvil/`). Offer a sensible default based on `$HOME/Documents/Obsidian/Vault`.
2. **Engineer name** — display name for Working Notes (e.g. "Jane Doe").
3. **Email** — work email (must match Atlassian account).
4. **Jira account ID** — optional; if blank, fetch it on first Jira call via `mcp__atlassian__atlassianUserInfo` and save back to the config.
5. **Jira cloud ID** — default `ohanafy.atlassian.net`.
6. **Project key** — default `BMS`.
7. **Browse URL** — default `https://{cloud_id}/browse`.

Confirm the values back to the user before writing.

## When to invoke

- User explicitly says "/engineering-notes BMS-XXXX" or "log this on the ticket" or "wrap up the ticket"
- User starts work on a Jira ticket in a code repo (e.g. opens a feature branch named `feat/bms-XXXX-...`, references a BMS key, or asks for ticket scoping)
- User finalizes a chunk of work (commit, PR opened, deploy done) and there's a known active ticket
- User asks to capture decisions, surprises, or follow-ups tied to a ticket

If the ticket key is ambiguous, ask before writing.

## Mode of operation

There are three modes. Pick based on context.

### 1. Bootstrap (first time on a ticket)

When `{vault_path}/Anvil/Engineering/{project_key}-XXXX-*.md` does not exist:

1. Pull the issue with `mcp__atlassian__getJiraIssue` (cloudId from config, responseContentFormat: `markdown`, fields: `["summary","status","assignee","reporter","priority","issuetype","parent","description","labels","created","updated"]`).
2. Read the template at `{vault_path}/Anvil/Templates/engineering-template.md`.
3. Write a new file at `{vault_path}/Anvil/Engineering/{project_key}-XXXX-<kebab-summary>.md` populated with:
   - Frontmatter from Jira (ticket, title, type, status, priority, assignee, reporter, epic = parent.key, labels, jira URL from `jira.browse_url`, created = today, updated = today).
   - If the Jira issue has no assignee/reporter, default them to `engineer.name` from config.
   - `repo` = current git repo name (e.g. `OHFY-Split`).
   - `branch` = current git branch if it references the ticket; else blank.
   - `Story Statement` and `Why It Matters` filled from the Jira description (preserve markdown).
4. Confirm the file path back to the user.

### 2. Iterate (during work)

When the file exists and the user is mid-work:

1. Read the existing file — never overwrite.
2. Use `Edit` (not `Write`) to append/update only the affected sections:
   - Bump `updated:` in frontmatter to today's date.
   - Add a dated entry under `## Working Notes` if there's a decision/gotcha/direction change worth keeping.
   - Update `Files Changed` table when new files are touched.
   - Tick checkboxes under `Packages Touched`, `Testing`, `Deployment` as state advances.
   - Update `branch`, `pr`, `commits`, `deploy_status`, `started` (first time work begins), `status` when the underlying state changes.
3. Keep entries concise — a working-note entry is 1-3 lines, not a paragraph.
4. Do NOT pull from Jira every time. Only re-pull if the user explicitly asks to refresh metadata or if the ticket status is being closed out.

### 3. Finalize (end of ticket)

When the user signals the ticket is wrapping up ("finalized", "done", "closing out", "ticket end summary"):

1. Re-pull the Jira issue to capture final status/labels/sprint.
2. Update frontmatter: `status`, `completed: <today>`, `updated: <today>`, `pr`, `deploy_status`.
3. Fill in the `## End-of-Ticket Summary` section:
   - **What shipped** — 2-4 bullets of concrete delivered behavior.
   - **Deferred / follow-up** — anything punted, with linked follow-up ticket keys if known.
   - **Lessons / surprises** — one or two lines, only if non-obvious. Skip if nothing notable.
4. Confirm to the user.

## Frontmatter rules

- Dates are ISO `YYYY-MM-DD` (Obsidian renders as Date property).
- `labels`, `packages_touched`, `commits` are YAML lists.
- `packages_touched` values must come from the canonical list: `OHFY-Data-Model`, `OHFY-Utilities`, `OHFY-Service-Locator`, `OHFY-PLTFM`, `OHFY-OMS`, `OHFY-WMS`, `OHFY-REX`, `OHFY-PLTFM-UI`, `OHFY-OMS-UI`, `OHFY-WMS-UI`, `OHFY-REX-UI`.
- `deploy_status` is one of: `not-deployed`, `scratch`, `sandbox`, `uat`, `prod`.
- `status` mirrors Jira status verbatim (e.g. `To Do`, `In Progress`, `In Review`, `Done`).

## File naming

`{project_key}-XXXX-<kebab-summary>.md` — kebab-case the Jira summary, max ~6 words. Example: `BMS-3838-return-pre-visibility.md`. If multiple files for the same ticket would collide, prefer updating the existing one.

## Hard rules

- Never create a duplicate file for the same ticket. Search `{vault_path}/Anvil/Engineering/{project_key}-XXXX-*.md` before writing.
- Never overwrite the `Working Notes` log — append only.
- Never invent Jira fields. If a field is empty in Jira, leave the frontmatter key with no value rather than guessing.
- Don't write the `End-of-Ticket Summary` until the user signals finalization, even if the ticket looks done in Jira.
- Don't add narrative the user didn't say or that isn't in Jira. The notes are an honest log, not embellishment.

## Quick reference

| Trigger | Mode | Reads | Writes |
|---|---|---|---|
| `/engineering-notes BMS-XXXX` (file missing) | Bootstrap | Jira + template | New file |
| `/engineering-notes BMS-XXXX` (file exists) | Iterate | Existing file + git state | Edit sections |
| "wrap up BMS-XXXX" / "ticket end summary" | Finalize | Existing file + Jira | Edit summary + frontmatter |
