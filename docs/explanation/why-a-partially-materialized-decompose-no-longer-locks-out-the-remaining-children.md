---
type: explanation
title: Why a partially materialized decompose no longer locks out the remaining children
tags: [resolvePlan, decompose, footprint-overlap, atomicity]
source_capture_ids: [tsk-4n8, tsk-11v]
authoritative_for: why resolvePlan's decompose verdict no longer treats the presence of any one child as proof the whole split already completed
---
# Why a partially materialized decompose no longer locks out the remaining children

`tsk-4n8`. Discovered live while decomposing `tsk-2qc` itself (the
install/setup reliability item — see
`docs/explanation/why-fgos-bin-and-skill-distribution-needed-a-3-tier-self-healing-resolution.md`).

## The bug: "any child exists" was read as "decompose already completed"

`resolvePlan`'s `hasChildren` check (`src/intake/plan.mjs:530,581-584`)
treated the presence of *any* child with `parent === id` as proof the
item was fully decomposed — it moved the parent straight to stage
`executing` and permanently refused any further `--verdict decompose`
call with `outcome: already-decomposed`, regardless of whether the
original `--children` array had ever been fully materialized.

**Live reproduction**: a `--verdict decompose` call with 3 children (one
pair sharing a footprint file, `src/setup/skill-wrappers.mjs`) returned
`outcome: need-human` with a footprint-overlap ask — but the
*non-conflicting* child (index 0) had already been created as a real
work item **before** the ask ever surfaced. Splitting was meant to be
all-or-nothing, but the engine had already partially committed it.

## Why the recovery path was also broken

Adding a `deps` edge to the conflicting child on resubmission did not
satisfy the footprint-overlap check at all — it does not consider `deps`
as a resolution, and the same ask text repeated verbatim. After
answering the ask twice (once with `deps`, once with a genuine re-slice
removing the overlapping file from one child's footprint), every
resubmission of the full 3-child array returned `already-decomposed` —
solely because the first child already existed. There was no supported
way to add the two still-missing children through the decompose path
once any sibling existed.

Manual recovery required creating them via `fgos add --parent` instead —
which has no `--stage`/`--action` flags, so each had to be walked through
`discover`/`plan` by hand rather than being born ready-at-`executing` the
way a normal decompose child is.

## The fix

`resolvePlan` no longer treats a stray existing child as proof the
decompose already completed — the check now distinguishes a genuinely
finished split from one that was interrupted partway (e.g. by a
footprint-overlap ask), so resubmitting the full children array after
resolving the conflict actually creates the remaining, still-missing
children instead of refusing outright.

## Follow-up: the documented "sequence" resolution was never implemented (`tsk-11v`)

`tsk-4n8`'s own discovery pass noticed but deliberately deferred a
second, related gap: `footprintOverlapAmong`
(`src/state/graph-metrics.mjs`) never considered a candidate pair's
`deps` edge at all, so decompose's own footprint-overlap gate flagged two
children as conflicting even when one already depended on the other (and
therefore could never run in parallel to begin with). The documented
resolution options were `FOOTPRINT_CONFLICT_SUGGESTIONS = ['sequence',
'hoist', 're-slice']`, but "sequence" — adding a `deps` edge between the
two conflicting children — was unimplemented for this call site: adding
the edge never satisfied the check, forcing every real resolution through
re-slicing instead, regardless of which fix actually fit the situation.

This was deferred from `tsk-4n8` itself specifically because it wasn't
what blocked that item's real incident (re-slicing already worked there),
and because `footprintOverlapAmong` has two other callers —
`footprintOverlap`'s frontier-only parallel-dispatch advisory, and
`graph-harness.mjs`'s merge-readiness ranking — that a change to shared
logic could affect. **Fix** (`tsk-11v`): the footprint-overlap gate now
honors a declared `deps` edge between two candidates, so "sequence" is a
real, working resolution option alongside "hoist" and "re-slice," not
just documented text.
