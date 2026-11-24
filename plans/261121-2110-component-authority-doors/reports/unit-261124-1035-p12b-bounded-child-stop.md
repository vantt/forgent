# Phase 12b stop report: what `spawn.rs` lacks for the remaining bounded-child debt

Written by the lead on 2026-11-24 from the step 3 and step 4 unit results
(`unit-run-1795490781496-4ac2a78c` and `unit-run-1795491173191-72e8ae86`). The phase file says that a missing piece
which only one caller needs, or which is not small, is reported here and not added to `spawn.rs` (RUL104).

## Moved onto the door
- Step 3, commit 2855f7ecb: the search-path lookups in `packages/config/rust/src/detect.rs`,
  `packages/distribution/rust/src/init.rs` (`resolve_node_path`), `packages/git/rust/src/driver.rs` (git lookup,
  absolute entries only), `packages/run-supervisor/rust/src/attempt_step.rs` (node lookup) and
  `packages/process/rust/src/platform/windows_spawn.rs` now call `resolve_program` / `resolve_program_in`.
  There are two small, intended tightenings: the node lookups now require an executable bit, and `init.rs` no longer
  looks for `node.exe` on unix. On Windows `init.rs` now follows `PATHEXT`, so a `node.cmd` or `node.bat` in an
  earlier PATH directory wins over a `node.exe` in a later one (the path lands in `activation.json`); low risk, since
  the common Node version managers ship `node.exe`. A Windows name that already has an extension (for example
  `claude.cmd`) is now looked up as given by every `resolve_program` caller, where it resolved to nothing before.
- Step 4, commit ce90c714f: `packages/mailbox/rust/store/src/adapters/version.rs` runs `codex --version` through
  `run_bounded_command`. The timeout test that owns this behaviour is the `codex_program` delay script in
  `packages/mailbox/rust/store/tests/verbs.rs`.

## Stopped: the file stays debt, and what the door would need
| File | Why it does not fit `run_bounded` / `resolve_program` | Missing piece |
|---|---|---|
| `packages/git/rust/src/driver.rs` (deadline loop) | Git runs inside a containment domain: caller-made pipes, `kill_all` with a proof that the domain is empty, and a pidfd wake. The run also stops when the output passes a limit. | containment hook and output cap |
| `packages/mailbox/rust/store/src/nudge.rs` | It spawns through `spawn_mapped`, which closes every descriptor that would survive exec, so the lock descriptor never reaches the queue helper. | a spawn that closes inherited descriptors |
| `packages/run-supervisor/rust/src/steps.rs` | A Windows Job Object child that the caller owns (its own `assign_and_resume`), with a stdout limit through `take()`. | caller-owned Job Object and output cap |
| `packages/process/rust/src/mapped.rs` (PATH search) | It joins relative PATH entries to the spawn cwd, checks `access(X_OK)` and returns `EACCES` when a match exists but cannot be run. `resolve_program` uses mode bits, has no cwd join and returns not-found, so a move would change behaviour. | none needed: the file is in the door's own crate and is reclassified as `allowed` |

An output cap is shared by `driver.rs` and `steps.rs`, but neither file could move with a cap alone, because each also
needs a containment domain or a Job Object it owns. So nothing was added to `spawn.rs`.

## Not this door's job: reclassified as `allowed` in step 5
These files watch a long-lived child they started (std `Child::try_wait`), or sit in the door's own crate, and they copy
no algorithm: `apps/fgos-gateway/src/gateway.rs`, `apps/fgos/src/wiring/run.rs`,
`packages/holder-lock/rust/src/borrow_windows.rs`, `packages/run-supervisor/rust/src/controller/launch.rs`,
`packages/run-supervisor/rust/src/supervise.rs`, `packages/run-supervisor/rust/src/supervise/windows.rs`,
`packages/terminal-control/rust/src/driver/herdr.rs`, `packages/run-supervisor/rust/src/gate/windows.rs` (the gate
child of a supervision loop with stop causes, grace and escalation),
`packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs` (a long-lived JSON-RPC
provider with a handshake deadline, cancellation and streaming), `packages/process/rust/src/containment/linux.rs`
and `packages/process/rust/src/mapped.rs` (door crate). `init.rs` keeps a PATH membership test for the launcher
directory, which is not a program lookup.

## Feature idea for the owner (RUL104, not done)
One `spawn.rs` extension would retire the last three debts: a bounded run that takes a caller-owned containment (a
Linux domain or a Windows Job Object), an output cap, and an option to close inherited descriptors. It is worth doing
only when one of these three crates next changes how it spawns. Until then the three entries stay named debt.
