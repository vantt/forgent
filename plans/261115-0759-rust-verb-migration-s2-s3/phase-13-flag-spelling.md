---
phase: 13
title: "One --flag=value rule for every native verb (applies the owner's answer to S23-Q2)"
status: pending
effort: "1.5d if S23-Q2 = a; 2d if b; 0.25d if c"
wave: E
step: S3
blockedBy: [12, S23-Q2, "S2 landed on main"]
---

# Phase 13: One spelling rule

> Owner answer applies (2026-11-15 08:41): S23-Q2 = a. `=` goes away everywhere; the (b) and (c) branches below are not taken.

The program row: "the last verb's step decides whether `--flag=value` stays accepted everywhere or goes away
everywhere". After S2 and S3 every ported verb reads only the shared parser; the eight pre-F0 native verbs keep
their own reading through `PRE_DOOR_NATIVE_VERBS` (phase 01) and three of the ten debt entries of the parse row (the
other seven are internal routes, another CLI and scripts, untouched here). This phase applies S23-Q2's answer
on the S3 integration branch after it has rebased onto `main` with S2, so it sees every native verb.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s3-p13`. Report slug `s3-p13-flag-spelling`.

## Context

- `named_dir` (`apps/fgos/src/invocation_doors.rs:404-414`), `sub_word` (`routing.rs:162-170`: the token right after
  the verb when it is not a flag; `fgos config --json show` is already refused), the `=` cut in `unknown_flag`
  (`routing.rs:307`), all scoped to `PRE_DOOR_NATIVE_VERBS` by 01.
- Shipped `=` uses found by the plan's preliminary count: one, `docs/how-to/compare-discussion-setups-with-metrics-eval.md:185`.
- `parse CLI arguments (twin)` row debt: `apps/fgos/src/cli_projector.rs` (convention, config, identity projectors),
  `apps/fgos/src/wiring/mailbox_verbs.rs` (`project_mailbox_request`), `packages/observe/rust/src/flags.rs`.
- Phase 00 F13 lists every `=`, `--dir=` and flag-before-sub use for those verbs in shipped files.

## Requirements by answer

- **S23-Q2 = (a), `=` goes away:** the three projectors read `cli_args` output only; `named_dir` and the `=` cut are
  deleted; `sub_word` becomes `parsed.positional[0]` for every verb; `PRE_DOOR_NATIVE_VERBS` keeps only its root-leniency
  use (rename back to `LENIENT_ROOT_VERBS` if that is its one remaining use); the three debt entries leave the row
  (the stale check enforces it); every use 00 F13 found is rewritten in the same change (skills regenerated with
  `npm run build:skills`); `test/cli/subcommand-flag-drift.test.mjs` reads the flag literals from wherever they now live
  (the observe `flags.rs` note in the row's reason). Each removed spelling gets one refusal case in `routing.rs`.
- **S23-Q2 = (b), `=` accepted everywhere:** `--k=v` added to both parser twins with vector rows
  (`test/rust-host/fixtures/parse-args-vectors.json`, read by `test/cli/parse-args-vectors.test.mjs` and `cli_args.rs`);
  `src/cli/flag-check.mjs` judges the name before `=`; then the same projector moves and deletions as (a) without the
  rewrites. The redaction item of the program ("a `--flag=value` token reaches the fault log", program plan "Items for
  the big lead") is checked for the Node twin.
- **S23-Q2 = (c), keep both:** the row's three debt reasons say "kept by owner answer, until S7"; nothing else.

## Files

- (a)/(b): `apps/fgos/src/{routing.rs,invocation_doors.rs,cli_projector.rs}`, `apps/fgos/src/wiring/mailbox_verbs.rs`,
  `packages/observe/rust/src/flags.rs` and its callers, `docs/architecture-manifest.json`, tests of those modules,
  `apps/fgos/tests/mailbox_routes.rs` (only cases that pin a removed spelling: retired with the behaviour);
  (a) also the files F13 lists; (b) also `src/cli/parse-args.mjs`, `packages/host-runtime/rust/src/cli_args.rs`,
  `src/cli/flag-check.mjs`, the vector file.
- (c): `docs/architecture-manifest.json` only.
- Docs: `docs/platform/host-invocation-routing/spec.md` §9 (the open question closed, the answer recorded).

Flag spelling for unknown flags: the host takes each sub-verb's flag list from the registry annotation it already ships
and reuses Node's message grammar (including the `=` hint), so the stderr refusal stays exact-bytes with Node; no
user-visible change, no CHANGELOG line.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos -p fgos-observe -p fgos-host-runtime --all-targets -- -D warnings`;
  `cargo test -p fgos -p fgos-observe -p fgos-host-runtime`; msvc and darwin checks
- `node scripts/run-tests.mjs test/cli/parse-args-vectors.test.mjs test/cli/unknown-flag-rejection.test.mjs test/cli/subcommand-flag-drift.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `cargo test -p fgos --test mailbox_routes --test cli_tests`

## Risk and rollback

- A shipped skill or hook still uses a removed spelling (M x H under (a)): 00 F13's list, rewritten here; a grep in the gate.
- Rollback: revert the phase; the native verbs return to two rules.
