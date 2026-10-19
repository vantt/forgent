# Step 3 pilot round 2, g04 (batch-041: system-overview, workflow, work-state)

Pin ae141550c. Records: step-03-records/batch-041.jsonl. Source and targets read with `git show` / `git grep` at the pin. Anchors checked with the read-only `scripts/list-doc-anchors.mjs --check`. Nothing written to the worktree.

Regions read for work-state.md (327,843 bytes): the heading outline, then each edge's own line plus context at lines 15, 67, 95, 692-693, 768, 862, 1222, 1316-1331, 1360-1371, 1656, 1764, 1809, 1841, 1885-1887, 1920, 1956, 2069, 2107, 2115, 2122, 2209, 2308-2317. I also scanned the whole file for retired-root path or link tokens outside the 36 edges; only `docs/platform` tokens at lines 1200-1201, which are already candidate paths. system-overview.md and workflow.md were read in full or by grep for every link or path token.

## Per file

| File | Set | Verdict | Edges |
|---|---|---|---:|
| docs/specs/system-overview.md | batch-041 | ok | 8 |
| docs/specs/work-state.md | batch-041 | ok | 36 |
| docs/specs/workflow.md | batch-041 | rework | 6 |

### docs/specs/system-overview.md: ok

Round-1 defects confirmed fixed:
- 08331 now patches to `docs/platform/runner/operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject`.
  - The heading exists at line 234 of that file.
  - The anchor passes the anchor-lister check.
  - The passage is the full approval-gate section.
  - The quoted locator and the "hợp đồng đầy đủ" gloss stay true.
  - The "Carriage only / Canonical: No" header is candidate status per L12-26, so the file is a live target.
- 08332 patches to `docs/platform/work-state/spec.md#7-pull-door-take-and-return`.
  - The heading is at line 525 and the anchor passes.
  - §7 describes take/return and the pull door.
  - The quoted Vietnamese label is kept next to the English-titled heading, which is acceptable translated correspondence.
- 08333 (bare runner pointer) patches to `docs/platform/runner/spec.md`, per ruling 7.
- 08334 patches to `docs/platform/distillery/spec.md`. The gloss "chỉ phủ porting lifecycle" matches the target title "Distillery — Porting Lifecycle".
- 08335 and 08336 (heading and framing sentence) and 08337 and 08338 (`repo/docs/backlog.md` inside decision bodies) preserve correctly.
  - The retained paths exist at the pin.
  - The `repo/` prefix is kept.

New defects: none.

### docs/specs/work-state.md: ok

Round-1 defects confirmed fixed:
- 08355 now patches to `docs/platform/decision-citation-drift/spec.md`. It exists, and its header is candidate status, not a retained snapshot. The "(per ...)" gloss stays true.
- 08342 and 08341 (`docs/how-to/x.md`, `docs/history/p50-workflow-induct/`) are preserved as illustrative examples. The never-existed state is stated, and `git log` at the pin shows no history for either path.
- 08340 (`docs/history/<feature>/`) is a placeholder preserve.
- 08349 is parked as a dead live link to `.../canary-run.md`.
  - It never existed: `git log` and `ls-tree` find nothing.
  - It has a searchWitness with 2 live hits, both citations, and 0 carriage hits.
  - This matches ruling 5.
- 08351 stays preserve.
  - The passage is a "Đã đóng" past-action note, and the reason now says the target never existed.
  - `git log` confirms `docs/history/store-atomic-rmw/` has no history.
