---
type: how-to
title: How to advance a work item through `clarify` and `decompose` with `discover`/`decompose`
tags: [discover, decompose, clarify, verbs]
timestamp: 2026-07-31T07:05:09.000Z
source_capture_ids: [tsk-2b0]
---

# How to advance a work item through `clarify` and `decompose` with `discover`/`decompose`

Use this when you need to fire the real engine judgment that moves a claimed
item forward from `clarify` to `decompose`, or from `decompose` to
`executing`.

## Before you start

`discover` and `decompose` are now two separate CLI verbs, one per stage
(`tsk-2b0`, hard split, no fallback). Before this item, a single `discover`
verb dynamically picked which judgment to run based on the item's *current*
`stage` — calling it a second time on the same item, once it had already
advanced to `decompose`, silently ran the decompose judgment instead of the
clarify one. That worked, but nothing in the CLI surface told you which
judge was actually about to run.

That is gone now. Each verb only ever runs its own judgment, and each
checks the item's stage before doing anything:

- `fgos discover <id>` — runs context-discovery. Only works on an item at
  stage `clarify`.
- `fgos plan <id>` — runs split-work judgment (chia-việc). Only works
  on an item at stage `decompose`.

Calling the wrong one for the item's current stage is now a hard error, not
a silent wrong-branch dispatch:

```
$ fgos discover tsk-2b0
fgos: discover: work "tsk-2b0" is at stage "decompose", not "clarify" -- use "fgos plan tsk-2b0" instead.

$ fgos plan tsk-2b0
fgos: decompose: work "tsk-2b0" is at stage "clarify", not "decompose" -- use "fgos discover tsk-2b0" instead.
```

Both refusals are exit code 4 (validation) and leave the item completely
untouched — no partial write, safe to retry with the right verb.

## Steps

1. **Check the item's current stage first**, if you don't already know it:

   ```
   fgos list --id <id> --json
   ```

   Read `data.work["<id>"].stage`.

2. **At stage `clarify`, run `fgos discover <id>`.** A `clear` verdict
   advances the item to `decompose` and attaches a real `verify` command.
   An `unclear` verdict parks it in `awaiting-human` with a question —
   still at stage `clarify`.

3. **At stage `decompose`, run `fgos plan <id>`**, not `discover`
   again. Outcomes: `pass-through`/`noop` (item now `executing`),
   `decompose` (split into children, see `data.childIds`), `need-human`
   (parked in `awaiting-human` with a split-work proposal), or `invalid`
   (judgment came back unusable, item left untouched — retry later).

4. **Inside a Claude Code session**, `/fgOS:discover <id>` and
   `/fgOS:plan <id>` claim the item if needed, then dispatch it
   through `fgos-coding-driving` (`ceiling: stage:decompose` /
   `ceiling: stage:executing` respectively) instead of calling either verb
   directly — the live session does the real Socratic/shaping reasoning
   itself and supplies the verdict via `--verdict`, rather than leaving it
   to `judgeDiscovery`/`judgeDecompose`'s context-blind subprocess judge
   (`docs/history/discover-decompose-skill-wrapper-verdict-routing/
   CONTEXT.md`). The same stage rule and errors still apply underneath —
   only the path that reaches the verb changed.

## If you were relying on the old "call discover twice" pattern

Any script, skill, or habit that called `fgos discover <id>` a second time
expecting it to silently run the decompose-stage judgment now needs to call
`fgos plan <id>` for that second hop instead. This affected real code
at the time of the split: `test/e2e/runner-loop.test.mjs`'s S2-pull scenario
did exactly this and had to be updated in the same change.
