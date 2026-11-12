# Packaging P08: `fgctl uninstall`

Branch `harden/pkg-p08-fgctl-uninstall`, rebased on `6848449d8`. Owner decision 80 Q3 (a): remove what fgOS installed, keep config and data, `--purge` also removes the release store.

## 1. What landed

- **`fgctl uninstall [--dry-run] [--yes] [--purge]`** (`packages/distribution/rust/src/uninstall.rs`, verb table and help in `apps/fgctl/src/help.rs`, one arm in `main.rs`). It prints the plan first (every change, every keep, what is left to the person), asks only at a terminal when `--yes` is absent, and never prompts without one. Order: the project's activated `fgos uninstall --yes` reverses the wiring, then `.fgos/installation` goes (its two records copied to `.fgos/uninstall-backup-<time>/` first), then, with `--purge`, the store. A failed step makes every later irreversible step skip (proven by a unit test and a surface test).
- **`fgos uninstall [--yes] [--dry-run]`** is the project half (`src/setup/uninstall-project.mjs`; the inline arm is a call, about 90 lines gone from `bin/fgos.mjs`). One function describes and applies, so the plan read is the plan run. It removes: hook entries and generated extensions the install table wrote (`.claude`, `.codex`, `.agents`, `.omp`, `.pi`, through the installer's own ownership test, new `uninstallAgentHooks` in `agent-hooks.mjs`), generated skill directories that carry the wrapper stamp or assembled header, the git hooks `setup` wired (existing `uninstallGitHooks`), and the project's mailbox sync timer (existing `fixMailboxSyncTimer` with no schedule, which removes only marker-carrying units). Every file it rewrites or deletes is copied to `<file>.pre-uninstall-<time>` first.
- **Hook guard (AGT-08).** Claude Code's `dispatch-decide` and `decision-question` commands are now `S=...; [ -x "$S" ] || exit 0; "$S" hook <kind>`; an earlier unguarded registration is replaced in place by `doctor --fix`. `scripts/check-hook-registrations-guarded.mjs` now also checks commands that run the project shim (it failed on the repo's own two lines before the fix).
- **npm removal** (`--remove-package`) and its spike test are deleted.
- Help for both verbs carries the CMD-16 fields; CHANGELOG line added.

## 2. Decisions

- **Global agent wiring: listed, never undone.** `src/setup/agent-wiring.mjs` records only `<file>.pre-wire-agents-<time>` copies and writes no ledger, so there is nothing recorded to reverse. The plan prints `claude plugin uninstall fgOS@fgos-plugins`, `claude plugin marketplace remove fgos-plugins` and the backup note (constants exported from `agent-wiring.mjs`, not copied). Decision 80 Q2 (a) holds.
- **`--purge` removes the store entries, not the state root.** The phase text says "the release store (path from the state-root resolver)". The resolver's root also holds `identity/`, `machine-id`, `locks/`, `attestations/`, `worktree-provisioning/` and more, which are not release data. Purge removes only entries of `releases/`, `quarantine/` and `installs/` whose names have the shape fgOS gave them, then each of the three directories when nothing foreign keeps it. A live run kept `identity`, `locks` and `machine-id`.
- **Root guard.** Refused: not absolute, any `..`, `/`, `$HOME`, an ancestor of `$HOME` or of the project. Purge holds `install.lock`. Links are refused, never followed, in parent components too: `.fgos` or `.fgos/installation` as a link aborts (Rust); on the Node side `firstSymlinkUnder` (new, in `src/util/refuse-symlink.mjs`, the shared link door) judges every component of a hook file, an extension or a skills root, and a linked one is kept and named, never walked. A linked store directory aborts; a linked entry is not a store entry. A linked state root itself is allowed (a dotfiles-managed `~/.local/state` is legitimate and the entries removed are still the ones fgOS named). Review round: OPC found the parent-link gap on both sides; fixed with a Rust test (linked `.fgos`) and a Node test (linked skills root and extensions directory).
- **Skills are not copied before removal.** Their stamps say they are overwritten on every setup, and `fgctl init` regenerates them; the project's own uncommitted edits or newer-version files are kept by the same guard setup uses (`createProjectSkillGuard`). The fgOS source checkout (package root equals project) keeps its surfaces.
- **No shim means no apply.** With an activation but no runnable shim, the plan says run `fgctl repair`; `--yes` exits 1 and changes nothing (old unguarded entries could not be reversed otherwise).
- **`fgos uninstall` without `--yes` now prints the plan and exits 0** (it refused with exit 4). The one retired assertion is re-pointed: `uninstall-wiring-2.test.mjs` now asserts the plan, exit 0 and that nothing changed.
- Codex and agy dispatch/decision registrations stay unguarded: the audit scoped the finding to Claude Code, and the codex mailbox comment records that wrapping changes the topology a hook sees, which nobody has measured for these two kinds. Not changed here; see Concerns.

