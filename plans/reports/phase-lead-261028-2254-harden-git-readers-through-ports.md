# Git readers through ports: result

Branch `harden/git-readers-through-ports`. One of three sites moved; the other two stay as declared exceptions (OPC decision 2026-10-28, board `410dba5a4`), with the reason written at each site.

## Done
- `src/runner/dispatch/confinement/resources.mjs` `resolveWorkspaceGitMetadata`: hand-written gitfile parser deleted; now `createGitInspect(gitPortOptions(root)).resolveRepo()` -> `gitDir`. Still null when the root has no checkout marker or the port says not-a-repository; port failure maps to the same `confinement-grant-invalid` error the malformed-gitfile case used. Net -19 lines in the module. Because `resolveRepo` also runs the Git port's config check, a repository whose config the port refuses now gives `confinement-grant-invalid`; that is intended under one door.
- Cost: one call per dispatch (not per event). Measured about 0.15 ms per call via the in-process addon vs 0.003 ms for a raw file read: negligible.
- Test: `test/runner/dispatch-confinement-backend-p03.test.mjs` R2 rewritten on a real repo (main checkout, linked worktree, plain dir). The old fixture used a fake gitfile target that the port correctly refuses as untrusted topology; it owned only the hand parser, so it is replaced, not weakened. Wiring proof stays: "a workspace-write producer in a linked worktree ..." (real worktree, passes).

## Kept as declared exceptions (OPC: no new port)
1. `src/state/store.mjs:514-549` (`refsGitDir`, `readBranchTip`). The comparison that matters runs inside the state lock (`applyPlanEvidenceSnapshot`, with `tx.readText`). `createGitInspect`/`createGitRefs` throw `exec-under-hot-lock` while a hot lock is held, and the Inspect port has no call usable there. Moving only the pre-lock snapshot would leave two readers that can disagree (port vs hand parse), so nothing was changed. Missing fact: a branch-tip read that is allowed under the hot lock (or a decision that the in-lock compare may be dropped in favour of re-reading outside the lock). Resolution (OPC): the addon has no spawn-free ref read (`Inspect.resolve_ref` runs `git for-each-ref` then `symbolic-ref`), so the hot-lock refusal is right; the pre-lock and in-lock reads use the same function and snapshotted `gitDir`, so they cannot disagree. Kept, with a site comment that it reads only the files ref backend (on reftable both reads are null and the check compares nothing).
2. `src/runner/dispatch/runtime-inspection.mjs:259` (`workspace`). Port has the facts (`resolveRepo`: `worktreeRoot`, `commonDir`), but importing `src/git/inspect.mjs` adds `holder-lock/hot-guard.mjs` (imports `node:child_process`), the native door and session identity to the reconcile closure, which `test/runner/dispatch-reconciliation-import-graph.test.mjs` pins as an exact, spawn-free set (and the module header says to stay below Git layers). Not changed: that closure guard is a deliberate layering rule. Resolution (OPC): it is a grouping key computed once per run and the closure is spawn-free on purpose; kept, with a site comment.

## Tests
- `test/runner/dispatch-confinement-backend-p03.test.mjs` + `test/architecture.test.mjs`: 79 pass, 0 fail, no ERROR lines.
- Census regenerated: 0 undeclared sites.

## Retired tests
- Old R2 fixture test: behaviour now owned by the rewritten R2 in the same file.

## docs lines for DOC
- none found.

## Ideas (owner chooses, RUL104)
- The two remaining gitfile/commondir parsers (`store.mjs` `refsGitDir`, `runtime-inspection.mjs` `workspace`) could share one small spawn-free leaf; they differ only in the upward walk. Benefit: one parser instead of two. Proposed by OPC.

## Open questions
- None.
