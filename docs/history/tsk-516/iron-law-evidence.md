# Iron Law evidence — tsk-516

Classification run against the real committed diff (`changedFiles` +
`classifyIronLaw`, after the implementation commit `4fec241c`, per
`fgos-coding-implement`'s own ordering rule):

```
classify: {"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/goal-check.mjs","src/runner/merge.mjs"]}
```

- **matchedFlags**: none
- **matchedModules**: `bin/fgos.mjs`, `src/runner/goal-check.mjs`,
  `src/runner/merge.mjs`

Test command (the item's own `verify`): `npm test`

## Honest note on ordering

The implementation was written before these tests, so the failing-first
state below was reconstructed deliberately rather than captured as it
happened: the five source files were checked out from `HEAD~1` (the
pre-implementation commit) while the test files stayed at `HEAD`, the tests
were run, and the sources were then restored from `HEAD`. The transcripts
below are the real, unedited output of that run — not a paraphrase, and not
a prediction of what would have failed.

## Failing before

`git checkout HEAD~1 -- src/runner/merge.mjs src/runner/goal-check.mjs bin/fgos.mjs src/config/shared-config-file.mjs src/setup/registrations.mjs`

### `node --test test/runner/merge.test.mjs`

```
✖ a red repo-invariant check blocks the merge even when the item verify is green (36.551567ms)
✖ D5: the merged tree already verified at return skips both the verify and the invariant checks (39.369708ms)
ℹ tests 69
ℹ pass 67
ℹ fail 2
```

The gate not existing yet — a red invariant is simply ignored and the merge
lands:

```
✖ a red repo-invariant check blocks the merge even when the item verify is green (45.943373ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'merged'
  - 'verify-fail'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-516-SRAZh5/test/runner/merge.test.mjs:1103:10)
```

The skip not existing yet — the item's `verify: 'exit 1'` actually runs and
fails, where the implemented behavior proves the tree was already verified
and never runs it:

```
✖ D5: the merged tree already verified at return skips both the verify and the invariant checks (38.977911ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'verify-fail'
  - 'merged'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-516-SRAZh5/test/runner/merge.test.mjs:1142:10)
```

The three must-NOT-skip D5 tests passed in this pre-implementation state,
which is expected and is exactly why they are not sufficient on their own:
with no skip logic at all, "did not skip" is trivially true. Only the two
failures above discriminate.

### `node --test test/runner/goal-check.test.mjs test/config/shared-config-file.test.mjs`

```
ℹ tests 2
ℹ pass 0
ℹ fail 2
```

Both files fail at import: `runCommand` / `runInvariantChecks` /
`invariantFailureAsCheck` / `readInvariantCheckCommands` /
`DEFAULT_INVARIANT_CHECK_COMMANDS` do not exist in the pre-implementation
sources, so neither file's tests can even be collected.

## Passing after

Sources restored (`git checkout HEAD -- <the same five files>`), full
`npm test`:

```
exit=0
ℹ tests 2852
ℹ pass 2847
ℹ fail 0
VERIFY_SECONDS=188.41
```

Per-suite, on the same restored tree:

```
node --test test/runner/goal-check.test.mjs        -> 17 pass, 0 fail (2.3s)
node --test test/config/shared-config-file.test.mjs -> 11 pass, 0 fail (0.06s)
node --test test/runner/merge.test.mjs             -> 69 pass, 0 fail (2.3s)
node --test test/setup/checks.test.mjs             -> 85 pass, 0 fail
node --test test/setup/registrations.test.mjs      -> 17 pass, 0 fail
```

## Two regressions this item's own widened verify caught during the build

Both landed in suites the item's ORIGINAL narrow verify
(`node --test test/runner/goal-check.test.mjs`) never touches — the exact
failure mode this item exists to close, reproduced on itself:

1. `config-not-stale passes when the existing config already has every
   default key` (`test/setup/checks.test.mjs`) went red because a new
   `registerConfigDefault` entry made the test's own fixture stale.
2. `Data Dictionary #7 names exactly the registered doctor checks — no
   missing entry, no stale one` (`test/setup/registrations.test.mjs`) went
   red because `docs/specs/distribution.md` row 7 must name every
   registered check.

Both were fixed at the source (fixture updated to the registry, spec row
updated), never by weakening a test.
