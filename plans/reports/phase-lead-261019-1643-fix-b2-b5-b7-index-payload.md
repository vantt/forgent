# B2, B5 and B7 landing fixes

Verified the triage causes against the generator, doctor, payload walker and lock fixture. Prior history includes `f8d940348` (the hook exception) and the decision-index generation/repair history; this extends those existing doors rather than adding another mechanism. Impact-analysis: inactive (zero registered providers).

- B2: the shared renderer unions committed rows with state, with state winning. Generator and doctor already share `computeDecisionIndex`; both now consume the union. Header and packaging spec document explicit removal from both sources. Regression coverage checks committed-only rows, additions, replacement, escaped pipes, idempotence and doctor behavior with absent local state.
- Necessary adjustment to triage: identity is **scope + ADR ID**, otherwise scope + timestamp. The real index contains two different D-ADR0032 decisions (runner Iron Law and work-state Team Harness); ID alone would delete one. A regression preserves both. All committed rows remain; only the index header changes.
- B5: the payload-registry test explicitly places its machine-wide install fence through production `placeFences` in a separate fixture workspace before activation. Its existing exact missing-fence/count assertions remain intact. No test bypasses or production changes.
- B7: the shared payload selector intersects the safe filesystem walk with Git's tracked/non-ignored untracked files, retaining filesystem selection for tarballs. Removed the hook-name exception from both doctor comparison sides. Tests cover ignored hooks and rendered skills, untracked source, tarballs and doctor agreement. Existing safety and dependency exclusions remain. A release that previously included ignored output changes digest once.

Validation:

- `node --test test/report/decision-index.test.mjs test/setup/checks*.test.mjs test/distribution/*.test.mjs test/setup/active-release-drift-check.test.mjs` — **272 passed, zero failures**.
- `node --test test/setup/holder-lock-checks.test.mjs`: 13 passed, 4 failed. Three fence tests hit the production refusal to scan host processes from this PID namespace. The monitor-holder test has the already-triaged foreign-holder classification failure. Isolated `--test-name-pattern='payload registry'` reaches the same namespace refusal; the explicit fence precondition succeeds. Coordinator must rerun these on the host.
- Extra `test/rust-host/release-tree.test.mjs` run: three release staging tests cannot run because this checkout has no release-profile native addon (`target/release/libfgos_node_addon.so`). The distribution tests successfully build/use their real addon through the existing helper. No target-directory hardcoding was added.
- `git diff --check` passes. No full host gate or release activation claimed. No git staging/commit performed.

CHANGELOG and the canonical packaging spec record the visible fixes. No out-of-scope edits or new config/default/dependency. The shared program board was read and left untouched because it is outside the authorized write scope. Markdown preview was attempted with `mdview open`; its database is read-only in this sandbox.

Status: DONE_WITH_CONCERNS
Summary: Fixed decision-index preservation, independent lock-test setup and reproducible payload selection, with real regressions. Host-only lock and release checks remain for the coordinator.
Concerns/Blockers: PID-namespace lock-scan restriction, known monitor-holder failure and missing release-profile native addon as detailed above.
Context refs:
- plans/reports/debug-261019-1631-landing-bugs-triage.md (B2, B5, B7)
