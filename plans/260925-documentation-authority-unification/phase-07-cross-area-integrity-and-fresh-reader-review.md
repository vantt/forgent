---
phase: 7
title: "Cross-area integrity and fresh-reader review"
status: in-progress
priority: P1
effort: "8-12 Doer sessions + 9-12 independent review/reader sessions; one serial ~11 GiB close job"
dependencies: [6]
---

# Phase 7: Cross-area integrity and fresh-reader review

> Legacy numbering: this was **Phase 06** in the original plan. Historical tags,
> branches, assignment ids and reports retain their original numbers.

## Overview

**Status:** authorized by A44 on 2026-10-17; Phase 6 is closed. The independent
plan red-team at `reports/phase-07/red-team-p7-plan.md` has been incorporated through
L11-1..L11-7 in `reports/phase-07/owner-answers.md`.

**Mode:** review and candidate-document correction. Phase 7 may correct
`docs/platform/**` and its own plan evidence. It does not promote authority, adopt an
alias, retire or delete a legacy source, execute cutover, land on main, push, remove a
root-switchboard bypass, or change a gate, checker, vocabulary, extractor, comparator
or baseline.

**Purpose:** catch ownership, contract, vocabulary, boundary, navigation and
implementation-alignment errors that per-area migration could not see, then leave the
Phase 6 identity/conservation account valid at the final Phase 7 bytes.

## Requirements

| Key | Review dimension |
|---|---|
| D1 | one owner per cross-area claim |
| D2 | contract producer/consumer agreement |
| D3 | platform-wide vocabulary consistency |
| D4 | vision/spec/architecture/contract/decision separation |
| D5 | component-boundary correctness |
| D6 | preserved intent and deferred capabilities |
| D7 | generated projection/source agreement |
| D8 | newcomer navigation without legacy authority |
| D9 | implementation alignment and evidence quality |

The two success criteria remain:

1. no unresolved authority conflict; and
2. a stranger, reading the post-cutover candidate corpus, can answer read-first,
   owner, contract, risk, verification and learning questions without treating a
   legacy path as authority.

## Inputs and protected boundary

Read before execution:

- `plan.md` §5, §6, §7.2, §11 and the Phase 7-10 rows;
- A28, A34, A36, A38, A42, A43, A44 and L10-37/L10-42 in
  `reports/phase-06/owner-answers.md`;
- `reports/phase-06/step-10-report.md`, `owner-queue.md`, the final Phase 6
  inventory/identity evidence and all fresh-reader reports;
- `reports/phase-06/step10-other-group-queue.json` and
  `step10-retirement-group-counts.json`;
- `ledger/conflict-resolutions.json`, `ledger/decisions/**`, `pilot/decisions/**`,
  candidate-unverified lists, identical-owner groups and every A34 partial-carry
  record;
- `docs/platform/README.md`, `component-boundary.md`, `architecture-map.md` and all
  candidate files named by the Step 1 inventory;
- legacy sources and the root switchboard as comparison/provenance evidence only.

The fixed controls are `reports/phase-07/progress.md` and
`reports/phase-07/owner-answers.md`. At execution time, resolve every other artifact
path through `fgos convention path --json` and register it in `progress.md` before
writing. Logical names below do not authorize hand-constructed paths.

Phase 7 never edits `AGENTS.md`, `CLAUDE.md`, `docs/transitional-switchboard.md`,
`transitional-switchboard.json`, legacy roots, gates/checkers, the vocabulary,
inventory extractor closure, comparator or baselines. Main may import identity-scope
bytes only under the synchronization rule below; those imports are not Phase 7-authored
changes and must be accounted explicitly.

## Shared execution and review rules

1. **One writer and parkable units.** Exactly one writer works at a time. Each step
   updates `progress.md` with evidence, parked rows and the smallest next action before
   yielding. Never leave a partially edited candidate document.
2. **Independent roles.** L11-1 extends A38 to Phase 7: a Lead-started fresh-context
   reviewer subagent counts as independent if it did not author the reviewed rows and
   receives only pinned inputs, acceptance contract and its own output path. Reviewer
   narration is not proof.
