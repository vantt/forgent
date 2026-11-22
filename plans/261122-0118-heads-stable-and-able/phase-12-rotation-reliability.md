# Phase 12: Rotation reliability

Capability: `code:implement`.

Owner-approved 2026-11-22 16:05; folded in by lead:SUPERVISOR at 17:47 (answer to `q-msslhlmfkt`). Folds in backlog
`p-kqs6fjalvh` (a pool login expires inside a long seat).

## Done when

1. A confined head's handoff carries the predecessor's last message and the plan's portfolio files.
2. `rotation.log` records the real outcome. The 15:47 rotate of this lead logged `start-refused` although a successor ran.
3. Phase 11's live probe rotates a confined lead at soft and shows the successor resuming from the handoff alone (that
   probe row is phase 11's; this phase makes it pass).
4. `p-kqs6fjalvh`'s done-when: the renewal owner of each pool account is visible through the account's own verb
   (`fgos dispatch probe-account`): which seat holds it and when it last renewed. Refresh-ahead renews when the claiming
   seat does not. A seat ending never leaves its account with an expired token without a recorded attempt.

## Causes (read-only diagnosis, 2026-11-22 17:50; evidence in this lead's run files of the 15:47 rotate)

- **No last message.** `lastMessageOfOld` (`src/session-rotation/rotate.mjs:231-247`) resolves the transcript directory
  once, through `seatSessionDir`. The supervisor's `session stop` ran at the same moment, so the private home was chosen
  while the kept run copy did not exist yet. Finalize-home then removed the private home, and the read returned
  "not a readable directory" at once, without retrying. The path shape is right (`last_message.rs:96-112`).
- **No portfolio files.** The portfolio is `stopFacts.portfolio ?? reloadOf(config, persona)` (`rotate.mjs:427`).
  `sessionRotation.reload` names files only for the secretary and the supervisor, and the hook sends `portfolio: []`
  (`session_rotation_hook.rs:222-228`), so the fallback never runs. A lead's own plan can only come from its task.
- **Wrong rotation.log outcome.** The old head had already been stopped. Identity still reported `holder.live`
  (`rotate.mjs:417-418`), so the rotation placed a successor beside a closed pane, and that placement was refused
  `no-envelope`. The catch at `rotate.mjs:444-445` labels every `placeHead` failure `start-refused`. The session that
  runs now was started by the supervisor's own `session start` after the lock was released.
- **Login expiry.** `packages/execution/engine/src/credentials/renew.rs:227-237`: when `live_seat_shares_refresh` is
  true, refresh-ahead returns `skipped live-seat-owns-renewal` with no lower bound, all the way to expiry. Nothing
  records which seat owns the renewal.

## Steps

### 12a: rotation (in footprint; runs now)

1. `rotate.mjs` `lastMessageOfOld`: resolve the transcript directory on every poll pass, and retry "not a readable
   directory" until `finalTurnWaitMs` runs out, so the kept run copy is found after finalize-home.
2. `rotate.mjs`: add the head's own task file (`taskOfHead(projectRoot, persona, name)?.path` from
   `src/session-host/head-plan.mjs`, used unchanged; for a lead its `plan.md`) to the portfolio, merged with
   `stopFacts.portfolio` or `reloadOf`, before `existingIn`.
3. `rotate.mjs`: before `placeHead`, and again in its catch, check whether the old run has `cancel-requested.json` or
   `closed.json`. If it has, abandon with the existing `old-not-live` outcome, never `start-refused`. A real refusal
   keeps `start-refused`.
4. Owning proofs in `test/session-rotation/rotate.test.mjs`:
   - a transcript that appears only in the run copy after the first read fails;
   - a lead's handoff that lists its `plan.md`;
   - an old run closed mid-rotation that logs `old-not-live`.
5. `packages/session-host/contracts/rotation-files.v1.json` ("carries") and `docs/platform/session-host/spec.md` name
   the task file in the portfolio.

### 12b: login renewal (needs the footprint widen asked in the plan)

6. `renew.rs`: skip for a live seat only while the token has more than the base `threshold_ms` left. Below that, fall
   through to the cooldown check and `renew_in_scratch`, which already records a failure with its cooldown. A renewed
   pair must reach every live seat home that shares that refresh token, through the code that already writes seat
   logins (`take_live_seat_login`), never a copy. Otherwise those seats end on a spent token.
7. Record a renewal owner in the account directory: the seat (home or run) and `lastRenewedAt`. Update it where
   `take_live_seat_login` takes a seat's renewed login. Show it in the refresh-ahead line (`credentials/mod.rs:136-140`)
   and in `fgos dispatch probe-account` (`apps/fgos/src/wiring/dispatch_subs/probes.rs`).
8. Owning proofs in `packages/execution/engine/tests/credentials.rs` (next to the cases near lines 1203 and 1318):
   - a live seat near expiry is renewed and the renewal is recorded;
   - a seat that ends leaves a recorded attempt;
   - probe-account shows the owner.
   The JS twin `refreshAhead` (`src/runner/dispatch/provider-credential-renewal.mjs`) is called only by tests; leave it
   and say so in the report.

## Verify

- 12a: `node scripts/run-tests.mjs test/session-rotation/rotate.test.mjs`.
- 12b: `cargo test -p fgos-execution-engine --test credentials` (use the crate's real package name) and
  `cargo test -p fgos dispatch_subs`.

## Rollback

Revert the phase commit. Rotation then resolves the directory once and logs every placement failure as
`start-refused`; renewal again skips for a live seat until expiry.
