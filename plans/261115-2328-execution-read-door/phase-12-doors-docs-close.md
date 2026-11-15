# Phase 12: doors rows, docs, parity close and the landing guide

Start after: 01-11 landed. Wave 6. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: all; re-read items 6, 8.
Worktree `erd-p12`, report slug `erd-p12-close`. Effort: 2d.

## Context

The program's S5 exit: one `bind()`; a `doors` row allowing only the Rust `bind` plus the remaining Node callers, each
named with S6a as its owner; the S4 item done (eight rows moved, parity restored for them, S4 fixtures kept). The
capability rows of the capability-reads plan (F4) still name Node modules as the door; their authority moved in 03-09.

## Requirements

1. `docs/architecture-manifest.json` `doors` (with a seeded caught/passed case each in `test/architecture.test.mjs`,
   red first):
   - **"bind a seat"**: patterns for a seat composition outside the crate (`\bexecutorFacts\b`, `\blaunchViewOf\b`,
     `\baccountViewOf\b`, `\bseatConfigOf\b`, `\bseatBinding\(`, `\bfgos_seat_binding::bind\(`); allowed
     `packages/execution/rust/src/bind.rs` (the bind), `packages/seat-binding/rust/**` (the ranking it calls);
     Node callers of the facade are allowed through a second pattern set (`\bbind\(|\bexplainSeat\(|\bbindWorkSeat\(`
     from `src/runner/execution/bind.mjs`), each allowed entry with reason "S6a: <what it binds>": `assignment-runner.mjs`,
     `execution/run.mjs`, `execution/dry-bind.mjs`, `runner/loop.mjs` (reason names S7), `dispatch/plan.mjs`,
     `setup/seat-binding-checks.mjs` and `setup/blind-steps-proven-pools.mjs` (reason "doctor row bridge:S6b").
   - **"derive executor facts"**: patterns for the derivations (`\bfamilyOf\b`, `\bcredentialStoreOf\b`,
     `\brenderedEffortLevels\b`, `\bresolvePostureInvocation\b`, `\beffectiveRigorOf\b`, `\bdetectHerdrPresent\b`,
     `\bvalidateGeneratedPathsShape\b`, `\bloadMachineBackendRegistry\b`, the agent-listing functions); allowed
     `packages/execution/rust/src/**`; each Node twin as `debt` with reason "launch-time twin, same vectors as the
     contract" and `retiredBy: "S6a"` (D7).
   - **"decide a dispatch"**: `\bcompileDispatchPlan\b` decision internals and `decideExecutorCli`; allowed the crate's
     `decide.rs` and `src/runner/dispatch/plan.mjs` (reason "S6a: launch policy around the route's plan answer").
   - **"retired Node S5 code"**: names that must not come back (`decideDispatchHook`, `explainCapability`,
     `seat-policy.mjs`, `mechanism.mjs`, `internal seat-binding --protocol 1`, the `node src/runner/dispatch.mjs decide` alias).
   - Edit the existing rows (F4) so their reasons and allowed lists name the Rust owner: "read runner.capabilities" (the
     crate and `capability-config.mjs`), "choose an executor from prefer" (`seat-policy.mjs` gone), "tool lookup by
     capability" (`tools.rs`; Node `tool-providers.mjs` keeps only what S6a launch reads, as debt), "agent definition
     tier directories" (add the Rust host adapter as allowed).
2. Parity close: re-run every S5 parity table against the base release, record counts, then delete the restored runner
   and the tables (they never reach main).
3. Docs: `docs/platform/runner/spec.md` "Execution Core and Dispatch" (bind composition is Rust; Node S6a callers
   ask the route), `docs/platform/seat-binding/spec.md` section 3 (who asks; route protocol 2) and 16 (pointers),
   `docs/platform/host-invocation-routing/spec.md` route counts, `docs/reading-map.md` (`packages/execution`),
   `docs/platform/vision.md` capability bullet (step 2 done, S5), the program plan's S5 row (status, landed commit,
   deviations), `docs/backlog.md` rows for the Ideas the owner picks (none by default).
4. `CHANGELOG.md` `## [Unreleased]`: the user-visible lines the phase reports proposed (native `dispatch decide` /
   `explain` / `hook dispatch-decide` / `agents`; `runner.personas`/`runner.roles`; capability rows and labels; the
   compatibility alias gone).
5. Owner-machine guide (path from `fgos convention path --kind report --type guide ...`): build, stage and activate
   the release in one window (host route protocol 2 and the Node payload must match); move any
   `runner.capabilities.<x>.{roles,personas,seats}` in project and global configs (`fgos config check` names them);
   `fgos doctor` through the installed shim; linked on the board.

## Files

- Modify: `docs/architecture-manifest.json`, `test/architecture.test.mjs` (seeded cases), the docs of Req 3,
  `CHANGELOG.md`, `docs/backlog.md`, `plans/261114-2051-rust-verb-migration-program/plan.md` (S5 row), this plan's
  `plan.md` status (through `ak plan`), mutation census.
- Delete: the transitional parity runner and tables.
- Net size: about +200 manifest lines, +80 test lines, docs edits.

## Acceptance

- `test/architecture.test.mjs` green with the new rows and their seeded cases; no stale `debt`.
- `cargo test --workspace` and one full `npm test` on the integration head (big lead's queue) green.

## Risks / rollback

- A pattern too broad catches a legitimate caller (M x M): the seeded cases; allowed entries carry reasons.
  Revert: one commit (rows only).
