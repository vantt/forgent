# Research log — tsk-16a (truncateTitle ellipsis marker)

## Round 1 — 2026-08-16

**Asked:** find every test asserting `truncateTitle`'s exact output (word-
boundary-only, no ellipsis) or `MAX_TITLE_LENGTH`-exact behavior, and every
other call site/consumer of `truncateTitle`/`MAX_TITLE_LENGTH` that assumes
the output never carries a trailing marker.

**Checked:** `rg -n "truncateTitle|MAX_TITLE_LENGTH" src bin test`.

**Found:**

- `src/state/work.mjs:48-62` — `truncateTitle` itself, the only place to
  change.
- `src/state/store.mjs:200,344` — `addWork`/`editWork` normalize points, no
  assumption about output shape beyond "a string ≤ `MAX_TITLE_LENGTH`".
- `src/intake/classify.mjs:34,37` — `deriveTitle`'s two exits, same.
- `src/runner/loop.mjs:699` — `normalizedTitle = truncateTitle(block.title)…`
  compared against a stored title that itself went through the SAME
  `truncateTitle` at write time (`addWork`). Self-consistent either way —
  not a break.
- `test/state/store.test.mjs:1089,1106` — `assert.ok(stored.title.length <=
  MAX_TITLE_LENGTH)`. Inequality, holds regardless of a trailing marker.
- `test/intake/classify.test.mjs:25,35` — same inequality shape, holds.
- `test/intake/classify.test.mjs:26` — `assert.equal(longText.startsWith(title), true)`
  in "deriveTitle truncates long text with no natural boundary at a word
  edge". **Breaks**: with a marker appended, `title` no longer reads as a
  literal prefix of `longText`.
- `test/intake/classify.test.mjs:36` — same `startsWith` shape in "deriveTitle
  bounds a first sentence that runs past the title bound". **Breaks**, same
  reason.
- `test/intake/classify.test.mjs:47` — `assert.equal(title.length,
  MAX_TITLE_LENGTH)` in "deriveTitle cuts a single unbroken token at a hard
  edge" (`'x'.repeat(140)`, no space anywhere → hard-cut branch). Reserving
  1 char for a single-char marker keeps total length == `MAX_TITLE_LENGTH`
  exactly (99 + 1) — **does not break**, no edit needed.
- `test/runner/loop.test.mjs:1637` — `assert.equal(discovered[0].title,
  'A'.repeat(MAX_TITLE_LENGTH), …)` in the S11 forged-title-injection test
  (`test/runner/loop.test.mjs:1616`). **Breaks**: exact-string match against
  100 literal `'A'`s; a trailing marker changes the literal content while
  keeping the length the same, so this line needs updating to expect the
  marker. The rest of that test (no `'FORGED'` substring, no embedded
  newline) is about the security property, not the exact truncation shape —
  unaffected.

**Verify command:** `node --test 'test/**/*.test.mjs'` (repo's own
`package.json` `test` script) — run narrow first (`test/intake/classify.test.mjs
test/runner/loop.test.mjs test/state/store.test.mjs`), then the full suite.

**Open:** none — every call site and every test assertion touching
`truncateTitle`'s output shape is now accounted for.
