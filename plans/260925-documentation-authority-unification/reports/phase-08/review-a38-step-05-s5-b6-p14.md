# Review a38 step-05 seam 5 batch 6 part p14

Pin 5eb9dc609. Payload s4-src-p14.json: 14 files, 162 payload items. No diffs, no parks, no coCutPaths in any file.

## Verdict per file

All 14 files: ok, no OUTCOME defects.

| file | items | verdict |
|---|---|---|
| test/scripts/project-agents.test.mjs | 1 | ok |
| test/setup/bin-discovery.test.mjs | 1 | ok |
| test/setup/capability-catalog-doctrine.test.mjs | 3 | ok |
| test/setup/checks-doctor-config.test.mjs | 7 | ok |
| test/setup/checks.test.mjs | 41 | ok |
| test/setup/helpers/setup-checks-harness.mjs | 11 | ok (record-text note) |
| test/setup/instruction-registry.test.mjs | 25 | ok (record-text note) |
| test/setup/knowledge-doctor.test.mjs | 24 | ok |
| test/setup/plugin-marketplace-doctor-check.test.mjs | 1 | ok |
| test/setup/registrations.test.mjs | 4 | ok (record-text note and Lead question Q1) |
| test/setup/skill-wrappers.test.mjs | 7 | ok |
| test/skills/fgos-mirror.test.mjs | 1 | ok |
| test/state/awaiting.test.mjs | 3 | ok |
| test/state/cleanup-harness.test.mjs | 33 | ok |

Counts: 162 reviewed. 33 admitted (all preserve: 30 docs/history or docs/architect comment pointers and test titles) plus the rest judgment rejects. No patch, park or render-join. Admission and disposition verified against pinned source for every item.

Admission/disposition checks that held:
- Every `docs/history/**` comment pointer admits and preserves (R16). Same-passage items agree.
- awaiting.test.mjs 005209/005210/005211 cite docs/architect/doing-coordination-redesign.md. They preserve as dated provenance with treeRetires witness. The only candidate holder, docs/platform/proposals/doing-coordination-redesign.md, is self-declared non-canonical (L12-80 P03), so preserve is right.
- Test titles 005169, 005173, 005174 preserve as baseline keys. They carry the explicit co-cut dependency on the owning reader (L12-81 S3). Title 005169 names a doc that no longer exists in the tree (live holder is docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md); preserving a baseline key is accepted.
- Rejects for `path.join(tmp|tmpDir|repoRoot=initRepo(), 'docs', ...)` are true non-document uses: tmp roots from mkdtemp/initRepo (R21). In-memory `docPath:`/`currentPath:` fixture values are pure data. The product reads under the tmp root. The decision-index path in the product source records is itself retained and preserved (generators-decision-index 009758/009761), so fixtures and product agree.
- skill-wrappers 036923-036927: the SKILL.md path is under domains/, the regex target set is a closed `expected` set of core/ and src/ paths, and the existsSync is on that set. No docs path is read, so reject is right. 005203 `run docs/README.md` is classifier input text, so reject is right.
- knowledge-doctor 005197/005198 (docs/history/.../reports under tmpDir) reject correctly: tmp-rooted writes; same outcome (preserve) as an admit would give.

## OUTCOME defects

None.

## Record-text notes (no outcome change)

1. registrations.test.mjs dynamic-036304/036305 (L48, `new URL('../../docs/platform/packaging-distribution/contracts/setup-doctor-registry.md', import.meta.url)`): rejected with the label "In-memory fixture, root/script locator" and nonDocumentUse `config-or-metadata`. The URL feeds `fs.readFileSync(SPEC_PATH)` at L57, and the test asserts on the doc's "Today's registered ..." enumeration wording. The label is false. Reject can stand only on the R11 basis (docs/platform is not a legacy census root); reword nonDocumentUse/reason to say that. Same pattern is used elsewhere in the batch records for docs/platform paths (45+ rejects), so this is a batch-wide label issue.
2. instruction-registry reference-005196 (docs/architecture-manifest.json, a comment fixture note at L665): the reason says "docs/architect tree retires" and the witness carries `treeRetires: true`. The target is docs/architecture-manifest.json, a retained root path, not under docs/architect/. Preserve is right but the reason and witness text are wrong.
3. setup-checks-harness reference-005193 (docs/decisions, L68): the reason "preserved pending source-grounded S2 holder check" is a stale hedge, because the S2 audit is closed in L12-81. The pointer is to a retained root directory, so a plain retained-root preserve reason fits. Same stale S2 wording is on author slot knowledge-doctor-202-21 (a comment that merely names a fixture path).
4. Many rejects use nonDocumentUse `non-document-fs-probe` for tmp-rooted constructions of `docs/...` (for example checks.test.mjs 035204, 035209; instruction-registry 035994). The use is "test-owned scratch path under mkdtemp"; the label is imprecise, not false.

## Lead-judgment questions

Q1. Fixture coupling: docs/decisions/index.md is in the cutover move set (proposed alias docs/knowledge/decisions-index/decision-record.md). Titles 005173/005174 and about ten tmp-root fixture joins (checks.test.mjs L739-858, instruction-registry L351-403) pin that path in tests of src/setup/checks.mjs. The product records currently preserve the path, so there is no cutover change today. If Step 7 or Phase 9 ever moves the decision-index path, these fixtures and titles must co-cut with the product; no record here lists that dependency except the S3 title note. Accept as is, or add a co-cut note?

Q2. Payload gap: seven author-added ADMIT/preserve slots in this part's files are absent from the payload (author-s5-b6-checks-647-44 and six `author-s5-b6-knowledge-doctor-*` slots at L28, 29, 127, 184, 185, 202). I checked them against the record and pinned source. All preserve, and are consistent (647 is a title baseline key; the knowledge-doctor ones are fixture strings compared to emitted registry output, or a comment). No defect found, but they were not in the packed windows; confirm the packer should include author slots.

## Counts

Files 14. Items reviewed 162 (references and dynamic tuples). OUTCOME defects 0. Record-text notes 4. Lead questions 2. Items outside payload checked ad hoc 7.

Status: DONE
Summary: All 14 files and 162 items are consistent with the rulings; no outcome defects. Four record-text notes (docs/platform label, treeRetires witness, stale S2 hedge, imprecise labels) and two Lead questions (decision-index fixture co-cut, author slots missing from the payload).
