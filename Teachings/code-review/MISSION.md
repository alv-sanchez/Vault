# Mission: How `/code-review` Works

## Why
You run `/code-review` (and do manual PR reviews) regularly on OHFY-Split as part of shipping and reviewing engineering work — you were doing exactly this on PR #503 just before this session started. You want to understand *what problem it actually solves*, *why that matters in the SDLC*, and *how its output is designed to be absorbed quickly and trusted* — deeply enough that you can explain it to a teammate or answer a question about it on the spot, not just run it as a black box.

## Success looks like
- Can state in one sentence what `/code-review` solves that unstructured human review doesn't.
- Can explain why catching an issue at review time (vs. production) matters in cost-of-change terms.
- Can name the 4-phase pipeline (Gather → Find → Verify → Output) from memory, unprompted.
- Can explain *why* the output is split into severity-labeled, evidence-cited sections rather than a free-form comment — i.e. the psychological/cognitive-load reasoning behind the format.
- Has a mnemonic that lets them answer "what's in a `/code-review` output" and "how does it build trust" without looking anything up.

## Constraints
- Learner has limited session time between real engineering-manager work (PR triage, epic planning) — lessons must be short and immediately usable.
- Learner already has hands-on exposure: used `/code-review`-style review output today on PR #503 (BMS-3768) and posted review comments themselves. Ground lessons in that real example, not hypotheticals.

## Out of scope
- Deep internals of the multi-agent Workflow orchestration tool that could power a review (parallel agent fan-out mechanics) — useful context, not the goal.
- Apex/LWC-specific rule content (Repo-Specific Checks like SYSTEM_MODE citations, DTO pattern) — that's reference material for *doing* reviews in this repo, not part of understanding *why the review process itself is designed the way it is*.
