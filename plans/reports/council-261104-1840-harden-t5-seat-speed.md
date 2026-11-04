# HARDEN T5 council, SPEED seat: Execution Core, Dispatch and Confinement, Seat Binding, Run Result

Seat lens: speed and weight, measured. Main `af19e6de6`, machine fg-server2, 2026-11-04 18:41 to 18:55 (Asia/Saigon). Every timing below states the load average at its start (1.6 to 3.3 on 24 cores; no run of mine pushed it above 3.3). Nothing was dispatched to a real provider: no agent, no real account, no herdr pane. Fixture runs use the test suite's fake agents inside bwrap.

## What I ran
- Read: council brief, baseline (whole), `blind-steps-proven-pools.mjs`, `seat-binding/client.mjs`, `seat-binding-checks.mjs` registration, `bind.mjs` `explainSeat`, `runtime-inspection.mjs` (whole inspect path), `door.mjs` addon load, `provider-credential-renewal.mjs` `refreshAhead` and its call site `assignment-runner.mjs:1790-1822`, `authority.mjs` `verifyRequiredProbe`, `attestation-store.mjs` probe cache, `failover-fixture.mjs`, `run-provider-failover.test.mjs` head, wait sites of `run.test.mjs` and `spawn-worker.test.mjs`.
- Skimmed by export only (not read whole): `assignment-runner.mjs`, `config.mjs`, `run-result.mjs`, `authority.mjs` outside the probe path, all Rust, the other 120 test files. This is a speed seat: Part A is a speed view of each component, not a full target shape.
- Measured with: `strace -f -ttt -e trace=execve,exit_group` and `fsync` counts around one failover test; `node --cpu-prof` through `NODE_OPTIONS` on two failover tests, on `loadRunnerConfigForDir`, and on `inspectDispatchRuntime`; scratch test files under the session scratchpad (outside the repo) run through `scripts/run-tests.mjs`; `spec` reporter for per-test times of the three slow files. No repo file changed; no Cargo target created.
- strace inflates wall time (about 1.5x to 2x on exec-heavy sections). Strace figures are for shape; unstraced figures are marked.

## The split that answers the brief: who pays what

| Cost | Who pays | Measured |
|---|---|---|
| Debug addon hashing: `door.mjs:71-72` sha256 of the whole addon per Node process | **Test suite only** | staged debug `fgos.node` is 184 MB, sha256 130 ms (3 runs); activated release addon is 16 MB, 8 to 13 ms. Per attempt the supervisor starts two Node steps (`settle-attempt`, `finalize-home`), so about 0.26 s of a 1.1 s attempt is this hash in tests, about 0.02 s in a release |
| Confinement probe harness, cold state root | Tests pay it once per test file process (cache holds across tests of one file, 5-test run showed about 1.5 cold sets); user pays it once per hour per fingerprint | `runAllConfinementProbes` 622 ms standard, 900 ms blind, flat over 3 repeats (load 1.6). TTL is `DEFAULT_PROBE_CACHE_TTL_MS` 1 h, `attestation-store.mjs:273` |
| `run-tests.mjs` startup (cargo build checks, addon staging, snapshot of `.fgos`) | Tests | about 1.9 s before the first test line of a one-file run (strace timeline); cpu profile: `stageDoorManifest` 0.6 s, `snapshotFgos` 0.5 s |
| Per-test fixture (git init, worktree add, config files) | Tests | about 0.4 s of each failover test (cpu profile: `git@failover-fixture` 141 ms per 2 tests plus `process-tmp-root` seal scan 189 ms per 2 tests) |
| Durable writes (`replaceDurably`, `installOnce`, fsync) | **User and tests alike** | 128 fsyncs for one 2-attempt test: 83 in the test process (0.60 s), 23 in `supervise` (0.18 s), 19 in the two steps (0.15 s). About 7 ms each on this ext4 NVMe, about 64 per attempt, about 0.45 s per attempt. Biggest single user-paid item I found |
| Git reads through the addon facade (`facade.<computed>` at `inspect.mjs:15`) | User and tests | 878 ms over 4 attempts in the test process: `resolveGitRoots` (`run.mjs:121`) 235 ms per run, `checkoutDirtyPaths` before and after the agent (`stray-writes.mjs:34`) 229 ms, `resolveRepoRoot` 108 ms. About 0.2 s per attempt |
| Config read, first call in a process | User | `loadRunnerConfigForDir` 226 to 232 ms first (128 ms is addon load incl. the debug hash, rest is `facade.readConfig`), 4.2 ms after (5 runs, load 2.4). In a release the hash share is about 10 ms, so a cold `fgos run` pays roughly 100 ms; not measured on a release |
| Seat Binding host exec | User | 2.1 ms p50 release (baseline); one exec per bind, 15 execs across 5 fixture tests (about 1.4 per attempt), under 0.5 percent of an attempt |
| Credential refresh-ahead before launch | User, only when the token is in its window | `assignment-runner.mjs:1806` awaits `refreshAhead` on the launch path: fast exit when outside the window, otherwise an account lock wait up to `probeTimeoutMs` + margin and a real provider CLI probe up to `DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS` 90 s (`provider-credential-probe.mjs:25`). Not run (needs a real account); unreproduced |
| Doctor spawns | User running `fgos doctor` | see Finding S-1 |

