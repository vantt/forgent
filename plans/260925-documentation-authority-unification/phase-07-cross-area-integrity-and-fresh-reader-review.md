---
phase: 7
title: "Cross-area integrity and fresh-reader review"
status: in-progress
priority: P1
effort: ""
dependencies: [6]
---

# Phase 7: Cross-area integrity and fresh-reader review

> Legacy numbering: this was **Phase 06** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** authorized by the owner on 2026-10-17 (A44, `reports/phase-06/owner-answers.md`); Phase 6 closed. Implementation steps are being detailed. Harness per `plan.md` §7.2.
**Mode:** plan branch, review only except fixes
**Purpose:** Catch errors that per-area migration cannot see.

## Requirements

**Review dimensions:**

- one owner per cross-area claim;
- contract producer/consumer agreement;
- platform-wide vocabulary consistency;
- vision/spec/architecture/contract/decision separation;
- component-boundary correctness;
- preserved intent and deferred capabilities;
- generated projection/source agreement;
- newcomer navigation without legacy paths;
- implementation alignment and evidence quality.

## Architecture

Program-level data model and execution boundary: `plan.md` §5 (Execution Boundary) and §6 (Minimum Migration Data Model).

## Related Code Files

Phase 7 is a documentation-integrity pass. It may correct candidate material under
`docs/platform/`, but it does not change application code or the protected migration
machinery. Read these inputs before starting:

- `plan.md` §5, §6, §7.2, §11 and the Phase 7-10 rows;
- `ledger/conflict-resolutions.json`, `ledger/decisions.jsonl`, the committed document
  inventory and identity registry;
- `reports/phase-06/step10-other-group-queue.json`,
  `reports/phase-06/step10-retirement-group-counts.json`,
  `reports/phase-06/step-10-report.md`, `reports/phase-06/owner-queue.md`, and
  `reports/phase-06/owner-answers.md`;
- every Phase 6 fresh-reader brief, key and report under `reports/phase-06/`;
- `docs/platform/component-boundary.md`, `docs/platform/architecture-map.md`,
  `docs/platform/system-overview.md`, `docs/platform/README.md`, and the candidate
  area documents named by the inventory;
- the current root switchboard and legacy sources as comparison evidence only, never
  as Phase 7 write targets or newcomer authority;
- `scripts/list-doc-anchors.mjs`, `scripts/check-doc-candidate-status.mjs`,
  `scripts/check-doc-constitution.mjs`, `scripts/check-doc-inventory-gates.mjs`,
  `scripts/check-doc-retirement.mjs`, and `scripts/check-legacy-docs-ratchet.mjs` as
  read-only proof tools.

The fixed Phase 7 control files are `reports/phase-07/progress.md` and
`reports/phase-07/owner-answers.md`. At execution time, resolve every additional
report, key, brief and journal path with `fgos convention path --json`; the logical
artifact names below describe contents, not hand-constructed filenames. Record the
resolved paths in `progress.md` before writing them.

## Implementation Steps

### Review-dimension key

| Key | Review dimension |
|---|---|
| D1 | one owner per cross-area claim |
| D2 | contract producer/consumer agreement |
| D3 | platform-wide vocabulary consistency |
| D4 | vision/spec/architecture/contract/decision separation |
| D5 | component-boundary correctness |
| D6 | preserved intent and deferred capabilities |
| D7 | generated projection/source agreement |
| D8 | newcomer navigation without legacy paths |
| D9 | implementation alignment and evidence quality |

### Shared execution and review rules

1. The Doer authors inventories, candidate corrections and reports. Each step is a
   separate parkable unit: update `progress.md` with its evidence, unresolved rows and
   exact next action before leaving it. Never leave a partially edited authority doc.
2. A reviewer is a Lead-started, fresh-context reviewer under A38 who did not author
   the reviewed rows. Reviewer briefs contain only the pinned inputs, acceptance
   contract and resolved output paths. Reviewer narration is not proof; the committed
   artifacts and reproducible commands are.
3. Ordinary owner-routed choices are decided by the Lead under A42 and recorded as
   L11-1, L11-2, ... in `reports/phase-07/owner-answers.md`. Each question records:
   what is happening, its cause, options with costs, the recommendation, and the exact
   scope of the answer.
4. A42 does **not** delegate main landing, push, Phase 9 cutover or legacy retirement,
   or deletion. It also does not authorize silently changing a stable/public contract
   identity: renumbering or reassigning CTR010 is an owner question. Park only the
   dependent rows while the rest of the step continues.
