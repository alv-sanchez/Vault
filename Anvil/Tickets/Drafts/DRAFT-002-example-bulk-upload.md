---
ticket: DRAFT-002
title: "Bulk Product Upload — CSV Import for Admins"
type: Story
status: Draft
priority: Medium
assignee:
reporter:
epic:
sprint:
labels:
  - admin
  - ecom
package:
effort: M
components:
blocked_by:
blocks:
created: 2026-04-15
updated: 2026-04-15
jira:
tags:
  - ticket
  - draft
  - ecom
---

# DRAFT-002: Bulk Product Upload — CSV Import for Admins |ECOM|

> **Status**: Draft — not yet created in Jira. Review and approve before pushing.

## Related
- Source ask: [[example-stakeholder-request]] (in Manager/On-site Feedback/)

---

**Priority**: Medium
**Effort**: M (1–2 days)
**Components**: `productBulkUpload` LWC, `ProductImportController` Apex

## Story Statement

As an Admin, I want to upload a CSV file to create or update products in bulk, so that I can onboard a new catalog without clicking through each product form.

## Acceptance Criteria

### SCENARIO: Valid CSV upload
**GIVEN** an admin is on the Product Admin page
**WHEN** they upload a CSV matching the documented schema
**THEN** matching products are updated and new rows are created
**AND** a success summary shows counts for created/updated/skipped rows

### SCENARIO: Invalid CSV rejected with row-level errors
**GIVEN** a CSV has malformed rows (missing required fields, bad SKU format)
**WHEN** the admin uploads it
**THEN** the upload is rejected
**AND** a downloadable error report identifies the offending rows

## Dependencies

- **Cannot Start Until**: None
- **This Story Unlocks**: Future bulk price-update ticket
- **Ships With**: None

## Testing Notes

- CSV column order variations
- Rows with whitespace / BOM / mixed line endings
- Duplicate SKUs within a single file
- Permission check: non-admin users cannot see the upload UI

## Implementation Notes

- New LWC `productBulkUpload` placed on Product Admin app page
- Apex `ProductImportController.import(Blob csv)` returns `ImportResult`
- Chunk at 200 rows per DML to stay under governor limits
