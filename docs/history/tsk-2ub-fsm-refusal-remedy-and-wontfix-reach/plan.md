# Plan: FSM refusal names a remedy; awaiting-human gains a wontfix door

Item: `tsk-2ub`. Mode: **small** — one message-format change (safe, no
design question) plus one narrowly-scoped, explicitly-gated FSM edge
addition. No split.

## Approach

1. **Message fix (D0, unconditional).**
   `transitionWork`'s precondition refusal (`src/state/status-fsm.mjs:213-
   218`) computes `TRANSITIONS.filter((e) => e.from === from).map((e) =>
   e.to)` and appends it to the message: `" -- valid targets from
   \"${from}\" are: ${validTargets.join(', ')}"` when non-empty, or `" --
   \"${from}\" is a terminal status with no outgoing transitions"` when
   empty (mirrors `cursor.mjs:24,27`'s own remedy-stating pattern, this
   item's own cited template). Pure information improvement — the
   `TRANSITIONS` table is already in scope, nothing about the FSM's real
   behavior changes.
2. **`awaiting-human -> wontfix` edge (D1/D2, presented at the gate
   below).** Adds one `Object.freeze({ from: 'awaiting-human', to:
   'wontfix' })` entry to `TRANSITIONS`. Update
   `test/state/fsm.test.mjs:150-197`'s `legalEdges` set to add
   `'awaiting-human->wontfix'` (the sweep test would otherwise expect this
   pair to still refuse). No `reason`/`ask`/`answer` requirement added —
   matches `wontfix`'s three existing doors, none of which require one
   either (per `fsm-wontfix-terminal-status` D2: the closure reason lives
   in the item's decision log, not a transition-payload field).
3. **`delivered`/`retrospective`/`cleanup`/`done -> wontfix` are NOT
   added.** `CONTEXT.md` D2: these are past-completion states; `wontfix`
   means "valid, never going to be done," which doesn't semantically fit
   work already finished. No live evidence in this item names a real case
   needing them.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Message fix | low — additive text only, no behavior change | Existing 22+ FSM tests checked in full: none assert exact message text for the precondition-refusal path (only `category`/`code`), so nothing pinned to break |
| `awaiting-human -> wontfix` edge | medium — a real FSM behavior change, reversing part of a prior deliberate decision (`fsm-wontfix-terminal-status` D3) | `CONTEXT.md` D1's full derivation: D3's own `STATUSES` list at decision-time excluded this and 4 other now-existing statuses entirely; this item's own live count (7 items currently parked at `awaiting-human`) is new evidence D3 never had. Presented as an explicit gate question below rather than silently applied |
| `test/state/fsm.test.mjs`'s exhaustive sweep test | low, but must be updated in lockstep with the edge addition | `legalEdges` set (`:150-176`) read in full — confirmed it must gain `'awaiting-human->wontfix'` or the sweep would wrongly expect that pair to still refuse |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. `src/state/status-fsm.mjs` is on `MODULE_RULES` (kernel-adjacent
state module), so Iron Law evidence with a real failing-test-first
transcript is the proof surface, not a skip.

## Gate

In addition to the standard plan-approval question, this plan needs an
explicit answer on the `awaiting-human -> wontfix` edge specifically
(D1/D2): **add it, or leave `wontfix` at its original 3 doors and ship
only the message fix?**

## Outstanding questions

- Whether to add the `awaiting-human -> wontfix` edge (see Gate above) —
  deliberately left open for a person to decide, not an oversight.

