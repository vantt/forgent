# tsk-5zg — plan.md

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). One direct file
touched in production code (`bin/fgos.mjs`), one direct test file. No
gray areas, no split candidates.

## Approach

Chosen path (already implemented and proven — this plan documents the
piece that landed, not a forward-looking design): add a
`branchExists`/`createBranchRef` guard immediately after `bin/fgos.mjs`
computes `rootBranch = branchNameFor(rootId)` in the `approve` verb's
leaf->root branch (`bin/fgos.mjs:3422`), before the `merge-base
--is-ancestor` ancestor-check that used to crash raw when `rootBranch`
didn't exist yet:

```js
if (!branchExists(repoRoot, rootBranch)) {
  createBranchRef(repoRoot, rootId, { baseRef: 'main' });
}
```

**Alternatives rejected:**
- Wrapping the `execFileSync('git', ['merge-base', ...])` call itself in a
  broader try/catch that treats any non-1 exit as "not an ancestor" —
  rejected because it would silently swallow OTHER real git failures
  (corrupt repo, permission errors) under the same branch as "not caught
  up yet", losing the fail-loud behavior the surrounding code already
  relies on for genuine errors.
- Duplicating `createDetachedMergeWorktree`'s fallback logic inline
  instead of reusing `createBranchRef` — rejected; `createBranchRef` is
  already the established, idempotent, tested primitive for exactly this
  ("seed a `fgw/<id>` ref from `main` when it doesn't exist yet"), used by
  `sync-root` (`bin/fgos.mjs:3899`) and `createDetachedMergeWorktree`
  (`worktree.mjs:830-834`, tsk-6ch). A third copy of the same three lines
  would be the kind of duplication this repo's own DRY principle argues
  against, and would diverge in behavior over time if only one copy ever
  gets touched again.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `bin/fgos.mjs` approve leaf->root ancestor-check | light | New regression test reproduces the exact original crash (`fatal: Not a valid object name fgw/<rootId>`) when the fix is reverted, and passes with it applied — proven both directions, not asserted. Full `npm test` (3149/3154 pass, 0 fail) and `node --test test/cli/fgos-approve.test.mjs` (64/64 pass) both green with the fix in place. |

No medium/high risk items — this is a narrow, local guard mirroring an
already-shipped pattern (tsk-6ch), not new design.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` reports GitNexus registered and `present`. The index was
found 259 commits behind HEAD before this item started and was rebuilt
fresh (`npx gitnexus analyze`, now current). Despite the fresh index,
`impact`/`context` on `runVerb` (the function containing the touched
code) returns "not found" — a `cypher` query confirms `bin/fgos.mjs` has
**zero** indexed `Function` symbols; the file is too large for GitNexus's
symbol-level parser to cover, a real coverage gap distinct from
staleness. Per the repo's own capability-gate guidance ("a suspicious
zero-result... is worth a quick grep/rg cross-check before being
trusted"), blast radius was confirmed manually instead: `grep -n
"runVerb("` shows exactly one call site outside its own definition
(`bin/fgos.mjs:5077`, the CLI's single dispatch point), and the touched
block calls only `branchExists`/`createBranchRef` — both pre-existing
`worktree.mjs` exports already imported/used elsewhere in the same file
(`branchExists` at 5 other call sites; `createBranchRef`'s own existing
callers were checked via `impact({target: "createBranchRef", direction:
"upstream"})`, which DOES resolve — HIGH risk, 7 impacted symbols, all in
`src/runner/loop.mjs`/`promote-engine.mjs` — none of which are touched by
this change; this item only adds a NEW caller, and `createBranchRef` is
idempotent by design, so existing callers are unaffected). Posture:
**degraded for this one proof point** (tool present and fresh, but this
specific file falls outside its symbol coverage) — compensated by the
manual cross-check above, not left unproven.

## Shape

Single piece, no split. The fix, the regression test, and the verify
command are already real and already proven (see Risk map). Nothing here
needs a phased breakdown — one file changed in production code, one test
added, one command proves both directions.

## Outstanding questions

None
