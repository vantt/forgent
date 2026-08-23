# fsm-wontfix-terminal-status — locked decisions

Item: `tsk-1ua`. Source request (raw, untrusted per RUL45): "Discuss adding
a terminal wontfix/superseded/cancelled status to fgOS's work-item FSM
(src/state/fsm.mjs). Today the FSM only has
todo/doing/blocked/proposed/done/awaiting-human, with done reachable only
through proposed (a real verify pass) -- there is no honest terminal state
for an item deliberately decided against, only reached by blocked, which
has no forward edge to done."

## Feature boundary

The FSM (`src/state/fsm.mjs`) currently has 6 statuses (`STATUSES`,
`src/state/work.mjs:34`) and no status for "deliberately closed, never
going to be built." `blocked` is the closest fit today, but it means
"stuck, unresolved" — an item there has 3 exits (`todo`/`doing`/`proposed`)
and no honest path to a closed/resolved state. This leaves two concrete
symptoms:

- An item genuinely decided against (tsk-4fu-1, superseded by ADR0020's
  elimination of its own precondition) has nowhere honest to sit — parking
  it at `blocked` misrepresents it as "still stuck," not "closed."
- `hasOpenDescendant` (`src/state/frontier.mjs:134-146`) treats any
  non-`done` status, including a permanently-parked `blocked`, as "open" —
  so a permanently-blocked child anchors its parent out of the frontier
  forever, with no FSM path to resolve either item further.

This item adds a new terminal status to close both gaps. **Out of scope**:
implementation shape (which files change, test structure) — that's
`fgos-coding-planning`'s job once these decisions are locked.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Add a new terminal status to the FSM (not a reinterpretation of `blocked`). It is entered like any other status transition and is terminal — symmetric with `done`, zero outgoing edges. `hasOpenDescendant` is updated to treat it as resolved, same as `done`. |
| D2 | The new status is named `wontfix` — the industry-standard umbrella term (GitHub/Bugzilla convention) for "valid, not going to be done." It covers multiple concrete reasons (superseded, duplicate, admin closure) without picking one name that only fits one case; the specific reason for any given closure goes in the item's decision log, the same way `blocked` reasons already do today. |
| D3 | `wontfix` is enterable from `blocked`, `todo`, and `doing` — three edges, mirroring how `awaiting-human` already enters from both `todo` and `doing` (`src/state/fsm.mjs:85-86`), plus `blocked`. This covers both trigger cases found: an item already parked in `blocked` when closed (tsk-4fu-1), and an item closed directly from `clarify` (i.e. `todo`/`doing`) before ever being blocked, e.g. a duplicate-report closure (tsk-5h4's own concrete repro: closing tsk-2ib as a duplicate of tsk-3yl). |
| D4 | `wontfix` has no exit edge — fully terminal, no reopen. A wrongly-closed item is revived by filing a new item that references the old one (`refs`, already an existing field), not by reopening the FSM edge. This matches D1's terminal framing and keeps the transition table symmetric with `done` (also zero exits). |
| D5 | Items reaching `wontfix` do not go through `compound-learn`'s synthesis gate. That gate synthesizes learnings from real completed work and outcomes into end-user docs (`fgos-coding-compounding`) — an item closed at `clarify` (or `blocked`, or `doing`) built nothing to synthesize. The closure reasoning is already captured natively in the item's decision log via this same clarify-stage dialog, so routing through compound-learn would misrepresent unbuilt work as done work. |

## Pinned terms

- **`wontfix`**: the new terminal FSM status (D2). Umbrella term; specific
  closure reason (superseded / duplicate / admin decision) lives in the
  decision log, not in the status name itself.

## Scout evidence cited

- `src/state/fsm.mjs:63-95` (`TRANSITIONS`) — current 15-edge transition
  table; `done` has 2 entry edges (`doing`→`done`, `proposed`→`done`) and
  zero exits; `awaiting-human` enters from both `todo` and `doing`.
- `src/state/work.mjs:34` — `STATUSES = ['todo', 'doing', 'blocked',
  'proposed', 'done', 'awaiting-human']`.
- `src/state/frontier.mjs:129-146` (`hasOpenDescendant`) — recurses through
  `parent` chains, returns `true` (open) for any descendant whose
  `status !== 'done'`; this is what permanently anchors a parent whose
  child is stuck at `blocked`.
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — the concrete
  ADR that superseded tsk-4fu-1's own precondition (a worktree carrying a
  stale git-tracked `.fgos/` copy; `createWorktree` now deletes `.fgos/`
  outright on every worktree creation).
- `tsk-4fu-1` (status `blocked`, stage `executing`) — trigger case: parked
  at `blocked` with the closure reason in its own decision log, since
  forcing it through `proposed`→`done` would falsely claim a verify pass on
  work never built.
- `tsk-5h4` (status `proposed`, stage `clarify`) — sibling item, own concrete
  repro: closing tsk-2ib as a duplicate of tsk-3yl failed because the only
  path to `done` requires `stage compound-learn`, reachable only via
  `executing`, which itself requires a real `fgos discover` engine judgment
  call — no lightweight closure edge exists today for an item that needs no
  real code/decompose/execute work.
- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` — existing repo
  precedent for `superseded_by` as decision-doc vocabulary, cited as the
  reason D2 avoids reusing "superseded" as the work-item status name (would
  conflate two different mechanisms — decision-doc replacement chains vs.
  work-item closure).

## Deferred to planning

- Exact `TRANSITIONS` table edits (3 new `Object.freeze` entries) and
  `STATUSES` list update in `src/state/fsm.mjs` / `src/state/work.mjs`.
- Which CLI verb (new `fgos wontfix <id>`, or an existing verb like `move`
  extended to accept the new status) surfaces this transition, and whether
  it requires a `reason` the way `proposed`→`todo`/`proposed`→`blocked`
  already do (D2 implies yes, in spirit, but the field-level mechanism is
  planning's call).
- `hasOpenDescendant`'s exact code change (treat `wontfix` as resolved
  alongside `done` — one line, but the test coverage shape is planning's
  call).
- Whether `workflow-stage-graphs.mjs` / `fgos-routing`'s stage table need
  any change, or whether `wontfix` is purely a status-layer addition
  orthogonal to `stage`.
- Whether tsk-4fu-1 and tsk-5h4/tsk-2ib themselves get moved to `wontfix`
  once it exists (a follow-up application of this item's own output, not
  part of building the status itself).

## Outstanding questions

None — all material product decisions locked (D1-D5). Implementation shape
is `fgos-coding-planning`'s job.
