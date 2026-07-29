# tsk-45z: Tự release main-checkout.lock khi chắc chắn xong việc

## Feature boundary

`.fgos/main-checkout.lock` (`src/runner/main-checkout-lock.mjs`) currently
only clears through TTL-based staleness (`DEFAULT_TTL_MS = 3 * 60 * 1000`).
The pre-commit hook (`.githooks/pre-commit`) acquires/refreshes the lock on
every commit against a real main checkout and never releases it itself, by
design — a session that just finished its last commit still blocks a
different session's `take`/`pick`/commit attempt for up to the full TTL,
even though it is genuinely done.

This item adds an active release at the one lifecycle point that reliably
means "this session is done touching the main checkout": `fgos return`'s
non-isolated (main-source) path, right after its verify outcome moves the
item to `proposed` or `blocked`.

## Scout findings (grounding for the decisions below)

- `bin/fgos.mjs`'s `return` case (lines 1341–1472) never calls
  `acquireMainCheckoutLock`/`releaseMainCheckoutLock` today, in either its
  branch-source (worktree) or main-source path.
- The only two current call sites of this lock are `claim-port.mjs`'s
  `claimWork` (acquires + releases in the same synchronous call's own
  `finally`, `claim-port.mjs:80,177`) and `merge.mjs`'s `mergeRunnerItem`
  (acquires before the merge, releases in a `finally` wrapping the whole
  merge+verify+commit sequence, `merge.mjs:332,338`) — both already correct
  for the happy path.
- `.githooks/pre-commit` resolves `repoRoot` via `path.resolve(__dirname,
  '..')` relative to the hook file's OWN location. Inside a `pick`-created
  worktree, that resolves to the *worktree's* root, not the main checkout —
  so a worktree-isolated session's commits never contend for the shared
  main-checkout lock at all. Only a non-isolated pull-door `take` (commits
  landing directly in the real main checkout) or `approve`'s merge into
  main actually exercise the shared lock.
- `releaseMainCheckoutLock(dir)` (`main-checkout-lock.mjs:257`) unconditionally
  unlinks the lock file if present — no identity check, unlike acquire's own
  self-recognition (D6) branch in `tryAcquireOnce`.
- `resolveWriterIdentity` (`session-identity.mjs`) returns a stable identity
  (env session id, or a 3-hop pid-ancestor-walk fallback) across separate CLI
  invocations within the same session/shell — stable enough for a later
  `fgos return` call to recognize the same identity the earlier commits'
  pre-commit hook acquired the lock under.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope release-on-done to `fgos return`'s non-isolated (main-source, `headAtTake`-present) success/blocked branches only. `approve`'s `mergeRunnerItem` already acquires+releases correctly in its own `try/finally` around the whole merge — no functional gap there. Worktree-isolated `return`/commits never touch the shared main-checkout lock, so nothing to add on that path either. |
| D2 | The new release call must be identity-checked: only unlink when the lock file's current holder identity matches this session's own `resolveWriterIdentity(fgosDir)` result — mirroring `tryAcquireOnce`'s D6 self-recognition rule. An unconditional unlink (today's `releaseMainCheckoutLock` behavior) risks deleting a *different*, genuinely live session's lock if this session's own TTL window had already lapsed and another session acquired it in between — reopening the exact STR65 concurrent-writer race this lock exists to prevent. |

## Pinned terms

- **"session is done with the main checkout"** = the moment `fgos return`'s
  non-isolated path finishes its verify and calls `moveWork` to transition
  the item to `proposed` (verify passed) or `blocked` (verify failed) — both
  outcomes mean this take-session's own commit activity against the main
  checkout is over, not just the passing case.
- **"identity-checked release"** = a release that reads the current lock
  record and compares its holder identity against this session's own
  `resolveWriterIdentity` result before unlinking, exactly like acquire's
  self-recognition branch — never a blind/unconditional unlink.

## Deferred to planning (implementer's concern, not asked here)

- Whether the identity-checked release becomes a new exported primitive
  (e.g. `releaseMainCheckoutLockIfOwn`) in `main-checkout-lock.mjs`, or an
  inline read-compare-unlink at the `return` call site.
- Whether/where `process.on('exit'/SIGINT/SIGTERM')` crash-safety handlers
  are added — the item's own description already asks for this (point 2,
  process exit handlers at whichever verb currently holds `release()` from
  `acquireMainCheckoutLock`, i.e. `claimWork`/`mergeRunnerItem`), so it is
  in scope as a requirement, but *where* the handler lives (inside the
  lock primitive itself vs. duplicated per call site) is implementation
  shape, not a product decision.
- Test coverage shape (unit test per lock status, per the item's own
  priority note tying this to the just-lowered `DEFAULT_TTL_MS`).

## Canonical references

- `src/runner/main-checkout-lock.mjs` — the lock primitive (D1–D6 documented
  inline).
- `src/runner/claim-port.mjs:65-179` — `claimWork`, existing correct
  acquire+release-in-finally pattern to mirror for identity-checking.
- `src/runner/merge.mjs:307-339` — `mergeRunnerItem`, existing correct
  acquire+release-in-finally pattern around a multi-step git sequence.
- `.githooks/pre-commit` — the only caller that acquires without ever
  releasing (TTL-only expiry, by design).
- `src/runner/session-identity.mjs` — `resolveWriterIdentity`, the identity
  source both the hook and the new release check must agree on.
- `docs/specs/runner.md:1035-1037` — existing spec prose for the lock and
  the pre-commit hook's TTL contract.
- `docs/history/fgos-unlock-main-checkout-lock/CONTEXT.md` — sibling
  decision doc for the related `fgos unlock` verb (D2 there: never blindly
  delete the lock file, reuse acquire's own staleness/liveness judgment) —
  same safety principle this item's D2 extends to the release side.

## Outstanding questions

None — both material questions (release scope, identity-safety) were
locked with the person this session.
