# Live stop check (acceptance 4), run by lead:SUPERVISOR on fg-server2, 2026-11-28 18:07

Code under test: branch dead-supervisor-head-stop/p01b at a9af171b77 (gate c-19684 green), run through that worktree's dev host from the main checkout (`cd /home/vantt/projects/forgent && npm --prefix <p01b worktree> run fgos:dev -- ...`), so the project root is the main checkout where the head's records live. Active release: sha256:fdbb8029.

1. Throwaway head `head:shaper-probe-0018-stop2`, generation 1, pane w6:p2MF (a temporary discussion folder `plans/discussions/probe-0018-stop2/` existed only for the few seconds of the start and was deleted right after). Run supervisor pid 3257014, gate pid 3257742.
2. `kill -9 3257014`; the supervisor is dead, the gate 3257742 is still alive.
3. `session stop shaper --name probe-0018-stop2 --json` answered `{"stopped":true}` in 18 s (including an 8 s dev build).
4. After the stop: gate 3257742 has ended; `closed.json` is published in `.fgos/assignments/head-shaper-probe-0018-stop2-1/runs/01/`; the placement carries `retiredAt: 2026-11-28T11:07:26.100Z`; pane w6:p2MF is closed.
5. `fgos session start shaper --name probe-0018-stop2` brought up generation 2 (`head-shaper-probe-0018-stop2-2`, `retiredAt` null); a normal `session stop` answered `{"stopped":true}` and its pane closed.

Result: PASS. Earlier attempts (on 9e4cbcb8a6, before the end-dead-attempt op and the gate signal) failed as `not-live` (run from the worktree) and `retire-refused: placement-unknown`; their notes are in /var/tmp/r/worktree-salvage-261128/261127-0018-dead-supervisor-head-stop-p01/untracked.tgz.
