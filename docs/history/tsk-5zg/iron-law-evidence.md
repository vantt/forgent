# tsk-5zg — Iron Law evidence

Item: `tsk-5zg` — `bin/fgos.mjs`'s `approve` verb crashes with a raw git
fatal error instead of falling back gracefully when a leaf's root branch
(`fgw/<rootId>`) doesn't exist yet.

## Classification

`classifyIronLaw` against the real committed `main...fgw/tsk-5zg` diff:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

No `matchedFlags`. `bin/fgos.mjs` is a self-modifying-capable module
(the CLI this whole workflow runs through), which is why this item's own
diff trips the Iron Law even though the change itself is a narrow,
2-line guard.

## Verify command

```
node --test test/cli/fgos-approve.test.mjs
```

## Failing before (real transcript, captured by stashing the fix mid-session and re-running)

```
✖ approve of a leaf whose root branch was never created (root only ever driven by a live session/pick, never the runner dispatch loop that creates fgw/<rootId> early per D17): falls back to creating it from main instead of crashing raw on the ancestor-check (368.808789ms)
  AssertionError [ERR_ASSERTION]: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-y3R0MC/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  fatal: Not a valid object name fgw/no-early-branch-root
  fgos: Command failed: git merge-base --is-ancestor fgw/no-early-branch-root fgw/no-early-branch-leaf
  fatal: Not a valid object name fgw/no-early-branch-root


  1 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5zg-MLYKAp/test/cli/fgos-approve.test.mjs:413:10)
```

This is the exact crash pattern the item's own description reported live
(`fatal: Not a valid object name fgw/tsk-5wr`) — reproduced here with the
test fixture's own ids, proving the regression test is a real guard, not
a vacuous pass.

## Passing after (real transcript, fix restored)

```
ℹ tests 64
ℹ suites 0
ℹ pass 64
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 26607.963179
```

Full `npm test` also re-run clean on the same tree: 3149/3154 pass, 0
fail, 5 skipped (same skip count as `main`), duration ~45s.

## Blast radius

`branchExists`/`createBranchRef` (`src/runner/worktree.mjs`) are
pre-existing exports already imported and used elsewhere in
`bin/fgos.mjs` (`branchExists` at 5 other call sites before this change;
`createBranchRef` newly imported here). `impact({target:
"createBranchRef", direction: "upstream"})` resolves (unlike `runVerb`,
which GitNexus does not index as a symbol — `bin/fgos.mjs` carries zero
indexed `Function` symbols per a direct `cypher` check, a real parser
coverage gap for this file, not a stale-index issue): HIGH risk, 7
impacted symbols, all existing callers in `src/runner/loop.mjs` and
`src/runner/promote-engine.mjs` (`claimAndDispatch`, `dispatchClaimedItem`,
`retargetMember`, `runWatch`) — none of which this change touches. This
item only adds a NEW caller; `createBranchRef` is idempotent by design
(no-op when the branch already exists, `worktree.mjs:374-392`), so
existing callers are unaffected.

Manual cross-check of the touched function itself (`runVerb`, not
GitNexus-indexed): `grep -n "runVerb("` shows exactly one call site
outside its own definition (`bin/fgos.mjs:5077`, the CLI's single
dispatch point) — the change is confined to one local block inside the
`case 'approve':` leaf->root branch, calling only the two
already-safe-elsewhere exports above.
