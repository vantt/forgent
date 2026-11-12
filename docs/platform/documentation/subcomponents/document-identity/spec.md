# Document Identity Specification

```txt
Document type: BA-grade subcomponent specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define how fgOS places every piece of maintained documentation in a space of axes, so that a writer finds the document that already holds what it wants to write before it may create a new one
Design status: Draft for owner review, 2026-11-12. Not signed. Open owner questions in section 11.
Implementation: Not started. The axis values are measured from the repository on 2026-11-12; the search view, the locate verb and the write-door refusal do not exist yet
Canonical: No (becomes canonical when signed)
Provenance: Written by the DOCOS lead after the owner asked for a dedicated spec on 2026-11-12, from the documentation area draft, the 2026-08 identity-axis discussion and measurements of docs/doc-registry.json and the maintained corpus
Writer type: Agent draft writer
Canonical for: Nothing yet; once signed, the axes that identify a maintained document, their closed value sets, and the locate-before-write rule
Use this when: Deciding where a piece of documentation belongs, reviewing the locate verb or the search view, or changing an axis value set
Do not use this for: Path and placement rules (Convention), the write-door steps around this subcomponent (documentation area spec), or user-document lifecycle (knowledge-registry contract)
Last reviewed: 2026-11-12
Related:
- docs/platform/documentation/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/convention/spec.md
- docs/platform/component-boundary.md
- docs/platform/platform-foundations.md
- docs/platform/event-store/spec.md
- docs/history/compound-learn-artifact-registry/DISCUSSION.md
- plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md
- plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md
```

Read with: [documentation area spec](../../spec.md), [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md), [Convention spec](../../../convention/spec.md), [component boundary](../../../component-boundary.md), [platform foundations L3](../../../platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view), [event store](../../../event-store/spec.md), [2026-08 identity discussion](../../../../history/compound-learn-artifact-registry/DISCUSSION.md), [2026-08 advisor brief](../../../../../plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md), [2026-11-06 panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md).

## 1. Current Summary

Documentation grows by copies when a writer cannot find what already exists. The writer then creates a new file, and the same statement ends up in two or three places that drift apart.

This subcomponent answers one question for every write: **where in the documentation space does this content belong, and which existing document already sits there?** It answers by coordinates, not by matching prose. A document has a position on two kinds of axes:

- **Locating axes** (*trục định vị*). Closed value sets. Together they name a small region of the space, usually one document. Examples: the area the content is about, the kind of question it answers.
- **Narrowing axes** (*trục thu hẹp*). Many values per document, drawn from real identifiers that a machine can check: `fgos` verbs, repository paths, code symbols, rule ids. They rank the candidates inside a region, because two documents about the same thing share identifiers even when their prose differs.

