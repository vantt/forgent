---
id: p-yrvpo2bbdv
title: A hand-written skill directly under `.claude/skills` blocks `ak update` for claude-code
status: done
priority: P2
area: packaging-distribution
created: 2026-11-09
---

# Why

ak 3.0.0 classifies `.claude/skills/ui-spec` (tracked, no ClaudeKit metadata) as a legacy ClaudeKit flat skill projection and refuses the claude-code refresh with "ClaudeKit project detected"; `ak migrate --from=ck` preserves it and does not clear the refusal. Found upgrading ak to v3 (2026-11-09); worked around by moving the folder aside during the refresh. Evidence: `ak migrate --from=ck --json` finding `legacy Claude Code flat skill projection`, report `~/.agentkit/support/update-report-20261109-043139.md`. Closed 2026-11-10 by removing the copy: `ui-spec` and `ui-port` are now served by the skillstation hub, with their source in github.com/vantt/ui-spec.

# Done when

`ak update --yes` refreshes claude-code with no folder moved aside, either because `ui-spec` lives in its single source (`.agents/skills` or the skillstation hub) or because AgentKit stops treating an unmarked skill as ClaudeKit

# Notes

Migrated from the legacy backlog table. Original status: done.
