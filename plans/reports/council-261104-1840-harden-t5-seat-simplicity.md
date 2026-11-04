# HARDEN T5 council: SIMPLICITY seat (axes C, D, E: one door, dead code, size)

Read-only review at main `c129461af`/`af19e6de6`, fg-server2, 2026-11-04. Lens: duplicated mechanisms, dead code, the two giant functions, `config.mjs`, test duplication, a Node budget per component. RUL104 applies: each proposal below makes code smaller or simpler; an addition says what it replaces (section 8 only).

## What I ran, and what I did not read

- Read in full: `executeAssignment` (`dispatch/assignment-runner.mjs:1068-2202`), `runUnitBody` and everything around it in `execution/run.mjs:1-130,405-1629`, `src/seat-binding/client.mjs`, `execution/dry-bind.mjs`, `setup/seat-binding-checks.mjs`, `setup/executor-posture-coverage.mjs`, `dispatch/provider-auth-failure.mjs`, `dispatch/process-identity.mjs`, `runner/lock-wait.mjs`, `dispatch/herdr-deadlines.mjs`, `config.mjs:1-60,428-490,1877-2105` (plus a function-length map of the whole file).
- Read in part: `transport.mjs:185-245,600-646`, `settlement.mjs:628-660,735-790`, `provider-capacity.mjs:940-1029`, `run-result.mjs` (export list, `normalizeRunResult*`, `readSettledResult`), `provider-adapter.mjs` (export list and consumers), `bind.mjs` (function list only), the head of `run.test.mjs` and `run-provider-failover.test.mjs`, the 82 golden case names of the seat-binding crate.
- Not read (outside the lens or out of time): Rust crate bodies (only sizes, golden names and the host route), `confinement/**` beyond the dead door, `provider-credential-renewal.mjs`, `cli.mjs`, `herdr-round.mjs`, `assignment.mjs`, `plan.mjs`, `resolve.mjs`, `patterns/**`, `loops/**`. Where I speak about them it is from the baseline or from grep and is marked.
- Ran: `grep`/`wc`/`awk` only, plus a `find` over `.fgos/assignments` for result versions. No test, no node run, no cargo; no private Cargo target was created, so there is nothing to delete.

## Part A. Target shape

Plain verdict first: the layer is 91 percent Node because the Node side never shed anything when Rust took a decision. Seat Binding is the one finished move; the rest of the size is (1) two functions that hold the whole flow, (2) validation that the config component already performs, (3) dead and shadow mechanisms, (4) tests that prove the same behaviour three times.

| Component | Part or separate | Authority for | Rust/Node boundary | Node budget after (src lines, estimate) | Size target |
|---|---|---|---|---|---|
| Execution Core (`runUnit`, `bind()` facade, Pattern, seat resolver) | Separate (spec row 70) | how a Unit runs: admit, bind per seat, dispatch, commit, settle the unit record | Node orchestrator over ports: bind via the Rust route, attempt via the supervisor, git via the native door. Not a move candidate (it is flow, not a decision). | 7 670 to about 6 900 (`run.mjs` 1 629 to about 1 150) | `runUnitBody` and `runRole` each at or under 250 lines |
| Dispatch (resolver, plan, adapters, `executeAssignment`, config load) | Separate (spec row 75/277) | one Assignment becomes one supervised attempt: plan, lease, prompt, confinement request, envelope, hand-off | Node. Decisions already in Rust (bind, process facts, supervisor, git) are called, never re-done. | 21 133 to about 18 200 | `executeAssignment` at or under 300 lines; `config.mjs` 2 105 to about 1 200 |
| Confinement | Part of Dispatch (one authority file `authority.mjs` plus drivers); spec row 75 lists it with Dispatch | which sandbox a launch gets and the proof of it | Node (bwrap process work belongs next to the supervisor); no move on gain/cost | 6 455 to about 5 900 (dead door 503 out; rest not examined by me) | no second door |
| Seat Binding | Separate, finished | executor, invocation, model, effort, tier, account for one seat | Rust decides; Node client `client.mjs` (173) plus facade `bind.mjs` (563) collects the ask | client 173 stays; `bind.mjs` 563 to about 480 once `dry-bind` shares its ask builder | no new Node policy; Node tests cut to wiring only (section 6) |
| Run Result | Separate by spec (row 76/278); in code it is `run-result.mjs` 1 396 + `settlement.mjs` 828 + `evidence-attribution.mjs` 250 | what an attempt's evidence means: classification, outcome, confidence | Rust reads and scores records; Node writes. Move the outcome derivation to one owner (section 3, option A). | 1 396 to about 1 000 (one written version, no V4, derivation in Rust) | one contract version written |

