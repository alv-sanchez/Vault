---
title: "Passwordless Login — Retailer Portal (Summary & Analysis)"
org: gulfPartial (Gulf Distributing, partial sandbox)
site: E-Commerce (Experience Cloud / LWR)
updated: 2026-06-25
updated_by: Alvaro Sanchez
status: root-cause-fixed-pending-e2e-confirmation
tags: [ecom, passwordless-login, guest-profile, apex-class-access, retailer-portal, experience-cloud]
related_notes:
  - "[[Ohanafy Community User Profile - Object Permissions]]"
scope_note: "Profile *deployment* (the full managed-org profile) is a SEPARATE matter — see that work, not covered here."
---

# Passwordless Login — Retailer Portal (Summary & Analysis)

> **Scope.** This note covers the **passwordless login** failure on the E-Commerce Retailer Portal and its fix. The broader **profile-deployment** problem (deploying `Ohanafy Community User.profile-meta.xml` to a partial sandbox) is a **separate matter** and is intentionally out of scope here.

## TL;DR

The retailer-portal passwordless login failed because the **guest profile (`E-Commerce Profile`) was missing Apex class access to `ohfy.Ecom_UI_Wrappers`** — the facade class the login LWC actually calls. Only the *delegate* controllers (`PasswordlessLoginController`, `RegisterController`) were enabled, which do nothing on their own. The platform rejected the guest's Apex request with **HTTP 400 before any code ran**, so no verification email was ever sent. Granting `ohfy__Ecom_UI_Wrappers` to the guest profile cleared the 400. **End-to-end email delivery has not yet been re-confirmed** after the fix.

---

## ✅ What was done

1. **Reproduced & isolated the failure** on `gulfPartial` using the live storefront login page (custom `ecomLoginPasswordless` LWC — single email field + "Continue / We'll send a verification code").
2. **Verified the code-path prerequisites that PASS** for the test user `alvaro.sanchez@ohanafy.com`:
   - `User.IsActive = true`, `HasUserVerifiedEmail = true`, `ContactId` populated, profile `Ohanafy Community User`.
   - `Network` **E-Commerce = Live**.
   - Org **Email Deliverability = "All email"** (ruled out the classic sandbox "System email only" trap).
3. **Pinpointed the root cause** via two independent signals:
   - Guest-user **debug logs were empty** (only `USER_INFO`, even at `APEX_CODE=FINEST`) → our controller never executed.
   - Browser **Network tab showed `…/webruntime/api/apex/execute?…asGuest=true` → HTTP 400** → the request was rejected at the gateway, before Apex.
   - The enabled-classes list on the guest profile did **not** include `Ecom_UI_Wrappers`.
4. **Applied the fix** — deployed a minimal profile granting `ohfy__Ecom_UI_Wrappers` Apex class access to the **E-Commerce (guest) Profile** on `gulfPartial`. Deploy **succeeded**.

## ⏳ What could NOT be done / still open

- **End-to-end confirmation of the verification email** after the class-access fix was **not verified in-session** — the fix was deployed and a retry requested, but receipt of the code email was not confirmed. (See "If email still doesn't arrive" below.)
- **Persisting the grant to source** — the fix was deployed **directly to `gulfPartial`**, not committed to `org-metadata/experience-site/`. It will be **lost on the next profile push** unless added to source + deploy automation.
- **`SetupEntityAccess` is not queryable** in this org's Tooling API, so guest-profile Apex access can't be verified via SOQL — only via the Setup UI, a targeted deploy, or live behavior.
- **Profile deployment** (the full managed-org profile) — **separate matter, not addressed here.**

---

## 🔬 Analysis — what's happening

### The call chain
```
ecomLoginPasswordless (LWC)
  → @salesforce/apex/Ecom_UI_Wrappers.initiatePasswordlessLogin   ← guest must have access to THIS class
      → PasswordlessLoginController.initiatePasswordlessLogin
          → (SOQL User in SYSTEM_MODE) → Site.passwordlessLogin(userId, [EMAIL], '/')
```
Apex class-level security gates **only the entry-point class the LWC imports** (`Ecom_UI_Wrappers`). Downstream `@namespaceAccessible` delegates run in the same context and are **not** separately gated — so enabling the delegates without the facade does nothing.

### Why it presented so confusingly
- **Anti-enumeration messaging.** `initiatePasswordlessLogin` returns the same generic *"If an account exists for this email, a verification code has been sent. Please check your inbox."* on **every** path — success, no-such-user, unverified email, or caught exception. The UI looks identical whether or not an email was sent. **Never trust the on-screen message** — it is intentionally uninformative.
- **Empty guest debug logs.** A 400 at the API gateway means the transaction never entered Apex, so the log contains only `USER_INFO` even at FINEST. Empty log + on-screen "success" = look at the **browser Network tab**, which is where the real 400 surfaced.

### Silent gates inside the controller (for reference)
The email is only sent when ALL hold; otherwise the generic message is thrown and `Site.passwordlessLogin` is never called:
1. A `User` exists with `Email = <input>`, `IsActive = true`, **and `ContactId != null`**.
2. `HasUserVerifiedEmail = true`.
3. `Site.passwordlessLogin(...)` returns a redirect (requires the **site** to be configured for passwordless email verification).

### If email STILL doesn't arrive (post-fix hypotheses, ranked)
1. **Site Login & Registration config.** If the Experience site's login page isn't configured for **passwordless login / email verification method**, `Site.passwordlessLogin` returns `null` → caught → generic message, no email. *(Experience Workspaces → Administration → Login & Registration.)* — **most likely remaining cause.**
2. **Identity verification settings.** Org/site identity-verification method for "Login with verification code" not enabled.
3. **Email template / sender.** No Org-Wide Email Address configured (verification codes use the system/identity sender, so usually fine — but worth noting). Deliverability already = All email.
4. **Wrong/unverified user.** Only matters if testing with an email other than `alvaro.sanchez@ohanafy.com` (e.g., a freshly self-registered user whose `HasUserVerifiedEmail` is still `false`).

> Note: `Q_SendEmailVerification` (`System.UserManagement.sendAsyncEmailConfirmation`, triggered on user insert via `UserTriggerService`, requires Network **E-Commerce = Live**) handles the **registration email-confirmation**, which is *separate* from the passwordless **login** verification code sent by `Site.passwordlessLogin`.

---

## Reference data (gulfPartial)

| Item | Value |
|---|---|
| Guest user | **E-Commerce Site Guest User** `005WE00000iKWNNYA4` (profile `E-Commerce Profile`) |
| Facade class | `ohfy.Ecom_UI_Wrappers` `01pWE00000CaoAhYAJ` — **the grant that was missing** |
| Delegates (already enabled) | `ohfy.PasswordlessLoginController`, `ohfy.RegisterController` |
| Test user | `alvaro.sanchez@ohanafy.com` (verified, active, has Contact) |
| Network | E-Commerce = **Live** |
| Deliverability | **All email** |
| Login LWC | `ecomLoginPasswordless` → `Ecom_UI_Wrappers.initiatePasswordlessLogin` |

## Next actions
- [ ] Re-test login end-to-end and confirm the code email arrives.
- [ ] If no email: check Experience site **Login & Registration → passwordless / email verification method** (hypothesis #1).
- [ ] Add `ohfy__Ecom_UI_Wrappers` guest-profile class access to **source** (`org-metadata/experience-site/`) + deploy automation so it survives profile pushes.
