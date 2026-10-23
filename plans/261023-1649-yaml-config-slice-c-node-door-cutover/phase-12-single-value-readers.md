# Phase 12: State and runner single-value readers

Depends on 07 and 09. Suggested executor: sonnet; independent sonnet review of the outcome table application. Shared files: `src/runner/claim-port.mjs`, `merge.mjs`, `worktree.mjs` (board rows: 4.3 lanes, GIT G4); post first. Impact analysis on each reader function before editing.

## Context

These readers take one value from one section and used to read the project file alone, or the project file merged with the global one by hand (`mergeWithGlobalConfig`, `sectionOf(project)` then `sectionOf(global)`), or the file by their own path (bypass readers 1 to 3 of the spec's seven plus the gateway port). Each moves onto `readConfig({ projectRoot, sections: [...] })`. The outcome of a refusal follows phase 00's table (C7): propagate, except the readers whose own header documents a fail-closed value that cannot widen anything.

## Files it may touch

| Reader | Section | Change |
|---|---|---|
| `src/state/gate-bypass.mjs:57` | `gateBypass` | `readConfig` with `origins: ['gateBypass.level']`; when the level's layer is `standard` fall through to the legacy `.fgos/gate-bypass.json` exactly as today (**C8**); keeps `off` on any refusal (its header: "never throws", fail-closed) |
| `src/verbs/merge/iron-law-level.mjs:20` | `ironLaw` | propagate |
| `src/runner/claim-port.mjs:163`, `src/runner/loop.mjs:1382,1633` | `workerSlots.ceiling` | propagate in the loop; claim-port keeps the outcome phase 00 records |
| `src/runner/merge.mjs:940,970` (`readInvariantCheckCommands`) and `src/runner/worktree.mjs:143` (`readWorktreeSetupCommands`) | `invariantChecks`, `worktreeSetup` | the facade returns the `command` list; the **trusted root rule** applies (these are `command` values): a caller that passes a linked worktree's root still gets the main checkout's commands (acceptance 13) |
| `src/state/events-compaction.mjs:170`, `src/state/events-jsonl-truncation-guard.mjs:467` | `checkpoint` | bypass readers; documented unset on refusal (opportunistic guards, widening nothing); no more direct file read |
| `src/runner/gateway-control.mjs:155` | `gateway` | `readMachineConfig({ sections: ['gateway'] })`, port only; documented 4170 on refusal ("never re-guessed", `:152`) |
| `src/event-store/config.mjs:25` | `eventStore` | replaces `eventStoreConfig(mergeWithGlobalConfig(readSharedConfig(root), globalConfigPath))`; note the reader configures the event-store addon, and the config read now goes through the same combined addon, so the door is loaded first by this call (one load, no cycle: `src/event-store/native.mjs` uses the same door) |
| `src/terminal-control/config.mjs:58-59` | `terminal` | one `readConfig` replaces the `sectionOf(project)` / `sectionOf(global)` hand merge (the last `sectionOf` copy named in B's D4 note) |
| `src/run-supervisor/gate-kill-grace.mjs:47,85` | per phase 00 | one `readConfig` replaces `mergeWithGlobalConfig(readSharedConfigOrEmpty(projectRoot))` |

Tests: each module's existing test, moved (phase 00 list), plus `test/runner/worktree-config-trust.test.mjs` (new).

## Design

- No reader keeps its own parse, merge or "does the file exist" logic. Each replaces its read with one call and keeps everything after it.
- `readInvariantCheckCommands` and `readWorktreeSetupCommands` (defined in `shared-config-file.mjs`, deleted in phase 18) become small functions in the facade or in their callers; the filtering of non-string commands disappears because the schema (items are non-empty strings) refuses a malformed list: **behaviour removed**, stated in the commit message with the owning test of the refusal.
- The `DEFAULT_INVARIANT_CHECK_COMMANDS` and `DEFAULT_WORKTREE_SETUP_COMMANDS` constants (exported, used by `registrations.mjs` defaults and `test/setup/helpers/setup-checks-harness.mjs:31`) go with the registered defaults (phase 14).

## Steps

1. Merge `origin/main`; for each reader: `impact`, then edit, then run its test through the launcher.
2. `test/runner/worktree-config-trust.test.mjs`: a real linked worktree (the git fixture helper) whose own `.fgos/config.yaml` sets `invariantChecks.commands` and `worktreeSetup.commands` to something else: `merge.mjs`' reader and `worktree.mjs`' reader still return the **main checkout's** commands; a non-repository directory returns its own. This is the wiring proof of acceptance 13; the rule's owner is B's `golden_snapshot.rs`.
3. One added case in `test/state/gate-bypass.test.mjs`: a project with no `gateBypass` and a legacy `{ "level": "standard" }` file reads `standard`; with the level set in the project file the legacy file is ignored.
4. `rg -n "readSharedConfig|readSharedConfigOrEmpty|loadGlobalConfig|mergeWithGlobalConfig" <files of this phase>` finds nothing; run `node --test` over `test/state test/runner test/event-store test/terminal-control test/run-supervisor test/verbs` sequentially after `free -g`.

## Owning proofs

Each reader's value and default: its existing test. Trust rule at the Node boundary: the new worktree test. Legacy fallback: the added gate-bypass case.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A hook-path reader (`events-jsonl-truncation-guard`) now loads the addon and is slower or fails in a bare checkout | M x M | keeps its documented unset outcome on a door failure; cost measured in 08 |
| `gateBypass` legacy fallback missed in the Rust twin | M x M | phase 16 applies the same rule in `work-state`; both cases name each other |
| Event-store config read before the addon is loadable | L x M | named door error, same as every addon consumer |

## Rollback

Per-reader commits; reverts restore the old read. Valid together with phase 18's deletion being reverted.
