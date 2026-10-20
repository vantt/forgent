# Step 5 pilot review, parts 10-17 (setup/doctor seam), window method

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62. Seam: setup-doctor-roots. Records read from step-05-records/setup-doctor-roots.jsonl (5 file records for these parts; src/setup/run-supervisor-checks.mjs in p17 is outside my assignment). Payloads p10-p17 (about 3.1 MB) were not loaded. Method: python3 extraction per record (id, line, expression, admit/reject, disposition, reason, receipt fields), then source windows from the pinned blob. The three small files were read whole.

## Verdicts (one per file)

| File | Verdict | Refs | Tuples |
|---|---|---|---|
| src/setup/lock-record-checks.mjs | ok | 0 | 8 (8 reject) |
| src/setup/project-launcher.mjs | ok | 0 | 12 (12 reject) |
| src/setup/model-pool-checks.mjs | rework (minor) | 0 | 30 (28 reject, 2 park) |
| src/setup/instruction-registry.mjs | ok (record-text notes) | 3 (1 admit-preserve, 2 reject) | 106 (53 admit-preserve, 49 reject, 4 park) |
| src/setup/registrations.mjs | rework (minor to moderate) | 58 (3 patch, 1 park, 19 admit-preserve, 35 reject) | 851 (764 reject, 87 park) |

## Defects (outcome)

### D1. registrations.mjs, dynamic-014307 parked while its passage is patched (moderate)
- Source line 3518, `message: \`README.md recommends installing tag ... cut it per docs/how-to/cut-a-fgos-release-tag.md ...\``.
- Reference-003804 (same literal, same line) is ADMIT/patch and is hunk 3 of the file diff. The tuple is ADMIT/parked with "Cross-seam bounded consumer target proof pending".
- Rule: a live holder with the same passage means a patch, not a park. The record also lists dynamic-014307 in `parked[]`, which contradicts the diff that edits that passage.
- Correction: dynamic-014307 should be ADMIT/patch joined to reference-003804 (the same hunk). Drop it from `parked[]`. The proof status stays "missing".

### D2. model-pool-checks.mjs, dynamic-014060 and dynamic-014072 over-parked (minor)
- Both are parked with "no unique content relocation at current pin" and `currentLine: null`.
- The relocation is unambiguous. 014060 is `${missing.map((e)=>\`${e.cell}@${e.pool}\`).join(', ')}` inside the checkModelPolicyPools warning message, now at line 131. Its sibling dynamic-014061 on the same line is REJECT/preserve.
- 014072 is the `parts.join('; ')` warning in checkLlmAccountsVsLegacy. Its siblings 014065-014071 are REJECT/preserve.
- Both are plain diagnostic strings, and the file has no docs path outside a comment and the runtime skill-directory SKILL.md probe. The park only reflects that the pin text drifted from 42edba2b0.
- Correction: REJECT/preserve (non-document message/array serialization), re-anchored to the current lines. The file then has zero parks.

### D3. registrations.mjs, three tuples parked that are not document operations (minor)
- dynamic-014338 (line 3752) is a comment fragment, "directly: a directory with a committed". It is not an operation.
- dynamic-014345 is `new URL('./instruction-projections.mjs', import.meta.url)`, a source-module resolve.
- dynamic-014346 is `root = ${JSON.stringify(root)}`, a child-script template.
- Correction: REJECT/preserve with those named non-document uses. Over-parking is conservative and causes no behavior change. It does inflate the 87-park count and the blocker list.
- The `.fgos`, `events.jsonl` and `.git` path tuples inside the doc-registry doctor functions (for example 014316, 014366, 014424) are state paths. They are parked together with their function's state-backed reader. That is defensible as one unit, but it should say "state path, parked with the owning doc-registry check" rather than "document reader/writer".

### D4. registrations.mjs, wrong reject reason for root document readers (minor, classification)
- dynamic-014299/014300 (CHANGELOG.md, line 3465) and dynamic-014301/014302 (README.md, line 3497) are REJECT with the boilerplate "belongs to installation/runtime health".
- They are real document readers: the doctor reads the repository CHANGELOG.md and README.md, and extracts the Unreleased section and the pinned install tag.
- A reject must name a concrete non-document use, and none is named. A missing doc cue is not enough.
- Correction: ADMIT/preserve with the retained-root evidence (root file, no move). The outcome (no change) is the same, but the reader set is then complete for the root-document readers.

## Passed checks

