# Documentation Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define the Knowledge and Documentation Engine (horizon H2): the one door an agent uses to write or change maintained documentation, the admission that keeps a writer from opening new authority without review, and the checks behind them, built by extending the doors that already run
Design status: Draft proposal, revised after the 2026-11-06 architecture panel and owner decisions (section 7.7). Not signed. Remaining owner questions in section 11.2; the topic admission contract is written (section 6.8).
Implementation: Not started for the write door and the two new checks; the registry, Convention placement rules, doc-health and the decision index it extends are implemented
Canonical: No (becomes canonical when signed)
Provenance: First committed 2026-11-06 by the DOCOS lead from the H2 scout report plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md and the proposal docs/platform/proposals/documentation-system-unification.md
Writer type: Agent draft writer
Canonical for: Nothing yet; it is the draft for the documentation write door and claim-owner checks, and becomes canonical only when signed
Use this when: Reviewing what H2 slice 1 builds, what it reuses, and what it defers
Do not use this for: Current documentation rules: until signed, governance.md, the Convention spec and the knowledge-registry contract hold them
Last reviewed: 2026-11-07
Related:
- docs/platform/proposals/documentation-system-unification.md
- docs/platform/governance.md
- docs/platform/convention/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/intent-preservation-ledger.md
- plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md
- plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md
```

Read with: [proposal](../proposals/documentation-system-unification.md) (objectives A1–A6 and B1–B6, sections 0.2, 0.3, 4.3–4.7, 9.2 and 10), [governance](../governance.md), [Convention spec](../convention/spec.md), [knowledge-registry contract](../work-state/contracts/knowledge-registry.md), [intent ledger](../intent-preservation-ledger.md), [scout facts](../../../plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md), [panel outcome](../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md).

## 1. Current Summary

H1 is closed: platform documentation lives under `docs/platform/`, Convention blocks wrong placements, and doc-health checks links, the metadata header and dead backticked paths. The proposal's H2 is the Knowledge and Documentation Engine.

This spec covers H2 **slice 1**, the write door. It meets objective A4 and acceptance items 1–7 of proposal section 10 by extending four doors that already run:

- the Knowledge Registry, which handles identity and lifecycle of user documents;
- Convention, which handles path, kind and cardinality;
- doc-health, which handles body health;
- `state.decisions`, which handles decisions.

Slice 1 changes the default from "a writer may create" to "a writer must be admitted". It promises one bounded thing: an ordinary writer cannot open new authority (a new platform area, a user topic that becomes authority, a role outside the admitted set, a document that starts active, a supersede to an unaccepted successor, a move across areas) without passing an existing reviewed door. A lookup that finds nothing never grants create. It does not promise that duplicate meaning is caught: the only mechanical duplicate check is the rule-claim backstop (6.4), whose limit is declared.

Slice 1 adds no store, no graph, no daemon and no new `fgos doc` verb. The capabilities it defers are recorded in section 11.3 and in the intent ledger, as section 0.3 of the proposal requires.

The engine is not a new component. It is the documentation area made of these existing doors. The registry keeps its contract in the work-state area until a later slice moves it here.

## 2. Scope

### 2.1. In Scope

- One documentation door: a skill that every agent reaches through one always-loaded pointer line.
- The owner rule: an owner is found by claim and claim kind, never by topic; the audience decides only the surface (section 5.1).
- Admission by effect: every transition that opens or moves authority passes admission at the existing door that records it (section 6.7).
- The admitted role set for new user-document writes (section 5.1).
- `fgos authoritative-match` extended to every documentation root and to the platform `Canonical for` header, so declared subjects are searched in one place.
- Live templates the door copies.
- One documented check command over changed documents.
- Two new body rules in doc-health:
  - a referenced `fgos` verb exists;
  - a rule claim has one owner.
- Running the check on staged documents in pre-commit.
- Repairing the registry defects the door would inherit, and making the commit gate honest (section 6.5).
- Answers to the proposal's two open questions (section 7.5).

### 2.2. Out Of Scope

- Claim identity beyond rule ids (durable claim identity, deferred by the owner on 2026-11-06); the typed graph; claim-level supersession.
- A `platform-docs` profile in the registry.
- The Agent Context Engine (H3, PF-I007).
- Moving user documentation roots (PF-I010).
- The Convention project overlay (Convention Q13).
- A shipped `fgos doc check` verb.
- A skill-name existence check.
- A new coordinate or identity system for documents.
- Remapping the 479 existing topics, or reviving the H1 migration engine.

Each deferral has a row in section 11.3.

## 3. Entry Points And Triggers

| Trigger | Entry |
|---|---|
| A person or agent asks to write, change, move or retire maintained documentation | The always-loaded pointer line (one sentence in an instruction seed under core/instructions) sends the agent to the documentation skill. The skill is the only entry. |
| A retrospective item synthesizes knowledge | `fgos-coding-knowledge` keeps its flow and calls the same check command before it commits. |
| A commit stages files under `docs/` | Pre-commit runs the check command on the staged documents. |
| `npm test` | The live doc-health case checks the whole platform corpus, as today. |

## 4. Actors And Access

| Actor | May | May not |
|---|---|---|
| Documentation skill (agent) | Read governance, Convention classify, registry and decisions; write prose; call `fgos convention`, `fgos doc reserve/mark-rendered/promote` and the check command | Choose a path by hand, skip the check, edit a generated file, promote a user document to `active` without a person |
| doc-health | Read files, the classify answer and the command listing | Write files; decide placement |
| Convention | Decide path, kind, cardinality and the reserved flags | Read document bodies |
| Registry | Own user-document identity and lifecycle | Own platform-document identity (Convention's path identity owns it in slice 1) |

## 5. Data / Concepts

### 5.1. What owns what

Ownership is keyed on the **claim**, never on the topic. The audience decides how a claim is **shown**, never who owns it.

- **Claim.** One statement the documentation asserts: a rule, a behavior, a contract field, a decision, a user task procedure. The aim is one owner per claim (A1), whoever reads it. Slice 1 does not promise it: claims carry no durable identity, so only rule claims are checked (6.4), and the rest is held by admission (6.7) and by asking (6.1).
- **Claim kind.** The kind of question a claim answers. The owning document type follows from the kind (proposal section 3.2), not from the topic:

  | Question the claim answers | Owning document |
  |---|---|
  | What is currently true? | Spec |
  | What exact obligation applies? | Contract |
  | Why does the system have this shape? | Architecture |
  | What choice was made or superseded? | Decision |
  | What direction is intended? | Vision |
  | What proves it? | Verification |
  | How does a user get a task done? | User document slot (purpose, role) in the registry |
  | Where should a reader go next? | Portal or reading map |

- **Audience and surface.** Agents, developers and users are audiences. They read different surfaces of the same claims: agents read a distilled surface, developers and users read a full one (A6). A surface is generated from, or links to, the owner. It never restates the claim by hand. A user how-to is not a second copy of a spec claim. It owns a different claim kind (the task procedure) and links to the spec for the facts it relies on.
- **Declared subject.** The one-line statement of what a document owns:
  - platform documents declare it in the `Canonical for` header field;
  - user documents declare it in the `authoritative_for` frontmatter field.

  These are two names for one concept, and slice 1 reads both. Today the declaration is weak:
  - 0 of 618 platform documents carry a real subject: `Canonical for` holds migration boilerplate, and one string is shared by 60 documents;
  - 67 of 332 documents under `docs/knowledge` carry `authoritative_for`;
  - all 136 under `docs/explanation` carry it.
- **Identity axes of a user document.** These were settled by the compound-learn registry discussion (D-tsk28x-1, 3, 4 and 14) and are kept:
  - purpose: one value, the folder;
  - role: one value from a closed set, the file name. The admitted set for new writes is `decision`, `runbook`, `pitfall`, `pattern`, `evidence`, `lookup-table` (owner, 2026-11-06). The first five are the examples of the signed [knowledge-registry contract](../work-state/contracts/knowledge-registry.md); `lookup-table` is added. The 365 roles already recorded replay and stay readable, and are never admitted into the set by being old;
  - entity: several values, tags only;
  - writing framework and mode, e.g. Diataxis, kept separate from identity.

  At most one active document exists per (purpose, role).

### 5.2. Other concepts

- **Document profile.** Slice 1 has two profiles and no new store.
  - User profile: registry slots `topicId:role`, written under `docs/knowledge/` and the Diataxis roots.
  - Platform profile: paths admitted by Convention under `docs/platform/`. Identity is the path, which is unique wherever Convention's cardinality is `singleton`.
- **Rule claim.** A rule definition written as a bold rule id with its title in parentheses, e.g. `**RULn (title)**`, plus D-ADR numbers and the L1–L10 laws. The claim key is (holder document, id). An id is unique only inside its holder: 48 RUL ids are reused across holders with different meanings (scout section 7).
- **Holder.** The document that owns a claim, resolved through the governance [holder table](../governance.md#decision-scope-to-holder-table).
- **Command listing.** The `commands[].name` set printed by `fgos --help --json`, which is the one machine list of `fgos` verbs, plus the hidden verb `internal`.
- **Template.** A starting file for one document type. Today's templates sit under the documentation history folder and carry a `Document type: History` header, so a copy of one starts with a wrong header. Slice 1 moves them under this area's operations folder, where Convention row `doc-guide-runbook-1` already admits them, and gives them their real headers.

## 6. Behaviors And Operations

### 6.1. Write or change a document (the door)

```txt
Runs when: a request to write, change, move or retire maintained documentation reaches the documentation skill.
Blocked when: the claim already has an owner and the request would create a second one; the change would open or move authority without admission (6.7); the target path fails Convention; the check command fails.
What changes: the agent finds the owner and grows the existing document. It creates a document only when a person asked for it and admission passed. It copies the live template for a new document, edits it and runs the check.
Afterwards / side effects: generated projections are regenerated through their existing verbs (decision-index, docs-index, doc-registry); mdview preview runs when governance requires it; the agent reports the disposition (grew, created, moved, retired) and the check output.
```

The skill's steps, in order:

1. List the claims the change asserts, and give each one its claim kind (5.1). Note the audience, but only to choose the surface in step 8.
2. Find each claim's owner, stopping at the first answer:
   1. **Exact keys.** A rule id inside its holder (governance holder table). A Convention singleton path for the owning type and area, checked with `fgos convention classify`. A registry slot (purpose, role) for a user task.
   2. **Declared subjects.** Match the claim against the declared subjects of documents of the owning type (`Canonical for`, `authoritative_for`) through `fgos authoritative-match`, extended to every documentation root.
   3. **Still ambiguous or not found.** Two candidates, a candidate whose subject is boilerplate, or no candidate: stop and ask with the decision-question template. Never guess an owner (A5). Finding nothing is not permission to create: the lookup is by words and misses a claim written differently.
3. Choose grow, create, discuss, promote, supersede or retire. Grow is the default. Create only when a person asked for a new document and the admission in 6.7 passes; otherwise leave the content as material for the owner of the nearest document and report it. When the agent grows a document whose declared subject is boilerplate, it writes the real subject in the same change. Coverage therefore rises with use, with no bulk sweep.
4. Get the path. Use Convention for a platform document, or `fgos doc reserve` for a user document. Never construct a path by hand.
5. Copy the live template when creating.
6. Edit the document.
7. Run the check command.
8. Regenerate projections, and preview when required. A surface for another audience (an agent brief, a user how-to that relies on the claim) links to the owner, or is regenerated from it. It is never edited by hand into a second copy.
9. Report.

### 6.2. Check changed documents (one command)

```txt
Runs when: the door's step 7, pre-commit on staged docs, or by hand.
Blocked when: never; it only reports. A non-zero exit is the refusal.
What changes: nothing on disk.
Afterwards / side effects: prints each finding with file, line and rule id; exits non-zero on any finding.
```

The command is doc-health, given a list of paths. For those paths it runs Convention check and all five body rules:

- the three rules it has today: links resolve, metadata header, dead backticked paths;
- the two new rules in 6.3 and 6.4.

Without paths it checks the whole platform corpus, as the live test does today. This is the one documented command for acceptance item 6.

### 6.3. Verb reference rule

In a document that classify reports as canonical, outside the past-state kinds (`history`, `decision`, `verification`), each backticked `fgos <verb>` names a verb in the command listing, with two exceptions:

- the same line pins a commit sha, which is how docs already record a removed verb;
- the document's header says `Canonical: No`, as in an unsigned draft.

The exemptions are those of the dead-path rule. No regex on prose context words is used.

### 6.4. Rule-claim owner rule

The same rule id with the same title must not be defined in two holders. A second holder cites the owner instead of repeating the definition.

This catches the 7 duplicated claims found today: the event-log rules numbered 1–3 and 5–8 (single append-only log, one write door, write order, expectation-checked writes, exit-code categories, item schema, dependency targets), each defined in both `docs/platform/work-state/spec.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. It does not use the `Canonical for` header, which is boilerplate (one string is shared by 60 documents).

