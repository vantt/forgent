# Phase 7 (S7) — Shadow Binder Retirement: Execution Report

## Executed Phase

- Phase: Phase 7 — C1 + C3: retire or authorize the shadow binders
- Plan: `plans/260928-2327-dispatch-engine-liveness-hardening/plan.md`
- Branch: `unit/P7`, commit `df527cb5d`
- Status: completed

## Real investigation performed (not assumed)

Grepped ~800 real historical production dispatch `stderr.log` files under
`.fgos/assignments/*/runs/*/stderr.log` (Aug-Sept 2026) for the exact
divergence-warning text each of the four `resolveVerified*` shadow binders
prints on disagreement. Cross-checked every hit against test-fixture literal
strings (`test/runner/dispatch.test.mjs`, `test/runner/provider-adapter.test.mjs`)
to separate real production divergence from incidental `npm test` stdout
captured inside an agent's own dispatch run log. Empirically re-ran
`resolveVerifiedProviderArgs` in Node against every currently-registered
claude-family executor invocation in the live `.fgos/config.json` to confirm
today's real divergence rate directly, not just via historical logs.

Findings:

- **`resolveVerifiedRedirectExecutor`** (assignment-runner.mjs redirect
  selection): 0 real divergence ever. Structurally impossible — both its
  "legacy" and "PlacementPolicy" sides call the identical `stablePoolIndex`
  over an identically-filtered pool.
- **`resolveVerifiedAssignmentModel`** (assignment-policy.mjs /
  assignment-runner.mjs model resolution): 0 real divergence ever.
  Structurally impossible — both sides call the identical
  `resolvePolicyTierModel(cfg, lookupPolicyTier, provider)` with identical,
  already-shared inputs (its own doc comment already admitted this).
- **`resolveVerifiedPlacementModel`** (cli.mjs model resolution): 120 raw
  stderr hits, all traced to 3 literal `test/runner/dispatch.test.mjs`
  fixture strings (`should-never-win`, `agy-override-model`,
  `agy-heavy-model`) — 0 real production divergence.
- **`resolveVerifiedProviderArgs`** (transport.mjs argv rendering): 676 raw
  hits; 126 confirmed real (matched against this repo's own real skill
  prompt text), all dated exactly 2026-09-18, from one track
  (cold-resumable-dag). Root cause: the registered executors' args
  templates were missing a `{model}` placeholder at that time — since fixed
  (confirmed via `git log` on `.fgos/config.json`, and directly re-verified:
  0/5 real registered claude-family invocations diverge today).

Consulted `kongming` with this evidence before implementing — it corrected
two things: (1) `assignment-runner.mjs`'s `policyForActualExecutor` is NOT
structurally identical to `resolveVerifiedAssignmentModel`'s other call
site (it has a same-provider-redirect ternary that must be preserved, not
replaced with a bare `resolvePolicyTierModel` call); (2) proposed a
"wait N weeks for telemetry" retirement plan is uncollectable/unbounded —
the real gate is a finite, enumerated list of divergence classes with a
decided winner and a required matrix test each.

## Decision

- **Retired outright** (deleted the shadow-verify wrapper and legacy
  fallback computation entirely): `resolveVerifiedRedirectExecutor`,
  `resolveVerifiedAssignmentModel`.
