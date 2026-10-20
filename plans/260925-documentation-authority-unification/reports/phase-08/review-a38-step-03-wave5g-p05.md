# Review A38 - Step 3 wave 5g - Part 05

Reviewer: independent read-only semantic reviewer. Pin ae141550c; records at 9117e9cb6. No checker, probe or fgos CLI was run.

## File

- Path: `docs/platform/runner/decisions/h-36d872fbb0e5.md`
- Set: batch-115. Strata: patched-seeded, mandatory-threshold, open-lead-ruling-whole-file-supplement.
- Verdict: **ok**
- Edges reviewed: 70 of 70.
  - dispositions: 1 patch (07617), 59 preserve (incl. 2 author-added), 10 parked lead-ruling.
- Method: source is 182,676 bytes / 1,769 lines. I read the outline (all 40 headings) and every edge region (L1, 10, 18, 23, 39, 42, 112-113, 260, 441, 520-547, 744-790, 805-826, 893-920, 970-984, 1043-1127, 1140-1210, 1268-1352, 1369-1406, 1603-1606, 1636-1642, 1730-1735). Source-wide I ran my own scan (docs/ paths, `specs/`, `architect/`, `decisions/NNNN`, `*.md` tokens, Markdown link destinations). I compared every token with the 70 edge spans and the 9 recorded scan candidates.

## Outcome defects

None.

- 07617 (Related L18, `docs/specs/runner.md` to `docs/platform/runner/spec.md`, whole-file, Phase 9). The target exists, it is the live area owner, and the Related list holds no other entry. The consumer is not the holder, so this is not a self or duplicate park. No count, port, default or section claim sits next to the entry. Diff is exactly one line (L18).
- The 10 lead-ruling parks (07625, 07628, 07636, 07640, 07641, 07644, 07649, 07650, 07651, 07667) each name a deleted decision whose title-matched narrative heading is in this same file. I checked each deleted H1 at 4722361^ against the file headings: 0021 (L211), 0025 (L511), 0026 (L583), 0028 (L757), 0029 (L819), 0030 (L921). All match. Under Lead ruling (a) these are settled as preserve without a successor note, so I do not count them as defects.
- All other preserves are history, evidence, provenance or illustrative patterns inside the verbatim-relocated ADR account (L27 framing: "di dời nguyên văn"):
  - Retained paths: all exist at the pin, and I confirmed them at the worktree.
  - Renames: 07632 (c681f353 R081), 07657/07665 (c9d67f7a R099) and 07656/07666 (73f6477e) match the rename facts. Their successor notes point to existing `docs/knowledge/...` files.
  - Removals: 07646 (270aa5ad, deleted with no rename) and the 0000-index edges (4722361) are correct removal facts.
  - Illustrative globs and placeholders: 07633, 07634, 07635, 07648, 07658, 07664, 07671, 07682.
  - Successor notes: no note is self-referential, and `docs/platform/runner/spec.md`, `agent-confinement/spec.md` and `packaging-distribution/spec.md` exist. RUL13 is in the packaging spec, so the 07680 note is sound.
- The L23 correction-note edges (07618, author-added 3C363 and 3C911) are evidence of an earlier correction, not navigation (L12-51(1)). Preserve is right.
- The L1561 link `[confinement-authority.md §13.1](../../agent-confinement/spec.md)` has a candidate-native destination that resolves to a live file. The stale label is preserved text from the earlier link-only rebase, and the legacy scan excludes it. No action.

## Record-text notes (not rework)

- 07638, 07645 and 07647 (`docs/decisions/0000-index.md`, removed at 4722361): the reason says "no successor file". L12-51 record-text fixes ask to name `docs/decisions/index.md` (it exists, 64 lines) beside the removed `0000-index.md`.
- 07681: the expression is the brace form `docs/{platform,architect}/agent-coordination`. The reason and targetFacts name only `docs/architect/agent-coordination`. The `docs/platform` half exists and is live. Text only.
- The 10 lead-ruling edges are still recorded as `parked/lead-ruling`. When Lead closes ruling (a), flip them to preserve with no successor note, so the batch-115 lead-ruling count goes to 0 for this file.

## Lead-judgment questions

1. L112 `specs/runner.md:26` is a contextual exclusion, not an edge. The excluded-reason says the coordinates "do not resolve to a retiring legacy document", but it only lists relative readings (`docs/platform/runner/decisions/specs/runner.md` and similar). In context it denotes `docs/specs/runner.md` line 26. The same passage's `docs/distillery/porting-log.md:101` is an edge (07623). L12-32 called this same citation a missed reference in `runner.md`. L12-32(4) allows an exclusion and L12-38(5) exempts non-"explicit legacy-root" forms inside history carriage, so the checker passes it.
   - Options: (a) accept the exclusion and reword its reason to say it is a history-carriage partial-root citation; (b) add a preserve edge with successor note `docs/platform/runner/spec.md`.
   - My recommendation is (b) for consistency with the earlier precedent. Neither changes the diff or any disposition, so I did not mark the file rework.
2. Does Lead ruling (b) (a source-carriage wrapper's Related to its own source parks as duplicate, 07786) apply to 07617? The wrapper Provenance names `docs/specs/runner.md` as its source and Related repeats it. I read it as not applying: the live holder of runner.md is `runner/spec.md`, not this consumer (unlike 07786, where the holder is the carriage), and L12-34(4) says a retiring Related target patches to its live holder. Please confirm. If (b) does apply, 07617 becomes a duplicate park and the diff drops to empty.
3. Ruling (c): "Tham chiếu" lists and prose pointers to renamed `docs/explanation/*` paths (07632, 07656, 07657, 07665, 07666) are preserved as history with successor notes. The file frames the whole account as a verbatim relocation of immutable ADRs ("Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ"), so I accept this. A stricter reading (a live "Tham chiếu" pointer to a nonexistent path parks as a dead link) would flip those five. Please confirm the history reading for relocated ADR bodies.

## Counts

- batch-115 patched stratum, this file: reviewed 1, rework 0.
- Mandatory-threshold: reviewed 1, rework 0.
- Open-lead-ruling supplement: reviewed 1, rework 0.
- Edges: reviewed 70, outcome defects 0.
- The file is selected under all three inclusion reasons but is one file. It counts once in batch-115 as 1 reviewed, 0 rework, with no breach.

Status: DONE
Summary: Reviewed all 70 edges of the batch-115 runner decisions carriage file against the whole source and committed targets, with no outcome defects. Lead-judgment questions remain on the L112 `specs/runner.md:26` exclusion, ruling (b) for 07617, and ruling (c) for the renamed "Tham chiếu" pointers.
