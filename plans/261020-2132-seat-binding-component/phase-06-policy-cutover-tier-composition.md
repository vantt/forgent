# Phase 06: policy cutover — tier composition, `max-tier-cap`, G5 refusal, Work path, delete `rigorToTier` and the bare verb

Owner: Sonnet lead in a worktree from the track. Size XL (2.5d). After 03 and 05. The biggest phase; the big lead reviews the fixture diff by file group, not as one blob.

## Context

- Spec §2.1 D2, D10; §4.2, §4.4, §4.5 [G5]; §5.3 (bare-verb retirement); §8 step 7 (hash); §3.1 (tool executors untouched).
- Today: `resolveSeatTier` `bind.mjs:141-172`, `resolveTierCeiling` :124-136, `lookupCapabilityConfig` :73-89, `findMatchingOverride` :91, `acceptDependence` trust :385; Work path `assignment-policy.mjs:213,253,316`, `dispatch/cli.mjs:589`, `loop.mjs:1608-1609`; `snapshotRunnerConfig` `run.mjs:161-172`; `human-cli` synthesis `bin/fgos.mjs:2851,2862,2878,2889`, `src/workflow/unit-handoff.mjs:198`.
- Board collision files: `bin/fgos.mjs` (4.3-R P07, 6.2, COOK), `bind.mjs` (MP-A). Merge main into the track first.

## Requirements

- `bind.mjs` builds the stage-1 request (seat ask from the 02 resolver, persona qualified id from 03, config subset + digest, `raiseAuthorized`) and calls `bindSeat` (04) for policy. Tier, ceiling, effective rigor, `prefer` order and their sources come only from the crate. Stage 2 stays the existing Node ranking for this phase (07 moves it); its input tier/`prefer` are the crate's.
- Delete: `rigorToTier` everywhere (7 src files + 62 test files per phase 00), `DEFAULT_RIGOR_TO_TIER` (`config.mjs:203,241`), `validateRigorToTierShape` (:1529), `resolveTierCeiling`, `resolveSeatTier`, `lookupCapabilityConfig`, `hasUsablePrefer` bare-verb use, `TIER_STRENGTH`/`resolveStrongerTier` in `assignment-policy.mjs` (tier math lives in the crate). Config requires `seatBindingSchema: 1` and refuses `rigorToTier` with "run `fgos setup`".
- Bare-verb consumers (all, same phase): `bind.mjs:81`; `registrations.mjs:2654,2668` (`workflow-capabilities-configured`: exact key → `<prefix>:*`); `bin/fgos.mjs:2583` (description: exact → `<prefix>:*`); `src/report/capability-plan-lint.mjs:136,143,150` (`isCapabilityDeclared`: exact, alias, `<prefix>:*`).
- Work path: `resolveAssignmentDispatchPolicy` becomes a thin consumer that asks Seat Binding (one seat `producer`, posture from the assignment) and maps the answer; `loop.mjs:1609` dry-run plan and `dispatch/cli.mjs:589` read the crate's tier. `risk: heavy` adds checkers only (§4.2).
- G5 wave 1: doors stop synthesising `origin`; `fgos run --tier`/`--override` with a tier above the resolved tier → `tier-escalation-unauthorized` (crate refusal, door passes `raiseAuthorized: false`); an override with `acceptDependence: true` → refused at the door `dependence-acceptance-unauthorized` (plan decision 6); `--effort`, `--timeout`, `--account` keep working. Workflow handoff (`unit-handoff.mjs:174-204`) passes overrides without origin and `raiseAuthorized: false`.
- Visible source: binding record, run evidence and `explain` carry `tierSource`, the workflow recommendation when different, `loweredFrom` + `max-tier-cap` + the `maxTier` path.
- Hash: `snapshotRunnerConfig` covers `defaults`, `maxTier`, `tierFallback`, drops `rigorToTier`; `$comment` stripped.
- Tool executors: `kind: tool` candidates (`impact-analysis` → `gitnexus`, `pane-labeling` → `herdr`) keep today's Node path unchanged; test proves identical output before/after.
- Fixtures: convert every test config with `convertRunnerConfig` (05), never by hand; tests asserting rigor→tier rewritten to assert the declared tier.
- forgentX `.fgos/config.json`: run the conversion, then apply the D13 lines of spec §9.1/§9.4 (plan decision 5); commit on the phase branch. It reaches main only at landing.

## Files

- Modify: `src/runner/execution/{bind,run,explain}.mjs`, `src/runner/dispatch/{assignment-policy,cli,config,plan,recovery,resolve}.mjs` (as phase 00 shows), `src/runner/loop.mjs`, `bin/fgos.mjs`, `src/workflow/unit-handoff.mjs`, `src/report/capability-plan-lint.mjs`, `src/setup/registrations.mjs` (rows touching `rigorToTier`/bare verb: :508-518, :765-789, `workflow-capabilities-configured`), `.fgos/config.json`, test fixtures and helpers (`test/cli/helpers/fgos-cli-harness.mjs`, `test/helpers/workflow-fixture-repo.mjs`, `test/fixtures/confinement-migrated-executors.json`, …).
- Not touched: `src/workflow/case-admission-port.mjs`, `case-projection.mjs`, `core/skills/fgos-cook/**`, `packages/agent-protocol/**`, `packages/run-supervisor/**`.

## Steps

1. Merge main into the track; list collisions.
2. Wire stage 1 through the facade in `bind.mjs`; keep stage 2.
3. Delete the old tier path and every listed consumer; `rg` acceptance query (plan criterion 1, minus 07/08 symbols) returns nothing.
4. Work path thin consumer.
5. G5 at the doors.
6. Convert fixtures with the conversion function; convert forgentX config + D13 lines.
7. `npm test` green; report lists every behaviour change found in fixtures.

## Tests (proofs owned)

- Workflow recommendation beats `cap.tier`/`prefix.tier`, loses to seat, persona, role keys (`bind-committed-config.test.mjs` on the converted forgentX config: §9.2 tier column exactly).
- Above `maxTier` lowered with `max-tier-cap`, `loweredFrom` in explain, record and evidence; capability `maxTier` above global passes (§9.2 variant B; `explain.test.mjs`, run evidence test).
- Untrusted `human-cli` cannot raise tier or accept dependence (`test/cli/run-verb.test.mjs`, workflow handoff test).
- Tool-executor capability binds as before.
- `dispatch-policy-baseline-snapshot.test.mjs` diff reviewed line by line.

## Risks / rollback

- H×M fixture churn masks a regression → mechanical conversion + per-group review; behaviour changes listed in the report.
- M×M `bin/fgos.mjs` conflicts with COOK/6.2 → main merged first; resolve on the track.
- Rollback: revert the merge on the track (05's acceptance-only schema stays valid).
