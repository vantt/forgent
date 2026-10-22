---
phase: 8
title: "Branch docs, full gates, review, hand-off"
status: completed
depends_on: [7]
---

# Phase 8: Branch docs, full gates, review, hand-off

## Requirements

1. **Branch spec `docs/platform/agent-mailbox/spec.md`:**
   - header `Implementation status`: V2 built on the branch;
   - §4.1 table and "Source" line: `src/record/` and its files;
   - §6.4: the layout (`<fgosDir>/runtime/mailbox/record/snapshot.json`, `record/bodies/<id>.body`, and `runtime/mailbox/` itself left for files written without the mutex), named as owned by `record/paths.rs`; the commit-point rule (an error only before the rename); the per-hold directory check and the `O_NONBLOCK` regular-file reads; the lock row as added; "Mutual exclusion" sentence "V2 proves this on the mailbox's own path" becomes the proof reference (`tests/record_crash.rs`); body-before-snapshot and the two-part garbage collection; the rule that any new file in the record directory must be added to `Paths::is_known`; version 1 frozen by the fixture;
   - §10: the two crash rows point at `tests/record_crash.rs`; a row "A body file is replaced by a symlink or a larger file" -> "read refused, framed as body-missing";
   - §11: mark the V2 Core-suite items with their owning test files;
   - §14 V2 row: "Built on branch" with the proof command and the cost report link;
   - §16/§17: plan decisions 1-13 as agent decisions; owner questions Q1 and Q2 of this plan in §16 with their provisional defaults.
2. **Holder-lock spec** already edited in phase 1; verify it.
3. **Full gates on a fresh main merge:**
   - `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all --check`;
   - `npm test`;
   - `fgos doctor` check `git-mutation-one-door` green (census current);
   - `fgos convention check --all --json`: no violation names a file the plan added under `plans/` or `docs/`.
4. **Review:** an `ak-code-review` of the branch diff since V3's close. Report path from `fgos convention path --kind report --type review --slug mailbox-v2-final-review --json`. Fix Critical/High before closing; Medium either fixed or listed with a reason.
5. **Close:** `plan.md` `status: completed`, every phase `status: done`; push; report to the controller (board row `MAIL`, which the controller updates).

## Gates

The list in requirement 3. Long commands follow the plan's "exit must be observable" rule.

## Done when

All gates green on a fresh main merge, the review has no open Critical/High, and the controller has the hand-off: proof command, cost report path, owner questions Q1/Q2 and their current defaults, and what V4 inherits (the hold API, `Record::body`, `hook.lockWaitMs`).

## Done on the branch (2026-10-22)

The review step was skipped at the coordinator's instruction: the coordinator runs an independent review.

### Docs

Branch spec `docs/platform/agent-mailbox/spec.md`:
- Implementation status and §4.1 layout table.
- §6.4 "Built at V2": the layout owned by `record/paths.rs`, the commit point, the directory check and regular-file reads, the change-report write rule, the two-part collection, `Paths::is_known`, the frozen fixture.
- §10: crash rows plus a planted-body row. §11: owning test files. §14: the V2 row.
- §16: items 20 (Q1, answered B) and 21 (Q2, answered B).
- §17: implementation decisions 1–13, decision 3 reversed, owner Q1 and Q2, M2-A, self-send-B, self-send counting.
- The holder-lock spec lines from phase 1 are present.

### Gates (final tree, main `1aca9e83e` merged)

Run under the coordinator's memory limits: one heavy gate at a time, `CARGO_BUILD_JOBS=4`, `--test-threads=4`, `npm test -- --test-concurrency=4`, and `free -g` checked before each heavy gate (16 to 21 GB available).

