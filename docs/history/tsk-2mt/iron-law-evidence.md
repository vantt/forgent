# Iron Law evidence: tsk-2mt

`fgos sync-root tsk-2mt` classifies the root branch's diff (`main...
fgw/tsk-2mt`) as `required: true`, matched modules:

```
bin/fgos.mjs
src/runner/claim-port.mjs
src/runner/dispatch.mjs
src/runner/loop.mjs
src/runner/worktree.mjs
src/state/status-fsm.mjs
src/state/store.mjs
src/state/workflow-stage-graphs.mjs
```

Identical matched-module list to every child's own evidence file in this
stacked tree (`docs/history/tsk-403/iron-law-evidence.md`,
`docs/history/tsk-qod/iron-law-evidence.md`,
`docs/history/tsk-lya/iron-law-evidence.md`,
`docs/history/tsk-tku/iron-law-evidence.md`) — expected, since the
classifier diffs cumulatively against `main` and this is the root branch
those children all merged into.

## tsk-2mt has no direct diff of its own

tsk-2mt is the container item for this whole restructuring batch ("Task
cha gom toàn bộ đợt tái cấu trúc... Cha chỉ done khi mọi con done, engine
tự neo qua hasOpenDescendant" — plan.md). `git log fgw/tsk-2mt --grep
"(tsk-2mt)"` returns no commits: every change in this branch belongs to a
child item, each already carrying its own failing-before/passing-after
evidence for the matched files its own commit actually touches:

- **tsk-403** — `docs/history/tsk-403/iron-law-evidence.md`: the
  original kernel/runner module rename, the real source of most of the
  matched-module list.
- **tsk-qod** — `docs/history/tsk-qod/iron-law-evidence.md`: clarify
  stage retirement, real failing-before/passing-after transcripts against
  kernel/runner modules.
- **tsk-lya** — `docs/history/tsk-lya/iron-law-evidence.md`: confirmed
  false positive — its own commit (`8678a286`) touches none of the
  matched files; the match came from tsk-403's already-merged diff still
  being counted against the stale trunk ref.
- **tsk-tku** — `docs/history/tsk-tku/iron-law-evidence.md`: discovery
  stage owner skill; its own diff touches exactly one matched file
  (`src/state/workflow-stage-graphs.mjs`, the `skillMap.discovery`
  repoint), with real failing-before/passing-after transcripts.

No new failing-test-first proof is owed at the root level beyond what
each child already recorded for its own commit.

## Test command

```
npm test
```
(`node --test 'test/**/*.test.mjs'`, run at `fgw/tsk-2mt` HEAD `98e9bf6e`,
the tsk-2mt worktree)

## Result at HEAD

```
tests 2953
suites 0
pass 2948
fail 0
cancelled 0
skipped 5
todo 0
```

Same 5 pre-existing skips noted in `tsk-qod`'s and `tsk-tku`'s own
evidence files (worktree-scoped skips, expected here).

## Not applicable here

No package install, no scope/architecture redesign. The worktree carries
unrelated uncommitted state from other in-progress work on this item
(skill-naming changes) at the time this evidence was recorded — untouched
by this commit, which adds only this one file.
