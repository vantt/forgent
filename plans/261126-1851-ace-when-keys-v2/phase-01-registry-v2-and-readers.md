---
phase: 1
title: Registry v2 and every reader
status: draft
capability: code:implement
---

# Phase 1: Registry v2 and every reader

One commit: the `when:` key registry becomes version 2 and every reader, contract text, generated file and doc that
names v1 or the removed keys moves with it (L10). No rule unit carries a `when:` today, so no rule is re-keyed.

## Inputs

- `plans/discussions/ds-k435vz65l2-when-key-rename/DISCUSSION.md` §4 (D1-D4) and §6 (the key table: the source of
  truth for keys, values and value sources).
- `packages/agent-context-engine/contracts/when-keys.v1.json` (shape to keep: `contract`, `version`, `description`,
  `keys[]` with `key`, `valueType`, `valueSource {type: static, values} | {type: live, source}`, `description`,
  and `componentScope`).
- `packages/agent-context-engine/rust/src/when_keys.rs`, `rust/src/set.rs:124-135`, `rust/tests/{check,set,vectors}.rs`.
- `apps/fgos/src/wiring/context_engine/values.rs` (the one `ValueSource` of the host).
- `packages/agent-protocol/rust/src/direct/mod.rs:23-31` (`adapter_for` and its private `known` list).
- `domains/coding/registry.yaml` (`classification.kind`, `roleGraph.roles`); `domains/` holds coding, council,
  marketing, and a domain without `registry.yaml` contributes nothing.
- `docs/platform/agent-context-engine/spec.md` §4 (lines 66-69) and §9.

## Files it may write

`packages/agent-context-engine/contracts/**`, `packages/agent-context-engine/rust/**`,
`packages/agent-protocol/rust/src/direct/mod.rs`, `apps/fgos/Cargo.toml`, `Cargo.lock`,
`apps/fgos/src/wiring/context_engine/values.rs`, `packages/component-authority/model/contracts.yaml`,
`docs/platform/architecture-map.md` (generated), `docs/platform/agent-context-engine/spec.md`,
`.fgos/instructions/effective/rules.json` (generated), `packages/git/contracts/mutation-census.v1.json` (generated),
`CHANGELOG.md`.

## Steps

1. Run GitNexus `impact` (upstream) on `parse`, `registry` (when_keys), the version gate in `set.rs`,
   `LiveValues::read`, `LiveValues::values` and `adapter_for`; report the blast radius.
2. Write `contracts/when-keys.v2.json` (`contract: agent-context-engine-when-keys.v2`, `version: 2`) with exactly
   these keys, in group order, each description stating its meaning from §6:
   - `domain` live "domains/ directory ids"; `workType` live "domains/<d>/registry.yaml classification.kind";
     `workflow` live "workflow presets"; `stage` live "stages of the workflow preset"; `project` string, live
     "activated project registry";
   - `persona` live "persona definitions" (the charter); `role` live "domains/<d>/registry.yaml roleGraph.roles" (the
     part in one workflow step only; head names are `persona` values); `sessionType` static `head`, `worker`,
     `hand-opened`; `agentFamily` static `claude`, `openai`, `gemini`; `agentCli` live "agent-protocol adapters";
   - `agentLifecycle` static `start`, `rotate`.
   Keep `componentScope`. The description says how text reaches the agent is ASC's delivery, not a key.
   Delete `contracts/when-keys.v1.json`.
3. `rust/src/when_keys.rs`: `include_str!` and every message and doc comment point at `when-keys.v2.json`. The
   reader in `set.rs` needs no code change (it compares with `registry().version`); check its messages.
4. Contract texts: `contracts/refusals.v1.json` (lines 9, 75), `contracts/rule-unit.v1.json:165`,
   `contracts/effective-rules.v1.json:19` name `when-keys.v2.json`.
