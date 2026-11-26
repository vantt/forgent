discussion: open

# A head's run supervisor in its own failure domain

## 1. Trạng thái hiện tại

2026-11-27 00:1x: discussion opened by lead:SUPERVISOR on the owner's order ("ưu tiên p-6htu2ae64o lên trước"): it goes before every plan in the owner's current order (footprint-overlap-warns, changelog-fragments, shaper-worktree, ...). Backlog row `p-6htu2ae64o`. Nothing settled yet. A planner runs on this discussion once it settles.

## 2. Mục tiêu & đề bài

Backlog row `p-6htu2ae64o`: a head's run supervisor (the process that serves its request socket) must not share a failure domain with the watcher or with other heads; an OOM kill of one must not remove the others' sockets.

Evidence gathered by lead:SUPERVISOR on fg-server2, 2026-11-26/27:

- The watcher runs as the systemd user service `fgos-watcher-<id>.service` (oneshot tick from `fgos-watcher-<id>.timer`). Every run supervisor (`fgos internal supervise`), every lead worker (`fgos run ...`) and their node children it starts stay in that service's cgroup. At 2026-11-27 00:07 the cgroup held 3.2G with a peak of 17.4G, and one tick had been `activating` for 9 minutes.
- Kernel OOM kills on 2026-11-26 at 17:00-17:03, 18:18 and 19:14-19:37 took down the watcher service, mailbox-sync, `systemd --user` itself and the run supervisors of several heads at once. After 19:37 only two heads kept a request socket. `head:supervisor-forgent`, a shaper and the 2313 lead were left with `request-socket-unavailable` and no event was raised; they had to be stopped by signal and restarted by hand (`fgos session stop` answered `stop-not-ended` because the supervise process was gone).
- Single `fgos` processes reached 1.4G, 529M and 269M RSS before being killed; each `fgos watcher tick` uses about 420M.
- Related backlog rows: `p-cdsvrsfnui` (session type never submits), and the missing event when a head's run supervisor dies.

Open points for the shaper: the failure-domain boundary (one transient unit or scope per head, per run, or per lead), memory limits per unit, what raises an event when a head's run supervisor dies, and how a head gets its socket back without losing its session.
