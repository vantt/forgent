# Review round B: 2fd5cb6a3..HEAD (60b5dd371)

Date 2026-10-06. Reviewer had no write access to the repo; all experiments ran in `/var/tmp/opus-b-scratch`. A full `npm test` from another worktree (`forgentX-single-door-execution`, which does not have the fixture helper) was running at the same time, so raw `/var/tmp` counts were contaminated. Cleanup was proven instead by logging every `mkdtempSync` the run made itself.

## 1. Claims vs evidence

### 36dc5f083: hash dirty-before files in chunks

| Claim | Result | Evidence |
|---|---|---|
| Snapshot keeps only existence and sha256 | VERIFIED | `assignment-runner.mjs:339-352`. The old `content` field was never read anywhere (`git grep content 36dc5f083^` only finds the two writes). The baseline at `:2201` copies only `exists`/`hash`. |
| Hashing in 1 MiB chunks | VERIFIED | `proof-helpers.mjs` `FILE_HASH_CHUNK_BYTES = 1024*1024`, `readSync` loop |
| Settlement hashes the same way | VERIFIED | `settlement.mjs:51-72` `findMutatedDirtyBeforeFiles`, called at `:577` |
| Observable behavior unchanged | VERIFIED for a regular file and a missing file. For a directory it is also unchanged: old `readFileSync` threw EISDIR and the entry was skipped; new code throws ENOTREGULAR and the entry is skipped. Settlement treats both the old and new error as absent. For a FIFO the behavior changed on purpose (old code hung, new code skips the entry). | Diff against `36dc5f083^:settlement.mjs`; tests at `assignment-runresult.test.mjs` |
| Large file no longer drives RSS to about 1.9 GB | Mechanism VERIFIED (a 200 MiB test bounds arrayBuffers and RSS growth to under 64 MiB). The 1.9 GB figure is UNPROVEN. | `assignment-runresult.test.mjs:746-772` |

### 13d1c096b and 60b5dd371: lock wait

| Claim | Result | Evidence |
|---|---|---|
| `lockWaitMs` is optional, and omitting it keeps the default | VERIFIED. `{ waitMs: undefined }` triggers the destructuring default at `provider-capacity.mjs:538` | `:652`, `:693` |
| "keeps the five second default" (13d1c096b) | Superseded by 60b5dd371 (30 s). CHANGELOG states 30 s, which is correct for HEAD. | |
| A dead holder is still reclaimed at once | VERIFIED by reading the code: `isGenerationHeld` checks pid plus start time before the deadline matters (`:440-451`, `:488-499`) | |
| No caller or test depended on a 5 s failure | VERIFIED. `withFileLock` is called only at `provider-capacity.mjs:658,699,711,734`. Only `acquire` passes a wait. Production callers of acquire, release and quarantine are `assignment-runner.mjs:1175,1644,1685,1771,2070,2714` and `settlement.mjs:598`. None assert on timing. The only timing test (`provider-capacity.test.mjs:502`) uses 50 ms explicitly, plus the default against a 1.5 s hold. | grep `withFileLock\|lockWaitMs` over src, bin and test |
| 7/10 to 0/10 under load; "removing the option brings them back" | UNPROVEN, not re-run. The second claim is stale after 60b5dd371, because the default is now 30 s rather than 5 s. | |

### afd18bbfc: fixture helper

| Claim | Result | Evidence |
|---|---|---|
| Ten files converted mechanically | VERIFIED. Every hunk is a one-to-one replacement of `mkdtempSync(path.join(FIXTURE_ROOT,p))` with `makeFixtureDir(p)`. No assertion or test was touched. | `git show afd18bbfc` |
| Narrow file leaves nothing behind | VERIFIED. `run.test.mjs`: 53/53 pass. 103 `/var/tmp` dirs were created by the run and its children (logged through a `NODE_OPTIONS --import` mkdtemp hook) and 0 survived. The `^fgos` count was 2736 before and 2736 after. | scratch `mk.log` |
| "removes every directory … whatever the test did" / "A full suite now leaves none behind" | FALSE as worded. Directories are not removed on SIGTERM, SIGINT or SIGKILL (see finding M1). | scratch probes |
| about 113 per suite / 12,000 dirs / 4.9 GB | UNPROVEN. `/var/tmp` currently holds 2,736 `fgos*` dirs (1,292 `fgos-run-wt`, 1,292 `fgos-run-test`, …). The old pile was not cleaned. | `ls /var/tmp` |

