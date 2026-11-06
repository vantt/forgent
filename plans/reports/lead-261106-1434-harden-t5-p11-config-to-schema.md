# HARDEN T5 phase 11: runner config type rules move to the schema

Branch `harden/t5-p11` (from origin/main `e73b49aef`), worktree `/home/vantt/projects/forgent-worktrees/harden-t5-p11`. Phase file: `plans/261106-0950-harden-t5-execution-core/phase-11-config-to-schema.md`. Not pushed. No red row from the red-proofs branch belongs to this phase, so there is no red-then-green pair; the proof is below.

## What changed

- `core/config-schema/runner.schema.yaml` now states every type, enum, range, required and unknown-key rule that `src/runner/dispatch/config.mjs` used to repeat (list below). The P04 `tighten` merge value and `confinementPolicies` global-only stay as they were.
- `src/runner/dispatch/config.mjs` 2 084 -> 861 lines. `validateRunnerConfigShape` (exported) now holds only rules that compare two fields or a field with a catalog or registry. `loadRunnerConfig` is deleted; `loadRunnerConfigForDir` is the one loader. The re-exports of the confinement modules (no production importer) are deleted. `CHECKER_SEATS`, `VALID_CHECKER_SEATS`, `EXECUTOR_KINDS`, `INVOCATION_VIA`, the seat-binding version constants and the orphaned doc-comment fragment are deleted.
- `src/runner/dispatch.mjs` (68 lines, 40 re-exports) is now a 10-line entry for `node src/runner/dispatch.mjs decide|probe-account|reconcile` and re-exports nothing. See Deviations.
- Callers moved: `bin/fgos-runner.mjs` (config.mjs), `scripts/dispatch-decide-hook.mjs` and `bin/fgos.mjs` dynamic import (dispatch/cli.mjs), `resolve.mjs` (`normalizePreferCandidates` takes no label, it only normalizes), five test importers of the barrel, `seat-resolver.test.mjs` (CHECKER_SEATS from the seat resolver).
- Doctor: `registrations.mjs` `capability-serves-valid` keeps only the tied-attribute-set condition, the `runner-generated-paths` comment is updated; other rows are untouched (table below).
- New proof of every schema rule: `packages/config/rust/tests/golden_validate.rs` `runner_schema_refuses_the_shapes_node_no_longer_checks` (80 cases over the bundled runner schema, accept cases included; reports all mismatches at once). New Node proof that the lists the schema and the code both hold are equal: `test/runner/runner-schema-vocabulary.test.mjs` (3 tests).
- Docs: `docs/platform/config/spec.md` (section owner bullet), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (`capability-serves-valid` row), `CHANGELOG.md` `[Unreleased]`.

## Census before land (read-only, this machine)

`npm run -s fgos:dev -- config check --json` with the host built from this branch, against this checkout's project config and this machine's global config and accounts file: `ok: true`, **0 errors** (0 `fail` rows; 43 `config-comment-migrated-why` and 1 `config-redundant-value` warnings, identical to the run on the unmodified tree). No `config-doc-drift`: I kept every existing schema `description` that is copied into config comments unchanged, except `invocation` (no committed or global file carries a comment on it; verified by the same run). The owner machine and the third workspace still need the same read-only run with the old release (guide step).

## Net size

| | Phase estimate | Measured |
|---|---|---|
| Node (`src`, `bin`, `scripts`) | -600 to -1 000 | **-1 295** (+244 / -1 539) |
| Rust production | 0 | 0 |
| Tests (Node + Rust test code) | -200 | **-1 775**: Node tests -1 878 (+389 / -2 318 in changed files, +51 in the new vocabulary file), Rust test code +103 |
| Schema YAML (not counted) | about +100 | +173 / -134 |

Budgets: `config.mjs` 861 (<= 1 300). Dispatch outside `confinement/` was 20 041 at plan time; this phase takes about 1 280 off it.

The Node and test deletions are larger than the phase estimate because the schema already stated nearly every rule (`required` on `modelPolicies` and `timeoutMs` is unreachable since the standard always supplies both; every shape validator was a second copy), so the whole of `validateExecutorShape`, `validateExecutorEntryShape`, `validateInvocationShape`, `validateInteractiveModeShape`, `validateExecutionProfileShape`, `validateCapabilitiesShape`, `validateSeatTasteMap`, `validateModelPoliciesShape`, `validateTierFallbackShape`, `validateRunnerDefaultsShape`, `validateExecutorIdentityShape`, `validateExecutorSupportsShape`, `validateCapabilityServesShape`, `validateTierName` and the type half of the patterns, loops and generated-paths validators are gone.

