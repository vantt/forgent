# Step 5 pilot bounded re-review, part 01 (rr-p01)

Pin aa8d343746a292d2cb476ab76e6489411fd59a62, review worktree at 080e7ccad. All source sha256 values in the payload and records match `git show <pin>:<path>` for gateway.rs, mcp.rs, pre-commit and command-registry.mjs. I did not run any checker, probe, test or cargo. Scratch copies of pinned files and diffs were used only under my scratch dir.

Payload: 28 records. 8 are changed outcomes: 000161, 000182, 000766, 000110, 000111, 000566, 000571, 003641. The other 20 are unchanged admitted literals shown for final-state context.

## Verdicts

| File | Seam | Verdict | Records seen |
|---|---|---|---|
| apps/fgos-gateway/src/gateway.rs | gateway-contract | ok | 161, 182 (changed) plus 168-189 admitted refs (unchanged) |
| apps/fgos-gateway/src/mcp.rs | gateway-contract | ok | 190-195, 200 (unchanged) plus dynamic-000766 (changed) |
| .githooks/pre-commit | cli-help-messages | ok | 110, 111, 114, dynamic-000566, dynamic-000571 |
| src/cli/command-registry.mjs | cli-help-messages | ok for the slice seen. Final verdict needs the later part(s) | 003641 (changed), 003642 |

The command-registry slices not in p01 are 003655 and 003666 (both changed). I did not see them in this payload. I read their records only from the committed records file for cross-checking. They are NOT reviewed here, and the final command-registry verdict needs their part.

## Outcome defects

None found in the 8 changed outcomes.

