# Reviewer Report — Brief 1

**Task:** In one short paragraph, say what `src/runner/execution/patterns/role-tasks.mjs` is for and name the one function it exports besides the constant. Read the file; do not guess.

**Verdict:** PASS

## What I checked

I read the producer's report (`producer/1/runs/01/outbox/report-1.md`) and the file under review (`src/runner/execution/patterns/role-tasks.mjs`) directly, then confirmed the export surface with `grep '^export'` and the worktree state with `git log -1` / `git status` / `git diff`.

## Findings

No defects or missing items. The producer's single descriptive paragraph is accurate on every point:

1. **Purpose claim** — "establishes the semantic purpose of each collaboration-pattern role by providing role-specific task templates in `DEFAULT_ROLE_TASKS` (for synthesizer, reviewer, and red-team)." Verified against the file header (lines 1-3: "What each role of a collaboration pattern is FOR, as data, and the one helper that tells a role its task") and the three keys at line 11 (`synthesizer`, `reviewer`, `'red-team'`).

2. **Single function besides the constant** — "It exports exactly one function besides that constant: `roleUnit`." Verified: `grep '^export'` returns exactly two lines — `export const DEFAULT_ROLE_TASKS` (line 11) and `export function roleUnit` (line 58). The `wrap` helper (line 45) is a plain function, **not** exported.

3. **Behavioral description of `roleUnit`** — "conditionally wraps a unit's objective for a given role (supporting overrides via `params.roleTasks` and optional findings injection) and returns the (possibly augmented) unit." Verified against lines 58-72: returns the same unit when there is no task and no findings; honors `params?.roleTasks?.[role] ?? params?.roleTasks?.[kind]` overrides; appends previous-round findings; otherwise returns `{ ...unit, objective }`.

## Worktree state

`git log -1` → `5536cca15 fix(runner): give each role of a Unit run its own task`. `git status` / `git diff` show no source mutations — only untracked `.fgos/backups/` and `.fgos/events/*.jsonl` runtime state. Consistent with a read-only task; nothing was changed that should have been reviewed as a code diff.

## Conclusion

The producer satisfied the read-only objective: a short paragraph stating what the file is for and naming `roleUnit` as the one function it exports besides the constant, grounded in a direct read of the file. Nothing is wrong or missing.
