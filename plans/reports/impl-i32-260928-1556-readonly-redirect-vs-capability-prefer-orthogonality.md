# I32 — readOnlyRedirects vs capability.prefer: orthogonality decision

## Outcome: (a) genuinely orthogonal — NO config migration

`placementPolicy.readOnlyRedirects` and `capabilities.code:review.prefer` are two
mechanisms at different layers of the dispatch pipeline, with an explicit,
code-enforced precedence between them. The live config's convergence on the
same target (openai/codex-cli-bwrap) for `review-candidate`/`red-team-candidate`
is intentional defense-in-depth, not structural competition. No migration is
warranted; this closes I32 with a documentation clarification only (proposed
snippet below, not applied by me — see capability note).

## Evidence chain (file:line, all read directly)

**1. `capability.prefer` resolves ahead of dispatch, at CoordinationProtocol
bind time, and only "counts" through one specific branch.**

`src/verbs/coordination/binding.mjs:90-108` (`deriveOperationCapability`):
declared `operation.policy.capability` always wins as the capability name to
resolve (e.g. `code:review`, as declared for `review-candidate`/
`red-team-candidate` in `core/coordination-protocols/standalone-master-coordination-loop.yaml:125,137`).

`binding.mjs:172-266` (`bindOperations`): calls
`resolveExecutorAndOverrides(runnerConfig, capabilityName)` and then gates on
`resolved.bindingSource !== 'capability.prefer'` (the H1 red-team fix,
`binding.mjs:240-263`). Only a genuine `cfg.capabilities[name].prefer` match
counts as a real capability resolution; a match via a literal executor id or
an executor's own `for:[]` array is explicitly treated the same as
"unconfigured" and falls through. The fallback comment is explicit, twice:

- `binding.mjs:224` — "no policy.capability declared and no facts.primaryCapability
  supplied ... leaving this actor unbound (minTier/readOnlyRedirects remain the
  safety net)"
- `binding.mjs:266` — "fall through to 'unbound' so minTier/readOnlyRedirects
  remain the safety net, never thrown"

The module's own header (`binding.mjs:20-25`) states this precedence
directly: `policy.minTier` and `placementPolicy.readOnlyRedirects` "are NOT
computed here — both already apply at their own existing scopes ... whenever
this module leaves `cliPolicy` empty for an actor, so they remain the safety
net underneath an unbound actor exactly as they do today."

**2. `readOnlyRedirects` fires at real dispatch execution time, gated
specifically on the resolved executor still being the literal default
`'claude'`.**

