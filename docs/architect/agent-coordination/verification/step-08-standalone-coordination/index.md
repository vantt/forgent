# Track: step-08-standalone-coordination

Plan: `plans/260901-1542-step08-standalone-coordination/plan.md`
Branch: `step-08-standalone-coordination`
Base ref: `75505c75812703b355f1291d618244c75a5d7b09`
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log:
`proofs/baseline-full-test-run.log`. 11 known baseline failures:

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer) |
| 2 | e2e pr-gate (a) runner item full loop | `test/e2e/pr-gate.test.mjs:226` | assertion, unrelated (PR-gate e2e) |
| 3 | e2e self-improve loop full contract (D1-D17) | `test/e2e/self-improve-loop.test.mjs:174` | assertion, unrelated (self-improve loop) |
| 4 | resolvePlan skips the risk-heavy gate (tsk-wve D1) | `test/intake/plan.test.mjs:953` | assertion, unrelated (intake plan) |
| 5 | resolvePlan skips requiring a verdict, mode "tiny" | `test/intake/plan.test.mjs:1198` | assertion, unrelated (intake plan) |
| 6 | resolvePlan skips for mode "small" | `test/intake/plan.test.mjs:1215` | assertion, unrelated (intake plan) |
| 7 | resolvePlan caller-supplied decompose verdict (D1) | `test/intake/plan.test.mjs:1588` | assertion, unrelated (intake plan) |
| 8 | codex-cli executor (LIVE) self-identification | `test/runner/codex-cli-glm-cli-live-executors.test.mjs:50` | live-executor timeout (120s) — **dispatch subject, watch in P00.2/P00.3** |
| 9 | herdr-spawn adapter interactiveMode premature idle (tsk-2rr) | `test/runner/herdr-spawn-adapter.test.mjs:222` | live-executor timeout (5s) — **dispatch subject, watch in P00.2/P00.3** |
| 10 | herdr-spawn adapter (LIVE) real agy-herdr binaries | `test/runner/herdr-spawn-adapter.test.mjs:562` | live-executor timeout (60s) — **dispatch subject, watch in P00.2/P00.3** |
| 11 | withLockRetry: numeric holderPid self qualifier (tsk-6uc) | `test/runner/lock-wait.test.mjs:161` | assertion, unrelated (runner lock-wait) |

This list may only shrink; any new failure beyond it blocks cell close.
Failures 8-10 touch `src/runner/dispatch/transport.mjs` (live executor
timeouts against real `codex-cli`/`agy-herdr` binaries/network — environment-
dependent, not logic failures) — P00.2/P00.3 touch dispatch files, so these
three get an explicit before/after comparison at those cells' close instead
of a blanket "unrelated" pass.

## Phase / Requirement Matrix

| Phase | Requirements | Status |
|---|---|---|
| 00 | R1-R11 | done |
| 01 | R1-R8 | done |
| 02 | R1-R8 | done |
| 03 | R1-R8 | R1-R4 done; R5-R8 outstanding (P03.2) |
| 04 | R1-R9 | missing (depends on 03) |
| 05 | R1-R8 | missing (depends on 04) |
| 06 | R1-R8 | missing (depends on 05) |
| 07 | R1-R8 | missing (depends on 06) |

## Active Cell

none

## Next Action

prepare (P03.2)

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 | done | `33494fd6` |
| P00.2 | Phase 00 R5, R6, R7, R8 (+ R10 partial) | done | `7957f6f3` |
| P00.3 | Phase 00 R9, R10, R11 | done | `454ecb56` |
| P00.4 | provider-family derivation fix (closes Phase 00) | done | `45137208` |
| P01.1 | Phase 01 R1, R2, R3, R4 | done | `626e057b` |
| P01.2 | Phase 01 R5, R6, R7, R8 (closes Phase 01) | done | `85206dca` |
| P02.1 | Phase 02 R1, R2, R3, R4 | done | `1f2260b1` |
| P02.2 | Phase 02 R5, R6, R7, R8 (closes Phase 02) | done | `bbb71784` |
| P03.1 | Phase 03 R1, R2, R3, R4 | done | `8fc3130a` |

## Phase 00 Status

