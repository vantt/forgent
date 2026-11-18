# Phase 19 — Integration, live run and full gate

Joins the combined tree, proves the outcome once for real on the main checkout, closes the two backlog rows the landing door replaces, and records the result. The only writer of the census, `CHANGELOG.md` and `docs/backlog.md` in this plan.

## Inputs
Step 0: re-grep. All of phases 1-18 must be merged on the tree you start from (`git log --oneline -30`, plan phase table). The blockers (secretary spine, session verb, ops-metrics, read door) must be `done`.
- `docs/backlog.md:22-23`: rows `p-t55xjys4u5` (census refusal) and `p-dkkodseo63` (sandboxed seat cannot run Node tests); status text style `done (main <sha>: <what>; <where proven>)`. `scripts/check-backlog-reconciliation.mjs` reads the rows.
- `CHANGELOG.md:8` (`## [Unreleased]`): existing lines show the style (one bullet per user-visible change).
- `scripts/git-one-door-scan.mjs --root . --write-census` writes `packages/git/contracts/mutation-census.v1.json`; the proof is `test/setup/git-mutation-census.test.mjs`.
- `/home/vantt/projects/forgent/.fgos/runtime/tmp/land-branch.sh` (the script to delete); `rg -n "land-branch" core domains docs/platform src` must already be empty.
- `plans/261118-1045-project-supervisor/plan.md` acceptance criteria 1-10 and "Risks and rollback" (the arming note for `workerSlots.ceiling: 4`).
- `docs/platform/supervision/spec.md` (phase 1): its decision-history section receives the settled decisions.
- Process rules: `/home/vantt/projects/.claude/rules/process-management.md` (track every process you start; stop only your own).

The gateway pass-through of `fgos slots --json` moved to the `{lanes}` shape in phase 16; step 0 confirms it (`rg -n "execution|admin" apps/fgos-gateway/web/src/api/types.ts` near the slots type).

## Footprint
`CHANGELOG.md`, `docs/backlog.md`, `docs/platform/supervision/spec.md`, `packages/git/contracts/mutation-census.v1.json`, `plans/261118-1045-project-supervisor/reports/integration.md`.

## Steps
1. Integrate: on a linked worktree off `origin/main`, merge every phase branch not yet on `main` (merge, no rebase). Generated files conflict: take either side, then regenerate (`node scripts/export-command-selectors.mjs`, `npm run build:skills`); never hand-merge them.
2. Census last: `node scripts/git-one-door-scan.mjs --root . --write-census`; commit only the census file. A census that still differs after a second run is a real finding: stop and report.
3. `CHANGELOG.md` `## [Unreleased]`: one bullet each for `fgos watcher tick` and the third OS timer, the `fgos supervisor` verbs, `fgos land` and its `land.*` config, `fgos slots` now reporting lanes with `workerSlots.ceiling` meaning worker seats per machine (default 4, raise with `fgos config set workerSlots.ceiling`), and the retired work-item slot count.
4. `docs/backlog.md`: set `p-t55xjys4u5` and `p-dkkodseo63` to `done (main <sha>: ...)`, naming the proof (the trunk-only census refusal test; `fgos land` running the gate outside the sandbox). Add the decision narrative to `docs/platform/supervision/spec.md`.
5. Live run (acceptance 8), on the main checkout with `watcher.enabled` on for this project:
   - Land a throwaway `ready` plan (one phase that writes one scratch doc) with `fgos land --paths`. Type nothing after that.
   - Wait for the timer (or one `fgos watcher tick`) to raise `plan-became-ready`, the supervisor to admit it, and its lead to land the phase with `fgos land`.
   - Check: the plan is `done` on `main`, a board line exists, `fgos supervisor queue` is empty, `fgos slots --json` shows free lanes again, no person typed a command.
   - Stop what you started: list `ps` for the supervisor and lead heads you caused, end them through `fgos session stop`, never by pattern kill. Remove the throwaway plan and its doc with one more `fgos land --paths`.
6. Copy `/home/vantt/projects/forgent/.fgos/runtime/tmp/land-branch.sh` to `${TMPDIR:-/tmp}/fgos-work/`, then delete the original (a single named file, no glob, path asserted first).
7. Write `reports/integration.md`: per acceptance criterion 1-10, the command run and its result; the live-run transcript pointers; open questions.

## Verify
- `cargo test --workspace` and `npm test` green (run through `node scripts/run-tests.mjs`; never SIGKILL a run; ask before a second concurrent run).
- `cargo clippy --workspace -- -D warnings`; compile checks `cargo check --workspace --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` where the targets are installed.
- `node scripts/plan-contract-check.mjs --plan plans/261118-1045-project-supervisor` ok.
- `npm run fgos:dev -- slots --json` has `lanes`; `fgos doctor --json` has `watcher-timer` and `supervisor-events-unhandled`.
- `rg -n "countWorkerSlots|hasWorkerSlotRoom" src bin test` and `rg -n "land-branch" core domains docs/platform src` find nothing.
- `node scripts/check-backlog-reconciliation.mjs` passes.

## Rollback
Each earlier phase reverts on its own (plan "Risks and rollback"). For this phase revert the merge commit: the census, changelog and backlog edits go together, the deleted script cannot return from git (it is untracked), so keep a copy in `${TMPDIR:-/tmp}/fgos-work/` until the plan is `done`.
