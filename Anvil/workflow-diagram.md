# Anvil Workflow

```mermaid
flowchart TD
    A[Manager / On-site Feedback] --> B[Draft Tickets]

    B --> C{Review & Approve}
    C -->|Needs Changes| B

    C -->|Approved| D[Push Tickets to Jira]

    D --> E[Created Tickets]

    E --> F[Engineering Notes]
    E --> G[Testing Notes]
    E --> H[Documentation]

    F --> I{Green Light}
    G --> I
    H --> I

    I -->|Push via MCP| J[Jira QA Tab]
    I -->|Push via MCP| K[Confluence]

    style A fill:#f9f,stroke:#333
    style C fill:#ff9,stroke:#333
    style D fill:#9f9,stroke:#333
    style I fill:#ff9,stroke:#333
    style J fill:#9f9,stroke:#333
    style K fill:#9f9,stroke:#333
```

## What This Solves

**Problem:** Work items went straight to Jira unstructured — no review, no consistency, no documentation trail.

**Solution:** A structured funnel where everything is drafted, reviewed, and approved in Obsidian before touching Jira/Confluence. The MCP tools are the bridge — they only fire after green light.

## The Funnel

| Stage                 | Where                            | Driver                                       | What Happens                                               |
| --------------------- | -------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **Intake**            | `Manager/On-site Feedback/`      | manual                                       | Raw stakeholder asks captured before ticketing             |
| **Draft**             | `Tickets/Drafts/`                | `/ticket-create` or `split-ticket-creator`   | Ticket written with story, AC, dependencies                |
| **Review**            | Obsidian                         | human                                        | Engineer reviews, adjusts, approves                        |
| **Push Tickets**      | MCP → Jira                       | `push it` / `promote`                        | Tickets created in Jira, get BMS numbers                   |
| **Create**            | `Tickets/Created Tickets/`       | ticket-create skill                          | Renamed with BMS number, Jira link added                   |
| **Engineering**       | `Engineering/`                   | `/engineering-notes`, `/start-ticket`        | Dev notes scaffolded; branch, PR, packages tracked         |
| **Testing**           | `Testing Notes/`                 | manual (QA)                                  | QA notes written referencing BMS tickets                   |
| **Documentation**     | `Documentation/`                 | manual                                       | Feature doc updated with BMS ticket references             |
| **Push Notes & Docs** | MCP → Jira / Confluence          | manual                                       | QA tab + release notes pushed                              |

## Key Rules

1. **Nothing goes to Jira raw** — always draft in Obsidian first
2. **Tickets are per-work-item** — one `.md` per ticket
3. **Engineering notes mirror the ticket** — one `.md` in `Engineering/` per ticket, kept in sync with branch/PR
4. **Documentation is per-feature** — one `.md` per Experience Cloud page or backend feature; tickets accumulate via the changelog
5. **Green light required** — MCP push only after explicit approval

## Ecom vs. Split

The same vault serves both projects:

- **OHFY-Ecom** tickets: drafted via `/ticket-create`, generic storefront context
- **OHFY-Split** tickets: drafted via `/ticket-create` or the `split-ticket-creator` agent (baked-in package/tier awareness for WMS, OMS, REX, Platform, and the Tier 0–4 deploy order)

Both write to the same `Tickets/Drafts/` directory and share the same template and numbering.
