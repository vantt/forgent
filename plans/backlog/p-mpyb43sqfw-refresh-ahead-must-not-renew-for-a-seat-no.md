---
id: p-mpyb43sqfw
title: "Refresh-ahead must not renew for a seat no token can cover (S6A, priority medium; source: lead:OPC review of 797a4f6d2, 2026-11-19)"
status: proposed
priority: P2
area: execution
created: 2026-11-19
---

# Why

When a seat's timeout exceeds the provider's whole access-token lifetime (e.g. an 8 h head on 8 h Claude tokens), the refresh window (max(threshold, seat timeout + probe timeout + 10 min)) is always open, so every start spends a renewal and the life check still refuses, now with `renewed`. Cap the window at the token's own full lifetime, or skip renewal when even a fresh token could not cover the seat, so a too-long seat is refused once, clearly, without spending a renewal per start. Node `src/runner/dispatch/provider-credential-renewal.mjs` and the engine mirror `packages/execution/engine/src/credentials/`.

# Done when

Owning tests both sides: a seat longer than the token lifetime is refused without a renewal and the refusal names why; a coverable seat still renews then is admitted.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
