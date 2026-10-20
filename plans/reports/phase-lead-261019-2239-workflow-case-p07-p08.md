# Phase lead report: workflow case ledger, phases 07 and 08 (plus the two owner decisions)

Branch `worktree-agent-af350fc0a2d8b58eb`, on top of main `df99741ef`. Commits at the end.

Impact analysis: the GitNexus index is stale (last indexed `b334695`), so the posture is Degraded and the blast radius was taken with `rg`. `runUnit`: 6 production call sites (all moved) and 6 test files (one wrapper). `normalizeWorkflowLink`: 2 consumers (`run.mjs`, `unit-summary.mjs`). `workerBaseEnv`: `transport.mjs`, `assignment-runner.mjs`, `confinement/authority.mjs` (one strip list, all three follow). I did not message the big lead before editing; the numbers above are the blast radius.

## Phase 07: what was built

- `src/runner/execution/case-admission-port.mjs` (Execution Core, no import of the Workflow): the port contract (`resolveBinding`, `admit`, `settle`, `recheckEffect`), `assertCaseAdmissionPort`, `CaseAdmissionRefusedError`, `normalizeCaseRef`, `seatLaunchesOf` (seats per round times rounds, read from the resolved pattern: solo 1, reviewed (1 + checkers) x maxRounds, panel members + synthesizer) and `seatLaunchesUsed` (counted from the attempts the run recorded, so a resume counts right).
- `src/workflow/case-admission-port.mjs`: `createCaseAdmissionPort({ repoRoot, caseId?, heldAdvance?, env? })`. With `heldAdvance` it never acquires. Without it each operation tries `advance` once: `admit` answers `case-admission-busy`, `settle` leaves a settle-pending file. `admit` reuses a live reservation for the same activity and unit id, binds the worktree only when it created the binding, records `route` and `reservation`, and returns the ceiling. `settle` builds the receipts from the run's own results and calls the one `applySettle` (new in `case-runtime.mjs`, also used by the drain) which appends once, unbinds the binding it created when quiet, and removes the reservation file. `recheckEffect` re-runs only the consent, entry and receipt checks (`recheckReservation` in `case-admission.mjs`) against the digests as they are now.
- `runUnit`: `options.caseAdmission`, `options.caseRef`, `options.onCaseAdmitted`. Order for a fresh run is admission, custody, unit directory. A writing Unit (or one naming a case) without the port is refused before anything exists; a standalone writing run needs the affirmative `unbound`; custody that refuses after admission settles the reservation `not-started`. Settlement happens after custody is released, so the worktree is quiet and the port may unbind. The Unit run link in `unit.json` is `{ caseId, activity, reservationId }`; `normalizeWorkflowLink` reads the old `{ runId, stepId, unitId }` as the same link without a reservation. One `chosenPattern` helper replaced the three copies of the pattern-name expression.
- Ceiling: `runRole` stops a launch that would pass it. A fallback attempt at the ceiling returns the seat's own provider-limit result with `fallbackExhausted.reason: seat-launch-ceiling`; a seat that never ran gets `policy-refusal` `seat-launch-ceiling` (never `blocked`); `runReviewed` takes a `hasLaunchRoom` hook and ends at its last evaluation when the next round's seats do not fit. `settle` carries `seatLaunchesUsed` and `frameExhausted` once. The core writes nothing to the ledger between admit and settle.
- Write gate: `recheckEffect` is asked through the same port object before every writing commit (fresh and re-commit paths); a refusal is a `policy-refusal` carrying the port's code (`consent-stale`) and commits nothing.
- Callers: `bin/fgos.mjs` run verb, the proposer (`heldAdvance`, its own predicate calls and settle code are gone), `work-dispatch.mjs`, `operation-choice.mjs`, `fanout-batch.mjs`. `test/workflow/...`/`test/runner/...` call `runUnit` through `test/helpers/run-unit-with-port.mjs` (one helper). Manifest rows added.
- The proposer keeps the observable order: `unit.scheduled` is recorded in the `onCaseAdmitted` hook, right after admission and before custody, so `playbook-observable-order` is green and unchanged.

## Phase 08: what was built

