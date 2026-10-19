# review-a38 step-02j committed-byte replay

Reviewer: reviewer:sonnet-session:ad0fc2abe3dbef8df@2026-10-19
Worktree: /home/vantt/projects/forgentX-s8-review, detached at 6235d0151 (verified `git log --oneline -1`; no tracked changes). Author 9650bdee6, accounting 6235d0151, input commit 1a0f61ac5 (full 1a0f61ac53433292e08fb378ebbb6c1c72fd3b74; the request calls it "input tree" but it is a commit id).

## Verdict
PASS, with notes (no mismatch found).

## Usage note
The replay needs no positional argument. The parser takes `--input-commit <ref>` and defaults to `HEAD`. At HEAD (6235d0151) the tree includes the 02j artifacts, so `--input-commit 1a0f61ac5` is required to reproduce the census. The request file's example command passes no argument and relies on the default. Run that way in this worktree, the default would read the wrong tree. I did not run the default. I passed `--input-commit 1a0f61ac5` in both runs.
The first attempt, with `--help`, did not print help. The script ignores argv and runs the whole replay, which took longer than 120s. I discarded it.

## Commands and exit codes
Both commands were `env -u CLAUDE_CODE_SESSION_ID python3 /home/vantt/projects/forgentX-s8-review/plans/260925-documentation-authority-unification/reports/phase-08/step-02j-replay.py --input-commit 1a0f61ac5`.
- Run A, cwd = worktree root: exit 0, stderr empty, stdout 58100 bytes.
- Run B, cwd = /tmp, absolute path: exit 0, stderr empty, stdout 58100 bytes.
- `cmp a.out b.out`: IDENTICAL. sha256 `a1ba3fb613ca57647665dde8558f5031429bf4c47d23025c8803efbbfd3a8ea3` for both. It equals the hash recorded for both replays in `step-02j-verification.json`.
- The receipt JSON equals `step-02j-verification.json`.replayReceipt exactly.
- `python3 step-02j-probes.py`, from cwd /tmp: exit 0, standalone-runnable, output identical to the receipt's `defectRegressionProbes`.
Outputs are under .../review-6/w-replay/ (a.out, b.out, probes.out).

## Counts (all match the request and the verification file)
- status PASS, failureCount 0, sourceInputCommit 1a0f61ac5...
- 8496 edges, 1037 files, 2348 mappings, 253 parts, sample 1275, 14303 review entries, 56 code exclusions.
- Actions: preserve 4640, cutover-patch-only 1126, preserve-pending-target 1903, preserve-pending-behavioral-proof 617, phase9-row-flip 210. These sum to 8496.
- Probes: 222 regression probes = 192 inherited (frozen at the 02i checkpoint) + 30 added. 9 syntax cases, 9 negative mutations (all rejected), 3 current invariants (all-ten-classes-reject-02i-behavior, patches replace a complete unit, every pending row blocked with no patch).
- Class coverage: `classDiff` carries one entry for each of classes 1 to 10. Before counts: 305, 142, 981, 100, 303, 77, 1146, 213, 249, 163. After counts are 0 for every class. The 30 added probes are named witnesses (for example the CoordinationSession passage, RUL10, backlog generator claim, cli-004/008, wrapped `//` comment). The probe records carry no class labels. I judged class-by-class coverage from the probe names plus the invariant "All ten L12-26 classes reject 02i behavior", not from a per-probe class field. I did not verify that each class has exactly one probe.

## Hash comparison
- `step-02j-verification.json` codePins (5), artifactPins (9), the index `sourceTablePins` (3) and `inputEvidencePins` (124) were recomputed independently with sha256 over the committed bytes. Mismatches: 0.
- The replay itself rebuilds the full census from the committed tree (`expected=parser.build()`), recompiles the downstream tables with `packet.compile_packet`, and byte-compares them with the committed tables. It reported no stale table.

## Existence from the committed Git tree
- `step-02j-parser.py` builds `TREE` from `git ls-tree -r -t -z <input commit>` and defines `exists`/`is_file`/`is_dir` over it. It reads bytes through `git cat-file --batch`.
- grep for `.exists()`, `os.path`, `isfile`, `isdir`, `is_file()`, `is_dir()` in the parser, semantics and packet files: no matches. The only working-tree read I found is `ROOT/plans/.../phase-06/draft-alias-merged-step10.json` (parser line 328). That is plan evidence read through `read_text`, not an edge-target existence check.