A writer must locate before it writes. The locate step is a harness verb backed by a search view, not something the writer is trusted to remember. Creating a new document is refused unless locate ran and found no candidate above the overlap threshold, and the admission in [documentation spec 6.7](../../spec.md#67-admission-by-effect) passed.

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

The axes were not wrong. Three things failed:

1. Both address axes behaved as open sets, so every write minted a new address.
2. The axis that joins documents across addresses was left empty, because filling it depended on the writer.
3. The axes were used to **name** a new file, never to **find** an existing one. The writer decided "create or grow" by checking whether its own freshly named path existed, so the answer was almost always "create".

This spec keeps the idea of several axes and fixes those three points: locating axes are closed, narrowing values are filled by a machine, and lookup happens before write, enforced by the harness.

## 3. Scope

### 3.1. In scope

- The axis model: which axes exist, which are locating and which are narrowing, and their value sets (section 5).
- The unit that carries coordinates (section 5.1).
- The locate operation and its ranking (section 6.1).
- The search view that serves locate (section 6.2).
- The refusal at the write door when locate was skipped or found an owner (section 6.3).
- How narrowing values are filled and checked (section 6.4).
- The measurement that gates signing (section 13).

### 3.2. Out of scope

- Path and file-name rules. Convention owns them; this spec consumes `fgos convention classify`.
- The steps of the write door around locate. The documentation area spec owns them.
- User-document lifecycle (`reserved`, `provisional`, `active`, `superseded`, `retired`). The knowledge-registry contract owns it; lifecycle is an attribute here, not an axis.
- Moving or merging the 479 existing user documents. A later item, after this spec is signed.
- Durable per-claim identity. Coordinates identify a document section, not a single sentence.

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| Writer (documentation skill, retrospective writer) | Call locate; read candidates; grow a document; request creation through admission | Create a document without a locate result; set narrowing values by hand as the only source |
| Locate verb | Read the search view and the axis tables; return coordinates and ranked candidates | Write documents; grant creation |
| Indexer (part of doc-health) | Read documents; extract narrowing values; rebuild the search view | Change document text |
| Admission reviewer (documentation spec 6.8) | Read the locate result attached to a creation request | Admit a creation whose locate result names an owner above threshold, without recording why |
| Owner | Change a closed value set; approve the reviewer frame | — |

## 5. The Axes

### 5.1. The unit that carries coordinates

A **section** of a document carries coordinates: the text under one heading, down to the next heading of the same or higher level. A document's locating values are the values most of its sections share; a section may override `question` (for example a spec's decision-history section is `choice`).

Why a section and not a whole document: a spec of 200 KB answers many questions, and ranking it as one unit hides the one section that already holds the statement. Why not a sentence: sentences have no stable boundary, and the 2026-11-06 panel advised against durable per-claim identity.

### 5.2. Axis overview

| Axis | Kind | Values per section | Closed? | Who sets it | Source of truth |
|---|---|---|---|---|---|
| `area` | locating | exactly one | closed | derived from path; for new content, from the code the change touches | table 5.3 |
| `question` | locating | exactly one | closed | writer, checked against the document kind | table 5.4 |
| `audience` | surface, not identity | one or more | closed | derived from root and document kind | table 5.5 |
| `identifiers` | narrowing | many | open, but every value must resolve | extracted by the indexer | table 5.6 |
| `lifecycle` | attribute | exactly one | closed | registry or header | knowledge-registry contract |

`audience` decides how a section is **shown**, never who owns it. The same fact is owned once and shown to agents through a distilled surface and to people through a full one.

### 5.3. Locating axis `area`

The value set for this repository is the set of platform areas, plus `platform` for documents that govern all areas. 34 directories exist under `docs/platform/`; 30 carry an area spec. Four directories are not areas and are not values: `domainization`, `history`, `proposals` and `system-architecture` hold collections, history or proposals about several areas.

For a project that uses fgOS, the value set is that project's own component map. The axis is per project; this table is the fgOS repository's instance.

| Value | What it covers | Area spec | Maintained docs today |
|---|---|---|---|
| `platform` | laws, governance, vision, reading map, system-wide rules | `docs/platform/*.md` | root files |
| `agent-confinement` | the one runtime door that confines an agent process | yes | 5 |
| `agent-coordination` | coordination playbooks; routes current execution to runner owners | yes | 429 |
| `agent-mailbox` | message delivery between live agent sessions on one machine | yes | 1 |
| `agent-protocol` | per-CLI adapters that read what an agent CLI showed | yes | 1 |
| `claude-plugin` | the Claude Code plugin surface and slash commands | yes | 2 |
| `coexistence` | running fgOS beside another agent harness in one project | yes | 1 |
| `config` | configuration files, schema, precedence and writers | yes | 1 |
| `convention` | names and placement of repository artifacts | yes | 1 |
| `decision-citation-drift` | the check for stale decision citations | yes | 2 |
| `distillery` | reference learning from external sibling projects | yes | 2 |
| `documentation` | the documentation write door and this subcomponent | yes | 19 |
| `event-store` | event durability, sealing, refs and reads | yes | 1 |
| `git` | repository operations and recovery | yes | 1 |
| `herdr-web-dashboard` | the herdr web dashboard | yes | 4 |
| `holder-lock` | the single port for cold locks | yes | 1 |
| `host-invocation-routing` | how a host invocation reaches the right release and verb | yes | 34 |
| `identity` | minting and resolving machine, project, clone and session ids | yes | 1 |
| `observe` | observation, friction and metrics | yes | 3 |
| `packaging-distribution` | install, release, setup and doctor | yes | 25 |
| `process` | process liveness and signalling | yes | 1 |
| `runner` | execution core, dispatch and runs | yes | 19 |
| `run-supervisor` | the per-attempt process that owns a launched agent | yes | 1 |
| `seat-binding` | what a seat runs on | yes | 1 |
| `secrets` | where a secret lives and who may resolve it | yes | 1 |
| `system-overview` | area map, shared entities, cross-area flows | yes | 1 |
| `terminal-control` | which pane a key runs in | yes | 1 |
| `ui-spec` | UI specifications | yes | 17 |
| `workflow` | guide, case and admission for workflows | yes | 1 |
| `work-state` | work items, stages, verbs and their rules | yes | 8 |
| `yaml-document` | byte-preserving YAML reads, edits and merges | yes | 1 |

