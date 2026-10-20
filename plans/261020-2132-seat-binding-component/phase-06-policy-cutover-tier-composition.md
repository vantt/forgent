# Phase 06: policy cutover — tier composition, `max-tier-cap`, raise refusals, global sanitizer, Work path, delete `rigorToTier`, JS model choice and the bare verb

Owner: Sonnet lead in a worktree from the track. Size XL (3d; grew with [RT-1], [RT-2], [RT-11], [RT-12], [RT-16a/c/d/f]). After 03 and 05. The big lead reviews the fixture diff by file group.

## Context

- Spec `docs/specs/seat-binding.md` D2, D10 (§15); §5.2, §5.4, §5.5; §6.3 (bare-verb retirement); §9 step 7 (hash); §3 (tool executors untouched) [RT-16b].
- Today: `resolveSeatTier` `bind.mjs:141-172`, `resolveTierCeiling` :124-136 (also imported by `model-pool-checks.mjs:12,205`), `lookupCapabilityConfig` :73-89, `acceptDependence` :385; Work path `assignment-policy.mjs:213,253,316`, `dispatch/cli.mjs:589`, `loop.mjs:1608-1614`, `plan.mjs:118,174,427`; `snapshotRunnerConfig` `run.mjs:161-172`; `human-cli` synthesis `bin/fgos.mjs:2851,2862,2878,2889`, `unit-handoff.mjs:198`; global merge `config.mjs:359` (`sanitizeGlobal` hook :300); fill-missing `config.mjs:395-405`, setup `registrations.mjs:273-283`.
- Board collision files: `bin/fgos.mjs`, `bind.mjs`, `registrations.mjs`. Merge main into the track first.

## Requirements

- `bind.mjs` builds the stage-1 request (seat ask from the 02 resolver incl. `effectiveRigor`, persona qualified id from 03, config subset + digest, `selectors`, `raiseAuthorized`) and calls `bindSeat` for policy. Tier, ceiling, `prefer` order and sources come only from the crate. Stage 2 stays Node for this phase (07 moves it).
- [RT-1] **Global layer**: extend the `sanitizeGlobal` hook (`config.mjs:300`, renamed `sanitizeGlobalLayer`, one function) to drop retired keys (`rigorToTier`) from the global layer before the merge, once-per-process stderr note as today. Global bare-verb entries stay (exact keys, plan decision 4). The `rigorToTier` refusal and the `patterns.seatBinding.schema` requirement apply to the **project layer only**. Tests run with a real temp global file still carrying `rigorToTier` and `review`/`execute`/`advise`.
- [RT-2] **Fill-missing writers**: remove `rigorToTier` from `DEFAULT_RUNNER_CONFIG` (`config.mjs:241`) in this phase; schema marker and new keys are never part of defaults written to the global file; `ensureRunnerConfigForDir` (`config.mjs:399`; write :410, validate :417, first-run bootstrap :425) on an unconverted project file refuses with "run `fgos setup`" before writing anything. It writes the project file only; the global file is written only by `fgos setup` (`bin/fgos.mjs:4061` → `ensureSharedConfigDefaults`), so the load-time sanitizer is the only protection on a machine that has not re-run setup [P00-C6]. All **14** production call sites are covered by the one function change and get a test path each where they surface the refusal: `bin/fgos.mjs:457,491,1250,1287,3982`, `bin/fgos-runner.mjs:99`, `fanout-batch.mjs:51`, `run.mjs:162`, `assignment-runner.mjs:1276`, `dispatch/cli.mjs:388,857,1026` [P00-C6].
- Delete: `rigorToTier` handling everywhere, `DEFAULT_RIGOR_TO_TIER` (:203), `validateRigorToTierShape` (:1529), `resolveTierCeiling`, `resolveSeatTier`, `lookupCapabilityConfig`, the bare-verb use of `hasUsablePrefer`.
- [RT-12] **JS model choice**, move or delete in this phase (except `bind.mjs:309`, which 07 removes with the ranking): `resolveTierModel` call sites `loop.mjs:1614`, `dispatch/cli.mjs:593`, `assignment-runner.mjs:230`, `assignment-policy.mjs:449`, `model-pool-checks.mjs:209`, `scripts/project-agents.mjs:87`; `resolveTierCandidates`, `tierFallbackOf` (`resolve.mjs:140,172`, last users go in 07), `resolveStrongerTier`, `TIER_STRENGTH` (`assignment-policy.mjs:30,107`), `dispatch/assignment.mjs:606`, barrel `src/runner/dispatch.mjs:28,40-41,66-68`; `scripts/project-agents.mjs:36,84-89` (persona rigor → model) asks the crate through the client, or the model column is dropped (lead decides; one path).
- [RT-16c, P00-C7] **Delete `resolveAssignmentDispatchPolicy`** (no wrapper). Its only runtime callers are `plan.mjs:118,174,427`; they ask Seat Binding through `bind.mjs`. Imports to remove: `bind.mjs:10`, `assignment.mjs:66`, `cli.mjs:26`, `assignment-runner.mjs:63`, `plan.mjs:12`, barrel `dispatch.mjs:66-68`; comments to rewrite: `config.mjs:515,517`, `recovery.mjs`, `resolve.mjs`. `dispatch/cli.mjs` and `loop.mjs` are covered by the JS model-choice list above (`resolveStrongerTier`, `resolveTierModel`), not by this one. `risk: heavy` adds checkers only (§5.2).
- [RT-5] `dispatch probe-account` (`dispatch/cli.mjs:1026-1037`) stays outside Seat Binding as a pinned-account probe (explicit executor + account, no tier choice); a test pins that.
- [RT-16a] Doctor rows that import deleted code move here with their tests: delete `capability-rigor-ceiling` (:1515, imports `resolveTierCeiling` via `model-pool-checks.mjs:12,205`) and `runner-rigor-config` (:1437); adjust `model-policy-tier-coverage`'s `rigorToTier` read (:765-789) to the declared tiers until 10 replaces it. Phase 09 only adds rows.
- Bare-verb consumers, all here: `bind.mjs:81`; `registrations.mjs:2654,2668`; `bin/fgos.mjs:2583`; `src/report/capability-plan-lint.mjs:136,143,150` (exact, alias, `<prefix>:*`).
- G5 and [RT-11] raise doors: doors stop synthesising `origin`; every `runUnit` caller door passes `raiseAuthorized: false` and its `selectors`: `fgos run` (`bin/fgos.mjs`), workflow handoff (`unit-handoff.mjs:174-204`), `work-dispatch.mjs:127`, `operation-choice.mjs:2332`, `fanout-batch.mjs:113`. `--tier`/`--override` above resolved → `tier-escalation-unauthorized`; a door-chosen persona/seat/capability resolving above the no-selector tier → same refusal naming the selector; `acceptDependence: true` → refused at the door `dependence-acceptance-unauthorized` (crate also ignores it); `--effort`, `--timeout`, `--account` keep working.
- Visible source: binding record, run evidence and `explain` carry `tierSource`, the workflow recommendation when different, `loweredFrom` + `max-tier-cap` + the `maxTier` path.
- Hash: `snapshotRunnerConfig` covers `defaults`, `maxTier`, `tierFallback`, `patterns.seatBinding`, drops `rigorToTier`; `$comment` stripped. [P00-C11] `maxTier` and `tierFallback` are not hashed today, so every record's hash changes; tests assert the new hash, not the old one (intended, not a regression).
- Tool executors (`kind: tool`) keep today's Node path; identical-output test.
- [RT-16f] Fixtures: phase 00's **fixture-only** files get a codemod that runs `convertRunnerConfig` and writes its output as literal source; the **asserting** files are rewritten by hand to declared tiers and listed in the report.
- forgentX `.fgos/config.json`: conversion, then the D13 lines of spec §10.1/§10.4 (plan decision 5); committed on the phase branch.
- [RT-15] From this phase on, every main→track merge re-runs `convertRunnerConfig` on the merged forgentX config and on fixtures, and flags any new `rigor` / `rigorToTier` key that main introduced.

