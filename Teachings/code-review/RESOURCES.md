# How `/code-review` Works — Resources

## Knowledge

- [OHFY-Split `CODE-REVIEW.md`](file:///Users/alvarosanchez_1/OHFY-Split/CODE-REVIEW.md)
  The authoritative spec for this repo's review: flow, severity rules, output format, repo-specific hard rules. Primary source for "what the skill is required to produce." Every claim in the lessons about section names, severity labels, or the Ask-Don't-Assume rule traces back to this file.

- [`.claude/commands/code-review.md`](file:///Users/alvarosanchez_1/OHFY-Split/.claude/commands/code-review.md)
  The actual orchestration script: effort scaling, the 4-phase pipeline (Gather → Find → Verify → Output), the independent finder "angles," and the adversarial verify step (CONFIRMED/PLAUSIBLE/REFUTED). Primary source for "how it mechanically works," including why multiple independent finders + an adversarial verifier exist (bias/miss reduction).

- [Google Engineering Practices — "How to Do a Code Review"](https://google.github.io/eng-practices/review/reviewer/)
  Industry-standard, widely-cited reference on the *human* side of code review: what to look for, how to phrase comments so they land without triggering defensiveness, and why speed of review matters. Use for: grounding the "why psychologically" half of the mission — Google's own guidance on courtesy and comment-phrasing is the direct ancestor of this repo's "Ask, Don't Assume" rule and the Kudos section.

- [Cohen et al., "Best Kept Secrets of Peer Code Review" (SmartBear/Cisco study)](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)
  The empirical study behind the most commonly cited code-review numbers: defect-detection rate drops sharply past ~200–400 LOC reviewed per hour, and review effectiveness plateaus after ~60 minutes of continuous review. Use for: grounding "why it matters in the SDLC" in data, not just intuition — this is *why* an automated finder pass (which doesn't fatigue) plus a severity ladder (which fights alert-fatigue) are structurally necessary, not stylistic choices.

## Wisdom (Communities)

- [r/ExperiencedDevs](https://reddit.com/r/ExperiencedDevs)
  Higher-signal than most programming subreddits for "how should code review actually work on a real team" discussions — useful if you want to pressure-test the repo's review philosophy against how other orgs do it.
- Internal: the OHFY-Split engineering team itself is the tightest-fit community here — the repo's `CODE-REVIEW.md` is a living document; disagreements about a rule (e.g. is a check too strict/lenient) are best tested by raising them with the team, not a public forum.

## Gaps
- No resource yet specifically on *adversarial self-verification* in LLM-based review pipelines (the CONFIRMED/PLAUSIBLE/REFUTED step) — this is a newer pattern; the closest grounding is the general "independent verification reduces correlated error" principle from forecasting/ensemble literature, not a single canonical article. Flag for future search if this needs deeper grounding.
