# Relating a Contact to Multiple Accounts (Salesforce admin guide)

How to link one contact to several businesses so the ecom **account switcher** (BMS-4258) shows those businesses, and how to verify the data is set up correctly.

This uses Salesforce's native **Contacts to Multiple Accounts** feature (the `AccountContactRelation` object). No custom objects.

---

## The model in one picture

```
Contact "Ecom Tester"
   ├── AccountId = Customer Account 0        ← the PRIMARY account (a "direct" relation)
   ├── AccountContactRelation → Dixie Bar & Grill      (an "indirect" relation)
   └── AccountContactRelation → Riverside Bottle Shop  (an "indirect" relation)
```

- Every contact has exactly **one primary account** — the lookup `Contact.AccountId`. Salesforce auto-creates a matching `AccountContactRelation` for it with **`IsDirect = true`**.
- Each **additional** business is a separate `AccountContactRelation` row with **`IsDirect = false`** (an "indirect" relationship).
- The storefront switcher lists every **active** related account (direct + indirect).

---

## Step 1 — Enable the feature (one-time, per org)

**Setup → Account Settings → Edit → check "Allow users to relate a contact to multiple accounts" → Save.**

This creates the `AccountContactRelation` object in the org.

> **Scratch org caveat:** on a scratch org this checkbox only works if the org was *created* with the `ContactsToMultipleAccounts` feature in its scratch definition. The checkbox can show "checked" but the object still won't exist if the feature wasn't there at creation. On production/sandbox orgs the checkbox alone is enough.

## Step 2 — Make the related lists visible (one-time, per layout)

The relationship UI lives on related lists that fresh layouts often don't show:

- **Setup → Object Manager → Contact → Page Layouts → (your layout) → drag the "Related Accounts" related list onto the layout → Save.**
- (Optional, mirror) **Object Manager → Account → Page Layouts → add the "Related Contacts" related list.**

> **Why you don't see the contact under "Contacts" on a secondary account:** the standard **"Contacts"** related list only shows contacts whose *primary* account is that account (`Contact.AccountId`). Indirectly-related contacts appear under the separate **"Related Contacts"** list. This is expected — not a bug.

## Step 3 — Relate the contact to more businesses

**From the contact (recommended):**

1. Open the **Contact** record.
2. On the **Related Accounts** related list, click **Add Relationship**.
3. Pick the **Account**, optionally set **Roles** (e.g., Decision Maker, Buyer), and Save.
4. Repeat for each additional business.

**From the account:** open the **Account → Related Contacts → Add Relationship → pick the contact.**

Each "Add Relationship" creates one indirect `AccountContactRelation`. The contact's primary account (the direct relation) is created automatically and shouldn't be re-added.

---

## `AccountContactRelation` field reference

| Field | Meaning | Notes for the switcher |
|---|---|---|
| `ContactId` | The contact | Who is being related. |
| `AccountId` | The related business | One per relationship row. |
| `IsDirect` | `true` = the contact's **primary** account; `false` = an additional (indirect) business | The switcher marks the direct one as primary; both kinds appear in the list. |
| `IsActive` | Whether the relationship is active | The switcher only lists **active** relations. Set `false` to hide a business without deleting. |
| `Roles` | Multi-select picklist (Decision Maker, Buyer, …) | Optional; not used by the switcher today. |
| `StartDate` / `EndDate` | Relationship validity window | Optional; informational. |

**Rules to know:**
- You **cannot** create a second relationship for the same Account+Contact pair (no duplicates).
- You **cannot** delete the **direct** relation directly — change the contact's primary account instead (the old primary becomes indirect, per the Account Settings option).
- Deactivating (`IsActive = false`) is the soft way to remove a business from the switcher.

---

## How to verify it's set up right

### A. In the Salesforce UI
- Open the **Contact → Related Accounts** list. You should see **all** the businesses: the primary one (marked direct) plus each added business.
- Open a **secondary Account → Related Contacts** list. The contact should appear there (it will **not** appear under the plain "Contacts" list — that's correct).

### B. Via SOQL (Developer Console or `sf data query`)

Scoped to one contact:
```sql
SELECT Account.Name, IsDirect, IsActive
FROM AccountContactRelation
WHERE ContactId = '<the contact id>'
ORDER BY IsDirect DESC
```
Expect one row per business: one `IsDirect = true` (primary) and one per additional business with `IsDirect = false`, all `IsActive = true`.

```bash
sf data query -q "SELECT Account.Name, IsDirect, IsActive FROM AccountContactRelation WHERE ContactId='<id>'" -o <org-alias>
```

Full field set (every relationship in the org — useful for an admin audit):
```sql
SELECT Id,
       AccountId, Account.Name,
       ContactId, Contact.Name, Contact.Email,
       IsDirect,
       IsActive,
       Roles,
       StartDate, EndDate,
       CreatedDate, LastModifiedDate
FROM AccountContactRelation
ORDER BY IsDirect DESC, Account.Name
```
Note: there is no `Name` field on `AccountContactRelation` itself — use the relationship fields `Account.Name` / `Contact.Name`. `Roles` is a multi-select picklist (semicolon-delimited string, or null).

### C. In the storefront (the end-to-end check)
- Log in as the community user tied to that contact.
- **Desktop:** the nav bar shows the active business; a multi-account contact gets a dropdown listing all businesses.
- **Mobile:** the hamburger menu shows a "Switch Business" dropdown.
- Switching reloads the storefront scoped to the selected business (shop/pricing, cart, order history, profile, delivery days).

> **Ecom visibility requirement:** for the community user to actually open a business it's *indirectly* related to, that Account must be **readable** by the community user. `AccountContactRelation` links them but does **not** grant record access on its own — the ecom setup sets the external Account org-wide default to Read/Write so related accounts are visible. If a switch shows blank/placeholder data, check Account sharing for the community profile.

---

## Quick scripted setup (dev/test orgs)

For dev/test, `orgScripts/e-commerce/link-test-user-accounts.apex` links the ecom test contact to additional businesses automatically (real seed accounts, or cloned mock businesses when none are spare). It's idempotent and run by `setup-site.sh` step 10.5.

---

## Common gotchas

| Symptom | Cause / fix |
|---|---|
| Contact not under "Contacts" on a secondary account | Expected — look under **Related Contacts** (indirect relations live there). |
| "Related Accounts" list missing on the contact | Add it to the Contact page layout (Step 2). |
| Switcher doesn't appear in the storefront | Contact has only one related account (single-account = name shown, no switch), or the feature is off. |
| Switching shows blank / placeholder business | Community user can't read the related Account — check external Account OWD / sharing for the community profile. |
| `AccountContactRelation` "not supported" in SOQL | Feature not provisioned (scratch org created without the `ContactsToMultipleAccounts` feature). |
