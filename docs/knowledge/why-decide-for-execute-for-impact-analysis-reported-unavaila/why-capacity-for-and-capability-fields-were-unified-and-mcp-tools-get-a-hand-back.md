---
type: explanation
title: Why capacity for and capability fields were unified, and MCP tools get a hand-back
tags: [dispatch, capacity, mcp, impact-analysis, capability-gate]
source_capture_ids: [tsk-45f]
authoritative_for: why decide --for/execute --for impact-analysis reported unavailable despite a registered gitnexus capacity, and how the for/capability field split was unified
framework: diataxis
mode: explanation
---
# Why capacity `for`/`capability` fields were unified, and MCP tools get a hand-back

`tsk-45f`. Real bug, confirmed by direct command output on 2026-08-16:

```
decide  --for impact-analysis  ->  {"mechanism":"unavailable"}
execute --for impact-analysis  ->  no capacity registered for purpose "impact-analysis"
```

— even though the committed config declared *both* halves fully:
`runner.capabilities` had an `"impact-analysis"` entry (the promise), and
`capacities.gitnexus` had `capability: "impact-analysis"` (the
fulfillment). An agent — including this session's own required
impact-analysis capability-gate check per `CLAUDE.md` — still couldn't
ask fgOS whether that capability was actually served.

## Root cause: two fields, two readers, neither ever populated the one that mattered

Two fields carried overlapping meaning on the same capacity entry:
`resolveCapacityIdForPurpose` (`dispatch.mjs`) only read `capacity.for`;
`toolsFromCapacities` only read `capacity.capability`. In the real
config, **zero** capacities declared `for` at all (`agy`/`gitnexus`/
`herdr` all lacked it) — so the `--for` door always queried into an
empty field, regardless of what `capability` said. This was the
unfinished half of an earlier decision (`tsk-in1` D4): the
`runner.capabilities` catalog had already been unified and both sides
validated against it, but the two lookup paths underneath it were never
actually reconciled.

## The fix, three pieces

1. **Field reads unified.** `toolsFromCapacities` and
   `resolveCapacityIdForPurpose` now read the same consolidated field
   shape — no more silent split between `for` and `capability`.
2. **MCP invocations gain an optional `capability -> tool` map.** A
   `kind: "tool"` capacity's `invocations` entry can now declare which
   MCP tool serves which purpose directly.
3. **`decide` hands back `mcpTool` for a tool-kind capacity's declared
   purpose**, mirroring the existing `agentType` hand-back for an
   agent-kind capacity — `dispatch` still has no MCP client of its own,
   so the caller calls its own MCP tool directly, the same "hand back,
   never execute on the caller's behalf" pattern the whole dispatch
   redesign already establishes (see
   `docs/explanation/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md`
   for the base mechanism this extends).

`gitnexus`/`herdr` were migrated to the new `for[]` + `tools` map shape
as part of landing the fix — the real capacities the impact-analysis
capability gate depends on.
