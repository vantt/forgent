# Phase 00 Baseline Evidence

Date: 2026-09-11

## Commands

```sh
node --test test/runner/dispatch-recovery.test.mjs \
  test/runner/dispatch-liveness.test.mjs \
  test/runner/main-checkout-lock.test.mjs \
  test/runner/coordination-recovery-and-quorum.test.mjs

node --test test/runner/herdr-spawn-adapter.test.mjs \
  test/runner/dispatch-confinement-authority.test.mjs \
  test/runner/assignment-dispatch.test.mjs
```

## Observed Result

- Recovery/coordination/lock focused run: **113 passed, 0 failed**.
- Herdr/confinement/assignment focused run before recovery changes: **100
  tests, 99 passed, 0 failed, 1 live test skipped**.
- The test harness emits expected `fatal: not a git repository` diagnostics for
  temporary fake workspaces; these do not fail the assertions.

## Baseline Facts

- Existing Herdr ad-hoc dispatch still uses timestamp-derived names.
- Assignment-owned dispatch currently has a durable `runId` in its Run record,
  but it is **not yet** threaded into Herdr launch identity; that is P02's code
  work.
- No reconcile-before-launch or gateway-side orphan lookup exists yet.
- Existing lock tests include live-PID TTL reclaim behavior; this remains frozen
  legacy behavior and is not the proposed generation-lock profile.
- Existing terminal replay keeps statuses absorbing and neutralizes post-terminal
  records.

## Gate Status

S0 baseline evidence is captured. P01's Run admission/fencing and P02's
reconcile-before-launch work remain open. B04 is not closed by deterministic
naming alone; F-b/F-f still require a real reconciliation primitive and tests.
