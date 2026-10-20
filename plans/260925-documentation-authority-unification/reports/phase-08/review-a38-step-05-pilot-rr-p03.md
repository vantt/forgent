# Step 5 pilot bounded re-review, part rr-p03

Payload: `step-05-pilot-rr-p03.json` (32 records, input pin aa8d34374). Read-only. I ran no checker, probe, test or CLI. I did my own scratch string checks on pinned bytes (column spans, window bounds, hunk old/new lines, sha256 of the target docs and registry).

## Verdicts

| File | Seam | Verdict | Records reviewed |
|---|---|---|---|
| src/setup/instruction-registry.mjs | setup-doctor-roots | ok (record-text notes) | 12 changed tuples |
| src/setup/model-pool-checks.mjs | setup-doctor-roots | ok (one record-text note) | 2 changed tuples |
| src/setup/registrations.mjs | setup-doctor-roots | ok (Lead-judgment questions) | 18 references: 8 changed outcomes, 10 unchanged context |

Slices seen:
- instruction-registry.mjs: only the 12 reject tuples in this part (dynamic-013991, 013992, 014003, 014006, 014007, 014008, 014016, 014017, 014018, 014026, 014027, 014028). The other changed ids (013969, 013982, 013988-013990) are in other parts.
- registrations.mjs: only the references in this part. The changed dynamic tuples (014207, 014299-014302, 014307, 014338, 014345, 014346, 014907) are in other parts. I read their records in the setup-doctor-roots JSONL for consistency only. They are not part of this verdict.

## OUTCOME defects

None found.

## What I checked

### instruction-registry.mjs, 12 ADMIT/preserve to REJECT/preserve

- Every pinned passage text equals the pinned source. Every ±40 window is correct; the last three are clipped at EOF 736.
- 013991 and 013992 are JSDoc option lines (`domainsRoot` and `manifestPath`, source lines 592-593). They are comments, not an operation, and cannot hide a behavior change. The real operands are the `options.domainsRoot ?? path.join(projectRoot, 'domains')` constructions, which are other records.
- 014003 (`idToPaths = new Map()`) is an accumulator. The paths it collects come from the scan roots, which are separate admitted records.
- 014006, 014007, 014016, 014017, 014026 and 014027 are `rootType` and `rootOwner` labels. Source lines 244-280 show them only as scope, authority and owner-mismatch logic. They build no path.
- 014008, 014018 and 014028 (`fgosDir: options.fgosDir`) are a state-directory pass-through to `readDecisionIds` -> `listWork(fgosDir)` at lines 98-105 and 358. The documentation read there is `docs/decisions/index.md`, a generated output that is its own admitted record (013969, other part). It is not touched here. Reject is right: this is state, not a document location.
- The rejections stay inside the generated-output rule and the preserve disposition. Nothing hides a behavior change.

### model-pool-checks.mjs, 2 ADMIT/parked to REJECT/preserve

- 014060 re-anchors to pinned line 131. It is `missing.map(...).join(', ')` inside a warning, and the message names only `fgos dispatch explain`, a command.
- 014072 re-anchors to pinned line 167. It is `parts.join('; ')` in a warning, with no doc path.
- Both are diagnostic formatting. Zero parks remain in the file. The only doc-shaped literal in the file is the runtime `SKILL.md` probe at lines 78-79, outside the windows and not a legacy root.

### registrations.mjs

The span columns of all 18 references equal the pinned text (1-based start, exclusive end). All windows are exactly ±40 lines.

**Patches 003804, 003806, 003811.**
- Spans: 3518:96-133, 2094:109-158, 874:142-174.
- The diff has exactly three hunks (871, 2091, 3515). Each old line exists in the pinned source at the stated line. Each new line differs only by the pointer substitution.
- None of the hunks overlap a parked passage (3915-3962, 4193).
- The three old docs/how-to paths are absent at the current worktree, so the messages point at nothing today. That makes the patches real corrections.
- The three targets exist. Their sha256 equal the record's targetSha256. The registry sha256 (aeba8c2c...) equals the pinned `docs/doc-registry.json`. The registry shows each old path as an alias of the currentPath, so alias use is lookup-only. No writer destination uses an alias.
- Test co-cut is complete at the pin. `git grep -F` over test/ gives:
  - no match for cut-a-fgos-release-tag or write-a-task-spec;
  - for resolve-an-events-jsonl-truncation, only test/setup/checks.test.mjs:342 (a test title carrying the full path) and :381 (a basename regex that stays green after the patch).
  - Line 342 is the single patched test line, with a forward and a rollback diff.
  - 003804 and 003811 carry the same file-level coCutPaths (CHANGELOG.md and checks.test.mjs) even though their own pointers have zero hits. This is consistent, because they share one atomic diff.
- No other non-docs/plans file at the pin carries these three names besides CHANGELOG.md and README.md (Step 3/4 custody) and the truncation guard (another part).
- The proof field reads `missing` for exact-output parity. The existing `node --test test/setup/checks.test.mjs` is listed in testTargets together with the missing-proof line. Correct.

