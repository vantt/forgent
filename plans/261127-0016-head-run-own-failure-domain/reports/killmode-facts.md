# KillMode facts: what a watcher tick starts that must outlive the tick

Question: can the systemd watcher service drop `KillMode=process`? It can only if every process a tick starts
that must outlive the tick lands in its own scope, which means it goes through `spawn_supervisor`
(`packages/run-supervisor/rust/src/controller/launch.rs:919`; it calls `build_supervisor_command` (:937, defined at :881), the only caller of
`build_scope_command` (:901); `spawn_supervisor` is reached from `start_supervisor_in` at launch.rs:863).

| # | Process the tick starts | Where | Outlives the tick? | Through `spawn_supervisor`? |
|---|---|---|---|---|
| 1 | `fgos run "<prompt>" --case .. --activity .. --capability .. --json` (keeper capability run), a detached `fgos run` controller | `apps/fgos/src/wiring/supervision.rs:1910` (`start_run`, `spawn_detached` call at :1916, called at :2097) via `fgos_process::mapped::spawn_detached` | Yes: the tick must not wait for a whole Unit run (comment at :1908) | No. The controller process itself is a direct detached child of the tick, so it stays in the watcher unit's cgroup. Only its own supervisor child later goes through `spawn_supervisor`. |
| 2 | review run (`watcher::review_run_args`), a detached `fgos` process with a log file | `apps/fgos/src/wiring/supervision.rs:2366` (`start_run`, `spawn_detached` call at :2372, called at :2410) via `spawn_detached` | Yes: its settlement is read on later ticks from `.fgos/runtime/watcher/review-<t>.log` | No. Same direct detached child. |
| 3 | head start: `fgos session start <persona> --name <name> --json`, run synchronously and waited for | `apps/fgos/src/wiring/supervision.rs:811` (`HostStart::start`) | The head it creates does; the `session start` process itself ends within the tick | Not by the tick. The tick never calls the supervisor spawn door; the head's pane belongs to the terminal host, which this report did not trace further. |
| 4 | other host verbs (`workflow records`, keeper door commands) | `packages/supervision/rust/src/watcher.rs:810, 991, 1476, 2166`, `apps/fgos/src/wiring/supervision.rs:1892` (`.output()`) | No: all waited for | n/a |

`spawn_detached` (`packages/process/rust/src/mapped.rs:194`) only calls `setsid`; that leaves the process group
but not the systemd cgroup, so without `KillMode=process` systemd kills rows 1 and 2 when the oneshot service
exits (the default `KillMode=control-group`).

## Decision

Rows 1 and 2 must outlive the tick and do not go through `spawn_supervisor`. `KillMode=process` therefore stays
in the systemd watcher service and `leaves_started_processes_running` stays unchanged (launchd keeps
`AbandonProcessGroup`). The timer test names the line explicitly.

Follow-up for the owner (outside this phase): sending rows 1 and 2 through their own scope would let the line go.
