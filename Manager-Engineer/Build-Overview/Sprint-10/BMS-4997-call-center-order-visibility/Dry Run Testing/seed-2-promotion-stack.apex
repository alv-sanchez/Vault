Id acctId = '001dh00000shsR6AAI';
Id itemHalf = 'a1Odh000002cgl3EAA';
Date today = Date.today();

// Ensure group active
Promotion_Group__c g = [SELECT Id, Is_Active__c FROM Promotion_Group__c WHERE Name = 'Gulf Summer On-Premise' ORDER BY CreatedDate DESC LIMIT 1];
if (!g.Is_Active__c) { g.Is_Active__c = true; update g; }

// Ensure membership (effective today)
if ([SELECT COUNT() FROM Account_Promotion_Group__c WHERE Account__c = :acctId AND Promotion_Group__c = :g.Id] == 0) {
    insert new Account_Promotion_Group__c(Account__c = acctId, Promotion_Group__c = g.Id, Effective_Date__c = today, End_Date__c = null);
}

// Insert promotion as Upcoming (system promotes to Active via maintenance job)
List<Promotion__c> ex = [SELECT Id FROM Promotion__c WHERE Name = 'Wave Splitter Summer $10 Off'];
Promotion__c p;
if (ex.isEmpty()) {
    p = new Promotion__c(Name = 'Wave Splitter Summer $10 Off', Type__c = 'Post-off', Item_Scope_Level__c = 'ITEM', Item__c = itemHalf, Discount_Type__c = 'Dollar', Discount_Amount__c = 10, Min_Quantity__c = 1, Promotion_Group__c = g.Id, Status__c = 'Upcoming', Start_Date__c = today.addDays(-10), End_Date__c = today.addDays(45));
    insert p;
    insert new Promotion_Tier__c(Promotion__c = p.Id, Min_Quantity__c = 5, Discount_Amount__c = 15);
} else { p = ex[0]; }
System.debug('PROMO inserted: ' + p.Id);

// Run nightly maintenance to promote Upcoming -> Active (Start_Date already passed)
new S_Promotion_Maintenance().execute((SchedulableContext) null);

Promotion__c chk = [SELECT Status__c, Start_Date__c, End_Date__c FROM Promotion__c WHERE Id = :p.Id];
Account_Promotion_Group__c apg = [SELECT Is_Active__c FROM Account_Promotion_Group__c WHERE Account__c = :acctId AND Promotion_Group__c = :g.Id LIMIT 1];
System.debug('FINAL promo status=' + chk.Status__c + ' | membership active=' + apg.Is_Active__c);
