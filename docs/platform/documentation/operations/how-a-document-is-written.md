# How a Document Is Written

```txt
Document type: Guide
Audience: Human reviewer, maintainer, documentation agent, implementation agent
Purpose: Walk through one write from draft to commit: how locate decides whether a document is grown or created, how a created document gets its place and name, and how its parts link to the documents that already own related statements
Design status: Follows the signed write-door, document-identity, admission and doc-checks specs; it adds no rule of its own
Implementation: Partial. pkm locate exists outside fgOS (v0.2.1, measured on this corpus); `fgos doc locate`, the documentation skill, the live templates and the admission reviewer do not exist yet (section 12)
Canonical: Yes
Provenance: Written 2026-11-13 at the owner's request, after the owner asked how a writer locates by several sections without breaking the narrative of a document
Writer type: Agent draft writer
Canonical for: The worked procedure and examples of a documentation write
Use this when: Writing or reviewing any maintained document, or explaining why a write grew one document instead of creating another
Do not use this for: The rules themselves; each step links the spec that owns its rule
Last reviewed: 2026-11-13
Related:
- docs/platform/documentation/subcomponents/write-door/spec.md
- docs/platform/documentation/subcomponents/document-identity/spec.md
- docs/platform/documentation/subcomponents/admission/spec.md
- docs/platform/documentation/subcomponents/doc-checks/spec.md
- docs/platform/convention/spec.md
```

Read with: [write door](../subcomponents/write-door/spec.md) (the order of the steps), [document identity](../subcomponents/document-identity/spec.md) (locate and the axes), [admission](../subcomponents/admission/spec.md) (who allows a creation), [doc-checks](../subcomponents/doc-checks/spec.md) (what is checked), [Convention](../../convention/spec.md) (paths and kinds).

## 1. Two Kinds Of Write

Every write goes through the same door, but there are two kinds, and locate serves each one differently.

