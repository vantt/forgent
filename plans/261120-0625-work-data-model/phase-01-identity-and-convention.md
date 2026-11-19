# Phase 1: Identity mint kind and convention rules for portfolio files

## Inputs
- Settled discussion `docs/discussions/work-data-model/DISCUSSION.md` §6, §7 `#task-ids-and-paths`, D-ADR0082.
- `packages/identity/rust/` and `packages/identity/contracts/`.
- `packages/convention/rust/` and `packages/convention/contracts/convention.rules.v1.json`.

## Files it may write
- `packages/identity/rust/src/**`
- `packages/identity/contracts/**`
- `packages/convention/rust/src/**`
- `packages/convention/contracts/**`
- `packages/identity/rust/tests/**`
- `packages/convention/rust/tests/**`

## Steps
1. Add `discussion` mint kind to `packages/identity/rust/`:
   - Mint prefix `ds-` followed by 10 base32 lowercase characters (`ds-[a-z2-7]{10}`).
   - Update `fgos identity mint --kind discussion` CLI support.
2. Register the new kind in `packages/identity/contracts/` schemas.
3. In `packages/convention/contracts/convention.rules.v1.json` and `packages/convention/rust/`:
   - Add rule for backlog items: `plans/backlog/{id}-{slug}.md` where `{id}` matches `p-[a-z2-7]{10}`.
   - Add rule for discussions: `plans/discussions/{id}-{slug}/DISCUSSION.md` where `{id}` matches `ds-[a-z2-7]{10}`.
   - Add rule for the generated backlog index: `plans/backlog.md`.
4. Update convention golden outputs and contract validation tests.
5. Add owning tests in `packages/identity/rust/tests/` and `packages/convention/rust/tests/`.

## Verify
`cargo test -p fgos-identity -p fgos-convention`

## Rollback
Revert the commit; no new artifact kinds or convention paths remain registered.
