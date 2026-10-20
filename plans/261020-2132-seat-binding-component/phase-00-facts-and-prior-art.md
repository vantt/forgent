# Phase 00: facts and prior art

Owner: Sonnet lead in a worktree from the track. Size S (3h). Read-only; output is one report (path from `fgos convention path --kind report --type phase-lead --slug seat-binding-facts --json </dev/null`; every phase lead names its report the same way with its own slug), committed in the phase worktree.

## Context

- [plan.md](plan.md); spec §3.1, §4.3, §4.5, §5.3, §5.4, §6.1, §8.
- AGENTS.md "Prior art before design": `git log -S/-G` on each symbol, also under pre-rename ids; read the "Lịch sử quyết định" of `docs/specs/runner.md` (RUL80, RUL91, RUL92, RUL98, RUL102, RUL103, RUL106).

## Requirements

For every mechanism the spec replaces: what exists today (file:line), who calls it (`rg` count + list; first 10 and total if more), which change introduced it and whether its removal was ever attempted. The planner verified the rows below at HEAD `b87b58df2`; the lead re-verifies each and fills the open cells.

| Mechanism | Today | Consumers (planner count) | Lead adds |
|---|---|---|---|
| `bind()` and its exports | `src/runner/execution/bind.mjs:453`; `walkBindings` :708, `listCandidates` :724, `nextCandidate` :755, `retrySameCandidate` :786, `bindingIdentity` :138, `getProviderFamily` :106, `hasUsablePrefer` :68, `poolUnusableReason` :215 | src: `run.mjs:15`, `explain.mjs:7`, `account-rotation.mjs:11`, `dry-bind.mjs:6`, `dispatch/assignment-runner.mjs`, `setup/{blind-steps-proven-pools,executor-posture-coverage,model-pool-checks,registrations}.mjs`; 11 test files | which export each caller uses; tool-executor path inside `prepare` (:234) |
| `rigorToTier` / `DEFAULT_RIGOR_TO_TIER` | `config.mjs:203`, :241, required :1710-1715, shape :1529-1555 | 69 files, 212 hits: src `loop.mjs:1609`, `execution/run.mjs:166`, `bind.mjs:127,151`, `registrations.mjs:508-518,765-789,1438,1468`, `dispatch/cli.mjs:589`, `config.mjs`, `assignment-policy.mjs:253,316`; 62 test files | split test hits into "fixture config only" vs "asserts rigor→tier behaviour" |
| `assignment-policy.mjs` (`resolveAssignmentDispatchPolicy` :213, `TIER_STRENGTH` :30, `resolveStrongerTier` :107) | Work path tier/model computation | importers: `dispatch/{assignment,assignment-runner,cli,config,plan,recovery,resolve}.mjs`, `dispatch.mjs`, `execution/bind.mjs`; 8 test files | does `runUnit` recompute tier through it inside `executeAssignment` (`run.mjs:856` → `assignment-runner.mjs:1270`)? trace exactly which values the attempt uses |
| `attemptProviderCapacityFallback` | `assignment-runner.mjs:1026`, called :1711; uses `dispatch/recovery.mjs` `resolveFallback` | 1 caller | which entry points reach :1711 (`fgos run` vs `fgos dispatch` legacy reads) |
| `provider-capacity.mjs` ranking under lock | `acquireProviderAccountLease` :605, rank+`ranked[0]` inside `withProviderStateLock` :623-636; `rankProviderAccounts` :595 | 22 src importers (list in report) | does any code exec the host (identity, terminal-control) while `withProviderStateLock` (:423) is held? it does not call `noteLockHeld` today |
| `tier-cell.mjs` `parseTierCell` | `:25-40`, rejects non-strings | `dispatch/config.mjs`, `dispatch/resolve.mjs`, `setup/model-pool-checks.mjs`; 1 test | — |
| `role-ledger.mjs` | `:20-34` keyed by role | `run.mjs`, `dry-bind.mjs` | every place a role string becomes a storage key: assignment dirs, `unit.json` seats, handoff refs (`handoff-refs.mjs:12-13`), `unit-summary.mjs:67,84-88` |
| `CHECKER_ROLES` | `bind.mjs:19`, helper :22-24; also `dispatch/config.mjs` | 2 files | every role-name branch: `panel.mjs:26-33`, `debate.mjs:35-43`, `role-tasks.mjs` (stance ~:100), `case-admission-port.mjs` (execution) :17,:66-77 |
| inline-lead path | `bind.mjs:498-516` (`session-lead-inline`, `model: 'default'`) | 1 | which tests expect inline producer |
| `human-cli` origin | synthesised `bin/fgos.mjs:2851,2862,2878,2889`, `src/workflow/unit-handoff.mjs:198`; trusted `bind.mjs:385` | — | any other reader of `override.origin` (tierSource strings, evidence) |
| bare-verb lookup | `bind.mjs:73-89` (verb at :81) | `registrations.mjs:2654,2668` (`workflow-capabilities-configured`), `bin/fgos.mjs:2583` (capability description), `src/report/capability-plan-lint.mjs:136,143,150` (`isCapabilityDeclared`) | count bare-verb-only entries in forgentX, mdview, mcp-skill-hub configs and which `<prefix>:v` capabilities rely on them |
| `agent-definitions.mjs` | `agentTierDirs` :36-54, one domain tier | `bin/fgos.mjs`, `agent-listing.mjs`, `agent-roster.mjs`, `dispatch/assignment.mjs`, `execution/run.mjs`, `registrations.mjs`, `workflow/case-start.mjs`; 1 test | — |
| `workflow/loader.mjs` | flat files only, `:72-98` | `registrations.mjs`, `workflow/index.mjs`, `workflow/case-start.mjs`; 4 tests | — |
| `snapshotRunnerConfig` | `run.mjs:161-172` | `operation-choice.mjs`, `workflow/case-start.mjs`, `workflow/runner.mjs` | — |
| doctor rows (spec §8) | `runner-rigor-config` :1437, `tier-vocabulary-dead-keys` :1461, `model-policy-tier-coverage` :1467, `executor-family-unique` :1473, `tier-fallback` :1485, `model-policy-pools` :1491, `capability-rigor-ceiling` :1515, `workflow-capabilities-configured` :2681, `workflow-pools-satisfy-independence` :4772, `blind-steps-use-proven-pools` :4781, `executor-posture-coverage` :4790 (all `src/setup/registrations.mjs`) | — | which read `rigorToTier`, roles or the bare verb |
| `unit.prefer` / `--provider` | `unit.mjs:21-35,293`; `bin/fgos.mjs:489` | — | can a workflow YAML or `--units` file set `prefer` today? (plan decision 7 refuses it) |
| `workflow start --seats` | `src/workflow/seats.mjs` (`expandWorkflowSeats` :124, `seatedPanelUnits` :172), `seat-providers.mjs` | `case-verbs.mjs`, `case-start.mjs` | keyed by `panelist-N` today? |

