# Iron Law evidence — tsk-4gr

`classifyIronLaw` against the real committed diff (`changedFiles` diffing
`trunk...fgw/tsk-4gr`, run after the implementation commit landed):

```json
{
  "required": true,
  "matchedFlags": ["migration", "audit", "kiểm toán"],
  "matchedModules": []
}
```

Matched on the item's own description text (the same self-referential
case the item itself is about — its own description mentions
audit/migration/kiểm toán as topic words, tripping the same floor this
fix narrows). `matchedModules` empty — no module-path flag hit.

## Test command

```
npm test && node --test test/state/gate-bypass.test.mjs
```

## Failing-before / passing-after proof

**Before** (parent commit `42a7d959`, the pre-fix `canAutoApprove`/
`canAutoApproveMergedGate`): the three new positive-case assertions run
against that commit's own code (via a same-directory temp import so
relative imports resolved, deleted immediately after — never committed):

```
EXPECTED FAIL (pre-fix): canAutoApprove backtick-citation case -> Expected values to be strictly equal:

false !== true

EXPECTED FAIL (pre-fix): canAutoApproveMergedGate backtick-citation case -> Expected values to be strictly equal:

false !== true

EXPECTED FAIL (pre-fix): canAutoApprove bare-filename case -> Expected values to be strictly equal:

false !== true


3/3 cases failed against the pre-fix (parent commit 42a7d959) code, as expected.
```

**After** (commit `2186d10b`, the real fix): the full verify command,
run clean —

```
$ node --test test/state/gate-bypass.test.mjs
...
✔ canAutoApprove: backtick-quoted doc citation `AUDIT.md` does not trip hard-gate keyword audit (tsk-4gr) (0.082732ms)
✔ canAutoApproveMergedGate: backtick-quoted doc citation `AUDIT.md` does not trip hard-gate keyword audit (tsk-4gr) (0.072806ms)
✔ canAutoApprove & canAutoApproveMergedGate: bare AUDIT.md filename token does not trip hard-gate keyword audit (tsk-4gr) (0.099398ms)
✔ canAutoApprove & canAutoApproveMergedGate: regression — genuine prose keyword mention "audit" still hard-gates (tsk-4gr) (0.047572ms)
ℹ tests 51
ℹ pass 51
ℹ fail 0

$ npm test
ℹ tests 3691
ℹ pass 3686
ℹ fail 0
ℹ skipped 5
```
