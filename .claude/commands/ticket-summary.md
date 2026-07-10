---
name: "Ticket Summary"
description: Generate an engineering summary (.md) and visual dashboard (.html) for any Jira ticket, saved to the Obsidian vault.
category: Workflow
tags: [jira, summary, obsidian]
---

Generate an engineering summary and visual dashboard for a Jira ticket.

**Input**: The argument after `/ticket-summary` is the Jira ticket key (e.g., `BMS-4390`).

**Steps**

1. **Parse the ticket key** from the argument. If no argument provided, ask for the ticket key using AskUserQuestion.

2. **Fetch Jira data** — use `getJiraIssue` with cloudId `ohanafy.atlassian.net` to fetch all available fields. You need:
   - Summary, status, type (issuetype), assignee, priority, labels
   - Full description
   - Acceptance criteria (`customfield_10070`)
   - Comments (use the comments field or fetch via the issue's comment endpoint)
   - Linked issues (issuelinks — blocks/blocked-by, parent/child, relates-to)
   - Parent/epic info if available
   
   If the ticket has child issues (subtasks or child stories), fetch those too with a JQL search: `parent = {TICKET_KEY}`.

   If the fetch fails, show the error and stop.

3. **Ask where to save** — use AskUserQuestion with header "Save to" and these single-select options:
   - **Auto-detect** — scan `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Anvil/Engineering/Sprints/` for a folder starting with `{TICKET_KEY}` and use that. If not found, create one under the latest Sprint folder as `{TICKET_KEY}-{short-kebab-title}/`.
   - **Sprint-4** — `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Anvil/Engineering/Sprints/Sprint-4/{TICKET_KEY}-{short-kebab-title}/`
   - **Reference** — `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Anvil/Engineering/Sprints/Sprint-4/reference/`
   - **Personal** — `/Users/alvarosanchez_1/Documents/Obsidian/Vault/Personal/Ticket-Summaries/`
   
   Create the chosen directory if it doesn't exist.

4. **Generate the Markdown summary** — write `{TICKET_KEY}-summary.md` with this structure:

   ```
   ---
   ticket: {TICKET_KEY}
   status: {status}
   type: {issuetype}
   assignee: {assignee}
   priority: {priority}
   generated: {YYYY-MM-DD}
   ---

   # {TICKET_KEY}: {summary}

   ## Summary
   {Synthesize the ticket — don't just copy the Jira description. Distill the core problem/feature, who it affects, and why it matters. 2-4 sentences.}

   ## Impact
   - **Who is affected**: {concrete: specific accounts, user roles, internal teams}
   - **Current workaround**: {what people do today, or "None"}
   - **Downstream risk**: {what breaks or degrades if this isn't done}
   - **Scope**: {small/medium/large — with justification}

   ## Solution
   {Numbered list of solution components. For each, note whether it uses existing infra or requires net-new work.}
   1. **{Component}** — {description} *(existing/net-new)*
   2. ...

   ## Readiness Assessment
   **{READY | NEEDS REFINEMENT | NEEDS SPIKE | NOT READY}**
   {1-2 sentence justification. Base this on: are acceptance criteria clear? Is the solution path known? Are dependencies resolved? Are there open blockers?}

   ## Open Questions
   {Bullet list. Attribute each to the person who raised it (from comments) or mark as "[Analysis]" if you identified it. Flag blockers explicitly.}
   - **[{Author}]**: {question} {BLOCKER if applicable}

   ## Comments
   {Chronological. Every comment, attributed with author and date.}
   - **{Author}** ({YYYY-MM-DD}): {comment content, condensed but faithful}

   ## Dependencies & Connections
   {Table of linked issues and their relevance.}
   | Ticket | Relationship | Status | Summary |
   |--------|-------------|--------|---------|
   | {KEY}  | {blocks/blocked-by/relates-to/parent/child} | {status} | {summary} |
   ```

5. **Generate the HTML dashboard** — write `{TICKET_KEY}-summary.html` in the same folder. The HTML should be a self-contained single file (inline CSS, no external dependencies) with this visual design:

   **Theme — Cork Board:**
   ```css
   :root {
     --bg: #2b2b2b;
     --surface: #ffffff;
     --surface-alt: #f5f5f0;
     --accent: #f5c518;
     --text: #1a1a1a;
     --text-muted: #666666;
     --border: #e0e0e0;
     --blocker: #dc3545;
     --warning: #fd7e14;
     --question: #0d6efd;
     --ready: #198754;
     --needs-refinement: #fd7e14;
     --not-ready: #dc3545;
     --connection: #0d6efd;
   }
   ```

   **Layout:**
   - Dark cork-colored header (`--bg`) with the ticket key in large yellow (`--accent`) text, status and type as rounded badges
   - Body background: light warm gray (`#f0ede6`)
   - Content in white cards with subtle shadow, `border-radius: 12px`, max-width 900px centered
   - Section headers with yellow bottom-border accent

   **Section-specific styling:**
   - **Impact**: 2x2 grid of bordered boxes (who affected, workaround, downstream risk, scope)
   - **Solution**: Each step has a yellow numbered circle (32px, `--accent` background, white bold text, border-radius 50%) to the left of the text. Existing infra tagged with a subtle gray badge, net-new with an accent badge.
   - **Readiness**: Single card with colored left border — green for READY, orange for NEEDS REFINEMENT, red for NOT READY/NEEDS SPIKE. Assessment text inside with bold verdict.
   - **Open Questions**: Each item has a colored left border — red for blockers, blue for questions, orange for warnings. Author name in bold.
   - **Comments**: Cards with `--surface-alt` background, bold author name + date in muted text, comment body below.
   - **Dependencies**: Blue-bordered (`--connection`) card with a styled HTML table. Status cells use colored badges matching Jira status categories (blue=in progress, green=done, gray=to do).

   **Typography:**
   - Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
   - Ticket key in header: 2rem bold
   - Section headers: 1.4rem with `--accent` bottom border
   - Body text: 1rem, line-height 1.6

   The HTML must render well in Obsidian's HTML Reader plugin and in any browser.

6. **Confirm** — tell the user both files were created, show the file paths, and mention they can open the HTML in Obsidian with the HTML Reader plugin.
