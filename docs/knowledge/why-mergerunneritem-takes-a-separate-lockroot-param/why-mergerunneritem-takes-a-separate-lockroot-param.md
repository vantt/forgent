---
framework: diataxis
mode: explanation
---
# Why `mergeRunnerItem` takes a separate `lockRoot` param

A leaf `approve` was holding the main-checkout lock against a throwaway
directory, not the real checkout. `bin/fgos.mjs`'s leaf-approve call site
passed `ephemeral.path` (a fresh worktree `createWorktree` had just made)
into `mergeRunnerItem`, so `merge.mjs` resolved `fgosDir` to
`<ephemeral>/.fgos`. But `worktree.mjs` had already stripped that exact
directory per ADR0020, so `acquireMainCheckoutLock`'s own
`fs.mkdirSync` simply recreated it fresh on every call — the lock file
was always brand new, always returned `ACQUIRED`, and could never
actually contend with anything.

## The consequence

The real lock at `<repoRoot>/.fgos/main-checkout.lock` was never held
during a leaf→root merge. The gap the comment at the original call site
claimed was closed — `git merge --no-commit`, the `.fgos`-write check,
and verify all running unprotected until the pre-commit hook's own
narrower lock kicked in at the final commit — stayed open for every leaf
approve. Root approve wasn't affected: it already passed the real
`repoRoot` (`bin/fgos.mjs:1890`).

The pre-commit hook itself does resolve the real repo root (it derives
its path from its own hook-file location,
`.githooks/pre-commit: path.resolve(__dirname,'..')`), so it does lock
the real `.fgos` — but only at the moment of commit, which doesn't cover
the merge+verify phase before it.

A side effect: recreating `.fgos` inside the ephemeral worktree violated
ADR0020's no-`.fgos`-in-worktree invariant, even though `.gitignore:16`
kept the lock file itself out of `git status`.

## Why the fix isn't "just pass the real repoRoot"

The tempting fix — swap the real `repoRoot` in for `ephemeral.path` —
doesn't work, because `mergeRunnerItem` used the *same* parameter for
both where it looks up `.fgos` to lock (`merge.mjs:371`, at the time of
filing) and the `cwd` it runs `git merge` from (`merge.mjs:403`).
Passing the real `repoRoot` would merge straight into `main` instead of
the throwaway `fgw/<root>` — defeating the whole purpose of the ephemeral
worktree. The two concerns had to be split into separate parameters.

## The fix — a separate `lockRoot` parameter

```js
export async function mergeRunnerItem(repoRoot, item, { timeoutMs, lockRoot = repoRoot } = {}) {
  ...
  // tsk-2eq: `lockRoot` defaults to `repoRoot` (root->main approve's own
  // call site, unaffected) but a leaf->parent approve passes the real repo
  // root here explicitly while `repoRoot` itself stays the ephemeral
  // worktree used as the git-op cwd below. Resolving `fgosDir` off a bare
  // `repoRoot` would point inside that ephemeral worktree — a directory
  // `createWorktree` (worktree.mjs) already strips `.fgos/` from per
  // ADR0020 — so `acquireMainCheckoutLock` would silently recreate it
  // fresh every call and never actually contend with the real
  // `<repoRoot>/.fgos/main-checkout.lock` a concurrent leaf merge holds.
  const fgosDir = path.join(lockRoot, '.fgos');
  ...
}
```

`lockRoot` defaults to `repoRoot`, so the root→main approve call site
needed no change at all. The leaf-approve call site
(`bin/fgos.mjs:2171`) now passes `{ timeoutMs, lockRoot: repoRoot }`
while `ephemeral.path` stays the first positional argument — the actual
`git-op` cwd — untouched.

## Verified with real tests, not just the fix

`test/runner/merge.test.mjs` (commit `8d5e524`) added two tests:
"mergeRunnerItem resolves the main-checkout lock against `lockRoot`, not
`repoRoot`" and "mergeRunnerItem refuses when `lockRoot` (not
`repoRoot`) already holds the main-checkout lock." The first asserts
`fs.existsSync(path.join(lockRoot,'.fgos')) === true` and
`fs.existsSync(path.join(repoRoot,'.fgos')) === false` — proving the
ephemeral worktree never gets its `.fgos` directory recreated, so
ADR0020's invariant holds after a merge runs to completion.

## The design-conflict precondition that turned out not to apply

The item's original description flagged a possible conflict with
`tsk-45y` (a proposal that worktrees shouldn't be blocked by the
main-checkout lock at all) as a blocking precondition to resolve before
fixing this. A code-scan (recorded as this item's own D3) disproved
that: `main-checkout.lock` and `events.lock` have always been two
separate lock files; `main-checkout.lock` only ever holds during the
claim-window and the merge/verify/commit-window, never during ordinary
status writes. ADR0020 already strips `.fgos` from every dispatch
worktree at creation — exactly what `tsk-45y` wanted. `tsk-45y`'s actual
complaint matched a different, already-done item (`tsk-56t` —
`EnterWorktree` plus a cwd-relative `dataDir` that could recreate a
divergent `.fgos/events.jsonl`), not `main-checkout.lock` at all. This
fix's direction — separating `lockRoot` from the git-op `cwd` — never
depended on `tsk-45y`'s outcome, since the two items address different
mechanisms.