Rules:

- A value is added only together with its area spec and its row in the [component boundary](../../../component-boundary.md). That is the existing admission for a new platform area (documentation spec 6.7).
- User documents (`docs/knowledge`, `docs/explanation`, `docs/how-to`, `docs/tutorials`, `docs/reference`) take their `area` from this same table. This replaces the open `purpose` axis (section 11, question 2).
- For new content the locate verb proposes `area` from the paths the change touches, through a path-to-area table (section 11, question 4). The writer may override it with a reason.

### 5.4. Locating axis `question`

The kind of question the content answers. The owning document kind follows from it, so this axis replaces both the platform document type and the user-document role as the thing a writer chooses.

| Value | The question | Platform document kind (Convention) | User-document role | Maintained authority? |
|---|---|---|---|---|
| `current-truth` | What is true now? Behavior, state model, rules | `spec` | — | yes |
| `obligation` | What exact obligation applies at a boundary? | `contract` | — | yes |
| `rationale` | Why does the system have this shape? | `architecture` | `pattern` | yes |
| `choice` | What was decided, and what did it supersede? | `decision`, a spec's decision-history section | `decision` | yes |
| `direction` | What direction is intended? | `vision`, `roadmap`, `intent-preservation-ledger` | — | yes |
| `procedure` | How do I operate or carry out a task step by step? | `guide-runbook` | `runbook` | yes |
| `pitfall` | What goes wrong, how it shows, how to avoid it? | a spec's edge-case section | `pitfall` | yes |
| `lookup` | Which value, code or option applies? | `vocabulary`, `generated-doc` | `lookup-table` | yes |
| `proof` | What shows this works? | `verification`, `evidence-payload` | `evidence` | yes |
| `navigation` | Where should a reader go next? | `platform-portal`, `area-portal`, `subcomponent-portal`, `collection-index`, `portal`, `reading-map` | — | yes, links only |
| `past-state` | What was true or proposed before? | `history`, `proposal`, `discussion-scratchpad` | — | no |

Rules:

- The six user-document roles the owner admitted on 2026-11-06 map one to one onto six of these values, so no role is lost and no new role is added.
- `past-state` content is never a locate target for a write that asserts current truth. It is searchable for provenance.
- A section whose `question` does not fit its document kind is a finding (for example `procedure` steps inside a `current-truth` spec section). The writer moves it to the owner of that question.

### 5.5. Surface axis `audience`

| Value | Who | Surface they read | Rule |
|---|---|---|---|
| `agent` | an agent working in the repository | distilled: `AGENTS.md`, skill references, briefs | generated from or linking to the owner, never a hand copy |
| `developer` | a maintainer of fgOS or of a project using it | full: `docs/platform/` | owns platform truth |
| `user` | a person using fgOS to get work done | full: `docs/user/`, `docs/tutorials/`, `docs/how-to/`, `docs/knowledge/` | owns task procedures; links to the owner for facts |

