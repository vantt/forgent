# Review a38 step-03 wave3 expansion, Part 02

Pin: `ae141550c2e022310de7a0efea757580c0b2479f` (author input commit; worktree `/home/vantt/projects/forgentX-s8-review` detached at 5a4ca0621). Read-only; no checker or probe script run.

## Method

- Rules read: the request file, progress.md authoring-rules digest, owner-answers L12-17, L12-26, L12-30..L12-38.
- Record: `step-03-records/batch-041.jsonl`, line with `file == docs/specs/work-state.md`. Loaded with python3. Per edge I printed edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blockedReason/blockedCategory, dependency/dependencyCategory and unitDispositionReason. I also printed the diff, authoringRules, and the coverage/anchors/relativeResolution/labelForm checks (legacyScan candidates counted, not dumped).
- Source: `git show <pin>:docs/specs/work-state.md` is 2,352 lines / 327,843 bytes, over the 60 KB threshold.
  - Read as an outline: all H1/H2 headings, with the retired-decision region starting at L1364 (`## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)`) and running to EOF.
  - Every edge region read in context (all 39 edges, with wrapped continuations at L692-693 and L2115-2116).
  - Whole-file independent scan for missed references: every `docs/...` path, Markdown link `](...)`, `specs/` and `architect/` partial roots, bare `*.md` basenames, relative `./` and `../` forms, `--specs-dir` and `--decisions-dir`. Each hit was compared with the record's edges.
