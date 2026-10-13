# Independent check request: post-closure main merge

> Current request: the A31 combined follow-up at the end of this file. The original conflict/52 conservation identities are accepted by cf5c64ce6; the older broad scope below is historical evidence, not a request to repeat that review.

Status: READY FOR REVIEW; Step 3 has not started. Author session: codex-session:1@2026-10-11.

## Pins and boundary

- Agent Coordination conservation closed before merge at `ce575996f653de9313e96539d9b82c82dc95665e`; independent projection report `dd1fe8d808aa60d559722b4c604acaff1894837c`, Receipt commit `2269f2d2790f5bcef0a9ea4838cf27954619feda`. Both D runs had zero fatal; strict E exactly matched 3 Rings holds, 342 exception groups and 320 candidate-unverified units, including complete ID membership. See `closure-fixes-applied.json.projectionClosure`. Truth of the candidate-unverified list remains UNPROVEN under A28.
- Main parent: `97ca636f905947ec332575dd8c5c9dc616228f28`; merge base: `a9abe55f25e3dcc8733734ecb16a69211ffe58c1`; actual merge commit: `f4ed59997325b7bbe94ba38df16d66ab20d9251e`. No rebase, push, main-checkout write, gate/checker/vocabulary/baseline edit or new history move.
- The sole conflicted file was `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md`. Resolution preserves the plan's current Workflow/preset boundary and historical qualification, imports main's fgos-panel → fgos-advise rename and the sole request-kind routing reference, and removes the inline taxonomy/Happy Path main removed. It does not reintroduce main's unchanged retired code-panel/coordination table. Check `git diff ce575996f653de9313e96539d9b82c82dc95665e f4ed59997 -- <path>` against main's actual delta `git diff a9abe55f25e3dcc8733734ecb16a69211ffe58c1 97ca636f905947ec332575dd8c5c9dc616228f28 -- <path>` and the current skill/reference.

## Complete machine pack

`review-request-2-main-merge.md.json` is the committed sidecar; it includes full native before/after text, ancestry, anchors, digests and current IDs, all new retired/gap rows, every fatal finding, changed code-evidence blobs, full strict-E identities, exact commands/results and preservation proofs. No author verdict is an independent approval.

