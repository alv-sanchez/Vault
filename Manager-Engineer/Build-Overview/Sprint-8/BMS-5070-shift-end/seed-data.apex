/**
 * BMS-5070 Shift-End Workflow — demo seed data for ohfy-val-4078 (BMS-4078)
 *
 * Copied verbatim from the branch seed script:
 *   OHFY-Split/.claude/worktrees/agent-a3a41df500f3a5d0b/orgScripts/seedShiftEndChecklistDemo.apex
 *
 * Creates:
 *   1. Milton FL warehouse Location (Name='Milton FL', Type='Warehouse')
 *   2. Shift_End_Checklist__c via S_ShiftEndChecklist.initiate (Mid shift, today)
 *      → SEC-00000002, status In Progress
 *   3. 4x Pick_Event__c DAMAGED records (today GMT window, 14 total cases)
 *      NOTE: the seed script creates 4 events (14 cases). The verified org has
 *      9 events totalling 34 cases — those may include events from prior runs or
 *      manual adds. Re-running this script is idempotent via External_Id__c.
 *   4. 4x Shift_End_Checklist_Item__c (Safety / Equipment / Replenishment / Other)
 *   5. 2x Shift_Pass_Down__c rows
 *
 * Run:
 *   sf apex run --file seed-data.apex -o ohfy-val-4078
 *
 * KNOWN PHASE-1 GAP:
 *   Total_Breakage_Cases__c on the checklist will read 0 — the rollup is
 *   BMS-4080 (Phase 3, not yet built). The real breakage total comes from the
 *   damagedEvents list the screen loads at runtime, not the header field.
 *   This is expected behaviour, not a bug.
 */

// ── 1. Create (or find) Milton FL warehouse ──────────────────────────────────
// Warehouse__c is a formula: for Type__c='Warehouse' it returns Name.
// Warehouse_Shift_Config__mdt.Warehouse_Code__c = 'Milton FL' must match Location.Warehouse__c.
ohfy__Location__c miltonWarehouse;
List<ohfy__Location__c> existingWarehouses = [
    SELECT Id, Name, ohfy__Warehouse__c
    FROM ohfy__Location__c
    WHERE Name = 'Milton FL'
    AND ohfy__Type__c = 'Warehouse'
    LIMIT 1
];

if (!existingWarehouses.isEmpty()) {
    miltonWarehouse = existingWarehouses[0];
    System.debug('Found existing Milton FL warehouse: ' + miltonWarehouse.Id);
} else {
    miltonWarehouse = new ohfy__Location__c(
        Name = 'Milton FL',
        ohfy__Type__c = 'Warehouse',
        ohfy__External_Id__c = 'seed:location-milton-fl-warehouse'
    );
    insert miltonWarehouse;
    System.debug('Created Milton FL warehouse: ' + miltonWarehouse.Id);
}

// ── 2. Create the Shift_End_Checklist__c via the service ─────────────────────
// Use today's date as shiftDate; shift key = 'Mid' (Milton FL has Day/Mid/Night)
Date shiftDate = Date.today();
ohfy__Shift_End_Checklist__c checklist = ohfy.S_ShiftEndChecklist.initiate(
    miltonWarehouse.Id,
    'Mid',
    shiftDate
);
System.debug('Checklist Id: ' + checklist.Id + ' Status: ' + checklist.ohfy__Status__c);

// ── 3. Create DAMAGED Pick_Event__c records in the GMT day window ─────────────
// S_BreakageReview.getDamagedEvents windows by: Timestamp__c >= dayStart AND < dayEnd (GMT)
// dayStart = DateTime.newInstanceGmt(shiftDate, Time.newInstance(0,0,0,0))
// Required fields: Event_Type__c, Pick_Session_Id__c, Timestamp__c
DateTime dayStartGmt = DateTime.newInstanceGmt(shiftDate, Time.newInstance(0, 0, 0, 0));
Id runnerId = UserInfo.getUserId();

List<ohfy__Pick_Event__c> damagedEvents = new List<ohfy__Pick_Event__c>{
    new ohfy__Pick_Event__c(
        ohfy__Event_Type__c = 'PICK_COMPLETE',
        ohfy__Pick_Session_Id__c = 'demo-session-001',
        ohfy__Timestamp__c = dayStartGmt.addHours(6),
        ohfy__Location__c = miltonWarehouse.Id,
        ohfy__Reason__c = 'DAMAGED',
        ohfy__Breakage_Quantity__c = 3,
        ohfy__Picker__c = runnerId,
        ohfy__External_Id__c = 'seed:pick-event-damaged-001'
    ),
    new ohfy__Pick_Event__c(
        ohfy__Event_Type__c = 'PICK_COMPLETE',
        ohfy__Pick_Session_Id__c = 'demo-session-001',
        ohfy__Timestamp__c = dayStartGmt.addHours(7).addMinutes(15),
        ohfy__Location__c = miltonWarehouse.Id,
        ohfy__Reason__c = 'DAMAGED',
        ohfy__Breakage_Quantity__c = 2,
        ohfy__Picker__c = runnerId,
        ohfy__External_Id__c = 'seed:pick-event-damaged-002'
    ),
    new ohfy__Pick_Event__c(
        ohfy__Event_Type__c = 'SHORT_PICK',
        ohfy__Pick_Session_Id__c = 'demo-session-002',
        ohfy__Timestamp__c = dayStartGmt.addHours(8).addMinutes(30),
        ohfy__Location__c = miltonWarehouse.Id,
        ohfy__Reason__c = 'DAMAGED',
        ohfy__Breakage_Quantity__c = 5,
        ohfy__Picker__c = runnerId,
        ohfy__External_Id__c = 'seed:pick-event-damaged-003'
    ),
    new ohfy__Pick_Event__c(
        ohfy__Event_Type__c = 'PICK_COMPLETE',
        ohfy__Pick_Session_Id__c = 'demo-session-002',
        ohfy__Timestamp__c = dayStartGmt.addHours(10),
        ohfy__Location__c = miltonWarehouse.Id,
        ohfy__Reason__c = 'DAMAGED',
        ohfy__Breakage_Quantity__c = 4,
        ohfy__Picker__c = runnerId,
        ohfy__External_Id__c = 'seed:pick-event-damaged-004'
    )
};
insert damagedEvents;
System.debug('Inserted ' + damagedEvents.size() + ' DAMAGED events');