| | A purposeful document | A knowledge note |
|---|---|---|
| Examples | a spec, a contract, a guide, an architecture note | a pitfall, a procedure, a decision learned while closing a work item |
| Unit | the whole document: many sections, many kinds of content, one line of argument | one claim plus its evidence ([identity 5.2](../subcomponents/document-identity/spec.md#52-the-unit-that-carries-coordinates)) |
| Who starts it | a person or agent with a design or a change to describe | mostly the retrospective writer, one work item at a time |
| What locate is for | finding the statements in the draft that **already have an owner elsewhere**, so the document links to them instead of copying them | finding the note that **already carries the claim**, so the writer adds evidence to it instead of opening a new note |
| What locate never does | split the document or rewrite its argument | decide by itself; the writer reads and decides |

A spec is never made atomic. Thirty sections about one area are normal: the whole spec carries one set of coordinates, and locate still points into its sections by their text ([identity 8.2](../subcomponents/document-identity/spec.md#82-the-search-view), pkm decision D14).

## 2. The Steps At A Glance

```txt
1 draft the narrative ─► 2 pick the claims to check ─► 3 locate (one call, one part per claim)
        ─► 4 read and decide per claim ─► 5 place and name (only for what is created)
        ─► 6 write, with links to owners ─► 7 check, regenerate, log, commit
```

The order is the write door's ([6.1](../subcomponents/write-door/spec.md#61-a-write-step-by-step)). Steps 3 and 4 run once per write, not once per section.

## 3. Step 1: Draft The Narrative

Write the document the way it should read: purpose, the argument, the sections the template asks for. Do not locate first and assemble the document from search results; that produces a patchwork. The draft is the content: what survives step 4 is written as drafted.

For a knowledge note the draft is one paragraph: the claim and its context (what happens, where, how it shows). A one-line title is not enough: on the fgOS gold set a short opening found the right note at top 3 for 65.9% of queries, a paragraph for 91.7%.

## 4. Step 2: Pick The Claims To Check

Not every sentence is checked. Pick the statements that **could already be written somewhere else**:

| Check it | Do not check it |
|---|---|
| a fact about current behavior (`current-truth`) | the document's own purpose and introduction |
| a rule, with or without a rule id | the new design the document exists to state, when nothing else could hold it |
| a decision and what it superseded | transitions and summaries of your own sections |
| a procedure, a failure mode, a lookup value | examples you made up for this document |

A purposeful document usually has three to six such statements. Each becomes one **part**: a paragraph in the corpus's language. fgOS documents are mostly English, so a Vietnamese draft is translated first; Vietnamese over English documents found 0% at top 3, the translation 91.7%, both languages together 62.5% ([identity 8.1](../subcomponents/document-identity/spec.md#81-locate-before-every-write)).

## 5. Step 3: Locate

One call carries every part (pkm accepts up to 8; more parts take a second call). Optional inputs: a region guess, such as `area=runner`, chosen from the closed list ([identity 7.1](../subcomponents/document-identity/spec.md#71-area-values)), and `top` (default 10).

For each part, locate returns up to ten documents, ranked by their best-matching section, each with:

- the **section** it points to, as a heading path, and a short excerpt;
- the **region state**: `match` (inside the guessed region), `unplaced` (the document has no `area` yet) or `outside-region` (another region; kept, never dropped, because writers often guess the region wrong);
- **places**: how many candidates sit in each region, with that region's home folder; a count, not a score;
- for several parts, **group**: whether the parts' best homes are the same or different.

The answer also names the index it came from (`profile_digest`, build time), so a later reader can tell a real miss from a stale index. There is no verdict and, by default, no score: queries about subjects with no owner scored as high as queries with one (0.74 to 1.00).

## 6. Step 4: Read And Decide Per Claim

Open one to three candidates per part. Read the section locate points to, but read the document around it too: the pointed section was the right one in 13 of 23 measured cases, while the right document was in the top 3 in 22 of 24 ([measurement](../../../../plans/reports/measurement-261113-1033-docos-pkm-locate-eval-fgos-corpus.md)).

For a purposeful document, each checked statement ends in one of these:

| Decision | When | What happens to the draft |
|---|---|---|
| **link** | another document already owns the statement | the paragraph shrinks to one sentence plus a link to the owning section; the argument still reads through |
| **keep** | no one owns it; this document becomes its owner | unchanged |
| **grow elsewhere** | it is new, but another area owns its kind of statement (a config key, a rule for every doctor row) | written in the owner; the draft keeps one sentence plus a link at the same place |
| **ask** | two candidates could own it | ask the owner with the decision-question template |

For a knowledge note the four decisions are `grow`, `ask`, `create` and `no-place` ([write door 6.1](../subcomponents/write-door/spec.md#61-a-write-step-by-step)):

- `grow`: a note carries the claim; add the evidence line (section 10);
- `ask`: two notes fit;
- `create`: no note carries it; request admission with the locate result and one sentence per candidate on why it does not carry the claim;
- `no-place`: no value of the closed `area` list fits; never open one yourself; request admission the same way.

A missed lookup is never permission to create ([identity 9](../subcomponents/document-identity/spec.md#9-rules-and-invariants)).

## 7. Step 5: Place And Name (Only For What Is Created)

Growing needs no new name. A creation needs a place and a name, and both come from fixed lists, never from the writer's wording:

1. **Area.** Pick one value from the closed list. Locate's `places` shows where the nearest documents live; the first entry is the usual choice, and another value from the list is allowed.
2. **Question.** Pick the kind of question the new content answers ([identity 5.4](../subcomponents/document-identity/spec.md#54-locating-axis-question)).
3. **Document kind.** The question decides the kind ([identity 7.2](../subcomponents/document-identity/spec.md#72-question-to-document-kind)): `current-truth` gives a spec, `obligation` a contract, `procedure` a guide or runbook, `pitfall` a spec's edge-case section or a user pitfall note, and so on. Some questions land in a section of an existing document, not in a new file: a decision of an area goes into its spec's decision history, a platform pitfall into its spec's edge cases.
4. **Admission.** A new user topic, a new sub-area or a new area passes [admission](../subcomponents/admission/spec.md#61-effects-that-need-admission) first. A platform document of an existing kind in an existing area does not create a topic; it still passes the check.
5. **Path.**
   - Platform document: the path follows the Convention placement rule for its kind, for example an area spec at `docs/platform/<area>/spec.md` or a guide under `docs/platform/<area>/operations/`. Confirm it with `fgos convention classify --dir $PWD -- <path>`, which names the kind; the pre-commit hook refuses a path no placement rule admits.
   - User document: the slot is (area, sub-area, question), as in `docs/knowledge/<area>/<sub-area>/<question>.md` ([identity 5.7](../subcomponents/document-identity/spec.md#57-locating-axis-area-rules)), opened with `fgos doc reserve` after admission.
6. **Name and title.** The title states what the document asserts. For a user note, it is the claim. For a platform document, it follows the kind ("Runner Area Specification"). Copy the live template for the kind, with its real header fields ([write door 6.3](../subcomponents/write-door/spec.md#63-live-templates)).

## 8. Step 6: Write, With Links To Owners

These are the ways the parts of a document relate to the parts of others:

| Relation | How to write it | Rule owner |
|---|---|---|
| A statement another document owns | one sentence plus a link to the owning **section anchor**, not to the top of the file | [write door 7](../subcomponents/write-door/spec.md#7-rules-and-invariants) |
| A rule with an id | cite the holder; never define the same id and title in a second holder | [doc-checks 6.3](../subcomponents/doc-checks/spec.md#63-rule-claim-owner-rule) |
| A decision | cite its id (`D-ADR####`); the narrative stays in the owner's decision history | [governance holder table](../../governance.md#decision-scope-to-holder-table) |
| A fact and the steps that use it | split: the fact grows its `current-truth` owner; the procedure links to it | [write door 10](../subcomponents/write-door/spec.md#10-edge-cases) |
| A pitfall and the rule it breaks | the pitfall tells what goes wrong and links to the rule | [identity 8.6.1](../subcomponents/document-identity/spec.md#861-a-pitfall-about-reclaiming-a-worktree) |
| A name a register can confirm (verb, path, rule id, tool, decision) | write it in backticks so the indexer extracts it; it must resolve | [identity 5.6](../subcomponents/document-identity/spec.md#56-narrowing-axis-identifiers-what-counts-and-the-common-kinds), [doc-checks 6.2](../subcomponents/doc-checks/spec.md#62-verb-reference-rule) |
| A surface for another audience | link to the owner or generate from it; never a hand copy | [write door 5](../subcomponents/write-door/spec.md#5-concepts) |
| Documents read together | the `Related` header list and a clickable "Read with" line | project documentation rules |

When the new document becomes the owner of something an existing document mentioned only in passing (example A, the fallback), grow that existing document with a link to the new owner. Links then run from mentions to the owner, never between two copies.

## 9. Step 7: Check, Regenerate, Log, Commit

1. Run the check command on the changed paths: `node scripts/doc-health.mjs --repo-root .` ([doc-checks 6.1](../subcomponents/doc-checks/spec.md#61-the-check-command)).
2. Regenerate projections through their own verbs when a decision or a registry entry changed (decision index, document registry).
3. Log the locate decision per part: the draft, the region, the candidates, the decision. The observer reads this log later ([identity 8.5](../subcomponents/document-identity/spec.md#85-self-improvement)).
4. Commit by pathspec, the document and every grown owner in one commit.

## 10. Example A: A New Spec With Several Sections

The task: specify fgOS's locate port (build step 3 of the [area map](../spec.md#4-build-order)).

**Draft sections:** 1 Purpose; 2 the port's contract (input a draft, output candidates); 3 pkm is linked into the host and OHS runs outside; 4 without OHS the port falls back to full-text search; 5 the doctor rows (OHS present, index fresh); 6 the config keys (index path, model).

**Claims checked:** sections 3, 4, 5 and 6. Sections 1 and 2 are the new design itself. Four parts, one call, region `area=documentation`.

**Locate (illustrative, shortened):**

```txt
part 3  1. documentation/subcomponents/document-identity/spec.md › 8.2 The search view        match
part 4  1. documentation/subcomponents/document-identity/spec.md › 8.2 The search view        match
        (one sentence mentions the fallback; no candidate describes how it works)
part 5  1. packaging-distribution/contracts/setup-doctor-registry.md › 3 ...                  outside-region
part 6  (the key list in core/config-standard/, not a Markdown document)
group   parts 3 and 4: same home, docs/platform/documentation/
```

**Decisions:**

| Part | Decision | Result in the new spec |
|---|---|---|
| 3 | link | "pkm is linked into the `fgos` host and OHS runs as an external process ([document identity 8.2](../subcomponents/document-identity/spec.md#82-the-search-view))." |
| 4 | keep | the full mechanism stays; the new spec owns it. Identity 8.2 grows one link to it |
| 5 | link + keep | the general doctor rules are linked to [setup-doctor-registry](../../packaging-distribution/contracts/setup-doctor-registry.md); this port's own rows stay in the spec |
| 6 | grow elsewhere | the keys are added to [core/config-standard](../../../../core/config-standard/) and [core/config-schema](../../../../core/config-schema/), as the install gate requires; the spec names each key and links there |

**Outcome:** one new file with all six sections in the drafted order; two paragraphs became one-sentence links; two existing places grew (a link in identity 8.2, keys in config-standard). Nothing was cut out of the draft and rewritten elsewhere. When identity 8.2 changes later, the new spec cannot drift, because it holds a link, not a copy.

## 11. Example B: A Knowledge Note That Grows

The claim, from a developer's note translated to English: "`pick` is refused with exit 7 because the lock on the main checkout is held. Before deleting the lock, check whether the holder is still alive, whether it has expired, or whether to wait."

**Locate** (real output of pkm v0.2.1 on the fgOS corpus, 2026-11-13, region guessed as `area=runner`, top 5):

| Rank | Document › section | Region |
|---|---|---|
| 1 | [wait-out-an-active-main-checkout-lock-holder.md](../../../knowledge/how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md) › Steps | unplaced |
| 2 | [check-main-checkout-lock-status-before-retrying.md](../../../knowledge/how-to-check-main-checkout-lock-status-before-retrying/check-main-checkout-lock-status-before-retrying.md) › Steps | unplaced |
| 3 | [clear-a-stuck-main-checkout-lock.md](../../../knowledge/how-to-clear-a-stuck-fgos-main-checkout-lock/clear-a-stuck-main-checkout-lock.md) › Steps | unplaced |
| 4 | `docs/platform/run-supervisor/spec.md` › 14. Setup and doctor | outside-region |
| 5 | `docs/platform/holder-lock/spec.md` › 14. Main checkout: one door, one lock… | outside-region |

`places` counted `holder-lock` and `run-supervisor` once each, and `region_mismatch` said the guess `runner` differs from where the nearest documents live (`holder-lock`). The three user notes are `unplaced` because user notes carry no `area` yet.

**Decision:** `grow`. The first note already carries the claim. The writer adds one line under its `## Evidence` section (created at the end if absent):

```md
## Evidence

- 2026-11-13 tsk-xxx: `fgos pick` refused with exit 7 while a live holder kept the main-checkout lock; waiting with `--wait` succeeded.
```

then commits and runs `fgos knowledge attest --doc-path <that note> --capture-id tsk-xxx`. No topic, no new file. The guessed region was wrong, and `outside-region` still showed the owner of the rule itself (`holder-lock` 14); the note links to that section rather than restating it.

If no note had carried the claim, the writer would `fgos submit` an item "Admission request: <claim>" and record `fgos knowledge handoff` with the claim, the drafted paragraph and the locate result; the retrospective item then reaches cleanup on that record ([write door 6.4](../subcomponents/write-door/spec.md#64-the-retrospective-writer)).

## 12. Example C: New Content Whose Parts Belong To Two Homes

A writer documents two new things learned from one change: (1) a procedure for rebuilding a stale OHS index, and (2) a new rule that every rebuildable cache lives under `.fgos/runtime/`. One call, two parts (illustrative):

```txt
part 1  no candidate carries it; places: documentation (4)
part 2  no candidate carries it; places: packaging-distribution (5), documentation (1)
group   parts 1 and 2: different homes, split
```

Both are `create`, and both go through admission. Part 1 becomes a guide in `docs/platform/documentation/operations/`; part 2 grows the packaging-distribution spec, which owns install and runtime layout. The guide's step "the index lives under `.fgos/runtime/`" is one sentence linking to that rule. The reader of the guide still reads one procedure from start to end; the rule has one home that other guides can link to.

`group` only advises on parts that are **created**. It never asks to split a document being written as one argument, as in example A.

## 13. What Exists Today

| Piece | Today | Target |
|---|---|---|
| Locate | pkm `v0.2.1` outside fgOS; recall on this corpus 91.7% at top 3, 95.8% at top 10 | `fgos doc locate` through a locate port, pkm linked into the host (build step 3) |
| Interim locate for the retrospective writer | `rg` over `docs/knowledge`, `docs/explanation`, `docs/how-to` and the registry listing | replaced by `fgos doc locate` |
| Region of user notes | none: 505 of 691 documents are `unplaced` | `area` filled when a note is next edited, checked by doc-checks |
| Platform paths | written by the writer from the placement rules; `fgos convention classify` and the pre-commit hook check them; `fgos convention path` generates names only for reports, plans and journals | unchanged unless the door needs generation |
| User-note paths | `docs/knowledge/<topic>/<slug>.md`; `fgos doc reserve` records the path the writer passes | the (area, sub-area, question) slot |
| Admission reviewer and weekly ceiling | specified, not built | admission phase (build step 4) |
| Live templates | not moved yet | one per kind under this area's operations folder |
| Evidence section and handoff record | planned in [phase 1 of the retrospective plan](../../../../plans/261113-0124-docos-retrospective-claim-units/plan.md) | build step 1 |

## 14. Related

- [Write door](../subcomponents/write-door/spec.md): the steps and dispositions this guide walks.
- [Document identity](../subcomponents/document-identity/spec.md): locate (8.1), the search view (8.2), the axes (5), fgOS values (7).
- [Admission](../subcomponents/admission/spec.md): which effects need a reviewer, the frame and the ceiling.
- [Doc-checks](../subcomponents/doc-checks/spec.md): the check command and its rules.
- [Measurement of pkm locate on this corpus](../../../../plans/reports/measurement-261113-1033-docos-pkm-locate-eval-fgos-corpus.md).