5. The 32 queued conflict groups are derived from the committed ledger and queue, not
   copied into a brief by hand. Every candidate edit cites its group/claim identifiers,
   source digest and review evidence. A changed row is reviewed again.
6. Phase 7 may repair candidate content under `docs/platform/`. It must not promote
   candidate authority, adopt aliases, retire or delete legacy sources, execute
   cutover, land on main, push, remove switchboard bypasses, edit the root switchboard,
   or edit gates, checkers, vocabulary, extractor, comparator or baselines.
7. If a needed correction crosses those boundaries, changes a locked law, or cannot
   be made without altering a protected tool, record it and stop only that dependency.
   Do not weaken a check or relabel a conflict to manufacture a pass.
8. Use A36 sampling for large homogeneous sets: mechanically inspect every row and
   deep-read at least 15% (minimum 10, or all when fewer than 10), plus every digest
   mismatch. More than 3% deep-review rework expands the whole set to full review.

### Mandatory Phase 6 carry-forward coverage

Step 1 assigns a stable row id to every item below; later steps may close it, route it
to Phase 8, or park it behind an owner answer, but may not silently collapse or omit it.

| Source area | Gaps that must be represented |
|---|---|
| Host invocation | no explicit risk rubric; proof scattered; manifest contract outside the area; portal-pointer dependence; no area-level DoD map; earlier whole-run read-budget breach |
| Root/governance | scratch-artifact placement unclear; route for changing baselined legacy behavior unclear; proof and risk assembled from multiple places; work-state portal does not expose schema evolution clearly |
| Whole platform | CTR010 collision and missing Gateway REST registry row; four missing route proposals; current/candidate/advisory status ambiguity; risk/proof scattered; decision-record plus map-version update scattered; system overview too thin for ownership navigation |
| Proposals | no switchboard route; index covers only part of the set and points through legacy; current plan-loop owner unclear; no cross-area proposal registration target; no Proposal row in the authority matrix; operative guidance buried in area sections |
| Specs/UI | portal registry covers only `ui-spec`; portal and switchboard status disagree; placement of a new capability in a legacy-current area is unclear; candidate copies present themselves as operative while legacy governs; confinement statements conflict; plugin verb/wrapper/open-gap counts conflict; citation-drift counts and retired paths conflict; distillery lacks a transition table; herdr method/path-count/port defaults conflict; generated-file, validation-name and ratchet-scope statements conflict; area READMEs dead-end outside the reader scope; reader-brief hygiene is inconsistent |
| Runner | RUL76 timeout status needs current-evidence confirmation; known conflicts are hard to discover; per-rule anchors/index are missing; component-boundary navigation is not reachable; some rules lack decisions or have id gaps; switchboard copies are ambiguous; strict failures were obscured by lenient scoring |
| Cross-area queue | all 4 duplicate and 28 semantic groups; every wording/citation row; the stale current-system-fit table in `docs/platform/system-architecture/architecture/architecture-intent.md`; preserved/deferred residuals from A34 |

The four route proposals are specifically for
`docs/platform/system-architecture/architecture/roadmap.md`,
`workspace-topology.md`, `workspace-topology-audit.md`, and
`workspace-topology-roadmap.md` in that same directory. Phase 7 proves and records the
needed routes; Phase 8 owns switchboard edits and bypass removal.

### Step 0 — Pin the evidence frame and independent review lanes

- **Inputs:** the plan sections above; A28/A34/A36/A38/A42/A43/A44; the final Phase 6
  pin, scorecard and owner queue; current branch status.
- **Produces:** a baseline block in `progress.md` with commit/digest pins, resolved
  artifact paths, author/reviewer separation, step status values, and the explicit
  no-promotion/no-cutover boundary. It also records that Phase 6 is closed and Phase 7
  is authorized by A44.
- **Dimensions:** D9, and the evidence frame for D1-D8.
- **Authors/reviewers:** Doer writes the frame; one A38 Lead-started reviewer checks
  that it matches the committed Phase 6 close and contains no stale open gate.
- **Proof commands:** `git status --short`; `git rev-parse HEAD`;
  `git diff --check`; a SHA-256 digest over every pinned JSON/Markdown input, recorded
  beside its path in `progress.md`.
- **Stop conditions:** a Phase 6 pin cannot be reproduced; A44 is absent; an expected
  ledger/queue is missing; or the worktree already contains overlapping unowned edits.