3. **Identity and names.** Human/agent identities use
   `codex-session:<id>@<YYYY-MM-DD>` for authors and
   `reviewer:<model>-session:<id>@<YYYY-MM-DD>` for reviewers. A report's
   author-session header must equal every `authoredBy` value it owns; validation rejects
   a mismatch. Each reviewer receives a distinct convention-resolved report name; no
   two reviewers write the same path.
4. **Author turn before package turn.** Candidate edits and their digest-bound
   `post-review-edits` entries happen in author turns. The runner commits those bytes.
   Native synchronization reads committed bytes only, so the single native carry in
   Step 9 is a later package turn. No identity-source byte may change after that carry.
5. **Resource limits.** On the 15 GiB host, a native/global job that can approach
   11 GiB runs alone. Never overlap native sync, full inventory, global D/E, comparator
   or `npm test`. Review requests contain at most 60 entries and at most 400 KB each;
   partition a larger logical request without changing its one-request identity.
6. **Changed-unit discipline.** Before changing candidate content, append the current
   path, content/occurrence binding, source ids, target digest and reason to the
   post-review-edits log. Rebind by content plus occurrence/context, never by position.
   A changed binding returns to pending; no approval carries. Every changed unit is
   independently re-reviewed in Step 9.
7. **Decision boundary.** A42 lets the Lead settle ordinary routed choices as L11
   decisions. It does not delegate main landing, push, cutover, legacy retirement,
   deletion, locked-law change or stable/public contract renumbering. CTR010 numbering
   is the owner question recorded under L11-7. Only its dependent rows park.
8. **Rationale wording is never Phase 7 rework.** Under L10-37, rationale-only wording
   observations with no conservation loss remain Phase 9 promotion-truth obligations.
   Phase 7 fixes candidate content defects, including stale candidate citations such as
   TRUTH-15/TRUTH-27 and C1-* where the candidate text itself is wrong; it does not
   reopen accepted ledger rationales.
9. **Bounded corpus scope.** “Every operative claim” in Steps 5-6 means only Step 1
   cross-area rows, the known stale tables and an A36 seeded sample of the remainder.
   The full current-truth check remains Phase 9 promotion work under A28 3(b).
10. **Sampling.** Mechanically inspect every row in a homogeneous set, then deep-read
    at least 15% (minimum 10, or all if fewer than 10), every digest mismatch and every
    high-risk row. More than 3% rework expands that set to full review.
11. **No manufactured pass.** If correction needs a protected edit, promotion,
    retirement, deletion, code change or locked-law change, record and route it. Never
    weaken a check, relabel a conflict or hide a failing exit.

### Main synchronization rule

Before any Phase 7 merge, run:

```bash
git diff HEAD...main -- docs AGENTS.md CLAUDE.md \
  plans/260925-documentation-authority-unification/transitional-switchboard.json
```

- Empty output: main may be merged then; repin `SYNC` and rerun the mechanical
  boundary checks.
- Non-empty output: do not merge during content work. Continue independent rows. Step
  9 merges main after the last candidate edit and before the one native carry, so that
  the same carry accounts for Phase 7 edits and all main identity-scope changes.
- A merge never authorizes manual edits to protected paths. Before a closing merge the
  protected diff from `B0` must be empty. After a deferred closing merge, every
  protected changed blob must equal the merge's main parent, and first-parent
  non-merge history must show zero Phase 7-authored protected paths.

### Mechanical boundary checks

Step 1 commits `reports/phase-07/allowed-paths.json`. Checks A, B, C, G, H and I run
after every candidate-fix batch and again in Step 9; their command/output artifacts are
recorded, not paraphrased. Reuse the exact Phase 6 check one-liners, substituting only
the Phase 7 allowlist and the recorded `B0`/`SYNC`; do not rewrite their logic.

