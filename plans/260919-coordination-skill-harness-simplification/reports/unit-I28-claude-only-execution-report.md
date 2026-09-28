# Unit I28 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I28`,
worktree `.claude/worktrees/coordination-skill-harness-i28-code-change-facade`,
base `main@efda3dce8`, integrated `main@5eea48c3b`.

Phase 6 creation half: builds `domains/coding/skills/fgos-code-change/SKILL.md`
+ `references/plan-mode.md`, extending the shared coding-cell-policy fragment
(Test-Selection Block, `FULL_TRIGGERS`, proof-key-with-fingerprint,
reviewer-inspect-by-default, post-merge verification). Merges
`fgos-plan-loop`'s and `fgos-code-panel`'s open/fix/close/worktree lifecycles
into one implementation covering both single-cell and plan mode. Old
`fgos-plan-loop`/`fgos-code-panel` remain untouched, pending Unit I29's stub
conversion (hard dependency, not yet dispatched).

## Implementer (sonnet, fullstack-developer)

Built the facade at the correct `domains/coding/skills/` placement (not
`core/`), reusing `fgos-code-panel`'s M1/A1/A2/CE1-5 mode-selection logic
collapsed into one rule, preserving the R2 recursive-dispatch guard, wiring
`open inputs` to the real `fgos plan-lint`/`fgos capability match` doors
(live-probed). Measured the real combined word count first
(1347 plan-loop + 1192 driver + 1058 policy = 3597) and set
`COMBINED_LEAD_LOAD_CEILING` to that exact value with a documented rationale,
per the locked "measure first, decide after" precedent from the
architecture-panel word-budget decision. Full suite at candidate: 7654 pass,
103 fail (all `test/rust-host/*`, confirmed pre-existing — no compiled Rust
binaries in this worktree).

## Independent test + review (round 1, opus, parallel)

Both agents independently confirmed the claimed pass counts, word sum, and
untouched old skills, then found real gaps beyond the implementer's own
tests:

- **HIGH (test-i28):** Step 0's single-cell gate branched on `form` alone,
  never on the resolved `capability` — live probes showed advisory
  (`code:review`, `advise`) and non-mutating demands also return
  `form: "protocol"`, so the gate as written would open a mutating cell for
  an advisory-only request, swallowing `coding-design-panel` through the
  back door. The plan's own required negative fixture (advisory-only request
  never captured into a cell) was also missing.
- **HIGH (review-i28):** the plan-mode `fgos plan-lint <phase file> --cell
  <id>` gate is vacuous as documented — a phase file with no matching unit
  block returns only a `severity: warn` `capability.undeclared` finding, so
  `ok: true` always in that path (confirmed via
  `src/report/capability-plan-lint.mjs`'s `ok = !findings.some(hard)` and
  live runs on a real phase file). `bin/fgos.mjs`'s own help text confirms
  `plan-lint`'s `<path>` is meant to be `plan.md`, not a phase file.
- **MEDIUM (both):** `coding-cell-policy.md`'s Non-Inference Rule still had
  an unconditional sentence contradicting its own conditional escalation
  rule right below it, despite the CHANGELOG claiming this was resolved;
  Step 4's close snippet skipped the mandatory post-merge record commit +
  `HEAD` re-assert; the R2 guard had no precedence over a `form: "facade"`
  re-route (an active R2 context told to re-route would open exactly the
  nested track R2 forbids); SKILL.md's Mode Selection prose disagreed with
  the tested classifier (verb set, bare-path handling, partial-negation
  handling); the `code-change--<slug>` prefix didn't actually avoid
  `chain.mjs`'s track-grouping match, and the two-request DAG's
  `<coordinationId>-inspections` auxiliary session name risked being
  misclassified as an extra cell of a real track.
- **LOW:** a broken relative link in the `.agents/` mirror (4 levels up from
  `.agents/skills/x` exits the repo); a few cosmetic/premature-wording items
  accepted as known and deferred to I29 or a later pass.

Lead independently confirmed the two most consequential findings directly
before dispositioning: read `src/report/capability-plan-lint.mjs`'s `ok`
computation and reran the phase-file probe myself (confirms H1/M1 plan-lint
gap); read `coding-cell-policy.md`'s §5 text directly (confirms the
contradiction was real, not fixed as claimed); ran a live `capability match`
probe for an advisory demand and confirmed it returns `form: "protocol"`
(confirms the missing-allowlist HIGH). Recorded the full disposition in
plan.md before dispatching the fix round: accepted the 13-fixture parity
subset and the word-budget ceiling staying on `fgos-plan-loop` for now as
deliberate, evidence-backed decisions (not fix-round scope), and folded the
word-budget retarget into Unit I29's own required scope.

## Fix round 1 (4006782dd)

All 7 must-fix items addressed. Lead independently re-verified each with a
live probe or direct code read (not taken on the fixer's report alone):
capability allowlist now gates Step 0 (confirmed live: a `code:review`
demand with `form: "protocol"` is correctly refused by the new prose);
plan-lint now targets `plan.md` and blocks on `capability.undeclared`
(confirmed live on both a phase file and `plan.md`); the §5 contradiction is
resolved to one rule (confirmed by direct read); Step 4's snippet no longer
silently truncates the required post-merge sequence; R2 takes precedence
over the facade re-route (confirmed in the same paragraph as the capability
gate); Mode Selection prose and the tested classifier now agree (added
"implement" to the verb set, documented the bare-path exception, partial
negation now asks); the DAG auxiliary session id was renamed to
`inspect--<coordinationId>` with a regression test against the real
`chain.mjs` grouping behavior. 150/150 targeted tests pass
(skill-wrappers 123→129, driver-discipline 11→11, dag-driver-skill-contract
7→10).

## Lead final verification and merge

Reran the full suite myself on the fixed worktree: 7968 tests, 7844 pass, 51
fail — all 51 confirmed to be the same pre-existing `test/rust-host/*`
binary-missing gap (fgctl-init/stage/upgrade, release-tree; no
`target/release/` compiled in this worktree, confirmed present in the main
checkout). No new regressions from the fix round.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I28` from the main
checkout onto post-I28-decisions main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 5eea48c3bc83c8a6af46c29bd07b7763a7e74d12`. Reran
the 3 key suites on the merged tree: 150/150 pass.

## Process notes

- This unit needed exactly one fix round (of a 3-round cap) despite a real
  security-analogous HIGH finding (missing capability allowlist) — the
  parallel independent test+review dispatch caught it before merge, and
  both agents converged on the same core defects independently.
- Lead's direct verification (reading the plan-lint source, the policy
  fragment text, and running live CLI probes) confirmed every reviewer
  claim before acting on it, catching that the CHANGELOG's "contradiction
  resolved" claim was inaccurate — a self-report that would have been wrong
  if trusted at face value.
- Word-budget retarget (measure `fgos-code-change`'s own load instead of
  the outgoing `fgos-plan-loop`) was deliberately deferred to Unit I29,
  whose job is converting `fgos-plan-loop` into a stub — recorded in I29's
  own plan.md scope so it isn't silently dropped.

## Unresolved / follow-up

- Unit I29 (stub conversion) is now unblocked — hard dependency on I28 is
  satisfied.
- Unit I29 must also retarget the `COMBINED_LEAD_LOAD_CEILING` word-budget
  test to measure `fgos-code-change`'s own real word count once
  `fgos-plan-loop` is stubbed (already added to I29's plan.md scope).
