# add-stage-default-gap — CONTEXT.md

tsk-621: items created via `fgos add` land permanently at stage `executing`
with no path back to `clarify`/`decompose`.

## Feature boundary

Fixes the root cause and locks recovery policy for the existing backlog.
Does NOT design the implementation (flag shape, backfill mechanism, exact
`fgos-coding-planning` SKILL.md wording) — that is `fgos-coding-planning`'s job, next.

## Root cause (verified in code)

- `bin/fgos.mjs:875-` (`add` case), comment at 915-916: `add` never sets
  `stage` at all — "No --stage flag: omitting stage already resolves
  per-domain via the existing lazy default." Only `submit`
  (`bin/fgos.mjs:822`) stamps an entry stage
  (`stageForStep(domain, 'Clarify')`).
- `src/state/work.mjs:169`: a missing `stage` reads as `executing`
  lazily wherever consumed (frontier.mjs, store.mjs) — by design (D8),
  never injected onto the record.
- `src/state/workflow-stage-graphs.mjs:69-73`: coding domain's
  `transitions` array has exactly 3 forward edges (`clarify→executing`,
  `clarify→decompose`, `decompose→executing`) — no edge into `clarify`
  or `decompose`.
- `src/state/store.mjs:238` (`EDITABLE_FIELDS`): `stage` deliberately
  excluded — `fgos edit` cannot patch it either. `moveStage`/
  `transitionStage` (stage-fsm.mjs) only accept the registered edges
  above, so even the engine verb cannot manufacture a way back.
- `.claude/skills/fgos-coding-planning/SKILL.md:191-194`: the CURRENT, ACTIVE
  step-4 instruction teaches every split to call
  `fgos add --parent <id> --footprint ...` with no `--stage` option —
  this is not a historical accident, it fires on every split today.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scope is broad: every `fgos add` caller must get real stage handling, not narrowly `fgos-coding-planning`'s split-child pattern. |
| D2 | Mechanism combines both: add an explicit `--stage` flag for caller override, AND change `add`'s lazy default from implicit `executing` to `clarify` (mirrors `submit`'s existing D8 default contract). |
| D3 | The 26 items already stuck at implicit-`executing` get a one-time data fix, never a new permanent back-edge in `workflow-stage-graphs.mjs`'s `coding.transitions` table. |
| D4 | Of the 26, only items whose `status` is still `todo`/`doing`/`awaiting-approval` are actually in scope for D3's one-time fix (`tsk-503`, `tsk-2k1`, `tsk-2sl` as of 2026-08-06). The other 23 are `delivered`/`cleanup`/`retrospective` — already built, approved, and past `executing` in the status lifecycle; correcting their historical `stage` field has no practical effect (nothing will ever re-route them through `fgos-routing` again) and is out of scope. |
| D5 | Narrows D4 further: only `tsk-503` (`todo`, not yet dispatched) gets the one-time supersede+re-add fix. `tsk-2k1` (`doing`) and `tsk-2sl` (`awaiting-approval`) are left alone — same reasoning D3 already used to reject a back-edge: touching an item that is mid-build or already past `executing` (real code/commits, or already sitting for merge review) risks more than a stale `stage` field is worth, and correcting it now has no practical forward effect for either. |
| D6 | Phase 2 turned out moot at execution time: `tsk-503` self-resolved to `delivered` (via a concurrent session in this shared backlog) before this item's own execution reached it — same bucket as the other 23 D4 already ruled out of scope. No supersede/re-add performed. |

## Pinned terms

- **stuck item** — a work item with `parent` set, no explicit `stage`
  field, and `status` not in `{done, wontfix}`. Counted 2026-08-06:
  **26 items** — `tsk-3b3`, `tsk-5m7`, `tsk-50i`, `tsk-62y`, `tsk-2u0`,
  `tsk-19j-4`, `tsk-38t-1`..`tsk-38t-8`, `tsk-3c7`, `tsk-2ig`, `tsk-64z`,
  `tsk-417`, `tsk-1e3`, `tsk-40t`, `tsk-jo1`, `tsk-30z`, `tsk-50ic`,
  `tsk-2sl`, `tsk-2k1`, `tsk-503`. Status breakdown (D4): `delivered`
  10, `cleanup` 5, `retrospective` 8, `awaiting-approval` 1 (`tsk-2sl`),
  `doing` 1 (`tsk-2k1`), `todo` 1 (`tsk-503`) — only the last 3 are in
  D3's actual fix scope.

## Scout evidence / paths

- `bin/fgos.mjs:747-827` (`submitWork`, contrast case), `:875-950`
  (`add` case, the gap)
- `src/state/work.mjs:164-179` (`STAGES`/lazy-default doc comment)
- `src/state/workflow-stage-graphs.mjs:1-115` (domain registry, coding's
  `transitions`/`skillMap`)
- `src/state/store.mjs:233-238` (`EDITABLE_FIELDS`), `:706-740`
  (`moveStage`)
- `.claude/skills/fgos-coding-planning/SKILL.md:180-205` (step 4 split example)
- impact-analysis: full (gitnexus present, freshly checked
  2026-08-06T08:27Z via `fgos tool query --capability impact-analysis
  --status present`)

## Why the back-edge idea surfaced, and why D3 rejected it

Once an item already exists with implicit `stage=executing`, none of the
3 registered edges can route it anywhere else — fixing `add`'s default
(D1/D2) only prevents NEW items from landing wrong; it does nothing for
items already created before the fix ships. A back-edge was floated as a
recovery mechanism for those existing casualties.

Rejected because: `stage` (macro lifecycle position) and `status` (micro
FSM state — `doing`/`awaiting-approval`/etc.) are orthogonal
(`work.mjs:167-168`'s own doc comment). No existing invariant defends an
in-flight claimed item (status `doing`, worktree already has code/commits
on `fgw/<id>`) from being yanked backward mid-build. Gate-approve records
(`contextApprove`/`planApproved`) are append-only — a back-edge would
leave `fgos show` displaying an item with an already-approved gate sitting
at an earlier stage, a contradiction nothing auto-resolves. A back-edge is
also a new permanent FSM contract surface (new tests in
`workflow-stage-graphs.test.mjs`/`stage.test.mjs`, a new
"stage can move backward" exception every stage-aware skill would need to
audit for) for what is actually a bounded, finite backlog (26 items) —
not a recurring need, since D1/D2 stop recurrence going forward.

## Outstanding, deferred to planning

- Exact `--stage` flag shape/validation on `add` (accepted values, how it
  interacts with `--domain`'s own stage-mapping lookup).
- Exact mechanism for the one-time data fix on the 26 stuck items (new
  narrow admin verb, a one-off script, or per-item `supersededBy` +
  re-`add` at the correct stage) — D3 only locks that it is one-time and
  not a new FSM edge, not which of these shapes it takes.
- Updating `.claude/skills/fgos-coding-planning/SKILL.md` step 4's own example
  to use the new `--stage` flag (and its mirrored `.agents/skills/`
  copy, per this item's own footprint).
- The item's own `verify` field currently reads `"chưa xác định — P15 bổ
  sung"` — placeholder prose, not a runnable command. Planning must set
  a real, executable `verify` (per `docs/how-to/fix-a-verify-command-
  broken-by-mixed-in-prose.md`'s own lesson: a non-executable `verify`
  string only surfaces as a shell syntax error later, at `fgos return`
  time) before this item reaches `executing`.
