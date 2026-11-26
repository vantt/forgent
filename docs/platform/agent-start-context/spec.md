# Agent Start Context Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the one composer of the text every fgOS-started agent receives: its owner, tier, ports, contracts, refusals and per-start record
Design status: Accepted
Implementation: Not built (contracts and vectors only)
Canonical: Yes
Owner: Agent-start-context component (tier 3)
Source: packages/agent-start-context
Contracts: packages/agent-start-context/contracts/
Provenance: First written 2026-11-27
Writer type: Human + agent coauthor
Canonical for: compose(StartRequest) -> StartContext | Refusal, start facts filled from live data, payload placement, delivery budgets, contributors, the per-start record, the one-producer rule
Use this when: Changing what an agent receives at start, adding a start trigger, a payload kind, a delivery or a contributor
Do not use this for: Storing or checking rules and the when: key registry (agent context engine); spawning an agent or typing text into it (run supervisor, agent protocol); writing host files (packaging-distribution)
Last reviewed: 2026-11-27
Related:
- docs/platform/agent-context-engine/spec.md
- docs/platform/agent-protocol/spec.md
- docs/platform/observe/spec.md
- plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md
- plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
```

## 1. Purpose and scope

About thirteen trigger flows start an agent in fgOS: four for heads (a hand `fgos session start`, a head's socket
request, a supervisor wake, a rotation), six for workers (the `fgos run` prompt, a run relayed from a head,
`fgos run --unit` and `--resume`, `fgos workflow start`, the Work loop, the fanout batch), the `.claude/agents` files,
and sessions a person opens by hand. They converge on two engine entry ops and one shared seat-and-spawn step, so
spawning already has one door. The text such an agent receives at start had no owner: persona, ritual, on-wake and
opening text were built in about twelve places, in Node and in Rust.

Agent Start Context (ASC) is that owner. Every start, whatever its trigger, calls one function:

```text
compose(StartRequest { facts, payloads, delivery }) -> StartContext | Refusal
```

It returns ordered text blocks and writes one record of what it chose and what each block cost.

Scope is fgOS-owned text only. The AgentKit, GitNexus and MDView blocks and AgentKit's `.claude/rules` are
external and are never read, selected or rewritten here.

ASC and the Agent Context Engine (ACE) are two components joined by one contract. The dependency order is
ACE ← ASC ← packaging-distribution:

- ACE stores every rule unit, checks it when it is written, owns the `when:` key registry
  ([when-keys.v2.json](../../../packages/agent-context-engine/contracts/when-keys.v2.json)) and compiles one checked
  effective rule set with a digest
  ([effective-rules.v1.json](../../../packages/agent-context-engine/contracts/effective-rules.v1.json),
  file `.fgos/instructions/effective/rules.json`).
- ASC reads that one set, verifies its digest and version, fills fact values from live data, matches each rule's
  `when:` against them, adds payloads and contributor blocks, and orders the result. ASC is
  the only selector. It never reads rule files, never needs pkm or an embedding model, and never edits rule text.
- packaging-distribution writes files at setup (the AGENTS.md block, `.claude/agents`) by calling `compose` with the
  standing facts and the `agent-file` delivery, and writes only the blocks it gets back.

The `when:` keys this contract names are the keys of ACE's registry, version 2. The key list was fixed in ACE phase 1
as version 1 and moved to version 2 on 2026-11-26 (plan `261126-1851-ace-when-keys-v2`: `kind` and `cli` became
`sessionType`, `agentCli`, `agentFamily`, `workType` and `agentLifecycle`). ASC follows the registry's current version;
it never keeps a copy of the key list.

## 2. Owner and tier

The owner is the agent-start-context component, a pure Rust crate at tier 3 (package `fgos-agent-start-context`, under packages/agent-start-context/rust once
phase 3 of plan `261122-1946` builds it). It may depend on components at tier 3 or below, ACE's reader included, and on
nothing above. Its callers sit above it or beside it at tier 3.

`fgos authority locate "compose the start text an agent receives"` (2026-11-27, 38 rows) matched `session-host`
first (score 2), then `agent-confinement`, `agent-context-engine`, `agent-coordination`, `agent-mailbox`,
`group-thinking`, `launch-gate`, `runner`, `seat-binding` and `write-door` (score 1 each); no row owns start text.
The overlap is `session-host`, which renders a head's opening today (`src/session-host/head-start.mjs`). It keeps
starting and stopping heads; the opening text moves to ASC (phase 5 of plan `261122-1946`). The survivor for start
text is ASC.

## 3. Callers

| Caller | Facts it supplies | Delivery |
|---|---|---|
| Head launch (`launch-session`, session-host) | `sessionType: head`, `persona`, `project`, `agentCli`, `agentLifecycle`, and `domain` when the bound item carries one | `opening` |
| Engine `PromptPort` host adapter (`run-unit`, every worker trigger) | `sessionType: worker`, `role`, `project`, `agentCli`, and `domain`, `workflow`, `stage`, `workType` when the unit carries them | `prompt-arg` or `opening` |
| Agent-file projection (`.claude/agents`) | `persona`, `project` | `agent-file` |
| Setup projection (the AGENTS.md block) | `project` (the standing facts only) | `agent-file` |
| SessionStart hook for hand-opened sessions | `sessionType: hand-opened`, `agentCli`, `project`, and `persona`, defaulting to the project's entry persona | `hook-context` |

`start-request.v1.json` states, per start kind, which keys a caller must supply (`requiredFacts`).

A rule with no `when:` is standing: it is in AGENTS.md, which every agent CLI loads. Only the setup projection,
which writes AGENTS.md, places it; every other start places only the rules whose `when:` its facts match, so a start
never repeats AGENTS.md (`selects` in `rust/src/compose.rs`).

## 4. Ports

Each port has one adapter today, wired by the host. The crate itself does no I/O.

- **`RuleSet`**: ACE's compiled effective set, read through ACE's reader, which recomputes the digest and checks
  `schemaVersion` and `whenKeysVersion`.
- **`FactRegistry`**: the keys and value types of ACE's registry; the allowed values of a `live` key are read fresh
  from its source on every call (ACE's `ValueSource`), never hard-coded.
- **`RecordSink`**: appends the per-start record through Observe's record door.
- **`Contributor`**: the live door. A component implements `contribute(facts) -> Option<Block>` and registers it in
  `start-contributors.v1.json` with its `when:`, owner, byte budget and timeout. The host builds one adapter per
  registered row for each start, from what the request carries; a row the host has no adapter for fails the start as
  a host defect. The one row today is `rotation-handoff` (owner session-host): a head whose `agentLifecycle` is
  `rotate` gets the latest handoff of its lineage (persona and session name) as the last block of its opening. Its
  budget is 40000 bytes: the handoff is already cut to 10000 characters, and that is the most 10000 characters can
  take in UTF-8.

## 5. The contract

| Argument | Type | Schema | Owner of the values |
|---|---|---|---|
| `facts` | a map from fact key to value | [start-request.v1.json](../../../packages/agent-start-context/contracts/start-request.v1.json), keys from ACE's `when-keys.v2.json` | the live sources named by each key |
| `payloads` | a list of a closed tagged union: `assignment`, `task`, `handoff`, `for-question` | the same schema | each variant's producer |
| `delivery` | one of `opening`, `prompt-arg`, `agent-file`, `hook-context` | the same schema | Agent Protocol (how the text reaches the agent) |

Payloads carry content their producer owns; `compose` places them and never rewrites them. `assignment` is
Execution's assignment block (objective, write scope, result claim), rendered by Execution. `task` is a head's bound
item path and kind. `handoff` is the rotation handoff for a successor head, and this is its one channel. `for-question`
is a question id.

The answer, [start-context.v1.json](../../../packages/agent-start-context/contracts/start-context.v1.json):
`blocks[]` in order, each with `id`, `source` (a rule id, a payload kind or a contributor id), `text` and `bytes`;
`matched[]`, the rule ids chosen; `ruleSetDigest`; `record`, the id of the per-start record; `dropped[]`, blocks left
out by the budget or by a failed contributor.

### 5.1 Refusals

[refusals.v1.json](../../../packages/agent-start-context/contracts/refusals.v1.json). Every refusal is named and
fails closed:

| Code | When |
|---|---|
| `start-fact-unknown` | A fact key is not in ACE's registry. |
| `start-fact-value-invalid` | A fact value has the wrong type, or is not among the values its live source allows now. |
| `start-fact-missing` | A key the start kind requires (`requiredFacts`) is absent. |
| `start-payload-invalid` | A payload is not one of the four variants or does not match its variant's schema. |
| `start-rule-set-invalid` | The effective rule set is missing, has an unsupported `schemaVersion` or `whenKeysVersion`, or its digest does not match its rules. It replaces `start-unit-invalid` of the first draft: a bad rule is refused by ACE when it is written. |
| `start-delivery-unsupported` | The delivery is not one of the four, or the caller's CLI cannot take it. |

## 6. Fail closed, fail open

A request that does not validate, and a rule set that does not verify, refuse the whole start: no partial text is
returned. A contributor that errors or exceeds its timeout is left out and listed in `dropped[]` with its reason: one
broken component cannot stop every start.

## 7. Budget and order

Each delivery has a byte budget. Rule blocks come in ACE's composition order (kind order, then scope breadth, then
specificity, then authority, then source path, then id). ASC then places payloads and contributor blocks after the
rules they serve: the matching rules first, then the payloads in request order, then the contributor blocks in
registration order. Payloads and rules of kind `law` are required; other rules and contributor blocks are optional.
Optional blocks beyond the budget are dropped lowest priority first, contributors before rules and later before
earlier, and every dropped block is listed in the answer and the record, so growth shows as numbers rather than
silent bloat. A contributor's own block larger than its registered `budgetBytes` is dropped the same way.

## 8. The per-start record

Each `compose` call writes one Observe v2 record of a declared `start-context` kind through Observe's record door
(kinds declared at the place of use, `apps/fgos/src/wiring/observe_declarations.rs`). It carries the facts, the rule
set digest, the matched rule ids, the bytes per block and the dropped blocks with their reasons. The record makes the
token cost of every start measurable.

## 9. One producer

ASC is the only producer of persona, ritual, on-wake and opening text. Execution keeps rendering its assignment block
and passes it as a payload. An architecture test (`test/architecture.test.mjs`) fails when a second producer appears.

## 10. Lịch sử quyết định

| Topic | Decision | Date | Source |
|---|---|---|---|
| One owner of start text | One owning component, Agent Start Context (a tier-3 Rust crate), owns the text every fgOS-started agent receives at start; spawning and delivery keep their owners (run supervisor, Agent Protocol); the engine's `PromptPort` stays and its host side becomes an adapter of the crate. | 2026-11-22 | [discussion](../../../plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md), owner 18:23 |
| fgOS-owned text only | Scope is fgOS-owned text only; the MDView, AgentKit and GitNexus blocks are external and not touched. | 2026-11-22 | same discussion, owner 17:15 |
| Hand-opened sessions through a SessionStart hook | Sessions opened by hand go through the composer by a SessionStart hook (claude, codex, agy); with no role they get the project's entry persona. | 2026-11-22 | same discussion, owner 17:45 |
| Two topics leave this design | The decision component for fixed-option judgments and the entry-persona UX flow are separate items. | 2026-11-22 | same discussion, owner 17:30 and 17:50 |
| The compose contract | The contract is `compose(StartRequest{facts, payloads, delivery}) -> StartContext \| Refusal`, every argument typed by a v1 schema; payloads are a closed union; delivery is an enum; refusals are named. | 2026-11-22 | same discussion, owner 19:37 and 19:50 |
| Two doors in: static rules and live contributors | Two doors in: static rules selected by `when:` facts, and live context from registered contributors with a budget and a timeout that fail open; one matcher for setup and start. | 2026-11-22 | same discussion, owner 19:50 |
| Slice order | Slice order: delete the dead Node mirror first, then spec and crate with every producer moved at once and the one-producer test, then doctrine by facts and the handoff as a contributor, then the AGENTS.md cut and the hand-opened hook. | 2026-11-22 | same discussion, owner 19:50 |
| Rules from the agent context engine; ASC the only selector | Static rules come from the Agent Context Engine, the one rule store; ASC is the only selector and the setup step (`fgctl init`, `fgos doctor --fix`) writes AGENTS.md through `compose`. | 2026-11-25 | [ACE discussion](../../../plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md), owner 15:51 |
| The key registry belongs to the agent context engine | Amends the compose contract: the fact key registry belongs to the Agent Context Engine; ASC fills values from live data, matches, and reads one checked effective rule set with a digest. | 2026-11-25 | ACE discussion, owner 16:35 |

The owner approval of 2026-11-22 that called ASC "the first slice of ACE"
([owner-approval-ace-boundary.md](../../../plans/261122-1946-agent-start-context/reports/owner-approval-ace-boundary.md))
is superseded by the 2026-11-25 decision that ACE and ASC are two components joined by a contract and kept as a record.