## Files

- Modify: `src/runner/execution/{bind,run,explain}.mjs`, `src/runner/dispatch/{assignment-policy,assignment,cli,config,plan,recovery,resolve,assignment-runner}.mjs` (policy/model call sites), `src/runner/dispatch.mjs` (barrel), `src/runner/{loop,work-dispatch,operation-choice}.mjs`, `fanout-batch.mjs` (door), `bin/fgos.mjs`, `bin/fgos-runner.mjs` (if it reads `rigorToTier`), `src/workflow/unit-handoff.mjs`, `src/report/capability-plan-lint.mjs`, `scripts/project-agents.mjs`, `src/setup/{registrations,model-pool-checks}.mjs`, `.fgos/config.json`, test fixtures and helpers.
- Delete or shrink to nothing: `src/runner/dispatch/assignment-policy.mjs` (including `REASONING_EFFORT_DEFAULT_FROM_RIGOR` :81,382 [P00-C14]; until 07 lands, effort without an explicit value is the invocation default, and the behaviour change is in the report and CHANGELOG) (any surviving non-policy helper such as `refuseWorkItemInput`/`explicitReasoningEffort` moves to its one consumer or a named leaf; the lead lists where).
- Not touched: `src/workflow/case-admission-port.mjs`, `case-projection.mjs`, `core/skills/fgos-cook/**`, `packages/agent-protocol/**`, `packages/run-supervisor/**`.

## Steps

1. Merge main into the track; list collisions; run the conversion drift check.
2. Global sanitizer + project-only refusal + defaults change; tests with a real global file.
3. Wire stage 1 through the client; keep stage 2.
4. Delete the old tier path, JS model choice, `resolveAssignmentDispatchPolicy`, bare-verb lookups, the two doctor rows.
5. Raise doors.
6. Codemod fixtures; hand-rewrite asserting tests; convert forgentX config + D13 lines.
7. `npm test` green; report lists every behaviour change.

## Tests (proofs owned)

- Workflow recommendation beats `cap.tier`/`prefix.tier`, loses to seat, persona, role keys (`bind-committed-config.test.mjs`: spec §10.2 tier column exactly).
- Above `maxTier` lowered with `max-tier-cap`, `loweredFrom` in explain/record/evidence; capability `maxTier` above global passes (§10.2 variant B).
- Untrusted `human-cli` cannot raise tier or accept dependence; a door-selected persona/seat/capability above the no-selector tier is refused (`test/cli/run-verb.test.mjs`, handoff test, one test per door listed above).
- Tool-executor capability binds as before; `probe-account` unchanged.
- A real global file with `rigorToTier` loads on the new release; a project file with `rigorToTier` is refused.
- `dispatch-policy-baseline-snapshot.test.mjs` diff reviewed line by line.

## Risks / rollback

- H×M fixture churn → codemod + per-group review + behaviour-change list. M×M `bin/fgos.mjs` conflicts → main merged first. Rollback: revert on the track.
