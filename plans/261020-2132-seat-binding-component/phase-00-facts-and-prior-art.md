# Phase 00: facts and prior art

**Status: done** (merged on main 2026-10-20; [the phase 00 report](../reports/phase-lead-261020-2215-seat-binding-phase-00-facts.md)). Its section 2 corrections C1–C17 are integrated into this plan with tags `[P00-Cn]`; the table below is kept as the brief it ran from, with the cosmetic counts fixed.

Owner: Sonnet lead in a worktree from the track. Size S→M (0.5d; grew with [RT-4], [RT-5], [RT-6], [RT-16f]). Read-only, except one live read-only drain query on forgentX. Output is one report (path from `fgos convention path --kind report --type phase-lead --slug seat-binding-facts --json </dev/null`; every phase lead names its report the same way with its own slug), committed in the phase worktree.

## Context

- [plan.md](plan.md); spec [`docs/specs/seat-binding.md`](../../docs/specs/seat-binding.md) §3 (authority), §5.3 (cells), §5.5 (raise), §6.3 (precedence), §6.4 (personas), §7.1 (seat contract), §9 (conversion) [RT-16b: section numbers are the spec on main, not the draft].
- AGENTS.md "Prior art before design": `git log -S/-G` on each symbol, also under pre-rename ids; read the "Lịch sử quyết định" of `docs/specs/runner.md` and seat-binding.md §15 (D-ADR0072).

## Requirements

For every mechanism the spec replaces: what exists today (file:line), who calls it (`rg` count + list; first 10 and total if more), which change introduced it, whether its removal was ever attempted. Rows were verified at HEAD `b87b58df2`; the lead re-verifies each and fills the open cells.

