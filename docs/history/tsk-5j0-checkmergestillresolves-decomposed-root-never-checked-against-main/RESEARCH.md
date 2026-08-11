# RESEARCH: checkMergeStillResolves never checks a decomposed root's own branch against main

## Round 1 (tsk-5j0, stage discovery)

**Checked:** `src/state/cleanup-harness.mjs:133-151` (`checkMergeStillResolves`),
`:153-167` (`checkChildrenResolve`), `:178-196` (`checkAncestry`), `:274-291`
(`assessCleanupReadiness`, the only caller — `worktreeBacked` gate at
`:285-288`). Also `docs/explanation/why-checkmergestillresolves-can-false-
positive-after-a-root-branch-prune.md` (the accumulated record of three
prior, distinct bugs in this same function: tsk-577 branch-prune false
positive, tsk-3ft branch-reset true positive, tsk-psb wrong-sha-for-a-
decomposed-item).

**Found:** confirmed exactly as the item describes. `checkMergeStillResolves`
(cleanup-harness.mjs:133-139):

```js
if (view && id) {
  const children = Object.entries(view.work ?? {}).filter(([, item]) => item.parent === id);
  if (children.length > 0) {
    return checkChildrenResolve(repoRoot, view, children);
  }
}
```

When `id` has children, this returns `checkChildrenResolve`'s result
*directly* — the function returns before ever reading `work.branchHeadAtReturn`
for `id` itself, so an item with children never gets its own branch checked
against anything.

`checkChildrenResolve` (cleanup-harness.mjs:153-167) recurses into each
child's own `checkMergeStillResolves`, which resolves each child's target
ref as `fgw/<rootId>` (the PARENT's branch, via `resolveRoot`) — it verifies
children-onto-parent, never parent-onto-main.

**Cross-check against the explanation doc's own history:** the doc's
"fourth case" (tsk-psb) describes the intended fix as "additionally check
ancestry against the children's own branchHeadAtReturn/merge commits, **not
only** the parent's own branch" — i.e. both checks together. The doc's
"fix stays ancestry-based" section (tsk-577) separately states "a root's
own `branchHeadAtReturn` failing ancestry against `HEAD` directly... was
confirmed out of scope" — but that scoping statement is about a ROOT
**with no children** (an item whose own branch never merged anywhere,
checked via the ordinary non-recursive path at cleanup-harness.mjs:140-150,
which already runs for a childless item). It does not cover — and the doc
never claims to cover — a root that **has** children, where the current
code structurally never reaches that ordinary path at all. The actual
implementation matches tsk-psb's "not only" framing only for a NON-root
child; for the root itself, the children-check was never additive, it was
a full replacement (`return checkChildrenResolve(...)` short-circuits
before the parent's-own-sha path can run).

**Live confirmation (already in the item's own description, not
re-verified independently this round — `tsk-4b2`'s branch state may have
changed since the item was filed):** `fgos cleanup tsk-4b2` reportedly
returned a clean TTL noop despite `fgw/tsk-4b2` never having merged into
`main`. Not re-checked live this round since the fix itself doesn't depend
on reproducing that specific instance — the code-level gap is sufficient
and unambiguous on its own reading.

**Fix shape (matches the item's own proposed fix, confirmed correct against
the code read above):** when `id` has children, additionally check `id`'s
own resolved branch against its own target ref — but only when `id` IS the
root (`resolveRoot(view, id) === id`; a non-root decomposed node's own
branch is still correctly never checked, per tsk-psb's reasoning that a
decomposed item's own sha is never itself merged forward). Concretely: in
`checkMergeStillResolves`, when `children.length > 0`, run
`checkChildrenResolve` as today AND, only for a root id, also run the
existing `checkAncestry`/`refExists` path against `fgw/<id>` vs `HEAD` —
combine both results (`ok: true` only if both pass), same diagnostic-only
stance the three prior fixes in the linked doc already took (report, never
auto-recover). `checkAncestry`/`refExists`/`checkChildrenResolve` are all
already-existing helpers in this file; no new git subprocess call shape is
needed, only a new call site for the existing `checkAncestry` on the root's
own sha, gated on `resolveRoot(view, id) === id`.

**Verdict:** `{clear: true, verify: "npm test"}`
