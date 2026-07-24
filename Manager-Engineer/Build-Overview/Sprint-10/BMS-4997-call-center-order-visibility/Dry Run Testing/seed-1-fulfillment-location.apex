Id acctId = '001dh00000shsR6AAI';
Id wh1 = 'a1Udh0000025KOLEA2';
List<Invoice__c> invs = [SELECT Id FROM Invoice__c WHERE Customer__c = :acctId];
for (Invoice__c i : invs) { i.Fulfillment_Location__c = wh1; }
try {
    update invs;
    System.debug('OK invoice update: ' + invs.size());
} catch (Exception e) {
    System.debug('FAIL invoice update: ' + e.getMessage());
}
