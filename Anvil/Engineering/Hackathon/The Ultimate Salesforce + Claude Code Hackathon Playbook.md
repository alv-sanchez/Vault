---
title: The Ultimate Salesforce + Claude Code Hackathon Playbook
created: 2026-04-22
updated: 2026-04-22
team_size: 3
tags: [hackathon, salesforce, claude-code, playbook, ai]
---

# The Ultimate Salesforce + Claude Code Hackathon Playbook

> Built for a 3-person team. Optimized for Salesforce + Claude Code + AI-native workflows. Every section is written to survive contact with a 48–72h time-box.

---

## 0. TL;DR — Read this first

A hackathon is **not** a coding contest. It is a **storytelling contest wrapped in a deadline**. Judges remember the demo, the story, and the feel. They forget the code in 30 minutes.

Three rules that win more than anything else:

1. **Vertical slice before polish.** An ugly end-to-end flow that works beats three beautiful screens that don't connect. Finish the thin end-to-end path in the first 40% of the clock.
2. **Kill scope at the 50% mark, ruthlessly.** Whatever isn't working by hour 24 of a 48h hack gets cut, not fixed. A cut feature hurts once. A half-working feature during the demo kills you.
3. **Rehearse the demo three times before submission.** Every team that wins has rehearsed. Every team that loses says "we didn't have time to rehearse." It is the single highest-leverage hour you will spend.

**Team split (3 people):**
- **Scout / Integrator** — researches APIs, wires up external services, owns Named Credentials, webhooks, AI callouts, MCPs.
- **Builder / Backend** — owns Apex, data model, triggers, Agentforce actions, batch/queueable, scratch org.
- **Presenter / Frontend** — owns LWC, Experience Cloud, SLDS, the demo script, the pitch, the recording.

**Tool stack, one sentence:** sf CLI + Claude Code with a carefully-tuned MCP set + Agentforce (if AI is in scope) + Playwright for demo verification + a cheap Vercel/Supabase/Cloudflare side service for anything Salesforce can't do in 48 hours.

---

## 1. Team Composition — The 3-Role Split

Hackathon teams fail most often because everyone tries to do everything. Lock roles in the first 30 minutes. **Cross-train but don't cross-own.**

### Role 1 — Scout / Integrator ("the unblocker")

Owns the **outside world**. This is the person who stops the team from being stuck on "how do we call X API?"

