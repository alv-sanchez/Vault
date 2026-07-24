// Add more distinct products to the orders so Pricing Breakdown + Inventory have more rows.
// BLAST RADIUS: Customer Account 0 invoices only.
Id inv1 = 'a1Hdh000002GZ5VEAW'; // IN-00000001
Id inv2 = 'a1Hdh000002GZ5WEAW'; // IN-00000002
Map<Id, Decimal> newLines = new Map<Id, Decimal>{
    'a1Odh000002cgl7EAA' => 160, // Boats Float 1/2 BBL
    'a1Odh000002cgl8EAA' => 90,  // Boats Float 1/4 BBL
    'a1Odh000002cglBEAQ' => 150  // Shark Fin 1/2 BBL
};
List<Invoice_Item__c> toAdd = new List<Invoice_Item__c>();
Integer i = 0;
for (Id itemId : newLines.keySet()) {
    Id inv = (Math.mod(i,2) == 0) ? inv1 : inv2;
    toAdd.add(new Invoice_Item__c(
        Invoice__c = inv,
        Item__c = itemId,
        Ordered_Case_Quantity__c = 6,
        Invoiced_Case_Quantity__c = 6,
        Case_Price__c = newLines.get(itemId)
    ));
    i++;
}
// Skip if already added (idempotent) — check by item on inv1/inv2
Set<Id> already = new Set<Id>();
for (Invoice_Item__c ii : [SELECT Item__c FROM Invoice_Item__c WHERE Invoice__c IN (:inv1,:inv2) AND Item__c IN :newLines.keySet()]) already.add(ii.Item__c);
List<Invoice_Item__c> filtered = new List<Invoice_Item__c>();
for (Invoice_Item__c ii : toAdd) if (!already.contains(ii.Item__c)) filtered.add(ii);
if (!filtered.isEmpty()) insert filtered;
System.debug('ADDED ITEMS: ' + filtered.size());
