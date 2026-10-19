# Review A38 step-02h mapping part 39

- Reviewer: reviewer:sonnet-session:ab90207f97d65fc6d@2026-10-19
- Commits: author 6c415d7ce, accounting b3d2c2ebd (worktree HEAD verified b3d2c2ebd4be)
- Part: 39 of 105, population writers-and-writer-triage, 60 entries
- Method: every entry resolved from step-02h-census-maps-portals-prose.json via the index; each source line read, target existence checked from the committed tree, judged against L12-7, L12-10, L12-19..24.

## Totals

- ok: 54
- rework: 3
- needs-Lead-judgment: 3
- Non-ok ids: maps-h-01232, maps-h-01233, maps-h-01243, maps-h-01250, maps-h-01260, maps-h-01266

## Defect classes
- A (rework, 01232, 01233): live pointers inside the generated docs/backlog.md misclassified as preserve/provenance instead of generator class (Step 5). Same file's other rows are generator class, so the classification is inconsistent and the generated output would keep a pointer to a moved file.
- B (rework, 01266): bare `docs/specs` whole-root mention preserved instead of parked for Step 3 (L12-24 item 2).
- C (needs-Lead-judgment, 01243, 01250, 01260): self-references to retained docs/backlog.md inside the generated backlog parked as Step 5 retargeting; L12-23 says preserve. Conservative, no data loss.

## Entries

