# Main door P00, repo-lock part: contracts and call-site table

Status: DONE. Scope fence F10: only the main checkout, merge slot, worktree-admin and borrow-fd contracts. The state part is on hold for the event store council.

## Result

- Merged `main-door/integration` into `main-door/p00-contracts` (the branch had not seen it), then re-checked the draft `ef0fdfd77` against the plan and the code.
- Kept: registry notes for `main-checkout` (borrow contract pointer) and `merge-slot` (`fenceNote` tombstone every `refs/heads/*`; `<ref>` is `encodeURIComponent(target ref)`); `packages/holder-lock/contracts/main-checkout-borrow.v1.json`; the registry test for the repo lock family (`merge-slot` 20, `worktree-admin` 40, `main-checkout` 50).
- Tests: `test/holder-lock/main-checkout-borrow-contract.test.mjs` (3) and `registry-contract.test.mjs` (13): `node --test` 16/16 pass. The borrow test also asserts the contract names nothing of `events.lock`, `claims.lock`, `stateTx`, `events.jsonl`, shards.
- The lock core and the borrow contract name no event-log concept. The `.fgos` checkpoint stays an optional adapter for P03; every P03/P05/P06/P07/P08 test must pass with a null adapter. `merge=union`, `.gitattributes` and the `.fgos` strip rule are untouched.

## Removed from the draft (re-cut when the state part resumes)

| What | Where it was | Content to restore |
|---|---|---|
| `hot-lock.v1.json` (deleted) | `packages/holder-lock/contracts/` | record `{v,pid,startTime,bootId,pidNs?,writer?}`; resources `state` (`<fgosDir>/locks/state.hot`, reclaim kernel lock `state.reclaim.lock`) and `porting-events`; fast path link/unlink; `hot-lock-reentry` at once; reclaim only on `judge==dead` under the kernel lock with a byte re-read before `unlink`; `stateTx` revoked at release; `child_process` guard with `syncBuiltinESMExports`; errors `exec-under-hot-lock`, `hot-lock-reentry`, `hot-lock-timeout`, `lock-record-unreadable`, `state-tx-revoked`. Recoverable with `git show ef0fdfd77:packages/holder-lock/contracts/hot-lock.v1.json`. |
| `state` and `porting-events` registry rows | `lock-registry.v1.json` | back to the 4.2 values: `v3Path` `state.lock` / `porting-events.lock`, original short notes. Draft values were `state.hot` / `porting-events.hot` plus reclaim-lock notes. |
| `hot-lock-contract.test.mjs` | `test/holder-lock/` | git-moved to the borrow test; two hot-lock tests and the `state`/`porting-events` rows of the family test dropped. |
| draft report `implementation-261016-1832-main-door-p00-contracts.md` (deleted) | `plans/reports/` | its call-site rows for `withEventsLock`, `withClaimsLock`, `HOLDER_PID_ENV_VAR` are the state half; fgosDir finding (events lock under the worktree `.fgos`, claims under main's) is the input P02 needs later. |

## Call-site table at integration tip (repo-lock part, rg at HEAD)

| Symbol | Sites |
|---|---|
| `acquireMainCheckoutLock(` | `claim-port.mjs:116, :130`; `merge.mjs:790, :920, :1897`; `main-checkout-lock.mjs:442 (def), :550`; `bin/fgos.mjs:4257` (verb `unlock`). The two dispatch-cwd callers in the draft report are gone (4.2 cutover). |
| `HOLDER_PID_ENV_VAR` / `FGOS_MAIN_LOCK_HOLDER_PID` | `main-checkout-lock.mjs:141, 533, 553`; `merge.mjs:53 (import), :1593`; `.githooks/pre-commit:29, 116`; `dispatch/adapters.mjs:102, :115` (env scrub, must move to `FGOS_LOCK_FD`) |
| checkpoint `.fgos` | `runOpportunisticMainCheckoutChecks` `events-jsonl-truncation-guard.mjs:365`; callers `claim-port.mjs:165` (holds main), `merge.mjs:807` (slot only), `:936` (holds main) |
| `git worktree add` calls | `worktree.mjs:748, :750, :752, :1294`; `session.mjs:309`; `merge.mjs:1807`; `workflow/integrate.mjs:54, :56, :118`; `bin/fgos.mjs:3358`. 10 calls, as the plan says. Others in grep are comments/messages; `scripts/test-select-mutate.mjs:237, :263` is test tooling, not wrapped. |
| `withLockRetry(` | `promote-engine.mjs:74`; `merge.mjs:1866`; `approve.mjs:149`; `sync-root.mjs:105`; `bin/fgos.mjs:3123, :3196` |

Plan differences: `session.mjs` is now `:309` (was `:423`); `bin/fgos.mjs` take/pick moved to `:3123/:3196`; `unlock` at `:4257`.

## Decisions

- Registry `<ref>` placeholder kept; callers pass the encoded ref (facade resolver fills plain params only).
- State rows reverted rather than deleted: they are 4.2's rows, only the draft's edits are the state part.

## Prior art

`git whatchanged -S'syncBuiltinESMExports' -S'state.reclaim' --oneline --no-patch`: design report commits only, no hot mutex ever existed in code. Repo-lock lessons from the phase file stand (description replaces pid self-recognition; W1' beacon kept; protocol marker dies via tombstone).

Impact analysis: contracts and tests only, no symbol edited; GitNexus index stale, nothing to report.

Unresolved questions: none.
