# Phase 03 - Role Execution Policy Readiness

## Objective

Ensure the Master Coordination fixture has intentional execution policy before
the MVP5 live proof: cheap where safe, strong enough where correctness and
adversarial review matter.

This phase is not broad model tuning. It adds only the capability/config
readiness needed for Doer, Reviewer, Red-Team, Fixer, and Recheck to resolve
predictably through existing dispatch policy.

## Requirements

- **R1 Capability audit.** Read current runner config and dispatch policy. Record
  how `standalone-master-coordination-loop` operations resolve today for Doer,
  Reviewer, Red-Team, Fixer, and Recheck.
- **R2 Explicit capability surface.** If role operations cannot resolve
  intentionally, add minimal capabilities such as `coordination-doer`,
  `coordination-review`, `coordination-red-team`, `coordination-fix`, and
  `coordination-recheck`, or the smallest equivalent supported by current
  dispatch config.
- **R3 Tier floors, not model pins.** Fixture/protocol code declares
  capabilities and `minTier`; project config maps to concrete executors and
  provider/model policies. Portable fixture files must not hardcode literal
  provider/model names.
- **R4 Cost-quality defaults.** Doer/Fixer may default to standard or the
  cheapest capable coding executor. Reviewer/Recheck default to analytical
  read-only execution. Red-Team defaults to analytical and escalates to critical
  for invariant, security, concurrency, dispatch, session/replay/schema, or
  Work-boundary cells.
- **R5 Read-only review executor.** Reviewer, Red-Team, and Recheck should prefer
  a read-only-capable executor when available. They must not need git-write
  grants to produce their own RunResult/report.
- **R6 Escalation without default overspend.** Opus/Sol-class or equivalent
  critical reasoning is used by policy escalation or manual coordinator
  decision, not as the default for every review.
- **R7 Config discipline.** Any new config default, env var, runtime-read file
  location, or infrastructure assumption is registered with setup/doctor in the
  same phase.
- **R8 Dispatch proof.** `decide` or equivalent dispatch tests prove every role
  resolves to the intended mechanism/executor/tier, and missing critical-tier
  support fails closed when critical is required.

## Files

Expected source/config/test/docs:

- `.fgos/config.json` or the project/global config source currently governing
  this repo
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/setup/checks.mjs` and setup registration files only if config defaults or
  doctor-visible assumptions change
- `test/runner/dispatch*.test.mjs`
- `test/runner/flow-definition*.test.mjs`
- `docs/architect/agent-coordination/contracts/flow-definition.md`
- `docs/specs/runner.md` if user-visible dispatch/config behavior changes
- `CHANGELOG.md` if user-visible config/CLI behavior changes

Do not modify provider/model policy to hide missing support. If a configured
provider cannot satisfy a required tier, the proof must fail closed or choose a
different configured executor through normal policy.

## Tests First

Add failing tests or recorded dispatch checks for:

- each fixture role operation resolves with intended capability and minTier;
- Reviewer/Recheck use read-only-capable executor policy when configured;
- Red-Team critical escalation resolves for high-risk cells;
- missing critical-tier support rejects instead of silently downgrading;
- portable fixture does not pin literal provider/model;
- config validation catches malformed role capability/executor mapping.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/dispatch*.test.mjs' \
  'test/runner/flow-definition*.test.mjs'
```

Run setup/doctor tests if config defaults or doctor checks change. Run the full
test command before closing this phase.

## Proofs And Exit

- Trace records the final intended mapping for Doer, Reviewer, Red-Team, Fixer,
  and Recheck in terms of capability, tier, executor, providerModel, and model.
- The mapping is cheap by default but escalates for high-risk Red-Team/recheck
  work.
- The MVP5 live proof can rely on role-tier separation rather than accidental
  defaults.

## Risks / Rollback

Risk: turning this phase into general model marketplace work. Keep it local to
the Master Coordination fixture's roles. Risk: hardcoding current model names in
portable protocol files. Keep provider/model mapping in config and leave the
fixture at capability/tier level.