### 6.5. Registry repairs and an honest commit gate

These change no contract. The commit-gate part is its own item, `p-cd2ejz7wa5`, opened before the identity work because a promise that "commit refuses" needs it:

- doc-health reads the staged content (the Git index) for the paths it checks, not the working tree. Today `scripts/doc-health.mjs` reads files on disk, so a commit can pass on unstaged edits.
- The pre-commit document block selects changed files with `ACMRD`, not `ACR`, so modified and deleted documents are checked.
- In an activated workspace, a host error or timeout in that block refuses the commit. Today it warns and continues (`.githooks/pre-commit`, the Convention block).
- Classify runs once for all staged paths, in one host call.
- `doc-provisional-aged` parses `updatedAt` before subtracting. Today it subtracts an ISO string, gets `NaN` and never fires. Choosing its age cutoff is a policy change and is named as one.
- `docRegistry.topicMaxDocs`, which the doctor reads, is declared in the config schema.
- The 19 tracked user documents missing from the registry are registered, and the one registered path missing on disk is resolved.
- The tracked, empty `.fgos/docs/enduser-docs-index.json` is removed if no reader is found; otherwise the readers move to `docs/enduser-docs-index.json`.

The free-form role set (365 roles for 479 documents) is closed for new writes by the admitted set in 5.1, enforced by admission (6.7). Old roles are not rewritten.

