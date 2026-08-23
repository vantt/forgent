# plan: tsk-18k — merge-target-slot lock identity + CAS-guard hardening

Mode: high-risk

Flag count/lane: 2 flags — existing covered behavior (main-checkout-lock.mjs,
merge.mjs, worktree.mjs all carry live test suites already: see Verify
below) + hard-gate flag "data loss" (this bug's own failure mode is a
force-move silently discarding a live sibling's already-landed merge —
committed work loss, not just a logic error). One hard-gate flag alone
forces high-risk regardless of total count, per fgos-routing's Mode gate.
Decided directly here (direct-entry fallback, `fgos-coding-planning` step 1):
this item entered `planning` straight from a `clear` discovery verdict, so
no `fgos-routing` Orient pass ever ran and no `CONTEXT.md`/exploring round
exists for this item — the item's own description already carries locked
DECIDED guidance (dated 2026-08-14), which stands in for `CONTEXT.md` here.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → gitnexus
registered and `present`. BUT the indexed snapshot for this repo
(`/home/vantt/projects/forgentX`) is **172 commits behind HEAD**
(`list_repos` staleness hint) — per `CLAUDE.md`'s capability gate this is
**degraded**, not full: run the check, but treat its output as weak
evidence and cross-check.

That cross-check was necessary in practice, not just precautionary: `impact`
on `releaseMainCheckoutLockIfOwn`/`renewMainCheckoutLockIfOwn`/
`withMergeEphemeralWorktree` (upstream, this repo) each returned
`impactedCount: 0` — a **false negative**, confirmed by direct `grep`:

- `releaseMainCheckoutLockIfOwn` — real callers at
  `main-checkout-lock.mjs:390` (the `release()` closure inside
  `acquireMainCheckoutLock`) and `bin/fgos.mjs:3071,3100` (the `return`
  verb's own release calls).
- `renewMainCheckoutLockIfOwn` — real callers at `merge.mjs:801`
  (`withMergeTargetSlot`'s heartbeat) and `merge.mjs:933` (a final renew).
- `withMergeEphemeralWorktree` — real callers at `promote-engine.mjs:72`,
  and `bin/fgos.mjs:1065,3645,4183` (three separate merge-command call
  sites: leaf merge, root merge, and the promote path).
- `withMergeTargetSlot` — real callers at `bin/fgos.mjs:3593` (root merge)
  and `bin/fgos.mjs:4143` (targeted merge).

**Gap named plainly:** GitNexus's blast-radius numbers for this item are not
trustworthy (stale index, demonstrated false negative) — the blast-radius
evidence in this plan is grep-derived, not GitNexus-derived. Confirms
multiple live call sites across `bin/fgos.mjs`'s merge command surface, not
a single narrow caller — consistent with `tier: heavy`/`risk: heavy`.

## Approach

Two changes, both required (see "Why both" below), touching the same three
files the item's own description already named:

1. **Identity fix — switch the merge-target-slot's acquisition identity from
   the env-derived session-id string to `process.pid`** (description's own
   stated preference: "a genuine simplification, not just parity with
   nonce" once `allowSelfRecognition: false` can be dropped for this call
   site). `merge.mjs:778` (`withMergeTargetSlot`) currently reads
   `resolveWriterIdentity(fgosDir).id` — change the identity source for this
   one call site to `process.pid`, and drop the now-unneeded
   `allowSelfRecognition: false` from its `acquireMainCheckoutLock(...)`
   call (main-checkout-lock.mjs:262's self-recognition branch already
   handles a numeric identity correctly — distinct OS pids no longer
   misread as "self"). This closes the exact release/renew misidentify bug
   (`record.pid !== identity` now compares real, distinct OS pids instead
   of a string two sibling processes can share).

   Rejected alternative (per acceptance in the item's own description): a
   per-acquisition nonce. Functionally equivalent for closing the
   release/renew collision, but pid is strictly simpler here (drops a
   parameter, matches the already-existing numeric-identity code path
   verbatim) and the only stated reason to avoid pid (tsk-1wr's "wider
   blast radius" rationale) is confirmed stale by the description's own
   research: the dual numeric/string branch (main-checkout-lock.mjs:268-283)
   predates tsk-1wr by 3 weeks, and `fgos unlock` already branches on both
   types cleanly.

2. **CAS-guard hardening — replace worktree.mjs's read-then-force-move with
   an atomic compare-and-swap.** Confirmed in RESEARCH.md round 1: the
   identity fix alone does NOT close the CAS-guard race, because
   TTL-starvation reclaim (main-checkout-lock.mjs:268-283, applies to a
   live pid the same as a live string — `pidLive && withinTtl`) can let a
   second holder legitimately acquire the slot while the first holder's own
   `fn()` (the whole merge critical section, including
   `withMergeEphemeralWorktree`) is still running, unaware its lock was
   reclaimed. Both are then genuinely, simultaneously inside the CAS guard's
   read (`git rev-parse branch`) → write (`git branch -f branch endCommit`)
   window at `worktree.mjs:1033-1040`. Replace this with
   `git update-ref refs/heads/<branch> <endCommit> <startCommit>` (atomic:
   git refuses the update if the ref's current value isn't `startCommit`,
   turning the silent-discard failure mode into the same loud
   `WorktreeError` the guard already throws on a detected race — same
   error message/shape, just triggered by git's own atomicity instead of a
   separate read call that can lose a race). No existing `update-ref`
   precedent in this repo (`grep -rn "update-ref" src bin` — no hits); this
   is a new call shape for the `git()` wrapper already used throughout
   `worktree.mjs`.

**Why both, not either:** the item's own description states this
explicitly and RESEARCH.md round 1 confirms it from the code — the identity
fix closes the release/renew misdeletion (Finding 1's literal bug); the
CAS-guard fix closes the "two holders live, second force-move silently
discards the first's merge" race, which reclaim can still trigger regardless
of the identity model. Shipping only one leaves the other failure mode open.

**Order:** identity fix first (smaller, self-contained, and is what the
item's title/Finding 1 literally names), then the CAS-guard hardening
(depends on nothing from the identity fix, but is the natural second step
per the description's own "if X doesn't provably close this, also do Y"
framing). Single item, no cross-item ordering question — `fgos graph
--what-if` does not apply (nothing to compare against; this is one piece).

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| `withMergeTargetSlot` identity source | Medium — call-site-local change, but every merge command path depends on this lock | `test/runner/merge-target-slot-multiprocess.test.mjs` gets a new case: two processes sharing what would have been the same string identity (simulate via pid) no longer collide on release/renew |
| `releaseMainCheckoutLockIfOwn`/`renewMainCheckoutLockIfOwn` | Low — pure identity-comparison functions, already unit-testable in isolation | `test/runner/main-checkout-lock.test.mjs` gets a new case: TTL-stale holder A's release/renew call after holder B reclaims must return `not-owner`, never touch B's record |
| `withMergeEphemeralWorktree` CAS guard | High — silent data loss is the exact failure mode being closed; touches every merge/promote call site (4 confirmed above) | `test/runner/worktree-callsite-wrapper.test.mjs` (or a new co-located test) gets a case: two concurrent calls racing the same branch tip — exactly one lands, the other throws `WorktreeError` with the existing message shape, never a silent overwrite |

## Shape

Single piece, no split — the two changes are one coherent fix for one
bug (Finding 1 plus its own confirmed follow-on gap), not two independent
units of work; splitting them would let one land without the other, which
the "why both" reasoning above already rules out as incomplete.

Verify (already synced onto the item at discovery, real and runnable, no
change needed — item's own `verify` field already reads this, not a
placeholder):
```
npm test -- test/runner/main-checkout-lock.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```

Cases the new test coverage above must sketch: TTL-starvation reclaim while
the original holder is still mid-`fn()` (concurrent access — the core bug
scenario), a clean single-holder acquire/release/renew cycle (must not
regress), and the CAS guard's existing already-covered race-detection path
(must keep throwing `WorktreeError`, now via `update-ref`'s own exit code
instead of the read-then-compare, with the same message shape asserted by
`test/runner/worktree-callsite-wrapper.test.mjs` today).

## Outstanding questions

None
