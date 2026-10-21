# Review a38 step 05, seam 5 batch 7, payload p04

Payload: 114 file entries. 11 carry items (160 items in total, counting author-added references); the other 103 carry none (checker-verified, omitted on purpose). No file has a diff or rollbackDiff. The only parks are 4 in check-doc-constitution.test.mjs.

## Per file

| File | Verdict | Items reviewed |
|---|---|---|
| test/scripts/check-doc-constitution.test.mjs | ok | 95 (47 items + 48 author-added; includes the 4 parks) |
| test/cli/execution-outcome-exit-codes.test.mjs | ok | 3 |
| test/cli/fgos-approve-6.test.mjs | ok (note Q1) | 2 |
| test/cli/fgos-approve.test.mjs | ok | 2 |
| test/cli/knowledge-verbs.test.mjs | ok (record-text note N1) | 32 |
| test/cli/run-verb.test.mjs | ok (record-text note N1) | 11 |
| test/docs/run-doors-doctrine.test.mjs | ok | 5 |
| test/helpers/playbook-observable-order.mjs | ok | 2 |
| test/install-packaging.test.mjs | ok | 1 |
| test/run-supervisor/support/direct-harness.mjs | ok | 3 |
| test/run-supervisor/support/terminal-harness.mjs | ok | 4 |
| 103 other entries, no items | not applicable | 0 |

## OUTCOME defects

None.

## Why the outcomes hold

**Parks in check-doc-constitution.test.mjs (reference-004651, reference-004659, dynamic-032029, dynamic-032030)**
- All four are on L713, one passage: `fs.copyFileSync(path.join(REPO_ROOT, 'docs/doc-governance.md'), path.join(root, 'docs/doc-governance.md'))`.
- That is a real byte read of docs/doc-governance.md, a path in the R26 move set. step-05-proposed-move-read-units.json lists the four ids as readers of that unit, proposed target docs/platform/governance.md.
- The blockedReason is specific: the source and destination expressions must co-cut with governanceBaselineFields and validateConstitution.
- The dependency names the Phase 9 retention-or-move decision.
- The literal pair and the dynamic pair share one outcome, and the co-cut unit is correct.

**Rejects in check-doc-constitution.test.mjs**
- The nonDocumentUse labels are true.
- docs/specs/*, docs/history/*, docs/platform/* and docs/reading-map.md literals are in-memory classifyPath, validRow or constitution-config values. No file is read through them.
- IDENTITY_REGISTRY_PATH and the constitution, vocabulary and schema paths all resolve under plans/260925-documentation-authority-unification (checked at the pin), so "plans-report-artifact" is true.
- The enforcedBy script paths are all scripts/*.mjs (checked in minimum-constitution.json), so the path.join(REPO_ROOT, by.path) copies are script copies.
- The `repoRoot: REPO_ROOT` pass-throughs hand a root scalar to the script. The script owns the doc-governance read and carries its own parked records.
- L660 `/docs\/specs\/reading-map\.md/` asserts text inside a plans-dir constitution note. That is dated, preserved history, so no patch is needed.

**Parks vs the R26 sweep**
- docs/doc-governance.md is the only moved path touched by this payload's tests.
- No other item in the payload reads, writes or asserts any of the 43 moved paths.

**test/docs/run-doors-doctrine.test.mjs (3 ADMIT items and 2 author-added AGENTS.md items, all preserve)**
- Real doctrine readers of AGENTS.md, core/skills, core/instructions, domains, .agents/skills, plugins/fgOS/skills and .claude/skills.
- No retiring docs/specs or docs/architect tree is walked.
- The Step 4 AGENTS.md patch (step04-009) changes only index lines, the D-ADR0030 pointer and the reading-map and distribution paths. It does not touch `## Dispatch` or the removed-door patterns, so preserve is safe.
- The generated skill copies follow their source, so no hand patch is involved.

**Rejects in the other files**
- Scratch and fixture paths (unit.json, my-unit.yaml, .fgos/config.json, .fgos/assignments/*, scratch.txt, fixtureRepo, direct-harness, terminal-harness) are true non-document uses.
- `docs:write` in those passages is a capability id, not a path.
- knowledge-verbs (docs/worktree-*/guide*.md) uses synthetic paths in a temp git repo. `doc register`, `doc reserve` and `doc promote` take arbitrary paths, so nothing there is a live holder. All 32 items are preserve.
- run-verb `--writes notes.md,docs/a.md` is scalar unit data. All 11 items are preserve.

