# Re-review round 4: documentation-cutover write lease (10a6b66cc..83a331410)

Verdict: **ok**

All six round-3 findings are closed through the production path. No round-3 behaviour I re-ran regressed. I found no new High or Medium issue; the four new findings are Low.

All probes ran in scratch repos under `scratchpad/6b1-r4/`:

- `common.sh` and `p1`–`p9` are the probe scripts. The hooks are copies of the worktree hooks, with a logging wrapper in front.
- The CLI is the worktree's `bin/fgos.mjs`, run with the already-staged dev host.
- Nothing was written to the worktree. No git writes or fgos CLI calls went against it.
- Both lease test files pass with exit 0: unit 11/11 and e2e 31/31.

## NEW-1: re-timed

Scenario (`time.sh`): `checkout -b`, then 5 commits, then a 5-commit `--force-rebase`, in a repo with no lease. Hooks dir contains only the reference-transaction hook. Three trials each, load average 4.6.

| Hook | Trial times | Ratio to no hook |
|---|---|---|
| No hook | 0.27 / 0.09 / 0.03 s | 1x |
| Old sh hook (6aa3d5c19) | 0.60 / 0.36 / 0.21 s | about 3x |
| r3 Node hook | 8.35 / 8.57 / 8.45 s | about 65x |
| **r4 sh front end** | **0.31 / 0.21 / 0.23 s** | **about 2x**, the same as the old sh hook |

Two further measurements:

- **Main updates still spawn Node, but less.** 5 `--allow-empty` commits on main take 14 ms with no hook, 1,798 ms with the r3 hook and 357 ms with the r4 hook.
- **A broken policy import is confined to main.** I replaced `pre-commit` with a syntax error (`p7`). A branch commit and `branch -f` still succeed, and `update-ref refs/heads/main` is refused, so main fails closed.

## NEW-1..6

| # | Status | Evidence |
|---|---|---|
| NEW-1 ref hook cost | **Closed** | See the table above. Owning proof: E `reference shell skips Node outside prepared main updates…` and E `no-lease branch five commits…`. |
| NEW-2 doctor in consumer projects | **Closed** | `doc.mjs` returns not-applicable for plain git, non-git, and a consumer with its own `.githooks/pre-commit` plus `core.hooksPath=.githooks`. A consumer that ships its own wired `.githooks/reference-transaction` is green. Owning proof: U `doctor is not applicable in … consumer projects…`. |
| NEW-3 borrow is not holder proof | **Closed** (within the ruled trust boundary) | `p2`/`p3`: an adversary with a real main-50 borrow forges `held→released` with `drift: []`. It is refused by pre-commit and, with `--no-verify`, by the ref hook. `held→abandoned` without `ownerConfirmed` is refused. Copying the holder token into the main checkout does let the forge through (exit 0). That is expected: the token is the capability, and the attacker is the same uid. Owner abandon stays an open door by design, and the Phase 9 obligation to recompute drift is recorded in L12-108. |
| NEW-4 corrupt sidecar repair | **Closed** | `p4`, with `{"state":"HELD"` committed on main: an out-of-scope commit on another branch is refused, a `--no-verify` main commit is refused, and `acquire` is refused. `abandon` without flags is refused, and a borrowed forge without `ownerConfirmed` is refused. CLI `abandon --owner-confirmed --reason` lands one sidecar-only commit with `abandon.repair: corrupt-sidecar` and leaves the main checkout clean. Ordinary commits and `acquire` then work again. |
| NEW-5 residue after a failed transition | **Closed** | `p5` forces `git-fence-missing`. After a failed acquire: main porcelain is clean, no sidecar file, no holder token. After a failed release: the sidecar file is byte-equal to `main:`, the lent token is gone from main, the holder token is kept, and main is clean. One trivial leftover: an empty `plans/` directory after a failed first acquire. The losers of the concurrent acquire left no token (`p9`). |
| NEW-6 `git clean -fdX` deletes the token | **Closed** (documented) | The module header and L12-108 document it. E `git clean -fdX…` now cleans the holder and proves that owner abandon recovers. |

### No regression

| Behaviour | Result |
|---|---|
| Raw moves of main while the lease is held (`p1`) | All refused, and main is unchanged: `update-ref` to a docs commit; `--no-verify` multi-path commit; `mv docs→apps`; non-ASCII path; forged held→released without the borrow; deleting main; resetting main to `main~1`; symref alias; `update-ref --stdin`. Two new probes are also refused: `symbolic-ref refs/heads/main refs/heads/evilb`, and `--stdin symref-update`. A non-holder docs commit on its own branch is refused by pre-commit. |
| Concurrent acquire (`p9`) | 3/3 concurrent CLI acquires: exactly one winner, one commit, main clean, one token. |
| Corrupt sidecar | Refused everywhere except the owner repair. |
| Digests | On a clone at 83a331410, all 7 root OIDs equal `ls-tree`, taking 0.36 s (was 1.9 s). Correct when sibling names sort before the root (`docs-a.md`, `docs.txt`, `core/skills-old`). |
| Holder release from a subdirectory | `holder/docs` release succeeds. A non-holder release is refused. |

### Slice-2 API

Every name imported from the lease module anywhere in `src`, `bin`, `.githooks` and `test` is still exported. The only new function, `readSidecarBlob`, is private.

## New findings (all Low; none blocks)

- **L-1: crash during the token lend.** `release` from a linked holder writes the holder token to `<main>/.fgos/documentation-cutover.token` and removes it in `finally` (`documentation-cutover-lease.mjs:133-141`).
  - If the process is killed with SIGKILL before the commit lands, the lease stays held and the main checkout keeps a valid holder token.
  - The main checkout's pre-commit then admits scoped commits. The ref hook still refuses raw moves of main.
  - Any slice-2 gate that reads the token of the checkout running Land would treat main as the holder.
  - L12-108 says "closed for synchronous failures" but does not name this window. The fix is to document it, or have doctor flag a token in main that does not belong to a main-held lease.
- **L-2: corrupt also blocks no-op main transactions.** `git pack-refs --all` (and so `gc`) is refused while the sidecar is corrupt (`p4`). This is consistent with the "refuse every other path" ruling and is repairable now. Nit only.
- **L-3: doctor applicability key.** If this repo's working tree loses `.githooks/reference-transaction` while a lease is held, doctor reports "not applicable" instead of the held lease. A consumer with its own wired reference-transaction hook gets the wording "reference-transaction hook wired". Cosmetic.
- **L-4: acquire rollback after a receipt mismatch.** `onFailure` deletes the token whenever the receipt contract throws, including the theoretical case where the commit landed but the receipt shape is wrong (`:146-149`). The result would be a held lease with no token, recoverable by owner abandon. Theoretical only.

## Lead questions

1. **L-1:** accept the crash window as documented, or add a doctor or acquire check for a stray token in main?
2. **NEW-3:** the token is a same-uid file capability, as shown by the stolen-token forge in `p3`. Is this boundary acceptable for slice 2's `landRunnerItem` gate as well?

Status: DONE
Summary: ok. NEW-1..6 are closed through the production path. The r4 ref hook costs about 2x no-hook on the branch + 5 commits + 5-commit rebase scenario (r3 was about 65x), and all r3 verified behaviours still hold. Four Low notes only; the lend crash window (L-1) is the one worth a Lead decision.
