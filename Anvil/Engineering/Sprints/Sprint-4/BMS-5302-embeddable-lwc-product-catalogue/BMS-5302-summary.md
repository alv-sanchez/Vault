---
ticket: BMS-5302
status: To Do
type: Story
assignee: Auston Main
priority: High
generated: 2026-06-09
---

# BMS-5302: Develop externally embeddable LWC for product catalogue

## Summary
The goal is to build a production-ready Lightning Web Component that can be embedded on external (non-Salesforce) websites to let end users browse and search a product catalogue. The component must use Lightning Out for secure Salesforce communication and handle high concurrency (hundreds to thousands of simultaneous users). A POC already exists in the Sales-Demos repo that outlines the procedural approach. Elliot has shared screenshots of VIP's current product site (vtinfo.com/brandbuilder) as a reference for the existing competitor/comparison offering.

## Impact
- **Who is affected**: External retailers and distributors (specifically the "gulf" label suggests Gulf Distributing), plus any customer-facing website that needs to surface Salesforce product data
- **Current workaround**: VIP currently offers a similar product catalogue site (products.vtinfo.com/brandbuilder) — this is the competitive offering Ohanafy needs to match or exceed
- **Downstream risk**: Without an embeddable catalogue, customers relying on external product browsing have no Ohanafy-native solution — this is a competitive gap against VIP's existing tooling
- **Scope**: Large — requires Lightning Out infrastructure, external hosting considerations, security model for unauthenticated/guest access, and performance engineering for high concurrency

## Solution
1. **Lightning Out container setup** — configure a Lightning Out app to serve the LWC outside of Salesforce, following the POC in Sales-Demos repo *(existing — POC exists)*
2. **Product Catalogue LWC** — build a read-only component with search, filtering, brand browsing, and product detail views *(net-new)*
3. **Apex data layer** — create or expose APIs/controllers for product queries that can handle guest/unauthenticated access at scale *(net-new)*
4. **Security & authentication model** — define how external sites authenticate to Salesforce (connected app, site guest user, or public API) while keeping data read-only *(net-new)*
5. **Performance & scalability** — caching strategy, pagination, and load handling for hundreds-to-thousands concurrent users *(net-new)*
6. **Embeddable integration package** — script/snippet that external sites include to render the component *(net-new)*

## Readiness Assessment
**NEEDS REFINEMENT**
The ticket has a clear high-level goal and a POC to reference, but lacks acceptance criteria, detailed requirements for the UI (beyond matching VIP's offering), a defined security/auth model, and performance benchmarks. The POC repo provides procedural steps but the production requirements around concurrency, caching, and guest access need specification before implementation can begin confidently.

## Open Questions
- **[Analysis]**: What authentication model should external sites use — Salesforce Site guest user, connected app with client credentials, or public API? **BLOCKER**
- **[Analysis]**: What are the specific concurrency targets? "Hundreds to thousands" needs a concrete number for load testing and architecture decisions.
- **[Analysis]**: Should the component match VIP's feature set exactly (brand tabs, search, product detail as shown in Elliot's screenshots), or is there a distinct Ohanafy product catalogue design?
- **[Analysis]**: Which Salesforce org(s) will host this — is it per-customer or a central instance?
- **[Analysis]**: Are there specific product data fields/objects that need to be exposed, or does this use the existing E-Commerce product model?
- **[Elliot Flores]**: Shared VIP's current site as reference — is this the target feature parity, or a starting point?

## Comments
- **Elliot Flores** (2026-06-09): Shared link to VIP's current product catalogue offering at products.vtinfo.com/brandbuilder/00812/brands/tab/1 — "Vip's Current offering of this site"
- **Elliot Flores** (2026-06-09): Attached 4 screenshots of VIP's product site showing: brand listing page, brand detail page, product search results for "coors", and individual product detail page

## Dependencies & Connections
| Ticket | Relationship | Status | Summary |
|--------|-------------|--------|---------|
| *None linked* | — | — | No issue links or parent epic found. The POC lives in the Sales-Demos repo (not tracked as a Jira ticket). |
