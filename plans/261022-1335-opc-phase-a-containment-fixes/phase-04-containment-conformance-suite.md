# Phase 04: one containment conformance suite (A5)

## Context

The owner's mandate: one conformance suite every driver must pass, so a sandbox driver can be replaced. Today each driver has its own file, and several cases repeat across them:

- `packages/process/rust/tests/containment_bwrap.rs` (265 lines);
- `containment_pgroup.rs` (190);
- `containment_macos.rs` (140);
- `containment_windows.rs` (268);
- `containment_spawn_timeout.rs` (93);
- `spawn_fds_leak.rs` (185).

The simplicity seat's §3.5 cut the behaviour list to one owning proof each. CI runs these on Linux, macOS and Windows only for pushes to `run-supervisor/**`, `terminal-mode/**` and `controller-death/**` (`.github/workflows/process-containment.yml`).

## Requirements

1. **One test body per behaviour**, generic over `&dyn ContainmentDriver`, instantiated per driver available on the platform. A driver missing on the host is reported as skipped with its reason, never silently passed.

   | Behaviour | What the body asserts |
   |---|---|
   | (a) | `create` + `spawn_in` runs the argv with exact env, cwd and stdio; exit status reaches the caller |
   | (b) | a background child left by the root is found: `is_empty` is not `Empty` until `kill_all` |
   | (c) | a `setsid` + double-fork escapee is killed by kernel drivers, or matches the driver's named escape in `guarantee().escapes` on best-effort drivers |
   | (d) | `kill_all(grace)`: SIGTERM first, SIGKILL after the grace, then empty |
   | (e) | `Unknown` is never `Empty` |
   | (f) | the child's fd table holds only its fd map plus stdio (from `spawn_fds_leak.rs`) |
   | (g) | `guarantee()` names the driver, its level and its escapes |

2. **Driver quirks stated as properties, not hidden** (correctness F5, F6):
   - On `bwrap-pidns`, a pid-1 child without a SIGTERM handler ignores SIGTERM and dies only at SIGKILL.
   - bwrap reports a signalled child as `128+n`, while `linux-pgroup` reports no code.

   Each driver declares these properties, and the body asserts against the declaration.
3. **Driver-only behaviours stay in their driver file**, only where no common body can observe them: the bwrap prefix rules, the Windows job views, macOS's 500 ms rescan.
4. **Net test lines ≤ 0** across the six files. Every retired case names the body that now owns it, in the commit message and in the TEST review note (design principle 8).
5. **CI:** the `process-containment` workflow also runs on pull requests and on pushes to `main` that touch `packages/process/**`.

## Files

- `packages/process/rust/tests/`: one new module for the conformance bodies, the per-driver instantiation in the existing files, and the deleted duplicate cases.
- `.github/workflows/process-containment.yml`.

## Steps

1. Map every existing case to a behaviour (a)–(g) or to "driver-only".
2. Send the map to TEST (`forgent-f8`) and wait for its review.
3. Write the bodies, move the instantiations, delete the duplicates.
4. Run `cargo test -p fgos-process` on this host (bwrap and pgroup both instantiated; the pgroup driver is constructed directly).
5. Trigger the workflow on a branch for macOS and Windows (`workflow_dispatch`).

## Owning proof

The suite is the proof. Each body is the single owner of its behaviour.

## Gates

- Green on Linux locally, and on the three CI runners.
- TEST approval.
- Net lines ≤ 0, counted with `git diff --stat` on the tests directory.

## Risk and rollback

- **Risk:** a generic body weakens a driver-specific assertion. TEST's review checks each retired case against its new owner.
- **Rollback:** revert.
