# Phase 02 Verification

```txt
Phase: 02 — Build repository-wide inventory and conservation ledger
Verification date: 2026-09-26
Status: LOCAL PASS; pending independent review
Authoritative runner: scripts/verify-phase-02.mjs
Result: Phase 02 artifacts are verified only by the immutable detached-worktree runner, not by commands run in a moving local checkout.
```

## Authoritative Command

Run the Phase 02 gate through the single immutable runner:

```bash
BASE=<phase-01-commit> FIXED_END=<phase-02-commit> \
  node scripts/verify-phase-02.mjs --skip-full-suite

BASE=<phase-01-commit> FIXED_END=<phase-02-commit> \
  node scripts/verify-phase-02.mjs
```

`BASE` is the immutable Phase 01/base commit used as the source tree for Phase
02 inventory regeneration. `FIXED_END` is the immutable Phase 02 commit being
reviewed. The runner creates a detached clean worktree exactly at `FIXED_END`,
asserts HEAD and cleanliness before setup, provisions dependencies there with
`npm ci` when a lockfile exists, regenerates `phase-02-doc-inventory.{json,md}`
from `BASE` using the committed opaque identity registry through explicit `--identity-registry`, byte-compares the manifest, Markdown, and every shard to committed
artifacts, validates registry commit/count/hash/path metadata, enforces exact registry document/unit equality plus stale-unit detection, enforces the exact Phase 02 footprint allowlist, and emits a compact
machine-readable receipt.

Local commands in a moving checkout are useful only as development diagnostics;
they are not authoritative Phase 02 verification evidence.

## Gates Covered By The Runner

- focused Phase 02 tests;
- Phase 02 inventory manifest + every JSON shard + Markdown immutable-BASE regeneration and byte identity;
- `scripts/check-doc-inventory-gates.mjs`;
- legacy docs ratchet;
- docs/citation/ownership checks;
- changed-Markdown committed-tree link checks across `BASE..FIXED_END`;
- historical knowledge-registry plan preservation checks where relevant;
- `git diff --check` across `BASE..FIXED_END` and exact allowed-footprint checks;
- full `npm test` unless `--skip-full-suite` is passed.

## Review Remediation Local Evidence (Cell A)

Focused remediation checks in the moving worktree (not full-suite, not authoritative runner evidence):

```bash
node --test test/scripts/generate-doc-inventory.test.mjs
node scripts/generate-doc-inventory.mjs --commit documentation-authority-phase-01-20260926 \
  --identity-registry plans/260925-documentation-authority-unification/phase-02-identity-registry.json \
  --json-out plans/260925-documentation-authority-unification/phase-02-doc-inventory.json \
  --md-out plans/260925-documentation-authority-unification/phase-02-doc-inventory.md
# fresh regeneration to temp files, cmp against committed artifacts: byte-identical
node scripts/check-doc-inventory-gates.mjs \
  --identity-registry plans/260925-documentation-authority-unification/phase-02-identity-registry.json
```

Results after remediation E: focused tests passed (59/59), deterministic regeneration passed, gate checker passed with explicit open findings only: 1054 gaps, 818 duplicate-content groups, 151 semantic-conflict groups. The canonical JSON manifest is 2,455 bytes with SHA-256 `2bd0345230d1249794aea40c2369eed0e0080d4cea5e9666aa490aba2e685e90`; all 11 shards are under 25 MB; Markdown SHA-256 is `65433755d45107d19ee12646f1b0436163e1d35df990dc61d712d4668c211ba7`; identity registry is 52,202,925 bytes with SHA-256 `e20adba3f40a1c52d5eecbc8f7a685225783a371fe14f3205ccefba25ca7c9b8` and covers 4,305 documents / 85,772 units.

Remediation E specifically verified: claim lookup keys exclude `claimKind`/`status`/classification, reclassification with unchanged text preserves IDs, duplicate-titled sections carry semantic fingerprints rather than ordinal anchors, indistinguishable duplicates surface explicit ambiguity blockers, path-join/new-URL dynamic consumers emit standalone unresolved patterns, normal generation fails closed without a pinned registry, and stale registry units are detected.

Authoritative skip-full-suite verification passed for the remediation commit before final record-only amend: 64 focused tests, immutable-base manifest/all-11-shards/Markdown byte identity, inventory gate, legacy ratchet, 46 docs/citation/ownership tests, changed-Markdown links, historical-plan preservation, exact diff allowlist, and clean-after-checks passed. Full suite was intentionally skipped per remediation instruction.

A later timeout review found the initial identity registry was empty and the generator still had fallback ID derivation; this pass bootstrapped persisted opaque IDs from `BASE=f0c76c5e590339d9c815038539ff1f4a072c64e4`, removed silent fallback derivation from normal row generation, and batched blob access in generator/gate coverage.

Authoritative full verification passed with `FIXED_END=020829d63601a7da9f0be51c4686ca06db32e973` (tree `9c067da640935cabcafe6c2a8a9ffb89dcdee630`): `npm ci`, 58 focused tests, immutable-base manifest/all-11-shards/Markdown byte identity, identity-registry validation, inventory gate, legacy ratchet, 46 docs/citation/ownership tests, changed-Markdown links, historical-plan preservation, exact diff allowlist, clean detached Rust release build, and clean-after-checks all passed. The full suite passed with 7,819 total / 7,743 passed / 0 failed / 8 skipped / 68 todo; full-suite log SHA-256 `4bea1d4bea6e4858678640fc88a91b2222dcc82a278f5198e77e639f32763d5c`; verifier receipt log SHA-256 `d2597b9fa1fc710e43e77ef788671f2cf0540db9ab8ca1cfb831492d7b3db2a7`. Two immediately preceding full-suite attempts encountered unrelated live-gateway/concurrency timing flakes and were not accepted; the successful receipt is the authoritative evidence.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
