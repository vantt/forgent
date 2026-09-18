# Cell 6.6 — executing.scoped-subtask mutating helper

Status: done
Date opened: 2026-08-31
Date closed: 2026-08-31

## Scope

Implement step-06-work-attached-team-adoption.md §3 Slice 6.4's 3rd
acceptance criterion for `scoped-subtask` (driver refuses undeclared/
overlapping-file touches), currently unimplemented — see
`current-cell.md` for full contract, confirmed-gap summary, and
design guidance.

## Confirmed gap

Confirmed by reading `src/runner/dispatch/operation-choice.mjs:1893-1902`
before the change: the shared
`if (operation === 'scoped-subtask' || operation === 'fix-verify-red')`
branch only checked `runResult.confidence === 'verified'`. There was no
`expectedFiles`/footprint concept anywhere in `assignment.mjs` or
`operation-choice.mjs` (confirmed by reading `buildAssignment` in full and
grepping the interpretation branch) — a helper could touch any file at all
and still resolve `scoped-subtask-verified` as long as the run classified
as `verified`. This left Slice 6.4's 3rd acceptance bullet ("driver refuses
to proceed if helper touched undeclared or overlapping files") fully
unimplemented, not partially — real missing functionality, not a small gap
fill.

## Design decision

- **Field name**: `expectedFiles` — array of repo-relative path strings.
  Threaded through `buildAssignment` (`src/runner/dispatch/assignment.mjs`)
  the same way `contextRefs`/`expectedOutputs` already are: accepted as a
  parameter, filtered to non-empty strings, frozen, and always present on
  the returned Assignment object (defaults to `[]` when not declared). It
  is persisted verbatim into `assignment.json` by `assignment-runner.mjs`'s
  existing "assignment.json is the immutable input" contract — no change
  needed there.
- **No glob support**: `expectedFiles` entries are matched by exact
  repo-relative string equality only (path-separator-normalized). The task
  contract's own example mentioned "path strings/globs", but none of the
  acceptance criteria require glob matching, and the codebase has no
  existing glob-matching utility or `minimatch`-family dependency to reuse.
  Adding one would be new machinery beyond what Slice 6.4 requires (KISS /
  do-not-over-build). Documented here as an explicit scope cut, not a
  silent omission — a future cell can add glob support if a real caller
  needs it.
