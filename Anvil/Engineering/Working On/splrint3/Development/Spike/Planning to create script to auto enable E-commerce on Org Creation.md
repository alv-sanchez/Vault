


First know what you can modify
- Profile specific
	- Clone Customer Community Plus User
	- And assign the following (One )
1. On the newly created Profile navigate to Object Settings.
    
    - Provide all the following objects with **Read** and **Edit** access, as well as all the fields within those objects:
        
        - Account (`Account`)
            
        - Account Route (`ohfy__Account_Route__c`)
            
        - Brand (`ohfy__Item_Type__c`)
            
        - Customer (`Customer`)
            
        - Delivery (`ohfy__Delivery__c`)
            
        - Inventory (`ohfy__Inventory__c`)
            
        - Inventory Adjustment (`ohfy__Inventory_Adjustment__c`)
            
        - Invoice (`ohfy__Invoice__c`) ❌ Outdated
            
        - Invoice Item (`ohfy__Invoice_Item__c`) ❌ Outdated
            
        - Item (`ohfy__Item__c`)
            
        - Item Component (`ohfy__Item_Component__c`)
            
        - Location (`ohfy__Location__c`)
            
        - Lot (`ohfy__Lot__c`)
            
        - Lot Adjustments (`ohfy__Lot_Adjustment__c`)
            
        - Lot Inventory (`ohfy__Lot_Inventory__c`)
            
        - Order (`ohfy__Order__c`)
            
        - Order Item (`ohfy__Order_Item__c`)
            
        - Pricelist (`ohfy__Pricelist__c`)
            
        - Pricelist Item (`ohfy__Pricelist_Item__c`)
            
        - Route (`ohfy__Route__c`)
            
        - Supplier (`ohfy__Item_Line__c`)
            
        - Tax Authority (`ohfy__Tax_Authority__c`)
            
        
        Added post promotions
        
        - Promotion (`ohfy__Promotion__c`)
            
        - Promotion Brand (`ohfy__Promotion_Brand__c`)
            
        - Promotion Product (`ohfy__Promotion_Product__c`)
            
        - Promotion Invoice_Item (`ohfy__Promotion_Invoice_Item__c`)
            
        - Promotion Supplier (`ohfy__Promotion_Supplier__c` )
            
        
        Added post draft invoice architecture implmentaion
        
        - Account_Item (`ohfy__Account_Item__c`)
            
        - Territories **(**`ohfy__Territory__c`**)**
            
        - Invoice Group (`ohfy__Invoice_Group__c`)
            
        - Invoice Adjustment (`ohfy__Invoice_Adjustment__c`)
            
        - Invoice Goals (`ohfy__Invoice_Goal__c`)
            
        - Invoice Fees (`ohfy__Order_Fee__c`)
            
        - Fees (`ohfy__Fee__c`)
            
        - Retail Inventory (`ohfy__Retail_Inventory__c`)
            
        - Invoice Adjustment (`ohfy__Invoice_Adjustment__c`)
            
        - Pallet Item (`ohfy__Pallet_Item__c`)
            
        - Pallet (`ohfy__Pallet__c`)
            
        - Notification (`ohfy__Notification__c`)
            
        - Contact Notification (`ohfy__Contact_Notification__c`)
            
        - Notification Log (`ohfy__Notification_Log__c`)
            

2. Navigate to Apex Class Access.
    
    1. Provide access to all classes. Click **Save**.
        
3. Navigate to Custom Metadata Types.
    
    1. Provide access to all custom metadata types. Click **Save**