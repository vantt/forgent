---
type: reference
title: `fgos show <id>` output fields
tags: []
timestamp: 2026-07-30T08:44:32.944Z
source_capture_ids: [tsk-2fw]
framework: diataxis
mode: reference
---

# `fgos show <id>` output fields

`fgos show <id> [--json]` (`bin/fgos.mjs`, backed by `/fgOS:show`) is a
pure read — same request class as `list`/`ready`/`check`: never appends an
event, never touches `state.json`. Unlike `list --id`, which only scopes
the `work` map and leaves every other per-item log global, `show` scopes
**every** per-item log to the one id given — the full-detail view of a
single task in one call.

## Fields

| Field | Source | Shape when present | Shape when empty |
|---|---|---|---|
| `work` | `rawView.work[id]` | the full work record | n/a — missing id is rejected outright, see below |
| `discovery` | `rawView.discovery[id]` | array of discovery entries | `[]` |
| `decisions` | `rawView.decisionsById[id]` | array of decision entries | `[]` |
| `gates` | `rawView.gates[id]` | `{ ask, answer, ... }` | `null` |
| `outcome` | `collectOutcomeEntry(id, ...)` | `{ id, predicted, actual, docType, docPath }` | `{ id, predicted: null, actual: null, docType: null, docPath: null }` |
| `friction` | `collectFrictionData(rawView, id)` | `{ count, byLayer, recent }` | `null` |
| `settlement` | `collectSettlementData(rawView, id)` | settlement record | `null` |
| `learning` | `collectLearningData(rawView, id)` | learning record | `null` |

`show` reuses `check`'s own per-item collectors
(`collectOutcomeEntry`/`collectFrictionData`/`collectSettlementData`/
`collectLearningData`, `bin/fgos.mjs:335-440`) for the last four fields,
so `show` and `check` render an identical shape for identical underlying
data rather than each reimplementing the slice.

## Behavior

- **Unknown id** — rejected as validation, exit 4:
  `show: work "<id>" not found.` (same shape as `list --id`'s miss).
- **No id given** — rejected as validation, exit 4.
- **`--json`** — a byte-identical no-op: output matches plain `show`
  exactly except for `generated_at`.
- **Never mutates state** — no event is appended for any `show` call,
  success or failure.
- `show` is a `requiresExistingStore: false`-warning verb (added to
  `STORE_MISSING_WARNING_VERBS` alongside `list`/`ready`/`graph`/`stale`/
  `check`/`rollup`/`conflicts`/`triage`) — same missing-store warning
  contract as those, not a hard failure.

## Related

- `docs/history/fgos-show-scoped-detail/CONTEXT.md` and `plan.md`
  (`tsk-2fw`) — the locked-decision record for scoping every per-item log
  to one id, not just `work`.
- `plugins/fgOS/skills/show/SKILL.md` — the `/fgOS:show` skill wrapping
  this verb.
