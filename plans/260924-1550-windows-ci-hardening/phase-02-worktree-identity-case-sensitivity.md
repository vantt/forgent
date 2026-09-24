# Phase 02 — Path case-sensitivity / worktree identity

## Context

`plan.md` § Where things stand; `phase-00-evidence-snapshot.md`'s buckets:
`WorktreeError: refusing to reclaim checkout ... uncommitted changes` (3),
`TrustStoreError: agy trust seed refused ... not itself trusted` (2), and
`retargetMember: refusing to run from ... linked worktree` (N, exact count
not yet isolated from the "strictly equal"/generic buckets — re-derive in
Phase 00's rerun).

### `retargetMember` / `isMainWorktree` — concrete hypothesis, unverified

`src/runner/promote-engine.mjs`'s `retargetMember` refuses to run when
`isMainWorktree(repoRoot)` returns `false` (`src/runner/worktree.mjs:268`).
In the failing tests, `repoRoot` IS the main checkout (a fresh git repo the
test fixture created), so this is a false negative on Windows.

`isMainWorktree`'s core comparison:

```js
const toplevel = realpathOrSelf(gitQuiet(repoRoot, ['rev-parse', '--show-toplevel']).trim());
const commonDirAbs = path.isAbsolute(commonDirRaw) ? commonDirRaw : path.resolve(repoRoot, commonDirRaw);
const commonDirParent = realpathOrSelf(path.dirname(commonDirAbs));
return toplevel === commonDirParent;
```

`realpathOrSelf` (`src/runner/worktree.mjs:173`) is `fs.realpathSync(p)`,
falling back to `path.resolve(p)` (UN-canonicalized) on any throw. Git on
Windows emits `--show-toplevel`/`--git-common-dir` with forward slashes and
a specific drive-letter case; if either `fs.realpathSync` call fails for a
path that hasn't been created yet at call time, or resolves through a
different intermediate representation than the other side, the two sides
land in different casing/separator forms and the strict `===` fails even
though they're the same real directory. This has NOT been reproduced or
confirmed on a real Windows box — it's a plausible read of the code, not a
proven root cause.

### `agy trust seed` — same shape, different call site

`Error [TrustStoreError]: agy trust seed refused for "D:\tmp\wt-5": its repo
root "D:\home\someone\projects\repo" is not itself trusted in
<settings.json path>` — a lookup keyed by repo-root string failing to match
because of the same class of path-shape mismatch. Find the exact lookup in
whatever module raises `TrustStoreError` (search for the error message
substring) before assuming it's the same root cause as `isMainWorktree` —
they may not share code at all, just symptom shape.

### `WorktreeError: refusing to reclaim ... uncommitted changes`

Different failure mode: the test creates worktrees it expects to look clean
(or dirty, per test name — `resync-dirty-not-behind` vs `resync-clean`), and
the reclaim logic's git-status read disagrees with what the fixture set up.
Could be a git-status parsing issue (CRLF?) rather than a path-identity
issue — verify which before assuming it belongs in this phase at all.

## Requirements

1. Read `isMainWorktree`, `realpathOrSelf` (`src/runner/worktree.mjs`) and
   trace exactly what `git rev-parse --show-toplevel` /
   `--git-common-dir` return in Windows CI logs (add temporary debug output
   to a CI run if needed — this cannot be verified on Linux).
2. Find the `TrustStoreError` raise site and read its repo-root comparison
   logic; confirm or rule out the same path-shape hypothesis independently.
3. For `WorktreeError: refusing to reclaim`, read the reclaim logic's git
   status check and the 3 specific failing test names
   (`resync-dirty-not-behind`, `resync-clean`, `reattach-dirty` — full names
   in `test/runner/worktree.test.mjs` or wherever these fixtures live) to
   determine whether this is the same cluster or a separate bug.
4. Fix the confirmed root cause(s). If the fix is "normalize both sides
   through the same canonicalization before comparing," verify it doesn't
   loosen the comparison for two genuinely DIFFERENT directories that
   happen to share a case-insensitive spelling (unlikely on a real
   filesystem, but state the invariant explicitly in a comment).

## Files

- `src/runner/worktree.mjs` (`isMainWorktree`, `realpathOrSelf`).
- Whichever module owns `TrustStoreError` (search, don't guess).
- Whichever module owns the worktree-reclaim git-status check (search).
- `impact()` every changed symbol first — `isMainWorktree` in particular is
  used by more than just `retargetMember` (`sync-root` per its own comment).

## Validation

All three failing clusters pass on a real Windows CI run. Existing
Linux/macOS tests for the same functions stay green (these are cross-platform
functions; don't special-case `win32` unless the fix genuinely IS
platform-specific — path separator/case handling should ideally be correct
on all three OSes through the same code path, not a `win32` branch bolted
onto Linux-only logic like the `ps`/`npm`/`.exe` fixes were for OS-only
binary quirks).

## Risks

Blast radius unknown until `impact()` runs for real (this session's
GitNexus index was 179+ commits stale and returned garbage caller counts for
unrelated queries — re-`gitnexus analyze` before trusting it here, and
cross-check with `grep` regardless).

## Resolution & Findings

- **Root Causes Confirmed**:
  1. `isMainWorktree` & `retargetMember`:
     - `git rev-parse --show-toplevel` on Windows returns forward slashes and long paths (`C:/Users/runneradmin/...`).
     - Standard `fs.realpathSync(repoRoot)` did not expand 8.3 short paths (`C:\Users\RUNNER~1\...`), producing unequal strings and failing `isMainWorktree(repoRoot)` even in the main checkout.
  2. `reattachableCheckout` & `WorktreeError: refusing to reclaim dirty checkout`:
     - `baseDir` was passed as `RUNNER~1` while `registered` from `git worktree list --porcelain` had `runneradmin`.
     - `path.relative` returned `..\..\..\runneradmin\...`, so `relative.startsWith('..')` was true. `reattachableCheckout` returned `null`, falling through to `relocateOrphanedCheckout` which refused uncommitted changes.
  3. `reclaimOrphanedCheckout` live session cwd guard:
     - `resolvedOrphanPath === resolvedCallerCwd` failed due to `RUNNER~1` vs `runneradmin` mismatch, skipping the guard.
  4. `seedAgyTrust` / `readAgyTrust` / `removeAgyTrust`:
     - Calling `path.resolve(repoRoot)` turned POSIX fixture paths (`/home/someone/...`) into Windows drive paths (`D:\home\someone\...`), mismatching `trustedWorkspaces`.
  5. `test/runner/worktree.test.mjs`:
     - Git converted LF to CRLF in staged file test (line 928).
     - `worktreeSetup` tests relied on Bash syntax (`echo one > ...`, `$FGOS_REPO_ROOT`, `; exit 3`) which failed under Windows `cmd.exe`.
- **Fixes Applied**:
  - `src/runner/worktree.mjs`:
    - Updated `realpathOrSelf(p)` to use `fs.realpathSync.native` (which invokes Win32 `GetFinalPathNameByHandleW` to expand short names), strip `\\?\` prefixes, and normalize path separators via `path.normalize`.
    - Added `pathsEqual` and `pathStartsWith` (case-insensitive on `win32`) and updated `isMainWorktree`, repo-root guard, and live session guard.
    - Updated `reattachableCheckout` to pass both `baseDir` and `registered` through `realpathOrSelf`.
    - Updated `createWorktree` and `reclaimOrphanedCheckout` to return `realpathOrSelf` paths.
  - `src/runner/session.mjs`:
    - Updated `realpathOr` with identical native resolution and canonicalization, and used `pathsEqual` in session guards.
  - `src/runner/dispatch/trust-store.mjs`:
    - Added `matchesPath(entry, target)` supporting exact string, normalized, resolved, and `win32` case-insensitive matching.
  - `test/runner/worktree.test.mjs`:
    - Normalized CRLF to LF in staged change assertion.
    - Converted `worktreeSetup` commands to cross-platform `node -e` invocations.
- **Verification**:
  - **CI Verification**: Real Windows CI run `35996854907` confirmed:
    - `test/runner/worktree.test.mjs`: 88/88 passed (100% GREEN)
    - `test/runner/promote-engine.test.mjs`: 9/9 passed (100% GREEN)
    - `test/runner/dispatch-trust-store.test.mjs`: 16/16 passed (100% GREEN)
    - Failures across the test suite dropped by 173 (from 524 down to 351).
    - Merged to `main` via commit `39200c0a`.

