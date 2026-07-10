---
tags: [manager-engineer, skills-index]
updated: 2026-07-06
---

# 🧰 My Skills

Ten custom Claude Code skills powering the BMS pipeline. Live in `~/.claude/skills/`; backed up in `_skills-backup/`.

## 🔁 Orchestration
| Skill | Invoke | What it does |
|-------|--------|--------------|
| **pulse** 💓 | `/pulse` · "refresh everything" · `/loop 30m /pulse` | One command = the whole board. Runs conductor (plan-only) → Mission Control → Branch-Org → synapse. Loop-safe (no auto-dispatch). |
| **conductor** | `/conductor` · "kick off the pipeline" · "re-plan the epics" | Syncs epics from Jira → audits executability (`/polish`) → rebuilds Build Order → routes open questions → daily → dispatches engineers (`--live`). The planning brain. |

## 📊 Visibility / dashboards
| Skill | Invoke | What it does · output |
|-------|--------|----------------------|
| **mission-control** 🛰️ | `/mission-control` · "mother dashboard" | Every active epic → full ticket tree → PR + org (org from epic notes, expired-flagged). → `Mission-Control/mission-control.html` |
| **branch-org-manager** 🖥️ | `/branch-org-manager` · "refresh orgs" | Ties `sf` orgs ⋈ git branches ⋈ tickets; flags orphans + expiry. → `Branch-Org Manager/_dashboard.md` |
| **synapse** 🕸️ | `/synapse` · "connect my work" · "where have I hit" | Weaves product areas ⋈ tickets/epics into an Obsidian graph web. → `Atlas/_MAP.md` + area hubs |

## 🔨 Execution
| Skill | Invoke | What it does |
|-------|--------|--------------|
| **build-overview-scaffold** 🗂️ | `/build-overview-scaffold` · "make the build folder for BMS-XXXX" | On epic pickup, auto-creates `Build-Overview/BMS-<epic>-<slug>/` (SESSION.md + overview.md + overview.html). Takes epic OR ticket key (ticket → parent epic folder). Idempotent. |
| **engineering-notes** | starting/logging a ticket | Writes/updates the `Tickets/BMS-XXXX` note from live Jira. |
| **ticket-create** | "create a ticket" | Scaffolds a new BMS ticket. |

## 🧭 Direction & comms
| Skill | Invoke | What it does |
|-------|--------|--------------|
| **the-corner** 🥊 | `/the-corner` · "I'm stuck" · "what's next" | Cornerman — reads the board + calendar + sprint, hands you ONE next move. → `The-Corner/` |
| **newsletter** | "what shipped this week" | "What we shipped" digest from merged PRs (HTML + Slack draft). |

---
## The loop, in one line
Organize in **`Epics/`** → pick up an epic → **build-overview-scaffold** → build against the package `CLAUDE.md` DoD → **`/pulse`** repaints everything → **`/the-corner`** for the next move.

_Deep reference for how the system works: [[CLAUDE]]._