- **Out of scope:** all document fixes and every global exclusion in Shared rule 6.
- **Effort/risk:** 0.5 Doer session + short review; low effort, medium provenance risk.

### Step 1 — Compute the cross-area inventory from committed evidence

- **Inputs:** pinned `ledger/conflict-resolutions.json`, committed inventory and
  identity registry, decision ledger, Phase 6 owner queue, the 32-group queue, and all
  Phase 6 fresh-reader gaps.
- **Produces:** machine-readable and readable cross-area inventories. Each row carries
  stable row id, claim/contract/term, source and target areas, current owner and
  consumers, authority kind, source ids/digests, conflict-group ids, implementation
  evidence, reader-gap ids, disposition, blocking decision and target step. A coverage
  table proves that all 4 duplicate and 28 semantic groups (32 total), CTR010, four
  missing route proposals, stale coordination-engine tables, wording/citation items,
  and every area’s reader gaps are represented exactly once or cross-referenced.
- **Dimensions:** D1-D9 (inventory only; no resolution claim yet).
- **Authors/reviewers:** Doer generates the inventory from committed records; an A38
  reviewer independently recomputes counts and samples rows back to source evidence.
- **Proof commands:** a read-only Node script checks unique row ids, non-empty source
  ids/digests/target step, valid group references and exact `4 + 28 = 32` coverage;
  `git diff --check`. Store the command and output with the inventory.
- **Stop conditions:** counts disagree with committed evidence; any row lacks a source
  digest; a fresh-reader gap cannot be assigned to an area; or resolution would depend
  on guessing an unrecorded owner.
- **Out of scope:** deciding a conflict, editing candidate docs, generating a new
  baseline, or changing the inventory/extractor machinery.
- **Effort/risk:** 1-2 Doer sessions + one review; medium effort, high omission risk.

### Step 2 — Resolve and route all 32 conflict groups

- **Inputs:** Step 1 inventory, the original ledger rows for the 4 duplicate and 28
  semantic groups, A28/A34/A36, and the affected candidate sources.
- **Produces:** one resolution row per group with present authority, target authority,
  exact divergence, `fix-now | preserve-intent | defer-to-8 | owner-blocked`
  disposition, evidence, target step and reviewer verdict. Duplicate groups must name
  which copy is projection/reference rather than merely saying “same”; semantic groups
  must state the settled meaning. `defer-to-8` is valid only after current and target
  authority are settled and the remaining work is purely alias/switchboard mechanics;
  it cannot hide a semantic conflict. Candidate-only corrections that are wholly local
  to a group may be made here; cross-cutting corrections are routed to Steps 3-7.
- **Dimensions:** D1, D3, D4, D6, D7, D9.
- **Authors/reviewers:** Doer authors every resolution and any candidate fix; an A38
  reviewer reads every group resolution and all changed passages. Lead records any
  ordinary routed decisions under L11-* per A42.
- **Proof commands:** a Node check joins the resolution rows to the committed queue and
  fails on a missing/duplicate group, unknown disposition or unresolved row without a
  blocking decision; `git diff --check`; anchor-check every changed citation with
  `node scripts/list-doc-anchors.mjs --check <path#anchor>`.
- **Stop conditions:** the join is not 32/32; a source digest changed after Step 1; a
  resolution implies promotion/retirement/deletion; or CTR010 must be renumbered.
- **Out of scope:** Phase 8 alias/switchboard action, Phase 9 cutover, and treating a
  deferral as a resolved authority conflict.
- **Effort/risk:** 2-4 Doer sessions + full independent review; high semantic risk.

### Step 3 — Prove contract producer/consumer agreement

- **Inputs:** inventory rows tagged contract, the contract matrix in
  `docs/platform/component-boundary.md`, API/schema documents, architecture map,
  implementation declarations, and CTR010 evidence.
- **Produces:** a producer/consumer agreement matrix. For each contract it names the
  owning producer, each consumer, version/id, request/event/schema shape, transport,
  failure/compatibility behavior, implementation evidence and authoritative source.
  It includes an explicit CTR010 collision dossier and the missing Gateway REST row.
- **Dimensions:** D1, D2, D5, D7, D9.
- **Authors/reviewers:** Doer authors the matrix and safe candidate corrections; one
  A38 contract reviewer checks both producer and consumer evidence rather than only
  the prose. Lead may settle ordinary wording/ownership issues under A42.
- **Proof commands:** a matrix validator rejects missing producer, consumer, id,
  version or evidence fields; `rg -n "CTR010|confinement-authority|/v1" docs/platform`;
  relevant anchor checks; `git diff --check`.
