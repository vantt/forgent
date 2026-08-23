# expr-eval-chain — locked decisions

Item: `tsk-1wd`. Source: `dogfood-fixture/scenarios/expr-eval-chain.md`
canonical submit text (MVP2 replay scenario, decision 0018, backlog
`p-52601a01`).

## Feature boundary

Add simple arithmetic expression evaluation to `dogfood-fixture/`, as three
functions with an explicit dependency chain:

1. `tokenize(exprString)` — `dogfood-fixture/src/expr/tokenize.mjs`. Splits
   a string like `"3 + 4 * 2"` into an array of number/operator tokens.
2. `evaluate(tokens)` — `dogfood-fixture/src/expr/evaluate.mjs`, depends on
   `tokenize`. Computes the result respecting operator precedence
   (`*`/`/` before `+`/`-`). Supports exactly these 4 operators — nothing
   else, no parentheses.
3. `evaluateExpr(exprString)` — `dogfood-fixture/src/expr/index.mjs`,
   depends on `evaluate`. Calls `tokenize` then `evaluate`, returns the
   numeric result.

Unit tests for all three, via `node --test`, at
`dogfood-fixture/test/expr/*.test.mjs`.

## Locked decisions

No question met the material/grounded/answerable bar for a person —
the submitted text already pins operator set, precedence, dependency
order, file paths, and test location. The gaps below are implementer-only
concerns (data-shape edge cases, not product decisions), pinned as
assumptions instead of asked:

- **A1 — malformed/unsupported input.** Not addressed by the item text.
  Scout of `dogfood-fixture/src/calculator.mjs` +
  `dogfood-fixture/test/calculator.test.mjs` shows this fixture's existing
  precedent: no special-casing, native-semantics-or-throw. Same default
  here: `tokenize`/`evaluate` throw a descriptive `Error` on an
  unrecognized character or a token sequence that can't reduce to a single
  number (e.g. trailing operator). Left to `fgos-coding-planning` to size the
  actual exception shape.
- **A2 — whitespace.** The example (`"3 + 4 * 2"`) uses spaces, but the
  item never requires them. Assumption: `tokenize` tolerates any amount of
  whitespace (including none) between tokens — the item's own operator
  set and grammar are already fully pinned, this is a tokenizer
  implementation detail.
- **A3 — negative numbers / unary minus.** Not mentioned. The item text
  says "CHỈ hỗ trợ 4 toán tử này" (only these 4 operators, no
  parentheses) — read as scoping to binary use of `+ - * /` over
  non-negative numeric literals only. Assumption: no unary minus, no
  negative literals. If a real need for negative numbers surfaces later,
  it is new scope, not this item.

## Pinned terms

- "token" = a numeric literal (as a JS number) or one of the 4 operator
  characters `+ - * /`, per A2/A3 above.

## Scout evidence

- `dogfood-fixture/src/calculator.mjs`, `dogfood-fixture/test/calculator.test.mjs`
  — existing fixture module/test conventions: named ESM exports, `node:test`
  + `node:assert/strict`, edge cases tested explicitly rather than glossed
  over. `src/expr/*` and `test/expr/*.test.mjs` should follow the same
  shape.
- `dogfood-fixture/scenarios/expr-eval-chain.md` — canonical scenario doc;
  this item's text is a verbatim copy of its "Canonical submit text"
  section.
- No prior `src/expr/` or `test/expr/` in the repo (baseline, verified
  before pick).

## Deferred to planning

- Exact split points / whether this decomposes into 3 children matching
  the 3 functions, or fewer — `fgos-coding-planning`'s call, not locked here.
- Exact `Error` message/shape for A1.
