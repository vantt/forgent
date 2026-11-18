# Phase 4: Native verb, one list, retire the markdown reader

## Inputs
- `plan.md` decisions QP-9, QP-10, QP-14, QP-18 and QP-20, plus the crate from phase 3.
- The native verb pattern, using `friction` as the example:
  - `packages/host-runtime/contracts/command-routes.json:406`
  - `command-route-annotations.json:21`
  - `apps/fgos/src/routing.rs:80`
  - `main.rs:107,285`
  - `cli_projector.rs:61`
  - `invocation_doors.rs:475`
  - `src/cli/command-registry.mjs:287`
  - `test/rust-host/command-routes.test.mjs`
- The doctor bridge: `apps/fgos/src/wiring/doctor/bridge.rs` (its `work-store-init` request is the precedent),
  `src/setup/doctor-bridge.mjs`, `packages/distribution/contracts/doctor-bridge.v1.json`, and the bridge door row in
  `docs/architecture-manifest.json:1175`.
- The code to retire:
  - `src/portfolio/open-questions.mjs`
  - `test/portfolio/open-questions.test.mjs`
  - `test/cli/questions-verb.test.mjs`
  - `bin/fgos.mjs:2273`
  - `command-registry.mjs:1416`
  - the census pin at `mutation-census.v1.json:1065`
  - the manifest layer row at `docs/architecture-manifest.json:1480`
  - `sectionText` in `src/portfolio/plan-sections.mjs:27`; check whether `scripts/plan-contract-check.mjs` still
    needs `PLAN_SECTIONS` and `hasSection`, and keep those.
- `src/session-host/head-start.mjs:97`.
- The kind enum of `fgos identity mint` in `command-registry.mjs:1153`, if phase 2 left it to this phase.
- `apps/fgos/src/wiring/observe_declarations.rs`.

## Footprint
See the phase table in `plan.md`, row 4.

## Steps
0. Re-grep every input. S5 phases 10-12 and session-verb phases 3-5 change `main.rs`, `routing.rs` and the registry.
1. Register `fgos_questions::OBSERVE_KINDS` in `observe_declarations.rs`, and the question record source in
   `metrics_sources.rs`. Wire the crate's `QuestionLog` port to `StoreLogDoor::open_stream` (`identity_log.rs:56`).
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
   - add a `native: true` registry entry;
   - delete the `bin/fgos.mjs` case;
   - regenerate the manifest.
5. Delete `open-questions.mjs` and `sectionText`.
   - The gate and unreadable-case tests become `test/portfolio/work-questions.test.mjs`, against the bridge
     module's request.
   - Retire `test/cli/questions-verb.test.mjs`. `apps/fgos/tests/questions_verb.rs` now owns that behaviour.
   - The QUESTIONS.md and plan-section cases are retired, because the behaviour is removed.
   - Update the architecture manifest rows and regenerate the census.
6. Check that `head-start.mjs:97` uses the bare verb (it already does). Fix any other caller found in step 0.
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
