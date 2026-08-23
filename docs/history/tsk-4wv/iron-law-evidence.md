# Iron Law evidence — tsk-4wv

`classifyIronLaw` result against the real committed diff (`c70f32d0...151d1360`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Test command

The item's own `verify`: `npm test` (the new regression test lives at
`test/cli/fgos-decision.test.mjs`).

## Shape of this change

`bin/fgos.mjs`'s `decision` verb dropped a silent fallback
(`flags.text ?? (positional.length ? positional.join(' ') : undefined)`)
that let a call with no `--text` fall back to joining whatever positional
arguments were left over — e.g. `fgos decision write "..."` silently
stored `"write ..."` as the decision text instead of refusing. The fix
requires `--text` explicitly, matching how every real caller (5 skills,
every existing test) already invokes it.

The before/after contrast reverts `bin/fgos.mjs` alone on the worktree
back to its pre-fix committed content (`git checkout 214f4120 --
bin/fgos.mjs`, the commit immediately before this item's fix), runs the
new regression test against that reverted file, then restores the fixed
content and runs it again.

## Failing-before transcript

`bin/fgos.mjs` reverted to `214f4120` (pre-fix). The new test
(`test/cli/fgos-decision.test.mjs`) calls `decision` with a positional
argument and no `--text`, asserting exit code 4 (refusal):

```
$ node --test test/cli/fgos-decision.test.mjs
AssertionError [ERR_ASSERTION]: 0 !== 4
```

A clean, unambiguous failure: the pre-fix code exits 0 (succeeds) on this
call instead of refusing — silently accepting the positional-join
fallback the fix removes, exactly the bug this item exists to close.

## Passing-after transcript

`bin/fgos.mjs` restored to its committed (fixed) content
(`git checkout HEAD -- bin/fgos.mjs`; `git diff HEAD -- bin/fgos.mjs
test/cli/fgos-decision.test.mjs` empty, confirming an exact restore).
Same test:

```
$ node --test test/cli/fgos-decision.test.mjs
✔ decision with no --text, only positional args, refuses with a
  validation error (exit 4) instead of silently storing corrupted text
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full `npm test` (cwd/branch verified in the same shell invocation, to
rule out a stray cwd):

```
/home/vantt/projects/forgentX/.claude/worktrees/tsk-4wv-dmIPLt
fgw/tsk-4wv
ℹ tests 3651
ℹ suites 0
ℹ pass 3646
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```
