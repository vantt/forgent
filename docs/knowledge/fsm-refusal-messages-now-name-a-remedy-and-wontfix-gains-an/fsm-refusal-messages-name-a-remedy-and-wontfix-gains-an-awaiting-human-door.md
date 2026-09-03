---
type: explanation
title: FSM refusal messages now name a remedy, and wontfix gains an awaiting-human door
tags: []
source_capture_ids: [tsk-2ub]
framework: diataxis
mode: explanation
---
# FSM refusal messages now name a remedy, and `wontfix` gains an `awaiting-human` door

`transitionWork`'s precondition refusal (`src/state/status-fsm.mjs`)
used to build its error message from `from`/`to` alone, never consulting
the in-scope `TRANSITIONS` table to say what *would* work — even though
that table was already in reach. `src/state/cursor.mjs` was the only
other place in the state layer whose own error messages already named a
remedy; this item generalized that pattern to the FSM's own refusals.

## The real cost this message gap caused

Probing every status against `-> wontfix` found only 3 of 10 succeeded
(`todo`/`doing`/`blocked`) — the other 7
(`awaiting-approval`/`awaiting-human`/`delivered`/`retrospective`/
`cleanup`/`done`) all refused with a bare `precondition` error, no hint
of a working alternative. At the time, 7 real items sat parked at
`awaiting-human`, now meaningless and wanted closed — but with no direct
door to `wontfix`, closing one required fabricating an `answer` entry
just to route back to `todo` first, before `wontfix` became reachable:
deliberately writing a false entry into a permanent, append-only event
log purely to satisfy a state-machine plumbing gap.

## Why `wontfix`'s original 3-door limit didn't already cover this

`fsm-wontfix-terminal-status`'s own design (`docs/history/fsm-wontfix-
terminal-status/CONTEXT.md` D3) deliberately scoped `wontfix` to exactly
`blocked`/`todo`/`doing` — covering the two trigger cases known at the
time: an item already parked `blocked`, or one closed directly from
`clarify`/`todo`/`doing` as a duplicate. That decision's own status list
was six values (`todo`, `doing`, `blocked`, `proposed`, `done`,
`awaiting-human`) — `awaiting-approval` (`proposed` renamed) and the
entire `delivered -> retrospective -> cleanup -> done` chain were added
*later*, and the door count was never revisited against the wider
schema. `awaiting-human`'s absence from the original 3 doors wasn't a
deliberate exclusion — the state that would have exercised it barely
existed yet when D3 was decided.

## Why only `awaiting-human` was added, not all 7

Per the "User Decisions" rule (a verified decision only reverses with
new evidence, and the reversal is presented as options, not silently
applied), this widening was scoped precisely rather than broadly:

- **`delivered`/`retrospective`/`cleanup`/`done`** are past-completion
  states — the work already happened. `wontfix` means "valid, never
  going to be done" (the original design's own D2) — that doesn't
  semantically fit a state where the work is already finished, and
  no real evidence in this item's own data named a case needing those
  four.
- **`awaiting-human`** is different in kind: a park state for an
  unanswered question, with no work committed either way — the same
  shape D3 already covered for `todo`/`doing` (also pre-work park
  states). This is genuinely new evidence D3 never had (7 real,
  currently-stuck items), not an abstract re-litigation of a settled
  call — so it was presented to a person as an explicit plan-gate
  choice, and confirmed: add the door.

The new door inherits the existing generic answer-required rule for any
`awaiting-human` exit, unchanged — closing to `wontfix` from there still
requires a real `fgos answer`, just no longer a fabricated one routing
through `todo` first.

## Related

- `docs/history/fsm-wontfix-terminal-status/CONTEXT.md` — the original
  3-door design (D1–D3) this item's D1 revisited with new evidence.
- `docs/explanation/wontfix-terminal-status-filter-consistency.md` — a
  separate, later sweep on the *reading* side (which "is this resolved?"
  checks need to treat `wontfix` like `done`) — distinct from this
  item's *transition-table* door-count question.
- `docs/history/tsk-2ub-fsm-refusal-remedy-and-wontfix-reach/CONTEXT.md`
  — full decision record (D0–D2).
