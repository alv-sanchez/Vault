---
name: "Dev Review"
description: Generate a visual implementation review — git diffs + Jira ticket context + synthesized solution narrative — as an HTML dashboard in Obsidian.
category: Workflow
tags: [jira, git, review, obsidian]
---

Generate a visual implementation review dashboard that combines ticket context, a solution narrative, and syntax-highlighted git diffs into a single HTML file.

**Input**: The argument after `/dev-review` can be:
- A ticket key: `BMS-4390`
- A Jira URL: `https://ohanafy.atlassian.net/browse/BMS-4390`
- Empty — the skill will ask.

**Steps**

1. **Parse the ticket key** from the argument (extract from URL if needed). If no argument provided, ask for the ticket key using AskUserQuestion.

2. **Ask for the repo path** — use AskUserQuestion with header "Repo" and these single-select options:
   - **OHFY-Split** — `/Users/alvarosanchez_1/OHFY-Split`
   - **OHFY-Ecom** — `/Users/alvarosanchez_1/Documents/OHFY-Ecom`
   - **Sales-Demos** — `/Users/alvarosanchez_1/Sales-Demos`

   Validate the path exists. If not, show the error and stop.

3. **Collect git data** from the chosen repo. Run these bash commands:
   - Detect the current branch: `git -C {REPO} branch --show-current`
   - Detect the base branch: try `main`, then `master`, then `develop` — use `git -C {REPO} rev-parse --verify origin/{branch} 2>/dev/null` to find which exists.
   - Get the merge base: `git -C {REPO} merge-base origin/{BASE_BRANCH} HEAD`
   - Get the full diff from merge base: `git -C {REPO} diff {MERGE_BASE}...HEAD`
   - Get diff stats: `git -C {REPO} diff --stat {MERGE_BASE}...HEAD`
   - Get commit log: `git -C {REPO} log --oneline {MERGE_BASE}...HEAD`
   - Get per-file change summary: `git -C {REPO} diff --numstat {MERGE_BASE}...HEAD`

   If the committed diff is empty (no commits beyond the base), fall back to the **uncommitted working tree**: use `git -C {REPO} diff HEAD` for tracked changes plus `git -C {REPO} ls-files --others --exclude-standard` for untracked files (render those as new-file diffs via `git diff --no-index /dev/null {file}`). Note in the dashboard footer that the review covers uncommitted work. Only if both the committed diff AND the working tree are clean, tell the user there are no changes to review and stop.

4. **Fetch Jira data** — use `getJiraIssue` with cloudId `ohanafy.atlassian.net` to fetch:
   - Summary, status, type, assignee, priority, labels
   - Full description
   - Acceptance criteria (`customfield_10070`)
   - Comments

   If the fetch fails, warn but continue — the review can still work with just git data.

5. **Save location** — dev-review files are isolated from sprint ticket folders in a dedicated directory:
   `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Anvil/Engineering/Sprints/dev-reviews/`

   Save there by default **without asking**. Create the directory if it doesn't exist. Only use AskUserQuestion if the user explicitly mentioned a different destination, offering:
   - **Dev-Reviews (default)** — `.../Sprints/dev-reviews/`
   - **Ticket folder** — scan `.../Sprints/` for a folder starting with `{TICKET_KEY}` and use that
   - **Personal** — `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Personal/Dev-Reviews/`

6. **Synthesize the solution narrative** — analyze the full diff and ticket context together. Produce:
   - A 2-4 sentence **"What was built"** summary connecting the code changes to the ticket's goal.
   - A **file-by-file changelog**: for each changed file, 1-2 sentences explaining *what* changed and *why* (inferred from the ticket + diff context). Group files by logical component (e.g., "Apex Controllers", "LWC Components", "Tests", "Config/Metadata").
   - A list of **key decisions** — non-obvious choices visible in the code (e.g., chose platform cache over custom object, used @AuraEnabled over REST, batch vs. queueable).
   - An **open items** list — things the diff suggests are incomplete, TODO comments, stubbed methods, missing tests.

