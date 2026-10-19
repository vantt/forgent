# Review A38 Step 0 author + accounting, part 01

Reviewer: reviewer:sonnet-session:a499d6e0acccc7970@2026-10-19
Commits: AUTHOR a2e8634df (parent f7686163843), ACCOUNTING b1e7aec1a; worktree HEAD b1e7aec1a verified, clean of tracked changes.
Part: plans/260925-documentation-authority-unification/reports/phase-08/step-00-author-review-part-01.json
Part sha256: bacbdbf25849c675ff1ca7a216348bebbcf5c3437ca5b35d6f80d504485a59d6 (35 entries, all kind=binding)

## Method

Unchanged production extractor (scripts/generate-doc-inventory.mjs extractMarkdownConservationUnits, same unitsOf as the manifests) run on the current files and on git show 49ad04648^1:<targetOwner>. Per entry: before row == row at a2e8634df^, after row == row at a2e8634df == current file row; old passage text == unit at before anchor in old file; resolved text == unit at after anchor in current file; targetUnitDigest (full) and ancestry recompute equal; claimId, sourcePath, sourceUnitDigest, disposition, targetOwner unchanged; reviewStatus pending with no reviewedBy/At/Report/Mode left. For 005-035 the passage text is byte-identical old vs new and unique in the current file, so correspondence is by content, not position. For 001-004 the text differs and was diffed by line.

## Entries

| id | verdict | evidence |
| --- | --- | --- |
| binding-001 | ok | changed-text, content correspondence: file-block identity (whole architecture-manifest.json); old text == 49ad04648^1 file, new text == current; only module-inventory lines changed (7 removed/31 added, keys contract/map/layers/rules intact); current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-002 | ok | changed-text, content correspondence: same table (ancestry Component Boundary > 4. Current High-Level Components, same header); old rows Workflow/Session/Process/Holder-lock all reappear revised, 6 foundation rows added; anchor unheaded-block-11 stays; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-003 | ok | changed-text, content correspondence: old block 141 (private-home resourceBindings recipe) -> current block 140, same section 13.1 numbered items 1-3 recipe, credentialStore wording replaces resourceBindings with explicit compat note; ancestry identical; before was reviewed, after is pending with reviewedBy/At/Report/Mode/ReportCommit removed (no approval carried); current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-004 | ok | changed-text, content correspondence: same Data Dictionary table (ancestry Spec: Distribution > Data Dictionary, same header); rows 5g/7/7b kept (revised), 5h and 7c-7j added; anchor unheaded-block-5 stays; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-005 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-006 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-007 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-008 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-009 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-010 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-011 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-012 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-013 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-014 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-015 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-016 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-017 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-018 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +5; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-019 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-020 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-021 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-022 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-023 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-024 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-025 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-026 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-027 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-028 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-029 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-030 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-031 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-032 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-033 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-034 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |
| binding-035 | ok | identical text: old text at 49ad04648^1 anchor == current text byte-identical, unique in current; anchor shift +4; current row == after, claimId/source tuple/disposition/targetOwner unchanged, pending, target digest + ancestry recompute equal |

## Totals

35 entries: 35 ok, 0 rework.

## Accounting arithmetic (b1e7aec1a)

- diff a2e8634df..b1e7aec1a touches exactly the two manifests; in each, one pure insertion (0 bytes removed) of 13495 chars into the checks.mjs script literal (round5 scripts/checks.mjs, sync4d readOnlyScripts/checks.mjs); the two insertions yield the same 49 pairs.
- 49 = 37 input pairs (all present, in step-00-unaccounted-pairs.json) + 12 pairs from author commit a2e8634df. The 12 are the author commit's reports/phase-08 files; its other 10 touched files are ledger/decisions shards (the rebind targets). 22 files total, 12 + 10, consistent.
- No duplicate pairs; each of the 49 pairs verified with git diff-tree (-m fallback for merges) as a commit that touched that path.
- Observation, not rework: every pair, including the 37 from f7686163843, carries the authority string "L12-11 / author commit a2e8634df... / approved manifest-data accounting", while the request names L12-3/L12-11. The reporter cannot be rerun here (heavy); relies on the Lead's reporter exit 0.

## Rework details

None.
