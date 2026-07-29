---
item: tsk-6b6
stage: clarify
date: 2026-07-29
---

# CONTEXT: decompose verdict capture

## Feature boundary

`judgeDecompose`/`resolveDecompose` (`src/intake/decompose.mjs:290-360`) judges
whether a stage-`decompose` item passes through unsplit, splits into
children, needs a human, or is invalid. Three of its four outcome branches
(`pass-through`, `decompose`-with-children, `invalid`) currently write no
settled record of *why* — only `moveStage`/`addWork` calls, no rationale
trace. `need-human` writes raw `ask` text via `putInAwaiting`, not a
structured record either. This feature adds a real capture point for all
four branches, and — where the model doesn't yet supply a reason — extends
the model prompt so it does.

Out of scope: classifying which domain an item belongs to, deciding item
size/splitting judgment itself, the `gates[id]` schema fold bee-diff's
doc separately proposes (STR70a/tsk-63c territory), and bee's
`type: supersede` mechanism (explicitly declined — see D4).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Record the verdict by **reusing/extending `addDecision`** (`src/state/store.mjs:603`), not by mirroring `view.discovery` with a new event door. Concretely: `addDecision` gains an optional `id` param — when present, folds into `view.decisions[id]` (same pattern `addOutcome`/`addFriction`/`addDiscovery` already use); when absent, falls through to today's global unscoped array (zero migration). `addDecision` also gains `rationale` (required, throws if blank — mirrors bee's `decisions.mjs:307-308`), `alternatives` (optional, free text), and `source` (optional, free text, default `'session'`). `judgeDecompose`'s four verdict branches each call `addDecision(dir, { id, source: 'judgeDecompose', rationale, alternatives? })` alongside their existing `moveStage`/`putInAwaiting` call — before the CLI `decision` verb (`bin/fgos.mjs:1023`) also gains a threaded `--id` flag for parity, mirroring the other three id-scoped verbs' CLI shape. |
| D2 | **Extend `buildDecomposePrompt`'s JSON schema so the model supplies a reason on every branch**, not only `need-human`. `pass-through` gains an optional top-level `"reason"` string (model explains why no split is needed; if the model omits it despite being asked, `resolveDecompose` logs a fixed fallback rationale — this is the one case the model was asked and simply didn't answer, distinct from D3 below). `decompose` gains a **required** top-level `"reason"` string — the why-split summary the item itself asks for — separate from each child's own `title`/`verify`/etc. `need-human` is unchanged (already has `reason`). `invalid` is unchanged — a parse/model failure has no trustworthy model text to draw from, so its `rationale` is always a fixed string (see D3), never a prompt concern. |
| D3 | The `decompose` branch's top-level `"reason"` is **required**: a decompose verdict with a blank/missing top-level reason normalizes to `{ kind: 'invalid' }`, the same rule `normalizeChild` already applies to a child missing `verify` (`decompose.mjs:127-131`). The `invalid` branch's logged `rationale` is a fixed string (e.g. "model/parse failure — verdict could not be judged"), never model-sourced. |
| D4 | `source` is **free text**, not a closed enum — matches bee's proven convention (`decisions.mjs`, 15 distinct real values) over the closed `human`/`session`/`engine` alternative bee-diff's doc left open; this item is the one specifying the schema, so the open question is resolved here rather than deferred again. Every `judgeDecompose`-originated call passes the literal `source: 'judgeDecompose'`. |
| D5 | **Dependency note, not a design decision:** tsk-6b6 depends on tsk-63c, but tsk-63c's own description only covers folding `role` into `gates[id]` (STR70a D4) — it does not build the `addDecision` id/rationale/alternatives/source extension its title references. D1 above is therefore tsk-6b6's own scope to build, not something inherited for free from tsk-63c landing. Flagged for `fgos-planning` to size accordingly; the `gates[id]` three-field fold bee-diff's doc separately proposes stays out of this item's scope (D-boundary above). |

## Pinned terms

- **"verdict"** — `judgeDecompose`'s return value, one of `{kind: 'invalid'}`, `{kind: 'need-human', reason}`, `{kind: 'pass-through', reason?}` (reason field added by D2), `{kind: 'decompose', reason, children}` (reason field added by D2, required by D3).
- **"rationale" vs "reason"** — the model-facing JSON field stays named `"reason"` (matches the existing `need-human` convention already live in the prompt); the storage-facing field on `addDecision`'s payload is named `rationale` (matches bee's proven field name). `resolveDecompose` is the one place that translates `verdict.reason` → `addDecision`'s `rationale` param — no other file needs to know both names exist.

## Scout evidence

- `src/intake/decompose.mjs:290-360` (`resolveDecompose`) — confirmed live: `pass-through` (328-331) and the `already-decomposed` re-entrant path (287-292) call `moveStage` only, zero trace. `need-human` (322-326) writes raw ask text via `putInAwaiting`, not a settled record.
- `src/intake/decompose.mjs:62-121` (`buildDecomposePrompt`) — today's JSON schema only requests `"reason"` for `need-human` (line 120); `pass-through` and `decompose` branches get no model-supplied rationale at all.
- `src/intake/decompose.mjs:124-148` (`normalizeChild`) — precedent for "missing required field → whole verdict invalid": a child missing `verify` already invalidates the entire decompose verdict, the same rule D3 extends to the top-level `reason`.
- `src/intake/discovery.mjs:239` (`resolveDiscovery`) — the sibling pattern this item's own description referenced ("tương tự view.discovery"); considered and explicitly not followed (D1) in favor of reusing `addDecision`.
- `src/state/store.mjs:603-611` (`addDecision`) — confirmed today only requires `text`; no `id` param, no `rationale`/`alternatives`/`source`.
- `src/state/replay.mjs:254-255` — confirmed `decision` events fold into `view.decisions` as a flat unscoped array today; the id-scoped fold D1 requires does not exist yet.
- `bin/fgos.mjs:1023-1027` (`decision` CLI case) — confirmed no `--id` flag exists yet.
- `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md:139-209` — source of the reuse-addDecision recommendation (D1), the resolved id-optional-param precedent (lines 191-202), and the free-text-`source` lean (D4, lines 203-209).
- `plans/reports/capture-recording-points-audit-260729-1745-report.md:41-56` — original live trace confirming the zero-record gap this item fixes.

## Canonical references

- `docs/distillery/deep-dives/fgos-capture-gaps-vs-bee.md`
- `docs/explanation/fgos-capture-points-and-the-why-gap.md`
- `plans/reports/capture-recording-points-audit-260729-1745-report.md`

## Outstanding questions deferred to planning

- Whether `alternatives` is ever populated for a `judgeDecompose`-originated call (bee's `alternatives` = rejected options-and-why; for a `decompose`/`pass-through` verdict this has no forced shape) — implementation judgment, not a product decision.
- Exact wording/placement of the fixed fallback strings (D2's pass-through-omitted-reason fallback, D3's invalid fixed rationale) — implementer's call within the shape already locked here.
- Whether `resolveDecompose`'s `addDecision` calls should happen before or after their corresponding `moveStage`/`putInAwaiting` call — ordering/atomicity detail, `fgos-planning`'s to size.
