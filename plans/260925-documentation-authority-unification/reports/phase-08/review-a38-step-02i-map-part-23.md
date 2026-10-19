# Review A38 step-02i mapping part 23

- Reviewer: `reviewer:sonnet-session:a8f057fa22a4f6fcf@2026-10-19`
- Commits: reviewed tree `74e3ecf1e` (accounting), author `904d0fb5c`; worktree verified detached at `74e3ecf1eb9a2bc1429f50a25bb7017e240ef798`
- Part 23: population `distinct-mappings`, 31 entries, sourceTable `step-02i-distinct-mappings.json`
- Method: every entry resolved through the sourceTable; old source line and context read from `git show HEAD:<consumer>`; physical spans mechanically compared with the committed bytes for all 99 edges (0 mismatches); targets/successors checked in the committed tree (`git ls-tree`); rules from L12-7, L12-10, L12-19..25.

| Entry | Legacy reference -> owner | Verdict | Evidence / reason |
|---|---|---|---|
| mapping-i-1321 | `docs/specs/work-state.md:647-675` -> `docs/platform/work-state/README.md` (1 edges; preserve-pending-behavioral-proof 1) | ok | generated backlog row (`repo/` prefix kept); generator-owned, parked for the Step 5 generator source; line-range with no anchor stays unpatched. ok |
| mapping-i-1322 | `docs/specs/work-state.md:886` -> `docs/platform/work-state/README.md` (2 edges; preserve-pending-target 2) | ok | line locator :886 no longer lands on the RUL11 text (line 886 is now RUL61 prose); no unique heading, parked for Step 3 anchor; second edge is inside the legacy spec itself so no patch may point there. ok |
| mapping-i-1323 | `docs/specs/work.md` -> `None` (2 edges; preserve-pending-target 2) | ok | `docs/specs/work.md, if present` never existed in git history (git log -S empty); conditional read-list item, no unique successor, parked Step 3. ok |
| mapping-i-1324 | `docs/specs/workflow-state.md` -> `None` (8 edges; preserve 8) | ok | 8 beehive.md `Where:` citations of the upstream bee repo spec; L12-10 external-project preserve. ok |
| mapping-i-1325 | `docs/specs/worktree-parallelism.md` -> `None` (2 edges; preserve 2) | ok | same upstream beehive citations (worktree-parallelism); preserve. ok |
| mapping-i-1326 | `docs/ui-spec` -> `docs/ui-spec` (6 edges; preserve 6) | ok | compiler CLI `--root <repo>/docs/ui-spec`; docs/ui-spec not retiring (L12-24 item 5); preserve. matchedExpression starts at `/docs/ui-spec` after the `<repo>` placeholder, no patch so harmless. ok |
| mapping-i-1327 | `docs/ui-spec/` -> `docs/ui-spec/` (5 edges; phase9-row-flip 1, preserve 4) | ok | 4 preserve (ui-spec self targets, docs/knowledge prose, candidate spec) + platform/README.md:63 migration-state cell -> Phase 9 row flip. ok |
| mapping-i-1328 | `docs/ui-spec/**` -> `docs/ui-spec/**` (2 edges; phase9-row-flip 2) | ok | both edges are switchboard status rows (`entry for docs/ui-spec/**`): row flip, no path substitution. Glob key has no tree target (missing-target is mechanical, glob; counted under the mechanical-target set). ok |
| mapping-i-1329 | `docs/ui-spec/00-overview.md` -> `docs/ui-spec/00-overview.md` (7 edges; phase9-row-flip 2, preserve 5) | ok | 2 switchboard rows flip; Provenance lines (sha-pinned) preserved; `Related:` entries and prose self-reference preserved. ok |
| mapping-i-1330 | `docs/ui-spec/15-system-events.md` -> `docs/ui-spec/15-system-events.md` (2 edges; preserve 2) | ok | Provenance sha pin preserve + Related self-reference preserve. ok |
| mapping-i-1331 | `docs/ui-spec/20-domain-rules.md` -> `docs/ui-spec/20-domain-rules.md` (2 edges; preserve 2) | ok | same pattern. ok |
| mapping-i-1332 | `docs/ui-spec/30-states-and-errors.md` -> `docs/ui-spec/30-states-and-errors.md` (3 edges; preserve 3) | ok | same pattern plus herdr dashboard prose. ok |
| mapping-i-1333 | `docs/ui-spec/components/C01-item-card.md` -> `docs/ui-spec/components/C01-item-card.md` (2 edges; preserve 2) | ok | same pattern. ok |
| mapping-i-1334 | `docs/ui-spec/flows/` -> `docs/ui-spec/flows/` (1 edges; preserve 1) | ok | prose pointer to docs/ui-spec/flows/, retained topology, preserve. ok |
| mapping-i-1335 | `docs/ui-spec/flows/F01-answer-a-parked-question.md` -> `docs/ui-spec/flows/F01-answer-a-parked-question.md` (2 edges; preserve 2) | ok | same pattern. ok |
| mapping-i-1336 | `docs/ui-spec/flows/F02-approve-a-merge.md` -> `docs/ui-spec/flows/F02-approve-a-merge.md` (2 edges; preserve 2) | ok | same pattern. ok |
| mapping-i-1337 | `docs/ui-spec/generated` -> `docs/ui-spec/generated` (1 edges; preserve 1) | ok | inside candidate note (truth-correction evidence list); preserve. ok |
| mapping-i-1338 | `docs/ui-spec/generated/` -> `docs/ui-spec/generated/` (2 edges; preserve 2) | ok | documentation-system-discussion (legacy twin preserve, history carriage twin verbatim-carriage preserve). ok |
| mapping-i-1339 | `docs/ui-spec/generated/*` -> `docs/ui-spec/generated/*` (6 edges; preserve 6) | ok | glob `docs/ui-spec/generated/*` inside discussion text, legacy + carriage twins both preserve; glob has no tree target (mechanical). ok |
| mapping-i-1340 | `docs/ui-spec/generated/**` -> `docs/ui-spec/generated/**` (1 edges; preserve 1) | ok | generated/README.md table cell naming the UI spec build tool output glob; ui-spec retained, preserve. ok |
| mapping-i-1341 | `docs/ui-spec/generated/coverage-report.md:1` -> `docs/ui-spec/generated/coverage-report.md` (1 edges; preserve 1) | ok | `coverage-report.md:1` evidence pin inside the truth-correction note; target exists; preserve, locator not dropped. ok |
| mapping-i-1342 | `docs/ui-spec/modals/M01-answer-question.md` -> `docs/ui-spec/modals/M01-answer-question.md` (2 edges; preserve 2) | ok | same provenance/self-reference pattern. ok |
| mapping-i-1343 | `docs/ui-spec/modals/M02-approve-merge.md` -> `docs/ui-spec/modals/M02-approve-merge.md` (2 edges; preserve 2) | ok | same. ok |
| mapping-i-1344 | `docs/ui-spec/modals/M03-add-edit-item.md` -> `docs/ui-spec/modals/M03-add-edit-item.md` (3 edges; preserve 3) | ok | same plus docs/knowledge prose pointing at the retained modal spec. ok |
| mapping-i-1345 | `docs/ui-spec/schema/surface-contract.schema.json` -> `docs/platform/ui-spec/history/schema/surface-contract.schema.json.md` (2 edges; preserve 2) | ok | compiler schema retained at docs/ui-spec (L12-21 item), action preserve is right. The owner field names the history sidecar (the consumer itself) and both edges carry the `self-reference-preserved` label although line 9 is a sha-pinned Provenance line and line 17 a Related entry; label/owner inconsistency with the sibling mappings (owner docs/ui-spec/...), cutover treatment unaffected. ok (wording/owner label only) |
| mapping-i-1346 | `docs/ui-spec/screens/S01-sign-in.md` -> `docs/ui-spec/screens/S01-sign-in.md` (2 edges; preserve 2) | ok | same provenance/self-reference pattern. ok |
| mapping-i-1347 | `docs/ui-spec/screens/S02-taskboard.md` -> `docs/ui-spec/screens/S02-taskboard.md` (2 edges; preserve 2) | ok | same. ok |
| mapping-i-1348 | `docs/ui-spec/screens/S03-task-detail.md` -> `docs/ui-spec/screens/S03-task-detail.md` (2 edges; preserve 2) | ok | same. ok |
| mapping-i-1349 | `docs/ui-spec/screens/S04-questions-needing-answer.md` -> `docs/ui-spec/screens/S04-questions-needing-answer.md` (2 edges; preserve 2) | ok | same. ok |
| mapping-i-1350 | `docs/ui-spec/spec.config.yaml` -> `docs/ui-spec/spec.config.yaml` (2 edges; preserve 2) | ok | config yaml retained at docs/ui-spec; provenance + self-reference preserved. ok |
| mapping-i-1351 | `docs/work-item-lifecycle-vision.md` -> `docs/platform/vision.md` (20 edges; cutover-patch-only 7, phase9-row-flip 11, preserve 2) | ok | 20 edges; the 4 relative links `../../work-item-lifecycle-vision.md` (depth verified from docs/architect/component-boundary/ and docs/architect/domainization/) patch the whole link unit to `../../platform/vision.md` with label text unchanged (label is prose, not path); work-state README:18, reading-map:134, specs/reading-map:14 patch the bare token to docs/platform/vision.md (consistent with sibling lines 131-140); 11 migration-state cells (switchboards, platform/README, work-state/README 62/75) row flip; vision.md:16/19 are self/Provenance pin, preserve. Target vision.md exists, unique per area-map root authorities ("split"). ok |

