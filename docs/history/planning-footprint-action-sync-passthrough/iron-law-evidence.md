# Iron Law evidence — tsk-3hp

`classifyIronLaw` on this item's final committed diff (`git log -1`
`3b37ea29`) returns:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/store.mjs"]}
```

Both hits are real, on-purpose triggers, not a description-keyword false
positive (`matchedFlags` is empty): `bin/fgos.mjs` and `src/state/store.mjs`
are both `{ kind: 'equals', ... }` entries in `MODULE_RULES`
(`src/evolve/iron-law.mjs:24-25`) — the CLI entry file and the single
write-door state module both deliberately over-report per that file's own
D13 comment, since this diff genuinely widens each: `EDITABLE_FIELDS`
(store.mjs) gains `'action'`, and `case 'edit'`'s scalar-field loop
(bin/fgos.mjs) gains it too.

## Failing-test-first proof

Verify command: `node --test test/cli/fgos-edit.test.mjs`

**Before** (`'action'` temporarily removed from `EDITABLE_FIELDS`
in `src/state/store.mjs:280` and from the scalar-field loop in
`bin/fgos.mjs`'s `case 'edit'`, real transcript):

```
✖ edit --action sets action directive prose on an item, exit 0 (271.381951ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  4 !== 0

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3hp-A3M1Aj/test/cli/fgos-edit.test.mjs:594:10)
ℹ tests 67
ℹ pass 66
ℹ fail 1
```

**After** (both lines restored to the committed version, real transcript):

```
✔ edit --action sets action directive prose on an item, exit 0 (253.769286ms)
✔ edit --action with empty string is rejected as validation, exit 4 (253.640302ms)
ℹ tests 67
ℹ pass 67
ℹ fail 0
```

`git diff src/state/store.mjs bin/fgos.mjs` after restoring showed no
output — the revert-and-restore cycle introduced no drift.

## Blast radius (why both module-rule hits are expected, not alarming)

The only change inside `bin/fgos.mjs` is appending `'action'` to the
existing scalar-field allowlist array in `case 'edit'` — no other verb,
and no other branch of `edit` itself, is touched. The only change inside
`src/state/store.mjs` is appending `'action'` to the existing
`EDITABLE_FIELDS` `Set` literal — no other line in that file changed.
`node --test test/state/store.test.mjs` (67/67, including
`editWork still refuses a patch containing "id"/"status"/"stage"/"domain"
— the fix never widens EDITABLE_FIELDS beyond this one addition`) confirms
the storage layer's write-door validation is otherwise unchanged.

## Verification source

- `src/evolve/iron-law.mjs:20-38` read directly — confirms both files are
  on `MODULE_RULES` by design, not a bug in the classifier.
- Real `node --test` transcripts above, captured by temporarily reverting
  and restoring the two one-line additions in this same worktree.
- `node --test test/state/store.test.mjs` — 67/67, confirms no collateral
  blast radius beyond the one `EDITABLE_FIELDS` entry.
