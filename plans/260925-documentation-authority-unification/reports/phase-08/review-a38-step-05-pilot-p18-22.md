# Review: Step 5 pilot parts 18-22 (setup/doctor seam, trailing files + seam receipt)

Reviewer scope: payloads step-05-pilot-p18..p22 at input aa8d343746a2. Pinned source read through `git show aa8d3437:<path>`. No checker, test or CLI was run.

Slices seen
- p18: run-supervisor-checks (45 of 85 tuples), shell-rc (record metadata plus all 10 tuples), skill-wrappers (3 refs, 59 tuples).
- p19: skill-wrappers (136 tuples).
- p20: skill-wrappers (25 tuples), terminal-control-checks (35), workflow-pool-independence (39).
- p21 + p22: no file records. They are 8 text fragments (7 + 1) of ONE item, the `setup-doctor-roots-pilot` receipt (2357 chars of fragment index, 8 fragments, JSON). I reassembled all 8 fragments and parsed the receipt. Nothing is missing.
- Complete tuple sets were read from the canonical record file (`step-05-records/setup-doctor-roots.jsonl`) so each file's verdict covers every tuple: run-supervisor-checks 85, shell-rc 10, skill-wrappers 220, terminal-control-checks 35, workflow-pool-independence 39. Together that is 389 tuples.
- src/setup/registrations.mjs final slice: not present in my payloads. Only its receipt rows (3 intentionalDeltas) appear. I checked them for receipt consistency only (see Receipt).

Mechanical checks I ran myself (read-only, in scratch)
- Every `currentPassage.text` and every reference `passage` equals the pinned file lines `startLine..endLine`: 387 of 389 tuples and 3 of 3 refs match. The two mismatches are the defects below.
- Census completeness (step-02l-census-class6.json at its own input pin): edges per file are 0/0/3/0/0, and dynamicConstructions are 85/10/220/35/39. These equal the record counts, so no reference or tuple is missed or extra.
- Receipt currentInputs: all 26 sha256 and byte counts equal the pinned blobs. candidateInputs sha equals each record's expectedAfterSha256 for all 26. The only record with a diff is registrations.mjs.
- Log `step-05-pilot-light-tests.log` hash equals the receipt (a9c6d890...), with 84 tests, 84 pass, 0 fail.

## Per file verdicts

### src/setup/run-supervisor-checks.mjs (seam setup-doctor-roots): REWORK
- Reviewed: 85 tuples (0 literal refs). 84 REJECT/preserve, all confirmed (runtime messages, socket dir, `.fgos` paths, `loadGlobalConfig`; none read or write a documentation file). 1 ADMIT/parked.
- DEFECT D1 (outcome: wrong admit, wrong park). `dynamic-014965`, originalTuple line 265 col 14..214, the `the release that wrote it was removed (${hostBin} is gone) ...` template.
  - The record's `currentPassage` (startLine 265) quotes text that does NOT exist at the pin. Pinned L265 is `const { hostBin, payloadRoot } = JSON.parse(...)`.
  - The code was rewritten after the census pin. `git diff 42edba2b..aa8d3437 -- src/setup/run-supervisor-checks.mjs` shows the old single-host message became a two-source message at pinned L275-276: `(${gone.map((p) => `${p} is gone`).join(', ')}) ... restore them at those paths, then run "fgos doctor --fix" again`. `currentLine: null` and `caller.line: 1 "module declarations / data"` are placeholders.
  - Both the old and the current message carry no documentation-location operand. It is the same kind as the 58 sibling message rejects (for example L203, L305).
  - Rule: a rejected tuple names its actual non-document use (L12 rules, runtime-emitted strings). A park is for constructions that might touch documents. Parking this one is a false blocker on the seam (`blockedSeams: ["setup-doctor-roots"]`).
  - Correction: REJECT / non-document-message, relocated to pinned L275-276 with `currentPassage` set to the real text. If Lead keeps it parked, `currentPassage` must still be corrected to the real current bytes.
  - Receipt side: `proofCommand: "missing"` is wrong. An existing proof exists: `node --test test/setup/run-supervisor-checks.test.mjs`, whose L316 and L323 assert exactly the "removed ... is gone" text.
