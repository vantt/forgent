# Red team: assumption destroyer + scope auditor — 261005-1143 observe run visibility

Plan: `plans/261005-1143-observe-run-visibility-and-discussion-measurement/`
Date: 2026-10-05. Probes were read-only: file reads, `find`/`grep`, the staged host `metrics runs`, and `node bin/fgos.mjs dispatch show-run`.

Confirmed true: the staged host reports `metrics runs` total=1028 and `--since=2026-10-01` total=0. On disk, `.fgos/assignments` holds 1146 `result.json` (1028 flat, 118 nested). `show-run run_unit-run-1791193921045-86133024/producer/1_01` returns "no run". The flat walk is at `packages/run-result/rust/src/lib.rs:336-361`. The `runs/` layout and `-fb<n>` dirs match the plan's description. Worktree `.fgos` dirs are symlinks to main, so they add no second store.

## Finding 1: "Three independent flat walkers" is false; at least four more enumerators exist, one of them a live defect on nested runs
- **Severity:** Critical
- **Location:** plan.md "Problem" table row "Three independent flat walkers"; Phase 1 "Related Code Files" (audit list) and Implementation Step 6 (guard test)
- **Flaw:** The plan's root cause is that every consumer re-derives the layout, and the fix is "one lister, every enumerator uses it". But the plan counts only 3 walkers. The repo has at least 4 more readers of the assignments tree:
  - `findRunningRuns` is flat. It walks `assignments/<id>/runs/<NN>`, so nested runs that are still "running" are never found by the stale-run reconciler.
  - `findLatestAssignmentRunResult` (operation-choice) is flat.
  - `checkMutatingAssignmentBindingSnapshot` is an existing doctor check with its own nested walker, hardcoded to `runs/01`.
  - `readUnitRunHistory` is the execution core's own nested reader. It already encodes the `-fb<n>` and latest-attempt rules. That is prior art the plan never mentions.
- **Failure scenario:** The Step 6 guard test ("fails when a new `readdir*` over the assignments root appears outside the module") goes red on day one at registrations.mjs:569 and operation-choice.mjs:109. The implementer either allow-lists them, which defeats the guard, or migrates them, which is unplanned scope in a 1d phase. Meanwhile `findRunningRuns` keeps missing nested runs, so a SIGKILLed panelist stays "running" forever even after Observe is fixed. A grep-for-`readdir` guard also cannot see `findRunningRuns`: it loops over a `roots` array, not a literal assignments path. So "prevents a fourth walker" is not achievable with the described mechanism.
- **Evidence:**
  - `src/runner/dispatch/visibility-session.mjs:234-246` (`findRunningRuns`, roots = assignments + dispatch-runs, `<first>/runs` only)
  - `src/runner/operation-choice.mjs:109,152` (flat `asgnDirs` plus `runsDir`)
  - `src/setup/registrations.mjs:560-590` (nested walker, `path.join(roleDir, round, 'runs', '01')`)
  - `src/runner/execution/unit-run-history.mjs:25-62` (nested reader with `-fb` and latest-attempt semantics)
  - `scripts/measure-coordination-baseline.mjs:233`
- **Suggested fix:**
  - Redo the audit before writing the module. List all 7+ enumerators in plan.md.
  - Put `findRunningRuns` in Phase 1 scope as a defect, since it is the same blind spot in the reconciler.
  - Build the lister by extending or co-locating with `unit-run-history.mjs` rather than writing a parallel one.
  - Make the guard a call-site allow-list test that imports-checks known readers, not a `readdir` text scan, or drop the "prevents a fourth walker" claim.

## Finding 2: The D1 rule, the Phase 2 fixture and the Phase 3 doctor count disagree on what a run is
- **Severity:** High
- **Location:** plan.md D1; Phase 1 "Architecture" ("`<assignmentDir>` is recognised by holding `assignment.json`"); Phase 2 Implementation Step 3 ("nested with missing `assignment.json`: all three observed; the third has `role: null`"); Phase 3 "Architecture" (doctor counts with `listAssignmentRuns`)
- **Flaw:** D1 says a `runs/` dir counts only if its parent holds `assignment.json`. Phase 2 requires the Rust walker to observe a run whose parent has no `assignment.json`. So the Rust and Node walks must implement different rules, which contradicts "same rule as phase 1". Phase 3 then compares Node's count (strict rule) with Rust's count (lenient rule). It defines only "equal passes, fewer observed fails"; "more observed than disk" is undefined. The real store already has such a dir: `asgn-deepseek-1791185611935/runs/01/run.json`, with no `assignment.json`. Today `allRuns` and `show-run`'s `findRunDir` list it, because neither checks for `assignment.json`. D1 silently drops it, which is a regression in `show-run`/`inspect` that Phase 1's own "flat legacy runs keep working" requirement forbids.
- **Failure scenario:** A writer that crashes after `mkdir runs/01` but before writing `assignment.json` produces a run that Rust counts and Node does not. Doctor reports observed > disk, a state with no defined verdict, or a false pass. A stranger agent cannot tell which walker is "right" because the spec says both follow the same rule.
- **Evidence:**
  - `.fgos/assignments/asgn-deepseek-1791185611935/runs/01/run.json` (only file; the parent has no `assignment.json`)
  - `src/runner/dispatch/runtime-inspection.mjs:79-81` (no `assignment.json` requirement)
  - `src/verbs/dispatch/show-run.mjs:53-66` (same)
  - `packages/run-result/rust/src/lib.rs:404-418` (`assignment.json` optional and defaults to null)