The same fact is never owned twice because two audiences read it. A user how-to owns the steps (`procedure`) and links to the spec that owns the facts (`current-truth`).

### 5.6. Narrowing axis `identifiers`

Each value is a real identifier with a kind. The indexer extracts values; a value that does not resolve against its source is a finding, so the axis cannot fill with invented words.

Measured over the 687 maintained documents (platform, knowledge, explanation, how-to, tutorials, reference; history and verification excluded) on 2026-11-12:

| Kind | Example | Resolves against | Distinct values in docs | Documents using it | Status |
|---|---|---|---|---|---|
| `verb` | `fgos run` | `fgos --help --json` command listing (80 commands) | 100 | 420 | in; dead verbs already a doc-health rule (documentation spec 6.3) |
| `path` | `src/state/store.mjs` | `git ls-files`, or a pinned commit on the same line | 715 | 436 | in; dead paths already a doc-health rule |
| `symbol` | `applyKnowledgeEvent` | code index (GitNexus where present, else a source scan) | 1749 | 495 | in |
| `rule` | `RUL-WF-34`, `RUL11` | rule definitions in their holder (governance holder table) | 150 | 73 | in; key is (holder, id) because ids repeat across holders |
| `decision` | `D-ADR0055` | decision index | 48 | 27 | in |
| `law` | `L3` | `platform-foundations.md` | 10 | 36 | in |
| `env` | `FGOS_HOST_BIN` | configuration and secrets registries | 36 | 46 | in |
| `config-key` | `gates.bypass` | configuration schema | not measured cleanly | — | in after a schema-backed extractor exists; a plain dotted-word scan mixes in file names |
| `work-item` | `tsk-3x8` | work state | 806 | 512 | **out**: it says when something was learned, not what it is about; kept as provenance |

Rules:

- Narrowing values are filled by the indexer from the body text, never only by the writer. A writer may add a value the extractor cannot see (for example a symbol named in prose without backticks); it must still resolve.
- Overlap is counted per kind and weighted: an exact `rule`, `symbol` or `verb` match weighs more than a shared `path` to a common file such as `package.json`. Very common values (for example `fgos doctor`, in hundreds of sections) are down-weighted by how many sections carry them.

## 6. Behaviors And Operations

### 6.1. Locate (before every write)

```txt
Runs when: the write door's owner-finding step, before any grow or create; also by hand.
Blocked when: never; it only answers.
What changes: nothing in documents; the result is recorded with any creation request.
Afterwards / side effects: returns proposed coordinates and up to N ranked candidate sections.
```

Input: the change the writer intends (its diff when there is code, and a short statement of what it will assert), plus optional `area` and `question` from the writer.

Steps:

1. **Propose locating values.** `area` from the touched paths (path-to-area table); `question` from the writer, checked against table 5.4.
2. **Extract narrowing values** from the diff and the statement, with the same extractor the indexer uses.
3. **Filter** sections by `area` and `question`. If nothing matches, widen once to the same `question` in all areas, then to the same `area` in all questions, and say which widening was used.
4. **Rank** the filtered sections by weighted identifier overlap, then by full-text score as a tiebreak and as the fallback when the change names no identifier.
5. **Return** coordinates, the top candidates with their overlap and score, and a verdict: `owner-found` (one candidate above threshold), `ambiguous` (two or more above threshold), `none-above-threshold`.

The writer then reads the top one to three candidates and grows the right one. `ambiguous` means ask with the decision-question template. `none-above-threshold` is the only verdict that lets a creation request go to admission; it never grants creation by itself.

### 6.2. The search view

The view is a cache rebuilt from the documents, never truth, as platform-foundations L3 clauses 2 and 3 require: the Markdown files in git are truth, the view can be deleted and rebuilt at any time.

