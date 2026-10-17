# Brief: close plan 4.3 and re-cut its state part after the event store decision

For the session that runs plan 4.3 ([plan](../261016-1306-main-checkout-single-door-hot-lock/plan.md), lane 4.3-R on the owner's machine). Written 2026-10-17 18:23 by the event store session. The owner wants the 4.3 lane to decide how its own work is split and scheduled, and then to update its rows on the [program board](../261017-1313-fgos-platform-program-board/plan.md). This brief only hands over what the event store work settled; it does not assign phases.

## What changed

The hold on 4.3-S was "wait for the event store council". That is over. The owner signed **D-ADR0055** on 2026-10-17: event truth becomes sealed changesets as git objects on per-machine refs `refs/fgos/events/<machine-id>`, appended to an open log outside the work tree, and every view is a rebuildable cache. It supersedes L3 clauses 1 and 4 and the D-ADR0003 data layout. The contract is [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md) (canonical).

What it means for 4.3-S, from the spec:

- **P01 stays as written.** `hot-lock.mjs`, `withStateTx` and the `state` hot-mutex (rank 60, one per clone) are the Work gate the event store builds on (spec section 13). The exec guard stays strict: the owner granted no exception, and the event store's Node-to-Rust route is an N-API addon precisely so that nothing spawns inside the gate (section 17).
- **P02 stays.** Claims merge into `state`, callers move onto `withStateTx`. Claims remain runtime state, outside the event store. At the later event store cutover, the appends inside the transaction go to the event store facade; nothing in P02 needs to anticipate that.
- **P04 splits.** The capacity check inside `state` stays and can land now. "Narrow `main-checkout` to the checkpoint" becomes, after the event store cutover, "remove `main-checkout` from the claim path", because no event file will need a checkpoint. Until then the current narrowing is fine.
- **The F10 barrier still holds for 4.3:** no change to the event file format, `merge=union`, `.gitattributes` or the `.fgos` strip rule. Those belong to the event store cutover (spec section 18), after this lane.
- **Lock ranks the event store adds later** (spec section 4), so 4.3-S does not collide with them: `event-append` rank 70 (may run inside `state`), `event-seal` rank 58 (can never run inside `state`). The event store plan adds both registry rows; 4.3-S does not.

Spec section 20 ("Plan 4.3-S") says the same in one paragraph: P01, P02 and the capacity half of P04 do not depend on where events are stored, so they can be re-cut and land before the event store, which unblocks 6.2 P09.

## Already on main that touches 4.3-S files

- `a4b1278ae` fix(state): `readClaims` resolves the main checkout once instead of once per claim file (a `take` with 64 open claims dropped from 269 to 21 processes, 1.75 s to 0.26 s). It edits `src/state/runtime-coordination.mjs` (`readClaim`, `readClaims`, new private `readClaimFile`) and adds a spawn-count test in `test/state/runtime-coordination.test.mjs`. P02 rewrites these functions; keep "one lookup per read" (the test fails if it is lost).
- V-SPAWN-01 baseline for the claim path: [experiment-261017-1431-event-store-v-spawn-01.md](experiment-261017-1431-event-store-v-spawn-01.md). Plan 4.3 success criterion 5 benchmarks `take` → `return`; this report has comparable numbers.

## What the owner asked of this lane

1. Decide how plan 4.3 closes. The event store session's suggestion, for you to accept or change: land 4.3-R as planned, mark the state phases and the hot-lock success criteria (2, 3, 5 and the `withClaimsLock`/`withEventsLock` part of 4) as moved, close 4.3, and run the state part as its own short plan or wave starting from main after 4.3-R lands, P01 → P02 → capacity half of P04, one landing.
2. Re-cut and schedule 4.3-S yourself (phases, worktrees, model choice).
3. Update the 4.3-R and 4.3-S rows on the program board, including what 4.3-S blocks: 6.2 P09 and the event store's Work cutover phase. The event store plan (being written by the event store session) will depend on 4.3-S only at its Work cutover phase; its first phases (crate, N-API addon, open log, seal) run in parallel.

Open questions for the 4.3 lane, not for the owner: none from the event store side.
