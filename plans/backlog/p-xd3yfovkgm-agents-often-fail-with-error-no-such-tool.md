---
id: p-xd3yfovkgm
title: "Agents often fail with `Error: No such tool available: bash. Tool names are case-sensitive: call Bash instead.` (agent tooling, priority medium; source: owner 2026-11-18, seen often)"
status: proposed
priority: P2
area: agent-tooling
created: 2026-11-18
---

# Why

An agent session calls a tool named `bash` in lower case and the harness refuses it, so the turn is wasted. Which CLI or model emits it, in which sessions, and how often is not yet known.

# Done when

The cause is proven with evidence (which seat or model, which prompt or skill text spells the tool name in lower case, or which tool-name mapping is missing); a fix removes the wrong spelling at its source or maps the name in one door; the error rate before and after is measured from logs.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
