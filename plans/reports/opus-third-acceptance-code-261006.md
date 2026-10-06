# Third-round acceptance: observe code and test repairs

Date: 2026-10-06. Scope: commits `5608387d3` (foundation) and `012595aca` (discussion) on `main`, plus `git diff b3346957a..HEAD -- test/`. Inputs: [round-two foundation](opus-reacceptance-foundation-261006.md), [round-two discussion](opus-reacceptance-discussion-measurement-261006.md), [foundation repair claims](observe-second-repair-foundation-261006.md), [discussion repair claims](observe-second-repair-discussion-261006.md).

## Method

- I made no change to the repo or git state. All mutations ran in `/var/tmp/opus3-scratch/repo`, which is a `git archive HEAD` copy. I diffed it against the repo afterwards: `src` is identical.
- Host binary: `target/debug/fgos`, mtime 15:27:27. No `*.rs` under `packages/` or `apps/fgos` is newer than it.
- `cargo test -p fgos-run-result -p fgos-observe`: exit 0, 98 passed, 0 failed.
- Node, with `CLAUDE_CODE_SESSION_ID` unset: I ran 10 focused files in one parallel `node --test` while cargo was also running. 193 of 194 passed. The one failure is the restored workflow test (T1 below). Run alone, it passes in 10.5 s.
- I checked the closure independently with a `module.register` resolve hook. It records every file module actually loaded by importing `reconcile.mjs` and `reconciliation-planner.mjs`, so it does not use the test's regex.

## Round-two open items

### Foundation

| Item | Verdict | Probe |
|---|---|---|
| H2: exact closure assertion restored | **FIXED** | The hook loader gives exactly the 16 modules in `expected` (`dispatch-reconciliation-import-graph.test.mjs:109-139`). Each of the 5 added modules has a reason comment. |
| H2: leaf shortcuts removed (N1 stale proof) | **FIXED** | No cutoff is left (`:27-35`). `provider-capacity.mjs` is walked through. `liveness.mjs` is no longer reached, because `e63a17b8e` moved the wording to `provider-auth-failure.mjs`. In scratch, pointing provider-capacity's import at `liveness.mjs` fails the test. |
| H2: banned modules and calls apply to the whole closure | **FIXED, with gaps** | `walk` scans every visited file (`:84-94`). The `process.kill(<ident>, 0)` exemption (`:79`) is narrow: `kill(pid,0); kill(pid,9)` fails and `kill(-g, 0)` fails. Signal 0 never delivers a signal. Forms that are missed are listed in the closure table. |
| H2: enumerator guard | **FIXED, with gaps** | `assignment-enumerator-guard.test.mjs` exists. Every ALLOWED entry has a reason, there is a stale-entry check, and the failure message names the fix (the control mutation printed it). Misses are listed in the guard tables and finding G1. |
| Low N3: future mtime | **FIXED** | Node `registrations.mjs:5759-5763`; test `observe-doctor-checks.test.mjs:284-285` covers +60 s, +61 s and +1 year. Rust `lib.rs` `is_recent`. Live probe on the host: result mtimes +1 y, +61 s, +30 s, −30 s and 2020 gave `recentRuns 2`, the correct pair. |
| Low N5: garbage timestamps | **FIXED, parity verified** | Shared fixture `expected.json`: 3 invalid timestamps plus 1 valid offset timestamp, read by both suites. I ran 20 extra timestamps (`T`/`t`, space separator, `:60`, `.Z`, 9-digit fraction, `+0100`, `+24:00`, `+23:59`, year 0000, 2024-02-29, 2100-02-29, `HH:MM` only, fullwidth digit, `ZZ`, surrounding spaces, `-00:00`, `+2026`, one-digit month) through Node `projectRunEligibility` and the host `metrics coverage`. Both gave 7 observed and 13 `invalid-timestamp`, and the Rust grammar (`time.rs:57-89`) matches the Node regex case by case. |
| Low N6: doctor wording untested | **FIXED** | `observe-doctor-checks.test.mjs:237-254` pins the `sample candidates (not confirmed missing): <path>` suffix and `difference 1`. |
| Live parity | **PASS** | forgentX: `runDirsSeen 1199 = 929 + 51 + 219`, and `find … -path '*/runs/*' -prune` gives 1199. mdview: `123 = 110 + 7 + 6`, and `find` gives 123. `checkObserveRunCoverage` with `FGOS_HOST_BIN` set to the debug host passed for both: forgentX Node 1199/929 = host, 775 ms; mdview 123/110 = host, 468 ms. |

