# Phase-lead rules (every phase of this plan)

Binding for every phase lead; a phase file may tighten a rule, never loosen it.

## Read first

`AGENTS.md`, `docs/reading-map.md`, `docs/platform/runner/spec.md` ("Execution Core and Dispatch"),
`docs/platform/run-supervisor/spec.md`, `docs/platform/git/spec.md` (Worktree rows), this file, `plan.md` (decisions
P1-P12), `reports/facts.md` (phase 00 output), then your phase file. Every `file:line` in this plan was read on
`0981437d2`; phase 00 re-reads them after S5 lands. Re-check every line you edit before editing it. If a fact moved,
stop and report to the plan lead with the new `file:line`; do not adapt silently.

## Start gates

- S5 phases 11 and 12 are on `main` (whole plan).
- Plan 1045 phase 6 is on `main` before phases 5, 11, 16, 19 start (D4). Read its board row first.
- Your `depends-on` phases are merged on the integration branch (`s6a-execution/integration`). Phase 1 alone bases on
  and lands to `main`.

## Branches, worktrees, targets

- Worktree: `fgos worktree create /home/vantt/projects/forgent-worktrees/s6a-pNN --branch s6a-execution/pNN --base origin/s6a-execution/integration`
  (phase 1: `--base origin/main`). Assert the path is in `git worktree list` before any other command in it. Never
  chain a destructive step after a `cd`.
- Rust: `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/s6a-pNN-target` (ext4, never `/tmp`). Delete
  the target and remove the worktree when the phase lands
  (`fgos worktree remove <path> --delivered-to origin/s6a-execution/integration --discard-ignored </dev/null`).
- Push the branch at red test, at each green step, and at least every 30 minutes.

## Proof rules

- Red first: commit and push the failing test before the fix.
- One owning proof per behaviour at the lowest layer that observes it (design principle 8). A behaviour that moves to
  Rust gets its owning proof in the Rust crate (golden vectors under `packages/execution/contracts/` or
  `packages/run-supervisor/contracts/`); a boundary above keeps at most one wiring proof.
- Golden vectors for a port are recorded from the Node code on the integration base before the port (phase 00 names
  the recorder per module); never hand-write expected values that Node computes.
- A retired Node test names its new owner in the commit message and in the phase report table
  "retired test -> owner now". Deleting a mechanism retires its tests in the same change.
- No env switch, flag or test-only branch to make a test pass. RUL104: port behaviour as is; a defect found becomes a
  backlog row in the phase report, not a fix.
- No plan ids, phase numbers or finding codes in code comments, test names or commit messages.

## Layering (checked in review)

- `fgos-execution` stays pure: no process spawn, no file write, no clock; effects behind port traits.
- `fgos-checkout` depends only on `fgos-git`, `fgos-process`, `fgos-config`, `fgos-durable-file`, `fgos-holder-lock`
  and leaf crates; it knows no unit, run or Work item.
- `fgos-execution-engine` may depend on `fgos-execution`, `fgos-checkout`, `fgos-run-supervisor`, `fgos-seat-binding`,
  `fgos-agent-protocol`, `fgos-terminal-control`, `fgos-session-host`, `fgos-run-result`, `fgos-git` and lower; nothing
  below it depends on it; the addon never does.
- `fgos-run-supervisor` gains no dependency on either Execution crate.
- New code is Rust. The only new Node files allowed: `src/util/payload-root.mjs` (a move) and
  `src/workflow/admission-peer.mjs` (Workflow's side of the peer protocol, retired by S6b).

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
  `--target aarch64-apple-darwin` (macOS is supported; Windows keeps its documented `terminal-mode-unsupported`).
- Before commit: `git diff --stat` and check for unexpected deletions; stage explicit paths only.

## Generated and hot files

Regenerate, never hand-merge: `Cargo.lock`, `packages/host-runtime/contracts/command-{routes,manifest}.json`,
`packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`. Edit a hand-edited hot file only if your
phase's footprint names it.

## Report

`reports/pNN-<slug>.md` (name via `fgos convention name`): what moved, Node lines deleted, the
"retired test -> owner now" table, backlog rows found, gate output. End with the status block.
