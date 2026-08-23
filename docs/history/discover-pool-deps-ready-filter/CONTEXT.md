# discover-pool.mjs's isCandidate() ignores deps-readiness

Item: tsk-2v3.

## Feature boundary

`src/state/discover-pool.mjs`'s `isCandidate()` — the filter behind
`pickNextDiscoverItem`, which `/fgOS:discover-next` and `/fgOS:discover-loop`
use to pick "the next item to work on" — only checks `item.status ===
'todo'` and `CANDIDATE_STAGES.has(item.stage)`. It never checks whether the
item's dependencies are actually resolved, so it can hand a caller an id
that is not yet claimable.

Scope is the picker's filter only. Nothing about the claim mechanism
(`take`/`pick`) or the `/fgOS:discover` skill's own claim step changes —
see D1 below for why.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scope is `discover-pool.mjs`'s `isCandidate()` only — add a call to `isDepsAndLineageReady(view, item.id)` (`src/state/frontier.mjs:162-169`, already exported, already used by `take`'s explicit-`--id` claim path per the `choke-point-take-vs-pick-claim-eligibility` fix). `/fgOS:discover`'s own claim step is NOT buggy: it calls `take`, and `bin/fgos.mjs`'s `take` handler already calls `isDepsAndLineageReady` internally (confirmed by grep — `if (item.status === 'todo' && !isDepsAndLineageReady(dir, id))`) — the exact check that produced the live "unmet dependency" refusal on tsk-28x. The skill correctly relays that real error and stops, per its own documented contract ("shows the real error to the user and stops"). No change needed there. |

## Pinned terms / assumptions

- **Silent exclusion, not a new visibility surface.** `isCandidate()`'s fix
  will exclude a deps-not-ready item from the pool the same way
  `frontier()` (`src/state/frontier.mjs:90-112`, same file) already
  silently excludes an executing-stage item with `depsReady === false` —
  no new return shape, no "found but blocked" report. Consistent with the
  only existing convention in this codebase for the same kind of filter;
  no evidence anyone needs different behavior, so this is pinned rather
  than asked.
- **Reuse `isDepsAndLineageReady` wholesale**, not just its deps-done
  clause. That helper also refuses on `hasOpenDescendant` (open
  decomposed child) — bundling both is correct here for the same reason
  `take`'s explicit-`--id` branch already bundles both: an item anchored
  by an open child is equally not dispatchable, regardless of why.

## Scout evidence

- `src/state/discover-pool.mjs:22-24` — `isCandidate()`, the buggy filter:
  ```js
  function isCandidate(item) {
    return item.status === 'todo' && CANDIDATE_STAGES.has(item.stage);
  }
  ```
- `src/state/frontier.mjs:162-169` — `isDepsAndLineageReady(view, id)`,
  already exported, stage-independent (`choke-point-take-vs-pick-claim-
  eligibility`), the exact helper to reuse.
- `src/state/frontier.mjs:90-112` — `frontier()`'s own `depsReady` clause
  (`item.deps.every((dep) => isResolvedStatus(work[dep]))`) plus
  `hasOpenDescendant` check, for the executing-stage pool — the existing
  convention `isCandidate()`'s fix should match (silent exclusion).
- `bin/fgos.mjs` — `take`'s handler calls `isDepsAndLineageReady(dir, id)`
  directly; confirmed via grep this is the ONLY caller of
  `isDepsAndLineageReady` today besides `frontier.mjs` itself. Confirms B
  (the discover skill's claim step) already inherits A's real check
  transitively through `take`, so B needs no separate fix (D1).
- `docs/history/rollup-parent-auto-close/DISCUSSION.md` (row 8) —
  documents that `pick --id <id>` (`bin/fgos.mjs:1962-1975`) does **not**
  call `isDepsAndLineageReady` at all, going straight to `claimWork` with
  only a CAS on `expectedStatus`. Real asymmetry vs. `take`, but not
  exercised by this item's failure path (`/fgOS:discover`'s claim step
  only falls back to `pick` when `take` fails on a branch-exists reason,
  never on deps-unmet) — noted as a deferred sibling gap, not this item's
  scope.
- Live repro (2026-08-11): `/fgOS:discover tsk-28x` (status=`todo`,
  stage=`clarify`) — `take tsk-28x` refused: `"tsk-28x" is todo but has an
  unmet dependency or an open decomposed child`. Its deps: `tsk-12m`
  (`awaiting-human`/`clarify`, unresolved) and `tsk-1hy` (`cleanup`/
  `executing`, not yet `done`). This repro went through `/fgOS:discover`'s
  direct claim step, not `pickNextDiscoverItem` — it demonstrates what
  `take`'s existing check correctly does (motivating evidence for why
  `isCandidate()` should match it), not a bug in the claim step itself.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus present. `impact-analysis: full` per CLAUDE.md's gate — informational
  only here (this skill edits no code); `fgos-coding-planning`/`fgos-coding-implement`
  should run `impact({target: "isCandidate", direction: "upstream"})` before
  editing.

## Canonical references

- `docs/how-to/claim-a-clarify-or-decompose-stage-item.md` — documents
  `isDepsAndLineageReady`'s intended reuse.
- `docs/decisions/0022-fgos-choke-point-survey.md` — where
  `isDepsAndLineageReady` was factored out of `frontier()`.
- `docs/explanation/why-isdepsandlineageready-uses-resolved-statuses-not-just-done.md`
  — why it checks `RESOLVED_STATUSES`, not just `done` (relevant since the
  fix reuses this helper wholesale).
- `docs/history/tsk-3yh-take-deps-resolved-status/CONTEXT.md` — prior work
  that fixed `isDepsAndLineageReady` itself; same helper this item reuses.

## Outstanding questions

None
