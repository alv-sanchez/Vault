---
title: "Passwordless Login — Setup Guide (Login Discovery)"
ticket: BMS-3926
component: EcomLoginDiscoveryHandler (OHFY-eCommerce)
applies_to: E-Commerce Retailer Portal (Experience Cloud / LWR)
updated: 2026-06-28
updated_by: Alvaro Sanchez
status: current
tags: [ecom, passwordless-login, login-discovery, setup, experience-cloud, retailer-portal]
related_notes:
  - "[[Passwordless Login — Retailer Portal (Summary & Analysis)]]"
---

# Passwordless Login — Setup Guide (Login Discovery)

> **What this is.** The retailer portal logs users in **without a password**: they enter their email, Salesforce emails a verification code, they enter it, and they're in. This replaces the original custom-controller approach (which could not work in guest context). See [[Passwordless Login — Retailer Portal (Summary & Analysis)]] for the *why*.

## How it works (architecture)

```
Login page (Login Discovery Page)
   → user enters email
   → EcomLoginDiscoveryHandler.login()   ← runs as the "Execute Login As" user (elevated, NOT the guest)
        → resolves the unique active User by email
        → Site.passwordlessLogin(userId, [EMAIL], startUrl)   ← emails the verification code
   → user is redirected to the "enter verification code" page
   → user enters the code → authenticated → lands on the storefront
```

The handler runs in an **elevated context**, which is the whole point: a guest user cannot read other `User` records (Secure Guest User Record Access), so the lookup must not run as the guest. Login Discovery executes the handler as the configured **Execute Login As** user.

---

## 1. One-time site configuration

> Do this once per org/site. Requires the `ohfy.EcomLoginDiscoveryHandler` Apex class to be deployed (ships with **OHFY-eCommerce**).

1. **Setup → Digital Experiences / All Sites → (E-Commerce site) → Administration → Activate** the site if it isn't already active.
2. **Workspaces → Administration → Login & Registration → Login Page Setup:**
   - **Login Page Type** → select **`Login Discovery Page`** (NOT "Experience Builder Page").
   - **Login Prompt** → e.g. `Enter your email`.
   - **Login Discovery Handler** → select **`EcomLoginDiscoveryHandler`** (in a namespaced org it appears as `ohfy.EcomLoginDiscoveryHandler`).
     - *If you only see `Create a Login Discovery Handler`:* that link scaffolds Salesforce's auto-generated template. Don't use it for the real setup — it queries `TwoFactorMethodsInfo`, which isn't available in every org and throws at runtime. Use `EcomLoginDiscoveryHandler` instead.
   - **Execute Login As** → an **active, privileged user** (System Administrator / integration user) that can read `User` records. **Do not** pick the guest user.
   - Save.
3. **Open the site in Experience Builder → Publish.**

### Org-level prerequisites (verify once)
- **Email Deliverability** = **All email** (Setup → Email → Deliverability). Sandboxes/scratch default to *System email only*, which silently drops verification emails.
- The site's **Network is Live**.
- **Identity Verification** allows **Email** as a verification method (Setup → Identity Verification).
- **My Domain** deployed.

### Guest profile (E-Commerce Profile)
Needs **nothing custom** for login — the handler runs elevated, not as the guest. Do **not** grant the guest `User` read, the handler class, or `Bypass_Enhanced_Security`. (Storefront object/field/Apex access belongs on the authenticated **Ohanafy Community User** profile, not the guest.)

---

## 2. User onboarding prerequisite — email must be verified

**A user's email must be verified before they can use passwordless login.** This is enforced by Salesforce: `Site.passwordlessLogin` will not send a code to an unverified email.

The flow when a retailer is onboarded:

1. **Admin creates the user** — a Contact under an Account, then an Experience Cloud user for that Contact (users are admin-created internally; there is no self-service registration).
2. On user creation, a **"verify your email" message is sent automatically** (via `UserTriggerService` → `Q_SendEmailVerification` → `System.UserManagement.sendAsyncEmailConfirmation`, which requires the **Live E-Commerce network**).
3. **The user clicks the verification link** in that email. This flips `HasUserVerifiedEmail` to true.
4. From then on, the user can log in passwordlessly.

> If a user reports "Check your entry" or no code, the usual cause is **email not yet verified** (`HasUserVerifiedEmail = false`) — have them click the verification email first, and confirm deliverability is *All email*.

---

## 3. End-user login flow (after onboarding)

1. Go to the storefront login page.
2. Enter email → **Continue / Log In**.
3. A **verification code** is emailed to that address.
4. The page redirects to **"enter verification code"** — enter the code.
5. Authenticated → redirected to the storefront home.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "The Apex request is invalid" (old flow) | n/a — that was the retired guest-side controller | Use Login Discovery (this guide) |
| "Check your entry. If you still can't log in, contact your E-Commerce administrator." | Handler threw `Auth.LoginDiscoveryException` | See sub-rows below |
| └ email not verified | `HasUserVerifiedEmail = false` | User clicks the verification email; ensure deliverability = All email |
| └ no unique user | 0 or >1 active users with that email | Ensure exactly one active user has the email |
| └ `TwoFactorMethodsInfo is not supported` | Using the **auto-generated** handler in an org without that object | Switch the handler to `EcomLoginDiscoveryHandler` |
| No code email arrives | Deliverability = System email only | Setup → Email → Deliverability → All email |
| "To access this page, you have to log in to E-Commerce" on `/` | Not authenticated yet (home is login-required) | Complete the email → code login; access the community at its path, not the bare domain root |

### How to confirm the handler is working (debug)
Set a debug trace on the **Execute Login As** user, submit an email, and read the `DiscLoginApexExec` log. A healthy run shows:
```
CODE_UNIT_STARTED  ohfy.EcomLoginDiscoveryHandler.login
SOQL: SELECT Id FROM User WHERE Email = :email AND IsActive = TRUE LIMIT 2  →  Rows:1
System.Site.passwordlessLogin(Id, [EMAIL], String)   (called, no exception)
CODE_UNIT_FINISHED  (Status: Success)
```
And `LoginHistory` for the user shows `Passwordless Login required` → `Success`.

---

## Reference
- **Apex:** `OHFY-eCommerce/.../classes/auth/EcomLoginDiscoveryHandler.cls` (`global … implements Auth.LoginDiscoveryHandler`) + `_T`.
- **Ticket:** BMS-3926.
- **Retired:** `PasswordlessLoginController`, `Ecom_UI_Wrappers.initiatePasswordlessLogin`, the `ecomLoginPasswordless` LWC (replaced by the Login Discovery page).
