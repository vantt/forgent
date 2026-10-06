# Code-Panel Request Pack

Use one request below per cell. The caller must substitute `<slug>` and
`<worktree>` and open the private worktree before dispatch. Do not combine two
cells in one panel: independent reviewer/red-team evidence is per cell.

## Common Guard

Every request must begin with:

```text
You are implementing one isolated runtime-recovery cell in a private
code-panel worktree. Verify `git rev-parse --show-toplevel` is `<worktree>` and
the branch is `code-panel--<slug>` before editing. Read the plan, the cell's
phase brief, docs/specs/reading-map.md and the named area spec. Edit only the
leased files. Run the listed focused tests. Commit the change on this branch.
Return the commit, test output, reviewer findings, red-team findings, residual
risks and the exact next cell that may proceed. Do not claim unsupported
capabilities.
```

## P00

```text
Run the S0 baseline cell. Observe current retry/blocked/paused-limit mapping,
Herdr resend behavior, close-after-steps, lock reclaim, replay terminal
absorption and BL1 premature-close. Store reproducible fixture evidence. Do not
edit source behavior or enable recovery. Exit only with focused tests green and
known behavior changes labeled.
```

## P01

```text
Implement Run admission and fencing for Assignment-owned Runs. Add atomic
admission, schema-2 exact retry declaration and separate per-Run control
epoch/token while preserving schema-1 callers. Prove one winner under
concurrent admission, exact nextRunId after declaration crash, stale-token
refusal, distinct acquisitions on one Run and live/dead lock distinction.
Do not touch Herdr lifecycle or continuation semantics.
```

## P02L

```text
Implement the Assignment-owned default cli-spawn recovery profile. Add the
small Node supervisor defined by
`plans/260911-2305-runtime-recovery/phase-designs/cli-spawn-local-contract.md`.
It passes `assignmentLaunchContext` through Confinement Authority, runs exactly
the resulting launch envelope, self-publishes process incarnation, persists
protected stdout/stderr capture and a protected adapter receipt, and keeps
timeout/maxBuffer/chunk behavior. Persist the pre-launch
evaluator baseline before submission and make confinement finalization
recoverable. Use a worker PGID distinct from the supervisor; only the current
controller records outcome and settlement. Fresh pending submits once; resumed
pending ambiguity parks. Preserve legacy ad-hoc cli-spawn behavior. Recovered
destructive cancel and shared-cwd mutating takeover remain typed unsupported
in this cell.
```

## P02H

```text
Implement the Herdr S2 extension using the shared Authority prepared-invocation
seam in
`plans/260911-2305-runtime-recovery/phase-designs/confinement-adapter-contract.md`
and the Herdr profile in
`plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md`.
Thread durable runId only for Assignment-owned dispatch. Confinement Authority
prepares the worker command; Herdr must start exactly that prepared command, including bwrap argv when
required confinement applies; add or prove the arbitrary worker-command seam if
today's Herdr primitive only supports provider kind plus flags. A deterministic Herdr
name is a lookup aid, never authority; agentSession is conversation correlation
and control requires an adapter-proven resource incarnation. Completion remains
outbox result plus adapter receipt, never Herdr status alone. Allow one first
submit only from the fresh not-requested-to-pending transition; all resumed
pending ambiguity reconciles or parks. Prove worker-command suffix/env digest,
same-conversation/new-process mismatch, crash before binding, no-resurrection,
F-b observation and F-f single submit. Preserve legacy naming outside
Assignment-owned dispatch.
```

## P03

```text
Implement governed fallback/effect guarantees. Preserve the existing ladder;
pass fallback provenance through the compiler. Make repeatMode explicit in
review/red-team YAML. Derive provider allowlist from DispatchPlan/providerModel;
unlisted sinks park. Prove network allow -> park, undeclared sink -> park and
unsupported filtered -> park. A filtered-positive path requires real adapter
coverage proof. Unknown delivery/effects never blind-retry.
```

## P04

```text
Create pure read evaluators for legalNext, authorization, visibility and
completion without editing existing write doors. Prove deterministic fixture
parity and absence of state/adapter imports. P05S owns write-door integration.
```

## P05

```text
Implement the deterministic standalone-Run recovery planner and public
`fgos dispatch recover <runId>` door beside `dispatch show-run`. Recover
executes exactly one planner-selected action and never invokes close-after-steps
unconditionally or appends a coordination-session event. Apply must echo
expected snapshot, control epoch and a single-use action key. Missing authority
returns typed needs-input/refuse. Prove pure planning, stable ordering,
stale-plan refusal, apply idempotency and schema-1 behavior unchanged.
```

## P05S

```text
Implement `fgos coordination recover <coordinationId>` through the existing
CoordinationSession write door. Reuse P04 evaluators; require snapshot, event
sequence, Run control epoch and single-use action key on apply. Enforce current
driver, collect/link only the exact eligible Run, never close implicitly and
keep X11 premature-close hazard visible. Do not implement driver replacement
or continuation transfer.
```

## P06

```text
Implement the optional writable profile only after P02L, P02H and P04 are green.
Add workspace-grant issuer, quiescence/coverage and inherited-lineage
evaluation. Default behavior remains park. Prove workspace collision refusal,
unknown writer park, no discarded edits and X04/X05. Do not advertise writable
takeover if any proof is missing.
```

## P07

```text
Implement one protocol-declared continuation after the engine backlog and B01
contract decision are complete. Terminal parents refuse transfer in the first
profile. Add prepared/gated-child/committed transaction, fresh authority,
single-use grant and driver-replaced with current operator authorization and
anti-replay invocationKey. Prove X08, C-f, C-g and replay parity.
```

## P08

```text
Run closeout only after every preceding cell has a green handoff. Execute npm
test, capability matrix, setup/doctor checks and documentation/link audit. Any
capability without executable proof must be marked unsupported and return typed
park/refuse/needs-input. Do not widen scope during closeout.
```

## Coordinator Rules

- Dispatch P01/P04 in parallel only after P00 and only with disjoint worktrees.
- Dispatch P03/P05 in parallel after their dependencies; merge only through a
  recheck panel.
- Never dispatch P06/P07 automatically from schema compilation.
- Read `git log`, changed files and real test output from each panel worktree;
  panel narration is not evidence.
- A reviewer finding that changes a contract reopens the cell and blocks its
  dependents until a new panel round closes it.
