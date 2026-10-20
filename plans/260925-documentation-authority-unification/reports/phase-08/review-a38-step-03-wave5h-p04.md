# Review a38 step-03 wave5h, part p04

Reviewer: independent read-only semantic. Pin ae141550c2e022310de7a0efea757580c0b2479f. Worktree at a997ae7e6. No checker, probe or CLI run; no worktree writes.

## File

- Path: `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` (batch-103)
- Set: batch-103 targeted re-review (06921 evidence citation; the file was already reviewed, YAML re-review for this edge)
- Stratum: unpatched/parked-and-preserve (the record diff is empty, no patch edges)
- Verdict: **ok**
- Edges reviewed: 17 of 17 (maps-j-06915 to maps-j-06931), one 17-edge page.
- Source read whole (863 lines) at the pin, plus every edge region. Record: select by `file`, all fields printed per edge. Diff is empty, which is correct because nothing is patched.

## Per-edge outcomes

| Edge | Line | Source text | Disposition | Judgement |
|---|---|---|---|---|
| 06915 | 44 | docs/io-contract.md | preserve | ok. File exists at the pin and is a retained root file, same handling as 27 other io-contract preserves (reading-map 07974). |
| 06916 | 50 | docs/decisions/0011-... | parked step5-parity | ok. Path absent at the pin, removed at 4722361ae, no successor. It sits in the served CTR010 YAML `x-decisions`, so parity park under L12-30/32/34 is consistent. |
| 06917 | 51 | docs/decisions/0014-... | parked step5-parity | ok, same as 06916. |
| 06918 | 53 | docs/io-contract.md | preserve | ok. |
| 06919 | 54 | docs/specs/work-state.md | parked step5-parity | ok. Exists at the pin, tree retires at Phase 9. The suffix is correct because the path is under docs/specs. |
| 06920 | 55 | docs/specs/runner.md | parked step5-parity | ok. Same as 06919. |
| 06921 | 205 | docs/history/tsk-4id-task-detail-screen/RESEARCH.md | preserve | ok under L12-53 and L12-51(1). The citation sits in a YAML comment saying the shape was confirmed via a real `fgos show` run, so it is an evidence citation, not a navigation pointer. targetFacts records the path as never-existed. I confirmed it is absent at the pin and in the git history (only plan commits mention the name). The pre-rename holder `docs/history/herdr-web-dashboard/RESEARCH.md` exists at the pin. The reason states it is lineage, not a redirect. No runtime-parity category is carried. |
| 06922 | 218 | docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md | preserve | ok. Exists at the pin, retained history tree. |
| 06923 | 250 | docs/history/herdr-web-dashboard/CONTEXT.md | preserve | ok. Exists at the pin. |
| 06924 | 256 | docs/history/ | preserve | ok. Directory exists at the pin. |
| 06925 | 456 | docs/specs/work-state.md | parked | ok. Live description "see ...", so it parks as a parity edge, not a history preserve. |
| 06926 | 607 | docs/specs/runner.md | parked | ok. |
| 06927 | 681 | docs/io-contract.md | preserve | ok. |
| 06928 | 710 | docs/specs/work-state.md | parked | ok. |
| 06929 | 729 | docs/history/ | preserve | ok. |
| 06930 | 739 | docs/specs/work-state.md | parked | ok. |
| 06931 | 863 | docs/io-contract.md | preserve | ok. |

Coverage and misses:
- Every docs path occurrence in the source is an edge. I cross-checked by grepping the source for `docs/`, `.md`, `specs/`, `decisions/`, `architect`, `foundations`, `io-contract`, `work-state` and RUL/ADR. Result: 17 spans, 17 edges, no missed reference.
- Bare `RUL45` (line 168) is a decision id with no path, so it is not an edge (L12-49). `str46-io-contract` (line 41) is an item id, not a path. Bare `CONTEXT.md`/`plan.md` on lines 247, 251, 272 and 273 name per-item docsRef files, not legacy paths.
- The record has no author-added edges, and the legacy scan has 0 candidates.

## Defects

- Outcome defects: none.
- Record-text notes (not rework): 06921 names `docs/history/herdr-web-dashboard/RESEARCH.md` as the pre-rename holder, as L12-53 directs. At the pin that file mentions tsk-4id only in a status table row (line 30). It holds no `fgos show` capture or WorkDetail content. The reason correctly says "lineage, not a live authority redirect", so I leave it as is.
- Lead-judgment questions: none.
- Checker limitations: none observed.

## Counts

- batch-103 targeted re-review set, unpatched/parked stratum: 1 file reviewed, 0 rework, 17 edges reviewed, 0 edge defects.
- Preserve edges: 9 (06915, 06918, 06921, 06922, 06923, 06924, 06927, 06929, 06931). Parked step5-parity edges: 8 (06916, 06917, 06919, 06920, 06925, 06926, 06928, 06930).
- Patched stratum: 0 files.
