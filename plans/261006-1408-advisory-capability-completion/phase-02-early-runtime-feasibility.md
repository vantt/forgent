---
title: "Early runtime feasibility and five bounded advisory contracts"
status: pending
dependencies: [1]
requiresReview: true
---

# Phase 02 — Early runtime contracts and vertical-slice feasibility

Proposed implementation after a separate implementation instruction. Phase 01 locks intent, user challenges and the preservation matrix; this gate must pass before Phase 03 canonical skill cutover and Phase 04 regeneration/staging. NOT RUN during planning. The prior claim that only three seams suffice is withdrawn after Astra's source-grounded review.

## Goal and boundaries

Preserve three shaping viewpoints, real critique/red-team, specialist discovered when needed, dialogue/revise/close and owner authority using existing Workflow/Pattern/Unit owners. No coordinator, conditional scheduler, actor/persona registry, quality oracle, session store or executor policy. Existing roleTasks express cognitive posture; bind owns independence and confinement.

## Source facts and implementation owners

Read Phase 01, the original single-door reading-map, runner spec, handoff contract and [preservation matrix](reports/advisory-preservation-matrix.md) first. Before each symbol change run upstream impact, report blast radius/warn on HIGH/CRITICAL, use LSP references for exported changes, and inspect history/prior art.

- `src/runner/execution/patterns/panel.mjs`: panelist roleUnit calls omit params; `role-tasks.mjs` already interprets exact-role/kind tasks.
- `src/workflow/{definition,checked,loader,runner,store}.mjs`: existing definition validation/snapshot/start/step ownership; inspect generated contract owners before changing them.
- `src/runner/execution/{run,unit}.mjs`: Unit creation/resume and immutable execution; keep allocation/history ownership here.
- `src/runner/execution/patterns/reviewed.mjs`: final findings outcome; review receives current producer report, not a later Workflow synthesis.
- `src/runner/execution/handoff-refs.mjs`: actual ref resolver and report hash checks; file/ref strings alone do not freeze arbitrary content.
- `bin/fgos.mjs` and `src/cli/command-registry.mjs`: existing Workflow CLI door; do not move legacy Node entry.
- Existing Workflow runner/architecture-advisory/definition/loader/CLI and Pattern suites; discover actual tests before editing. `docs/specs/runner.md`, handoff contract if boundary changes, and CHANGELOG Unreleased accompany implementation.

## Five bounded runtime contracts

### 1. Distinct panel tasks

Pass existing params to panelist roleUnit. Use exact semantic roles `panelist-system`, `panelist-alternative`, `panelist-constraint` and matching roleTasks. Retain `panelist-` prefix because current bind checker classification uses it. First-pass seats receive equal frame/evidence and their own task, not sibling proposals. Panel synthesizer produces a comparison, not a competing final recommendation.

### 2. Explicit definition entry

Add planned `fgos workflow start --definition <JSON/YAML path>` through existing validated/persisted start API. Exactly one selector among registered ID, --plan, --definition; reject ambiguity/invalid definition before recording or dispatch. Resolve file from caller cwd, snapshot before detach; foreground/detached/resume use that stored object, not later edits. Reuse loader validation/parsing and checked schema source. No new env/default/dependency. Register setup/doctor only if implementation actually adds an infrastructure prerequisite.

### 3. Prior evidence and owner provenance

Planned `template.contextRefs?: string[]` uses existing Unit input forms: repo-relative file, `unit-run:<id>/<role>`, `gate-answer:<workflowRunId>/<stepId>`. Omitted retains old behavior; combine with explicit same-run dependency-selected inputs, do not reinterpret refs as dependencies. Resolve with explicit store/main/worktree roots; missing/invalid required evidence refuses before its consumer worker.

Handoff includes a provenance index: gate-answer = recorded owner turn, unit-run = advisor report, file = supplied evidence with authorship not inferred. Keep full content, not replacement summaries. Original CASE is recovered verbatim from stored root Workflow.request and embedded in the continuation task as a labelled quotation with root run ID; newest human turn stays verbatim in request. Generated root/parent/pass/reopen metadata belongs in snapshotted Workflow.description, never human request.

Snapshotting refs is not snapshotting all evidence bytes. Verify actual existing capture/hash semantics, especially changed gate-answer/repo file and latest-round unit-run resolution. Persist the resolved input bytes/digests through existing Unit capture ownership before dispatch where required for reproducibility; refuse changed/missing captured content on resume rather than recapture as if unchanged. Do not claim generic filesystem immutability. This resolver/capture repair, if necessary, belongs to this contract, not a new evidence store. Never edit an answered parent gate to add a later turn; use the next run's gate.

### 4. Completed advisory reports with dissent

Add narrow opt-in `template.acceptOutcomes` permitting only `pass` and `findings`; default is pass-only. Validate non-empty/unique supported values before creating a run. A configured advisory consumer may proceed from a genuinely settled Unit whose outcome is findings, retaining outcome and complete objections in events/status/reports. Do not rewrite findings to pass or weaken reviewed acceptance, bind, policy-refusal, failed/no-evidence/cancelled semantics. Those failures still stop execution; omitted field preserves coding consumers. Explanation must explicitly distinguish recommendation with dissent, insufficient-evidence advice, and execution failure. This is report-completion routing, not approval or a quality oracle.

### 5. Durable in-flight Unit association and reconnect

Current Workflow unit.scheduled lacks the Unit ID until runUnit returns; resume therefore cannot reliably reconnect interrupted work. Allocate/persist Unit identity and immutable task/refs using existing Unit preparation ownership, then record Workflow association BEFORE first worker starts. Reuse existing Unit resume by passing that recorded identity; project it in existing Workflow store/status. Cover the crash window between Unit preparation and association with deterministic/recoverable existing identifiers: recovery must not create a second active Unit. Do not introduce another allocator/store or claim exactly-once external execution.

