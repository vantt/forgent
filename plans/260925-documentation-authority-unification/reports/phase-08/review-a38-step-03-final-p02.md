# Step 3 final review, part p02

Pin ae141550c. Read every source file whole, every edge and its reason, the proposed diffs, and the checks sections that apply (anchors, relativeResolution, labelForm, descriptionTruth, legacyScan). I ran no checker or probe. Targets were read at the pin.

## Verdicts

| # | File | Batch | Set / stratum | Verdict | Edges reviewed |
|---|------|-------|---------------|---------|----------------|
| 1 | docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md | 077 | targeted (disposition/target/anchor/diff/added-edge changed) | ok | 7 |
| 2 | docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md | 081 | targeted (record-text / correspondence / coverage) | ok | 9 |
| 3 | docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md | 081 | targeted (record-text / correspondence / coverage) | ok | 7 |

Totals: 3 files, 23 edges reviewed. Rework: 0 files, 0 edges. Outcome defects: none.
Per set: batch-077 targeted 1 reviewed / 0 rework; batch-081 targeted 2 reviewed / 0 rework.

## File 1 (batch-077): 7 edges, ok

- The 04701 and 04703 history banner is real. The file's own banner says "The account below is kept as history" (L9-15). 04701 (L13 `docs/specs/runner.md`) and 04703 (L281 `docs/decisions/0033`) both preserve under L12-54(3). Correct.
- 04703: the elided id resolves to the deleted `0033-cli-spawn-shaped-capacity-thang-hasLiveTaskAccess.md`. The successor note anchor matches the runner `h-36d872fbb0e5.md` heading at L1211, "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2". Title matches, as L12-39 requires.
- 04702, 04704 and 04706 are `docs/history/...` paths that exist at the pin (task-dispatch-unification and two-layer-dispatch DISCUSSION.md). They preserve as retained evidence or Source. The wrapped L19/20 and L457/458 spans are joined correctly.
- 04705 is the glob `docs/history/*capacity*/`. It preserves as an illustrative pattern inside a past-tense paragraph. Correct.
- The added edge for `0000-index.md` (L448) preserves as completed rename history with a record-only successor reference to `docs/decisions/index.md`. This matches the L12-51 "name the generated index beside removed 0000-index" ruling. The legacy scan has exactly this one extra candidate, and it is covered.
- Missed-reference scan: I grepped the whole source for docs/, specs/, architect, how-to, decisions/ and `.md` tokens. Every hit is an edge, a bare number (L12-49), a bare basename of a retained file, or the generic words "explanation/how-to/reference". The bare basename `diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` names a knowledge file that exists, so it is not a retiring path.
- Proposed diff is empty and every edge is preserve. This is consistent.

## File 2 (batch-081): 9 edges, ok

