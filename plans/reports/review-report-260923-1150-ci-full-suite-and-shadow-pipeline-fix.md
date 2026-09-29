# Review report: CI full-suite + entrypoint-guard fix (Slice 1)

Reviewer: independent (did not author the fix). All evidence below re-measured by reviewer; nothing taken from the fix report on trust.

## Identity

| Field | Value |
|---|---|
| Candidate branch | `fix/ci-full-suite-and-entrypoint-guard` |
| Candidate SHA | `2168d348b65a6befeb928a11c20e1d9eb9189ab3` (4 commits: 20ffc012, 2f10a0fb, 2b9711e0, 2168d348) |
| Merge-base with main | `16a7900d9eacf1c1dfa6d0c77ff489c21080305e` (= baseline = current main) |
| Merged into main | No |
| Pushed / PR | No (`git ls-remote` empty, `gh pr list --head` empty) → **no CI run exists** |
| Slice 2 (TI-03/TI-04) | Not present on any branch → not reviewed |
| Overlap with `fgw/phase3-completion` (738f8ab4, mb 16a7900d) | None — committed and uncommitted file sets disjoint from candidate |

## Verdict

**REQUEST CHANGES.** Code: no blocking defect found. Reason for the verdict is the gate: step 4 (real CI on 3 OS) cannot be satisfied, and the review contract forbids a pass without it. Two MEDIUM fixes also recommended before merge (both small).

