# Review a38 step-05 seam 8, payload s4-src-p03

Payload: 106 file entries. 83 are empty (judgment rejects only, checker-owned, nothing to review). 23 carry items.
Items reviewed: 87 (86 items plus 1 authorAddedReference in package.json).
Outcomes: 48 admit/preserve, 21 admit/parked, 5 admit/patch, 13 reject/preserve.
No entry carries a diff or rollbackDiff.
The 5 patch items are inherited Step 4 exact-prior-operation slots whose complete diffs live in the Step 4 records. Step 5 adds no diff for them.

Method note: `git show` through the rtk hook returned filtered output (a spurious diff body). I re-read pinned bytes with `rtk proxy git show`.

## Per file

Every file below is verdict ok. No OUTCOME defects.

- docs/contracts/fgos-gateway-api-v1.yaml: ok. 18 items (9 parked, 4 docs/history preserve, 3 docs/io-contract.md preserve, 1 comment reject plus parks).
  - Parks on docs/specs/work-state.md, docs/specs/runner.md, docs/decisions/0011 and 0014, and the never-existing docs/history/tsk-4id.../RESEARCH.md join the exact Step 3 parked edges.
  - The blocker is real. apps/fgos-gateway/src/gateway.rs L1187 and mcp.rs L127 read this yaml at runtime. web/src/api/client.ts cites its line numbers and quotes "Rollup shape, opaque to this contract".
  - dynamic-001874 (`scope: gather-back`) is a true reject.
- docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml: ok. 18 items. It is byte-identical to the file above (cmp). Its parks join Step 3 batch-103 and have the same real blocker. The candidate architecture-map CTR010 row names this path as the live holder. dynamic-001894 is a true reject.
- docs/how-to/check-rollup-progress.md: ok. 3 items. Self-citations of its own retained path in the Document history section; preserve is right.
- docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md: ok. 3 items. Same, as historical coordinates.
- docs/knowledge/spec-docs-drift-.../spec-docs-drift-silently-...-test.md: ok. 4 items.
  - 002221, 002222 and 002224 cite docs/specs/distribution.md in past-tense incident narrative and a verbatim commit-message quote. Preserve rests on dated history with a tree-retires witness and a successor note, not on a "retained" witness.
  - 002223 docs/history path exists and is retained.
- docs/platform/contracts/architecture-manifest.json: ok. 1 item. `"map": "docs/architecture-map.md"`. The target exists at the pin and is retained. Preserve is right: the data field is read by the architecture test and is unchanged.
- dogfood-fixture/scenarios/expr-eval-chain.md: ok. 3 items.
  - 002276 points to the heading "Giai đoạn Chia-việc" of docs/specs/work-state.md. Only docs/history and docs/platform/runner operations still carry that heading, so no live holder exists. Preserve as tree-retires provenance is right.
  - 002277 carries a successorNote to the live 0018 heading.
  - 002275 docs/backlog.md is a retained root.
- herdr-dashboard/src/pane_scan.rs: ok. 2 items. The runbook and docs/history paths exist and are retained.
- package.json: ok. 2 items plus 1 author-added slot. `files` entries docs/how-to, docs/explanation and docs/enduser-docs-index.json are shipped-payload membership. Preserve is right: retained paths, and a move would be one Phase 9 payload-inventory unit, not a per-line patch.
- packages/distribution/rust/src/canonical.rs, verify.rs, init.rs and workspace.rs: ok. 4 parks plus 1 reject.
  - Each park names a passage-specific carry. They cover the §5 normalization table, the split §3/§6/§14 sections, and the line-297 git-common-dir rule, each with the exact candidate location. They are not boilerplate.
  - workspace.rs reference-002296 (L29) is a true reject: the pinned file has only one occurrence, at L3.
- packages/distribution/rust/src/manifest.rs: ok. 1 patch (002293, L4). Target and anchor `2-frozen-schema-v1-shape` exist. It joins Step 4 class6-l-000194, whose diff is complete and also repairs L3.
- packages/herdr-fgos-common/rust/src/fgos.rs: ok. 2 patches (002299, 002301) plus 1 history preserve (002300). Targets exist. 002299's anchor `fgostriage-table-columns` is the slug of the H1. Both join Step 4 class6-l-000200 and 000201.
- packages/host-runtime/.../bound_invocation_supervisor.rs: ok. 1 item (`docs/decisions/` in a role comment). Preserve is right.
- packages/observe/rust/src/sources/claude_transcripts.rs: ok. dynamic-004942 is a true reject: `temp_dir.join("project-phase00-docs")` is a test-created git worktree dir under the OS temp dir.
- src/install/coexist.mjs: ok. 003669 cites docs/history/install-coexistence/CONTEXT.md, which is absent in the pin tree. Preserve as design-origin provenance is right, and there is no holder to patch to.
- src/intake/discovery.mjs: ok. 4 items.
  - 003670 is a history preserve.
  - 003671 is an inherited patch. The anchor "Why disagreement parks instead of retrying" exists in the knowledge holder, and L42 "never silently overrides" supports the comment.
  - dynamic-009613/9614 are root derivations (reject is right; see note 1).