## Seeded sample recomputation
Recomputed independently from `step-02j-census-maps-portals-prose.json` edge ids. Seed `A50-L12-26-merged-20261019-step02j-7f491cc2`, rank = sha256(seed + NUL + edgeId) ascending (tie-break on id), n = ceil(0.15 x 8496) = 1275.
- My set equals the recorded `review-data.sample` set: 1275 ids, 1275 unique, symmetric difference 0. The recorded seed string matches.

## Mandatory re-review set
- Set `mandatory-rereview-action-target-patch-changed-from-02i` has 2128 ids, matching the request.
- I joined 02i (5436 rows) and 02j (8496 rows) independently on (consumerPath, normalizedReference, matchedExpression), preferring the same line, and compared cutoverAction, desiredOwner, desiredAnchor and cutoverPatch. My changed set had 2129 rows. 2128 are in the mandatory set. The one extra is `maps-j-08191` (docs/specs/reading-map.md line 42). It is a join artifact and not a changed row: it is a new row from the merged main text (a new `docs/specs/workflow.md` bullet, a new call-site hash 2d444b96), and its 21 same-expression 02i siblings are different bullets. The mandatory set contains no row outside my changed set.
- 20 changed rows spot-checked (random seed 7, list in w-replay/changed20.json). Each shows a real change in action, owner, anchor or patch from its 02i counterpart. Examples: `maps-j-06982` patch-only to preserve, `maps-j-00743` patch-only to preserve-pending-target, `maps-j-01830` owner-only change, `maps-j-00453` patch-text-only change. All 20 are members of the mandatory set.
- 02i rows with no 02j join: 0. The set `mandatory-rereview-removed-from-02i` lists 3 controls.
- Gap to note, not a defect: 3060 02j rows have no 02i counterpart (new lexer rows plus main-merge rows). They are not in the mandatory set. 470 of them are in the seeded sample, and 644 are in no review set at all (2240 edges in total are in no set; they rely on the sample/expansion rule). This matches the request wording ("included in the same input-commit population").

## Merge rebindings (`step-02j-merge-rebindings.json`)
inputHEAD 1a0f61ac5, prior 930f4eb5e. 388 checked, 73 rebound, 0 parked, drift 0, approvalCarry false. These agree with `bindingCheck` in the verification file.
5 random entries (seed 11), each checked against its target file at the worktree HEAD:
| decision file, rowIndex | target | prior to resolved anchor | result |
| --- | --- | --- | --- |
| s4-packaging-main-recarry, 3 | packaging-distribution/spec.md L721-724 | unheaded-block-95 to 96 | OK |
| s9-runner-01, 22 | docs/specs/runner.md L3177-3195 | 318 to 323 | OK |
| s5-root-boundary-sync, 8 | packaging-distribution/spec.md L684-707 | 91 to 92 | OK |
| s7-step09-main-import-accounting, 2 | packaging-distribution/spec.md L440-444 | 75 to 76 | OK |
| s4-packaging-distribution-architecture, 352 | packaging-distribution/spec.md L365 | 65 to 66 | OK |
For each: text equals the file lines at the stated span; sha256(text) equals textDigest and after.targetUnitDigest; the prior and resolved passage text are identical; the ancestry is equal; and the anchor matches `after.targetAnchor`.

## Edge spot-checks against source bytes
Five edges (random seed 2026). For each I read the source with `git show 1a0f61ac5:<path>`.
- All 5 pass the physical span text and the file digest checks.
- `maps-j-01952` (doc-registry.json, moved-target, preserve-pending-target): the old path is absent from the tree, as the row says. Its `successorNote` names the existing `docs/knowledge/how-to-close-out-a-work-item-whose-real-work-was-already-don/...` file, which is present, non-executable and lookup-only.
- `maps-j-05235` (provenance, preserve): the retired-engine target exists.
- `maps-j-08234`, `maps-j-08386` and `maps-j-01682` (retained-reference, preserve): `docs/backlog.md`, `docs/README.md` and `docs/distillery/sources/repository-harness.md#protocol...` all exist in the input tree and match class 3 and the L12-26 text.

## Concerns (none blocking)
1. The request's example command has no `--input-commit`, and the parser defaults to HEAD. The request should give the exact argument. The committed `verification.json` records the replays without the flag, probably run in the author worktree where HEAD was 1a0f61ac5.
2. Class probe-to-class mapping rests on probe names and the aggregate invariant (see Counts).
3. The 02i-to-02j join is ambiguous for repeated same-expression citations in a refreshed file (135 ambiguous groups in my join). The author's `source_join` yields a mandatory set that contains every row I found, so this is not a gap.

Status: DONE_WITH_CONCERNS
