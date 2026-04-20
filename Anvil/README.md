# Anvil — E-Commerce Workboard

## Structure

```
Anvil/
  Tickets/                          <- Jira ticket write-ups
    Drafts/                         <- Not yet created in Jira
      DRAFT-XXX-description.md
    Created Tickets/                <- Created in Jira, has BMS number
      BMS-XXXX-description.md
  Testing Notes/                    <- QA testing notes (copied into Jira QA tab)
    BMS-XXXX.md
  Documentation/                    <- Living docs per Experience Cloud page/feature
    home-page.md                      (not per ticket — tickets accumulate here)
    shop-page.md
    registration.md
    ...
  Templates/                        <- Reusable templates for each type
    ticket-template.md
    testing-template.md
    documentation-template.md
```

## Naming Convention

- **Drafts**: `DRAFT-XXX-short-description.md` — no Jira ticket yet
- **Created Tickets**: `BMS-XXXX-short-description.md` — has a Jira ticket number
- **Testing Notes**: `BMS-XXXX.md` — ticket number only
- **Documentation**: `feature-name.md` — one file per Experience Cloud page or backend service

## Linking

Tickets and testing notes link to their counterparts:

```
## Related
- Ticket: [[BMS-XXXX-description]] (in Tickets/Created Tickets/)
- Testing: [[BMS-XXXX]] (in Testing Notes/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-XXXX
```

Documentation files link to the tickets that touch them via `## Related Tickets` and track changes in a `## Changelog` table at the bottom.

Obsidian backlinks connect everything automatically.

## Workflow

See [[workflow-diagram]] for the visual flowchart.

### 1. Draft Tickets
1. **Draft ticket** written to `Tickets/Drafts/DRAFT-XXX-description.md`
2. **Review + approve** the draft in Obsidian

### 2. Push Tickets to Jira (First)
3. **Create in Jira** via Atlassian MCP tools — get BMS numbers
4. **Move to Created Tickets** and rename `BMS-XXXX-description.md` with Jira link

### 3. Testing Notes & Documentation
5. **Write testing notes** to `Testing Notes/BMS-XXXX-description.md` referencing real BMS tickets
6. **Update documentation** — find the relevant page doc in `Documentation/` (e.g., `shop-page.md`), add ticket to `## Related Tickets`, update features, add row to `## Changelog`

### 4. Push Notes & Docs
7. **Push testing notes** to Jira QA tab via MCP
8. **Push documentation** to Confluence release notes pages via MCP

### Key Rule
- **Tickets** are per-work-item (one ticket = one `.md` in `Tickets/`)
- **Documentation** is per-experience (one page = one `.md` in `Documentation/`)
- When a new ticket lands, update the existing page doc — don't create a new one

## Example Files

Each folder has one example file (`BMS-0000-example-feature.*`) showing the pattern end-to-end for a fictitious "Example Feature" ticket. See:

- `Tickets/Drafts/DRAFT-002-example-bulk-upload.md` — a pre-Jira draft
- `Tickets/Created Tickets/BMS-0000-example-feature.md` — a ticket already pushed to Jira
- `Testing Notes/BMS-0000-example-feature.md` — QA notes tied to the same ticket
- `Documentation/example-feature.md` — the living doc the ticket updates
- `Engineering/BMS-0000-example-feature.md` — the dev-side working notes
- `Manager/On-site Feedback/example-stakeholder-request.md` — the stakeholder ask that seeded the ticket

Delete the examples once your team is comfortable with the workflow — or keep them as a reference.