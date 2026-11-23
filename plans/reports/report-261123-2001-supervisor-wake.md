# Supervisor wake 2026-11-23 20:01

## What moved
- Doors lead (261121-2110) sat idle believing units 2a, 2d, 4 still ran; they had settled at 19:53-19:54. Raised coordination-help, typed the nudge; the lead resumed. 2a is blocked (needsWrites outside scope: test/live mailbox tests, test/architecture.test.mjs, three door rows). 2d and 4 report done, but the unit could not run node or cargo, so Verify is still the lead's. 5 still running.
- Owner order "doors faster": typed into the doors lead: start 2f, 2g, 3b-3e where the footprint is clear, serial where test/suite-baseline.json collides, read the uncommitted 13:15 unit reports in -p2f/-p2g/-p3b/-p3d first, and confirm the /tmp par scratch. Lead is acting on it.
- Heads-stable lead (261122-0118): verified wait, phases 8 and 10 measure until 21:06, then phase 11. Left alone.
- Plan 2108: landed a note (aacfa41f3) that its body still waits on heads-stable and needs a planner pass once doors lands, before `ready`.

## Blocked on the owner (q-ptcieh72p6)
- maxLeads 2 -> 3 and admitting 0828: my confinement cannot write .fgos/config.yaml. Capacity looks safe (24 cores, 18 GB available, 119 GB disk, 3/4 lanes free); the owner set 2 at 12:38 after OOM kills.
- Worktree cleanup: .git is read-only to me. Seven landed-phase worktrees ready to go (heads-stable-p13; doors p01 p01b p02 p03 p1b p2e); exact commands in the question. Skipped p2f p2g p3b p3d (phases not landed, hold unit reports). No lead:SUPERVISOR session was live to take it.
- /tmp par, par2, par3 are not visible from my confined /tmp; waiting on the doors lead's confirmation.

## Friction
- `fgos session type` does not submit; a second call with a carriage return was needed.
