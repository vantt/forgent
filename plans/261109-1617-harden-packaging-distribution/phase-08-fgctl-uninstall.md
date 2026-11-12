---
phase: 08
title: "fgctl uninstall: reverse what fgOS wrote in the project, keep user config and data, --purge also removes the release store (Q3 a)"
status: completed (2026-11-12)
depends_on: ["P03 landed (fgctl main.rs)", "P04 landed (bin/fgos.mjs and command registry)", "in-flight (2) landed (to name its removal path)"]
parallel: "group G4 with P10 and P11"
effort: ~2d
net_size: "Rust about +200 / Node about +70 added, about -100 moved out of the arm and about -60 deleted (npm removal) / tests about +120 (estimate)"
---

# Phase 08 - Uninstall (F11)

## Context

UNI-01, UNI-02, UNI-03, UNI-05, AGT-08. `fgos uninstall --yes` (arm `bin/fgos.mjs:4128-4240`) reverses only the legacy `setup`: it unwires `core.hooksPath` and reports rc lines; after it, hooks, 21 skills x 2, `.fgos/installation`, the launcher, fgctl and the release store all remain (live step 15). No `fgctl uninstall` exists. Two PreToolUse hooks (`dispatch-decide`, `decision-question`) lack the `[ -x "$S" ] || exit 0` guard, so a hand-removed install makes every Agent call fail (audit F11); `scripts/check-hook-registrations-guarded.mjs` already enforces the guard idea for `.claude/hooks/*.cjs` (prior art: extend its check or its table, do not write a second one).

Decision 80 Q3 (a): `fgctl uninstall` removes what fgOS installed (activation, hooks, generated wrappers), keeps user config and data; `--purge` also removes the release store. Global agent wiring is in-flight (2)'s opt-in command; this phase never touches it and prints its removal line.

## Requirements

1. **Verb.** `fgctl uninstall [--dry-run] [--yes] [--purge]`. Without `--yes` it prints the plan (every path it would change, and every path it keeps, with where user config and data live) and exits 0 changing nothing; `--dry-run` is the same. With no TTY it never prompts (CMD-17). `fgos uninstall` is its project part: it runs the same plan builder and keeps the legacy git-hook and rc-line reporting.
2. **What it reverses (project scope):** hook entries in the project's agent configs by fill-only reversal (the same table that wrote them, `src/setup/agent-hooks.mjs`), generated skill dirs and wrappers that carry fgOS's marker (T8 Q3 b; a dir without it is reported and left), the git hooks `fgos setup` wired, and last `.fgos/installation` and the activation. Order: Node reversal first (needs the activated `fgos`), Rust removal last; a failed earlier step skips the irreversible one (UNI-06). It never removes `.fgos` data, the committed `.fgos/distribution.json`, config files, or anything not exactly ours (UNI-04).
3. **`--purge`** removes the machine release store (path from the existing state-root resolver, never typed by hand, never `/`, `$HOME` or a path containing `..`), after printing its path and size and warning that other projects pinned to those releases will need `fgctl init`. It still needs `--yes`.
4. **Launcher and fgctl binaries:** not removed (no ownership marker; Owner idea). The plan prints the two paths and the command.
5. **Hook guards.** The two unguarded registrations get the guard; the existing guard-check script covers them (AGT-08).
6. **npm removal.** The `--remove-package` path (`npm uninstall -g forgent`) goes with the retired npm channel (H14); its tests go with it.
7. Uninstall help (CMD-16 fields) is written here, into the registry entry P04 shaped.

## Files

**Create:** `packages/distribution/rust/src/uninstall.rs` (plan builder, removal order, purge guard; a real boundary: `init.rs` is 2 393 lines), `src/setup/uninstall-project.mjs` (Node reversal and the legacy body moved out of the arm), `test/setup/uninstall-project.test.mjs`.
**Modify:** `apps/fgctl/src/main.rs` and `help.rs` (after P03), `packages/distribution/rust/src/lib.rs` (module line), `bin/fgos.mjs` (arm becomes a call), `src/cli/command-registry.mjs` (help), `src/setup/agent-hooks.mjs` or `claude-code-hooks.mjs` (guards; after in-flight (2)), `scripts/check-hook-registrations-guarded.mjs` if its table needs the two names, `apps/fgctl/tests/cli_surface.rs`, `CHANGELOG.md`.
**Delete:** the inline arm body (about 110 lines), the `--remove-package` branch and its tests `test/setup/self-uninstall-spike.test.mjs` (behaviour removed with the channel).
**Tests to retire:** `test/setup/uninstall-wiring-2.test.mjs` and `uninstall-wiring-3.test.mjs` are re-pointed at `uninstall-project.mjs`, keeping each assertion (no weakening); `self-uninstall-spike.test.mjs` is deleted (behaviour removed).

## Red tests first

- `uninstall-project.test.mjs`: in a temp project after a real `init`-shaped fixture, `--yes` leaves no fgOS hook entry, no marked skill dir, no `.fgos/installation`; a foreign same-name skill dir and a user hook entry stay; `.fgos` data and config stay; without `--yes` nothing changes and the plan lists keep-paths.
- `uninstall.rs` unit tests: the purge guard refuses `/`, `$HOME`, `..`; order skips the irreversible step after a failure.
- `cli_surface.rs`: `fgctl uninstall` with no `--yes` exits 0 and prints a plan; with `--yes` removes; `--purge` removes only the store.
- Hook guard test: the two registrations are guarded (the existing script's check passes).

## Net size

Rust about +200 (uninstall.rs 170, main/help 30); Node about +70 new and about -100 moved, about -60 deleted; tests about +120.

## Steps

1. Facts: read the arm, the agent-hooks table, the marker convention from T8, item (2)'s removal design, the state-root resolver. 2. Red tests. 3. Node reversal, then Rust. 4. Delete the npm branch. 5. Scratch-HOME run: init, uninstall, diff the tree.

## Validation

FR the new and re-pointed tests, `test/architecture.test.mjs`, the guard script; scratch-HOME tree diff before init, after init, after uninstall (only `.fgos` data and config remain); the live check repeated.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| `--purge` deletes releases other projects use | Med x High | plan prints path, size and consequence; `--yes` required; never default; owner chose it (Q3 a) |
| Reversal removes a user's own hook entry | Low x High | fill-only reversal removes only entries equal to what fgOS wrote; the rest is reported |
| The arm move collides with T9 | Med x Med | this phase does the move; T9 inherits a thin arm |

## Rollback

Revert the merge; a project already uninstalled is re-onboarded with `fgctl init`.

## Closes

UNI-01, UNI-02, UNI-03; UNI-04 and UNI-05 partial to done; AGT-08 (SHOULD); CMD-07 partial (`--dry-run` on uninstall). INS-15 stays an Owner idea (`install.sh --uninstall`).