- **Diff apply and rollback.** `patch` in my scratch dir against the pinned blob (sha c47a007f...) applies cleanly to the whole file. The result hashes to expectedAfterSha256 e5a0579e.... The rollbackDiff restores the file byte-identical. The three hunks (lines 871, 2091, 3515) change only reference-003811, 003806 and 003804. No generated output is touched.
- **Patch targets and aliases.** All three docs/knowledge/... targets exist at the pin, with hashes equal to the record's targetSha256. The three old docs/how-to/... paths do not exist at the pin, so the messages today point at nothing. The patches are real corrections, and alias lookup is used only for pointer evidence, never as a writer destination.
- **Message-assertion tests.** No test asserts these message strings (grep of test/ and src/). The only match is the title of test/setup/checks.test.mjs:342, which is a title not an assertion. The CHANGELOG Unreleased co-edit is correctly named as a coCut and prerequisite.
- **Comment rejections.** I read windows for these and found history or design commentary, not an operative read: 2114, 4028, 4301, 3209, 3063, 5287, 3699, 3704, 3753. At 4357 the coordination-examples check is retired (a stub returning passed) and the comment is stale.
- **Admit-preserve emitted text.** docs/history/... citations (003805, 003807-003810, 003812, 003813) sit inside `DEFAULT_CAPABILITY_SLOTS` descriptions. Dated history is preserved, and the targets exist. docs/doc-registry.* and docs/decisions/index.md are retained generator paths.
- **Parked reader.** reference-003802, the historical inventory-data.json reader (4193), is correctly parked, as are the instruction-registry decision-index tuples 014032-014035.
- **Rejects scanned.** I filtered all 764 registrations rejects for docs/.md/README/CHANGELOG/plans/specs cues (106 hits) and read them. Apart from D4, the hits are diagnostic text, skill and plugin render surfaces, task-specs/agents asset dirs, the active-release payload, trust stores and state paths.

## Record-text notes

- instruction-registry.mjs: reference-003799 and 003800 (the architecture-manifest comments at 583 and 450) are rejected under "history-design-contract-evidence". They describe the live read at line 458 (`path.join(projectRoot,'docs','architecture-manifest.json')`). Preserve is right because the manifest is retained, but the rule label is wrong: these are live-behavior comments, not history. They would move with the code if the manifest ever moved.
- instruction-registry.mjs: some admitted tuples are not roots, for example 013971 `containmentRoot = dir)`, 013988 `scope === scope)`, 014003 `idToPaths = new Map()`, and the docblock lines 013989-013992 (comments). All carry the same boilerplate construction. Harmless over-admission (all preserve), but inconsistent with the 49 matching rejects.
- registrations.mjs: the park reasons are one identical boilerplate across 84 tuples. The receipt blockedBy does cover it.
- For the seam receipt, proofCommand "missing" and the test-targets text correctly say no exact message-migration parity test exists.

## Lead-judgment questions

1. `looksLikeDocPath` (registrations.mjs 4131-4133, `startsWith('docs/') && endsWith('.md')`) is an operative root-shape predicate on sourceCaptureIds. It is not a literal reference or its own tuple. The surrounding dynamic tuples (014428-014434) are parked, so it is covered at function level. Should it be named explicitly in the park's cutover precondition for source-unreachable/conservation, so a future move of docs/ is not missed?
2. Comments citing docs/platform/holder-lock/spec.md (2289), docs/platform/run-supervisor/spec.md (2333) and docs/specs/workflow.md (6659) are not in the frozen census. All three paths exist at the pin, so this is census scope, not a defect. Flagged only because the records list these files as fully read.

## Counts

- Files 5. Literal references 61 (22 admit: 3 patch, 1 park, 18 preserve; 39 reject). Tuples 1007 (admit 148, of which 3 patch-eligible per D1; reject 859 plus parks above).
- Outcome defects: D1 (1 tuple), D2 (2), D3 (3), D4 (4 tuples, one rule). No hidden behavior-change-as-comment found. No missed generated-output edit.

## Timing and method

- Wall time for the five files was about 7 minutes of tool time. This included about 4 minutes for registrations (references, patch apply, 106-hit reject scan, 87 parks).
- Payload avoided: about 3.1 MB across p10-p17. Records read for these five files: 1.9 MB, of which registrations is 1.6 MB, parsed in python and never printed whole. Printed output was roughly 80 KB, plus about 1 MB of accidental source bytes from one over-broad git command.
- The window method worked for all per-reference and per-tuple judgments.
- Judgments that needed more than a local window:
  - D1: the cross-record join between tuple 014307 and reference-003804 (same line, different record array).
  - Diff apply and rollback: the whole pinned file, not a window.
  - The 106-hit reject scan: whole-file census-versus-grep comparison to find uncovered doc-shaped lines (4132 and the comment citations).
  - Park classification (state-backed or not): function-level context, for example whether `.fgos`/`events.jsonl` belong to the doc-registry state readers.

Status: DONE_WITH_CONCERNS
Summary: three of five files are ok; model-pool-checks and registrations need minor-to-moderate rework (D1 to D4). The registrations patch applies and rolls back byte-exact.