## Table 1: Node checks removed, and the schema path that now refuses each

Every row is also a case in `RUNNER_CASES` (golden_validate.rs) under the title in the last column.

| Node check (function in the old file) | Schema path that now refuses it | Case title |
|---|---|---|
| `validateExecutorShape`: command non-empty string, args array of strings, env map, adapter in registry | `runner.executor` and `$defs.executorEntry` and `$defs.invocation`: `command` `pattern \S`, `args`, `$defs.envMap` (`propertyNames` non-empty, string values), `$defs.adapterName` enum | default executor adapter; executor adapter; executor command is not blank; executor env names/values |
| `validateExecutorEntryShape`: kind enum, command-without-args, model/agentType/providerModel strings, allowCrossProvider and forceCliSpawn booleans, `for` non-empty array, carries enum | `$defs.executorEntry`: `kind` enum, `dependentRequired` command<->args, property types, `for` `minItems`, `carries` enum | executor kind; executor command comes with args; for lists; carries |
| `validateExecutionProfileShape` shape half: permissionMode and promptDelivery enums, confinement object, flags booleans, backend string, unknown confinement key | `$defs.executorEntry` and `$defs.invocation` enums; new `$defs.launchConfinement` (`additionalProperties: false`, flags boolean, `backend` `\S`) shared by executor and invocation | permission mode; prompt delivery; confinement keys; confinement flags; invocation confinement |
| `validateInvocationShape`: id string, `via` enum (`api` refused), cli needs command and args, mcp needs command, tools values, promptDelivery, liveOutput streamFlags and renderer | `$defs.invocation`: `id`, `via` enum `[cli, task, mcp]` (the `api` value and `url` removed), `allOf` if/then `required`, `tools` values, `liveOutput.required` | invocation via; cli invocation names command and args; mcp invocation names its identifier; task invocation; invocation id; mcp tools; live output |
| `validateInteractiveModeShape`: exitCommand, kind lowercase name, trustStore null or known kind, path | new `$defs.interactiveMode` (`exitCommand` required `\S`, `kind` pattern, `trustStore` enum or null, `path`), used by executor and invocation | interactive mode (4 cases) |
| `validateExecutorIdentityShape`, `validateExecutorSupportsShape` | `$defs.executorEntry.identity` (4 required), `supports` (`minItems`, effort enum, boolean, `\S`) | identity; supports (3 cases) |
| `validateCapabilitiesShape`: entry object, description, aliases, prefer, rigor enum, persona, minCheckers enum, verify, tier and maxTier, roles keys, entry unknown keys | `$defs.capability`: property types, `rigor` and `minCheckers` enums, `tierName`, `roles.additionalProperties: false`, `additionalProperties: false` on the entry | capability (9 cases) |
| `validateCapabilityServesShape` (also its doctor use) | `$defs.capability.serves`: `additionalProperties: false`, scalar or list, `minItems 1`, `\S` strings, boolean items | serves (5 cases) |
| `validateSeatTasteMap` shape half: entry is an object, only tier and prefer, tier name | `$defs.seatTaste` `additionalProperties: false`, `tierName` | seat taste keys |
| `normalizePreferCandidates`: string or array, non-empty, entry keys executor/invocation/crossProvider | `$defs.preferList`: `minItems 1`, `\S`, item `additionalProperties: false`, `executor` required | prefer (3 cases) |
| `validateModelPoliciesShape` and `parseTierCell` as a load check | `modelPolicies` tier map `additionalProperties: false`; `$defs.tierCell` (already `oneOf`) | model policy tiers; model policy cell (2 cases) |
| `validateTierFallbackShape` | `tierFallback` `additionalProperties: false`, `minItems`, `uniqueItems`, `\S` | tier fallback (2 cases) |
| `validateRunnerDefaultsShape`, `maxTier` | `defaults` `additionalProperties: false`, tier enum; `maxTier` enum | defaults; max tier |
| `timeoutMs` positive and ceiling, `idleTimeoutMs`, `parallel.*` positive integers, `required` of `timeoutMs` and `modelPolicies` | `timeoutMs` `exclusiveMinimum`, `maximum` 14 400 000; `idleTimeoutMs`; `parallel` `minimum: 1`; `required` is unreachable (the standard supplies both) | run timeout (3); idle timeout; parallel limits |
| `validateRunnerConfigShape` confinement object, unknown key, boolean `strict` | `confinement` `additionalProperties: false` (the item the phase named), `strict` boolean (P04's `tighten` kept) | runner confinement |
| `validateRunnerPatternsShape` type half: seatBinding marker, entry keys, promise, loop enum, defaults keys and types, roleTasks, invariants one-of and keys | `patterns.seatBinding` `additionalProperties: false`, `$defs.patternEntry` (already closed) with `defaults.additionalProperties: false`, `\S` strings; `patternInvariant` `oneOf` | seat binding marker; pattern (9 cases) |
| `validateRunnerLoopsShape` type half: loop names, maxRounds, checkers and rigor keys, bounds shape | `loops` closed (existing), `checkersByRigor.additionalProperties: false`, `loopBounds` | loop names; reviewed rounds; reviewed checkers; loop bounds |
| `validateGeneratedPathsShape` type half: array, entry object, unknown key, `also` non-empty | `generatedPaths` `items.additionalProperties: false`, `required`, `minItems` | generated path (3 cases) |
| Retired capability keys `overrides` and `unconfined` (refusal that named the replacement) | refused as an unknown key at the capability entry; the replacement is written in the node's `$comment` | capability keys |

## Table 2: Node checks kept, and why each is cross-field

| Kept check | Why it stays |
|---|---|
| `for` entries and mcp `tools` keys exist in `capabilities` | field against a catalog built from another section of the same config |
| `prefer` names a registered executor and, when pinned, a declared invocation id | field against the executor registry |
| invocation `id` unique within an executor | uniqueness by a property: JSON Schema `uniqueItems` compares whole items |
| `permissionMode: bypass` needs the three confinement flags (read from flags or `controls`) | two fields of one executor, with `controls` as an alternative spelling |
| `credentialStore` needs a confinement backend on the invocation or its executor | invocation field against executor field; also `credentialStoreProblem` stays (shared with the account inventory, in `provider-capacity.mjs`, not this phase's file) |
| removed executor fields (`receipt`, `trustStore`, `readOnlyRedirect`, the old rigor map) and removed runner keys (`models`, `rigorToTier`, `readOnlyExecutorRedirects`, `placementPolicy`) | the executor entry and the runner root accept unknown keys, so only a named refusal can say what replaced them |
| personas keys are agent names, seats keys are seat ids | Convention owns the rule (`definitionFileName`, `isSeatId`); copying it into a schema pattern would make two authorities |
| `validateProviderAccountInventory` | account inventory rules live in `provider-capacity.mjs` |
| `validateRunnerPatternsShape`: retired pattern keys and their replacements, reserved names, `checkDeclaredSeats` | retired-key table and seat rules are Seat Resolver's |
| `validateRunnerLoopsShape`: bounds name a parameter the loop reads, `min <= max`, checkers cumulative across rigors | loop parameter registry; two fields; ordered rigors |
| `validateGeneratedPathsShape`: `from` opens with a literal directory, every entry is a write-scope entry | write-scope grammar is `write-scope.mjs`'s |
| `rejectProjectBackendOverride`, confinement policies: no redefining a built-in, policy shape, mode `required` or strict naming an existing policy, strict needs every capability to declare confinement | field against the policy registry; two fields |
| `warnIfProviderFamilyUnreliable`, `parseRunTimeout`, `assertRunTimeoutMs`, `resolveOriginLocations`, `checkDoorRefusalsForRetiredKeys`, `normalizeConfigConfinement`, `refuseGlobalRigorToTier`, `dropGlobalExtendedTierCells` | warning, parsing, provenance and layer logic, not shape |

## Doctor rows (gate 8)

| Row | Condition before | Now |
|---|---|---|
| `runner-generated-paths` | shape (type, unknown key, `also` non-empty) and literal-directory and write-scope rules | shape is the config door's (`config-schema` finding of `fgos config check` and every config read); the row keeps the literal-directory and write-scope rules |
| `runner-patterns-config` | shape of loops, retired keys, bounds, cumulative checkers, catalog | shape of loops moves to the schema; the row keeps retired keys, bounds, cumulative checkers, catalog and warnings |
| `executor-family-unique`, `tier-fallback`, `model-policy-pools` | loaded the runner config through the loader, so a shape error read "not loadable, not evaluated"; their own conditions are cross-field (family per executor, fallback against cells and executors, pools against `llmAccounts`) | unchanged; a shape error still reads "not loadable" and the door names it |
| `capability-serves-valid` (not in the phase's list; `registrations.mjs:2348`) | `serves` shape and no two identical sets | shape is the schema's; the row keeps the identical-set condition. Row id unchanged; description and the how-to line updated |

No row went; no id changed.

## Tests retired, and their owner

All shape cases that went through `loadRunnerConfig` or a deleted validator are owned by the schema cases in `golden_validate.rs` (`RUNNER_CASES`, titles in table 1). The one Node wiring case that a schema refusal reaches the caller of `loadRunnerConfigForDir` by name, with code, file, line, column and path: `test/runner/dispatch-config-patterns.test.mjs` "a schema refusal reaches the caller with its code, file, line and path, and other door codes pass through unchanged". Vocabulary equality: `runner-schema-vocabulary.test.mjs`. Cross-field cases stay in their files and now call `validateRunnerConfigShape` with an object. Duplicates removed under "one proof": the provider-family warning case in `dispatch-governance-operability.test.mjs` (owned by the six warning cases in `dispatch.test.mjs`), the retired-`models` case and the `rigorOverrides` value case in `dispatch.test.mjs` (owned by `dead-vocabulary-guard.test.mjs`). Rewritten in place (counted below as removed, same assertion): the cumulative-checker, bounds, generated-paths, serves-free doctrine, executor-profile and tier-fallback cases.

Appendix: titles removed or renamed by this change (about 95 retired outright, the rest rewritten under a new title):

### test/runner/credential-store.test.mjs (2)
- the config door accepts a store on a confined cli invocation, whichever level names the backend
- the config door refuses a malformed store and a store on an invocation with no confinement backend
### test/runner/dead-vocabulary-guard.test.mjs (1)
- dead vocabulary guard: capabilities.<cap>.rigor is a demand that moves no tier, and capabilities.*.overrides is rejected (D19)
### test/runner/dispatch-config-patterns.test.mjs (8)
- validateCapabilitiesShape: allows taste fields persona, minCheckers, verify
- validateCapabilitiesShape: rejects invalid persona, minCheckers, verify
- validateRunnerPatternsShape: validates catalog entry structure and invariants
- validateRunnerLoopsShape: validates loop tuning and cumulative checkers across rigors
- bounds validity at load: min > max, non-integer, bound on an unread param
- loadRunnerConfigForDir: other ConfigDoorError codes pass through unchanged
- runner.generatedPaths: well-formed {from, also} entries load
- runner.generatedPaths: malformed entries are refused at load
### test/runner/dispatch-confinement-policies.test.mjs (1)
- M1/M2: Capability rejects boolean unconfined syntax in favor of mode: unconfined
### test/runner/dispatch-executor-profile.test.mjs (22)
- A3: an executor declaring none of the new fields still loads unchanged
- A1: the declared profile survives the load intact
- C5: bypass with full confinement loads
- C5: ask mode needs no confinement -- the invariant constrains bypass only
- A1: an unknown permissionMode is refused rather than passed through
- A1: confinement flags must be booleans, not truthy strings
- A1: an unknown promptDelivery value is refused, and a removed field is named rather than ignored
- Phase C: an executor declaring neither identity nor supports still loads unchanged (regression guard)
- Phase C: a full identity + supports block survives the load intact
- Phase C: identity is all-or-nothing -- each of the four fields is refused by name when missing
- Phase C: identity fields must be non-empty strings, not just present
- Phase C: supports fields are each independently optional -- a partial declaration loads
- Phase C: supports.reasoningEffort must be entries from REASONING_EFFORT_VALUES, not free strings
- Phase C: supports.providerFamilies must be a non-empty array of non-empty strings
- Phase C: supports.systemPrompt must be a boolean, not a truthy string
- supports.skills is a non-empty array of skill names, kept as declared
- Phase C: supports.toolGating must be a non-empty string
- Phase D: the retired top-level "readOnlyExecutorRedirects" field is refused at load, by name
- Phase D: a config declaring no placementPolicy at all still loads unchanged (regression guard)
- Phase D: placementPolicy and readOnlyRedirects are retired and rejected at load
- Step 2.1: an invocation "id" must be a non-empty string when present
- Step 2.1: invocations without an "id" still load fine (id is optional)
### test/runner/dispatch-governance-operability.test.mjs (1)
- provider-family warning suppresses for all-non-CLI and warns for bare unverified commands
### test/runner/dispatch.test.mjs (66)
- loadRunnerConfig parses a valid committed-shaped config
- loadRunnerConfig rejects a missing file
- loadRunnerConfig rejects invalid JSON
- loadRunnerConfig rejects a config missing executor.args
- loadRunnerConfig rejects a config missing modelPolicies
- loadRunnerConfig accepts a modelPolicies provider table declaring only some of the 6 policy tiers (Phase 00 R8)
- loadRunnerConfig rejects a modelPolicies tier key not in MODEL_POLICY_TIERS
- loadRunnerConfig rejects a modelPolicies entry whose model value is not a non-empty string
- loadRunnerConfig rejects a non-positive timeoutMs
- loadRunnerConfig accepts a config with no "idleTimeoutMs" at all -- absent keeps the idle-timeout disarmed, byte-identical to befo
- loadRunnerConfig accepts a well-formed positive "idleTimeoutMs"
- loadRunnerConfig rejects a non-positive "idleTimeoutMs" when present
- loadRunnerConfig accepts a config with no "executors" block at all
- loadRunnerConfig rejects a non-object "executors" block (tsk-225 D1: the renamed catalog is real and validated, unlike the unrelat
- loadRunnerConfig rejects an unknown "adapter" value on the global executor
- EXECUTOR_KINDS is exactly the agent/tool BAN CHAT axis (D5, tsk-in1-4) — no longer reuses tool-registry\'s own KINDS
- loadRunnerConfig accepts a config with no "executors" block at all — pre-tsk-62v shape, unchanged
- loadRunnerConfig accepts a well-formed "executors" entry carrying its own executor
- loadRunnerConfig accepts a config with no "capabilities" block at all
- loadRunnerConfig accepts a well-formed "capabilities" catalog entry with description and aliases
- loadRunnerConfig accepts a "capabilities" entry naming neither description nor aliases (bare {})
- loadRunnerConfig rejects a "capabilities" block that is not an object
- loadRunnerConfig rejects a "capabilities.<name>" entry that is not an object
- loadRunnerConfig rejects a "capabilities.<name>" entry with an empty-string description
- loadRunnerConfig rejects a "capabilities.<name>" entry whose aliases is not an array of non-empty strings
- INVOCATION_VIA is exactly the invocation-mode axis: cli, task and mcp
- loadRunnerConfig accepts a "executors.<id>" entry using the invocations[] shape instead of flat command/args
- loadRunnerConfig rejects a "executors.<id>.invocations" that is not a non-empty array
- loadRunnerConfig refuses a "via":"api" invocation by name, the http transport having been removed
- loadRunnerConfig rejects a "executors.<id>.invocations[]" entry with a malformed command/args shape (reuses validateExecutorShape)
- loadRunnerConfig accepts a "executors" entry naming only "kind" (metadata-only, falls through for its executor)
- loadRunnerConfig rejects a "executors" block that is not an object
- loadRunnerConfig rejects a "executors.<id>" entry with an unknown "kind"
- loadRunnerConfig accepts "task" as a "executors.<id>.kind" value (the one kind fgos tool never sees)
- loadRunnerConfig rejects a "executors.<id>" entry declaring "command" without "args"
- loadRunnerConfig accepts a "executors.<id>" entry with allowCrossProvider: true
- loadRunnerConfig rejects a "executors.<id>" entry whose allowCrossProvider is not a boolean
- loadRunnerConfig reads a named YAML file and names the line and column of a parse failure
- loadRunnerConfig rejects a runner config declaring retired models map
- loadRunnerConfig accepts a runner config declaring modelPolicies instead of models
- loadRunnerConfig rejects a config declaring no modelPolicies
- loadRunnerConfig rejects a modelPolicies entry with an unknown policy tier key
- loadRunnerConfig rejects a modelPolicies entry whose model value is not a non-empty string
- loadRunnerConfig rejects a "executors.<id>" entry whose providerModel is not a non-empty string
- loadRunnerConfig rejects a "executors.<id>" entry whose rigorOverrides key is not a valid tier
- loadRunnerConfig rejects a "executors.<id>" entry whose rigorOverrides value is not one of MODEL_POLICY_TIERS
- resolveExecutorCommand throws for an unknown adapter even on a raw config object that skipped loadRunnerConfig validation
- loadRunnerConfig accepts a "executors.<id>" entry with a non-empty agentType
- loadRunnerConfig rejects a "executors.<id>" entry whose agentType is not a non-empty string
- loadRunnerConfig accepts a "executors.<id>" entry with a boolean forceCliSpawn
- loadRunnerConfig rejects a "executors.<id>" entry whose forceCliSpawn is not a boolean
- EXECUTOR_CARRIES is exactly the two D15-locked values, never a free string vocabulary
- loadRunnerConfig accepts a "executors.<id>" entry with a valid carries value
- loadRunnerConfig ignores a "executors.<id>" entry\'s stray "capability" field entirely -- no longer validated against "capabilitie
- loadRunnerConfig accepts a "executors.<id>" entry naming neither "for" nor the legacy "capability" (a plain dispatch executor)
- loadRunnerConfig rejects an mcp invocation\'s "tools" map whose value is not a non-empty string
- loadRunnerConfig accepts an mcp invocation naming no "tools" at all -- purely additive field
- loadRunnerConfig rejects a "executors.<id>" entry whose carries is not one of EXECUTOR_CARRIES
- loadRunnerConfig rejects capabilities.<name>.prefer that is not a non-empty string
- loadRunnerConfig rejects capabilities.<name>.overrides with a key outside the allowed 4 fields -- command/args/adapter are never o
- loadRunnerConfig rejects every capabilities.<name>.overrides payload with migration guidance
- loadRunnerConfig accepts a capability rigor floor with prefer
- loadRunnerConfig rejects an empty "prefer" array
- loadRunnerConfig rejects a "prefer" array entry object with an unknown key
- loadRunnerConfig accepts well-formed "env" block in executors entry
- loadRunnerConfig rejects malformed "env" in executors entry
### test/runner/herdr-spawn-adapter.test.mjs (1)
- herdr-spawn adapter validates interactiveMode config shape
### test/setup/capability-catalog-doctrine.test.mjs (7)
- loadRunnerConfig accepts a "capabilities.<name>.serves" entry with scalar and array attribute values
- loadRunnerConfig accepts a "capabilities.<name>" entry with no "serves" at all (an old config predating I19 keeps loading)
- loadRunnerConfig rejects a "serves" value that is not an object
- loadRunnerConfig rejects a "serves" key not in the DemandFacts vocabulary, including "size"/"rigor" (Q1 never uses those two)
- loadRunnerConfig rejects a "serves" boolean attribute given a non-boolean value
- loadRunnerConfig rejects a "serves" string attribute given an empty string
- EXECUTOR_KINDS registers both agent and tool -- a capability is not agent-only

## Verification run

- `cargo test -p fgos-config`: pass (golden_lint `bundled_set_is_clean` and golden_standard included: the standard validates against the changed schema).
- Focused Node: dispatch, dispatch-config-patterns, dispatch-executor-profile, dispatch-confinement-policies, dispatch-confinement-p04, dispatch-governance-operability, tier-fallback-config, dead-vocabulary-guard, herdr-spawn-adapter, credential-store, capability-catalog-doctrine, seat-resolver, checks, dispatch-operability, runner-schema-vocabulary, architecture, doc-health, check-decision-citation-drift, config facade: pass.
- Full suite: `node scripts/run-tests.mjs` in this worktree with every `HERDR_*` and `CLAUDE*` variable unset and a private cargo target: 8 658 tests, 8 625 pass, **1 fail** (the frozen V7n addendum test, the known pre-existing red), no `run-tests: ERROR` line. A first full run found six real failures (three herdr-maturity doctor cases, `tier-vocabulary-dead-keys`, `runner-patterns-config` attribution, `confined-pane-accounts`), all fixtures or assertions that depended on the old loader; fixed (Deviations 5) and re-run. Suite inventory line: +29 -126 test() calls, 0 new spawn sites.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared. Census regenerated (rebase-only file; regenerate again at rebase).
- Rust change is test code only: `cargo fmt -p fgos-config` clean. The workspace `cargo fmt --all --check` reports one existing diff in `apps/fgos/src/wiring/mailbox_remote.rs`, not touched here. No production Rust changed, so the msvc/darwin checks and clippy are unchanged by this phase.

## Deviations from the phase file

1. **`src/runner/dispatch.mjs` is kept as a 10-line entry, not deleted.** The barrel (the 40 re-exports) is gone, but the file is also the documented compatibility entry `node src/runner/dispatch.mjs decide ...` (AGENTS.md dispatch section, `core/skills/_shared/capability-catalog.md`, `planning-capability-awareness.md`, `fgos-coding-implement`, three test files that spawn it). Deleting it removes a public alias and needs the generated skill renders and AGENTS.md rewritten. Delete it with those lines if the owner accepts losing the alias; the manifest row stays until then.
2. **Hints for the removed capability keys `overrides` and `unconfined` live in the node's `$comment`, not its `description`.** Changing the `capability` description changes the `@fgos:doc` comment of every capability entry in every config file: 10 `config-doc-drift` failures on this repository's own file, plus every machine's global file. The refusal now names file, line and path but not the replacement. The owner can choose the description and a `refresh-docs` pass.
3. Schema `invocation.via` loses `api` and `url`: the runner already refused `via: api` ("http transport removed"); the schema now agrees.
4. Whitespace-only strings: where Node refused a blank string the schema uses `pattern: "\\S"` (all nodes outside the account inventory); the account inventory strings keep `minLength: 1` because their validator is `provider-capacity.mjs`.
5. Test fixtures outside the ten files the phase lists, fixed because the door now refuses what only the loader used to refuse (an executor `command` without `args`, a `via: cli` invocation with no `command` or `args`) or because the schema now owns a rule a doctor test exercised: `test/runner/dispatch-confinement-p05.test.mjs` (three herdr-maturity cases: `args: []`), `test/setup/visibility-checks.test.mjs` (`paneExecutors` invocations gain `args`; `codex-cli` gains its `command`), `test/setup/registrations.test.mjs` (the catalog-defaults attribution case uses `maxRounds` on a `solo` pattern, a parameter another loop reads, because the schema now refuses a defaults key no loop reads), `test/setup/checks-doctor-config.test.mjs` (the retired-key row case drops the capability `overrides` key, now a schema refusal). The `tier-vocabulary-dead-keys` row is on the parallel doctor phase's delete list; if that lands first, drop this edit with the test.
6. Invocation-level `confinement` and a few text fields are stricter than the Node checks were. Node closed the key list only for an executor's own `confinement`; the schema now closes it for an invocation's too (one `launchConfinement` grammar; the retired `sessionName` could name the operator's cockpit, so the reason holds at both levels). Fields Node never checked for blank (`description`, `scanTarget`, `responsibility`, `model`, `agentType`, `renderer`) refuse a whitespace-only string. The read-only census above passes on this machine; the owner machine and third workspace run it with the old release before landing.
7. `src/runner/loop.mjs` one comment (it named `loadRunnerConfig`), `src/setup/registrations.mjs` outside rows `:1402-1440` (the `capability-serves-valid` function and the generated-paths comment), `docs/how-to/...doctor.md` one row: edited because each named a removed function or condition.

## Items for other phases

- P12 (`registrations.mjs` owner after this): `capability-serves-valid` shape condition is gone; the parallel doctor-dead-rows phase edits the same file, expect a mechanical rebase of the census and line numbers.
- `src/setup/model-pool-checks.mjs` rows call `parseTierCell` on a loaded config; they stay correct because the door has validated cells, but the cell grammar now exists in the schema and in `tier-cell.mjs` (parse, used at bind). One authority for the cell grammar is a later cleanup, not this phase.
- `src/state/tool-registry.mjs:83` comment still names `INVOCATION_VIA`.
- Land: the schema changes activate on every workspace at once; run the read-only `fgos config check` with the old release on the owner machine and the third workspace first (guide step), then land in the announced window.
- Net size for the layer: this phase alone is Node -1 295 and tests -1 775, more negative than the phase estimate in both.

Status: DONE_WITH_CONCERNS
