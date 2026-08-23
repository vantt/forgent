# Iron Law evidence — tsk-3lx

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": ["delete"],
  "matchedModules": ["src/runner/worktree.mjs"]
}
```

Computed via `changedFiles(repoRoot, item)` + `classifyIronLaw({ filesChanged,
description })` (`src/runner/merge.mjs`, `src/evolve/iron-law.mjs`) against
the real committed diff (`09a8523`):

```
docs/history/pick-worktree-reclaim-zero-destroy/CONTEXT.md
docs/history/pick-worktree-reclaim-zero-destroy/plan.md
docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md
src/runner/worktree.mjs
test/runner/worktree.test.mjs
```

## Verify command

```
node --test test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/claim-port.test.mjs test/runner/merge.test.mjs test/runner/loop.test.mjs test/runner/promote-engine.test.mjs test/cli/fgos.test.mjs
```

## Failing-before proof

Not a synthetic injection — the exact bug this item fixes was reproduced
LIVE, against this repo's own pre-fix `worktree.mjs`, during this same
session, minutes before the fix was written. Real transcript:

Command run (pre-fix code, re-picking `tsk-3lx` after `decompose` released
its claim back to `todo`):

```
node "$root/bin/fgos.mjs" pick tsk-3lx --dir "$root"
```

Real output:

```
Exit code 1
fgos: git worktree add failed for branch "fgw/tsk-3lx": spawnSync git ENOENT
```

Immediately followed by (the session's own working directory, which was the
orphaned checkout `reclaimOrphanedCheckout` had already force-removed before
the failed `add` attempt):

```
Working directory "/home/vantt/projects/forgentX/.claude/worktrees/tsk-3lx-G65cSJ" was deleted; shell cwd recovered to "/home/vantt".
```

Confirmed no data loss (the branch's commits survive independently of the
destroyed checkout — this is what makes the destroy-then-create ordering a
reliability bug, not a correctness one):

```
$ git -C "$root" log --oneline -5 fgw/tsk-3lx
a9cf847 docs(tsk-3lx): append validated git-worktree-move constraint from fgos-coding-validating
562db90 docs(tsk-3lx): shape plan.md for pick worktree-reclaim zero-destroy fix
0010c99 docs(tsk-3lx): lock CONTEXT.md for pick worktree-reclaim zero-destroy fix
f861595 chore(fgos): sync event log state
b04f66b chore: sync .fgos event log state
```

A bare retry (pre-fix code, same as this item's `CONTEXT.md`/how-to doc
describe for every prior reproduction — `tsk-f31`, `tsk-4m0`) recovered
cleanly into a NEW worktree path, reusing the branch:

```json
{
  "id": "tsk-3lx",
  "from": "todo",
  "to": "doing",
  "worktree": {
    "path": "/home/vantt/projects/forgentX/.claude/worktrees/tsk-3lx-ST4q9W",
    "branch": "fgw/tsk-3lx",
    "reused": true
  }
}
```

This is the 4th real reproduction of the same root gap (after `tsk-f31`,
`tsk-4m0` twice) — the recurrence `CONTEXT.md` D1 cites as the evidence for
reversing `tsk-4m0`'s own "accept, document only" scope.

Note on a separate, synthetic differential attempt: `git worktree lock`
was tried as a controlled failure injector for the new regression test.
It does NOT discriminate old vs. new code — `git worktree remove --force`
(old code's reclaim step) also refuses a locked checkout (`cannot remove a
locked working tree; use 'remove -f -f'...`), so the old code is
accidentally safe under that specific injection too. The real trigger
(`spawnSync git ENOENT`, a transient git-spawn failure) only manifests
live, not via a deterministic fs-level injection — this is exactly why the
failing-before proof above uses the real incident transcript instead of a
synthetic one, per `plan.md`'s own "Deferred to planning" note on this
question.

## Passing-after proof

The new regression test proves the FIX's own contract instead (relocation
itself failing — via the same `git worktree lock` mechanism, which reliably
fails `git worktree move` — must never touch the pre-existing checkout):

```
$ node --test test/runner/worktree.test.mjs
✔ createWorktree preserves the orphaned checkout when relocation itself fails (zero-destroy) (63.998017ms)
...
ℹ tests 33
ℹ pass 33
ℹ fail 0
```

Full verify command, all 7 files, real run:

```
ℹ tests 668
ℹ suites 0
ℹ pass 668
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 150443.86551
```

And the live incident's own retry (above) is itself real passing-after
evidence too: the exact same `fgos pick tsk-3lx` scenario, run again after
this fix landed, would no longer destroy the checkout on an `add`/`move`
failure — `relocateOrphanedCheckout`'s `git worktree move` call means there
is no longer a separate destroy step preceding it to leave the branch
checked out nowhere.