Responsibilities:
- Named Credentials, External Credentials, Auth Providers
- HTTP callouts (Apex `Http`, `Continuation` if needed)
- Webhooks inbound (Experience Site → Apex REST, or Cloudflare Worker as a buffer)
- MCP server setup on everyone's machine
- All non-Salesforce accounts (Claude API key, Twilio, Stripe, etc.)
- Third-party service accounts created T-7 days (don't wait — verification can take 48h on Twilio, Stripe, etc.)
- Secrets management (Named Credentials over ad-hoc storage; never commit a key)

Tool loadout: Claude Code, Postman or Hoppscotch, ngrok, Cloudflare Workers CLI, `sf` CLI.

### Role 2 — Builder / Backend ("the engine")

Owns the **data model, business logic, and Salesforce org itself**. Everyone else is downstream of this person's work for 6–12 hours, so **their throughput is the team's bottleneck** early on.

Responsibilities:
- Scratch org creation (one per developer, plus a "demo" scratch org at T-4 hours)
- Custom objects, fields, picklists, validation rules
- Apex classes: services, controllers, triggers (if any)
- Agentforce Topics, Actions, Prompts (if AI-in-SF)
- Seed data (write a reusable Apex script — `seedData.apex`)
- Permission sets and profile assignments
- Anonymous Apex scripts for demo data reset

Tool loadout: `sf` CLI, Claude Code, VS Code with Salesforce Extensions, Agentforce Builder, Flow Builder (only for glue that would be faster than Apex).

### Role 3 — Presenter / Frontend ("the closer")

Owns **what the judges see**. From the moment they sit down until the last slide. **The most undervalued role.**

Responsibilities:
- LWC components (Lightning Web Components)
- Experience Cloud site (if customer-facing)
- SLDS styling, responsive layouts, accessibility basics
- Demo script — literally a written script with timings
- Screen recording + backup video (critical — see §17)
- The pitch deck (if required by the event)
- Rehearsals with the other two (the team rehearses, not just the presenter)

Tool loadout: Claude Code, VS Code, Chrome DevTools MCP, Playwright MCP (for scripted demo flows), OBS or Screen Studio, Figma (sketching UI for Builder to scope), Loom (fallback recording).

### Role overlap map

| Task | Primary | Backup |
|---|---|---|
| Named Credentials | Scout | Builder |
| Data model | Builder | Scout |
| LWC | Presenter | Builder |
| Apex | Builder | Scout |
| Agentforce | Builder | Scout |
| Demo script | Presenter | Scout |
| Pitch deck | Presenter | Scout |
| Rehearsal coordination | Presenter | everyone |
| Recording / backup video | Presenter | Scout |
| Git / merge hygiene | Builder | everyone |

**Pair programming rule:** the critical path gets two people on it for the last 6 hours. Everything else goes async.

---

## 2. The 72-Hour Timeline

### T−7 days — Pre-event

- [ ] Team agrees on **problem domain** (not a solution — a domain). Example: "on-premise beverage ordering" not "build X app".
- [ ] Each developer creates a scratch org and deploys a `hello-world` LWC. If `sf org create scratch` fails on someone's laptop at the event, you lose 2 hours.
- [ ] Create third-party accounts: Anthropic Console (API key), Twilio (SMS verification takes 24–48h), Stripe (if payments), SendGrid/Resend (if email), Vercel/Cloudflare (hosting backup service).
- [ ] Install & test MCPs (see §8). `claude mcp list` should show all greens.
- [ ] Pre-author 3–5 Claude Code custom skills (see §10). A skill that writes 40 lines of boilerplate in 2 seconds is worth 45 minutes during the hack.
- [ ] Pre-author 1 custom agent (see §9).
- [ ] Create a "Hackathon Scratch Org Definition File" (see §13) with features you know you'll need: `ExperienceBundleMetadataAPI`, `MarketingUser`, `Sites`, `Communities`.
- [ ] Watch/rewatch 2–3 demo videos of past winners in your target hackathon. Note the **pattern** of their storytelling (problem → pain → solution → live demo → ask).

### T−1 day — Final prep

- [ ] All three laptops: update Xcode CLI tools, Node (via `nvm use --lts`), `sf` CLI (`sf update`), Claude Code (`npm i -g @anthropic-ai/claude-code`).
- [ ] Spin up one fresh scratch org per person and verify deploys work.
- [ ] Test Claude Code with your MCPs on a real query. If Atlassian MCP auth breaks, you learn now, not at hour 3.
- [ ] Pack: two laptops chargers, USB-C hub, HDMI adapter, backup hotspot, headphones. **The venue's WiFi will suck.**
- [ ] Sleep. An extra 2 hours of sleep pre-event gives back 6 hours of productivity on day 1.

### T = 0 — Kickoff (first 2 hours)

This is the **highest-leverage window of the whole event.** Rushing into code here is the #1 mistake.

| Minute | Activity |
|---|---|
| 0–15 | Re-read the rules, judging criteria, submission requirements, prize tiers |
| 15–45 | Brainstorm **problems**, not solutions. 30 problems → narrow to 3 → pick 1 |
| 45–60 | Run the Idea Filter (see §5) against the top 3, pick the winner |
| 60–75 | Draft the **demo narrative** in 5 bullet points *before* writing any code |
| 75–90 | Sketch the data model on paper. 1 diagram. 5–8 objects max for an MVP |
| 90–105 | Assign the three lanes. Each person writes their 3 top deliverables on a shared doc |
| 105–120 | Scout: accounts & credentials. Builder: scratch org + objects. Presenter: Figma sketch |

**Do not start coding before hour 2.** Repeat. Do not start coding before hour 2. This is the single most-violated rule.

### T + 2–16h — Vertical slice

- Goal: end-to-end thin flow, ugly but working. "Click button → call Apex → call external service → get result → show in UI."
- No styling yet. No edge cases. No error handling beyond try/catch with a toast.
- Builder finishes the data model + 1 Apex service by hour 6.
- Scout wires a real external call by hour 8.
- Presenter has a barebones LWC talking to Apex by hour 10.
- End-to-end demo path working by hour 16. If not, you cut scope **now**, not later.

### T + 16–32h — Depth pass

- Add the **one** feature that makes the demo feel real (not the three features you wanted).
- Start the pitch deck.
- First rehearsal at hour 28 (yes, with half the app broken — you're rehearsing the *story*, not the product).

### T + 32–44h — Polish

- Stop building new features at hour 36. **Freeze scope.**
- Polish SLDS, spacing, empty states, loading spinners.
- Write the 3-minute demo script.
- Second rehearsal at hour 40.

### T + 44–48h — Demo prep + recording

- Record a 3-minute **backup video** even if you're demoing live. Live demos fail. Always.
- Third rehearsal at hour 46.
- Submit 30 minutes before deadline. The submission portal always dies in the last 10 minutes.

---

## 3. Pre-Hackathon Checklist (Printable)

### Accounts (do this T-7)

- [ ] Anthropic Console API key — https://console.anthropic.com
- [ ] Salesforce Dev Hub (Trailhead Playground or existing sandbox with Dev Hub enabled)
- [ ] Second, fresh Salesforce Dev Edition for isolation — https://developer.salesforce.com/signup
- [ ] Twilio trial — https://twilio.com (SMS verification takes 24–48h)
- [ ] Resend.com or SendGrid — for transactional email
- [ ] Stripe test mode — only if payments are in scope
- [ ] Vercel free tier — for any side service that can't live on Salesforce
- [ ] Cloudflare Workers free tier — alternative to Vercel, better for webhooks
- [ ] GitHub org or shared repo access
- [ ] Figma free tier — for sketching
- [ ] Screen Studio (Mac) or OBS (cross-platform) — for the backup recording
- [ ] ngrok free — for tunneling local services (or Cloudflare Tunnel)

### Local tooling

- [ ] Node.js LTS via `nvm`
- [ ] `sf` CLI: `npm i -g @salesforce/cli`
- [ ] Claude Code: `npm i -g @anthropic-ai/claude-code`
- [ ] VS Code + Salesforce Extension Pack
- [ ] `gh` CLI (GitHub)
- [ ] `jq`, `yq`, `http` (httpie) — useful for API probing
- [ ] Playwright: `npm i -D @playwright/test && npx playwright install`
- [ ] Chrome DevTools MCP: `claude mcp add chrome-devtools ...` (see §8)

### Team scratch-org definition (commit this to the repo T-7)

```json
{
  "orgName": "Hackathon Scratch",
  "edition": "Developer",
  "features": [
    "Communities",
    "EnableSetPasswordInApi",
    "ExperienceBundleMetadataAPI",
    "LightningSchedulerPilot",
    "MarketingUser",
    "MultiCurrency",
    "SalesforceGenerativeAIAddOn"
  ],
  "settings": {
    "lightningExperienceSettings": { "enableS1DesktopEnabled": true },
    "mobileSettings": { "enableS1EncryptedStoragePref2": false },
    "chatterSettings": { "enableChatter": true },
    "communitiesSettings": { "enableNetworksEnabled": true },
    "experienceBundleSettings": { "enableExperienceBundleMetadata": true }
  }
}
```

Save as `config/project-scratch-def.json`. Verify once locally. If it provisions cleanly, everyone is unblocked.

---

## 4. Day-of Kickoff Script (First 2 Hours)

Read this script out loud at kickoff. Yes, out loud. Accountability is everything.

### 00:00 — Rules review (15 min)

Assign each person a section:
- **Scout:** judging criteria, prize tiers, submission format (video? live? code repo?)
- **Builder:** tech constraints (SF-only? allowed external services? open-source required?)
- **Presenter:** demo format, time limit, slide requirements, audience (customers? engineers? AEs?)

Each reads their section, then 3 minutes to report back. The group cross-questions until everyone understands every rule.

### 00:15 — Problem brainstorm (30 min)

Two rules:
1. Write **problems**, not solutions. "Warehouse managers can't tell which pallets are ready to ship" is a problem. "Build a pallet dashboard" is not.
2. Write quietly for 10 minutes, then read out. No discussion while writing.

Target: 30 problem statements on a shared doc. Narrow to 3 by vote (3 dots each, no talking).

### 00:45 — Idea filter (15 min)

Run each of the 3 through §5's filter. Pick the one with the highest score. If there's a tie, the Presenter breaks it — because **they have to sell it**.

### 01:00 — Demo narrative draft (15 min)

Write 5 bullets. Each bullet is one sentence. No tech terms.

> Example:
> 1. Maria is a Gulf Distributors customer service agent. She answers 200 calls a day.
> 2. Half her calls are retailers asking "where's my order?" — information that's already in Salesforce.
> 3. We built an AI agent that retailers talk to directly via SMS. It answers instantly with delivery ETA, invoice status, and reorder suggestions.
> 4. Live demo: text "7-Eleven Panama City" → "Your order arrives tomorrow 9–11 AM. Want to reorder your Bud Light case?"
> 5. Maria is now handling escalations, not status calls. Gulf's CSAT went up 20%.

This narrative stays on the wall for 48 hours. Every feature decision gets measured against it.

### 01:15 — Data model sketch (15 min)

Paper and pen. One diagram, 5–8 objects. **No custom objects without a demo bullet attached to them.** If it's not in the narrative, it's not built.

### 01:30 — Lane assignment (15 min)

Each person writes their top 3 deliverables for the next 16 hours on the shared doc. Others review and call out risks.

### 01:45 — Start your engines (15 min)

- Scout: open Anthropic Console, create a new API key named `hackathon-prod`. Set up Named Credential in sandbox. Test one callout to Claude from Apex Developer Console (code snippet in §22).
- Builder: `sf org create scratch -f config/project-scratch-def.json -a hack-demo -y 30`. Deploy base. Create first custom object.
- Presenter: sketch in Figma — 3 screens, no more. Export as images. These are the **contract** with the Builder.

---

## 5. The Idea Filter — How to Pick a Winner

Score each candidate idea on 5 axes, 1–5 each. 25 max. Anything under 17 is a loser.

| Axis | Question | 1 | 5 |
|---|---|---|---|
| **Story clarity** | Can you explain the user and their pain in one sentence? | "It's about AI stuff" | "Warehouse managers spend 2h/day on X; we cut it to 5 min" |
| **Demo-ability** | Is the climax visible on a screen in under 90 seconds? | Backend-heavy, hard to show | "Click button → visible magic" |
| **Salesforce fit** | Does it feel native to Salesforce, or bolted on? | Could run anywhere | Uses AF / Flow / LWC meaningfully |
| **Scope realism** | Can 3 people ship the vertical slice in 16h? | Requires custom ML training | CRUD + 1 API + 1 LWC |
| **Wow factor** | Will judges say "that's the one" afterward? | Yet another dashboard | Agentic, voice, AR, real-time |

### Idea archetypes that reliably score well

1. **"Agentforce action that does the boring thing"** — e.g., AI reads emails and drafts quotes in Salesforce automatically.
2. **"SMS/WhatsApp agent for field ops"** — retailers, drivers, reps get conversational access to CRM data.
3. **"The 0-click workflow"** — something that used to take 10 clicks happens automatically via a trigger + prompt.
4. **"Voice-to-record"** — sales rep dictates notes, AI creates opportunity with fields filled.
5. **"The compliance saver"** — AI watches for risky quotes / promises / discounts and flags them.
6. **"The onboarding collapser"** — customer onboarding from email → account + contact + opportunity in 30 seconds.
7. **"The what-if simulator"** — "If we raise prices 5%, which accounts churn?" answered in natural language over Data Cloud.

### Idea archetypes that reliably fail

- "A better admin console" — nobody demos well with setup menus.
- "A dashboard" — nobody has cared about a dashboard at a hackathon since 2015.
- "Migrate X to Y" — migrations aren't demos.
- "An integration to [unknown SaaS]" — judges don't know the SaaS.
- "A mobile app" — unless it's the core, native-first mobile adds 20 hours.

---

## 6. Stack Recommendations

### Core Salesforce stack

| Layer | Choice | Why |
|---|---|---|
| Org | Scratch org (Developer Edition) | Disposable, reproducible, fast |
| Source format | SFDX source (`force-app/main/default`) | Only sane option |
| Data | Custom objects + `__mdt` for config | Avoid hard-coding |
| Triggers | One-liner → handler class | Standard pattern |
| UI | LWC only | Aura is legacy; Visualforce is dead |
| Styling | SLDS utility classes + design tokens | Don't hand-write CSS |
| Composite UI | Lightning Base Components | `<lightning-card>`, `<lightning-datatable>`, `<lightning-button>` |
| Site | Experience Cloud "Build Your Own (LWR)" | Fast, modern, LWC-native |
| Routing | `@salesforce/client/formFactor`, built-in nav | No react-router needed |

### AI layer

| Need | Choice | Notes |
|---|---|---|
| LLM for in-Salesforce use | Agentforce (native) | Use when judges are SF-biased |
| LLM for external service | Anthropic Claude API (Sonnet 4.6 or Haiku 4.5) | Cheap, fast, 1M-context available |
| Fast/cheap model | Claude Haiku 4.5 | Use for classification, routing, triage |
| Deep/thoughtful model | Claude Opus 4.7 | Use for hero features: planning, multi-step reasoning |
| Voice in | Deepgram or Whisper | Deepgram is faster, Whisper has a free open-source option |
| Voice out | ElevenLabs | Highest voice quality, generous free tier |
| Embeddings | Voyage AI or OpenAI `text-embedding-3-small` | Only if RAG is in scope |
| Vector DB | Salesforce Data Cloud with vectors, OR Supabase pgvector | SF-native if you have Data Cloud, otherwise Supabase is instant |
| Prompt management | `Prompt_Template__mdt` custom MDT you create | Avoid hardcoding prompts in Apex |
| Prompt caching | Anthropic prompt caching | Free perf win — see §16 |

### Frontend / UX

| Need | Choice |
|---|---|
| LWC dev | VS Code + SFDX + Salesforce LWC extension |
| Design system | SLDS + SLDS Icons |
| Quick diagrams | Figma or Excalidraw |
| Prototyping | v0.dev (Vercel) for non-SF UI bits |
| Mockups for pitch | Figma or Penpot |
| Demo video | Screen Studio (Mac) or OBS |

### Backend / integration (outside Salesforce)

| Need | Choice | Notes |
|---|---|---|
| Webhook buffer | Cloudflare Workers | 0-ms cold start, free tier generous |
| Fast serverless | Vercel Functions | If team is already JS/TS |
| Database (outside SF) | Supabase Postgres | 5-min setup, includes auth, storage, pgvector |
| Auth bridge | Clerk or Supabase Auth | If external users need to hit SF data |
| File storage | Supabase Storage or R2 | For images/video in demos |
| Messaging | Twilio (SMS/WhatsApp), Resend (email) | |
| Real-time | Supabase Realtime or Pusher | For live collab demos |
| Queue | Upstash Redis or Cloudflare Queues | |
| Feature flags | GrowthBook or a `Feature_Flag__mdt` MDT | |

### Demo & polish

| Need | Choice |
|---|---|
| Screen recording | Screen Studio (Mac), Descript, OBS |
| Voiceover | ElevenLabs (clone your own voice), or live |
| Pitch deck | Pitch.com, Keynote, Gamma.app (AI-generated deck in minutes) |
| Captioning | Descript or Submagic |
| Teleprompter | TelepromptMe (browser), or a plain HTML page on a second monitor |

---

## 7. Claude Code — The Power Setup

This is the section that most differentiates a prepared team from an unprepared one.

### Install

```bash
npm i -g @anthropic-ai/claude-code
claude mcp list
claude --version
```

Set your preferred model once:

```bash
claude /model opus-4.7          # deep reasoning
claude /model sonnet-4.6        # daily driver
claude /model haiku-4.5         # fast, cheap, used for hooks and triage
```

### Project settings file

Create `.claude/settings.json` in the hackathon repo. Check it in. Ensures everyone has the same rails.

```json
{
  "permissions": {
    "allow": [
      "Bash(sf *)",
      "Bash(npm run *)",
      "Bash(npx playwright *)",
      "Bash(gh *)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(jq *)"
    ],
    "deny": [
      "Bash(git push --force*)",
      "Bash(rm -rf *)"
    ]
  },
  "hooks": {
    "SessionStart": [
      { "command": "bash .claude/hooks/load-context.sh" }
    ],
    "PostToolUse": [
      { "matcher": "Bash", "command": "bash .claude/hooks/post-deploy-check.sh" }
    ]
  }
}
```

### What Claude Code replaces

| Old workflow | New workflow |
|---|---|
| Manual scaffolding of LWC + `.js-meta.xml` | `/scaffold-lwc accountCard` |
| Writing test stubs | Claude generates Jest + Apex test boilerplate |
| Deploying to scratch org | `/ship` — format, test, deploy, seed |
| Searching Slack for "how did we do X last time" | Auto memory recalls it |
| Reading docs | WebFetch + Claude summarizes |
| Writing demo narration | `/pitch` generates a draft |
| Rehearsing demo | `/rehearsal` runs through script |

### Plan Mode vs Default Mode

**Use Plan Mode (`/plan` or pass `--plan`)** for anything with more than 3 files changing. Claude thinks step-by-step, shows the plan, waits for approval before editing. Saves you from 200-line mistakes.

**Use Default Mode** for known, small edits.

**Use "Auto" / YOLO mode** only when: (1) it's reversible, (2) you've committed recent work, (3) you're OK with 1-in-20 weird outputs.

### Subagents — your 4th, 5th, 6th teammates

Subagents are Claude instances that run in parallel with isolated context. Use them for:

- **Parallel research** — "go read this repo, go read this repo, report back"
- **Isolated codebase audits** — don't burn your main context on a 3000-line audit
- **Long-running deploys + watches** — background agent watching logs while you build

Key subagents to pre-create:

1. **`explore`** — fast file-finder + reader (built-in)
2. **`sf-expert`** — Salesforce docs specialist (custom, see §9)
3. **`demo-dresser`** — loads seed data, resets state (custom)
4. **`rehearsal-coach`** — drives through a demo script (custom)
5. **`judge-simulator`** — grades a pitch draft against criteria (custom)

---

## 8. MCP Servers to Install (Ranked by Value)

MCP = Model Context Protocol. Lets Claude talk to external systems. The right MCPs multiply your speed 3–5x.

### Tier 1 — Install these first

| MCP | What it does | Install |
|---|---|---|
| **GitHub** | Read/write issues, PRs, code search | `claude mcp add github -- npx -y @modelcontextprotocol/server-github` |
| **Filesystem** | Scoped file access outside cwd | Built in; configure paths |
| **Atlassian (Jira/Confluence)** | Pull requirements, log tickets | Official `mcp-atlassian` |
| **Chrome DevTools** | Drive Chrome from Claude, inspect DOM | `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp` |
| **Playwright** | Scripted browser automation | `claude mcp add playwright -- npx -y @microsoft/mcp-server-playwright` |

### Tier 2 — Install if relevant

| MCP | What it does | When to use |
|---|---|---|
| **Notion** | Pull/push docs, meeting notes | If team uses Notion |
| **Supabase** | Query DB, manage auth, storage | If you need a non-SF database |
| **Slack** | Post updates, pull messages | Team comms + alerts |
| **Sequential Thinking** (Anthropic) | Structured multi-step reasoning | Complex algorithms, planning |
| **Memory / Knowledge Graph** | Long-term project memory | Cross-session context |
| **Fetch / WebFetch** | Read URLs, summarize | Built-in, use freely |

### Tier 3 — Specialist

| MCP | What it does |
|---|---|
| **Salesforce CLI MCP** (community) | Wraps `sf` commands with typed args |
| **Twilio MCP** (community) | Send SMS from Claude |
| **Postgres MCP** | Direct SQL with schema awareness |
| **Stripe MCP** | Test mode API driven from Claude |
| **Linear MCP** | Same shape as Jira MCP |
| **Figma MCP** | Pull frames, export specs to LWC |

### Verification after install

```bash
claude mcp list
claude mcp test github    # quick smoke test
```

If any MCP is red, fix or remove before the event. A flaky MCP eats 10 minutes every time it fails silently.

### Registry & discovery

- Official catalog: https://modelcontextprotocol.io
- Server list: https://github.com/modelcontextprotocol/servers
- Community: https://mcp.so (search + reviews)
- Smithery (registry): https://smithery.ai

---

## 9. Custom Claude Code Agents — Build These Pre-Event

Agents are specialized Claude personalities. Store them in `.claude/agents/<name>.md`. Each has frontmatter declaring tools + model.

### Agent 1 — `sf-expert`

**File:** `.claude/agents/sf-expert.md`

```markdown
---
name: sf-expert
description: Salesforce platform specialist. Use for Apex, LWC, SLDS, Agentforce, Flow, Experience Cloud, governor limits, security review, metadata APIs. Prefers official Salesforce docs.
model: opus
tools: [Read, Bash, WebFetch, WebSearch, Grep, Glob]
---

You are a Salesforce platform specialist. You write Apex that passes security review. You
write LWC that uses Lightning Base Components by default. You know every governor limit
by heart. When asked about anything Salesforce, consult developer.salesforce.com first.

Rules:
- Always `@AuraEnabled(cacheable=true)` for read-only LWC methods.
- Never query inside a loop. SOQL-for-loops are fine; naked SOQL in a loop fails review.
- Bulkify everything — trigger handlers, service methods, batch classes.
- Prefer `Database.query(String, List<Object>, AccessLevel.USER_MODE)` for user-mode enforcement.
- For Experience Cloud, prefer LWR over Aura sites.
- LWC styling: SLDS utility classes. Only fall back to scoped CSS when SLDS can't express it.
- Agentforce Actions: `@InvocableMethod` with `label`, `description`, and strongly-typed
  input/output classes. Descriptions matter — the LLM reads them.
```

### Agent 2 — `demo-dresser`

```markdown
---
name: demo-dresser
description: Prepares the scratch org for a demo. Loads seed data, resets state, deploys the latest code, logs in as the demo user, opens the Experience site in a browser. Use before every rehearsal.
model: sonnet
tools: [Bash, Read, Write, Edit]
---

You reset the demo environment to a clean, presentable state. You run in this order:
1. `sf project deploy start -d force-app --target-org demo`
2. Run `scripts/reset-demo.apex` via `sf apex run --target-org demo -f scripts/reset-demo.apex`
3. Run `scripts/seed-demo.apex`
4. Verify key records exist (Accounts, Contacts, Orders) — use `sf data query`
5. Open the demo URL in the browser via `sf org open --target-org demo --path /s/`
6. Report readiness with a checklist.

If any step fails, stop and report the exact error. Do not attempt to fix without approval.
```

### Agent 3 — `rehearsal-coach`

```markdown
---
name: rehearsal-coach
description: Drives the team through a demo script. Reads each bullet, times each section, flags parts that ran long, produces a post-rehearsal punch list.
model: sonnet
tools: [Read, Write, Bash]
---

You run a demo rehearsal. You have the script in docs/demo-script.md.

Process:
1. Print the opening hook. Pause for the presenter to say "go".
2. For each scene: print the action, the expected visible outcome, and the target duration.
3. After the rehearsal, ask the presenter: "Which scene felt clunky? Which visual did not land?"
4. Write a punch list to docs/rehearsal-notes-<timestamp>.md with: section name, issue, fix, owner, ETA.
5. Do not coach technique. You time and log. The humans coach each other.
```

### Agent 4 — `judge-simulator`

```markdown
---
name: judge-simulator
description: Reads a pitch draft and scores it as a hackathon judge would. Returns scores on story clarity, demoability, wow factor, technical depth, business realism, plus the top 3 weaknesses a judge would call out.
model: opus
tools: [Read, WebFetch]
---

You play three judge personas in sequence:
1. **The AE** — cares about customer impact, revenue story, deal size
2. **The CTO** — cares about architecture, scalability, security
3. **The CEO** — cares about the story, the differentiation, the "so what"

For a given pitch (path provided), output:
- 3 scores per persona on 1–10 (story, demo, tech, wow, fit) — 15 scores total
- Top 3 weaknesses each persona would flag
- 3 specific sentences the presenter should add, delete, or rewrite
- Whether you'd advance it to the finals round (yes/no/maybe + reason)

Be harsh. A friendly review helps nobody.
```

### Agent 5 — `hackathon-idea-filter`

```markdown
---
name: hackathon-idea-filter
description: Scores a hackathon idea against the 5-axis filter (story, demo, SF fit, scope, wow). Returns a score + refinements.
model: sonnet
tools: [WebSearch, WebFetch]
---

For each idea provided, score 1-5 on:
- Story clarity (can you explain the user's pain in one sentence?)
- Demo-ability (is the climax visible on screen under 90s?)
- Salesforce fit (does it feel SF-native?)
- Scope realism (3 people, 16 hours to vertical slice)
- Wow factor (will judges remember it?)

Return:
1. Total score /25
2. Per-axis score + one sentence each
3. Top 3 risks
4. 2 variations that would score higher
```

---

## 10. Custom Slash Commands (Skills) — Build These Pre-Event

Skills live in `.claude/skills/<name>.md`. They are repeatable recipes Claude can invoke. Here are the highest-leverage ones for a hackathon.

### `/scaffold-lwc <name>`

Generates `force-app/main/default/lwc/<name>/`:
- `<name>.html` with an `<lightning-card>` shell
- `<name>.js` with a wired property and a handler
- `<name>.js-meta.xml` with `isExposed=true`, common targets, API v62+
- `<name>.css` (scoped)
- `__tests__/<name>.test.js` stub

### `/scaffold-apex <name>`

Generates:
- `classes/<name>.cls` with `@AuraEnabled` stub
- `classes/<name>.cls-meta.xml`
- `classes/<name>_T.cls` with a passing test stub (so coverage isn't 0%)

### `/scaffold-trigger <Object> <Context>`

Generates:
- `triggers/<Object>Trigger.trigger` with `new <Object>TriggerHandler().run();`
- `classes/<Object>TriggerHandler.cls`

### `/ship`

Pre-flight before pushing:
1. `npm run prettier:verify` — fail-loud if formatting is off
2. `npm run lint` — LWC lint
3. `npm test -- --findRelatedTests <staged files>`
4. `sf project deploy start -d force-app -o <alias>`
5. Run related Apex tests with `sf apex run test -r human -w 10`
6. Print a one-line summary: "Shipped N files, P passing tests, Q deployed components."

### `/seed`

Runs the anonymous Apex seed script in the current org. Prints a summary of what got created.

### `/reset-demo`

1. `sf apex run -f scripts/reset-demo.apex`
2. `/seed`
3. `sf org open --path /s/` (Experience site root)

### `/pitch`

Generates a 3-minute pitch from:
- `docs/demo-script.md` (scene list)
- `README.md` (problem + solution)
- Team-supplied one-liner ("who's it for?")

Output: Markdown with Act 1 (hook), Act 2 (demo cues), Act 3 (ask).

### `/idea-filter <idea>`

Invokes the `hackathon-idea-filter` agent. Returns a score and refinement suggestions.

### `/daily-standup`

Reads yesterday's Git log across all team branches, summarizes by person, lists blockers. Posts to Slack via Slack MCP if configured.

### `/lookup-gov-limit <topic>`

WebFetches current governor limit docs, extracts the relevant number, tells you if you're within budget.

### `/agent-action <name> <description>`

Generates an Agentforce `@InvocableMethod` Apex class with strongly-typed input/output and a well-described prompt-facing signature.

### Skill file format

```markdown
---
name: scaffold-lwc
description: Generate a new Lightning Web Component with boilerplate + test stub
---

Generate a new LWC at force-app/main/default/lwc/$1/

Files to create:
1. $1.html — starts with <template><lightning-card title="$1">...</lightning-card></template>
2. $1.js — imports LightningElement, exports default class
3. $1.js-meta.xml — apiVersion 62.0, isExposed=true, targets [lightning__AppPage, lightning__RecordPage, lightning__HomePage, lightningCommunity__Page]
4. $1.css — empty scoped CSS
5. __tests__/$1.test.js — import + createElement + verify render test

Then open $1.js in the editor.
```

---

## 11. Hooks — Automation That Runs on Every Event

Hooks are shell commands the Claude Code harness triggers on events. Configure in `.claude/settings.json`.

### Hook 1 — `SessionStart`: Load scratch org context

```bash
#!/usr/bin/env bash
# .claude/hooks/load-context.sh
echo "=== Hackathon Session Start ==="
echo "Default org: $(sf config get target-org --json | jq -r .result[0].value)"
echo "Branch: $(git branch --show-current)"
echo "Staged: $(git diff --cached --name-only | wc -l) files"
echo "Time to demo: $(date -j -f '%Y-%m-%dT%H:%M:%S' "$DEMO_DEADLINE" '+%s' 2>/dev/null | awk -v now="$(date +%s)" '{print int(($1-now)/3600)}')h"
```

### Hook 2 — `PostToolUse` on Bash: Catch deploy failures

```bash
#!/usr/bin/env bash
# .claude/hooks/post-deploy-check.sh
last_cmd="$CLAUDE_LAST_BASH_CMD"
exit_code="$CLAUDE_LAST_BASH_EXIT"
if [[ "$last_cmd" == *"sf project deploy"* && "$exit_code" != "0" ]]; then
  echo ">>> Deploy failed. Last 20 lines:"
  tail -20 "$CLAUDE_LAST_BASH_STDOUT"
fi
```

### Hook 3 — `UserPromptSubmit`: Inject hackathon constraints

```bash
#!/usr/bin/env bash
# .claude/hooks/remind-constraints.sh
cat <<EOF
<hackathon-constraints>
- You are in a 48h hackathon. Prefer the simplest thing that demos well.
- Cut scope before adding error handling for impossible cases.
- Do not refactor code that already works. Do not add tests that aren't demanded.
- Every feature must map to a bullet in docs/demo-script.md. If it doesn't, propose cutting it.
</hackathon-constraints>
EOF
```

### Hook 4 — `Stop`: Save a session digest

```bash
#!/usr/bin/env bash
# .claude/hooks/save-digest.sh
mkdir -p .claude/digests
digest=".claude/digests/$(date +%Y-%m-%dT%H-%M).md"
echo "# Session digest" > "$digest"
echo "Branch: $(git branch --show-current)" >> "$digest"
echo "Commits since digest: $(git log --since='1 hour ago' --oneline | wc -l)" >> "$digest"
git log --since='1 hour ago' --oneline >> "$digest"
```

---

## 12. Subagent Patterns for Parallel Work

With 3 humans and multiple Claude instances, treat subagents as scale.

### Pattern 1 — Explore while you build

While you're deep in code, spawn `Explore` subagents for research:

> "Go read how `EventBus.publish` works in Salesforce Apex and summarize in under 200 words. Find the governor limits. Cite the docs URL."

The subagent burns its own context, not yours.

### Pattern 2 — Parallel implementation

If you have two independent files to write, spawn two `general-purpose` agents in one message. They run concurrently. Review both diffs when they finish.

> "In parallel:
> - Agent A: implement `OrderLookupController.getOrder(accountId)` returning recent orders with items.
> - Agent B: implement LWC `orderLookup` that calls A, renders a datatable."

### Pattern 3 — Long-running background work

Use `run_in_background: true` on an agent for multi-minute work (big refactor, schema migration, test suite). Continue working in the foreground. You get a notification when it's done.

### Pattern 4 — The judge simulator

After writing the pitch, spawn `judge-simulator` in the background while you polish the UI. By the time you're done with UI, the judge feedback is waiting.

### Pattern 5 — Worktree isolation

Start a subagent with `isolation: "worktree"` for risky edits. It gets its own git worktree — your working directory stays clean. Review via `git diff` on the worktree branch.

---

## 13. Salesforce-Specific Accelerators

### `sf` CLI power moves

```bash
# Create scratch org in 2 min, push code, open
sf org create scratch -f config/project-scratch-def.json -a hack -d -y 30
sf project deploy start -d force-app
sf org open -a hack

# Query anything fast
sf data query -q "SELECT Id, Name FROM Account LIMIT 5" --target-org hack

# Anonymous Apex from a file (your seeding/reset scripts)
sf apex run -f scripts/seed-demo.apex -o hack

# Stream logs
sf apex tail log -o hack

# Run specific tests with coverage
sf apex run test -n "MyController_T" -r human -w 10 --code-coverage -o hack

# Export data for seed (one-time, then commit the JSON)
sf data export tree -q "SELECT Id, Name, Type FROM Account LIMIT 20" -d data/seed -p

# Import the committed tree
sf data import tree --plan data/seed/Account-plan.json -o hack

# Validate before deploy (no commit)
sf project deploy validate -d force-app -o hack
```

### Seed data — make it reusable

Pattern: write **idempotent** Apex in `scripts/seed-demo.apex` that deletes-then-inserts the demo records by External ID. Re-runnable, safe, no duplicates.

```apex
// scripts/seed-demo.apex
List<Account> existing = [SELECT Id FROM Account WHERE External_Id__c LIKE 'demo:%'];
delete existing;

List<Account> toInsert = new List<Account>{
  new Account(Name='7-Eleven Panama City', External_Id__c='demo:acct-711-pc'),
  new Account(Name='Gulf Gas + Go',        External_Id__c='demo:acct-gulf-gas'),
  new Account(Name='Dollar General #1284', External_Id__c='demo:acct-dg-1284')
};
insert toInsert;
System.debug('Seeded ' + toInsert.size() + ' accounts.');
```

### Experience Cloud — LWR in 30 minutes

1. Setup → Digital Experiences → All Sites → New.
2. Choose "Build Your Own (LWR)" template.
3. Name it `hack`.
4. Add an LWC to the homepage via the Builder.
5. Deploy: `sf project deploy start -d force-app/main/default/digitalExperiences`.
6. Publish via Builder ("Publish" button top-right).
7. Public URL is visible in site Settings.

To allow unauthenticated access (for a demo):
- Site → Administration → Members → Guest User Profile → edit permissions.
- Grant `Apex Class Access` for your controllers.
- Grant `Object Permissions` (Read is enough for most demos).

### Agentforce setup — the fast path

1. Setup → Agents → New Agent → Custom.
2. Define **Topics** (high-level categories: "Orders", "Account Management").
3. Each Topic gets **Actions** (things the agent can do). Action types:
   - **Apex** — your `@InvocableMethod` classes
   - **Flow** — great for "create X record" actions
   - **Prompt Template** — structured LLM prompts
4. Assign a **Data Library** (if you have Data Cloud with vectors) for RAG.
5. Test in the Agent Builder's chat pane.

**Tip:** Action *descriptions* are the most important field. The LLM reads them to decide when to call the action. Write them like API docs: "Use this action when the user asks about the status of an order. Input: order number. Output: delivery date, status, items."

### Named Credential for Anthropic API

```
Name: Anthropic_API
URL: https://api.anthropic.com
External Credential: Anthropic_Ext_Cred
  - Authentication Protocol: Custom
  - Principal: Named Principal
  - Custom Headers:
      x-api-key: <api key>
      anthropic-version: 2023-06-01
      content-type: application/json
```

### The one-class `ClaudeService` pattern

```apex
public with sharing class ClaudeService {
    public static String ask(String prompt) {
        return ask(prompt, 'claude-sonnet-4-6', 1024);
    }

    public static String ask(String prompt, String model, Integer maxTokens) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Anthropic_API/v1/messages');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(120000);

        Map<String, Object> body = new Map<String, Object>{
            'model' => model,
            'max_tokens' => maxTokens,
            'messages' => new List<Map<String, Object>>{
                new Map<String, Object>{ 'role' => 'user', 'content' => prompt }
            }
        };
        req.setBody(JSON.serialize(body));

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            throw new CalloutException(
              'Anthropic error ' + res.getStatusCode() + ': ' + res.getBody()
            );
        }
        Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> content = (List<Object>) parsed.get('content');
        Map<String, Object> first = (Map<String, Object>) content[0];
        return (String) first.get('text');
    }
}
```

That's 30 lines and gives the whole team AI power. Call it from a trigger, a Flow, an @InvocableMethod, whatever.

### Agentforce-compatible action wrapper

```apex
public with sharing class SummarizeAccount {
    public class Input {
        @InvocableVariable(label='Account Id' required=true)
        public Id accountId;
    }
    public class Output {
        @InvocableVariable(label='Summary')
        public String summary;
    }

    @InvocableMethod(
      label='Summarize Account'
      description='Returns a 3-sentence summary of the account: who they are, recent orders, and any risk signals. Use when the user asks "what should I know about [account]?"'
    )
    public static List<Output> run(List<Input> inputs) {
        List<Output> outputs = new List<Output>();
        for (Input i : inputs) {
            Account a = [
              SELECT Id, Name, Industry, AnnualRevenue,
                     (SELECT Id, Name, TotalAmount FROM Orders ORDER BY CreatedDate DESC LIMIT 3)
              FROM Account WHERE Id = :i.accountId
            ];
            String prompt = 'Summarize this account for a sales rep in 3 sentences:\n\n' + JSON.serialize(a);
            Output o = new Output();
            o.summary = ClaudeService.ask(prompt);
            outputs.add(o);
        }
        return outputs;
    }
}
```

Then register this class as an Action on your Agentforce Agent — done.

---

## 14. Agentforce Integration Patterns

Patterns that consistently impress SF-heavy judging panels.

### Pattern A — AI triage + auto-action

A case/email/form comes in. An Agent classifies it, enriches it, assigns it, sometimes closes it. Demo angle: "90% of Tier 1 cases resolved without a human."

### Pattern B — Conversational record creation

User types a paragraph ("new lead, Jane Doe, 555-1234, interested in Bud Light for her bar in Pensacola"). Agent creates Lead, populates fields, assigns territory. Demo angle: "5-second CRM entry."

### Pattern C — Proactive outbound

A trigger notices something (cart stalled, delivery delayed). Agent drafts a message, optionally sends via Twilio. Demo angle: "The CRM reaches out so you don't have to."

### Pattern D — Q&A over data

Retailer asks "when's my next delivery?" via SMS. Agentforce consults Order data, answers. Demo angle: "Your customers talk to your CRM directly."

### Pattern E — Synthesis for managers

"Show me at-risk accounts this week." Agent pulls data, summarizes, ranks, explains. Demo angle: "Weekly ops review, in one sentence, on demand."

### Pattern F — Agent-to-agent handoff

One agent handles a domain (orders), hands off to another (billing). Rare but memorable. Demo angle: "Specialized agents, routing like humans."

---

## 15. Prompt Engineering — Cheat Sheet

### The 5 moves that always help

1. **Specify the output format.** "Return exactly: `Status: X | ETA: Y | Risk: Z`"
2. **Give 1–3 examples.** Few-shot beats zero-shot almost always.
3. **Role + audience.** "You are a Salesforce sales rep speaking to a new customer."
4. **Constraints up top.** "Do not mention prices. Do not use marketing language."
5. **Ask for reasoning first, answer last.** Puts the model in "think then answer" mode.

### Prompt caching (Claude)

Mark the stable prefix (system prompt, tool definitions, long context) with `cache_control`. Subsequent calls with the same prefix are ~90% cheaper and 2–5x faster.

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": [
    {
      "type": "text",
      "text": "<long stable system prompt>",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": []
}
```

Hackathon sweet spot: cache your system prompt + schema definitions. Your demo will feel blazingly fast.

### Tool use / function calling

When the model needs to call your code, define tools with clear descriptions:

```json
{
  "tools": [
    {
      "name": "get_order_status",
      "description": "Look up the delivery status and ETA of a specific order by its ID.",
      "input_schema": {
        "type": "object",
        "properties": { "order_id": { "type": "string" } },
        "required": ["order_id"]
      }
    }
  ]
}
```

**Description quality > prompt tuning.** A well-described tool gets called at the right time. A poorly described tool gets ignored or hallucinated.

### Model picking

| Use case | Model |
|---|---|
| Production hero feature | `claude-opus-4-7` |
| Everyday summaries, classification, formatting | `claude-sonnet-4-6` |
| High-volume routing, moderation, simple extraction | `claude-haiku-4-5` |
| Tool-calling agent loops (many small hops) | `claude-haiku-4-5` or `claude-sonnet-4-6` |
| One-shot RAG synthesis over long context | `claude-opus-4-7` with 1M context |

### Prompt version control

Store prompts in a `Prompt_Template__mdt` custom metadata type. Swap them without redeploy. Build a `promptName → text` service. Lets you edit prompts live during the event.

---

## 16. Demo Engineering — Win the Room

### The 3-minute demo template

| Time | Section | What happens |
|---|---|---|
| 0:00–0:20 | **Hook** | Name the user + pain. One sentence. |
| 0:20–0:40 | **Stakes** | Why this is expensive/embarrassing today |
| 0:40–2:10 | **Live demo** | 90 seconds, rehearsed, fallback ready |
| 2:10–2:40 | **Tech reveal** | "Here's how — Agentforce + Claude + SF Data Cloud" |
| 2:40–3:00 | **Ask** | What you'd build next + how to reach you |

### Rehearsal rules

- Three rehearsals minimum. At hours 28, 40, 46 for a 48h hack.
- Rehearse with a timer. Cut anything that makes you go over by 15%.
- Rehearse with a stranger if possible — they'll catch jargon you've become blind to.
- Rehearse standing, not sitting. You'll probably stand at the event.

### The fallback video

**Record a backup video by hour 40.** Here's why:
- WiFi fails.
- Scratch orgs lock up.
- Agentforce latency spikes.
- You click the wrong button in front of 300 people.

If the live demo fails, play the video, **keep talking over it as if it's live**, finish strong. 90% of the audience will not know. Judges know, but they respect the save.

Script for the fallback script:
- 2–3 minutes long
- Narrated voiceover (ElevenLabs or your own voice)
- Zoomed-in UI so screens are legible on a projector
- Captions burned in (Descript or Submagic, 5 minutes of work)

### The one slide you need

If you must use slides, ONE slide, ONE purpose: the user + pain, in 10 words or less. Everything else lives on the screen during the demo.

### Technical demo pitfalls

- **Don't demo the admin setup.** Judges don't care about Setup > Digital Experiences.
- **Don't show code in the live demo.** Show it in the tech-reveal section only, and only 10 lines.
- **Don't say "imagine that..."** — if you have to imagine it, you didn't build it. Show the thing that's real.
- **Don't apologize for what's missing.** Judges notice what's present, not what's not. If you don't mention it, they won't either.

---

## 17. The Pitch Template

### Opening hook (20 seconds)

> "Meet [name]. They're a [role] at [company/segment]. Every week, they [painful specific behavior]. Last year, that cost [company] [specific outcome — hours, dollars, deals, CSAT]."

### Stakes (20 seconds)

> "The problem isn't [obvious cause]. It's that [deeper cause]. And every tool that tries to fix this [fails in a specific way]."

### Solution (90 seconds, demo)

Live demo. No more talking — just narrate actions as they happen.

> "Watch what happens when I [action]..."
> "[Result appears]. That's [the magic], powered by [1–2 tech names]."

### Tech reveal (30 seconds)

> "Under the hood: Agentforce with a custom Apex action calls [Claude Opus / Sonnet] through a Named Credential. The agent's topic description is the entire prompt — no prompt engineering, just API design."

### Ask (20 seconds)

> "If we had another week, we'd add [1 specific thing]. If we had a pilot customer, we'd start with [specific persona]. Find us on [where]."

---

## 18. Judging — Anticipate the Criteria

Most SF hackathons weight similarly:

| Criterion | Typical weight | What judges actually look at |
|---|---:|---|
| Innovation / originality | 25% | "Have I seen this before?" |
| Business impact | 25% | "Would I buy this?" |
| Technical execution | 20% | "Does it work? Is it well-built?" |
| Salesforce-ness | 15% | "Is it native or bolted on?" |
| Presentation / demo | 15% | "Did they tell a story?" |

### What specifically to optimize for

- **Originality:** one sentence that sounds unlike any startup pitch from 2023. "LLM wrapper for X" is dead. "Agent-to-agent handoff," "no-UI CRM," "the invisible rep" all read as fresh.
- **Business impact:** name a metric and move it. "Cuts call handling from 6 min to 90 sec." Numbers, not adjectives.
- **Technical execution:** in the tech reveal, drop 2–3 names that show depth (External Credentials, Platform Events, prompt caching).
- **Salesforce-ness:** the judges want to see LWC, Apex, Agentforce, Flow, Experience Cloud. Not a React app that happens to call the REST API.
- **Presentation:** clear user, clear pain, clean UI, rehearsed timing, one laugh line if natural.

### Red flags for judges

- Presenter reads from notes.
- "Let me show you the architecture" as slide 1.
- No actual customer/user persona.
- Multiple team members speaking in the first 60 seconds. Pick one voice.
- Demoing setup config ("and if I go to Setup…").
- Slide with bullet points that the presenter reads verbatim.
- No live demo at all, only a video with no narration.

---

## 19. Common Failure Modes & Antidotes

| Mode | Symptoms | Antidote |
|---|---|---|
| **Premature optimization** | Writing tests hour 3 | Zero tests until vertical slice is done. Tests ≠ hackathon points. |
| **Scope creep** | "Let's also add X" hour 20 | Demo-script lock at hour 16. Nothing goes in unless a bullet changes. |
| **Merge hell** | 3 people on `main` | Each person owns a feature branch; merge twice: hour 16 and hour 36. |
| **Single point of failure** | Only Builder knows the data model | End each 4-hour block with a 5-min sync — everyone knows what every object does |
| **Silent blockers** | Someone stuck for 2 hours | Hard rule: 20 min stuck → ask for help. No exceptions. |
| **Demo fails live** | "It worked an hour ago" | Backup video recorded at hour 40. Always. |
| **Net dies at venue** | Can't reach Anthropic API | Cache common prompts as MDT / local JSON. Use backup hotspot. |
| **Scratch org expires** | 7-day default expiry | Create with `-y 30`. Also have a second scratch org as backup. |
| **Rehearsed into the ground** | Presenter robotic | After 3 rehearsals, stop. One cold run just before the demo. |
| **One person dominates** | Two teammates passive | Rotate who "owns" the next hour. Scout → Builder → Presenter. |

---

## 20. Git + Conductor + Worktree Strategy for 3 People

### Branch model

- `main` — always deployable to the demo scratch org
- `feat/<initial>-<short>` — one per person at a time
- Pre-agreed merge windows at hour 16 and hour 36

### Conductor (if you use it)

- Spin a worktree per feature, so concurrent work doesn't fight over `force-app/`.
- Name worktrees `wt-<feature>`.
- Claude Code `isolation: "worktree"` mode works here too — Claude edits in its own worktree, you review the diff.

### Hygiene rules

- Commit every 30 minutes with a conventional message: `feat(scope): what`.
- Rebase-before-merge, not merge commits. History stays linear and demo-ready.
- If a branch diverges more than 12 hours from `main`, stop and rebase — the longer you wait, the worse it gets.

### The "demo org" rule

Only one person has deploy rights to the **demo scratch org**. Typically the Builder. Everyone else deploys to their personal scratch org. This stops someone from overwriting the demo state 10 minutes before you present.

---

## 21. Live Starter Code — Copy-Paste Ready

### `LightningElement` with wired Apex + toast

```javascript
// force-app/main/default/lwc/orderLookup/orderLookup.js
import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrders from '@salesforce/apex/OrderLookupController.getOrders';

export default class OrderLookup extends LightningElement {
  @api recordId;
  orders;
  loading = true;
  error;

  @wire(getOrders, { accountId: '$recordId' })
  wiredOrders({ data, error }) {
    this.loading = false;
    if (data) this.orders = data;
    if (error) {
      this.error = error.body?.message || error.message;
      this.dispatchEvent(new ShowToastEvent({
        title: 'Could not load orders',
        message: this.error,
        variant: 'error'
      }));
    }
  }
}
```

### Apex `@AuraEnabled` controller

```apex
public with sharing class OrderLookupController {
  @AuraEnabled(cacheable=true)
  public static List<Order> getOrders(Id accountId) {
    return [
      SELECT Id, OrderNumber, TotalAmount, Status, EffectiveDate
      FROM Order
      WHERE AccountId = :accountId
      WITH USER_MODE
      ORDER BY EffectiveDate DESC
      LIMIT 20
    ];
  }
}
```

### `ClaudeService` one-liner

```apex
String reply = ClaudeService.ask('Summarize: ' + JSON.serialize(account));
```

(See §13 for the full class.)

### Agentforce `@InvocableMethod` stub

See §13, "Agentforce-compatible action wrapper."

### Seed script template

```apex
// scripts/seed-demo.apex
delete [SELECT Id FROM Account WHERE External_Id__c LIKE 'demo:%'];

insert new List<Account>{
  new Account(Name='Demo Co', External_Id__c='demo:acct-main')
};
System.debug('Seed complete.');
```

### Reset script template

```apex
// scripts/reset-demo.apex
delete [SELECT Id FROM Order WHERE Account.External_Id__c LIKE 'demo:%'];
delete [SELECT Id FROM Contact WHERE Account.External_Id__c LIKE 'demo:%'];
delete [SELECT Id FROM Account WHERE External_Id__c LIKE 'demo:%'];
System.debug('Demo state reset.');
```

### Playwright smoke test

```typescript
// e2e/demo-smoke.spec.ts
import { test, expect } from '@playwright/test';

test('demo happy path loads', async ({ page }) => {
  await page.goto(process.env.DEMO_URL!);
  await expect(page.getByText('Welcome')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByText('Order placed')).toBeVisible();
});
```

Run this before every rehearsal. If it passes, the demo will probably work. If it fails, you know what to fix before demoing in front of humans.

### Experience site guest access (site-admin pattern)

```
Setup > Digital Experiences > All Sites > <site> > Builder > Settings >
  Guest Access > Apex Class Access > add OrderLookupController
```

---

## 22. Vendor / Resource Index

### Salesforce

- https://developer.salesforce.com — the canonical docs home
- https://developer.salesforce.com/docs/platform/lwc/guide — LWC docs
- https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref — Apex reference
- https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode — Apex developer guide
- https://developer.salesforce.com/docs/atlas.en-us.agentforce_developer_guide.meta/agentforce_developer_guide — Agentforce dev guide
- https://developer.salesforce.com/docs/atlas.en-us.experience_cloud_dev.meta/experience_cloud_dev — Experience Cloud
- https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev — SFDX / project setup
- https://trailhead.salesforce.com — Trailhead training, playgrounds
- https://www.lightningdesignsystem.com — SLDS components and tokens
- https://developer.salesforce.com/blogs — official dev blog
- https://architect.salesforce.com — architect patterns
- https://github.com/forcedotcom — official GitHub org
- https://github.com/trailheadapps — reference apps (e-bikes, dreamhouse, etc.)

### Claude + Anthropic

- https://docs.anthropic.com — start here
- https://docs.anthropic.com/en/docs/claude-code — Claude Code docs
- https://docs.anthropic.com/en/docs/claude-code/settings — settings.json reference
- https://docs.anthropic.com/en/docs/claude-code/hooks — hooks reference
- https://docs.anthropic.com/en/docs/claude-code/mcp — MCP in Claude Code
- https://docs.anthropic.com/en/docs/claude-code/subagents — subagent architecture
- https://docs.anthropic.com/en/api — HTTP API reference
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching — caching
- https://docs.anthropic.com/en/docs/build-with-claude/tool-use — function calling
- https://console.anthropic.com — API keys, billing, logs
- https://github.com/anthropics/claude-code — Claude Code repo + issues
- https://github.com/anthropics/anthropic-quickstarts — starter templates
- https://github.com/anthropics/anthropic-cookbook — recipe collection

### MCP

- https://modelcontextprotocol.io — spec + docs
- https://github.com/modelcontextprotocol/servers — canonical server list
- https://mcp.so — community catalog
- https://smithery.ai — MCP registry with install commands

### Adjacent AI tooling

- https://console.groq.com — very fast Llama/Mixtral inference (backup if Claude is rate-limited)
- https://elevenlabs.io — voice synthesis
- https://deepgram.com — speech-to-text
- https://openai.com/api — fallback LLM
- https://voyageai.com — best-in-class embeddings
- https://turbopuffer.com — fast serverless vector DB
- https://supabase.com/docs/guides/ai/vector-columns — pgvector in Postgres

### Side-service stacks

- https://vercel.com — Next.js, Edge Functions, 10-second deploys
- https://developers.cloudflare.com/workers — serverless, 0-ms cold start
- https://supabase.com — Postgres + Auth + Storage in one
- https://planetscale.com — MySQL at scale if you prefer
- https://upstash.com — Redis + Kafka serverless
- https://resend.com — transactional email, clean API
- https://twilio.com — SMS, WhatsApp, voice
- https://ngrok.com — tunnel localhost
- https://cloudflared.com — Cloudflare's ngrok equivalent

### Design / media

- https://figma.com — sketching, mockups, co-design
- https://excalidraw.com — quick diagrams
- https://gamma.app — AI-generated pitch decks
- https://screenstudio.com — Mac screen recording (clean, zoomy, hackathon-ready)
- https://descript.com — editing + captions + voice cloning
- https://submagic.co — fast captioning
- https://v0.dev — Vercel AI UI prototyping
- https://www.heropatterns.com — free SVG patterns

### Useful GitHub repos for inspiration

- https://github.com/trailheadapps/lwc-recipes — LWC patterns
- https://github.com/trailheadapps/apex-recipes — Apex patterns
- https://github.com/trailheadapps/dreamhouse-lwc — reference Experience Cloud app
- https://github.com/trailheadapps/ebikes-lwc — another Experience Cloud reference
- https://github.com/salesforce/design-system-react — SLDS React components (if building external UI)
- https://github.com/forcedotcom/sfdx-core — SFDX internals if you're extending CLI
- https://github.com/anthropics/anthropic-cookbook — Claude recipes, especially `skills/` and `tool_use/`

### Hackathon-specific

- https://devpost.com — most hackathons post here
- https://mlh.io — Major League Hacking (student-focused)
- https://www.salesforceben.com — SF community news; often posts hackathon results
- https://www.salesforce.com/events — official SF events including Dreamforce, TDX hackathons

---

## 23. The Pre-Kickoff Dry Run

48 hours before the event, run this dry run across all 3 laptops. Each step should take under 5 minutes. If any step fails, fix before the event.

1. `sf org create scratch -f config/project-scratch-def.json -a dry-run -y 1` (1-day org, disposable).
2. `sf project deploy start -d force-app -o dry-run` with a hello-world LWC.
3. `sf data query -q "SELECT Id FROM Account LIMIT 1" -o dry-run`.
4. `sf apex run -f scripts/seed-demo.apex -o dry-run`.
5. `sf org open -o dry-run`.
6. From VS Code, attach to the org (auto-complete works = extension is alive).
7. Run one anonymous Apex callout through `ClaudeService.ask('hi')`. Check response.
8. `npm test` — Jest boots and runs.
9. `npx playwright test` — Playwright boots (even if 0 tests).
10. `claude /model` — Claude Code responds.
11. `claude mcp list` — all MCPs green.
12. Delete the dry-run org: `sf org delete scratch -o dry-run -p`.

### The "packing list"

- 2x laptop chargers
- USB-C → HDMI + USB-A dongle
- Portable mouse (presentations with a trackpad look rushed)
- Backup hotspot (or tethering plan)
- Wired or BT headphones (noisy venues)
- Reusable water bottle + caffeine
- Printed copy of the demo script (one per person) — in case laptops fail
- Your Anthropic key written on paper (encrypted at rest, obviously — a hotel safe works)
- Ibuprofen, eye drops, a snack. No joke — physical comfort is a force multiplier at hour 36.

---

## 24. After the Hack — Convert Momentum

Win or lose, this is the most valuable 48 hours you'll have this quarter. Convert it:

- [ ] Push the code to a public repo (or public-read if internal) within 72 hours.
- [ ] Post a 90-second demo clip on LinkedIn. Tag the event, the tech used, the teammates.
- [ ] Write a short blog post: problem, architecture, what worked, what didn't. Take the dev blog slot.
- [ ] If there was a standout technical finding (a cool Agentforce pattern, a clever prompt cache trick), submit a talk to the next Trailblazer Community event.
- [ ] Follow up with every judge who DM'd or left a card. "Thanks for the feedback — here's the GitHub link" within 48 hours.
- [ ] Debrief as a team on day 3. 30 minutes. Write a retro doc. Save it — next hackathon, you'll reread it in 5 minutes and start 20% ahead.

---

## Appendix A — Starter Repo Skeleton

```
hackathon-project/
├── .claude/
│   ├── agents/
│   │   ├── sf-expert.md
│   │   ├── demo-dresser.md
│   │   ├── rehearsal-coach.md
│   │   ├── judge-simulator.md
│   │   └── hackathon-idea-filter.md
│   ├── skills/
│   │   ├── scaffold-lwc.md
│   │   ├── scaffold-apex.md
│   │   ├── ship.md
│   │   ├── seed.md
│   │   ├── reset-demo.md
│   │   └── pitch.md
│   ├── hooks/
│   │   ├── load-context.sh
│   │   ├── post-deploy-check.sh
│   │   └── remind-constraints.sh
│   └── settings.json
├── config/
│   └── project-scratch-def.json
├── data/
│   └── seed/
│       └── Account-plan.json
├── docs/
│   ├── demo-script.md           # THE document
│   ├── pitch.md                 # generated from demo-script.md
│   ├── architecture.md
│   └── rehearsal-notes-*.md
├── e2e/
│   └── demo-smoke.spec.ts
├── force-app/
│   └── main/default/
│       ├── classes/
│       ├── lwc/
│       ├── objects/
│       ├── triggers/
│       ├── permissionsets/
│       ├── namedCredentials/
│       ├── externalCredentials/
│       ├── digitalExperiences/
│       └── agentforce/          # bot/topic/action metadata
├── scripts/
│   ├── seed-demo.apex
│   └── reset-demo.apex
├── CLAUDE.md                    # project-level instructions
├── README.md
├── package.json
├── playwright.config.ts
└── sfdx-project.json
```

Clone this skeleton once, save as a GitHub template repo (`gh repo create --template`). Every future hackathon starts from it.

---

## Appendix B — `CLAUDE.md` Starter for Hackathon Repos

```markdown
# CLAUDE.md — Hackathon project

## Mode
This is a 48h hackathon. Optimize for demo-ability over correctness, clarity over cleverness, one path working over three paths half-working.

## Stack
- Salesforce DX project, scratch org alias `hack`
- LWC + Apex + Agentforce
- External Named Credential: `Anthropic_API`
- Demo URL: (filled in at kickoff)

## Critical files
- `docs/demo-script.md` — the source of truth for what we're building. Every feature maps here.
- `scripts/seed-demo.apex` — idempotent seed for the demo org.
- `scripts/reset-demo.apex` — wipes demo state between rehearsals.

## Commands
- `sf project deploy start -d force-app -o hack` — deploy
- `sf apex run -f scripts/seed-demo.apex -o hack` — seed
- `npm test` — LWC Jest
- `npx playwright test` — demo smoke
- `sf org open -o hack` — open org

## Rules
- Never add tests for features not in the demo script.
- Never refactor working code without a demo reason.
- Every Apex method that touches AI goes through `ClaudeService.ask()`.
- Named Credentials only — never a raw API key in code or metadata.
- Every new LWC: `isExposed=true`, include `lightningCommunity__Page` in targets.
- All custom objects get an External_Id__c (Text 255, unique, externalId=true).
- Commit every 30 min with a conventional message.
```

---

## Appendix C — The 5 Things to Do at Hour 1

If this playbook is too long to read at kickoff, read this:

1. **Write the demo in 5 bullets** (15 min). No bullet = no feature.
2. **Assign Scout / Builder / Presenter** (5 min). Lock it.
3. **Create the scratch org** (10 min). Deploy a hello-world LWC. Validate credentials.
4. **Sketch the data model on paper** (10 min). 5–8 objects. Take a photo, commit to repo.
5. **Write the one sentence: "Meet X. They do Y. That costs Z. We built W."** (10 min). This becomes the pitch opener.

Then — and only then — write code.

---

## Appendix D — Judge Psychology Quick Reference

What judges **remember 24 hours after the event**:

1. The problem (if it was vivid and specific)
2. One visual from the live demo
3. One line you said during the pitch
4. A vibe ("these people were sharp / these people were tired")
5. Whether you fit the event's theme

What they do **not** remember:

- Code quality
- Architecture slides
- The names of libraries you used
- How many features you crammed in
- Who was on your team

**Implication:** spend your polish cycles on the problem statement, one hero visual, one memorable line, and the team's energy during Q&A. Not on adding features.

---

## Appendix E — Anti-Patterns Hall of Fame

Patterns that tank otherwise-strong hackathon teams. Know them so you can name them in real time.

- **"Just one more feature"** — classic scope creep. The antidote is the demo script on the wall.
- **"We'll fix it in the demo"** — no you won't. Judges see through it.
- **"I'll refactor this quickly"** — refactors are zero-demo-value.
- **"Let's use React Native"** — no. Not in 48 hours. Not with Salesforce in the stack.
- **"I've never used Agentforce but it looks simple"** — if nobody on the team has shipped an @InvocableMethod before, practice one T-2 days.
- **"We don't need a fallback video"** — see §16. You do.
- **"We'll rehearse tonight"** — tonight doesn't exist. Rehearse at the time you committed to on the schedule.
- **"Let's write a custom CSS framework"** — use SLDS.
- **"The judges will get it"** — they won't. Assume zero context on your domain.
- **"The demo is at noon, we have plenty of time"** — submissions close 2 hours before demo. Check twice.

---

**Final note.** The teams that win hackathons are rarely the most technically gifted teams. They are the teams that:

1. Picked a focused problem,
2. Cut scope ruthlessly,
3. Rehearsed the demo,
4. And showed up rested.

All four are decisions you make — not talents you have. You can do all four. Go win it.

— End of playbook —
