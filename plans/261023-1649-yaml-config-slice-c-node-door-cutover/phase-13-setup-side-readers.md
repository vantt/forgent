# Phase 13: Setup-side readers outside `registrations.mjs`

Depends on 07 and 09. Suggested executor: sonnet; independent review against phase 00's table. Impact analysis on each edited exported function.

## Context

Doctor and setup modules read config on their own: `git-checks.mjs:22`, `run-supervisor-checks.mjs:334,431`, `agy-permissions.mjs:174`, `model-pool-checks.mjs:19,141,175`, `seat-binding-checks.mjs:23,69`, `blind-steps-proven-pools.mjs:98`, `executor-posture-coverage.mjs:27`, `agent-cli-trust.mjs:84`, `executor-profile-warnings.mjs`, plus `src/verbs/dispatch/inspect.mjs:34` and `reconcile.mjs:33,72` (global runner for provider capacity), and D's `config-checks.mjs`.

## Files it may touch

`src/setup/{git-checks,run-supervisor-checks,agy-permissions,model-pool-checks,seat-binding-checks,blind-steps-proven-pools,executor-posture-coverage,agent-cli-trust,executor-profile-warnings,config-checks}.mjs`, `src/verbs/dispatch/{inspect,reconcile}.mjs`, and their tests (phase 00 list).

## Design

- Each read becomes `readConfig`/`readMachineConfig`/`loadRunnerConfigForDir`. Doctor rows whose job is to **report on the file's health** must see refusals: they call the facade and turn a `ConfigDoorError` into a failed row with its ids (never `{}`), the opposite of `readSharedConfigOrEmpty`'s use.
- `inspect.mjs`/`reconcile.mjs`: `loadGlobalConfig(...)` as `runnerConfig` becomes `readMachineConfig({ sections: ['runner'] }).value.runner` (accounts layer included when unconfined).
- `model-pool-checks.mjs`: `readLlmAccounts(runnerConfig, { projectConfig })` loses the second argument (phase 10); the row at `:175-188` about global cells older releases cannot read stays only if a snapshot refusal does not already say it (phase 00 decides row by row; a retired row is named in the commit with the covering rule).
- `seat-binding-checks.mjs`: `checkSeatBindingConfig` (the `$comment` ladder row) and its `ladderCommentLines` import are deleted (C18); `checkSeatBindingDryBind` is unchanged apart from its loader.
- Checks that read the file's **own contents** and not the effective value (the seat-binding schema marker, `runner.patterns.seatBinding.schema`) use `origins` to ask whether the project layer holds the path; phase 00 lists them.
- `agy-permissions.mjs` keeps `mergeConfigDefaults` (its target is the agy settings file, not fgOS config) and reads the project config with the facade.

## Steps

1. Merge `origin/main`; edit; run each module's test through the launcher; then `test/setup test/verbs` sequentially after `free -g`.
2. `rg -n "readSharedConfig|readSharedConfigOrEmpty|loadGlobalConfig|mergeWithGlobalConfig|withMachineAccounts|machine-config" src/setup src/verbs --glob '*.mjs'` finds only `registrations.mjs` (phase 14).

## Owning proofs

Existing tests of each row, moved; the retired `$comment` row's behaviour is removed (its owner is now `config-doc-drift`, D).

## Risk / rollback

Risk: a row silently starts passing because the effective value hides what the file holds (L x M), covered by the `origins` rule and phase 00's list. Rollback: per-file commits; reverts with phase 18's deletion reverted.
