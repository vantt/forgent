# settle-claim-work-add-writer-stamp — RESEARCH

## Round 1 — 2026-08-26 (tsk-1sr discovery)

**Asked:** tsk-1sr reports two gaps found recovering tsk-4jo live: (1)
`revisionDriftIsSelfCaused` (`src/state/store.mjs:1043`) fails closed on
legitimate same-writer events that omit `payload.writer`, specifically
naming `work.add`/`decision`/`work.discovery`/`work.gate-approve` as
examples; (2) no CLI verb to release a single orphaned runtime claim file.
Goal: confirm which parts are still real gaps vs. already fixed, and scope
a real fix.

**Checked — gap 1, event-type by event-type:**
- `SIDE_LOG_ONLY_EVENT_TYPES` (`store.mjs:1015-1022`) already lists
  `decision`, `work.gate-approve`, `work.discovery`, `work.outcome`,
  `work.friction`, `work.call-summary` — the function's own doc comment
  (`store.mjs:1000-1012`) explicitly cites this exact failure mode
  ("`fgos decision`/`fgos gate-approve` ... never stamp `payload.writer` ...
  made the very first version of this fix fail closed on every real
  coding-domain item") as ALREADY FIXED by this denylist. Confirmed by a
  passing existing test: `test/state/runtime-coordination.test.mjs:576`
  ("settleClaim reconciles a same-writer drift even when unstamped
  side-log events (decision, gate-approve) also happened mid-claim").
  **3 of the 4 event types tsk-1sr's own report names are already fixed.**
- `work.add` is the ONE remaining gap: not in the denylist (correctly —
  it genuinely creates `view.work[id]`, `replay.mjs:69-74`, so it cannot be
  side-log-exempted the way `decision`/`gate-approve` are), and
  `addWork` (`store.mjs:246-333`) never stamps `payload.writer` at all —
  `payload: item` is written straight from the caller's own item shape,
  which has no `writer` field. Every sibling verb that DOES mutate
  `view.work[id]` (`editWork`, `moveWork`, `resolveParkReason`, per
  `store.mjs:469/502/728`) stamps `payload.writer =
  resolveWriterIdentity(dir)` right before its own `appendEventLocked`
  call — `addWork` is the one inconsistent case, not an intentional
  two-tier design.
- `replay.mjs:69-74`'s `case 'work.add'` spreads `event.payload` wholesale
  into `view.work[item.id]` — so stamping `item.writer =
  resolveWriterIdentity(dir)` before the event is appended (mirroring the
  sibling verbs exactly) requires no separate `replay.mjs` change; the
  existing generic spread already threads a `writer` field through once
  it's present on the payload, exactly the way `work.move`'s own
  `item.writer = writer` fold (`replay.mjs:87-89`) already handles it for
  that event type.
- **`work.attempt` deliberately stays unstamped — confirmed by an
  existing, passing regression test naming this exact scenario**:
  `test/state/runtime-coordination.test.mjs:649` ("settleClaim treats an
  event with no writer stamp at all as NOT self-caused (fails closed,
  keeps refusing)") uses a raw `work.attempt` event with no
  `payload.writer` as its own fixture, asserting the reconcile MUST keep
  refusing — this is `recordClaimAttempt`'s reclaim-record shape
  (`store.mjs:1883-1892`, `src/runner/claim-port.mjs`'s stale-claim-reclaim
  path), where an unstamped event is the load-bearing signal that
  distinguishes "this session's own claim" from "a different session's
  reclaim of an abandoned one." Stamping `work.attempt` would REMOVE that
  signal and risk silently reconciling a genuine cross-writer conflict —
  explicitly NOT part of this item's fix.

**Checked — gap 2 (no CLI verb to release an orphaned runtime claim):**
Real and still open — `isReclaimEligible`/`lastActivityAt`
(`src/runner/claim-liveness.mjs`) only clear a claim after 24h+ of no real
git activity on the item's branch/worktree (the `humanMs` threshold,
`STALE_DOING_DEFAULTS`), which is the correct floor for "is someone still
working on this" but does not help a caller who already has OTHER
evidence the claim file itself is orphaned (e.g., the durable event log
shows the item reverted to a fresh `todo`/`discovery` placeholder after a
wipe+resubmit, independent of any liveness signal). `fgos unlock`
(`bin/fgos.mjs:4302-4329`) is the closest existing pattern (verify via the
real acquire/liveness primitive, refuse with holder identity if genuinely
held, only clear the free/stale/ambiguous cases) but is scoped to
`main-checkout.lock` specifically, not a per-item runtime claim file.
Designing a safe, correctly-scoped verb for this (what evidence counts as
"provably orphaned" beyond raw `rm`, what it should do to the item's own
`status` if anything) is a materially larger, separate design question
than gap 1's mechanical fix — tsk-1sr's own report already flags this
direction as "not prescriptive."

## Verdict

`clear`, scoped to gap 1 only. Gap 2 (a verified claim-release CLI verb)
is a real, still-open, separate design question — deferred, not fixed
here: the existing manual workaround (`rm
.fgos/runtime/claims/<id>.json`, confirmed working by tsk-1sr's own
report) remains available, and a smaller, correctly-scoped fix (gap 1)
should not be inflated into designing a new safety-verified CLI verb on
the same pass. A human/future item can pick up gap 2 on its own footing.

**Verify:** `node --test test/state/runtime-coordination.test.mjs` — new
test, following the exact pattern of the existing "reconciles a
same-writer drift even when unstamped side-log events" test
(`runtime-coordination.test.mjs:576`) but using a POST-claim `addWork`
call (simulating the wipe+resubmit-under-the-same-id shape tsk-1sr's own
incident hit) instead of `decision`/`gate-approve`, asserting `settleClaim`
reconciles instead of refusing. Full existing file must stay green
(including the `work.attempt`-stays-unstamped test above, unchanged).
