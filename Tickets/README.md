# Tickets Vault

## Structure

```
Tickets/
  Tickets/            <- Jira ticket write-ups (story statement, AC, dependencies)
    BMS-XXXX.md
  Testing/            <- QA testing notes (copied into Jira QA tab)
    BMS-XXXX.md
  Documentation/      <- Feature docs (published to Confluence)
    BMS-XXXX.md
  Templates/          <- Reusable templates for each type
    ticket-template.md
    testing-template.md
    documentation-template.md
```

## Naming Convention

Every file is named `BMS-XXXX.md` — the Jira ticket number only. The ticket title lives inside the file, not the filename. This keeps filenames short and searchable.

## Linking

Each file has a `Related` section at the top linking to its counterparts:

```
## Related
- Ticket: [[BMS-XXXX]]
- Testing: [[BMS-XXXX]] (in Testing/)
- Docs: [[BMS-XXXX]] (in Documentation/)
```

Obsidian's backlinks will connect them automatically.

## Workflow

1. Ticket gets created → write `Tickets/BMS-XXXX.md`
2. Work begins → write `Testing/BMS-XXXX.md` before QA
3. Feature complete → write `Documentation/BMS-XXXX.md` if applicable
4. Copy testing notes into Jira QA tab
5. Publish docs to Confluence if needed