Spec versus code. Agree: Seat Binding, Execution Core and the one-door rule for config reading. Disagree: (a) the Run Result Evaluator is a "separate component" in the spec, but its writer, its reader and its derivation live in one dispatch file plus a Rust twin, so it has two owners; (b) the config spec says cross-field rules belong to section owners and type rules to the schema (`docs/platform/component-boundary.md` row 91), yet `config.mjs` repeats the schema's type rules (finding 7); (c) the T4 run supervisor is below this layer but imports 13 of its modules (finding 4).

Doctor rows the layer keeps (names from baseline section 4): `seat-binding-route`, `seat-binding-dry-bind` (absorbing `executor-posture-coverage`), `blind-steps-use-proven-pools`, `runner-patterns-config`, `dispatch-decide-hook-wired`, `bwrap-available`, `provider-capacity-state`, the confinement rows, `herdr-executor-kinds`, `executor-*` shape rows. Dropped with their mechanism: `shadow-binder-divergence`. Table in section 5.

## Part B. Findings

### 1. The two giants hold the flow in 25 shared locals (High)

Evidence. `executeAssignment` is `assignment-runner.mjs:1068-2202` (1 135 lines, 279 of them comment lines, so about 856 executable). It keeps `attemptLocks, attemptSettled, handedOffResult, attemptHandedOver, terminalPrep, controlEpoch, controlToken, intentWritten, providerCapacitySelection, providerCapacityEvidence, effectiveContract, resolvedCmd, ...` and a `finally` (2178-2201) that decides what to release from five of them. `runUnitBody` is `run.mjs:611-1628` (1 018 lines, 168 comment lines) with 12 closures over `unitRecord`, `scope`, `rebindKeys`, `seatLedger`.

Failure scenario (concrete, found while reading): the size hides real defects. `run.mjs:1243` returns `{outcome:'policy-refusal', role, round, ...}` but no `role` exists in `runRole`'s scope (only `seat.role`; grep of the file shows no other binding). A writing seat resumed from a record whose first attempt has no `nativeBaseline` therefore throws `ReferenceError: role is not defined` out of the pattern, `runUnitBody`'s catch settles the unit as `execution-failure`, and the named refusal `native-baseline-missing` never appears. `grep -rn native-baseline-missing src test` finds only this line: no test reaches it. Not executed (read-only seat), so unreproduced; the `no-undef` reading is certain.

Real boundaries, no new layer, each cut into the file that already owns the concept:

`executeAssignment` (current lines):
1. `loadImmutableAssignment` (1100-1199, about 100): read or publish `assignment.json`, normalize, resolve the template. Owner: `assignment.mjs` (assignment layout).
2. `leaseAccountForAttempt` (1393-1496 and 1586-1603, about 120): probe quarantined, take the named lease, credential-provisioning check, write the selection file.
3. `settleRefusedLease` (1497-1585, 90): a whole result written by hand (stdout, stderr, evidence, `normalizeRunResultV2`, own run control). Owner: `settlement.mjs`, which already owns "commit a settlement".
4. `settledOrRefuse` (1635-1689, about 55): see finding 9, it reuses `readSettledResult`.
5. `buildLaunch` (1857-1970 and 2003-2101, about 210): command, confinement request, terminal prep, envelope. One function returning what `startSupervisor` needs.
6. `awaitBinding` (2103-2177, about 75).
7. One `attempt` object (as `scope` in run.mjs) that the `finally` reads; it replaces the loose locals.

`runUnitBody`:
1. `loadResumedUnit` (652-737, 85) and `admitFreshUnit` (738-948, 210): both return `{unit, unitRecord, declaredOp, runnerConfigForLoop}`.
2. `assignmentOf(bound, seat, ...)` and the options map of `dispatchBound` (1075-1155, about 80): pure builders; owner `dispatch/assignment.mjs`.
3. `commitWork` and `writeGate` (1245-1278, 35): owner `commit-unit-work.mjs`.
4. `runRole` (1169-1545, 376) splits into `bindSeat`, `finishPendingCommit` (1280-1307), `runAttempt` (1328-1422) and `answerProviderLimit` (1424-1543, 120). The last is the failover state machine; today it is interleaved with `bind`, `seatLedger.serialize` and `persistUnitRecord`.

Duplicates inside, removable while cutting: the `{executor, invocation, transport}` "from" object written 4 times (1342, 1432, 1474, 1534); `assignmentId` computed at 1201 and again at 1328; `unit.writes.length > 0 || unitRecord.sync` six times; the `--force-shared-cwd` error built twice (833, 951); three near-identical `bind(... walk ...)` blocks (1434, 1503, 1519); `catch (err) { throw err; }` at `assignment-runner.mjs:1893-1895` and `1968-1970` (no-ops); `dispatchBatchKey` computed twice (1953, 2028); the `unitRunIdOf` expression twice (1338, 1954). Estimated net: about -150 in `executeAssignment`, about -130 in `run.mjs`, before the moves.