- **Stop conditions:** producer and consumer evidence disagree with no compatible
  reading; implementation evidence is absent; or the fix requires renumbering,
  reassigning or removing CTR010. For CTR010, prepare the five-part decision question
  with options and recommendation, route it to the owner, and park only affected rows.
- **Out of scope:** contract renumbering without owner answer, compatibility cutover,
  endpoint changes, alias adoption, retirement and deletion.
- **Effort/risk:** 1-2 Doer sessions + specialist review; medium effort, high external-
  identity risk.

### Step 4 — Normalize platform vocabulary without changing the vocabulary system

- **Inputs:** inventory term rows, area glossaries, claim ledger, decision history,
  responsibility-ring answer A43, and vocabulary inconsistencies found by Phase 6
  readers.
- **Produces:** a term/meaning/owner/allowed-alias/prohibited-conflation table plus
  reviewed candidate wording fixes. At minimum it tests component vs package vs
  bounded context vs authority boundary; responsibility ring vs class/entity;
  candidate vs current vs historical authority; producer vs consumer; and proposal vs
  settled decision.
- **Dimensions:** D1, D3, D4, D5, D6.
- **Authors/reviewers:** Doer authors and fixes candidate wording; an A38 vocabulary
  reviewer checks every meaning against its owning source and A43.
- **Proof commands:** targeted `rg -n` queries listed in the report for every term and
  deprecated synonym; citation anchor checks; `git diff --check`.
- **Stop conditions:** two owners assign incompatible meanings; the only apparent fix
  requires editing the vocabulary checker/baseline; or wording would erase preserved
  historical intent.
- **Out of scope:** adding checker rules, changing the vocabulary registry/tooling,
  mass replacement, promotion or retirement.
- **Effort/risk:** 1-2 Doer sessions + one review; medium effort, medium semantic-drift
  risk.

### Step 5 — Separate authority kinds and preserve deferred intent

- **Inputs:** inventory authority-kind rows; vision, spec, architecture, contract and
  decision documents; A28/A34; proposal-area reader findings; wording/citation queue.
- **Produces:** an authority-kind matrix and candidate corrections that label each
  operative statement as vision, specification, architecture mapping, contract,
  decision history, proposal or generated projection. Deferred capabilities retain a
  verbatim residual, owning source, digest and activation condition; no proposal or
  carried history is presented as current behavior.
- **Dimensions:** D1, D4, D6, D7, D8, D9.
- **Authors/reviewers:** Doer authors the matrix and candidate fixes; an A38 reviewer
  traces each sampled claim from statement to owning source and retained residual.
- **Proof commands:** a schema check requires authority kind, owner and source id on
  every row; A36 sampling output; anchor checks for all moved citations; `git diff
  --check`.
- **Stop conditions:** a claim’s authority kind cannot be distinguished from context;
  a residual/digest from A34 is missing; a fix would declare a proposal operative; or
  a locked-law change is implied.
- **Out of scope:** accepting proposals, superseding locked laws, adopting aliases,
  promotion, retirement or deletion.
- **Effort/risk:** 1-2 Doer sessions + sampled review; medium effort, high authority-
  confusion risk.

### Step 6 — Check the component boundary and responsibility chain

- **Inputs:** `docs/platform/component-boundary.md`, architecture map, contract matrix,
  implementation/module evidence, A43, and all boundary-tagged inventory rows.
- **Produces:** a boundary review covering component ownership, parent/child relation,
  state-write authority, decision authority, runtime authority, contracts and cross-
  area dependencies. It explicitly separates current operative tables from carried
  advisory/history and checks the cognition → protocol/policy → assignment → dispatch
  → runtime → evidence → work-driver chain. Stale Agent Coordination/
  `CoordinationSession` material is corrected or clearly marked non-current.
- **Dimensions:** D1, D2, D3, D4, D5, D6, D9.
- **Authors/reviewers:** Doer authors the boundary analysis and candidate corrections;
  an A38 architecture reviewer checks every changed boundary against docs and code.
- **Proof commands:** a table join proves each component has exactly one owner and all
  cross-area dependencies have contract ids; targeted `rg -n` for retired coordination
  names and current replacements; citation anchor checks; `git diff --check`.
- **Stop conditions:** two components claim one state-write authority; a dependency
  lacks a contract; the implementation contradicts the proposed boundary; or a fix
  requires a new component/product area rather than documentation correction.
- **Out of scope:** creating components, changing runtime structure, editing contracts
  in code, promotion, cutover or retirement.