## 3. Proof

- Node: `test/setup/uninstall-project.test.mjs` (8 tests: plan changes nothing and lists keep-paths; apply removes hooks and skills and keeps user hook, model key, foreign skill, `.fgos` data; backups; foreign same-name dir reported; lookalike hook kept and named; symlinked skill dir and hook file refused; source checkout keeps skills; rc line and global wiring named), 2 hook-guard tests in `agent-hooks.test.mjs` (the command runs with and without a shim and passes the exit code; an old unguarded entry is replaced in place), 2 in `test/scripts/check-hook-registrations-guarded.test.mjs`.
- Rust: 7 unit tests in `uninstall.rs` (purge guard, step order, purge removes only store-shaped entries, links, name shapes, installation removal and backup, linked installation), 7 in `apps/fgctl/tests/uninstall_surface.rs` (own file, so the `cli_surface.rs` P06 also edits is untouched).
- Retired: `self-uninstall-spike.test.mjs` (behaviour removed with the npm channel). `uninstall-wiring.test.mjs` (git hook unit cases) and `-3` unchanged: their owner is `uninstallGitHooks`, still called.
- Full `npm test` (`/dev/shm/p08-full-*.log`): 8805 tests, 2 failed, both known (V7n addendum; document-identity citation drift in `check-decision-citation-drift`); no run-tests ERROR line. Suite line: +13 -3 test() calls, 0 new CLI/host spawn sites.
- `cargo fmt --all --check`, clippy `-D warnings` on `fgos-distribution` and `fgctl`, `cargo test -p fgos-distribution -p fgctl`, `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: green. Census regenerated by its script (0 undeclared; the `rust-test` class count rose by one, the `git init` of the new surface test).
- **Live scratch-HOME run** (`/dev/shm/p08-live`, a real release built from this tree, own state root, never the real `~`): `fgctl init` then `fgos setup`, then plan (tree identical before and after: `plan changed nothing`), then `--yes`: all fgOS hook entries gone from `.claude/settings.json`, `.codex/hooks.json`, `.agents/hooks.json`, `.omp` and `.pi` extensions (only `.pre-uninstall` copies remain); the user's `CustomTool` hook and `model` key stayed; 21 + 22 generated skill dirs gone, the user's `mine` skill stayed; `.fgos/installation` gone; `.fgos/config.yaml`, `distribution.json`, `coexistence.json` stayed. Then `--purge`: the one 47.8 MB release gone, `identity`, `locks`, `machine-id` stayed. Found and fixed: two records went to two backup directories (one timestamp per file).

## 4. Net lines (measured, `git diff --numstat origin/main...HEAD`, census, manifest and CHANGELOG excluded)

| Part | Estimate | Measured |
|---|---|---|
| Rust production (`uninstall.rs` 626, `help.rs` +51, `main.rs` +16, `lib.rs` +1) | about +200 | +694 |
| Node production (`uninstall-project.mjs` 200, `agent-hooks.mjs` +93, `skill-wrappers.mjs` +29, guard script +17, registry -2, small exports +6) | about +70 and -100 moved | +343 |
| Deleted (inline arm, `--remove-package` branch) | about -160 | -89 in `bin/fgos.mjs` |
| Tests | about +120 | Rust +493 (unit 199, surface 294), Node +254, -122 deleted spike |

The estimate was low. Rustfmt's vertical style and the module doc account for part of the Rust gap, but most is real: the root guard, store scan with name shapes, the typed error enum, the Node JSON parse and the prompt. `uninstall.rs` is the largest hot spot if the owner wants to trade safety checks for size. The Node side is larger than "about +70" because the hook reversal (`uninstallAgentHooks`, 93 lines) is new code the phase file treated as a call to an existing table.

## 5. For the big lead

- **Tracked `.claude/settings.json`: exactly two lines changed**, to merge into the main checkout's local copy by hand after landing. Under `hooks.PreToolUse`:
  - matcher `Agent|Task`, command `S=\"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos\"; [ -x \"$S\" ] || exit 0; \"$S\" hook dispatch-decide` (was `\"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos\" hook dispatch-decide`);
  - matcher `AskUserQuestion`, command `S=\"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos\"; [ -x \"$S\" ] || exit 0; \"$S\" hook decision-question` (was the bare form).
  The strings are as JSON-escaped in the file; `git diff --stat .claude/settings.json` is 2+ 2-. `doctor --fix` rewrites an older registration to this form by itself.
