# Phase 4: Integrate, docs and changelog

Capability: `code:implement`. Depends on phases 1, 2 and 3.

## Inputs

- The three phase branches; `plan.md` Acceptance criteria.
- `docs/platform/git/spec.md`, `docs/platform/identity/spec.md` (their settled-facts and "Lịch sử quyết định"
  sections), `CHANGELOG.md` `## [Unreleased]`.
- `packages/git/rust/tests/land_push_catch_up.rs` (`recover` helper, catch-up cases).

## Footprint

- `packages/git/rust/tests/land_push_catch_up.rs`
- `docs/platform/git/spec.md`
- `docs/platform/identity/spec.md`
- `CHANGELOG.md`

## Steps

1. Merge the three branches on one integration branch; resolve nothing by hand in a generated file.
2. One wiring proof in `land_push_catch_up.rs` only if no phase test already shows a pid writer's dead chain
   (real `writer_is_dead` from `fgos_identity`) blocking a catch-up and clearing after `recover_git_operations`;
   otherwise add nothing (one proof per behaviour).
3. Git spec: settled facts "a land-door commit left unpushed is published by the next catch-up; a foreign commit
   is refused" and "recover settles a pending chain of a proven-dead writer and records the recoverer". Identity
   spec: "a bare pid writer is proven dead only when its pid is absent". Decision narrative in each spec's
   decision-history section.
4. `CHANGELOG.md` `[Unreleased]`: one line per row (no more hand push after a dead land; `fgos git recover` frees a
   dead pid writer's chains and candidates).
5. Run the full gate on the merged tree.

## Verify

```bash
cargo test --workspace
npm test
```

Pass: both green on the merged tree; every acceptance criterion in `plan.md` points to a test that exists.

## Rollback

`git revert` the integration merge; the phase commits revert independently.