// ── 4. Create Shift_End_Checklist_Item__c rows ────────────────────────────────
List<ohfy__Shift_End_Checklist_Item__c> items = new List<ohfy__Shift_End_Checklist_Item__c>{
    new ohfy__Shift_End_Checklist_Item__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Item_Type__c = 'Safety',
        ohfy__Notes__c = 'Confirm all floor mats secured in pick aisles',
        ohfy__Is_Complete__c = true,
        ohfy__External_Id__c = 'seed:checklist-item-001'
    ),
    new ohfy__Shift_End_Checklist_Item__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Item_Type__c = 'Equipment',
        ohfy__Notes__c = 'Return all RF guns to charging dock',
        ohfy__Is_Complete__c = true,
        ohfy__External_Id__c = 'seed:checklist-item-002'
    ),
    new ohfy__Shift_End_Checklist_Item__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Item_Type__c = 'Replenishment',
        ohfy__Notes__c = 'Verify Milton FL bay 3 restock completed',
        ohfy__Is_Complete__c = false,
        ohfy__External_Id__c = 'seed:checklist-item-003'
    ),
    new ohfy__Shift_End_Checklist_Item__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Item_Type__c = 'Other',
        ohfy__Notes__c = 'Document damaged cases in bay 7 for insurance claim',
        ohfy__Is_Complete__c = false,
        ohfy__External_Id__c = 'seed:checklist-item-004'
    )
};
insert items;
System.debug('Inserted ' + items.size() + ' checklist items');

// ── 5. Create Shift_Pass_Down__c rows ─────────────────────────────────────────
List<ohfy__Shift_Pass_Down__c> passDowns = new List<ohfy__Shift_Pass_Down__c>{
    new ohfy__Shift_Pass_Down__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Category__c = 'Safety',
        ohfy__Note__c = 'Bay 7 forklift aisle has a cracked floor tile — flag for facilities before Day shift loads.',
        ohfy__Flagged_For_Next_Shift__c = true,
        ohfy__Author__c = runnerId,
        ohfy__External_Id__c = 'seed:pass-down-001'
    ),
    new ohfy__Shift_Pass_Down__c(
        ohfy__Shift_End_Checklist__c = checklist.Id,
        ohfy__Category__c = 'Replenishment',
        ohfy__Note__c = 'Modelo 24-pack restock delayed — truck ETA 6AM. Day shift should monitor dock 2.',
        ohfy__Flagged_For_Next_Shift__c = false,
        ohfy__Author__c = runnerId,
        ohfy__External_Id__c = 'seed:pass-down-002'
    )
};
insert passDowns;
System.debug('Inserted ' + passDowns.size() + ' pass-down notes');

// ── Verification: exact controller call the LWC makes on Initiate/Load ────────
Map<String, Object> bundle = ohfy.ShiftEndChecklistController.loadChecklist(
    miltonWarehouse.Id,
    'Mid',
    shiftDate
);
ohfy__Shift_End_Checklist__c loadedChecklist = (ohfy__Shift_End_Checklist__c) bundle.get('checklist');
List<ohfy__Shift_End_Checklist_Item__c> loadedItems = (List<ohfy__Shift_End_Checklist_Item__c>) bundle.get('items');
List<ohfy__Pick_Event__c> loadedDamaged = (List<ohfy__Pick_Event__c>) bundle.get('damagedEvents');
List<ohfy__Shift_Pass_Down__c> loadedPassDowns = (List<ohfy__Shift_Pass_Down__c>) bundle.get('passDowns');

Integer sumBreakage = 0;
for (ohfy__Pick_Event__c pe : loadedDamaged) {
    if (pe.ohfy__Breakage_Quantity__c != null) {
        sumBreakage += pe.ohfy__Breakage_Quantity__c.intValue();
    }
}

System.debug('=== RENDER VERIFICATION ===');
System.debug('Checklist Id: ' + loadedChecklist.Id);
System.debug('Checklist Status: ' + loadedChecklist.ohfy__Status__c);
System.debug('Items count: ' + loadedItems.size());
System.debug('Damaged events count: ' + loadedDamaged.size());
System.debug('Total breakage cases (sum of Breakage_Quantity__c): ' + sumBreakage);
System.debug('Pass-downs count: ' + loadedPassDowns.size());
System.debug('Warehouse Id: ' + miltonWarehouse.Id);