## Record-text notes (not outcome defects)

- **N1 (admit/reject split)**
  - knowledge-verbs: L104 is ADMIT (`document-path-comparison`) while the sibling literals L102, L119, L134 and L149 are REJECT (`config-or-metadata`). All are synthetic `docs/worktree-*/guide.md` strings with disposition preserve.
  - run-verb: L243 `docs/a.md` is ADMIT while L238 `docs/a.md` is REJECT. The disposition is preserve either way.
  - The lines differ and no outcome is affected. Aligning the labels would make the record read more cleanly.
- **N2 (label wording)** The fgos-approve-6 tuples dynamic-017146 and dynamic-017147 are labelled `non-document-fs-probe`. They actually construct `docs/history/<id>/plan.md` in a fixture repo (see Q1). The disposition (preserve) is fine; only the label is loose.

## Lead-judgment questions

- **Q1 (plan.md convention)** test/cli/fgos-approve-6.test.mjs L129-130 write `docs/history/runner-heavy-with-plan/plan.md` so that production `checkPlanEvidence` (src/state/store.mjs L611-615, candidate `docs/history/${id}/plan.md`) finds a plan.
  - The Step 4 record step04-027 marks that source span `stepFiveExcluded`, reason "Step 5 owns output/path parity".
  - I found no step-05-records entry with file == src/state/store.mjs, so that source reference may be unowned.
  - If Phase 9 keeps the docs/history/<id>/plan.md convention, preserve is right for the test. If any patch changes that convention (the `docsRef` candidates or the error string), the fixture and the store.test.mjs and fgos-approve tests must be a co-cut unit.
  - Please confirm that the store.mjs reference has an owner and a disposition.
- **Q2 (docs/specs fixture, low risk)** check-doc-constitution.test.mjs L718-735 builds a temp repo with `docs/specs/fixture.md` as a legacy source. It runs generateInventory and runCli, and scripts/generate-doc-inventory.mjs L339-340 hard-codes the docs/specs and docs/architect legacy prefixes.
  - Preserve is right while those scripts keep that classification.
  - If the Phase 9 retirement edits those prefix constants, this test needs a co-cut.
  - No patch is proposed in the record, so I take preserve as correct.
- **Q3 (real-tree consumers, informational)** Two tests read the real tree through the script, not through a path in the test:
  - L456 `captureCli(['--no-ledger','--check-placement'])` expects "0 leftover, 0 ambiguous" over docs/platform.
  - L527-534 `governanceBaselineFields(REPO_ROOT)` expects 12 fields, including 'Canonical for'.
  - Both are consumers of document content. Phase 9 must keep them green when it adds files under docs/platform and moves doc-governance.md. The co-cut park on L713 and the script parks cover the path. They need no separate item.

## Counts

- Items reviewed: 160 (admitted 8 plus author-added admits; all others rejected). Two rows have missing id fields, so I did not recount admits independently.
- Parks: 4, all correct, one passage, one co-cut unit (docs/doc-governance.md).
- Patches: 0 (none expected here); no diffs to check.
- OUTCOME defects: 0. Record-text notes: 2. Lead questions: 3.

Status: DONE
Summary: All 160 reviewed items hold. The four L713 parks are the correct R26 co-cut on docs/doc-governance.md, and every reject names a true non-document use. I found no outcome defects, two label notes and three Lead questions, the main one being whether src/state/store.mjs:615 has an owner for the plan.md path convention.
