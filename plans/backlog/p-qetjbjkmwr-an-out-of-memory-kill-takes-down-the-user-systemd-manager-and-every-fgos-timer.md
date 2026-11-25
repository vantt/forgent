---
id: p-qetjbjkmwr
title: "An out-of-memory kill takes down the user systemd manager and with it the watcher and mailbox timers (supervision; source: owner, 2026-11-25)"
status: proposed
priority: P1
area: supervision
created: 2026-11-25
---

# Why

Nothing wakes the supervisor on this machine unless the watcher timer runs, and the timer lives in the user systemd manager. On 2026-11-25 at 16:02:54 (+07) the kernel or systemd-oomd killed `user@1000.service` with SIGKILL (`systemctl status user@1000.service`: `Result: signal`, `Mem peak: 21.9G (swap: 2G)`). Every user timer died with it, including `fgos-watcher-e9756c48` and `fgos-mailbox-sync-e9756c48`, so for about 80 minutes no watcher pass ran, no event reached the supervisor and idle heads sat unnoticed. `Linger=yes` was set, but a killed manager is not restarted by linger. `fgos doctor` reported both timers as failed only after the fact, and its fix wrote the unit files but could not enable them, because the manager was gone. Restarting it needed root (`sudo systemctl start user@1000.service`), which no head or supervisor can do.

The memory came from the load the heads put on the machine: several full test suites and release builds beside a dozen Claude sessions, with `/tmp` and `/dev/shm` (tmpfs, held in RAM) at up to 12 GB shared and swap at 8191 of 8191 MB.

# Done when

1. A burst of test or build work cannot make the kernel kill the user manager: the heavy runs (`scripts/run-tests.mjs`, cargo builds a head starts) run under a memory limit of their own, so the kill lands on the run and not on `user@1000.service`.
2. When the user manager is gone, the machine says so within one watcher interval through a door that does not need it (a reading of `user@1000.service` state that `fgos doctor` already carries as a row, raised as an event while any head is alive), and `fgos doctor` names the one root command that restores it.
3. The tmpfs space the test runs leave behind (`/tmp/fgos-test-run-*`, `/tmp/fgos-release-*`, `/dev/shm/ci-*`) is removed by the run that made it, so it does not add to RAM pressure.

# Notes

Evidence is in this session's read of `systemctl status user@1000.service`, `free -m`, `df /tmp /dev/shm` and `fgos doctor --fix`. Not verified: which process held the memory at 16:02, because the manager's cgroup is gone; whether the kill came from the kernel or systemd-oomd (the `10-oomd-user-service-defaults.conf` drop-in is present). A stale watcher unit for another project (`fgos-watcher-e2b8b5cc`, `doors-audit-fixture`) was found and switched off by the owner the same day. Related: the keeper plan `261122-0056-orchestration-skeleton` re-reads state every tick but cannot run if the timer that ticks it is gone.