| Check | Required proof |
|---|---|
| A | Phase 7 first-parent, non-merge commits touch only the committed allowlist; untracked/working paths are checked too. |
| B | The five Phase 6 extractor-closure blob hashes still equal `reports/phase-06/extractor-blobs.txt`. |
| C | Every area authority status in `transitional-switchboard.json` equals the `B0`/latest legal `SYNC` pin. |
| G | The fresh gate JSON contains zero `claim-id-not-conserved` and zero `decision-self-review` findings. |
| H | Candidate-status strict check has zero findings and unresolved links. |
| I | Always-loaded reader/instruction routes equal the frozen Phase 6 reader-link baseline; no root reader switches to candidate authority early. |

Also run a protected-path diff over the gate/checker/vocabulary/extractor/comparator/
baseline list plus `AGENTS.md`, `CLAUDE.md`, both switchboards and legacy roots. It must
be empty before an allowed main merge. At final close, its only permitted non-empty
rows are blob-equal imports from the recorded main merge; Phase 7-authored history over
that list remains empty.

```bash
git diff --stat "$B0"..HEAD -- \
  AGENTS.md CLAUDE.md docs/transitional-switchboard.md docs/specs docs/architect \
  "$P/transitional-switchboard.json" \
  "$P/claim-and-disposition-vocabulary.json" \
  "$P/claim-and-disposition-vocabulary.md" \
  "$P/minimum-constitution.json" "$P/minimum-constitution.md" \
  "$P/reports/doc-inventory.json" "$P/reports/identity-registry.json" \
  "$P/reports/phase-02-identity-registry.json" \
  "$P/reports/phase-06/baseline.md" \
  "$P/reports/phase-06/extractor-blobs.txt" \
  "$P/reports/phase-06/candidate-status-baseline.json" \
  "$P/reports/phase-06/reader-links-baseline.txt" \
  scripts/generate-doc-inventory.mjs scripts/doc-inventory-artifact.mjs \
  scripts/generate-shipped-path-inventory.mjs scripts/lib/is-main-module.mjs \
  scripts/check-doc-inventory-gates.mjs scripts/check-doc-retirement.mjs \
  scripts/check-doc-constitution.mjs scripts/check-doc-candidate-status.mjs \
  scripts/check-legacy-docs-ratchet.mjs scripts/compare-doc-global-closure.mjs
```

## Mandatory Phase 6 queue routing

Step 1 gives every family and subrow a stable id. Routing is explicit even when Phase
7 does not resolve the item.

| Phase 6 owner-queue family | Phase 7 route |
|---:|---|
| 1 — A34 partial carries | Step 5 samples representation; Step 9 rebinds every affected carry; Phase 9 decides promotion truth. |
| 2 — current/promotion truth | Step 5 only for named cross-area/stale/sample rows; full truth remains Phase 9. |
| 3 — wording/citation/successor | Candidate-text defects to Steps 4-6; rationale-only observations stay Phase 9 under L10-37. |
| 4 — 32 Phase 7/8 groups | 28 semantic groups to Step 2; 4 projection/copy groups to Step 6; alias mechanics to Phase 8. |
| 5 — 14 runner cutover bindings | Phase 9, with only affected cross-area bindings sampled in Step 5. |
| 6 — inbound consumers | Phase 8 consumer inventory/rewrite preparation. |
| 7 — non-doc consumers | Phase 8/9; no executable or render-source edit in Phase 7. |
| 8 — alias/cutover coverage | Phase 8 preparation and Phase 9 adoption; alias table stays untouched. |
| 9 — 66 historical witness limits | Preserve; affected rows are re-bound in Step 9 without claiming current truth. |
| 10 — owner effort | Owner-only accounting; carry visibly, do not infer. |
| 11 — promotion/cutover authority | Owner at Phase 9; Phase 7 grants neither. |
| 12 — stale citations/projections | GRP-LIVE-01/GRP-HEAD-02/GRP-SPECS-03 and F10-11/12/13 to Step 6; candidate TRUTH/C1 defects to Steps 4-6; remaining promotion truth to Phase 9. |
| 13 — root MDView marker | Separate main-owned item; no Phase 7 edit. |

