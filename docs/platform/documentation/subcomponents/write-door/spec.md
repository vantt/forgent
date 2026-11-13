# Documentation Write Door Specification

```txt
Document type: BA-grade subcomponent specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define the one door through which any agent writes, changes, moves or retires maintained documentation, and the steps it follows
Design status: Signed by the owner on 2026-11-12. A change is recorded as a new entry in section 15, decision history.
Implementation: Not started. The doors it calls exist (Convention, the knowledge registry, doc-health, the decision index); the skill, the pointer line and the live templates do not
Canonical: Yes
Provenance: Sections 3, 4, 6.1, 7 and the template concept of the documentation area spec as of 2026-11-07, moved here when the owner split the area into subcomponents on 2026-11-12
Writer type: Agent draft writer
Canonical for: The documentation skill's steps, its dispositions, the pointer line and the live templates
Use this when: Changing how an agent writes documentation, or reviewing why a write grew one document instead of creating another
Do not use this for: Where content belongs (document identity), what is checked (doc-checks), or who admits a creation (admission)
Last reviewed: 2026-11-12
Related:
- docs/platform/documentation/spec.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/documentation/subcomponents/doc-checks/spec.md
- docs/platform/documentation/subcomponents/admission/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
```

Read with: [documentation area spec](../../spec.md) (the map), [document identity](../document-identity/spec.md), [doc-checks](../doc-checks/spec.md), [admission](../admission/spec.md), [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md).

## 1. Current Summary

Today an agent that writes documentation picks a file by itself. Nothing makes it look for the document that already holds what it wants to say, so it usually creates a new one.

The write door is one skill that every agent reaches through one always-loaded pointer line. It does not decide where content belongs, what is checked, or who may create: it calls the subcomponents that do. Its own job is the order of the steps and the default: **grow an existing section; create only when locate found no owner and admission passed.**

## 2. Scope

### 2.1. In scope

- The always-loaded pointer line and the skill it points to.
- The steps of a write, in order (section 6.1).
- The dispositions: grow, create, promote, supersede, retire (6.2).
- Live templates for new documents (6.3).
- The retrospective writer's default (6.4, item `p-ixrbglli5o`).

### 2.2. Out of scope

- Locate and the axes: [document identity](../document-identity/spec.md).
- The check command and the commit gate: [doc-checks](../doc-checks/spec.md).
- Admission of a creation or a move: [admission](../admission/spec.md).
- Placement and paths: Convention.
- Lifecycle states of user documents: the knowledge-registry contract.

## 3. Entry Points And Triggers

| Trigger | Entry |
|---|---|
| A person or agent asks to write, change, move or retire maintained documentation | the pointer line (one sentence in an instruction seed under core/instructions) sends the agent to the documentation skill; the skill is the only entry |
| A retrospective item synthesizes knowledge | `fgos-coding-knowledge` follows the same steps (6.4) |

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| Documentation skill (agent) | Call locate; read candidates, governance, Convention classify, the registry and decisions; write prose; call `fgos convention`, `fgos doc reserve/mark-rendered/promote` and the check command; request admission | Choose a path by hand; skip locate or the check; edit a generated file; promote a user document to `active` without a person; change areas, kinds or registers to get past a refusal |

## 5. Concepts

- **Disposition.** What a write does to the documentation: grow, create, promote, supersede, retire.
- **Template.** A starting file for one document kind. Today's templates sit under the documentation history folder and carry a `Document type: History` header, so a copy of one starts with a wrong header. They move under this area's operations folder, where Convention row `doc-guide-runbook-1` already admits them, with their real headers.
- **Surface.** What one audience reads. A surface for another audience (an agent brief, a customer how-to that relies on a fact) links to the owning section or is generated from it; it is never a hand copy.

## 6. Behaviors And Operations

### 6.1. A write, step by step

```txt
Runs when: a request to write, change, move or retire maintained documentation reaches the documentation skill.
Blocked when: locate found an owner and the request would create a second one; admission refused a creation or a move; the target path fails Convention; the check command fails.
What changes: the agent grows the owning section, or creates a document after admission, and runs the check.
Afterwards / side effects: generated projections are regenerated through their existing verbs (decision-index, docs-index, doc-registry); mdview preview runs when governance requires it; the agent reports the disposition and the check output.
```