**CLOSED.** R1-R11 across P00.1-P00.4. R11's glm-cli half remains a
permanent, honestly-documented partial (live-executor timeout, not a stop
gate — see P00.3.md Review). P00.4 fixed the provider-family derivation
disagreement (3 registered executors, then a 4th live one discovered by
its own Red-Team — `gitnexus`) with a loud advisory warning rather than a
risky full-parity fix; one residual, currently-latent gap remains
(bare-shape executor with a non-Claude command) and is intentionally
mitigated, not eliminated — documented in P00.4.md's Gaps section.

P00.2 went through 3 rounds: Doer -> Reviewer (1 HIGH + 1 MEDIUM + 2 LOW,
all fixed) -> Red-Team (1 new HIGH, RT1, fixed) -> Red-Team re-check
(confirmed). Both HIGH findings were genuine governance-semantics gaps in
the self-hosted dispatch policy resolver — caught before merge.

P00.3 went through 2 fix rounds: Doer -> Reviewer (1 HIGH pre-existing/
deferred to P00.4 + 1 MEDIUM, MEDIUM fixed) -> Red-Team (2 HIGH + 2 MEDIUM:
an off-by-one and a false-positive in the new duplicate-flag detector, both
fixed; this index.md's missing P00.4 entry, fixed directly by the
Coordinator; a third `deriveProviderFamily`-family instance in
`transport.mjs`, folded into P00.4) -> Red-Team re-check (confirmed).

## Phase 01 Status

**CLOSED.** R1-R8 across P01.1-P01.2.

**P01.1 CLOSED** (Phase 01 R1-R4): created `src/runner/coordination/{schema,store,replay}.mjs`
(manifest/event store matching `coordination-session.md` exactly, reusing
`state/events.mjs`'s cross-process lock and `assignment.mjs`'s
`buildAssignment`/`claimAssignmentId`); direct `mission-lite.mjs` cutover
(deleted, minimal-surface edits to `assignment.mjs`/`assignment-runner.mjs`/
`cli.mjs`/`dispatch.mjs`, `isMissionLite` renamed `isReadOnlyMode`). Went
through 2 full Doer->Reviewer->Red-Team->Fixer->Red-Team-recheck rounds,
both on genuine crash-safety bugs in the idempotent-Assignment-claim
mechanism: round 1 fixed a duplicate-Assignment-on-crash-retry bug; round 2
(triggered by Red-Team finding the round-1 fix itself incomplete) fixed a
"phantom never-registered Assignment" self-healing gap and a taskKey-hash
collision bug — the Fixer also self-caught and fixed a third latent bug
(duplicate event on an inner crash window) while verifying its own round-2
fix. One trivial LOW (unguarded JSON.parse on a torn claim-file write)
deferred as a named one-line follow-up, not blocking.

**P01.2 CLOSED** (Phase 01 R5-R8, closes Phase 01): created
`src/runner/coordination/session-engine.mjs` (`openStandaloneSession`,
`dispatchPrimaryTask`, `proposeConsult`, `validateConsultProposal`,
`resumeSession`; sole internal call site for `executeAssignment`/
`createSessionAssignment`, statically proven no-direct-spawn). Live proof
captured for both `codex-cli` and `glm-cli` under `proofs/P01.2/`. Went
through 1 Reviewer round (1 HIGH TOCTOU in `bindActor`, fixed) + 3
Red-Team rounds each finding one further genuine race/correctness bug:
round 2 (MEDIUM, role-substitution race in `proposeConsult`'s second
unlocked read), round 3 (HIGH, unguarded concurrent dispatch letting two
callers both spawn an executor and both link a result for the same
Assignment — fixed via an exclusive `dispatch.claim` file plus
`linkResult`/`replay.mjs` duplicate-`result-linked` detection), round 4
(HIGH, round 3's permanent claim wrongly and permanently blocked a
legitimate retry after ANY pre-spawn `executeAssignment` failure, e.g. a
governance-blocked config — fixed by releasing the claim only on a
provably pre-spawn `RunnerConfigError`, confirmed to cover every pre-spawn
throw site with no post-spawn overlap). A final Red-Team re-check on
round 4 (4 targeted angles + an empirical 6-run concurrency probe) found
no further defect — convergence point for this cell. Two LOW gaps
deferred (Proof Matrix count cosmetics; live-proof zero-duplicate-runs
claim asserted in log prose rather than a separate raw-listing artifact,
though independently proven by unit tests) plus one LOW gap from round 4
(non-`ENOENT` unlink failure would mask the original `RunnerConfigError`
diagnostic — extremely low-probability, not fixed). Full suite: 4739/4752
pass, all 8 failures match the documented baseline exactly, no new
failure. Deferral Audit: AC-I001/AC-I002/AC-I007 met, AC-I006 partially
covered (main fix in Phase 00) with this cell reinforcing "no private
dispatch core" + fail-closed-through-session-engine, AC-I008 deferred to
Phase 07 as planned, AC-I009 satisfied vacuously (no mutating-actor
capability exists yet in this engine).

