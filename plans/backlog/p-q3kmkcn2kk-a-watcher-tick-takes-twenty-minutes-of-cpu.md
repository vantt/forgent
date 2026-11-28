---
id: p-q3kmkcn2kk
title: "A watcher tick takes about 21-23 minutes of CPU instead of seconds, so the 60 s watcher runs every ~22 minutes and events reach the supervisor late (supervision/watcher, priority P1; source: lead:SUPERVISOR on fg-server2, owner order 2026-11-28)"
status: proposed
priority: P1
area: supervision
created: 2026-11-28
---

# Why

The watcher timer `fgos-watcher-e9756c48.timer` fires every 60 s (`OnUnitActiveSec=60`), but each `fgos watcher tick` run on fg-server2 on 2026-11-28 took 20 min 50 s to 23 min 19 s of wall time and as much CPU (21 min 27 s to 22 min 45 s), with a memory peak of 1.1 GB, for six ticks in a row (systemd "Consumed" lines). During a tick the process runs `git` inside `bwrap`. Because the next tick waits for the current one, a lead that dies, a plan that turns ready or a parked event is noticed about 20-25 minutes late, and the tick keeps one core busy all day. Each tick also logs `review-source: plans refused` for legacy plans without plan-v1 frontmatter.

Measured on the running tick (pid 3514350, 2026-11-28 17:55, `/proc/<pid>/io`): rchar 19.1 GB and wchar 11.1 GB, from 40.9 million read and 55.2 million write syscalls, about 13 minutes into the tick; the only open files were the watcher lock, pipes and sockets, so the volume goes through pipes to child processes (each tick spawns `git` under `bwrap`, and one `fgos` child sat defunct for 13 minutes). This points at the tick streaming large data to or from child processes on every run, not at slow disk.

# Done when

The cause is measured: which source, definition or git call takes the time (for example a full scan of the Git journal, which retains about 17 000 chains, or of the event store on every tick). A tick finishes in seconds on this repository, the measured time is recorded, and a test or a guard keeps it from regressing.

# Notes

Related: the keeper and scheduling records run inside the tick (`docs/platform/supervision/spec.md` section 1.2); plan `261125-1558-watcher-counts-main-commits-by-kind` added the main-commits source on 2026-11-28.
