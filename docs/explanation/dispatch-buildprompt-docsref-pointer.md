---
authoritative_for: dispatch buildPrompt docsRefPointer, out-of-process worker prompt missing plan.md/CONTEXT.md, undocumented footprint workaround
---

# An out-of-process worker's prompt now points at `plan.md`/`CONTEXT.md` automatically

`tsk-2ux` closed a real gap between the driver's own context and what an
out-of-process dispatched worker actually received: `dispatch.mjs
execute`'s `buildPrompt` (`src/runner/dispatch/prepare.mjs`) never
surfaced an item's `docsRef`/`plan.md` to the worker's prompt — its
"Files to read first" section was derived purely from `work.footprint`,
with zero awareness of `docsRef`.

## The gap, and how it was worked around before this fix

For any coding item that cleared `fgos-coding-planning` — meaning a real
`docs/history/<feature>/plan.md` exists with the chosen approach,
rejected alternatives, and risk map — dispatching that item's Implement
step out-of-process sent the worker a prompt built from title/
description/refs/footprint only. The worker never learned `plan.md`
existed unless the driving session manually noticed the gap and stuffed
the plan path into the item's `footprint` via `fgos edit --footprint` —
an undocumented workaround, not part of any skill's written flow.
**Confirmed live on [`tsk-37d`](state-write-single-stringify.md)**: had
to run this manual edit by hand before dispatching, purely so the
out-of-process worker (`agy`/`gemini`) would read the plan's chosen
approach instead of possibly re-deriving — or worse, re-inventing — its
own.

`fgos-coding-implement/SKILL.md` and its `implement-and-collaboration.md`
already instructed the **driver itself** to read `docsRef` when present
(Step 1 Orient) — but said nothing about wiring `docsRef` into the
dispatch payload when the mechanism resolves out-of-process. The two
paths (driver reads it itself vs. a dispatched worker) silently diverged
in how much planning context they received.

## What shipped

`buildPrompt` now derives a `docsRefPointer` template variable directly
from `work.docsRef`: when present, it renders a pointer naming both
`<docsRef>/plan.md` **and** `<docsRef>/CONTEXT.md` (if present) as "the
locked decisions and chosen approach for this item," `(none)` otherwise.
Wired into `worker-prompt-skill-pointer.txt` the same way `skillPath` was
already resolved and rendered — a pure render-time addition, no new
stored field needed. Closes the gap for `CONTEXT.md` as well as
`plan.md`, matching the discovery scope's own open question about
whether the same gap applied there.
