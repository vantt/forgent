# Visibility And Herdr

Document type: Architecture
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: visibility versus runtime truth

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
says the worker did something, and a round ends when that file appears —
never when the transport says it might have.

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
a time, held by a pid-and-token lease with an expiry; any number of observers
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
This successor is not implemented by the current visibility module.

Visibility adapters should consume canonical Run/RunResult state where possible.
Interactive transport remains useful, but correctness must survive detached,
headless, retried, or partially failed executions.

The original stabilization discussion is retained in
[history](../history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).
