# Review a38 step 05, seam 5 batch 7, part p08

Payload: s4-src-p08.json, 73 files, all judgment-batch-7, no diffs, no parks, no crossSeamChangedOnly entries.
Items present: 10 files carry items or author-added references (doc-rationale, observe-doctor-checks, readme-tag-check, fgos-coding-knowledge, backward-compat, events-legacy-absence, state-cutover, guide-schema, seats, units-runner). The other 63 files carry no items in the payload (non-docs rejects omitted by design).

Counts: 67 dynamic items + 63 author-added references = 130 items reviewed (the 66 doc-rationale, 21 units-runner/guide-schema/state-cutover/knowledge dynamic items and all admitted ones read against their pinned passages). ADMIT 17 (1 real-document-reader, 14 document-path-comparison, 2 comment-provenance), REJECT 113, all preserve. OUTCOME defects: 0.

## Per file

- test/scripts/doc-rationale.test.mjs: ok. 70 items (25 dynamic, 45 author-added), all REJECT config-or-metadata or scalar-pass-through. The file has no fs/git reads at all (grep for readFile, existsSync, REPO_ROOT, execFile, writeFile returned nothing); docs/old.md, docs/platform/new.md, AGENTS.md and docs/platform/component-boundary.md are in-memory fixture strings fed to generateBindingRationale / checkLegacyRationale / describeBindingLinks. Rejects are true.
- test/setup/readme-tag-check.test.mjs: ok. 1 item, ADMIT real-document-reader, pathOperand path.join(REPO_ROOT,'README.md') really reads the repo README.md and matches /#v\d+\.\d+\.\d+/. Preserve is justified: README.md is a retained root file (owner-answers L12-69 area: retained roots outside docs/specs and docs/architect stay in place), no retiring-target witness is used.
- test/skills/fgos-coding-knowledge.test.mjs: ok. 9 items (8 dynamic, 1 author-added). docPath literal at line 33 and dynamic 037262 are one ADMIT/preserve outcome (the fixture path is the input to doc reserve / knowledge attest in a temp repo). The other items are commands or fixture writes, preserve. The fixture path is shaped by the production registry rule `value.startsWith('docs/')` (src/state/knowledge-registry.mjs:77); Step 4 preserves that source line, so no co-patch is owed.
- test/state/backward-compat.test.mjs: ok. 2 author-added: line 16 comment `--refs docs/spec.md` ADMIT comment-provenance preserve (dated recipe, immutable fixture log); line 79 `refs: ['docs/spec.md']` is expected event data, REJECT config-or-metadata. Different passages, both preserve.
- test/state/events-legacy-absence.test.mjs: ok. 1 author-added, ADMIT comment-provenance for the docs/history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md citation. docs/history is retained (Step 4 preserves the docs/history convention), dated history preserves.
- test/state/state-cutover.test.mjs: ok. 2 dynamic (038625, 038626), REJECT non-document-fs-probe, preserve. Outcome is right (the paths are in a throwaway repo, docs/history stays retained). See record-text note 1.
- test/workflow/guide-schema.test.mjs: ok. 2 dynamic, units.json fixture file in a temp dir plus 'docs:write' capability strings; rejects are true.
- test/workflow/seats.test.mjs: ok. 14 items. 12 author-added ADMIT document-path-comparison (docs/note.md, a.md, b.md, policy.md are contextRefs inputs copied into expanded workflow units and compared against provenance.refs). Same-passage items agree (a.md and b.md on lines 58-59 and 67, policy.md on lines 99-112, all ADMIT/preserve). 2 dynamic label-join rejects (assert message strings) are true.
- test/workflow/units-runner.test.mjs: ok. 25 items (23 dynamic, 2 author-added). All rejects: unitsPath fixture json files in temp repos, `.fgos/workflow-runs|assignments|config.json` existence probes, bin/fgos.mjs path, 'docs:write' capability, 'docs-seeker' skill name, and the docs/résumé.md and docs/** write-scope strings (a writes-scope fixture inside a temp repo, no repo document read). True.
- test/setup/observe-doctor-checks.test.mjs: ok. 1 author-added docs/x.md is a unit.writes scope value in a fixture, REJECT config-or-metadata, true.
- 63 remaining files: no items in payload, nothing to review.

## OUTCOME defects

None.

## Record-text notes

1. fgos-coding-knowledge 037264/037265 (line 37, path.join(tmpDir, docPath) then fs.writeFileSync of a docs-shaped fixture) and state-cutover 038625/038626 (docs/history/heavy/plan.md in a temp repo) are labelled non-document-fs-probe. They do construct a documentation-convention path that production code consumes (knowledge-registry docs/ prefix; store.mjs checkPlanEvidence reads `docs/history/${id}/plan.md` from the item branch). The outcome (preserve) is unchanged because both conventions are retained sources, but a more exact label would be "fixture of a retained document convention" with the production reader named. Suggest naming src/state/store.mjs checkPlanEvidence in the state-cutover reason so a Phase 9 move of docs/history knows to co-patch.
2. fgos-coding-knowledge: admission differs between the docPath literal (ADMIT) and path.join(tmpDir, docPath) (REJECT) on neighbouring lines of one passage; same disposition, so only a label inconsistency.
3. doc-rationale reason text says "Old paths and fake digests are intentional data"; accurate, no change needed.

## Lead-judgment questions

None. If a Phase 9 change relocates docs/history or the docs/ prefix rule in knowledge-registry, state-cutover and fgos-coding-knowledge become co-cut consumers; today both stay preserved because Step 4 preserves the matching source lines.

Status: DONE
Summary: 130 items across 10 payload files reviewed, all preserve, no OUTCOME defects; three record-text notes about rejected fixture-path labels in state-cutover and fgos-coding-knowledge.
