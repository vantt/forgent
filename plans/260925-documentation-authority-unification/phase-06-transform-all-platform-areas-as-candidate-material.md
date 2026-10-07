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

**Status:** `not-started`, `not-authorized`. Phase 5 is closed (PASS-WITH-AMENDMENTS, 2026-10-07). Planned 2026-10-07. Evidence, area inventory, estimate and the owner questions (Q1 to Q5, answer before starting): [reports/phase-06-planning-261007.md](reports/phase-06-planning-261007.md).
**Mode:** the plan worktree only, one executor (an agent with repo access: read files, run `node` and `git` in the worktree), no chat history needed. Candidate and review only; no authority flips.
**Purpose:** Build the complete target corpus without creating a second live system. Every legacy platform claim ends with one reviewed owner in `docs/platform/**` or a recorded non-carry; every platform document carries the full header.

## Requirements

- schedule by target ownership and dependency, not arbitrary source files;
- preserve all retained details before improving prose; no new claims (scaffolding the map adds is labelled `Added in candidate`);
- separate current state, intended direction, obligation, rationale, decision and proof into their correct owners by constitution kind;
- update area portals and related links as part of each target unit;
- keep targets candidate until repository-wide promotion (status comes from the switchboard);
- record every deletion or archive reason in the ledger; run conservation after every target commit;
- disposition rule (Phase 5 amendment): `supersede` = the target carries the WHOLE unit, possibly reworded; part carried = `partial-carry` with a `remainder`; text absent = `unknown-blocking` with `searched`; a row whose only carrier is a pointer back to a legacy document is not carried.

**Never modified:** `docs/specs/**`, `docs/architect/**`, `docs/io-contract.md`, `AGENTS.md`, `CLAUDE.md`, `docs/reading-map.md`, `docs/specs/reading-map.md`, `alias-table.json` (empty until Phase 9), the rule text of the constitution and vocabulary (additive 2.x amendments only), the unit definition in `scripts/generate-doc-inventory.mjs`. Edits to existing `docs/platform/**` documents: header block, verbatim restores of dropped text (labelled), link repoints between candidates.

## Architecture

Approach: reuse the Pilot B procedure per area (target map, candidate authoring, decision rows, independent review, sensitivity checks), plus a script channel for rows that are provably byte-identical. Facts (regenerated 2026-10-07 at `39630b398`, method in the planning report): 1,040 legacy files, 22,426 rows; 16,640 rows are exact carries (the unit text exists byte for byte in the counterpart; 12,882 are agent-coordination evidence mirrors); 5,420 judgment rows are open; 818 duplicate and 151 semantic-conflict groups are evidence mirrors, name collisions or history and close by recorded rule; 110 canonical documents lack promotion fields.

| Step | Batch | Sources | Targets | Rows (judgment) |
|---|---|---|---|---:|
| 0 | Pin | all legacy sources | `reports/phase-06/baseline.md` | |
| 1 | Tooling and area maps | none | `scripts/`, `ledger/area-map-*.md` | 0 |
| 2 | Agent coordination | `docs/architect/agent-coordination/**` (867 evidence files, 70 documents) | `docs/platform/agent-coordination/**` | 17,034 (394) |
| 3 | Host-invocation-routing | `docs/architect/host-invocation-routing/*.md` (6) | `docs/platform/host-invocation-routing/**` | 431 (431) |
| 4 | Packaging-distribution | `docs/architect/packaging-distribution/*.md` (8), `docs/specs/distribution.md` | `docs/platform/packaging-distribution/**` | 402 (402) |
| 5 | Root authorities, laws, work-state close | root `docs/*.md`, templates, user, contracts, work-state SC-1 | `docs/platform/work-state/**`, area-map targets | 975 (609) |
| 6 | Whole-system architecture | `docs/architect/component-boundary/**`, `docs/architecture-map.md`, `docs/specs/system-overview.md`, 7 architect singles | `docs/platform/component-boundary.md`, `architecture-map.md`, map targets | 826 (826) |
| 7 | Proposals and redesigns | `docs/architect/proposals/**` (14), 5 redesign singles, domainization | `docs/platform/proposals/**`, `history/**`, map targets | 1,815 (1,815) |
| 8 | Specs and ui-spec | 6 `docs/specs/*.md` singles, `docs/ui-spec/**` | one new area each under `docs/platform/<area>/` | 557 (557) |
| 9 | Runner | `docs/specs/runner.md` (457 KB, 157 headings) | `docs/platform/runner/**` | 470 (470) |
| 10 | Close | `AGENTS.md`, `CLAUDE.md` rows; whole corpus | `docs/platform/history/documentation-authority-unification/` | 104 |

