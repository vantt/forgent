# Iron Law evidence — tsk-2f6

## Classification

Ran `classifyIronLaw` against the real committed diff (`trunk...fgw/tsk-2f6`,
commit `adf362f90b700204e0701739c736f8397a0bf7de`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```

`src/runner/merge.mjs` is one of the modules the Iron Law's capability
test treats as able to weaken the system's own gate/verify discipline —
touched here only to add a new pure-function helper
(`formatFgosWriteRejectedDetail`), no existing logic changed.

## Failing-test-first proof

The new test (`test/runner/merge.test.mjs`, `formatFgosWriteRejectedDetail
includes playbook recovery doc path`) was run against the pre-fix source
(temporarily reverting `src/runner/merge.mjs`,
`src/verbs/merge/approve.mjs`, `src/verbs/merge/sync-root.mjs` to
`HEAD~1`, i.e. the commit right before the implementation landed), then
against the real fix, to prove the test actually exercises the new
behavior rather than passing vacuously.

Command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
--test-name-pattern="formatFgosWriteRejectedDetail" test/runner/merge.test.mjs`

**Before (pre-fix `src/`, real transcript excerpt):**

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2f6-E0JCbj/test/runner/merge.test.mjs:20
  formatFgosWriteRejectedDetail,
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/merge.mjs' does not provide an export named 'formatFgosWriteRejectedDetail'
...
✖ test/runner/merge.test.mjs (274.42617ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After (real fix restored, real transcript excerpt):**

```
✔ formatFgosWriteRejectedDetail includes playbook recovery doc path (6.852973ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

## Full suite

The out-of-process worker (`agy`/`gemini-3.6-flash-medium`) ran the
item's own real `verify` (`npm test`) before committing: 3773/3773
passing, per its own reported transcript. The driver (this session)
independently confirmed the commit is real (`git log -1` shows
`adf362f90b700204e0701739c736f8397a0bf7de` citing `tsk-2f6`, `git status`
clean, `verifiedSha` from the dispatch result matches `HEAD`) and read the
full diff directly rather than trusting the worker's summary alone — 4
files changed exactly as `plan.md` specified, no scope beyond it.
