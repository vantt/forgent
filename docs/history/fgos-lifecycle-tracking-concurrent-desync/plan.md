# fgos-lifecycle-tracking-concurrent-desync — plan.md

Mode: small

## Approach

RESEARCH.md Round 1 already narrowed this item's real scope: item 1
(write-side event loss) duplicates tsk-46v and is out of scope here; item
2 (`fgos show` vs `fgos list`/`fgos move` read-path inconsistency) is in
scope, and static code reading found no per-verb divergence in the read
path itself (`bin/fgos.mjs:2529` `list`, `bin/fgos.mjs:2745` `show`, both
through `listWork(dir)` → `currentEffectiveView` → `rebuildViewFromDir`,
`src/state/replay.mjs:952-956`, whose T4 incremental fast path fails safe
"wrong-in-doubt" on every branch it checks).

Files touched: one new test file only — this is a proof-of-(non)existence
task, not a known fix. No production code is expected to change unless
the new test actually reproduces a real divergence, in which case the fix
target is whichever specific function the reproduction implicates (most
likely `src/state/replay.mjs`'s `tryIncrementalRebuildFromDir` or
`src/state/store.mjs`'s `currentEffectiveView`/`readClaims`, per
RESEARCH.md's read-path trace) — named here as the most likely spot, not
assumed in advance.

Risk map: light. The test only reads existing state through already-public
verbs (`show`/`list`/`move` equivalents called as library functions, or
via `fgos` CLI subprocess calls) around a real `approve`-style merge +
refresh sequence; it does not touch production code unless a real bug
surfaces. `fgos graph --json`'s `criticalPath`/`topUnblock` were not
consulted — this item has no dependents and sits off any critical path
(a leaf bug-investigation item), so the check would add no information.

## Shape

1. Write `test/state/show-list-move-consistency.test.mjs`: build a
   temporary `.fgos/` store fixture (reusing this repo's existing test
   helpers under `test/state/` for store setup — check `test/state/*.test.mjs`
   for the shared fixture pattern before inventing a new one), drive an
   item through a status transition that mimics `approve`'s
   merge-commit-plus-state-refresh shape, and immediately call the three
   read paths (`show`'s equivalent — `listWork` + the same shape `show`'s
   handler builds; `list`'s equivalent; `move`'s own precondition read)
   against the same store, asserting all three report the same
   `stage`/`status` for the same item.
2. Run it. Two honest outcomes, both real proof, neither a silent no-op:
   - **No divergence reproduces** — the test still lands as a permanent
     regression guard (asserts the three read paths agree), and the item
     closes with RESEARCH.md's own conclusion confirmed empirically: the
     original tsk-38i report was very likely a call-timing artifact, not
     a code bug. Verify passes as written; nothing else changes.
   - **A real divergence reproduces** — trace it to the specific function
     via the failing assertion + the read-path map already in
     RESEARCH.md, fix that function, and keep the same test (now a real
     regression guard for a real fix) as this item's proof.

## Outstanding questions

None.