Order is fixed: sources with the highest churn (`runner.md` 96 commits in 30 days, `distribution.md` 57, `reading-map.md` 24, `observe.md` 10 in 14 days) are decided last in their batch or last overall.

## Related Code Files

- Modify or create (Step 1, only what Q2 authorizes): `scripts/check-doc-inventory-gates.mjs` (mirror entries, exact-carry entries, corpus rules, reverse check as open data, repeatable `--decisions`), `scripts/propose-doc-decisions.mjs` (new), `scripts/check-doc-retirement.mjs` (retiring roots as data, conflict-resolutions record), `scripts/check-doc-constitution.mjs` (`--decisions`), `scripts/check-doc-candidate-status.mjs` (untracked files), tests under `test/scripts/`, vocabulary amendment 2.4-001.
- Create: `plans/260925-documentation-authority-unification/ledger/` (`decisions/`, `area-map-<batch>.md`, `conflict-resolutions.json`, `alias-drafts/`), `reports/phase-06/` (baseline, one report per batch, holds, scorecard).
- Create or modify: `docs/platform/**` per the frozen maps; additive candidate routes in `transitional-switchboard.json` and `docs/transitional-switchboard.md`; `dropped-claims-register.json` (reviewed dispositions); `scripts/check-legacy-docs-ratchet.exceptions.json` (sync accounting).

## Implementation Steps

### Shared rules (apply to every step)

- Work only in `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`. Before any git command run `pwd` and `git branch --show-current` (must be `plan/260925-documentation-authority-unification`). Never write in `/home/vantt/projects/forgentX`. Merge main with `git merge main`; never rebase, never force-push, never push.
- Commit only explicit paths: `git commit -m "<conventional message>" -- <paths>`; never `git add -A`; messages `docs(unification): ...`, `docs(<area>): ...`, `feat(docs-gates): ...`; no phase, step or finding labels in messages, comments or test names; commit the same turn verification is green.
- Tests: `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs`. Count with node scripts, never `grep | wc`.
- Scratch inventory (shards are never committed): `S=/tmp/phase06 && mkdir -p $S && cp plans/260925-documentation-authority-unification/reports/identity-registry.json $S/` then `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry $S/identity-registry.json --json-out $S/doc-inventory.json --md-out $S/doc-inventory.md` (about 18 s, 2.3 GB, one run at a time). Rerun with `--refresh` after every source or target change; the registry must report no id lost.
- Gate command: `node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions plans/260925-documentation-authority-unification/ledger/decisions --decisions plans/260925-documentation-authority-unification/pilot/decisions` (until repeatable `--decisions` exists run it once per directory). Strict per batch: add `--strict --scope <each batch source path>`.
- Always green after each commit: the gate (exit 0); `node scripts/check-legacy-docs-ratchet.mjs` (exit 0); the test suite; `node scripts/check-doc-candidate-status.mjs` (no finding for touched paths, run after the commit because untracked files are invisible); `node scripts/check-doc-constitution.mjs --no-ledger --check-placement` (0 leftover); `git diff 39630b398 -- <never-modified paths>` empty beyond accounted exceptions; `git diff 39630b398 -- scripts/generate-doc-inventory.mjs` empty.
- Expected red until Phase 9, recorded as a delta per batch and never fixed by weakening a gate: global `--strict`, `check-doc-retirement.mjs --cutover`, `check-doc-constitution.mjs --cutover` and `--promotion`.
- Decision shards: format `pilot/claim-decisions.schema.json` and `pilot/README.md`; one shard per author and batch part; reviewed rows carry `reviewedBy`, `reviewedAt` and `targetUnitDigest`; `reviewed` only after a read-only review pass by someone who did not write the row (the owner or a second session; a single executor must not review its own rows). Worked example: any row of `pilot/decisions/b-behaviors.json`.
- Per-batch loop (P1 to P6): P1 pin and sync main (account new legacy edits in the ratchet exceptions); P2 freeze the target map, subdivisions labelled `Added in candidate`; P3 author candidates (verbatim carry, one H1, full header: Document type, Audience, Purpose, Design status `Candidate`, Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Last reviewed, Related, Supersedes, Superseded by; commit per document, portal last); P4 decide rows (script proposals for exact carries, judgment rows by hand; non-blind: the ledger and audit documents of a promoted area are legitimate carriers); P5 review and gates (100% of judgment rows read in both directions, 10% hand-recomputed, deterministic checks: anchors, digests, duplicate owners, candidate blocks no decision names); P6 close (link-rewrite preview and draft alias entries from the reviewed rows; two fresh-context reader runs on the area portal with an answer key committed first, at least 5 of 6 correct and 0 non-existent anchors checked with `node scripts/list-doc-anchors.mjs --check <path#anchor>`; sync main; scratch refresh; changed rows re-decided; batch report committed).
- Stop and report to the owner, deciding nothing, when: an existing constitution or vocabulary rule or the extractor unit definition must change; a gate script needs a change beyond what Q2 authorizes; a claim id is lost or claims vanish; more than 3% of a batch's rows are defective after one rework or more than 3% of sampled candidate blocks carry an unlabelled invented claim; a source drifts by more than 10% of its rows between pin and commit; a merge conflict touches `docs/platform/**` content or 10 or more files; a never-modified path changes, a reader document links a candidate, or an area status changes; another plan starts writing `docs/platform/packaging-distribution/**`, `docs/specs/distribution.md` or `docs/specs/runner.md` while that batch is open; a second failure of a re-run; actual effort per judgment row above 1.5 times the first two batches' average.

