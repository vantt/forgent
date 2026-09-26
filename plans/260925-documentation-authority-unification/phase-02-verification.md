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
from `BASE`, byte-compares the manifest, Markdown, and every shard to committed
artifacts, enforces the exact Phase 02 footprint allowlist, and emits a compact
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

Results: focused tests passed (51/51), deterministic regeneration passed, gate checker passed with explicit open findings only: 1042 gaps, 818 duplicate-content groups, 151 semantic-conflict groups. The canonical JSON manifest is 1,721 bytes; all 7 shards are under 25 MB; reassembled payload SHA-256 is `053b1fa219f564adbfda9e800b0f422748445f4eae1fa1b733dc46c79e92dcfc`; Markdown SHA-256 is `48465e6320062fa4857e12e6b011005a25d0b1e2a1176f7a4ed77934f7c14963`.

Authoritative skip-full-suite verifier passed after the remediation code/artifact commit and before this record-only hash refresh with `BASE=b3b63c68c6a4742e4e12eb8173f49693d8d29132`: `npm ci`, focused Phase 02 tests, shard/Markdown byte identity, inventory gate, legacy ratchet, docs/citation/ownership, changed-Markdown links, historical plan preservation, diff allowlist, and clean-after-checks all passed; full suite was intentionally skipped.

No full suite was run in this remediation cell.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
