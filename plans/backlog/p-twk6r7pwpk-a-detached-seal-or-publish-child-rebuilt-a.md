---
id: p-twk6r7pwpk
title: A detached seal or publish child rebuilt a state root its owner had torn down (Git, priority medium)
status: done
priority: P2
area: git
created: 2026-11-14
---

# Why

`fgos events seal` and `fgos events sync --opportunistic` built the Git driver through `GitDriver::new`, which creates an absent state root, so a child that outlived a deleted `FGOS_STATE_ROOT` recreated `git-empty-hooks`, `git-floor-NNN/` and `git-floor-verdict.json` there: debris nobody owns. Closed 2026-11-14: the driver has a second door `GitDriver::new_if_root_exists` that answers `None` for an absent root; the addon passes an explicit `detached` argument through `resolveEventStore`, `eventStoreFacts` and `GitInspect`; the CLI entry and the events use cases pass it for the verbs the registry marks `eventStoreChild`, and a gone root makes the child answer `{ skipped: "state root gone" }` and exit 0. Foreground commands (`fgos init`, first run) still create the root.

# Done when

A removed state root stays removed: a late background child leaves nothing behind. Proofs: `a_driver_for_a_detached_child_never_creates_a_gone_state_root` in `packages/git/rust/tests/inspect.rs`; `test/event-store/background-seal.test.mjs` runs both verbs against a deleted root.

# Notes

Migrated from the legacy backlog table. Original status: done.
