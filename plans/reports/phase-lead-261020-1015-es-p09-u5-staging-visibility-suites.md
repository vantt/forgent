# Event Store phase 09 / unit 5

Implemented read-your-writes in the existing `withStateTx` staging layer: text/JSON, existence and listing reads see prior staged file writes, unlinks and renames. Gated claim acquisition, release, settle and slot reads use it; public claim readers refuse an omitted transaction under the mutex. Plan-tip rechecks use transaction reads with explicitly prefetched read-only roots, without widening write authority. Disk effects still apply in order only after the single event append acknowledges; refusal tests retain unchanged claims, files and cache. Bare transactions allocate no unused overlay.

The preserved settle/reclaim race passes for the intended reason: claim B replaces staged-unlinked claim A, and stale settle refuses B. The hang was a generated holder script missing `fs`; its parent waited forever for a ready file after that child exited. Added the import, exit/result checks and child cleanup, with no new timeout.

Configuration decision: §21 now states the existing optional-setting policy explicitly. Event Store owns only `eventStore`, uses `readSharedConfigOrEmpty` for a half-written project file, merges global defaults, and rejects a parsed invalid own subtree. Doctor keeps its shared-file health diagnostic. The existing malformed-config claim test and real config validation tests pass. No production config switch or test-only branch was added.

Retargeted decision/knowledge/gate-check/tool/uninstall fixtures to real repositories through `test/helpers/work-store-release.mjs`; extracted its existing descriptor writer for stand-in hosts, keeping the native addon hard-linked on its original filesystem. Observe legacy fixtures now commit frozen HEAD inventory. Their original migration-cursor assertions exposed a production mismatch: doctor now strips `.fgos/` just as Rust `event_reader` already does. Copied payloads include the Work contracts; stale config duplicates and the retired truncation-check expectation were corrected. Native-age fixtures retain real store reads with a minute of threshold margin, avoiding wall-clock boundary crossings during concurrent suites. No store mocks or new skips.

Reused staging introduced by `28b58bd79`, the pre-cutover optional shared-config reader, native facade, shared fixture helper and Rust provenance convention. Impact-analysis: inactive (zero providers). Convention returned the current-time 10:23 path; this report uses the assignment's required 10:15 path. Program-board update is outside scope.

Validation (exact commands):

| Command | Result |
| --- | --- |
| `node --test test/event-store/*.test.mjs test/architecture.test.mjs` | 106 pass, 5 existing PID-namespace migration skips, 0 fail. |
| `node --test test/event-store/work-gate.test.mjs test/state/runtime-coordination.test.mjs test/state/worker-slots.test.mjs` | 68 pass, 0 fail. |
| `node --test test/architecture.test.mjs test/event-store/verbs.test.mjs test/state/hot-lock-tx.test.mjs test/state/state-tx-static.test.mjs` | 45 pass, 0 fail. |
| `node --test --test-name-pattern='AFTER taking' test/state/runtime-coordination.test.mjs` | Final child cleanup/exit handling: 1 pass. |
| `node --test test/setup/observe-doctor-checks.test.mjs` | 18 pass. |
| `node --test test/setup/event-store-checks.test.mjs` | Final age fixtures: 12 pass. |
| `node --test test/state/hot-lock-tx.test.mjs test/event-store/work-gate.test.mjs` | Final allocation optimization: 19 pass. |
| `node --test --test-name-pattern='fast path' test/state/hot-lock-multiprocess.test.mjs` | Final isolated p50 20,456 ns old / 21,438 ns new, ratio 1.048; pass. |
| `node --import ./test/helpers/work-store-release.mjs --test test/setup/credential-copies-retained-check.test.mjs` | 35 pass; confirms six unpreloaded failures were the read-only host state-root fixture. |
| `node --test test/state/*.test.mjs test/setup/*.test.mjs` | Latest unpreloaded run: 2179 pass, 26 fail, 1 existing skip, no hang; before the age-fixture correction. |
| `node --import ./test/helpers/work-store-release.mjs --test test/state/*.test.mjs test/setup/*.test.mjs` | Final broad run: 2185 pass, 20 fail, 1 existing skip, no hang (200.46 s). Residuals below. |

`git diff --check` passes. No full npm suite, Git staging/commit, release activation or project migration was performed. Broad verification is NOT green. Final focused staging/latency proofs follow the broad run's final allocation-only optimization.

Remaining broad failures (full test names; host coordinator can select by file/line):

