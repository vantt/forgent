---
id: p-yqanenewb4
title: "A land candidate worktree stays behind when its `fgos land` process dies, and nothing reaps it (git, priority high; source: owner via Miu, 2026-11-20, root disk full)"
status: done
priority: P1
area: git
created: 2026-11-20
---

# Why

Each `fgos land` builds a detached candidate worktree under `.fgos/runtime/git-candidates/land-<pid>-...` of about 5G with its build output. On 2026-11-20 there were 25 candidates, all with dead owner pids, holding 90G; the root disk reached 100% and `fgos session start` failed with ENOSPC. Nineteen were delivered and were removed with `fgos worktree remove --delivered-to origin/main --discard-ignored`; six whose tips are not on origin/main remain (about 19G). Also, `fgos worktree remove` itself fails `git-floor-probe-failed` with ENOSPC on a full disk, so the cleanup door cannot run when it is needed most.

# Done when

`fgos land` removes its candidate on every exit path it controls; the land door's own verb reports candidates whose owner pid is dead and removes the delivered ones (a doctor row may point at it, never repair); an undelivered dead candidate is reported with its tip and land ticket so the owner can drop or retry it; the worktree remove door can run on a full disk; an owning test kills a land mid-run and finds the next land or the reap verb clears the candidate.

# Notes

Migrated from the legacy backlog table. Original status: done (plan 261121-0747-land-door-hygiene, commit e7701dcfc; the full-disk git-floor-probe-failed case and the 20 old candidates left by the previous release remain).
