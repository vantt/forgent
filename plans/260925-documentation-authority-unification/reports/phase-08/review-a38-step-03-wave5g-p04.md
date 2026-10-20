# Review a38 step-03 wave5g part 04

Reviewer read the pinned sources whole (both files under 120 lines, read through EOF), the record headers and diffs, every edge field, the proof fields, and the committed targets at pin ae141550c. HEAD 9117e9cb6 holds both consumer files byte-identical to the pin. No checker, probe or resolver script was run. `scripts/list-doc-anchors.mjs` was run read-only to confirm anchors.

## File 1: docs/platform/session-identity/spec.md

- Set: batch-116. Stratum: patched-seeded.
- Record digest: f304413c7ac40d0511e69fa9e00a986b6ae0c7c8dd6bd84dce73e8bee62573e9. Diff sha256 prefix: e75b75fd1106ad65.
- Verdict: **ok**. 3 edges reviewed (maps-j-07749, maps-j-07750, maps-j-07751). The 98-line source was read in full.

Edges:
- **07749** (L20 `docs/io-contract.md`, Related list): preserve. `docs/io-contract.md` is a retained root in transitional-switchboard.json (scope `retained-cli-io-contract`) and exists at the pin. Correct.
- **07750** (L22 `docs/specs/observe.md`, Related list): patch to `docs/platform/observe/spec.md`, Phase 9, no anchor.
  - The target exists. Its Provenance is `docs/specs/observe.md`, so it is the area's exact live holder.
  - The Related list does not already name it, so this is not a duplicate.
  - This is whole-area navigation, so no anchor is needed. The diff changes exactly line 22.
  - The target header says "Carriage only", but per L12-26 that is a pre-promotion candidate status and a valid target.
  - Correct.
- **07751** (L30 `[io-contract](../../io-contract.md)`): preserve. The relative link resolves to the retained `docs/io-contract.md`. Correct.

Other checks:
- No missed reference. The remaining paths are `packages/...`, `src/...`, `plans/...` and `docs/platform/component-boundary.md` (exists), with no retiring tree.
- The legacy scan has 0 candidates, which agrees with my reading.
- Patch adjacency is true: the Related-list item is navigation and the diff is a single-line swap.

## File 2: docs/platform/runner/contracts/routing-handoff.md

- Set: batch-115. Stratum: the ADR-prefix locator whole-file supplement, an extra file outside the A51 patched and unpatched draws. Both strata keep their own denominators (it counts in neither).
- Record digest: 97b9a2cb6f1bc3acad1ec1a882b32660fda06538e008d66d57a2029cb0ae325d. Diff sha256 prefix: 62fd9f53a00b76b2.
- Verdict: **ok**. 7 edges reviewed (07608 through 07614). The 113-line source was read in full.

Edges:
- **07608** (L9 `Provenance:` `docs/routing-handoff-contract.md`): preserve. This is a provenance line (L12-47), and the root is retained. Correct.
- **07609** (L17 Related `docs/routing-handoff-contract.md`): preserve. The target survives Phase 9: it is `legacy-current`, maintained-authority in the switchboard, and progress.md records "retain in place". The Related list does not name this candidate file, so it is not a self-entry or duplicate (L12-34(4)). Correct.
- **07610** (L23 `docs/platform-foundations.md`): preserve. It is a retained root and an L4 law citation. Correct.
- **07611** (L54, table cell `docs/specs/work-state.md` "(schema work)"): patch to `docs/platform/work-state/spec.md#3-work-item-data-dictionary`, Phase 9.
  - Target heading L58 is `## 3. Work Item Data Dictionary`, and the repo anchor id matches.
  - The section holds the whole Work record schema (29 fields).
  - The adjacent claim ("schema work", `fgos add` one-door write, no direct event writes) is untouched and true.
  - Correct.
- **07612** (L107 `docs/specs/confinement-authority.md` §9.2): patch to `docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer`, Phase 9.
  - Target L454 is `### 9.2 hostRead: blind — worker mù trước run state của peer`.
  - Compared with the source claim: "blind role reads only its own directory, with byte-copied inputs in `inputs/`" is in the section's `resolveUnitInputs` paragraph.
  - "Refused to run when it cannot be enforced" is in the paragraph "Dispatch `blind` bị từ chối, không bao giờ chạy không-blind" (`blind-requires-confinement` and similar). The next heading after this block is `## 11`, so the paragraph is in §9.2.
  - The `.fgos/assignments`, `workflow-runs`, `dispatch-runs`, herdr socket and private-home list also matches `BLIND_HIDDEN_ROOTS`.
  - The visible label "§9.2" stays true with the new anchor.
  - Correct.
- **07613** (L112 `docs/platform-foundations.md` L4): preserve. Correct.
- **07614** (L113 `docs/specs/runner.md` "(ADR-0005 Runner & cô lập worker, D3/D4)"): patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0005-runner-cô-lập-worker`, Phase 9.
  - Target L30 is `### 0005 — Runner & cô lập worker`.
  - It is the only `0005 — Runner` heading under docs/platform at the pin. runner/spec.md has no ADR-0005 text.
  - The Decision subsection holds the runner-verify goal-check, single-writer, isolated-branch proposal and independent-review clauses the source cites.
  - The visible label "ADR-0005 Runner & cô lập worker" matches the new anchor (advisory locator flag 07614 confirmed).
  - Correct.

Other checks:
- No missed reference. The only legacy-root paths in the source are the three patched ones (plus retained roots).
- Bare "RUL5 (platform-foundations)" and "D1/D3/D4" labels are not path edges (L12-49).
- The legacy scan has 0 candidates.
- The diff has 3 hunks, applies exactly to those three spans, and has no stray edits.

## Counts

- batch-116, patched stratum: 1 reviewed, 0 rework.
- batch-115, ADR-prefix supplement: 1 reviewed, 0 rework. This is an extra file and does not enter the batch-115 patched or mandatory denominators.
- No unpatched-stratum files in this part.
- Part total: 2 files, 10 edges reviewed (3 plus 7), 0 outcome rework.

## OUTCOME defects

None.

## Record-text notes (not rework)

1. 07614 and 07613 sit in the same physical source paragraph (L111-113) with different dispositions (preserve for retained root, patch for retiring path). Neither reason carries a "Distinct claim:" sentence. The difference is real (retained path vs retiring path), and the checker accepted it.
2. The 07614 reason says D3/D4 "span its Decision subsection". The literal strings "D3" and "D4" appear in neither the ADR 0005 holder nor the deleted original docs/decisions/0005 file. The labels were already unresolved in the source and the patch does not change them.
3. The repo anchor id of 07612 and 07614 uses collapsed hyphens (`blind-worker`, `0005-runner`). That is the repo's own `listAnchors` `anchor` field, which the checker uses. The GitHub-style slug in the same API output uses double hyphens (`blind--worker`, `0005--runner--cô`). This is not a defect under the repo's convention.

## Lead-judgment questions

None.

Status: DONE
Summary: Both files (session-identity/spec.md, runner/contracts/routing-handoff.md) pass: all 10 edges have correct disposition, target and anchor against the committed target sections, with 0 outcome rework. Three record-text notes only.