### 2. Dead doors and dead code kept alive by tests (High)

Verified by reading callers (grep over `src bin apps scripts packages`, then `test`):

| Item | Lines | Production callers | Tests |
|---|---|---|---|
| `executeThroughConfinement` (`authority.mjs:913`) | 375 | none (only a comment in `bypass-pairing.mjs:5`, `herdr-round.mjs:115`; a `uncalled-wrapper` row in `mutation-census.v1.json:3343`) | 39 calls in 8 files; `architecture.test.mjs` row 346 |
| `finalizeConfinementResources` (`authority.mjs:1689`) | 128 | none | `cli-spawn-reconciliation.test.mjs` (6 tests) |
| `dispatch/prepare.mjs` | 49 | none; a comment in `operation-choice.mjs:2458` | none |
| `dispatch/recovery.mjs` (`assess`) | 178 | none (`runner/recovery.mjs` and `recovery-planner.mjs` are the live ones) | `dispatch-effect-guarantee.test.mjs` (189 lines, 15 tests) |
| `validatePlacementPolicyShape` (`config.mjs:1285`) and its call `:1887` | 36 | unreachable: `:1881` throws first when `placementPolicy` is defined, and the function itself throws on any value | none |
| `loadRunnerConfig(configPath)` (`config.mjs:466`) | 24 | none (only the barrel `dispatch.mjs:14`) | 10 test files use it as a fixture loader |
| `isSubstantiveEvidenceRef`, `operationDeclaresWorkProduct`, `tierCellMissingDetail`, `selectConfinedInvocationId`, `normalizeRunResultV4`, `OUTCOME_CATEGORIES`, `hasOperationPromptTemplate`, `readSecretSideFile`, `patchCommandRecord`, `readCommandState`, `CONSENT_STALE` | about 120 together | none anywhere (no test either) | none |

Why High: the confinement tests prove a path production never takes. Production runs `prepareConfinementForLaunch` then the supervisor; the 39 test calls run a different driver sequence, so green tests there say nothing about the launch that ships. Re-homing them on `prepareConfinementForLaunch` is the correct fix, not a cost.

Order: delete `prepare.mjs`, `recovery.mjs` plus its test, the 11 unused exports, `validatePlacementPolicyShape`, then re-home the confinement tests and delete both doors, their `dispatch.mjs:46` export, the census row and the `architecture.test.mjs` row. About -850 src, about -600 to -900 test lines.

### 3. Run result twice, and three versions on one path (Medium)

Evidence. Node `deriveOutcome` (`run-result.mjs:1159`), `deriveLegacyOutcome` (1250) and `deriveEvidenceFloor` (1255) re-implement Rust `derive_outcome` / `derive_legacy_outcome` (`packages/run-result/rust/src/lib.rs:23,191`), held together by one shared fixture (`test/fixtures/run-outcome/legacy-derivation.json`, 5 Node tests, 3 Rust tests). Two contract versions are written today: the lease refusal (`assignment-runner.mjs:1537`) writes V2, settlement (`settlement.mjs:751`) writes V3; one function builds both (`run-result.mjs:674-692`). V4 has a validator (`:694-768`, about 75 lines), a constant and a normalizer but no writer and no record: `find` over `.fgos/assignments` returns 778 `result.json`, none with version 4.

Options for the owner of outcome derivation (owner picks; my lean is A):
- A. Rust owns it and Node calls the in-process addon (`nativeDoor()`, already loaded by `run-lock`, `proof-helpers`): delete the three Node derivations (about 180 lines) and the Node side of the shared fixture (5 tests); add one napi binding of about 40 Rust lines. Net about -140 plus -5 tests. Cost: the metrics scan and the unit history read through one door.
- B. Node writes the derived category into `result.json` at settle time and Rust reads it, deriving only for old records (frozen). Adds a field; I would not choose it.
- Either way: write one version (V3) from both paths, delete V4 (about -110), keep the V2/V3 readers for the 709 old records.

### 4. Layering: T0/T1/T4 code in a T5 directory (Medium)