- **Suggested fix:**
  - Pick one rule and write it once. Either "a run is `<NN>/` under any `runs/` at depth ≤ 4 whose `run.json` or `result.json` exists; `assignment.json` is metadata, not a marker", or keep the marker and delete Phase 2 Step 3's third fixture.
  - Define the doctor verdict for observed ≠ disk in both directions.
  - Add the `asgn-deepseek` shape as a Phase 1 fixture.

## Finding 3: "Old host degrades, never a false failure" cannot be implemented as written; the current staged host fails instead
- **Severity:** High
- **Location:** plan.md "How Rust changes are verified"; Phase 3 Requirements bullet 2 and Success Criteria ("degrades with the old staged host")
- **Flaw:** The plan assumes an old host "cannot answer". It can: the staged host answers `metrics runs` successfully with `total: 1028`. Nothing in its output says "I only walk flat dirs". The Node check counts 1146 (1028 flat + 118 nested) and sees 1028 observed. By the Phase 3 rule ("fewer observed fails"), the check FAILS on every machine running the current release, which is every install until a release is cut. That is exactly the false failure the plan says must never happen. `invokeHost` only reports exec success or failure, and the existing observe host check only pings `friction`.
- **Failure scenario:** The check lands, `fgos doctor` goes red on this repo, on mdview, and on every other project using the global install. The implementer "fixes" it by loosening the comparison, which the plan's own Risk section forbids.
- **Evidence:**
  - `src/util/host-bin.mjs:73` (`invokeHost` returns process output only)
  - `src/setup/registrations.mjs:5778-5781` (`observe-host-resolvable` checks friction ping only)
  - The staged host's `metrics runs` output (`"total": 1028`, no layout or version field)
  - `packages/run-result/rust/src/lib.rs:345-361` (flat walk)
- **Suggested fix:** Phase 2 must add a machine-readable capability marker to `metrics runs` output, for example `data.coverage: {layout: "nested-v1", onDisk, observed, skippedUnparseable}`. Phase 3 degrades when the marker is absent. Better still: let the host report its own `onDisk` vs `observed`, so the doctor does not run a second, differently-ruled walk at all (see Finding 2).

## Finding 4: The stance sensor has no channel to receive options; every live run will be "unmeasured"
- **Severity:** High
- **Location:** Phase 5 "Architecture" and "Related Code Files" (`core/workflows/delphi.yaml` and `nominal-group.yaml` "declare options where the question has them"); plan.md Acceptance bullet 6
- **Flaw:** Options belong to the owner's question, but `delphi.yaml` is a static template whose question arrives at runtime. The only per-run input that reaches a unit is `state.request`, which gets appended as text. No per-run `params` or `stanceOptions` input exists for a workflow run. `params.roleTasks` is pattern-level text set by the template, not per-question. Declaring options in the YAML would freeze one question's options into every Delphi run. Also, the porting-log entry the plan cites specifies a `STANCE:` report line, not a claim field. Its review conditions need volume: K2 is "≥90% unanimous across 30 runs", K5 is "delete if unread in 60 days". A sensor that reads "unmeasured" on free-form questions, which describes every Delphi/nominal-group run on record, can never feed K2, so K5 kills it.
- **Failure scenario:** Phase 5 ships. Acceptance bullet 6 needs "a live panel run with declared options", which needs a hand-edited one-off workflow or an unplanned new CLI/runner input. The sensor reports 100% `unmeasured` and the 60-day deletion condition fires.
- **Evidence:**
  - `src/workflow/runner.mjs:39-41` (`parts = [template.objective]; if (state.request) parts.push(...)`, the only runtime input)
  - `src/runner/execution/patterns/role-tasks.mjs:55-59` (`params.roleTasks[role]` from the template)
  - `core/workflows/delphi.yaml:9-55` (no params, question-agnostic)
  - `docs/distillery/porting-log.md:149` (`STANCE:` line, K2/K5)
  - Current panelist claims carry only status/summary/evidenceRefs, e.g. mdview `.fgos/assignments/unit-run-1791198972605-7efaaed7/panelist-1/1/runs/01/outbox/result-1.json`
