# Agent Context Engine Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define the one store of every fgOS rule: its schema, checks, compiled effective set and contracts
Design status: Accepted
Implementation: Not built (contracts and vectors only)
Canonical: Yes
Owner: Agent-context-engine component (tier 3)
Source: packages/agent-context-engine
Contracts: packages/agent-context-engine/contracts/
Provenance: First written 2026-11-25
Writer type: Human + agent coauthor
Canonical for: Rule units, owners, when: keys, write-time checks, the compiled effective rule set and its digest
Use this when: Adding or changing a rule unit, a when: key, or the effective set that ASC reads
Do not use this for: Selecting rules for a start or gathering contributor context (agent start context); writing host files (packaging-distribution)
Last reviewed: 2026-11-25
Related:
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/component-boundary.md
- plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
- plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md
```

## 1. Purpose and scope

ACE (Agent Context Engine) is the one place that organizes, stores and manages every fgOS-owned rule, and keeps them
free of duplicates and conflicts (ACE-D1). Scope is fgOS-owned rule text only; AgentKit, GitNexus and MDView text is
outside it. ACE knows no agent, writes no host file and selects nothing for a start.

Three roles (ACE-D2), dependency order ACE ← ASC ← packaging-distribution:

| Role | Owns | Does not |
|---|---|---|
| ACE | rule units, owners, `when:` metadata and key registry, duplicate and conflict checks, the compiled set | write a file for a host, know which agent starts |
| ASC (agent start context) | taking start facts, selecting rules from ACE, gathering contributor context, ordering blocks | write a host file, own the keys |
| packaging-distribution | which file for which CLI, block markers, other tools' blocks, doctor drift rows | select a rule |

ACE never depends on ASC or on the documentation component. ACE links pkm directly (ACE-D6) and keeps its own rule
schema, apart from document identity.

## 2. Owner and tier

Owner: the agent-context-engine component, tier 3 (ACE-D3). Allowed dependencies: tier 3 or below, plus pkm. Its
component row and the four contract rows are declared in the authority model when the crate lands; the id
`agent-context-engine` is free today. The pkm store adapter sits behind a cargo feature so a reader links without it.

## 3. Ports

| Port | Does | Adapter |
|---|---|---|
| `RuleStore` | index the three roots, list rules in force, validate the graph | pkm (lifecycle classes, effective set, typed edges, rules R12, R14, R15, R16) |
| `NearestRules` | find the nearest in-force rules to a new unit; write time only | pkm search |
| `OwnerRegistry` | say whether an owner is a component or domain | component authority model |
| `ValueSource` | live allowed values for a `when:` key | supplied by the caller (ASC or host); ACE declares the source, never owns the data |

## 4. Rule schema

A rule unit is a Markdown file in `core/instructions/`, `components/<c>/instructions/` or `domains/<d>/instructions/`.
Frontmatter is [rule-unit.v1.json](../../../packages/agent-context-engine/contracts/rule-unit.v1.json): pkm type `rule`,
roles `id` (`id_scope: vault`), `lifecycle`, `valid_from`, `valid_to`, `superseded_by`; edges `refines`, `depends_on`,
`conflicts_with`, `related`; fgOS fields `owner`, `kind`, `mode`, `scope`, `specificity`, `when`.

`when:` maps a key to a list of allowed values (any-of); several keys all must match; empty or absent means always.
Keys are the registry [when-keys.v1.json](../../../packages/agent-context-engine/contracts/when-keys.v1.json): `kind`,
`cli`, `project`, `persona`, `role`, `domain`, `workflow`, `stage`, each with a value type and a live value source
(ACE-D5 (3)). Which keys a start supplies is ASC's start request, not here.

Decision on the component-scoped unit (`components/packaging-distribution/instructions/verification.md`): there is no
`component` key. The unit is owned by its component through `owner`, with `scope: component` and an empty `when:`; its
`appliesTo: ["*"]` becomes that empty `when:`, so today's repo projection stays byte-identical. A later narrowing by
component adds the key to the registry first.

## 5. Mapping of today's fields

| Today | Becomes |
|---|---|
| `supersedes: X` | on rule X: `lifecycle: replaced`, `superseded_by`, `valid_to` (R12) |
| `conflictsWith`, `dependsOn`, `refines` | pack edges `conflicts_with`, `depends_on`, `refines` |
| `appliesTo`, `scope` | `when:` keys; `scope` remains for specificity and authority order |
| `kind`, `mode`, `specificity`, `owner` | unchanged |

Composition semantics (roots, force, order, override and conflict rules) carry over from the packaging-distribution
instruction-composition contract §4-9.

## 6. Write-time checks

Every refusal below is raised when a rule is written (pre-commit, `check` verb), never at agent start. The codes are in
[refusals.v1.json](../../../packages/agent-context-engine/contracts/refusals.v1.json); each has a vector under
`contracts/vectors/refusals/`.

- `rule-when-key-unknown`: a `when:` key is not in the registry.
- `rule-when-value-invalid`: a value is not allowed by the key's value source.
- `rule-owner-unknown`: the owner is not in the authority model.
- `rule-id-duplicate`: two units share an id.
- `rule-replacement-incomplete`: a replaced rule lacks `superseded_by` or `valid_to`, or its replacement is missing.
- `rule-dependency-not-in-force`: a `depends_on` or `refines` target is not in force.
- `rule-conflict-in-force`: two in-force rules are joined by `conflicts_with`.
- `rule-law-overridden`: a lower authority overrides or forbids a law without sealed supersession evidence.
- `rule-near-duplicate`: the nearest in-force rule scores above the threshold (pkm default 0.93) and the unit declares
  no relation to it.
- `rule-search-unavailable`: the nearest-rule search cannot run; the check does not pass silently.

## 7. Compile step and digest

At build or setup time ACE compiles pkm's effective set into
[effective-rules.v1.json](../../../packages/agent-context-engine/contracts/effective-rules.v1.json): schema version, the
`when-keys` version it was checked against, a digest, and the in-force rules in composition order, each with id,
owner, kind, scope, specificity, body, sources and `when:`. Digest = sha256 hex of the canonical JSON (sorted keys, no
whitespace, UTF-8) of the `rules` array. The vector `vectors/effective-set.json` carries one set and its digest.

## 8. Read path

A reader (ASC) opens one JSON file. It needs no pkm and no embedding model. It recomputes the digest and refuses with
`rule-set-digest-mismatch`, or with `rule-set-version-unsupported` when `schemaVersion` or `whenKeysVersion` is not
supported. A reader never re-checks rules; checking is the writer's job.

## 9. Lịch sử quyết định

| ID | Decision | Date | Source |
|---|---|---|---|
| ACE-D1 | ACE is the one place that organizes, stores and manages every rule and keeps them free of duplicates and conflicts; ASC is the one place that sets an agent's context at start. Two components joined by a contract. | 2026-11-25 | [ds-e26zcar63f](../../../plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md) |
| ACE-D2 | Three roles: ACE owns the store, ASC owns selection, packaging-distribution owns writing files. Order ACE ← ASC ← packaging-distribution. | 2026-11-25 | same |
| ACE-D3 | ACE becomes its own component with its own spec and authority row; the registry and checks leave packaging-distribution. | 2026-11-25 | same |
| ACE-D4 | The 14 measured conflicts are resolved when the rules are gathered, not one by one now. | 2026-11-25 | same |
| ACE-D5 | ACE hands ASC one checked effective set with a digest; refuses bad rules when written; owns the `when:` key registry. | 2026-11-25 | same; ASC-D9 in [ds-2d55ty37zz](../../../plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md) |
| ACE-D6 | pkm is the engine of the rule store (typed graph, lifecycle classes, effective set, search); ACE links it directly and keeps its own schema; readers need no pkm. | 2026-11-25 | same |
| RUL102 | Composition belongs to ACE, delivery stays in packaging-distribution, with a weight guard: the seed moves to its own module when the first budget or tiering slice lands. ACE-D3 is that move; a successor decision is recorded when the component is registered. | 2026-10-17 | [packaging-distribution spec](../packaging-distribution/spec.md) |
