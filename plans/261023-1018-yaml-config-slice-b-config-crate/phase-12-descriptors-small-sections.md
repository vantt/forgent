# Phase 12: Descriptors for the thirteen small sections, `secrets` and `bin`

Depends on 04, 05, 06 (needs lint, check and scope to prove itself). Runs beside 09-11. Suggested executor: sonnet for the first pass; haiku may transcribe rows once the first file is accepted. Not blocked by the owner gate: nothing here is catalog content.

## Context

Spec section 4: the 15 (really 14, phase 00) `registerConfigDefault` calls become descriptors; the hand-written merge rules become descriptor fields. `runner` is phase 13. This phase authors the other 13 registered sections plus `secrets` and `bin`, which the spec's first-slice `global-only` list names (section 3 rule 4) but no registration backs, so they come from the specs (`docs/platform/secrets/spec.md` section 10 table for `secrets.declarations`, `secrets.globalFile`, `secrets.sources`; `src/setup/bin-discovery.mjs:121` for `bin.globalFgosPath`). Section `lock` gets no descriptor: its only key, `lock.predecessorKillWaitMs`, lost its reader in `a620881e7` (phase 00), so the file still holding it will see it reported as an undescribed key (a Slice D doctor warning) and Slice D's migration drops it.

## Files it may touch

