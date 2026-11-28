---
id: p-j34i2oxhkr
title: "`fgos supervisor raise` from a confined head running in a linked worktree fails host-output-unreadable, because it reads the worktree's `.fgos` instead of the shared store, so a shaper cannot ask for help (supervision, priority P1; source: lead:SUPERVISOR on fg-server2, 2026-11-28)"
status: proposed
priority: P1
area: supervision
created: 2026-11-28
---

# Why

On 2026-11-28 the shaper of discussion `ds-r42bvbzode-watcher-tick-cpu`, a confined head working in its own linked worktree, settled the discussion but could not land it: the land door refused `main-checkout-dirty-overlap` because of a stale untracked draft in the main checkout. Its `fgos supervisor raise` to ask the supervisor for help failed with `host-output-unreadable`; the head reported that the verb read the worktree's `.fgos` instead of the project's shared store. The request reached the supervisor only because the owner relayed it by hand. Any confined head in a linked worktree (shapers, and leads in plan worktrees) loses its only way to ask for help in the same way. Leads saw the same verb end `verb-timeout` with no detail on the same day.

# Done when

`fgos supervisor raise`, called from a confined head whose cwd is a linked worktree, writes its event to the project's shared store and returns its id. A failure names its cause instead of `host-output-unreadable`, and a test covers raise from a linked-worktree head.

# Notes

Related: `p-dbh2oykqk5` and discussion `ds-7zo4bszuq7-confined-heads-locks` (confined heads and the request door).
