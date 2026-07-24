Id acctId = '001dh00000shsR6AAI';
Id itemHalf = 'a1Odh000002cgl3EAA';
List<Invoice_Item__c> items = [SELECT Id, Item__c FROM Invoice_Item__c WHERE Invoice__r.Customer__c = :acctId];
for (Invoice_Item__c it : items) {
    Decimal q = (it.Item__c == itemHalf) ? 10 : 5;
    it.Ordered_Case_Quantity__c = q;
    it.Invoiced_Case_Quantity__c = q;
}
try {
    update items;
    System.debug('ITEM UPDATE OK: ' + items.size());
} catch (Exception e) {
    System.debug('FAIL: ' + e.getMessage());
}
for (Invoice__c v : [SELECT Invoice_Number__c, Invoice_Total__c, Total_Cases__c FROM Invoice__c WHERE Customer__c = :acctId ORDER BY Invoice_Number__c]) {
    System.debug(v.Invoice_Number__c + ' total=' + v.Invoice_Total__c + ' cases=' + v.Total_Cases__c);
}