### Step 0. Authorization and pin

Owner authorization and answers to Q1 to Q5 recorded; clean tree; `git merge main`; scratch inventory; write `reports/phase-06/baseline.md` (HEAD, main HEAD, blob id per legacy source and one tree hash for the evidence tree, open counts above, exit codes of the gate, ratchet and `check-doc-retirement.mjs --cutover`, hash of the extraction functions). Commit `docs(unification): record the phase baseline and pins`. Done: baseline committed, gate and ratchet exit 0.

### Step 1. Tooling and area maps

1. Tooling (tests first, then code, separate commits; default behavior byte-identical): mirror entries (`path`, `target`, `blobSha`; the gate verifies equal blobs on every run and expands the rows as `delete-as-duplicate`, `reviewedBy` the check); `propose-doc-decisions.mjs` and exact-carry entries (the gate re-proves digest equality at the anchor on every run); corpus-rule entries; conflict-resolutions record read by `no-unresolved-conflicts`; retiring roots as data; reverse check as open data; `--decisions` for the constitution check; untracked files in the candidate-status check; repeatable `--decisions`; amendment 2.4-001 (`delete-as-duplicate`, `defer-with-owner`, `reject-with-rationale` and others to in-use) recorded after first use. Done: new tests red then green, full suite green, a second reader (owner or session) reviewed the diff once.
2. Area maps `ledger/area-map-<batch>.md` for Steps 3 to 9: per source heading range or file, target document and heading by constitution kind, operation (place verbatim, split, `archive-with-reason`, regenerate, retire), one owner per row, retiring root documents, placement of the unmapped document types (Q5), additive candidate routes for new areas. Freeze before authoring; add the routes to the switchboard (area status unchanged). Done: probe documents under each new area classify as that area and `candidate`.

### Step 2. Agent coordination

Sources `docs/architect/agent-coordination/**`; targets `docs/platform/agent-coordination/**`. (a) Add promotion headers to the 68 platform documents first (header block only; check the body is byte-identical). (b) Mirror entries for the 867 evidence files; exact-carry entries for about 3,758 rows of the 70 documents; the 394 judgment rows (two legacy-only documents, `documentation-standardization-plan.md` and `documentation-governance.md`, 190 rows, are triaged for `archive-with-reason`; list to the owner; the rest are link and header differences, decide from a diff pack). (c) `ledger/conflict-resolutions.json`: 816 mirror duplicate groups, 138 evidence name-collision groups (hand-check 20 groups first), later the 12 history groups. (d) Seeded check: a 30-row pack with 6 mutated target units given to the reviewer without telling which; 5 of 6 caught, at most 2 false flags in 24. (e) Spot check 100 random exact rows by hand. Done: `--strict --scope docs/architect/agent-coordination` exit 0; `check-doc-retirement.mjs --cutover` shows `no-unresolved-conflicts` counting only groups outside this batch.

