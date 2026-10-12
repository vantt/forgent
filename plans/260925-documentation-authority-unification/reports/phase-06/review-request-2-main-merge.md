# Independent check request: post-closure main merge

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
