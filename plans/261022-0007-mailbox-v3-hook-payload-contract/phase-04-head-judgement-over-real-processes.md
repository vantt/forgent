---
phase: 4
title: "Head judgement over real processes"
status: pending
priority: P2
effort: "1.5h"
dependencies: [1]
---

# Phase 4: Head judgement over real processes

## Goal

Write one function that takes a stored binding and the registering head's process identity, and returns the core's `StoredHead { same_head, liveness }`. It uses `fgos-process`, following two rules from spec §5.1:

- "the mailbox compares no pid or start time itself";
- "the record adapter in `fgos-mailbox` holds the `Record` and calls `judge`".

V3 needs this function for registration in the drain. V2's record module and `list` will reuse it later, so there is one door.

## Files

- Create `packages/mailbox/rust/store/src/head.rs` with three functions:
  - `pub fn is_complete(record: &fgos_process::facts::Record) -> bool`
    - It returns true when `pid` and `start_time` are both present.
    - The drain refuses an incomplete registering record (`HeadUnknown`, phase 6).
    - A default or partial record must never stand for a head (red-team).
  - `pub fn head_text(record: &fgos_process::facts::Record) -> String`
    - It returns `record.to_json().to_string()`.
    - It is the only writer of `Binding.head`.
  - `pub fn judge_stored(stored: &fgos_mailbox_core::Binding, registering: &fgos_process::facts::Record) -> fgos_mailbox_core::StoredHead`. It works in three steps:
    1. Parse `stored.head` with `serde_json::from_str`, then `Record::from_json`. If the text does not parse, read it as `Record::default()`.
    2. `same_head` is `is_complete(registering) && is_complete(&stored_record) && stored_record == *registering`.
    3. If `same_head` is true, `liveness` is `Alive` without reading the OS: the registering record belongs to the running head. Otherwise, call `fgos_process::facts::judge_here(&stored_record)` and map its answer to the core's `Liveness`. An unreadable or incomplete stored record therefore reads as `Unknown`, so nothing is guessed.
- `src/lib.rs`: add `pub mod head;`.
- Create `tests/head.rs`.

## Tests first: real processes, no fake table

Every process fact comes from the real OS. The test process's own record is `fgos_process::facts::self_identity().expect("…").to_record()`.

The judge's own rows (another host, boot id, namespaces, a reused or missing pid) belong to `packages/process/contracts/process-facts.judge.v1.json` and its tests. They are not repeated here. The drain's suite (phase 6) proves the dead-replacement and live-conflict paths end to end with real child processes. That leaves these tests:

| Test | Behaviour | Why no existing test owns it |
|---|---|---|
| `the_running_head_is_the_same_head_after_a_text_round_trip` | stored head = `head_text(own record)`, registering = own record → `same_head: true, Alive`, and the record survives `head_text` → `from_json` unchanged | the round trip through the binding's opaque text is new to this crate |
| `an_unreadable_or_incomplete_head_is_never_the_same_head` | stored text `"not json"` → `same_head: false, Unknown`. `Record::default()` against `Record::default()` → `same_head: false`. An own record without `start_time` against itself → `same_head: false` | the completeness rule is new; equal default records must not match (red-team) |

## Steps

1. Sync.
2. Write the tests and see them fail.
3. Implement until they pass.
4. Run clippy on the crate.
5. Regenerate the census. Commit `feat(mailbox): judge a stored head against the registering one through process facts`.
6. Sync, run the proof, push.

## Acceptance criteria

- `cargo test --locked -p fgos-mailbox --test head` is green.
- `head.rs` has no pid or start-time comparison of its own. Equality goes through `Record`'s `PartialEq`, and liveness through `judge_here`.

## Risks

- A sandbox whose PID namespace differs from the observer's makes every stored head `Unknown`. Phase 2 records each CLI's hook namespace and stops if one differs.
