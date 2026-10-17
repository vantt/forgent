# Phase 03: herdr driver (terminal-control)

Status: DONE. Branch `terminal-control/p03-herdr-driver`, merged `--no-ff` into `terminal-control/integration`.

## What landed
- `driver/herdr.rs`: `HerdrDriver` over the `herdr` CLI (`HerdrConfig{bin, session, socket_path, timeout_ms, env}`); `HERDR_SESSION` / `HERDR_SOCKET_PATH` passed via child env.
- Command runner: per-command timeout (default 15 s, close 5 s), stdout then stderr JSON (herdr errors go to stderr), fd >= 3 marked close-on-exec in the child, pipes dropped on return. ENOENT -> `Unsupported`; timeout, unparseable, herdr error code -> `Unknown`. Only `pane_not_found` becomes `Gone` / `AlreadyGone`.
- `capabilities()`: probed once at construction (`--version`, `pane layout --help`). Declares tab.create, pane.split, pane.close, pane.run, send.text, send.keys, read.screen, process.info, activity.state, label, layout.geometry, server.incarnation (unix only). Never declares pane.resize/swap/move (not needed). Windows or no herdr: empty, every op `Unsupported`.
- `layout.geometry`: `result.layout.{area, panes[].rect, tab_id}` plus real `pty{cols,rows}` per pane on Linux (`process-info.shell_pid` -> `/proc/<pid>/fd/0` TIOCGWINSZ), per P01 6.2.
- `server.incarnation`: endpoint = request `socket_path`, else `herdr [--session X] status server --json`.socket; `SO_PEERCRED` (Linux) / `LOCAL_PEERPID` (macOS) -> pid -> `fgos-process` identity (host, boot_id, pid_ns, start_time).
- `pane.close`: incarnation checked before and after; mismatch before -> never calls herdr; mismatch after -> `Unknown` (core keeps the slot). Never closes twice.
- `ratio` passed through as the share the existing pane keeps (P01 6.3).

## Evidence
- `cargo test -p fgos-terminal-control` on the phase branch and again on the integration worktree: 14 core_failures, 12 core_rules, 17 herdr_driver_fake, 9 herdr_driver_fixtures, 6 policy_fixtures, 6 store_publish, all pass; herdr_driver_live 1 ignored. 0 failures.
- `herdr_driver_live -- --ignored` against the real herdr on this machine: pass (own tab `tc-live-driver`, split, geometry 352x69 with pty on 2/2 panes, both panes closed through the incarnation check, no tab left).
- `cargo check -p fgos-terminal-control` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: ok. `cargo clippy --all-targets`: no warnings in this crate.
- `node --test test/architecture.test.mjs`: 27 pass.
- Real-socket tests: listener in the test (peer pid = test pid, tuple equals `self_identity`); listener in a child process whose socket is swapped by the fake's close hook -> `close` returns `Unknown`, one close issued.
- Impact analysis: only new files plus one `pub mod herdr;` line in `driver/mod.rs` and a `libc` target dep (`Cargo.lock` +1 line). No existing symbol edited; GitNexus index stale, no HIGH/CRITICAL surface.

## Decisions (mine)
- No process-env read for the endpoint: without a caller-supplied socket the CLI's own `status server` answers (it follows the inherited `HERDR_SOCKET_PATH`), so driver and CLI cannot disagree.
- send/read/label use `pane ...` commands (pane id), not `agent <name>` ones; `agent start` is used only for `activity_start`. `send_text(submit)` = `send-text` then `send-keys Enter`.
- `pane list` is not called (liveness uses `pane get`); the list fixture is only checked to unwrap.
- Fake herdr is a committed `sh` script (`tests/fixtures/herdr/fake-herdr.sh`) driven by env knobs; P06 may reuse it.

## Concerns / for later phases
- Trait has no op for `pane report-agent*` or `workspace create` / `herdr server` boot (P01 table, two "no op" rows); P06 must decide, driver has nothing for them yet.
- Residual incarnation gap (server restart exactly between the two checks) stays as written in D1; live-handoff pid change reads as `Unknown` (safe direction).
- Unix-socket `connect` has no timeout (local socket; a full backlog would block). Accepted.

## Unresolved questions
None blocking.
