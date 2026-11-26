---
id: p-ip5m4sbzyd
title: "A dead writer's unfinished Git operation blocks every event-store write, and `fgos git recover` refuses to settle it because Identity no longer holds that session (git, priority high)"
status: proposed
priority: P1
area: git
created: 2026-11-26
---

# Why

On 2026-11-26 on fg-server1, `fgos questions ask`, `fgos mailbox send` and `fgos events status` all refused with `event-store-io: Git: git-wal-unreadable [event-store-write-refused]`, and `fgos doctor` failed `git-operation-journal`, `event-store-open-root`, `event-store-machine-id` and `event-store-legacy-layout`. A plan lead could not file an owner question, so the plan's approval step stopped.

Found by reading `fgos git status` and the git crate: one `ScopedCommit` (operation `2443e5e5-0287-47b1-8cc4-d28cd47425a6`, writer `e0397c00-5319-463e-8e23-86031fbc824b`) is still open. That writer is a Claude Code session id from 2026-10-25 (it appears as the `@fgos:why` tag of a config line written that day), so the session is gone. `fgos git recover` keeps the operation with `commit-authority-mismatch`: it settles another writer's chain only when `session_proven_dead` holds, which needs Identity to still hold the session record and its processes to be gone; "a session Identity no longer holds, is not proof" (`apps/fgos/src/wiring/git_incidents.rs`). `fgos identity list` has no entry for it and `pruned` is empty, so the operation can never be settled. Ref admission (`wal.active` in `packages/git/rust/src/refs.rs`) fails closed, so every event-store ref write is refused. `fgos doctor --fix` does not help: its `git-wal-dir` fix only creates a missing WAL directory.

A pruned session and a never-registered session look the same to the proof, so a forgotten writer wedges the machine for good. Reading still works (`fgos questions --open`, `fgos authority declare` reads approvals), so the damage is limited to writes.

# Done when

A writer that Identity no longer holds, and whose process cannot be found, lets `fgos git recover` settle its unfinished operation (or an owner-confirmed form of the same), and `fgos git recover` on fg-server1 clears operation `2443e5e5` so `fgos questions ask` works again; the proof and its refusals are covered by one test in `packages/git/rust/tests/incidents.rs`; and `fgos doctor` names this case instead of only "WAL listing is incomplete".

# Notes

Evidence: `fgos git recover` output on 2026-11-26 (`kept` holds the operation with cause `commit-authority-mismatch`, plus two land candidates with `operation-id-conflict`); `fgos doctor` rows above. Not caused by plan `261125-1631-agent-context-engine`; recorded here because mess outside a plan's scope becomes its own item.
