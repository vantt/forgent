# HARDEN T6 phase lead report: one case reader, one run-directory door, durable ledger writes

Branch `harden/t6-p03-case-reader-path-doors`, from `b6e474218`. Lead decision taken: the path door is a leaf under `src/runner/execution/`.

## What changed

- New leaf `src/runner/execution/case-run-paths.mjs`: `isCaseId`, `runsRoot`, `runDirOf` (refuses a non-case id as `invalid-case-id`), `gateAnswerFile` (moved from `handoff-refs.mjs`). Imports only `node:path` and `RunnerConfigError`. Manifest row added.
- Every builder calls it: `store.mjs`, `case-lock.mjs` (`workflowRunDirOf` deleted), `case-runtime.mjs`, `case-admission-port.mjs` (`caseDirOf`, confinement check, `caseEnvOf` now uses `isCaseId`), `case-bindings.mjs` (`bindingsDir` from `runsRoot`), `propose.mjs`, `case-verbs.mjs`, `workflow-case-checks.mjs`, `holder-lock-checks.mjs`, `scripts/backfill-unit-summaries.mjs`. `rg "'workflow-runs'" src/workflow src/setup scripts` is empty.
- One reader `readCaseProjection(mainRoot, id, { retryTail })` in `case-projection.mjs`; `projectCase` takes the folded `state` and `guide` (no second fold); `guideOfEvents` replaces the two guide-only `projectCase(...).guide` reads in `runner.mjs`. Copies deleted in `case-close.mjs`, `case-admission-port.mjs`, `runner.mjs` (`reread`); `case-verbs`, `case-inherit`, `propose` import it from its home.
- `retryTail` lives in `readWorkflowEvents` (one retry loop, three reads, 25 ms wait, only `workflow-ledger-unterminated`); the admission port's own loop is gone.
- `stepSubjectDigest`, `unitRunsOf`, `playbookSubjectDigests` moved from `unit-handoff.mjs` to `ref-digests.mjs`; projection no longer imports `unit-handoff`.
- Durable writes: first ledger line by `installOnce`; `writeDurably` finishes a short write or refuses `ledger-short-write`; gate answer file by `replaceDurably`; `fsyncDirectory` exported once, `fsyncDir` deleted; `uniqueTmpTag` import gone; `CASE_EVENT_KINDS` deleted.

## Red then green

Red (before the fix): `case-run-paths.test.mjs` (module missing), `case-projection.test.mjs` (no `readCaseProjection`), store-ledger id refusal (`../x` accepted) and short write (unterminated tail). Green after: 3 new tests in `case-projection.test.mjs` (one reader equals the fold, `retryTail` meets an append in flight once and reads whole, three reads then give up, corrupt middle line not retried), 2 in `workflow-store-ledger.test.mjs` (id refusal across read/create/lock, short write finished or refused), 2 in the new `case-run-paths.test.mjs`. One existing test updated: the "only the store names the ledger" scan now also looks for `runDirOf`, and its slice ends at the exported `fsyncDirectory`. No test retired.

Fold equality: the old and new reader gave identical hashes of `{events, state, projection}` for all 54 real ledgers under the main checkout `.fgos/workflow-runs` (read-only); every real id passes the id rule (0 errors).

## Net size

src + scripts: +146 / -159 = Node -13 (estimate was -60). The gap: the short-write loop (+8), the leaf with its header (+27), the moved digest block (counts both sides), `retryTail` in the store (+13). Tests +88 / -... (+5 test files touched). The budget for the Case ledger group is carried by later phases; reported, not padded.

## Gate

Focused 582 tests (all `test/workflow`, setup checks, handoff-refs, run-case-admission, unit-summary, architecture, doc-health, citation drift, enumerator guard, CLI workflow, windows-doctor): 0 fail. One-door scan 0 undeclared; census regenerated.

## Cross-lane

`holder-lock-checks.mjs` (one line) overlaps the doctor lane's `src/setup/**` work: rebase is a one-line conflict at worst. Prune (P12) can use `runsRoot` and `readCaseProjection`.

## Items for other phases

- P04: `case-runtime.mjs` keeps `writeText`/`writeJsonAtomic` (one door over `replaceDurably`).
- P07: the guard read at `propose.mjs` (`findInherit`) still calls `readCaseProjection` and discards it; removed with that phase.