### Discussion

| Item | Verdict | Probe |
|---|---|---|
| High N0: deleted stance and linkage tests | **FIXED, sensitive** | Scratch mutations: (1) `runPanel` drops `kind` (`panel.mjs:66`) → panel test fails; (2) `hasStance = false` → role-tasks and panel tests fail; (3) the summary drops `record.workflow` → `unit-summary.test` fails; (4) `run.mjs:242` writes `workflow: null` → the workflow test fails at `unitRecord.workflow` deepEqual (`workflow-runner.test.mjs:1250`). Mutation (4) is **not** caught by `run.test` or `unit-summary.test`; only the slow CLI test catches it. The echo worker now parses `Declared choices` from the real prompt (`:1213-1219`), so the phantom-worker problem is gone. Runtime problem: see T1. |
| Medium N2: legacy `solo` default flipped a unit | **FIXED** | `unit-summary.mjs` gives pattern `null`, then `undetermined` and kind `unknown`. Mutating back to `?? 'solo'` fails 3 tests. mdview `unit-run-1791130137844-2f787902/unit-summary.json` is now v2, `outcome undetermined`, `pattern null`, seats `unknown` (`producer:pass`, `red-team:pass`, `reviewer:blocked`). It is no longer `pass`. |
| Legacy reader accounting | **FIXED** | forgentX `metrics discussions`: `unitRuns 75`, `passed 23`, `failed 6`, `undetermined 46`, `passRate 23/29`. `summariesSkippedByReason {missing-timestamp: 4}`, with **no `invalid-contract`**. The 46 break down as 32 producer-only, 12 legacy panels and 2 producer+reviewer. CHANGELOG `:29` states "About 46 older forgentX units are now undetermined", so the loss is documented. |
| mdview Delphi runs | **PASS** | `--since=2026-10-05`: `1f688991` 1 unit / 0 seats (`policy-refusal`), `842d7c56` 8/9/1, `6466fc15` 10/11/1, `28f05967` 10/10/0. Attempts total 30. `metrics runs` for 10:25:29Z–11:20Z by role gives 6+6+8+5+5 = 30. |
| Low N3: one-vote genuineSplit | **PARTIAL** | The host probe gives: 0 valid → unmeasured; 1 valid → unmeasured; 2 valid of 3 → measured; 3 valid → measured. But **2 unanimous valid votes out of 4 or 5 seats → `genuineSplit: true`** (agreement 0.5 and 0.4). See Q1. |
| Low N4: version bump | **FIXED** | v2 contract, a reader-side `unsupported-version` reason, and contract file renamed. The CLI test was updated. |
| Low N5: reviewed resume | **FIXED (pinned)** | `reviewed.test.mjs` "resume keeps a complete round final but retries every unpassed seat…" pins both branches. The semantics did not change from round two; only a comment was added. |
| Low L4: unit.json write masks the error | **FIXED** | `run.mjs:555-561`. Mutating it back to an unguarded `settle()` fails the new `run.test` case. Residual: S1. |
| Backfill `--regenerate` | **PASS** | Read-only probe on forgentX. Default `--dry-run`: 81 units, 0 changed, 75 unchanged, 4 active, 2 unsettled. `--dry-run --regenerate` gives the same numbers, with 0 removed and 0 errors. The md5 of every `unit-summary.json` path, mtime and size was identical before and after. mdview `--dry-run --regenerate`: 0 changed, 48 unchanged. A bad flag prints usage and exits 2. It writes only `unit-summary.json` via `writeUnitSummary` or `rmSync` (`scripts/backfill-unit-summaries.mjs:83-89`) and skips active units in both modes. |
| M4: crashed-unit detection | **NOT FIXED (declared)** | It is still only `summariesMissing`. forgentX still has 4 legacy "active forever" units and mdview has 1 (`72e118ad`, which keeps a v1 `pass` and shows as `unsupported-version`). The repair report explains why; this is an owner decision. |