- **Kept in shadow mode** (real, if now near-zero, historical divergence;
  the audit's own risk map flags removing this safety net before
  divergence is proven zero as high-risk): `resolveVerifiedPlacementModel`,
  `resolveVerifiedProviderArgs`. Added durable local telemetry
  (`recordShadowBinderDivergence`, `.fgos/dispatch/shadow-binder-divergence.jsonl`)
  plus a new `shadow-binder-divergence` doctor check, replacing the
  previous ephemeral-stderr-only visibility. Dated retirement plan with 5
  enumerated divergence classes (each needing a decided winner + matrix
  test) recorded in `docs/backlog.md` (`tsk-p7-shadow-binders`), with a
  matching `open`-verdict entry in
  `docs/history/backlog-execution-reconciliation/RECONCILIATION.md` (the
  repo's own live reconciliation gate for `proposed` backlog rows).

## C3 (three-resolver consolidation)

`executeExecutorCli` used to call the entire `resolveAssignmentDispatchPolicy`
resolver only to reach its two governance throws (`disallowedProviders`/
`disallowedExecutors`), discarding its whole computed policy object
(tier/quality/persona/reasoningEffort/constraints/provenance). Extracted
`resolveExecutorProvider` (registry validation + provider derivation,
Phase 00 R6/RT1/F1 logic, pure move — same checks, same order, same
throws) and `resolveExecutorGovernance` (the two governance throws) as
standalone exports of `assignment-policy.mjs`. `resolveAssignmentDispatchPolicy`
now calls both internally too (dedup, not just extraction for one caller);
`executeExecutorCli` calls them directly instead of the full resolver.
Governance-throw ORDERING relative to other validation throws
(mode/minRigor/repeatMode) is preserved exactly — `resolveExecutorProvider`
stays in its original early position (step 3b/4), `resolveExecutorGovernance`
stays in its original late position (step 7), not collapsed into one early
call.

`cfg.models` dual-keying (C3 item 3): confirmed dormant for this repo's own
config (`.fgos/config.json` declares `modelPolicies`, so both readers
agree), but live for a consuming project without one. Recorded as
enumerated class (d) in the same backlog row rather than fixed directly —
fixing it changes real model-resolution behavior for external configs, out
of this phase's evidenced scope.

## Files Modified

- `src/runner/dispatch/placement-policy.mjs` — deleted `resolveVerifiedRedirectExecutor`/
  `resolveVerifiedAssignmentModel`; added `recordShadowBinderDivergence`.
- `src/runner/dispatch/assignment-policy.mjs` — added `resolveExecutorProvider`/
  `resolveExecutorGovernance`; retired the internal `resolveVerifiedAssignmentModel`
  call (unconditional PlacementPolicy attribution).
- `src/runner/dispatch/assignment-runner.mjs` — redirect selection calls
  `selectPlacementPolicyRedirectExecutor` directly; `policyForActualExecutor`
  calls `resolvePolicyTierModel` directly (ternary preserved).
- `src/runner/dispatch/cli.mjs` — `executeExecutorCli` calls
  `resolveExecutorProvider`/`resolveExecutorGovernance` instead of the full
  `resolveAssignmentDispatchPolicy`; both `resolveVerifiedPlacementModel`
  call sites now also record durable divergence telemetry.
- `src/runner/dispatch/transport.mjs` — `resolveVerifiedProviderArgs` call
  site records durable divergence telemetry.
- `src/setup/registrations.mjs` — new `shadow-binder-divergence` doctor
  check.
- `docs/backlog.md`, `docs/history/backlog-execution-reconciliation/RECONCILIATION.md`,
  `docs/specs/distribution.md` — dated retirement plan row + doctor-check
  registry doc update (repo's own install/setup/doctor gate).
- Test files updated to match: `test/runner/placement-policy.test.mjs`,
  `test/runner/placement-policy-redirect-selection.test.mjs`,
  `test/runner/provider-adapter.test.mjs` (comment accuracy only),
  `test/runner/assignment-policy.test.mjs` (comment accuracy only),
  `test/setup/checks.test.mjs` (doctor-check snapshot).

Net diff: 14 files, 321 insertions / 378 deletions (a real simplification).

## Tasks Completed

- [x] Investigated real divergence telemetry (none existed durably before
      this phase; only ephemeral stderr) and real historical divergence via
      log archaeology.
- [x] Decided retire-vs-keep per binder with real evidence, not a coin flip.
- [x] Consulted kongming before implementing (corrected 2 real mistakes in
      my initial plan).
- [x] Resolved C3 in the same pass (shares the same root file/investigation).
- [x] Fixed or explicitly, evidently deferred the `cfg.models` dual-keying
      bug (deferred, folded into the same dated backlog row as class d).
- [x] Full suite green.

## Tests Status

- Type check: n/a (plain JS/ESM repo)
- Targeted: `placement-policy*.test.mjs`, `provider-adapter.test.mjs`,
  `assignment-policy.test.mjs`, `dispatch-cross-provider-redirect.test.mjs`,
  `dispatch.test.mjs`, `checks.test.mjs`, `registrations.test.mjs` — all
  green.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): 7993 tests, **0
  fail**, run twice back-to-back green. A third consecutive run (heavy
  sustained load from 3 back-to-back full-suite runs) hit 1 failure —
  `fanoutBatchExecutorCli ... (R1)` at `test/runner/dispatch-production-call-sites.test.mjs:651`,
  signature `1 !== 0` on a subprocess exit-code assertion. Confirmed NOT a
  regression: my diff never touches `fanout-batch.mjs` or any git-locking
  code (`git diff --stat` against the two files confirms zero overlap);
  re-ran the specific test 4/4 times in isolation — all pass; ran the
  entire test file in isolation — 20/20 pass. Same failure signature and
  root-cause class this track's own Phase 3 "Interaction finding" already
  documented and dispositioned as a pre-existing test-fixture flaw (two
  concurrent candidates sharing one temp git repo racing on its lock file
  under heavy system load), not a phase regression.

## Issues Encountered

- Two doc-registry snapshot tests (`test/setup/checks.test.mjs`'s
  `DOCTOR_CHECKS has exactly...` and `test/setup/registrations.test.mjs`'s
  `Data Dictionary #7 names exactly...`) needed updating for the new
  doctor check — both fixed.
- `docs/backlog.md` carries a stale "generated by `bee`" banner from an
  apparently unrelated predecessor tool; `.bee/` does not exist in this
  repo (confirmed) and the file is genuinely hand-edited today, gated by a
  real, live `scripts/check-backlog-reconciliation.mjs` check (not wired
  into `npm test` directly, but into `fgos preflight` per
  `test/cli/fgos-preflight.test.mjs`). Added the matching `open`-verdict
  reconciliation entry so the new row doesn't silently violate that gate.
- One authoring bug caught and fixed before commit: a doc comment
  containing a glob-style path with a literal `*/` inside a `/* */` block
  comment closed the comment early, causing a `ReferenceError` on module
  load — caught by running the targeted test immediately after the edit,
  not left for a later full-suite run to surface.
- The background-task completion notification for `npm test` runs fired
  prematurely (claimed "completed, exit 0" while the log file was still
  actively growing, twice) — worked around by polling the log file for the
  real TAP summary line instead of trusting the notification. Not filed as
  a work item (out of this phase's scope), but worth a follow-up if this
  recurs.

## Next Steps

- Lead's own independent re-verification against real source and command
  output, per this track's established discipline.
- `docs/backlog.md`'s `tsk-p7-shadow-binders` row is the actionable
  follow-up: 5 enumerated divergence classes, each needing a decided
  winner + matrix test before `resolveVerifiedPlacementModel`/
  `resolveVerifiedProviderArgs` can retire the same way their two siblings
  already did in this phase.
- This was the last code phase (Phase 8 is decision gates only, per
  plan.md). Track close-out is Lead's call.

## Unresolved Questions

None blocking. The `cfg.models` dual-keying fix (class d) and the two kept
shadow binders' eventual retirement are deliberately deferred to the dated
backlog row, not silently dropped.
