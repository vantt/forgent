---
title: "WORK lane U4 lead report: every Work reader goes through the Event Store facade"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-u4 (from work/es-cutover f02382319; merged origin/work/es-cutover 2ede27d7d, clean)
status: DONE_WITH_CONCERNS
---

# U4: readers on the store

## What changed

| Area | Change | Owning proof |
|---|---|---|
| `attestation-guard.mjs` | reads `readRawEvents(dir, { requireComplete: true })`; a history it cannot fully read refuses (`event-store-incomplete-history`) | `test/runner/attestation-guard.test.mjs`: altered stored bytes throw; an event whose writer saw unseen history throws that code (assertions moved out of `work-consumer.test.mjs`) |
| `claim-port.mjs` | in-gate fresh read already `tx.view` (U1); stale comment about the event files fixed | `claim-port.test.mjs` racing-move case now appends through the store instead of a writer file |
| `loop.mjs` | `executor.dispatch` already appends through the gate (U1); `loop.test.mjs` retargeted (it failed to load) | `loop.test.mjs` (98 tests green) |
| Doctor rows | `createDoctorRun()` gives a run a memo (`once(key, compute)`, a failure is remembered). `bin/fgos.mjs` doctor builds one run and passes it to every row. Nine doc rows and the five `listWork` rows (root-drift, leaf-notify-drift, two vocabularies, delivered-not-on-trunk) read the view through `doctorWorkView` once per run. A project with no Work store (no `.fgos`, no repository) is skipped, as it was with no event file. `registerCheck` and `runFixes` turn a throw into a failed row, so one unreadable store no longer kills `fgos doctor`. `fixDocRegistryStale` reads for itself (a fix must not act on a view read before the fixes ran). | `knowledge-doctor.test.mjs`: nine doc rows, one read; a failed read is not retried; `doc-alias-broken` judges aliases of a real store |
| Friction migration doctor row | legacy `work.friction` records come from the facade's legacy records (file provenance), not a file scan | `observe-doctor-checks.test.mjs` (legacy frozen into HEAD) |
| `bin/fgos.mjs` | the five `rebuild(dir)` callers that only read (doc promote, knowledge status/attest, doc-registry, compound registry check) use `listWork`; `unclaim` folds `readRawEvents`; `rebuildViewFromDir` import gone. The `rebuild` verb itself stays for U7. | CLI tests in `test/cli`, unchanged and green |
| `enduser-index-generate.mjs` | an unavailable or corrupt store throws before the manifest is touched (the old "events.jsonl absent means unreachable, keep the prior id" branch is gone) | `enduser-index.test.mjs`: three tests rewritten to the refusal (the old preserve-on-unreachable behaviour is removed) |
| Scripts | `measure-verify-cost`, `probe-storytelling-material` (`--log` is now `--dir`), `verify-fanout-overlap`, `regenerate-observe-fixtures` read/write the store. `backfill-unit-summaries` names the workflow-run log through `eventsFilePath` (now exported from `src/workflow/store.mjs`). `migration-proof-2a.mjs` deleted: it imported `src/runner/coordination/session-engine.mjs`, which does not exist. | `probe-storytelling-material.test.mjs` CLI case builds a real store; regenerate script ran end to end and reproduced the committed fixtures with zero diff |
| `readAllEventsFromDir` | deleted with `discoverEventFilePaths`, `readFileWithRawLines`, `tryIncrementalRebuildFromDir`, `rebuildViewFromDir`, `buildSnapshotFromDir` (all fed only by it). `migrate.mjs` parity decodes the HEAD inventory through `decodeLegacyFiles` and builds the cache anchor with `legacyInventorySnapshot`. | `legacy-order-parity.test.mjs` is the frozen-vector proof against the crate; `migrate.test.mjs` and `export-legacy-parity.test.mjs` use the new `legacyOrderOf(dir)` fixture helper |
| Rust | `event_reader.rs` (new), `work_source.rs`, `legacy_friction.rs`, `Cargo.toml`, `Cargo.lock`. `VIEW_SCHEMA_VERSION` 4 -> 6; one Rust test reads `src/state/replay.mjs` and fails if the two drift. `docs/specs/work-state.md` updated. | `cargo test --locked -p fgos-work-state -p fgos-observe` and `-p fgos` green; clippy `-D warnings` and fmt clean on `fgos-work-state`; `cargo check --workspace --tests` clean |
| Observe golden fixtures | the tracked `.fgos/events.jsonl` and `coexistence.json` are gone; `test/fixtures/observe/work-events.jsonl` and `test/fixtures/observe-legacy-friction.jsonl` replace them (taken from the reviewed branch, byte-identical to what the regenerate script now produces) | `test/observe` (5), Rust `fixture_test` |

