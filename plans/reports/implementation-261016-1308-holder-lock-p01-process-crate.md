# Implementation report: process facts and control crate

## Outcome

Crate `fgos-process` (`packages/process/rust`) delivers the facts and control
parts the holder-lock track needs, and the Node leaf
`src/runner/dispatch/process-identity.mjs` now judges from the same vector file.
Written by the `claude` executor across two rounds (the first cut off by a
provider session limit, the second by the 25-minute execution timeout before it
wrote this report); the Lead finished the round: updated the two tests that
asserted the old "record without pid is dead" rule, ran every test below and
wrote this report.

## What landed

| Area | Files |
|---|---|
| Facts: `judge`, `judge_here`, `boot_id`, `start_time`, `pid_ns`, `observe`, `identity_of`, `file_key`, `lock_holders` (`/proc/*/fdinfo` `lock:` lines), `scan` (cmdline, cwd, env subset; unreadable entries kept) | `src/facts.rs` |
| Control: `spawn_with_fds` (closes every fd >= 3 not in the map, `dup2` in `pre_exec`), `signal_by_identity` (pidfd + start-time check), `take_inherited` | `src/control.rs` |
| Domains: `Domain::{LinuxGate, WindowsJob, MacosTree}`, `domain_is_empty`, `domain_kill_all` (only `linux-gate` on Linux is real) | `src/lib.rs` |
| OS-neutral port `ProcessPlatform` with linux, macos, windows drivers; public types use `ProcId(u32)`, `FdSlot(u32)` | `src/platform/*.rs` |
| Node leaf: `judge`, `pidExists`, `localObserver`, `observeProcess`; `resolveHolderLiveness` is an adapter (`dead` -> dead, `alive`/`unknown` -> held) | `src/runner/dispatch/process-identity.mjs` |

## Behaviour change and callers

`resolveHolderLiveness` with no pid (or a null holder) now returns `held`
instead of `dead`; a zombie now returns `dead`. Callers (grep 2026-10-16):

| Caller | Can it pass a record without pid? |
|---|---|
| `run-lock.mjs:332,376` (`current.record.holder`) | Only for a corrupt generation record; `buildRunControlHolder` always writes `pid`. Such a run now stays held instead of being reclaimed (the intended direction). |
| `assignment-runner.mjs:798` (`admittedBy`) | Only for a corrupt record; same as above. |
| `detached-run-supervisor.mjs:104` | No: guarded by `if (!bound?.pid) return false`. |
| `provider-capacity.mjs:506,515,796,1109` | No: every call builds `{pid, ...}` from a known pid, or is guarded by `holderPid !== null`. |
| `main-checkout-lock.mjs:289` | No: `composite.pid` is parsed from the identity string. |

## Tests (run by the Lead)

| Command | Result |
|---|---|
| `cargo test -p fgos-process` | 28 passed, 0 failed (judge vectors, holders multiprocess, spawn fd leak incl. unmapped case, signal identity + domains) |
| `cargo check -p fgos-process --target x86_64-pc-windows-msvc` / `aarch64-apple-darwin` | both clean |
| `node --test test/process/process-facts-vectors.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs test/runner/provider-capacity.test.mjs test/runner/dispatch-liveness.test.mjs` + every test importing `run-lock` | 381/382; the one failure (`S1 live probe` in `assignment-dispatch.test.mjs`) fails identically on the untouched integration base, so it is not caused by this change |
| `node --test test/runner/run-lock-identity.test.mjs test/runner/process-identity.test.mjs` (updated to the `held` rule) | 19/19 |

## Deviations

- `test/runner/run-lock-identity.test.mjs` and `test/runner/process-identity.test.mjs`
  are outside the phase's file table; they asserted the old no-pid rule and were
  updated to the new one (the phase file names this behaviour change).
- `Domain` has no variant for kinds this build has no driver for; the
  holder-lock crate must map an unknown `domainKind` to `Unknown` / `Refused`
  before calling these functions.
