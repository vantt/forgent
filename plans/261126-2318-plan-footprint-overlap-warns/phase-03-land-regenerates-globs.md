# Phase 3: land regenerates declared globs

## Inputs

- `plan.md`: Outcome, Facts "Land regeneration", acceptance criterion 5, risk "build:skills writes more".
- `packages/supervision/rust/src/land.rs`: the conflict exemption (`:1215-1257`) and `regenerate` (`:1491-1540`).
- `packages/supervision/rust/tests/land.rs`: `a_conflicting_census_lands_regenerated` (`:321`),
  `a_conflict_outside_the_declared_files_refuses_before_any_candidate_is_prepared` (`:349`),
  `a_branch_edit_of_a_regenerated_file_outside_the_footprint_refuses` (`:1010`).
- `core/config-schema/land.schema.yaml` (`regenerate.files`).
- `packages/write-scope/src/lib.rs`: `canonicalize_all`, `matches`.

## Files this phase may write

- `packages/supervision/rust/src/land.rs`
- `packages/supervision/rust/tests/land.rs`
- `core/config-schema/land.schema.yaml`

## Steps

1. Schema: `regenerate.files` description becomes "Repo-relative files or globs the command rewrites; a glob covers
   every file it matches in the candidate before or after the run." No new key.
2. Conflict exemption: a conflicted path is declared when `fgos_write_scope::matches(path, &regen.files)` is true
   (an exact path still matches itself). Canonicalize `files` once when the land starts; an entry the package
   refuses is `land-regenerate-failed` naming it.
3. `regenerate`: the files compared are the union of (a) the candidate commit's tracked paths matching an entry and
   (b) the files under the candidate worktree matching an entry after the run. Each is compared and restored as
   today (a file new after the run is removed from the worktree; a file the run deleted is written back). Read the
   tree through the existing land Git ports; add no new Git door. Keep exact-path entries on today's path so the
   census behaviour does not change.
4. Measure, and write the answer into this plan's `reports/` as `land-regenerate-skill-surfaces.md`: on a clean
   checkout run `npm run build:skills` twice and list every file it rewrites. Name which of them are pure output
   (safe to declare) and which are hand-written with a generated block (`AGENTS.md`: never declare). Phase 6 uses
   this list for the config.
5. Tests, in `tests/land.rs`: "two branches that change a file under a declared glob land one after the other,
   the second regenerated" (declared `gen/**`, a run command that rewrites it deterministically); extend the
   existing outside-declared test with a glob entry that does not cover the conflicted path (still
   `land-conflict-aborted`). The census test stays as the exact-path proof.

## Verify

`cargo test -p fgos-supervision --test land` and `cargo fmt --all --check` pass; `node scripts/run-tests.mjs
test/architecture.test.mjs` passes.

## Rollback

`git revert` the phase commit. A config that already lists globs then exempts nothing (a glob is a literal path that
never exists), so a revert never breaks a land; it only brings back skill-surface conflicts.
