# Documentation Authority Unification — active migration plan

```txt
Plan status: In-progress (Phase 00 complete; Phase 01 complete -- independent re-review verdict APPROVE, tagged documentation-authority-phase-01-20260926 at f0c76c5e590339d9c815038539ff1f4a072c64e4; Phase 02 final remediation cell F committed-SHA skip verifier passed at 011e9b75798c9d9b689aa825b795c313e1498579, final full verifier pending, independent review pending; Phases 03-09 unauthorized and deferred)
Primary objective: Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**
Long-horizon source: docs/platform/proposals/documentation-system-unification.md
Historical foundation: plans/260825-1841-knowledge-registry/
Execution authority: Phase 00 and Phase 01 completed by direct human request on 2026-09-25; Phase 02 authorized by direct human request on 2026-09-26 (Phase 02 doer assignment, isolated worktree /home/vantt/projects/forgentX-phase00-documentation-authority-unification); no authority for Phases 03-09
Risk: Critical documentation migration
```

## 1. Mission

fgOS currently has a newer, deliberately governed platform documentation tree
under `docs/platform/**` and older/current authority distributed across
`docs/specs/**`, `docs/architect/**`, and several root-level documents. The
immediate mission is to end that split without losing any retained claim,
rationale, contract, decision, proof, or preserved intent.

The intended result is not a cleaner-looking directory tree. The result is:

```text
one platform claim
→ one canonical owner
→ one explicit authority route
→ one maintained physical document
```

The migration must also leave a safe foundation for the future Knowledge and
Documentation Engine and Agent Context Engine. Those engines are preserved
future architecture, not prerequisites for the first authority cutover.

## 2. Current Reality

### 2.1. The hot problem

Readers and agents currently encounter a fragmented authority state, not a clean
two-tree split:

```text
promoted or candidate targets:  docs/platform/**
legacy/current detail:          docs/specs/** + docs/architect/**
root authorities:               platform-foundations, io-contract, backlog, …
shipped path conventions:       core/domain skills and generated instructions
```

Some areas have already been promoted independently, some target portals remain
partial, and some promoted portals still delegate contract or decision authority
back to legacy roots. `docs/reading-map.md`, `docs/specs/reading-map.md`, accepted
governance, and always-loaded instructions therefore express different migration
rules. Phase 00 must map this live state rather than assume no area has flipped.

### 2.2. Existing foundation that must be reused

The end-user knowledge registry code foundation from `tsk-28x` landed at commit
`5c948d2a4`. Enforcement flipped at `6cce97ab3` on 2026-08-27 before the 332
`tsk-5mh` migration commits later that day; the migration projection was then
regenerated at `1c6aa7a4`. Subsequent corpus drift must be evidenced separately.
The exact repository-verified timeline is preserved in
`plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md`. The implementation provides event-sourced
topic/document identity, lifecycle, aliases, resolver behavior, projections,
doctor checks, and writer gating for a Diataxis-oriented profile. It is both a
foundation and a source of lessons; it is not yet the platform documentation
engine or a proven platform-path resolver.

### 2.3. Three corpora must not be conflated

| Corpus | Current examples | Treatment in this plan |
|---|---|---|
| Platform authority | `docs/platform/**`, `docs/specs/**`, `docs/architect/**`, platform-wide root docs | Primary migration scope |
| User/end-user knowledge | `docs/knowledge/**`, legacy user-facing roots | Classify boundaries and rewrite platform links; do not silently fold into platform authority |
| History/evidence | `docs/history/**`, reports, requests, raw proofs | Preserve only through explicit relationships; never make default reading authority |

A file's physical location does not determine its class. Inventory must classify
its claims and current consumers.

### 2.4. Preliminary current-authority snapshot

This is a truth-reset seed, not the complete Phase 00 inventory:

| Surface | Observed state | Current route until superseded |
|---|---|---|
| Packaging-distribution | Promoted portal with legacy/generated-curated sources | `docs/platform/packaging-distribution/README.md` plus its implementation-alignment mapping |
| Host invocation-routing | Promoted portal with partial route migration and retained legacy sources | `docs/platform/host-invocation-routing/README.md` plus explicit current-source links |
| Agent coordination | Target navigation is canonical, but exact schemas/contracts/proofs remain in `docs/architect/**` unless explicitly superseded | `docs/platform/agent-coordination/README.md` then its declared legacy owners |
| Most other platform areas | Legacy-current or conflicted; target coverage varies | `docs/specs/reading-map.md` and area-specific declarations |
| Root authorities | Current and outside either area tree | Existing named root document until Phase 00 assigns an owner |
| User knowledge | Registry reports 479 docs/topics: 147 active and 332 provisional; `docs/knowledge/**` coexists with live legacy quadrant roots (137 explanation, 20 how-to, 6 reference Markdown files at review time) | Existing knowledge registry and user-doc routes; not platform authority |

Phase 00 must verify and expand this table before any authorization beyond truth
reset. No row may be inferred solely from a `Canonical:` metadata string.