Next: P02.1 (Phase 02 — shared FlowDefinition kernel).

## Cell P00.4 (done, closes Phase 00)

**Scope**: fix the `deriveProviderFamily` call-site disagreement —
live-confirmed during P00.3's codex-cli proof
(`assignment-policy.mjs:201` calls it with one argument, defaulting
`resolvedCommand` to `'claude'`; `resolve.mjs:429` calls it with the
executor's real command — the two disagree for any registered executor with
no `providerModel`/`provider` field whose real command isn't a Claude CLI
command). Confirmed live to affect exactly 3 of 12 currently registered
executors: `codex-cli`, `codex-herdr`, `herdr`. Creates a real
governance-bypass risk: a `disallowedProviders` config naming one of these
by its true command-derived family would silently fail to block it. P00.3's
Red-Team found a third instance of the same root-cause family:
`transport.mjs:163`'s stderr banner reads the dead `executor.provider`
config field (0/12 executors set it) instead of the already-correct
`governance.providerFamily` — fold into this cell's scope too. Smallest fix
direction (per P00.3's Reviewer): pass the executor's real resolved command
as `deriveProviderFamily`'s second argument at `assignment-policy.mjs:201`,
mirroring the already-correct sibling call. **Do not close Phase 00 (do not
mark plan.md's Phase 00 row done) until this cell closes or is explicitly
re-scoped by the maintainer.** Source: `P00.3.md`'s Review section (HIGH
finding) and Red-Team section (MEDIUM finding #4).

## Phase 02 Status

**CLOSED.** R1-R8 across P02.1-P02.2.

**P02.1 CLOSED** (Phase 02 R1-R4): created `src/runner/definitions/schema.mjs`
(`validateFlowDefinition`, `mergePolicyStack`, `FlowDefinitionError`) --
a pure, neutral FlowDefinition IR validator matching
`flow-definition.md`/ADR-009 exactly: node `kind` derived not stored, no
`purpose` field, both `Workflow`/`CoordinationProtocol` profiles with
their mutually-forbidden fields enforced structurally via field
whitelists, `gate-verdict` legal only under `Workflow`, PolicyPatch
`minTier` monotonicity (raise-only) across scopes, `missionId` forbidden
at any nesting depth. Zero existing files touched -- standalone new
package, no adapter/loader/fixtures yet (R5-R8, P02.2). Went through 1
Reviewer round: field-by-field contract cross-check plus an edge-case
sweep (cycle safety, freeze-depth, empty-array handling) found one real
MEDIUM bug (a `__proto__`-keyed `baseStepMap` entry silently vanished
with no error -- fixed via `Object.create(null)`) and 2 LOW notes
(document-scoped not branch-scoped cycle guard, documented not fixed;
`missionId` test depth broadened). One genuinely ambiguous scope question
(does `topology.edges[].from/to` need actor cross-referencing) was
independently adjudicated by the Reviewer against the contract's own
literal text as a legitimate, contract-supported deferral, not a defect --
recorded as a Gap for a later phase. No further Red-Team round dispatched:
unlike the CoordinationSession session-engine cells, this is a pure
synchronous validator with no concurrency/crash-safety surface, so a
single thorough Reviewer round was judged proportional. Full suite:
4763/4776 pass, all 8 failures match the documented baseline exactly, no
new failure. Phase-level exit criteria (AC-I003/005/006 proofs,
zero-consumer-migration audit) deferred to P02.2's own close, since this
cell's module has zero consumers by construction.

**P02.2 CLOSED** (Phase 02 R5-R8, closes Phase 02): created
`src/runner/definitions/workflow-adapter.mjs` (R5, projects the
already-normalized Workflow shape into a `Workflow`-profile FlowDefinition;
`src/state/workflow-stage-graphs.mjs` itself is at ZERO diff -- the
strongest possible zero-consumer-migration proof) and
`src/runner/definitions/protocol-loader.mjs` (R6, deterministic
project/domain/core `CoordinationProtocol` discovery, reusing P02.1's
`validateFlowDefinition` for every document, read-only, no execution
wiring). R7: two `core/coordination-protocols/` fixtures (declared-consult,
independent research fan-out/fan-in) plus the coding `feature` Workflow
golden, all independently confirmed genuinely discovered/validated (not
mocked). R8: 2 new doctor checks registered in `src/setup/registrations.mjs`.
Went through 1 Reviewer round: found 1 MEDIUM (a `shadowedBy`/`shadows`
comment claiming a traceability field that didn't exist anywhere in the
code -- corrected) and adjudicated 1 flagged item as a genuine MEDIUM
gap, not a defensible scope reading (a `metadata.id` collision across two
DIFFERENT domain directories silently shadows with no error and no trace,
since the domain tier's per-directory duplicate-detection never
cross-checks sibling domains) -- recorded as a tracked follow-up rather
than fixed this cell, since zero `domains/*/coordination-protocols/`
directories exist anywhere in this repo today (zero current blast
radius), matching this track's proportional-rigor practice. Full suite:
4782/4795 pass, all 8 failures match the documented baseline exactly, no
new failure. Deferral Audit: AC-I003/AC-I005/AC-I006 all MET (no
execution wiring; every tier through the same validated kernel;
`src/runner/dispatch/**` and `src/runner/coordination/**` both remain at
zero diff for the whole phase).

## Phase 03 Status (in progress)

**P03.1 CLOSED** (Phase 03 R1-R4): added `openDeclaredProtocolSession`/
`dispatchDeclaredOperation`/`recordConsultDisposition` to
`session-engine.mjs` -- a SECOND, declared-protocol dispatch path that
routes exclusively through the same `createAndExecuteSessionTask` shared
primitive the existing agent-led `proposeConsult` path already uses (no
second execution core, statically confirmed). Materializes the
`declared-consult` fixture's SessionActors/operations into inline
Assignment contracts; enforces mediated topology (context isolation
proven structural, not filtered, via a sentinel-string test); composes a
7-scope policy precedence chain (`runner < definition < operation < role
< actor < assignment < cli`) through a small additive extension to
`assignment-policy.mjs` (`cliOverride.policyProvenance`, undefined for
every pre-existing caller); requires a disposition
(accepted/rejected/partially-accepted + rationale) that can never resolve
to `evidence: 'verified'`. Went through 1 Reviewer round that found and
EMPIRICALLY REPRODUCED (not just reasoned about) a HIGH cross-process
TOCTOU: the `maxRounds` topology cap was checked via an unlocked read
before the real atomic Assignment-creation write, letting two genuinely
separate `node` OS processes both win a race and both create a round
against a `maxRounds: 1` edge (15/15 reproductions, confirmed via
persisted on-disk state, not process exit codes) -- a single-process race
was proven impossible (zero `await` between the check and the lock), so
this specifically needed real multi-process reproduction to find and to
verify the fix. Fixed by extending `createSessionAssignment` (store.mjs)
with an opt-in `opts.maxRoundsForActor`, checked on a fresh read INSIDE
the function's own existing cross-process lock, positioned after the
existing resume/self-heal short-circuit so a legitimate resume is never
double-counted -- mirroring this same file's own P01.2 precedent
(`bindActor`'s `opts.primaryActorId`) exactly. A Red-Team re-check
re-ran the IDENTICAL 2-process reproduction against the fix: 0/15 (race
closed), plus 10/10 confirming legitimate resume-vs-new-round concurrency
was not overcorrected into false rejection. One LOW informational gap
(a rare interleaving can surface a pre-existing, unrelated `replay.mjs`
torn-read message instead of the round-cap message; fails closed either
way, not fixed). Full suite: 4807/4820 pass, all 8 failures match the
documented baseline exactly, no new failure. Dispatch smoke check
(`mechanism` field) confirmed intact. Phase-level exit criteria
(AC-I002/003/006/008, agent-led-vs-declared equivalence) deferred to
P03.2 per the plan's own cell split.

Next: P03.2 (Phase 03 R5-R8 -- session bounds enforcement, illegal-
behavior negative sweep, agent-led-vs-declared equivalence proof, live
interactive proof; closes Phase 03).
