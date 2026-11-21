---
id: p-bssnrehp7e
title: "`ak update` for claude-code re-adds every AgentKit hook as a second registration in `.claude/settings.json`"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-09
---

# Why

The tracked file wraps each AgentKit hook as `P=…; [ -f "$P" ] || exit 0; exec node "$P"` so worktrees without `.claude/hooks` do not fail (commit 036884908); ak 3.0.0 does not recognise that form and appends its own unguarded `node …` entry, so 18 hooks would run twice per event. Found upgrading ak to v3 (2026-11-09) and folded back by hand.

# Done when

After `ak update --target claude-code --yes`, each `.claude/hooks/*.cjs` is registered once per event in `.claude/settings.json`, and a worktree without `.claude/hooks` still runs hooks without error

# Notes

Migrated from the legacy backlog table. Original status: proposed.
