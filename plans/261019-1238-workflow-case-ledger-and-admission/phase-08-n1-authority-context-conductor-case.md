# Phase 08 — N1 authority context at both doors; conductor case (F3, F7)

## Context

- Spec RUL-WF-10, RUL-WF-11 (1–8; owner 08:46 N1, 12:20 protocol + confined nested refusal), RUL-WF-12 (nested/fallback consume parent frame), RUL-WF-28, §1.3 (honest limits: in-session Edit/Write/Agent stay outside; read-only without case ref is not blockable), §5.4 (Shape C refusal `playbook-case-admits-via-proposer-only`), §7.2–7.4, §8 (whole table), R1, R8, R9; battery 1 (door), 5 (nested wave), 7, 9 (conductor), 11, 18, 19, 20, 23; §11.2 "port at `fgos run` observed at the write gate in a nested dispatch", "case env in the controller never reaches a worker the door did not admit".
- Code (phase 00 fact 7): `workerBaseEnv` `src/runner/dispatch/adapters.mjs:112` (strips session ids/lock fds today), `DISPATCH_DEPTH_ENV` `:85`; codex writer-id injection `src/runner/dispatch/assignment-runner.mjs:600` (`terminalAgentArgs` `:592`, attempt identity `:2275`); other non-env executors per phase 00; `bin/fgos.mjs` run verb (`:2805-2900`) and workflow start (`:2286-2320`); port impl + contract from 07; predicate, bindings, nested-frame helpers from 05.

## Requirements

1. **Case reference at both doors**: `fgos run … --case <caseId> [--activity <id>] [--route should|may-instead|unlisted] [--reason <text>]`; `fgos workflow start … --case <parentCaseId>` (nested case or nested `--units` wave). Flag spelling is this plan's; unknown-flag handling stays strict.
2. **Conjunctive authority check** in the Workflow port (`resolveAuthority`, called by `admit` and by `resolveBinding` when a write targets a bound worktree): signals = explicit ref, door-set env (`FGOS_CASE_ID`, `FGOS_CASE_RESERVATION`), target worktree binding, and host-side attempt cross-check (writer id → attempt → unit run → `unit.json` → reservation). Every non-empty signal must name one open case, or be explained by an admitted parent→child reservation. Outcomes: `authority-context-conflict`; `authority-context-invalid` (unknown, malformed, ambiguous, closed — never falls back to standalone); `bound-worktree-requires-case-authority` (bound target, no usable identity: stripped env, forgotten ref, daemon executor); naming another valid case still needs that case's live reservation covering worktree and `writes`. Precedence only picks lookup candidates; it never overrides the target binding or the parent reservation. All checked before `bind()`.
3. **Case env set by the door, never inherited**: `workerBaseEnv` strips `FGOS_CASE_ID`/`FGOS_CASE_RESERVATION` like the session ids; the launch adds them only from the reservation the door admitted (value returned by `admit`, threaded by `runUnit` into the assignment env). Executors that do not pass env get the case id beside the writer id in their injected config (codex `shell_environment_policy.set`; the others phase 00 lists). No Rust contract change.
4. **Confined nested write refused by name**: a writing dispatch whose port sees `binding-view-unavailable` (masked) or cannot write the ledger/bindings (read-only root) at `currentDispatchDepth() > 0` → `nested-write-from-confined-worker`. Read-only nested dispatch unaffected (R9; relay is F16, not built).
5. **Shape C refusal**: any dispatch naming a live playbook case from outside its proposer (inside one of its Units: `fgos run` read-only or writing, `workflow start --case` opening a child) → `playbook-case-admits-via-proposer-only`, immediately, no wait.
6. **Conductor case reserve-then-release** (F7, N6): `admit` takes `advance` for one reservation and releases; execution outside the lock; `settle` takes it once (settle-pending fallback, 05). Two eligible activities with disjoint reservations run concurrently; within one wave, units sharing a write-base chain keep their order (§7.3).
7. **Nested frame** (RUL-WF-28): parent frame deducted in its own `advance` section, released, then the child case/wave opens; child failing to open refunds idempotently; nested playbook, nested wave and provider fallback consume the parent frame, never widen it.
8. **Read-only with case ref** is admitted (counts `dispatches`, MUST independence still applies); read-only without case ref is standalone and uncounted (§1.3).

