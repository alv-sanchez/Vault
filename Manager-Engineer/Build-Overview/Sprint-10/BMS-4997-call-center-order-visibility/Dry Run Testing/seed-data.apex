/**
 * Dry-run seed for BMS-4997 order-visibility — org ccov-4997 (namespaced ohfy).
 * Seeds order history (Invoice__c + Invoice_Item__c) for the community test account
 * "Customer Account 0" so the ecomOrderVisibility order-history + pricing panels render.
 * Idempotent on External_Id__c. Run: sf apex run --file <this> -o ccov-4997
 * (Active promotions are seeded separately via orgScripts/e-commerce/seed-promo-demo.apex;
 *  routes/pricing/inventory already exist on this account.)
 */
Id acctId = [SELECT Id FROM Account WHERE Name = 'Customer Account 0' LIMIT 1].Id;
List<Item__c> items = [SELECT Id FROM Item__c LIMIT 4];

Map<String, String> orderStatuses = new Map<String, String>{
    'seed:ccov4997-inv-1' => 'Delivered',
    'seed:ccov4997-inv-2' => 'Complete',
    'seed:ccov4997-inv-3' => 'Out For Delivery',
    'seed:ccov4997-inv-4' => 'Scheduled'
};

List<Invoice__c> invoices = new List<Invoice__c>();
Integer daysAgo = 5;
for (String extId : orderStatuses.keySet()) {
    invoices.add(new Invoice__c(
        External_Id__c = extId,
        Customer__c = acctId,
        Status__c = orderStatuses.get(extId),
        Invoice_Date__c = Date.today().addDays(-daysAgo),
        Delivery_Method__c = 'Delivery',
        E_Commerce__c = true
    ));
    daysAgo += 9;
}
upsert invoices External_Id__c;

List<Invoice_Item__c> lines = new List<Invoice_Item__c>();
Integer li = 0;
for (Invoice__c inv : invoices) {
    for (Integer i = 0; i < 2 && i < items.size(); i++) {
        li++;
        lines.add(new Invoice_Item__c(
            External_Id__c = 'seed:ccov4997-invitem-' + li,
            Invoice__c = inv.Id,
            Item__c = items[i].Id,
            Case_Quantity__c = 10 + i * 2,
            Case_Price__c = 25.00 + i * 5
        ));
    }
}
upsert lines External_Id__c;

System.debug('Seeded ' + invoices.size() + ' invoices, ' + lines.size() + ' lines for ' + acctId);
