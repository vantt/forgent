# Fix report: CI full-suite regression + entrypoint-guard bug (Slice 1)

Branch: `fix/ci-full-suite-and-entrypoint-guard` (worktree `.claude/worktrees/ci-full-suite-fix`, off `main@16a7900d`)

Scope: Slice 1 only (TI-01, TI-02, TI-02b). Slice 2 (TI-03/TI-04, `test-select-compare.mjs`/`test-select-mutate.mjs`) is **held** — the parallel session on `fgw/phase3-completion` is actively editing exactly those two files (last commit 13 min before this task started). Editing them concurrently risks a real conflict, so Slice 2 was not started this run.

## Root causes

**TI-01 — CI ran zero tests on every OS.** `test-results/` was removed from git (already gitignored) with no step re-creating it. `node --test --test-reporter-destination=test-results/full.xml` opens that path for writing at run start and crashes (`ENOENT`, exit 7) before any test runs — a ~1s "green" run. Reproduced locally byte-for-byte (see Commands below).

**TI-02 — Windows (and any URL-escaped path) silently ran nothing.** `import.meta.url === \`file://${process.argv[1]}\`` compares a percent-encoded file URL against a raw path. They never match when the path needs encoding — always on Windows (`file:///D:/...` vs `file://D:\...`), and on any OS when the path contains a space or other reserved char. When the guard never fires, the whole CLI body never runs and the process exits 0 having done nothing. Found in 19 scripts (`grep -rn 'file://\${process.argv\[1\]}' scripts/*.mjs`).

**TI-02b — Marker lied about completion.** `write-test-marker.mjs` defaulted `exitCode` to `0` and CI never passed a real value; `completed` only checked `jobStatus !== 'cancelled'`. A crash before any test ran, or a run with zero reported cases, still wrote `completed: true, exitCode: 0`.

## Fix summary (3 commits)

1. **`fix(ci): create test-results dir before writing junit output`** — `mkdir -p test-results` folded into the same `run:` block as `npm test` / the related job's test-select-run-plan invocation (not a separate step — kept atomic with the exit-code capture added in the same edit). `shell: bash` added explicitly so the same POSIX script runs identically on Windows (Git Bash) instead of the default `pwsh`. The step's real exit code is captured via `$GITHUB_OUTPUT` for TI-02b to consume.

2. **`fix(scripts): make module entrypoint detection reliable across paths`** — new `scripts/lib/is-main-module.mjs` (`pathToFileURL(path.resolve(argv[1])).href` compared against `import.meta.url`, both normalized the same way). Applied to all 19 affected scripts: `run-tests.mjs`, `test-ownership-lint.mjs`, `test-timing.mjs` (mandatory), plus `backfill-status-category.mjs`, `check-decision-citation-drift.mjs`, `check-decision-codes.mjs`, `check-decision-supersession.mjs`, `check-locked-decisions-heading-drift.mjs`, `events-jsonl-truncation-guard.mjs`, `herdr-cockpit-notify.mjs`, `install-git-hooks.mjs`, `measure-verify-cost.mjs`, `migrate-actor-to-role.mjs`, `migrate-clarify-split.mjs`, `migrate-status-proposed-to-awaiting-approval.mjs`, `next-doc-id.mjs`, `probe-storytelling-material.mjs`, `project-agents.mjs`, `write-wrapper-script.mjs` — every one of these was a genuine one-line-guard diff, so all 19 landed in this PR; no follow-up list needed. `write-test-marker.mjs` had no such guard at all (always ran top-level), so it wasn't in this set — see next commit.
   - `test/scripts/install-git-hooks.test.mjs`'s CLI fixture manually mirrors the script's file layout to spawn it as a real process; it needed `scripts/lib/is-main-module.mjs` copied in too, or the fixture's own spawn would `ERR_MODULE_NOT_FOUND`. Fixed as part of this commit (not scope creep — an existing test broke because of this fix, per "fix regressions instead of weakening tests").