5. Vectors: `whenKeysVersion` 1 -> 2 in `vectors/effective-set.json`, `refusals/rule-set-digest-mismatch.json`,
   `refusals/rule-set-malformed.json`; `refusals/rule-set-version-unsupported.json` carries version 1 (the refused old
   version). `refusals/rule-when-value-invalid.json`: re-key to `agentLifecycle: [setup]`.
   `refusals/rule-when-key-unknown.json` (one case, key `colour`) stays; the removed keys `kind` and `cli` are
   asserted in `check.rs` (step 6), not as new vector files.
6. Tests, extending the owning proofs (no second copies): `rust/tests/vectors.rs` registry test asserts the v2 key
   list, the `sessionType`, `agentFamily`, `agentLifecycle` static values and `agentCli` live source; `rust/tests/check.rs`
   moves its `kind`/`cli` cases to `sessionType`/`agentCli` (the `ValueSource` stub answers `agentCli`), and asserts
   `kind` and `cli` are refused `rule-when-key-unknown`, `sessionType: [hand-opened]` passes, `agentLifecycle:
   [setup]` is refused `rule-when-value-invalid`; `rust/tests/set.rs` raw set carries `whenKeysVersion: 2` and the
   unsupported case covers 1.
7. Agent protocol: make the adapter ids one public list in `direct/mod.rs` (for example `pub const CLIS: [&str; 5]`),
   with `adapter_for` reading it. Add `fgos-agent-protocol` as a dependency of `apps/fgos` if it is not one; `Cargo.lock`
   regenerates from the build.
8. Host reader `values.rs`: rename `cli` to `agentCli`, answered from the agent-protocol list (not the runner
   executors; `load_runner_config` drops out if nothing else uses it); add `workType` (union of
   `classification.kind`) and `role` (union of `roleGraph.roles`) read from each `domains/<d>/registry.yaml` through
   `fgos_yaml_doc`, refusing an unparseable registry with its path like the workflow files; keep `persona`, `domain`,
   `workflow`, `stage`. Update the module doc and its unit test: fixture `domains/alpha/registry.yaml`, asserts on
   `workType`, `role`, `agentCli`, and `None` for `project`, `cli`, `kind`, `nonsense`.
9. Authority model: in `packages/component-authority/model/contracts.yaml` replace the row
   `agent-context-engine/when-keys.v1` by `agent-context-engine/when-keys.v2` (id, canonical, meaning, path), through
   `fgos authority declare --kind contract --row <json> --update` if it accepts the id change, otherwise by editing
   the row; then `fgos authority render` (regenerates `docs/platform/architecture-map.md`).
10. Spec `docs/platform/agent-context-engine/spec.md`: §4 key paragraph lists the three groups and links
    `when-keys.v2.json`; §9 adds one row: "when-key registry v2" | D1-D4 summary | 2026-11-26 | link to the
    discussion.
11. `CHANGELOG.md` `## [Unreleased]`: one line: the `when:` registry is v2 (`workType`, `sessionType`,
    `agentFamily`, `agentCli`, `agentLifecycle`; `kind` and `cli` removed); a set compiled with v1 is refused until
    recompiled by `fgos setup`.
12. Regenerate: the effective set with the working-tree host (`npm run fgos:dev -- internal context-engine compile
    --protocol 1` from the repo root, per `apps/fgos/src/wiring/context_engine.rs`), then the census
    (`node scripts/git-one-door-scan.mjs --root . --write-census`). Never hand-edit either.
13. Run `detect_changes()` before committing; one commit, conventional message, no plan ids.

## Verify

```bash
cargo test -p fgos-agent-context-engine
cargo test -p fgos-agent-protocol
cargo test -p fgos --lib context_engine
fgos authority render --check
rg -n 'when-keys\.v1' packages docs core apps src   # no output
node --test test/setup/git-mutation-census.test.mjs
```

Pass: every command exits 0 and the `rg` prints nothing. (Crate names: `fgos-agent-context-engine`, `fgos-agent-protocol`, `fgos`.)

## Rollback

Revert the phase commit; every file, generated ones included, returns to v1.