## 3. Locked Program Decisions

1. **`docs/platform/**` is the target topology for maintained platform authority.**
2. **Migration is claim-based, not file-move-based.** One source may feed several targets; several sources may merge into one target.
3. **One claim has one canonical owner.** Summary and navigation documents link; they do not fork authority.
4. **Candidate transformation may proceed area by area; no additional authority flip does.** Already-promoted areas are recorded as current facts and re-audited; the program does not pretend those flips never happened.
5. **Completion of the authority flip is atomic for the platform-documentation system.** At cutover, all remaining readers, writers, instructions, links, checks, and maintained physical roots converge together through one switchboard.
6. **Minimum migration controls precede rewriting.** Inventory identity, disposition vocabulary, conservation, and a no-new-legacy ratchet are required before bulk transformation.
7. **The full engine is not on the cutover critical path.** Multi-profile contribution events, advanced trust metadata, executable attestation, and dynamic context compilation remain preserved future work.
8. **Generated projections never establish authority.** They must carry source/freshness information and be reproducible.
9. **Aliases preserve lookup lineage, not duplicate content.** Before deletion, the plan must provide a minimal platform alias artifact that can resolve immutable historical references and later import into the multi-profile registry; the old physical authority must be gone.
10. **Evidence is not authority.** Non-authority payloads may be relocated before cutover to reduce risk, but only after consumer inventory and digest verification.
11. **Self-hosted paths and shipped conventions are separate contracts.** Rewriting this repository must not silently impose its topology on projects that consume fgOS.
12. **No scope reduction by omission.** Deferred architecture is recorded with a revisit trigger in the intent-preservation ledger.

## 4. What This Plan Does Not Claim

Completion of this plan does not mean the entire Unified Documentation
Operating System is implemented. In particular, it does not claim completion of:

- the full multi-profile Knowledge and Documentation Engine;
- claim/clause-level decision supersession;
- contribution-event attribution for every prose change;
- the complete typed documentation graph;
- Agent Context Engine;
- dynamic `fgos doc context` packets;
- context budgeting and delta expansion;
- executable proof runtime/receipt/attester ABI;
- final consolidation of every user-facing knowledge location unless explicitly
  admitted into this plan by a reviewed scope amendment.

These remain preserved intents, not discarded ideas.

## 5. Execution Boundary

This plan is documentation-only until a phase explicitly includes tooling. It
still has repository-wide blast radius and must use the same isolation discipline
as a large code migration.

1. Do not execute on the main checkout.
2. Use one plan branch, recommended:
   `plan/260925-documentation-authority-unification`.
3. Use a dedicated plan worktree. Main checkout is reference/review only.
4. A candidate-area transformation may use an isolated child worktree, but all
   changes must return to the plan branch through reviewed commits.
5. Never let two workers mutate the same target area or migration ledger.
6. Every phase gets its own commit boundary; high-volume transformation gets
   one commit per target document or tightly coherent target set.
7. Never use `git add -A`; stage only declared phase paths.
8. Before each phase, record branch, worktree, clean-state, dependencies,
   footprint, baseline checks, and current source digests.
9. Do not merge any candidate corpus to main before the atomic cutover gate.
   Approved early-harvest controls—switchboard, inventory, ratchet, alias table,
   and evidence relocation—may merge as separately reviewed changes because they
   preserve current authority and reduce risk.
10. Every mutation, including an early-harvest change, is authored and verified
    in a dedicated branch/worktree; the main checkout remains reference/review
    only.
11. Do not start this plan merely because this file exists. A person must
    authorize the plan or a named phase explicitly.

## 6. Minimum Migration Data Model

The cutover needs a deliberately small control model before any richer engine is
built.

### 6.1. Source disposition

Every source receives exactly one file-level disposition from a vocabulary
reconciled with already-migrated area audits:

```text
promote
move
merge
split
extract
redirect
retain-as-evidence
regenerate-from-source
reclassify-out-of-platform-scope
supersede
archive-with-reason
delete-as-duplicate
delete-as-obsolete
defer-with-owner
reject-with-rationale
unknown-blocking
```

`copied` and permanent `keep legacy` are forbidden for maintained authority
because they create two owners. A source split across targets still has one
file-level `split` disposition plus complete claim rows.

### 6.2. Claim ledger

A claim is the smallest independently ownable normative, descriptive,
decisional, contractual, or evidentiary statement—not necessarily one sentence.
Inventory coverage is measured first at stable section/block anchors: every
source heading and every unheaded non-trivial block must map to one or more claim
rows or an explicit non-claim disposition. Independent review samples claims in
both directions (source→target and target→source).

Every retained claim records at least:

```text
claimId
sourceId + sourcePath + sourceAnchor + sourceDigest
targetOwner + targetAnchor
claimKind + authorityKind
current/future/historical status
relations[]
decisionRefs[]
evidenceLinks[]
disposition
reviewStatus
```

Stable source IDs are path-independent and positional-order-independent. The
ledger is retained after cutover as migration evidence and an import source for
H2; it is not discarded with temporary scripts.

