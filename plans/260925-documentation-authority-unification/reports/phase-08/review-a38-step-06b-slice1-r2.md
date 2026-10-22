# Re-review: documentation-cutover write lease rework (379e44239..6aa3d5c19)

Verdict: **rework**

All repros ran in scratch repos under `scratchpad/6b1-rereview/` (`common.sh`, `probe1-4.mjs`, `hk/`). They import the reviewed module and hook straight from the worktree, read-only. `hk/` holds a copy of the reviewed `reference-transaction`, with `hk/src` symlinked to the worktree's `src/` so that the hook's Node helper resolves the real module. Nothing was written to the worktree.

## Headline

1. The production `acquire` never puts the sidecar on main, so the lease does nothing.
2. The ref hook's `-z` fix is undone by shell command substitution, which strips the NUL separators.
3. The release-time digest backstop does not work on any real-size repository.
4. The new doctor row is red in every project that uses fgOS.

## Prior findings

| # | Status | Evidence |
|---|---|---|
| H1 forgeable working-tree sidecar | **Open (worse)** | Gates now read main through Inspect or `cat-file`, which is correct. But `acquireDocumentationCutoverLease` only writes the sidecar to the main checkout's working tree (`:278`) and calls an optional `options.commitSidecar`. `bin/fgos.mjs:3859` passes none. Only the tests inject a raw-git committer (`commitSidecarFixture`, test `:51-57`). Repro `probe3 acquire`: `acquired`, then `status` → `free`, `leaseAdmission` → `{allowed:true}`, a non-holder docs commit and `update-ref main side` are accepted (`main:docs/a.md=EVIL`), and `release` → `lease-not-held`. After `git clean -fdq plans`, a second `acquire` also succeeds with a different hash. Ruling 1 required a typed door (ScopedCommit/Land) or "stop and report". Neither happened, and L12-105 §1.1 claims it was closed. |
| H2 token location / `--worktree` | Mostly closed | The lock always goes to the main `.fgos/`. The token goes to the holder `.fgos/`, and no fallback to main remains. New defect: N4 (cwd is not resolved to the toplevel). |
| H3 rename / non-ASCII / typechange | **Pre-commit closed, ref hook open** | Ref hook: see N2. |
| H4 concurrent double acquire | Closed for the lock only | The check now runs under the kernel lock. But "already held" in production is decided only by the working-tree file (`:237-238`), because main never gets the sidecar. The 20-trial race test passes no `commitSidecar`, so it proves the working-tree read, which Ruling 1 says is never trusted. |
| H5 token printed | Closed | `acquire --json` strips the token, `--token` is gone, and release/abandon read the token file. |
| M1 corrupt = allow | Partly | Node gates refuse. Open: `acquire` over a corrupt sidecar succeeds (N5). The sh hook still decides by grepping `"held"`: `{"state":"HELD"}` on main → Node says corrupt/refuse, the sh hook accepts an EVIL `update-ref` (repro r4). |
| M2 fabricated evidence / no backstop | **Open** | `cleanWorktrees` was removed. But the digests are always `{}` in this repo (N3), so release compares nothing. When digests do exist, release refuses the holder's own legitimate landings (N6). |
| M3 abandon / kernel handle | Closed | Abandon runs under the lock, needs the owner flag and a reason, has no `force`, and records hash and age. |
| M4 token not ignored | Partly | `.fgos/*.token` is anchored at the root. See N4. |
| M5 git reimplementation | Partly | No `.git` reads and no raw git remain in the module. But it exports its own `resolveMainCheckoutRoot` (`:101-110`), which duplicates `src/runner/paths.mjs:74` and differs from it: no realpath, and it falls back to cwd instead of returning null. Ruling 9 said reuse. |
| M6 pre-commit fail-open / no fast path | Closed | One `cat-file`, then a `-z --no-renames` diff. A failed diff refuses. Low: after the first release the sidecar stays on main, so every later commit pays the diff and the native port load (N9). |
| M7 doctor | **Open (regressed)** | See N1. |
| L1 plan ids / labels | **Open** | The plan path `plans/260925-documentation-authority-unification/transitional-switchboard.json` appears at `:26`, `:51` and `:143`. "Ruling N / Finding Hn" labels appear at `:283` and `:393`, in `reference-transaction:32,66,78,108`, and in 22 test titles and comments. Ruling 9 and the stable-artifact rule forbid both. |
| L2 dead or duplicated scope list | **Open** | Three copies remain: `LEASE_SCOPE_PATTERNS` (not used by the matcher), the `isScopedPath` branches, and `computeScopeDigests` `targetNames`. Ruling 6 says "no third copy". |
| L3 census | Accepted | Only the hook entries changed. The plan-script drift is explained in L12-105 §11. |
| L4, L5 | n/a | The plan-branch guard was removed under Ruling 1/3. |

