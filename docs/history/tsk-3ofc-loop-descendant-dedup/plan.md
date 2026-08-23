# plan.md — tsk-3ofc

Mode: tiny (0 flags: no auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing-covered-
behavior change, weak-proof area, or multi-domain concern apply — this is
a two-line comment addition with no call-site or behavior change, per D1
in CONTEXT.md).

## Approach

Chosen path: add a one-line cross-reference comment to each side of the
already-documented divergence between `src/runner/loop.mjs`'s
`hasStillNeededDescendant` and `src/state/frontier.mjs`'s
`hasOpenDescendant` (CONTEXT.md D1), so a future reader scanning either
function sees the lookalike exists elsewhere and why it isn't reused.

Alternative rejected: the item's original proposal (delete
`hasStillNeededDescendant`, replace its call site with
`hasOpenDescendant`) — rejected per CONTEXT.md D1, would silently
reintroduce the tsk-577 false-positive-block behavior.

Files touched (single file group, no ordering dependency — both edits
are independent doc comments in files that do not depend on each other's
edit order):
- `src/runner/loop.mjs` — extend the existing docstring above
  `hasStillNeededDescendant` (`loop.mjs:331-343`) with an explicit
  pointer to `frontier.mjs`'s `hasOpenDescendant`.
- `src/state/frontier.mjs` — add a docstring line above `hasOpenDescendant`
  (`frontier.mjs:308-313`) pointing back to `loop.mjs`'s
  `hasStillNeededDescendant`, since no such pointer exists there today.

`fgos graph --json` was checked: `tsk-3ofc` has no deps and sits in its
own single-item component (no `criticalPath`/`topUnblock` ordering
applies to a standalone, single-piece item).

Risk map: **low** — comment-only, no call sites changed, no exported
signature changed. Proof point: run the existing regression suite for
the touched file to confirm zero behavior change, plus a mechanical
check that both cross-reference comments actually landed.

Impact-analysis posture: `full` (GitNexus registered and `present`,
confirmed via `fgos tool query --capability impact-analysis --status
present`). Not load-bearing here — a two-line comment addition touches
no call graph edges, so this posture is recorded for completeness only,
per CONTEXT.md's own note.

## Shape

Single piece, no split. Direct note (tiny mode):

1. In `loop.mjs`, extend the existing docstring (currently ending "Do
   not consolidate this with `hasOpenDescendant` — the two intentionally
   answer different questions.") with a one-line pointer: "See
   `frontier.mjs`'s `hasOpenDescendant` for the narrower, resolved-status
   check this deliberately diverges from."
2. In `frontier.mjs`, add a line to the comment above `hasOpenDescendant`
   (`frontier.mjs:308-313`): "See `loop.mjs`'s `hasStillNeededDescendant`
   for a deliberately BROADER 'still needed' variant used by
   `startupReap`'s orphan-branch pruning — the two intentionally answer
   different questions, do not consolidate."

No new cases to sketch beyond the above — this is a comment addition,
not new logic; nothing to prove against empty/boundary input or
concurrent access.

## Verify

```
node --test test/runner/loop.test.mjs && grep -q "hasOpenDescendant" src/runner/loop.mjs && grep -q "hasStillNeededDescendant" src/state/frontier.mjs
```

Proves: (1) the existing regression suite for the touched file still
passes unchanged (no behavior regression), (2) both cross-reference
comments actually landed in the source, not just described here.

## Outstanding questions

None
