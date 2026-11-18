# Phase 4: Native verb, one list, retire the markdown reader

## Inputs
- `plan.md`, decisions QP-9, QP-10 and QP-18. The crate from phase 3.
- The native verb pattern, with `friction` as the example. Its pieces are:
  - `packages/host-runtime/contracts/command-routes.json:406`;
  - `command-route-annotations.json:21`;
  - `apps/fgos/src/routing.rs:80` (`NATIVE_SUBCOMMANDS`);
  - `apps/fgos/src/main.rs:107,285` (provider);
  - `cli_projector.rs:61`;
  - `invocation_doors.rs:475`;
  - `src/cli/command-registry.mjs:287` (a `native: true` entry);
  - `test/rust-host/command-routes.test.mjs`.
- The bounded legacy read: `apps/fgos/src/wiring/doctor/bridge.rs` and `apps/fgos/src/legacy_exec.rs:295`.
- `src/portfolio/open-questions.mjs`, its test `test/portfolio/open-questions.test.mjs`, the `bin/fgos.mjs:2273`
  case, the registry entry at `command-registry.mjs:1416` and the census pin at `mutation-census.v1.json:1065`.
- `src/session-host/head-start.mjs:97`, which calls `fgos questions --open`.
- The declaration injection in `apps/fgos/src/wiring/observe_declarations.rs` (ops-metrics phase 1).

## Footprint
See the phase table in `plan.md`, row 4.

## Steps
0. Re-grep. S5 phase 10 and session-verb phases 3-5 changed `main.rs`, `routing.rs` and the registry.
1. Register `fgos_questions::OBSERVE_KINDS` in `observe_declarations.rs`.
2. Write `apps/fgos/src/wiring/questions.rs`. It parses the sub-verbs (`list` by default, `show`, `ask`, `answer`,
   `ack`, `cancel`), calls the use cases, and renders text and `--json` through the house envelope.
   - The text list prints a "needs you: N" line first. Each row then gives its id, age, asker handle and role, ref, a
     one-line `what`, and its answer command.
   - `show` prints the five parts with the recommended option marked, and the answer state.
3. Write the work-sources read. Move only the gate and `fgos ask` part of `open-questions.mjs` into
   `src/portfolio/work-questions.mjs`, as a module run through `legacy_exec` the way `bridge.rs` runs its module: one
   JSON answer, bounded to 10 s, its own process group.
   - The list merges those rows under a `work` section.
   - On failure the list prints `work-sources: unavailable <reason>` and still exits 0 with the store rows.
   - Add the `fgos ask` source (`awaiting-human` items) next to the gates.
4. Route the verb:
   - add the route and its annotation;
   - add the `NATIVE_SUBCOMMANDS` entry;
   - register the provider;
   - add the projector arm and the invocation door reader;
   - replace the Node `questions` registry entry with a `native: true` entry;
   - delete the `bin/fgos.mjs` case;
   - regenerate `command-manifest.json`.
5. Delete `src/portfolio/open-questions.mjs`. Turn its test into `test/portfolio/work-questions.test.mjs` so it keeps
   only the gate and unreadable-case cases. The QUESTIONS.md and plan-section cases are retired, and the behaviour
   they covered is removed: the store is now the source. Regenerate the mutation census.
6. Move `head-start.mjs:97` to `fgos questions`.
7. Write `apps/fgos/tests/questions_verb.rs`, covering acceptance 4: the list over a fixture store plus a stubbed work
   read, a failing work read, an unknown `--open` flag, and an ask/answer round trip through the binary.

## Verify
- `cargo test -p fgos --test questions_verb`
- `node --test test/portfolio/work-questions.test.mjs test/rust-host/command-routes.test.mjs`, through the repo
  test runner
- `npm run fgos:dev -- questions --json` in this worktree

Pass condition: all three are green. The dev verb returns the envelope with `questions: []` and a `work` section.

## Rollback
Revert the phase commit. That brings `open-questions.mjs` and the Node `questions --open` verb back.
