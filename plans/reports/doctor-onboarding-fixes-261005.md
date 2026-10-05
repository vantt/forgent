# Doctor and onboarding fixes (2026-10-05)

Branch `worktree-agent-a1089d51ca31bb27d`, started from the lead's local main (`8273f56ff`).

## 1. Task-spec checks on a plain target project

- Wrong: `task-specs-resolve` and `domain-workflow-operations-coverage` resolved task-spec and agent files against the target project's `domains/` and `core/`. The domain registry they walk is code loaded from the fgOS install, and the files it names ship in the same release payload, so any project without fgOS's own trees failed.
- Evidence: both functions used `cwd` for `resolveTaskSpecPath` and `allAgentYamlFiles`; the mdview report and the guide report showed them red on a bare repo.
- Change (`src/setup/registrations.mjs`): a module constant `FGOS_INSTALL_ROOT` (two levels above the file). `checkTaskSpecsResolve(root)` (now exported) and `findWorkflowStageOperationProblems(cwd, domains, root)` resolve against that root; `cwd` is still used for the project's shared runner config. Chosen over "not applicable" because the check protects the shipped payload's consistency, which is true on every install.
- Tests (`test/setup/registrations.test.mjs`): both checks pass for a temp project with neither tree; both still fail when the root they are pointed at lacks the task-specs.

## 2. shell-integration-sourced inside an agent harness shell

- Wrong: the probe deliberately strips underscore helpers from a sourced script and calls `fgos --help`; in a harness shell (and from a directory with no fgos on PATH) that fails, which says nothing about the user's own terminal.
- Change: `insideHarnessShell()` (`CLAUDECODE` or `CLAUDE_CODE_SESSION_ID` set). When the probe fails there, the check still passes and the message carries an "informational, running inside an agent harness shell" note with the original text. Outside a harness shell it fails exactly as before.
- Tests (`test/setup/checks-doctor-config.test.mjs`, `test/setup/checks.test.mjs`): the existing failing-probe test now clears the harness variables and still expects failure; the same fixture with `CLAUDECODE=1` passes with the informational note.

## 3. observe-friction-migrated names no fix

- Wrong: the three failure messages named no command. `friction migrate` exists only in the Rust host (`packages/observe/rust/src/friction_cli.rs`); the Node entry refuses `friction` (nativeOnly), and no verb-forwarding pattern exists for it.
- Change: the messages end with `run: <host binary> friction migrate --dir <root>` when `resolveHostBin` resolves, otherwise the same command with a pointer to `<project>/.fgos/installation/bin/fgos` or `FGOS_HOST_BIN` and the note that the Node entry has no friction verb. No new verb.
- Tests (`test/setup/observe-doctor-checks.test.mjs`): the generic fix text is asserted; with `FGOS_HOST_BIN` set the resolved binary is named.

## 4. Onboarding claims

- (a) README: the first install step now shows `fgctl init --from ./fgos-<version>-x86_64-unknown-linux-gnu.tar.gz` and says a plain `fgctl init` needs a committed `.fgos/distribution.json`. Evidence: `init_workspace` in `packages/distribution/rust/src/init.rs` (from the prior guide report).
- (b) `fgos setup` help (description and the `deprecated` string, which is also the setup result's `deprecation`) now says `doctor --fix` runs only the registered fixes and that one `fgos setup` writes the config defaults, git hook and Claude Code hook. Repeated text fixed in README, the guide section 2.2 and `docs/specs/distribution.md`. The two tests that pin the deprecation string were updated.
- (c) Exit codes. Decision: do not change the default; add `--strict`.
  - Evidence of dependence on exit 0: `packages/distribution/rust/src/init.rs` `run_tail` runs `init`, `doctor --fix`, `doctor` and on any non-zero status marks the install `ready-degraded` and returns `TailFailed`; `fgctl upgrade` and `repair` share that tail (`test/rust-host/fgctl-init.test.mjs`, `fgctl-upgrade.test.mjs` assert the degraded path). A project that has not run `fgos setup` always has red checks, so exit 1 by default would degrade every fresh `fgctl init`. `test/setup/doctor-fresh-run.test.mjs` also asserts exit 0 for doctor and `doctor --fix`. No hook, script, plugin or `.github` workflow calls doctor.
  - Change (`bin/fgos.mjs`, registry entry, guide, spec row): `fgos doctor --strict` exits 1 when any check has `passed: false`, also after `--fix` ran; the report is still printed. Exit code convention follows `plan-lint` (1). The informational probe note (item 2) is `passed: true`, so it never trips `--strict`.
  - Tests: `test/setup/doctor-strict-exit.test.mjs` (default exit 0 with a failing check; `--strict` exit 1; `--fix --strict` exit 1).

## Other

- `docs/architecture-manifest.json`: added the missing row for `src/workflow/dir-guard.mjs` (it came with the lead's main and made `test/architecture.test.mjs` fail; no file under `src/workflow` was touched). No new `.mjs` source file was added by this work; the one new test file is outside the manifest's `src`/`bin` scope.
- Guide (`docs/how-to/install-fgos-in-a-project-and-use-doctor.md`) updated: the three check rows, the `--strict` row and exit-code bullet, section 2.2 and the tail note. `docs/enduser-docs-index.json` regenerated, no diff.
- CHANGELOG `[Unreleased] > Fixed`: one line per user-visible fix (five lines).
- A `git stash` was run once by mistake and immediately applied and dropped by its exact sha; no other stash entry was touched.

## Tests run

`env -u CLAUDE_CODE_SESSION_ID node --test` on: `test/setup/registrations.test.mjs`, `checks-doctor-config`, `checks`, `shell-rc`, `observe-doctor-checks`, `doctor-strict-exit`, `checks-setup-rc-line`, `doctor-fresh-run`, `test/cli/fgos-manifest`, `command-registry`, `fgos-help`, `test/architecture`, `test/rust-host/command-routes`. All pass. Full suite not run.

## Unresolved

- `fgctl` tail could opt into `--strict` for a future "degraded on red check" install state; that is a product call, not made here.
