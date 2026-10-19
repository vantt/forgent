# Step 3 pilot semantic review, g04 (batch-041: work-state, workflow, system-overview)

Author pin ae141550c. Records: step-03-records/batch-041.jsonl. Source and candidate targets were read with `git show` and `git grep` at the author pin. Nothing was written to the worktree.

## Summary

| File | Set | Edges reviewed | Verdict |
|---|---|---:|---|
| docs/specs/system-overview.md | batch-041 | 8 | rework |
| docs/specs/workflow.md | batch-041 | 6 | rework |
| docs/specs/work-state.md | batch-041 | 36 | rework |

Regions read for work-state.md (327,843 bytes, 2,352 lines):
- The whole heading outline.
- Live regions: lines 13-15, 67, 95, 688-693, 764-768, 858-862, 1200-1222, and the whole of 1316-1363 (Open Gaps, Visuals, Pointers).
- History regions: 1364-1370, 1654-1657, 1762-1766, 1880-1889, 1952-1958, 2064-2124, 2205-2210, 2296-2320.
- For the other history edges (1371, 1809, 1841, 1920, 2115, 2122, 2308) I read the edge's own passage, all inside "Lịch sử quyết định retired" decision bodies.

Author pin cross-checks (git grep and ls-tree) are in the defect lists below.

---

## docs/specs/system-overview.md (digest 70cd0940...): rework

Edges 08331 to 08338. The 08334 patch, the 08335/08336 preserves and the 08337/08338 preserves are correct. Three parked edges are wrongly parked.

Verified as correct:
- 08334 patch to `docs/platform/distillery/spec.md`:
  - The hunk `@@ -60,7 +60,7 @@` contains line 63.
  - The target exists, is a Specification titled "Distillery — Porting Lifecycle", and matches the "porting lifecycle" locator.
  - It is a Phase 9 cutover-only patch.
- 08335 and 08336 preserve (lines 74 and 76):
  - These sit in the "Lịch sử quyết định retired từ docs/decisions/" heading and its framing sentence.
  - The rule named is L12-26(5).
- 08337 and 08338 preserve (lines 144 and 166):
  - These are inside the 0016/0018 decision bodies, where `repo/docs/backlog.md` is a retained path.
  - The spelling and the `repo/` prefix are kept.

Defects (parked edges that the rules turn into patches):

1. **08331** (line 51, `docs/specs/runner.md "Cổng duyệt PR nội bộ"`).
   - The locator is a quoted section title, so L12-26(1) applies.
   - The heading exists in the candidate tree: `docs/platform/runner/operations/h-51f5cd7279fd.md:234`, "### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject".
   - Correction: patch to that file and keep the quoted locator. The Lead has already ruled that the header "Carriage only / Canonical: No" is candidate status and not carriage. This is the same kind of target as the h-36d8… and h-aabe… files.
   - The blockedReason "no proven exact live target" is false.
2. **08332** (line 53, `docs/specs/work-state.md "Cửa pull giao–nhận việc"`).
   - The candidate `docs/platform/work-state/spec.md` has "## 7. Pull Door Take And Return" (line 525). It also has the Entry Points item at line 48.
   - Correction: patch to `docs/platform/work-state/spec.md` with the plain-citation extractor anchor for section 7, keeping the quoted locator text.
3. **08333** (line 53, trailing `docs/specs/runner.md` with no locator in the same parenthesis).
   - The default under L12-26(1) is the exact file or portal for a whole-file reference. The runner candidates `docs/platform/runner/spec.md` or `docs/platform/runner/README.md` exist. The pull-door content sits in runner subcomponent RUL18 and RUL30.
   - Correction: patch to the runner spec or portal. Park only if the author names a concrete missing passage. None is missing here.

Count: 3 of 8 edges require correction. The file diff must grow from 1 hunk to 3 or 4 hunks. Line 53 is one physical unit, so 08332 and 08333 share a hunk header, as does line 51.

---

## docs/specs/workflow.md (digest ff97bdc6...): rework

New AGENT-WF file. L12-27 requires its content to be carried into the candidate tree before `docs/specs/**` retires. No candidate exists: `git ls-tree` finds no workflow spec under `docs/platform`. D-ADR0070 and RUL-WF appear only in `docs/specs/*` and in `component-boundary` and `reading-map`.

