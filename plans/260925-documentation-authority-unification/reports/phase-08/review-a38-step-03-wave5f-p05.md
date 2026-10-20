# Wave 5f part 05 review

Reviewer: read-only semantic review. Author pin ae141550c2e022310de7a0efea757580c0b2479f. Worktree 0d1fb3bff. No checker or probe was run.

## File

- Path: `docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md`
- Set: batch-113. Stratum: mandatory-threshold (also at least 40 edges, source over 65 KB; not in either seeded stratum).
- Verdict: **ok**.
- Edges reviewed: 22 of 22.
  - 17 inventory edges: maps-j-07563 to 07579.
  - 5 author-added edges: L34C10, L35C1, L36C1, L37C1, L39C1.
- Source: all 598 lines read (69,137 bytes), in 5 chunks.
- Record digest: `63b6988127e494a845e7ce09d64fc584f802221b61b2089cb78ee2c5f27ca858`. It equals inventoryFileDigest. inventoryInputCommit is 1a0f61ac5. authorInputCommit is the pin.
- Diff hash: the diff is the empty string. There are no patches and no row flips.

## Edge verdicts

Dispositions: 21 preserve, 1 parked.

| Edge | Source line | Disposition | Verdict |
|---|---|---|---|
| 07563 | L9 | preserve | ok. Provenance lineage line, per L12-47 and L12-51(1). The path exists at the pin. |
| 07564 | L17 | parked, description-rewrite | ok. This is the wrapper's Related header, above the body start. The entry names the consumer's own retiring source identity. The same park is used on all 12 sibling proposals in batch-113 (07445, 07466 and others). It matches L12-34(4) (self Related parks) and L12-52(2). The Provenance line is kept separately by 07563. |
| 07565 | L22 | preserve | ok. It is an evidence citation, "cited by docs/specs/runner.md:1008 RUL40" (L12-51(1)). |
| 07566 | L24 | preserve | ok. It is the Source relationship link, a provenance line (L12-47). |
| 07567 | L38 | preserve | ok. The body Related link to the retained `docs/explanation/...`. It resolves the same way from both coordinate bases. |
| 07568, 07569 | L115, L117 | preserve | ok. Evidence citations to `docs/history/*/RESEARCH.md` in the failure-mode table. |
| 07570, 07575 | L137, L540 | preserve | ok. Dated citations of `docs/specs/runner.md` RUL40. They are past or dated text, and the doc says RUL40 was re-scoped on 2026-09-06. |
| 07571 | L505 | preserve | ok. A probe-script directory, stated as a planned location. |
| 07572 | L517 | preserve | ok. A link inside a struck-through finding row. |
| 07573, 07574 | L524 | preserve | ok. A duplicate inventory pair for the same brace span. Both are preserved identically. |
| 07576 | L540 | preserve | ok. `docs/backlog.md:84` is a retained root with a dated locator ("dangling citation"). |
| 07577 | L540 | preserve | ok. The glob `docs/history/*/CONTEXT.md`. |
| 07578, 07579 | L546, L547 | preserve | ok. Retained `docs/explanation` and `docs/distillery` paths in the dated update list. |
| L34C10, L35C1 | L34, L35 | preserve | ok. Related links in the body, inside carriage (L12-34(4): Related inside carriage is not rewritten). Resolved under both the wrapper and the original-source coordinates (L12-35(6)). |
| L36C1, L37C1 | L36, L37 | preserve | ok. Same as above. |
| L39C1 | L39 | preserve | ok. The "(superseded)" history link, inside carriage. |

## Missed-reference check

I scanned the whole source for retiring-tree forms: `docs/specs`, `docs/architect`, `specs/`, `architect/`, `../` links, decision basenames, and `.md` names.

- Every path or link occurrence maps to an edge.
- 12 bare-basename tokens are excluded in the record with L12-38(5) wording: `dispatch-control-plane-redesign.md`, `visibility-and-herdr.md`, `dispatch-control-plane.md`, `coordination-dispatch-contract.md`, `coordination-worker-provider-boundary.md`, and `runner.md`. They are bare names inside carriage, and the exclusions are correct.
- Bare decision ids (`D d3dbe7f5`, ADR0020, ADR-010) are not edges (L12-49).
- I found no missed edge.

## Outcome defects

None. 0 of 22 edges need rework.

## Record-text notes (not rework)

1. The reasons on 07565 (L22) and 07566 (L24) say "inside literal carriage".
   - L22 and L24 are candidate-wrapper text above the body start. The body starts at L28.
   - The checker treats L22 as the carriage start, because "Original source metadata and text follow" is in that line.
   - Under L12-52(2), wrapper metadata above the marker is live wrapper text.
   - The disposition (preserve) is right either way. Both lines are evidence or provenance citations, so L12-47 and L12-51(1) already require preserve.
   - The reason would be more accurate if it cited those rules instead of carriage. A rewording is optional.
2. The 07564 park uses category `description-rewrite` for what L12-34(4) calls a duplicate. The enum has no duplicate value, and the same category is used on all sibling files. This is consistent.
3. The 07564 witness hit group is categorised `citation-only`. Its live hit is the consumer's own Related line, so a self-hit category would be more exact. The enum has none, so this is acceptable.

## Lead-judgment questions

None blocking.

## Counts

- Set batch-113, mandatory-threshold stratum: reviewed 1, rework 0.
- This part reviewed 1 file, 22 edges, 0 rework.
- The file is in the mandatory stratum only. There is no overlap with the unpatched-seeded or patched-seeded strata.

Status: DONE
Summary: The single assigned file (22 edges, no diff) is verdict ok, with 0 outcome defects and 0 missed references. There are 3 optional record-text notes.
