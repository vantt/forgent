# p02a fix 2: --fix --only judges the rows the named fixes repair

- `packages/distribution/rust/src/doctor.rs`: `run` now selects rows whose id is in the union of `repairs` of the named fixes (already group-expanded), in registry order, so still one judge call per owner kind. Hook fixes have `repairs == [id]`, so the speed gain stays.
- Same file, owning test `only_runs_just_the_named_fixes...`: fixture `fix-alpha` now repairs `alpha`; asserts a native-only `--only` calls `["fix fix-alpha", "judge alpha"]` and never the bridge, and that `--only fix-beta` (repairs `beta`, a different id) judges `beta` through the bridge only. The group-expansion test expectation for `fix-alpha` follows the new fixture.
- Wording updated in `apps/fgos/src/wiring/doctor/mod.rs`, `setup-doctor-registry.md`, `src/cli/command-registry.mjs` (no fix-id-equals-row-id claim) and the existing `CHANGELOG.md` `--only` line (no second line).

Verification: `cargo test -p fgos-distribution` was NOT run. The sandbox refused cargo, so the change is unproven by execution.

Status: DONE_WITH_CONCERNS
Summary: --fix --only now judges the rows the named fixes repair; cargo tests were not run (sandbox denied cargo).
