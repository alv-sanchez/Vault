/**
 * BMS-4965 Short-Pay AR Review Queue — idempotent demo/seed data.
 *
 * Renders the shortPayReviewQueue LWC (E_ShortPayReview.getWorklist) with real rows.
 * Run:  sf apex run --file seed-data.apex -o ohfy-val-4965
 *
 * Worklist needs (confirmed against the branch + org describe):
 *   - Invoice__c.Short_Pay_Status__c IN (Open, Under Review, Escalated)
 *   - Short_Pay_Amount__c (= Total_Due__c - Amount_Paid__c) > 0. Total_Due__c is a
 *     non-writable rollup (0 here), so a shortfall is driven by a NEGATIVE Amount_Paid__c
 *     — the exact technique S_ShortPayResolution_T uses.
 *   - Customer__r.Name (Account), Short_Pay_Reason__c, Invoice_Date__c (age),
 *     Fulfillment_Location__r.Location_State__c (state filter) and
 *     Fulfillment_Location__r.Warehouse_Name__c (= Location.Name when Type = 'Warehouse').
 *
 * Idempotent: every seeded Invoice carries Customer_PO_Number__c = SEED_TAG + '-<n>';
 * Accounts/Locations are matched by Name. Re-running upserts in place, no duplicates.
 */
final String SEED_TAG = 'SEED-4965';

// ---- 1. Warehouse Locations (state lives on Location, not the Account) -------------
Map<String, String> locByState = new Map<String, String>{
    'FL' => 'BMS4965 - Orlando DC',
    'AL' => 'BMS4965 - Birmingham DC'
};
Map<String, ohfy__Location__c> locations = new Map<String, ohfy__Location__c>();
Set<String> locNames = new Set<String>(locByState.values());
Map<String, ohfy__Location__c> existingLoc = new Map<String, ohfy__Location__c>();
for (ohfy__Location__c l : [
    SELECT Id, Name, ohfy__Location_State__c, ohfy__Type__c
    FROM ohfy__Location__c WHERE Name IN :locNames
]) {
    existingLoc.put(l.Name, l);
}
List<ohfy__Location__c> locUpserts = new List<ohfy__Location__c>();
for (String st : locByState.keySet()) {
    String nm = locByState.get(st);
    ohfy__Location__c l = existingLoc.containsKey(nm) ? existingLoc.get(nm) : new ohfy__Location__c();
    l.Name = nm;
    l.ohfy__Type__c = 'Warehouse';        // makes Warehouse_Name__c resolve to Name
    l.ohfy__Location_State__c = st;
    locUpserts.add(l);
    locations.put(st, l);
}
upsert locUpserts;

// ---- 2. Customer Accounts (mix of FL + AL) -----------------------------------------
// state column on the worklist comes from the Location; BillingState mirrors it for realism.
List<Map<String, Object>> acctSpecs = new List<Map<String, Object>>{
    new Map<String, Object>{ 'name' => 'BMS4965 Sunshine Beverages (FL)', 'state' => 'FL' },
    new Map<String, Object>{ 'name' => 'BMS4965 Gulf Coast Distributors (FL)', 'state' => 'FL' },
    new Map<String, Object>{ 'name' => 'BMS4965 Heart of Dixie Wholesale (AL)', 'state' => 'AL' }
};
Set<String> acctNames = new Set<String>();
for (Map<String, Object> s : acctSpecs) {
    acctNames.add((String) s.get('name'));
}
Map<String, Account> existingAcct = new Map<String, Account>();
for (Account a : [SELECT Id, Name FROM Account WHERE Name IN :acctNames]) {
    existingAcct.put(a.Name, a);
}
Map<String, Account> accounts = new Map<String, Account>();
List<Account> acctUpserts = new List<Account>();
for (Map<String, Object> s : acctSpecs) {
    String nm = (String) s.get('name');
    Account a = existingAcct.containsKey(nm) ? existingAcct.get(nm) : new Account();
    a.Name = nm;
    a.BillingState = (String) s.get('state');
    acctUpserts.add(a);
    accounts.put(nm, a);
}
upsert acctUpserts;

