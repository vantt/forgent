# Architecture advisory: preservation matrix

Date: 2026-10-06. This is the contract for the revised plan, not implementation evidence.

## Decision

Keep one advisory skill over Workflow → CollaborationPattern → bind → RunResult. Restore missing cognitive jobs and bounded dialogue; do not restore the retired coordination engine. Executor/model selection stays in runner config and `bind()`. Role/persona meaning stays in dispatched task instructions; no persona registry or actor identity is needed merely to express a viewpoint.

The earlier recommendation to delete everything unsupported by today's Workflow is withdrawn: absence from the current implementation is not evidence that the product requirement was retired.

## Evidence and limits

- `42e37adf7`: added five-step `core/workflows/architecture-advisory.yaml` and partially rewrote `core/skills/fgos-architecture-panel/SKILL.md`.
- `2180b4e72`: retired the coordination engine. Its actor overrides and specialist-slot API are not current interfaces.
- `plans/261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/phase-03-architecture-advisor-workflow.md`, Requirements: three shaping viewpoints, roles/personas, specialist at critique/synthesis, and dialogue/revise/close were required. Missing implementation is a migration gap, not permission to drop them.
- That plan's `reports/acceptance-case-2.md`: `DONE_WITH_CONCERNS`; quality compared with the old engine **NOT RUN**; prompt mentions of roles did not prove separately dispatched tasks. The checklist's quality mark is not sufficient proof.
- `plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md`: old-engine case 5 **NOT RUN**. Case 3's one command/zero pane keys is current-side evidence, not an A/B win.
- `plans/reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md`: historical reference to `thieung/herdr-cook-plan` at `619b8cd`, including a 151-line close checker. No new upstream checkout or benchmark was performed here. The lesson is a thin skill using available primitives, not an exact line-count requirement or a port of its checker.
- Worktree source inspected: `src/workflow/definition.mjs`, `runner.mjs`, `loader.mjs`; `src/runner/execution/patterns/{panel,reviewed,role-tasks}.mjs`, `unit.mjs`; `bin/fgos.mjs` Workflow entry. Existing roleTasks work for reviewed/synthesizer, but panelist invocation omits params. Workflow templates select prior steps within the run; CLI start accepts registered ID or plan, not an ad-hoc definition. Unit input refs already support `unit-run:` and `gate-answer:`; exposing them in Workflow requires a narrow seam.
- `bind()` + `resolvePosture()` smoke observed required `host-write-denied`. This proves resolved policy only. No live worker confinement probe or new advisory quality run was performed.
- Astra found final-packet review, late specialist, findings routing and interrupted Unit reconnect gaps. Corrected contracts and early gate are Phase 02 of this separate advisory plan, NOT RUN. Its earlier structural re-review was correct/zero findings, not live proof.

## Preserve meaning, replace mechanism

| Required product behavior | Smallest implementation home | Remove, do not port | Proof required at implementation |
|---|---|---|---|
| One raw CASE, target repo, human intent | Thin skill frames raw request, scouts facts before questions, starts Workflow | User-facing protocol selection and executor roster | Raw ambiguous and clear cases work through same entry |
| Context investigator reports facts and disconfirmation, not recommendation | Framing solo task with explicit investigation instructions | Standing identity and separate context actor lifecycle | Frame cites repo evidence, distinguishes facts/unknowns and intent |
| System shaper proposes coherent primary structure | Named panel seat and existing roleTasks | Concrete executor/model row | Actual seat assignment and report contain its distinct job |
| Alternative shaper challenges default, including smaller/no-build when credible | Named independent panel seat and roleTasks | Model-name diversity masquerading as cognitive diversity | Credible materially different candidate; no sibling report supplied on first pass |
| Constraint advocate tests feasibility/constraints | Named independent panel seat and roleTasks | Actor/persona schema | Different task and relevant constraints visibly influence options |
| Critic attacks proposals; independent red-team attacks actual final packet/authority | Critique reports then reviewed recommendation with synthesizer as producer; opt-in completed-report findings routing | New review scheduler or inline checker fallback | Final packet version inspected, substantive objection changes recommendation/is evidenced/is visible dissent; findings reaches explanation |
| Synthesis recommends and preserves dissent; lead explains without inventing candidate | Panel comparison, reviewed final recommendation, separate explanation/close segment | Persistent lead identity or unreviewed final solo synthesis | Exact inspected report reaches explanation; report completion never means agreement |
| Human words and decisions stay authoritative and verbatim | Verbatim Workflow request and no-Unit close gate answers; generated lineage labelled in Workflow description; input refs indexed by source | Authorization/disposition/CAS state machine | No generated text labelled human; actual close/reopen answer persisted, no invented decision |
| Specialist discovered during critique or recommendation | Read completed segment reports; bounded specialist + affected reviewed recommendation before explanation, no fake owner turn | Standing actor, specialist-slot API, conditional scheduler | Need discovered after shaping and during recommendation review; real answer used; refusal/remaining gap explicit, not fabricated |
| Clarify/challenge/new context/alternative/composition/decide/defer | Skill interprets turn; unchanged claim uses existing evidence; material change submits finite continuation DAG | Generic intent classifier, operation protocol, per-turn action ledger | Clarification does not rerun panel; requested alternative/composition is actual dispatched work |
| Bounded human reopen and interruption recovery | Selected refs/explicit affected tasks, labelled lineage; durable Workflow–Unit association and Unit resume | Mutated old Unit objective, second session state, duplicate work | Same interrupted Unit/settled assignments reused; two genuine human material rounds, no budget reset or fake defer |
| Close with decide/defer/no-consensus and causes | Existing no-Unit close gate records exact human turn; skill report explains evidence/outcome | Binary closed-state checker as advice-quality oracle | Real decision/defer attributed; advisor no-consensus never fabricated as human answer |
| Read-only advising and honest independence | Existing required confinement plus live probe; blind panel input packets; actual binder provenance | Guaranteed OS read isolation, hardcoded provider pins | Workspace write denied; outbox report works; input omission not claimed as read secrecy |

## Simplicity boundary

1. One user-facing skill; no new coordinator, actor registry, role-binding system, generic scheduler or store.
2. Existing `params.role`/`params.roleTasks` carry cognitive work. Persona is task posture, not a new config entity. Existing `bind()` still selects executors/models and enforces independent checker policy.
3. Planned changes stay in existing owners: original panel params/definition/contextRefs seams plus opt-in advisory findings routing and durable Unit association/reconnect. Required input capture repairs use existing Unit/ref owner. A fixed seam count is not proof of completeness.
4. Read actual completed analysis/recommendation reports before selecting the next finite graph. At most one specialist intervention per pass; no forced no-op, gate skip, scheduler or per-seat driver retries. Technical segments are not human reopen turns.
5. Workflow/Unit stores own execution truth. Request remains human verbatim; generated root/parent/pass/round belongs in description. Quote stored original CASE with provenance. Paths alone do not freeze bytes; Phase 02 proves capture/digest/reconnect. Final no-Unit gate records genuine human turns.
6. Two human material reopen rounds and one specialist intervention per advisory pass are new explicit choices, not historical doctrine. Report actual starts/reads/answers; drop the one-start claim.
7. **01 intent/challenges → 02 early feasibility ACCEPT → 03 source cutover → 04 regenerate/restage/installed-entry proof.** Early failure blocks this advisory plan, not original single-door doctor/root hygiene. Old single-door01 source cleanup must land before new03 touches same skill; shared spec/build/release writers serialize.
8. A review may improve this small design, but cannot silently delete a preservation row. Any change to product requirements needs a stated decision.
