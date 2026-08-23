# tsk-3df — plan.md

Mode: small

Flag count: 0 of the 10 hard-gate/complexity flags apply (no auth,
authorization, data model, audit/security, external system, public
contract, cross-platform, existing-covered-behavior risk, weak-proof
area, or multi-domain concern) — two files, one direct task with a small
second piece (a doc citation fix) riding along. No `fgos-routing` pass ran
this session (discovery's `clear` verdict routed straight here), so this
lane is derived directly from the Mode-gate thresholds
(`fgos-routing`'s "Mode gate" section) rather than carried forward from an
earlier hand-off.

## Approach

No split — one honest piece with a small second file. Evidence is from
this item's own discovery round (`RESEARCH.md`, Round 1); no
`exploring`/CONTEXT.md exists for this item because discovery returned
`clear` and skipped it.

Chosen path, in order:

1. **Add a CLI-level regression test** to `test/cli/fgos-merge.test.mjs`,
   next to the surviving guard test at line 1123
   (`'sync-root never reports outcome "synced"...'`), proving
   `sync-root.mjs`'s guard (`sync-root.mjs:147-167`) also catches
   `lock-lost-mid-merge` — the one outcome that (a) falls through to the
   guard today (RESEARCH.md Round 1, `approve.mjs` gives it a named
   branch but `sync-root.mjs` does not) and (b) has zero existing test
   coverage of the guard behavior. Reuses `makeDriftedRoot`'s `verify`
   option with the lock-overwriter script already proven at
   `test/runner/merge.test.mjs:533` (same `FGOS_HEARTBEAT_INTERVAL_MS`
   + lock-file-overwrite technique, adapted to the CLI harness). New
   assertions also read `stateView(cwd).frictions` and assert
   `errorClass === 'sync-root-unhandled-outcome'` — the one claim the
   item's own submitted text says is untested today, and which the
   surviving `merge-blocked-other-item` test at line 1123 does not check
   either.
2. **Correct the stale citation** in
   `docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/CONTEXT.md`
   lines 42 and 47 — replace `test/cli/fgos.test.mjs:6374` with the
   test's real current location. This is the "final pass" tsk-1cp's own
   D3 already anticipated ("once tsk-4hj's real `main` merge commit SHA
   is known, replacing the branch-relative citations with the
   merged-commit ones") and which never happened after `fc59e7d9` landed
   on `main`. Line 39 (`bin/fgos.mjs:3404`) is left as a historical
   citation of where the guard *was* at the time tsk-1cp was written —
   not corrected to the current `src/verbs/merge/sync-root.mjs:147-167`
   location, since D1/D3 scope tsk-1cp's own record to that
   branch-relative snapshot; only the demonstrably-wrong,
   file-does-not-exist test citation is in scope for this item's fix.

Order: (1) before (2) — the doc fix cites the new test's own final line
number, so the test must exist first.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| New CLI test | light — additive only, reuses an existing, already-proven fixture technique (`test/runner/merge.test.mjs:533`) and existing harness helper (`makeDriftedRoot`) | the test itself: run `node --test test/cli/fgos-merge.test.mjs` and confirm the new test passes and the file's other tests still pass (no shared state clobbered) |
| Doc citation edit | none — prose only, no code/test path | a plain re-read of the corrected lines after the edit |

Impact-analysis posture: not checked — this item touches no production
code (`src/`, `bin/`) and no code symbols GitNexus would index; the two
touched files are a test file and a historical record doc. Same posture
tsk-1cp itself recorded for its own doc-only scope.

## Shape

Concrete cases the new test proves:

- **The unhandled case that actually matters today**: `mergeRunnerItem`
  returns `lock-lost-mid-merge` for a `sync-root` call → `sync-root`
  reports `outcome: 'blocked'`, `reason: 'lock-lost-mid-merge'` (never
  `'synced'`), and records `frictions[id][...].errorClass ===
  'sync-root-unhandled-outcome'` — the exact assertion missing from the
  surviving `merge-blocked-other-item` test.
- **No data loss**: mirrors the existing sibling test's own git-state
  assertions — `MERGE_HEAD`/staged changes must survive untouched (the
  guard's whole point, per `merge.mjs:1347-1352`'s own comment, is that
  tearing up state belonging to a new lock holder would cause data loss)
  and the root item's own `status` must stay `doing` (never silently
  touched by a blocked sync).
- **No false decision record**: no `decision` event with a "merged" text
  gets appended for `id` — same check the line-1123 test already runs,
  reused here for the new outcome.

## Outstanding questions

None
