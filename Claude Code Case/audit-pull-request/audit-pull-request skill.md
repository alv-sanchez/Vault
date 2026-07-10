
.claude/commands/audit-pull-request.md


Audit the GitHub pull request at the URL provided in $ARGUMENTS.

## Steps

1. Fetch the PR page and diff using the `gh` CLI or web fetch. Extract:
   - PR title, description, and any linked tickets
   - Full file diff (all changed files)
   - File types changed (Apex `.cls`/`.trigger`, LWC `.js`/`.html`/`.css`, metadata `.object-meta.xml`, `.field-meta.xml`, `.md-meta.xml`, etc.)

2. Analyze the diff thoroughly and produce a structured audit report using the criteria below, leaving a concise set of findings in a single comment on the pull request.

---

## Audit Criteria

### Bugs & Runtime Errors
Flag any code that will or is likely to cause a runtime error:
- Divide by zero (literal or unchecked denominator)
- Null dereference — accessing a property or method on a value that could be null/undefined without a prior null check
- Reading an undefined variable or uninitialized value
- Index out of bounds — array/list access without a size check
- SOQL queries inside loops (Apex governor limit violation)
- DML statements inside loops (Apex governor limit violation)
- Synchronous callouts inside async contexts or vice versa in LWC/Aura (e.g., calling an `@wire` adapter result directly as if it's a Promise, mixing `async/await` with raw `.then()` chains in ways that lose error handling)
- Race conditions in LWC — e.g., mutating shared reactive properties from multiple concurrent `async` methods without coordination
- Maps or Sets that can silently overwrite keys — flag any `Map.put()` or object spread where the key is not guaranteed unique and the overwrite is likely unintentional
- Missing `break` in switch statements where fall-through is not intentional

### Silent Failures & Swallowed Errors
Flag code paths where an error can occur but will be hidden from the user, logs, or monitoring — especially asynchronous contexts where exceptions never surface to the original transaction. Do **not** just flag the presence of a Queueable/Batch/Future; flag any operation inside one that could realistically fail and isn't caught and recorded:
- **Async Apex that can throw but has no error handling** — any Queueable (`execute`), Batchable (`start`/`execute`/`finish`), Future (`@future`), or Schedulable that performs DML, a callout, SOQL, or other failable work without a `try/catch`. An unhandled exception here is invisible to the calling user and is only discoverable in async job logs.
- **Empty or swallowing catch blocks** — a `catch` that does nothing, only calls `System.debug()`/`console.error()`, or otherwise discards the exception without rethrowing, logging to a durable store (custom error-log object, Platform Event), or surfacing it to the user.
- **Over-broad catch that continues** — catching `Exception` (or bare `catch (e)`) and proceeding as if nothing happened, masking real failures.
- **Partial-success DML not inspected** — `Database.insert/update/delete(records, false)` (allOrNone=false) or any `Database.SaveResult[]`/`UpsertResult[]`/`DeleteResult[]` where the results are never checked for `isSuccess()`/`getErrors()`, so failed rows vanish silently.
- **Queueable without a Finalizer** — when a Queueable does failable work (especially callouts), flag the absence of `System.attachFinalizer()` / a `Finalizer` to catch and record unhandled exceptions and, where appropriate, retry.
- **LWC/JavaScript promises with no rejection handling** — an imperative Apex call, `fetch`, or other Promise with no `.catch()` (or no `try/catch` around `await`); a rejected promise leaves the UI inconsistent with no user feedback.
- **Failure logged but not surfaced** — work that fails and writes only a `System.debug`/`console.error` with no toast, no error record, and no rethrow, so the user believes the action succeeded.

For each finding, state *what* can fail and *how* it should be handled (caught + logged to a durable store, surfaced to the user, retried, etc.).

### Conditional Logic & Dead Branches
Flag conditionals that don't actually branch the way they appear to, or that silently skip work:
- **Effectively constant conditions** — an `if`/ternary/`while` whose outcome is fixed given how its variables are assigned (e.g., a flag hardcoded `true` just above the check, `if (x != null)` immediately after `x = new Account()`, `if (list.size() >= 0)`). The "other" branch is unreachable.
- **Conditions that almost always take one route** — a check driven by a parameter, custom setting/metadata, or feature flag that in practice is (almost) always the same value, so the alternate path rarely or never runs. Call out the assumption and confirm whether the rarely-taken branch is intended and tested, or is hiding a bug.
- **Silent conditional skips** — a guard clause (`if (cond) return;`, `continue`, early `break`) that bypasses the method's core work under a condition that is common rather than a true edge case, so the operation silently does nothing without logging or signaling. Distinguish legitimate early-exits (empty input) from skips that quietly drop real work.
- **Identical branches** — `if`/`else` arms, both ternary results, or multiple `switch`/`case` branches that execute the same logic, making the condition pointless.
- **Unreachable branches** — `else`/`case`/`default` paths that can never be hit given prior `return`/`throw` statements or mutually exclusive earlier conditions.
- **Redundant nested conditions** — an inner condition already guaranteed (or already excluded) by an outer one, leaving a dead branch.

For each finding, state which branch is effectively dead or always-taken, and why, based on the actual parameter/variable values visible in the diff.

### Dead Code
- Commented-out blocks of code (more than a single explanatory line)
- Unreachable code paths (e.g., code after an unconditional `return`/`throw`)
- Unused variables, parameters, or imports

### Debug & Logging Statements
- `System.debug()` calls left in Apex production code
- `console.log()`, `console.warn()`, `console.error()` left in LWC/JavaScript production code

### Naming Conventions
Apply these rules to all changed files:

**Salesforce Object & Field Metadata** (`.object-meta.xml`, `.field-meta.xml`):
- The `<label>` value and the API name (filename prefix or `<fullName>`) should match, with the only difference being that the API name uses underscores where the label has spaces (e.g., label `Invoice Line Item` → API name `Invoice_Line_Item__c`). Flag mismatches.

**Apex Classes & Triggers** (`.cls`, `.trigger`):
- Class names must be PascalCase (e.g., `InvoiceService`, not `invoiceService` or `invoice_service`)
- Method names must be camelCase (e.g., `calculateTotal`, not `CalculateTotal` or `calculate_total`)
- Constants should be `UPPER_SNAKE_CASE`

**LWC & JavaScript** (`.js`):
- Component folder names must be camelCase (the framework enforces this, but flag any mismatch between folder name and class/export name)
- Method and function names must be camelCase
- Class names (if any) must be PascalCase

**Custom Metadata & Other Metadata**:
- Record API names should follow the same label-to-API-name pattern as objects/fields above

---

## Output Format

Produce a report with the following sections. Omit any section that has no findings.

```
## PR Audit Report
**PR:** <title and URL>
**Files changed:** <count> | **Lines added:** <+n> | **Lines removed:** <-n>

---

### 🐛 Bugs & Runtime Errors
<file>:<line> — <description of the issue and why it will cause a problem>
...

### 🔇 Silent Failures & Swallowed Errors
<file>:<line> — <what can fail, why the failure is hidden, and how it should be handled>
...

### 🔀 Conditional Logic & Dead Branches
<file>:<line> — <which branch is effectively dead or always-taken, and why>
...

### 🧹 Dead Code
<file>:<line> — <description>
...

### 🔍 Debug Statements
<file>:<line> — `<the statement>` — remove before merge
...

### 🏷️ Naming Convention Violations
<file> — <what was found> → <what it should be>
...

### ✅ Summary
<2–3 sentence overall assessment: is this PR safe to merge, what are the blockers vs. suggestions, any patterns worth calling out>
```

Severity guide (use inline labels):
- **[BLOCKER]** — will cause a runtime error, data loss, or governor limit exception in production
- **[WARNING]** — likely problem or bad practice that should be fixed before merge
- **[SUGGESTION]** — minor style or hygiene issue; fix is optional but recommended

If the PR has no findings in a section, omit that section entirely. If the PR is clean, say so clearly in the Summary.