- O-1 confirmed: `dispatch/process-identity.mjs` (29 lines) is imported by 26 files: 15 production, among them `src/state/hot-lock.mjs` and `src/holder-lock/hold-transport.mjs`, and `scripts/run-rust-dev-host.mjs`. `docs/architecture-manifest.json:274` calls it `infra`. It is a client of the native door: move it to `src/native/process-identity.mjs` and change the 26 import lines in one change (principle 1, no old path left). Net 0 lines, removes an upward import from two lower components.
- O-2: the supervisor's `settle-attempt.mjs` (247 lines) calls `settleRunOutcome`, `readSettledResult`, `provider-adapter`, `worker-artifacts`; other T4 files import `run-lock`, `cwd-lock`, `proof-helpers`, `dispatch-error`, `stray-writes`, `trust-store`, `confinement/authority`. The manifest gives both sides the same class, so no guard sees it. Recommendation (a "for T4" note, T4 is closed): move the eight leaf modules T4 needs (`run-lock`, `cwd-lock`, `proof-helpers`, `dispatch-error`, `stray-writes`, `worker-artifacts`, `trust-store`, `process-identity`) down into `src/run-supervisor/` or `src/native/` (T5 already imports T4, so that direction is legal) and leave `settle-attempt` as the one documented plug-in step that calls settlement. No new directory, no new layer.

### 5. Shadow binder and string sniffing remain (Medium; sniff Low)

- O-5: `transport.mjs:205-231` renders the claude argv twice and falls back to the legacy render on mismatch; it exists only for `resolveVerifiedProviderArgs` and `recordShadowBinderDivergence`. `provider-adapter.mjs:378-693` (`BaseProviderAdapter`, five subclasses, `PROVIDER_ADAPTERS`, `getProviderAdapter`, `renderProviderInvocation`, both functions above) has no production consumer except that call (checked: each name in `src`). The legacy render always wins when they differ, so the shadow output is never used; zero divergence events exist on this machine (baseline section 4). Delete: about 315 lines in `provider-adapter.mjs`, 28 in `transport.mjs`, the doctor row `shadow-binder-divergence` (`registrations.mjs:5140`, about 40 lines), and the shadow part of `test/runner/provider-adapter.test.mjs` (607 lines, 5 tests; the file also covers live functions, so about -300). `tsk-p7-shadow-binders` closes.
- O-9: `settlement.mjs:759` `opts?.adapter || (resolvedExecutorId?.includes('herdr') ? ...)`. The only caller, `settle-attempt.mjs:235`, always passes `adapter` from the envelope mode, so the sniff is a dead fallback. Replace with `opts.adapter` required (-1 line, one door). `herdrSpawnAdapter` (`transport.mjs:618`) is a function that only rejects; it is registered so that adapter names resolve. Keep the registration, drop the pretend function body by registering a descriptor (about -10).
- `dry-bind.mjs:46-60` builds its bind ask by hand; `run.mjs:1187-1200` builds the real one. They differ: the run adds `...seatLedger.dependentExecutors(seatId)` (symmetric independence) and `noteDependence`; the dry bind does not. Failure scenario (unreproduced): two seats where a later seat is hard-independent of an earlier one only in the reverse direction; `seat-binding-dry-bind` and the pre-run account-pin check (`assertDoorChoicesBeforeRun`) say "binds", the run then refuses. Fix by one `askFor(seat, ledger, ...)` used by both (about -25).

### 6. Hand-rolled atomic writes (Medium)

Ten sites write a temp file and rename it outside the durable door (baseline O-3; I re-verified with `renameSync` grep: `visibility-session.mjs:94`, `trust-store.mjs:82`, `reconciliation-planner.mjs:266,331`, `attestation-store.mjs:188,216,315`, `unit-summary.mjs:196`, `run.mjs:63`, `provider-credential-renewal.mjs:1236`; the `provider-credential-renewal` moves at 749/1115/1128 are claims and queue moves, not content writes). The door already exists in the same layer: `publishMutableProjection` / `publishImmutableProof` in `proof-helpers.mjs:106-117` (fsynced, over `replaceDurably` / `installOnce`).

Failure scenario for the one that matters: `unit.json` is the resume record. It is first written with a plain `fs.writeFileSync` (`run.mjs:940`) and later with `writeJsonAtomic` (`:59`) that renames without fsync. A crash or power loss between the write and the data reaching disk can leave a zero-length or torn `unit.json`; the resume then does `JSON.parse(fs.readFileSync(...))` at `run.mjs:661` and throws a bare `SyntaxError`, not a named error, and the unit cannot be resumed. Unreproduced (needs a kill at the right instant); the code path is certain. Fix: `writeJsonAtomic` becomes `publishMutableProjection`, the first write too; about -60 lines across the ten sites.

### 7. `config.mjs` repeats the schema (Medium-High by size)

