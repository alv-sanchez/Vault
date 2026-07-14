---
ticket: {{KEY}}
title: {{TITLE}}
domain: {{DOMAIN}}
relates: []
branch: {{BRANCH}}
org: {{ORG}}
status: BUILD IN PROGRESS
sprint: TBD               # active sprint of the CURRENTLY-live child ticket, e.g. "Sprint 9" — "none" if nothing in this folder is in an open sprint
sprint_status: active      # active | dormant — dormant = no child ticket currently in an open sprint
sprint_history: []          # prior sprints this folder saw live work in, e.g. ["Sprint 7", "Sprint 8"] — append the old value here whenever `sprint` changes
po: Elliot Flores
updated: {{DATE}}
tags:
  - manager-engineer
  - build-overview
---

# {{KEY}} — {{TITLE}}

> [!warning] BUILD IN PROGRESS — branch `{{BRANCH}}`
> _One-line status / open architectural fork, if any._

- **Domain:** {{DOMAIN}}
- **User:** _who it's for_
- **Business impact:** _why it matters (the pain / the money)_

## What it is
_Plain-language description._

## Intended solution
_How it's built — key classes/objects/LWC, reuse vs net-new._

## Status / what's built
- _delivered pieces_

## Next phase
_what ships next / what's deferred + why_

## Demo
_click-path + the "don't say" caveats._
