# Phase 16: The live migration of this repository's project file (owner gate G-D1)

Depends on 07 and the G-D1 answer. **Parked by default.** Suggested executor: sonnet, with the lead present. The rehearsal part runs inside Slice D regardless of the answer; the live part runs where G-D1 puts it (recommended: as the first step of Slice C's cutover landing).

## Context

The new snapshot refuses this repository's project file (`gateway` section on a `global-only` node, the dead `lock.predecessorKillWaitMs` key with no schema node; the file is 1,557 lines, `runner.capabilities` 42 entries, `runner.executors` 8, `runner.$comment` the tier ladder). `fgos config migrate` replaces `.fgos/config.json` with the tombstone text; until Slice C every Node reader parses `.fgos/config.json` as JSON, so the live swap breaks every `fgos` verb in this repository. Plan gate G-D1 asks when to do it; this phase says exactly what is done in either case.

## Files it may touch

Rehearsal: scratch under `.fgos/runtime/tmp/`, and `packages/config/contracts/fixtures/real-project-config.copy.json` plus its expected report (owned by phase 07, re-pinned here only if the tracked file changed since, with the new sha256 and commit). Live: `.fgos/config.yaml` (new), `.fgos/config.json` (tombstone), `.fgos/runtime/config-migrate/<rev16>-config.json` (git-ignored backup).

## Rehearsal (always, inside D)

1. In the linked worktree, copy the current tracked `.fgos/config.json` to a scratch project directory (with a scratch `.git` or a real `git worktree` so `trusted_main_root` resolves) and a scratch `HOME` holding a copy of the owner's global file with accounts removed.
2. `fgos config migrate --dry-run` (the dev host: `npm run fgos:dev -- config migrate --dry-run`): expect the report in phase 07 (counts; `gateway` dropped as equal to the standard, `lock.predecessorKillWaitMs` dropped as retired, `runner.$comment` converted, `machine_overrides` listed if the global copy differs, which needs `--accept-machine-overrides`); `fgos config migrate` for real **on the scratch copy**; `fgos config check` on it (no failure); `fgos config show --path runner.capabilities` on it equals the same path of the tracked file (Canonical JSON compared in a one-off script kept in scratch, not committed).
3. Run today's Node reader against the scratch tombstone (the phase 07 test does; here once by hand): both loaders throw naming the file.
4. Record the migrated file's size and the first twenty lines (comments included) in the board line so the owner sees what a migrated project looks like.

## Live run (where G-D1 puts it)

- Precondition: the Slice C readers are in the same change (or already landed), `fgos setup` and `fgos doctor` pass on the branch, every other worktree of this repository is merged or told (a worktree with its own uncommitted `.fgos/config.json` edits would conflict with the tombstone; `git worktree list` and `git status` per worktree).
- Commands: `fgos config migrate --dry-run`, review, `fgos config migrate [--accept-machine-overrides]`, `git diff --stat` (expect `.fgos/config.json` becomes the tombstone, `.fgos/config.yaml` added), `fgos config check`, `fgos doctor`, the repo's focused tests that read project config.
- Commit message names the report counts and the backup path; board line; tell the three other workspaces (forgentX, mdview, mcp-skill-hub) nothing: each migrates its own file by the same verb when its release is active, as separate items.
- **Rollback:** copy the backup over `.fgos/config.json`, delete `.fgos/config.yaml`, `git checkout` both if the commit was not pushed; the report prints the two commands.

## Owning proof

Phase 07 (`golden_migrate.rs` with the pinned real-file copy) and the tombstone test. This phase adds the live evidence only.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Every Node verb in this repository breaks the moment the tombstone lands without the readers | H x H | gate G-D1; never live before Slice C's readers |
| The tracked file changed since the pin (SEAT, MP-B1 and TEST edit it regularly) | M x M | re-pin before the rehearsal; the live run re-runs `--dry-run` |
| Other worktrees hold edits to `.fgos/config.json` | M x M | list them before the swap; migrate lands on main, they rebase |
| Machine overrides change this repository's effective values on the owner's machine | M x M | the report lists them; `--accept-machine-overrides` is the owner's explicit yes |

## Rollback

As above; nothing outside `.fgos/config.*` changes.