| Entry | Consumer:line | Reference | Action / rule | Verdict | Rationale |
|---|---|---|---|---|---|
| maps-h-01190 | `visibility-and-interactive-contact-herdr-spawn.md:516` | `docs/backlog.md:84` | preserve / retained-reference | ok | path:line citation to retained generated docs/backlog.md (prose notes it dangles); preserve is correct, no retarget. |
| maps-h-01195 | `roadmap.md:252` | `docs/architect/` | preserve-pending-target / legacy-tree-semantic | ok | Whole `docs/architect/` mention parked for Step 3 per L12-24(2). |
| maps-h-01196 | `roadmap.md:254` | `docs/specs/*` | preserve-pending-target / navigation | ok | `docs/specs/*` is a whole-tree statement; action preserve-pending-target/park is right (rule label says navigation instead of legacy-tree-semantic; wording only). |
| maps-h-01205 | `architecture-map.md:225` | `docs/specs/` | preserve-pending-target / legacy-tree-semantic | ok | Whole `docs/specs/` tree mention parked for Step 3 per L12-24(2). |
| maps-h-01207 | `architecture-map.md:363` | `docs/io-contract.md` | cutover-patch-only / navigation | ok | CTR001 table cell reader reference; unique mapping to cli-io-contract.md (exists at the input commit); Phase 9 whole-unit patch with Step 3 gate. |
| maps-h-01210 | `architecture-map.md:459` | `docs/architecture-manifest.json` | preserve / retained-reference | ok | Retained docs/architecture-manifest.json; preserve. |
| maps-h-01232 | `backlog.md:21` | `docs/coexistence.md` | preserve / provenance | rework [A] | "Related doctrine: docs/coexistence.md" is a live pointer inside a generated backlog row, not a source locator; consumer is generated from .bee/backlog.jsonl and the target moves to docs/platform/coexistence/spec.md, so it belongs in generator class (preserve-pending-behavioral-proof, Step 5), not preserve/provenance. Sibling generated-backlog rows are all generator class. |
| maps-h-01233 | `backlog.md:21` | `docs/coexistence.md` | preserve / provenance | rework [A] | Second occurrence in the same row ("docs/coexistence.md Known Gaps updated" is a to-do in the item text); same defect as 01232. |
| maps-h-01234 | `backlog.md:24` | `docs/specs/distribution.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01236 | `backlog.md:39` | `repo/docs/specs/work-state.md:647-675` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01242 | `backlog.md:54` | `docs/platform-foundations.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01243 | `backlog.md:102` | `docs/backlog.md` | preserve-pending-behavioral-proof / generated | needs-Lead-judgment [C] | Self-reference to retained docs/backlog.md (L12-23: retained root files are their own targets, preserve) yet parked as generator/"Step 5 retargeting" although nothing is ever retargeted. Conservative direction; Lead to decide whether generator-consumer precedence over retained-self-target is intended. |
| maps-h-01244 | `backlog.md:102` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01245 | `backlog.md:107` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01246 | `backlog.md:108` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01247 | `backlog.md:109` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01248 | `backlog.md:110` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01249 | `backlog.md:111` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01250 | `backlog.md:111` | `docs/backlog.md` | preserve-pending-behavioral-proof / generated | needs-Lead-judgment [C] | Same as 01243 (self-reference to retained docs/backlog.md in generated consumer). |
| maps-h-01251 | `backlog.md:111` | `docs/specs/*.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01252 | `backlog.md:111` | `docs/architecture-map.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01254 | `backlog.md:111` | `docs/id-systems-audit.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01260 | `backlog.md:115` | `docs/backlog.md` | preserve-pending-behavioral-proof / generated | needs-Lead-judgment [C] | Same as 01243 (self-reference to retained docs/backlog.md in generated consumer). |
| maps-h-01262 | `backlog.md:118` | `docs/specs/` | preserve / provenance | ok | Describes bee output tree ("bee ... output spec hien trang docs/specs/"); preserve is correct (label provenance vs external-project is wording). |
| maps-h-01266 | `backlog.md:125` | `docs/specs` | preserve / provenance | rework [B] | Bare `docs/specs` in prose about fgOS artifacts ("ticket/docs/specs không cập nhật... Áp cho fgOS") is a whole-root statement about the legacy tree; L12-24(2) requires parking for Step 3 (and it sits in a generated file), not preserve/provenance. |
| maps-h-01271 | `coexistence.md:31` | `docs/specs/runner.md` | cutover-patch-only / navigation | ok | "spec: docs/specs/runner.md" is plain navigation; README patch is valid (target exists), Phase 9 only. |
| maps-h-01272 | `coexistence.md:48` | `docs/specs/runner.md` | cutover-patch-only / navigation | ok | Same as 01271. |
| maps-h-01296 | `index.md:18` | `docs/specs/platform-foundations.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01297 | `index.md:19` | `docs/specs/platform-foundations.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01298 | `index.md:20` | `docs/specs/platform-foundations.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01299 | `index.md:26` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01300 | `index.md:27` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01301 | `index.md:28` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01302 | `index.md:29` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01303 | `index.md:30` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01304 | `index.md:31` | `docs/specs/runner.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01316 | `index.md:48` | `docs/specs/system-overview.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01323 | `index.md:55` | `docs/specs/work-state.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01324 | `index.md:56` | `docs/specs/work-state.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01325 | `index.md:57` | `docs/specs/work-state.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01326 | `index.md:58` | `docs/specs/work-state.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01327 | `index.md:59` | `docs/specs/work-state.md` | preserve-pending-behavioral-proof / generated | ok | Generated file (decision-index/backlog); Step 5 generator source owns retargeting, never hand patched. Correct. |
| maps-h-01331 | `herdr-vs-tmux-observation.md:142` | `repo/docs/backlog.md` | preserve / external-project | ok | `repo/docs/backlog.md` P46/P48 in a distillery deep-dive; target retained, distillery is preserved per L12-21; no patch needed. |
| maps-h-01332 | `parallel-decomposition-and-merge.md:46` | `docs/specs/work-state.md` | preserve / external-project | ok | fgOS spec cited with "dong ~1022" inside a distillery deep-dive; L12-21 settled distillery reports as preserved (rule text "upstream" is inexact here, action is as settled). |
| maps-h-01335 | `state.md:37` | `docs/specs/` | preserve / external-project | ok | Describes bee docs/specs state layer; preserve. |
| maps-h-01343 | `distill-bee-inventory-2026-07-18.md:47` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01345 | `distill-bee-inventory-2026-07-18.md:145` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01354 | `distill-bee-inventory-2026-07-28-group-a.md:45` | `docs/specs/` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01355 | `distill-bee-inventory-2026-07-28-group-a.md:45` | `docs/specs/<area>.md#R7` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01356 | `distill-bee-inventory-2026-07-28-group-a.md:45` | `docs/specs/` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01357 | `distill-bee-inventory-2026-07-28-group-a.md:45` | `docs/specs/reading-map.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01358 | `distill-bee-inventory-2026-07-28-group-a.md:46` | `docs/specs/<area>.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01359 | `distill-bee-inventory-2026-07-28-group-a.md:50` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01366 | `distill-bee-inventory-2026-07-28-group-a.md:168` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01367 | `distill-bee-inventory-2026-07-28-group-a.md:170` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01369 | `distill-bee-inventory-2026-07-28-group-a.md:175` | `docs/backlog.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01372 | `distill-bee-inventory-2026-07-28-group-a.md:247` | `docs/specs/` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01373 | `distill-bee-inventory-2026-07-28-group-a.md:247` | `docs/specs/<area>.md#R7` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01374 | `distill-bee-inventory-2026-07-28-group-a.md:247` | `docs/specs/<area>.md` | preserve / external-project | ok | bee/beehive/distillery upstream citation (L12-10/L12-21) naming a path that is not an fgOS retiring-root reference; preserve is correct. |
| maps-h-01378 | `distill-bee-inventory-2026-07-28-group-a.md:260` | `docs/history/<feature>/plan.md` | preserve / retained-history | ok | Template-shaped docs/history/<feature>/plan.md; retained history, L12-10. |
