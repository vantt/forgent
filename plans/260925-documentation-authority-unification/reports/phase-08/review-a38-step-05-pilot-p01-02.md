# Step 5 pilot review, parts 01 and 02

Pin: aa8d343746a292d2cb476ab76e6489411fd59a62 (review worktree at b9b245aea). All three source hashes match the record.
Slices seen: p01 is gateway.rs lines 1-2521 (29 references, 50 tuples, all 11 context windows). p02 is gateway.rs (52 tuples), mcp.rs (11 references, 27 tuples, whole file) and the first slice of .githooks/pre-commit (4 references: ids 110-113). `.githooks/pre-commit` reference-000114 (line 36) and its 52 tuples are in p03 and were not reviewed here.
Final verdict for gateway.rs needs only p01 and p02, so it is given below. The final pre-commit verdict waits for p03.

## Verdicts

| File | Seam | Verdict |
|---|---|---|
| apps/fgos-gateway/src/gateway.rs | gateway-contract | **rework** (2 references) |
| apps/fgos-gateway/src/mcp.rs | gateway-contract | ok |
| .githooks/pre-commit (p02 slice) | cli-help-messages | ok for references 110-113; final verdict after p03 |

## Counts

- gateway.rs: 29 references (11 admitted, 18 rejected) and 102 tuples.
- mcp.rs: 11 references (7 admitted, 4 rejected) and 27 tuples.
- pre-commit, p02 slice: 4 references (2 admitted, 2 rejected).
- Total: 44 references and 129 tuples reviewed.
- I checked these against the pin and the population files:
  - All 47 source spans match the pinned bytes.
  - All 129 tuple passages match the pinned bytes.
  - Reference and tuple populations for both gateway files are complete (102 and 27 tuples, 29 and 11 references, no missing and no extra).
  - A grep for `docs`, `contracts`, `history`, `specs`, `.md` and `.yaml` found no uncovered path-like reference.
- Uncovered lines are bare filenames (`CONTEXT.md`, `plan.md`), which are not edges (L12-49), and `.join("docs").join("history")` at 875-876, which is covered by tuples 759 and 760.

## Outcome defects

**D1. reference-000161 (class6-l-000026, gateway.rs:131) and reference-000182 (class6-l-000023, gateway.rs:13) have the wrong disposition.**
- Both comments cite `docs/specs/distribution.md` row 5b.
- Step 4 `step04-012` holds both as `parked` with a Phase 9 carry. The reason given: the gateway-token global-config claim is not conserved in a live holder, so the claim must be carried or reconciled before the citation is changed.
- Step 5 records both as `preserve`, with `rejectionRule: prior-comment-slot` and witness "retained/external project or comment; no replacement claimed, exists: true".
- This silently reverses prior custody (L12-60(1), L12-58 comment custody). The witness is also wrong. `docs/specs/**` is deleted in Phase 9 step 6, so the path only exists at the pin and is not a retained root. A Phase 9 reader would not see the carry.
- Correction: set disposition `parked` (or an explicit join to the Step 4 parked slot) and copy the Step 4 blockedReason and dependency. Add both ids to the file record's `parked[]`, which is currently `[]`. Replace the "retained/external" reason text.
- Reference-000161 also names the same file as the prior slot for l-000026, so the correction applies to both rows.

No other outcome defect was found in gateway.rs, mcp.rs or pre-commit references 110-113:
- Contract reads at gateway.rs:1187 (reference-000177) and mcp.rs:127 (reference-000200) are correctly `preserve`.
  - Phase 9 deletes only `docs/specs/**` and `docs/architect/**`. `docs/contracts/` is not in the switchboard or the alias table, and the alias table is empty.
  - L12-26(9) makes both reads behavioral.
  - The candidate copy is byte-equal, so the cutover can move the read later.
