---
authoritative_for: fgos-routing Mode gate skip-load, tiny/small lane inline skip-check, planning/validating/implement reference-chain skip
---

# The Mode gate classified tiny items — but never actually made anything lighter for them

`tsk-2yog` closed a real, self-diagnosed gap: `fgos-routing`'s "Mode gate
(mechanical, not vibes)" classified every planning-stage coding item
into a lane (`tiny`/`small`/`standard`/`high-risk`/`spike`), but that
classification never skip-loaded any of the heavy stage-skill chain for
a `tiny`/`small` item — the gate's own text already admitted this
plainly: "every planning-shaping item still gets routed to `fgos-coding-
planning` below regardless of lane... a genuine skip-load optimization...
would need an actual routing-table change, which this decision does not
make."

## Confirmed live, with an exact reproducible cost

Driving `tsk-1uf` end-to-end — a genuinely tiny item (2 independent
additive doc-only edits mirroring an already-proven pattern, 0 hard-gate
flags, `Mode: tiny` per its own `plan.md`) — the drive still had to load
and follow the **full** text of `fgos-coding-driving`, `fgos-coding-
discovering`, `fgos-researching`, `fgos-coding-planning` (+ 3 reference
files), `fgos-coding-validating` (+ 3 reference files), and `fgos-coding-
implement` (+ 4 reference files) — roughly a dozen skill/reference files
and several thousand lines of prose, to process a change whose entire
diff was 6 lines added to 2 files. Named as the direct, reproducible
source of a person's own live observation that "dispatch feels
cumbersome, not smooth."

## What shipped: inline skip-load checks in the stage skills themselves, not a routing-table change

Rather than the routing-table change the gate's own prose had flagged as
the missing piece, the fix lives inside each stage skill directly:
`fgos-coding-planning`, `fgos-coding-validating`, and `fgos-coding-
implement` each gained an explicit **Skip-load check** — decided once
the lane is known, before the stage's own detailed steps — that for a
`tiny`/`small` lane skips opening the heavier reference files entirely
and substitutes a condensed inline procedure (e.g. planning's Approach
becomes one paragraph naming the chosen files, the one risk worth
naming, and the one proving command, instead of opening `approach-and-
shape.md`/`split-and-child-specs.md`). `verify-sync-and-gap.md` still
applies at every lane, never skipped. `fgos-routing`'s own Mode-gate
prose was corrected to point at this real mechanism instead of the
"would need an actual routing-table change" admission.

## A self-contradictory first attempt, caught and fixed

The first pass shipped inline notes that told the reader to skip a
reference file, then immediately pointed right back at it as "Full
mechanics" — grep-satisfying (the skip instruction existed as text) but
self-contradictory in practice. A follow-up commit replaced this with
real conditional **Skip-load check** blocks that actually define what
the condensed inline procedure is, removing the dangling "Full
mechanics" pointer for the skipped case.

## A stray mid-session checkout reverted files — a real, separately-tracked hazard

That same follow-up commit's own message records: "restores `fgos-
coding-driving/loop-mechanics.md` and `fgos-routing/SKILL.md`, which
reverted to their pre-fix content mid-session (a stray `git checkout`
during a full test-suite run — worth investigating separately, tracked
as friction on this item)." Named here as a real, observed hazard, not
separately root-caused within this item's own scope.

## This item's own provenance

Like [`tsk-6al`](fgos-return-skip-redundant-verify.md), the original
`tsk-2yog` vanished from `.fgos/events.jsonl` under the same confirmed
concurrent-write data loss (see
[`tsk-24e`'s own investigation](events-jsonl-concurrent-data-loss-investigation.md))
and was recreated from scratch.
