---
type: how-to
title: How to pass a caller-supplied verdict to fgos discover/fgos plan
tags: []
source_capture_ids: [tsk-27y]
---
# How to pass a caller-supplied verdict to `fgos discover`/`fgos plan`

Use this when a live session (e.g. `fgos-coding-exploring`/`fgos-coding-planning`) has
already done the real Socratic/mode-gate reasoning itself and wants to
skip `judgeDiscovery`/`judgeDecompose`'s own blind subprocess judge for
this one call, instead of relying on the `readLockedContext` heuristic
(committed `CONTEXT.md`/plan.md `mode: tiny/small`) to trigger the skip.

## Before you start

This is Phase 2 of the Native-First Dispatch Doctrine
(`docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`):
a bare CLI verb can't call the Task tool itself, so "native" here means
the caller supplies its own verdict as data instead of the verb
re-deriving one via a context-blind spawn. The `readLockedContext`
fallback stays exactly as it was — it's still what the automated runner
sweep (`src/runner/loop.mjs`) relies on, since the new flags live only in
the CLI case blocks and structurally never reach that in-process,
headless caller.

**Precedence**: an explicit `--verdict` flag is checked first and skips
the subprocess judge outright. `readLockedContext`/plan.md's tiny-small
mode heuristic is evaluated only when no `--verdict` flag is passed —
unchanged from today's behavior in that case.

## `fgos discover` — clear/unclear verdict

```bash
fgos discover <id> --verdict clear --verify "<real, runnable command>"
```

or, for an unclear verdict:

```bash
fgos discover <id> --verdict unclear --question "<the concrete question>"
```

Omit `--verdict` entirely to run the normal `judgeDiscovery` subprocess
judge (or the `readLockedContext` trust-signal skip, if applicable).

## `fgos plan` — pass-through / need-human / decompose

```bash
fgos plan <id> --verdict pass-through --reason "<why no split needed>"
fgos plan <id> --verdict need-human --reason "<why a person must confirm>"
fgos plan <id> --verdict decompose --reason "<why this split>" \
  --children '[{"title":"...","verify":"...","kind":"bug","risk":"light","refs":[],"footprint":["path/a"],"deps":[]}]'
```

- `--reason` is required with `need-human` or `decompose` (optional with
  `pass-through`).
- `--children` is required with `decompose`: a JSON-encoded array of
  child objects, same shape `judgeDecompose` itself produces
  (`{title, verify}` required; `kind`, `risk`, `refs`, `footprint`,
  `deps` optional) — the same `normalizeChild` validation a
  model-produced verdict already goes through, never a looser path for
  caller input.

**Downstream safety gates still apply unconditionally** — heavy-risk,
blast-radius, and footprint-overlap-among-children checks fire on a
caller-supplied `decompose` verdict exactly as they do on a
model-produced one. These are synchronous JS checks (string/array
comparison), not a second model call, and they catch structural mistakes
in caller-supplied children the same way they'd catch them in judge
output — never bypassed by verdict origin.

Omit `--verdict` entirely to run the normal `judgeDecompose` subprocess
judge (or the plan.md tiny/small mode skip-and-advance heuristic, if
applicable).

## Auditability

A caller-supplied verdict logs through the exact same `addDiscovery`/
decompose-verdict-logging doors a model verdict does, with a distinct
source/text noting caller-origin — `fgos show <id>` (or its audit trail)
can tell a caller verdict apart from a model verdict after the fact, the
same way it already distinguishes the `readLockedContext` trust-signal
skip path from a real judge call.

## Why this is more robust than the file-detection heuristic

> Stronger and more robust than `tsk-1ni`'s file-detection fix
> (`readLockedContext`, fragile — proven broken by a repoRoot/worktree
> path mismatch): an explicit flag from the caller can never silently
> fail to fire the way a heuristic file-read can.

See `docs/explanation/discovery-decompose-reporoot-verify-overwrite.md`
for the repoRoot bug this complements (not replaces — `readLockedContext`
stays the fallback for callers that pass no explicit verdict).

## Watch out for: children already created via `fgos add --parent` need `pass-through`, never `decompose --children`

`tsk-1x7` found a real trap for the case where `fgos-coding-planning`'s own
split step already created real child work items (via `fgos add --parent
--footprint ...`), and the root item is now at `fgos-coding-validating`'s Gate,
deciding which decompose verdict to fire.

`decompose <id> --verdict decompose --children [...]` is for the case
where the children **don't exist yet** — its `addWork` call
(`decompose.mjs`, `addWork` loop) is unconditional, with no idempotency
or existing-children check. Firing `decompose --children [...]` for
children that were already created as real items produces two failures
at once: **duplicate** positional-id children get created fresh (the
`--children` JSON blob), while the **real, already-existing** children
get silently orphaned — their `parent` field still correctly points at
the root, but the FSM's own decompose-verdict record never references
them, since the verdict call never named them.

**The correct verdict when children already exist as real items**:
`decompose <id> --verdict pass-through --reason "<cites the already-
existing children>"` — never `--verdict decompose --children [...]`.
`pass-through` says "no split needed *by this call*" — which is true,
because the split already happened earlier in `fgos-coding-planning`'s own
step. Real precedent: `tsk-66o` (children `tsk-3c7`/`tsk-2ig` created via
`fgos add --parent` during planning) fired `pass-through` at its own
Gate, not `decompose --children` — the same pattern independently
re-derived and verified for `tsk-1sj`/`tsk-30z`/`tsk-50ic` (the parallel-
dispatch demo family kept as living evidence).

## Related

- `docs/history/caller-verdict-protocol-discover-decompose/CONTEXT.md` —
  full decision record and scout evidence.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine; this item is Phase 2 of 5 (Phase 1:
  `tsk-1ni`'s repoRoot fix; Phase 3: `tsk-53h`'s shared executor-dispatch
  helper).
- `docs/explanation/discovery-decompose-reporoot-verify-overwrite.md` —
  the repoRoot bug and verify-overwrite guard this item's caller-verdict
  path complements.
