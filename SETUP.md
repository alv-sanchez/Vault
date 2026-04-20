# Setup — new users

One-time setup for this Obsidian vault.

The vault works on its own — clone it, open it in Obsidian, and you can use all the templates and example files manually (steps **1** and **optionally 6**).

The `/engineering-notes` Claude Code skill (steps **2–5**) is **optional**. It automates the per-ticket logbook — pulling Jira data, writing a file per ticket, and keeping it in sync with your branch/PR/commits. Skip these steps if you just want the vault; come back later if you want automation.

## What `engineering-notes` does (optional)

It's a Claude Code skill that keeps a markdown file in this vault in sync with your work on a Jira ticket — an automated engineering logbook.

For every ticket you work on, it creates and maintains a single file at:

```
<vault>/Anvil/Engineering/BMS-XXXX-<summary>.md
```

The file has YAML frontmatter (ticket metadata) and structured sections: story, working notes, files changed, testing, deployment, end-of-ticket summary. Claude updates it as you work, so by the end of the ticket you have a complete dev record.

### Three modes

| When | What happens |
|---|---|
| **Bootstrap** — first time you mention a ticket | Pulls the ticket from Jira via MCP, reads the template, writes a new `BMS-XXXX-*.md` with frontmatter filled from Jira + your current git repo/branch |
| **Iterate** — while you're working | Appends dated entries to `## Working Notes`, updates the `Files Changed` table, ticks off `Packages Touched` / `Testing` / `Deployment`, bumps `updated:`, updates `branch`/`pr`/`commits` as state changes. Append-only — never overwrites |
| **Finalize** — when you say "wrap up" | Re-pulls Jira for final status, fills in the `End-of-Ticket Summary` (what shipped, deferred work, lessons) |

### When Claude invokes it

- You say `/engineering-notes BMS-1234` or "log this on the ticket"
- You start work on a feature branch that references a BMS key
- You open a PR, finish a deploy, or hit a decision worth capturing
- You say "wrap up BMS-1234"

### Guardrails

- Never creates a duplicate file for the same ticket — searches for existing `BMS-XXXX-*.md` first
- Never overwrites `Working Notes` — append-only
- Never invents Jira data — empty field in Jira = empty field in the note
- Doesn't write the end-of-ticket summary until you explicitly finalize

---

## Prerequisites

**Required** (to use the vault at all):
- [Obsidian](https://obsidian.md) installed (for browsing the vault).
- Git installed (to clone).

**Required only for the optional skill (steps 2–5):**
- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed and signed in.
- An Atlassian (Jira) account on the team's cloud (`ohanafy.atlassian.net`).

## 1. Clone the vault

```sh
git clone --branch share-branch https://github.com/alv-sanchez/Vault.git ~/Documents/Obsidian/Vault
```

Open the folder in Obsidian (Open folder as vault). The path can be anywhere — you'll tell the skill where it lives in step 4.

> **Branch note:** `share-branch` is the canonical branch for teammates. `work-branch` is the owner's personal working branch and may be ahead of `share-branch` with in-progress changes.

## 2. Install the Atlassian MCP (optional — for the skill)

The skill reads and updates Jira tickets through the official Atlassian MCP plugin. Install it once per machine:

```sh
claude plugin install atlassian@claude-plugins-official
```

Then restart Claude Code. The first Jira call will open a browser window to authorize the plugin against your Atlassian account — approve access for `ohanafy.atlassian.net`.

Verify it's connected:

```
/mcp
```

You should see `atlassian` listed as connected. (If not, run `claude plugin list` to confirm the plugin is installed, and re-run the auth flow with `/mcp` → atlassian → connect.)

## 3. Install the `engineering-notes` skill (optional)

The skill source lives in this vault at `skills/engineering-notes/`. Copy it into Claude's user-skill directory:

```sh
mkdir -p ~/.claude/skills/engineering-notes
cp ~/Documents/Obsidian/Vault/skills/engineering-notes/SKILL.md ~/.claude/skills/engineering-notes/
cp ~/Documents/Obsidian/Vault/skills/engineering-notes/config.yml.example ~/.claude/skills/engineering-notes/
```

(Adjust the source path if you cloned the vault somewhere other than `~/Documents/Obsidian/Vault`.)

## 4. Configure your identity (optional)

Copy the example config and fill in your values:

```sh
cp ~/.claude/skills/engineering-notes/config.yml.example ~/.claude/skills/engineering-notes/config.yml
```

Open `config.yml` and set:

- `vault_path` — absolute path to where you cloned the vault (the folder containing `Anvil/`).
- `engineer.name` — how you want to be credited in working notes.
- `engineer.email` — your Atlassian account email.
- `engineer.jira_account_id` — optional; the skill will fetch and fill this on first use if left blank.

Jira defaults (`cloud_id: ohanafy.atlassian.net`, `project_key: BMS`) are correct for the Anvil team — leave them unless you're running this against a different Jira.

> `config.yml` is gitignored. Your identity never gets committed.

### Or: let Claude ask you

If you skip step 4 and just run `/engineering-notes BMS-XXXX`, the skill will detect the missing config and walk you through the same questions interactively, then write `config.yml` for you.

## 5. Verify the skill (optional)

From any terminal, launch Claude Code and ask:

> /engineering-notes BMS-XXXX

where `BMS-XXXX` is a ticket assigned to you. You should see a new file created at `Anvil/Engineering/BMS-XXXX-<summary>.md` with your name in the frontmatter.

If the Jira call fails, double-check step 2 (MCP connected and authorized against `ohanafy.atlassian.net`).

## What's in the vault

- `Anvil/Tickets/` — ticket drafts and created tickets
- `Anvil/Engineering/` — per-ticket dev working notes (this skill writes here)
- `Anvil/Testing Notes/` — QA notes
- `Anvil/Documentation/` — per-feature living docs
- `Anvil/Templates/` — source templates the skill copies from
- `Anvil/Manager/` — stakeholder feedback and planning
- `skills/engineering-notes/` — source for the Claude Code skill (distributed with the vault)

See `Anvil/README.md` for the full workflow and `Anvil/workflow-diagram.md` for the visual flow.
