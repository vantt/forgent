# HARDEN T5 baseline: Execution Core, Dispatch and Confinement, Seat Binding, Run Result

Main SHA `af19e6de6`, one mailbox-only commit after the pinned `c129461af`; no file of this layer differs between the two. Measured 2026-11-04 17:56 to 18:35 (Asia/Saigon) on fg-server2. Load was 0.6 to 2.4 for every timing except the Node batch, which pushed it to 8.5 by its own concurrency. The per-file Node loop never saw load above 3.5.

Read-only research by a subagent for lead:HARDEN; saved by lead:HARDEN from the subagent's reply because the harness refused the subagent's own write. Inputs: [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 1, [T5 phase file](../261021-1118-harden-low-layers-bottom-up/phase-06-t5-execution-core-dispatch-seat-run-result.md), structure of the [T4 baseline](research-261103-1212-harden-t4-baseline.md).

## Summary

| Item | Value |
|---|---|
| Rust `packages/seat-binding/rust` | src 2 551 lines (7 files), tests 170 lines plus a 70 KB golden JSON of 82 cases; 13 tests pass, 0.04 s of test time, `cargo test` wall 4.1 s on a cold private target |
| Rust `packages/run-result/rust` | src 1 139 lines (2 files), tests 1 514 lines (2 files); 30 tests pass, 0.04 s of test time, wall 5.8 s |
| Node, execution core | `src/runner/execution` 32 files, 7 670 lines (top level alone: 21 files, 5 175) |
| Node, dispatch | `src/runner/dispatch` 54 files, 21 133 lines; `confinement/*` 10 files, 6 455 lines; facade `src/runner/dispatch.mjs` 69 lines |
| Node, seat client and doctor modules | `src/seat-binding/client.mjs` 173 lines; six doctor-side modules in `src/setup` 818 lines |
| Node total of the layer | about 35 500 lines (phase file said 33 741 for execution plus dispatch; dispatch is down 991 lines) |
| Node tests of the layer | 134 files, 2 435 tests, 0 fail; 144.2 s test time and 162.7 s wall in one batch; 669 s summed file by file; about 55 000 test lines |
| Doctor rows | 42 rows are the layer's; 3 of the whole run's 9 failing rows are the layer's, all machine state; whole `doctor --json` 89 s on the dev door |
| Seat host spawns per doctor run | 559 (62 + 460 + 36 `bind`, 1 `ladder`) |
| Msvc and darwin `cargo check` | 0 warnings from either crate |
| Dead code | 2 doors with no production caller (503 lines), 2 modules with none (227 lines), 29 more exports with none |
| Open backlog rows | 16 touch the layer |

Facts that matter most for the council:

1. **The layer is 91 percent Node by src lines.** The Rust crates are 3 690 src lines against about 35 500 Node lines. Seat Binding is the only decision logic already in Rust. Run Result is a twin: Rust reads and scores run records for metrics, while Node `run-result.mjs` (1 396 lines) writes and validates. Both derive outcomes and both walk the run layout, held together by two shared fixtures.
2. **Two giant functions carry the layer.** `executeAssignment` is about 1 136 lines (`assignment-runner.mjs`) and `runUnitBody` about 1 020 (`run.mjs`). `config.mjs` grew 263 lines since the phase file (1 842 to 2 105).
3. **The slow tests are seat launches, not sleeps.** `execution/run.test.mjs` (139.6 s) and `run-provider-failover.test.mjs` (123.6 s) are 39 percent of the summed time. The failover file has no sleep or wait helper; its 30 tests take about 4 s each, presumably real fake-agent launches at T4's 1.2 s per seat (not split further).
4. **The dev door costs 8.9 s per call** (`dispatch --help` alone). Working-tree route timings are that overhead plus 0.0 to 0.7 s, so the activated release was timed too. `fgos dispatch inspect --cwd .` is slow on its own at 5.0 s, because it lists every run directory (912 here).
5. **T4's carry items are all still open, and T4 depends upward on this layer.** `src/run-supervisor` imports 13 modules of `src/runner/dispatch`. The T1 modules `src/state/hot-lock.mjs` and `src/holder-lock/hold-transport.mjs` import `process-identity.mjs` from `src/runner/dispatch` (O-1 and O-2, section 6).

## 1. Lines of code

Counted with `wc -l`. Exports and importers are scripted greps, not a parser.

**Rust, seat-binding** (2 551 src lines): `rank.rs` 865, `model.rs` 716, `policy.rs` 358, `route.rs` 217, `tier.rs` 177, `explain.rs` 146, `lib.rs` 72. Tests: `tests/golden.rs` 170 over `packages/seat-binding/contracts/seat-binding.golden.v1.json` (82 cases) and `seat-binding.tier-ladder.v1.json`; inline unit tests: 4 in `route.rs`, 4 in `tier.rs`. Depends on `fgos-host-runtime`, serde and thiserror; host route `fgos internal seat-binding bind|ladder` at `apps/fgos/src/main.rs:207-213`.

**Rust, run-result** (1 139 src lines): `lib.rs` 918, `unit_summary.rs` 221. Tests: `layout_fixture.rs` 735 and `unit_summary.rs` 779, plus 3 inline tests in `lib.rs`. Depends on `fgos-host-runtime` and `fgos-observe`; wired at `apps/fgos/src/main.rs:284` (`scan_coverage`) and `wiring/metrics_sources.rs`. It is a metrics reader; no user route ends in it.

**Node, files of 450 lines or more** (exports, production importers, test importers, exports with no outside production use):

| File | Lines | Exp | Prod imp | Test imp | No outside prod use |
|---|---|---|---|---|---|
| dispatch/assignment-runner.mjs | 2202 | 17 | 4 | 20 | 4 |
| dispatch/config.mjs | 2105 | 44 | 49 | 45 | 11 |
| dispatch/confinement/authority.mjs | 1898 | 14 | 3 | 9 | 3 |
| execution/run.mjs | 1629 | 5 | 8 | 8 | 0 |
| dispatch/run-result.mjs | 1396 | 27 | 11 | 8 | 18 |
| dispatch/provider-credential-renewal.mjs | 1257 | 21 | 5 | 3 | 8 |
| dispatch/provider-capacity.mjs | 1029 | 37 | 22 | 16 | 9 |
| dispatch/assignment.mjs | 978 | 9 | 8 | 8 | 0 |
| dispatch/confinement/probes/harness.mjs | 851 | 15 | 2 | 3 | 12 |
| dispatch/settlement.mjs | 828 | 11 | 3 | 4 | 3 |
| execution/patterns/catalog-entries.mjs | 752 | 6 | 2 | 1 | 1 |
| dispatch/confinement/policies.mjs | 751 | 19 | 8 | 8 | 5 |
| dispatch/confinement/drivers/bwrap.mjs | 723 | 9 | 3 | 9 | 3 |
| dispatch/plan.mjs | 705 | 2 | 4 | 7 | 1 |
| dispatch/provider-adapter.mjs | 693 | 22 | 10 | 4 | 13 |
| dispatch/transport.mjs | 646 | 17 | 7 | 16 | 1 |
| dispatch/trust-store.mjs | 634 | 18 | 6 | 3 | 2 |
| dispatch/confinement/resources.mjs | 614 | 15 | 5 | 6 | 8 |
| dispatch/operation-prompt-templates.mjs | 590 | 15 | 3 | 1 | 11 |
| execution/patterns/catalog.mjs | 581 | 4 | 7 | 4 | 0 |
| execution/bind.mjs | 563 | 8 | 9 | 9 | 3 |
| dispatch/effective-execution-contract.mjs | 538 | 10 | 1 | 2 | 5 |
| dispatch/resolve.mjs | 513 | 6 | 13 | 7 | 2 |
| execution/seat-resolver.mjs | 508 | 23 | 21 | 7 | 3 |
| dispatch/cli.mjs | 502 | 8 | 4 | 3 | 1 |
| dispatch/herdr-round.mjs | 495 | 10 | 1 | 4 | 3 |
| dispatch/confinement/request.mjs | 475 | 4 | 2 | 10 | 1 |

Totals: execution 32 files, 7 670 lines, 182 exports; dispatch 54 files, 21 133 lines, 490 exports; confinement 10 files, 6 455 lines, 132 exports; seat client 1 file, 173 lines, 8 exports.

Against the phase file: `assignment-runner.mjs` 2 672 to 2 202, `cli.mjs` 1 100 to 502, `config.mjs` 1 842 to 2 105 (grew), `run-result.mjs` 1 379 to 1 396, confinement 6 011 to 6 455. Next-largest functions: `prepareConfinementForLaunch` 401, `assessAndPrepare` 394, `executeThroughConfinement` 375 (dead), `interpretRunResult` 361, `buildConfinementAttestation` 350, `settleRunOutcome` 336, `admitRunAttempt` 329.

Callers from outside the layer (files importing dispatch, then execution): `src/workflow` 19 and 13; other `src/runner` files 12 and 4; `src/setup` 11 and 6; `src/verbs/dispatch` 5 and 1; `src/run-supervisor` 6 (dispatch only); `bin` 2 and 1; `scripts` 4 and 2. The facade `dispatch.mjs` re-exports 40 names, with 3 production and 2 test importers.

## 2. Tests

### 2.1 Rust

Private target, `HERDR*` and `CLAUDE*` unset, load 0.6 to 0.7.

| Binary | Tests | Test time |
|---|---|---|
| seat-binding lib unit | 8 | 0.00 s |
| seat-binding `golden` | 5 | 0.04 s |
| run-result lib unit | 3 | 0.02 s |
| run-result `layout_fixture` | 13 | 0.01 s |
| run-result `unit_summary` | 14 | 0.01 s |

Wall was 4.1 s and 5.8 s with dependencies compiling in the same call. Neither crate is slow.

### 2.2 Node

The test set is 134 files chosen by name and import path: `test/runner/execution/**`, `test/runner/dispatch/*`, `test/seat-binding/*`, and the dispatch-, assignment-, provider-, run-result-, confinement-, tier- and credential-named files in `test/runner`, `test/setup`, `test/verbs` and `test/cli`. By grep, 194 files (3 291 tests) import layer code.

One batch through `scripts/run-tests.mjs`: 2 435 tests, 2 435 pass, 0 fail, 144.2 s of test time, 162.7 s wall (load 0.6 at start, 8.5 at peak from its own concurrency, 2.1 at the end).

File by file (each run adds about 1.5 s of startup):

| Group | Files | Tests | Time summed (s) |
|---|---|---|---|
| `test/runner/execution/**` | 35 | 622 | 397.2 |
| dispatch core and other | 64 | 1 148 | 196.3 |
| confinement | 13 | 254 | 23.2 |
| provider and accounts | 12 | 299 | 15.4 |
| run result | 5 | 74 | 26.4 |
| seat binding | 5 | 38 | 10.4 |
| **total** | 134 | 2 435 | 669.0 |

Slowest files:

| File | Tests | Test time |
|---|---|---|
| `execution/run.test.mjs` | 87 | 139.6 s |
| `execution/run-provider-failover.test.mjs` | 30 | 123.6 s |
| `spawn-worker.test.mjs` | 18 | 53.7 s |
| `execution/run-sync.test.mjs` | 22 | 36.7 s |
| `execution/run-case-admission.test.mjs` | 21 | 33.7 s |
| `assignment-dispatch.test.mjs` | 49 | 26.8 s |
| `driver-rununit.test.mjs` | 18 | 26.6 s |
| `assignment-runresult.test.mjs` | 49 | 25.5 s |
| `execution/run-resume-order.test.mjs` | 4 | 18.4 s |
| `dispatch.test.mjs` | 283 | 13.9 s |

The top 5 files are 58 percent of the summed time, and 74 of 134 files run in under 0.5 s. In the batch, 191 tests take over 1 s and 24 over 5 s; the slowest is 10.8 s.

Run findings:
- **Flake candidate:** `spawn-worker.test.mjs` failed 1 of 18 in the per-file pass, then passed 18 of 18 on a rerun and in the batch. Which test failed was not captured.
- **Leak ERROR:** it appeared on the batch and on 15 per-file runs. The two read name only `.fgos/runtime/mailbox/mail-taken`, a mailbox file another session writes; `usage-parsers.test.mjs` (a 0.2 s pure test) was flagged once and ran clean on rerun. Treated as one cross-session write, not a leak of these tests.
- **Waits:** 117 lines in `test/runner/**` and `test/seat-binding/**` name `setTimeout`, `sleep(`, `Atomics.wait` or `waitFor` (`run.test.mjs` 13, `spawn-worker.test.mjs` 2). The slow failover, sync and admission files have none.

### 2.3 Behaviours proven in both Node and Rust (labels, not verdicts)

| Behaviour | Rust proof | Node proof |
|---|---|---|
| Seat binding decision | `golden.rs` 5 tests over 82 cases | `bind` 64, `bind-committed-config` 8, `bind-tier-composition` 1, `tier-fallback` 8, `seat-policy` 5, `explain` 6, `seat-binding-dry-bind` 18, `tier-fallback-config` 11, `tier-cell` 21; `client.test.mjs` 13 replays the golden base through the host |
| One host exec per bind, none under the hot mutex | none | `exec-budget.test.mjs` (1 test, 6.6 s); `client.test.mjs` owns the in-lock refusal |
| Outcome derivation | `lib.rs` 3 tests over `test/fixtures/run-outcome/legacy-derivation.json` | `run-outcome.test.mjs` 5 over the same fixture; `run-result-v3-reader` 4 |
| Run layout walk | `layout_fixture.rs` 13 over `test/fixtures/run-layout/expected.json` | `assignment-layout.test.mjs` 8 |

The Run Result twins share fixtures, so one side can be retired without losing the proof. Seat Binding has the opposite shape: one Rust decision with about 190 Node tests around it.

## 3. Routes and verbs

The layer's doors are `fgos run`, `fgos dispatch show-run|inspect|watch|recover|reconcile|decide|explain|probe-account`, and `fgos internal seat-binding bind|ladder`.

**Activated release latency**, 30 runs each (p95 is the 28th of 29 sorted warm runs), load 1.1 to 2.0. Binary `.fgos/installation/bin/fgos`, activated 11:27 today; it predates T4 changes in `assignment-runner.mjs`, so it is not exactly main. The verbs below read `dispatch/config`, `resolve` and `runtime-inspection`, which did not change.

| Route | First ms | p50 ms | p95 ms |
|---|---|---|---|
| `internal seat-binding ladder` | 2.1 | 1.7 | 4.6 |
| `internal seat-binding bind` (3.9 KB golden config) | 2.0 | 2.1 | 4.5 |
| `dispatch --help` | 130 | 123 | 134 |
| `dispatch reconcile plan` | 127 | 128 | 133 |
| `dispatch inspect --provider-capacity` | 161 | 155 | 171 |
| `dispatch show-run <run id>` | 237 | 211 | 221 |
| `dispatch decide claude` | 243 | 232 | 260 |
| `dispatch explain --for implementation` | 241 | 247 | 268 |
| `dispatch inspect --cwd .` | 4 977 | 4 972 | 5 030 |

"First" is the first call after a pause, not a cold OS cache.

- **Working-tree debug host, bind route:** ladder p50 2.2 / p95 6.0, bind p50 5.7 / p95 11.0. SEAT recorded p50 3.71 / p95 4.23 on a release host with a 22 KB config; not the same load.
- **Working-tree door** (`npm run fgos:dev --`, 6 runs, load 1.1 to 2.4): `dispatch --help` 8 917 ms (the fixed door overhead), `reconcile plan` 8 916, `decide claude` 9 224, `show-run` 9 247, `explain --for implementation` 9 599 (max 10 304). The first call after a cargo build took 14.6 s.
- **`dispatch inspect --cwd .`:** `runtime-inspection.mjs:276` lists all runs and then filters, so it is linear in run directories (501 `asgn_*` and 411 `unit-*` here).
- **Not measured:** `fgos run` and any `runUnit` timing (needs a real agent dispatch and a herdr pane or bwrap launch), `dispatch watch`, `recover` with an action and `reconcile apply` (write), `probe-account` (real provider CLIs), and the per-seat launch cost (T4 has 1.2 s per seat).

## 4. Doctor rows

A clean `fgos doctor --json` through the dev door: 147 rows, 138 pass, 9 fail, 89 s wall at load about 1. T4's 51 s was on the activated release, so the two are not comparable.

Per-row time is not in the output; it was measured with a scratch `NODE_OPTIONS=--import` hook that wraps each check with a timer (second run, 90 s, row sum 80.7 s). The hook breaks the two confined probe rows, so their times are excluded and their status is from the clean run. The 42 rows are matched by id pattern, not an ownership list; the codex, agy, omp and pi hook rows are not counted.

| Row | ms | Clean-run status |
|---|---|---|
| `blind-steps-use-proven-pools` | 9 312 | pass |
| `seat-binding-dry-bind` | 1 076 | pass |
| `confinement-probe-freshness` | n/a (hook) | pass |
| `dispatch-decide-hook-wired` | 592 | pass |
| `executor-posture-coverage` | 502 | pass |
| `runner-patterns-config` | 241 | pass |
| `confinement-blind-read` | n/a (hook) | pass |
| `herdr-executor-kinds` | 57 | pass |
| `confinement-strict-readiness` | 22 | pass |
| `executor-profile-warnings` | 16 | **FAIL** |
| `executor-skills-installed` | 5 | **FAIL** |
| `agent-cli-project-trusted` | 4 | **FAIL** |
| 30 other rows | under 20 each, about 150 together | pass |

Total for the 40 timed rows is about 12.0 s, of which `blind-steps-use-proven-pools` is 9.3 s. The three failures are machine state, not code: `executor-skills-installed` (openai declares `ak:cook` but `.agents/skills/ak-cook/SKILL.md` is absent); `executor-profile-warnings` (6 informational legacy-profile warnings, reported as a fail); `agent-cli-project-trusted` (codex has no trust entry for this checkout). The other six failing rows of the run (`shell-integration-sourced`, `tool-registry-configured`, `work-step-vocabulary`, `mailbox-sync-timer`, `doc-current-path-missing`, `doc-source-conservation`) belong to other layers.

- **Seat host spawns:** `blind-steps-use-proven-pools` accounts for 460 of the 559 spawns, about 20 ms each on the debug host; `seat-binding-dry-bind` 62; `executor-posture-coverage` 36. One bind per host exec is the client contract.
- **Retired and absent rows:** `seat-binding-config`, `seat-binding-drain` and the phase file's `runner-coordination-orgPolicy-shape` no longer exist. The surviving seat rows are `seat-binding-route`, `seat-binding-dry-bind` and `blind-steps-use-proven-pools`.
- **`shadow-binder-divergence`:** no event recorded on this machine.

## 5. Received items and their state on main

| Received item | State | Evidence |
|---|---|---|
| Grace versus agent-ready rule (T2 D-T2-7) | Still true | `herdr-deadlines.mjs` (7 lines, `READY_TIMEOUT_MS`) has one consumer, `src/setup/terminal-control-checks.mjs:14`. |
| T2 §5(1) class-B herdr callers | Still true, new positions | `assignment-runner.mjs:2017-2033`, `cli.mjs:426-454`, `worker-session-boot.mjs:120-167` (spawns `herdr server` directly), `herdr-round.mjs:384-453`, `terminal-slot.mjs:14-68`, `run.mjs:109-115`, `confinement/resources.mjs:317,392`. `legacy-sweep.mjs` is gone (T4). |
| T2 §5(2) name-sniff, `parseHerdrUsage` | Still true | `settlement.mjs:759` (`resolvedExecutorId?.includes('herdr')`); `usage-parsers.mjs:142` returns all nulls. |
| T2 §5(3) `herdrSpawnAdapter` | Still true, moved | `transport.mjs:618-624` rejects with `herdr-spawn-supervised-only`; registered at `:642`; one 2-test file. |
| T2 §5(4) E-3 consumers re-parsing Git addon errors | Mostly moved | `nativeError()` in `src/git/native.mjs` is used by `merge.mjs:110,729` and `commit-unit-work.mjs`; `verbs/events/migrate.mjs` is deleted (`b6927cce9`); `src/event-store/native.mjs:32` still regex-parses the message. |
| T2 §5(5) 558 seat spawns per doctor | Still true | 559 measured. |
| H20 `lock-wait.mjs` | Still true | 24 lines, test 53 lines, caller `bin/fgos.mjs:103`. |
| T3-04a wording lists | Partly done | Still present: `provider-auth-failure.mjs` (69 lines) and its test (10 tests); text rules in `provider-capacity.mjs:970-996` (typed `stopCause` given, text fallback remains); `provider-credential-probe.mjs:24` and `provider-account-probe.mjs:26` each hold their own `QUOTA_PATTERN`. Moved: `settlement.mjs:633-652` no longer holds rules and calls the classifier with `stopCause`. |
| T3-04a stale-result guard and claim lookup | Still true | `herdr-round.mjs:351-361` (`existsSync`); `worker-artifacts.mjs:39-60` picks the highest `result-N` with `Number()` over `readdirSync`. |
| T3-04a addendum: outbox readers follow symlinks, unbounded, leading zeros | Still true | `worker-artifacts.mjs` and `settle-attempt.mjs:114-121` use `readdir` and `existsSync` with no `lstat`. `assignment-layout.mjs` does refuse symlinks. |
| T3-04a addendum: delete `UnitSummarySource`, `projectRunEligibility`, `isRfc3339Instant` | Done | No match in `src`, `packages` or `apps`. |
| T4 H-T4c `cleanup-trust` lost update | Still true | `trust-store.mjs` has no lock; `cleanup-trust.mjs` calls `removeTrust`. No backlog row found in `docs/backlog.md`. |
| T4 H-T4d text judge in `provider-capacity.mjs` | Still true | `stopCause` and `capacityEvidenceText` exist (`:956-958`) and the text fallback remains. |
| T4 H-T4e `cliSpawnAdapter` short calls | Still true | Registered as `DEFAULT_ADAPTER` in `transport.mjs`. |
| T4 H-T4f pane allocated before the envelope | Still true | Allocation at `assignment-runner.mjs:2004-2033`. |
| T4 dead door `executeThroughConfinement` | Still true, bigger | `authority.mjs:913`, 375 lines; export `dispatch.mjs:46`; `test/architecture.test.mjs:346,352,414`; 39 calls in 6 test files. A second door has the same shape: `finalizeConfinementResources` (`authority.mjs:1689`, 128 lines) has no production caller and 3 test files use it. |
| T4 `resolveWorkerArtifactPath` | Still true | Used by `settle-attempt.mjs:119` and `findWorkerClaim`; goes with H-T4e. |

## 6. One-door observations

- **O-1, T0 code in a T5 directory.** `src/runner/dispatch/process-identity.mjs` (29 lines, a client of `packages/process`) has 15 production importers, including `src/state/hot-lock.mjs` and `src/holder-lock/hold-transport.mjs`. It belongs next to `src/native/door.mjs`.
- **O-2, T4 imports T5.** `src/run-supervisor` imports `cwd-lock`, `dispatch-error`, `proof-helpers`, `process-identity`, `run-result`, `config`, `settlement`, `run-lock`, `provider-adapter`, `stray-writes`, `worker-artifacts`, `trust-store` and `confinement/authority`.
- **O-3, hand-rolled atomic writes.** Ten layer files write a temp file and rename it outside the durable door: `visibility-session.mjs:94`, `trust-store.mjs:82`, `reconciliation-planner.mjs:266,331`, `execution/unit-summary.mjs:196`, `execution/run.mjs:63`, `confinement/attestation-store.mjs:188,216,315`, and several sites in `provider-credential-renewal.mjs`. The door (`replaceDurably`, `installOnce` in `src/native/door.mjs`) is used by `provider-capacity.mjs`, `run-lock.mjs`, `proof-helpers.mjs` and `gateway-control.mjs`. The phase constraint says these T0 carries must be closed before T5.
- **O-4, run result twice.** Node `run-result.mjs` against Rust `derive_outcome` and the run scan, held by two shared fixtures. Pick one owner of outcome derivation before moving either.
- **O-5, one shadow binder remains.** `transport.mjs:205-231` renders the claude argv twice and falls back on mismatch, with doctor row `shadow-binder-divergence`. This machine has recorded zero divergences. The backlog row `tsk-p7-shadow-binders` still names `placement-policy.mjs`, which no longer exists.
- **O-6, quota wordings in three places.** `provider-auth-failure.mjs` (`QUOTA_LIMIT_PATTERNS`) plus a private `QUOTA_PATTERN` in each of `provider-credential-probe.mjs` and `provider-account-probe.mjs`.
- **O-7, config reading is one door inside the layer.** Four importers of `src/config/facade.mjs`: `cli.mjs:21`, `config.mjs:30`, `provider-capacity.mjs:9`, `shipped-catalog.mjs:4`. No layer file reads `config.json` by path. `config.mjs` still carries 2 105 lines of cross-field validation (`validateRunnerConfigShape` 230 lines, `validateRunnerPatternsShape` 153).
- **O-8, process liveness is clean.** No `/proc` read or `kill(pid, 0)` in layer code, apart from two `/proc/$$/fd` shell snippets in `bwrap.mjs` and the probe harness.
- **O-9, adapter chosen by string sniffing** at `settlement.mjs:759`, next to the declared `locus` metadata on the adapters.

## 7. Dead code

| Item | Lines | Callers |
|---|---|---|
| `executeThroughConfinement` (`authority.mjs:913`) | 375 | none in production; 39 test calls, 3 architecture rows, one facade export |
| `finalizeConfinementResources` (`authority.mjs:1689`) | 128 | none in production; 3 test files |
| `dispatch/prepare.mjs` (`prepareDispatch`) | 49 | none anywhere; only string references in `dispatch-reconciliation-import-graph.test.mjs` |
| `dispatch/recovery.mjs` (`assess`, `ASSESS_OUTCOMES`) | 178 | none in production; `dispatch-effect-guarantee.test.mjs` (15 tests); `src/runner/recovery.mjs` is the live one |
| `assignment-runner.mjs:213` `isSubstantiveEvidenceRef` | about 10 | none anywhere |
| `operationDeclaresWorkProduct`, `tierCellMissingDetail`, `selectConfinedInvocationId`, `normalizeRunResultV4`, `OUTCOME_CATEGORIES`, `hasOperationPromptTemplate`, `readSecretSideFile`, `patchCommandRecord`, `readCommandState`, `CONSENT_STALE` | small | none anywhere, not even tests |
| Test-only exports: `loadAttestationRecord`, `createRedactedAttestationReference`, `clearProbeCache`, `registerBackendDriver`, `acquireDispatchCwdLock`, `renderEffectiveContractSummary`, `attributeClaimEvidenceRefs`, `ATTRIBUTION_LEVELS`, `isProviderDisallowed`, `getProviderPolicyShapedFlags`, `supportsPolicyTier`, `deriveLegacyOutcome`, `createRunsCache`, `markDetached`, `seatPolicy` and two reset hooks | small | tests only |

The scan is name-based over 29 exports; the first four rows were verified by reading callers, and it misses dynamic use. `legacy-seat-read.mjs` (215 lines, 7 production importers) is not a delete candidate: SEAT-TRIM records an owner decision (10-21 18:30) to keep it as the single reader for about 1 900 old run records.

## 8. Backlog and board

Open `docs/backlog.md` rows touching the layer (all `proposed`):

| Row | Touches | State |
|---|---|---|
| `p-d2dc4f2e` | herdr seat never starts, brief typed into the shell | open |
| `p-4bkfiw7d3j` | agent loses pane foreground about 7 s in | open |
| `p-fimvrao5qk` | confined session recognised only by `FGOS_CONFINED=1` | open |
| `p-c3a41d07` | ownership marker bound to its pane late (`cleanup.mjs:72-81`) | open |
| `p-cf1280a6` | codex trust prompt once | open, not reproduced |
| `p-c7e90b52` | omp and pi hook commands resolve from session cwd | open |
| `tsk-p7-shadow-binders` | names `placement-policy.mjs` (gone) and `resolveVerifiedProviderArgs` (still there) | half stale |
| `p-e6425aa9` | five dispatch-liveness follow-ups from 2026-09-29 | stale, predates the supervisor |
| `p-3e6b1a52` | remove `legacyPersonaProjection` (`assignment.mjs:639,701,703`) | open, function still there |
| `p-mvc3d54cda` | no token usage for omp, pi, agy runs | open |
| `p-1837c4c7` | a pi-backed run keeps no transcript | open |
| `p-3c7681b8` | a test leaks coordination session fixtures | open |
| `p-a189ff31` | confined worker can read the gateway token | likely fixed in effect (token moved to `private/gateway-token`, `relocate.rs:169`; `{home}/.fgos/private` is in `MACHINE_PRIVATE_ROOTS`); not proven by a confined read |
| `p-8da4b370` | executor command and args from a pulled project config run unapproved | open |
| `p-zpgzqdoy4z` | pattern deviation not gated by admission | open, Workflow-adjacent |
| `p-68be2ae3` | `doctor --fix` is all-or-nothing | open |

Board: SEAT closed 10-25 and SEAT-TRIM done 10-24, so T5's start condition is met. MP-B3 and MP-C are held and MP-COST is not planned; they touch `provider-capacity.mjs`. TRUST is not planned (`seedWorkspaceTrust` in `herdr-round.mjs`). COOK P6 is done. TEST is running. WORK and AGENT-WF stay out of scope. The gate-door plan (`plans/261030-1029-harden-gate-door-two-levels`) builds after T5 and is not in this layer's files. The shared-file list names `src/setup/registrations.mjs`, `bind.mjs` and the area specs, so DOC is told before a spec merges.

No settled T5 shape exists: the runner, seat-binding and confinement specs state no Node budget or size target for this layer. The closest is SEAT's "Node net about +150" for its facade, from the board.

## 9. Things to know

- Nothing was dispatched: no agent, seat, run, pane or daemon. The private Cargo target was deleted after the CACHEDIR.TAG check.
- Side effects, all under gitignored `.fgos/`: test fixtures; one mistyped flag (`dispatch inspect --capacity`) added an entry to `.fgos/logs/invocation-faults.jsonl`; the dev door created and removed `.fgos/runtime/dev-host/run-*`. No tracked file changed.
- Not measured: `fgos run`, `runUnit`, `probe-account`, `watch`, the write verbs, per-seat launch cost, and a confined read of the gateway token.
- Test-selection caveat: the 134-file set was picked by name, so some chosen files also cover other layers and a layer test under another name may be missing.