| Mechanism | Today | Consumers (planner count) | Lead adds |
|---|---|---|---|
| `bind()` and its exports | `src/runner/execution/bind.mjs:453`; `walkBindings` :708, `listCandidates` :724, `nextCandidate` :755, `retrySameCandidate` :786, `bindingIdentity` :138, `getProviderFamily` :106, `hasUsablePrefer` :68, `poolUnusableReason` :215 | src: `run.mjs:15`, `explain.mjs:7`, `account-rotation.mjs:11`, `dry-bind.mjs:6`, `dispatch/assignment-runner.mjs`, `setup/{blind-steps-proven-pools:13,executor-posture-coverage,model-pool-checks,registrations}.mjs`; 12 test files [P00-C17] | which export each caller uses; tool-executor path inside `prepare` (:234) |
| `rigorToTier` / `DEFAULT_RIGOR_TO_TIER` | `config.mjs:203`, :241, required :1710-1715, shape :1529-1555; **also in the global `~/.fgos/config.json` on both machines** and written by fill-missing (`config.mjs:395-405`) [RT-1, RT-2] | 69 files, 212 hits: src `loop.mjs:1609`, `execution/run.mjs:166`, `bind.mjs:127,151`, `registrations.mjs:508-518,765-789,1438,1468`, `dispatch/cli.mjs:589`, `config.mjs`, `assignment-policy.mjs:253,316`; 62 test files | [RT-16f] classify the 62 test files: **fixture-only** (codemod target) vs **asserts rigor→tier** (hand rewrite), as a list in the report |
| JS model choice [RT-12] | `resolveTierModel` `dispatch/resolve.mjs:183`, `resolveTierCandidates` :140, `tierFallbackOf` :172, `TIER_STRENGTH` `assignment-policy.mjs:30`, `resolveStrongerTier` :107, barrel `src/runner/dispatch.mjs:28,40-41,66-68` | `resolveTierModel` 7 sites: `loop.mjs:1614`, `dispatch/cli.mjs:593`, `assignment-runner.mjs:230`, `assignment-policy.mjs:449`, `model-pool-checks.mjs:209`, `scripts/project-agents.mjs:87`, `bind.mjs:309`; also `dispatch/assignment.mjs:606`, `scripts/project-agents.mjs:36,84-89` | confirm the list, add any miss |
| Effective rigor [RT-13] | computed in Node at `patterns/reviewed.mjs:45,91` (exact key, no prefix), `dispatch/plan.mjs:415`, `dispatch/cli.mjs:576`, `assignment-policy.mjs:287`, `bind.mjs:141-153` | 9+ sites (report §3.4 adds `work-dispatch.mjs:348-365`, `loop.mjs:1608-1609`, `assignment-policy.mjs:382-383`, `feature.yaml:64`, guide floor) [P00-C14] | — |
| `assignment-policy.mjs` (`resolveAssignmentDispatchPolicy` :213) | Work-path tier/model computation | importers: `dispatch/{assignment,assignment-runner,cli,config,plan,recovery,resolve}.mjs`, `dispatch.mjs`, `execution/bind.mjs`; `plan.mjs:118,174,427`; 8 test files | trace what `runUnit` → `executeAssignment` (`run.mjs:856` → `assignment-runner.mjs:1270`) recomputes |
| `attemptProviderCapacityFallback` | `assignment-runner.mjs:1026`, call :1711; uses `dispatch/recovery.mjs:93` `resolveFallback` | 1 caller | entry points reaching :1711 |
| Write-gate replay [RT-5] | recompute at `assignment-runner.mjs:466-500` (`seatRoleOf` :1171, `walkStateOf`); `commit-unit-work.mjs` has no bind | — | exact inputs it reads from `unit.json` |
| Doctor replay [RT-5] | `mutating-assignment-binding-snapshot` (`registrations.mjs:627-691`, registered :1455 [P00-C16]) replays only when `resultData.binding && resultData.role` | 0 of 2,278 results carry `binding`, so it replays nothing today [P00-C1] | count them per workspace; estimated execs if every replay goes through the route |
| `dispatch probe-account` [RT-5] | `dispatch/cli.mjs:1026-1037` calls `executeAssignment` with a pinned account | — | which inputs it needs; stays outside Seat Binding |
| `provider-capacity.mjs` ranking under lock | `acquireProviderAccountLease` :605, rank + `ranked[0]` inside `withProviderStateLock` :623-636; `rankProviderAccounts` :595; per-CLI login filter `inventoryServingCli` | 22 src importers | any host exec while `withProviderStateLock` (:423) is held (it does not call `noteLockHeld` today) |
| `tier-cell.mjs` `parseTierCell` | :25-40, rejects non-strings | `dispatch/config.mjs`, `dispatch/resolve.mjs`, `setup/model-pool-checks.mjs`; 3 tests [P00-C12] | — |
| Role-keyed storage and readers [RT-6] | ledger `role-ledger.mjs:20-34`; known readers: `unit-run-history.mjs:41-63`, `account-rotation.mjs:78`, `unit-sync.mjs:76,109` (role `sync`), `assignment-layout.mjs:50`, `workflow/ref-digests.mjs:116-122`, `case-start.mjs:234-238`, `workflow/runner.mjs:364-372`, `case-admission.mjs:108,173` (not a reader [P00-C8]), `unit-handoff.mjs:74,80,146,391`, `work-dispatch.mjs:379` (not a reader [P00-C8]), `case-projection.mjs:242-246`, `registrations.mjs:638`, `handoff-refs.mjs:12-13`, `unit-summary.mjs:67,84-88`; external readers `packages/run-result/contracts/unit-summary.read.v2.json:55`, `packages/observe/rust/src/metrics_cli/discussions.rs:170` | — | grep every `${role}/`, `unit-run:…/${role}`, `.roles`, `role.role`, `assignmentId.split('/')` across `src bin scripts packages apps`; the complete list is phase 02's work list |
| Role-name branches | `CHECKER_ROLES` `bind.mjs:19-24`; `VALID_CHECKER_ROLES` `config.mjs:257,1383` (used :1350, :1438) and a second checker set at `registrations.mjs:591` [RT-8]; `panel.mjs:26-33`, `debate.mjs:35-43`, `role-tasks.mjs` (~:100), `case-admission-port.mjs` (execution) :17, :66-77 (no role branch; corrected list in report §3.11 [P00-C9]); tester result contract `agent-result-claim-contract.mjs:25-27` | — | — |
| inline-lead path | `bind.mjs:498-516` | 1 | tests expecting inline producers |
| `human-cli` origin and raise doors [RT-11] | synthesised `bin/fgos.mjs:2851,2862,2878,2889`, `unit-handoff.mjs:198`; trusted `bind.mjs:385`; `runUnit` caller doors: `fgos run`, workflow handoff, `work-dispatch.mjs:127`, `operation-choice.mjs:2332`, `fanout-batch.mjs:113`; `--units`/`--unit` source tag `units-source.mjs:97` | — | any other reader of `override.origin`; any other `runUnit` caller |
| bare-verb lookup | `bind.mjs:73-89` (:81) | `registrations.mjs:2654,2668`, `bin/fgos.mjs:2583`, `src/report/capability-plan-lint.mjs:136,143,150` | bare-verb entries per workspace **in both layers**: global has `advise`, `execute`, `review`; which `<prefix>:v` rely on them |
| Unit rigor raising tier today [RT-16d] | `bind.mjs:141-153` (unit rigor via `rigorToTier`); `--rigor`; guide `rigorFloor` `case-start.mjs:52-57`; workflow units with `rigor:` e.g. `architecture-advisory.yaml:62`, `architecture-advisory-reopen.yaml:20` | — | complete list; it goes into the conversion diff and CHANGELOG |
| `agent-definitions.mjs` | `agentTierDirs` :36-54 | `agent-roster.mjs:14`, `bin/fgos.mjs:500`, `run.mjs:31`, `assignment.mjs:49`, `case-start.mjs:19`, `registrations.mjs:42`; 2 tests [P00-C13] | — |
| `workflow/loader.mjs` | flat files only, :72-98 | `registrations.mjs`, `workflow/index.mjs`, `workflow/case-start.mjs`; 4 tests | — |
| `snapshotRunnerConfig` | `run.mjs:161-172` | `operation-choice.mjs`, `workflow/case-start.mjs`, `workflow/runner.mjs` | — |
| Fill-missing writers [RT-2] | `ensureRunnerConfigForDir` (`config.mjs:395-405`; callers `bin/fgos.mjs:457,491`, `bin/fgos-runner.mjs:99`, `dispatch/cli.mjs:388,857,1026`, `run.mjs:162`, `assignment-runner.mjs:1276`, `fanout-batch.mjs:51`); setup `ensureSharedConfigDefaults` (`registrations.mjs:273-283`, `bin/fgos.mjs:4058,4061`) | 14 production callers (adds `bin/fgos.mjs:1250,1287,3982`) [P00-C6] | confirm both write before validating |
| doctor rows (spec §9 step 8) | `runner-rigor-config` :1437, `tier-vocabulary-dead-keys` :1461, `model-policy-tier-coverage` :1467, `executor-family-unique` :1473, `tier-fallback` :1485, `model-policy-pools` :1491, `capability-rigor-ceiling` :1515, `workflow-capabilities-configured` :2681, `workflow-pools-satisfy-independence` :4772, `blind-steps-use-proven-pools` :4781, `executor-posture-coverage` :4790 (all `registrations.mjs`) | — | which read `rigorToTier`, roles or the bare verb |
| `unit.prefer` / `--provider` | `unit.mjs:21-35,293`; `bin/fgos.mjs:489` | — | can a workflow YAML or `--units` file set `prefer` today? |
| `workflow start --seats` | `src/workflow/seats.mjs:124,172`, `seat-providers.mjs` | `case-verbs.mjs`, `case-start.mjs` | keyed by `panelist-N`? |

