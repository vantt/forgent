# Research — tsk-2ua (dogfood-fixture expr-eval-chain replay)

## Round 1 (discovery)

**Goal:** confirm dogfood-fixture/'s module + test conventions for a new
`src/expr/{tokenize,evaluate,index}.mjs` feature with `test/expr/*.test.mjs`
unit tests via `node --test`.

**Checked:**
- `dogfood-fixture/package.json`: `"type": "module"` (ESM confirmed),
  `"test": "node --test 'test/**/*.test.mjs'"` — matches the item's own
  described test invocation exactly.
- `find dogfood-fixture/src dogfood-fixture/test`: `src/expr/` and
  `test/expr/` existed with real content (`tokenize.mjs`/`evaluate.mjs`/
  `index.mjs` + matching tests) — NOT baseline. `git log --oneline -- .../
  tokenize.mjs` traced this to `af229e91`, committed on `main` itself from
  an earlier, unrelated replay session — not this item's own history, and
  not something this session introduced. Reset via
  `dogfood-fixture && npm run reset:expr-eval-chain` (scenario's own
  documented precondition step), committed separately from this item's
  real work (`e1be53f7`).
- `dogfood-fixture/src/calculator.mjs`: plain named-export functions
  (`export function add(a, b) { return a + b; }`), no classes, no default
  export — this is the repo's own established style for this fixture.

**Found:** no genuine ambiguity. File paths, operator set, precedence
rule (`*`/`/` before `+`/`-`), scope exclusion (no parentheses), and test
location/framework are all fully specified in the item's own text and
consistent with the fixture's existing conventions.

**Verdict:** `clear`. verify: `cd dogfood-fixture && node --test 'test/expr/**/*.test.mjs'`
(the fixture's own `test` script is `node --test 'test/**/*.test.mjs'`
with no `$@` passthrough, so `npm test -- <pattern>` would silently run
the full fixture suite unfiltered rather than scoping to this item's own
files — calling `node --test` directly with the scoped glob avoids that,
and matches the scenario doc's own stated expected final verify).
