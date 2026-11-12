# Documentation Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Map the Knowledge and Documentation Engine (horizon H2): which subcomponent owns which part of writing, locating, admitting and checking maintained documentation, how a write flows through them, and in which order they are built
Design status: Draft. On 2026-11-12 the owner split the area into subcomponents; this spec became the map and its detailed sections moved to the subcomponent specs. Not signed.
Implementation: Not started for the new subcomponents; the registry, Convention placement rules, doc-health and the decision index they extend are implemented
Canonical: No (becomes canonical when signed)
Provenance: First committed 2026-11-06 by the DOCOS lead from the H2 scout report plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md and the proposal docs/platform/proposals/documentation-system-unification.md; reduced to a map on 2026-11-12
Writer type: Agent draft writer
Canonical for: Nothing yet; once signed, the documentation area's subcomponent map, the end-to-end write flow, the build order and the area-wide rules
Use this when: Finding which documentation subcomponent owns a question, or reviewing the order H2 is built in
Do not use this for: The detail of any subcomponent; follow the map. Until signed, governance.md, the Convention spec and the knowledge-registry contract hold the current rules
Last reviewed: 2026-11-12
Related:
- docs/platform/proposals/documentation-system-unification.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/documentation/subcomponents/doc-checks/spec.md
- docs/platform/documentation/subcomponents/admission/spec.md
- docs/platform/documentation/subcomponents/write-door/spec.md
- docs/platform/governance.md
- docs/platform/convention/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/intent-preservation-ledger.md
- plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md
```

Read with: [proposal](../proposals/documentation-system-unification.md) (objectives A1–A6 and B1–B6, sections 0.2, 0.3, 9.2 and 10), [governance](../governance.md), [Convention spec](../convention/spec.md), [knowledge-registry contract](../work-state/contracts/knowledge-registry.md), [intent ledger](../intent-preservation-ledger.md), [panel outcome](../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md).

## 1. Current Summary

H1 is closed: platform documentation lives under `docs/platform/`, Convention blocks wrong placements, and doc-health checks links, the metadata header and dead backticked paths.

H2, the Knowledge and Documentation Engine, makes documentation grow by improving what exists instead of by copies. It is not one big component. It is four subcomponents, each with its own spec, plus one planned, built on the doors that already run (the knowledge registry, Convention, doc-health, `state.decisions`). This spec is their map: who owns what, how a write passes through them, and the build order.

## 2. The Subcomponents

| Subcomponent | Owns | Spec | Status |
|---|---|---|---|
| Document identity | the four stops, claim units, the axes in three tiers, locate before write through pkm with OHS, self-improvement | [document-identity](subcomponents/document-identity/spec.md) | signed 2026-11-12 |
| doc-checks | the one check command, its body rules, the commit gate, where registry lints run | [doc-checks](subcomponents/doc-checks/spec.md) | signed 2026-11-12 |
| Admission | which effects open or move authority, the independent reviewer, the frame, the owner's batch, the admission record | [admission](subcomponents/admission/spec.md) | signed 2026-11-12 |
| Write door | the documentation skill, its steps and dispositions, the pointer line, live templates, the retrospective writer's default | [write-door](subcomponents/write-door/spec.md) | signed 2026-11-12 |
| Reading surfaces | generated surfaces from one source: decision index, docs index, the user-document index, the distilled agent surface (A6) | not written yet | planned |

Owned outside this area and consumed here:

| Concern | Owner |
|---|---|
| Paths, kinds, cardinality | [Convention](../convention/spec.md) |
| User-document slots, lifecycle, lineage | [knowledge-registry contract](../work-state/contracts/knowledge-registry.md) (moves here in a later slice) |
| Decisions | `state.decisions` and the decision index |
| Bounded agent briefs (H3, Agent Context Engine) | a future area; it reads H2's outputs and never defines their truth |

## 3. How A Write Flows

```txt
request ──► write door ──► locate (document identity)
                              │
            ┌─────────────────┼──────────────────────┐
       owner-found        ambiguous          none-above-threshold
            │                 │                       │
        grow section      ask the person      admission request ──► reviewer (in frame) ─► admit / refuse
            │                                         │                     │
            │                                         │               escalate ─► owner batch
            ▼                                         ▼
        check command (doc-checks) ◄──────────── create from template
            │
        regenerate surfaces (reading surfaces) ──► report

