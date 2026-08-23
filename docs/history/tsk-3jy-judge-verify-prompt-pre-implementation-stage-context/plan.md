# plan.md — tsk-3jy

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof, multi-domain — none apply: `buildVerifyCheckPrompt` is an internal
prompt-builder with no public contract, and existing tests assert on
substring presence (`assert.ok(capturedPrompt.includes(...))`,
`test/intake/judge-verify-second-pass-stability.test.mjs:65,80,90`), not
exact-string equality — adding new prompt text cannot break them).
Direct-entry: no lane was handed off by `fgos-routing`'s Orient this
session (this item was claimed and driven via `/fgOS:pick` →
`fgos-coding-driving`, not a fresh `fgos-routing` Orient pass), so this
lane was derived directly from the Mode-gate table in
`fgos-routing/SKILL.md` per that skill's own direct-entry fallback: 0
flags, two files touched (a "couple of files, one direct task") → tiny.

impact-analysis: degraded (`fgos tool query --capability impact-analysis
--status present` returned 1 provider, gitnexus, `status: present` — but
`mcp__gitnexus__list_repos` shows this repo's index 344 commits behind
HEAD, last indexed `251d0b5`, corrected at `fgos-coding-validating` from an
initial `full` reading that only checked the capability-gate `status`
field, not actual index freshness per CLAUDE.md's own gate: "present" only
means installed, never that the index is fresh). Cross-checked at
`fgos-coding-validating` regardless (CLAUDE.md: "a suspicious zero-result or
'not found' answer... worth a quick grep/rg cross-check"): `impact({target:
"buildVerifyCheckPrompt", direction:"upstream", repo:"/home/vantt/
projects/forgentX"})` returned exactly the same 2 callers a manual `grep -n
"judgeVerifySemanticCorrectness" src/intake/*.mjs` already found
(`discovery.mjs:667`, `decompose.mjs:835`) — the stale index still agrees
with the live repo for this symbol's own neighborhood, risk: LOW.

## What gets built

Add one instruction block to `buildVerifyCheckPrompt`
(`src/intake/judge-executor.mjs:329`) — the prompt
`judgeVerifySemanticCorrectness` sends to the second-pass judge model —
telling it two things, honoring CONTEXT.md D1/D2/D3:

1. This verify command is proposed BEFORE the code it verifies exists
   (either `clarify` stage via `discovery.mjs:667`, or `decompose` stage
   per-child via `decompose.mjs:835` — both pre-implementation, D3).
   Grade syntax (does this actually run) and targeting (does it name the
   right thing) — never demand evidence that presupposes the code already
   changed (a git diff, a passing/failing run of code that doesn't exist
   yet).
2. If disagreeing, name a CONCRETE, NEW missing check — never repeat a
   prior round's own stated criteria in reworded form (D2). This applies
   whether or not `priorRejection` is present; the instruction is a
   standing rule for the judge, not conditional on dispute history.

No change to `judgeVerifySemanticCorrectness`'s signature, no change to
`discovery.mjs`/`decompose.mjs` orchestration, no new round-tracking
state (D1).

## Why this size, not bigger or smaller

Smaller (prompt text only, no round-cap code) would still miss D2's
"must name a new check" rule, which needs its own instruction sentence.
Bigger (adding round-tracking/round-cap logic to `discovery.mjs`/
`decompose.mjs`) was explicitly rejected at `clarify` (D1) — `--force`
already exists as the escape valve, and a numeric cap adds an arbitrary
threshold this item's own evidence does not call for.

## Files touched

- `src/intake/judge-executor.mjs` — `buildVerifyCheckPrompt` (add the
  instruction block described above, inside the existing template
  literal, before the `# Câu hỏi` section so the judge reads context
  before being asked to decide).
- `test/intake/judge-verify-second-pass-stability.test.mjs` — one new
  test, named exactly `buildVerifyCheckPrompt states the verify is
  proposed before code exists and requires a new concrete gap on
  disagreement` (this item's own `verify` field already names this test
  by this exact description — set at `clarify`, dry-run confirmed against
  the current unfixed prompt that it fails: 0 matching tests). The test
  captures the built prompt (same `writeCapturingExecutor` fixture the
  file's other three tests already use) and asserts it contains both new
  instruction fragments.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `buildVerifyCheckPrompt` prompt text | low — pure string addition, existing tests are substring-based (see Mode/flag-count above) | new test in `judge-verify-second-pass-stability.test.mjs` captures and asserts on the added fragments; full file run (`node --test test/intake/judge-verify-second-pass-stability.test.mjs`) proves no regression to the 3 existing tests |
| Judge model actually honoring the new instruction (LLM behavior, not code) | not provable by a unit test — out of scope for this item's verify, which only proves the instruction text ships in the prompt, not that every future judge call obeys it | none needed at this size; if the category error recurs after this ships, that is new evidence for a follow-up item, not a gap in this one |

## No split

One honest piece of work — a single prompt-text addition in one function,
proven by one new test in the file that already covers this function's
other prompt-shape behavior. No child items.

## Proof surface (this item's own verify, unchanged from `clarify`)

```
out=$(node --test --test-name-pattern="buildVerifyCheckPrompt states the verify is proposed before code exists and requires a new concrete gap on disagreement" test/intake/judge-verify-second-pass-stability.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*buildVerifyCheckPrompt states the verify is proposed before code exists"
```

Dry-run against the current (unfixed) prompt confirmed this fails (0
matching tests) — the `avoid-vacuous-pass-with-node-test-test-name-
pattern.md` checkmark+fail-count shape, not the bare `pass>=1` trap it
documents.
