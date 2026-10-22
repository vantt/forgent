# Re-review round 3: documentation-cutover write lease (6aa3d5c19..8b20f5185)

Verdict: **rework**

The lease now does what Ruling 1 asked. Production `acquire`, `release` and `abandon` each make one ScopedCommit under main-50. Both hooks refuse every raw movement of main that I tried. Two reproduced defects block acceptance:

- **NEW-1 (High).** The new Node reference-transaction hook adds about 30x latency to every git ref operation in every worktree, with or without a lease.
- **NEW-2 (Medium).** The doctor row is still red in consumer projects that have their own `.githooks/`.

All reproductions ran in scratch repos under `scratchpad/6b1-r3/`:

- `common.sh`, `p2.sh` and `forge.mjs` are the probe scripts. `dig.mjs` and `p6/doc.mjs` call the module directly.
- Each fixture's hooks are copies of the worktree hooks, wrapped by a logger that records the phase, `FGOS_LOCK_FD`, stdin and the exit code.
- The CLI is the worktree's `bin/fgos.mjs`, run with the already-staged dev host from `.fgos/runtime/git-addon/` (no new staging).
- Nothing was written to the worktree.

## Main risk: does the reference-transaction hook see the main-50 borrow?

**Yes.** Evidence from `p1/hook.log`, captured during CLI `acquire` from a linked holder worktree:

- pre-commit and every reference-transaction phase ran with `lockfd=main-checkout:3`.
- `prepared` received `<old> <new> refs/heads/main` and exited with `rc=0`.
- Main gained exactly one commit, `chore(docs): acquired documentation cutover lease`, touching only `plans/documentation-cutover-lease.json`.

The sidecar is in scope, so the hook admitted this update only through `legalTransition`, which includes the borrower test. The same transition committed raw without the borrow is refused (`p2` D).

## Prior findings

| Finding | Status | Evidence |
|---|---|---|
| H1 / N8, sidecar not on main | **Closed** (residue: NEW-5) | CLI acquire, release and abandon each add one sidecar-only commit on main (`p1`, `p4`). After acquire, every non-holder attempt was aborted in `prepared` and main stayed unchanged (`p2`): `update-ref` with and without an old value; `--no-verify` multi-path `apps`+`docs`; `git mv docs→apps`; non-ASCII scoped path plus an out-of-scope path; a forged held→released without the borrow; deleting main; resetting main to `main~1`. The same held outcome holds for a symref alias, `branch -f` through a symref, and `update-ref --stdin` (`p8`). `git clean -fdX` does not reopen the lease: status stays `held`. |
| H2 / N4, token location | **Closed** | `acquire` run from `holder/docs` writes the token to `holder/.fgos/…`. `release` from `holder/docs` succeeds. A non-holder `release` returns `caller is not the lease holder` (`p4`). |
| H3 / N2, NUL / rename / non-ASCII | **Closed** | See H1. The hook is now Node and splits on `-z` itself. |
| H4, double acquire | **Closed** | 3/3 concurrent CLI acquires had exactly one winner. Main gained one commit and the checkout stayed clean (`p9`). |
| H5, token printed | **Closed** | The `acquire --json` output does not contain the token (grep count 0). |
| M1 / N5 / N7, corrupt sidecar | **Closed** (caveat: NEW-4) | Main carries `{"state":"HELD"}`. `acquire` and `abandon` refuse it, `status` reports `corrupt/held`, the hooks refuse, and the hook and Node gates share one parser (`p7`). |
| M2 / N3 / N6, digests and drift | **Closed** (caveat: NEW-3) | Digests on a clone of this repo at 8b20f5185 cover all 7 roots and match `ls-tree`. `docs` has 6,219 entries (`dig.mjs`). After a `-c core.hooksPath=/dev/null` docs commit, the holder `release` succeeds with `drift: ["docs"]` and commits it (`p4`). |
| M3, abandon | **Closed** | Abandon is refused without `--owner-confirmed` and refused with a blank reason. A non-holder abandon with both commits `abandoned` (`p4`). |
| M4, token ignore | **Closed** | The `.fgos/*.token` rule is at `.gitignore:42`, and the token always sits at the checkout root. |
| M5, duplicate resolver | **Closed** | The only `resolveMainCheckoutRoot` is at `paths.mjs:74`. The module has no raw git writes. |
| M6 / N9, fast path | **pre-commit closed; reference-transaction regressed** | See NEW-1. |
| M7 / N1, doctor | **Partly open** | See NEW-2. Plain repos and non-git directories now return not-applicable. |
| L1 / L2, labels and scope list | **Closed** | No Ruling/Finding/plan-id labels remain in code or test titles. There is one scope export. `SWITCHBOARD_PATH` (`lease.mjs:16`) is the accepted exception. |
| L3, census | Accepted | Same disclosure as before: 54 inherited sites. The hook and helper digests are recorded. |

