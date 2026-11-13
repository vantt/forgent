# Lead report: account health B, unit summary v3

Branch `harden/acct-b-p06` (base `origin/harden/acct-b-plan` 8b344810f). Not landed; main is frozen until rc.7.

## Commits
- `2fb7fc837` test: red tests (Node record/summary facts, Rust v2/v3 reader) plus census regeneration forced by the pre-commit hook
- feat(unit-summary): `finishUnit` computes the facts first, `settleUnitRun` stores `{outcome, infrastructure, infrastructureReason, refused, settledAt}`, summary v3 copies them, Rust reader takes 2 and 3
- docs(unit-summary): contract file renamed to `unit-summary.read.v3.json`; contract, observe spec, runner architecture, reading map

## Gate results
- Focused Node (unit-summary, run-case-admission, run-sync, legacy-seat-read, run-verify-pin, propose-classify, run-brief-not-delivered): 139 pass, 0 fail. `/dev/shm/p06-node1.log`
- architecture, doc-health, decision-citation-drift, run-summary-resume, run-gate, run-roles, unit-run-record, case-close, workflow-runner-cli, assignment-enumerator-guard: 177 pass, 0 fail. `/dev/shm/p06-node2.log`
- `cargo test -p fgos-run-result -p fgos-observe`: all ok. `/dev/shm/p06-rust-green.log` (red run: `/dev/shm/p06-rust-red.log`)
- `cargo fmt --all --check` clean; `cargo clippy -p fgos-run-result --all-targets -D warnings` clean; `cargo check -p fgos-run-result` on x86_64-pc-windows-msvc and aarch64-apple-darwin clean.
- `git-one-door-scan --root .`: 0 undeclared sites, rust-test class count unchanged (156).
- Full `npm test` (no COOK HOLD on the board): 8830 pass, 0 fail, 31 skipped, rc 0, no run-tests ERROR lines. `/dev/shm/p06-npm-test.log`
- `fgos metrics discussions` on the main checkout (59 unit dirs) through the dev host: no `unsupported-version`; the only skip is 6 `invalid-contract`, not touched by this change (old summaries). `/dev/shm/p06-metrics.log`
- `git diff --stat origin/harden/acct-b-plan...HEAD`: 14 files, +153 -39, no unexpected deletion (one rename).

## Net size
About +45 Node source/test, +45 Rust (reader +30, test +36 minus edits), contract file renamed +26 lines, docs +9 lines.

## Tests retired
None.

## Owning proofs (as the phase named)
- Reader accepts v2 and v3, rejects a malformed v3 and v4: extended `reader_reports_root_wide_missing_and_unusable_summaries_without_reconstruction`.
- Summary copies the facts / old record reads not known: extended `complete summary uses owner workflow/outcome` and `failed seat maps classification`.
- `finishUnit` writes the facts: scope-check-failed in `run-case-admission.test.mjs` (write check that cannot run), refused seat listed in the consent-stale test there, `commit-failed:conflict-markers` in `run-sync.test.mjs`, `not-started` in `run-brief-not-delivered.test.mjs`. The `commit-failed:git-error` spelling in the plan could not be driven by an existing fixture, so the conflict-markers failure stands for the commit-failed branch. `run-error` (throw path) has no driving fixture; it is the one literal in the catch block.

## CHANGELOG line to add at landing
- "`unit-summary.json` is now version 3 and says whether a unit failed on infrastructure, why, and which seats were refused; version 2 files are still read."

## Authority and deviations
- `mutation-census.v1.json` is changed in my commits: every Rust file of the declared product is digested, so the pre-commit hook refuses any Rust edit without a regenerated census. The landing must regenerate it (`--write-census`) on the rebased tree and discard my version, never merge it by hand.
- Test fixture string is `commit-failed:hook-refused` in the Rust test: a literal containing "git" there would not matter to the digest, but kept neutral anyway.
- `finishUnit` now settles after it builds the attempts (the settlement needs `infrastructure`, which needs them); nothing read between the old and new position depends on the settlement.
- Documentation: also added a 2026-11-13 decided line to the contract section 11.

## Lessons
- Any Rust edit in the declared product forces a census regeneration at commit time; a lead brief that says "do not touch the census" needs the exception stated, or the lead must expect one conflict at landing.
- Moving `settleUnitRun` after fact computation was safe because settle only writes `settlement` and `execution`; checking what runs between the old and new site first avoided a reordering bug.
- A reader that adds a version should keep one version list constant and gate required fields on the version, so old files stay readable and the contract text names both.
