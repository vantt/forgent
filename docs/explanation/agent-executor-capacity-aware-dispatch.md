# Why capacity-aware backend dispatch exists

Before this cluster, forgent's runner dispatched every unit of work
through one hardcoded path: whatever `executor`/`executors.<tier>` a
config declared, always the same backend regardless of what kind of work
was actually being done. Adding a cheaper or better-suited backend for
one specific job meant editing dispatch code, not config.

The goal: unify how forgent dispatches a "capacity" (an LLM/tool/composite
unit of work) to the right backend/model/tool-scope, at the cheapest cost
for adequate quality, through one config point — `capacities.<id>` in
`.fgos-runner.json` — instead of per-skill hardcoded logic.

## The four pieces, and what each one actually proved

- **`tsk-62v`** — the foundation. Generalized `resolveExecutorConfig` to
  resolve `capacities.<capacityId>` ahead of `executors.<tier>` ahead of
  the global `executor`, reusing `fgos tool registry`'s own `kind`
  vocabulary (`cli`/`binary`/`mcp`/`skill`/`http`, plus `task` for
  in-session dispatch). Everything else in this cluster builds on this
  resolution.
- **`tsk-slq`** — a platform-agnostic canonical root for forgent's own
  agent definitions (`.fgos/agents/` projected into `.claude/agents/`),
  needed so a capacity's own backend could be described the same way
  regardless of which assistant platform is running it.
- **`tsk-5l2`** — the first real, end-to-end proof: wired
  `fgos-submit-assist`'s tier/kind/risk classification step through the
  mechanism, actually dispatching to a cheaper external model
  (`submit-assist-classify`, `kind: "cli"`, `command: "agy"`) instead of
  always reasoning inline. Confirmed the whole resolve → spawn → fallback
  path works on a real, non-trivial consumer, not just a unit test.
- **`tsk-g18`** — fixed a concrete problem the design surfaced along the
  way: `judgeDiscovery`/`judgeDecompose`'s scout output was never
  persisted or reused across calls, and the `judge` tier was being abused
  as an ad hoc permission-scope carrier instead of a real tier.

## The gap the design left open, and what closed it

`tsk-5l2`'s own scope explicitly flagged an unresolved gap while building
the first real cross-provider capacity: "this is the FIRST real capacity
sending prompt content... to a third-party model; no sensitiveData/
governance field exists yet to mark which capacities are safe to route
outside Claude." `tsk-32n` closed this after the cluster's own children
were already done: `capacities.<id>.allowCrossProvider`, restrictive by
default, checked against the capacity's final resolved command (not its
declared `kind`, not the spoofable `provider` alias) — see
`docs/reference/capacity-cross-provider-governance.md`.

## A real process gap this cluster's own closure surfaced

Closing this root out required resyncing `main` with `fgw/tsk-64p` a
second time — `tsk-g18` and `tsk-5l2` landed on the root's branch *after*
an earlier sync had already happened, and nothing re-synced `main`
afterward. See `docs/how-to/close-out-a-decomposed-root-item-after-all-
children-are-done.md`'s own documented trap for the full story; the fix
is a repeatable one (re-run the sync merge), not a one-time patch.

## Full design record

`plans/reports/distill-consult-260731-1733-agent-executor-backend-
dispatch-report.md` (prior-art consult), `plans/reports/agent-executor-
design-260731-1758-capacity-backend-dispatch-proposal-report.md` (the
design itself), `plans/reports/agent-executor-design-260801-1159-
synthesis-goal-constraints-gaps-report.md` (goal/constraints/known-gaps
synthesis).
