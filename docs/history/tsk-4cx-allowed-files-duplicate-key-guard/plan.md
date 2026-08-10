---
type: plan
title: tsk-4cx — ALLOWED_FILES duplicate-key self-check
tags: []
source_capture_ids: [tsk-4cx]
---

# tsk-4cx — ALLOWED_FILES duplicate-key self-check

Mode: tiny (1 file, one direct mechanical addition + one line removal — no
gray area, no split candidate). No `CONTEXT.md` — intent was clear at
`clarify`, and the shape is dictated by a concrete, already-observed bug,
not a product decision.

## Problem (real, observed during tsk-2au)

`ALLOWED_FILES` is a `new Map([...])` array literal. A JS `Map` silently
lets a later duplicate key overwrite an earlier one at runtime — no syntax
error, no test failure, since `findOffenders()` only calls
`ALLOWED_FILES.has(file)`, never checks the source array for duplicate keys.

This happened twice in quick succession while landing `tsk-2au`:
1. Two concurrent sessions (`main` and branch `fgw/tsk-2au`) both added an
   entry for `docs/history/tsk-2au-.../plan.md` at different, non-adjacent
   positions in the array — git's 3-way merge applied both cleanly (no
   conflict, since the hunks didn't overlap), producing a real duplicate
   key. Caught only by manual `grep -c` before merging, not by the test
   suite.
2. Same shape again: `fgw/tsk-1vi`'s later merge re-added an entry for
   `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md`,
   already covered by `tsk-2au`'s own `FROZEN_PHRASE_PATTERNS`. Not a
   duplicate *key* this time (different mechanism, same file), but the
   same root cause: nothing in this test file enforces "every allowlisted
   file is covered exactly one way."

## Approach

Smallest fix that actually catches case 1 mechanically: name the array
literal before passing it to `new Map(...)`, then assert
`array.length === map.size` in a self-check test. A `Map` collapses
duplicate keys, so a length/size mismatch is exactly and only a duplicate
key — no other failure mode produces it. This reuses the exact array
`ALLOWED_FILES` already builds from; no new data structure, no behavior
change to `findOffenders()`/`isDirAllowed()`.

Case 2 (a file covered by more than one exemption mechanism at once —
`FROZEN_PHRASE_PATTERNS` and a redundant `ALLOWED_FILES` entry) is a
different shape (not a duplicate key, a redundant-but-valid entry) and
genuinely harder to catch mechanically without false positives (an entry
can legitimately name a file also caught by a dir-prefix rule today,
intentionally, e.g. as documentation) — out of scope for this item's
self-check; handled here only as the one concrete cleanup this item's own
description named (removing the specific redundant entry already found).

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| Renaming the inline array to a named const changes nothing observable | low | `node --test` re-run after the change — every existing test (including the 3 that read `ALLOWED_FILES` directly) must still pass unchanged |
| Self-check itself could be vacuously true (never actually exercises a duplicate) | low | mirrors the existing self-check pattern (e.g. `IRON_LAW_EVIDENCE_META_CITATION`'s own true-positive/true-negative pair) — a temporary local duplicate-array literal in the test body proves the assertion actually fires before relying on it against the real array |

Impact-analysis: not run — isolated to one test file's own internal
structure, no call-graph question (`impact-analysis: inactive` for this
item's own scope, same as tsk-2au).

Files touched: `test/docs/launcher-vocabulary-guard.test.mjs` only.

## Shape

1. Rename the `ALLOWED_FILES = new Map([...])` literal to
   `ALLOWED_FILES_ENTRIES = [...]` (array, same contents) then
   `ALLOWED_FILES = new Map(ALLOWED_FILES_ENTRIES)`.
2. Remove the current `docs/history/merge-list-tree-bottleneck-priority/
   DISCUSSION.md` entry from `ALLOWED_FILES_ENTRIES` — already fully
   covered by `FROZEN_PHRASE_PATTERNS` (verified: that file's only
   `orchestrator` occurrence is the bare `herdr-orchestrator` phrase).
3. Add one self-check test asserting
   `ALLOWED_FILES_ENTRIES.length === ALLOWED_FILES.size` against the real
   array, with a message naming what a mismatch means. Include a synthetic
   true-positive sub-assertion (a small local array with an intentional
   duplicate key, proving `array.length !== new Map(array).size` in that
   case) so the check is proven to actually fire, not just vacuously pass.

Proof surface: `node --test test/docs/launcher-vocabulary-guard.test.mjs`
(already the item's own `verify`).

## Outstanding questions

None
