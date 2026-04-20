---
ticket: DRAFT-002
title: "Retailer ↔ Sales rep chat portal (discovery + implementation)"
type: Story
status: Backlog
priority: Low
assignee:
reporter:
epic:
sprint:
labels:
  - ecom
  - post-launch
  - deferred
  - discovery
package: E-Commerce
effort: XL
components:
  - (TBD — depends on discovery outcome)
blocked_by:
blocks:
created: 2026-04-13
updated: 2026-04-13
jira:
tags:
  - ticket
  - ecom
  - draft
  - deferred
---

# DRAFT-002: Retailer ↔ Sales rep chat portal |ECOM|

> [!warning] ⚠️ Currently DEFERRED per manager triage
> This story is parked in the post-launch backlog. It should **not** be pulled into a sprint until a discovery spike completes (see "Phase 0" below). Before any implementation work starts, the licensing question and the rep-demand question must both resolve — otherwise we risk building a chat feature that reps don't staff, which would be worse than not having one at all. A lightweight alternative (a "contact my rep" mailto/tel button) is listed in the Alternative Scopes section and could ship independently as an S-effort story.

## Related
- Manager note: [[retailer-sales-rep-chat]]
- Alternative scope: [[DRAFT-XXX-contact-my-rep-button]] (not yet created — see Alternatives below)
- Testing: [[BMS-XXXX]] (once the discovery spike converts to an implementation story)
- Docs: [[notification-services]] (potential integration point)

---

**Priority**: Low
**Effort**: XL (weeks + licensing procurement)
**Components**: TBD based on discovery — candidates include Salesforce Messaging for In-App, Experience Cloud Chat (Digital Engagement license), or a custom LWC + message store

## Story Statement

As a **Retailer**, I want to **chat with my assigned sales rep from within the ecom portal**, so that **I can resolve questions about products, pricing, or orders without leaving the ordering flow**.

## Phase 0: Discovery Spike (required before implementation)

This story should NOT transition to "In Progress" until the following spike completes and a clear path forward is approved.

### SCENARIO: Licensing feasibility confirmed
**GIVEN** the engineering team is evaluating chat options
**WHEN** a discovery spike investigates Gulf's existing Salesforce licensing
**THEN** we have a documented answer for whether Digital Engagement / Service Cloud Messaging is available
**AND** if not available, the procurement cost and timeline are documented
**AND** the decision between "Salesforce-native chat" vs "custom LWC + message store" is made and recorded

### SCENARIO: Rep demand validated
**GIVEN** the discovery spike is in progress
**WHEN** we interview 3–5 sales reps about their current retailer communication habits
**THEN** we have a documented answer for whether reps actively want a chat channel (vs preferring phone/text)
**AND** we understand the expected response SLA from the rep side
**AND** if reps don't want it, this story is killed outright — not deferred further

## Acceptance Criteria (applies ONLY if Phase 0 approves implementation)

### SCENARIO: Retailer initiates a chat with their assigned rep
**GIVEN** a retailer is logged into the ecom portal
**WHEN** the retailer opens the chat widget
**THEN** the chat opens a session addressed to the retailer's assigned sales rep
**AND** if the rep is online, an active session begins
**AND** if the rep is offline, the retailer sees "Your rep is offline — message sent, they'll reply via email" and the message is stored for async delivery

### SCENARIO: Sales rep receives and responds to a retailer message
**GIVEN** a retailer has sent a chat message
**WHEN** the rep checks their inbox / chat console
**THEN** the rep sees the retailer name, account, and message content
**AND** the rep can reply inline from the Salesforce UI (or a dedicated rep-side app)

### SCENARIO: Chat history is auditable
**GIVEN** a retailer and rep have exchanged messages
**WHEN** an admin or compliance officer queries the account's message history
**THEN** all messages are retrievable with timestamps and sender attribution
**AND** retention policy is configurable (e.g., 2 years default)

### SCENARIO: Chat availability is clearly signaled
**GIVEN** a retailer is browsing the ecom portal
**WHEN** they see the chat widget
**THEN** the widget clearly indicates whether the rep is currently online, offline, or "away"
**AND** a retailer never sends a chat into a black hole without knowing it won't be answered in real time

## Dependencies

- **Cannot Start Until**: Phase 0 discovery spike completes AND go-live is in the rearview (this is explicitly a post-launch item)
- **This Story Unlocks**: Potentially a new retailer-support surface area — could expand into in-app notifications, order-specific chat threads, etc.
- **Ships With**: N/A (standalone)

## Testing Notes (deferred until Phase 0 chooses an implementation path)

Once the underlying tech is chosen (Salesforce Messaging vs custom), testing notes will focus on:
- Real-time message delivery between retailer and rep
- Offline message queuing and async delivery
- Rep-availability indicator accuracy
- Session persistence across page navigation
- Message history retrieval and retention
- Mobile responsiveness (chat widget must work on iOS/Android browsers)
- Graceful degradation when the rep is unassigned or inactive

## Implementation Notes (deferred until Phase 0 outcome)

Current unknowns that prevent committing to an implementation approach:

1. **Licensing**: Digital Engagement is not free. Need a procurement decision.
2. **Tech stack**: Three viable paths — Salesforce Messaging for In-App (simplest if licensed), Experience Cloud Chat (richest but most expensive), custom LWC + `Message__c` object (most flexible but highest engineering cost).
3. **Rep-side UX**: Console app, inbox view, or notification-only? Tied to how reps want to consume incoming messages.
4. **Routing logic**: Do messages always go to `Account.Owner`, or is there a round-robin for team accounts?
5. **Compliance / retention**: State alcohol regulators require order-related communications to be retained for audit — chat logs may fall under the same requirement.

## Alternative Scopes

If the stakeholder pushes to accelerate this pre-launch, propose the following **instead** of the full chat portal:

### Alternative A: "Contact my rep" button (S effort, could ship pre-launch)
- Add a button to the ecom header / product pages / order detail that opens the retailer's default mail client or phone dialer with the rep's contact pre-filled
- Uses `mailto:` and `tel:` links — zero new infrastructure
- Satisfies the "let retailers reach their rep from ecom" intent at roughly 2% of the effort of a full chat feature
- Would be a new story ([[DRAFT-XXX-contact-my-rep-button]]), not a sub-task of this one

### Alternative B: Contact form → email bridge (M effort)
- Retailer fills a form in ecom; message is emailed to the rep
- One-way async, no live-chat pretense
- Middle ground between "no chat" and "real chat"

## Notes from Manager Triage

> **Verdict**: DEFER (revisit 2–3 months post-launch)
>
> **Sentiment source**: Go-live feedback list — stakeholder marked it Low themselves. Decision rule #4 — brand-new surface area (real-time communication channel) that needs discovery, not a rush. This isn't merchandising polish but it's the same "doesn't belong pre-launch" category.
>
> **Why NOT now**: XL work with licensing implications (Digital Engagement isn't free) and needs real user research with the reps first. Launching a chat feature that reps don't actively staff would be worse than not having it at all. Retailers can already call or text their rep today; the lightweight "contact my rep" button alternative would satisfy 80% of the need at 2% of the cost if anyone pushes to accelerate.
