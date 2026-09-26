# Phase 02 Verification

```txt
Phase: 02 — Build repository-wide inventory and conservation ledger
Verification date: 2026-09-26
Status: final remediation committed-SHA skip-full-suite PASS at `FIXED_END=011e9b75798c9d9b689aa825b795c313e1498579`; final full pending
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

## Review Remediation Local Evidence (Cells A-F)

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

Results after final remediation cell F: focused tests passed (61/61) for `test/scripts/generate-doc-inventory.test.mjs` and `test/scripts/check-doc-inventory-gates.test.mjs`; deterministic immutable-base regeneration completed; gate checker passed with explicit open findings only: 1054 file/routing gaps, 306 claim identity-gap blockers, 1360 total gap/blockers, 818 duplicate-content groups, 151 semantic-conflict groups. The canonical JSON manifest is 2,455 bytes with SHA-256 `e8b683c4e91dcb790031a4f143fc258e99901e6f4877dd1de81ec9290596b34b`; all 11 shards are under 25 MB (max 20,971,518 bytes); reassembled payload SHA-256 is `45e083fe0b2f6f0e62152bf25075de53bc7b8a7c41e930491eeb4c7fedfdc404`; Markdown SHA-256 is `d18603aacc1d3f0ae391df0454b765e93373d520ae5f5a6390bdf2607746829f`; compact identity registry is unchanged at 44,988,772 bytes with SHA-256 `7e08a97664314189d1bdfc494924e5b2a14b0c1f221df90258855944b8b34730` and covers 4,305 documents / 85,772 units.

Remediation F specifically verified: carry-forward removes positional matching and refuses ambiguous duplicate/edited units; pure moves preserve source and claim IDs; balanced nested/multiline `path.join`/`path.resolve`/`new URL` consumer parsing emits standalone docs-rooted unresolved patterns such as `docs/specs/**` and `docs/**`; candidate single-owner proposals are demoted to `unknown-blocking` with null target owner; claim identity-gap blockers are included in summary/open findings/report; tied equal-prefix routes block like exact route conflicts.

Authoritative skip-full-suite verification passed after the final docs commit at `FIXED_END=011e9b75798c9d9b689aa825b795c313e1498579` (tree `807a42d3445b0293d5854e82f99572ae89ac4b17`): `npm ci`, 66 focused tests, immutable-base manifest/all-11-shards/Markdown byte identity, inventory gate with 1360 total gap/blockers (1054 file/routing, 306 claim-identity), legacy ratchet, 46 docs/citation/ownership tests, changed-Markdown links, historical-plan preservation, exact diff allowlist, and clean-after-checks passed. Full suite was intentionally skipped and remains pending per remediation instruction.

A later timeout review found the initial identity registry was empty and the generator still had fallback ID derivation; this pass bootstrapped persisted opaque IDs from `BASE=f0c76c5e590339d9c815038539ff1f4a072c64e4`, removed silent fallback derivation from normal row generation, and batched blob access in generator/gate coverage.

Earlier authoritative full verification passed with `FIXED_END=020829d63601a7da9f0be51c4686ca06db32e973` (tree `9c067da640935cabcafe6c2a8a9ffb89dcdee630`) before final remediation cell F. That receipt remains historical evidence for the prior state only; the current cell has a new committed-SHA skip verifier pass above, and the final full verifier remains pending.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
