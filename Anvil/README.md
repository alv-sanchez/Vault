# Anvil — Ticket Workboard

Shared vault for ticket, engineering, testing, and documentation notes across **OHFY-Ecom** (Experience Cloud storefront) and **OHFY-Split** (the managed-package mono-repo: WMS, OMS, REX, Platform). Everything is drafted here first; Jira and Confluence are only touched via MCP after explicit approval.

## Structure

```
Anvil/
  Tickets/                          <- Jira ticket write-ups
    Drafts/                         <- Not yet created in Jira
      DRAFT-XXX-description.md
    Created Tickets/                <- Created in Jira, has BMS number
      BMS-XXXX-description.md
  Engineering/                      <- Dev-side working notes per ticket
    BMS-XXXX-description.md
  Testing Notes/                    <- QA testing notes (copied into Jira QA tab)
    BMS-XXXX.md
  Documentation/                    <- Living docs per Experience Cloud page / feature
    home-page.md                      (not per ticket — tickets accumulate here)
    shop-page.md
    registration.md
    ...
  Manager/                          <- Stakeholder intake
    On-site Feedback/
      <stakeholder-request>.md
  Templates/                        <- Reusable templates for each type
    ticket-template.md
    engineering-template.md
    testing-template.md
    documentation-template.md
    manager-template.md
```

## Naming Convention

- **Drafts**: `DRAFT-XXX-short-description.md` — no Jira ticket yet
- **Created Tickets**: `BMS-XXXX-short-description.md` — has a Jira ticket number
- **Engineering notes**: `BMS-XXXX-short-description.md` — dev notes mirror the ticket filename
- **Testing Notes**: `BMS-XXXX.md` — ticket number only
- **Documentation**: `feature-name.md` — one file per Experience Cloud page or backend feature
- **Manager / On-site Feedback**: `<kebab-stakeholder-request>.md` — raw ask, no ticket number

## Linking

Tickets, engineering notes, and testing notes cross-link:

```
## Related
- Ticket: [[BMS-XXXX-description]] (in Tickets/Created Tickets/)
- Engineering: [[BMS-XXXX-description]] (in Engineering/)
- Testing: [[BMS-XXXX]] (in Testing Notes/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-XXXX
```

Documentation files link to the tickets that touch them via `## Related Tickets` and track changes in a `## Changelog` table at the bottom.

Obsidian backlinks connect everything automatically.

## Workflow

See [[workflow-diagram]] for the visual flowchart.

### 0. Intake
Stakeholder asks, Slack threads, and meeting notes land in `Manager/On-site Feedback/` as raw requests before they become tickets.

### 1. Draft Tickets
1. Draft ticket written to `Tickets/Drafts/DRAFT-XXX-description.md`
2. Review + approve the draft in Obsidian

### 2. Push Tickets to Jira
3. Create in Jira via Atlassian MCP — get BMS numbers
4. Move to `Created Tickets/` and rename `BMS-XXXX-description.md`; frontmatter + first heading get the real Jira key

### 3. Engineering, Testing & Documentation
5. Engineering note scaffolded in `Engineering/BMS-XXXX-description.md` when work starts; kept in sync with branch, PR, and packages touched
6. Testing notes written to `Testing Notes/BMS-XXXX.md` once behavior is stable
7. Documentation updated — find the relevant page doc in `Documentation/`, add the ticket to `## Related Tickets`, update features, add a row to `## Changelog`

### 4. Push Notes & Docs
8. Testing notes pushed to Jira QA tab via MCP
9. Documentation pushed to Confluence release-notes pages via MCP

### Key Rules
- **Tickets** are per-work-item (one ticket = one `.md` in `Tickets/`)
- **Engineering notes** are per-ticket (one `.md` in `Engineering/` mirroring the ticket filename)
- **Documentation** is per-experience (one page = one `.md` in `Documentation/`) — when a new ticket lands, update the existing page doc, don't create a new one
- **Nothing goes to Jira raw** — always draft in Obsidian first

## How it's invoked

| Skill / Agent | Where | What it does |
|---|---|---|
| `/ticket-create` (skill) | any repo | Drafts a ticket to `Tickets/Drafts/`. Never touches Jira on first invocation. `push it` promotes to `Created Tickets/`. |
| `split-ticket-creator` (agent) | OHFY-Split | Same draft-first behavior, with OHFY-Split package/tier context baked in. Use when a Split ticket needs domain scoping. |
| `/engineering-notes` (skill) | any repo | Scaffolds or updates `Engineering/BMS-XXXX-description.md` from the engineering template using live Jira data. |
| `/start-ticket` / `/end-ticket` (skills) | any repo | Starts/stops the ticket timer, handles Jira transitions, and logs time — hook-driven, project-local. |
| `/polish` (skill) | any repo | Validates an existing Jira ticket against the codebase before refinement. Does not modify the vault. |

## Example Files

Each folder has one example file showing the pattern end-to-end for a fictitious "Example Feature" ticket:

- `Tickets/Drafts/DRAFT-002-example-bulk-upload.md` — a pre-Jira draft
- `Tickets/Created Tickets/BMS-0000-example-feature.md` — a ticket already pushed to Jira
- `Engineering/BMS-0000-example-feature.md` — the dev-side working notes
- `Testing Notes/BMS-0000-example-feature.md` — QA notes tied to the same ticket
- `Documentation/example-feature.md` — the living doc the ticket updates
- `Manager/On-site Feedback/example-stakeholder-request.md` — the stakeholder ask that seeded the ticket

Delete the examples once your team is comfortable with the workflow — or keep them as a reference.