Verified as correct:
- 08379 patch:
  - Hunk `@@ -667,7 +667,7 @@` covers line 670.
  - The relative target `../platform/work-state/spec.md` resolves from `docs/specs/`.
  - Label and destination move together, and the `(0027)` locator is kept.
  - 0027 lives in work-state `decisions/retired-decision-history.md`, and the link is the lifecycle pointer, so the spec is the right destination.
- 08380 preserve (`../platform-foundations.md`):
  - It is a retained root authority. The alias table is empty, and the L12-26(3) preserve keeps the prefix and label.
- 08376 park (line 78, `docs/specs/runner.md` named as a live physical identifier "kept until a separate L10 step"):
  - This is a legacy-tree sentence and class-6/9 parking is acceptable.

Defects:

1. **08375** (line 12, `[runner.md](runner.md)` in the status banner: "D-ADR0070 supersedes part of 0048 §2 and 0049 §4 of runner.md").
   - The 0048 and 0049 locators resolve in the candidate: `docs/platform/runner/decisions/h-36d872fbb0e5.md` lines 1530 and 1541.
   - The only absent item is the D-ADR0070 record itself, and the banner cites 0048/0049 as the locators.
   - Correction: either patch the link to `h-36d872fbb0e5.md#<0048 heading slug>`, or keep it parked with a blockedReason that names what is missing. The current blockedReason and dependency are generic and name nothing specific.
2. **08377** (line 632, "Record chính thức ở 'Lịch sử quyết định' của runner.md").
   - Parking is right. `D-ADR0070` is absent from every `docs/platform/runner/**` file, and the main-refresh accounting exception covers this.
   - Correction: the dependency must name the real blocker, "D-ADR0070 record absent from candidate runner decisions". The current text is the generic "Step 3 exact passage/row decision; Step 5…; Phase 9 approval".
3. **08378** (line 669, `[runner.md](runner.md)` with locators 0047/0048/0049, RUL84, RUL89, RUL94 and RUL95).
   - Parking is defensible because the locators span `runner/decisions/h-36d8…` and the runner business-rules subcomponent, and the "current spec of Workflow" has no candidate.
   - Correction: the dependency must say "no single exact file covers the locators; workflow carry pending". It must not use boilerplate.
4. **Record-level.** The authoring request says to keep the workflow-carry dependency explicit. The workflow.md record states the carry obligation nowhere, neither in `dependency` nor in `checks`. It exists only in progress.md and L12-27. Correction: add an explicit "Phase 9: carry docs/specs/workflow.md before docs/specs/** retires; no delete-without-carry" statement to the record, or to the parked edges' dependency.

Count: 08375 is the only edge that may need a patch. 08377 and 08378 need accurate dependencies.

---

## docs/specs/work-state.md (digest 499ec683...): rework

Diff is empty and 36 edges are dispositioned. Verified as correct:
- Preserves of `docs/coexistence.md` (08339, 08345, 08346, 08348, 08352):
  - The path exists, the alias table is empty, and L12-26(3) applies.
- 08340 preserve:
  - `docs/history/<feature>/` is a placeholder.
- 08343, 08344, 08347 preserves:
  - The targets exist: `docs/history/tsk-483-list-side-log-pagination-scoping/CONTEXT.md`, `docs/distillery/deep-dives/tool-registry.md` and `docs/history/session-claim-liveness/CONTEXT.md`.
  - For 08343 the wrapped path spans lines 692 and 693, and both spans are kept.
- 08350 preserve (line 1329, `docs/decisions/`):
  - It points to the retained directory that holds `index.md`.
- 08353 and 08354 parks (line 1362):
  - These are checker scan-scope statements, which are behavioral Step 5 per L12-26(9).
- 08356 to 08374 preserves:
  - All are inside the "Lịch sử quyết định retired từ docs/decisions/" region (line 1364 onward). They are decision bodies, audit lists, dated claims and line-range citations, so L12-26(5) applies.

Defects:

1. **08355** (line 1362, "(per `docs/specs/decision-citation-drift.md`)").
   - The reason claims "no exact live destination at this committed tree". That is false: `docs/platform/decision-citation-drift/spec.md` exists (plus README.md).
   - It is a plain pointer to the spec that documents the checker, so L12-21/L12-26(1,7) apply.
   - Correction: patch to `docs/platform/decision-citation-drift/spec.md`, Phase 9. The file then has a one-hunk diff, and this line is a live Pointers entry, not history.
   - If the author means the whole sentence is one Step-5 behavioral scope unit (08353/08354), the reason must say that explicitly and must not claim a missing destination.
2. **08342** (line 95, `docs/how-to/x.md`).
   - This is an illustrative example value ("vd `docs/how-to/x.md`") for the free-form `docPath` field. It is neither a reference nor a broken link.
   - `docs/how-to/*` is a retained root, so the correct disposition is preserve, with the example/placeholder rule.
   - The parked reason "needs successor lookup" invents a dependency that does not exist.
   - Correction: change to preserve, matching how the author treated the sibling example `docs/history/p50-workflow-induct/` (08341).
3. **08349** (line 1324, `docs/history/install-coexistence/reports/canary-run.md`) and **08351** (line 1331, `docs/history/store-atomic-rmw/`).
   - Both sit in live Open Gaps, and the reason claims "retained evidence/source".
   - Neither path exists at the author pin, and `git log` shows neither ever existed under `docs/history/`. They are pre-existing broken links, not relocation breaks.
   - Correction: the reason text is factually wrong. It must state that the target is absent at the pin and never existed (L12-26(10) pre-existing broken, for the Phase 9 baseline). The disposition (preserve or park) is a Lead judgment, see below. Likewise 08341's `docs/history/p50-workflow-induct/` does not exist.
4. **08367 and 08368** (lines 2069 and 2107, `docs/reference/triage-table-columns.md`).
   - These are in a history region, so preserve is right (L12-26(5)).
   - The target moved to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md` (commit 126a8ae51).
   - L12-26(2) says moved targets get a non-executable successor note. The reasons omit it.
   - Correction: add the successor note and keep the spelling.

---

## Authoring-rule gaps needing Lead judgment (not defects)

1. **Boilerplate parked reasons.** All parked edges in these three files carry the same generic blockedReason and the same dependency string. The Lead rule requires the real, smallest missing dependency to be named. Decide whether a mechanical check should reject identical-boilerplate dependencies. Edges where I saw a specific blocker: 08377 (D-ADR0070 record), 08378 (multi-locator, workflow carry), 08354 (P8-DOC-GAP-02 and workflow carry, which the record already names).
2. **Pre-existing broken targets (08349, 08351, 08341).** The author parks 08342 but preserves 08349, 08351 and 08341. The rule for a reference to a never-existing target is unclear. Choose preserve or park once and apply it to all four.
3. **Patching docs/specs/workflow.md in place (08379).** The file must be carried into the candidate tree before `docs/specs/**` retires, and it will be at a different directory depth. Decide whether the carried copy takes the patched text or the original text, because `../platform/work-state/spec.md` is directory-relative.
4. **Candidate headers.** The "Carriage only / Canonical: No" header on the target files (runner `operations/h-51f5cd7279fd.md`, `decisions/h-36d872fbb0e5.md`, `distillery/spec.md`, `work-state/spec.md`) is area candidate status, per your ruling. I relied on that for the defects above. If you rule any of these files carriage, 08331 to 08333 revert to parked.

---

## Per-set accounting (my files only)

- batch-041, my 3 of 4 files:
  - Files reviewed: 3.
  - Files with required semantic correction: 3 (work-state, workflow, system-overview).
  - Edges reviewed: 50.
  - Edges needing a changed disposition or reason: 3 of 8 (system-overview) and 1 to 3 of 6 (workflow, with 08375 the only potential patch).
  - Edges needing a changed disposition or reason in work-state: 08355, 08342 and 08349/08351 (reason text), plus the 08367/08368 successor note.
- The set's fourth file, runner.md, is outside this review. The batch-041 numerator is incomplete without it.

Status: DONE
Summary: All 3 files (50 edges) reviewed in context against the author pin; all 3 require rework. The main defects are system-overview 08331 to 08333 parked although exact candidate targets exist, work-state 08355 parked with a false "no destination" claim while `docs/platform/decision-citation-drift/spec.md` exists, and a set of inaccurate preserve and park reasons for non-existent targets.