- Target and fact checks at the pin:
  - Existence of every preserved retained target.
  - `git log` ancestry for the never-existing targets: `docs/history/install-coexistence/...canary-run.md`, `docs/history/store-atomic-rmw/`, `docs/history/p50-workflow-induct/`, `docs/how-to/x.md`, `docs/specs/0012-typed-edge-...md`. All have empty history.
  - Rename commit `126a8ae51` is an ancestor of the pin and moves `docs/reference/triage-table-columns.md` to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`.
  - `docs/platform/decision-citation-drift/spec.md` (the 08355 patch target) read against the adjacent description.
  - `docs/doc-registry.json` aliases checked for every preserved or parked target.

## File verdict

| Path | Set | Stratum | Verdict | Edges reviewed |
|---|---|---|---|---:|
| `docs/specs/work-state.md` | batch-041 | Part-A-outcome-change | **ok** | 39 (36 inventory + 3 author-added) |

Edge breakdown: 35 preserve (32 inventory + 3 added), 3 parked, 1 patch. The record is a whole-file full-record fallback, and L12-34(2) permits it for this file: the RUL10 passage carries under L12-17 and no retiresWithTree waiver is claimed. The diff is one hunk, at L1362.

## Edge-by-edge outcome check

- **Live region, before L1364.**
  - 08339, 08345, 08346, 08348, 08352 (`docs/coexistence.md`) preserve. The path exists, has no alias, and is retained.
  - 08340 (`docs/history/<feature>/`) preserves as a pattern placeholder. 08341 (`docs/history/p50-workflow-induct/`) and 08342 (`docs/how-to/x.md`) preserve as illustrative examples; both never existed, and L12-30(4,5) applies.
  - 08343, 08347 (`docs/history/...` CONTEXT.md files) exist, so preserve is correct.
  - 08344 (`docs/distillery/deep-dives/tool-registry.md`) exists and is retained.
  - 08349 (`.../install-coexistence/reports/canary-run.md`) parks as dead-link, in a live present-tense pointer.
    - The path never existed in ancestry, and no name-drifted holder exists.
    - It is distinct from the sibling 08348 preserve in the same unit; mixed disposition is covered by a unitDispositionReason that cites the edge id and matchedExpression.
    - 08349 park against 08351 preserve was settled in L12-31(8).
  - 08350 (`docs/decisions/` at L1329) preserves. The directory exists (index only), and no alias applies to the directory form.
  - 08351 (`store-atomic-rmw`) preserves under the quoted "Đã đóng" past-action marker, as in L12-31(3).
  - 08353 (`docs/specs/*.md`) and 08354 (`docs/specs/`) at L1362 park as step5-parity. They are scan-scope sentences, which L12-26(9) classes as behavioral Step 5. blockedCategory equals dependencyCategory.
  - 08355 patches `docs/specs/decision-citation-drift.md` to `docs/platform/decision-citation-drift/spec.md` (exists at the pin, timing Phase 9).
    - Description truth compared with the target: manual-run-only, scan scope `docs/backlog.md` + `docs/specs/*.md`, and CI not wired all match.
    - Whole-file anchor is justified, because the claim spans entry points, scope, access and open-gap sections.
    - Unit item-L1362 mixes patch and park. The distinct claim is that the citation is a prose pointer while its siblings are runtime-scope strings, which is true.
- **Retired-decision region, L1364 to EOF** (verbatim history, L12-38(4), not an alias case).
  - 08356, 08357, 08363, 08373 (`docs/decisions/`), 08359 (`docs/architecture-map.md`), 08365, 08369, 08370, 08371, 08374 (`docs/history/...`), 08366 (`docs/platform-foundations.md`) and 08372 (`docs/architecture-manifest.json`) preserve. Targets exist at the pin and are retained, and each reason quotes the region framing sentence.
  - 08358 (`[0012](0012-typed-edge-...md)`) preserves.
    - The resolved source coordinate `docs/specs/0012-...md` never existed. The original `docs/decisions/0012-...md` was deleted at `4722361ae`.
    - The reason says "broken by relocation into verbatim history", per L12-26(10).
    - A narrative-holder successor note is present, per L12-38(3).
  - 08360, 08361, 08362, 08364 (`docs/specs/work-state.md` self-references, one with `:886`) preserve as retired-history self-reference. The successor note `docs/platform/work-state/spec.md` is real, and no self-path note is used.
  - 08367 (`docs/reference/triage-table-columns.md:18`) and 08368 (same path, L2107) preserve under L12-38(4). The rename commit and the successor note are correct, and the 7-versus-10 status comparison is point-in-time history.
- **Author-added edges.**
  - `author-r3-...L1642C58` (`work-state.md:703`), `...L1891C21` and `...L1894C28` (bare `work-state.md`) are self-references inside the history region, preserved with a successor note.
  - Under L12-38(5) bare basenames are exempt, so these edges are extra rather than required. They are harmless and true.
- **Missed-reference scan.** None found.
  - Hits outside the edge set are retained-root or non-legacy: `docs/enduser-docs-index.json` (L36, L1098), `docs/platform/event-store/spec.md` and `docs/platform/holder-lock/spec.md` (L1200-1201, candidate live targets inside the RUL10 passage), plans/reports and scripts paths, and bare retained basenames (`work-item-management.md`, `beads.md`, `id-systems-audit.md`, `work-item-lifecycle-vision.md`, `critical-patterns.md`).
  - `docs/<quadrant>/` at L1233 is the quadrant wording already carried to the Phase 9 step-10 semantic search (L12-38 carried note); no edge is needed.
  - The `docs/chore` and `docs/CONTEXT.md/memory` hits are not paths.

## OUTCOME defects

None.

## Record-text notes (not rework)

1. 08358 successor note names `docs/platform/work-state/decisions/retired-decision-history.md (ADR 0012 narrative)` without the anchor. The candidate file already carries `#8-adr-0012-unified-typed-edge-graph-model` (L29 of that file), and L12-26(10) names that anchor.
2. The reasons of 08360-08364, 08367-08368 and the three added edges repeat the region quote and the successor note twice, or are very long. They are not false.
3. The unitDispositionReason for 08349, 08353 and 08354 is "Only this cited claim carries its named blocker: <reason>". That is a thin distinct-claim statement, but the distinction is true and visible in the passage.

## Lead-judgment questions

1. The file retires with `docs/specs/**`, and Phase 9 step 6 deletes it, so the 08355 patch is never applied to a surviving file. It is kept only because of the whole-file full-record fallback (L12-34(2)). Confirm this is intended, or whether the record should reduce to the RUL10 passage records at carry time. This is not an outcome defect under the current rules.
2. L1233 `docs/<quadrant>/` is carried, not an edge (L12-38 carried note). Confirm it stays on the Phase 9 step-10 list.

## Counts

| Set / stratum | Reviewed files (this part) | Rework |
|---|---:|---:|
| batch-041 / Part-A-outcome-change | 1 | 0 |
| batch-041 total (this part) | 1 | 0 |

Edges: 39 reviewed, 0 outcome defects. Batch-041's other three files are not in this part. No overlap with other parts.

Status: DONE
Summary: `docs/specs/work-state.md` (39 edges: 35 preserve, 3 parked, 1 patch) is ok with no outcome defects. The source was read as outline plus every edge region plus a whole-file reference scan, and targets, history and renames were verified at the pin.