Prior art: the p09 branch versions of the same files were reused where they applied (readers, Rust sources, fixtures, `registerCheck` wrapper); the dir-reader removal and the doctor run memo are new (p09 kept eight `rebuild` calls, review B M2).

## Census

- `door.test.mjs` dormant reader census: 21 entries -> 10. **Not zero.** The ten left are code that U6/U7 delete, so they cannot go earlier without editing those units' files:
  - U6: `registrations.mjs` (`readEventsJsonLines` x2, `readFileSync`), `events-compaction.mjs` (2), `events-jsonl-truncation-guard.mjs` (1).
  - U7: `bin/fgos.mjs` `repairTruncatedLastLine`, `events.mjs` (2 imports), `replay.mjs` (2 imports, used by the file-based `rebuildView`).
  - Gone in U4: `attestation-guard` (2), the four scripts, `migrate.mjs`, `porting-store` (U3), `backfill-unit-summaries`, `migration-proof-2a`.
- `rg "\.fgos/events" src bin scripts packages apps -g '!test/**'` is not only the migrate inventory yet. Left, with owner: `registrations.mjs` and `events-jsonl-truncation-guard.mjs` and `events-compaction.mjs` comments/strings (U6); `command-registry.mjs:1441` and `bin/fgos.mjs:289-293` (U7); `merge.mjs:178,615` comments (U5/U6); `packages/git/**` (U6); `replay.mjs:779` comment (U7); one-off migration scripts `backfill-status-category.mjs` (comment) and `scripts/event-store/forge-probe.sh` (comment). `event_reader.rs` writes `.fgos/events.jsonl` only in its test import fixture.
- Mutation census regenerated with `--write-census`; it still reports the same 5 undeclared `unresolved-binary` sites from main (`bin/fgos.mjs:3481,3625`, `merge.mjs:1216,1246`, `worktree.mjs:146`); none added.
- `docs/architecture-manifest.json`: not touched (U3 added the rows).

## Counts (focused runs through `runSelectedTests`, no full suite)

| Set | Before U4 (U2 tip) | After |
|---|---|---|
| `test/setup` | 56 fail of 993 (this worktree; 58 in the U1 report) | **1 fail of 995**: `checks.test.mjs` `events-jsonl-not-truncated` (U6 removes the row and its test) |
| `test/state test/event-store test/cli test/intake` | 25 fail (U2 report) | 2702 tests, 2620 pass, **16 fail**, 65 todo: `replay.test.mjs` 13 (snapshot fast path and per-writer discovery of file-based `rebuildView`, U7), `events-compaction.test.mjs` 3 (U6). Porting (4) fixed by U3; 5 replay tests retired with the dir readers. No other failure. |
| `test/runner` focused (claim-port, attestation-guard, loop, loop-rununit, dispatch-reconciliation-import-graph, goal-check, worktree, session, merge-quoted-paths, land-vs-manual-commit, execution/unit-summary) plus `test/verbs test/report test/scripts test/observe` and e2e `rebuild-determinism`, `self-improve-loop`, `runner-loop` | `loop` and `attestation-guard` did not load; others not run | 1090 tests, 1084 pass, **6 fail** (below) |

The 6: `claim-port.test.mjs` x4 (checkpoint and truncation policy: U6; "reads the log fully at most 7 times" counts reads of the retired file, its successor is a facade-read bound that has no counter seam yet: U7 with the review-B H2 retirements; the `runOpportunisticMainCheckoutChecks` case: U7 H2), `capability-plan-lint.test.mjs` plan-lint CLI (this linked worktree has no `.fgos/config.json` on disk although it is tracked; environment, not Work), `test-select-mutate.test.mjs` integration (test-selection tooling; not investigated, no reader involved).
Also failing, outside that list: `test/runner/concurrent-claim-eventlog-loss.test.mjs` (3) on a missing machine id and its subject is the retired file log and truncation guard: U6/U7 retire or rewrite it (concurrency proof moves to the V-SEQ proof).
`run-tests: ERROR: product code started git ... (136x)` appears in the broad run: stack frames of `guardedGitSpawn` from fixture `git init` calls, the same false report as in the U1 report.

## Fixtures fixed (shared, not switches)

