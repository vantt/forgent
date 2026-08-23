# tsk-5vs — Iron Law evidence

Add `backlog` status to the global STATUSES/TRANSITIONS/statusLabels schema.

## Why this gate applies

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`, `trunk...branch`)
after the implementation commit:

```json
{
 "required": true,
 "matchedFlags": ["schema"],
 "matchedModules": [
  "src/state/status-fsm.mjs",
  "src/state/workflow-stage-graphs.mjs"
 ]
}
```

Files in that diff:

```
src/state/status-fsm.mjs
src/state/work.mjs
src/state/workflow-stage-graphs.mjs
test/e2e/fixture-marketing-domain.test.mjs
test/state/frontier.test.mjs
test/state/fsm.test.mjs
```

## Test command

The item's own recorded `verify`:

```
npm test
```

The failing-first transcript below narrows to the three affected files for
a readable excerpt; the passing-after transcript is the full `npm test` run
the verify actually names.

```
node --test test/state/frontier.test.mjs test/state/fsm.test.mjs test/e2e/fixture-marketing-domain.test.mjs
```

## Failing before

Captured by restoring the three source files to their pre-change state
(`git checkout HEAD~1 -- src/state/work.mjs src/state/status-fsm.mjs
src/state/workflow-stage-graphs.mjs`) while keeping the new/updated
assertions, then running the command above:

```
✖ adding "fixture-marketing" leaves DOMAINS.coding completely unchanged (RUL11 — purely additive) (0.969477ms)
✖ STATUSES exposes the full flat status domain (2.470896ms)
✖ transitionWork allows backlog -> todo and returns a validated event with no extra payload keys (0.276477ms)
ℹ tests 129
ℹ pass 126
ℹ fail 3
```

The two assertion diffs, verbatim:

```
  + actual - expected
    actual: [ 'todo', 'doing', 'blocked', 'awaiting-approval', 'delivered', 'retrospective', 'cleanup', 'done', 'awaiting-human', 'wontfix' ],
    expected: [ 'backlog', 'todo', 'doing', 'blocked', 'awaiting-approval', 'delivered', 'retrospective', 'cleanup', 'done', 'awaiting-human', 'wontfix' ],

  + actual - expected
    actual: { todo: 'todo', doing: 'in-progress', blocked: 'in-progress', 'awaiting-human': 'in-progress', 'awaiting-approval': 'review', wontfix: 'canceled' },
    expected: { backlog: 'backlog', todo: 'todo', doing: 'in-progress', blocked: 'in-progress', 'awaiting-human': 'in-progress', 'awaiting-approval': 'review', wontfix: 'canceled' },
```

The third failure is the new `backlog -> todo` edge itself: with the edge
absent from `TRANSITIONS`, `transitionWork` throws `precondition` instead
of returning the validated `work.move` event.

### One honest qualification

The two NEW `frontier.test.mjs` assertions (a `statusCategory: 'backlog'`
item, and a literal `backlog` status with no category, are both excluded
from `ready`) **passed in this same failing-first run**, and that is the
correct result rather than a gap in the proof. They are regression guards,
not change-detectors: `isTodoStatus` (`src/state/frontier.mjs:150`) is a
positive match on `statusCategory === 'todo'` with a literal
`status === 'todo'` fallback, so it excludes anything that is not `todo`
whether or not `backlog` exists. That is precisely the claim
`CONTEXT.md` D3 makes — no `frontier.mjs` code change is needed — and
these two assertions are what pin it against a future regression that
turns the filter into an exclusion list.

## Passing after

Full `npm test` on the implementation commit:

```
ℹ tests 3141
ℹ suites 0
ℹ pass 3136
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 46010.505384
```

## Blast radius

`CLAUDE.md`'s impact-analysis capability gate reported GitNexus
`present` — posture **full**.

- `impact(STATUSES, upstream)` → 0 impacted, LOW. A suspicious zero for a
  re-exported const, so it was cross-checked with `grep` per `CLAUDE.md`;
  the grep surfaced the three real test consumers above that the graph
  missed. The graph result alone would have hidden all three.
- `impact(transitionWork, upstream)` → 0 impacted, LOW.
- `impact(statusCategoryFor, upstream)` → **CRITICAL**, 21 symbols across
  8 execution flows (`claimAndDispatch`, `startupReap`, `resolveDiscovery`,
  `dispatchClaimedItem`, `resolvePlan`, `claimWork`, `captureDiscoveredWork`,
  `runWatch`). That rating measures reach, not behavior change here:
  `statusCategoryFor` returns a different value only for an item at status
  `backlog`, and no code path can create one until the sibling item adds
  the `--backlog` submit flag. Today's blast radius on live data is empty.
- `detect_changes(scope: staged)` → 4 changed symbols (`TRANSITIONS`,
  `STATUSES`, `STATUS_CATEGORIES`, `DOMAINS`), 0 affected processes, risk
  low — matching the item's declared footprint exactly.

## Decisions honored

`docs/history/work-item-backlog-status/CONTEXT.md` D1 (human-only
`backlog -> todo`, enforced by the exposing verb stamping `role: 'human'`,
since `role` is attribution-only in `transitionWork` and never an ACL) and
D3 (`backlog` gets its own `statusCategory`, never a reuse of `todo`'s);
`plan.md` Piece 1.
