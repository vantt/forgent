# Plan: fix findNewFindings' duplicate-key under-detection

**Gate note:** the hard-gate keyword floor (`canAutoApproveMergedGate`,
`src/state/gate-bypass.mjs:232-233`) tripped on "migration" in this
item's own submitted description (referring to the JSON `--write-baseline`
regen, not a schema/DB migration). Per this repo's own design that floor
is never overridden by a session's own judgment, so this was asked
directly in chat rather than bypassed — human confirmed proceeding on
2026-08-17, with the prototyped fix (below) already proven against the
real repro plus two regression cases before asking.

Mode: **standard** (2 flags per fgos-routing's Mode gate — "existing
covered behavior" (the file already has 29 passing tests that must keep
passing) and "weak proof around the area" (this whole item exists
*because* the existing test suite has a real, confirmed coverage gap —
see RESEARCH.md). No auth/data-loss/audit/external-provider/
cross-platform/multi-domain flag applies, so this stays below
`high-risk`). No `CONTEXT.md` — discovery's own verdict was `clear`,
skipping `exploring`; every claim below traces to `RESEARCH.md`'s Round 1
(same dir).

## Approach

**The bug (RESEARCH.md Round 1):** `findNewFindings`
(`check-decision-citation-drift.mjs:163-169`) checks baseline membership
with `known.includes(key)` — true/false only, never a count. `baselineFromFindings`
(`:171-178`) pushes one key string per finding into a per-file array, so a
file with 2+ findings sharing the same `(kind, id, text)` key (a real,
common shape — confirmed live: 7 files / 64 duplicate-key groups in the
real committed baseline today) ends up with that key repeated in the
array. Once a key is present at all, `.includes()` treats EVERY further
occurrence as "already known" forever — a genuinely new Nth occurrence of
an already-duplicated key is silently absorbed, never reported. Confirmed
this is a real regression (not pre-existing): the OLD line-keyed formula
never had this gap, because a line number is inherently unique per
occurrence within a file — tsk-3x8's re-key traded that property away as
an unintended side effect, unnamed in its own plan.md risk map.

**Chosen fix:** change `findNewFindings` from a membership check to a
per-file occurrence-COUNT consumption. Build a `key -> remaining count`
map from each file's baseline array once, then for each candidate finding
in order: if the map has a remaining count > 0 for that finding's key,
decrement it and treat the finding as known; otherwise it is new. This is
a pure fix to the READ side's matching logic — `baselineFromFindings`'s
own output shape (array of key strings per file) is untouched, so no
baseline-format migration and no `--write-baseline` regen is needed (the
stored data was always correct; only how it got consumed was wrong).

**Rejected alternative:** switch the baseline's own storage shape to a
`{key: count}` object instead of an array. Rejected — it's a real format
migration (touches every consumer of the committed `.baseline.json`,
however few there are) for no behavioral gain over fixing the read side
alone; the array-of-strings shape already round-trips through JSON fine
and matches the sibling `check-decision-codes.mjs`'s own baseline shape,
which this item is not otherwise touching.

**Files touched:**
- `scripts/check-decision-citation-drift.mjs` — `findNewFindings` only
  (`:163-169`). `baselineFromFindings`/`findingKey` stay exactly as
  tsk-3x8 left them.
- `test/scripts/check-decision-citation-drift.test.mjs` — one new
  regression test reproducing the exact repro from RESEARCH.md (2
  baselined identical-key findings + a genuine 3rd occurrence must report
  1 new, not 0).
- No baseline regen needed (confirmed in RESEARCH.md: the committed
  baseline is byte-identical to a fresh regen off current code — the fix
  changes matching logic, not what gets written).

**Order:** one piece, no meaningful multi-step ordering decision (a
single function's internal logic) — `fgos graph --what-if` would have
nothing to compare between, since there is exactly one candidate change,
not two rival orderings.

**Impact-analysis posture:** `degraded` (same as tsk-3x8's own plan.md
recorded) — `fgos tool query --capability impact-analysis --status present`
reports gitnexus `present`, but `impact({target:'findNewFindings',
direction:'upstream'})` still returns "Target not found" (the live index
remains 435+ commits behind HEAD, predating this file, unchanged since
tsk-3x8). Cross-checked directly: `grep -rn "findNewFindings"
--include="*.mjs"` (excluding node_modules) shows it is still called only
by this file's own `runCli` and imported only by this file's own test —
blast radius confirmed contained by direct grep, not by trusting the
stale index.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `findNewFindings` count-consumption rewrite | Low — pure function, no I/O, blast radius confirmed contained (grep cross-check above) | New regression test reproducing the exact under-detection repro from RESEARCH.md; existing 29 tests must keep passing unmodified |
| Order-dependence of count consumption | Low — a duplicate key's physical LINE position doesn't matter to a count-based check, only how many occurrences exist total | Existing tests already cover both "still present" and "line-shifted" scenarios without relying on any particular array order; the new test doesn't need to control physical order either, only count |
| Sibling `check-decision-codes.mjs` has the same latent shape | Out of scope for THIS item (its own description scopes to `check-decision-citation-drift.mjs`) | Flagged plainly in RESEARCH.md and this plan, not silently fixed here — a real, separate follow-up |

## Shape

One honest piece of work, no split (pass-through). Concrete case to prove
against:

- **Regression case for the actual bug:** baseline two findings sharing
  the same `(kind, id, text)` key in one file (mirroring the real,
  confirmed live shape), then check a THIRD, genuinely new occurrence of
  that same key reports as new (`findNewFindings` length 1), not silently
  absorbed (length 0) — the direct repro from RESEARCH.md, made permanent.
- **Existing behavior preserved:** the fix must not regress any of the 29
  existing tests, including tsk-3x8's own line-shift regression tests
  (this fix only changes COUNT semantics, never re-introduces any
  line-number dependency).
- **Boundary, already covered by an existing test:** two DIFFERENT
  findings (different text) at the same or different lines already stay
  distinct under the current key formula — untouched by this fix, no new
  case needed for it.

## Verify

`node --test test/scripts/check-decision-citation-drift.test.mjs` —
already the item's own real `verify` field (synced at discovery, not a
placeholder). Same command tsk-3x8 used; exercises exactly the function
this plan touches.

## Outstanding questions

None for this item's own scope (fix the duplicate-key under-detection in
`check-decision-citation-drift.mjs`'s `findNewFindings`). The sibling
`check-decision-codes.mjs`'s architecturally identical (currently
dormant) gap is explicitly out of scope — flagged as a real follow-up in
RESEARCH.md, not silently dropped and not silently rolled into this item.
