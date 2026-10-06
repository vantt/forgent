---
status: completed
---

# Unit I21 (Phase 5, work item 2) — per-node binding in the request composers

Capability: `code:implement`. Depends on: I19 (catalog `serves`), I17
(vocabulary). Owner design settled 2026-09-27 (design record §12).

## Context

- Binding today: `resolveAssignmentDispatchPolicy` (`src/runner/dispatch/assignment-policy.mjs:215`)
  picks `cliOverride.preferExecutor ?? opPolicy.preferExecutor ?? runnerConfig.executor.command ?? 'claude'`;
  `capabilities.<cap>.prefer` is never consulted on this path.
- `placementPolicy.readOnlyRedirects` (`assignment-runner.mjs:263,1368`) redirects
  read-only operations by operation id when the source executor is claude.
- I16 finding: `fgos coordination start --actors` binds the entry node only;
  later `authorize-and-dispatch` carries no actors (`fgos-plan-loop/SKILL.md:89`).
- Precedent for machine allocation into the trusted scope: `planCohort` +
  `cliPolicy: { preferExecutor, minTier }` (`cohort-planner.mjs`,
  `session-engine.mjs` ~3069–3092); `deriveProviderFamily`,
  `distinctProviderFamilies` already there.
- PolicyPatch vocabulary: `POLICY_PATCH_FIELDS` (`src/runner/definitions/schema.mjs:133`)
  already carries `minTier`, `preferPersona`, `preferExecutor`, `preferInvocation`,
  `fallbackExecutors`; `assertNoPortableExecutorPin` refuses only `preferExecutor`
  at portable scope.
- Composers: `src/verbs/coordination/composers.mjs` (`actors` from params, 143–263).
- Protocols: `core/coordination-protocols/standalone-master-coordination-loop.yaml`
  (`policy.minTier` per operation), `architecture-advisory-panel-v1.yaml`.

## Decisions (do not reopen)

1. **Binding order per node**, computed once by the composer, delivered through
   the existing `cliPolicy` channel with `bindingSource` provenance:
   1. explicit Lead override (`actors[]` roster or per-step `--executor/--tier`) → `override`;
   2. operation `policy.capability` → `capabilities.<cap>.prefer` (executor +
      invocation) and `overrides` → `capability.prefer`;
   3. `policy.minTier` raise-only with declared `rigor` (unchanged);
   4. `readOnlyRedirects` stays below as the read-only safety net (no-op when 2 already bound).
2. **`policy.capability`** (singular, under `policy`, beside `minTier`) is the
   operation's dispatch capability. Optional; portable scope allowed (it is a
   requirement, not a pin). Fallback when absent: `result.kind: work-product` →
   the facade's primary capability; `advisory` → `<domain>:review` if registered,
   else `review`. No config mapping table.
3. **`policy.distinctProviderFrom: [<roleId>...]`** with `strength: required | preferred`
   on the operation. `preferred` binds with a provenance warning when unsatisfiable;
   `required` refuses with `binding.diversity-unsatisfiable` naming roles and
   provider families; Lead may pass an explicit allow flag, recorded in provenance.
   `produce-review-revise` (still `standalone-master-coordination-loop` until Phase 7)
   declares `preferred` for reviewer and red-team vs doer.
4. **Persona** lives in the operation template (Phase 5 work item 1); `actors[].persona`
   remains a request-scope override with provenance. Agent yaml persona not wired here.
5. `readOnlyRedirects` vs `code:review.prefer` overlap is recorded, not resolved;
   Phase 7 decides which one stays.

## Files

Modify: `src/verbs/coordination/composers.mjs`, `src/runner/definitions/schema.mjs`
(`POLICY_PATCH_FIELDS` + validation for `capability`, `distinctProviderFrom`),
`src/runner/coordination/session-engine.mjs` (accept per-node `cliPolicy` from the
composer on every declared step, not only fan-out), the two protocol YAMLs,
`src/setup/registrations.mjs` (doctor: every `policy.capability` resolves; provider
family count), `docs/architect/agent-coordination/contracts/flow-definition.md`
(PolicyPatch section, additive), `core/skills/fgos-plan-loop/SKILL.md` (remove the
transitional `--actors` sentence; open inputs binding now from config),
`docs/how-to/author-a-plan-loop-track.md` (Roster becomes optional override),
`CHANGELOG.md`.
Create: `src/verbs/coordination/binding.mjs` (pure per-node binding, reuses
cohort-planner helpers), `test/verbs/coordination-binding.test.mjs`.

## Steps

1. Schema: add the two optional policy fields with validation; drift/conformance tests.
2. `binding.mjs`: pure `bindOperations(definition, request, runnerConfig, facts)` →
   per-node `cliPolicy` + provenance; tests for the four-step order, fallback
   capability derivation, diversity `preferred`/`required`, override precedence.
3. Composers call it for `start`, `operation`, `authorize-and-dispatch`; provenance
   surfaces in `fgos coordination status`.
4. Protocol YAMLs declare `policy.capability` and `distinctProviderFrom`.
5. Doctor check; skill/how-to text; CHANGELOG.
6. Live proof: one plan-loop cell on this repo with no hand roster; `status` shows
   doer on `code:implement.prefer`, reviewer/red-team on `code:review.prefer`,
   provenance `capability.prefer`.

## Verification

```sh
node --test test/verbs/coordination-binding.test.mjs test/runner/coordination-request-composers.test.mjs
node --test test/runner/flow-definition-schema.test.mjs test/runner/flow-definition-standalone-master-coordination-loop.test.mjs test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs
node --test test/runner/cohort-planner.test.mjs test/runner/cohort-planner-purity.test.mjs
node --test test/skills/coordination-phase4-driver-discipline.test.mjs   # plan-loop text + budget still green
node bin/fgos.mjs doctor
env -u CLAUDE_CODE_SESSION_ID npm test
```

Review độc lập: `code:review`. Red-team: attempt a portable YAML that smuggles
`preferExecutor` under `policy.capability`; attempt `required` diversity with a
single-family config and confirm refusal names the roles.

## Risks / rollback

- `session-engine.mjs` is kernel-adjacent; the change is limited to accepting an
  already-computed `cliPolicy` per declared step (the fan-out path already does),
  never to deciding a binding inside the engine.
- Replay: old sessions carry recorded provenance; nothing re-resolves.
- Rollback: composer falls back to today's behaviour when `binding.mjs` is absent;
  schema fields optional.