The four missing navigation routes concern
`roadmap.md`, `workspace-topology.md`, `workspace-topology-audit.md` and
`workspace-topology-roadmap.md` below
`docs/platform/system-architecture/architecture/`. Step 7 fixes candidate portal/header
navigation; the switchboard files themselves remain Phase 8 work.

## Dependency and effort shape

`1 → {2, 3, 4, 5, 6} → 7 → 8 → 9`.

Steps 2-6 depend only on Step 1. Their authoring is serial because there is one writer,
but independent review of step N may run while the Doer authors step N+1 when paths do
not overlap. All content edits, including implementation-alignment and navigation
repairs, finish before Step 7 seals the key. Step 9 is the only accounting/close step.

## Implementation Steps

### Step 1 — Pin evidence, inventory the cross-area work and ask the owner batch

- Pin `B0`, main, complete Phase 6 inputs and SHA-256 digests. Commit the allowed-paths
  file and register distinct author/reviewer artifact paths in `progress.md`.
- Generate a fresh scratch inventory and scratch identity-registry copy at `B0`. An
  A38 reviewer independently derives duplicate and semantic groups from that fresh
  inventory, then compares them with the 32-group queue. The queue join is drift
  detection only; it is not coverage proof.
- Produce readable/machine cross-area inventories with stable row id, owner,
  consumers, authority kind, source and target ids/digests, group id, implementation
  evidence, reader-gap id, disposition, blocked decision and target step.
- Cover every area gap and all 13 owner-queue families in the routing table above.
  Coverage must include 4 duplicate groups, 28 semantic groups, CTR010, four candidate
  navigation routes, six stale coordination rows, candidate wording/citation defects
  and A34 residuals.
- Immediately release one owner batch containing the five-part CTR010 question from
  L11-7 and any other owner-only question discovered here. Work unrelated to CTR010
  continues; Step 3's CTR010 rows and Step 9's zero-conflict verdict wait for the
  answer.
- **Proof:** independent fresh-inventory group derivation; unique ids; non-empty
  source digest/target step; exact queue comparison; checks A/B/C/G/H/I.
- **Stop:** Phase 6 close cannot be reproduced, A44 is absent, a required input is
  missing, or overlapping unowned edits exist.
- **Effort:** 1-2 Doer sessions plus one review; high omission risk.

### Step 2 — Resolve the 28 semantic groups

- Resolve the 27 candidate-versus-own-legacy pairs mostly mechanically from reviewed
  Phase 6 source→candidate bindings and current digests. Record the report-level
  reading **“target settled; legacy source retires at Phase 9”**. This is a reading of
  existing vocabulary fields—not a new disposition enum and not retirement authority.
- Full-read the one intra-platform history triple. For each group record present
  authority, single target owner, exact divergence, settled meaning, existing
  vocabulary disposition fields, evidence and reviewer verdict.
- A group is resolved when meaning is settled and exactly one target owner is named;
  the still-live legacy source may remain until Phase 9. Local candidate corrections
  may occur here; cross-cutting fixes route to Steps 3-6.
- **Proof:** 28/28 semantic join, reviewed ledger mapping and digests; every changed
  passage in the post-review log; checks A/B/C/G/H/I.
- **Stop:** missing binding, digest drift, unresolved meaning, implied early
  retirement/promotion, or an owner-only identity choice.
- **Effort:** about one Doer session plus one review; mostly mechanical.

### Step 3 — Reconcile contracts and component boundaries

- Build one producer/consumer/boundary matrix: producer, every consumer, contract
  id/version, payload/transport, compatibility/failure behavior, implementation
  evidence, owner, state-write/decision/runtime authority and authoritative candidate
  source.
- Include the cognition → protocol/policy → assignment → dispatch → runtime →
  evidence → work-driver chain, the missing Gateway REST registry row and CTR010
  collision dossier. Every cross-area dependency needs a contract id.
- The six stale coordination rows are inventoried here but are not edited here; Step
  5's authority-separation subpass is their sole writer.