### 6.6. Search declared subjects

```txt
Runs when: the door's step 2.2, or by hand.
Blocked when: never; it only reads.
What changes: nothing.
Afterwards / side effects: returns the documents whose declared subject matches, or none; with --check-duplicates, every group of two or more documents that declare the same subject.
```

Today `fgos authoritative-match` reads `authoritative_for` only under a quadrant directory passed with `--quadrant`. Slice 1 extends the same verb so that, with no `--quadrant`, it reads every documentation root. It also reads the platform `Canonical for` header field as the same concept, and skips boilerplate subjects. This is an extension of an existing read verb, not a new one.

### 6.7. Admission by effect

Admission is decided by what a change does, not by which verb carries it. Each effect below passes admission at the existing door that records it, for new events only. Replay of events already recorded is unchanged, and no enum is tightened inside replay.

| Effect | Door that records it today | Slice 1 admission |
|---|---|---|
| A user topic is created or its purpose renamed (`topic register`, `topic split` successors, `topic rename`) | registry store door, `fgos topic`; `scripts/knowledge-bootstrap.mjs` | an approved ask names the topic (6.8) |
| A slot is opened with a role | `fgos doc reserve` | role must be in the admitted set (5.1) |
| A document starts `active` (register or bootstrap) | registry reducer, `scripts/knowledge-bootstrap.mjs` | refused for a new document; it reaches `active` only by `doc promote`. Promote proves no person today; that limit is declared in 6.8, not closed |
| Authority moves to a successor (`doc supersede`) | registry reducer | successor must already be `active` |
| A document moves across area or holder (`doc move-path`, platform rename) | registry reducer; Convention for platform paths | needs the same admission as a create |
| A new platform area appears | Convention's open `<area>` patterns | doc-health checks the area against one list of admitted areas; the plan names that list's source (the panel did not; candidates are the area rows of [component-boundary](../component-boundary.md) and the governance holder table). Convention classify alone still passes a new area, so the promise rests on this check, not on classify |

