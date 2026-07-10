# Claude Code Review — Research, Consultation & Proposal

**Date:** 2026-06-04
**Repo:** Ohanafy/OHFY-Split (Salesforce DX mono-repo, 11 2GP packages)
**Author:** Alvaro Sanchez (with Claude Code research assist)
**Verified:** Fact-checked against official Anthropic docs, `claude-code-action` source (`action.yml` + README), and API pricing pages.

---

## Table of Contents

1. [Current State: What We Have Today](#1-current-state-what-we-have-today)
2. [Gap Analysis: `/audit-pull-request` vs Claude Code Review](#2-gap-analysis-audit-pull-request-vs-claude-code-review)
3. [Implementation Options](#3-implementation-options)
4. [Cost Comparison](#4-cost-comparison)
5. [Salesforce-Specific Use Cases & Consultation](#5-salesforce-specific-use-cases--consultation)
6. [Recommendation & Proposal](#6-recommendation--proposal)
7. [Implementation Plan](#7-implementation-plan)
8. [Appendix: Sources](#8-appendix-sources)

---

## 1. Current State: What We Have Today

### Quality Gates Already in Place

| Layer | What It Catches | Automated? |
|-------|----------------|------------|
| **Pre-commit hooks** (Husky + lint-staged) | Prettier formatting, ESLint on Aura/LWC JS, Jest on changed LWC files | Yes (local) |
| **CI pipeline** (`ci.yml` — 6 jobs) | Prettier verify, Jest unit tests, hex-lint (ESLint + stylelint + Node), sfdx-git-delta deploy, Apex tests (smart selection), Playwright E2E | Yes (GitHub Actions) |
| **PR cleanup** (`pr-cleanup.yml`) | Org release on PR close | Yes (GitHub Actions) |
| **Manual review** | Human engineer reads the diff, checks ACs, domain logic | No — manual |
| **`/audit-pull-request`** (PR #243) | AI-assisted audit via Claude Code slash command, posts findings as PR comment | No — manually triggered per-PR |
| **`/code-review`** (built-in) | Claude Code's built-in review, inline PR comments with severity | No — manually triggered |
| **`/set-risk`** | Risk assessment on Jira ticket from branch diff | No — manually triggered |
| **`/polish`** | Pre-refinement ticket validation against codebase | No — manually triggered |

### The `/audit-pull-request` Skill (PR #243)

A 126-line Claude Code command that fetches a PR diff via `gh` CLI and audits across **6 dimensions**, posting a single structured comment:

| Dimension | What It Checks |
|-----------|---------------|
| **Bugs & Runtime Errors** | SOQL/DML in loops, null derefs, divide-by-zero, index OOB, race conditions, missing `break`, Map key overwrites, async/sync mismatches |
| **Silent Failures** | Async Apex without error handling, empty catches, over-broad catches, partial-success DML unchecked, Queueable without Finalizer, LWC promises without `.catch()`, logged-but-not-surfaced errors |
| **Conditional Logic & Dead Branches** | Constant conditions, identical branches, unreachable branches, silent skips, redundant nested conditions |
| **Dead Code** | Commented-out blocks, unreachable code, unused vars/params/imports |
| **Debug Statements** | `System.debug()`, `console.log/warn/error` left in production |
| **Naming Conventions** | Apex PascalCase/camelCase, LWC camelCase, metadata label-to-API-name matching, `UPPER_SNAKE_CASE` constants |

**Output:** Single PR comment with `[BLOCKER]` / `[WARNING]` / `[SUGGESTION]` severity labels.

---

## 2. Gap Analysis: `/audit-pull-request` vs Claude Code Review

### What `/audit-pull-request` Covers Well

- Salesforce-specific governor limit violations (SOQL/DML in loops)
- Ohanafy-specific patterns (Queueable + Finalizer, partial-success DML inspection)
- Naming convention enforcement tuned to our metadata patterns
- Silent failure detection in async Apex — genuinely useful, catches real bugs

### What `/audit-pull-request` Misses

These are areas that Claude Code review capabilities cover that our custom skill does not. **Important:** not all features are available in all delivery mechanisms — the table specifies which product provides each.

| Gap | Why It Matters | Available In |
|-----|---------------|-------------|
| **Security analysis** | No checks for SOQL injection, XSS in LWC (`lwc:dom="manual"` + unsanitized HTML), CRUD/FLS enforcement, exposed `@AuraEnabled` without permission checks, hardcoded credentials/tokens | All approaches (CLAUDE.md-aware) |
| **Performance beyond governor limits** | No checks for: excessive re-renders in LWC (reactive property thrashing), large payload `@AuraEnabled` returns, unbounded list growth, missing `LIMIT` on SOQL, inefficient `for` loop patterns (e.g., nested list iteration that should be a Map lookup) | All approaches (CLAUDE.md-aware) |
| **CLAUDE.md / project convention compliance** | The skill doesn't know about our `QueryService`/`DmlService` mandate, `AccessLevelResolver` rules, Logger-in-catch requirement, DTO pattern (ADR-0007), `_T` test conventions, or `org-metadata/` prefix rules | All approaches (reads CLAUDE.md). REVIEW.md only read by Managed Code Review and `code-review` plugin. |
| **Test coverage assessment** | No check for whether new/changed methods have corresponding `_T` test coverage, or whether test assertions are meaningful vs. trivial | All approaches |
| **Cross-file regression detection** | The skill only reads the diff — it doesn't load the full codebase context to detect if a change breaks callers, violates an interface contract, or creates a subtle regression | Best with `code-review` plugin or Managed Code Review (multi-agent). Ad-hoc agent may not read enough files depending on turn budget. |
| **Inline PR comments on specific lines** | Posts one monolithic comment; reviewer must manually find the referenced `file:line` | All approaches |
| **Multi-agent verification & dedup** | No verification step — every finding is posted regardless of confidence | **Managed Code Review and `code-review` plugin only.** The ad-hoc agent prompt approach does NOT run finder/verifier/deduplicator agents. |
| **Feedback loop (thumbs-up/down)** | No mechanism to learn from incorrect findings | **Managed Code Review and `code-review` plugin only.** Anthropic collects reaction data to tune the reviewer. Ad-hoc agent does not provide feedback buttons. |
| **LWC accessibility** | No checks for `aria-*` attributes, keyboard navigation, color contrast in Tailwind classes | A blind spot in both — but full-context review is more likely to catch |

### Overlap (both cover these)

- Bugs & runtime errors (null derefs, governor limits)
- Dead code / debug statements
- Basic naming conventions

### Verdict

The `/audit-pull-request` skill is a **good Salesforce-specific linter** — it catches governor limit violations and async error handling gaps that generic reviewers miss. But it's a **surface-level audit**, not a code review. It doesn't understand project conventions, can't detect cross-file regressions, and lacks security/performance/test-coverage analysis. The two approaches are complementary, not competing.

---

## 3. Implementation Options

### Option A: Manual — Per-Developer Claude Code Review

**How it works:** Each developer runs `/code-review --comment` (or `/audit-pull-request`) from their local Claude Code session before requesting human review.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Manual — developer remembers to run it |
| **Cost model** | Included in Max subscription ($100/mo per seat) for interactive use |
| **Latency** | ~2-5 min per review in-terminal |
| **Coverage** | Inconsistent — depends on who remembers |
| **Inline comments** | Yes, with `--comment` flag |
| **Blocking merges** | No — advisory only |
| **Maintenance** | Zero — uses built-in skill |

**Limitations:**
- Anthropic ToS prohibits using Max subscription for automated/scripted/CI usage (API key required for CI)
- Not every PR gets reviewed — human forgetfulness
- No audit trail of which PRs were reviewed
- Each dev burns their own context window + tokens

---

### Option B: CI/CD — GitHub Actions with Anthropic API

**How it works:** A GitHub Actions workflow triggers Claude Code on every PR (or on specific events), using an Anthropic API key. Reviews are posted as inline PR comments automatically.

There are **two sub-approaches** with very different quality and cost profiles:

#### B1: Ad-Hoc Agent Prompt (cheaper, shallower)

Runs Claude Code as a general-purpose agent with a review-flavored prompt. No multi-agent pipeline — just Claude reading the diff and CLAUDE.md, making tool calls to inspect files, and posting its findings.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Automatic — on PR open, push, or `@claude` comment |
| **Cost model** | API token billing (~$2-4 per review, see Section 4) |
| **Latency** | ~5-15 min |
| **Quality** | Moderate — single agent, no verification pass, no dedup |
| **Inline comments** | Yes |
| **Blocking merges** | No built-in mechanism |
| **Reads** | CLAUDE.md (not REVIEW.md) |

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
  pull_request_review_comment:
    types: [created]
  issue_comment:
    types: [created]

jobs:
  review:
    if: |
      (github.event_name == 'pull_request' && !github.event.pull_request.draft) ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR for correctness bugs, security issues, 
            performance problems, and convention violations per CLAUDE.md.
            Focus on Salesforce-specific patterns: governor limits, 
            QueryService/DmlService usage, Logger-in-catch, DTO pattern.
          claude_args: "--max-turns 10 --model claude-sonnet-4-6"
```

#### B2: Code-Review Plugin (higher quality, higher cost)

Uses the official `code-review@claude-code-plugins` plugin, which brings the multi-agent finder/verifier/deduplicator pipeline into the GitHub Action. Comparable quality to Managed Code Review.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Automatic — on PR open, push, or `@claude` comment |
| **Cost model** | API token billing (~$10-20 per review, see Section 4) |
| **Latency** | ~15-25 min |
| **Quality** | High — multi-agent verification, confidence thresholds, dedup |
| **Inline comments** | Yes — with severity labels |
| **Blocking merges** | Check-run severity JSON can be parsed for branch protection |
| **Reads** | CLAUDE.md + REVIEW.md |

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
  pull_request_review_comment:
    types: [created]
  issue_comment:
    types: [created]

jobs:
  review:
    if: |
      (github.event_name == 'pull_request' && !github.event.pull_request.draft) ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: "--model claude-sonnet-4-6"
```

---

### Option C: Managed Code Review (Team/Enterprise Plan)

**How it works:** Anthropic's hosted review service, configured via `claude.ai/admin-settings`. No GitHub Action needed — it connects directly to your GitHub org.

| Aspect | Detail |
|--------|--------|
| **Trigger** | Configurable: once per PR, per push, or manual (`@claude review`) |
| **Cost model** | Token-based billing (~$15-25 per review avg) |
| **Latency** | ~20 min average |
| **Coverage** | 100% of PRs if set to auto-trigger |
| **Inline comments** | Yes — with thumbs-up/down feedback buttons |
| **Blocking merges** | Neutral check run (doesn't block by default; can parse severity JSON) |
| **Reads** | CLAUDE.md + REVIEW.md |
| **Maintenance** | Minimal — admin toggle + REVIEW.md |

**Requires:** Claude Team or Enterprise subscription.

---

### Option D: Hybrid — CI/CD + Manual Deep Dives

**How it works:** CI/CD runs an automated review on every PR (Option B2 or C). Developers supplement with manual `/code-review` or `/audit-pull-request` for complex changes.

This is the recommended approach — see Section 6.

---

## 4. Cost Comparison

### Model Pricing (Current 2026 Rates)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|----------------------|----------|
| Haiku 4.5 | $1.00 | $5.00 | Fast triage, simple checks |
| **Sonnet 4.6** | **$3.00** | **$15.00** | **Balanced reviews (recommended for CI/CD)** |
| Opus 4.7/4.8 | $5.00 | $25.00 | Deep reasoning, complex analysis |

**Opus tokenizer note:** Opus 4.7+ uses a new tokenizer that generates up to 35% more tokens for the same input text. Per-token prices are unchanged, but effective cost per review is ~35% higher than the table implies.

### Estimated Cost Per Review

`claude-code-action` runs Claude Code as a **multi-turn agent**, not a single API call. Each turn re-sends the growing conversation context plus tool calls (git diff, file reads, etc.). Token usage compounds across turns. These estimates account for that.

Based on a typical OHFY-Split PR (3-15 changed files, 100-500 lines changed, Apex + LWC + metadata):

| Approach | Small PR (1-3 files) | Medium PR (5-10 files) | Large PR (15+ files) |
|----------|---------------------|----------------------|---------------------|
| **B1: Ad-hoc agent** (Sonnet) | ~$0.50-1.50 | ~$1.50-4.00 | ~$3.00-8.00 |
| **B2: Code-review plugin** (Sonnet) | ~$8-15 | ~$10-20 | ~$15-30 |
| **C: Managed Code Review** | ~$10-15 | ~$15-25 | ~$20-35 |

Exact cost depends on: number of turns, files read, CLAUDE.md size (ours is large), and model. **Run 5-10 reviews and check the API usage dashboard before committing to a budget.**

### Monthly Cost Projections

Assumptions: ~40 PRs/month (team of 5-6 engineers, ~8 PRs each)

| Approach | Cost/Review (avg) | Monthly Cost | Annual Cost | Notes |
|----------|-------------------|-------------|-------------|-------|
| **Manual (Max sub)** | $0 marginal | $100/seat x N | $6,000-7,200 (5-6 seats) | Already paying this; reviews included but inconsistent |
| **B1: Ad-hoc agent** (Sonnet) | ~$2-4 | ~$80-160 | ~$960-1,920 | Cheapest automated; moderate quality |
| **B2: Code-review plugin** (Sonnet) | ~$10-20 | ~$400-800 | ~$4,800-9,600 | Multi-agent pipeline; high quality |
| **C: Managed Code Review** | ~$15-25 | ~$600-1,000 | ~$7,200-12,000 | Requires Team/Enterprise plan |
| **Hybrid: B2 + Manual deep dives** | ~$10-20 auto + $0 manual | ~$400-800 + subs | ~$4,800-9,600 + subs | Best quality; validate cost with pilot |

### Cost Optimization Levers

| Lever | Savings | How |
|-------|---------|-----|
| `--max-turns 5-10` | 30-50% | Caps iteration depth in GitHub Action |
| Trigger only on `ready_for_review` | 50%+ vs per-push | Skip draft PR pushes |
| REVIEW.md / CLAUDE.md skip rules | 10-30% | Exclude generated files, lockfiles, metadata XML boilerplate. REVIEW.md only applies to B2 plugin and Managed Code Review; for B1, put skip rules in CLAUDE.md or the `prompt:` input. |
| Start with B1, upgrade to B2 later | Variable | Get cost data before committing to higher tier |

**Levers that do NOT apply:**
- **Prompt caching across runs:** Cache TTL is 5 minutes. Separate GitHub Actions runs are always >5 min apart. Cache will be cold on every review. (Within a single multi-turn run, caching is automatic — not a lever you pull.)
- **Batch API:** No evidence `claude-code-action` supports the Batch API. It's a raw Messages API feature for fire-and-forget workloads — you can't run an interactive agent through it.

---

## 5. Salesforce-Specific Use Cases & Consultation

Beyond basic code review, here are areas where Claude Code review can add value to the OHFY-Split codebase — patterns and risks that our current CI pipeline and `/audit-pull-request` skill do not catch.

**Detection confidence varies by approach.** With B2 (code-review plugin) or Managed Code Review, the multi-agent pipeline reads more files and verifies findings — detection likelihood is high for all use cases below. With B1 (ad-hoc agent, `--max-turns 10`), the agent may run out of turns before inspecting all relevant files, especially for cross-file patterns like DTO compliance and ServiceLocator contracts. Validate with real PRs during the pilot.

### High-Value Use Cases

#### 1. QueryService / DmlService Compliance Enforcement
**Problem:** CLAUDE.md mandates all SOQL/DML go through `QueryService` and `DmlService` (BMS-3965). CI doesn't enforce this — it's a manual grep check in the pre-PR checklist.
**What review can catch:** Raw `[SELECT ...]`, `Database.insert/update`, and inline DML in non-`_T` classes. With CLAUDE.md loaded, it flags these as convention violations.
**Impact:** Prevents security regression (bypassed `AccessLevelResolver`).

#### 2. Logger-in-Catch Compliance
**Problem:** Every `catch` block must instrument via `Logger.getInstance().error() + flush()` (BMS-4298). No automated enforcement.
**What review can catch:** Catch blocks missing Logger calls, catches that only `System.debug`, catches that flush before logging. It knows the exact two-line pattern from CLAUDE.md.
**Impact:** Prevents silent production failures from going undetected in Datadog.

#### 3. SYSTEM_MODE Audit
**Problem:** Explicit `AccessLevel.SYSTEM_MODE` requires an inline comment citing rule 1/2/3/4/6 from `docs/security/mode-selection.md`. Rule 5 citations are invalid. No automated check.
**What review can catch:** SYSTEM_MODE without comment, wrong rule cited, rule 5 citations.
**Impact:** Security compliance — prevents unauthorized privilege escalation.

#### 4. DTO Pattern (ADR-0007) Compliance
**Problem:** Cross-package LWC-serializable types must be `global` DTOs with `{ get; set; }` accessors, parameterless constructors, and live in `DTOs/<domain>/`. Violation = silent all-null properties at runtime across package boundaries.
**What review can catch:** Missing `{ get; set; }`, non-global DTOs used in `@AuraEnabled` returns, parameterized global constructors (permanent API contract leak).
**Impact:** Prevents a class of runtime bugs that are invisible in unit tests but break in managed package installs.

#### 5. Org-Metadata Namespace Prefix Drift
**Problem:** `org-metadata/managed/` uses `ohfy__` prefix; `org-metadata/scratch/` uses no prefix. A stale `ohfy:` reference in scratch metadata breaks the nightly snapshot build.
**What review can catch:** Prefix mismatches between managed/ and scratch/ folders, missing mirror updates.
**Impact:** Prevents broken CI snapshot builds.

#### 6. Trigger Framework Side-Effect Detection
**Problem:** Trigger logic flows through `TriggerHandler` -> `TriggerServiceFactory` -> `{Object}TriggerService`. A change to a trigger service can have cascading side effects on any test or flow that touches that sObject.
**What review can catch:** Changes to trigger services without corresponding test updates, new DML in trigger context that could hit governor limits in bulk scenarios.
**Impact:** Catches cascade bugs before they hit CI (saves org-claim + deploy + test cycle time).

#### 7. LWC Reactive Property Thrashing
**Problem:** LWC `@track` / `@api` property mutations in rapid succession cause excessive re-renders. No linter catches this.
**What review can catch:** Multiple reactive property assignments in a single method without batching, `@wire` handlers that mutate tracked properties on every invocation.
**Impact:** UI performance in production.

#### 8. Cross-Package ServiceLocator Contract Validation
**Problem:** `ServiceLocator.resolve('ServiceName')` depends on `Service_Configuration__mdt` wiring. A renamed service class breaks the resolution at runtime — no compile-time check.
**What review can catch:** Class renames where the old name appears in CMDT records, interface changes that break implementing classes in other packages.
**Impact:** Prevents runtime `TypeException` in production.

### Where It Adds Less Value (Already Covered)

| Area | Already Covered By |
|------|-------------------|
| Code formatting | Prettier (pre-commit + CI) |
| ESLint rule violations | ESLint (pre-commit + CI) |
| Hardcoded hex colors | Custom hex-lint (ESLint + stylelint + CI) |
| LWC Jest test existence | CI Jest job |
| Apex test pass/fail | CI Apex test job |
| Deploy validation | CI deploy job (sfdx-git-delta) |

---

## 6. Recommendation & Proposal

### Recommended Approach: Hybrid (Option D)

**Automated CI/CD review on every PR** (GitHub Actions + Anthropic API, Sonnet 4.6) **plus manual deep dives** (`/code-review` or `/audit-pull-request`) for high-risk changes.

**Start with B1 (ad-hoc agent)** to validate cost and noise with real PRs, then upgrade to B2 (code-review plugin) if the quality gap justifies the cost increase.

### Why This Approach

| Criterion | Manual Only | CI/CD Only | Hybrid |
|-----------|------------|-----------|--------|
| Coverage (% of PRs reviewed) | Depends on discipline — measure before deciding | 100% | 100% auto + targeted deep dives |
| Cost | $0 marginal (in Max sub) | ~$80-800/mo depending on approach | ~$80-800/mo + existing subs |
| Consistency | Varies by engineer | Uniform | Uniform baseline + human judgment |
| Salesforce-specific depth | Good (custom skill) | Good (CLAUDE.md-aware) | Best (both) |
| Merge confidence | Depends on coverage | Medium (B1) to High (B2/C) | High |
| False positive management | Manual filtering | CLAUDE.md tuning (B1) or REVIEW.md tuning (B2/C) | Both |
| Audit trail | None | GitHub check run + comments | Full |

### What Changes

1. **Add `REVIEW.md`** to repo root — controls review behavior. Only consumed by the `code-review` plugin (B2) and Managed Code Review (C). If starting with B1, add review rules to CLAUDE.md or the workflow `prompt:` instead.
2. **Add `claude-review.yml`** workflow — triggers on PR open + push to non-draft
3. **Store `ANTHROPIC_API_KEY`** as GitHub repo secret
4. **Keep `/audit-pull-request`** — engineers can still run it for Salesforce-specific deep dives
5. **Keep `/code-review`** — engineers run it locally for pre-push self-review

### What We Gain

- **100% PR coverage** — no more "forgot to review" gaps
- **Convention enforcement** — QueryService/DmlService, Logger-in-catch, SYSTEM_MODE comments, DTO pattern checked via CLAUDE.md. Detection depth depends on approach (B1 = moderate, B2/C = high).
- **Security baseline** — SOQL injection, XSS, CRUD/FLS, hardcoded credentials flagged
- **Cross-file regression detection** — full codebase context analysis (strongest with B2/C multi-agent; B1 ad-hoc agent inspects fewer files)
- **Audit trail** — every review is a GitHub check run with inline comments

### What It Doesn't Replace

- **Human review** — domain judgment, architecture decisions, UX feedback
- **CI pipeline** — compile errors, test failures, formatting
- **`/polish`** — pre-refinement ticket validation (different phase entirely)

---

## 7. Implementation Plan

### Phase 1: Pilot with B1 Ad-Hoc Agent (Week 1)

1. Add `ANTHROPIC_API_KEY` to GitHub repo secrets
2. Create `.github/workflows/claude-review.yml` using the B1 ad-hoc agent YAML from Section 3
3. Run on 10-15 real PRs
4. Check API usage dashboard for actual per-review costs with our CLAUDE.md size
5. Assess signal-to-noise ratio — are findings useful or noisy?

### Phase 2: Tune or Upgrade (Week 2-3)

6. **If B1 quality is sufficient:** Tune the `prompt:` input to reduce false positives and sharpen Salesforce-specific checks. Add skip rules directly in the prompt.
7. **If B1 quality is too shallow:** Upgrade to B2 (code-review plugin). Create `REVIEW.md`:

```markdown
# Review Instructions

## Severity Definitions
- **Important**: Logic bugs, data loss, governor limit violations, security
  vulnerabilities, broken QueryService/DmlService/Logger patterns,
  SYSTEM_MODE without rule citation. Must fix before merge.
- **Nit**: Style, naming, minor refactoring opportunities. Fix is optional.

## Volume
Report at most 8 Nits per review. If more found, say "plus N similar items."

## Always Check (Salesforce-specific)
- No raw SOQL/DML in non-_T classes (must use QueryService / DmlService)
- Every catch block has Logger.getInstance().error() + flush()
- Explicit AccessLevel.SYSTEM_MODE has rule-citing comment (rules 1/2/3/4/6)
- No AccessLevel.USER_MODE in non-test classes
- DTOs crossing package + @AuraEnabled boundary are global with { get; set; }
- org-metadata/ changes mirror both managed/ and scratch/ with correct prefix
- No System.debug() or console.log() in production code

## Skip (already enforced by CI or linter)
- Prettier formatting (CI enforces)
- ESLint rule violations (CI enforces)
- Hardcoded hex colors (custom hex-lint CI job enforces)
- LWC Jest test pass/fail (CI enforces)
- Apex test pass/fail (CI enforces)

## Do Not Report
- Generated metadata XML boilerplate (field-meta.xml standard structure)
- Changes to package.json, sfdx-project.json version bumps only
- Test-only code (_T.cls) violating production rules (tests are exempt per CLAUDE.md)
```

8. Monitor cost delta between B1 and B2 over another 10-15 reviews

### Phase 3: Enforcement (Week 4+)

9. Optionally add branch protection rule parsing check-run severity JSON to block merges on Important findings (B2/C only — the check-run output includes machine-readable severity counts)
10. Evaluate whether Managed Code Review (C) is worth the premium over B2 — main differentiator is zero-maintenance setup and Anthropic-tuned feedback loop

---

## 8. Appendix: Sources

**Official Anthropic Documentation:**
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) — setup, configuration, plugin system
- [Claude Code Review](https://code.claude.com/docs/en/code-review) — managed service, REVIEW.md, severity levels, feedback loop
- [Claude Code Cost Management](https://code.claude.com/docs/en/costs.md) — spend caps, analytics
- [Anthropic API Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — per-token rates, Batch API
- [Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — TTL, workspace isolation

**GitHub Repositories:**
- [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) — action.yml, README, input parameters
- [GitHub Marketplace: Claude Code Action](https://github.com/marketplace/actions/claude-code-action-official) — v1 GA listing

**Project-Specific:**
- [OHFY-Split PR #243](https://github.com/Ohanafy/OHFY-Split/pull/243) — `/audit-pull-request` skill
- OHFY-Split CLAUDE.md — project conventions (repo root)



Review.md
- Emphasize High-Impact/Cost of Change Decision made in this PR (Summarize in comment)
-  Callout Kudos (Positive Reinforcement)
- Agent Reviewer (Ask questions to fill in gaps to have full confident review)
	- Negative Prompting
		- Never assume business/architecture logic (Make this less vague)