# Knowledge Registry State Contract

Document type: Contract
Owner: Work-state (existing `src/state/knowledge-registry.mjs` registry and projection boundary)
Status: Live candidate holder for maintained registry rules, subject to the existing transitional switchboard; not a proposal snapshot.
Canonical for: Framework/role vocabulary, durable document identity, lifecycle and attestation constraints consumed by the existing registry, CLI and producer skill. This does not claim the whole redesign, migration or resolver horizon is implemented.

The source clauses below are conserved verbatim from `docs/architect/knowledge-registry-redesign.md` at the source pin recorded in the carry receipt. Section numbering remains stable so the existing §5.5/§7.2/§7.3/§7.4/§8/§13.5/§14.1/§14.3 citations can resolve without guessing an alias write path. §13.5 describes the migration rule, not permission to run a migration. The original design's open questions, planned work and implementation sequencing are not promoted. Existing end-user Diataxis paths remain registry-managed and unchanged.

Owning proof: `test/state/knowledge-registry.test.mjs` (registry/schema semantics), `test/state/knowledge-bootstrap.test.mjs` (bootstrap role vocabulary), `test/cli/knowledge-verbs.test.mjs` and `test/cli/knowledge-attest-gate.test.mjs` (CLI producer wiring). No new registry mechanism or test-only bypass is introduced.

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