## Rulings in L12-106

| # | Status |
|---|---|
| 1. ScopedCommit write path | Met (order at `lease.mjs:105-143`). `base-moved` comes from the e2e shim test and was not re-raced by me. |
| 2. Shared transition helper | Met as written. The borrower test proves main-50 is held, not that the lease module is the writer (NEW-3). |
| 3. Digests and drift | Met. |
| 4. Owner abandon | Met, and documented. |
| 5. Doctor not applicable | **Not met** for projects that have their own `.githooks/` (NEW-2). |
| 6. Mediums | Met. |
| 7. Production-path tests | Met. My repros agree with the mapped tests. |

## New findings

### NEW-1 (High): the reference-transaction hook costs about 30x on every ref operation, with or without a lease

- **Where.** `.githooks/reference-transaction:3-7`.
  - The static imports (holder-lock, Git Inspect, ScopedCommit, setup) load before the `argv[2] === 'prepared'` check.
  - Git calls the hook in the `preparing`, `prepared` and `committed`/`aborted` phases of every transaction, for every ref: `HEAD`, `ORIG_HEAD`, `AUTO_MERGE`, `REBASE_HEAD`, branches.
  - The old sh hook exited at once outside `prepared` and for refs other than main.
- **Repro** (`p5`, no lease, out-of-scope files only): `checkout -b`, then 5 commits, then a 5-commit `--force-rebase`.
  - No hook: 0.10 s.
  - Old sh hook: 0.65 s.
  - New hook: **21.5 s** for 166 hook invocations at about 120-180 ms each (bare `node -e 0` is 60 ms). Measured at load average 19, so absolute times are inflated; the ratio is the point.
- **Impact.**
  - This repo sets `core.hooksPath` to an absolute path (`/home/vantt/projects/forgentX/.githooks`). Every one of the 24 worktrees therefore pays this cost on each branch, commit, rebase, worktree add, ScopedCommit or Land.
  - Any import failure in the main checkout's `src/`, such as a mid-edit syntax error, aborts every ref update in every worktree, not only updates to main.
- **Fix.** Restore an sh fast path that execs Node only when it is needed:

  ```sh
  #!/bin/sh
  [ "$1" = prepared ] || exit 0
  IN=$(cat)
  printf '%s\n' "$IN" | grep -q ' refs/heads/main$' || exit 0
  printf '%s\n' "$IN" | exec node "$(dirname "$0")/reference-transaction.mjs" prepared
  ```

  Ref lines are text, so `$(cat)` is safe here, unlike paths. The NUL-sensitive work stays in Node.
  - Add one timing or invocation-count proof: no Node spawn for a non-main or non-prepared transaction.

### NEW-2 (Medium): the doctor row is red in consumer projects that have their own `.githooks/`

- **Where.** `src/runner/documentation-cutover-lease.mjs:220-223`.
  - Not-applicable is decided only by "`.githooks/` is absent".
  - A project with its own `.githooks/pre-commit` and `core.hooksPath=.githooks` therefore reaches the wiring check and fails because `.githooks/reference-transaction` does not exist.
- **Repro** (`p6/doc.mjs`). The consumer repo returns `{"passed":false,"message":"documentation-cutover reference-transaction hook is not wired"}`, while the sibling `main-checkout-hook-wired` row is green for the same repo.
- **Impact.** Mission #1: `fgos doctor` is red in such projects. Ruling 5 says "not applicable when … does not use this repo's hooks".
- **Fix.** Return not-applicable unless `<main>/.githooks/reference-transaction` exists, or unless a lease-scope marker such as a committed sidecar exists. Only after that check the wiring. Add the consumer shape to the doctor not-applicable test.

### NEW-3 (Medium; Lead decision): the borrower test is not holder proof, and the hooks do not check `drift[]` or `releaseScopeDigests`

- **Where.** `src/runner/documentation-cutover-lease-hook.mjs:38-45`. Only the state edge, the hash and the borrow are checked.
- **Repro** (`p3/forge.mjs`). A non-holder script:
  1. takes `main-checkout` through `acquireSync`;
  2. edits the sidecar to `state: released`, `drift: []`, `releaseScopeDigests: scopeDigests`;
  3. commits it through `runBorrowed(git commit)`.

  Result: exit 0. Main records a "released" lease with no abandon reason and forged evidence of no drift, and a following non-holder docs commit lands (`EVIL`).
