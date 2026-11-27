# Phase 1 verdict: which reds remain at main

- Tip: `3798e58647d9bc77310b30e80e833c7239925960` (`tip.txt`).
- Run by lead:SUPERVISOR, unconfined, in worktree `261127-0829-red-tests-before-release-p01`, on 2026-11-27.
- The run started: `listed-files.log` shows the staged host, with no `git-addon-unavailable` and no
  `FGOS_HOST_BIN must name a host binary`.

## Listed files (`listed-files.log`, `node scripts/run-tests.mjs <files>`)

42 tests, 34 pass, 8 fail; exit 1.

| File | Result |
|---|---|
| `test/runner/provider-per-cli-credential-sources.test.mjs` | pass (8 of 8) |
| `test/workflow/guide-schema.test.mjs` | pass (15 of 15) |
| `test/run-supervisor/terminal-cutover.test.mjs` | pass |
| `test/run-supervisor/terminal-crash-matrix.test.mjs` | pass |
| `test/rust-host/help-routes.test.mjs` (added for the 0832 dev-host finding) | 8 fail, **did not start** (see below) |

## Failed rows

| File | Test | Error headline | Owner |
|---|---|---|---|
| `test/rust-host/help-routes.test.mjs` | all 8 tests (its `before` hook, line 36) | `Compiled native addon not found at <worktree>/target/release/libfgos_node_addon.so; run cargo build --locked --release --workspace first` (`scripts/build-rust-distribution.mjs:251`) | `outside` |

These 8 are an environment failure, not a proven red. The `before` hook builds a distribution from the
release-profile addon. `scripts/run-tests.mjs` builds those release artifacts (`ensureReleaseArtifacts`)
only in the full-suite path (`queueAfterStaging`). A run that names its files (`runChosenTests`) never builds
them, and this fresh worktree had no `target/release`. So the run says nothing about the 0832 dev-host leak.
Phase 4's full `npm test` builds the release artifacts and decides it. If it is red there, the fix is outside
this plan's footprint (`scripts/run-rust-dev-host.mjs`, `test/rust-host/help-routes.test.mjs`) and is raised,
not fixed here (plan, Risks).

## Cargo (`cargo-listed.log`)

| Command | Result |
|---|---|
| `cargo test -p fgos --bin fgos observe_query` | pass (5) |
| `cargo test -p fgos-component-authority --test model_checks` | pass (23) |
| `cargo test -p fgos-config --test authoring_equivalence` | pass (9) |
| `cargo test -p fgos-config --test registry_defaults` | pass (3) |

## Consequence for the plan

- Phase 2 (credential sources) and phase 3 (guide schema): their files pass. Both close with no code change,
  citing this log.
- Phase 4 runs next: the full `npm test` and `cargo test --workspace` at main's tip.

## Friction

- The recheck at `a4131c2bf8` (`npm-reds-recheck.log`) ran the files without the staged addon and host, and
  reported 6 credential-source and 2 guide-schema reds that are not real. `fgos friction record` refused every
  subject tried (`plan:…`, `skill:…`, a file path) with `friction-invalid-input`, so the friction is recorded
  here and handed to the supervisor instead.
- A file-selected run does not build the release artifacts that `help-routes.test.mjs` needs, so it reports
  8 failures that are not reds.