**Parks 003803, 003828, 003829, 003833, 003834 (and 003839 by id; not in this part).**
- These were preserve and are now parked. They sit at line 3915 (the `docRegistryAdopted` existence test) and in `checkDocRegistryStale` / `fixDocRegistryStale` (3930-3931 read, 3961-3962 write).
- Each names a same-passage owner, a parked dynamic tuple: 014361/014362, 014367, 014376, 014369, 014378. I confirmed each tuple exists, is ADMIT/parked, and sits on the same line and literal.
- The park is justified. `docs/doc-registry.md` and `.json` are generated outputs of `computeKnowledgeProjection(view)`, and a retained pathname alone does not prove same-export or same-finding parity.
- The writer passages 3961-3962 are not patched, and no hand patch of a generated output is claimed.
- The file-level cutover diff touches none of these passages.

**003802 (inventory-data.json reader, 4193).** Unchanged. It is correctly parked, and the historical reader is real.

**Preserve context, unchanged (003805, 003807-003810, 003812, 003813, 003816, 003830).**
- 003805, 003807-003810, 003812 and 003813 are capability description strings that cite docs/history/... files. They are dated history and preserve is right.
- 003816 and 003830 are `docs/decisions/index.md` and `docs/doc-registry.md`, a generated output and a retained root. Preserve is right.

**Missed-reference scan.** I scanned every window for `docs/`, `.md` and `plans/` not covered by a reference record. The unrecorded hits are all non-legacy:
- `.md` suffix handling of task-specs at 888-904;
- README.md and CHANGELOG.md root readers (the root-reader tuples 014299-014302 cover them);
- `core/skills/_shared/capability-catalog.md` comments at 2431-2437.
- I found no missed legacy-root operand.

### Receipt corrections read alongside

- Instruction files: exactly six real files exist at the pin under core/instructions, components/packaging-distribution/instructions and domains/coding/instructions, with the recorded hashes. The marketing root is explicitly absent (`absentRoots: domains/marketing/instructions`) while marketing stays a manifest owner. Correct.
- Existing owning proofs are named as not-run, scoped as non-cutover acceptance. The post-census items (the 6659 workflow case-binding comment, `carriesAssembledHeader`, the debate pattern) are noted with no minted census id. Correct.
- The receipt lists the 84-test current-root suite as pass and the cutover exact-output proof as missing. Consistent with the records.

## Record-text notes (no outcome change)

1. **dynamic-013991 and 013992 caller.** Both name `discoverKnownOwners` (line 457) as caller. The JSDoc at 590-594 belongs to `discoverInstructionSources` (597). Rejection is still right. The caller field should read 597 for the next record refresh.
2. **014008, 014018, 014028 reject reason.** The generic "scalar metadata/guard/accumulator" boilerplate does not name the concrete non-document use, which is a state-directory pass-through into `listWork` for the decision-index check. Suggested reason text: "state directory handed to listWork; the only document read there is the generated decision index, owned by 013969".
3. **dynamic-014072 frozen tuple.** The tuple snippet reads `the lease still reads runner.providers; ...`, but the pinned line 167 reads `the lease reads runner.llmAccounts for a pool it declares and runner.providers for the rest; ...`. The frozen census pin predates the rewrite. The re-anchor is the same function and the same `parts.join('; ')` construct, so the outcome stands. A one-line "message text drifted since census pin" note would remove the apparent mismatch.
4. **Per-record `proofCommand: missing` on the three patch references.** This is correct for exact-output parity. The existing checks.test.mjs is named only inside testTargets. Naming it in `proofScope` would make the field self-explanatory.

## Lead-judgment questions

1. **Doc-registry messages stay preserve while their readers and writers are parked.** The emitted messages are 003830/003857 (3938), 003846/003858 (3967) and 003853 (4231, description). If the parked reader/writer later moves, these strings must move with it. Should the preserve rows carry a pointer to the park owner, or is the Step 7 composition step enough? I take the current outcome as acceptable because Phase 9 touches none of them today.
2. **The `looksLikeDocPath` predicate at 4131-4133** is named in blockedBy as co-cutting a later retiring-root rewrite. I did not see its own window in this part. Whether that wording is enough is left to Lead.

## Counts

- Records reviewed: 32 (12 + 2 + 18), plus cross-reads of 6 same-passage dynamic owners.
- Changed outcomes confirmed: 12 instruction-registry rejects, 2 model-pool rejects, 3 patches with expanded co-cut, 5 parks.
- Unchanged context confirmed: 10.
- Outcome defects: 0.
- Record-text notes: 4.
- Lead-judgment questions: 2.

Status: DONE
Summary: All 32 records in rr-p03 are ok. The three patches apply to pinned bytes with the full test co-cut, the doc-registry parks are correctly tied to their state-backed owners, and the 14 rejects are non-document operations. Four record-text notes and two Lead questions, no outcome defects.
