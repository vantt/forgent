# Phase 9: Migrate the existing portfolio

Status: draft. Decisions: A5 e, A5 f, A8. Raises two owner questions when its lists exist.

## Inputs
- Discussion §7 task-migrate, §3 I31 and I33 (535 rows: 340 proposed, 188 done, 6 dropped; 55 plans, 18 cite several rows, 15 cite none).
- `fgos migrate portfolio` (`apps/fgos/src/wiring/migrate.rs`, now on the crate) and `fgos portfolio check`.
- The 40 files that reference `plans/backlog` (list: `rg -l "plans/backlog" src bin apps packages core domains scripts test`).

## Footprint
- `plans/backlog/**`, `plans/initiatives/**`
- the non-crate files that reference `plans/backlog` (listed in `plan.md` phase 9 row), `core/skills/fgos-secretary/**`, `core/skills/fgos-supervisor/**`
- generated renders `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**`

## Steps
1. Write the `domain`/`kind` classification proposal for all rows to `reports/classification.md`; ask the owner with `fgos questions ask` (five-part form) and record the `q-` id in `plan.md`.
2. Write the `initiative:` proposal for the 33 plans that cite several rows or none to `reports/plan-initiatives.md`; ask the owner the same way.
3. Meanwhile move started, `done` and `dropped` rows to `plans/initiatives/` through `fgos migrate portfolio`.
4. Repoint each code file that reads `plans/backlog` to also read `plans/initiatives/` through the crate, or leave it when it means only waiting items; note each decision in `reports/repoint.md`.
5. When the answers arrive, apply `domain` and `kind` to every row and one `initiative:` to each plan through `fgos migrate portfolio`; plans of other leads get only the frontmatter key.
6. Run `fgos portfolio check` and fix every finding.

## Verify
`fgos portfolio check` exits 0 on the migrated tree; `npm test` passes.

## Rollback
The file moves and frontmatter edits are one commit; `git revert` it.