- Doors: `fgos run --case <id> --activity <id> [--route] [--reason]`, `fgos workflow start --case <parentId>`; strict flags, registered in `command-registry.mjs`.
- Authority (`authorityRefusal` in the port, called by `admit`, and by `resolveBinding` for a standalone write): the explicit reference, the case variables the door set and the target worktree's binding must name one open case. Names: `authority-context-invalid` (unknown, malformed, closed, reservation not live), `authority-context-conflict` (different cases, unless the named case's `case.opened` records the other as parent), `bound-worktree-requires-case-authority` (bound target, no case named; the refusal says `--case <id> --activity <id>`). All before `bind()`, custody and the unit directory.
- Env: `workerBaseEnv` strips `FGOS_CASE_ID` and `FGOS_CASE_RESERVATION`; `runUnit` passes `caseContext` from the admission to `executeAssignment`, which sets them in the launch env (one injection point, all three launch paths read `resolvedCmd.env`) and, for codex, beside the writer id in `shell_environment_policy.set`.
- R1: a writing dispatch at depth > 0 whose view of the bindings is masked, or whose case directory or bindings are not writable, is `nested-write-from-confined-worker`, checked first, whatever the call names.
- Shape C: any `admit` into an open Playbook case without that case's own hold, and `workflow start --case` under one, is `playbook-case-admits-via-proposer-only`, immediately.
- Conductor: reserve-then-release is the port without `heldAdvance`; disjoint reservations run concurrently (busy is retryable).
- Nested frame: `chargeNestedCase` / `refundNestedCase` in `case-frame.mjs`. `prepareWorkflowRun` charges the child's frame (or one dispatch per Unit) to the parent in the parent's own section, creates the run, and the start verbs refund (own section, idempotent, settle-pending if the parent is held) when the child cannot open. `case.opened` of the child records `parent`. A nested charge is excluded from `liveReservations` (it spends frame, it is not an attempt).
- `settle` outcome `not-started` counts like a refund in the projection.

## Owner decision 1: Playbook case auto-close

The proposer appends `case.closed` (reason `completed`) after `workflow.complete` with outcome pass, through the new `src/workflow/case-close.mjs` (`closeCaseUnderHold`), which `closeWorkflow` now also uses (one function, same rules: refused while a closure milestone is stale or a consent gate is parked; quiet bindings released, others kept and named). A case that cannot close by those rules stays open; failed, blocked, parked cases stay open; a conductor case closes only through `fgos workflow close`. `docs/specs/workflow.md` §7.5 says so. Tests changed because the contract changed: the CLI close test and the `close` test in `case-verbs.test.mjs` now find a finished playbook closed; the stale-closure refusal is shown on a parked case instead.

## Owner decision 2: stale approval no longer dead-ends

Reproduced first (`test/workflow/stale-approval-reapproval.test.mjs`, approve, edit the approved report, re-park, re-approve, next step): the run failed with `unit publish-copy could not run: handoff-ref-unresolved ... report-changed-after-settle`. Two causes, one at each owner:

1. The subject digest was computed through the hand-off resolver, which refuses a changed report, so the digest of an edited report was `null` ("unknown"). The re-approval was therefore bound to nothing and could not be told apart from the old one. Fix at the digest owner (`digestUnitRunReports` in `ref-digests.mjs`): it digests the bytes that lie there now (`resolveUnitInputs(..., { accept: 'any' })`). The approval of the old content is now `consent-stale` (prior and current digests named) and the re-approval carries the new digest.
2. The Execution Core still refused to hand the changed report to the next Unit. Fix: `resolveUnitInputs`/`reportRefOf` take an `accept` option (`'any'` or sha256 hex of revisions); the Core only accepts what its caller names. The proposer names them through `approvedReportDigests` (`unit-handoff.mjs`): for each human gate whose latest approval is bound to the digest of its subject as it is now, the sha256 of the reports that subject is made of. `runUnit` takes `options.acceptedReports`, validates and records it in `unit.json` so a resume and every seat's own inputs read the same.

The re-approval, a gate answer bound to the new digest, is the only authority that adds to the accepted set. Unapproved edits are still refused: tests assert `report-changed-after-settle` for no `accept`, an empty set, the settled digest and an unrelated digest, accepted only for the exact approved digest, and that an edit after an approval parks the gate again and starts no next Unit. The Core's refusal rule itself is not weakened.

## Scenario to test