observer (document identity) ──► proposals ──► admission ──► moves, merges, new sub-areas, register values
```

A writer never changes structure to get past a refusal; structure changes come only from the observer, through admission.

## 4. Build Order

Each step is one phase that ships something checkable on its own. Revised on 2026-11-12 after the measurements: the largest source of new documents is the retrospective writer's one-document-per-item design, so it goes first.

1. **Retrospective writer adds evidence to claim units** (stop 1 of document identity; item `p-ixrbglli5o`), with the cleanup gate accepting the evidence or the admission handoff. Cuts the main source without new technology.
2. **doc-checks**: path input, the verb and rule-claim rules, staged reads and the pre-commit gate (item `p-cd2ejz7wa5`); the 6 documents with invalid YAML frontmatter.
3. **Locate through pkm with OHS**: register both as tool providers, the fgOS locate door (translation, top 10, log), doctor freshness checks.
4. **Admission**: effect checks at the doors, the reviewer run, the frame and its weekly ceiling, refusal texts.
5. **Write door**: the skill, the pointer seed, live templates.
6. **Observer**: pkm's structural proposals into fgOS work items; merging the 479 story documents into claim units over time.
7. **Reading surfaces**: its spec first, then the surfaces.

## 5. Objectives Map

The proposal's objectives, and the subcomponent that meets each:

| Objective | Met by |
|---|---|
| A1 One truth, one owner | document identity (locate), doc-checks (rule-claim rule), admission |
| A2 No stale guidance | reading surfaces; lifecycle from the registry |
| A3 Right content in few tokens | H3, outside this area |
| A4 One door, no duplicates | write door, with locate and admission |
| A5 Traceable, never guessed | write door (ask when ambiguous), reading surfaces (pointers to source) |
| A6 Two surfaces from one source | reading surfaces; rule 3 below |
| B1 Reuse what exists | every subcomponent extends an existing door; the one new store is document identity's search view, a rebuildable cache under L3, accepted by the owner on 2026-11-12 |
| B2 One-way dependency | the flow in section 3 has no cycle |
| B4 Better, not bigger | each subcomponent spec names what it reuses and what it adds |
| B5 Installable and provable | the search view registers in setup and doctor; each spec names its owning proofs |
| B6 Every project and CLI | document identity's three tiers (core, domain profile, project instance) |

## 6. Area-Wide Rules

1. **Extend, never alongside.** Path and kind stay in Convention, body rules in doc-health, user identity in the registry, decisions in `state.decisions` (L10).
2. **Owner by content, not by topic.** The owner of a piece of content is found by what it asserts and the question it answers; the audience decides only the surface.
3. **One source, two surfaces.** Agents and people read different surfaces of the same source; both are generated from it or link to it, and neither is maintained by hand beside it (A6).
4. **Promise only what is checked.** Each subcomponent states what it proves and declares what it does not.

### 6.1. Answers to the proposal's open questions

1. **Scope of "rules".** A rule is anything with a stable id and one holder: L1–L10, D-ADR numbers, RUL ids, and the ids of the instruction seeds under core/instructions. An operating practice without an id is not a checkable claim; it gets an id when it needs checking.
2. **Priority when objectives pull apart.** The product order in `AGENTS.md` applies first. Inside the documentation objectives: truth first (A1, A5, A2), then reach (A4, B6), then economy (A3, A6). B1 and B4 are not traded off; they bound every option.

### 6.2. One source, against the earlier two-registry decision

D-tsk28x-8 (2026-08-25) set one engine with two tiers, a human tier that accepts repetition and a machine tier that stays compact, each with its own registry. Objective A6 (owner, 2026-10-21) is later and narrower: one canonical source, both surfaces generated from it. This area follows A6. The clause "two registries" of D-tsk28x-8 is superseded; when this spec is signed, that supersession is recorded as a decision with `--relation supersedes`.

## 7. Known Area-Wide Gaps

- `src/report/enduser-index.mjs` and `enduser-index-generate.mjs` emit user-document entries without lifecycle, so a reader of the index cannot tell provisional from active. Owner: reading surfaces.
- `scripts/knowledge-classifier.mjs` (`sanitizeRole`) maps to `recipe`, `concept`, `walkthrough` and `guide`, outside the admitted roles; its new-write callers are mapped onto `question` values or retired in the write-door phase.
- The cause of 479 topics for 479 documents is not proven. The bootstrap script registering documents directly active is a confirmed source; the per-item retrospective writer is a suspected one.
- Cross-project reach (B6) for platform-profile rules waits for the Convention project overlay (Convention Q13); document identity's tiers serve other projects for user documents.

## 8. Deferred, Preserved (non-preclusion, proposal 0.3)

| Capability | Now | Must not preclude | Revisit when |
|---|---|---|---|
| Cross-project documentation rules (B6) | user profile works in any project through the shipped registry verbs; platform rules apply in the fgOS repo | a project-owned rule file merged by rule id and a shipped check verb reading it | Convention Q13 is decided |
| Durable per-claim identity (deferred by the owner, 2026-11-06) | sections carry coordinates; rule claims keyed by (holder, id) | claim ids added later without rewriting documents | a duplicate meaning slips past locate and is found in use |
| `platform-docs` registry profile, typed graph | path identity from Convention | a graph derived, never stored (tsk-1lv ruling) | a check needs identity beyond sections and rule ids |
| Skill-name check | none | one listing of skill names across core and domains | a dead skill reference is found that review missed |
| Agent Context Engine (H3, PF-I007) | none | rule claims and sections keyed so a reducer can select them | H3 opens |
| Embeddings | full-text search in the view | the view's section table can carry vectors later | document identity's recall measurement shows full text misses |
| Migration tooling retirement (proposal 9.2 step 5) | done in `159971615` | — | — |

## 9. Related Files

| Relationship | File |
|---|---|
| design proposal | [documentation-system-unification.md](../proposals/documentation-system-unification.md) |
| design rationale | [documentation-system-design.md](architecture/documentation-system-design.md) |
| subcomponents | [document identity](subcomponents/document-identity/spec.md), [doc-checks](subcomponents/doc-checks/spec.md), [admission](subcomponents/admission/spec.md), [write door](subcomponents/write-door/spec.md) |
| governance | [governance.md](../governance.md) |
| placement rules | [Convention spec](../convention/spec.md) |
| registry contract | [knowledge-registry.md](../work-state/contracts/knowledge-registry.md) |
| deferrals | [intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| facts | [scout report](../../../plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md) |

## 10. Decision History Summary

- 2026-11-06: draft. Slice 1 is the write door, built by extending the existing doors. Platform documents keep path identity. Rule claims are keyed by (holder, id). Unsigned.
- 2026-11-06, owner review: an owner is found by what content asserts and the kind of question it answers, never by topic; the audience decides only the surface. Following A6, the "two registries" clause of D-tsk28x-8 is superseded (to be recorded on signing).
- 2026-11-06, architecture panel and owner decisions: "no match, then create" is withdrawn; a writer must be admitted to open or move authority, and a missed lookup never grants create. Six roles admitted for new writes. Durable claim identity deferred. Items opened: `p-cd2ejz7wa5` (honest commit gate), `p-ixrbglli5o` (retrospective writer grows by default, after its completion path).
- 2026-11-07, lead: topic admission by an approved owner answer per topic. The owner objected the same day: asking him for every new topic is wrong.
- 2026-11-12, owner: a dedicated spec for document identity (axes, locate, search view in Rust, three tiers, self-improvement); the area is split into subcomponents (document identity, doc-checks, admission, write door, later reading surfaces) and this spec becomes their map; admission moves to an independent reviewer inside an approved frame; the build order of section 4.
- 2026-11-12, owner: the four subcomponent specs are signed; the build order puts the retrospective writer's claim-and-evidence change first; pkm is split into its own repository `vantt/pkm`.
