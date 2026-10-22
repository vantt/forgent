# Review: documentation-cutover write lease, slice 1 (379e44239)

Verdict: **rework**

All repros were run in scratch repos under `.../scratchpad/6b1-review/` (scripts `repro.mjs`, `repro2.mjs`, `repro3.mjs`, `acq.mjs`). They copy the reviewed hooks the same way `test/e2e/documentation-cutover-lease-hooks.test.mjs` does, with `FGOS_HOST_BIN` set to the worktree's `target/debug/fgos`. No writes went to the review worktree.

## High

**H1. Gates read the sidecar from the working tree, not `refs/heads/main`, which breaks refinement 3 and makes the freeze forgeable.**
- Where: `documentation-cutover-lease.mjs:80-87`, `:397`, `:436-439`, `:461-467`; `.githooks/reference-transaction:26-41`.
- `leaseAdmission` reads `<cwd>/sidecar`. The pre-commit guard and doctor read `<main checkout>/sidecar` from disk. The ref hook reads `$(pwd)/sidecar` first.
- Repro C2: lease held in the main checkout. A linked worktree on `side` runs `update-ref refs/heads/main side` and is refused (C1). The same worktree then drops an untracked `plans/.../cutover-write-lease.json` containing `{"state":"released"}` and reruns. The update is accepted, and `main:docs/a.md` = `EVIL`. A stale committed sidecar on any older branch works the same way.
- Repro F: the sidecar is untracked until someone commits it. Running `git clean -fd` in the main checkout deletes it, and the next non-holder docs commit passes. This is exactly the hole decision 10 forbids.
- Any non-holder can also just edit the working-tree file. The commit gate only stops committing it, not editing it.
- Fix:
  - Have every gate (Node and sh) read the sidecar blob from `refs/heads/main:<sidecar>`. In Node, use the Git Inspect port (`pathsAtRevision`/`readObjects`). In the hook, use `git cat-file -p refs/heads/main:<path>` from the common dir.
  - Never fall back to cwd.
  - Treat "the ref is missing or unreadable while a sidecar exists in history" as refuse.

**H2. The holder token is visible to every worktree by default, and `--worktree` hides the lease from every gate. Either way the lease is a no-op.**
- Where: `bin/fgos.mjs:3856-3859` (`acquire({ repoRoot: flags.worktree ?? <main checkout> })`), `documentation-cutover-lease.mjs:450` (`?? readTokenFromWorktree(mainRoot)`), `reference-transaction:85-94` (main-root and cwd fallbacks).
- Repro D: the token sits at `<main>/.fgos/documentation-cutover.token`, which is where the default CLI acquire writes it. A commit of `docs/a.md` from an unrelated linked worktree is accepted as "holder" (exit 0).
- Repro `repro2`: `acquire({repoRoot: wt})`, the `--worktree` path. The sidecar and the lock land in the worktree. The main-checkout guard then returns `null` (allowed), and doctor reports "no lease is held" from both main and the worktree. `fgosDir` also becomes `wt/.fgos`, so the kernel lock file differs from the main one and acquire is no longer serialized across the two entry points.
- Fix:
  - Write the sidecar and take the lock at the trusted main location (`gitPortOptions(...).trustedMain` → main `.fgos`).
  - Write the token only into the holder worktree, preferably its per-worktree git dir (`git rev-parse --git-dir`), never into main.
  - Remove the main-root token fallbacks from both gates.

**H3. Paths that are renamed or contain non-ASCII characters escape both the commit and ref gates.**
- Where: `.githooks/pre-commit:505` uses `--name-only` without `-z` and without `--no-renames`. `reference-transaction:79-81` has the same problem.
- Repro (rename): `git mv docs/a.md apps/a.md && git commit` exits 0 with the lease held, and `HEAD` no longer has `docs/a.md`. Rename detection reports only the new name.
- Repro (non-ASCII): `docs/tiếng.md` is reported as `"docs/ti\341\272\277ng.md"` (core.quotePath), so it matches neither `startsWith('docs/')` nor `^docs`. The commit exits 0 with and without `--no-verify`.
- Every other guard in the same hook already uses `-z` (`pre-commit:54,214,351,427`) and `--no-renames` (`:214,351`).
- Fix:
  - Use `git diff --cached --name-only -z --no-renames` with no `--diff-filter`. The filter also drops `T`: repro shows a typechange `docs/a.md` → symlink is missed by pre-commit and caught only by the ref hook.
  - In the hook, use `git diff --name-only -z --no-renames old new` and split on NUL. Using `diff-tree -r -z --no-renames` would be even better.

