# Iron Law evidence — tsk-2e7

## Classifier result (real, run against the actual committed diff)

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

Command run (from `fgw/tsk-2e7`'s worktree, against `trunk...branch`):

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-2e7'];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
"
```

## Why this trips the gate despite no code change

`matchedModules` is empty — the committed diff touches only
`docs/history/tsk-2e7-main-checkout-lock-scope/{plan.md,RESEARCH.md}`, no
file under any of `classifyIronLaw`'s self-modifying-capable module rules
(`src/runner/**`, `src/evolve/**`, `bin/fgos.mjs`, etc.). `required: true`
fires **only** on `matchedFlags: ["audit"]` — `classifyIronLaw` scans the
item's own `description` field against `HEAVY_KEYWORDS`
(`src/intake/risk-keywords.mjs`), and the item's own original submitted
text (written before this session ever touched it) contains the literal
English word "audit": *"Đề xuất bước tiếp theo: audit các call site trong
execute()..."*. This is the same keyword-floor hit that already forced a
live human gate question at `fgos-coding-validating` (recorded via
`fgos gate-approve --actor human` on this item) — the Iron Law gate is a
second, independent trip on the identical word, not a new finding.

## Why there is no failing-before/passing-after transcript

This item's plan (`docs/history/tsk-2e7-main-checkout-lock-scope/plan.md`)
concluded **no code fix is needed** — the audit found the item's own
premise (that `dispatch execute()`'s main-checkout lock serializes
independent worktree-isolated items) does not hold against the current
code; the relevant lock was already narrowed to per-`cwd` by `tsk-64hk`
before this item was filed. There is no bug being fixed here, so there is
no legitimate "failing before" state to demonstrate — fabricating one
would violate the standing rule against a fabricated or paraphrased
transcript. What follows instead is the honest equivalent for a
docs-only, no-fix diff: real, unmodified-by-this-diff regression output
proving nothing in the cited proof surface changed behavior.

## Real command output (regression proof, not a fix proof)

Targeted run (this session, before out-of-process dispatch):

```
$ node --test --test-name-pattern="dispatch-in-flight|overlapping execution windows" test/runner/dispatch.test.mjs
✔ executeExecutorCli refuses a concurrent dispatch for the same cwd with DispatchError(dispatch-in-flight) (tsk-64hk) (731.557694ms)
✔ executeExecutorCli refuses with DispatchError(dispatch-in-flight) when lock file content is corrupt/ambiguous (tsk-64hk) (18.08302ms)
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (605.683495ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full-suite run (the out-of-process worker's own verify, per the item's
`verify` field `node --test test/runner/dispatch.test.mjs`), reported
verbatim from the worker's own stdout:

```
Ran the verification test suite:
`node --test test/runner/dispatch.test.mjs` — 312/312 tests passed.
```

`verifiedSha: 4e60c6cf66156bcbb715730b35b11139c384295a` — matches
`git log -1` on `fgw/tsk-2e7` at dispatch time (the docs-only commit that
carries `plan.md`/`RESEARCH.md`; no source file in `src/`, `test/`, or
`bin/` changed).

## Conclusion

`matchedFlags: ["audit"]`, `matchedModules: []` — a text-keyword-only
trigger on a docs-only diff, already surfaced once at the human gate for
the same reason. No regression: the full dispatch test suite (312/312)
passes unmodified. Recorded for `fgos approve --acknowledge-iron-law` to
find and present, per the evidence contract's own design
(`docs/explanation/iron-law-evidence-contract-stays-human-gated.md`).
