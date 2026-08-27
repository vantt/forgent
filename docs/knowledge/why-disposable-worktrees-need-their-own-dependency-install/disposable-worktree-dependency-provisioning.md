---
framework: diataxis
mode: explanation
---
# Why disposable worktrees need their own dependency install

fgOS creates short-lived, disposable git worktrees in two places: `fgos
return`'s branch-source verify (a detached checkout of the branch's own
tip, used only to run `verify` and then discarded) and the headless
runner's own worker/leaf dispatch (`createWorktree`, used by every claim
`claim-port.mjs` forks). Both checkouts only ever contain what git tracks
— and `node_modules` is never git-tracked. For most of this repo's
history that was a non-issue: `forgent` declared zero real npm
dependencies, so `npm test` never needed `node_modules` to pass in a
fresh worktree.

That stopped being true the moment `package.json` gained its first real
dependency (`yaml`). From that point on, a disposable worktree checked
out at a branch declaring that dependency would fail `verify` with
`Cannot find package 'yaml'` — not because the branch's own code was
wrong, but because nothing had ever installed anything into that
worktree's own directory.

## The real failure, reproduced

The gap surfaced for real, not hypothetically: `tsk-32n`'s own branch
(a legitimate feature carrying that new dependency, inherited from a
merged cluster) hit exactly this when its own `fgos return` ran:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'yaml' imported from
/tmp/fgos-return-Akk1Ee/scripts/project-agents.mjs
```

## Two independent fixes, one root cause

Two fixes for this same root cause landed independently and in parallel:
a direct commit to `main` symlinked the host repo's own `node_modules`
into a fresh worktree — instant, no network, but only ever as good as
whatever the host repo itself already had installed. A second fix
(`tsk-2vd`) instead runs a real `npm ci`/`npm install` inside the
worktree itself, scoped to that worktree's own `package.json`.

The two disagree on exactly the case that exposed the bug in the first
place: a worktree checked out at a branch whose `package.json` declares a
dependency the *host repo* hasn't installed yet — because that branch
hasn't merged to the host's own default branch. A symlink to the host's
`node_modules` would still be missing that dependency; installing inside
the worktree itself gets it right regardless of what the host has. The
install approach was kept; the symlink was removed when the two fixes
collided as a real git merge conflict in `src/runner/worktree.mjs`.

## The bootstrap paradox

Proving the fix through the exact command it fixes (`fgos return`) turned
out to be its own small puzzle: `fgos return` always runs from the main
checkout's own installed `bin/fgos.mjs` — never from a feature branch's
copy — so the fix couldn't verify itself against its own bug until it was
already merged. The real resolution: run `return` from a disposable
worktree checked out at the *fixed* branch's own tip, with `--dir`
pointed at the real state store — proving the fix through the actual code
path it will run as, without touching the shared main checkout or
merging anything early.

## What determines whether a worktree gets provisioned

`provisionDependencies` no-ops when the worktree's `package.json` is
absent, or declares no `dependencies`/`devDependencies` at all — the same
skip condition `fgos doctor`'s own `dependencies-installed` check already
uses, so every worktree from before this repo had real dependencies stays
byte-identical. When something is declared, it runs `npm ci` if a
`package-lock.json` is present in that worktree (reproducible, matches
the lockfile exactly), otherwise `npm install`.
