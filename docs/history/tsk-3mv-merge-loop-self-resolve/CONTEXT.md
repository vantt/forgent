---
item: tsk-3mv
timestamp: 2026-07-29T15:53:21.000Z
---

# CONTEXT: merge-loop self-resolve for merge blocks

## Feature boundary

`/fgOS:merge-loop` (and the `/fgOS:merge-next` call it wraps) currently
treats every blocked merge outcome (`merge-conflict`, `verify-fail-post-merge`,
`fgos-write-rejected`, Iron Law trip) the same way: if the same item id
blocks twice in a row, stop the loop and report to a person. It never
attempts a fix itself, even though two of these block reasons already have
documented, proven recovery playbooks (see References) that a live session
(this one, on `tsk-66l`) already executed by hand.

This item teaches the merge path to attempt those documented recoveries
itself before giving up — for exactly the two block reasons that have a
known-safe playbook. It does not touch the Iron Law gate, and it does not
fix `tsk-28w` (a separate, already-filed crash bug in `fgos catchup`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Self-resolve scope covers both a mechanical layer and an agent-diagnosed layer: (a) **decision-ID collision** merge-conflicts — conflict confined to `docs/decisions/0000-index.md` and/or `docs/decisions/NNNN-*.md`, both sides inserting a *different* row at the same position (not editing the same row's content) — are structurally recognizable and get auto-renumbered + auto-resolved in code, matching `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`. (b) **`verify-fail-post-merge`** blocks are diagnosed live, in the merge-loop session itself, following `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`'s steps (read the failure, check whether it touches the item's own diff, isolate-rerun, fix as a separate commit if it's a genuine pre-existing bug, or retry if it's load-induced flake). Any conflict shape outside (a) — including a real content conflict in a code file — is never auto-resolved; it falls straight to today's stop-and-report behavior. |
| D2 | Iron Law blocks (`required: true` without `--acknowledge-iron-law`) are **out of scope** for this item and stay exactly as they are: `approve` refuses until a real human operator runs `--acknowledge-iron-law` themselves (RUL34/RUL37, `docs/specs/runner.md` lines 530-531, 598-603 — a locked Business Rule, not merge-loop's own choice). Nothing in this item's self-resolve logic may run that flag on its own authority, under any condition. Whether/how to loosen this is split out to its own item, `tsk-44f` (depends on `tsk-5t3`), never silently folded in here. |
| D3 | The self-resolve retry stop condition is not a fixed attempt-count cap. It only ever attempts a fix that matches one of the two known playbooks from D1(a)/D1(b). After attempting a fix and retrying, if the same item's block reason repeats identically (no observable progress), or the block doesn't match either known playbook's recognizable shape, the loop stops immediately and reports to a person — it never blindly repeats the same fix hoping for a different result. |
| D4 | `tsk-28w` (`fgos catchup` crashes with a bare `git commit` "nothing to commit" error when an item's branch is already fully merged into its destination) stays a separate, already-filed bug — not fixed by this item. If the self-resolve path in this item hits that exact crash shape, it only applies the already-documented workaround (`fgos move <id> --to proposed` then retry `approve`), it does not fix the underlying crash. |

## Pinned terms

- **Self-resolvable merge-conflict** (D1a): a `conflict` outcome from
  `mergeRunnerItem`/`mergeRunnerItemLocked` (`src/runner/merge.mjs`) whose
  conflicted paths are entirely within `docs/decisions/` (the
  `0000-index.md` row-position conflict and/or a `docs/decisions/NNNN-*.md`
  filename collision), where both sides are inserting *different* content
  at the same position rather than disputing the same row's content. Any
  other conflicted path, or a same-row content dispute even inside
  `docs/decisions/`, is **not** self-resolvable and falls to stop-and-report.
- **No progress** (D3): the block outcome's reason/errorClass after a fix
  attempt + retry is identical to the block outcome immediately before the
  fix attempt, for the same item id.

## Scout evidence

- `plugins/fgOS/skills/merge-loop/SKILL.md` step 4 — today's rigid
  "same id blocked twice consecutively -> stop" rule, with an explicit
  refusal to touch Iron Law on its own authority.
- `plugins/fgOS/skills/merge-next/SKILL.md` — the single-shot wrapper
  `merge-loop` recurses into; reports `{picked, approve: {blocked, reason}}`
  or `{picked, blocked: "iron-law"}`.
- `src/runner/merge.mjs` (`mergeRunnerItemLocked`) — on a real git conflict,
  aborts and returns `{outcome: 'conflict', branch}` with no further
  attempt; the only existing "smart" recovery already in code is
  `isAlreadyMerged` (an ancestry check for the already-merged/no-op case,
  unrelated to this item's scope).
- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the exact playbook D1(a) automates: confirm it's an ID collision (not a
  real dispute), find the real next-free id from `main`, renumber, resolve
  the row-position conflict keeping both rows, force `.fgos/*` back to
  `main`'s content, retry. Written from a real occurrence, `tsk-66l`.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` — the
  exact playbook D1(b) follows: read `approve`'s `output` field, check
  whether the failing test touches the item's own diff, isolate-rerun,
  fix as a separate commit if it's a genuine pre-existing bug, retry via
  `fgos move <id> --to proposed` then `fgos approve <id>`. Written from a
  real occurrence, `tsk-2z3`.
- `docs/specs/runner.md` lines 530-531, 598-603 (RUL34, RUL37) — Iron Law's
  human-operator-confirmation requirement, verified as locked spec text,
  not an implementation default this item is free to loosen.
- `tsk-28w` (existing item, `status: todo`) — the `fgos catchup` crash this
  item explicitly excludes and only references a workaround for.
- `tsk-5t3` (existing item, `status: todo`) — "collect evidence/contracts
  during work so the merge process can detect and use them for Iron Law
  acknowledge" — the natural dependency for `tsk-44f`, not for this item.

## Outstanding questions deferred to planning

- Exactly where the D1(b) diagnosis-and-fix steps execute (inline in the
  `merge-loop` skill's own session using its existing Bash/Edit access, vs.
  delegated to a spawned subagent) is an implementation shape, not a
  product decision — left to `fgos-coding-planning`.
- Whether the D1(a) mechanical auto-resolve lives in `src/runner/merge.mjs`
  itself (a new function alongside `isAlreadyMerged`) or as a pre-step the
  `merge-loop` skill runs before calling `/fgOS:merge-next` again — also an
  implementation shape, left to `fgos-coding-planning`.

## References

- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`
- `docs/explanation/merge-idempotent-on-already-merged-branch.md`
- `plugins/fgOS/skills/merge-loop/SKILL.md`
- `plugins/fgOS/skills/merge-next/SKILL.md`
- `src/runner/merge.mjs`
- `docs/specs/runner.md` (RUL34, RUL37 — Iron Law)
- `tsk-28w`, `tsk-44f`, `tsk-5t3` — related but separate items
