# Phase-lead rules (every phase of this plan)

Each phase file repeats the three lines that differ (worktree, target dir, report slug). Everything else is here and is
binding; a phase file may tighten a rule, never loosen it.

- Repo `/home/vantt/projects/forgent` on fg-server2 (Asia/Saigon). Read `AGENTS.md`, `docs/reading-map.md`, this file, then your phase file.
- Base: `origin/main` once F0 wave A (the `doors` table and its check, F0 phase 01, merged on the F0 integration branch at
  `1161aad8c`) has landed on main, plus whatever your phase file's "Start after" names. Rebase onto `origin/main` before landing;
  the big lead lands each phase on main (see plan.md "Integration and landing").
- Worktree: `/usr/bin/git worktree add -b one-door-debt/pNN /home/vantt/projects/forgent-worktrees/odd-pNN origin/main`.
  Assert the path is in `/usr/bin/git worktree list` before any other command in it. Never chain a destructive step after a `cd`.
- Rust: `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/odd-pNN-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` only. Run the phase's gate list plus every test that imports or reads a
  file you change (`rg -l "<file basename>|<symbol>" test`). Ask the big lead before `npm test` or `cargo test --workspace`.
  Never SIGKILL a test run; if one hangs, stop it with SIGTERM and prune worktree registrations afterwards.
- Every phase gate includes: `test/architecture.test.mjs` (the `doors` check), `node scripts/doc-health.mjs` through
  `test/scripts/doc-health.test.mjs`, `node scripts/check-decision-citation-drift.mjs`, and `node scripts/git-one-door-scan.mjs --root .`
  (summary count not above the count recorded on the base; regenerate the census with `--write-census`, never hand-merge it).
- Rust touched: `cargo fmt --all --check`; `cargo clippy -p <crates> --all-targets -- -D warnings`; `cargo test -p <crates>`;
  `cargo check -p <crates> --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`.
- `doors` rows: edit only the row(s) your phase file names, in `docs/architecture-manifest.json`. Re-run each pattern with the
  real check before landing and record the final `allowed`/`debt` lists in the report. A fix removes its own `debt` entry in the
  same commit (the stale check fails otherwise). A new row lands with the fix and carries no debt for the leak it fixes.
  When the leak sits in a row another plan adds (F0 phase 00 part B or 08) and that row is not on your base yet, do not add
  the row: fix the code and write in the report "leak gone, the row lands with no debt entry for <file>", so the other plan's
  re-run of the pattern finds nothing. Row shape is the one in `test/architecture.test.mjs` `checkDoors` (job, kind, patterns,
  allowed as path/glob strings or `{path, reason}`, debt as `{path, reason}`, reason, retiredBy for a Node/Rust twin);
  `scripts/` entries always carry a reason; JS string contents are matched, comments and Rust `#[cfg(test)]` code are not.
- One owning proof per behaviour (design principle 8). A retired test names its new owner, or says the behaviour was removed,
  in the commit message. No env switch, flag or test-only branch to make a test pass.
- No plan ids, phase numbers or finding codes in code, comments, test names or commit messages.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any deletion you did not plan. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes (`/usr/bin/git push origin HEAD:refs/heads/one-door-debt/pNN`). Never push to `main`.
- Never edit `CHANGELOG.md`. Never edit `Cargo.lock` unless the phase file says so and the big lead approved it; name the
  user-visible `## [Unreleased]` line, if any, in the report for the big lead.
- Report: `fgos convention path --kind report --type phase --slug odd-pNN-<slug> --plan 261114-2215-one-door-debt --json`
  (run from the main checkout). End with `Status / Summary / Concerns`.
- When the phase lands: kill any test process you started, `fgos worktree remove <path> --delivered-to origin/main --discard-ignored </dev/null`, delete the Cargo target.