| File / test location | Test | Exact reason |
| --- | --- | --- |
| `test/setup/doctor-fresh-run.test.mjs:33:1` | e2e: fresh external project reaches expected fgos doctor state after init + setup | Sandbox EROFS opening `/home/vantt/.npm/_cacache/tmp/*` during npm pack. |
| `test/setup/holder-lock-checks.test.mjs:364:1` | lock-fences sees the missing fences, and the fix places them only under an activated holder-lock release | PID namespace hides host processes; native quiesce scan refuses before fence placement or live-process naming. |
| `test/setup/holder-lock-checks.test.mjs:391:1` | a payload registry without the Rust callers' locks fences only the locks it owns, leaving the paths an older fgctl still uses | PID namespace hides host processes; native quiesce scan refuses before fence placement or live-process naming. |
| `test/setup/holder-lock-checks.test.mjs:420:1` | the fence fix refuses while an fgOS payload of the workspace runs, and names it | PID namespace hides host processes; native quiesce scan refuses before fence placement or live-process naming. |
| `test/setup/run-supervisor-checks.test.mjs:363:1` | legacy-attempts-stuck: runs whose processes are all dead fail, the fix settles them and the check then passes | PID-namespace observation returns `pid-unknown` for controller 2147483000; dead legacy runs cannot be proved dead/settled. |
| `test/setup/run-supervisor-checks.test.mjs:379:1` | legacy-attempts-stuck: a run with a live recorded process is kept and the reason is printed, by the check and by the fix | PID-namespace observation returns `pid-unknown` for controller 2147483000; dead legacy runs cannot be proved dead/settled. |
| `test/setup/self-uninstall-spike.test.mjs:29:1` | SPIKE: fgos uninstall --yes --remove-package removes a real npm -g installed package on this platform | Sandbox EROFS opening `/home/vantt/.npm/_cacache/tmp/*` during npm pack. |
| `test/setup/skill-wrappers.test.mjs:756:1` | projection tests for Codex/OpenAI and Claude surfaces verify adapter projection invariants | NON-ENVIRONMENT BLOCKER: `.claude/skills/instruction-audit/SKILL.md` is missing; regeneration writes outside scope. |
| `test/setup/workflow-case-checks.test.mjs:33:1` | a project that never bound a worktree passes; a matching record passes | Sandbox EROFS creating `/var/tmp/fgos-doctor-empty-*` or `/var/tmp/fgos-doctor-bind-*`. |
| `test/setup/workflow-case-checks.test.mjs:44:1` | a missing sentinel fails, and the fix writes it | Sandbox EROFS creating `/var/tmp/fgos-doctor-empty-*` or `/var/tmp/fgos-doctor-bind-*`. |
| `test/setup/workflow-case-checks.test.mjs:52:1` | a record the ledger does not show, an unsettled one and a closed case still held each fail by name | Sandbox EROFS creating `/var/tmp/fgos-doctor-empty-*` or `/var/tmp/fgos-doctor-bind-*`. |
| `test/setup/workflow-case-checks.test.mjs:70:1` | the fix rebuilds a record the ledger says exists, and settles what a crash left | Sandbox EROFS creating `/var/tmp/fgos-doctor-empty-*` or `/var/tmp/fgos-doctor-bind-*`. |
| `test/setup/workflow-case-checks.test.mjs:93:1` | the fix does not touch a case whose advance lock is held | Sandbox EROFS creating `/var/tmp/fgos-doctor-empty-*` or `/var/tmp/fgos-doctor-bind-*`. |
| `test/state/domain-registry-compiled.test.mjs:27:1` | the domain registry loads from compiled.json using only its own few source files | Sandbox EROFS creating sibling `/home/vantt/projects/forgent/.claude/worktrees/fgos-registry-nodeps-*`. |
| `test/state/hot-lock-host-judge.test.mjs:34:1` | a live holder with its recorded start time is alive; another start time is a reused pid | PID namespace prevents host liveness proof: native judgment is `unknown`, expected `alive`/`dead`. |
| `test/state/hot-lock-host-judge.test.mjs:48:1` | a killed holder is dead, a live holder without a recorded start time stays unknown | PID namespace prevents host liveness proof: native judgment is `unknown`, expected `alive`/`dead`. |
| `test/state/hot-lock-host-judge.test.mjs:84:1` | a cached live reading is never used to reclaim: the reclaim judge reads afresh | PID namespace prevents host liveness proof: native judgment is `unknown`, expected `alive`/`dead`. |
| `test/state/hot-lock-multiprocess.test.mjs:172:1` | a zombie holder counts as dead and its record is cleaned | PID namespace prevents proving the zombie dead; reclaim refuses and the existing 5000 ms acquisition limit expires. |
| `test/state/hot-lock-multiprocess.test.mjs:229:1` | an observer in a foreign pid namespace never judges a record that has no namespace | Observer already runs in a foreign PID namespace; native judgment is `unknown` rather than host `dead`. |
| `test/state/hot-lock-multiprocess.test.mjs:248:1` | fast path: uncontended acquire and release is not more than 10% slower than the lock it replaced | Timing acceptance remains host-only: broad contention ratio 1.100 exceeds 1.10 before rounding; isolated ratios 1.017, 1.051, and 1.048 after avoiding unused bare-transaction overlay allocation. Not claimed as a proven sandbox-only failure. |

The missing Claude wrapper is a real pre-existing projection gap, not a sandbox failure; its portable projection and canonical source exist. Kept the assertion intact. Required out-of-scope writes: `.claude/skills/instruction-audit/SKILL.md` through the existing generator, and `plans/261017-1313-fgos-platform-program-board/plan.md` for the coordinator's lane update. MDView refused the spec preview with `attempt to write a readonly database`; no preview URL is available.

Status: BLOCKED
Summary: Staged visibility, stale-settle protection, configuration behavior and real-store fixture retargeting are implemented and verified. Full acceptance remains blocked by an out-of-scope missing generated wrapper, host-only environment proofs and the broad-load latency measurement.
Concerns/Blockers: Regenerate the missing wrapper within expanded scope; rerun the listed environment/latency tests on the host; coordinator updates the program board.
Context refs:
- (none)
