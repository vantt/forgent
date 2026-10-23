# Phase 00: Facts (prior art, what exists, what is missing, what is reused, corrected counts)

Status: facts gathered 2026-10-23 by the planner; the executor re-verifies each line with `rg` / `git log -S` before relying on it (scout summaries go stale). No code in this phase. Suggested executor: sonnet.

## Context

AGENTS.md asks a plan's facts phase to answer: what existed before, which change removed it, was that intended.

## Prior art

| Question | Finding | Evidence |
|---|---|---|
| Was there an earlier `fgos-config` crate or `packages/config`? | No. `git log --all -- packages/config` is empty; `git log -S'fgos-config'` hits only plans, specs and the registry docs, never a crate. | commands run 2026-10-23 |
| Who introduced `registerConfigDefault`, and was removal intended? | `a18885d04` (tsk-2cs, extensible doctor-check and config-default registry). Its own header says a new call is "automatically picked up", i.e. it is the section registry. The Config spec retires it on purpose (section 4). | `git log -S'registerConfigDefault' -- src` |
| Who introduced `mergeConfigDefaults` and `sanitizeGlobal`? | `ff74c0f7f` (setup-doctor-2, fill-missing-only merge) and `bdfeb5f8e` (drop stale global `modelPolicies` tier keys before merge). The second is the transitional filter family of decision D10. | `git log -S'mergeConfigDefaults' -- src`, `-S'sanitizeGlobal'` |
| Who introduced the `sectionOf` copy, and where are the others the spec names? | `b3d732912` (terminal config section). Only `src/terminal-control/config.mjs:40` still has a function of that name. `src/setup/run-supervisor-checks.mjs:334-335,431-432` read project and global through `readSharedConfig` + `loadGlobalConfig` without a merge helper; `src/setup/holder-lock-checks.mjs` has no config read left. The spec sentence is stale (amended in phase 14). | `rg -n "sectionOf"`; the two files |
| Did Holder-lock read config, and is the bootstrap cycle in spec section 10 still real? | No longer. Commit `a620881e7` (2026-10-22, "move the Node facade and its callers onto the in-process door") deleted `lock.predecessorKillWaitMs`, its reader `readPredecessorKillWaitMs` and the doctor row `lock-predecessor-kill-wait`: "The predecessor kill wait is the 2000 ms every Rust caller uses". `src/holder-lock/index.mjs:198` passes `killWaitMs: DEFAULT_KILL_WAIT_MS` (`src/holder-lock/protocol.mjs:18`). `rg readPredecessorKillWaitMs src packages apps test` finds nothing. Intended: yes, in the commit message. The key survives only as dead data: `.fgos/config.json` still has `"lock": {"predecessorKillWaitMs": 2000}`. | `git show a620881e7`, `git log -S'readPredecessorKillWaitMs'` |
| Is the count of `registerConfigDefault` calls 15 (spec) or 17 (the owner's note)? | **14.** `grep -c "^registerConfigDefault("` over `src/setup/registrations.mjs` is 14: lines 2359, 2671, 2693, 2725, 2784, 2790, 2832, 2898, 2969, 3368, 3406, 3695, 4490, 6351. `rg 'registerConfigDefault\('` gives 17 lines only because it also matches the function definition (`:198`) and its two error-message strings (`:203`, `:209`); `rg 'registerConfigDefault\(\{'` gives 15 because it matches the definition's destructuring (`:198`). The config file has 15 top-level sections; `lock` is not registered (and is dead, above). | `rg -c`, `sed -n 190,260p` |
| Earlier YAML door and test helper | Slice A landed `fgos-yaml-doc` and `test/helpers/config-fixture.mjs`. Not touched here. | Slice A plan |
| Account and token readers that the standard must not contain | `rejectProjectProviderAccountInventory` (`src/runner/dispatch/provider-capacity.mjs:54`), `runner.llmAccounts` (`src/runner/dispatch/llm-accounts.mjs`), `gateway.token` (`apps/fgos-gateway/src/gateway.rs:143`). Read-only here; they move at Slice D. | `rg` |

## What exists vs what is missing

| Item | Exists | Missing |
|---|---|---|
| Crate layout convention | `packages/<name>/rust` + `packages/<name>/contracts/` (canonical-json, yaml-doc); root `Cargo.toml` members list, `version.workspace` | `packages/config/**` |
| YAML leaf | `fgos-yaml-doc` public API: `parse(bytes, Profile, file)` (`src/document.rs:106`), `Document::{value, revision, span_of, to_json}` (`:176-227`), `set/insert/remove/set_comment_block/set_inline_comment/comments_at/to_bytes` (`src/edit.rs:57-105`), `merge(layers, &dyn RuleSource)` returning `Merged{value, origins}` (`src/merge.rs:90`), `parse_path/format_path` (`src/path.rs`), `Span{start,end,line,column}` (`src/model.rs:75`), refusal ids (`src/model.rs:146`) | Wildcard rules: `RuleSource::rule` matches paths **exactly** (`src/merge.rs:31`), so `<any>` is Config's job |
| File write | `fgos-durable-file`: `replace_durably_with_mode` (`packages/durable-file/rust/src/lib.rs:169`), `install_once_with_mode` (`:146`), `replace_durably_observed` (`:187`) | Open-beneath without symlinks: `rg openat2\|RESOLVE_BENEATH packages apps` finds nothing; only single-final-component `O_NOFOLLOW` exists (`packages/secrets/rust/src/file_source.rs`, durable-file `:257`) |
| Locks | `fgos-holder-lock`: `LockScope::acquire(name, params, Wait)` resolving the registry template (`src/scope.rs:120`), `Wait::{Try, Ms}` (`src/port.rs:53`), rank rule `held.rank >= acquiring.rank` refuses (`src/scope.rs:95-103`); registry `packages/holder-lock/contracts/lock-registry.v1.json` (22 rows, ranks 10-80), schema with `owner` enum (`4.2, 4.3, 4.4, 6.2, event-store, git`) | Rows `project-config`, `global-config`; owner value `config` |
| Writer identity | `fgos-identity` (crate name verified in `packages/identity/rust/Cargo.toml`; it was `session-identity` in earlier docs): `WriterIdentity{id: WriterId, source}` and `resolve_current` (`src/resolve.rs:48,170`); ids restricted to `[A-Za-z0-9._-]`, at most 200 chars (`usable`) | Any fact "this session is confined" (`rg` finds no such primitive in `packages` or `src`) |
| Canonical form | `fgos-canonical-json::canonical_json(&Value)` | used by Slice D's migration check, not needed here |
| Section schemas and standard files | none: `core/config-schema/` and `core/config-standard/` do not exist (owner 2026-10-23 11:45: shape in `<section>.schema.yaml`, values in `<section>.yaml`). Same dialect already in the repo: JSON Schema draft 2020-12 in `packages/*/contracts/*.schema*.json` (example `packages/holder-lock/contracts/lock-registry.schema.v1.json`) and OpenAPI 3.1 in `docs/contracts/fgos-gateway-api-v1.yaml` | whole directory; a validator crate (owner's choice, `plans/reports/research-261023-1109-json-schema-validator-crate-choice.md`; Config has no JSON Schema validator today: `rg jsonschema packages/*/rust/Cargo.toml` finds none, executor re-verifies) |
| The standard's source | `.fgos/config.json` is tracked (1,557 lines): `runner.capabilities` 42 entries, `runner.executors` 8 (`claude, glm, gitnexus, herdr, openai, gemini, xai, deepseek`), `modelPolicies`, `tierFallback`, `patterns`, `defaults`; seat ladder text as `runner.$comment` | machine-specific scrub list; classification of standard vs project choice (gate G-B2) |
| Seed defaults to compare against | 14 registrations in `src/setup/registrations.mjs`; `DEFAULT_RUNNER_CONFIG` (`src/runner/dispatch/config.mjs`, second seed) | pinned fixture of the registry's assembled defaults (phase 12) |
| Machine-specific content in the catalog (already seen) | `.fgos/config.json:1151` names the `xai-vantt` profile in an executor description; `gateway: {"port": 4170, "token": null}` sits in the project file although `gateway` is global-only | scan list in phase 13 |

## Reuse (say it in each commit)

- `fgos-yaml-doc`: parse both profiles, edits, comments, `merge`, path text form, revision, `Refusal` (no new YAML code, no new Value type).
- `fgos-holder-lock::LockScope` and the registry file; `fgos-durable-file::replace_durably_with_mode` / `install_once_with_mode` for every write; `fgos-identity::WriterIdentity` for the actor.
- `serde_json`, `sha2` (workspace pins) for fixtures and digests.
- The yaml-doc fixture-runner pattern (one runner per fixture file, `fixture_shape.rs` for integrity only).
- `fgos convention path` for any report path.

## Not reused, with reason

- `src/config/*`, `mergeConfigDefaults`, `registerConfigDefault`: Node, deleted by Slice C; the crate does not call back into JavaScript.
- A custom schema dialect or value checker: owner decision 2026-10-23 (spec section 4); the standard JSON Schema keywords and the validator crate replace them. (An earlier draft of this plan built a closed descriptor dialect; it was withdrawn before any code.)
- `findExecutableOnPath` / `detectAssistantCli`: Node today; decision D1.

## Steps for the executor

1. Re-run every `rg` / `git log -S` above; replace stale line numbers in this file. Record the result for: `rg -n "readPredecessorKillWaitMs|predecessorKillWaitMs" src packages apps test --glob '!target'` (expect none) and `grep -c "^registerConfigDefault(" src/setup/registrations.mjs` (expect 14).
2. Trace D4: list every call site that writes or will write config (`fgos init`, `doctor --fix`, `fgos setup`, `fgctl run_tail` at `packages/distribution/rust/src/init.rs:555`) and state whether any holds a rank-80 lock in the same process while writing. `run_tail` runs the shim as a child process, so it holds `activation` in the parent and the child takes its own scope; record that and the verdict (rank 80 stands, or rank 85 with one `ranks` row).
3. Run `fgos tool query --capability impact-analysis --status present`; record `full | degraded | inactive` in plan.md notes.
4. `free -g`; record available memory. Create the worktree and branch `cfg/slice-b`; merge `origin/main`. Run `node "$(find . -path '*/node_modules' -prune -o -path '*/.git' -prune -o -path '*/backups' -prune -o -name set-active-plan.cjs -print 2>/dev/null | head -1)" plans/261023-1018-yaml-config-slice-b-config-crate`.
5. Post the board start line (top of `plans/261017-1313-fgos-platform-program-board/log.md`): lane CFG Slice B started, shared files named (`packages/holder-lock/contracts/lock-registry*.json`, `Cargo.toml`), no Node file touched. Read the board's "File chung dễ va" rows for `lock-registry*.json` and `docs/platform/*/spec.md` first; if HARDEN T1 or DOC still holds the registry, send them the two-row diff before phase 02.
6. Re-run the machine-specific scan on `.fgos/config.json` (`grep -nE '/home/|/Users/|vantt|localhost|127\.0\.0|\.fgos/runtime'`) and keep the output for phase 13.

## Validation

All lines re-verified; stale ones corrected; D4 verdict recorded. No tests.

## Risk / rollback

No risk (documents only). Rollback: delete the edits to this file and the board line.