### 6.3. Minimum constitution

Only the following rules are required before inventory and transformation:

- a preliminary document/claim-kind vocabulary sufficient to run inventory;
- target placement;
- singleton versus collection cardinality;
- required metadata for maintained canonical documents;
- generated/history classification;
- authority conflict handling;
- promotion and retirement gates.

Phase 01 publishes the preliminary vocabulary; inventory may extend it only by
recorded exception; Phase 03 freezes the evidence-corrected version. This avoids
a constitution↔inventory dependency cycle. The complete future constitution may
be richer. Do not delay inventory for metadata that the cutover does not
consume.

## 7. Program Phases

Status snapshot: 2026-09-25. `not-started` means no deliverable mutation from
that phase has begun; `not-authorized` means the dependency graph alone is not
permission to execute it.

| Phase | Detailed status | Authorization | Dependency / next gate | Evidence or blocker |
|---|---|---|---|---|
| 00 | `completed` | Authorized by direct human request | Gate passed; truth reset only | Review unit is `ac19f6d1e..documentation-authority-phase-00-20260925`, including `a725d4788`, `0c38df980`, and the Phase 00 review-follow-up at HEAD; execution record, authority map, correction note, two independent reviews |
| 01 | `completed` | Authorized by direct human request (asgn_pi_lead_phase01_review_fix_op_001) | Gate passed; containment active | Review unit `38a337ecb31dc97b78aca012eba0da89c003a927..f0c76c5e590339d9c815038539ff1f4a072c64e4`; independent re-review verdict **APPROVE**; tagged `documentation-authority-phase-01-20260926` (annotated tag object `135957aec6e9939b7a1626d2942014c045620a40`, tested/final tree `7f9e3f0907b1751f73e4ca1e4cdb7a75e2135a1a`); operative switchboard (`docs/transitional-switchboard.md`, `transitional-switchboard.json`), vocabulary (`claim-and-disposition-vocabulary.{json,md}`), baseline (`scripts/check-legacy-docs-ratchet.baseline.json`), exceptions ledger, policy-aware ratchet and tests, authoring rules (`docs/platform/migration-authoring-rules.md`), shipped path conventions inventory (`shipped-path-conventions-inventory.{json,md}`), execution and verification records; tag annotation records "Phase 02 remains unauthorized" as of that tag, superseded by this plan's Phase 02 authorization below |
| 02 | `implemented-pending-independent-re-review` | Authorized by direct human request on 2026-09-26 (Phase 02 doer assignment, isolated worktree) | Phase 01 gate passed; Phase 02 immutable verification passed; second independent review requested changes and remediation is awaiting re-review | Deterministic inventory + conservation ledger: manifest `phase-02-doc-inventory.json`, 11 shards under `phase-02-doc-inventory.parts/`, report `phase-02-doc-inventory.md`, and persisted opaque identity registry. Inventory covers 4,305 files, 85,772 claim occurrences, and 167,026 consumer edges; explicit blockers remain 1,054 gaps/route-or-owner blockers, 818 exact duplicate groups, and 151 semantic-conflict groups. Full immutable verifier passed at `020829d63601a7da9f0be51c4686ca06db32e973` with 7,819 tests / 0 failures; see `phase-02-execution-record.md` and `phase-02-verification.md`. |
| 03 | `not-started`, `not-authorized` | None | Blocked by Phase 02 | Constitution, mechanical conservation gates, alias resolver, and cutover-lease design remain open |
| 04 | `not-started`, `not-authorized` | None | Blocked by Phase 03 | Neither pilot has begun; no candidate transformation is authorized |
| 05 | `not-started`, `not-authorized` | None | Blocked by Phase 04 | No area-wide candidate corpus exists |
| 06 | `not-started`, `not-authorized` | None | Blocked by Phase 05 | Cross-area and fresh-reader review cannot begin before complete candidates |
| 07 | `not-started`, `not-authorized` | None | Blocked by Phase 06 | Always-loaded, shipped, generated, test, and prompt bypasses remain intentionally unchanged |
| 08 | `not-started`, `not-authorized` | None | Blocked by Phase 07 and explicit cutover approval | No promotion, migration, deletion, alias activation, or legacy retirement has occurred |
| 09 | `not-started`, `not-authorized` | None | Follow-on only after verified Phase 08 cutover | Maintenance MVP remains a handoff, not current work |

### Phase 00 — Correct planning and routing semantics

**Status:** `completed` — review and merge the complete range `ac19f6d1e..documentation-authority-phase-00-20260925`,
not `a725d4788` alone. The range includes the implementation commit
`a725d4788`, status commit `0c38df980`, and the Phase 00 review-follow-up at
HEAD. No later-phase authority is implied.
**Mode:** planning/documentation only
**Purpose:** Ensure every artifact tells the truth about what is historical,
active, canonical, candidate, or preserved future intent.

Deliverables:

- preserve `plans/260825-1841-knowledge-registry/` at its historical path and
  label the code landing separately from later migration/enforcement history;
