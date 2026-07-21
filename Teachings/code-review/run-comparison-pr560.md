# Real-PR run comparison — old (single-pass) vs. new (chunked + dependency waves)

**Date:** 2026-07-17
**Subject PR:** [Ohanafy/OHFY-Split #560](https://github.com/Ohanafy/OHFY-Split/pull/560) — `feat(ecom): Phase 2 — pricing/promo completion & checkout (BMS-5576)`
**Change under test:** [#578 `chore/scale-code-review-large-prs`](https://github.com/Ohanafy/OHFY-Split/pull/578) — Phase 0.5 scaling + dependency-ordered wave chunking of `/code-review`
**Posted review (new run):** <https://github.com/Ohanafy/OHFY-Split/pull/560#pullrequestreview-4725420335> (7 inline + full body, `COMMENT` only)

This is the "rung 3 / measure" step from [[lesson-2-scaling-large-prs]] — the one that turns "I think this helps" into observed data. It is a **single** before/after run, not a statistical result. Treat it as one honest data point, not proof.

---

## The PR under review

12,228 changed lines across 100 files — a genuine four-tier dependency chain plus shared paths:

| Package | Files | ~Changed lines | Tier |
|---|---|---|---|
| OHFY-Data-Model | 20 | 481 | 0 |
| OHFY-OMS | 4 | 805 | 3 |
| OHFY-eCommerce | 14 | 1,478 | 3 (deps: Data-Model, OMS) |
| OHFY-eCommerce-UI | 38 | 6,547 | 4 (deps: all above) |
| shared (docs/orgScripts/org-metadata/.claude) | ~31 | 2,303 | — (catch-all) |

Derived wave plan (from `sfdx-project.json`, no hardcoded names): **W1** Data-Model + shared → **W2** OMS → **W3** eCommerce → **W4** eCommerce-UI.

---

## Method (kept as fair as possible)

- **Old / "before":** 3 global finder agents (correctness, cross-file+contracts, cleanup+altitude), each reading the **whole** 14k-line diff, capped ~15 findings after dedup. All parallel (one wave). Sonnet-pinned.
- **New / "after":** 5 chunk agents (one per package + catch-all), each running the full angle set + verify on **only its chunk**, executed in the 4 dependency waves above, with each downstream wave receiving its touched ancestors' **contract-change digest**. Sonnet-pinned. Consolidated in the main loop.
- Both reviewed the same commit range (base `2954f6af6` → PR head `792b6d664`).

---

## Cost & coverage

| | Old (single-pass) | New (chunked waves) |
|---|---|---|
| Agents | 3 (all parallel) | 5 (across 4 sequential waves) |
| Tokens | ~418k | ~480k |
| Wall-clock | ~1 wave | ~4 waves (sequencing tax) |
| Coverage (self-reported) | every finder skimmed the non-Apex ~40% (metadata, docs, Playwright) | full pass per package **except** the 6,547-line eCommerce-UI chunk, which still had to skim |

---

## Findings

### Both runs caught the two highest-severity issues (the key result)
- **PDP live-reprice vs. tier-meter price disagreement** — `ecomProductPage.js` reprices with only the current item's quantity while the meter pools cart-wide in-scope quantity → shopper sees an "unlocked" price the resolver won't charge. Both flagged **BLOCKER**.
- **Doubled pricing waterfall** — `DraftInvoiceController` runs the full `S_PriceResolver` resolve twice per confirm. Old rated **BLOCKER**, new rated **WARNING** (it's a perf issue, not a correctness bug — legitimate disagreement).

### Only the NEW run found (breadth / cross-tier)
- **Cross-tier tax shift** — `Tax_Authority__c` external sharing Private→Read (Data-Model) carried via digest into the OMS chunk, which flagged that guest checkout tax totals change on merge with no test coverage. Old run never connected the metadata change to the tax code. **This is the digest mechanism's clearest win.**
- **3 shared/deploy findings** — guest sharing-rule name mismatch (`E_Commerce` vs `E_Commerce1`) that would silently break banners for logged-out users; stale `LEARNINGS.md` claim; fragile `unpackaged/unpackaged` retrieve path in `setup-site.sh`. Found because the catch-all got a dedicated agent instead of being skimmed last.
- **SYSTEM_MODE rule-6 misuse** in `StorefrontBannerController` — old run confirmed citations *existed*; new run (focused on ~1,500 lines) caught that one was *misapplied*.

### Only the OLD run found (the real weakness of chunking)
- **Cross-package duplication.** Old run's whole-tree pass caught **three** copy-paste instances across packages (`scopeMatches`, the banner-group query, the fieldset-resolution logic). New run's per-chunk agents each saw only their own files, so they caught the one duplication visible inside a single chunk and **missed the cross-package ones**. This is the "chunking loses cross-chunk findings" caveat, observed live.

---

## Verdict — iterate, do not rebuild

The foundation is sound. On the headline high-severity bugs the two runs **tied**; the new run's edge is **breadth for a first sweep** (dedicated coverage of low-glamour areas + the cross-tier tax signal), at the cost of **more tokens and much more wall-clock**, with **one genuine regression vs. old: cross-package duplication detection**.

Two concrete, small extensions (not a teardown) — mapped to the [[lesson-2-scaling-large-prs]] knobs:
1. **Size cap → sub-chunk oversized packages.** The 6,547-line eCommerce-UI chunk reproduced the original context-saturation problem in miniature. Package chunking bounds *count*, not *size*. (Chunk-boundary knob.)
2. **Add a cheap whole-tree duplication pass** in consolidation (even mechanical/grep-based), since chunking is structurally blind to cross-package copy-paste. (Consolidation step.)

One thing to **watch, not fix yet:** the wave/digest machinery is the most complex and most expensive part and produced ~one clear unique win here (the tax finding). If further runs show the digest rarely catches something cheaper wouldn't, collapse waves → **flat parallel chunks + a shared mechanical contract index** (every changed public signature/field extracted up front, handed to all chunks): same cross-tier awareness, no sequencing tax. Keep waves for now; re-evaluate after a few more real PRs.

---

## Caveats on this record
- One PR, one run each — not a statistical comparison. Severity calls and even finding sets would vary run to run.
- The "old" run was given a fair shot (3 focused finders, allowed to self-parallelize), so it is not a strawman — which is *why* the results are close.
- No findings were verified against ground-truth (post-merge fixes/reverts). A stronger future measurement: pick a merged PR whose real bugs are known in hindsight and score catch-rate.
