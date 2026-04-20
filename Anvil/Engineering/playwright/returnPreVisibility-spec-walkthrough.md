---
title: returnPreVisibility.spec.ts — Learn the File
topic: Playwright E2E · Salesforce LWC · OHFY-WMS-UI
ticket: BMS-3838
created: 2026-04-17
audience: engineer learning Playwright against Salesforce Experience Cloud
---

# returnPreVisibility.spec.ts — Learn the File

Two sections below:

1. **Guide** — structured walkthrough. Read at your own pace, refer back to it.
2. **TTS Transcript** — flowing prose, safe to paste into a text-to-speech tool (ElevenLabs, OpenAI, Mac Say, etc.) to listen while you read the code in your editor.

The file under study lives at `OHFY-Split/e2e/tests/returnPreVisibility.spec.ts`. Keep it open in a second pane.

---

# Part 1 — Guide

## Why this spec exists

The `returnPreVisibility` LWC gives warehouse users a read-only preview of what's currently on a delivery truck before the return is processed. Ticket BMS-3838. It's not a writable form — just a picker (warehouse → truck) and a summary table with grouping and sorting controls.

The spec's job is to prove **the component, its controls, and its data flow all behave correctly in a real Salesforce org** — not just in JSDOM. Jest unit tests exist separately for LWC internals; Playwright covers the full round-trip: Apex → LWC → DOM.

## The mental model

Every Salesforce LWC E2E test in this repo follows the same shape:

1. **Auth once, reuse the cookies.** `e2e/fixtures/auth.setup.ts` runs before every test session, fetches a frontdoor URL from the SF CLI, opens it in Chromium, and saves the authenticated cookies to `.auth-state.json`. Every test boots into a logged-in context for free.
2. **Navigate to the feature.** A known URL (`/lightning/r/<id>/view` for records, `/lightning/n/<tab>` for custom tabs, `/lightning/o/<object>` for list views).
3. **Locate the root custom element.** LWCs render as `<c-name>` in non-namespaced orgs and `<ohfy-name>` in the namespaced 2GP managed package. We accept either.
4. **Interact and assert** using `data-testid` attributes the LWC author added for exactly this purpose.

If you internalize that shape, every spec in this repo becomes approachable.

## File anatomy (line-by-line)

### Imports (lines 1–2)

```ts
import { test, expect } from "../fixtures/salesforce.fixture";
import type { Locator } from "@playwright/test";
```

- `test` and `expect` come from the **custom fixture**, not directly from `@playwright/test`. The fixture extends Playwright's `test` to provide an authenticated `sfPage` argument. That's why every test signature is `async ({ sfPage }) => {...}` instead of `async ({ page })`.
- `Locator` is type-only — it describes "a handle to one or more DOM elements." Importing as `type` means it's erased at runtime; zero cost.

### Constants (lines 15–16)

```ts
const TAB_PATH = "/lightning/n/ohfy__Return_Pre_Visibility";
const ROOT_SELECTOR = "c-return-pre-visibility, ohfy-return-pre-visibility";
```

- `TAB_PATH` — the URL fragment for the Custom Tab. The `ohfy__` prefix is the managed package namespace, automatically applied when the package is installed into any namespaced org (including 2GP scratch orgs linked to the DevHub).
- `ROOT_SELECTOR` — comma-separated CSS selector. It's "or" logic: find `<c-return-pre-visibility>` **or** `<ohfy-return-pre-visibility>`. This single line is why the spec works across namespaced and non-namespaced environments. Without it, you'd pick one and lock the spec to one type of org.

### Helper: `openAndWait` (lines 18–23)

```ts
async function openAndWait(sfPage: any) {
    await sfPage.goToApp(TAB_PATH);
    const root = sfPage.locator(ROOT_SELECTOR);
    await expect(root).toBeVisible({ timeout: 30_000 });
    return root;
}
```

Every test starts with this. Two things happen:

1. **Navigate** — `goToApp` is a fixture helper that prepends the org's instance URL (saved in `.auth-state.json`) and calls `page.goto(..., { waitUntil: "domcontentloaded" })`. DOM-content-loaded fires when HTML is parsed — **not** when all async JS has finished. Salesforce hydration happens after.
2. **Wait for hydration** — `toBeVisible` polls every 100ms up to 30 seconds. The LWC custom element doesn't exist in the DOM until Aura/LWC runtime mounts it. This line is the "have we hydrated yet?" gate.

