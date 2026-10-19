# Step 3 pilot round 3, g04 (batch-041: work-state, workflow, system-overview)

Pin ae141550c (worktree bade80e52, read-only). Records: step-03-records/batch-041.jsonl (my three files). Source and targets read with `git show` / `git cat-file` at the pin. No checker or probe run; resolver not needed.

Regions read:
- **work-state.md** (320 KB): the full diff hunk (lines 1359-1365), and each changed edge's own line plus context at 1324, 1331, 1362-1371, 1642, 1656, 1764, 1809, 1841, 1885-1894, 1920, 1956, 2069, 2107, 2115-2122, 2209, 2308-2317.
- **workflow.md**: full diff, lines 12, 78, 632-639, 667-675, plus a whole-file token scan.
- **system-overview.md**: read in full (171 lines).
- **Whole-file scan, all three files:** every token that names a legacy path or a basename from `docs/specs/**` or `docs/architect/**` is covered by an edge span.
  - Only exceptions: root `README.md` (system-overview:70) and candidate `docs/platform/**` paths (work-state:1200-1201).
  - So there are no unrecorded added edges.

## Per file

| File | Set | Verdict |
|---|---|---|
| docs/specs/work-state.md | batch-041 | ok |
| docs/specs/workflow.md | batch-041 | ok |
| docs/specs/system-overview.md | batch-041 | ok |

### docs/specs/workflow.md: ok

Round-2 defect 08375 is confirmed fixed.
- The patch now anchors on `#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`.
- `enclosingHeadingProof` shows the H2 at line 25 of `docs/platform/runner/decisions/h-36d872fbb0e5.md`, ending at line 1769.
  - It holds `### 0048` at line 1530 and `### 0049` at line 1541.
  - `narrowerCommonHolders` is empty, and no narrower common holder exists, since 0048 and 0049 are sibling H3s.
- The diff hunk uses that anchor and the label follows the destination.

Remaining edges:
- 08376, 08377, 08378 and added edge `author-r3-docs-specs-workflow-L639C102` stay parked with real blockers.
  - 08377 and L639C102 cite D-ADR0070 as the official record "in Lịch sử quyết định of runner.md".
    - `git grep D-ADR0070 -- docs/platform` finds it only in `component-boundary.md` (4 citations), never in the runner decisions file.
    - Parking is correct, and both edges name the same blocker.
  - 08378 combines 0047/0048/0049 with RUL84/89/94/95, whose holders are separate files, so no single exact target exists.
  - 08376 is a sentence about retaining the physical identifier `docs/specs/runner.md`, which needs its own L10 step.
- 08379 patches to the work-state spec, kept as authored per L12-31(8). The label and gloss name the spec.
- 08380 preserves the retained root `docs/platform-foundations.md`, which exists.
- The workflow carry obligation is present in `checks.coverage.carryObligation`.
- L639C102 is the one added edge.
  - It is the bare "runner.md" in the line 639 "Hình thức" sentence.
  - It is not covered by any inventory span.
  - Park disposition and rationale are right.
  - It rests on the same D-ADR0070 absence as 08377.
- No other legacy token in the file lacks an edge.

Cosmetic, not a rework:
- 08375's `reason` string still opens with "exact live locator passage at ...#added-in-candidate-runner-lịch-sử-quyết-định-..." (the H1 anchor text).
  - It then appends the correct H2 slug as "L12-31(1)".
  - The `target` and `anchor` fields and the diff are correct.
  - A stranger could read the first clause as the H1 anchor.
  - Suggest dropping that clause.

### docs/specs/system-overview.md: ok

Round-2 status is unchanged. The changed existing edges check out:
- 08331 patches to `operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject`.
  - The anchor is the extractor anchor, correct for a plain `path#anchor` citation.
  - The heading is at line 234 and ends at 357.
- 08332 patches to `work-state/spec.md#7-pull-door-take-and-return` (heading at line 525, ending at 608).
- 08333 and 08334 patch whole-file to `runner/spec.md` and `distillery/spec.md`.
  - The "chỉ phủ porting lifecycle" gloss still matches the distillery target.
- 08335, 08336, 08337 and 08338 preserve.
  - They sit inside the retired-decision region, and the quoted framing sentence is at line 76.
  - `repo/docs/backlog.md` exists and `repo/` is kept.

The 11 added edges are all correctly dispositioned:
- L14C95 `platform-foundations.md` parks on P8-DOC-GAP-02.
- L16C254 `enduser-docs-authoring.md` and L17C254 `enduser-docs-index.md` park on P8-DOC-GAP-02. The only other live hit is switchboard:61, a row about the same legacy files.
- L15C129 (work-state), L18C122 (runner), L21C82 (distribution), L22C168 (decision-citation-drift) and L23C106 (distillery) patch whole-file.
  - They are bare area pointers, per L12-30(7).
  - The diff rewrites them to `../platform/<area>/spec.md`. That matches the existing sibling `../platform/convention/spec.md` on line 25.
  - The area-list glosses stay true.