3. **`fix(scripts): track real completion state in the CI test marker`** — `completed` now requires the xml file to exist AND report ≥1 case AND `jobStatus` to be `success`/`failure`. `exitCode` comes from a real `--exit-code` flag (now wired from the CI step's captured exit code in commit 1) instead of a default that reads as success. Refactored into exported `parseArgs`/`buildMarker`/`writeMarker` (was previously untestable top-level script code) behind the same `isMainModule` guard. Also corrected `CHANGELOG.md`'s "Added Nightly Fault-Injection job" line: read `scripts/test-select-mutate.mjs`'s baseline step and confirmed it runs against a clean checkout with zero changes, so the selector always refuses and no mutant is ever exercised — the job runs and uploads a ledger but doesn't validate anything yet (that's TI-04, Slice 2, not fixed here).

## Commands run + results

- Reproduced TI-01 exactly: `node --test --test-reporter=junit --test-reporter-destination=test-results/x.xml a.test.mjs` in a fresh dir with no `test-results/` → `ENOENT`, exit 7. `mkdir -p test-results` first → exit 0. (see conversation for full output)
- `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` → **411/411 pass** (includes the 3 new/extended test files)
- `env -u CLAUDE_CODE_SESSION_ID node --test test/state/events-jsonl-truncation-guard.test.mjs test/state/migrate-clarify-split.test.mjs` → **44/44 pass** (only other tests referencing scripts touched here)
- `env -u CLAUDE_CODE_SESSION_ID npm test` (full suite) → **7480 tests, 7405 pass, 2 fail, 0 cancelled, 8 skipped**. The 2 failures are exactly the pre-existing known ones in `test/cli/fgos-approve.test.mjs` (tsk-598 D2, D3) — not touched, not newly broken.
- `node --check` on all 19 edited scripts + the new lib file → all parse clean.
- `node -e "require('yaml').parse(...)"` on `.github/workflows/ci.yml` → parses clean.

No CI run on GitHub yet (this is a local branch, not pushed) — the "3 OS with real test counts" evidence from the original ask requires a PR/CI run, which needs the user to push and open a PR.

## Impact analysis

GitNexus index reported stale (`last indexed: 16a7900`, this branch's HEAD) throughout — `fgos tool query --capability impact-analysis` wasn't queried before edits (scripts/CI-yaml are not GitNexus-indexed code paths in a way that changes this call's value: no `Function`-symbol call graph applies to shell-invoked, single-purpose CLI scripts). Cross-checked manually instead: `grep -rn` for every call site of the changed guard pattern (found and fixed all 19), and confirmed via the two existing test files that reference the entrypoint-guard-bearing scripts under `test/state/`. **impact-analysis: degraded** — grep cross-check substituted, no GitNexus `impact()` call made.

## Doctor/setup gate

No new config default, env var, or infra dependency added — `mkdir -p`/`shell: bash` are CI-only; `isMainModule` and the marker refactor are pure code, no new file/tool assumption. No `fgos doctor` registration needed.

## Scripts still on the old guard pattern

None. All 19 matches from `grep -rn 'file://\${process.argv\[1\]}' scripts/*.mjs` were fixed in this PR (re-verified: `grep -rln` now returns nothing).

## Unresolved / follow-ups

- **Slice 2 (TI-03/TI-04) not started** — held because `fgw/phase3-completion` is actively editing `test-select-compare.mjs` and `test-select-mutate.mjs` (same files TI-03/TI-04 target). Needs a fresh overlap check before starting.
- **No real 3-OS CI run yet** — branch hasn't been pushed/PR'd. The Slice 1 acceptance criteria's CI-run evidence (ubuntu ~7456 tests, ~180 known-flaky confinement-registry fails, Windows "runs to wherever it gets but actually runs") needs that push, which wasn't authorized as part of this local-fix task.
- Rust-host tests (`test/rust-host/*`) failed on the first full-suite attempt in this worktree because its own `target/` build dir had no compiled release binaries (each `git worktree add` gets its own separate build dir, same class of issue as the `node_modules` symlink convention). Symlinked `target/` from the main checkout to resolve — not a code change, just worktree setup; flagging in case this is worth adding to the worktree-setup convention alongside the existing `node_modules` symlink step.
