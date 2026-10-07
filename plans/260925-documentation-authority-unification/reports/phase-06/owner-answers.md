# Phase 6 owner answers

Date: 2026-10-07        Recorded by: planner, from the owner's answers and Lead decisions relayed by the team lead
Phase 6 authorized: yes (owner, 2026-10-07)

Q1 evidence mirrors: a
Q2a tooling: A (T1 to T7)
Q2b script-proven rows may be `reviewed` by the script: yes
Q2c corpus scope: i
Q2x tools marked "x" in the Step 1 table: authorized (Lead-decided 2026-10-07: the extra tools only close red-team findings; same tests-first and no-extractor-change limits)
Q3 files without a target: a      archive-with-reason delegated to the executor: yes
Q4 dropped claims: a
Q5 root documents: a
N1 docs/decisions/index.md: keep as a generated projection (`regenerate-from-source`), not a retiring root (Lead-decided 2026-10-07)
N2 executor may author the next batch while one waits for review: no (Lead-decided 2026-10-07; one batch at a time)
Plan B rule: right before work on `docs/specs/distribution.md`, `docs/specs/system-overview.md` or `docs/platform/component-boundary.md`, re-check the source digests and redo the affected rows if Plan B landed in the meantime.
Review sessions: started by the owner; reviewer identity format: reviewer:<model>-session:<id>@<date>
Authored/reviewed separation (authoredBy gate check, review report per batch): decided 2026-10-07, yes

## Command amendments

A1 (2026-10-07, Lead-decided under the owner's standing rule; owner informed): checks D and E keep their scratch `--identity-registry` and add the existing `--previous-registry` flag, run twice per check: once with `--previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json` (the registry committed at HEAD) and once with `--previous-registry plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json` (the sealed first generation). Both runs must pass for the check to pass, so both conservation obligations stay in force. Invocation-only: `loadPreviousRegistries` and the meaning of a missing conservation input are not changed, and the alternative loader fix is not authorized. Evidence: `reports/phase-06/strict-registry-blocker.md`.

A2 (2026-10-07, Lead-decided; owner informed): review procedure amendment, the gate invariant stays unchanged. For verdict `hold` or `rework`, a row whose disposition is `unknown-blocking` keeps `reviewStatus: blocking`; a row with any other disposition keeps `reviewStatus: pending`. In both cases the review note is recorded without `reviewedBy`/`reviewedAt`, and a held `unknown-blocking` row is listed in the owner queue. Implement in `applyReviewVerdicts` with a failing-before/passing-after regression for hold and rework on an `unknown-blocking` row, and prove the output passes the unchanged `decision-blocking-status-mismatch` checks. Evidence: `reports/phase-06/hold-status-blocker.md`.

A3 (2026-10-07, Lead-decided; the Lead caused this by committing outside the Phase 6 allowlist): check A accounts exactly the five commit/path pairs of commit `1cc92d7db` (`reports/phase-07-08-prep/consumer-survey.md`, `consumer-survey.json`, `open-questions.md`, `phase-07-draft.md`, `phase-08-draft.md`, all under `plans/260925-documentation-authority-unification/`). These are Lead-owned prep artifacts for later phases, not Phase 6 outputs. Any other commit, including a later edit of those same files, stays under the original allowlist; the directory is not opened. The Lead commits nothing else outside the Phase 6 allowlist until Phase 6 closes, except this file. Evidence: `reports/phase-06/resume-isolation-blocker.md`.

A4 (2026-10-07, Lead-decided; owner informed): decisions on the tooling review's open Medium findings (`reports/phase-06/review-tooling.md`). Thresholds stay as written (5 of 6 detected, at most 2 false flags in 24).
- M1: not declaration-only. After the verdict the reviewer commits the released key; the gate recomputes the pack id and the sensitivity score from the committed key and rejects a mismatch.
- M2: mutations are drawn from judgment rows (rows not proven byte-equal by script); controls include judgment rows. A pack drawn only from byte-equal rows is invalid.
- M3: a batch with fewer than 30 eligible rows tops the pack up to 30 with controls taken from rows already reviewed in earlier batches (each with its committed review proof). Mutations still come from the current batch's judgment rows; with fewer than 6 judgment rows every judgment row is mutated and all must be detected.
- M4 and M5: fix in tooling as the review requires (conflict receipts bind the group's current member set; corpus rules carry a per-rule committed report pin like manual rows).
- H1 and H2 are required fixes, not decisions: the authorship and committed-report checks are mandatory for every non-legacy shard, and reviewer identity normalization strips repeated prefixes, folds case and removes invisible characters.

A5 (2026-10-07, owner-decided; supersedes A4 and narrows the review procedure). Threat model: the real risk is an honest agent dropping or weakening content, not a reviewer trying to forge approval. The migration tooling is single-use. Therefore:
1. Tooling is frozen as it is at `1ec3ceca6` plus ONE required fix: H1 from `reports/phase-06/review-tooling.md` (the authorship and committed-review-report checks become mandatory for every non-legacy shard; no opt-in flag). Tests first, no other tooling work.
2. H2 and the Medium items M1 to M5 of that review are not fixed. A4 is withdrawn. Low items are not fixed.
3. Per-batch review is: the reviewer session reads every judgment row of the batch, spot-checks 100 random script-proven exact rows, runs the gates, and commits `review-<step>-<shard>.md` with its verdict. No seeded-mutation pack per batch. Seeded-mutation packs (existing thresholds) and a reviewer red-team pass run only at two checkpoints, after Step 3 and after Step 6, plus the closing review in Step 10. Any phase-file text requiring a pack or a red-team pass in every batch is superseded by this amendment.
4. After the H1 fix, its test evidence and a short note in `reports/phase-06/tooling.md`, the executor proceeds to Step 1 item 2 (review brief, written to this simpler procedure) and on to the content batches without a further tooling re-review.
