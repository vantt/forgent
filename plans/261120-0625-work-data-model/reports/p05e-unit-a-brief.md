# Phase 5, unit 2a: route `fgos migrate portfolio` and read discussion roots from convention rules

Phase file: plans/261120-0625-work-data-model/phase-05-migration.md (steps 3 and 4). Owner answer q-exu5x27hbq: "Add all 5 paths".

## Context
`apps/fgos/src/wiring/migrate.rs` already holds the single implementation of `fgos migrate portfolio`
(`project_migrate_request`, `migrate_portfolio`, `MigrateReport::to_json`) and its proof
`apps/fgos/tests/migrate_portfolio.rs`. The verb is not reachable: it is not routed.

## Do
1. Route the verb `fgos migrate portfolio [--dry-run]` through the host exactly as neighbouring Rust-owned verbs
   are routed (study how `portfolio check` and `config migrate` are wired): `apps/fgos/src/main.rs`,
   `apps/fgos/src/routing.rs`, `apps/fgos/src/cli_projector.rs` if a projector is needed,
   `packages/host-runtime/contracts/command-routes.json` and
   `packages/host-runtime/contracts/command-route-annotations.json`. Help text one line, plain.
   Extend the owning proof `apps/fgos/tests/migrate_portfolio.rs` with one wiring proof that the routed verb runs
   (dry run on a fixture) only if no existing route test already covers new routes generically.
2. Replace the hard-coded `DISCUSSION_ROOTS` constants in
   `packages/supervision/rust/src/discussion_source.rs` and `packages/questions/rust/src/refcheck.rs` with the
   discussion root resolved from the convention rules (crate `fgos-convention`, the rule phase 1 added for
   `plans/discussions/<ds-id>-<slug>/DISCUSSION.md`). Add `fgos-convention` as a path dependency in
   `packages/supervision/rust/Cargo.toml` and `packages/questions/rust/Cargo.toml`; update `Cargo.lock`.
   Keep reading the legacy `docs/discussions` root as a second root for now (a later unit removes it after the
   data move); name it once, in one place per crate.

## May write
apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/src/wiring/mod.rs,
apps/fgos/src/wiring/migrate.rs, apps/fgos/tests/migrate_portfolio.rs,
packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json,
packages/supervision/rust/src/discussion_source.rs, packages/questions/rust/src/refcheck.rs,
packages/supervision/rust/Cargo.toml, packages/questions/rust/Cargo.toml, Cargo.lock.

## Constraints
- Reuse, do not add a second implementation; no new crate, no new module beyond what routing needs.
- No plan ids or phase numbers in code, comments or test names.
- You may be unable to run cargo; say so. The lead runs `cargo test -p fgos --test migrate_portfolio`,
  `cargo test -p fgos-supervision -p fgos-questions`, `cargo clippy` and `cargo fmt --all --check`.

End with: Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT, Summary, Concerns.
