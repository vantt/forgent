---
type: how-to
title: How to check whether a suspected racing mechanism ever actually fired, before fixing it
tags: []
timestamp: 2026-08-10T13:15:00.000Z
source_capture_ids: [tsk-3cs]
---
# How to check whether a suspected racing mechanism ever actually fired, before fixing it

Use this when a person reports "multiple processes/mechanisms seem to be
racing/conflicting," and an obvious documented feature looks like the
likely cause — before writing a fix for that feature specifically.

## The trap this guards against

`tsk-3cs`'s own requester reported real, lived pain: multiple processes
racing into merge, having to babysit approve prompts across terminals.
The obvious suspect was `fgos-fanout`'s documented leaf-auto-approve
behavior — a real, shipped automation that approves leaves without a
human. Fixing "who is allowed to merge" around that mechanism would have
been a reasonable-looking next step.

## Steps

1. **Before touching the suspected mechanism, check whether it has ever
   actually fired**, using the real event log, not the mechanism's own
   documentation:

   ```
   grep -c "executor.dispatch" .fgos/events.jsonl
   ```

   (or the equivalent event-type filter for whatever mechanism is
   suspected).

2. **If the count is zero across the entire repo history, the suspected
   mechanism cannot be the cause** — a documented, shipped feature that
   has never fired for real cannot be racing with anything. Retract the
   hypothesis rather than defending it, and look for the actual cause.

3. **Trace the real cause instead** — often something more mundane than
   an automated race. `tsk-3cs`'s real cause: the *same person* running
   `/fgOS:merge-next` or approving by hand across several terminals at
   once — a manual, human-driven collision, not two automated mechanisms
   fighting.

## Real example (`tsk-3cs`)

> "The real cause of 'multiple processes racing into merge / having to
> babysit approve prompts across terminals' (reported from the
> requester's lived experience) is manual: the same person running
> `/fgOS:merge-next` or approving by hand across several terminals at
> once — not a conflict between two automated mechanisms. An initial
> hypothesis blaming `fgos-fanout`'s documented leaf-auto-approve
> behavior was checked against real event-log evidence
> (`executor.dispatch` = 0 events in the entire repo history, i.e. the
> runner's automated dispatch path has never fired for real) and
> retracted."
> — real locked decision D5, `docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md`

Consequence: no code fix was needed for "who is allowed to merge" — a
human was already, structurally, the only real actor. The item's actual
scope narrowed to what the person needed instead: a bottleneck-priority
tree view for the merge queue, and eventually (a separate item,
`tsk-2xt`) automating that human role so nobody has to babysit terminals
manually.

## Why this matters

A plausible-sounding documented mechanism is not evidence that it's
actually running. Fixing the wrong mechanism costs real implementation
effort and leaves the true cause (here, a purely human/process issue)
completely untouched — the reported pain would have persisted after the
fix landed, with the fix itself adding unneeded complexity around a
feature that was never the problem.

## Related

- `docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md` — full
  decision record (D1–D7), including the bottleneck-priority tree design
  this item actually built once the wrong hypothesis was ruled out.
