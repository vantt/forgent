# Phase 10b: Fill names, primitives and count on every door row, and fix the guard's latent notes

## Why now
Phase 10 (3aa23ccc5) taught the guard `names`, `primitives` and allowed `count`, and the crate learned the fields in
888bb3563. No row writes them yet, because the land gates use the activated host. Release
`sha256:9e5ae72c…` (main 728212c1f, carries 888bb3563) is activated (supervisor, 2026-11-24 02:15), so rows may now
carry the fields.

## Inputs
- `test/architecture.test.mjs`: `checkDoors`, `doorCodeText`, `doorText`, `blankRustLiterals`, `NAMED_DOOR_DEBT`, the
  "door check:" synthetic tests.
- `packages/component-authority/model/doors/*.yaml` (83 rows) and `docs/platform/component-authority/spec.md` §2.4
  (read only; the spec is not in this phase's footprint).
- `reports/unit-261124-0015-p10-result.md` (what phase 10 did and left).

## Files it may write
packages/component-authority/model/doors/, test/architecture.test.mjs

## Execution
`--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports; no other provider.

## Steps
1. Fix the guard's latent notes from the phase 10 review, each with the smallest change in `test/architecture.test.mjs`:
   - a Rust char literal such as `'"'` is read as the start of a string and blanks code after it;
   - string contents are not blanked for files other than JS and Rust (`.sh`, `.ps1`, others the guard reads);
   - a `pattern` and a `primitive` (or `name`) that hit the same token on one line count twice; count a token once;
   - an allowed `count` above the real total is never reported; report it as stale (like the ratchet's below-ceiling
     message) so counts track the code;
   - the stale `cặp cổng` header comment near `test/architecture.test.mjs:13`.
   Extend the existing "door check:" synthetic tests for each fixed behaviour (one case each, same file).
2. For every door row whose job is a mechanism (not a pure path/retired-name row), add:
   - `names`: the canonical function/type name(s) of the door and known aliases, as plain identifiers;
   - `primitives`: regex sources of the calls or imports that do the job (e.g. `renameSync` + `fsyncSync`,
     `process\.kill`, `/proc/`, `Command::new`), only where they do not already appear as a `pattern`. Move a
     `pattern` that is really a call or name into `primitives`/`names` when that is the clearer home; keep `patterns`
     only for literal path or text patterns.
   Rows whose only job is "this retired name never comes back" keep `patterns` and need no `names`/`primitives`.
3. Set `count` on each `allowed` entry (object form `{path, count, reason}`) to today's total match count in that file.
4. Keep every `debt` entry, `retiredBy` and the `NAMED_DOOR_DEBT` list as they are (phase 12 retires debt). A new match
   that a new `primitive` finds outside `allowed`/`debt` is not added as debt: narrow the primitive, or, if the file
   really does the door's job, stop and report it (file, line, row) instead of widening.

## Verify
- `node scripts/run-tests.mjs test/architecture.test.mjs` passes except the A4 case that is red on main too
  (name it in the report with its failure line).
- `fgos authority model --json` loads every row (the activated crate accepts the fields).
- `rg -L '^(names|primitives):' packages/component-authority/model/doors` lists only rows the report names as
  path-only or retired-name rows, each with one line why.

## Report
Write the unit report into this plan's `reports/` directory: rows filled, rows left path-only, latent notes fixed,
test output tail, and anything stopped per step 4.

## Rollback
Revert the phase commit; the rows lose the fields and the guard returns to phase 10's behaviour.

## Unit 2 (after the first unit, 2026-11-24 02:30)
The first unit fixed the five guard notes and added their tests (step 1) but could not run node, so it left the rows
alone and settled `blocked`; nothing was committed. Its diff is `reports/p10b-guard-fixes.patch`; the lead ran
`node --test test/architecture.test.mjs` on it with the activated host: 93/94 pass, the only failure is A4 (red on main).
Units cannot run node. So unit 2:
1. `git apply plans/261121-2110-component-authority-doors/reports/p10b-guard-fixes.patch` (step 1 as it stands).
2. Does step 2 only: fill `names` and `primitives` on every mechanism row, reading the allowed and debt files with
   `rg` so each name/primitive matches only inside the row's `allowed` and `debt` files (check every new primitive with
   `rg` over `src bin packages core domains apps scripts` and narrow it until it does). No `count` yet.
3. Lists in the report every row left path-only with one line why.
The lead then runs the guard, measures each allowed file's total and hands the counts (step 3) to a third unit.

## Unit 3 (counts, 2026-11-24 02:50)
Unit 2 landed on branch `component-authority-doors/p10b2` (366f4c362): the guard fixes, `names` on 13 rows, no
`primitives` (every candidate matched outside the row's files; its report lists them for phase 12). The lead ran
`node --test test/architecture.test.mjs` on it: 93/94, only A4 (red on main). The lead then measured every allowed
file's total: `reports/p10b-allowed-counts.md` (389 rows: row file, allowed path, count). Unit 3, in the same worktree:
1. For each table row, turn the matching `allowed` entry of that row file into object form and set `count` to the
   table's number; keep an existing `reason`. A glob entry (path with `*`) gets no `count` (one count cannot fit many
   files). An allowed entry absent from the table gets no `count`.
2. Change nothing else.
The lead reruns the guard; a count that is off fails it with the exact number.
