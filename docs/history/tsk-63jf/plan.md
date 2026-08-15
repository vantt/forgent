# plan.md — tsk-63jf: 2 stale text references (constant name + renamed status in a comment)

Mode: tiny

0 flags — text-only, no logic/behavior change, both locations already
precisely identified in the item's own description with exact
file:line/old-text/new-text. No CONTEXT.md: discovery verdict was clear.

## Approach

Two direct text substitutions, already applied:
1. `plugins/fgOS/skills/merge-loop/SKILL.md` — `TAIL_RESOLVED_STATUSES`
   (a constant that no longer exists as the cited source; the real
   generalizing function is `isResolvedStatus`, `src/state/frontier.mjs`)
   → `isResolvedStatus`. The described BEHAVIOR was already correct
   (wontfix does count as finished) — only the citation was wrong.
2. `src/state/status-fsm.mjs` line ~46 (doc comment) — `proposed` (renamed
   to `awaiting-approval` per decision 0006→0024, already fixed elsewhere
   per tsk-3q8) → `awaiting-approval`.

Touches `status-fsm.mjs`, which trips the Iron Law's `equals` module rule
even for a comment-only change (the item's own text already names this).

## Shape

Single phase, both edits already made. Verify (real, runnable, per
`docs/how-to/write-verify-for-a-skill-prose-change.md`'s POSITIVE/NEGATIVE
shape): `node --test test/state/fsm.test.mjs` (proves the comment-only
edit didn't break the file) plus grep POSITIVE (`isResolvedStatus`,
`awaiting-approval\` directly` present) and NEGATIVE
(`TAIL_RESOLVED_STATUSES`, `proposed\` directly` absent). Deviates from the
how-to's literal `npm test` in favor of the scoped file: the full suite
currently has one pre-existing, unrelated failure
(`test/runner/dispatch.test.mjs`'s `capacities.gather` assertion, broken
by a prior unrelated commit removing that capacity from `.fgos/
config.json`) that would spuriously fail this item's own verify for a
reason this item never touches.

## Split decision

No split — one item, two locations, same stale-reference class (matches
how it was filed, grouped with the already-fixed tsk-3q8 sibling case).

## Outstanding questions

None