- keep the full proposal as long-horizon architecture;
- establish this file as the proposed near-term plan;
- update the platform intent ledger with future engine commitments and source/
  evidence pointers;
- produce a verified current-authority table per area and root document with
  separate `authorityStatus` and `fileClass` dimensions; authority status is
  `promoted`, `candidate`, `legacy-current`, `conflicted`, or `non-authority`;
- resolve the contradiction between accepted `docs/doc-governance.md` §13,
  `docs/reading-map.md`, `docs/specs/reading-map.md`, and portal declarations;
- identify every always-loaded pointer that bypasses the transitional route;
- preserve the verified locked-law result: L5/L8 wording does not hardcode
  `docs/specs/**` or `docs/architect/**`, so path relocation alone does not
  supersede those laws; moving the root law source still requires generated
  instruction-anchor/projection rewrites and L8 anchor-suite proof;
- record known tsk-28x implementation/migration drift in a new correction note,
  never by rewriting historical evidence.

Gate:

- a stranger can distinguish proposal, proposed plan, historical plan, and
  intent ledger without chat history;
- every area has one explicit current route even when its physical sources are
  still mixed;
- no locked-law or governance change is hidden inside wording cleanup.

Phase 00 evidence:

- isolated-worktree execution record and input digests:
  `phase-00-execution-record.md`;
- reproducible commands, exit codes, and summaries:
  `phase-00-verification.md`;
- verified area/root routing map:
  `current-authority-map-2026-09-25.md`;
- historical-registry current-state correction:
  `../260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md`;
- independent reviews: `independent-frontier-review-2026-09-25.md` and
  `independent-frontier-rereview-2026-09-25.md`.

Completion of this phase records truth and routing only. It does not activate a
switchboard, ratchet, alias resolver, claim ledger, corpus transformation, or
cutover, and it does not authorize any later phase.

### Phase 01 — Contain further divergence

**Status:** `completed` — review findings R1–R5 remediated on branch
`documentation-authority-unification--phase-01-review-fix`; independent re-review range
`38a337ecb31dc97b78aca012eba0da89c003a927..f0c76c5e590339d9c815038539ff1f4a072c64e4` returned verdict
**APPROVE**. Tagged `documentation-authority-phase-01-20260926` (annotated tag object
`135957aec6e9939b7a1626d2942014c045620a40`, target commit `f0c76c5e590339d9c815038539ff1f4a072c64e4`,
tested/final tree `7f9e3f0907b1751f73e4ca1e4cdb7a75e2135a1a`). This tag is the immutable base for Phase 02.
Phase 02 is authorized as of 2026-09-26 (see Phase 02 section below); Phases 03–09 remain unauthorized.
**Mode:** plan branch
**Purpose:** Stop the two systems drifting farther apart while migration runs.

Deliverables:

- one switchboard route, backed by the Phase 00 authority table, through which
  repository-local readers resolve current owners without guessing (`docs/transitional-switchboard.md`, `transitional-switchboard.json`);
- a preliminary claim-kind and source-disposition vocabulary (`claim-and-disposition-vocabulary.json`, `claim-and-disposition-vocabulary.md`);
- a baseline list of files and source digests under legacy roots (`scripts/check-legacy-docs-ratchet.baseline.json`);
- a ratchet refusing unreviewed new maintained files **and unaccounted edits**
  under legacy roots (`scripts/check-legacy-docs-ratchet.mjs`, `scripts/check-legacy-docs-ratchet.exceptions.json`, `test/scripts/check-legacy-docs-ratchet.test.mjs`);
- authoring guidance for changes during migration: update the current owner once,
  then record candidate-target impact in the ledger; never dual-author prose (`docs/platform/migration-authoring-rules.md`);
- immediate correction of stale standing routes that point to known-invalid
  skill/path facts (updated `docs/specs/reading-map.md` and `docs/reading-map.md`);
- a separate inventory of path conventions shipped through `core/skills`,
  `domains/**`, generated instructions, and plugins so repository migration does
  not silently redefine consumer-project contracts (`shipped-path-conventions-inventory.json`, `shipped-path-conventions-inventory.md`).

This phase does not declare `docs/platform/**` fully canonical.

Gate:

- no writer has to guess between legacy and target;
- no new legacy maintained file can appear without a recorded exception.

Phase 01 evidence:

- execution record: `phase-01-execution-record.md`;
- reproducible verification: `phase-01-verification.md`.

### Phase 02 — Build repository-wide inventory and conservation ledger

