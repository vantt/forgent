# S6a phase 00, facts part A (§1, §2, §6, §10)

Recorded `main` sha: **`f031ab0c8af42a3588cdb19839273a226e275c09`** (2026-11-19T12:04:44+07:00; worktree
`forgent-worktrees/s6-p00`, branch `s6/p00`, = `origin/main`). Every `file:line` below is on this sha. The
integration branch `s6a-execution/integration` does not exist yet (no local or remote ref), so its merge base is not
recorded here; cut it from this sha. Plan base was `b5b237534`; 29 commits touched the five Node paths since then
(`git log b5b237534..f031ab0c8 -- <paths>`), one of which deleted `src/runner/dispatch/usage-parsers.mjs`
(`725522d1e`, usage parsing moved to `fgos-run-result`), so phase 09 no longer ports it.

Commands (rerun by phases 20 and 21):

```
node test/golden-recorders/seam-scan.mjs                 # roots src bin scripts -> count 201, files 62
node test/golden-recorders/seam-scan.mjs test            # count 492, files 190 (8 under test/helpers/)
rg -l -e "src/(runner/execution|run-supervisor|runner/dispatch|verbs/dispatch)/" -e "src/runner/dispatch\.mjs" \
  -e "['\"]runner['\"],\s*['\"](execution|dispatch)['\"]" -e "['\"]run-supervisor['\"]" src bin scripts test
                                                         # 256 files; minus import-hit files and the 31 files inside
                                                         # the deleted paths = 24 string-only files (23 + this scanner)
```

Scanner: `test/golden-recorders/seam-scan.mjs` (plain Node, no deps). It matches `from '...'`, `import '...'`,
`import('...')` in `*.mjs|*.js|*.cjs`, resolves relative specifiers against the importing file's directory, keeps
targets inside `src/runner/execution/`, `src/runner/dispatch/`, `src/run-supervisor/`, `src/verbs/dispatch/`,
`src/runner/dispatch.mjs`, drops importers inside them, and prints `{root, roots, targets, count, files, hits:[{file,
line, specifier, target}]}`. Args: root dirs (default `src bin scripts`), `--repo <dir>`. Done = `count: 0`.
Versus `b5b237534` (197 hits / 60 files; 188 test files): +4 hits / +2 files non-test (new: `src/session-host/head-request.mjs:25-28`,
`src/session-host/head-stop.mjs:10`, both from `c472c1c1d` 2026-11-19; `bin/fgos.mjs:3371` a third `resolveGitRoots`
import), +2 test files.

## §1 Module port map

