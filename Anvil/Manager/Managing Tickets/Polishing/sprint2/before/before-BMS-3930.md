### Story Statement

As a **Gulf Retailer**, I want **retailer credit terms display & payment status**, so that **retailers can view their credit terms, outstanding balances, and payment status directly in the e-commerce portal — eliminating the need to call Gulf's AR department for routine account inquiries**

### Why It Matters

Gulf's AR team fields a high volume of calls from retailers asking basic questions about their credit limits, remaining balances, and invoice due dates. Surfacing this information in the self-service portal frees AR staff to focus on collections and dispute resolution while giving retailers 24/7 visibility into their financial standing.

### Gulf Context

**From Gulf Blueprint Workshops:**

- Gulf serves retailers across FL and AL with varying credit terms — Net 7, Net 15, Net 30 — often differentiated by account size, warehouse entity, and payment history, meaning a single portal view must reflect per-account credit configurations.
    
- New retailer onboarding (e.g., 7-Eleven expanding into Florida) creates accounts that may not yet have established credit terms, requiring the portal to gracefully handle accounts in a pending-credit-approval state.
    
- This ticket unlocks 13+ downstream e-commerce stories (BMS-3920 through BMS-3922 and beyond), indicating that credit terms display is a foundational dependency for order placement guardrails, payment workflows, and account management features.


`Scenario: Account carries the credit summary fields   Given a retailer Account in Salesforce   When  an admin views the Account detail page   Then  the Account shows the following new fields (all new, none exist today):         - Credit Limit  (Currency — manually set by AR)         - Outstanding Balance  (Currency — manually set by AR in Ph 1)         - Available Credit  (Formula: Credit Limit − Outstanding Balance)         - Past Due Balance  (Currency — manually set by AR in Ph 1)         - Credit Status  (Picklist: Approved, Pending Approval, Suspended, On Hold, Cash Only)         - Credit Last Reviewed  (Date)   And   AR users can edit Credit Limit, Outstanding Balance, Past Due Balance, Credit Status, Credit Last Reviewed   And   Portal users can only read these fields — never write`

`Scenario: Retailer views active credit terms and available balance   Given a retailer with approved Net 30 credit terms, a $25,000 credit limit, and $8,400 in outstanding invoices is logged into the Gulf e-commerce portal   When  the retailer navigates to the Account > Payment Status page   Then  The page displays: Credit Terms = 'Net 30', Credit Limit = '$25,000.00', Outstanding Balance = '$8,400.00', Available Credit = '$16,600.00'   And   Available Credit is calculated as Credit Limit minus Outstanding Balance in real time from Invoice__c records with Payment_Status__c != 'Paid'   And   The last payment date and amount are shown (e.g., 'Last Payment: $3,200.00 on 05/28/2025')`

`Scenario: Retailer views individual invoice payment statuses   Given the retailer has 4 open invoices across orders placed against the Montgomery AL warehouse   When  the retailer expands the 'Outstanding Invoices' section on the Payment Status page   Then  Each invoice row displays: Invoice_Number__c, Invoice_Date__c, Due_Date__c, Total Amount, Payment_Status__c (Open / Past Due / Partially Paid), and originating Warehouse name   And   Invoices past their Due_Date__c are flagged with a red 'Past Due' badge and sorted to the top   And   Partially paid invoices show both the original amount and the remaining balance`

`Scenario: Retailer with no established credit terms sees pending status   Given a newly onboarded retailer (e.g., a new 7-Eleven Florida location) whose credit application is still under review   When  the retailer logs into the portal and navigates to the Payment Status page   Then  The credit terms section displays: 'Credit Status: Pending Approval' with no credit limit or available balance shown   And   A message reads: 'Your credit application is under review. Contact your Gulf sales representative for status updates.'   And   The Outstanding Invoices section is either empty or shows any COD invoices already generated`

`Scenario: Credit data reflects recent payment within sync cycle   Given a retailer made a $5,000 payment that was posted to Gulf's AR system and synced to Salesforce Receipt__c   When  the retailer refreshes the Payment Status page after the sync cycle completes   Then  The Outstanding Balance decreases by $5,000 and Available Credit increases by $5,000   And   The corresponding invoice's Payment_Status__c updates from 'Open' to 'Paid' (or 'Partially Paid' if the payment was partial)   And   The Last Payment line updates to reflect the $5,000 payment with today's date`

`Scenario: Portal displays credit terms for multi-entity retailer   Given a retailer has separate accounts with Gulf's Milton FL entity (Net 15, $10,000 limit) and Mobile AL entity (Net 30, $20,000 limit)   When  the retailer views the Payment Status page   Then  Credit terms, limits, and balances are displayed separately per warehouse entity - not combined into a single aggregate   And   Each entity section is labeled with the warehouse name (e.g., 'Milton FL' and 'Mobile AL')   And   Outstanding invoices are grouped under their respective entity sections`