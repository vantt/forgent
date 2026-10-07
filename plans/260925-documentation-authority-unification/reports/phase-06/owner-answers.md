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
