# lock-status-visibility — locked decisions (tsk-5z2)

## Feature boundary

`tsk-5z2`: today, every failure path that reports a held/ambiguous lock in
the wx-atomic-create + stale-pid-reclaim lock lineage prints the holder's
identity only (`pid <id>`). The caller cannot tell a legitimately-live
hold apart from a stale one without manually reading the raw lock file and
hand-computing `now - ts` against the relevant `DEFAULT_TTL_MS`. This item
gives the caller that answer directly: lock age and remaining TTL,
surfaced both inline in the existing failure messages and through a new
read-only status verb, across all four locks in the lineage.

Depends on `tsk-3h4` (the `fgos unlock` verb) — landed (`stage:
compound-learn`, `docsRef: docs/history/fgos-unlock-main-checkout-lock/`).
Verified its refusal message (`bin/fgos.mjs:2269`) still prints
identity-only, same gap this item closes — tsk-3h4's scope never touched
this.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Ships both an inline error-text augmentation (age/remaining-TTL folded into the existing HELD/AMBIGUOUS failure messages) **and** a new read-only status verb for on-demand inspection outside a failed call — not one or the other. |
| D2 | Both currently-identity-only failure surfaces get the fix: `claim-port.mjs`'s `ClaimError` (`lock-held`/`lock-ambiguous`, the take/pick path named in the item title) and `unlock`'s own refusal message (`bin/fgos.mjs:2269`) — same underlying lock-check result, same gap, both get it. |
| D3 | Surfaced content is both lock age (time since the record's `ts`) and remaining TTL (time until the lock is eligible for reclaim) — not just one of the two. |
| D4 | Scope generalizes to all four locks sharing this lineage — `.fgos/main-checkout.lock` (`src/runner/main-checkout-lock.mjs`), `runner.lock` (`src/runner/loop.mjs`), `sessions.lock` (`src/runner/session.mjs`), `events.lock` (`src/state/events.mjs`) — not `main-checkout.lock` alone. This reverses tsk-3h4's own D3 (which scoped narrow and deferred generalization to "a future item if that need shows up") — this item is that future item, confirmed against user, not assumed. |

## Pinned terms

- **"lock age"** = `now - record.ts` for the currently-recorded holder.
- **"remaining TTL"** = `ttlMs - (now - record.ts)` where `ttlMs` is the
  caller-supplied freshness window (e.g. `DEFAULT_TTL_MS` in
  `main-checkout-lock.mjs`, currently 3 minutes — the item's own
  description cites 5 minutes, which is stale; confirmed against
  `main-checkout-lock.mjs:68` and its own changelog comment, lowered
  2026-07-29 by an unrelated fix). For locks without a caller-supplied
  `ttlMs` (verified below — some sibling call sites omit it, pure
  PID-liveness only), remaining-TTL is not computable; only age is shown
  for those.
- **"the lineage"** = the wx-atomic-create + stale-pid-reclaim lock
  pattern shared by all four locks (documented at
  `main-checkout-lock.mjs:1-14`'s own header, calling itself "a FOURTH,
  wholly independent instance" of the pattern already proven three times).

## Scout evidence

- `src/runner/claim-port.mjs:80-85` — the take/pick path: calls
  `acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs:
  DEFAULT_TTL_MS })`, so `ttlMs` is already in scope at this call site.
  Line 82's `ClaimError` message: `` `claimWork: main checkout locked by
  pid ${lockResult.holderPid}` `` — identity only, confirmed live in
  current source.
- `bin/fgos.mjs:2264-2270` (`case 'unlock'`) — refusal message:
  `` `unlock: main checkout lock is held by a live session
  (${lockResult.holderPid}) -- refusing to clear it.` `` — identity only,
  same gap, confirmed live and post-tsk-3h4.
- `src/runner/main-checkout-lock.mjs:157-175,239-240` (`tryAcquireOnce`,
  `acquireMainCheckoutLock`) — `record.ts` is already read into scope
  during the HELD/AMBIGUOUS check but the `HELD` return value
  (`{ status: HELD, holderPid, lockPath }`) drops it; only `holderPid`
  survives to the caller. Age/remaining-TTL are computable today without
  new file-read plumbing, purely by widening this return shape.
- `src/runner/loop.mjs:230-275,930-931` — sibling lock, same
  `holderPid`-only shape returned from its own acquire attempt
  (`acquireRunnerLock`), same identity-only message at line 930.
- `src/runner/session.mjs:150-184,213-214` — same pattern
  (`acquireSessionsLock`), identity-only message at line 213.
- `src/state/events.mjs:220-230+` — same lineage (`acquireEventsLock`,
  per this file's own lineage-note comment at lines 23-36 cited by
  `main-checkout-lock.mjs`'s header).
- `docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md` — tsk-3h4's own
  decision doc; D3 explicitly scoped generalization to the other three
  locks out, calling it "a bigger surface than the item's title asked
  for" and leaving it for "a future item" — this item is that future
  item (D4 above), not an assumption.

## Canonical references

- `src/runner/main-checkout-lock.mjs`
- `src/runner/claim-port.mjs`
- `src/runner/loop.mjs`
- `src/runner/session.mjs`
- `src/state/events.mjs`
- `bin/fgos.mjs` (`case 'unlock'`, `COMMAND_REGISTRY` — where a new status
  verb would register)
- `docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md` (tsk-3h4,
  D3 precedent this item reverses)

## Outstanding questions deferred to planning

- Exact status-verb name/flags (e.g. `fgos lock-status [--lock
  main-checkout|runner|sessions|events]` vs one verb per lock vs a single
  verb reporting all four at once) — implementation shape, not a product
  decision.
- Exact wording/units for the augmented error messages and the new verb's
  output (raw milliseconds vs a human-readable duration like `2m15s`) —
  implementation detail.
- Whether each lock's own acquire function needs its return shape widened
  (e.g. `HELD` gaining `lockAgeMs`/`remainingTtlMs` fields) individually,
  or a small shared helper is introduced — given each of the four lock
  modules is deliberately independent/zero-dep by design (per
  `main-checkout-lock.mjs`'s own header comment), whether that
  independence extends to this new reporting logic or a shared
  formatting-only helper is acceptable is a shaping call for planning.
- Confirmed during scouting, not deferred: not every sibling call site
  supplies `ttlMs` to its lock acquire call — planning should verify which
  of the four call sites (`claim-port.mjs`, `loop.mjs`'s runner-lock
  caller, `session.mjs`'s caller, `events.mjs`'s caller) actually pass a
  TTL window today, since remaining-TTL is only computable where one is
  supplied (pinned term above); a call site with no `ttlMs` shows age
  only, not a gap in this item's scope.
