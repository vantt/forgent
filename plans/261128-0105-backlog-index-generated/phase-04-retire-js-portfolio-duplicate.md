# Phase 4 — Retire the JavaScript portfolio duplicate

Capability: `code:implement`

## Inputs

- `plan.md` of this directory (prior art, criterion 6, Authority map row 3).
- `packages/portfolio/index-generator.mjs`, `portfolio-check.mjs`, `item.mjs`, `discussion.mjs`, `vocabulary.mjs`.
- `test/portfolio/portfolio-check.test.mjs` (every case).
- `apps/fgos/tests/portfolio_check.rs` (the Rust owner of the same behaviours) and `apps/fgos/src/wiring/portfolio.rs`.

## Footprint

packages/portfolio/index-generator.mjs, packages/portfolio/portfolio-check.mjs, packages/portfolio/item.mjs,
packages/portfolio/discussion.mjs, packages/portfolio/vocabulary.mjs, test/portfolio/portfolio-check.test.mjs,
apps/fgos/tests/portfolio_check.rs

## Steps

1. Confirm nothing outside the set imports it: `rg -n "packages/portfolio/[a-z-]+\.mjs|from '\./(item|discussion|vocabulary|index-generator|portfolio-check)\.mjs'" --glob '!plans/**' --glob '!node_modules/**'`
   returns only files of the set. If anything else imports it, stop and report (BLOCKED).
2. Map each case of `test/portfolio/portfolio-check.test.mjs` to the `apps/fgos/tests/portfolio_check.rs` case
   that proves the same behaviour. A case with no Rust owner is ported into `portfolio_check.rs` (behaviour named
   in the title, asserting no less). Write the mapping table in
   `plans/261128-0105-backlog-index-generated/reports/phase-04-test-ownership.md`.
3. Delete the five `.mjs` files and the test. Keep `packages/portfolio/contracts/` (Rust and the authority model
   use them).

## Verify

`cargo test -p fgos --test portfolio_check` and `node scripts/run-tests.mjs test/architecture.test.mjs` pass.
Pass condition: step 1's search returns nothing; the mapping report names an owner for every deleted case.

## Rollback

Revert the phase's commit; the files return unused.