- **Suggested fix:**
  - Add a per-run options input (e.g. `fgos workflow run --option A --option B`, persisted in workflow-run state and rendered by `buildUnitHandoff`) to Phase 5's file list and effort.
  - Reconcile D2 with porting-log row 149 explicitly.
  - State in the acceptance criteria how K2's 30-run sample gets reached.

## Finding 5: The workflow join drops orphaned units, and the acceptance names the wrong Delphi runs
- **Severity:** High
- **Location:** Phase 4 Requirements bullet 1 ("from `unit.scheduled`/`unit.complete`"), bullet 3 ("a unit run with no workflow link ... observed with workflow null"); plan.md Acceptance bullet 5; Phase 4 Step 5
- **Flaw:**
  - `unitRunId` appears only on `unit.complete`. `unit.scheduled` carries only `{stepId, unitId}`. A workflow that dies after scheduling therefore leaves a unit dir that no event links, and the source labels it "workflow null = plain `fgos run`". That is a misattribution, not "unknown". mdview has this case: `wf-run-1791170454409-1285ccf7` (nominal-group, 2026-10-05) has `unit.scheduled` and no `unit.complete`, and its unit `unit-run-1791170454429-72e118ad` (capability `nominal-group:generate`) is unlinked.
  - mdview has four Delphi workflow runs on 2026-10-05, not three. The fourth is `wf-run-1791195929806` (policy-refusal), whose unit dir has a `unit.json` and zero seats.
  - The step "the failed one shows the gemini/xai fallback chain" is ambiguous. `-fb1` seats exist in both the failed run (`unit-run-1791196201055`) and the passing one (`unit-run-1791196890514`).
- **Failure scenario:** `metrics discussions --by workflow` undercounts nominal-group and inflates the "no workflow" bucket. The acceptance check passes or fails depending on which three runs the verifier picks.
- **Evidence:**
  - mdview `.fgos/workflow-runs/wf-run-1791198761595-28f05967/events.jsonl` (seq 3 `unit.scheduled` without `unitRunId`; seq 4 `unit.complete` with it)
  - mdview `.fgos/workflow-runs/wf-run-1791170454409-1285ccf7/events.jsonl` (3 events, no `unit.complete`)
  - mdview `.fgos/assignments/unit-run-1791170454429-72e118ad/unit.json` (`createdAt` 2026-10-05T03:20:54.431Z)
  - `src/workflow/runner.mjs:313` (event emission cited by the plan)
- **Suggested fix:**
  - Use three states, `workflow: <id> | unlinked | none`. Mark a unit `unlinked` when its capability is a workflow capability (`delphi:*`, `nominal-group:*`) or when `unit.json.overrides[].origin == "workflow"`; that field exists on the unit.json files inspected.
  - Fix the acceptance to "the four Delphi workflow runs of 2026-10-05 (one policy-refusal with zero seats)" and name the run ids.

## Finding 6: The `--by executor` cross-check cannot agree with `metrics runs` by construction
- **Severity:** Medium
- **Location:** Phase 4 Success Criteria bullet 2
- **Flaw:** A seat is a role/round, and the execution core's own rule is "the latest attempt is the one that counts" (`-fb<n>` beats the base round, the latest `runs/<NN>` beats earlier ones). `metrics runs` counts every attempt. So unit `unit-run-1791196890514` has 4 seats (panelist-1..3 + synthesizer) but 5 runs: gemini's superseded `panelist-3/1` plus xai's `panelist-3/1-fb1`. Seat-level executor counts will never equal run-level counts whenever a fallback or retry happened. Fallbacks are the thing the view exists to show.
- **Failure scenario:** The verifier sees a mismatch and either "fixes" the seat model to count attempts (losing the fallback semantics) or writes the criterion off as noted. Either way the check proves nothing.
- **Evidence:**
  - `src/runner/execution/unit-run-history.mjs:25-27,52-60` (latest attempt wins, `-fb` precedence)
  - mdview `.fgos/assignments/unit-run-1791196890514-aab0cccf/panelist-3/1/runs/01/result.json` (executor gemini) and `.../panelist-3/1-fb1/runs/01/result.json` (executor xai)
- **Suggested fix:** State the identity as `sum(seat attempts incl. superseded) == metrics runs --by=executor` for the same set of unit runs. Reuse `readUnitRunHistory`'s rule (ported to Rust or shared through the contract) for the "final seat" view.