- src/intake/plan.mjs: ok. 12 items. 5 are history or retained preserves. 7 are rejects: caller-data text interpolations, the PATH_TOKEN_PATTERN regex, a Vietnamese ask-message scope field, and root derivations. The L923 docs/explanation path in the rationale string is owned by the cli-help-messages record, which has a complete patch. It is a separate operation from the L919 interpolation, so R7 holds.
- src/intake/verify-pattern-check.mjs: ok. 003688 history preserve. 003689 inherited patch: target exists, anchor `the-trap` exists, and the old docs/how-to path is absent in the pin tree.
- src/runner/agent-roster.mjs: ok. 1 history preserve; the path exists.
- src/runner/claim-liveness.mjs: ok. 1 history preserve; the path exists.

## OUTCOME defects
None.

## Record-text notes
1. dynamic-009613/9614 (discovery.mjs L331/332), dynamic-009661 (plan.mjs L586) and dynamic-009677 (plan.mjs L913) carry nonDocumentUse `state-event-store`. The operand is a content-root derivation, `resolveContentRoot(stateRoot, id, work.docsRef)`. A root-only pass-through label fits better. The rejects stand because the reader `readLockedContext(repoRoot, docsRef)` sits in src/runner/paths.mjs, a separate operation owned elsewhere. It is not rejected here.
2. dynamic-004942 (claude_transcripts.rs) uses `scalar-pass-through`. The true use is a test-owned temp-dir worktree.
3. reference-003686 (plan.mjs L311) has a single sourceSpan `docs/history/decompose-locked-`. The path wraps to L312 (`decision-footprint-coverage/CONTEXT.md`), as 003683 to 003685 do with two spans. Disposition is unaffected (preserve; the target exists).
4. reference-002301 (fgos.rs L242) is patched to docs/knowledge/fgos-triage-table-columns/... and anchor null. The comment says that doc "already documents" absent-goalTier-sorts-last. The moved holder has no ordering or "sorts last" text (L24 only says `-` when the item declares no tier). The reason text claims "moved-verbatim holder" and not the claim, so the record is honest. The wording is inherited from Step 4 class6-l-000201.

## Lead-judgment questions
1. Gateway yaml parks. All 9 parks in docs/contracts and all 8 in the docs/platform copy share one identical blockedReason. It is true at file level, but under R12's normalising rule it is templated. It does not name the concrete consumers that would break: client.ts L134 quoting "Rollup shape, opaque to this contract", the L105-401 line-number citations, the mcp.rs search parse, and the ratchet baselines listing docs/specs/work-state.md. The park text is inherited from Step 3 (batch-058 and batch-103). Recommendation: accept as inherited. If the checker's rule (b) flags it, name those consumers per file once, not per passage.
2. Same bytes, two outcomes. docs/history/tsk-4id-task-detail-screen/RESEARCH.md at L205 is parked in docs/contracts (reference-000307, Step 3 batch-058). The identical line is preserved in the docs/platform copy (reference-002240, batch-103). The path never existed in the pin tree. Preserve is the consistent outcome. Joins are exact, so this is inherited Step 3 divergence and not a Step 5 defect. Consider aligning at Step 7.
3. The parks on docs/specs/work-state.md and docs/specs/runner.md in the yaml have live holders (docs/platform/work-state/spec.md and others). The only thing keeping them from a patch is the served-bytes parity claim. If Phase 9 cuts the runtime reader to the docs/platform copy, those parks become patches in the same cut. The park is correct for now.

Counts: 87 items reviewed; 0 outcome defects; 4 record-text notes; 3 Lead questions.

Status: DONE
Summary: All 87 admitted items and judgment rejects in this part are correct in admission and disposition; no outcome defects, four record-text notes and three Lead-judgment questions (the shared gateway-yaml park text and cross-copy inconsistency are inherited from Step 3).
