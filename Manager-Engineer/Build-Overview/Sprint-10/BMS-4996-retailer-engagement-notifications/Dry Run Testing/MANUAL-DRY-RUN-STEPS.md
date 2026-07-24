---
kind: manual-dry-run-runbook
epic: BMS-4996 — Retailer Engagement Notifications
sprint: Sprint 10
org: bms-4996-notif (00DO200000NJZRTMA5)
site: E-Commerce (Live) — https://ruby-efficiency-1835-dev-ed.scratch.my.site.com/vforcesite
last_updated: 2026-07-23
---

# 🧪 Manual Dry-Run Runbook — BMS-4996

> A human walkthrough, grouped by each child ticket's **acceptance criteria (verbatim from Jira)**.
> Every scenario below tells you: **what it proves → the steps → the expected result → coverage status.**
> Read the **Limitations** section first — some ACs are blocked or out of built scope, and this file says so honestly.

---

## What the dry run is actually testing

The epic's thesis: *drive order completion without manual rep follow-up.* So each ticket's test reduces to
**"did the right notification reach the right party at the right moment, and is it logged / attributable?"**

| Ticket | The question it answers |
| --- | --- |
| **BMS-3921** | When a cart goes stale, does the **rep** get an in-platform alert (deduped + logged)? |
| **BMS-3931** | When an order's status advances, does the **retailer** get the matching notification, and does the order-history UI reflect it? |
| **BMS-4073** | Do **order-confirmation** and **abandoned-cart** notifications still fire per contact preference? (regression validation) |
| **BMS-4537** | When a reminder leads to a purchase, is that recovery **attributed** and **reportable**? |

---

## Environment & access

| Thing | Value |
| --- | --- |
| Org alias | `bms-4996-notif` |
| Admin login | `sf org open -o bms-4996-notif` |
| Storefront | https://ruby-efficiency-1835-dev-ed.scratch.my.site.com/vforcesite |
| Storefront login | https://ruby-efficiency-1835-dev-ed.scratch.my.site.com/vforcesite/login |
| Test community user | `ecomtest_00do200000njzrt@example.com` / `Ecomtest1!` |

---

## ⚠️ Limitations — read before you start

