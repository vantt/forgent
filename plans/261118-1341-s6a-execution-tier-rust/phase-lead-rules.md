# Phase-lead rules (every phase of this plan)

Binding for every phase lead; a phase file may tighten a rule, never loosen it.

## Read first

`AGENTS.md`, `docs/reading-map.md`, `docs/platform/runner/spec.md` ("Execution Core and Dispatch"),
`docs/platform/run-supervisor/spec.md`, `docs/platform/git/spec.md` (Worktree rows), this file, `plan.md` (decisions
P1-P22), `reports/facts.md` (phase 00 output), then your phase file. Every `file:line` in this plan was read on
`b5b237534` and re-read on `f031ab0c8` (phase 00 part B, `reports/facts-part-b.md`). Re-check every line you edit before
editing it. If a fact moved, stop and report to the plan lead with the new `file:line`; do not adapt silently.

## Start gates

- S5 (`261115-2328`) phases 11 and 12 and the worktree-door plan (`261118-1455-s6a-worktree-door`) are on `main`
  (whole plan, `blockedBy`).
- Plan 1045 phase 6 is on `main` before phases 5, 11, 16b, 19 start (D4). It is a phase-level landing of 1045 that
  does not wait for 1045 `ready` (1045 P3, P5, P8 landed while that plan was `draft`). Met on `f031ab0c8`: 1045
  phases 1-18 are `done` (lane pool `47165e3bf`, lane-wait fix `2dbabb340`); only 1045 phase 19 (integration docs, live
  run) is open. Read its board row first.
- Your `depends-on` phases are merged on the integration branch (`s6a-execution/integration`, cut from `main` after
  the worktree-door plan landed).

## Re-sync from main before a cut-over phase (F7)

Before phases 15, 17, 19, 20 and 21 start, and again in phase 22: list
`git log <integration-base>..origin/main -- src/runner/execution src/runner/dispatch src/run-supervisor src/verbs/dispatch src/runner/worktree.mjs src/setup`
(`<integration-base>` is the merge base recorded in `reports/facts.md`, moved forward at each re-sync). For each
commit: port it into the Rust module that owns the behaviour and re-record the vector with its committed recorder,
or write "no behaviour" with a reason. The table goes in the phase report. Merge `origin/main` into the integration
branch first; a modify/delete conflict on a deleted Node file is resolved by porting, never by dropping the change.
From phase 19's start a board line asks every lane to route a main fix in those paths through the S6a plan lead.

## Branches, worktrees, targets

- Worktree: `fgos worktree create /home/vantt/projects/forgent-worktrees/s6a-pNN --branch s6a-execution/pNN --base origin/s6a-execution/integration`.
  Assert the path is in `git worktree list` before any other command in it. Never chain a destructive step after a
  `cd`.
- Rust: `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/s6a-pNN-target` (ext4, never `/tmp`). Delete
  the target and remove the worktree when the phase lands
  (`fgos worktree remove <path> --delivered-to origin/s6a-execution/integration --discard-ignored </dev/null`).
- Push the branch at red test, at each green step, and at least every 30 minutes.

## Proof rules

- Red first: commit and push the failing test before the fix.
- One owning proof per behaviour at the lowest layer that observes it (design principle 8). A behaviour that moves to
  Rust gets its owning proof in the Rust crate; a boundary above keeps at most one wiring proof (a `cli_tests.rs` case
  asserts argv mapping and envelope paths, never outcomes).
- Golden vectors for a port are recorded from the Node code on the integration branch before the port, by a recorder
  committed at `test/golden-recorders/<module>.recorder.mjs` (tracked, never `.fgos/runtime/tmp/`); vectors live in the
  phase's contracts directory (plan table). Never hand-write expected values that Node computes. A recorder is deleted
  by the phase that deletes the last Node module it imports (20 or 21); its vectors stay.
- Record readers (12, 13, 21) also replay the Node-era corpus phase 00 commits at `packages/execution/contracts/corpus/`
  (pre-`seatSchema` records, an open Node-era attempt): "Rust readers accept every record generation Node reads" (F13).
- A retired Node test names its new owner in the commit message and in the phase report table
  "retired test -> owner now". Deleting a mechanism retires its tests in the same change.