## Rulings

| Ruling | Status |
|---|---|
| 1 | Not met: read side yes, write side no (H1). |
| 2 | Mostly met; N4 open. |
| 3 | Met for raw refs. But see Q1 (abandon/release cannot land through the hook). |
| 4 | Met. |
| 5 | Partly met: the sh hook is not fail-closed on a non-JSON or unknown state, and acquire is not fail-closed on corrupt (N5). |
| 6 | Not met: N2 for the ref hook, and L2 for the three scope lists. |
| 7 | Met for the lock only (H4). |
| 8 | Not met (N3, N6). |
| 9 | Not met (L1, M5). |
| 10 | Regressed (N1). |
| 11 | Met. |
| 12 | Met. |

## New findings

**N1 (High). The doctor row fails in every project without this repo's `.githooks/`, and in non-git directories.**
- Where: `documentation-cutover-lease.mjs:604-624`, registered unconditionally at `registrations.mjs:2176`.
- Repro `probe4`: a plain git repo and a plain directory both return `{passed:false, "reference-transaction hook is not wired"}`.
- The sibling row `checkMainCheckoutHookWired` (`registrations.mjs:1183`) returns "not applicable" when `.githooks/` is absent.
- Impact: `fgos doctor` turns red for every consumer project (mission #1).
- Fix: return the same not-applicable pass when `<main>/.githooks` is absent. Also check `refs/heads/main` before claiming the hook is required.

**N2 (High). The ref hook loses the NUL separators, so a multi-path change bypasses it.**
- Where: `reference-transaction:68-70`. `DIFF_OUT=$(git diff-tree -z …)`, and `printf "%s" "$DIFF_OUT"` (`:81`).
- POSIX sh command substitution drops NUL bytes, so the paths reach Node concatenated into one string. Trace: `DIFF_OUT=apps/z.txtcore/skills/x/SKILL.mddocs/a.md` → `TOUCHES_SCOPE=` (empty).
- Repro r9, `git commit --no-verify` on main with the lease held:
  - docs only → refused;
  - `apps/z.txt` + `docs/a.md` → **ACCEPTED** (`main:docs/a.md=EVIL`);
  - `.gitignore` + docs → **ACCEPTED**;
  - `git mv docs/a.md apps/a.md` → **ACCEPTED** (the docs file is gone from main).
- Also, `git update-ref refs/heads/main X` without an old value reports `old_oid=0…0`. The hook then diffs from the empty tree, and the result depends on which path sorts first.
- The tests only cover single-path ref-hook cases (e2e `:331-347`).
- Fix: pipe directly, never through a variable: `git diff-tree … | node …`. Check the pipeline status for fail-closed: `set -o pipefail` is not POSIX, so write the diff to a temp file or do the whole check in Node. Add a two-path `--no-verify` test (out-of-scope path sorted first, plus a scoped path).

**N3 (High). Scope digests are always empty on this repository.**
- Where: `computeScopeDigests:137` calls `listTree({prefix:'', maxEntries:256})` and ignores `complete:false`/`nextCursor`.
- Repro `probe2`: on a repo with 300 entries the call returns `complete:false`, 256 entries, and the digests come back `{}`. This repo's main has 12,163 tree entries. An empty digest map also comes from the `catch {}`.
- Release then iterates over `{}` and never reports drift, so the "release-time backstop for `--no-verify`/`hooksPath=/dev/null`" required by Ruling 8 is a no-op in production. The unit test passes only because its fixture is tiny.
- Fix: resolve each scope root directly, for example `pathsAtRevision`/`resolveCommit` of `<main>:docs`, or a paged or prefix-scoped `listTree` per root. Fail closed when a digest cannot be computed. Derive the roots from the single scope list.

**N4 (Medium). The token location follows the raw cwd, not the worktree toplevel.**
- Where: `bin/fgos.mjs:3858` (`holderWorktree = … : cwd`), `:3877`, `:3884`; module `:222`, `:360`.
- Repro `probe3 r5/docs acquire`: the token is written to `docs/.fgos/documentation-cutover.token`, which is inside the frozen scope. `git check-ignore` does not match it, because `.fgos/*.token` is root-anchored. `git status` lists it, so `git add -A` would commit the plaintext token.
- The hooks look at the toplevel, so this holder is never recognised. Release from a subdirectory reports `not-holder`.
- `--worktree` is not validated as a worktree of this repository.
- Fix: resolve the toplevel through Inspect (`resolveRepo`) and refuse a `--worktree` outside the repository's worktree list. The ignore rule can then stay root-anchored.

**N5 (Medium). Acquire overwrites a corrupt sidecar.**
- Where: `:238` checks only `status === 'held'`.
- Repro r6: `{"state":"HELD"}` on main → `status` reports corrupt/held and `admit` refuses, but `acquire` → `acquired`.
- This violates Ruling 5 ("corrupt = held").
- Fix: refuse on `corrupt` too, and drop the `existingDisk` working-tree read.

**N6 (Medium; needs a Lead decision). Release refuses whenever the digests changed.**
- Where: `:403-407` throws `scope-drift`.
- During a lease the holder lands cutover edits through Land (Ruling 3), which changes the digests. Release is then always refused, and the only exit is owner abandon.
- Ruling 8 says "reports drift (no auto-fix)", which is not the same as refusing.
- The current behaviour is masked only by N3.
- Fix: release succeeds, records `drift[]` in the released sidecar and in the result, and the slice-2 merge gate decides whether that drift was a holder landing.

**N7 (Medium). The sh hook and the Node gates disagree on sidecar validity.**
- The sh hook treats anything without the `"state": "held"` text as free: non-JSON, `HELD`, a truncated file. The Node gates refuse the same input.
- Repro r4 is in the M1 row.
- Fix: parse the sidecar in the same Node helper the hook already spawns (one parser) and refuse on parse failure or an unknown state.

**N8 (Low). Sidecar written into the main checkout's working tree.**
- Every acquire, release and abandon writes `plans/documentation-cutover-lease.json` into the main checkout's working tree (`:278`, `:414`, `:493`), whatever branch that checkout is on, and leaves it dirty.
- With the committer missing, that file is now the only lease "authority". Once a typed commit exists, it should write nothing there.

**N9 (Low). The pre-commit fast path is lost after the first lease.**
- Fast path: after the first lease cycle the sidecar stays on main (`released`/`abandoned`), so the "no sidecar" fast path never applies again. Every commit spawns `git diff` and loads the native addon (`checkLeaseCommitGuard` → `resolveMainCheckoutRoot`, which is unneeded when `rawSidecarBlob` is given).
- Fix: also parse `state` cheaply in the hook before the diff, and skip `resolveMainCheckoutRoot` when the blob is given.

## Questions for the Lead

1. **How do release and abandon reach main?**
   - The ref hook refuses a sidecar-only change to main from any cwd without the holder token. Owner abandon, and a release run from the main checkout, therefore cannot land through hooks.
   - Is the intended path a ScopedCommit/Land with hooks off, as Ruling 3 says for holder landings?
   - If so, the module needs that typed write. It does not exist yet (`src/git/scoped-commit.mjs` / `land.mjs` were not used). Under the Ruling 1 "stop and report" clause, this slice should have stopped. Do you want it built here or escalated?
2. **What compare-and-swap does the typed commit need?** It must commit only if main still equals the `baseCommit` read under the kernel lock. Otherwise a concurrent main move between the digest read and the commit makes the evidence stale. Should a failed compare-and-swap refuse acquire, or retry under the lock?
3. **Drift at release (N6):** should release report drift or refuse on it?
4. **The switchboard JSON in scope:** is the plan-path literal in the scope list an accepted exception to Ruling 9, or should it move to configuration?

Status: DONE
Summary: Rework. H5, M3 and M6 are closed, but production `acquire` never commits the sidecar to main, so the lease is a no-op (repro: non-holder EVIL update accepted after `fgos docs-lease acquire`). The ref hook's `-z` fix is defeated by shell NUL-stripping (multi-path and rename `--no-verify` bypasses reproduced). Scope digests are always `{}` on a real-size tree, and the new doctor row is red in every consumer project.