| Scenario | Test |
|---|---|
| 4 write-gate half | `run-case-admission` "the write gate asks the same port ..." ; `case-admission` "a live reservation is rechecked ..." |
| 5 ceiling half | `run-case-admission` ceiling tests (ceiling 1 stops the chain, 2 lets one more launch) |
| 5 nested wave | `conductor-case` "a nested wave consumes the parent frame and an unknown remainder refuses the next write" |
| 12 council-lite, 4 seats under the ceiling | `playbook-proposer` "a panel Unit is admitted under a ceiling ..." (ceiling 8, 4 launches); the order guard `playbook-observable-order` unchanged and green |
| 13 seat launch exhausted | `run-case-admission` ceiling test (`fallbackExhausted`, one settle with `frameExhausted`); the proposer test asserts no ledger event from the core between admit and settle |
| 24 Work path | `work-path-case-admission` (unbound claim worktree runs, a case-owned one is refused, every `runUnit` call site injects the port); `run-case-admission` (no port refused, standalone only on `unbound`, `binding-view-unavailable` never `unbound`) |
| 25 proposer with the held hold | `case-admission-port` "a case that is held answers case-admission-busy; the same port with the holder's hold never refuses itself"; `playbook-proposer` order test |
| 1 overlap at the door | `conductor-case` "two writing dispatches into one case with overlapping writes" (through `runUnit`) |
| 7 gate parks one branch | `conductor-case` "a parked consent gate on one branch ..." |
| 9 conductor `running` | `conductor-case` (live reservation, free `advance`, no hint); `case-verbs` conductor tests (phase 06) |
| 11 context stripping | `worker-env-case-context` (A on the controller, worker admitted into B sees B; standalone sees none), `case-authority` (bound worktree, no case), codex injection test |
| 18 nested child cannot open | `conductor-case` "a child case that cannot open gives the parent its frame back, exactly once" (twice, two charges, two refunds) |
| 19 confined nested write | `confined-nested-write` (real bwrap: the worker calls `fgos run --writes`, `nested-write-from-confined-worker`; also with every variable unset and another case named); `case-authority` (masked view, read-only case dir) |
| 20 conflicting signals / closed case | `case-authority` |
| 23 playbook case from outside | `case-authority`, `fgos-case-doors` (CLI `workflow start --case <playbook>`) |
| §11.2 port observed at the write gate | `run-case-admission` (recheck with the admitted reservation and the changed paths) |

