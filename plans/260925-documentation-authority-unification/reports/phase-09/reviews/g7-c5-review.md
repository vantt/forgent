# G7 batch g7-c5 review (commit 8a9385eca)

## Counts

- Specs: 60
- APPROVE: 59
- REWORK: 1
- Mechanical checks: all 60 passed. The before hash matched, `patch --batch --fuzz=0 -p1` forward gave expectedAfterSha256, and rollback gave beforeSha256. Scratch: /tmp/fgos-work/g7-g7-c5/<n>/.
- Every added `docs/...` path exists at the review commit. All 30 added anchors resolve under the repo's generate-doc-inventory slug.

## REWORK

- `file:test/cli/fgos-merge.test.mjs`, hunk `@@ -922,8 +922,8 @@`, added line 2 (an empty `+` line). It adds an unrelated blank line inside the test body, which separates the comment from the assert it explains. Fix: drop that line and keep the single-line path rewrite.

## Approvals that rely on tracked parks or other batches

- `AGENTS.md`: the legacy `docs/specs/platform-foundations.md` and `docs/specs/<area>.md` references that remain are individually parked (matrix rows r00728-r00763). This spec does not drop them.
- `scripts/check-doc-candidate-status.mjs`: the comment becomes true only once the parked r26 reader patch to `scripts/check-doc-constitution.mjs:221/264` is composed.
- `.githooks/pre-commit`: its sibling consumers `src/runner/merge.mjs` and `test/runner/merge.test.mjs` are parked.
- `test/docs/decisions-corpus-retired.test.mjs`: the remaining `docs/specs/*` targets are parked. A replay of the retargeted runner and system-overview targets gave assertions equivalent to the legacy ones.
- `packages/distribution/rust/src/manifest.rs`: dropping the §5 citation follows the recorded L12-62 judgment (record reference-002293).
- `plans/reports/phase-lead-261018-...md`: the PF-I022/PF-I023 renumber is recorded in phase-08 `owner-answers.md:26`.

## Informational (not introduced by these specs)

- The anchors in `core/instructions/platform-laws.md` and `AGENTS.md` (D-ADR0030) use the repo extractor slug (` — ` becomes `-`). They do not match GitHub's raw slug (`--`). The legacy anchors did not match GitHub either.
- The `gateway.rs` citation `fgos-gateway-api-v1.yaml:54-59` for `servers.url` is already stale in both copies of the yaml (the block is at lines 57-59).
- In the `fgos-coding-implement` and `fgos-coding-planning` reference docs, successor paths are wrapped mid-name in the same way as the legacy text.
