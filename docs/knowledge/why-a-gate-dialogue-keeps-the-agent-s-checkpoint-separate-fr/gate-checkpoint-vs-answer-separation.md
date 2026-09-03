---
framework: diataxis
mode: explanation
---
# Why a gate dialogue keeps the agent's checkpoint separate from the human's answer

Source: `docs/history/checkpoint-distillate-gate-provenance/CONTEXT.md`
(tsk-19zm, implementing STR70a of
`docs/history/gate-dialogue-continuity/CONTEXT.md`, repo `forgent`).

## The question this answers

When an `awaiting-human` gate's dialogue unfolds — the agent interprets
the question, proposes options, leans toward one, the human corrects or
confirms — should the record that survives keep both the agent's checkpoint
and the human's final word, or is the final word alone enough?

## The root problem this traces back to

`gate-dialogue-continuity/CONTEXT.md` names the pain-point directly (P2):

> "đã bàn 5 lượt, nghiêng về B, mất sạch" — 5 rounds in, leaning toward B,
> lost entirely.

`gates[id]` already carried `rationale`/`alternatives`/`source` (shipped by
`tsk-63c`) before this item — but both `ask` and `answer` wrote into the
*same* three keys, spread-then-override. The moment a human answered, the
agent's own checkpoint distillate — whatever it had captured as of the most
recent `ask` — was silently gone, overwritten by the answer. That is
exactly P2 happening again, one layer down: the feature meant to stop
"forming context lost the moment someone answers" would itself lose the
forming context the moment someone answers.

## The fix: two independently-guarded trios, not one

`gates[id]` now carries six optional fields instead of three:

- `askRationale`/`askAlternatives`/`askSource` — the agent's checkpoint
  distillate as of the latest `ask`. Overwritten only by a fresh `ask`,
  never by an `answer`.
- `rationale`/`alternatives`/`source` — the human's final word as of
  `answer`, unchanged in name and semantics from what `tsk-63c` shipped,
  still the authoritative value for any downstream reader that needs one.

Both project through `computeAwaitingContext` (`src/state/awaiting-context.mjs`)
with the same guarded-presence idiom the function already used for `ask`
itself — an item with neither trio set sees the return shape exactly as it
was before this feature, byte for byte.

"Chỉ answer authoritative" (only the answer is authoritative) describes
which value *governs* downstream behavior — it does not mean the agent's
prior checkpoint should be erased from the record. Keeping both is what
lets a person who returns to a resolved gate see not just what was decided,
but what the agent believed *before* being corrected — the actual "mốc
trao đổi" (exchange milestone) content `gate-dialogue-continuity/CONTEXT.md`'s
D3 asked for, applied to the one snapshot pair `gates[id]` can hold.

## What "mốc-trao-đổi" (exchange milestones) actually means here

D3 of `gate-dialogue-continuity/CONTEXT.md` asks for a three-part record:
vì-sao (why) / mốc-trao-đổi (exchange milestones) / đánh-đổi (tradeoffs).
This item does not add a third mechanism for the middle part. Instead:

- vì-sao and đánh-đổi fold into `rationale`'s free-text prose (both sides,
  checkpoint and answer) — one field, KISS, no forced sub-structure.
- đã-loại (rejected options, listed alongside the three parts in the
  original distillate spec) maps to `alternatives`.
- mốc-trao-đổi — any exchange point worth recording *during* an ongoing
  dialogue, not just at `ask` or `answer` — is captured through the
  already-shipped, already-tested `addDecision`/`view.decisionsById[id]`
  mechanism (`tsk-63c`/`tsk-6b6` precedent), never a new `gates[id]` field.
  `decisionsById[id]` is append-only and accumulates over time — the right
  shape for a *trail*; `gates[id]` only ever holds the current snapshot at
  ask/answer — the wrong shape for a trail. No new door opens for this
  axis; the existing `fgos decision --id <item-id>` path already fits.

## A decision this item confirmed rather than reopened

`gate-dialogue-continuity/CONTEXT.md` D4 asked for `actor`/`role` to be
folded into `gates[id]` as a prerequisite. That ask is already superseded:
`docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md`
(tsk-63c) explicitly states `source` "subsumes it with more granularity for
free" — no separate `role` field was ever added to `putInAwaiting` or
`gates[id]`. This item cited that supersession rather than re-deciding it.
