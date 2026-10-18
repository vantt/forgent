# Phase 07: verbs, setup, doctor, config

- **Depends on:** phase 06 merged. Phase 08 starts only after this phase merges (it edits `src/setup/event-store-checks.mjs`). M5 (Git read facts for refspecs, the Git floor and `fgos.machineId`) settled before step 3.
- **Branch / worktree:** `es/p07-verbs`, `.claude/worktrees/es-p07`.
- **Model / effort:** sonnet (advanced), rigor high; 24h.
- **Blocks:** phase 08.

## Context

- Spec §15 (verbs table, `fgos rebuild` stays the one door), §16 (doctor thresholds), §18 (export legacy-layout for rollback), §21 (four config keys, git config, three setup fixes, ten doctor checks, CHANGELOG), §22 (orphan branch streams).
- Setup/doctor doors: `registerConfigDefault` (`src/setup/registrations.mjs:193`), `registerCheck` (`:172`), `registerFix`; Git's `git-component-compatible`, `git-publication-refspecs` and Git floor (Git D3, M5).
- Verb plumbing: `src/cli/command-registry.mjs` (rebuild at `:1405`), `packages/host-runtime/contracts/command-routes.json` (`rebuild` at `:641`), `test/rust-host/vectors/envelope/version.json`.
- D8: every registration line (verb rows, routes, config defaults, fixes, checks) is added by phase 09's cutover change, not here.

## Requirements

1. **`fgos events sync [--remote <name>] [--no-push] [--json]`**: facade `sync`, waits for `event-seal`; prints tips, ahead/behind, error.
2. **`fgos events status [--json]`**: every field of the §15 row, including deferred events with missing (`origin`, `stream`, `seq`), orphan branch streams, refspec missing, guarantee level, last receipt, last fetch and push.
3. **`fgos events export [--stream <s>] [--since <cursor>] [--format jsonl|legacy-layout] --out <dir>`**: `jsonl` writes canonical order; `legacy-layout` writes the legacy files byte for byte from `refs/fgos/legacy` (only at the OID pinned by D18) into a freshly created `--out` (exclusive create, no symlink follow), accepting only tree entries `events.jsonl`, `events/<[A-Za-z0-9._-]+>.jsonl`, `porting/**/events.jsonl` at their recorded paths and `seal.json`, mode `100644`; v4 events as one file per stream with legacy field names (markers dropped), runs the legacy-fold port and writes a parity report listing every entity whose view differs from the v4 view.
4. **Legacy order for export:** the Rust port of phase 01 (the only legacy-order door) orders the exported events; Node only applies `foldEvents` (`src/state/replay.mjs:82`) to that output; the report compares it with the v4 view.
5. **`fgos rebuild` store part:** drops every registered consumer cache (phase 06 registry) and refolds through the store; keeps today's verb name and output envelope.
6. **Config default (one `registerConfigDefault`, `src/setup/registrations.mjs:193`; `assembleRegistryDefaults` keeps one shape per key, `:250-256`):** `registerConfigDefault({id: 'eventStore', key: 'eventStore', shape: {seal: {intervalSec: 300}, sync: {intervalSec: 300}, rebuild: {maxAttempts: 5}, remote: 'origin'}})`, project over global. Validation happens where the facade reads config (integers ≥ 0, seal interval ≥ 1, remote a valid remote name); a test asserts the merged default shape.
7. **Setup fixes:** `event-store-machine-id` (mint `<stateRoot>/machine-id` as `<hostname-slug>-<6 random base32>`, written once); `event-store-refspec` (when the configured remote exists and refspecs are missing, call the crate's `ensure_refspecs`; never a push refspec; records the remote URL in repository-local git config for D20); `event-store-lock-dirs` (`<eventOpenRoot>/locks` mode 0700).
8. **Doctor check bodies** in `src/setup/event-store-checks.mjs`: `event-store-git-version` (reads Git's floor result, no second probe), `event-store-open-root`, `event-store-machine-id` (+ `event-store-machine-ref-shared` warning), `event-store-refspec` (reads Git's refspec fact; fails on a push refspec or a refspec matching `local-events`/`branch-events`), `event-store-unsealed` (warn above 2 × interval, fail above 3600 s), `event-store-integrity`, `event-store-sync` (warn on failed push or > 24 h), `event-store-native-addon` (facade exports present; points to `git-component-compatible` for ABI, D3), `event-store-legacy-layout` (body in phase 08), `event-store-orphan-branches`. All read-only.
9. **CHANGELOG text** drafted in the phase report (the entry is written by phase 09 with the registrations).

## Files

| Action | File |
|---|---|
| create | `src/verbs/events/{sync,status,export}.mjs` (location follows `src/verbs/*` convention), `src/setup/event-store-checks.mjs`, `src/setup/event-store-fixes.mjs` |
| create | `test/event-store/verbs.test.mjs`, `test/event-store/export-legacy-parity.test.mjs`, `test/setup/event-store-checks.test.mjs`, `test/setup/event-store-fixes.test.mjs` |

## Steps

1. Verb modules over the facade; JSON envelopes.
2. Export both formats; legacy parity report on fixtures with v4 events (§23.2 item 7 part).
3. Settle M5; check bodies and fixes with a vector each (pass, warn, fail).
4. Rebuild store part (callable function; the verb row switches in phase 09).
5. Opus review; merge (dormant: nothing registered).

## Validation

```bash
node --test test/event-store/verbs.test.mjs test/event-store/export-legacy-parity.test.mjs test/setup/event-store-checks.test.mjs test/setup/event-store-fixes.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p07 build> npm test
```

Vectors (§23.2 item 13 part): export refuses a legacy tree with a `..`, symlink or gitlink entry and an existing `--out`; every check has pass, warn and fail cases on real temporary repositories; every fix is idempotent and never writes a push refspec; `event-store-unsealed` thresholds at 599 s, 601 s, 3601 s with interval 300.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Two refspec checks disagree (Git and Event Store) | Medium × Low | Event Store reads Git's fact (M5); a test asserts both verdicts match on the same fixtures. |
| Machine id minted twice on one state root | Low × Medium | Written once with exclusive create; a second mint reads the existing file. |

## Rollback

Dormant: revert the merge.
