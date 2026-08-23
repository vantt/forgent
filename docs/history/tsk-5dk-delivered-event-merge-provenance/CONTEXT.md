# CONTEXT — tsk-5dk (delivered-event merge provenance)

## Feature boundary

Every `work.move → delivered` event today carries only `role` — no way to
tell, from the event log alone, whether an item reached `delivered` through
a real `fgos approve` merge or a hand-typed `fgos move --to delivered`.
This item adds two optional, additive provenance fields (`mergedSha`,
`mergedInto`) to `moveWork`, wires `approve`'s real call sites to pass
them, and makes `fgos move --to delivered` refuse when `fgw/<id>` exists
and is not yet reachable from trunk (override flag + decision-log
requirement still available). Scope is new items only — no backfill of
the 351 historical items with no sha (see anti-scope below).

Impact-analysis posture (CLAUDE.md gate): GitNexus present, freshly
checked (`fgos tool query --capability impact-analysis --status present`)
→ **full** — the repo's MUST rules apply as written for every symbol this
item edits (`moveWork`, the `move`/`approve` verb handlers,
`moveDeliveredOrRecordFault`, `viewGitHubPRStatus`/`mergeGitHubPR`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The `'pull-door verify-only'` delivered path (`bin/fgos.mjs`, `moveDeliveredOrRecordFault(..., 'pull-door verify-only')` call site) passes neither `mergedSha` nor `mergedInto` — no git merge commit exists on that path, so there is no sha to attribute. `moveWork`'s existing stamp pattern already omits any field passed as `undefined` (`if (x !== undefined) rawEvent.payload.x = x`), so this needs no new branching logic — simply never pass those two args from that one call site. |
| D2 | Anti-scope #4 ("KHÔNG đụng đường GitHub transport ngoài việc truyền thêm hai trường ở bin/fgos.mjs") is amended: it now also permits exactly one additive change to `src/runner/github-adapter.mjs` — add `mergeCommit` to `viewGitHubPRStatus`'s existing `gh pr view --json` field list (`:140`) and return it unchanged from `mergeGitHubPR`'s result object. Everything else about GitHub transport stays untouched (no new gh subcommands, no retry/polling changes). Reason: research (Round 1, `RESEARCH.md`) found `mergeGitHubPR` returns no sha today and `bin/fgos.mjs` has no independent `gh`/git-fetch mechanism to derive one — the anti-scope's original premise (sha already reachable from `bin/fgos.mjs` alone) does not hold. Widening one existing JSON field request is judged lower-risk than inventing a new `git fetch`+`rev-parse` mechanism inside `bin/fgos.mjs`. |

Both D1 and D2 were the two questions research (Round 1) surfaced as
genuinely unresolvable from repo evidence alone; both were parked
`awaiting-human` via `fgos discover --verdict unclear` and resumed via
`fgos answer` with this same reasoning — see the item's own decision log
(`fgos show tsk-5dk`) for the verbatim answer.

## Pinned terms

- **mergedSha** — the git commit sha that actually landed the item's
  change onto its target branch (a real merge commit, or the target's
  new HEAD after a fast-forward/squash), when one exists.
- **mergedInto** — the branch name the change landed on: `main`/trunk for
  a root-into-main merge or a GitHub PR merge, or the resolved root's own
  `fgw/<rootId>` branch name for a leaf-into-root merge.
- **verify-only delivered** — a pull-door proposal that reached
  `delivered` purely because its own goal-check verified green, with no
  git merge ever performed (the proposal's diff already lived on the
  target via the pull-door take/return mechanism). Carries neither
  `mergedSha` nor `mergedInto` (D1).

## Scout evidence (from Round 1 research, full detail in `RESEARCH.md`)

- `src/state/store.mjs:487` — `moveWork`'s existing optional-provenance
  destructure/stamp pattern (`headAtTake`/`headAtReturn`/
  `branchHeadAtTake`/`branchHeadAtReturn`, `:547-575`) is the exact shape
  to extend.
- `bin/fgos.mjs:3009` — `moveDeliveredOrRecordFault(dir, id, phase)`,
  called from three sites: `:3534` (`'leaf-into-root merge'`), `:3684`
  (`'root-into-main merge'`), `:3736` (`'pull-door verify-only'`, D1
  above). A fourth, separate direct `moveWork(...to:'delivered'...)` call
  sits at `:3282` inside the `flags.github` branch — does not go through
  the shared helper.
- `src/runner/merge.mjs:805`/`:1092`/`:1271` (`mergeRunnerItem`) returns
  `{outcome:'merged', branch, check}` — no sha field; the local-merge call
  sites derive `mergedSha` from `currentHead(repoRoot)` (`bin/fgos.mjs:121`)
  read right after the merge lands, and `mergedInto` from the known target
  (`rootBranch`/`'main'`).
- `src/runner/github-adapter.mjs:126-188` (`viewGitHubPRStatus`,
  `mergeGitHubPR`) — subject of D2.
- `docs/specs/work-state.md:40` — existing `## Data Dictionary` numbered
  table (rows 15/16/19 already document `headAtTake`/`headAtReturn`/
  `branchHeadAtTake`) — extend with two more rows.
- `bin/fgos.mjs:1415-1427` (`case 'move':`) — fully generic today, no
  branch-reachability check of any kind. New refusal check is additive,
  nothing to conflict with.
- `src/state/cleanup-harness.mjs:26`/`:107`, `src/runner/worktree.mjs:622`
  — existing `git merge-base --is-ancestor` ancestry-check patterns to
  reuse/mirror for the new `move --to delivered` refusal, rather than
  reinventing ancestry logic from scratch. Neither file is in the item's
  declared footprint; planning should confirm whether calling (not
  editing) one of them is possible from `bin/fgos.mjs`, or whether the
  check needs its own small inline `git merge-base --is-ancestor` call.

## Canonical references

- `plans/reports/root-cause-260812-2223-why-the-merge-audit-became-this-complex-report.md`
  (item's own `refs`)
- `docs/history/tsk-5dk-delivered-event-merge-provenance/RESEARCH.md`
  (Round 1 evidence)

## Outstanding questions

None
