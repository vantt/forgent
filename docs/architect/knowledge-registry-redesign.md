# Knowledge Registry Redesign

Status: design target
Date: 2026-08-25
Scope: retrospective knowledge, end-user document identity, topic/doc registry, source linkage, migration, and harness enforcement

## 1. Problem Statement

fgOS turns completed work into end-user documentation during the retrospective part of the work-item lifecycle. The current mechanism classifies each document by one axis: the Diataxis quadrant. The quadrant also determines where the file lives, because documents are written under `docs/<quadrant>/`.

That single axis now carries three different jobs:

1. how the document should be written;
2. where the document should live;
3. what the document is about and which long-lived knowledge slot owns it.

This creates a structural sprawl problem. Each retrospective run can choose a new filename from local judgment, check whether that exact path exists, and create a new document when it does not. There is no mandatory registry-level answer to "does this subject already have a home?"

Measured on the design-source snapshot from 2026-08-25, the end-user corpus has 268 documents: 161 explanation, 85 how-to, 21 reference, and 1 tutorial. It had grown by 50 documents in 7 days. At that rate, the corpus doubles in roughly five weeks if the shape does not change. A separate name-level measurement found at least 93 of 330 document names touching two or more entities, so entity-as-folder is not viable.

The immediate failure is not that the prose is low value. The failure is that knowledge identity is inferred from path spelling at write time instead of being owned by a registry.

## 2. Goals

1. Stop corpus growth from tracking work-item count.
2. Make each long-lived knowledge subject addressable before prose is written.
3. Preserve the useful part of Diataxis as a writing framework without making it the filesystem layout.
4. Keep topic and document identity durable across renames, splits, merges, and file moves.
5. Preserve all historical capture linkage without rewriting old capture events.
6. Let raw material be captured continuously without human approval.
7. Require explicit document promotion before rendered prose becomes authoritative, unless a future decision narrows that rule.
8. Close the write-time escape hatch in code, not by relying on skill prose or rollout order.
9. Make migration auditable with conservation: every old document is accounted for exactly once.
10. Provide a harness that proves the registry prevents sprawl, preserves source reachability, and keeps projections fresh.

## 3. Non-Goals

1. Do not invent a fifth Diataxis quadrant.
2. Do not make entity names part of the directory tree.
3. Do not allow multiple active documents for the same topic and role.
4. Do not rewrite historical `docPath` values in capture events.
5. Do not use a hand-edited JSON file as the registry source of truth.
6. Do not require a daemon.
7. Do not fold the storytelling-material pipeline into this design; that remains a separate item.
8. Do not rename historical discussion text that used the old term `compound`.

## 4. Core Decision

The replacement boundary is called **knowledge**.

`knowledge` is the process boundary: raw work capture becomes routed, authored, attested, and eventually promoted knowledge.

`topic` and `doc` are sibling state namespaces, not subcommands under `knowledge`:

```txt
fgos topic register
fgos topic split
fgos topic merge
fgos topic rename
fgos topic retire

fgos doc reserve
fgos doc mark-rendered
fgos doc move-path
fgos doc promote
fgos doc supersede
fgos doc retire
```

Do not expose `fgos knowledge topic register`. Registry operations are state operations. Knowledge execution is a process. fgOS already keeps those surfaces flat, and a three-level CLI would add weight without adding safety.

`promote` exists only as `fgos doc promote`. Promotion is a document state transition from provisional to active. A second entry point such as `fgos knowledge promote <doc>` would create two names for the same action and invite contract drift.

The legacy word `compound` remains valid when referring to historical records, existing command names, and old discussion rounds. Going forward, the architectural boundary is `knowledge`. The legacy producer command can remain as a compatibility alias only if it enforces the same registry gate as the new attestation surface.

## 5. Vocabulary

### 5.1 Capture

Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.

### 5.2 Material

Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.

### 5.3 Topic

A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"

A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.

### 5.4 Purpose

Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.

### 5.5 Role

Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"

Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.

Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.

Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.

### 5.6 Entity

Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.

### 5.7 Framework And Mode

Framework and mode describe how to write the document. Diataxis is the first framework:

```txt
framework: diataxis
mode: explanation
```

Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.

Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.

### 5.8 Document Lifecycle

Documents use the lifecycle vocabulary:

- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.

Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.

## 6. Identity Model

### 6.1 Cardinality

The central invariant is:

```txt
activeDoc(topicId, role) <= 1
```

There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.

If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.

### 6.2 Path Projection

The normal projected path is:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.

### 6.3 Current Path And Aliases

Each document slot has:

- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.

Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.

### 6.4 Topic Lineage

Topic lineage records:

- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.

Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.

## 7. Registry Model

The registry source is event-sourced. Projections are derived.

### 7.1 Topic Events

```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```

A topic record contains:

```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```

### 7.2 Role Registry

Role vocabulary is a registry with explicit policy:

```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```

Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.

### 7.3 Document Events

```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```

A document record contains:

```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```

### 7.4 Attestation

Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.

An attestation records:

```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```

`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.

## 8. Producer Enforcement

The producer door must enforce registry membership in code. Skill prose is not enough.

The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:

```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```

This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.

### 8.1 Reserved Slots

New documents are created by reserving a slot first:

```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```

The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.

`reserved` is not a prose lifecycle claim. It is a registry-level path hold.

### 8.2 Provisional By Default

The conservative policy is: rendered prose becomes `provisional`, not `active`.

A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.

Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.

## 9. Resolver

Every read surface that accepts a document path must resolve through the registry:

```txt
resolveDocPath(path):
  if path equals currentPath: return doc
  if path equals alias: return doc with aliasHit
  otherwise: return null
```

Read surfaces use both current and historical paths:

- `doc-sources oldPath` returns captures that named the old path and the current document they now feed.
- `doc-sources currentPath` returns captures that named the current path plus captures that named aliases.
- `docs-index` displays current paths, lifecycle, topic, role, framework, mode, entities, and source reachability.

The resolver must distinguish read forgiveness from write strictness. Alias resolution is allowed for reads. It is refused for new writes.

## 10. Projections

The registry has two required snapshots.

### 10.1 Machine Projection

`docs/knowledge-registry.json` is the machine-readable projection. It is derived and overwritten, not edited by hand.

It contains:

- role vocabulary;
- topics;
- documents;
- aliases;
- lineage;
- lifecycle;
- source reachability summary;
- generated timestamp or projection version if the repo's projection convention allows it.

### 10.2 Human Projection

`docs/knowledge-registry.md` is the human-readable projection. It must show what `ls docs/` cannot:

- topics registered without documents;
- reserved documents without rendered prose;
- provisional documents waiting for promotion;
- active documents per topic and role;
- aliases from old paths;
- topic split/merge/rename lineage;
- retired topics and successors;
- topics over size thresholds;
- suspicious roles with too little usage;
- near-duplicate topics or documents.

The Markdown projection is not a second source of truth.

## 11. Correct Implementation Order

The order matters because registry bootstrap needs classification output.

### 11.1 Dependency Rule

Before splitting two plan steps apart, ask:

```txt
Is the output of one step mandatory input to the other?
```

If yes, the steps must be adjacent or treated as one unit.

This applies directly here: bootstrapping a registry row for an old document requires `topicId`, `purposeSlug`, `role`, `entities`, `framework`, and `mode`. Those values are the classifier's output. Therefore classifier/inventory must run before bootstrap.

### 11.2 Sequence

1. Build the registry model and reducer with invariant tests.
2. Build the resolver and alias model with read/write distinction tests.
3. Run classifier/inventory as a read-only pass over the existing corpus. Output one proposed registry row per old file, including `currentPath`, `topicId`, `purposeSlug`, `role`, `entities`, `framework`, `mode`, and proposed target path.
4. Bootstrap the registry from the classifier/inventory output. At this point, the registry can represent all existing files without moving them.
5. Add and enable the producer registry gate: attestation and the legacy compound path refuse any new path that is not a registered current path.
6. Update read surfaces such as document-source lookup and document index generation to use the resolver.
7. Update the writer skill/process to be registry-first: route to topic and role, reserve if needed, write, attest, mark rendered.
8. Run a writer canary outside the migration.
9. Run migration dry-run and conservation checks.
10. Apply the migration: move/fold files by target topic/document, update aliases, regenerate projections.
11. Run full harness and doctor checks.

The key safety property is that enforcement is enabled before files are moved into the new layout. There is no window where old writer logic can create new official paths in a freshly cleaned tree.

## 12. Writer Flow

The writer process becomes:

1. Gather capture and material from the retrospective item.
2. Classify the material into topic, role, entities, framework, and mode.
3. Resolve the target document slot.
4. If the topic exists and the role slot exists, grow the existing document.
5. If the topic exists and the role slot does not exist, reserve the document slot before writing.
6. If the topic does not exist, create a proposal or require `topic register`; do not silently create an active official topic.
7. Write or grow prose at the document's `currentPath`.
8. Commit the prose before attestation.
9. Attest the capture to the registered current path.
10. Mark the document rendered.
11. Promote only through `fgos doc promote` when policy allows it.

The writer never chooses a free-form path and then asks the producer to accept it. Path comes from the registry.

## 13. Migration

Migration has two different phases.

### 13.1 Classification And Inventory

The classification pass is read-only and can run in parallel. It reads the existing corpus and proposes:

```yaml
oldPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
topicId: stale-index-vs-uncommitted-work
purposeSlug: stale-index-vs-uncommitted-work
role: pitfall
entities: [worktree-index, iron-law, test-count]
framework: diataxis
mode: explanation
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