Evidence. `readConfig` already validates the written `runner` section against `core/config-schema/runner.schema.yaml` (947 lines: `executorEntry`, `invocation`, `capability`, `timeoutMs` with `exclusiveMinimum` and `maximum`, `parallel`, `confinement.strict`, tier enums; `packages/config/rust/src/snapshot.rs:404` "only the sections a file wrote are validated"). Then `loadRunnerConfigForDir` (`config.mjs:428-460`) validates the merged value again in Node: `validateRunnerConfigShape` (230 lines) re-checks `timeoutMs` positive number and ceiling, `idleTimeoutMs`, `parallel.maxRoots` as positive integers, `confinement` keys and boolean `strict`, `modelPolicies` object. The function-length map shows the other large type-shape validators: `validateExecutorEntryShape` 125, `validateInvocationShape` 83, `validateCapabilitiesShape` 78, `validateExecutionProfileShape` 74, `validateInteractiveModeShape` 73, `validateExecutorSupportsShape` 50, `validateModelPoliciesShape` 30, `validateTierFallbackShape` 27, `validateRunnerLoopsShape` 105 and `validateRunnerPatternsShape` 153 (the last two mostly table checks).

What stays in Node (cross-field, the section owner's rule per the config spec): `prefer` names a registered executor and invocation (`:1930-1960` region), capability `for` against the catalog, `confinement.policy` exists, strict mode demands a policy per capability, retired keys, the origins attribution. What goes to the schema (config component): object/array/type/enum/min/max/required checks. I did not diff every function against the schema, so the saving is an estimate: up to about -900 lines (2 105 to about 1 200), to be sized function by function in the sub-plan; the schema keeps one authority and gets the `additionalProperties: false` the Node check currently supplies for `confinement` (schema line 149 lacks it, so a move must add it, not lose it). Also dead here: `loadRunnerConfig` and `validatePlacementPolicyShape` (finding 2). `dispatch.mjs` (69 lines, 40 re-exports, 3 production importers) is a barrel kept "for compatibility": move the 3 importers to the owning modules and delete it (L10).

### 8. Wording lists in five places (Medium)

`provider-auth-failure.mjs` (`AUTH_FAILURE_PATTERNS`, `QUOTA_LIMIT_PATTERNS`), `provider-capacity.mjs:946-953` (`AUTH_ANCHOR_PATTERNS`, a second auth list that overlaps the first), and `QUOTA_PATTERN` in `provider-credential-probe.mjs:24` and `provider-account-probe.mjs:26` (the two are the same regex). `classifyProviderCapacityFault` has exactly one production caller (`settlement.mjs:639`) and it already passes `stopCause`; the text branches at `provider-capacity.mjs:974-976` (when `stopCause` is absent) and `:990-1012` (the `openai` branch that reads stderr tail and `AUTH_ANCHOR_PATTERNS` when the adapter outcome is not a provider limit) are the H-T4d text judge. Deleting the second branch is only safe if the agent protocol names `blocked(login|usage-limit)` for every exit the openai CLIs make; I did not verify that (agent-protocol is outside my read set), so: delete `AUTH_ANCHOR_PATTERNS` and the `:990-1012` branch only after the protocol seat confirms coverage; do now what is safe: the two probes import one `QUOTA_LIMIT_WORDS` from `provider-auth-failure.mjs` (-4 lines, one list less). Probes read a real call's output with no receipt, so their auth/quota wording stays until a host route exists (baseline note, owner decision 30).

### 9. Smaller duplicates (Low)

- The "settled result is sound" predicate exists three times: `readSettledResult` (`run-result.mjs:1130`) and twice inline in `executeAssignment` (1564-1572, 1636-1660). One call to `readSettledResult` plus "exists but unreadable means refuse" replaces both (-25).
- 188 hits of plan, phase, finding or audit labels (`Phase 01 R1`, `Cell 6.7 G6`, `ADR-006 R7`, `I04-REV-01`, `Pre-Phase-05 gate H2`) in `src/runner/dispatch` and `src/runner/execution`, 34 in `assignment-runner.mjs` alone; the repo rule (Stable Code Artifacts) forbids them. 279 of the 1 135 lines of `executeAssignment` are comments, many retelling history. Trimming them to the invariant is part of the cut in finding 1 (about -200 lines of comment, no behaviour).
- `lock-wait.mjs` (24 lines) is `fn({waitMs: waitMs ?? DEFAULT})`; one caller `bin/fgos.mjs:103`; `merge.mjs:54` imports only the constant. Inline in `bin/fgos.mjs`, keep the constant where `merge.mjs` can read it, delete the module and `lock-wait.test.mjs` (53 lines).
- `herdr-deadlines.mjs` (7 lines) has one consumer, `setup/terminal-control-checks.mjs:14`. Inline `READY_TIMEOUT_MS` there (it is the check's own rule "grace must exceed ready timeout"), delete the module.

## 2. Tests (section 6 of the brief)

| Behaviour | Owning proof (keep) | Duplicates / problem | Action |
|---|---|---|---|
| Seat binding decision (tier, rank, independence, pins, effort, accounts, walk, refusals) | Rust `golden.rs`, 82 cases | Node `bind.test.mjs` (1 023 lines, 64 tests), `tier-fallback.test.mjs` (177), `seat-policy.test.mjs` (99), `explain.test.mjs` (129), `bind-committed-config`, `bind-tier-composition`, `tier-fallback-config`, `tier-cell`, `seat-binding-dry-bind` (18). Golden names cover pins, spread, cell effort, accounts, walk, caps, persona raises, blind/in-process, unit prefer: the same table the Node tests restate. | Keep in Node only what the facade adds: herdr transport choice, `executorFacts`, `accountViewOf`, refusal mapping, replay, timeouts, skills. Move the rest into golden cases only where a case is missing. Estimate: 64 to about 20 tests, about -700 test lines, no behaviour lost. Owner of the call: SEAT |
| One host exec per bind, none under the hot mutex | `exec-budget.test.mjs`, `client.test.mjs` | 6.6 s for one test | keep, but 1 test only |
| Outcome derivation | after option A: the Rust fixture test | Node `run-outcome.test.mjs` 5 over the same fixture | delete Node copy if A |
| Run layout walk | Rust `layout_fixture.rs` 13 | `assignment-layout.test.mjs` 8 | one wiring test stays |
| Failover state machine (rotate, walk, pinned, partial writes, lease conflict, ceiling) | none at the right layer today | `run-provider-failover.test.mjs`: 30 tests, 123.6 s, each starts real confined workers (file header: "the workers are real confined processes"); a failover test makes 2 to 3 launches, so about 4 s each at the T4 figure of 1.2 s per seat | extract `answerProviderLimit` (finding 1) as a function over `(result, bound, attempts, rotation, baseline)` returning stop, rebind or walk; test the table in-process with `dispatchBound` stubbed (it is already one closure); keep 3 real-launch tests (dead login, usage limit, partial writes). Estimate 124 s to about 15 s |
| Unit run end to end | `run.test.mjs` 87 tests, 139.6 s | each `runUnit` with `confinement: { backend: 'bwrap' }` (head of file) launches a real seat; 13 waits | refusals that happen before admission need no launch: split the pre-admission refusals (config, unit shape, repository, port missing, pins) into a file that never launches; keep about 25 launching tests. Estimate 140 s to about 60 s |
| Confinement authority | `prepareConfinementForLaunch` | 46 call sites to the dead `executeThroughConfinement` / `finalizeConfinementResources` in 8 files | re-home, delete (finding 2) |
| Provider-adapter shadow | none needed | `provider-adapter.test.mjs` shadow part | delete |
| Run-supervisor wording | agent-protocol Rust | `provider-auth-failure` 10 tests, text probes | follow section 8 |

Why `run.test.mjs` takes 140 s and `run-provider-failover.test.mjs` 124 s: not sleeps (the failover file has none); it is the count of real confined seat launches (inferred from the fixtures and the T4 per-seat figure; I did not time a run, the baseline did not either). The fix is the same one rule: a decision is tested where it is decided, with the launch faked at the one closure that already isolates it.

## 3. Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `process-identity.mjs` | nothing; client of process facts | move to `src/native` | wrong layer, 26 importers | 1 | 29 (same) |
| dead doors, `prepare`, `recovery`, 11 exports | nothing | delete | no production caller | 2 | -850 |
| `provider-adapter` shadow classes, `transport` shadow block, doctor row | nothing (legacy always wins) | delete | zero divergence, no consumer | 2 | -385 |
| atomic writes (10 sites) | none | use `publishMutableProjection` | one door | 3 | -60 |
| `dry-bind` ask | none | share one ask builder with `run.mjs` | one door, divergence risk | 3 | -25 |
| `run-result.mjs` versions, V4 | which contract is written | write V3 only, drop V4 | no writer, no record | 3 | -110 |
| outcome derivation | category of a run | Node to Rust door (option A) | two owners today | 5 | -180 Node, +40 Rust |
| `executeAssignment`, `runUnitBody`, `runRole` | flow | cut along the boundaries in finding 1, in the owning files | size, bugs, test speed | 4 (after 2 and 3 so cuts start from live code) | -280 net, then moves |
| `config.mjs` type checks | shape of the runner section | to `runner.schema.yaml` (config component) | schema already validates | 5 | -900 estimate |
| quota/auth wordings | provider stop cause | one list now; text judge after protocol confirms | five lists | 3 then 6 | -60 to -120 |
| `bind.mjs` facade | collects the ask for the crate | stays | decision is in Rust | n/a | 563 to about 480 |
| confinement authority, drivers, policies | sandbox choice and proof | stays | gain/cost; not examined beyond the dead door | n/a | -503 |
| `provider-capacity`, `trust-store` | lease state, trust file | stays; trust-store write moves under a lock | MP-B3/MP-C hold `provider-capacity`; H-T4c lost update | later | not sized |

## 4. Delete list (consolidated)

`executeThroughConfinement`, `finalizeConfinementResources`, their facade export, census row and `architecture.test.mjs` row; `dispatch/prepare.mjs`; `dispatch/recovery.mjs` and `dispatch-effect-guarantee.test.mjs`; `validatePlacementPolicyShape` and its call; `loadRunnerConfig` (tests move to `loadRunnerConfigForDir` or build the object); the 11 unused exports; `ProviderAdapter` classes and `resolveVerifiedProviderArgs` and `recordShadowBinderDivergence`; the `shadow-binder-divergence` doctor row; `validateRunResultV4`, `normalizeRunResultV4`, `RUN_RESULT_CONTRACT_V4`, `OUTCOME_CATEGORIES`; the adapter-name sniff at `settlement.mjs:759`; `lock-wait.mjs` and its test; `herdr-deadlines.mjs`; the `dispatch.mjs` barrel after its 3 importers move; `executor-posture-coverage.mjs` (125 lines) after its conditions move into `seat-binding-checks.mjs`; the no-op `catch (err) { throw err; }` blocks; plan and phase labels in comments.

## 5. Doctor table

| Row | Fail/warn condition | After |
|---|---|---|
| `shadow-binder-divergence` | a divergence event is on disk | gone with the shadow binder; nothing writes the log |
| `executor-posture-coverage` | `posture-unavailable` for a core capability: fail; no pool: warn; other refusal: fail | moves into `seat-binding-dry-bind` as a second section over the same bind pass; same three outcomes, same messages. One module, one pass, 36 fewer host spawns |
| `seat-binding-dry-bind` | policy refusal: fail; no pool, account state, tool executor, caps, shared family: info | kept; gains the posture section |
| `seat-binding-route` | host does not answer the route at protocol 1 | kept (the named cause when dry-bind would otherwise report "could not be evaluated") |
| `blind-steps-use-proven-pools` | a blind unit can bind an unproven family or transport | kept; still 460 of 559 spawns (section 8, addition 1) |
| `runner-patterns-config`, `tier-fallback`, `model-policy-pools`, `executor-family-unique`, `runner-generated-paths` | shape and cross-field problems of the runner section | keep the cross-field ones; shape ones become schema findings of the config doctor (`checkConfig`), so nothing is lost but the row id changes. Needs the config seat's agreement |
| `dispatch-decide-hook-wired`, `bwrap-available`, `provider-capacity-state`, confinement rows, `herdr-executor-kinds`, `executor-profile-warnings`, `executor-skills-installed`, `agent-cli-project-trusted` | unchanged | unchanged (not touched by my proposals; the three current failures are machine state) |

## 6. Received items (answers)

| Item | Answer |
|---|---|
| Grace versus agent-ready (D-T2-7) | Inline `READY_TIMEOUT_MS` in `terminal-control-checks.mjs`, delete `herdr-deadlines.mjs`. The rule is a terminal-control config check, not a dispatch deadline. |
| T2 5(1) class-B herdr callers | Not mine to move; the only action in this lens: `cli.mjs:426-454` and `worker-session-boot.mjs:120-167` fall under the existing terminal-control door; list them in the sub-plan, no new mechanism. |
| T2 5(2) name-sniff, `parseHerdrUsage` | Delete the sniff (finding 5). `parseHerdrUsage` returns all nulls (`usage-parsers.mjs:142`): delete it with the herdr entry in the parser table if no test names it (not checked). |
| T2 5(3) `herdrSpawnAdapter` | Keep the registered name, replace the rejecting function with a descriptor; the refusal text stays at the one call that can reach it. |
| T2 5(4) E-3 re-parse | `src/event-store/native.mjs:32` still regex-parses; one line change to `nativeError()`; belongs to the event-store owner, a note not a T5 item. |
| T2 5(5) 558 spawns | Real (559). Section 5; addition 1. |
| H20 `lock-wait.mjs` | Inline and delete (finding 9). |
| T3-04a wording lists | Partly done; finding 8: one list now, text judge removal gated on protocol coverage. |
| Stale-result guard and claim lookup | `herdr-round.mjs:351-361` and `worker-artifacts.mjs:39-60` still two rules; unify on one function `newestResult(dir)` that rejects symlinks and leading zeros (the protocol's rule); replaces both, about -20. Not read in depth by me. |
| T3-04a addendum (outbox readers) | Same function; `settle-attempt.mjs:114-121` uses it too. |
| T4 H-T4c `cleanup-trust` lost update | `trust-store.mjs:82` temp+rename with no lock. Use `createLockScope` (the lock door `run.mjs` already uses for custody) around read-modify-write and `replaceDurably` for the write; replaces the hand-rolled rename (net about -5). Needs a backlog row (none exists). |
| T4 H-T4d text judge | Finding 8. |
| T4 H-T4e `cliSpawnAdapter` short calls | Decide with the owner: if probes, judges and goal checks become `direct` attempts the adapter and `resolveWorkerArtifactPath` go (about -150); if not, they stay and the question closes. I lean to deleting only after the probes have a host route; no change now. |
| T4 H-T4f pane before envelope | Not a size item; belongs to the correctness seat. In the cut of finding 1 the allocation sits in `buildLaunch` so the release can be one `finally` on the `attempt` object. |
| Dead door `executeThroughConfinement` | Finding 2; confirmed bigger (503 with `finalizeConfinementResources`); 46 test call sites, not 39. |
| `resolveWorkerArtifactPath` | goes with H-T4e. |

## 7. Proposed additions (kept separate; owner picks)

1. A `bind-many` operation on the seat-binding route (one host exec for N asks). Problem: `fgos doctor` spawns 559 host processes, 460 in `blind-steps-use-proven-pools`, 9.3 s of the layer's 12 s of doctor time (baseline section 4). Replaces: the per-call `spawnSync` loop in three doctor rows (the run itself still binds one seat per call, as the client contract says). Benefit: about 9 s per doctor. Cost: about +30 Rust, +15 Node. Mine to flag, SPEED's to size.
2. A guard in `test/architecture.test.mjs` that `src/native`, `src/state`, `src/holder-lock` and `src/run-supervisor` do not import `src/runner/dispatch`. Problem: the manifest gives all of them class `infra`, so O-1 and O-2 exist unnoticed. Replaces: nothing; it is 10 lines that keep the moves in finding 4 from regrowing.

Nothing else is proposed as new.

## 8. Net size estimate (Node src / Rust / tests)

| Block | Node src | Rust | Tests |
|---|---|---|---|
| Dead code and doors (finding 2) | -850 | 0 | -600 to -900 |
| Shadow binder and doctor row (5) | -385 | 0 | -300 |
| `executeAssignment` / `runUnitBody` cuts (1), moves net zero | -280 and about -200 comment lines | 0 | failover and run.test rework: lines about -300, run time about -190 s |
| `config.mjs` to schema (7), estimate | up to -900 | 0 (schema YAML +100) | -200 (validator tests that restate the schema) |
| Run result: V3 only, no V4, derivation to Rust (3) | -290 | +40 | -100 |
| Atomic writes, ask builder, wording, small (6, 5, 8, 9) | -170 | 0 | -80 |
| Bind and tier tests to wiring (6) | 0 | +0 to +100 (golden cases) | -700 |
| **Total** | **about -2 900 to -3 500** | **about +40 to +140** | **about -2 000 to -2 400** |

This is inside the phase file's range (Node -2 000 to -6 000, tests -1 000 to -3 000); it does not reach the lower end of a "-6 000" without moving confinement or provider-capacity, which I did not examine. Layer net at or below zero holds.

## Concerns

- My read coverage is lens-limited (top of this report). Findings 7 and 8 and the sizes in the migration table for config and the wording lists are estimates from function-length maps and greps, not per-function diffs.
- Option A of finding 3 and the test split in section 2 touch SEAT's and CORRECTNESS's choices; they should confirm before a sub-plan commits to them.
- `run.mjs:1243` should reach the correctness seat as a defect, not only as a size note.

Status: DONE_WITH_CONCERNS
Summary: The layer can lose about 2 900 to 3 500 Node lines, 2 000 to 2 400 test lines and about 190 s of test time with no new layer: delete 850 dead lines plus a 385-line shadow binder, cut the two giant functions along 12 real boundaries, move type checks to the config schema, and test decisions where they are made. One concrete defect found (`run.mjs:1243` undefined `role`).
Concerns/Blockers: Read coverage was limited to this lens (confinement, credential renewal, cli, herdr-round and the Rust bodies were not read); config and wording-list savings are estimates; nothing was executed, so every defect is marked unreproduced.
