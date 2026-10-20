# Seat Binding phase 00: facts and prior art

Read-only phase. HEAD of the worktree: `452498bc8`. Every row of the phase table was re-grepped at this HEAD; lines that moved are corrected below. Live state came from the main checkout `/home/vantt/projects/forgentX/.fgos/` (read-only) and from `~/.fgos/config.json` plus the three workspace configs (read-only, shapes only, no values of credentials). Scratch scripts live in the session scratchpad, not in the repo. Nothing was settled, abandoned, resumed or written in any workspace.

## 1. Headline

| Question | Answer |
|---|---|
| Drain on forgentX (RT-4) | 31 `unit.json` records are `execution.status: running`; 0 `pending`, 0 `pending-inline`. 1 has a live controller. 28 have a dead controller and a closed last attempt (`awaiting-resume`). 2 have a dead controller and an attempt the host cannot judge (`legacy-run`) and **no existing verb provably settles them**. 81 older records have no `execution` field at all (section 8). |
| Settling verb for a dead record | `fgos run --resume <unitRunId>` (adopts the closed attempt, continues, writes `settlement`). There is **no verb that abandons a unit record without running it**: `execution.status` becomes `settled` only inside `runUnit` (`run.mjs:735`, `:1371`). `fgos doctor --fix` (`run-attempts-stuck`, `legacy-attempts-stuck`) settles attempts, never `unit.json`. |
| Reversal trigger of the plan | Tripped for 2 of 31 records (section 8.4) and, read strictly, for the 28 whose only exit is a real `--resume` that re-enters writing steps from days-old worktrees. Decision for the big lead. |
| Fence sentinel (RT-3) | `runner.patterns.seatBinding.schema` is refused by the current validator on all three workspaces' configs, merged with the real `~/.fgos/config.json`, through both `loadRunnerConfigFromDir` and `ensureRunnerConfigForDir` (section 9). The real global file hash was unchanged. |
| `rigorToTier` blast radius | 238 hits in 70 files (7 src + 1 script + 62 tests). Test classification: 14 hand rewrite, 13 fixture with a literal `rigor:` input, 35 pure fixture (section 4). 16 more test files pass `rigor:` values but never mention `rigorToTier`. |
| Doctor replay (RT-5) | `mutating-assignment-binding-snapshot` replays **0** binds today: its guard `resultData.binding && resultData.role` never matches (no `result.json` in any workspace has a `binding` key). Plan text says 2,275 replays; real number is 0 (section 3.7). |
| Baseline exec | `internal identity mint-attempt`: p50 1.9 ms, p95 2.8 ms over 50 runs (section 7). |

## 2. Plan corrections needed

Each item contradicts a statement in `plan.md`, a phase file or the adjudication. Evidence is a file:line or a measured count. The plan was not edited.

