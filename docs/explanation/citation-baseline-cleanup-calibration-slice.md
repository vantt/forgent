---
authoritative_for: citation-format baseline cleanup calibration slice, check-decision-citation-drift baseline backlog scoping, bare-citation vs d-local-outside-home fix effort
---

# Scoping a 1788-finding cleanup backlog: the calibration-slice lesson

`check-decision-citation-drift.mjs` (`tsk-37i`) ratchets against a
checked-in baseline — it blocks *new* citation-format violations but never
forces the pre-existing backlog down. That backlog had grown to 1788
findings across 73 files (legitimately, via `tsk-1lv-4`'s grandfathered
ADR-narrative migration) with no item ever owning the actual fix — only
the baseline's own bookkeeping had been kept honest.

## Two very different fix kinds hiding inside one number

- **`bare-citation`** (370 of 1788, 21%) — an `ADR<n>`/`RUL<n>` id cited
  with no one-line gloss. Fix: add `"<ID> (<one-line gloss>)"`. Needs real
  understanding of the id to write an accurate gloss, but mechanical in
  shape — one edit, one place.
- **`d-local-outside-home`** (1418 of 1788, 79%) — a `D<n>` id (local to
  one `CONTEXT.md`) cited outside its own home file. Per the checker's own
  documented fix contract, the *only* correct fix is inlining the actual
  decision content at the citing location and deleting the id — a real
  read-and-rewrite per occurrence, not a template insert.

## Why "top 2-3 files" from the item's own description got narrowed further

Planning picked the single largest file (`docs/specs/work-state.md`, 425
findings, 23.8% of the total) instead of the description's suggested 2-3
files — already halving the risk surface to one file / one commit.
**Validating's reality gate found an even smaller honest path**:
`work-state.md`'s 425 findings were not one uniform kind — 124
`bare-citation` (mechanical shape) and 301 `d-local-outside-home` (genuine
research+rewrite). Lumping both into one child would have muddied the
exact signal the item's own description asked for — "how long each
occurrence actually takes" can't be read cleanly off an average of two
very different effort profiles. The child was narrowed to
`bare-citation` findings in `work-state.md` only (124 findings), deferring
that same file's 301 `d-local-outside-home` findings to the same
follow-on planning round as the other 72 files — a single-kind-then-defer
split that also sidesteps a same-file footprint collision a second
concurrent child would have risked.

## The general lesson

When a cleanup backlog check reports one aggregate number, look for
distinct fix-effort kinds hiding inside it before scoping a first slice.
"Pick the biggest file" is a reasonable first cut, but a single file can
still mix a mechanical fix kind with a genuine-judgment fix kind — narrow
to one kind within that file if the goal is a clean calibration signal for
planning the rest, not just "make progress." This is the same "smallest
honest plan" discipline `fgos-coding-validating`'s reality gate exists to
catch — it caught a scope that was locally reasonable but not yet the
smallest honest step, at the plan-then-validate boundary rather than
after code was already written.

## What actually landed, and current state

This item (`tsk-2yu`) itself specced exactly one child
(`tsk-2yu-1`: fix the 124 `bare-citation` findings in
`docs/specs/work-state.md`), deliberately leaving 1664 findings
unspecced pending that slice's real numbers. As of this synthesis, the
live baseline (`scripts/check-decision-citation-drift.baseline.json`)
totals **249** findings (220 `d-local-outside-home`, 29 `bare-citation`)
— down from 1788, and `work-state.md`'s own entry is now empty. That drop
is far larger than this one item's own scope covers, meaning follow-on
work beyond `tsk-2yu`/`tsk-2yu-1` continued the backlog paydown; those
later items are not this synthesis's to detail.
