# Work-item `priority`: calculated formula, and `intent`'s retirement

`tsk-4y5` changed `priority` from an explicit-only input (STR7) to a
calculated field, and retired `intent` (STR8) in place. Full design record:
`docs/history/work-item-priority-matrix/CONTEXT.md` (D1-D8) and `plan.md`.

## What changed

- `priority` (Data Dictionary #25, `work.mjs`) keeps its schema shape
  (non-negative integer, ASC sort, absent-last) and its human/agent
  override door (`edit --priority`) — but it is now also written
  automatically by the clarify and decompose judges, computed rather than
  purely explicit.
- `intent` (Data Dictionary #26) stops being written by `judgeDiscovery` —
  the field, its validation, and `edit --intent` stay in the schema/CLI
  unchanged (no removal). New items simply never populate it; frontier
  v2's `intent` DESC tie-break degrades to vacuous without any
  `frontier.mjs` code change.
- Three new optional fields: `urgent` (`low`/`medium`/`high`/`critical`,
  human-entered via `add`/`edit`, absent reads as `medium`), `impact`
  (computed), `effort` (computed) — all additive, same shape as
  `priority`/`intent` (`src/state/work.mjs`).

## The formula (`src/state/priority-formula.mjs`, pure)

```
impact   = blocks(STR21 rankImpact) + semanticRelatedness (judge-estimated)
           + derisknBonus(blastRadius)   // 0 until a real measurement exists
priority = invert(
             (impact * weightForUrgency(urgent))
             / max(effort, EFFORT_FLOOR)
             * discountForRiskWithBlastRadius(risk, blastRadius)
           )
```

`invert()` matters: the raw score is "bigger = more important", but
`work.priority`'s sort contract is ASC/absent-last (smaller number = higher
priority) — `invert()` is what keeps the two consistent, via
`Math.round(PRIORITY_SCALE / (raw + 1))` (always a non-negative integer,
monotonically decreasing in the raw score).

`risk` is a **discount only, never a boost** — it mirrors
`decompose.mjs`'s existing `risksGate` (a brake, not an accelerant): a
risky item never gets pushed to the front by risk alone. De-risking
*value* (the case for tackling an uncertain/foundational item sooner)
instead feeds `impact` via `derisknBonus(blastRadius)` — the same
blast-radius reading discounts `risk` further too, read once, used twice,
no circularity (neither role depends on the other's output).

## Two compute points

| Point | Where | `effort` | `blastRadius` |
|---|---|---|---|
| Rough pass | `clarify`, `resolveDiscovery` (was `intentScore`, now `impactScore`) | `EFFORT_FLOOR` (unknown yet) | absent (no code target yet) |
| Refined pass | `decompose`, `resolveDecompose` | read from the judge's `mode` (fgos-planning's own tiny/small/standard/high-risk/spike vocabulary, `effortForMode()`) | read from the judge's `blastRadius` (when `plan.md` recorded a real `impact-analysis` measurement) |

Both write via the existing `edit --priority` door (`editWork`), wrapped in
the same try/catch fail-safe discipline `intentScore`'s write always used —
a corrupted item shape never aborts the clarify/decompose resolution that
follows.

## `risksGate` gains an independent blast-radius gate (Phase C)

`decompose.mjs`'s `HEAVY_RISK` gate (`keywordRiskGate`) is now paired with
`blastRadiusGate` (blast-radius over `BLAST_RADIUS_GATE_THRESHOLD`, default
20) — either can force the human-confirm gate, **neither ever loosens the
other**: a keyword-heavy root still gates even at a low blast-radius
reading, and a keyword-light root with a high blast-radius still gates.
Each has its own bypass-detection (matched by its own reason text), same
shape as the pre-existing `heavyRiskAlreadyConfirmed` check.

## Real capture (this item's own outcome/settlement, per `fgos check tsk-4y5`)

The clarify-stage judge's own settlement note, verbatim:

> "cat docs/history/work-item-priority-matrix/CONTEXT.md — confirm D1-D8
> locked incl. formula priority=invert((impact\*weight(urgent))/effort\*
> discount(risk)), then run fgos-planning on item to shape formula's
> concrete weight/discount table"

The human's own answer, verbatim (superseding the original P1-P4-matrix
framing the task started from):

> "Khung 'map low/medium/high/critical -> P1-4' trong câu hỏi đã bị THAY
> THẾ, không còn áp dụng -- xem CONTEXT.md ... D3/D6: priority là SỐ TÍNH
> LIÊN TỤC = invert((impact x weight(urgent)) / effort x discount(risk)),
> không phải bảng tra rời impact-level x urgency-level -> P1-4."

Outcome: `passed: true`, `awaiting-approval`, 1 attempt, no friction
recorded.

## See also

- `docs/history/work-item-priority-matrix/CONTEXT.md` — D1-D8, scout
  evidence, pinned terms.
- `docs/history/work-item-priority-matrix/plan.md` — mode/risk-map/phases.
- `docs/reference/rankimpact-sort-key-order.md` — the pre-existing
  `blocks`/`rankImpact` derive `impact` builds on.
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` — the
  broader pipeline this feature's two compute points sit inside.
