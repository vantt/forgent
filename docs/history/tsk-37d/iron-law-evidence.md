# Iron Law evidence: tsk-37d

`classifyIronLaw` result against the real committed diff (`changedFiles`
over `trunk...fgw/tsk-37d`, commit `6b70ceaa`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs"]
}
```

`src/state/store.mjs` is a protected module — evidence required.

## Test command

```
npx --no -- node --test test/state/store.test.mjs test/state/replay.test.mjs
```

## Failing-before (pre-fix source at commit `667f4244`, the new tests added by `6b70ceaa`)

Reproduced live: `git checkout 667f4244 -- src/state/store.mjs src/state/replay.mjs`
(temporarily reverting just the two implementation files, keeping the
already-committed new tests), then ran the command above.

```
✖ writeView serializes view content only once per mutation (tsk-37d) (2.356873ms)
✔ moveWork refuses a doing->delivered close when a populated acceptance clause has no evidence: precondition, item stays "doing", no event written (1.375811ms)
...
ℹ tests 68
ℹ suites 0
ℹ pass 66
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3026.671559
✖ failing tests:
test at test/state/replay.test.mjs:1:1
✖ test/state/replay.test.mjs (63.080073ms)
  'test failed'
test at test/state/store.test.mjs:845:1
✖ writeView serializes view content only once per mutation (tsk-37d) (2.356873ms)
  AssertionError [ERR_ASSERTION]: the full view object must be stringified exactly once per state write
  4 !== 2
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-37d-H5bLPX/test/state/store.test.mjs:863:10)
```

(`replay.test.mjs` failed to even load — its new import of `serializeView`
does not exist in the pre-fix `replay.mjs`.)

## Passing-after (real committed source, `6b70ceaa`)

Restored via `git checkout 6b70ceaa -- src/state/store.mjs src/state/replay.mjs`,
reran the identical command:

```
ℹ tests 155
ℹ suites 0
ℹ pass 155
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2797.08086
```

Working tree confirmed clean (`git status --short`, empty) both before this
temporary revert-and-restore and after — no stray changes left behind.