## Totals

31 entries (99 edges): ok 31, rework 0, needs-Lead-judgment 0. Rework rate 0%.

## Checks against the stated criteria

- Patched links: only mapping-i-1351 patches (7 edges). Each patch replaces the complete reference unit; link label is prose and unchanged; relative depth is correct; repo-qualified `repo/` and `<repo>` placeholder forms are not rewritten.
- Historical snapshot/errata: sha-pinned `Provenance:` lines, history carriage twin and verbatim-carriage rows are preserved, not patched.
- Wrapped references: none occur in this part.
- Pending rows (1321-1323): successor search found no unique target (work.md never existed; line-range locators have no unique heading; generated row belongs to the generator).

## Notes for Lead (none change a verdict)

1. mapping-i-1345 owner/label inconsistency (see row).
2. Bare filename mentions `work-item-lifecycle-vision.md` (no `docs/` prefix) exist in `docs/platform/work-state/spec.md:435`, `docs/specs/work-state.md:448` and generated `docs/backlog.md` lines 69/73/74. They are not path-token edges, so they are outside this packet's population; Step 3/5 may want to check them if the root file is retired.
3. `docs/ui-spec/**`, `docs/ui-spec/generated/*`, `/**` keys are globs with missing-target by construction; they are preserve or row-flip rows so no target is consumed.
