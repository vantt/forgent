# Current Cell: P00.1 (Read-Only Dispatch Readiness)

Status: in-progress
Owner: Doer (to be dispatched)
Last updated: 2026-09-05
Next action: dispatch Doer via `fgos coordination run`

## Objective

Establish a hard, live-proven read-only confinement envelope before any
advisory agent inspects a real proof project. Probe `claude`, `codex`, `agy`
(and any replacement) for a real read-only mode or outer OS/filesystem
confinement; run every admitted pair against a disposable checkout with a
prompt that explicitly tries to modify/commit a sentinel file; record exit
result, before/after git status/hash, and refusal/containment evidence.
Capture the current full-suite baseline against the plan's recorded four
known failures.

## Must Read

- `plans/260905-architecture-advisory-panel/phase-00-read-only-dispatch-readiness.md` (full requirement source)
- `plans/260905-architecture-advisory-panel/plan.md` (Read This First, Entry Conditions, Plan-Level Invariants, Stop Gates)
- `.fgos/config.json` (`runner.executors.*` — current claude/codex/agy invocation shapes; `codex` is flagged bypass-all/no-sandbox in its own description)
- `src/setup/checks.mjs` (doctor check registry, if a new config default is needed)
- `docs/architect/agent-coordination/verification/architecture-advisory-panel/index.md` (this track's audit + deviations)

## Requirements (from phase-00.md)

- Compare provider-native sandbox flags, executor variants, OS/filesystem
  sandboxing/read-only mounts; select the smallest general mechanism.
- Reuse `claude-reviewer` only after re-proving mutation-negative behavior.
- Do not admit current `codex-cli` (bypass-all, no sandbox) unless an outer
  OS/filesystem envelope independently contains it.
- Probe `agy` for a real read-only mode + outer confinement; exclude if unsafe
  or absent.
- Live mutation-attack probe per admitted pair against a disposable checkout
  (never accept the checkout itself as confinement).
- If a new config default/executor variant/confinement dependency becomes a
  product dependency, register it via setup config-merge + doctor checks.
- Capture full-suite baseline; name any drift from the plan's recorded four
  known failures.

## Files

Lease: `readonly-dispatch` —
`docs/architect/agent-coordination/verification/architecture-advisory-panel/{index.md,current-cell.md,P00.1.md,proofs/P00.1/**}`;
`.fgos/config.json`, `src/setup/checks.mjs`, the exact existing config-default
owner proved by this cell's own audit, matching dispatch/setup tests, and
`CHANGELOG.md` only if the selected mechanism requires them.

## Do Not Touch

Anything outside the `readonly-dispatch` lease above. No protocol/skill files.
No `Work` items, claims, `fgos pick/cook/submit`. No git merge into
`group-thinking-plan-loop` — Lead performs that by hand after close.

## Role Roster

- Doer: `agy-cli`, tier `standard`, persona `meticulous-implementer`
- Reviewer: `claude`, tier `analytical`, persona `skeptical-reviewer`
- Red-Team: `codex-cli` (proof/investigation dispatch only — never treated as
  an admitted target of its own probe by virtue of being used as Red-Team),
  tier `analytical`, persona `adversarial-tester`

## Exact Commands

```sh
fgos coordination chain architecture-advisory-panel --json
fgos coordination run --cwd ../architecture-advisory-panel-p00-1 --file open.json
fgos coordination show architecture-advisory-panel--p00-1 --json
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
```

## Stop Gates

- Fewer than two safe executor/provider bindings — park heterogeneous proof,
  do not admit an unsafe pair.
- Any live mutation-attack probe succeeds against tracked/untracked source
  outside the evidence-output boundary — treat that pair as unsafe, do not
  soften the finding.
- A concurrent track claims any file in the `readonly-dispatch` lease.
- Full-suite baseline shows a failure beyond the plan's recorded four.

## Trace Update

Doer/Reviewer/Red-Team write to `P00.1.md` (Proof Matrix, Commands, Review,
Red-Team, Gaps sections). Coordinator (this session) owns `index.md` and this
file exclusively.

## Report

`plans/260905-architecture-advisory-panel/reports/doer-260905-1821-p00-1-readonly-dispatch-report.md`
(role, cell, outcome, exact executor/mechanism pairs admitted/excluded,
mutation-attack evidence, baseline result). End with:
`Status: DONE | DONE_WITH_CONCERNS | BLOCKED` and a two-line summary.
