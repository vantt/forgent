---
title: "WORK lane U1 lead report: Work gate core ported onto main's Event Store API"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (rebased on 236267464; origin/main is 6 doc-only commits ahead, b6b708f4a)
status: DONE_WITH_CONCERNS
---

# U1: Work gate core port

## What changed

Product (`src/`, contracts): the gate core already parked in the WIP commit (consumer gate, Work event store, staged
effects in `hot-lock.mjs`, `runtime-coordination`, `store`, append removal in `events`/`event-log`, contracts, consumer row)
is now complete and green on main's API. This session added:

- `src/state/work-event-store.mjs`:
  - catch-up continues from this process's previous read: `readWorkState` passes the retained `cursor` + `folded` to
    `store.read` and keeps the new pair per store (WeakMap). A fresh process reads from zero once; a long-lived one
    (gateway, runner) walks only what is new. A rebuild read (no cache path) never continues from a retained read.
  - the cache is reused when `cover`, `streams` and `deferred` match, plus `legacyDigest` and `projectOrder`. Deviation
    from "compare only cover/streams/deferred": legacy events fold into the view, and neither extra value moves with a seal
    (verified by the reuse-after-seal test), so keeping them costs nothing and cannot serve a stale view after a legacy change.
  - store errors that mean damaged history (`event-store-integrity`, chain-gap, seal-mismatch, ref-tampered, seq-conflict,
    order-cycle) carry category `corrupt-log`, so the CLI keeps exit 5 for a damaged history as it did for a damaged legacy log.
- `src/state/store.mjs`: `currentView` of a directory with no `.fgos/` returns the empty view (a read never creates a
  store; `list`, `ready` and `doctor` keep working outside a store).
- `hot-lock.mjs` checked by hand against main: the staging (`tx.append`, `commit`, in-gate `tx.view`/`readText`/`list`) touches
  disjoint regions from main's process-door liveness/self-record; the async-callback refusal now runs before `commit`, so a
  promise-returning callback commits nothing. No change needed.
- Addon/process door: the `git-addon-second-load` flood (882) came from `test/helpers/work-store-release.mjs` staging a
  hard-linked second copy of the addon per process. It now only calls `ensureGitAddon()`, so the one in-process door loads
  one file. No product code loaded the addon on its own.
- `packages/git/contracts/mutation-census.v1.json` regenerated with `node scripts/git-one-door-scan.mjs --write-census`
  (never hand-edited; `work-event-store.mjs` and `store.mjs` are hashed files).
- The `scripts/lib/test-git-config-guard.mjs:128: git init` count was stack frames of `guardedGitSpawn` in unrelated
  failures, not a one-door finding; no `run-tests: ERROR` one-door report is produced by the branch.

Tests/fixtures (shared helpers and owning tests):

- `test/helpers/git-fixture.mjs`: `activateGitFixture` now also gives the fixture checkout a machine id (config + state
  root `machine-id`, one per process) and the event locks directory, so every fixture that opens a Work store works.
  `initializeWorkRepository` (in `work-store-release.mjs`) builds on it.
- `test/event-store/work-gate.test.mjs`: the existing reuse test is extended (not duplicated): the cache is reused after an
  append and after a seal, the second catch-up passes the retained cursor and folded events, a foreign event refolds, and a
  rebuild read starts from zero. Why no other test covers it: the gate tests start every read fresh.
- `test/event-store/work-consumer.test.mjs`: no longer stages its own host release; the attestation-guard, doc-alias and
  incomplete-history assertions moved out (see "Deferred": they exercise readers, not the gate).
- CLI/intake/state fixtures that opened a Work store without a repository or machine id now build one; tests that read
  the retired `events.jsonl` now read the store (`eventLines`, `readRawEvents`) or assert that no tracked event file exists.
  Retargeted, not removed: add/edit/move lifecycle (`fgos-edit`), `init` (`fgos-setup`), corrupt history (damage a stored
  event; exit 5), `approve` with an appended event (events no longer dirty the checkout), `catchup` (main advances by a commit),
  `lock-status` (only the fixture fence exists), ask/answer seq numbers (one stream numbers all events).
- `test/event-store/door.test.mjs`: removed the `store.mjs: import readAllEventsFromDir` debt line (the import is gone; shrink-only).
- `test/cli/subcommand-flag-drift.test.mjs`: reverted to main (the WIP expected the `events` verb, which the registry gets in the registrations unit).

## Test counts (focused runs through `runSelectedTests`, same env as `npm test`; no full suite)