7. **Generate the HTML dashboard** — write `{TICKET_KEY}-dev-review.html` with a self-contained single-file HTML (inline CSS, no external deps). Structure:

   **Theme — same Cork Board as ticket-summary, extended for diffs:**
   ```css
   :root {
     --bg: #2b2b2b;
     --surface: #ffffff;
     --surface-alt: #f5f5f0;
     --accent: #f5c518;
     --text: #1a1a1a;
     --text-muted: #666666;
     --border: #e0e0e0;
     --diff-add-bg: #e6ffec;
     --diff-add-text: #1a7f37;
     --diff-del-bg: #ffebe9;
     --diff-del-text: #cf222e;
     --diff-hunk-bg: #ddf4ff;
     --diff-hunk-text: #0969da;
     --diff-line-bg: #f6f8fa;
   }
   ```

   **Layout — 3 main panels in vertical scroll:**

   **Panel 1: Ticket Context (top)**
   - Dark header with ticket key (yellow), status/type/priority badges (same style as ticket-summary)
   - Ticket summary (from Jira), 2-3 sentences max
   - Acceptance criteria if present
   - Compact — this is context, not the focus

   **Panel 2: Implementation Narrative (middle)**
   - White card with section header "What Was Built"
   - The synthesized summary paragraph
   - **File Changelog** — grouped by component. Each group is a collapsible `<details>` element (open by default) with:
     - Group header (e.g., "Apex Controllers") with file count badge
     - Each file as a row: filename (monospace), +/- line stats with green/red coloring, and the 1-2 sentence explanation
   - **Key Decisions** — numbered list in a card with yellow left border
   - **Open Items** — if any, card with orange left border. Each item has a colored indicator (red=missing test, orange=TODO, blue=incomplete)

   **Panel 3: Diffs (bottom)**
   - Section header "Code Changes" with total files/insertions/deletions stats bar
   - Each file in its own collapsible `<details>` element (collapsed by default for large diffs, open for small ones — threshold: 50 lines)
   - File header: full path in monospace, +/- badges
   - Diff body: `<pre><code>` block with:
     - Line numbers in a gutter (muted, thin column)
     - Added lines: `--diff-add-bg` background, `--diff-add-text` color, `+` prefix
     - Deleted lines: `--diff-del-bg` background, `--diff-del-text` color, `-` prefix
     - Hunk headers (`@@`): `--diff-hunk-bg` background, `--diff-hunk-text` color, full width
     - Context lines: `--diff-line-bg` background
     - Use `white-space: pre; overflow-x: auto` for code lines
     - Font: `'SF Mono', 'Fira Code', 'Cascadia Code', monospace`, 0.85rem

   **Footer:**
   - Branch name, commit count, base branch, generated date
   - Muted text, centered

   **Interactive features (vanilla JS, no deps):**
   - "Expand all / Collapse all" toggle button for diffs
   - Sticky nav bar at top (below header) with anchor links: Context | Narrative | Diffs
   - Clicking a filename in the narrative panel scrolls to that file's diff

   The HTML must render well in Obsidian's HTML Reader plugin and in any browser.

8. **Confirm** — tell the user the file was created, show the path, and give a quick stat line (e.g., "12 files changed, +340 / -89, 5 commits"). Mention they can open it in Obsidian with the HTML Reader plugin.

9. **Feed the capability ledger** (closes the strata loop — Phase 3). From the "What Was Built" + Key Decisions you just synthesized, distil the **1–3 genuinely new, reusable capabilities** this change adds (not every file — the things a *future* ticket would want to reuse). For each, note the owning package, the Jira ticket, the branch HEAD short-SHA (`git rev-parse --short HEAD`), and a real `file:line`/path from the diff. Then append them:
   ```bash
   cat > /tmp/dr-ledger.json <<'JSON'
   [ {"pkg":"OHFY-<Package>","cap":"<one-line capability>","ticket":"BMS-XXXX","sha":"<short-sha>","cite":"<path/File.cls:line>"} ]
   JSON
   node ~/.claude/skills/synapse/ledger.mjs add-json /tmp/dr-ledger.json
   ```
   **Honesty guard:** only append capabilities that are actually landing (reviewed → merging), each cited to a file that exists in the diff. No cite → don't append. The entry carries its SHA, so if the branch later changes, re-running dev-review refreshes provenance (`ledger.mjs` dedupes on capability+cite). This is what makes the next `/strata` on this area start from a fuller baseline. Skip only if the change adds no reusable capability (pure fix/docs) — say so.
