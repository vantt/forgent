---
item: tsk-4voj
timestamp: 2026-08-02T04:35:00.000Z
---

# CONTEXT: Iron Law leaf-vs-root diff scope

## Feature boundary

`approve`'s Iron Law gate (`bin/fgos.mjs`, hoisted block around line
2074-2089) computes the file set it checks against `MODULE_RULES`
(`src/evolve/iron-law.mjs`) via `changedFiles(repoRoot, item)`
(`src/runner/merge.mjs:316-330`), which defaults to
`git diff --name-only <trunk>...<branch>`. For a leaf item whose parent
root branch (`fgw/<rootId>`) has already absorbed a sibling's merge, this
diff inherits every ancestor commit's files as if they were the leaf's
own — `classifyIronLaw` then fires on modules the leaf's own commits never
touched, and the evidence-file lookup
(`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D3, keyed to
the leaf's own id) can't find the ancestor's real evidence even though it
exists on the same branch. Live-reproduced 2026-07-30 on `tsk-52g-2`.

This item's scope is narrowly: make `changedFiles`'s diff base for a leaf
match the leaf-vs-root split the codebase has already locked and applied
everywhere else a runner item's branch base matters. It does not touch
the evidence-file contract, the Merge Conductor design (harness v2, still
unfiled), or any of the other 15 items in the adjacent research report —
those are explicitly out of scope, cited only as evidence below.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `changedFiles`'s Iron Law caller (`bin/fgos.mjs`'s hoisted Iron Law block) must apply the same D3 leaf-vs-root split already implemented at 4 other call sites in the same file: `resolveRoot(view, id)` resolves the item's lineage root; when `rootId !== id` (a leaf), pass `opts.trunk: branchNameFor(rootId)` into `changedFiles` so the diff base is the leaf's real parent-root branch, not blind trunk. A root item (`rootId === id`) is unaffected — keeps today's trunk diff, byte-for-byte. |
| D2 | This fix does not touch the evidence-file lookup path (`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D3). With D1's correct scoping, an ancestor's already-merged-but-not-yet-landed modules no longer appear in a leaf's own `matchedModules` for the inherited-file case this item describes — the false-positive this item reports is closed at its source (wrong diff base), not by adding an ancestor-evidence-chain walk. A leaf's own genuine Iron Law hit (its own commits actually touch a gated module) is unaffected and still requires its own evidence, unchanged. |
| D3 | If a leaf's resolved root branch (`fgw/<rootId>`) is unexpectedly absent when `changedFiles` runs (an inconsistent state — `bin/fgos.mjs:2156-2158`'s own comment already documents this as "guaranteed to exist by the time a leaf reaches awaiting-approval"), the existing `MergeError` thrown by the git diff call is accepted as-is: `approve` aborts, nothing merges, same fail-closed shape all 4 existing D3 call sites already exhibit. Not a new risk introduced by this fix — this item does not add a fallback-to-trunk branch for that case. |

## Pinned terms

- **Leaf-vs-root D3 split**: the pattern already locked and live at 4
  call sites in `bin/fgos.mjs` — `resolveRoot(view, id)` walks
  `item.parent` to the top; a leaf (`rootId !== id`) targets
  `fgw/<rootId>`, a root targets `main`/trunk. This item is the 5th
  application of that same pattern, not a new design.

## Scout evidence

- `bin/fgos.mjs:1968-1975` (`review`, local diff) — `reviewDiff(cwd, item,
  { trunk: branchNameFor(rootId) })` when `rootId !== id`.
- `bin/fgos.mjs:1946-1955` (`review --github`, PR base) — `base = rootId
  !== id ? branchNameFor(rootId) : detectTrunk(repoRoot)`.
- `bin/fgos.mjs:2149-2165` (`approve`, real merge target) — same
  `resolveRoot`-driven split, comment: "D3 leaf-vs-root split: a leaf's
  resolved root is a DIFFERENT item... a root's resolved root is itself."
- `bin/fgos.mjs:2404-2409` (`catchup`, merge target) — same split again,
  comment: "the exact D3/D11 split `approve` already uses."
- `bin/fgos.mjs:2074-2089` (Iron Law gate, the ONE remaining call site) —
  calls `changedFiles(repoRoot, item)` with no `opts.trunk`, the sole gap.
  Its own comment (2064-2069) frames the resulting over-report as "the
  fail-safe direction, accepted as-is" — written before this item's
  live reproduction; superseded by D1/D2 above, not left standing as a
  contradicting decision.
- `src/runner/merge.mjs:316-330` (`changedFiles`) — already accepts
  `opts.trunk` (defaults to `detectTrunk(repoRoot)`); no signature change
  needed, only the caller needs to pass the override.
- `src/runner/root-affinity.mjs:66-78` (`resolveRoot`) — already imported
  in `bin/fgos.mjs` (line 57) and already in scope at the Iron Law call
  site (`view` is available in the same `approve` handler).
- `src/evolve/iron-law.mjs:20-38` (`MODULE_RULES`) — confirms this fix's
  own touched files (`bin/fgos.mjs`, `src/runner/merge.mjs`) are
  themselves gated modules (`prefix: 'src/runner/'`, `equals:
  'bin/fgos.mjs'`) — D4's hard-gate floor in
  `docs/history/gate-bypass/CONTEXT.md` applies, so this item's own
  execution still requires human `--acknowledge-iron-law` with real
  failing-test-first proof; not a bypass-eligible change regardless of
  tier.
- Design context (not this item's own decisions, cited for continuity
  only): `plans/reports/internal-research-260801-1823-merge-mechanism-
  grand-orchestrator-design-report.md` (Family 2, tsk-4voj) and
  `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-
  decisions-report.md` (§G table, sequencing step 1) both independently
  recommend this same "scope to the item's own real diff against its own
  parent" direction — confirmed as already-implemented precedent here,
  not merely a recommendation.
- `impact-analysis: full` — `fgos tool query --capability impact-analysis
  --status present` returned GitNexus `present`; the touched symbols
  (`changedFiles`, the Iron Law block) get a real `impact()` blast-radius
  read before editing, per `AGENTS.md`'s GitNexus gate, once execution
  starts.

## Outstanding questions deferred to planning

- Exact code shape of the one-line `opts.trunk` addition at the Iron Law
  call site (whether `rootId`/`resolveRoot` is computed once and reused,
  or recomputed locally) is an implementation choice, not a product
  decision.
- Test coverage shape (unit test on `changedFiles` with a leaf/root
  fixture, vs an integration test through `approve`) is
  `fgos-coding-planning`'s call.

## References

- `bin/fgos.mjs` (Iron Law gate, `review`/`approve`/`catchup` D3 split
  call sites)
- `src/runner/merge.mjs` (`changedFiles`, `reviewDiff`, `classifySource`)
- `src/runner/root-affinity.mjs` (`resolveRoot`)
- `src/evolve/iron-law.mjs` (`classifyIronLaw`, `MODULE_RULES`)
- `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` (D3 —
  evidence storage keyed by item id; unaffected, see D2)
- `docs/history/gate-bypass/CONTEXT.md` (D4 — hard-gate floor this item's
  own execution falls under)
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-
  orchestrator-design-report.md`
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-
  decisions-report.md`
