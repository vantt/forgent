---
framework: diataxis
mode: explanation
---
# Why executor-aware backend dispatch exists

Before this cluster, forgent's runner dispatched every unit of work
through one hardcoded path: whatever `executor`/`executors.<tier>` a
config declared, always the same backend regardless of what kind of work
was actually being done. Adding a cheaper or better-suited backend for
one specific job meant editing dispatch code, not config.

The goal: unify how forgent dispatches a "executor" (an LLM/tool/composite
unit of work) to the right backend/model/tool-scope, at the cheapest cost
for adequate quality, through one config point — `executors.<id>` in
`.fgos/config.json`'s `runner` section (the sole config source since
`tsk-5hv` D1 retired the legacy fallback) — instead of per-skill hardcoded logic.

## The four pieces, and what each one actually proved

- **`tsk-62v`** — the foundation. Generalized `resolveExecutorConfig` to
  resolve `executors.<executorId>` ahead of `executors.<tier>` ahead of
  the global `executor`, reusing `fgos tool registry`'s own `kind`
  vocabulary (`cli`/`binary`/`mcp`/`skill`/`http`, plus `task` for
  in-session dispatch). Everything else in this cluster builds on this
  resolution.
- **`tsk-slq`** — a platform-agnostic canonical root for forgent's own
  agent definitions (`.fgos/agents/` projected into `.claude/agents/`),
  needed so a executor's own backend could be described the same way
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
the first real cross-provider executor: "this is the FIRST real executor
sending prompt content... to a third-party model; no sensitiveData/
governance field exists yet to mark which executors are safe to route
outside Claude." `tsk-32n` closed this after the cluster's own children
were already done: `executors.<id>.allowCrossProvider`, restrictive by
default, checked against the executor's final resolved command (not its
declared `kind`, not the spoofable `provider` alias) — see
`docs/reference/executor-cross-provider-governance.md`.

## Naming a Claude Code agent instead of a raw command (`tsk-3sw`)

A `kind:"task"` executor can now declare only `agentType` (a
`.claude/agents/<name>.md` agent definition name) instead of its own
`command`/`args` — `resolveExecutorConfig` synthesizes a real `claude
--agent <agentType>` invocation from the resolved global `executor`'s own
args template (never a hardcoded literal), stripping the `--model`
placeholder so the named agent definition's own pinned model wins over the
work item's `tier`. Claude-only for now (`judge-discovery`'s own
`command`/`args`-declaring shape is unaffected and still takes precedence
whenever a executor names both); multi-provider `agentType` support
(`agy`/Codex each have a structurally different agent-dispatch shape of
their own) is `tsk-53h`'s separate, later scope.

## A real process gap this cluster's own closure surfaced

Closing this root out required resyncing `main` with `fgw/tsk-64p` a
second time — `tsk-g18` and `tsk-5l2` landed on the root's branch *after*
an earlier sync had already happened, and nothing re-synced `main`
afterward. See `docs/how-to/close-out-a-decomposed-root-item-after-all-
children-are-done.md`'s own documented trap for the full story; the fix
is a repeatable one (re-run the sync merge), not a one-time patch.

## Milestone closure (`tsk-5hh`)

`tsk-5hh` is the milestone item tracking `tsk-slq` + `tsk-5l2` (two of the
four pieces above) as its `targets`, verified by both showing
`status: done`. It closed with one real friction: a `goal-check` failure
on branch `fgw/tsk-5hh` (exit 2, `errorClass: verify-miss`) — the
milestone's own verify command re-ran before both targets had actually
landed on that branch, a timing miss rather than anything wrong with the
underlying mechanism; the milestone passed on the next check once both
targets were really `done`.

## Second milestone closure (`tsk-45a`)

`tsk-45a` tracks the follow-on milestone — "executor-executor safe for
real cross-provider use" — with `targets: [tsk-49o, tsk-32n, tsk-418]`,
verified by `tsk-32n` + `tsk-418` both showing `status: done` (`tsk-49o`
carries no captured outcome of its own — closed without one, not part of
this verify command). `tsk-32n` is the `allowCrossProvider` governance
field documented at `docs/reference/executor-cross-provider-governance.md`
(see "The gap the design left open" above); `tsk-418` generalized the
judge-retry helper for any executor dispatch
(`docs/how-to/generalize-a-judge-retry-helper-for-any-executor-dispatch.md`).
No friction recorded against this milestone's own closure.

## Full design record

`plans/reports/distill-consult-260731-1733-agent-executor-backend-
dispatch-report.md` (prior-art consult), `plans/reports/agent-executor-
design-260731-1758-executor-backend-dispatch-proposal-report.md` (the
design itself), `plans/reports/agent-executor-design-260801-1159-
synthesis-goal-constraints-gaps-report.md` (goal/constraints/known-gaps
synthesis).