Not admission: a writer id prefix, the mere existence of a decision id, or a matcher verdict.

### 6.8. Topic admission contract

A new topic is the one effect that opens a new authority namespace for user documents: with at most one active document per (topic, role) and six roles, the number of admitted topics bounds new authority. This contract decides how a topic is admitted. It adds no topic status and no event type.

**Door.** The admission is an approved answer at the human gate that already exists on work items: `fgos ask <workId> "<question>"` parks the item in `awaiting-human`, and `fgos answer <workId> --approve "<answer>"` records `gates[workId].approved = true` with the ask text (`src/state/replay.mjs`, the ask and answer fold). A fresh ask or a plain answer clears `approved`, so consent never carries over.

**Who asks.** A writer that finds no fitting topic does not create one. It submits one work item for the proposed topic (`fgos submit`), and asks on it. The question carries the proposed topic id, its purpose title, the existing topics it checked and why none fits. A retrospective item cannot be parked (`status-fsm.mjs` has no edge from `retrospective` to `awaiting-human`), so the proposal is always its own item; the retrospective item keeps its material and does not wait. Several proposals from one pass are batched into one item and one question, listing every id (priority 2, "Release con người").

**Check at the door.** `fgos topic register`, `fgos topic split` and `fgos topic rename` take `--admitted-by <workId>` for every new event. The store door refuses the write unless:

1. `gates[workId].approved` is true;
2. the recorded ask text names each topic id the event creates or renames, as a whole token;
3. no topic already registered cites the same `workId` for the same id (one admission, one use).

The event payload records `admission: { workId }` for audit. `scripts/knowledge-bootstrap.mjs` registers topics through the same door, so it needs the same flag for any new topic.

**Replay.** The check runs in the store door before append, never in `applyKnowledgeEvent`. Old events without `admission` replay unchanged; no reducer enum is tightened.

**Refusal text.** The four refusal strings that today steer writers to `fgos topic split` (`src/state/knowledge-registry.mjs` lines 182, 202, 248, 534; `bin/fgos.mjs:1591`) change to name the ask door instead: grow the existing document, or propose a topic through an ask.

**Not covered.** `topic merge` moves documents into a topic that already exists, so it opens no namespace and needs no admission. `topic retire` closes authority and needs none.

**Declared limit.** fgOS has no proof of a person: the Identity spec leaves out human accounts, and `fgos answer --approve` can be typed by any session, including the one that asked. The promise is that a new topic always leaves an approved question naming it, on a work item a person can find, and that no writer path opens a topic without one. It is not a proof that a person typed the answer. The same limit holds for `doc promote`, which checks lifecycle, slot and commit, not who runs it. Closing either limit needs the Identity owner (panel missing expertise) and is not in slice 1.

**Alternatives rejected.** A `proposed` topic status: its activation, replay, merge and reader meaning are not written, and the reader leak in `src/report/enduser-index.mjs` already shows how an unaccepted state reaches readers (11.1). A writer-prefix gate (`att-*`): an id prefix is not authorization. A reviewed batch file of admitted topics: a second registry beside the event store.

## 7. Rules And Invariants

1. **One door.** Maintained documentation is written through the documentation skill; an always-loaded line points to it and holds no rules itself (proposal 4.4, L8).
2. **Extend, never alongside.** Path and kind stay in Convention, body rules stay in doc-health, user identity stays in the registry, decisions stay in `state.decisions`. Slice 1 adds no second checker, store or write door (L10, PF-I024, and the canonical-decision-projection rulings of tsk-1lv: no stored graph or daemon, no second decision store).
3. **Owner by claim, not by topic.** Ownership is decided by the claim and its kind. Audience decides only the surface. The same topic legitimately has a spec claim, a contract claim and a user task claim, each with its own owner. The door never gives an owned claim a second owner.
4. **Grow by default; create only when admitted.** The door creates a document only when a person asked for it and admission (6.7) passes. A lookup that finds no owner is never, by itself, permission to create.
5. **Ask, never guess.** When exact keys and declared subjects do not settle the owner, or find none, the door asks.
6. **One owner per rule claim.** A rule claim is keyed by (holder, id); a repeated definition is a finding, not a style issue.
7. **Named verbs exist.** A canonical document names only `fgos` verbs that run, unless it pins the commit that removed them.
8. **Checks run where writing happens.** The check command runs at the door and in pre-commit on staged docs, not only in the test suite.
9. **No new verb in slice 1.** This reconciles proposal 4.5 with Phase 10 decision 1. Classify stays `fgos convention classify`, the check stays doc-health, and lifecycle stays `fgos doc`. A shipped check verb becomes due only when project-owned rules exist (Convention Q13), because before that the rules describe only fgOS's own layout.
10. **Admission by effect.** Any change that opens or moves authority passes admission at the door that records it, whatever verb carries it (6.7). Old events replay as they are.
11. **Promise only what is checked.** The spec promises that new authority is admitted, not that every duplicate meaning is caught; the rule-claim check (6.4) is a backstop with a declared limit.


