# Phase 09 report: `uninstall` native (S4 packaging)

Branch `rust-verb-migration-program/s4-p09`, cut from the integration branch, rebased onto `1e1f5b176`. Code head
`6bd5190fb` (commits: `d22444265` `wired` on the hooks report, `6413834d2` yaml-doc edge, `2b44f3fc0` the host verb,
`6bd5190fb` Node deletion and fgctl fixtures; the report commit is on top). Worktree `rvm-s4-p09`, target
`rvm-s4-p09-target` (left for the step lead to delete at landing).

## What changed

- `apps/fgos/src/wiring/uninstall.rs` (new): plan and apply in one pass over `agent_hooks.rs` (remove),
  `skill_stamp.rs`, `timer.rs`, `rc_lines.rs`, RepositoryConfig (ownership proof) and Durable File (backups). The
  skill guard (tracked file with uncommitted edits, newer `version`) and the source-checkout skip live here; the
  frontmatter version reads through the YAML door. `data` keys and their order are Node's, the short answer of a
  failed backup included. A payload that cannot be found is a failed step named `payload`. The payload root is handed
  in by the composition root (`active_payload_root` in `main.rs`), so the module never names `legacy_exec`.
- Host wiring: catalog entry `uninstall.run`, provider, projector arm, annotation, `native: true`, regenerated routes and
  manifest. The doors resolve `uninstall` like `doctor` (main checkout, acts on the resolved root); `VerbAnswer` carries
  exit 1 on `failed[]`.
- Deleted: the arm, `EXIT_OF.uninstall`, `src/setup/uninstall-project.mjs`, `uninstallGitHooks`, `generatedSkillDirs`
  (and its project-vector case), and four Node test files.
- Doors: new row "project wiring reversal" (allowed `wiring/uninstall.rs`); `uninstall.rs` allowed in the "person's
  agent config writes" row (names the backup suffix); the uninstall-project debt entry and files entry go; the managed
  timer row's debt reason and `retiredBy` no longer name uninstall.
- Docs made false by the deletion corrected: spec 6.1 (source and proofs, "git hooks fgOS wired"), the three
  verification tables.
- Parity table `test/rust-host/parity-cases/uninstall.cases.mjs`: 42 cases, each entry on a fresh world prepared by the
  base release's own installers; compares exit, data, stderr and, for write cases, project and HOME on disk; asserts no
  Node child. Added to `verb-parity.test.mjs` TABLES.

## Accepted changes (for the `## [Unreleased]` line)

- A plan, or any call whose state root is gone, no longer creates the Git driver's directories in the state root (a read
  verb creates no removed state root). Node did, on every call.
- A failed step's `error` text is the Rust cause (OS message), not Node's `ENOENT: ...` wording; ids, shape and exit unchanged.
- `skills` order follows the render's reader (`.claude/skills` entries, then `.agents/skills`, names sorted within a root);
  `skill_stamp.rs` sorted globally before, which differed from Node. Fixed in the reader.
- rc lines: a payload outside any Git checkout (a release) looks for no rc line, as Node's `integrationScriptPath()` returned null
  there; a payload in a checkout looks for the main checkout's script (`checkout_integration_script`).

