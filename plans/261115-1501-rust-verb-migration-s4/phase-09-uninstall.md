---
phase: 9
title: "`uninstall` native"
status: pending
effort: 2d
wave: B
blockedBy: [0, 1, 2]
q3: "answered (a)"
---

# Phase 09: `uninstall` native

The project half of `fgctl uninstall` (`spec.md:177-187`) moves to the host over the 01 and 02 modules. `fgctl`
keeps calling the project's activated `fgos uninstall [--yes]` through its shim and parsing the same keys
(`packages/distribution/rust/src/uninstall.rs:345, 385-420`), so the reversal stays with the release that installed it.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p09`. Report slug `s4-p09-uninstall`.

## Context

- Registry `command-registry.mjs:2337-2363` (`--yes`, `--dry-run`; `store: 'none'`); arm `bin/fgos.mjs:3519-3527`
  (`apply: yes && !dry-run`; imports `integrationScriptPath` from `src/setup/checks.mjs`, which loads the doctor
  registry at runtime); exit 1 on `failed` (`verb-exit.mjs:12`).
- `src/setup/uninstall-project.mjs` (205): hooks out of `.claude`, `.codex`, `.agents`, `.omp`, `.pi` (agent hooks
  table), generated skill directories with the wrapper stamp (`createProjectSkillGuard`, `generatedSkillDirs`,
  `ownedSkillNames`, line 25; F12), git hooks it wired (`uninstallGitHooks`, RepositoryConfig ownership proof),
  managed timers, rc lines named only; every rewritten or deleted file copied to `<file>.pre-uninstall-<time>` first;
  a failed backup runs nothing (156-160); `assertInside` (38); links refused, never followed.
- Proofs today: `test/setup/uninstall-project.test.mjs` (213), `uninstall-wiring*.test.mjs`, `dir-resolution.test.mjs:131`,
  `apps/fgctl/tests/uninstall_surface.rs` (15 tests with a fake shim).

## Requirements

1. `apps/fgos/src/wiring/uninstall.rs`: one plan, then apply, with Node's order and rules, over `agent_hooks.rs`
   (remove), `skill_stamp.rs` (D8), `timer.rs` (remove), `rc_lines.rs` (name), RepositoryConfig (unwire with its
   ownership proof), Durable File (backups); the project skill guard (`createProjectSkillGuard`,
   `src/setup/skill-wrappers.mjs:285`: a tracked file with uncommitted changes, or one whose `SKILL.md` declares a newer
   `version` than the release's, is kept and named; dirty paths through `fgos-git` status) and the source-checkout
   skip (`uninstall-project.mjs:63-65`); in plan mode the hooks-path answer `mainCheckoutHookWired` gave
   (`planGitHooks`); the root refusals of `spec.md:185` (`/`, `$HOME`, an ancestor of either,
   `..`, not absolute) and link refusal in every path component; `data` keys exactly as F8 lists (fgctl's parser),
   including `backups[].file/backup` and `failed[].id/error`; the envelope is printed without `--json`, as `fgctl`
   calls it (`uninstall.rs:345-399`). Rc lines are matched through `rc_lines.rs` (D18); the hooks-path answer comes
   from RepositoryConfig's `wired` (D17).
2. Host wiring per the recipe; D11 answer type for exit 1.
3. Parity `uninstall.cases.mjs` (fresh fixture per entry, `fs-delta` of the project and HOME): plan; `--yes`;
   `--dry-run --yes`; a foreign hook entry kept; a foreign and a stamped skill directory; git hooks wired by fgOS and
   by the user; a timer present; an rc line present (named, untouched); a link in a path (refused); a failed backup;
   a source checkout (skipped); a tracked skill file with uncommitted changes and one with a newer `version` (kept);
   `--dir`; an unknown flag. Plus `apps/fgctl/tests/uninstall_surface.rs` against the real host shim once, checking
   the sub-shapes `fgctl` reads; the 14 fake-shim fixtures are regenerated from the real host's output.
4. Delete (D14; 06 has removed the doctor's timer use): the arm, `src/setup/uninstall-project.mjs`,
   `src/setup/managed-timer.mjs` (in no frozen set, deleted freely), `uninstallGitHooks` and `mainCheckoutHookWired` (`git-hooks.mjs` keeps `installGitHooks`
   for `scripts/install-git-hooks.mjs`), `generatedSkillDirs`, uninstall's import of `shell-rc.mjs` (the file keeps
   insertion until 11 and `detectRcFiles` for the session-start hook, D18), `integrationScriptPath` if no other user,
   `EXIT_OF.uninstall`, the Node tests whose behaviour moved; `rg` each name before the commit.
5. `doors`: a "project wiring reversal" row (allowed `wiring/uninstall.rs`); debt `uninstall-project.mjs` and
   `managed-timer.mjs` leave the 02 rows.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| plan vs apply, backups, foreign entries kept, links refused, rc named, source checkout skipped | `test/setup/uninstall-project.test.mjs` | `wiring/uninstall.rs` tests (temp projects) |
| git hooks unwired only with the ownership proof | `uninstall-wiring*.test.mjs` | `fgos-git` RepositoryConfig tests + one `uninstall.rs` case |
| fgctl reads the reversal | `apps/fgctl/tests/uninstall_surface.rs` | unchanged + one real-shim case |

## Files

- Create: `apps/fgos/src/wiring/uninstall.rs`, `test/rust-host/parity-cases/uninstall.cases.mjs` (deleted by 12).
- Modify: host files per the recipe, `bin/fgos.mjs`, `src/setup/{git-hooks,shell-rc,skill-wrappers,checks}.mjs`
  (exports out; `agent-hooks.mjs` is frozen and untouched, so `uninstallAgentHooks` stays there as debt), `src/cli/{verb-exit,command-registry}.mjs` (description: "the git hooks fgOS wired" instead of
  "`fgos setup` wired"), `apps/fgctl/tests/uninstall_surface.rs`, tests, baseline, manifest, census.
- Delete: as requirement 4.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-distribution`, `fgctl`; `cargo test -p fgos -p fgos-distribution -p fgctl`; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/uninstall-project.test.mjs test/setup/dir-resolution.test.mjs test/scripts/install-git-hooks.test.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs`.

## Risk and rollback

- An uninstall removes a file that is not fgOS's (L x H): only stamped directories are removed (D8) with vectors; foreign cases in parity;
  backups before every change; link refusal tests.
- Rollback: revert the phase; the Node arm returns; the reversal's keys are unchanged, so `fgctl` reads either.
