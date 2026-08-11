# tsk-45z: plan

## Mode

**Standard.** Flags counted against the mode-gate checklist:

- **existing covered behavior** (yes) — `main-checkout-lock.mjs` already has
  a dedicated test suite (`test/runner/main-checkout-lock.test.mjs`), and
  `claim-port.mjs`/`merge.mjs`'s own lock usage is covered by
  `test/runner/merge.test.mjs`. Changing the lock's release surface must not
  regress any of that.
- **weak proof around the area** (yes) — this exact lock lineage has caused
  3 real STR65 incidents historically (concurrent-writer `.git/index`
  clobbering); concurrency/lock code is inherently subtle and worth extra
  care.

Everything else on the checklist (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
multi-domain) does not apply — this is an internal runner-module change with
no schema, contract, or cross-platform surface. 2 flags → standard, matching
the item's own declared `tier: standard`. Not high-risk: no hard-gate flag
(auth/data-loss/audit/external-provider/validation-removal) applies — this
narrows an existing safety window, it does not remove the safety net (TTL
stays as backstop per D2/CONTEXT.md).

## Approach

Two independent-but-related changes, both grounded in `CONTEXT.md`'s D1/D2:

1. **Identity-checked release primitive** (D2). Add a new exported function
   in `src/runner/main-checkout-lock.mjs`, alongside the existing
   `releaseMainCheckoutLock` (kept as-is, still used by `claimWork`'s
   unconditional self-release and by `forceReclaimAmbiguousLock`'s callers
   elsewhere — this is an addition, not a replacement). The new function
   reads the current lock record and only unlinks when its `pid` field
   strictly equals the caller's own supplied identity — the same equality
   check `tryAcquireOnce`'s self-recognition (D6) branch already uses. A
   missing lock file, or one whose recorded identity does not match, is a
   silent no-op (idempotent, same spirit as the existing release). An
   unparseable/AMBIGUOUS record is also a no-op (never touched by this
   path — mirrors `forceReclaimAmbiguousLock`'s own "don't guess" stance,
   D5 fail-closed carried over).

2. **Wire it into `return`'s non-isolated path** (D1). In `bin/fgos.mjs`'s
   `return` case, the main-source branch (the one gated on
   `item.headAtTake`, lines ~1435-1471) is the only path in scope. Right
   after the `moveWork` calls that land the item at `proposed` (verify
   passed) or `blocked` (verify failed) — both outcomes, not just the
   passing one, per CONTEXT.md's pinned term — resolve this session's own
   identity via `resolveWriterIdentity(fgosDir)` (already imported
   elsewhere in the runner layer; `bin/fgos.mjs` gains the same import) and
   call the new identity-checked release. The branch-source (worktree)
   path is untouched — CONTEXT.md's scout already established worktree
   commits never contend for this shared lock.

3. **Crash-safety exit/signal handlers** (item's own point 2, not a new
   CONTEXT.md decision — already specified in the item's original
   description). The natural single point for this is inside
   `acquireMainCheckoutLock`'s `ACQUIRED` branch itself (where the existing
   `release()` closure is already constructed, `main-checkout-lock.mjs`
   lines 230-237) — register `process.once('exit'/'SIGINT'/'SIGTERM', ...)`
   there to call the same release path, and remove those listeners inside
   `release()` once it actually runs. This is a single change point that
   automatically covers every current holder of this lock's `release()`
   closure — `claimWork` (`claim-port.mjs:80-177`) and `mergeRunnerItem`
   (`merge.mjs:332,343`) — without duplicating signal-handling boilerplate
   at each call site (DRY; also matches "the item's own description already
   asks for this at whichever verb holds `release()`", CONTEXT.md's
   deferred-to-planning note). A `SIGINT`/`SIGTERM` handler must call
   `process.exit()` itself after cleanup (registering a custom handler
   replaces Node's default immediate-exit behavior); the `exit` handler
   only needs the synchronous unlink, already safe inside a `process.on('exit', ...)` callback.

**Alternative rejected:** duplicating exit/signal handling separately inside
`claimWork`'s and `mergeRunnerItem`'s own `finally` blocks. Rejected because
it is the same logic twice, and any third future caller of
`acquireMainCheckoutLock` would silently lack the protection unless someone
remembered to repeat it a third time — the primitive is the one place that
can guarantee it for every caller, present and future.

## Risk map

| Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| New identity-checked release fn | Low — pure read-compare-unlink, mirrors existing self-recognition logic already tested | Unit test: own-identity lock releases; different-identity lock left untouched; missing lock is a no-op; AMBIGUOUS/corrupt content is a no-op |
| `return`'s wiring | Medium — must fire on BOTH proposed and blocked outcomes, and must never fire on the branch-source path | Unit/integration test: `return` on a main-source item with a live own-identity lock clears it on both a passing and a failing verify; a branch-source `return` leaves any lock untouched |
| Exit/signal handlers in the primitive | Medium — signal handling is easy to get subtly wrong (leaked listeners across repeated acquire/release cycles, double-registration) | Test: acquire+release cycle leaves no dangling `process` listeners (`process.listenerCount`); a simulated `SIGINT` while held triggers the lock file's removal |
| Regression on existing lock consumers | Medium — `claimWork` and `mergeRunnerItem` must keep behaving byte-identical on their existing happy/error paths | Run existing `test/runner/main-checkout-lock.test.mjs` and `test/runner/merge.test.mjs` unchanged and green |

## Files touched

- `src/runner/main-checkout-lock.mjs` — new identity-checked release
  function; exit/signal handler registration inside the `ACQUIRED` branch.
- `bin/fgos.mjs` — `return` case, main-source branch: import
  `resolveWriterIdentity`, call the new release function on both the
  proposed and blocked transitions.
- `test/runner/main-checkout-lock.test.mjs` — new cases for the
  identity-checked release function and the exit/signal cleanup.
- `test/cli/fgos.test.mjs` (or wherever `return` is already covered) — new
  cases for the release-on-return wiring.

## Verify

`npm test` (per `discover`'s own verdict, already recorded as this item's
`verify`) — the full suite must stay green, including the untouched
existing lock/merge/claim tests plus the new cases above.

## Split

None. This is one honest piece of work — a single primitive addition plus
one call-site wiring plus one cross-cutting safety net inside that same
primitive. No child items.
