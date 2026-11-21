# Phase 1: P7 tail-failure fixture the Windows tail reaches

## Inputs
- plan.md, Facts section (cause: the injected failure sits in doctor-bridge.mjs, which `fgos init` reaches only
  through the Linux-only Work store step).
- test/rust-host/fgctl-upgrade.test.mjs (`releaseWithFailingTail` ~98, the P7 tests ~564 and ~610).
- test/rust-host/fgctl-init-preflight-tail.test.mjs (~218, same injection), test/rust-host/fgctl-init-fixture.mjs.
- apps/fgos/src/wiring/init.rs (the init steps and their order), packages/distribution/rust/src/init.rs
  (`run_tail`, `run_tail_step`), packages/distribution/rust/src/shim.rs (`cmd_body`, the `.cmd` launcher the
  Windows tail runs). Read these; do not edit them.

## Files it may write
test/rust-host/fgctl-upgrade.test.mjs, test/rust-host/fgctl-init-preflight-tail.test.mjs,
test/rust-host/fgctl-init-fixture.mjs

## Steps
1. Find a point that the tail's first step (`fgos init`, run through the workspace launcher) reaches on Linux, macOS
   and Windows, and that a fixture can make fail without changing production code. Production code may not grow an
   env switch or a test-only branch. Ways to look: real workspace or release state that makes an init step refuse,
   or a payload module that init loads on every platform. Check that the failure happens in the tail, after the
   activation is published, and not in preflight or publish.
2. Put the injection in one helper shared by both test files (fgctl-init-fixture.mjs is the natural home) and use it
   from `releaseWithFailingTail` and from the init P7 test. Keep the `SIMULATE_TAIL_FAILURE` gate if the chosen point
   can read it; otherwise gate it the way that point allows, so that init in the same tests (the repair test runs
   `init` first without the variable) still succeeds.
3. Leave every assertion as it is, including `tail command 'init.*failed with status 1` and the `ready-degraded`
   transaction. If the real Windows status differs from 1, stop and report instead of loosening the regex.

## Verify
- Linux: `node scripts/run-tests.mjs test/rust-host/fgctl-upgrade.test.mjs test/rust-host/fgctl-init-preflight-tail.test.mjs`.
  It needs the release binaries: run `cargo build --release --workspace` first, with CARGO_TARGET_DIR on ext4 under
  `/home/vantt/projects/forgent-worktrees/`, never under /tmp.
- Windows: the lead pushes the branch and dispatches `release-assets-check`. `focused tests (windows-latest)` must
  show both P7 tests `ok`.
