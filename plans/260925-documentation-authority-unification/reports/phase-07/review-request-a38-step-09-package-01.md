# Withdrawn ordinary changed-row review draft

**STOP / N1: do not dispatch or accept.** The frozen holder-lock header still waits for an Event Store decision already signed; see `step-09-package-blocker.json`. Native inventory/global checks and suite are incomplete. New candidate-list authority filtering is also incomplete. The parts below preserve completed binding work for author re-entry; they are not an acceptance request.

Author session: codex-session:fgos-run_unit-run-179224f23e2a8f@2026-10-17
Content commit: `8b2ee4dd99fc89689f20274f1cfd5e1ad7a3469a`
Review mode: ordinary

This is ONE logical request, `step-09-package-01`: **7,218 entries in 180 parts**, each at most 60 entries and 400 KB. The exact index, byte sizes, digests and unique reviewer report paths are in [the index](review-input-step-09-package-01/index.json). No verdict, approval, checkpoint sensitivity pack or reviewer seed is supplied by the producer. The Lead must not dispatch this withdrawn draft; author re-entry and rebuilding affected inputs come first.

Read the Phase 7 Step 9 contract, owner answers A36/A38/A42 and L11-1/2/11/15/18/19, the author-freeze section of progress.md, `step-09-package-rebind-summary.json`, the index and the assigned parts. Check the full 2,137-record queue: 1,237 current units, 869 displaced B0 units and all 31 real routing bindings. Additional entries cover authored decision/context changes, every native unit transition and document/registry metadata change, candidate-list replacements, 15 A34 joins, seven affected identical-owner groups, three historical-retirement decisions and three N2 claims. The current registry persists at `reports/phase-06/working-identity-registry.json`, exactly the established Phase 6 L10-42 file. Pending is not approval. The immutable B0/native predecessor evidence stays intact.

Materialize `row-auth.mjs` from [the reproduction receipt](step-09-package-reproduction.json) under a fresh `/tmp/fgos-work/<OUT>/`, then run:

```sh
env -u CLAUDE_CODE_SESSION_ID node --max-old-space-size=768 <OUT>/row-auth.mjs plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-package-01/index.json all
```

To check one part or row, substitute its path and optionally replace `all` with the entry id. This checks every shown tuple, real digest and no-approval condition with bounded production extraction and native records; it runs no global job. Mechanical authentication is not a semantic verdict. All commands are portable across checkout roots; only `<OUT>` is reviewer-selected scratch.

Each homogeneous set has its own A36 plan in the index. Mechanically check every row. The independent reviewer holds a fresh seed and deep-reads at least 15%, minimum 10 (all if fewer), **plus every recorded mismatch/high-risk entry and every parked row**. More than 3% substantive rework expands the entire affected set to full read. Context resolutions, partial carries, source-target digest mismatches, native content changes/retirements, routing obligations, A34/identical joins and N2 are mandatory reads. No author-selected sample substitutes for this.

N2 requires independent confirmation that the platform-foundations, holder-lock and component-boundary edits change no sealed answer, reader route or cited anchor. Candidate file pins in the sealed key are stale; the semantic key was not refreshed or resealed. If an answer/route/anchor changes, stop acceptance and return to Step 7. If any candidate-content defect is found, N1 returns to author item 1; reviewers and this package never repair frozen candidate bytes.

Return each part to its distinct report path in the index, with real `Author session`, `Reviewer`, `Review mode: ordinary` and package-commit headers. Give every entry its own source→target, verdict and concrete notes. Manual decision verdicts must show the full source and target unit digests (or `none`) in the unchanged gate's ordinary table format. Report ledger/report-only rework separately. Do not flip review statuses; a later Lead turn applies only exact matching committed verdicts.

`PARK-PROTECTED-01` remains formally parked: raw reading-map equality to main is false although all inherited branch passages are in B0 and first-parent non-merge protected authoring is empty. `S6-RATCHET-03` requires a genuinely green unchanged checker; it is never an expected strict-E carry. Consult the package provenance/global receipts for actual results. The skill on disk and branch is `fgos-coding-knowledge`; main still says `fgos-coding-compounding`. This request makes no Phase 7 close, promotion, cutover, alias, deletion or main-landing claim. Red-team/checkpoint is separate Lead work after this ordinary review.