// ---- 3. Short-pay Invoices: 7 across statuses / states / ages / reasons -------------
// shortPay = -amountPaid (Total_Due rollup = 0). ageDays = today - invoiceDate.
List<Map<String, Object>> invSpecs = new List<Map<String, Object>>{
    new Map<String, Object>{ 'tag'=>'1', 'acct'=>'BMS4965 Sunshine Beverages (FL)',       'state'=>'FL', 'paid'=>-125.00, 'status'=>'Open',         'reason'=>'Disputed Amount',          'age'=>2 },
    new Map<String, Object>{ 'tag'=>'2', 'acct'=>'BMS4965 Gulf Coast Distributors (FL)',  'state'=>'FL', 'paid'=>-48.50,  'status'=>'Open',         'reason'=>'Partial Payment',          'age'=>5 },
    new Map<String, Object>{ 'tag'=>'3', 'acct'=>'BMS4965 Sunshine Beverages (FL)',       'state'=>'FL', 'paid'=>-310.75, 'status'=>'Under Review', 'reason'=>'Damaged Goods Deduction',  'age'=>9 },
    new Map<String, Object>{ 'tag'=>'4', 'acct'=>'BMS4965 Heart of Dixie Wholesale (AL)', 'state'=>'AL', 'paid'=>-89.00,  'status'=>'Under Review', 'reason'=>'Promotional Dispute',      'age'=>14 },
    new Map<String, Object>{ 'tag'=>'5', 'acct'=>'BMS4965 Heart of Dixie Wholesale (AL)', 'state'=>'AL', 'paid'=>-540.00, 'status'=>'Escalated',    'reason'=>'Disputed Amount',          'age'=>28 },
    new Map<String, Object>{ 'tag'=>'6', 'acct'=>'BMS4965 Gulf Coast Distributors (FL)',  'state'=>'FL', 'paid'=>-1200.00,'status'=>'Escalated',    'reason'=>'Other',                    'age'=>45 },
    new Map<String, Object>{ 'tag'=>'7', 'acct'=>'BMS4965 Sunshine Beverages (FL)',       'state'=>'FL', 'paid'=>-15.25,  'status'=>'Open',         'reason'=>'Partial Payment',          'age'=>1 }
};

Map<String, ohfy__Invoice__c> existingInv = new Map<String, ohfy__Invoice__c>();
for (ohfy__Invoice__c iv : [
    SELECT Id, ohfy__Customer_PO_Number__c
    FROM ohfy__Invoice__c
    WHERE ohfy__Customer_PO_Number__c LIKE :(SEED_TAG + '-%')
]) {
    existingInv.put(iv.ohfy__Customer_PO_Number__c, iv);
}

List<ohfy__Invoice__c> invUpserts = new List<ohfy__Invoice__c>();
for (Map<String, Object> s : invSpecs) {
    String po = SEED_TAG + '-' + (String) s.get('tag');
    ohfy__Invoice__c iv = existingInv.containsKey(po)
        ? existingInv.get(po)
        : new ohfy__Invoice__c();
    iv.ohfy__Customer_PO_Number__c = po;
    iv.ohfy__Customer__c = accounts.get((String) s.get('acct')).Id;
    iv.ohfy__Fulfillment_Location__c = locations.get((String) s.get('state')).Id;
    iv.ohfy__Amount_Paid__c = (Decimal) s.get('paid');       // negative -> positive shortfall
    iv.ohfy__Short_Pay_Status__c = (String) s.get('status');
    iv.ohfy__Short_Pay_Reason__c = (String) s.get('reason');
    iv.ohfy__Invoice_Date__c = System.today().addDays(-((Integer) s.get('age')));
    iv.ohfy__Delivery_Pickup_Date__c = System.today();
    iv.ohfy__Status__c = 'New';
    invUpserts.add(iv);
}
upsert invUpserts;

// ---- 4. Verify via the actual worklist surface --------------------------------------
List<ShortPayReviewRowDTO> rows = E_ShortPayReview.getWorklist(null, null);
Integer fl = 0, al = 0;
Map<String, Integer> byStatus = new Map<String, Integer>();
for (ShortPayReviewRowDTO r : rows) {
    if (r.state == 'FL') fl++;
    if (r.state == 'AL') al++;
    Integer c = byStatus.containsKey(r.status) ? byStatus.get(r.status) : 0;
    byStatus.put(r.status, c + 1);
}
System.debug('=== SEED COMPLETE ===');
System.debug('Locations: ' + locUpserts.size() + '  Accounts: ' + acctUpserts.size() + '  Invoices: ' + invUpserts.size());
System.debug('getWorklist total rows: ' + rows.size() + '  (FL=' + fl + ', AL=' + al + ')');
System.debug('By status: ' + byStatus);
System.debug('States in filter dropdown: ' + E_ShortPayReview.getStateOptions());
for (ShortPayReviewRowDTO r : rows) {
    System.debug('  ' + r.status + ' | ' + r.state + ' | ' + r.customerName + ' | $' + r.shortPayAmount + ' | ' + r.reason + ' | age=' + r.ageDays + 'd');
}
