# Phase 10 lead report: worktree pin flushes (owner decision 19, option a)

Branch `harden/t2-p10-worktree-pin-fsync`, cut from track tip `fd734fa2b`. Timezone Asia/Saigon.

## Result in one paragraph

The pin stays and stays durable before the effect. Count: 25 -> 23 fsyncs per add on a `files` repository (strace marginal, n=3 minus n=1 and n=5 minus n=3). Wall time: **no measurable change** (p50 191.4 -> 189.4 ms interleaved, pairwise median delta 1.9 ms, within noise). The speed seat's estimate (about 45-55 ms, 25-30 %) does not hold, and the measured reason is below. The phase's expected 25 -> 16-17 was not reachable without weakening the invariant.

## What changed (Git area)

| Commit | What |
|---|---|
| `7f5c67806` | `refs.rs`, `lib.rs`, `worktree.rs`, spec section 10, CHANGELOG |
| `2b7a9a7ae` | `scripts/git/e1-power-cut.mjs`: `trace --kind worktree` and rules R10, R11 |
| `db6420e9a` | `land.rs:1` drops "Dormant" |
| next (branch tip) | census regeneration |

Behaviour:
- `install_worktree_pin` (new, Worktree kinds only; `install_pin` for every other kind keeps `core.fsync=all` and the sequential syncs, via the shared `write_pin`).
  - files backend: `update-ref` runs with Git's default config (no flush); the crate then flushes, in one concurrent batch (`sync_ref_dirs(.., true)`, the Publication primitive), the ref file, every directory from its own to the common dir, the candidate's fan-out directory and `objects/`.
  - reftable: `durable_ref_args` = `core.fsync=reference` + `core.fsyncMethod=fsync` (new, `lib.rs`; `core.fsync=all` on reftable also flushed compaction tables: 4 fsyncs per pin write vs 2). The batch holds the table dir and the common dir.
- `release_pin` for Worktree kinds: delete with `durable_ref_args`; flush only `release_dirs`: the deepest surviving directory (Git prunes the emptied ones), plus the common dir when `packed-refs` exists before or after the delete or when the delete already ran (resume). Reftable keeps its chain.

## How "pin durable before effect" still holds

Git's own fsync of the lock file is replaced, not removed: on files, the ref file's flush moves from Git (inside `update-ref`, before its rename) to the crate (after the rename, same batch as the directories). `core.fsync=all` on a loose ref write gave exactly one flush (the lock file); strace of `update-ref` on both backends:

| backend | no config | `core.fsync=reference` | `core.fsync=all` |
|---|---|---|---|
| files | 0 | 1 (lock file) | 1 (lock file) |
| reftable | 0 | 2 (table, tables.list) | 4 (adds compaction table + list) |

So the saving on files from dropping `all` is zero by itself; the batch merges Git's flush and the directory flushes into one journal commit. `core.fsyncMethod=fsync` stays forced wherever Git still flushes (reftable pin write and every pin delete, via `durable_ref_args`); where Git no longer flushes (files create) there is nothing for `writeout-only` to weaken, and a user config that flushes more only adds flushes.

Order proof (E1-style, strace, ext4, no root): `node scripts/git/e1-power-cut.mjs trace --kind worktree --ops 2 --addon .../libfgos_node_addon.so --host .../fgos`:
- R10: pin ref file flushed, and every directory from the pin's own to the common dir flushed, between the pin rename and the first `target-attempt` record install.
- R11: the directory that lost an entry flushed between the last pin removal and the `pin-released` install.
- Result: 6 pins judged (create, move, remove x 2), `violations: []`, 148 fsyncs. Publication trace (6 ops): 24 records, 6 pins, `violations: []`; scoped: `violations: []`.
- Negative controls (fsync lines removed from the same trace): ref file -> 1 violation (R10); `git-operations` dir -> 6 (R10); `refs/fgos` -> 12 (R10 + R11); common dir -> 6 (R10). All reported.

