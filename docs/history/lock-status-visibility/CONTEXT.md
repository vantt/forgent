# lock-status-visibility — locked decisions (tsk-5z2)

## Feature boundary

`tsk-5z2`: today, `.fgos/main-checkout.lock`'s failure paths print the
holder's identity only (`pid <id>`). The caller cannot tell a
legitimately-live hold apart from a stale one without manually reading the
raw lock file and hand-computing `now - ts` against `DEFAULT_TTL_MS`. This
item gives the caller that answer directly: lock age and remaining TTL,
surfaced both inline in the existing failure messages and through a new
read-only status verb. Scoped to `main-checkout.lock` only (D5) — the
other three locks sharing this lock lineage (`runner.lock`,
`sessions.lock`, `events.lock`) have no `ttlMs`/staleness-window concept
at all, so this item does not touch them.

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
| D4 | ~~Scope generalizes to all four locks sharing this lineage~~ — **superseded by D5**. |
| D5 (supersedes D4) | Scope narrows back to `.fgos/main-checkout.lock` only, matching the item's original title. Validating's reality gate found `runner.lock` (`loop.mjs:204-276`), `sessions.lock` (`session.mjs:191-219`, `141`), and `events.lock` (`events.mjs:211-227`, `215`) all write a bare pid string to disk — no `ts` field, and none of their acquire functions accept a `ttlMs`/staleness-window parameter. `ttlMs` is a documented divergence unique to `main-checkout-lock.mjs` (its own header comment: "THREE divergences from the mirrored lineage"). Lock *age* would still be recoverable for the siblings via file mtime with no format change, but remaining-*TTL* has no existing value to compute against for them — inventing one is a new staleness-policy decision for those three locks (which would also change their stale-reclaim behavior, not just reporting), out of scope for this item. Confirmed against user rather than worked around silently. |

## Pinned terms

- **"lock age"** = `now - record.ts` for the currently-recorded holder.
- **"remaining TTL"** = `ttlMs - (now - record.ts)` where `ttlMs` is the
  caller-supplied freshness window (e.g. `DEFAULT_TTL_MS` in
  `main-checkout-lock.mjs`, currently 3 minutes — the item's own
  description cites 5 minutes, which is stale; confirmed against
  `main-checkout-lock.mjs:68` and its own changelog comment, lowered
  2026-07-29 by an unrelated fix). Out of scope per D5: `runner.lock`,
  `sessions.lock`, `events.lock` have no `ttlMs` concept at all (pure
  PID-liveness), so remaining-TTL is not computable there.
- **"the lineage"** = the wx-atomic-create + stale-pid-reclaim lock
  pattern shared by all four locks (documented at
  `main-checkout-lock.mjs:1-14`'s own header, calling itself "a FOURTH,
  wholly independent instance" of the pattern already proven three times).
  Sharing the lineage does not mean sharing every field: only
  `main-checkout-lock.mjs` stores `ts` and accepts `ttlMs` (D5).

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
- `src/runner/loop.mjs:204-276` (`acquireRunnerLock`) — writes only
  `String(pid)` to `runner.lock` (line 212); no `ts` field, no `ttlMs`
  parameter. Confirms D5.
- `src/runner/session.mjs:191-219`, `141` (`acquireSessionsLock`) — same:
  bare pid string, `timeoutMs`/`retryMs` are the *caller's own* blocking
  retry budget, not a staleness window on the lock itself. Confirms D5.
- `src/state/events.mjs:211-227`, `215` (`tryAcquireEventsLockOnce`) —
  same bare-pid shape; guards `appendEvent`'s cross-process writes to
  `.fgos/events.jsonl`, held only for the duration of a single append
  (`EVENTS_LOCK_TIMEOUT_MS = 2000`). Confirms D5.
- `docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md` — tsk-3h4's own
  decision doc; D3 explicitly scoped generalization to the other three
  locks out, calling it "a bigger surface than the item's title asked
  for" and leaving it for "a future item" — this item tried to be that
  future item (original D4) but reverted (D5) once the siblings' actual
  lock-file shape ruled out an honest, symmetric fix.

## Canonical references

- `src/runner/main-checkout-lock.mjs`
- `src/runner/claim-port.mjs`
- `bin/fgos.mjs` (`case 'unlock'`, `COMMAND_REGISTRY` — where a new status
  verb would register)
- `docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md` (tsk-3h4,
  D3 precedent this item originally tried to extend, per D5 above)

## Outstanding questions deferred to planning

- Exact status-verb name/flags (e.g. `fgos lock-status`) — implementation
  shape, not a product decision.
- Exact wording/units for the augmented error messages and the new verb's
  output (raw milliseconds vs a human-readable duration like `2m15s`) —
  implementation detail.
