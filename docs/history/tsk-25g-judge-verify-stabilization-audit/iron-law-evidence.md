# Iron Law evidence: tsk-25g

`classifyIronLaw({filesChanged, description: item.description})` →
`{required: true, matchedFlags: ["audit"], matchedModules: []}` — the
item's own description contains "audit" (its filed scope: "audit whether
judgeVerifySemanticCorrectness's D1a ... actually shipped").

## Test command (the item's own accepted `verify`)

```
top=$(git rev-parse --show-toplevel); root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname); grep -A3 "secondPass: judgeVerifySemanticCorrectness(" "$top/src/intake/plan.mjs" | grep -q "priorRejection" && grep -A25 "if (disputedChild)" "$top/src/intake/plan.mjs" | grep -qE "\.force\b|force ===" && node "$root/bin/fgos.mjs" list --id tsk-25g --json --dir "$root" | grep -q "D1-resolved:"
```

## Failing before (RED — before any code change, confirmed this session)

Each sub-check run individually against the unmodified repo:

```
$ grep -A3 "secondPass: judgeVerifySemanticCorrectness(" src/intake/plan.mjs | grep -q "priorRejection"
NOMATCH

$ grep -A25 "if (disputedChild)" src/intake/plan.mjs | grep -qE "\.force\b|force ==="
NOMATCH

$ node bin/fgos.mjs list --id tsk-25g --json --dir /home/vantt/projects/forgentX | grep -q "D1-resolved:"
NOMATCH
```

All three RED — matches "the fix is not yet present" exactly, before D2
(decompose.mjs priorRejection/force) or D1 (askHistory + the D1-resolved
decision) existed.

## Passing after (GREEN — after D2 + D1 both landed)

```
$ grep -A3 "secondPass: judgeVerifySemanticCorrectness(" src/intake/plan.mjs | grep -q "priorRejection" && echo "check1 GREEN" || echo "check1 RED"
check1 GREEN

$ grep -A25 "if (disputedChild)" src/intake/plan.mjs | grep -qE "\.force\b|force ===" && echo "check2 GREEN" || echo "check2 RED"
check2 GREEN

$ node bin/fgos.mjs list --id tsk-25g --json --dir /home/vantt/projects/forgentX | grep -q "D1-resolved:" && echo "check3 GREEN" || echo "check3 RED"
check3 GREEN
```

The item's own real second-pass judge (`fgos discover`) independently
agreed this exact verify command targets the claim correctly — accepted
with `outcome: "clear"` at the `fgos-coding-planning` gate, no `--force` used
(see `plan.md`'s Gate section / decision log).

## Also run: full test suite

`npm test` → `2610 tests, 2605 pass, 0 fail, 5 skipped` after this item's
full diff (D2's `decompose.mjs`/`bin/fgos.mjs`/`command-registry.mjs`
changes + D1's `replay.mjs`/`discovery.mjs` changes + all new/updated
tests in `test/intake/plan.test.mjs`, `test/state/replay.test.mjs`,
`test/state/awaiting.test.mjs`).