- **Why it matters.**
  - Owner abandon is open by design (Ruling 4). This path, however, produces a *release* record that cannot be told apart from a holder release, with no reason.
  - The drift evidence that slice 2 is meant to rely on is whatever the writer chose to write.
  - A `hooksPath=/dev/null` writer can forge anything anyway. The borrower path is a cheaper, hook-sanctioned way to do it.
- **Fix options (Lead).**
  - (a) In `legalTransition`, recompute the 7 root OIDs at `old_oid` (one `rev-parse <oid>:<root>` per root). Require `releaseScopeDigests` to equal them and `drift` to equal the keys that differ from `scopeDigests`. Require `abandon.reason` when the state is `abandoned`. This adds about 7 git calls, only on a sidecar transition.
  - (b) Accept the gap and record that slice-2 consumers must recompute drift from `baseCommit` and never trust the sidecar's `drift[]`.

### NEW-4 (Low; Lead decision): a corrupt sidecar blocks every commit in the repository, and no door can repair it

- **Where.** Hook helper `:50` and `:71`; lease module `:122`.
- **Repro** (`p7`). A corrupt sidecar on main:
  - refuses an out-of-scope commit on an unrelated branch in another worktree (`corrupt lease sidecar`, rc=1);
  - refuses every update to main;
  - makes `acquire` and `abandon` both refuse.

  The only way out is a raw `hooksPath=/dev/null` commit.
- **Assessment.** This is stricter than "corrupt = held": a held lease still admits out-of-scope commits. It follows Ruling 2's "fail closed on parse failure" literally.
- **Options.**
  - Let `abandon --owner-confirmed --reason` overwrite a corrupt sidecar. The hook would then also need to admit corrupt→abandoned for a borrower.
  - Or treat corrupt as held for scope-only refusal in pre-commit.

### NEW-5 (Low): a failed transition leaves residue

- **Where.** `lease.mjs:124` and `:157-159`. The token and the sidecar are both written before `port.commit`, and neither is rolled back.
- **Repro.** The first `p1` attempt refused with `git-fence-missing`. Afterwards the main checkout had an untracked `plans/documentation-cutover-lease.json` with `"state": "held"`, and the holder had a token file. The base-moved case follows the same path.
- **Impact.** Authority is unaffected because the gates read main. But the main checkout is left dirty with a misleading held file, and a later `git add -A` commit there is refused.
- **Fix.** On a failed commit, restore or remove the sidecar file and delete the token, or write the token in `afterCommit`.

### NEW-6 (Low): `git clean -fdX` in the holder worktree deletes the token

- **Repro.** `p2` H: after the clean, the holder's own `docs` commit is refused with `non-holder`.
- **Recovery.** Only owner abandon.
- **Fix.** Document this in the CLI help or the lease doc. No code change is needed.

### Low nits

- `computeScopeDigests` pages through the whole subtree of each root only to find the root's own entry. That is 1.9 s on this repo, and it runs twice per lease cycle. A single `pathsAtRevision` or `resolveCommit` of `<oid>:<root>` per root would do.
- `isScopedPath`: `name === sidecarPath ||` is redundant, because the sidecar is already in `LEASE_SCOPE_PATTERNS`.

## Lead questions

1. **NEW-3:** should the hook verify `releaseScopeDigests` and `drift` and require an abandon reason (option a), or should slice 2 be required to recompute drift and never trust the sidecar (option b)?
2. **NEW-4:** should a corrupt sidecar be repairable through owner `abandon`? Today a corrupt sidecar is a repo-wide outage with no fgOS door.
3. **Holder landings:** Ruling 3 refuses raw movement of main into scope even for the holder. The probes confirm that the holder cannot land docs on main through any hooked path. Which door do the holder's cutover landings use (later slice)? If it is Land with hooks suppressed, that bypass is available to any process, not only the holder.

Status: DONE
Summary: Rework. Every r1/r2 finding is closed except doctor (NEW-2). The reference-transaction hook was verified to see the main-50 borrow from a real ScopedCommit, and all raw main movements are refused. The new Node reference-transaction hook spawns Node in every phase for every ref, costing about 30x on ordinary git operations across all worktrees (NEW-1, High). Lead decisions are needed on borrower-forged release evidence (NEW-3) and the corrupt-sidecar outage (NEW-4).
