# Review: Step 5 pilot bounded re-review, part rr-p04

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62 (read through `git show`). Payload: `step-05-pilot-rr-p04.json`, 29 records. No checker, probe, test, cargo or fgos CLI run. Patch apply/rollback and hashes were redone in my own scratch only.

Slices seen: registrations.mjs windows for 15 ids (the whole file's changed set is in this part; part table lists no other slice for it), run-supervisor-checks.mjs 1 id, skill-wrappers.mjs 13 ids. Canonical `step-05-records/setup-doctor-roots.jsonl` read for sibling tuples, `parked[]`, diffs and co-cut specs.

Mechanical self-checks (read-only): all 29 windows equal pinned lines; all 24 dynamic `currentPassage` and 5 reference `passage` fields equal pinned bytes.

## Per-file verdicts

### src/setup/registrations.mjs (seam setup-doctor-roots): ok
Reviewed 15 ids: changed reference-003839; changed tuples 014207, 014299, 014300, 014301, 014302, 014307, 014338, 014345, 014346, 014907; unchanged admitted literals 003846, 003853, 003857, 003858 (final-state context check).

- reference-003839 (L3915, `docRegistryAdopted`, docs/doc-registry.md): ADMIT/parked is right. Same passage as 014361/014362 (parked state-backed readers); `samePassageOwner: dynamic-014361` is itself ADMIT/parked at pin; blockedSeams, blockedReason, `proofCommand: missing`, parityObligation with candidate null are present; target null, diffHunk null, no diff touches L3915. In `parked[]`. Matches the sibling parks 003803, 003828, 003829, 003833, 003834 (checked in canonical record, all parked, none patched).
- 014207 -> reference-003806 (L2094), 014307 -> 003804 (L3518), 014907 -> 003811 (L874): ADMIT/patch correct. Each is the same passage as a patched literal, the message is runtime-emitted user-visible output, and a live holder with the same passage means a patch (the earlier D1 finding is closed). `samePassageOwner`/`literalOwner` join the single diff; none creates a second hunk; none is in `parked[]`. 014906 (L870, sibling message with no doc operand) stays REJECT, correct.
  - Phase 9 diff: applies to the whole pinned file (sha c47a007f...), 3 hunks (L871, L2091, L3515), 6 changed lines, each only the admitted literal; result sha e5a0579e... equals `expectedAfterSha256`. `rollbackDiff` applied forward on the patched file returns c47a007f... byte-exact. No generated output touched.
  - Targets: the three `docs/knowledge/...` files exist at pin with sha equal to `claimAnchorProof.targetSha256`; the registry (sha aeba8c2c...) lists each as `currentPath` with the old `docs/how-to/...` as an alias; alias used as lookup only, never a destination.
  - Co-cut tests: `git grep` at pin over src/test/bin/scripts/core/domains/apps/.claude/.githooks finds exactly one test hit, `test/setup/checks.test.mjs:342` (title text). The recorded test diff applies at sha 9f8a488c..., gives a19a4a3d... as recorded, and its rollback restores the source sha. Basename-only assertion at checks.test.mjs:381 (`/resolve-an-events-jsonl-truncation/`) remains true after the patch and is correctly left alone. 003804 and 003811 have no test hits (empty match lists), so one test edit for three patches is complete. CHANGELOG.md is named as a prerequisite co-edit.
  - Receipt: `proofCommand: missing` is correct (no test asserts the new message bytes; checks.test.mjs and readme-tag-check.test.mjs exist but do not prove exact message parity).
- 014299/014300 (L3465 CHANGELOG.md) and 014301/014302 (L3497 README.md): ADMIT/preserve right. They are real retained root-document readers (read file, extract `## [Unreleased]` / pinned install tag); no relocation is claimed, so no patch. The earlier "belongs to installation/runtime health" reject reason is gone.
- 014338 (L3752): REJECT right. It is a comment fragment inside the comment block above `fixDecisionIndexStale`; the doc citation in that block is reference-003814 (comment, reject).
- 014345 (L3794): REJECT right. `new URL('./instruction-projections.mjs', import.meta.url)` resolves a source module, not a document.
- 014346 (L3797): REJECT right. `${JSON.stringify(root)}` serializes a variable into the child script; the paths the helper reads and writes are named by `destinationRelativePath` and the other tuples in `instruction-projections.mjs` and the L3-series tuples, not here.
- 003846 (L3967, md), 003858 (L3967, json), 003857 (L3938), 003853 (L4231): ADMIT/preserve right. Each is an emitted message or check description naming a retained `docs/doc-registry.*` path (L12-26: roots stay; receipts mark preserve as not a parity pass). aliasWriteCheck is false and the destination is not an alias.

Outcome defects: none.

### src/setup/run-supervisor-checks.mjs: ok
- dynamic-014965 REJECT/preserve: correct. The pinned message is at **L273** (author's line, not the earlier reviewer's 275-276): `return \`the release that wrote it was removed (${gone.map(...)} ...\``. Interpolated values are the host binary and the `attempt-step.mjs` entry path; no documentation operand. `caller` L263 `releaseGoneReason` matches. `proofCommand` names `test/setup/run-supervisor-checks.test.mjs`, which at pin asserts this exact text (lines 316, 318, 323). The record is not in `parked[]`; no diff.

Outcome defects: none.

### src/setup/skill-wrappers.mjs: ok
Reviewed 13 tuples: 015044, 015059, 015060, 015119, 015125, 015126, 015127, 015175, 015186, 015187, 015194, 015229, 015236. All REJECT/preserve, all confirmed against pinned source in context.
- 015060 (L1078): header `${ASSEMBLED_HEADER_PREFIX}${sourceRelativePath} (npm run build:skills ...)`; constant at L1073, `carriesAssembledHeader` at L1109. Names a source skill path and a build command, no doc location. Passage is the real current bytes. Proof named: `test/setup/skill-wrappers.test.mjs` (exists; it checks the committed `.agents/skills` against a fresh render, not the header text directly).
- 015044 (L1041), 015059 (L1065): `join('\n')` serialization of GEMINI.md and TOML text. The actual path operands in the same passages (`path.join(targetOutputDir,'GEMINI.md')` 015045/015046, `tomlPath` 015047/015048, `packagedRelPath` 015050) remain ADMIT/parked as generator operands. The emitted text only names `skills/<name>/SKILL.md` inside the package, not a doc location.
- 015119 (L322), 015125/015126/015127 (L344), 015229 (L888): scalar guards. The real operands next to them (015120-015124, 015128/015129, 015230-015235) remain parked.
- 015175, 015186, 015194: `new Map()` accumulators. 015187 (L735), 015236 (L962): collision error text with `canonicalDir || s.name` / `commands/fgos/${verb}.toml`; no doc operand. Sibling message/`join` tuples are already REJECT.
- All blockedSeams for surviving parks are `["generators"]` (checked 015120); `parked[]` count 153 and none of the 13 is in it; file diff null, `expectedAfterSha256` equals source sha.

Outcome defects: none.

## Record-text notes (not outcome defects)
- dynamic-014207: `caller` is `{line 2075, "const existingFiles = ..."}` (an interior statement, the census line). The enclosing function is `checkEventsJsonlNotTruncated`, L2056.
- dynamic-014338: `caller` is `checkDecisionIndexStale` (L3718). The comment sits above `fixDecisionIndexStale`.
- dynamic-014299..014302 are preserve readers but their `parityObligation.comparison` carries the patch wording "literal patch owner supplies one diff"; there is no literal owner. 014301/014302 `reason` says "extract Unreleased/install tag" for README (only the install tag applies).
- The preserved comment at registrations.mjs L2045 (reference-003845, history-design-contract-evidence) cites `docs/how-to/resolve-an-events-jsonl-truncation.md` as the "deliberate, documented manual command". It is an unchanged earlier outcome; the path already does not exist at pin, so the comment is stale before and after the cutover.

## Lead-judgment questions
1. Messages 003830, 003846, 003853, 003857, 003858 are ADMIT/preserve while the same passages' readers/writers (003803/003828/003829/003833/003834/003839 and 014361-014379) are ADMIT/parked pending state-export parity. This is consistent only if `docs/doc-registry.*` is retained at the root (L12-26 says it is). If the state-backed cutover ever moves or renames the projection, the five messages need to join the same co-cut; the receipt should say so. I did not call this a defect.
2. `root = mainCheckout ?? cwd` is REJECT as infrastructure for 014298 (CHANGELOG function) but ADMIT/parked as doctor-document reader/writer for 014363/014371 (doc-registry functions) and 014339. Unchanged outcomes outside this change list; same pattern, different label. Worth a one-line note in the receipt that the parks are coupled to the owning check, as L12-69 item 6 already says.

## Counts
- Records reviewed: 29 (5 literal references: 1 changed + 4 unchanged; 24 dynamic tuples: registrations 10, run-supervisor-checks 1, skill-wrappers 13).
- Outcomes confirmed: ADMIT/parked 1 (003839), ADMIT/patch 3 (014207, 014307, 014907), ADMIT/preserve 8 (014299-014302, 003846, 003853, 003857, 003858), REJECT/preserve 17 (014338, 014345, 014346, 014965, 13 skill-wrappers).
- Outcome defects: 0. Record-text notes: 4. Lead questions: 2.
- File verdicts: ok 3 (registrations.mjs, run-supervisor-checks.mjs, skill-wrappers.mjs), rework 0.

Status: DONE
Summary: All 29 records in rr-p04 hold up against the pinned source and records; the three message patches apply and roll back byte-exact with a complete test co-cut, and no outcome defect was found.
