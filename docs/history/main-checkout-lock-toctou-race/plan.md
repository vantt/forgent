# main-checkout-lock TOCTOU race — plan

Item: `tsk-2tm`. Decisions: `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` (D1-D4).

## Mode

Flags counted: **existing covered behavior** (test/runner/main-checkout-lock.test.mjs
already covers 20+ scenarios on this module; a wrong edit regresses claim/merge/
release flows) and **weak proof around the area** (no existing test exercises a
reader concurrent with an in-progress write — that gap is the bug itself). = 2 flags.

GitNexus impact analysis (`impact-analysis: full`, GitNexus present) on both edited
functions returned **risk: HIGH** for each:
- `acquireMainCheckoutLock` upstream: `claimWork` (depth 1), `mergeRunnerItem`
  (depth 1), `claimItem` (depth 2), `retargetMember` (depth 2), `claimAndDispatch`
  (depth 3) — 4 execution flows, Runner module.
- `tryAcquireOnce` upstream: same chain one hop further (through
  `acquireMainCheckoutLock`).

2 counted flags alone would land `standard`; the HIGH GitNexus risk on the
claim/merge/retarget critical path pushes this to **standard** deliberately
(not downgraded to `small`/`tiny` despite the item's `tier: light` intake
classification) — a wrong fix here breaks claiming across the whole runner,
not just this one lock file. `fgos graph --json` confirms `tsk-2tm` is a
size-1 component (no dependents, no split candidates) — this stays one
piece of work, just with a wider regression net than a `tiny` fix would
warrant.

## Approach

**Chosen path:** replace both non-atomic write paths in
`src/runner/main-checkout-lock.mjs` with write-then-publish, using two
different publish primitives because the two paths have different exclusivity
requirements (D2/D3):

1. **Fresh-create path** (`tryAcquireOnce`, current lines 137-142): must stay
   an exclusive create — two processes racing to create a brand-new lock must
   still produce exactly one ACQUIRED. `fs.renameSync` cannot be used here
   (rename unconditionally replaces the target, so two racing renames could
   both "succeed", destroying the exclusivity `wx` gives today). Use instead:
   write full content to a uniquely-named temp file in the same directory
   (`${lockPath}.tmp-${identity}-${now}-${random}` to avoid collision between
   simultaneous acquirers), then `fs.linkSync(tmpPath, lockPath)` — `link(2)`
   is atomic and fails `EEXIST` if the target already exists, exactly
   mirroring today's `wx` semantics but publishing a FULLY WRITTEN file in one
   syscall instead of create-then-populate. Unlink the temp file after
   (success or `EEXIST` failure) in a `finally`.
2. **Self-recognition refresh path** (line 165): no exclusivity needed (only
   the recognized owner reaches this branch) — write to a temp file, then
   `fs.renameSync(tmpPath, lockPath)`. `rename(2)` is atomic replace on POSIX:
   any concurrent reader sees either the old or the fully-written new content,
   never a truncated intermediate state.

**Rejected alternative:** pre-serializing the JSON string before `fs.openSync`
and using a single `fs.writeFileSync(lockPath, content, {flag: 'wx'})` call.
Rejected because `writeFileSync` with `wx` still performs `open()` then
`write()` as two separate syscalls under the hood — the same window the bug
report describes, just narrower (no more separate `fs.writeSync`/`fs.closeSync`
JS-level pause) rather than eliminated. Temp+link/rename is the standard POSIX
pattern for "atomic create/replace with pre-built content" and fully closes
the window.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| Fresh-create path (`tryAcquireOnce` lines 137-142) | HIGH (GitNexus: `claimWork`, `claimAndDispatch`, `claimItem`, `mergeRunnerItem`, `retargetMember` all depend on this) | New regression test proving no reader ever observes unparseable content during a concurrent create; full existing suite in `test/runner/main-checkout-lock.test.mjs` green; `test/e2e/main-checkout-lock-hook.test.mjs` green (pre-commit hook path) |
| Self-recognition refresh path (line 165) | MEDIUM (same callers, narrower branch — only hit on same-identity refresh) | New regression test for the refresh case; existing self-recognition tests (search: "self-recognition"/`record.pid === identity`) still pass |
| Mutual-exclusion invariant (D3) | HIGH (this is the exact property a naive rename-based fix would silently break) | New test: two processes racing to create a genuinely NEW lock still produce exactly one ACQUIRED and one EEXIST/HELD/retry — mirrors existing test "refuses when held by a live other pid" (`test/runner/main-checkout-lock.test.mjs:150`) but for the *creation* race specifically, not the already-held case |
| Temp-file cleanup on error | LOW (leftover temp files are harmless — never read by `parseLockContent`, don't affect lock state) | Covered by the `finally` unlink in the new code; not worth a dedicated test given LOW risk |

Impact-analysis posture: **full** (GitNexus present, confirmed via
`fgos tool query --capability impact-analysis --status present`). The HIGH-risk
proof points above are carried as real regression tests, not left as guesses.

## Shape (standard)

**Phase 1 — fix the write paths.**
- Files: `src/runner/main-checkout-lock.mjs` (both branches in `tryAcquireOnce`).
- No signature changes to `acquireMainCheckoutLock`, `tryAcquireOnce`,
  `parseLockContent`, `inspectMainCheckoutLock`, `releaseMainCheckoutLock(IfOwn)`,
  or `forceReclaimAmbiguousLock` (D1's boundary) — callers are unaffected at
  the API level; only the on-disk write mechanics change.

**Phase 2 — regression tests.**
- File: `test/runner/main-checkout-lock.test.mjs`.
- Add: (a) a test proving the create path never leaves an observable
  empty/partial file — simulate by intercepting/timing a concurrent read
  during acquire, or by asserting the implementation never opens the target
  path before content is fully written (whichever proves the property without
  a flaky timing-dependent test — implementer's call at `fgos-coding-validating`/
  `fgos-coding-implement`, this plan only requires the property be proven); (b) a
  test proving two racing fresh-creates still yield exactly one ACQUIRED;
  (c) a test proving the self-recognition refresh path also never exposes
  partial content.

**Concrete cases to prove against** (per Flow step 4):
- Two processes racing to create a brand-new lock (no prior file) — exactly
  one ACQUIRED, the other sees EEXIST-then-reads-a-valid-record (not
  AMBIGUOUS from a torn read).
- A reader (`inspectMainCheckoutLock`/`claimWork`'s call into
  `acquireMainCheckoutLock`) landing mid-write of either path — never sees
  unparseable/empty content.
- Existing behavior unchanged: self-recognition refresh, stale-pid reclaim,
  HELD/AMBIGUOUS/ACQUIRED classification for already-settled files, release
  paths — all existing tests in the file must stay green.

**Phase 3 — verify.**
- `node --test test/runner/main-checkout-lock.test.mjs`
- `node --test test/e2e/main-checkout-lock-hook.test.mjs`
- `npm test` (full suite, per repo DoD)

## Split

No split. One item, one file (plus its test file) — `fgos graph --json`
confirms `tsk-2tm` is a size-1 component with nothing depending on it.

## Assumptions

- The exact shape of the new regression test(s) proving "no torn read" (timing
  simulation vs. structural assertion) is an implementation detail left to
  `fgos-coding-implement` — not material to scope/behavior/acceptance criteria,
  only to how the proof is constructed. `fgos-coding-validating`'s reality gate
  checks this assumption is either resolved or flagged unproven before
  `executing` starts.

## Proof surface (verify command for this item as a whole)

```
node --test test/runner/main-checkout-lock.test.mjs test/e2e/main-checkout-lock-hook.test.mjs && npm test
```
