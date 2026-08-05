# tsk-5cf — Iron Law evidence

`classifyIronLaw({ filesChanged, description })` on the real merge-time
diff:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Matched: `bin/fgos.mjs` (the whole entry file deliberately over-reports as
self-modifying-capable, per `src/evolve/iron-law.mjs`'s own header —
`parseDiscoverCallerVerdict`'s `--force` flag addition is the actual touch
inside that file).

## How this evidence was produced

This item's tests were written alongside the implementation, not
test-first — `fgos return`'s own verify run only ever saw them pass. To
give this gate real, not fabricated, failing-before proof, the src changes
were temporarily reverted to their pre-fix commit (`a0476da`, the commit
immediately before the implementation commit `b47f03f`) with the test
files left at HEAD, the two new test files were run and genuinely failed,
then the src changes were restored to HEAD and rerun to confirm they pass
— both real command runs, transcripts pasted below verbatim.

## Failing-before (src at `a0476da`, tests at HEAD)

```
$ node --test test/intake/judge-verify-second-pass-stability.test.mjs
✔ judgeVerifySemanticCorrectness with no priorRejection sends a prompt with no prior-round section (24.143881ms)
✖ judgeVerifySemanticCorrectness threads a supplied priorRejection into the prompt verbatim (25.227488ms)
✔ judgeVerifySemanticCorrectness with a blank/whitespace priorRejection omits the prior-round section, same as omitted (21.719779ms)
✖ resolveDiscovery threads the prior dispute's ask text into the next round's second-pass prompt (984.353522ms)
ℹ tests 4
ℹ pass 2
ℹ fail 2

✖ failing tests:

test at test/intake/judge-verify-second-pass-stability.test.mjs:67:1
✖ judgeVerifySemanticCorrectness threads a supplied priorRejection into the prompt verbatim
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
    assert.ok(capturedPrompt.includes('Vòng trước đã từ chối'))
    actual: false
    expected: true

test at test/intake/judge-verify-second-pass-stability.test.mjs:126:1
✖ resolveDiscovery threads the prior dispute's ask text into the next round's second-pass prompt
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'verify-disputed'
  - 'clear'
```

```
$ node --test test/state/discover-verdict-override.test.mjs
✔ discover --verdict clear without --force still parks in awaiting-human on a disputed verify (regression: unchanged default) (249.094828ms)
✖ discover --verdict clear --force proceeds past a disputed verify instead of parking, and logs the override as a decision (205.533963ms)
✔ discover --verdict unclear --force is a silent no-op for --force (force only ever applies to the clear branch) (237.759649ms)
ℹ tests 3
ℹ pass 2
ℹ fail 1

✖ failing tests:

test at test/state/discover-verdict-override.test.mjs:83:1
✖ discover --verdict clear --force proceeds past a disputed verify instead of parking, and logs the override as a decision
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'verify-disputed'
  - 'clear'
```

## Passing-after (src and tests both at HEAD, `b47f03f`)

```
$ node --test test/intake/judge-verify-second-pass-stability.test.mjs
✔ judgeVerifySemanticCorrectness with no priorRejection sends a prompt with no prior-round section (26.582917ms)
✔ judgeVerifySemanticCorrectness threads a supplied priorRejection into the prompt verbatim (25.421058ms)
✔ judgeVerifySemanticCorrectness with a blank/whitespace priorRejection omits the prior-round section, same as omitted (22.239757ms)
✔ resolveDiscovery threads the prior dispute's ask text into the next round's second-pass prompt (1043.578098ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

```
$ node --test test/state/discover-verdict-override.test.mjs
✔ discover --verdict clear without --force still parks in awaiting-human on a disputed verify (regression: unchanged default) (260.969823ms)
✔ discover --verdict clear --force proceeds past a disputed verify instead of parking, and logs the override as a decision (297.505509ms)
✔ discover --verdict unclear --force is a silent no-op for --force (force only ever applies to the clear branch) (233.014016ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```
