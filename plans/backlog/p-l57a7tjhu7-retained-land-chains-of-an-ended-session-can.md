---
id: p-l57a7tjhu7
title: "Retained Land chains of an ended session can never be freed (git, priority high: ~89 GB under .fgos/runtime/git-candidates on fg-server2, 2026-11-19)"
status: proposed
priority: P1
area: git
created: 2026-11-19
---

# Why

`fgos git recover` frees only the caller's own terminal retained chains (8251ce9ea) and the writer is the session, so chains whose writer session has ended (live case: writers 106fdda5…, 43a86aee…, 6c70e4be…, 91299783…; 15 chains) stay forever.

# Done when

Proposal (lead:OPC): recover may free a terminal retained Land of another writer only when Identity proves that writer not live — the same dead-holder proof the lock and identity doors use; never a pending chain; proven by a Git test with a dead and a live other writer. Small lane, OPC reviews.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
