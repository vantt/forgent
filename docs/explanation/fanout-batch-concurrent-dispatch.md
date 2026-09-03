---
authoritative_for: fanoutBatchExecutorCli running batch candidates sequentially despite being named fanout, Promise.allSettled fix, confirmed live during tsk-3ti's own 10-child batch
---

# "Fanout" that fanned out one item at a time — a sequential `for` loop pretending to be parallel

`tsk-5v3` fixed a real misnomer bug: `fanoutBatchExecutorCli`
(`src/runner/dispatch/cli.mjs`) dispatched every candidate in a batch
with a plain `for (const candidateId of batchToRun) { ... await
executeExecutorCli(...) ... }` — one at a time, never
`Promise.all`/`allSettled` — despite the whole mechanism being named
"fanout."

## Confirmed live, not theoretical

Each out-of-process dispatch (an `agy` LLM call plus a full `npm test`
re-verify) took 2-10+ minutes. A 5-item batch ran nose-to-tail instead of
concurrently, defeating the entire point of "fanout" and directly driving
how slow/cumbersome the dispatch pipeline felt in practice. Confirmed by
live process observation during the real implementation of
[`tsk-3ti`'s own 10 children](core-foundation-domain-boundary.md): only a
single `agy` process ever ran at any one time, even though the batch
being dispatched had 5 candidates ready simultaneously.

## What shipped

The sequential loop body became an async function mapped over
`batchToRun`, fired together via `Promise.allSettled` — genuine
concurrent dispatch, still respecting the existing slot-gating
(`execution.free`) that trims the batch *before* firing. Once a batch is
already trimmed to what the available slots allow, every candidate in it
now fires at the same time instead of queuing behind each other. A new
regression test proves real overlap between dispatches, and both mirrored
copies of `wave-dispatch-mechanics.md`
(`.agents/skills/fgos-fanout/references/` and
`plugins/fgOS/skills/fgos-fanout/references/`) had their now-stale
sequential-loop sentence corrected to match.

## Not the same gap as the adjacent background-execution item

Distinct from [`tsk-vuj`'s own background-execution and orphan-recovery
work](fanout-batch-background-execution-and-orphan-recovery.md) — that
item is about how a fanned-out dispatch survives and gets reconciled
across a session boundary; this item is about whether the dispatches
inside one batch actually run at the same time in the first place. Both
sit in the same `fanoutBatchExecutorCli` area but address different
axes of the same "fanout" mechanism.

## A follow-up already exists

A later item (`tsk-2ewi`) picked up further per-child sync concerns
(spawn/`listWork`/attestation ordering) in this same concurrent-dispatch
shape — outside this item's own scope, not detailed here.
