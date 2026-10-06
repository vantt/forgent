# Third repair round: observe code and tests

Date: 2026-10-06. Input: [third acceptance (code)](opus-third-acceptance-code-261006.md). I worked in the working tree on `main`; I did not commit. I did all mutation checks in a `git archive HEAD` copy under `/var/tmp/obs3-repair/repo` (with `node_modules` symlinked). I deleted that copy (715 MB, including its separate cargo target dir) at the end.

## Files changed (only the files this task owns)

| File | Change |
|---|---|
| `test/workflow/workflow-runner.test.mjs` | Fixed the cause of the stance-test hang. Added explicit bounds and a failure message that names what the test was waiting for. |
| `test/runner/assignment-enumerator-guard.test.mjs` | Rewrote the detector: a real lexer, keys of the form `file: function: call` with exact counts, and the forms reviewers found missing. The header lists the forms that still get through. |
| `test/runner/dispatch-reconciliation-import-graph.test.mjs` | Static closure now comes from a lexer. Added a runtime loader-hook check, a tripwire on lazy edges, a builtin allow-list, and a wider banned-call set. |
| `packages/observe/rust/src/metrics_cli/discussions.rs` | `has_quorum`: at least 2 valid votes **and** at least half the voting seats, rounded up. Added two unit tests. |
| `packages/run-result/rust/src/unit_summary.rs` | The version check now runs before the timestamp checks. |
| `packages/run-result/rust/tests/unit_summary.rs` | Added a v1 summary with no `settledAt`; it must be reported as `unsupported-version`. |

Other files show as modified in `git status`: `CHANGELOG.md`, `packages/observe/contracts/observe.eval.v1.json`, `plans/journals/*` and `plans/reports/observe-acceptance-fixes-261006.md`. The docs agent changed those, not me.

## 1. Workflow stance test hang (`workflow-runner.test.mjs`)

**Root cause (proven): the test fixture made every `fgos` CLI process use about 2 GB of RSS.**

- `useDistinctFamilies` creates executor commands as symlinks to the node binary (123,655,872 bytes each). It puts them as untracked files at the root of the fixture repo.
- Each seat's dispatch lists dirty files with `git status --porcelain -uall`. Two functions then read every dirty file whole, hash it, and keep the bytes:
  - `snapshotDirtyBeforeFiles` (`src/runner/dispatch/assignment-runner.mjs:338`), which stores `content` in the Map;
  - `settleRunOutcome` (`src/runner/dispatch/settlement.mjs:432`), which does it again.
- 4 symlinks × 123 MB × 2 reads per seat × 3 seats per run is a lot of memory.

Evidence:

- **Peak memory.** I sampled `/proc/<pid>/status` while the test ran alone:
  - `fgos workflow start` peaked at VmHWM 1,418,484 kB;
  - `fgos run --unit` peaked at 1,900,560 kB, of which one anonymous mapping was 1,569,880 kB.
- **Where the time goes.** A CPU profile (`--cpu-prof`) of the two seat processes shows `crypto Hash.update` at 1420 and 1897 ms and `read` at 1067 and 1436 ms. The callers are `snapshotDirtyBeforeFiles` and `settleRunOutcome`, both under `executeAssignment`.
- **Not the JS heap.** With `--max-old-space-size=150` the test still passes, so the memory is Buffer memory outside the JS heap.
- **Reproduced under load.** I ran 6 copies of this test in parallel before the fix. Each took 176 s (alone: 8–14 s), load average reached 108, and one copy failed. The kernel log shows `Out of memory: Killed process 3101243 (MainThread) ... anon-rss:1589892kB`, and that pid was the `fgos run --unit` the test spawned (`signal: 'SIGKILL'`). When the kill hits a worker or the supervisor instead, the seat is only given up at `runner.timeoutMs`, which defaults to 2,100,000 ms. That matches the reviewer's 43 minutes with `no-report`.

Fix (in the test only):

- **Exclude the symlinks from git.** They are written to `.git/info/exclude`, so the dispatch never treats them as dirty files.
- **Bound each seat.** `runner.timeoutMs = 45_000` (`FIXTURE_SEAT_TIMEOUT_MS`), so a seat that never answers fails the run in under a minute and names the seat.
- **Bound each CLI call.** Each call goes through `runFgos(label, args)`, which has a 60 s `timeout`. Its error message says which CLI it was waiting for, whether the CLI was killed or exited, the assignments directory, and stderr.
- **Bound the test.** Test-level `timeout: 180_000` as a backstop.
- **Name the failure.** The `state.status` assertion now prints `state.steps`.

