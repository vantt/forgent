---
phase: 5
title: "Scheduled sweep: the mailbox timer becomes the one managed-timer door and gains the account-probe schedule"
status: pending
depends_on: [3]
parallel: "wave 3 with P04 (file-disjoint)"
branch: harden/acct-a-p05
---

# P05 - scheduled mode through one managed-timer door

Written for D3 (a), D4 (b), D5 (a). If HARDEN picks D3 (c), this phase shrinks to one how-to paragraph and the config key is not added; if D4 (a), the timer command drops `--leg direct`; if D5 (b), the key moves to a new section pair.

**Authority:** `fgos doctor` owns readiness rows and their safe fixes (`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` section 3); the timer only runs the existing verb.

## Context (verified on `9c8f5289b`)

- `src/setup/mailbox-sync-timer.mjs` (262 lines): `crossMachineSchedule(projectRoot)` reads config; `unitStem` hashes the project root (`fgos-mailbox-sync-<8 hex>`); `renderSystemd` / `renderLaunchd` write the unit text with `MARKER` (`'fgos-managed: mailbox-sync-timer'`); `schedulerFor({platform})` holds the `systemctl --user` / `launchctl` steps; `checkMailboxSyncTimer` / `fixMailboxSyncTimer` are registered at `src/setup/registrations.mjs:1859,1865`; `fixMailboxSyncTimer` is also called by `src/setup/uninstall-project.mjs:22`. Manifest: `docs/architecture-manifest.json:315` (`infra`).
- Tests: `test/setup/mailbox-sync-timer.test.mjs` (8 cases, `:22-103`); doctor id list `test/setup/checks.test.mjs:109`.
- Config: `core/config-standard/dispatch.yaml`, `core/config-schema/dispatch.schema.yaml` (two keys, `$comment: owner: run-supervisor`).
- AGENTS.md install/setup/doctor gate: this phase changes how fgOS is diagnosed, so the lead reads `docs/platform/packaging-distribution/vision.md` and `spec.md` first.

## Requirements

1. **One door.** Rename `src/setup/mailbox-sync-timer.mjs` -> `src/setup/managed-timer.mjs`. It takes a schedule descriptor `{name, marker, description, scheduleOf(projectRoot) -> {intervalSec, args} | null}`; render, scheduler, owned-unit check and fix are shared. Two descriptors: `mailbox-sync` (existing behaviour, unit names, marker string and ExecStart byte-identical) and `account-probe` (`fgos-account-probe-<8 hex>`, marker `fgos-managed: account-probe-timer`, ExecStart `<fgos bin> dispatch probe-account --all --record --leg direct --dir <projectRoot>`). Every importer moves in the same change (L10): `registrations.mjs`, `uninstall-project.mjs`, the manifest entry, the test file.
2. **Config key** (D5 (a)): `dispatch.probeAccount.intervalSec`, integer, minimum 0, default 0 (off), `x-fgos-scope: both`, in both core files; section `description`/`$comment` widened to name the account probe timer. No default registered anywhere else.
3. **Doctor.** One readiness row `account-probe-timer` and its fix, through the shared door: off and no unit -> pass; set and units missing/stale -> fail with "run fgos doctor --fix"; off and marked units present -> fail, fix removes only marked units. `uninstall-project.mjs` removes both schedules.
4. **Timer env** [first step, before code]: run `fgos dispatch probe-account --all --leg direct` once under `systemd-run --user --wait --pipe` (the env a user timer gets) on fg-server2 with no `--record`, and record in the lead report whether the direct leg needs anything the timer env lacks (PATH to the CLIs, `HOME`). If it does, the unit's `Environment=` line carries only what the probe's env allowlist reads (`provider-credential-probe.mjs:108`), never a secret.
5. **Docs.** `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` "Registered inventory" row; runner spec RUL79 bullet is P03's and is not edited here; one line in the docs of `fgos doctor`'s check list if the repo keeps one [lead: `git grep -n mailbox-sync-timer docs`].

## Files

- Rename+modify: `src/setup/mailbox-sync-timer.mjs` -> `src/setup/managed-timer.mjs`; `test/setup/mailbox-sync-timer.test.mjs` -> `test/setup/managed-timer.test.mjs`.
- Modify: `src/setup/registrations.mjs` (the two registrations only), `src/setup/uninstall-project.mjs`, `docs/architecture-manifest.json`, `core/config-standard/dispatch.yaml`, `core/config-schema/dispatch.schema.yaml`, `test/setup/checks.test.mjs` (id list), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`.

## Owning proofs and retirements

| Behaviour | Owner |
|---|---|
| mailbox timer unchanged | the 8 existing cases, moved with the file, assertions unchanged (a move, not a weakening) |
| account-probe schedule: units written/enabled when set, stale on interval change, removed when 0, unmarked unit never removed | parametrise the existing `doctor fails while the units are missing, the fix writes and enables them...` (`:43`) and `turning cross-machine mail off makes doctor name the leftover timer...` (`:83`) cases over both descriptors (no copy of the cases) |
| config key default/validation | the config standard/schema conformance test that already covers every key (candidate `test/config/facade.test.mjs`; lead confirms with `git grep -ln config-standard test`) |
| doctor id registered | `test/setup/checks.test.mjs:109` id list |

Retired: none (moved file keeps every case).

## Steps

1. Timer env check (req. 4). 2. Red: parametrised cases + id list. 3. Rename and generalise; move importers. 4. Config key. 5. Doctor row + uninstall. 6. Docs row. 7. Gate. 8. On fg-server2 with `intervalSec: 300` for one tick in the phase worktree's own config only, read one `probe` line in `audit.jsonl`, then set 0 and `--fix` removes the units; report both.

## Validation

`node scripts/run-tests.mjs test/setup/managed-timer.test.mjs test/setup/checks.test.mjs test/setup/uninstall-project.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs` plus the config conformance test found in the owning-proofs row; `node scripts/git-one-door-scan.mjs --root .`; `git diff --stat origin/main...HEAD` (expect a rename, not a delete+add of unrelated size).

## Risk / rollback

Risk: generalising breaks a live mailbox timer on a machine -> unit names, marker and ExecStart are byte-identical, checked by the unchanged cases; no re-`--fix` needed after upgrade. Risk: the probe timer runs while the owner is away and quarantines an account on a real quota stop -> that is its purpose (`--record`); a wrong quarantine is cleared by `fgos dispatch reconcile` clear-quarantine as today. Rollback: set `intervalSec: 0`, `fgos doctor --fix` (removes the probe units), then revert.
