# Phase 9: Integrate

Merge the phase branches, prove the combined tree, and leave the follow-ups with their owners.

Capability: `code:test`.

## Inputs

- Every phase branch; `reports/measure-layerings.md`, `reports/measure-layerings-after.md`.
- `changelog.d/README.md` (fragment scheme).

## Files this phase may write

`changelog.d/261127-1247-component-authority-layerings.md` and `reports/closing.md` of this plan.

## Steps

1. Changelog fragment: other projects' models with `layer`, `tier` or `source` are refused by
   name and must rename to `hexagon`, `stack`, `paths`; layerings are declared in `layers.yaml`;
   `declare` now needs every declared layering; `locate` answers four layerings.
2. Host step (lead): `fgos release check --worktree <integration worktree>`; plus `npm test` and
   `cargo test --workspace` on the same tree.
3. `reports/closing.md`: acceptance criteria 1-14 each with its evidence; the measure before and
   after; the list of named-debt exceptions (component, reason).
4. Ask the secretary (`fgos supervisor raise --kind coordination-help` or the mailbox to
   `head:secretary-*`) to open the backlog rows: hardcoded `MODEL_DIR` (CAS-D22 (3)); splitting
   `src/util/` to owning components (CAS-D19); one row per mixed-role component left as named
   debt (CAS-D10). No head writes `plans/backlog.md`.

## Verify

`fgos release check --worktree <integration worktree>` passes; `npm test` and
`cargo test --workspace` green. Pass: all three, and `closing.md` maps every criterion.

## Rollback

Revert the integration merge; phases revert in reverse wave order.
