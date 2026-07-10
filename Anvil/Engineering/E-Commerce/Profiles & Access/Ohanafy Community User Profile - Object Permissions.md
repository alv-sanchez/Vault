---
title: "Ohanafy Community User Profile — Object Permissions"
profile: Ohanafy Community User
org: may19OrgTest
updated: 2026-05-20
updated_by: Alvaro Sanchez
status: deployed
tags: [ecom, profile, object-permissions, community-user]
---

# Ohanafy Community User Profile — Object Permissions

Objects granted **Read + Edit + Create** access on the `Ohanafy Community User` profile, plus all field-level read/edit permissions within each object.

Deployed to `may19OrgTest` on 2026-05-20.

---

## Requested Objects (35)

From the original eCommerce storefront requirements.

| # | Object API Name | Status |
|---|---|---|
| 1 | `Account` | Already had permissions |
| 2 | `Account_Route__c` | Added |
| 3 | `Contact_Notification__c` | Added (brand new — renamed from Ecom_Contact_Notification__c) |
| 4 | `Delivery__c` | Added |
| 5 | `Fee__c` | Added |
| 6 | `Inventory__c` | Added |
| 7 | `Inventory_Adjustment__c` | Added |
| 8 | `Invoice__c` | Added |
| 9 | `Invoice_Adjustment__c` | Added |
| 10 | `Invoice_Goal__c` | Added |
| 11 | `Invoice_Group__c` | Added |
| 12 | `Invoice_Item__c` | Added |
| 13 | `Item__c` | Added |
| 14 | `Item_Component__c` | Added |
| 15 | `Item_Line__c` (Supplier) | Added |
| 16 | `Item_Type__c` (Brand) | Added |
| 17 | `Location__c` | Added |
| 18 | `Lot__c` | Added |
| 19 | `Lot_Inventory__c` | Added |
| 20 | `Notification__c` | Added (brand new — renamed from Ecom_Notification__c) |
| 21 | `Notification_Log__c` | Added (brand new — renamed from Ecom_Notification_Log__c) |
| 22 | `Pallet__c` | Added |
| 23 | `Pallet_Item__c` | Added |
| 24 | `Placement__c` | Added |
| 25 | `Pricelist__c` | Added |
| 26 | `Pricelist_Item__c` | Added |
| 27 | `Promotion__c` | Added |
| 28 | `Promotion_Invoice_Item__c` | Added |
| 29 | `Promotion_Item__c` | Added |
| 30 | `Promotion_Item_Line__c` | Added |
| 31 | `Promotion_Item_Type__c` | Added |
| 32 | `Retail_Inventory__c` | Added |
| 33 | `Route__c` | Added |
| 34 | `Tax_Authority__c` | Added |
| 35 | `Territory__c` | Added |

### Skipped (not found in data model)

| Object | Reason |
|---|---|
| `Lot_Adjustment__c` | Object doesn't exist |
| `Promotion_Brand__c` | Legacy — replaced by `Promotion_Item_Type__c` |
| `Promotion_Product__c` | Legacy — replaced by `Promotion_Item__c` |
| `Promotion_Supplier__c` | Legacy — replaced by `Promotion_Item_Line__c` |

---

## Dependency Objects (81)

These objects already had field-level permissions in the profile but were missing object-level Read/Edit. Salesforce requires parent object permissions before child lookups compile, so these were added to prevent cascade deploy errors.

| # | Object API Name |
|---|---|
| 1 | `Accounting_Setting__c` |
| 2 | `Activity_Goal__c` |
| 3 | `Adjustment__c` |
| 4 | `Allocation__c` |
| 5 | `Bank_Account__c` |
| 6 | `Bank_Transaction__c` |
| 7 | `Bank__c` |
| 8 | `Bill_Line__c` |
| 9 | `Bill__c` |
| 10 | `Billback__c` |
| 11 | `Commitment_Item__c` |
| 12 | `Commitment__c` |
| 13 | `Control_State_Code__c` |
| 14 | `Credit__c` |
| 15 | `Criteria__c` |
| 16 | `Delivery_Stop__c` |
| 17 | `Depletion__c` |
| 18 | `Display_Item__c` |
| 19 | `Display_Run__c` |
| 20 | `Display__c` |
| 21 | `Entity__c` |
| 22 | `Equipment__c` |
| 23 | `Field_Mapping_Line__c` |
| 24 | `Field_Mapping__c` |
| 25 | `Financial_Account__c` |
| 26 | `GL_Monthly_Summary__c` |
| 27 | `GL_Summary__c` |
| 28 | `General_Ledger__c` |
| 29 | `Goal_Template__c` |
| 30 | `Goal__c` |
| 31 | `Holiday_Stop_Reassignment__c` |
| 32 | `Holiday_Template__c` |
| 33 | `Incentive__c` |
| 34 | `Integration_Sync_Failure__c` |
| 35 | `Integration_Sync__c` |
| 36 | `Inventory_History__c` |
| 37 | `Inventory_Log_Group__c` |
| 38 | `Inventory_Log__c` |
| 39 | `Inventory_Receipt_Fee__c` |
| 40 | `Inventory_Receipt_Item__c` |
| 41 | `Inventory_Receipt__c` |
| 42 | `Inventory_Threshold__c` |
| 43 | `Invoice_Fee__c` |
| 44 | `Item_Group_Rule__c` |
| 45 | `Item_Group__c` |
| 46 | `Item_Type_Territory_Exclusion__c` |
| 47 | `Journal_Entry__c` |
| 48 | `Journal__c` |
| 49 | `Lot_Inventory_Receipt_Item__c` |
| 50 | `Lot_Invoice_Item__c` |
| 51 | `Maintenance__c` |
| 52 | `Negative_Inventory_Incident__c` |
| 53 | `Offline_Tile_Metadata__c` |
| 54 | `Packaging_Style__c` |
| 55 | `Payment__c` |
| 56 | `Pick_Event__c` |
| 57 | `Pick_Location_Assignment__c` |
| 58 | `Pick_Path_Change_Log__c` |
| 59 | `Pick_Path_Sequence__c` |
| 60 | `Pick_Path_Version__c` |
| 61 | `Pick_Performance_Summary__c` |
| 62 | `Picking_Configuration__c` |
| 63 | `Pricelist_Account__c` |
| 64 | `Pricelist_Group__c` |
| 65 | `Pricelist_Setting__c` |
| 66 | `Purchase_Order_Item__c` |
| 67 | `Purchase_Order__c` |
| 68 | `Receipt__c` |
| 69 | `Related_Financial_Account__c` |
| 70 | `Route_Check_In__c` |
| 71 | `Route_Check_Out__c` |
| 72 | `SKU_Override__c` |
| 73 | `Sales_Route_Stop__c` |
| 74 | `Sales_Route__c` |
| 75 | `Shipment__c` |
| 76 | `Survey__c` |
| 77 | `Tier_Setting__c` |
| 78 | `Transfer_Group__c` |
| 79 | `Transfer__c` |
| 80 | `Transformation_Setting__c` |
| 81 | `Vendor_Credit__c` |

---

## Field-Level Changes

| Change | Count |
|---|---|
| Existing fields set to editable | 790 |
| New fieldPermissions added (3 notification objects) | 20 |
| Required/master-detail fields removed (Salesforce-managed) | 5 |
| **Total fieldPermissions in profile** | **1,688** |

### Required fields removed (Salesforce manages these automatically)

- `Contact_Notification__c.Notification__c`
- `Contact_Notification__c.Contact__c`
- `Notification_Log__c.Channel__c`
- `Notification_Log__c.Status__c`
- `Notification__c.Developer_Key__c`
