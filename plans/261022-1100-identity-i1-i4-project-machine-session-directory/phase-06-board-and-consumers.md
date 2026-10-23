---
phase: 6
title: "Board and consumers switch to handles"
status: completed
priority: P2
effort: "2h"
dependencies: [2]
---

# Phase 06: Board and consumers

## Goal
The board names agents and machines by handle, and MAIL and HARDEN know exactly what to call.

## Steps
1. After phases 01-02 land on all three machines: collect the roster lines each machine posted; add a "Máy và phiên" table to the board's plan.md (machine handle, full machine id, checkout path, release) as the reference list.
2. Rewrite the "ai làm" column of live board rows once with handles (spec decision 6); old log lines stay as they are. Add the rule to the board's "Luật chung": new lines name agents as `<cli>-<chars>@<machine-handle>` or `lead:<LANE>`.
3. Note to MAIL: the session handle and `fgos identity resolve` are the address source; the mailbox alphabet has no `@` (scout §7, `packages/mailbox/rust/core/src/names.rs`), so MAIL chooses between widening its alphabet and mapping `@`; the project part of its address takes `fgos identity project` handle instead of the folder name. MAIL owns that branch; IDENT does not edit it.
4. Note to HARDEN: route owner of `fgos identity` moved to `packages/identity/rust`; after T1 phase 6 lands, IDENT moves the machine-id N-API out of `event_store.rs` and removes the Event Store forwarders.

## Verification
- `grep -cE '[a-z]+-[a-z2-7]{4}@[a-z][a-z0-9-]*' plans/261017-1313-fgos-platform-program-board/plan.md` counts at least one handle per live row (zero today); the roster table lists all three machines with a release that carries phases 01-02 and three different machine handles.
