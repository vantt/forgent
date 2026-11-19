# S6a phase 00, part B: facts re-read on `f031ab0c8`

Plan: [261118-1341-s6a-execution-tier-rust](../plan.md). Read on `main` = `origin/main` `f031ab0c8` (2026-11-19 12:04);
the plan's citations were read on `b5b237534`. Part A (port map, census, tests, corpus, baselines: §1, §2, §6, §7, §10)
is `facts-part-a.md`. This part covers §3, §4, §5, §8, §9 and the phase-file changes. GitNexus is not available on this
machine; every fact below comes from `rg`, `sed -n` ranges and `git log`/`git diff b5b237534 f031ab0c8`.

What landed since the plan was written (2026-11-18 15:16) and touches it: S5 done (`56c909b09`, `193183eaa`); worktree
door plan 261118-1455 done (`c5e87b849`: `fgos-checkout`, addon `checkout` namespace, native `worktree`/`resync-worktree`
`3205435d4`); account lease 261118-1847 (`aafe1b601` new `bridge:S6a` row, `31c0bf5a9`/`02ad6eaed` persona pool,
`88dc6a190` account view); run-result records (`36445e48f`, `4974994d1`, `08fecc824`, `725522d1e` usage parsers out of
Node); session verb 261118-0947 done (`37b345016`; `fgos head` -> `fgos session` `dbd26eae6`; one Identity record
`9a491ac12`; writer id never from `sessions.json` `b7486e847`; head grants/peers in confinement `90757718a`,
`42e7a0c3c`, `fd59f3445`, `7185f8375`); owner-question store 261118-1159 done (`3ea56a6a7`; `src/portfolio/open-questions.mjs`
deleted `1cabfe384`); supervisor 261118-1045 phases 1-18 done (lane pool `47165e3bf`, request transport `92570dd85`,
host wiring `8ea404d62`, slot count retired `3c89dbe87`, lane-wait fix `2dbabb340`; phase 19 open); foundation
261118-2048 phases 1-6 done (StoreError leaf `710931276`, `.fgos` join door `fgosDirFromRoot` `691255ad0`/`c7cb8b6ee`,
registrations `351dd9cbc`; phase 7 draft); resource stack and door (`3ee940891` write-scope crate moved to
`packages/write-scope`, `0b51fb44c` addon graph/write-scope, `3c7dbf905` write-scope door row); attention view on Observe
definitions (`b67e22e97`). `fgos run --provider codex` is now `--provider openai`: no phase file used the provider id
(the remaining `codex` mentions name the Codex CLI's trust store).

## §3 Admission and Workflow calls

Read on `f031ab0c8`. Port operations are asked in Execution at: `resolveBinding` `src/runner/execution/unit-run-start.mjs:200`
(`requireFreeWorktree:199-205`, called `:431` when `writing && !caseRef`, and `:325` on a resumed standalone writing run); `admit` `:436` (only when `caseRef`); event
`caseAdmitted` (`options.onCaseAdmitted`) `:454`; event `unitRunCreated` (`options.onUnitRunCreated`) `:514`; `recheckEffect`
`commit-unit-work.mjs:160-162` via `run.mjs:777` (only with an admission); `settle` `run.mjs:224` in `settleAdmission:217-233`
(only with an admission). `activityUnitOf` and `confinedWriteRefusal` are asked only by the standalone request builder
`run-request.mjs:351` and `:325`. A port-less writing or case run refuses `PORT_MISSING` (`unit-run-start.mjs:429`, resume `:324`).

### A. Who asks which operation

| caller / mode | peer ops used | events | evidence |
|---|---|---|---|
| `fgos run` read-only, no `--case` | none (port built `run-request.mjs:356` but never asked) | `unitRunCreated` only if a callback is passed (the CLI arm passes none) | `unit-run-start.mjs:429-431`; `bin/fgos.mjs:2496-2505` |
| `fgos run --writes` (no `--case`) | `resolveBinding` | none | `unit-run-start.mjs:431,200`; resume `:325` |
| `fgos run --case --activity` (read-only or writing) | `activityUnitOf`, `admit`, `settle`; `recheckEffect` when writing | none at the CLI (no callbacks) | `run-request.mjs:350-351`; `unit-run-start.mjs:436`; `run.mjs:224,777` |
| `fgos run --writes` from a confined worker (dispatch depth > 0) | `confinedWriteRefusal` first (refusal `nested-write-from-confined-worker`, phase `pre-admission`); then as `--writes` / `--case` | none | `run-request.mjs:322-328` |
| Workflow runner (`runUnitWithRecovery`) | `admit`, `settle`, `recheckEffect` (writing unit); never `resolveBinding` (always has `caseRef`) | `caseAdmitted` -> `recordScheduled` (`src/workflow/runner.mjs:173`); `unitRunCreated` -> `started` (`:174`) | `src/workflow/runner.mjs:158-177,189` |
| Work: operation step (`operation-choice.mjs`) | `resolveBinding` when the unit writes (port injected, no `caseRef`) | `unitRunCreated` if `opts.onUnitRunCreated` | `src/runner/operation-choice.mjs:2327-2342` |
| Work: claim dispatch (`work-dispatch.mjs`) | `resolveBinding` (writing claim worktree; expects `unbound`) | `unitRunCreated` | `src/runner/work-dispatch.mjs:129-144` |
| Work: fanout batch (`fanout-batch.mjs`) | `resolveBinding` when writing | `unitRunCreated` | `src/runner/fanout-batch.mjs:98-108` |
| head start (`head-start.mjs`) | none: calls `launchSessionAttempt`, not `runUnit` (op `launch-session`) | none | `src/session-host/head-start.mjs:133-137`; `bind` `:121` |

### B. `runUnit` options per caller (the `run-unit` request schema of P14)

| caller | options passed | file:line |
|---|---|---|
| `fgos run` CLI | the `buildRunRequest` output: `unitData`/`resumeUnitRunId`, `repoRoot`, `cwd`, `worktree`, pattern/params/overrides from flags, `caseAdmission` (`createPort`), `caseRef` from `--case/--activity/--route/--reason` | `bin/fgos.mjs:2496-2505`; `src/runner/execution/run-request.mjs:311-360` |
| Workflow runner | `unitData`, `branchBase` (writing), `acceptedReports`, `repoRoot`, `cwd`, `worktree`, `pattern`, `personaScope`, `workflowId`, `overrides`, `accountPin: 'where-served'`, `caseAdmission: run.port`, `caseRef {caseId, activity, unitId}`, `onCaseAdmitted`, `resumeUnitRunId` or `onUnitRunCreated`; recovery call adds new `cwd`/`worktree`/`branchBase` and clears `resumeUnitRunId`/`onCaseAdmitted` | `src/workflow/runner.mjs:158-177,189` |
| Work operation step | `unitData`, `runnerConfig`, `declared`, `pinInputs`, `repoRoot`, `cwd`, `worktree`, `caseAdmission`, `raiseAuthorized: false`, `session {headless: true, herdrPresent: false}`, `onUnitRunCreated?` | `src/runner/operation-choice.mjs:2327-2342` |
| Work claim dispatch | `unitData` or `resumeUnitRunId`, `worktree`, `cwd`, `repoRoot?`, `caseAdmission`, `raiseAuthorized: false`, `session`, `onUnitRunCreated` | `src/runner/work-dispatch.mjs:129-144` |
| Work fanout batch | `unitData`, `worktree`, `cwd`, `repoRoot`, `caseAdmission`, `raiseAuthorized: false`, `session`, `onUnitRunCreated` | `src/runner/fanout-batch.mjs:98-108` |

Result fields read by callers: `unitRunId`, `outcome`, `results[]` (`role`, `commit`, `runResult`) (`operation-choice.mjs:2345`,
`work-dispatch.mjs:145-146`, `fanout-batch.mjs:109-112`).

### C. Error classes a caller branches on

| error class / type | caller | file:line |
|---|---|---|
| `errorClass === 'custody-predecessor-unknown'` (writing unit: recovery worktree, rerun) | Workflow runner | `src/workflow/runner.mjs:179,185` |
| `CaseAdmissionRefusedError` (instanceof; refused at admission, worktree removed, step ends by name) | Workflow runner | `src/workflow/runner.mjs:277` |
| `RunnerConfigError` (instanceof) | Work claim dispatch (config refusal path) | `src/runner/work-dispatch.mjs:297` |
| any `errorClass` copied into the fired entry (`|| 'error'`) | Work fanout batch | `src/runner/fanout-batch.mjs:116,158,181` |
| `nested-write-from-confined-worker` (`code`, phase `pre-admission`) | thrown to the CLI envelope | `src/runner/execution/run-request.mjs:327` |
| `PORT_MISSING` (`code`) | thrown to any caller without a port | `src/runner/execution/unit-run-start.mjs:196,324,429` |

Consequence for the seam (P14): the `run-unit` result must carry `errorClass` and an error type tag that lets
`execution-door.mjs` rethrow `CaseAdmissionRefusedError` and `RunnerConfigError` as instances, not only as a class string.

## §4 Doctor rows

Read on `f031ab0c8`. `packages/distribution/contracts/doctor-registry.v1.json` has **32 rows with owner `bridge:S6a`**:
the plan's 30, plus `llm-accounts-default-login-home` (added `aafe1b601`, warn only), plus `seat-binding-route`
(owner `bridge:S6a` since S5 phase 11; it was `bridge:S5` on `b5b237534`). Bridged fixes: 5 (four S6a:
`runtime-socket-dir`, `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped`,
`credential-copies-retained`; one S6b `workflow-case-bindings`). Measured-count proofs that each moving phase updates:
`test/setup/registrations.test.mjs:1177-1185` (`[32, 6, 7]`, 71 Rust rows, 5/25 fixes) and
`apps/fgos/src/wiring/doctor/mod.rs:546-558` (asserts `registry.rows.len() == 116` at `:555` and `(0, 32, 6, 7)` bridge rows per step; the Node proof counts 71 Rust + 46 bridge rows).
`seat-binding-dry-bind` and `blind-steps-use-proven-pools` are `bridge:S6b`, not S6a. All registrations below are in
`src/setup/registrations.mjs` (`R`).

| Row id | Node judge `file:line` (registration) | Fix | Rust module | Phase |
|---|---|---|---|---|
| confinement-policies-declared | `R:1595` (reg `R:1659`); `policies.mjs`, `capability-config.mjs` | - | `wiring/doctor/confinement.rs` + engine `confinement::policy` | 15 |
| confinement-backend-registry-readable | `R:1663` (reg `R:1729`) | `R:1696` (reg `R:1734`) | `confinement.rs` + `confinement::driver` (registry) | 15 |
| confinement-orphaned-resources-reaped | `R:1744` (reg `R:1776`) | `R:1759` (reg `R:1781`) | `confinement.rs` + `confinement::cleanup` | 15 |
| credential-copies-retained | `R:1838`, inventory `R:1919` (reg `R:1959`) | `R:1947` (reg `R:1964`) | `confinement.rs` + engine `credentials` | 15 |
| confinement-bwrap-platform | `R:1968` (+`checkBwrapAvailable` `R:830`) (reg `R:2017`) | - | `confinement.rs` + `confinement::driver` | 15 |
| confinement-probe-freshness | `R:2021` (reg `R:2064`); `probes/harness.mjs` | - | `confinement.rs` + `confinement::cleanup` (probes) | 15 |
| confinement-blind-read | `R:2072` (reg `R:2106`) | - | `confinement.rs` + `confinement::cleanup` (probes) | 15 |
| confinement-strict-readiness | `R:2110` (reg `R:2186`) | - | `confinement.rs` + `confinement::{policy,driver}` | 15 |
| confinement-herdr-maturity | `R:2190` (reg `R:2243`); re-export `src/setup/checks.mjs:21` | - | `confinement.rs` + `confinement::policy` | 15 |
| executor-family-unique | `src/setup/model-pool-checks.mjs:26` (reg `R:757`) | - | `wiring/doctor/execution.rs` + `fgos-execution` executor model | 17 |
| executor-skills-installed | `model-pool-checks.mjs:73` (reg `R:762`) | - | `execution.rs` + `fgos-execution` | 17 |
| tier-fallback | `model-pool-checks.mjs:116` (reg `R:767`) | - | `execution.rs` + `fgos-execution` | 17 |
| model-policy-pools | `model-pool-checks.mjs:137` (reg `R:772`) | - | `execution.rs` + `fgos-execution::accounts` | 17 |
| llm-accounts-shape | `model-pool-checks.mjs:161` (reg `R:777`); `llm-accounts.mjs:67,84` | - | `execution.rs` + engine `accounts` | 17 |
| llm-accounts-default-login-home | `R:783` over `llm-accounts.mjs` `defaultLoginHomeStores` (reg `R:799`) | - (warn only) | `execution.rs` + engine `accounts` | 17 |
| agent-type-names-unique | `R:702` over `agent-definitions.mjs`, `agent-listing.mjs` (reg `R:824`) | - | `execution.rs` + `fgos-execution::agents` / `wiring/agents.rs` | 17 |
| provider-capacity-state | `R:1111` (reg `R:1141`) | - | `execution.rs` + engine `accounts` | 17 |
| operation-prompt-templates-valid | `R:1252` (reg `R:1268`) | - | `execution.rs` + engine `contract` | 17 |
| herdr-executor-kinds | `R:1442` (reg `R:1499`) | - | `wiring/doctor/terminal.rs` + engine `transport` | 17 |
| executor-profile-warnings | `src/setup/executor-profile-warnings.mjs:109` (reg `R:1510`) | - | `execution.rs` + `fgos-execution` | 17 |
| session-keep-declared | `src/setup/session-keep-declared.mjs:20` (reg `R:1521`) | - | `execution.rs` + `fgos-execution` | 17 |
| confined-pane-accounts | `R:1359` (reg `R:1539`) | - | `execution.rs` + engine `accounts`/`credentials` | 17 |
| run-supervisor-route | `src/setup/run-supervisor-checks.mjs:102` (reg `R:1150`) | - | `wiring/doctor/run_supervisor.rs` + `fgos-run-supervisor::controller` | 17 |
| runtime-socket-dir | `run-supervisor-checks.mjs:145` (reg `R:1154`) | `run-supervisor-checks.mjs:156` (reg `R:1165`) | `run_supervisor.rs` + `controller` (runtime dir) | 17 |
| run-attempts-stuck | `run-supervisor-checks.mjs:188` (reg `R:1158`) | - (pointer) | `run_supervisor.rs` + `controller` / `adopt` scan | 17 |
| run-supervisor-config | `run-supervisor-checks.mjs:215` (reg `R:1162`) | - | `run_supervisor.rs` + `controller` (config) | 17 |
| trust-store-readable | `R:1288` (reg `R:1532`) | - | `run_supervisor.rs` + `controller` (trust store) | 17 |
| non-claude-trust-stores-readable | `R:1315` (reg `R:1562`) | - | `run_supervisor.rs` + `controller` (trust store) | 17 |
| agent-cli-project-trusted | `src/setup/agent-cli-trust.mjs:86` (reg `R:1573`) | - | `run_supervisor.rs` + `controller` (trust store), read-only | 17 |
| terminal-control | `src/setup/terminal-control-checks.mjs:37` (reg `R:1490`) | - | `terminal.rs` + `fgos-terminal-control` | 17 |
| terminal-allocations | `terminal-control-checks.mjs:88` (reg `R:1494`) | - (pointer) | `terminal.rs` + `fgos-terminal-control` | 17 |
| seat-binding-route | `R:2253` over `src/seat-binding/client.mjs` (reg `R:2274`) | - | `execution.rs` probing the host seat-binding route (`apps/fgos/src/wiring/seat_binding.rs`), or deleted (P11) | 17 |

Live callers of `src/seat-binding/client.mjs`:

| Kind | `file:line` |
|---|---|
| non-test | `src/runner/execution/bind.mjs:11` (bind, explain, preflight; tier 5, deleted by 20) |
| non-test | `src/runner/dispatch/plan.mjs:23` (plan; tier 5, deleted by 21) |
| non-test | `src/runner/dispatch/assignment-runner.mjs:45` (digest; tier 5, deleted by 20/21) |
| non-test | `src/setup/registrations.mjs:86` (the `seat-binding-route` row, `:2253`) |
| test | `test/seat-binding/client.test.mjs`, `test/seat-binding/route-doctor-check.test.mjs:11`, `test/runner/execution/run-gate.test.mjs` |

Callers of the bind facade above tier 5 that keep reaching the client through `bind.mjs` after phase 20 unless bind moves
behind the seam: `src/runner/loop.mjs:83` (S7), `src/setup/seat-binding-checks.mjs:3` and
`src/setup/blind-steps-proven-pools.mjs:13` (rows `bridge:S6b`), `src/session-host/head-start.mjs:121` (dynamic).

P11 reading: the client's direct callers are all tier 5 or the row itself, but S7 and S6b callers bind through
`bind.mjs`; if phase 20 moves `bind.mjs` up (`move-up`) as a Node facade over the client, the client stays and
`seat-binding-route` moves to Rust in phase 17; if bind reaches them through the execution door instead, the client,
its route protocol and the row go as a removed behaviour. Phase 20's census decides; the likely case is "moves".

## §5 Doors rows

Read on `f031ab0c8` (`docs/architecture-manifest.json`, 78 `doors` rows). Line = the row's `job` line. Every row with
S6a in `retiredBy`, and every row whose `allowed`/`debt` (or job text) names a path phase 02, 20 or 21 moves or deletes.

| Doors row (job) | Line | retiredBy | Paths/symbols a phase deletes or moves | Editing phase |
|---|---|---|---|---|
| agent hook table | 87 | mailbox lane re-measure (not S6a) | `src/run-supervisor/trust-store.mjs`; `src/runner/dispatch/worker-home.mjs` | 20 (trust-store); 21 (worker-home) |
| person's agent config writes | 173 | S5 and S6a: agy sub-HOME rows and agent CLI trust row leave Node | none in allowed/debt (row closes when its job is gone) | 17 (rows), 22 (close) |
| the footprint and write-scope overlap rule (new, `3c7dbf905`) | 268 | dispatch moves onto the write-scope package | debt `src/runner/dispatch/write-scope.mjs` (importers: `src/session-host/head-request.mjs:26`, `test/git/write-scope-parity.test.mjs`) | 20 switches head-request's import; 21 deletes the file and the debt entry |
| list run directories (twin) | 354 | the runner's layouts move to Rust | `src/runner/dispatch/assignment-layout.mjs`; `src/run-supervisor/client.mjs`; `src/runner/execution/case-run-paths.mjs` | 20 (client, case-run-paths); 21 (assignment-layout) |
| process control: signal a process or group | 401 | each Node own-child group kill goes with its spawner | `src/runner/dispatch/provider-credential-probe.mjs` | 21 |
| process facts: read /proc | 536 | Node socket-table read and bwrap probe args go | `src/run-supervisor/runtime-dir.mjs`; `src/runner/dispatch/confinement/drivers/bwrap.mjs`; `.../confinement/probes/harness.mjs` | 20 (runtime-dir); 21 (bwrap, harness) |
| canonical JSON bytes | 580 | the component-boundary exceptions go with their files | `src/runner/dispatch/recovery-planner.mjs`; `.../effective-execution-contract.mjs`; `src/run-supervisor/trust-store.mjs` | 20 (trust-store); 21 (the two dispatch files) |
| locate and read a project config file | 611 | S7: the Node facade retires | `src/runner/dispatch/config.mjs` | 21 |
| global fgOS directory | 715 | S7 | `src/runner/dispatch/llm-accounts.mjs`; `.../confinement/probes/harness.mjs` | 21 |
| agent definition tier directories | 867 | S6a: doctor row agent-type-names-unique moves to Rust, Node listing deleted | none (allowed `src/runner/agent-definitions.mjs` stays) | 17, 22 (close) |
| read runner.capabilities only through src/runner/execution/capability-config.mjs | 968 | none | job text and allowed `src/runner/execution/capability-config.mjs` (moves to `src/runner/`) | 02 |
| choose an executor from a capability's prefer only in the seat-binding crate | 981 | none | `src/runner/dispatch/config.mjs` | 21 |
| the purpose chooser outside bind() is gone: ask purposeSeatOf in src/runner/dispatch/plan.mjs | 995 | none | job text names `dispatch/plan.mjs` | 21 |
| tool lookup by capability (toolProvidersOf in src/runner/dispatch/tool-providers.mjs) | 1005 | S6a: launch stops reading the tool providers in Node | `src/runner/dispatch/tool-providers.mjs` (job text and allowed) | 21; 22 closes if the job is gone |
| the raw capability section is handed out only for the run record and doctor presence | 1048 | none | `src/runner/execution/run.mjs` | 20 |
| the Node bind facade has only its named callers (S5) | 1082 | S6a, S7 | `src/runner/dispatch/{plan,assignment-runner}.mjs`; `src/runner/execution/{run,dry-bind,account-pin,unit-run-start,account-rotation}.mjs` | 20 (execution); 21 (dispatch); 22 closes the S6a part |
| derive executor facts (S5) | 1141 | S6a | `src/runner/dispatch/{config,provider-adapter,provider-capacity,mechanism,resolve,llm-accounts}.mjs`, `.../confinement/{policies,backend-registry}.mjs`; `src/runner/execution/{run,capability-config,seat-resolver}.mjs` | 02 (capability-config); 20 (execution); 21 (dispatch); 22 closes |
| decide a dispatch (S5) | 1215 | S6a | `src/runner/dispatch/plan.mjs` | 21; 22 closes |
| execution doctor judgments (S5) | 1237 | S6a: agy permission check leaves Node with its sub-HOME reader | none in allowed/debt | 17; 22 closes |
| packaging doctor judgments | 1555 | S6a: confinement rows move to Rust and call the Rust smoke test | none left in debt | 15; 22 closes |

Gone since the plan base: `per-session checkout registry` (deleted by plan 0947, `b7486e847`; P10 needs no action).
New since the base: "make, provision and remove a checkout" (worktree-door plan; no S6a action), "the footprint and
write-scope overlap rule" (above).

Import scan (resolving scanner: `from`/`import`/`import()` relative specifiers resolved into `src/runner/execution/`,
`src/runner/dispatch/`, `src/run-supervisor/`, `src/verbs/dispatch/`, `src/runner/dispatch.mjs`, from files outside
them), on `f031ab0c8`: `src bin scripts` 201 hits in 62 files (base `b5b237534`: 197 in 60); `test` 492 hits in 190
files (base: 188), 8 of them under `test/helpers/`. String-only hits (same rg as phase 00 §2, minus import hits): 25
files, among them `scripts/git/e3-bench.mjs:297`, `src/runner/agent-roster.mjs:3`, `src/report/authoritative-match.mjs:11`,
`scripts/check-decision-citation-drift.baseline.json:37`, `test/holder-lock/driver-unavailable.test.mjs:19`,
`test/git/write-scope-parity.test.mjs:19`, `test/scripts/write-wrapper-script.test.mjs:51`. New importers since the base:
`src/session-host/head-request.mjs:25-28`, `src/session-host/head-stop.mjs:10`; gone: `src/portfolio/open-questions.mjs`
(deleted, `1cabfe384`).

## §8 Prior art

`git log -S` on `origin/main` (oldest hits shown) and `git log --all` on the new paths.

| Symbol / path | First / last relevant commit | What it says for S6a |
|---|---|---|
| `src/native/execution-door.mjs`, `src/workflow/admission-peer.mjs`, `packages/execution/engine`, `runUnitInHost`, `fgos-execution-engine` | no file ever existed (`git log --all -- <path>` empty); strings only in this plan (`f3405e9f8`, `48e317e49`) | new; nothing removed earlier |
| "execution-door" (term) | `f30818590` 2026-10-02 "cover execution-door provider gates" | names `fgos run`'s provider gates in `assignment-runner.mjs`, not a file; no clash |
| `unit_run` | `073c8b6fc` 2026-10-01 (Node `fgos run` door, RunResult v4) | no earlier Rust unit runner; no deleted Rust run/dispatch module (`git log --diff-filter=D` on `packages/execution/*`, `apps/fgos/src/wiring/{run,dispatch}*.rs` empty) |
| `payload-root.mjs` | `36d63646e` 2026-10-18 (direct attempts through the Rust supervisor) | born in `src/run-supervisor/`; never moved; phase 02 is its first move |
| `stopProcessesInside` | `85349c3be` 2026-10-05 (stop processes left in a private home) | dispatch-local since birth; phase 02 moves it beside `process-identity.mjs` |
| `capabilityDescriptionOf` / `capability-config.mjs` | `112335b64` 2026-11-14 (every capability reader through one door) | tier-0 door by design; the doctor registry `layers` map and three judge lists name its path (`doctor-registry.v1.json:145,483,664,726`), so phase 02 edits the registry too |
| `loadRunnerConfigForDir` | `fd30f9d4f` 2026-10-24 (one read-only loader through the config door) | P18 keeps it one copy; port the whole composition |
| `custodyHeld`, `unitRunFacts` | `b2d690a2b`, `80c6e30a3` 2026-11-12 (custody door; Unit-run record port) | the reads P15 serves through the addon; new importer `src/session-host/head-request.mjs:25-28` (`e28f71949`) |
| `judgeUnitRun` | `ec7d41b43` 2026-11-08 (retire finished cases) | Workflow-side judge; ported pure in 6c |
| `launchSessionAttempt` | `31b89c672` 2026-11-18 (head sessions launch confined through the worker's seat door) | recent: `head-start.mjs:135` is its live caller (P14 `launch-session` op) |
| `executeAssignment` | `b72496302` 2026-08-28 | `assignment-runner.mjs:1278-1554` now (1 554 lines, `lanes` at `:1110`) |
| `payload_launch` | `e51044c81` 2026-11-15 (host doctor with the Node rows bridge) | now `bridge.rs:186-199`; four `NodeBridge::new()` callers (`wiring/init.rs`, `dispatch_decide.rs`, `questions.rs`, `doctor/mod.rs`) |
| `adopt` `--scan` | `d3720fcef` 2026-10-16, `577087d1c` 2026-10-18 | already Rust: `packages/run-supervisor/rust/src/adopt.rs:148` (`run`), `:180` (`adopt_one`), `--scan` `:54-62`; phase 05 reuses it |
| `dispatch-cwd` lock | 2026-08-21 (ADR0020 era) | already a holder-lock resource: `packages/holder-lock/contracts/lock-registry.v1.json:145`, test `fence.rs:865`; phase 05 reuses it |
| lane pool | `47165e3bf` (1045 P6), `52af20744`, `2dbabb340` | already Rust (`packages/run-supervisor/rust/src/lanes.rs`); phase 05 ports only the Node lane helpers (`direct-launch.mjs:294,308,372`) |
| executor-model doctor rows, decide, bind, accounts view | `1b2fcbc82`, `0debc39bd` (`checks.rs`), `fd155d02a` (native decide), `88dc6a190` | already in `fgos-execution` (`checks.rs:89` judges `executor-confinement`; `decide.rs` `purpose_seat` `:628`; `accounts.rs`); phases 9, 16, 17 reuse, never port again |
| usage parsing, run-result record projection | `725522d1e`, `36445e48f`, `4974994d1` | already in `fgos-run-result`; phases 9, 12, 14 reuse |
| `familyOf` | S5 | `packages/execution/rust/src/executor_model.rs:236`; phase 11 reuses |
| `fgosDirFromRoot` | `691255ad0` 2026-11-19 | T0 `.fgos` join door (`src/util/fgos-file-registry.mjs`); every ported path join follows it (Rust side: the existing project-root resolution) |

## §9 Collisions

Sources: board `plans/261017-1313-fgos-platform-program-board/plan.md` "Các luồng" and "File chung dễ va" (neither has a
row for 1045, 0947, 1159, 2048 or S6a; the shared-file table names `bin/fgos.mjs`, `src/setup/registrations.mjs`,
`src/runner/claim-port.mjs`, `src/runner/execution/bind.mjs`, `apps/fgos/src/main.rs`, `command-routes.json`, the
census and `test/suite-baseline.json` for older lanes, all closed); `log.md` grepped by plan id; `git cherry origin/main
<branch>` on every open `sv/*`, `plan/*`, `shape/s6a` branch.

| Plan / lane | State on `f031ab0c8` | Open branch with content not on main | Touches S6a footprint | Effect on S6a |
|---|---|---|---|---|
| 1045 supervisor | `draft`; phases 1-18 `done`, 19 `ready` (log 11:46, 12:04: release window for the step-5 live run; S6a lands nothing until it closes) | `sv/p03..p15` show patch-ids not on main, but each phase is recorded `done` and landed rebased/merged (`8ea404d62`, `3c89dbe87`, `2a767181e`); no unlanded phase | P19 footprint: `CHANGELOG.md`, `docs/backlog.md`, `docs/reading-map.md`, census (generated) | phase 22 only; P19 lands first. Landed parts (lanes, head request, host wiring, slot count, doctor rows) are the base S6a ports from |
| 0947 session verb | `done` (`37b345016`, log 03:43) | none | landed: `rotate.mjs`, `head-start.mjs`, identity, confinement head grants, `per-session checkout registry` row deleted (`b7486e847`) | P10 settled (no rewrite in 22); phases 7, 7b, 8, 11 port the head-grant behaviour from main |
| 1159 owner questions | `done` (`3ea56a6a7`, log 08:11) | `plan/owner-questions`: 0 unpatched | landed: `questions.rs` (`NodeBridge::new()`), `head-request.mjs`, `open-questions.mjs` deleted | phase 19 keeps `questions.rs` working when the launcher moves; phase 20 drops `open-questions.mjs` |
| 2048 foundation | `draft`; phases 1-6 `done`, 7 `draft` (log 06:39) | `plan/foundation-reverse-deps`: 0 ahead | P7 footprint: `docs/platform/component-boundary.md`, `docs/backlog.md`, event-store spec, `consumers.v1.json` | phase 22 only (component-boundary, backlog); P7 lands first. Landed `fgosDirFromRoot` edits in 30+ S6a-deleted files are the port base |
| other | resource door 261119-0528 done (`d4acefcbd`); ops-metrics 261118-0936 done (its CHANGELOG step done 11-18); live-run throwaway plan `fa41a7b86` (1045 P19 step 5) | `sv/fix-lanewait` (landed as `2dbabb340`) | none beyond the above | none |

Re-sync input for the first cut-over (phase 15): `git log b5b237534..f031ab0c8 -- src/runner/execution src/runner/dispatch
src/run-supervisor src/verbs/dispatch src/runner/worktree.mjs src/setup` is non-empty (34 Node files under the five deleted
paths changed, `git diff --name-only b5b237534 f031ab0c8`); the integration base recorded in part A replaces `b5b237534` here.

## Phase-file changes (applied 2026-11-19)

| Phase | What changed | Evidence |
|---|---|---|
| plan.md | Outcome: 32 `bridge:S6a` rows; P5/P13 `bridge.rs:186-199`, `:31`; P5 `unit-run-start.mjs:199-205`; P14 `fanout-batch.mjs:98`, `head-start.mjs:135`, `runner.mjs:158-177`; P15/P16 `case-runtime.mjs:74-80,104-111`; P17 `bin/fgos.mjs:2499-2505`, `case-admission-port.mjs:38,124`; P18 `config.mjs:316-345`, `facade.mjs:81`; P19 about 610 test files; P22 `architecture.test.mjs:1848-1849`; prior art `adopt.rs:148,180`, `lock-registry.v1.json:145`; non-goal 0947 done; D4 gate met; collision table updated to landed shas; footprints of 2, 15, 17, 20, 21 and frontmatter (+`agent-listing.mjs`, `head-request.mjs`, `head-stop.mjs`, `agent-roster.mjs`, `authoritative-match.mjs`, `e3-bench.mjs`, `check-decision-citation-drift.baseline.json`; -`open-questions.mjs`); hot files `doctor-registry` (2, 15, 17), `bin/fgos.mjs` (2, 19, 20, 21) | `rg`/`sed -n` on `f031ab0c8`; same-wave disjointness and frontmatter coverage re-checked by script |
| lead rules | 1045 P6 gate met; read-on sha; stale-check line `architecture.test.mjs:1848-1849` | `47165e3bf`; `test/architecture.test.mjs:1849` |
| 00 | blockers met; known misses `bin/fgos.mjs:2118,2274,3418,3636,3724`, `head-start.mjs:121,135,140`; §3 lines; §4 count 32; §8 `adopt.rs:148,180`, `lock-registry.v1.json:145` | `56c909b09`, `c5e87b849`; `rg` on `bin/fgos.mjs` |
| 02 | manifest lines (`:1859`, `:67`/`:1642`, `:1881`, doors `:968`,`:1048`); new importer `src/verbs/dispatch/inspect.mjs:10`; doctor registry names `capability-config.mjs` (`:145,483,664,726`) so the move edits it (architecture test `:2091`); +footprint `src/verbs/dispatch/inspect.mjs`, `doctor-registry.v1.json` | `691255ad0`; registry lines |
| 03 | `fgos-write-scope` now `packages/write-scope`; `fgos-checkout` landed; existing `fgos-execution` modules listed (incl. `checks.rs`) | `3ee940891`, `a987e4f0f`, `Cargo.toml:3,35` |
| 05 | gate met; crate 8 965 lines; lane pool already Rust (`lanes.rs`): step shrunk to the Node lane helpers; `adopt.rs:148,180`; `client.mjs:99-107`; `Cargo.toml:7-20`; slot pool armed at 4 | `47165e3bf`, `05c63b2be`, `2dbabb340` |
| 06 | write-scope crate path | `3ee940891` |
| 06b | `case-admission-port.mjs:38,124`; `bin/fgos.mjs:2499-2504`; line counts | `rg` |
| 06c | `config.mjs:316-345` (779 lines), `facade.mjs:81`, `head-start.mjs:140-141`, `case-runtime.mjs:74-80`; config path via `fgosDirFromRoot` | `691255ad0` |
| 07 | 1 712 lines; port must carry head `mailbox-record`/`peer-sessions` resources, mailbox lock via `resolveLock` (`resources.mjs:19,90`), `controlDelivery` | `90757718a`, `42e7a0c3c`, `5b751154c`, `fd59f3445`, `7185f8375`, `a8b1f6229` |
| 07b | `authority.mjs` 1 057 lines; vectors cover `controlDeliveryOf`, `ownWorktreeUnavailable`, `seatSessionDir` | `7185f8375`, `ae00671c9`, `c75720662` |
| 08 | `bwrap.mjs` 762 lines, head binds in argv vectors; `checkBwrapAvailable` `registrations.mjs:830` | `42e7a0c3c`, `5b751154c` |
| 08b | `harness.mjs` 860 lines; wording | `rg` |
| 09 | `usage-parsers.mjs` gone (no parser port); `llm-accounts.mjs` 286 lines, `defaultLoginHomeStores:231` + new row; reuse `fgos-execution::accounts`; doors rows "derive executor facts", "record a malformed call (twin)" | `725522d1e`, `aafe1b601`, `88dc6a190` |
| 10 | anchors added | file unchanged since base |
| 11 | gate met; `head-start.mjs:135-136`; head grants `mailbox`/`peers`, `headOf`, backend `delivery`, bypass seeding, attention view v2 on Observe definitions, `fgosDirFromRoot`; `familyOf` reused from `executor_model.rs:236` | `90757718a`, `42e7a0c3c`, `b67e22e97`, `7707c26ad`, `691255ad0` |
| 12 | `run-result.mjs` 1 137 lines; claim frictions; usage/record projection reused from `fgos-run-result` | `08fecc824`, `05256c653`, `725522d1e`, `36445e48f` |
| 13 | write-scope crate path; `tool-providers.mjs` is a twin of `tools.rs:141` (not ported): 1 827 lines | `3ee940891` |
| 13b | anchors; Node judge `registrations.mjs:1268` | `rg` |
| 14 | `settlement.mjs` 956, `settle-attempt.mjs` 342, `attempt_step.rs:15,91`; re-sync items: `parser-unavailable`, claim frictions after settle | `725522d1e`, `05256c653`, `19d765c1a`, `888cb9a36` |
| 15 | import lines `registrations.mjs:48-58,67-69,79-80`, bodies `:1595-2244`; 3 fixes; `checks.mjs:21` re-export; door row `manifest:1555-1571`; `verb-parity.test.mjs` restore from `56c909b09^`; count proofs; 4 `test/runner` retirements; Footprint section | `56c909b09`; `registrations.test.mjs:1177-1185`; `doctor/mod.rs:546-558` |
| 16 | 2 033 lines; planning calls `decide.rs` (`purpose_seat:628`) instead of porting | `fd155d02a` |
| 16b | `assignment-runner.mjs` 1 554 lines, `executeAssignment:1278-1554`, envelope `:1093`, `lanes:1110`; lane settings from `workerSlots` (`direct-launch.mjs:294-301`); gate met | `47165e3bf`, `05c63b2be` |
| 17 | 22 rows + `seat-binding-route` (new `llm-accounts-default-login-home`); agent listing is `src/runner/agent-listing.mjs:36`; `seat-binding-route` body `registrations.mjs:2253`; S6b checks stay Node; door rows to edit; Footprint section | `aafe1b601` |
| 18 | line numbers (`run.mjs` 1 026, `settleAdmission:217-233`; `requireFreeWorktree:199-205`; `commit-unit-work.mjs` 227) | `691255ad0`, `b7486e847` |
| 19 | gate met; `case 'run'` at `bin/fgos.mjs:2496`, port `:2499-2505`; `payload_launch` `bridge.rs:186-199`; four `NodeBridge::new()` callers incl. new `questions.rs`; `head-start.mjs:135` | `47165e3bf`, `1cabfe384` |
| 20 | line numbers; `open-questions.mjs` dropped; new importers `head-request.mjs:25-28`, `head-stop.mjs:10`; switches `bin/fgos.mjs:57,2384,3371,3418,3724`, `show-run.mjs:20-21`, `recover.mjs:24,28`, `e3-bench.mjs:297` before deleting; S5 doors rows; six test importers | `1cabfe384`, `e28f71949`; scan on `f031ab0c8` |
| 21 | 839 / 355 lines; `inspect --attention` runs Observe definitions; doors rows (write-scope overlap `3c7dbf905`, bind facade, derive executor facts, decide a dispatch); nine test importers; three string mentions to drop before the anchored check | `b67e22e97`, `3c7dbf905` |
| 22 | P10 settled (row deleted by `b7486e847`); rows to close incl. S5 rows and "tool lookup by capability"; decision entry under `docs/platform/runner/decisions/`, id from `fgos identity mint d-adr` | `b7486e847` |

Import scan on `f031ab0c8`: `src bin scripts` 201 hits in 62 files (base 197 in 60); `test` 492 hits in 190 files
(base 188), 8 helpers; string-only 25 files.

## Outside the approved scope or needing the plan lead (not applied)

1. **Phase 11 is over the 2 500-line rule (P20):** 3 026 Node lines on `f031ab0c8` (2 951 at base). Proposal: split
   `attention-view.mjs` + `runtime-inspection.mjs` + `visibility-session.mjs` into an 11b (wave 4, own engine module
   directory). A split changes the phase table; the plan lead decides.
2. **Typed errors through the seam (P14):** Workflow branches on `instanceof CaseAdmissionRefusedError`
   (`src/workflow/runner.mjs:277`) and Work on `instanceof RunnerConfigError` (`src/runner/work-dispatch.mjs:297`), so the
   `run-unit` result must carry an error type tag, not only `errorClass`, for `execution-door.mjs` to rethrow instances.
   Within P14's schema, but phases 18 and 19 should name it.
3. **P11 ordering:** phase 17 (wave 6) moves or retires `seat-binding-route`, but P11 decides from callers left after
   phase 20 (wave 9). §4 reads the client as surviving (`src/runner/loop.mjs:83`, S7, and two S6b setup checks bind
   through `bind.mjs`), so the row moves to Rust in 17; the plan lead confirms.
4. **`assignment-runner.mjs` is 1 554 lines**, over the component-boundary budget of 1 500 (a Node defect that dies with
   phase 21; backlog row only if the lead wants one).
5. **Doubled work avoided, not new scope:** `executor-confinement` is already judged in Rust (`checks.rs:89`, S5); phases
   15/17 do not port it. The approved outcome counted it among S6a's rows only if it is still `bridge:S6a`; it is not.
