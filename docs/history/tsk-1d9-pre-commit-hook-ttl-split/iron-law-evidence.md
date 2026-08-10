# Iron Law evidence — tsk-1d9

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/main-checkout-lock.mjs"]
}
```

`src/runner/main-checkout-lock.mjs` is on `MODULE_RULES`
(`src/evolve/iron-law.mjs`) as a self-modifying-capable module — the file
this item's own diff genuinely changes (adds `HOOK_TTL_MS`), not a
description-keyword false positive.

## Failing-test-first proof

Two new tests, one per touched surface:

- `test/runner/main-checkout-lock.test.mjs`: `HOOK_TTL_MS is a positive
  number strictly shorter than DEFAULT_TTL_MS`
- `test/e2e/main-checkout-lock-hook.test.mjs`: `a git commit succeeds
  against a different-identity lock older than 20s but younger than 3
  minutes, with NO env var override (proves the hook falls back to its
  own short default, not the old 180s one)`

### RED — run against the pre-fix code

Pre-fix `.githooks/pre-commit` and `src/runner/main-checkout-lock.mjs`
restored from `git show 001b73d^:<path>` (the parent of this item's own
implementation commit), with the new tests from the post-fix test files
layered on top:

```
$ node --test --test-name-pattern="HOOK_TTL_MS is a positive number" test/runner/main-checkout-lock.test.mjs

file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1d9-fzQVHB/test/runner/main-checkout-lock.test.mjs:20
  HOOK_TTL_MS,
  ^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/main-checkout-lock.mjs' does not provide an export named 'HOOK_TTL_MS'

ℹ tests 1
ℹ pass 0
ℹ fail 1

$ node --test --test-name-pattern="proves the hook falls back to its own short default" test/e2e/main-checkout-lock-hook.test.mjs

✖ a git commit succeeds against a different-identity lock older than 20s but younger than 3 minutes, with NO env var override (proves the hook falls back to its own short default, not the old 180s one)
  AssertionError [ERR_ASSERTION]: commit refused: another session appears to be actively working in this checkout.
  See docs/how-to-parallel-lanes.md (workshop root, one level up from repo/) for how to work in an isolated worktree/session.

  1 !== 0

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Both failures are real: the unit test fails because `HOOK_TTL_MS` genuinely
doesn't exist pre-fix; the e2e test fails because the pre-fix hook, with no
env var override, falls back to the old shared `DEFAULT_TTL_MS` (3 minutes)
— so a lock backdated 25 seconds still reads as held, and the commit is
correctly refused by the OLD code, proving the test actually exercises the
real gap this item closes.

### GREEN — run against the fixed code

```
$ node --test --test-name-pattern="HOOK_TTL_MS is a positive number" test/runner/main-checkout-lock.test.mjs

✔ HOOK_TTL_MS is a positive number strictly shorter than DEFAULT_TTL_MS (1.790517ms)

ℹ tests 1
ℹ pass 1
ℹ fail 0

$ node --test --test-name-pattern="proves the hook falls back to its own short default" test/e2e/main-checkout-lock-hook.test.mjs

✔ a git commit succeeds against a different-identity lock older than 20s but younger than 3 minutes, with NO env var override (proves the hook falls back to its own short default, not the old 180s one) (71.4492ms)

ℹ tests 1
ℹ pass 1
ℹ fail 0
```

### Full suite, post-fix

```
$ node --test test/runner/main-checkout-lock.test.mjs
ℹ tests 45
ℹ pass 45
ℹ fail 0

$ node --test test/e2e/main-checkout-lock-hook.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0

$ npm test
ℹ tests 2729
ℹ pass 2724
ℹ fail 0
ℹ skipped 5
```

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `src/runner/` (and this file specifically) is self-modifying-
  capable and triggers `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`git show 001b73d^:<path>`
  extracted to `/tmp`, then restored via the same paths from the working
  tree's own already-committed post-fix state — `git diff --stat` against
  those two paths was empty after restoring, confirming byte-identical
  recovery), not paraphrased or fabricated.
- `docs/history/tsk-1d9-pre-commit-hook-ttl-split/CONTEXT.md` D0-D5 and
  `plan.md`'s risk map — the decisions and proof points this evidence
  satisfies.
