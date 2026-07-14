# phase-2-routing-5 — `fgos ready` verb + request-class read

**Status:** [DONE]

**Outcome:** Added `store.readyWork(dir) = frontier(rebuildView(logPath))` and wired it as the `fgos ready` verb. Pure read (per D1 request-class): missing log → empty `[]`, exit 0, no `.fgos/` created; corrupt log → exit 5 — same categories as `list`. `bin/fgos.mjs` calls only `store.readyWork`, never imports `frontier.mjs` directly.

**Files touched:** `bin/fgos.mjs`, `src/state/store.mjs`, `test/cli/fgos.test.mjs`, `test/e2e/rebuild-determinism.test.mjs`

**Verify:** `npm test` — 138/138 passed (baseline before this cell: 132/132; before-state captured live: `fgos ready` was unknown verb, exit 4).

Full trace, verify output, and verification evidence: `.bee/cells/phase-2-routing-5.json`.