`setup-checks-harness.mjs` `initRepo` -> `initFixtureRepo` (machine id, locks dir, fence). Tests that built a bare temp dir and opened a store now use `initializeWorkRepository`. `freezeLegacyWorkFixture` (new, in `work-store-release.mjs`) commits a hand-written legacy file into HEAD where a test injects history the gate would refuse (out-of-vocabulary kind or step, legacy friction). Compaction test compares `liveEvents(dir)` (what a reader sees) instead of the removed dir fold. A clone without a machine id still refuses.

## Retired tests and successors

- `replay.test.mjs`: 12 tests of `rebuildViewFromDir`, `readAllEventsFromDir` and `buildSnapshotFromDir` (file discovery, same-ts tie order, dedupe, archive exclusion, zero-read fast path, incremental fold, shrink fallback, snapshot maxTs). Behaviour removed; crate legacy order: `legacy-order-parity.test.mjs`; fold: `work-gate`, `work-conflicts`.
- `rebuild-determinism.test.mjs`: the truncated-final-line case retired; owned by `fgos-post-merge-2.test.mjs` "a corrupt trailing line ... exit 5". The view-equality case now compares the view and revision and requires a cursor on both (the saved cursor differs after a rebuild: it records certification and mirror state, not the fold; worth a look in U7's rebuild summary work).
- `fgos-return.test.mjs` attestation case, `loop.test.mjs`, `runner-loop.test.mjs`, `self-improve-loop.test.mjs`, `authoritative-match.test.mjs`: retargeted, nothing retired.

## Work acknowledgement reader (describe only, nothing built for M3)

Land keeps its candidate until Work records the result. The producer side:
- `sync-root.mjs:112` and `promote-to-component.mjs:149` call `addDecision(...)` (a `decision` event appended through the gate), then `acknowledgeLand(repoRoot, landSettlement.operationId, "work-decision:<itemId>:<event.seq>")` (`src/runner/merge.mjs:1315`), which passes the string to the Git Land port as `consumerAcknowledgement` in `port.recover(...)`. Warnings (`land-cleanup-deferred: ...`) come back and are printed; a failure never throws.
- `<itemId>` is the work id the decision is about (`rootId` for promote-to-component). `<seq>` is `event.seq` of the appended decision as the Event Store returns it: one counter for the whole `project` stream, so it is a stream position, not a per-item number. The string carries no origin or event hash.
- What exists for a reader today: `readRawEvents(dir)` returns every `decision` event (`type: 'decision'`, `payload.id`, `seq`, `origin`, `h`). A sweep that confirms an acknowledgement would parse the string, find the decision with `payload.id == itemId` and `seq == n`, and treat absence as "not durable yet". Gap for M3 to decide: `seq` alone is not unique across machines once two clones append (the origin is missing from the string), so the string should carry `origin` or `h`, or the sweep must accept any decision for that id at or after `seq`. No Rust or Node reader of this string exists; Git only stores it.

## Impact analysis

`fgos tool query --capability impact-analysis` could not run in this worktree (no `.fgos/installation`); treated as inactive. Callers by `rg`: `readAllEventsFromDir`, `rebuildViewFromDir`, `buildSnapshotFromDir` had no `src`, `bin` or `scripts` caller left after the moves (only comments and tests); `registerCheck`'s new second argument reaches every row, and the only direct-reference rows (`checkActiveReleaseMatchesCheckout`, the doc rows) take at most `(cwd, run)`.

## Delta lines against `origin/work/es-cutover`

| | + | - |
|---|---|---|
| src, bin, scripts, Rust (incl. census json) | 739 | 896 |
| test | 303 | 514 |
| docs | 4 | 3 |

## Behaviour changes a user can see (for U7's CHANGELOG pass)

- `fgos doctor`: a check that cannot read its store fails its own row instead of aborting the run.
- `fgos docs-index` refuses an unavailable store and leaves the manifest as it was.
- `scripts/probe-storytelling-material.mjs --log <file>` is now `--dir <.fgos>`.
- `scripts/migration-proof-2a.mjs` removed (dead).

## Unresolved questions

1. Census "zero" and the `rg` acceptance cannot hold before U6 and U7; the ten sites above are listed with owners. If the owner wants zero at U4, U6/U7's file edits must come first (order change).
2. The saved `cursor` differs after `fgos rebuild` while the view and revision match. Intended (certification state) or a rebuild that should reproduce it? U7 owns `rebuild`.
3. `test-select-mutate` integration fails in this worktree; not checked against main.

Process notes: cargo target dir `/home/vantt/projects/forgent-worktrees/work-es-u4-target` removed at the end; no background processes left.

Status: DONE_WITH_CONCERNS
