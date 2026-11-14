---
phase: 5
title: "Seat config digest uses the canonical JSON door"
status: pending
effort: 0.5d
leak: "census rank 5"
startAfter: ["F0 wave A on main", "capability plan on main (it rewrites src/runner/execution/seat-policy.mjs)"]
landAfter: []
---

# Phase 05: Seat config digest through the canonical JSON door

Rules: `phase-lead-rules.md`. pNN = `p05`; report slug `odd-p05-seat-policy-canonical-json`; no Rust.
Facts: `phase-00-facts.md` "Leak 5".

## Outcome

`seatConfigDigestOf` and the account-view digest hash bytes from `canonicalJson` in `src/native/door.mjs` (RFC 8785, one crate).
The private copy in `src/runner/execution/seat-policy.mjs` is deleted. Digests of every real config are unchanged, proven
before the copy goes, because `configDigest` is persisted in unit records and replay refuses on a mismatch.

## Requirements

1. Proof first (in the phase branch, not committed as a product test): for the shipped standard config, this repository's
   `.fgos/config.yaml`, and every fixture config under `test/` that reaches `seatConfigDigestOf`, compute the digest with the
   private function and with the door; record counts and any difference in the report. If any differs, stop and ask the big
   lead (a difference means stored `configDigest` values would stop replaying).
2. Replace the private `canonicalJson` (:54) with the door's; delete the private function. `seatConfigOf` output that can carry
   `undefined` members (`defaults`, `modelPolicies`, `tierFallback` copied by reference) must not reach the door with an
   `undefined` member: if the proof finds one, drop it in `seatConfigOf` (where the slice is built), not in the digest.
3. `doors`: if F0's "canonical JSON bytes" row is on your base, remove the `seat-policy.mjs` debt entry; else follow the rules file.

## Files

- Modify: `src/runner/execution/seat-policy.mjs`, `docs/architecture-manifest.json` (debt entry, if present).
- Tests: `test/runner/execution/seat-policy.test.mjs:35-51` (key order, `$comment` excluded) stays the owner; add one case that
  the digest equals `sha256` of the door's bytes for a config with nested objects and numbers (why new: nothing ties the digest
  to the door today). Run `test/runner/execution/run-gate.test.mjs`, `test/runner/execution/bind.test.mjs`,
  `test/git/native-load.test.mjs` (door vectors), and the replay tests (`rg -l "binding-replay-config-mismatch" test`).
- Net size: src about -12, tests +10.

## Gates

`node scripts/run-tests.mjs test/runner/execution/seat-policy.test.mjs test/runner/execution/run-gate.test.mjs test/runner/execution/bind.test.mjs test/git/native-load.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus the replay tests above and `rg -l "seat-policy" test`.

## Risk and rollback

- Persisted digests change (L x H): requirement 1 blocks the change on any difference.
- The digest now needs the addon (L x L): `bindSeat` already needs the host; tests run with the staged addon.
- Rollback: revert the phase.