**Status:** `implemented-pending-independent-review` — authorized by direct human request on 2026-09-26
(Phase 02 doer assignment, isolated worktree
`/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch
`plan/260925-documentation-authority-unification`, immutable base tag
`documentation-authority-phase-01-20260926` at `f0c76c5e590339d9c815038539ff1f4a072c64e4`). Phase 01 gate
passed (see Phase 01 section above). Phase 02 now generates the deterministic repository-wide inventory
and claim-level conservation ledger at `phase-02-doc-inventory.{json,md}`; the generator accounts for file
classification, headings, unheaded prose blocks, mixed/non-Markdown file blocks, inbound/outbound links,
consumer kinds (literal/dynamic/glob/fixture/executable-proof/shipped-contract), source/evidence links,
immutable event/decision refs, local-vs-shipped contract scope, exact duplicates, semantic conflicts, and
exactly one proposed owner for each retained claim row. The gate checker independently recomputes the
in-scope file set and validates structure/vocabulary/claim-owner constraints. Local Phase 02 verification
passed; unresolved gaps/conflicts are explicit findings and still block promotion. Phase 02 remediation E pins identity-registry input explicitly (`--identity-registry`), records registry path/bytes/SHA-256/count binding in inventory metadata, treats unresolved dynamic consumer patterns such as `docs/**/README.md` as standalone unresolved consumer edges, and requires reviewed carry-forward writer use for path moves or unit-map changes. Phase 03–09 remain
unauthorized and untouched, and no migration/promotion/deletion/cutover has occurred.
**Mode:** read-only inventory, followed by reviewed ledger writes
**Purpose:** Account for the real corpus before deciding migration mechanics.

Inventory dimensions:

- file class: maintained authority / generated projection / evidence-history;
- area and subcomponent;
- document type;
- claim kinds present;
- current authority status;
- inbound and outbound links;
- code/test/skill/instruction consumers;
- duplicates and conflicts;
- source/evidence relationships and non-Markdown payloads;
- immutable event/decision references to source paths;
- repository-local versus shipped consumer contract;
- target candidate;
- proposed disposition.

Special rules:

- mixed files are split at claim level;
- generated and raw evidence payloads are not linted as canonical prose;
- a read-only text scan found no production code opening non-Markdown
  `docs/architect/**` proof payloads directly, but found many source/test/skill
  path references and 566 such payloads; inventory must still detect dynamic,
  glob-based, test-fixture, and executable-proof consumers before relocation;
- current implementation is evidence, not automatic authority;
- missing current behavior documentation is recorded as a gap, not invented;
- unit coverage independently verifies source blobs/counts/digests but intentionally shares the Phase 02 frozen extraction algorithm; it must not be overclaimed as an independent semantic parser;
- `targetOwner` on an area portal is a proposed area-level destination only; final claim anchors and complete partitioning are deferred to a later authorized phase;
- file moves require the reviewed carry-forward writer so persisted opaque IDs are moved deliberately instead of reminted or inferred.

Gate:

- every in-scope source is accounted for exactly once at file level;
- every heading/unheaded content block passes the source-coverage floor;
- every retained claim has exactly one proposed target owner;
- all root authorities, area directories, evidence payloads, and shipped path
  conventions are enumerated;
- unresolved conflicts are explicit and block promotion.

### Phase 03 — Freeze the minimum constitution and migration method

**Status:** `not-started`, `not-authorized`, blocked by Phase 02.
**Mode:** plan branch
**Purpose:** Turn inventory evidence into a small, testable migration contract.

Deliverables:

- minimum machine-readable constitution or equivalent validated schema;
- claim/disposition ledger schema;
- target path rules;
- conflict-resolution procedure;
- conservation checker;
- legacy-path ratchet;
- retirement-check dry-run;
- a minimal platform alias table/resolver contract that covers immutable
  historical paths and is importable into the future multi-profile registry;
- evidence-payload relocation policy and consumer proof;
- migration-specific documentation-cutover lease design; if it introduces a
  persistent file/config/tool dependency, register setup/doctor discovery and a
  changelog entry rather than leaving hidden infrastructure;
- candidate-status metadata/check;
- explicit list of richer fields deferred to the future engine.

Gate:

- the method can reject duplicate owners, missing dispositions, missing targets,
  and unauthorized legacy growth mechanically.

### Phase 04 — Dual pilot: re-audit plus unmigrated mixed area

**Status:** `not-started`, `not-authorized`, blocked by Phase 03.
**Mode:** isolated worktrees, candidate/review only
**Purpose:** Falsify both conservation and transformation before applying them
globally.

Pilot A re-audits one already-promoted small area (initial candidate:
host-invocation-routing) with the new section/block coverage ledger. Its job is
to discover what the earlier migration audit missed, not to manufacture another
target.

Pilot B transforms one stable, not-yet-promoted area that combines spec decision
history, architecture/contracts, and a root authority (initial candidate:
work-state plus `io-contract.md`, subject to inventory evidence). Do not default
to packaging-distribution or agent-coordination: the former is already promoted;
the latter is large, active, and structurally exceptional.

Deliverables:

- discrepancy report between old and new audit methods;
- candidate target docs for Pilot B;
- source-to-claim and target-to-source conservation samples;
- alias and immutable-history lookup test;
- link rewrite preview;
- independent fresh-reader review using the six L5 questions, with explicit pass
  criteria and no chat-history briefing;
- defects found in the method;
- revised method and constitution.

Gate:

- the pilots demonstrate sensitivity to omissions, not merely successful output;
- neither pilot independently flips new authority.

### Phase 05 — Transform all platform areas as candidate material

**Status:** `not-started`, `not-authorized`, blocked by Phase 04.
**Mode:** isolated worktrees per non-overlapping target, merged to plan branch
**Purpose:** Build the complete target corpus without creating a second live
system.

Rules:

- schedule by target ownership and dependency, not arbitrary source files;
- preserve all retained details before improving prose;
- separate current state, intended direction, obligation, rationale, decision,
  and proof into their correct owners;
- update area portals and related links as part of each target unit;
- keep target docs explicitly candidate until repository-wide promotion;
- record every deletion/archive reason in the ledger;
- run conservation after every target commit.

Gate:

- all platform areas have complete candidate owners;
- no retained claim remains only in a legacy source;
- the final ledger destination is prepared at
  `docs/platform/history/documentation-authority-unification/`, where a sealed
  immutable claim-conservation snapshot plus digest/proof will survive cutover
  as D2 evidence and an H2 import source.

### Phase 06 — Cross-area integrity and fresh-reader review

**Status:** `not-started`, `not-authorized`, blocked by Phase 05.
**Mode:** plan branch, review only except fixes
**Purpose:** Catch errors that per-area migration cannot see.

Review dimensions:

- one owner per cross-area claim;
- contract producer/consumer agreement;
- platform-wide vocabulary consistency;
- vision/spec/architecture/contract/decision separation;
- component-boundary correctness;
- preserved intent and deferred capabilities;
- generated projection/source agreement;
- newcomer navigation without legacy paths;
- implementation alignment and evidence quality.

Gate:

- no unresolved authority conflict;
- a stranger can answer the platform's read-first, owner, contract, risk,
  verification, and learning questions without legacy authority.

### Phase 07 — Eliminate switchboard bypasses and prepare consumers

**Status:** `not-started`, `not-authorized`, blocked by Phase 06.
**Mode:** plan branch
**Purpose:** Ensure cutover changes behavior, not only files. Generic consumers
should already use the Phase 01 switchboard; this phase rewrites remaining direct
path dependencies and prepares the one-row/table authority flip rather than
holding hundreds of edits on a long-lived branch.

Consumers include:

- AGENTS/CLAUDE and instruction sources;
- reading maps and portals;
- skills and prompt templates;
- CLI help/examples;
- setup/doctor registrations;
- generators and projections;
- tests and fixtures;
- comments that name authority paths;
- external-facing links where maintained in-repo.

Gate:

- repository-wide search finds no reader or writer treating a legacy path as
  current authority;
- aliases are lookup-only and never writing instructions.

### Phase 08 — Atomic platform-authority cutover

**Status:** `not-started`, `not-authorized`, blocked by Phase 07 and a separate explicit cutover approval.
**Mode:** dedicated cutover worktree; serialized mutation
**Purpose:** Promote one system and physically retire the competing system in one
reviewable integration change.

Cutover sequence:

1. acquire a migration-specific exclusive documentation-cutover lease; while it
   is held, registered doc writers, dispatch admission, and merge gates refuse
   mutations to in-scope roots; enumerate worktrees and require clean/digest-
   matched sources before the lease and immediately before ref movement;
2. rerun inventory and detect any unregistered/raw source drift since baseline;
   drift blocks cutover rather than being overwritten;
3. apply final candidate updates;
4. promote target authority metadata;
5. switch every reader and writer;
6. delete maintained files under `docs/specs/**` and `docs/architect/**` only
   after non-authority evidence payloads have been relocated and verified;
7. activate approved aliases in the minimal platform resolver, not as duplicate
   files;
8. regenerate projections and indexes;
9. enable no-legacy-path enforcement;
10. run semantic-remnant search and the full verification suite.

Rollback:

- one cutover commit or a tightly controlled commit train with a documented
  revert order;
- cutover itself appends no registry/event-log events;
- snapshot and verify generated projections, installation ledgers, alias state,
  and any installed-skill impact in addition to git state;
- never leave half the readers switched after a failed cutover;
- if gate failure occurs, restore the pre-cutover authority table, aliases,
  projections, and installed surfaces—not only tracked files—rather than
  declaring a partial success.

Gate:

- only `docs/platform/**` owns maintained platform claims;
- no physical legacy platform authority remains;
- all aliases resolve to committed current targets;
- the sealed migration ledger exists at its durable target path and verifies;
- the documentation-cutover lease prevented registered writes and drift checks
  caught unregistered writes;
- complete suite and documentation checks are green.

### Phase 09 — Post-cutover maintenance MVP

**Status:** `not-started`, `not-authorized`, blocked by a verified Phase 08 cutover and follow-on authorization.
**Mode:** follow-on plan may begin only after cutover
**Purpose:** Prevent recurrence with the smallest useful maintenance system.

Initial surfaces:

```text
fgos doc classify
fgos doc new
fgos doc check
fgos doc inventory
fgos doc retirement-check
```

Initial checks prioritize observed failures:

- duplicate owner;
- wrong placement;
- missing required metadata;
- broken links and anchors;
- references to nonexistent code/skills/commands;
- stale generated projection;
- reintroduced legacy roots;
- unaccounted source/claim lineage.

This phase hands off to the future Knowledge and Documentation Engine plan; it
must not silently expand into Agent Context Engine.

## 8. Dependency Graph

```text
00 truth reset + current-authority map
  → 01 switchboard + containment
  → 02 inventory/conservation
  → 03 minimum constitution + mechanical gates
  → 04 pilot candidate
  → 05 all candidate transformations
  → 06 cross-area review
  → 07 consumer rewrite
  → 08 atomic cutover
  → 09 maintenance MVP handoff
```

Inventory may gather read-only evidence in parallel by non-overlapping area.
Every judgment, target assignment, ledger write, and cutover remains centrally
reconciled.

## 9. Early Harvest Without Premature Cutover

| Early result | Safe before cutover? | Why it helps |
|---|---:|---|
| One switchboard preserving each area's declared current owner | Yes | Removes guessing without pretending all areas share the same current state |
| Legacy-growth ratchet | Yes | Stops debt increasing during migration |
| Inventory and duplicate/conflict report | Yes | Makes scope and risk visible |
| Pilot candidate corpus | Yes, if clearly non-canonical | Falsifies method cheaply |
| Broken-link/stale-reference checks | Yes | Improves current system while migrating |
| Additional per-area authority flip | No | The repository is already mixed; further independent flips increase inconsistency |
| Delete legacy roots | No | Only safe at repository-wide cutover |
| Full Agent Context Engine | No need | Does not solve immediate authority split |

## 10. Final Cutover Acceptance

- Every legacy source has one file-level disposition.
- Every retained claim has one canonical target owner.
- No unresolved claim conflict remains.
- No maintained platform file remains under `docs/specs/**` or
  `docs/architect/**`.
- No instruction, prompt, test, fixture, generator, comment, or portal treats a
  legacy path as current authority.
- Alias resolution covers immutable historical references without duplicate content and can be imported into H2.
- Non-authority evidence payloads and their consumers are preserved with digest proof.
- Self-hosted route changes do not silently alter consumer-project path contracts.
- The migration ledger is retained as evidence and an H2 import source.
- Target documents meet metadata, structure, relationship, and verification
  requirements.
- Generated projections are fresh and source-linked.
- Full tests and documentation checks pass.
- A fresh agent can navigate and author without chat history or legacy paths.
- The future Knowledge and Documentation Engine and Agent Context Engine intents
  remain recorded with non-preclusion constraints and revisit triggers.

## 11. Risks and Countermeasures

| Risk | Countermeasure |
|---|---|
| Move files without migrating mixed claims | Claim-level ledger and conservation gate |
| Pilot accidentally becomes canonical | Candidate labels; no reader switch before Phase 08 |
| Migration never ends because both systems stay usable | Cutover date/gate and no-legacy ratchet |
| Build an engine instead of migrating content | Minimum constitution only before cutover |
| Lose long-horizon architecture while narrowing scope | Intent ledger + unchanged full proposal |
| Existing registry is replaced by a parallel registry | Reuse/generalize only after cutover; no second event store |
| Active areas drift during transformation | Source digests, freeze windows, pre-cutover rerun |
| History becomes a dump of copied legacy trees | Archive only with explicit durable reason |
| Agent-coordination dominates the pilot | Stable-area selection criteria |
| Branch/worktree races corrupt ledger or target | One writer per target/ledger; serialized integration |
| Existing promoted areas contradict the new method | Current-authority table + re-audit; normalize at final cutover rather than denying prior flips |
| Immutable history points to deleted paths | Minimal importable platform alias table before deletion |
| Evidence is deleted with legacy authority | Relocate non-authority payloads early; verify consumers and digests |
| Cutover rollback restores git but not runtime state | Snapshot/restore projections, aliases, installation ledgers, and installed surfaces; append no cutover events |
| A drift check is mistaken for a write freeze | Migration-specific lease enforced by registered writers/dispatch/merge gates plus clean-worktree and digest checks for raw writers |
| Final claim ledger is lost with the plan branch | Seal it under `docs/platform/history/documentation-authority-unification/` with digest proof before cutover |
| Repo cleanup changes shipped fgOS conventions | Inventory `core/`, domains, plugins, and generated instructions as a separate mission #1/#2 contract |

## 12. Preserved Future Handoffs

### 12.1. Knowledge and Documentation Engine

Must eventually generalize the existing registry by profile and own durable
identity, lifecycle, claims, decisions, typed relationships, contributions,
source/evidence linkage, and documentation read models.

### 12.2. Agent Context Engine

Must remain a separate derived authority that composes instructions, effective
decisions, document ownership, and budgeted reading plans. It reads canonical
truth and emits context packets; it never owns documentation or work state.

### 12.3. OKF v0.2 lessons

Preserve for the future engine:

- stable source IDs and per-claim attribution;
- separate origin, generation, verification, lifecycle, and freshness axes;
- objective credibility signals rather than stored subjective scores;
- small interchange conformance floor beneath stricter profile governance;
- generated progressive-disclosure indexes;
- executable proof contract seam.

Do not put OKF's deferred receipt/attester runtime ABI or sandbox on this
migration's critical path.

## 13. Independent Review Requirement

Before execution authorization, an independent frontier agent must review the
proposal, this plan, historical foundation, intent ledger, and current repository
state. The review must be advisory-only and must not edit files.

A read-only Claude Opus review was completed on 2026-09-25. Verdict: **proceed
with required changes for Phase 00 only; do not authorize Phases 01–08 yet**. It
identified two critical issues—the repository already contains per-area authority
flips, and no platform alias resolver exists before deletion—plus required fixes
for claim coverage, dispositions, evidence payloads, locked-law checks, shipped
path contracts, rollback, pilot selection, and ledger lineage.

After those corrections, an independent Gemini 3.1 Pro High frontier-policy
re-review reached the same authorization verdict and confirmed that the two
critical issues, pilot, switchboard, rollback, and H2/H3 preservation were
materially resolved. Its remaining plan-level blockers were a mechanical cutover
write lease, explicit runtime-consumer audit for evidence payloads, a durable
post-cutover ledger home, and settlement of the L5/L8 path question. This revision
incorporates the lease and ledger requirements. Read-only shell checks found no
production code directly opening non-Markdown `docs/architect/**` proof payloads
and confirmed L5/L8 wording does not name the retiring roots, while preserving
broader dynamic-consumer inventory as a gate. Migration execution remains
unauthorized.

The review must answer:

1. Does the plan solve the active fragmented-authority state, including already-promoted areas and shipped path contracts?
2. Is any legacy claim class missing from inventory/conservation?
3. Does any phase accidentally create a third documentation system?
4. Are the pre-cutover controls minimal, or is engine scope leaking forward?
5. Can the atomic cutover be rolled back coherently?
6. Are Knowledge and Documentation Engine and Agent Context Engine intents
   preserved with real non-preclusion constraints?
7. Which assumptions are contradicted by the current repository?
8. What must change before Phase 00 can be authorized?

The exact reusable prompt is stored beside this plan in
`independent-frontier-review-prompt.md`. The first review is preserved in
`independent-frontier-review-2026-09-25.md`; the frontier re-review is preserved
in `independent-frontier-rereview-2026-09-25.md`.

## 14. Related Artifacts

- Full-horizon proposal: `docs/platform/proposals/documentation-system-unification.md`
- Canonical governance: `docs/doc-governance.md`
- Platform intent ledger: `docs/platform/intent-preservation-ledger.md`
- Transitional platform portal: `docs/platform/README.md`
- Historical registry implementation: `plans/260825-1841-knowledge-registry/`
- Historical registry current-state correction: `plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md`
- Phase 00 execution record: `plans/260925-documentation-authority-unification/phase-00-execution-record.md`
- Phase 00 verification: `plans/260925-documentation-authority-unification/phase-00-verification.md`
- Verified Phase 00 authority map: `plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md`
- Independent review prompt: `plans/260925-documentation-authority-unification/independent-frontier-review-prompt.md`
- First independent review: `plans/260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md`
- Frontier re-review: `plans/260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md`
- OKF learning source: `docs/distillery/sources/okf.md`
- Phase 01 execution record: `plans/260925-documentation-authority-unification/phase-01-execution-record.md`
- Phase 01 verification: `plans/260925-documentation-authority-unification/phase-01-verification.md`
- Operative transitional switchboard: `docs/transitional-switchboard.md` and `plans/260925-documentation-authority-unification/transitional-switchboard.json`
- Claim and disposition vocabulary: `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json` and `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.md`
- Legacy root baseline: `scripts/check-legacy-docs-ratchet.baseline.json`
- Legacy root exceptions: `scripts/check-legacy-docs-ratchet.exceptions.json`
- Legacy ratchet script: `scripts/check-legacy-docs-ratchet.mjs`
- Migration authoring rules: `docs/platform/migration-authoring-rules.md`
- Shipped path conventions inventory: `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json` and `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.md`
- Phase 01 tag: `documentation-authority-phase-01-20260926` (annotated tag object `135957aec6e9939b7a1626d2942014c045620a40`, target commit `f0c76c5e590339d9c815038539ff1f4a072c64e4`)
- Phase 02 doc-inventory generator: `scripts/generate-doc-inventory.mjs`
- Phase 02 inventory gate checker: `scripts/check-doc-inventory-gates.mjs`
- Phase 02 generator/checker unit tests: `test/scripts/generate-doc-inventory.test.mjs`
- Phase 02 execution record: `plans/260925-documentation-authority-unification/phase-02-execution-record.md`
- Phase 02 immutable verification record: `plans/260925-documentation-authority-unification/phase-02-verification.md`
