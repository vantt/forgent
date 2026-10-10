# Visibility And Herdr

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/visibility-and-herdr.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Purpose | Current contract/invariant | src/runner/dispatch/visibility-session.mjs:1-27 (visibility vs run.json vs result.json) |
| Invariant | Current contract/invariant | visibility-session.mjs:3-13; herdr-round.mjs:21-24 (completion is the worker-written outbox/result-<round>.json, never agent_status); run-result.mjs:1276-1325 |
| Session Binding | Current contract/invariant | visibility-session.mjs:3-13 (visibility.json volatile vs run.json.status), :59 RUN_STATUSES, :215-232 classifyRunOutcome settled/died/unknown, unknown never a retry |
| Observer And Actor | Mixed implementation and proposal; no blanket implementation claim | markDetached visibility-session.mjs:129-133 leaves run.json untouched (live); the 'pid-and-token lease with expiry' is explicitly removed: visibility-session.mjs:136-149; real exclusion is run-lock.mjs acquireRunControl :306 |
| Pane Retention | Current contract/invariant | herdr-round.mjs:26-28 (failed round keeps pane), :1282 (setsid descendant survives; never reported cancelled); liveness.mjs:89-98 paneFateFor keep/keep-always for provider-limit pause |
| Allowed Uses | Current contract/invariant | Read-only visibility uses: visibility-session.mjs findAgentBinding :150-, markDetached; no write to result/evidence |
| Stability Direction | Mixed implementation and proposal; no blanket implementation claim | Control-epoch fencing/launch/observe/reconcile implemented (run-lock.mjs:306-412, herdr-reconcile.mjs, recovery-planner.mjs); writable takeover (workspace-grant issuer, worker-tree termination proof) absent (git grep workspace-grant src = none) and parked |

## Purpose

Herdr exposes interactive processes and terminal activity so operators can
observe and diagnose execution. It is not a lifecycle engine, result store, or
evidence authority.

## Invariant

```txt
Herdr shows the Run.
Runtime records settle the Run.
Evidence supports the outcome.
Work verbs own lifecycle.
A receipt is an artifact the receiver wrote.
```

The last line is the one that had to be learned. Transport status is never
proof of work: a message accepted is not a message acted on, and an agent
reported idle is not an agent finished. Only a file the worker itself wrote
supports the worker claim. A receipt-less exit, deadline or corrupt record must become an explicit failure/unknown result, never success inferred from transport (herdr-round.mjs:21-24; assignment-runner.mjs:2471-2540).

## Session Binding

A Run records where its worker is, separately from whether the Run is still
going, because those are different questions with different lifetimes:

- `visibility.json` (in the run directory) holds the volatile binding — pane
  id, agent session, which process is driving, when it was last seen. Every
  binding is written before it is used, so a dispatch that dies mid-flight
  still leaves enough behind to find what it started. It is diagnostic, never
  evidence.
- `run.json.status` says only whether the run is still going. `settled` means
  it reached its end and produced a RunResult; it says nothing about whether
  the work succeeded, which stays in `result.json`.

Reconciling a run nobody was left to finish gives three answers and only
three: `settled` when the worker's own result file is on disk (which outranks
a missing process — a worker that wrote its result and exited did the work),
`died` when the worker is provably gone and left nothing, and `unknown` when
neither can be established. `unknown` is deliberately neither a success nor an
automatic retry.

## Observer And Actor

Observing and contacting are separate capabilities. One actor drives a Run at
a time, fenced by run-control epoch and token, not the removed visibility actor lease; any number of observers
read alongside it, needing no permission and holding no lease, because they
change nothing. Losing the gateway or the person watching moves visibility to
`detached` and leaves `run.json` untouched — a lost observer is not a dead
worker.

## Pane Retention

A pane is closed only when its round settled. Every failure keeps its pane,
because that screen is the only place the reason is still legible; a run
paused on a provider limit keeps its pane even under a caller that closes
everything, since the reset time is written nowhere else. Closing a pane is
not cancelling a worker — measured, the foreground process dies and a
`setsid` descendant survives it — so no outcome here is ever reported as
cancelled.

## Allowed Uses

- inspect live process/pane state;
- help an operator diagnose stalls or prompts;
- correlate a visible session with Run identifiers;
- expose runtime metadata and result/evidence references;
- support manual intervention without rewriting recorded truth.

## Forbidden Inferences

- quiet pane means completion;
- visible success text means verified RunResult;
- process exit alone means semantic success;
- pane ownership means Work ownership;
- terminal transcript replaces structured result artifacts;
- UI status can approve or merge Work.

## Stability Direction

Proposed successor: [RunHandle And Recovery Material](run-handle.md), under
[Runtime Recovery Design](runtime-recovery-design.md), replaces the binding
authority with a versioned handle store for new Runs. The existing visibility
file remains the legacy profile or a one-way compatibility projection; the two
must not become independent writers. The proposal requires explicit proof of
worker-tree termination or revoked write access before writable takeover:
closing a pane alone still does not prove that its descendants stopped.
This successor's non-writable-takeover portion (control-epoch fencing,
launch/observe/reconcile) is now implemented, per the header above; the
writable-takeover portion it also proposes (workspace-grant issuer,
worker-tree termination proof) remains genuinely not implemented — that
part stays parked by design (P06, deferred).

Visibility adapters should consume canonical Run/RunResult state where possible.
Interactive transport remains useful, but correctness must survive detached,
headless, retried, or partially failed executions.

The original stabilization discussion is retained in
[history](../history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).

