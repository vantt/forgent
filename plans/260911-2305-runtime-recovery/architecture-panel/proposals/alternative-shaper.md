Role: Alternative Shaper — category "gateway-change"
Author: agy-bwrap / gemini / gemini-3.1-pro-low / analytical
Dispatch: prompts/alternative-shaper.md -> runs/asgn_..._op_006/01
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_006/runs/01/agent-report.md`
(41 lines total — this IS the complete content, not truncated; verified
against `stdout.log`, which is also short. Noticeably less developed than
the system shaper's proposal — flagged for the critic/synthesizer, not
silently treated as equally rigorous. Not the known agy structured-wrapper
failure mode B12 [a useless one-line summary with real findings only in
unstructured text] — the content present is real and coherent, just
thinner.)

## Priors

1. Scout confirmed `runId` is completely absent from `herdr-round.mjs`;
   agent names are `workId`+timestamp.
2. The current S2 design assumes a "build" move: plumb `runId` through
   Node layers to synthesize a deterministic name.
3. Scout also proved the standalone Team-Dispatch-V1 path has no admission
   lock — Node-side fencing for it is aspirational.

## The proposal: gateway-owned identity and fencing

Instead of plumbing `runId` through Node to synthesize a deterministic
Herdr name, move fencing and identity authority to the Herdr gateway — a
"buy" move rather than a deep Node-side "build". Node continues to
dispatch with `workId` and a non-deterministic name. Add (or use) a Herdr
capability to look up active agents by `workId` and enforce fencing. On
recovery, Node queries Herdr ("return the active agent for `workId=X`")
instead of guessing a deterministic name. Herdr returns the exact agent
name and status; none found is the `absent-proven` guarantee. Herdr
becomes the single source of truth for process fencing, bypassing
Node-side `runId` plumbing entirely.

## Why it follows from evidence

The scout proved the Node-side `runId` plumbing doesn't exist and that
Team-Dispatch-V1 lacks Node-side locks. Building on the Node side needs
refactoring across multiple layers plus new locks. Moving to the gateway
leverages one boundary where the capability (lookup by `workId` + status)
can be implemented atomically — it solves both identity recovery ("ask the
gateway what it launched") and fencing (gateway enforces one active agent
per `workId`) without deep Node-side structural change.

## Load-bearing constraint

Herdr must return a definitive `absent-proven`, or uniquely return the
active agent for a `workId`. If a `workId` legitimately needs multiple
concurrently active agents Node must distinguish (e.g. parallel
speculative attempts), this boundary fails — Herdr wouldn't know which
agent belongs to which retry attempt without a more specific attempt ID
(i.e. `runId`, reintroducing the thing this proposal avoids).

## What it makes harder

Herdr becomes a thicker, more stateful dependency — no longer a dumb
process launcher but the authoritative ledger for Run/Assignment execution
state and idempotency. A future alternate gateway (e.g. a local Docker
runner) must also implement this stateful `workId` lookup/fencing.

## No-build path (mandatory sub-section)

Real, concrete consequence if neither this nor the Node-plumbing plan is
built: the system permanently leaks Herdr agents on Node crashes during
the S2 launch window. If Node crashes after calling Herdr but before
persisting the timestamped name, the new Node process cannot find that
agent — it launches a *second* agent for the same `workId`, doubling cost.
The first agent runs indefinitely as a zombie until a global timeout,
wasting compute and risking a result-write race with the second agent.

## First reversible step

Implement the Herdr `workId` lookup endpoint, used in `herdr-round.mjs`
**only** on the recovery path (when a crash is suspected). If the lookup
finds the leaked timestamped agent, Node adopts it. Zero changes to
Node-side `runId` plumbing and zero changes to the happy-path launch
sequence — the gateway capability is tested before being made the primary
fencing mechanism.

## Evidence vs. assumption

Evidence: scout confirms `runId` absent from `herdr-round.mjs`, names use
`workId`+timestamp; scout confirms Team-Dispatch-V1 lacks locks.
Assumption: Herdr can be easily modified to index/query agents by
`workId`; `workId` is sufficient to uniquely identify the intended Work
across crashes without a specific attempt counter (this assumption is the
one the load-bearing constraint above depends on, and the one the system
shaper's proposal treats as false by design — a real, unresolved
disagreement for the critic to attack).

## Falsification criteria

1. If Herdr's internal architecture doesn't store/index `workId` and
   adding that index needs a massive database migration, this proposal is
   falsified (the gateway change is not cheap).
2. If the system explicitly requires launching multiple concurrent,
   independent attempts for the same `workId` (speculative execution),
   `workId` lookup returns multiple active agents, falsifying the premise
   that gateway-side `workId` fencing is sufficient alone.