- **Effort/risk:** 1-2 Doer sessions + architecture review; medium effort, high boundary
  risk.

### Step 7 — Reconcile generated projections with their sources

- **Inputs:** every inventory row marked generated/projection, its canonical source and
  generation declaration; decision-index/architecture-map/registry evidence; duplicate
  group resolutions.
- **Produces:** a projection/source agreement report with source path/id/digest,
  projection path/digest, generator or manual-projection rule, freshness result and
  repair disposition. Candidate wording may be corrected; generated output is changed
  only through its declared generator and only if that generator is not protected.
- **Dimensions:** D1, D4, D6, D7, D9.
- **Authors/reviewers:** Doer records mappings and runs declared read-only checks; an
  A38 reviewer recomputes digests and samples semantic equality.
- **Proof commands:** digest comparison from the pinned manifest; declared generated-
  artifact check commands; `node scripts/check-doc-candidate-status.mjs --json`;
  `node scripts/check-doc-constitution.mjs --json --check-placement`; `git diff
  --check`.
- **Stop conditions:** a projection has no canonical source; a generator would need to
  be edited; regeneration changes material outside Phase 7 scope; or source and
  projection cannot be reconciled without a product decision.
- **Out of scope:** editing generators/checkers/baselines, adopting generated output as
  new authority, global regeneration, promotion, retirement and cutover.
- **Effort/risk:** 1-2 Doer sessions + one review; medium effort, medium generated-drift
  risk.

### Step 8 — Lock the whole-platform fresh-reader key before readers start

- **Inputs:** resolved outputs from Steps 1-7 and the Phase 6 fresh-reader method and
  gaps from host invocation, root/governance, whole system, proposals, specs/UI and
  runner.
- **Produces:** a sealed answer key, reader brief and gap-coverage matrix for three
  whole-platform scenarios. Each scenario asks all six DoD questions: read first,
  work kind/owner, contract, risk, proof, and learning destination. The matrix carries
  forward every area gap, including CTR010, the four missing switchboard route
  proposals, stale coordination tables, proposal discoverability, candidate/current
  ambiguity, runner rule discoverability, and scattered risk/proof guidance. Keys cite
  only real candidate `path#anchor` targets and are timestamped/digested before readers
  receive briefs.
- **Dimensions:** D1-D9, with primary coverage D8 and D9.
- **Authors/reviewers:** Doer drafts the key and brief; a Lead-started A38 key reviewer,
  distinct from the Doer and later readers, validates and seals them. Readers must
  never receive or inspect the key.
- **Proof commands:** `node scripts/list-doc-anchors.mjs --check <path#anchor>` for
  every key citation; a schema check proves 3 scenarios × 6 questions and full gap-id
  coverage; SHA-256 digests and seal time precede every reader start time.
- **Stop conditions:** any key answer relies on legacy authority; an anchor is missing;
  one area’s gaps are absent; or the key cannot answer all six questions within the
  planned read budget.
- **Out of scope:** running readers, changing the switchboard, removing bypasses,
  promotion, alias adoption or repairing docs after key sealing.
- **Effort/risk:** 1 Doer session + independent key review; medium effort, high test-
  leakage risk.

### Step 9 — Run and score independent whole-platform fresh readers

- **Inputs:** the sealed key and reader brief from Step 8, but readers receive only the
  brief and candidate entrypoint.
- **Produces:** two independent reader reports, a blind score sheet and a gap result.
  Each reader starts fresh under A38, records every file opened in order, reads no more
  than eight files for the complete run, answers all 18 scenario questions with real
  anchors, identifies authority kind, and uses no legacy path as authority. Score both
  strict and lenient for audit; the pass gate is strict: each reader gets at least 5/6
  fully correct in every scenario, with zero fabricated anchors, zero out-of-scope
  reads and zero legacy-authority answers.
- **Dimensions:** D1-D9, with primary coverage D8 and D9.
- **Authors/reviewers:** the Doer authors the run manifest and resulting gap log; two
  separate Lead-started A38 fresh readers author reports; a third A38 scorer, who is
  neither Doer nor reader, scores against the sealed key. The Doer records gap ids only
  after independent scoring.
- **Proof commands:** validate all cited anchors; a read-log checker enforces the
  eight-file whole-run budget and allowed root; a score checker recomputes every strict
  threshold from atomic question scores; compare key digest and seal/start times.
