# Phase 04 - MVP5 Usable Standalone Live Proof

## Objective

Prove the standalone Master Coordination loop can be used end to end through the
runtime/surface path, without Work/git/repo mutation and without relying on chat
history.

## Requirements

- **R1 Live scenario.** Choose a small non-mutating plan/artifact review scenario
  that exercises candidate production, independent review, independent red-team,
  driver disposition, authorized revision, recheck, and final disposition.
- **R2 Normal user path.** Start the session through the MVP4 surface or the
  public coordination request-file path if the surface intentionally remains CLI
  only.
- **R3 Evidence path.** Every worker output is an Assignment/Run/RunResult with
  evidence/artifact refs. Herdr/process visibility, if any, is not semantic
  evidence.
- **R4 Resume.** Interrupt or simulate restart after at least one authorization
  or assignment creation, then resume without duplicate Assignment,
  reconsumed invocation key, lost disposition, or hidden context leakage.
- **R5 Negative proof battery.** Prove rejection of unauthorized optional
  operation, hidden context ref, reused invocation key, terminal authorization,
  and over-cap round.
- **R6 No delivery mutation.** Record proof that no Work status/stage/claim/
  return, approval, merge, branch management, tracked source mutation, or
  worktree delivery mutation occurs as part of the standalone fixture's semantic
  run. `.fgos/coordination` session state and explicit verification artifacts are
  allowed evidence, not delivery mutation.
- **R7 User-facing close.** `coordination show` or equivalent output lets a user
  see final disposition, unresolved findings, artifacts, and whether the session
  is completed/partial/failed/cancelled.
- **R8 Dogfood handoff.** Produce a concrete handoff showing how MVP6+ can be
  started through the new runtime/surface path: input shape, command/surface,
  expected roles, expected artifacts, resume command, and what still remains
  outside coordination authority for source mutation.

## Files

Expected source/test/docs:

- `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/index.md`
- `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/current-cell.md`
- `docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/proofs/`
- `test/runner/coordination*.test.mjs`
- `test/verbs/coordination*.test.mjs`
- `docs/architect/proposals/step-09-group-thinking-substrate.md`
- `docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md`
- `plans/260903-1049-step09-mvp3-to-mvp5/reports/` or the verification proof
  directory for the MVP6+ dogfood handoff
- `CHANGELOG.md` if the user-facing surface changed in Phase 02

Runtime/source files should change only if the live proof exposes a real bug in
already-implemented MVP3/MVP4 behavior.

## Tests First

Add or extend integration/live-proof tests for:

- full fixture path with deterministic/mock workers where possible;
- real CLI/request-file smoke path;
- resume/idempotency;
- negative proof battery;
- final show output includes recheck/disposition/artifact refs.
- dogfood handoff command/request validates without using the manual Master
  Prompt as runtime logic.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination*.test.mjs' \
  'test/verbs/coordination*.test.mjs'
```

Run the full test command before closing this phase.

## Proofs And Exit

- Verification index links every command summary, session id, assignment id,
  run/result id, artifact ref, authorization id, invocation key, disposition
  event, and final status.
- The same proof can be understood by a stranger agent with no chat history.
- The proof demonstrates actual usability, not merely schema validation.
- Final docs mark MVP5 complete and list MVP6 visibility windows, MVP7
  aggregation rules, MVP8 deliberation memory, and MVP9 dynamic specialist
  pull-in as future expansion, not hidden prerequisites.
- The proof leaves an immediately usable MVP6+ coordination handoff that starts
  from the runtime/surface path. If MVP6+ implementation needs source mutation,
  the handoff names that mutation authority as external/deferred rather than
  silently assigning it to Agent Coordination.

## Risks / Rollback

Risk: allowing the live proof to become a coding-domain implementation exercise.
Keep the scenario non-mutating and artifact-local. Risk: treating a happy-path
run as sufficient. MVP5 requires the negative proof battery and resume proof,
otherwise the substrate is not usable.
