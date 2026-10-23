---
title: "WORK lane U5 lead report: Event Store triggers on maintenance facts, and Work's Land policy"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (from a69141307; code 989d8d087, test fixtures 3fccfd160)
status: DONE_WITH_CONCERNS
---

# U5: triggers and Land policy

## What changed

| Area | Change | Owning proof |
|---|---|---|
| `src/event-store/maintenance.mjs` (new) | `maintainEventStore(cwd, {trustedMain, shutdown, end, dispatched})`: reads `store.maintenance` facts (open streams, oldest unsealed age, last push), then `sealIfDue` per stream, `sealAll` on `shutdown`, `sync` on `end` when a push is due and the process is not a dispatched worker. Each step is attempted alone; the first failure comes back as `{ error }`, never thrown. A push attempt, failed ones included, counts against `sync.intervalSec`. | `test/event-store/triggers.test.mjs` (5 tests: due vs young vs shutdown; 0 native `status` calls in every mode; owner push once per interval and never from a worker; unopenable store reported not thrown; one CLI verb makes 2 `maintenance` and 0 `status` native calls) |
| `bin/fgos.mjs` | start and end triggers for a verb that opens the store (`requiresExistingStore`, the store-missing-warning reads, and `init doctor setup rebuild decision-index docs-index knowledge`). `getMainFgosDir` runs only for those verbs. `init` has the end trigger only. End trigger is in `finally`, after the answer is written. `dispatched` comes from `currentDispatchDepth()` (one door). | `triggers.test.mjs` CLI case |
| `src/runner/loop.mjs` | `runWatch`: per-iteration `maintain({})` (due seal only, no sync), `maintain({shutdown:true})` in `finally`. Roots resolved once; a directory that is no checkout resolves to nothing and `runOnce` reports the same fault as before. | `loop.test.mjs`: poll seals an old event before the stop; stop seals a young one |
| `src/runner/session.mjs`, `gateway-control.mjs` | `shutdown` seal after `lock.release()` in `endSession` / `stopGateway`. | `session.test.mjs`, `gateway-control.test.mjs` (one test each) |
| `src/runner/merge.mjs` (Git 07 Land shape, not p09's hunks) | `landRunnerItem`: `sealProjectBeforeLand` (a store that cannot seal refuses the land as `MergeError` code `event-seal-failed`, before anything is published); after publication `promoteAfterLand` promotes `branch:${branchKey(branch)}` through the facade; result rides on `merged` as `promotion: {stream, promoted}` or `{stream, error:{code,message}, retryable:true}`; never a throw. `promoteLandedStreams(store, stream, writer, heldRanks)` uses `maintenance` (not `status`) to see whether the stream is local, skips a stream the project already names. `approve` and `sync-root` pass `promotion` next to `postLand`. | `merge-land.test.mjs`: seal observed from the candidate's verify (mutation-checked: dropping the seal turns it red); post-publication config failure gives `merged` + `promotion.retryable`; failed promotion names the key-derived stream; promote follows `branchKey` (`branch:fgw-item`, not `branch:<id>`), repeatable, absent branch is `[]` |
| Spec | `docs/platform/event-store/spec.md` "Work cutover clarifications (2026-10-22)": D13 narrowed to "not a dispatched worker" (the §21 line), trigger reads, Land policy. | prose |
| Census | `--write-census`; still the same 5 undeclared `unresolved-binary` sites (lines shifted); one `uncalled-wrapper` row removed because `branchKey` now has a product caller. `docs/architecture-manifest.json` row for `maintenance.mjs` (infra). | `door.test.mjs`, `architecture.test.mjs` green |

Review items closed: B H1 (triggers and promote no longer walk history; `maintenance` facts), B M3 (branch key through the facade; post-Land promote failure recorded), B L3 (main dir only for verbs that open the store), B L8 (spec line), A L6 (poll = `sealIfDue` only).

Prior art: p09's `maintenance.mjs` (called `status()`), its loop/session/gateway hunks and its `promoteLandedStreams` were reused for shape; the facts-based body, the per-step isolation, the key naming and the recorded promote result are new. Main already had `store.maintenance` and `branchKey()` (reused, not rebuilt).

## Runner failures U4 left unexamined

| Failure | Class | Evidence |
|---|---|---|
| `test-select-mutate` integration | **ours** | Its baseline related run is `test/direct/fgos-edit.test.mjs` in a detached HEAD checkout. That file counted lines of the retired event files, so 3 tests were red on our tip. origin/main (d70e70e5c): both files green in 15 s. Fixed in `3fccfd160` (the edit tests read the store; every "no event written" assertion had been vacuously true). Green after the commit. |
| `capability-plan-lint` plan-lint CLI | **environment** | `.fgos/config.json` is tracked but a fresh worktree keeps it as skip-worktree with the file absent (`git ls-files -v` shows `S`; `work-es-u4/.fgos` has no `config.json`). With the tracked bytes on disk: pass (also on origin/main). With the file removed for one run (restored, `cmp` equal, nothing committed): the same test fails. Not Work. |
| `test/direct/merge-gate.test.mjs` (10 fails, not in U4's list) | **ours** | Fixtures added Work items before the repo had a machine id. Fixed in `3fccfd160`. |

## Counts (focused runs through `runSelectedTests`, no full suite)

| Set | Before (U4 tip) | After (`3fccfd160`) |
|---|---|---|
| `test/state test/event-store test/cli test/intake` | 2702 tests, 16 fail | 2707 tests (+5 triggers), **16 fail**: same `replay.test.mjs` 13 (U7) and `events-compaction.test.mjs` 3 (U6) |
| `test/setup` | 995, 1 fail | 995, **1 fail**: `checks.test.mjs` `events-jsonl-not-truncated` (U6) |
| Runner focused list (U4's list plus merge-land, merge, gateway-control, merge-gate): U4 measured 1090 tests / 6 fail on its list | measured today on this tip before edits: 1195 tests, 17 fail (4 claim-port, test-select-mutate, 10 merge-gate, `loop.test.mjs` per-file 600 s limit under load) | 1237 tests, **4 fail**: `claim-port.test.mjs` x4 (U6/U7). `capability-plan-lint` and `test-select-mutate` green. |

`loop.test.mjs` needs about 7 minutes: it hit the 600 s per-file limit twice under machine load (once before my edits), and passes 99/99 with `FGOS_TEST_FILE_TIMEOUT_MS=2400000`. An after-the-fact in-between run showed 6 CLI failures from my own change (sealing at the end of a command); fixed before the final numbers above.

`run-tests: ERROR: product code started git ...` is the known false report from fixture `git init` frames, same as U1 and U4.

## Retired or changed tests

None retired. Changed, with the behaviour each still proves:
- `fgos-setup.test.mjs` rebuild x2: compare the persisted view without its cursor and assert the cursor exists. The cursor records which commits were certified; a command now seals after it writes the view, so two reads of one fold differ in it (same ground as U4's `rebuild-determinism` change). Fold and revision equality are kept.
- `fgos-cli-harness.mjs` `corruptEventStore`: a command now seals the open log when it ends, so the helper leaves one fresh event open, turns off the owner push for the commands that follow, then damages it. The four corrupt-log tests (`fgos-post-merge-2` x3, `fgos-read-2` x1) still prove exit 5 and "nothing written".
- `fgos-edit.test.mjs` and `merge-gate.test.mjs`: fixtures (above).

## Delta lines against a69141307

| | + | - |
|---|---|---|
| src, bin (+ census json 13/20) | 194 | 60 |
| test | 269 | 21 |
| docs (spec, manifest) | 8 | 0 |

## Impact analysis

`fgos tool query --capability impact-analysis --status present`: 0 providers, so inactive; blast radius not confirmed by a tool. By `rg`: `endSession` has one caller (`bin/fgos.mjs` session end), `stopGateway` one (`gateway stop`), `runWatch` one (`bin/fgos-runner.mjs`), `landRunnerItem` three (`approve.mjs`, `sync-root.mjs`, `promote-engine.mjs`). Every change to them is a tail trigger or an added field on `merged`.

## Concerns and follow-ups (for owner choice, none done)

1. **Clone without a remote attempts a failing sync at the end of each owner command, and `sync` seals first.** `store.sync` seals every stream before it fails with `event-store-refspec-missing`, and a failed attempt before the push records no `lastPush`, so nothing throttles it. Measured: about 2 ms when nothing is open, about 100 ms when events are open. Idea (RUL104 list, store layer): add "remote configured" to `store.maintenance` facts. A spawn-based check per command costs 18-75 ms, so it was not added here. Meanwhile `eventStore.sync.intervalSec: 0` turns it off.
2. **The facade `sync` waits for the seal lock** (the spec's lock table says opportunistic triggers `try`). The end trigger can wait behind another process's seal or sync. Needs an opportunistic flag on the facade (store layer).
3. **A failed promote is retried only by repeating the same Land (an already-merged branch re-enters the same tail) or a later call.** No verb or sweep promotes, and no consumer registers a `branch` type yet, so production promotion is a no-op today. `promote-engine` and `promote-to-component` members drop the `promotion` field (only `approve` and `sync-root` surface it).
4. A seal failure before Land refuses the land (`event-seal-failed`) rather than skipping. Chosen because nothing is published yet and the promote needs a published project. Reverse if the owner prefers best-effort.
5. A command's end trigger will seal an open log that bit rot damaged, or recovery may drop it; that is the store's recovery rule (spec step 3), reached through a trigger instead of an explicit verb. Store layer, noted only.

## Handoff to U6 and U7

- U6: `landRunnerItem` still calls `prepareMainFgosCheckpoint`/`checkpointMainFgos` (untouched, as asked); delete them with the module. The 4 `claim-port.test.mjs` failures are U6/U7's, as are the `replay`, `compaction` and `checks` ones.
- U7: add the `events` verb names to `EVENT_STORE_LIFECYCLE_VERBS` in `bin/fgos.mjs` (`migrate` stays out: it must not open the store through a trigger). CHANGELOG `[Unreleased]` lines for U5 behaviour: command-boundary seal and owner-only push, `approve`/`sync-root` `promotion` field, Land refusal `event-seal-failed`, `scripts/probe-storytelling-material.mjs` items already listed by U4. The `door.test.mjs` reader census is untouched (U4's 10 remain, owners U6/U7).

Process notes: a detached origin/main worktree and its cargo target dir were created for the classification runs and removed; no background processes left; `.fgos/config.json` restored byte-equal after the absent-file run. Nothing pushed to main.

Status: DONE_WITH_CONCERNS