## Files

- Modify `bin/fgos.mjs` (run + workflow start flags, collect env signals for the port), `src/cli/command-registry.mjs`, `src/workflow/case-admission-port.mjs` (authority resolution, Shape C refusal, confined detection, nested frame), `src/workflow/case-verbs.mjs` (`start --case`), `src/runner/execution/run.mjs` (thread admitted launch env into the assignment; nothing else), `src/runner/dispatch/adapters.mjs` (`workerBaseEnv` strip list), `src/runner/dispatch/assignment-runner.mjs` (case id beside writer id for non-env executors), `CHANGELOG.md`.
- Tests: `test/workflow/case-authority.test.mjs`, `test/workflow/conductor-case.test.mjs`, `test/runner/dispatch/worker-env-case-context.test.mjs`, CLI cases in `test/cli/fgos-workflow.test.mjs` and the `fgos run` CLI suite.

## Steps

1. GitNexus `impact` on `workerBaseEnv`, `terminalAgentArgs`, `runUnit` (env threading); report risk.
2. Authority resolution + refusals in the port, unit-tested with fixture cases.
3. Door flags and env collection; env strip + set; non-env executor injection.
4. Conductor flows end to end in a tmp repo with the fake worker; nested frame.
5. Confined nested refusal: run a worker under the real bwrap fixture (`seedFileLocalBwrapRegistry`, as `test/workflow/discussion-workflows.test.mjs:21`) that calls `fgos run --writes`.

## Tests (battery → test)

- 1 two `fgos run --writes --case C` with overlapping `writes` → second refused at reservation.
- 5 nested `--units` wave inside a conductor case consumes the parent frame; unknown remainder refuses the next write.
- 7 a parked consent gate on one branch; another eligible activity is admitted through a separate door call.
- 9 conductor: `status` `running` with a live reservation although `advance` is free > 30 s, no resume hint; `resume` spawns no driver and only drains files.
- 11 conductor in the owner session and a worker whose shell unset every variable both `fgos run --writes` at a bound worktree without a case → refused before `bind()` by the binding alone; a non-env executor receives the case id through injected config.
- 18 child case cannot open → parent frame refunded exactly once; no scope ever holds two `advance`.
- 19 `fgos run --writes` inside a confined seat → `nested-write-from-confined-worker`; nested read-only `fgos run` still runs.
- 20 conflicting signals → `authority-context-conflict`; closed or unknown case → `authority-context-invalid`.
- 23 from inside a playbook case's Unit: `fgos run` (read-only and writing) and `workflow start --case` naming that case → `playbook-case-admits-via-proposer-only`, no hang (test has a timeout).
- §11.2: controller env carrying `FGOS_CASE_ID=A` launches a worker for an admission into B → worker env shows B only; a standalone launch shows none. Nested unconfined dispatch with its admitted case ref: write-gate `recheckEffect` observed.
- Guard and A4 unchanged.

## Risks / rollback

- Risk (H×M): a legitimate coding flow targets a worktree some case bound (e.g. a case left open) → refused. Mitigation: refusal names the case; `fgos workflow close` and doctor binding repair (05); Work paths stay unbound until coding cutover.
- Risk (M×M): env injection for a non-env executor missed → its worker's nested call fails `bound-worktree-requires-case-authority` (fail closed, loud). Mitigation: phase 00 enumerates launch paths; one test per executor kind with a fake binary.
- Risk (M×L): busy refusal on concurrent conductor admits (`case-admission-busy`) — retryable, named; doctrine (09) tells conductors to retry.
- Rollback: revert; cases opened by this phase are closable by the 06 verbs; bindings removed by close/doctor repair.

## Done when

All battery tests above, §11.2 env/write-gate tests, guard, A4 and full `npm test` green.