Incoming documentation paths:
- `docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md`
- `docs/architecture-manifest.json`
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`
- `docs/how-to/use-fgos-group-thinking.md`
- `docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md`
- `docs/specs/distribution.md`
- `docs/specs/runner.md`

- Native anchor/text/ancestry comparison: **329** changed records (13 added anchors, 9 removed anchors, 307 changed), including positional-anchor shifts rather than claiming every record is a semantic rewrite. Review every changed claim; digest-equal positional shifts can be checked mechanically. Native carried identity counts are a different measure: kept 85,482, paired 286, edited-kept 20, added 46, gaps 29, retired 13.
- All prior live/gap/retired IDs remain represented in the new live/gap/retired union: zero lost IDs. New retired rows: 13; new gaps: 29. Do not guess successor IDs or carry approvals when text/ancestry changed.
- **173** accepted candidate-native-content receipt bindings now cite changed code blobs. Every old cited blob exactly matches the pre-merge parent; every new mismatch is attributable to this main merge, not pre-existing corruption. Check the same shown text against the new code and provide the necessary independently reviewed binding/evidence. This author has not rewritten or re-approved those receipts.
- The previous candidate list remains unchanged after closure. Native post-merge E shows **501** reverse-open units: 17 old listed entries no longer equal, 198 additional current units, and 303 surviving matching entries. All missing/additional IDs and their actual current locators/digests are in the sidecar. Do not silently replace the committed list or expand it to hide a binding failure.

## Gates and remaining work

Run the sidecar's four exact `gates[].command` arrays (D/E once per prior registry). Both D runs exit 1 with **37** fatal findings, equal in both proofs:

| Finding | Count |
|---|---:|
| decision-claim-unknown | 11 |
| decision-target-drift | 6 |
| decision-digest-stale | 5 |
| decision-target-anchor-missing | 1 |
| retained-claim-target-anchor-missing | 1 |
| retired-row-disposition-missing | 13 |

Both scoped strict E runs exit 1 with **43** fatal findings: those 37 invariants plus six open-category findings. Categories are 7 unknown-blocking, 10 not reviewed (3 existing Rings holds plus 7 newly exposed rows), 7 without rationale, 342 identical-owner groups, 5 undisposed gaps and 501 reverse-open units. The 342 exception digest groups and every source-ID membership are unchanged and still exactly equal. Post-merge strict equality is **UNPROVEN**, not a second batch-closure claim.

Check all 37 invariant findings and their source/retired/target bindings, all 329 changed native records, the 29 gaps, 13 retirements and 173 code-evidence bindings. Report any required authored decision, text correction or receipt update; do not mark a nonexistent binding ok. Source/retired verdict tables must use exactly `Claim | Verdict | Note | Source digest | Target digest`. Classification verdict tables must retain the parser's current-ID Class column and shown-text/evidence binding; no alias approvals. Notes will be copied verbatim only from a committed independent report. Three Rings holds remain held.

## One direct refresh; deferred registry persistence

Executed exactly once:

`node scripts/generate-doc-inventory.mjs --refresh --commit f4ed59997325b7bbe94ba38df16d66ab20d9251e --identity-registry plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json --json-out /tmp/phase06/review-doc-inventory.json --md-out /tmp/phase06/review-doc-inventory.md`

The persisted pre-merge registry sourceCommit was `44acff8ec03a60752495d2bec4a4cf96fb74890a`; it is carried directly to the merge, with no seed/replay or intermediate regeneration. Inventory: 4,378 documents / 85,834 units. Refreshed working registry SHA256: `9d7076c0d4c7e9b606e897f6bdccd2fe9bb969b3d0e7bf53c94b2cf0bea20a5b`. It intentionally remains uncommitted until Lead's merge review, per the owner's ordering. The pack pins all affected identities/digests, so do not regenerate it with new IDs during review.

Only the three existing legacy-root ratchet entries for the architect trigger surface, runner spec and distribution spec have updated expected digests for their imported main bytes. The rationale records this merge and content-review-owed; no frozen baseline/checker is relaxed. Ratchet checks 995 files: 25 accounted edits, one accounted new file, zero violation.

## Exercised safety proof

- `env -u CLAUDE_CODE_SESSION_ID node --test` with the seven explicit files in `tests.command`: **155/155 pass**, zero fail/cancel/skip/todo, counted by Node.
- Four actual read-only smoke commands in `runtimeSmokes`: 10 + 11 + 8 + 12 assertions; the CLI smoke checks 75 real help descriptors. All pass; no mutation/transport launch.
- Preservation: 74 historical witnesses, 867 inherited physical payloads, unchanged history tree, five frozen files, first-parent allowlist zero violations. Authority/reader-link isolation: zero changes. Constitution/placement: zero fatal.
- Candidate-routing check retains exactly the prior 30 finding tuples (all already recorded); this is not a claim of zero routing findings and no baseline was added.

## Required next action

Lead independently reviews and commits the merge report(s) covering the records above. Doer then applies only accepted bindings/notes, reruns both prior-registry D/E and full native identity equality, and commits the reviewed working registry. Only after those proofs pass may Step 3 begin under A28. Until then: **STOP, ready for the main-merge review**. No archive/delete decision or main-checkout write is requested.

## A31 combined follow-up: current review scope

READY FOR REVIEW. The original 52-row conservation review is accepted at `cf5c64ce64263143158540283f7bf5c794e89386` and all notes are applied verbatim. Do not repeat the historical broad main-merge scope above. Review only the **39 evidence-only re-pins and seven newly live legacy-source IDs** below. Code truth is not being re-reviewed; all 134 actually changed-code receipts remain candidate-unverified under A31. No current document text, carriage, gate, checker, baseline, vocabulary or main checkout changes.

### Receipt pin and machine check

Receipt commit: `a1fd2136a16dce642cc202a10b585efcf040fd3b`. Receipt path: `plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json`. Original receipt: `2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json`. Author session: `codex-session:1@2026-10-11`; every receipt retains its original authoredBy and every non-pin field.

`node /tmp/phase06/verify-code-evidence-repin.mjs` passes **39/39** (nine unchanged line ranges, 30 shifted; 51 changed citations). It reads both committed receipt artifacts, compares every old/new cited excerpt byte-for-byte, checks every new blob against the merge tree, and restores only evidence commit/blob/ranges before deep-equality checking all other fields. The complete replayable source and result are committed in `review-request-2-main-merge.md.json.a31Followup.repinVerification`; Lead should independently reproduce the comparison. No new shard ref is marked reviewed before that independent report.

The 39-row Class-column template is in `a31Followup.classificationTemplateMarkdown` (all pending). Required columns: `Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest`. The evidence digest is SHA256(JSON.stringify(currentEvidence)) of the newly pinned receipt. Independent report header: Reviewer, Author session `codex-session:1@2026-10-11`, Receipt commit `a1fd2136a16dce642cc202a10b585efcf040fd3b`, Review mode ordinary. Use the matching current IDs and copy a machine-verified own note; no seed/sensitivity proof for this ordinary check.

### Seven current legacy-source identities outside candidate-unverified

All **496** actual reverse-open candidate units are eligible under A28; there are zero ineligible reverse units. However, the seven newly live claims below are primary legacy source obligations, not reverse candidate units. The accepted 52 rows reviewed their old identities/gaps/retirements; they do not approve these new IDs. They are authored pending in `plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-main-merge-pending.json`, with two full-digest-equal moves and five proposed whole-unit supersedes. They are not newly granted holds or silently approved.

Complete shown source/target text, digests, ancestry and proposed rationale: `a31Followup.newPendingLegacySourcePairs`. Lead checks conservation, including the explicit replacement of the old routing/pack/coordination wording by the candidate contract, not implementation truth. Rework any binding that does not carry or supersede the whole claim; do not stamp a narrower target ok. Current source path for all seven: `docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md`.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_550a2c60d3f044caa3540341697a88a7 | pending | New live main identity; proposed supersede to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#decision; check the complete shown source/target and whole-claim conservation. | f36f565d7adbf19091e7de525bca211dd6f45f7fa10caf704f11c6f211c6c67a | cdb22d6a5f42ae3a58e87493b0d7828e1f364ce9b0ddc43835a91f94264e988b |
| claim_3996ecc3d148fff06ead0332614567d3 | pending | New live main identity; proposed supersede to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#baseline-ux-audit; check the complete shown source/target and whole-claim conservation. | 9d2872c42475ac943dd19feb5f488a3fbb862771f1b3f7af4e6279002cd576a9 | 4ca30eb078631d99f2559bb221ecd5f6ac3f302c67c4ec61232c20b0e1fe91d4 |
| claim_7cac83d6593ca533fed2df39bd60c46c | pending | New live main identity; proposed supersede to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#baseline-ux-audit; check the complete shown source/target and whole-claim conservation. | 3c495e4af0b84afab995afc2de9b6ada30c65f7557cb2e6f4934f0b5a034024a | 4ca30eb078631d99f2559bb221ecd5f6ac3f302c67c4ec61232c20b0e1fe91d4 |
| claim_0893be1de04c49bd33bdfc9a98df6d89 | pending | New live main identity; proposed move to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-7; check the complete shown source/target and whole-claim conservation. | 2f3aed1c2c86a1e39301d385bcc233d7b4d1f2a6f7d316b655356e3d6ba26b00 | 2f3aed1c2c86a1e39301d385bcc233d7b4d1f2a6f7d316b655356e3d6ba26b00 |
| claim_58560c392f9b61dd94d592f0cb4a75d8 | pending | New live main identity; proposed move to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#unheaded-block-8; check the complete shown source/target and whole-claim conservation. | b7c8760c894fef840cef9630c446a32f9ebcd8b838d6b82676968f2eb3d5a0e7 | b7c8760c894fef840cef9630c446a32f9ebcd8b838d6b82676968f2eb3d5a0e7 |
| claim_8f632c41e8a069dbfdfa1ea31994f14e | pending | New live main identity; proposed supersede to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#entry-point-choice; check the complete shown source/target and whole-claim conservation. | 3baa56c939fd599e8a11bed83f1905ea7ceb71f256dd85baefef70c0a29b3e29 | f9a3e8adf40d2ed782b6be16bcfe024b92a46769b35b36c03a3c5cfa984b0b96 |
| claim_cb0fc46cc04ed129b871f1c2a44fcb61 | pending | New live main identity; proposed supersede to docs/platform/agent-coordination/architecture/group-thinking-trigger-surface.md#b-add-fgos-advise; check the complete shown source/target and whole-claim conservation. | f460307c43635265a3b8a96c354440c606355d99b4d27a9da6d079a4bff00c1a | bb1ae7699ab58ef15b7ea30bf4d78b57cdd8eb69b9a4ef6a7713e83e50f9eb3c |

### Current proof and exact next step

Both prior-registry D commands pass with **zero fatal**. Scoped strict E contains only **10 not-reviewed IDs = three original Rings holds + these seven pending sources**, **342 exact exception groups**, and **496 reverse-open candidates**. Native comparison proves all 496 claim-ID/path/anchor/digest tuples equal the committed list (zero missing/additional), all 342 exception digests/source-ID memberships equal, and no change in any of the registry's 93,186 identity tuples. All 134 changed-code receipts and all 39 pending re-pins are listed; the original 683-row receipt artifact remains byte-identical. The twenty upstream-only identity successors do not choose a target area; Step 3 still owns that disposition. Old retired rows 216/226 stay unchanged, with new-digest rows added.

The exact four D/E argv/results are in `a31Followup.gates`; each uses one of `reports/identity-registry.json` and `reports/phase-02-identity-registry.json`, and E uses the frozen scopes plus `--strict`. The authored inventory is regenerated at Receipt commit from the existing registry; native generation confirms no additional carry-forward. Review/conservation tests: `env -u CLAUDE_CODE_SESSION_ID node --test` with seven explicit files in `a31Followup.tests.command`, **155/155 pass**, zero fail/cancel/skip/todo. Historical witnesses 74, payloads 867, five frozen files, ratchet 995 and authority/reader isolation pass; the previous 30 routing findings are unchanged.

**Closing condition is not yet met because the seven source rows lack independent approval.** After Lead commits this one combined report, apply accepted notes/pins only, recalculate the candidate list from native E (the 39 accepted receipts may then close), rerun both priors and full-set equality. Persist the working registry and begin Step 3 only when pending IDs equal exactly the three Rings holds. Working registry SHA256 `50cc0724da93de0a682f620b017f2599eb25d7c6fcf3701212aa451ef0a61f1f` is pinned in the sidecar and remains uncommitted until that condition. No new archive/delete list or promoted-doc edit; no extra stop before this consolidated review request.
