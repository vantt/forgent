# Phase 3: Wire update and re-render on declare

Capability: `code:implement`

## Inputs

- `plans/261124-1433-authority-declare-update/plan.md` (Approach: update shape, views re-rendered on declare).
- The phase 1 commit (`DeclareRequest.update`, the refusal codes) and the phase 2 commit (`AuthorityRequest.tree`,
  `root` in the answers).
- `apps/fgos/src/wiring/authority.rs`: `project_declare`, `Action::Declare`, `answer`, `render`, and the projection
  tests `declare_projects_…` and `declare_refuses_…`.
- `src/cli/command-registry.mjs`, the `authority` entry (`invoke` string, examples, flags).
- `scripts/export-command-selectors.mjs` (regenerates the `packages/host-runtime/contracts/command-*.json` files).

## Files it writes

`apps/fgos/src/wiring/authority.rs`, `apps/fgos/tests/authority.rs`, `src/cli/command-registry.mjs`, the generated
`packages/host-runtime/contracts/command-manifest.json`, `command-routes.json` and `command-route-annotations.json`
(regenerated only, never hand-edited), and `test/cli/subcommand-flag-drift.test.mjs` (only if it lists authority's
flags by hand).

## Steps

1. Projection: `declare` accepts `--update` (a switch). `Action::Declare` carries `update: bool`, and it passes into
   `DeclareRequest.update`. Extend the existing projection test to cover the switch. Do not add a second test.
2. Re-render after declare: in `answer`, after a successful declare in a tree that carries `OWN_CONTRACT` (the rule
   `model_dir` uses), call `write_views(tree)`. Add `"views": {"written": [...], "skipped": [...]}` to the declare
   answer, using `view_refs`. If the render fails after the row was written, the error says the row was written to
   `<files>` and the views were not, and names `fgos authority render` as the repair. In a project without
   `OWN_CONTRACT`, declare renders nothing and the answer has no `views`.
3. Wiring test in `apps/fgos/tests/authority.rs`: on a seeded repository, run the host binary with
   `authority declare --kind component --update --row '{"id":"<a real component>","status":"<another status>"}'`.
   The answer carries the row and the view written, and a following `authority render --check --json` answers
   `"drift": []`. This is the one wiring proof of the update through the CLI. The case matrix stays in the crate.
4. `src/cli/command-registry.mjs`: add `[--update]` to the declare shape in `invoke`, one example
   (`fgos authority declare --kind component --update --row <file>`), and a description clause ("…add, move or
   update a model row…"). Run `node scripts/export-command-selectors.mjs` to regenerate the contracts, then
   `node scripts/export-command-selectors.mjs --check`.
5. Update the module doc comment at the top of `authority.rs` to name `--update` and the re-render.

## Verify

`cargo test -p fgos --test authority`, `cargo test -p fgos wiring::authority`, and
`node scripts/export-command-selectors.mjs --check` pass. So do
`node --test test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs`.

## Rollback

Revert this phase's commit, then rerun `node scripts/export-command-selectors.mjs` to restore the generated
contracts.
