---
type: explanation
title: Why .fgos/events.jsonl can silently lose lines under concurrent session writes
tags: []
source_capture_ids: [tsk-2xt]
---
# Why `.fgos/events.jsonl` can silently lose lines under concurrent session writes

`.fgos/events.jsonl` is fgOS's own append-only audit log — every mutating
verb funnels through it. Under investigation (`tsk-1q5`) as a real
lost-update bug: raw log lines can go missing entirely, not just a
derived cache going stale, when multiple sessions write against the same
shared main checkout at once.

## A real, observed instance (`tsk-2xt`)

While redoing bookkeeping for `tsk-2xt` (the herdr-orchestrator root
item), a `goal-check` run against its branch failed:

> `{"id":"tsk-2xt","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on branch \"fgw/tsk-2xt\" (exit 127)","ts":"2026-08-10T08:00:42.789Z"}`
> — real `work.friction` capture, id `tsk-2xt`

Exit `127` is a shell "command not found" — the item's own `verify` field
had reverted from a real test command back to a placeholder string
(`"chưa xác định"`, Vietnamese for "not yet determined"), which
`goal-check` then tried to execute literally as a shell command
(`/bin/sh: chưa: not found`). The recorded settlement for this friction
is the same placeholder, unresolved at capture time:

> `{"kind":"clarify-pass","role":"session","detail":"chưa xác định — bổ sung thủ công","id":"tsk-2xt"}`
> — real `work.settlement` capture, id `tsk-2xt`

This was not a fresh bug in `tsk-2xt`'s own work — it was a second event
type going missing from the log for the same item, alongside a whole
transition chain (`validateApprove`, `decompose`→`executing`,
`delivered`) that had vanished from `.fgos/events.jsonl` even though the
underlying code stayed intact on git:

> "while redoing bookkeeping for tsk-2xt, two distinct event types were
> confirmed missing from `.fgos/events.jsonl` for the same item — (a) the
> entire post-`planApprove` transition chain ... vanished from the log
> though the real code stayed intact on git; (b) a `work.edit` that set
> `verify` to a real test command was also lost, so `verify` reverted to
> the placeholder string, which a later `return` then tried to execute as
> a shell command (`/bin/sh: chưa: not found`)."
> — real addendum, `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md`

## Why this points at the log itself, not a cache

`tsk-1q5`'s own investigation names two candidate causes: (A) `state.json`
being rebuilt outside the same lock its own append uses (a derived-cache
race), and (B) `events.jsonl` being git-tracked in the one shared main
checkout, where a `git checkout`/`reset --hard`/merge from *any other*
concurrent session can silently discard uncommitted appends. `tsk-2xt`'s
instance is raw log lines disappearing, not a stale rebuild — the same
signature as candidate B, and the plan's own addendum treats it as
strengthening B as the more likely dominant cause.

## Related

- `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md` — the full
  root-cause investigation (two candidate causes, proof points, and this
  addendum) this instance corroborates.
- `AGENTS.md`'s own documented main-checkout hazard (tsk-3au/tsk-4hk) —
  the same class of danger candidate B names: any session sharing the
  main checkout can discard another session's uncommitted work.