Also answer:

1. Prior art: `git log -S` for `seat`, `seatId`, `schemaVersion` in runner config, `tierCeiling`, `session-lead-inline`, `CHECKER_ROLES` (introduced `abe6f2b3c`), `rigorToTier`; under old executor ids. Was any seat-keyed storage tried and removed?
2. Core workflows with `pattern: panel|debate` (planner found: `architecture-advisory.yaml:36`, `nominal-group.yaml:27`, `group-cognition.yaml:27,38`, `council-lite.yaml:22`, `business-discussion.yaml:36`, `delphi.yaml:31,53`); list their `params.members`, `roleTasks` keys and persona use. Domain workflows (`domains/coding/workflows/feature.yaml`, `domains/marketing/workflows/content-publish.yaml`) use only `solo`/`reviewed`.
3. Baseline exec cost: time 50 runs of `$FGOS_HOST_BIN internal identity mint-attempt --attempt x --protocol 1 </dev/null` (p50/p95) on this machine, for phase 04's comparison.
4. In-flight records today: count `unit.json` in `doing`/`paused` under `.fgos/` of forgentX (read-only).

## Files

Read only. Create the report.

## Steps

1. Re-grep every row; fix any stale line.
2. Fill the "Lead adds" column with evidence.
3. Answer 1–4.
4. Flag anything that contradicts the plan's decisions 1–9; do not redesign.

## Tests

None (read-only). The big lead reads the report before releasing phases 01–03.

## Rollback

Nothing to roll back.
