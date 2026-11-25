# Full gate for plan 261125-1558 (acceptance 6)

Run by the supervisor outside confinement, one suite at a time, release 33f462be active, on the owner's answer to q-rpx35ztfph.

- `npm test` on main 85760c6f2: 6675 tests, 6624 pass, 24 fail.
- `cargo test --workspace --no-fail-fast` on main e415fae89: 4456 pass, 7 fail.

No failing test is in this plan's footprint: none is under `packages/git`, `packages/identity`, or the supervision land
code and tests. This plan's proofs pass: `packages/git/rust/tests/land_push_catch_up.rs`, `packages/git/rust/tests/incidents.rs`,
`packages/identity/rust/tests/directory.rs` and `packages/supervision/rust/tests/land.rs`.

The 24 npm failures are known and owned elsewhere (list: `plans/reports/supervisor-261125-1838-npm-test-24-failures-on-main.md`).
The 7 cargo failures belong to the heads-operate plan: supervision_verbs x2, questions_head, config registry_defaults and
authoring_equivalence, component-authority model_checks, distribution can-i vector. The suite's exit 1 also carries the
witness's deleted dev-host run directory report (backlog p-pbebee63t6), not a leak of this plan.

Verdict: acceptance 6's gate is met for this plan's scope. Still owed: the two lines in `changelog-lines.md` go into
`CHANGELOG.md` once plan 261124-0004 is done.