## Closure test: which forms are caught

I prepended or appended each form to `reconcile.mjs` (imports) or `process-identity.mjs` (calls) in scratch. Every mutated file passed `node --check`.

| Form | Result |
|---|---|
| Multi-line `import {\n a\n} from '…liveness.mjs'` | caught |
| `export * from '…'` | caught |
| Side-effect `import '…'` | caught |
| `import'…'` (no space) | **missed** |
| `import * as x from'…'` (no space) | **missed** |
| `const z = 1; import '…';` (same line, after a statement) | **missed** |
| Top-level `await import('…')`, which loads at import time | **missed** (dynamic import is documented as out of scope) |
| `import()` inside a function | **missed** (documented) |
| `createRequire(import.meta.url)('…')` | **missed** |
| Absolute-path specifier `import '/abs/…/liveness.mjs'` | **missed** |
| Package self-reference `import 'forgent/state/porting'` | **missed** (bare specifiers are never walked) |
| Text `from '…'` inside a template string (not a real import) | false positive (fails safe) |
| `process.kill(pid, 'SIGTERM')` | caught |
| `/* x */ process.kill(pid, 'SIGTERM')` on one line | **missed**: `codeOnly` (`:82`) drops any line that starts with `/*` |
| A continuation line starting with `* process.kill(…)` | **missed** (same filter) |
| `process['kill'](pid, 'SIGTERM')` | **missed** |
| `process.kill.bind(process)` alias, or `const { kill } = process` | **missed** |
| `import { spawnSync } from 'child_process'` (no `node:`) | **missed**. `\bspawn\(` does not match `spawnSync(`. The repo has 0 non-`node:` imports and 47 with `node:`, so this matters little in practice. |
| `import { execSync } from 'node:child_process'` | caught |

The exact-set assertion is the load-bearing proof, and it holds for every static form the repo's formatter produces. The gaps are formatting oddities and non-static loading.

## Enumerator guard: which forms are caught

Snippet-level, using the exported `assignmentListings`:

| Form | Result |
|---|---|
| `readdirSync(path.join(x,'assignments'))` inline | caught |
| `fs.promises.readdir(base)` | caught |
| `opendirSync` / `fsp.opendir` | caught |
| `readdirSync(base).filter(…)` | caught |
| `roots` array `for…of` loop | caught |
| Template literal `${fgosDir}/assignments` and `+ '/assignments'` | caught |
| Object property `P.work` | caught |
| `readdir(base, cb)` | caught |
| `ids.map((id) => readdirSync(path.join(base,id,'runs')))` | caught |
| `fs.globSync` / `fsp.glob` with `cwd: …assignments` | **missed** |
| `readdirSync(path.join(root,'.fgos'), {recursive:true}).filter(p => p.startsWith('assignments/'))` | **missed** |
| Callback parameter `[…assignments].forEach((d) => readdirSync(d))` | **missed** |
| Class method parameter | **missed** |
| Prettier-style multi-line `const base = path.join(\n root,\n 'assignments',\n);` | **missed**: `bindings()` stops at `\n` (`:156`) |
| `'assign' + 'ments'` | **missed** |
| `import { readdirSync as ls }` alias | **missed** |
| `execSync('ls .fgos/assignments')` | **missed** (admitted) |

