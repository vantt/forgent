# Documentation Component Specification

```txt
Document type: BA-grade area specification
Audience: Human reviewer, maintainer, implementation agent, documentation agent
Purpose: Define the Knowledge and Documentation Engine (horizon H2): the one door an agent uses to write or change maintained documentation, and the checks that keep one owner per claim, built by extending the doors that already run
Design status: Draft proposal. Not signed. Owner questions stand in section 11.
Implementation: Not started for the write door and the two new checks; the registry, Convention placement rules, doc-health and the decision index it extends are implemented
Canonical: No (becomes canonical when signed)
Provenance: First committed 2026-11-06 by the DOCOS lead from the H2 scout report plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md and the proposal docs/platform/proposals/documentation-system-unification.md
Writer type: Agent draft writer
Canonical for: Nothing yet; it is the draft for the documentation write door and claim-owner checks, and becomes canonical only when signed
Use this when: Reviewing what H2 slice 1 builds, what it reuses, and what it defers
Do not use this for: Current documentation rules: until signed, governance.md, the Convention spec and the knowledge-registry contract hold them
Last reviewed: 2026-11-06
Related:
- docs/platform/proposals/documentation-system-unification.md
- docs/platform/governance.md
- docs/platform/convention/spec.md
- docs/platform/work-state/contracts/knowledge-registry.md
- docs/platform/intent-preservation-ledger.md
- plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md
```

Read with: [proposal](../proposals/documentation-system-unification.md) (objectives A1–A6 and B1–B6, sections 0.2, 0.3, 4.3–4.7, 9.2 and 10), [governance](../governance.md), [Convention spec](../convention/spec.md), [knowledge-registry contract](../work-state/contracts/knowledge-registry.md), [intent ledger](../intent-preservation-ledger.md), [scout facts](../../../plans/reports/scout-261106-1430-docos-h2-knowledge-documentation-engine-facts.md).

## 1. Current Summary

H1 is closed: platform documentation lives under `docs/platform/`, Convention blocks wrong placements, and doc-health checks links, the metadata header and dead backticked paths. The proposal's H2 is the Knowledge and Documentation Engine.

This spec covers H2 **slice 1**, the write door. It meets objective A4 and acceptance items 1–7 of proposal section 10 by extending four doors that already run:

- the Knowledge Registry, which handles identity and lifecycle of user documents;
- Convention, which handles path, kind and cardinality;
- doc-health, which handles body health;
- `state.decisions`, which handles decisions.

Slice 1 adds no store, no graph, no daemon and no new `fgos doc` verb. The capabilities it defers are recorded in section 11.3 and in the intent ledger, as section 0.3 of the proposal requires.

The engine is not a new component. It is the documentation area made of these existing doors. The registry keeps its contract in the work-state area until a later slice moves it here.

## 2. Scope

### 2.1. In Scope

- One documentation door: a skill that every agent reaches through one always-loaded pointer line.
- The owner rule: an owner is found by claim and claim kind, never by topic; the audience decides only the surface (section 5.1).
- `fgos authoritative-match` extended to every documentation root and to the platform `Canonical for` header, so declared subjects are searched in one place.
- Live templates the door copies.
- One documented check command over changed documents.
- Two new body rules in doc-health:
  - a referenced `fgos` verb exists;
  - a rule claim has one owner.
- Running the check on staged documents in pre-commit.
- Repairing the registry defects the door would inherit.
- Answers to the proposal's two open questions (section 7.5).

### 2.2. Out Of Scope

- Claim identity beyond rule ids; the typed graph; claim-level supersession.
- A `platform-docs` profile in the registry.
- The Agent Context Engine (H3, PF-I007).
- Moving user documentation roots (PF-I010).
- The Convention project overlay (Convention Q13).
- A shipped `fgos doc check` verb.
- A skill-name existence check.

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

- **Claim.** One statement the documentation asserts: a rule, a behavior, a contract field, a decision, a user task procedure. Each claim has exactly one owner (A1), whoever reads it.
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
  - role: one value from a closed set, the file name;
  - entity: several values, tags only;
  - writing framework and mode, e.g. Diataxis, kept separate from identity.

  At most one active document exists per (purpose, role).

