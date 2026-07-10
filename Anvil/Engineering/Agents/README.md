# Agents Context Bucket

Shared filesystem context for the BMS-4995 orchestration (and future agent fleets).
Worktrees stay isolated for *code*; this bucket is the only sanctioned cross-agent
communication channel, mediated by convention rather than the orchestrator alone.

## Layout

```
Agents/
  README.md                 ← this file (conventions)
  _shared/                  ← cross-cutting facts any agent may need
    orgs.md                 ← claimed org aliases, instance URLs, test users, setup state
    contracts.md            ← interfaces agreed BETWEEN tickets (e.g. ProductCardDTO shape
                              that BMS-4054 consumes from BMS-4053) — write before build
    blockers.md             ← live escalations awaiting Alvaro (agents append, Alvaro answers inline)
    org-issues.md           ← shared org troubleshooting log: symptom/cause/fix entries.
                              CHECK FIRST when blocked on anything org-shaped; APPEND
                              immediately when you solve an org problem
  <Domain>/                 ← one folder per domain lane
    _lane.md                ← lane index: org alias, lane status, ticket execution order
    BMS-XXXX.md             ← one file per ticket worker (see template below)

  Cart-and-Checkout/        (ecom-cart):    BMS-4050 → 4051 → 4052
  Catalog-and-Discovery/    (ecom-catalog): BMS-4053 → 4054 → 3927 → 3925
  Account-and-Registration/ (ecom-account): BMS-3932 → 4258
  Credit-AR/                (ecom-credit):  BMS-4525
```

Workers keep `_lane.md` current: flip its Status (not started → org claimed → ticket N
in progress → done) as the lane progresses.

## Rules

1. **Own file only**: a worker WRITES only to its own `BMS-XXXX.md` (and appends to
   `_shared/` files). It may READ any file in the bucket.
2. **Append, don't rewrite**: status entries and decisions are append-only logs with
   timestamps. Never delete another agent's content.
3. **Cross-ticket needs go through `_shared/contracts.md`**: if your ticket produces
   something another ticket consumes (a DTO, a component API, a perm set), write the
   contract there BEFORE building it, and read it before consuming.
4. **Escalations**: per the ambiguity policy, only coin-flips escalate. Append to
   `_shared/blockers.md` with ticket key + question + what you're doing meanwhile; park
   only the affected slice, keep building the rest.
5. **The orchestrator** reads all files to build the run report; humans (Alvaro) read this
   bucket in Obsidian — write prose, not raw JSON dumps.

## Per-ticket file template

```markdown
# BMS-XXXX — <title>

> **Domain**: <domain> · **Org alias**: `<alias>` · **Branch**: `BMS-XXXX-<slug>`
> **Worktree**: <absolute path — the worker fills this in as its FIRST action on start>

## Scope report           ← seeded by the Scope phase, updated by the worker
## Status log             ← append-only: timestamped progress entries
## Decisions              ← ambiguity policy paragraph (b): decision + rationale + evidence
## Escalations            ← mirror of anything sent to _shared/blockers.md, with resolution
## Done evidence          ← /ecom-done Gate 5 block, PR link
```
