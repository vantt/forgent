---
phase: 2
title: Attribute .fgos writes to the test run
status: done
---

# Phase 2: Attribute .fgos writes to the test run

Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-lvxt3vde7k-land-gate-live-writes/DISCUSSION.md` (outcome,
  constraints, acceptance) and backlog row
  `plans/backlog/p-427ymxp33q-land-gate-fails-when-live-heads-write-into-fgos-during-the-test-run.md`.
- `plan.md` of this directory: Outcome, Acceptance criteria (phase 2), Non-goals, Risks.
- `scripts/run-tests.mjs`: `buildTestArgv` (around line 100), `SENSITIVE_FGOS_FILES`,
  `LIVE_FGOS_DIRS`, `snapshotFgos`, `diffFgosSnapshots` (around lines 422-515), and
  `runSelectedTests` (around lines 515-720): where the spy log is created
  (`GIT_SPAWN_SPY_LOG_ENV`), the snapshot before the spawn, and the leak report after it.
- `test/helpers/git-spawn-spy.mjs`: the pattern to copy (preload, `NODE_OPTIONS` spread
  around line 162, `module.syncBuiltinESMExports()` around line 159, JSONL log).
- `test/scripts/run-tests.test.mjs`: the leak-check section (around lines 805-995),
  including the stopgap test "the leak check ignores live runtime directories other sessions
  write but s..." that this phase replaces.
- Commit `b4581336d` (the stopgap being replaced).

## Files it may write

- `scripts/lib/fgos-write-witness.mjs` (new)
- `scripts/run-tests.mjs`
- `test/scripts/run-tests.test.mjs`
- `plans/261124-1945-run-tests-fgos-leak-check/plan.md` (Progress lines only)

## Steps

1. Write `scripts/lib/fgos-write-witness.mjs`, a preload of the same shape as
   `git-spawn-spy.mjs`. It reads two env values the runner sets: the log file path and the
   checkout's `.fgos` directory (both under the `FGOS_TEST_` prefix, so `buildTestEnv`
   keeps them). On load it appends one `{"kind":"load","pid":...}` line. It wraps the
   `fs`, `fs/promises` and callback forms of every call that creates, changes or removes a
   path: `writeFile`, `appendFile`, `open`/`openSync` with a write, append or create flag,
   `createWriteStream`, `mkdir`, `rename` (both paths), `copyFile`/`cp` (destination),
   `rm`, `rmdir`, `unlink`, `truncate`, `symlink`, `link`, `utimes`. For a target whose
   resolved absolute path is inside the `.fgos` directory, and only the first time this
   process touches that path, it records the path relative to `.fgos` and its state just
   before the call (`exists`, `size`, `mtimeMs`), then runs the real call. It calls
   `module.syncBuiltinESMExports()` and adds itself to `NODE_OPTIONS` exactly as the spy does.
   It never throws into the caller: a failed log append is swallowed after one stderr line.
2. In `scripts/run-tests.mjs`, add the witness to `buildTestArgv` as a third `--import`,
   create its log next to the spy log in `runSelectedTests`, and set the two env values on
   `childEnv`. The `.fgos` directory is `path.join(cwd, '.fgos')` resolved through
   `realpath` when it exists.
3. Replace the snapshot walk: delete `LIVE_FGOS_DIRS` and the whole-store walk of
   `snapshotFgos`. After the run, read the witness log; for each recorded path, take the
   earliest `before` state across processes, stat the path now, and classify it as added
   (did not exist, exists now), deleted (existed, gone now), or modified (size or mtime
   differ). A path inside a recorded directory that `rm`/`rename` removed counts under that
   directory. Skip `SENSITIVE_FGOS_FILES` by base name and `allowedFgosMutations` by path, as
   today. Keep `result.fgosDiff` as `{added, modified, deleted, leaked}` and the existing
   log lines unchanged. Keep `diffFgosSnapshots` only if it still serves this comparison;
   otherwise remove it and its test cases in the same change (L10), naming the case that now
   owns each behavior.
4. Fail closed: when at least one test file ran and the witness log holds no `load` line,
   set `result.fgosDiff.leaked = true`, log
   `run-tests: ERROR: the .fgos write witness did not load in the test processes ...`
   naming `scripts/lib/fgos-write-witness.mjs`, and fail the run with status 1. A run
   refused before any test started (the existing `supervisor.failure()` path) is not a
   witness failure.
5. In `test/scripts/run-tests.test.mjs`, in the existing leak-check section, replace the
   stopgap test and adjust the cases that wrote straight from a fake `spawn` as if they were
   the test. New and adjusted cases, each titled by behavior, with no plan or phase ids:
   - a write made during the run by a process that did not load the witness (the fake
     `spawn` writing directly from the runner process) into `runtime/watcher`,
     `assignments/<run>`, `locks`, `observe/friction` and a new top-level `other/` leaves
     `leaked` false and status 0 (AC1);
   - a real `node` child started with the argv from `buildTestArgv` and the env the runner
     builds, which writes a file into `.fgos/runtime/x` and one into `.fgos/other/`, fails
     the run with status 1 and names both; a child that writes a file and removes it again
     passes (AC2);
   - a run whose spawned process never loads the witness fails with the witness message
     (AC3).
   Keep the secrets-exclusion and `allowedFgosMutations` cases, retargeted at the new
   comparison. Do not add a second leak section anywhere else (AC4).
6. Do not commit the census. The land door regenerates
   `packages/git/contracts/mutation-census.v1.json` before its gates (`land.regenerate` in
   `.fgos/config.yaml`), and a census edit on the branch is outside this footprint. To run
   the census test in Verify, regenerate it in the worktree last, on the final tree
   (`node scripts/git-one-door-scan.mjs --write-census`), run Verify, then restore it with
   `git -C <worktree> checkout -- packages/git/contracts/mutation-census.v1.json`. Never
   edit the JSON by hand.
7. Run the validating proof point from plan.md Risks once: on a quiet tree, compare the
   witness result of the full suite (`npm test`) with a whole-store walk taken before and
   after the same run by a throwaway script under `.fgos/runtime/tmp/` (not committed).
   Record the outcome as one Progress line in `plan.md`. If the walk shows a test-made
   change the witness missed, stop and report it with the writer named; do not land.
   Owed after landing (owner, 2026-11-25, q-vfansuhg7y): the unconfined `lead:SUPERVISOR`
   session runs this step on a quiet tree and writes the Progress line; scope is one full
   `npm test` plus the throwaway walk script, no code changes, and a miss becomes a new
   backlog item rather than a fix here.

## Verify

```bash
rg -n LIVE_FGOS_DIRS scripts test            # prints nothing (AC5)
node scripts/run-tests.mjs test/scripts/run-tests.test.mjs test/setup/git-mutation-census.test.mjs
npm test
```

Run the two run-tests commands with the census regenerated in the worktree (step 6), then
restore it.

Pass: `rg` prints nothing; both run-tests commands exit 0 with no `.fgos` leak line; the
leak-check section holds the AC1-AC3 cases; the Progress line for step 7 is written.

## Rollback

Revert the phase's commit(s). That restores `LIVE_FGOS_DIRS` from `b4581336d` and the walk;
the land of the revert regenerates the census.
