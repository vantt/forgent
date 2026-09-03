---
framework: diataxis
mode: reference
---
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
| Refined pass | `decompose`, `resolveDecompose` | read from the judge's `mode` (fgos-coding-planning's own tiny/small/standard/high-risk/spike vocabulary, `effortForMode()`) | read from the judge's `blastRadius` (when `plan.md` recorded a real `impact-analysis` measurement) |

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
> discount(risk)), then run fgos-coding-planning on item to shape formula's
> concrete weight/discount table"

The human's own answer, verbatim (superseding the original P1-P4-matrix
framing the task started from):

> "Khung 'map low/medium/high/critical -> P1-4' trong câu hỏi đã bị THAY
> THẾ, không còn áp dụng -- xem CONTEXT.md ... D3/D6: priority là SỐ TÍNH
> LIÊN TỤC = invert((impact x weight(urgent)) / effort x discount(risk)),
> không phải bảng tra rời impact-level x urgency-level -> P1-4."

Outcome: `passed: true`, `awaiting-approval`, 1 attempt, no friction
recorded.

## Real-world finding: two of three axes were nearly degenerate in practice (`tsk-4hb`)

A scan of 482 real items (`plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`)
found `urgent` and `risk` contributing far less than the formula's own
comment (`priority-formula.mjs:5-12`, calling the inversion "the single
highest-consequence correctness risk in this feature") implied — the
inversion math was correct; the degeneracy was in the inputs feeding it:

- **`urgent`**: absent on 476/482 items, so `weightForUrgency(undefined)`
  (falling back to `medium`'s weight) fired for 98.8% of real items —
  effectively a constant. This is a **producer gap, not a formula bug**:
  `docs/specs/work-state.md`'s own Data Dictionary #6 documents `risk` as
  free text (see below), and `weightForUrgency`'s absent-default is
  exactly correct behavior for a genuinely unset value. Whether items
  should always carry an explicit urgency is a submit-time product
  decision, out of this item's scope.
- **`risk`**: 415/482 items used one of the three recognized values
  (`light`/`standard`/`heavy`), but the remaining 67/482 carried a
  present-but-unrecognized value (`medium`/`low`/`high` — legal per Data
  Dictionary #6's free-text shape) and silently folded to `standard`'s
  discount via `discountForRisk`'s `?? RISK_DISCOUNTS.standard` fallback,
  with no signal anywhere that this had happened. This **is** a real
  correctness bug: the fallback could not distinguish "absent" (a
  legitimate default) from "present but unrecognized" (silently masked).

**Fix, scoped to `risk` only**: `priority-formula.mjs` stays pure (no
fs/Date.now/mutation, same discipline as `impact.mjs`) — it does not log
itself. Instead it exports a new pure query, `isRecognizedRisk(risk)`,
alongside the existing `discountForRisk`. The two real call sites
(`src/intake/discovery.mjs` and `src/intake/plan.mjs`, both already
calling `addDecision`) now log a decision when `work.risk` is a
truthy, present string that `isRecognizedRisk` reports as unrecognized —
making the fold visible in the audit trail instead of silent.
`discountForRisk`'s actual return value is byte-identical before and
after this change for every input; only observability was added. Landed
clean (`node --test test/state/priority-formula.test.mjs && npm test`
passing, `outcome: awaiting-approval`, no code-level rework needed —
though the merge itself hit two transient `goal-check` verify-miss
blocks before landing, per `tsk-4hb`'s own friction capture).

## Real-world finding: 69% of scored items collapsed to the worst priority value (`tsk-1r3`)

The same real-log scan found `priority`'s sort key had degenerated much
further than the `urgent`/`risk` axes alone explain: of 189 items that
ever had a `priority` write, 131 (69%) sat at exactly `10000` —
`PRIORITY_SCALE`'s own worst-possible value under the ASC-absent-last
sort contract (Data Dictionary #25), i.e. sorted dead last among every
scored item. Real examples: `tsk-4y8: 449 -> 10000`, `tsk-62d: 278 -> 323
-> 10000`, `tsk-2ta: 192 -> 209 -> 10000` — each item's own priority
getting *worse* on a later write, not better, as `decompose`'s "refined"
pass overwrote `clarify`'s rough one (`src/state/replay.mjs`'s
`Object.assign(item, patch)` is unconditional, latest-wins, so the
refined pass's write always sticks).

**Initial hypothesis, corrected by research**: the item's own starting
claim was that `decompose.mjs`'s refined `computeImpact` call structurally
omits the `semanticRelatedness` term that `discovery.mjs`'s rough call
supplies (confirmed true by reading both call sites) — implying the
later, "more refined" pass was working from strictly less information
than the earlier one. Investigation (`RESEARCH.md`) found this term
carries **no real data to lose today**: `verdict.impactScore` (what the
rough pass's `semanticRelatedness` would read) is never actually
populated by the live `callerVerdict` path — the subprocess-judge path
that might once have set it was already retired
(see `tsk-1x3` above). The dramatic `449 -> 10000` collapses are actually
driven by `blocks` (from `rankImpact(view)`) genuinely changing between
the two live reads — a real graph-state difference, not a term silently
dropped.

**Fix, scoped to structural parity only**: add an explicit
`semanticRelatedness: 0` to `decompose.mjs`'s call site so both writers
of the same computed value agree on what parameters they pass — a real,
independently-worth-fixing correctness smell, confirmed by a human as
"no behavior change, no split needed" since the term carries no live
data either way today. This does **not**, by itself, fix the
`blocks`-driven collapse to `10000` — that remains open, explicitly
flagged rather than silently folded into this item's scope: **whether
`decompose`'s refined pass should re-derive `blocks` fresh from the
current graph state (today's behavior) or carry forward the value the
rough pass computed** is a separate, larger design question for a future
item. Landed clean, one attempt, `node --test test/state/priority-
formula.test.mjs test/intake/plan.test.mjs && npm test` passing.

## See also

- `docs/history/work-item-priority-matrix/CONTEXT.md` — D1-D8, scout
  evidence, pinned terms.
- `docs/history/work-item-priority-matrix/plan.md` — mode/risk-map/phases.
- `docs/history/tsk-4hb-priority-formula-degenerate-axes/plan.md` — the
  real-data scan and `isRecognizedRisk` fix shape behind the `risk`-axis
  section above.
- `docs/history/tsk-1r3-priority-refined-pass-drops-term/CONTEXT.md` — D1
  (scope is parity, not the `blocks` collapse) and D2 (the still-open
  re-derive-vs-carry-forward question) behind the section above.
- `docs/reference/rankimpact-sort-key-order.md` — the pre-existing
  `blocks`/`rankImpact` derive `impact` builds on.
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md` — the
  broader pipeline this feature's two compute points sit inside.
