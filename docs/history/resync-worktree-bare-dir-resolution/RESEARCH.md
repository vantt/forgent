# Research: tsk-jgs — `resync-worktree` bare invocation fails to resolve main checkout

## Round 1 (discovery, 2026-08-13)

**Asked:** verify the bug's root-cause claim against current repo state —
does `bin/fgos.mjs`'s `resync-worktree` case still pass `dir` straight
through instead of `path.dirname(dir)`; does another verb in the same file
really use the `path.dirname(dir)` pattern; is the claimed test-coverage
gap (no subprocess-level test for bare invocation) still real; what does
`resyncWorktree()` do when `repoRoot` is wrong.

**Checked / found:**

1. `bin/fgos.mjs:4872-4876`, current `resync-worktree` case:
   ```js
   case 'resync-worktree': {
     const worktreePath = flags.path ? path.resolve(flags.path) : process.cwd();
     const branch = flags.branch ?? gitAt(worktreePath, ['symbolic-ref', '--short', 'HEAD']).trim();
     return resyncWorktree(dir, worktreePath, branch);
   }
   ```
   `dir` here is `dataDir(flags.dir)` (`bin/fgos.mjs:94-105`), which
   resolves to `<cwd-or-override>/.fgos` — the state-store directory, not
   the repo root. Passed straight through as `resyncWorktree`'s first
   arg. Confirmed: the root-cause claim is accurate, current code, not
   already fixed. The comment right above the case (`bin/fgos.mjs:4867-
   4871`) asserts "`dir` ... is always the MAIN checkout" — that
   assertion is itself wrong and is the likely source of the bug.

2. `resyncWorktree`'s own signature (`src/runner/worktree.mjs:711`):
   `export function resyncWorktree(repoRoot, worktreePath, branch)` — first
   param is genuinely named/used as `repoRoot` (`lastSyncedCommit(repoRoot,
   worktreePath)`, `git(repoRoot, [...])` at line 720). Confirms passing
   the `.fgos` dir instead of the repo root breaks every git call inside.

3. The `path.dirname(dir)` pattern is used at ~13 other call sites in the
   same file to turn the `.fgos` dir back into the repo root, e.g.
   `main-checkout-reset` at `bin/fgos.mjs:4901`
   (`const repoRoot = path.dirname(dir);`), and also lines 709, 1689,
   2634, 2737, 2812, 3258, 3991, 4206 (grep: `path.dirname(dir)`, 13
   matches across the file). Confirms the described "every other
   git-operating verb" pattern really exists and is the fix shape to
   follow.

4. `resyncWorktree` (`src/runner/worktree.mjs:711-718`): when
   `lastSyncedCommit(repoRoot, worktreePath)` can't read the reflog (which
   happens when `repoRoot` is the wrong directory, since `git(repoRoot,
   [...])` runs with `cwd: repoRoot` per `worktree.mjs:107-108`, and
   `.fgos/` is not a git working tree), it throws exactly:
   `resync-worktree: could not read "<worktreePath>"'s own HEAD reflog to
   determine what commit it was last synced to.` — this matches the bug
   report's reproduced error message verbatim.

5. Test coverage (`grep -rn "resync-worktree|resyncWorktree" test/`):
   - `test/runner/worktree.test.mjs` — 7 tests, all call `resyncWorktree(repoRoot, wt.path, branch)` directly as a function with an explicit, correct `repoRoot` — never through the CLI, never with a wrong/`.fgos`-shaped root.
   - `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:152-165` — only asserts the pre-commit hook's refusal message *names* `fgos resync-worktree`; never actually invokes it.
   - No test anywhere invokes `node bin/fgos.mjs resync-worktree` as a real subprocess, bare, from inside a worktree. Confirmed: the claimed test-coverage gap is real, not already closed.

6. `src/cli/command-registry.mjs:1124-1141`, `resync-worktree` entry:
   `examples: ['fgos resync-worktree', 'fgos resync-worktree --dir /path/to/main-checkout']`, `parameters.required: []` (no required fields at all — `--dir` isn't even a declared parameter here, it's a global flag). Confirms the compounding claim: the registry advertises the bare form as a normal example with nothing marking it as broken.

