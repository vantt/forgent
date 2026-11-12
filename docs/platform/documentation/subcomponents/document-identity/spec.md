# Document Identity Specification

```txt
Document type: BA-grade subcomponent specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define how a project run by fgOS places every piece of maintained documentation in a space of axes, so that a writer finds the document that already holds what it wants to write before it may create a new one, and so that the space improves itself over time
Design status: Signed by the owner on 2026-11-12. A change is recorded as a new entry in section 17, decision history.
Implementation: Not started in fgOS. The search and graph it relies on exist outside fgOS and were measured on the fgOS corpus on 2026-11-12: OHS (the owner's fork, release v0.17.2-vantt.9, with ohs-lang-vi) and pkm (vantt/pkm, release 0.1.0); the fgOS locate door, the write-door refusal, the claim-unit retrospective writer and the observer do not exist yet
Canonical: Yes
Provenance: Written by the DOCOS lead after the owner asked for a dedicated spec on 2026-11-12, from the documentation area draft, the 2026-08 identity-axis discussion, measurements of docs/doc-registry.json and the maintained corpus, a locate prototype, a recall measurement with an independent gold set, and an end-to-end A/B/C trial with 78 agent runs on 2026-11-12 (plans/reports/measurement-261112-1314-docos-document-identity-recall.md)
Writer type: Agent draft writer
Canonical for: The four stops, user knowledge units that carry one claim, the axis model and its common value sets, the identifier kinds and their registers, locate before write through pkm with OHS, and the self-improvement loop
Use this when: Deciding where a piece of documentation belongs, reviewing the locate verb or the search view, adding a domain profile, or changing an axis value set
Do not use this for: Path and placement rules (Convention), the write-door steps around this subcomponent (documentation area spec), or user-document lifecycle (knowledge-registry contract)
Last reviewed: 2026-11-12
Related:
- docs/platform/documentation/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/convention/spec.md
- docs/platform/component-boundary.md
- docs/platform/platform-foundations.md
- docs/platform/observe/spec.md
- docs/history/compound-learn-artifact-registry/DISCUSSION.md
- plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md
- plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md
```

Read with: [documentation area spec](../../spec.md), [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md), [Convention spec](../../../convention/spec.md), [component boundary](../../../component-boundary.md), [platform foundations L3](../../../platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view), [observe spec](../../../observe/spec.md), [2026-08 identity discussion](../../../../history/compound-learn-artifact-registry/DISCUSSION.md), [2026-08 advisor brief](../../../../../plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md), [2026-11-06 panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md).

## 1. Current Summary

Documentation grows by copies when a writer cannot find what already exists, or finds it and still writes a new file. The same statement then lives in two or three places that drift apart. In fgOS the largest source is built in: the retrospective writer reserves one document per work item, so the corpus grew with the number of items (479 topics for 479 documents; about 50 new documents a week in 2026-08).

This subcomponent answers one question for every write: **which existing unit already holds what I want to write?** It answers in two steps: a search through one door narrows the corpus to ten candidates, and the writer reads them and decides.

Four stops hold the corpus together. Each targets a measured cause:

| # | Stop | Cause it targets | Evidence |
|---|---|---|---|
| 1 | **A user knowledge unit carries one claim**; the retrospective writer adds evidence to the unit that already carries its claim and never writes a story per item (8.7) | one document per work item, by design | the writer reserves a slot per item; 479 for 479 |
| 2 | **Locate before write** through the one search door (pkm with OHS), on a draft in the corpus's language, returning ten candidates the writer reads (8.1) | not finding, or misjudging, the existing unit | right decisions rose from 50% (grep) to 73%, with about 10,000 fewer tokens per write |
| 3 | **Creation only through [admission](../admission/spec.md)**, inside a frame with a weekly ceiling (at most 5 new topics or sub-areas a week) | a writer judging a known subject "different enough" | a hard ceiling: a wrong judgement cannot grow the corpus past it |
| 4 | **Closed locating axes and an observer** that proposes merges, moves and splits (8.5) | names minted by writers; units grown in the wrong place | no writer names a new place; structure changes go through admission with lineage |

What no stop removes is the judgement "are these two close claims one or two". The design does not pretend to remove it; it bounds its cost: a wrong create meets the admission ceiling, a wrong grow is found and moved back by the observer.

The model of the space is a **faceted classification with controlled vocabularies**, as libraries use (section 5.8), not an ontology with reasoning. A unit has a position on:

- **locating axes** (*trục định vị*): closed value sets, opened only through a reviewed door: the area the content is about and the kind of question it answers. They narrow the search and organise the corpus;
- **narrowing axes** (*trục thu hẹp*): many values per unit, drawn from identifiers that resolve against a register: decision ids, rule ids, defined terms, feature names, and per domain CLI verbs, code symbols, campaigns or price plans. They add to the ranking and tell apart units that look alike; full text and meaning carry the ranking itself, because identifiers alone found the right unit in only 32% of cases.

The model has three tiers, so it serves any project fgOS runs, not only fgOS itself (D-ADR0035 (the fgOS mission boundary)):

1. a **core** shared by every project (section 5);
2. a **domain profile** per kind of work: coding, marketing, sales, customer support (section 6);
3. a **project instance** with that project's real values (section 7 is the fgOS repository's).

fgOS owns the structure and the rules; the mechanism comes from two providers it calls through its tool registry: **OHS** for hybrid search (BM25 with the Vietnamese pack, plus embeddings) and **pkm** for the graph and the one search door over both (section 8.2). What fgOS needs from pkm is written as a requirement: [fgOS to pkm requirements](../../../../../plans/reports/requirements-261112-1533-fgos-to-pkm-structure-mechanism.md).

## 2. Why this spec exists: the earlier axes and what they did

The 2026-08 discussion chose four labels for user documents ([advisor brief, section 3](../../../../../plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md)):

| Label | Values | Used as |
|---|---|---|
| Purpose | one, open, expected to grow slowly | folder |
| Role | one, closed with a soft door | file name |
| Entity | many | frontmatter tag |
| Framework and mode | one per framework | frontmatter, not identity |

Measured on `docs/doc-registry.json` on 2026-11-12:

| Measure | Value | Meaning |
|---|---|---|
| Documents / topics | 479 / 479 | one topic per document |
| Distinct purposes | 479 | the open address axis gave every document its own address |
| Distinct roles / roles used once | 365 / 362 | the soft door ("propose, write anyway") never closed the set |
| Documents with any entity | 0 | the many-valued axis, the one that could join documents, was never filled |

The axes were not wrong. Four things failed:

1. Both address axes behaved as open sets, so every write minted a new address.
2. The axis that joins documents across addresses was left empty, because filling it depended on the writer.
3. The axes were used to **name** a new file, never to **find** an existing one. The writer decided "create or grow" by checking whether its own freshly named path existed, so the answer was almost always "create".
4. Structure changed from the writer's side: refusal messages told the writer to split a topic, so splitting became the way past a refusal.

This spec keeps the idea of several axes and fixes those points: locating axes are closed, narrowing values are filled by a machine and must resolve, lookup happens before write and is enforced by the harness, and structure changes come only from the observer.

## 3. Scope

### 3.1. In scope

- The three-tier model and the core axes with their common value sets (section 5).
- The domain profiles for coding, marketing, sales and customer support (section 6).
- The fgOS repository instance (section 7).
- Locate, the search view, the write-door refusal, filling and checking the axes (sections 8.1 to 8.4).
- Self-improvement of areas and identifiers (section 8.5).
- The measurement that gates signing (section 15).

### 3.2. Out of scope

- Path and file-name rules. Convention owns them; this spec consumes `fgos convention classify`.
- The steps of the write door around locate. The documentation area spec owns them.
- User-document lifecycle (`reserved`, `provisional`, `active`, `superseded`, `retired`). The knowledge-registry contract owns it; lifecycle is an attribute here, not an axis.
- Moving or merging the 479 existing user documents. A later item, after signing; once built, the observer of section 8.5 proposes those moves.
- Durable per-claim identity. Coordinates identify a document section, not a single sentence.
- Embeddings. Section 8.2 says when they may be proposed.

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| Writer (documentation skill, retrospective writer) | Call locate; read candidates; grow a document; request creation through admission | Create a document without a locate result; set narrowing values by hand as the only source; change areas, kinds or registers to get past a refusal |
| Locate verb | Read the search view and the axis tables; return coordinates and ranked candidates; append to the locate log | Write documents; grant creation |
| Indexer (part of doc-health) | Read documents; extract narrowing values; rebuild the search view | Change document text |
| Observer | Read the search view, the locate log and the registry; open proposal items | Apply a structural change itself |
| Admission reviewer ([admission](../admission/spec.md)) | Decide creations and in-frame proposals; read the locate result and the writer's reason | Admit a creation without a locate result and a reason; decide a proposal outside the frame |
| Domain profile owner | Maintain a domain extension under `domains/<domain>/`: added kinds, starter areas, subdivisions | Change the core or a standard profile in this spec |
| Owner | Change the core; approve frames; decide out-of-frame proposals in batches | — |

## 5. Core Model

### 5.1. The three tiers

| Tier | Holds | Owned by | Changes when |
|---|---|---|---|
| Core | the axes, the `question` and `audience` value sets, the common identifier kinds, the rules | this spec | the owner decides |
| Domain profile | identifier kinds and their registers for one kind of work, starter areas, audience subdivisions | standard profiles in this spec (section 6); extensions and new domains under `domains/<domain>/` | a standard profile changes with this spec; an extension by its domain owner, or the observer proposes and the owner approves |
| Project instance | the project's `area` values, the mapping from `question` to its document kinds, its registers' content | each project | through admission and the observer |

A project uses the core, one or more domain profiles, and its own instance. The fgOS repository uses the core, the coding profile, and the instance in section 7.

### 5.2. The unit that carries coordinates

Two kinds of unit, by document kind:

