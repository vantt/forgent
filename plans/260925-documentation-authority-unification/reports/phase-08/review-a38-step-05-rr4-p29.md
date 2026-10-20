# Review a38 step-05 rr4 p29

Part: p29, payload s4-src-p29.json. Pin: 95301cb9a. Standard: L12-72 R1-R9.

## scripts/verify-phase-01.mjs — verdict: rework

Items reviewed: 5 literal references (reference-003636..003640) and 74 dynamic tuples (dynamic-009114..009187). Total 79. No diff or rollback diff (all parked or preserved). It is a source file.

### OUTCOME defects

1. **reference-003636, reference-003637, reference-003640 (lines 413 and 416), R4, R7, R9.** These three are parked. They sit in the same if/throw gate as reference-003638 and reference-003639 (lines 414 and 417) and dynamic-009174 and dynamic-009175, which all preserve.
   - The park blocker is boilerplate: "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set". It names nothing missing for this passage.
   - The operation is `name.startsWith('docs/specs/') && name !== 'docs/specs/reading-map.md'`, then `throw new Error('Forbidden edit to docs/specs: ...')`. The same pattern is repeated for docs/architect/ at lines 416-417.
   - Every operand is a fixed literal root in a hand-written, frozen Phase 01 gate. R4 and R9 give preserve for that, with the same witness as 003638 and 003639 ("Exact frozen migration gate identity; Phase 9 owns gate retirement"). owner-answers.md line 133 already records verify-phase-01 as frozen.
   - Correction: change 003636, 003637 and 003640 to preserve. Use timing none, the same R9 witness, and parityObligation candidate equal to current. Drop the parked blockedReason and dependency. One passage then has one outcome.

2. **dynamic-009161 and dynamic-009162 (lines 335 and 336), plus dynamic-009159 and dynamic-009160 (line 334), R6, R5.** They are rejected as scalar-pass-through.
   - `inventoryDir = path.join(tempWorktreeDir, 'plans/260925-documentation-authority-unification')` builds a fixed plan-document directory.
   - Lines 335 and 336 `fs.readFileSync` the committed `shipped-path-conventions-inventory.json` and `.md` documents.
   - This is a read of a fixed document path. p08 and p09 admit and preserve fixed plans/ gate inputs as exact gate identity.
   - Correction: admit all four. Set pathOperand to the inventoryDir and inventory file operands, and preserve them as a frozen gate document read. Joining `tempWorktreeDir` is root plumbing, but the plans/ literal is the document operand.

3. **dynamic-009168 and dynamic-009169 (line 387), and dynamic-009170 (line 390), R6, R5.** They are rejected.
   - `fullPath = path.join(tempWorktreeDir, relPath)` and `fs.readFileSync(fullPath)` read the 13 historical plan documents under plans/260825-1841-knowledge-registry/, taken from the fixed table `HISTORICAL_PLAN_HASHES` (lines 17-30). That is a real document read.
   - Line 390 prints `relPath` from the same fixed document-literal table. R6 admits messages whose printed path comes from a fixed document literal.
   - Correction: admit and preserve 009168, 009169 and 009170, with pathOperand `relPath` from `HISTORICAL_PLAN_HASHES`, as a frozen gate read.
   - Lead call (see questions): whether the census scope covers plans/260825-* paths.

4. **dynamic-009114 (line 116) and dynamic-009115 (line 124), R6.** They are rejected as caller-data-formatting.
   - `git cat-file -e ${fixedEndSha}:${filePath}` probes a document blob.
   - `git show ${fixedEndSha}:${filePath}` reads the document content.
   - Here `filePath` is a changed .md file from `git diff --name-only`.
   - R6 admits `git show <rev>:<docpath>` and probes of document paths. The p11 ruling admits the alias resolver's `${revision}:${refPath}` git-show even though refPath is caller data.
   - These are reads and probes, not message formatting.
   - Correction: admit and preserve both. pathOperand is `filePath`, a changed .md document path. Treat the verifier as a generic gate. Alternatively Lead rules caller-data-only reads are formatting; then p11 needs the same treatment.

### Lead-judgment questions

- **dynamic-009116 (line 130) and dynamic-009117 (line 147).** `parentDir = dirname(filePath)` and `normpath(path.posix.join(parentDir, targetFile))` build the resolved document link target, which `targetExistsInTree` then probes at line 148. This is a document-path construction and probe. They are rejected as scalar-pass-through. I lean to admit/preserve with 009114 and 009115 (same function, same document-path flow). If item 4 is settled as reject, these stay reject.
- **Census scope of plans/260825-* and plans/260925-* paths** (items 2 and 3). These paths are not legacy docs roots. If the census excludes plans/ except the "fixed plans/ gate inputs" convention (p08 Q3), the defects in items 2 and 3 downgrade to Lead decisions. If they do, p08 and p09 precedent argues for admit/preserve for consistency.

### Items checked and found correct

- **reference-003638, reference-003639, dynamic-009174, dynamic-009175.** Admit/preserve is right: R6 fixed-literal message, R9 frozen gate. pathOperand `docs/specs` and `docs/architect` do name the printed document root. They agree with each other. They need the park-to-preserve fix above for 003636, 003637 and 003640 so the whole passage matches (R7).
- **Rejected tuples, nonDocumentUse true:**
  - dynamic-009119 and dynamic-009120 (REPO_ROOT, line 15).
  - dynamic-009122 (repoRoot default).
  - dynamic-009123 to dynamic-009133 and dynamic-009165 to dynamic-009167: console and error messages over SHAs, repoRoot or caller data, with no fixed document root.
  - dynamic-009134 and dynamic-009135, and dynamic-009140 to dynamic-009142: tmpdir and worktree dir, `target` cargo symlink.
  - dynamic-009136 and dynamic-009137: temp worktree paths.
  - dynamic-009138 and dynamic-009139: git worktree status text.
  - dynamic-009143 to dynamic-009158: temp baseline and inventory outputs, and tmp reads.
  - dynamic-009163 and dynamic-009164: test/docs is a test directory, not a document.
  - dynamic-009171 to dynamic-009173: diff-check messages over SHAs.
  - dynamic-009176 to dynamic-009179: receipt, logPath and tmp.
  - dynamic-009180 to dynamic-009184: test-failure messages over tmp log paths.
  - dynamic-009185: revision range.
  - dynamic-009186 and dynamic-009187: accumulator and join.
  - dynamic-009118 and dynamic-009121: the message at line 149 formats caller data only. The message at line 156 is a join of the error list. Both reject correctly.
- No dated or retired decision citations appear in this file, so no successorNote is needed (R8).
- The `pathOperand` label is correct for the two admitted tuples. Admitted literals carry pathOperand null, which is fine as they are literals.

### Record-text notes

- The reason strings of 003636, 003637 and 003640 say "L12-71: navigation" for what is a gate comparison. The role label is an imprecise fit, but this is moot once they become preserve.
- dynamic-009146, 009148, 009151, 009153, 009155 and 009157 are labelled non-document-infrastructure with nonDocumentUse caller-data-formatting. They are tmp-path joins, so a `tmp-path` use label would be more precise. This does not change the outcome.

### Counts

79 items reviewed. Four defect groups: 3 literal park-versus-preserve items (group 1), 4 tuples (group 2), 3 tuples (group 3) and 2 tuples (group 4), so 12 items need a changed outcome. 2 items are Lead questions. 62 reject and 2 admit-tuple items are confirmed correct. 5 literals reviewed, with 2 confirmed.

Status: DONE_WITH_CONCERNS
