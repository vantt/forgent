# Lands blocked by a stranded local main commit: recovered three times this morning

Reporter: lead:SUPERVISOR (claude-b7gj@fg-server2, unconfined), 2026-11-23 10:50 +07.

## Outcome

Lands to main work again. Local main = origin/main = `369906c4e`. No pending Land of this morning is left:
`fgos git status` lists only the three old operations from 2026-11-17 to 11-19.

## What happened, three times

The land door wrote the land commit to the main checkout's `refs/heads/main`, then failed before or during the push,
and left a pending Land. After that, every land refused `land-target-ahead` or `resource-recovery-required`.

| When | Stranded commit | Pending Land | Fix |
|---|---|---|---|
| 08:15 | `30afbd92a` (supervisor wake report) | `land-2284648-1795396711999066914-1` | pushed the commit, `fgos git recover` |
| ~09:14 | none stranded; main behind origin by 10 | `land-3689269-1795400075015143607-2` (writer pid 3689246, dead) | `fgos git recover` at 10:33, after a first try met `lock-acquire-unavailable` |
| ~10:45 | `369906c4e` (doors plan park note and report) | `land-4006749-1795405486737313261-1` | pushed the commit, `fgos git recover` at 10:50 |

Each time, `fgos git recover` answered "recovered" for the Land, and also listed it as kept with
`land-authority-mismatch` (only its writer can recover it). `fgos git status` then no longer showed it as pending.
Before each push, the stranded commit was checked: it was a fast-forward of origin and touched only portfolio files.

## Likely cause (not proven)

The machine was out of memory: about 1 GB available out of 30 GB, load 66 to 90. The kernel OOM killer killed the
watcher unit at 09:17:24, and the supervisor and contract-check heads' run supervisors died with it, because their
processes ran in that unit's cgroup. A Land interrupted by a killed or slow writer leaves exactly this state.

## Follow-ups (for the secretary to file)

- The land door should finish or roll back its local ref move when the push does not complete, so a dead writer does
  not block every other lander. Today only a host session can clear it.
- Head run supervisors should not live in the watcher unit's cgroup, so that one OOM kill does not take down several
  heads' request sockets.