- CTR010 rows remain parked until the owner answers L11-7. All other contracts and
  boundaries proceed. Phase 7 cannot close while the collision is unresolved.
- **Proof:** matrix completeness validator; both producer and consumer code/config/
  schema evidence; retired-name scan; citation checks; A36 review; boundary checks.
- **Stop:** incompatible producer/consumer evidence, two state-write owners, missing
  implementation evidence, missing contract id, or a required code/new-area change.
- **Effort:** 1-2 Doer sessions plus one architecture/contract review; high identity
  and boundary risk.

### Step 4 — Normalize vocabulary

- Produce term/meaning/owner/allowed-alias/prohibited-conflation rows for component,
  package, bounded context, authority boundary, responsibility ring, candidate/current/
  historical authority, producer/consumer and proposal/settled decision.
- Apply reviewed candidate-wording fixes only. A43's responsibility rings never
  imply new classes/entities. Do not edit the vocabulary system or mass-replace text.
- **Proof:** targeted searches per term, owning-source citations, changed-anchor
  checks and independent vocabulary review; checks A/B/C/G/H/I.
- **Stop:** two owners assign incompatible meanings, history would be erased, or a
  checker/vocabulary edit appears necessary.
- **Effort:** 1 Doer session plus one review; medium semantic risk.

### Step 5 — Separate authority kinds, preserve intent and verify alignment

- Scope is Step 1 cross-area rows, the known stale tables and a reviewer-seeded A36
  sample only. Label each scoped statement as vision, specification, architecture,
  contract, decision history, proposal or generated projection. Preserve A34 residual
  bytes/digests, owner and activation condition.
- The authority-separation subpass corrects the six stale coordination rows in
  `architecture-intent.md#11-current-system-fit-and-conflicts`. The implementation-
  alignment subpass then verifies those rows and must not rewrite them independently.
- For the same bounded population, record `aligned | doc-fix | implementation-gap |
  deferred`, current code/config/schema evidence, proof command, risk and owner.
  Implementation gaps are reported, never repaired here.
- Full-corpus current-truth review remains Phase 9 under A28 3(b). Rationale-only
  wording remains Phase 9 under L10-37.
- **Proof:** schema completeness, implementation citations, reviewer-held seeded
  sample/rework calculation, changed anchors and checks A/B/C/G/H/I.
- **Stop:** authority kind is unknowable, an A34 residual is lost, a proposal is made
  operative, code contradicts a candidate claim, or correction needs code/tooling.
- **Effort:** 1-2 Doer sessions plus one review; high truth/confusion risk.

### Step 6 — Reconcile projections and the four duplicate groups

- Resolve all four projection/copy groups here, including the gateway YAML, manifest,
  schema and `spec.config.yaml` family as applicable at the pin. Full-read all four and
  the CTR010-related gateway pair; do not leave them in Step 2.
- Record canonical source path/id/digest, projection path/digest, declared generator or
  manual rule, freshness, equality meaning, GRP-LIVE-01/GRP-HEAD-02/GRP-SPECS-03 and
  F10-11/12/13 dispositions.
- Use a declared `--check` mode or regenerate only in a scratch clone. Never run a
  generator that writes the working tree. A scratch difference is a finding; generated
  output, render sources and generators are not edited in Phase 7.
- **Proof:** digest/semantic comparison, check-mode or clean scratch-clone diff,
  candidate status, constitution placement and independent projection review.
- **Stop:** no canonical source, an unsafe generator, out-of-scope generated change,
  or product decision required.
- **Effort:** about one Doer session plus one review; medium generated-drift risk.

### Step 7 — Repair candidate navigation and seal the fresh-reader key

- All Steps 2-6 candidate edits must be finished. Repair navigation gaps inside
  candidate files only: `docs/platform/README.md`, candidate area portals and file
  header links. Per L11-10, the host is one system-architecture entry in
  `docs/platform/README.md` linking all four affected files. Do not edit either
  switchboard file; switchboard work remains Phase 8.
