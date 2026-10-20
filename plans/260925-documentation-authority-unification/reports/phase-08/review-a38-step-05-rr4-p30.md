# Review p30 (Step 5 seam 4 source files)

Items reviewed: 83 + 6 + 15 = 104 (all dynamic tuples, all REJECT/preserve; no diffs, no parks, no retired-decision citations).

## scripts/write-test-marker.mjs: ok (6 items)
All rejects true: xmlPath default and argv pass-through (test-results/full.xml is a junit artifact, not a document), planPath null default/argv echo (accumulator/pass-through), test-marker.json write into test-results, console label.

## scripts/write-wrapper-script.mjs: ok (15 items)
All rejects true: dir/cwd root plumbing, generated wrapper-<hex>.sh names and path.join(targetDir, filename) (shell wrapper output, no document path), error/stdout formatting from caller data.

## scripts/verify-phase-02.mjs: rework (83 items)
This is one of the plan's own gate/verify scripts (R9). Its fixed plans/260925-documentation-authority-unification/** operations build, read or write document paths, yet they are rejected as "caller-data-formatting" / "scalar-pass-through". The nonDocumentUse label is false for these, and the precedent in the same family admits them (p11 check-doc-inventory-gates DEFAULT_VOCABULARY_PATH / DEFAULT_DROPPED_CLAIMS_REGISTER_PATH dynamic-006792/6793/6796, p09 check-doc-candidate-status DEFAULT_SWITCHBOARD_PATH dynamic-006582: ADMIT/preserve, gate identity). Under R6/R9 they should be ADMIT/preserve with a pathOperand naming the fixed plans/ document path (no blocker, gate bytes frozen).

OUTCOME defects (REJECT should be ADMIT/preserve):
- D1 L18 dynamic-009210: PHASE_DIR = fixed 'plans/260925-documentation-authority-unification' literal, the document root of every later path in the file. Not scalar pass-through. R6/R9.
- D2 L19 dynamic-009214 (PHASE02_JSON), L20 dynamic-009217 and dynamic-009218 (PHASE02_PART_DIR), L21 dynamic-009225 (PHASE02_MD), L22 dynamic-009230 (PHASE02_IDENTITY_REGISTRY), L23 dynamic-009241 (PHASE02_VOCAB): template constructions of fixed document paths. R6/R9; R7 (009217/009218 are the same passage and currently carry two different nonDocumentUse labels, one infrastructure and one formatting; they must share one outcome).
- D3 L32-34 dynamic-009259/009261/009263: `${PHASE_DIR}/plan.md`, phase-02-verification.md, phase-02-execution-record.md fixed document paths in the allowed-diff list. R6/R9.
- D4 L207/208 dynamic-009223/009224: path.join(tmpRoot, PHASE02_JSON/PHASE02_MD) mirrors the fixed plans/ document path as a write target. L217, L219, L220 dynamic-009226/009227/009228/009229/009231: byteCompare reads of the committed worktree copies of PHASE02_JSON, manifest shards under PHASE_DIR and PHASE02_MD. L222 dynamic-009232/009233: reads the identity registry document (fs.readFileSync at L223). All are document reads/probes (R6). Same-passage items on L206 (tmpdir nonce) may remain rejects, and L219 009227/009228/009229 must share one admission (R7).
- D5 L288/289 dynamic-009248/009249: reads each historical plan file from HISTORICAL_PLAN_HASHES (fixed plans/ documents) and prints that path in the mismatch message. Document read plus fixed-source message (R6).

Items that should stay REJECT (checked): git argv/sha formatting (L120, 126, 131, 139, 155-158, 267-269 and similar), REPO_ROOT resolution (L17), repoRoot default (L144), tmpdir/mkdtemp/worktree paths (L160, 171, 206, 310-319), package-lock.json existsSync (L186, non-document), test/docs readdir (L273, test directory listing, not a migrated document), diff-name field echoes (L141, 295), receipt path fields (L227-230 009237-009240, 009242: finding data fields that only carry a path value, R5), accumulators/guards/count messages. Only the L24 Set accumulator (009243) is a pure allowlist and is fine to reject.

## Record-text notes
- Many verify-phase-02 rejects share the boilerplate operationChain.containmentAndErrors "See pinned enclosing function and family receipt" and some pairs on one line carry different nonDocumentUse labels (L20, L206, L219). Labels should be reconciled once the outcomes are fixed.
- rejectedAsUnrelatedReason text for 009210/009214 etc. will become stale after re-admission.

## Lead-judgment questions
- Q1 Scope consistency: p29 verify-phase-01 L334 (`path.join(tempWorktreeDir, 'plans/260925-documentation-authority-unification')`, dynamic-009159/009160) is also REJECT/scalar-pass-through while p09/p11/p12 gate scripts ADMIT the same fixed plans/ paths. Decide whether plans/ is in or out of the admission domain for verify-phase-0x scripts; whichever way, the whole family (verify-phase-01/02, check-doc-*) should agree. This report assumes the p08/p11 precedent (admit).
- Q2 Check whether census literal references exist for the same L18-L34 plans/ strings in verify-phase-02; if they were admitted, R7 requires the dynamic tuples to match them.
- Q3 L135 dynamic-009191 (`${PHASE02_PART_DIR}/` startsWith filter against git diff names) is a comparison guard against a fixed document directory, no read/probe. Left as reject; admit only if Lead treats fixed document-root guards like p29 L414/417 (docs/specs forbidden-edit messages, which print a fixed document root).

## Counts
write-test-marker 6 ok; write-wrapper-script 15 ok; verify-phase-02 83 items, about 28 outcome defects (D1-D5: 009210, 009214, 009217, 009218, 009225, 009230, 009241, 009259, 009261, 009263, 009223, 009224, 009226, 009227, 009228, 009229, 009231, 009232, 009233, 009248, 009249 = 21 ids, plus Q1/Q2 dependent), 62 rejects confirmed. Diffs none, parks none.

Status: DONE_WITH_CONCERNS