| # | Plan statement | Evidence | Effect |
|---|---|---|---|
| C1 | Doctor row `mutating-assignment-binding-snapshot` "replays `bind()` for every historical result (2,275 results in forgentX)" (adjudication 5, phase 00 table). | The row (`registrations.mjs:627-691`) replays only when `resultData.binding && resultData.role`. 2,278 `result.json` files exist in forgentX and **0** carry `"binding"`; mdview and mcp-skill-hub also 0. RunResult never writes `binding` (`settlement.mjs` has no `binding` field). | The row is vacuously green today, so its cost is 0 execs, and it protects nothing. Phase 08 must decide: retire it for the phase 08 replay (preferred), or make it real and budget it. If it becomes real, the upper bound is one bind per unit-shaped run: 1,176 (forgentX), 155 (mdview), 4 (mcp-skill-hub) before any walk step. |
| C2 | Drain predicate is `execution.status` in {running, pending, pending-inline} (plan decision, RT-4). | 81 forgentX records predate the `execution` field. `deriveUnitState` reads 52 of them as not provably finished (43 `running`, 9 `awaiting-resume`). Both 0 `pending` and 0 `pending-inline` exist today. | Predicate as written ignores 52 unsettled-looking records. Either state "records without `execution` are historic, refused on resume with `record-predates-seat-binding`", or extend the predicate with "no `execution` and derived state not completed/failed". |
| C3 | Drain "never wait until empty with no exit" and "name the existing verb that settles or abandons a dead record" (RT-4). | No abandon verb exists for a unit record (`execution.status` settles only at `run.mjs:735`, `:1371`). `fgos workflow close <id>` (`bin/fgos.mjs:2348`, `case-close.mjs:32`) closes a case, not its unit records. | The only exit for the 28 dead records is `--resume`; for 2 records it is unproven. Needs an owner-visible choice, see 8.4. |
| C4 | The unit-state sweep "`fgos run --resume` (adopt) or `fgos doctor --fix`" (phase 00 item 4). | For the 2 `legacy-run` records `run.json.status` is already `settled` and no `envelope.json` exists. `findLegacyStuck` only lists runs whose `run.json.status === 'running'` (`legacy-sweep.mjs:107`), so `doctor --fix` never sees them; `deriveUnitState` keeps the unit `running`. `assertAttemptsResumable` (`run.mjs:220`) skips an attempt without `envelope.json` (`leftByDeadController`, `run.mjs:208`), so `--resume` is not refused either, but whether it adopts the stored `result.json` was not run (it writes). | These 2 records sit in running workflow runs (`wf-run-1791479133716-34d92648`, `wf-run-1791706617162-24fd2476`). Treat as "no proven settling path" until one live `--resume` is tried. |
| C5 | Acceptance criterion 4: "zero execs under the provider lock" (plan criteria, phase 08). | The lock is a host route that brackets the section (`acquireSync`, `holder-lock/index.mjs:245-254` via `runLockRouteSync`, `holder-lock/driver.mjs:136`), and inside the held section (`provider-capacity.mjs:423-436`) `reclaimDeadLeases` (`provider-capacity.mjs:575-586`) calls `isRunWorkerAlive`, wired at `assignment-runner.mjs:1294-1300` to `isSupervisedAttemptStillWorking` (`assignment-runner.mjs:629-637`) which runs `adoptRun(..., {probeOnly: true})`, a host exec, once per dead-pid lease that has an `envelope.json`. | Criterion must say "zero **seat-binding route** execs under the lock", or the probe must move out of the lock. As written it fails on day one for a reason unrelated to Seat Binding. |
| C6 | `ensureRunnerConfigForDir` callers: `bin/fgos.mjs:457,491`, `fgos-runner.mjs:99`, `dispatch/cli.mjs:388,857,1026`, `run.mjs:162`, `assignment-runner.mjs:1276`, `fanout-batch.mjs:51` (10). Fill-missing writer at `config.mjs:395-405`. | 14 production call sites: `bin/fgos.mjs:457,491,1250,1287,3982`, `bin/fgos-runner.mjs:99`, `fanout-batch.mjs:51`, `run.mjs:162`, `assignment-runner.mjs:1276`, `dispatch/cli.mjs:388,857,1026`. The function is at `config.mjs:399`; the write is `:410`, validation `:417`, first-run bootstrap write `:425`. It writes the **project** file only; the **global** file is written only by `fgos setup` (`bin/fgos.mjs:4061` calling `ensureSharedConfigDefaults(os.homedir())`, `registrations.mjs:273-283`). | Phases 05, 06, 09 must cover 14 callers. The global rigorToTier cannot be rewritten by a runtime call, only by `fgos setup`, so "sanitize on read" (adjudication 1) is the only protection for a machine that has not re-run setup. |
| C7 | `resolveAssignmentDispatchPolicy` consumers: "point `plan.mjs:118,174,427`, `cli.mjs` and `loop.mjs` at the facade" (16c); importers include `dispatch/{config,recovery,resolve}.mjs`. | The only runtime callers are `plan.mjs:118,174,427`. `cli.mjs` and `loop.mjs` do not call it (they use `resolveStrongerTier` and `resolveTierModel`). `config.mjs`, `recovery.mjs`, `resolve.mjs` mention the name only in comments (`config.mjs:515,517`). Real importers: `bind.mjs:10`, `assignment.mjs:66`, `cli.mjs:26`, `assignment-runner.mjs:63`, `plan.mjs:12`, barrel `dispatch.mjs:66-68`. | Smaller work list for phase 06; comments to rewrite instead of imports. |
| C8 | `work-dispatch.mjs:379` and `case-admission.mjs:108,173` are role-keyed readers (RT-6). | `work-dispatch.mjs:377-384` is `isSafeRepoRelative`, a comment and guard about `unit-run:` refs; it never reads a role. `case-admission.mjs:108` is a doc comment and `:173` reads only the unit id (`/^unit-run:([^/]+)/`). | Not role readers; remove from phase 02's list. They stay relevant to RT-7 (a seat id becomes a ref segment) only as format consumers. |
| C9 | Role-name branch `case-admission-port.mjs (execution) :17, :66-77`. | `src/runner/execution/case-admission-port.mjs` has no role name branch (`rg role` finds nothing). The role-name branches are `bind.mjs:19-24`, `config.mjs:1383`, `registrations.mjs:591`, `panel.mjs:28-34`, `debate.mjs:35-41`, `role-tasks.mjs:100`, `agent-result-claim-contract.mjs:25-27`, `case-projection.mjs:242-246` (regexes on `verify`, `reviewer|red-team|checker`), `settlement.mjs:290`, `unit-sync.mjs:76,109`, `unit-summary.mjs:64-71`. | Add `case-projection.mjs:242-246` (it is why `tester` produces no verdict receipt today) and `settlement.mjs:290`; drop the `case-admission-port` item. |
| C10 | `bindingInput` is "an allowlisted, non-secret subset" that "extends `configSnapshot` by digest" (RT-9). | `unit.json.configSnapshot.runner` already stores the **whole merged runner config**, global layer included: its keys are `capabilities, confinement, coordination, executor, executors, generatedPaths, idleTimeoutMs, llmAccounts, maxTier, modelPolicies, parallel, patterns, providers, rigorToTier, tierFallback, timeoutMs` (26.6 KB in a current record). `llmAccounts` and `providers` carry credential store paths. `run.mjs:161-172` `snapshotRunnerConfig` stores `runner: cfg` and hashes six keys. | An allowlist on `bindingInput` does not remove credential homes from `unit.json` while `configSnapshot.runner` keeps them. Phase 08 must also narrow `configSnapshot.runner`, or accept and state that `unit.json` keeps credential paths. The write gate also falls back to the **live** config when the snapshot is absent (`assignment-runner.mjs:473`). |
| C11 | Hash coverage "`snapshotRunnerConfig` ... covers capabilities, patterns, rigorToTier, modelPolicies, executors, governance" (spec 9.7). | Correct; but `maxTier` and `tierFallback` are not in the hash today even though they change tier and fallback. Adding them (spec 9.7) changes the hash of every old record, which is intended. Recorded so phase 06 tests do not read it as a regression. | Informational. |
| C12 | `tier-cell` consumers: "`dispatch/config.mjs`, `dispatch/resolve.mjs`, `setup/model-pool-checks.mjs`; 1 test". | Sources confirmed (`config.mjs:23,1488,1573`, `resolve.mjs:13,157`, `model-pool-checks.mjs:9,120`). Tests: 3 files reference it (`tier-cell.test.mjs`, `assignment-policy.test.mjs`, `execution/tier-fallback.test.mjs`). | Minor. |
| C13 | `agent-definitions.mjs`: 1 test; `agentTierDirs :36-54`. | Importers: `agent-roster.mjs:14`, `bin/fgos.mjs:500`, `run.mjs:31`, `assignment.mjs:49`, `case-start.mjs:19`, `registrations.mjs:42` (`agent-listing.mjs` does not import it). 2 test files. | Minor. |
| C14 | Effective rigor is computed at 5 sites. | At least 9 readers/computers: the 5 listed plus `work-dispatch.mjs:348-365` (`workRigorFor`, operation then item rigor then `risk: heavy`), `loop.mjs:1608-1609`, `assignment-policy.mjs:382-383` (reasoning effort **derived from effective rigor**, `REASONING_EFFORT_DEFAULT_FROM_RIGOR`), operation policy rigor in domain workflows (`domains/coding/workflows/feature.yaml:64`), and the guide floor (`case-start.mjs:52-57`, `case-admission.mjs:231-233`). | Phase 07's "effort" cutover also owns `REASONING_EFFORT_DEFAULT_FROM_RIGOR`; D2 (unit rigor stops raising tier) must say what happens to rigor-derived effort. |
| C15 | Global bare-verb entries (`advise`, `execute`, `review`) are "copied into the project file for every registered `<prefix>:v` lacking its own entry" (plan decision 4). | The global entries carry **no `prefer`**: only `description`, `confinement`, `serves` (written by setup as `DEFAULT_CAPABILITY_SLOTS`). Across the 22 capabilities used by shipped workflows plus every `<prefix>:v` key in each config, **0** rely on a bare verb for `prefer` in any of the three project files. | The copy rule is vacuous for pools on these workspaces; it only carries `confinement`/`serves`/`description`. Decide whether it is still wanted. |
| C16 | `checkMutatingAssignmentBindingSnapshot` registered `registrations.mjs:1455`/`:1457`. | The registration id line is `:1455` (adjudication says `:1457`). The function is `:627`. | Cosmetic. |
| C17 | Phase 00 says `bind()` "11 test files". | 12 test files import `bind.mjs` (list in section 3.1). | Cosmetic. |

## 3. Mechanism inventory (rows verified at HEAD)

### 3.1 `bind()` and its exports

| Export | Defined | Non-test importers (file:line, symbols used) |
|---|---|---|
| `bind` | `src/runner/execution/bind.mjs:453` | `run.mjs:15` (with `nextCandidate`, `retrySameCandidate`; calls at `run.mjs:925`, `:1167`, `:1180`), `explain.mjs:7` (`bind`, `listCandidates`, `walkBindings`; calls `:63,70,71`), `dry-bind.mjs:6`, `assignment-runner.mjs:49` (write gate `:466`), `setup/executor-posture-coverage.mjs:6` (call `:71`), `setup/registrations.mjs:95` (doctor replay `:661`) |
| `walkBindings` | `:708` | `explain.mjs:7,71` only |
| `listCandidates` | `:724` | `explain.mjs:7,70`, `setup/blind-steps-proven-pools.mjs:13,73` |
| `nextCandidate` | `:755` | `run.mjs:1180` |
| `retrySameCandidate` | `:786` | `run.mjs:1167` |
| `bindingIdentity` | `:138` | `account-rotation.mjs:11` |
| `hasUsablePrefer` | `:68` | `setup/executor-posture-coverage.mjs:6,39`, `setup/registrations.mjs:95,2668` |
| `resolveTierCeiling` | `:124` | `setup/model-pool-checks.mjs:12,205` (the `capability-rigor-ceiling` row) |
| `getProviderFamily` `:106`, `poolUnusableReason` `:215`, `BIND_CONTRACT_VERSION` `:15`, `canApplyPosture` re-export `:803` | | No importer outside `bind.mjs` and tests (`BIND_CONTRACT_VERSION` in `bind.test.mjs:6`) |