- Draft three cross-area scenarios. Each asks all six DoD questions and one authoring
  probe: where a made-up claim belongs, required metadata and links/registrations.
- State in both brief and key: **answer as the candidate corpus will read after
  cutover; legacy may be cited as provenance, never as owner**. Readers start at
  `docs/platform/README.md`.
- A distinct A38 key reviewer validates gap coverage and every `path#anchor`, then
  seals timestamp and SHA-256 digest before any reader begins. No candidate edits are
  allowed after sealing; a needed edit invalidates the key and returns to this step.
- **Proof:** 3 scenarios × (6 DoD questions + authoring probe); every Phase 6 reader
  gap mapped; citations exist; intended answer fits the eight-file whole-run budget.
- **Stop:** legacy is required as owner, a route/anchor is missing, a gap is absent, or
  the answer cannot fit the budget.
- **Effort:** 1 Doer session plus one key review; high leakage/navigation risk.

### Step 8 — Run and score independent fresh readers

- Two fresh A38 readers receive only the brief and candidate entrypoint. They record
  files in order, read at most eight files for the whole run, answer 18 DoD questions
  plus one authoring probe each, cite real candidate anchors and never use legacy as
  authority.
- A third independent scorer uses the sealed key. Pass requires each reader ≥5/6 in
  each scenario, zero fabricated anchors, zero forbidden/out-of-scope reads, zero
  legacy-authority answers and a correct authoring answer.
- At most two reader rounds. A correction invalidates the key, returns to Step 7 and
  uses new reader sessions. After round two fails, the Lead records an L11 decision to
  accept the named gap with reason or route it to Phase 8; no unbounded rerun loop.
- **Proof:** read-log validator, anchor checker, atomic score recomputation and key
  digest/seal/start ordering.
- **Stop:** key exposure/shared reader context, missing log, fabricated citation,
  budget breach, strict threshold failure or protected edit required.
- **Effort:** two readers plus one scorer per round; maximum two rounds.

### Step 9 — Perform one closing accounting step and close

This is one indivisible closing step shaped like L10-42. It does not hand any changed
Phase 7 unit to Phase 9 for later accounting.

1. Freeze final candidate content. If main was deferred, merge it now and prove every
   protected imported blob equals the main parent. End the author turn and let the
   runner commit all final identity-source bytes.
2. In a separate package turn, run exactly one native carry over those committed
   bytes. No other ~11 GiB/global job overlaps it and no identity-source byte changes
   afterward.
3. Rebind **every unit Phase 7 changed** by content and occurrence/context: target
   digests, candidate-unverified lists, identical-owner groups and affected A34 partial
   carries. Carry no approval. Package all changed rows into one logical ordinary
   request, partitioned at ≤60 entries/≤400 KB per part, and obtain independent
   matching review.
   Independently of content edits, replace every placeholder/non-content digest in
   the 14 DEFECT, four NAV and 13 QF inventory rows with a real digest of the bound
   unit or routing record; prove all 31 bindings in the closing package.
4. Refresh a scratch HEAD inventory and scratch registry. Run global D against both
   prior registries together and each prior separately; run strict E; regenerate
   expectations from authored/native state; require the unchanged comparator to exit
   0 with `ok=true`, zero differences and `errors=[]`. Strict E remains expected red
   for named Phase 8/9 open categories; its nonzero exit is evidence, not a stop, when
   exact open sets match the declared carry list.
5. Run a single hostile red-team that also serves as the checkpoint. The independent
   reviewer holds a six-mutation/30-row sensitivity pack; require 6/6 caught and zero
   false flags. Keep a separate A36 truth sample containing every high-risk and parked
   row. The author never sees the seed/key before scoring.
6. Run the final proof table below, publish the nine-dimension scorecard, group/account
   totals, reader verdict, owner-only questions and explicit Phase 8/9 routes. Phase 7
   reaches awaiting-owner-review only with zero open Critical/High findings, zero
   unresolved authority conflict and all mechanical boundaries proven.

