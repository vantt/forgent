---
authoritative_for: docs/history gitignore exclusion fix re-verification, backlog row p-4b7dd2ed, CONTEXT.md commit to fgw/<id> branch
---

# `docs/history/` staying un-ignored is now tested, not just a backlog memory

`tsk-2gw` closed the loop on a real, once-live bug: `fgos-exploring/
SKILL.md` requires committing `CONTEXT.md` onto the item's `fgw/<id>`
branch before calling `fgos discover`, because an uncommitted
`CONTEXT.md` is invisible to a later re-claiming session. But `.gitignore`
had once excluded the entire `/docs/history/` directory — meaning
`CONTEXT.md` could never actually be committed as that rule required.

## Original discovery, and this item's own scope

The bug was found through real dogfooding: `decision 0018`, scenario
`expr-eval-chain`, item `tsk-1wd` (2026-07-28), the first time `fgos-
exploring`'s clarify step actually ran for real. It was fixed at the time
on `tsk-1wd`'s own branch (un-ignoring `/docs/history/` plus 3 related
paths sharing the same `.gitignore` root) and merged to `main`. This
item's own job was **not** to fix it again — it was to formally verify
the fix still holds and close the corresponding backlog row (`p-4b7dd2ed`)
through the real fgOS lifecycle instead of leaving it as a static backlog
row with no test coverage.

## What shipped

Confirmed `.gitignore` on `main` no longer excludes `docs/history/` (a
direct grep finds no such exclusion). A new test
(`gitignore-docs-history-not-excluded.test.mjs`) asserts this
structurally rather than relying on manual inspection, so a future
regression would be caught automatically rather than requiring another
live dogfood discovery. Backlog row `p-4b7dd2ed` was closed through the
real fgOS lifecycle (`docs/backlog.md` updated) rather than staying a
static, untracked row.