Test importers of `bind.mjs` (12): `setup/workflow-pool-independence-check`, `setup/observe-doctor-checks`, `setup/registrations`, `runner/tier-cell`, `runner/dispatch-execute-effort`, `runner/execution/{account-rotation,tier-fallback,bind,account-pin,explain,bind-committed-config,run}`.

Tool-executor path inside `prepare` (`bind.mjs:234`): `leases` is true only for a non-tool executor whose mechanism is `out-of-process` (`:304`). A tool executor or in-process seat skips the tier cell: it tries `resolveTierModel(policyConfig, seatTier.tier, family)` and falls back to model `default` with `modelSource: 'no-model-needed'` (`:305-314`). So a tool seat is still tier-resolved and can still throw into the empty `catch`. Seat Binding covers agent seats only (spec 3), so the crate must define "not an agent seat" before `prepare`, not after.

### 3.2 `rigorToTier` / `DEFAULT_RIGOR_TO_TIER`

238 hits in 70 files at HEAD (plan: 212 in 69).

| File:line | Use |
|---|---|
| `src/runner/dispatch/config.mjs:203` default, `:241` in `DEFAULT_RUNNER_CONFIG`, `:1529-1555` shape, `:1710-1715` required | definition, default, validation |
| `src/runner/execution/bind.mjs:9,127,128,151,152` | `resolveTierCeiling`, `resolveSeatTier` |
| `src/runner/dispatch/assignment-policy.mjs:24,253,314,316,319` | work path tier |
| `src/runner/dispatch/cli.mjs:589` | `executeExecutorCli` tier |
| `src/runner/loop.mjs:1609` | loop worker tier (`config.rigorToTier?.[itemRigor] ?? 'standard'`) |
| `src/runner/execution/run.mjs:166` | `snapshotRunnerConfig` |
| `src/setup/registrations.mjs:91,508-518,765-789,1438,1468` | doctor rows |
| `scripts/project-agents.mjs:36,85` | persona rigor to model |

