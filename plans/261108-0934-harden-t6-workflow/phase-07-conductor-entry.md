---
phase: 07
title: "Conductor entry: propose reads each finished ledger once and digests only a case that can be inherited, one glob engine and one write-path normalizer, one slice-shape authority, dead names gone"
status: pending
depends_on: [03]
parallel: "wave 2, with 04, 05, 06, 08, 09"
effort: ~1d
net_size: "Node −70 / Rust 0 / tests −50 (estimate)"
---

# Phase 07 — Conductor entry (W-1, simplicity 10, simplicity 11, dead names)

## Context

Arbitration §1 Conductor entry ("`checkManifest` is the one slice-shape authority … their re-checks and the codes `slice-invalid`/`slice-duplicate` go"; "one glob engine and one write-path normalizer, in `write-scope.mjs` (T5 leaf; `globsMeet` moves there, `globMatches` calls it; one shared escape set checked by both test files first)"; "`findInherit` reads each ledger once, skips non-case directories, and computes digests only for a case that passes the four events-only checks"), §2.1 W-1 (High, measured: `findInherit` 1 836 of 2 223 ms), simplicity 10, 11. `propose.mjs` ≤ 640; no function over 120. P01 already removed the slice `gate` key; P06 moves `orderSlices`' loop (one-liner in this file).

Code read on `595faa273`:
- W-1: `createProposePorts.findInherit` `propose.mjs:603-612` walks every directory of `.fgos/workflow-runs` (`:588-598`, `.bindings` included), calls `readCaseProjection` as a discarded guard (`:606`), then `inheritFrom` (`case-inherit.mjs:36-58`) reads it again (`:39`) and digests every completed step's reports (`playbookSubjectDigests`, now in `ref-digests.mjs` after P03). 45 of 54 real ledgers have no `case.opened`.
- Simplicity 10: `globsMeet`/`segmentsMeet`/`segmentRegex` `propose-classify.mjs:31-62` (`globsMeet` exported `:47`) vs `segmentRegex` `write-scope.mjs:102`, `globMatches` `:102-122`; normalizers `normalizeWrite` `propose-classify.mjs:119` and `canonicalizeWriteEntry` `write-scope.mjs:25`, both called in sequence at `propose-validate.mjs:72-73`. Escape sets differ (`u` flag; `$ { }`).
- Simplicity 11: `checkManifest` `propose.mjs:73-122`; re-checks `checkSlice` `propose-frame.mjs:43-59` and `:109-115`; `checkSliceShape` `propose-validate.mjs:103-111` and duplicates `:144-149` (`slice-invalid`, `slice-duplicate`).
- Dead or over-exported (simplicity 13, this lane's files): `defaultTable` alias `propose-classify.mjs:113`, `loadSliceTable`, `planCaseSlug`, `CASE_PLACEHOLDER`, `readPassRigor`, `createProposePorts`, `FORBIDDEN_WRITE_ROOTS`, `TEST_SCAN_LIMITS`, `inheritableMilestones` (lead keeps an export only where its test is the owning proof).

Not reproduced at arbitration, so **red first**: simplicity 10 escape-set difference (a pattern with `$`, `{`, `}` and a non-ASCII segment fed to both engines, recorded before the move), simplicity 11 (structure: recorded count of refusal sites).

## Requirements

1. **W-1.** Delete the guard at `propose.mjs:606`; the scan skips `.bindings` and any directory without `events.jsonl`; `inheritFrom` folds events, runs the four events-only checks (closed, guide digest, request digest, base commit) and computes digests only for a case that passes them. Inherit result unchanged for every real ledger (proof: the existing inherit cases plus one "a non-case directory is skipped").
2. **One glob engine.** `globsMeet` (with `segmentsMeet`, `segmentRegex`) moves to `write-scope.mjs`; `globMatches` becomes a call to it; one escape set, settled by a test in both `test/runner/dispatch/write-scope.test.mjs` and `test/workflow/propose-classify.test.mjs` before the move. `normalizeWrite` becomes the thin view over `canonicalizeWriteEntry`; `propose-validate.mjs:72-73` calls one.
3. **One slice-shape authority.** `checkManifest` stays; `checkSlice` and `checkSliceShape` and the duplicate checks go; `proposeFrame` and `validateProposal` trust their input (only `propose.mjs` calls them in production); codes `slice-invalid`/`slice-duplicate` disappear from those two modules.
4. Dead names per the list above; `propose.mjs` ≤ 640, no function over 120.

## Files

**Create:** none.

**Modify:** `src/workflow/propose.mjs`, `propose-classify.mjs`, `propose-frame.mjs`, `propose-validate.mjs`, `case-inherit.mjs`, `src/runner/dispatch/write-scope.mjs` (T5 leaf: announce on the board), census.

Tests: `test/workflow/propose.test.mjs`, `propose-classify.test.mjs`, `propose-frame.test.mjs`, `propose-validate.test.mjs`, `test/runner/dispatch/write-scope.test.mjs`, `test/cli/fgos-workflow-propose.test.mjs` (wiring, unchanged).

**Delete:** the guard read; second glob engine and normalizer; two re-checks with their codes; dead exports.

**Tests to retire:**
- `propose-frame.test.mjs` and `propose-validate.test.mjs` malformed-slice refusal groups: behaviour moved; owner `propose.test.mjs` `checkManifest` cases (each retired title listed with the `checkManifest` case that covers it; a missing one is added there first).
- Glob cases duplicated across the two files after the move: owner `write-scope.test.mjs`; `propose-classify.test.mjs` keeps only classification cases.

**Retire gate:** the retired-title → owner table is written in the phase report and reviewed by the big lead before the deleting commit (plan acceptance 6).

**Cross-lane one-liners:** none (P06 touches this lane's `RIGOR_ORDER` import lines and `orderSlices`; rebase).

## Net size

Node: W-1 +1, glob −24, re-checks −38, dead −10 → about −70. Tests: re-check groups −60, escape set +10 → about −50.

## Steps

1. Red: escape-set record; W-1 timing before (`time fgos workflow propose …` on fg-server2, load noted).
2. W-1.
3. Escape set test in both files; glob move; normalizer.
4. Slice re-checks out; retire tests with owners.
5. Dead names; budgets; census.

## Validation (focused)

- FR `test/workflow/propose.test.mjs test/workflow/propose-classify.test.mjs test/workflow/propose-frame.test.mjs test/workflow/propose-validate.test.mjs test/runner/dispatch/write-scope.test.mjs test/workflow/conductor-case.test.mjs test/cli/fgos-workflow-propose.test.mjs`
- Timing after: `fgos workflow propose --slices <one slice> --plan <plan> --json` on the dev host, 5 runs, p50 and load noted (target ≈ 0.3 s; P15 measures the activated release).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The merged glob engine changes a dispatch write-scope match (T5 path) | M × H | Escape-set test first in both files; `write-scope.test.mjs` unchanged and green |
| Removing re-checks lets a malformed slice reach the frame | L × M | Only `propose.mjs` calls them, after `checkManifest`; a test calling them with raw input moves to `checkManifest` |
| Inherit finds a different case | L × H | Same four checks, same order of directories (newest first) |

## Rollback

Revert; no on-disk change.

## Done when

`propose` measured faster; one glob engine; one shape authority; landed with smoke `fgos workflow propose` on fg-server2's checkout (55 ledgers) and in a scratch JS project; guide section written.

## Lead brief essentials

`write-scope.mjs` is a T5 leaf used by dispatch: settle the escape set first. All plan.md lead rules apply.
