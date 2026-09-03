---
framework: diataxis
mode: explanation
---
# Why work-item titles get a 100-character ceiling at the store layer

## The complaint, and what the data actually showed

The raw request named two symptoms: titles "quá ngắn" (too brief) and a
request to fix the LLM naming logic. Measured against the live store (54
items at scouting time):

| bucket | items |
|---|---|
| ≤40 chars | 7 |
| 41–60 | 4 |
| 61–100 | 12 |
| **>100** | **32** |

**"Quá dài" (too long) was the live, dominant defect: 32/54 items (58%)
exceeded 100 characters** — not the "too short" symptom the request led
with. `TITLE_MAX_LENGTH = 60` (`classify.mjs:13`) only applied in
`deriveTitle`'s *fallback* branch, reached when the submitted text has no
sentence/line boundary at all. The boundary branch returned the whole first
sentence **uncapped** — the item that raised this complaint had its own
~230-character title because its submitted text had no boundary until the
final period, so the entire blob became the title.

"Quá ngắn" turned out to be mostly not a live defect of the mechanical
path: of the 7 titles ≤40 chars, 4 had `description` byte-identical to
`title` (the submitted text itself was that terse — no title logic could
have produced more), and the other 3 were legacy titles already fixed by an
earlier item (`tsk-2z3`, the dot-in-filename boundary bug). The LLM
(`decompose`) naming path the request also named held **zero items** in the
store at scouting time — 0 of 54 items carried a `parent`.

## Why the fix targets length, not the LLM prompt

Given the measured distribution, fixing the request's second ask (LLM
naming logic) would have had near-zero present effect — that path produced
nothing yet. Every title in the store came through `submit` or `add`
instead, both mechanical paths. The length ceiling closes the actual,
measured defect.

## Why the ceiling lives at the store layer, not inside `deriveTitle`

A title reaches the store through three doors: `fgos submit` (via
`deriveTitle`), `fgos add --title` (the flag value goes into the store
raw, never touching `deriveTitle`), and `decompose` children (LLM-authored,
accepted by `normalizeChild`). A rule written only into `deriveTitle` would
never reach `add --title` or decompose children. The ceiling instead lives
in `src/state/work.mjs`, reused by every write door:

```js
// The bound is applied at the store's own normalize points (addWork/editWork
// in store.mjs), which every write door passes through, and reused by
// deriveTitle so a submitted title is already within bounds by the time
// generateId hashes it.
export const MAX_TITLE_LENGTH = 100;
```

100 was chosen as a value above every title a human writes by hand and
below the run-on blobs a whole submitted paragraph produced (32 of 54
stored titles were past it at measurement time).

## Why truncate, never reject

```js
/**
 * Bound a title to MAX_TITLE_LENGTH, cutting at a word edge when one exists
 * within the bound and falling back to a hard cut when a single token runs
 * past it. Anything already short enough — and any non-string, which
 * validateWorkShape is still the one to reject — is returned untouched, so
 * this is safe to apply ahead of validation on every path.
 */
export function truncateTitle(title) {
  if (typeof title !== 'string' || title.length <= MAX_TITLE_LENGTH) return title;
  const cut = title.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}
```

The ceiling was deliberately **not** placed inside `validateWorkShape` —
that function only ever throws or returns, so a bound placed there could
only reject. An over-length `add --title` call from a script or agent must
not break the call that carried it; truncating (cutting at a word edge
when possible) preserves the caller's write instead of failing it.

## Why no minimum-length floor, and why the ceiling applies to both branches of `deriveTitle`

No minimum was introduced: a short title caused by short submitted text is
not repairable by any title logic — the only fix for that would be asking
the submitter for more text at intake time, explicitly out of scope (this
item keeps `submit` fully mechanical, no LLM call, no `--title` override
flag). The ceiling itself applies to *both* of `deriveTitle`'s branches —
the sentence-boundary branch and the fallback branch alike — closing
exactly the gap the scout evidence found: the old `TITLE_MAX_LENGTH = 60`
constant only guarded the fallback branch, leaving the boundary branch
(the one that actually produced the 230-character title) completely
uncapped.

## Follow-up polish: marking a truncation as a truncation

The original cut left a reader unable to tell "this is the whole title"
from "this was cut off" just by looking at it — both look like an ordinary
title. A follow-up item (`tsk-16a`) closed that: `truncateTitle` now
appends a single ellipsis character (`…`) whenever it actually truncates,
reserving one character *inside* the existing `MAX_TITLE_LENGTH = 100`
budget so the final length (word-boundary cut plus the ellipsis) never
exceeds the ceiling — the word-boundary cut logic itself is unchanged,
it just searches within a 99-character budget instead of 100 when a
truncation is about to happen. This is cosmetic polish of the contract
above, not a change to the ceiling value or to `fgos-clarifying`'s own
rewrite trigger.

## What this item does not claim to fix

The semantic half of the original request — a title should convey
*object + action + scope* — is explicitly not mechanically enforceable. A
string cut can only guarantee where it stops, never that the result names
an object, an action, and a boundary. That contract is left to
author-facing guidance in the submitting skills and the `decompose` prompt,
not to this item's write-time truncation.
