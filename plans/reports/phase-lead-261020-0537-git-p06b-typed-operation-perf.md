# Git 06b: typed-operation subprocess cost

Baseline: `e44e1d5bd`; Linux sandbox, 2026-10-20. Read the two Git 06 host gates, owner E3 budgets, Git spec §§7–10, existing paired fixtures and prior preflight changes `5f29974d2`/`b52ae87c5`. History: `9c8308897` introduced checkout enumeration; `5e8090cf7` introduced the exact-old index proof. Reused both mechanisms. No lighter candidate-allocation mode exists in the current Worktree door: its detached allocation also owns stripping, WAL and recovery. Impact-analysis: inactive (zero registered providers).

The existing `scoped-census` now runs one paired fixture through `typedOperationRows`, tracing successful Git execs (including internal Git children), holder-lock acquisitions and borrow validations. It reports Land prepare/publish independently. No new benchmark, production switch, persistent cache or lock mechanism.

| Phase | Git execs before → after | Holder acquisitions before → after | Successful EX calls, including borrow validation |
|---|---:|---:|---:|
| ScopedCommit preflight | 9 → 8 | 0 → 0 | 27 → 27 |
| ScopedCommit commit | 28 → 22 | 0 → 0 | 90 → 74 |
| **ScopedCommit total** | **37 → 30** | **0 → 0** | **117 → 101** |
| Legacy commitUnitWork | 12 → 12 | 0 → 0 | 0 → 0 |
| Land prepare | 62 → 52 | 3 → 3 | 81 → 81 |
| Land publish | 67 → 48 | 2 → 2 | 105 → 99 |
| **Land total** | **129 → 100** | **5 → 5** | **186 → 180** |
| Legacy mergeRootIntoMainCas | 23 → 23 | 3 → 3 | 3 → 3 |

Prepare acquires destination slot once and worktree-admin twice (allocation, then durable pins); publish acquires admin then main. ScopedCommit borrows custody acquired outside the measured phases. Legacy merge acquires slot/admin/main. The old wrapper missed two internal Git children in both Land prepare and legacy merge; direct-driver counts are respectively 60 → 50 and 21 → 21. The new trace parser handles interrupted syscalls and distinguishes fresh-description acquisitions from EX reassertions; it recognizes Node's existing lock-fd acquisition adapter.

Changes: batch storage formats and NUL-delimited commit headers (including root-commit rejection); reuse pre-staging dirty-path inventory, operation-local facts for the same gitdir, and one canonical stage-entry read for both recovery digests. Foreign checkouts retain independent config resolution. No cache survives an operation. The stat-refresh fixture now forces a distinct timestamp and explicit index refresh; faster execution exposed its optional-status-refresh assumption.

Kept: per-child topology/config/authority checks, post-hook refresh, candidate Worktree WAL, both separated admin acquisitions, source/target/candidate pins, verification revalidation, clean gate, pre/post-CAS checkout observations, exact-old comparisons, durable barriers and recovery fingerprints. No publication effect/barrier or holder-lock implementation changed.

At **10 ms per removed spawn**, the host measurements predict ScopedCommit **387–404 ms**, roughly **1.35–1.40×** legacy, and Land **1580–1609 ms**, roughly **6.9–7.2×** legacy. These are subtraction estimates, not measured E3 passes. Sandbox strace single-sample prepare/publish: baseline **1046/992 ms**, final **889/828 ms**; concurrent test/build load and tracing make these diagnostic only. Publication census is identical before/after: changing CAS **10/8/8**, no-op **1/1/1**, pushes **16/16/20** each with/without objects.

**Land stops here pending a coordinator/owner decision.** Its remaining 100 spawns alone suggest about 1000 ms on the stated host, versus a 268–273 ms whole-operation allowance, before durable barriers. Further straightforward batching cannot plausibly bridge this gap. Options:

- **Recommended: retain safety and revisit the Land budget after host measurement**, or keep phase 07 gated. Accept higher latency for candidate isolation and durable recovery; budget/spec approval required.
- **Retain the budget and fund a separate driver/backend design.** Supported batching or an in-process backend could reduce spawn overhead while retaining barriers, but needs engineering/spec review and may still miss the fsync floor. Nothing added here.
- **Relax candidate/recovery guarantees toward legacy cost.** Fewer durable operations/pins or weaker isolation changes failure semantics. Requires explicit approval; not recommended or implemented.

Validation: Rust Git/holder-lock/addon suite **252 pass, 0 fail, 9 ignored** (mostly child-harness entrypoints exercised by controllers), including Land/ScopedCommit/Sync/SafeRestore/recovery and crash matrices. Node: **325 pass, 0 fail, 1 Windows-only skip**, including all `test/git/*.test.mjs`, legacy commit/merge/quoted-path suites and architecture. Census parser: **2 pass**. Rust ScopedCommit/Sync after the final header correction: **21 pass**. Clippy for Git/holder-lock/addon all targets: clean; `git diff --check`: clean. The explicitly invoked ignored namespace-init deadline test **fails at its environment prerequisite**: bwrap cannot create a PID namespace. It requires the host gate; no production check or test was bypassed. No full npm suite or E3 timing run was attempted. MDView preview failed because its database is read-only.

Evidence (local machine; JSON lists every Git argv and every holder acquisition/validation): `/tmp/fgos-work/git-p06b-baseline-traced.json`, `/tmp/fgos-work/git-p06b-final-traced.json`; their `trace` fields point to complete syscall logs. Publication traces/counts: `/tmp/fgos-work/git-p06b-cas-{baseline,optimized}/`. Tests: `/tmp/fgos-work/git-p06b-{rust-final,scoped-final,node-final,clippy-final,deadline}.log`.

Reproduce after `cargo build --locked -p fgos-node-addon -p fgos`: resolve the target directory through `cargo metadata --format-version 1 --no-deps`, set `FGOS_HOST_BIN` to its `debug/fgos`, and run `node scripts/git/e3-bench.mjs scoped-census --root <fresh-private-dir> --addon <target-directory>/debug/libfgos_node_addon.so`. The ordinary host E3 run now reports separate Land prepare/publish statistics too.

The program-board row is outside this assignment's write scope; the coordinator must record this lane there. No repository commit or index staging performed.

Status: DONE_WITH_CONCERNS
Summary: ScopedCommit removes seven Git execs; Land removes twenty-nine while preserving its safety contract. Host measurement and the Land budget decision remain outstanding.
Concerns/Blockers: Land budget remains implausible; namespace-init deadline proof requires a host with bwrap namespaces; program-board update is outside write scope.
Context refs:
- (none)
