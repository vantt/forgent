# Step 3 wave 5g, part p01 review

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Read-only; no checker, probes or resolver run. Both source files were read whole at the pin (implementation-pointers 58 lines; cli-io-contract 449 lines, in chunks of 120 lines or fewer to EOF). Every edge record field was extracted per edge. Targets were read at the pin.

## File 1: `docs/platform/work-state/architecture/implementation-pointers.md`

- Set batch-122, stratum unpatched-seeded, 7 edges reviewed (07892-07898), diff empty.
- Hashes: source sha256 `5b8b4d25f4b5526f...` (equals record digest), record line `2941be2343fcb773...`, diff `e3b0c442...` (empty).
- **Verdict: rework** (1 missed-reference defect).

Edge review:

| Edge | Source line | Disposition | Assessment |
|---|---|---|---|
| 07892 | L12 Related `docs/specs/work-state.md` | park, description-rewrite (duplicate) | ok. Holder `docs/platform/work-state/spec.md` is already listed at L11 (L12-34(4)). |
| 07893 | L14 Provenance | preserve | ok (L12-47). |
| 07894 | L50 `docs/coexistence.md` | preserve | ok. Retained root, exists at the pin. |
| 07895, 07896, 07897 | L52 test-scope sentence: `docs/specs/*.md`, `docs/specs/`, `docs/specs/decision-citation-drift.md` | park, step5-parity | ok. The sentence asserts what npm test and check-decision-citation-drift scan. That is a checker-scope claim, and the three edges share one disposition (L12-30(8)). |
| 07898 | L58 `[Legacy source: ...](../../../specs/work-state.md)` | park, description-rewrite (duplicate) | ok. The label and destination are treated as one unit. The holder is listed at L57. |

### OUTCOME defect

- **Missed reference, L43 and L46: bare basename `id-systems-audit.md`.**
  - L43 reads "...không qua `generateId` per id-systems-audit.md #1 — rồi `moveStage`...".
  - L46 reads "...per id-systems-audit.md #1, work-id-tsk-hash".
  - `docs/id-systems-audit.md` is in the inventory legacy pattern list. At the pin it exists, and a relocated copy exists at `docs/platform/documentation/history/id-systems-audit.md`.
  - The record's `legacyScan.candidates` is empty and no edge covers either occurrence. No batch record has any bare-basename `id-systems-audit.md` edge.
  - Rule: the A51 bare-basename rule, in the digest and in L12-32(6).
  - Correction: add two `authorAddedEdge` entries and disposition them. Most likely each preserves as an original-provenance "per X" citation, with a successor note to the relocated history file. Otherwise it parks or patches.
  - See Lead question Q1.

### Record-text notes (not rework)

- The 07892 and 07898 reasons cite L12-40(2) (self-alias). The actual cause is a duplicate Related or Legacy-source item whose holder is already listed.

## File 2: `docs/platform/work-state/contracts/cli-io-contract.md`

- Set batch-122, stratum patched-seeded, 16 edges reviewed (07899-07914), 4 patch hunks.
- Hashes: source sha256 `a8bb798b7a717c66...` (equals record digest), record line `7987c1994724983e...`, diff `db2d3c2fff58bc5e...`.
- **Verdict: rework** (1 outcome defect, 07912).

Edge review:

| Edge | Source line | Disposition | Assessment |
|---|---|---|---|
| 07899 | L14 Related | park, duplicate | ok. The holder is listed at L13. |
| 07900 | L15 `docs/io-contract.md` Related | preserve | ok. Retained root, consistent with the 30 preserves elsewhere. |
| 07901, 07902 | L17 Provenance | preserve | ok. |
| 07903 | L30 `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` | park, GAP-02 | ok. The title-matched narrative is `docs/specs/platform-foundations.md` L180 "0014 — Kiến trúc giao tiếp người ↔ fgOS", which is retiring (L12-41(1)). The knowledge hits are partial. The path was removed at `4722361ae`. |
| 07904 | L35 `docs/specs/work-state.md` | patch to `docs/platform/work-state/spec.md`, whole file, Phase 9 | ok. The "does not repeat implementation detail" gloss is true for the candidate spec. The diff matches the span. |
| 07905 | L35 `docs/specs/runner.md` | patch to `docs/platform/runner/spec.md`, whole file, Phase 9 | ok. Same as 07904. |
| 07906 | L225-226, hyphen-wrapped `docs/history/tsk-483-list-side-log-pagination-scoping/CONTEXT.md` | preserve | ok. The path exists at the pin, and the wrapped span is joined correctly. |
| 07907 | L435 0014 | park, GAP-02 | ok. Same as 07903. |
| 07908 | L436 `docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` | patch to `docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract` | ok. The heading `## 7. ADR 0011 Explicit Version For Every Contract` exists, and its Decision section states the `<name>/v<N>` rule. The file already uses the same link at L31 and L397. |
| 07909 | L437 `docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người ghi | park, description-rewrite | ok. Candidate `work-state/spec.md` has none of the three sections (there is "Tool Registry Verbs" and verb sections, but no envelope, manifest or writer section). Those details are this file's own §3, §7 and §2, so a patch would create a self-pointer (L12-40(2)). |
| 07910 | L438 `docs/specs/runner.md` RUL61 | patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules` | ok. RUL61 at line 92 is the runner `fgos.v1` one-line stdout envelope, enclosed by `## Business Rules` with no narrower heading in between. The gloss "(envelope stdout runner)" is true. The other RUL61, in `work-state/spec.md`, is the writer rule, so the wrong holder was correctly avoided. |
| 07911 | L439 `docs/architecture-map.md` | preserve | ok. Retained root. |
| 07912 | L440 `docs/history/str46-io-contract/` | preserve | **DEFECT**, see below. |
| 07913 | L448 `[Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)` | park, duplicate | ok. The label and destination are one unit. |
| 07914 | L449 `[Legacy source: docs/io-contract.md](../../../io-contract.md)` | preserve | ok. |

### OUTCOME defect

- **07912, L440 `docs/history/str46-io-contract/` is a live `## 12. References` navigation list entry to a path that never existed.**
  - The record preserves it. Its reason is self-contradictory: it says "never existed in author-pin ancestry" and also "surviving retained-root/native citation".
  - Rule: L12-51(1) says a live navigation pointer ("see X", a "Tham chiếu" list) to a nonexistent path parks as a dead link. L12-30(5) and L12-38(2) say the same.
  - The identical list in `docs/io-contract.md` L220 (edge 04114, "Tham chiếu") was ruled in L12-51 to park as a dead link. The batch-130 record at this commit still shows preserve, because that fix is pending.
  - Correction: park 07912 with blockedCategory `dead-link` and reason "path never existed in any git history; no successor". Keep it consistent with the corrected 04114. There is no diff.
  - See Lead question Q2.

### Record-text notes (not rework)

- The 07912 reason carries the retained-root boilerplate alongside "never existed" (see above).
- The 07899 and 07913 reasons cite L12-40(2) for a duplicate case.

## Lead-judgment questions

- **Q1.** Is a bare `id-systems-audit.md` (a root legacy-pattern basename) in live candidate prose an edge? The checker's basename scan evidently does not cover it, and nothing in architecture-map L766-825 has edges either. That file is carriage, so it is exempt. I treated implementation-pointers as live, so it needs edges. If the Lead rules root-file basenames out of scope here, File 1 becomes ok and the same ruling applies to all sets.
- **Q2.** Confirm that 07912 follows the 04114 ruling (dead-link park). The alternative is to treat the dossier citation as provenance, which would contradict L12-51(1) for "Tham chiếu"/References lists.

## Counts

| Set | Stratum | Files reviewed | Files rework | Edges reviewed | Edges with outcome defect |
|---|---|---|---|---|---|
| batch-122 | unpatched-seeded | 1 | 1 (pending Q1) | 7 | 2 missed occurrences (L43, L46) |
| batch-122 | patched-seeded | 1 | 1 | 16 | 1 (07912) |
| Part total | | 2 | 2 | 23 | 3 |

If Q1 is ruled out of scope, the unpatched stratum has 0 rework. The patched stratum stays at 1 of 1.

Status: DONE_WITH_CONCERNS