- 08367 and 08368 (`docs/reference/triage-table-columns.md`) preserve in the history region and carry the non-executable successor note to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`. That file exists at the pin, and the removal commit 126a8ae51 is cited.
- 08353 and 08354 (checker and test scan-scope sentence) park on Step 5 per ruling 8 and L12-26(9), each with a witness.
- Preserve targets all exist at the pin: coexistence.md, the docs/history items, tool-registry.md, architecture-map.md, architecture-manifest.json, platform-foundations.md and docs/decisions.
- 08356 to 08374 all sit inside the retired-decision bodies, so L12-26(5) applies.

New defects: none. Two cosmetic reason-label notes that do not change the disposition:
- 08343 (line 692, "xem docs/history/tsk-483.../CONTEXT.md") and 08347 (line 1320) are labelled "dated completed-action evidence".
- Both are really live "see" pointers to retained docs/history paths. Preserve is right because the paths are retained and exist.

### docs/specs/workflow.md: rework

Round-1 defects confirmed fixed:
- 08377 now names the real blocker. D-ADR0070 appears nowhere under `docs/platform/runner/**`; `git grep` finds it only in component-boundary.
- 08378 now names the real blocker. Decisions 0047/0048/0049 are in `runner/decisions/h-36d872fbb0e5.md`, while RUL84, 89, 94 and 95 are in `runner/subcomponents/h-6979005beaf7/spec.md` (RUL84 also in `git/spec.md`). There is no single exact holder, and the witness lists every locator.
- 08376 has a distinct blocker: a physical-identifier sentence that needs its own L10 step and a description rewrite.
- The record carries `checks.coverage.carryObligation`, stating the workflow carry and that Phase 9 relative links must be re-resolved.
- 08379's diff hunk covers line 670. 08380 preserves `../platform-foundations.md`, a retained root.

New defect:
1. **08375** (workflow.md:12, `[runner.md](runner.md)`, "0048 §2 và 0049 §4 của runner.md").
   - Rule: L12-26(1,7), L12-30(1).
   - The patch anchors on the H1 `#added-in-candidate-runner-lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`.
     - That H1 is the file title plus candidate scaffolding.
     - It contains neither 0048 nor 0049. The anchored passage recorded in `checks.anchors` is the title and metadata block.
   - The holders are `### 0048` (line 1530) and `### 0049` (line 1541).
     - Their common parent is the H2 `lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4` (line 25), which the anchor lister prints.
     - The request describes the target as "the common live decision-history section".
   - Required correction: anchor on the H2 (`...#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`) and make the label and destination match. The H1 title is migration scaffolding and may be renamed at promotion.

## Lead-judgment questions

1. **08379** (workflow.md:670, `[work-state.md](work-state.md) (0027)`) is patched to `docs/platform/work-state/spec.md`.
   - `0027` appears only in `docs/platform/work-state/decisions/retired-decision-history.md` (§12 "ADR 0027 ...").
   - It does not appear in the spec.
   - 08375 treats a decision-number locator by pointing at the decision holder.
   - Option A: keep the spec, since the link's gloss is "Lifecycle Work" and 0027 is only provenance.
   - Option B: point at the decision file for consistency.
   - I did not mark this a defect because the link label and gloss both name the spec.
2. **Bare basename mentions outside the inventory** are not covered by any edge. They name legacy specs by basename only, so they will go stale when `docs/specs/**` retires.
   - system-overview.md lines 14-23 (`spec: work-state.md`, `spec: runner.md` and similar).
   - workflow.md:639 ("Lịch sử quyết định của runner.md"), the same claim as parked edge 08377.
   - Confirm that the inventory grammar excludes these on purpose, or that a later class covers them.
3. **08349 (park) and 08351 (preserve)** are both never-existing history paths.
   - They differ by passage role, live evidence link versus "Đã đóng" closed note.
   - This matches ruling 5 and the Lead's request note, but the two sit in the same Open Gaps block. Confirm that is intended.

## Accounting (my files only)

| Set | Files reviewed | Rework |
|---|---:|---:|
| batch-041 (3 of 4 files; runner.md is in g03) | 3 | 1 (workflow.md) |

Edge counts after: system-overview 4/0/0/4, work-state 1/3/0/32, workflow 2/3/0/1 (patch/park/row-flip/preserve). Each matches the request.

Status: DONE
Summary: system-overview.md and work-state.md are ok, and all round-1 defects are confirmed fixed. workflow.md needs rework for one new defect: 08375 anchors on the file title (H1) instead of the decision-history section (H2) that holds 0048/0049. Three Lead-judgment questions are listed above.
