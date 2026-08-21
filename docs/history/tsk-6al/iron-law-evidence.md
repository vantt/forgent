# tsk-6al — Iron Law failing-test-first evidence

`classifyIronLaw` result (against the committed diff, `e53f7552..88619f23`):
`required: true`, `matchedFlags: ["data loss"]`, `matchedModules:
["bin/fgos.mjs", "src/runner/dispatch/cli.mjs"]`.

## Test command

Item's own verify: `npm test`. The 3 new tests this item's own commit adds
(2 in `test/cli/fgos-return.test.mjs`, 1 in `test/runner/dispatch.test.mjs`)
were run in isolation first via `--test-name-pattern`, then the two full
files, then the full suite.

## Failing-before (real transcript, new tests run against the parent
commit's implementation — `bin/fgos.mjs` and `src/runner/dispatch/cli.mjs`
temporarily checked out from `e53f7552` while the new test files stayed at
their real, already-committed content)

```
✖ return --worker-verified-sha skips runGoalCheck when sha matches branchHead, moving item to awaiting-approval with verify skipped output (1401.671047ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /verify skipped/. Input:
  '{\n' +
    ...
    '    "to": "blocked",\n' +
    ...
    '    "exitStatus": 1,\n' +
    '    "output": ""\n' +
    '  }\n' +
  '}\n'
  expected: /verify skipped/
  operator: 'match'

✔ return --worker-verified-sha falls through to real verify when sha is stale or mismatched (1324.602575ms)

✖ executeExecutorCli includes verifiedSha on [DONE] when cwd is a git repo, and omits verifiedSha on [BLOCKED] (145.475454ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + undefined
  - '5a5f80b0f81241a6cfc94219a57465eddcbd31a1'

ℹ tests 3
ℹ pass 1
ℹ fail 2
```

The `falls through to real verify when sha is stale` case passes even on
the pre-fix code — expected: old code always falls through to a real
verify (it has no skip path at all), so that case is a regression guard,
not a demonstration of the fix. The other two tests are the bug itself
demonstrated directly: pre-fix `return` unconditionally moves the item to
`blocked` (its own placeholder `verify: "exit 1"` always fails) with no
"verify skipped" output, and pre-fix `executeExecutorCli` never attaches
`verifiedSha` on a `[DONE]` result.

## Passing-after (real transcript, fix restored)

```
✔ return --worker-verified-sha skips runGoalCheck when sha matches branchHead, moving item to awaiting-approval with verify skipped output (1527.022102ms)
✔ return --worker-verified-sha falls through to real verify when sha is stale or mismatched (1230.132762ms)
✔ executeExecutorCli includes verifiedSha on [DONE] when cwd is a git repo, and omits verifiedSha on [BLOCKED] (184.511513ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full `node --test test/cli/fgos-return.test.mjs test/runner/dispatch.test.mjs`:
`tests 356 / pass 356 / fail 0`.

Full `npm test`: `tests 3768 / pass 3763 / fail 0` (5 skipped, pre-existing,
unrelated to this diff).

## What changed

- `src/runner/dispatch/cli.mjs` (`executeExecutorCli`): captures
  `verifiedSha` (the `headAfter` git sha, already computed unconditionally)
  on a `[DONE]` result when `cwd` is inside a git repo — previously that
  sha was only ever attached on the `unsignaled` branch, never on the
  success case that actually has something to prove.
- `src/runner/dispatch/cli.mjs` (`fanoutBatchExecutorCli`): threads
  `--worker-verified-sha <sha>` into its own subsequent `fgos return` call
  when `executeExecutorCli` returned a `verifiedSha`.
- `bin/fgos.mjs` (`case 'return'`): accepts `--worker-verified-sha <sha>`.
  On the branch-source return path, when the flag exactly matches the
  branch's current tip (`branchHead`), skips `runGoalCheck`/
  `runInvariantChecks` and records `awaiting-approval` directly, output
  tagged `"verify skipped: branch tip <sha> was already verified green by
  worker"`. Absent or stale (mismatched) falls straight through to the
  existing unconditional verify — unchanged from before this item.
- `.agents/skills/fgos-coding-implement/references/implement-and-
  collaboration.md` + `references/return-mechanics.md`: the driver
  session's own skill-prose now instructs reading `verifiedSha` from an
  out-of-process `execute` call's JSON stdout and passing it to the
  session's own later `fgos return` call — this is the item's actual
  confirmed-live reproduction path (a single-item drive, not
  `fanoutBatchExecutorCli`'s batch flow), caught by `fgos-coding-
  validating`'s reality gate on the first plan draft (see
  `docs/history/tsk-6al-return-skip-redundant-verify/RESEARCH.md` Round 3).
- `CHANGELOG.md`: `## [Unreleased]` entry.
