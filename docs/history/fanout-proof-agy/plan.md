# plan.md — tsk-17h: fanout-proof-agy

Item: `tsk-17h`

Mode: **tiny** — two isolated new files plus two isolated new test files,
zero coupling to existing code or to each other, zero existing behavior
touched. No `CONTEXT.md` exists for this item (discovery verdict was
`clear`, which skips `exploring`) — the item's own description already
fully pins scope for both pieces: file paths, function signatures,
behavior, and each piece's two test assertions. Nothing left to lock.

## Approach

Purpose: a second, follow-up dispatch-proof demo after `tsk-1fk` — this
one specifically to exercise `fgos-fanout` (concurrent dispatch of
multiple independently-workable children through `agy`) rather than a
single sequential out-of-process dispatch.

The two pieces are already independent by construction (per the item's own
description): `upper-case.mjs`/`toUpperFirst` and `count-vowels.mjs`/
`countVowels`. Neither imports, calls, or shares state with the other —
no ordering dependency, no shared file.

Impact-analysis capability gate: `fgos tool query --capability
impact-analysis --status present` → provider `gitnexus`, `status:
present` → posture `full`. Not applicable regardless: every file both
pieces touch is brand new under `examples/fanout-proof-agy/`, so there is
no existing code whose blast radius needs checking.

Files touched (all new, no existing file edited):

- `examples/fanout-proof-agy/upper-case.mjs`
- `examples/fanout-proof-agy/upper-case.test.mjs`
- `examples/fanout-proof-agy/count-vowels.mjs`
- `examples/fanout-proof-agy/count-vowels.test.mjs`

Order: no dependency ordering between the two pieces — that lack of
ordering is the entire point of this item (a real test of concurrent
fan-out dispatch).

## Shape

Two independent pieces, each a single atomic unit of implementation +
test (done by whichever executor `fgos-fanout` dispatches each piece to,
not by this planning pass):

- **Piece A — `upper-case`**: `upper-case.mjs` exports
  `toUpperFirst(str)`, uppercasing the first character of `str` and
  leaving the rest unchanged. `upper-case.test.mjs` (`node:test` +
  `node:assert`) asserts `toUpperFirst('agy') === 'Agy'` and
  `toUpperFirst('') === ''`.
- **Piece B — `count-vowels`**: `count-vowels.mjs` exports
  `countVowels(str)`, counting case-insensitive occurrences of
  `a`/`e`/`i`/`o`/`u` in `str`. `count-vowels.test.mjs` asserts
  `countVowels('agy') === 1` and `countVowels('') === 0`.

Concrete cases already covered by each piece's two locked assertions: a
normal non-empty string and the empty-string boundary. No
concurrent-access or partial-failure surface exists for either — both are
pure, synchronous, side-effect-free string functions — nothing further to
sketch at `tiny` depth.

## Decide the split

Two independently workable pieces, exactly as the item's own description
already lays out — this is the whole reason the item exists (to give
`fgos-fanout` two real candidates). Writing specs below, creating nothing
here; `fgos-coding-validating`'s own gate materializes them.

```json
[
  {
    "title": "fanout-proof-agy: upper-case.mjs (toUpperFirst)",
    "verify": "node --test examples/fanout-proof-agy/upper-case.test.mjs",
    "action": "Implement examples/fanout-proof-agy/upper-case.mjs exporting toUpperFirst(str), uppercasing str's first character only; add upper-case.test.mjs asserting toUpperFirst('agy') === 'Agy' and toUpperFirst('') === ''. Per tsk-17h's own description (fanout-proof-agy, piece 1 of 2) — no CONTEXT.md/exploring needed, discovery was clear.",
    "kind": "task",
    "risk": "light",
    "footprint": ["examples/fanout-proof-agy/upper-case.mjs", "examples/fanout-proof-agy/upper-case.test.mjs"]
  },
  {
    "title": "fanout-proof-agy: count-vowels.mjs (countVowels)",
    "verify": "node --test examples/fanout-proof-agy/count-vowels.test.mjs",
    "action": "Implement examples/fanout-proof-agy/count-vowels.mjs exporting countVowels(str), counting case-insensitive a/e/i/o/u occurrences; add count-vowels.test.mjs asserting countVowels('agy') === 1 and countVowels('') === 0. Per tsk-17h's own description (fanout-proof-agy, piece 2 of 2) — no CONTEXT.md/exploring needed, discovery was clear.",
    "kind": "task",
    "risk": "light",
    "footprint": ["examples/fanout-proof-agy/count-vowels.mjs", "examples/fanout-proof-agy/count-vowels.test.mjs"]
  }
]
```

## Outstanding questions

None
