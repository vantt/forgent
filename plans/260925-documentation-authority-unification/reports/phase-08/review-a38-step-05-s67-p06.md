# Review a38 step-05 seam 6/7 part p06 (s4-src-p06)

Scope: 9 payload entries, 172 items reviewed (118 items + 54 author-added slots). Pins 5eb9dc609 (2 tests) and 97c9694a4 (ui-spec). Read-only; no checks, CLI or git writes. Pinned sources and live holders read through git / the review worktree.

## Per file

| File | Verdict | Items | OUTCOME defects |
|---|---|---|---|
| test/scripts/check-doc-candidate-status.test.mjs | ok | 94 (46 + 48 author slots) | none |
| test/docs/decisions-corpus-retired.test.mjs | ok | 35 (34 + 1) | none |
| .claude/skills/ui-spec/templates/spec.config.yaml | ok | 0 (no docs-mentioning passage; entry empty, no diff) | none |
| .claude/skills/ui-spec/tools/build.mjs | ok (record-text note) | 7 | none |
| .claude/skills/ui-spec/tools/config.mjs | ok (Lead question Q1) | 11 (10 + 1) | none |
| .claude/skills/ui-spec/tools/extract.mjs | ok | 5 (3 + 2) | none |
| .claude/skills/ui-spec/tools/interpret-wireframe.mjs | ok (Lead question Q1) | 8 | none |
| .claude/skills/ui-spec/tools/interpret.mjs | ok (Lead question Q1) | 8 | none |
| .claude/skills/ui-spec/tools/rename.mjs | ok | 4 (2 + 2) | none |

No OUTCOME defect found. All dispositions are defensible; the points below are record-text notes and Lead questions.

## Evidence per file

### check-doc-candidate-status.test.mjs
- L41 copyFileSync (reference-004586, reference-004589, dynamic-031770, dynamic-031771) is parked on "Phase 9 retention-or-move decision for docs/doc-governance.md". The four items agree. The source is a real read of repo docs/doc-governance.md. The destination is the tmp fixture copy, parked as the co-cut destination operand (L12-83 p07/p09 precedent).
- L94 (author-s67-governance-baseline-94) and L163 (author-s67-governance-baseline-163) are admitted and parked in the same governance unit. I confirmed in pinned scripts/check-doc-constitution.mjs L220-228 that governanceBaselineFields reads docs/doc-governance.md. I confirmed in pinned scripts/check-doc-candidate-status.mjs L96 that checkCandidateMetadata calls it unconditionally, so the stubbed readFile at L163 does not prevent the real read. Both blockers are specific to their passage.
- Every other docs-mentioning reject is a real in-memory fixture string:
  - classifyDocumentStatus and the switchboard literals at L24-27 are lookup keys only.
  - fixtureRoot and the tmp paths build files in an os.tmpdir() root.
  - git init/add act on that tmp root.
  - The scalar `repoRoot: root` is a tmp root.
