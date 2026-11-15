# Seat config digest through the canonical JSON door

Branch `one-door-debt/p05`, base `8d6a07c4c` (capability reads landed).

## What changed

- `seat-policy.mjs`: private `canonicalJson` deleted; digest, account-view digest and cache key use `canonicalJson` from `src/native/door.mjs`.
- `seatConfigOf` returns `JSON.parse(JSON.stringify(config))`: the slice is exactly what the crate receives as JSON text, so a
  non-finite number and an `undefined` array member become `null` and an `undefined` object member is absent. The door then never
  throws on a config that bound before, and the crate input is unchanged.
- `docs/architecture-manifest.json`: "canonical JSON bytes" row had the seat-policy debt entry; removed (`debt: []`).
  Final `allowed` list unchanged, `debt` empty. Census regenerated with `--write-census` (payload digest only).

## Proof before deleting the copy

Temporary dual-compute (private vs door) inside `seat-policy.mjs`, not committed. Run over 13 test files reaching seat-policy
(seat-policy, run-gate, bind, tier-fallback, config-snapshot-hash, config-seat-binding-layers, tier-cell, driver-rununit,
operation-choice, provider-pool-lease, dispatch-production-call-sites, effective-execution-contract, run-case-admission):
- 309 config slices, 245 account views, 7 asks: 0 byte differences, 0 throws.
- Real configs: this repository's `.fgos/config.yaml` and the shipped standard (empty project dir): identical bytes.
- Synthetic: `Infinity`/`NaN` in `defaults`, `modelPolicies`, a capability role `prefer` list, and `undefined` array member: the
  door throws `canonical-json-not-json` where the private copy wrote `null`. Hence the normalization.
- Account view cannot carry non-finite values (`readAccountStates` guards `Date.parse` NaN, uses `MAX_SAFE_INTEGER`).

## Deviation from the phase text

Phase said write `null` for an `undefined` object member if private bytes show it so. Private bytes did write `null`, but the crate
never saw that member (JSON text drops it). Keeping the crate's binding unchanged was chosen over matching the old digest for an
`undefined` member, which only a programmatic config can carry (YAML/JSON cannot express it), so no persisted `configDigest`
changes. Digests of every real config are byte-identical.

## Tests

- New in `test/runner/execution/seat-policy.test.mjs`: digest equals sha256 of door bytes (nothing tied them before); non-finite and
  undefined members bind and digest over the JSON the crate receives (the door refuses what the private copy accepted).
- Green: seat-policy, run-gate, bind, native-load, architecture, doc-health, git-mutation-census, mailbox-behaviour-v7n,
  envelope-contract, fgos-manifest, config-seat-binding-layers, tier-fallback, config-snapshot-hash (197+ tests);
  decision-citation-drift no new findings; one-door scan 0 undeclared sites. Replay test is `run-gate.test.mjs`.

CHANGELOG: none (no user-visible change).

## Lessons

- A proof that dual-computes inside the code under change and runs the existing suites gives hundreds of real samples cheaply.
- `JSON.parse(JSON.stringify(x))` is the single definition of "what the crate receives"; normalize to it instead of hand-writing rules.
- Editing any product file changes the mutation census payload digest; regenerate it before the gate.

## Authority

None added; `canonicalJson` in `src/native/door.mjs` stays the one owner of RFC 8785 bytes.

Status: DONE
