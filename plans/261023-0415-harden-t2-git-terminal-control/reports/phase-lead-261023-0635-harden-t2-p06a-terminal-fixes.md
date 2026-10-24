# Phase lead report: terminal-control correctness fixes (phase 06, part A)

Branch `harden/t2-p06a-terminal-fixes` (from `harden/t2-git-terminal-control` tip `9d935588c`). Cargo target `/home/vantt/projects/forgent-worktrees/t2-p06a-target`. Scope: four correctness fixes only. Not done (wait for owner approval): E-26, F-8 beyond the four, E-14, E-13, E-15, E-16, D6 test swap.

## Per fix

| Fix | What changed | Test turned green |
|---|---|---|
| CF10 | `exec` (`driver/herdr.rs`) spawns through `fgos_process::control::spawn_with_fds(cmd, &[])`; the `3..1024` `pre_exec` loop is gone. The wait polls `exit_descriptor(pid)` until the deadline (short-step sleep where no pidfd), same pattern as the Git driver. The `try_wait` call stays as the non-blocking exit check; only the 1 ms sleep loop is replaced. | `herdr_driver_fake` `commands_do_not_inherit_the_callers_descriptors` (fd 2048) |
| CF03 | `foreground_is_owned` (`core.rs`): shell pid judged by herdr's `shell_pid`; the launched process only when `identity::is_still_running` (new, over the existing `facts::identity_of` door) matches its recorded pid, start time and boot, read before and after `process_info`. Empty foreground, unreadable tuple or mismatch is not owned. | `core_failures` `a_pane_whose_foreground_process_only_shares_a_pid_with_the_launched_one_is_kept`, `an_empty_foreground_list_proves_no_ownership` |
| CF04 | `install_result` (`store.rs`): a failure at `parent-fsync` after the name exists returns an error carrying `InstallUnproven { installed, source }` inside the `io::Error` (signature unchanged; callers downcast). `store_err` (`core.rs`) answers `unknown` with cause `allocation-install-unproven: ...`; the file stays. All publish callers (allocate, attach, launch-requested, launched, released) go through `store_err`. Later steps (`name-installed`, `temp-removed`) keep the old mapping, as the red test requires. | `store::install_mapping_tests::errors_before_install_propagate_and_errors_after_install_keep_the_outcome_unless_the_parent_sync_failed` (also asserts the installed fact) |
| CF02 | `scan_record` never closes: the retained-and-expired branch reports `RetainExpired` with `close pane <id> to release it`; the expiry-close path is deleted (`close_unrecorded` keeps its two allocate callers). `Finding` gains `paneId` (`Option`, camelCase; `null` only for an unreadable record). Contract `terminal-control.port.v1.json` scan finding lists `paneId`. CHANGELOG line: `fgos doctor` no longer closes expired retained panes, reports them with the pane id. | `core_failures` `a_scan_reports_an_expired_retained_pane_with_its_pane_id_and_closes_nothing` |

Node consumers checked: `src/setup/terminal-control-checks.mjs` already reports "nothing was closed" and prints `detail` (now carries the pane id); `src/terminal-control/client.mjs` passes the scan through. No Node edit needed. `retain_with_a_foreign_foreground_is_kept` kept unchanged.

## Verification

```
cargo test --no-fail-fast -p fgos-terminal-control   -> all ok (lib 7, core_failures 31, core_rules 17, herdr_driver_fake 21, ... 0 failed)
cargo test --no-fail-fast -p fgos-run-supervisor     -> all ok, 0 failed
cargo clippy -p fgos-terminal-control --all-targets -- -D warnings  -> Finished, no warnings
cargo clippy -p fgos-run-supervisor  --all-targets -- -D warnings  -> Finished, no warnings
Node one-file command: test/terminal-control/*.test.mjs test/setup/terminal-control-checks.test.mjs test/plugins/terminal-skill-attach.test.mjs -> tests 48, pass 48, fail 0
```

## Delta lines (HEAD vs `9d935588c`)

- Rust (src, incl. one inline test edit): +98 / -51 in `core.rs` +27/-19, `driver/herdr.rs` +26/-17, `identity.rs` +7, `port.rs` +3, `store.rs` +35/-15.
- JSON contracts +1. CHANGELOG +2. Node 0. Rust tests (integration) 0 (red tests were already in place).

## Test-cost line

Added 0 cases; extended 1 inline case (installed fact asserted). Retired 0. No new host spawns.

## Notes

- `rg -n "try_wait" herdr.rs` still finds one hit (the non-blocking check inside the deadline wait); the plan's "nothing" grep was written for the sleep loop. `pre_exec` is gone.
- Named residual of the Process spawn door (an fd opened without close-on-exec by another thread between listing and fork) unchanged, as planned.
