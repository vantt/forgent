---
title: "Config binding and truthful current advisory interface"
status: done
dependencies: [0]
requiresReview: true
---

# Phase 01 — Original H1a binding cleanup, not advisory completion

**Current execution evidence:** this minimal binding/truth phase is complete; see [Phase01 execution/review](reports/phase-01-execution.md) and [full-plan sync](reports/final-plan-sync.md). Advisory product completion remains separate and pending. The requirements and implementation steps below retain the accepted planning contract.

## Context and boundary

Read [plan.md](plan.md), Phase00 baseline, runner spec/bind and current canonical skill/workflow. This phase owns removal of infrastructure duplication and inaccurate retired-runtime commands. Expanded cognitive/runtime migration is [separate advisory plan](../261006-1408-advisory-capability-completion/plan.md), especially its [owner challenges](../261006-1408-advisory-capability-completion/reports/owner-challenges-and-rationale.md). Historical revision boundary: neither document update itself authorized implementation; subsequent owner-authorized execution is linked above.

## Requirements

- Executor/provider/model/invocation selection stays in config + bind. Remove active hardcoded retired roster/model/API promises; current skill points to actual supported Workflow door, not obsolete coordination/actors/specialist-slot calls.
- Retain role meaning and human/advisory bounds as doctrine. Explicitly disclose which specialist/dialogue/per-seat/final-packet-review/resume behaviors are not yet supported end to end; do not advertise migration completion or delete cognitive goals because implementation is absent.
- Minimal skill truth/config cleanup only. Do not add roleTasks forwarding, Workflow definition/contextRefs fields, outcome routing, resume/capture repair, new finite advisory definitions or scheduler here. Those belong new advisory plan.
- Required read-only posture remains fail-closed. Inspect existing config/capability policy via bind/resolvePosture; missing confinement is a real prerequisite, not permission to run mutating/default fallback. Do not silently alter config or claim live denial from resolver output.

## Files and implementation steps

1. Before code read relevant spec, prior migration commits 42e37adf7/2180b4e72 and current doctrine; run impact if symbols change. Existing canonical `core/skills/fgos-architecture-panel/SKILL.md` is the owned source, not generated copies.
2. Remove infrastructure roster/derived-model pinning and retired command guidance. Reuse current shared executor-dispatch fallback; link to existing registered architecture-advisory Workflow. Preserve advice-only/no fabricated roles or human input. Mark limitations once, not compatibility shims or pseudo-implemented fallbacks.
3. Keep unchanged current Workflow/runtime contract. If apparently minimal cleanup requires functional migration, name missing contract and hand it to separate plan; do not drag new plan into this phase acceptance.
4. Observe actual supported start/status path in a safe read-only smoke, check config-derived provenance and honest refusal if unavailable; do not run unsafe fallback merely for a green check. Bound smoke proves interface/binding only, not all advisor goals/quality. Record commands/IDs and evidence.
5. Temporary source scans find no active retired pin/command in owned skill; historical doctrine is allowed and labelled. Use existing consumer behavior tests if actual API behavior changes; no permanent source-wording/model-token/roster/mock forwarding tests.
6. Update relevant runner/distribution statement and CHANGELOG for user-visible cleanup using one writer baton. Phase02 owns final header regeneration. Finish/read-only smoke and relevant checks before landing.

## Exit and shared source barrier

Actual skill describes current executable door and limitations truthfully; routing is config/bind-owned; cognitive goals/history retained without false runtime promises; evidence for supported path/refusal recorded. This is sufficient for original Phase02/doctor/hygiene to proceed, not advisory completion.

Separate advisory Phase03 MUST incorporate this landed skill cleanup before full source rewrite. Advisory Phase01/02 research/early runtime work need not await this whole plan. Serialize shared skill/spec/changelog/render/build writers; record consumed commits. If advisory rewrite already owns skill, coordinate order rather than overwrite. No whole-plan blocks/blockedBy.

## Risks and rollback

Deleting a roster must not delete role doctrine; pointing at current Workflow must not falsely promise unsupported features. Policy smoke is not live sandbox proof. Revert minimal source/spec/changelog coherently; regenerate through Phase02 existing door. No stored run history mutation or new runtime implementation in this phase.
