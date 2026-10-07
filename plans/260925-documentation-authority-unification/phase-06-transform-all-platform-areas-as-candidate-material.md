---
phase: 6
title: "Transform all platform areas as candidate material"
status: pending
priority: P1
effort: ""
dependencies: [5]
---

# Phase 6: Transform all platform areas as candidate material

> Legacy numbering: this was **Phase 05** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

## Overview

**Status:** `not-started`, `not-authorized`. Phase 5 is closed (PASS-WITH-AMENDMENTS, 2026-10-07). Planned 2026-10-07; this text is a plan only. Evidence, area inventory, estimate and the owner question bundle (Q1 to Q5, to be answered before authorization): [reports/phase-06-planning-261007.md](reports/phase-06-planning-261007.md). Harness per `plan.md` §7.2 (re-check `fgos dispatch decide` at phase start). Packaging-distribution does not wait for Plan C: it carries dropped-001 as an open entry with a stub anchor (`plan.md` §7.3, §7.5).
**Mode:** plan branch, isolated plan worktree, candidate and review only; doers are in-process Sonnet subagents, the Lead plans, verifies, reviews and is the only committer.
**Purpose:** Build the complete target corpus without creating a second live system. Every legacy platform claim ends with one reviewed owner in `docs/platform/**` (or a recorded non-carry), every platform document carries the full header, and nothing flips authority.

## Requirements

**Rules (unchanged from the plan, plus the Phase 5 amendments):**

- schedule by target ownership and dependency, not arbitrary source files;
- preserve all retained details before improving prose; no new claims in a candidate (added-in-candidate scaffolding is labelled);
- separate current state, intended direction, obligation, rationale, decision and proof into their correct owners by constitution kind;
- update area portals and related links as part of each target unit;
- keep target docs explicitly candidate until repository-wide promotion (candidate status comes from the switchboard);
- record every deletion or archive reason in the ledger;
- run conservation after every target commit;
- `supersede` means the target carries the whole unit; a part carried is `partial-carry` with a remainder; a unit whose text is absent is `unknown-blocking` with `searched`;
- a row whose only carrier is a pointer back to the legacy document is not carried (defect M-03);
- no change to the unit definition of `scripts/generate-doc-inventory.mjs` for the whole phase (constitution section 8.1); the diff of that file against `39630b398` is empty at every commit.

**Never modified:** any file under `docs/specs/**`, `docs/architect/**`, `docs/io-contract.md`, `AGENTS.md`, `CLAUDE.md`, `docs/reading-map.md`, `docs/specs/reading-map.md`, `plans/260925-documentation-authority-unification/alias-table.json` (empty until Phase 9), the rule text of the constitution and vocabulary (additive 2.x amendments only, recorded by exception). Edits to the three promoted portals and to existing `docs/platform/**` documents are limited to the header block, verbatim restores of dropped text (labelled), and link repoints between candidates.

**Allowed new or changed paths:** `docs/platform/**` (candidates, headers, restores), `plans/260925-documentation-authority-unification/ledger/` (decision shards, area maps, conflict resolutions), `reports/phase-06/`, switchboard (`transitional-switchboard.json` and `docs/transitional-switchboard.md`: additive candidate routes only), `dropped-claims-register.json` (reviewed dispositions), `scripts/` and `test/scripts/` for the tooling the owner authorizes in Q2, ratchet exceptions (sync accounting).

## Architecture

Program-level data model and execution boundary: `plan.md` §5 and §6. Inventory facts (regenerated 2026-10-07 at `39630b398`): 1,040 legacy files, 22,426 rows; 16,640 rows are script-provable exact carries (byte-identical unit at the counterpart, 74%); 5,420 judgment rows are open (132 more were reviewed in Pilot B); 818 duplicate groups (816 evidence mirrors) and 151 semantic-conflict groups (138 evidence name collisions, 12 history, 1 area name collision) are closable by rule; 110 canonical documents lack promotion fields.

### Batches (non-overlapping source and target ownership)