Docs that name it (for phase 11): `CHANGELOG.md:557`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:233,237`, `docs/specs/work-state.md:54`, `docs/specs/runner.md:73,89,91,1084,1140,1319,1323,3138,3485`, `docs/specs/reading-map.md:35`, `docs/decisions/index.md:49`. `docs/platform/component-boundary.md:64` is the Execution Core row.

Config presence (names only): `runner.rigorToTier` exists in the global file and in all three workspace project files, all with `low=nano, standard=standard, high=flagship, critical=frontier`.

### 3.3 JS model choice (RT-12), confirmed and extended

| Symbol | Defined | Call sites (non-test) |
|---|---|---|
| `resolveTierModel` | `dispatch/resolve.mjs:183` | `loop.mjs:1614`, `dispatch/cli.mjs:593`, `assignment-runner.mjs:230`, `assignment-policy.mjs:449`, `setup/model-pool-checks.mjs:209`, `scripts/project-agents.mjs:87`, `bind.mjs:309` (7, as the plan says). Importers: `loop.mjs:83` (via barrel), `scripts/project-agents.mjs:34` (via barrel). |
| `resolveTierCandidates` | `resolve.mjs:140` | `bind.mjs:317`, `resolve.mjs:184` |
| `tierFallbackOf` | `resolve.mjs:172` | `bind.mjs:434` only |
| `resolveStrongerTier` | `assignment-policy.mjs:107` | `bind.mjs:157`, `assignment-policy.mjs:349`, `dispatch/cli.mjs:591`, `dispatch/assignment.mjs:606` (4; plan names only `assignment.mjs:606`) |
| `TIER_STRENGTH` | `assignment-policy.mjs:30` | `bind.mjs:129,161`, `assignment-policy.mjs:252` |
| Barrel | `src/runner/dispatch.mjs:28` (`resolveTierModel`), `:66-68` (`resolveAssignmentDispatchPolicy`, `resolveStrongerTier`, `TIER_STRENGTH`) | the plan also cites `:40-41`; those two lines re-export `rankProviderAccounts` and `acquireProviderAccountLease` (a different mechanism, already in the criterion-1 grep) |
| `scripts/project-agents.mjs:36,84-89` | persona rigor to model through `rigorToTier` | confirmed |

No miss found beyond the extra `resolveStrongerTier`/`TIER_STRENGTH` sites above.

### 3.4 Effective rigor (RT-13)

| Site | What it computes |
|---|---|
| `bind.mjs:141-153` (`resolveSeatTier`) | stronger of unit rigor and capability rigor, else `standard`; override tier raises (`:157`); ceiling clamps (`:161`) |
| `assignment-policy.mjs:261-310` | operation rigor, then assignment rigor, then capability rigor (`:287-293`), then CLI rigor (`:304-305`); tier from `rigorToTier` (`:316`); **reasoning effort from rigor** (`:382-383`) |
| `dispatch/cli.mjs:576-591` | `rigorOverride` x capability rigor |
| `dispatch/plan.mjs:415-416` | capability rigor into the synthetic policy |
| `patterns/reviewed.mjs:41-43` | `unit.rigor` only, exact key into `checkersByRigor` (no prefix) |
| `patterns/reviewed.mjs:91-92` | unit x capability stronger-of; high/critical triggers the three-family rule |
| `work-dispatch.mjs:348-365` (`workRigorFor`), `:495` | Work item: operation rigor, item `rigor` raises, `risk: heavy` reads as high only without `rigor` |
| `loop.mjs:1608-1612` | item `rigor` or `risk: heavy` to tier |
| `state/replay.mjs:102`, `:398` | `risk: heavy` to `rigor: high` on read |
| `case-start.mjs:52-57`, `case-admission.mjs:231-233` | guide `rigorFloor` (a floor check on proposals) |
| `run.mjs:632`, `:848-849` | passes `unit.rigor` into the policy so both layers tier the same |

### 3.5 `assignment-policy.mjs` and the recompute after `bind()`

`runUnit` binds a seat at `run.mjs:925`, then calls `executeAssignment` (`run.mjs:856`, defined `assignment-runner.mjs:1270`). `executeAssignment` recomputes the policy: `compileDispatchPlan(cfg, {assignment..., assignmentItem...})` at `assignment-runner.mjs:~1417`, which calls `resolveAssignmentDispatchPolicy` at `plan.mjs:118,174,427` over the same config, with `unit.rigor` passed through (`run.mjs:848-849`). So tier, model, provider model, persona and confinement are chosen twice: once by `bind()` and once by the work path, then compared only for executor, pool, tier and posture in the write gate. Test files naming `assignment-policy` or the function: 8.

### 3.6 `attemptProviderCapacityFallback`

Defined `assignment-runner.mjs:1026`, one call at `:1711`, using `recovery.mjs:93` `resolveFallback` (imported `assignment-runner.mjs:60`, used `:1054`). `executeAssignment` has two callers: `run.mjs:856` (every unit seat) and `dispatch/cli.mjs:1037` (`probe-account`). So the second walker is reachable from every unit seat and from the probe door.

### 3.7 Replay sites (RT-5)

| Site | Facts |
|---|---|
| Write gate | `assignment-runner.mjs:466-500` recompute. Inputs: `unitRecord.unit`, `unitRecord.overrides`, `unitRecord.configSnapshot.runner` (**falls back to the live `opts.runnerConfig`** if absent, `:473`), `session` from `opts.session` (live, not persisted), and walk state `walkStateOf(unitRecord, {role: seatRoleOf(asgn), round, assignmentId})` (`account-rotation.mjs:77-85`: `bindings["<role>/<round>"]` attempts give `tried[]`, and `excludePools` from credential faults). Compared fields: `executor`, `pool`, `tier`, `posture` (`:493-497`). `seatRoleOf` is `:1171`. `commit-unit-work.mjs` has no `bind` reference. |
| Doctor replay | `checkMutatingAssignmentBindingSnapshot` `registrations.mjs:627-691`, registered `:1455`. Replays only when `result.json` has `binding` and `role`. Counts per workspace in `.fgos/assignments`: forgentX 2,407 listed runs, 1,176 unit-shaped, 2,278 `result.json`, **0** with `binding`; mdview 169 / 155 / 0; mcp-skill-hub 7 / 4 / 0. Real replays: 0. |
| `dispatch probe-account` | `dispatch/cli.mjs:1011-1060`. Inputs: `--provider`, `--account`, `--executor`, `--invocation(s)`, `--cwd`, `--timeout-ms`; builds an **inline** assignment (`provenance.kind: 'inline'`) and calls `executeAssignment` read-only with `cliOverride`; `cfg: ensureRunnerConfigForDir(repoRoot)` is itself a fill-missing writer. It stays outside Seat Binding. |

### 3.8 `provider-capacity.mjs`

`acquireProviderAccountLease` `:605`, rank + `ranked[0]` inside `withProviderStateLock` `:623-636` (`:634`); `rankProviderAccounts` `:595`; per-CLI login filter `inventoryServingCli` `:665` (applied `:618`); `withProviderStateLock` `:423` (waits 30 s; does not call `noteLockHeld`; the only `noteLockHeld` user is `state/hot-lock.mjs:364`). Host execs while the lock is held: see C5 (one adopt probe per dead-pid lease with an envelope; the lock acquire and release are themselves host routes). `/proc` reads (`process-identity.mjs:46-53`) are not execs. 23 source importers of `provider-capacity.mjs`: `case-start.mjs`, `registrations.mjs`, `verbs/dispatch/{reconcile,inspect}.mjs`, `provider-credential-{probe,renewal}.mjs`, `dispatch.mjs`, `explain.mjs`, `account-pin.mjs`, `dispatch/config.mjs`, `account-rotation.mjs`, `bind.mjs`, `transport.mjs`, `llm-accounts.mjs`, `assignment-runner.mjs`, `resolve.mjs`, `provider-account-probe.mjs`, `confinement/request.mjs`, `confinement/drivers/bwrap.mjs`, `herdr-round.mjs`, `settlement.mjs`, `process-identity.mjs`.

### 3.9 `tier-cell.mjs` `parseTierCell`

`:25-40`, throws on a non-string or empty entry. Importers: `config.mjs:23` (uses `:1488`, `:1573`), `resolve.mjs:13` (`:157`), `model-pool-checks.mjs:9` (`:120`). Also exports `isExtendedTierCell` (`config.mjs:23`, `:306`).

### 3.10 Role-keyed storage and readers (RT-6): the complete work list for phase 02

Writers and keys:

| Key form | Site |
|---|---|
| `unit.json.bindings["<role>/<round>"]` | `run.mjs:922` (key), `:1039` (assignment id `<unitRunId>/<role>/<round>[-fb<n>]`), `:1040` (`path.join(unitDir, role, round)`, **no charset check**), `:1355` (`path.join(unitDir, role, round, 'runs', '01')`) |
| executor ledger by role | `role-ledger.mjs:20-34` (`note`, `seats`, `resolve`); `run.mjs:768` |
| seat directory read | `unit-run-history.mjs:41-64` (`readUnitRunSeats` takes each `unitDir` subdirectory name as the role), `:73` (rebuilds `<unit>/<role>/<round>`) |

Readers by `<role>/<round>` key or directory: `account-rotation.mjs:78`; `unit-summary.mjs:98,101`; `run.mjs:755,768,976`; `unit-sync.mjs:76` (`bindings['producer/1']`), `:109` (result role `sync`); `registrations.mjs:638` (`assignmentId.split('/')`), `:660-664` (`resultData.role`); `assignment-layout.mjs:50-53` (`split('/')`; rejects only empty, `.`, `..`, absolute segments, so `\`, NUL and long names pass); `operation-choice.mjs:145` (`asgnId.split('/')`), `:156`, `:2348` (role `producer`); `unit-state.mjs:36` (`split('/')[0]`, unit id only); `assignment-runner.mjs:416,2316,2391` (`split('/')[0]`, unit id only).

Readers by role name on results or history: `unit-handoff.mjs:71,72,80,144,359,391`; `workflow/ref-digests.mjs:116-122`; `execution/handoff-refs.mjs:124` (parses `unit-run:<id>/<role>`), `:134`, `:67`; `case-projection.mjs:242-246`; `case-start.mjs:234-238`; `workflow/runner.mjs:364-372` (`dry.roles`); `seat-providers.mjs:24`; `unit-summary.mjs:64-71,84-88`; `patterns/solo.mjs:28-30`, `patterns/panel.mjs:28-92`, `patterns/debate.mjs:53-126`, `patterns/reviewed.mjs:126-319` (about 14 `h.role ===` lookups); `settlement.mjs:290,568,776,795`; `assignment-runner.mjs:1172,1804,2396,2567`; `run.mjs:76` (persona pin override `scope.role`); `setup/workflow-pool-independence.mjs:169-175`; `setup/blind-steps-proven-pools.mjs:121`; `bin/fgos.mjs:743`.

External readers that must keep a legacy path: `packages/run-result/contracts/unit-summary.read.v2.json:55` (`seats[].role`, `kind`), `packages/observe/rust/src/metrics_cli/discussions.rs:166-174` (reads `unit["seats"]` filtered on `kind == "panelist"`).

Not role readers (C8): `work-dispatch.mjs:377-384`, `case-admission.mjs:108,173`.

### 3.11 Role-name branches

`bind.mjs:19-24` `CHECKER_ROLES` (`reviewer, red-team, tester, panelist, synthesizer, thesis, antithesis, judge`) plus `startsWith('panelist-')`, used at `:257,301,399,546`. `config.mjs:1383` `VALID_CHECKER_ROLES = reviewer, red-team, tester` (used `:1350,1438`). Second set `registrations.mjs:591` `VALID_CHECKERS` (same three) in `checkRunnerPatternsConfig` (`:547`). `panel.mjs:26-35` (`panelist-N`, `synthesizer`), `debate.mjs:35-43` (`thesis`, `antithesis`, `judge`, `<role>-rebuttal` at `:100`), `role-tasks.mjs:67` (`red-team` text) and `:100` (`kind === 'panelist'`), `agent-result-claim-contract.mjs:25-27` (`reviewer`/`red-team` require an assessment verdict; `tester` does not), `case-projection.mjs:242-246`. `DEFAULT_CHECKERS_BY_RIGOR` `patterns/reviewed.mjs:25`, read at `:42-43`.

### 3.12 Inline-lead path

`bind.mjs:498-516` (source `session-lead-inline`, only for `role === 'producer'` with a lead present, not blind, no required skills). Its consumer side is the whole `pending-inline` machinery: `run.mjs:1012` (writes `pending-inline.json`), `:1258-1259` (`execution: {status: 'pending-inline'}`), `:1312-1331` (consumes it), `unit-summary.mjs:43`, `operation-choice.mjs:2356` (`unit-pending-inline`). Tests: `cli/run-verb.test.mjs:133`, `runner/execution/run.test.mjs:183-237,1193-1331`, `runner/execution/unit-summary.test.mjs:238-256`. Deleting the escape deletes all of these together; the plan's "1 consumer" counts only the `bind.mjs` line.

### 3.13 `human-cli` origin and raise doors (RT-11)

Synthesised: `bin/fgos.mjs:2851` (`--override` entries without origin), `:2862,2878,2889`; `workflow/unit-handoff.mjs:198` (fallback override for workflow `--effort`/`--timeout`/`--account`), and `:187` stamps `origin: 'workflow'` on seat-scoped persona pins. Trusted: `bind.mjs:385` (`acceptDependence === true` and `origin === 'human-cli'`). Other readers of `override.origin`: only `bind.mjs:158,588,616,630,672,677-678` (provenance strings). `runUnit` callers (6 sites, 5 doors): `bin/fgos.mjs:2928` (`fgos run`), `workflow/runner.mjs:401,422`, `work-dispatch.mjs:127`, `fanout-batch.mjs:113`, `operation-choice.mjs:2332`. `units-source.mjs:97` tags `source: 'units-file'` (and `prefer` is accepted from a units file at `:79`).

### 3.14 Bare-verb lookup

`bind.mjs:73-89` (`lookupCapabilityConfig`, bare verb tried at `:81` after the exact key; an entry with a usable `prefer` wins). Other consumers: `registrations.mjs:2654,2668` (`workflow-capabilities-configured`), `bin/fgos.mjs:2583` (catalog description), `report/capability-plan-lint.mjs:136,143,150`.

Bare-verb entries per workspace and layer (names and field kinds only):

| Layer | Bare entries | With `prefer` |
|---|---|---|
| global `~/.fgos/config.json` | `advise`, `execute`, `review` | none (fields: `description`, `confinement`, `serves`) |
| forgentX project | `impact-analysis`, `pane-labeling`, `advise`, `execute`, `review`, `fgos-coding-implement` | `impact-analysis` (string), `advise`, `execute`, `fgos-coding-implement` |
| mdview project | `advise`, `execute`, `review`, `impact-analysis`, `pane-labeling`, `fgos-coding-implement` | `advise`, `execute` (string), `impact-analysis` (string), `fgos-coding-implement` |
| mcp-skill-hub project | `advise`, `execute`, `review` | none |

No `<prefix>:v` capability (22 used by shipped workflows plus every prefixed key in the configs) relies on a bare verb for `prefer` in any workspace (C15). Capabilities with no usable `prefer` at all: forgentX `docs:write`; mdview `coding:discover`, `coding:explore`, `coding:implement`, `coding:validate`, `docs:write`, `group-cognition:explore`; mcp-skill-hub every one of the 36 (it has no `prefer` anywhere). These are the expected-info refusals of the dry-bind row (RT-16g).

### 3.15 Unit rigor raising tier today (RT-16d): the list for the conversion diff and CHANGELOG

| Source | Where | Effect today |
|---|---|---|
| Workflow unit `rigor: high` | `core/workflows/architecture-advisory.yaml:62`, `core/workflows/architecture-advisory-reopen.yaml:20` | forgentX: no raise (capability rigor is already `critical` on `architecture:synthesize`); mdview and mcp-skill-hub: raises that unit to `flagship` and triggers the three-family checker rule (`reviewed.mjs:91`) |
| Operation policy `rigor: standard` | `domains/coding/workflows/feature.yaml:64` | no raise (`standard`) |
| `--rigor` | `bin/fgos.mjs:517` (`fgos run`), `:617` (discover), `:1080` (add), `:1197` (submit); `command-registry.mjs:1333,1370` | raises seat tier through the unit |
| Guide `rigorFloor` | `case-start.mjs:52-57`; every shipped workflow sets `rigorFloor: standard` in `frameDefaults` (`architecture-advisory*.yaml:16/9`, `nominal-group:17`, `business-discussion:17`, `group-cognition:17`, `council-lite:12`, `delphi:21`, `marketing/content-publish:30`) | floor only; `standard` raises nothing |
| Work `risk: heavy` | `state/replay.mjs:102,398`, `work-dispatch.mjs:365`, `loop.mjs:1608` | reads as `rigor: high` |
| Persona agent `rigor: standard` | `domains/marketing/agents/*.yaml:15` (4 files) | picks the model in `scripts/project-agents.mjs` |
| Capability `rigor` in config | forgentX only: `architecture:frame` high, `:shape` critical, `:critique` high, `:synthesize` critical, `:explain` critical. mdview, mcp-skill-hub and the global file have none | this is the only rigor the conversion keeps (as tier) |

Net: the conversion has real work on one workspace (forgentX, 5 capabilities plus `maxTier: flagship`, `tierFallback`). The other two workspaces convert to "delete `rigorToTier`, add the schema marker"; the only tier change there is the loss of the `rigor: high` raise on the two architecture-advisory units.

### 3.16 Smaller rows

| Row | Verified |
|---|---|
| `agent-definitions.mjs` | `agentTierDirs` `:36-54`; importers in C13 |
| `workflow/loader.mjs` | flat files in `workflows/`; domains read `domains/<d>/workflows/*.{yaml,yml,json}` (`:72-100`); `loadWorkflow` used by `case-start.mjs:12` and re-exported `workflow/index.mjs:5`; tests: `guide-schema`, `business-discussion-workflow`, `seats`, `rust-host/release-tree` (4) |
| `snapshotRunnerConfig` | `run.mjs:161-172`; consumers `run.mjs:606`, `workflow/runner.mjs:358`, `case-start.mjs:229,276`, `operation-choice.mjs:2312` |
| `unit.prefer` / `--provider` | `unit.mjs:21-36` (shape), `:293`; `bin/fgos.mjs:488-491` (`--provider` fills `prefer`, agent executors only). A **registered workflow YAML cannot set `prefer`**: `definition.mjs:277` skips it unless the loader source is `units-file`. A `--units`/`--unit` file can (`units-source.mjs:79`, tag `:97`). `workflow/runner.mjs:263` passes `template.prefer` through. |
| `workflow start --seats` | `seats.mjs:124-172`: seats are keyed `panelist-<index+1>` (`:124`); `curatedReason` refuses a base whose `roleTasks` already use `panelist-N` keys (`:98-105`) |

### 3.17 Fill-missing writers (RT-2), confirmed

Both write before validating. `ensureRunnerConfigForDir`: project file written at `config.mjs:410` when keys were added, validated at `:417`; the global file is only read and sanitised (`:415`). `fgos setup`: `ensureSharedConfigDefaults(repoRoot)` at `bin/fgos.mjs:4058` and `ensureSharedConfigDefaults(os.homedir())` at `:4061`; the registered `runner` default shape is `{...DEFAULT_RUNNER_CONFIG, ...}` (`registrations.mjs:2538-2546`), which includes `rigorToTier` (`config.mjs:241`). Measured (section 9): the current `ensureRunnerConfigForDir` on a project file without `rigorToTier` writes `rigorToTier` back into the file, then refuses on the sentinel.

### 3.18 Doctor rows (spec section 9 step 8)

| Row (`registrations.mjs`) | Reads `rigorToTier` | Reads roles | Reads bare verb | Notes |
|---|---|---|---|---|
| `runner-rigor-config` `:1437` | yes, directly (`:508-518`) | no | no | also checks capabilities declare only rigor floors |
| `tier-vocabulary-dead-keys` `:1461` (`checkTierVocabularyDeadKeys :693`) | no | no | no | retired-key list only |
| `model-policy-tier-coverage` `:1467` (`:757`, `:765-789`) | yes, directly | no | no | |
| `executor-family-unique` `:1473` | no | no | no | |
| `tier-fallback` `:1485` | no | no | no | |
| `model-policy-pools` `:1491` | no | no | no | |
| `capability-rigor-ceiling` `:1515` (`model-pool-checks.mjs:198-209`) | indirectly (`resolveTierCeiling`, `bind.mjs:127`) | no | no | informational today |
| `workflow-capabilities-configured` `:2681` | no | no | **yes** (`:2654`, `:2668`) | |
| `workflow-pools-satisfy-independence` `:4772` | indirectly (dry-bind) | **yes** (`workflow-pool-independence.mjs:169-175`) | via `bind` | |
| `blind-steps-use-proven-pools` `:4781` | indirectly | **yes** (`blind-steps-proven-pools.mjs:121`) | via `listCandidates` | imports a walk export |
| `executor-posture-coverage` `:4790` | indirectly (`bind` at `:71`) | no | `hasUsablePrefer` | |
| `mutating-assignment-binding-snapshot` `:1455` | indirectly (`bind`) | **yes** (`:638,:660`) | via `bind` | vacuous today (C1) |
| `runner-patterns-config` `:1449` (`checkRunnerPatternsConfig :547`) | no | the second checker set `:591` | no | keyed by rigor (`checkersByRigor`), not removed by the spec |

## 4. Classification of the 62 `rigorToTier` test files (RT-16f)

Method: for each file, the lines carrying `rigorToTier` were separated from lines that pass a rigor as input (`rigor: '<level>'`, `--rigor`, `effectiveRigor`, `rigorFloor`) and from assertions about tier, model or `tierSource`; borderline files were read. A file is in A when an assertion depends on rigor choosing a tier (or on a rigor-driven composition or on a row that is deleted). Nothing was run.

**A. Asserts rigor to tier or a deleted contract: hand rewrite to declared tiers (14)**

| File | Evidence |
|---|---|
| `test/runner/assignment-policy.test.mjs` | `:666` title "rigor maps through runner.rigorToTier", `:784-787` invalid-tier error |
| `test/runner/dispatch.test.mjs` | `:314` "loadRunnerConfig rejects a rigorToTier map that lowers supply for stronger rigor"; 46 hits, 52 tier assertions |
| `test/runner/execution/bind.test.mjs` | `:840-893` unit rigor low selects nano, capability rigor floor raises, ceiling and `maxTier` clamp, `provenance.tier.source` |
| `test/runner/dead-vocabulary-guard.test.mjs` | `:285-325` capability rigor floor elevates tier (`effective.tier === 'flagship'`) |
| `test/state/work-size-rigor.test.mjs` | `:133` "rigor: high -> tier flagship (qua rigorToTier)" |
| `test/runner/driver-rununit.test.mjs` | `:281-295` each Work source reaches the policy; `runner.rigorToTier[c.expect]` |
| `test/runner/execution/tier-fallback.test.mjs` | `:71`, `:200` unit rigor high or low changes tier |
| `test/runner/spawn-worker.test.mjs` | `:97` rigor critical, `:128` default tier, `:389` capability rigor as a raise-only floor |
| `test/scripts/project-agents.test.mjs` | `:50` "rigor resolves through the same tier->model map", `:104` unknown rigor refused |
| `test/setup/model-pool-checks.test.mjs` | `:136-155` `capability-rigor-ceiling` row (deleted with the row) |
| `test/setup/checks-doctor-config.test.mjs` | `:1060-1159` rows that read `rigorToTier` (`runner-rigor-config`, `model-policy-tier-coverage`) |
| `test/runner/execution/run.test.mjs` | `:1817-1855` "a reviewed run at rigor high puts the producer and both checkers on three ..." (composition by rigor) |
| `test/runner/execution/explain.test.mjs` | `:47` asserts `tier` source `rigor:standard` |
| `test/runner/execution/run-case-admission.test.mjs` | `:325` reviewed unit at rigor high gives 6 seat launches |

**B. Fixture plus a literal `rigor:` input, no assertion that rigor chose the tier: codemod writes the converter output as literal source, then the file must still pass unchanged (13)**

`test/cli/run-verb.test.mjs` (asserts `unit.rigor` is stored, not the tier), `test/workflow/units-runner.test.mjs`, `test/runner/execution/run-posture.test.mjs`, `test/setup/observe-doctor-checks.test.mjs`, `test/helpers/workflow-fixture-repo.mjs`, `test/runner/effective-execution-contract.test.mjs`, `test/runner/execution/run-sync.test.mjs`, `test/workflow/advisory-m-contracts.test.mjs`, `test/workflow/workflow-runner.test.mjs`, `test/runner/execution/account-rotation.test.mjs`, `test/runner/execution/run-provider-failover.test.mjs`, `test/runner/tier-cell.test.mjs`, `test/runner/dispatch-execute-effort.test.mjs`. In all of them the capability `rigor` is `standard` (or the unit rigor is `standard`), which equals `defaults.tier`, so the converter drops it; the risk is only in the `rigor: 'high'` lines of `run-verb.test.mjs` and `units-runner.test.mjs` (`:551-552`), which need a look after conversion.

**C. Pure fixture: the `rigorToTier` key is config boilerplate, nothing reads a rigor (35)**

`test/cli/execution-outcome-exit-codes.test.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`, `test/e2e/coexistence-canary.test.mjs`, `test/e2e/domain-aware-stage-literals.test.mjs`, `test/e2e/pr-gate.test.mjs`, `test/e2e/runner-loop.test.mjs`, `test/e2e/self-improve-loop.test.mjs`, `test/e2e/synthetic-domain.test.mjs`, `test/fixtures/confinement-migrated-executors.json`, `test/runner/assignment-cwd-mutex-concurrency.test.mjs`, `test/runner/assignment-dispatch.test.mjs` (14 blocks), `test/runner/assignment-runresult.test.mjs` (23 blocks), `test/runner/credential-store.test.mjs`, `test/runner/custody-successor-admission.test.mjs`, `test/runner/dispatch-confinement-policies.test.mjs`, `test/runner/dispatch-execute-for-capability.test.mjs`, `test/runner/dispatch-executor-profile.test.mjs`, `test/runner/dispatch-governance-operability.test.mjs`, `test/runner/dispatch-operability-production-door.test.mjs`, `test/runner/dispatch-production-call-sites.test.mjs`, `test/runner/dispatch-run-timeout.test.mjs`, `test/runner/dispatch-stray-write-attribution.test.mjs`, `test/runner/egress-governance.test.mjs`, `test/runner/herdr-spawn-adapter.test.mjs`, `test/runner/operation-choice.test.mjs`, `test/runner/operation-prompt-templates.test.mjs`, `test/runner/provider-pool-lease.test.mjs`, `test/runner/tier-fallback-config.test.mjs`, `test/runner/work-path-case-admission.test.mjs`, `test/run-supervisor/fixtures/terminal-controller.mjs`, `test/run-supervisor/support/direct-harness.mjs`, `test/run-supervisor/support/terminal-harness.mjs`, `test/scripts/dispatch-decide-hook.test.mjs`, `test/setup/agent-cli-trust-check.test.mjs`, `test/setup/capability-catalog-doctrine.test.mjs`.

Two C files have tier assertions that do not depend on rigor (`operation-prompt-templates` `:51-294`, `tier-fallback-config` `:42-49`); one C file asserts a different thing about the same key (`dispatch-execute-for-capability.test.mjs:91`). They are listed so the codemod run is read, not trusted.

**Outside the 62: 16 more test files pass rigor values as input but never name `rigorToTier`** (they can change when unit rigor stops raising tier, or when the default config stops carrying the map): `test/direct/fgos-step.test.mjs`, `test/intake/discovery.test.mjs`, `test/parity/step-parity.test.mjs`, `test/runner/assignment-provenance.test.mjs`, `test/runner/assignment.test.mjs`, `test/runner/dispatch-config-patterns.test.mjs`, `test/runner/dispatch-i08b-remediation.test.mjs`, `test/runner/enrich-and-validate-contract.test.mjs`, `test/runner/execution/patterns/reviewed.test.mjs`, `test/runner/execution/unit.test.mjs`, `test/runner/loop.test.mjs`, `test/runner/work-unit-for.test.mjs`, `test/setup/checks.test.mjs`, `test/setup/registrations.test.mjs`, `test/state/domain-registry.test.mjs`, `test/workflow/case-admission.test.mjs`. Phase 06/07 should read them once; the criterion-1 grep will not find them.

## 5. Prior art (AGENTS.md "Prior art before design")

`git log -S` on each symbol; a symbol that never existed under another id has no old-id search to make. The only executor-id rename is `a9fc61324` "rename executors to provider names, merge codex+pi into openai" (old ids such as `agy-cli-mucdong` appear in 20 commits); none of the symbols below is an executor id.

| Symbol | First change | What it was | Removal attempted before? |
|---|---|---|---|
| `rigorToTier` / `DEFAULT_RIGOR_TO_TIER` | plan commits `8685acf1c`, `1a4de1e8c` (2026-09-30), code `338705c66` "consolidate rigor demand vocabulary" (2026-10-01), then `5dd2ae13d` (work.tier split, deleted `DEFAULT_TIER_TO_POLICY`), `4b7a20000` (dead vocabulary guard) | RUL72 "2 scales + 1 table, delete every overlapping layer" (`runner.md:1081-1090`, plan `plans/260930-0445-tier-rigor-vocabulary-consolidation`): it **replaced** an older tier-to-policy table with `rigorToTier` | No. D-ADR0072 is the first decision to remove it. The dead-vocabulary guard (`test/runner/dead-vocabulary-guard.test.mjs`) pins the earlier removals, so deleting `rigorToTier` should add to it, not fight it |
| `tierCeiling` / `resolveTierCeiling` | `db422f86d` "let a capability's own rigor raise its tier ceiling above runner.maxTier" (RUL103, `runner.md:1140`), touched by `d81af6087` | the capability rigor raise the spec replaces with declared `tier` | No |
| `CHECKER_ROLES` | `abe6f2b3c` (Wave B: Unit contract, taste config, core `bind()`, collaboration patterns) | name-keyed checker set | No |
| `session-lead-inline` | `abe6f2b3c`; the `pending-inline` machinery came with `073c8b6fc` (fgos run door) | inline lead producer | No |
| `resolveTierModel` | born with the tier work (`8685acf1c` plans, code in `338705c66` era; the D7 resolver split `tsk-2uf-1`, `resolve.mjs:2`) | JS model choice | No |
| `walkBindings` / `nextCandidate` | `d81af6087` "walk tier-cell entries and the declared family order in bind" | bind-level walk | No |
| `attemptProviderCapacityFallback` | `eb78cc0c9` "real cross-provider fallback on provider-capacity refusal" (plan `260917-executor-profile-schema-migration`, Phase B) | second walker | No |
| `human-cli` origin | `abe6f2b3c`, `073c8b6fc` | trusted override origin | No |
| `seatId` | never in code, docs or core (`git log -S` empty) | | |
| `schemaVersion` | only in coordination store commits (`626e057b1` ... `2180b4e72`), none in runner or workflow | unrelated to the seat contract | |
| `seat`/`seats` (as a word) | 61 commits touch it in `src/runner src/workflow`; first `970234359` (run liveness), then workflow/blind-role commits (`31eb37f6e`, `8301d83ca`, `b19643448`) | seat is a vocabulary, never a stored identity | |

Nothing was found that the wave would silently re-derive. `docs/specs/runner.md` "Lịch sử quyết định" carries RUL69 (six tiers), RUL70 (executor id by `providerModel`), RUL72, RUL103, and D-ADR0072 at `runner.md:3485`; `seat-binding.md` section 15 lists the six rules D-ADR0072 supersedes in part.

## 6. Core workflows with `pattern: panel` or `debate`

| Workflow:line | Pattern | `params.members` | `roleTasks` keys | Persona use |
|---|---|---|---|---|
| `architecture-advisory.yaml:36` (`shape-proposals`) | panel, blind | none (default 3) | `panelist-1`, `-2`, `-3` (system, alternative, constraint lens) | no unit `persona`; the other units `frame-context` and `explain-recommendation` set `persona: advisor` |
| `nominal-group.yaml:27` | panel, blind | none (default 3) | none | `persona: panelist` |
| `group-cognition.yaml:27` | panel, blind | none (default 3) | none | `persona: researcher` |
| `group-cognition.yaml:38` | debate | n/a (`thesis`, `antithesis`, `judge`, plus `thesis-rebuttal`/`antithesis-rebuttal`, `debate.mjs:100`) | none | `persona: critic` |
| `council-lite.yaml:22` | panel, blind | `members: 3` (`:29`) | `panelist-1`, `-2`, `-3` (council postures read from `contextRefs` agent files, `core/agents/council-*.yaml`) | no unit `persona`; posture comes from context refs |
| `business-discussion.yaml:36` | panel, blind | none (default 3) | none | none |
| `delphi.yaml:31` (round 1), `:53` (round 2) | panel, blind (round 2 also `anonymizeInputs`, same-seat `inputs`) | none (default 3) | none | `persona: panelist` on both |

Also relevant for seat identity: `reviewed` units use `roleTasks` keyed `reviewer` and `red-team` (`architecture-advisory.yaml:66`, `business-discussion.yaml:49`, reopen `:24`) with `minCheckers: [reviewer, red-team]`. The panel default of 3 members comes from `resolvePanelRoles` (`panel.mjs:26-35`), not from the YAML, in 5 of 7 panel units: those become explicit `seats:` in the conversion.

## 7. Baseline exec cost

Host: the activation host `hostBin` resolves to `~/.local/state/fgos/releases/sha256:4efa6e15.../bin/fgos`. 50 sequential runs of `internal identity mint-attempt --attempt x --protocol 1` with stdin from `/dev/null`, timed from Node-free Python `subprocess.run`: all exit 0, **p50 1.9 ms, p95 2.8 ms**, min 1.4, max 6.2, mean 2.1 (warm cache, idle machine, output `{"writerId":"att-x"}`). The 2x p95 acceptance bound is therefore about 5.6 ms per exec. An exec carries a 26.6 KB `configSnapshot.runner` in a real record today; the 22 KB figure of RT-16e is the same order.

## 8. Live drain on forgentX (RT-4), read-only

Run through the code the 6.4 lane shipped: `unitControllerHeld` (`unit-control.mjs:27`), `deriveUnitState` (`unit-state.mjs:50-70`) with the read-only adopt probe, and the doctor checks `run-attempts-stuck`, `legacy-attempts-stuck`, `units-awaiting-resume` called as functions (no `--fix`).

### 8.1 Counts of `unit.json` records by `execution.status`

| `execution.status` | Records |
|---|---|
| `settled` | 587 at the final scan (584 at the first scan; other sessions keep adding records) |
| `running` | **31** |
| `pending`, `pending-inline` | 0 and 0 |
| no `execution` field | 81 |
| total with `unit.json` | 699 at the final scan (696 at the first) |

### 8.2 The 31 `running` records

| Group | Count | Evidence | Settling path |
|---|---|---|---|
| Live controller | 1 | `unitControllerHeld` true, attempt probe `running`; created minutes before the scan by a concurrent session (`unit-run-1792510593263-44daa3d2` at the final scan; the id changed between scans because sessions start and finish runs) | none needed; it is not drained, it is another session's work. The drain row must treat "live" as "wait or stop that session", and the count is volatile |
| Dead controller, last attempt closed (`awaiting-resume`) | 28, created 2026-10-09 to 2026-10-20 (26 standalone runs, 2 inside workflow runs: `unit-run-1791978093064-76ed452e`, `unit-run-1792050621492-93d3d721`) | `deriveUnitState` = `awaiting-resume`; doctor `units-awaiting-resume` reports 32 (a superset that also lists older records without an `execution` field) | `fgos run --resume <unitRunId>`, the command the doctor prints. A resume re-enters the unit's remaining steps (commit of `writes`, reviewer seats, summary), so it can start agents and can refuse when the writing worktree is gone |
| Dead controller, attempt unjudgeable (`legacy-run`) | 2: `unit-run-1791479332282-1dcfd052` (workflow `wf-run-1791479133716-34d92648`, step `shaping`, 3 `panelist-N` attempts) and `unit-run-1791706645653-217b08eb` (workflow `wf-run-1791706617162-24fd2476`, step `perspectives`, 2 attempts) | each attempt has `result.json` and `exit.json` but no `attempt.lock`/`envelope.json`; `run.json.status` is `settled`; probe state `legacy-run` | **none proven** (C4) |

### 8.3 Workflow runs

98 workflow runs: 52 completed, 36 failed (terminal), 6 `running`, 4 `parked`.

| Kind | Runs | Holds role-keyed refs? |
|---|---|---|
| Parked at a gate | 4: `wf-run-1791519805545-488f1b9e` and `wf-run-1791628096648-571e602c` (step `close`), `wf-run-1791701324073-705996b3` and `wf-run-1791706729162-fa285270` (step `approval`) | yes: each carries settled units with seats `panelist-1..3`, `synthesizer`, `producer`, `reviewer`, `red-team` (for example `shaping/shape-proposals` with `panelist-1+2+3+synthesizer`). Resuming a gate hands `unit-run:<id>/<role>` refs to the next step, so these need the legacy read path (RT-6) |
| `running`, with a running step | 4: `wf-run-1791479133716-34d92648` (see 8.2, `legacy-run`), `wf-run-1791706617162-24fd2476` (`legacy-run`), `wf-run-1791978093009-f75132c6` (unit `unit-run-1791978093064-76ed452e`, `awaiting-resume`), `wf-run-1792050621283-b8ccbcd1` (unit `unit-run-1792050621492-93d3d721`, `awaiting-resume`) | the unit records are among the 28/2 above |
| `running`, no active step | 2: `wf-run-1790919194728-a48bc335` (one pre-`execution` unit), `wf-run-1792431983910-9c7d8276` (no steps, no refs) | stale; closable with `fgos workflow close <id>` (`bin/fgos.mjs:2348`) |

`fgos workflow close` closes the case and releases quiet worktree bindings; it is refused while a consent gate is parked or a closure milestone is stale (`case-close.mjs:32`), and it does not touch unit records.

### 8.4 Records without `execution` (81)

Derived state: 23 completed, 6 failed, 43 read as `running` (summary outcome `unknown`/`undetermined`, or attempt not closed), 9 `awaiting-resume` (ids from `unit-run-1790918559997` to `unit-run-1791192481353`, 2026-10-02 to 2026-10-05, no settlement). The written predicate does not count them (C2).

### 8.5 Other open runs the predicate does not see

`legacy-attempts-stuck` reports 26 old `asgn_lead_claude_code_session_*` dispatch assignments left `running` with `no-recorded-holders`; they are not unit runs, have no `unit.json`, and the doctor keeps them (never settleable by `--fix`). They do not affect the seat drain but they keep that doctor row at "warning" forever.

### 8.6 Result against the plan's trigger

- A dead record with a verb that settles it: 28 (`--resume`, with the cost and risk above).
- A dead record with **no** settling path: 2 (`legacy-run`, C4), both inside workflow runs that are themselves open.
- Live: 1 (volatile).
- Reversal trigger (reader shim) applies to the 2 records strictly. For the 28 the owner choice is: (a) run 28 real resumes before the wave (agents run, writes may re-commit), (b) accept them as "pre-fence, refused on resume with `record-predates-seat-binding`" and let them sit, or (c) add a unit-level abandon verb first (new capability, so a separate item under RUL104, not part of this wave). This phase does not decide.

## 9. Fence sentinel (RT-3)

Copies of the three real project configs (`forgentX`, `mdview`, `mcp-skill-hub`) were placed in temporary directories, with `runner.patterns.seatBinding = {schema: 1}` added, and loaded with the **current** validator while `HOME` was the real home (real `~/.fgos/config.json`, which carries `rigorToTier` and the bare verbs). `config.mjs:1385-1393` (`ALLOWED_PATTERNS_KEYS = ['defaultRule', 'reviewed']`) raised `contains unknown key "seatBinding". Allowed keys: defaultRule, reviewed.`

| Workspace | Baseline load | `loadRunnerConfigFromDir` with sentinel | `ensureRunnerConfigForDir` with sentinel | Same, project `rigorToTier` removed (converted shape) |
|---|---|---|---|---|
| forgentX | ok | refused | refused | refused |
| mdview | ok | refused | refused | refused |
| mcp-skill-hub | ok | refused | refused | refused |

Findings:
- The refusal does not depend on capability rigor (mdview and mcp-skill-hub have none) and holds with the global layer still supplying `rigorToTier`.
- With the project `rigorToTier` removed, the current `ensureRunnerConfigForDir` first **adds `rigorToTier` back to the project file** (`keysAddedToProjectFile: ["rigorToTier"]` on all three), then refuses. With `rigorToTier` present it adds nothing (bytes unchanged). This is the plan's known "only default keys are added" note (plan, RT-3 contradiction paragraph); it is now measured.
- `~/.fgos/config.json` hash before and after: `7c6c81ab20bd` both; the temporary copies were removed.
- Not tested: the second machine and the old activation as a separate release (the validator under test is this checkout's, which equals the pre-wave release minus the unmerged lanes). A real old-activation check stays in phase 12.

## 10. Limits of this report

- Nothing here ran a write verb. The `--resume` outcome for the 2 `legacy-run` records and for the 28 `awaiting-resume` records is read from code (`run.mjs:208-230`, `admissionIdentityFor`), not exercised.
- The second machine's global file was not reachable; the plan treats it as carrying `rigorToTier` (adjudication open question). This machine's global file does.
- Test classification is a reading plus counts, not a run; the codemod phase should treat B and C as "likely" and A as "certain".
- `fgos convention path --kind report --type phase-lead --slug seat-binding-facts --json` returns `plans/reports/phase-lead-261020-2249-seat-binding-facts.md`; this report keeps the name the big lead's brief gave. If the repo's convention check wants the generated name, rename in one commit.
- The method named in the brief (`ak:cook --auto`) is an implementation pipeline; this phase is read-only and writes one report, so the phase file was followed directly instead.