The 30-second timeout is generous because Experience Cloud can be slow on a cold start.

### Helper: `selectFirstWarehouse` (lines 25–40)

```ts
async function selectFirstWarehouse(root: Locator) {
    await expect(root.getByTestId("rpv-warehouse-prompt")).toBeVisible({ timeout: 15_000 });
    const combo = root.getByTestId("rpv-warehouse-select");
    await combo.click();
    const options = combo.locator("lightning-base-combobox-item");
    await expect(
        options.first(),
        "Expected at least one warehouse — seed `sample-data-plan.json` into the org."
    ).toBeVisible({ timeout: 10_000 });
    await options.first().click();
}
```

This is the most important helper to understand — it encodes **three non-obvious Salesforce/Playwright patterns**.

**1. The hydration guard (`rpv-warehouse-prompt`)**
The LWC's JS has a getter `showWarehousePrompt` that returns `true` only when `warehousesLoading === false && !selectedWarehouseId`. That template block renders a `<p>` with text "Select a warehouse to see its active trucks." Waiting for that paragraph to appear proves:
- The Apex call `getReturnPreVisibilityWarehouses` has completed.
- The component is ready to accept a selection.

Before this guard existed, the test would sometimes click the combobox while it was still disabled (`disabled={warehousesLoading}`). The click registered but the dropdown didn't open — tests appeared "stuck." That's a classic **hydration race**.

**2. The combobox interaction pattern**
`lightning-combobox` is SLDS's wrapper around a listbox. You can't `.fill()` or `.selectOption()` it directly like a native `<select>`. You have to:
- Click the combo to open the dropdown.
- Find the `<lightning-base-combobox-item>` children that get rendered on open.
- Click the one you want.

Note we scope the options search with `combo.locator(...)` — the dropdown panel is rendered inside the combobox's shadow DOM. Scoping avoids picking up other open comboboxes on the page.

**3. The error-message-as-second-argument pattern**
```ts
await expect(options.first(), "Expected at least one warehouse — seed ...").toBeVisible(...);
```
Playwright's `expect(locator, customMessage)` prepends your message to the failure output. This is the difference between a teammate seeing `locator.first() not visible` and seeing `Expected at least one warehouse — seed sample-data-plan.json into the org.` You save them 10 minutes of hunting.

### Helper: `selectFirstTruck` (lines 42–51)

Same pattern — wait for the thing, click it, wait for the **next** thing to confirm the click "took." The `rpv-main-truck-name` visibility check proves the truck click was processed and the main panel hydrated.

### Helper: `pickWarehouseAndTruck` (lines 53–57)

Trivial composition. The value is that every test from "happy path" onward uses this one line instead of 15 lines of duplicated setup. DRY at the helper layer is fine; DRY inside a single test often obscures intent, so we stop here.

### Helper: `pickComboOption` (lines 59–65)

Generalized version of the combobox pattern for group-by and sort-by. Key detail: `.filter({ hasText: label })` filters a collection to the item containing the given text. The first matching item gets clicked. SLDS comboboxes use label-as-display so this is stable.

### The `test.describe` block (line 67)

A single describe block groups all 10 tests. Playwright's HTML reporter groups them visually by describe, and the group name becomes the first segment of the test ID.

### Test 1 — "renders the component shell" (lines 68–78)

Pure structural smoke test. No data interaction. Assertions:
- `rpv-root` visible — the outer card renders.
- `rpv-left-panel` visible — the warehouse/truck column.
- `rpv-main-panel` **attached** (not visible) — see below.
- `rpv-warehouse-select` visible — the combobox.
- `rpv-refresh` visible — the refresh button.

**Why `toBeAttached` instead of `toBeVisible` for the main panel?**
Playwright considers an element "hidden" if it has zero width or height. On initial load, the main panel is an empty `<section>` — its children are all gated by `if:true={selectedTruckId}` or `if:true={showTruckPrompt}`. With no truck selected and no trucks listed, the section collapses to 0 height. `toBeVisible` fails there.

`toBeAttached` only asserts the element exists in the DOM. That's what we actually want — we're checking the skeleton is there, not that it's painted pixels.

This is the most common Playwright-on-LWC gotcha. Any empty-state container gets this treatment.

### Test 2 — "shows the initial warehouse-selection prompt" (lines 80–86)

Confirms the guide-text renders on first load. Single-assertion test; cheap, clear, doubles as a regression lock on the guard text.

### Test 3 — "full happy path" (lines 88–107)

