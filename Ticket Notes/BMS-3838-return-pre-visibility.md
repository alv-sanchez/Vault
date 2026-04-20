# BMS-3838: Return Pre-Visibility

- **Jira**: https://ohanafy.atlassian.net/browse/BMS-3838
- **Type**: Story | **Status**: To Do | **Priority**: TBD
- **Assignee**: Alvaro Sanchez

---

## What Is This

Warehouse supervisors need to know what's coming back on delivery trucks before the trucks arrive. Returns currently show up unannounced, competing with outbound operations.

## Story Statement

> As a **Gulf Delivery Driver**, I want **return pre-visibility**, so that **warehouse supervisors can staff unloading bays and allocate restocking labor before return trucks arrive.**

---

## Data Model (OHFY-Core)

Returns are handled through the `Credit__c` object — there is no separate `Return__c`.

```mermaid
erDiagram
    Credit ||--o{ Inventory_Adjustment : "triggers"
    Credit }o--|| Account : "for"
    Credit }o--o| Item : "product returned"
    Credit }o--o| Lot : "lot tracked"
    Credit }o--o| Location : "return to"
    Credit }o--o| Delivery : "from delivery"
    Inventory_Adjustment }o--|| Inventory : "updates"

    Credit {
        auto Credit_Number "C-00000000"
        picklist Credit_Type "Account or Invoice"
        picklist Status "Created or Applied"
        date Credit_Date
        lookup Account
        lookup Item
        lookup Lot
        lookup Location
        number Quantity
        number Amount
        boolean Return_To_Inventory
        boolean Picked_Up
        string Notes
        lookup Delivery
    }
    Inventory_Adjustment {
        auto Number "IA-00000000"
        lookup Credit "source"
        lookup Inventory
        number Quantity_Change
        string Type
        string Reason
        boolean Credit_Return_Flag
    }
```

---

## Proposed Solution

### LWC: `returnPreVisibility`

A dashboard component showing all **pending returns** (Credits with `Status__c = 'Created'` and `Return_To_Inventory__c = true`) grouped by delivery route/truck, giving warehouse leads advance notice.

```mermaid
flowchart TD
    A[Driver captures return on route] --> B[Credit record created]
    B --> C{Status = Created}
    C --> D[Return Pre-Visibility Dashboard]

    D --> E[Group by Delivery / Route]
    E --> F[Show items, qty, reason, lot info]
    F --> G{Warehouse lead reviews}

    G --> H[Allocate bay + labor]
    G --> I[Flag items needing inspection]

    B --> J{Truck arrives}
    J --> K[Process returns]
    K --> L[Status = Applied]
    L --> M[Inventory_Adjustment created]
    M --> N[Inventory updated]

    style A fill:#e1f5fe
    style B fill:#fff9c4
    style D fill:#c8e6c9
    style F fill:#c8e6c9
    style H fill:#c8e6c9
    style K fill:#ffcdd2
    style N fill:#c8e6c9
```

### Key Features

**Incoming Returns View**
- Query: `Credit__c WHERE Status__c = 'Created' AND Return_To_Inventory__c = true`
- Grouped by: Delivery/Route (via `Delivery__c` lookup)
- Shows: Item name, qty, lot (if tracked), reason/notes, credit date
- Color coding: red for high qty, orange for lot-tracked (needs inspection), green for standard

**Route/Truck Summary**
- Card per delivery route showing total items returning, total qty, ETA (if available)
- Expandable to see line-level detail

**Filters**
- Date range (today, tomorrow, this week)
- Location (which warehouse is receiving)
- Item search

**Lot-Tracked Returns**
- Highlight items where `Lot__c` is populated
- Show lot expiration date — flag if expired (may not be restockable)

### Apex Controller

```
@AuraEnabled
public static List<ReturnSummary> getPendingReturns(Id locationId, Date fromDate, Date toDate) {
    // Query Credit__c WHERE Status__c = 'Created' 
    //   AND Return_To_Inventory__c = true
    //   AND Location__c = :locationId
    //   AND Credit_Date__c >= :fromDate AND Credit_Date__c <= :toDate
    // Include: Item__r.Name, Item__r.Item_Number__c, Lot__r.Lot_Identifier__c,
    //          Lot__r.Expiration_Date__c, Delivery__r.Name, Quantity__c, Notes__c
    // Group by Delivery__c for route-level summary
}
```

### Dashboard Layout

```mermaid
flowchart TD
    subgraph header[Header]
        A[Location Selector]
        B[Date Range Filter]
        C[Search]
    end
    subgraph cards[Summary Cards]
        D[Route 1 - 12 items returning]
        E[Route 2 - 5 items returning]
        F[Route 3 - 0 returns]
    end
    subgraph table[Detail Table]
        G[Item Name, Qty, Lot, Reason, Notes]
    end
    header --> cards
    cards --> table
    style D fill:#ffcdd2
    style E fill:#fff9c4
    style F fill:#c8e6c9
```

### MVP Scope
- [x] Pending returns query (Status = Created, Return_To_Inventory = true)
- [x] Group by delivery/route
- [x] Item detail with qty, lot info, reason, notes
- [x] Location filter
- [x] Date range filter
- [x] Lot expiration flagging
- [ ] Push notification to warehouse lead (future)
- [ ] ETA calculation based on route progress (future)
- [ ] Integration with driver handheld app (future — data already captured)

---

## Relationship to BMS-3823

These two tickets are complementary:

```mermaid
flowchart LR
    A[BMS-3838 Return Pre-Visibility] -->|returns affect| B[Inventory at Location]
    C[BMS-3823 Cross-Location Visibility] -->|reads from| B
    A -->|completed returns update| D[Inventory_Adjustment]
    D --> B

    style A fill:#e1f5fe
    style C fill:#fff9c4
    style B fill:#c8e6c9
    style D fill:#c8e6c9
```

- Returns (3838) **write** to inventory — knowing what's coming back affects available qty
- Cross-location visibility (3823) **reads** from inventory — seeing all locations includes pending returns
- Both share the same `Inventory__c` + `Location__c` data model

---

## Questions for Refinement

1. Where does this dashboard live — internal Salesforce tab or distro app? 
- Home Page
1. Does the `Credit__c.Delivery__c` lookup reliably capture which route the return is coming from?
2. Is there a status between "Created" (on route) and "Applied" (processed) that we should use, or do we add one?
3. Should warehouse leads be able to flag/triage items from this dashboard (e.g., "needs inspection", "refuse return")?
4. How granular is route ETA — do we have truck GPS data or just route completion status?

