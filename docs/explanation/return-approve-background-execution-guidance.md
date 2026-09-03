---
authoritative_for: fgos return / fgos approve background-execution guidance, verify-command timeout precedent
---

# `fgos return`/`fgos approve` need the same background-execution fix `fanout-batch` got

`tsk-1uf` applies the exact same fix [`tsk-vuj` shipped for `dispatch.mjs
fanout-batch`](fanout-batch-background-execution-and-orphan-recovery.md)
to two more call sites that hit the identical problem: `fgos return` and
`fgos approve` both re-run an item's own full verify command (typically
`npm test && ...`, per the prescribed shape in `docs/how-to/write-verify-
for-a-skill-prose-change.md`) as part of their engine call — confirmed
live taking 224-386 seconds (`tsk-vuj`, 2026-08-20), well past the Bash
tool's 120-second default foreground timeout.

## Why this wasn't already documented

Neither `.agents/skills/fgos-coding-implement/references/return-
mechanics.md` (the `fgos return` mechanics doc) nor `plugins/fgOS/skills/
approve/SKILL.md` (the `fgos approve`/sync-root wrapper) told a calling
session to start these commands backgrounded proactively. A caller
previously only discovered the need by hitting the Bash tool's own
auto-background-on-timeout fallback — the same undocumented-timeout shape
`tsk-vuj` had just fixed for `fanout-batch` after it caused a real
exit-143 failure there.

## What shipped

The same background-execution guidance `tsk-vuj` added to
`wave-dispatch-mechanics.md` — run backgrounded (`run_in_background:
true`) from the start, wait for the harness's own completion
notification rather than polling — added to:

- `return-mechanics.md`'s `fgos return <id>` bash block (all four render
  copies: `.agents/skills/`, `.claude/skills/`, the nested `skills/`
  copy, `plugins/fgOS/skills/`)
- `plugins/fgOS/skills/approve/SKILL.md`'s step 6 `fgos approve`/
  `sync-root` bash block

Purely a documentation fix, consistent with the `fanout-batch` precedent
— no code change to `fgos return`/`fgos approve` themselves.
