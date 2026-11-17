# Phase 12: doors rows, docs, parity close and the landing guide

Start after: every other phase (01-11, 13, 14) landed. Wave 6. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: all; re-read items 6, 8.
Worktree `erd-p12`, report slug `erd-p12-close`. Effort: 2d.

## Context

The program's S5 exit: one `bind()`; a `doors` row allowing only the Rust `bind` plus the remaining Node callers, each
named with S6a as its owner; the S4 item done (seven rows moved and `seat-binding-route` relabelled `bridge:S6a` with its reason, D15; parity
restored for them; S4 fixtures kept). The
capability rows of the capability-reads plan (F4) still name Node modules as the door; their authority moved in 03-09.

## Requirements

1. `docs/architecture-manifest.json` `doors`. **Step one, before writing a row:** run each candidate pattern over the
   integration head and list every hit with its owner step (S6a, S6b, S7, doctor bridge row, or "Rust owner"); patterns
   are anchored on imports and definitions (`from '[^']*execution/bind\.mjs'`, `export function familyOf\b`,
   `\bfn bind\b`), never on a bare call name such as `\bbind\(` (24 unrelated files match it). Then each row with a
   seeded caught/passed case in `test/architecture.test.mjs`, red first:
   - **"bind a seat"**: a seat composition outside the crate (definitions of `executorFacts`, `launchViewOf`,
     `accountViewOf`, `seatConfigOf`, `familyKeyed`, `resolvePersona`; calls of `fgos_seat_binding::bind`); allowed
     `packages/execution/rust/src/bind.rs` and `packages/seat-binding/rust/**`. A second pattern set, imports of
     `execution/bind.mjs`, allows exactly the facade's callers from step one, each with its owner in the reason
     ("S6a: ...", "S7: runner loop", "doctor row bridge:S6b").
   - **"derive executor facts"**: definitions of the derivations Node still holds (D7: `withDefaultExecutor`, `familyOf`,
     `lookupExecutor`, governance, `capabilityConfinementOf`, `credentialStoreOf`, `renderedEffortLevels`,
     `resolvePostureInvocation`, `decideExecutorDispatchMechanism`, `effectiveRigorOf`, `detectHerdrPresent`,
     `validateRunnerConfigShape`, `validateGeneratedPathsShape`, `loadMachineBackendRegistry`, `providerAccountInventory`,
     `readLlmAccounts`, `legacyStateKey`, and the agent listing if 11 kept it); allowed `packages/execution/rust/src/**`;
     each Node definition as `debt` with reason "twin, same vectors as the contract" and `retiredBy` its owner step from
     step one (S6a for launch code; S6b/S7 where step one says so).
   - **"decide a dispatch"**: definitions of the decider (`compileDispatchPlan`, `purposeSeatOf`, `decideExecutorCli`);
     allowed the crate's `decide.rs`; `src/runner/dispatch/plan.mjs` as `debt` (reason "bind-free selectors for launch
     and fanout, same vectors", `retiredBy: S6a`).
   - **"execution doctor judgments"** (S4's per-group shape, e.g. "holder-lock and mailbox doctor judgments"): the
     moved judges' Node function names and Rust `fn` names; allowed `packages/execution/rust/src/checks.rs` and
     `apps/fgos/src/wiring/doctor/execution.rs`.
   - **"capability rows hold jobs and tool abilities"**: the business names deleted in 05 as standard keys; under Q3 = (c)
     the kept coding rows as `debt` with `retiredBy: S7` and a reason citing p-nnbfsrxcss.
   - **"retired Node S5 code"**: names that must not come back (`decideDispatchHook`, `explainCapability`,
     `seat-policy.mjs`, `internal seat-binding --protocol 1`, the `node src/runner/dispatch.mjs decide` alias,
     `scripts/dispatch-decide-hook.mjs`).
   - Edit the existing rows (F4) so their reasons and allowed lists name the Rust owner: "read runner.capabilities" (the
     crate and `capability-config.mjs`), "choose an executor from prefer" (`seat-policy.mjs` gone), "tool lookup by
     capability" (`tools.rs`; Node `tool-providers.mjs` keeps only what S6a launch reads, as debt), "agent definition
     tier directories" (add the Rust host adapter as allowed).
   - If 11 deferred it, delete `src/runner/agent-listing.mjs` and its twin test now.
2. Parity close: re-run every S5 parity table against the base release, record counts, then delete the restored runner
   and the tables (they never reach main).
3. Docs: `docs/platform/runner/spec.md` "Execution Core and Dispatch" (bind composition is Rust; Node S6a callers
   ask the route), `docs/platform/seat-binding/spec.md` section 3 (who asks; route protocol 2) and 16 (pointers),
   `docs/platform/host-invocation-routing/spec.md` route counts, `docs/platform/component-boundary.md` Seat Binding row
   (`:71`: the route now lives in host wiring at protocol 2; "Node seat tests prove only what the facade adds" is now
   the `fgos-execution` goldens) and the Execution row 01 added, `docs/reading-map.md` (`packages/execution`),
   `docs/platform/vision.md` capability bullet (step 2 done, S5), the program plan's S5 row (status, landed commit,
   deviations), `docs/backlog.md` rows for the Ideas the owner picks (none by default).
4. Port pace for the program's Q2 ("decide (c) with S5's measured port pace", program `plan.md` Q2): the close report
   records lead-days per phase, Node lines and Node test lines deleted, Rust lines added, so the big lead can size S6.
5. `CHANGELOG.md` `## [Unreleased]`: the user-visible lines the phase reports proposed (native `dispatch decide` /
   `explain` / `hook dispatch-decide` / `agents`; `runner.personas`/`runner.roles`; capability rows and labels; the
   compatibility alias gone).
6. Owner-machine guide (path from `fgos convention path --kind report --type guide ...`), D16: before activation, no
   `fgos run`/workflow run in flight and no open mutating assignment on the machine (`fgos dispatch inspect`; settle or
   cancel them: the protocol and the replay digest change); reconcile the main checkout's uncommitted `.fgos/config.yaml`
   edits before pulling; build, stage and activate the release in one window; right after activation run
   `fgos doctor --fix` in every project (13's repair moves per-capability taste; a conflicting value stops for the person,
   named); then `fgos doctor` through the installed shim; linked on the board.

## Files

- Modify: `docs/architecture-manifest.json`, `test/architecture.test.mjs` (seeded cases), the docs of Req 3,
  `CHANGELOG.md`, `docs/backlog.md`, `plans/261114-2051-rust-verb-migration-program/plan.md` (S5 row), this plan's
  `plan.md` status (through `ak plan`), mutation census.
- Delete: the transitional parity runner and tables; `src/runner/agent-listing.mjs` and its test if 11 deferred them.
- Net size: about +200 manifest lines, +80 test lines, docs edits.

## Acceptance

- `test/architecture.test.mjs` green with the new rows and their seeded cases; no stale `debt`.
- `cargo test --workspace` and one full `npm test` on the integration head (big lead's queue) green.

## Risks / rollback

- A pattern too broad catches a legitimate caller (M x M): the seeded cases; allowed entries carry reasons.
  Revert: one commit (rows only).