### 7.5. Answers to the proposal's open questions

1. **Scope of "rules".** A rule is anything with a stable id and one holder: L1–L10, D-ADR numbers, RUL ids, and the ids of the instruction seeds under core/instructions. An operating practice without an id is not a checkable claim; it gets an id when it needs checking. Reason: A1 and A5 can be checked only for things that have a key.
2. **Priority when objectives pull apart.** The product order in `AGENTS.md` applies first. Inside the documentation objectives:
   - truth first: A1, A5, A2;
   - then reach: A4, B6;
   - then economy: A3, A6.

   B1 and B4 are not traded off. They bound every option.

### 7.6. One source, two surfaces, against the earlier two-registry decision

D-tsk28x-8 (2026-08-25) set one engine with two tiers: a human tier that accepts repetition and a machine tier that stays compact, each with its own registry. Objective A6 (owner, 2026-10-21) is later and narrower: one canonical source, with both surfaces generated from it and neither maintained by hand. This spec follows A6.

- The source is single.
- Repetition on the human surface is allowed only as a generated or linked projection.
- The clause "two registries" of D-tsk28x-8 is superseded. When this spec is signed, that supersession is recorded as a decision with `--relation supersedes`.

### 7.7. Owner decisions after the architecture panel, 2026-11-06

The panel ([outcome](../../../plans/reports/council-261106-2216-docos-h2-document-identity-architecture-panel-outcome.md)) rejected the earlier rule "no match, then create" and recommended admission first, through existing doors. The owner accepted the recommendations ("ok, theo đề xuất"):

1. The bounded promise of section 1 is accepted. Durable claim identity, and any profile for platform documents in the event store, are deferred.
2. The admitted role set for new writes is the six roles in 5.1.
3. Two items open now, apart from the identity contract: `p-cd2ejz7wa5` (honest commit gate, 6.5) and `p-ixrbglli5o` (the retrospective writer grows or re-attests by default, once its material-only branch has a legitimate completion path).

No new coordinate system is adopted.

## 8. Contracts Owned

None new in slice 1. The output format of the check command (file, line, rule id, exit code) is the existing doc-health format extended by two rule ids.

## 9. Contracts Consumed

