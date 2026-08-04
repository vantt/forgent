---
type: context
title: "tsk-45a — milestone closed with tsk-49o descoped, verify field fixed"
---

# tsk-45a — milestone closeout, tsk-49o split out

## Outcome

Milestone originally gated on 3 hardening items: tsk-49o (OS-level sandbox
defense-in-depth), tsk-32n (data-governance field), tsk-418 (generalized
retry/escalation). tsk-32n and tsk-418 were already `done`; tsk-49o is
still `todo` at stage `clarify` (its own verify is undetermined — "chưa
xác định — P15 bổ sung") and needs its own primitive-verification pass
(bubblewrap/firejail/seccomp on Linux, sandbox-exec on macOS) before real
implementation can start.

Decision (user, this session): split tsk-49o out of this milestone's
close-out gate so tsk-45a can close now on the 2 finished items; tsk-49o
continues independently, unblocked, for later work — it already has no
`deps` pointing back at tsk-45a, so nothing else changes for it.

## Why the `targets` array still lists tsk-49o

`work.targets` (`src/state/work.mjs`) is set once at `fgos add` time and is
not in `EDITABLE_FIELDS` (`src/state/store.mjs`) — `fgos edit` cannot
remove an entry from it after creation. The array on this item still reads
`[tsk-49o, tsk-32n, tsk-418]`; treat it as a historical record of the
milestone's original scope, not the live close-out gate. The live gate is
this item's own `verify` field (below), which `fgos return`/`fgos approve`
actually run.

## Fix

`fgos edit tsk-45a --verify` replaced the original prose (non-executable,
same defect class as tsk-41b) with a real check over only the 2 remaining
targets:

```
node bin/fgos.mjs show tsk-32n --json | grep -q '"status": "done"' && node bin/fgos.mjs show tsk-418 --json | grep -q '"status": "done"'
```

Confirmed passing by hand before `fgos return`.

## Reference

- `docs/history/tsk-5hh/CONTEXT.md` — same verify-field-fix pattern, applied
  one milestone earlier in this MVP (tsk-4lc).
- `plans/reports/agent-executor-design-260801-1159-synthesis-goal-constraints-gaps-report.md`