- Unlisted files touched, each by a minimal edit: `src/util/refuse-symlink.mjs` (`firstSymlinkUnder`), `src/setup/skill-wrappers.mjs` (new `generatedSkillDirs`, beside the stamp checks it reads), `src/setup/agent-wiring.mjs` (two exports), `src/cli/verb-exit.mjs` (one line: `uninstall` exits 1 when a step failed, like `wire-agents`), `docs/architecture-manifest.json` (one row).
- Docs: README and the packaging spec change in P07 (it depends on this phase's output text); this phase only wrote the CHANGELOG line.

## Authority

- **Which files `uninstall` may remove** belongs to the writer of each file. The hook rows have one owner (the table in `agent-hooks.mjs`), now also the owner of their reversal. The skill stamps belong to `skill-wrappers.mjs`, now also the owner of "which directories are ours" (`generatedSkillDirs`). The release store layout belongs to `store.rs` (names of `releases/`, `quarantine/`, `installs/`); `uninstall.rs` re-states those three directory names and entry shapes. If `store.rs` ever changes a name, purge would leave the old entries as foreign, which is the safe direction, but the shapes should live in one place: a small `store.rs` helper (`is_store_entry_name`) is the right owner. Not moved here (`store.rs` is not this phase's file).
- **The machine state root is not a release store.** `resolve_machine_release_store_root()` returns the whole fgOS state root (`fgctl stage`, `status` and the lock all use it under that name). The name hides that it also holds identity and locks. The rename belongs to the Rust distribution crate (a `state_root` for the root, `release_store` for the three directories); not done, because every caller moves with it (L10) and `init.rs` is P06's.
- **Where global agent wiring is undone** has no owner: `wire-agents` writes and `uninstall` cannot read back. If the owner wants a real reverse, the owner is `agent-wiring.mjs`, recording what it did in a ledger next to its backups; I did not add one (RUL104).

## Lessons

- I wrote code before the red tests for the Node half and only saw a test fail by accident (a backup file I had not counted). Rule that would have helped: the phase brief says "red tests first"; run each new test against an empty stub once before filling it in.
- Two cheap bugs only showed in the live run (records split over two backup dirs; a 43-line skill list in the plan). Run the scratch-HOME check as soon as the verb works end to end, not after the full suite.
- The one-door scan treats an unresolved `Command::new(param)` as a Git spawn candidate; computing the path inside the function from a fixed chain (`project_shim`) made it resolve without a declaration. Worth a line in the census how-to.
- A link check on the leaf alone is not a link check: test the parents of every path a remover or rewriter reaches, with a test that puts the link above the leaf.
- The review request should go to OPC before the full suite starts (a reviewer change reruns it); this time it went while the suite ran.
- The architecture test forbids an infra file importing `registrations.mjs`; the caller passes what it needs (`shellIntegrationScript`). Quicker to look at the manifest tier of a new file's imports before writing them.
