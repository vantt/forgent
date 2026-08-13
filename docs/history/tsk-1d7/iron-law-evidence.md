# tsk-1d7 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs", "src/runner/worktree.mjs"]`, `matchedFlags: []`.

## Test command

Item's own recorded verify:

```
node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs test/runner/worktree.test.mjs
```

## Failing-before (real transcript excerpt, before this item's implementation)

Produced by temporarily reverting only the implementation files (`.githooks/pre-commit`, `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/runner/worktree.mjs`) back to the prior commit while keeping this item's new tests in place (`git checkout <prior-commit> -- <implementation files>`), then rerunning the exact verify command.

`test/runner/worktree.test.mjs` fails to even load — `resyncWorktree` does not exist yet:

```
SyntaxError: The requested module '../../src/runner/worktree.mjs' does not provide an export named 'resyncWorktree'
✖ test/runner/worktree.test.mjs (28.805355ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — the two true-positive detection tests fail (the guard does not exist yet, so a stale/diverged commit goes through unrefused); the no-false-positive test still passes as expected:

```
✖ tsk-1d7: a commit from a worktree whose branch was force-moved forward (ancestor, but behind) is refused, naming fgos resync-worktree (130.367165ms)
  AssertionError [ERR_ASSERTION]: a commit against a stale index must be refused, never silently allowed through
    actual: 0
    expected: 0
    operator: 'notStrictEqual'

✖ tsk-1d7: a commit from a worktree whose branch was rewritten backward (not an ancestor) is refused as diverged (90.833172ms)
  AssertionError [ERR_ASSERTION]: a commit against a diverged (rewritten) branch must be refused
    actual: 0
    expected: 0
    operator: 'notStrictEqual'
```

## Passing-after (real transcript excerpt, after restoring the fix)

```
ℹ tests 62
ℹ suites 0
ℹ pass 62
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3228.469818
```

Full `npm test` also run clean before this evidence was recorded: `tests 3127 / pass 3122 / fail 0` (5 skipped).

## What changed

- `.githooks/pre-commit` — new `staleWorktreeIndexRefusal`, read-only, scoped to `fgw/*` branches, wired unconditionally at the top of `main()` (D1/D2, `docs/history/stale-worktree-index-guard/CONTEXT.md`).
- `src/runner/worktree.mjs` — new exported `resyncWorktree` repair verb (D3), plus a bundled fix: `resyncClaimWorktree`'s own `reset --hard` now re-strips `.fgos/` afterward (shared `stripFgosAfterReset` helper), closing a pre-existing ADR0020 violation.
- `bin/fgos.mjs` / `src/cli/command-registry.mjs` — new `resync-worktree` CLI verb wiring `resyncWorktree` to the current worktree/branch.