| Gate | Result |
|---|---|
| `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos-holder-lock` | 253 passed, 0 failed |
| `cargo test --locked --workspace` | 1446 passed, 0 failed, 11 ignored |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | clean |
| `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` | clean |
| `cargo fmt --all -- --check` | fails only outside `packages/mailbox`, in files this branch does not touch (workspace drift, item `tsk-hls`) |
| `npm test` (branch) | 8853 tests, 8739 passed, 18 failed: `fgctl-upgrade` 15, `fgctl-init-download-sources` 2, `dispatch` 1 |
| `npm test` on a clean `origin/main` worktree (sibling directory, same limits) | 8847 tests, 8733 passed, 18 failed: the same 18 titles. With C-locale sorted lists, there is no title that fails only on the branch and none that fails only on main |
| `node scripts/git-one-door-scan.mjs --check` (the census behind doctor's `git-mutation-one-door`, which compares an activated release; this branch is never activated) | exit 0, 0 undeclared sites on the tree with main `1aca9e83e`. After the last merge (main `9e487b3d9`) it exits 1 with 5 undeclared sites (`unresolved-binary` in `bin/fgos.mjs`, `src/runner/merge.mjs`, `src/runner/worktree.mjs`). A clean `origin/main` worktree gives the same 5 and the same exit 1, and main's own board records them (`9e487b3d9`), so the failure is inherited and none of the sites is in a branch file. The census was regenerated: it lists every branch file |
| `fgos convention check --dir . -- <48 files this rung added or changed>` | 0 violations |

A first attempt at the main comparison, from a worktree under the session scratch directory in `/tmp`, was discarded: its run lost its own test helpers mid-run (`ERR_MODULE_NOT_FOUND`), and its 382 failures were caused by the location, not by main. Both temporary worktrees were removed.

### Hand-off (what V4 and V5 inherit)

- Proof command: `cargo test -p fgos-mailbox`.
- Cost report: `plans/reports/research-261022-1145-mailbox-v2-record-costs.md`, three runs.
- The hold API: `Record::open(fgos_dir)`, `hold` / `hold_observed(wait, now, limits, [observe,] mutate)` with `ReportsChange`, `send` / `send_observed`, `Record::body(id, expected_bytes, limits)`, `RecordError::code()`, `Held { value, wrote, warning, collected }`.
- `mailbox.hook.lockWaitMs`: V4/V5 pass `Wait::Ms(hook.lock_wait_ms)`.
- The `.fgos` directory is a parameter.
- `LockScope::seeded(vec![])` checks no rank against locks the caller holds: V5 must take the mailbox lock with nothing else held, or seed the scope.
- Owner questions: Q1 answered B (one-day retention, applied); Q2 answered B (dead names skipped, applied). None open.

### Final merge (main `9e487b3d9`; Node-only changes since `1aca9e83e`)

- `npm test -- --test-concurrency=4` on the final tree: 8850 tests, 8736 passed, 18 failed. The 18 titles are exactly those that fail on clean main, compared above.
- The Rust gates are unaffected, because main changed no Rust file since they ran.

## Review fixes (plan owner (agent), 2026-10-22)

Independent review: `reports/code-review-v2.md`. It found H1 (blocks the rung), M1, M2 and L1–L8. Before the fixes, the reviewer's 24 mutants gave 22 caught and 2 survived (L1). The reviewer's two probes became owning tests. Same rules and RAM limits (`CARGO_BUILD_JOBS=4`, `--test-threads=4`).

| Item | Decision | Commit | Owning proof | Mutants after |
|---|---|---|---|---|
| H1 | Name resolution's exact steps (short name, then writer key) see every binding; an exact match of a dead head is refused as unknown and never falls through to a prefix. Q2(b) skipping applies to prefixes and candidates only. | `b299e63f7`, `dfa14930d` (clippy) | core `tests/names.rs` :: `exact_short_name_wins_over_a_longer_name_it_prefixes`, extended with the dead exact name and the dead exact key; a fixed id source draws `…-9c5` | 4 of 4 killed: exact step over live only; exact dead accepted; exact key treated as a prefix (killed once a live `k10` was added); a prefix seeing dead heads |
| M1 (+L6, L8) | Every directory from `.fgos` down to `bodies/` is checked on every hold and by `Record::open` before it creates anything: not a symlink, owned by the euid, and the mode its creator gives it. The record's own directories have no group/other bits; `.fgos` and `runtime/` must not be world-writable (they are 0775 here under umask 002). The sweep lists through the checked descriptor (`sys::list_at`, `fdopendir`). Dirfd-relative reads and writes stay with `tsk-1lx`. | `6898e7e07` | `tests/record_bodies.rs` :: `a_symlinked_parent_of_the_record_steers_no_write_or_deletion_outside` (the reviewer's probe: the hold fails before its commit point, `Record::open` refuses, the outside tree is unchanged); `tests/record_snapshot.rs` :: `an_untrusted_record_directory_is_refused_before_any_write` (symlinked `record/`, group-writable `record/`, world-writable `.fgos`, group-writable `.fgos` accepted) | 5 of 5 killed: the record mode unchecked; the others mode unchecked; the others mode too strict; the hold checking only `record/` and `bodies/` (killed once the outside tree had the record's modes); `open` unchecked. Listing through the descriptor rather than the path cannot be told apart by a test without a swap inside `collect`; it is defence for the same window that the identity check already closes |
| M2 | The snapshot read is capped at `snapshot_byte_cap(limits)` = `Limits::sender_header_ceiling()` × the encoded size of the largest contract-allowed header (built in `Header`'s own shape). At the current values that is 2,880 × 847 = 2,439,360 bytes. A larger snapshot is `snapshot-too-large`, not parsed, never overwritten. One `take(cap + 1)` guard, which also covers a growing file. Agent decision: the number is derived from the contract, not new. The ceiling is now exact (`budget × ceil(horizon / window)`), without the slack "+ budget" term, because no further window can straddle the horizon. | `9653b1c0d` | `tests/record_snapshot.rs` :: `a_snapshot_larger_than_the_contract_cap_is_never_parsed` (reads at the cap, refused at cap + 1, bytes unchanged) | 4 of 5 killed: cap unchecked; cap off by one; cap halved; ceiling one window long or short. Survived: choosing the smallest header state instead of the largest. The contract's real worst population (2,087,553 bytes with every key at its longest) sits 15% under the cap, so a shrink that small stays above it; the largest state is kept as the conservative bound |
| L5 | The ceiling's count proof moves to the core; the store keeps one wiring proof. | `9653b1c0d` | core `tests/sweep.rs` :: `one_saturated_sender_stops_growing_at_the_derived_header_ceiling` (reached and never passed); store `tests/record_ceiling.rs` :: `the_shared_senders_full_ceiling_population_reads_under_the_snapshot_cap` | the ceiling one window long and one window short are both killed |
| L2 | `forget_key` keeps other heads' wake lifetime counts toward the forgotten key, as a takeover does. The unused `as_recipient` parameter is removed (`WakeLifetimeKey::is_from`). | `47c5ea5c3` | core `tests/registry.rs` :: `forgetting_a_key_…_starts_clean_at_generation_1`, extended: b's count toward a survives the forget and a's re-registration | 1 of 1 killed |
| L1 | The notice clause of "named" is removed: unreachable, because a notice is created when its message is refused, and that header names the same keys and outlives it. The last-drain clause is reachable (`last_seen` is set only at registration) and is kept. | `9532bafeb` | `tests/record_prune.rs` :: `a_dead_binding_idle_since_its_last_drain_is_kept_until_a_record_ttl_after_it` | the reviewer's surviving `prune ignores last_drain_at` is now killed; the notice survivor is gone with its clause |
| L3 | A send judges liveness once, before the core runs; its name resolution and its prune both use that judgement. | `9532bafeb` | `tests/record_prune.rs` :: `a_send_prunes_with_the_judgement_it_made_for_its_names` | judgement inverted on the send's prune: killed. Re-judging instead of reusing: equivalent (cost only) |
| L4 | Duplicate proof retired: `record_snapshot.rs` :: `a_failure_after_the_rename_is_reported_as_written`. Owner: `tests/record_crash.rs` observer rows (`an_observer_error_at_synced_…`, `…_at_renamed_…`). | `9532bafeb` | (retired) | |
| L7 | No cheap enforcement that is not test-only: refusing `mailbox` in Node would add a second owner list to the shared `src/holder-lock` facade. Documented as a rule of use in the holder-lock spec and the record's module doc. | (docs commit) | | |

A consequence of M2 that the owner should know (also in spec §17): a project whose registered heads together keep more headers than one saturated shared sender within a day reads as too large, so its hook stays quiet until headers retire. The measured 100-head population (7.8 MB) is over the cap; 10 heads (1.6 MB) is under it.

