# Review A38 - Step 4 wave 1 part 19 (step04-016)

Two files, one set, 4 slots (3 for pre-commit incl. one wrapped, 1 for ci.yml). Both pin digests match (ebcefc2815d0..., 9c0a0e571f33...). Both read whole.

## .githooks/pre-commit - mandatory file; verdict: rework (missed references)

Slots reviewed: 3 (class6-l-000008; class6-l-000009 two slot rows).
- class6-l-000008, source line 14: `(see docs/history/main-checkout-lock-worktree-commit-scope/CONTEXT.md D1/D2/D7)`. The path exists (CONTEXT, DISCUSSION, plan). Preserve is correct under L12-10/38/40.
- class6-l-000009, source lines 355-356: `docs/history/stale-worktree-index-guard/ CONTEXT.md D1/D2`. The path exists. Preserve is correct. Inventory lines 342-343 against source lines 355-356 are a line-drift from the older census commit, and the slot spans match the pinned text.

Missed references (outcome defects, no slot):
1. Line 491 (inside the `refuse(...)` template string): `See docs/how-to/fix-fgos-write-rejected-merge-block.md for how to restore these paths before committing.` At the pin the path does not exist. The live holder is `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` (moved by commit 7557f0f88). It is a dead path in user-facing help text.
2. Line 523, same sentence in the second `refuse(...)` string, same dead path and same live holder.
   Rule: a live "see X" pointer to a nonexistent path is a dead link, so park it, or patch it to the live holder; both are Phase 9 timing. Correction: add slots for 491 and 523. Both are string literals, so any patch is a Phase 9 behavior-visible message change (message text only, no logic). The Lead may route them to Step 5 (behavioral file) instead, but they need a slot or an explicit Step 5 custody row either way.
3. Line 36: `const HOW_TO_DOC = 'docs/how-to-parallel-lanes.md (workshop root, one level up from repo/)';`. The path is outside the repo (workshop root). It is absent from the repo tree and it is a code constant used in refusal text. Possible correction: record as preserve with a reason "outside-repo workshop doc". Lower severity than 1 and 2; Lead judgment on whether an out-of-repo path needs a slot.

Not missed: line 435 `/^plans\/(?:reports|journals)\/[^/]+\.md$/` is live behavior (a regex over `plans/`), not a legacy root. Line 40 allowlist names (`AGENTS.md`, `README.md`...) are root files, not legacy docs.

## .github/workflows/ci.yml - unpatched stratum; verdict: rework (wrong parked reason)

Slots reviewed: 1 (class6-l-000012, source line 63).
- Source line 63: `# Full suite (docs/distribution-vision.md tsk-49r D1): already` followed by lines 64-65 `includes test/install-packaging.test.mjs ... test/setup/doctor-fresh-run.test.mjs ... (D4) on every OS in the matrix above.`
- Disposition: parked, with `blockedReason` and `reason` reading "Phase 9 carry: map the exact registered-session merge-into-main exemption/return progress distinction in this comment to a live post-merge holder, retaining the adjacent deliberately-unchanged behavior claim. A broad runner area pointer does not prove this claim." That text does not describe this comment. The comment is about the CI full-suite run covering the install-packaging and fresh-runner doctor proofs. There is no merge-into-main exemption or return-progress claim in the comment. It looks like a copy-paste of another file's rationale (outcome defect: false adjacent description, recorded in `reason`, `blockedReason`, `dependency` and `searchWitness.assessment`).
- Facts for the correction: `docs/distribution-vision.md` exists at the pin and carries the header `Promoted to: docs/platform/packaging-distribution/vision.md` (a verbatim history copy also sits at `docs/platform/packaging-distribution/history/distribution-vision.md`). The "tsk-49r D1" decision (full `npm test` per matrix cell) lives in `docs/history/ci-install-packaging-matrix/CONTEXT.md` D1 (D4 is the fresh-runner doctor check), which is an L12-10 historical record. The live `vision.md` does not carry D1/D4 (it only has lines 55 and 102 about CI), so there is no exact live holder for the decision itself. The two natural outcomes: (a) keep parked with a blockedReason that says what is true (the `distribution-vision.md` pointer is a promoted legacy path, and the D1/D4 decision wording has no live holder in `vision.md`; Phase 9 must pick `docs/platform/packaging-distribution/vision.md` plus the history CONTEXT citation or split the citation); or (b) patch line 63 to `docs/platform/packaging-distribution/vision.md` and keep `tsk-49r D1` unchanged. Choice (a) is the safer reading of "exact claim holder"; either way the reason text must be rewritten. The parked disposition itself is defensible; the text is wrong.
- Missed references in ci.yml: none. Line 272 `plan.md` is a bare file word, not a path.

Record-text notes: pre-commit rows share one generic reason; fine.
Lead-judgment questions: (1) pre-commit lines 491/523: patch/park slot in Step 4 or hand to Step 5 as a behavior-visible string? (2) line 36 out-of-repo workshop path: needs a slot? (3) ci.yml: park-with-corrected-reason versus patch to `vision.md`.

Counts: step04-016 mandatory-file stratum (pre-commit): reviewed 1, rework 1. Unpatched stratum (ci.yml): reviewed 1, rework 1. Slots reviewed 4 of 4.

Status: DONE_WITH_CONCERNS
