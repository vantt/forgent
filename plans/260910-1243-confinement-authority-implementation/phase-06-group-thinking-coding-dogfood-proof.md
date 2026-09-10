# Phase 06 — Group-Thinking Coding Dogfood Proof

Depends on: Phase 05 closed.

## Objective

Prove the mechanism on the product that motivated it: Work-independent
group-thinking coding coordination, cross-provider dispatch, confinement
attestation, fix-round behavior, replayability, and no Work component touch.

## Requirements

- R1: Run a real plan-loop cell using
  `core.coordination-protocol.standalone-master-coordination-loop` from a linked
  worktree, not the main checkout.
- R2: The request must use at least three actor bindings with explicit
  `targetActorId`, with at least two distinct real providers among Doer,
  Reviewer, Red-Team, and Fixer.
- R3: At least one Doer or Fixer route uses `workspace-write` required policy,
  and at least one Reviewer/Red-Team route uses `host-write-denied` required
  policy.
- R4: Force or select a small real fix round so the proof includes authorize,
  revise, reviewer recheck, red-team recheck, dispositions, and final close.
- R5: Capture:
  `fgos coordination chain <track> --json`,
  `fgos coordination show <coordinationId> --json`,
  attestation refs/digests,
  changed paths,
  tests,
  and grep proof that no Work lifecycle command/state changed because of the
  proof.
- R6: Do not run live proof against a half-migrated local config without first
  recording exact config and doctor output.
- R7: If live provider availability blocks a provider, record the blocker and run
  the deterministic fake-provider proof, then leave live proof as the only
  non-closed gate for P07.

## Files

May touch:

- request files and proof reports under this plan directory
- docs/how-to or docs/architect verification pages if the proof becomes
  canonical documentation
- `CHANGELOG.md` if a user-facing bug is found/fixed during proof

Do not touch:

- Work state files intentionally
- group-thinking FlowDefinition semantics unless a real protocol bug is found
  and opened as its own cell

## Verification

- Replay reconstructs the session from event logs.
- Attestations show `enforced` for required supported routes.
- Reviewer and Red-Team reports independently approve after fix round.
- Full suite runs after proof-related fixes, or a blocker is recorded.
- Capability annotation for this cell: `code:test`.

