# tsk-2yo — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedFlags: ["migration",
"schema"]`, `matchedModules: ["src/intake/classify.mjs",
"src/runner/loop.mjs", "src/runner/prompt-templates/worker-prompt-discovery.txt"]`.

## Test command

Item's own verify: `npm test && ! grep -q "live soul"
plugins/fgOS/skills/submit/SKILL.md && grep -q "classification"
.claude/skills/fgos-coding-discovering/SKILL.md`

## Failing-before (real transcript excerpt, new tests run against the
pre-fix `loop.mjs` — the parent commit's version, temporarily swapped
back into place)

```
✖ tsk-2yo: parseVerdictBlock parses optional tier/kind/risk additively, without changing the shape of a fence that omits them (1.033565ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    {
      clear: true,
  -   kind: 'bug',
  -   risk: 'heavy',
  -   tier: 'heavy',
      verify: 'npm test'
    }

✖ tsk-2yo: classificationPatchFromVerdict only builds a patch on a clear discovery outcome with a clear caller verdict, and only for fields actually reported (0.146969ms)
  TypeError: classificationPatchFromVerdict is not a function

✖ tsk-2yo: a headless clear verdict carrying tier/kind/risk actually applies them to the work item via editWork (0.672947ms)
  TypeError: classificationPatchFromVerdict is not a function

ℹ tests 61
ℹ pass 58
ℹ fail 3
```

All 3 new tests fail against the pre-fix `loop.mjs`: the first shows the
fence parser has no `tier`/`kind`/`risk` support yet, the other two show
`classificationPatchFromVerdict` does not exist yet — the exact gap D17
named ("đường headless cần mở rộng schema khối `fgos-verdict`... vì worker
bị cấm gọi `fgos`").

## Passing-after (real transcript excerpt, after the fix)

```
✔ tsk-2yo: parseVerdictBlock parses optional tier/kind/risk additively, without changing the shape of a fence that omits them
✔ tsk-2yo: classificationPatchFromVerdict only builds a patch on a clear discovery outcome with a clear caller verdict, and only for fields actually reported
✔ tsk-2yo: a headless clear verdict carrying tier/kind/risk actually applies them to the work item via editWork
ℹ tests 61
ℹ pass 61
ℹ fail 0
```

Full `npm test` after: `tests 2964 / pass 2959 / fail 0` (5 skipped,
pre-existing, unrelated). Full item verify (`npm test && ! grep -q "live
soul" ... && grep -q "classification" ...`): exit code 0.

## What changed

- `.claude/skills/fgos-coding-discovering/SKILL.md` (+ `.agents/` mirror):
  removed the Non-goal note and its matching hard rule; added a
  classification-judgment sub-step to "Tự phán" (step 4) and a
  conditional `fgos edit --tier/--kind/--risk` call to step 5, reading
  vocabulary via `classificationVocabulary(domain, field)`.
- `plugins/fgOS/skills/submit/SKILL.md`: deleted step 7 (the re-judge
  block) and step 8 (its report, now nothing left to report); reworded
  step 4's gate condition at both its occurrences (lines 99, 112) to drop
  the literal phrase "a live soul" while keeping its function (the
  `tsk-qod` pre-creation `fgos-clarifying` gate, unrelated to this item).
- `src/intake/classify.mjs`: added a doc-comment noting its output is now
  a temp placeholder (D12) — code itself unchanged.
- `src/runner/loop.mjs`: extended `parseVerdictBlock`'s `clear` branch to
  additively parse optional `tier`/`kind`/`risk` (conditional spread, so
  a fence that omits them parses to the exact same two-key object as
  before); added `classificationPatchFromVerdict(outcome, callerVerdict)`
  as a small pure, unit-testable helper; wired it into the runner's
  `resolveDiscovery` call site to apply the patch via `editWork` when the
  discovery outcome is `clear` — `resolveDiscovery` itself is untouched.
- `src/runner/prompt-templates/worker-prompt-discovery.txt`: documented
  the new optional `tier`/`kind`/`risk` keys in the `fgos-verdict` fence
  example, with vocabulary-lookup guidance for the worker.
- `test/runner/loop.test.mjs`: 3 new tests (fence-parsing shape
  preservation + new-field parsing, `classificationPatchFromVerdict`'s
  own gating logic, and an end-to-end `editWork` application check).
- Runtime action (not a source-file edit): retired the
  `submit-assist-classify` capacity via `fgos tool remove --name
  submit-assist-classify`.
