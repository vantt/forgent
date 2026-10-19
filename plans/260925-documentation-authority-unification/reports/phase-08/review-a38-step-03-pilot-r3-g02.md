# Step 3 pilot round 3 review: g02, batch-040, docs/specs/reading-map.md

Pin `ae141550c` (reviewed worktree `bade80e52`). Read in full: the source (72 lines, 35,721 bytes), the batch-040 record (82 inventory edges plus 8 author-added edges, `checks`, `authoringRules`) and the complete diff. I applied the diff to a scratch copy with `patch`. It applies cleanly, and a per-line token diff matches every `patch` edge (target, anchor and retained label). I diffed the round-2 record against the round-3 record to find what changed. I read the targets at the pin: packaging-distribution §3.3 and the retained shell-helpers heading, work-state §11, cli-io-contract §3 and §7, the runner business-rules subcomponent, the runner decision history (0048 and 0049 H3 under one H2), the agent-coordination and host-invocation-routing candidate trees, the confinement history, the claude-plugin spec, the herdr dashboard spec and the doc-registry alias. I replayed the resolver for 08181, 08191, 08150, 08165 and 08167. I did not run the checker or the probes.

## File verdict

- Path: `docs/specs/reading-map.md`. Set: batch-040.
- Verdict: **rework**. There are two adjacent-description defects (08169, 08170) under L12-30(6), plus a text-only defect in five reasons.
- Dispositions, 90 edges in all (82 inventory plus 8 added): 37 patch, 24 preserve, 26 parked (18 inventory plus 8 added), 3 row-flip. The 82 inventory edges are 37 patch, 24 preserve, 18 parked and 3 row-flip, with 08215 moving from preserve to parked.
- `authorAddedEdgeIds` equals the 8 added edges. I scanned every line for `docs/specs`, `docs/architect` and bare `*.md` names. The only uncovered legacy-tree names are the 8 added ones. The remaining bare names are retained or non-legacy, such as the root `README.md` at L21 (explicitly excluded with a reason), `spec.md` inside `docs/platform/**` paths, and `AGENTS.md`/`SKILL.md`/`plan.md`.

## Round-2 defects confirmed fixed

- **maps-j-08215.** It is now parked as a dead live navigation link. `git log --all` and `ls-tree` find no such file at the pin, and the only other live hits are the two runner copies of the same dead path. The reason states the never-existed fact, the present-tense "tại" and the smallest blocker (missing evidence report or a row correction). This complies with L12-31(3).
- **maps-j-08194.** The reason now says the 5-file list does not match the candidate layout: two files exist under `architecture/`, two are renamed and one is absent. See the Lead note below on the precision of "became" and "not found". The park is correct and the blocker is real.
- **Anchor precision (L12-31(1)).** 08181, 08182, 08189 and 08192 now anchor on `#business-rules`. RUL53 (line 90), RUL84 (178), RUL89 (183) and RUL93 (187) are all under the single `## Business Rules`, and no narrower holder exists. 08191 anchors on the H2 `#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4`, the nearest common parent of the separate `### 0048` and `### 0049` headings. The slugs and `enclosingHeadingProof` coordinates check out. The other anchors (`33-dev-checkout-channel`, `3-output-direction-unified-envelope`, `7-machine-readable-verb-registry`, `11-business-rules`) are valid listAnchors slugs.

## New defects

| edgeId | Source line | Rule | Problem and required correction |
|---|---|---|---|
| maps-j-08169 | 35 (src), diff line 30 | L12-30(6), L12-30(3) same-kind | The `plugins/fgOS/` row keeps the gloss "12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts)" next to a link repointed to `docs/platform/claude-plugin/spec.md`. That target states "wraps more than the original 12 verbs ... `/fgOS:check` has no shipped skill" and "`/fgOS:check [id]` is not shipped". The gloss is false for the new target. The identical gloss is parked as `author-r3-docs-specs-system-overview-L20C129` for exactly this reason, so the same-kind rule is also violated. Correction: park 08169 with "description needs rewrite" and the claude-plugin spec evidence, and drop the line-30 hunk. Alternatively patch it and rewrite the gloss from the target. Use the same disposition as system-overview. |
| maps-j-08170 | 36 (src), diff line 31 | L12-30(6) | The herdr dashboard row says "bật mặc định, port 8788, token bắt buộc" next to a link repointed to `docs/platform/herdr-web-dashboard/spec.md`. That spec says the gateway listens "on port 4170 by default (`gateway.port` overrides it)" and has no 8788. The code default is also 4170 (`DEFAULT_PORT` in the gateway source). The 8788 value exists only in the retiring `docs/specs/herdr-web-dashboard.md`. A path-only patch leaves a description that is false for the new target. Correction: either update the description in the patch ("port 4170 mặc định, `gateway.port` ghi đè"), or park 08170 with "description needs rewrite" and the evidence. The g05 record for `docs/specs/herdr-web-dashboard.md` may carry the same 8788 claim, so please check it. |
| maps-j-08181, 08182, 08189, 08191, 08192 | 38, 38, 41, 42, 43 | L12-31(1), factual reasons | The `anchor` field and the diff are correct, but the first sentence of each reason still names the superseded anchor (`...spec.md#added-in-candidate-runner-business-rules`, or `#added-in-candidate-runner-lịch-sử-...` for 08191). Only the appended L12-31(1) sentence names the real one. The reason now names two different anchors. Correction: rewrite the first sentence to the anchor actually patched. This is text-only; the patch itself is right. |