This pass is also the bottom-up vocabulary discovery pass. It does not come after bootstrap; it is bootstrap's input.

### 13.2 Bootstrap Without Moving

Bootstrap creates registry rows for the current corpus while preserving current paths. This lets enforcement begin before layout migration:

```yaml
currentPath: docs/explanation/why-a-stale-worktree-index-produced-a-wrong-iron-law-test-count.md
targetPath: docs/stale-index-vs-uncommitted-work/pitfall.md
```

The current path remains the old path until the migration move event runs.

### 13.3 Dry Run

Dry-run migration groups old files by target document. It reports:

- every source file;
- proposed target topic and role;
- target path;
- source capture ids reachable before migration;
- aliases to be created;
- source files excluded with explicit reason;
- near-duplicate warnings;
- oversized target warnings.

Dry run writes a report, not the documentation tree.

### 13.4 Conservation

Every old file must appear exactly once:

- as a source of one target document; or
- in an excluded list with a reason.

Missing files, duplicate source assignments, and target documents with no source all fail.

### 13.5 Apply

Apply runs after enforcement and read surfaces are registry-aware.

It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.

Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.

## 14. Harness Layer

The harness is part of the design, not a follow-up nicety.

### 14.1 Unit Harness

Reducer and model tests:

- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.

### 14.2 CLI Harness

Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.

### 14.3 Producer Gate Harness

Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.

### 14.4 Resolver Harness

Resolver tests:

- current path resolves to the document;
- alias path resolves to the document for reads;
- alias path is marked as alias hit;
- missing path returns null;
- document-source lookup by old path returns historical captures;
- document-source lookup by current path returns captures from current and alias paths;
- document index displays current path while preserving old path provenance.

### 14.5 Migration Harness

Migration tests:

- inventory includes every current end-user document once;
- conservation fails on missing source file;
- conservation fails on duplicate source assignment;
- conservation fails on target with no source;
- dry-run output is stable;
- apply does not reduce the number of reachable source captures;
- every old path becomes an alias or has an explicit exclusion;
- the three-worktree-docs regression reports a near duplicate even when one candidate proposes a different purpose.

### 14.6 Doctor Checks

Doctor checks:

- `knowledge-registry-stale` - projections differ from registry events;
- `doc-active-duplicate` - more than one active document for `(topicId, role)`;
- `doc-alias-broken` - alias resolves to no live document;
- `doc-current-path-missing` - current path absent at `HEAD`;
- `doc-source-unreachable` - source capture linkage cannot be reached through current or alias paths;
- `doc-near-duplicate` - likely duplicate topic/doc across purpose boundaries;
- `doc-provisional-aged` - provisional document has aged past policy;
- `doc-topic-oversized` - topic exceeds split threshold;
- `doc-role-underused` - role has suspiciously low usage;
- `doc-source-conservation` - migration inventory or apply loses a source.

### 14.7 Metrics

Track:

- new official topics per week;
- new active documents per week;
- new provisional documents per week;
- documents per active topic;
- average source captures per active document;
- alias count and old-path lookup success;
- near-duplicate warnings per week;
- provisional age distribution;
- role proposal count by proposed role;
- docs/day before and after migration.

The system is improving only if new active documents grow slower than work items and old-path source reachability remains intact.

## 15. Canary

Migration is not the first writer test.

A separate writer canary must run before migration apply:

1. register a real topic or use a fixture topic;
2. reserve one document slot;
3. render one document in the new layout;
4. commit it;
5. attest the capture to the registered current path;
6. mark rendered to provisional;
7. verify document-source lookup returns the capture;
8. verify the index/projection shows the document;
9. verify an unregistered path is refused.

This proves the writer is registry-first. Migration tooling proves folding. They are separate concerns.

## 16. Open Questions

1. Should `doc.mark-rendered` ever move directly to `active` when the topic and document slot were explicitly registered by a human?
2. What is the initial role vocabulary after bottom-up classification?
3. What size threshold triggers `doc-topic-oversized`, and should it be count-based, byte-based, source-capture-based, or mixed?
4. What near-duplicate heuristic is good enough for the first version: skeleton match, entity overlap, title overlap, source-capture relation, or a measured weighted score?
5. How many aged provisional documents are acceptable before the system must ask for batch promotion/retirement?
6. Which existing end-user docs should be excluded from migration, if any, and why?