- L19C240 `workflow.md` parks on the workflow carry. `git grep` finds no candidate workflow spec, and the witness has 0 live hits.
- L20C129 `fgos-plugin.md` parks as "description needs rewrite".
  - The line says "12 verb wrapper".
  - Candidate `docs/platform/claude-plugin/spec.md` lines 55, 168 and 180 say `/fgOS:check` is not shipped and the plugin wraps "more than the original 12 verbs".
  - Retargeting would leave a false count, so this is a genuine blocker.
- L83C151 `platform-foundations.md:` sits in a 0016 decision body and preserves, with the framing sentence quoted.

### docs/specs/work-state.md: ok

Changed edges, all checked:
- **08349** parks as a dead link.
  - `git log --all` finds no history for `docs/history/install-coexistence/reports/canary-run.md`.
  - The two live hits are copies of the same dead citation (`coexistence/spec.md:112` and `work-state/spec.md:1173`), so they are unusable as a target.
- **08351** preserves under the explicit "**Đã đóng:**" marker. `docs/history/store-atomic-rmw` has no history. L12-31(8) binds this split.
- **08353 and 08354** park on Step 5 scan-scope parity, per L12-26(9) and L12-30(8).
  - The live hits (the candidate decision-citation-drift spec lines 39/59/85/92 and implementation-pointers:52) restate the same default-scope claim. They are not a substitute target.
- **08355** is the only patch, to `docs/platform/decision-citation-drift/spec.md`.
  - The diff touches only that token on line 1362.
  - The "(per ...)" gloss stays true: the candidate states the scan scope and is not wired into `npm test`.
- **08356 to 08374** all preserve and are well formed.
  - Every target path that is claimed to exist does exist at the pin. I checked docs/history x4, `architecture-map.md`, `architecture-manifest.json`, `docs/platform-foundations.md`, `coexistence.md`, `docs/decisions/index.md`.
  - 08358 correctly says the relative path is absent, with the successor note to the retired-decision-history §8 (ADR 0012).
  - 08360, 08361, 08362 and 08364 are self-references. They state "exists at author pin; tree retires at Phase 9" and give a non-executable successor note.
  - 08367 and 08368 give the removal commit 126a8ae51 and the real successor `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`. That file exists.

Added edges L1642C58, L1891C21 and L1894C28 (`work-state.md[:703]`) are all line-citations inside retired-decision bodies. All three preserve, with the framing sentence quoted. Correct.

## Notes (no disposition change)

1. **Per-hit witness assessments are one boilerplate sentence.**
   - Every hit in the parked records' `hitGroups` carries "locator occurrence does not satisfy the source-row description/carry/parity/evidence dependency stated below".
   - Locations, counts and first-hit excerpts are real and per group, so the live hits are checkable.
   - I verified the verdicts by hand for 08349, 08353, 08377 and L19C240, and they hold.
   - L12-31(7) asks for per-group assessment, so the Lead may want the group sentence to say why each hit group is unusable. I did not mark this a defect.
2. **`docs/decisions/` preserves.** 08335/08336/08356/08357/08363/08373 say "retained path exists", but the passage says the corpus is retired.
   - Only `docs/decisions/index.md` exists. The path is correct and outside the retiring trees, so L12-31(2) is not triggered.
   - Wording such as "directory retained (index only); ADR corpus retired tsk-1lv-4" would be less misleading.

## Lead-judgment questions

1. **system-overview L14C95** (`spec: platform-foundations.md`, "8 luật thiết kế đã khóa").
   - It is parked on P8-DOC-GAP-02.
   - The retained root `docs/platform-foundations.md` holds the laws, and candidate `docs/platform/platform-foundations.md` is a carriage anchor.
   - Confirm that parking is intended rather than a patch to the retained root. The "8 luật" count is stale against L1-L10 either way.
2. **work-state 08351** is a present-tense "xem ... `docs/history/store-atomic-rmw/`" inside an explicit "Đã đóng" note. It is preserved.
   - L12-31(8) already binds this. I confirm it only for completeness, since L12-31(3) alone would favor a park.

## Accounting (my files only)

| Set | Files reviewed | Rework |
|---|---:|---:|
| batch-041 (3 of 4 files; runner.md is in g03) | 3 | 0 |

Edge counts, original + added, by disposition:
- **work-state:** 39 original edges and 3 added edges. 1 patch, 3 parked, 35 preserve. 24 changed edges were checked.
- **workflow:** 6 original edges and 1 added edge. 2 patch, 4 parked, 1 preserve. 5 changed edges were checked.
- **system-overview:** 8 original edges and 11 added edges. 6 patch, 5 parked, 8 preserve. 8 changed edges were checked.
- **Added-edge dispositions:** I checked every added edge: 3 in work-state, 1 in workflow and 11 in system-overview.

Status: DONE
Summary: All three files are ok. The round-2 defect 08375 is fixed, now anchored on the H2 that holds 0048 and 0049. All 15 added edges and 37 changed edges check out. Two wording notes and two Lead questions are listed above.
