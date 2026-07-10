```
Create and deploy Reason_Code__mdt custom metadata records to org alias <ORG_ALIAS>.

  Records go in: OHFY-Data-Model/force-app/main/default/customMetadata/reasonCode/

  Each record has 4 fields: Reason__c (Text), Can_Resell__c (Checkbox), Is_Active__c (Checkbox, default true), Can_Inventory_Return__c (Checkbox,
  default true).

  Records to create:


  | DeveloperName        | Label                | Can_Resell__c | Can_Inventory_Return__c |
  |----------------------|----------------------|---------------|-------------------------|
  | Breakage_Retail      | Breakage - Retail    | false         | true                    |
  | Breakage_Driver      | Breakage - Driver    | false         | true                    |
  | Breakage_Warehouse   | Breakage - Warehouse | false         | true                    |
  | Out_of_Code          | Out of Code          | false         | true                    |
  | Closed_Date          | Closed Date          | false         | true                    |
  | Empty_Keg            | Empty Keg            | false         | true                    |
  | Applied              | Applied              | false         | true                    |
  | Scan_Issue           | Scan Issue           | true          | true                    |
  | Pricing_Issue        | Pricing Issue        | true          | true                    |
  | No_Payment_Available | No Payment Available | true          | true                    |
  | Set_Change           | Set Change           | true          | true                    |
  | Load_Error           | Load Error           | true          | true                    |
  | Order_Error          | Order Error          | true          | true                    |
  | Missed_Time          | Missed Time          | true          | true                    |
  | Mispicked            | Mispicked            | true          | true                    |

  File naming: Reason_Code.<DeveloperName>.md-meta.xml
  Deploy with: sf project deploy start -d OHFY-Data-Model/force-app/main/default/customMetadata/reasonCode -o <ORG_ALIAS>
  Delete the local files after deploy succeeds.

  Just swap <ORG_ALIAS> with the target org and you're good to go.
```