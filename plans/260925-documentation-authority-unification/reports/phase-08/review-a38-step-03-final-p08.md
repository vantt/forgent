# Step 3 final review, part p08

Reviewer: independent read-only semantic review. Author pin ae141550c. No checker or probe was run. I read the records by field extraction only.

## Verdicts

| File | Set | Stratum | Edges reviewed | Verdict |
|---|---|---|---|---|
| `docs/platform/runner/decisions/h-36d872fbb0e5.md` | batch-115 | targeted (disposition/target/anchor/diff changed) | 71 of 71 (68 inventory + 3 author-added) | ok |
| `docs/platform/runner/operations/h-51f5cd7279fd.md` | batch-115 | targeted (record-text/coverage correction) | 4 of 4 (3 inventory + 1 author-added) | ok |

Per-set and per-stratum counts for batch-115, part p08: 2 files reviewed, 2 ok, 0 rework. The 75 edges were all reviewed, with 0 outcome defects.

## File 1: runner/decisions/h-36d872fbb0e5.md (1769 lines, read in full)

**Diff.** The only hunk is the `Related:` list at line 18, `docs/specs/runner.md` to `docs/platform/runner/spec.md`. It applies cleanly.
- The `Related` list is wrapper metadata above the carriage body. Per L12-34(4) and L12-52(2), a surviving-tree entry patches to its exact live holder.
- The target is a different file from the consumer, and it is not already listed. It is therefore not a self or duplicate park, unlike the 07786 case.
- Line 10 (`Provenance:`, 07616) preserves, per L12-47 and L12-34(4). Provenance and Related keep separate roles, and the record says so.
- The target blob exists at the pin.
- The patch asserts no section, count or default. The whole-file anchor (null) is justified, since the entry is a whole-area navigation item.

**Preserve edges.** Every other edge preserves, correctly. The region is a verbatim "Các ADR dưới đây được di dời nguyên văn" decisions-history account, so it is history class under L12-38, L12-40 and L12-26(5).

- Edges 07622, 07652, 07659, 07660 and 07680 cite `docs/specs/runner.md` or `docs/specs/distribution.md` inside narrated decision bodies. Each preserves with a successor note naming the live holder. This is consistent with L12-26(5) and L12-51 ruling 3. The live-citation patch rule of 04982 does not apply, because this is a history file and not a live knowledge file.
- Retained roots preserve literally:
  - `docs/platform-foundations.md`: 07626, 07642, 07655.
  - `docs/routing-handoff-contract.md`: 07678, 07679.
  - `docs/decisions/` directory forms.
  - `docs/history/*`, `docs/how-to/*` and `docs/distillery/**`.
  - `docs/architecture-manifest.json`.
  - `docs/reference` and `docs/explanation`.
- Renamed explanation files (07632, 07656, 07657, 07665, 07666) keep the original spelling and carry a title-matched successor note into `docs/knowledge/**`.
- 07646 (removed how-to) has no successor, and the record says so truthfully.
- 07638, 07645 and 07647 (removed `0000-index.md`) each carry the L12-54 note that `docs/decisions/index.md` is the generated successor projection.
- The illustrative globs and placeholders (07633 to 07635, 07648, 07658, 07664, 07671, 07682) preserve with no existence claim.

**L12-52(1) internal-correspondence edges.** There are ten: 07625, 07628, 07636, 07640, 07641, 07644, 07649, 07650, 07651 and 07667. All ten:
- preserve with no successor-note requirement;
- carry a non-executable note naming the consumer heading, with no self-link;
- cite headings whose line numbers I verified against the source: 0021 at L211, 0025 at L511, 0026 at L583, 0028 at L757, 0029 at L819, 0030 at L921;
- have titles that correspond to the cited decision number.

The 07636 and 07637 wrapped spans (L809/810, L823/824) join correctly.

**Added edges.** The three author-added edges are correct:
- `author-wave5g-...-L23C363` and `author-wave5g-...-L23C911` cover the two `runner.md:<line>` mentions on line 23. They preserve as source-locator evidence under the explicit "Added in candidate" framing (L12-40 and L12-51(1)).
- `author-final-L112C2-batch-115` covers the elided `specs/runner.md:26` on line 112. This is the L12-53/54 line-112 locator. It preserves as past worktree evidence.
- The line-23 `docs/specs/confinement-authority.md` mention is edge 07618. It preserves with the successor note `agent-confinement/spec.md`.

**Missed-reference scan.** I scanned the whole source for `docs/`, `specs/`, `architect/`, `decisions`, `how-to`, `explanation`, `distillery`, `backlog`, `reading-map`, `.md`, `../` and `./`. Every uncovered hit is one of:
- a non-legacy code, test or skill path;
- a candidate-tree path (`docs/platform/...`);
- a bare basename in history (`porting-log.md` at L194 and L245, which is retained root and exempt per L12-53);
- the label of an already-successor link (L1561, destination `../../agent-confinement/spec.md`, which resolves to `docs/platform/agent-confinement/spec.md`).

I found no missed legacy path edge.

## File 2: runner/operations/h-51f5cd7279fd.md (845 lines, read header, edge regions and legacy scan)

**Diff.** The only hunk is `Related: docs/specs/runner.md` to `docs/platform/runner/spec.md`. This is the same rule and the same live holder as file 1, so the two files are consistent.

**Edges.**
- 07689 (L10 Provenance) preserves.
- 07690 (L18 Related) patches at Phase 9, as in file 1.
- 07691 (L330, `docs/history/pr-lifecycle/reports/validation-s1-gate.md`) preserves. The path never existed (targetFacts "never-existed"). It is spike-evidence citation inside a verbatim carrier, which is exactly the L12-53 07691 ruling. The reason quotes the actual full source unit.
- The author-added L23C302 edge preserves the `runner.md:<line>` locator in the framing note.

**Missed-reference scan.** The only other legacy-shaped tokens are `CONTEXT.md` and `SKILL.md` (not retiring), and a bare `0032` (a decision number without a path, so not an edge under L12-49). I found nothing missed.

## Record-text notes (not rework)

1. 07681 (`docs/{platform,architect}/agent-coordination`) and the L112 added edge carry no "Non-executable successor note", although sibling preserves of retiring `docs/specs/*` or `docs/architect/*` paths do.
   - 07681 names a brace form whose `platform` half survives.
   - The L112 edge is an elided locator.
   - The checker accepted both. Adding "docs/platform/agent-coordination" and "docs/platform/runner/spec.md" as notes would only make the text consistent.
2. The 07645 reason and the 07647 reason are long. Each repeats the full source unit quote. This is cosmetic only.

## Lead-judgment questions

1. Line 1084 has a bare `0000-index.md` basename in the Consequences of 0031. It back-references the full-path mention at L1047, which is edge 07645. I left it as exempt under L12-38(5) and L12-54(4), because it is a bare name in a decisions-history carrier. L12-39(7) says deleted `00NN-*.md` basenames in live text join the scanner. If the Lead reads that rule to cover history regions too, one preserve edge is missing here. I judged no outcome defect, since the full-path sibling is covered and the region is history.

## Counts

- Outcome defects: 0.
- Rework files: 0 of 2.
- Edges with wrong disposition, target or anchor: 0 of 75.
- False adjacent descriptions: 0 (the only patches are two bare Related entries with no adjacent claim).
- Missed references: 0 (one borderline question above).
