# Phase 19 — Integration, live run and full gate

Joins the combined tree, writes this repo's landing config, proves the outcome once for real on the main checkout,
closes the backlog row the landing door replaces, and records the result. The only writer of the census,
`CHANGELOG.md`, `docs/backlog.md` and `.fgos/config.yaml` in this plan (and the second writer of `docs/reading-map.md`, after phase 1).

## Inputs
Step 0: re-grep. All of phases 1-18 must be merged on the tree you start from (`git log --oneline -30`, plan phase
table). The blockers (secretary spine, session verb, ops-metrics, read door, owner-question store) must be `done`.
- `docs/backlog.md:22-23`: rows `p-t55xjys4u5` (census refusal) and `p-dkkodseo63` (a sandboxed seat cannot run Node tests; its acceptance is that a seat can, which this plan does not deliver); status text style `done (main <sha>: <what>; <where proven>)`. `scripts/check-backlog-reconciliation.mjs` reads the rows. New rows get ids from `fgos identity mint backlog`.
- `CHANGELOG.md:8` (`## [Unreleased]`): existing lines show the style.
- `scripts/git-one-door-scan.mjs --root . --write-census` writes `packages/git/contracts/mutation-census.v1.json`; the proof is `test/setup/git-mutation-census.test.mjs`.
- `/home/vantt/projects/forgent/.fgos/runtime/tmp/land-branch.sh`: generated files `:11`, regeneration `:18-20`, the gate `:43-47` (seven test files plus `"$@"`, `cargo fmt --all --check` when a `.rs` file changed, the one-door scan's "0 undeclared"); the script to delete.
- Project config: `.fgos/config.yaml` (tracked, project scope, `docs/platform/config/spec.md` §3); write door `fgos config set <path> <flow value> --reason <why>` (`src/cli/command-registry.mjs:1258`). The pre-commit config check runs on it (`.githooks/pre-commit:464`).
- Activation: AGENTS.md "Legacy-Node CLI Ownership Boundary" (plain `fgos`, the timer unit and the heads run the activated release, not the working tree).
- `plans/261118-1045-project-supervisor/plan.md` acceptance criteria 1-10 and "Risks and rollback".
- `docs/platform/supervision/spec.md` (phase 1): its decision-history section receives the settled decisions.
- Process rules: `/home/vantt/projects/.claude/rules/process-management.md` (track every process you start; stop only your own).

The gateway pass-through of `fgos slots --json` moved to the `{lanes}` shape in phase 16; step 0 confirms it.

## Footprint
`CHANGELOG.md`, `docs/backlog.md`, `docs/platform/supervision/spec.md`, `docs/reading-map.md`, `.fgos/config.yaml`, `packages/git/contracts/mutation-census.v1.json`, `plans/261118-1045-project-supervisor/reports/integration.md`.

## Steps
1. Integrate: on a linked worktree off `origin/main`, merge every phase branch not yet on `main` (merge, no rebase). Generated files conflict: take either side, then regenerate (`node scripts/export-command-selectors.mjs`, `npm run build:skills`); never hand-merge them.
2. Census last: `node scripts/git-one-door-scan.mjs --root . --write-census`; commit only the census file. A census that still differs after a second run is a real finding: stop and report.
3. `CHANGELOG.md` `## [Unreleased]`: one bullet each for `fgos watcher tick` and the third OS timer, the `fgos supervisor` verbs, `fgos land` and its `land.*` config (gates run unconfined as the owner), `fgos request result` and `fgos session stop`, `fgos slots` reporting lanes with `workerSlots.ceiling` now global-only and meaning worker seats per machine (default 4, raise with `fgos config set workerSlots.ceiling <n>`), and the retired work-item slot count.
4. `docs/backlog.md`: set `p-t55xjys4u5` to `done (main <sha>: ...)` naming the proof (the census-drift hook test). Leave `p-dkkodseo63` open with a note: landing gates now run Node tests outside the sandbox (`fgos land --test`), a seat still cannot. Add three rows (minted ids): confined landing gates (PS-19 option b); move `landRunnerItem` (`src/runner/merge.mjs:870`) onto the landing use case (L10 debt); and, if phase 11 step 0 found the ops-metrics plan-status source reads only local `main`, read the fetched trunk there. Add the decision narrative to `docs/platform/supervision/spec.md` and remove the word "planned" that phase 1 put on the supervision paths in `docs/reading-map.md`.
5. Live run (acceptance 8), on the main checkout:
   1. Build, stage and activate the combined tree on the main checkout (the repo's release steps; AGENTS.md), then verify through the installed shim: `fgos doctor --json` has `active-release-matches-checkout` passing and the four supervision rows.
   2. Landing config, one bootstrap commit (no gate exists yet, so not through `fgos land`): `fgos config set land.gates '[...]' --reason ...` with, from land-branch.sh: `{run: "node scripts/run-tests.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/rust-host/command-routes.test.mjs test/cli/fgos-manifest.test.mjs {tests}", when: ["src/**","bin/**","apps/**","packages/**","scripts/**","test/**"]}`, `{run: "node scripts/run-tests.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs", when: ["docs/**","**/*.md","core/**","domains/**"]}`, `{run: "node scripts/run-tests.mjs test/scripts/mailbox-behaviour-v7n.test.mjs", when: ["packages/mailbox/**","apps/fgos/src/wiring/mailbox*"]}`, `{run: "cargo fmt --all --check", when: ["**/*.rs"]}`, the one-door scan (step 0 checks its exit code reflects "0 undeclared"; if not, wrap it so it does), and `{run: "node scripts/plan-contract-check.mjs --all", when: ["plans/**"]}`; `fgos config set land.regenerate '{run: "node scripts/export-command-selectors.mjs && node scripts/git-one-door-scan.mjs --root . --write-census", files: [packages/git/contracts/mutation-census.v1.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-manifest.json]}' --reason ...`. `fgos config check` passes; commit `.fgos/config.yaml` alone and push. Step 0 adjusts the `when` globs to the landed test file names.
   3. `fgos config set watcher.enabled true` (global), `fgos doctor --fix` installs `watcher-tick`; `fgos doctor` shows `watcher-timer` passing.
   4. Land a throwaway `ready` plan (one phase that writes one scratch doc) with `fgos land --paths`. Type nothing after that.
   5. Wait for the timer to raise `plan-became-ready`, the supervisor to admit it, and its lead to land the phase with `fgos land`.
   6. Check: the plan is `done` on `main`, a board line exists, `fgos supervisor queue` is empty, the supervisor ended its own session after `done`, `fgos slots --json` shows free lanes again, no person typed a command.
   7. Stop what you started: list the supervisor and lead heads you caused, end any still live through `fgos session stop`, never by pattern kill. Remove the throwaway plan and its doc with one more `fgos land --paths`. Set `watcher.enabled` back to what the owner wants and run `fgos doctor --fix`.
6. Copy `/home/vantt/projects/forgent/.fgos/runtime/tmp/land-branch.sh` to `${TMPDIR:-/tmp}/fgos-work/`, then delete the original (a single named file, no glob, path asserted first).
7. Write `reports/integration.md`: per acceptance criterion 1-10, the command run and its result; the live-run transcript pointers; open questions.

## Verify
- `cargo test --workspace` and `npm test` green (run through `node scripts/run-tests.mjs`; never SIGKILL a run; ask before a second concurrent run).
- `cargo clippy --workspace -- -D warnings`; compile checks `cargo check --workspace --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` where the targets are installed.
- `node scripts/plan-contract-check.mjs --plan plans/261118-1045-project-supervisor` ok.
- `fgos slots --json` has `lanes`; `fgos doctor --json` has `watcher-timer`, `supervisor-events-unhandled`, `supervision-pace` and `land-gates-configured` (passing).
- `rg -n "countWorkerSlots|hasWorkerSlotRoom" src bin test` and `rg -n "land-branch" core domains docs/platform src` find nothing.
- `node scripts/check-backlog-reconciliation.mjs` passes.

## Rollback
Each earlier phase reverts on its own (plan "Risks and rollback"). For this phase revert the merge commit: the census,
changelog and backlog edits go together; revert the `.fgos/config.yaml` commit to drop the landing config (every
`fgos land` then refuses `land-gate-missing`, which doctor names). The deleted script cannot return from git (it is
untracked), so keep a copy in `${TMPDIR:-/tmp}/fgos-work/` until the plan is `done`.
