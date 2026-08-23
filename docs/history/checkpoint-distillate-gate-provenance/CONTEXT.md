---
item: tsk-19zm
stage: clarify
date: 2026-07-30
---

# CONTEXT: checkpoint distillate + record chốt 3-phần lên gate (STR70a)

## Feature boundary

An `awaiting-human` gate's dialogue (agent interprets the question, proposes
options, leans toward one, the human corrects or confirms) today leaves no
trace beyond the open chat — `gates[id]` only carries `ask`/`answer`/
`parentSnapshotAtAsk`/`statusAtAsk`, and a person returning to the item sees
none of the forming context (pain-point P2 in
`docs/history/gate-dialogue-continuity/CONTEXT.md`, the sibling-repo record
this item implements). This feature closes that gap by (a) letting the
agent's checkpoint distillate (as of the latest `ask`) and the human's final
word (as of `answer`) both persist and both surface through
`awaitingContext`, and (b) confirming how the dialogue's intermediate
exchange milestones get captured.

Out of scope: `STR70b` (raw-transcript backstop, blocked on Q1 in
`gate-dialogue-continuity/CONTEXT.md`, filed separately as `tsk-5dj`);
`STR71` (ask self-sufficiency, filed separately as `tsk-539`); the exact CLI
flag names/verb shape for any new fields (implementer's call, `fgos-coding-planning`);
`tsk-4op`'s own batch-compound redesign (this item only unblocks it, per
`tsk-4op`'s own `deps`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | **"Mốc-trao-đổi" (exchange milestones) is captured via the already-shipped, already-tested `addDecision`/`view.decisionsById[id]` mechanism (tsk-63c/tsk-6b6 precedent) — no new field or mechanism on `gates[id]`.** `decisionsById[id]` is append-only and accumulates over time, the correct shape for a *trail* of exchange points; `gates[id]` only ever holds the current snapshot at ask/answer, the wrong shape for a trail. During a gate dialogue, any exchange milestone worth recording gets logged via the existing `fgos decision --id <item-id> --rationale "..." --source "..."` path — this item adds no new door for that axis. |
| D2 | **`gates[id]` keeps agent's checkpoint distillate (at `ask`) and human's final word (at `answer`) as separate fields, not one overwritten value.** New fields `askRationale`/`askAlternatives`/`askSource` (the agent's checkpoint as of the latest `ask`) alongside the existing `rationale`/`alternatives`/`source` (kept as `answer`'s, unchanged name/semantics — still the authoritative value). Required by the feature's own root problem (P2: "5 rounds in, leaning toward B, lost entirely" — an overwrite-on-answer design would re-recreate exactly that loss the moment a human answers), not an optional enhancement. A fresh `ask` overwrites the prior `askRationale` (still latest-wins on that one axis — the accumulating trail is D1's job, not this field's). |
| D3 | **D4 of `gate-dialogue-continuity/CONTEXT.md` ("fold `actor`/`role` into `gates[id]`") is already superseded** — cited, not re-locked here. `docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md` (tsk-63c) explicitly supersedes it: `source` (already shipped on both `ask` and `answer`) covers the same provenance need with more granularity; no separate `role` field is added to `putInAwaiting`/`gates[id]`. This item does not reopen that. |
| D4 | **`awaitingContext` (`src/state/awaiting-context.mjs`) must be extended to project both checkpoints** — `askRationale`/`askAlternatives`/`askSource` and `rationale`/`alternatives`/`source` — alongside the `ask` text it already surfaces. Confirmed live: `computeAwaitingContext` today returns only `{parent, changedSinceAsk?, ask?}`; none of `gates[id]`'s already-shipped `rationale`/`alternatives`/`source` reach a reader through this function at all. Without this, STR70a's own CoS ("`awaitingContext` mang distillate + record 3-phần") is unmet even once the fields exist in storage. |

## Pinned terms

- **"checkpoint distillate"** — the agent's re-interpreted question + options
  + comparison axes + leaning + quoted-verbatim reasoning, as of the most
  recent `ask`. Lives in `gates[id].askRationale`/`askAlternatives`/
  `askSource` (D2).
- **"answer" / authoritative value** — the human's final word, as of
  `answer`. Lives in `gates[id].rationale`/`alternatives`/`source`
  (existing fields, unchanged), always wins over the checkpoint distillate
  for any downstream reader that needs one value, not two.
- **"mốc-trao-đổi" / exchange milestone** — one point in an ongoing gate
  dialogue worth recording before the final answer lands. Captured via
  `addDecision`/`view.decisionsById[id]` (D1), never a `gates[id]` field.
- **"3-phần" (D3 of `gate-dialogue-continuity/CONTEXT.md`)** — vì-sao
  (why) / mốc-trao-đổi (exchange milestones) / đánh-đổi (tradeoffs
  accepted). Maps to: vì-sao+đánh-đổi → `rationale` prose (both fold into
  one free-text field, per D2 above — no separate tradeoffs field, KISS);
  mốc-trao-đổi → `decisionsById[id]` trail (D1); đã-loại (rejected
  options, listed alongside the 3-phần in the original distillate spec) →
  `alternatives`.

## Scout evidence

- `docs/history/gate-dialogue-continuity/CONTEXT.md` (repo `forgent`,
  `/home/vantt/projects/forgent/docs/history/gate-dialogue-continuity/CONTEXT.md`)
  — the authoritative decision record (D1-D6, Q1) this item implements.
  D2/D3 define the distillate/3-phần shape; D4 (superseded, see D3 above);
  D6 orders STR69a → STR70-provenance → STR70 full → STR69b → STR71.
- `docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md`
  (tsk-63c) — confirmed live: D1 there explicitly supersedes
  `gate-dialogue-continuity` D4's `role`/`actor` ask with `source`.
- `src/state/replay.mjs:139-179` (`case 'work.move'`, the `gates[id]`
  fold) — confirmed live: `rationale`/`alternatives`/`source` already
  fold in, spread-then-override (single value, no ask/answer
  distinction) — the exact gap D2 closes.
- `bin/fgos.mjs:969-1015` (`ask`/`answer` CLI cases) — confirmed live:
  both already accept optional `--rationale`/`--alternatives`/`--source`
  flags, threaded into `putInAwaiting`/`answerAwaiting`. `role` is
  destructured from `work.move`'s payload (line 48) but never folded
  into `gates[id]` — matches D3's supersession note (the field exists on
  the raw event, deliberately not projected into the gate view).