Also answer:

1. Prior art: `git log -S` for `seat`, `seatId`, `schemaVersion`, `tierCeiling`, `session-lead-inline`, `CHECKER_ROLES` (`abe6f2b3c`), `rigorToTier`, under old executor ids.
2. Core workflows with `pattern: panel|debate` (`architecture-advisory.yaml:36`, `nominal-group.yaml:27`, `group-cognition.yaml:27,38`, `council-lite.yaml:22`, `business-discussion.yaml:36`, `delphi.yaml:31,53`): their `params.members`, `roleTasks` keys, persona use.
3. Baseline exec cost: 50 runs of `$FGOS_HOST_BIN internal identity mint-attempt --attempt x --protocol 1 </dev/null` (p50/p95).
4. **Drain, live** [RT-4]: run the drain predicate read-only on forgentX: `unit.json` with `execution.status` ∈ {running, pending, pending-inline} (no `seatSchema` exists yet, so every one counts) plus controller liveness (6.4 lane's liveness reader); plus workflow runs with unsettled steps or parked gates holding `unit-run:<id>/<role>` refs. Report counts (live vs dead) and, for dead ones, the settling verb that works: `fgos run --resume <unit>` (adopt) or `fgos doctor --fix` (`run-attempts-stuck` → `sweepAttempts`), per the [6.4 plan](../261016-1351-controller-death-settle-and-resume/plan.md). If a dead record has no settling path, say so: it is the plan's reversal trigger (reader shim).
5. **Fence sentinel** [RT-3]: confirm that the pre-wave validator rejects `runner.patterns.seatBinding` (unknown key in `patterns`, `config.mjs:1389-1393`) after merging with the real global file, on copies of all three workspaces' configs; if not, name a strictly validated map that does.

## Steps

1. Re-grep every row; fix stale lines.
2. Fill "Lead adds" with evidence.
3. Answer 1–5.
4. Flag anything that contradicts plan decisions; do not redesign.

## Tests

None. The big lead reads the report before releasing phases 01 and 02.

## Rollback

Nothing to roll back.
