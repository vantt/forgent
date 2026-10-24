# Branch-only failure attribution (plan branch 77db6ed2b vs main 62ce98513)

Method: failure text from /tmp/fgos-work/p9-suite1.log summary block; each failing file rerun alone in BOTH clones through the clone's own scripts/run-tests.mjs `runSelectedTests` (same env: staged addon/host, per-run TMPDIR, /var/tmp fixture root, 10 min watchdog; session id unset; serial per clone, machine idle, load ~1). Logs: /tmp/claude-1000/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d/scratchpad/pa/rerun-p8-suite/ and rerun-main-suite/ (+ summary.txt). 44 files in p8, 41 in main (3 are branch-only files). No tracked file edited (the one `M packages/git/contracts/mutation-census.v1.json` in p8-suite predates the rerun: mtime 10:23, `git diff` empty = stat-dirty only). One scratch test copy was created in p8-suite/test/runner and removed.

Context facts: suite ran at load avg ~12 (15-min) on 16 cores; 15 test files hit the 600 s watchdog in the branch log (17 whole-file titles incl. two that never printed a time) and none in main. Every branch-only title passes alone except the A, C, D groups below; other titles in the same files (terminal-cutover pane test, dev-host concurrent test, download-sources pinned test, units-runner confinement tests, pr-gate, runner-loop) fail alone in BOTH clones, so they are not branch-caused.

## Counts
A=6  B=71  C=3  D=3  total=83

## (A) caused by the branch delta
1. Lease-race tests: stale mock shape. `test/runner/merge-land.test.mjs:116-122` (3 subtests + parent) and `test/workflow/units-runner.test.mjs:226-232` (3 subtests + parent; fail the same way). `t.mock.method(native.GitLand.prototype,'prepare', function(args,loans){ ... const result = prepare.call(this,args,loans); preparedTarget = result.candidate.target ...})` treats the return as sync. Since main cca48c63a (2026-10-23, "Land waits for its locks inside the native port", in main at 62ce98513) native `prepare` returns a Promise, so `result.candidate` is undefined -> TypeError inside prepare -> landRunnerItem returns `merge-failed-unclassified` ("Cannot read properties of undefined (reading 'target')"); test sees no rejection ("Missing expected rejection" / Comparison {} vs code documentation-cutover-lease). Production gate is fine: with `async function` + `await prepare.call(...)` in a scratch copy all 3 timings pass (admitLease in src/runner/merge.mjs refuses after the real lease acquire). The units-runner "land-session-closed" unhandledRejection lines come from the same un-awaited promise. Tests added/edited in a9aee1663 and 22e5b322c; owner: DOC lease slice author (fix the two mocks; `publish` mock returns the native result unchanged, ok). Not caused by load; deterministic.
2. `runner liveness retains current decision assertions...` (`test/scripts/doc-runner-liveness.test.mjs`, branch-only file): step9-liveness-scan.mjs asserts source digests pinned in plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json; docs/specs/runner.md#business-rules now hashes f182ae33.. vs pinned ebb1251f.. . docs/specs/runner.md is byte-identical to main 62ce98513 (main f06b30fa3 edited it), so the registry/test pin went stale against main content. Docs-data drift, not code. Owner: DOC plan (re-pin registry, or make the test content-derived like its 10-23 rework).

Residual not provable here (class C but branch-delta code): `documentation lease admission refuses non-holder runs ... lets its holder reach a worker attempt` (test/runner/execution/run-case-admission.test.mjs:129) and `a holder workflow admits its writing unit ...` (units-runner.test.mjs:142) need a working confinement sandbox; they cannot pass in a clone under /tmp/fgos-work. Re-run them from a checkout outside /tmp (e.g. under $HOME) before calling the lease run-admission path verified. Other lease tests passed alone: test/e2e/documentation-cutover-lease-hooks.test.mjs (status 0, 69 s), non-holder/holder Land cases in merge-land, `workflow integration gates scoped branch paths before Land and admits a linked holder`.

## (C) clone-environment signals
- Sandbox cannot read /tmp/fgos-work/<clone>: `fgos run`/confinement probes fail with ERR_MODULE_NOT_FOUND '/tmp/fgos-work/p8-suite/test/helpers/git-spawn-spy.mjs' (239 occurrences in branch log, 238 in main log). Hides the branch's run-admission tests.
- Hard-coded `/tmp/fgos-work/` allowlist in doc reproduction scripts collides with the clone location (symlink test).
- umask 0002 shell: `untrusted-driver-directory ... mode 0775` fails download-sources/other fgctl tests alone in both clones (same in main).
- pr-gate and runner-loop fail alone in both clones on the same titles (confinement / --once failed).

