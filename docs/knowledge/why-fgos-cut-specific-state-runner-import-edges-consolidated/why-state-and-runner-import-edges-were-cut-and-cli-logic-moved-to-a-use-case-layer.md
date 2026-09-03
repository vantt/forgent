---
type: explanation
title: Why state/runner import edges were cut and CLI logic moved to a use-case layer
tags: [architecture, module-boundary, state, runner, iron-law, cli]
source_capture_ids: [tsk-49i-1, tsk-49i, tsk-49i-2]
authoritative_for: why fgOS cut specific state<->runner import edges, consolidated the Iron Law check, and started extracting bin/fgos.mjs's inline verb logic into a src/verbs/<domain>/<verb>.mjs use-case layer
framework: diataxis
mode: explanation
---
# Why state/runner import edges were cut and CLI logic moved to a use-case layer

`tsk-49i` (parent), piece 1 (`tsk-49i-1`). Full design:
`docs/history/state-runner-merge-boundary/CONTEXT.md`.

## D1: four specific import edges cut, plus a new Iron Law helper

Exactly four cross-boundary import edges between `src/state/` and
`src/runner/` were cut:

- `drift-status.mjs` now receives `trunk` as a required parameter instead
  of importing it.
- `session-identity.mjs` moved out of the state/runner boundary entirely
  (see D2).
- `resolveRoot` moved to `state/frontier.mjs`, where it actually belongs
  by responsibility.
- A new `src/runner/iron-law-gate.mjs` consolidates three separate
  copy-pasted Iron Law check implementations into one, and
  `isMainWorktree`/`detectTrunk` moved into `worktree.mjs`.

This was done as a plain JS refactor, deliberately not gated on the
timing of any future Rust port, and deliberately not widened to any
other `runner/` module beyond these four edges.

A fifth edge was found mid-implementation, added to `main` by a different
commit (`ac1e30f1`, `normalizePath`) *after* this item's own plan had
already been written — not in the original action text since it couldn't
be patched in via `fgos edit`. **Fix, folded in**: `normalizePath` moved
to `src/util/normalize-path.mjs` (the kernel layer), with all four real
consumers updated (`frozen-judge.mjs`, `runner/merge.mjs`,
`state/graph-metrics.mjs`, and `bin/fgos.mjs`, which needed its own
import split apart from where it was bundled together with
`frozenJudgeHits`/`footprintDiffHits`). Two more session-identity
references a prior research round had missed were also closed:
`_shared/capacity-dispatch-fallback.md:176` and a test-file path key
inside `scripts/check-decision-codes.baseline.json`.

## D2: `session-identity.mjs` goes to `src/util/`, no new `src/platform/`

The moved module lands in the existing `src/util/` directory rather than
a newly-created `src/platform/` folder — no new top-level architectural
category was introduced just to house one relocated file.

## D3/D4: `bin/fgos.mjs`'s inline verb logic starts moving to a use-case layer

A wider scope decision, on the CLI layer's own single-responsibility
axis: the real business logic currently living inline inside
`bin/fgos.mjs`'s `merge`/`approve`/`review`/`sync-root`/`catchup`/
`reject`/`promote-to-component` cases is being extracted into a separate
use-case layer, so `bin/fgos.mjs` itself shrinks down to parse args →
call one use-case function → format the `fgos.v1` JSON envelope.

That use-case layer lives at `src/verbs/<domain>/<verb>.mjs`, nested by
domain from the start — this cluster lands its first slice at
`src/verbs/merge/`. Landed (`tsk-49i-2`): the merge verb cluster's own
use-case logic actually extracted into `src/verbs/merge/` — the first
real slice built on this convention. This does **not** imply migrating the 7 existing
files that already sit at roughly use-case rank
(`runner/loop.mjs`, `intake/{discovery,plan,classify}.mjs`,
`setup/{checks,registrations}.mjs`, `state/cursor.mjs`) — those stay
where they are; this is a forward convention for new/extracted code, not
a repo-wide migration mandate.

## D5: a helper relocation is a layering fix, not a scope creep

Moving `collectOutcomeEntry`/`collectFrictionData` to
`src/report/item-trace.mjs` is understood as correcting logic that was
sitting at the wrong layer (`entry`) back to where it actually belongs
(`domain`) — explicitly not treated as "reaching outside this cluster's
scope into the `check` verb."