**Verdict: clear.** All 4 root-cause/evidence questions confirmed against
current code with citations above; no open ambiguity. Verify: `npm test`
(project's standard DoD proof — touches `bin/fgos.mjs`, needs the full
cli+runner+e2e suite green, not just a narrow file).

## Round 2 (planning, 2026-08-13) — refining the fix shape

**Asked (self, during Approach step):** is `path.dirname(dir)` (round 1's
proposed fix shape, copying the pattern used at `main-checkout-reset` etc.)
actually correct for the BARE-invocation case here, or does it just move
the bug?

**Checked / found:** `dir` = `dataDir(flags.dir)`
(`bin/fgos.mjs:94-105`). When `flags.dir` is undefined (the bare case this
bug is about), `dataDir` returns `resolveFgosDir(process.cwd(), {strict:
true})` — **cwd-strict, never git-resolved** (`bin/fgos.mjs:101-104`'s own
comment: "this CLI's `.fgos/` always lives under the caller's own cwd,
never git-resolved upward"). Run bare from inside the stale worktree, `cwd`
IS the worktree, so `dir` = `<worktreePath>/.fgos` and `path.dirname(dir)`
= `worktreePath` — **still the worktree, not the main checkout**. Applying
round 1's `path.dirname(dir)` pattern verbatim would not actually fix the
bare-invocation case (it happens to also explain the literal crash: `dir`
itself, `<worktreePath>/.fgos`, does not exist on disk per ADR0020, so
`execFileSync`'s `cwd: repoRoot` in `worktree.mjs`'s `git()` helper
(`src/runner/worktree.mjs:107-108`) throws ENOENT before git even runs —
caught by `lastSyncedCommit`'s try/catch (`worktree.mjs:570-578`), which
returns `null`, producing the exact "could not read HEAD reflog" message
reported).

The codebase already has the correct, established, exported resolver for
exactly this "am I possibly inside a worktree, get me the real main
checkout root" problem: `resolveMainCheckoutRoot(cwd)`
(`src/runner/paths.mjs:72-85`) — runs `git rev-parse --path-format=absolute
--git-common-dir` (works correctly from inside a linked worktree, unlike
`--show-toplevel`) then `path.dirname()`s the result. Already used the
same way at `src/runner/dispatch.mjs:1253,1320,1402`
(`repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd)` —
explicit override wins, else git-resolved, else plain fallback) and
`src/setup/registrations.mjs:198-204`. `bin/fgos.mjs:26` already imports
from `../src/runner/paths.mjs` (`resolveFgosDir`, `fgosDirFromRoot`), so
adding `resolveMainCheckoutRoot` to that same import is a one-line change,
not a new dependency.

**Revised fix shape:** in the `resync-worktree` case
(`bin/fgos.mjs:4872-4876`), resolve `repoRoot` as: the caller's explicit
`--dir` when given (`path.dirname(dir)` — correct in that branch, `dir`
already encodes the caller-supplied root), else
`resolveMainCheckoutRoot(worktreePath) ?? path.dirname(dir)` — the same
override-then-git-resolve-then-fallback shape `dispatch.mjs` already uses.
Also fix the misleading comment at `bin/fgos.mjs:4867-4871`, which asserts
"`dir` ... is always the MAIN checkout" — that assumption is the actual
root cause of the bug (the case code was written as if `dataDir()`
git-resolved upward, which its own doc comment two lines above says it
explicitly does not).

Once this ships, `src/cli/command-registry.mjs`'s `resync-worktree` entry
(round 1 finding 6) needs no separate fix — it currently describes the
bare form as a normal example precisely because that is how the verb is
*meant* to work; the fix makes reality match the existing docs rather than
requiring the docs to be changed to match the bug.

**Verdict: still clear**, verify unchanged (`npm test`) — this is a
refinement of the fix's mechanism, not a new open question; no
`CONTEXT.md` gap since this item never had one (clear discovery skipped
`exploring`).
