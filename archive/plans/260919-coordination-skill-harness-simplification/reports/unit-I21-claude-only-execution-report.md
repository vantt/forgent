# Unit I21 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I21`,
worktree `.claude/worktrees/coordination-skill-harness-i21-per-node-binding`,
base `main@e1dab2dfa` (post-I19), integrated `main@9d1fbc99d` (post-I20).

This was the most heavily red-teamed unit in the track: an initial
independent review found 4 HIGH + 3 MEDIUM findings before any fix landed;
two subsequent recheck passes each found one more genuine HIGH the prior
round's own fix-and-test cycle had missed. All 3 fix rounds (the full cap)
were used. Every round's fix was independently re-verified by Lead directly
reading and running the code — not only trusting agent self-reports —
which is how the round-2 confinement regression was caught (the fixer's own
new test passed; Lead's own direct `bindOperations` call against the real
config proved the fix was incomplete).

## Implementer (sonnet, fullstack-developer)

Built `bindOperations` (pure, four-step precedence), wired it into both
composers, added the two new schema fields, the doctor check, and did the
Step 6 live proof. Surfaced two real scope questions before writing
composer-wiring code rather than guessing: (1) making `capability.prefer`
provenance visible in `fgos coordination status` required touching files
outside its list and would conflate the Phase 1 action-view's "what is
legal next" concern with a "what happened" concern — Lead ruled: ship the
functional binding, defer status-surfacing to Phase 6/7, verify Step 6 via
the persisted assignment artifact directly; (2) wiring `composers.mjs` into
production actually required two more thin pass-through files
(`start.mjs`, `actions.mjs`) the phase file's Files list had missed — Lead
approved the extension as necessary plumbing, not scope creep.

Full `npm test` at the initial candidate (4225d1111): 7793 pass, 0 fail.

## Independent review + test (round 1, opus)

Both a tester and reviewer, run in parallel, independently found the same
core problem and diverged on severity in ways that combined to a complete
picture:
- **H1** (reviewer): a portable YAML's `policy.capability` naming a literal
  registered executor id resolves via `resolveExecutorAndOverrides`'s
  `bindingSource: 'executor-id'` branch, bypassing `assertNoPortableExecutorPin`
  — Lead independently confirmed by reading `resolve.mjs`/`binding.mjs`
  directly before dispatching a fix.
- **H2** (reviewer): a CLI `--executor` flag is silently outranked by the
  newly-populated `actorEntry.executor` in `run.mjs`'s
  `actorEntry?.executor ?? globalExecutor` — Lead confirmed by reading
  `run.mjs` directly.
- **H3** (tester): a `start`-time roster override is lost on later
  `authorize-and-dispatch` nodes (`composeCoordinationActionRequest` always
  seeds `actors: []`).
- **H4** (tester + reviewer independently): `architecture-advisory-panel-v1`'s
  8 actors collapse onto a single unconfined `xai` executor via the
  `capability.for` fallback, losing the pre-I21 confined `readOnlyRedirects`
  path — flagged by both agents without coordination.
- **M1-M3**: `.for` fallback beyond Decision 1.2's literal text; capability
  `overrides` dropped on the executor-id path; a trusted `opPolicy.preferExecutor`
  outranked by the new mechanism.

## Fix round 1 (86b3cd546)

