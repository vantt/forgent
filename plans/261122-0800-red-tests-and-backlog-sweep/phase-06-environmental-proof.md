# Phase 6: Prove or disprove the environmental four

Capability: `code:debug`.

## Inputs

- Row `p-vnsigyw6h7` notes: four reds seen in the full-suite run at `ce1ef4d36` and marked "likely environmental,
  unproven". Logs: `forgent-worktrees/main-npm-test-ce1ef4d36.log`, `main-cargo-test-ce1ef4d36.log`.
  - `test/git/one-door.test.mjs` (HEAD moved during the scan).
  - `test/install-packaging.test.mjs` (EISDIR on directory symlinks left under `.fgos/assignments/*/outbox`).
  - `apps/fgos/tests/cli_tests.rs` (around line 3666 at `ce1ef4d36`; timing under load).
  - `packages/run-supervisor/rust/tests/supervise_portable.rs` (around line 274; timing under load).

## Footprint

`plans/261122-0800-red-tests-and-backlog-sweep/reports/environmental-reds.md` only. This phase changes no code.

## Steps

For each of the four:

1. Run it alone on a quiet machine with no other suite running, at least three times
   (`node scripts/run-tests.mjs <file>` or `cargo test -p <crate> --test <name>`).
2. Then try to reproduce the reported failure under the named condition: a commit landing on main during the
   one-door scan; a directory symlink under `.fgos/assignments/*/outbox` during npm pack; CPU load from a parallel
   `cargo test` for the two timing cases.
3. Verdict. **Environmental** when it passes quiet and fails only under the condition, and the test is meant to
   observe a stable tree. **Code cause** when the failure shows production or test code that should tolerate the
   condition. Examples: the pack walk follows a directory symlink it should skip, or a test reads the live
   repository's `.fgos` instead of its own temp tree.
4. For a code cause, name the file and the change, and say which plan owns the file. `install-packaging` and
   `cli_tests.rs` are in plan S6a's footprint, so a fix there goes to lead:S6A. Any other file goes to a new backlog
   row. Do not edit it here.

## Verify

The report has one section per red with: the runs and their results, the reproduction command, the verdict, and for
a code cause the owning plan or the new row id.

## Rollback

Delete the report.
