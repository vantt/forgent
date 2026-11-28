# Lead notes, 2026-11-28 (session forgent-261128-0942-sessio-d40a0, second lead)

## Landed on main

- Phase 3: `e27d61b6cd` (earlier lead).
- Phase 2: `00c7708f55` (branch p02b: the submit call and verb, the `Terminal::enter_gap_ms` accessor, the full
  send-sequence assertion, rustfmt). Then p02c `f41d1f61a1` added pi to the per-profile typed-wake proof.
- Phase 1: branch p01c (claude pin 2.1.332 with real frames, the pi `composer_state` predicate anchored to the
  bottom rules, and the no-break-space prompt vector; duplicate and mislabelled claude vectors dropped).

## Review dispositions

Phase 2 review:
- Accepted: the per-profile proof lacked pi and omp. pi is fixed in p02c. omp waits on its frames.
- Accepted: assert the full send sequence (a3775ffe4e).
- Accepted: record the mailbox latency in the impact note.
- Accepted: the uncommitted `mod.rs` accessor (carried in p02b).
- Deferred to closing: `recipient_version` has no pi or omp source (`packages/mailbox/rust/store/src/adapters/version.rs`), so a live pi or omp head always answers `unknown`. That file is outside the footprint, so it becomes a backlog row at close.
- Deferred to closing: the wiring proof confirms through `brief_echoed` on a static screen.

Phase 1 review:
- Rejected: the `typed_wake.rs` 2.1.302 literal. It is gone because phase 2 landed first and reads the pin from the adapter.
- Accepted: anchor pi's rules, drop the duplicate and mislabelled vectors, add the no-break-space vector (p01c).
- Deferred: a real 2.1.332 multi-line draft frame whose `promptText` is cut off with `...`.

## Open

- Criterion 6: the agy 1.5.10, omp 18.11.2 and codex frames, and with them omp in criterion 1. Parked on
  `q-ahyrg44uwh`, because the supervisor can start only pi heads. Event `9794e1fd7e83c163`.
- The phase-table update (phase 3 done; phases 1 and 2 running) was refused twice with `land-backlog-index-failed`. The cause is
  the untracked `plans/discussions/probe-0018-stop/DISCUSSION.md` from plan 261127-0018 (event `413bf4a56b859ae3`). I restored
  plan.md to HEAD and will re-apply the update when that file is gone.
- Phase 4 waits on phase 1.

## Friction

`fgos run` commits only the changes the worker itself makes. Edits left uncommitted by an earlier unit in the same
worktree are never committed, and the run is judged inconclusive. Workaround: a fresh worktree off the branch tip,
with the diff given in the prompt. Workers cannot read files outside their worktree.
