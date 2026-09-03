---
authoritative_for: fgos list --id callThreads scoping leak, singleView construction in bin/fgos.mjs
---

# `fgos list --id` no longer leaks every item's `callThreads`

`tsk-5dnt` closed a real, confirmed-live payload leak: `fgos list --id
<id> --json` scopes `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` to the requested item
(via `scopedById(...)`, an earlier `tsk-2u9` fix), but `callThreads` was
missing from that override list — `singleView` spread `...rawView`
first, so `callThreads` fell through unscoped and every item's call
threads leaked on every single-item request.

## Confirmed live, not theoretical

`fgos list --id tsk-2vn --json` returned `callThreads` entries for
unrelated items (`tsk-3ki`, `tsk-1yf`, and many more) — ballooning a
single-item read to 100+KB, growing with total backlog size rather than
the size of the one requested item. This cost was paid on **every** fresh
state read across the whole coding-domain lifecycle: `fgos-coding-
driving`'s own loop re-reads `list --id` at the top of every iteration,
and every stage-skill's own Orient step does the same.

**No reader ever consumed the leaked data.** A grep across
`.agents/skills` found zero references to `callThreads` anywhere — no
skill reads it back from a `list --id` response. Every byte of the leak
was pure waste.

## What shipped

One line: `callThreads: scopedById(rawView.callThreads)` added to
`singleView`'s construction in `bin/fgos.mjs`'s `list --id` handler
(around line 2254), the same scoping shape the other seven sections
already used.

## Why the fix targets `list --id`, not a migration to `show`

The `show` verb (`bin/fgos.mjs:2365-2382`) is already correctly scoped
for what it returns and never includes `callThreads` at all — but its
JSON shape is genuinely different from `list --id`'s: `show`'s fields are
**de-keyed** (`data.work` IS the item object directly, `data.discovery`
IS the item's array directly), while `list --id`'s fields stay
**id-keyed dicts** after scoping (`data.work[id].holder`,
`view.discovery[id]`) — the exact access pattern every coding-domain
skill's own Orient step already uses (confirmed:
`fgos-coding-discovering/SKILL.md` reads `view.discovery[id]` and
`data.work[id].holder`). Migrating every call site to `show`'s shape
would mean rewriting field-access patterns across every coding-domain
skill file — a much larger, riskier change deliberately left out of this
item's scope and noted only as a possible separate follow-up, not
substituted for the one-line fix that actually shipped.
