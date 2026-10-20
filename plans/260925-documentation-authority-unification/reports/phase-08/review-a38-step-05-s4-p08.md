# Review: seam 4, part p08 (skills-and-support), one file

Payload: s4-src-p08.json. Pinned source 95301cb9 (read-only worktree). No diff or rollbackDiff in this part.

## scripts/check-doc-constitution.mjs

Verdict: **rework** (outcome defects D1-D4).

Items reviewed: 146 in total.
- 4 literal references: 002482, 002483, 002484, 002485.
- 142 dynamic tuples: 21 admitted and parked, 2 admitted and preserved (006626, 006642), 119 rejected.
- There is no diff, so the check that a diff touches only admitted passages is vacuous. The file is a plan/gate script, not a generated output, and nothing is hand-patched.
- docs/doc-governance.md exists at the docs root and is retained. It is outside docs/specs and docs/architect. owner-answers L12-58 rule 3 retains such paths, so the literal preserves are sound.

### Outcome defects

**D1. Same passage, two outcomes (rule: same-passage literal and dynamic tuple share one outcome).**
- Source line 221 (`path.resolve(repoRoot, 'docs/doc-governance.md')`, in governanceBaselineFields): literal 002483 is preserve but dynamic-006599 is parked.
- Source line 264 (same expression, in governanceHeadings): literal 002484 is preserve but dynamic-006602 is parked.
- The tuple's whole operand is the constant retained root file. It has no caller-supplied file set, so the park reason ("caller-supplied file set; no bounded artifact") does not describe it.
- Correction: make 006599 and 006602 preserve with the same retained-root witness as 002483/002484. The alternative is to park all four, which would be wrong for a retained root document.
- The same retained-root reasoning already preserves 006642 and 002482/002485 on 382/383.

**D2. Same line and same constructed path, one tuple parked and one rejected.**
- Line 30: 006608 is parked (`DEFAULT_VOCABULARY_PATH = ...`) but 006609 (the template `${PLAN_DIR}/claim-and-disposition-vocabulary.json`) is rejected as non-document-formatting.
- Line 31: 006616 is parked but 006617 is rejected.
- Line 32: 006622 is parked but 006623 is rejected.
- Each template is the path that loadJson reads at 662-664. It is a path construction, not formatting, so the reject reason does not name a non-document use.
- Correction: give the three template tuples the same outcome as their parked siblings. Whether both go to park or both to reject (plans/ artifacts, not legacy docs) is Lead judgment, but PLAN_DIR 006605 and 006630 must then follow the same direction.

**D3. Rejected tuple that constructs a document path.**
- dynamic-006597, line 209: `${parts.slice(0, at + 1).join('/')}/${owner.file}` builds the evidence-owner document path and looks it up in the caller-supplied file set (`present.has`).
- This is an operand-level path construction, like the admitted park 006601, not message formatting.
- Correction: admit and park (generators), or give a concrete non-document-use reason.
- Related: 006592 and 006593 (lines 143-144) and 006594 (146) build matcher regexes from constitution-supplied placement patterns. Rejecting them looks defensible because they construct a pattern matcher and read no path. Keep them rejected unless Lead rules that D3 applies to them.

**D4. Constitution-supplied path-list extraction, inconsistent outcomes.**
- Line 299: `flatMap(r => r.forbiddenPaths || [])` (006607) is rejected as a scalar guard.
- Line 300: `flatMap(r => r.legacyRoots || [])` is parked (006610 and 006611).
- Line 192: `placementExceptions.map(e => e.path)` (006596) is rejected.
- All three feed `startsWith` or `has` comparisons against document paths at 213 and 329. They are the same class: path-prefix and path sets read from caller-supplied constitution data.
- Correction: align them. The consistent reading is to admit and park 006607 and 006596 alongside 006610/006611. Rejecting 006610/006611 is the alternative.

### Record-text notes

- Roles on 002483/002484 say "navigation", but these are live fs reads via `path.resolve`/`fs.readFileSync` at 221-223 and 264-266. 002482/002485 are runtime-emitted user-visible messages (382/383), not navigation. The role fields should say live-read and emitted-message, so the preserve reason is not "navigation".
- Line 365 and line 371 messages say "the doc-governance.md required baseline" (bare name, rejected 006639/006640). This is a user-visible mention of a retained doc. The reject reason would be more accurate as "no path operand; mention of a retained root doc".
- 006694 (line 712) rejects the whole template, but the passage also builds `path.resolve(cwd, IDENTITY_REGISTRY_PATH)` as an operand. The record should say that the operand is covered by 006691's park, not "formatting only".
- Parked generic blocker text ("caller-supplied file set") is used for constant-path parks (006605, 006608, 006616, 006622, 006630). A constant plans/ path would be better described as a fixed artifact path.

### Lead-judgment questions

1. Echo or pass-through of document paths in report output.
   - Parked: 006600 (`headerlessPaths: []`) and 006601 (`path: file`).
   - Rejected: 006598, 006681, 006704, 006706, 006688 and 006652. They only echo caller or constitution paths into messages.
   - Pick one treatment: park all, or reject all as pass-through with no construction.
2. Lines 639 and 719-727: `trackedPlatformDocs` runs `git ls-files ... -- 'docs/platform'` and reads the results. There is no item for it. docs/platform is the candidate tree and outside the legacy-root census, so it is probably out of scope, but a one-line confirmation would close the gap.
3. Direction for D2: park all `${PLAN_DIR}` constants, or reject all as non-legacy plan artifacts.

### Counts

- Items reviewed: 146.
- Outcome defects: 4 families (D1 two tuples, D2 three tuples, D3 one tuple, D4 two tuples). That is up to 8 tuples to change plus any Lead-chosen siblings.
- Record-text notes: 4.
- Lead questions: 3.
- Not seen: no sibling slices.

Status: DONE
