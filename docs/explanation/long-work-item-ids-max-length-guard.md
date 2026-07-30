---
type: explanation
source_capture_ids: [tsk-3tk]
---

# Why `fgos add` now caps a work item's id at 30 characters

`fgos add <id> ...` takes `id` straight from the caller's positional
argument with no auto-generation and, until this fix, no length bound —
only `ID_PATTERN`'s kebab-case shape check. That gap is why some work
items ended up with ids that read like an entire slugified title instead
of a short identifier: `choke-point-createworktree-callsite-wrapper` (43
chars), `bo-hardcode-ten-trunk-main-trong-merge-e-5i0` (44 chars). A scan
of `.fgos/events.jsonl`'s `work.add` events with `payload.id.length > 20`
found 8 such items, none carrying a `writer` field (unlike later
`work.move` events on the same ids) — consistent with a caller typing the
full title straight into `--id` rather than choosing a short one.

## Why `add` had this gap and `submit` didn't

`fgos submit` never has this problem, by construction: it derives a title
via `deriveTitle` (capped at `TITLE_MAX_LENGTH = 60`) and then a
*separate*, always-short id via `generateId` — a fixed `tsk-` prefix plus
a 3-8 char base36 hash suffix, so a `submit`-created id is always ≤12
chars. `add` has no equivalent generator at all; the id argument is the
literal string the caller typed, unfiltered except for the kebab-case
pattern. There is no `encode(title)` function anywhere in the codebase —
the long ids were never produced by some slugifying helper; they're just
what a caller wrote by hand into `--id`, most plausibly by copy-pasting or
paraphrasing the title itself because nothing pushed back on the length.

## Why the fix is a hard reject, not a warning or auto-truncation

The chosen shape adds a `MAX_ID_LENGTH` constant and check to
`validateWorkShape` (`src/state/work.mjs`), right alongside the existing
`ID_PATTERN` check — same single validation entry point both `addWork`
and `patch` already call, no new write door, no new event type. A hard
reject at write time (rather than silently truncating, or merely warning)
matches how `ID_PATTERN`'s own kebab-case check already behaves for a
malformed id: fail loud, immediately, before anything is written, rather
than let a degraded value into the log that someone has to notice and
clean up later. Truncation was rejected specifically because a
mechanically truncated id is worse than an explicit error — it produces a
*different*, still-arbitrary id the caller never chose and may not
recognize.

## Why 30, specifically

The threshold isn't a round-number guess — it's read directly off the gap
in the real data found during diagnosis. The 8 existing long ids split
cleanly into two clusters:

| id | length | cluster |
|----|--------|---------|
| `doc-fgos-rollup-howto` | 21 | acceptable |
| `loai-tru-data-dir-39c` | 21 | acceptable |
| `str89-case-study-executing` | 26 | acceptable |
| `them-view-rollup-theo-bo-cho-item-goc-6ct` | 41 | offending |
| `choke-point-workingtree-clean-duplication` | 41 | offending |
| `choke-point-take-vs-pick-claim-eligibility` | 42 | offending |
| `choke-point-createworktree-callsite-wrapper` | 43 | offending |
| `bo-hardcode-ten-trunk-main-trong-merge-e-5i0` | 44 | offending |

The acceptable cluster tops out at 26 characters; the offending cluster
starts at 41 — a 15-character gap with nothing in it. A cap of 30 sits in
that gap: it rejects every observed bad id and none of the observed good
ones. It's also generous relative to what a deliberately short id looks
like in practice — `generateId`'s own output tops out at 12 characters,
and `ID_PATTERN`'s own error message uses `add-login-form` (15 chars) as
its example of a well-formed id — so 30 leaves clear room for a real,
readable, hand-chosen id without being loose enough to let a slugified
title back in.

## Why existing long ids were left alone

`validateWorkShape` is only called from two write paths —
`addWork`/`patch` — never from replay (`listWork` → `rebuildView`).
Adding a length check there only blocks *new* `fgos add` calls; the 8
existing long-id items keep replaying and functioning exactly as before.
Migrating or renaming them was deliberately left out of scope: a work
item's id has graph-wide ripple (every `deps`/`parent` reference to it)
that a rename would have to chase down, and nothing about this fix
required touching history to be correct — it only had to stop the
gap from growing.

## What this means for the next person adding a new id-touching write path

`fgos submit`'s id generation and `fgos add`'s id validation are two
independent surfaces that happen to converge on the same
`validateWorkShape` gate — they were never unified into one generator.
Any future write path that accepts a caller-supplied id (not a
`submit`-style generated one) needs to go through `validateWorkShape` (or
carry an equivalent length + shape check of its own) rather than assume
the kebab-case pattern check alone is sufficient — a syntactically valid
id can still be an entire title in disguise.
