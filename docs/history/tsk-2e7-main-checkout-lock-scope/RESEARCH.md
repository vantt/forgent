# Research — tsk-2e7 (main-checkout lock scope in dispatch execute())

## Round 1 — 2026-08-24

**Asked:** Classify every call site inside dispatch `execute()`
(`src/runner/dispatch/cli.mjs`, the `acquireMainCheckoutLock` region the
item cited around lines 487-517) by what it actually touches — main
checkout / `.fgos/` state (needs the shared lock, per ADR0020) vs pure
worktree-local state (independent of other items' footprints, should not
need the shared lock) — and check whether any existing decision doc already
bears on narrowing the lock's scope.

**Checked (repo search, all hits read directly):**

- `rg -n "acquireMainCheckoutLock\(" src` → exactly 4 call sites:
  `src/runner/dispatch/cli.mjs:488`, `src/runner/claim-port.mjs:105,119`,
  `src/runner/merge.mjs:779,906`.
- `src/runner/dispatch/cli.mjs:353-557` (`executeExecutorCli`, the function
  the item's cited line range sits inside) — read in full.
- `src/runner/main-checkout-lock.mjs:49,77-79` (`LOCK_FILE` constant,
  `dispatchLockFile(cwd)`, `mergeSlotLockFile(targetRef)`).
- `src/runner/merge.mjs:760-790` (merge-into-target lock) and `:895-915`
  (merge-into-main / `fgos approve` lock) — read in full.
- `docs/history/dispatch-execute-per-item-concurrency-guard/plan.md`
  (tsk-64hk, already delivered/merged — the item that added the exact lock
  call the item under discovery cites) — read in full.
- `docs/decisions/index.md:23` (D-ADR0020) — worktree workers never carry
  `.fgos/`; only the main checkout does.
- `test/runner/dispatch.test.mjs:4880-4952` (`fanoutBatchExecutorCli fires
  candidates in batch concurrently with overlapping execution windows`) and
  `src/runner/dispatch/cli.mjs:737-826` (`fanoutBatchExecutorCli` body) —
  read in full to see what `cwd` each concurrently-dispatched candidate
  actually gets.

**Found:**

1. `dispatch/cli.mjs:488`'s `acquireMainCheckoutLock` call — the exact one
   the item cites — already passes `lockFile: dispatchLockFile(cwd)`
   (`cli.mjs:487`), not the default global `LOCK_FILE`.
   `dispatchLockFile(cwd)` (`main-checkout-lock.mjs:77-79`) is
   `` `dispatch--${encodeURIComponent(cwd)}.lock` `` — a **distinct lock
   file per calling `cwd`**, keyed on the item's own worktree path. Two
   `executeExecutorCli` calls for two different `cwd`s acquire two
   different lock files under the SAME `fgosDir` and do not contend at
   all — the lock is already per-item, not global, despite living under
   the main checkout's `.fgos/` directory (the only place a shared lock
   file can legally live; the lock file itself is not `.fgos/` *state*,
   just a filesystem mutex).
2. This narrowing is not incidental — it was the deliberate, documented
   design of tsk-64hk (`docs/history/dispatch-execute-per-item-concurrency-
   guard/plan.md`, delivered/merged): the guard exists to refuse a *second
   concurrent dispatch of the SAME cwd re-invoked by mistake*
   (`dispatch-in-flight`), explicitly scoped to `cwd` "the one real caller
   today" needed, not to serialize distinct items.
3. Real, already-green proof this narrowing works for independent items:
   `fanoutBatchExecutorCli` (`cli.mjs:737-826`) calls `fgos pick` per
   candidate first, then passes each candidate's own
   `picked.data.worktree.path` as `cwd` into `executeExecutorCli`
   (`cli.mjs:793-822`) — so concurrently-fanned-out items get distinct
   `cwd`s and therefore distinct dispatch locks. The existing test
   `fanoutBatchExecutorCli fires candidates in batch concurrently with
   overlapping execution windows` (`test/runner/dispatch.test.mjs:4880`)
   asserts exactly this: two candidates' adapter-execution windows overlap
   in wall-clock time. If the dispatch lock were global, this test would
   fail (the second candidate's adapter call would block until the first
   released). It does not — 268/268 baseline includes this test green.
4. The item's premise — "Global main-checkout lock trong dispatch
   execute() ... serialize TOÀN BỘ out-of-process dispatch kể cả các item
   đã worktree-isolated" — is **not accurate for the current code**: the
   specific lock at the cited line range is already per-`cwd`, already
   proven not to serialize independent worktree-isolated items in the real
   fanout path.
5. The genuinely GLOBAL locks in this repo (default `lockFile = LOCK_FILE`,
   one file for every caller) are two DIFFERENT call sites, neither inside
   `execute()`:
   - `claim-port.mjs:105,119` (`claimWork`, the engine behind `fgos
     pick`/`fgos take`) — genuinely global across every claim, regardless
     of item. This is also the lock the *driving session in this very
     conversation* waited ~2 minutes on moments before this discovery pass
     ("still waiting on main-checkout lock (holder pid ...)") — a live,
     first-hand data point that the felt "lock contention" pain people
     experience in practice comes from the claim path, not from
     `execute()`.
   - `merge.mjs:906` (merging a branch directly onto `main`, `fgos
     approve`'s own commit) — also global, no `lockFile` override.
   - `merge.mjs:779` (`mergeSlotLockFile(targetRef)`, merging into a
     non-`main` target ref, e.g. a parent's own worker branch) — already
     narrowed per-target-ref, same pattern `dispatchLockFile` reused.
6. Why the two still-global sites are correctly global, not a narrowing
   candidate: `claimWork` and the `main`-merge commit both mutate the
   single shared main-checkout git working tree and/or append to the one
   shared `.fgos/events.jsonl` (the CAS event log every claim/return/merge
   writes through) — a single-writer resource by construction. Narrowing
   either to per-item would let two claims (or two merges onto `main`)
   interleave writes/checkouts against the one shared working tree, the
   exact "race/mất state" risk the item's own text already flagged as the
   danger of narrowing wrong.

**Still open:** none — the classification the item asked for is now fully
evidenced: one call site (already narrowed, tsk-64hk), two call sites
(genuinely need to stay global), one call site (already narrowed
per-target-ref).
