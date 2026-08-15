# Research log — tsk-2y4

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** Does tsk-5tm's own plan/scope (parent item, "capacity/executor
redesign", status todo/executing) say whether an equivalent to the removed
`gather` capacity will be restored later, or is its removal (tsk-5tm-2,
delivered) intentional and permanent with no successor planned? Needed to
decide whether `test/runner/dispatch.test.mjs`'s failing assertion
(`capacities.gather must exist`) should be updated now, or should wait for
tsk-5tm's redesign to land.

**Checked:**
- `fgos list --id tsk-5tm --json` — full decision log (D1–D12) and child
  decomposition (6 children).
- `test/runner/dispatch.test.mjs:645-659` — the failing test block and its
  immediate neighbor.
- `.fgos/config.json` — committed runner config, `rg gather` → no match.

**Found:**
- tsk-5tm D6 (`fgos list --id tsk-5tm --json`, decisions[]): "xoa capacity
  gather khoi .fgos/config.json" — rationale states gather was the only
  cross-provider path, no architectural decision ever recorded why it was
  needed; the one real reason it existed (parallelization) is already
  covered by the native Task tool; removal is explicitly framed as "revert
  ve hanh vi truoc tsk-2ie5" (revert to pre-tsk-2ie5 behavior). No
  successor capacity is named anywhere in D1–D12.
- tsk-5tm's 6-child decomposition (from `gates.tsk-5tm.ask`): child #2
  "Remove gather capacity, its tool-registry entry, and dead references"
  is exactly tsk-5tm-2, already `delivered` (matches tsk-2y4's own
  description). None of the other 5 children (retire `needs` field,
  execute subcommand, fgos-fanout wiring, executor-keyed registry
  restructure, provider-keyed model/tier policies) reintroduce or restore
  a `gather`-purpose capacity — the closest, child #5 (registry
  restructure to executor-keyed `invocations[]`), changes the *shape* of
  remaining entries, not whether a gather-purpose entry exists.
- `.fgos/config.json` confirmed: no `gather` key present — matches the
  test's actual failure (`capacities.gather` is `undefined`).
- Direct precedent already exists in the same test file at
  `test/runner/dispatch.test.mjs:645-648`: a sibling test for a different
  retired capacity (`coding-classify-intake`, tsk-49u) already follows the
  correct pattern — assert the capacity is `undefined` with a rationale
  string citing what retired it, instead of asserting the old shape.

**Verdict: clear.** Gather's removal is a locked, permanent design decision
(tsk-5tm D6), not a placeholder waiting on tsk-5tm's redesign. The failing
test is stale and should be rewritten to assert `capacities.gather` no
longer exists (mirroring the `coding-classify-intake` precedent at
line 645), not deleted-with-no-replacement and not left waiting.

**Verify:** `node --test test/runner/dispatch.test.mjs`
