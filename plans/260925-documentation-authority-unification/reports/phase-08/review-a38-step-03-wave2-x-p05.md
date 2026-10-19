# Review a38 step-03 wave2 expansion, Part 05

Pin `ae141550c2e022310de7a0efea757580c0b2479f`, worktree detached at feeeeee92. Set batch-038, stratum full-set-expansion, 5 whole files, 81 edges.

## Method

- Read each source whole via `git show <pin>:<path>`. The 127 KB coordinator file was read as an outline plus every edge region, the wrapper, and the lines between 803 and 884 and from 1572. The 119-803 prompt block and the two upstream copies were scanned with a Python regex for every path, link, basename and ADR token.
- Extracted per-edge fields and the legacy-scan candidates and exclusions with Python. No check or probe script was run.
- Verified at the pin that `docs/platform/runner/spec.md`, `docs/platform/runner/decisions/h-aabefc85f0c9.md` and `docs/platform/agent-coordination/README.md` exist.
- Record sha256 and diff sha256 for all five files equal the values in `step-03-wave2-expansion-review-index.json`. This is a binding only, not a semantic acceptance.

## Per-file verdicts

### 1. `docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md`

- Verdict: **ok**. 25 edges read; 383 source lines read whole.
- Record sha256 prefix f7af5cc39614; diff sha256 prefix fc731992e3e2.
- L17 patches to `docs/platform/runner/spec.md` as wrapper Related navigation, whole-file, no description issue.
- L19 "Superseded by" preserves with a record-only successor note (L12-37(6)).
- L23 is the dated retirement framing; the preserve cites the successor `h-aabefc85f0c9.md` (L12-37(5)).
- L36 through L372 (22 edges, including the L56-L63 and L81 links) all sit after `## Literal Snapshot`, which runs to the closing `~~~~` at the end of the file. All are preserved with the correct declaration.
- The diff changes only L17.

### 2. `.../history/retired-engine/files/playbooks/prompts/architecture-advisory-coordinator.md`

- Verdict: **ok**. 19 edges read; 2,267 lines, with the outline plus all edge regions and the 803-884 and 1572-1582 spans read. The prompt block at 119-803 and the two upstream copies were scanned for tokens.
- Record sha256 prefix 3078e2e841d8; diff sha256 prefix d11cb66dcbfd.
- L17 patch, L19 preserve and L23 preserve are correct. L23 correctly carries the h-aabefc85f0c9 note.
- L36, L60, L65, L72, L108, L112, L114, L811, L818, L819, L830, L848, L855 and L857 are all inside the literal snapshot and preserved.
- L881 and L1577 are "Source: ... at da8285e06" pinned lineage lines in the dated Upstream Source sections. Preserve is correct.
- Minor record-text point: L881 is justified as "Source/Provenance lineage" and L1577 as "inside literal carriage". Both are preserves, so the outcome is the same.

### 3. `.../prompts/master-coordinator.md`

- Verdict: **ok** (outcome), with a record-text defect on 06035. 12 edges read; 618 lines read whole.
- Record sha256 prefix 281d7a655e8a; diff sha256 prefix b7cbc7e8d182.
- Edges: 06033 patch, 06034 preserve, 06036 to 06044 preserve inside carriage. 06035 (L23) is recorded as a preserve.

### 4. `.../prompts/step-07-design-discussion-handoff.md`

- Verdict: **ok** (outcome), with the same record-text defect on 06047. 23 edges read; 455 lines read whole.
- Record sha256 prefix 33be267bddef; diff sha256 prefix c38d17a73708.
- The 16 Read-first and proposal paths at L97-L112 and the three at L427, L431 and L435 are in carriage and preserved. 06045 is the patch and 06046 the preserve.

### 5. `docs/platform/agent-coordination/playbooks/README.md`

- Verdict: **ok**. 2 edges read; 109 lines read whole.
- Record sha256 prefix 4b6351086d7c; diff sha256 prefix 82f0e765cc5a.
- 06493 (L17 Related) patches to `docs/platform/runner/spec.md`, which is correct and has no description issue.
- 06494 (L28) is a `phase9-row-flip` of the "Migration Status" paragraph naming `docs/architect/agent-coordination/playbooks/`. That follows L12-35(2): the subject is migration state, and the legacy path is not merely substituted.
- Links at L23, L40 and L42 point to history files that exist. `core/skills/...` and `verification/<track>/...` (L86, a placeholder pattern) are not edges.

## Outcome defects (rework)

None. No wrong disposition, target, anchor or diff, no false adjacent description, and no missed reference that changes an outcome.

## Record-text notes (not rework)

1. **06035** (master-coordinator.md, L23) and **06047** (step-07-design-discussion-handoff.md, L23).
   - The reason says "inside literal carriage ... declaration: Purpose: Preserve source material...". L23 is the wrapper's dated retirement-framing sentence, before `## Literal Snapshot`.
   - The sibling edges 06007 and 06025 treat the same sentence correctly: dated framing, preserve, with a successor note naming `docs/platform/runner/decisions/h-aabefc85f0c9.md` (L12-37(5)).
   - These two have no successor note and a wrong carriage claim. The preserve disposition is right.
   - Suggested fix: use the 06007 wording.
2. **Bare retiring-basename mentions are excluded or uncovered; no outcome effect.** All are inside literal carriage, where the correct disposition would be preserve.
   - mvp6-dogfood-handoff.md: `P04.1.md`, `P03.1.md`, `P00.1.md` and `thin-launcher-surface-readiness.md` (L116-L372) are excluded as "illustrative manual artifact filename, not the unrelated retiring proof filename". The text at L219-L224 and L372 is shorthand for the same retiring proof files named in full at L95, L107 and L110. The exclusion reason is therefore inaccurate.
   - master-coordinator.md L394 and step-07-design-discussion-handoff.md L403 and L440: bare `documentation-governance.md`, a retiring basename (`docs/architect/agent-coordination/documentation-governance.md`), has neither an edge nor an exclusion.
   - step-07-design-discussion-handoff.md L452: "ADR-006 and ADR-007" are short ids of retiring decision files. They are not edges.

## Lead-judgment questions

1. Does L12-35(6), "resolving carriage links cannot hide as contextual exclusions", require item 2 above to become preserve edges? It is outcome-neutral, so I did not count it as rework.
2. playbooks/README.md 06494 is authored as `phase9-row-flip` under L12-35(2). Its text also names a retiring tree as the object of a live statement, which L12-37(4) parks as description-rewrite. Both are Phase 9 timing and the checker accepts it; I judged row-flip acceptable.

## Counts

| Set / stratum | Reviewed files | Rework |
|---|---|---|
| batch-038 / full-set-expansion, Part 05 | 5 | 0 |

- Part 05 edges reviewed: 81 of 81, split 25 / 19 / 12 / 23 / 2.
- The batch-038 set-level numerator across parts is for the Lead to pool; this part contributes 0 of 5.

Status: DONE
