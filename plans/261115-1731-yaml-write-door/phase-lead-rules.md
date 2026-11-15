# Phase-lead rules (every phase of this plan)

Binding for every phase lead; a phase file may tighten a rule, never loosen it. Base brief:
`/home/vantt/projects/forgent/.fgos/runtime/tmp/t6-phase-lead-brief.md`, with the changes below (they win).

- Repo `/home/vantt/projects/forgent` on fg-server2 (Asia/Saigon). Read `AGENTS.md`, `docs/reading-map.md`,
  `docs/platform/yaml-document/spec.md`, this file, [phase-00-facts.md](phase-00-facts.md), then your phase file.
- Integration branch: `yaml-write-door/integration`, cut from `origin/main` by the plan lead. Your base is its head at the
  moment your blockers have landed on it, never `origin/main` directly. You land on the integration branch, never on main;
  the big lead (`forgent-6a`) lands the integration branch on main as one series.
- Worktree: `/usr/bin/git worktree add -b yaml-write-door/pNN /home/vantt/projects/forgent-worktrees/ywd-pNN origin/yaml-write-door/integration`.
  Assert the path is in `/usr/bin/git worktree list` before any other command in it. Never chain a destructive step after a `cd`.
- Rust: `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/ywd-pNN-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Red first: commit and push the failing test before the fix.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` only (logs to `/dev/shm`, one file per run). Run the phase's gate
  list plus every test that imports or reads a file you change (`rg -l "<file basename>|<symbol>" test`). Ask the big lead
  before a full `npm test` or `cargo test --workspace`; at most one full `npm test` on the machine; a COOK `HOLD suite`
  board line means no test process at all. Never SIGKILL a gate; no focused run in a worktree while its full suite runs.
- Every phase gate includes `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`,
  `test/scripts/check-decision-citation-drift.test.mjs`, and `node scripts/git-one-door-scan.mjs --root .` (count not above the
  base; regenerate the census with `--write-census`, never hand-merge it).
- Rust touched: `cargo fmt --all --check`; `cargo clippy -p <crates> --all-targets -- -D warnings`; `cargo test -p <crates>`;
  `cargo check -p <crates> --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`.
- One owning proof per behaviour (design principle 8): extend the owning test the phase file names; a new test says in its
  title what behaviour it owns and why no existing test proves it. A retired test or assertion names its new owner in the
  commit message. No env switch, flag or test-only branch to make a test pass.
- No plan ids, phase numbers or finding codes in code, comments, test names or commit messages. Conventional commits ending
  with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any deletion you did not plan. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes (`/usr/bin/git push origin HEAD:refs/heads/yaml-write-door/pNN`). Never push to `main`.
- Never edit `CHANGELOG.md`, `docs/architecture-manifest.json`, `docs/backlog.md` or `Cargo.lock` unless your phase file
  owns it. Name a user-visible `## [Unreleased]` line, if any, in your report for phase 09.
- Landing on the integration branch: only after OPC (`forgent-5f`) answers MERGE on your pushed head (send branch, head
  commit, phase file). One board line per landing or blocker in `plans/261017-1313-fgos-platform-program-board/log.md`
  (insert before the first `\n- 20`, stamp with `date '+%Y-%m-%d %H:%M'`, prefix `YAML-WRITE`).
- Report: `fgos convention path --kind report --type phase --slug ywd-pNN-<slug> --plan 261115-1731-yaml-write-door --json </dev/null`
  (run from the main checkout). End with `Status / Summary / Concerns`.
- When the phase lands: stop every test process you started,
  `fgos worktree remove <path> --delivered-to origin/yaml-write-door/integration --discard-ignored </dev/null`, delete the Cargo target.