## Test runs

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<private cargo dir>/release/fgos`, host built from this tree (`cargo build --release --workspace`, private cargo dir linked as the worktree's cargo dir, real `node_modules` via `cp -al`).

- New files: `run-case-admission` 14, `case-admission-port` 11, `work-path-case-admission` 2, `case-authority` 7, `conductor-case` 6, `worker-env-case-context` 3, `confined-nested-write` 1, `fgos-case-doors` 3, `stale-approval-reapproval` 2, proposer additions 3: all green.
- Touched-module groups (workflow, architecture incl. A4 and manifest, cli, runner/dispatch, runner/execution, unit-summary, spawn-worker, loop, operation-choice, fanout, driver, dispatch-production-call-sites): 1338 tests, 1 failure that was a test of mine, fixed.
- Final full `npm test -- --test-concurrency=4`: 8570 tests, 8466 pass, 8 fail, 31 skipped. The 8: `fences-v1-tombstone` and `skill-wrappers` (known; both fail alone too), `run-supervisor-checks` x4 (known socket-path length under the full run; the file passes alone, 155 pass with the two known), and two that were mine: `unit.test` (the link normaliser test, now covers both shapes) and `case-verbs` close test (finished playbooks now close themselves). Both rerun green (29/29).
- Not re-run after the last test edits: the full suite. The two fixed files were rerun alone.

## Reused prior code

`cwdDevIno` and `readBinding`/`bindWorktree`/`unbindWorktree` (bindings), `dispatchCwdHolder` (quiet proof), `reserveParentFrame`/`refundParentFrame` (the nested charge now wraps them), `admitProposal` (the one predicate; recheck is the same function with route, frame and overlap answers ignored), `tryAcquireAdvanceLock` and the drain (settle-pending), `receiptsFromResults`, `resolveUnitInputs` as the one hand-off resolver, `playbookSubjectDigests`, `workerBaseEnv` as the one strip list, the phase 01 fixtures.

## Deviations

- `--activity` is required with `--case` (the phase file brackets it; admission names an activity and a case guide with several eligible ones has no way to guess).
- Host-side attempt cross-check (writer id to attempt to unit run) is not built: attempt writer ids are minted by the host from the attempt id and there is no reverse index. What is checked instead: the env case and reservation must be live on the ledger, and a second case is allowed only when its `case.opened` names the first as parent.
- The seat-launch rule: `seatLaunchesPerDispatch` of a frame is checked against the planned launches before fallback; the ceiling handed to the Unit is that times the frame's `fallbackPerSeat`, computed by admission (the phase file computed it in the core). A frame whose `fallbackPerSeat` is unresolved gives no ceiling.
- `settle` records the Unit's own outcome. For a playbook Unit the proposer may later turn a pass into `findings` for out-of-scope writes; the settle (counters, receipts, `achieved: []`) is unaffected, only its outcome label differs from `unit.complete`.
- `unit.scheduled` is recorded by a hook inside `runUnit` (see above); the old `unit.scheduled.reservationId` is now the admitted one.
- A nested charge is the child's whole frame (or one dispatch per Unit of a wave) taken up front and not refunded when the child closes with some unused. The phase file did not say; this is the conservative reading.
- "Nested read-only `fgos run` inside a confined seat still runs": the admission does not refuse it (tested), but in the real bwrap worker it fails to create its unit directory (`.fgos` is not writable there), which is the existing sandbox, not this change; the relay is out of scope (R9, F16).
- Settled spec facts edited: `docs/specs/runner.md` and the id-naming paragraph of `docs/specs/workflow.md` said `unit.json` carries `{runId, stepId, unitId}`; both now state the link (old records still read). §7.5 of `workflow.md` gained the auto-close rule (owner decision). No other spec text was stated wrongly.
- Component boundary: no change (the Execution Core owns the port, the Workflow implements it, the entry point injects it; `docs/platform/component-boundary.md` already says so).
- Install/setup/doctor gate: new env variables are set by the door per launch and are not config; no file a doctor check must expect. The existing `workflow-case-binding-sentinel` check covers the sentinel the port factory now ensures.
- Environment: this session's shell rewrites `git` through a hook that the worktree guard refuses; every `git` call ran as `RTK_DISABLED=1 git ...`.

## RUL104 idea list (not done)

- A machine-readable milestone subject for conductor cases, so `recheckEffect` and `status` can see a changed approval there too (today only playbooks have current digests; a conductor's consent never goes stale at the write gate). Evidence: `readCase` in the port passes `{}` for a conductor case.
- A writer-id to attempt index kept by the host, so the cross-check the spec asks for can be a lookup instead of a reservation check.
- Refund the unused part of a nested charge when the child case closes (needs the child's `used` counters read at close).
- `attemptStepEnv` copies every `FGOS_*` variable of the controller into the supervisor step environment, including `FGOS_CASE_*`; the steps are not workers, so it is harmless, but the strip list now exists in two places.
- `fgos workflow doctor` listing runs with an unfinished or corrupt ledger (carried over).

## Open questions

- Should a nested charge be settled as `opened` and show in `status` as a nested case of the parent (today it only lowers `frameRemaining`)?
- Should a completed child nested under a conductor case close itself and give back what it did not use?
- `--route` is recorded as `claimedRoute` beside the route the guide derives; should a claimed `should` that the guide reads as `unlisted` be refused instead?

## Live checks for the big lead

- A real `council-lite` run on a throwaway project: reservation `seatLaunchCeiling: 8`, settle `seatLaunchesUsed: 4`, case closed after completion.
- A real codex pane dispatched into a conductor case: confirm `FGOS_CASE_ID` and `FGOS_CASE_RESERVATION` reach its shell through the injected `shell_environment_policy.set`, and that a `fgos run --writes` there is refused `nested-write-from-confined-worker` or asks for `--case`.
- `fgos run --case <conductor> --activity <id> --writes ...` against a real conductor case with a real provider, then `fgos workflow status` and `fgos workflow close`.
- The stored-run cross-check of phase 01 against the 92 stored runs is unaffected by this change (order guard green) but was not re-run.

## Commits

- Phase 07: `fba876068 feat(workflow): admit every Unit that writes or names a case through one port the Execution Core owns`
- Phase 08 and the two owner decisions: `91e578557 feat(workflow): check every authority signal at both doors, charge nested cases to their parent, close finished playbook cases, accept re-approved reports`
- This report and the phase status marks: committed after those.

Status: DONE_WITH_CONCERNS