The centerpiece. Exercises the full flow: warehouse → truck → load summary.

The interesting bit is at lines 99–106:

```ts
await expect(async () => {
    const groups = await root.locator('[data-testid="rpv-group"]').count();
    const empty = await root.getByTestId("rpv-empty-load").isVisible().catch(() => false);
    expect(groups > 0 || empty).toBeTruthy();
}).toPass({ timeout: 15_000 });
```

`expect(async () => {...}).toPass()` is Playwright's **retrying assertion** pattern. The inner function is retried every 100ms until either it passes or the timeout fires.

Why retrying? Because "groups appear OR empty-state appears" is a **disjunction of two async outcomes**. Neither group count nor empty-state visibility resolves instantly. A single snapshot might catch a state where neither is true yet (still loading). `toPass` bridges that gap.

The broader pattern: **for anything that depends on async data arriving, wrap it in `toPass` rather than chaining manual `.toBeVisible()` calls with timeouts.**

### Tests 4–6 — Group By (lines 111–175)

Each covers one grouping mode: Package Type, None, Reason Code.

Shared pattern:
1. Open, pick warehouse + truck.
2. Check if any `rpv-group` exists. If not, skip the deep assertion but still exercise the control.
3. Click the group-by combobox, pick the target option.
4. Wrap the re-render assertion in `toPass` — the LWC does a synchronous re-render but DOM commits happen next microtask.

For **None**, the assertion is precise: exactly 1 group, labeled "All Items." The component's `groupLines` function has a special branch for `GROUP_NONE` that bypasses grouping logic. This test locks that contract.

For **Package Type** and **Reason Code**, the assertion is weaker — "labels aren't the labels of another grouping mode." That's because we don't know what package types or reason codes the seeded data has. This is a common resilience tradeoff: **assert what must be true; leave what's data-dependent to a seed-aware spec if you need it.**

### Tests 7–8 — Sort By (lines 179–238)

The sort tests are the trickiest in the file. Two reasons:

1. **Sort order depends on data.** You can't hardcode expected row orderings without locking the test to specific seed content.
2. **You need ≥ 2 distinct rows to verify "order."** One row can't be in the wrong order.

**Test 7 — "Item Name A–Z"**
1. Collapse into a single "All Items" group (via group-by "None") so we don't have to reason about group boundaries.
2. Explicitly set sort to Item Name.
3. Pull all `rpv-item-link` text contents into a JS array.
4. Sort the array locally with `localeCompare`.
5. Assert the DOM array equals the locally-sorted array.

If the data has < 2 rows, return early — no useful assertion available. This is a judgment call: fail hard vs. exit quietly. Here we exit quietly because it's the data's fault, not the code's.

**Test 8 — "Quantity High → Low reorders vs alphabetical"**
More defensive than Test 7. We:
1. Capture the alphabetical order as a reference.
2. Switch to Quantity sort.
3. Assert the new list contains exactly the same items (`arrayContaining` with equal length).

We **don't** assert the order is numerically descending. That would require parsing quantity strings like "5 cs · 10 ea" which is brittle. We assert the weaker contract: "same set, potentially different order." A regression where sort breaks the rows entirely (loses items, duplicates items) still fails this test — which is the failure mode that actually matters.

### Test 9 — Refresh (lines 242–285)

The refresh button reloads everything while preserving user selection. Validating that in a test requires three ideas at once:

**1. Capture before, compare after.** Any "preserves state" test works this way. Read a value, take an action, read again, assert equality.

**2. Combobox value extraction is annoying in SLDS.** `lightning-combobox` doesn't expose the selected value on a standard attribute. We try `.inputValue()` on an inner `<input>` first, fall back to `.textContent()` on the combobox itself. The `.catch` pattern keeps the helper resilient across SLDS versions.

**3. Wait for the async cycle to complete.** The `isRefreshDisabled` getter flips the button disabled while any of warehouse/trucks/load is loading. We watch for the enable → disable → enable pattern. The `toBeDisabled` check has a `.catch` wrapper because **very fast refreshes may finish before Playwright observes the disabled state**. That's fine; we only care that the button is enabled again at the end.

### Test 10 — Read-only contract (lines 289–301)

One-line assertion wrapped in setup. The core contract of this LWC is: **the load summary is read-only**. Users cannot edit quantity, can't add rows, can't mark anything. The way we lock that contract in a test is:

```ts
const editableInputs = mainPanel.locator(
    "input[type='text'], input[type='number'], textarea"
);
await expect(editableInputs).toHaveCount(0);
```

We explicitly **exclude** `lightning-input` from the selector because group-by and sort-by are comboboxes that internally render a text-like input. Including `lightning-input` would false-positive. We also don't include `input[type='checkbox']` or `radio` — those are interactivity that might legitimately appear later.

If someone in a future PR drops a `<lightning-input type="number">` into the main panel, this test fails immediately. That's the point.

## Patterns to take with you

- **Test-ID–first locators.** Never use text content or SLDS class chains. Adding `data-testid` to the LWC is free at author time and stable forever.
- **Wait for an affordance, not a timeout.** `waitFor(...)`, `toBeVisible`, `toPass` — all of them watch the DOM. Raw `page.waitForTimeout(3000)` is a code smell.
- **Helpers for shared setup, not for shared assertions.** Each test's assertions should read top-to-bottom as the intent.
- **Custom messages on `expect` calls.** Future-you debugging at 11 PM will thank you.
- **`toPass` for async disjunctions.** When "A or B becomes true after some time," don't chain `.or()` — wrap in `toPass`.
- **Empty-state resilience.** Every test that depends on data should also work when data is partial. Use `toBeAttached` for containers, `if (count < 2) return` for ordering tests, or explicit seed contracts in the file header.

## Running the tests

```bash
SF_ORG_ALIAS=apr16Org npx playwright test e2e/tests/returnPreVisibility.spec.ts --project=chromium --headed
```

- `SF_ORG_ALIAS` — picks which authenticated `sf` CLI alias to use for auth setup and Apex queries.
- `--project=chromium` — limits to one browser. Omit to run all (chromium, firefox, webkit, edge, mobile).
- `--headed` — shows the browser. Omit for CI.
- `--debug` — opens Playwright inspector. Step through line-by-line.
- `npx playwright show-report` after a run — opens the HTML report with traces and screenshots.

## Exercises

If you want to prove you understand:

1. Add a test that, after picking a warehouse, verifies the **correct** count of trucks shown matches a SOQL query you run against the org.
2. Rewrite `pickComboOption` to wait for the dropdown's closed-state after selection, so you could assert the combobox closed.
3. Add a test that clicks an item link in the load summary and verifies navigation to the Item detail page.
4. Introduce a deliberate bug: change `showTruckPrompt` to always return `false`. Which tests fail? Do they fail with useful messages?

---

# Part 2 — TTS Transcript

*Paste this section into your text-to-speech tool of choice. It's written to be listened to while the spec file is open in your editor. Pauses are indicated with ellipses — most TTS engines honor them as natural breaks.*

---

Hey. We're going to walk through a Playwright test file together. It's called returnPreVisibility dot spec dot ts. Open it in your editor now. I'll describe what each section does and why, so by the end you can write one of these yourself, not just vibe through.

Here's the big picture before we start. Playwright is an end-to-end testing framework. End-to-end means it drives a real browser, loads a real web page, clicks real buttons, and asserts the result. In this project, the real web page is a Salesforce Experience Cloud page hosting a Lightning Web Component. The component is called returnPreVisibility. Its job is to show warehouse staff what inventory is sitting on a delivery truck before that truck's return is processed. It's read-only — a picker on the left, a summary on the right.

Our spec file has ten tests. They all follow the same pattern, which I'll teach you once so you recognize it everywhere.

Let's start at the top.

Lines one and two are imports. We import test and expect from a fixture at dot dot slash fixtures slash salesforce dot fixture. We're not importing them from the Playwright package directly, even though that's where they originate. Why? Because this project has a custom fixture that extends Playwright's test function with a logged-in Salesforce page — saving us the pain of authenticating before every test. When you see sf-page in the test arguments later, that's where it comes from.

The second import is type Locator from Playwright test. The word type matters. It means this import is erased at compile time — it's a type hint, not runtime code. A Locator, conceptually, is a handle to one or more elements on the page. Think of it like a jQuery selector, but lazy — it doesn't actually query the DOM until you call a method on it.

Next, lines fifteen and sixteen — two constants.

TAB_PATH is the URL fragment for the custom tab where our component lives. The ohfy double-underscore prefix is a namespace. Salesforce managed packages install with a namespace, so our tab is effectively owned by the ohfy package. If the package isn't installed in namespaced form, this URL wouldn't work — which brings us to the second constant.