1. **SMS is not demonstrable.** Twilio ExternalCredential is unconfigured on this org. Every SMS row logs **`Skipped`** by design. Email + In-App + logs are the proof channels.
2. **Storefront (Track B) is blocked until a perm-set fix.** `Ohanafy_Ecom_Community_Access` failed to deploy (it references the missing Twilio credential), so it does **not exist** in the org and the test community user has **no ecom Apex access**. The retailer-facing UI ACs cannot be clicked through until this is fixed — see **[Unblock Track B](#unblock-track-b-storefront)**.
3. **Reconciled 2026-07-23 — several items previously listed here as "not built" are now BUILT** (second build wave; see HANDOFF.md → "Second build wave"):
   - **BMS-3931 cutoff banner (AC3) — BUILT** in `navigationMenu.js`: when the cutoff has passed it now shows the next available delivery cycle (+7d) instead of hiding the banner.
   - **BMS-3931 est. delivery ETA + driver name (AC1) — BUILT** in `OrderHistoryController` (`stampRouteScheduledDelivery`, SYSTEM_MODE read of `Delivery__c`).
   - **BMS-4073 order-name fix + split-invoice (`Invoice_Group__c`) — BUILT** in `CartController.fixEcomOrderNames`.
   Still genuinely out of scope / caveated:
   - **BMS-3931 stepper labels** differ from the AC wording: built rail is `Pending / In Transit / Out For Delivery / Delivered` (reuses the existing `ecomOrderHistory` rail per Engineering Notes), **not** the AC's `Order Confirmed / Being Prepared / On the Truck / Delivered`.
   - **BMS-4537 concrete reports + dashboard** — **not shipped** (policy: ship the report **type** only; customers build reports). Only the packaged Report Type is testable here.
4. **Seed data is partly consumed** from the automated run. For a clean manual pass, **re-run the seed** (below) to get fresh fixtures with new IDs.

---

## Step 0 — (Re)seed fresh fixtures

Run as admin. Creates a fresh retailer + opted-in contact + rep + a cart + an order, and sets the stalled-cart threshold to 0 so a new cart qualifies immediately. **Copy the echoed IDs — every step below uses them.**

```apex
// FILE: reseed.apex →  sf apex run --file reseed.apex -o bms-4996-notif
String tag = 'ManualDR ' + String.valueOf(DateTime.now().getTime());
Map<String, Notification__c> cfg = new Map<String, Notification__c>();
for (Notification__c n : [
    SELECT Id, Developer_Key__c, Is_Active__c, Threshold_Hours__c
    FROM Notification__c
    WHERE Developer_Key__c IN ('ORDER_CONFIRMATION','ABANDONED_CART_REMINDER',
        'ORDER_OUT_FOR_DELIVERY','ORDER_DELIVERED','STALLED_CART_REP_ALERT')
]) { cfg.put(n.Developer_Key__c, n); }
if (cfg.containsKey('STALLED_CART_REP_ALERT')) {
    cfg.get('STALLED_CART_REP_ALERT').Threshold_Hours__c = 0;
    cfg.get('STALLED_CART_REP_ALERT').Is_Active__c = true;
}
if (!cfg.values().isEmpty()) update cfg.values();

// Rep = an active user who has NOT been alerted in the last 24h (dedup passes cleanly).
Id repId = [SELECT Id FROM User WHERE IsActive = true AND UserType='Standard'
            AND Name = 'Integration User' LIMIT 1].Id;

Account acct = new Account(Name = tag + ' Retailer', Sales_Rep__c = repId);
insert acct;
Contact con = new Contact(FirstName='ManualDR', LastName='Shopper',
    Email='bms4996.manual@example.com', AccountId=acct.Id);
insert con;

List<Contact_Notification__c> prefs = new List<Contact_Notification__c>();
for (String key : new List<String>{'ORDER_CONFIRMATION','ABANDONED_CART_REMINDER',
        'ORDER_OUT_FOR_DELIVERY','ORDER_DELIVERED'}) {
    if (cfg.containsKey(key)) prefs.add(new Contact_Notification__c(
        Contact__c=con.Id, Notification__c=cfg.get(key).Id,
        Email_Enabled__c=true, SMS_Enabled__c=false));
}
insert prefs;

Invoice__c cart  = new Invoice__c(Name=tag+' Cart',  Status__c='Draft', Customer__c=acct.Id);
Invoice__c order = new Invoice__c(Name=tag+' Order', Status__c='Draft', Customer__c=acct.Id);
insert new List<Invoice__c>{ cart, order };

System.debug('ACCOUNT='+acct.Id+' CONTACT='+con.Id+' CART='+cart.Id+' ORDER='+order.Id+' REP='+repId);
```

---

# Track A — Admin-side (ready now ✅)

Everything here works today with no perm-set fix. Verify each via the **bell**, **Setup → sent email logs**, and the **`Notification_Log__c`** audit rows.

## BMS-3921 — Stalled-cart rep alert

> **AC1 — In-platform stalled-cart alert to the assigned rep**
> *Given* a Draft `Invoice__c` (cart) idle beyond `Threshold_Hours__c` (default 24h) with no confirmed order
> *When* the stalled-cart job runs
> *Then* a Salesforce Custom Notification is sent to `Account.Sales_Rep__c` with retailer name, item count, cart value, and route cutoff; the target is the Draft `Invoice__c` (bell click opens the cart); and a `Notification_Log__c` row is written.

**Steps**
1. Do Step 0. Note `CART`, `REP`.
2. Run the job:
   ```apex
   S_StalledCartRepAlert.run();
   ```
3. Log in as the rep (Integration User) — or as admin, open the **bell** (🔔 top-right).
4. Query the log:
   ```sql
   SELECT Notification__r.Developer_Key__c, Channel__c, Status__c, Recipient_User__c, CreatedDate
   FROM Notification_Log__c WHERE Channel__c='In_App' ORDER BY CreatedDate DESC LIMIT 5
   ```

**Expected** — a Custom Notification appears in the bell targeted at the Draft cart (clicking opens the `Invoice__c`); one `Notification_Log__c` row, `Channel__c=In_App`, `Status__c=Sent`, `Recipient_User__c` = the rep.
**Status:** ✅ Testable now. *(Verify the notification BODY shows retailer name / item count / cart value / cutoff — a bare seeded cart has 0 items and no route, so those tokens may be empty; add invoice items + a route to see them populated.)*

---

> **AC2 — Dedup within window**
> *Given* the rep was already alerted for that cart within 24h *When* the job runs again *Then* no duplicate is sent.

**Steps** — immediately after AC1, run `S_StalledCartRepAlert.run();` again, then re-query the log.
**Expected** — no new `Sent` In-App row for that rep (a `Skipped` row or nothing new); the bell does not get a second alert.
**Status:** ✅ Testable now.

---

> **AC3 — Cart converts**
> *Given* the retailer submits the order (Status leaves Draft) *When* the job next runs *Then* no further alert for that cart.

**Steps**
1. Move the cart out of Draft: `Invoice__c c=[SELECT Id,Status__c FROM Invoice__c WHERE Id='<CART>']; c.Status__c='Picking'; update c;`
2. Run `S_StalledCartRepAlert.run();`
**Expected** — the cart is no longer selected; no new alert/log for it.
**Status:** ✅ Testable now.

## BMS-3931 — Order-status / delivery notifications (backend + email)

> **AC2 — Retailer receives proactive delivery notification**
> *Given* an order's status changes to `Out For Delivery` *Then* an email is sent to the retailer's primary contact (subject "…order is on the way"), body has order #, ETA, portal link; SMS too if opted in; and the event is logged with timestamp + channel.

**Steps**
1. Do Step 0. Note `ORDER`.
2. Walk the status ladder (validations force `Draft → Picking → Loaded → Out For Delivery → Delivered`):
   ```apex
   Id id='<ORDER>';
   for (String s : new List<String>{'Picking','Loaded','Out For Delivery','Delivered'}) {
       Invoice__c o=[SELECT Id,Status__c FROM Invoice__c WHERE Id=:id]; o.Status__c=s; update o;
   }
   ```
3. Query:
   ```sql
   SELECT Notification__r.Developer_Key__c, Channel__c, Status__c, CreatedDate
   FROM Notification_Log__c
   WHERE Notification__r.Developer_Key__c IN ('ORDER_OUT_FOR_DELIVERY','ORDER_DELIVERED')
   ORDER BY CreatedDate DESC LIMIT 6
   ```

**Expected** — one `ORDER_OUT_FOR_DELIVERY` and one `ORDER_DELIVERED` row, `Channel__c=Email`, `Status__c=Sent`; matching SMS rows are `Skipped` (Twilio).
**Status:** ✅ Testable now (email + logging). SMS = `Skipped` (expected).

> **AC1 (UI), AC3 (banner), AC4 (partial)** — see Track B / Limitations. AC1 stepper + AC4 partial chip are built but need the storefront; AC3 cutoff banner is **not built**.

## BMS-4073 — Order confirmation & abandoned cart (regression)

> **AC — Order Confirmation Sent After Checkout**
> *Given* a retailer confirms a draft order *Then* email/SMS per `Contact_Notification__c` prefs + a `Notification_Log__c` record.

**Steps**
1. Do Step 0. Note `CONTACT`, `ORDER`.
2. `OrderConfirmationService.sendOrderConfirmation('<CONTACT>', '<ORDER>', 'Invoice__c');`
3. Query `Notification_Log__c` for `ORDER_CONFIRMATION` (latest).
**Expected** — `Channel__c=Email`, `Status__c=Sent`; SMS `Skipped`.
**Status:** ✅ Testable now.

> **AC — Abandoned Cart Reminder / Dedup / Confirmed-order-excludes / Order-name fix**
> **Status:** ⚠️ Needs extra fixtures. The reminder requires `Route__c` + `Account_Route__c` + a `Delivery__c` in the cutoff window; the base seed doesn't create them. Previously validated live (there is a historical `ABANDONED_CART_REMINDER` Sent row). Ask if you want a fixtures add-on to click this fresh.

## BMS-4537 — Cart-recovery attribution + reporting surface

> **Deliverable — attribution + packaged Report Type over `Notification_Log__c`.**

**Steps (attribution)**
1. Confirm an order for a contact that had an abandoned-cart reminder, then check the stamp:
   ```sql
   SELECT Id, Notification__r.Developer_Key__c, Recovered_Invoice__c, Error_Code__c
   FROM Notification_Log__c WHERE Recovered_Invoice__c != null ORDER BY CreatedDate DESC LIMIT 5
   ```
**Expected** — the reminder's log row now has `Recovered_Invoice__c` populated with the confirmed invoice.
**Status:** ✅ Attribution testable. `Recovered_Invoice__c` was stamped live this session.

**Steps (report type)**
1. Setup → **Report Types** → search **"Retailer Engagement Notifications"**.
**Expected** — the report type exists (base object `Notification_Log__c`); you can build a new report on it.
**Status:** ✅ Report type present. **Concrete reports/dashboard are intentionally NOT shipped** (customer-owned per policy).

---

# Track B — Storefront (BLOCKED until perm-set fix 🚧)

These are the retailer-facing UI ACs. They need the community user to have ecom Apex access.

## Unblock Track B (storefront)

`Ohanafy_Ecom_Community_Access` failed to deploy (Twilio credential ref). To make the storefront usable for the dry run **without** live Twilio, deploy that permission set with the Twilio ExternalCredential principal stripped, then assign it to the test user. *(Dry-run-only; do not commit the stripped perm set.)* Ask the builder to run this — it is ~2 minutes.

Once assigned:

## BMS-3931 — AC1 Retailer views order status in the portal
1. Log in as `ecomtest_…` → **My Orders** → open the order you walked to `Delivered`.
2. **Expected:** the **stepper** (`ecomOrderStatusStepper`) highlights the current stage and grays future stages; **estimated delivery** shows (from `Delivery_Pickup_Date__c`); a **"Delivered X of Y cases"** partial chip appears when invoiced < ordered.
3. **Coverage caveats:** stepper labels are `Pending / In Transit / Out For Delivery / Delivered` (not the AC's `Order Confirmed / Being Prepared / On the Truck`); **driver name** on delivery is not surfaced; **cutoff banner (AC3) is not built.**

## BMS-4073 — storefront checkout → order confirmation
1. As the retailer, add items to a cart and check out.
2. **Expected:** order-confirmation email fires (Track A AC), and the order appears in My Orders.

---

## Evidence appendix — one query for the whole picture

```sql
SELECT Notification__r.Developer_Key__c, Channel__c, Status__c, Recipient_User__c,
       Recovered_Invoice__c, CreatedDate
FROM Notification_Log__c
ORDER BY CreatedDate DESC LIMIT 25
```

**Automated-run baseline (2026-07-22, already in the org):** fresh `Sent` rows for
`ORDER_CONFIRMATION` (Email), `STALLED_CART_REP_ALERT` (In-App → rep), `ORDER_OUT_FOR_DELIVERY` (Email),
`ORDER_DELIVERED` (Email); all SMS rows `Skipped`.

---

## Coverage summary

| Ticket / AC | Track | Status |
| --- | --- | --- |
| 3921 AC1 rep alert | A | ✅ ready |
| 3921 AC2 dedup | A | ✅ ready |
| 3921 AC3 cart converts | A | ✅ ready |
| 3931 AC2 delivery email + log | A | ✅ ready (SMS Skipped) |
| 3931 AC1 stepper UI | B | 🚧 blocked (perm set); labels differ from AC |
| 3931 AC1 est. delivery / partial chip | B | ✅ built (`OrderHistoryController` ETA stamp); storefront click-through still needs perm-set fix |
| 3931 AC1 driver name | B | ✅ built (`Delivery_Driver_Name__c` surfaced); storefront click-through needs perm-set fix |
| 3931 AC3 cutoff banner | A/B | ✅ built (`navigationMenu.js`) — cutoff passed → shows next delivery cycle |
| 3931 AC4 partial per-SKU detail | B | 🚧 chip built; per-line detail = verify |

> **Note (partial delivery, AC4):** the full scenario — 'Delivered' + Partial badge, per-SKU
> "Ordered 10 / Delivered 8 / Short 2", the reorder note, and the invoice amount reflecting the
> delivered qty — **can be supported via backordering**. `Invoice_Item__c` already carries
> `Ordered_Case_Quantity__c` / `Invoiced_Case_Quantity__c` / `Backorder_Case_Quantity__c`, so the
> short quantity is derivable. Candidate follow-up build; not done this session.
| 4073 order confirmation | A | ✅ ready |
| 4073 abandoned cart + variants | A | ⚠️ needs Route/Delivery fixtures |
| 4073 order-name fix + split-invoice (`Invoice_Group__c`) | A | ✅ built (`CartController.fixEcomOrderNames`); ⚠️ needs a split-invoice fixture to click fresh; no added `_T` coverage |
| 4537 attribution stamp | A | ✅ ready |
| 4537 report type | A | ✅ ready |
| 4537 reports/dashboard | — | ❌ not shipped (policy) |
