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
```

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

Visibility adapters should consume canonical Run/RunResult state where possible.
Interactive transport remains useful, but correctness must survive detached,
headless, retried, or partially failed executions.

The original stabilization discussion is retained in
[history](../history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md).
