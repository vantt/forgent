# Phase 02 Verification

```txt
Phase: 02 — Build repository-wide inventory and conservation ledger
Verification date: 2026-09-26
Status: PASS; independent closure-review verdict APPROVE for `f0c76c5e590339d9c815038539ff1f4a072c64e4..0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb`; tagged `documentation-authority-phase-02-20260926`
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

## Review Remediation Local Evidence (Cells A-G)

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

Results after remediation cell G: focused tests passed (71/71) for `test/scripts/generate-doc-inventory.test.mjs`, `test/scripts/check-doc-inventory-gates.test.mjs`, and `test/scripts/verify-phase-02.test.mjs`; deterministic immutable-base regeneration completed; gate checker passed with explicit open findings only: 1054 file/routing gaps, 306 claim identity-gap blockers, 1360 total gap/blockers, 818 duplicate-content groups, 151 semantic-conflict groups. The canonical JSON manifest is 2,271 bytes with SHA-256 `42989ecef7a2e40e1091ae40d863b5b6df5a69f0d0a5c6153901e286a2dcb275`; all 10 shards are under 25 MB (max 20,971,514 bytes); reassembled payload SHA-256 is `c570f8b37f50200c23897b241dc30b1dc579b6cb069c829325233345a02d7c73`; Markdown is 744,708 bytes with SHA-256 `c7c1bc636b590a23f8afc7b882572cca949bc3613dc611cb037e5094cfaf964f`; compact identity registry is unchanged at 44,988,772 bytes with SHA-256 `7e08a97664314189d1bdfc494924e5b2a14b0c1f221df90258855944b8b34730` and covers 4,305 documents / 85,772 units. Split dispositions are zero file rows and zero claim rows; dynamic consumer target-item fan-out is 128 items, with broad/alias dynamic expressions recorded as standalone unresolved edges.

Remediation G specifically verified: false one-owner split proposals demote to `unknown-blocking` with null target owner/anchor; JS/TS dynamic parsing skips line/block comments and quoted call text, recurses into nested calls such as `path.join(path.resolve(root, "docs"), "specs", name)`, scans relevant Markdown fenced code but not Markdown prose, emits explicit unresolvedRoot standalone gaps for leading aliases such as `DOCS_DIR`, and collapses repeated `**`; carry-forward refuses existing destination registry entries and updates unit status from the new classification.

The remediation G candidate is frozen before the final immutable full run. To avoid a self-referential receipt commit, the authoritative result is recorded in the annotation of the subsequent empty review-boundary commit, whose tree must equal this candidate's tested tree. The prior full receipt at `FIXED_END=0cd862471c8e306afe0a291264a9c0e5ba9e1fab` remains historical evidence only.

A later timeout review found the initial identity registry was empty and the generator still had fallback ID derivation; this pass bootstrapped persisted opaque IDs from `BASE=f0c76c5e590339d9c815038539ff1f4a072c64e4`, removed silent fallback derivation from normal row generation, and batched blob access in generator/gate coverage.

Earlier authoritative full verification passed with `FIXED_END=020829d63601a7da9f0be51c4686ca06db32e973` (tree `9c067da640935cabcafe6c2a8a9ffb89dcdee630`) before final remediation cell F. That receipt remains historical evidence for the prior state only; remediation G's authoritative result belongs to the subsequent empty same-tree boundary annotation.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