| Batch | Sources | Targets | Rows (judgment) | Notes |
|---|---|---|---:|---|
| B0 | none (tooling, area maps) | `scripts/`, `test/scripts/`, `ledger/area-map-*.md`, switchboard routes | 0 | blocks everything else; needs Q1 and Q2 |
| B1 | `docs/architect/agent-coordination/**` (867 evidence payloads, 70 documents) | `docs/platform/agent-coordination/**` (headers only), `ledger/decisions/b1-*.json` | 17,034 (394) | mirror and exact entries by script; 394 diff-review rows; 68 promotion headers |
| B2 | `docs/architect/host-invocation-routing/*.md` (6) | `docs/platform/host-invocation-routing/**` (33 targets) | 431 (431) | non-blind re-decision; restore dropped-002 to 017; reconcile HI-I027 |
| B3 | `docs/architect/packaging-distribution/*.md` (8), `docs/specs/distribution.md` | `docs/platform/packaging-distribution/**` (20 targets) | 402 (402) | `distribution.md` rows last, digest re-check; dropped-001 stub |
| B4 | work-state and io-contract close (SC-1), root authorities, laws, templates, non-authority root documents | `docs/platform/work-state/**`, `platform-foundations.md`, `vision.md`, further targets by the area map | 891 plus 84 (609) | needs Q5; `AGENTS.md`, `CLAUDE.md` rows move to B9 |
| B5 | `docs/architect/component-boundary/**`, `docs/architecture-map.md`, `docs/specs/system-overview.md`, architect singles (intent, workspace-topology x3, roadmap, system-vision, README) | `docs/platform/component-boundary.md`, `architecture-map.md`, area documents by map | 826 (826) | component-boundary check note required |
| B6 | `docs/architect/proposals/**` (14), redesign and discussion singles (5), domainization | `docs/platform/proposals/**`, `docs/platform/history/**`, area documents by map | 1,815 (1,815) | needs Q3; whole-file placement by kind |
| B7 | `docs/specs/{confinement-authority,fgos-plugin,herdr-web-dashboard,observe,distillery,decision-citation-drift}.md`, `docs/ui-spec/**` | one new `docs/platform/<area>/` each (spec, contracts, decisions as the content requires) | 557 (557) | `observe.md`, `confinement-authority.md` last |
| B8 | `docs/specs/runner.md` (457 KB) | `docs/platform/runner/**` (new area) and any agent-coordination subcomponent the map names | 470 (470) | hottest source; last; per-commit digest check |
| B9 | `AGENTS.md`, `CLAUDE.md` rows; whole corpus | `docs/platform/history/documentation-authority-unification/` (prepared), reports | 104 | gates, rehearsal, checkpoint, seal preparation |

Order is B0, B1, B2, B3, B4, B5, B6, B7, B8, B9. Lead-only steps of the next batch (pin, area map) may overlap the reviewers of the current one; two batches never author at the same time.

### Execution model

Every doer prompt carries: task, exact files to read, the one path it may write, acceptance criteria, constraints (no legacy edits, no git, no `--yagni`: deliver the full requested scope), work context path (the plan worktree), report path `reports/phase-06/`, the status protocol. Absolute worktree paths only; at most 4 doers in flight; one file per doer; before any dispatch the Lead runs `node bin/fgos.mjs dispatch decide --for <purpose> --needs-soul --has-live-task-access` and follows its answer. Reviewers are fresh, read-only, never the author. Cost assumptions: 160k tokens per run, 70 judgment rows per author run and per reviewer run (Phase 5 measurements, UNPROVEN at this size).

## Related Code Files