Per-attempt shape in a fixture run (strace, load 2.0, first fgos launch at +4.1 s): `supervise` 0.93 to 1.01 s, of which `settle-attempt` step 0.47 to 0.56 s (about 0.19 s of it before its first git call: Node boot, 60 ms of imports, addon hash), `finalize-home` 0.22 to 0.24 s, the fake agent 0.04 s. After the first attempt the next bind to the next `supervise` is 0.6 s. Unstraced, a 1-attempt failover test is 1.5 to 1.9 s, a 2-attempt test 2.4 to 3.1 s: **about 1.1 s marginal per attempt, about 0.4 s fixed per test**.

## Part A: speed view of each component's target shape

1. **Execution Core (`runUnit`).** Authority: turn a Unit into attempts. Speed shape: the user-paid prelude before the first launch is `resolveGitRoots` + config read + bind + confinement preparation. Keep it; the only structural speed change is not paying for the same git facts twice (S-5). No Rust move is justified by speed: the 1.1 s per attempt is fsync, process starts and the settle steps, not Node logic.
2. **Dispatch.** Authority: decide and inspect. Speed shape: read routes should be linear in what they report, not in all history (S-2). The decide/bind seam stays one host exec per bind (2 ms); the cost problem is callers that bind repeatedly for information they already have (S-1).
3. **Confinement.** Authority: attest and prepare. The probe set (16 bwrap launches, 0.6 to 0.9 s) is cached per fingerprint for 1 h; that is right. It runs with `spawnSync` on the runner's event loop, so a parallel panel's other seats stall for that time; the cache makes it rare, so leave it.
4. **Seat Binding.** Already Rust, 2 ms per call; nothing to move for speed. The speed work is on its callers.
5. **Run Result.** The Rust crate is a metrics reader, 0.04 s of tests. Node `interpretRunResult` costs about 1.2 ms per call and is called four times per run by `inspect --cwd` (S-2).

Node budget, delete list and doctor rows are in the sections below; I give only numbers I could measure.

## Part B: findings

Severity bar: High = a measured cost that a user or the suite pays on every use and that has a small local fix; Medium = measured, bounded; Low = measured, small.