### 5.2. Other concepts

- **Document profile.** Slice 1 has two profiles and no new store.
  - User profile: registry slots `topicId:role`, written under `docs/knowledge/` and the Diataxis roots.
  - Platform profile: paths admitted by Convention under `docs/platform/`. Identity is the path, which is unique wherever Convention's cardinality is `singleton`.
- **Rule claim.** A rule definition written as a bold rule id with its title in parentheses, e.g. `**RUL7 (title)**`, plus D-ADR numbers and the L1–L10 laws. The claim key is (holder document, id). An id is unique only inside its holder: 48 RUL ids are reused across holders with different meanings (scout section 7).
- **Holder.** The document that owns a claim, resolved through the governance [holder table](../governance.md#decision-scope-to-holder-table).
- **Command listing.** The `commands[].name` set printed by `fgos --help --json`, which is the one machine list of `fgos` verbs, plus the hidden verb `internal`.
- **Template.** A starting file for one document type. Today's templates sit under the documentation history folder and carry a `Document type: History` header, so a copy of one starts with a wrong header. Slice 1 moves them under this area's operations folder, where Convention row `doc-guide-runbook-1` already admits them, and gives them their real headers.

## 6. Behaviors And Operations

### 6.1. Write or change a document (the door)

```txt
Runs when: a request to write, change, move or retire maintained documentation reaches the documentation skill.
Blocked when: the claim already has an owner and the request would create a second one; the target path fails Convention; the check command fails.
What changes: the agent finds the owner, grows the existing document (or creates one only when no owner exists), copies the live template for a new document, edits it and runs the check.
Afterwards / side effects: generated projections are regenerated through their existing verbs (decision-index, docs-index, doc-registry); mdview preview runs when governance requires it; the agent reports the disposition (grew, created, moved, retired) and the check output.
```

The skill's steps, in order:

1. List the claims the change asserts, and give each one its claim kind (5.1). Note the audience, but only to choose the surface in step 8.
2. Find each claim's owner, stopping at the first answer:
   1. **Exact keys.** A rule id inside its holder (governance holder table). A Convention singleton path for the owning type and area, checked with `fgos convention classify`. A registry slot (purpose, role) for a user task.
   2. **Declared subjects.** Match the claim against the declared subjects of documents of the owning type (`Canonical for`, `authoritative_for`) through `fgos authoritative-match`, extended to every documentation root.
   3. **Still ambiguous.** Two candidates, or a candidate whose subject is boilerplate: stop and ask with the decision-question template. Never guess an owner (A5).
3. Choose grow, create, discuss, promote, supersede or retire. Grow is the default; create only when step 2 finds no owner. When the agent grows a document whose declared subject is boilerplate, it writes the real subject in the same change. Coverage therefore rises with use, with no bulk sweep.
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

This catches the 7 duplicated claims found today: `RUL1`–`RUL3` and `RUL5`–`RUL8`, each defined in both `docs/platform/work-state/spec.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. It does not use the `Canonical for` header, which is boilerplate (one string is shared by 60 documents).

### 6.5. Registry repairs the door depends on

The repairs, which change no contract:

- `doc-provisional-aged` parses `updatedAt` before subtracting. Today it subtracts an ISO string, gets `NaN` and never fires.
- The 19 tracked user documents missing from the registry are registered, and the one registered path missing on disk is resolved.
- The tracked, empty `.fgos/docs/enduser-docs-index.json` is removed if no reader is found; otherwise the readers move to `docs/enduser-docs-index.json`.

Closing the free-form role set (365 roles for 479 documents) needs a vocabulary decision and is deferred.

### 6.6. Search declared subjects

```txt
Runs when: the door's step 2.2, or by hand.
Blocked when: never; it only reads.
What changes: nothing.
Afterwards / side effects: returns the documents whose declared subject matches, or none; with --check-duplicates, every group of two or more documents that declare the same subject.
```

Today `fgos authoritative-match` reads `authoritative_for` only under a quadrant directory passed with `--quadrant`. Slice 1 extends the same verb so that, with no `--quadrant`, it reads every documentation root. It also reads the platform `Canonical for` header field as the same concept, and skips boilerplate subjects. This is an extension of an existing read verb, not a new one.

## 7. Rules And Invariants

1. **One door.** Maintained documentation is written through the documentation skill; an always-loaded line points to it and holds no rules itself (proposal 4.4, L8).
2. **Extend, never alongside.** Path and kind stay in Convention, body rules stay in doc-health, user identity stays in the registry, decisions stay in `state.decisions`. Slice 1 adds no second checker, store or write door (L10, PF-I024, tsk-1lv D2 and D3).
3. **Owner by claim, not by topic.** Ownership is decided by the claim and its kind. Audience decides only the surface. The same topic legitimately has a spec claim, a contract claim and a user task claim, each with its own owner. The same claim never has two owners.
4. **Grow before create.** The door creates a document only when it finds no owner for the claim.
5. **Ask, never guess.** When exact keys and declared subjects do not settle the owner, the door asks.
6. **One owner per rule claim.** A rule claim is keyed by (holder, id); a repeated definition is a finding, not a style issue.
7. **Named verbs exist.** A canonical document names only `fgos` verbs that run, unless it pins the commit that removed them.
8. **Checks run where writing happens.** The check command runs at the door and in pre-commit on staged docs, not only in the test suite.
9. **No new verb in slice 1.** This reconciles proposal 4.5 with Phase 10 decision 1. Classify stays `fgos convention classify`, the check stays doc-health, and lifecycle stays `fgos doc`. A shipped check verb becomes due only when project-owned rules exist (Convention Q13), because before that the rules describe only fgOS's own layout.

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

## 11. Open Gaps

### 11.1. Sweep needed when the rules land (known findings)

- `core/skills/_shared/private-cell-worktree.md:58` tells agents to run `fgos coordination run`. That verb was removed in `2180b4e72` and the active release answers "unknown verb". The file is reached from the coding cell policy.
- The 7 duplicated rule claims: work-state keeps `RUL1`–`RUL3` and `RUL5`–`RUL8`, because they are event-log and write-door rules and the holder table names work-state for them; the runner subcomponent cites them.
- Removed or planned verbs named without a sha: `docs-lease` (holder-lock spec), `repair` (work-state spec), `evolve` (runner subcomponents) and `unlock` (runner spec). The planned `secrets` sits in an unsigned draft and is exempt.

### 11.2. Owner questions

Listed in the review request that accompanies this draft (Q1 cross-project reach, Q2 pre-commit posture).

### 11.3. Deferred, preserved (non-preclusion, proposal 0.3)

| Capability | Slice 1 does | Must not preclude | Revisit when |
|---|---|---|---|
| Cross-project documentation rules (B6) | User profile works in any project through the shipped registry verbs; platform-profile rules apply in the fgOS repo only | A project-owned rule file merged by rule id (Convention 3.3) and a shipped check verb reading it | Convention Q13 is decided |
| Real declared subjects on every platform document | Written when the door grows a document; boilerplate is skipped by the matcher | One subject field name across profiles (`Canonical for` and `authoritative_for` merged) | Coverage stalls, or a duplicate owner slips past the matcher |
| Generated agent surface (A6) | Surfaces link to the owner | Every claim keeps a single source from which a distilled surface can be generated | H3 opens |
| `platform-docs` registry profile, document and claim identity, typed graph | Path identity from Convention, claim key (holder, id) | Registry fields becoming profile-specific; a graph derived, never stored (D2) | A claim check needs identity beyond rule ids |
| Skill-name check | none | A single listing of skill names across core and domains | A dead skill reference is found that review missed |
| Closed role vocabulary | none | Roles moving into a closed list per profile | Registry generalization starts |
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
| Pre-commit runs the check | planned | the Convention spec states doc-health is not in pre-commit | Q2 |
| Registry repairs | planned | scout section 2 | fix |
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
