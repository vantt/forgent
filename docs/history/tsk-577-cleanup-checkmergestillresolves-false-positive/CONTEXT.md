# tsk-577 — checkMergeStillResolves false-positive after root branch prune

## Feature boundary

`checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) wrongly reports
`ok:false` ("commit ... is no longer reachable") for a leaf whose content is
genuinely on `main`, when the leaf's target ref (`fgw/<rootId>`, per D7 of
tsk-1p9's root-aware resolution) has already been deleted. This item fixes
that specific false-positive class — both where it originates (the branch
gets deleted while still needed) and where it's felt (the check itself) —
and clears the 14 items already stranded by it. It does not attempt a
general content/diff-based merge-verification rewrite.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix both ends: **source** — `loop.mjs`'s zero-ahead orphan-branch prune (`loop.mjs:391-393`) must skip deleting a root's `fgw/<rootId>` branch while that root still has open leaf descendants that may need it for their own `checkMergeStillResolves` check; **symptom** — `checkMergeStillResolves` must tolerate an already-missing target ref for roots pruned before this fix lands, rather than only preventing new occurrences. |
| D2 | Done-criteria for tsk-577 includes remediating the 14 already-stranded items: after the code fix lands, rerun `fgos cleanup <id>` on each of the 14 (`tsk-47e`, `tsk-3go-1`, `tsk-5m7`, `tsk-50i`, `tsk-62y`, `tsk-2u0`, `tsk-3gx-1`, `tsk-3gx-2`, `tsk-3gx-3`, `tsk-19j-1`, `tsk-19j-2`, `tsk-19j-3`, `tsk-19j-4`, `tsk-1ni-1`) and confirm each clears the merge-check. Not just a code-only fix. |
| D3 | Fix stays ancestry-based only (ref-missing tolerance). No content/diff comparison. Revert-after-merge remains an accepted, documented limitation (`cleanup-harness.mjs:25-36`) — unchanged by this item. |

## Pinned terms / assumptions

- "Zero-ahead prune" = `loop.mjs`'s `listLeftovers` + `aheadCount === 0` →
  `git branch -D branch` step (`loop.mjs:388-396`) — the only branch-delete
  call site with no per-leaf awareness. Distinct from `merge.mjs:940`
  (`cleanupMergedBranch`), which deletes an item's own branch only after
  that item's own `checkMergeStillResolves` already passed — not a source
  of this bug.
- Assumption (not asked, low material / matches repo's existing YAGNI
  stance and `cleanup-harness.mjs`'s own "documented limitation, not
  over-claimed" style): the standalone/root-checked-against-`HEAD` variant
  (a root's own `branchHeadAtReturn` failing ancestry against `HEAD` due to
  a squash/history-restructuring merge into `main`, independent of any ref
  deletion) stays **out of scope** for tsk-577 — none of the 14 confirmed
  items needed it; `HEAD` itself is never pruned the way a named
  `fgw/<rootId>` ref can be, so this is a materially different failure mode
  with no current evidence.

## Scout evidence

- `src/state/cleanup-harness.mjs:74-90` — `checkMergeStillResolves`'s
  current root-aware logic (tsk-1p9 D7): resolves `targetRef =
  fgw/<rootId>` for a leaf, `HEAD` for a root/standalone; any
  `merge-base --is-ancestor` failure (including "unknown revision" for a
  deleted ref) is caught by one generic `catch` and reported as
  `ok:false`, indistinguishable from a genuine force-push loss.
- `src/runner/loop.mjs:388-396` — the zero-ahead orphan prune:
  `for (const { branch, aheadCount } of listLeftovers(repoRoot)) { if
  (aheadCount === 0) { git(repoRoot, ['branch', '-D', branch]); ... } }` —
  runs with no knowledge of open leaf children still depending on that
  ref for their own cleanup check.
- `src/runner/merge.mjs:919-953` — `cleanupMergedBranch`, the OTHER branch
  delete call site: confirmed self-scoped and pre-guarded ("D8's harness
  has ALREADY independently verified the branch's commit resolves against
  the correct target" before deleting) — ruled out as a source of this bug.
- `src/runner/root-affinity.mjs:66-78` — `resolveRoot(view, id)`: walks the
  `parent` chain up to the topmost ancestor still present in `view.work`;
  confirmed it correctly resolves e.g. `tsk-3gx-1` → `tsk-3gx` as long as
  the root item record itself still exists (status `cleanup`, not yet
  removed).
- Item's own description (tsk-577, filed 2026-08-05) already verified via
  `git cat-file -e HEAD:<path>` that content for two of the 14 items
  (`tsk-19j-1`, `tsk-3gx-1`) genuinely exists on `main`, and via `git
  branch --list` that all 5 affected root branches (`fgw/tsk-3bn`,
  `fgw/tsk-3gx`, `fgw/tsk-19j`, `fgw/tsk-1ni`, `fgw/tsk-3go`) no longer
  exist — establishing the false-positive is real, not a content-loss.
- `fgos tool query --capability impact-analysis --status present`: GitNexus
  present, freshly checked → impact-analysis posture is **full** for this
  item's later implementation — the `MUST run impact()` rules in
  `CLAUDE.md` apply as written when editing `checkMergeStillResolves` /
  `loop.mjs`'s prune step.

## Canonical references

- `docs/history/tsk-1p9-defer-branch-worktree-cleanup/CONTEXT.md` (D7/D8) —
  the root-aware ref resolution this item is patching a gap in.
- `docs/history/fgos-cleanup-loop/CONTEXT.md` — cleanup-loop's own handling
  of a per-item `checkMergeStillResolves` failure (parks `blocked`, skips
  to next candidate) — relevant background for D2's remediation step.

## Outstanding questions deferred to planning

- Exact mechanism for D1's source-side fix: how `loop.mjs`'s prune step
  queries "does this branch's item have open leaf descendants" (a fresh
  `view.work` scan filtered by `parent === id` and open status, mirroring
  the anchor-check pattern `fgos-coding-driving` already uses) — an
  implementation choice, left to `fgos-coding-planning`.
- Exact mechanism for D1's symptom-side fix: how `checkMergeStillResolves`
  distinguishes "ref missing" (git's "unknown revision"/"malformed object
  name" error) from "ref exists, sha unreachable" (the genuine force-push
  case) within its existing `try/catch`, and what it falls back to
  checking once a ref is confirmed missing — left to `fgos-coding-planning`.
- Whether D2's remediation (rerunning `fgos cleanup` on the 14 items) is
  driven by this item directly or delegated — left to `fgos-coding-planning`'s
  own shaping.
