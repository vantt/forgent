# Step 3 wave 1 review, u02 (seeded sample of files without patches)

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`. Reviewed worktree `/home/vantt/projects/forgentX-s8-review` (detached at 8ab390227). Read-only; no checker or probes run. For each file I read the whole source at the pin, the whole JSONL record (all edges, coverage exclusions, witnesses, empty diff) and the live candidate files named below. I did not read `.fgos/`. Elapsed review time: roughly 40 minutes.

All six files have an empty diff, so every finding below is an outcome defect (disposition), not a patch-text defect.

Convention checks used as evidence. I scanned every record in batches 003-033 (excluding the pilot batches) for how the same kind of source line was dispositioned:
- 31 `Provenance:` header lines are preserved. Exactly 1 is a row-flip (maps-j-07881).
- 10 "retained source" lines are preserved. Exactly 1 is a row-flip (maps-j-07891).

## Per-file verdicts

### 1. docs/platform/work-state/README.md (batch-030:1), verdict rework
Record digest `373bf70738ba1b7e63404e09ade9802f92c95d6ebf1e64e2823564ae67225667`. 14 edges reviewed: 4 preserve, 10 row-flip, 0 patch/park. No added edges. The one coverage exclusion (L62 `vision.md`) is correct, because the label sits inside a complete link to `docs/platform/vision.md`.

Outcome defects:
- **maps-j-07881** (source L21, `Provenance: Retained work-state candidate carriage from docs/specs/work-state.md; existing Related references retained`), disposition `phase9-row-flip`.
  - Rule: authoring digest, "provenance ... preserve original spelling". The Provenance line asserts lineage, not current authority. The row-flip reason ("replace the legacy-current authority assertion") does not describe this line. The same line is preserved 31 times elsewhere in the wave.
  - Correction: change to `preserve`, with the reason "provenance / header lineage; exists at author pin; tree retires at Phase 9" and a non-executable successor note `docs/platform/work-state/spec.md`.
- **maps-j-07891** (source L75, row `| retained source for the platform vision candidate | [../../work-item-lifecycle-vision.md](...) |`), disposition `phase9-row-flip`.
  - Rule: same-kind edges get the same disposition (L12-30(3)). The row states lineage ("retained source"), not authority.
  - Its twin maps-j-07888 (source L62, "A third retained source, ... belongs to the platform vision candidate") is preserved, and the path stays under L12-26(3). The "legacy owner" rows 07889/07890 are authority rows and flip correctly.
  - Correction: change to `preserve`, with the same reason text as 07888 and the successor note `docs/platform/vision.md`.

Edges 07878, 07879, 07880, 07882-07887, 07888, 07889 and 07890 are correct. The flips on L34, L40 and L60 are right: the rows say "canonical until the cutover" or "find the canonical text today", and the retained-root dependency on `docs/io-contract.md` is stated on L60.

Record-text notes:
- The record carries a stray `resolutionSearches` key `author-wave1-docs-platform-work-state-README-L62C185` with legacyPath `docs/architect/agent-coordination/vision.md`. It belongs to an excluded span, not to an edge, and its assessment text is unrelated. It is harmless, but it is a leftover.
- The reason text on 07878 says "Non-executable successor note: docs/platform/work-state/spec.md". That is fine.

### 2. docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md (batch-004:2), verdict rework
Record digest `909b3c8a7143c1eea70e1cd40827b016246e7fed4121cf89bd1940924ebce146`. 13 edges reviewed: 12 preserve, 1 parked, 0 patch/row-flip, no added edges.

Candidate holders at the pin:
- Live: `docs/platform/agent-coordination/architecture/protocol-model.md`, `architecture/runtime-model.md`, `contracts/assignment-run-runresult.md`, `contracts/workflow-stage-operation.md`, and `verification/team-dispatch-v1/index.md`. Their headers read "Canonical for: The current subject ... not retired engine authority" or are evidence indexes.
- Carriage only: `history/retired-engine/files/roadmap/team-dispatch-v1/*` and `history/retired-engine/files/architecture/coordination-foundation-baseline.md`.

Outcome defects:
- **Canonical Outputs section, source L25-35**: "The stable outputs of this roadmap are maintained in: ..." and "They must not override the canonical outputs above". This is present-tense live navigation to canonical holders, not rollout history. The record applies the "rollout history / step history" framing to all of it, which is true only for the Steps list L15-21.
- **maps-j-00629** (L28 Protocol Model), **maps-j-00630** (L29 Runtime Model), **maps-j-00632** (L31 Assignment/Run/RunResult Contract), **maps-j-00633** (L32 Verification record): all `preserve`, but a live candidate holder exists for each.
  - Rule: L12-30(1) target resolution, and "same-kind edges get the same disposition" (L12-30(3)). The sibling maps-j-00631 (L30) is parked as description-rewrite against the live `workflow-stage-operation.md`, which already treats this section as live navigation.
  - Correction: change each to `patch`, Phase 9, to the exact live file listed above. The anchor is the nearest enclosing heading of the cited claim, which is the file H1 or the most specific heading. Add `descriptionTruth` for the "outputs of this roadmap" claim. For L32 check the label "Verification record" against the target index title "Team Dispatch V1 - Step 1-5 Audit Trace Index". Alternatively, give a record that justifies a different role for the whole Canonical Outputs section and applies it to 00631 as well.
- **maps-j-00628** (L27 Coordination Foundation Baseline), `preserve`.
  - The only candidate is carriage (`history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot`), and a source-snapshot candidate is not a patch target. The live `architecture/README.md` L45-46 says the baseline "preserves the earlier Step 00-08 baseline; it is not current runtime authority". That makes the source claim "stable outputs ... are maintained in Coordination Foundation Baseline" false for the new world.
  - Correction: `parked`, category `description-rewrite` (or `phase9-carry`), naming that smallest blocker, with a `searchWitness`. Not `preserve`.

Edges 00621-00627 (Steps list L15-21) are correctly preserved: they are links to sibling step files whose only candidates are carriage, framed by "step history". No changes.

Record-text notes:
- The preserve reason cites "delivered Step 00-08", but the source lists only Steps 00-06.
- The 00631 reason ends "spelling preserved as retired history/lineage where framed" although the edge is parked. That sentence contradicts the park.
- The 00631 park itself is correct (CTR012 "Workflow Step Operation" vs the source label "Workflow Stage Operation"; the candidate Lookup treats `stage.taskSpec` as history).

### 3. docs/platform/agent-coordination/history/retired-engine/files/proposals/README.md (batch-015, file 12 edges), verdict ok
Record digest `641542f2f68685579c498d1b2ec067dc056e46ea0b44782fc019ec212f3d1873`. 12 edges reviewed: 12 preserve, no added edges. The 4 coverage exclusions (L72, L75, L84, L88) are local candidate filenames in the same directory and are correct.

- The header is "Historical File ... exact historical carrier", so it is a retired-history carrier. The literal snapshot (L27-124) keeps the original bytes. Preserving the in-snapshot edges is correct: 06071 (L36 Provenance), 06072 (L65, migration status "preserves the proposal frontier from X"), 06073/06074 (L91-92), 06075 and 06077-06079 (L96-109 targets that never existed at the resolved path), 06076 (L99 `docs/architect/`).
- Related and Superseded-by lines: 06068 (L17), 06069 (L19) and the frame sentence 06070 (L23). These are header lineage. They are preserved consistently across all 14 retired-engine carriers in batch-015 (27 of 27 preserved), with successor notes (`docs/platform/runner/spec.md`, `decisions/h-aabefc85f0c9.md`).
- 06075/06077/06078/06079: relative paths `../../../architect/...` resolve from the carrier location to never-existing paths, and the reason says so. The real intended targets (`docs/architect/proposals/*`) exist. As history inside a literal snapshot this is acceptable.

Lead-judgment (no rework):
- Family-wide: "Superseded by: Current execution ownership in docs/specs/runner.md" and the frame sentence in L23 are candidate-added lines that name `docs/specs/runner.md` as current owner, and that tree retires at Phase 9. All 14 carriers preserve them with a successor note. The carrier header says "literal file bytes are unchanged", so preserving is defensible. If Phase 9 wants those lines to name `docs/platform/runner/spec.md`, a family-wide carry or description rule is needed, not a per-file one.
- Relative links inside the snapshot (L57 `../vision.md`, L60 `../intent-preservation-ledger.md`, L67 `../history/documentation-migration/proposal-status.md`) are not edges because the census does not flag them. They resolve to nonexistent paths under `retired-engine/files/`. They are history, so this is harmless.

### 4. docs/platform/documentation/operations/portals/docs-portal.md (batch-020), verdict ok
Record digest `001a90b4a3a001d513a0457394b4b8a69320ee2a4865b0b0561bd4d1da39a997`. 12 edges reviewed: 7 preserve, 5 row-flip (06817, 06820, 06821, 06823; see below), 0 patch/park, no added edges. Coverage list is empty and correct: the L28/L55 label `doc-governance.md` links to the candidate `docs/platform/governance.md`, so there is no legacy citation.

- 06817 (L31) and 06823 (L58): the rows say "Current legacy product/source map" and "legacy/current detailed source map". Both flip correctly with the same whole-row reason. 06820 and 06821 (L48, "legacy roots remain active until ...") are a whole Transitional Status paragraph and flip correctly.
- 06814 (L9 Provenance) and 06815 (L17 Related) are header lineage, preserved. 06816 and 06822 (`docs/reading-map.md`) are a retained root, preserved. 06819 (`docs/history`) is a retained root. 06824 and 06825 (L77-78) are inside the "Source Metadata (Added in candidate)" text block and are preserved lineage.

Lead-judgment (no rework):
- 06818 (L32). The row is "User docs | user/ target; existing how-to/... during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout". It is a migration-state row, yet only the retained-root token is preserved and there is no row flip. At the pin `docs/tutorials/` exists (`.gitkeep` only), so the source claim "not present" is literally true of content but not of the directory. The same row in `docs/README.md` (batch-033, edges 00009-00012) is preserved identically, so this is consistent. The question for the Lead is whether "migration-state rows take precedence" requires a row flip for this row. I left it as ok because the checker table for row flips says planned tutorials slots must not be represented as real directories, and a preserve does not do that.

### 5. docs/platform/system-architecture/architecture/roadmap.md (batch-028), verdict rework (confidence moderate; Lead may rule)
Record digest `b754ba350d11bb56d93912f42b3d1dec9fa2cef2d3e425fc0586f1a5f1517e8e`. 10 edges reviewed (8 inventory plus 2 author-added): 10 preserve, 0 patch/park/row-flip. Source read whole (about 285 lines). The header carries explicit whole-source carriage framing at L6 ("Preserve the complete roadmap.md source"), L10 ("Agent carriage"), and L23 ("Original source metadata, dates ... are provenance"). That framing is valid for all body units (07768-07772 and the two added edges).

Outcome defect:
- **maps-j-07766** (source L11, `Canonical for: Nothing until promotion; current source remains docs/architect/roadmap.md`), `preserve`.
  - L11 is candidate-added migration metadata, not original source text. It is a migration-state statement about which document is current. It becomes false the moment Phase 9 promotes the candidate and retires `docs/architect/roadmap.md`.
  - Rule: "migration-state rows take precedence" over carriage/provenance preservation (review request, semantic focus).
  - Correction: `phase9-row-flip`, whole header line, with a dependency on conservation/truth acceptance, preserving the old spelling as prior-source lineage. 07765 (L9 Provenance) and 07767 (L16 Related) remain preserved.
  - Note: the same L11 pattern appears in `workspace-topology-roadmap.md` (batch-028, maps-j-07780, not assigned to me). The Lead should check it for the same outcome.

Other edges are correct: 07768, 07770, 07771 (`docs/architect/` in original metadata and prose); 07769 and 07772 (`docs/specs/*` pattern, absent at the pin); the added L151C104 and L237C5 (`runtime-identity-and-activation.md`, preserved under whole-source carriage even though a live candidate exists at `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md`).

Record-text / coverage notes (no outcome effect, because everything would be preserved under carriage):
- The legacy scan added `runtime-identity-and-activation.md` (L151, L237) but not the other basenames of existing retiring files in the same file: L52-53 `proposals/step-09-...md` and `step-10-...md`, L55 `proposals/component-authority-boundary-map.md`, L57 `host-invocation-routing/node-to-rust-component-migration.md` and `rust-cli-and-proof-components-plan.md`. Those files exist under `docs/architect/` at the pin. The scan appears inconsistent about subpath forms. Lead may want to confirm the scanner rule covers `<subdir>/<name>.md`.

### 6. docs/architect/proposals/README.md (batch-008), verdict ok
Record digest `5a46dde7807e8ccbfac1dd8a3aae7045c9fc9c54cfdc4747b916d3212be42400`. 6 edges reviewed: 6 parked (all category `phase9-carry`, blocked and dependency categories equal), 0 patch/preserve/row-flip, no added edges.

- I checked every park against the pin. All five proposal candidates in `docs/platform/proposals/` (step-09, step-10, architecture-advisory-panel, coordination-capability-envelope, component-authority-boundary-map) carry "Implementation: Source snapshot retained" and "Canonical for: Nothing; non-canonical candidate conservation carrier", so they are carriage and not patch targets. The handoff prompt's candidate is `history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md`, which is also a source snapshot. The candidate collection index `docs/platform/proposals/README.md` states that its active list is historical source wording and that navigation owes a reviewed update.
- The hit-group categories are true: carriage for 01057, 01059, 01060 and 01062; partial-holder for 01058 and 01061, whose live hits are verification evidence and citations, not holders of the index entry.
- Description claim: "Active Proposals" with step-09 is stale (the live group-thinking guidance uses Workflows and presets), which supports parking rather than patching.

Record-text note: the park reasons say "Promote the exact cited subject/claim before redirecting" without naming the claim for each entry. The category and the successor note are enough to act on.

## Lead-judgment questions
1. `docs/tutorials` row (maps-j-06818, and the same row in `docs/README.md` batch-033): preserve versus row flip for a migration-state row that only names a retained root.
2. Team-dispatch roadmap: if the Lead decides the whole Canonical Outputs section is history, then 00631 (park) must also change; the current mix is inconsistent either way.
3. `Canonical for: Nothing until promotion; current source remains X` lines inside whole-source carriage headers (07766, and 07780 in `workspace-topology-roadmap.md`): rule once for the class.
4. Retired-engine carriers' "Superseded by / see docs/specs/runner.md" lines (family-wide): leave as preserved history or give them a carry rule.
5. Scanner coverage of subpath basename forms (see file 5 notes).

## Per-set counts (this part only)
| Set | Files reviewed | Rework | Which |
|---|---:|---:|---|
| batch-030 | 1 | 1 | work-state/README.md (07881, 07891) |
| batch-004 | 1 | 1 | team-dispatch-v1/README.md (00628, 00629, 00630, 00632, 00633) |
| batch-015 | 1 | 0 | |
| batch-020 | 1 | 0 | |
| batch-028 | 1 | 1 | system-architecture/architecture/roadmap.md (07766; Lead may rule) |
| batch-008 | 1 | 0 | |

Total: 6 files reviewed, 3 rework, 3 ok. Edges reviewed: 14 + 13 + 12 + 12 + 10 + 6 = 67.

These are outside-sample files, so they are advisory for A51 accounting. The Lead decides whether any set counts or expands.

Status: DONE_WITH_CONCERNS