### 3898fccd4, 4547b964f, e9deda6fb: guards, lexer, quorum

| Claim | Result | Evidence |
|---|---|---|
| Quorum is "at least two valid and strictly more than half" | VERIFIED consistent across `discussions.rs:57-65` (`valid >= 2 && valid*2 > voters`), the unit table at `:333-341` (2/4 false, 2/3 true, 3/7 false), `observe.md:61`, `runner.md:1435`, `unit-summary.read.v2.json` (agreement description), and CHANGELOG lines 29 and 50 | |
| The 3898fccd4 message says "at least half, rounded up" | Superseded by e9deda6fb. The final docs agree with the code. | |
| Version is checked before timestamp | VERIFIED. The check moved in `unit_summary.rs`, and the new fixture `unit-run-old-untimed` counts as `unsupported-version: 2` | |
| Comments cannot hide a call; regex literals are recognized | Partly FALSE. A regex containing a quote right after `if (…)` or `while (…)` hides a same-line listing (see finding L1). | probe |
| Behavioral loaded-module check | VERIFIED. My independent loader hook loads exactly the 16-file static closure (§3). | |
| The lexer copies "had already diverged" | UNPROVEN, not checked | |
| Workflow symlinks are excluded and seats have bounded timeouts | VERIFIED. `workflow-runner.test.mjs` uses `.git/info/exclude` with `runner.timeoutMs=45000` and `execFileSync timeout` | |

### 69489c5f9: stress tool

| Claim | Result |
|---|---|
| fsync burner exists; per-round TMPDIR is removed | VERIFIED by reading the code (`scripts/stress-test-files.mjs`). The per-round TMPDIR does not cover `/var/tmp` fixtures (see L5). |
| 9 of 15 rounds reproduce the failure | UNPROVEN |

### Plan wording (`plans/261005-1143-observe-run-visibility-and-discussion-measurement/plan.md`)

- `status: completed` and every phase marked completed: consistent. There are no unchecked boxes.
- The line "guard criterion is restored unchecked" (reopened section, about line 180) is now historical, because the box at about line 88 is `[x]`. That is acceptable only as history.
- Success line about line 86 says "an audited isolated Opus judgment" and then, in the same bullet, "not sandbox-isolated". These conflict. LOW.
- The claim "cargo test -p fgos-run-result -p fgos-observe (100 passed)" does not map cleanly to my run. My run was green, but the per-binary totals are 27/1/24/1/1/3/11/14 plus 20 single-test subprocess re-runs. UNPROVEN as an exact number.

## 2. Tests deleted or weakened

- `assignment-enumerator-guard.test.mjs`: two tests were renamed and strengthened, because the allow-list now carries an exact count plus the enclosing function. 5 assertions were removed and 28 added. The removed `detect` expectations reappear with the `<module>:`/`f:` key and the same inputs. The one rewritten probe (`assignmentDir … fsp.readdir`) moved into a function and keeps the same detection. No test was lost.
- `dispatch-reconciliation-import-graph.test.mjs`: the old `assert.doesNotMatch(codeOnly(src).replace(SIGNAL_ZERO_PROBE,''), BANNED_CALL_PATTERN)` became `bannedCalls(source)`. That function has an explicit table covering computed member, destructure, bind, call, `child.kill()` and spawn. Signal 0 is still exempt, including `process.kill.call(process, pid, 0)` (`reconciliation-planner.mjs:45`). The old `[...seen].sort() == expected` check became `EXPECTED_CLOSURE` plus a lazy-edge list plus a runtime loaded-module check. This is stronger.
- `workflow-runner.test.mjs`: the single assertion gained a diagnostic message only. However, the test no longer exercises large untracked dirty files, because the symlinks are now in `.git/info/exclude`. The 200 MiB unit test is the only remaining guard for that path.
- Rust: `summaryDirsSeen` went from 11 to 12 and `summariesUnusable` from 9 to 10, both because a fixture was added. Nothing was weakened.
- The 10 `makeFixtureDir` files have no assertion changes.

## 3. Dependency boundary (reconcile.mjs)

I computed the closure independently in two ways: a regex static walk (`static.mjs`) and a `module.register` resolve hook that imports `reconcile.mjs` and `reconciliation-planner.mjs` in a fresh process. Both give the same 16 files:

- `reconcile`, `reconciliation-planner`, `runtime-inspection`, `run-result`, `visibility-session`, `worker-artifacts`, `provider-capacity`, `provider-adapter`, `provider-auth-failure`, `process-identity`, `assignment-layout`, `agent-result-claim-contract`, `unique-tmp-tag`, `global-config`, `shared-config-file`, `config-merge`

Builtins: `async_hooks`, `crypto`, `fs`, `os`, `path`, `worker_threads`.

These match the test's `EXPECTED_CLOSURE` exactly. The only differences are the two declared lazy edges, `visibility-session → assignment-runner` and `→ herdr-round`. Both are `import()` calls that never run at load.

None of the `BANNED_FILES` appear, including `liveness.mjs`. The only `kill` occurrences are signal-0 probes (`provider-capacity.mjs:581`, `reconciliation-planner.mjs:45`). There is no `child_process`.

`proof-helpers.mjs` is not in the closure; only `settlement.mjs` and `assignment-runner.mjs` import it. Neither `provider-auth-failure.mjs` nor the new helper changed the closure in this range.

## 4. Attempts to defeat the fixture helper (scratch)

| Attempt | Outcome |
|---|---|
| Symlink to an outside directory, plus a symlinked file inside the fixture | The fixture was removed and the target file `precious` was intact, so the helper does not delete what it did not create. |
| Uncaught throw | Removed. Exit code 1 was preserved. |
| `process.exitCode=7` with an unremovable subdirectory (chmod 500) | Exit code 7 was preserved and there was no stderr. The directory leaked silently. Acceptable for a best-effort helper. |
| SIGTERM / SIGINT | **Leaked** (rc 143/130). |
| SIGKILL (the repo watchdog, `scripts/lib/test-file-watchdog.mjs:93`) | **Leaks** by construction, because no `exit` event fires. |
| `FGOS_KEEP_TEST_FIXTURES=0` | Keeps the directories, since any non-empty string counts as true. Minor. |
| Callers of `fs.realpathSync(makeFixtureDir(...))` | The registered path is the pre-realpath one. `/var/tmp` is not a symlink on this host, so removal hits the same inode. If FIXTURE_ROOT fell back to a symlinked `os.tmpdir()`, `rmSync` on the link path would still recurse into the real directory. Fine. |
| Detached child still using the directory after the file's process exits | Not observed in `run.test.mjs` (0 leftovers including children's mkdtemps). Not exhaustively tested; UNPROVEN for herdr/workflow files. |

## 5. Live read-only checks

- The host `target/debug/fgos` (22:39) is newer than every `.rs` file, so no rebuild was needed.
- `cargo test -p fgos-observe -p fgos-run-result`: all green. `cargo test -p fgos --test cli_tests`: 20 passed.
- Note: `node bin/fgos.mjs metrics …` refuses with "chỉ có ở Rust host" even with `FGOS_HOST_BIN` set. I ran the host binary directly instead.
- `metrics coverage` matches an independent `find` count in both projects:

| Project | runDirsSeen | Independent `find` (excluding outbox) | `run.json` count | missing-result | runs dir − `result.json` |
|---|---|---|---|---|---|
| forgentX | 1199 | 1199 | 1199 | 51 | 1199 − 1148 = 51 |
| mdview | 123 | 123 | 123 | 7 | 123 − 116 = 7 |

- `metrics discussions --since=2026-10-05` in mdview lists all four `workflowId:"delphi"` runs (`wf-run-1791195929806`, `…195956706`, `…196890335`, `…198761595`). Seats 0+8+10+10 = 28, attempts 0+9+11+10 = 30, fallback seats 2. This matches the plan's claims.

## 6. Commit hygiene

- Each commit stays within its theme. The fix commits carry their own measurement reports under `plans/reports`, which is acceptable.
- No secrets in the code or test diffs. The regex hits are in unrelated plan/harness docs, which are outside scope.
- A grep of added code, test and script lines and of commit messages found no plan IDs, phase numbers, audit labels or finding codes. Labels such as `S3`, `C2c` and `Phase 4` in nearby test names already existed before this range.

## Findings

### Critical
None.

### High
None.

### Medium