- Record-text note: passages of dynamic-014965 are from the old pin; see D1.
- Literal ref the census does not carry: header comment L2 cites `docs/platform/run-supervisor/spec.md`. It is a current path outside the legacy roots in the census, exists at the pin, and is not a defect.

### src/setup/shell-rc.mjs: ok
- Reviewed: 10 tuples, all REJECT. They are rc-file names (`.bashrc`/`.zshrc`, Windows `Documents/.../Microsoft.PowerShell_profile.ps1` profiles), the source-line regex, and the "refusing to create rc file" message. Whole source read: none reads a doc. `CONTEXT.md` at L2 is a bare filename in a comment, not a path.
- No refs. Diff null, expectedAfter equals source sha: correct.

### src/setup/skill-wrappers.mjs: REWORK (one defect, plus notes)
- Reviewed: 3 literal refs plus 220 tuples.
- 3 refs (reference-003859/003860/003861 = class6-l-000406/000407/000405) are REJECT/preserve in comments citing `docs/history/...CONTEXT.md` / `DISCUSSION.md`. Each target exists at the pin, and each passage equals the pinned bytes. The author's rule is history/design/contract evidence citation in a source comment; it is correct and I confirm it.
  - Passage for 003860 originalSourceSpans says line 1101 and currentSpan 1114. The pin shows the `docs/history/...` citation at L1114, matching the current span (the file did shift 13 lines).
- Tuples: 54 REJECT (47 messages, 7 scalar/thread). All verified: wrapper content, TOML text, validation errors, `commands/fgos/${verb}.toml`, `./${rel}`, `domains/${name}`. None contains a documentation pointer.
- 166 ADMIT/parked (165 instruction/generator + 1 unresolved). The 165 cover `core/skills`, `domains/*/skills`, `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`, `.gemini/extensions/fgos`, `_shared` fragments, `SKILL.md`/`GEMINI.md` outputs. These are skill and generated-output surfaces, which are the generators/projections seam. A park (no diff authored, no generated edit) is conservative and consistent with the L12 rule that generated outputs are never hand-patched. I do not call these wrong admits. Confirmed none is a patch candidate.
- DEFECT D2 (outcome). `dynamic-015060`, originalTuple line 1075, the `<!-- Generated by fgOS skill assembly from ${sourceRelativePath} (npm run build:skills ...) -->` header. Same pattern as D1.
  - The record's `currentPassage` quotes the pre-change text. The pin diff shows the header became `${ASSEMBLED_HEADER_PREFIX}${sourceRelativePath} (npm run build:skills in the fgOS source repo). ...` at pinned L1078, with a new constant `ASSEMBLED_HEADER_PREFIX` at L1073.
  - The header text names a source skill path and a build command, no documentation location. `currentLine: null` and `caller "module declarations / data"` are placeholders.
  - Correction: REJECT / non-document-message (or, if kept parked, give the true current passage at L1078). `proofCommand: "missing"` is wrong: `test/setup/skill-wrappers.test.mjs` exists (172 KB, 60 hits on assembleSkills/generateGeminiSkillPackage/withGeneratedHeader).
- Record-text notes:
  - The 165 parked tuples all carry `blockedSeams: ["setup-doctor-roots"]` while the blocker text names the "owning generators/projections seam". The blocker should name that other seam, otherwise the park looks self-referential. Lead judgment (see Q2).
  - Several `rejectedAsUnrelatedReason` strings are double-escaped and garbled ("It formats values at export function generateGeminiSkillPackage(...) {; contains no ..."). Harmless but unreadable.
  - New post-census code at pinned L1100-1111, `carriesAssembledHeader`, reads `.md` files under `.agents/skills`. It is not in the frozen census and is non-doc (generated skill tree). No record entry needed, but the receipt should note post-census additions exist in this file.
- Diff null, expectedAfter equals source sha: correct for a park-only file.

### src/setup/terminal-control-checks.mjs: ok
- Reviewed: 35 tuples, all REJECT (23 messages, 8 infrastructure, 4 scalar). I read all of them in context: `.fgos` state-root/`terminal` dir, herdr anchor pane message, route/capability diagnostics. None targets a documentation file.
- Comment L2 cites `docs/platform/terminal-control/spec.md` (current, exists, outside census).
- No refs; diff null: correct.

