---
title: "Documentation Authority Unification"
description: "Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**"
status: in-progress
priority: P1
created: 2026-09-25
revised: 2026-09-29 (converted to AgentKit plan format; phases renumbered from 1)
blockedBy: []
blocks: []
---

# Documentation Authority Unification — active migration plan

```txt
Plan status: In-progress (Phase 1 complete; Phase 2 complete -- independent re-review verdict APPROVE, tagged documentation-authority-phase-01-20260926 at f0c76c5e590339d9c815038539ff1f4a072c64e4; Phase 3 complete -- independent closure-review verdict APPROVE for `f0c76c5e590339d9c815038539ff1f4a072c64e4..0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb`, immutable full receipt pinned on the same-tree boundary, tagged `documentation-authority-phase-02-20260926`; Phases 4-10 unauthorized and deferred)
Primary objective: Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**
Long-horizon source: docs/platform/proposals/documentation-system-unification.md
Historical foundation: plans/260825-1841-knowledge-registry/
Execution authority: Phase 1 and Phase 2 completed by direct human request on 2026-09-25; Phase 3 authorized by direct human request on 2026-09-26 (Phase 3 doer assignment, isolated worktree /home/vantt/projects/forgentX-phase00-documentation-authority-unification); no authority for Phases 4-10
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
rules. Phase 1 must map this live state rather than assume no area has flipped.

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

This is a truth-reset seed, not the complete Phase 1 inventory:

| Surface | Observed state | Current route until superseded |
|---|---|---|
| Packaging-distribution | Promoted portal with legacy/generated-curated sources | `docs/platform/packaging-distribution/README.md` plus its implementation-alignment mapping |
| Host invocation-routing | Promoted portal with partial route migration and retained legacy sources | `docs/platform/host-invocation-routing/README.md` plus explicit current-source links |
| Agent coordination | Target navigation is canonical, but exact schemas/contracts/proofs remain in `docs/architect/**` unless explicitly superseded | `docs/platform/agent-coordination/README.md` then its declared legacy owners |
| Most other platform areas | Legacy-current or conflicted; target coverage varies | `docs/specs/reading-map.md` and area-specific declarations |
| Root authorities | Current and outside either area tree | Existing named root document until Phase 1 assigns an owner |
| User knowledge | Registry reports 479 docs/topics: 147 active and 332 provisional; `docs/knowledge/**` coexists with live legacy quadrant roots (137 explanation, 20 how-to, 6 reference Markdown files at review time) | Existing knowledge registry and user-doc routes; not platform authority |

Phase 1 must verify and expand this table before any authorization beyond truth
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

Phase 2 publishes the preliminary vocabulary; inventory may extend it only by
recorded exception; Phase 4 freezes the evidence-corrected version. This avoids
a constitution↔inventory dependency cycle. The complete future constitution may
be richer. Do not delay inventory for metadata that the cutover does not
consume.
## 7. Program Phases

Each phase lives in its own `phase-NN-*.md` file (AgentKit plan format). Phases were **renumbered from 1** on 2026-09-29; the legacy number is kept only in historical identifiers (git tags such as `documentation-authority-phase-01-20260926`, branch names, assignment ids) and in the artifact file names under `reports/` (for example `reports/phase-02-doc-inventory.json` is evidence of Phase 3).

| # | Phase | Legacy # | Status | File |
|---|---|---|---|---|
| 1 | Correct planning and routing semantics | 00 | completed | [phase-01-correct-planning-and-routing-semantics.md](phase-01-correct-planning-and-routing-semantics.md) |
| 2 | Contain further divergence | 01 | completed | [phase-02-contain-further-divergence.md](phase-02-contain-further-divergence.md) |
| 3 | Build repository-wide inventory and conservation ledger | 02 | completed | [phase-03-build-repository-wide-inventory-and-conservation-ledger.md](phase-03-build-repository-wide-inventory-and-conservation-ledger.md) |
| 4 | Freeze the minimum constitution and migration method | 03 | pending (not authorized) | [phase-04-freeze-the-minimum-constitution-and-migration-method.md](phase-04-freeze-the-minimum-constitution-and-migration-method.md) |
| 5 | Dual pilot: re-audit plus unmigrated mixed area | 04 | pending (not authorized) | [phase-05-dual-pilot-re-audit-plus-unmigrated-mixed-area.md](phase-05-dual-pilot-re-audit-plus-unmigrated-mixed-area.md) |
| 6 | Transform all platform areas as candidate material | 05 | pending (not authorized) | [phase-06-transform-all-platform-areas-as-candidate-material.md](phase-06-transform-all-platform-areas-as-candidate-material.md) |
| 7 | Cross-area integrity and fresh-reader review | 06 | pending (not authorized) | [phase-07-cross-area-integrity-and-fresh-reader-review.md](phase-07-cross-area-integrity-and-fresh-reader-review.md) |
| 8 | Eliminate switchboard bypasses and prepare consumers | 07 | pending (not authorized) | [phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md](phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md) |
| 9 | Atomic platform-authority cutover | 08 | pending (not authorized) | [phase-09-atomic-platform-authority-cutover.md](phase-09-atomic-platform-authority-cutover.md) |
| 10 | Post-cutover maintenance MVP | 09 | pending (not authorized) | [phase-10-post-cutover-maintenance-mvp.md](phase-10-post-cutover-maintenance-mvp.md) |

### 7.1. Detailed status and authorization (snapshot)

Status snapshot: 2026-09-25. `not-started` means no deliverable mutation from
that phase has begun; `not-authorized` means the dependency graph alone is not
permission to execute it.

| Phase (new #) | Detailed status | Authorization | Dependency / next gate | Evidence or blocker |
|---|---|---|---|---|
| 1 | `completed` | Authorized by direct human request | Gate passed; truth reset only | Review unit is `ac19f6d1e..documentation-authority-phase-00-20260925`, including `a725d4788`, `0c38df980`, and the Phase 1 review-follow-up at HEAD; execution record, authority map, correction note, two independent reviews |
| 2 | `completed` | Authorized by direct human request (asgn_pi_lead_phase01_review_fix_op_001) | Gate passed; containment active | Review unit `38a337ecb31dc97b78aca012eba0da89c003a927..f0c76c5e590339d9c815038539ff1f4a072c64e4`; independent re-review verdict **APPROVE**; tagged `documentation-authority-phase-01-20260926` (annotated tag object `135957aec6e9939b7a1626d2942014c045620a40`, tested/final tree `7f9e3f0907b1751f73e4ca1e4cdb7a75e2135a1a`); operative switchboard (`docs/transitional-switchboard.md`, `transitional-switchboard.json`), vocabulary (`claim-and-disposition-vocabulary.{json,md}`), baseline (`scripts/check-legacy-docs-ratchet.baseline.json`), exceptions ledger, policy-aware ratchet and tests, authoring rules (`docs/platform/migration-authoring-rules.md`), shipped path conventions inventory (`shipped-path-conventions-inventory.{json,md}`), execution and verification records; tag annotation records "Phase 02 remains unauthorized" (legacy numbering: Phase 02 = Phase 3) as of that tag, superseded by this plan's Phase 3 authorization below |
| 3 | `completed` | Authorized by direct human request on 2026-09-26 (Phase 3 doer assignment, isolated worktree) | Gate passed; immutable full verification and independent closure review **APPROVE**; Phase 4 remains unauthorized | Approved range `f0c76c5e590339d9c815038539ff1f4a072c64e4..0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb`; tagged `documentation-authority-phase-02-20260926`. Deterministic inventory + conservation ledger: manifest `reports/phase-02-doc-inventory.json`, 10 shards, report, and opaque identity registry. Inventory covers 4,305 files, 85,772 claim occurrences, and 98,406 consumer edges; explicit later-phase blockers remain 1,360 total, 818 exact duplicate groups, and 151 semantic-conflict groups. Full suite: 7,832 total / 0 failed. |
| 4 | `not-started`, `not-authorized` | None | Blocked by Phase 3 | Constitution, mechanical conservation gates, alias resolver, and cutover-lease design remain open |
| 5 | `not-started`, `not-authorized` | None | Blocked by Phase 4 | Neither pilot has begun; no candidate transformation is authorized |
| 6 | `not-started`, `not-authorized` | None | Blocked by Phase 5 | No area-wide candidate corpus exists |
| 7 | `not-started`, `not-authorized` | None | Blocked by Phase 6 | Cross-area and fresh-reader review cannot begin before complete candidates |
| 8 | `not-started`, `not-authorized` | None | Blocked by Phase 7 | Always-loaded, shipped, generated, test, and prompt bypasses remain intentionally unchanged |
| 9 | `not-started`, `not-authorized` | None | Blocked by Phase 8 and explicit cutover approval | No promotion, migration, deletion, alias activation, or legacy retirement has occurred |
| 10 | `not-started`, `not-authorized` | None | Follow-on only after verified Phase 9 cutover | Maintenance MVP remains a handoff, not current work |


## 8. Dependency Graph

```text
1 truth reset + current-authority map
  → 2 switchboard + containment
  → 3 inventory/conservation
  → 4 minimum constitution + mechanical gates
  → 5 pilot candidate
  → 6 all candidate transformations
  → 7 cross-area review
  → 8 consumer rewrite
  → 9 atomic cutover
  → 10 maintenance MVP handoff
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
| Pilot accidentally becomes canonical | Candidate labels; no reader switch before Phase 9 |
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
with required changes for Phase 1 only; do not authorize Phases 2–9 yet**. It
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
8. What must change before Phase 1 can be authorized?

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
- Phase 1 execution record: `plans/260925-documentation-authority-unification/reports/phase-00-execution-record.md`
- Phase 1 verification: `plans/260925-documentation-authority-unification/reports/phase-00-verification.md`
- Verified Phase 1 authority map: `plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md`
- Independent review prompt: `plans/260925-documentation-authority-unification/independent-frontier-review-prompt.md`
- First independent review: `plans/260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md`
- Frontier re-review: `plans/260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md`
- OKF learning source: `docs/distillery/sources/okf.md`
- Phase 2 execution record: `plans/260925-documentation-authority-unification/reports/phase-01-execution-record.md`
- Phase 2 verification: `plans/260925-documentation-authority-unification/reports/phase-01-verification.md`
- Operative transitional switchboard: `docs/transitional-switchboard.md` and `plans/260925-documentation-authority-unification/transitional-switchboard.json`
- Claim and disposition vocabulary: `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json` and `plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.md`
- Legacy root baseline: `scripts/check-legacy-docs-ratchet.baseline.json`
- Legacy root exceptions: `scripts/check-legacy-docs-ratchet.exceptions.json`
- Legacy ratchet script: `scripts/check-legacy-docs-ratchet.mjs`
- Migration authoring rules: `docs/platform/migration-authoring-rules.md`
- Shipped path conventions inventory: `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json` and `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.md`
- Phase 2 tag: `documentation-authority-phase-01-20260926` (annotated tag object `135957aec6e9939b7a1626d2942014c045620a40`, target commit `f0c76c5e590339d9c815038539ff1f4a072c64e4`)
- Phase 3 doc-inventory generator: `scripts/generate-doc-inventory.mjs`
- Phase 3 inventory gate checker: `scripts/check-doc-inventory-gates.mjs`
- Phase 3 generator/checker unit tests: `test/scripts/generate-doc-inventory.test.mjs`
- Phase 3 execution record: `plans/260925-documentation-authority-unification/reports/phase-02-execution-record.md`
- Phase 3 immutable verification record: `plans/260925-documentation-authority-unification/reports/phase-02-verification.md`
