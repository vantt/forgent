# Phase 1: Prove which reds remain at main

## Inputs

- `plan.md` of this plan, section "Facts at base".
- Logs on fg-server2: `.fgos/runtime/tmp/keeper-final-gate/npm-test.log`, `npm-reds-recheck.log`, `cargo-test.log`.
- `scripts/run-tests.mjs` (stages the addon and host and sets `FGOS_HOST_BIN`; `node --test` alone does not).

## Footprint

- `plans/261127-0829-red-tests-before-release/reports/phase-01/**`

## Steps

1. Create a clean linked worktree of main at its current tip (`fgos worktree` or `git worktree add`), and run
   `npm ci` in it. Write the tip sha to `reports/phase-01/tip.txt`.
2. Unconfined, in that worktree, run:
   `node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/workflow/guide-schema.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/terminal-crash-matrix.test.mjs > reports/phase-01/listed-files.log 2>&1`.
3. In the same worktree, run the four cargo tests that were red, each appended to `reports/phase-01/cargo-listed.log`:
   - `cargo test -p fgos --bin fgos observe_query`
   - `cargo test -p fgos-component-authority --test model_checks`
   - `cargo test -p fgos-config --test authoring_equivalence`
   - `cargo test -p fgos-config --test registry_defaults`
4. Write `reports/phase-01/verdict.md` with one row per test that failed: file, test name, error headline, and
   which phase owns it (2 = credential sources, 3 = guide schema, `outside` = any other file). Name each listed file
   that passed. If the run did not start (for example `git-addon-unavailable`, or a read-only build directory), write
   that and stop. That is an environment failure, not a red.
5. Record the earlier recheck, which ran test files without the staged addon, as friction:
   `fgos friction record ... --ref plan:261127-0829-red-tests-before-release`.

## Verify

`reports/phase-01/verdict.md` exists, names the tip sha, and every listed file has a pass or fail line taken from a
run that started (its log shows the staged host, with no `git-addon-unavailable`).

## Rollback

Delete `reports/phase-01/` and remove the worktree with `fgos worktree remove`.
