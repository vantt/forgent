# CONTEXT: priority-formula's refined pass drops a computeImpact term

Item: `tsk-1r3`. Feature boundary: close the structural asymmetry between
`discovery.mjs`'s rough `computeImpact` call and `decompose.mjs`'s refined
one — the refined pass never supplies `semanticRelatedness` at all, unlike
the rough pass.

## Locked decisions

**D1 — Scope is the structural parity, not the observed 449→10000
collapse.** `RESEARCH.md` found `verdict.impactScore` (what the rough
pass's `semanticRelatedness` reads) is never actually populated by the live
`callerVerdict` path — the old subprocess-judge path that might have set it
was retired (tsk-1x3). So `semanticRelatedness` carries no real data to
lose today; the item's own dramatic real-log examples (`tsk-4y8: 449 ->
10000`) are driven by `blocks` (from `rankImpact(view)`) genuinely changing
between the two live reads, a legitimate graph-state difference, not a term
being dropped. Fixing the two call sites' parameter parity is still a real,
independently-worth-fixing correctness smell (two writers of the same
computed value should agree on what they compute from) — but it does not,
by itself, prevent a `blocks`-driven regression. Decided to ship the
parity fix as its own honest piece, and name the `blocks`-recomputation
question as a flagged assumption (D2) rather than pulling it into this
item's scope.

**D2 — Assumption, not fixed here.** Whether `decompose`'s refined pass
SHOULD re-derive `blocks` fresh from the live graph (today's behavior) or
carry forward the value the rough pass computed, is a separate, larger
design question (does "refined" mean "recompute from current graph state"
or "refine what was already known") — flagged for a future item, not
decided or fixed by this one.

## Pinned terms

None beyond what `priority-formula.mjs`'s own header already pins.

## Scout evidence

- `src/intake/plan.mjs:610-617`, `src/intake/discovery.mjs:289-294`,
  `src/state/replay.mjs:299-309` — read in full, cited in `RESEARCH.md`.

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `RESEARCH.md` (this feature's own discovery-stage round)

## Outstanding questions

None