`src/runner/dispatch/assignment-runner.mjs:1359-1390`
(`executeAssignment`'s dispatch-plan compilation):
- `declaredPrimaryExecutorId`/`defaultExecutorId` = `effectivePolicy.executorPreference[0]`
  (line 1359, 1372) — this is whatever `compileDispatchPlan` →
  `resolveAssignmentDispatchPolicy` already resolved (including any
  `preferExecutor` a caller stamped, e.g. from a `bindOperations` binding's
  `cliPolicy`).
- `redirectAttempted = isReadOnlyAssignment(effectiveAssignment) &&
  defaultExecutorId === 'claude' && !hasExplicitInvocationPin` (line 1388).

This guard is the crux: the redirect only ever engages when the
already-resolved executor is still the literal string `'claude'` — i.e.
exactly the case where nothing upstream (capability.prefer, an explicit
actor override, an explicit `preferExecutor`) already redirected the
dispatch away from `'claude'`. If `bindOperations` genuinely resolved
`code:review` → `openai` (as it does on the live config, evidence #4 below),
`defaultExecutorId` is `'openai'`, not `'claude'`, and this branch never
fires. The two mechanisms are structurally mutually exclusive per dispatch,
not competing for the same decision.

**3. `resolveAssignmentDispatchPolicy` itself never reads
`capabilities.*.prefer` — it only sees a literal executor id/`preferExecutor`,
confirming capability resolution is upstream (in `binding.mjs`) and single-owner.**

`src/runner/dispatch/assignment-policy.mjs:213-224`: `primaryExecutor =
cliOverride.preferExecutor ?? opPolicy.preferExecutor ??
runnerConfig?.executor?.command ?? 'claude'` — no `capabilities` lookup here
at all. `src/runner/dispatch/plan.mjs:107-119` confirms the same for the
`--assignment` dispatch-decide path: `executorId = policy.executorPreference[0]`
(already-literal), then `resolveExecutorAndOverrides(cfg, executorId)` is
called with that literal id, not a capability name.

**4. Live config confirms the "same target" convergence is real, and is the
expected shape of a primary-plus-fallback design, not two paths racing.**

`.fgos/config.json:22` (`runner.capabilities`) →
`runner.capabilities['code:review'].prefer = [{executor:"openai",
invocation:"codex-cli-bwrap"}]` (entry starts `.fgos/config.json:101`).
`.fgos/config.json:156` (`runner.placementPolicy.readOnlyRedirects`) →
`readOnlyRedirects.claude.default` and
`readOnlyRedirects.claude.operations.{review-candidate,red-team-candidate}`
all also resolve to `{executor:"openai", invocation:"codex-cli-bwrap"}`.

Given evidence #1-#3: for `review-candidate`/`red-team-candidate` actors
reached through `bindOperations` (the declared-protocol path), `capability.prefer`
resolves genuinely (bindingSource `'capability.prefer'`) and wins outright —
the `readOnlyRedirects.claude.operations.{review-candidate,red-team-candidate}`
entries are currently *inert* for that specific path (never reached, since
`defaultExecutorId` is already `'openai'`, not `'claude'`). They are not dead
weight, though: `readOnlyRedirects` is consulted by `executeAssignment` for
**every** read-only assignment reaching real dispatch
(`assignment-runner.mjs:1388`, gated only on `isReadOnlyAssignment` +
`defaultExecutorId === 'claude'`), regardless of whether that assignment ever
passed through `bindOperations` at all — e.g. a legacy/non-protocol
reviewer-role assignment, or any actor that fell through `bindOperations`'
"unbound" branch (comment evidence #1). The operator configured both to the
same safe target deliberately, so that whichever path a given assignment
actually takes, it lands on the same confined reviewer — genuine
defense-in-depth, not two mechanisms racing to answer the same question at
the same time.

## What would flip this to outcome (b)

If `resolveAssignmentDispatchPolicy` or `compileDispatchPlan` ever started
reading `capabilities.*.prefer` directly (duplicating `binding.mjs`'s
resolution), or if `readOnlyRedirects`' guard stopped being scoped to the
literal `'claude'` default (e.g. fired regardless of what capability
resolution already picked), the two would become real competing writers of
the same field. Neither is true today (evidence #2, #3).

## Proposed doc clarification (outcome (a) deliverable — not applied by me)

`docs/architect/agent-coordination/contracts/flow-definition.md`'s `capability`
bullet (`flow-definition.md:598-606`) documents `capability`'s resolution but
says nothing about its relationship to `placementPolicy.readOnlyRedirects`.
Proposed one-sentence addition immediately after the existing bullet (line 606):

```markdown
- `capability`'s resolution and `placementPolicy.readOnlyRedirects`
  (`src/runner/dispatch/placement-policy.mjs`) are layered, not competing: a
  genuine `capability.prefer` resolution (`bindingSource: 'capability.prefer'`)
  always wins and structurally bypasses the redirect (its guard only fires
  when the resolved executor is still the literal default `claude`, see
  `src/runner/dispatch/assignment-runner.mjs`'s `redirectAttempted`);
  `readOnlyRedirects` is the dispatch-time safety net for every read-only
  assignment that reaches execution without an upstream capability/executor
  preference already redirecting it away from `claude` — including
  assignments that never pass through `bindOperations` at all.
```

**Capability note:** this unit's own capability is `code:review`
(investigation-only, non-mutating). I have not written this snippet into
`flow-definition.md` — that edit is left to the Lead/a `code:implement`
follow-up, per the "you may write only a decision record ... plus optionally
a note in flow-definition.md" instruction and my own operating constraint to
report findings/recommendations only, not make edits.

## Files read (no files modified)

- `plans/260919-coordination-skill-harness-simplification/plan.md:3159-3199`
- `src/verbs/coordination/binding.mjs` (module header + `deriveOperationCapability` + `bindOperations`)
- `src/runner/dispatch/placement-policy.mjs:280-403`
- `src/runner/dispatch/assignment-runner.mjs:245-330,1330-1450`
- `src/runner/dispatch/assignment-policy.mjs:100-250`
- `src/runner/dispatch/plan.mjs:1-120`
- `src/runner/work-compat.mjs:60-110`
- `core/coordination-protocols/standalone-master-coordination-loop.yaml` (operation declarations)
- `.fgos/config.json` (live runner config, `capabilities`/`placementPolicy` sections)
- `docs/architect/agent-coordination/contracts/flow-definition.md:566-629`

## Unresolved questions

None — evidence was consistent and unambiguous across all call sites checked.

Status: DONE
Summary: Outcome (a) — `readOnlyRedirects` and `capability.prefer` are
layered (primary + dispatch-time safety net), not competing; the live
config's identical target is intentional defense-in-depth. No config
migration; a one-sentence flow-definition.md clarification is proposed but
left for the Lead/a follow-up unit to apply.
Concerns/Blockers: none.