**M1. The fixture helper leaks on SIGKILL, SIGTERM and SIGINT, which is exactly the hang case it was written for.**
- Code: `test/helpers/fixture-dir.mjs:27` only hooks `process.on('exit')`. The repo watchdog SIGKILLs any test file that outlives its limit (`scripts/lib/test-file-watchdog.mjs:90-93`), and Ctrl-C on `npm test` sends SIGINT.
- Failure scenario: a workflow test hangs again under load. The watchdog kills it and every fixture it made, including large worktrees, stays in `/var/tmp`. This is the pile-up the commit says it ended.
- The commit and CHANGELOG wording ("whatever the test did", "A full suite now leaves none behind") is unconditional and therefore overstated. The existing 2,736 leftovers were not cleaned either.
- Fix: put the creator pid in the directory name (`${prefix}${process.pid}-`). After each run, have `scripts/run-tests.mjs` (or the watchdog after a kill) remove `FIXTURE_ROOT` entries with known prefixes whose pid is dead. Optionally also handle SIGINT/SIGTERM by removing and then re-raising.
- Permanent check (this is a class of defect): a post-suite assertion in `run-tests.mjs` that compares the `/var/tmp` fixture-prefix count before and after and fails or warns on growth.

**M2. A wall-clock assertion was added to a suite with known load flakes.**
- `test/runner/assignment-runresult.test.mjs:769`: `elapsedMs < 3000` for hashing 200 MiB, plus `rss` delta < 64 MiB at `:766`.
- Failure scenario: under the very fsync/CPU load this range diagnosed, sha256 over 200 MiB on a starved core exceeds 3 s and the suite goes red for no defect. Two commits in this range exist only to remove such flakes.
- Fix: drop the elapsed bound (the memory bounds already prove streaming) or loosen it to about 30 s.
- Permanent check: a lint over `test/**` that flags `Date.now() - … <` assertions below about 10 s unless the line carries an explicit justification comment. Cheap to build.

### Low

**L1. The shared lexer misreads a regex after `if (…)` or `while (…)` as division, which lets the enumerator guard be evaded.**
- In `test/helpers/js-source-lexer.mjs`, the `shape` view starts a string at the quote and blanks the rest of the line.
- Proof, via the exported `assignmentListings`:
  - `if (fgosDir) /'/.test(fgosDir) && fs.readdirSync(path.join(fgosDir,'assignments'))` gives `[]`.
  - The same line with `/x/` is detected.
- The guard header (lines 7-8) claims regex literals are recognized. The impact is a contrived, same-line-only evasion.
- Permanent check: add this case to the "lexer: comments never hide code" test, and treat `/` after a `)` that closes `if`/`while`/`for`/`with` as a regex.

**L2. A comment in `test/workflow/workflow-runner.test.mjs:1127-1131` is stale.** It says the dispatch "keeps the bytes … peaks near 2 GB", which is false after 36dc5f083. Because the symlinks are now excluded, this end-to-end test no longer covers large dirty files at all. Reword it as history.

**L3. The lock wait is now six times longer as a synchronous event-loop block.**
- `withFileLock` spins with `Atomics.wait` for up to 30 s (`provider-capacity.mjs:500`). Release failures are swallowed (`assignment-runner.mjs:1685,1771,2070,2714` `catch {}`), so a slow release still leaks a lease silently, now after 30 s instead of 5 s. Settlement quarantine (`settlement.mjs:598`) can stall up to 30 s.
- Run-control locks treat a live pid as held regardless of heartbeat (`run-lock.mjs:19-20`), so there is no takeover risk. Accepted trade-off. Note: `lockWaitMs: null` gives an immediate timeout (default params apply only to `undefined`). No caller passes null.

**L4. The S3 test's `lockWaitMs: 300_000` exceeds its own `timeout: 60_000`** (`provider-capacity.test.mjs:378,395`). The real bound is the test timeout, and the comment overstates it. Harmless.

**L5. The stress tool's per-round TMPDIR does not cover `FIXTURE_ROOT=/var/tmp`.** Killed rounds still leak `/var/tmp` fixtures. M1's sweep fixes this too.

**L6. Plan wording.** Line about 86 contains both "audited isolated Opus judgment" and "not sandbox-isolated". The exact cargo "100 passed" count is unproven.

## UNPROVEN (not checked within budget)

- Flake ratios: 9/15, 7/10 to 0/10.
- The 1.9 GB RSS figure, and 113, 12,000 and 4.9 GB.
- Whether the lexer copies diverged before 4547b964f.
- Detached-child behavior of the helper in the herdr and workflow files.
- The 6,877-test suite run (taken from the lead).

## Verdict

ACCEPT WITH FIXES (M1 and M2 before the next long unattended suite run; L1 and L2 are cheap).
