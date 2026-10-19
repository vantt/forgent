# Phase 07 — AdmissionPort at every `runUnit` writer (F2 ceiling, F3 port, B3′)

## Context

- Spec §5.2 (Execution Core owns the port interface, never the decision; three operations or equivalent; `runUnit` takes it via options; **every** `runUnit` caller with `writes` injects the real port on landing; fail-closed by structure; port reaches the write gate; optional existing `advance` hold; admission after pattern resolution, before `bind()`), §5.3 (A4 one-way Workflow → Execution Core), RUL-WF-11.7, RUL-WF-12 (counting units; seat-launch ceiling delivered to the Unit; settle once; Execution Core never writes the ledger mid-run), §8 rows "Skill trong phiên lái Work item…", "Chi tiêu dưới cửa", §11.2, battery 4 (write-gate half), 5, 12, 13, 24, 25.
- Code (phase 00 facts 1, 4, 6): `runUnit` `src/runner/execution/run.mjs:380`; fresh-run path `:500-590` (declared check resolves pattern `:297`/`:509`; custody `:526`; unit dir/`unit.json` `:540-585`); custody re-take `:592-595`; `runRole` dispatch `:654-760`, fallback loop `for (;;)` `:898`; commit/preflight write gate `:820-890` (`commitPending` `:179`, `preflightUnitWorktree`); verify borrows custody `:1047-1049`; pattern name `:1065`; `settle` `:612-617`; Unit link `normalizeWorkflowLink` `src/runner/execution/unit.mjs:60-67`, written `run.mjs:425`, `:539`.
- Callers with `writes`: `bin/fgos.mjs:2890`; `src/workflow/runner.mjs:668`, `:688` (proposer after 06); `src/runner/work-dispatch.mjs:126`; `src/runner/operation-choice.mjs:2331` (incl. `fgos plan --validate` via `src/verbs/state/step.mjs:73`); `src/runner/fanout-batch.mjs:112`; 19 test files (phase 00 list).

## Relation to the custody lease (Git phase 04, already on main)

Two different authorities, no duplication:

| | Custody lease (`unit-custody` scope, `admitSuccessor`, `dispatch-cwd` kernel lease) | Case binding + reservation (this plan) |
|---|---|---|
| Question | is a live controller/worker writing this worktree **now**? | which **case** may write this worktree **at all**, and has this activity been admitted? |
| Owner | Holder-lock / Execution Core | Workflow |
| Lifetime | process (dies with holder; verify borrows it) | case (durable record, generation-checked) |

Order inside `runUnit` for a fresh writing run: resolve pattern name (pure) → port `resolveBinding` + `admit` → custody `admitSuccessor` → unit dir. Admission never takes or replaces the custody lease; custody stays the only same-worktree concurrency guard. Workflow reads custody only as the "attempt is quiet" proof when releasing a reservation or unbinding (`dispatchCwdHolder`, phase 05). If custody refuses after admission, `runUnit` settles the reservation as `not-started` (idempotent).

## Requirements

1. **Contract** in Execution Core: `src/runner/execution/case-admission-port.mjs` (infra) — JSDoc shape, `assertCaseAdmissionPort(port)`, refusal code constants, and `seatLaunchCeilingOf({ pattern, unit, runnerConfig })` (seats per round × `maxRounds` × fallback per seat, from `resolvePattern`). Operations: `resolveBinding({ worktree })`, `admit(proposal)`, `settle(reservationId, result)`, `recheckEffect(reservationId, { paths })` (the write-gate consent recheck; spec "hoặc tương đương"). No import from `src/workflow/**` (A4).
2. **`runUnit`** takes `options.caseAdmission`:
   - `writes` non-empty (or `sync`) and no port → `RunnerConfigError` code `case-admission-port-missing` before anything exists.
   - Standalone writing run only when `resolveBinding` answers `unbound` and no case signal is present; `binding-view-unavailable`, `binding-unsettled`, any refusal → throw before custody and before the unit dir.
   - Case-bound run: `admit` with `{ unitRunId (minted earlier), caseRef, activity, writes, worktree, readOnly, pattern, seatLaunchCeiling }`; the reservation id goes into `unit.json` as `workflow: { caseId, activity, reservationId }` (§4, replaces `{runId, stepId, unitId}`; `normalizeWorkflowLink` and its writers move; old `unit.json` files keep reading through the same normaliser).
   - Read-only run: port optional; with a case reference it is admitted (counts `dispatches`, no `writes` held).
   - **Seat-launch ceiling** as a bound beside `timeoutMs`/`maxRounds`: `runRole`'s launch loop stops at the ceiling; provider-limit seats keep `fallbackExhausted`; a reviewed round that cannot launch its next producer ends at the last evaluation. Never the word `blocked`.
   - **Settle once**: after the pattern settles (and on execution failure), `settle(reservationId, { outcome, seatLaunchesUsed, frameExhausted, receipts })`; nothing mid-run. Resume reuses the recorded reservation; never re-admits.
   - **Write gate**: before a writing round's commit, `recheckEffect`; refusal → round `policy-refusal` `consent-stale` (battery 4). The same port object is threaded from options to the commit step — no global, no re-creation.