**S-1 (High, reproduced): `blind-steps-use-proven-pools` spawns 460 host processes where 56 would do.** `candidatesForRole` (`src/setup/blind-steps-proven-pools.mjs:80-84`) calls `explainSeat`, but only reads `ranked.candidates`, `ranked.skipped` and `launchView`. `explainSeat` (`bind.mjs:545-561`) does one `decide`, then walks the whole fallback chain with one more host `bind` per candidate (`bind.mjs:554-558`) and discards the chain. Measured over the 7 blind units: 28 seats, each asked in 2 sessions (`SESSIONS`, `blind-steps-proven-pools.mjs:35`) = 56 `explainSeat` calls; chain length 5 (4 seats) or 7 (24 seats), and `ranked.candidates.length` equals the chain length in every one of the 28 asks, so the walk adds nothing the check uses. Counted by strace: 522 `seat-binding bind` execs for this row plus `seat-binding-dry-bind` (62), consistent with the baseline's 460 + 62. Row time 8.3 s under strace, 9.3 s baseline unstraced (load 3.2). Failure scenario: none, it is only slow; but it is 9.3 s of the layer's 12.0 s of doctor time, and `fgos doctor` is the first thing run on a new machine. Fix: a `chain: false` option on `explainSeat` (or export `decide`'s output through it); it replaces the walk for the one caller that does not want it. Expected: about 56 spawns, about 1 s. Not measured after the change (I did not edit code).

**S-2 (High, reproduced): `dispatch inspect --cwd .` reads and interprets every `result.json` four times.** `runtime-inspection.mjs:275` calls `result(l)` in `active`, `historicalRunIds`, and twice in `historicalRunResults`; `result()` (`:79`) re-reads the file and runs `interpretRunResult` (`run-result.mjs:768`, 361 lines) each time. Strace of one call: 370 distinct `result.json` files, each opened exactly 4 times; cpu profile of the call: 1 855 ms of 1 986 ms is `result` -> `interpretRunResult` (about 1.2 ms per call over 1 480 calls). Listing 782 run directories costs only 39 to 46 ms (`allRuns`), so the baseline's explanation ("slow because it lists every run directory") is not the cause: it is the per-run result reading, on the 372 runs bound to this workspace. Wall 2.03 s in-process at load 2.4 (release door 5.0 s in the baseline: the rest is door and process cost, plus a different state). Fix: compute `result(l)` once per run (a `Map` over `found`) and keep `present` separate from `value`; expected about 0.5 s of the 2.0 s. Growth: linear in the runs of the workspace, and `.fgos/assignments` is never pruned (782 run dirs here), so the cost only grows. Whether anything is meant to prune it is a question for the owner (see Proposed).

**S-3 (Medium, reproduced): test floor is serial real launches, not waits.** Per-test times (spec reporter, load 0.9 to 2.9):
- `run-provider-failover.test.mjs`: 30 tests, 111 s wall, one file process, tests run one after another. Range 0.19 s (refused before any run) to 8.5 s; two-attempt tests 2.4 to 3.9 s; walks across three entries 5 to 8.5 s. No `sleep` or timer in the file. It cannot run its tests concurrently inside the file because the fixture sets `process.env.HOME` per test (`failover-fixture.mjs:165`) and the test `after` restores it; so the only parallelism available is across files.
- `run.test.mjs`: 87 tests, 120 s (122.7 s reported at load 2.9), 47 under 1 s, 26 between 1 and 3 s, 14 at 3 s or more (those 14 are 59 s). One deliberate wait: `verify command that outlives runner.timeoutMs` sets `timeoutMs: 4000` and a 9 000 ms child (`run.test.mjs:1883-1888`), 5.6 s. Other timers in the file are `waitForFile` polls of 50 ms (`:1548-1552`), not floor.
- `spawn-worker.test.mjs`: 18 tests, 56 s. About 15 s is deliberate clock time: `timeoutMs: 3000` twice (`:223`, `:268`), idle test 10.5 s with `idleTimeoutMs: 1500` and `timeoutMs: 2500`, `20000` (`:294-307`). The rest is launches (1.6 to 4.8 s each).
- A full batch finishes in 162 s because the longest file is 140 s; **the suite wall is set by the single longest file**, with 24 cores otherwise idle. Splitting `run.test.mjs` (87 tests) and the failover file (30 tests) into 3 to 4 files each, grouped by fixture, would move the floor from about 140 s to about 56 s (the next file is `spawn-worker` at 54 s), without changing any assertion. Estimate, not measured by me; the arithmetic is the per-test sums above.

**S-4 (Medium, reproduced): a debug-profile test addon costs 130 ms per Node process.** See table; every test that launches a seat starts about 2 to 3 Node processes that hash the 184 MB addon. If the staged test addon were built in a lighter profile, or the digest check were keyed on the stat identity across processes (a per-process memo exists, `door.mjs:73`; across processes none), about 0.26 s of each 1.1 s attempt would go. This is a test-staging decision, not a production one: the release path hashes 16 MB in 10 ms, so I do not propose touching `door.mjs` verification for speed. Candidate for the TEST lane.

**S-5 (Medium, reproduced): the same git facts are read again and again on one launch.** In the cpu profile of two tests (4 attempts), `resolveGitRoots` (`run.mjs:121`) 235 ms, `resolveRepoRoot` (`paths.mjs:32`, from `resolveMutatingCwdPosture`) 108 ms, `checkoutFacts` -> `currentHead` -> `resolveRefSha` (`worktree.mjs:46,402,411`) 229 + 90 ms, each a native facade call. The post-run strace shows 18 bwrap-wrapped `git` execs in the settle step within 150 ms. No single call is slow; the sum is about 0.2 s per attempt. Not proposing a cache (stale-fact risk is a correctness question for the correctness seat); noting it as a place the one-door principle would also save time: one facts read per launch handed to its consumers.

**S-6 (Medium, unreproduced): credential refresh-ahead is on the launch path.** `assignment-runner.mjs:1806` awaits `opts.providerCredentialRenew` for every renew source before the agent starts. When the token is in its window it takes the account lock (waits up to `probeTimeoutMs` + `LOCK_MARGIN_MS`, `provider-credential-renewal.mjs:1005-1008`) and runs a real provider CLI probe (cap 90 s). Scenario: a 4-seat panel on one account whose token falls in the window: seat 1 renews, seats 2 to 4 wait on the lock for the whole probe, then each re-checks. The cooldown (30 min after a failure) bounds repeats. I did not run it because it needs a real account and a real provider CLI. The fast path (outside the window) reads the store file once; its cost for the sqlite layout is not measured.

**S-7 (Low, reproduced): seat-binding doctor rows spend 0.5 to 1.4 s each outside S-1.** `seat-binding-dry-bind` 1.41 s for 62 binds under strace (baseline 1.08 s unstraced), `executor-posture-coverage` 0.50 s for 36. One bind per exec is the client contract; 62 and 36 follow from the number of seats, so nothing to fix beyond S-1.

**S-8 (Low, reproduced): `exec-budget.test.mjs` is 1 test, 6.6 s.** It proves one host exec per bind and none under the hot mutex (baseline §2.3). Its owner is the seat-binding client; it runs a full fixture `runUnit` to count execs. Candidate to count at `client.mjs:118` instead (the `spawnSync` call site already has a hook, `hotLockDepth()`); not measured after the move.

## Migration table

| Node part | Decides | Move to Rust? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `seat-binding/client.mjs` + `bind.mjs` `explainSeat` | bind, explain | no further move | Decision is in Rust already; 2 ms per exec. S-1 is a caller change. | now | unchanged, -0 to +3 lines for the `chain` option |
| `runtime-inspection.mjs` | read-only run inspection | no | Cost is a repeated call, not language. Memoise per run. | now | about -10 lines (the four `result()` calls collapse to one map) |
| `run-result.mjs` writer/validator, Rust `run-result` reader | outcome derivation | not for speed | `interpretRunResult` 1.2 ms per call; with S-2 fixed it is called once per run. The one-owner decision (baseline O-4) belongs to the correctness and architecture seats. | after S-2 | n/a |
| `confinement/probes/harness.mjs` | falsification probes | no | 0.6 to 0.9 s once per hour, cached. | none | unchanged |
| `provider-credential-renewal.mjs` | refresh-ahead | no | A real provider CLI call is the cost, not Node. Whether it may run in the background is a product question (Proposed). | later | unchanged |
| `assignment-runner.mjs` prelude (git facts) | launch preparation | no | 0.2 s per attempt from repeated reads; fix is one read handed down, not Rust. | after correctness seat | about -20 |

## Delete list (speed lens only)
- `explainSeat`'s chain walk for callers that do not use it: not deleted, made optional (S-1); the walk stays for `fgos dispatch explain`.
- Nothing in tests can be deleted on time grounds alone. `exec-budget.test.mjs` (6.6 s) can be moved down (S-8) rather than deleted.
- Dead `executeThroughConfinement` (375 lines) and its 39 test calls in 6 files (baseline §7): I did not time these tests; they are test time that disappears with the code. Name the owner of each test in the correctness seat's table before deleting.

## Doctor table (speed lens)
| Condition | Row that keeps it | Time note |
|---|---|---|
| Blind unit can bind an unproven (family, transport) pair | `blind-steps-use-proven-pools` (kept) | 9.3 s now; about 1 s with S-1 |
| Seat of a Workflow unit fails to bind | `seat-binding-dry-bind` (kept) | 1.1 s |
| Core capability has no posture-capable executor | `executor-posture-coverage` (kept) | 0.5 s |
| Other rows of the layer | kept | each under 0.6 s (baseline) |
No row is proposed for removal on speed grounds, so no condition is lost.

## Tests table (speed lens)
| Behaviour | Owning proof | Time cost | Note |
|---|---|---|---|
| Account rotation and provider walk across attempts | `run-provider-failover.test.mjs`, 30 tests | 111 s | Integration through `runUnit` with real confined fake agents; a decision-only subset (which candidate is next after a failure) could sit at the `bind` layer (pure, ms) and leave about 8 end-to-end tests. I read 4 of the 30; I did not classify the rest |
| Unit run patterns (panel, reviewed, resume, blind) | `run.test.mjs`, 87 tests | 120 s | No waits except one 4 s timeout test; split into files for parallelism (S-3) |
| Worker timeout, idle timeout, output budget | `spawn-worker.test.mjs` | 56 s, about 15 s of it clock | Idle and hard timeout values 1.5 s to 3 s could be tens of ms if the timers take an injected clock; the supervisor owns the real timer (T4) |
| One host exec per bind | `exec-budget.test.mjs` | 6.6 s | Count at the client call site (S-8) |
| Seat decision | Rust `golden.rs` 0.04 s plus about 190 Node tests | Node side 10.4 s for 5 files | Not a time problem; the duplication question is for the architecture seat |

Time-based waits: 117 wait lines in the layer's tests (baseline). The ones with real floor cost are the 5 to 6 clock tests above; the rest are polls of 50 ms.

## Answers on received items (speed lens only)
- **T2 §5(5), 558 seat spawns per doctor:** answered. 559 is 460 + 62 + 36 + 1; the 460 is S-1 (chain walk discarded); fixing S-1 leaves about 155.
- **H20 `lock-wait.mjs` (24 lines):** nothing measured on speed; its test is 53 lines, not on the slow list.
- **T4 dead door `executeThroughConfinement`:** removal takes 375 lines plus 39 test calls out of the layer; time saved unmeasured.
- **Everything else (herdr callers, wording lists, T3-04a addenda, H-T4c to f):** correctness or architecture items; no speed finding. Not answered here.

## For T4 (closed layer), note only
`src/run-supervisor/steps/settle-attempt.mjs` and `finalize-home.mjs` are two fresh Node processes per attempt, 0.47 to 0.56 s and 0.22 to 0.24 s under strace; their imports are 60 ms (`settle-attempt.mjs` import measured 3 times, 0.05 to 0.06 s wall, 69 MB RSS). The rest is the debug hash (S-4), git calls and fsync. If T4 is ever reopened for speed, one step process per attempt instead of two would save one Node boot plus one door load, about 0.1 s in a release. Not proposed here.

## Proposed additions (kept separate, owner picks; none is a new feature)
1. **Option `chain: false` on `explainSeat`** (S-1). Problem: 460 discarded host spawns, 9.3 s of one doctor row. Evidence: 28 seats x 2 sessions, chain equals candidates in all 28. Benefit: about 8x fewer spawns in that row. Replaces: the unconditional chain loop for that caller; no new function.
2. **Memoise `result(l)` per run in `inspectDispatchRuntime`** (S-2). Problem: four reads of each of 370 files. Benefit: inspect `--cwd` about 4x less work in the part that dominates (about 2.0 s to about 0.5 s in-process). Replaces: the four call sites with one map.
3. **Split `run.test.mjs` and `run-provider-failover.test.mjs` into 3 to 4 files each** (S-3). Problem: suite wall equals the longest file (140 s) on a 24-core machine. Benefit: floor to about 56 s by the per-test sums; no assertion changes. Fully replaces the two files; the TEST lane owns it.
4. **A lighter staged test addon or cross-process digest memo** (S-4). Problem: 130 ms per Node process in tests. Benefit: about 0.26 s of 1.1 s per attempt, so about a quarter of the launch-bound test time. Test staging only; production path untouched.
5. **Question for the owner, not a proposal:** should `refreshAhead` (S-6) ever run in the background of a dispatch instead of before launch? It is the only place where launch can wait up to about 90 s. It changes behaviour (a launch would start with a token that may expire), so I leave it as a question; I did not reproduce it.
6. **Question for the owner:** `.fgos/assignments` is never pruned (782 run dirs here; inspect cost grows with it). Is a retention rule in scope for T5 or for Work/Workflow?

## Net size estimate (Node, Rust, tests)
- Node: about -30 lines (S-2 map, S-5 later) and about +3 (S-1 option); Rust: 0.
- Tests: file splits are a move (about 0 lines net, about +30 for shared imports and fixture headers); `exec-budget` move about -1 test of 6.6 s. No test is weakened.

## Measurement notes
- Loads: 0.8 to 3.3 across the session; per-test failover times varied by about 20 percent between the two runs I made (111 s wall, 112.9 s).
- Spawn counts and the strace-per-process table are from one run each; the cpu profile covers 4 attempts. Treat the per-attempt 1.1 s as 1.0 to 1.3 s.
- Not measured: `fgos run` end to end on a release (needs a real or fixture agent through the activated host; the fixture path uses the debug host), refresh-ahead with a real account, `dispatch watch`, the sqlite credential read.
- Scratch files lived in the session scratchpad only; the repo is unchanged.

Status: DONE_WITH_CONCERNS
Summary: Measured the layer's cost. Two small local fixes are worth doing (S-1 saves about 400 of the 559 doctor spawns, S-2 cuts `inspect --cwd` about 4x), the suite floor is one long file (140 s) with 24 cores idle plus about 1.1 s per real attempt (fsync about 0.45 s, test-only debug addon hash about 0.26 s), and the slow tests are launches, not waits (except about 15 s in `spawn-worker`).
Concerns/Blockers: Release-door `fgos run` end to end, credential refresh-ahead and the sqlite read were not measured (no real agent or account allowed); the S-3 split estimate and the S-1/S-2 savings are arithmetic from measured parts, not re-measured after a change; only 4 of the 30 failover tests and none of `run.test.mjs` bodies beyond wait sites were read.
