---
type: explanation
title: Why the Iron Law gate only fires at the trunk boundary
tags: [iron-law, merge, gate, human-ux, approve]
source_capture_ids: [tsk-1y6-1, tsk-1y6-2, tsk-1y6-3, tsk-1y6-4]
authoritative_for: why the Iron Law gate only runs at the trunk merge boundary, why it's ask/warn (not a bypass field), and why one /fgOS:approve skill wraps both approve and sync-root
---
# Why the Iron Law gate only fires at the trunk boundary

`tsk-1y6` (parent), piece 1. Full design:
`docs/history/iron-law-gate-human-ux/CONTEXT.md`. Related:
`docs/explanation/iron-law-evidence-contract-stays-human-gated.md` (the
evidence contract this gate consumes — proof gathered, never
self-acknowledged).

## D1: the gate only runs where a person actually needs to decide

The Iron Law gate now only runs when the merge target **is trunk**.
Leaf→`fgw/<root>` merges and `sync-root` into a parent branch go straight
through, no question asked. The gate exists to protect what actually
reaches `main`; intermediate merges within a branch tree were never the
real risk surface.

## D2: the person decides, the agent operates

A person's approval in chat is sufficient to clear the gate — the agent
then runs the actual command, reads the exit code, fixes mechanical
errors, and retries on its own. The person is never asked to operate the
mechanism themselves, only to make the judgment call the gate exists to
surface.

## D3/D7: `ask`/`warn`, a dedicated config key, never folded into `gateBypass`

Two levels: `ask` (the default when nothing is configured — stop and
ask) and `warn` (opt-in — print a warning, log it, and merge anyway).
This lives in its own config key, `{"ironLaw": {"level": "ask"}}`, never
mixed into the existing `gateBypass` section — a different axis (this
gate is not a bypass mechanism, just a two-level severity choice),
registered with its own check+fix pair in `src/setup/registrations.mjs`
following the same shape `gateBypass` already established.

## D4: no bypass field on the work item itself

The level lives in config, never as a per-item field a work item could
carry to silently disable the gate for itself.

## D5: a blocked item never blocks anything else

An item that trips the gate doesn't create a person-shaped stop in the
usual sense — no `fgos ask`, no `awaiting-human`, no `/fgOS:answer`. The
mechanism is simply "skip this one and move on" at the skill layer; the
blocked item stays sitting at `awaiting-approval`, and every other ready
item keeps flowing normally. One item needing a person's judgment never
wedges the whole merge queue behind it.

## D6: the keyword-matching half was carved out entirely

Whatever keyword-based half of the original design existed was moved out
of this item's own scope and became a dependency on a separate item
(`tsk-1js`) instead — kept out rather than half-built here.

## D8: a `warn`-level skip leaves a real, machine-tagged trail

Every time the gate is skipped at `warn` level, it writes a `decision`
record tagged `kind: 'engine'` — the same tagging discipline
`docs/explanation/why-the-retrospective-content-gate-checked-the-wrong-fields.md`'s
whole family of fixes exists to enforce, applied correctly here from the
start rather than needing a later fix. No new event type was introduced
for this — the existing decision-record mechanism already covers it.

## D5 landed (`tsk-1y6-3`): `merge-loop`/`merge-next` skip and continue, then batch-report

The mechanical half of D5's "a blocked item never blocks anything else":
`merge-loop`/`merge-next` now read a `skipped` result and continue to
the next candidate instead of stopping the whole run. Every Iron-Law-held
item accumulates across the run and gets presented together, once, at
the end — the same "gathered call-back" shape `merge-loop`'s own Step 6
already documents (present the whole list, ask one combined question),
rather than a person being interrupted once per held item as the loop
walks past each one individually.

## Closing paperwork (`tsk-1y6-4`)

Once the design landed, the rule documents governing this area
(`RUL34`/`RUL37`) were updated to match, the superseded decision records
(`D16`/`D17` of the prior self-improve-loop design) were annotated as
superseded rather than edited in place, and `CHANGELOG.md` was updated —
the standard closing pass for a change that affects locked rules and a
prior decision record.

## D9: one `/fgOS:approve` skill, not two

A single `/fgOS:approve` skill now wraps both `approve` and `sync-root`,
inferring which verb a given id actually needs rather than making the
caller pick. Before asking a person anything, it's required to present
the real blast radius first — which verb, which root, how many children
ride along — so a person's yes/no answer is informed rather than blind.
(This is the exact skill this session used throughout its own drive,
including for its own eventual `/fgOS:approve tsk-4dk-1` call.) Landed
(`tsk-1y6-2`): the skill itself, inferring `approve` vs `sync-root` from
the target id and always presenting the blast radius before ever asking
a person anything.