- 04966 (L145 `docs/decisions/0027-...md`) preserves as past-event decision identity. The elided name resolves to the deleted `0027-domain-so-huu-status-...-d1-d3.md`. The successor note goes to `retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary`. That heading exists at holder L536. L12-51 elided-name ruling satisfied.
- 04967 (L165) parks as description-rewrite, category equal on blocked and dependency. The claim holds. The source says the 0027 audit enumerated a Rust consumer at `herdr-plugin/src/fgos.rs`. At the pin, `herdr-plugin/src/fgos.rs` does not exist. The holder section "0027 Consumer Audit" (holder L645; row L726) lists `packages/herdr-fgos-common/rust/src/fgos.rs`. The CLI/JSON status-literal role matches and the file name does not, so the park is true.
- 04968 (L206), 04971 (L318) and 04972 (L331) preserve. Each is a past-tense "the audit flagged/named" clause in a completed child-task narrative. This stands under L12-51(3), "04967 park vs 04968/04971/04972 preserve stands". Each carries the 0027 successor note.
- 04969 (L311-312) patches at Phase 9 to `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`. The target exists at the pin and is the right file. I compared the complete adjacent text with the guide. The source says "the same category of trap ... catalogs for skill-prose verify". The guide's five traps are false-green greps, missing path/hidden-dir coverage and single-word greps. That is a true category analogy, not a claim that the guide covers Rust. The record states this explicitly. The diff hunk (source L308-315) applies cleanly. The wrapped backtick path splits after a hyphen exactly as the source did.
- 04970 (L317) preserves. It sits in the "stale triage-table doc gap" section, declared with historyRegion {heading, line 315, marker "so it shipped as its own"}. The section is a completed-task narrative (L12-46). Path facts: renamed at 126a8ae5 to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`, and the record notes it. Correct.
- 04973 (L383) and 04974 (L386-387) are the **Source:** provenance line. `docs/history/phase-2-status-category-schema/CONTEXT.md` exists and preserves. The deleted 0027 filename preserves with a successor note. L12-47 satisfied.
- No missed edges. The remaining hits are the bare `DISCUSSION.md` and the `plans/reports/research-...` path, neither of which is a retiring path.

## File 3 (batch-081): 7 edges, ok

- The deleted decision basename `0031-bo-guard-cam-tu-orchestrator-...-moi.md` at L63 is the one added edge (L12-51). It preserves in the Pointer maintenance history region (historyRegion heading L60, marker "No other content"). The successor note points to the runner 0031 heading, which exists at L993. The legacy scan has this single candidate and it is covered.
- 05016 (L55) patches at Phase 9 to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới`. This is present-tense navigation ("lives in ..."). The target section holds exactly the adjacent claim: the guard retired after 0029 gave "orchestrator" a new meaning, a narrower fix was not viable for a string match, and `launcher` stays valid. The diff hunk (source L52-58) applies.
- 05014 (L9) preserves as an evidence citation of the leak that tsk-1s5 reported.
- 05015 (L18) preserves. The how-to guide was removed at 270aa5ad with no successor, and the source itself says "that how-to doc ... removed". It is a past-event identity, not a live recipe.
- 05017 (L66, `docs/specs/runner.md`), 05018 (L67-68, `docs/history/orchestrator-worker-slots/DISCUSSION.md`, which exists) and 05019 (L70, `docs/specs/reading-map.md`) preserve inside the completed Pointer maintenance section (L12-46). 05017 carries the runner 0031 successor note.

## Record-text notes (not rework)

- 04703 and the L63 added edge in file 3 each repeat the identical "Non-executable successor note" sentence twice. It is cosmetic, and the sweep that added successor notes probably doubled it.
- 04701's reason names the history banner but carries no successor note. The banner cites "decision 0062 in docs/specs/runner.md", which now lives at runner `h-36d872fbb0e5.md` under "0062 — Xoá cửa thô; dispatch là tầng thấp ...". Adding that note would help, but the checker rule applies to removed-decision filenames only.
- File 3, 05017: preserved L66 says "`docs/specs/runner.md`'s own `0031` section, cited above". After Phase 9, the L55 citation above will read `h-36d872fbb0e5.md#...`. This is history narration of what tsk-4ah did, so preserve is right. A reader of the cutover state sees the two citations differ, so the note at 05017 could say that the citation above was patched.
- File 3, 05019 (`docs/specs/reading-map.md`) preserves with no successor note. That is allowed.

## Lead-judgment questions

1. L12-54 lists "04967 → retired-decision-history.md#0027-consumer-audit" among the applied reworks, but the final record parks 04967 as description-rewrite. The request text ("04967 description-rewrite explicitly compares old herdr-plugin/src/fgos.rs with pinned audit packages/herdr-fgos-common/rust/src/fgos.rs") matches the park. The pinned holder row does contradict the source's file name. I judge the park correct and consistent with the request. Lead should confirm L12-54's wording was meant to describe the eventual patch after the description is reconciled, not an immediate patch.

Status: DONE
Summary: Reviewed all 3 files and 23 edges of p02 against the pin. All three are ok with 0 outcome defects, plus a few cosmetic record-text notes and one Lead question about L12-54 wording versus the 04967 park.
