# tsk-4hkd — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: []`, `matchedFlags: ["sự cố"]`.

## Test command

Item's own `verify`: `npm test -- test/e2e/main-checkout-lock-hook.test.mjs`
(also run scoped, for the two new cases specifically:
`node --test --test-name-pattern="fgw/\*" test/e2e/main-checkout-lock-hook.test.mjs`)

## Failing-before (real transcript excerpt, before this item's `.githooks/pre-commit` edit)

Scoped run against the pre-fix hook (`git show HEAD:.githooks/pre-commit`
temporarily restored, test file already carrying the two new cases):

```
✖ a git commit on the main checkout is refused when checked out to a fgw/* branch (47.970172ms)
✔ a git commit inside a linked (non-detached) worktree on a fgw/* branch still succeeds (64.34702ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:
test at test/e2e/main-checkout-lock-hook.test.mjs:337:1
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0
    ...
    actual: 0,
    expected: 0,
    operator: 'notStrictEqual',
```

## Passing-after (real transcript excerpt, after the fix)

```
✔ a git commit on the main checkout is refused when checked out to a fgw/* branch (66.107044ms)
✔ a git commit inside a linked (non-detached) worktree on a fgw/* branch still succeeds (63.708267ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full item verify (`npm test -- test/e2e/main-checkout-lock-hook.test.mjs`,
which this repo's `npm test` script runs as part of the whole suite):
`tests 2367 / pass 2362 / fail 0` (5 skipped, none failing).

## What changed

`.githooks/pre-commit` gained `currentFgwBranchIfMainCheckout(repoRoot)` and
one more `refuse(...)` branch in `main()`: resolves `git rev-parse
--path-format=absolute --git-dir` vs `--git-common-dir` to tell the main
checkout apart from a linked worktree (equal only for the main checkout);
if it's the main checkout and `git symbolic-ref --short -q HEAD` matches
`^fgw/`, the commit is refused. Linked worktrees (which legitimately live on
`fgw/*` branches) are unaffected. `test/e2e/main-checkout-lock-hook.test.mjs`
gained two cases (`initTempRepoWithHookOnBranch`,
`initTempRepoWithFgwWorktree`) proving both the refusal and the
worktree-unaffected side.