Repo-level mutations in the scratch copy:

| Mutation | Result |
|---|---|
| Control: `const base = path.join(root,'.fgos','assignments'); fs.readdirSync(base)` in `registrations.mjs` | caught; the message names `scanAssignmentLayout`/`listAssignmentRuns`/`findRunDir` or ALLOWED with a reason |
| A: `src/util/list-dir.mjs` wrapper (3 lines) called from `registrations.mjs` with an assignments path | **missed** (admitted cross-file limit; the wrapper is not one line either) |
| B: a new whole-tree walker `function __walkAll(assignmentsDir){ for (… of fs.readdirSync(assignmentsDir)) }` in `operation-choice.mjs` | **missed**: the key equals an allowed key |
| C: `const runsDir = path.join(fgosDir,'assignments'); readdirSync(runsDir)` in `unit-summary.mjs` | **missed**: the key equals an allowed key |
| D: multi-line `path.join` binding in `registrations.mjs` | **missed** |

The practical miss rate is about 8 of 20 snippet shapes and 4 of 4 realistic repo-level evasions. Today there is no false negative in the repo: I checked every file that mentions `assignments` and lists a directory. It catches the most common future regression, a single-file walker in a new file built with a one-line `path.join`.

The nested-run behavioral test (`assignment-layout.test.mjs:65-87`) does cover `findRunDir`, `showRunUseCase`, `inspectDispatchRuntime` (by run and by cwd guard), `findRunningRuns` (runDir/runId/assignmentId) and `watchRunUseCase`.

## New findings

### Medium

**G1. The allow-list key does not identify a call site, so allow-listed files can grow new tree walkers silently.**
- Evidence: the key is `file: callee(firstArg)` and is collected into a `Set` (`assignment-enumerator-guard.test.mjs:239-251`).
- Mutations B and C (above) add complete `.fgos/assignments` walkers to `operation-choice.mjs` and `unit-summary.mjs`, and the guard stays green.
- Those two files plus `assignment-runner.mjs` are exactly where a new walker would most likely land.
- Fix: count occurrences per key and pin the count in ALLOWED, or key on the enclosing function name as well.

**G2. The multi-line binding miss is not disclosed.**
- Evidence: `bindings()` captures `[^;\n]+` (`:156`).
- Prettier wraps long `path.join(…)` calls this way. The repo has 0 such instances today, so this is a latent miss.
- The repair report lists only the cross-file case, glob and `child_process` as misses.
- Fix: join balanced parentheses before matching. Also add `glob`/`globSync` and `{recursive:true}` on `.fgos` to the detector, or document them as review-only.

**T1. The restored workflow test has no runtime bound. It hung for 43 minutes and failed once under parallel load.**
- Evidence: `workflow-runner.test.mjs:1201`. In the 10-file parallel run (while cargo was building) it failed after 2,581,942 ms with `handoff-ref-unresolved: role "panelist-1" round 1: no-report`. Alone it passes in 10.5 s.
- The fixture config inherits the default `runner.timeoutMs` (2,100,000 ms, about 35 min), so one stuck worker costs 35+ minutes before the test fails.
- I did not prove the cause.
- Fix: set a small `timeoutMs` in the fixture config (or `--test-timeout`), so a hang fails in seconds and points at the stuck seat.

### Low

**Q1. Two agreeing votes are still a "genuine split" in panels with more than 3 voters.**
- Evidence: `discussions.rs` `MIN_VALID_VOTES = 2` is absolute, while `genuineSplit = largest*3 < voters*2` counts missing votes in `voters`.
- Probe: valid a/a with 2 missing gives `agreement 0.5, genuineSplit true`; with 3 missing it gives `0.4, true`.
- Default 3-panelist panels are correct.
- This is the same class as round-two N3. Use a relative quorum (for example `valid*3 >= voters*2`), or document it.

