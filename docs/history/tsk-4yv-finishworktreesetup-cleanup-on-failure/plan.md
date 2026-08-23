# plan: tsk-4yv — finishWorktreeSetup failure force-removes the just-registered worktree

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior —
`test/runner/worktree.test.mjs`/`merge.test.mjs`/`worktree-callsite-
wrapper.test.mjs` all carry extensive real suites for the exact functions
touched). No hard-gate flag — item's own `tier`/`risk` (`standard`/
`standard`, severity "low" per the report) confirm standard lane, on the
lighter end of it.

Direct-entry fallback: entered `planning` straight from a `clear` discovery
verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md` round 1
stands in for it.

## Impact-analysis posture

Same as every sibling item this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on for this item: `removeWorktree`'s
own correctness (the right primitive to unregister an already-`git worktree
add`-ed checkout, vs. a bare `fs.rmSync`) was confirmed by direct read, and
the fix's safety was verified empirically (full existing suites rerun
unchanged, two new tests proving the real failure-and-cleanup path).

## Approach

**The report's suggested direction is directly correct.** Two call sites in
`src/runner/worktree.mjs`, each wrapping its own `finishWorktreeSetup` call:

```js
try {
  finishWorktreeSetup(worktreePath, branch, /* opts, where applicable */);
} catch (err) {
  try {
    removeWorktree(repoRoot, worktreePath, { force: true });
  } catch {
    // best-effort — a failed cleanup here must never mask the real
    // finishWorktreeSetup failure the caller needs to see.
  }
  throw err;
}
```

Applied to `createWorktree` (the branch-attached case) and
`createDetachedMergeWorktree` (the detached-merge case,
`withMergeEphemeralWorktree`'s own helper). `removeWorktree` — not a bare
`fs.rmSync` — because by the time `finishWorktreeSetup` runs, `git worktree
add`/`--detach` has already succeeded and REGISTERED the checkout with git;
a plain directory delete would leave `.git/worktrees/<name>/` dangling.
`err` is rethrown unchanged, never re-wrapped — the cleanup is additive,
not a change to what the caller sees.

**Why `withMergeEphemeralWorktree` itself needs no separate change**
(RESEARCH.md round 1): the finding's second half — "`withMergeEphemeralWorktree`
calls `createDetachedMergeWorktree` before its own try/finally, so its
`removeWorktree` never runs for this failure either" — is closed as a
CONSEQUENCE of fixing `createDetachedMergeWorktree` itself, not a third
site to touch: once that function cleans up after its own failure
internally, it no longer matters that the outer function's `finally` never
gets a chance to run for this specific case.

**A real finding surfaced while writing this item's own tests, not just
implementing the fix** (RESEARCH.md round 1): a nonexistent `file:`
dependency — the natural first guess for "force `provisionDependencies` to
fail, offline, deterministically" — does NOT actually make `npm install`
fail in this npm version (confirmed empirically: `npm install` succeeded,
"added 1 package"). Switched to a malformed `package.json`, which forces a
real `SyntaxError` inside `provisionDependencies`'s own `JSON.parse` call —
fully deterministic, fully offline, no dependency on npm's own resolution
behavior for a missing local path.

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| The new try/catch in `createWorktree` | Low-medium — must remove the worktree fully (both git's registration AND the on-disk directory), and must rethrow the ORIGINAL error, not mask it | New test: a malformed `package.json` forces a real `SyntaxError` inside `provisionDependencies`; asserts `createWorktree` throws that same error type, `git worktree list --porcelain` no longer mentions the item, and the worktree directory itself is gone |
| The new try/catch in `createDetachedMergeWorktree` (via `withMergeEphemeralWorktree`) | Low-medium — same shape, but this is the case Finding 7 calls out as never otherwise reclaimed (branch-keyed reclaim logic skips a `detached` stanza entirely) | New test: same malformed-`package.json` trigger, through `withMergeEphemeralWorktree`; asserts the rejection propagates and the detached checkout is fully unregistered afterward |
| Every other existing `createWorktree`/`createDetachedMergeWorktree`/`withMergeEphemeralWorktree` test (success path, .fgos strip, baseRef forking, reuse/relocate, the tsk-46a CAS guard) | Low — must stay byte-identical | Full existing `test/runner/worktree.test.mjs` (65 tests), `merge.test.mjs` (91 tests), and `worktree-callsite-wrapper.test.mjs` suites rerun unchanged (163 total across the three files) |

## Shape

Single piece, no split — two small, symmetric try/catch wraps, already
implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```

## Outstanding questions

None
