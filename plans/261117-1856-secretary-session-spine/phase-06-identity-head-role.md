# Phase 6: Identity head role kind

## Inputs (read first)
- `docs/platform/identity/spec.md` §3, §7a (local session, roles), §10.
- `packages/identity/rust/src/directory.rs` (`ROLE_KINDS` l.37: `lead:` lane-id, `work:` work-item-id; `role_problem` l.167;
  "the Convention contract carries every role kind"), `packages/identity/rust/src/provider.rs` (`--register`).
- `packages/convention/contracts/convention.rules.v1.json` (the role-kind name rules; phase 4 already landed its kind there).
- Identity tests: `packages/identity/rust/tests/`.

## Files this phase may write
`packages/identity/**`, `packages/convention/contracts/convention.rules.v1.json`, `packages/convention/rust/tests/golden.rs`
(if it enumerates identifier kinds), `docs/platform/identity/**`. <!-- Updated: Validation Session 1 -->

## Steps
1. Add role kind `head:` whose name is `<persona>-<name>` (persona: an agent-definition name; name: `[a-z0-9-]{1,32}`),
   declared in the Convention contract the same way `lane-id` is.
2. `role_problem` accepts it; `fgos identity session --register --role head:secretary-miu` registers, and a second live
   session claiming the same `head:` role is refused the same way a duplicate `lead:` role is (read how `lead:` behaves
   first and match it; do not invent a new rule).
3. One owning test in the identity crate's tests ("a head role names a persona and a session name, and only one live
   session holds it; `--take` moves it to the caller", the move rotation relies on). Spec: one line in the role section and one decision-history entry.

## Verify
- `cargo test -p fgos-identity -p fgos-convention`; clippy and aarch64-apple-darwin check.

## Rollback
`git revert` the phase commit.
