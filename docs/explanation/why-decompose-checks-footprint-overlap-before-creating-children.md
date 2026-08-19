# Why `decompose` checks footprint overlap before creating children

`decompose.mjs` used to write a predicted `footprint` field for each
proposed child (lines 156–194 at time of filing) without ever calling
`footprintOverlapAmong`/`footprintConflicts` — functions that already
existed in `graph-metrics.mjs`/`store.mjs`, already used by
`mergeReadiness` and the read-only `/fgOS:conflicts` skill — to check
for overlap *before* the children were actually created. The
consequence: `decompose` could freely spawn two parallel children whose
predicted footprints already collided at the moment of splitting,
dumping the entire risk onto merge time later.

## The direction this reverses

Worktree-creation strategy (topology, fork timing, avoiding footprint
overlap between concurrently open worktrees) directly affects how hard
merging will be later — the same lifecycle `tsk-3hk`/`tsk-3bn` were
addressing from the merge side. `tsk-3bn`'s own drift incident was
itself a direct consequence of a topology decision made at
worktree-creation time (forking from a stale point, main advancing too
far ahead, forcing a careful rebase/cherry-pick later instead of a
straight merge). External research was cited as corroborating evidence:
a 41.7% cross-agent conflict rate attributable to footprint overlap
between concurrently open worktrees. This item closes the same class of
problem from the *creation* side instead of the merge side.

## Why no new dependency was needed

`footprintOverlapAmong` already existed and was directly reusable for
this exact pairwise-candidate shape — no new field, no schema change,
and explicitly not blocked on `tsk-3hk`'s own new fields
(`mergeAfter`/tier), since this check never touches them.

## The fix

```js
// tsk-5e97 D1: check declared footprint overlap among the TENTATIVE
// children (real ids, no work-item records yet) before any of them is
// written -- footprintOverlapAmong already exists for exactly this
// pairwise-candidate shape (merge-standardization D4-revised). No
// bypass-detection constant here (unlike keywordRiskGate/
// blastRadiusGate below): those gate on a static property of the root
// item that never changes call to call, so without a bypass a human's
// `fgos answer` would re-park on the identical reason forever. This
// check is re-derived from the FRESH model verdict every call -- once a
// human's answer leads the next judgeDecompose call to propose
// non-overlapping children, it passes on its own.
const footprintCandidates = verdict.children.map((child, index) => ({ id: childIds[index], footprint: child.footprint }));
const footprintConflicts = footprintOverlapAmong(footprintCandidates);
if (footprintConflicts.length > 0) {
  const reason = formatFootprintOverlapReason(footprintConflicts);
  logDecomposeVerdict(dir, id, 'need-human', reason, `${footprintConflicts.length} footprint conflicts`);
  putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason), statusAtAsk: work.status });
  return { outcome: 'need-human', id, verdict };
}
```

The check runs on the **tentative** children — real ids already computed
(`${work.id}-<n>`), but no work-item records written yet — so a
conflict is caught before any child exists at all.

## Park, never auto-resolve

The chosen resolution (D1) is a park to `need-human`, listing conflicting
pairs and suggestions — the exact same pattern `keywordRiskGate`/
`blastRadiusGate` already use elsewhere in the same file. It never
auto-merges the conflicting children into one or auto-picks a nested
topology on its own; a person decides.

## Why this gate needs no bypass constant, unlike its siblings

`keywordRiskGate`/`blastRadiusGate` gate on a static property of the
*root* item — something that never changes from one `judgeDecompose`
call to the next, so without an explicit bypass mechanism, a human's
`fgos answer` would park on the identical reason forever. This
footprint-overlap gate doesn't need that: it's re-derived from a
*fresh* model verdict on every call. Once a human's answer steers the
next `judgeDecompose` call toward proposing non-overlapping children, the
check simply passes on its own — no separate bypass constant required.

## The same rule, applied live by a session instead of the automatic gate (`tsk-36i`)

The gate above fires inside `judgeDecompose`'s own model-backed pass. A
session reasoning live at `decompose` (a caller-supplied pass-through
verdict, not a `judgeDecompose` call) hits the identical footprint-overlap
fact and has to apply the same rule itself, with no gate to catch it
automatically.

`tsk-36i` — a read-only, multi-area project scan producing one ranked
findings report — considered and rejected splitting into six per-area
fgOS child items, for exactly this reason:

> "Một sáu-way split into fgOS child items was considered and rejected --
> every child would carry its own worktree and human merge gate for a
> read-only investigation that changes no code, and all six would declare
> the same single report file as footprint, which
> `src/intake/plan.mjs:741`'s `footprintOverlapAmong` flags as a real
> sibling collision."
> — real `work.decision` capture, id `tsk-36i`

The resolution kept the parallelism the item actually wanted — several
independent scan agents fanning out by area — but at the *agent* level
inside a single `executing` stage, not as separate fgOS backlog children
each racing to write the same report file. Real findings that warranted
their own follow-up work were filed afterward as new, separate items, one
per evidence-backed finding, rather than as pre-declared children that
would have collided on footprint before any of them had real content to
split by.

This is the same lesson the automatic gate above encodes, reached the
same way a human reviewing a proposed split would: two children (or six)
that would declare the same file as footprint are a collision waiting to
happen at merge time, whether a person notices it during live planning or
`footprintOverlapAmong` catches it mechanically inside `judgeDecompose`.

A second real instance of the same live judgment: `tsk-1uw`, a docs task
rewriting several sections of one spec file
(`docs/specs/work-state.md`) across five phases, reasoned to the same
conclusion the other direction — not "should I split a scan into six
items" but "should I split a five-phase edit into five items" — and
declined for the identical reason:

> "plan-tsk-1uw.md's Shape section calls this one honest piece: the
> footprint is a single file (docs/specs/work-state.md) and its five
> phases each edit a different region of that same file, so splitting
> would hand every child the same path -- the exact collision
> footprintOverlapAmong exists to prevent."
> — real `work.decision` capture, id `tsk-1uw`

Same rule, same live-session reasoning path, applied to ordinary
multi-phase docs work rather than a read-only scan — confirming this
isn't a pattern specific to `tsk-36i`'s scan-report shape.

## Why this stayed a single, unsplit change

`judgeDecompose` returned pass-through: one file, one function (the
finalize step in `decompose.mjs`), calling an already-existing function
rather than introducing any new schema or field — small and cohesive
enough that splitting it would have added overhead without reducing
risk.