| Part | Holds | Serves |
|---|---|---|
| Section table | file, heading path, `area`, `question`, `audience`, lifecycle, content hash | the locating filter |
| Identifier table | (section, kind, value, weight) | the narrowing rank |
| Full-text index | section text | tiebreak and fallback |
| Stamp | the git tree id the view was built from | freshness check |

It is a Rust component with a thin Node facade, like the event store (design principle 4). Engine choice is open (section 11, question 1). It lives under `.fgos/runtime/`, is rebuilt by doc-health and incrementally on changed files, and registers a `fgos doctor` freshness check, as the install/setup/doctor gate requires.

Semantic search (embeddings) is **not** in this spec. The 2026-07-13 search decision (commit `997169c12`) set the ladder: full-text first, embeddings only when full text is shown to miss. The corpus has long passed that decision's threshold (about 100k tokens then; about 4 million tokens of maintained text now), which justifies the full-text step. Embeddings wait for the measurement in section 13.

### 6.3. Refusal at the write door

The write door refuses to create a document, a registry topic or a slot when:

- no locate result for this change is attached; or
- the locate verdict is `owner-found` or `ambiguous`, and the request carries no reviewer reason for creating anyway.

The locate result is recorded on the creation, next to the admission record of documentation spec 6.8, so a later reviewer can see what was found and why creation still happened.

Growing an existing section needs no admission and no refusal check beyond doc-health.

### 6.4. Filling and checking the axes

doc-health gains three duties, run on changed documents and in full on the live test:

1. Extract narrowing values and update the view.
2. Report a narrowing value that does not resolve (extends today's dead-verb and dead-path rules to the other kinds).
3. Report a section with no `area` or a `question` outside table 5.4, and a section whose `question` does not fit its document kind.

Locating values for existing platform documents come from their path and Convention kind; no hand tagging of the 618 platform documents is needed. User documents get `area` and `question` in their frontmatter when they are next grown; until then their `question` comes from their role and their `area` is unset, which locate treats as matching any area.

## 7. Rules And Invariants

1. A missed lookup is never permission to create.
2. Locating axes are closed. A new value comes with its owning door: a new area with its spec and boundary row; a new question kind with an owner decision.
3. No open axis is ever a folder, a file name or an address.
4. Every narrowing value resolves against its source of truth, or it is a finding.
5. The search view is a rebuildable cache; deleting it loses nothing.
6. Audience chooses the surface, never the owner.
7. The axis values in section 5 are the reference. A change to a value set changes this spec first.

## 8. Contracts Owned

- The axis model and value sets in section 5.
- The locate verdicts `owner-found`, `ambiguous`, `none-above-threshold`, and the rule that only the last may go to admission.

## 9. Contracts Consumed

| Contract | Used for |
|---|---|
| Convention classify | document kind and placement of a path |
| `fgos --help --json` | the `verb` source |
| Governance holder table | the `rule` key (holder, id) |
| Decision index | the `decision` source |
| Knowledge-registry contract | lifecycle of user documents; slots |
| Component boundary | the `area` value set |
| Documentation spec 6.7 and 6.8 | admission of a creation |

## 10. Edge Cases

- **A change names no identifier** (pure wording, a new concept). Rank falls back to full text inside the filtered region. The writer must read the candidates; the verdict is at most `ambiguous`.
- **Identifier in many documents** (`fgos doctor`). Down-weighted by frequency, so it cannot by itself make a candidate win.
- **Content spans two areas.** It belongs to the area whose behavior it states. The other area links to it. Two owners are never created to cover both.
- **A statement that is both a procedure and a fact.** Split: the fact goes to its `current-truth` owner, the steps to the `procedure` owner, which links to the fact.
- **A renamed symbol or verb.** The old value no longer resolves and is reported; the fix is to update the document, which is the point of the check.

## 11. Open Owner Questions

1. **Engine for the view.** (a) SQLite through the `rusqlite` crate, bundled build with FTS5. It matches L3's "SQLite as view", and later views can share it. (b) `tantivy`, a Rust search engine: stronger ranking, but a second store kind that does only search. Recommendation: (a), confirmed by a Rust probe that FTS5 is present in the bundled build before the plan. Either way it is a new dependency and registers in setup and doctor.
2. **Replace the open `purpose` axis of user documents with `area`.** This changes the identity and layout decisions D-tsk28x-1, 4 and 5 (purpose as the folder, `docs/<purpose>/<role>.md`), which the signed [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md) carries. Recommendation: yes; the measurement in section 2 is the new evidence. Existing 479 topics stay readable; regrouping them is a later item.
3. **The `question` value set.** Eleven values in table 5.4. Recommendation: accept as written; it keeps the six admitted roles and adds no new user role.
4. **Path-to-area table.** No mechanical map from code path to area exists today (`docs/architecture-manifest.json` maps 356 files to layers, not areas). Most `packages/<name>` and `src/<name>` folders match an area name. Recommendation: one table owned by this subcomponent, checked so every tracked source path maps to exactly one area.
5. **Threshold and top-N.** Recommendation: set them from the measurement in section 13, not in advance.
6. **Relation to the documentation area spec.** This spec replaces its declared-subject matching (step 2.2 of 6.1 and section 6.6) and shrinks topic admission (6.8): with `area` closed, no writer mints a topic name. Recommendation: after signing, edit the documentation spec to point here and remove what this replaces in the same change.

## 12. Implementation Alignment

Nothing is implemented. Reused when built: doc-health (extraction and checks), the dead-verb and dead-path rules (first two `identifiers` kinds), Convention classify (document kind), the knowledge registry (slots, lifecycle), the decision index, the governance holder table. New: the view component, the locate verb, the refusal at the write door, the path-to-area table, the `fgos doctor` freshness check. The documentation spec's statement that slice 1 adds no store and no new `fgos doc` verb no longer holds once this spec is signed; that is a deliberate change for the owner to accept.

No component-boundary change until the view component is placed; the plan states its row.

## 13. Verification

**Gate before signing: a recall measurement.** Build a set of known same-subject groups:

- the three 2026-08 worktree-reclaim user documents (`orphaned-worktree-reclaim-must-check-for-live-uncommitted-work`, `why-reclaimorphanedcheckout-refuses-a-live-session-worktree`, `why-session-claim-liveness-reuses-worktree-activity-not-pid-or-event-age`);
- the 7 event-log rules defined in both `docs/platform/work-state/spec.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`;
- 20 or more groups drawn from the 479 user topics by an independent reviewer, not by the author of the extractor.

For each member, run locate with the member's own text as the intended change and the member removed from the view. Pass: the other members appear in the top 3 for at least 90% of members. Below that, either the extractor is fixed, or the embeddings step of section 6.2 is proposed with the miss list as its evidence.

After implementation: one owning proof per behavior at the lowest layer — extractor kinds in the Rust component, locate verdicts in the use case, the write-door refusal at the CLI boundary with one wiring proof.

## 14. Related Files

- [Documentation area spec](../../spec.md)
- [Knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md)
- [Convention spec](../../../convention/spec.md)
- [Component boundary](../../../component-boundary.md)
- [Governance](../../../governance.md)
- [Event store spec](../../../event-store/spec.md)
- [2026-08 identity discussion](../../../../history/compound-learn-artifact-registry/DISCUSSION.md)
- [2026-08 advisor brief](../../../../../plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md)
- [2026-11-06 panel outcome](../../../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)

## 15. Decision History Summary

- 2026-08-25, compound-learn registry discussion: four labels for user documents (purpose, role, entity, framework and mode). Kept as the starting point; section 2 records how it behaved.
- 2026-11-06, architecture panel: no new coordinate system was signed then; durable claim identity deferred. This spec reopens the coordinate question at the owner's request on 2026-11-12, with the section 2 measurements as new evidence, and still does not add per-claim identity.
- 2026-11-12, owner: a dedicated spec for document identity, with a reference table of axes and their values; locating and narrowing axes as the model; locate must be backed by the harness and by search; the component is Rust.
