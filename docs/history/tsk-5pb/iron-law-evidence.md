# tsk-5pb — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedFlags: ["delete"]`, `matchedModules: []`.

## Test command

`node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`
(item's own `verify`: `node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs && grep -n "restored to that branch's own prior content" AGENTS.md`)

## Failing-before (real transcript excerpt, before this item's `.githooks/pre-commit` edit)

The implementation and its own new tests landed in one commit
(`2d8b70e3`), so the "before" state was reproduced directly: `.githooks/
pre-commit` temporarily reverted to its parent commit's content
(`34c34e87:.githooks/pre-commit`), the new test file left as committed,
then just the `tsk-5pb`-named tests run:

```
$ node --test --test-name-pattern="tsk-5pb" test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs
✖ tsk-5pb: a worktree commit staging a .fgos/ modification on a worker branch is refused (78.616387ms)
✔ tsk-5pb: the same staged .fgos/ modification is allowed on main (not a fgw/* branch) (74.407762ms)
✔ tsk-5pb: a normal commit that never touches .fgos/ succeeds on a worker branch (75.024906ms)
ℹ tests 3
ℹ pass 2
ℹ fail 1

✖ failing tests:
test at test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:349:1
✖ tsk-5pb: a worktree commit staging a .fgos/ modification on a worker branch is refused (78.616387ms)
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0
      at TestContext.<anonymous> (.../test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:356:10)
    actual: 0, expected: 0, operator: 'notStrictEqual'
```

The one test asserting the new refusal behavior fails without the fix
(the commit succeeds, `status === 0`, when it should be refused) — proof
the test is real, not a tautology. The other two (main-checkout
unaffected, ordinary worker commit unaffected) already pass before the
fix, as expected — they assert the ABSENCE of a behavior change, not the
new guard itself.

`.githooks/pre-commit` restored to its committed (fixed) state via `git
checkout -- .githooks/pre-commit` immediately after this run; confirmed
clean via `git diff --stat -- .githooks/pre-commit` (no output).

## Passing-after (real transcript excerpt, after the fix)

```
$ node --test test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs
...
✔ tsk-56u: a legitimate .fgos/ addition/modification (never a deletion) is unaffected -- the guard filters --diff-filter=D only (83.655476ms)
✔ tsk-5pb: a worktree commit staging a .fgos/ modification on a worker branch is refused (81.81864ms)
✔ tsk-5pb: the same staged .fgos/ modification is allowed on main (not a fgw/* branch) (80.677287ms)
✔ tsk-5pb: a normal commit that never touches .fgos/ succeeds on a worker branch (81.798768ms)
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

Full file, 13/13 passing (includes the pre-existing `tsk-sir`/`tsk-1d7`/
`tsk-2cl`/`tsk-56u` coverage — no regression on any of it). Plus the
`AGENTS.md` grep half of the item's own `verify`:

```
$ grep -n "restored to that branch's own prior content" AGENTS.md
137:**Never resolve a `.fgos/` merge conflict on a worker branch by committing a modified `.fgos/*` file** (tsk-5pb: ...) ...
```

## What changed

`.githooks/pre-commit` — new `stagedFgosChangesOnWorkerBranch
(committingToplevel)`, wired into `main()` right after the existing
`stagedFgosDeletions` check: on a `fgw/*` branch, any staged path under
`.fgos/` (Added/Copied/Modified/Renamed/Deleted — no `--diff-filter`) is
refused; unaffected everywhere else (main checkout keeps its own
legitimate `.fgos/` writes). `AGENTS.md` — one new safety-net bullet.
`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — three new
cases proving the refusal, the main-checkout carve-out, and no false
positive on an ordinary worker-branch commit.