- **Comparison logic** (`interpretAssignmentRunResult`'s new
  `scoped-subtask` branch in `operation-choice.mjs`):
  1. Keep the existing `confidence !== 'verified'` refusal first
     (`scoped-subtask-requires-verified-evidence`), unchanged.
  2. Read the declared footprint from `choice.expectedFiles ??
     choice.assignment.expectedFiles`. If empty/absent, skip straight to
     the verified-confidence-only outcome (fallback below).
  3. If declared: compare `runResult.evidence.changedFiles` (the real,
     already dirty-before-subtracted evidence
     `assignment-runner.mjs`'s `computeChangedFiles` produces — confirmed
     by reading its full RunResult construction, `assignment-runner.mjs`
     lines ~854-937) against the declared set. Any changed file not in the
     declared set -> refuse with `scoped-subtask-undeclared-files`
     (extra field `undeclaredFiles` on the interpreted result for
     diagnostics).
  4. "Overlaps the caller's own in-flight edits": compare the *declared*
     set against the run's `dirtyBefore` snapshot (files already dirty
     before the helper ran). `dirtyBefore` is written to `evidence.json` on
     disk by `assignment-runner.mjs` but is **not** part of the in-memory
     `RunResult.evidence` shape returned to callers (confirmed by reading
     the `runResult` object literal — only `gitBefore`/`gitAfter`/
     `changedFiles`/`artifacts`/`tests` are there). Added a small read-only
     helper, `getEvidenceDirtyBefore(runResult, repoRoot)`, that reuses the
     existing `consumingRunDirFor` trust-resolution helper (the same one
     `getReportText` uses to locate a run's own directory) to read
     `evidence.json`'s `dirtyBefore` field back off disk. Any declared file
     that was already dirty before the run started -> refuse with
     `scoped-subtask-overlaps-caller-edits` (extra field
     `overlappingFiles`). Missing/unreadable `evidence.json` returns `[]`
     (no overlap detected) rather than refusing — absence of evidence must
     never itself cause a false refusal.
  5. If neither check fires, return `scoped-subtask-verified` (same
     reason string as before, so existing callers checking that string see
     no change).
- **Fallback rule**: when `expectedFiles` was never declared on the choice
  or its assignment, behavior is byte-identical to before this change
  (verified-confidence-only). Declaration is opt-in, not retroactively
  mandatory — this is called out explicitly in
  `current-cell.md`'s Design guidance as required, to avoid silently
  breaking existing scoped-subtask callers that don't declare a footprint.
- **`fix-verify-red` split**: the shared `if (... || ...)` branch was split
  into two independent `if` blocks. `fix-verify-red`'s block is untouched
  byte-for-byte in behavior (same confidence check, same reason strings)
  — confirmed by a regression test that also proves it ignores
  `expectedFiles`/`changedFiles` fields even when present on the
  choice/runResult (see below), so a future accidental re-merge of the two
  branches would be caught.

## Diff summary

- `src/runner/dispatch/assignment.mjs`: `buildAssignment` gains an
  `expectedFiles = []` parameter; the assignment object gains a frozen
  `expectedFiles` field (filtered to non-empty strings), placed next to
  `contextRefs`/`expectedOutputs`. JSDoc updated.
- `src/runner/dispatch/operation-choice.mjs`:
  - `executeDriverOperationChoice`'s `buildAssignment` call now threads
    `expectedFiles: choice.expectedFiles` (mirrors the existing
    `contextRefs: choice.contextRefs` line).
  - Added `normalizeRelPath` and `getEvidenceDirtyBefore` helpers near
    `getReportText`/`consumingRunDirFor`.
  - Split the `scoped-subtask || fix-verify-red` branch in
    `interpretAssignmentRunResult` into two `if` blocks; `fix-verify-red`'s
    block is unchanged; `scoped-subtask`'s block adds the footprint checks
    described above.
- `test/runner/operation-choice.test.mjs`: added 8 new tests covering
  declaration/persistence, positive (declared-only), two negative paths
  (undeclared file, overlap-with-dirty-before), the no-declaration
  fallback, the `fix-verify-red` non-regression (including the
  footprint-fields-present-but-ignored case), and one end-to-end test that
  drives real `buildAssignment` + `executeAssignment` +
  `interpretAssignmentRunResult` through a fake mutating executor in a real
  git repo for both the declared-only and undeclared-file cases.

## New tests

All added to `test/runner/operation-choice.test.mjs`, inserted directly
after the pre-existing scoped-subtask confidence test:

1. `Step 06 Cell 6.6 buildAssignment declares expectedFiles for
   scoped-subtask and persists it into assignment.json; omitted
   declaration defaults to empty array` — acceptance (a).
2. `Step 06 Cell 6.6 scoped-subtask refuses when helper touches an
   undeclared file` — acceptance (c), unit-level.
3. `Step 06 Cell 6.6 scoped-subtask resolves verified when helper touches
   only declared files` — acceptance (b), unit-level.
4. `Step 06 Cell 6.6 scoped-subtask refuses when the declared footprint
   overlaps the caller's in-flight edits` — acceptance (d).
5. `Step 06 Cell 6.6 scoped-subtask with no expectedFiles declared falls
   back to verified-confidence-only behavior` — fallback rule regression.
6. `Step 06 Cell 6.6 fix-verify-red confidence check is unchanged after
   splitting the shared scoped-subtask/fix-verify-red branch` —
   acceptance (e).
7. `Step 06 Cell 6.6 end-to-end: executeAssignment +
   interpretAssignmentRunResult refuse a real undeclared-file mutation and
   allow a fully-declared one` — acceptance (b)+(c) through the real
   evidence pipeline (real git repo, real `computeChangedFiles`, real
   `assignment.json`), not just a synthetic `runResult` shape.

## Regression battery

Ran, all green:

```text
node --test test/runner/operation-choice.test.mjs   -> 130 pass / 0 fail
node --test test/runner/loop.test.mjs
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/e2e/runner-loop.test.mjs
node --test test/cli/fgos-stage.test.mjs
```

Combined run: `tests 304 / pass 304 / fail 0`.

## Findings (Reviewer + Red-team, combined pass)

Verdict: safe to close, no Doer fix round needed. No Critical/High
findings. Independently re-ran full battery (didn't trust the Doer's
numbers): 304/304, matches exactly. Adversarial checklist, all verified
by direct code trace:

1. `expectedFiles` worker-influence — not possible; threaded into
   `buildAssignment` before `executeAssignment` spawns the worker,
   frozen, part of the pre-existing immutable `assignment.json` contract.
2. `getEvidenceDirtyBefore` fail-open (`[]` on missing/malformed
   evidence.json) — reachable in principle but provably unreachable for
   scoped-subtask in practice: `confidence === 'verified'` on this path
   guarantees `evidence.json` was already written (unguarded
   `fs.writeFileSync` happens before the `RunResult` carrying that
   confidence is even constructed).
3. `normalizeRelPath` equivalence gaps (`./x`, leading `/`, case,
   `../`) — real but every mismatch direction pushes toward MORE
   refusals, never fewer (trusted/controlled side is git-canonical or
   driver-only). No bypass vector; worst case is a false-positive refusal
   for a sloppy declaration.
4. **M1 (Medium, accepted residual, not a regression from this diff)**:
   dirty-before subtraction (inherited Cell 6.2 semantics, out of this
   cell's scope) means a file already dirty before the run, mutated by
   the helper WITHOUT being declared, is invisible to BOTH new checks —
   excluded from `changedFiles` so the undeclared-file check never sees
   it, and not in `declaredSet` so the overlap check never sees it
   either. Consciously accepted boundary; a future cell touching
   scoped-subtask footprint semantics should address this alongside
   Cell 6.2's broader dirty-before-persistence gap.
5. `canAdvanceEdge` confirmed `false` in all three new return branches —
   never advances Work.
6. 8 new tests confirmed to exercise real code: 6 direct unit calls on
   exported pure functions, 1 writes a real `evidence.json` and drives
   the real `getEvidenceDirtyBefore` file-read (via the `stdoutLog`
   fallback branch of `consumingRunDirFor`, not the production
   `runId`-derived branch — informational-only minor gap), 1 genuine
   end-to-end (`buildAssignment` → `executeAssignment`, real spawned
   script mutating files in a real git repo → `interpretAssignmentRunResult`)
   covering both declared-only-pass and undeclared-refusal.
7. `fix-verify-red` confirmed byte-identical post-split by direct read;
   new regression test also proves `expectedFiles`/`changedFiles` fields
   present-but-ignored on a `fix-verify-red` choice have zero effect.

**Non-defect observation**: no caller in `src/` currently populates
`choice.expectedFiles` for `scoped-subtask` anywhere (grep-confirmed) —
`chooseStageOperation`'s executing-stage branch doesn't set it. The
mechanism is fully built and tested but INERT until a future driver
caller actually declares a footprint. Matches this cell's scope (build
the check, not wire a caller) — flagged so the record is explicit: this
means Step 6's `scoped-subtask` operation is not yet "used" in the sense
of step-06 §8's Adoption Completion Criteria (which wants a real
Work-attached operation actually exercised), only made safe for future
use.

## Status

done — implementation, tests, and full regression battery green,
independently verified by a separate combined Reviewer+Red-team pass (no
Critical/High findings; one Medium accepted residual, M1, inherited from
Cell 6.2's scope; mechanism built but not yet wired to a real caller). No
files outside `src/runner/dispatch/assignment.mjs`,
`src/runner/dispatch/operation-choice.mjs`, and
`test/runner/operation-choice.test.mjs` were touched, consistent with the
cell's May-edit list. `src/runner/loop.mjs`,
`src/runner/dispatch/assignment-runner.mjs`, `.fgos/config.json`, and all
real Work items were left untouched.