**Closing re-entry rule (N1):** if the closing red-team, truth sample or changed-row
review finds a candidate-content defect after the native carry, return to item 1, fix
the defect, re-carry only the changed units, obtain a bounded independent re-review of
those units, then rerun D/E and the unchanged comparator. Ledger/report-only review
rework does not change identity-scope bytes and needs no re-carry. If the repaired bytes
affect a reader answer or route, invalidate the sealed key and repeat the reader gate.

**Deferred-main reader staleness (N2):** when item 1 merges deferred main after the
reader gate, compare the merge's main parent for `docs/platform/**` changes. Any such
change triggers a reader-evidence staleness check; if it changes a reader route, cited
anchor or answer, invalidate the key and repeat Steps 7-8 before close.

Final proof commands use explicit HEAD inputs and decision scopes:

```bash
# Refresh scratch artifacts at final HEAD first.
node scripts/generate-doc-inventory.mjs --refresh --commit HEAD \
  --identity-registry "$S/identity-registry.json" \
  --json-out "$S/doc-inventory.json" --md-out "$S/doc-inventory.md"

node scripts/check-doc-inventory-gates.mjs \
  --inventory "$S/doc-inventory.json" --identity-registry "$S/identity-registry.json" \
  --decisions "$P/pilot/decisions" --decisions "$P/ledger/decisions" --json

# The command above is D against both default priors together. Repeat it once per prior:
node scripts/check-doc-inventory-gates.mjs \
  --inventory "$S/doc-inventory.json" --identity-registry "$S/identity-registry.json" \
  --decisions "$P/pilot/decisions" --decisions "$P/ledger/decisions" \
  --previous-registry "$P/reports/identity-registry.json" --json
node scripts/check-doc-inventory-gates.mjs \
  --inventory "$S/doc-inventory.json" --identity-registry "$S/identity-registry.json" \
  --decisions "$P/pilot/decisions" --decisions "$P/ledger/decisions" \
  --previous-registry "$P/reports/phase-02-identity-registry.json" --json

# Run strict E in the same three both/each forms by adding --strict and the complete
# explicit source scope. Capture its expected nonzero exits and exact open sets.

node scripts/check-doc-retirement.mjs \
  --inventory "$S/doc-inventory.json" --identity-registry "$S/identity-registry.json" \
  --json

env -u CLAUDE_CODE_SESSION_ID npm test
git diff --check
```

The retirement command intentionally has no `--decisions` flag. Its result is a
recorded dry-run delta only; the absent flag is not a stop and does not weaken D/E,
which receive both decision directories explicitly.

| Proof | Expected result |
|---|---|
| A/B/C/G/H/I and protected-boundary proof | green; only an authenticated closing-main import may appear in the final protected diff |
| Non-strict D, both priors together and each separately | exit 0, zero fatal |
| Strict E | expected nonzero/red only for the exact declared Phase 8/9 categories; no unexplained row |
| Comparator | exit 0, `ok=true`, zero differences, `errors=[]` |
| Inventory digest bindings | all 31 DEFECT/NAV/QF placeholder or non-content digests bind real units; zero note-id/path-only/route-placeholder hashes remain |
| Retirement dry run | expected blocked/red for named Phase 8/9 gates; delta recorded, never treated as a Phase 7 stop |
| Candidate status/constitution placement/ratchet | green without promotion or baseline change |
| `env -u CLAUDE_CODE_SESSION_ID npm test` | exit 0; real behavior only |
| Red-team/checkpoint sensitivity | 6/6 seeded defects caught, 0 false flags; no open Critical/High |

- **Stop:** any changed unit is absent from accounting/re-review; native loss or
  unexplained D/E/comparator difference; CTR010 unresolved; strict reader failure;
  sensitivity miss; failed real test; Phase 8/9 action performed early; or a protected
  Phase 7-authored change.
- **Effort (N3 re-estimate):** 2-4 Doer sessions plus changed-row review, one
  red-team/checkpoint and one truth-sample review; add one bounded re-entry session if
  N1 fires. The native carry, D/E/comparator and full test are serial on this host;
  high resource and false-closure risk.