**H4. Two acquires can both succeed. The sidecar check runs before the lock (TOCTOU).**
- Where: `documentation-cutover-lease.mjs:182-197`.
- Repro `acq.mjs`: two processes acquire concurrently on the same repo. Both returned `acquired` with different tokens in **5 of 12** trials. The first holder's token no longer matches the sidecar, but it believes it holds the lease.
- Design §3.4 says to take the lock first and check preconditions under it.
- Fix: move the "already held" check, and every precondition, inside the `acquired` branch.

**H5. The token is printed. Decision 9 says it never is.**
- Where: `bin/fgos.mjs:3859` (`if (flags.json) return output(res)`, where `res.token` is the raw token). `acquireDocumentationCutoverLease` returns `token` (`:227-232`).
- `fgos docs-lease acquire --json` writes the secret to stdout, which ends up in agent transcripts and logs.
- `release --token <t>` (`:3873`, registry `release.parameters.token`) takes the secret on argv, where `/proc/*/cmdline` and shell history can see it.
- Fix: do not return the token from the library (or strip it in the verb), and remove the `--token` flag.

## Medium

**M1. A corrupt or unreadable sidecar is treated as "no lease" (fail-open).**
- Where: `readSidecar` (`:80-87`) returns `null` on a parse error, and every gate maps `null` to allow.
- Repro E: a sidecar with conflict markers gives `checkLeaseCommitGuard → null` and `leaseAdmission → {allowed:true}`.
- The sh hook greps `"state": "held"` instead, so the two gates disagree.
- Fix: return allow only when the sidecar is absent (ENOENT). If it exists but is unparseable, or has an unknown `state`, refuse.

**M2. The sidecar records evidence nobody checked, and the backstop is missing.**
- Where: `:206-222`.
  - `cleanWorktrees: true` is hardcoded, with no check.
  - `scopeDigests: {}` and `checkedBranches: []` are always empty.
  - `baseCommit`/`branch` come from `<root>/.git/HEAD`. That is `null`/`detached` in a linked worktree, which is the required acquire location (§3.4.1); repro `repro2` confirmed it. It also ignores packed refs.
- Release (`:285-322`) does no digest comparison. Design decision 1 relies on that comparison to catch every hook bypass, for example `git -c core.hooksPath=/dev/null update-ref` (repro: exit 0).
- The brief requires "scope digest set".
- Fix:
  - Compute real scope digests (tree ids at `main`) under the lock.
  - Leave out fields that were not verified rather than writing `true`.
  - Compare at release.
  - Implement the §3.4 preconditions or record them explicitly as slice 2.

**M3. The kernel handle is dropped immediately, so the "live holder" abandon refusal can never trigger.**
- Where: `:233-236` releases the handle at the end of acquire. `release`/`abandon` take no lock, so transitions are not serialized.
- `probe === 'held'` is true only for the milliseconds acquire is running. In practice `abandon --owner-confirmed --reason x` (or the undocumented `force`, `:357`, `bin:3880`) succeeds against a live holder. Repro: `abandon({force:true, reason:'x'})` → `abandoned`.
- The unit test "abandon refused while kernel lock held" holds the lock artificially, so it proves a state production never reaches.
- Fix (Lead decision): either keep the handle for the holder session (that was the rank-10 rationale, "keep the handle across Land") or remove the live-holder claim. In both cases:
  - take the lock in release and abandon;
  - drop the `force` alias;
  - record holder hash and age in the abandon record (§3.7).

**M4. The token file is not git-ignored.**
- `DEFAULT_TOKEN_FILE = '.fgos/documentation-cutover.token'`. `git check-ignore` matches only the fallback `.fgos/locks/...` (`.gitignore:42`).
- A `git add -A`/`git add .fgos` in the main checkout commits the plaintext token. No pre-commit guard refuses this on main.
- Fix: use a per-worktree git-dir path (see H2), or at least an ignored path.

**M5. One-door violation: git resolution is reimplemented by reading `.git` directly.**
- Where: `resolveMainCheckoutRoot` (`:99-122`), `resolveHeadCommit`, `resolveCurrentBranch` (`:125-151`).
- `src/runner/paths.mjs` already exports `resolveMainCheckoutRoot` through the Git Inspect port, and `bin/fgos.mjs:68` imports it. The module shadows it with a weaker copy that does not handle `--separate-git-dir`, packed refs, reftable, or a main path containing `/worktrees/`.
- L12-104 "Decision 1" justifies this as avoiding the one-door scan. That is the case design principle 2 forbids ("import the shared leaf module it names; never copy the code").
- Fix: use `paths.mjs`/Git Inspect. `.githooks/pre-commit` can keep `repoRoot = path.resolve(__dirname,'..')` as it already does.

