# RESEARCH — tsk-13r (validateApprove gate's tier-ceiling floor asks even when feasibility resolved)

## Round 1 — 2026-08-20 (discovery stage)

**Asked:** Does the codebase already have any signal/mechanism for tracking
"recent same-session decision/gate-approve density" on a work item — the
thing option (b) in tsk-13r's description proposes reusing? And are there
existing tests/docs constraining how far `gate-bypass.mjs`'s D9
monotone-escalate-only property can be extended?

**Checked:**

- `rg -i "decision.{0,20}density|engagement|same.session" src docs --glob
  '*.{mjs,cjs,md}'` — no hits for any existing "engagement recency" or
  "decision density" signal computed anywhere in `src/`. The only
  "same-session" hits are prose in unrelated history docs (worktree
  locking, dispatch concept boundary) — nothing that tracks per-item
  decision/gate-approve recency as a reusable input.
- `src/state/gate-bypass.mjs:184-238` — read directly. `canAutoApproveMergedGate`
  (the current `validateApprove` gate function) takes exactly four inputs:
  `item`, `planText`, `childSpecs`, `costVerdict`, `level`. No fifth
  "engagement" input exists. Its own doc comment (line 211-215) states the
  **load-bearing property**: "every one of them can only push toward ASKING,
  never toward silence. That monotone direction is what makes the
  self-reported `costVerdict` axis safe where `gate-bypass` D2 refused one."
- `test/state/gate-bypass.test.mjs:266-331` — confirms exactly four tested
  axes (hard-gate keyword / tier ceiling / open items in plan / cost
  verdict), each with its own "never approves, regardless of X" test. No
  fifth axis, no engagement/recency test scaffolding exists today.

**Found:** Option (b) as literally worded in tsk-13r's description
("without weakening the floor's monotone-escalate-only property") is in
tension with itself. D9's whole point is that every axis can only push
**toward** asking, never away from it — that's what currently makes
`costVerdict` (a self-reported, unverified session judgment) safe to trust
at all. The friction being reported is the opposite direction: the item
wants the gate to ask **less** when prior engagement was high. A new
"engagement density" axis that only ever escalates toward asking cannot
also be the mechanism that suppresses an ask — those are opposite
directions on the same axis. Making option (b) actually solve the reported
friction would mean either (i) inventing a *second*, non-monotone gate
that runs before/alongside the D9-monotone one (a materially different
shape than "add a signal" implies), or (ii) revisiting D9 itself, which is
a locked design law (`docs/platform-foundations.md` / gate-bypass D9),
carrying a materially higher review bar than a mechanical fix.

**Still open (belongs to a person, not this research pass):** whether the
friction is worth resolving at all, and if so, which of (a) accept as-is,
(b)-revised (a genuinely new, deliberately non-monotone pre-gate — not the
same shape as literally described), or (c) something else, is the right
call. Not decided here — this is a product-priority trade-off
(AGENTS.md priority #2 "Release con người" vs. D9's safety property),
exactly the kind of call `fgos-coding-discovering`'s own charter reserves
for a person at `exploring`.