Proof after the fix:

- **Memory and time, alone:** peak VmHWM 95,084 kB (was 1,900,560 kB). The test takes 1.2 s (was 8–14 s).
- **6 copies in parallel:** all 6 passed, 4 s each (was 176 s each, with one OOM kill).
- **12 copies in parallel, plus 16 busy-loop processes:** all 12 passed, 6 s each. The machine had 12 GB of 15 GB in use by other sessions.
- **Hang mutation (scratch copy).** I made the panelist-1 worker hang forever (`setInterval`). The test failed after 46 s (`exit=1 secs=46`). The message was `the workflow did not complete; its steps: {... "role":"panelist-1" ... "reason":"execution-timeout" ...}`.
- **Whole file:** `env -u CLAUDE_CODE_SESSION_ID node --test test/workflow/workflow-runner.test.mjs` passed 35/35 in 65 s.

Product issue I did not fix (it needs `src/`): `snapshotDirtyBeforeFiles` keeps the full bytes of every pre-existing dirty file in memory for the whole run, and settlement reads them all again. A real worktree with a large untracked binary or dataset costs that many bytes per seat, per process. Suggestion: hash by stream; keep content only if something actually restores it, or only below a size cap. See `dirtyBeforeSnapshots` at `assignment-runner.mjs:2202/2213/2689`.

## 2. Enumerator guard (`assignment-enumerator-guard.test.mjs`)

What changed:

- **Lexer (`lexSource`).** It produces two same-length views:
  - `code`: comments blanked, strings kept;
  - `shape`: string, template and regex literal contents also blanked.
  It handles nested template `${}` and recognizes regex literals from the previous token.
- **Key and count.** The key is now `file: <enclosing named function | <module>>: callee(arg)` with an **exact count**. `ALLOWED` maps each key to `{count, reason}`.
  - Test 1 fails when a count goes up or a key is new. The message says "found N, allowed M" and asks for a separate review.
  - Test 2 fails when a key disappears or its count goes down.
- **Forms it now follows:**
  - multi-line bindings: brackets across lines, and a value that starts on the next line;
  - plain reassignment;
  - callback parameters of `<receiver>.forEach/map/flatMap/filter/...`, which take the receiver's value;
  - class and object method parameters, including `.name(` calls;
  - glob/globSync, checked on every argument (cwd in options, or `**` in the pattern);
  - an import alias of a primitive (`readdirSync as ls`, `{ readdirSync: ls }`);
  - walks of the `.fgos` root (only the root itself, with no further segment joined) that are recursive (`{ recursive: true }`), call their own function, or pop a worklist (`.pop()`/`.shift()`).
- **Fewer false positives:**
  - a nested helper only takes values from its own call sites when two helpers share a name;
  - callback parameters are not used for the "descends into the layout" check, because an entry name passed to `.filter` is not a directory.
- **ALLOWED now uses real keys** for every existing reader. Three entries were added with reasons:
  - `scripts/run-tests.mjs: walk: readdirSync(currentDir)`: a recursive whole-`.fgos` snapshot for leak detection. This is a real reader of the new class, allowed with a reason.
  - `scripts/measure-coordination-baseline.mjs: replayCorpusFromDirectory: readdirSync(corpusDir)`: a false positive from the multi-line array binding next to it; the reason says so.
  - `assignment-runner.mjs: admitRunAttempt: readdirSync(runsDir)` with count 2: attempt numbering plus staging cleanup.
- **Cost.** The whole-repo scan takes about 0.8 s per test.

Mutation checks. I added each form to a real file in the scratch copy. Every mutated file passed `node --check`. I ran the copied guard test against the copy:

| Form | Result | Key reported |
|---|---|---|
| Control: one-line binding | caught | `registrations.mjs: __probeA: readdirSync(base)` |
| New walker in an allow-listed file under an allowed variable name (reviewer B) | **caught** | `operation-choice.mjs: __walkAll: readdirSync(assignmentsDir)` |
| Second listing inside an allow-listed function | **caught** | `unit-summary.mjs: unitHasActiveRun: readdirSync(runsDir) (found 2, allowed 1)` |
| Module-level listing, allowed name (reviewer C) | **caught** | `unit-summary.mjs: <module>: readdirSync(runsDir)` |
| Prettier multi-line `path.join` (reviewer D) | **caught** | `__probeD: readdirSync(base)` |
| `fs.globSync(..., { cwd: …assignments })` | **caught** | `__probeE: globSync('**/result.json')` |
| `fs.promises.glob('.fgos/assignments/**')` | **caught** | `__probeE2: glob(...)` |
| `readdirSync(path.join(root,'.fgos'), {recursive:true})` | **caught** | `__probeF` |
| Self-recursive walker from `fgosDir` | **caught** | `__walkState: readdirSync(dir)` |
| Worklist walker (`stack.pop()`) from `fgosDir` | **caught** | `__probeJ2: readdirSync(dir)` |
| Callback parameter `[…assignments].flatMap((d) => readdirSync(d))` | **caught** | `__probeG: readdirSync(d)` |
| Class method parameter | **caught** | `entries: readdirSync(dir)` |
| `/* note */` before the call | **caught** | `__probeI` |
| `import { readdirSync as __ls }` | **caught** | `__probeK: __ls(...)` |
| Wrapper in another file | **missed** (known) | — |
| `'assign' + 'ments'` | **missed** (known) | — |
| Pristine copy | pass | — |

Unit tests in the file cover the same forms, plus negative cases: a flat listing of `.fgos`, a recursive walk of `.fgos/coordination-protocols`, nested helpers that share a name, and comments and strings that contain `//`, `/*` or a regex.

**Forms that still get through.** These are also stated in the test header:

- a path passed to a wrapper, or built and imported, in another file;
- a segment that is split or computed at runtime;
- a primitive reached through a computed member (`fs['readdirSync']`), `Reflect.apply`, `eval`, a worker thread, or a shell (`ls`, `find`);
- a callback that does not get its path from its receiver;
- a self-descending `.fgos` walker that does not call itself by name, list recursively, or pop a worklist.

Method calls are matched by name only, which can over-report and so fails safe. The lexer's regex-vs-division rule is a heuristic.

## 3. Import-closure test (`dispatch-reconciliation-import-graph.test.mjs`)

What changed:

- **Comments.** The same lexer now blanks comments (inline block comments, block continuation lines, line comments). It replaces `codeOnly`, which dropped any line starting with `/*` or `*`.
- **Static imports.** They are found anywhere in the shape view, including with no space before the specifier, after another statement on the same line, `export * [as x] from`, side-effect imports, and multi-line `{}` clauses. Specifiers inside strings or comments are ignored.
- **Bare specifiers.** These are refused unless they are `node:` builtins on `ALLOWED_BUILTINS` (`fs, path, crypto, os, async_hooks, worker_threads, url, util`). That blocks `child_process` (with or without `node:`), `node:module` (createRequire) and package self-references.
- **Banned calls**, scanned in the code view:
  - spawn/spawnSync/execSync/execFile/execFileSync/fork;
  - `.kill(` and `.signal(`;
  - `process['kill']`;
  - `process.kill` taken as a value (`.bind`, `.call` with a real signal, aliases);
  - `{ kill } = process`, including `globalThis.process`.
  The signal-0 exemption covers `process.kill(x, 0)` and `process.kill.call(process, x, 0)`. The planner really uses the second form (`reconciliation-planner.mjs:45`); the old test only passed it because the old pattern did not see `.kill.call(` at all.
- **Behavioral check (new).** A child `node --input-type=module` uses `registerHooks({ load })` from `node:module` in Node 24. It records every module URL while it imports both entry points. The test asserts:
  - the file URLs equal `EXPECTED_CLOSURE` exactly (stronger than the subset that was asked for);
  - no banned module is among them;
  - every other URL is an allowed builtin.
  It takes about 14 ms inside the child and about 40 ms for the test. It is neither brittle nor slow, so I kept it.
- **Lazy edges are now a tripwire.** Dynamic `import()` calls inside the closure are pinned to exactly the two in `visibility-session.mjs` (`./assignment-runner.mjs` and `./herdr-round.mjs`).
- **The old comment overstated what is proven.** It said the lazy boundary was "asserted by the exact-closure test". The header now says plainly that the test **proves nothing about the lazy path**. Nothing stops reconcile from calling `reconcileRun` in the future; the tripwire only forces a review when a lazy edge changes.

Mutation checks in the scratch copy. Banned-call forms were added to `process-identity.mjs` inside a function; import forms were added to `reconcile.mjs`. Every mutated file passed `node --check`:

| Form | Result | Caught by |
|---|---|---|
| `/* x */ process.kill(pid,'SIGTERM')` | caught | banned-call scan |
| Continuation line `* process.kill(pid, 15)` | caught | banned-call scan |
| `process['kill'](…)` | caught | banned-call scan |
| `const { kill } = process` | caught | banned-call scan |
| `process.kill.bind(process)` | caught | banned-call scan |
| `process.kill.call(process, pid, 'SIGTERM')` | caught | banned-call scan |
| `import'…'` with no space | caught | static closure |
| `import * as x from'…'` with no space | caught | static closure |
| `const z = 1; import '…';` | caught | static closure |
| `export * from` | caught | static closure |
| Absolute specifier | caught | static closure |
| `import … from 'child_process'` | caught | builtin allow-list |
| Package self-reference | caught | builtin allow-list, and the runtime check (see next table) |
| Top-level `await import()` | caught | lazy tripwire, and runtime |
| `createRequire(import.meta.url)(…)` | caught | builtin allow-list, and runtime |
| New `import()` inside a function | caught | lazy tripwire |
| Pristine copy | pass | — |

The runtime check alone (`--test-name-pattern='fresh process'`) also catches the forms the static walk cannot see:

| Form | Runtime check message |
|---|---|
| Top-level `await import(liveness)` | "loading reconcile loaded …liveness.mjs" |
| `createRequire` | "loading reconcile loaded …liveness.mjs" |
| Self-reference to a real export, `import 'forgent/state/porting'` | "the modules really loaded differ from the static closure" |

Run: `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/dispatch-reconciliation-import-graph.test.mjs` → 25/25 pass in 0.19 s.

## 4. Relative quorum (`discussions.rs`)

- The rule is now `has_quorum(valid, voters) = valid >= 2 && valid * 2 >= voters`. That means at least 2 valid votes and at least half the voting seats, rounded up. Without a quorum the unit is `unmeasured`, `agreement` and `genuineSplit` are null, and the counters (`stanceSeats`, `stancesValid`, `stancesMissing`, `stancesInvalid`) are kept.
- `agreement_is_measured_only_with_a_quorum_of_valid_votes` checks:
  - 3 seats: 3/3 measured (1.0, no split); 2/3 measured (0.667, no split); 1/3 unmeasured; 1-1-1 measured with `genuineSplit: true`;
  - 5 seats: 2/5 unmeasured; 3/5 measured (0.6, split); a-a-b with 2 missing is measured (0.4, split).
- `quorum_needs_two_valid_votes_and_half_the_voting_seats_rounded_up` covers the boundaries: 0/0, 1/1, 2/2, 2/3, 1/3, 2/4, 2/5, 3/5, 3/7, 4/7.
- The existing `passive_threshold…` (run-result) and `cli_tests` (2/2) tests still pass.
- Mutation in scratch: reverting to `valid >= MIN_VALID_VOTES` makes both new tests fail ("2 valid of 5 seats"; `[a,a,None,None,None]` gives `"measured"`).
- What the agreed rule still allows: a 4-seat panel with 2/4 identical votes is measured with `agreement 0.5` and `genuineSplit: true`, because 2 is half of 4. That is what the rule says. If the owner does not want it, the rule needs to be "more than half".

## 5. Version checked before timestamp (`unit_summary.rs`)

- `scan_unit_summaries` now checks `contract.id == unit-summary && version != 2` **before** `missing-timestamp` and `invalid-timestamp`.
- The test `reader_reports_root_wide…` gained `unit-run-old-untimed` (v1 with no `settledAt`). Expected: `summaryDirsSeen 12`, `summariesUnusable 10`, `unsupported-version: 2`, `missing-timestamp: 1`.
- Mutation in scratch: restoring the old order fails the test with `missing-timestamp: 2, unsupported-version: 1`.

Cargo runs:

- `rtk proxy cargo test -p fgos-run-result -p fgos-observe` → exit 0, 0 failed. The per-binary passed counts sum to 100, which double-counts binaries run test by test, so it is not a true total.
- `rtk proxy cargo test -p fgos --test cli_tests` → exit 0, 20 passed.

## 6. Settlement-write failure leaves the unit `running` (no change)

`run.mjs:555-561`: if `settle('execution-failure')` throws, the code only warns and rethrows the original error. `unit.json` keeps `execution.status: running` for good, and the backfill skips that unit as active. I did not change this. The fix belongs in `src/runner/execution/run.mjs`, outside the files I own, and I found no safe alternative inside the test.

Proposals (not done):

1. Make the warning say how to recover: the unit is stuck in `running`, and naming the step that fixes it after storage is repaired.
2. Retry `settle` once (an atomic write can fail transiently).
3. Have the backfill or `metrics` report an "overdue" signal when `startedAt + timeoutMs` has passed. This is the same mechanism as the open M4 question for the owner.

## Impact analysis (GitNexus, repo `/home/vantt/projects/forgentX`)

