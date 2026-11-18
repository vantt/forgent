# Phase-lead rules (both phases of this plan)

Binding for each phase lead; a phase file may tighten a rule, never loosen it. Shared with the S6a plan where noted;
this file states only what both phases need.

## Read first

`AGENTS.md`, `docs/reading-map.md`, `docs/platform/git/spec.md` (Worktree rows `:81`, `:122`, `:177`, `:551`, `:553`),
`docs/platform/runner/spec.md` ("Execution Core and Dispatch"), this file, `plan.md`, your phase file. Every
`file:line` was read on `b5b237534`; re-check every line you edit before editing it. If a fact moved, stop and report
to the plan lead with the new `file:line`.

## Branches, worktrees, targets

- Worktree: `fgos worktree create /home/vantt/projects/forgent-worktrees/s6a-wt-pNN --branch s6a-worktree/pNN --base <base>`
  (phase 01: `origin/main`; phase 02: `origin/s6a-worktree/p01`). Assert the path is in `git worktree list` before any
  other command in it. Never chain a destructive step after a `cd`.
- Rust: `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/s6a-wt-pNN-target` (ext4, never `/tmp`).
  Delete the target and remove the worktree when the series lands (`fgos worktree remove <path> --delivered-to
  origin/main --discard-ignored </dev/null`).
- Push the branch at red test, at each green step, and at least every 30 minutes.

## Proof rules

- Red first: commit and push the failing test before the fix.
- One owning proof per behaviour at the lowest layer that observes it (design principle 8): crate tests own checkout
  behaviour; `cli_tests.rs` cases assert argv mapping, exit codes and envelopes only; one Node wiring test.
- A retired Node test names its new owner in the commit message and in the phase report table
  "retired test -> owner now".
- No env switch, flag or test-only branch to make a test pass. RUL104: port behaviour as is; a defect found becomes a
  backlog row in the phase report.
- No plan ids, phase numbers or finding codes in code comments, test names or commit messages.
- A phase that deletes or moves a file or symbol edits, in the same change, every `doors` `allowed`/`debt` entry and
  every manifest layer/tier entry that names it (`test/architecture.test.mjs:1870-1871` fails on stale paths).

## Layering

`fgos-checkout` depends only on `fgos-git`, `fgos-process`, `fgos-config`, `fgos-durable-file`, `fgos-holder-lock` and
leaf crates; it knows no unit, run or Work item. The addon (`fgos-node-addon`) links it; nothing below Execution
depends on it. New code is Rust; no new Node file.

## Tests and gates

- Node tests only through `node scripts/run-tests.mjs <file.test.mjs> ...`; run your gate list plus every test that
  imports a file you change (`rg -l "<basename>|<symbol>" test`).
- Ask the plan lead before a full `npm test` or `cargo test --workspace`; at most one full `npm test` on the machine;
  a `HOLD suite` board line means no test process. Never SIGKILL a gate.
- Every phase: `test/setup/git-mutation-census.test.mjs`, `test/architecture.test.mjs`,
  `test/scripts/doc-health.test.mjs`, `node scripts/git-one-door-scan.mjs --root .` (count not above the base).
- Rust: `cargo fmt --all --check`; `cargo clippy -p <crates> --all-targets -- -D warnings`; `cargo test -p <crates>`;
  `cargo check -p <crates> --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`.
- Before commit: `git diff --stat`, check for unexpected deletions; stage explicit paths only.
- Regenerate, never hand-merge: `Cargo.lock`, `packages/host-runtime/contracts/command-{routes,manifest}.json`,
  `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`.

## Report

`reports/pNN-<slug>.md` (name via `fgos convention name`): what moved, Node lines deleted, the
"retired test -> owner now" table, backlog rows found, gate output, status block.
