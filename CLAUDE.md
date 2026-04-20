# Claude context for this vault

This is the **Anvil** Obsidian vault — a structured workspace for drafting Jira tickets, logging engineering work, and maintaining living feature docs. It pairs with the `/engineering-notes` Claude Code skill, which keeps per-ticket notes in sync with the Jira ticket and the git branch the user is working on.

## First contact

- If the user is new to this vault, point them at `SETUP.md` — it covers cloning, installing the skill, configuring the Atlassian MCP, and setting their identity.
- If `~/.claude/skills/engineering-notes/config.yml` is missing, the skill runs a bootstrap questionnaire on first invocation. Don't invent defaults.

## Structure

- `Anvil/Tickets/` — drafts + created Jira tickets
- `Anvil/Engineering/` — per-ticket dev working notes (written by the skill, `BMS-XXXX-<summary>.md`)
- `Anvil/Testing Notes/` — QA notes per ticket
- `Anvil/Documentation/` — living feature docs (per-page, not per-ticket)
- `Anvil/Manager/` — stakeholder feedback and planning
- `Anvil/Templates/` — source templates the skill copies from
- `skills/engineering-notes/` — the skill source (for distributing to teammates)

## Rules

- Never put personal/private notes under version control. `Personal/` is gitignored.
- Never edit `Anvil/Engineering/BMS-XXXX-*.md` files by overwriting — the skill enforces append-only `Working Notes`. Use `Edit`, not `Write`.
- Never hardcode vault paths in tooling. Tools should read `~/.claude/skills/engineering-notes/config.yml`.
- Ticket keys are `{project_key}-XXXX` where `project_key` comes from the config (default `BMS`).
