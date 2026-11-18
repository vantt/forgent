# Phase 4: Native verb, one list, retire the markdown reader

## Inputs
- `plan.md` decisions QP-9, QP-10, QP-14, QP-18 and QP-20, plus the crate from phase 3 (`packages/questions/rust`; ports `store::QuestionLog` and `store::LogOpener`,
  `record::OBSERVE_KINDS` is a `&str` at `record.rs:14`, `source::QuestionSource` at `source.rs:27`). It is in the
  workspace but not yet a dependency of `apps/fgos/Cargo.toml`.
- Line numbers below are re-checked against main `ee31debfa` (2026-11-19).
- The native verb pattern, using `friction` as the example:
  - `packages/host-runtime/contracts/command-routes.json:443` (the legacy `questions` route to replace is at 1065)
  - `command-route-annotations.json:29`
  - `apps/fgos/src/routing.rs:79`
  - `main.rs:30,39` (`native_invocation_reads_stdin`) and `main.rs:468` (`run_native`)
  - `cli_projector.rs:61` (observe arm; a non-observe native verb such as `events` at 326 is the closer model)
  - `invocation_doors.rs:483`
  - `src/cli/command-registry.mjs:328`
  - `test/rust-host/command-routes.test.mjs`
- The doctor bridge: `apps/fgos/src/wiring/doctor/bridge.rs` (its `work-store-init` request at `bridge.rs:235` is the precedent),
  `src/setup/doctor-bridge.mjs`, `packages/distribution/contracts/doctor-bridge.v1.json`, and the bridge door row in
  `docs/architecture-manifest.json:1419` (job "Node rows bridge").
- The code to retire:
  - `src/portfolio/open-questions.mjs`
  - `test/portfolio/open-questions.test.mjs`
  - `test/cli/questions-verb.test.mjs`
  - `bin/fgos.mjs:2267` (case `questions`) and `bin/fgos.mjs:3678-3680` (`renderOpenQuestions`)
  - `command-registry.mjs:1478`
  - the census pin at `mutation-census.v1.json:1175` (the `plan-sections.mjs` pin at 1176 stays; its digest changes)
  - the manifest layer row at `docs/architecture-manifest.json:1737`
  - `sectionText` in `src/portfolio/plan-sections.mjs:27`; `scripts/plan-contract-check.mjs:16,133` uses only
    `PLAN_SECTIONS` and `hasSection`; keep those.
- `src/session-host/head-start.mjs:106`.
- The kind enum of `fgos identity mint` in `command-registry.mjs:1218`: it still lacks `question` (Rust has it at
  `mint.rs:67`); this phase adds it.
- `apps/fgos/src/wiring/observe_declarations.rs` (`embedded_declarations()` at 9-18; build the entry the way
  `FRICTION_DECLARATION` is built).
- `apps/fgos/src/wiring/metrics_sources.rs:23` `build_host_record_sources()` and `apps/fgos/src/wiring/observe_sources/`
  (`HeadStateSource`, `PlanHistorySource`): the record-source pattern.

## Footprint
See the phase table in `plan.md`, row 4.

## Steps
0. Re-grep every input. S5 phases 10-12 and session-verb phases 3-5 change `main.rs`, `routing.rs` and the registry.
1. Register `fgos_questions::OBSERVE_KINDS` in `observe_declarations.rs`; add the `fgos-questions`
   dependency to `apps/fgos/Cargo.toml`; register `QuestionSource` in `build_host_record_sources()`
   (`metrics_sources.rs:23`), with any adapter under `wiring/observe_sources/`. Wire the crate's `QuestionLog` port to `StoreLogDoor::open_stream` (`identity_log.rs:56`).
2. Add the bridge request `work-questions` to `doctor-bridge.v1.json`, `bridge.rs` and `doctor-bridge.mjs`.
   - Gates come from `readCaseProjection`; that code moves out of `open-questions.mjs`.
   - `fgos ask` items come from the Work view's awaiting-human items.
   - The request is bounded, using the bridge's own deadline pattern.
   - Its answer is a new line kind `data` (one JSON line with a prefix) in the bridge contract, beside the row and
     refusal lines.
3. Write `apps/fgos/src/wiring/questions.rs` with sub-verbs `list` (the default), `show`, `ask`, `answer`, `ack` and
   `cancel`.
   - The text list prints "needs you: N" first. Then each row on one line, in QP-21 order (`blocks`, priority, age):
     id, `headline`, recommended option, `blocks`, age and answer command.
   - The `work` section comes after the store rows. If the bridge fails, print `work-sources: unavailable <reason>`
     and still exit 0.
   - `show` prints the five parts, the cost of each option, the recommended mark, the state and any conflicts.
   - `--json` uses the house envelope.
4. Route the verb:
   - add the route and its annotation;
   - add the `NATIVE_SUBCOMMANDS` entry;
   - add the provider, the projector and the invocation door;
   - add a `native: true` registry entry, and add `question` to the `identity mint` kind enum;
   - delete the `bin/fgos.mjs` case;
   - regenerate `command-manifest.json` (and fix the envelope vector `test/rust-host/vectors/envelope/version.json`
     if it lists `questions` as legacy).
5. Delete `open-questions.mjs` and `sectionText`.
   - The gate and unreadable-case tests become `test/portfolio/work-questions.test.mjs`, against the bridge
     module's request.
   - Retire `test/cli/questions-verb.test.mjs`. `apps/fgos/tests/questions_verb.rs` now owns that behaviour.
   - The QUESTIONS.md and plan-section cases are retired, because the behaviour is removed.
   - Update the architecture manifest rows and regenerate the census.
6. Check that `head-start.mjs:106` uses the bare verb (it already does). Fix any other caller found in step 0.
7. Write `apps/fgos/tests/questions_verb.rs` (acceptance 4). It covers the list over a fixture store with a stubbed
   bridge, a failing bridge, an unknown `--open`, and an ask/answer round trip through the binary.

## Verify
- `cargo test -p fgos --test questions_verb`
- `test/portfolio/work-questions.test.mjs`, `test/rust-host/command-routes.test.mjs` and the census test, through
  the repo test runner
- `npm run fgos:dev -- questions --json` in this worktree

Pass condition: all are green, and the dev verb returns the envelope with a `questions` list and a `work` section.

## Rollback
Revert the phase commit. That restores `open-questions.mjs` and `fgos questions --open`.
