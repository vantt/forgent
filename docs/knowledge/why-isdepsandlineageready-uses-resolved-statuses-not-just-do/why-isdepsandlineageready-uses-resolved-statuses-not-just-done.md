---
framework: diataxis
mode: explanation
---
# Why `isDepsAndLineageReady` uses `RESOLVED_STATUSES`, not just `done`

`isDepsAndLineageReady` (`frontier.mjs`, used by `bin/fgos.mjs`'s
`claim`/`take` gate for a `todo` item) only checked
`status === 'done'` literally — not `RESOLVED_STATUSES` (which also
includes `delivered`, `retrospective`, `cleanup`, `wontfix`), the same
set `frontier()` right next to it already used. The function's own
comment claimed it enforced the "SAME deps-done... clauses `frontier`
enforces" — but the code disagreed with its own comment.

## The real drift this caused

An item whose dependency sat at `status: delivered` — genuinely merged
into `main`, verify already passed, just not yet through the
retrospective/cleanup synthesis pipeline to reach `done` — was treated
as `resolved` by `frontier()` (correctly cleared for dispatch/execute),
but `isDepsAndLineageReady()` still refused to let a *dependent* item be
claimed on top of it. The dependent was locked out of claiming even
though its dependency's real work was already finished.

## The live incident this item exists to fix

On 2026-08-02: `tsk-4voj` sat at `status: delivered` — its merge commit
`6daef60` was on `main`, its decisions (D1/D2) were locked, it just
hadn't gone through the retired `compound-learn` pipeline to `done`
yet. `tsk-3bn` (which depends on `tsk-4voj`) genuinely could not be
claimed under this logic — actively blocking the merge-harness work
cluster this session was mid-way through. (Both `tsk-4voj` and `tsk-3bn`
were later synthesized by this same retro-loop sweep — this bug was
blocking real, concrete work, not a hypothetical.)

## The fix

```js
export function isDepsAndLineageReady(view, id) {
  const work = view?.work ?? {};
  const item = work[id];
  if (!item) return false;
  const childrenByParent = indexChildrenByParent(work);
  if (hasOpenDescendant(id, work, childrenByParent)) return false;
  return item.deps.every((dep) => RESOLVED_STATUSES.has(work[dep]?.status));
}
```

One line changed: `work[dep]?.status === 'done'` became
`RESOLVED_STATUSES.has(work[dep]?.status)` — matching `frontier()`'s own
check exactly, closing the drift between the comment's claim and the
code's real behavior.

## Why this was treated as `medium` risk despite being a one-line fix

`isDepsAndLineageReady` gates claiming **system-wide** — every `todo`
item, not scoped to any one cluster. A wrong fix in either direction has
real consequences: too permissive would open claiming early for a
dependency that genuinely isn't done yet; too conservative keeps the
exact bug this item exists to close. Both directions needed explicit
test coverage — every `RESOLVED` status must pass, every non-resolved
status must still block — not just the specific case that surfaced the
bug.

## Why this stayed a single, unsplit fix

`judgeDecompose` returned pass-through: single root cause, single fix
location (`frontier.mjs`), a one-line logic change, and the existing
test suite already covered both the resolved and unresolved dependency
cases — risk was managed by a verify command gating both directions,
not by splitting the change into smaller pieces that wouldn't have
reduced implementation or test complexity.
