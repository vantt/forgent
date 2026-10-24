---
title: "WORK lane U3 lead report: porting on the project:porting stream"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (on U2 tip f02382319)
status: DONE_WITH_CONCERNS
---

# U3: porting stream

## Changes

- `src/state/porting-store.mjs`: `addPorting` / `movePorting` / `listPorting` / `rebuild` / `initStore` keep their signatures. Writes go through `withConsumerState` (stream `project:porting`, resource `porting-events`), the gate Work uses; no second door. Exports `foldPortingEvents` (pure fold) and `rebuildFromStore` (registry rebuild port, same shape as `store.mjs`).
- Q-W2 = (b): view and cursor are written only to the registry cache `.fgos/cache/porting-state.json` (new `FGOS_FILE.PORTING_STATE`, same `cache/` bucket as Work's view, gitignored). `dir` now only names the clone. Nothing is written beside the caller's `dir`. `docs/distillery/state/porting/state.json` is untouched (the cutover commit deletes it).
- Config comes from the trusted main root (`prepareWorkStore` / gate default, as after the Work gate fix).
- `packages/work-state/contracts/porting-event-streams.v1.json` (`porting.add`, `porting.move`, `sealOnWrite: false`); `consumers.v1.json` row `porting` with `cachePath` equal to the API's view location; `package.json` `files` ships the contract.
- `src/verbs/events/{export,migrate}.mjs`: they called `listPorting` on a scratch directory holding a legacy log. That reader no longer exists, so they now parse the frozen log with `parseEventLines` and fold with `foldPortingEvents` (same reducer, same log order). Not in the brief; needed so the export and migrate parity tests keep passing.
- `docs/architecture-manifest.json`: rows for `consumer-event-gate.mjs` and `work-event-store.mjs` (both `infra`). They were missing since U1, so `test/architecture.test.mjs` failed on main-of-branch (file list and import direction); porting-store importing them made it one more violation.
- Census regenerated with `--write-census` (porting-store, fgos-file-registry, export, migrate hashed). Check still reports the same 5 main-owned `unresolved-binary` sites; I added none.

## Owning proofs

- `test/state/porting-store.test.mjs` (now loads, 15/15): one new test proves `git status --porcelain` stays empty after add+move in a fixture repo with `dir` = a tracked directory (`docs/distillery/state`), nothing is written beside it, and view plus cursor sit in the untracked cache; `initStore` and the stale-cache / crash-recovery tests retargeted to the cache path; the cross-process race tests unchanged and green.
- `test/state/identity-before-lock.test.mjs`: green (its 3 failures were this unit).
- Wiring retargets: `consumers.test` (registry matches manifest), `verbs.test` (rebuild now reports `work` and `porting`), `export-legacy-parity`, `rollback-export` (fold the exported porting log with `foldPortingEvents`; behaviour proved is unchanged).

## Counts (focused: `test/state test/event-store test/cli test/intake test/config`)

| | tests | pass | fail | todo |
|---|---|---|---|---|
| before (U2 report) | 2722 | 2631 | 25 | 65 |
| after | 2736 | 2648 | **22** | 65 |

The 22: `replay.test.mjs` 18 (U7), `events-compaction.test.mjs` 3 (U6), and **1 new: `door.test.mjs` "dormant reader census"**. The brief target (<= 21) is missed by exactly that one.

## Needed from U4 (I did not touch `door.test.mjs`)

`porting-store.mjs` no longer imports `readEvents`, so the declared reader census must drop its line `'src/state/porting-store.mjs: import readEvents: retired-event': 1`. That is the intended census shrink. With it, the focused count is 21.

## Src / test delta (vs U2 tip)

| | + | - |
|---|---|---|
| src (porting-store, registry, export, migrate) | 98 | 150 |
| test | 58 | 28 |
| contracts, package.json, manifest | 28 | 0 |
| census (generated) | 9 | 9 |

## Impact analysis

`fgos tool query` has no present provider for the blast radius; callers cross-checked with `rg`. Public API users: `distill.mjs` (`movePorting`, `listPorting`) and `migrate-porting-state-backfill.mjs` (all four): signatures unchanged. `foldPortingEvents` / `rebuildFromStore` are new exports (verbs, rebuild verb).

## Porting cross-clone conflict gap (reported, not built)

Porting events carry no precondition. The CAS (`expectedStatus`, duplicate id) is checked only against the writer's own view at write time, and the fold applies every event:

- `porting.move` sets `status = to` unconditionally (`from` is ignored). Machine A moves `p` candidate to planned while B moves it candidate to rejected: both apply, the later event in the deterministic order wins, and nothing is recorded as a conflict.
- Two clones that each `porting.add` the same id: the second event replaces the whole record, so it also resets a status the other clone already advanced back to `candidate`.

Work closes the same class with recorded preconditions and recorded conflicts in `foldEvents` (spec §12). Porting would need the same two pieces (a precondition in `prepareEvents`, a conflict list in its fold). Left as a separate item for the owner to pick; in practice porting rows change rarely and mostly on one machine.

## Deferrals / notes

- The cache is write-only for porting (`listPorting` and the gate read the stream, never the cache), same as the reference. Fine for a small stream; add a cursor-checked cache read only if porting history grows.
- `docs/specs/distillery.md:136-138`, the CHANGELOG line, and the `porting-log.md` header sentence ("state layer `docs/distillery/state/porting/`") are for U7/U9; not edited here.
- `migrate-porting-state-backfill.mjs` and `distill.mjs` still pass `docs/distillery/state` as `dir`; that works (it only locates the clone) and writes nothing there.

## Unresolved questions

None blocking.