## Finding 7: D4 assumes the case contract is enforced; it is not and has already drifted, and "listable by harness" passes vacuously
- **Severity:** Medium
- **Location:** plan.md D4; Phase 6 "Architecture" ("Rust writer and validator are updated together"), Requirements bullet 1 (`metrics case list --harness <name>`), Success Criteria bullet 1
- **Flaw:**
  - No validator applies `observe.case.v1.json` to written events. The Rust struct already writes `unitRuns` on `case-closed`, while the JSON contract declares `additionalProperties: false` and does not list `unitRuns`. The "schema" test only hand-asserts a golden fixture's fields.
  - `metrics case list` accepts only `--open` and silently ignores any other argument. Nothing in Phase 6 names adding a `--harness` filter. As written, `metrics case list --harness decision` returns every case, so Success Criteria bullet 1 is green with no filter implemented.
  - The existing `unitRuns` field is the natural link from an A/B case to the unit runs it scored, and the plan neither notices nor reuses it.
- **Failure scenario:** Scores get written and the contract gets edited, but there is still no gate. The next field drifts the same way, which is this plan's own root-cause pattern. The A/B acceptance "listable by harness" is satisfied by unfiltered output.
- **Evidence:**
  - `packages/observe/rust/src/case_journal.rs:41-57` (`unit_runs` serialized as `unitRuns`)
  - `packages/observe/contracts/observe.case.v1.json` (CaseClosed `additionalProperties: false`, no `unitRuns`)
  - `test/observe/observe-contracts-fixtures.test.mjs:95-120` (no schema validation)
  - `packages/observe/rust/src/metrics_cli/case.rs:190-196` (`handle_list` reads only `--open`)
- **Suggested fix:**
  - Add a real schema-validation test over golden and writer output. Fold `unitRuns` into the contract in the same change.
  - Make `--harness` an explicit new flag in Phase 6's Related Code Files, and make unknown list flags an error.
  - Record the scored unit runs via `unitRuns` on the A/B cases.

## Finding 8: The real-store invariant and doctor equality race against concurrent writers in this repo
- **Severity:** Medium
- **Location:** Phase 2 Related Code Files ("keep the real-store case only as `observed == on_disk`") and Step 4; Phase 3 Requirements bullet 1
- **Flaw:**
  - The equality is taken over a live store that other sessions write to concurrently, a routine situation in this repo. The Rust walk and the "independent plain recursive count" are two traversals at two instants. In Phase 3 they also run in two different processes, Node and the host.
  - A run that settles between the two traversals makes them differ by one.
  - A `result.json` mid-write is counted on disk but skipped as unparseable. The plan reports skipped records alongside observations but does not say they count on the observed side.
  - Separately, the smoke test returns early when `.fgos/assignments` is absent. It is vacuous in CI and in any fresh worktree without the symlinked `.fgos`.
- **Failure scenario:** `cargo test` or `fgos doctor` flakes red during a busy dispatch session. Given the plan's rule "never loosen the comparison", the only available response is to rerun, which trains people to ignore the check.
- **Evidence:**
  - `packages/run-result/rust/tests/smoke_real_store.rs:8-10` (early return)
  - `packages/run-result/rust/src/lib.rs:389-392` (records without `runId` skipped silently)
  - `packages/run-result/rust/src/lib.rs:394-397` (unparseable skipped)
- **Suggested fix:**
  - Compare sets of run dirs, not counts, inside one process: the host reports `missing: [paths]`, computed from its own directory list versus its observations (see Finding 3).
  - Count skipped-unparseable and skipped-no-runId as "seen".
  - Ignore dirs whose `result.json` mtime is newer than the walk start.
  - Keep the hermetic fixture as the gate and treat the real-store case as a report, not an assertion.

## Scope audit (traceability)

- Phases 1-3 trace to Outcome 1-2. The Finding 1 enumerators belong to Outcome 1 but are missing from scope, so Outcome 1 ("every enumerator uses it") is unmeasurable as written.
- Phase 5 traces to Outcome 3, but its acceptance depends on an unplanned input channel (Finding 4).
- Phase 6's "one decision-ledger case (this plan's D1)" is fine. The "re-run the 2026-10-04 question" dogfood step has no dispatch-decide or executor-cost note and no stable question id for the A/B pairing, so the "same question id" invariant is undefined.
- Every plan.md acceptance bullet is executable with a named command except bullet 6 (blocked by Finding 4) and bullet 7 (vacuous per Finding 7).

## Unresolved questions

1. Is `asgn-deepseek-1791185611935` (a `run.json` with no `assignment.json`) a legitimate writer shape (e.g. a probe harness) or garbage? That decides Finding 2's rule.
2. Should a superseded `-fb` base attempt count as a "run" for reliability stats (it consumed provider quota) or be hidden? This decides Finding 6's identity.