- The `docs/history` narrative reader is correctly preserved as an external-project convention (L12-10). That covers references 168 and 189 and tuples 758-762.
- All synthetic fixtures (169, 170, 172, 174, 178, 184-186, 190-195) are preserved with inline constructor, owning test and `isWriter` flags. No alias is used as a writer destination.
- Rejected comments 162-167, 171, 173, 175, 176, 179-181, 183, 187, 188, 196-199, 112 and 113 are backed by a Step 4 `preserve` slot, and every target exists at the pin.
- pre-commit references 110 and 111 are correctly `patch`, Phase 9 only.
  - The old path `docs/how-to/fix-fgos-write-rejected-merge-block.md` does not exist at the pin.
  - The registry alias maps it to the live `currentPath`, and that target exists.
  - I applied the record's forward diff to a scratch copy of the pinned file. It applied cleanly and gave `cf683921...fdd9`, matching `expectedAfterSha256`.
  - The rollback diff restored `ebcefc28...2943`.
  - The diff touches only lines 491 and 523, the two admitted emitted messages. Both message deltas are named and the CHANGELOG co-edit prerequisite is recorded.
  - No generated output is edited.

## Gateway parity receipt

- File parity is computed correctly. Both YAML blobs at the pin have the same sha256 (`9f200578...c09f`) and size (34,956 bytes).
- Receipt output contract matches the source:
  - 200 with `application/yaml`.
  - Missing or unreadable file gives a `GatewayError::unexpected` envelope with null exit code, and message template `could not read the OpenAPI contract at {root}/docs/contracts/...: {err}`.
  - The MCP YAML-parse error message matches `mcp.rs`.
- HTTP and MCP proof is correctly marked missing:
  - The body, content-type, fresh-read, 500-envelope and MCP error parity entry is `command: missing`.
  - The two cargo commands are `not-run`.
  - The named tests prove only the following. `contract_route_is_reachable_without_a_token` (gateway.rs:1737) proves only 200 and no-token access. `search_` selects exactly the three mcp.rs tests at 526, 543 and 560.
- `intentionalDeltas` is empty, which is consistent with preserve. The moved-read delta is recorded as conditional and not selected.

## Record-text notes (no outcome change)

1. References 168 and 189 (docs/history) and 172, 190-192 (docs/contracts) carry a witness `exists: false`, but both directories exist at the pin.
2. References 168 and 189 are emitted error text (`docsRef must resolve inside docs/history/`, `could not resolve docs/history/`) but are labeled role `reader/default` instead of `emitted-message`.
3. Reasons for the contract reads and synthetic fixtures cite "L12-10/26". L12-10 covers external-project history layout only. The contract retention basis is L12-26(3) and (9).
4. Tuples 765 (`root: &std::path::Path`, rejected as a type) and 766 (`path::Path`, admitted as contract-reader) describe the same declaration inconsistently. Tuples 743 and 744 are admitted as narrative-reader fixtures although they are a `secret.txt` writer and a `/tmp` route stub. Over-admission is harmless.
5. Receipt `conditionalMovedReadDelta` lists the MCP parse error but omits the MCP read-error message at `mcp.rs:129`, which has the same text as the HTTP one. Receipt-level proofs also do not list the existing `get_work_docs_*` tests for the preserved narrative reader. The per-reference `proofCommand` is `missing`.
6. Wrapped references 181 (gateway.rs:1248-1249) and 198 (mcp.rs:4-5) record only the first physical fragment as the span, while 179 and 199 record both. The passage text is complete.
7. 69 rejected tuples use one boilerplate reason ("operates on token config, verb argv, static web assets or isolated route fixtures"). It names the function and operation, so it is acceptable, but it is weak evidence per tuple.

## Lead-judgment questions

1. Phase 8 plan line 30 says to include the `/v1/contract` read "when preparing the cutover to the candidate registry contract". The author chose preserve at retained `docs/contracts`. That is consistent with Phase 9 deleting only `docs/specs/**` and `docs/architect/**`, but it leaves two byte-identical copies, the retained root file and the candidate under `docs/platform/herdr-web-dashboard/contracts/`. Should Phase 9 keep both, or move the read and retire the root copy? The record's conditional delta already enumerates the changed error text if the read moves.
2. After the D1 fix, the two `docs/specs/distribution.md` comment parks depend on a live holder for the token row 5b claim. Is that carried in the Step 7 packet?

Status: DONE_WITH_CONCERNS
Summary: gateway.rs needs rework for two references (000161, 000182) whose Step 4 park was silently changed to preserve. mcp.rs and pre-commit references 110-113 are ok, and the gateway file parity is correct with the HTTP and MCP proof correctly marked missing.
