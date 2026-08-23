# expr-eval-chain — plan

Item: `tsk-1wd`. Decisions: `docs/history/expr-eval-chain/CONTEXT.md`.

## Mode

**small.** Flag count: 0 of 10 (no auth, no authorization, no data model, no
audit/security, no external systems, no public contract change, not
cross-platform, no existing covered behavior touched, no weak-proof area,
single domain). Three new files + tests, no gray areas beyond what
`CONTEXT.md` already pinned — a few files, not a one-file `tiny`, not
standard/high-risk.

`fgos graph --json` shows `tsk-1wd` as an isolated component today (no
existing cross-item deps) — nothing there overrides the ordering already
locked in `CONTEXT.md` (`tokenize` → `evaluate` → `evaluateExpr`).

## Approach

Chosen path: build the three functions in their locked dependency order,
each with its own test file, matching `dogfood-fixture`'s existing
`calculator.mjs`/`calculator.test.mjs` convention (named ESM exports,
`node:test` + `node:assert/strict`, edge cases tested explicitly per D/A
in CONTEXT.md, not glossed over).

Rejected alternative: one monolithic `src/expr.mjs` file. The item's own
text (and decision 0018's MVP2 test intent) explicitly wants 3
independently-verifiable pieces with a real `deps` chain — collapsing them
into one file would remove the exact shape this replay is meant to
exercise, without saving real complexity (the three functions are already
naturally separable).

### Risk map

| piece | risk | proof point |
|---|---|---|
| `tokenize` | low — pure string→array, no external state | its own test file: numbers/operators split correctly, whitespace tolerated (A2), unrecognized char throws (A1) |
| `evaluate` | low — precedence logic is the only real branch point | its own test file: `*`/`/` binds before `+`/`-`, left-to-right within same precedence, malformed token sequence throws (A1) |
| `evaluateExpr` | low — thin composition of the two above | its own test file: end-to-end string→number, delegates correctly |

No medium/high-risk entries — nothing carried forward to `fgos-coding-validating`
beyond running the three test files for real.

## Shape (small)

1. `dogfood-fixture/src/expr/tokenize.mjs` — `tokenize(exprString)`.
2. `dogfood-fixture/src/expr/evaluate.mjs` — `evaluate(tokens)`, imports
   `tokenize`'s module only insofar as its own tests need fixtures (the
   function itself takes already-tokenized input, per the item's own
   signature).
3. `dogfood-fixture/src/expr/index.mjs` — `evaluateExpr(exprString)`,
   calls `tokenize` then `evaluate`.
4. Tests: `dogfood-fixture/test/expr/tokenize.test.mjs`,
   `dogfood-fixture/test/expr/evaluate.test.mjs`,
   `dogfood-fixture/test/expr/index.test.mjs`.

Cases each test file covers, per CONTEXT.md's A1/A2/A3:
- boundary: single-number expression (no operator), leading/trailing
  whitespace, no whitespace at all (A2).
- precedence: `+`/`-` vs `*`/`/` mixed, same-precedence left-to-right.
- error path: unrecognized character, trailing/dangling operator (A1).
- explicitly NOT covered (per A3): negative numbers / unary minus, and
  (per item text) parentheses — out of scope, no test asserts they work.

## Split

Locked `CONTEXT.md` dependency chain maps directly to 3 independently
workable children, matching the item's own text and decision 0018's
intended decompose shape:

1. **tokenize** — `dogfood-fixture/src/expr/tokenize.mjs` +
   `dogfood-fixture/test/expr/tokenize.test.mjs`. No deps.
   Verify: `node --test dogfood-fixture/test/expr/tokenize.test.mjs`
2. **evaluate** — `dogfood-fixture/src/expr/evaluate.mjs` +
   `dogfood-fixture/test/expr/evaluate.test.mjs`. Depends on: tokenize.
   Verify: `node --test dogfood-fixture/test/expr/evaluate.test.mjs`
3. **evaluateExpr** — `dogfood-fixture/src/expr/index.mjs` +
   `dogfood-fixture/test/expr/index.test.mjs`. Depends on: evaluate.
   Verify: `node --test dogfood-fixture/test/expr/index.test.mjs`

Root (`tsk-1wd`) keeps its own attached verify — corrected to
`node --test 'dogfood-fixture/test/expr/*.test.mjs'` (the original
`fgos discover` verdict omitted the `dogfood-fixture/` prefix; see backlog
`p-af05e742`) — as the final integration check once all three are `done`,
per the scenario's expected shape.

## Execution

Per the locked decision that Execute's build/verify/return path is already
mechanical, no re-design here — each piece above names the one command
that proves it done; that is Execute's whole contract.

## Result

All 3 children (`tsk-1wd-1`/`tsk-1wd-2`/`tsk-1wd-3`) reached `done`,
merged into this branch in dependency order. Root's own integration verify
(`node --test 'dogfood-fixture/test/expr/*.test.mjs'`) run for real on the
merged tree: 25/25 pass (2026-07-28).
