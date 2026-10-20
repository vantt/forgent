# Review a38 Step 5 rr4 p19 (seam 4 source window review)

Pin 95301cb9a (all 7 files). None carries a diff or rollbackDiff, so there was no diff to check.

## Per file

| File | Verdict | Items |
|---|---|---|
| scripts/herdr-cockpit-notify.mjs | ok | 12 (all dynamic, all REJECT) |
| scripts/herdr-cockpit.sh | ok (Lead question Q1) | 3 (2 refs, 1 dynamic) |
| scripts/install-git-hooks.mjs | ok | 4 |
| scripts/install.ps1 | ok (record-text note N1) | 13 |
| scripts/knowledge-bootstrap.mjs | ok (Q2) | 31 |
| scripts/knowledge-canary.mjs | rework | 15 |
| scripts/knowledge-classifier.mjs | rework | 32 |

Total: 110 items reviewed. Admissions are right everywhere except the two canary items listed below.

## OUTCOME defects

1. **knowledge-canary.mjs, dynamic-008105 (L27) and dynamic-008108 (L40): wrong admission.**
   - Both are REJECT with nonDocumentUse `caller-data-formatting`.
   - The interpolated `${docPath}` is the fixed literal `'docs/worktree-reclaim/guide.md'` from L26, not caller data.
   - The command `doc reserve t1 guide ${docPath}` passes that document path to the registry writer. `knowledge attest --doc-path ${docPath}` passes it to a command that reads the committed file.
   - R6 says a fixed document literal put into an emitted or consumed operation is a document operation. The nonDocumentUse claim is untrue.
   - Correction: ADMIT with pathOperand `${docPath}` (resolving to the L26 literal), disposition preserve. This matches the sibling items 008104, 008106 and 008107, which are already admitted and preserved as a fixed sandbox fixture convention.
   - The fixture sits in a throwaway sandbox, so preserve is the right outcome. Only the admission and label change.

2. **knowledge-classifier.mjs: parks that fail R4. dynamic-008116 through 008125 (L117-L150) and 008134/008135 (L183) are all ADMIT and parked.**
   - Every one carries the same boilerplate blocker: "requires bounded inventory and folded registry input ... current legacy projection cannot establish candidate identities."
   - R4 names this kind of "depends on supplied input" sentence as not a blocker. No blocker names what is missing for this passage.
   - The passages are a hand-written one-shot migration scanner:
     - The fixed `targetDirs` list is `how-to`, `explanation`, `reference`, `tutorials`, `tutorial` and `decisions` under `docs`.
     - The fixed `docs` root comes from `path.join(repoRoot, 'docs')`.
     - The output files are `inventory-data.json` and `inventory-report.md` under `outputDir`, which the main block binds to the admitted docs/history preserve (reference-003609 / 008136-37 at L187).
   - R4 says a hand-written source whose target set is fixed on a retained root is preserve. Nothing patches the passages, and no live-holder patch is proposed.
   - Correction: change all 12 parked items to preserve and drop the blockedReason. At the pin docs/how-to has 34 files and docs/explanation has 137, and package.json ships both as retained roots, so those two are fine.
   - The same-passage groups must stay on one outcome:
     - L120/L123: 008116, 008117, 008118
     - L126/L129: 008119, 008120
     - L130: 008121
     - L146: 008122, 008123
     - L147: 008124, 008125
     - L186: 008134, 008135
   - Fallback only if Lead rules otherwise: see Q3.

## Record-text notes (no outcome change)

- N1. install.ps1 dynamic-008064 (L16, comment) is labelled nonDocumentUse `scalar-pass-through`. The rejection is correct, but the label should say comment, or env-var text. dynamic-008070 (L29, throw text) and 008068 (L183, Write-Host PATH advisory) carry the same label. dynamic-008066/67/69 are `$onPath`/`$LASTEXITCODE` booleans, so `scalar-pass-through` is loosely right but `guard` or `accumulator` is more accurate.
- N2. knowledge-bootstrap.mjs dynamic-008085, 008089 and similar items have a `targetSetOrConstruction` that echoes the truncated operand. Cosmetic only.
- N3. knowledge-canary dynamic-008101 sits on a comment about `path.resolve('bin/fgos.mjs')`. The reject is true because bin/fgos.mjs is not a document. The label is fine.
- N4. herdr-cockpit.sh reference-003606 (docs/history/herdr-interim-cockpit) is correctly existsAtPin false. The preserve rests on a "dated provenance in a comment" witness under the docs/history convention, which is acceptable. It does not point into docs/specs or docs/architect.

## Lead-judgment questions

- Q1. herdr-cockpit.sh reference-003605 (L5) cites `docs/operator-runbook-herdr-cockpit.md` in a module-header navigation comment, and is preserved. A candidate holder exists at pin: `docs/platform/herdr-web-dashboard/operations/operator-runbook.md`. R8 says a header pointer with a live holder gets a patch, but that rule is framed around docs/specs and docs/architect. Step 4 preserved four other references to the same file (skills terminal SKILL.md:20, pane_scan.rs:27, and others) as a retained root path, and the switchboard rows are phase9-row-flip. I judged this inherited-consistent and left it as ok. If Lead treats the root runbook as retiring, all of these flip together to a patch against the platform holder.
- Q2. knowledge-bootstrap.mjs reads `inventoryDataPath` through `fs.existsSync` and `readFileSync` at L16-L22. The path is a parameter whose only caller supplies the admitted docs/history literal at L247. There is no census item for the parameter read, and the messages are correctly rejected as caller-data formatting. This is a census-coverage question, not an item defect.
- Q3. knowledge-classifier `targetDirs` includes `'decisions'` (docs/decisions, retired corpus, 1 file at pin) and `'reference'` and `'tutorials'`. If Lead wants that one-shot scan treated as dated provenance of a retired corpus, 008116 needs an R8-style successor/dated witness. If docs/reference or docs/tutorials retire in Phase 9 and a holder is named, the fallback is a patch, not a park. Either way a boilerplate park is wrong.

## Extra checks (L12-72)

- Admitted dynamic tuples:
  - Every pathOperand really yields a document path in the passage (008088/89, 008104/06/07, 008136/37, 008144/45, and the parked admits).
  - The only exception is 008116, whose operand is a bare directory-name array that does produce document dirs, so it is fine.
- Rejected tuples: every nonDocumentUse is true except 008105/008108 (defect 1).
- Parks: 12 parked items, all failing R4 boilerplate (defect 2). No other file has parks.
- Same-passage agreement: otherwise good. 008088/89 follow 003608, 008136/37 follow 003609, and 008144/45 agree.
- Retired decision citations: no preserved citation of a retired decision file occurs in these 7 files, so no successorNote is missing.

Status: DONE_WITH_CONCERNS
Summary: 5 of 7 files ok. knowledge-canary needs two rejects (008105, 008108) re-admitted as preserve, and knowledge-classifier has 12 parked items with boilerplate blockers that should be preserve.
