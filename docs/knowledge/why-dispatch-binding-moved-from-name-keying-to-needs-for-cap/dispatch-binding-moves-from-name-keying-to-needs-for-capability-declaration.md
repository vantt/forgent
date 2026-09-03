---
title: Why dispatch binding moved from name-keying to needs/for capability declaration
framework: diataxis
mode: explanation
---

# Why dispatch binding moved from name-keying to needs/for capability declaration

## The root problem (tsk-1o7, tsk-5td D5/D6)

`resolveExecutorConfig` bound a executor to a provider by matching on
name: `tools[executorId]`. This isn't sloppiness — it's forced by the
supply side declaring a capability while the demand side declares
nothing to match against, so the code has no choice but to fall back to
the one name both sides happen to share.

That forced fallback broke silently in two concrete places once names and
capabilities drifted apart:

- `.claude/skills/_shared/executor-dispatch-fallback.md` Step B queried
  `--capability <EXECUTOR_ID>` — the executor's own id, not a real
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

The demand side (a executor in `.fgos/config.json`) declared two
independent optional fields (`needs` retired since, see the closing
section below — this section stays in past tense as the historical record
of why the split was made, not a description of today's live code):

- **`needs`** — the capability required, i.e. which *provider* can serve
  this executor. This was the field that actually drove binding:
  `resolveExecutorConfig` searched the tool registry for entries whose
  `capability` matched `needs`, required at least one match with
  `resolvedStatus(...) === 'present'`, and only then resolved — the same
  two-step "registered? / present?" shape the code already used for
  name-keying, just keyed on capability instead of name.
- **`for`** — the purpose (today: `judge` only, `gather` retired since —
  see the closing section), i.e. which *lane/protocol* applies. This field
  had no functional consumer yet in this migration — it was added to the
  schema and vocabulary so a later item (`tsk-2ie5`) could consume it
  without a second schema migration.

The two fields don't compete for the same question — asking "which
lane?" always resolves to `for` for a gather-style query, while "which
provider?" is what `needs` answers regardless of lane. Declaring only one
of the two loses one axis of information.

## The backward-compatible seam

`resolveExecutorConfig` keeps today's exact `tools[executorId]` name
lookup unchanged whenever a executor declares no `needs` — the real
`submit-assist-classify` executor in production `.fgos/config.json` has
no `needs` field until a follow-up item sets it, and must keep resolving
exactly as it does today until then. This is what let the code/test/doc
change land as its own item, fully behind a flag no real executor was
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

## The predicted consumer arrives (tsk-2ie5/tsk-2c1/tsk-28o)

`for` sat validate-only, as predicted above, until `tsk-2ie5` — bringing
`fgos-researching`'s gather fan-out into the executor mechanism, keyed by
purpose since a runtime-composed research prompt never has a
pre-registered id to match by name. Three things happened exactly as this
doc anticipated, and one genuinely new wrinkle showed up.

**As anticipated:** the `for`/`needs` split held up unchanged — a real
`resolveExecutorIdForPurpose(cfg, 'gather')` scan needed no schema
migration, just a new resolution function reading the field this doc's
own item already shipped. The ADR0020 split-at-plan-time pattern repeated
too: `tsk-2ie5` split into `tsk-2c1` (code) and `tsk-28o` (the
`.fgos/config.json` registration, landed as a direct main commit, same
shape `tsk-4eu`/`tsk-5ge` established) from the start, no after-the-fact
scramble.

**The new piece — `carries` (D15, `tsk-5td`):** binding by purpose still
left one question unanswered: a executor that accepts cross-provider
dispatch has no way to declare *what content* it's safe to receive. A
gather branch's prompt routinely includes repo file paths (its own
`inputs` field, per `_shared/executor-dispatch-fallback.md`'s ad-hoc
packet shape) — a fundamentally riskier payload than a fixed classify
question. `carries` (`user-text` | `repo-content`, closed enum, `secrets`
never legal) is the third field a executor declares alongside `for`/
`needs`, with a REAL pre-dispatch gate in `resolveExecutorConfig` — not
metadata nobody reads (the exact `sensitiveData` fate D15 supersedes,
`docs/history/agent-executor-submit-assist-classify/CONTEXT.md` D7): a
`carries: "user-text"` executor handed `repo-content` is refused before
any spawn.

**The wrinkle this doc's own prediction didn't anticipate:** `tsk-28o`
forked from `tsk-2ie5` *after* its sibling `tsk-2c1` had already merged
into it, so Iron Law's `matchedModules` named `dispatch.mjs` for an item
that never touched it — the classifier reading the real diff correctly,
just not the diff a human would guess from the item's own footprint field.
The fix wasn't disputing the classifier; it was citing the sibling's
already-produced proof instead of re-deriving it
(`docs/history/tsk-2c1/iron-law-evidence.md`,
`docs/how-to/fix-fgos-write-rejected-merge-block.md`'s own new `tsk-28o`
example).

## Both fields retired (tsk-5tm-1 D1, tsk-5tm-2 D6)

`needs` and `gather` — the one real pairing this whole migration was
built for — were both retired within the same later item
(`tsk-5tm`), for two separate but related reasons:

- **`needs` (D1):** `resolveExecutorConfig`'s presence gate only ever ran
  for `executor.kind !== 'task'` — but 2 of the 3 real executors that
  ever declared `needs` (`judge-discovery`, `judge-decompose`) were
  `kind: "task"`, so the gate never actually consulted `needs` for them;
  it was dead data. The third (`gather`) had `needs` genuinely reachable,
  but the gate added no signal beyond what the OS's own ENOENT already
  gives on a missing binary. `resolveExecutorConfig`'s whole
  presence/staleness gate was removed rather than kept half-alive — `fgos
  tool query --status present/stale` is the sanctioned place to ask
  presence/staleness directly at a call site, and reconstructing that same
  check inside `dispatch.mjs` was judged not worth keeping for a signal
  this thin.
- **`gather` (D6):** the one executor that ever exercised `for`'s
  purpose-lookup mechanism end to end was also `needs`'s one live
  consumer, and it was retired separately: `gather` was the sole
  cross-provider dispatch path in the system, and no architectural
  decision on record ever named a real reason cross-provider dispatch was
  needed here (`tsk-2ie5`'s own plan.md said the provider was "not decided
  in this plan, not guessed ahead of time"). The one documented reason
  (parallelizing wall-clock across research branches) was already met by
  native Task-tool dispatch, so removing `gather` cost nothing real.

`for`/`resolveExecutorIdForPurpose` itself is NOT retired — the JOB vs
MECHANISM distinction this doc's own split predicted (`for` = which lane,
`needs` = which provider) held up as a concept even though `needs`'s own
field is gone; `for` still resolves `judge-discovery`/`judge-decompose` by
purpose today (unused in practice — both callers use a fixed id directly,
per `tsk-5tm` `CONTEXT.md` D10 — but tested and ready for the next
producer that needs it). Presence/staleness, when a future executor
genuinely needs that check again, goes through the tool registry directly
at the call site, never a field on `executors.<id>` re-litigated here.
