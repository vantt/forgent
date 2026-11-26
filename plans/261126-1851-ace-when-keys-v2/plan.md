---
contract: plan-v1
title: "Agent context engine: when-key registry v2 (workType, sessionType, agentFamily, agentCli, agentLifecycle; kind and cli removed)"
status: running
lead: lead:ace
priority: P1
blockedBy: []
base: 678d7096e56f6994e2a25e0f1f05d2f6ec91111c
footprint:
  - plans/261126-1851-ace-when-keys-v2/**
  - packages/agent-context-engine/contracts/**
  - packages/agent-context-engine/rust/**
  - packages/agent-protocol/rust/src/direct/mod.rs
  - apps/fgos/Cargo.toml
  - Cargo.lock
  - apps/fgos/src/wiring/context_engine/values.rs
  - packages/component-authority/model/contracts.yaml
  - docs/platform/architecture-map.md
  - docs/platform/agent-context-engine/spec.md
  - .fgos/instructions/effective/rules.json
  - packages/git/contracts/mutation-census.v1.json
  - CHANGELOG.md
source:
  - plans/discussions/ds-k435vz65l2-when-key-rename/DISCUSSION.md
  - p-2vep73teju
created: 2026-11-26
---

# Agent context engine: when-key registry v2

Mode: standard. One component (ACE) and its one host reader change; the work is a contract version bump with every
reader moved in the same change (L10), so it does not split into parallel code phases (see Phases).

## Outcome

The `when:` key registry of the agent context engine is version 2 with the three-group key set of the discussion's §6
(D1): `kind` and `cli` are gone; `workType`, `sessionType`, `agentFamily`, `agentCli` and `agentLifecycle` exist;
`persona` is the charter and `role` is only the part in a workflow step. `when-keys.v1.json` is deleted in the same
change and no second registry is kept (D4a). An effective set records `whenKeysVersion: 2`; a reader refuses version 1.
The host's live value reader answers the new live keys from their §6 sources. Rule units can then be aimed at one
kind of work, one session form, one agent family or CLI, and one moment in an agent's life.

## Acceptance criteria

1. `packages/agent-context-engine/contracts/when-keys.v2.json` holds exactly the §6 keys, values and sources (contract
   id `agent-context-engine-when-keys.v2`, `version: 2`); `when-keys.v1.json` is gone and
   `rg -n 'when-keys\.v1' packages docs core apps src` returns nothing. Owning proof: the registry test in
   `packages/agent-context-engine/rust/tests/vectors.rs`.
2. A compiled set carries `whenKeysVersion: 2` (`.fgos/instructions/effective/rules.json`, vector
   `contracts/vectors/effective-set.json`); a set with version 1 is refused `rule-set-version-unsupported`
   (`rust/tests/set.rs`, vector `refusals/rule-set-version-unsupported.json`).
3. A unit with `when: {kind: [...]}` or `when: {cli: [...]}` is refused `rule-when-key-unknown`; `when: {sessionType:
   [hand-opened]}` passes; `when: {agentLifecycle: [setup]}` is refused `rule-when-value-invalid`
   (`rust/tests/check.rs`, refusal vectors).
4. The host reader `apps/fgos/src/wiring/context_engine/values.rs` answers `agentCli` with the agent-protocol adapter
   ids, `workType` with the domains' `classification.kind`, `role` with the domains' `roleGraph.roles`; it answers
   nothing for `cli` or `kind` (its unit test).
5. `cargo test --workspace` and `npm test` green; `fgos authority render --check` clean.
6. Plan `261122-1946-agent-start-context` lists this plan in `blockedBy` (D4e; done by the planner at landing, see
   Risks).

## Non-goals

- The Work item field `kind` and the persona file field `role:` (they stay in ds-que32ftgg6, D2).
- The rule unit's own `kind` field (`law`, `procedure`) in `rule-unit.v1.json` and `rule.rs` (discussion §3 row 10).
- ASC's delivery field, any hook that injects rules, and ASC 261122-1946's phase texts (its planner re-validates them).
- `agentLifecycle` values beyond `start` and `rotate`: the hook-event moments are added as data only when a composer
  injects rules at that moment (D3, RUL104).
- A live reader for `sessionType`, `agentFamily`, `agentLifecycle` (static in the registry) or `project` (unchanged).

## Approach

Chosen path: bump the one registry file to v2 and move every reader in the same change. Decisions honored: D1 (key
set and meanings), D2 (ACE and its readers only), D3 (`sessionType` and `agentLifecycle` values; `setup`/`hook` are
deliveries, not values), D4 (v2 replaces v1; value sources; ASC ordered after).

Alternatives rejected:
- Keep v1 beside v2 and accept both in the reader: two registries, against D4a and L10.
- Edit v1 in place without a version bump: a set compiled against the old keys would read as current; the effective
  set records `whenKeysVersion` precisely so a reader can refuse it (spec §8).
- `agentCli` values from the runner config's executor ids (today's `cli` source in `values.rs`): executor ids are
  not adapter ids; D4b fixes the adapter ids as the source.
- `agentCli` as a static list in the registry: §6 names the adapters as a live source; a copied list drifts when an
  adapter is added.

Prior art reused: the registry loader (`when_keys.rs`), the `ValueSource` port and its one host adapter
(`values.rs`), the version gate in `set.rs:124-135`, the refusal codes `rule-when-key-unknown`,
`rule-when-value-invalid` and `rule-set-version-unsupported` (all exist; no new code). The adapter id list already
exists as the private `known` array in `packages/agent-protocol/rust/src/direct/mod.rs:24`; it becomes the crate's
public list, and `adapter_for` reads it, so there is one list. Missing before this plan: a live reader for `workType`
and `role`, and any door to the adapter id list.

Prior art check: `git log -S'when-keys.v1'` shows the file shipped with ACE plan 261125-1631 (status `done`); no rule
unit carries a `when:` today (discussion §3 row 4), so nothing in force is re-keyed and the digest of the committed
set does not change (the digest covers only `rules`, spec §7).

Risk map:
- Low: a missed reader of `when-keys.v1` or of the `kind`/`cli` key. Proof: the `rg` in acceptance 1 and the full
  `cargo test --workspace`.
- Low: generated files (`architecture-map.md`, `mutation-census.v1.json`, `.fgos/instructions/effective/rules.json`)
  drift. Proof: `fgos authority render --check`, the census test in `npm test`, the effective-set test.
- Medium: cross-plan footprint overlap on `CHANGELOG.md`, `Cargo.lock`, `apps/fgos/Cargo.toml` and
  `packages/component-authority/model/contracts.yaml` with plans already admitted. Proof: `fgos resource-check` at
  admission; these are one-line edits that rebase by regeneration (`Cargo.lock`, census, map) or by line.

Impact-analysis posture: GitNexus calls are the implementing lead's (MUST rules in AGENTS.md); symbols touched:
`when_keys::parse`, `when_keys::registry`, `EffectiveSet::read` version gate, `LiveValues::read`/`values`,
`direct::adapter_for`. All have narrow callers inside ACE, the host's context-engine wiring and the agent-protocol
crate.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `when-keys.v2.json` contract | `agent-context-engine/when-keys.v1` | The existing row is updated in place: id, canonical, meaning and path become `agent-context-engine/when-keys.v2` and `when-keys.v2.json`; provider `agent-context-engine`, consumer `host-surface` unchanged. Overlaps the v1 contract; survivor: agent-context-engine/when-keys.v2; retired: packages/agent-context-engine/contracts/when-keys.v1.json. |
| Public adapter id list of the agent protocol | `agent-protocol` | not new: the existing private `known` array in `direct/mod.rs` made public; survivor: that list; no copy elsewhere. |
| Live readers for `workType`, `role`, `agentCli` | `agent-context-engine` | extends the existing `ValueSource` host adapter `values.rs`; no new port. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Registry v2 and every reader](phase-01-registry-v2-and-readers.md) | - | packages/agent-context-engine/contracts/**, packages/agent-context-engine/rust/**, packages/agent-protocol/rust/src/direct/mod.rs, apps/fgos/Cargo.toml, Cargo.lock, apps/fgos/src/wiring/context_engine/values.rs, packages/component-authority/model/contracts.yaml, docs/platform/architecture-map.md, docs/platform/agent-context-engine/spec.md, .fgos/instructions/effective/rules.json, packages/git/contracts/mutation-census.v1.json, CHANGELOG.md | 1 | done |
| 2 | [Integration and full gates](phase-02-integration.md) | 1 | plans/261126-1851-ace-when-keys-v2/reports/** | 2 | draft |

Why one code phase: the v1 file, its contract row, the spec link, the committed effective set and the mutation census
all change together; any split leaves a tree where the authority model, a doc link, the set reader or the census test
fails, which breaks the rule that the gate holds on a tree with only some phases. The whole phase is under a day of
work.

## Progress (lead on fg-server, 2026-11-26)

Phase 1 is done and landed on main as `37c57401e`: registry v2, every reader, the vectors, the host's live value reader, the
agent-protocol adapter list, the authority row and rendered view, the spec row and the changelog line; the committed
effective set records `whenKeysVersion: 2`. Verified on the branch: crate tests 112 and 86 (without pkm), agent-protocol 22,
host reader 4, door 5, rustfmt clean, `authority render --check` clean, no `when-keys.v1` left. Phase 2 (full gates) is running.
One red test on main is not this plan's: `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row`
fails on `packages/supervision/contracts/scheduling-record.v1.json` having no authority row (added by another lane on 2026-11-26).

## Owner questions

None. Every choice traces to D1-D4; the `agentCli` reader source is D4b.

## Outstanding questions

None

## Risks and rollback

- ASC 261122-1946 cites the old keys in phases 2, 3, 5, 7 and 10; it stays `draft` and `blockedBy` this plan (D4e).
  The planner adds that `blockedBy` line to ASC's `plan.md` in the land of this plan (ordering metadata only, settled
  by D4e); ASC's planner rewrites the key names when it re-validates.
- A project that compiled an effective set with v1 gets `rule-set-version-unsupported` from a new reader until it
  recompiles (`fgos setup` runs the compile). This is the refusal the version field exists for; the CHANGELOG line
  says to recompile.
- Rollback: revert the phase-1 commit; it is one commit holding every file, and the generated files revert with it.
