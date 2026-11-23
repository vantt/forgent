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