| Contract | Owner | Use |
|---|---|---|
| `fgos convention classify` / `check` | [Convention](../convention/spec.md) | Kind, cardinality, canonical, metadataExempt, generated; placement verdict |
| `fgos doc` lifecycle, `fgos knowledge attest` | [knowledge-registry contract](../work-state/contracts/knowledge-registry.md) | User-document slots |
| `fgos --help --json` | command registry (`src/cli/command-registry.mjs`) and native descriptors (`apps/fgos/src/main.rs`) | Command listing |
| Holder table | [governance](../governance.md#decision-scope-to-holder-table) | Rule holders |
| `fgos decision-index` | decisions (`src/report/decision-index.mjs`) | Regenerated after a decision changes |

## 10. Edge Cases Settled

- The same topic serves agents, developers and users. Each claim keeps one owner. The agent surface is distilled from that owner, and a user how-to owns only its task procedure, linking to the spec for facts.
- A declared subject that matches two documents is not resolved by picking one: the door asks, and the answer becomes a supersede or a narrower subject.

- A verb mentioned as removed with no sha is a finding. The fix is to add the removing commit sha, which the docs already do for dead paths.
- A planned verb in a signed spec is a finding. A spec that plans a verb stays `Canonical: No` until the verb exists.
- The same RUL id with a different title under two holders is allowed: ids are holder-local.
- A user document written outside the retrospective flow still goes through the door and the registry.
- A retrospective item whose knowledge fits no existing document and has no request for a new one leaves material. Today the cleanup gate (`checkRetrospectiveContent` in `src/state/cleanup-harness.mjs`) accepts only a non-engine decision, a linked existing document or a registry attestation, so such an item parks at cleanup. Item `p-ixrbglli5o` must give it a legitimate path first; it never weakens the gate or manufactures a decision.
- A provisional or reserved document resolves through the knowledge resolver with its lifecycle attached. That is provenance and attestation, not authority. A surface that drops the lifecycle is the leak (11.1).

## 11. Open Gaps

### 11.1. Sweep needed when the rules land (known findings)

- `core/skills/_shared/private-cell-worktree.md:58` tells agents to run `fgos coordination run`. That verb was removed in `2180b4e72` and the active release answers "unknown verb". The file is reached from the coding cell policy.
- The 7 duplicated rule claims (the event-log rules numbered 1–3 and 5–8): work-state keeps them, because they are event-log and write-door rules and the holder table names work-state for them; the runner subcomponent cites them.
- Removed or planned verbs named without a sha: `docs-lease` (holder-lock spec), `repair` (work-state spec), `evolve` (runner subcomponents) and `unlock` (runner spec). The planned `secrets` sits in an unsigned draft and is exempt.

- `src/report/enduser-index.mjs` and `enduser-index-generate.mjs` emit user-document entries without lifecycle, so a reader of the index cannot tell provisional from active.
- `scripts/knowledge-classifier.mjs` (`sanitizeRole`) maps to `recipe`, `concept`, `walkthrough` and `guide`, which are outside the admitted role set; its new-write callers are mapped or retired in the plan.
- The cause of 479 topics for 479 documents is not proven. The bootstrap script registering documents directly active is a confirmed source; the per-item retrospective writer is a suspected one.

### 11.2. Owner questions

- Q1, cross-project reach: slice 1 serves the fgOS repo first, with the cross-project route recorded in 11.3 (recommended), or waits for the Convention overlay.
- Q2, pre-commit posture: answered by item `p-cd2ejz7wa5`; documentation findings refuse the commit, and a host error refuses it too in an activated workspace.

### 11.4. Open contract work (lead, not owner)

- **Topic admission mechanism.** Written in 6.8 (2026-11-07): an approved ask names the topic, checked at the store door for new events only. Still open: proof of a person, which needs the Identity owner; the Event Store owner is not needed because no status or event type is added.

### 11.3. Deferred, preserved (non-preclusion, proposal 0.3)

| Capability | Slice 1 does | Must not preclude | Revisit when |
|---|---|---|---|
| Cross-project documentation rules (B6) | User profile works in any project through the shipped registry verbs; platform-profile rules apply in the fgOS repo only | A project-owned rule file merged by rule id (Convention 3.3) and a shipped check verb reading it | Convention Q13 is decided |
| Real declared subjects on every platform document | Written when the door grows a document; boilerplate is skipped by the matcher | One subject field name across profiles (`Canonical for` and `authoritative_for` merged) | Coverage stalls, or a duplicate owner slips past the matcher |
| Generated agent surface (A6) | Surfaces link to the owner | Every claim keeps a single source from which a distilled surface can be generated | H3 opens |
| `platform-docs` registry profile, document and claim identity, typed graph | Path identity from Convention, claim key (holder, id) | Registry fields becoming profile-specific; a graph derived, never stored (tsk-1lv ruling: no stored graph or daemon) | A claim check needs identity beyond rule ids |
| Skill-name check | none | A single listing of skill names across core and domains | A dead skill reference is found that review missed |
| Durable claim identity (deferred by the owner, 2026-11-06) | Rule claims keyed by (holder, id); other claims held by admission and asking | Claim ids added later without rewriting documents | A duplicate meaning slips past admission and is found in use |
| User-doc topology (PF-I010) | Keep the four Diataxis roots plus `docs/knowledge` | One profile root for user docs | After slice 1 lands |
| Agent Context Engine (PF-I007) | none | Rule claims keyed so a reducer can select them | H3 opens |
| Migration tooling retirement (proposal 9.2 step 5) | Already done in `159971615` | — | — |

## 12. Implementation Alignment

| Behavior claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| Door skill and pointer line | planned | — | slice 1 plan |
| Live templates | planned | templates carry History headers today | move and fix |
| One check command over paths | partial | `scripts/doc-health.mjs` checks the whole corpus only | add path input and Convention check |
| Verb reference rule | planned | scout section 3 | add rule and sweep |
| Rule-claim owner rule | planned | scout section 7 | add rule and sweep |
| Pre-commit runs the check | planned | the Convention spec states doc-health is not in pre-commit | item `p-cd2ejz7wa5` |
| Registry repairs and honest commit gate | planned | scout section 2; panel outcome section 2 | item `p-cd2ejz7wa5` |
| Admission by effect | planned | panel outcome section 2 (seven paths, cited lines) | role set at reserve; active-on-create refused; supersede and move rules; topic admission by approved ask (6.8) |
| Admitted role set | decided | owner 2026-11-06 (7.7) | enforce at `fgos doc reserve`; map or retire classifier roles |
| Retrospective writer grows by default | planned | panel outcome R5 (cleanup gate) | item `p-ixrbglli5o` |
| Owner by claim, audience by surface | planned | prior discussion `docs/history/compound-learn-artifact-registry/DISCUSSION.md` section 4; proposal 3.2, 3.3, A6 | skill text |
| Declared-subject search over every root | partial | `fgos authoritative-match` needs `--quadrant`; subjects: 0 of 618 platform, 67 of 332 knowledge | extend the verb |

## 13. Verification

One owning proof per behavior, in the file that owns the module:

| Behavior | Owning proof |
|---|---|
| Path input, the verb rule and the claim rule | Synthetic cases in `test/scripts/doc-health.test.mjs` |
| Whole-corpus wiring | The existing live case in the same file |
| Pre-commit wiring | One case in the existing hook test |
| Aging-check fix | A case beside the existing doctor doc-check tests |
| Declared-subject search over every root and the `Canonical for` header | The existing `authoritative-match` test, extended |

Done means: `npm test` and `cargo test --workspace` are green apart from tests that fail the same way on main, and the check command passes on the swept corpus.

## 14. Related Files

| Relationship | File |
|---|---|
| design proposal | [documentation-system-unification.md](../proposals/documentation-system-unification.md) |
| governance | [governance.md](../governance.md) |
| design rationale | [documentation-system-design.md](architecture/documentation-system-design.md) |
| placement rules | [Convention spec](../convention/spec.md) |
| registry contract | [knowledge-registry.md](../work-state/contracts/knowledge-registry.md) |
| deferrals | [intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| facts | [scout report](../../../plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md) |

## 15. Decision History Summary

- 2026-11-06: draft. Slice 1 is the write door, built by extending the existing doors. No new verb (reconciles proposal 4.5 with Phase 10 decision 1). Platform documents keep path identity. Rule claims are keyed by (holder, id). Unsigned.
- 2026-11-06, owner review: an owner is found by claim and claim kind, never by topic. The audience (agent, developer, user) decides only the surface. This builds on the settled identity axes of the compound-learn registry discussion (D-tsk28x-1, 3, 4, 13 and 14) and on proposal 3.2 and 3.3. Following A6, it supersedes the "two registries" clause of D-tsk28x-8 (to be recorded on signing).
- 2026-11-06, architecture panel and owner decisions (7.7): the rule "no match, then create" is withdrawn; a writer must be admitted to open or move authority (6.7), and a missed lookup never grants create. The headline promise is narrowed to admission. Six roles are admitted for new writes. No new coordinate system, no durable claim identity in slice 1. Two items opened: `p-cd2ejz7wa5`, `p-ixrbglli5o`.
- 2026-11-07, lead: topic admission contract written (6.8). A new, split or renamed topic needs an approved answer on a work item whose question names it, checked at the store door for new events; no topic status or event type is added. The limit that no person is proven is declared, for topics and for promote.