- Create (B0, after Q2): `scripts/propose-doc-decisions.mjs` and tests; changes to `scripts/check-doc-inventory-gates.mjs` (mirror entries, exact-carry entries, corpus rules, repeatable `--decisions`, reverse check as open data), `scripts/check-doc-retirement.mjs` (retiring roots as data, conflict resolutions record), `scripts/check-doc-constitution.mjs` (`--decisions`), `scripts/check-doc-candidate-status.mjs` (untracked files), `test/scripts/*.test.mjs`; vocabulary amendment 2.4-001. `scripts/generate-doc-inventory.mjs` unit definition is not touched.
- Create: `plans/260925-documentation-authority-unification/ledger/decisions/` (shards, one per doer), `ledger/area-map-<batch>.md`, `ledger/conflict-resolutions.json`, `reports/phase-06/` (baseline, one report per batch, defects, scorecard), alias drafts under `ledger/alias-drafts/`.
- Create or modify under `docs/platform/**` per the frozen area maps; `docs/platform/history/documentation-authority-unification/README.md` (B9).
- Modify: `transitional-switchboard.json` and `docs/transitional-switchboard.md` (additive candidate routes), `dropped-claims-register.json`, `scripts/check-legacy-docs-ratchet.exceptions.json` (sync accounting only).

## Implementation Steps