- `src/state/awaiting-context.mjs` (full read) — confirmed live:
  `computeAwaitingContext` returns `{parent, changedSinceAsk?, ask?}`
  only; no `rationale`/`alternatives`/`source` projection exists yet —
  the exact gap D4 closes.
- `test/intake/plan.test.mjs` (tsk-6b6's own tests, e.g.
  `resolveDecompose logs a decisionsById entry on a need-human verdict`)
  — precedent test shape for D1's reuse of `addDecision`/
  `view.decisionsById[id]`.

## Canonical references

- `docs/history/gate-dialogue-continuity/CONTEXT.md` (repo `forgent`)
- `docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md`
- `docs/backlog.md` (STR70a row)
- `docs/decisions/0025-mo-rong-uu-tien-san-pham-them-ux-van-hanh-vao-ship-faster.md`
  (product priority order this item's shape was checked against)

## Outstanding questions deferred to planning

- Exact CLI flag shape for setting `askRationale`/`askAlternatives`/
  `askSource` on `fgos ask` (new flags vs. reusing `--rationale` etc. with
  a case-dependent target field) — implementer's call, not a product
  ambiguity per the existing precedent (`ask`'s `--rationale` already
  exists and currently writes the now-answer-only field name; planning
  decides whether to rename the flag's target or keep the flag name and
  just change which `gates[id]` key it writes to).
- Whether `awaitingContext`'s projection of the two checkpoints needs any
  shape beyond a flat spread of the new fields (e.g. explicit
  `{checkpoint: {...}, answer: {...}}` nesting vs. flat keys) — an
  implementation/readability call, `fgos-coding-planning`'s to size.
- Whether `awaitingContext` should also surface a summary (e.g. count) of
  `view.decisionsById[id]` entries for the item, so the exchange-milestone
  trail (D1) is visible without a separate `fgos check` call — real
  product value, but not required by STR70a's own locked CoS text; flagged
  for planning to size as in-scope-now vs. a fast follow-up.
