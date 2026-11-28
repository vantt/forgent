# Owner answer q-o7ugiwqcia: stop ends the attempt's scope, then adopts

Answered 2026-11-28T07:19Z (owner via secretary): option A.

Effect on phase 1: on an explicit `fgos session stop`, when the attempt's run supervisor is proven dead by pid and
start identity, a new run-supervisor op stops that attempt's own systemd scope (the `failureDomain.unit` named in
`supervisor-binding.json`, so gate and agent end), waits, adopts the run dir (`closed.json`), and only then does Node
retire the now-idle pane. An inherited (non-scope) domain answers a named refusal, never a plain kill.

Allowed: widen this plan's footprint to the run-supervisor op, its execution route and route contract, and build the
op with tests, then rerun the live check (acceptance 4).

Not allowed: automatic stops without an explicit session stop, re-attaching a supervisor, killing anything outside the
named attempt's own scope, or changing adopt (`packages/run-supervisor/rust/src/adopt.rs`).

Why the plan's first design fell short (live check 2026-11-28, `reports/live-stop.md` on branch
`dead-supervisor-head-stop/p01`): adopt by design never ends a live domain, so with the gate and agent still running in
scope `fgos-run-<attemptId>` no `closed.json` was published and the pane retire was refused `placement-unknown`.
