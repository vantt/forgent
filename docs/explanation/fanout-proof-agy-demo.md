---
authoritative_for: examples/fanout-proof-agy demo, purpose of upper-case.mjs/count-vowels.mjs fixture pieces
---

# `examples/fanout-proof-agy/` — a deliberate two-piece fan-out test fixture

`tsk-17h` (follow-up to `tsk-1fk`) created two genuinely independent,
trivial string-utility pieces solely to give `fgos-fanout` two real,
unrelated candidates to dispatch concurrently through `agy`:

- **`upper-case.mjs`** — `toUpperFirst(str)`, uppercases only the first
  character. Tested against a normal string (`'agy' → 'Agy'`) and the
  empty-string boundary.
- **`count-vowels.mjs`** — `countVowels(str)`, counts case-insensitive
  `a`/`e`/`i`/`o`/`u` occurrences. Tested against `'agy' → 1` and the
  empty-string boundary (`0`).

Both are pure, synchronous, side-effect-free functions with no shared
state and no dependency ordering between them — deliberately, since the
lack of ordering is the entire point: a real test of `fgos-fanout`'s
concurrent dispatch, split into two children (`tsk-17h-1`, `tsk-17h-2`)
each independently claimable and dispatchable.

## Not accidental scope, not dead code to clean up

Like the earlier `tsk-1sj`/`tsk-30z`/`tsk-50ic` fan-out demo evidence,
these files exist specifically as living, re-runnable proof that
concurrent fan-out dispatch works — not incidental scratch work. Don't
remove `examples/fanout-proof-agy/` in a later cleanup pass without
checking whether it's still serving that purpose.
