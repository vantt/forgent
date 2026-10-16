# Main door P00: hot-lock and borrow contracts, registry rows, call-site table

## Result

- `packages/holder-lock/contracts/lock-registry.v1.json` (4.3 rows only): `state` and `porting-events` v3 record paths are now `<fgosDir>/locks/state.hot` / `porting-events.hot`; the reclaim kernel lock sits next to each as `<name>.reclaim.lock` (stated in the row note and in `hot-lock.v1.json`, no schema change). `merge-slot` gains a fenceNote (tombstone every `refs/heads/*` at cutover) and a note that `<ref>` is `encodeURIComponent(target ref)`, as v1 `mergeSlotLockFile` writes it. `main-checkout` gains a note pointing at the borrow contract. Rows owned by 4.2 and 4.4 are untouched.
- Created `packages/holder-lock/contracts/hot-lock.v1.json` (record tuple, fast path, reentry, reclaim under kernel lock with byte re-read, stateTx revocation, child_process guard with `syncBuiltinESMExports`, five error codes).
- Created `packages/holder-lock/contracts/main-checkout-borrow.v1.json` (`FGOS_LOCK_FD=main-checkout:3`, three borrower conditions through `fgos internal lock-fd --borrowed-check`, `runBorrowed` git prefix `-c gc.auto=0 -c maintenance.auto=false`, scrub).
- Tests: `test/holder-lock/registry-contract.test.mjs` (+1), new `test/holder-lock/hot-lock-contract.test.mjs` (5). `node --test` on both: 17/17 pass.

Decision recorded: the registry's `<ref>` placeholder is kept (the facade resolver fills plain params only); callers pass the encoded ref. Changing it to a computed placeholder would need a 4.2 facade change for no gain.

## Call-site table at fc9898772 (differences from the phase file)

| Symbol | Now |
|---|---|
| `withEventsLock(` | as listed, plus the definition `events.mjs:416` |
| `withEventsLockAndRefresh(` | as listed (definitions `store.mjs:246`, `porting-store.mjs:89`) |
| `withClaimsLock(` | as listed |
| `acquireMainCheckoutLock(` | as listed, plus **two dispatch-cwd callers** that use the same function with a `lockFile` option: `src/runner/dispatch/cli.mjs:728`, `src/runner/dispatch/assignment-runner.mjs:2221` (dispatch-cwd belongs to 4.2's row; whoever deletes `acquireMainCheckoutLock` in P03 must leave these on 4.2's dispatch-cwd path, not delete them). `main-checkout-lock.mjs:485`, `:593`; `bin/fgos.mjs` verb `unlock` now at `:4255` |
| `HOLDER_PID_ENV_VAR` | `main-checkout-lock.mjs:150, 568, 576, 596`; `merge.mjs:53` (import), `:1593`; `.githooks/pre-commit:29, 116` |
| `withLockRetry(` | `bin/fgos.mjs:3121`, `:3194` (shifted); others as listed |
| `runOpportunisticMainCheckoutChecks(` | as listed |
| `git worktree add` | as listed (`bin/fgos.mjs` return path now `:3356`); `worktree.mjs:761`, `:1302`, `session.mjs:430`, `bin/fgos.mjs:460` are messages/comments, not calls; `scripts/test-select-mutate.mjs:237,263` are test tooling outside the runner (not wrapped) |

## fgosDir of withEventsLock callers

Store and porting callers lock the log under the `dir` the store was opened with, which bin resolves with `resolveFgosDir(process.cwd())` (`--show-toplevel`, so a linked worktree's own `.fgos` when run from one). Claims always live under `getMainFgosDir(dir)` (`claim-port.mjs:304`, `runtime-coordination.mjs`). So today events.lock and claims.lock can sit in two different `.fgos` trees. P02 must take `state` under the main checkout's `.fgos` (prefetched once per process, per hot-lock.v1.json) for every caller, including the compaction (`events-compaction.mjs:219`), porting and the three migration scripts.

## Prior art

`git whatchanged -S'syncBuiltinESMExports' -S'state.reclaim' --oneline --no-patch`: only the design report commits (fb3b6113e ... 3f2f887a6). No hot-mutex kernel lock ever existed in code.

Component boundary: contracts only here; the boundary change lands with P09.
