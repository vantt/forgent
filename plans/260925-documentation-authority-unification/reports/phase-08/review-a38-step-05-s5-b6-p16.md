# Review p16 (seam 5 judgment files, batch 6 / real-reader-batch-2)

Pin 5eb9dc609, read-only. Payload: 49 file entries; only 5 carry items (the other 44 have zero payload items by R24 and were not reviewed).

## Per file

### test/state/retrospective-doors.test.mjs - ok (52 items; 52 REJECT/preserve)
All fixtures use `tmpRepoRoot()` (os.tmpdir mkdtemp). docs/history/*, docs/specs/example.md are tmp-root fixture paths or in-memory `docsRef` strings; `findings[0].file` is caller-data echo. Rejects (config-or-metadata, non-document-fs-probe, scalar-pass-through) are all true. No real docs read. No OUTCOME defects.

### test/state/runtime-coordination.test.mjs - ok (3 items)
- 005288 (L815) and 005289 (L105): admit/preserve, comment pointer to docs/architect/doing-coordination-redesign.md with treeRetires:true witness (tree retires). Correct per R8: only live-ish carrier is docs/platform/proposals/doing-coordination-redesign.md, which declares Canonical: No, and docs/explanation/settleclaim-revision-drift-self-caused.md itself only cites the architect path. No unique live holder, so preserve is right.
- 005290 (L649): reject, in-memory `docsRef` patch value. True.

### test/state/store.test.mjs - ok (16 items)
- 005297/005298 (L36, L377): same as above, preserve with treeRetires:true.
- 005299 (L95): docs/history comment, admit/preserve (R16 uniform). OK.
- 005295/005296 (L1012, L1059): admit/preserve as test-title baseline keys (docs/history retained). OK.
- 005294/005300 rejects (in-memory docsRef strings) and dynamic-038653..038661 rejects: the paths are `path.join(repoRoot,'docs','history',...)` with `repoRoot` from a mkdtemp git repo; the product reads the tmp tree. True non-document use. 038705 os.tmpdir OK.

### test/state/work.test.mjs - ok (14 items)
- 005302/005304/005305/005306: docs/history comment pointers admit/preserve (R16). OK.
- 005301/5303/5307/5308/5309/5310 and dynamic-038793..038797: tmp `mkRepoRoot()` fixtures and in-memory `learn`/`docsRef` strings. Rejects true.

### test/docs/decisions-corpus-retired.test.mjs - ok with notes (34 items: 5 patch-items counted below, 7 parks, rest preserve/reject)
Diff touches only L47 (runner), L49 (system-overview) array members and L78 runner read; rollback is the exact inverse; source file is a test. Verified at pin:
- docs/platform/runner/decisions/h-36d872fbb0e5.md has the single `## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)` marker and the same `### NNNN` headings as docs/specs/runner.md, including `### 0032 — Cổng Iron Law`. docs/platform/system-overview/spec.md has the marker once plus `### 0016`, `### 0018`. So 004033, 004037, 004046, 018741 (patch) and the message items 018740, 018744 (printed paths change with the array) agree.
- Parks verified true: 004035 (docs/platform/architecture-map.md has no `### 0010/0015/0017`; only mentions ADR0010/0017 in H4/appendix text); 004040 (docs/platform/platform-foundations.md and docs/platform have no holder for 0001/0009/0014/0035/0036/0054/0061/0062/0073); 004047/018742 (retired-decision-history.md has `## 13. ADR 0032 Multi-Role Team Harness`, not `### 0032 — Multi-role Team Harness`); 004048/018743 (the same file has no retired-section marker; foundations holder neither).
- docs/decisions retained (generated index): 004030/004039/004041, 018734/018735/018736 preserve correct. 004029/004043 docs/specs comments preserve with treeRetires:true witness (not "retained"). 004042 (AGENTS.md regex) and 018745 preserve OK.

OUTCOME defects: none.

## Record-text notes
1. reference-004034 blockedReason (work-state array member): says the member "must contribute each original ### <id> heading ... reconcile the complete work-state heading inventory". At the pin retired-decision-history.md has `### 0002 Context` ... `### 0032 Foundation Architecture` for all 12 work-state ids, so the combined-scan regex `^### <id> ` would match it. The real blocker for this array literal is the marker loop (L84-88, holder has no `## Lịch sử quyết định retired ...` heading) plus the L79 0032 regex. Reword to name that (park outcome still right because one literal feeds both loops). Same wording issue in dependency name 'work-array'.
2. reference-004036 (comment L6 on docs/architecture-map.md) carries treeRetires:true while the sibling park 004035 says root retention of docs/architecture-map.md is unsettled (not in docs/specs or docs/architect). Witness and park text contradict; preserve outcome unaffected.
3. reference-004038 (title L58 mentions 0000-index.md) carries the successorNote, but the admitted citation reference/dynamic-018736 (L59 existsSync of 0000-index.md) has successorNote null; owner-answers L12-79 says 018736 gains it. Move/copy the note to 018736.
4. Test-title admissions are inconsistent across the part: titles are ADMIT role test-title in store.test.mjs (005295/005296) but REJECT text-label-join in decisions-corpus-retired (004028/004031/004032/004038/004044/004045/004049). All preserve; fix label only (R10).
5. Minor: 004047 blockedReason quotes regex with `^` (`/^### 0032 — ...`); actual regex at L80 has no `^`.

## Lead-judgment questions
- Q1: Runner and system-overview patch targets are "Design status: Candidate / Canonical: No" decision-holder files (h-36d872fbb0e5.md, system-overview/spec.md). Accepted as eligible under L12-30(3)/L12-79 per existing ruling; the post-cutover test stays red until the five parked members settle (acknowledged in L12-81 P06).
- Q2: 004034 could be split (patch the array member to retired-decision-history.md for the scan only) but that needs the marker loop and 0032 regex decisions first; keep park unless Lead wants a split of the array literal.

## Counts
Files with items: 5. Items reviewed: 52 + 3 + 16 + 14 + 34 = 119. Admitted: 3+... (runtime 2, store 5, work 4, corpus 22) = 33 admits (4 patch/2 patch-message items, 7 parks, rest preserve); rejects 86 (all preserve). OUTCOME defects 0; record-text notes 5; Lead questions 2.
