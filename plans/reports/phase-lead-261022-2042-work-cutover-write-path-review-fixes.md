# Work cutover write path: review A fixes

Branch `work/es-cutover`. Commits: `754c48803` (conflicts, throw rule), `507791319` (approve guard), `9fda6dfe5` (low items), `6ba172d03` (stale comments, census).

## Finding to change to proof

| Finding | Change | Owning proof |
|---|---|---|
| H1a prior and release treat a conflicted event as durable | `appliedEvents(events, view)` in `src/state/replay.mjs`. The `beforeGate` lookup in `moveWorkOnce` (`src/state/store.mjs`) and `readAppliedEvents` (used by `releaseRecordedLand`, `src/runner/merge.mjs`) read applied events only. `approve.mjs` needed no separate change: its release takes the event from `moveWork`, which is a fresh append (a conflict cannot be written there after M1) or the filtered prior. | `test/event-store/work-conflicts.test.mjs`: "a conflicted event is not among the applied events..." |
| H1b conflicts have no reader | Conflict records now carry `id`. `conflictsFor(view, id)`. `fgos show <id>` returns `conflicts`. Doctor row `work-recorded-conflicts` (warns, never fails, uses the `doctorWorkView` per-run memo). CHANGELOG, how-to row, show field doc, distribution spec and setup-doctor-registry row. No resolve command. | `work-conflicts.test.mjs` (`conflictsFor`), `test/cli/fgos-read-3.test.mjs` (empty shape), `test/setup/checks.test.mjs` (registered id), `test/setup/registrations.test.mjs` (doc agreement) |
| M1 throw rule | The fold tracks `streamHeads` and throws `work-replay-precondition` when the writer saw every earlier event; otherwise records. `VIEW_SCHEMA_VERSION` 7. Spec §12 sentence replaced with a dated note; bullet in the cutover clarifications. | `work-conflicts.test.mjs`: seen-everything throws, unseen records, 3-origin cascade still records and converges |
| M2 approve fault guard | `isStatusWriteFault` (hot-lock timeout, catch-up busy, seq recovery conflict, ENOSPC/EIO/EROFS/EACCES/EMFILE). `event-store-acked-effects-incomplete` is success with the acknowledged event. Env switch and `testForceLockTimeoutId` removed. Dead `EventLogError` comment fixed. | `test/verbs/merge/approve.test.mjs` (classification); `test/cli/fgos-approve-6.test.mjs` (real held state mutex via `test/helpers/hold-state-in-child.mjs`). The root-into-main fault-record test was retired: the fault-record fields are covered by the verify-only test, and the `mergedSha`/`mergedInto` plumbing by the success-path tests. |
| L1 step precondition | `movesStatus` is `work.move` only (`work.stage` is not appendable). | `work-gate.test.mjs` staged-events test now includes `work.step` |
| L2 foreign cache test | Renamed to what it proves. Cascade test reads with `cachePath` before and after fetching a foreign ref. | `work-gate.test.mjs`, `work-conflicts.test.mjs` |
| L3 porting write root | Porting passed the caller's directory as a write root. `withConsumerState` takes `extraRoots`; porting passes `[]`. No production caller names a tracked directory, so this closes a latent grant. | `work-gate.test.mjs`: "a consumer that passes no extra roots..." |
| L4 hot-lock warning | Prints `releaseError.code`. | `test/state/hot-lock-tx.test.mjs` |
| L5 result codes | Added `event-store-rebuild-raced`, `event-store-full-read-under-state`, `event-store-incomplete-history`, `work-replay-precondition`. | `cargo test -p fgos-event-store` green (the Rust enum is generated from the file) |
| L6 sweep | `candidates.length` is inside the `try`. | covered by merge suites |
| L7 static regex test | Removed; census half kept. Owner of the runtime refusal: the "full Work readers refuse under the mutex" test in `work-gate.test.mjs`. Removed with it: the `.seq/.origin/.h` scan and the claim-port scan (no other test covers those; the review accepted this). | n/a |
| Stale comments | Cleaned in `store.mjs`, `frontier.mjs`, `impact.mjs`, `awaiting-context.mjs`, `tool-registry.mjs`, `graph-harness.mjs`, `drift-status.mjs`. `approve.mjs:76` is my own rewritten comment and names nothing retired. | n/a |

## Verification

- Owning tests: 92 pass (work-conflicts, work-gate, staging-returns, hot-lock-tx, approve, checks).
- `test/state test/event-store test/cli test/intake test/config`: 2600 pass, 0 fail.
- `test/setup`: 919 pass, 0 fail (the doc-agreement test failed once until the new row was added to `setup-doctor-registry.md` and `distribution.md`).
- `test/runner/merge*`, `test/direct/merge-gate.test.mjs`, `test/verbs/merge`: 148 pass.
- `cargo test -p fgos-event-store`: all green.
- Census: `--write-census` run, `--check` shows only main's 5 unresolved-binary sites.

## Not changed

- M3 performance findings (controller measures first).
- Porting: a deferred or missing foreign porting event makes `readState` throw `event-store-incomplete-history`, which refuses every `addPorting` and `movePorting` (and `listPorting`) until that event arrives. Left as is.

## Notes for the merge with review B

- I added one token to `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (the new doctor row id), a file review B's lead owns. The registry agreement test fails without it. Expect a trivial merge on that line.
- The CHANGELOG gained two lines after the Land-release entry; review B edits wording elsewhere in the same section.
- `bin/fgos.mjs` changes: the show `conflicts` field plus its import, and removal of the env-switch block.

## Unresolved questions

- Who resolves recorded conflicts, and through which verb (controller is asking the owner)?
