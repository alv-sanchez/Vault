#!/bin/bash
# pulse — deterministic refreshers (no MCP). Run AFTER the Jira/base step writes
# Mission-Control/mission-control.base.json. Refreshes the three script-driven surfaces.
set -uo pipefail
SK="$HOME/.claude/skills"
nowarn() { grep -v "Warning:" || true; }

echo "▶ Mission Control (gather PR+org → render)"
node "$SK/mission-control/gather.mjs" 2>&1 | nowarn
node "$SK/mission-control/render.mjs" 2>&1 | nowarn

echo "▶ Branch-Org Manager (orgs ⋈ branches)"
node "$SK/branch-org-manager/refresh.mjs" 2>&1 | nowarn

echo "▶ synapse (area ⋈ ticket web)"
node "$SK/synapse/weave.mjs" 2>&1 | nowarn

echo "✓ pulse scripts done"
