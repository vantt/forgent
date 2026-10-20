# Review a38 Step 5 seam 4, part s4-p09

Payload: s4-src-p09.json (one entry). Worktree pin 6b6b243ef, file pin 95301cb9.

## scripts/check-doc-inventory-gates.mjs

Verdict: rework

Items reviewed: 360 (3 references, 357 dynamic tuples). 123 admitted (3 refs preserve; 1 dynamic preserve; 122 dynamic parked), 237 rejected. No diff, no rollbackDiff, no coCutPaths: consistent with no patch dispositions. The file is a source file (a gate script).

### Outcome defects

D1. Same-passage disagreement, source lines 791-797 (rule: same-passage literal and dynamic tuple share one outcome).
- dynamic-007007 (line 794, `areaRoot = ...replace(/^docs\/architect\//, 'docs/platform/')`) is PARKED.
- reference-002488 (line 794, same passage 791-797) and reference-002487 (line 796, passage 793-799) are PRESERVE.
- Correction: give all three one outcome. The literal tokens are exact legacy-root recognition inside a gate that must not change, so preserve fits. The park blocker text itself says "preserve gate bytes".

D2. Preserve resting on a "retained" witness for a docs/architect target (rule: L12-71 preserve may not rest on a "retained" witness when the target is under docs/architect/**).
- reference-002488 (line 794, `docs\/architect\/`) uses the witness "Own pinned literal is retained non-authority registry/config or historical source identity".
- reference-002486 (line 1010, regex `docs\/(?:architect|platform)\/` in isEvidenceMirrorPath) uses the same "retained" witness. Its architect alternative is a retiring root.
- Correction: use the witness already on reference-002487 (exact legacy-root recognition in the migration gate, no change to the gate permitted). Do not use "retained". Apply it to both references.

D3. Same-expression duplicates with opposite admission (same-passage tuples must agree).
- Line 1088: dynamic-006738 is ADMIT/parked and dynamic-006739 is REJECT. Both cover `fs.readFileSync(new URL(../${DEFAULT_CONSTITUTION_PATH}))`. This reads a plan document (minimum-constitution.json). Admit both, or reject both. Reading a document path means admit.
- Line 954: dynamic-007069 is ADMIT/parked and dynamic-007070 is REJECT. This is the same readFileSync expression. Same correction.
- Line 619: dynamic-006974 is ADMIT/parked and dynamic-006975 is REJECT. Both cover the `isCheckpointReviewReport` regex over a report path. Same correction. If the shape check is judged a guard, reject both.
- Line 1364: dynamic-006803/6804 are admitted but dynamic-006805 (line 1365, `fs.existsSync(defaultPath)` and a notice naming DEFAULT_DROPPED_CLAIMS_REGISTER_PATH) is rejected as "non-document-formatting". The same passage constructs, tests and emits that path.

D4. Under-rejected tuples: these read or construct a document path but are REJECTED as non-document-formatting (rule: a rejected tuple must really not construct or read a document path).
- dynamic-006743 (line 1131) and dynamic-006744 (line 1132): `git rev-parse <commit>:${citation.path}` reads the blob of a document at a pinned commit.
- dynamic-006813 (line 1385): `git show HEAD:${registryRelPath}` reads the identity registry document.
- dynamic-006787 (line 1320) and dynamic-006789 (line 1339): `fs.existsSync(filePath)` plus a "File not found" message for the inventory file.
- dynamic-006805 (line 1365) and dynamic-006812 (line 1383): emitted messages naming DEFAULT_DROPPED_CLAIMS_REGISTER_PATH and DEFAULT_PREVIOUS_REGISTRY_PATH. The owner rule says runtime-emitted strings are user-visible output.
- dynamic-006788 (line 1333): `regenerateCommand` builds a command string carrying `--json-out`, `--md-out` and `--identity-registry` paths.
- Correction: admit them and give them the same outcome as the neighbouring admitted path.resolve tuples at lines 1354-1405.
- Borderline: dynamic-006908 (line 40) filters `git ls-tree` paths against SCAN_ROOTS and ADDITIONAL_ROOT_FILES. That constructs the in-scope document set, so it probably should be admitted. dynamic-006728 (line 1021, pathInScope prefix match) is likely a pure guard.

D5. Over-admission: the tuples below do not construct or read a document path, yet they are ADMIT/parked. By line, each is one of two kinds. Either it is a finding-record field echoing an inventory path (`path: item.path`, `path: p`, `path: claim.sourcePath`, `sourcePath: ...`), or it is a parameter default or accumulator.
- Finding-record field tuples (about 78):
  - 6735, 6755, 6775, 6778, 6780-6785 (lines 1299-1307).
  - 6809, 6816, 6838, 6841, 6845, 6851, 6858, 6859, 6862, 6863, 6865 (validateStructure lines 138-188).
  - 6881-6906 (lines 328-378).
  - 6913-6931 (lines 426-462), 6941-6960.
  - 6969, 6970, 6977, 6980, 6996, 7002, 7006, 7010, 7014, 7015, 7018, 7023, 7025, 7043, 7049, 7057, 7060, 7062, 7067.
  - 7072-7081.
- Parameter default, accumulator or guard tuples: 6729 (line 1028, a `!repoRoot` guard), 6747, 6769, 6932, 6998 (`repoRoot = null` defaults), 6806 (registryRelPath default), 6815 (argv.indexOf), 6826 (`decisionPaths = []`), 6835, 6868, 6872, 6877, 6880, 6957.
- Correction: reject these with the actual non-document use named (finding label, parameter default, accumulator). Keep as ADMIT only the tuples that really resolve, read or rewrite a path: 6738, 6753?, 6791-6794, 6796-6804, 6808, 6810, 6811, 6818-6825, 6827, 6830?, 6910, 6929, 6985, 7007, 7034, 7069. The repo-wide walk shows their lines contain `path.resolve`, `fs`, `readCommitBlobMap`, `new URL` or a `DEFAULT_*_PATH` constant.
- Impact: these are mostly harmless parks, but each one asserts a blocker that does not exist.

### Record-text notes

- All 122 parked tuples carry the same blocker, "Pinned migration inventory/identity/alias or caller-supplied file set; no bounded artifact/export supplied; preserve gate bytes and require same-input post-cutover coverage". The text itself says "preserve gate bytes". A park blocker should name what prevents a patch, and this one does not. It reads as a preserve rationale.
- Several `operationChain.input`/`operation` fields are code fragments cut mid-expression (for example 6729 "repoRoot || !inventory.commit ... return accepted", 6747 and 6769 "repoRoot = null } = {}) {"). They do not name the path operation.
- reference-002486's reason quotes a regex passage with doubled escapes. Fine, but a different passage from 002487/002488, so D1 does not apply to it.

### Lead-judgment questions

Q1. Is this file a gate (checker) script whose bytes are frozen by the "no checker/baseline changes" rule? If yes, its true admitted path-operations should be preserve, matching the 4 existing preserves and the witness text. All 122 "park" rows would then become preserve or reject, and no Phase 9 blocker exists. If no, the park needs a blocker that names a real dependency on an artifact that is still to be produced.
Q2. dynamic-007010 (line 801, `{ path: mirror?.path }` in the fail() call) and dynamic-007014 (line 813) share the mirror block with 002487/002488. They are data fields, and I recommend reject (D5). The one-passage-one-outcome rule would apply only if they stay admitted.
Q3. reference-002486 mixes `architect` and `platform` in one regex. Is a preserve acceptable when only the architect alternative retires? I recommend the gate-identity witness (D2).

### Counts

References 3 (3 preserve). Dynamic 357: 120 admit (121 incl. emitted-message 7034 preserve), 237 reject. Outcome defects: D1 (3 ids), D2 (2 ids), D3 (7 ids), D4 (8 ids plus 2 borderline), D5 (about 95 ids). No patch/diff defects (none present).
