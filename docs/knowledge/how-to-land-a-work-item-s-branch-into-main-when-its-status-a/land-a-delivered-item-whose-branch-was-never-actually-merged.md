---
type: how-to
title: Land a delivered item whose branch was never actually merged
tags: [delivered, orphaned-branch, land, approve, status-machine]
source_capture_ids: [tsk-1l9]
authoritative_for: how to land a work item's branch into main when its status already reads delivered but the branch was never actually merged
framework: diataxis
mode: how-to
---
# Land a delivered item whose branch was never actually merged

Some items reach `status: delivered` by a hand-run `work.move` (role
`human`, no friction, no merge commit) instead of `fgos approve` — the
status machine says landed, but `git merge-base --is-ancestor
fgw/<id> main` is still `false`. Two confirmed real cases: `tsk-64h` and
`tsk-2t5` (verified 2026-08-12), both `ahead: 2` of `main` despite
reading `delivered`. This is not theoretical: `tsk-2t5`'s own three
verify clauses failed on `main` for real, because the spec it was
supposed to have updated (`docs/specs/runner.md`) still carried the
old, dead 22-status vocabulary the item's own branch had already fixed.

## Diagnose

```bash
git merge-base --is-ancestor fgw/<id> main
```

Non-zero exit (not-an-ancestor) on an item whose status already reads
`delivered` is the signature. Confirm the branch really carries the
missing work — read its diff against `main` — before assuming this
playbook applies.

## Fix — the precedent this follows (`tsk-13z`)

**Never rewrite the item's own status machine backward.** The item
already reads `delivered`; do not move it back to `awaiting-approval` or
any earlier status to force it through `approve` again. Instead:

1. From the recovering item's own branch, merge the orphaned branch(es)
   in directly: `git merge fgw/<orphaned-id>`.
2. Resolve whatever conflicts surface at ordinary merge time (in the
   two real cases: `tsk-64h` needed one import line reconciled in
   `bin/fgos.mjs` — changed independently by `tsk-19m` — plus
   `CHANGELOG.md`; `tsk-2t5` merged clean with zero conflicts).
3. Land through the normal `fgos approve` path on the recovering item's
   *own* branch, exactly like any other change — the orphaned code rides
   along as part of this item's own diff.

The orphaned items' own status stays `delivered` throughout; only their
code catches up to what their status already claimed.

## Why this matters beyond the two branches themselves

Left unfixed, this keeps two audit-flagged instabilities open:

- **Pool/engine dual-source-of-truth** — the work pool says `delivered`,
  the engine's own git ancestry says otherwise, so anything trusting
  status alone (a spec, a report, another item's `deps` check) is reading
  a fact that isn't real yet.
- **Stage invariant drift** — a spec document can keep teaching a dead
  vocabulary (in this real case, `docs/specs/runner.md` still described
  a 22-status lifecycle a locked `discoverableStages` change had already
  retired everywhere else) simply because the commit that was supposed to
  retire it never actually reached `main`.

## What to check before assuming this is safe

Grep for the vocabulary or symbol the orphaned branch was supposed to
introduce (in this case, `discoverableStages` usage sites and the string
`work-stage-vocabulary`) across `src/`, `bin/`, and `test/` — a `0`
result while the item reads `delivered` is corroborating evidence that
the code genuinely never landed, not a coincidence.