1. **State what the change asserts**, and choose `area` and `question` for it from their closed lists ([document identity 5.4 and 5.7](../document-identity/spec.md#5-core-model)).
2. **Locate** ([document identity 8.1](../document-identity/spec.md#81-locate-before-every-write)) and read the candidates, opening one to three. Locate gives no verdict; the writer decides, and the decision is logged:
   - `grow`: a candidate section carries the claim; grow it.
   - `ask`: two candidates fit; ask with the decision-question template.
   - `create`: no candidate carries the claim; a creation may be requested from admission, with the locate result and one sentence on why no candidate carries it. Locate never grants it.
   - `no-place`: no value of the closed `area` list fits; the writer never opens a value, and the request goes to admission the same way.
3. **Choose the disposition** (6.2). Grow is the default.
4. **Get the path** from Convention for a platform document, or from `fgos doc reserve` for a user document. Never construct a path by hand.
5. **Copy the live template** when creating (6.3).
6. **Edit.** When growing a section, name the identifiers the change introduces, so the indexer picks them up.
7. **Run the check command** ([doc-checks 6.1](../doc-checks/spec.md#61-the-check-command)) on the changed paths.
8. **Regenerate projections**, and preview when required. A surface for another audience links to the owner, or is regenerated from it.
9. **Report** the disposition, the writer's locate decision and the check output.

### 6.2. Dispositions

| Disposition | When | Door |
|---|---|---|
| Grow | locate found the owner, or the writer grows the best-ranked section for new behavior | edit + check |
| Create | the writer found no candidate that carries the claim (`create` or `no-place`) and admission passed | admission, then `fgos doc reserve` or Convention path, template, edit, check |
| Promote | a person accepts a provisional user document | `fgos doc promote` |
| Supersede | a new document replaces one; the successor must already be `active` | registry `doc supersede` |
| Retire | the content no longer holds | registry retire, with successor or reason |

Moves and merges of existing documents are not dispositions of a writer. They come from the observer of [document identity 8.5](../document-identity/spec.md#85-self-improvement), through admission.

### 6.3. Live templates

One template per document kind the door creates (spec, contract, architecture, decision, guide or runbook, verification, vision, area and subcomponent portals, user-document roles). Each carries its real header fields, `area` and `question` among them, and no `History` header. The door copies the template; it never writes a header from memory.

### 6.4. The retrospective writer

This is item `p-ixrbglli5o`, and stop 1 of [document identity](../document-identity/spec.md#1-current-summary). The retrospective writer (`fgos-coding-knowledge`) does not write a document per work item. For each item it:

1. states the one to three **claims** the item showed (a fact, rule, failure mode, decision or procedure, one each);
2. for each claim, drafts it in the corpus's language and locates ([document identity 8.1](../document-identity/spec.md#81-locate-before-every-write));
3. when a candidate unit carries the claim, adds the item as **evidence** to that unit (a link to the work item and its decision or incident) and refines the claim's statement only if the item changed it;
4. when no candidate carries it, hands the claim and the item's material to an admission request (below).

The story of the item stays where it already is, in the work item and the event log (platform-foundations L1: log against state). Units therefore grow with the number of distinct claims, not with the number of items; most items add a line of evidence and create nothing.

Condition before it ships: a retrospective item whose knowledge fits no section and gets no admitted creation leaves material. Today the cleanup gate (`checkRetrospectiveContent` in `src/state/cleanup-harness.mjs`) accepts only a non-engine decision, a linked existing document or a registry attestation, so such an item parks at cleanup. The completion path (decided 2026-11-12): the writer puts the material into its admission request for a creation, with the locate result, and the retrospective item records `material handed to admission request <id>`. The cleanup gate accepts that record as a fourth kind of evidence, after checking that the request exists and carries the material and the locate result. If admission admits, the document is created from that material; if it refuses, the material stays in the request item, where the observer can use it (for example to propose a sub-area when several requests share an identifier cluster). This changes the cleanup gate's contract, which the work-state area owns; the change is made as a contract change with its owning proof, never as a loosened check. The gate still refuses an engine closing report and still never accepts a manufactured decision.

## 7. Rules And Invariants

1. **One door.** Maintained documentation is written through the documentation skill; the always-loaded line points to it and holds no rules itself (proposal 4.4, L8).
2. **Locate before write.** No write skips locate.
3. **Grow by default; create only when admitted.** A lookup that finds no owner is never, by itself, permission to create.
4. **Ask, never guess.** When two candidates fit, the door asks.
5. **Paths come from their owners.** Convention or `fgos doc reserve`, never by hand.
6. **Surfaces are linked or generated.** Never a hand copy of an owned section.

## 8. Contracts Owned

- The skill's step order and the disposition table (6.1, 6.2).
- The pointer line's wording.
- The template set.

## 9. Contracts Consumed

| Contract | Owner | Use |
|---|---|---|
| Locate | [document identity](../document-identity/spec.md) | owner finding |
| The check command | [doc-checks](../doc-checks/spec.md) | step 7 |
| Admission | [admission](../admission/spec.md) | creations |
| `fgos convention classify` / `path` | [Convention](../../../convention/spec.md) | paths and kinds |
| `fgos doc` lifecycle, `fgos knowledge attest` | [knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md) | user-document slots and lifecycle |
| `fgos decision-index` | decisions (`src/report/decision-index.mjs`) | regeneration after a decision changes |

## 10. Edge Cases

- A user document written outside the retrospective flow still goes through the door and the registry.
- A statement that is both a fact and a procedure is split: the fact grows its `current-truth` owner, the steps grow the `procedure` owner, which links to the fact.
- A provisional or reserved document resolves through the knowledge resolver with its lifecycle attached. That is provenance and attestation, not authority.

## 11. Open Questions

1. **Where the pointer line lives.** *Decided 2026-11-12:* one new instruction seed, a file named documentation-door.md under core/instructions, holding one sentence; the existing instruction registry renders it into every agent CLI's always-loaded file next to the four seeds already there, and `fgos setup` carries it to every project that uses fgOS. No new mechanism.
2. **The material-only completion path for item `p-ixrbglli5o`.** *Decided 2026-11-12:* the material goes into the admission request, and the cleanup gate accepts that request as evidence (section 6.4). Rejected: loosening the gate to accept a closing report (the gate excludes engine reports on purpose), and attesting the nearest section without growing it (false evidence).

## 12. Implementation Alignment

| Behavior | Status | Next action |
|---|---|---|
| Skill and pointer line | planned | write-door phase |
| Live templates | planned | move and fix headers |
| Locate step | planned | after document identity's view and verb |
| Retrospective writer adds evidence to claim units | planned, first phase | item `p-ixrbglli5o` |

## 13. Verification

| Behavior | Owning proof |
|---|---|
| Template headers are real | a case in `test/scripts/doc-health.test.mjs` over the template folder |
| The retrospective writer grows by default | a case in the owning test of `fgos-coding-knowledge`'s cleanup path |
| The cleanup gate accepts a material handoff to an admission request, and still refuses an engine report | cases in `test/state/cleanup-harness.test.mjs`, the gate's owning test |
| End to end | one wiring proof: a write with an existing owner grows it and creates nothing |

## 14. Related Files

- [Documentation area spec](../../spec.md)
- [Document identity](../document-identity/spec.md)
- [doc-checks](../doc-checks/spec.md)
- [admission](../admission/spec.md)
- [Knowledge-registry contract](../../../work-state/contracts/knowledge-registry.md)

## 15. Decision History Summary

- 2026-11-06, owner review: the owner of content is found by what it asserts, never by topic; the audience decides only the surface.
- 2026-11-06, architecture panel and owner: "no match, then create" is withdrawn; a missed lookup never grants create. Item `p-ixrbglli5o` opened.
- 2026-11-12, owner: the documentation area is split into subcomponents; the owner-finding step becomes locate from document identity.
- 2026-11-12, owner: the pointer line is a fifth instruction seed, documentation-door.md under core/instructions; a retrospective item with material only hands it to an admission request, and the cleanup gate accepts that request as evidence, as a contract change owned by work state.
- 2026-11-12, owner: spec signed.
- 2026-11-13: the locate step's three verdicts (`owner-found`, `ambiguous`, `none-above-threshold`) are replaced by the writer's decision after reading (`grow`, `ask`, `create`, `no-place`), matching document identity 8.1 and pkm's locate, which give no verdict from a score.