### Step 3. Host-invocation-routing

Re-decide all 431 rows under current ids (first-round shards in `pilot/first-round/` are evidence only; use them as a prior). Restore dropped-002 to 017 verbatim at the anchors the map names (status note where code differs; check each against code and git history first; an entry found obsolete goes to the owner); give every register entry a `reviewedDisposition`; reconcile HI-I027. Done: all 16 registered groups appear as restored or flagged (known-answer check); scoped strict exit 0; first checkpoint refresh of the committed manifest and registry (`node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --json-out plans/260925-documentation-authority-unification/reports/doc-inventory.json --md-out plans/260925-documentation-authority-unification/reports/doc-inventory.md`, no id lost, default gate exit 0) and an effort report.

### Step 4. Packaging-distribution

All 402 rows. dropped-001: its seven units get `defer-with-owner` against a labelled stub heading in `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` ("not carried; restoration tracked by dropped-001 and Plan C"); the register keeps the Plan C owner. Decide `docs/specs/distribution.md` rows last and re-check its digest before committing. Done: scoped strict exit 0 except the stub rows (reviewed, `defer-with-owner`).

### Step 5. Root authorities, laws, work-state close

SC-1: in the candidate `docs/platform/work-state/contracts/cli-io-contract.md#entry-fields-and-effect-axes` state that the effect-axis verbs come from the manifest (`COMMAND_REGISTRY`, 15 verbs, no `coordination`), remove the exclusive two-verb list, then re-review the two held rows with the code evidence. Decide the root documents, templates, user, contracts, generated and json files and the three non-authority root documents per the map and Q5. `AGENTS.md` and `CLAUDE.md` rows wait for Step 10. Done: scoped strict for the batch sources exit 0; `check-doc-constitution.mjs --no-ledger --promotion` lists no gap for new documents.

### Step 6. Whole-system architecture

Author against the existing `component-boundary.md` and `architecture-map.md`; record `No component-boundary change` or the change in the batch report; re-pin after Plan B's pointer lines if it landed. Seeded check: repeat the structural mutation run (11 seeded defects, 0 findings on the clean copy). Done: scoped strict exit 0; second checkpoint refresh and an effort report.

### Step 7. Proposals and redesigns

Triage table of the 27 files (kind, status, evidence it is still a live proposal, historical or carried elsewhere), then place by constitution kind with the text verbatim; `archive-with-reason` within the Q3 delegation; any `delete-as-obsolete` goes to the owner. Done: scoped strict exit 0.

### Step 8. Specs and ui-spec

One area per spec (spec, contracts, decisions as content requires; Pilot B shape); `docs/ui-spec/**` as one area. Decide `observe.md` and `confinement-authority.md` last with digest re-checks. Done: scoped strict exit 0.

### Step 9. Runner

Map the 157 headings first (retired decision history to `decisions/`, contracts to `contracts/`, shared agent-coordination parts to the subcomponent the map names); author in sections of about 55 KB; check the `docs/specs/runner.md` digest before every commit; sync main before starting and before closing; rows whose digest changed are re-decided, never merged by hand. Done: scoped strict exit 0 at the final main sync.

### Step 10. Close

