---
phase: 5
title: "Shared directory across machines (rung I4)"
status: pending
priority: P3
effort: "1d"
dependencies: [4]
---

# Phase 05: Shared directory across machines (I4)

**Outline only, not ready to execute.** It is planned in detail after the Event Store cutover of the WORK lane lands and the consumer registry is live.

## Goal
A session on one machine resolves a session on another machine after one `fgos events sync`, and the answer states how old the remote entry is.

## Waits for
- Event Store publication live: the consumer registry `packages/event-store/contracts/consumers.v1.json` is empty and the store is dormant on main (scout §6). Identity would be its first or second consumer; the cutover order is decided with the GIT/ES lane on the board before this phase is planned in detail.

## Design (outline; detailed when the wait clears)
- Event type `identity.directory-entry` (domain `identity`, scope `project`) in `packages/session-identity/contracts/identity.events.v1.json`, registered as a consumer with a rebuildable view under the user state root.
- Each machine publishes its own entries on its own ref; resolve reads the local view and reports the age of the last fetch; a remote session is never reported alive.
- Doctor warning: two remotes publish one project id (spec decision 3).
- Machine handle uniqueness across machines: a duplicate slug falls back to the full machine id until an alias is set.
- The I5 decision is asked at the close of this phase (spec decision 5).

## Verification
- On two machines: register a session on A, `fgos events sync` on both, `fgos identity resolve <handle-on-A>` on B returns A's full id and an age.