### gateway.rs, reference-000161 (line 131) and reference-000182 (line 13): REJECT/preserve to ADMIT/parked: correct
- Both pinned lines cite `docs/specs/distribution.md` (comments, row 5b, gateway token global config). Spans match the pinned bytes (131 cols 6-32, 13 cols 52-78).
- Step 4 `step04-012` holds both slots (class6-l-000026 and class6-l-000023) as `parked` with a phase9-carry. The Step 5 records now join to those slots by recordFile, sha256 and slotKey, copy the Step 4 blockedReason and dependency, and set `blockedCategory: phase9-carry`.
- This reverses the earlier D1 defect from the first pilot report (silent preserve over a Step 4 park). `parked[]` in the gateway.rs file record is now `[reference-000161, reference-000182]`.
- The receipt `gateway-contract-pilot.blockedBy` names both parks.
- No diff and no patch claim. `aliasWriteCheck` says nothing is written. This is consistent with the rule that a park is allowed when there is no live holder with the same passage. docs/specs/** is deleted in Phase 9.
- `proofCommand: missing` is correct for a parked comment.

### mcp.rs, dynamic-000766 (126:38-48, `path::Path`): ADMIT/preserve to REJECT/preserve: correct
- The tuple is the type token inside `root: &std::path::Path` in the `search_contract` signature. It is not an operation.
- It now agrees with dynamic-000765 (the full `root: &std::path::Path` span, REJECT, role type/import).
- The real operation on the next line is still admitted: dynamic-000767 (`root.join("docs/contracts/fgos-gateway-api-v1.yaml")`) and dynamic-000768 (`contract_path = ...`), both ADMIT/preserve contract-reader. reference-000200 (127) is ADMIT/preserve with proof `missing`.
- Preserve is right for both HTTP and MCP reads. Phase 9 deletes only docs/specs/** and docs/architect/**, and the candidate yaml is byte-equal (see the parity check below).

### .githooks/pre-commit: 000110 (line 491), 000111 (line 523), dynamic-000566 and dynamic-000571: correct
- 110 and 111 stay ADMIT/patch, timing phase9, role emitted-message.
- dynamic-000566 changes from REJECT/preserve to ADMIT/patch and dynamic-000571 from ADMIT/preserve to ADMIT/patch. Both carry `samePassageOwner` (110 and 111 respectively).
- This is the shared literal/dynamic outcome rule: one passage, one outcome, one diff. Tuple lines map to the current lines with a consistent +28 offset (463 to 491, 495 to 523).
- The pinned file has no other doc pointer. My grep of pre-commit for `docs/`, `.md`, `plans/` and `archive/` shows only these lines:
  - 14, 355 and 356: comments (Step 4 preserve; 112 and 113 are REJECT/preserve).
  - 36: `HOW_TO_DOC`, reference-000114, preserve (workshop-root pointer outside this repo).
  - 435: a staged-path regex for `plans/(reports|journals)`.
  - 491 and 523: the two admitted messages.
- I applied the file's forward diff to a scratch copy of the pinned bytes. Results:
  - It applied cleanly and gave sha256 `cf683921c398...`, which equals `expectedAfterSha256`.
  - The rollback diff restored `ebcefc2815d0...`, which equals the source sha.
  - `diff` shows exactly two changed lines, 491 and 523.
- The old path `docs/how-to/fix-fgos-write-rejected-merge-block.md` does not exist at the pin. The target `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` exists at the pin, and its sha256 `447cc6d8...` matches the record. The registry alias `docs/how-to/fix-fgos-write-rejected-merge-block.md` resolves to that currentPath. The alias is used for lookup only; no writer destination adopts it.
- No generated output is touched. The user-visible delta (two refusal strings) is named in the receipt `intentionalDeltas`, and the CHANGELOG co-cut is listed.
- The expanded co-cut test set is `['CHANGELOG.md', 'test/runner/merge.test.mjs']`.
  - It comes from the author's literal grep of the old pointer under test/.
  - merge.test.mjs lines 1263 and 1265 assert `formatFgosWriteRejectedDetail` (the merge.mjs message). They do not exercise the hook.
  - The e2e hook test (`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs:396`) matches only the basename regex `/fix-fgos-write-rejected-merge-block\.md/`. It passes before and after and is not listed.
  - This is a Phase 9 specification only, so it is not an outcome defect. See the notes and Lead questions below.

### command-registry.mjs, reference-003641: ADMIT/patch to ADMIT/parked, span remapped to line 1760: correct
- Verified in the pinned file: line 1760 cols 95-106 is `docs/how-to`, inside `quadrant: { ... description: 'The docs/<quadrant> directory to scan (e.g. docs/how-to).' }`. Its own passage window is 1758-1762.
- The old record shared the span of line 1746 (`examples: ['fgos doc-sources docs/how-to/check-rollup-progress.md']`). Line 1746 is now owned by 003655 (patch, a separate record). This removes the previous duplicate or mis-mapped span.
- The park blocker is explicit: the scanner argument example still describes the quadrant layout; it needs construction, registered currentPath and a same-input proof before replacement.
- It matches siblings 003652 (1767) and 003653 (1768), the `authoritative-match --quadrant docs/how-to` examples, which are also parked. All span columns for 1746, 1760, 1767, 1768, 846 (`docs/specs/<area>.md` and `docs/specs/`) match the pinned bytes.
- No diff and `coCutPaths: null`, as expected for a park.

## Gateway parity (receipt gateway-contract-pilot)

- File parity is correct. Both yaml blobs at the pin have sha256 `9f200578ea39b4b4...` and 34,956 bytes: `docs/contracts/fgos-gateway-api-v1.yaml` and `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`. The gateway.rs and mcp.rs hashes match the receipt.
- Expected-after for both Rust files equals the source sha. There is no diff, so nothing is generated.
- HTTP and MCP proof is correctly marked `missing`.
  - The two cargo commands are `not-run`.
  - `contract_route_is_reachable_without_a_token` (gateway.rs:1737) proves only 200 and no-token reachability.
  - `search_` selects three mcp.rs tests (lines 526, 543, 560).
  - The missing-proof line names body bytes, content-type, fresh read, 500 envelope and MCP read/parse error parity.
- `intentionalDeltas` is empty, which is consistent with preserve. The moved-read delta is conditional and not selected. It now lists the MCP read-error message too (earlier note 5 is resolved).

## Record-text notes (no outcome change)

1. pre-commit co-cut attribution: `coCutTestEdits` attaches merge.test.mjs (lines 1263 and 1265, which assert the merge.mjs message) to reference-000110, and the same set is listed for 111, 566 and 571. The test does not cover the hook text. The set is atomic by shared old pointer. The reason text should say that, or the edit should be attributed to reference-003749 only.
2. dynamic-000766: the reason text is the generic "Scalar metadata/guard/accumulator or text serialization" boilerplate and the role is `non-document-operation`. Sibling dynamic-000765 uses role `type/import` and "Syntactic type/import" reason. It should be labeled the same way (type token).
3. Park categories for the same park kind differ in command-registry. 003641 has `blockedCategory: step5-parity`; 003652 and 003653 have `cutover-patch-only` with identical blocker text. One category should be used.
4. Several resolverWitness entries still say "retained/external project or comment; no replacement claimed" with `exists: false` or `exists: True`, even for parked quadrant and spec help (003643, 003652, 003653, 003666, and docs/history entries 168 and 189 in gateway.rs). This is wording only; the disposition and blocker are right.
5. Pre-commit line 36 `HOW_TO_DOC` (000114) is a pointer to a workshop root outside this repo. Preserve is correct. It is labeled `exists: False`, which is fine.

## Lead-judgment questions

1. Gateway: after the two token-row parks (161, 182), who owns the live holder for row 5b (global config token claim) in the Step 7 packet? The receipt says Step 7 owns final assembly. Confirm that the packet carries this carry.
2. pre-commit co-cut (see note 1): keep merge.test.mjs in the hook's co-cut as an atomic group, or drop it and keep it only on merge.mjs? There is no behavioral difference for the cut, but "exact test co-cut" suggests listing the e2e hook test as an unchanged retained proof instead.
3. command-registry: the final verdict is still open for 003655 and 003666. They must be reviewed in the part that holds them.

## Counts

- Records reviewed: 28 (8 changed, 20 unchanged context).
- By file: gateway.rs 13, mcp.rs 8, pre-commit 5, command-registry 2.
- Admitted references: 24. Parked: 3 (161, 182, 3641). Patch: 2 (110, 111). Preserve: the rest.
- Dynamic tuples: 3 (000766 REJECT; 000566 and 000571 ADMIT/patch).
- Outcome defects: 0. Record-text notes: 5. Lead questions: 3.
- All source spans in the payload match the pinned bytes (all 25 reference records checked by column).

Status: DONE
