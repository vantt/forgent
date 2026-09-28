---
name: fgos-code-panel
user-invocable: false
description: >-
  Deprecated: use fgos-code-change. Kept loadable only for the Phase 7
  compatibility window.
---

# fgos-code-panel (deprecated)

Deprecated: use [`fgos-code-change`](../fgos-code-change/SKILL.md) instead.
`fgos-code-change` replaces both this skill's direct-single-cell mode and
`fgos-plan-loop`'s planned-multi-cell mode with one merged open/fix/close/
worktree lifecycle (its own Mode Selection picks between them) -- the same
`fgos coordination` CLI doors, the same `standalone-master-coordination-loop`
FlowDefinition, and the same mutation-gating/quorum-close engine this skill
used. This stub is kept loadable only for the Phase 7 compatibility window;
it carries no operational content of its own.
