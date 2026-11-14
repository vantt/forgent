# Phase 11 report: terminal control asks fgos-process for a pane's window size

Base: origin/main 67b2ab3d6.

## Change

- `packages/terminal-control/rust/src/driver/herdr.rs`: `pty_size` now calls `fgos_process::facts::stdin_window_size`. The
  Linux `/proc/<pid>/fd/0` open, `TIOCGWINSZ` ioctl and the non-Linux stub are gone (about -22 lines). `None` still means
  "process gone / not a tty / zero size", so the caller at the pty-size lookup is unchanged.
- `docs/architecture-manifest.json`: removed the herdr.rs debt entry from the `/proc` row. Pattern re-run by
  `test/architecture.test.mjs`: green, no stale debt, no new leak.

## Gates (all green)

- `cargo fmt --all --check`, `cargo clippy -p fgos-terminal-control --all-targets -- -D warnings`, `cargo test -p fgos-terminal-control`.
- `cargo check -p fgos-terminal-control` for x86_64-pc-windows-msvc and aarch64-apple-darwin.
- `run-tests.mjs` on test/terminal-control, architecture, doc-health, git-mutation-census: 81 pass, 0 fail.
- `check-decision-citation-drift.mjs` ok; `git-one-door-scan.mjs`: 0 undeclared sites.

CHANGELOG: none (internal).

## Lessons

- The crate function already checks isatty and non-zero size, so the caller keeps no duplicate checks.
- Owning proof of the tty read lives in fgos-process (`stdin_window_size_is_the_pty_size_and_none_for_a_pipe_or_dev_null`); no new test here.
- libc stays a terminal-control dependency (poll, SO_PEERCRED); only the winsize use left.

Status: DONE
