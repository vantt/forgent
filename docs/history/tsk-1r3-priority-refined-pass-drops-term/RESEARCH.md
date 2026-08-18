# RESEARCH: priority's refined pass drops a computeImpact term

## Round 1 (tsk-1r3, stage discovery)

**Checked:**
- `src/intake/plan.mjs:610-617` — refined pass calls `computeImpact({
  blocks, blastRadius })`, no `semanticRelatedness` key at all.
- `src/intake/discovery.mjs:289-294` — rough pass calls `computeImpact({
  blocks, semanticRelatedness: Number.isInteger(verdict.impactScore) ?
  verdict.impactScore : 0 })`.
- `src/state/replay.mjs:299-309` — `work.edit`'s fold: `Object.assign(item,
  patch)`, unconditional, comment confirms "unconditional, latest-write-wins
  fold". Matches item's claim exactly.

**Important nuance the item's own framing doesn't spell out (found while
verifying, not assumed):** `verdict.impactScore` — the value
`semanticRelatedness` reads on the rough pass — is **never actually set**
anywhere in the live `callerVerdict` path (`resolveDiscovery`'s normalized
`verdict` object only ever carries `{clear, verify}` or `{clear, question}`
— `impactScore` is not copied from `callerVerdict` at all, confirmed by
reading the full normalization block, lines 205-230). Since the old
subprocess-judge path that might have supplied `impactScore` was retired
(tsk-1x3), `Number.isInteger(verdict.impactScore)` is `false` on every real
call today, so the rough pass's own `semanticRelatedness` is *already*
always `0` in practice — same real value the refined pass would produce
even with the term added.

**What this means for scope:** the item's own headline harm (a
well-informed priority silently regressing to the worst value) is real and
demonstrated by its own log evidence (`tsk-4y8: 449 -> 10000`), but that
regression is driven by `blocks` changing between the two live reads of
`rankImpact(view)` (a legitimate graph-state difference between clarify-time
and decompose-time, not a bug), not by a real semantic-score being dropped
— `semanticRelatedness` carries no live data to lose today. The
**structural asymmetry** (two call sites silently disagreeing on which
parameters they supply to the same function) is still a real correctness
smell worth closing on its own — the fix in scope here is parity between
the two call sites, not a claim that this alone fixes the observed
449→10000 collapse (that collapse is `blocks` changing, a separate,
larger question about whether decompose-time SHOULD re-derive `blocks`
fresh at all — flagged as an assumption in plan.md, not fixed here).

**Verdict:** `{clear: true, verify: "node --test test/state/priority-formula.test.mjs test/intake/plan.test.mjs && npm test"}`