The index is **stale**: indexed at commit `b334695`, HEAD is `2fd5cb6`. I cross-checked every result with grep.

| Symbol | GitNexus result | Grep cross-check |
|---|---|---|
| `agreement` (discussions.rs) | LOW, 4 impacted: compute_discussions, dispatch_discussions, the test, Metrics_cli | The only callers are `compute_discussions` and the host `metrics discussions`. |
| `read_summary` | LOW | — |
| `scan_unit_summaries` | UNKNOWN (missing from the stale index) | Used by `UnitSummarySource::observations`, the `metrics_cli::dispatch` path (host `metrics discussions`), and the `layout_fixture.rs` and `unit_summary.rs` tests. Only the skip reason of a summary that is both the wrong version and untimed changes. Risk: LOW. |
| `assignmentListings` | not in the index (added after `b334695`) | Used only by its own test file. |

Test helpers have no callers outside their test files. I edited no `src/` symbol.

## UNPROVEN

- **Which process the reviewer's run lost.** I proved an OOM kill under 6× parallel runs, and that the cause is about 1.9 GB per CLI. I did not reproduce the reviewer's exact 43-minute run. It is plausible that the kill hit the worker or supervisor and the seat was then held until the 35-minute timeout. The test now bounds every case.
- **The CPU-pressure run was weak.** The 1-minute load average stayed low because each copy finished in about 6 s. The memory side is clearly proven; heavy CPU pressure is only weakly proven.
- **No full suite.** I did not run `npm test`, as instructed. I ran only the 3 Node files I own (66/66 pass) and the cargo commands above.
- **The lexer is heuristic.** The regex-vs-division rule can be wrong in unusual code. The current repo passes, and the tests contain cases with `//` inside strings and inside regexes.
- **The lexer is duplicated.** `lexSource` exists in both test files, because I may not create a shared helper. Suggestion: move it to `test/runner/js-lexer.helper.mjs` once that file is allowed.

## Docs to update (owned by the docs agent)

- **CHANGELOG `## [Unreleased]`.** Replace line 28 ("needs at least two valid stance votes…") with: "`fgos metrics discussions` reports agreement and a genuine split only when the valid stance votes are at least two and at least half the voting seats (rounded up); otherwise the unit is `unmeasured` and the stance counters are kept." Update the wording in line 48 to match.
- **CHANGELOG.** Add: "`fgos metrics discussions` reports an older unit summary as `unsupported-version` even when it has no settlement timestamp (the version is checked before the timestamp)."
- **`docs/specs/observe.md:61`.** Replace "dưới hai phiếu hợp lệ là `unmeasured`" with "dưới hai phiếu hợp lệ hoặc dưới một nửa số ghế bỏ phiếu (làm tròn lên) là `unmeasured`". `:59`: add "version được kiểm trước timestamp, nên summary cũ thiếu `settledAt` vẫn là `unsupported-version`".
- **`packages/run-result/contracts/unit-summary.read.v2.json`** (outside my files):
  - "With declared options and at least two valid votes" → "at least two valid votes that are at least half of the voting seats, rounded up";
  - "fewer than two valid votes is unmeasured" → "fewer than two valid votes, or fewer than half of the voting seats, is unmeasured";
  - "unsupported-version is a dated unit-summary of any other contract version" → "…of any other contract version, checked before the timestamp, so an undated older summary is also unsupported-version".
- **Optional (testing or maintainer notes).** Workflow tests with executor symlinks to the node binary must keep them out of git status, or each seat process reads and holds them, about 2 GB per CLI.

## Unresolved questions

- Owner: under the agreed rule a 4-seat panel with 2/4 identical votes is measured and reported as a split. Is that acceptable, or should it be "more than half"?
- Lead: should `snapshotDirtyBeforeFiles` and settlement stop holding the bytes of every dirty file (a product memory issue, in `src/`)? It would need its own work item.
- Lead: can I extract the shared lexer to a test helper file?

Status: DONE_WITH_CONCERNS
Summary: The stance-test hang was caused by the fixture making each `fgos` CLI use about 1.9 GB of memory. It is fixed and bounded: the test now takes 4–6 s with 6–12 copies in parallel, and a hung seat fails in 46 s. The enumerator guard and the closure test are tighter and pass mutation checks. The Rust quorum and version-order changes are done with tests.
Concerns/Blockers: A product memory issue in `src/` (dirty-file snapshots) and the settlement-write failure are only reported, not fixed. The lexer is duplicated in two test files. CHANGELOG, spec and contract text need updating by the docs agent.
