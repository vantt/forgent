# Live stop check (acceptance 4), run by lead:SUPERVISOR on fg-server2, 2026-11-28 11:10

Branch tip under test: 9e4cbcb8a6 (worktree 261127-0018-dead-supervisor-head-stop-p01), run through `npm run fgos:dev` from that worktree. Active release: sha256:fdbb8029.

1. Throwaway head: `fgos session start shaper --name probe-0018-stop` (a temporary local discussion folder `plans/discussions/probe-0018-stop/` was created so the shaper could start; it is removed after the check). Generation 1, pane w6:p2K3, run dir `.fgos/assignments/head-shaper-probe-0018-stop-1/runs/01`.
2. Run supervisor from `supervisor-binding.json`: pid 2901068 (process `fgos`, alive 31 s). `kill -9 2901068`; confirmed dead.
3. `npm run fgos:dev -- session stop shaper --name probe-0018-stop --json` (45 s including the dev build) answered:
   `{"stopped":false,"reason":"not-live"}`
4. After the stop: no `closed.json` in the run dir; placement `{"gen":1,"retiredAt":null}`; the pane w6:p2K3 is still open with its agent idle.

Result: FAIL. A head whose run supervisor was killed is reported not-live and is not stopped, which is the case acceptance 4 requires to answer {stopped: true}. The probe head is left in place (pane w6:p2K3) for a rerun after the fix.

## Second attempt, run from the main checkout (2026-11-28 11:16)

The first attempt ran `fgos:dev` from the p01 worktree, so its project root was the worktree, where the probe head has no records; that alone can explain `not-live`. Rerun from the main checkout:

`cd /home/vantt/projects/forgent && npm --prefix <p01 worktree> run fgos:dev -- session stop shaper --name probe-0018-stop --json`

- The run supervisor (pid 2901068) is still dead.
- Exit 2 after 4 s: `fgos: retire-refused: head:shaper-probe-0018-stop could not be closed: placement-unknown (foreground is not provably the launched process or shell; kept)`.
- The placement now carries `retiredAt: 2026-11-28T04:16:33.176Z` (gen 1), but there is no `closed.json` in the run dir, and pane w6:p2K3 is still open.

Result: still FAIL, but further than the first attempt: the dead-supervisor head now passes the liveness gate and gets its retired stamp; the pane retire is refused `placement-unknown`, because the pane's foreground cannot be proven to be the launched process once the supervisor that launched it is gone.
