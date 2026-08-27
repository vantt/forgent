---
framework: diataxis
mode: explanation
---
# Why `approve` blocks closing a milestone with drifted targets

This closes the loop back to the real incident that started the whole
merge-conductor-harness-v2 effort: `tsk-3bn`'s own origin incident was
closing a milestone (a `targets`-bearing item) while one of its targets'
resolved root branches had drifted ahead of `main` from a later leaf
merge — nothing warned or blocked it, and code that was genuinely `done`
briefly looked like it had vanished from `main`.

## The wiring

```js
// Close-out drift guard (tsk-62y, docs/history/
// tsk-3bn-merge-conductor-harness-v2/): tsk-3bn's own origin incident
// was closing a milestone (a `targets`-bearing item) while ONE of its
// targets' resolved root branches had drifted ahead of main from a
// later leaf merge -- nothing warned or blocked it. `targets` is the
// real, already-existing field a milestone uses ("a milestone's
// targets are ordinary work ids", work.mjs). Only runs when `targets`
// is a non-empty array -- an ordinary (non-milestone) approve is
// completely unaffected. Refuses BEFORE any git mutation, same
// "acknowledge to override" shape as the Iron Law gate right below --
// `--acknowledge-drift` is a deliberate human override, not a bypass
// to route around silently.
if (Array.isArray(item.targets) && item.targets.length > 0) {
  const drift = driftStatus(repoRoot, view);
  const driftedTargets = [];
  for (const targetId of item.targets) {
    if (!view.work[targetId]) continue;
    const targetRoot = resolveRoot(view, targetId);
    const status = drift[targetRoot];
    if (status?.needsSync) {
      driftedTargets.push({ targetId, root: targetRoot, ...status });
    }
  }
  if (driftedTargets.length > 0 && flags['acknowledge-drift'] !== true) {
    const summary = driftedTargets
      .map((d) => `${d.targetId} (root ${d.root}: ${d.branch} is ${d.aheadOfTarget} commit(s) ahead of ${d.target})`)
      .join(', ');
    throw new StoreError(
      'validation',
      `approve: "${id}" targets item(s) whose root branch has unsynced drift: ${summary}. `
        + `Run "fgos sync-root <root-id>" first, or re-run with --acknowledge-drift to close anyway.`,
    );
  }
}
```

## Why this only affects milestones

The guard only runs when `item.targets` is a non-empty array — the
existing, already-established shape a milestone uses ("a milestone's
targets are ordinary work ids", per `work.mjs`). An ordinary
(non-milestone) `approve` call is completely unaffected; this is
additive, scoped precisely to the one closing action that caused the
real incident.

## Why it refuses instead of silently syncing

The guard refuses *before* any git mutation — the same shape the Iron
Law gate right below it already uses. It never auto-runs `sync-root` on
the person's behalf; the error message tells them exactly what to do
(`fgos sync-root <root-id>`) and names every drifted target with its
real ahead-count, so the person can judge whether syncing first is
correct, or whether they genuinely want to close anyway.

## Why the override is a deliberate acknowledgment, not a silent bypass

`--acknowledge-drift` exists as a real escape hatch — closing a
milestone whose target has minor drift may sometimes be a legitimate,
informed choice — but it requires the same explicit flag pattern the
Iron Law gate already established (`--acknowledge-iron-law`), never a
route that silently skips the check. A person has to actively choose to
override, with the drift summary already shown to them.

## How this item itself was closed

Same pull-door reasoning as its siblings `tsk-5m7`/`tsk-50i`: code
committed directly on `fgw/tsk-3bn` (worked inside the root's own
worktree, no separate `fgw/tsk-62y` branch), so `approve`'s worktree
guard structurally refuses to run from here — closed via `fgos move` to
`delivered` instead. Iron Law was `required: false`, and `return` had
already verified 2189/2189 tests passing before this transition.
