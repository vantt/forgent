# Iron Law evidence: tsk-1lv review-fix round (F1-F12)

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the full set of
files this round's 6 commits touched (`4270c0c0` through `91fdceb6`, on top
of merge commit `c377b2fe`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs"
  ]
}
```

## Which matched modules are this round's own diff

Both are: `bin/fgos.mjs` carries F3's `supersedingLabel` fix, F5/F6's
`context-render` case changes, and F11's new `authoritative-match` case
(all real logic, this round's own commits — confirmed via
`git diff c377b2fe..HEAD -- bin/fgos.mjs`). `src/runner/merge.mjs` carries
only F12's comment correction (no logic change — confirmed via
`git diff c377b2fe..HEAD -- src/runner/merge.mjs`, which shows only
comment-block lines); it is matched because the module itself is on
`MODULE_RULES`' watch list, not because this round changed its behavior.

## Verify command

```
node --test test/state/decision-relation.test.mjs test/report/context-render.test.mjs test/report/authoritative-match.test.mjs
```

(The three files carrying this round's own new/changed regression tests
for `bin/fgos.mjs`'s real behavioral changes: F3's `--scope`-without-`--id`
dangling-citation test, F5/F6's `context-render` tests, and F11's full
`authoritative-match` CLI test suite.)

## Failing-before / passing-after transcript (this round's own diff: bin/fgos.mjs)

**Before** (real transcript: checked out the pre-review-fix `bin/fgos.mjs`
from `c377b2fe`, the merge commit immediately preceding this round's first
fix commit, with all of this round's new test files already present):

```
$ git checkout c377b2fe -- bin/fgos.mjs
$ node --test test/state/decision-relation.test.mjs test/report/context-render.test.mjs test/report/authoritative-match.test.mjs

ℹ tests 64
ℹ pass 52
ℹ fail 12

✖ failing tests:
✖ CLI: supersedes without --id (a platform/--scope decision) still surfaces dangling citations -- F3 tsk-1lv regression: ...
✖ CLI: context-render refuses (validation, exit 4) rather than blank a hand-typed table with no matching state.decisions yet -- F6 tsk-1lv regression
✖ CLI: context-render finds CONTEXT.md via resolveContentRoot when the item declares a docsRef that only exists relative to process.cwd(), not --dir -- F5 tsk-1lv regression
✖ CLI: authoritative-match finds the doc whose authoritative_for skeleton-matches the topic
✖ CLI: authoritative-match returns match:null when no doc claims the topic
✖ CLI: authoritative-match on a quadrant dir that does not exist yet returns match:null, never an error
✖ CLI: authoritative-match requires --quadrant (validation, exit 4)
✖ CLI: authoritative-match requires --topic unless --check-duplicates is set (validation, exit 4)
✖ CLI: authoritative-match --check-duplicates reports every group of 2+ docs claiming the same subject
✖ CLI: authoritative-match --check-duplicates reports no groups when every claim is unique
✖ CLI: authoritative-match ignores docs with no authoritative_for frontmatter
✖ CLI: authoritative-match never mutates state: events.jsonl and state.json are byte-identical before/after
```

(The 9 `authoritative-match` failures all fail identically: the CLI verb
itself did not exist yet on the pre-review-fix file, so every invocation
returns the generic "unknown verb" refusal rather than exercising real
behavior — expected, since F11 added the entire case in this round.)

**After** (real transcript, restoring the post-review-fix file and
re-running the identical command):

```
$ git checkout HEAD -- bin/fgos.mjs
$ node --test test/state/decision-relation.test.mjs test/report/context-render.test.mjs test/report/authoritative-match.test.mjs

ℹ tests 64
ℹ pass 64
ℹ fail 0
```

## `src/runner/merge.mjs` — comment-only, no behavioral proof needed

`git diff c377b2fe..HEAD -- src/runner/merge.mjs` shows only a rewritten
comment block (F12) — no code line changed. There is no behavior to prove
failing-before/passing-after for a comment; the real fix for F12's
underlying gap lives in `src/report/decision-index.mjs`'s
`generateDecisionIndex` (a genuinely new file/module for the purposes of
Iron Law's own module list — not on `MODULE_RULES`), covered by its own
real failing-before/passing-after pair below.

## `src/report/decision-index.mjs` (F12's real fix) — not Iron-Law-matched, real transcript anyway

Outside Iron Law's own matched-module list (the `bin/fgos.mjs` transcript
above is the evidence this document exists to satisfy) — proven for real
anyway, not asserted:

**Before** (real transcript, pre-F12 file restored):

```
$ git checkout 91fdceb6~1 -- src/report/decision-index.mjs
$ node --test test/report/decision-index.test.mjs

ℹ tests 14
ℹ pass 13
ℹ fail 1

✖ generateDecisionIndex: refuses to overwrite an index with real rows when the freshly-computed content has none -- F12 tsk-1lv regression ...
```

**After** (real transcript, current file restored):

```
$ git checkout HEAD -- src/report/decision-index.mjs
$ node --test test/report/decision-index.test.mjs

ℹ tests 14
ℹ pass 14
ℹ fail 0
```

## Full suite

```
$ npm test
ℹ tests 3617
ℹ pass 3612
ℹ fail 0
ℹ skipped 5
```

Clean — no pre-existing baseline failures this round (the `agy`
reference-capacity assertions every prior sibling in this feature reported
as known environmental noise are gone too: `main`'s own tsk-225 rename
already lands in this merge, so `test/runner/dispatch.test.mjs`'s
assertions now match the live `.fgos/config.json` shape).

## Round summary (F1-F12, each independently committed)

| Finding | Commit | Kind |
|---|---|---|
| F1 citation-drift baseline gap | `4270c0c0` | mechanical (inline 13 real citations) + baseline extension (inherited debt) |
| F2 ADR 0034/0035 migration | `4270c0c0` | judgment call, resolved per established tsk-1lv-4 convention |
| F3 dead write-time sweep for `--scope` | `4270c0c0` | mechanical, real bug, regression-tested |
| F4 merge conflicts | (the merge commit `c377b2fe`, preceding this round) | mechanical, hand-resolved (`toolsFromExecutors` rename + both sides' new imports) |
| F5 `context-render` path resolution | `14a44d49` | mechanical, real bug (found a second bug — `docsRefRaw` ordering — while writing the regression test) |
| F6 `context-render` blank-table guard | `14a44d49` | judgment call, resolved with a refusal guard |
| F7 freshness-door id/path confusion | `ff9de260` | mechanical, real bug |
| F8 impact-door scope gap | `ff9de260` | judgment call, resolved by documenting the real gap honestly (no speculative infra built) |
| F9 vacuous supersession check | `ff9de260` | judgment call, resolved by retiring the npm script entry |
| F10 `decision-index --check` unwired | `6386eb32` | mechanical, wired into `fgos doctor` mirroring the `enduser-docs-index-stale` precedent |
| F11 `authoritative-match` unused + adapter bug | `122c6e74` | judgment call (new CLI verb) + mechanical (adapter fix) |
| F12 stale comment / real unguarded gap | `91fdceb6` | mechanical comment fix + a genuinely new guard in `decision-index.mjs` |
