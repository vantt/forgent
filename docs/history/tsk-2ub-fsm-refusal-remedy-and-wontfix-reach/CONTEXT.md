# CONTEXT: FSM refusal never names a remedy, wontfix reaches only 3/10 statuses

Item: `tsk-2ub`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0 (message bug — safe, no product decision needed).** Root cause:
  `transitionWork`'s precondition refusal (`src/state/status-fsm.mjs:213-
  218`) builds its message from `from`/`to` alone, never consulting the
  in-scope `TRANSITIONS` table to name what IS legal. `src/state/
  cursor.mjs:24,27` is the one place in the state layer whose own error
  messages already state a remedy — the template this item's own
  description cites. Probed live: `todo/doing/blocked -> wontfix` succeed;
  `awaiting-approval`/`awaiting-human`/`delivered`/`retrospective`/
  `cleanup`/`done -> wontfix` (7 of 10 statuses) all refuse with
  `precondition` and no hint of what would work instead.
- **D1 (wontfix's 3-door limit — a deliberate 2026 decision, checked
  before touching it).** Read `docs/history/fsm-wontfix-terminal-status/
  CONTEXT.md` D3 in full: `wontfix` enterable from exactly `blocked`/
  `todo`/`doing` was a considered choice, covering the two concrete
  trigger cases known at the time (an item already parked at `blocked`,
  or closed directly from `clarify`/`todo`/`doing` as a duplicate). That
  decision's own `STATUSES` list (cited in its own Scout evidence,
  `src/state/work.mjs:34` at the time) was `['todo', 'doing', 'blocked',
  'proposed', 'done', 'awaiting-human']` — six statuses. `awaiting-
  approval` (renamed from `proposed`) and the entire `delivered ->
  retrospective -> cleanup -> done` chain (`work-item-status-delivered-
  retrospective-cleanup` D1/D2/D10) were added LATER, never revisited
  against D3's own 3-door scope. This item's own live evidence — 7 items
  currently parked at `awaiting-human`, forced to fabricate an answer
  just to reach `todo` before `wontfix` becomes reachable — is genuinely
  new information D3 never had, not an abstract re-litigation of a
  settled call.
- **D2.** Per the "User Decisions" rule (verified decisions get reversed
  only with new evidence, and a reversal gets presented as options, not
  silently applied): `delivered`/`retrospective`/`cleanup`/`done` are
  past-completion states — the work already happened. `wontfix` means
  "valid, never going to be done" (`fsm-wontfix-terminal-status` D2); it
  does not semantically fit a state where the work is already finished.
  No evidence in this item's own live data names a real case needing
  those four. `awaiting-human` is different in kind: it is a park state
  for an unanswered question, with no work yet committed either way — the
  same shape D3 already covered for `todo`/`doing` (also pre-work park
  states). Presented to a person as an explicit design choice (see
  `plan.md`'s Gate) rather than silently widened.

## Outstanding questions

None — the widening choice itself is presented at the plan gate, per D2,
not left open here.