Proposed line: `fgos uninstall runs in the host (no Node process): same plan, backups, keeps and exit codes; a plan no longer creates fgOS state directories.`

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| `uninstall-project.test.mjs` plan, apply, backups, foreign entry, shim-mention hook, links, source checkout, rc named, linked roots, emptied root | `wiring/uninstall.rs` tests of the same names (plan, apply, backups, mention, links, emptied root/source checkout, shell profile) |
| `uninstall-project.test.mjs` failed backup | `a_failed_backup_runs_nothing_and_the_answer_has_the_short_shape` |
| `uninstall-wiring.test.mjs` (5 `uninstallGitHooks` cases) | `wiring/uninstall.rs`: unset+untracked hook/empty dir, tracked pre-commit survives, user path left and named, never-set no-op, relative setting without ownership proof |
| `uninstall-wiring-2/-3` CLI round trips (plan touches nothing; `--yes` unwires, names rc line, config untouched) | `wiring/uninstall.rs` plan/unwire/rc tests, `cli_tests.rs` (no Node, exit 0, nothing left behind), `fgctl-uninstall.test.mjs` (real shim) |
| `dir-resolution.test.mjs` uninstall from a linked worktree | `cli_tests.rs::uninstall_from_a_linked_worktree_acts_on_the_main_checkout` |
| `skill-wrappers.test.mjs` project vectors via `generatedSkillDirs` | `skill_stamp.rs` vector test (contract unchanged; the render's stamp-form and owned-name tests stay) |
| fgctl fake-shim answers (`OK_ANSWER`, `FAILED_ANSWER`) | recorded from the real host: `apps/fgctl/tests/goldens/uninstall-answer-{plan,failed}.json`; `fgctl-uninstall.test.mjs` is the one real-shim case |

New proofs besides: `repository_config.rs` `wired` (unit + integration assertion), `rc_lines.rs` `checkout_integration_script`.

## Gates

- `cargo fmt --all --check`: ok. `clippy -D warnings` (`fgos fgos-distribution fgctl fgos-git fgos-host-runtime`, all targets): ok.
- `cargo check --locked` same crates, `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: ok.
- `cargo test --locked -p fgos --no-fail-fast` (225 bin, 66 cli_tests, mailbox and lock suites): green; `-p fgos-distribution -p fgctl -p fgos-host-runtime -p fgos-git`: green.
- Parity `uninstall` table, 42 of 42 against the base release (rerun after the rebase). Node: `architecture, command-routes, verb-exit, skill-wrappers, dir-resolution, install-git-hooks, agent-hooks, fgctl-uninstall, fgos-manifest, subcommand-flag-drift, unknown-flag-rejection, help-routes, fgos-mirror` (381 tests): green. `export-command-selectors --check`: ok. Census regenerated.
- Latency (real release shim, 15 runs): `uninstall` plan median 61 ms (Node median in phase 00: 190 ms).
- Tests beyond my focused set that this change could affect: the series gate's full suite; specifically anything reading `bin/fgos.mjs` arms, `src/setup/git-hooks.mjs` or `skill-wrappers.mjs`, `docs/architecture-manifest.json` doors and `test/suite-baseline.json` (three rows removed; the new test file has no row until a full run).

## Concerns and flags

- New `pub` items in OPC-reviewed crates: `fgos-git` `HooksReport.wired` (field); `fgos-distribution`: `skill_stamp::first_symlink_under` made `pub`, `rc_lines::checkout_integration_script` new. New crate edge: `apps/fgos` -> `fgos-yaml-doc` (approved; Cargo.lock line in its own commit).
- Not deleted, because other importers remain: `src/setup/managed-timer.mjs` (two timer doctor rows, phase 07), `uninstallAgentHooks` and `agent-hooks.mjs` (MAIL's answer), `mainCheckoutHookWired` (row `main-checkout-hook-wired`, phase 04), `integrationScriptPath` (`setup-use-case`, `registrations`, phase 11), `shell-rc.mjs` (unchanged).
- The "root refusals of spec.md:185" (`/`, `$HOME`, ancestors, `..`) are fgctl's purge guard (`uninstall.rs:132-160`); the Node `fgos uninstall` verb never had them and adding them would be new behaviour, so the verb has none.
- Phase 08's shared-list lines (`main.rs`, doors, catalog, parity tables) were merged by hand on rebase; routes, manifest and census regenerated.
- The base's `.fgos/runtime/tmp/parity-base.json` was absent; I wrote my description file in the scratchpad from the staged addon directory (read-only use of the base).
- Phase 11 note: `docs/knowledge/*` pages still name `uninstallGitHooks` as history; left.

## Review follow-up

- `unwire_git_hooks` refuses to touch anything inside a `.githooks` reached through a link (the setting is still unset; the keep line names the link); test `a_hooks_directory_reached_through_a_link_loses_its_setting_but_nothing_inside_it`.
- One link walk, `distribution/path_links.rs` (`LinkPolicy::Any` for removals, `Escaping` for hook writes), replaces `skill_stamp::first_symlink_under`'s body and `agent_hooks::escaping_link`'s; new `pub` module in an OPC-reviewed crate.
- `removeOwnedHooksConfig` is retired from `src/git/config.mjs` and the Node addon's `GitRepositoryConfig`; the Rust method keeps its proof in `packages/git/rust/tests/repository_config.rs`.
- `managed-timer.mjs` and its test are deleted (phases 06 and 08 removed its last importers); the timer door row has no debt.
- The recorded fgctl answers are checked against a live host by `test/rust-host/fgctl-uninstall.test.mjs` (key and value-kind shape); re-record with the one-off script described in the commit if the shape changes.
