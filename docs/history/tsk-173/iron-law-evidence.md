# tsk-173 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/cli/fgos.test.mjs test/state/graph-harness.test.mjs`

## Failing-before (real transcript excerpt, source reverted to pre-fix — `git checkout HEAD~1 -- bin/fgos.mjs src/state/graph-harness.mjs`, new tests kept as committed)

```
✖ merge next auto-syncs a blockedOnSync root before giving up: drift clears, the now-ready item merges to delivered (tsk-173 D1) (612.198248ms)
  TypeError: Cannot read properties of undefined (reading 'id')
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:7624:30)

✖ merge next on a blockedOnSync root whose sync-root attempt hits a genuine conflict: picked is the root id (never null), blocked, main untouched (tsk-173 D1/D2) (585.637159ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + null
  - 'auto-sync-conflict'

✖ mergeReadiness: blockedOnSync is rank-ordered same as ready (tsk-173), not raw candidate-iteration order (1.586737ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  actual: [ 'plainLeaf', 'mvpLeaf' ],
  expected: [ 'mvpLeaf', 'plainLeaf' ],

ℹ tests 551
ℹ pass 548
ℹ fail 3
```

## Passing-after (real transcript excerpt, source restored — `git checkout HEAD -- bin/fgos.mjs src/state/graph-harness.mjs`)

```
ℹ tests 551
ℹ suites 0
ℹ pass 551
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## What changed

- `src/state/graph-harness.mjs` — `mergeReadiness`'s `blockedOnSync` bucket is now rank-ordered (`orderByRank`), same as `ready`/`mergeSets`/`supersededOut` already were.
- `bin/fgos.mjs` `merge next` case — new branch: when `ready` is empty and `blockedOnSync` is non-empty, resolves the top-ranked blocked candidate's root and attempts `fgos sync-root` on it (D1/D2, `docs/history/merge-next-auto-sync-root/CONTEXT.md`). A clean sync re-checks readiness and proceeds through the existing `approve` path; a blocked sync (`merge-conflict`/`fgos-write-rejected`/`verify-fail`/Iron Law) reports `picked: <rootId>` (never `null`) so it lands in `/fgOS:merge-loop`'s existing "blocked pick" bucket instead of being mistaken for an empty frontier.
- `plugins/fgOS/skills/merge-next/SKILL.md`, `plugins/fgOS/skills/merge-loop/SKILL.md` — updated to relay/recognize the new outcome shapes.
