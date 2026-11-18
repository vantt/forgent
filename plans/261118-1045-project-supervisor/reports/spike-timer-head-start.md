# Spike: start a head from the timer environment (phase 2)

Date 2026-11-18, machine fg-server2 (Linux, systemd user manager, herdr 1 server running). Branch sv/p02. Report only; no source changed.

## Verdict

**works with env X and survival setting Y** (X = PATH that reaches the agent CLI and herdr; Y = `KillMode=process` on the service, or a `systemd-run --user --scope` start). Phase 15 renders X and Y. The default `Type=oneshot` unit with `KillMode=control-group` kills the head at unit exit, so Y is mandatory. No plan decision (PS-8, PS-9, Risks first bullet) changes; the Risks bullet is confirmed and now has its answer.

Caveat to the verdict: a head still needs a running terminal host (herdr server) to get a pane; the tests ran with herdr up. "No herdr server" was not tried (see Open points).

## Planned name mapping

The planned `fgos session start <persona> --name <n>` does not exist yet; the run used today's `fgos head start <persona> --name <n> --json` (`src/session-host/head-start.mjs`, `startHeadSession` -> `placeHead` -> `launchSessionAttempt`), through `npm run fgos:dev` with a Cargo target on ext4 (`/home/vantt/projects/forgent-worktrees/devhost-target`). Persona `fgos-placeholder`, names `spike-p02-<n>`. Scratch project `/tmp/fgos-work/sv-p02-spike/proj` (git init, empty). Each trial: `systemd-run --user --wait --collect -u spike-p02-<n> -p WorkingDirectory=<proj> /usr/bin/env -i <declared vars> node npm --prefix <worktree> run -s fgos:dev -- head start ...` (`env -i` makes the declared list the whole environment; systemd's own user-manager env would otherwise add HOME, XDG_RUNTIME_DIR, a PATH without nvm, ~/.local/bin).

## How a head is placed (scout)

- Needs a terminal host: herdr. The driver (`packages/terminal-control/rust/src/driver/herdr.rs`) finds the socket from `HERDR_SOCKET_PATH`, else `$HOME/.config/herdr/herdr.sock`, else the named session; the binary from `FGOS_HERDR_BIN` or `herdr` on PATH. `bindHeadSeat` asks for a pane seat with `herdrPresent: true` always (no probe).
- No terminal client is needed: the pane is a child of the herdr server (not of the caller), so a caller with no TTY works (all trials ran with no TTY). The head is the agent run by the run supervisor (`fgos internal supervise`), which the verb detaches (ppid 1). The supervisor and the agent's sandbox stay in the cgroup of whoever started them; that is why the unit setting matters.
- The runtime socket dir is `$XDG_RUNTIME_DIR/fgos`, else `/tmp/fgos-<uid>` (`src/run-supervisor/runtime-dir.mjs:27`).

## Env table (one variable removed from the full set, KillMode=process unless noted)

| Trial | Declared env | Result |
|---|---|---|
| 1, 14 | PATH, HOME, XDG_RUNTIME_DIR, HERDR_SOCKET_PATH, (dev: CARGO_TARGET_DIR, INIT_CWD) | head placed, rc 0 |
| 8 | without HERDR_SOCKET_PATH | head placed (default socket under HOME) |
| 9 | without XDG_RUNTIME_DIR | head placed (socket dir falls back to /tmp/fgos-uid) |
| 10 | without HOME | head placed |
| 13 | PATH only (plus dev vars) | head placed |
| 12 | PATH without `~/.local/bin` | rc 2, `bind-refused: ... agent-cli-missing: no agent CLI is installed on this machine (looked for agy, claude, codex, omp, pi on PATH)` (herdr is also in `~/.local/bin`) |
| 11 | no PATH at all | rc 127 (nothing resolves) |

Minimal env that works: **PATH** containing the dirs of the agent CLI and herdr (here `~/.local/bin`) and, for the legacy-node payload, node. HOME, XDG_RUNTIME_DIR and HERDR_SOCKET_PATH were each not needed in this environment, but phase 15 should still declare HOME and XDG_RUNTIME_DIR (account homes, config and the runtime socket dir hang off them; trial 13 only worked because the manager gave the herdr default location through a fallback) and HERDR_SOCKET_PATH when herdr runs a non-default session. Plain `fgos` instead of `fgos:dev` removes the CARGO_TARGET_DIR and INIT_CWD rows. The existing probe PATH (`Host::probe_path` = `~/.local/bin:/usr/local/bin:/usr/bin:/bin`) is the right shape but lacks nvm's node dir; where the agent CLI or node lives elsewhere, the rendered PATH must carry it.

