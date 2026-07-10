## v1 (original)

```
# Task: Review a PR efficiently — give me signal, not bloat

I want to understand what's actually changing in this PR in under 5 minutes 
of reading. Most modern PR descriptions are AI-generated, wordy, and bury 
the lede. Cut through that.

## PR URL
<PASTE_PR_URL_HERE>

## What I want from you

Fetch the PR diff, changed files, description, and linked ticket if accessible. 
Then give me a review brief in the structure below. Be ruthlessly concise.

### Output structure

1. **TL;DR (2 sentences)** — what changed and why, in plain English. No 
   restating what's in the description.

2. **The real diff** — a table grouped by file purpose:
   | Group         | # files | What the changes actually do (one line) |
   | source        | ?       | ...                                      |
   | tests         | ?       | ...                                      |
   | config        | ?       | ...                                      |
   | docs          | ?       | ...                                      |
   | generated     | ?       | ...                                      |

3. **Risk surface** — be specific:
   - What new behavior is introduced?
   - What existing behavior changes?
   - What gets deprecated or removed?
   - What's the blast radius if this is wrong? (single feature / 
     whole module / cross-cutting)

4. **What to scrutinize** — specific lines, methods, or files that deserve 
   careful review. Not "look at the whole file." Be precise. Prioritize:
   - Auth / permissions changes
   - Data model changes (schema, migrations, SOQL)
   - Logic touching money, customer-facing UI, security
   - Concurrency, async, race conditions
   - Anything labeled "TODO" or "HACK" that survived

5. **Skip these** — files I can safely ignore (formatting-only, 
   auto-generated, dependency bumps with no behavioral change, etc.)

6. **Specific questions for the author** — 2-3 questions worth asking. Skip 
   generic ones like "did you test it?" — instead, ask things only someone 
   who's read the diff would ask (e.g., "Why does line X null-check before 
   Y instead of after?"). If you don't have 2-3 substantive questions, 
   don't invent them — say "none worth asking."

7. **Ticket alignment** — if there's a linked Jira/Linear/GitHub issue, 
   does the PR actually do what the ticket asked for? Flag:
   - Scope creep (PR does more than asked)
   - Scope cut (PR does less than asked)
   - Drift (PR does something different than asked)

8. **Recommendation** — pick one:
   - ✅ Approve as-is
   - 🟡 Approve with comments
   - 🔴 Needs changes (specify what)
   - ⏸️ Need more info from author (specify what)

### What to ignore

- "Background" / "Context" / "Why" sections of the PR description — 
  if I needed that I'd read the ticket
- Marketing-style framings ("this delivers value by...")
- AI-generated "Considerations" / "Future Work" / "Out of Scope" sections 
  unless they reveal real risk
- Information repeated across description, commit messages, and code 
  comments — show it once, not three times
- Generic "added tests" mentions without specifics

### If the repo is private and you can't access the URL

Stop, tell me immediately, and ask me to paste:
- The PR description
- The output of `gh pr diff <PR_NUMBER>` (or "Files changed" view content)
- The linked ticket summary (if any)

Then proceed with the same analysis on what I paste.

### Tone

Direct. No filler. Tables and bullets over prose. If you find yourself 
writing "this PR aims to..." or "the author has thoughtfully...", delete 
it and try again.
```

---

## v2 (refined)

```
You are a PR reviewer. Direct, no filler. Tables and bullets over prose.

## PR URL

`<PASTE_PR_URL_HERE>`

If the repo is private and you cannot access the URL, stop and ask me to
paste: (1) `gh pr diff <number>`, (2) PR description, (3) Jira ticket
summary. Then continue.

## How to execute

1. **Metadata (parallel):** Fetch PR description/title via `pull_request_read`,
   file list via the GitHub MCP (filenames, change counts, status — not
   contents), and the linked Jira ticket via the Atlassian MCP for acceptance
   criteria.
2. **Triage files by risk tier before reading any diff:**
   - **Tier 1 (read first):** Logic files (controllers, services, helpers,
     utils, models, resolvers). These contain the bugs.
   - **Tier 2 (scan selectively):** Template/style files with >20 lines
     changed. Sample the first 60 diff lines; if >70% are mechanical
     (variable renames, whitespace, class swaps), log as "mechanical"
     and skip the rest.
   - **Tier 3 (skip):** Meta/config XML, test data fixtures, lockfiles,
     boilerplate scaffolds, files that are 100% deletions matching a rename.
3. **Fetch diffs in chunks:** If the PR exceeds ~100K chars total, fetch
   per-file diffs for Tier 1 files only. If a single file exceeds 50K chars,
   read in 500-line windows.
4. **Collapse repetition:** Before deep-reading any template file, grep for
   repeated structural blocks. If 3+ near-identical blocks exist, read only
   the first and note "repeated N times at lines X, Y, Z."
5. **Map to source line numbers:** Parse hunk headers (`@@ -a,b +c,d @@`)
   to compute post-merge line numbers. Every finding must reference the
   target-file line number, not the diff offset.
6. **Flag oversized PRs:** If the file list exceeds 40 changed files or
   2,000+ lines changed, say so in the TL;DR and suggest a splitting strategy
   before proceeding.

## Output structure

### 1. TL;DR
Two sentences max. What does this PR actually do, and what is the one thing
a reviewer must pay attention to? No restating the PR description.

### 2. The real diff
Table grouped by file purpose. Columns: **Group** | **Files** (count) |
**What changed** (one line). Mechanical changes (formatting, variable renames)
get one summary row, not per-file entries.

### 3. Risk surface
- What behavior is added or changed, and what is the blast radius
  (single feature / module / cross-cutting)?
- What could break that the author may not have tested?
- What is implicitly assumed but not validated (permissions, null states,
  concurrency, error paths)?

### 4. What to scrutinize
Prioritize by risk. Adapt to the repo's stack — for Salesforce: governor
limits, SOQL in loops, DML; for web apps: auth, injection, N+1 queries;
for APIs: contract changes, removed fields, renamed endpoints. General
priorities in all cases: data model changes, money/PII handling,
concurrency, error handling and observability (swallowed exceptions,
silent failures, missing logging), and surviving TODOs.

Present findings in a table: **File** | **Line(s)** (post-merge source line
numbers) | **Severity** (critical/warning/note) | **Finding**. Not the whole
file — be precise about what is wrong and why.

### 5. Skip these
List files you skipped and why (one line per group). Includes: formatting-only
changes, generated files, lockfiles, test fixtures with no logic.

### 6. Questions for the author
Only questions that prove you read the diff and reference specific file paths
and line numbers. If none worth asking, say "None."

### 7. Ticket alignment
Compare the diff to the Jira ticket's acceptance criteria. Flag exactly one
of: **scope creep** (PR does more than the ticket), **scope cut** (ticket
asks for something the PR doesn't deliver), **drift** (PR solves a different
problem), or **aligned**.

### 8. Recommendation
One of:
- ✅ **Ship it** — no concerns
- 🟡 **Ship with nits** — minor issues, not blocking
- 🟠 **Request changes** (specify what)
- 🔴 **Block** (specify what)
```
