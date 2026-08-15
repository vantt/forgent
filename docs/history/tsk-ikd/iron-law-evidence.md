# Iron Law evidence: tsk-ikd

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-ikd`,
this item's parent-root trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Test command

```
node --test test/cli/fgos-return.test.mjs
```

## Failing-before (pre-fix `bin/fgos.mjs`, no worktree guard on return's main-source path)

Temporarily swapped `bin/fgos.mjs` back to its content at commit `25a0f005`
(immediately before the implementation commit `7a730bb1`) and reran the
test file — including the new case this item added. One failure, showing
the real bug: `return` succeeds from inside an unregistered ad-hoc
worktree, recording `awaiting-approval` against a claim whose progress was
never actually verified on main:

```
✖ tsk-ikd: return refuses from an ad-hoc worktree never created through "fgos session start" (main-source take) — item stays doing, never reaches awaiting-approval, exit 4

  AssertionError [ERR_ASSERTION]: expected a clean validation refusal, not a return recorded against an unregistered worktree: {
    "data": {
      "id": "return-adhoc-mainsource",
      "from": "doing",
      "to": "awaiting-approval",
      "source": "main",
      "aheadCount": 2,
      "passed": true,
      ...
    }
  }
  0 !== 4

ℹ tests 49
ℹ pass 48
ℹ fail 1
```

## Passing-after (post-fix `bin/fgos.mjs` restored)

```
ℹ tests 49
ℹ suites 0
ℹ pass 49
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite passes, including both the new refusal test AND the
pre-existing session-worktree success test (`return succeeds unchanged
from inside a real session worktree`) — confirming the fix closes the real
gap without reversing the spec-locked session carve-out
(`docs/specs/runner.md:656-669`).

## Full item verify (return + approve, post-fix)

```
node --test test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs
```

Both suites pass unchanged (49 + the approve suite, part of a 224-test
combined run confirmed earlier in this same research/implementation pass).