- **Stop conditions:** key exposure; shared context between readers; missing read log;
  fabricated citation; budget breach; any reader misses a strict threshold; or a gap
  implies a protected/out-of-scope edit. Route correctable gaps back to their owning
  earlier step, issue a new key version, and rerun both readers.
- **Out of scope:** Doer self-scoring, lenient-score waiver, legacy navigation as the
  solution, switchboard bypass removal, promotion and cutover.
- **Effort/risk:** two reader sessions + one scoring session, plus bounded rework;
  medium effort, high independence/navigation risk.

### Step 10 — Check implementation alignment and evidence quality

- **Inputs:** all resolved inventory rows, contract and boundary matrices, current
  implementation/config/schema evidence, test declarations, and the stale
  `architecture-intent.md` coordination-engine tables.
- **Produces:** an implementation-alignment matrix with `aligned | doc-fix |
  implementation-gap | deferred` status, code/config/schema evidence, proof command,
  risk and owner for every operative claim. Correct candidate docs that describe the
  retired coordination engine as current, including the six stale current-system-fit
  rows (graph shape, round counting, context visibility, driver authority, mutation,
  and declared-operation dispatch). Implementation gaps are reported, not repaired in
  this documentation phase.
- **Dimensions:** D2, D3, D5, D6, D9.
- **Authors/reviewers:** Doer performs the trace and candidate corrections; an A38
  reviewer independently verifies all high-risk rows, every mismatch and the A36
  sample of aligned rows.
- **Proof commands:** targeted repository searches recorded per row; declared tests for
  the referenced behavior; A36 sample/rework calculation; anchor checks; `git diff
  --check`. No global native sync is part of this phase.
- **Stop conditions:** implementation cannot substantiate an operative claim; more
  than 3% sampled aligned rows need rework; a doc fix would conceal a code defect; or
  proof requires changing production code/protected tooling.
- **Out of scope:** implementation fixes, native synchronization, new infrastructure,
  checker/baseline changes, promotion, retirement and cutover.
- **Effort/risk:** 2-4 Doer sessions + deep review; high effort, high truth-alignment
  risk.

### Step 11 — Close with checkpoint, red-team and truth sample

- **Inputs:** completed Steps 0-10, all L11-* decisions, parked owner-only questions,
  strict fresh-reader results and the Phase 6 Step 10 close pattern.
- **Produces:** a Phase 7 close report and owner summary containing the nine-dimension
  scorecard, 32/32 conflict disposition, zero-unresolved-authority assertion, open
  owner-only questions, Phase 8/9 carry list, proof ledger and success-criteria verdict.
  It also produces independent checkpoint, red-team and truth-sample results sized to
  Phase 7: checkpoint covers every dimension and exclusion; red-team attacks authority
  collisions, false-current wording, hidden legacy dependence and unsupported proof;
  truth sample applies A36 and includes every high-risk/owner-blocked row.
- **Dimensions:** D1-D9.
- **Authors/reviewers:** Doer assembles the close report; three distinct Lead-started
  A38 roles perform checkpoint, red-team and truth sample. None authored reviewed rows.
  Lead accepts or rejects ordinary findings under A42; owner-only matters remain
  visibly parked and cannot be converted into an acceptance by the Lead.
- **Proof commands:** rerun all step validators; `node scripts/check-doc-candidate-status.mjs
  --json`; `node scripts/check-doc-constitution.mjs --json --check-placement`;
  `node scripts/check-doc-inventory-gates.mjs --json`;
  `node scripts/check-doc-retirement.mjs --json`;
  `node scripts/check-legacy-docs-ratchet.mjs --json`; `npm test`; `git diff --check`.
  Record exit status and output reference for each command.
- **Stop conditions:** any unresolved authority conflict, including an owner-blocked
  collision; any of the 32 groups lacks a reviewed disposition; a Critical/High
  red-team finding; failed strict reader gate; checkpoint rejection; truth-sample
  threshold breach; failed proof; or evidence that Phase 8/9 action was performed
  early.
- **Out of scope:** closing an owner-only CTR010 question by inference, main landing,
  push, promotion, alias adoption, retirement, deletion, Phase 9 cutover, and Phase 8
  switchboard bypass removal. The close report requests the next authorization; it
  does not grant it.
- **Effort/risk:** 1-2 Doer sessions + three independent reviews; high coordination
  effort, high false-closure risk.

## Success Criteria

- [ ] no unresolved authority conflict;
- [ ] a stranger can answer the platform's read-first, owner, contract, risk,
  verification, and learning questions without legacy authority.

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11.