- dynamic-031759 (L20) is a real read of the plans/ transitional-switchboard.json. Its label "plans-report-artifact" is true (DEFAULT_SWITCHBOARD_PATH is a plans/** path) and consistent with R11 and L12-83 p08/p10/p12. The L19 constitution read is the same class; it was not in the payload.
- No retired-decision citation is present in this file.

### decisions-corpus-retired.test.mjs
- The diff touches only admitted passages: NARRATIVE_TARGETS members at L47 and L49 and the L78 read. The inverse diff is exact. Items reference-004033, reference-004037, reference-004046 and dynamic-018741 are the patch items.
- Live-target check against the review worktree:
  - docs/platform/runner/decisions/h-36d872fbb0e5.md carries the same 35 `### 00NN` headings as docs/specs/runner.md (set difference empty both ways) and has `### 0032 — Cổng Iron Law`.
  - docs/platform/system-overview/spec.md carries the same 2 headings as docs/specs/system-overview.md.
  - Each holder has exactly one line matching `^## Lịch sử quyết định retired từ docs/decisions/ \(tsk-1lv-4\)$`. The L84-90 marker loop therefore holds for both rebound members.
- dynamic-018740 (L74) and dynamic-018744 (L88) are labelled patch but have no hunk of their own. That is correct: the printed text follows the array members already patched.
- All five parks are real and specific. I verified each by grep over docs:
  - Work-state (reference-004034, reference-004047, dynamic-018742): retired-decision-history.md has the same 12 ids but no marker line, and only `## 13. ADR 0032 Multi-Role Team Harness`. The test needs `### 0032 — Multi-role Team Harness`.
  - Foundations (reference-004040): `### 0001/0009/0014` etc. exist only in docs/specs/platform-foundations.md. docs/platform/platform-foundations.md has zero.
  - Architecture-map (reference-004035): `### 0010/0015/0017` exist only in the root file. docs/platform/architecture-map.md has none.
  - reference-004048, dynamic-018738 and dynamic-018743 (the generic readers and the marker regex) are consistent with those parks.
  - dynamic-018734 and dynamic-018735 (L31 DECISIONS_DIR) are parked on docs/decisions/index.md. The reader needs the directory itself (L62-65 asserts the directory exists), so the dependency fits.
- Per-member mixed outcomes inside one array are intended by L12-85 and are not an R7 violation, because the members are on separate lines.
- Header comments (reference-004029, reference-004043) have a tree-retires witness and dated provenance, which fits R8. Title/label rejects are fine.

### ui-spec tools (docs/ui-spec retained per L12-21/26)
- config.mjs: all admit/preserve with the retained-root witness. The L39 example text `./docs/ui-spec` (reference-000108) is runtime-emitted output, correctly admitted. The author slot for readFileSync(configPath) (L47) matches the 000350/000351 construction.
- extract.mjs: the three listSpecFiles operands (000363, 000364, 000365) and the two author slots (L68 read, L69 relative output) cover every fs operation in the pinned file. I grepped fs calls to confirm that no document-path operation lacks an owner.
- build.mjs: five output writes (000334, 000336, 000338, 000339, 000340) are preserved as hand-written source on a retained root. No generated output is hand-patched.
- interpret.mjs and interpret-wireframe.mjs: all fs operations (read at L73/L35, mkdir/exists/write at L763-767/L79-83) are covered by the tuples on the construction statements. Generated HTML is not patched.
- rename.mjs: the operations at L41, L57, L70 and L71 are covered (000429, 000433 plus the two author slots). The retained-root preserve is correct.
- No park or patch exists in the ui-spec files. This matches the "docs/ui-spec retained, no patch unless a contract requires" rule.

## Record-text notes
1. build.mjs dynamic-000341 (`r.join(",")`) and dynamic-000342 (`join("\n")`) name a pathOperand that is not a path. They are CSV text joins nested inside `writeFileSync(join(OUT,"action-registry.csv"), ...)`. The ADMIT/preserve outcome is defensible under R7 (same statement as 000340), but the pathOperand label is false. Suggested correction: name `join(OUT, "action-registry.csv")` as the path operand, or record them as nested content serialization of that write.
2. decisions-corpus-retired.test.mjs reference-004038 (the `docs/decisions/0000-index.md` title) carries successorNote `.../work-state/decisions/retired-decision-history.md`. The L12-85 p07 precedent for the retired 0000-index basename uses `docs/decisions/index.md`. The citation concerns the old hand-written index, not a work-state ADR. Please align the successor.
3. reference-004030 (L8 `docs/decisions/` comment) has treeRetires false and the reason "docs/decisions is retained with generated index.md" (L12-80). The sibling comment pointers on L2-3 (reference-004039, reference-004041) say "retention-or-move for docs/decisions/index.md is open, co-changes per R28". The same comment header carries two inconsistent witnesses. The outcome is identical (preserve), but 004030 may be missing from the R28 co-change slot list. 004039's witness also says treeRetires true for docs/decisions/index.md while the directory is proposed for retention, so make the wording consistent.
4. reference-004049 (the `docs/specs/<area>.md` title) lacks the "baseline title co-cuts with the owning test dependency" sentence that its sibling title rejects carry. This is cosmetic.
5. check-doc-candidate-status L163: the scalar `repoRoot: REPO_ROOT` (dynamic-031746, REJECT) and author-s67-governance-baseline-163 (ADMIT/park) sit on the same call. L12-85 explicitly keeps the scalar as a rejection and the call as the transitive reader slot. This is internally consistent, but a plain R7 reading would flag it. The tuple's nonDocumentUse should say that the transitive read is owned by the author slot.

## Lead-judgment questions
- Q1 (R5 root plumbing vs R6 admit): in the ui-spec tools the following are admitted as document operations:
  - config.mjs dynamic-000348 (`resolve(process.argv[idx+1])`) and dynamic-000349 (`parseRootArg() ?? findSpecRoot(process.cwd())`), which are root selection from caller data/cwd;
  - config.mjs dynamic-000352, interpret.mjs dynamic-000422 and dynamic-000428, and interpret-wireframe.mjs dynamic-000376 and dynamic-000382, which are console messages printing caller-selected root/output paths.
  R5 lists "resolve of a root / cwd" as scalar pass-through, and R6 says a message printing a path from caller data with no fixed document root is formatting (reject). Counter-argument: the compiler's only document root is docs/ui-spec, and the L12-85 source-grounded determination treats selected-root output as part of the chain. The disposition is preserve either way, so there is no outcome change; only the admit/reject label and the parity burden differ. I treated this as ok and ask Lead to confirm the intended class (admit with retained-root witness vs reject with scalar-pass-through).
- Q2 (reliance on candidate-only holder): the runner and system-overview patch targets declare "Canonical: No; candidate only; legacy authority retained". Bytes and headings verified equal, and L12-30(3)/R18 say candidate metadata does not override the region ruling, so I accept the patch. This is noted because the test would then depend on a non-canonical holder until promotion.

## Counts
- Entries 9; items reviewed 172.
- File 1 outcomes: 4 patch (reference-004033, reference-004037, reference-004046, dynamic-018741), 2 patch-derived diagnostic items (dynamic-018740, dynamic-018744), 9 parks (reference-004034, reference-004035, reference-004040, reference-004047, reference-004048, dynamic-018734, dynamic-018735, dynamic-018738, dynamic-018742, dynamic-018743, counted per payload).
- File 0 outcomes: 6 parks (004586, 004589, dynamic-031770, dynamic-031771, author-governance-94, author-governance-163); the rest are preserves with a nonDocumentUse.
- UI-spec files: 0 parks, 0 patches, all admit/preserve (retained root).
- OUTCOME defects: 0. Record-text notes: 5. Lead questions: 2.

Status: DONE
Summary: All 172 items in the p06 payload reviewed. No outcome defects; the decisions-corpus patch and its five parks are verified against live holders, the ui-spec retained-root preserves are consistent, and five record-text notes plus two Lead questions are listed.