Note: runs 2, 3, 4, 5 of the first batch were invalid (kernel OOM killed the units, see Machine incident) and are not counted.

## Survival (head alive after the unit exits)

| Setting | Result |
|---|---|
| default (control-group), trials 1 and 14 | **head dies at unit exit.** Supervisor gone within seconds, `supervisor.log`/pane show `Raising signal 15`; the pane stays as an empty shell (stale tab). |
| `-p KillMode=process`, trial 6 (unit exited 13:24:18) | supervisor and agent alive at 13:27:06 (2 min 48 s after exit). Journal: `Unit process ... remains running after unit stopped` (benign). Same for trials 8, 9, 10, 13. |
| `systemd-run --user --scope` start inside the unit, trial 7 (unit exited 13:24:37) | alive at 13:27:06 (2 min 29 s after exit); the scope unit stays active holding the head. |

Both fixes keep the head. Recommendation for phase 15: `KillMode=process` in `render_systemd` (one line, no extra process, matches the `Type=oneshot` shape). Scope also works but adds a second scheduler call and an extra unit per head.

## Linger and logout

`loginctl show-user` here: `Linger=yes`. Linger was not switched off and nobody was logged out (that would end the owner's real session); the "linger off" leg is therefore not run. By systemd semantics, with linger off the user manager (and every unit/scope under it, including the head) stops when the last login session ends, so a head outliving a logout needs linger on; a timer would also not fire while logged out. Phase 15 should surface linger as a doctor row for the supervisor timer (read-only pointer) rather than assume it.

## macOS note (read only, `render_launchd` timer.rs:~385-428)

The LaunchAgent has Label, ProgramArguments, optional EnvironmentVariables, StartInterval, RunAtLoad. It sets no `AbandonProcessGroup`. launchd by default kills the job's remaining processes when the job's main process exits, the same failure as control-group here; the head would die. Phase 15 must add `<key>AbandonProcessGroup</key><true/>` on macOS. launchd's default PATH is minimal (`/usr/bin:/bin:/usr/sbin:/sbin`), so the same PATH rule applies. Not run (no Mac).

## Machine incident (relevant to the plan)

Between 13:15 and 13:20 the host hit a global OOM (28.5 of 31 GB used, 15 GB shared): the kernel OOM killer killed spike units 2 and 3 and then the whole `user@1000.service` (twice, 13:16:32 and 13:20:12), restarting the user systemd manager. Each `fgos:dev` invocation peaks about 1.0 to 1.2 GB (dev-host build), user-slice services carry `oom_score_adj` 200 so they are chosen first. herdr and other panes survived. Two lessons: (1) a timer-started head lives under the user manager and dies with it, so the watcher tick must be idempotent and a missed head must be re-startable by the next tick (already PS-8: the role is the lock); (2) the first batch of ablations was repeated one at a time after memory recovered.

## Open points

- Not tried: herdr server not running (no pane possible). Expected from the driver: `start-refused` with a herdr-unreachable message; phase 15's wake door must test for it and fall back to the mailbox notifier. Cheap to confirm with a scratch herdr session when phase 15 lands.
- The persona was the placeholder; a real persona with a real CLI adds the account lease (credentials under `HOME`), which the trials did not exercise.
- Role uniqueness (PS-8) was not part of the trial; the 11 distinct names each got their own role.

## Cleanup (process-management rule)

Started and stopped by this run: baseline shell-started head 0 (supervisor 2622151, SIGTERM, tab closed); systemd units `spike-p02-1`..`spike-p02-14` and scope `spike-p02-7-scope` (all gone: `systemctl --user list-units 'spike*' --all` empty); supervisors 3165065, 3214877, 3273551, 3295046, 3323851, 3417278 (SIGTERM); all herdr tabs titled `spike-p0 · fgos-placeholder` closed (`herdr tab close`). `ps -eo pid,cmd | rg "fgos-work|head start"` shows nothing of this run. Left on disk (untracked, outside the repo): `/tmp/fgos-work/sv-p02-spike/proj` and ignored `.fgos/runtime/dev-host/*` dirs in the sv-p02 worktree.
