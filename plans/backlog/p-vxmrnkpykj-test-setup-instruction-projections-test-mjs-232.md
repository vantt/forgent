---
id: p-vxmrnkpykj
title: "`test/setup/instruction-projections.test.mjs:232` is red on main: it reports `.fgos/instructions/effective/repo.json` and the `AGENTS.md` managed block as stale (tests, priority medium; source: HARDEN closing report section 2)"
status: done
priority: P2
area: tests
created: 2026-11-19
---

# Why

Cause traced 2026-11-19 (shaper report): the committed `.fgos/instructions/effective/repo.json` is stale because commit 75f55d942 changed `core/instructions/id-minting.md` and the later `build:skills` ran in a linked worktree, where the skip-worktree flag (`packages/git/rust/src/worktree.rs:938`) hid the regenerated file, so only `AGENTS.md` was committed. Lane: plan 261118-1159-owner-question-store.

# Done when

The cause is proven; on the main checkout `npm run build:skills` is run and exactly `.fgos/instructions/effective/repo.json` is committed; the test passes on main (the missing `.fgos/installation/projections/ledger.json` entry for `instruction:repo:*:AGENTS.md` is also repaired); `npm test` shows it green. Done 2026-11-19: `repo.json` fixed by 9847fe6ab on origin/main; main checkout fast-forwarded, `build:skills` regenerated the ledger, `instruction-projections` 15/0 in the main checkout (supervisor report).

# Notes

Migrated from the legacy backlog table. Original status: done.
