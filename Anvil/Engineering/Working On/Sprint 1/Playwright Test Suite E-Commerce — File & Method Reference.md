

A compact map of what each Playwright file does and the role of every test/helper inside it.

---

## `playwright.config.ts`
Top-level Playwright config. Loads `.env`, defines projects, timeouts, and global `use` options.

| Section              | Role                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `dotenv.config(...)` | Loads `SF_LOGIN_URL`, `SF_USERNAME`, `SF_PASSWORD`, optional `SF_BASE_URL` from `.env`.                   |
| `use.baseURL`        | Origin used by relative `page.goto('/')`. Reads `SF_BASE_URL` or derives the origin from `SF_LOGIN_URL`.  |
| `use.viewport`       | Forces a desktop viewport (`1440×900`) so the desktop nav renders (mobile drawer stays hidden).           |
| `projects: setup`    | Runs only `*.setup.ts` first; produces the saved auth state.                                              |
| `projects: chromium` | Authenticated tests; reuses `playwright/.auth/user.json` so they skip the login form. Depends on `setup`. |
| `projects: no-auth`  | Unauth tests (`*.unauth.spec.ts`, `*.debug.spec.ts`). No storageState, no setup dependency.               |

---

## `tests/auth/login.setup.ts`
The **one-time login** that every authenticated test piggy-backs on. Runs as the `setup` project.

| Method / step | What it does |
|---|---|
| `dotenv.config(...)` | Loads creds from `.env`. |
| `setup('authenticate', ...)` | The single test in this file. Logs in via the Experience Cloud form and saves session cookies. |
| `page.goto(loginUrl, ...)` | Loads the SF login form. |
| `getByLabel('Username').fill(...)` / `getByLabel('Password').fill(...)` | Fills the SLDS `lightning-input` wrappers (so LWC change events fire). |
| `getByRole('button', { name: 'Log In' }).click()` | Submits the login form. |
| `expect(...Shop link...).toBeVisible(...)` | Confirms the authenticated site rendered (= cookies are set). |
| `page.context().storageState({ path: authFile })` | Persists auth state to `playwright/.auth/user.json` for reuse. |

---

## `tests/auth/debug-login.debug.spec.ts`
Diagnostic-only spec. Runs in the `no-auth` project. Use when login selectors break to inspect what's actually on the page.

| Step | What it does |
|---|---|
| `test.use({ storageState: undefined })` | Forces an unauthenticated browser session. |
| `page.goto(SF_LOGIN_URL)` | Opens the login form. |
| `page.waitForTimeout(5000)` | Lets Lightning fully bootstrap before scraping the DOM. |
| `page.screenshot(...)` | Saves `test-results/login-page.png` for visual debugging. |
| `INPUTS` dump | Logs every `<input>` (tag, id, name, type, placeholder, class). |
| `BUTTONS` dump | Logs every `<button>` and `input[type=submit]`. |
| `IFRAMES` dump | Catches any iframe-nested login forms. |
| `console.log('FINAL URL', ...)` | Reveals any redirect chain (e.g., `/login?ec=302&startURL=...`). |

---

## `tests/login-page.unauth.spec.ts`
Smoke test that the login page renders correctly **without auth**. Runs in `no-auth`.

| Test | What it asserts |
|---|---|
| `renders username, password, and submit` | The Username field, Password field, and "Log In" button are all visible on the login URL. |

---

## `tests/walkthrough.spec.ts`
Authenticated end-to-end walkthrough of the navigation menu. Runs in `chromium` (uses saved auth).

| Helper / Hook / Test                                 | What it does                                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `desktopNavLink(page, label)`                        | Helper. Returns the desktop-nav `<a>` inside `.nav-items` matching the label exactly. Avoids the hidden mobile-drawer link that shares the same accessible name. |
| `beforeEach`                                         | Goes to `/`, asserts no redirect to `/login` (= still authenticated).                                                                                            |
| `navigation menu shows the expected top-level links` | Verifies all five labels — Home, Shop, Promotions, Order History, Support — are visible in the desktop nav.                                                      |
| `search input is present in the navigation`          | Asserts a `searchbox` role is rendered in the nav.                                                                                                               |
| `Shop link navigates to the Shop page`               | Clicks Shop → expects a "Shop All Products" heading.                                                                                                             |
| `Order History link navigates to order history`      | Clicks Order History → URL contains `order`.                                                                                                                     |
| `Promotions link navigates to promotions`            | Clicks Promotions → URL contains `promotion`.                                                                                                                    |

---

## `tests/logged-in.spec.ts`
Lightweight authenticated smoke tests. Runs in `chromium`.

| Test | What it asserts |
|---|---|
| `can access the site after login` | Goes to `/`, confirms it didn't bounce back to `/login`, and the body is not empty. |
| `homepage loads with content` | Goes to `/` and saves a full-page screenshot to `test-results/homepage.png` for visual confirmation. |

---

## `.env` (referenced, not a test file)
| Var | Purpose |
|---|---|
| `SF_LOGIN_URL` | Where login.setup.ts navigates. |
| `SF_USERNAME` / `SF_PASSWORD` | Credentials. **Quote values containing `#`** — `dotenv` treats `#` as a comment marker. |
| `SF_BASE_URL` *(optional)* | Override for `baseURL`; otherwise derived from `SF_LOGIN_URL`'s origin. |

---

## How the pieces connect

```
[no-auth project]  →  debug-login.debug.spec.ts   (diagnostic)
                  →  login-page.unauth.spec.ts   (login form smoke)

[setup project]    →  auth/login.setup.ts        (logs in, writes user.json)
                                                       │
                                                       ▼
[chromium project] →  walkthrough.spec.ts        (reads user.json, skips login)
                  →  logged-in.spec.ts           (reads user.json, skips login)
```

## Common commands

```bash
npx playwright test --headed         # Run all tests with browser visible
npx playwright test --ui             # Interactive UI mode
npx playwright test walkthrough      # Run only the walkthrough file
npx playwright show-report           # Open last HTML report
```
