# Phase 15: Machine rollout (stage 1 everywhere, stage 2 per machine on the owner's gate)

> **Split** (owner decision 2026-10-24 10:00, option B). Stage 1 (copy accounts and the token into `~/.fgos/private` with `fgos config migrate --global`, source kept) is available after Slice D. Stage 2 (remove the old keys, `--finish --machine-checked`, owner gate G-D3) waits for Slice C's readers landed and activated; its preconditions that name phases 12 to 14 now mean Slice C's.

Depends on 05, 08, 12, 13, 14 landed on main and activated. Suggested executor: haiku for the runbook text, the lead (sonnet) for the commands. Owner gate G-D3 per machine for stage 2.

## Context

Spec section 13: the token and account moves land when no release on the machine still reads those keys; on the main machine there is one release and one project (G2); the second machine is not checked. The readers (12-14) read only the new files, so a machine that activates this slice without the files has no accounts and no gateway token until stage 1 runs. This phase is the order of operations that makes the gap zero and keeps older releases working until the owner says otherwise. It writes one runbook (a report, like the earlier `plans/reports/guide-261017-1828-sync-a-machine-after-model-pool-and-rust-callers.md`) and performs the steps on machines the owner names; it changes no source.

## Files it may touch

A new guide under `plans/reports/` (name and path from `fgos convention name|path --json`, slug chosen distinct, for example `guide-<stamp>-config-machine-files-rollout`), board `log.md`, and per machine the files the verbs write (`~/.fgos/private/**`, a stage-2 backup).

## Runbook (per machine; every step prints paths and counts, never values)

1. **Before activating the release that contains phases 12-14**: `fgos doctor` on the old release (baseline); `ls -la ~/.fgos ~/.fgos/private` (the directory may not exist); note `~/.fgos/config.json.bak-*` files that hold accounts (the owner's machine has `~/.fgos/config.json.bak-20261021-llmaccounts`).
2. **Activate** the release (the board's landing rules; this slice stops no workspace by itself, but the readers change, so activation is by the owner's normal process; sequential across the three workspaces).
3. **Immediately after activation, stage 1:** `fgos config migrate --global --dry-run` (report: pool and account counts, token present yes/no), then `fgos config migrate --global`. This creates `~/.fgos/private/` (0700), writes `accounts.yaml` and `gateway-token` (0600), verifies equality, leaves `~/.fgos/config.json` untouched so any older release still works. If the gateway was running, `fgos gateway stop` then `fgos gateway start`.
4. **Verify:** `fgos config check` (no failure from the new rows; the wrong-file rows warn "held in both files"), `fgos doctor`, one dry bind (`fgos dispatch decide` and `fgos dispatch explain` show the accounts), one real lease on a cheap read-only unit, `fgos gateway status` reachable, and a confined probe run (`confinement-probe-freshness` re-probes once; `confinement-blind-read` passes). Record the outputs in the guide's evidence table.
5. **Stray secrets:** `fgos config check` lists `config-secret-outside-private` files; `fgos doctor --fix` moves them under `~/.fgos/private/` (create-only, then removes the source).
6. **Wait.** Run normally for the owner's chosen number of days. Stage 1 left both copies; doctor warns `config-key-in-wrong-file` (warn).
7. **Owner gate G-D3 (decision-question template, in the plan).** The owner confirms for that machine: every release and every project's activation (`~/.fgos`, each `.fgos/installation/activation.json`) contains this slice. Then: `fgos config migrate --global --finish --machine-checked --dry-run`, then without `--dry-run`. The verb backs the global JSON up to `~/.fgos/private/config-migrate/` (0600), removes only the moved keys and re-verifies. Doctor goes green.
8. **Rollback per machine:** restore the stage-2 backup over `~/.fgos/config.json` (`cp` of the printed file, mode 0600) and revert the readers' release; the machine files stay and are ignored by old releases.

## Order across machines

Main machine first (G2 done: one release, one project). The second machine: step 1-6 only until the owner has checked its releases; stage 2 there is a separate G-D3 answer. This repository's own `~/.fgos` (the owner's global file) is the main machine's.

## Steps for the executor

1. Write the guide from the runbook with the exact commands and a table for each machine: release id before and after, stage 1 report, check output (finding ids only), lease and gateway evidence, stage 2 date or "not yet".
2. Post the board line after each machine's stage 1 and stage 2.
3. Never run stage 2 without the recorded G-D3 answer for that machine.

## Owning proof

Live evidence on the machine (the table above); the crate proofs are phases 04, 05, 08. Nothing here duplicates them.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Activation without stage 1 breaks leases and the gateway for minutes | M x H | steps 2 and 3 are one sitting; errors name the verb |
| An older release exists on a machine nobody listed | L x H | stage 2 is gated; stage 1 is harmless |
| A person edits `config.json` accounts between the stages | L x M | doctor warns when the copies differ (destination wins, the notice says so); re-run stage 1 only after the owner decides which is right |
| Backup holds secrets | L x M | under `private/` at 0600; listed by `config-migrate-backup-stale` after 30 days |

## Rollback

As step 8. Before stage 2 there is nothing to roll back on the data side.
