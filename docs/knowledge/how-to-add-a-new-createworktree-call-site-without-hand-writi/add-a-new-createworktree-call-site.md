---
type: how-to
title: How to add a new `createWorktree` call site without hand-writing cleanup
tags: [worktree, choke-point]
timestamp: 2026-07-29T00:00:00.000Z
source_capture_ids: [choke-point-createworktree-callsite-wrapper]
framework: diataxis
mode: how-to
---
# How to add a new `createWorktree` call site without hand-writing cleanup

`docs/decisions/0022-fgos-choke-point-survey.md` (candidate #3) found that
`createWorktree`'s 6 call sites each wrote their own cleanup policy —
force-remove now, best-effort-remove-and-log, or no cleanup at all — instead
of routing through one shared decision per operation type.
`choke-point-createworktree-callsite-wrapper` fixed it by adding 3 named
wrappers in `src/runner/worktree.mjs`. Use this recipe instead of calling
`createWorktree`/`removeWorktree` directly.

## 1. Pick your operation type

| Your worktree is for... | Use | Cleanup |
|---|---|---|
| The item's own isolated checkout — it outlives this call (a claim) | `createClaimWorktree` | Owned by the claim's own lifecycle (`claim-port.mjs`'s `claimWork`), never here |
| Staging one merge against an already-existing branch (approve's leaf-merge, catchup) | `withMergeEphemeralWorktree` | Automatic — force-removed in a `finally` once your callback settles |
| One dispatch attempt (a claimed item's worker run, the startup reap's throwaway check) | `createDispatchWorktree` + `removeDispatchWorktree` | You call `removeDispatchWorktree` yourself, in your own `finally` — it logs and swallows a failed removal instead of throwing |

## 2. claim-isolate

```js
import { createClaimWorktree } from './worktree.mjs';

const worktree = createClaimWorktree(repoRoot, id, { worktreeDir, baseRef });
// worktree.path is now the caller's to keep — return/reject tears it down.
```

Thin passthrough to `createWorktree` — nothing to clean up here.

## 3. merge-ephemeral

```js
import { withMergeEphemeralWorktree } from './worktree.mjs';

const result = await withMergeEphemeralWorktree(repoRoot, id, async (worktree) => {
  // do the merge against worktree.path
  return { outcome: 'merged' };
});
```

`opts.baseRef` is never needed — the branch already exists, so
`createWorktree`'s reuse path ignores it. The worktree is force-removed once
`fn` settles, whether it returns or throws:

> ```js
> export async function withMergeEphemeralWorktree(repoRoot, id, fn) {
>   const worktree = createWorktree(repoRoot, id, {});
>   try {
>     return await fn(worktree);
>   } finally {
>     removeWorktree(repoRoot, worktree.path, { force: true });
>   }
> }
> ```
> — `src/runner/worktree.mjs`

## 4. runner-dispatch

```js
import { createDispatchWorktree, removeDispatchWorktree } from './worktree.mjs';

let wt = null;
try {
  wt = createDispatchWorktree(repoRoot, id, { worktreeDir, baseRef });
  // dispatch work against wt.path
} finally {
  if (wt) removeDispatchWorktree(repoRoot, wt.path, log);
}
```

`baseRef`/`worktreeDir` stay your own call-site decision (e.g. a leaf forks
from its root's branch tip — that is real business logic, not the
duplicated part). `removeDispatchWorktree` is the shared cleanup policy: a
failed removal is logged through your `log` function and swallowed, never
thrown — so a cleanup failure can never mask the attempt's real outcome.

## 5. Verify

Run the item's own test file, which exercises all 3 wrappers against a
disposable temp git repo (never this repo's own worktree):

```
node --test test/runner/worktree-callsite-wrapper.test.mjs
```

Real capture from closing this item:

> ```json
> "actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}
> ```
> — real `work.outcome` capture, id `choke-point-createworktree-callsite-wrapper`

This item's own diff touched fgOS's own runner/CLI modules
(`bin/fgos.mjs`, `src/runner/claim-port.mjs`, `src/runner/loop.mjs`,
`src/runner/worktree.mjs`), which trips the Iron Law gate on `approve` —
failing-test-first proof is required before `--acknowledge-iron-law`. Proof
captured for this item, running the new test file against the pre-fix
source in a disposable detached checkout:

> ```
> SyntaxError: The requested module '../../src/runner/worktree.mjs' does not
> provide an export named 'createClaimWorktree'
> ...
> ✖ test/runner/worktree-callsite-wrapper.test.mjs (25.855914ms)
> ℹ pass 0
> ℹ fail 1
> ```

## Related

- `docs/decisions/0022-fgos-choke-point-survey.md` — full candidate
  evidence, including this one (#3).
- `docs/reference/fgos-choke-point-ranked-priority.md` — the ranked table
  this item's fix closes row 3 of.
- `docs/explanation/fgos-choke-point-pattern.md` — why this shape of
  duplication keeps recurring in fgOS.
