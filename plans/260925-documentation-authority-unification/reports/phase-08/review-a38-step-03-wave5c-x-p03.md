# Review a38 step-03 wave5c-expansion x-p03

Request: step-03-wave5c-expansion-review-request.md, part 03. Pin ae141550c. No checker or probe was run.

## docs/distillery/sources/beehive.md

- Set: batch-061. Stratum: L12-51-changed-file-targeted-re-review.
- Verdict: **ok**
- Edges reviewed: 68 of 68. All are `preserve`, timing none. The diff is empty, as it should be with no patches. The author-added edge list is empty. The only excluded scan hit is the `system-overview.md` token at L1062, a non-link token inside dated carriage, so the exclusion is valid.
- Reading: the file is 1394 lines / 188 KB. I read the header, the provenance and cursor blocks, and the context of every edge line. I also scanned the whole file for docs/, specs/, decisions/ and *.md tokens that no edge covers. The remaining hits are upstream bee/beegog names (SKILL.md, AGENTS.md, docs/NN-*.md of upstream, docs/knowledge/ of upstream, `docs/**` globs) and are not legacy-root references.
- Dispositions checked:
  - 01802-01803, 01808-01863 and the other upstream-coordinate edges are bee/beegog upstream citations (L12-10). They sit inside dated extraction and cursor sections, so preserve is correct. They include `docs/specs/<area>.md#R7`, `docs/decisions/`, `docs/decisions/index.md` as upstream's own recall index (L722, L734) and `docs/backlog.md`.
  - 01804-01807 (L38-39) name the four fgOS distillery reports. All exist at the pin and are retained paths, so they stay literal.
  - 01841 (L736) is a dated fgOS-side observation about the old hand-maintained `docs/decisions/0000-index.md`. The record cites the removal commit 4722361ae and names the generated `docs/decisions/index.md` as a record-only successor, which is the L12-51 fix. Preserve is correct.
  - 01845 (L910) names `docs/history/fgos-coding-shaping/CONTEXT.md`. It exists at the pin and is retained, and no other record patches it.
  - 01863 (L1123) is the `./repo` topology token. It is not a docs path, and the record says so.
- Outcome defects: none.
- Record-text notes: none that matter.
- Lead-judgment questions: none.

## docs/knowledge/decisions-index/decision-record.md

- Set: batch-070. Stratum: L12-51-changed-file-targeted-re-review.
- Verdict: **ok**. There is one record-text inconsistency, listed below as not rework, and one question for the Lead.
- Edges reviewed: 75 of 75. All are `preserve`, timing none, diff empty, no author-added edges, no legacy-scan candidates. The source is 51 lines and I read it whole.
- Dispositions checked:
  - The file is a frozen copy of the generated decisions index. It was renamed from docs/decisions/index.md at 4ee0e3a3c, and `src/report/decision-index.mjs` writes only docs/decisions/index.md. So the "no generator owns this snapshot" claim in the records is true. The rows narrate relocations in the past tense, so history preserve is right for every edge.
  - Every `docs/specs/*` edge (04156-04222) is a retained-at-pin path with the "tree retires at Phase 9" suffix. That is correct because the paths are under docs/specs.
  - The `docs/architecture-map.md` edges (04149, 04150, 04152, 04154) have no retires suffix. That is correct under the L12-51 suffix fix, since the file is outside docs/specs and docs/architect.
  - The removed ADR basenames each point at the real removal commit. Commit 4722361ae applies to most. Commit 4270c0c0d applies to 0034 and 0035, which landed later (the 0035 and 0034 removal commit is 4270c0c0d).
  - 04163 and 04164 handle the elided `docs/decisions/0035` correctly. They name the real 0035 file (mission boundary). They also say that runner 0035 (mutation-gate) is a numeric collision, not a successor, which follows L12-39(1).
  - 04205 (0004) carries the file-level note to `retired-decision-history.md` with the title-matched passage "4. ADR 0004 Scope And Non-Goals". The heading exists at line 89 and the record says it is an English/Vietnamese correspondence, as L12-51 requires. The note is non-executable.
  - 04223 (0032 Team Harness) anchors at `#13-adr-0032-multi-role-team-harness`, and that heading exists.
  - The runner notes (04167-04195, fifteen ADRs) match `### 00NN` headings in `h-36d872fbb0e5.md`. I verified 0005, 0008, 0020-0023, 0025, 0026, 0028-0034.
  - No row has an uncovered docs path. Row 22's `test/docs/rul11-anchor-phrase.test.mjs` is a test path and is correctly not an edge.
- Outcome defects: none.
- Record-text notes (not rework):
  1. Successor-note coverage is uneven within the file. Notes exist for the 15 runner ADRs, for 0004 and for 0032. Notes are absent where a title-matched candidate holder exists at the pin. This covers all the rest of the work-state ADRs, the three architecture-map ADRs and the two system-overview ADRs.
     - **Work-state:** 0002, 0003, 0006, 0007, 0011, 0012, 0013, 0019, 0024 and 0027 (edges 04201, 04203, 04207-04221). The holder is `docs/platform/work-state/decisions/retired-decision-history.md` sections 2, 3, 5-12. These use English titles, the same English/Vietnamese correspondence that L12-51 required for 0004.
     - **Architecture-map:** 0010, 0015 and 0017 (04151, 04153, 04155). The holder is `docs/platform/architecture-map.md`, headings `##### 0010`, `##### 0015` and `##### 0017`.
     - **System-overview:** 0016 and 0018 (04197, 04199). The holder is `docs/platform/system-overview/spec.md`, `### 0016` and `### 0018`.
  2. 0001, 0009 and 0014 (04157, 04159, 04161) have no candidate holder, so they are GAP-02 cases. Only 04163 and 04164 (0035) mention "P8-DOC-GAP-02 carry required"; the other three do not, though they are in the same situation (narrative only in docs/specs/platform-foundations.md). If the 0035 edges carry the note, the other three should either carry it or the 0035 note should be justified by the collision alone.
- Lead-judgment questions:
  - Q1. L12-38 says removed decision ids need successor notes. Should the omitted notes in note 1 be added, or is the checker's current registry-driven rule the intended scope? This depends on whether L12-51's 0004 note was a one-off or the pattern. I treated it as record-text, not rework, because the dispositions, targets and anchors are all correct. The checker passed.
  - Q2. Should 04157, 04159 and 04161 mention GAP-02 as 04163 and 04164 do (see note 2)?

## Counts

| Set | Stratum | Files | Edges reviewed | Rework |
|---|---|---:|---:|---:|
| batch-061 | L12-51 targeted re-review | 1 | 68 | 0 |
| batch-070 | L12-51 targeted re-review | 1 | 75 | 0 |
| Total | | 2 | 143 | 0 |

Status: DONE
Summary: Both files (143 edges) reviewed in full, no outcome defects and 0 rework. One record-text inconsistency (uneven successor-note coverage in decision-record.md, plus the GAP-02 mention on 0035 only) is raised as Lead questions.