H1 fixed (refuse `bindingSource === 'executor-id'`). H2 fixed (thread
`cliExecutor` to suppress computed additions). M3 attempted, reverted after
breaking an already-passing red-team test; root-caused to
`session-engine.mjs`'s pre-existing `cli`-scope-outranks-`assignment`-scope
precedence (session-engine.mjs untouched by this unit's own diff) — Lead
verified the fixer's exact line citations and accepted the revert as
correct, deferred M3 as a named, out-of-boundary architectural question.

Lead independently reproduced H4 directly (`resolveExecutorAndOverrides(cfg,
"review")` against the real config → `bindingSource: "capability.for"` →
`xai`/`pi-cli-vantt`, unconfined) — confirming round 1 had NOT closed H4
despite the fixer keeping `.for` valid on the (mistaken) belief it was
required by pre-existing coverage (it was the unit's own new test).

## Fix round 2 (a138e4353, 6d55adb94)

H4 fixed for real this time (restrict to `bindingSource === 'capability.prefer'`
only) — Lead independently reproduced via a direct `bindOperations` call
against the real `architecture-advisory-panel-v1` protocol and committed
config: all 8 `review`-capability actors now `unbound`. Tier-only roster
suppression bug fixed. CHANGELOG regression (round 1 replaced instead of
added to the I17 entry) fixed. H3/item-2 investigated in full: confirmed a
genuine pre-existing gap (manifest/store actor shape never had an
executor/tier field, predating this unit) — deferred; only the overclaiming
SKILL.md text was corrected.

## Recheck 1 (opus tester + reviewer, parallel)

Both confirmed H1/H2/H4/tier-fix/CHANGELOG resolved and the M3/H3 deferrals
hold on direct code inspection. The reviewer found a NEW HIGH neither prior
round caught: retrying `coordination start` on an existing session throws
`payload-conflict` whenever any actor gets a capability-computed binding —
a real idempotent-retry/cold-resume regression hitting the live
`standalone-master-coordination-loop` config. Plus 2 MEDIUM (doctor check
accepts resolution branches `binding.mjs` itself now refuses; SKILL.md
names a flag, `--actors`, that doesn't exist on later steps).

## Fix round 3 (1edef28f4, ed4de649c — FINAL, 3-round cap)

Lead's own initial fix direction ("skip entries lacking `role`") was traced
by the fixer and found incorrect: `role` is schema-forbidden on every
request actor entry, not merely absent on computed ones — a genuine design
fork with no round 4 available, resolved via an advisory consultation with
the full evidence trail before implementing. Fixed by comparing only the
caller's raw `options.actors` against what the manifest durably owns
(identity + `persona`), confirmed the defect predates this unit
(`232ef31e1`) and simply never fired before non-empty `actors[]` became the
default. Doctor check and both docs (SKILL.md, author-a-plan-loop-track.md)
also corrected in this round, the latter via a Lead addendum after a second
recheck caught it wasn't covered by round 2's SKILL.md-only fix.

## Recheck 2 (opus tester + reviewer, parallel)

Confirmed all fixes hold, including the idempotent-start fix (tested
against a real `standalone-master-coordination-loop` session, not a
synthetic fixture) and both doc corrections. No new HIGH findings.

## Lead final verification and merge

Reran every named suite directly, plus a full `env -u CLAUDE_CODE_SESSION_ID
npm test` (7803 tests, 7730 pass, 0 fail, exit 0) at the final candidate.
`git -C /home/vantt/projects/forgentX merge --no-ff unit/I21` from the main
checkout onto post-I20 `main@67bd9fb63`, `ort` strategy; CHANGELOG.md and
docs/architecture-manifest.json auto-merged (both also touched by I20, no
manual conflict resolution needed). `integratedSha =
9d1fbc99d59b4e993173e26ccb66af9f42711371`. Reran key suites plus a full
suite on the merged tree to confirm the auto-merges introduced nothing
unexpected — clean.

Post-merge full suite on the main checkout itself showed the same 3
`fanoutBatchExecutorCli`/`test/runner/dispatch-production-call-sites.test.mjs`
failures already documented as a main-checkout-specific test-environment
anomaly in Unit I18's report (not reproducible in a fresh worktree at the
exact same commit, not caused by any code in this or any other merged
unit's diff). Reconfirmed here with a fresh detached worktree at the actual
integrated SHA: 20/20 pass. Recorded again for whoever eventually
root-causes the main-checkout-specific factor.

## Process note

A coordination slip occurred twice during this unit: a write-capable fixer
agent was dispatched into the same worktree a read-only tester/reviewer was
still active in. No corruption resulted either time (the read-only agents'
findings were internally consistent and matched independent confirmations),
but this should not recur — check `ListAgents` for existing occupants of a
worktree before dispatching a new agent into it.