- Retire-with-path rule (V1): a test or helper that imports a path a phase deletes or moves is in that phase's
  footprint and is retired, moved or switched in that phase; `reports/facts.md` §6 lists every such file with its phase.
- No env switch, flag or test-only branch to make a test pass. RUL104: port behaviour as is; a defect found becomes a
  backlog row in the phase report, not a fix.
- No plan ids, phase numbers or finding codes in code comments, test names or commit messages.

## Doors and manifest (V4)

A phase that deletes or moves a file or symbol edits, in the same change, every `doors` `allowed`/`debt` entry and
every manifest tier/layer entry in `docs/architecture-manifest.json` that names it (move to the new path, or drop the
entry); `test/architecture.test.mjs:1848-1849` fails on a stale path. Phase 22 only adds new rows and closes rows
whose job is gone. Every phase that deletes or moves a file has `docs/architecture-manifest.json` in its footprint.

## Layering (checked in review)

- `fgos-execution` stays pure: no process spawn, no file write, no clock; effects behind port traits.
- `fgos-checkout` (worktree-door plan) knows no unit, run or Work item.
- `fgos-execution-engine` may depend on `fgos-execution`, `fgos-checkout`, `fgos-run-supervisor`, `fgos-seat-binding`,
  `fgos-agent-protocol`, `fgos-terminal-control`, `fgos-session-host`, `fgos-run-result`, `fgos-git` and lower; nothing
  below it depends on it.
- The addon `fgos-node-addon` links `fgos-execution`, `fgos-checkout` and `fgos-run-supervisor` with
  `default-features = false, features = ["lease"]` (read-only lease inspection, P15); never `fgos-execution-engine`,
  never the supervisor's default features.
- `fgos-run-supervisor` gains no dependency on either Execution crate.
- Host and Node talk only over a child's stdin/stdout with prefixed JSON lines (P13): never an inherited fd above 2,
  never a new hidden arm in `bin/fgos.mjs`; the host starts a legacy-payload module only through
  `legacy_exec::payload_command` (door row "no Node from the native packaging verbs").
- New code is Rust. The only new or moved Node files allowed: `src/util/payload-root.mjs`,
  `src/native/stop-processes-inside.mjs`, `src/runner/capability-config.mjs` (moves, phase 02),
  `src/native/execution-door.mjs` (Execution's one Node seam, P14; Workflow's uses go at S6b, the rest at S7) and
  `src/workflow/admission-peer.mjs` (the P5 peer entry, retired by S6b).

## Tests and gates

- Node tests only through `node scripts/run-tests.mjs <file.test.mjs> ...`. Run your phase's gate list plus every test
  that imports or reads a file you change (`rg -l "<basename>|<symbol>" test`).
- Ask the plan lead before a full `npm test` or `cargo test --workspace`; at most one full `npm test` on the machine;
  a `HOLD suite` board line means no test process at all. Never SIGKILL a gate; no focused run in a worktree while its
  full suite runs.
- Every code phase gate: `test/setup/git-mutation-census.test.mjs`, `test/architecture.test.mjs`,
  `test/scripts/doc-health.test.mjs`, `node scripts/git-one-door-scan.mjs --root .` (count not above the base).
- Rust touched: `cargo fmt --all --check`; `cargo clippy -p <crates> --all-targets -- -D warnings`;
  `cargo test -p <crates>`; `cargo check -p <crates> --target x86_64-pc-windows-msvc` and
  `--target aarch64-apple-darwin` (macOS is supported; Windows keeps its documented `terminal-mode-unsupported`; the
  host-Node channel is plain pipes and must build and run on Windows).
- Before commit: `git diff --stat` and check for unexpected deletions; stage explicit paths only.

## Generated and hot files

Regenerate, never hand-merge: `Cargo.lock`, `packages/host-runtime/contracts/command-{routes,manifest}.json`,
`packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`. Edit a hand-edited hot file only if your
phase's footprint names it.

## Report

`reports/pNN-<slug>.md` (name via `fgos convention name`): what moved, Node lines deleted, the
"retired test -> owner now" table, the re-sync table (cut-over phases), backlog rows found, gate output. End with the
status block.