## Lead-judgment questions

1. **08150 claim holder.** The patch targets live §3.3 Dev Checkout Channel (96-110). That section covers sourcing the helper and the tier order. The row's claims about worktree-safe resolution via `git rev-parse --git-common-dir`, the "installs nothing" behaviour and the literal heading "Dev checkout shell helpers" live in the carriage H5 at spec.md:578 under "Retained Distribution Source Detail". L12-30(3) says to patch to the live section, and the label is kept and still resolves in the same file. I accept it, but this is a partial holder, so please confirm.
2. **08189 and 08192 row-wide pointers.** In rows 41 and 43 the trailing `spec: docs/specs/runner.md` closes the whole row (Workflow engine and Execution Core). It is narrowed to Business Rules because RUL89 and RUL84 are the only locators. Business Rules does cover Unit, `bind()` and `fgos run` (RUL84-99), but it has no CollaborationPattern or DAG content. L12-31(1) supports the anchor. The alternative is the runner `spec.md` area pointer under L12-30(7). I accept what was authored.
3. **08194 and the five `L45C*` added edges.** The reasons say `host-invocation-provider-routing.md` "became" `provider-routing.md` and `rust-cli-and-proof-components-plan.md` "was not found". The witness hits show a split. The routing file was promoted into `host-use-cases.md`, `invocation-kernel.md`, `provider-routing.md` and `release-boundaries.md`. The Rust CLI plan is restored verbatim in `contracts/component-protocol.md` (line 277) and `verification/{compatibility-harness,r1-rust-host-proof,r2-external-process-proof}.md`. No file with that name exists, so the wording is not false. The blocker (rewrite the whole list at Phase 9) is correct. I suggest saying "split across ..." instead of "became" or "not found". I do not count this as rework.
4. **Unlinked locator at line 29.** "xem spec Work-State RUL10" has no path, so neither the inventory nor the basename scan covers it. The area name stays true after cutover and RUL10 is in work-state §11. I would keep it as preserve. Please confirm that no edge is wanted.

## Parks and preserves verified

- **Parks.** The remaining parks name real blockers and their live hits are unusable.
  - Missing end-user-docs destination (P8-DOC-GAP-02): 08154, 08177, 08180, 08203, 08204. The only live hit is the switchboard row that still lists the legacy paths.
  - Platform-foundations destination (P8-DOC-GAP-02): 08138.
  - Step 5 scan-scope parity (L12-30(8)): 08157.
  - Confinement §13.1 recipe held only by carriage (rollout-and-settled-facts.md lines 51-59; the live spec, contract and decisions only mention private-home incidentally): 08185.
  - Whole-source carriage (L12-30(3)): 08187 (architecture-intent header "Agent carriage"/"Preserve the complete source"), 08188 (domainization "Source snapshot retained"), 08186 (no README in system-architecture, history carriage only).
  - Workflow carry: 08190.
  - Description rewrites: 08145, 08176, 08152, 08193, 08194 and the 8 added edges. The added L44 edges note that `coordination-session.md` and `flow-definition.md` exist only under `history/retired-engine/files/contracts/`.
  - Hit groups are assessed per query, with files, line counts and excerpts.
- **08215.** Dead-link park confirmed as above.
- **Preserves.** The 24 targets all exist at the pin and none is under a retiring tree. 08155 carries a real successor note (`docs/knowledge/decisions-index/decision-record.md`, which exists).
- **Row-flips.** 08136, 08142 and 08143 are unchanged as whole-row Phase 9 flips.
- **08171.** The doc-registry alias resolves, the legacy file is absent at the pin and the target exists.

## Denominator and numerator

- batch-040, this report: 1 file reviewed (g02), 1 rework, 0 ok. The other 10 batch-040 files belong to g05 and g06.
- Inventory edges in this file: 82 (37 patch, 24 preserve, 18 parked, 3 row-flip). Added edges: 8, all parked. Edges needing correction: 7 (08169 and 08170 disposition or description, plus text-only on 08181, 08182, 08189, 08191 and 08192).

Status: DONE_WITH_CONCERNS
Summary: `docs/specs/reading-map.md` is rework. The round-2 defects (08215, 08194) and the anchor-precision rulings are fixed, and the 8 added edges and all parks check out. 08169 ("12 verb wrapper" vs the candidate's unshipped check, parked in the sibling record) and 08170 ("port 8788" vs the target's 4170) leave descriptions false for the new target, and five patch reasons still name the superseded anchor.