## (D) known allowed
dead-vocabulary guard (P7-DOC-GAP-05); step10 round5/sync4d reproduction recipes (noNewDoubleOwnership false against current corpus).

## Whole-file failures (17)
All 17 are `status=0` alone in p8 except pr-gate/runner-loop (fail in both clones, C), e.g. fgos-approve 31 s, fgos-merge 80 s, native-addon 237 s (main clone 100 s), migrate 37 s, store-hardening 19 s, lease-hooks 69 s. In the suite they sat at 600.0-611 s; one approve test alone logged 179 s in the suite (p9 log line ~300) while the whole file takes 23-31 s alone => scheduler starvation under load, watchdog kill. No code path in the delta is implicated.

## Table
| title | class | evidence |
|---|---|---|
| 1. a controller killed with SIGKILL after the binding: the supervisor briefs the agent, the result settles, the pane clo | B | suite: 60s harness wait expired; alone p8 PASS, main clone PASS |
| a declared standalone skill and text quoted into a data command are not sites | B | suite: native Git call git-timeout; alone p8 PASS, main clone PASS |
| after prepare | A | suite+alone: mock in test/runner/merge-land.test.mjs:116 / test/workflow/units-runner.test.mjs:226 reads result.candidate.target of a Promise (native GitLand.prepare is async since main cca48c63a) -> TypeError -> merge-failed-unclassified / "Missing expected rejection"; with `async` mock + `await prepare.call` it passes 3/3 (scratch copy, removed) |
| a herdr-spawn seat runs as a terminal attempt: brief typed by the supervisor, pane closed once, settled by the step | B | suite: 60s harness wait expired; alone p8 PASS, main clone PASS |
| a holder workflow admits its writing unit using its origin, with one sidecar read for execution | C | alone p8 fail (82s): results[0] undefined; same file logs 19x ERR_MODULE_NOT_FOUND from confinement probe in BOTH clones (sandbox cannot read /tmp/fgos-work/<clone>/test/helpers/git-spawn-spy.mjs); not provable here |
| a missing receipt at next is observed-only through Node and keeps that attribution after cleanup | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| a recreated worktree does not inherit a rejected Sync from the dead checkout | B | suite: test at test/git/sync.test.mjs:73:1 AssertionError [ERR_ASSERTION]: Expected val; alone p8 PASS, main clone PASS |
| a SIGKILL during consumer verification releases authority; Node recovery and a fresh Land succeed | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| baseline-dirty paths changed by the producer are excluded with an explicit receipt report | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| before prepare | A | suite+alone: mock in test/runner/merge-land.test.mjs:116 / test/workflow/units-runner.test.mjs:226 reads result.candidate.target of a Promise (native GitLand.prepare is async since main cca48c63a) -> TypeError -> merge-failed-unclassified / "Missing expected rejection"; with `async` mock + `await prepare.call` it passes 3/3 (scratch copy, removed) |
| before publish | A | suite+alone: mock in test/runner/merge-land.test.mjs:116 / test/workflow/units-runner.test.mjs:226 reads result.candidate.target of a Promise (native GitLand.prepare is async since main cca48c63a) -> TypeError -> merge-failed-unclassified / "Missing expected rejection"; with `async` mock + `await prepare.call` it passes 3/3 (scratch copy, removed) |
| commit: controller death retains custody and recovers immutable commit without replay | B | suite: hook barrier not reached (wait expired); alone p8 PASS, main clone PASS |
| dead vocabulary guard: the fgos gateway and the herdr-dashboard plugin never go by their retired names | D | alone p8 fail, main pass: docs/platform/component-boundary.md:1313,1444 retired gateway/plugin name (P7-DOC-GAP-05) |
| detached sessions allocate unique mkdtemp paths and validate the session id | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| detached undelivered tip requires a surviving non-fgos ref | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| dev door runs the real Node consumer from INIT_CWD with shared-default Cargo output | B | suite: spawnSync ETIMEDOUT (status null); alone p8 PASS, main clone PASS |
| direct audit rejects a symlink output before reading the corpus | C | alone p8 fail: script allowlists realpath under /tmp/fgos-work/ (step10-round4-rationale-rebuild.mjs:13); clone lives in /tmp/fgos-work so symlink to the clone passes the check and the script proceeds to import cwd/scripts/generate-doc-inventory.mjs (ERR_MODULE_NOT_FOUND) |
| documentation lease admission refuses non-holder runs before writes and lets its holder reach a worker attempt | C | alone p8 fail: "required confinement refused ... ERR_MODULE_NOT_FOUND /tmp/fgos-work/p8-suite/test/helpers/git-spawn-spy.mjs"; 5 sibling tests in main clone fail identically; not provable here |
| documented ownership commands work from a fresh reviewer output directory: step10-round5-reproduction.json | D | alone p8 fail: audit-ownership.mjs assert(current.noNewDoubleOwnership) on reproduction recipe data vs current docs corpus; test file branch-only |
| documented ownership commands work from a fresh reviewer output directory: step10-sync4d-reproduction.json | D | alone p8 fail: audit-ownership.mjs assert(current.noNewDoubleOwnership) on reproduction recipe data vs current docs corpus; test file branch-only |
| download: --from beats FGCTL_FROM beats FGCTL_VERSION (the losing sources are never touched) | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| download: with no pin and nothing explicit, init resolves and installs the latest release | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| established worktree operation ids return without repeating effects and bind all inputs | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| even a dangling native index lock names inspected repair before publication | B | suite: native Git call git-timeout; alone p8 PASS, main clone PASS |
| event-store product code has no Git spawn site and no classified spawn: its Git work goes through the typed ports | B | suite: native Git call git-timeout; alone p8 PASS, main clone PASS |
| executeAssignment: a second, DIFFERENT Assignment targeting the same cwd is refused while the first cli-spawn Run is sti | B | suite: test timeout 30s; alone p8 PASS, main clone PASS |
| fgos --help --json through the host is the whole manifest, byte-identical to the Node payload | B | suite: child status null; alone p8 PASS, main clone ✖ (also flaky in main clone alone) |
| Item 3: Idempotent re-run skips stage_release entirely (does not contend for install.lock) | B | suite: child exit 1 / refused read; alone p8 PASS, main clone PASS |
| L1: ./bin/fgos and bin/fgos are treated as a collision, not two different digests | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| Land materializes tracked non-event store bytes stripped by worker allocation before verification | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| landRunnerItem does not false-flag an already-merged branch over a legitimate .fgos/ divergence (tsk-52p regression) | B | suite: merge-failed-unclassified instead of merged; alone p8 PASS, main clone PASS |
| listSessions reflects the registry and is empty after every session ends | B | suite: git worktree add failed; alone p8 PASS, main clone PASS |
| literal path "literal*star" commits and replays losslessly | B | suite: native Git call git-timeout; alone p8 PASS, main clone PASS |
| locked worktrees and submodules refuse before attempting removal or relocation | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| main checkout allocation supports .claude/worktrees and rejects admin or linked nesting | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| move --to delivered without --override-reason refuses even with an EMPTY --override-reason value (validation, not a sile | B | suite: state todo instead of awaiting-approval; alone p8 PASS, main clone PASS |
| P6 HIGH regression: staging a candidate with an in-root directory symlink triggers quarantine and puts nothing in releas | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| P6 HIGH regression: staging a candidate with an unlisted payload symlink triggers quarantine and puts nothing in release | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| P7: Candidate preflight failure refuses init before publishing activation and writes no host-visible projections or acti | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| plain worktree with tracked .fgos preserves modifications | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| plain worktree with tracked .fgos removes cleanly | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Proof gap closure: staging a candidate with mismatched components.legacyNode.digest triggers quarantine and puts nothing | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R11 & R1-R8, R10: fgctl init in a fresh git project publishes shims, root.json, activation.json, and passes preflight/ta | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| R1: CLI recognizes valid subcommands; refuses unrecognized subcommands | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R6 & R9: Concurrent stage invocations observe lock refusal (exactly one winner) | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R6 & R9: Corrupting one byte before staging triggers quarantine and puts nothing in releases/ | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R6 & R9: Re-staging an already-staged digest is a no-op (manifest mtime unchanged) | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R6 & R9: Staging a valid release tree verifies digests and creates releases/<digest> | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R7: A .tar.gz with a path-traversing member alongside a valid release is refused, nothing published, no leftover temp di | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R7: A .tar.gz with a symlink member alongside a valid release is refused, nothing published | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R7: Staging from a .tar.gz archive extracts with pure Rust and stages successfully | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| R8: status --json on empty store reports empty array, not an error | B | suite: child build-rust-distribution/node command failed; alone p8 PASS, main clone PASS |
| recreated skip-worktree tracked state is preserved even with identical bytes | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| runner Land refuses a scoped branch when the lease is acquired after admission | A | suite+alone: mock in test/runner/merge-land.test.mjs:116 / test/workflow/units-runner.test.mjs:226 reads result.candidate.target of a Promise (native GitLand.prepare is async since main cca48c63a) -> TypeError -> merge-failed-unclassified / "Missing expected rejection"; with `async` mock + `await prepare.call` it passes 3/3 (scratch copy, removed) |
| runner liveness retains current decision assertions with complete-record consumer evidence | A | alone p8 fail: step9-liveness-scan asserts unitDigest of docs/specs/runner.md#business-rules = ebb1251f.. (working-identity-registry.json), live file hashes f182ae33..; runner.md identical to main 62ce98513 (main f06b30fa3 edited it after registry pinned); docs data, not code |
| ScopedCommit refuses invalid requests, post-preflight staging and replay of a rejected attempt | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| stripped tracked state is clean for removal and reappearing worker state is preserved | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Sync abort restores pre-merge permission bits on clean merged paths | B | suite: containment-unproven (Git port refused under load); alone p8 PASS, main clone PASS |
| sync: controller death retains custody and recovers unknown rejection without replay | B | suite: hook barrier not reached (wait expired); alone p8 PASS, main clone PASS |
| test/cli/fgos-approve-2.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-approve-3.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-approve-5.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-approve.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-claim-2.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-claim.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-iron-law-gate.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-merge.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-post-merge-3.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-post-merge-4.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/cli/fgos-return.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/distribution/native-addon.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/e2e/documentation-cutover-lease-hooks.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/e2e/pr-gate.test.mjs | B | suite: file killed at ~603s (watchdog 600s). Alone: still fails in BOTH clones (--once failed, confinement/ERR_MODULE_NOT_FOUND, same title) => timeout=B, residual failure=C common with main |
| test/e2e/runner-loop.test.mjs | B | suite: file killed at ~603s (watchdog 600s). Alone: still fails in BOTH clones (--once failed, confinement/ERR_MODULE_NOT_FOUND, same title) => timeout=B, residual failure=C common with main |
| test/event-store/migrate.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| test/event-store/store-hardening.test.mjs | B | suite: file killed at ~600s watchdog; alone p8 status=0 in 20-240s, main clone same |
| the static scan reports a Git spawn in each shape a literal search misses | B | suite: native Git call git-timeout; alone p8 PASS, main clone PASS |
| workflow Land refuses a scoped branch when the lease is acquired after admission | A | suite+alone: mock in test/runner/merge-land.test.mjs:116 / test/workflow/units-runner.test.mjs:226 reads result.candidate.target of a Promise (native GitLand.prepare is async since main cca48c63a) -> TypeError -> merge-failed-unclassified / "Missing expected rejection"; with `async` mock + `await prepare.call` it passes 3/3 (scratch copy, removed) |
| Worktree create, move, guarded remove (files) | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Worktree create, move, guarded remove (reftable) | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Worktree create strips tracked worker state without touching main state | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Worktree custody requires the actual holder | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |
| Worktree remove preserves a live cwd | B | suite: Git floor probe git-timeout; alone p8 PASS, main clone PASS |

Unresolved: (1) is run-admission of a lease holder green outside /tmp? (2) why 17 files starve only on the branch run (main run had no kills; likely just heavier concurrent machine load during the branch run, not measured). (3) not checked whether the doc-runner-liveness pin was green on the branch before main f06b30fa3 merged.

Status: DONE_WITH_CONCERNS
Summary: A=6 (2 lease-race test mocks stale vs async native prepare = 5 titles incl. subtests; 1 docs-registry pin drift), B=71 (load/timeout; all pass alone), C=3, D=3; two branch-delta run-admission tests unverifiable in a /tmp clone.
