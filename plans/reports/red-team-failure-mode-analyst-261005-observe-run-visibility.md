# Red-team (Failure Mode Analyst / Flow Tracer): observe-run-visibility-and-discussion-measurement

Plan: `plans/261005-1143-observe-run-visibility-and-discussion-measurement/`
Date: 2026-10-05. Read-only probes only (staged host `metrics runs`, `find`/`rg` over `.fgos` of forgentX and mdview).

Live disk facts used below (forgentX): 1146 `runs/*/result.json` (1028 flat, 118 nested), 1195 run dirs, 49 run dirs with no `result.json`, 13,205 directories under `.fgos/assignments` (max depth 8). Staged host `metrics runs` total = 1028, 0.60 s.

## Finding 1: A decision-ledger case left open blocks every other case in the project
- **Severity:** Critical
- **Location:** Phase 6, "Requirements" (decision ledger on the same mechanism) and "Implementation Steps" step 4 (one decision case "to be reviewed at a named date")
- **Flaw:** The case journal allows only one open case per project. A decision case is by design open until its review date (weeks).
- **Failure scenario:** Step 4 opens the decision case for D1. Every later `metrics case open` (the A/B cases in the same step, plan 260930's "at least one week of a real case") fails with `project already has an open case`. Closing the decision case early to unblock destroys the ledger semantics. Order inside step 4 decides whether phase 6 itself completes.
- **Evidence:** `packages/observe/rust/src/case_journal.rs:266-268` (`find_currently_open` -> `CaseError::AlreadyOpen`), `:90`; `plans/260930-0335-measure-runresult-classification-impact/plan.md:76` needs a week-long real case.
- **Suggested fix:** Either record the decision as an open+immediately-closed case (prediction in `task`, verdict `inconclusive` until a follow-up case named `<decision>-review` is opened and closed at review time), or explicitly scope the single-open rule per harness in D4 with a test. Decide before phase 6, not during dogfood.

## Finding 2: Three incompatible definitions of "a run"; real data and existing tests already sit between them
- **Severity:** Critical
- **Location:** Plan D1; Phase 1 "Architecture"; Phase 2 "Implementation Steps" 3-4; Phase 3 "Architecture"
- **Flaw:** D1 recognises an assignment dir only if it holds `assignment.json`. Phase 2 step 3 requires a nested run whose owner has no `assignment.json` to be observed (`role: null`) — contradicting D1. Phase 2 step 4 counts on-disk runs as "plain recursive count" of `result.json`, while the Rust source drops results without `runId` or without any timestamp. Phase 3 counts with the D1 lister. Three numerators, one "equal" assertion.
- **Failure scenario:** (a) `fgos run record` (inline producer) writes `<unit>/producer/<round>/runs/01/result.json` with shape `{unitRunId, role, round, recordedAt, evidenceRefs, result}` — no `assignment.json` in the owner, no top-level `runId`, no `settledAt`. The plain count includes it, D1 lister excludes it, Rust drops it: invariant test and doctor go permanently red the first time an inline run happens. (b) D1 silently drops `asgn-deepseek-1791185611935` (runs/01/run.json, no assignment.json) from inspection — today `allRuns` lists it as an active run, which is what crash recovery inspects. (c) An existing test builds a run with no `assignment.json` and expects `showRunUseCase` to find it; D1 breaks it.
- **Evidence:** `src/runner/execution/run.mjs:373-392` (inline returns before any assignment.json), `:566-579` (inline result.json shape); `packages/run-result/rust/src/lib.rs:392-395` (no runId -> skip), `:418-427` (no timestamp -> skip); `src/runner/dispatch/runtime-inspection.mjs:79-81` (no assignment.json requirement today); `test/runner/dispatch-governance-operability.test.mjs:238-246`.
- **Suggested fix:** Pick one definition in the spec section (recommend: "a run dir is `**/runs/<attempt>/` under the assignments root; owner metadata optional"), use it for the lister, the Rust walker, the invariant and the doctor count, and decide explicitly whether the inline result shape is a run (and then teach the Rust source to read it) or fix `recordInlineRun` to write a RunResult. Add the inline shape to the phase 2 hermetic fixture.

## Finding 3: "Host too old -> degraded" has no detection mechanism
- **Severity:** Critical
- **Location:** Plan "How Rust changes are verified"; Phase 3 "Requirements" bullet 2, "Success Criteria" ("degrades with the old staged host")
- **Flaw:** The old staged host answers `metrics runs` successfully (total 1028, exit 0). Its envelope carries no host version or capability field, and `invokeHost` only distinguishes an "unknown subcommand" stderr. Node cannot tell "old host" from "new host that regressed".
- **Failure scenario:** Either the check fails red on every installed machine (1028 observed vs 1146 on disk here) until a release ships, or the implementer degrades on any shortfall — which re-creates exactly the blind spot the check exists to catch. Same on mdview and every other project using the global install.
- **Evidence:** staged host output `{"contract":"fgos.v1","generated_at":...,"data_hash":...,"data":{"total":1028,...}}` (no version); `src/util/host-bin.mjs:98-104` (only `unknown`+`subcommand` -> `host-version-mismatch`); `packages/observe/rust/src/metrics_cli/runs.rs:97-108` (output is only the runs section).
- **Suggested fix:** Phase 2 must add a positive capability marker to the `metrics runs` output (e.g. `coverage: {walked, skippedUnparseable, skippedNoTimestamp, layoutRule: "v2"}`); the doctor check degrades only when that marker is absent and fails when it is present and observed+skipped < disk. Put the marker in the phase 2 file list and test.

## Finding 4: The real-store invariant is vacuous in worktrees and racy in the main checkout
- **Severity:** High
- **Location:** Phase 2 "Related Code Files" (smoke test kept as `observed == on_disk`), "Success Criteria"; Phase 3 "Requirements" bullet 1
- **Flaw:** `.fgos/assignments/` is gitignored, so in an implementation worktree the real-store test returns early and passes without asserting anything (including the "mutation check done once"). In the main checkout, discussion runs are written concurrently with non-atomic `writeFileSync`, so a half-written `result.json` is counted on disk but skipped by the parser; a run settling between the Node count and the host call flips the doctor comparison.
- **Failure scenario:** Agent implements phase 2 in a worktree, `cargo test` green, mutation check "passes" vacuously. Later `npm test`/`cargo test` or `fgos doctor` on main goes red intermittently while a Delphi panel is settling; responders follow the plan's "never loosen the comparison" and chase a phantom.
- **Evidence:** `.gitignore:24` (`.fgos/assignments/`); `packages/run-result/rust/tests/smoke_real_store.rs:8-10` (early return); `src/runner/execution/run.mjs:579` (non-atomic write); 49 run dirs with no `result.json` on disk today.
- **Suggested fix:** Make the invariant hermetic only (fixture store, flat+nested+inline+unparseable). Live coverage belongs to doctor alone, comparing against the source's own walked/skipped counts from the same host call (Finding 3), with a settle window (ignore runs whose dir mtime is within N seconds) rather than two independent walks.

## Finding 5: Phase 5 "invalid stance rejected" turns a passive sensor into a seat killer
- **Severity:** High
- **Location:** Phase 5 "Implementation Steps" step 2 ("invalid `choice` type rejected"), "Requirements" (non-functional: nothing reacts to the sensor)
- **Flaw:** Claim validation failure is not local to the field: settlement marks the whole claim invalid and the run `failed` with policy `refuse`.
- **Failure scenario:** A panelist writes `"stance": {"choice": 2, "confidence": "high"}` or a choice outside the declared options. Its seat fails with `invalid-agent-result-claim`, the unit fails, the Delphi step stops (`step.fail`). The sensor that "never blocks" now gates discussions — the very gate the plan lists as a non-goal.
- **Evidence:** `src/runner/dispatch/settlement.mjs:491-499` (invalid -> `claimInvalid = true`), `:224-231` (`execStatus: 'failed'`, `policy.disposition: 'refuse'`); `src/workflow/runner.mjs:414-417` (non-pass unit stops its step).
- **Suggested fix:** Do not validate `stance` in `validateAgentResultClaimContract`. Leave the claim contract permissive for `stance`; the Observe source classifies malformed stances as `stanceInvalid` and counts them beside `stancesMissing`.

## Finding 6: Phase 5 reads stances from the wrong file and misses a whole claim location
- **Severity:** High
- **Location:** Phase 5 "Architecture" ("reads claims from `<seat>/runs/<NN>/outbox/result-<N>.json`")
- **Flaw:** Worker claims live in two places depending on executor confinement, and the settled RunResult already embeds the validated claim as `agentClaim`. Reading raw outbox files also reads untrusted, possibly rejected claims as fact.
- **Failure scenario:** Seats confined through `worker-output/outbox/agent-result.json` (9 of 122 nested runs here, 5 of 75 on mdview) always report `stancesMissing`; agreement is computed on a biased subset correlated with executor. A claim that settlement rejected still contributes a stance.
- **Evidence:** on-disk counts above; `.fgos/assignments/unit-run-1791193921045-86133024/producer/1/runs/01/worker-output/outbox/agent-result.json`; mdview `panelist-1/1/runs/01/result.json` has top-level `agentClaim`; `src/runner/dispatch/agent-result-claim-contract.mjs:1-3` (claims are untrusted input).
- **Suggested fix:** Source reads `result.json.agentClaim.stance` only (already parsed by the walker), never outbox files.

## Finding 7: Phase 1 guard test is red on day one, and "fixing" it changes gate behavior
- **Severity:** High
- **Location:** Phase 1 "Implementation Steps" step 6 (allow-list only the module) vs "Related Code Files" (others "audit only")
- **Flaw:** Three existing `readdirSync` calls over the assignments root live outside the new module. The guard cannot pass without migrating or allow-listing them, and the plan decides neither.
- **Failure scenario:** Implementer migrates `findLatestAssignmentRunResult` onto the recursive lister to satisfy the guard; the driver's gate-verdict selection now scans nested unit-run assignments (currently harmless only because they lack `workId` — a future unit with a workId changes stage decisions). Or migrates `checkMutatingAssignmentBindingSnapshot`, which is a unit-layout walker hardcoding `runs/01`, changing a doctor check. Or allow-lists them, so the guard protects nothing it was sold for.
- **Evidence:** `src/setup/registrations.mjs:569` and `:598` (`runs/01` hardcoded); `src/runner/dispatch/assignment.mjs:150` (id allocator, not a run walker); `src/runner/operation-choice.mjs:109`; also `src/runner/execution/unit-run-history.mjs:44-54` (unit-layout walker with its own `-fb<n>` rule).
- **Suggested fix:** Scope the guard to "enumerates `runs/` under the assignments root" and name the explicit allow-list (id allocator, unit-history reader) with a reason each; record in the audit table that `operation-choice` stays flat on purpose.

## Finding 8: Discussion source cannot attribute crashed units to their workflow
- **Severity:** Medium
- **Location:** Phase 4 "Requirements" (workflow link from `unit.scheduled`/`unit.complete`), "Success Criteria"
- **Flaw:** `unit.scheduled` carries no `unitRunId`; only `unit.complete` does, and `runUnit` is not wrapped, so a throw/kill never emits `unit.complete`.
- **Failure scenario:** mdview `wf-run-1791170454409-1285ccf7` has `unit.scheduled` with no `unit.complete`. Its unit run is reported as `workflow: null` — a "plain fgos run" — so the failures discussion metrics most need to show are mis-bucketed and pass rates per workflow are inflated. Separately, acceptance says "the three mdview Delphi runs of 2026-10-05" but mdview has four `delphi` workflow runs today (two failed, two complete), so the criterion is not checkable as written.
- **Evidence:** `src/workflow/runner.mjs:377-383` (scheduled payload), `:387-408` (complete only after `await runUnit`); `/home/vantt/projects/mdview/.fgos/workflow-runs/wf-run-1791170454409-1285ccf7/events.jsonl`.
- **Suggested fix:** Read `unit.json` (it is written before dispatch) for the workflow link if it carries one, or add `unitRunId` to `unit.scheduled` in this phase (a Node write change — then say so and drop "no new write anywhere"). Fix the acceptance count by run id, not "three".

## Finding 9: Skip counts and walk cost are not wired anywhere the doctor can see them
- **Severity:** Medium
- **Location:** Phase 2 "Architecture" (skip counts "returned alongside observations"), "Risk Assessment" (bound by window before reading JSON); Phase 1 "Risk Assessment"
- **Flaw:** `ObservationSource::observations` returns only `Vec<Observation>`; returning skip counts needs a trait change in `fgos_observe` (all four sources) or a new output field — neither file is listed. The window mitigation is impossible: `settledAt` is inside `result.json`, so the JSON must be read before windowing. Pruning is unspecified: nested NN sits at depth 5, flat run internals (`control/controller/protected/...`) span depths 5-8; a depth-bounded walk without "stop at `runs/`" visits ~13k dirs instead of ~2k on every `show-run`, `inspect` and `metrics` call.
- **Evidence:** `packages/observe/rust/src/contract.rs:81-84`; `packages/observe/rust/src/metrics_cli/runs.rs:88-95` (sources -> observations only); `packages/run-result/rust/src/lib.rs:418-438` (window after parse); `src/verbs/dispatch/show-run.mjs:57-65` (reads every run.json per lookup).
- **Suggested fix:** Add `contract.rs` and `metrics_cli/runs.rs` to phase 2 files with the coverage field (Finding 3). Specify the walk: descend only directories without `assignment.json`/`unit.json`-owned `runs/`, never descend into a `runs/<attempt>/`; measure with the 13k-dir store and record the number.

## Finding 10: Case contract change is invisible to the staged host and to the golden schema test
- **Severity:** Medium
- **Location:** Phase 6 "Architecture" (D4 additive), "Success Criteria"
- **Flaw:** The Rust case records have no `deny_unknown_fields`, so an old host reads new `scores`/`rubric`/`judge` and silently drops them; the JSON schema has `additionalProperties: false`, so the golden schema test fails until schema and fixture regenerate together. Phase 6 shares the golden tree with phase 2's regeneration.
- **Failure scenario:** Cases scored with `FGOS_HOST_BIN=target/debug/fgos`; the user (or 260930's harness review) later runs `metrics case list --harness` via the installed host and sees unscored cases with no error — the A/B looks lost. Regenerating goldens in phase 6 also re-emits phase 2's run fixture; a mismatched build clobbers it.
- **Evidence:** `packages/observe/rust/src/case_journal.rs:40-57`; `packages/observe/contracts/observe.case.v1.json:55`; `test/observe/observe-contracts-fixtures.test.mjs:95-97`; `scripts/regenerate-observe-fixtures.mjs:31-36,111-113` (one script rebuilds and rewrites the whole tree, flat `run-golden-01` only).
- **Suggested fix:** Same capability-marker approach as Finding 3 for `case list` (emit `scoresSupported: true`), state in the how-to that scoring requires a release, and add a nested run to the golden generator in phase 2 so phase 6 regeneration has a diff baseline that proves nothing was clobbered.

## Unresolved questions
- Is the inline `fgos run record` result meant to be a RunResult at all? Its shape decides Finding 2's fix.
- Should the single-open-case rule stay global (Finding 1), or become per-harness? That is a D4 scope decision for the user.
