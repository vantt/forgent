---
type: context
title: "tsk-5hh — milestone closed, no code change; verify field fixed"
---

# tsk-5hh — milestone closeout

## Outcome

Milestone with no own implementation: both declared targets, tsk-slq
(platform-agnostic agent-type root + projection) and tsk-5l2 (first real
submit-assist proof-of-concept dispatching to a cheaper external model),
had already reached `done` before this item was claimed. No code change
in this item's own scope.

## Why the first return attempt was blocked

The item's `verify` field held a prose sentence ("Done when tsk-slq ...
and tsk-5l2 ... both reach done"), not a runnable shell command — the same
non-executable-verify defect class already known as tsk-41b. `fgos return`
ran it literally as `/bin/sh -c`, which failed with a shell syntax error
on the parenthesized clause, moving the item to `blocked`.

## Fix

`fgos edit tsk-5hh --verify` replaced the prose with a real check that
reads both targets' recorded status directly:

```
node bin/fgos.mjs show tsk-slq --json | grep -q '"status": "done"' && node bin/fgos.mjs show tsk-5l2 --json | grep -q '"status": "done"'
```

Confirmed passing by hand before the retried `fgos return`.

## Reference

- `docs/history/tsk-slq/` (tsk-slq)
- `plans/reports/agent-executor-design-260731-1758-capacity-backend-dispatch-proposal-report.md`