## 17. Pointers

- Source discussion: `docs/history/compound-learn-artifact-registry/DISCUSSION.md`.
- Advisor prompt/report: `.claude/worktrees/tsk-28x-JQyqK4/plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.
- Current write-side spec: `docs/specs/enduser-docs-authoring.md`.
- Current read-side spec: `docs/specs/enduser-docs-index.md`.
- Current compounding skill: `domains/coding/skills/fgos-coding-compounding/SKILL.md`.
- Current producer command: `bin/fgos.mjs`, legacy `compound` branch.
- Current authoritative-topic helper: `src/report/authoritative-match.mjs`.
- Current frontmatter helper: `src/report/frontmatter.mjs`.
- Current index helpers: `src/report/enduser-index.mjs` and `src/report/enduser-index-generate.mjs`.

## 18. Implementation Tasks

Work items that carried this design into code, in the order they were built. All `delivered`.

| id | title |
|---|---|
| `tsk-28x` | Extensible multi-audience artifact-producer registry for fgOS's compound-learn/retrospective (root item) |
| `tsk-28x-1` | Knowledge registry domain model: `topic.*` / `doc.*` events, reducer, invariants |
| `tsk-28x-2` | Resolver `oldPath` -> `currentPath` qua aliases + lineage, chưa đổi consumer nào |
| `tsk-28x-3` | Classifier/inventory dry-run trên 268 tài liệu |
| `tsk-28x-4` | Bootstrap registry bằng chính output classifier (`currentPath=oldPath`), idempotent và chạy lại được |
| `tsk-28x-5` | Verb surfaces: `fgos topic register\|split\|merge\|rename\|retire` và `fgos doc *` |
| `tsk-28x-6` | `fgos knowledge attest` + registry gate 4 điều kiện (alias KHÔNG được tag) + cờ `docRegistry.enforce` |
| `tsk-28x-7` | `doc-sources` và `docs-index` đọc qua resolver: `oldPath` vẫn trả capture sau khi đổi, `currentPath` gom đúng |
| `tsk-28x-8` | Hai ảnh cuối cùng (JSON cho máy + Markdown cho người) và 8 doctor check knowledge |
| `tsk-28x-9` | Skill `fgos-coding-knowledge`: đổi từ chọn-quadrant-tự-đặt-path sang registry-first |
| `tsk-28x-10` | Writer canary: một item thật đi hết đường writer mới, là cổng trước migration |
| `tsk-28x-11` | Migration dry-run (inventory + conservation gate) rồi apply/fold 268 tài liệu theo từng target |
| `tsk-28x-12` | Deprecate `fgos compound` trỏ sang `fgos knowledge attest`, cập nhật spec/hard-rule/CHANGELOG |
| `tsk-3uc` | Fix 4 gap thật trong lifecycle/migration/bootstrap enforcement phát hiện qua code review (follow-on tsk-28x): `doc.register` lifecycle bypass, attest vào doc đã superseded, `topic.merge`/`split` chống non-active source/target, `topic.retire` silent no-op, `doc.supersede` successor không validate, migration partial-apply + shell-interpolated `git mv`/`add`, bootstrap partial-write across rows, path-traversal trong slug/path, `resolveDocPath` supersededBy chain |

Trạng thái thật đã verify trực tiếp (không chỉ dựa `delivered`), tại thời điểm `tsk-3uc` merge (2026-08-27): registry đã bootstrap thật 332/332 topic + 332/332 doc `active`; migration apply thật (bước 9, `tsk-28x-11`'s cutover) **chưa chạy** — phần lớn corpus vẫn ở layout quadrant cũ; `docRegistry.enforce` **vẫn `false`** trong `.fgos/config.json` — cổng chặn 4-điều-kiện (`tsk-28x-6`) có code nhưng chưa bật. Track B3 (integration harness sau migration thật) và B6 (metrics harness) chưa làm.

## 19. Implementation Pointers

Real files landed by `tsk-28x`'s 12-phase build (`5c948d2a` and its
discovery/plan/Iron-Law-evidence siblings, isolated from unrelated files
picked up by main-catchup merges) plus `tsk-3uc`'s hardening pass
(commits matched by `git log --grep tsk-3uc --no-merges`). These supersede
§17's pre-implementation pointer list — §17 still records what the design
started from; this section records what actually exists in `src/`/`scripts/`
now.

### 19.1 Registry Model And Resolver (§6, §7, §9)

- `src/state/knowledge-registry.mjs` — the `topic.*`/`doc.*` event reducer,
  invariants (`activeDoc(topicId, role) <= 1`, role-vs-mode collision,
  supersession chain), and registry replay.
- `src/report/knowledge-resolver.mjs` — `resolveDocPath` (§9): current-path
  hit, alias hit, `supersededBy` chain walk, null on miss.
- `src/report/knowledge-projection.mjs` — machine (`docs/knowledge-registry.json`)
  and human (`docs/knowledge-registry.md`) projections (§10).

### 19.2 Verb Surfaces And Producer Gate (§8, §12)

- `bin/fgos.mjs` — `fgos topic register|split|merge|rename|retire`,
  `fgos doc reserve|mark-rendered|move-path|promote|supersede|retire`,
  `fgos knowledge attest`, and the legacy `fgos compound` compatibility
  branch routed through the same gate.
- `src/cli/command-registry.mjs` — CLI wiring for the verbs above.
- `src/state/store.mjs` — durable event validation for `topic.*`/`doc.*`
  ops, folded into the existing durable-store module.
- `src/state/replay.mjs` — registry projection hookup into the durable
  replay pipeline.

### 19.3 Classification, Bootstrap, Migration, Canary (§11, §13, §15)

- `scripts/knowledge-classifier.mjs` — read-only inventory/classification
  pass (§13.1) over the pre-migration corpus.
- `scripts/knowledge-bootstrap.mjs` — bootstraps registry rows with
  `currentPath = oldPath`, idempotent (§13.2).
- `scripts/knowledge-migration.mjs` — dry-run/conservation/apply (§13.3-13.5):
  move-or-fold by target document, alias creation, projection rebuild.
- `scripts/knowledge-canary.mjs` — the pre-migration writer canary (§15).

### 19.4 Read Surfaces And Doctor Checks (§9, §14.6)

- `src/report/enduser-index.mjs`, `src/report/enduser-index-generate.mjs` —
  `doc-sources`/`docs-index` read through the resolver (old-path and
  current-path lookup, §9).
- `src/setup/registrations.mjs` — registers the 9 `knowledge-*` doctor
  checks from §14.6 into `fgos doctor`'s check registry.
- `src/state/workflow-stage-graphs.mjs` — retrospective stage now routes to
  the `fgos-coding-knowledge` skill (§12 writer flow) instead of the old
  quadrant-picking path.
- `src/runner/merge.mjs` — merge-time hookup for registry-aware retrospective
  handoff.

### 19.5 Skill And Compatibility

- `domains/coding/skills/fgos-coding-knowledge/SKILL.md` — the registry-first
  writer skill (§12), mirrored byte-identical at `.agents/skills/`,
  `.claude/skills/`, and `plugins/fgOS/skills/`.
- `domains/coding/skills/fgos-coding-compounding/SKILL.md` — legacy producer
  skill, updated to route through the same gate (§4's compatibility-alias
  rule), mirrored at the same three locations.
- `CHANGELOG.md`, `docs/architecture-manifest.json` — user-visible change log
  and module registration.

### 19.6 Focused Tests

- `test/state/knowledge-registry.test.mjs`, `test/state/knowledge-bootstrap.test.mjs`
  — reducer/invariant harness (§14.1) and bootstrap idempotency.
- `test/report/knowledge-resolver.test.mjs` — resolver harness (§14.4).
- `test/cli/knowledge-verbs.test.mjs`, `test/cli/knowledge-attest-gate.test.mjs`,
  `test/cli/knowledge-deprecation.test.mjs` — CLI harness (§14.2) and producer
  gate harness (§14.3).
- `test/scripts/knowledge-classifier.test.mjs`, `test/scripts/knowledge-migration.test.mjs`
  — migration harness (§14.5).
- `test/setup/knowledge-doctor.test.mjs` — doctor-check harness (§14.6).
- `test/skills/fgos-coding-knowledge.test.mjs`, `test/skills/knowledge-canary.test.mjs`
  — writer-skill and canary coverage (§12, §15).
- Incidental fixture updates (not new behavior of their own):
  `test/e2e/fixture-marketing-domain.test.mjs`, `test/report/enduser-index.test.mjs`,
  `test/runner/merge.test.mjs`, `test/state/workflow-stage-graphs.test.mjs`,
  `test/setup/checks.test.mjs`.

Decision/history anchors: `docs/history/compound-learn-artifact-registry/`
(DISCUSSION.md, RESEARCH.md), plus each `tsk-28x-*`/`tsk-3uc` item's own
`docs/history/<slug>/plan.md` and `iron-law-evidence.md`.
