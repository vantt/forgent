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
asserts HEAD and cleanliness before setup, provisions dependencies there,
regenerates `phase-02-doc-inventory.{json,md}` from `BASE`, byte-compares them
to the committed artifacts, and emits a machine-readable receipt.

Local commands in a moving checkout are useful only as development diagnostics;
they are not authoritative Phase 02 verification evidence.

## Gates Covered By The Runner

- focused Phase 02 tests;
- Phase 02 inventory JSON + Markdown immutable-BASE regeneration and byte identity;
- `scripts/check-doc-inventory-gates.mjs`;
- legacy docs ratchet;
- docs/citation/ownership checks;
- changed-Markdown committed-tree link checks across `BASE..FIXED_END`;
- historical knowledge-registry plan preservation checks where relevant;
- `git diff --check` across `BASE..FIXED_END` and forbidden legacy/platform authority edit checks;
- full `npm test` unless `--skip-full-suite` is passed.

## Last Local Evidence Before Runner Canonicalization

The pre-runner Phase 02 local evidence remains preserved as historical context:
focused tests passed; inventory generation was deterministic and byte-identical;
the inventory gate, citation drift, legacy ratchet, `git diff --check`, and full
`npm test` passed. Artifact hashes were JSON
`9a953025db6340d97c313a4b88864b5d6b1858899d87a4b5e39001ad550d16de` and
Markdown `8529afeb8025f96af8e731658edcd89386af6629116dc4f8df3bbbf104eed4bb`.

This historical block does not supersede the runner above.