### src/setup/workflow-pool-independence.mjs: ok
- Reviewed: 39 tuples, all REJECT (17 messages, 17 infrastructure, 5 scalar). Roots are `core/workflows` and `domains/*/workflows` (workflow definitions, YAML/JSON, not documents). All strings are diagnostics. Source contains no `docs/` or `.md` text.
- Post-census delta (a `debate` pattern and a comment) is non-doc and does not affect any tuple.
- No refs; diff null: correct.

## Receipt (parts 21 + 22, setup-doctor-roots-pilot)
Structure and ids verified (26 current inputs, 26 candidate inputs, 3 intentionalDeltas, 0 unexpectedDeltas, 3 proofs, 5 blockedBy). Consistency checks passed (see mechanical checks). Findings:
- OK: the 3 intentionalDeltas match the 3 diffs in the registrations record (class6-l-000378 L3518, -000355 L2094, -000351 L874) and each cites a registry path, docId, sha and the claim that the alias is lookup-only, never a writer. `oldPointer`/`newPointer` pairs are the only deltas.
- OK: proof 3 "missing" for the state/inventory export and the final recursive post-retirement scan-set parity is correctly kept as missing. candidateOutputSet `finalScanSets: null` and `sourceStateExport: null` are correctly kept as unknown rather than invented.
- NOTE R1 (receipt field): proof 1 lists registrations/checks/instruction-registry/knowledge-doctor tests only, and nothing in the receipt names the existing owning tests for this slice: `test/setup/run-supervisor-checks.test.mjs`, `skill-wrappers.test.mjs`, `terminal-control-checks.test.mjs`, `workflow-pool-independence-check.test.mjs`, `shell-rc.test.mjs`. The two parked-file tuple obligations (D1, D2) carry `proofCommand: "missing"` although a proof exists. Because no patch lands in these files, this does not change any disposition, but the receipt should name them (or the parked rows should drop "missing").
- NOTE R2 (record text): candidateInputs provenance says "Full current-file diff in canonical file record; unapplied Phase 9 specification" for 25 files that carry no diff. It should say "unchanged: expectedAfter equals source sha".
- Proof 2 is marked "pass" with real log and hash (84/84). It proves current-root discovery, not cutover: acceptable as labeled.

## Counts
- Files: 5 reviewed in full (run-supervisor-checks, shell-rc, skill-wrappers, terminal-control-checks, workflow-pool-independence); registrations.mjs and 20 other receipt inputs only at receipt level.
- Refs: 3 reviewed, 3 correct (all REJECT/preserve).
- Tuples: 389 reviewed. REJECT 222, ADMIT/parked 167 (165 correctly parked as instruction/generator; 2 wrongly parked: D1 and D2).
- Outcome defects: 2 (D1, D2). Both are wrong admit plus stale current passage.
- File verdicts: ok 3 (shell-rc, terminal-control-checks, workflow-pool-independence), rework 2 (run-supervisor-checks, skill-wrappers).
- No Phase 9 diffs exist in my five files; none edits a generated output.

## Lead-judgment questions
- Q1. For D1 and D2: reject them as non-document-message (my recommendation, consistent with 58 sibling rejects), or keep as park but fix the stale `currentPassage`? Either way the passage fields must reflect pinned bytes.
- Q2. Should the 165 generator parks name the generators seam in `blockedSeams` rather than `setup-doctor-roots`, so the blocker is traceable to the seam that will actually resolve it?
- Q3. Should the receipt carry a line for post-census code additions inside frozen-census files (skill-wrappers `carriesAssembledHeader`, workflow-pool `debate`)? None is document-related here, but the same situation produced D1/D2 elsewhere in the queue.

Status: DONE_WITH_CONCERNS
Summary: Reviewed 389 tuples, 3 refs and the reassembled setup-doctor-roots receipt (p21/p22); 3 files ok, 2 need rework for two stale-passage tuples that should be rejects (dynamic-014965, dynamic-015060), plus receipt proof-naming notes.
