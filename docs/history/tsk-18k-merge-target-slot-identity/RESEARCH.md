# Research: tsk-18k — merge-target-slot lock string-identity release/renew

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match the bug described in tsk-18k's
description (string-identity `releaseMainCheckoutLockIfOwn`/
`renewMainCheckoutLockIfOwn` can delete a sibling session's live lock after a
TTL reclaim), and — the item's own "NEW gap" note — does the nonce/pid
identity fix alone provably close the CAS-guard race in
`withMergeEphemeralWorktree`, or does that also need hardening within this
item's scope?

**Checked:**
- `src/runner/merge.mjs:776-811` (`withMergeTargetSlot`) — read directly.
- `src/runner/main-checkout-lock.mjs:250-316` (`tryAcquireOnce`),
  `:367-430` (`acquireMainCheckoutLock`), `:475-504`
  (`releaseMainCheckoutLockIfOwn`), `:539-565`
  (`renewMainCheckoutLockIfOwn`) — read directly.
- `src/runner/worktree.mjs:1007-1046` (`withMergeEphemeralWorktree`, the CAS
  guard) — read directly.
- `test/runner/main-checkout-lock.test.mjs`,
  `test/runner/merge-target-slot-multiprocess.test.mjs`,
  `test/runner/worktree-callsite-wrapper.test.mjs` — located as the existing
  coverage for these three modules (no read of contents needed for this
  round; confirms a real, runnable verify command exists).

**Found:**
1. `withMergeTargetSlot` (merge.mjs:786) acquires with
   `allowSelfRecognition: false` and a `resolveWriterIdentity` string
   identity (env-derived session id) — confirmed exactly as the description
   states. The heartbeat (merge.mjs:800-803) calls
   `renewMainCheckoutLockIfOwn` every `HEARTBEAT_INTERVAL_MS`; release
   (merge.mjs:807-809) calls `lock.release()` →
   `releaseMainCheckoutLockIfOwn` (main-checkout-lock.mjs:390).
2. Both `releaseMainCheckoutLockIfOwn` (line 492) and
   `renewMainCheckoutLockIfOwn` (line 556) gate strictly on
   `record.pid !== identity` (`===` equality, string or number). This
   confirms the exact failure mechanism: per main-checkout-lock.mjs:252-261's
   own comment, an env-derived session id is inherited byte-identically by
   every forked child, so two genuinely different OS processes (siblings
   from the same session) present the SAME string identity. If process A's
   lock goes TTL-stale (main-checkout-lock.mjs:274-283, string identity is
   judged stale by `ttlMs` freshness alone, no liveness probe) and process B
   — a sibling sharing A's identity string — reclaims and acquires a fresh
   lock, then A's later heartbeat renew or release call passes
   `record.pid !== identity` as FALSE (same string) even though the record
   is now B's, not A's own acquisition. A's renew/release therefore
   legitimately (by this check) mutates/deletes B's live lock. Confirmed:
   description's Finding 1 mechanism is accurate, current, and reproducible
   from the read code — no repo drift since the report was written.
3. CAS guard (worktree.mjs:1020-1041): `git rev-parse branch` (read) then,
   only if it still equals `startCommit`, `git branch -f branch endCommit`
   (write) — two separate git invocations, not one atomic operation. Between
   the read and the write, nothing prevents a second call for the same
   branch from doing the same read + write in between.
4. **The nonce/pid identity fix does NOT by itself close the CAS-guard gap.**
   Reasoning from the code actually read (not speculation): the identity fix
   only changes what `releaseMainCheckoutLockIfOwn`/`renewMainCheckoutLockIfOwn`
   compare against — it stops a stale holder from wrongly touching a
   reclaimer's fresh lock record. It does nothing to stop the reclaim itself
   from happening while the stale holder is still mid-flight. Concretely:
   `withMergeTargetSlot`'s `fn()` (merge.mjs:806) is the whole merge critical
   section, including `withMergeEphemeralWorktree`. If holder A's heartbeat
   renew is delayed long enough for `ttlMs` to lapse (main-checkout-lock.mjs:283,
   the SAME staleness math applies to a numeric pid identity per line 268-272's
   `pidLive && withinTtl` — a live pid can still be judged stale on TTL
   alone), holder B can legitimately reclaim and acquire the slot while A's
   `fn()` is still running — A was never signaled to stop. Both A and B are
   now genuinely, simultaneously inside `withMergeEphemeralWorktree` for
   (potentially) the same target branch. The identity fix correctly prevents
   either one's release/renew from deleting the other's lock record, but it
   does not prevent both from reaching the CAS guard's read-then-write window
   concurrently. This matches the item's own description text verbatim
   ("TTL-starvation-driven reclaim still happens under BOTH [nonce and pid]")
   — confirmed from the code, not just repeated from the description.
5. Therefore the description's own conditional ("If the nonce/pid fix
   doesn't provably close this by itself, harden via an atomic `git
   update-ref <ref> <new> <old>`") resolves to: **yes, the atomic
   update-ref hardening is also needed within this item's scope.** No
   existing `update-ref` compare-and-swap precedent found elsewhere in
   `src/`/`bin/` (`grep -rn "update-ref"` — no hits) — this is a new
   pattern for the codebase, not a copy of an existing call site; planning
   picks the exact `git()` wrapper invocation shape.

**Remaining open (not blocking — deferred to planning, per the item's own
description):** whether the acquisition identity uses a per-acquisition
nonce or `process.pid`. The description already states both close the
release/renew collision equally and defers the choice to planning as an
implementation detail, not a product decision — no new evidence surfaced
here that would force one over the other, so this stays deferred exactly as
decided.

**Verify (real, runnable):**
```
npm test -- test/runner/main-checkout-lock.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```
(existing suite covering all three touched modules; planning/implementation
adds new cases to these files for the identity-collision and CAS-guard
scenarios confirmed above.)