**M6. Pre-commit guard fails open and has no fast path.**
- Where: `pre-commit:503-511`. `catch {}` sets staged = [], so a failing `git diff` allows the commit.
- The `git diff` spawn also runs on every commit before anyone checks whether a lease is held.
- Fix: read the main-ref sidecar first and return when there is no lease. Refuse when the diff fails while a lease is held.

**M7. The doctor row misses refinement (d)/table row 10, and its semantics follow H1/H2.**
- It does not check that `reference-transaction` is wired.
- In the `--worktree` mode it reports pass while a lease is held (repro `repro2`).
- In the correct design, where the token lives in the holder worktree, it will always say "token missing or mismatched" from main.
- The new row also breaks `test/setup/checks.test.mjs` "DOCTOR_CHECKS has exactly the registered…" (verified fail). The Doer recorded this but left it red. It is a third known red, next to the two drift failures.

## Low

- **L1.** Plan ids and phase labels in product code:
  - module header and comments (`:2`, "Phase 8, Step 6b"), and the hook header (`:2-3`);
  - `DEFAULT_SIDECAR_PATH`, `PLAN_BRANCH_REF`, and the plan-path literals in `isScopedPath:49` and the hook regex/refs.
- **L2.** Dead exports: `PLAN_BRANCH_REF`, `TARGET_BRANCH_REF`, `ZERO_OID`, `EMPTY_TREE_SHA`. The scope list lives in three places that can drift (`LEASE_SCOPE_PATTERNS`, the `isScopedPath` branches, the hook regex). `LEASE_SCOPE_PATTERNS` is not used by the matcher.
- **L3.** The census regeneration pulls in unrelated plan-branch drift: about 200 lines of new `scripts/check-doc-inventory-gates.mjs`, `generate-doc-inventory.mjs`, `verify-phase-0x.mjs` sites that are not in this change. This makes the census blessing of those spawn sites invisible inside a lease commit, and it will conflict with main's census (last touched in 96dd8fb29). Regenerate it in a separate commit, or say so explicitly.
- **L4.** The committed sidecar records an absolute local `worktree` path. The holder test treats any file containing the hash string as a match (`grep -q "$TOKEN_HASH"`). Acceptable.
- **L5.** The ref hook's plan-branch non-fast-forward/delete refusal applies to the holder too. Its refusal text does not say that typed-door deletes run hooks-off; refinement 3 notes this is why main is the authority.

## Test gaps

- No linked-worktree test, even though the brief requires one. Every hook test puts sidecar and token in the same checkout, which hides H1 and H2. `held sidecar with lock gone` passes an absolute `sidecarPath` to `leaseAdmission`, which also masks H1.
- No bypass tests:
  - rename out of scope;
  - non-ASCII path;
  - typechange;
  - forged or stale sidecar in a worktree;
  - `git clean -fd`;
  - a corrupt sidecar;
  - `rebase`, `am`, `pull`, `cherry-pick`.
- No concurrency test: a two-process acquire would have caught H4 at about 40%.
- No CLI wiring proof that `acquire --json` output contains no token.
- No holder-death or multiprocess continuity test (holder process exits, a new holder process presents the token).
- "Abandon refused while held" proves a state production never enters (M3).
- No test reads the sidecar from `refs/heads/main`.

## Questions for the Lead

1. With the token in the holder worktree, a holder that lands by ff-merge from the main checkout is refused by the ref hook, because it looks for the token in the main cwd. Is landing the held/released sidecar onto main meant to go only through Land (hooks-off) plus the slice-2 merge gate?
2. Should the kernel handle live for the whole holder session (M3), or should the "live holder" abandon refusal be dropped from the contract?
3. Should the `DOCTOR_CHECKS` inventory edit (`test/setup/checks.test.mjs`) be authorized in this rework, so the slice is not merged red?

Status: DONE
Summary: Rework. Five High defects, all reproduced: forgeable or deletable working-tree sidecar instead of main ref; token readable by every worktree, or the lease invisible with `--worktree`; rename and non-ASCII bypass of both hooks; 5 of 12 concurrent double-acquires; token printed by `acquire --json`. Plus fail-open on a corrupt sidecar, fabricated precondition evidence, and a one-door git reimplementation.