On resume, settled role reports/assignments remain reused, incomplete work follows existing Unit attempt recovery, definition/task/captured inputs stay original. If a worker is still live, observe/reconnect it rather than launch a duplicate. Required failure/cancel handling remains explicit. The feasible preparation/recovery interface must be locked and proven before Phase 03; inability to make the association crash-safe blocks this phase rather than becoming a later follow-up.

## Finite boundaries, not conditional scheduling

Prototype one analysis segment (framing → blind shaping → critique reports), one recommendation segment (reviewed producer=synthesizer, reviewer/red-team inspect that producer's recommendation), then explanation + no-Unit close. Use report-completed findings routing only on advisory Units. Explanation must consume the exact recommendation report version inspected by final reviewer/red-team.

At each completed segment, the skill reads actual reports. If critique or recommendation reveals one named material expertise gap, start one bounded specialist + affected reviewed recommendation segment BEFORE explanation. No fake human gate/turn and no owner reopen budget consumed for advisor-discovered missing work. At most one specialist intervention per advisory pass; if still insufficient, deliver explicitly limited/insufficient-evidence advice, not an unsupported recommendation or automatic specialist loop. Human material reopens remain bounded separately at two. Boundaries also allow material unknowns to be parked for a real human answer when user-exclusive; technical continuation is not a human answer.

No unconditional empty specialist, generic continuation builder or per-seat driver choreography. Record actual finite starts rather than promise one start. The registered analysis definition and concrete continuation definitions are finalized in Phase 03 only AFTER this prototype is proven.

## Early vertical-slice experiment — blocking exit

Use existing in-process startWorkflow({workflow}) for minimal prototypes first; then exercise new CLI entry once available. No full skill rewrite/regeneration/release work is prerequisite. Use a real reachable external target with original owner constraint and explicit roots. Record commands, Workflow/Unit/assignment IDs, dispatched tasks/inputs, full reports and bindings.

1. Three real blind shaping workers produce distinct, substantive viewpoints. Trace one actual objection to changed recommendation, evidence-backed rejection, or attributed visible dissent through explanation.
2. Red-team inspects the exact final recommendation packet; try a synthesis-introduced unsupported claim or removed dissent and observe detection/disposition. A reviewed label is not evidence.
3. Discover specialist need AFTER shaping/critique, not predeclare a convenient specialist question. Prove bounded intervention, downstream use and honest unavailable/refused case without inventing a human turn. Also cover a gap first exposed during recommendation review.
4. A real unresolved objection returns findings and still reaches honest explanation/close; execution failure/policy refusal/no-evidence do not get accepted by acceptOutcomes.
5. Interrupt multi-role Unit after one role settles but before Unit complete. Resume through Workflow door: same Unit identity, settled assignment reused, no duplicate live worker. Exercise preparation/association crash boundary and file/ref edits.
6. Clarification creates no Unit; material human turn creates only affected work; original CASE/constraint and new turn reach consumer distinctly. Record decide/defer/reopen exactly; distinguish consent from instruction. Crash after answering parent and before child start must recover ancestry/budget without an invented answer or duplicate continuation.
7. Same real worker's target/workspace write is denied while outbox report settles. Bind/posture output alone is insufficient. No config/policy weakening.

Record a before/after complexity and friction ledger for normal and material-turn cases: owner/store/contract count, Workflow starts, Units/assignments/rounds, lead commands/active time, human interruptions, wall-clock and provider usage/cost if observable. Use a runnable current-entry baseline with the same CASE, state capability differences; do not count dropped work as speed improvement. Old-engine comparison stays NOT RUN unless separately measured; do not revive its runtime for this gate. Every added boundary/contract must have a load-bearing purpose. A driver keeping its own queue/retries/seat status/transitions is a second sequencer even if written in Markdown; KILL before cutover. No unmeasured “light/faster/cheaper” success claim.

ACCEPT only with evidence for all seven. Missing real prerequisites must be reported; phase stays blocked. KILL/replan if final-packet review, late specialist, honest dissent, owner provenance or reconnect requires false pass/human input, duplicated work, weakened confinement, a second store or scheduler. Stop Phase 03/04, not independent original single-door work. Fix the specific contract in existing owners and re-review before continuing; no deferred foundation/MVP acceptance.

## Permanent verification and cleanup

Keep deterministic regression tests for outcome precedence/defaults, missing/changed inputs, in-flight association recovery, settled-role reuse and unchanged existing selectors/handoffs. Live vertical slice proves cognition/confinement; tests alone do not. No permanent forwarding/mock-echo/source-text/wording/model-token tests. Run affected suites once after coherent edits, record smoke evidence, update spec/changelog, remove throwaway probes/definitions. Phase 04 repeats the product scenarios through actual rendered/staged entry and owns this plan's relevant suites and final `npm test`.

Rollback coherent contracts and dependent promises together; existing stored histories remain unchanged. No evidence from this planned gate has been claimed as already run.

## Cross-plan independence and shared-writer baton

Runtime API research and the in-process prototype are independent of original single-door plan completion. Preserve that plan's read-only preconditions and real host-write-denied execution; no configuration or policy weakening is authorized. Shared `docs/specs/runner.md`, CHANGELOG, build outputs and staged release artifacts have one named writer at a time: snapshot current ownership/version, acquire the explicit writer baton, integrate landed changes, write, and hand it back. Runtime materialization cannot concurrently build/stage those artifacts with the other plan. No whole-plan blockedBy relationship is implied.