`core/config-schema/{herdrOrchestrator,gateBypass,cleanup,invariantChecks,workerSlots,ironLaw,gateway,herdrWebDashboard,checkpoint,docRegistry,worktreeSetup,terminal,eventStore,secrets,bin}.yaml` (file name = the top-level key, as the config file spells it, e.g. `herdrOrchestrator.yaml`; lint rule `descriptor-path-outside-section` ties the file's `section` to its paths), `contracts/fixtures/registry-defaults.v1.json`, `tests/registry_defaults.rs`, appended list lines in `src/bundle.rs`.

## Rules for authoring

- Every entry: `path`, `type`, `doc` (one line: what the key does, values, standard value), `version: 1`, `owner` per file; `default` equal to what the section's reader assumes on absence (the registration shape and the Rust duplicates in `packages/herdr-fgos-common/rust/src/settings.rs`, `packages/work-state/rust/src/lib.rs`; the executor reads both and records equality in the commit message; a mismatch between Node and Rust defaults is raised as an item, not silently chosen).
- `owner` names a component or area spec from `docs/platform/component-boundary.md` or `docs/specs/*.md`; no new component names.
- Entries that carry `sensitivity: command` (`invariantChecks.commands`, `worktreeSetup.commands`): `scope: both` with a `justification` ("read from the trusted main checkout, spec section 5 rule 6; each project states its own checks"), standard value `[]` (the `invariantChecks` default is already empty: `src/config/shared-config-file.mjs:60`).
- `gateway`: the section entry carries `scope: global-only` (children inherit, D20); `gateway.port` default `DEFAULT_GATEWAY_PORT` (re-read the Rust and Node constants); `gateway.token`: `file: token`, `sensitivity: secret-value`, `scope: global-only`, no default, `absent: off`, `doc` says it moves to `~/.fgos/private/gateway-token`. Other `gateway.*` keys the Rust reader takes (`apps/fgos-gateway/src/gateway.rs:143` area) are listed from the code, not guessed.
- `secrets.globalFile`, `secrets.sources`, `secrets.declarations.<any>.consumers`: `scope: global-only` (rule 4); `secrets.declarations` itself `scope` per the secrets spec (names only, committable) with `secrets.declarations.<any>.consumers` global-only as rule 4 says; none has a standard value except `secrets.sources` (`["file"]`).
- `bin.globalFgosPath`: `scope: global-only`, `absent: off`, `doc` notes spec section 8 moves the cache out of config (Slice D).
- `workerSlots.ceiling` and `terminal.retainFailedPaneMs` have standard value `null` (a present null is a value, `default: null`); `terminal.*` descriptors rely on the primitive's default deep merge, which reproduces `sectionOf` in `src/terminal-control/config.mjs:40` (project beats global beats default; null counts as set).

## Mapping of the hand-written rules named in spec section 4 (one row each; the runner rows land in phase 13)

| Rule today | Where | Becomes | Phase |
|---|---|---|---|
| `sectionOf` project/global/default per key | `src/terminal-control/config.mjs:40,58-59` (the other two copies the spec names no longer exist, phase 00) | the default deep merge on the `terminal` descriptor | 12 |
| fill-missing-only merge, arrays are leaves | `src/setup/config-merge.mjs`, `mergeWithGlobalConfig` (`src/config/global-config.mjs:64`) | the merge primitive's defaults (deep maps, leaf lists); no field | 12 |
| gateway read only from the global file | `apps/fgos-gateway/src/gateway.rs:143`, `src/runner/gateway-control.mjs` | `scope: global-only` on `gateway` | 12 |
| account inventory is global-only | `rejectProjectProviderAccountInventory`, `src/runner/dispatch/provider-capacity.mjs:54`; `runner.llmAccounts` | `file: accounts`, `scope: global-only` on `runner.providers.<any>.accounts` and `runner.llmAccounts` | 13 |
| seat-binding keys refused in the global file | `refuseGlobalSeatBindingKeys`, keys `tier, maxTier, roles, personas, seats` (`src/runner/dispatch/config.mjs:288`) | `scope: project-only` on those keys under `runner.capabilities.<any>` | 13 |
| drop `runner.rigorToTier` from the global file | `src/runner/dispatch/config.mjs:366` | nothing (D10, transitional; owner removes the key) | - |
| drop stale tier keys and extended cells from the global file | same function | nothing (deleted by SEAT-TRIM follow-up A, D10) | - |

## Steps

1. Merge `origin/main`. Write `terminal.yaml` and `gateway.yaml` first (they exercise `<any>`-free nesting, `null` defaults and `global-only`); run lint; then the rest.
2. Dump the registry's assembled defaults once, from a scratch script (`.fgos/runtime/tmp/dump-registry-defaults.mjs`, not committed): import `CONFIG_DEFAULT_REGISTRATIONS` from `src/setup/registrations.mjs`, print `{ [key]: shape }` as JSON. Commit the result as `contracts/fixtures/registry-defaults.v1.json` with fields `source` (file and commit), `how` (the command), `defaults`, `known-differences` (path, registry value, standard value, reason: e.g. `gateway.token` leaves for the token file; `runner` is phase 13's), `descriptor-only` (`secrets`, `bin`).
3. `tests/registry_defaults.rs`: the standard (phase 05) restricted to the 13 sections equals `defaults` minus `known-differences`, path by path; every `known-differences` row names a path that still differs (a stale row fails); the first-slice `global-only` list from `scope.v1.json` (phase 06) is present and `global-only` in the bundled set (phase 06's risk row). It does not test the registry itself (that is the registry's own test, `test/setup/registrations.test.mjs`).
4. Lint on the bundled set must be clean (phase 04's standing test).
5. Re-run `rg -n "registerConfigDefault\(" src/setup/registrations.mjs` and confirm the set of keys equals the descriptor sections plus `runner` (14).

## Owning proofs

| Behaviour | Proof |
|---|---|
| The standard equals what setup seeds today, except named differences | `tests/registry_defaults.rs` over `registry-defaults.v1.json` |
| The descriptors are legal | phase 04's `bundled_set_is_clean` |
| The first-slice global-only paths are global-only | `tests/registry_defaults.rs` reading `scope.v1.json` (the list lives once, in phase 06's fixture) |

## Validation

`cargo test -p fgos-config --test registry_defaults --test golden_lint --test golden_descriptor --jobs 4`, clippy, fmt.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Node and Rust defaults for one key disagree (`herdrOrchestrator`, `gateBypass` are duplicated across languages, inventory section 4) | M x L | executor reads both, records the result; a disagreement becomes a separate item (RUL11), the descriptor takes the Node registry value because it is what files get seeded with today |
| A section exists in the file but nowhere in the registry (`lock`) | L x L | stated above; undescribed keys are kept and reported, not refused |
| `gateway.*` key list incomplete | M x M | read `gateway.rs` fully for `gateway.` accesses; an unlisted key is merely undescribed (kept) but would escape the section's global-only scope only if it sat outside `gateway.` (it cannot) |
| Wrong `owner` name | L x L | cosmetic; `descriptor-owner-inconsistent` guards consistency only |

## Rollback

Revert: new files plus appended list lines.
