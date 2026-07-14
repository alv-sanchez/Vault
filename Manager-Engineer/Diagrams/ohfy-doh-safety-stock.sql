-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: PostgreSQL
-- Generated at: 2026-07-13T15:03:52.483Z

CREATE TABLE "Item__c" (
  "Id" varchar PRIMARY KEY,
  "Name" varchar,
  "SKU_Number__c" varchar,
  "Units_Per_Case__c" number,
  "Average_Case_Cost__c" number,
  "Last_Landed_Case_Cost__c" number,
  "Quantity_On_Hand__c" number,
  "Is_Active__c" boolean
);

CREATE TABLE "Location__c" (
  "Id" varchar PRIMARY KEY,
  "Name" varchar,
  "Type__c" varchar,
  "Parent_Location__c" varchar,
  "Location_State__c" varchar,
  "Is_Truck__c" boolean,
  "Is_Dock__c" boolean
);

CREATE TABLE "Account" (
  "Id" varchar PRIMARY KEY,
  "Name" varchar
);

CREATE TABLE "Inventory__c" (
  "Id" varchar PRIMARY KEY,
  "Item__c" varchar,
  "Location__c" varchar,
  "Quantity_On_Hand__c" number,
  "Average_Daily_Depletion__c" number,
  "Current_DOI__c" number,
  "Effective_Target_DOH__c" number,
  "DOI_Status__c" varchar,
  "Target_DOH_Variance__c" number,
  "Target_DOH_Variance_Pct__c" number,
  "Target_Variance_Status__c" varchar
);

CREATE TABLE "Inventory_Threshold__c" (
  "Id" varchar PRIMARY KEY,
  "Account__c" varchar,
  "Location__c" varchar,
  "Target_DOH__c" number,
  "Min_DOH__c" number,
  "Max_DOH__c" number,
  "Lead_Time__c" number
);

CREATE TABLE "SKU_Override__c" (
  "Id" varchar PRIMARY KEY,
  "Item__c" varchar,
  "Location__c" varchar,
  "Account__c" varchar,
  "Scope__c" varchar,
  "Target_DOH_Override__c" number,
  "Min_DOH_Override__c" number,
  "Max_DOH_Override__c" number,
  "Start_Date__c" date,
  "End_Date__c" date,
  "Status__c" varchar
);

COMMENT ON TABLE "Item__c" IS 'The product / SKU';

COMMENT ON COLUMN "Item__c"."Average_Case_Cost__c" IS 'currency';

COMMENT ON COLUMN "Item__c"."Last_Landed_Case_Cost__c" IS 'currency · cost FLS-gated (cost/margin)';

COMMENT ON COLUMN "Item__c"."Quantity_On_Hand__c" IS 'rollup summary';

COMMENT ON TABLE "Location__c" IS 'Warehouse / bin / zone / truck (hierarchy via Parent_Location__c)';

COMMENT ON COLUMN "Location__c"."Type__c" IS 'Warehouse / Zone / Bin / Truck / Dock';

COMMENT ON COLUMN "Location__c"."Parent_Location__c" IS 'self-ref — walks to the Warehouse ancestor';

COMMENT ON COLUMN "Location__c"."Location_State__c" IS 'FL / AL';

COMMENT ON TABLE "Account" IS 'Standard object — used here as the Supplier';

COMMENT ON TABLE "Inventory__c" IS 'One row per Item × Location — the heart of DOH';

COMMENT ON COLUMN "Inventory__c"."Item__c" IS 'master-detail';

COMMENT ON COLUMN "Inventory__c"."Location__c" IS 'lookup';

COMMENT ON COLUMN "Inventory__c"."Average_Daily_Depletion__c" IS 'velocity input';

COMMENT ON COLUMN "Inventory__c"."Current_DOI__c" IS 'actual DOH · stamped nightly by B_InventoryDOI';

COMMENT ON COLUMN "Inventory__c"."Effective_Target_DOH__c" IS 'resolved benchmark (waterfall) · stamped nightly';

COMMENT ON COLUMN "Inventory__c"."Target_DOH_Variance__c" IS 'formula (BMS-3816): Current_DOI − Effective_Target_DOH';

COMMENT ON COLUMN "Inventory__c"."Target_DOH_Variance_Pct__c" IS 'formula % of target';

COMMENT ON COLUMN "Inventory__c"."Target_Variance_Status__c" IS 'formula: Above / At / Below / No Benchmark Set / No Velocity Data';

COMMENT ON TABLE "Inventory_Threshold__c" IS 'Baseline benchmark storage — supplier / warehouse / supplier@warehouse grain';

COMMENT ON COLUMN "Inventory_Threshold__c"."Account__c" IS 'supplier grain';

COMMENT ON COLUMN "Inventory_Threshold__c"."Location__c" IS 'warehouse grain';

COMMENT ON COLUMN "Inventory_Threshold__c"."Target_DOH__c" IS 'leadership benchmark (the "practical" DOH)';

COMMENT ON TABLE "SKU_Override__c" IS 'Dated per-SKU/location override — beats the threshold baseline while active';

COMMENT ON COLUMN "SKU_Override__c"."Account__c" IS 'supplier scope';

COMMENT ON COLUMN "SKU_Override__c"."Scope__c" IS 'SKU / Supplier';

COMMENT ON COLUMN "SKU_Override__c"."Status__c" IS 'Scheduled / Active / Expired';

ALTER TABLE "Location__c" ADD FOREIGN KEY ("Parent_Location__c") REFERENCES "Location__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Inventory__c" ADD FOREIGN KEY ("Item__c") REFERENCES "Item__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Inventory__c" ADD FOREIGN KEY ("Location__c") REFERENCES "Location__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Inventory_Threshold__c" ADD FOREIGN KEY ("Account__c") REFERENCES "Account" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Inventory_Threshold__c" ADD FOREIGN KEY ("Location__c") REFERENCES "Location__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "SKU_Override__c" ADD FOREIGN KEY ("Item__c") REFERENCES "Item__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "SKU_Override__c" ADD FOREIGN KEY ("Location__c") REFERENCES "Location__c" ("Id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "SKU_Override__c" ADD FOREIGN KEY ("Account__c") REFERENCES "Account" ("Id") DEFERRABLE INITIALLY IMMEDIATE;
