# Review a38 step-05 rr4 p36: src/setup/registrations.mjs

Pin aa8d343746. Items reviewed: 909 (58 literal references, 851 dynamic tuples). ADMIT 53 (6 patch, 17 preserve, 30 parked), REJECT 856 (all preserve). The source diff has 3 hunks (L874, L2094, L3518), on a source file, and touches only admitted passages 003811/014907, 003806/014207 and 003804/014307. All three targets exist in the worktree and match the registry aliases. The inverse rollback restores the old strings exactly. The diff is OK.

## Verdict: rework

### OUTCOME defects

D1. Park blockers are boilerplate (R4). Items: 003802, 003803, 003828, 003829, 003833, 003834, 003839 and dynamic 014352, 014356, 014361, 014362, 014367-014370, 014376-014379, 014397-014402, 014432, 014433, 014443, 014444, 014446 (30 parks).
- Every park carries one identical sentence: "requires bounded inventory and folded registry input for this operation at the final candidate tree; current legacy projection cannot establish candidate identities." Only the line and literal change.
- That is the R4 "no bounded artifact/export supplied" boilerplate. It does not name what is missing for this passage.
- Correction: a per-passage blocker for each group.
  - L3915/3930/3931/3961/3962, `docs/doc-registry.md` and `.json` read/write: R4 and L12-26 say these files stay at the docs root, and the paths are literal on a retained root. Either preserve, as the five message tuples 003830/003846/003853/003857/003858 already do, or name the concrete missing input. That input is the registry-state content comparison. The path itself is not the blocker.
  - L4035-4045, `checkDocNearDuplicate` walks all of `docs/**`: the blocker must say the scan set changes when docs/specs and docs/architect retire, and what post-retirement scan set is missing.
  - L4145, `captureId === doc.currentPath || aliases.includes(...)`: see D3.
  - L4193 and L4220, `inventory-data.json` read plus `existsSync(path.join(root, oldPath))`: the blocker must name the oldPath inventory rows whose existence/alias resolution changes.

D2. 014352 and 014356 (L3824, L3852, `fs.existsSync(path.join(root,'core','instructions'))`) are admitted and parked with the registry-inventory blocker.
- `core/instructions` is a retained core source directory. It is not a legacy doc root and has nothing to do with the doc registry.
- The passage is an existence probe, then a helper call (`runInstructionProjectionHelper`) and fixed literal output "core/instructions not found".
- Correction: preserve with a fixed retained-root witness (R4). If a park is wanted, the blocker must cite the instruction-projections generator seam (R4 says that blocker applies only to generator inputs and outputs). The registry text is false for this passage.

D3. 014432 and 014433 (L4145) are admitted and parked, but the operand is `captureId === doc.currentPath || (doc.aliases||[]).includes(captureId)`.
- It is an in-memory string comparison of registry state. It reads, writes, probes and emits no path.
- That is the R5 guard/accumulator class. The neighbouring `currentPaths = new Map(docs.map(...))` (014384, L3993) is rejected as an accumulator.
- Correction: reject with nonDocumentUse guard. The L12-69 decision to keep the looksLikeDocPath co-cut (L4132, no record) is carried by the real reads (014443/4, 014446), not by this comparison. If Lead keeps the park, it needs a specific blocker (D1).

D4. Rejected tuples with a false nonDocumentUse (R6 and "true nonDocumentUse").
- 014334, 014335, 014336, 014337 (L3730, L3735, L3739, L3743): messages interpolate `${indexPathFor(root)}`. `indexPathFor` in `src/report/decision-index.mjs` returns `path.join(repoRoot,'docs','decisions','index.md')`, a fixed document root. The rejection says "contains no documentation-location operand", which is false. The printed path changes if the index moves.
- 014318 (L3644): `${manifestPathFor(root)} not found`. `manifestPathFor` returns `docs/enduser-docs-index.json`. Same defect.
- Correction: admit these as fixed-root document messages and preserve. Name the source construction (`indexPathFor` in decision-index.mjs, `manifestPathFor` in enduser-index-generate.mjs), as the L12-72 p01 answer requires. Same-passage items must agree (R7).
- Related, Lead judgment (Q2): 014342-014344 (`result.path`) and 014329/014330 (`manifestRelPath`) print generator-returned paths. They are rejected as caller-data-formatting, consistent with the p01 filePath-metadata ruling, and I left them.

