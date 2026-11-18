# Phase 22: close, doors, docs, integration gate

Wave 10. Depends on: every other phase. Effort 2.5d. Integration phase (plan-contract section 4).

## Context

The one writer of `doors` rows for this plan and of the evergreen docs. S5's twins and rows naming S6a (phase 00
section 5) close here; the parity tables leave the tree.

## Requirements

- `docs/architecture-manifest.json` `doors`:
  - new rows: "make, provision and remove a checkout" (allowed: `packages/execution/checkout/**`, the host verb
    wiring, the addon `checkout` namespace; patterns anchored on the Git create/remove port calls and on
    `worktreeSetup`); "run a unit" (allowed: engine `unit_run`, host `run.rs`); "the addon never links the run engine"
    (pattern `fgos-execution-engine` in `packages/git/node-addon/Cargo.toml`); "case admission crosses the process
    boundary only through the peer protocol" (allowed: engine peer adapter, `src/workflow/admission-peer.mjs`,
    `src/workflow/runner.mjs`); each with seeded caught/passed cases in `test/architecture.test.mjs`. Enumerate every
    pattern hit before anchoring (S5 D10).
  - closed: every row with S6a in `retiredBy` (agent config writes: debt removed; agent definition tier directories;
    packaging doctor judgments: `checkBwrapAvailable` debt removed; S5 twin rows); `per-session checkout registry`
    deleted if plan 0947 phase 3 has not, else its `retiredBy` rewritten to plan 0947 (P10); debts naming deleted
    files removed (the stale check enforces it).
- Parity: delete `test/rust-host/parity-cases/**` tables added by 15, 17, 19, 21 and the runner if S6a restored it
  (P12; never reach main).
- Docs: `docs/platform/runner/spec.md` and pointers (Execution Core and Dispatch now Rust: crates, routes, the peer
  protocol, retired Node budget lines), `docs/platform/run-supervisor/spec.md` (controller half and steps in Rust),
  `docs/platform/agent-confinement/spec.md` (implementation pointer), `docs/platform/component-boundary.md` rows
  (Execution Core, Executor Model, Dispatch Transport & Confinement: Rust sources; checkout crate), `docs/platform/git/spec.md`
  provisioning owner pointer, `docs/reading-map.md` (new crates and contracts), a settled-decision entry for P1-P12 in
  the runner spec's "Lịch sử quyết định", `docs/backlog.md` (rows the phases found), `CHANGELOG.md` `## [Unreleased]`
  (`fgos run`, `fgos dispatch` subs native; user-visible only).
- Program row S6a marked landed when the series is on main (the scope edits of D3/D5 are the secretary's, plan.md
  "Sibling edits").
- Integration gate on the integration head: `cargo test --workspace`, one full `npm test` (ask the big lead),
  `node scripts/git-one-door-scan.mjs --root .`, clippy `-D warnings` workspace, msvc and aarch64-apple-darwin checks;
  then the big lead lands the series; on main: build, stage, activate with nothing in flight, `fgos doctor` through the
  installed shim, board line, owner-machine guide.

## Steps

1. Enumerate pattern hits; write rows and seeded cases; delete parity tables.
2. Docs and CHANGELOG; plan acceptance 1-8 checked one by one in `reports/close.md`.
3. Full gate; hand to the big lead.

## Validation

Every acceptance criterion of `plan.md` with its command output in `reports/close.md`; `test/architecture.test.mjs`,
`test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs` green.

## Risk and rollback

Risk: a door pattern too broad (false hits) or too narrow. Step 1 enumeration and seeded cases. Rollback: revert the
phase (docs and rows); reverting the whole series follows plan.md "Risks and rollback".
