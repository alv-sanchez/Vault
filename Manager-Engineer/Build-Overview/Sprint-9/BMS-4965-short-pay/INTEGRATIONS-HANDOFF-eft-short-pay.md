# Integrations Hand-off — EFT / bank-rec short pays → Short-Pay Review Queue

**Epic:** BMS-4965 Short Pay Automation · **Ingestion ticket:** BMS-5626 (consumer not yet built)
**Audience:** Integrations team wiring the EFT / bank remittance feed into Salesforce.

## TL;DR
An EFT short pay is **not a new record and not a special type**. It's an existing `ohfy__Invoice__c`
where the money came up short. Two things — and only two — make it appear in the Short-Pay Review Queue:

1. `ohfy__Amount_Paid__c` < `ohfy__Total_Due__c`  → the read-only `Short_Pay_Amount__c` formula goes positive
2. `ohfy__Short_Pay_Status__c = 'Open'`  → **nothing auto-sets this; the integration MUST write it**

There is **no EFT/channel/source flag**. Driver short pays and EFT short pays are indistinguishable
by field — both flow through the same two-field gate. Origin is not tracked.

---

## The two status fields (don't confuse them)
Same object, two independent picklist columns on one `ohfy__Invoice__c` row. Not separate objects.

|  | `Short_Pay_Approval_State__c` | `Short_Pay_Status__c` |
| --- | --- | --- |
| **Tracks** | At-delivery approval gate — may the driver finalize? | Back-office AR lifecycle — how the money gets resolved |
| **Values** | None · Pending · Approved · Rejected | Open · Under Review · Escalated · Rep Collection · Resolved-Credit · Resolved-Collected · Rolled-Forward · Written Off |
| **Set by** | `S_ShortPayApprovalWorkflow` (driver finalize) | `S_ShortPayResolution` / escalation batch (AR) |
| **Drives** | Short-Pay **Approvals** LWC | Short-Pay **Review Queue** LWC |
| **Integration writes it?** | ❌ **NO — leave null/None** | ✅ **YES — set to `Open`** |

> ⚠️ If you write `Short_Pay_Approval_State__c` you'll wrongly surface the invoice in the driver
> Approvals queue. EFT short pays are an AR concern — only touch `Short_Pay_Status__c`.

| Event | Approval_State | Status | In Approvals? | In Review Queue? |
| --- | --- | --- | --- | --- |
| Driver finalizes short | Pending | null | ✅ | ❌ |
| Manager approves / rejects | Approved / Rejected | null | ❌ | ❌ |
| **EFT/bank-rec short (this feed)** | **null** | **Open** | ❌ | ✅ |

---

## The three "open" Review-Queue statuses — set `Open`, nothing else
All three keep an invoice in the queue (`Short_Pay_Status__c IN {Open, Under Review, Escalated}`),
but they are owned by different actors. Integrations write **only** `Open`.

| Status | Set by | Trigger | Integration writes it? |
| --- | --- | --- | --- |
| **Open** | The integration / driver-bridge / seed | Entry state — just landed, untouched, awaiting AR | ✅ **Always write this** |
| **Under Review** | **No code — manual only** | An AR analyst hand-flips it (field is FLS-editable) to mean "I'm actively working this" | ❌ **Never** |
| **Escalated** | Batch `B_Invoice_ShortPayEscalation` | Shortfall crosses a per-state cap in `Short_Pay_State_Threshold__mdt` (AL = first dollar/day-zero; FL = $50 / 2% / 7-day age) | ❌ **Never — the batch owns it** |

> Writing `Under Review` or `Escalated` from the feed fakes a state a human or the batch is meant to
> own. Land everything as `Open` and let AR / the escalation batch move it from there.

---

## Write contract — what to send per short-paid invoice
Match the **existing** invoice (do not insert a new one) and update these fields:

| Field (API) | Value | Required | Notes |
| --- | --- | --- | --- |
| `ohfy__Amount_Paid__c` | EFT amount actually received (absolute paid-to-date, **< Total_Due**) | ✅ | Plain currency, writeable. Drives the shortfall. **Set the absolute figure, never decrement** — safe on re-runs. |
| `ohfy__Short_Pay_Status__c` | `Open` | ✅ | The queue filter. Nothing else opens it. |
| `ohfy__Short_Pay_Reason__c` | one of: `Partial Payment` · `Disputed Amount` · `Damaged Goods Deduction` · `Promotional Dispute` · `Other` | ⬜ optional | Populates the Reason column. Use `Partial Payment` for a plain EFT under-payment. |
| `ohfy__Fulfillment_Location__c` | Location whose `Location_State__c` is set (FL/AL/…) | ⬜ usually already set | Drives the Warehouse column **and** per-state escalation. Leave as-is if already populated. |
| `ohfy__External_ID__c` | your stable idempotency key | ✅ for upsert | Every object has `External_ID__c`. **Upsert on this** so a re-sent remittance updates in place. |

**Do NOT write:**
- `ohfy__Short_Pay_Amount__c` — formula (`Total_Due − Amount_Paid + Carried_Forward`), read-only.
- `ohfy__Short_Pay_Approval_State__c` — driver gate, not yours.

**Match key:** upsert `ohfy__Invoice__c` by `ohfy__External_ID__c` (or resolve the invoice by its
invoice number first, then update). Never create a duplicate invoice for the remittance.

---

## What happens after you write it
1. Row appears in the **Short-Pay Review Queue** LWC immediately (`Short_Pay_Amount__c > 0` + status Open).
2. The nightly escalation batch (`B_Invoice_ShortPayEscalation`) promotes `Open → Escalated` when the
   shortfall crosses the per-state caps in `Short_Pay_State_Threshold__mdt`
   (e.g. **AL = escalate on the first dollar, day zero**; FL = $50 / 2% / 7-day age).
3. AR resolves from the queue (credit, collected, rep-collection, roll-forward, write-off) →
   `S_ShortPayResolution` moves `Short_Pay_Status__c` to a terminal value.

## Open items / caveats
- **No Apex ingestion service exists yet (BMS-5626).** Until it's built, you're writing these fields
  directly via the API. If/when a `S_ShortPayIngestion`-style service ships, the contract may move
  behind it — confirm before go-live.
- Enhanced-security orgs: the integration user needs FLS edit on `Amount_Paid__c` +
  `Short_Pay_Status__c` (or the `Legacy_Security_Bypass` permset), or writes fail inside `InvoiceTrigger`.
- FL/AL threshold values are **AI-assumed pending Ops ratification** — don't hard-code them integration-side; they live in `Short_Pay_State_Threshold__mdt`.
