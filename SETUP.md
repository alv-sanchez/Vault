# Setup — new users

One-time setup for this Obsidian vault.

The vault works on its own — clone it, open it in Obsidian, and use all the templates and example files manually. That's the only required step below.

The `/engineering-notes` Claude Code skill that ships alongside this vault is **optional** — it automates the per-ticket logbook by pulling Jira data, writing a file per ticket, and keeping it in sync with your branch/PR/commits. Its setup is documented separately so you can skip it for now and come back when you want the automation.

## Prerequisites

- [Obsidian](https://obsidian.md) installed.
- Git installed.

## 1. Clone the vault

```sh
git clone --branch share-branch https://github.com/alv-sanchez/Vault.git ~/Documents/Obsidian/Vault
```

Open the folder in Obsidian (Open folder as vault). The path can be anywhere.

> **Branch note:** `share-branch` is the canonical branch for teammates. `work-branch` is the owner's personal working branch and may be ahead of `share-branch` with in-progress changes.

## 2. (Optional) Set up the `engineering-notes` skill

If you want Claude to maintain a living dev log per ticket, follow the **Installing the skill** section in [`skills/engineering-notes/SKILL.md`](skills/engineering-notes/SKILL.md). It covers:

- Installing the Atlassian MCP plugin
- Copying the skill into `~/.claude/skills/`
- Configuring your identity (`config.yml`)
- Verifying with a test ticket

You can also skip all of this and just run `/engineering-notes BMS-XXXX` — the skill's first-run bootstrap will ask you the same questions interactively.

## What's in the vault

- `Anvil/Tickets/` — ticket drafts and created tickets
- `Anvil/Engineering/` — per-ticket dev working notes (the skill writes here)
- `Anvil/Testing Notes/` — QA notes
- `Anvil/Documentation/` — per-feature living docs
- `Anvil/Templates/` — source templates
- `Anvil/Manager/` — stakeholder feedback and planning
- `skills/engineering-notes/` — source for the optional Claude Code skill

See `Anvil/README.md` for the full workflow and `Anvil/workflow-diagram.md` for the visual flow.
