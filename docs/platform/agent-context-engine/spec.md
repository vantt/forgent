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
Last reviewed: 2026-11-26
Related:
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/component-boundary.md
- plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md
- plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md
```

## 1. Purpose and scope

ACE (Agent Context Engine) is the one place that organizes, stores and manages every fgOS-owned rule, and keeps them
free of duplicates and conflicts. Scope is fgOS-owned rule text only; AgentKit, GitNexus and MDView text is
outside it. ACE knows no agent, writes no host file and selects nothing for a start.

Three roles, dependency order ACE ← ASC ← packaging-distribution:

| Role | Owns | Does not |
|---|---|---|
| ACE | rule units, owners, `when:` metadata and key registry, duplicate and conflict checks, the compiled set | write a file for a host, know which agent starts |
| ASC (agent start context) | taking start facts, selecting rules from ACE, gathering contributor context, ordering blocks | write a host file, own the keys |
| packaging-distribution | which file for which CLI, block markers, other tools' blocks, doctor drift rows | select a rule |

ACE never depends on ASC or on the documentation component. ACE links pkm directly and keeps its own rule
schema, apart from document identity.

## 2. Owner and tier

Owner: the agent-context-engine component, tier 3. Allowed dependencies: tier 3 or below, plus pkm. Its
component row and the four contract rows are declared in the authority model when the crate lands; the id
`agent-context-engine` is free today. The pkm store adapter sits behind a cargo feature so a reader links without it.

## 3. Ports

| Port | Does | Adapter |
|---|---|---|
| `RuleStore` | index the three roots, list rules in force, validate the graph | pkm (lifecycle classes, effective set, typed edges, rules R12, R14, R15, R16) |
| `NearestRules` | find the in-force rules nearest in meaning to a unit; write time only | pkm semantic search over the unit's own note (needs the embedding model) |
| `OwnerRegistry` | say whether an owner is a component or domain | component authority model |
| `ValueSource` | live allowed values for a `when:` key | supplied by the caller (ASC or host); ACE declares the source, never owns the data |

## 4. Rule schema

A rule unit is a Markdown file in `core/instructions/`, `components/<c>/instructions/` or `domains/<d>/instructions/`.
Frontmatter is [rule-unit.v1.json](../../../packages/agent-context-engine/contracts/rule-unit.v1.json): pkm type `rule`,
roles `id` (`id_scope: vault`), `lifecycle`, `valid_from`, `valid_to`, `superseded_by`; edges `refines`, `depends_on`,
`conflicts_with`, `related`; fgOS fields `owner`, `kind`, `mode`, `scope`, `specificity`, `when`.

`when:` maps a key to a list of allowed values (any-of); several keys all must match; empty or absent means always.
Keys are the registry [when-keys.v2.json](../../../packages/agent-context-engine/contracts/when-keys.v2.json), in three
groups, each key with a value type and a value source (decided 2026-11-25: ACE owns the `when:` key registry). What the
work is: `domain`, `workType` (the `classification.kind` of each domain registry), `workflow`, `stage`, `project`. Who
the agent is: `persona` (its charter; head names are persona values), `role` (its part in one workflow step, from each
domain registry's `roleGraph`), `sessionType` (`head`, `worker`, `hand-opened`), `agentFamily` (`claude`, `openai`,
`gemini`), `agentCli` (the agent-protocol adapter ids). When in its life the rules are put together: `agentLifecycle`
(`start`, `rotate`; hook-event moments join as data when something composes rules at that moment). How the text reaches
the agent (a file written at setup, a hook's injected output, an opening message, a CLI argument) is ASC's delivery, not
a key. Which keys a start supplies is ASC's start request, not here.

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

Structural refusals are hard and always run, over the whole corpus, in the crate (`check`), so every refusal has one
owning test there:

- `rule-unit-invalid`: the unit does not read: frontmatter, schema, a `superseded_by` that is not exactly one link.
- `rule-when-key-unknown`: a `when:` key is not in the registry.
- `rule-when-value-invalid`: a value is not allowed by the key's value source.
- `rule-owner-unknown`: the owner is not in the authority model.
- `rule-id-duplicate`: two units share an id.
- `rule-replacement-incomplete`: a replaced rule lacks `superseded_by` or `valid_to`, or its replacement is missing.
- `rule-dependency-not-in-force`: a `depends_on` or `refines` target is not in force.
- `rule-conflict-in-force`: two in-force rules are joined by `conflicts_with`.
- `rule-law-overridden`: a lower authority overrides or forbids a law without sealed supersession evidence.

### 6.1 Nearest-rule check

For each unit it is asked about, the check asks pkm which in-force rules are nearest in meaning to that unit (the
unit's own note, so the score is the note-to-note cosine the threshold was measured in; a text query is rescored by the
language pack and does not keep the cosine). The unit itself and rules not in force are dropped from the answer.

- `rule-near-duplicate` refuses the unit when the nearest rule scores at or above the pack profile's
  `audit.implicit.min` (0.93, pkm's default, declared in `packages/agent-context-engine/pkm/profile.yaml`, not a new
  config key) and neither rule declares a relation to the other. The message names the unit, the nearest rule with its
  score, and the fix. A relation is `superseded_by` (written on the old rule), `refines`, `depends_on`,
  `conflicts_with` (which then fails structurally until one side is retired) or `related`, meaning "checked,
  distinct"; it may be written on either rule. No new edge type exists for this.
- Below the threshold the semantic part is advisory. The probe of the embedding model on the real rule corpus found one
  of seven verified paraphrase pairs at 0.93 and four of seven among the top three hits, so the search is a recall
  aid there, not a duplicate gate. The top three hits below the threshold that score at least 0.84 are printed as
  candidates in the same output (`advisories` of the door) and never refuse. A paraphrase that scores under 0.93 and
  sits outside the top three is not caught; review is the backstop.
- `rule-search-unavailable` refuses when the search cannot run (no embedding model, no index). The message names the
  doctor fix `doc-locate-model-fetch`, the row that fetches the model `fgos doc locate` also uses. The check never
  skips the search silently. `compile` and the structural checks need no model.

`check` takes the units to search: `fgos internal context-engine check --paths <unit paths>` (repository paths, newline
separated in one value; an empty value names none), so a hook searches only the staged units. Without `--paths` every
unit is searched, which is what a build does. A unit that is not in force, and a lone rule with nothing to be near, are
not searched. A `--paths` entry that is not a unit of the three roots is refused as `rule-unit-invalid`.

### 6.2 Pre-commit hook

`.githooks/pre-commit` runs the door once per commit that stages a unit under `core/instructions/`,
`components/*/instructions/` or `domains/*/instructions/`: structural checks over all units, the nearest-rule search
over the staged ones (read from the working tree, not the staged blobs). A refusal refuses the commit; advisory
candidates are printed as warnings. The hook calls the activated host the way its other native calls do. A host that
does not carry the door, prints no answer, or fails refuses the commit and names the fix (activate a release that
carries the context-engine door); a rule unit is never committed unchecked.

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

| Topic | Decision | Date | Source |
|---|---|---|---|
| One place for rules and one for start context | ACE is the one place that organizes, stores and manages every rule and keeps them free of duplicates and conflicts; ASC is the one place that sets an agent's context at start. Two components joined by a contract. | 2026-11-25 | [ds-e26zcar63f](../../../plans/discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md) |
| Three roles | Three roles: ACE owns the store, ASC owns selection, packaging-distribution owns writing files. Order ACE ← ASC ← packaging-distribution. | 2026-11-25 | same |
| Own component | ACE becomes its own component with its own spec and authority row; the registry and checks leave packaging-distribution. | 2026-11-25 | same |
| Conflicts resolved at gathering | The 14 measured conflicts are resolved when the rules are gathered, not one by one now. | 2026-11-25 | same |
| Checked effective set and key registry | ACE hands ASC one checked effective set with a digest; refuses bad rules when written; owns the `when:` key registry. | 2026-11-25 | same; the start-door decision in [ds-2d55ty37zz](../../../plans/discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md) |
| pkm as rule-store engine | pkm is the engine of the rule store (typed graph, lifecycle classes, effective set, search); ACE links it directly and keeps its own schema; readers need no pkm. | 2026-11-25 | same |
| Semantic part of the write-time check is advisory below the threshold | `rule-near-duplicate` refuses at 0.93 and above (pkm's default); between 0.84 and the threshold the top three hits are printed as candidates and never refuse; without the embedding model the check refuses with `rule-search-unavailable` and the model-fetch fix, never skipping silently. The probe found paraphrase recall weak (one of seven pairs at 0.93, four of seven in the top three), so the contract does not promise paraphrase detection. | 2026-11-26 | `plans/261125-1631-agent-context-engine/reports/pkm-fit.md` |
| Hook gate for rule units | The pre-commit hook checks staged rule units through the host door and fails closed when the host lacks it. | 2026-11-26 | same |
| RUL102 (composition belongs to ACE, delivery stays in packaging-distribution) | Composition belongs to ACE, delivery stays in packaging-distribution, with a weight guard: the seed moves to its own module when the first budget or tiering slice lands. The own-component decision of 2026-11-25 is that move; a successor decision is recorded when the component is registered. | 2026-10-17 | [packaging-distribution spec](../packaging-distribution/spec.md) |
| when-key registry v2 | The registry has three groups. `workType`, `sessionType`, `agentFamily`, `agentCli` and `agentLifecycle` are added; `kind` and `cli` are removed (`setup` and `hook` are deliveries, not moments). `role` narrows to the part in a workflow step, from the domain `roleGraph`. `agentCli` values are the agent-protocol adapter ids, `agentFamily` is a static list extended by editing data. A set compiled with registry v1 is refused until recompiled. | 2026-11-26 | [ds-k435vz65l2](../../../plans/discussions/ds-k435vz65l2-when-key-rename/DISCUSSION.md) |
