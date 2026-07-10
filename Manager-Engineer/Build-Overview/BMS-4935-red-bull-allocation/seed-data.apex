/**
 * BMS-4935 / BMS-4120 — Red Bull Supplier Allocation Import happy-path seed.
 *
 * Idempotent anonymous-Apex seed for org ohfy-val-4120 (namespace: ohfy__).
 * Run from OUTSIDE the namespace, so object + field API names are ohfy__-prefixed.
 *
 * Seeds the dependencies the importer (E_SupplierAllocationImport) resolves at runtime:
 *   - 1 supplier Account: Type='Vendor', Is_Active__c=true  (OMS_UI_Wrappers.getSupplierAccounts filter)
 *   - 5 warehouse Locations whose Location_Code__c == the Warehouse_Allocation_Split__mdt
 *     RedBull default-set codes (HSVAL/MCCAL/MILFL/MOBAL/MGMAL), Type='Warehouse', active
 *   - 8 Item__c SKUs whose External_ID__c == the SKUs in sample-redbull.csv
 *     (mapping RedBull_Sku.Item_Match_Field__c = External_ID__c)
 *
 * Idempotency: Items + Locations upsert on their External Id fields; the Account is
 * guarded by an existence query. Safe to re-run.
 *
 * Run:  sf apex run --file seed-data.apex -o ohfy-val-4120
 */

// ---- 1. Supplier Account (guard by existence) -------------------------------
String supplierName = 'Red Bull';
List<Account> existing = [
    SELECT Id FROM Account
    WHERE Name = :supplierName AND Type = 'Vendor'
    LIMIT 1
];
Account supplier;
if (existing.isEmpty()) {
    supplier = new Account(
        Name = supplierName,
        Type = 'Vendor',
        ohfy__Is_Active__c = true
    );
    insert supplier;
} else {
    supplier = existing[0];
    // Ensure active in case a stale inactive record exists.
    supplier.ohfy__Is_Active__c = true;
    update supplier;
}
System.debug('Supplier Account Id: ' + supplier.Id);

// ---- 2. Warehouse Locations (upsert on External_Id__c) ----------------------
// Codes MUST match Warehouse_Allocation_Split__mdt (RedBull default set) exactly.
Map<String, String> warehouseCodeToName = new Map<String, String>{
    'HSVAL' => 'Huntsville AL',
    'MCCAL' => 'McCalla AL',
    'MILFL' => 'Milton FL',
    'MOBAL' => 'Mobile AL',
    'MGMAL' => 'Montgomery AL'
};
List<ohfy__Location__c> locations = new List<ohfy__Location__c>();
for (String code : warehouseCodeToName.keySet()) {
    locations.add(new ohfy__Location__c(
        Name = 'RB WH ' + code + ' - ' + warehouseCodeToName.get(code),
        ohfy__Location_Code__c = code,
        ohfy__Type__c = 'Warehouse',
        ohfy__Is_Active__c = true,
        ohfy__External_Id__c = 'SEED:RBWH:' + code
    ));
}
upsert locations ohfy__External_Id__c;
System.debug('Warehouse Locations upserted: ' + locations.size());

// ---- 3. Item SKUs (upsert on External_ID__c) --------------------------------
// External_ID__c values match the SKUs in sample-redbull.csv exactly.
Map<String, String> skuToDesc = new Map<String, String>{
    'RB-25316' => 'Red Bull Energy Drink 8.4oz 24pk',
    'RB-25318' => 'Red Bull Sugarfree 8.4oz 24pk',
    'RB-25320' => 'Red Bull Zero 8.4oz 24pk',
    'RB-25469' => 'Red Bull Energy Drink 12oz 24pk',
    'RB-25471' => 'Red Bull Red Edition Watermelon 12oz 24pk',
    'RB-25473' => 'Red Bull Yellow Edition Tropical 12oz 24pk',
    'RB-25620' => 'Red Bull Energy Drink 16oz 12pk',
    'RB-25622' => 'Red Bull Blue Edition Blueberry 12oz 24pk'
};
List<ohfy__Item__c> items = new List<ohfy__Item__c>();
for (String sku : skuToDesc.keySet()) {
    items.add(new ohfy__Item__c(
        Name = skuToDesc.get(sku),
        ohfy__External_ID__c = sku,
        // 'Merchandise' avoids the Finished-Good packaging validation rule; the
        // importer matches Items by External_ID__c only, so Item Type is immaterial.
        ohfy__Type__c = 'Merchandise',
        ohfy__Is_Active__c = true
    ));
}
upsert items ohfy__External_ID__c;
System.debug('Items upserted: ' + items.size());

// ---- 4. Verification counts -------------------------------------------------
System.debug('=== SEED VERIFICATION ===');
System.debug('Vendor Accounts named Red Bull: ' +
    [SELECT COUNT() FROM Account WHERE Name = :supplierName AND Type = 'Vendor']);
System.debug('Warehouse Locations (split codes): ' +
    [SELECT COUNT() FROM ohfy__Location__c
     WHERE ohfy__Type__c = 'Warehouse'
       AND ohfy__Location_Code__c IN ('HSVAL','MCCAL','MILFL','MOBAL','MGMAL')]);
System.debug('Items with RB External IDs: ' +
    [SELECT COUNT() FROM ohfy__Item__c WHERE ohfy__External_ID__c IN :skuToDesc.keySet()]);