## Success Criteria

- [ ] all nine dimensions have evidence, independent review and a reproducible method;
- [ ] all 28 semantic and 4 duplicate groups have reviewed settled meaning and one
  target owner; legacy retirement remains Phase 9;
- [ ] no unresolved authority conflict, including CTR010;
- [ ] every Phase 7 candidate edit is in the final native carry, rebind and independent
  review; no changed unit is handed to Phase 9;
- [ ] D both/each has zero fatal, strict E has only declared later-phase opens, and the
  comparator has zero differences;
- [ ] checks A/B/C/G/H/I and the no-promotion/no-protected-edit boundary pass;
- [ ] fresh readers meet the strict navigation and authoring thresholds in at most two
  rounds while treating legacy only as provenance;
- [ ] retirement dry-run delta names only Phase 8/9 work; no gate is weakened;
- [ ] the red-team/checkpoint catches 6/6 seeded defects and leaves no open
  Critical/High finding.

## Red-team closure map and applied cuts

| Finding | Plan resolution |
|---|---|
| P7-1 | Step 9 is one L10-42-shaped native carry/rebind/re-review/global D/E/comparator close; no changed unit is deferred. |
| P7-2 | Step 9 refreshes HEAD scratch inputs, passes both decision directories, treats retirement/strict-later opens as expected red, and runs hermetic `npm test`. |
| P7-3 | Shared checks restore A/B/C/G/H/I and protected-path authorship proof. |
| P7-4 | Main sync uses the full identity-scope diff; non-empty drift is merged and carried only in Step 9. |
| P7-5 | Step 2 uses the existing-vocabulary reading “target settled; legacy source retires at Phase 9” and is sized as a mechanical pass. |
| P7-6 | Steps 7-8 use the post-cutover reader frame and repair candidate portal/header navigation before sealing; switchboard files stay Phase 8. |
| P7-7 | All alignment/content edits precede key sealing; six stale rows belong only to Step 5's authority-separation subpass. |
| P7-8 | Steps 5-6 are bounded to Step 1 rows, known stale tables and an A36 sample; full truth remains Phase 9. |
| P7-9 | L11-1 extends A38 independence to Phase 7. |
| P7-10 | Step 1 releases CTR010 immediately; Step 3 rows and final zero-conflict verdict wait. |
| P7-11 | Independent fresh-inventory derivation proves coverage; queue join detects drift only. |
| P7-12 | Step 8 caps readers at two rounds. |
| P7-13 | Shared rule 8 makes rationale-only wording a Phase 9 truth item, never Phase 7 rework. |
| P7-14 | The 13-family routing table names every destination. |
| P7-15 | Step 9 merges checkpoint into red-team with a reviewer-held 6/30 pack and keeps truth sampling separate. |
| P7-16 | Frontmatter, dependency graph and every step state effort/order explicitly. |
| P7-17 | Shared rule 3 fixes identities, unique report paths and header/`authoredBy` equality. |
| P7-18 | Step 6 permits only check mode or scratch-clone regeneration. |
| P7-19 | Steps 7-8 add and score one authoring probe per reader. |

Applied merges: old Steps 0+1; old Steps 3+6; old Steps 5+10; four duplicate groups
from old Step 2 into projection Step 6; checkpoint into the closing red-team. The
implementation-alignment pass remains explicit inside Step 5 rather than disappearing,
because D9 and the pre-key ordering require it. Key preparation and reader execution
remain separate steps, and vocabulary remains separate, because each has a distinct
independence/leakage contract. The result is nine steps with all D1-D9 requirements
retained.

## Risk Assessment

Program risks remain in `plan.md` §11. Phase-specific controls are: independent
fresh derivation instead of queue self-confirmation; one-writer/serial-heavy-job rules;
content-and-occurrence rebinding; a two-round reader cap; candidate navigation before
key sealing; a reviewer-held sensitivity pack; and one final conservation account at
the actual final bytes.
