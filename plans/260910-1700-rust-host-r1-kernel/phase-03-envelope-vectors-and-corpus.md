# Phase 03 — Envelope Vectors And Serialization Corpus

Depends on: Phase 02 closed (shares the `node-harness` lease over
`test/rust-host/**`; sequenced to avoid concurrent edits, not a semantic
dependency on the harness itself).

## Objective

Generate, from the real Node `fgos.v1` envelope implementation, the golden
vectors and differential serialization corpus that P08's Rust tests later
prove byte-compatibility against. Node generates every vector; nothing here
is hand-typed.

## Requirements

- R1: `test/rust-host/generate-vectors.mjs` imports
  `src/state/envelope.mjs`'s `wrapEnvelope` directly (never shells out to
  `bin/fgos.mjs`) and writes `test/rust-host/vectors/envelope/*.json` +
  `test/rust-host/vectors/serialization/*.json`.
- R2: Envelope vectors cover at least a `version`-shaped payload and one
  array/list payload. Each vector file records: the input `data`, the
  compact-hash input bytes (`JSON.stringify(data)`), the resulting sha256
  hash, the full pretty-printed (two-space) envelope bytes, a timestamp
  shape/range predicate (regex or bounds, never an exact string), whether a
  trailing newline is present, and the exit code.
- R3: Serialization corpus files cover, one fixture minimum per category
  from `legacy-cli-transition.md` §4: object insertion order, integer
  limits, negative zero, floating exponent formatting, Unicode/control
  characters, nested arrays/maps, and null/booleans. Each fixture holds the
  input value plus Node's actual compact-hash-input bytes and pretty-
  rendered bytes for that value.
- R4: `test/rust-host/envelope-contract.test.mjs` regenerates every vector
  in memory from `generate-vectors.mjs` and asserts the committed files
  match byte-for-byte (drift guard, same pattern P01 uses for
  `command-routes.json`).
- R5: `envelope-contract.test.mjs` asserts the documented split as separate,
  independently-failing assertions — not one combined check: semantic data
  equality, compact hash input bytes, hash output, envelope
  order/pretty-rendering + key order, timestamp shape, trailing newline,
  stdout-vs-stderr channel separation, and exit/signal mapping.
- R6: The test file or its header comment names each of the seven
  serialization-corpus categories from R3 explicitly, so a Reviewer can
  check coverage by name rather than paraphrase.

## Files

Likely touch:

- `test/rust-host/generate-vectors.mjs` (new)
- `test/rust-host/vectors/envelope/*.json` (new, generated + committed)
- `test/rust-host/vectors/serialization/*.json` (new, generated + committed)
- `test/rust-host/envelope-contract.test.mjs` (new)

Do not touch:

- `src/state/envelope.mjs` (read-only input — imported, never edited)
- `packages/host-runtime/rust/**`, `apps/fgos/**`, `Cargo.*` (rust-kernel lease; P08 consumes these vectors later, not this cell)
- `test/rust-host/harness.mjs`, `test/rust-host/harness.test.mjs` (P02's files)

## Verification

```sh
node --test test/rust-host/envelope-contract.test.mjs
node test/rust-host/generate-vectors.mjs --check
```

- `envelope-contract.test.mjs` passes with the split assertions from R5 each
  independently green.
- `generate-vectors.mjs --check` exits 0 against the committed vectors
  (regeneration is byte-identical).
- Capability annotation for this cell: `code:implement`.