- **Composite documents** (specs, contracts, guides, platform documents): a **section** carries coordinates, the text under one heading down to the next heading of the same or higher level. A document's locating values are those most of its sections share; a section may override `question` (a spec's decision-history section is `choice`). Composite documents are not split: their sections already hold one subject each, and their rules are already atomic through rule ids.
- **User knowledge units** (`docs/knowledge`, `docs/explanation` and the retrospective writer's output): one unit carries **one claim**, a single fact, rule, failure mode, decision or procedure, stated in its title. The unit holds the current statement of the claim and a list of **evidence**: links to the work items, decisions and incidents that showed it. A unit is identified by the claim it carries, found by locate and confirmed by reading; never by a topic name and never by a durable claim id (deferred by the owner on 2026-11-06).

Today's user documents are small (median about 1,300 tokens) but shaped as stories: one per work item, each touching two or three claims. That shape is why "grow or create" is unclear for them, and why the A/B/C trial's remaining errors were grows into a neighbouring story (section 15).

Why a section and not a whole document: a spec of 200 KB answers many questions, and ranking it as one unit hides the one section that already holds the statement. Why not a sentence: sentences have no stable boundary, and the 2026-11-06 panel advised against durable per-claim identity.

### 5.3. Axis overview

| Axis | Kind | Values per section | Value set | Who sets it | Tier that holds the values |
|---|---|---|---|---|---|
| `area` | locating | exactly one | closed, opened by admission | derived from path; for new content, chosen by the writer from the closed list | project instance (rules in 5.7) |
| `question` | locating | exactly one | closed | writer, checked against the document kind | core (5.4) |
| `audience` | surface, not identity | one or more | closed, subdivided per project | derived from root and document kind | core (5.5), subdivisions in the instance |
| `identifiers` | narrowing | many | open, but every value must resolve | extracted by the indexer | kinds in core (5.6) and profiles (6), values in registers |
| `lifecycle` | attribute | exactly one | closed | registry or header | knowledge-registry contract |

`audience` decides how a section is **shown**, never who owns it.

### 5.4. Locating axis `question`

The kind of question the content answers. The owning document kind follows from it; each project maps these values to its own document kinds (section 7.2 for fgOS).

| Value | The question | Software example | Business example (marketing, sales, support) | Maintained authority? |
|---|---|---|---|---|
| `current-truth` | What is true now? | a behavior, a state model | the current price list, what is on sale | yes |
| `obligation` | What exact obligation applies? | an API contract | brand guideline, SLA, refund policy | yes |
| `rationale` | Why does it have this shape? | an architecture choice | why the product is positioned this way | yes |
| `choice` | What was decided, and what did it supersede? | a decision record | dropping a price plan, choosing a channel | yes |
| `direction` | What direction is intended? | vision, roadmap | quarterly strategy, marketing roadmap | yes |
| `procedure` | How is a task carried out step by step? | a runbook | a sales call playbook, ticket handling | yes |
| `pitfall` | What goes wrong, how it shows, how to avoid it? | a known failure mode | common objections, onboarding mistakes | yes |
| `lookup` | Which value, code or option applies? | an error-code table | discount codes, canned answers | yes |
| `proof` | What shows this works? | verification evidence | a case study, campaign results | yes |
| `navigation` | Where should a reader go next? | a portal, a reading map | the sales team's document hub | yes, links only |
| `past-state` | What was true or proposed before? | history, an old proposal | a finished campaign | no |

Rules:

- `past-state` content is never a locate target for a write that asserts current truth. It is searchable for provenance.
- A section whose `question` does not fit its document kind is a finding (for example `procedure` steps inside a `current-truth` section). The writer moves it to the owner of that question.
- A new value is a core change, decided by the owner.

### 5.5. Surface axis `audience`

| Value | Who | Surface | Rule |
|---|---|---|---|
| `agent` | an agent working on the project | distilled: agent instructions, skill references, briefs | generated from or linking to the owner, never a hand copy |
| `internal` | people who make or run the product: developers, sales, support staff | full | owns the truth about how the product works and how the team works |
| `external` | customers, users, partners | full | owns the steps a customer follows; links to the owner for facts |

A project subdivides `internal` and `external` when its surfaces differ, for example `internal:developer`, `internal:support`, `external:customer`, `external:partner`. Subdivisions are declared in the project instance.

The same fact is never owned twice because two audiences read it. A customer how-to owns the steps (`procedure`) and links to the section that owns the facts (`current-truth`).

### 5.6. Narrowing axis `identifiers`: what counts, and the common kinds

An identifier is **a name that some register can confirm**. The indexer extracts values; a value that does not resolve against its kind's register is a finding, so the axis cannot fill with invented words.

A kind of identifier belongs in the core when it meets all three tests:

1. every domain has it;
2. a register exists or can be kept for it, ideally one fgOS already keeps;
3. it names **what** something is about, not **when** it was learned.

Common kinds:

| Kind | Example | Register | Register kept by fgOS today? |
|---|---|---|---|
| `decision` | D-ADR0055 (event log as sealed changesets on per-machine refs); the decision to drop the Basic plan | decision index, `state.decisions`; ids minted by `fgos identity mint d-adr` | yes |
| `rule` | RUL84 (one write-scope matcher), `L3`, refund policy rule 3 | the holder document, through the governance holder table; laws fold in here | yes |
| `term` | "churn", "seat", "claim" | the project glossary (Convention kind `vocabulary`) | the place exists, content does not |
| `feature` | "automatic invoice export" | the feature list | no |
| `metric` | MRR, locate hit rate | the metric catalog with definitions | no |
| `objective` | objective A4 of a proposal, a quarterly OKR | the objective register | partly (proposals, backlog) |
| `tool` | Stripe, HubSpot, herdr | the tool or external-system register | yes (`fgos tool query`) |
| `role` | approver, tier-2 support agent | the role list or RACI table | no |
| `release` | v0.2.0, the November launch | changelog, tags | yes |
| `document` | a link to another document | the registry and Convention | yes |

Rules:

- **Not identifiers:** person names (privacy, and people change jobs; use `role`), customer names (use the account id), work-item ids (they say when, not what; kept as provenance).
- **`term` carries non-technical domains.** Marketing and support have few code-like ids; what they share is defined vocabulary.
- **A register can be a document.** A `lookup` document (glossary, product catalog, price list) is a register: each row is a value that resolves. A project with no registers starts with full-text ranking and grows registers through the observer (section 8.5.3).
- **Bridging kinds** join domains: `feature` links a spec, a support article and a sales sheet about the same capability.
- **Weights.** A shared value counts by rarity times a per-kind coefficient: weight = ln(sections / sections carrying the value) × coefficient(kind). The coefficients are set and later adjusted from measurement (sections 8.5.3 and 15), never by hand.
- **Role in ranking.** Identifiers are a boost on top of the search ranking (8.1), and a precision signal between look-alike units; they are not the ranking. Measured on the fgOS gold set, identifier overlap alone put a same-subject document in the top 3 for 31.8% of queries, because user documents are prose with few identifiers.
- Values are filled by the indexer, never only by the writer. A writer may add a value the extractor cannot see; it must still resolve.

### 5.7. Locating axis `area`: rules

`area` is the part of the product or business the content is about. The value set belongs to each project.

- **Closed, opened by admission.** A new value comes with an overview document that says what the area covers. For a software project that document is the area spec; for a business it can be a short area overview.
- **Seeded at setup.** A new project does not start empty. `fgos setup` proposes a starter set from what already exists: the code tree or component map for software; product lines, functions and channels for a business; the domain profile's starter areas when nothing exists yet. The owner approves the starter set once.
- **No catch-all.** There is no `general` or `misc` value. Content that fits no area is a signal for the observer (section 8.5.2), not a place.
- **Chosen by the writer from the closed list.** For new content, the writer picks `area` from the project's value list, using each value's one-line description (table 7.1 for fgOS); locate checks only that the value exists. A wrong pick is caught by the `outside-region` rule of 8.1. There is no table that maps code paths or other changed things to areas in this version (section 13, question 4).
- **Sub-areas.** An area may carry one closed second level, never a third. A sub-area is opened like an area, with its own overview document and admission; the observer proposes it when an area grows too large (8.5.2), a writer never creates one. For software, sub-areas follow existing subcomponent boundaries where they exist (the fgOS runner area has 8). A user-document slot is then (area, sub-area, question), for example the path docs/knowledge/runner/worktree/pitfall.md.

### 5.8. What kind of model this is

The model is a **faceted classification with controlled vocabularies**, the method libraries use to find things:

| Part of this model | Library term |
|---|---|
| Locating axes (`area`, `question`, `audience`) | facets, in the manner of Ranganathan's faceted classification |
| Registers of narrowing values | authority files and thesauri |
| Aliases, merged names | preferred and alternative labels (`prefLabel`, `altLabel` in SKOS) |
| Sub-areas | broader and narrower terms |
| Admission and the observer | a vocabulary editorial board; "literary warrant": add a term only when real documents need it |

It is **not an ontology with reasoning**: no typed relations between concepts with axioms and inference. Such models cost an owner for every relation and tend to die unmaintained; the goal here, finding the existing unit, is met by facets and vocabularies. Registers take the **SKOS shape** with labels per language (`prefLabel@en`, `altLabel@vi`); those labels also feed the OHS Vietnamese pack's lexicon, so lexical search can bridge a Vietnamese note and an English unit.

## 6. Domain Profiles

A domain profile adds identifier kinds with their registers, starter areas, and audience subdivisions. The four profiles below are the **standard set** and live in this spec, so the model reads as one document. A project extends them, or adds a new domain, under `domains/<domain>/`; an extension adds kinds, starter areas or subdivisions and never removes or redefines a standard value. Values apply in this order: core, standard profile, domain extension, project instance; the project instance wins, as in configuration.

The coding profile is measured; the other three are starter drafts, to be measured on a real project before they bind.

### 6.1. Coding

Measured over the fgOS repository's 687 maintained documents (platform, knowledge, explanation, how-to, tutorials, reference; history and verification excluded) on 2026-11-12:

| Kind | Example | Register | Distinct values in docs | Documents using it | Status |
|---|---|---|---|---|---|
| `cli-verb` | `fgos run` | the CLI's command listing (`fgos --help --json`, 80 commands) | 100 | 420 | in; dead verbs become a rule in [doc-checks 6.2](../doc-checks/spec.md#62-verb-reference-rule) |
| `path` | `src/state/store.mjs` | `git ls-files`, or a pinned commit on the same line | 715 | 436 | in; dead paths already a doc-health rule |
| `symbol` | `applyKnowledgeEvent` | code index (GitNexus where present, else a source scan) | 1749 | 495 | in |
| `env` | `FGOS_HOST_BIN` | configuration and secrets registries | 36 | 46 | in |
| `config-key` | `gates.bypass` | configuration schema | not measured cleanly | — | in after a schema-backed extractor exists; a plain dotted-word scan mixes in file names |
| `api-endpoint` | `/v1/contract` | API description (OpenAPI or route table) | not measured | — | in |
| `error-code` | `lock-held` | error and result code registers | not measured | — | in |
| `event-type` | `case.opened` | event schemas | not measured | — | in |

Common kinds measured on the same corpus: `rule` 150 distinct values in 73 documents (key is (holder, id), because ids repeat across holders); `decision` 48 in 27; laws `L1`–`L10` 10 in 36. Work-item ids: 806 in 512, excluded as provenance.

Starter areas: from the component map or the top-level source folders. Audience subdivisions: `internal:developer`, `external:user`.

### 6.2. Marketing

| Kind | Example | Register |
|---|---|---|
| `campaign` | the November launch campaign | campaign register |
| `channel` | `channel-facebook`, newsletter | channel list |
| `persona` | "solo founder" | persona set |
| `asset` | the launch banner | asset library |
| `keyword` | a target SEO keyword | keyword set |

Starter areas: brand, each product line, each active channel. Audience subdivisions: `internal:marketing`, `external:prospect`.

### 6.3. Sales

| Kind | Example | Register |
|---|---|---|
| `product` | a product or SKU | product catalog |
| `plan` | the Pro plan | price list |
| `competitor` | a named competitor | competitor list |
| `deal-stage` | "proposal sent" | CRM pipeline stages |
| `objection` | "too expensive for a small team" | objection library |

Starter areas: each product line, pricing, partners. Audience subdivisions: `internal:sales`, `external:customer`, `external:partner`.

### 6.4. Customer support

| Kind | Example | Register |
|---|---|---|
| `ticket-category` | billing, login | helpdesk categories |
| `macro` | the refund reply | canned-answer library |
| `known-issue` | a known export bug | known-issue list |
| `sla` | first reply within 4 hours | SLA commitments |

Starter areas: each product line, billing, account. Audience subdivisions: `internal:support`, `external:customer`.

Cross-domain links worth keeping: a support `known-issue` may point to a coding `error-code`; a sales `plan` may point to the `config-key` that enforces its limits; all four profiles share `feature`.

## 7. The fgOS Repository Instance

### 7.1. `area` values

The set of platform areas, plus `platform` for documents that govern all areas. 34 directories exist under `docs/platform/`; 30 carry an area spec. Four are not areas and are not values: `domainization`, `history`, `proposals` and `system-architecture` hold collections, history or proposals about several areas.

| Value | What it covers | Maintained docs today |
|---|---|---|
| `platform` | laws, governance, vision, reading map, system-wide rules | root files |
| `agent-confinement` | the one runtime door that confines an agent process | 5 |
| `agent-coordination` | coordination playbooks; routes current execution to runner owners | 429 |
| `agent-mailbox` | message delivery between live agent sessions on one machine | 1 |
| `agent-protocol` | per-CLI adapters that read what an agent CLI showed | 1 |
| `claude-plugin` | the Claude Code plugin surface and slash commands | 2 |
| `coexistence` | running fgOS beside another agent harness in one project | 1 |
| `config` | configuration files, schema, precedence and writers | 1 |
| `convention` | names and placement of repository artifacts | 1 |
| `decision-citation-drift` | the check for stale decision citations | 2 |
| `distillery` | reference learning from external sibling projects | 2 |
| `documentation` | the documentation write door and this subcomponent | 19 |
| `event-store` | event durability, sealing, refs and reads | 1 |
| `git` | repository operations and recovery | 1 |
| `herdr-web-dashboard` | the herdr web dashboard | 4 |
| `holder-lock` | the single port for cold locks | 1 |
| `host-invocation-routing` | how a host invocation reaches the right release and verb | 34 |
| `identity` | minting and resolving machine, project, clone and session ids | 1 |
| `observe` | observation, friction and metrics | 3 |
| `packaging-distribution` | install, release, setup and doctor | 25 |
| `process` | process liveness and signalling | 1 |
| `runner` | execution core, dispatch and runs | 19 |
| `run-supervisor` | the per-attempt process that owns a launched agent | 1 |
| `seat-binding` | what a seat runs on | 1 |
| `secrets` | where a secret lives and who may resolve it | 1 |
| `system-overview` | area map, shared entities, cross-area flows | 1 |
| `terminal-control` | which pane a key runs in | 1 |
| `ui-spec` | UI specifications | 17 |
| `workflow` | guide, case and admission for workflows | 1 |
| `work-state` | work items, stages, verbs and their rules | 8 |
| `yaml-document` | byte-preserving YAML reads, edits and merges | 1 |

A value is added only together with its area spec and its row in the [component boundary](../../../component-boundary.md). User documents (`docs/knowledge`, `docs/explanation`, `docs/how-to`, `docs/tutorials`, `docs/reference`) take their `area` from this same table (section 13, question 2).

### 7.2. `question` to document kind

| `question` | Platform document kind (Convention) | User-document role |
|---|---|---|
| `current-truth` | `spec` | — |
| `obligation` | `contract` | — |
| `rationale` | `architecture` | `pattern` |
| `choice` | `decision`, a spec's decision-history section | `decision` |
| `direction` | `vision`, `roadmap`, `intent-preservation-ledger` | — |
| `procedure` | `guide-runbook` | `runbook` |
| `pitfall` | a spec's edge-case section | `pitfall` |
| `lookup` | `vocabulary`, `generated-doc` | `lookup-table` |
| `proof` | `verification`, `evidence-payload` | `evidence` |
| `navigation` | `platform-portal`, `area-portal`, `subcomponent-portal`, `collection-index`, `portal`, `reading-map` | — |
| `past-state` | `history`, `proposal`, `discussion-scratchpad` | — |

The six user-document roles the owner admitted on 2026-11-06 map one to one onto six values, so no role is lost and none is added.

### 7.3. `audience` subdivisions

| Subdivision | Surface |
|---|---|
| `agent` | `AGENTS.md`, instruction seeds under `core/instructions`, skill references |
| `internal:developer` | `docs/platform/` |
| `external:user` | `docs/user/`, `docs/tutorials/`, `docs/how-to/`, `docs/knowledge/`, `docs/explanation/`, `docs/reference/` |

## 8. Behaviors And Operations

### 8.1. Locate (before every write)

```txt
Runs when: the write door's owner-finding step, before any grow or create; also by hand.
Blocked when: never; it only answers.
What changes: nothing in documents; one entry in the locate log; the result is attached to any creation request.
Afterwards / side effects: returns up to ten candidate units with their best sections.
```

Input: the writer's **draft** of what it wants to add (a paragraph or more, not a one-line statement), the diff when there is one, and optional `area` and `question`.

Steps:

1. **Write the draft in the corpus's language.** The writer translates its draft into the language most of the corpus is written in (English for fgOS) before calling. Measured: Vietnamese notes over English documents put a right unit in the top 3 for 0% of queries as written and 91.7% after translation; sending both languages at once scored 62.5%, worse than English alone.
2. **Search through the one door:** pkm's search over OHS, hybrid (BM25 with `ohs-lang-vi`, plus `multilingual-e5-small` embeddings), ranked at the **document** level with the best sections kept, then expanded through the graph to the units the hits link to. Document-level ranking beat section-level ranking for short queries (71.6% against 62.5% at top 3).
3. **Filter or flag by locating axes.** With `area` and `question` given, candidates outside them are kept but marked `outside-region`, because the writer can choose the wrong region (example 8.6.2).
4. **Boost by narrowing values** extracted from the draft and the diff (5.6).
5. **Return the top 10** with path, title, best sections and their heading paths, axis values and per-branch scores. Reading ten titles is cheap; the writer opens one to three.
6. **Log** the draft's identifiers, the region, the candidates, and, when the writer finishes, the unit it grew or the creation it requested.

There is **no verdict from the score**. Queries about subjects with no unit scored as high as queries with one (0.74 to 1.00 against a median of 0.956). The writer reads the candidates and decides: grow the unit that carries the claim; ask with the decision-question template when two candidates fit; request creation from admission, with one sentence on why no candidate carries the claim, when none fits.

### 8.2. The search view

fgOS does not build its own search engine. It calls two providers through the tool registry, the way it calls GitNexus for impact analysis:

| Provider | Gives | What it is |
|---|---|---|
| **OHS** (`vantt/obsidian-hybrid-search`, the owner's fork) | hybrid search: BM25 over FTS5 with the `ohs-lang-vi` pack (normalisation, tone restoration, Telex and VNI, typos, synonyms, word segmentation), embeddings in sqlite-vec, RRF fusion | SQLite file, rebuildable from the documents; a Node process with a stdio server |
| **pkm** (`vantt/pkm`, release 0.1.0) | the one search door over OHS, the note graph (Markdown links), near-meaning pairs, zones, rule-based proposals | Rust library and CLI with a SQLite index |

Both indexes are caches rebuilt from the documents, never truth, as platform-foundations L3 clauses 2 and 3 require. They live under `.fgos/runtime/`, and a `fgos doctor` check reports their freshness and the providers' presence, as the install/setup/doctor gate requires.

Choices, from the measurements and the owner's fork's own model evaluation (its report V22, 2026-11-02):

- **Embedding model:** `multilingual-e5-small` (about 117 MB, CPU). With the Vietnamese pack it matched larger models on Vietnamese and is the cheapest. `bge-m3` stays an option for human users searching across languages; fgOS agents translate instead.
- **No reranker.** It adds about 150 ms per query, about 600 MB of download and up to 900 MB of memory, for little gain; the writer's reading is the judge.
- **Indexing cost:** the fgOS corpus (691 documents) indexed in about 7.5 minutes on CPU, then incrementally; 6 documents with invalid YAML frontmatter were skipped and are reported by doc-checks.

What pkm must add for fgOS (structure declaration, placement, notes without YAML frontmatter, a locate call, the structure overview, structural proposals into a pluggable sink, a library-first API, read-only behaviour) is in the [requirements to pkm](../../../../../plans/reports/requirements-261112-1533-fgos-to-pkm-structure-mechanism.md).

### 8.3. Refusal at the write door

The write door refuses to create a document, a registry topic or a slot when:

- no locate result for this change is attached; or
- the request carries no sentence from the writer on why none of the returned candidates carries the claim.

Whether that sentence holds is the [admission](../admission/spec.md) reviewer's decision, inside the frame and its weekly ceiling; not a score threshold.

The locate result is recorded on the creation, next to the admission record of [admission 6.5](../admission/spec.md#65-the-admission-record-and-the-checks-at-the-doors). Growing an existing section needs no admission and no refusal check beyond doc-health. A refusal message never suggests changing an area, a kind or a register; it points to the candidates.

### 8.4. Filling and checking the axes

doc-health gains three duties, run on changed documents and in full on the live test:

1. Extract narrowing values and update the view.
2. Report a narrowing value that does not resolve (extends today's dead-verb and dead-path rules to every kind).
3. Report a section with no `area`, a `question` outside table 5.4, or a `question` that does not fit its document kind.

Locating values for existing fgOS platform documents come from their path and Convention kind; no hand tagging of the 618 platform documents is needed. User documents get `area` and `question` in their frontmatter when they are next grown; until then their `question` comes from their role and their `area` is unset, which locate treats as matching any area.

### 8.5. Self-improvement

#### 8.5.1. The loop

```txt
Runs when: on a schedule shared with doctor or the retrospective loop; also by hand.
Blocked when: never; it only proposes.
What changes: opens proposal work items; changes nothing in documents, areas or registers by itself.
Afterwards / side effects: in-frame proposals go to the admission reviewer; out-of-frame proposals are batched for the owner.
```

1. **Observe.** The observer reads the search view, the locate log and the registry.
2. **Propose.** Each signal that persists becomes one work item with its measurements as evidence and the list of affected sections.
3. **Decide.** The admission reviewer decides proposals inside the approved frame. Proposals outside it are batched into one owner question set, each in the decision-question template.
4. **Apply.** An accepted proposal is carried out through the existing doors (registry `topic split`, `merge`, `rename`, `doc path-move`, register edits through the write door), keeping lineage so an old path still resolves to its new place. Links are rewritten; doc-health runs after each change. A conservation guard from the 2026-08 design applies to every move or merge: each source section appears exactly once at the target or in a recorded exclusion.
5. **Measure.** Three numbers are tracked over time: the locate hit rate (the writer grew a top-3 candidate), the `outside-region` rate, and the count of section pairs above the duplicate threshold. If they do not improve, structural moves stop and the owner is told.

Guards against churn:

- a signal must persist across several runs before it becomes a proposal;
- moves have a weekly budget set in the frame;
- the writer never triggers a structural change; only the observer proposes one.

The locate log lives in the observe area's records, not in a new store.

#### 8.5.2. Area signals

| Signal | Evidence | Proposal | Decided by |
|---|---|---|---|
| Area too large | section count or size above threshold (fgOS `agent-coordination`: 429 documents) | split into sub-areas, cut along clusters of identifiers that occur together | reviewer, inside the area |
| Repeated misses | repeated `none-above-threshold` in one area with the same identifier cluster | open an area or sub-area for that cluster | owner for a top-level area; reviewer for a sub-area |
| Frequent `outside-region` | content guessed for area A keeps being owned in area B | move the sections, or sharpen the two areas' descriptions | reviewer within budget; owner beyond |
| Duplicates | two sections in different documents share many identifiers | merge into one owner; the other links | reviewer |
| Dead area | not matched or grown for a long period | merge into the nearest area or retire | owner |

#### 8.5.3. Identifier signals

| Level | Signal | Proposal | Decided by |
|---|---|---|---|
| Values | an unresolved name recurs | add it to its register (for example a new product to the catalog) | reviewer |
| Values | two names always occur together for the same thing | keep one as the main value, the other as an alias | reviewer |
| Values | a register value was renamed or removed but documents still use it | update those documents (doc-health already reports it) | reviewer |
| Values | a register value no document mentions | check whether it is still used or a document is missing | reviewer |
| Kinds | many unresolved names share one pattern no kind accepts (for example `SKU-123`) | add a kind with its register | owner, or the project's frame for a project-only kind |
| Kinds | a kind never helps rank the chosen owner | drop it or lower its coefficient | owner |
| Weights and extractor | the locate log shows which kinds predicted the section the writer chose | adjust per-kind coefficients | automatic, inside a bound |
| Weights and extractor | writers often add a value the extractor missed | propose an extractor pattern | reviewer |

Every coefficient or extractor change reruns the recall set of section 15. A change that lowers recall is rejected. Changes are logged and can be reverted.

### 8.6. Worked examples

These two examples show the axes and the outside-region rule. Their ranking used identifiers only, the approach the later measurements replaced (8.1). Both were run on 2026-11-12 with a throwaway prototype of section 8.1 over the fgOS repository's 687 maintained documents, split into 5636 sections. The prototype extracts only `cli-verb`, `path`, `symbol` and `rule` values from backticked text, with every kind coefficient at 1: weight = ln(5636 / number of sections that carry the value). User documents have no `area` or `question` today, so they count as matching any region (8.4). The numbers are its real output.

#### 8.6.1. A pitfall about reclaiming a worktree

The situation: an agent fixed a bug where a worktree with live uncommitted work could be reclaimed. It wants to record the pitfall.

| Step | Input or result |
|---|---|
| Touched code | `src/runner/worktree.mjs` |
| Locating values | `area = runner`, `question = pitfall` (both from the writer) |
| Narrowing values | `path:src/runner/worktree.mjs` (in 29 sections, weight 5.27), `symbol:reclaimOrphanedCheckout` (6 sections, 6.85), `symbol:isCheckoutDirty` (7 sections, 6.69), `cli-verb:fgos approve` (74 sections, 4.33) |
| Region | 3057 of 5636 sections, because user documents are unset; 91 of them share at least one value |

Top of the ranking:

| Score | Section | Shared values |
|---|---|---|
| 16.45 | [`why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md`](../../../../knowledge/why-reclaimorphanedcheckout-refuses-a-checkout-the-calling-s/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md), top | `reclaimOrphanedCheckout`, `fgos approve`, `src/runner/worktree.mjs` |
| 13.54 | same document, "Root cause" | `reclaimOrphanedCheckout`, `isCheckoutDirty` |
| 12.11 | [`orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md`](../../../../knowledge/why-reclaiming-an-orphaned-worktree-checkout-must-check-for/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md), top | `reclaimOrphanedCheckout`, `src/runner/worktree.mjs` |
| 11.96 | `docs/explanation/dispatch-execute-lost-uncommitted-paths-warning.md`, "What shipped" | `src/runner/worktree.mjs`, `isCheckoutDirty` |

What it shows:

- Two of the three 2026-08 worktree documents come first and third. Their prose and file names differ; the shared symbols find them. The writer grows one of them instead of writing a fourth.
- The third 2026-08 document ([`why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md`](../../../../knowledge/why-session-claim-liveness-measures-worktree-activity-not-pi/why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age.md)) does not appear. It shares no identifier with this change: it is about claim liveness, a different subject. The ranking separates what the old file names had lumped together.
- Without the `question` filter, `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, "Business Rules", also scores 12.11. That spec section holds the rule itself (`current-truth`). The pitfall document owns the "what goes wrong" story and links to that rule; the filter keeps the two kinds apart without hiding the rule from a writer who asks for `current-truth`.
- With `area` and `question` filled on user documents, the region would shrink from 3057 sections to the runner pitfalls only.

#### 8.6.2. A change to `fgos workflow propose`

The situation: commit `df7b73490` made `fgos workflow propose` read each closed case once and made propose and the write-scope check share one glob engine. The agent wants to record the new behavior.

| Step | Input or result |
|---|---|
| Touched code | `src/workflow/case-inherit.mjs`, `src/workflow/propose-classify.mjs`, `src/runner/dispatch/write-scope.mjs` |
| Locating values | `area = workflow`, `question = current-truth` (both from the writer) |
| Narrowing values | `cli-verb:fgos workflow propose` (3 sections, weight 7.54), `path:src/runner/dispatch/write-scope.mjs` (6 sections, 6.85); `globsMeet`, `inheritableMilestones` and the two workflow paths appear in no section yet |
| Region | 3105 sections; 3 share a value |

Ranking:

| Score | Section | Shared values |
|---|---|---|
| 7.54 | `docs/platform/workflow/spec.md`, 7.8 "Cửa vào của conductor" | `fgos workflow propose` |
| 7.54 | same spec, 8 "Tác động lên `fgos run` và `fgos workflow start`" | `fgos workflow propose` |
| 7.54 | same spec, 9 "Component, hợp đồng và ngân sách Node" | `fgos workflow propose` |
| 6.85, outside the region | `docs/platform/git/spec.md`, 6 "N7 and RUL84 (one write-scope matcher)" | `src/runner/dispatch/write-scope.mjs` |

What it shows:

- `area` and `question` alone name the right document, the workflow spec. Inside it, three sections tie on one shared verb. The tie is broken by full text, or by the writer reading three sections, not three hundred.
- New symbols carry no weight because no document mentions them yet. That is the normal case for new behavior: the writer grows the best-ranked section and names the new symbols, which the indexer then picks up.
- The "one glob engine" part of the change is owned elsewhere: the git spec's rule RUL84 (one write-scope matcher) says every "is this path in scope" question goes through it. The region the writer chose (`workflow`) would have hidden it, and so would `runner`, the other area the code lives in: RUL84 (one write-scope matcher) lives in `git`. Only the `outside-region` rule (8.1, step 3) catches it. This is also why this version needs no code-path-to-area table: even a correct table would have pointed at `workflow` and `runner`.

### 8.7. The retrospective writer adds evidence

For each work item, the retrospective writer states the one to three claims the item showed. For each claim it locates (8.1) and, when a unit carries the claim, adds the item as evidence and refines the statement if the item changed it. Only a claim no unit carries becomes a creation request to admission, with the item's material attached. It never writes a story of the item: the story is already in the work item and the event log (platform-foundations L1, log against state). The number of units grows with the number of distinct claims, not with the number of items.

## 9. Rules And Invariants

1. A missed lookup is never permission to create.
2. Locating axes are closed. A new value comes with its owning door: a new area with its overview document; a new `question` value with an owner decision.
3. No open axis is ever a folder, a file name or an address.
4. Every narrowing value resolves against its kind's register, or it is a finding.
5. The search view is a rebuildable cache; deleting it loses nothing.
6. Audience chooses the surface, never the owner.
7. Structure changes come from the observer, through items and review, never from a writer getting past a refusal.
8. The core values in section 5 are the reference. A change to them changes this spec first.

## 10. Contracts Owned

- The three-tier model, the core axes and value sets (section 5), and the coding profile (section 6.1).
- The locate result (ten candidates with sections) and the rule that a creation request carries it plus the writer's one-sentence reason; no verdict comes from a score.
- The proposal kinds of the observer (sections 8.5.2 and 8.5.3) and who decides each.

## 11. Contracts Consumed

| Contract | Used for |
|---|---|
| Convention classify | document kind and placement of a path |
| `fgos --help --json` | the `cli-verb` register |
| Governance holder table | the `rule` key (holder, id) |
| Decision index and `fgos identity mint` | the `decision` register |
| `fgos tool query` | the `tool` register |
| Knowledge-registry contract | lifecycle, slots, `topic split/merge/rename`, `doc path-move`, lineage |
| Component boundary | the fgOS `area` value set |
| [Admission](../admission/spec.md) | admission of a creation and of observer proposals |
| Observe area | the locate log |

## 12. Edge Cases

- **A change names no identifier** (pure wording, a new concept). The hybrid search still ranks it by text and meaning; the writer reads the candidates.
- **An identifier in many sections** (`fgos doctor`). Down-weighted by rarity, so it cannot by itself make a candidate win.
- **Content spans two areas.** It belongs to the area whose behavior it states. The other area links to it. Two owners are never created to cover both.
- **A statement that is both a procedure and a fact.** Split: the fact goes to its `current-truth` owner, the steps to the `procedure` owner, which links to the fact.
- **A renamed value.** The old value no longer resolves and is reported; the fix is to update the documents, and the observer may propose an alias.
- **A new project with no registers.** Locate ranks by full text only; the observer proposes registers from recurring names.

## 13. Open Owner Questions

1. **Engine for the view.** *Decided 2026-11-12: (a).* (a) SQLite through the `rusqlite` crate, bundled build with FTS5: matches L3's "SQLite as view", and later views can share it. (b) `tantivy`, a Rust search engine: stronger ranking, but a second store kind that does only search. Recommendation: (a), confirmed by a Rust probe that FTS5 is present in the bundled build before the plan. Either way it is a new dependency and registers in setup and doctor. *Superseded the same evening:* fgOS does not build the view; it calls OHS and pkm (8.2), both SQLite-based, after the measurements of section 15.
2. **Replace the open `purpose` axis of user documents with `area`.** *Decided 2026-11-12: yes.* This changes the identity and layout decisions D-tsk28x-1, 4 and 5 (purpose as the folder, `docs/<purpose>/<role>.md`), which the signed [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md) carries. Recommendation: yes; the measurement in section 2 is the new evidence. Existing topics stay readable; regrouping them becomes observer proposals.
3. **Frame defaults for the reviewer.** *Decided 2026-11-12: as recommended.* Recommendation: up to 5 new topics or sub-areas per week inside existing areas, up to 20 section moves per week, register value additions unlimited but listed in the weekly digest; everything else goes to the owner in one batch.
4. **Code-path-to-area table.** *Decided 2026-11-12: not in this version.* The only candidate sources were checked: `component-boundary.md` is a hand-written prose document imported in H1, still marked draft, edited in passing by many lanes, and nothing checks that its code mentions are complete (22 of 47 top-level code folders map to exactly one area there); `docs/architecture-manifest.json` is machine-readable and kept true by `test/architecture.test.mjs`, but maps files to layers, not areas. Building on the first would rest identity on the kind of document this spec is meant to fix. The writer picks `area` from the closed list, and `outside-region` catches a wrong pick (example 8.6.2 shows even a correct table would have missed the real owner). If the measurement of section 15 or the locate log shows wrong areas lowering recall, a table is proposed then, as one machine-readable file kept true by a test, on the model of the architecture manifest, never derived from prose.
5. **Threshold, top-N and initial kind coefficients.** *Decided 2026-11-12: from the measurement.* Recommendation: set them from the measurement in section 15, not in advance.
6. **A closed second level under `area`.** *Decided 2026-11-12: allowed, one level, as written in 5.7.* Without it, a user-document slot (area, question) holds one document per area, which grows large. Option: allow sub-areas, each opened like an area with its own overview (the fgOS runner area already has 8 subcomponents). Recommendation: allow it.
7. **Where domain profiles live.** *Decided 2026-11-12: the standard profiles stay in this spec so the model reads as one document; extensions and new domains go under `domains/<domain>/` (section 6).*
8. **Relation to the documentation area spec.** *Done 2026-11-12:* the area spec became a map of subcomponents; its declared-subject matching is replaced by locate here, its write steps moved to the [write door](../write-door/spec.md), and topic admission moved to [admission](../admission/spec.md), where no writer mints a topic name because `area` is closed.

## 14. Implementation Alignment

| Part | Status | Where | Next action |
|---|---|---|---|
| Hybrid search (BM25 with `ohs-lang-vi`, e5-small embeddings) | exists outside fgOS, measured on the fgOS corpus | OHS fork, release `v0.17.2-vantt.9` | register as a tool provider; doctor freshness check |
| Search door, graph, pairs, zones, proposals | exists outside fgOS | `vantt/pkm`, release 0.1.0 (split out of momentell on 2026-11-12; crates `pkm-core`, `pkm-cli`, `pkm-mcp`, `pkm-lifecycle`) | link `pkm-core` as a library or call the CLI/MCP; the gaps are the [requirements to pkm](../../../../../plans/reports/requirements-261112-1533-fgos-to-pkm-structure-mechanism.md) R1 to R9 |
| Retrospective writer adds evidence to claim units (stop 1) | not started | `fgos-coding-knowledge`, cleanup gate | first phase: it cuts the largest source of new documents without new technology |
| Locate door in fgOS (draft translation, top 10, log) | not started | write door | after the pkm locate call (R5) |
| Admission ceiling and reviewer (stop 3) | specified | [admission](../admission/spec.md) | admission phase |
| Axis checks, identifier resolution | specified | [doc-checks](../doc-checks/spec.md) | doc-checks phase |
| Observer (stop 4) | not started | pkm proposals (R7) into fgOS work items | last |

Reused: doc-health, the dead-verb and dead-path rules, Convention classify, the knowledge registry (slots, lifecycle, split, merge, rename, path-move, lineage), the decision index and id minting, `fgos tool query`, the governance holder table, the observe area's records. fgOS adds no search engine of its own. The documentation spec's statement that slice 1 adds no store no longer holds: the OHS and pkm indexes are rebuildable caches under `.fgos/runtime/`.

No component-boundary change until the provider entries and the observer sink are placed; the plan states their rows.

## 15. Verification

**Measured before signing (2026-11-12),** in [the measurement report](../../../../../plans/reports/measurement-261112-1314-docos-document-identity-recall.md):

| Measurement | Result |
|---|---|
| Gold set | 37 same-subject groups (88 documents) and 10 near misses, chosen by an independent agent by reading |
| Identifier overlap alone, top 3 | 31.8%: rejected as the ranking |
| OHS hybrid, developer notes in English, top 3 / top 10 | 91.7% / 95.8% |
| Same notes in Vietnamese as written, top 3 | 0%: hence translation (8.1 step 1) |
| End-to-end decisions, 26 cases (20 known duplicates from history on a snapshot before the duplicate, 6 new subjects) | grep 50%, pkm with OHS **73%**, plus rule text 69%; about 10,000 fewer tokens per write with pkm |

What the trial did not settle: the remaining errors are judgements on close claims, several of them arguable labels. They are bounded by admission's ceiling and the observer, not removed.

**After implementation:**

- **In use, from the locate log:** share of writes that grew a top-10 candidate; share of creation requests the reviewer refused; new units per week against the ceiling; `outside-region` rate; pairs above the duplicate threshold. The first two must not fall below the trial's 73% decision rate; new units per week must stay under the ceiling.
- **Regression set:** the gold set and the 26 trial cases rerun after any change of provider version, model or ranking.
- **Owning proofs:** the locate door's input and output at the use-case boundary; the write-door refusal at the CLI boundary with one wiring proof; the retrospective writer's evidence path in the cleanup gate's owning test.

The non-coding profiles (6.2 to 6.4) bind only after the same measurement on a real project in that domain.

## 16. Related Files

- [Documentation area spec](../../spec.md)
- [Knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md)
- [Convention spec](../../../convention/spec.md)
- [Component boundary](../../../component-boundary.md)
- [Governance](../../../governance.md)
- [Observe spec](../../../observe/spec.md)
- [Event store spec](../../../event-store/spec.md)
- [2026-08 identity discussion](../../../../history/compound-learn-artifact-registry/DISCUSSION.md)
- [2026-08 advisor brief](../../../../../plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md)
- [2026-11-06 panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)

## 17. Decision History Summary

- 2026-08-25, compound-learn registry discussion: four labels for user documents (purpose, role, entity, framework and mode). Kept as the starting point; section 2 records how it behaved.
- 2026-11-06, architecture panel: no new coordinate system was signed then; durable claim identity deferred. This spec reopens the coordinate question at the owner's request on 2026-11-12, with the section 2 measurements as new evidence, and still does not add per-claim identity.
- 2026-11-12, owner, in one review session:
  - a dedicated spec for document identity, with reference tables of axes and values;
  - locating and narrowing axes as the model; locate backed by the harness and by search; the component is Rust;
  - the model serves projects built by fgOS, not only fgOS: three tiers (core, domain profile, project instance); `question` values are common; `audience` becomes `agent`, `internal`, `external` with project subdivisions;
  - `area` is per project, closed and opened by admission, seeded at setup from the project's structure or the domain's starter set;
  - identifiers: `verb` renamed `cli-verb`; a common set led by `decision`; domain profiles for coding, marketing, sales and customer support;
  - self-improvement for both areas and identifiers: an observer proposes items, a reviewer decides inside a frame, the owner decides the rest in batches.
- 2026-11-12, owner, answers to section 13: question 1, the view uses SQLite through `rusqlite` with FTS5, after a Rust probe; question 2, `area` replaces the open `purpose` axis of user documents; question 3, the reviewer frame defaults as recommended; question 5, threshold, top-N and kind coefficients come from the measurement in section 15.
- 2026-11-12, owner: question 6, one closed sub-area level is allowed; question 7, the standard domain profiles stay in this spec, because splitting them out from the start makes the model hard to read, and `domains/<domain>/` carries extensions and new domains.
- 2026-11-12, owner: question 4, no code-path-to-area table in this version; the writer picks `area` from the closed list, and a table comes later only if measurement shows it is needed, built as a test-kept machine-readable file, never from prose such as `component-boundary.md`.
- 2026-11-12 evening, after the measurements of section 15: four stops (claim units with evidence, locate through pkm with OHS, admission with a weekly ceiling, closed axes with an observer); identifiers become a boost; the writer translates its draft and reads ten candidates; no verdict from a score; the model is a faceted classification with SKOS-shaped vocabularies; composite documents are not split.
- 2026-11-12, owner: spec signed.
