# Plan: advisory ADR0020 hint on return's blocked-friction detail

Item: `tsk-4o9`. Mode: **small** — one new pure helper, two call sites in
one existing function, no split.

## Approach

Per D3/D4 (CONTEXT.md): add a pure helper in `src/runner/goal-check.mjs`
(next to `runGoalCheck`, the module that already owns the `output` shape):

```js
const FGOS_HINT_RE = /\.fgos\b/;
const MISSING_RE = /ENOENT|no such file|not found/i;

/**
 * Returns an advisory hint string when `output` (a failed goal-check's
 * combined stdout+stderr) looks like the verify command depended on
 * `.fgos/`'s presence — which a detached worktree never has (ADR0020,
 * bin/fgos.mjs's `return` re-verify). Returns null otherwise. Never
 * changes pass/fail; purely descriptive, appended to an already-failing
 * friction record.
 */
export function detachedWorktreeFgosHint(output) {
  if (typeof output !== 'string') return null;
  if (!FGOS_HINT_RE.test(output) || !MISSING_RE.test(output)) return null;
  return 'hint: this verify command\'s output mentions .fgos/ together with a missing-file signal -- a detached worktree (bin/fgos.mjs\'s return re-verify) never carries .fgos/ (ADR0020); if that is the real cause, redesign this item\'s verify to check real code/behavior instead of .fgos/ presence.';
}
```

Wire it into both of `bin/fgos.mjs`'s `return` blocked paths
(`:2472-2488` branch-source, `:2538-2551` main-source): after computing
`check`, when `!check.passed && !check.timedOut`, call
`detachedWorktreeFgosHint(check.output)` and, when non-null, append it to
the existing `detail` string (e.g. `` `${detail}\n${hint}` ``) before the
`addFriction` call. A timeout (`check.timedOut`) is explicitly excluded —
per the existing `tsk-53o` comment right there, a timeout is not proof of
a real verify failure, so it gets no hint either (nothing to diagnose).

Impact-analysis posture: **degraded** (GitNexus present, index stale per
this session's own PostToolUse hook). Low actual risk: `runGoalCheck`'s
own return shape is unchanged (`detachedWorktreeFgosHint` is a NEW,
separate export, not a modification to any existing function's
signature); the two call sites only ever APPEND to an already-computed
`detail` string on an already-failing path — a currently-passing verify
never reaches this code at all.

## Cases

- **Boundary**: `check.output` is empty string or the failure has nothing
  to do with `.fgos/` (e.g. a real assertion failure) — `detachedWorktreeFgosHint`
  returns `null`, `detail` is unchanged, byte-identical to today's
  behavior.
- **Existing behavior unchanged**: every currently-passing verify's
  `return` call is untouched (the hint only ever fires inside the
  already-existing blocked branch); no currently-blocked item is
  affected differently unless its own failure output happens to match
  both regexes.
- **Regression guard against the confirmed false-positive class**: the 4
  items whose CURRENT verify legitimately contains `.fgos/` without
  depending on it (`tsk-2ta`, `tsk-2ta-4`, `tsk-f38`, `tsk-5hv` — absolute
  paths, doc-content greps, exclusion globs, per RESEARCH.md) must never
  produce a hint if their verify happens to fail for an unrelated reason
  — covered by a unit test on `detachedWorktreeFgosHint` directly with a
  representative "unrelated failure, incidentally mentions .fgos/ in an
  exclusion glob, no ENOENT/not-found" output string.
- **Positive case**: an output string shaped like `tsk-3fj`'s own real
  historical failure (`.fgos/config.json` + `ENOENT`) produces the hint.

## Outstanding questions

None