119 Node files, 34 259 lines (`wc -l`). Target: crate::module (`fgos-execution` pure; `fgos-execution-engine/<module>`;
`fgos-run-supervisor::controller`; host wiring; tier-0 move). "Deletes" = the phase removing the file's last caller.
**Finding D1 (ordering):** 30 files under `src/runner/execution/` and `src/run-supervisor/` (marked "21 (plan: 20 ...)")
are imported, directly or transitively, by Node `src/runner/dispatch/**` and `src/verbs/dispatch/**`, which survive
until phase 21. Evidence: imports `src/runner/dispatch/assignment-runner.mjs:10,13,44,46,47,69,92-96`,
`cli.mjs:14,16,28`, `config.mjs:13-15,27`, `herdr-round.mjs:24,36,43`, `plan.mjs:19-22`,
`reconciliation-planner.mjs:23`, `resolve.mjs:14`, `run-admission.mjs:10,18`, `session-attempt.mjs:14-15`,
`settlement.mjs:24,29`, `tool-providers.mjs:11`, `transport.mjs:35`, `visibility-session.mjs:27`, `worker-home.mjs:41`,
`attention-view.mjs:8-9`, `src/verbs/dispatch/inspect.mjs:10`, `recover.mjs:24,28`, `show-run.mjs:20`; transitive
closure computed from `src/verbs/dispatch/*.mjs`, `src/runner/dispatch/cli.mjs`, `src/runner/dispatch.mjs` (32 files,
2 of them moved by phase 02). Phase 20 as written ("delete `src/runner/execution/**` and `src/run-supervisor/**`")
cannot land while those Node importers exist. The other 23 files (no Node importer left after phase 20's switches)
are deletable in 20.

| Node file:lines | lines | target | ports | deletes |
|---|---|---|---|---|
| `src/run-supervisor/attempt-step.mjs`:1-89 | 89 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 20 |
| `src/run-supervisor/cancel-opt-in.mjs`:1-11 | 11 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 20 |
| `src/run-supervisor/cancel-registry.mjs`:1-135 | 135 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/client.mjs`:1-134 | 134 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/cwd-lock.mjs`:1-99 | 99 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/direct-launch.mjs`:1-456 | 456 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/dispatch-error.mjs`:1-24 | 24 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/gate-kill-grace.mjs`:1-41 | 41 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/payload-root.mjs`:1-52 | 52 | git mv -> src/util/payload-root.mjs (tier-0 move, stays Node) | 2 | 2 (moved, not deleted) |
| `src/run-supervisor/protocol.mjs`:1-8 | 8 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/run-lock.mjs`:1-392 | 392 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/runtime-dir.mjs`:1-111 | 111 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/step-support.mjs`:1-44 | 44 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 20 |
| `src/run-supervisor/steps/cleanup-trust.mjs`:1-37 | 37 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/steps/finalize-home.mjs`:1-20 | 20 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 20 |
| `src/run-supervisor/steps/settle-attempt.mjs`:1-342 | 342 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 20 |
| `src/run-supervisor/stray-writes.mjs`:1-71 | 71 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/trust-store.mjs`:1-688 | 688 | fgos-run-supervisor::controller (run-lock inspection under feature `lease`) | 5 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/run-supervisor/worker-artifacts.mjs`:1-75 | 75 | fgos-execution-engine/steps (host route via attempt_step.rs, P9) | 14 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/dispatch.mjs`:1-9 | 9 | host wiring apps/fgos/src/wiring/dispatch_subs.rs (execute/log tombstones + alias retire) | 21 | 21 |
| `src/runner/dispatch/adapters.mjs`:1-151 | 151 | fgos-execution-engine/transport (inspection half; proposed 11b) | 11 | 21 |
| `src/runner/dispatch/agent-result-claim-contract.mjs`:1-120 | 120 | fgos-execution-engine/run_result | 12 | 21 |
| `src/runner/dispatch/assignment-layout.mjs`:1-116 | 116 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/assignment-normalizer.mjs`:1-188 | 188 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/assignment-runner.mjs`:1-1554 | 1554 | fgos-execution-engine/assignment_runner | 16b | 21 |
| `src/runner/dispatch/assignment.mjs`:1-934 | 934 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/attention-view.mjs`:1-109 | 109 | fgos-execution-engine/transport (inspection half; proposed 11b) | 11 | 21 |
| `src/runner/dispatch/brief.mjs`:1-181 | 181 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/cli.mjs`:1-355 | 355 | host wiring apps/fgos/src/wiring/dispatch_subs.rs (execute/log tombstones + alias retire) | 21 | 21 |
| `src/runner/dispatch/config.mjs`:1-779 | 779 | fgos-execution::runner_config | 6c | 21 |
| `src/runner/dispatch/confinement/attestation-store.mjs`:1-355 | 355 | fgos-execution-engine/confinement/driver | 8 | 21 |
| `src/runner/dispatch/confinement/authority.mjs`:1-1057 | 1057 | fgos-execution-engine/confinement/request | 7b | 21 |
| `src/runner/dispatch/confinement/backend-registry.mjs`:1-378 | 378 | fgos-execution-engine/confinement/driver | 8 | 21 |
| `src/runner/dispatch/confinement/bypass-pairing.mjs`:1-34 | 34 | fgos-execution-engine/confinement/policy | 7 | 21 |
| `src/runner/dispatch/confinement/cleanup.mjs`:1-554 | 554 | fgos-execution-engine/confinement/cleanup | 8b | 21 |
| `src/runner/dispatch/confinement/drivers/bwrap.mjs`:1-762 | 762 | fgos-execution-engine/confinement/driver | 8 | 21 |
| `src/runner/dispatch/confinement/policies.mjs`:1-733 | 733 | fgos-execution-engine/confinement/policy | 7 | 21 |
| `src/runner/dispatch/confinement/probes/harness.mjs`:1-860 | 860 | fgos-execution-engine/confinement/cleanup | 8b | 21 |
| `src/runner/dispatch/confinement/request.mjs`:1-536 | 536 | fgos-execution-engine/confinement/request | 7b | 21 |
| `src/runner/dispatch/confinement/resources.mjs`:1-890 | 890 | fgos-execution-engine/confinement/policy | 7 | 21 |
| `src/runner/dispatch/confinement/workspace-paths.mjs`:1-55 | 55 | fgos-execution-engine/confinement/policy | 7 | 21 |
| `src/runner/dispatch/effective-execution-contract.mjs`:1-535 | 535 | fgos-execution-engine/contract | 13b | 21 |
| `src/runner/dispatch/evidence-attribution.mjs`:1-250 | 250 | fgos-execution-engine/run_result | 12 | 21 |
| `src/runner/dispatch/execution-contract.mjs`:1-424 | 424 | fgos-execution-engine/contract | 13b | 21 |
| `src/runner/dispatch/executor-governance.mjs`:1-81 | 81 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/herdr-round.mjs`:1-631 | 631 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/llm-accounts.mjs`:1-286 | 286 | fgos-execution-engine/accounts | 9 | 21 |
| `src/runner/dispatch/mechanism.mjs`:1-95 | 95 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/operation-prompt-templates.mjs`:1-562 | 562 | fgos-execution-engine/contract | 13b | 21 |
| `src/runner/dispatch/plan.mjs`:1-696 | 696 | fgos-execution-engine/planning | 16 | 21 |
| `src/runner/dispatch/provider-account-probe.mjs`:1-406 | 406 | fgos-execution-engine/accounts | 9 | 21 |
| `src/runner/dispatch/provider-adapter.mjs`:1-337 | 337 | fgos-execution-engine/transport (inspection half; proposed 11b) | 11 | 21 |
| `src/runner/dispatch/provider-capacity.mjs`:1-1040 | 1040 | fgos-execution-engine/accounts | 9 | 21 |
| `src/runner/dispatch/provider-credential-probe.mjs`:1-182 | 182 | fgos-execution-engine/accounts | 9 | 21 |
| `src/runner/dispatch/provider-credential-renewal.mjs`:1-1488 | 1488 | fgos-execution-engine/credentials | 10 | 21 |
| `src/runner/dispatch/provider-session-probe.mjs`:1-151 | 151 | fgos-execution-engine/accounts | 9 | 21 |
| `src/runner/dispatch/reconciliation-planner.mjs`:1-347 | 347 | fgos-execution-engine/planning | 16 | 21 |
| `src/runner/dispatch/recovery-planner.mjs`:1-303 | 303 | fgos-execution-engine/planning | 16 | 21 |
| `src/runner/dispatch/resolve.mjs`:1-362 | 362 | fgos-execution-engine/planning | 16 | 21 |
| `src/runner/dispatch/run-admission.mjs`:1-325 | 325 | fgos-execution-engine/planning | 16 | 21 |
| `src/runner/dispatch/run-result.mjs`:1-1137 | 1137 | fgos-execution-engine/run_result | 12 | 21 |
| `src/runner/dispatch/run-timeout.mjs`:1-21 | 21 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/runner-config-error.mjs`:1-49 | 49 | fgos-execution::runner_config | 6c | 21 |
| `src/runner/dispatch/runtime-inspection.mjs`:1-298 | 298 | fgos-execution-engine/transport (inspection half; proposed 11b) | 11 | 21 |
| `src/runner/dispatch/session-attempt.mjs`:1-160 | 160 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/settlement.mjs`:1-956 | 956 | fgos-execution-engine/settlement | 14 | 21 |
| `src/runner/dispatch/shipped-catalog.mjs`:1-30 | 30 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/stop-processes-inside.mjs`:1-82 | 82 | git mv -> src/native/stop-processes-inside.mjs (tier-0 move, stays Node) | 2 | 2 (moved, not deleted) |
| `src/runner/dispatch/terminal-slot.mjs`:1-103 | 103 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/tier-cell.mjs`:1-64 | 64 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/tool-providers.mjs`:1-130 | 130 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/transport.mjs`:1-300 | 300 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/visibility-session.mjs`:1-283 | 283 | fgos-execution-engine/transport (inspection half; proposed 11b) | 11 | 21 |
| `src/runner/dispatch/work-item-input.mjs`:1-22 | 22 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/dispatch/worker-home.mjs`:1-223 | 223 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/worker-session-boot.mjs`:1-224 | 224 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/worker-session.mjs`:1-112 | 112 | fgos-execution-engine/transport | 11 | 21 |
| `src/runner/dispatch/write-scope.mjs`:1-190 | 190 | fgos-execution-engine/assignment | 13 | 21 |
| `src/runner/execution/account-pin.mjs`:1-52 | 52 | fgos-execution-engine/accounts | 9 | 20 |
| `src/runner/execution/account-rotation.mjs`:1-148 | 148 | fgos-execution-engine/accounts | 9 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/bind.mjs`:1-159 | 159 | fgos-execution-engine/unit_run | 18 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/capability-config.mjs`:1-157 | 157 | git mv -> src/runner/capability-config.mjs (tier-0 move, stays Node) | 2 | 2 (moved, not deleted) |
| `src/runner/execution/case-admission-port.mjs`:1-144 | 144 | fgos-execution::admission (trait+shapes; adapter = engine unit_run peer, 18) | 6b | 20 |
| `src/runner/execution/case-run-paths.mjs`:1-32 | 32 | fgos-execution::case_paths | 6b | 20 |
| `src/runner/execution/commit-unit-work.mjs`:1-227 | 227 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/custody-door.mjs`:1-119 | 119 | fgos-execution-engine/unit_run (custody/verify/remove); judgements custodyHeld, unitRunFacts, judgeUnitRun -> fgos-execution::run_facts (6c, addon) | 18 | 20 |
| `src/runner/execution/dry-bind.mjs`:1-72 | 72 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/handoff-refs.mjs`:1-290 | 290 | fgos-execution::handoff | 6b | 20 |
| `src/runner/execution/legacy-seat-read.mjs`:1-172 | 172 | fgos-execution::seat_resolver | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/debate.mjs`:1-116 | 116 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/history-outcome.mjs`:1-67 | 67 | fgos-execution::loops | 6b | 20 |
| `src/runner/execution/loops/index.mjs`:1-83 | 83 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/panel.mjs`:1-99 | 99 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/reviewed.mjs`:1-272 | 272 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/role-tasks.mjs`:1-112 | 112 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/solo.mjs`:1-63 | 63 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/loops/verify.mjs`:1-49 | 49 | fgos-execution::loops | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/outcome.mjs`:1-115 | 115 | fgos-execution::outcome | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/partial-writes.mjs`:1-44 | 44 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/patterns/catalog-entries.mjs`:1-494 | 494 | fgos-execution::patterns | 6 | 20 |
| `src/runner/execution/patterns/catalog.mjs`:1-415 | 415 | fgos-execution::patterns | 6 | 20 |
| `src/runner/execution/patterns/retired-keys.mjs`:1-116 | 116 | fgos-execution::patterns | 6 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/run-request.mjs`:1-373 | 373 | fgos-execution::run_request | 6 | 20 |
| `src/runner/execution/run.mjs`:1-1026 | 1026 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/seat-ledger.mjs`:1-79 | 79 | fgos-execution::seat_resolver | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/seat-resolver.mjs`:1-380 | 380 | fgos-execution::seat_resolver | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/unit-control.mjs`:1-29 | 29 | fgos-execution::unit_record (pure part; IO in engine unit_run) | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/unit-run-history.mjs`:1-112 | 112 | fgos-execution-engine/unit_run | 18 | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/unit-run-record.mjs`:1-97 | 97 | fgos-execution-engine/unit_run (custody/verify/remove); judgements custodyHeld, unitRunFacts, judgeUnitRun -> fgos-execution::run_facts (6c, addon) | 18 | 20 |
| `src/runner/execution/unit-run-start.mjs`:1-516 | 516 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/unit-state.mjs`:1-70 | 70 | fgos-execution::unit_record (pure part; IO in engine unit_run) | 6b | 21 (plan: 20; still imported by Node dispatch subs until 21) |
| `src/runner/execution/unit-summary.mjs`:1-219 | 219 | fgos-execution::unit_record (pure part; IO in engine unit_run) | 6b | 20 |
| `src/runner/execution/unit-sync.mjs`:1-157 | 157 | fgos-execution-engine/unit_run | 18 | 20 |
| `src/runner/execution/unit.mjs`:1-321 | 321 | fgos-execution::unit | 6 | 20 |
| `src/verbs/dispatch/inspect.mjs`:1-105 | 105 | host wiring apps/fgos/src/wiring/dispatch_subs.rs | 21 | 21 |
| `src/verbs/dispatch/reconcile.mjs`:1-100 | 100 | host wiring apps/fgos/src/wiring/dispatch_subs.rs | 21 | 21 |
| `src/verbs/dispatch/recover.mjs`:1-299 | 299 | host wiring apps/fgos/src/wiring/dispatch_subs.rs | 21 | 21 |
| `src/verbs/dispatch/show-run.mjs`:1-225 | 225 | host wiring apps/fgos/src/wiring/dispatch_subs.rs | 21 | 21 |
| `src/verbs/dispatch/watch.mjs`:1-110 | 110 | host wiring apps/fgos/src/wiring/dispatch_subs.rs | 21 | 21 |

Per porting phase (current lines; the 2 500-line rule, P20):

| phase | files | Node lines | flag |
|---|---|---|---|
| 2 | 3 | 291 |  |
| 5 | 11 | 2099 |  |
| 6 | 5 | 1719 |  |
| 6b | 18 | 2391 |  |
| 6c | 2 | 828 |  |
| 7 | 4 | 1712 |  |
| 7b | 2 | 1593 |  |
| 8 | 3 | 1495 |  |
| 8b | 2 | 1414 |  |
| 9 | 7 | 2265 |  |
| 10 | 1 | 1488 |  |
| 11 | 13 | 3026 | **over 2 500** |
| 12 | 3 | 1507 |  |
| 13 | 11 | 1957 |  |
| 13b | 3 | 1521 |  |
| 14 | 8 | 1634 |  |
| 16 | 5 | 2033 |  |
| 16b | 1 | 1554 |  |
| 18 | 10 | 2529 | **over 2 500** |
| 21 | 7 | 1203 |  |

Over the rule:

- **Phase 11 (3 026 lines, 13 files).** Plan counted about 2 500 without `runtime-inspection.mjs`, `attention-view.mjs`
  and `mechanism.mjs` sizes. Split by file: **11** session launch = `transport.mjs` 300, `herdr-round.mjs` 631,
  `worker-session.mjs` 112, `worker-session-boot.mjs` 224, `terminal-slot.mjs` 103, `worker-home.mjs` 223,
  `session-attempt.mjs` 160, `mechanism.mjs` 95 = 1 848; **11b** run inspection = `visibility-session.mjs` 283,
  `runtime-inspection.mjs` 298, `attention-view.mjs` 109, `adapters.mjs` 151, `provider-adapter.mjs` 337 = 1 178
  (engine module `transport/inspect`, wave 3, depends on 3; consumers: `src/verbs/state/read.mjs:5`, dispatch
  `inspect`/`watch`/`show-run`, doctor `terminal-control-checks.mjs:13`).
- **Phase 18 (2 529 lines, 10 files)** once `bind.mjs` (159) is counted; phase 18's text lists 9 files and omits it
  (it is the facade every seat bind goes through: `src/runner/execution/bind.mjs:1-6`). Split by file: move `bind.mjs`
  and `dry-bind.mjs` (231) to **phase 16** (`planning/bind_facade`; `plan.mjs:22` already imports `bindWorkSeat`,
  `viaSeatRoute` from it), giving 16 = 2 264, 18 = 2 298.
- Near the limit: 6b 2 391 (18 files; `resources.mjs` grew 741 -> 890 so phase 7 is 1 712 not 1 536); 9 = 2 265 after
  `usage-parsers.mjs` left.

## §2 Consumer census (seam)

Non-test import hits: **201 hits in 62 files** (`node test/golden-recorders/seam-scan.mjs`). Classes (rule: target
moved by phase 02 -> `move-down`; `scripts/` -> `script`; `src/setup/**` -> `row` (15 for confinement and credential
copy imports, else 17), except `doctor-bridge.mjs` (bridge, not a row); `runUnit`, `launchSessionAttempt`,
`sweepAttempts`, `requestCancel`, `runUnderCustody`/`runVerify` -> `host` op; `custodyHeld`/`unitRunFacts`/`judgeUnitRun`
-> `addon` (P15); config loader and `RunnerConfigError` -> `addon` (6c); `bin/fgos.mjs` dispatch arms -> `host` 21,
run arm -> `host` 19; helper used by exactly one outside Node layer -> `move-up?`; otherwise `addon`):

| class | hits |
|---|---|
| addon | 74 |
| move-up? | 46 |
| row | 39 |
| host | 23 |
| move-down | 13 |
| script | 6 |
| **total** | **201** |

`move-up?` is provisional: by design principle 7 a helper whose Rust port (column "ports" in §1) keeps the same rule
must be served by the addon (one source), and `git mv` up is right only where the Rust port drops it. Phase 20 decides
each row against the ported module; the rows are listed so none is missed.

Known misses of the old scan, confirmed on `f031ab0c8`:

| old cite (`b5b237534`) | now | specifier |
|---|---|---|
| `src/runner/{operation-choice,fanout-batch,work-compat,operation-capability,loop,agent-definitions}.mjs` | `operation-choice.mjs:20-28`, `fanout-batch.mjs:3-6`, `work-compat.mjs:14`, `operation-capability.mjs:4`, `loop.mjs:83,102,103`, `agent-definitions.mjs:21` | all present |
| `src/session-host/head-start.mjs:108,121,126` | `:121` (`bind`), `:135` (`launchSessionAttempt`), `:140` (`loadRunnerConfigForDir`) | dynamic |
| `scripts/record-mailbox-hook-fixtures.mjs:1188` | `:1188` | `worker-session-boot.mjs` |
| `bin/fgos.mjs:2127` | `:2118` | `dispatch/config.mjs` (`parseRunTimeout`) |
| `bin/fgos.mjs:2314` | `:2274` | `execution/capability-config.mjs` |
| `bin/fgos.mjs:3450` | `:3371` and `:3418` (one new) | `execution/run.mjs` (`resolveGitRoots`) |
| `bin/fgos.mjs:3687` | `:3636` | `dispatch/adapters.mjs` |
| `bin/fgos.mjs:3775` | `:3724` | `run-supervisor/dispatch-error.mjs` |

Also `bin/fgos.mjs:2499,2504` (Workflow `confinedWriteRefusal`/`activityUnitOf` injection, old `:2544`), `:2372-2384`
(dispatch cli and run), `:2497-2498` (run arm).

Non-test files outside every phase footprint (plan-level footprint too, unless noted):

- `src/session-host/head-request.mjs:25-28` (addon x2, `move-up?`, addon P15) and `src/session-host/head-stop.mjs:10`
  (`host cancel`). Not in the plan footprint; the collision table says "`src/session-host/head-request*.mjs`: S6a does
  not edit them" (plan.md collision row), which no longer holds.
- String hits: `src/report/authoritative-match.mjs:11` and `src/runner/agent-roster.mjs:3` (comments naming
  `src/runner/dispatch.mjs` / `dispatch/cli.mjs`), `scripts/git/e3-bench.mjs:297` (`baselinePath` =
  `src/runner/execution/commit-unit-work.mjs`), `scripts/check-decision-citation-drift.baseline.json:37` (cites
  `src/runner/dispatch/confinement/resources.mjs`).
- `src/portfolio/open-questions.mjs` (plan and phase 20 footprint) no longer exists (`1cabfe384`, questions verb over
  the owner-question store); drop it.

Non-test hits:

| file:line | target | symbols | class | owner phase |
|---|---|---|---|---|
| `bin/fgos-runner.mjs:25` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `bin/fgos.mjs:51` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config door) | 21 |
| `bin/fgos.mjs:52` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config door) | 21 |
| `bin/fgos.mjs:57` | `run-supervisor/cancel-opt-in.mjs` | enableCancelOnSignal | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:87` | `verbs/dispatch/show-run.mjs` | showRunUseCase | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:88` | `verbs/dispatch/inspect.mjs` | invokeDispatchInspectOperation | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:89` | `verbs/dispatch/reconcile.mjs` | invokeDispatchReconcileOperation | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:90` | `verbs/dispatch/watch.mjs` | watchRunUseCase | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:91` | `verbs/dispatch/recover.mjs` | recoverObserveUseCase, recoverApplyUseCase | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:2118` | `runner/dispatch/config.mjs` | parseRunTimeout | addon (config door) | 21 |
| `bin/fgos.mjs:2274` | `runner/execution/capability-config.mjs` | capabilityDescriptionOf | move-down | 2 |
| `bin/fgos.mjs:2372` | `runner/dispatch/cli.mjs` | retiredDispatchDoorMessage | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:2377` | `runner/dispatch/cli.mjs` | runDispatchCli | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:2383` | `runner/dispatch/cli.mjs` | runDispatchCli | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:2384` | `runner/execution/run.mjs` | runUnit | host (fgos run native) | 19 |
| `bin/fgos.mjs:2497` | `runner/execution/run.mjs` | runUnit, resolveGitRoots | host (fgos run native) | 19 |
| `bin/fgos.mjs:2498` | `runner/execution/run-request.mjs` | buildRunRequest | host (fgos run native) | 19 |
| `bin/fgos.mjs:3371` | `runner/execution/run.mjs` | resolveGitRoots | addon | 21 |
| `bin/fgos.mjs:3418` | `runner/execution/run.mjs` | resolveGitRoots | addon | 21 |
| `bin/fgos.mjs:3636` | `runner/dispatch/adapters.mjs` | currentDispatchDepth | host (native dispatch verb) | 21 |
| `bin/fgos.mjs:3724` | `run-supervisor/dispatch-error.mjs` | DispatchError | host (native dispatch verb) | 21 |
| `scripts/backfill-unit-summaries.mjs:13` | `runner/execution/case-run-paths.mjs` | runsRoot | script | 20 |
| `scripts/backfill-unit-summaries.mjs:16` | `runner/execution/unit-summary.mjs` | buildUnitSummary, readStoredUnitSummary, serializeUnitSummary, unitSummarySkipReason, writ | script | 20 |
| `scripts/lib/mailbox-live-confined.mjs:36` | `runner/dispatch/confinement/drivers/bwrap.mjs` | prepareBwrapSync | script | 20 |
| `scripts/lib/mailbox-live-confined.mjs:37` | `runner/dispatch/confinement/resources.mjs` | resolveConfinementResources | script | 20 |
| `scripts/lib/mailbox-live-confined.mjs:38` | `runner/dispatch/provider-credential-renewal.mjs` | DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS, readCredentialExpiry | script | 20 |
| `scripts/lib/test-file-watchdog.mjs:28` | `runner/dispatch/stop-processes-inside.mjs` | stopProcessesInside | move-down | 2 |
| `scripts/record-mailbox-hook-fixtures.mjs:1188` | `runner/dispatch/worker-session-boot.mjs` | ensureWorkerSession | script | 20 |
| `scripts/run-rust-dev-host.mjs:9` | `runner/dispatch/stop-processes-inside.mjs` | processesInside | move-down | 2 |
| `scripts/run-tests.mjs:31` | `runner/dispatch/stop-processes-inside.mjs` | processesInside, stopProcessesInside | move-down | 2 |
| `src/cli/verb-exit.mjs:4` | `runner/execution/outcome.mjs` | exitCodeForOutcome | addon | 20 |
| `src/event-store/consumers.mjs:5` | `run-supervisor/payload-root.mjs` | OWN_PAYLOAD_ROOT | move-down | 2 |
| `src/native/door.mjs:7` | `run-supervisor/payload-root.mjs` | OWN_PAYLOAD_ROOT, releasePayloadManifest | move-down | 2 |
| `src/report/capability-plan-lint.mjs:6` | `runner/execution/unit.mjs` | validateUnit | addon | 20 |
| `src/report/capability-plan-lint.mjs:7` | `runner/dispatch/tool-providers.mjs` | unservedToolAbilityOf | addon | 20 |
| `src/report/capability-plan-lint.mjs:8` | `runner/dispatch/shipped-catalog.mjs` | shippedCatalog | addon | 20 |
| `src/report/capability-plan-lint.mjs:9` | `runner/execution/patterns/retired-keys.mjs` | RESERVED_PATTERN_NAMES | move-up? -> src/report | 20 |
| `src/runner/agent-definitions.mjs:21` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/runner/fanout-batch.mjs:3` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/runner/fanout-batch.mjs:5` | `runner/dispatch/plan.mjs` | compileDispatchPlan | move-up? -> work | 20 |
| `src/runner/fanout-batch.mjs:6` | `runner/execution/run.mjs` | runUnit | host run-unit | 20 |
| `src/runner/loop.mjs:83` | `runner/execution/bind.mjs` | bind | addon (seat-binding client) | 20 |
| `src/runner/loop.mjs:102` | `runner/dispatch/run-result.mjs` | runOutcome | move-up? -> work | 20 |
| `src/runner/loop.mjs:103` | `run-supervisor/client.mjs` | sweepAttempts | host sweep-attempts | 20 |
| `src/runner/operation-capability.mjs:4` | `runner/execution/capability-config.mjs` | hasCapabilityEntry | move-down | 2 |
| `src/runner/operation-choice.mjs:20` | `runner/dispatch/assignment.mjs` | isReadOnlyAssignment, validateAgentResultClaim | move-up? -> work | 20 |
| `src/runner/operation-choice.mjs:21` | `runner/dispatch/assignment-runner.mjs` | isSubstantiveReportText, resolveRunWorkerArtifactPath | move-up? -> work | 20 |
| `src/runner/operation-choice.mjs:22` | `runner/execution/run.mjs` | runUnit | host run-unit | 20 |
| `src/runner/operation-choice.mjs:23` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/runner/operation-choice.mjs:25` | `runner/dispatch/run-result.mjs` | interpretRunResult, runOutcome | move-up? -> work | 20 |
| `src/runner/operation-choice.mjs:26` | `runner/dispatch/assignment-normalizer.mjs` | stampDeclaredAssignment | move-up? -> work | 20 |
| `src/runner/operation-choice.mjs:28` | `runner/dispatch/assignment-layout.mjs` | assignmentDir, listAssignmentRuns | addon | 20 |
| `src/runner/work-compat.mjs:14` | `runner/dispatch/resolve.mjs` | resolveCapabilityDetailsFromHints | move-up? -> work | 20 |
| `src/runner/work-dispatch.mjs:15` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/runner/work-dispatch.mjs:17` | `runner/dispatch/assignment-normalizer.mjs` | stampDeclaredAssignment | move-up? -> work | 20 |
| `src/runner/work-dispatch.mjs:19` | `runner/dispatch/resolve.mjs` | resolveExecutorConfig | move-up? -> work | 20 |
| `src/runner/work-dispatch.mjs:20` | `runner/dispatch/plan.mjs` | purposeSeatOf | move-up? -> work | 20 |
| `src/runner/work-dispatch.mjs:21` | `run-supervisor/dispatch-error.mjs` | DispatchError | addon | 20 |
| `src/runner/work-dispatch.mjs:22` | `runner/dispatch/cli.mjs` | resolveAgentTypeForTaskSpec, watchWritesOutsideWorkspace, strayWriteWarning | addon | 20 |
| `src/runner/work-dispatch.mjs:23` | `runner/execution/run.mjs` | runUnit, resolveGitRoots | host run-unit | 20 |
| `src/runner/work-dispatch.mjs:28` | `runner/dispatch/transport.mjs` | captureDispatchAttestation | move-up? -> work | 20 |
| `src/runner/work-dispatch.mjs:29` | `runner/dispatch/settlement.mjs` | safeGitHead | move-up? -> work | 20 |
| `src/seat-binding/client.mjs:21` | `run-supervisor/payload-root.mjs` | OWN_PAYLOAD_ROOT, releasePayloadRoot, realpathOrNull | move-down | 2 |
| `src/session-host/head-request.mjs:25` | `runner/dispatch/assignment-layout.mjs` | assignmentDir | addon | 20 |
| `src/session-host/head-request.mjs:26` | `runner/dispatch/write-scope.mjs` | canonicalizeWriteEntry, matchesWriteScope | addon | 20 |
| `src/session-host/head-request.mjs:27` | `runner/execution/unit-summary.mjs` | readStoredUnitSummary | move-up? -> session | 20 |
| `src/session-host/head-request.mjs:28` | `runner/execution/unit-run-record.mjs` | unitRunFacts | addon (P15 read) | 20 |
| `src/session-host/head-start.mjs:121` | `runner/execution/bind.mjs` | bind | addon (seat-binding client) | 20 |
| `src/session-host/head-start.mjs:135` | `runner/dispatch/session-attempt.mjs` | launchSessionAttempt | host launch-session | 20 |
| `src/session-host/head-start.mjs:140` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/session-host/head-stop.mjs:10` | `run-supervisor/cancel-registry.mjs` | requestCancel | host cancel | 20 |
| `src/session-rotation/rotate.mjs:27` | `run-supervisor/cancel-registry.mjs` | requestCancel | host cancel | 20 |
| `src/session-rotation/rotate.mjs:33` | `runner/dispatch/confinement/authority.mjs` | seatSessionDir | move-up? -> session | 20 |
| `src/setup/agent-cli-trust.mjs:17` | `run-supervisor/trust-store.mjs` | readCodexTrust, readAgyTrust, defaultAgySettingsPath | row | 17 |
| `src/setup/blind-steps-proven-pools.mjs:13` | `runner/execution/bind.mjs` | explainSeat | row | 17 |
| `src/setup/blind-steps-proven-pools.mjs:14` | `runner/execution/dry-bind.mjs` | simulateUnitBindings | row | 17 |
| `src/setup/doctor-bridge.mjs:174` | `runner/execution/case-run-paths.mjs` | (module) | addon | 20 |
| `src/setup/executor-profile-warnings.mjs:12` | `runner/dispatch/provider-adapter.mjs` | familyOf, extractPolicyShapedFlags | row | 17 |
| `src/setup/executor-profile-warnings.mjs:13` | `runner/dispatch/tool-providers.mjs` | forEntriesOf, servedCapabilitiesOf | row | 17 |
| `src/setup/executor-profile-warnings.mjs:14` | `runner/execution/capability-config.mjs` | hasOwnPreferPool | move-down | 2 |
| `src/setup/model-pool-checks.mjs:7` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir, MODEL_POLICY_TIERS | row | 17 |
| `src/setup/model-pool-checks.mjs:8` | `runner/dispatch/provider-adapter.mjs` | familyOf | row | 17 |
| `src/setup/model-pool-checks.mjs:9` | `runner/dispatch/tier-cell.mjs` | parseTierCell | row | 17 |
| `src/setup/model-pool-checks.mjs:10` | `runner/dispatch/llm-accounts.mjs` | readLlmAccounts, deriveLegacyInventory | row | 17 |
| `src/setup/registrations.mjs:30` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | row | 17 |
| `src/setup/registrations.mjs:31` | `runner/dispatch/llm-accounts.mjs` | defaultLoginHomeStores | row | 17 |
| `src/setup/registrations.mjs:34` | `runner/dispatch/assignment-layout.mjs` | isWithinDir | row | 17 |
| `src/setup/registrations.mjs:48` | `runner/dispatch/confinement/policies.mjs` | BUILTIN_POLICY_IDS, validateConfinementPolicyShape, normalizeLegacyConfinement | row | 15 (+17 for account rows) |
| `src/setup/registrations.mjs:56` | `runner/dispatch/confinement/backend-registry.mjs` | (module) | row | 15 (+17 for account rows) |
| `src/setup/registrations.mjs:57` | `runner/dispatch/confinement/probes/harness.mjs` | runAllConfinementProbes, probePeerRunHidden | row | 15 (+17 for account rows) |
| `src/setup/registrations.mjs:58` | `runner/dispatch/confinement/cleanup.mjs` | readAttemptOwnershipMarker, canonicalRoot, listKeptCredentialHomes, settleHeldCredentialHo | row | 15 (+17 for account rows) |
| `src/setup/registrations.mjs:60` | `runner/dispatch/config.mjs` | MODEL_POLICY_TIERS, validateRunnerLoopsShape, attributeRunnerConfigError | row | 17 |
| `src/setup/registrations.mjs:61` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | row | 17 |
| `src/setup/registrations.mjs:62` | `runner/dispatch/shipped-catalog.mjs` | shippedCatalog | row | 17 |
| `src/setup/registrations.mjs:63` | `runner/execution/patterns/catalog.mjs` | checkCatalog | row | 17 |
| `src/setup/registrations.mjs:64` | `runner/execution/patterns/catalog-entries.mjs` | deepEqual | row | 17 |
| `src/setup/registrations.mjs:65` | `runner/execution/patterns/retired-keys.mjs` | detectRetiredPatternKeys, RESERVED_PATTERN_NAMES, SEAT_BINDING_MARKER_PATH, formatRetiredK | row | 17 |
| `src/setup/registrations.mjs:69` | `runner/execution/capability-config.mjs` | capabilityConfinementOf, capabilityNamesOf, catalogOf, hasCapabilityEntry, ownMinCheckersO | move-down | 2 |
| `src/setup/registrations.mjs:75` | `runner/dispatch/tool-providers.mjs` | unservedToolAbilityOf | row | 17 |
| `src/setup/registrations.mjs:78` | `runner/dispatch/llm-accounts.mjs` | legacyStateKey | row | 17 |
| `src/setup/registrations.mjs:79` | `runner/dispatch/provider-capacity.mjs` | inspectProviderCapacity, defaultProviderCapacityRuntimeDir, providerAccountInventory, cred | row | 17 |
| `src/setup/registrations.mjs:80` | `runner/dispatch/provider-credential-renewal.mjs` | inspectRetainedCredentialCopies, inspectPendingCopiesOverLimit, sweepInterruptedStagings,  | row | 15 (+17 for account rows) |
| `src/setup/registrations.mjs:81` | `runner/dispatch/transport.mjs` | resolveHerdrBin | row | 17 |
| `src/setup/registrations.mjs:83` | `run-supervisor/trust-store.mjs` | readCodexTrust, readAgyStore, defaultAgySettingsPath, operatorClaudeStorePath | row | 17 |
| `src/setup/registrations.mjs:85` | `runner/dispatch/operation-prompt-templates.mjs` | discoverProjectPromptTemplates, TemplateResolutionError | row | 17 |
| `src/setup/run-supervisor-checks.mjs:19` | `run-supervisor/protocol.mjs` | RUN_SUPERVISOR_PROTOCOL as PROTOCOL | row | 17 |
| `src/setup/run-supervisor-checks.mjs:20` | `run-supervisor/runtime-dir.mjs` | resolveRuntimeSocketDir, ensureRuntimeSocketDir, RuntimeDirError, SOCKET_PATH_MAX_BYTES, S | row | 17 |
| `src/setup/run-supervisor-checks.mjs:21` | `run-supervisor/client.mjs` | adoptScan | row | 17 |
| `src/setup/run-supervisor-checks.mjs:22` | `run-supervisor/gate-kill-grace.mjs` | GATE_KILL_GRACE_KEY, readDispatchConfig, resolveGateKillGrace, CANCEL_WAIT_KEY, resolveCan | row | 17 |
| `src/setup/seat-binding-checks.mjs:3` | `runner/execution/bind.mjs` | bind | row | 17 |
| `src/setup/seat-binding-checks.mjs:4` | `runner/execution/dry-bind.mjs` | simulateUnitBindings | row | 17 |
| `src/setup/seat-binding-checks.mjs:5` | `runner/execution/capability-config.mjs` | capabilityNamesOf, hasOwnPreferPool, preferOf | move-down | 2 |
| `src/setup/seat-binding-checks.mjs:6` | `runner/execution/patterns/catalog.mjs` | resolveCollaboration, loopOf | row | 17 |
| `src/setup/seat-binding-checks.mjs:7` | `runner/dispatch/shipped-catalog.mjs` | shippedCatalog | row | 17 |
| `src/setup/session-keep-declared.mjs:5` | `runner/dispatch/provider-capacity.mjs` | credentialStoreOf | row | 17 |
| `src/setup/terminal-control-checks.mjs:13` | `runner/dispatch/transport.mjs` | resolveHerdrBin | row | 17 |
| `src/verbs/state/read.mjs:5` | `runner/dispatch/visibility-session.mjs` | findRunningRuns, classifyRunOutcome, reconcileRun | move-up? -> src/verbs | 20 |
| `src/workflow/case-admission-port.mjs:25` | `runner/dispatch/adapters.mjs` | CASE_ID_ENV, CASE_RESERVATION_ENV, currentDispatchDepth | addon | 20 |
| `src/workflow/case-admission-port.mjs:26` | `runner/execution/legacy-seat-read.mjs` | seatKeyOf | move-up? -> workflow | 20 |
| `src/workflow/case-admission-port.mjs:27` | `runner/execution/outcome.mjs` | isVerdict | addon | 20 |
| `src/workflow/case-admission-port.mjs:28` | `runner/execution/case-run-paths.mjs` | isCaseId, runDirOf | move-up? -> workflow | 20 |
| `src/workflow/case-admission-port.mjs:244` | `runner/execution/case-admission-port.mjs` | import('../runner/execution/case-admission-port.mjs').CaseAdmissionPort | move-up? -> workflow | 20 |
| `src/workflow/case-admission.mjs:11` | `runner/dispatch/write-scope.mjs` | canonicalizeWrites, writeScopesOverlap | addon | 20 |
| `src/workflow/case-bindings.mjs:17` | `runner/dispatch/adapters.mjs` | currentDispatchDepth | addon | 20 |
| `src/workflow/case-bindings.mjs:18` | `runner/execution/custody-door.mjs` | custodyHeld, worktreeKey | addon (P15 read) | 20 |
| `src/workflow/case-bindings.mjs:22` | `runner/execution/case-run-paths.mjs` | runsRoot | move-up? -> workflow | 20 |
| `src/workflow/case-close.mjs:15` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-close.mjs:16` | `runner/execution/case-run-paths.mjs` | isCaseId, runDirOf, runsRoot | move-up? -> workflow | 20 |
| `src/workflow/case-close.mjs:17` | `runner/execution/unit-run-record.mjs` | judgeUnitRun, removeUnitRun | addon (P15 read) | 20 |
| `src/workflow/case-frame.mjs:9` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-gate.mjs:15` | `runner/dispatch/config.mjs` | assertRunTimeoutMs, loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/workflow/case-gate.mjs:16` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-gate.mjs:17` | `runner/execution/custody-door.mjs` | answerOfVerify, outcomeOfVerify, runUnderCustody, runVerify | host custody/verify | 20 |
| `src/workflow/case-gate.mjs:18` | `runner/execution/loops/verify.mjs` | verifyCommandOf, verifySeatResult | move-up? -> workflow | 20 |
| `src/workflow/case-gate.mjs:19` | `runner/execution/outcome.mjs` | evaluationsOf | addon | 20 |
| `src/workflow/case-gate.mjs:20` | `runner/execution/case-admission-port.mjs` | CaseAdmissionRefusedError | move-up? -> workflow | 20 |
| `src/workflow/case-inherit.mjs:16` | `runner/execution/case-run-paths.mjs` | runsRoot | move-up? -> workflow | 20 |
| `src/workflow/case-inherit.mjs:17` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-lock.mjs:7` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-lock.mjs:8` | `runner/execution/case-run-paths.mjs` | runDirOf | move-up? -> workflow | 20 |
| `src/workflow/case-projection.mjs:11` | `runner/execution/outcome.mjs` | NOT_STARTED_OUTCOME | addon | 20 |
| `src/workflow/case-runtime.mjs:12` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-runtime.mjs:13` | `runner/execution/custody-door.mjs` | custodyHeld | addon (P15 read) | 20 |
| `src/workflow/case-runtime.mjs:14` | `runner/execution/case-run-paths.mjs` | gateAnswerFile, runDirOf | move-up? -> workflow | 20 |
| `src/workflow/case-runtime.mjs:15` | `runner/execution/unit-run-record.mjs` | unitRunFacts | addon (P15 read) | 20 |
| `src/workflow/case-runtime.mjs:16` | `runner/execution/case-admission-port.mjs` | releasedUnitRunSettle | move-up? -> workflow | 20 |
| `src/workflow/case-runtime.mjs:17` | `runner/execution/outcome.mjs` | NOT_STARTED_OUTCOME | addon | 20 |
| `src/workflow/case-start.mjs:13` | `runner/execution/run.mjs` | snapshotRunnerConfig, resolveGitRoots, assertRepositoryForWrites, detectHerdrPresent | addon | 20 |
| `src/workflow/case-start.mjs:14` | `runner/execution/dry-bind.mjs` | simulateUnitBindings | move-up? -> workflow | 20 |
| `src/workflow/case-start.mjs:15` | `runner/execution/patterns/catalog.mjs` | loopOf, resolveCollaboration | move-up? -> workflow | 20 |
| `src/workflow/case-start.mjs:16` | `runner/dispatch/shipped-catalog.mjs` | shippedCatalog | addon | 20 |
| `src/workflow/case-start.mjs:20` | `runner/dispatch/config.mjs` | assertReasoningEffort, loadRunnerConfigForDir, parseRunTimeout, assertRunTimeoutMs | addon (config, 6c) | 20 |
| `src/workflow/case-start.mjs:21` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-start.mjs:22` | `runner/dispatch/provider-capacity.mjs` | providerAccountInventory | move-up? -> workflow | 20 |
| `src/workflow/case-start.mjs:23` | `runner/dispatch/llm-accounts.mjs` | legacyStateKey | move-up? -> workflow | 20 |
| `src/workflow/case-start.mjs:24` | `runner/execution/account-pin.mjs` | parseAccountPin | move-up? -> workflow | 20 |
| `src/workflow/case-start.mjs:25` | `runner/execution/unit.mjs` | normalizeStanceOptions | addon | 20 |
| `src/workflow/case-start.mjs:26` | `runner/execution/run-request.mjs` | existingPlanRef, planFromFlags | addon | 20 |
| `src/workflow/case-verbs.mjs:11` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/case-verbs.mjs:12` | `runner/execution/run.mjs` | resolveGitRoots | addon | 20 |
| `src/workflow/case-verbs.mjs:13` | `runner/execution/case-run-paths.mjs` | runDirOf | move-up? -> workflow | 20 |
| `src/workflow/case-verbs.mjs:26` | `runner/dispatch/adapters.mjs` | currentDispatchDepth | addon | 20 |
| `src/workflow/checked.mjs:5` | `runner/dispatch/config.mjs` | MODEL_POLICY_TIERS | addon (config, 6c) | 20 |
| `src/workflow/checked.mjs:6` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/checked.mjs:7` | `runner/execution/seat-resolver.mjs` | checkDeclaredSeats, assertNoSeatTier, assertNoUnitTier | move-up? -> workflow | 20 |
| `src/workflow/definition.mjs:8` | `runner/dispatch/write-scope.mjs` | canonicalizeWrites | addon | 20 |
| `src/workflow/definition.mjs:9` | `runner/dispatch/run-timeout.mjs` | runTimeoutProblem | move-up? -> workflow | 20 |
| `src/workflow/definition.mjs:10` | `runner/execution/outcome.mjs` | isVerdict | addon | 20 |
| `src/workflow/legacy-ledger-read.mjs:7` | `runner/execution/outcome.mjs` | infrastructure | addon | 20 |
| `src/workflow/loader.mjs:9` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/loader.mjs:12` | `run-supervisor/payload-root.mjs` | OWN_PAYLOAD_ROOT | move-down | 2 |
| `src/workflow/propose-classify.mjs:18` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/propose-classify.mjs:19` | `runner/dispatch/write-scope.mjs` | canonicalizeWriteEntry, globsMeet | addon | 20 |
| `src/workflow/propose-frame.mjs:11` | `runner/execution/patterns/catalog.mjs` | resolveCollaboration | move-up? -> workflow | 20 |
| `src/workflow/propose-validate.mjs:16` | `runner/dispatch/tool-providers.mjs` | unservedToolAbilityOf | addon | 20 |
| `src/workflow/propose-validate.mjs:17` | `runner/dispatch/write-scope.mjs` | globsMeet | addon | 20 |
| `src/workflow/propose.mjs:17` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/workflow/propose.mjs:18` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/propose.mjs:19` | `runner/dispatch/shipped-catalog.mjs` | shippedCatalog | addon | 20 |
| `src/workflow/propose.mjs:20` | `runner/execution/run.mjs` | resolveGitRoots | addon | 20 |
| `src/workflow/propose.mjs:21` | `runner/execution/capability-config.mjs` | capabilityVerifyOf | move-down | 2 |
| `src/workflow/ref-digests.mjs:12` | `runner/execution/handoff-refs.mjs` | reportDigest | move-up? -> workflow | 20 |
| `src/workflow/ref-digests.mjs:13` | `runner/execution/legacy-seat-read.mjs` | seatKeyOf | move-up? -> workflow | 20 |
| `src/workflow/runner.mjs:37` | `runner/execution/run.mjs` | runUnit | host run-unit | 20 |
| `src/workflow/runner.mjs:38` | `runner/execution/case-admission-port.mjs` | CaseAdmissionRefusedError | move-up? -> workflow | 20 |
| `src/workflow/runner.mjs:43` | `runner/execution/patterns/catalog.mjs` | loopOf | move-up? -> workflow | 20 |
| `src/workflow/runner.mjs:44` | `runner/dispatch/config.mjs` | loadRunnerConfigForDir | addon (config, 6c) | 20 |
| `src/workflow/runner.mjs:45` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/seat-providers.mjs:3` | `runner/execution/legacy-seat-read.mjs` | seatKeyOf, legacyFamilyOf | move-up? -> workflow | 20 |
| `src/workflow/seats.mjs:16` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/store.mjs:7` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/store.mjs:8` | `runner/execution/case-run-paths.mjs` | runDirOf, runsRoot | move-up? -> workflow | 20 |
| `src/workflow/unit-handoff.mjs:14` | `runner/execution/custody-door.mjs` | worktreeAdminScope | move-up? -> workflow | 20 |
| `src/workflow/unit-handoff.mjs:15` | `runner/execution/unit-run-record.mjs` | unitRunFacts | addon (P15 read) | 20 |
| `src/workflow/unit-handoff.mjs:17` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |
| `src/workflow/unit-handoff.mjs:18` | `runner/execution/run-request.mjs` | foldRunSetting | addon | 20 |
| `src/workflow/unit-handoff.mjs:19` | `runner/execution/handoff-refs.mjs` | anonymousInputName, OWN_PREVIOUS_NAME, SEAT_PLACEHOLDER, reportDigest, resolveUnitInputs | move-up? -> workflow | 20 |
| `src/workflow/unit-handoff.mjs:20` | `runner/execution/legacy-seat-read.mjs` | seatKeyOf | move-up? -> workflow | 20 |
| `src/workflow/units-source.mjs:9` | `runner/execution/unit.mjs` | validateUnit | addon | 20 |
| `src/workflow/units-source.mjs:10` | `runner/execution/seat-resolver.mjs` | assertNoUnitTier | move-up? -> workflow | 20 |
| `src/workflow/units-source.mjs:11` | `runner/dispatch/runner-config-error.mjs` | RunnerConfigError | addon (config, 6c) | 20 |

String-only hits (not counted above): `src/report/authoritative-match.mjs:11` (comment, 21), `src/runner/agent-roster.mjs:3`
(comment, 21), `scripts/git/e3-bench.mjs:297` (script, 20: path moves with `commit-unit-work.mjs`),
`scripts/check-decision-citation-drift.baseline.json:37` (baseline, 21), and the 19 test files in §6 marked "string" (2 of them not real hits, below).
Not hits (they name `packages/run-supervisor/contracts/...`): `test/install-packaging.test.mjs:132`,
`test/rust-host/release-tree.test.mjs:157`.

## §6 Tests

Test import hits: **492 hits in 190 files** (`node test/golden-recorders/seam-scan.mjs test`), 8 helpers
(`test/helpers/{declared-assignment,executor-model-vectors.helper,ownership-marker,packaged-definitions,process-tmp-root,run-unit-repo-fixture,run-unit-with-port,work-seat-config}.mjs`)
and 4 other non-`.test` files (`test/live/mailbox-wake-probe.live.mjs`, `test/run-supervisor/fixtures/terminal-controller.mjs`,
`test/runner/{dispatch-assignment-id-claim-concurrency,reconcile-apply-cas-worker}.helper.mjs`); plus 19 string-only test
files. Columns: behaviour = the file's first test title (the file's subject); owner = "retire -> Rust <porting phase>"
for tests under the deleted paths' test dirs, else "switch import" (subject stays Node; the import moves to the door
by the column "must change by"); must change by = the deleting phase of the newest target it imports (§1); footprint
= phases whose footprint glob matches the file (plan.md table). `process-tmp-root.mjs:14` is imported by most of the
suite and only re-points (phase 02).

| test file:lines | kind | targets (x/ execution, d/ dispatch, rs/ run-supervisor, vd/ verbs) | behaviour | owner | must change by | phase footprints | baseline cpu s |
|---|---|---|---|---|---|---|---|
| `test/architecture.test.mjs` | string | - | đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một | string hit; see §6 notes | - | 22 | 33.6 |
| `test/cli/dispatch-retired-doors.test.mjs` | string | - | fgos dispatch execute <agent executor> is a validation error pointing at fgos run --provider, and spawns nothi | string hit; see §6 notes | - | 21 | 11.2 |
| `test/cli/execution-outcome-exit-codes.test.mjs`:13 | import | x/outcome.mjs | OUTCOME_EXIT_CODES defines execution outcome codes 10-14 and policy-refusal | switch import (subject stays Node); module ported in 6b | 21 | 21 | 10.1 |
| `test/cli/fgos-manifest.test.mjs`:13 | import | x/outcome.mjs | manifest verb-name set equals the set of verbs runVerb() actually dispatches | switch import (subject stays Node); module ported in 6b | 21 | 21 | 0.1 |
| `test/cli/subcommand-flag-drift.test.mjs` | string | - | the drift scan covers the verbs that branch on a positional sub-verb | string hit; see §6 notes | - | 21 | 0.1 |
| `test/config/facade.test.mjs`:12 | import | d/confinement/drivers/bwrap.mjs | a result has no prototype on any object, so a config key can never name one | switch import (subject stays Node); module ported in 8 | 21 | **none** | 1 |
| `test/convention/seat-id.test.mjs`:12,13 | import | x/handoff-refs.mjs x/seat-resolver.mjs | the shared golden vectors give the same answer here as in the Rust crate | switch import (subject stays Node); module ported in 6b | 21 | **none** | 0.1 |
| `test/event-store/consumers.test.mjs` | string | - | the dormant registry matches the shipped manifest without import-time registration | string hit; see §6 notes | - | 2 | 0.4 |
| `test/git/write-scope-parity.test.mjs` | string | - | the addon collidingPairs binding returns colliding pairs and reports an item without scopes as scope-empty | string hit; see §6 notes | - | **none** | 0.3 |
| `test/helpers/declared-assignment.mjs`:8 | import | d/assignment.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 13 | 21 | 20 | - |
| `test/helpers/executor-model-vectors.helper.mjs`:12,13,14,15 | import | d/config.mjs d/provider-adapter.mjs d/resolve.mjs d/executor-governance.mjs x/capability-config.mjs d/provider-capacity.mjs d/llm-accounts.mjs d/mechanism.mjs d/confinement/policies.mjs d/tool-providers.mjs x/bind.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 6c, 11, 16, 13, 2, 9, 7, 18 | 21 | 2, 20 | - |
| `test/helpers/ownership-marker.mjs`:5 | import | d/confinement/cleanup.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 8b | 21 | 20 | - |
| `test/helpers/packaged-definitions.mjs`:10 | import | d/execution-contract.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 13b | 21 | 20 | - |
| `test/helpers/process-tmp-root.mjs`:14 | import | d/stop-processes-inside.mjs |  ${args}  | switch import (subject stays Node); module ported in 2 | 2 | 2, 20 | - |
| `test/helpers/run-unit-repo-fixture.mjs`:9,10,11 | import | rs/cancel-registry.mjs x/seat-resolver.mjs x/run.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 5, 6b, 18 | 21 | 20 | - |
| `test/helpers/run-unit-with-port.mjs`:9 | import | x/run.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 18 | 20 | 20 | - |
| `test/helpers/work-seat-config.mjs`:6,7 | import | d/config.mjs d/provider-adapter.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 6c, 11 | 21 | 20 | - |
| `test/holder-lock/driver-unavailable.test.mjs` | string | - | without the addon every facade door fails lock-driver-unavailable and creates nothing | string hit; see §6 notes | - | **none** | 0.4 |
| `test/holder-lock/windows-borrow.test.mjs`:17,18 | import | d/provider-capacity.mjs d/provider-credential-probe.mjs | a sync borrow returns exit, stdout and stderr in the POSIX shape | switch import (subject stays Node); module ported in 9 | 21 | **none** | 0.1 |
| `test/install-packaging.test.mjs` | string | - | e2e: npm pack -> npm install -g -> fgos init from a fresh external cwd refuses, naming fgctl init | n/a (not a hit: names packages/run-supervisor) | - | **none** | 5.2 |
| `test/live/mailbox-wake-probe.live.mjs`:300 | import | d/worker-session-boot.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 11 | 21 | **none** | - |
| `test/portfolio/work-questions.test.mjs`:12 | import | x/case-run-paths.mjs | an open gate of a parked case is listed with the command that answers it, and reading writes nothing | switch import (subject stays Node); module ported in 6b | 20 | **none** | - |
| `test/run-supervisor/adopt-client.test.mjs`:12 | import | rs/client.mjs | adoptRun drives an attempt to closed once and reports closed after that | retire -> Rust 5 | 21 | 20 | 0.5 |
| `test/run-supervisor/attempt-steps.test.mjs`:13,14,15,16 | import | d/agent-result-claim-contract.mjs rs/run-lock.mjs d/provider-credential-renewal.mjs d/provider-capacity.mjs rs/steps/settle-attempt.mjs rs/attempt-step.mjs rs/payload-root.mjs | settle-attempt on an exited receipt with an outbox writes result.json; a second run changes nothing | retire -> Rust 12, 5, 10, 9, 14, 2 | 21 | 2, 20 | 0.8 |
| `test/run-supervisor/bwrap-driver.test.mjs`:8 | import | d/confinement/drivers/bwrap.mjs | a direct launch has its own pid namespace as pid 1 and never dies with its parent | retire -> Rust 8 | 21 | 20 | 0.3 |
| `test/run-supervisor/cancel-registry.test.mjs`:12 | import | rs/cancel-registry.mjs | registry keeps the delivered runs, once each | retire -> Rust 5 | 21 | 20 | 3.9 |
| `test/run-supervisor/direct-crash-matrix.test.mjs`:12,13 | import | rs/client.mjs rs/cwd-lock.mjs | 1. a controller killed with SIGKILL after the binding leaves an agent that finishes and an attempt that settle | retire -> Rust 5 | 21 | 20 | 25.2 |
| `test/run-supervisor/direct-cutover.test.mjs`:14,15 | import | d/run-result.mjs rs/direct-launch.mjs | the Node supervisor, its IPC channel and the writers of the old bindings are gone from src | retire -> Rust 12, 5 | 21 | 20 | 2.9 |
| `test/run-supervisor/fixtures/terminal-controller.mjs`:4 | import | d/assignment-runner.mjs | (helper, no test title) | retire -> Rust 16b | 21 | 20 | - |
| `test/run-supervisor/inspect-recover-adopt.test.mjs`:13,14,15,16 | import | vd/inspect.mjs vd/show-run.mjs vd/recover.mjs x/unit-control.mjs | an orphaned attempt with an outbox result recovers as adopt, and applying it closes the attempt | retire -> Rust 21, 6b | 21 | 20 | 0.8 |
| `test/run-supervisor/pane-host.test.mjs`:6 | import | d/herdr-round.mjs | a controller gives a pane back through the host by its key, and only a live pane is closed by a probe | retire -> Rust 11 | 21 | 20 | - |
| `test/run-supervisor/prepare-seat.test.mjs`:10 | import | d/herdr-round.mjs | preparing a seat returns its binding and seeds the trust entry the agent would stop at | retire -> Rust 11 | 21 | 20 | - |
| `test/run-supervisor/runtime-dir.test.mjs`:12 | import | rs/runtime-dir.mjs | the directory is under XDG_RUNTIME_DIR when set, else /tmp/fgos-<uid> | retire -> Rust 5 | 21 | 20 | 0.1 |
| `test/run-supervisor/sweep.test.mjs`:12,13 | import | d/confinement/cleanup.mjs rs/client.mjs | lock free, domain empty, receipt present: adopt finalizes the home and nothing else touches it | retire -> Rust 8b, 5 | 21 | 20 | 2.3 |
| `test/run-supervisor/terminal-groups.test.mjs`:12,16,17 | import | d/herdr-round.mjs rs/steps/cleanup-trust.mjs rs/trust-store.mjs | the seats of one batch share a tab and each gets the key of its attempt | retire -> Rust 11, 14, 5 | 21 | 20 | 17.9 |
| `test/run-supervisor/windows-custody.test.mjs`:10,11 | import | rs/cwd-lock.mjs rs/direct-launch.mjs | Windows retains controller custody while its supervisor declares the producer job | retire -> Rust 5 | 21 | 20 | 0.1 |
| `test/runner/agent-definitions.test.mjs`:23 | import | d/assignment.mjs | the workspace layer shadows an owning domain, which shadows core, as a whole file | switch import (subject stays Node); module ported in 13 | 21 | 20, 21 | 0.3 |
| `test/runner/agent-result-claim-contract.test.mjs`:12 | import | d/agent-result-claim-contract.mjs | v2 contract validates status-dependent fields while preserving missing-contract claims as legacy input | switch import (subject stays Node); module ported in 12 | 21 | 20, 21 | 0.1 |
| `test/runner/assignment-cwd-mutex-concurrency.test.mjs`:27 | import | d/assignment-runner.mjs | executeAssignment: a second, DIFFERENT Assignment targeting the same cwd is refused while the first cli-spawn  | switch import (subject stays Node); module ported in 16b | 21 | 20, 21 | 3.8 |
| `test/runner/assignment-dispatch.test.mjs`:15,18,19,20 | import | d/assignment-runner.mjs d/runner-config-error.mjs d/plan.mjs rs/run-lock.mjs d/provider-capacity.mjs d/run-result.mjs | executeAssignment executes non-mutating validate-plan assignment through fake executor | switch import (subject stays Node); module ported in 16b, 6c, 16, 5, 9, 12 | 21 | 20, 21 | 42.7 |
| `test/runner/assignment-enumerator-guard.test.mjs` | string | - | no assignment-tree directory listing exists outside the layout owner unless allow-listed with its exact count  | string hit; see §6 notes | - | 20, 21 | 3.1 |
| `test/runner/assignment-layout.test.mjs`:7,8,9,10 | import | d/assignment-layout.mjs d/runtime-inspection.mjs vd/show-run.mjs vd/watch.mjs d/visibility-session.mjs vd/recover.mjs | shared layout fixture yields every safe directory candidate, never worker descendants or symlink attempts | switch import (subject stays Node); module ported in 13, 11, 21 | 21 | 20, 21 | 0.5 |
| `test/runner/assignment-normalizer.test.mjs`:11,12 | import | d/assignment-normalizer.mjs d/runner-config-error.mjs | NORMALIZER_VERSION is a non-empty string | switch import (subject stays Node); module ported in 13, 6c | 21 | 20, 21 | 0.1 |
| `test/runner/assignment-provenance.test.mjs`:6,8 | import | d/assignment.mjs d/runner-config-error.mjs | buildAssignment (declared) stamps provenance.kind="declared" plus provenance.declared | switch import (subject stays Node); module ported in 13, 6c | 21 | 20, 21 | 0.2 |
| `test/runner/assignment-runresult.test.mjs`:14,16,17,20 | import | d/assignment-runner.mjs d/settlement.mjs rs/run-lock.mjs d/run-result.mjs | classifyRunEvidence classifies evidence confidence ladder correctly per Step 01 §11 & Step 03 §5.1 | switch import (subject stays Node); module ported in 16b, 14, 5, 12 | 21 | 20, 21 | 37.5 |
| `test/runner/assignment.test.mjs`:7,9 | import | d/assignment.mjs d/runner-config-error.mjs | createAssignmentId produces deterministic asgn_<safe-work>_<safe-op>_<seq> ids | switch import (subject stays Node); module ported in 13, 6c | 21 | 20, 21 | 0.3 |
| `test/runner/cli-spawn-reconciliation.test.mjs`:13,14,18 | import | d/confinement/request.mjs d/confinement/cleanup.mjs d/confinement/authority.mjs | 9. worker write grant does not overlap protected capture or receipt | switch import (subject stays Node); module ported in 7b, 8b | 21 | 20, 21 | 0.3 |
| `test/runner/config-seat-binding-layers.test.mjs`:13 | import | d/config.mjs | a global file that carries the bare verbs loads under a project, untouched | switch import (subject stays Node); module ported in 6c | 21 | 20, 21 | 0.7 |
| `test/runner/credential-store.test.mjs`:7,9,10,11 | import | d/provider-capacity.mjs d/confinement/resources.mjs d/provider-credential-renewal.mjs d/config.mjs d/runner-config-error.mjs d/transport.mjs d/confinement/request.mjs | credentialStoreProblem names what is wrong with a declaration | switch import (subject stays Node); module ported in 9, 7, 10, 6c, 11, 7b | 21 | 20, 21 | 0.5 |
| `test/runner/custody-lease-commit.test.mjs`:99,101 | import | rs/cwd-lock.mjs x/commit-unit-work.mjs | runner commit borrows custody through a blocking real hook${killController ? ' after controller SIGKILL' : ' a | switch import (subject stays Node); module ported in 5, 18 | 21 | 20, 21 | 2.2 |
| `test/runner/custody-successor-admission.test.mjs`:10,11 | import | rs/cwd-lock.mjs rs/direct-launch.mjs | a dead ${kind} predecessor remains unknown and its record is preserved | switch import (subject stays Node); module ported in 5 | 21 | 20, 21 | 2.4 |
| `test/runner/dead-vocabulary-guard.test.mjs`:156,157,185 | import | d/config.mjs d/runner-config-error.mjs d/plan.mjs | dead vocabulary guard: Phase 1-3 retired symbols do not appear in src, bin, core, domains, scripts, config, or | switch import (subject stays Node); module ported in 6c, 16 | 21 | 20, 21 | 0.8 |
| `test/runner/default-executor-merge.test.mjs`:4 | import | d/config.mjs | the input config is not mutated | switch import (subject stays Node); module ported in 6c | 21 | 20, 21 | 0.1 |
| `test/runner/dispatch-assignment-id-claim-concurrency.helper.mjs`:10 | import | d/assignment.mjs | (helper, no test title) | retire -> Rust 13 | 21 | 20, 21 | - |
| `test/runner/dispatch-brief.test.mjs`:6,7,8 | import | d/brief.mjs d/transport.mjs d/assignment.mjs | every path a worker is given is absolute -- its cwd is its own worktree | retire -> Rust 13, 11 | 21 | 20, 21 | 0.1 |
| `test/runner/dispatch-config-patterns.test.mjs`:19,20,22 | import | d/config.mjs d/runner-config-error.mjs d/shipped-catalog.mjs | the standard\ | retire -> Rust 6c, 13 | 21 | 20, 21 | 1.4 |
| `test/runner/dispatch-confinement-authority.test.mjs`:9,10,11,12 | import | d/confinement/authority.mjs d/confinement/request.mjs d/confinement/backend-registry.mjs d/confinement/policies.mjs d/confinement/attestation-store.mjs | buildConfinementRequest builds valid confinement-request.v1 shape at dispatch seam | retire -> Rust 7b, 8, 7 | 21 | 20, 21 | 1.6 |
| `test/runner/dispatch-confinement-backend-p03.test.mjs`:12,14,23,32 | import | x/commit-unit-work.mjs rs/cwd-lock.mjs d/confinement/backend-registry.mjs d/confinement/drivers/bwrap.mjs d/confinement/resources.mjs d/confinement/cleanup.mjs d/confinement/attestation-store.mjs d/confinement/probes/harness.mjs d/confinement/authority.mjs d/confinement/request.mjs d/session-attempt.mjs | R1: backend driver allowlist returns bwrap driver for type "bwrap" | retire -> Rust 18, 5, 8, 7, 8b, 7b, 11 | 21 | 20, 21 | 6.6 |
| `test/runner/dispatch-confinement-blind.test.mjs`:14,15,16,17 | import | d/confinement/drivers/bwrap.mjs d/confinement/request.mjs d/confinement/authority.mjs d/confinement/attestation-store.mjs d/confinement/resources.mjs x/handoff-refs.mjs d/confinement/policies.mjs d/confinement/probes/harness.mjs d/transport.mjs | hostRead has the order deny > blind > allow, and a blind override only narrows | retire -> Rust 8, 7b, 7, 6b, 8b, 11 | 21 | 20, 21 | 7.6 |
| `test/runner/dispatch-confinement-credential-hygiene.test.mjs`:7,8,12 | import | d/confinement/drivers/bwrap.mjs d/confinement/resources.mjs d/confinement/cleanup.mjs | private home, its per-dispatch parent and the root are owner-only under a 002 umask | retire -> Rust 8, 7, 8b | 21 | 20, 21 | 0.8 |
| `test/runner/dispatch-confinement-machine-private.test.mjs`:17,18,27,28 | import | d/confinement/drivers/bwrap.mjs d/confinement/request.mjs d/confinement/resources.mjs d/confinement/policies.mjs d/confinement/probes/harness.mjs d/llm-accounts.mjs d/session-attempt.mjs | every confined launch sets the one marker variable the Config session class reads, under the same name | retire -> Rust 8, 7b, 7, 8b, 9, 11 | 21 | 20, 21 | 11.9 |
| `test/runner/dispatch-confinement-p04.test.mjs`:12,13,17,18 | import | d/confinement/authority.mjs d/confinement/request.mjs d/confinement/policies.mjs d/confinement/workspace-paths.mjs d/confinement/backend-registry.mjs d/herdr-round.mjs d/transport.mjs d/confinement/attestation-store.mjs | R1 Case 1: a missing backendId defaults to 'bwrap' (H10/D2); on a registry with no 'bwrap' entry that still re | retire -> Rust 7b, 7, 8, 11 | 21 | 20, 21 | 3.1 |
| `test/runner/dispatch-confinement-p05.test.mjs`:16,20,23,24 | import | d/confinement/authority.mjs d/confinement/request.mjs d/confinement/policies.mjs d/herdr-round.mjs d/confinement/bypass-pairing.mjs d/transport.mjs | R1: normalizeLegacyConfinement converts legacy flags to canonical v1 controls | retire -> Rust 7b, 7, 11 | 21 | 20, 21 | 1.2 |
| `test/runner/dispatch-confinement-policies.test.mjs`:7,8,18,19 | import | d/config.mjs d/confinement/request.mjs d/confinement/policies.mjs d/confinement/workspace-paths.mjs d/confinement/resources.mjs d/confinement/backend-registry.mjs | R2: BUILTIN_POLICIES defines host-write-denied and workspace-write as immutable v1 schemas | retire -> Rust 6c, 7b, 7, 8 | 21 | 20, 21 | 0.2 |
| `test/runner/dispatch-confinement-reaper-fence.test.mjs`:35 | import | d/confinement/cleanup.mjs | writeOwnershipMarkerV2 refuses a missing attempt or run directory and leaves no marker | retire -> Rust 8b | 21 | 20, 21 | 0.4 |
| `test/runner/dispatch-execute-effort.test.mjs`:16,17,30,31 | import | d/provider-adapter.mjs d/assignment-runner.mjs d/config.mjs d/runner-config-error.mjs rs/run-lock.mjs | renderReasoningEffortArgs puts codex effort in a config override after the exec subcommand | retire -> Rust 11, 16b, 6c, 5 | 21 | 20, 21 | 6.3 |
| `test/runner/dispatch-execute-for-capability.test.mjs`:10 | import | d/cli.mjs | dispatch CLI probe-account rejects a non-positive --timeout-ms | retire -> Rust 21 | 21 | 20, 21 | 0.2 |
| `test/runner/dispatch-executor-profile.test.mjs`:8,9,10,11 | import | d/config.mjs d/runner-config-error.mjs d/assignment-runner.mjs d/resolve.mjs | A1: the loader keeps the profile an invocation declares | retire -> Rust 6c, 16b, 16 | 21 | 20, 21 | 1.1 |
| `test/runner/dispatch-governance-operability.test.mjs`:12,13,17,18 | import | d/runner-config-error.mjs d/assignment-runner.mjs vd/show-run.mjs vd/watch.mjs d/runtime-inspection.mjs | cross-provider executor without explicit opt-in fails closed BEFORE worker spawn | retire -> Rust 6c, 16b, 21, 11 | 21 | 20, 21 | 3.8 |
| `test/runner/dispatch-governance-provider-denylist.test.mjs`:12,15,17,23 | import | d/assignment-runner.mjs d/plan.mjs d/runner-config-error.mjs d/provider-adapter.mjs | provider-adapter canonicalizes provider families and deny lists symmetrically | retire -> Rust 16b, 16, 6c, 11 | 21 | 20, 21 | 2.1 |
| `test/runner/dispatch-i08b-remediation.test.mjs`:15,18,19,23 | import | d/runner-config-error.mjs d/transport.mjs d/assignment-runner.mjs d/run-result.mjs d/provider-adapter.mjs vd/show-run.mjs vd/watch.mjs vd/reconcile.mjs d/reconciliation-planner.mjs | F5: declared vendor takes precedence over CLI harness; cross-vendor executor needs opt-in, same-family is allo | retire -> Rust 6c, 11, 16b, 12, 21, 16 | 21 | 20, 21 | 2.5 |
| `test/runner/dispatch-operability-production-door.test.mjs`:11,15,16,321 | import | d/assignment-runner.mjs vd/reconcile.mjs d/reconciliation-planner.mjs | production assignment door writes RunResult v3, effective contract, adapter argv, and inspect reads the same t | retire -> Rust 16b, 21, 16 | 21 | 20, 21 | 12.5 |
| `test/runner/dispatch-plan-policy.test.mjs`:5,7,8,9 | import | d/plan.mjs d/config.mjs d/runner-config-error.mjs d/resolve.mjs d/provider-adapter.mjs | resolveStrongerRigor rejects malformed rigor instead of letting a stronger demand mask it | retire -> Rust 16, 6c, 11 | 21 | 20, 21 | 1 |
| `test/runner/dispatch-policy-baseline-snapshot.test.mjs`:21,22,23,25 | import | d/config.mjs d/resolve.mjs d/plan.mjs d/provider-adapter.mjs d/tier-cell.mjs d/transport.mjs | dispatch policy baseline snapshot harness (Phase 00) | retire -> Rust 6c, 16, 11, 13 | 21 | 20, 21 | 0.7 |
| `test/runner/dispatch-r9-performance-cache.test.mjs`:14,21 | import | d/confinement/attestation-store.mjs d/runtime-inspection.mjs | the attestation store follows the state-root pin, even when XDG_STATE_HOME is blank | retire -> Rust 8, 11 | 21 | 20, 21 | 0.3 |
| `test/runner/dispatch-reconcile-operation.test.mjs`:7,12 | import | vd/reconcile.mjs d/provider-capacity.mjs | invokeDispatchReconcileOperation refuses a mismatched operationId or effect, and never a read effect | retire -> Rust 21, 9 | 21 | 20, 21 | 0.5 |
| `test/runner/dispatch-reconciliation-concurrency.test.mjs`:9 | import | d/reconciliation-planner.mjs | two real concurrent OS processes racing applyReconciliation against the same repair-projection plan: exactly o | retire -> Rust 16 | 21 | 20, 21 | 0.9 |
| `test/runner/dispatch-reconciliation-import-graph.test.mjs` | string | - | banned-module sanity: ${path.relative(root, banned)} exists on disk (keeps the banned list honest, not fiction | string hit; see §6 notes | - | 2, 20, 21 | 0.4 |
| `test/runner/dispatch-reconciliation.test.mjs`:7 | import | d/reconciliation-planner.mjs | clear-cwd-lock has nothing to clear when no dispatch holds the cwd, and a forged clear plan applies nothing | retire -> Rust 16 | 21 | 20, 21 | 1 |
| `test/runner/dispatch-run-timeout.test.mjs`:10,11,39 | import | d/config.mjs d/runner-config-error.mjs | parseRunTimeout reads a whole number with one unit | retire -> Rust 6c | 21 | 20, 21 | 0.7 |
| `test/runner/dispatch-runtime-inspect.test.mjs`:18,19,20 | import | d/runtime-inspection.mjs d/attention-view.mjs vd/inspect.mjs | inspection requires exactly one typed selector | retire -> Rust 11, 21 | 21 | 20, 21 | 1.1 |
| `test/runner/dispatch-stray-write-attribution.test.mjs`:15,19 | import | d/assignment-runner.mjs d/run-result.mjs | a file another session writes into the main checkout during a round is not blamed on the round | retire -> Rust 16b, 12 | 21 | 20, 21 | 9.8 |
| `test/runner/dispatch-terminal-slot.test.mjs`:5 | import | d/terminal-slot.mjs | a seat of a work item is named by the item id and its title when it has one, and a run without one by run and  | retire -> Rust 11 | 21 | 20, 21 | 0.1 |
| `test/runner/dispatch-trust-store.test.mjs`:9,10 | import | rs/trust-store.mjs rs/steps/cleanup-trust.mjs | readTrust reports true, false, and absent as three different answers | retire -> Rust 5, 14 | 21 | 20, 21 | 0.8 |
| `test/runner/dispatch-visibility-session.test.mjs`:8,21,247 | import | d/assignment-runner.mjs d/visibility-session.mjs | bindings accumulate -- a later write never erases one an earlier write learned | retire -> Rust 16b, 11 | 21 | 20, 21 | 0.4 |
| `test/runner/dispatch-worker-home.test.mjs`:8 | import | d/worker-home.mjs | C1: a bypass home carries all five provisioning items | retire -> Rust 11 | 21 | 20, 21 | 0.5 |
| `test/runner/dispatch-worker-session-boot.test.mjs`:4 | import | d/worker-session-boot.mjs | the operator session is refused before a single process is started | retire -> Rust 11 | 21 | 20, 21 | 1.3 |
| `test/runner/dispatch-worker-session.test.mjs`:8 | import | d/worker-session.mjs | C2: a session name that could escape its directory is refused | retire -> Rust 11 | 21 | 20, 21 | 0.1 |
| `test/runner/dispatch.test.mjs`:14,15,16,17 | import | d/config.mjs d/runner-config-error.mjs d/transport.mjs d/mechanism.mjs d/cli.mjs d/assignment-runner.mjs d/resolve.mjs d/plan.mjs rs/cwd-lock.mjs | buildPrompt includes all five framing sections | retire -> Rust 6c, 11, 21, 16b, 16, 5 | 21 | 20, 21 | 25 |
| `test/runner/dispatch/provider-session-probe.test.mjs`:13,14 | import | d/provider-session-probe.mjs rs/steps/finalize-home.mjs | a session written in the declared folder is reported kept, with its path, count and size and no content | retire -> Rust 9, 14 | 21 | 20, 21 | 0.5 |
| `test/runner/dispatch/tool-providers.test.mjs`:11 | import | d/tool-providers.mjs | forEntriesOf returns the raw for list of any executor kind and [] when it declares none | retire -> Rust 13 | 21 | 20, 21 | 0.5 |
| `test/runner/dispatch/worker-env-case-context.test.mjs`:8,9,10,11 | import | d/adapters.mjs d/assignment-runner.mjs x/run.mjs x/handoff-refs.mjs | a worker starts from the allowlist only: no variable of its controller outside it crosses, whatever its name | retire -> Rust 11, 16b, 18, 6b | 21 | 20, 21 | 5.4 |
| `test/runner/driver-rununit.test.mjs`:14,16 | import | d/assignment-runner.mjs d/runner-config-error.mjs | full cycle: the driver runs validate-plan through runUnit and the next pass finds the verdict itself; an edite | switch import (subject stays Node); module ported in 16b, 6c | 21 | 20, 21 | 21.8 |
| `test/runner/effective-execution-contract.test.mjs`:17,18,19,21 | import | d/effective-execution-contract.mjs d/runner-config-error.mjs d/assignment.mjs d/brief.mjs d/assignment-runner.mjs | EFFECTIVE_EXECUTION_CONTRACT has correct id and version | switch import (subject stays Node); module ported in 13b, 6c, 13, 16b | 21 | 20, 21 | 2 |
| `test/runner/egress-governance.test.mjs`:4,5,6 | import | d/resolve.mjs d/transport.mjs d/runner-config-error.mjs | declared egress: glm executor keeping command "claude" but setting ANTHROPIC_BASE_URL to OpenRouter fails when | switch import (subject stays Node); module ported in 16, 11, 6c | 21 | 20, 21 | 0.1 |
| `test/runner/enrich-and-validate-contract.test.mjs`:8 | import | d/runner-config-error.mjs | enrichAndValidateContract rejects a contract.supports naming an operation illegal for the Work\ | switch import (subject stays Node); module ported in 6c | 21 | 20, 21 | 0.1 |
| `test/runner/evidence-attribution.test.mjs`:10 | import | d/evidence-attribution.mjs | attribution levels and policy dispositions vocabulary is frozen and closed | switch import (subject stays Node); module ported in 12 | 21 | 20, 21 | 0.1 |
| `test/runner/execution-contract.test.mjs`:4,5 | import | d/execution-contract.mjs d/runner-config-error.mjs | CONTRACT_POLICY_VERSION is a non-empty string | switch import (subject stays Node); module ported in 13b, 6c | 21 | 20, 21 | 0.2 |
| `test/runner/execution/account-pin.test.mjs`:10,11 | import | x/bind.mjs x/account-pin.mjs | an account of the pool serving the chosen entry is pinned and its source recorded | retire -> Rust 18, 9 | 21 | 20, 21 | 0.9 |
| `test/runner/execution/account-rotation.test.mjs`:11,12,13,14 | import | x/bind.mjs x/run.mjs x/account-rotation.mjs d/provider-capacity.mjs | a retry needs a usable account and never exceeds the accounts the provider has | retire -> Rust 18, 9 | 21 | 20, 21 | 0.6 |
| `test/runner/execution/bind-committed-config.test.mjs`:12 | import | x/bind.mjs | each executor bound by override gets a confined, home-provisioned cli invocation | retire -> Rust 18 | 21 | 20, 21 | 2.4 |
| `test/runner/execution/bind-tier-composition.test.mjs`:9 | import | x/seat-resolver.mjs | a workflow seat recommendation names the workflow, the unit and the seat, and drops the workflow when the run  | retire -> Rust 6b | 21 | 20, 21 | 0.1 |
| `test/runner/execution/bind.test.mjs`:15,16,77 | import | x/bind.mjs x/seat-ledger.mjs d/provider-capacity.mjs | the bind ask holds a seat to the executor of a seat bound earlier that must differ from it | retire -> Rust 18, 6b, 9 | 21 | 20, 21 | 2 |
| `test/runner/execution/capability-config.test.mjs`:10 | import | x/capability-config.mjs | a capability reads its exact entry before its prefix entry | retire -> Rust 2 | 2 | 2, 20, 21 | 0.1 |
| `test/runner/execution/case-run-paths.test.mjs`:7 | import | x/case-run-paths.mjs | a case id names one directory under the runs root, and an id that is not a case id is refused by name | retire -> Rust 6b | 20 | 20, 21 | 0.1 |
| `test/runner/execution/commit-unit-work.test.mjs`:11,429 | import | x/commit-unit-work.mjs | a. a staged path outside the scope is refused and the index is left untouched | retire -> Rust 18 | 20 | 20, 21 | 12.2 |
| `test/runner/execution/config-snapshot-hash.test.mjs`:10,11 | import | x/run.mjs d/provider-capacity.mjs | the hash changes when any part of seat choice changes: the default tier, the ceiling, the fallback order, a ce | retire -> Rust 18, 9 | 21 | 20, 21 | 0.2 |
| `test/runner/execution/custody-door.test.mjs`:7 | import | x/custody-door.mjs | verify door: exit 0 is a pass verdict and the output is hashed once | retire -> Rust 18 | 20 | 20, 21 | 0.4 |
| `test/runner/execution/git-core-adapters.test.mjs`:10,11 | import | x/commit-unit-work.mjs x/unit-sync.mjs | clean Sync ${owned?'owned':'foreign'} hook evidence, abort timing and persisted operation id | retire -> Rust 18 | 20 | 20, 21 | 6.1 |
| `test/runner/execution/handoff-refs.test.mjs`:11 | import | x/handoff-refs.mjs | a settled report is handed over as an absolute path | retire -> Rust 6b | 20 | 20, 21 | 0.4 |
| `test/runner/execution/legacy-seat-read.test.mjs`:11,12,13,14 | import | x/legacy-seat-read.mjs d/shipped-catalog.mjs x/unit-summary.mjs x/unit-run-history.mjs x/handoff-refs.mjs x/run.mjs | golden: a pre-fence panel record (three role-keyed panelists and a synthesizer) reads as seats | retire -> Rust 6b, 13, 18 | 21 | 20, 21 | 0.7 |
| `test/runner/execution/loops/architecture-guard.test.mjs` | string | - | architecture-guard: pattern modules do not import forbidden modules (A4 boundary) | string hit; see §6 notes | - | 20, 21 | 0.1 |
| `test/runner/execution/loops/debate.test.mjs`:4,5,6 | import | x/loops/debate.mjs x/loops/history-outcome.mjs x/seat-resolver.mjs | round 1 runs both sides in parallel, read-only, with no inputs and a soft family spread | retire -> Rust 6b | 21 | 20, 21 | 0.1 |
| `test/runner/execution/loops/index.test.mjs`:9,10,11,12 | import | x/loops/index.mjs d/shipped-catalog.mjs x/loops/solo.mjs x/loops/reviewed.mjs x/loops/panel.mjs x/loops/debate.mjs | runLoop dispatches solo loop by default or name | retire -> Rust 6b, 13 | 21 | 20, 21 | 0.3 |
| `test/runner/execution/loops/panel.test.mjs`:4 | import | x/loops/panel.mjs | runPanel runs the member seats in parallel and synthesizes results | retire -> Rust 6b | 21 | 20, 21 | 0.1 |
| `test/runner/execution/loops/reviewed.test.mjs`:8,9,13,14 | import | x/loops/reviewed.mjs x/loops/verify.mjs x/seat-resolver.mjs d/shipped-catalog.mjs | runReviewed passes on round 1 when all checkers pass | retire -> Rust 6b, 13 | 21 | 20, 21 | 0.3 |
| `test/runner/execution/loops/role-tasks.test.mjs`:7,8 | import | x/loops/role-tasks.mjs d/shipped-catalog.mjs | a seat with no task gets the very same unit back | retire -> Rust 6b, 13 | 21 | 20, 21 | 0.4 |
| `test/runner/execution/loops/solo.test.mjs`:4,5,6,7 | import | x/loops/solo.mjs x/outcome.mjs x/legacy-seat-read.mjs x/loops/history-outcome.mjs | runSolo dispatches the producer seat and returns outcome | retire -> Rust 6b | 21 | 20, 21 | 0.1 |
| `test/runner/execution/partial-writes.test.mjs`:10 | import | x/partial-writes.mjs | a commit with a clean tree is a change: HEAD moved | retire -> Rust 18 | 20 | 20, 21 | 1.7 |
| `test/runner/execution/patterns/catalog.test.mjs`:9,10,11,12 | import | x/patterns/catalog.mjs x/patterns/catalog-entries.mjs d/shipped-catalog.mjs x/patterns/retired-keys.mjs | CollaborationError carries error code, message and optional source layer | retire -> Rust 6, 13 | 21 | 20, 21 | 0.4 |
| `test/runner/execution/run-case-admission.test.mjs`:13,14,15,16 | import | x/run.mjs d/shipped-catalog.mjs x/loops/reviewed.mjs x/case-admission-port.mjs d/runner-config-error.mjs rs/cwd-lock.mjs | a writing Unit with no port is refused before anything exists, and so is a Unit that names a case | retire -> Rust 18, 13, 6b, 6c, 5 | 21 | 20, 21 | 38.9 |
| `test/runner/execution/run-gate.test.mjs`:12,13,142,181 | import | x/run.mjs d/config.mjs d/assignment-runner.mjs d/assignment.mjs x/bind.mjs | detectHerdrPresent needs the herdr marker and a socket that exists | retire -> Rust 18, 6c, 16b, 13 | 21 | 20, 21 | 11.4 |
| `test/runner/execution/run-herdr.test.mjs`:12 | import | d/cli.mjs | guards: the run path reads bound.transport and walks through bind | retire -> Rust 21 | 21 | 20, 21 | 0.5 |
| `test/runner/execution/run-posture.test.mjs`:14 | import | d/confinement/policies.mjs | read-only posture: repo writes are blocked, the run outbox stays writable | retire -> Rust 7 | 21 | 20, 21 | 8.5 |
| `test/runner/execution/run-pre-admission.test.mjs`:11,12 | import | x/run.mjs d/runner-config-error.mjs | outside a repository resolveGitRoots refuses unless the caller is read-only, and a unit that writes is refused | retire -> Rust 18, 6c | 21 | 20, 21 | 3.5 |
| `test/runner/execution/run-provider-failover.test.mjs`:15 | import | d/provider-capacity.mjs | a dead login moves the seat to another account of the same provider, not to another provider | retire -> Rust 9 | 21 | 20, 21 | 17.6 |
| `test/runner/execution/run-request.test.mjs`:8,9,10,11 | import | x/run-request.mjs x/run.mjs x/unit.mjs d/runner-config-error.mjs | requestFromFlags with neither flag returns empty scalars | retire -> Rust 6, 18, 6c | 21 | 20, 21 | 2.3 |
| `test/runner/execution/run-resume-order.test.mjs` | string | - | sync resumability is checked only on resume and after custody admission | string hit; see §6 notes | - | 20, 21 | 15.2 |
| `test/runner/execution/run-summary-resume.test.mjs`:11,12,13 | import | x/run.mjs d/runner-config-error.mjs x/unit-summary.mjs | unit summaries cover refusal, thrown execution and resume without duplicating settled seats | retire -> Rust 18, 6c, 6b | 21 | 20, 21 | 23.1 |
| `test/runner/execution/run-sync.test.mjs`:18,19,491 | import | x/unit.mjs d/runner-config-error.mjs x/unit-sync.mjs | syncBase needs writes, names a ref git can read, and without an objective makes a sync-only unit | retire -> Rust 6, 6c, 18 | 21 | 20, 21 | 25.3 |
| `test/runner/execution/run-verify-pin.test.mjs`:12,13 | import | x/run.mjs x/unit-summary.mjs | a committed Unit result survives a failed custody handoff with a warning | retire -> Rust 18, 6b | 20 | 20, 21 | 39.5 |
| `test/runner/execution/seat-ledger.test.mjs`:5,6 | import | x/seat-ledger.mjs x/dry-bind.mjs | the ledger resolves a seat to the executors that filled it and keeps an unbound seat as its id | retire -> Rust 6b, 18 | 21 | 20, 21 | 0.5 |
| `test/runner/execution/seat-resolver.test.mjs`:9,10,13 | import | x/seat-resolver.mjs d/shipped-catalog.mjs d/agent-result-claim-contract.mjs | the role vocabulary is the five roles | retire -> Rust 6b, 13, 12 | 21 | 20, 21 | 0.3 |
| `test/runner/execution/tier-fallback.test.mjs`:11 | import | x/bind.mjs | the executor model is no longer a fallthrough for a missing cell | retire -> Rust 18 | 21 | 20, 21 | 1.8 |
| `test/runner/execution/unit-run-outcome.test.mjs`:5 | import | x/unit-run-history.mjs | a seat refused for provider capacity or stopped by a provider limit is a provider limit, so its pool moves on, | retire -> Rust 18 | 21 | 20, 21 | 0.3 |
| `test/runner/execution/unit-run-record.test.mjs`:10,11,12,13 | import | x/unit-run-record.mjs x/case-admission-port.mjs x/unit-control.mjs rs/cwd-lock.mjs | facts of a Unit run say whether its record exists, is settled, has a controller and can be resumed | retire -> Rust 18, 6b, 5 | 21 | 20, 21 | 0.4 |
| `test/runner/execution/unit-run-result-fixtures.test.mjs`:13 | import | x/outcome.mjs | every outcome a reader can meet has a golden file, and each file is named for its id | retire -> Rust 6b | 21 | 20, 21 | 0.1 |
| `test/runner/execution/unit-summary.test.mjs`:8,9,11 | import | x/unit-summary.mjs x/unit-run-history.mjs x/loops/index.mjs | complete summary uses owner workflow/outcome and only exposes measurement metadata | retire -> Rust 6b, 18 | 21 | 20, 21 | 0.5 |
| `test/runner/execution/unit.test.mjs`:5,6,306 | import | x/unit.mjs d/runner-config-error.mjs d/config.mjs | validateUnit: accepts a minimal valid unit and returns frozen object | retire -> Rust 6, 6c | 21 | 20, 21 | 0.1 |
| `test/runner/herdr-private-home-trust.test.mjs`:18,19,20 | import | rs/trust-store.mjs d/herdr-round.mjs d/cli.mjs | codex: the entry goes to the private config, created when absent, while the root is vouched for by the real co | switch import (subject stays Node); module ported in 5, 11, 21 | 21 | 20, 21 | 1.6 |
| `test/runner/herdr-spawn-adapter.test.mjs`:9 | import | d/transport.mjs | herdr-spawn is a registered adapter that refuses to be executed directly, by name | switch import (subject stays Node); module ported in 11 | 21 | 20, 21 | 0.1 |
| `test/runner/llm-accounts.test.mjs`:9 | import | d/llm-accounts.mjs | a valid inventory reads every account with its stores expanded | switch import (subject stays Node); module ported in 9 | 21 | 20, 21 | 0.1 |
| `test/runner/loop.test.mjs`:23 | import | d/settlement.mjs | runOnce full circle: todo -> doing -> worker commit -> goal-check pass -> awaiting-approval, branch kept, work | switch import (subject stays Node); module ported in 14 | 21 | 20, 21 | 198 |
| `test/runner/merge-quoted-paths.test.mjs`:17 | import | d/settlement.mjs | changedFiles lists a branch\ | switch import (subject stays Node); module ported in 14 | 21 | 20, 21 | 2.4 |
| `test/runner/operation-choice.test.mjs`:22,25,26 | import | d/assignment-runner.mjs d/settlement.mjs d/assignment-layout.mjs | driver chooses primary path when validation not due | switch import (subject stays Node); module ported in 16b, 14, 13 | 21 | 20, 21 | 44.3 |
| `test/runner/operation-prompt-templates.test.mjs`:21,23,29,31 | import | d/operation-prompt-templates.mjs d/assignment.mjs d/effective-execution-contract.mjs d/assignment-runner.mjs | discoverOperationPromptTemplates discovers shipped core templates cleanly | switch import (subject stays Node); module ported in 13b, 13, 16b | 21 | 20, 21 | 2.8 |
| `test/runner/provider-account-probe.test.mjs`:15,16 | import | d/provider-account-probe.mjs d/cli.mjs | the invocations of an account are the leased confined ones, the ones whose env names its home, and the ones na | switch import (subject stays Node); module ported in 9, 21 | 21 | 20, 21 | 0.3 |
| `test/runner/provider-capacity.test.mjs`:29,30 | import | d/provider-capacity.mjs vd/reconcile.mjs | a confined session is refused the lease by name instead of reading as an unmanaged provider | switch import (subject stays Node); module ported in 9, 21 | 21 | 20, 21 | 10.5 |
| `test/runner/provider-credential-probe.test.mjs`:14,15 | import | d/provider-credential-probe.mjs d/provider-capacity.mjs | the call is built per credential layout, pointing the CLI at the account home and asking for the named model | switch import (subject stays Node); module ported in 9 | 21 | 20, 21 | 0.3 |
| `test/runner/provider-credential-renewal.test.mjs`:26,30,36,37 | import | d/provider-credential-renewal.mjs d/provider-capacity.mjs d/confinement/cleanup.mjs d/confinement/drivers/bwrap.mjs d/confinement/resources.mjs d/confinement/authority.mjs | the layout is named from the credential source, omp before pi | switch import (subject stays Node); module ported in 10, 9, 8b, 8, 7, 7b | 21 | 20, 21 | 1.3 |
| `test/runner/provider-per-cli-credential-sources.test.mjs`:18,19,24,25 | import | d/provider-capacity.mjs d/provider-credential-probe.mjs d/provider-credential-renewal.mjs d/confinement/drivers/bwrap.mjs d/confinement/request.mjs d/confinement/resources.mjs d/provider-account-probe.mjs | an account declares one login store per CLI, and each CLI reads its own | switch import (subject stays Node); module ported in 9, 10, 8, 7b, 7 | 21 | 20, 21 | 0.7 |
| `test/runner/provider-pool-lease.test.mjs`:20,21,22,23 | import | d/provider-capacity.mjs d/llm-accounts.mjs d/provider-account-probe.mjs d/config.mjs | a pool declared in llmAccounts supplies its accounts in declared order, under its legacy state key | switch import (subject stays Node); module ported in 9, 6c | 21 | 20, 21 | 0.7 |
| `test/runner/provider-quarantine-probe.test.mjs`:14 | import | d/provider-capacity.mjs | an account locked for a dead credential is unlocked by one successful call when nothing else is usable | switch import (subject stays Node); module ported in 9 | 21 | 20, 21 | 0.2 |
| `test/runner/reconcile-apply-cas-worker.helper.mjs`:12 | import | d/reconciliation-planner.mjs | (helper, no test title) | switch import (subject stays Node); module ported in 16 | 21 | 20, 21 | - |
| `test/runner/run-lock-identity.test.mjs`:17 | import | rs/run-lock.mjs | acquireRunControl: a live holder (real process, matching processStartTime) is never reclaimed by a contender,  | switch import (subject stays Node); module ported in 5 | 21 | 20, 21 | 2.3 |
| `test/runner/run-outcome.test.mjs`:8 | import | d/run-result.mjs | legacy-derivation fixture suite: all fixture cases match expected outcomes | switch import (subject stays Node); module ported in 12 | 21 | 20, 21 | 0.2 |
| `test/runner/run-result-confinement-label.test.mjs`:12,13 | import | d/assignment-runner.mjs rs/run-lock.mjs | a launch the Authority prepared under bwrap settles with confinement "bwrap" | switch import (subject stays Node); module ported in 16b, 5 | 21 | 20, 21 | 0.3 |
| `test/runner/run-result-report-complete.test.mjs`:10,11 | import | d/assignment-runner.mjs rs/run-lock.mjs | ${adapter}: a report the seat wrote and then claimed on is declared complete | switch import (subject stays Node); module ported in 16b, 5 | 21 | 20, 21 | 0.4 |
| `test/runner/run-result-source-scan.test.mjs` | string | - | structural source scan: no production file in src/** reads .status/.confidence on RunResult directly | string hit; see §6 notes | - | 20, 21 | 0.1 |
| `test/runner/run-result-v2.test.mjs`:20 | import | d/run-result.mjs | closed vocabularies are defined and frozen | switch import (subject stays Node); module ported in 12 | 21 | 20, 21 | 0.2 |
| `test/runner/run-result-v3-reader.test.mjs`:14 | import | d/run-result.mjs | validateRunResultV3: validates valid v3 RunResult | switch import (subject stays Node); module ported in 12 | 21 | 20, 21 | 0.2 |
| `test/runner/runner-schema-vocabulary.test.mjs`:12,13,14,16 | import | d/adapters.mjs x/seat-resolver.mjs x/loops/index.mjs d/run-timeout.mjs d/config.mjs | the schema lists the adapters, loops, rigors, tiers, efforts, seat roles and content classes the code holds | switch import (subject stays Node); module ported in 11, 6b, 13, 6c | 21 | 20, 21 | 0.3 |
| `test/runner/spawn-worker.test.mjs`:19,20,21 | import | rs/dispatch-error.mjs d/runner-config-error.mjs d/transport.mjs | spawnWorker runs the item worker as a Unit run in its worktree: tier -> model, the objective is the worker pro | switch import (subject stays Node); module ported in 5, 6c, 11 | 21 | 20, 21 | 45.7 |
| `test/runner/stop-processes-inside.test.mjs`:17 | import | d/stop-processes-inside.mjs | processesInside names the identities it finds (a view with its identity tuple), never a bare pid, and never th | switch import (subject stays Node); module ported in 2 | 2 | 2, 20, 21 | 0.3 |
| `test/runner/tier-cell.test.mjs`:11,12,13 | import | d/tier-cell.mjs d/config.mjs d/runner-config-error.mjs | a plain model is served by the pool named after its family | switch import (subject stays Node); module ported in 13, 6c | 21 | 20, 21 | 0.8 |
| `test/runner/tier-fallback-config.test.mjs`:10,11 | import | d/config.mjs d/runner-config-error.mjs | a tier fallback list loads in order | switch import (subject stays Node); module ported in 6c | 21 | 20, 21 | 2.4 |
| `test/runner/work-path-case-admission.test.mjs` | string | - | a Work driver step with writes in an unbound claim worktree runs as before; the same worktree owned by a case  | string hit; see §6 notes | - | 20, 21 | 2.6 |
| `test/runner/work-unit-for.test.mjs`:12,13 | import | x/unit.mjs d/runner-config-error.mjs | an executing item becomes a mutating solo Unit whose objective is the worker prompt | switch import (subject stays Node); module ported in 6, 6c | 21 | 20, 21 | 0.5 |
| `test/runner/write-scope-globs.test.mjs`:6 | import | d/write-scope.mjs | a glob meets a concrete path exactly when the scope matches it, whatever punctuation the names carry | switch import (subject stays Node); module ported in 13 | 21 | 20, 21 | 0 |
| `test/runner/write-scope.test.mjs`:12 | import | d/write-scope.mjs | canonicalizeWriteEntry: spellings of one directory collapse to one entry | switch import (subject stays Node); module ported in 13 | 21 | 20, 21 | 0 |
| `test/rust-host/fixtures/run-dirs-vectors.json` | string | - | fixture | string hit; see §6 notes | - | 19, 21 | - |
| `test/rust-host/internal-routes.test.mjs` | string | - | internal is neither a route nor in the command manifest | string hit; see §6 notes | - | 19, 21 | 0.5 |
| `test/rust-host/release-tree.test.mjs` | string | - | the staged legacy-node payload carries the YAML door, loads nothing but the native door for it, and any declar | n/a (not a hit: names packages/run-supervisor) | - | 19, 21 | 42.9 |
| `test/scripts/run-rust-dev-host-staging.test.mjs` | string | - | a staged host a detached process runs from or names as its host is kept, and pruned once that process has ende | string hit; see §6 notes | - | 2 | 3.8 |
| `test/scripts/write-wrapper-script.test.mjs` | string | - | writeWrapperScript creates executable file with exact command byte-for-byte | string hit; see §6 notes | - | **none** | 0.2 |
| `test/seat-binding/client.test.mjs`:18,21 | import | x/bind.mjs d/config.mjs | the facade round trip: a seat binds through the real host with its own version, and the explain answer carries | switch import (subject stays Node); module ported in 18, 6c | 21 | **none** | 0.3 |
| `test/session-host/head-permission-mode.test.mjs`:12,13,17,18 | import | d/config.mjs x/bind.mjs d/session-attempt.mjs d/herdr-round.mjs d/confinement/bypass-pairing.mjs | the secretary head launches with the bypass flag under full confinement and a shaper head does not | switch import (subject stays Node); module ported in 6c, 18, 11, 7 | 21 | 20 | - |
| `test/session-host/head-start.test.mjs`:14 | import | d/session-attempt.mjs | a head seat is bound at the persona\ | switch import (subject stays Node); module ported in 11 | 21 | 20 | - |
| `test/session-identity/attempt-writer-id.test.mjs`:9 | import | d/adapters.mjs | every shared vector mints to the same writer id through the door | switch import (subject stays Node); module ported in 11 | 21 | **none** | 0.3 |
| `test/setup/capability-catalog-doctrine.test.mjs`:14 | import | d/plan.mjs | the standard declares only the generic jobs, the tool abilities and the coding rows the Work path and skills r | switch import (subject stays Node); module ported in 16 | 21 | 15, 17, 20 | 0.4 |
| `test/setup/confinement-doctor-checks.test.mjs`:26 | import | d/confinement/cleanup.mjs | confinement doctor checks and fix are registered in checks.mjs | switch import (subject stays Node); module ported in 8b | 21 | 15, 17, 20 | 1.6 |
| `test/setup/credential-copies-retained-check.test.mjs`:9 | import | d/confinement/cleanup.mjs | a clean machine passes | switch import (subject stays Node); module ported in 8b | 21 | 15, 17, 20 | 0.6 |
| `test/setup/model-pool-checks.test.mjs`:10 | import | d/provider-capacity.mjs | executor-family-unique passes with one executor per family and names both executors of a shared family | switch import (subject stays Node); module ported in 9 | 21 | 15, 17, 20 | 3.2 |
| `test/setup/packaged-definitions.test.mjs`:18 | import | d/operation-prompt-templates.mjs | every task-spec file a packaged domain operation or core skill names exists in the release source | switch import (subject stays Node); module ported in 13b | 21 | 15, 17, 20 | 0.4 |
| `test/setup/run-supervisor-checks.test.mjs`:19 | import | rs/gate-kill-grace.mjs | the run supervisor checks and fixes are registered | switch import (subject stays Node); module ported in 5 | 21 | 15, 17, 20 | 2.3 |
| `test/setup/seat-binding-dry-bind.test.mjs`:12,13,14,15 | import | d/config.mjs x/dry-bind.mjs x/patterns/catalog.mjs d/shipped-catalog.mjs | the dry-bind row replaces the two rows it covers in the doctor registry | switch import (subject stays Node); module ported in 6c, 18, 6, 13 | 21 | 15, 17, 20 | 10.1 |
| `test/state/domain-registry-compiled.test.mjs` | string | - | every domain compiled.json matches its registry.yaml and workflows/*.yaml | string hit; see §6 notes | - | 2 | 0.4 |
| `test/state/work-size-rigor.test.mjs`:20 | import | d/plan.mjs | event cũ có tier đọc ra size lúc foldEvents và rebuildView | switch import (subject stays Node); module ported in 16 | 21 | **none** | 0.9 |
| `test/util/session-identity.test.mjs`:72 | import | d/execution-contract.mjs | the dispatch writerId format floor uses the contract id charset and length | switch import (subject stays Node); module ported in 13b | 21 | **none** | 1.3 |
| `test/verbs/dispatch-observe.test.mjs`:8,9,10,11 | import | vd/show-run.mjs d/assignment-layout.mjs vd/watch.mjs d/visibility-session.mjs | no observe door binds a name that could write, anywhere on its import path | retire -> Rust 21, 13, 11 | 21 | 21 | 0.7 |
| `test/verbs/dispatch-recovery.test.mjs`:9,10,11,12 | import | vd/recover.mjs d/recovery-planner.mjs vd/show-run.mjs rs/run-lock.mjs | recovery-planner.mjs imports no fs/adapter/network module and never reaches src/runner/coordination/ | retire -> Rust 21, 16, 5 | 21 | 21 | 1.4 |
| `test/workflow/case-admission-port.test.mjs`:11,13 | import | x/case-admission-port.mjs rs/cwd-lock.mjs | the port is complete: every operation the core asks is there | switch import (subject stays Node); module ported in 6b, 5 | 21 | 20 | 0.6 |
| `test/workflow/case-bindings.test.mjs`:21 | import | rs/cwd-lock.mjs | two cases bind one worktree reached by two spellings of its path: the second is refused as already bound | switch import (subject stays Node); module ported in 5 | 21 | 20 | 2.2 |
| `test/workflow/case-close.test.mjs`:13,15 | import | x/unit-control.mjs x/case-run-paths.mjs | a case closed long ago goes with the Unit runs it names, and a recent or open one stays | switch import (subject stays Node); module ported in 6b | 21 | 20 | 2 |
| `test/workflow/case-runtime.test.mjs`:15,17 | import | rs/cwd-lock.mjs x/handoff-refs.mjs | a gate answer is one round file made once; a second answer to an answered gate is refused by name | switch import (subject stays Node); module ported in 5, 6b | 21 | 20 | 1.4 |
| `test/workflow/case-verbs.test.mjs`:15,17 | import | rs/cwd-lock.mjs x/handoff-refs.mjs | a guide with its own activities opens a conductor case: no process, a case id, the frame narrowed, its worktre | switch import (subject stays Node); module ported in 5, 6b | 21 | 20 | 12 |
| `test/workflow/conductor-case.test.mjs`:15,16,17 | import | x/run.mjs rs/cwd-lock.mjs x/case-admission-port.mjs | two writing dispatches into one case with overlapping writes: the second is refused at reservation, before any | switch import (subject stays Node); module ported in 18, 5, 6b | 21 | 20 | 8.2 |
| `test/workflow/confined-nested-write.test.mjs`:12,13 | import | x/run.mjs x/handoff-refs.mjs | a nested `fgos run --writes` from a confined worker is refused as nested-write-from-confined-worker | switch import (subject stays Node); module ported in 18, 6b | 20 | 20 | 3.3 |
| `test/workflow/core-workflow-seats.test.mjs`:14,15,16,17 | import | x/dry-bind.mjs x/seat-resolver.mjs x/patterns/catalog.mjs d/shipped-catalog.mjs | every panel and debate unit of every core workflow declares explicit seats | switch import (subject stays Node); module ported in 18, 6b, 6, 13 | 21 | 20 | 0.8 |
| `test/workflow/playbook-proposer.test.mjs`:17 | import | x/handoff-refs.mjs | every Unit is admitted before it runs and settled after it, with the proposer\ | switch import (subject stays Node); module ported in 6b | 20 | 20 | 23.6 |
| `test/workflow/propose-frame.test.mjs`:7 | import | d/shipped-catalog.mjs | a frame counts each writing slice, the repeats a high rigor slice draws, and one spare writing dispatch | switch import (subject stays Node); module ported in 13 | 21 | 20 | 0.4 |
| `test/workflow/propose-validate.test.mjs`:17,19 | import | d/write-scope.mjs d/shipped-catalog.mjs | a sound proposal passes, with the tests of the changed code listed as an addition | switch import (subject stays Node); module ported in 13 | 21 | 20 | 0.5 |
| `test/workflow/propose.test.mjs`:12 | import | d/shipped-catalog.mjs | a plan with a document, a code and a locked-contract slice gets a frame, a row per slice and the commands in r | switch import (subject stays Node); module ported in 13 | 21 | 20 | 0.7 |
| `test/workflow/seats.test.mjs`:11,12 | import | x/patterns/catalog.mjs d/shipped-catalog.mjs | every generic base keeps its topology, gates, blind flags and checker and synthesizer text; only seat fields d | switch import (subject stays Node); module ported in 6, 13 | 21 | 20 | 0.7 |
| `test/workflow/stale-approval-reapproval.test.mjs`:17 | import | x/handoff-refs.mjs | approve, edit the approved report, re-park, re-approve: the next step runs on the new content and passes | switch import (subject stays Node); module ported in 6b | 20 | 20 | 7.5 |
| `test/workflow/unit-handoff-raise-door.test.mjs`:12 | import | x/dry-bind.mjs | the overrides a workflow start implies carry no origin that claims a person typed them | switch import (subject stays Node); module ported in 18 | 20 | 20 | 0.8 |
| `test/workflow/unit-handoff.test.mjs`:15,16 | import | d/runner-config-error.mjs x/handoff-refs.mjs | a gate quotes the producer\ | switch import (subject stays Node); module ported in 6c, 6b | 21 | 20 | 0.1 |
| `test/workflow/units-source.test.mjs`:12 | import | d/runner-config-error.mjs | two units with a dependency become two steps in dependency order | switch import (subject stays Node); module ported in 6c | 21 | 20 | 0.3 |
| `test/workflow/workflow-runner-flow.test.mjs`:14 | import | d/runner-config-error.mjs | runner: executes workflow with parallel steps and parks at human gate | switch import (subject stays Node); module ported in 6c | 21 | 20 | 22.9 |

String-only rows, owner:

- `test/architecture.test.mjs` (75 path hits, e.g. `:192-199`, `:447-469`): doors/manifest rows naming deleted files;
  edited by each deleting phase (P22) and 22. Footprint 22 only: phases 15, 17, 19, 20, 21 edit doors rows in
  `docs/architecture-manifest.json`, and seeded cases live in this file.
- `test/cli/dispatch-retired-doors.test.mjs:127`, `test/cli/subcommand-flag-drift.test.mjs:45`: 21 (cli tombstones,
  flag tables -> `cli_tests.rs`).
- `test/event-store/consumers.test.mjs:32`, `test/scripts/run-rust-dev-host-staging.test.mjs:117`,
  `test/state/domain-registry-compiled.test.mjs:33`: 02 (moved paths).
- `test/runner/assignment-enumerator-guard.test.mjs:2,59,86-91`, `test/runner/dispatch-reconciliation-import-graph.test.mjs:82-88...`,
  `test/runner/execution/loops/architecture-guard.test.mjs:7`, `test/runner/run-result-source-scan.test.mjs:132`:
  Node structure guards; behaviour removed with the Node files (20/21).
- `test/runner/execution/run-resume-order.test.mjs:31,33`, `test/runner/work-path-case-admission.test.mjs:97,101`:
  source-order/wiring proofs of `unit-sync.mjs` / `run.mjs`; Rust owner 18 (resume order) and 20 (Work wiring test).
- `test/rust-host/internal-routes.test.mjs:132` (fake payload `src/run-supervisor/attempt-step.mjs` for
  `attempt_step.rs`), `test/rust-host/fixtures/run-dirs-vectors.json:2`: 19 (attempt step to host route) and 21.
- `test/holder-lock/driver-unavailable.test.mjs:19` (`dispatch/adapters.mjs` URL), `test/git/write-scope-parity.test.mjs:19`
  (rewrites `test/runner/write-scope.test.mjs`'s import of `dispatch/write-scope.mjs`), `test/scripts/write-wrapper-script.test.mjs:51`
  (fixture string `node "$root/src/runner/dispatch.mjs" execute`, data only): no phase footprint (below).

### Test files covered by no phase footprint (key output)

All are inside the plan-level `test/**`, but no phase row names them, so no phase is entitled to edit them:

| file | imports / string | must change by | proposed owner phase |
|---|---|---|---|
| `test/config/facade.test.mjs:12` | `d/confinement/drivers/bwrap.mjs` | 21 | 21 |
| `test/convention/seat-id.test.mjs:12,13` | `x/handoff-refs.mjs`, `x/seat-resolver.mjs` | 20/21 | 20 |
| `test/git/write-scope-parity.test.mjs:19` | string, `dispatch/write-scope.mjs` | 21 | 21 |
| `test/holder-lock/driver-unavailable.test.mjs:19` | string, `dispatch/adapters.mjs` | 21 | 21 |
| `test/holder-lock/windows-borrow.test.mjs:17,18` | `d/provider-capacity.mjs`, `d/provider-credential-probe.mjs` | 21 | 21 |
| `test/live/mailbox-wake-probe.live.mjs:300` | `d/worker-session-boot.mjs` | 21 | 20 (with `scripts/record-mailbox-hook-fixtures.mjs:1188`) |
| `test/portfolio/work-questions.test.mjs:12` | `x/case-run-paths.mjs` | 20 | 20 |
| `test/scripts/write-wrapper-script.test.mjs:51` | string (fixture text only) | - | none needed (data, not a path read); 21 may reword |
| `test/seat-binding/client.test.mjs:18,21` | `x/bind.mjs`, `d/config.mjs` | 21 | 20 (P11 decides the client's fate there) |
| `test/session-identity/attempt-writer-id.test.mjs:9` | `d/adapters.mjs` | 21 | 21 |
| `test/state/work-size-rigor.test.mjs:20` | `d/plan.mjs` | 21 | 21 |
| `test/util/session-identity.test.mjs:72` | `d/execution-contract.mjs` | 21 | 21 |

Covered, but by a phase that runs before the file can change (the D1 ordering): the 14 files under
`test/run-supervisor/**` that import dispatch modules or run-supervisor files reachable from Node dispatch (rows above
with "must change by 21" and footprint 20 only, e.g. `test/run-supervisor/bwrap-driver.test.mjs`,
`inspect-recover-adopt.test.mjs`, `direct-cutover.test.mjs`). Phase 21's footprint has no `test/run-supervisor/**`.

Rust proofs that already exist (no second proof): `apps/fgos/tests/cli_tests.rs:4518-4768` (`dispatch decide`,
`dispatch explain`); `packages/execution/rust/tests/golden_{agents,bind,checks,decide,executor_model}.rs`;
`packages/run-supervisor/rust/tests/` (adopt, gate, supervise, lanes, steps_portable, steps_runner,
envelope_digest_vectors, unix_lease_record, head_request). Phase owners extend these before adding files.

## §10 Baselines

- `node scripts/git-one-door-scan.mjs --root .` (read-only; it builds the host into the worktree target):
  **0 undeclared sites**; classes `{"standalone-skill-script":4,"hook-read-context":20,"configured-binary":108,
  "rust-test":173,"production-sandbox-probe":5,"argv-runner":29,"uncalled-wrapper":11,"git-driver":1,"sandbox-door":2}`
  (353 declared sites). Acceptance 8 compares to 0 undeclared.
- Node lines (`wc -l`, `f031ab0c8` vs `b5b237534`):

| dir | files | lines now | lines at plan base |
|---|---|---|---|
| `src/runner/execution/` | 36 | 6 996 | 6 980 |
| `src/runner/dispatch/` (incl. confinement) | 58 | 23 586 | 23 380 |
| of which `src/runner/dispatch/confinement/` | 11 | 6 214 | 5 986 |
| `src/run-supervisor/` | 19 | 2 829 | 2 698 |
| `src/verbs/dispatch/` | 5 | 839 | 817 |
| `src/runner/dispatch.mjs` | 1 | 9 | 9 |
| **total** | **119** | **34 259** | 33 884 |

- `test/suite-baseline.json` (its sha `f6281d298`, 619 files, 6 199 cpu s, 625 wall s; cpu per file, no per-file test
  counts). Shares of the test dirs that retire wholesale: `test/runner/execution/**` 44 files 304.8 s (4.9 %);
  `test/run-supervisor/**` 19 files 208.0 s (3.4 %); `test/runner/dispatch*` 41 files 120.6 s (1.9 %);
  `test/cli/dispatch-*` 4 files 28.0 s (0.5 %); `test/verbs/dispatch-*` 2 files 2.1 s (0.0 %): **110 files, 663.5 s,
  10.7 %**. Switched, not retired: `test/workflow/**` 297.3 s (4.8 %), `test/setup/**` 228.6 s (3.7 %, rows of 15/17).
  All 209 census test files listed in §6 that appear in the baseline: 1 002.0 s (16.2 %).

## Proposed phase-table edits

1. **Deletion order (D1).** Phase 20 deletes only the 23 files of `src/runner/execution/**` and `src/run-supervisor/**`
   that no Node dispatch file imports (§1 rows "deletes 20"); the other 30 are deleted by phase 21 with
   `src/runner/dispatch/**`. Phase 20's step 4 anchored check then cannot be "returns nothing" for those two dirs; move
   that check to 21 (which already runs the full one). Add `src/run-supervisor/**`, `src/runner/execution/**`,
   `test/run-supervisor/**`, `test/runner/execution/**` to phase 21's footprint. Evidence: §1 D1 import list.
   Alternative (not recommended, larger): phase 20 also switches the Node dispatch subs, which is phase 21's job.
2. **Split phase 11** into 11 (session launch, 1 848) and 11b (run inspection, 1 178), both wave 3, 11b depends on 3
   only; 11b footprint `packages/execution/engine/src/transport/inspect/**`, `engine/tests/transport_inspect.rs`,
   `packages/execution/contracts/transport-inspect/**`, `test/golden-recorders/transport-inspect.recorder.mjs`; add 11b
   to 16b's and 21's depends-on and 22's list. Evidence: §1 group 11 = 3 026.
3. **Move `bind.mjs` and `dry-bind.mjs` to phase 16** (planning/bind_facade); phase 18 context drops `dry-bind.mjs`;
   16 = 2 264, 18 = 2 298. Evidence: §1 group 18 = 2 529; `src/runner/dispatch/plan.mjs:22`.
4. **Footprint additions, non-test:** plan footprint and phase 20: `src/session-host/head-request.mjs`,
   `src/session-host/head-stop.mjs` (§2; `c472c1c1d`), and update the collision row "`head-request*.mjs`: S6a does not
   edit them" to "20 edits the four imports at `:25-28` only; later lander rebases" (0947 P5, 1045 P10, 1159 P8). Phase
   21: `src/report/authoritative-match.mjs`, `src/runner/agent-roster.mjs` (comments), 
   `scripts/check-decision-citation-drift.baseline.json` (`:37`). Phase 20: `scripts/git/e3-bench.mjs` (`:297`). Drop
   `src/portfolio/open-questions.mjs` from plan and phase 20 footprints (file gone, `1cabfe384`).
5. **Footprint additions, tests (§6 uncovered table):** phase 20: `test/convention/seat-id.test.mjs`,
   `test/portfolio/work-questions.test.mjs`, `test/seat-binding/client.test.mjs`, `test/live/mailbox-wake-probe.live.mjs`;
   phase 21: `test/config/facade.test.mjs`, `test/git/write-scope-parity.test.mjs`, `test/holder-lock/**` (two files),
   `test/session-identity/attempt-writer-id.test.mjs`, `test/state/work-size-rigor.test.mjs`,
   `test/util/session-identity.test.mjs`, `test/scripts/write-wrapper-script.test.mjs`. Phases 15, 17, 19, 20, 21 add
   `test/architecture.test.mjs` (they edit doors rows, P22; today only 22 holds it) — or the lead names one writer per
   wave, as for the manifest.
6. **Phase 09 context:** drop `usage-parsers.mjs (180)` (deleted, `725522d1e`); phase 07 count 1 712 (not 1 536).
7. **Phase 02 footprint:** `test/runner/capability-config.test.mjs` does not exist (only
   `test/runner/execution/capability-config.test.mjs`); keep it as the move target or drop it.
8. **`move-up?` rows (46, §2):** phase 20 resolves each against principle 7 (addon when the Rust port keeps the rule);
   most are pure helpers already ported in 6/6b/13 (`case-run-paths`, `legacy-seat-read`, `patterns/catalog`,
   `write-scope`, `run-timeout`), so expect them to become `addon`, which grows the addon `execution` namespace list
   in phase 20's requirements (`resolveCollaboration`, `loopOf`, `runDirOf`, `runsRoot`, `isCaseId`, `gateAnswerFile`,
   `seatKeyOf`, `reportDigest`, `checkDeclaredSeats`, `runTimeoutProblem`, `verifyCommandOf`, `verifySeatResult`,
   `parseAccountPin`, `legacyStateKey`, `providerAccountInventory`, ...).
