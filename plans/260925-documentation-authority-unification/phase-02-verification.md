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
from `BASE` using the committed opaque identity registry, byte-compares the manifest, Markdown, and every shard to committed
artifacts, validates registry commit/count/hash metadata, enforces the exact Phase 02 footprint allowlist, and emits a compact
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
  --json-out plans/260925-documentation-authority-unification/phase-02-doc-inventory.json \
  --md-out plans/260925-documentation-authority-unification/phase-02-doc-inventory.md
# fresh regeneration to temp files, cmp against committed artifacts: byte-identical
node scripts/check-doc-inventory-gates.mjs
```

Results: focused tests passed (58/58), deterministic regeneration passed, gate checker passed in 8.5s with explicit open findings only: 1054 gaps, 818 duplicate-content groups, 151 semantic-conflict groups. The canonical JSON manifest is 2,454 bytes with SHA-256 `c50920736c11d87d21958a6d5e89caa76b9c684794c3a9b09696783e63ed4dea`; all 11 shards are under 25 MB; Markdown SHA-256 is `c9c48e76ba546e8eec3873f8a20db822dd8d4a3396f35e2730cf74e029d85237`; identity registry is 43,883,041 bytes with SHA-256 `e896d91e7c60995fb08c68df17ea7606b1459d09e0e0d875346492fbf770ddda` and covers 4,305 documents / 85,772 units.

A later timeout review found the initial identity registry was empty and the generator still had fallback ID derivation; this pass bootstrapped persisted opaque IDs from `BASE=f0c76c5e590339d9c815038539ff1f4a072c64e4`, removed silent fallback derivation from normal row generation, and batched blob access in generator/gate coverage.

The authoritative verifier is expected to be invoked with the final immutable review commit as `FIXED_END`; the latest local skip-full-suite invocation passed all covered checks (`npm ci`, 58 focused tests, immutable-base manifest/shard/Markdown byte identity, identity-registry validation, inventory gate, legacy ratchet, 46 docs/citation/ownership tests, changed-Markdown links, historical-plan preservation, exact diff allowlist, and clean-after-checks) in about 29s. This receipt intentionally skipped the full suite; the final review boundary still requires the verifier's full-suite mode.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