Common to every step. Scratch inventory (never into the tree; shards are not committed): copy `reports/identity-registry.json` to `$S/identity-registry.json` and run `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry $S/identity-registry.json --json-out $S/doc-inventory.json --md-out $S/doc-inventory.md` (about 18 s, 2.3 GB, one run at a time). Gate: `node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions plans/260925-documentation-authority-unification/ledger/decisions --decisions plans/260925-documentation-authority-unification/pilot/decisions` (repeatable `--decisions` is part of the tooling; until then one directory). Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs`. Commits: `git commit -- <exact paths>` after a `pwd` and `git branch --show-current` check, conventional messages (`docs(unification): ...`, `feat(docs-gates): ...`, `docs(<area>): ...`), no phase or finding labels in code, comments or test names, never `git add -A`, commit the same turn verification is green. Count with scripts, never `grep | wc`.

**Always green after every commit:** scratch gate exit 0; ratchet exit 0; script suite green; `check-doc-candidate-status.mjs` no finding for touched paths (run after the commit); `check-doc-constitution.mjs --no-ledger --check-placement` 0 leftover for new paths; `git diff 39630b398 -- docs/specs docs/architect docs/io-contract.md AGENTS.md CLAUDE.md docs/reading-map.md docs/specs/reading-map.md plans/260925-documentation-authority-unification/alias-table.json` empty beyond accounted exceptions; `git diff 39630b398 -- scripts/generate-doc-inventory.mjs` empty.
**Expected red until Phase 9 (recorded as a delta per batch, never fixed by weakening a gate):** global `check-doc-inventory-gates.mjs --strict`, `check-doc-retirement.mjs --cutover`, `check-doc-constitution.mjs --cutover` and `--promotion`. A step that turns one green outside its scope is a defect.

**Step 0. Authorization and pin (Lead).** Owner authorization of Phase 6 recorded with the answers to Q1 to Q5; `pwd`, branch, clean tree; `dispatch decide` answer recorded; `git merge main`, account new legacy edits in the ratchet exceptions; scratch inventory; `reports/phase-06/baseline.md`: HEAD, main HEAD, per-source digests of all 1,040 legacy files (blob ids; for the evidence payload tree one tree hash), open counts (the numbers in Architecture), gate, ratchet and retirement-dry-run exit codes, hash of the extraction functions. Commit: `docs(unification): record the phase baseline and pins`. Rollback: revert.

**Step B0. Tooling and area maps.**
- B0a (Code slice, tests first, after Q2): T1 mirror entries, T2 `propose-doc-decisions.mjs` and exact-carry entries (the gate re-proves digest equality at the anchor on every run; a changed unit makes the decision stale), T3 corpus-rule entries, T4 conflict-resolutions record read by `no-unresolved-conflicts`, T5 retiring roots as data, T6 reverse check, `--decisions` for the constitution check, untracked files in the candidate-status check, repeatable `--decisions`, T7 amendment 2.4-001 recorded after the first use. Default behavior byte-identical (existing conservation and retirement tests prove it). Independent read-only code review through `dispatch decide --for review`; at most one re-review. Commits per tool.
- B0b (area maps): the Lead with up to 6 read-only doers writes `ledger/area-map-<batch>.md` for B2 to B8 plus the root documents: per source heading range or file, the target document and heading by constitution kind, the operation (verbatim place, split, archive-with-reason, regenerate, retire), one owner per row, the retiring root documents for T5, the placement of the eight unmapped document types (per Q5), and the additive switchboard routes for new areas (`docs/platform/runner/**` and the others). The Lead checks every placement and freezes each map; after the freeze a target heading is not renamed (anchors are the contract). Commit: maps, then `docs(unification): add the candidate routes for the new platform areas`.
- Gate: scratch probe documents under each new area classify to the intended area and `candidate`; tooling tests green; no change in the default gate run.

**Steps B1 to B8, each batch uses procedure P1 to P10 below** with the batch-specific items listed here.

- **B1 agent-coordination.** P3 first: promotion headers on the 68 platform documents (2 to 4 doers, header block only; a script checks that the body below the header is byte-identical). Then P4 by script: mirror entries for the 867 evidence files, exact-carry entries for 3,758 rows of the 70 documents, diff packs for the 394 judgment rows (two legacy-only documents of 190 rows go to the Lead's triage: `documentation-standardization-plan.md` and `documentation-governance.md`; any `archive-with-reason` or `delete-as-obsolete` list is shown to the owner). Duplicates and conflicts: `ledger/conflict-resolutions.json` for the 816 mirror groups and the 138 evidence name collisions after the Lead samples 20 collision groups. Known-answer control: 6 seeded mutations in a 30-row pack. Spot check: one reviewer on 100 random exact rows.
- **B2 host-invocation-routing.** P2 map with the 16 drop groups (G23 to G75 sets named in `reports/phase-05/pilot-a-discrepancy.md` section 2) placed at target anchors; P3 includes the restores (verbatim, status note where the code differs; the Lead checks each entry against code and git history first); P4 six authors, one per source, first-round shards available as a prior; reviewers 100%; the register entries receive `reviewedDisposition`; HI-I027 reconciled. Known-answer check: all 16 registered drops reappear as restored or flagged. Checkpoint 1 (committed manifest and registry refresh) and cost report.
- **B3 packaging-distribution.** Six authors by source; dropped-001: the seven units get `defer-with-owner` against a labelled stub heading in `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md`; `distribution.md` rows decided last with a digest re-check before commit; if Plan C is scheduled mid-batch, pause and re-sync.
- **B4 root, laws, work-state close.** SC-1: the candidate contract states that the effect-axis verbs come from the manifest (`COMMAND_REGISTRY`, 15 verbs, no `coordination`), the two held rows are re-reviewed with the code evidence (disposition recorded with the evidence); work-state and io-contract shards from Phase 5 stay valid; the seven registry gap rows keep their recorded precedent; root documents per the area map and Q5; templates, user, contracts, generated and json files dispositioned by rule; the three non-authority root documents get dispositions; `docs/specs/reading-map.md` digest re-check before commit.
- **B5 whole-system architecture.** Candidate authoring against the existing `component-boundary.md` and `architecture-map.md`; a `No component-boundary change` or an explicit change note in the batch report (documentation-management rule); re-pin after Plan B's pointer lines; known-answer control: the structural mutation run (11 mutations) once. Checkpoint 2 and cost report.
- **B6 proposals and redesigns.** P2 is a triage table of 27 files (kind, status, evidence that each is still a live proposal, historical, or carried elsewhere); P3 is a script-assisted verbatim placement by kind; reviewers confirm kind, status and verbatim identity; `archive-with-reason` within the Q3 delegation; any `delete-as-obsolete` goes to the owner.
- **B7 specs and ui-spec.** One Pilot-B-style area per spec (spec, contracts, decisions as the content requires); `docs/ui-spec/**` as one area with its 21 files placed by kind; `observe.md` and `confinement-authority.md` last in the batch with digest re-checks.
- **B8 runner.** P2: Lead and one doer map the 157 headings (retired decision history to `decisions/`, contracts to `contracts/`, shared agent-coordination parts to the subcomponent the map names); authors split by source size (about 55 KB each, 8 authors); digest of `docs/specs/runner.md` checked before every commit; sync main before start and before close; rows whose digest changed are re-decided, never merged by hand; the three pending writers (advisory capability, council parity, request-to-run p1) are re-checked at start.

**B9 close (Lead, with doers where noted).** (1) Scoped strict over every legacy source (`--strict --scope` per batch source set) exit 0 except the hold list in `reports/phase-06/holds.md`; (2) `AGENTS.md` and `CLAUDE.md` rows decided after the last sync; (3) `check-doc-constitution.mjs --promotion` 0 headerless and 0 missing fields; (4) promotion rehearsal in a throwaway clone under scratch (removed afterwards): flip the candidate routes to promoted and the legacy roots to retired in the clone's switchboard, regenerate, run strict and `check-doc-retirement.mjs --cutover`, record which checks still block and why (UNPROVEN until run); (5) dropped-claims register: 17 of 17 with a reviewed disposition; (6) alias drafts merged, validated (`doc-alias-resolver.mjs --table`, exit 0), coverage against the 973 legacy paths read by history; (7) link queues complete for all sources; (8) create `docs/platform/history/documentation-authority-unification/` with README (history kind), snapshot format and a dry-run snapshot with digest verified by script (the sealed final snapshot is produced at Phase 9 step 2); (9) checkpoint 3 refresh of the committed manifest and registry (`--refresh --commit HEAD`, "carried forward", no id lost, default gate exit 0); (10) scorecard, defects, cost record (E11 style) in `reports/phase-06/`, red-team (3 hostile reviewers) on the closing diff, verdict, `plan.md` §7.1 row 6 set to "awaiting owner review". Closing the phase is the owner's act; no tag until then.

### Procedure P1 to P10 (per batch)

1. **Pin.** `git merge main`, account new legacy edits in the ratchet exceptions (content-review-owed), scratch `--refresh` (0 ids lost), per-source digests and main HEAD into `reports/phase-06/batch-<n>.md`.
2. **Target map.** Frozen by the Lead from `ledger/area-map-<batch>.md`; subdivisions labelled added-in-candidate; additive switchboard route for a new area.
3. **Authoring.** One doer per target document; verbatim carry; full header (Document type, Audience, Purpose, Design status Candidate, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related, Supersedes, Superseded by); exactly one H1; portal last; commit per document; candidate-status check after the commit.
4. **Decisions.** Script proposals first; doers decide the judgment rows (corrected brief, non-blind, one shard per doer); reviewed rows carry `targetUnitDigest`.
5. **Review.** 100% of judgment rows by fresh reviewers in both directions; one defective row returns the shard once; the Lead recomputes 10% per shard by hand; deterministic checks 100% (anchors, digests, duplicate owners, unreferenced candidate blocks, exact-text proof, `decision-loss-without-partial-carry`).
6. **Gates.** Scoped strict for the batch exit 0 except holds; the always-green list above; the expected-red list delta.
7. **Preview.** Link rewrite preview (every inbound edge classified; every rewrite-class edge has a document-level target or sits in the judgment queue), draft alias entries from the reviewed decisions.
8. **Fresh readers.** Two in-process read-only readers, key committed first, anchor lookup tool (`scripts/list-doc-anchors.mjs`), three scenarios, six L5 questions each; at least 5 of 6 correct, 0 non-existent cited anchors, 0 legacy-authority answers, at most 8 files opened before the first correct owner document; the opened-file list is cross-checked and `git status` is clean afterwards (read-only is an instruction, not a sandbox).
9. **Red-team.** `ak:plan red-team`, two hostile reviewers (assumption, failure mode); Critical and High fixed without the owner; Medium and Low recorded with a disposition; at most one re-review.
10. **Close.** Sync main; scratch refresh; carry-forward proof; changed rows re-decided; batch report committed (counts before and after, defects, tokens, runs, wall time).

Owner decision points: before Step 0 (authorization and Q1 to Q5), at an `archive-with-reason` or `delete-as-obsolete` list when Q3 requires it, at a real semantic conflict, at a stop condition, and at the close. The Lead reports at the B2 and B5 checkpoints and continues unless a stop condition fires.

## Cost and duration (UNPROVEN, grounded in Phase 5 E11)

About 185 doer runs, about 30 million tokens (21 to 46 million) with the Q2 tooling; about 60 million without it; 8 to 12 calendar days, paced by the Lead, not by subagent time (about 1 hour of subagent time at 4 in parallel). Per batch figures and assumptions: [report section 6](reports/phase-06-planning-261007.md). Phase 5 for comparison: about 8 million tokens, about 2 days. Checkpoints after B2 and B5 compare actual tokens per judgment row with 4.8k.

## Success Criteria

Pilot-style: measured by script or Lead recount, number and method stated in the batch and phase reports.

- [ ] **X1 coverage:** every legacy platform source file (1,040 at planning time, regenerated at close) has one non-blocking file-level disposition and every row is `reviewed` with its own rationale; `--strict --scope <all legacy sources>` exits 0 except the rows on the hold list. `unknown-blocking` and `partial-carry` rows outside the hold list: 0. Hold list entries each name the pending owner decision; at most 10 rows besides the seven dropped-001 units (which are `defer-with-owner`, reviewed).
- [ ] **X2 both directions:** at least 95% of the headings of every new or changed candidate document trace to a source row or carry an added-in-candidate label; 0 unlabelled invented normative claims in the Lead's stratified sample (all blocks for a batch of 300 rows or fewer, at least 50 blocks otherwise); the reverse check lists 0 unreferenced candidate blocks.
- [ ] **X3 exact carries:** every exact entry re-verified by the gate at the final HEAD (digest equality at the anchor); independent spot check of 100 random exact rows per batch finds 0 errors; the 867 evidence mirror entries verify by blob equality.
- [ ] **X4 conflicts:** 818 of 818 duplicate groups and 151 of 151 semantic-conflict groups closed by a recorded rule or decision; `migration-acceptance/no-unresolved-conflicts` reports 0 in the retirement dry run; any group the sample shows to be a real conflict is resolved by an owner decision, not a rule.
- [ ] **X5 dropped claims:** 17 of 17 register entries have a reviewed disposition (restored at an anchor, restoration owner named, or intentional with evidence); `dropped-claims-unreviewed` is 0.
- [ ] **X6 metadata:** `check-doc-constitution.mjs --promotion` reports 0 headerless and 0 missing fields for every canonical document (110 at planning time plus new targets); `check-doc-candidate-status.mjs` 0 findings; `--check-placement` 0 leftover.
- [ ] **X7 aliases and consumers:** alias drafts validate (exit 0); every legacy path read by history has a bare-path alias or a recorded `no-alias` reason (973 of 973 accounted at planning time); per batch, a 20-reference sample of immutable references resolves in at least 18; link preview classifies 100% of inbound edges and every rewrite-class edge has a document-level target or is in the judgment queue; the queue sizes are reported.
- [ ] **X8 readers:** per batch the fresh-reader thresholds of P8 hold for both readers.
- [ ] **X9 hygiene and identity:** no authority flip (the never-modified diff is empty beyond accounted exceptions; area `authorityStatus` and `canonicalRoute` unchanged in the switchboard); ratchet exit 0; script suite green; no claim id lost at any carry-forward; no change to the extractor unit definition; every ratchet exception on an in-scope file is content-reviewed through a re-decided row at the last sync; red-team leaves 0 open Critical or High in every batch.
- [ ] **X10 rehearsal and ledger destination:** the throwaway-clone promotion rehearsal ran and its blockers are recorded; `docs/platform/history/documentation-authority-unification/` exists with a verified dry-run snapshot and digest.
- [ ] **X11 cost recorded:** runs, tokens, wall time and rows per run per batch against the estimate, for the owner.

Verdicts: **PASS** (all hold), **PASS-WITH-AMENDMENTS** (all hold after additive fixes only: scripts with tests, 2.x amendments recorded by exception), **METHOD-MUST-CHANGE** (stop and report). Closing is the owner's act.

### Stop conditions

Stop the batch (or phase) and report to the owner, without deciding:

1. A needed change to an existing constitution or vocabulary rule (not an addition), or to the unit definition of the extractor.
2. A gate-script change beyond the Q2 authorization.
3. A claim id lost at a carry-forward, or claims that disappear without accounting.
4. In a batch, more than 3% of reviewed rows returned as defective after the one author rework, or more than 3% unlabelled invented claims in the sample, or a fresh-reader fabricated anchor or authority confusion whose cause is the method.
5. The source digest of a batch drifts on main by more than 10% of its rows between pin and commit (pause; the owner may order a freeze).
6. A merge conflict inside `docs/platform/**` content or in 10 or more files at a sync.
7. Any mutation of a never-modified path, any reader or instruction document linking to a candidate, or any switchboard status change of an area.
8. A second failure of a batch re-run after its fix (same style as Phase 5), or two consecutive batches whose red-team leaves an open Critical or High.
9. Actual tokens per judgment row above 1.5 times 4.8k at the B2 or B5 checkpoint (replan with the owner).
10. Plan C or another plan starts writing `docs/platform/packaging-distribution/**`, `docs/specs/distribution.md` or `docs/specs/runner.md` while the owning batch is open (pause, re-sync, re-pin).
11. `fgos dispatch decide` answers other than `in-process` for doers or review (follow the answer, report the difference), or generator memory exhaustion on a rerun.
12. The promotion rehearsal shows that a cutover check cannot pass by any step in the plan (report the gap; do not change the gate).

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11. Phase-specific:

| Risk | Detection | Response |
|---|---|---|
| Hot sources move during a batch (`runner.md` 96 commits in 30 days, `distribution.md` 57, `reading-map.md` 24, `observe.md` 10 in 14 days) | digest check before each commit; sync at batch start and close; the 10% rule | re-decide only the changed rows; hot sources are last in their batch or last overall |
| Agent coordination dominates | rows by class in the baseline: 394 judgment rows of 5,504 | scripts and one batch; no author runs on exact rows |
| Script-proven rows hide a semantic problem (a byte-identical unit carried to the wrong owner) | spot check of 100 exact rows per batch; one owner per semantic claim gate; anchor and digest binding | return the batch, add the failing class to the checks |
| Same-model blind spots (Sonnet doers and reviewers) | seeded mutation controls (B1, B5), Lead 10% recompute, deterministic checks | the Lead may run one Opus review pass on B5 and B8 for a class of defect the first pass missed |
| Pending plans write legacy docs or `AGENTS.md` mid-phase | sync at batch start and close; stop condition 10 | account the exception, re-pin, re-decide changed rows |
| New areas created on main (Plan B writes `docs/platform/convention/`) | the inventory at each sync | a candidate with no legacy source; no transformation needed |
| Repository growth (decision shards about 4 MB; registry refresh about 12 MB compressed each) | sizes recorded per checkpoint | three refreshes only; exact carries stored as entries, not rows |
| Evidence mirrors disposed wrongly (policy still Draft) | Q1 answered before B1 | the disposition string is one value; revert the shard commit |
| Promotion headers on existing documents change units | the body-identical script check; decisions computed after headers | decisions are bound to unit digests, so a late header edit shows as a stale decision |
| A batch quietly flips authority through a link from a reader document | stop condition 7; `rg` for candidate paths outside the plan and candidate trees after each batch | revert the link |
| Gate tooling change breaks existing behavior | existing conservation and retirement tests; byte-identical default run | revert the tool commit |
| Rework loops consume the estimate | defect counts per shard, tokens per row at checkpoints | stop condition 9 |

Rollback for the whole phase: the work is additive. `git revert` the Phase 6 commit range (or reset the branch to `39630b398`); nothing else is removed. After rollback: `git status` clean, scratch gate exit 0, ratchet exit 0, committed manifest and registry equal to their Phase 5 content, `docs/platform/` equal to its Phase 5 content, switchboard back to its Phase 5 bytes, `dropped-claims-register.json` back to 17 open entries.