3. **Implementation** `src/workflow/case-admission-port.mjs` (infra): `createCaseAdmissionPort({ repoRoot, caseId?, heldAdvance? })` over phase 05 predicate, bindings, `case-lock`; with `heldAdvance` it never acquires (proposer, battery 25); without, each operation tries `advance` once (`case-admission-busy` on admit; settle falls back to settle-pending, phase 05). Ensures the bindings sentinel when `currentDispatchDepth() === 0`.
4. **Every caller injects the real port on landing** (B3′, no stub): `bin/fgos.mjs` run verb; proposer (`src/workflow/runner.mjs`, now passing the port with `heldAdvance` instead of calling the predicate itself — removes 06's direct calls, L10); `work-dispatch.mjs`, `operation-choice.mjs`, `fanout-batch.mjs` with `createCaseAdmissionPort({ repoRoot: stateRoot })` — the claim worktree is unbound → behaviour unchanged. Work-layer files may import `src/workflow` (A4 forbids only the reverse); confirm with `test/architecture.test.mjs`.
5. Tests that call `runUnit` with writes construct the real port over their tmp repo (one helper in `test/helpers/` if repeated more than twice).

## Files

- Create `src/runner/execution/case-admission-port.mjs`, `src/workflow/case-admission-port.mjs`.
- Modify `src/runner/execution/run.mjs`, `src/runner/execution/unit.mjs` (link shape), `bin/fgos.mjs`, `src/workflow/runner.mjs`, `src/runner/work-dispatch.mjs`, `src/runner/operation-choice.mjs`, `src/runner/fanout-batch.mjs`, `docs/architecture-manifest.json`, the 19 test files as needed, `test/runner/dispatch-production-call-sites.test.mjs` (pins call sites).
- New tests: `test/runner/execution/run-case-admission.test.mjs`, `test/runner/work-path-case-admission.test.mjs`.

## Steps

1. GitNexus `impact` upstream on `runUnit`, `runRole`, `normalizeWorkflowLink` (expect HIGH/CRITICAL: report to the big lead before editing).
2. Contract + ceiling helper with tests; then `runUnit` changes behind the structural check; then each caller; then tests.
3. `rg -n "runUnit\(" src bin test` after the change: every writing call passes `caseAdmission`.

## Tests (battery → test)

- §11.2: writing Unit without port refused; standalone only with affirmative `unbound`; `binding-view-unavailable` never treated as `unbound`.
- 24 Work driver step with `writes`, unbound claim worktree → runs as before; same step without port → refused. Same for operation-choice (`fgos plan --validate`) and fanout.
- 25 proposer passes `heldAdvance`; admit/settle inside `runUnit` do not self-refuse.
- 13 seat-launch ceiling reached: provider-limit seat keeps `fallbackExhausted`; settle records `frame-exhausted` once; counters equal ledger; no ledger write mid-run (assert ledger line count unchanged until settle).
- 12 council-lite: four seats launch under ceiling 4 × `fallbackPerSeat`; guard identical.
- 4 write-gate half: approved artifact changed between admit and commit → `consent-stale`.
- 5 ceiling half: fallback chain stops at the ceiling.
- A4 green; `dispatch-production-call-sites` updated.

## Risks / rollback

- Risk (H×H): a writing caller missed → refused in production (coding items stop). Mitigation: step 3 grep + B3′ tests per Work path + full suite; the refusal names `case-admission-port-missing`, so a miss is loud, not silent.
- Risk (M×M): hoisting pattern resolution changes declared-operation checks. Mitigation: hoist only the pure name computation already duplicated at `:509`/`:1065`; one helper, both sites use it.
- Risk (M×M): ceiling miscount across rounds/fallback ends panels early. Mitigation: ceiling computed from the resolved pattern, guard + council-lite seat-count test.
- Rollback: revert the phase commit; 06 proposer keeps its direct predicate calls in the reverted tree. No data migration (old `unit.json` links still read).

## Done when

All tests above, A4, guard and full `npm test` green; `rg` shows no writing `runUnit` call without `caseAdmission`.
