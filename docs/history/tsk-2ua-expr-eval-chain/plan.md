# Plan — tsk-2ua (dogfood-fixture expr-eval-chain)

Mode: tiny

Direct entry — discovery verdict was `clear`, no `exploring` pass ran
(no CONTEXT.md exists for this item; nothing to cite back to).

## Approach

Three small, ordered functions in `dogfood-fixture/src/expr/`:
`tokenize.mjs` → `evaluate.mjs` (imports `tokenize`'s output shape) →
`index.mjs` (imports both, composes `evaluateExpr`). Fully specified by
the item's own text: token set is `+ - * /` only, no parentheses,
`*`/`/` bind tighter than `+`/`-`. Confirmed against the fixture's
existing convention (`src/calculator.mjs`: plain named-export functions,
no classes) — see `RESEARCH.md` round 1.

**Alternative rejected: split into 3 work items** (tokenize / evaluate /
evaluateExpr, `deps` chain). The scenario doc's own "Expected shape"
section names this as the intended parity-test outcome but explicitly
allows a pass-through as legitimate signal too. Real judgment for THIS
task's actual size: three ~15-20-line functions, one cohesive feature, no
independent ownership boundary that benefits from separate worktrees/
branches/merges — the file-level import dependency (evaluate importing
tokenize) is ordinary same-PR sequencing, not a reason to fragment into
three claimed work items. Pass-through is the honest engineering call
here, not a shortcut.

## Shape

Files (in write order, tiny mode — no wave/footprint table needed at
this size):
1. `dogfood-fixture/src/expr/tokenize.mjs` — `tokenize(exprString)`:
   scan left to right, accumulate digit/`.` runs into number tokens,
   each of `+ - * /` its own operator token. Whitespace is a separator,
   not a token.
2. `dogfood-fixture/src/expr/evaluate.mjs` — `evaluate(tokens)`: two-pass
   (first collapse `*`/`/` pairs left to right, then `+`/`-` left to
   right), or an equivalent single-pass precedence-climbing approach —
   implementer's choice, both are correct for this operator set.
3. `dogfood-fixture/src/expr/index.mjs` — `evaluateExpr(exprString)`:
   `evaluate(tokenize(exprString))`, nothing else.
4. `dogfood-fixture/test/expr/tokenize.test.mjs`,
   `evaluate.test.mjs`, `index.test.mjs` — `node --test`, covering at
   least: a multi-operator expression respecting precedence (the item's
   own `"3 + 4 * 2"` → `11` example), single-operator cases for all 4
   operators, and whitespace variations.

verify (root item, synced once the real command is confirmed at Step 5):
`cd dogfood-fixture && node --test 'test/expr/**/*.test.mjs'`.

## Outstanding questions

None