D5. Preserve resting on a "retained" witness for a pointer whose target is gone but has a live holder, where the comment is an operative documentation pointer.
- 003845 (L2045): comment "documented manual command (docs/how-to/resolve-an-events-jsonl-truncation.md)". The witness says exists:false. The registry alias holder is `docs/knowledge/how-to-respond-.../resolve-an-events-jsonl-truncation.md`. The same file patches the identical path at L2094 (003806).
- 003850 (L3063): comment "documented as never touching Iron Law (docs/explanation/gate-bypass-design.md)". exists:false. The registry holder is `docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md`.
- Both are live navigation pointers, not dated provenance. L12-71 line 400 says a renamed-alias preserve outside carriage and history files is wrong and must patch to the holder.
- Correction: patch both to the holder paths as comment-only source edits (no output delta, trivial inverse). If Lead holds that L12-26(5) comment preserve overrides line 400, then the preserve must say so as a dated-provenance witness, not "retained".

### Record-text notes

- The 003845, 003850 and 003817 witnesses use rule "retained/external project or comment" with exists:false. That wording misdescribes the passage.
- 003823 (L4357, `docs/how-to/coordination-examples/*.json`): the witness reports exists:false because of the glob. The directory exists at HEAD. Preserve is right, since the check body is a retired stub. The witness should name the directory.
- 003817 ("docs/how-to/... none yet") is a placeholder ellipsis, not a path. Preserve is right. Label it a pattern.
- About 170 rejects are labelled scalar-pass-through. Their operands are real directory scans of non-document trees: `core/coordination-protocols`, `core/workflows`, `domains/*/task-specs`, `core/task-specs`, `core/agents`, `.claude/skills`, `plugins/fgOS/skills`. The outcome is right (not a doc path), but the label does not say "non-document source tree scan".
- R8: no retired decision-file citations (docs/decisions/00NN) are in this file, so no successorNote is needed.
- 003819, 003820, 003821, 003854 and 003855 (docs/architect and docs/specs comments) carry an explicit "tree retires at Phase 9" witness. Correct.
- 003814, 003818 and 003826 cite docs/decisions/index.md (exists:true, live generated projection). Preserve is fine.

### Lead-judgment questions

- Q1. Reads and probes through helper paths have no tuple at all: `fs.existsSync(indexPathFor(root))` (about L3763, L3769), `fs.existsSync(manifestPathFor(root))` (L3678), and the `CHANGELOG.md` and `README.md` literals in messages and descriptions (L3467, L3481, L3499, L3504, L3524). 014306 (README.md in an emitted message) is rejected, but its reader 014301/014302 is admitted and preserved. Decide whether R3 needs author-added source slots, or whether the census intentionally excludes retained root names. The L3688 description string `docs/enduser-docs-index.json` has no record, while its siblings 003816 (L3784) and 003853 (L4231) do. Check coverage.
- Q2. `result.path` and `manifestRelPath` generator echoes (014329, 014330, 014342-014344): keep as reject, or admit alongside D4?
- Q3. Do the doc-registry literal reads and writes (L3915-L3962) preserve under R4, or park with a specific blocker? The owner's earlier L12-69 answer chose a park on state-parity grounds. R4 in L12-72 says boilerplate is not a blocker and that a fixed target on a retained root is a preserve. The two rulings need reconciling.

### Passed checks

- R7 same-passage agreement holds: L874 (003811, 014907, patch), L2094 (003806, 014207, patch), L3518 (003804, 014307, patch), L3915 (four items, park), L3930/3931/3961/3962 (literal and dynamic, park), L4193 (003802, 014443, 014444, park), L3465 and L3497 (preserve).
- Every admitted dynamic tuple's pathOperand does yield a document path. Dynamic items 014207, 014307 and 014907 point at their literal owner.
- State-store, `.git`, `.fgos`, root-only and join/label rejects have true non-document uses.
- The patch targets exist, with registry aliases and target sha256 witnessed.

Status: DONE_WITH_CONCERNS
Summary: 909 items reviewed in a single file. The diff and patches are sound. Five outcome defects (D1 boilerplate parks, D2 core/instructions probe, D3 guard comparison parked, D4 fixed-root messages rejected, D5 live-holder comment preserves) and three Lead questions are recorded.