Rust owning proof of the release set (`refs.rs` `pin_sync_tests`, behaviour: a released pin's flush set): loose files pin -> `[refs/fgos]`; packed pin -> `[refs/fgos, common]`; reftable -> `[reftable, common]`. Why no existing test proves it: `release_dirs` is not observable from the port; the Node worktree tests only assert the pin namespace is empty afterwards. Pin-before-effect crash cases stay owned by `worktree.rs`, `land_crash_matrix.rs`, `recovery_matrix.rs` (green, below).

Not proven here: power loss on a real device (E1 device replay does not judge Worktree kinds; the trace rules are the order proof, as for Publication before the device run). Consequence of a power cut in the one case the order does not cover (a second writer creating `git-operations` concurrently) is unchanged from before, because the chain is still flushed in full on install.

## Measurements

Method: release build (addon + host) staged for `before` (`fd734fa2b`) and `after`; scratch repo (loose objects, fence), `addWorktreeSync` through the production door; strace `-f -e trace=fsync,fdatasync`; machine load 4-5 from other leads' builds, so absolute times are about 190 ms (the speed seat saw 184 on a quiet machine).

Fsync count per add (files repo):

| run | before | after |
|---|---|---|
| n=1 | 33 | 31 |
| n=3 | 83 | 77 |
| n=5 | 133 | 123 |
| marginal per add | **25** | **23** |

Where the two went: release 3 -> 1 directory flush (`refs/fgos`, `refs`, `.git` -> `refs/fgos`). Install is 8 before (1 Git + 5 chain + 2 objects) and 8 after (1 crate + 5 + 2), now one concurrent batch.

Wall p50 (interleaved before/after, fresh repo per run, first add of each process dropped, plain-fsync probe 5.2 ms p50 beside every run):

| run | n | before p50 | after p50 | note |
|---|---|---|---|---|
| ab-run4 (load 4.0-4.2) | 100 vs 100 | 191.4 | 189.4 | pairwise median delta 1.9 ms, after faster in 14 of 25 |
| ab-run3 (load 5-6) | 100 vs 100 | 296.5 | 286.5 | |
| ab-run1+2 | 16 pairs | 232.0 | 214.8 | median pairwise 17 ms, 11 of 16 |

Verdict: not distinguishable from noise on the quiet run; do not claim a speed-up.

Why the seat's estimate fails (measured, in-process timing of the old code, temporary instrumentation, not committed): the old install syncs 7 paths (5 chain + 2 object dirs) sequentially in **7.4 ms total**, and the 3 release syncs in 7.4 ms. After the first flush commits the journal, the following directory flushes cost about 0. Only flushes that follow new metadata cost the 5.2 ms commit. So per-fsync x 5.25 ms overstates dir-chain cost, and cutting dir flushes buys almost nothing.

Where the time is (for the big lead, an addition, not done): an operation record is a temp-file fsync (5.3 ms) then a directory fsync after the link (5.4 ms), two real commits each, about 6 records per add = about 64 ms of the 172. That, not the pin, is the fsync-bound block.

## Verification (result lines)

- `cargo test --no-fail-fast -p fgos-git --all-targets`: exit 0, 50 `test result: ok`, 0 FAILED (lib 75 passed incl. 3 new; `land_crash_matrix` 15 passed 2 ignored; `recovery_matrix` 30 single-case targets ok; `publication` 34 passed; `worktree` ok).
- `cargo test --no-fail-fast -p fgos-event-store -p fgos-identity`: every `test result` ok, 0 failed.
- `cargo clippy -p fgos-git --all-targets -- -D warnings`: clean.
- Node one-file command: `test/git/worktree.test.mjs` + `test/runner/worktree-admin-multiprocess.test.mjs`: tests 23, pass 23, fail 0. `test/git/*.test.mjs` (22 files): tests 174, pass 173, fail 0, skipped 1; no `run-tests: ERROR`.
- Census: regenerated as the last commit.

## Delta lines and test cost

| Area | Added | Removed |
|---|---|---|
| Rust (`refs.rs`, `lib.rs`, `worktree.rs`, `land.rs`) | +164 (65 of them tests) | -22 |
| Node/script (`e1-power-cut.mjs`) | +57 | -5 |
| Docs (spec, CHANGELOG) | +4 | -1 (Node production code: 0) |

Tests added: 3 Rust unit tests (release flush set per backend); trace rules R10, R11 with 4 negative controls run by hand. Retired: none. New CLI/host spawns in the suite: none (the unit tests spawn plain `git`, as the neighbouring fixtures do).

## Docs, gate, review

- Spec section 10: one paragraph ("Worktree pins") and the `durable_ref_args` clause on the `core.fsyncMethod` bullet. CHANGELOG `[Unreleased]` line states the count and that the measured add time is unchanged within noise.
- Install/setup/doctor gate: no new config, env var, dependency or file.
- Impact analysis: the GitNexus tools were not available to this session; `impact-analysis: not run` (blast radius covered by the crate's full test run). OPC review pending.

## Unresolved

- Whether the owner still wants the CHANGELOG/spec text as written, given no wall gain: the count drop is real and the proofs hold, the speed claim is not.
- Option (b) of the arbitration (no pin for a WorktreeCreate whose `next` equals the registration's HEAD) would save the pin's 3 journal commits (about 16-20 ms of 172) but still not the record commits; not done.
- OPC verdict on the three Git-area commits above.

Status: DONE_WITH_CONCERNS
