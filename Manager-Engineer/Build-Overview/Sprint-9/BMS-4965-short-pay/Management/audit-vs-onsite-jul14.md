---
title: BMS-4965 Short Pay — Audit vs Jul-14 On-site Direction
epic: BMS-4965
source_transcript: "Transcripts/Gulf On-site/Short-Pay-Publix-EFT.md (Jul 14 2026 PM)"
audited: 2026-07-15
auditor: Alvaro Sanchez
status: reviewed
---

# Audit — Epic content vs Jul-14 on-site direction

**Framing:** All child tickets were scoped from *Gulf Blueprint Workshops* + the *2026-07-01 Product review* (last touched 07-06). The Jul-14 on-site is ~8 days newer. Approval + EFT lanes landed on-target; several Jul-14 mechanisms are **not yet ticketed** (see below). Tracked here + mirrored as a traceability comment on BMS-4965.

## Coverage snapshot
| Transcript area | Ticket | Verdict |
|---|---|---|
| A · Short pay = paid ≠ due, broader than Publix, no-pay=short pay | Epic + 5626 | ✅ Aligned |
| B · Root causes (pricing disc / qty-item change), reason taxonomy | 4057 + 4058 | 🟡 Partial |
| C · Detect at stop via **check-scan / payment-validation layer** | — | 🔴 **OUT OF SCOPE (decided 07-15)** |
| C' · Publix **DEX/DSD vendor integration** (invoice↔DSD sync) | — | 🔴 Unticketed (open scope) |
| D · Alert-at-finalize → AR + driver mgr; owner + board; Terry owns | 4059 + 4060 | 🟡 Partial |
| E · Hard-gate finalize until collected OR approved; configurable threshold | 5625 + 5631 | ✅ Strong match |
| F · Outcomes: collect / adjust invoice / dispute / **roll-to-next-invoice** / write-off / sales-rep / reason code / non-deliverable | 4060 + 4058 | 🟡 Partial |
| G · Pain: ~1000 uncollected on books | Epic context | ✅ Captured |

## Decisions (confirmed)
- **Check-scan / payment-validation layer → OUT OF SCOPE for this epic (07-15, Alvaro).** Detection stays manual driver-flag (4058). Recorded as an explicit exclusion on the epic so it isn't silently assumed built.

## Unticketed for traceability (NOT lost — deliberately not built yet)
1. **Check-scan / payment-validation layer** — out of scope (above). AI check-image read, N-fail→manual key, memo/payee/signature validation rules, overpayment/multi-invoice matching.
2. **Publix DEX/DSD vendor integration** — Xerecistech-style invoice↔DSD sync so amounts match at source. Distinct from 5626 (bank-rec detection). Open scope call.
3. **Roll short pay → next invoice** — explicit outcome (FL 10-day collect window). Only vaguely folded into 4060; not a named AC.
4. **Sales-rep collection of outstanding balance** — resolution outcome, not called out.
5. **Non-deliverable enforcement** — block account until paid if uncollected next delivery. Not ticketed (Gulf flagged caution: "often our fault").

## Open decisions → routed to PO (Elliot Flores)
- **O-1 · Approval threshold value** ($ or %) for auto-accept vs route-for-approval, + contact path above cutoff. Engine is already configurable (5625/5631 CMDT) — only the *value* is open. → **Ops (Josh / Dom / Ashton).**
- **O-2 · Invoice cut / modification authorization** — can drivers cut/edit an invoice line, and who authorizes a cut? Root cause of DSD shorts. → **Jimmy / Ashton, Thursday pricing call.**
- **O-3 · Publix DEX integration** — build DSD-sync (item #2) or keep consuming from bank rec (5626)? → scope decision, not made.

## Integration-owned scope (NOT the engineer) — confirmed 07-15
These land on the integration/vendor/platform side. The Salesforce engineer *consumes* the output; they do not build the pipe.
- **I-1 · Bank Reconciliation sync / bank feed** — getting EFT payment + open-balance data into SF (and possibly flagging the short at sync) is the bank/aggregator feed. Engineer consumes the synced record only. The BMS-5626 open question ("does sync already flag the short, or build it?") is exactly this ownership line.
- **I-2 · Publix DEX/DSD invoice-sync integration** — Xerecistech-style vendor/EDI sync of Gulf invoice ↔ Publix DSD so amounts match at source. Pure integration; no Apex fixes a mismatch that originates in the retailer's system.
- **I-4 · Check-scan image capture + OCR/AI** *(epic-excluded, flagged so scope-back never defaults to the engineer)* — reading a check off a device image is device + OCR/AI integration.

**Engineer-owned, confirmed:** Driver **Finalize Stop is a Salesforce screen** — the 5625/5631 approval gate is fully engineer-owned, no handheld hand-off boundary. (Twilio SMS not flagged as a blocking integration.)

## Alignment wins (no action)
- 5625/5631 hard-gate = "it's not gonna let him proceed until something happens." Exact match.
- 5626 EFT-via-bank-rec = "only caught at bank reconciliation / Lisa Thompson." Exact match; open questions correctly capture consume-vs-build.
- Mandatory reason code (4058) = "100%, we have to have a reason code."
