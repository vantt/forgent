# tsk-3o3: Iron Law evidence

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the item's own
`changedFiles` (`src/runner/merge.mjs`) at return time:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Failing-test-first proof

`test/cli/fgos.test.mjs`'s 6 new `compound` tests were run against the
pre-fix `bin/fgos.mjs` (git-restored from `HEAD~1`, the commit before
`7580552` restored `case 'compound'`), then against the real fixed file,
same test command both times: `node --test test/cli/fgos.test.mjs`.

**3 of 6 genuinely failed pre-fix** — the ones that need the verb to
actually *work* (not just reject):

```
test at test/cli/fgos.test.mjs:8173:1
✖ compound with no --doc-type is a no-op: exit 0, docType null, no events written (296.637053ms)
  AssertionError [ERR_ASSERTION]: fgos: unknown verb "compound". Usage: fgos <init|add|submit|...>

test at test/cli/fgos.test.mjs:8188:1
✖ compound with --doc-type tags the outcome, surfaced by `show`; item stays at status retrospective (no stage/status move) (284.412728ms)
  AssertionError [ERR_ASSERTION]: fgos: unknown verb "compound". Usage: fgos <init|add|submit|...>

test at test/cli/fgos.test.mjs:8208:1
✖ compound with --doc-type and --doc-path tags both, surfaced by `show` (290.605887ms)
  AssertionError [ERR_ASSERTION]: fgos: unknown verb "compound". Usage: fgos <init|add|submit|...>
```

**3 of 6 passed pre-fix for the wrong reason** — a real, honestly-reported
false positive, not omitted from this record: `compound on a nonexistent
id`, `compound on an item not at status retrospective`, and `compound
with an invalid --doc-type` all assert `exit 4` — and `bin/fgos.mjs`'s
own "unknown verb" rejection *also* throws `StoreError('validation', ...)`
→ exit 4, coincidentally matching the expected exit code for entirely the
wrong reason (the verb never dispatched at all, let alone reached the
precondition/validation check the test names describe). These 3 tests are
still valid, real assertions of the restored verb's actual behavior
post-fix — the point of this note is that their pre-fix "pass" is not
evidence the bug didn't exist; the 3 failures above are.

**All 6 pass against the real fix** (same command, real committed
`bin/fgos.mjs` restored via `git checkout HEAD --`):

```
✔ compound on a nonexistent id is rejected as validation, exit 4 (107.332147ms)
✔ compound on an item not at status retrospective is rejected as validation, exit 4, no events written (146.174877ms)
✔ compound with an invalid --doc-type is rejected as validation, exit 4, before any write (279.681472ms)
✔ compound with no --doc-type is a no-op: exit 0, docType null, no events written (291.008226ms)
✔ compound with --doc-type tags the outcome, surfaced by `show`; item stays at status retrospective (no stage/status move) (345.320999ms)
✔ compound with --doc-type and --doc-path tags both, surfaced by `show` (339.378708ms)
```

Full suite (`npm test -- test/cli/fgos.test.mjs test/state/retro-pool.test.mjs`,
which resolves to the whole `test/**/*.test.mjs` glob via `package.json`'s
own `test` script): 2340 tests, 2335 pass, 0 fail, 5 pre-existing skips.