ROOT_SELECTOR is a CSS selector with a comma in it. In CSS, a comma means or. So this selector matches either c-return-pre-visibility or ohfy-return-pre-visibility. That single comma is the difference between a spec that works in every environment and a spec that only works in one. Salesforce renders Lightning Web Components as custom HTML elements, and the tag name includes the namespace prefix in a namespaced org. In a plain scratch org without the namespace, it uses c as a default. We accept both. Write this pattern down — it's the single most common bug in Salesforce Playwright tests.

Now we arrive at the first helper, called openAndWait. Five lines. Let me unpack them.

Line nineteen calls sf-page dot goToApp with our TAB_PATH. Under the hood, goToApp prepends the Salesforce org's base URL and navigates. It waits for DOM-content-loaded — which fires when HTML parsing finishes, not when all JavaScript has run. That's important. Salesforce hydration, the process of booting up Lightning and rendering components, happens after DOM-content-loaded.

So line twenty creates a locator for our root element — that c-dash or ohfy-dash pattern — and line twenty-one waits up to thirty seconds for that element to become visible. That's our hydration gate. Once the root element is visible, we know the component has mounted and we can start asserting on its children.

The next helper, selectFirstWarehouse, is the most important one in the file. Read it carefully.

The first thing it does is wait for a test-id called rpv-dash-warehouse-dash-prompt to be visible. Why? Because this prompt is a paragraph tag inside the component that only renders when two conditions are true — the warehouses have finished loading from Apex, and no warehouse is yet selected. Waiting for that paragraph to appear is how we know the component is ready to accept a click. Before this wait existed, the test would sometimes click the combobox while it was still disabled due to loading, the click wouldn't register, and the test would appear stuck. That's called a hydration race. One of the most common bug sources in Salesforce Playwright work.

After the hydration guard, we find the warehouse combobox by its test-id, we click it to open the dropdown, we find the option items inside it, and we assert at least one is visible. Note the second argument to the expect call — a custom error message. If the assertion fails, the test output will say Expected at least one warehouse, seed sample data plan into the org. That's worth its weight in gold when you're debugging at eleven PM. Always add messages to expect calls where the failure condition is non-obvious.

Finally, we click the first option. The warehouse is selected. The helper returns.

The next helper, selectFirstTruck, does the same dance for truck cards. It waits for truck cards to appear, clicks the first one, and then — critically — waits for a different test-id, rpv-dash-main-dash-truck-dash-name, to become visible. That wait confirms the truck click actually processed and the right-hand panel hydrated. Without that wait, the next assertion could race ahead.

The pickWarehouseAndTruck helper just composes the two. Nothing fancy — it's there so every test can do the two-step setup with one line.

The pickComboOption helper generalizes the combobox interaction for group-by and sort-by. The interesting line is dot filter has-text label — that narrows a collection of options down to the one containing the given text. That's how we click Package Type or Reason Code without hardcoding indexes.

Now into the tests themselves.

Test one — renders the component shell. This is a smoke test. We open the page, and we check that five elements exist — the outer card, the left panel, the main panel, the warehouse select, and the refresh button. Four of them use toBeVisible. One of them — the main panel — uses toBeAttached. Why the difference?

Here's the gotcha. On first load, before any truck is selected, the main panel has no content. Its inner templates are gated by conditions that evaluate to false. So the section element exists in the DOM, but it has zero height. Playwright considers zero-height elements hidden. If you use toBeVisible on an empty container, it will fail. toBeAttached only asserts the element exists in the DOM, regardless of size. That's what we want for an empty-by-design container. Burn this pattern into your memory. You'll hit it in every Salesforce Playwright spec you ever write.

Test two — shows the warehouse-selection prompt on first load. One assertion, cheap, clear, locks in the UX guidance text.

Test three — the full happy path. This is the centerpiece. Pick a warehouse, pick a truck, verify the whole main panel renders, verify the load summary resolves. There's one sophisticated bit here at the end. We use expect async function toPass. That's the retrying assertion pattern.

Here's what it's for. We want to assert that either the load summary has groups, or the empty-load affordance is visible. Neither of those resolves instantly — they both depend on Apex calls returning. A single snapshot of the DOM might catch a state where neither is true yet, because we're still loading. The toPass pattern re-runs the inner function every hundred milliseconds until it passes, up to the timeout. It's your go-to for wait for one of these async outcomes to become true. Simpler than stitching together multiple toBeVisible calls.

Tests four, five, and six — Group By. Each tests one grouping mode. Package Type, None, and Reason Code.

