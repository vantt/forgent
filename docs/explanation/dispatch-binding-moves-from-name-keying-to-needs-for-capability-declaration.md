---
title: Why dispatch binding moved from name-keying to needs/for capability declaration
---

# Why dispatch binding moved from name-keying to needs/for capability declaration

## The root problem (tsk-1o7, tsk-5td D5/D6)

`resolveExecutorConfig` bound a capacity to a provider by matching on
name: `tools[capacityId]`. This isn't sloppiness — it's forced by the
supply side declaring a capability while the demand side declares
nothing to match against, so the code has no choice but to fall back to
the one name both sides happen to share.

That forced fallback broke silently in two concrete places once names and
capabilities drifted apart:

- `.claude/skills/_shared/capacity-dispatch-fallback.md` Step B queried
  `--capability <CAPACITY_ID>` — the capacity's own id, not a real
  capability. When the registry changed but this string didn't, the skill
  printed "backend isn't available" and quietly fell back to inline
  execution — no error, no warning.
- `docs/history/agent-executor-submit-assist-classify/CONTEXT.md`'s own
  D3 had recorded that a tool "must be registered via `--capability
  submit-assist-classify` before `resolveExecutorConfig` can resolve" —
  but the resolver's real code (`dispatch.mjs`) only ever required
  `--name` to match; `--capability <label>` was a free-text placeholder.
  A locked decision had conflated the tool's own display label with the
  resolver's actual match key.

fgOS's own governing rule (US-027): the core consults *capabilities*,
never tool names. Name-keying was a structural violation of that rule,
not an edge case of it.

## The fix: two fields, two different jobs

The demand side (a capacity in `.fgos/config.json`) now declares two
independent optional fields:

- **`needs`** — the capability required, i.e. which *provider* can serve
  this capacity. This is the field that actually drives binding:
  `resolveExecutorConfig` searches the tool registry for entries whose
  `capability` matches `needs`, requires at least one match with
  `resolvedStatus(...) === 'present'`, and only then resolves — the same
  two-step "registered? / present?" shape the code already used for
  name-keying, just keyed on capability instead of name.
- **`for`** — the purpose (`gather` | `judge`), i.e. which *lane/protocol*
  applies. This field has no functional consumer yet in this migration —
  it's added to the schema and vocabulary so a later item
  (`tsk-2ie5`) can consume it without a second schema migration.

The two fields don't compete for the same question — asking "which
lane?" always resolves to `for` for a gather-style query, while "which
provider?" is what `needs` answers regardless of lane. Declaring only one
of the two loses one axis of information.

## The backward-compatible seam

`resolveExecutorConfig` keeps today's exact `tools[capacityId]` name
lookup unchanged whenever a capacity declares no `needs` — the real
`submit-assist-classify` capacity in production `.fgos/config.json` has
no `needs` field until a follow-up item sets it, and must keep resolving
exactly as it does today until then. This is what let the code/test/doc
change land as its own item, fully behind a flag no real capacity was
using yet, with the actual config migration split into a separate
follow-up.

## Splitting the config edit at plan time, not merge time

`tsk-1o7`'s own description flagged in advance that any part of the
change touching `.fgos/config.json` would hit ADR0020's
`fgos-write-rejected` guard, which permanently blocks a `.fgos/` change
from landing through `fgos approve` on a `fgw/<id>` branch (see
`docs/how-to/fix-fgos-write-rejected-merge-block.md`, precedent
`tsk-4eu`/`tsk-5ge`). Rather than repeat that precedent's own
after-the-fact split-and-fix cycle, this item's plan split the
`.fgos/config.json` content change into a separate child item from the
start — proof that a friction pattern discovered once (`tsk-4eu`) can be
designed around proactively in a later, related item, instead of being
rediscovered the hard way each time.
