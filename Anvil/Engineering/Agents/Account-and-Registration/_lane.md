# Account & Registration lane — `ACCT`

**Org alias**: `ecom-account` · **Status**: org claimed — 1 ticket (4258 went MANUAL)

Org verified 2026-06-12 (BMS-4995 setup agent): ecom packages present (org baseline e4cc770c contains worktree HEAD a395fe49), abandoned-cart batch scheduled, ecom Playwright smoke 4/4 green (chromium). Creds in `_shared/orgs.md`; worktree-local `.env` created in `.claude/worktrees/fable-project-as/`.

Ticket order:
1. `ACCT-3932` BMS-3932 — Self-service account management — To Do (scope decisions locked 2026-06-11: zone model + address validation deferred to v2, no approval process in v1 pending PO sign-off; Account_Change_Request__c is net-new if used)

NOT in lane: `ACCT-4258` BMS-4258 (multi-account registration) — In Progress, Alvaro
developing MANUALLY. ⚠️ Conflict watch: both tickets touch Ecom_UI_Wrappers and the ecom
perm sets; 3932's profile-page work is adjacent to registration. Coordinate via
_shared/contracts.md.

Gate: a ticket builds only when status = To Do (post-polish). Needs Refinement → /polish → To Do.