| Set | Origin/main b6b708f4a | This branch |
|---|---|---|
| `test/state` + `test/event-store` + `test/cli` | 2518 tests, 0 fail | 2508 tests, 2209 pass, 233 fail (before fixes); after fixes see below |
| `test/state` + `test/event-store` + `test/cli` + `test/intake` (final) | 0 fail (intake 0 on main) | 2690 tests, 2597 pass, **26 fail**, 65 todo |
| `test/setup` + `test/intake` | 1178 tests, 0 fail | `test/setup` 58 fail (not fixed, below) |

U1 owning tests, all green (139 tests): `test/event-store/{work-gate,work-conflicts,work-consumer,staging-returns,door,verbs,consumers}`,
`test/state/{hot-lock-known-exec-sites,runtime-coordination,hot-lock-tx,store}`. `cargo test` not run: no Rust touched.

Failure mix of the first branch run (233): `event-store-no-repository`/`machine id missing`/`fgos init` bootstrap (fixtures with
no repo or machine id), `git commit` of nothing in `commitPending` (events no longer dirty the tree), reads of the retired
`events.jsonl`, hard-coded legacy seq numbers, a broken import in `fgos-return`. All fixture-side except the two product
changes above (`currentView` of a missing store, `corrupt-log` category).

## Remaining failures and owners (26 in the compared directories)

| Failures | Cause | Owner |
|---|---|---|
| `test/state/replay.test.mjs` (18) | tests of the snapshot, zero-read fast path and per-writer file discovery of `rebuildView`; the store no longer writes a snapshot or per-writer files | U7 removal of replay discovery/T4/snapshot; behaviour removed, retire with that code |
| `test/state/events-compaction.test.mjs` (3) | tests the compaction module the cutover deletes | U6 (module and test retire together) |
| `test/state/porting-store.test.mjs` (1, file fails to load), `test/state/identity-before-lock.test.mjs` (3, porting branch) | `porting-store.mjs` still calls the removed `tx.append(logPath, opts)` | U3 (porting stream port) |
| none other in the compared dirs | | |

## Outside the compared directories (known, not run to completion)

- `test/setup` (58 fail on the branch, 0 on main): doctor checks that read the Work view (`root-drift`, `decision-index-stale`,
  `work-*-vocabulary`, doc checks, `doctor` in a repo with no machine id or addon) open the store; their fixtures have no repo or
  machine id, and the doctor run is not isolated from a store that cannot open. Belongs to the readers unit (doctor checks share one
  view read, fail-closed) and the registrations unit (one `eventStoreDoctor` per run). Fixture-only part can go through `activateGitFixture`.
- `test/runner/claim-port.test.mjs` (8 fail): `main-fgos-checkpoint`, opportunistic truncation policy, full-log-read counting,
  claim reconcile reads: U5/U6/U7 families (review-B H2 tests at :707 retire in U7). `test/runner/loop.test.mjs` and
  `test/runner/attestation-guard.test.mjs` import the removed `appendEvent` and do not load until the readers/triggers units retarget them.
- Not run at all: the rest of `test/runner`, `test/e2e`, `test/run-supervisor`, `test/workflow`, `test/git`, `test/scripts`.
  Their fixtures use `activateGitFixture`, which now supplies machine id and locks directory, but they were not executed.

## Δ lines against the merge base 236267464

| | + | - |
|---|---|---|
| src, contracts (`packages/work-state`, `packages/event-store`) | 682 | 442 |
| test | 937 | 802 |
| this session on top of the WIP commit: src | 26 | 4 |
| this session on top of the WIP commit: test | 137 | 175 |

## Impact analysis

`fgos tool query --capability impact-analysis --status present` returns 0 providers (inactive). Callers cross-checked with `rg`:
`readWorkState` is called only by `store.mjs` (`readAllEvents`, `currentView`), `work-event-store.mjs` and tests; `currentView`
only inside `store.mjs`. Blast radius unconfirmed by tooling.

## Deferred

- U2: reducer H1 and 3-origin vector, `prepareEvents` per-id map, `expectedStatus` rule, post-ack failure code, H23 `finally`.
- U4: attestation-guard fail-closed reader and its test (assertions removed from `work-consumer.test.mjs`), doc-alias doctor
  check through one view read, `door.test.mjs` census to zero.
- U7: `fgos rebuild` summary output; `events` verb registration (restores the `subcommand-flag-drift` expectation).

## Process notes

- A focused-run script call with an empty file list ran the whole `test/` tree for about 7 minutes before I killed it
  (12:55-13:02). I removed its root artifacts, its temp directories and its orphan processes. The helper now refuses an empty list.
- Baseline worktree and its Cargo directory were removed after the comparison.

## Unresolved questions

- Should a read of a repository with no machine id (a store never opened on this machine) report an empty view like a missing
  `.fgos/`, or refuse? U1 keeps refusing (`event-store-machine-id`); doctor in such a repo currently stops instead of listing checks.
