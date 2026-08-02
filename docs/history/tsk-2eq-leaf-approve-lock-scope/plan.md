# tsk-2eq — plan

CONTEXT.md: `docs/history/tsk-2eq-leaf-approve-lock-scope/CONTEXT.md` (D1:
proceeds now, unblocked by tsk-45y).

## Mode

**small.** Flag count: 1 of 10 (existing covered behavior — `merge.mjs`/
`main-checkout-lock.mjs` are core approve-path code with real test
coverage). No auth, authorization, data-model, audit/security, external-
system, public-contract, cross-platform, or multi-domain flags apply.
Weak-proof flag does not apply either: `test/runner/merge.test.mjs`,
`test/runner/main-checkout-lock.test.mjs`, `test/runner/lock.test.mjs`,
`test/runner/lock-wait.test.mjs`, and `test/e2e/main-checkout-lock-hook.test.mjs`
already exist and exercise this exact area — a smaller mode than "small"
(tiny/direct-note) would not honestly cover a signature change to a
shared function with two call sites and standing regression tests to
extend.

## Impact-analysis posture

`impact-analysis: full` (GitNexus registered and `present`). Ran
`impact({target: "mergeRunnerItem", direction: "upstream", summaryOnly:
true})` — returned `impactedCount: 0`, `risk: LOW`. This undercounts: a
direct grep (`grep -n "mergeRunnerItem(" bin/fgos.mjs`) confirms exactly
two real call sites (line 2174, leaf approve; line 2248, root approve),
most likely missed by the graph because both calls are wrapped in an
arrow function passed to `runMerge(() => mergeRunnerItem(...))` rather
than called directly. Treat the manual grep as the authoritative call-site
list for this plan, not the tool's `LOW`/`0` count — noted here so a later
reader does not trust the automated number blindly.

## Approach

Confirmed during scouting (CONTEXT.md's own pinned assumption): inside
`mergeRunnerItemLocked`, `repoRoot` is reused as the `cwd` for every git
operation (12 call sites: `isAlreadyMerged`, `runGoalCheck`, `git merge`,
`git commit`, `git diff --cached`, etc.) — only two lines
(`src/runner/merge.mjs:642-643`, `fgosDir` + `resolveWriterIdentity`) use
it for lock-scope resolution. The fix therefore only needs to touch those
two lines' input, not the git-op cwd threaded through the rest of the
function.

**Chosen path**: add an explicit `lockRoot` option to `mergeRunnerItem`,
defaulting to `repoRoot` (preserves today's root-approve behavior with no
call-site change needed there):

```
export async function mergeRunnerItem(repoRoot, item, { timeoutMs, lockRoot = repoRoot } = {}) {
  ...
  const fgosDir = path.join(lockRoot, '.fgos');
  const identity = resolveWriterIdentity(fgosDir).id;
  const lock = acquireMainCheckoutLock(fgosDir, { identity, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
  ...
  return await mergeRunnerItemLocked(repoRoot, item, branch, { timeoutMs }); // unchanged — still ephemeral.path for leaf
}
```

Leaf approve's call site (`bin/fgos.mjs:2174`, inside
`withMergeEphemeralWorktree(repoRoot, rootId, ...)`) changes from:

```
mergeRunnerItem(ephemeral.path, item, { timeoutMs })
```

to:

```
mergeRunnerItem(ephemeral.path, item, { timeoutMs, lockRoot: repoRoot })
```

`repoRoot` is already in scope at that call site (the outer function
parameter `withMergeEphemeralWorktree` closes over). Root approve
(`bin/fgos.mjs:2248`) needs no change — `lockRoot` defaults to `repoRoot`,
identical to current behavior.

**Alternative rejected**: swapping the real `repoRoot` in for the
positional `repoRoot` param entirely (no new option). Rejected per
CONTEXT.md's own pinned constraint — this would move every downstream git
operation (`git merge`, `git commit`, verify) off the ephemeral worktree
and onto the real checkout, landing the merge on `main`'s working tree
instead of `fgw/<root>`.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `mergeRunnerItem` signature + lock resolution (`merge.mjs:619-670`) | medium — shared by both approve paths, core to `approve` | New/extended case in `test/runner/merge.test.mjs`: call `mergeRunnerItem(ephemeralPath, item, { lockRoot: realRepoRoot })` and assert the lock file materializes under `realRepoRoot/.fgos/main-checkout.lock`, not under `ephemeralPath/.fgos` |
| Leaf approve call site (`bin/fgos.mjs:2174`) | medium — this is the actual bug site | Contention case: hold `main-checkout.lock` at `repoRoot` first (via `acquireMainCheckoutLock` directly, as `main-checkout-lock.test.mjs` already does), then call the leaf-approve path and assert it now reports `lock-held` — today it silently acquires and never contends |
| Root approve call site (`bin/fgos.mjs:2248`) | low — default arg preserves current behavior, no call-site edit | Existing root-approve tests in `merge.test.mjs`/e2e suite stay green unmodified |
| `mergeRunnerItemLocked`'s 12 other `repoRoot`-as-cwd usages | low — untouched by this fix | Existing merge/commit/verify tests in `merge.test.mjs` stay green (git-op cwd behavior is unchanged) |

## Files touched

- `src/runner/merge.mjs` — `mergeRunnerItem` signature (add `lockRoot`
  option), lines 642-643 (`fgosDir`/`identity` resolution).
- `bin/fgos.mjs` — leaf approve's `mergeRunnerItem` call, line 2174.
- `test/runner/merge.test.mjs` — extend with the two proof-point cases
  above (lock-file location, and real contention on the leaf path).

## Verify

`npm test` (item's own declared verify — already the full suite, matches
`docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`'s
documented root-approve behavior; this item's own verify scope is leaf-
level so no wider suite is needed beyond the standard `npm test` gate).

## Split

No split. One honest piece of work — a signature addition plus a one-line
call-site change plus test extension, all within a single well-scoped
function and its direct caller. Proceeds as itself, no child items.

## Assumptions

- Fix mechanism (lockRoot split) already pinned in CONTEXT.md — not
  reopened here, only executed.
- The separate `catchup` path's own missing-lock gap (CONTEXT.md's
  Feature boundary) stays out of scope; no test added for it here.