The None test is the most precise. We collapse into a single group called All Items and assert exactly one group with that exact label. That tight assertion locks in the None branch of the component's groupLines function.

The Package Type and Reason Code tests use weaker assertions — the labels aren't what other modes would produce. That weakness is deliberate. We don't know what package types or reason codes the seeded data has, so we can't assert specific labels. We assert a contract that must hold regardless of data — no sellability labels when grouping by package. This is the general rule: assert what must be true across any reasonable data set; leave what's data-dependent for a specialized test.

Tests seven and eight — Sort By. These are the trickiest in the file.

Test seven verifies Item Name A-to-Z ordering. To verify ordering, we need at least two rows, and we need to know what correct order means. So we collapse to a single group, set sort to Item Name, pull all the item link texts into a JS array, sort that array locally using localeCompare, and assert the DOM array equals the locally-sorted array. If the org has only one row, we return early — no useful assertion.

Test eight verifies that switching to Quantity sort does something. What we don't do is assert the new order is numerically descending — that would require parsing quantity strings like five cs middle-dot ten ea, and that parser would be brittle. Instead, we assert the weaker contract — after sorting, the list contains exactly the same items as before, potentially in a different order. This still catches the bugs that matter. If the sort breaks and loses items or duplicates them, this test fails. If the sort somehow produces the identical order because all quantities happen to match the alphabetical order, this test passes — which is acceptable because the component's behavior is correct in that case.

Lesson here — when assertion precision trades off against data dependence, err on the side of the weaker assertion that still catches the real regressions.

Test nine — Refresh. This test validates that clicking refresh preserves the user's warehouse and truck selection. The general pattern is capture-before-and-after. Read the warehouse value, read the truck name, click refresh, read both again, assert they're equal.

Two subtleties. First, extracting the combobox's selected value is annoying. Lightning combobox doesn't expose a clean attribute. We try dot inputValue on an inner input element; if that fails, we fall back to textContent on the combobox itself. The try-and-fall-back pattern keeps the test resilient across SLDS versions.

Second — waiting for the refresh cycle. The button becomes disabled while loading, then re-enables. We want to wait for the whole cycle. But very fast refreshes can finish before Playwright observes the disabled state, so we wrap the wait for disabled in a catch block. We only actually care that the button ends up enabled.

Test ten — the read-only contract. This is the core contract of the entire LWC. The load summary is read-only. Users cannot edit quantity, cannot add rows. We lock that contract in a test by querying the main panel for any editable input element — text inputs, number inputs, textareas — and asserting the count is zero. If someone in a future PR drops an editable input into the main panel, this test breaks immediately. That's the point.

Notice what we exclude. We exclude lightning-input entirely, because the group-by and sort-by comboboxes internally render something that looks like an input. Including them would false-positive.

That's the whole file.

Now, patterns to take with you to every Playwright-on-Salesforce spec you write.

First — always use data-testid for locators. Never use text content or SLDS class names. Salesforce changes SLDS markup between releases. Your test breaks. Adding data-testid to the LWC is free at author time and stable forever. Insist on it in code review.

Second — wait for an affordance, not a timeout. waitForTimeout three thousand milliseconds is a code smell. Always wait for something observable — an element becoming visible, a text appearing, a button becoming enabled. If you find yourself reaching for a raw timeout, the LWC is missing an observable state. Ask the author to add one.

Third — helpers for shared setup, not shared assertions. Every test's assertions should read top-to-bottom like the test's intent. Shared setup is fine to hide in helpers. Shared assertions hide what the test actually proves.

Fourth — custom messages on expect calls. Especially for assertions that depend on seed data. You are writing for a teammate who hasn't thought about this test in six weeks. Save them time.

Fifth — use toPass for async disjunctions. A or B becomes true after some delay is best expressed as a single retrying assertion, not a chain of multiple timeouts.

Sixth — empty-state resilience. For containers that are empty by design, use toBeAttached, not toBeVisible. For ordering assertions, return early when the data set is too small to prove anything. Document what seed data the test requires at the top of the file.

If you do exercises from the guide, pay particular attention to exercise four — introducing a deliberate bug. Watching tests fail and checking whether the failure messages are useful is the fastest way to calibrate your mental model of what these tests are really asserting.

That's the end of the walkthrough. Close your editor, take a break, come back tomorrow, and try to write this file from scratch from memory. You won't get it right the first time, but the patterns you remember are the ones worth keeping.
