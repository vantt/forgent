# Iron Law evidence — tsk-1wdf

## Classification

`classifyIronLaw` re-run against the real committed diff (`git commit a947c7ab`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` is `main()` — the single CLI door every verb, skill, and
test that shells out to `fgos` goes through — so the gate requires
failing-test-first proof rather than an assertion that the new verb works.

## Test command

```
node --test test/cli/fgos-faults.test.mjs
```

## Failing-before (`bin/fgos.mjs` reverted to its pre-`tsk-1wdf` committed
state, `git checkout HEAD~1 -- bin/fgos.mjs`, working tree otherwise
unchanged — the exact same technique as re-checking out an older committed
version, since the file already existed before this item)

Real output — every one of the 7 new tests fails, each hitting `unknown
verb "faults"` because the verb genuinely does not exist yet on that
commit:

```
✖ an empty store with no faults yet reports count 0 and an empty array
✖ a recorded fault is read back with its full provenance
✖ a verb's own business refusal never shows up in the read surface
✖ --limit returns only the N most recently recorded faults
✖ --limit rejects a non-positive-integer value
✖ a linked worktree with no --dir still reads the main checkout's real log
✖ outside a git repo with no store at all, faults reports an empty view rather than failing
ℹ tests 7
ℹ pass 0
ℹ fail 7
```

Sample assertion failure (the shape repeats across all 7 — every call to
`fgos faults` returns the registry's own "unknown verb" usage line and
exit code 4 instead of the expected shape):

```
AssertionError [ERR_ASSERTION]:
actual: 'fgos: unknown verb "faults". Usage: fgos <version|init|add|submit|...
expected: /faults --limit requires a positive integer value/
```

## Passing-after (real implementation restored, `git checkout HEAD --
bin/fgos.mjs`; `git diff HEAD -- bin/fgos.mjs` empty, confirming the
working tree matches the committed implementation exactly)

```
node --test test/cli/fgos-faults.test.mjs
✔ an empty store with no faults yet reports count 0 and an empty array
✔ a recorded fault is read back with its full provenance
✔ a verb's own business refusal never shows up in the read surface
✔ --limit returns only the N most recently recorded faults
✔ --limit rejects a non-positive-integer value
✔ a linked worktree with no --dir still reads the main checkout's real log
✔ outside a git repo with no store at all, faults reports an empty view rather than failing
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Full item verify, all three parts, also green after restoring the real
implementation:

```
node --test test/cli/*.test.mjs        → 764 tests, 764 pass, 0 fail
node --test test/cli/fgos-manifest.test.mjs → 6 tests, 6 pass, 0 fail
npm test (node --test 'test/**/*.test.mjs') → 3735 tests, 3730 pass, 0 fail, 5 skipped
```

Two unrelated failures seen on one earlier `npm test` pass under load
(`test/state/porting-store.test.mjs`'s concurrent-lock case,
`test/util/session-identity.test.mjs`'s 3-hop pid-walk case) — both
confirmed real-machine timing flakes, not regressions: neither file nor
anything they exercise (`src/state/porting-store.mjs`,
`src/util/session-identity.mjs`, lock/pid machinery) was touched by this
item's diff, and both pass clean in isolation and on the raw, unfiltered
`npm test` rerun reported above.
