# Iron Law evidence: tsk-1lv-3

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit
`faa8e7c8`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs",
    "src/state/store.mjs"
  ]
}
```

## Inherited-diff note (tsk-28o precedent)

`changedFiles` diffs this item's branch (`fgw/tsk-1lv-3`) against trunk
(`main`) — since `fgw/tsk-1lv-3` forked from `fgw/tsk-1lv` AFTER
`tsk-1lv-1` and `tsk-1lv-2` had already merged into it, `matchedModules`
correctly includes `src/runner/merge.mjs`/`src/state/store.mjs`, files
THIS item never touched (confirmed: `git diff HEAD~1 HEAD --stat` for
this item's own commit `faa8e7c8` shows only `bin/fgos.mjs`,
`docs/architecture-manifest.json`, `.agents/skills/fgos-coding-exploring/
SKILL.md` + its plugin mirror, `src/cli/command-registry.mjs`,
`src/intake/plan.mjs`, `src/report/context-render.mjs` (new), and
`test/report/context-render.test.mjs` (new)). Per
`docs/how-to/fix-fgos-write-rejected-merge-block.md`'s own sibling
example (`tsk-28o`): "The fix is not to silence or dispute the
classifier — it's reading the real diff correctly... The failing-test-
first proof still only needs to cover what this item itself is actually
responsible for... [the inherited file's] own proof stays where it was
actually produced, cited rather than re-derived." `src/runner/merge.mjs`
and `src/state/store.mjs`'s own failing-before/passing-after proof is in
`docs/history/tsk-1lv-1/iron-law-evidence.md` and
`docs/history/tsk-1lv-2/iron-law-evidence.md` — not re-derived here.

## Verify command

```
node --test test/report/context-render.test.mjs
```

## Failing-before / passing-after transcript (this item's own diff: bin/fgos.mjs)

**Before** (real transcript: checked out the pre-change `bin/fgos.mjs`
from the parent commit, with the new `src/report/context-render.mjs`,
`src/intake/plan.mjs`'s new export, and the test file already present):

```
$ git checkout HEAD~1 -- bin/fgos.mjs
$ node --test test/report/context-render.test.mjs

✖ CLI: context-render refuses (validation, exit 4) when CONTEXT.md does not exist yet
✖ CLI: context-render renders locked D-IDs into an existing CONTEXT.md, in place
✖ CLI: context-render uses docsRef when the item declares one, not the default docs/history/<id>
✖ CLI: context-render is idempotent -- a second call with no new decisions reports changed:false
✖ CLI: context-render excludes another item's decisions -- only rows scoped to THIS id appear
ℹ tests 16
ℹ pass 11
ℹ fail 5
```

(The 11 passing tests are the pure `decisionDIdAndText`/
`renderLockedDecisionsTable`/`replaceLockedDecisionsSection` unit tests —
unaffected by `bin/fgos.mjs`'s own pre-change state, since they import
`src/report/context-render.mjs`/`src/intake/plan.mjs` directly, never the
CLI. Only the CLI-level tests exercising the new `context-render` verb
fail, exactly as expected: that verb does not exist in the pre-change
`bin/fgos.mjs`.)

**After** (real transcript, restoring the post-change file and
re-running the identical command):

```
$ git checkout HEAD -- bin/fgos.mjs
$ node --test test/report/context-render.test.mjs test/intake/plan.test.mjs

ℹ tests 107
ℹ pass 107
ℹ fail 0
```

## Investigated: is `fgos-coding-planning`/`fgos-coding-shaping` really writing CONTEXT.md's table?

`plan.md`'s own split-children entry for this piece says "Áp dụng cả 3
skill đang ghi CONTEXT.md: exploring/planning/shaping, không chỉ
exploring." Direct grep of both skill files before editing anything
found this premise did not hold for 2 of the 3:

- `fgos-coding-planning/SKILL.md` — the one place it mentions the
  Locked-Decisions table is read-only (citing a D-ID in a child's
  `action` field). Its "hand-back" path explicitly delegates to
  `fgos-coding-exploring`'s own flow to append a new D-ID rather than
  writing CONTEXT.md itself.
- `fgos-coding-shaping/SKILL.md` — carries an explicit hard rule: "Never
  write `docs/history/<feature>/CONTEXT.md` or `plan.md`" (its own
  locked decision D2, `docs/history/fgos-coding-shaping/CONTEXT.md`). It
  mints D-IDs into its own `DISCUSSION.md`'s §4 table, a different
  document this task's own title/verify scope does not cover.

Only `fgos-coding-exploring/SKILL.md` (mirrored into
`plugins/fgOS/skills/`) genuinely writes CONTEXT.md's Locked-Decisions
table, so it is the only skill file this commit edits.
