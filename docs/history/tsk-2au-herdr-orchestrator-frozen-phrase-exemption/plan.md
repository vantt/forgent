---
type: plan
title: tsk-2au — herdr-orchestrator frozen-phrase exemption
tags: []
source_capture_ids: [tsk-2au]
---

# tsk-2au — herdr-orchestrator frozen-phrase exemption

Mode: small (1 flag: "existing covered behavior" — touches
`test/docs/launcher-vocabulary-guard.test.mjs`'s own tested exemption
logic; no auth/data-model/audit/external-system/public-contract/
cross-platform/multi-domain flags apply, and this recurred pattern
already has a proven precedent to follow, so no gray area).

No `CONTEXT.md` exists for this item — intent was clear at `clarify`
(fgos-clarifying verdict, this session) and the shape below is dictated
entirely by an existing, already-proven precedent in the same file
(`IRON_LAW_EVIDENCE_META_CITATION`, tsk-2lg), not a product decision that
needed Socratic locking.

## Problem

`"herdr-orchestrator"` — tsk-2xt's own item nickname (its title starts
with this exact phrase) — has now tripped
`test/docs/launcher-vocabulary-guard.test.mjs`'s NEGATIVE assertion twice,
each time in a *different* item's own history doc that legitimately cites
tsk-2xt by name:

1. `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` (existing
   `ALLOWED_FILES` entry, line 93)
2. `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md`
   (tsk-3cs; allowlisted directly in `13bfee1`, ahead of this item, to
   unblock `npm test` immediately — this item now generalizes that fix so
   a third occurrence never needs its own hand-added line)

This is the same shape tsk-2lg already solved once for
`docs/history/<id>/iron-law-evidence(-<suffix>).md`: a *structural*
recurrence (any file that names tsk-2xt necessarily quotes this phrase),
not an incidental one-off — "already happened 6 separate times" is
literally tsk-2lg's own comment for its case; this is the same reasoning
at 2 occurrences and counting.

## Approach

`IRON_LAW_EVIDENCE_META_CITATION` is the wrong *shape* to copy directly —
it is a **path**-based regex (any file matching a fixed directory/filename
shape is exempt, regardless of content). `"herdr-orchestrator"` is not a
path, it is a **phrase** that can legitimately appear inside any file's
prose, present or future. The file already has the right mechanism for a
phrase-shaped exemption: `FROZEN_FILENAMES` / `FROZEN_PATTERNS` /
`stripFrozenFilenames()` (lines 40–55, 128–132) already do exactly this —
hyphen-segment matching tolerant of word-wrap/comment-continuation gaps —
for two frozen decision-doc filenames. `"herdr-orchestrator"` is a
2-segment hyphenated phrase with the identical shape, so it reuses that
same regex-building logic, not a new mechanism.

Verified before writing this plan (not guessed) — every existing
`"orchestrator"` occurrence in both files that ever tripped the guard over
this phrase:

- `merge-list-tree-bottleneck-priority/DISCUSSION.md`: **one** occurrence,
  exactly `"herdr-orchestrator"`. A frozen-phrase strip fully clears this
  file — its `ALLOWED_FILES` entry (added in `13bfee1`) becomes a stale
  duplicate once this lands, same as tsk-2lg's own 6 removed entries, and
  should be removed here.
- `fgos-terminal-close-autoclose/CONTEXT.md`: **five** occurrences — one is
  `"herdr-orchestrator"` (line 3), the other four are unrelated senses
  already named in its own `ALLOWED_FILES` reason (`"an unattended
  orchestrator"` ×2, industry sense; `PaneOrchestrator` ×2, the Rust
  trait). A frozen-phrase strip does **not** fully clear this file — its
  `ALLOWED_FILES` entry must stay, for those other four occurrences.
  Its reason string should be tightened to drop the now-redundant
  `"herdr-orchestrator"` clause, so the entry's stated reason matches what
  is actually still doing the gatekeeping work.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| New frozen-phrase list under-matches (misses a wrapped/commented occurrence) | low | existing `WRAP_GAP` tolerance already covers this — reuse verbatim, don't re-derive |
| New frozen-phrase list over-matches (silently hides a real future regression) | low | the phrase is a 2-word proper-noun compound (an item nickname), never how the guard's own POSITIVE tests define the pinned role (`"the orchestrator decides which rootTask..."` — bare word, no `"herdr-"` prefix); a self-check test (below) locks this boundary the same way `IRON_LAW_EVIDENCE_META_CITATION`'s own self-check test does |
| Removing the `DISCUSSION.md` `ALLOWED_FILES` entry leaves it un-exempted if the new frozen-phrase regex has a bug | low | verify command re-runs the full NEGATIVE test against real tracked files, not just the self-check — a regex bug would show up as the same red this item is fixing |

Impact-analysis capability gate: not run — this change is isolated to one
test file's own internal exemption logic, no blast-radius/call-graph
question applies (`impact-analysis: inactive` for this item's own scope).

Files touched: `test/docs/launcher-vocabulary-guard.test.mjs` only. No
split — one honest, small piece of work.

## Shape

In `test/docs/launcher-vocabulary-guard.test.mjs`:

1. Add a `FROZEN_PHRASES` list (`['herdr-orchestrator']`) near the existing
   `FROZEN_FILENAMES`, with a comment citing tsk-2au, the 2 real recurrences,
   and the "structural not incidental" reasoning above (same citation
   discipline every existing comment in this file already uses).
2. Build `FROZEN_PHRASE_PATTERNS` the same way `FROZEN_PATTERNS` already
   does (reuse `WRAP_GAP`, same segment-join logic) — do not duplicate the
   regex-building expression inline; factor it so both lists share it.
3. `stripFrozenFilenames()` strips both `FROZEN_PATTERNS` and
   `FROZEN_PHRASE_PATTERNS` before the `WORD` test runs (same function,
   both pattern sets, since both are "strip this frozen text before
   checking for real drift-back").
4. Remove the `docs/history/merge-list-tree-bottleneck-priority/
   DISCUSSION.md` line from `ALLOWED_FILES` (added in `13bfee1`) — now a
   stale duplicate.
5. Tighten `fgos-terminal-close-autoclose/CONTEXT.md`'s `ALLOWED_FILES`
   reason string to name only its remaining (non-`herdr-orchestrator`)
   justification.
6. Add one self-check test (same shape as the existing "NEGATIVE
   self-check" tests) asserting: (a) `"herdr-orchestrator"` strips to
   empty via `stripFrozenFilenames`, (b) a bare `"orchestrator"` — no
   `"herdr-"` prefix — still trips `WORD` after stripping, so the pinned
   role itself stays caught.

Proof surface: `node --test test/docs/launcher-vocabulary-guard.test.mjs`
(already the item's own `verify`) — covers the real NEGATIVE test against
tracked files (both real files: no offenders left), every existing
self-check (unchanged behavior), and the new self-check above.

## Outstanding questions

None
