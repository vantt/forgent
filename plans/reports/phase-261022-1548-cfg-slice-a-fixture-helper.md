# Phase report: config fixture helper (YAML config slice A, phase 01)

Branch `cfg/slice-a-fixtures`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-a-fixtures`. Not pushed, not merged.
impact-analysis: inactive (0 providers registered; skipped per the gate).

## Result
- `test/helpers/config-fixture.mjs`: `projectConfigPath`, `globalConfigPath`, `writeProjectConfig`, `writeGlobalConfig`, `writeRawProjectConfig`, `writeRawGlobalConfig`. Object writers call product `writeSharedConfig`; raw writers write exact text. One owning test: `test/helpers/config-fixture.test.mjs` (2 cases).
- 101 test files now use the helper. Census before: 121 files mention `config.json`, 69 files / 166 call lines write it, 9 files use product writers, 29 read call lines (not converted). After: 78 files mention it (reads, assertions, git fixtures), 0 hand writes.
- Guard (idea I1): `test/architecture.test.mjs` "config has one test door" plus its sample-case test (+2 test() calls). It reads the `shape`/`code` views of `lexSource`, finds write/append* calls whose first two args name `config.json` (or a name bound to such a path in the same block), ignores reads, comments, strings, other file names. Proven red with a temporary violation in `test/state/gate-bypass.test.mjs` (removed, not committed).
- Commits, one per batch: helper+shared helpers; setup; runner; cli+e2e; rest of tree; guard; clone-list re-key.

## Known exceptions (guard cannot or should not see)
- `test/e2e/coexistence-canary.test.mjs` writes the retired `.bee` tool's own `config.json`: excluded by the guard regex, not an fgOS config.
- `test/git/native-load.test.mjs:338` writes inside a script held in a string and run by a child process (cannot import the helper); the guard is blind to string contents by design.

## Deviations from the plan text
- `test/suite-baseline.json` `knownClones` regenerated (59 to 56 groups): converted clone pairs in `checks-doctor-config` / `checks` changed body hash, so the duplicate-body guard failed. sha/files/tests/wallSeconds left as they were.
- `test/setup/*` local helpers `writeConfig` (run-supervisor-checks) and `writeProjectConfig` (confinement-doctor-checks) removed as dead after conversion; `shared-config-file.test.mjs` "reads the shared file directly" uses the raw writer with `JSON.stringify` so the reader proof stays independent of the product writer.
- `run-some.mjs` named in the brief did not exist at its path; wrote an equivalent from `scripts/run-tests.mjs` (`buildTestEnv`, `buildTestArgv`) under `.fgos/runtime/tmp/`.

## Proof
- Per batch: narrow runs of every changed file plus users of changed helpers, green except the pre-existing failure below.
- Full `npm test` (CARGO_BUILD_JOBS=4, 602 files, 8179 test() calls): 8833 tests, 8719 pass, 18 fail. None touches config writes:
  - `codex's cli-bypass invocation ...` (test/runner/dispatch.test.mjs): `pool-unusable ... no enabled account of pool "openai" holds a "codex" login store`; reads the machine's real config. Also fails at the first batch commit, before any runner file was edited, and its source is untouched by this branch.
  - 17 in `test/rust-host/fgctl-init-download-sources.test.mjs` and `test/rust-host/fgctl-upgrade.test.mjs`: `git repository read refused: trusted-hooks-permissions ... git-empty-hooks must have mode 0500` / `untrusted-driver-directory ... mode 0775`. Those files and the Rust host they run are identical to main (`git diff main -- test/rust-host` empty); not rerun on a main checkout (shared main left untouched), so "also fails on main" is inferred, not measured. Umask here is 002; rerun under 022 still fails.
- The suite's duplicate-body guard failed in the first full run (18 clone pairs, cause above); after the baseline re-key `suiteReport` returns status 0.

## Unresolved
- Board log line to TEST and board lane row (plan step 1) not done: not in this brief; owner/controller to post.
- Read sites of `config.json` (30 lines) remain hand-built paths; Slice C.
