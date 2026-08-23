# Research: tsk-4yv — finishWorktreeSetup failure leaks a registered worktree

## Round 1 — 2026-08-14 (discovery/implementation)

**Asked:** Does the current code still match Finding 7's description
(`finishWorktreeSetup` runs after the try/catch that cleans up the mkdtemp
dir, at both `createWorktree` and `createDetachedMergeWorktree`, so its own
failure leaks a registered worktree)? What is a reliable, real,
deterministic way to force `finishWorktreeSetup` to fail for a test, given
`provisionDependencies` runs a real `npm ci`/`npm install`?

**Checked:**
- `src/runner/worktree.mjs:472-519` (`createWorktree`), `:1021-1049`
  (`createDetachedMergeWorktree`), `:415-445` (`finishWorktreeSetup`) — read
  directly (line numbers reflect this file's state after tsk-1mn's own
  `beforeProvision` fix, already merged onto this item's branch). Confirmed:
  `finishWorktreeSetup` runs OUTSIDE any try/catch in both functions, after
  `git worktree add`/`--detach` has already succeeded and registered the
  checkout with git.
- `src/runner/worktree.mjs:1007-1015` (`withMergeEphemeralWorktree`) — read
  directly: `const worktree = createDetachedMergeWorktree(repoRoot, id);`
  runs BEFORE its own `try { ... } finally { removeWorktree(...) }` —
  confirmed a throw from `createDetachedMergeWorktree` (including one
  originating in `finishWorktreeSetup`) never reaches that `finally`.
- `src/runner/worktree.mjs:1121-1136` (`removeWorktree`) — read directly:
  wraps `git worktree remove [--force]` + `git worktree prune`, the correct
  way to unregister an already-`git worktree add`-ed checkout (a bare
  `fs.rmSync` would leave git's own `.git/worktrees/<name>/` bookkeeping
  dangling — confirmed by reading this function, not assumed).
- **Empirical check, not assumed:** tried forcing `provisionDependencies` to
  fail via an absolute `file:` dependency pointing at a nonexistent path (the
  same shape used elsewhere in this file's own test fixtures for a WORKING
  local dependency) — ran a real `npm install` against it in a scratch temp
  dir. Result: **npm succeeds anyway** ("added 1 package", exit 0) — this
  npm version does not validate a `file:` target's existence at install
  time. This is a genuinely new finding: a nonexistent `file:` dependency is
  NOT a reliable failure trigger for `provisionDependencies`, contrary to
  what the finding's own failure-scenario language ("an npm registry flake")
  might suggest as the natural test shape. Switched to a malformed
  `package.json` (`'{not valid json'`) instead — `provisionDependencies`'s
  own `JSON.parse(fs.readFileSync(...))` call throws a real `SyntaxError`,
  fully deterministic and offline, no npm process behavior to depend on.

**Found:** Finding 7 is accurate and current at both call sites. The
suggested direction ("wrap `finishWorktreeSetup` at both sites so its
failure force-removes the just-created worktree before rethrowing") is
directly correct. `withMergeEphemeralWorktree`'s own ordering issue (calling
`createDetachedMergeWorktree` before its own try/finally) does NOT need a
separate fix once `createDetachedMergeWorktree` cleans up after itself
internally — the outer function's `finally` never needing to run for this
specific failure is now moot, closing the finding's second half as a
consequence of the first, not a third change.

**Decided:** wrap the `finishWorktreeSetup` call at both sites in a
try/catch that calls `removeWorktree(repoRoot, worktreePath, {force:
true})` (best-effort, swallowed on its own failure — matching this
function's existing cleanup-attempt pattern elsewhere) before rethrowing
the ORIGINAL error unchanged (never a re-wrapped one — "rethrowing" per the
suggested direction's own wording).

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```
(existing suites covering both touched functions and the wrapper that calls
one of them; two new cases added, each forcing a REAL `finishWorktreeSetup`
failure via a malformed `package.json` and asserting the worktree is fully
unregistered — never left dangling on disk or in git's own bookkeeping —
after the throw.)
