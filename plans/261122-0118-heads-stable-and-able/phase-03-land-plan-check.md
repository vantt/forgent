# Phase 3: The land door runs the plan check

Capability: `code:implement`.

Closes `p-erwx4t7gl6` and the check half of `p-ekqtvofdoh`.

## Inputs

- `packages/supervision/rust/src/land.rs`: `LandCommand`, `run_gates` (today only `{tests}` is replaced), `changed_paths`,
  `land_paths`. Gates run unconfined as the owner, in the main checkout for a paths land, so the check's cargo build works
  there although a head sandbox is read-only.
- `.fgos/config.yaml` `land.gates` (the project's gates; `core/config-standard/land.yaml` keeps `gates: []`, because the
  plan check ships only in the fgOS repo).
- `scripts/plan-contract-check.mjs` (`checkPlanDir`, `activeOverlaps`, `main`), `test/scripts/plan-contract-check.test.mjs`.
- `core/skills/_shared/plan-contract.md` sections 2 and 5.
- Today `261118-1341-s6a-execution-tier-rust` and `261120-0625-work-data-model` are both `running` and overlap; their
  leads must still land phase-table updates.

## Footprint

`packages/supervision/rust/src/land.rs`, `packages/supervision/rust/tests/land.rs`, `scripts/plan-contract-check.mjs`,
`test/scripts/plan-contract-check.test.mjs`, `core/skills/_shared/plan-contract.md`, `.agents/skills/**`,
`plugins/fgOS/skills/**` (regenerated only), `.fgos/config.yaml`.

## Steps

1. Placeholder: `run_gates` also replaces `{plans}` with the quoted plan directories (`plans/<name>`) that have a changed
   path under them and whose `plans/<name>/plan.md` exists in the landed tree. Leave out `plans/backlog`,
   `plans/discussions`, `plans/reports` and `plans/handoffs`, which hold no `plan.md`. One replacement beside `{tests}`;
   no new gate type.
2. Check: `--plan` may be given more than once. A `running` plan without `lead` becomes an error (today a warning); the
   contract already says `lead` is written in the same commit as `status: running`. Cross-plan overlap stays an error when
   the checked plan is `ready`. For a plan already `running` it becomes a warning, because admission already decided it
   and the plan's own leads must keep landing.
3. Gate: through `fgos config patch`, add to `land.gates` the entry `node scripts/plan-contract-check.mjs {plans}`,
   expanded so each directory is passed as `--plan <dir>`. Pick the expansion form in step 1 (for example a `{plans}`
   that renders `--plan a --plan b`) and document it in the gate's `@fgos:doc`. Its `when` is `plans/*/plan.md` and
   `plans/*/phase-*.md`. Record the reason in the config's `@fgos:why`.
4. Contract text: `plan-contract.md` sections 2 and 5 say `lead` is required with `running`, that the land door runs the
   check on every landed plan, and how overlap reads for `ready` and for `running`. Run `npm run build:skills` to
   regenerate the renders.
5. Tests: `plan-contract-check.test.mjs` covers a running plan without `lead` (error), several `--plan` values, and
   overlap read as an error when ready and a warning when running. `packages/supervision/rust/tests/land.rs` covers a
   paths land whose gate gets `{plans}` with the changed plan dirs: a failing gate refuses with
   `land-gate-failed` and leaves main unchanged. The test gate is a script that fails when it is handed the plan. The
   real check's behavior is owned by the Node test, not repeated here.

## Verify

`node scripts/run-tests.mjs test/scripts/plan-contract-check.test.mjs` and `cargo test -p fgos-supervision --test land`
pass. `node scripts/plan-contract-check.mjs --plan plans/261118-1341-s6a-execution-tier-rust` exits 0, with the overlap
shown as a warning.

## Rollback

Revert the phase commit. Removing the gate entry alone also restores the old land behavior.