**C1. Closure-scan evasions.**
- Evidence: `IMPORT_RE` (`:25`) requires whitespace and either a line start or `from`. `codeOnly` (`:82`) drops whole lines that start with `/*` or `*`, even when code follows.
- Forms that evade it are listed in the closure table.
- It is low risk because the repo's style never produces them, but a one-line `/* note */ process.kill(pid, 'SIGTERM')` defeats the ban.

**S1. A failed settlement write leaves the unit permanently "active".**
- Evidence: `run.mjs:555-561` warns and keeps `execution.status: running`. The new test asserts this (`run.test.mjs` "a failed settlement write…": `readRecord().execution.status === 'running'`).
- Backfill then skips the unit as active forever, which adds to the M4 population.
- This is acceptable as storage-failure behavior, but the warning should tell the operator how to recover.

**D1. The reconcile runtime boundary relies on grep.**
- Evidence: `visibility-session.mjs:299,303` dynamically imports the banned `herdr-round.mjs` and `assignment-runner.mjs` inside `reconcileRun`.
- That function is exported from a module inside the closure. Its only caller is `src/verbs/state/read.mjs:63`, not reconcile.
- Nothing stops a future reconcile change from calling it. The test comment (`:33-35`) overstates this ("asserted by the exact-closure test").

### Info

- I found 32 of the 46 undetermined forgentX units are producer-only. A finished producer-only unit with a passing producer and no checker dispatched could only be solo or a crashed reviewed run. The conservative choice is defensible and documented.
- `apps/fgos/tests/cli_tests.rs` edit (`:1107-1148`): justified. It is the host-level test of the same contract. The version bump and the 2-vote quorum would otherwise break it, and its assertions kept their strength (it adds a second voter and still asserts measured).

## Regressions and rules

- Removed tests in `b3346957a..HEAD`, each with a replacement of equal or greater strength:
  - Rust `recent_runs_…include_clock_skew` → `…bound_clock_skew`.
  - `reader_skips_missing_timestamps_bad_contracts_oversized_and_nested_summaries` → `reader_reports_root_wide_missing_and_unusable_summaries…`. The planted nested summary is kept (`unit_summary.rs:238-251`) and `oversized` is kept.
  - The nested-runs test now also covers `findRunningRuns`.
  - The role-tasks stance test was replaced (the roleTasks override was reverted by design).
  - The doctor tests "hiding a settled nested run" and "tolerates in-flight" → `:206`, `:221`, `:237`, `:255`, `:275`.
  - The workflow CLI test was renamed and strengthened.
  - Removed Rust helpers (`panelist()`, `read_summary()`, `seat()`) were refactored, not lost.
  - I found no net weakening.
- HIGH-radius edits:
  - `runUnit`: only the final `catch` and `writeJsonAtomic` changed, covered by the new test and its mutation.
  - `runReviewed`: comment only.
  - `runPanel`, `validateUnit` and the claim contract: untouched by these two commits.
  - Tests are green apart from T1's load hang.
- Labels: no plan id, phase number, audit label or finding code in added code, test names or the commit messages of `b3346957a..HEAD`. I grepped added lines for `[HMLN]\d`, `K\d`, `R\d`, `F\d`, `phase N`, `tsk-` and `acceptance`. The `(R1 / M10)` and `(F4 / R1 / R2)` labels in import-graph test names predate these commits.

## Verdict

**ACCEPT WITH FIXES.** Every round-two item is fixed or explicitly declared, and verified by independent probes and live parity. Fix G1 (allow-list key reuse) and T1 (unbounded workflow test) before relying on the guard or on CI time. Q1, G2, C1, S1 and D1 are non-blocking.

## Unresolved questions

- Owner: is a relative quorum wanted for panels with more than 3 voters (Q1), or is "≥2 valid" the intended product rule?
- Owner: M4 crash detection is still declared-only. Is the `startedAt + timeoutMs` "overdue" signal in backfill wanted?
