# Phase 00: Facts (prior art, what exists, what is missing, what is reused)

Status: facts gathered 2026-10-22 by the planner; the executor re-verifies each line with `rg` before relying on it (scout summaries go stale). No code in this phase.

## Context

AGENTS.md asks a plan's facts phase to answer: what existed before, which change removed it, was that intended.

## Prior art

| Question | Finding | Evidence |
|---|---|---|
| Was there an earlier Rust YAML crate attempt? | No. `git log -S'noyalib' -S'yaml-rt'` over the repo shows only the spec commit; the spike scratch code was not kept. | `3c4930691` (spec), spike report |
| Who introduced `serde_yaml`? | host-runtime manifest linker `4419d95d9` (2026-09-15); observe harness `143b36540` (2026-10-01); gateway MCP `search` (`9e4f783d8`, moved by `05a0b5e4a` 2026-10-04). | `git log -S'serde_yaml' -- <Cargo.toml>` |
| Who added the advisory ignore? | `.github/cargo-deny.toml` `RUSTSEC-2024-0449` ignore arrived in `cdce54ba9` (2026-10-18) as "pre-existing, replacement tracked on the board". Removal was intended from the start. | `git log -S'RUSTSEC-2024-0449' -- .github/cargo-deny.toml` |
| Earlier YAML door on Node | js-yaml 5.4.3 vendored behind `src/util/yaml.mjs` (`8ef1baf1c`, `838b044e5`, plan `plans/261016-0635-vendor-js-yaml-single-yaml-door`); replaced `yaml` npm package (`6013ca389`). Its upgrade procedure (integrity hash, parity run, decision record) is the model for this crate's upgrade record. | plan.md "Decisions taken", `test/util/yaml.test.mjs:141` |
| Earlier test-fixture helpers for config | `writeSharedConfig` (`src/config/shared-config-file.mjs:105`), local helpers `test/helpers/failover-fixture.mjs:151,161`, `test/helpers/workflow-fixture-repo.mjs:89`, `test/cli/helpers/fgos-cli-harness.mjs:502,553,1130`, `test/helpers/work-seat-config.mjs` (builds config objects, writes nothing). | grep 2026-10-22 |

## Current serde_yaml users (all three)

| Crate | Call sites | Use |
|---|---|---|
| `fgos-host-runtime` | `packages/host-runtime/rust/src/providers/external_process/manifest.rs:177` (`from_str` into `ExternalManifest`, derive Deserialize); test `tests/external_provider_manifest_and_registry.rs:399`; dependency `Cargo.toml:15` | typed manifest parse |
| `fgos-observe` | `packages/observe/rust/src/metrics_cli/harness.rs:241` (`serde_yaml::Value`, `.get(...)`, `.as_str()`); input capped at 1 MiB by its own `MAX_READ_BYTES`; dependency `Cargo.toml:15` | read `metadata.id`, `kind`, `spec.profile.kind` |
| `fgos-gateway` (`apps/fgos-gateway`, excluded from the workspace, own `Cargo.lock`) | `src/mcp.rs:81` (`extract_operations`, `as_mapping` iteration) and `:131` (parse of `docs/contracts/fgos-gateway-api-v1.yaml`, 35 KB, no anchors or tags); dependency `Cargo.toml:46` | OpenAPI operation search |

`serde_yaml` and `unsafe-libyaml` appear in root `Cargo.lock` (lines 249, 286, 676, 685, 822) and `apps/fgos-gateway/Cargo.lock` (522, 558, 1904, 1913, 2431). The root `cargo deny` job (`.github/workflows/ci.yml:297`) audits only the root lock; the gateway lock is audited by hand in phase 08.

## What exists vs what is missing

| Item | Exists | Missing |
|---|---|---|
| Crate layout convention | `packages/<name>/rust` + `packages/<name>/contracts/` (canonical-json: `rust/Cargo.toml` with `version.workspace`, vectors under `contracts/vectors/`, `include_str!` of the vector file in `src/lib.rs:68`) | `packages/yaml-doc/**` |
| Workspace deps | `serde`, `serde_json`, `sha2`, `thiserror` pinned exact in root `Cargo.toml` | parser crate; third-party layout |
| Contract fixtures for YAML | `test/util/yaml.test.mjs` (14 behaviour tests + 1 hash test) | golden fixtures in JSON |
| Fuzzing | nothing (`find` for `fuzz` dirs: none); `cargo-fuzz`, `cargo-deny` and a nightly toolchain are not installed on this machine (`rustup toolchain list`: stable 1.97.1 only) | `fuzz/` crate, machine prerequisites |
| Test fixture helper | 7 test files call product `writeSharedConfig`; about 85 files write `config.json` by hand (conservative grep, see phase 01); spike counted 104; 121 files mention the literal | `test/helpers/config-fixture.mjs` |
| Impact-analysis | to be queried by executor | `fgos tool query --capability impact-analysis --status present` |
| Panic strategy | no `panic = "abort"` in workspace manifests (grep 2026-10-22 shows none in root or package manifests) | executor re-greps in phase 07 |

## Reuse

- Crate layout and `include_str!` contract pattern from `packages/canonical-json`.
- `serde_json::Value` as the bridge to typed deserialization and to the Value-walking consumers (no new Value type for consumers).
- `sha2` for the byte revision (already a workspace dep).
- The js-yaml upgrade procedure as the template for `upgrade-record.md`; the 2026-10-16 parity run (828 YAML documents, 13 rejected by both) as the model for the scratch differential run.
- `fgos convention path` for any report paths.

## Not reused, with reason

- `serde_yml`/`serde_yaml_ng`/`serde_norway`: round-trip lossy or forks of the unsound base; spec section 8 excludes them.
- `yaml-edit`: rejected by the spike (rowan, 56 unsafe sites, refuses leading comments).
- A hand-written YAML parser: out of the question (RUL104).

## Steps for the executor

1. Re-run each `rg`/`git log -S` above; replace any stale line number in this file.
2. Run the impact-analysis query and record `full | degraded | inactive` in plan.md notes.
3. `free -g`; record available memory.
4. Create the worktree and branch; run `node "$(find . -path '*/node_modules' -prune -o -path '*/.git' -prune -o -path '*/backups' -prune -o -name set-active-plan.cjs -print 2>/dev/null | head -1)" plans/261022-1342-yaml-config-slice-a-yaml-document`.

## Validation

All lines re-verified; stale ones corrected. No tests.

## Risk / rollback

No risk (documents only). Rollback: delete the edits to this file.
