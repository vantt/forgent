---
id: p-vvplbvjdjh
title: "Under umask 002, the fgos directory inside the Git directory is created group-writable and the Git WAL then refuses it (git, priority medium; source: start-context lead, fg-server, 2026-11-27)"
status: done
priority: P2
area: git
created: 2026-11-27
---

# Why

On fg-server (shell umask 002), `test/rust-host/fgctl-upgrade.test.mjs` fails with `git-wal-unreadable: git-wal-path-unsafe: <proj>/.git/fgos has mode 0775, writable by group or others`.

- The WAL creates its own directories with mode 0700 (`create_private_dir` in `packages/git/rust/src/wal.rs`).
- The event store forces 0700 on `fgos/events`.
- But something creates the `fgos` directory first, through a plain recursive create that takes the umask. The likely
  writer is a holder lock whose `runDir` is `fgos/git` (`packages/git/rust/src/recovery.rs`); this is not yet
  confirmed.

Any user whose umask is 002 meets the same refusal. It is the likely cause of the `fgos init` tail error
`event-store-io: Git: git-wal-unreadable` seen on this machine.

Under umask 022 the same test file fails next on `state/git-empty-hooks must have mode 0500`: a second directory
whose mode depends on the umask.

# Done when

Every directory fgOS creates under the Git directory's `fgos/`, and the trusted hooks directory, is created with an
explicit mode, whatever the umask. `test/rust-host/fgctl-upgrade.test.mjs` and
`test/rust-host/fgctl-init-download-sources.test.mjs` pass under both umask 002 and umask 022.

# Outcome (2026-11-27)

Traced with `strace`: fgOS's own code creates the `fgos` directory with mode 0700. The group-writable directory came
from the test fixture. `test/rust-host/fgctl-init-fixture.mjs` snapshots and restores an initialized workspace with
`fs.cpSync`, which gives every directory it makes the umask's default mode. That turned the 0700 WAL directory into
0775, and the 0500 hooks directory lost its mode the same way.

The fixture now copies each directory's mode after the files. All four `fgctl` init and upgrade test files pass under
umask 002 (36 tests). No production change was needed.


# Notes

Row added in 041ac635b4 without this section; the section was added so the backlog index builds.
