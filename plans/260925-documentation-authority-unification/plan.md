---
title: "Documentation Authority Unification"
description: "Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**"
status: in-progress
priority: P1
created: 2026-09-25
revised: 2026-10-06 (resume after main sync: coordination harness retired, Observe blockers completed, dropped-claim register, ordering with Plans A/B/C; Phase 4 authorized and pre-steps 0a/0b done; earlier 2026-09-29 AgentKit format conversion)
blockedBy: []
blocks: []
---

# Documentation Authority Unification — active migration plan

```txt
Plan status: In-progress (Phase 1 complete; Phase 2 complete -- independent re-review verdict APPROVE, tagged documentation-authority-phase-01-20260926 at f0c76c5e590339d9c815038539ff1f4a072c64e4; Phase 3 complete -- independent closure-review verdict APPROVE for `f0c76c5e590339d9c815038539ff1f4a072c64e4..0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb`, immutable full receipt pinned on the same-tree boundary, tagged `documentation-authority-phase-02-20260926`; Phase 4 complete (closed by the owner 2026-10-06; commits `3b409a373..7c632737b` plus the closing commit); Phase 5 authorized by the owner 2026-10-06 and in progress; Phases 6-10 unauthorized and deferred)
Primary objective: Collapse the competing platform-documentation authorities into one canonical system under docs/platform/**
Long-horizon source: docs/platform/proposals/documentation-system-unification.md
Historical foundation: archive/plans/260825-1841-knowledge-registry/ (moved from plans/ by main commit 22e54f834 on 2026-09-30; see §7.4)
Execution authority: Phase 1 and Phase 2 completed by direct human request on 2026-09-25; Phase 3 authorized by direct human request on 2026-09-26 (Phase 3 doer assignment, isolated worktree /home/vantt/projects/forgentX-phase00-documentation-authority-unification); 2026-10-06 resume authorized for sync, re-inventory and plan update; Phase 4 authorized by the owner on 2026-10-06 (pre-step first); Phase 5 authorized by the owner on 2026-10-06 (decisions in §7.5b); no authority for Phases 6-10
Resume state (2026-10-06): branch synced with main at 2fd5cb6a3; inventory regenerated and compared (§7.4); formal blockers completed; Phase 4 completed (2026-10-06); pre-step 0a done (commit `6397a9970`), pre-step 0b done (commit `3809d692c`, report `reports/gate-failures-investigation-261006.md`)
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
`archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md` (historical path `plans/260825-1841-knowledge-registry/`). The implementation provides event-sourced
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
| 4 | Freeze the minimum constitution and migration method | 03 | completed (2026-10-06; commits `3b409a373..7c632737b`) | [phase-04-freeze-the-minimum-constitution-and-migration-method.md](phase-04-freeze-the-minimum-constitution-and-migration-method.md) |
| 5 | Dual pilot: re-audit plus unmigrated mixed area | 04 | in-progress (work done 2026-10-07, awaiting owner review) | [phase-05-dual-pilot-re-audit-plus-unmigrated-mixed-area.md](phase-05-dual-pilot-re-audit-plus-unmigrated-mixed-area.md) |
| 6 | Transform all platform areas as candidate material | 05 | pending (not authorized) | [phase-06-transform-all-platform-areas-as-candidate-material.md](phase-06-transform-all-platform-areas-as-candidate-material.md) |
| 7 | Cross-area integrity and fresh-reader review | 06 | pending (not authorized) | [phase-07-cross-area-integrity-and-fresh-reader-review.md](phase-07-cross-area-integrity-and-fresh-reader-review.md) |
| 8 | Eliminate switchboard bypasses and prepare consumers | 07 | pending (not authorized) | [phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md](phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md) |
| 9 | Atomic platform-authority cutover | 08 | pending (not authorized) | [phase-09-atomic-platform-authority-cutover.md](phase-09-atomic-platform-authority-cutover.md) |
| 10 | Post-cutover maintenance MVP | 09 | pending (not authorized) | [phase-10-post-cutover-maintenance-mvp.md](phase-10-post-cutover-maintenance-mvp.md) |

### 7.1. Detailed status and authorization (snapshot)

Status snapshot: 2026-09-25, rows 4-10 revised 2026-10-06. `not-started` means no deliverable mutation from
that phase has begun; `not-authorized` means the dependency graph alone is not
permission to execute it.

| Phase (new #) | Detailed status | Authorization | Dependency / next gate | Evidence or blocker |
|---|---|---|---|---|
| 1 | `completed` | Authorized by direct human request | Gate passed; truth reset only | Review unit is `ac19f6d1e..documentation-authority-phase-00-20260925`, including `a725d4788`, `0c38df980`, and the Phase 1 review-follow-up at HEAD; execution record, authority map, correction note, two independent reviews |
| 2 | `completed` | Authorized by direct human request (asgn_pi_lead_phase01_review_fix_op_001) | Gate passed; containment active | Review unit `38a337ecb31dc97b78aca012eba0da89c003a927..f0c76c5e590339d9c815038539ff1f4a072c64e4`; independent re-review verdict **APPROVE**; tagged `documentation-authority-phase-01-20260926` (annotated tag object `135957aec6e9939b7a1626d2942014c045620a40`, tested/final tree `7f9e3f0907b1751f73e4ca1e4cdb7a75e2135a1a`); operative switchboard (`docs/transitional-switchboard.md`, `transitional-switchboard.json`), vocabulary (`claim-and-disposition-vocabulary.{json,md}`), baseline (`scripts/check-legacy-docs-ratchet.baseline.json`), exceptions ledger, policy-aware ratchet and tests, authoring rules (`docs/platform/migration-authoring-rules.md`), shipped path conventions inventory (`shipped-path-conventions-inventory.{json,md}`), execution and verification records; tag annotation records "Phase 02 remains unauthorized" (legacy numbering: Phase 02 = Phase 3) as of that tag, superseded by this plan's Phase 3 authorization below |
| 3 | `completed` | Authorized by direct human request on 2026-09-26 (Phase 3 doer assignment, isolated worktree) | Gate passed; immutable full verification and independent closure review **APPROVE**; Phase 4 remains unauthorized | Approved range `f0c76c5e590339d9c815038539ff1f4a072c64e4..0c3e8d8b57c40214fdcdb29a69c9b3c11de552fb`; tagged `documentation-authority-phase-02-20260926`. Deterministic inventory + conservation ledger: manifest `reports/phase-02-doc-inventory.json`, 10 shards, report, and opaque identity registry. Inventory covers 4,305 files, 85,772 claim occurrences, and 98,406 consumer edges; explicit later-phase blockers remain 1,360 total, 818 exact duplicate groups, and 151 semantic-conflict groups. Full suite: 7,832 total / 0 failed. |
| 4 | `completed` | Authorized by the owner on 2026-10-06; closed by the owner the same day (decisions in §7.5b); Phase 5 not authorized | Phase 3 gate passed; formal `blockedBy` plans completed (archived on main, checked 2026-10-06); no other blocker | Pre-step 0a done (`6397a9970`, generator skips its own output) and 0b done (`3809d692c`, gate-failure causes). Step 1 (identity carry-forward and dispositions of removed and edited units) done; step 2 (minimum constitution, vocabulary version 2, ledger row schema, `scripts/check-doc-constitution.mjs`) written, red-teamed and frozen by the owner on 2026-10-06. Steps 3-5 done and Phase 4 closed 2026-10-06: conservation gates, registry rebinding and `--refresh`, alias table and resolver, candidate-status check, retirement dry run with a cutover mode, evidence relocation policy and cutover-lease design (design only), red-team review with fixes; execution record in the phase file; the dry run reports 15 blocked checks, which is the cutover backlog |
| 5 | `in-progress`, work done 2026-10-07, awaiting owner review | Authorized by the owner on 2026-10-06 (decisions in §7.5b); closing is the owner's act | Phase 4 closed | Dual pilot executed: Pilot A host-invocation-routing blind re-audit (600 rows, 16 real drops registered), Pilot B work-state plus `docs/io-contract.md` candidate transformation (366 rows reviewed, scoped strict gate exit 0). First-round verdict: METHOD-MUST-CHANGE (owner, 2026-10-07); one fix round done the same day, all re-runs passed (E1, E6, E7 redefined, E8, Pilot B scoped strict); recommended verdict PASS-WITH-AMENDMENTS, awaiting the owner; records: phase file, `reports/phase-05/pilot-method-defects.md`, `reports/phase-05/fix-round.md` |
| 6 | `not-started`, `not-authorized` | None | Blocked by Phase 5 | No area-wide candidate corpus exists |
| 7 | `not-started`, `not-authorized` | None | Blocked by Phase 6 | Cross-area and fresh-reader review cannot begin before complete candidates |
| 8 | `not-started`, `not-authorized` | None | Blocked by Phase 7 | Always-loaded, shipped, generated, test, and prompt bypasses remain intentionally unchanged |
| 9 | `not-started`, `not-authorized` | None | Blocked by Phase 8 and explicit cutover approval | No promotion, migration, deletion, alias activation, or legacy retirement has occurred |
| 10 | `not-started`, `not-authorized` | None | Follow-on only after verified Phase 9 cutover | Maintenance MVP remains a handoff, not current work |


## 7.2. Execution harness and observation

Rewritten 2026-10-06. The 2026-09-29 harness (`reports/harness-readiness-2026-09-29.md` §2, §4, §5) assumed the `coordination` engine: agent-led sessions with `task.capabilities`, actor pins, one session per phase, `group-thinking-rfc-review-lite`, and closing coordination sessions. That engine is retired (main commit `2180b4e72`, "L4 coordination engine retired"; `node bin/fgos.mjs coordination` answers `unknown verb`; `docs/specs/runner.md` § CoordinationSession is marked historical). Those parts of the report are obsolete. Its "Revision 2" point still holds in part: review only through a read-only path; authoring follows the 2026-10-06 owner decision below.

**Start condition:** explicit owner authorization of the named phase (§5 item 11). The former Observe start condition is gone: both `blockedBy` plans (`260929-1501-metrics-friction-rust-native`, `260929-1703-runresult-classification-single-path`) are `completed` and archived under `archive/plans/` on main (checked 2026-10-06). Observe is an optional measurement add-on, never a gate.

**Harness (checked 2026-10-06, re-check at phase start):**
- **Authoring and doers:** the owner decided on 2026-10-06 that doers may be Sonnet subagents dispatched in-process (`node bin/fgos.mjs dispatch decide`, answer `in-process`). The Lead (the dedicated session) plans, reviews, verifies independently and commits. This supersedes the earlier line "the Lead authors; no phase delegates writing" for script and test work and for document edits; the Lead reviews every change before each commit.
- **Doc review (read-only):** run `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access`. On 2026-10-06 it returned `mechanism: "in-process"` (`configured: false`, reason `native-first.rule-2.live-task-access`), so one in-process read-only reviewer subagent per review unit is available; at most one re-review after fixes. A different mechanism at phase start means follow that answer, not this text.
- **Out-of-process review alternative:** `fgos run --pattern rfc` (preset `reviewed`, `maxRounds: 1`, checkers `reviewer` + `red-team`) per `docs/specs/runner.md` (Workflow and CollaborationPattern; reviewer confined from writing the repo, writes its outbox). UNPROVEN for documentation phases: not exercised in this plan.
- **Decision review:** Doc review plus an adversarial plan review with `ak:plan red-team` on the plan and the decision artifacts (owner, 2026-10-06: the `rfc` preset and the `architecture-advisory` workflow are not finished, so they are not used). Findings are reported to the owner before anything is frozen.
- **Code slice (gate scripts):** Lead inline, one read-only code review through the same `dispatch decide` door, at most one re-review.
- **Fresh-reader:** `research-fan-out` preset (panel, 3 researchers + synthesizer) or two in-process read-only readers without chat history.

**Observation (optional add-on, not a gate).** `fgos metrics` is a Rust host command (`docs/specs/observe.md` §4); the Node CLI refuses it. A host built from the synced branch (`cargo build --release --bin fgos`, 2026-10-06) lists `ping, case, harness, faults, runs, coverage, discussions, eval, outcomes, entropy, snapshot`. Usable per phase if the owner wants numbers: `fgos metrics case open doc-authority-p<N> ...` before the first step, close with interventions/verdict, read `fgos metrics harness --case doc-authority-p<N>`; `fgos metrics runs`/`coverage`/`discussions` see `fgos run` Unit runs, not in-process subagents. `case open/close` write `.fgos/observe/`; the exact flags are re-read from `fgos metrics case --help` at phase start.

| Phase | Harness type |
|---|---|
| 4 | Decision + Code slice (constitution and method freeze; mechanical gates) |
| 5 | Doc (+ Code slice if gates change) |
| 6 | Doc, one review per non-overlapping area batch |
| 7 | Fresh-reader + Doc |
| 8 | Code slice + Doc (consumer and bypass rewrites) |
| 9 | Decision (cutover approval) + Code slice |
| 10 | Code slice + Doc |

## 7.3. Dropped-claim conservation

A claim that exists in a legacy source but is missing from its promoted
`docs/platform/**` target is recorded in
[dropped-claims-register.json](dropped-claims-register.json). Each entry blocks
Phase 9 until it has an explicit reviewed disposition (restored at a target anchor, or a restoration owner named); the generated inventory never writes this file.

| Id | Claim | Source | Target gap | Cause | Restoration |
|---|---|---|---|---|---|
| dropped-001 | Dev / Source Activation (Settled for V1) | `docs/architect/packaging-distribution/runtime-identity-and-activation.md:73,895-920` (commit `6733de7cf`); Phase 3 ledger `claim_efd5afeb35b4352c0229ea2f7be2356b`, `unknown-blocking`, no target | absent from `docs/platform/packaging-distribution/**` | not intended (owner, 2026-10-06); actual cause UNPROVEN | Disposition before cutover: restore after cutover via Plan C (`plans/261006-1445-fgctl-dev-activation/`, draft, unscheduled; the cutover does not wait for it). If Plan C lands first, point the entry at the restored anchor. Plan C re-implements it; related overclaim at `docs/platform/host-invocation-routing/intent-preservation-ledger.md:81` (HI-I027) to reconcile |

## 7.4. Resume after main sync (2026-10-06)

Full record: [resume report](../reports/resume-261006-1635-doc-authority-unification.md).

- **Sync:** `git merge` of main at `e63a17b8e` (merge `b9fee1e56`, 3 conflicts outside `docs/platform/**`) and again at `2fd5cb6a3` (merge `6b8ef0e8d`, clean). Main was 400 commits ahead, branch 59.
- **Legacy roots:** all 20 main-side changes under `docs/specs/**` and `docs/architect/**` since `81f7db801` (19 edits, 1 new file `docs/specs/observe.md`) are accounted as reviewed exceptions in `scripts/check-legacy-docs-ratchet.exceptions.json` (`revisitTrigger`: Phase 9 cutover); per-file content review is still owed. The ratchet is clean (995 legacy files, 24 accounted edits, 1 accounted new file).
- **Re-inventory:** [reports/resync-261006/](reports/resync-261006/) (manifest, Markdown, comparison). Against the 2026-09-26 inventory: files 4,305 → 4,311 (+6, 0 removed, 73 changed); claim units 85,772 → 86,085 (85,481 unchanged, 248 edited, 43 removed, 356 added, 0 moved); gates clean, explicit gaps 1,360 → 1,361 (new routing gap `docs/specs/observe.md`); duplicate groups 818 and semantic-conflict groups 151 unchanged. The 43 removed and 248 edited units are listed in `reports/resync-261006/inventory-comparison.json`; Phase 4 must rerun conservation with identity carry-forward before any target work.
- **Plan tooling that did not run on the branch head** (status 2026-10-06, after the Phase 4 pre-steps):
  1. `scripts/generate-doc-inventory.mjs` read its own ~250 MB of saved output and exhausted memory. Fixed in `6397a9970`: it skips its own saved output (manifest, `.parts`, Markdown, identity registry under `reports/`). On `50639672a`: exit 0, 22.7 s, max RSS 1.92 GB (`/usr/bin/time -v`); claim rows 86,085 unchanged; files 4,311; gates clean, 1,361 gaps; consumer edges 105,923 against 101,286 at the resync (the difference comes from plan files changed since the measurement commit, mostly `reports/resync-261006/`, 4,496 edges). Independent read-only review: no findings of medium or higher. Known limit: artifacts that sat at the plan root before the 2026-09-29 move into `reports/` (commit `4d80eaf29`) are not skipped; this matters only when generating on a commit between 2026-09-26 and 2026-09-29.
  2. `scripts/verify-phase-02.mjs`: without `--base` it stops at argument parsing. On the approved Phase 3 range (`--base f0c76c5e5 --fixed-end 0c3e8d8b5 --skip-full-suite`) it passes (exit 0, 37 s, 2.08 GB). On the branch head it fails with `ENOENT` because its path constants (lines 19-22) still point at the plan root after `4d80eaf29`; it would still fail after a path fix (generator output text changed in `4d80eaf29`; 2,296 paths outside its allowed set; knowledge-registry hashes). Decision (owner, 2026-10-06): the script is frozen, valid only for its approved range; the 2026-10-06 passing run is its receipt; it is not run on later heads. Phase 4 builds its own gates.
  3. `scripts/verify-phase-01.mjs`: the two shipped-path tests in `test/scripts/generate-shipped-path-inventory.test.mjs` are content-coupled and broke from main `8eff54d0f` (2026-09-28) and `2180b4e72` (2026-10-02). Decisions (owner, 2026-10-06): the two tests now run on a fixture repository (`639456a8d`, 10/10 pass); `verify-phase-01` is frozen like `verify-phase-02` (decision D3 below): unmodified, it passes on its approved range `38a337ecb..f0c76c5e5` (`--skip-full-suite`, exit 0 on 2026-10-06) and is not run on later heads. On the branch head it also fails its inventory-freshness check because the committed `shipped-path-conventions-inventory.{json,md}` no longer match a fresh generation. The generator has no classification rule for `core/workflows/` (the directory and 5 workflow YAML files are `mixed-or-unclassified`); left for Phase 8 together with regenerating that inventory.
  4. The generator binds the identity registry to one commit, so a rerun on a new commit needs carry-forward or a fresh registry; only the comparison by `(path, fingerprint)` was done here.
  5. The ~240 MB of resync shards and the bootstrapped identity registry are not committed (owner, 2026-10-06). The resync is a one-off measurement; Phase 4's carry-forward from the committed Phase 3 registry replaces it. Consequence: part hashes in `reports/resync-261006/doc-inventory.json` cannot be re-verified (random registry ids). The final claim ledger is still sealed per §11.
- **Phase 1 deliverable disturbed by main:** main commit `22e54f834` moved `plans/260825-1841-knowledge-registry/` to `archive/plans/` although Phase 1 required it at its historical path. Recorded, not reverted.

## 7.5. Ordering with Plans A, B and C

Three plans pending approval in the main checkout (uncommitted there on 2026-10-06) edit legacy docs on main; each such edit is a legacy-root exception to account at the next sync.

| Plan | Legacy/doc writes | `AGENTS.md` |
|---|---|---|
| A `plans/261006-1415-fgos-single-door-mechanisms/` | `docs/specs/distribution.md`, possibly a `docs/specs/reading-map.md` line | phase 06 only (single writer) |
| B `plans/261006-1415-fgos-convention-component/` | new `docs/platform/convention/spec.md`; pointer lines in `docs/specs/reading-map.md`, `docs/specs/system-overview.md`; a row in `docs/platform/component-boundary.md` | phase 06, after Plan A phase 06 |
| C `plans/261006-1445-fgctl-dev-activation/` (draft) | `docs/platform/packaging-distribution/**`, row #7 of `docs/specs/distribution.md`; restores dropped-001 | phase 05; draft and unscheduled, so **not** a cutover dependency; if scheduled it runs after cutover |

Required order: **Phase 9 (atomic cutover) runs after Plan A phase 06 and Plan B phase 06**, because both write `AGENTS.md` and Phase 9 rewrites every reader of legacy paths, `AGENTS.md` included. **Plan C is an unscheduled draft and must not gate the cutover** (a plan cannot depend on work nobody has approved): dropped-001 is dispositioned before cutover as a claim restored later, pointing at Plan C's draft; if Plan C is scheduled afterwards, it writes `AGENTS.md` and `docs/platform/packaging-distribution/**` after the cutover. Phases 4-8 work on this branch and may run in parallel with A/B/C, absorbing their legacy edits at each sync. Phase 6 transforms packaging-distribution only after Plan C's docs land, or carries dropped-001 as an open conflict.

### 7.5b. Owner decisions recorded 2026-10-06

- **Syncs and legacy-root edits:** each sync of main appends the new main-side edits to `scripts/check-legacy-docs-ratchet.exceptions.json` as accounted exceptions (precedent: `b3fbcdd41`), each marked content-review-owed; the content review is done as one batch before the cutover. Approved by the owner.
- **Knowledge-registry plan move:** main's move of `plans/260825-1841-knowledge-registry/` into `archive/plans/` is accepted; the Phase 1 requirement that it stay at the historical path is amended to "reachable through a pointer note at the historical path". Approved by the owner.
- **Execution venue:** this plan is executed in a **dedicated chat session of its own**. The harness-investigation chat only maintains the plan and its intent; it does not run any phase, script or migration step. Decided by the owner 2026-10-06.
- **Authorized gate-tooling pre-step (job 1):** the owner authorized one minimal change to a gate script: the inventory generator (`scripts/generate-doc-inventory.mjs`) must skip its own saved output artifacts (the files and directories it writes under `plans/260925-documentation-authority-unification/reports/`, for example `phase-02-doc-inventory.{json,md}`, `phase-02-doc-inventory.parts/`, `phase-02-identity-registry.json`), because on the branch head it reads about 250 MB of its own output and runs out of memory. It runs as the first step of Phase 4 (see the pre-step in the Phase 4 file) once the owner starts that phase. This authorization covers only that change and its test; it does not authorize Phase 4 itself.
- **Investigate first, no gate change without a new owner decision (jobs 2 and 3):** the `verify-phase-02` failure and the two shipped-path inventory tests. Investigated on 2026-10-06 (`reports/gate-failures-investigation-261006.md`). Both earlier claims are true for different invocations: without `--base` the script stops at argument parsing; with the approved range it passes; on the branch head it fails with `ENOENT` on the moved paths. Decisions follow below.
- **Phase 4 authorized (2026-10-06):** the owner authorized Phase 4; the pre-step runs first. Phases 5 and later remain unauthorized.
- **Doers (2026-10-06):** doers may be Sonnet subagents dispatched in-process (`node bin/fgos.mjs dispatch decide`, answer `in-process`); the Lead plans, reviews, verifies independently and commits (see §7.2).
- **Pre-step 0a done (2026-10-06):** commit `6397a9970` (numbers in §7.4 item 1). **Pre-step 0b done (2026-10-06):** commit `3809d692c`, report `reports/gate-failures-investigation-261006.md`.
- **Decision D1 (2026-10-06):** `verify-phase-02` is frozen: valid only for its approved range; the 2026-10-06 passing run is its receipt; not run on later heads; Phase 4 builds its own gates.
- **Decision D2 (2026-10-06):** the two shipped-path tests are rewritten to use a fixture repository (`639456a8d`).
- **Decision D3 (2026-10-06, revised the same day):** first decided to replace the `verify-phase-01` historical-plan byte-hash check with a pointer-note check. Revised after evidence: `verify-phase-01` is bound to its approved range like `verify-phase-02`; the unmodified script passes on `38a337ecb..f0c76c5e5` (exit 0) while the pointer-note version fails there (no note at that commit). Final decision: `verify-phase-01` is frozen, valid only for its approved range; the script is unchanged. The pointer note at `plans/260825-1841-knowledge-registry/README.md` (`39e14c5e7`) satisfies the amended Phase 1 requirement without a script check.
- **Decision E (2026-10-06):** resync shards and the bootstrapped identity registry are not committed; see §7.4 item 5.
- **Decision F (2026-10-06):** the legacy-docs ratchet (script, baseline regenerated against main, exceptions, test) goes to main early as a separate small reviewed change after the pre-step. The switchboard waits for Phase 8 (avoids another `AGENTS.md` edit between Plans A and B). **Deferred by the owner later on 2026-10-06:** main carries much parallel work (observe, dispatch, Plans A and B), and a new test rule landing mid-flight would disturb it. Until then each sync re-accounts main-side legacy edits on this branch (as at `79c455f0b`). Revisit when Plan A phase 06 and Plan B phase 06 are on main, or at the latest when Phase 8 starts; if taken up, add a `--record <path> --reason` mode so authors on main need one command per edit.
- **Decision G1 (2026-10-06):** identical duplicate units inside one file are paired 1:1 by anchor in the identity carry-forward when the old and new anchor sets for that digest are equal; every other ambiguous duplicate stays an explicit gap row; the inventory's claim-id lookup resolves duplicates by anchor only for registry rows paired this way, so the ledger shows 17 claim-identity gaps (`reports/identity-carry-forward-261006.md`).
- **Decision G2 (2026-10-06):** the 8 removals with no carrier were checked against the commits that removed them (`git log -S` between `f0c76c5e5` and the head): 4 are explicit replacements and are recorded `delete-as-obsolete` with the commit as evidence, 4 are in-place edits recorded `supersede` to the edited unit. None is unexplained, so no entry was added to `dropped-claims-register.json` and §7.3 is unchanged; none is left for a decision.
- **Decision G3 (2026-10-06):** `docs/specs/observe.md` is routed through a new switchboard area "Observe (metrics and friction)" (legacy-current, maintained-authority, route `docs/specs/observe.md`, retained source `packages/observe/rust/**`) in `docs/transitional-switchboard.md` and `transitional-switchboard.json`; the file moves from a routing gap to owner-blocking like its `docs/specs/*` siblings.
- **Decision G4 (2026-10-06):** retired rows and positional-edit gap rows carry their disposition in the registry (reviewer `lead 2026-10-06`; `supersede` to the unit at the same anchor, or the class-allowed alternative).
- **Decision G5 (2026-10-06):** the final registry (`reports/identity-registry.json`), the inventory manifest and Markdown (`reports/doc-inventory.json`, `.md`) are committed; shards (`doc-inventory.parts/`) are not. The gates CLI defaults point at these files and print the regenerate command when the shards are missing. This supersedes the not-committed half of Decision E for the registry only.
- **Metadata decision (a) (2026-10-06):** the owner chose two levels. Candidate material during migration needs the six measured fields (Document type, Audience, Purpose, Design status, Last reviewed, Related). The promotion gate and every maintained canonical document at the cutover need the full `docs/doc-governance.md` §5 baseline (including `Canonical for`) plus `Supersedes` and `Superseded by`; `doc-governance.md` is not edited. Gaps are reported by `scripts/check-doc-constitution.mjs --promotion` and filled in Phase 6. Rows reviewed at cutover must carry their own reviewed rationale, not only the generator's `proposedRationale`.
- **Constitution freeze (2026-10-06):** the owner approved freezing the vocabulary version 2 and the minimum constitution (status "Accepted (frozen 2026-10-06 by the owner)"; amendments only as additive 2.x by recorded exception). Decisions recorded with it: (1) `reading-map` stays at `docs/reading-map.md` (repo-wide navigation); `docs/specs/reading-map.md` retires at the cutover and `AGENTS.md` is repointed in the consumer-rewrite phase; (2) `docs/platform/<area>/reports/**` are `history` (dated snapshots), no file moves; claims still open in `packaging-distribution/reports/track-closeout.md` are carried by the claim ledger and get their owner during transformation; (3) the authority class of the canonical `verification` kind is renamed from `evidence` to `verification-record` (vocabulary amendment 2.1-001); `evidence` stays for `evidence-payload` and `history`; (4) proof payloads nested below `verification/` are the non-authority `evidence-payload` kind, exempt from metadata (plan §3 item 10).
- **Phase 4 steps 3-5 (2026-10-06):** executed under the owner's authorization; record, blocker list and the red-team table are in `phase-04-freeze-the-minimum-constitution-and-migration-method.md`. Two judgment calls taken without the owner, both reversible: (1) eleven constitution gate checks now name the script that enforces them instead of `planned` (no rule text changed); (2) three plan §12.3 lessons were added to the constitution's `deferredToEngine` and to the intent ledger as PF-I021 (additive, recorded exception). Open owner questions are listed in the phase file's final report and the lease and evidence documents (sections 6).
- **Phase 4 closed; review answers accepted (owner, 2026-10-06):** (1) cutover write lease: the ten recommendations of `cutover-write-lease-design.md` section 6 are the design direction (no TTL, fail closed, explicit abandon; refuse all non-holder dispatch; refuse merges that intersect scope; reuse the main-checkout lock primitive behind a thin wrapper; rehearsal before the cutover; build in Phase 8; `reference-transaction` guard; random holder token outside the environment; committed "held" sidecar checked by doctor and the commit hook); the scope also includes `core/skills`, `.agents/skills` and `plugins/fgOS/skills`. (2) The legacy-docs ratchet roots stay `docs/specs` and `docs/architect`; root-level docs are covered by the inventory conservation gates. (3) The post-freeze additions (eleven gate checks wired to scripts, three additive deferrals / PF-I021) are confirmed. (4) Phase 4 is completed; Phase 5 stays not authorized.
- **Phase 5 authorized (owner, 2026-10-06):** (1) Pilot A is the host-invocation-routing re-audit; Pilot B is the work-state spec plus `docs/io-contract.md` candidate transformation (excluding `docs/work-item-lifecycle-vision.md`). (2) Authorized: `--decisions` and `--scope` in `scripts/check-doc-inventory-gates.mjs` (tests first, generator untouched) and the additive vocabulary amendment that moves `reviewed` and the other pilot-used reserved dispositions to in-use, recorded with evidence. (3) Exit thresholds and METHOD-MUST-CHANGE triggers accepted as written. (4) A drop that Pilot A confirms in a promoted target is registered in `dropped-claims-register.json` as open (dropped-001 precedent); the prose is not restored now. (5) One additive candidate route `docs/platform/work-state/**` in the switchboard (json and md); the area stays `legacy-current`. Closing Phase 5 and starting Phase 6 stay the owner's acts.
- **Phase 5 result and one fix round (owner, 2026-10-07):** the Phase 5 result is METHOD-MUST-CHANGE (E1: a known dropped unit got a non-blocking disposition; `supersede` was used for partial carries, 134 of 195 `supersede` rows of the blind audit say content is missing). One method-fix round is authorized: (1) additive vocabulary amendment `partial-carry` (the target carries part of the unit, the remainder named in the rationale; blocks cutover like `unknown-blocking`, never satisfies a promotion gate), `supersede` tightened to "the target carries the whole unit, possibly reworded", and a strict/cutover checker rule; existing blind shards are not re-disposed; (2) the unit extractor stops dropping short non-blank blocks (least disruptive rule, tested, registry carried forward, digest changes reported); (3) alias resolver: `path:line` and `path:line-line`, relative links, no silent fallback from an unknown anchor, `fromPath` anchor validation, deeper work-state anchors; (4) fresh readers get an anchor-lookup tool; (5) the `externalEffect` contradiction is recorded as a semantic conflict for Phase 6 and the candidate row is not `reviewed` until resolved. E7 is redefined: 100% of edges classified and every rewrite-class edge has a document-level target or sits in an explicit owner-judgment queue (no 90% anchor bar). Re-runs: E1 with fresh blind doers, E6 (at least 18 of 20), E7, E8 with two fresh readers, Pilot B scoped strict; one red-team pass on the fix-round changes; a second failure stops the phase. Main was synced into the branch (merge `9b28f0f4b`) before the round.

## 7.6. Known split authorities (re-checked 2026-10-06 on the synced tree)

Measured with a script over the working tree (method in the resume report); none is fixed by this plan before Phase 6-9.

- three `platform-foundations.md`: `docs/platform-foundations.md`, `docs/specs/platform-foundations.md`, `docs/platform/platform-foundations.md`; `AGENTS.md` names the first two;
- two reading maps: `docs/specs/reading-map.md` (named by `AGENTS.md`) and `docs/reading-map.md`; 4 confirmed dead paths in `docs/specs/reading-map.md` (`docs/history/phase-3-compound-learning/reports/f4-benchmark.md`, `plans/260920-immediate-test-feedback-reduction/plan.md` (now under `archive/`), `src/evolve/candidates.mjs`, `src/state/workflow-stage-graphs.mjs`);
- `plan.md` in three homes: 612 under `docs/history/**`, 19 under `plans/`, 36 under `archive/plans/`; 22 skill/task-spec files in `core/`, `domains/`, `.agents/`, `plugins/` still point plans at `docs/history/<feature>/plan.md`;
- journals in two places: 11 files under `plans/journals/`, 5 under `docs/journals/`;
- 302 Markdown files byte-identical between `docs/architect/**` and `docs/platform/**` at the same relative path (372 shared relative paths; 868 identical across all file types).

## 7.7. Executor session brief

Read in this order: this file §1, §3, §5, §7.3 to §7.6, then the phase file you are asked to run. Rules for any executor session:

- Work only in this worktree; run `pwd` and `git branch --show-current` before git commands. Never write to the main checkout (other sessions work there). Merge main into this branch with `git merge`; never rebase, never force-push, never push without the owner asking.
- Count with scripts or `rtk proxy <cmd>`, never `grep | wc` through the rtk hook (it truncated one count from 3320 to 130). State the measuring method with every number.
- Run tests with `env -u CLAUDE_CODE_SESSION_ID`. Use `node bin/fgos.mjs` for read-only queries; no state-mutating fgos/fgctl commands.
- One authorization per phase from the owner is required (§5). Commit only your own paths (`git commit -- <paths>`), conventional messages, no AI references, no phase or finding labels in code comments or test names.
- Stop and report (do not decide) when: a merge conflicts inside `docs/platform/**` content or in 10 or more files; a gate script fails for an unknown reason; claims disappear without accounting; a gate script would need a change beyond what §7.5b authorizes.
- The dropped-claims register (`dropped-claims-register.json`) needs an explicit reviewed disposition for every entry before the cutover; Plan C is a draft and is not a dependency of the cutover (§7.5).
- Report to the owner in Vietnamese (xưng "em", gọi "anh"), short, evidence-based, UNPROVEN where unproven, unresolved questions at the end.

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
| Main keeps editing legacy roots while the branch lives | Account every main-side legacy edit at each sync (ratchet exceptions) and rerun inventory before Phase 9 |
| Plans A/B/C and cutover race on `AGENTS.md` | Cutover after Plan A phase 06 and Plan B phase 06 (§7.5); Plan C is not a dependency |
| A promoted target silently lacks a settled claim | Dropped-claim register blocks Phase 9 (§7.3) |
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
- Historical registry implementation: `archive/plans/260825-1841-knowledge-registry/` (historical path `plans/260825-1841-knowledge-registry/`)
- Historical registry current-state correction: `archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md`
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
- Dropped-claim register: `plans/260925-documentation-authority-unification/dropped-claims-register.json`
- 2026-10-06 re-inventory and comparison: `plans/260925-documentation-authority-unification/reports/resync-261006/`
- 2026-10-06 resume report: `plans/reports/resume-261006-1635-doc-authority-unification.md`
- 2026-10-06 gate-failures investigation: `plans/260925-documentation-authority-unification/reports/gate-failures-investigation-261006.md`
- Phase 4 pre-step commits: `6397a9970` (generator skips its own saved output), `3809d692c` (gate-failures investigation report)
