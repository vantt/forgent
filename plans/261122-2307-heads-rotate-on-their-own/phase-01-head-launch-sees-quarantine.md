# Phase 1: A head launch sees the quarantine

Capability: `code:implement`. Closes `p-njgws5wsex` and cause 3 of `p-fwdxupc6fx`.

## Inputs

- `plans/261122-2307-heads-rotate-on-their-own/plan.md`: Outcome, "Cause confirmation".
- `src/session-host/head-start.mjs:137-147` (`bindHeadSeat`): the bind without `accountState`.
- `src/runner/execution/bind.mjs:20-30`: how `ctx.accountState` reaches the host.
- `src/runner/dispatch/provider-capacity.mjs:486` (`readAccountStateOverlay`): the overlay every other bind caller
  passes.
- `packages/execution/rust/src/accounts.rs:555-690` (`account_view`): how the overlay becomes `quarantinedUntil`.
- `.fgos/runtime/session-rotation/secretary-miu/rotation.log` line 43: the incident.

## Footprint

`src/session-host/head-start.mjs`, `test/session-host/head-start.test.mjs`.

## Steps

1. In `bindHeadSeat`, read `readAccountStateOverlay({ runtimeDir })` once, outside the state lock, the same way the
   dispatch callers do, and pass it as `accountState` in the bind's `ctx`. Leave out `assignmentId`: a head seat
   holds no sticky lease that should survive a rotation. Use the runtime directory the rest of the head launch
   already resolves. Do not build a new path.
2. An unreadable lease state stays what it is today, the config-only view. Do not invent a fallback.
3. Extend `test/session-host/head-start.test.mjs` with one test: "a head seat bind never ranks an account the lease
   state quarantines". Use a pool with two accounts, one quarantined until a future time and one healthy, and
   assert that the binding names the healthy one. Then use a case where the only account is quarantined and assert
   that the refusal reason is `no-account-available`. No existing test proves this: the file's bind tests run
   without lease state.

## Verify

```bash
node --test test/session-host/head-start.test.mjs
```

The pass condition is that the new test passes and every existing test in the file still passes.

## Rollback

Revert the phase's commits. The bind goes back to the config-only view.