| Lỗi | Fix đúng root cause | Test bắt lỗi cũ (revert → đỏ) | CI 3 OS có số test thật | Verdict |
|---|---|---|---|---|
| TI-01 ENOENT | Yes — `mkdir -p` in same bash block, both `test` and `related` jobs, `shell: bash` on all OS | N/A (CI-yaml only; no unit test possible). Reviewer repro: old cmd exit 7 ENOENT no XML; fixed block exit 0, 2 testcases | **Not run** | Pending CI |
| TI-02 guard | Yes for Windows/space paths (`pathToFileURL(path.resolve(argv[1])).href`). Not symlink-safe (F3). One runtime entry left unfixed (F2) | **Yes** — reverting guard in temp copy turns "space in path" test red (1/17 fail); restored → green | **Not run** | Fix correct, incomplete |
| TI-02b marker | Yes — completed needs xml + ≥1 case + success/failure; real `--exit-code` wired from `$GITHUB_OUTPUT` | Yes (17 unit tests; reviewer's own fake-XML matrix matches spec) | **Not run** | OK |
| TI-03 compare | — | — | — | Not started (Slice 2) |
| TI-04 mutate | — | — | — | Not started (Slice 2) |

## Findings

### GATE-1 (process blocker) — no CI evidence
- Branch never pushed; no `gh run` exists. Step 4 (ubuntu ~7480 real tests, Windows >0 tests with plausible duration, `full-results-<os>` artifacts with `<testcase` > 0 and consistent marker) unverifiable.
- Action: push branch, open PR, re-run step 4. Expect Windows to newly surface real failures once tests actually execute — at least `test/rust-host/*` (CI skips `cargo build` on Windows, ci.yml `if: runner.os != 'Windows'`) and `test/runner/dispatch.test.mjs` CLI-spawn tests (see F2). Those must be classified and pinned, not hidden.

### F2 MEDIUM — old guard still in `src/runner/dispatch.mjs:99`
- `if (import.meta.url === \`file://${process.argv[1]}\`)` unchanged. Fix report says "Scripts still on the old guard pattern: None" — true only for `scripts/` (grep was scoped `scripts/*.mjs`).
- On test path: `test/runner/dispatch.test.mjs:2795-2850` spawns the CLI for real (4+ tests). Also the AGENTS.md dispatch door + PreToolUse hook entry (`node src/runner/dispatch.mjs decide`).
- Repro (candidate archive under a path with a space):
  `cd "<tmp>/with space/cand" && node src/runner/dispatch.mjs decide no-such-executor` → `exit=0 stdout= stderr=` (silent no-op, should print `{"mechanism":"unavailable",...}`).
- Impact: on Windows CI those tests fail loudly (`JSON.parse('')`) — not false-green, but a guaranteed Windows red; for Windows users of fgOS the dispatch door is a silent no-op.
- Action: switch to `isMainModule` (needs a relative import from `src/` to `scripts/lib/`, or move the helper under `src/` since `scripts/` does not ship in the npm package — check packaging before choosing). Correct the report's "None" line.

### F3 MEDIUM — `isMainModule` false when launched via a symlinked path
- Node resolves the main module to its realpath (`import.meta.url`), `path.resolve(argv[1])` does not resolve symlinks → mismatch → CLI body skipped, exit 0. Same false-green class as TI-02.
- Repro: `ln -s <cand-copy> link && node link/scripts/run-tests.mjs` (empty `test/`) → `exit=0`, no stderr. Same copy invoked directly → `exit=1` + refusal message.
- Not hit by GitHub runners today (no symlinked workspace); hit by symlinked checkouts / macOS `/tmp`→`/private/tmp`-style paths.
- Action: also compare against `pathToFileURL(fs.realpathSync(argv[1])).href` (try/catch fallback), add a symlink test case.

### F4 LOW — `completed:true` with `exitCode:null`
- `JOB_STATUS=success`, xml with cases, `--exit-code ""` → `{"completed":true,"exitCode":null}`. Unlikely in the wired CI flow, but "completed" without a known exit code is weaker than the spec's intent.
- Action: require `exitCode !== null` for `completed`, or document why not.

### F5 LOW — finding code in test file
- `test/scripts/write-test-marker.test.mjs:65`: `// --- buildMarker: \`completed\` correctness (TI-02b) ---`. Rule: no audit/finding codes in code/tests. Action: drop "(TI-02b)".

### F6 LOW — temp dir leak in new tests
- `test/scripts/run-tests.test.mjs` `mirroredRepoRoot()` uses `mkdtempSync` with no cleanup → 2 leaked dirs per run. Action: `t.after(() => fs.rmSync(root, {recursive:true, force:true}))`.

### F7 LOW (info, user decision) — commit trailers
- All 4 commits carry `Claude-Session: https://claude.ai/code/...`. Harness-mandated attribution; conflicts literally with "no AI references in commits". Anh decide whether acceptable.

### Report accuracy (fix report vs reviewer measurement)
| Claim | Reviewer measurement | Match |
|---|---|---|
| full suite 7480 / 7405 pass / 2 fail / 8 skip | 7480 / 7405 / 2 / 0 cancelled / 8 skip / 65 todo | ✅ |
| 2 fails = tsk-598 D2/D3 | `not ok 141`, `not ok 142` in `test/cli/fgos-approve.test.mjs`, exact names | ✅ |
| `test/scripts/*` 411/411 | 411/411 | ✅ |
| 19 scripts fixed, each one-line | 19 files, each exactly 3 changed lines (import + guard) | ✅ |
| "no scripts remain on old guard" | `src/runner/dispatch.mjs:99` remains | ❌ scope-limited claim (F2) |
| "Fix summary (3 commits)" | 4 commits (4th = report) | minor |
| impact-analysis | degraded, grep substituted — stated honestly | ✅ |

## Scope checks (step 1)
- Forbidden paths (`src/runner/merge.mjs`, `src/verbs/merge/approve.mjs`, `.fgos/`, `test/cli/fgos-approve.test.mjs`): untouched.
- `git diff 16a7900d...2168d348 -- test | grep skip/todo/only/-assert`: nothing.
- `package.json` unchanged; `run-tests.mjs` only guard line changed → `npm test` still full suite, not narrowable (ITR-D01 intact).
- No `fgos setup` in CI. No new runtime dep/env → no `fgos doctor` registration needed.
- `git diff --check`: clean.
- CHANGELOG `[Unreleased]`: Windows false-green fix line present; Nightly Fault-Injection line rewritten to "scaffolding, not a working gate". ✅

## Commands run + numbers
1. `git worktree list`, `git log main..fix/...`, `git merge-base`, `git ls-remote`, `gh pr list` → identity table above.
2. TI-02a: `git archive <sha> | tar -x` into `<scratch>/with space/{cand,base}`, emptied `test/`, `node scripts/run-tests.mjs`:
   - cand → `exit=1`, stderr `run-tests: discovered 0 test files ... refusing ...`
   - base 16a7900d → `exit=0`, empty stderr/stdout (bug reproduced)
   - cand via symlink → `exit=0` silent (F3)
3. TI-02b: reverted guard in temp copy → `node --test test/scripts/run-tests.test.mjs` → 17 tests, 1 fail (`the real entrypoint still fires when its own absolute path contains a space`); restored → 48/48 across run-tests/is-main-module/write-test-marker/install-git-hooks tests.
4. Marker matrix (`JOB_STATUS=… node scripts/write-test-marker.mjs --xml … --exit-code …`):
   (i) no xml, exit 7 → completed:false, exitCode:7 · (ii) 0 cases → false · (iii) cases+failure, 1 → true, 1 · (iv) cases+success, 0 → true, 0 · cancelled → false · empty exit-code+success → true, null (F4).
5. TI-01 fixture (run-tests + 1 test file, no `test-results/`): old CI command → exit 7 ENOENT, no dir; fixed bash block with `GITHUB_OUTPUT` → exit 0, `exit_code=0`, 2 `<testcase`, marker completed:true.
6. `env -u CLAUDE_CODE_SESSION_ID node --test $(find test/scripts -name '*.test.mjs' | sort)` on candidate → 411/411.
7. `env -u CLAUDE_CODE_SESSION_ID npm test -- --test-reporter=tap` on candidate (agent worktree, which has deps + Rust binaries; worktree clean before/after) → tests 7480, pass 7405, fail 2, skip 8, todo 65, 8m49s.
8. Same on baseline 16a7900d (reviewer temp worktree, `npm ci`, no Rust binaries — hook blocks linking them) → tests 7456, pass 7330, fail 53, skip 8, todo 65. 53 = 2 known approve fails + 51 `test/rust-host/*` (missing binaries in reviewer env; all pass on candidate with binaries). Delta 7480−7456 = 24 = new tests (is-main-module 5 + write-test-marker 17 + run-tests 2). skip/todo unchanged (8/65).

## Baseline SHA for I07/I09
Not proposed — requires merged main SHA with real 3-OS CI numbers (GATE-1).

## Workspace hygiene
- Main checkout `git status --porcelain` before: ` M AGENTS.md`, ` M CLAUDE.md`, `?? scratch/` (pre-existing, not reviewer's). After: identical, plus this report file only.
- Reviewer temp worktree (`<scratch>/rev/wt-base`) removed + pruned; `git worktree list` has no scratch entries.
- Agent worktree `ci-full-suite-fix` still clean at 2168d348 after the reviewer's full-suite run.

## Unresolved questions
- Push + PR authorization for CI evidence (anh's call).
- F2 fix location: `src/` cannot import `scripts/lib/` if `scripts/` is excluded from the npm package — confirm packaging before picking helper location.
- F7: accept `Claude-Session:` trailers or not.
