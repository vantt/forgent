# tsk-3ft — branchHeadAtReturn goes stale after a manual branch reset

## Feature boundary

Investigation filed as a suspected regression from tsk-577 (branch-prune
false-positive) turned out to be a genuinely different, unrelated
mechanism. `checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) is
correctly failing for `tsk-47e` — but not because its content is lost.
This item improves the failure's diagnostic clarity for this specific
divergent-history case, and manually clears `tsk-47e`'s own stuck state
now that its content is confirmed safe.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Investigation confirmed `tsk-47e`'s real content is NOT lost — byte-identical to `main` already. The "resync branch state files" commit is benign housekeeping, not a scary reset tool. Real bug: `branchHeadAtReturn` (`c7a3282`) went stale when the branch was manually `git reset` after return, discarding a stray cross-contaminated commit and replacing it with the item's real work — nothing kept the store's recorded sha in sync with that reset. |
| D2 | Fix scope is diagnostic-only — `checkMergeStillResolves` should distinguish "branch reset to divergent history" from "branch pruned/genuinely lost" in its failure message, never auto-recover/auto-unblock. Matches `tsk-577` D3's conservative ancestry-only stance — never overclaim safety from an inferred content match. |
| D3 | `tsk-3ft`'s scope includes manually unblocking `tsk-47e` itself (not just the diagnostic code fix) — content confirmed safe on `main` via direct diff, no reason to leave a genuinely-done item stuck. |

## Pinned terms

- "Divergent history" = the recorded `branchHeadAtReturn` sha and the
  branch's CURRENT tip are neither ancestor nor descendant of each other
  (`git merge-base --is-ancestor` fails both directions) — distinct from
  `tsk-577`'s case (target ref missing entirely because it was pruned).
  Here the ref still exists; it just points somewhere else now.

## Scout evidence

- `git reflog show fgw/tsk-47e` — the real sequence: item's real work
  (`plan.md`, `CONTEXT.md`, both under
  `docs/history/context-md-enforcement-scope/`) → an unrelated stray
  commit ("retro-loop sweep — synthesize 14 retrospective items", `c7a3282`,
  the sha recorded as `branchHeadAtReturn` at return time) → `branch: Reset
  to 2e08b36` (a manual reset discarding that stray commit) → the item's
  real, correctly-scoped follow-up work
  (`docs(tsk-47e): Iron Law false-positive evidence`, `eb2b2bf`) →
  housekeeping commits (drop stale event-log/entropy snapshots, "resync
  branch state files to current main tip", `3f4c5e5`, the branch's current
  tip).
- `git diff main fgw/tsk-47e -- docs/history/context-md-enforcement-scope/`
  → empty. `git ls-tree -r main --name-only | grep context-md-enforcement-scope`
  confirms `main` already carries `CONTEXT.md`, `plan.md`,
  `iron-law-evidence.md`, plus the end-user doc
  `docs/explanation/context-md-enforcement-scope.md` — tsk-47e's real
  deliverable is fully present on `main`, landed through a path that
  didn't preserve `c7a3282` as a literal ancestor (irrelevant now — `c7a3282`
  was never the item's real final work anyway, per the reflog).
- `git log --all --oneline --grep="resync branch state files"` → exactly
  one commit repo-wide (`3f4c5e5`). It only touches `.fgos/events.jsonl`
  (+6 lines). It shows up as an ancestor of dozens of unrelated `fgw/*`
  branches purely because it sits on shared trunk history (every branch
  forked at or after that point on `main` naturally contains it) — not
  because some tool rewrote all of them.
- Only 2 items are `status: blocked` repo-wide (`tsk-47e`, `tsk-42i` — the
  latter is an unrelated topic, Socratic dialogue sync, no shared
  mechanism found). This is a single confirmed occurrence, not a spreading
  pattern — grounds D2's diagnostic-only (not auto-recover) scope choice
  and the earlier rejected code-fix-with-auto-recovery option.
- `fgos tool query --capability impact-analysis --status present`:
  GitNexus `present` but the index is stale (confirmed during `tsk-577`'s
  own clarify pass, unchanged since) → **degraded** posture for this
  item's later implementation too.

## Canonical references

- `src/state/cleanup-harness.mjs` — `checkMergeStillResolves`, the
  function this item's diagnostic improvement touches (already carries
  `tsk-577`'s missing-ref fallback, landed just before this item).
- `docs/history/tsk-577-cleanup-checkmergestillresolves-false-positive/CONTEXT.md`
  — the sibling investigation this one was originally suspected to be a
  continuation of; confirmed unrelated (D1).

## Outstanding questions deferred to planning

- Exact wording/shape of the improved diagnostic message and how
  `checkMergeStillResolves` detects "ref exists but sha is neither
  ancestor nor descendant of its tip" cheaply — an implementation choice,
  left to `fgos-coding-planning`.
- Exact mechanism for manually unblocking `tsk-47e` (D3) — `fgos edit`
  the stale `branchHeadAtReturn` field to the branch's real current tip,
  vs. a direct status move — left to `fgos-coding-planning`.