(1) Decide `AGENTS.md` and `CLAUDE.md` rows after the last sync. (2) Scoped strict over every legacy source exit 0 except `reports/phase-06/holds.md`. (3) `check-doc-constitution.mjs --no-ledger --promotion`: 0 headerless, 0 missing. (4) Promotion rehearsal in a throwaway clone under scratch (flip candidate routes to promoted and legacy roots to retired in the clone, regenerate, run strict and `check-doc-retirement.mjs --cutover`, record what still blocks; remove the clone). (5) Register: 17 of 17 reviewed. (6) Merge alias drafts, validate with `node scripts/doc-alias-resolver.mjs --table <merged draft>` (exit 0), report coverage of the 973 legacy paths. (7) Create `docs/platform/history/documentation-authority-unification/` with a README (history kind), the snapshot format and a dry-run snapshot with a digest verified by script (sealing happens in Phase 9). (8) Third checkpoint refresh. (9) Scorecard, defects, effort record in `reports/phase-06/`; set `plan.md` §7.1 row 6 to "awaiting owner review". Closing is the owner's act; no tag.

## Effort (rough, UNPROVEN, from Phase 5)

About 5,500 judgment rows plus 16,640 script-proven rows over 10 steps. Phase 5 took about 2 days for 966 first-round rows plus tooling and a fix round; at its measured rates (author plus reviewer about 61 rows per run, about 4.8k tokens per row) Phase 6 is about 185 agent runs, about 30 million tokens (21 to 46 million) and 8 to 12 working days with the tooling, about twice that without it. Per-step figures and assumptions: the planning report, section 6.

## Success Criteria

- [ ] every legacy source file (1,040 at planning time) has one non-blocking file disposition and every row is `reviewed` with its own rationale; `--strict --scope <all legacy sources>` exits 0 except `reports/phase-06/holds.md` (at most 10 rows besides the seven dropped-001 units);
- [ ] at least 95% of candidate headings trace to a source row or carry `Added in candidate`; 0 unlabelled invented normative claims in the sampled blocks; the reverse check lists 0 unreferenced candidate blocks;
- [ ] exact carries re-verified by the gate at the final HEAD; a 100-row hand spot check per batch finds 0 errors;
- [ ] 818 of 818 duplicate and 151 of 151 conflict groups closed by recorded rule or decision; `no-unresolved-conflicts` reports 0;
- [ ] 17 of 17 dropped-claims entries have a reviewed disposition;
- [ ] `--promotion` 0 headerless and 0 missing fields; candidate-status 0 findings; `--check-placement` 0 leftover;
- [ ] alias drafts validate (exit 0); 973 of 973 history-read legacy paths covered or `no-alias` with a reason; link preview classifies 100% of inbound edges with a target or a queue entry;
- [ ] per batch, fresh readers: at least 5 of 6 correct, 0 non-existent anchors, 0 legacy-authority answers;
- [ ] no authority flip, ratchet exit 0, suite green, no claim id lost, no extractor change; the rehearsal ran and its blockers are recorded; the ledger destination holds a verified dry-run snapshot;
- [ ] the final ledger destination is prepared at `docs/platform/history/documentation-authority-unification/`, where a sealed immutable claim-conservation snapshot plus digest/proof will survive cutover as D2 evidence and an H2 import source.

Verdicts: PASS, PASS-WITH-AMENDMENTS (additive script fixes and 2.x amendments only), METHOD-MUST-CHANGE (stop and report).

## Risk Assessment

Program-level risks and countermeasures: `plan.md` §11. Phase-specific:

| Risk | Detection | Response |
|---|---|---|
| Hot sources move during a batch | digest check before each commit; sync at batch start and close | re-decide only changed rows; hot sources last |
| Exact-carry rows hide a wrong owner | gate re-proof, one-owner gate, hand spot check | return the batch; add the failing class to the checks |
| One agent reviewing its own rows | reviewer must differ from author | owner or second session reviews; do not mark `reviewed` otherwise |
| A content-dropping author | seeded mutation pack, 10% recompute, reverse check, partial-carry rule | rework once, then stop condition |
| Pending plans write legacy docs or `AGENTS.md` | sync at batch start and close | account exception, re-pin, re-decide changed rows |
| Repository growth (shards about 4 MB, each registry refresh about 12 MB compressed) | sizes per checkpoint | three refreshes only |
| Gate tooling change breaks existing behavior | existing tests, byte-identical default run | revert the tool commit |

Rollback: the work is additive. `git revert` the batch commit range, or reset the branch to `39630b398` for the whole phase; then `git status` clean, gate and ratchet exit 0, committed manifest, registry, `docs/platform/` and switchboard equal to their Phase 5 content, the register back to 17 open entries.
