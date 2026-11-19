# Phase 1: Identity and convention for the new kinds

## Inputs
- Section 7 anchor `#task-ids-and-paths` of `docs/discussions/work-data-model/DISCUSSION.md`, decision D-ADR0082.
- Backlog row `p-nsngcpgoi2`.
- `packages/identity/rust/`, `packages/identity/contracts/`.
- `packages/convention/rust/`, `packages/convention/contracts/convention.rules.v1.json`.

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
2. Register the `discussion` artifact kind in `packages/identity/contracts/`.
3. In `packages/convention/contracts/convention.rules.v1.json` and `packages/convention/rust/`:
   - Add convention rule for backlog item files: `plans/backlog/{id}-{slug}.md` where `{id}` matches `p-[a-z2-7]{10}`.
   - Add convention rule for discussion directories: `plans/discussions/{id}-{slug}/DISCUSSION.md` where `{id}` matches `ds-[a-z2-7]{10}`.
   - Add convention rule for generated backlog index: `plans/backlog.md`.
4. Update convention golden outputs and contract validation tests.
5. Add unit and integration tests covering the new kind and paths.

## Verify
`cargo test -p fgos-identity -p fgos-convention`

## Rollback
Revert the commit; the `discussion` mint kind and convention rules are removed.
