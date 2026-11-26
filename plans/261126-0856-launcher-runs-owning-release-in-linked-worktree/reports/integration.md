# Integration report: plain fgos inside a linked worktree

Phase 1 landed on main as `95f5c01e5` (land ticket `c-37819-1795694710721`). The full suites ran on trunk
`535ba499d8`, which contains phase 1. Because the lead's own run was killed for low memory, `lead:SUPERVISOR`
ran them unconfined on 2026-11-26 between 21:08 and 21:30. The logs are under
`.fgos/runtime/tmp/supervisor-gate-535ba499d8/`: `SUMMARY.md`, `cargo-test.log`, `cargo-distribution.log` and
`npm-test.log`.

## Acceptance criteria

1. **Met.** `cargo test -p fgos-distribution --no-fail-fast` exits 0 (`cargo-distribution.log`), and all 14
   `launcher` tests that build on Linux pass, including the two new cases:
   - `from_a_linked_worktree_outside_the_main_checkout_the_launcher_runs_the_main_checkouts_store_release_and_names_the_project_on_stderr`
     covers the main checkout with its activation and store release, and a `git worktree add` worktree outside
     it.
   - `a_linked_worktree_with_missing_commondir_relative_gitdir_bad_commondir_or_no_activation_is_refused_by_name`
     covers a missing `commondir`, a relative `gitdir`, a common dir not named `.git`, no activation, a
     symlinked gitdir and an empty `.git` file. Each is refused by name, nothing runs, and the exit code is 126.
2. **Met with a stated reason.** The `cmd` body does not resolve a linked worktree. When the walk up finds no
   activation and the nearest `.git` is a file, it refuses by name with exit 126: "fgos cannot resolve a linked
   worktree's main checkout safely with cmd builtins -- run fgos from the main checkout". The reason is that
   cmd builtins cannot check file ownership (the `[ -O ]` rule) or detect a symlink on the path. Running another
   project's release without those checks would widen the trust boundary past what the owner accepted. The proof
   is `the_cmd_launcher_refuses_a_linked_worktree_by_name` (`#[cfg(windows)]`). It runs only in the focused
   Windows job and was not run on this Linux machine.
3. **Met.** `packages/distribution/rust/tests/goldens/launcher-digests.json` holds the new `sh` and `cmd`
   digests, and the digest test `the_bodies_are_the_bytes_the_earlier_module_wrote` is green in
   `cargo-distribution.log`. The module header of
   `packages/distribution/rust/src/launcher.rs` states the linked-worktree rule.
4. **Met.** See "Post-done land" below.
5. **Met: every failure comes from outside this plan's files.** No failing test touches `launcher.rs`,
   `launcher.sh`, `launcher-cmd.txt` or `launcher-digests.json`, and none exercises the installed launcher.
   - `cargo test --workspace` exits 101 and stops at its first red binary:
     `apps/fgos/tests/git_recover_confirm_dead.rs:141`
     (`a_caller_under_an_agent_cli_cannot_confirm_a_writer_dead`). That test panicked with `ETXTBSY` ("Text file
     busy") while it wrote and ran a helper binary. This belongs to the git component's test harness, not to the
     launcher. The launcher crate is fully green when run on its own (criterion 1).
   - `npm test` exits 1 with 18 failures, listed from line 9497 of `npm-test.log`:
     - `test/run-supervisor/terminal-crash-matrix.test.mjs` (1)
     - `test/run-supervisor/terminal-cutover.test.mjs` (8)
     - `test/runner/provider-per-cli-credential-sources.test.mjs` (2)
     - `test/scripts/mailbox-live-confined.test.mjs` (1)
     - `test/setup/skill-wrappers.test.mjs` (1)
     - `test/skills/fgos-supervisor-idle-lead.test.mjs` (2)
     - `test/workflow/case-close.test.mjs` (1)
     - `test/workflow/guide-schema.test.mjs` (2)

     All of these are run-supervisor, runner, mailbox, setup, skill and workflow suites, and none is in this
     plan's footprint. The suite also left `.fgos/runtime/dev-host/run-VIbcDw` behind.

## Behaviour notes

- A `.git` file with a relative `gitdir` now exits 126 (refused by name) instead of 127 (no installation found).
  Git writes relative gitdirs for submodules and when `worktree.useRelativePaths` is set, so these users get the
  refusal message, which says what was refused. Before, they got the generic "not found".
- Installed launchers pick up the new body at each machine's next `fgos doctor --fix`, through the
  `project-fgos-launcher` fix.

## Post-done land

The three lines below go into one `fgos land --paths CHANGELOG.md,docs/platform/packaging-distribution/spec.md`
after this plan is `done`. That land waits until plans `261122-0056-orchestration-skeleton` (`CHANGELOG.md`)
and `261125-1631-agent-context-engine` (the distribution spec) no longer claim those files.

1. Add to `CHANGELOG.md`, under `## [Unreleased]`:

   ```
   - Fixed: plain `fgos` inside a linked worktree made by `fgos worktree create` no longer stops with "no .fgos/installation found"; the launcher reads the worktree's `.git` file and `commondir` to find the main checkout and runs that project's activated release from the machine store, naming the project on stderr. A relative or missing gitdir, a missing `commondir`, a common dir not named `.git`, a symlink on that path, a main checkout owned by another user and a main checkout with no activation are refused by name. On Windows, `fgos.cmd` refuses a linked worktree by name and asks you to run fgos from the main checkout.
   ```

2. Add to `CHANGELOG.md`, under `## [Unreleased]` (carried for plan
   `261126-0853-config-set-refuses-stripped-project-file`):

   ```
   - Fixed: `fgos config set`, `patch` and `init` no longer create a fresh `.fgos/config.yaml` in a worktree whose tracked config was stripped; they refuse with `config-project-file-stripped` and name the main checkout.
   ```

3. Add to `docs/platform/packaging-distribution/spec.md`, as a new sub-bullet of RUL17, after the bullet
   "The launcher executes nothing from the project (2026-11-09)":

   ```
     - **A linked worktree runs its main checkout's release (2026-11-26).** When the walk up finds no activation and the nearest `.git` is a file, as in a worktree `fgos worktree create` made with `.fgos` stripped, the `sh` launcher reads that file's absolute `gitdir:` line and the git dir's `commondir` with shell builtins only, takes the main checkout as the parent of a common dir named `.git`, and runs the release named by the main checkout's `.fgos/installation/activation.json` under the same store-only, digest and `status: ready` rules, naming the project on stderr. A relative or missing gitdir, a missing `commondir`, a common dir not named `.git`, a symlink on the path, a main checkout the caller does not own and a main checkout with no activation are refused by name with exit 126, and nothing runs. `fgos.cmd` refuses a linked worktree by name, because cmd builtins cannot check ownership or symlinks. Proof: the linked-worktree tests in `packages/distribution/rust/src/launcher.rs`.
   ```
