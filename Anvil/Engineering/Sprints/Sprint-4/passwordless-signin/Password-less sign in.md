# Passwordless Sign-In Setup

## Overview

Passwordless login for the Ohanafy Retailer Portal. Users enter their email, receive a verification code, and are logged in without a password.

## Architecture

- **LWC**: `ecomLoginPasswordless` (OHFY-eCommerce-UI)
- **Apex Controller**: `PasswordlessLoginController` (OHFY-eCommerce) — calls `Site.passwordlessLogin()` with `Auth.VerificationMethod.EMAIL`
- **Wrapper**: `Ecom_UI_Wrappers.initiatePasswordlessLogin()` — passthrough to controller
- **Discovery Handler**: `HeadlessLoginDiscoveryHandler` (OHFY-eCommerce) — implements `Auth.LoginDiscoveryHandler` for the built-in Login Discovery flow
- **Verification Method**: `Auth.VerificationMethod.EMAIL` — sends a one-time code to the user's email

## Login Flow

1. User enters email in the LWC
2. LWC calls `Ecom_UI_Wrappers.initiatePasswordlessLogin(email)`
3. Apex finds the community user by email, calls `Site.passwordlessLogin(userId, [EMAIL], startUrl)`
4. Salesforce sends a verification code to the user's email
5. User is redirected to Salesforce's verification page to enter the code
6. After successful verification, user is logged in and redirected to the site

## Setup Steps (Scratch Org)

### 1. Deploy the code

Deploy both packages in order (backend first):

```bash
sf project deploy start -d OHFY-eCommerce/force-app -o <alias> --ignore-conflicts
sf project deploy start -d OHFY-eCommerce-UI/force-app -o <alias> --ignore-conflicts
```

### 2. Configure Login Page Setup

In the scratch org:

1. **Setup > Digital Experiences > All Sites > [Your Site] > Administration**
2. Go to **Login & Registration**
3. Under **Login Page Setup**:
   - Set **Login Page Type** to **Experience Builder Page**
   - Set the page to **Login** (the custom LWC login page)
4. Check **Allow employees to log in directly to an Experience Cloud site**
5. Under login options, check **Ohanafy username and password**
6. Save

### 3. Verify Email Deliverability

1. **Setup > Email > Deliverability**
2. Set **Access to Send Email** to **All Email**
3. Save

### 4. Verify Community User's Email (CRITICAL)

`Site.passwordlessLogin(EMAIL)` requires `HasUserVerifiedEmail = true` on the User record. Programmatically-created community users default to `false`.

To fix, run this in anonymous Apex (Execute Anonymous / Developer Console):

```apex
User u = [SELECT Id, Email FROM User WHERE Email = '<community-user-email>' AND IsActive = true LIMIT 1];
Network net = [SELECT Id FROM Network WHERE Name = '<your-site-name>' LIMIT 1];
System.UserManagement.sendAsyncEmailConfirmation(u.Id, null, net.Id, '/');
System.debug('Verification email sent to ' + u.Email);
```

The community user must then:
1. Check their inbox (and **spam folder**) for the verification email from Salesforce
2. Click the verification link in the email

You can confirm it worked:

```apex
User u = [SELECT HasUserVerifiedEmail FROM User WHERE Email = '<community-user-email>' AND IsActive = true LIMIT 1];
System.debug('HasUserVerifiedEmail: ' + u.HasUserVerifiedEmail); // should be true
```

### 5. Publish the Experience Cloud Site

After deploying code and configuring settings, publish the site in **Experience Builder** for changes to be visible on the live storefront.

## Headless Identity Configuration (optional)

These settings are in **Login & Registration > Headless Identity Configuration**. They are for external REST API clients, not required for the LWC-based flow:

- **Headless Passwordless Login**: Enable if you want to support off-platform passwordless login
- **Require reCAPTCHA**: Salesforce requires either reCAPTCHA or client authentication — cannot disable both
- **User Discovery Handler / Run As**: Only needed for the headless REST API flow, not for the LWC `@AuraEnabled` flow

## Identity Verification Settings

In **Setup > Security > Identity Verification**:

- Ensure **"Prevent identity verification by email when other methods are registered"** is **unchecked**
- Email verification is available by default unless explicitly blocked by this checkbox

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "This user doesn't have access to this verification method" | `HasUserVerifiedEmail = false` on the User record | Run `sendAsyncEmailConfirmation` (step 4 above), user clicks the link |
| "No account found for this email address" | No active community user with that email and a ContactId | Check User record: must be active, have ContactId, and email must match |
| "Unable to initiate login" | `Site.passwordlessLogin()` returned null — usually means not running in site context | Ensure the method is called from an `@AuraEnabled` controller on the Experience Cloud site |
| Redirects to password page instead of sending code | `Auth.VerificationMethod.PASSWORD` is set instead of `EMAIL` | Check `PasswordlessLoginController.cls` — method should be `Auth.VerificationMethod.EMAIL` |
| Verification email not received | Email deliverability set to "System email only" or domain not verified | Setup > Email > Deliverability > set to "All Email"; check spam folder |

## Files Changed

| File | Package | Change |
|------|---------|--------|
| `PasswordlessLoginController.cls` | OHFY-eCommerce | New — initiates passwordless login via `Site.passwordlessLogin(EMAIL)` |
| `PasswordlessLoginController_T.cls` | OHFY-eCommerce | New — tests for blank/null/unknown email |
| `HeadlessLoginDiscoveryHandler.cls` | OHFY-eCommerce | Updated — changed verification method from PASSWORD to EMAIL |
| `Ecom_UI_Wrappers.cls` | OHFY-eCommerce-UI | Updated — replaced `debugLoginEmail` with `initiatePasswordlessLogin` |
| `Ecom_UI_Wrappers_T.cls` | OHFY-eCommerce-UI | Updated — tests for `initiatePasswordlessLogin` |
| `ecomLoginPasswordless.html` | OHFY-eCommerce-UI | Updated — email-only form, removed password step and register link |
| `ecomLoginPasswordless.js` | OHFY-eCommerce-UI | Updated — single-step flow calling `initiatePasswordlessLogin` |
| `ecomLoginPasswordless.test.js` | OHFY-eCommerce-UI | Updated — tests for simplified passwordless UI |
