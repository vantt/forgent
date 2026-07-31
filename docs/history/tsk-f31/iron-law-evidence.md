# tsk-f31 — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md`: this
item's diff touches `bin/fgos.mjs` with a `delete`-flagged change
(removing/reordering the `docs-index` null-write path), tripping
`classifyIronLaw`.

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": ["delete"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Test command

```
node --test test/report/enduser-index.test.mjs
```

## Before (red) — production fix reverted via `git apply -R` on commit 866119e's bin/fgos.mjs hunk, test file left in place

```
✔ fgos docs-index writes repo/docs/enduser-docs-index.json with the real how-to demo entry
✔ fgos docs-index tolerates a missing quadrant dir (tutorials has no alias) with no crash and no entries from it
✖ fgos docs-index on an unreachable store preserves an existing prior sourceCaptureId instead of nulling it
  AssertionError [ERR_ASSERTION]: an unreachable store must not regress a real prior id to null
  + actual - expected
  + null
  - 'tsk-real-capture'
✔ fgos docs-index on an unreachable store with no prior manifest value stays null (nothing to preserve)
✔ fgos docs-index run twice in a row against the same unreachable store converges (R7 survives tsk-f31): no second write
...
ℹ tests 18
ℹ pass 17
ℹ fail 1
```

## After (green) — fix restored via `git checkout -- bin/fgos.mjs`

```
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

Full `npm test` on the restored fix: 1868/1873 pass, 0 fail, 5 skipped
(branch is behind main by several already-merged items — 1873 not 1916 —
unrelated to this item's own change).

## Known residual: item's own verify command is intermittently flaky

The item's `verify` (`npm test && test -z "$(git status --porcelain
docs/enduser-docs-index.json)"`) passed cleanly on one full-suite run and
left the real tracked manifest dirty (71 `sourceCaptureId` entries
regressed to `null`) on another, same worktree, same fix in place — a
race condition between the two real-tree-touching tests in
`test/report/enduser-index.test.mjs` under full-suite load, not
reproduced when running that file alone (twice, clean both times) or the
production code directly once (clean). The core preserve-on-disk-value
logic itself is confirmed correct (this evidence's own red/green pair,
plus a direct single `node bin/fgos.mjs docs-index` run in a worktree
with `.fgos/main-checkout.lock` only, no `events.jsonl` — file left
byte-identical). The flake is a residual test-isolation gap, not a defect
in the self-modifying logic itself. Surfaced to the user before approval;
approved with this known gap left for a possible follow-up item.
