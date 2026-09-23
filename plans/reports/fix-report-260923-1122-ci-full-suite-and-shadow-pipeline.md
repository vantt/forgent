# Fix report: CI full-suite regression + entrypoint-guard bug (Slice 1)

Branch: `fix/ci-full-suite-and-entrypoint-guard` (worktree `.claude/worktrees/ci-full-suite-fix`, off `main@16a7900d`)

Scope: Slice 1 only (TI-01, TI-02, TI-02b). Slice 2 (TI-03/TI-04, `test-select-compare.mjs`/`test-select-mutate.mjs`) is **held** — the parallel session on `fgw/phase3-completion` is actively editing exactly those two files (last commit 13 min before this task started). Editing them concurrently risks a real conflict, so Slice 2 was not started this run.

**Update**: `fgw/phase3-completion`'s work landed on local `main` (`af55cbcc`, then a docs-only follow-up `c7a45c56`) partway through this task. Merged both into this branch — clean, zero conflicts except `CHANGELOG.md` (auto-resolved, both sides' lines preserved). This branch now also carries Slice 2's actual fix (`test-select-compare.mjs`/`test-select-mutate.mjs`/new `test-select-promote.mjs`), authored by that other session, not by this task. Re-verified after merge: `test/scripts/*.test.mjs` 442/442, `test/runner/dispatch.test.mjs` 385/385, full suite 7513/7438/2-known-fail/8-skip — no regressions from the merge.

## Root causes

**TI-01 — CI ran zero tests on every OS.** `test-results/` was removed from git (already gitignored) with no step re-creating it. `node --test --test-reporter-destination=test-results/full.xml` opens that path for writing at run start and crashes (`ENOENT`, exit 7) before any test runs — a ~1s "green" run. Reproduced locally byte-for-byte (see Commands below).

**TI-02 — Windows (and any URL-escaped path) silently ran nothing.** `import.meta.url === \`file://${process.argv[1]}\`` compares a percent-encoded file URL against a raw path. They never match when the path needs encoding — always on Windows (`file:///D:/...` vs `file://D:\...`), and on any OS when the path contains a space or other reserved char. When the guard never fires, the whole CLI body never runs and the process exits 0 having done nothing. Found in 19 scripts (`grep -rn 'file://\${process.argv\[1\]}' scripts/*.mjs`).

**TI-02b — Marker lied about completion.** `write-test-marker.mjs` defaulted `exitCode` to `0` and CI never passed a real value; `completed` only checked `jobStatus !== 'cancelled'`. A crash before any test ran, or a run with zero reported cases, still wrote `completed: true, exitCode: 0`.

## Fix summary (see Addendum below for 2 further commits added after review)

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
- Rust-host tests (`test/rust-host/*`) failed on the first full-suite attempt in this worktree because its own `target/` build dir had no compiled release binaries (each `git worktree add` gets its own separate build dir, same class of issue as the `node_modules` symlink convention). Symlinked `target/` from the main checkout to resolve — not a code change, just worktree setup; flagging in case this is worth adding to the worktree-setup convention alongside the existing `node_modules` symlink step.

## Addendum: independent review response (2 commits added)

An independent review (`plans/reports/review-report-260923-1150-ci-full-suite-and-shadow-pipeline-fix.md`) re-measured everything above from scratch and confirmed it (full suite 7480/7405/2/8, the 2 fails = tsk-598 D2/D3, 19 scripts each a one-line diff, 411/411 on `test/scripts/*`, no forbidden-path/skip/todo/only additions, no overlap with `fgw/phase3-completion`). It found two real gaps this report's own claims didn't cover, both since fixed:

- **F2 — `src/runner/dispatch.mjs:99` still had the original broken guard.** The "no scripts remain on the old pattern" claim above was true only for `scripts/*.mjs` — the grep sweep never covered `src/`. This is the exact CLI door `AGENTS.md`'s Dispatch section and a `PreToolUse` hook require (`node src/runner/dispatch.mjs decide/execute/log`), so a Windows, space-path, or symlinked fgOS install would have it silently no-op instead of running. Fixed: switched to the shared `isMainModule` helper. The review flagged a packaging question (does `src/` importing from `scripts/lib/` break for npm-installed users if `scripts/` isn't shipped?) — checked `package.json`'s `files` list: `scripts` is explicitly included, and `src/state/retrospective-doors.mjs` already imports from `scripts/check-decision-citation-drift.mjs`, so this is an existing, safe pattern, not a new risk.
- **F3 — `isMainModule` was still wrong when invoked through a symlink.** Node resolves `import.meta.url` to a symlink's real target, but `path.resolve(argv[1])` doesn't follow the symlink, so the two never matched — the same silent-no-op failure class as the original bug, just triggered by a symlink instead of an unencoded space. Fixed with `fs.realpathSync()` before building the comparison URL, with a try/catch fallback for the (currently impossible, since it's always the running script) case where the resolved path doesn't exist on disk.
- **3 LOW findings also fixed**: `completed` now also requires `exitCode !== null` (previously `completed:true, exitCode:null` was possible when a caller omitted `--exit-code`); dropped a `(TI-02b)`-style finding-code reference from a test comment; added cleanup for the temp directories the new symlink/space-path tests create.
- **F7 (commit trailers) and GATE-1 (push for real CI)**: both explicitly deferred to the user, per user decision: keep the `Claude-Session:` trailers as-is (harness default), and push once local verification stayed green.

Regression coverage added for both MEDIUM fixes: a symlink-invocation test for `run-tests.mjs`, and a symlink-in-a-space-path test for `dispatch.mjs` (proves the guard fires without copying `dispatch.mjs`'s whole `dispatch/*` module tree — a symlink still resolves relative imports against the real file's location).

Full suite re-run after all fixes: **7483 tests, 7408 pass, 2 fail (same tsk-598 D2/D3), 0 cancelled, 8 skipped, 65 todo** — 3 more tests than the original 7480 (the two new symlink tests plus the `exitCode:null` case), same 2 known failures, zero new regressions.

## CI evidence (GATE-1)

PR: https://github.com/vantt/forgent/pull/4. Run: https://github.com/vantt/forgent/actions/runs/35821243823 (triggered by the push before the main-sync merge above — the `npm test`/CI-yaml behavior under test is identical either way since the merge only added Slice 2 files, untouched by this fix).

| OS | tests | pass | fail | cancelled | skipped | todo |
|---|---|---|---|---|---|---|
| ubuntu-latest | 7483 | 7263 | 144 | 0 | 11 | 65 |
| macos-latest | 7483 | 7246 | 158 | 0 | 14 | 65 |
| windows-latest | *pending* | | | | | |

Both OSes ran the real, full suite for the first time since the TI-01 regression (previously: zero tests, ~1s, false green) — the primary thing this PR needed to prove. `Write test marker` step ran and succeeded on both (`if: always()` + the new `--exit-code` wiring both worked as designed).

**Failure classification — none are new regressions from this fix:**
- **122 failures on both OS** carry the exact error `DispatchError: confinement backend instance "bwrap" not found in machine registry` (`src/runner/dispatch/confinement/authority.mjs`). This is a pre-existing, already-diagnosed, separately-tracked issue: `plans/260922-test-suite-optimization/phase-03-selector-promotion-shadow-ci.md`'s "Appendix A" documents this exact signature from an earlier real CI run (35702387686, back when `npm test` still executed for real, before the TI-01 regression broke it) — CI installs bubblewrap but never runs `fgos setup`, so the confinement-backend registry (`~/.fgos/confinement-backends.json`) is never populated on the runner; every dispatch call needing confinement correctly fails closed. Appendix A explicitly scopes fixing this to its own separate future work item, out of scope for both Phase 3 and this task.
- **2 of the failures on each OS are the same known `tsk-598` D2/D3 cases** already called out in the local acceptance criteria (`test/cli/fgos-approve.test.mjs`).
- **The remaining ~11–49 (ubuntu: 11, macos: 49)** are `RunnerConfigError`/`NO_ASSISTANT_CLI_FOUND` — a runner-machine-dependent gap (no assistant CLI on the CI image), same hermeticity class as the confinement gap, not a code defect.
- 144 (ubuntu) = 142 (Appendix A's documented baseline) + 2 (tsk-598) exactly. 158 (macos) = the same 142+2 plus additional machine-dependent `NO_ASSISTANT_CLI_FOUND` cases specific to that OS's image.
- Zero failures reference `run-tests.mjs`, `write-test-marker.mjs`, `is-main-module.mjs`, or any of the 19 guard-fixed scripts.

Windows result will be added once its job completes (it is expected to newly run real tests too — the second thing this PR needed to prove — and likely to newly surface `test/rust-host/*` failures, since `ci.yml`'s Rust-binary build step is gated `if: runner.os != 'Windows'`; that gap is pre-existing and out of this task's scope, not a regression).
