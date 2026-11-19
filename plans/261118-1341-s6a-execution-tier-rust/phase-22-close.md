# Phase 22: close, doors, docs, canary, integration gate

Wave 11. Depends on: every other phase. Effort 3d. Integration phase (plan-contract section 4).

## Context

Every deleting phase already edited the `doors` entries naming its files (V4). This phase adds the new rows, closes
rows whose job is gone, writes the evergreen docs, proves the series on a real machine before landing (F12), and
lands it.

## Requirements

- Re-sync from main one last time (phase-lead rules); the table goes in `reports/close.md`.
- `docs/architecture-manifest.json` `doors`:
  - new rows: "run a unit" (allowed: engine `unit_run`, host `run.rs` and `execution_routes.rs`); "the addon never
    links the run engine" (pattern `fgos-execution-engine` in `packages/git/node-addon/Cargo.toml`; check
    `cargo tree -p fgos-node-addon`); "case admission crosses the process boundary only through the peer protocol"
    (allowed: engine peer adapter, `src/native/execution-door.mjs`, `src/workflow/admission-peer.mjs`); "Execution's
    Node seam" (allowed: `src/native/execution-door.mjs` and its listed Workflow and Work callers; `retiredBy`: "S6b
    for the Workflow callers and the peer entry, S7 for the Work callers and the file"); each with seeded caught/passed
    cases in `test/architecture.test.mjs`. Enumerate every pattern hit before anchoring (S5 D10). The checkout row
    landed with the worktree-door plan.
  - closed: every row with S6a in `retiredBy` whose job is gone ("packaging doctor judgments" debt already removed by
    15; "person's agent config writes" and "agent definition tier directories" by 17; S5 rows "the Node bind facade
    has only its named callers", "derive executor facts", "decide a dispatch", "execution doctor judgments"; and
    "tool lookup by capability"). P10 is settled: plan 0947 deleted the `per-session checkout registry` row
    (`b7486e847`), nothing to do here.
- Parity: delete `test/rust-host/parity-cases/**` tables added by 15, 17, 19, 21 and the runner if S6a restored it
  (P12; never reach main). Delete `test/golden-recorders/` (only `seam-scan.mjs` is left by then).
- Docs: `docs/platform/runner/spec.md` and pointers (Execution Core and Dispatch now Rust: crates, routes, the peer
  protocol, the Node seam and its retirement, retired Node budget lines), `docs/platform/run-supervisor/spec.md`
  (controller half, `lease` feature and steps in Rust), `docs/platform/agent-confinement/spec.md` (implementation
  pointer), `docs/platform/component-boundary.md` rows (Execution Core, Executor Model, Dispatch Transport &
  Confinement: Rust sources), `docs/reading-map.md` (new crates and contracts), a settled-decision entry for P1-P22 in
  the runner's decision holder `docs/platform/runner/decisions/` (governance decision-scope table; the runner
  `spec.md` has no "Lịch sử quyết định" section), id from `fgos identity mint d-adr`, `docs/backlog.md` (rows the phases found, incl. the dead-reservation proof
  defect of phase 20), `CHANGELOG.md` `## [Unreleased]`: `fgos run` and `fgos dispatch` subs native; every
  `fgos run --writes` starts a Node peer until Workflow moves; upgrade line for projects that pin a release: let runs
  finish (`fgos dispatch inspect` shows none open) before `fgctl upgrade` (F13).
- Reverse-read check (F12): the previous release (the one activated before the series) reads the Rust-written
  assignment, run result, receipt, lease, credential-home and provisioning fixtures recorded by 10, 12, 13, 14, 18:
  `fgos dispatch show-run`/`inspect` of the base release over them succeeds; output in `reports/close.md`.
- Canary before landing (F12): build, stage and activate the integration head in a scratch full clone of the repo on
  fg-server2 (its own `.fgos`, never the main checkout), with nothing in flight; run one read-only `fgos run`, one `fgos run --writes
  --worktree`, one workflow case step, one Work operation step, one credential renewal (an account due for refresh, or
  the renewal integration path against a real login), and `fgos doctor`; then reactivate the base release
  (`previousArtifactDigest` in `.fgos/installation/activation.json`) and confirm it still reads what the canary wrote.
  Results in `reports/close.md`.
- Program row S6a marked landed when the series is on main (both plans named in the row).
- Integration gate on the integration head: `cargo test --workspace`, one full `npm test` (ask the big lead),
  `node scripts/git-one-door-scan.mjs --root .`, clippy `-D warnings` workspace, msvc and aarch64-apple-darwin checks;
  then the big lead lands the series; on main: build, stage, activate with nothing in flight, `fgos doctor` through the
  installed shim, board line, owner-machine guide.

## Steps

1. Re-sync; enumerate pattern hits; write rows and seeded cases; delete parity tables and recorders.
2. Docs and CHANGELOG; plan acceptance 1-8 checked one by one in `reports/close.md`.
3. Reverse-read check; canary and reactivation of the base release.
4. Full gate; hand to the big lead.

## Validation

Every acceptance criterion of `plan.md` with its command output in `reports/close.md`; `test/architecture.test.mjs`,
`test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs` green; canary and
reverse-read tables present.

## Risk and rollback

Risk: a door pattern too broad (false hits) or too narrow. Step 1 enumeration and seeded cases. Risk: the canary
finds a defect: fix on the integration branch before landing; the base release is reactivated meanwhile. Rollback:
revert the phase (docs and rows); reverting the whole series follows plan.md "Risks and rollback".
