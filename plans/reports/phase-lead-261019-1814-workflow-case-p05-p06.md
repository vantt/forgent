# Phase lead report: workflow case ledger, phases 05 and 06

Branch `worktree-agent-a735252065afdb488`, on top of main `9a2d111b5`. Commits are listed at the end.

## Phase 05: what was built

Infra only; no door, no change to `src/runner/execution/run.mjs` or the `fgos run` door.

- `src/workflow/case-projection.mjs`: the one pure fold. Stored runs (no `case.opened`) fold as playbook cases (guide read from the start event, or rebuilt from the steps), with the guide defaults as frame. Milestones are `unreached | achieved(digest) | stale(prior,current) | blocked(question)`; current digests are passed in, never read in the fold; an unknown current digest (`null`) makes only that milestone stale with `reason: current-digest-unknown`. Live reservations, frame used/remaining (an unresolved `set-at-approval` count is `null` = unknown), eligible activities, route points plus the always-present unlisted path, open gates, closable or not. Receipts only from `harness-verify`, `reviewer-verdict`, `gate-answer`; a delivery milestone (subject of a `verify-receipt` MUST) needs `pass` plus a receipt for that milestone and that digest, a diagnostic one accepts `findings`. `receiptsFromResults` builds receipts from a Unit run's own results.
- `src/workflow/case-admission.mjs`: `admitProposal` (pure). Checks entry milestones at current digest, the guide's MUST rows by the one check each names, write overlap with live reservations, binding answers, frame counters / seat-launch ceiling / rigor floor, route rules. It collects every violation, so two conflicting rules are both named. Returns `{ reservation, events, bindings }` or `{ refused: { code, condition, violations } }`.
- `src/workflow/case-bindings.mjs`: one record file per worktree identity (`cwdDevIno`, now exported from `src/holder-lock/registry.mjs`), exclusive create, pending -> `binding` event -> committed by rename, generation checked unbind with the custody lease as quiet proof, host-written `.root` sentinel (`binding-view-unavailable` otherwise), crash repair from the ledger.
- `src/workflow/case-runtime.mjs`: reservation files, settle-pending files, gate answers as round files (`gate-answers/<step>.rounds/<occurrence>-<round>.json`, exclusive create, never rewritten; `gate-answers/<step>.md` is a rendered view with front matter and the same text as before), and `drainCaseInbox`.
- `src/workflow/case-frame.mjs`: `reserveParentFrame` / `refundParentFrame` (idempotent on the reservation id, each a section under the hold the caller passes).
- `src/workflow/ref-digests.mjs`: `digestSubject` (files / tree / named), `digestUnitRunReports`, `digestText`; the false "gate answers are immutable" comment now describes what is true.
- `src/runner/dispatch/write-scope.mjs`: `writeScopesOverlap` (conservative, by literal leading segments, named in the refusal).
- `src/setup/workflow-case-checks.mjs` + registrations: doctor checks `workflow-case-binding-sentinel`, `workflow-case-bindings`, fix `workflow-case-bindings` (commit/remove crash leftovers under the case's `advance`, rebuild missing records of open cases from the ledger).
- Manifest rows for every new file.

## Phase 06: what was built

- `src/workflow/runner.mjs` is now only the Playbook proposer. Split by role, in the same change: `unit-handoff.mjs` (handoff, seat/pattern/override helpers, write chain, out-of-scope, worktree settle, subject digests), `case-lock.mjs` (`advance` acquire / hold / liveness, `tryAcquireAdvanceLock`; the drain is wired inside the acquire), `case-start.mjs` (start sources, `resolveFrame`, `openCaseOnLedger`, detached spawn), `case-verbs.mjs` (start, status, answer, resume, close). `index.mjs` re-exports; every importer moved (tests that reached into `runner.mjs`).
- Proposer cycle: drain -> read -> ready steps in the order the playbook declares (same passes as before, so the observable order is the one the guard pins) -> admission per Unit with the held hold -> `route` + `reservation` -> `runUnit` unchanged -> `unit.complete` -> `settle` (receipts from the run's results, launches recorded, blind flag), reservation file removed, worktree binding released -> re-read. A refusal fails the step by name (`admission refused <code>: <condition>`); when the refusal is about an approval gone stale the gate parks again (new occurrence, `reason` on the park) instead of failing. A Unit with a live reservation (controller died) keeps it. One bounded last drain before exit; an answer found there that releases a gate keeps the loop going.
- `answer`: takes `advance` once first (repairs a tail), keeps the round, folds it in if it holds `advance` (playbook: becomes the proposer in this process; detached: spawns exactly as before), otherwise returns `{ recorded: true, appliedBy: 'live proposer' }` and appends nothing.
- `status`: adds `case` (milestones with digests, eligible, listed routes + unlisted path, frame left, open gates, live reservations, bindings, closable). Conductor case: `running` = a live reservation, no hint. `resume`: playbook refuses while held (as before); conductor takes `advance` once and spawns nothing. `close` (new verb, CLI, registry): refused while a closure milestone is stale or a consent gate is parked, appends `case.closed`, unbinds quiet bindings, keeps the others.
- `start`: appends `case.opened` (guide reference, frame narrowed by `--frame k=v,...` never widened, request digest). A `kind: guide` guide opens a conductor case, binds its worktree, returns `caseId`, starts nothing.
- A run recorded before cases existed is opened on its first advance (`legacy: true`, guide defaults).

## Scenario -> test

| Scenario | Test |
|---|---|
| 1 overlapping writes | `case-admission.test.mjs` "two reservations with overlapping writes ..." |
| 2 worker-written approval | `case-admission.test.mjs` "an approval a worker wrote never satisfies human-consent ..." |
| 3 receipt on child paths | `case-admission.test.mjs` "a verify receipt on a child tree ..."; `case-projection.test.mjs` receipt cases |
| 4 approved artifact changed | `case-admission.test.mjs` "an approved artifact that changed ..."; proposer: `playbook-proposer.test.mjs` "an answer that arrives while a proposer holds advance ..." |
| 5 frame exhausted / unknown | `case-admission.test.mjs` frame counter and seat-launch tests; `playbook-proposer.test.mjs` "a Unit the frame has no room for ..." |
| 6 unlisted route | `case-admission.test.mjs` "an unlisted route is proposed and recorded ..." |
| 8 findings | `case-verbs.test.mjs` "findings without delivery ..." (conductor shape); declared wave still fails: `units-runner.test.mjs` "a unit that wrote outside its writes ends findings ..." |
| 9 restart, `running` | `case-verbs.test.mjs` conductor `running`; proposer restart from ledger + pinned guide + frame + round files: `playbook-proposer.test.mjs` (kill and resume, kept answer) |
| 10 guide edited mid-run | `playbook-proposer.test.mjs` "a run edited on disk after it started keeps the guide it started with" |
| 12 guard identical | `playbook-observable-order.test.mjs` unchanged and green |
| 14 one proposer, answer, order | `playbook-proposer.test.mjs` "concurrent resumes ...", "an answer that arrives while ...", `workflow-runner.test.mjs` "a run already being advanced ..." |
| 16 two spellings | `case-bindings.test.mjs` |
| 17 crash at each binding step | `case-bindings.test.mjs` (child killed after pending, after event) |
| 22 proposer killed | `playbook-proposer.test.mjs` "a proposer killed while its Unit runs ..." |
| 25 admit and settle with the held advance | `playbook-proposer.test.mjs` "every Unit is admitted before it runs and settled ..." |
| 26 one file, unbound without ledger | `case-bindings.test.mjs` |
| masked view | `case-bindings.test.mjs` |
| close refusals | `case-verbs.test.mjs`, `test/cli/fgos-workflow.test.mjs` |

## Test runs

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<private cargo dir>/release/fgos`, host built from this tree (`cargo build --release --workspace`, private cargo dir, linked as the worktree's cargo dir for the rust-host tests).

- Phase 05 new files (`case-projection`, `case-admission`, `case-bindings`, `case-runtime`, `workflow-case-checks`): 41 tests; one was my test expectation (the acquire already drains), fixed, green.
- Phase 06 new/changed: `playbook-proposer` 9, `case-verbs` 5, `fgos-workflow` CLI 8: all green. The workflow suites plus `architecture.test.mjs` (A4, kernel isolation, manifest) and `domain-registry-compiled`: 247 tests at first run, 5 failures that were mine (one import to retarget, two tests that asserted the old "answer is refused while held", the doctor module naming the ledger file, an unfinished-tail read before the lock), all fixed; rerun 112/112 on the touched files. `playbook-observable-order` (the order guard) green in every run, unchanged.
- Final full `npm test -- --test-concurrency=4`: 8419 tests, 8314 pass, 9 fail, 31 skipped. The 9, none importing a module I touched:
  - `fences-v1-tombstone` (known) and `skill-wrappers` (known, worktree only).
  - `cancel-registry.test.mjs` and `run.test.mjs` (file-level "test failed", no failing subtest): fail identically on a pristine export of main `9a2d111b5` run with the same host and env.
  - `run-supervisor-checks` (4, runtime socket path over 100 bytes under the full-run temp root) and `dev-host` (1, concurrent cargo builds): load and path length; both pass when their files run alone (rust-host set plus `run-supervisor-checks`: 324 tests, only the 2 known failures).
- An earlier full run, before the setup registry lists and the cargo-dir link were fixed, had 80 failures: 69 rust-host/fences tests needing the fgctl binary, 3 setup lists naming the new doctor checks; both fixed.

## Reused prior code

`cwdDevIno` (exported, not re-derived), `dispatchCwdHolder` (quiet proof), the one write-scope matcher module, `resolveUnitInputs` for report digests, `createAdvanceHold` / `appendWorkflowEvent` (the only ledger door), `normalizeGuide` for stored runs, the phase 01 guard helpers and `setupWorkflowFixtureRepo`. The old `writeGateAnswerFile` and the direct `gate.answer` append in `recordGateAnswer` are gone.

## Deviations from the phase files

- `case-lock.mjs` and `case-runtime.mjs`/`case-frame.mjs` exist from phase 05 (the doctor fix needs the lock, and the inbox and nested charge are phase 05 helpers); the phase files named only the other modules.
- Route kinds: besides `should | may-instead | unlisted` the projection/admission use `eligible` for an activity no open decision point governs (nothing to deviate from, so no reason is required). The Playbook proposer's pick is recorded as `should`. Without this, every ordinary choice in a guide with few decision points would be an "unlisted" deviation.
- Gate answers: the phase file said the answer file is created exclusively; because clarification rounds must accumulate in `gate-answers/<step>.md` (existing behaviour and tests), each round is its own exclusive file and `.md` is rendered from them. A clarification does not settle the gate; an approval (or any answer to an input gate) does, and a further answer is `gate-already-answered`; an answer while an earlier round is not yet on the ledger is refused with the same code.
- Frame flag: `fgos workflow start --frame key=value,...` (library param `frame`). A guide with no frame defaults refuses it (nothing to narrow). The playbook head's `dispatches` counts Units, so a resumed Unit keeps its reservation instead of taking a second one.
- Playbook worktree bindings are taken per writing Unit at admission and released at its settle (the proposer's worktrees are per Unit); only a conductor case binds its own worktree at open, and only when its guide has a writing activity.
- Existing tests changed because the contract changed (L10): the two `workflow-runner.test.mjs` tests that expected `answer` to be refused while another process advances now expect the answer to be kept for the live holder, no ledger line, and recorded by the next holder; `fences-v1-tombstone` probe and two imports retargeted.
- `docs/specs/workflow.md`: no settled fact is stated wrongly; not edited.

## RUL104 idea list (not done)

- A milestone `subject` in a guide is free text, so `status` of a conductor case cannot recheck a digest (only a playbook's, whose subject is its Units' reports). Idea: a machine-readable subject spec on milestones (files / tree / named), read by the one digest function. Evidence: `case.milestones` of a conductor case never goes `stale` through the verbs.
- `seatLaunchesUsed` in a settle counts recorded role results, not fallback attempts; the real figure arrives when the Execution Core returns it (07).
- A doctor check that every `must` row of a registered guide names a milestone some activity produces (carried over from the earlier report).
- Reading a ledger while another process appends can see a half line (`workflow-ledger-unterminated`); `status` and `answer` read without the hold. Idea: one bounded retry on that code in the read-only verbs.

## Open questions

- Should a completed or failed playbook case close itself (today only `close` does)? Its bindings are already released at each Unit's settle.
- Settle-pending is built and drained at every acquire, but the proposer never needs it (it holds `advance`); the conductor admission path in 08 will be its first writer.
- The stale-approval re-park asks the same gate again; the Execution Core independently refuses to hand a changed report to a later Unit (`report-changed-after-settle`), so a content edit after approval ends in that refusal on the next run. Both are intended; say if the re-park should be the only outcome.

Status: DONE
