# Conserved Dispatch And Session Contracts

```txt
Document type: Contract
Audience: Runner maintainers, dispatch and session implementation agents, conservation reviewers
Purpose: Preserve native-first dispatch, session merge isolation and operation-template contracts with their historical boundaries
Design status: Candidate conservation; no new mechanism or authority-route change
Last reviewed: 2026-10-24
Related:
- docs/platform/runner/spec.md
- docs/platform/runner/decisions/h-36d872fbb0e5.md
- docs/platform/seat-binding/spec.md
```

Owner: Runner
Status: Candidate conservation; no new mechanism. The transitional authority route remains unchanged.
Related links: [Runner spec](../spec.md), [Native-First Dispatch Doctrine](../decisions/h-36d872fbb0e5.md#0026--native-first-dispatch-doctrine-launcherroottaskcapacity), [Seat Binding](../../seat-binding/spec.md).

## Native-First Reasoning

The complete verbatim Native-First rules, their 0033 narrowing, the no-extra-judge rationale and live caller self-declaration are held in [Native-First Dispatch Doctrine](../decisions/h-36d872fbb0e5.md#0026--native-first-dispatch-doctrine-launcherroottaskcapacity). This is the governing passage, not the missing filename `executor-native-vs-cli-spawn`. Inline reasoning does not need a second judge to re-derive the live session's judgment with less context. Pure mechanical targets, different providers and explicitly CLI-shaped executors still follow the existing decide/bind door; the live caller never guesses the mechanism.

## Session Participation And Merge Isolation

“A session worktree is structurally the wrong place for a merge-into-main to happen.” This exact quoted rule survives in `bin/fgos.mjs`'s return guard; the supposedly quoted full sentence was not present in `docs/specs/runner.md` at this pin and no removal from that document was found by `git log -S`. Its current behavior is conserved here rather than pretending an old paragraph was found.

`approve` refuses every linked worktree, registered session included. `return` is different: a registered `fgos session start` worktree may perform its own progress check (`aheadCount` and verify); its `.fgos` is a symlink to the shared store. An unregistered worktree cannot return a main-source item. A session can therefore participate in work without becoming the merge-into-main checkout. See `bin/fgos.mjs` return, `src/verbs/merge/approve.mjs` and `src/runner/session.mjs`. The quoted sentence's recorded origin is [the return-guard research](../../../history/tsk-ikd-return-main-worktree-guard/RESEARCH.md), line 26; it is not the name of a test file.

## Operation Prompt Templates

The still-maintained operation-template contract is not the retired FlowDefinition engine. The exact maintained source declaration is:

```text
// dispatch/operation-prompt-templates.mjs — operation prompt-template registry,
// deterministic resolver, bounded variable renderer, and provenance tracker (Unit I04 / Phase 3),
// per docs/architect/agent-coordination/contracts/flow-definition.md and
// plans/260919-coordination-skill-harness-simplification/plan.md.
//
// Layer: infra (same layer as src/runner/dispatch/assignment.mjs).
// Reads only from filesystem during template discovery. Never performs mutations,
// never writes to session event log or store, never grants or widens authority.
//
// Discovery tiers (fixed precedence: project overrides domain, domain overrides core):
//   1. project: `<cwd>/.fgos/prompt-templates/<templateId>.{md,txt}`
//   2. domain:  `<packageRoot>/domains/<domain>/prompt-templates/<templateId>.{md,txt}`
//   3. core:    `<packageRoot>/core/prompt-templates/<templateId>.{md,txt}`
//
// Bounded variables:
// Only variables derived from validated semantic action / ExecutionContract / Assignment
// are permitted in templates:
//   - {objective}
//   - {contextRefs} (and alias {artifactRefs})
//   - {expectedOutputs}
//   - {role}
//   - {constraints} (filtered to strip internal engine stamps such as protocol-operation:*)
//   - {evidenceContract}
// Any placeholder outside this bounded set fails loudly with 'template-invalid'.
```

Discovery and rendering remain owned by `src/runner/dispatch/operation-prompt-templates.mjs`: fixed project > domain > core precedence, deterministic selection, bounded substitution from validated Assignment/ExecutionContract inputs only, no widening of authority, and template id/source/content digest recorded as provenance. Unknown variables, ambiguity and path escape fail by name. The historical FlowDefinition operation primitive supplies design provenance only; this contract does not revive FlowDefinition/CoordinationProtocol or the retired coordination engine.

## Retired Provider-Policy Pointer

The former `src/runner/dispatch/assignment-policy.mjs` citation to `docs/history/executor-policy-dispatch-seams/` never had that directory as a live authority. That module is now absent. H2a/H2b/RT1/F1 historical evidence remains evidence, not a new live policy owner. Current seat choice belongs to [Seat Binding](../../seat-binding/spec.md); no pointer patch to a deleted module is applied or invented.
