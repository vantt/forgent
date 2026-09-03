---
framework: diataxis
mode: explanation
---
# Why `promote-to-component` reports `merged-parent-rejected` separately

`promote-to-component`'s locked design (per the item's own framing,
"CHỈ khi git thành công thật mới set field parent" — only when git
genuinely succeeds does `parent` get set) requires the state write to
happen strictly *after* a real, confirmed git merge. But that ordering
creates a real edge case worth naming: what happens when the git half
succeeds but the state write itself then fails?

## The real edge case

```js
for (const id of ids) {
  if (id === rootId) {
    results.push({ id, outcome: 'skipped', reason: 'is-root' });
    continue;
  }
  const member = view.work[id];
  const outcome = await retargetMember(repoRoot, member, rootId, timeoutMs ? { timeoutMs } : {});
  if (outcome.outcome === 'merged') {
    // The real git merge already landed at this point — a rejection
    // here (e.g. a deps+parent graph cycle assertNoUnifiedCycle
    // catches) means the bookkeeping half of "CHỈ khi git thành công
    // thật mới set field parent" failed even though the git half
    // truly succeeded. Report that distinctly rather than either
    // claiming a clean 'merged' or letting the exception abort every
    // remaining member's own processing.
    try {
      editWork(dir, { id, patch: { parent: rootId } });
      results.push(outcome);
    } catch (err) {
      results.push({ id, outcome: 'merged-parent-rejected', reason: err.message });
    }
  } else {
    results.push(outcome);
  }
}
```

If `editWork`'s own graph validation (e.g. `assertNoUnifiedCycle`
catching a `deps`+`parent` cycle) rejects the `parent` write, the real
git merge has *already landed* — that part of the work genuinely
succeeded — but the bookkeeping half of "only set `parent` after real
git success" itself failed. This is neither a clean `'merged'` (state
doesn't actually reflect the new parent relationship) nor a total
failure (the git side is real and permanent) — it gets its own distinct
outcome, `merged-parent-rejected`, carrying the real rejection reason.

## Why the loop doesn't abort on this

The alternative — letting the `editWork` exception propagate and abort
the whole `promote-to-component` call — would leave every *remaining*
member unprocessed, even though their own merges might be perfectly
safe and independent. Catching the exception per-member and continuing
the loop means one member's bookkeeping failure never blocks another
member's real progress.

## How the final summary reflects this

```js
const merged = results.filter((r) => r.outcome === 'merged').map((r) => r.id);
const notMerged = results.filter((r) => r.outcome !== 'merged' && r.outcome !== 'skipped');
const { event } = addDecision(dir, {
  text: `promote-to-component: root "${rootId}"${rootCreated ? ' (newly created)' : ' (existing member promoted)'} — merged [${merged.join(', ') || 'none'}]${notMerged.length > 0 ? `, not merged: ${notMerged.map((r) => `${r.id} (${r.reason})`).join(', ')}` : ''}`,
  rationale: 'fgos promote-to-component — converges flat siblings into one component before merging to main, per docs/history/promote-to-component/CONTEXT.md',
  id: rootId,
});
```

`merged-parent-rejected` falls into `notMerged` for reporting purposes —
even though the git side genuinely merged, the item is deliberately
*not* counted among the clean `merged` results, because its state
doesn't actually reflect that yet. One real decision record summarizes
every member's outcome (merged, not-merged with reason, or skipped for
the root itself) — a single audit trail for the whole promotion attempt,
not one record per member.

## A fresh root's own minimal shape

When `--root-title` creates a brand-new root instead of promoting an
existing member, that root is deliberately a pure milestone-style
grouping item with no code of its own — mirroring the `tsk-5t3a`
precedent's own minimal, trivially-true shape (`risk: 'low'`,
`verify: 'true'`). It exists purely to hold the `parent` relationships
together, not to carry any implementation itself.
