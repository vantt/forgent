# CONTEXT: checkMergeStillResolves never checks a decomposed root's own branch against main

## Feature boundary

`checkMergeStillResolves` (`src/state/cleanup-harness.mjs:133-151`), when
called on an item that has children, returns `checkChildrenResolve`'s
result directly and never checks the item's own branch against anything.
For a **root** item (no parent, or every ancestor in its parent chain
resolves back to itself — see `resolveRoot`, `src/runner/root-affinity.mjs`)
this means `fgw/<rootId>` can sit permanently unmerged into `main` while
`assessCleanupReadiness` (the function's one real caller,
`cleanup-harness.mjs:274-291`) keeps reporting `ok:true` — a decomposed
root whose own branch never merges will eventually reach `done` and have
its branch deleted by `cleanupMergedBranch`, silently and permanently
losing whatever content only ever lived on that branch (never merged by
any child, since children merge into `fgw/<rootId>`, not into `main`
directly).

The fix: when an item has children, run the existing children-recursion
check **and**, only when the item IS the root, also run the existing
`checkAncestry`/`refExists` path against `fgw/<id>` vs `HEAD` (`main`) —
combine with AND. Diagnostic-only, same stance the three prior fixes to
this same function already took (report via the existing `failed[]` path,
never auto-recover).

## Locked decisions

No question in this item cleared the material/grounded/answerable bar for
a live round — every open point was already settled by direct evidence
already in the repo (the item's own description, the linked explanation
doc, and the existing test suite), so each is pinned here as a
grounded assumption rather than asked.

- **D1 — scope: only the true root's own branch gets the new check.** A
  non-root decomposed node's own branch stays un-checked, exactly as
  today. Grounded in `docs/explanation/why-checkmergestillresolves-can-
  false-positive-after-a-root-branch-prune.md`'s "fourth case" (tsk-psb):
  a decomposed non-root node's own sha is *structurally* never merged
  forward (its children fork from and merge into the resolved ROOT's
  branch tip directly, per `worktree.mjs` D3, confirmed by
  `test/state/cleanup-harness.test.mjs`'s own fixtures — see Scout
  evidence below), so checking it against anything would be checking a
  branch that was never supposed to merge in the first place. The item's
  own description already states this precisely ("`fgw/<rootId>` when the
  item IS the root"). `git log -1 --format=%s` inspection unnecessary —
  `resolveRoot(view, id) === id` is the existing, already-tested predicate
  this gate reuses (`cleanup-harness.mjs:44-46` already cites the same
  test for leaf/root resolution).
- **D2 — combine, never replace.** The new root-branch-vs-`main` check and
  the existing children-onto-parent recursion both run when a root has
  children; `ok:true` only when both pass. Grounded in the same
  diagnostic-only, never-auto-recovering posture all three prior fixes to
  this function established (tsk-577 ref-missing tolerance, tsk-3ft
  reset-vs-prune distinction in the failure message, tsk-psb children
  recursion) — this item adds a fourth independent check to the same
  file, not a replacement of the third.
- **D3 — no retroactive backfill.** This fix only prevents the gap going
  forward; it does not re-scan or re-verify items already sitted in
  `cleanup`/`done` under the old, buggy check. Grounded in the same
  precedent tsk-577's own fix took (that item explicitly separated
  "prevent new occurrences" from "remediate already-affected items," and
  remediation there was a manual, evidence-gathering pass — not something
  this function itself was extended to do). If a root's branch was
  already lost under the old bug, this fix cannot recover it — that would
  be a separate incident-response question, out of this item's scope.

## Pinned terms

- **root** — `resolveRoot(view, id) === id` (`src/runner/root-affinity.mjs`):
  an item with no parent, or whose parent chain fully resolves back to
  itself. Same predicate `checkMergeStillResolves` already imports and
  uses today for leaf-vs-root ref resolution (`cleanup-harness.mjs:144`).
- **the item's own branch** — `fgw/<id>` for a root `id`, the same naming
  convention `checkMergeStillResolves` already uses for `namedRef`
  (`cleanup-harness.mjs:145`).

## Scout evidence

- `src/state/cleanup-harness.mjs:133-151` (`checkMergeStillResolves`) —
  confirmed: `if (children.length > 0) return checkChildrenResolve(...)`
  short-circuits before the item's own `branchHeadAtReturn` is ever read.
- `src/state/cleanup-harness.mjs:153-167` (`checkChildrenResolve`),
  `:178-196` (`checkAncestry`), `:169-176` (`refExists`) — the three
  existing helpers the fix reuses; no new git subprocess shape needed.
- `docs/explanation/why-checkmergestillresolves-can-false-positive-after-
  a-root-branch-prune.md` — full history of the three prior, distinct
  bugs in this same function (tsk-577, tsk-3ft, tsk-psb); confirms this
  item's gap is a fourth, previously-unaddressed case, not a duplicate.
- `test/state/cleanup-harness.test.mjs:173-281` — the three existing
  tests covering the children-recursion path all call
  `checkMergeStillResolves` with `id` set to a **non-root** decomposed
  node (`parent-d`/`parent-e`/`parent-f`, each carrying its own `parent`
  field pointing at a root). None of them call the function with `id` set
  to the ROOT itself while that root has children — confirming (a) no
  existing test currently exercises the gap this item reports, and (b)
  under D1/D2 above, none of these three existing tests need to change —
  the new root-only check simply never fires for a non-root `id`, so
  their assertions stay valid unchanged.
- GitNexus impact query (`impact({target: "checkMergeStillResolves"})`,
  see `## Impact analysis` below) confirms the same single real caller
  independently: `assessCleanupReadiness`.

## Impact analysis

`fgos tool query --capability impact-analysis --status present` →
`gitnexus` registered and `present` → **full** (`CLAUDE.md`'s
impact-analysis capability gate). GitNexus's own `impact` query on
`checkMergeStillResolves` confirms one real caller
(`assessCleanupReadiness`, `cleanup-harness.mjs:286`) plus its own test
file — matches the direct `rg` scout above exactly, no discrepancy to
flag. Blast radius: narrow, single call site, no cross-cutting exports.

## Canonical references

- `src/state/cleanup-harness.mjs` — the file this fix changes.
- `docs/explanation/why-checkmergestillresolves-can-false-positive-after-a-root-branch-prune.md` — the accumulated decision record this item's own fix should extend with a "fifth case" section once implemented (documentation-management: user-visible behavior of this function changed).
- `test/state/cleanup-harness.test.mjs` — existing test suite; a new test covering a root-with-children whose own branch never merged is needed (none of the existing tests call the function with a root `id` that has children).

## Outstanding questions

None
