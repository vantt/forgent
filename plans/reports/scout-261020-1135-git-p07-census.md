# Phase 07 Git caller census

Reproduce: `python3 scripts/git-p07-census.py --report plans/reports/scout-261020-1135-git-p07-census.md`.

5486 candidate lines; source digest `53ebfc27e0fecd9afe2be3affb48751269572b1adbd103106c3894d988dceec4`. Full source snippets and classification: `scout-261020-1135-git-p07-census.json`.

This is a conservative migration checklist, not V-GATE acceptance. All spawn candidates are retained even when the binary is unrelated to Git; wrappers and callers are counted separately. Multiline arguments and variable binaries require manual data-flow review. Empty remaining candidates alone cannot certify the final gate. Generated skill mirrors are listed separately from source. Test/CI locations are sandbox candidates, not automatic exemptions.

The production holder-lock probe exemption is grounded in `packages/holder-lock/rust/src/borrow_vectors.rs`: its `temp_dir()` repository is created by the probe, and its Git binary variable is included here. Hook read context remains classified separately from product writers.

## Family ownership and order

1. Unit core: commit-unit-work.mjs, unit-sync.mjs, execution/run.mjs and partial-writes.mjs; focused execution tests. Shared matcher and definition changes follow serially under the lead.
2. Land cluster: runner/merge.mjs, promote-engine.mjs, github-adapter.mjs. Work event adapter owns state/events-* and main-fgos-checkpoint.mjs; only Land owner edits merge.mjs to call it.
3. Worktree cluster: runner/worktree.mjs, session.mjs, loop.mjs, claim-port.mjs and repo-locks.mjs; merge verbs and bin/fgos.mjs follow once this API settles.
4. Setup owns src/setup/* and .githooks/*; holder listings owns src/holder-lock/*, setup/holder-lock-checks.mjs and Rust holder route (setup hands that one file over). Outer scripts own scripts/* except this census and gate tooling.
5. Readers own remaining src read sites; Workflow owns src/workflow/* (definition.mjs reserved to lead); Rust readers own non-Git packages/apps read sites. Gate owns run-tests/build-distribution and manifest.rs, reserved out of outer/Rust lanes.
6. Lead serializes CHANGELOG, architecture manifest, test ownership, matcher, skill source/renders and final E6 inventory. No simultaneous file ownership; a conflicting file is handed over, never edited concurrently.

**One release:** all sub-lanes integrate into git/p07-switch only. No phase-07 subset reaches main; phase 08 must pass its unchanged proof gates and the owner-scheduled stop-everything landing.

**Work temporary duty:** legacy tracked events, shards and merge=union stay. Work-side adapter uses ScopedCommit/Checkpoint for declared event checkpoint/compaction paths, and declared Land candidates for the sweep; post-CAS changes use a separate declared ScopedCommit/Checkpoint operation, never raw re-stage. Truncation guard remains Work policy outside Git locks. WORK removes the adapter and all legacy duties at Event Store cutover.

## Checklist

### Git driver

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `packages/git/rust/src/driver.rs` | 157, 164, 487, 1022, 1078, 1557, 2525, 2526, 2530, 2531, 2554, 2561, 2565, 2576, 2590, 2635, 2661, 2682, 2725, 2745, 2753, 2764, 2766, 2767, 2782, 2813, 2814, 2827, 2853, 2857, 2917, 2947, 2998, 2999 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/land.rs` | 114 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/native_lock.rs` | 593, 596 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/restore.rs` | 116, 120, 123, 129, 141, 148, 153, 156, 169, 255, 309, 334, 346, 363, 376, 387, 493, 563, 582, 592, 633, 926, 927 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/scoped_commit.rs` | 251, 254, 355, 394, 399, 528, 531, 545, 565, 566, 580, 595, 597, 603, 610, 616, 622, 639, 647, 665, 686, 698, 721, 722, 825, 898, 931, 932, 968, 985, 1026, 1042, 1080, 1084, 1117, 1118, 1136, 1154, 1174, 1225, 1228, 1236, 1259, 1311, 1315, 1346, 1357, 1358 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/sync.rs` | 83, 98, 110, 179, 194, 233, 288, 303, 396, 446, 467, 510, 524, 676, 684, 688, 703, 718, 719, 727, 729, 809, 846, 871, 876 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/wal.rs` | 2559, 2582, 2821, 2978, 2981, 2987, 3010, 3035, 3055, 3075, 3084, 3089, 3094, 3095, 3108, 3113, 3119 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |
| [ ] `packages/git/rust/src/worktree.rs` | 1553, 1565, 1566, 1577 | Git component: private driver/typed port; allowed owner, inspect raw spawn boundary |

### Land/merge/promote

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/runner/github-adapter.mjs` | 40, 49 | Land cluster: Land / Sync / Refs / Worktree; event calls use Work adapter |
| [ ] `src/runner/merge.mjs` | 93, 94, 207, 210, 271, 284, 285, 384, 470, 536, 566, 584, 616, 638, 640, 764, 776, 822, 862, 870, 872, 873, 909, 918, 933, 947, 965, 977, 1012, 1019, 1053, 1063, 1067, 1074, 1136, 1238, 1265, 1286, 1294, 1387, 1389, 1402, 1408, 1459, 1508, 1511, 1524, 1530, 1549, 1564, 1565, 1637, 1679, 1681, 1684, 1687, 1725, 1733, 1746, 1756, 1767 | Land cluster: Land / Sync / Refs / Worktree; event calls use Work adapter |
| [ ] `src/runner/promote-engine.mjs` | 33, 82, 83 | Land cluster: Land / Sync / Refs / Worktree; event calls use Work adapter |

### Node readers

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/cli/version.mjs` | 26 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/intake/plan-verdict-from-plan-md.mjs` | 183, 187, 284 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/intake/plan.mjs` | 111, 129, 139, 145, 332, 339, 620, 840 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/report/capability-plan-lint.mjs` | 163, 194, 606, 765, 838, 845, 862 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/report/context-render.mjs` | 27 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/run-supervisor/cancel-registry.mjs` | 79 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/run-supervisor/client.mjs` | 38 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/run-supervisor/direct-launch.mjs` | 268 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/attestation-guard.mjs` | 15, 16, 64, 71 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/claim-liveness.mjs` | 13, 14, 36, 45, 66 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/assignment-layout.mjs` | 98 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/assignment-runner.mjs` | 920, 1212 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/config.mjs` | 551 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/confinement/probes/harness.mjs` | 29, 84, 121, 173, 226, 277, 347, 383, 429, 486, 518 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/execution-contract.mjs` | 117 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/operation-prompt-templates.mjs` | 115 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/provider-capacity.mjs` | 485, 882, 897 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/provider-credential-probe.mjs` | 96, 128 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/provider-credential-renewal.mjs` | 132, 385, 447, 463, 465, 469, 705, 828 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/reconciliation-planner.mjs` | 49 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/recovery-planner.mjs` | 413 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/resolve.mjs` | 377, 392 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/run-lock.mjs` | 179 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/runtime-inspection.mjs` | 258 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/settlement.mjs` | 141, 163, 183 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/terminal-slot.mjs` | 35 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/transport.mjs` | 137, 391 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/trust-store.mjs` | 158 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/dispatch/worker-session-boot.mjs` | 90 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/execution/unit-run-history.mjs` | 52 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/fanout-batch.mjs` | 92, 94 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/gateway-control.mjs` | 190, 212, 235 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/goal-check.mjs` | 57, 58, 134 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/operation-choice.mjs` | 535, 2053 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/paths.mjs` | 32, 44, 77, 226 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/promote-preflight.mjs` | 12, 13, 26, 49, 50 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/runner/work-dispatch.mjs` | 220 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/cleanup-harness.mjs` | 78, 79, 263, 279, 288, 302, 322 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/drift-status.mjs` | 33, 34, 51, 61, 76, 78, 100, 156, 166 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/postland-drift.mjs` | 20, 21, 26, 76, 86, 87 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/retrospective-doors.mjs` | 152, 159, 164 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/store.mjs` | 619, 629, 652, 1847, 1851 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/state/tool-registry.mjs` | 180 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/terminal-control/client.mjs` | 117, 147 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/util/host-bin.mjs` | 94 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/util/session-identity.mjs` | 121, 224 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/util/third-party/js-yaml.mjs` | 520, 521, 1146, 2495, 3037, 3087, 3110 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/verbs/state/edit.mjs` | 70, 77, 99, 106 | readers: Inspect; unresolved non-Git spawn candidates retained |
| [ ] `src/verbs/state/move.mjs` | 7 | readers: Inspect; unresolved non-Git spawn candidates retained |

### Rust/outer readers

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `apps/fgos-gateway/src/gateway.rs` | 343, 348, 384, 395, 420, 1134, 1376, 1380, 1388, 1392 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `apps/fgos/src/legacy_exec.rs` | 242, 260 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/distribution/rust/src/fetch.rs` | 255 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/distribution/rust/src/git_gate.rs` | 45 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/distribution/rust/src/init.rs` | 368, 571, 1981, 2080 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/distribution/rust/src/lib.rs` | 187 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/distribution/rust/src/workspace.rs` | 32 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/durable-file/rust/src/lib.rs` | 103, 246 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/git/node-addon/examples/e3_fixture.rs` | 54 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/herdr-fgos-common/rust/src/fgos.rs` | 348, 424, 431 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/host-runtime/rust/src/invocation_service.rs` | 1012, 1234, 1258, 1311 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs` | 210, 220, 242, 286 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/observe/rust/src/case_journal.rs` | 120 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/observe/rust/src/metrics_cli/harness.rs` | 184 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/observe/rust/src/sources/claude_transcripts.rs` | 74, 380, 381, 386, 392, 397, 404 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/observe/rust/src/sources/repo.rs` | 20, 39, 53 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/containment/linux.rs` | 50, 128, 244, 530 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/containment/macos.rs` | 45 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/containment/windows.rs` | 86, 91 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/control.rs` | 63, 234 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/facts.rs` | 540 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/mapped.rs` | 134, 146, 254 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/platform/linux.rs` | 580, 581 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/process/rust/src/platform/windows_spawn.rs` | 307 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/examples/gate_agent.rs` | 102, 119 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/src/attempt_step.rs` | 61, 68 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/src/gate/unix.rs` | 524 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/src/gate/windows.rs` | 108, 215 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/src/steps.rs` | 222, 234, 272, 309, 318 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/run-supervisor/rust/src/supervise/windows.rs` | 140 | Rust readers: Inspect; non-Git spawn candidates require triage |
| [ ] `packages/terminal-control/rust/src/driver/herdr.rs` | 218, 226, 227, 250, 283, 370, 388, 538, 592 | Rust readers: Inspect; non-Git spawn candidates require triage |

### Unit commit/sync

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/runner/execution/commit-unit-work.mjs` | 44, 46, 63, 85, 94, 103, 105, 117, 125, 135, 212, 216, 297, 302, 305, 324, 372, 380, 389, 404, 419, 420, 421, 432, 445, 465, 492, 504, 550, 563, 564, 565, 604 | Unit core: ScopedCommit / Sync / Inspect; custody retained |
| [ ] `src/runner/execution/partial-writes.mjs` | 42 | Unit core: ScopedCommit / Sync / Inspect; custody retained |
| [ ] `src/runner/execution/run.mjs` | 116, 127 | Unit core: ScopedCommit / Sync / Inspect; custody retained |
| [ ] `src/runner/execution/unit-sync.mjs` | 3 | Unit core: ScopedCommit / Sync / Inspect; custody retained |

### Workflow

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/workflow/case-admission.mjs` | 173 | Workflow: delete integrate; Inspect and typed ports in callers |
| [ ] `src/workflow/case-start.mjs` | 128 | Workflow: delete integrate; Inspect and typed ports in callers |
| [ ] `src/workflow/dir-guard.mjs` | 24, 25, 26 | Workflow: delete integrate; Inspect and typed ports in callers |
| [ ] `src/workflow/integrate.mjs` | 12, 14, 47, 83, 88, 114, 116, 122, 125, 154, 160, 169 | Workflow: delete integrate; Inspect and typed ports in callers |
| [ ] `src/workflow/seats.mjs` | 45 | Workflow: delete integrate; Inspect and typed ports in callers |
| [ ] `src/workflow/unit-handoff.mjs` | 287, 296 | Workflow: delete integrate; Inspect and typed ports in callers |

### holder listings

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `packages/holder-lock/rust/src/borrow_windows.rs` | 68, 84, 120 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/driver/mod.rs` | 54 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/helper.rs` | 161 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/port.rs` | 871, 1394 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/route.rs` | 544 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/route/hold.rs` | 274, 484 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `packages/holder-lock/rust/src/semantics.rs` | 93, 118, 125, 129 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `src/holder-lock/driver.mjs` | 136, 164, 249, 275 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `src/holder-lock/fences.mjs` | 123, 161, 280, 310, 452 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `src/holder-lock/hold-transport.mjs` | 77, 110 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `src/holder-lock/index.mjs` | 515, 530, 552, 570, 626, 648, 676 | holder listings: parameterize listings; run_borrowed is lower-layer transport |
| [ ] `src/setup/holder-lock-checks.mjs` | 146, 306, 474 | holder listings: parameterize listings; run_borrowed is lower-layer transport |

### outer scripts

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `scripts/build-rust-distribution.mjs` | 172, 174 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/check-decision-citation-drift.mjs` | 126 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/check-locked-decisions-heading-drift.mjs` | 29, 60 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/ci-external-consumer.sh` | 138, 144, 145, 146, 148 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/event-store/v-spawn-bench.mjs` | 34, 44, 45, 49, 60, 63 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/fgos-shell-integration.sh` | 2, 27, 28, 60, 61, 132, 133 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/git/e3-bench.mjs` | 41, 46, 149, 188, 234, 242, 283, 284, 285, 293, 320, 321, 322, 373, 374, 375, 399, 401, 402, 411, 420, 431, 445, 446, 447, 449, 450, 461, 486, 487, 490, 491, 492, 559, 562, 569, 570, 577, 591, 599, 600, 602, 672, 698, 702, 710 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/herdr-cockpit-notify.mjs` | 53, 66 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/knowledge-canary.mjs` | 26, 30, 36, 39, 40, 43, 61, 64, 67 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/knowledge-migration.mjs` | 284, 288, 292 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/lib/test-file-watchdog.mjs` | 29, 39, 98, 113 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/lib/test-git-config-guard.mjs` | 2 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/measure-coordination-baseline.mjs` | 321, 322, 331 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/measure-p08-performance.mjs` | 40 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/measure-verify-cost.mjs` | 24 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/next-doc-id.mjs` | 22 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/package-release-assets.mjs` | 63 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/prepare-release.mjs` | 14, 59, 115, 142 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/probe-storytelling-material.mjs` | 25 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/regenerate-observe-fixtures.mjs` | 31, 41, 42, 48, 218, 248, 273, 298 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/run-rust-dev-host.mjs` | 51, 116 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/run-tests.mjs` | 54, 88, 95, 104, 264, 449 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/stress-test-files.mjs` | 34, 63, 88 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-proof-inventory.mjs` | 58, 88, 290, 301 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-select-compare.mjs` | 53, 72, 77, 206, 297 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-select-coverage-map.mjs` | 258 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-select-mutate.mjs` | 114, 134, 237, 248, 263, 279 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-select-promote-report.mjs` | 113 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-select.mjs` | 80, 92, 93, 94, 95 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/test-timing.mjs` | 37, 59, 64, 153, 206, 243 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |
| [ ] `scripts/verify-fanout-overlap.mjs` | 32 | outer scripts: typed ports or named sandbox setup; non-Git candidates retained |

### production sandbox probe

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `packages/holder-lock/rust/src/borrow_vectors.rs` | 78, 183, 218, 415 | holder listings: named exemption: own temp_dir repository, verify below |

### sandbox/test

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `.github/workflows/ci.yml` | 27, 30, 46, 48, 49, 50 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `.github/workflows/release-assets-check.yml` | 47, 49, 50 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `.github/workflows/selector-nightly.yml` | 21, 34, 36, 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgctl/tests/git_wal_activation_gate.rs` | 37, 66, 80, 132, 136, 160, 166, 173, 179, 248, 288, 313 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/cli_tests.rs` | 108, 129, 162, 190, 220, 268, 296, 335, 369, 397, 431, 467, 523, 571, 629, 662, 718, 777, 831, 912, 989, 1071, 1148, 1190, 1303, 1309, 1364, 1371, 1405 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/internal_lock_routes.rs` | 42, 175, 200, 350, 370, 387, 394, 443 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/windows_borrow.rs` | 26, 55, 61, 80, 99, 104, 171, 184, 185, 199, 209, 228, 286 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/windows_lock_hold_route.rs` | 53, 87, 94, 99, 112, 117, 122 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/windows_predecessor_stress.rs` | 174 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/windows_semantics_probe.rs` | 27 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `apps/fgos/tests/windows_support/mod.rs` | 143, 151 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/distribution/rust/tests/activation_lock_multiprocess.rs` | 44, 45, 53, 98, 132, 157, 176 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/distribution/rust/tests/fetch_download.rs` | 141 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/distribution/rust/tests/install_lock_multiprocess.rs` | 43, 44, 52, 97 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/durable-file/rust/tests/install.rs` | 53, 121 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/common/mod.rs` | 34 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/kill_append.rs` | 12, 21, 25, 157, 163 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/legacy_import.rs` | 12, 13, 27, 28, 36, 38, 40, 115, 126, 150, 157, 158, 203, 204 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/offline_sync.rs` | 27, 28, 39, 51, 61, 64 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/reader_review_regressions.rs` | 312, 657 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/reader_seal_stress.rs` | 136, 174, 225 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/reader_support/mod.rs` | 32, 61, 299 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/registry_identity_layout.rs` | 14, 15, 33, 231, 247, 254, 293 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/seal_cas_race.rs` | 67 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/seal_publication.rs` | 265, 380, 730, 899, 907, 923 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/setup_identity.rs` | 20 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/shared_machine_id.rs` | 18, 24, 31 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/sync_review.rs` | 36, 45, 79, 90, 130, 193, 200, 209, 215, 223, 262, 309, 318, 332 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/sync_support/mod.rs` | 22, 23, 51, 56, 160 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/three_clones.rs` | 35, 42, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/event-store/rust/tests/v_event.rs` | 56, 63, 67, 71, 94, 113, 129, 132, 146, 163, 184, 185, 186, 190, 194, 197, 210, 260, 264, 273, 290, 297, 301 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/borrow_deadline.rs` | 21, 33, 34, 35, 36, 37, 40, 41, 42, 43, 47, 101, 151 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/contracts.rs` | 20, 40 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/head_tree.rs` | 4, 5, 27, 58, 59, 71, 120, 132, 133 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/inspect.rs` | 4, 5, 23, 34, 35, 45, 46, 47, 49, 50, 51, 139, 168, 184, 202, 218, 220, 221, 222, 223, 224, 225, 226, 237, 264 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/land.rs` | 14, 34, 46, 73, 107, 162, 179, 215, 216, 249, 269, 329, 373, 375, 440, 449, 451, 474, 476 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/land_crash_matrix.rs` | 35, 82, 87, 144, 145, 163, 167, 187, 188, 190, 195, 196, 198, 199, 200, 274, 307, 328, 344, 356, 367, 381, 390, 407, 413, 442, 467, 491, 492, 493, 495, 496, 497, 519, 533, 711, 721, 722, 724, 725, 726, 776, 786, 804, 806, 807, 808, 820, 838, 922, 925, 926, 927, 928, 968, 1000, 1001, 1002, 1004, 1005, 1006, 1035, 1055 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/publication.rs` | 29, 30, 44, 186, 200, 228, 229, 303, 304, 338, 492, 564, 569, 659, 681, 742, 761, 767, 779, 787, 795, 864, 969, 970, 1013, 1162, 1174, 1180, 1199, 1255, 1262, 1271, 1568, 1572, 1580, 1735, 1740, 1799, 1808, 1826, 1842, 1896, 1993, 2013, 2182, 2186, 2199, 2200, 2201, 2203, 2204, 2217, 2219, 2220, 2221, 2222, 2223, 2224, 2225, 2227, 2240, 2244 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/recovery_matrix.rs` | 266, 271, 287, 306, 481, 496, 512, 517, 530, 543, 552, 708, 710, 711, 742 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/refs_remote.rs` | 22, 23, 46, 57, 58, 60, 61, 62, 64, 65, 91, 95, 125, 142, 159, 166, 185, 196, 214, 229, 230, 330, 339, 369, 393, 396, 420, 457, 464, 466, 476, 479, 480, 487, 488, 489, 493, 494, 495, 510, 519, 528, 538, 542, 544, 577, 579, 584, 608, 612, 631, 649, 660, 668, 714, 756, 757, 761, 766, 823, 850, 851, 853, 858, 894, 914, 918, 1012 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/repository_config.rs` | 17, 35, 46, 61, 89, 153, 158, 240, 286, 301, 309, 322, 326 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/safe_restore.rs` | 18, 30, 36, 42, 74, 147, 152, 238, 260, 290, 339, 353, 357, 358, 359, 360, 418, 419, 420, 422, 423, 424, 450, 452, 453, 454, 480, 484, 485, 493, 494, 496, 497, 498, 508, 547, 592, 741, 763, 764, 765, 766, 767, 777, 778, 779, 780, 781 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/scoped_commit_sync.rs` | 12, 13, 46, 47, 48, 50, 51, 53, 130, 144, 158, 166, 173, 174, 175, 176, 201, 238, 287, 288, 289, 290, 323, 325, 357, 358, 423, 452, 499, 501, 511, 519, 534, 617, 619, 620, 623, 624, 626, 660, 668, 682, 687, 699, 703, 786, 788, 789, 791, 795, 797, 802, 816, 823, 831, 832, 833, 836, 837, 840, 843, 877, 878, 880, 1020, 1021, 1023, 1039, 1041, 1042, 1043, 1044, 1052, 1053, 1067, 1068, 1070, 1071, 1072, 1096, 1099, 1177, 1193, 1194 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/support/land.rs` | 9, 10, 42, 43, 44, 49, 50, 51, 52, 54, 55, 56 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/support/signing.rs` | 4, 19 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/git/rust/tests/worktree.rs` | 26, 27, 49, 51, 52, 57, 58, 64, 169, 215, 225, 480, 491, 495, 513, 548, 558, 576, 590, 594, 614, 623, 632 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/borrow_git.rs` | 26, 47, 59, 88, 89, 91, 99, 119, 139 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/borrow_io.rs` | 70, 105, 131, 244, 263, 264, 304, 413, 506, 510, 513, 566, 567, 647, 650, 680, 711, 712, 745, 762 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/common/mod.rs` | 66, 75, 116, 121 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/scope_rank.rs` | 136 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/stress.rs` | 37, 55 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/holder-lock/rust/tests/windows_lockfileex.rs` | 106, 129, 134 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/host-runtime/rust/tests/external_process_tests.rs` | 445, 629 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/observe/rust/tests/boundary_test.rs` | 5 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/observe/rust/tests/eval_journal_test.rs` | 222, 291, 296, 438, 697, 702, 748, 752 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/observe/rust/tests/store_lock_multiprocess.rs` | 89, 90, 102, 120, 135, 151, 166, 184 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/containment_bwrap.rs` | 125, 126, 160, 166, 223 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/containment_macos.rs` | 51 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/containment_spawn_timeout.rs` | 39, 69 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/containment_windows.rs` | 49, 124, 144, 200, 252 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/holders_multiprocess.rs` | 60, 68, 126, 131 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/signal_identity.rs` | 14, 31, 83 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/spawn_fds_leak.rs` | 28, 32, 37, 73, 120, 140, 144, 154, 158, 175 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/windows_job_domain.rs` | 36, 68, 74, 123, 128, 134, 140 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/process/rust/tests/windows_spawn.rs` | 103, 116, 128, 142, 155 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/fixtures/noisy-agent.mjs` | 29, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/gate_pid1.rs` | 238 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/portable/mod.rs` | 176, 210 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/portable/supervisor.rs` | 172, 198, 226 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/supervise_guard.rs` | 32 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs` | 259 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/support/adopt_fixture.rs` | 142, 151, 191 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/support/supervisor.rs` | 172 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/run-supervisor/rust/tests/support/terminal.rs` | 68, 95, 98 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/terminal-control/rust/tests/core_failures.rs` | 11 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `packages/terminal-control/rust/tests/herdr_driver_fake.rs` | 256, 261 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/architecture.test.mjs` | 297 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/dir-differs-from-cwd.test.mjs` | 25, 26, 27, 29, 30, 38, 54, 57 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/dispatch-inspect.test.mjs` | 11 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/dispatch-operability.test.mjs` | 13, 21 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/dispatch-reconcile.test.mjs` | 10 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/dispatch-retired-doors.test.mjs` | 21, 35, 147 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/execution-outcome-exit-codes.test.mjs` | 20, 21, 22, 25, 26, 32, 126, 153, 207, 231, 245, 270, 295, 304 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-approve.test.mjs` | 163 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-case-doors.test.mjs` | 20, 21, 24, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-claim-2.test.mjs` | 328, 430, 431, 452, 453 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-claim.test.mjs` | 111, 114, 123, 327, 434, 511, 512, 513, 569, 570, 571, 580, 622, 689 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-disconnected-worktree-guard.test.mjs` | 42, 43, 44, 47, 48, 58, 86, 97, 112, 152, 177, 192, 208, 223, 246, 261, 280 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-edit.test.mjs` | 325, 342 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-gateway.test.mjs` | 30 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-help.test.mjs` | 33 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-lock-fence.test.mjs` | 32, 71, 170, 171, 179, 212 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-manifest.test.mjs` | 30 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-merge.test.mjs` | 379, 681, 1242, 1259, 1275, 1294, 1316 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-post-merge.test.mjs` | 132, 133 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-preflight.test.mjs` | 70, 71, 149 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-return.test.mjs` | 256, 257, 290, 291, 309, 419, 487, 488, 499, 526, 527, 541, 542, 586, 587, 604, 605, 606, 609, 610, 622, 623, 624, 627, 628, 642, 643, 644, 647, 648, 857, 858, 1007, 1008, 1022, 1023, 1050, 1051, 1197, 1198, 1219, 1220, 1239, 1240 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-stage-3.test.mjs` | 236 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-stage.test.mjs` | 117, 148 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-stale-orphaned-runs.test.mjs` | 22 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-tool.test.mjs` | 22 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-verb-help-json.test.mjs` | 33, 178, 185 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-version.test.mjs` | 26, 52 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/fgos-workflow.test.mjs` | 15, 70, 71, 76, 93, 94, 97, 118, 119, 121 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/helpers/fgos-cli-harness.mjs` | 123, 271, 272, 273, 276, 277, 283, 284, 285, 288, 289, 294, 301, 307, 321, 322, 323, 326, 327, 338, 339, 349, 350, 351, 355, 436, 594, 595, 596, 599, 600, 606, 607, 608, 611, 612, 617, 637, 638, 654, 962, 963, 1078, 1079, 1080, 1103, 1104, 1105, 1108, 1109, 1156, 1161 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/invocation-fault-log.test.mjs` | 23, 37, 38, 39, 41, 42, 57, 171, 183 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/knowledge-attest-gate.test.mjs` | 13, 14, 15, 19, 37, 38, 39, 44, 54, 58, 67, 76, 80, 90, 94, 101, 117, 119, 125, 126, 130, 132 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/knowledge-deprecation.test.mjs` | 13, 14, 15, 19, 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/knowledge-verbs.test.mjs` | 12, 13, 14, 19, 31, 36, 43, 50, 56, 69, 72, 78, 86, 94, 97, 102, 116, 119, 126, 134, 141, 152, 155, 165, 175, 181, 191, 198, 203, 206, 209 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/plan-lint.test.mjs` | 31 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/run-verb.test.mjs` | 20, 21, 22, 25, 33, 86, 94, 104, 137, 164, 178, 232, 235, 262, 335, 370, 373, 415 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/subcommand-flag-drift.test.mjs` | 154, 290 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/take-pick-claim-eligibility.test.mjs` | 29, 42, 43, 44, 47, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/unknown-flag-rejection.test.mjs` | 46, 61, 67, 95, 100 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/cli/version-no-git-noise.test.mjs` | 22 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/direct/merge-gate.test.mjs` | 11, 31, 32, 33, 34, 40, 41, 43, 45, 47, 48, 49, 54, 55, 56, 58, 59, 60, 77, 81, 95, 96, 97, 99, 100, 103, 104, 106, 107, 108, 109, 115, 124, 125, 126, 127, 129, 130, 132, 133, 134, 162, 163, 164, 165, 167, 168, 177, 189, 190, 191, 192, 194, 212, 213, 214, 215, 218, 219, 221, 222, 223, 238, 242, 249, 250, 251, 253, 254, 256, 257, 259, 260, 261, 262, 279, 287, 288, 289, 290, 292, 293, 295, 296, 297, 315, 316, 317, 318, 322, 323, 324, 325, 327, 328, 329 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/distribution/native-addon.test.mjs` | 50, 121 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/distribution/source-payload.test.mjs` | 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/coexistence-canary.test.mjs` | 83, 84, 85, 87, 88, 116, 267, 285, 306, 307, 331, 335 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/compound-learn-lifecycle.test.mjs` | 27, 28, 29, 32, 33, 38, 41, 42, 72, 73 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/domain-aware-stage-literals.test.mjs` | 47, 48, 49, 51, 52, 57, 61, 124, 135, 431, 439 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/fixture-marketing-domain.test.mjs` | 63, 64, 65, 67, 68, 73, 343, 344 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/main-checkout-activity-beacon.test.mjs` | 22, 64, 65, 68, 69, 85, 87 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/main-checkout-borrow-hook.test.mjs` | 49, 57, 62, 68, 69, 73, 83, 84, 88, 93, 118, 120, 124, 182, 206, 219 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` | 46, 47, 48, 62, 63, 71, 79, 80, 133, 136, 137, 138, 139, 140, 180, 181, 208, 217, 302, 304, 315, 317, 338, 340, 350, 352, 363, 365, 384, 385, 388, 390, 403, 404, 407, 409, 418, 419, 422, 424, 433, 435 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/main-checkout-lock-hook.test.mjs` | 19, 27, 69 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/pr-gate.test.mjs` | 54, 55, 56, 59, 60, 65, 69, 209, 210, 214, 224, 225, 230, 243, 330, 331, 346, 376, 377, 424, 425, 448, 471, 473, 474, 475, 496, 498, 499, 500, 557, 559, 560, 561, 572, 584, 592 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/rebuild-determinism.test.mjs` | 27 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/resync-worktree-bare-invocation.test.mjs` | 36, 37, 38, 48, 49, 53, 72, 73, 82, 85, 86, 87, 88, 89, 99, 119 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/root-file-guard-hook.test.mjs` | 22, 28, 29, 30, 35, 36, 47, 48, 68, 70, 71, 73, 75, 76, 78, 80, 82, 88, 90, 91, 93, 99, 101, 107, 109, 115, 117, 119, 127, 129, 134, 136, 141, 142, 144, 145, 146, 147, 148, 149, 151, 153, 154, 163, 165, 172, 174, 179, 181, 182, 183, 185, 189, 217, 219, 220, 221, 223, 235, 243, 245 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/runner-loop.test.mjs` | 47, 48, 49, 51, 52, 57, 61, 171, 175, 176, 185, 202, 234, 286, 519, 613, 686, 687, 714, 738, 739, 979, 980, 1045, 1067, 1087, 1098 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/self-improve-loop.test.mjs` | 46, 47, 48, 51, 52, 59, 61, 65, 116, 117, 121, 129, 130, 135, 149 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/e2e/synthetic-domain.test.mjs` | 56, 57, 58, 60, 61, 66, 70, 131, 142, 215, 218 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/consumers.test.mjs` | 31, 42 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/export-legacy-parity.test.mjs` | 14, 15, 16, 17, 18, 35, 36, 38, 72, 73 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/facade.test.mjs` | 21, 22, 23, 90, 92, 99, 118, 119, 123, 161 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/gate-probe.mjs` | 15, 16, 36 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/migrate-cutover-grant.test.mjs` | 41, 46, 52, 60, 69, 83, 84, 87, 90, 92, 97, 99, 107, 108, 119, 120, 129, 138, 139 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/migrate.test.mjs` | 27, 41, 42, 46, 49, 51, 55, 68, 80, 87, 94, 101, 105, 108, 111, 136, 138, 139, 140, 141, 153, 156 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/no-spawn-in-gate.test.mjs` | 14, 20, 25 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/phase07-fixture.mjs` | 15, 16, 17, 18, 28 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/phase08-fixture.mjs` | 16 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/platform-refusal.test.mjs` | 19 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/rollback-export.test.mjs` | 24, 38, 42, 44, 48, 52, 53 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/event-store/verbs.test.mjs` | 24, 25, 86, 94, 96, 97, 99, 100, 102 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/commit-parent-death.test.mjs` | 24, 25, 26, 27, 28, 30, 36, 64, 78, 79 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/cutover-grant.test.mjs` | 16, 19, 24, 26, 29, 34, 41, 42, 43, 50, 51, 55, 57, 58 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/inspect.test.mjs` | 18, 20, 23, 24, 25, 35 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/land-fixture.mjs` | 13, 14, 15, 16 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/land-recovery.test.mjs` | 14, 25, 29, 43, 61, 94, 102 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/land.test.mjs` | 13, 14, 15, 17, 19, 29, 36, 42, 76, 79, 84, 85, 86, 94, 102, 103, 108, 115, 117, 118, 130, 132, 139, 140, 147, 148, 151, 159, 161, 162, 179 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/lock-handover.test.mjs` | 28, 41, 50, 51, 52, 60, 65, 69 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/native-load.test.mjs` | 32, 50, 51, 62, 77, 119, 127, 130, 139, 140, 141, 142, 150, 152, 161, 164, 179, 180, 181, 182, 229, 230, 231, 232, 233, 239, 240, 242, 246, 259, 260, 267, 273, 279, 280, 285, 287, 293, 294, 296, 299, 348 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/refs.test.mjs` | 16, 19, 20, 21, 22, 32, 39, 45 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/remote.test.mjs` | 14, 16, 17, 24, 27, 29, 32, 34 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/repository-config.test.mjs` | 19, 24, 27 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/safe-restore.test.mjs` | 15, 19, 23, 26, 33, 58, 60, 61, 68, 69, 70 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/scoped-commit.test.mjs` | 16, 17, 18, 19, 33, 39, 43, 46, 51, 54, 61, 72, 74, 75, 77, 89, 92, 93, 94, 98, 106, 135, 136, 139, 147, 156, 158, 159, 164, 168, 185, 194, 198, 202, 212, 213, 215, 226, 227, 240, 260, 263, 272, 276, 277, 295, 298, 299 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/sync.test.mjs` | 14, 15, 16, 17, 18, 25, 27, 30, 45, 55, 64, 66, 71, 80, 84, 85, 101, 102 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/worktree-fixture.mjs` | 12, 13, 14, 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/worktree-recovery.test.mjs` | 43, 45, 46 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/git/worktree.test.mjs` | 35, 36, 46, 118, 121, 122, 123, 133, 134, 136, 139, 156, 175, 177, 187 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/fake-herdr-pane.mjs` | 133, 149 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/fixture-dir.test.mjs` | 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/git-addon.mjs` | 27, 32 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/herdr-pane-model.mjs` | 96 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/hold-lock-in-child.mjs` | 20 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/hold-state-lock-in-child.mjs` | 24 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/main-checkout-hook-repo.mjs` | 21, 30, 31, 40, 41, 42, 43, 45, 46, 57, 82, 83, 87 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/helpers/workflow-fixture-repo.mjs` | 36, 37, 38, 41, 42, 51 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/driver-unavailable.test.mjs` | 46 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/facade-multiprocess.test.mjs` | 60, 136, 213 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fences-main-door.test.mjs` | 32, 33, 40, 41, 42, 144, 154, 155, 165, 169, 171, 172, 175 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fences-rust-locks.test.mjs` | 16, 35, 36, 42, 43, 44, 122, 141, 161 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fences-stop-check.test.mjs` | 47, 48, 64 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fences-v1-ledger.test.mjs` | 115, 146 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fences-v1-tombstone.test.mjs` | 29, 30, 37, 38, 40, 57 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/fixtures/extract-v1.mjs` | 33, 35, 36, 83 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/hold-transport-borrow.test.mjs` | 26, 38, 50 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/run-borrowed-git.test.mjs` | 21, 29, 30, 37, 38, 39, 40, 43, 44, 47, 109, 120, 129, 133, 135, 161, 171, 184, 192, 198, 209, 227, 246, 247 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/state-root.test.mjs` | 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/windows-borrow.test.mjs` | 21, 35, 36, 43, 44, 45, 46, 48, 49, 73, 99 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/windows-facade.test.mjs` | 40, 61, 76, 184 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/holder-lock/windows-hot-lock.test.mjs` | 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/install-packaging.test.mjs` | 8, 85, 96, 150 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/install/install-ps1.test.mjs` | 18, 29, 50, 224 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/install/install-sh.test.mjs` | 20, 24, 55, 141, 169, 283 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/intake/discovery.test.mjs` | 214, 215, 216, 218, 219, 256, 257 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/intake/plan.test.mjs` | 1295, 1296, 1297, 1299, 1300, 1357, 1358, 1381, 1382 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/plugins/terminal-skill-attach.test.mjs` | 69, 74, 152 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/process/process-facts-vectors.test.mjs` | 114, 138 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/report/authoritative-match.test.mjs` | 28 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/report/capability-plan-lint.test.mjs` | 708 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/report/context-render.test.mjs` | 27, 313 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/report/decision-index.test.mjs` | 33 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/report/enduser-index.test.mjs` | 36, 230 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/attempt-steps.test.mjs` | 176, 303, 307 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/bwrap-driver.test.mjs` | 67, 70, 77, 98 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/cancel-registry.test.mjs` | 25 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` | 37, 190, 201, 365 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/direct-crash-matrix.test.mjs` | 250 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/fixtures/direct-agent.mjs` | 12, 36 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/inspect-recover-adopt.test.mjs` | 85 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/resume-adopts.test.mjs` | 30, 38, 71, 134, 135, 146 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/support/direct-harness.mjs` | 24, 49, 56, 57, 58, 60, 61, 130 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/support/terminal-harness.mjs` | 54, 70, 71, 72, 73, 75, 76, 102, 132, 180, 249 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/sweep.test.mjs` | 96, 122, 148 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/terminal-cutover.test.mjs` | 170 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/terminal-fallback.test.mjs` | 38, 128 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/run-supervisor/terminal-groups.test.mjs` | 50 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/assignment-cwd-mutex-concurrency.test.mjs` | 79, 248 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/assignment-dispatch.test.mjs` | 32, 52, 105, 460, 461, 467, 500, 507, 1190, 1191, 1192, 1194, 1195, 1351, 1380, 1492, 1568, 1599, 1951, 2017, 2427, 2428, 2429, 2431, 2432, 2575, 2576, 2577, 2579, 2580, 2616, 2617, 2618, 2620, 2621, 2622, 2625, 2626, 2627, 2629, 2630, 2631, 2641 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/assignment-enumerator-guard.test.mjs` | 246, 252, 258, 301 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/assignment-runresult.test.mjs` | 367, 368, 369, 371, 372, 613, 614, 615, 617, 618, 648, 649, 650, 652, 653, 718, 809, 810, 811, 813, 814, 982, 983, 984, 986, 987, 1216, 1217, 1218, 1220, 1221, 1222, 1238, 1239, 1299, 1300, 1301, 1303, 1304, 1305, 1321, 1322, 1375, 1376, 1377, 1379, 1380, 1606, 1607, 1608, 1610, 1611, 1616, 1658, 1659, 1660, 1662, 1663, 1737, 1738, 1739, 1740, 1741, 1744, 1745, 1756, 1764, 1767, 1768, 1769, 1790, 1792, 1793, 1799, 1800, 1801, 1802, 1809, 1816, 1817, 1820 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/attestation-guard.test.mjs` | 11, 12, 17, 18, 19, 21, 22, 67, 69, 71, 72, 92, 102, 104, 105, 124, 126, 147, 151, 153, 154 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/claim-capacity-race.test.mjs` | 22, 23, 24, 25, 27, 28, 41, 125, 134, 135, 136, 145 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/claim-liveness.test.mjs` | 20, 21, 22, 24, 25, 37, 38, 57, 71, 108, 141, 161 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/claim-port.test.mjs` | 27, 42, 43, 44, 46, 47, 56, 57, 189, 190, 227, 228, 253, 254, 255, 641, 642, 644, 658, 659, 662 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/cli-spawn-reconciliation.test.mjs` | 257 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/concurrent-claim-eventlog-loss.test.mjs` | 48, 49, 50, 53, 54 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/custody-lease-commit.test.mjs` | 26, 27, 28, 29, 30, 32, 34, 38, 58, 83, 87 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/custody-successor-admission.test.mjs` | 70, 96, 103, 177, 181, 188, 191 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-assignment-id-claim-concurrency.test.mjs` | 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-confinement-authority.test.mjs` | 782, 998 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-confinement-backend-p03.test.mjs` | 79, 837, 1276, 1283, 1285, 1286, 1287, 1288, 1289, 1317, 1325, 1326 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-confinement-blind.test.mjs` | 37, 58, 59, 79, 83, 84, 154, 155, 156, 179, 184 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-confinement-credential-hygiene.test.mjs` | 136 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-confinement-p04.test.mjs` | 38 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-execute-effort.test.mjs` | 83, 84, 85, 87, 88, 204, 265, 266, 267, 270, 271, 274, 300, 308, 311, 312, 323, 326, 335, 338, 339, 352, 358, 373, 374, 376, 377 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-execute-for-capability.test.mjs` | 31, 32, 33, 35, 36 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-governance-operability.test.mjs` | 36, 44, 77 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-i08b-remediation.test.mjs` | 34 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-operability-production-door.test.mjs` | 25, 80, 139, 153, 330 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-production-call-sites.test.mjs` | 59, 60, 61, 62, 257, 262 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-reconciliation-concurrency.test.mjs` | 26 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-reconciliation-import-graph.test.mjs` | 63, 153, 285, 320, 325, 415, 501, 554 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-stray-write-attribution.test.mjs` | 44, 45, 52, 53, 63, 64, 65, 67, 68, 69, 102, 163, 164, 165, 167, 168, 201, 202 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-trust-store.test.mjs` | 324, 325, 327 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch-worker-home.test.mjs` | 163, 165 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch.test.mjs` | 62, 63, 64, 66, 67, 68, 1075, 1239, 1264, 1939, 1940, 1941, 2805, 2818, 2845, 2859, 2879, 2889, 2918, 2938, 2959, 2979, 3771, 4640, 4699, 4716, 4765, 4771, 4787 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/dispatch/worker-env-case-context.test.mjs` | 35 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/driver-rununit.test.mjs` | 31, 52, 53, 58, 59, 60, 68, 69, 159, 305, 307, 311, 313, 314, 376, 392, 475 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/driver-unit-fixture.helper.mjs` | 39, 41, 42, 43, 44 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/effective-execution-contract.test.mjs` | 30, 31, 32, 34, 35, 140 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/commit-unit-work.test.mjs` | 13, 14, 20, 21, 22, 23, 25, 26, 35, 36, 37, 38, 47, 60, 76, 85, 86, 97, 116, 131, 229, 247, 253, 261, 262, 276, 278, 279, 287, 296, 306, 316, 320, 321, 329, 365, 369, 389, 396, 397, 401 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/partial-writes.test.mjs` | 21, 22, 23, 24, 26, 27, 28, 36, 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/run-case-admission.test.mjs` | 37, 50, 51, 52, 53, 55, 56, 58, 262 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/run-posture.test.mjs` | 34, 50, 73, 74, 75, 76, 78, 79, 81 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/run-provider-failover.test.mjs` | 35, 71, 90, 91, 92, 93, 95, 96, 98 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/run-sync.test.mjs` | 23, 33, 87 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/execution/run.test.mjs` | 28, 29, 30, 34, 35, 104, 312, 519, 869, 890, 900, 901, 902, 911, 920, 922, 937, 980, 1525, 1556 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/fanout-batch-runner-commit.test.mjs` | 30, 31, 32, 34, 35, 73, 95, 103, 104, 139, 149, 164 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/gateway-control.test.mjs` | 52, 60, 76, 123, 188, 229, 303, 349, 423 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/github-adapter.test.mjs` | 18 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/herdr-private-home-trust.test.mjs` | 108, 109, 110, 111, 113, 114, 116 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/land-vs-manual-commit.test.mjs` | 23, 25, 26, 27, 31, 53, 56, 79, 85, 86, 123, 138, 139, 146, 147, 148, 155, 163, 171, 172, 177, 184, 205, 212 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/lock.test.mjs` | 25, 26, 27, 29, 30, 57, 129, 211 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/loop-rununit.test.mjs` | 30, 34, 35, 36, 38, 39, 98, 130, 143, 144, 204, 206, 207, 208, 218, 230, 331, 341, 361 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/loop.test.mjs` | 70, 71, 72, 74, 75, 276, 307, 308, 320, 356, 725, 931, 958, 959, 1050, 1092, 1204, 1332, 1333, 1356, 1357, 1426, 1427, 1480, 1481, 1497, 1498, 1606, 1617, 1926, 2268, 2269, 2271, 2272, 2273, 2297, 2298, 2300, 2301, 2309, 2310, 2311, 2342, 2441, 2443, 2444, 2445, 2457, 2515, 2517, 2518, 2519, 2531, 2585, 2587, 2588, 2589, 2601, 2660, 2715, 2793, 2794, 2804, 2847, 2877, 2905, 2933, 2934, 3094, 3095, 3218, 3266, 3307, 3332, 3386, 3429 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/merge-quoted-paths.test.mjs` | 23, 24, 30, 31, 32, 44, 45, 52, 55, 57, 72, 81, 116, 120, 122, 148, 151 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/merge.test.mjs` | 43, 44, 45, 47, 48, 52, 53, 57, 61, 63, 64, 65, 77, 113, 115, 137, 138, 151, 152, 154, 155, 173, 214, 217, 218, 219, 225, 229, 230, 231, 238, 240, 261, 262, 272, 273, 290, 291, 367, 368, 369, 385, 417, 434, 468, 484, 485, 487, 489, 490, 491, 493, 494, 529, 555, 557, 569, 572, 602, 603, 605, 608, 609, 610, 614, 615, 643, 644, 646, 654, 655, 656, 660, 661, 686, 687, 689, 692, 693, 694, 698, 699, 713, 727, 728, 730, 733, 734, 735, 739, 740, 756, 757, 759, 761, 762, 763, 766, 767, 782, 783, 785, 787, 788, 789, 792, 793, 796, 802, 810, 811, 813, 817, 818, 819, 824, 825, 876, 918, 1091, 1104, 1108, 1109, 1145, 1146, 1151, 1174, 1204, 1205, 1212, 1244, 1247, 1248, 1249, 1272, 1273, 1299, 1300, 1306, 1307, 1309, 1310, 1312, 1313, 1314, 1318, 1319, 1359, 1360, 1363, 1365, 1366, 1369, 1370, 1371, 1377, 1378, 1410, 1411, 1415, 1417, 1418, 1420, 1421, 1422, 1428, 1429, 1478, 1479, 1481, 1483, 1484, 1486, 1491, 1492, 1502, 1503, 1505, 1506, 1507, 1515, 1516, 1559, 1560, 1564, 1565, 1566, 1568, 1569, 1571, 1608, 1609, 1612, 1614, 1615, 1617, 1622, 1623, 1652, 1653, 1659, 1661, 1662, 1665, 1666, 1667, 1671, 1672, 1700, 1701, 1704, 1706, 1707, 1708, 1713, 1714, 1746, 1747, 1750, 1756, 1757, 1762, 1764, 1766, 1771, 1772, 1818, 1822, 1824, 1825, 1830, 1832, 1833, 1835, 1850, 1858, 1860, 1862, 1863, 1868, 1881, 1898, 1899, 1900, 1902, 1903, 1922, 1924, 1925, 1926, 1938, 1939, 1940, 1942, 1943, 1946, 1969, 2031, 2033, 2034, 2035, 2039, 2040, 2054, 2055, 2069, 2071, 2072, 2073, 2076, 2077, 2091, 2093, 2094, 2095, 2296, 2298, 2299, 2302, 2329, 2331, 2332, 2345, 2346, 2349, 2351, 2353, 2356, 2359 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/operation-choice.test.mjs` | 55, 56, 57, 59, 60, 94, 1526, 2975, 3403, 3405, 3526, 3528, 3529, 3530, 3648, 3650, 3651, 3652, 4278, 4280, 4281, 4282, 4556, 4587, 4617, 4619, 4620, 4621 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/operation-prompt-templates.test.mjs` | 783 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/paths.test.mjs` | 22, 23, 24, 26, 27 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/process-identity.test.mjs` | 27 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/promote-engine.test.mjs` | 18, 19, 20, 22, 23, 27, 28, 32, 34, 35, 36, 49, 50, 56, 60, 73, 81, 87, 88, 97, 105, 133, 141 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/promote-preflight.test.mjs` | 16, 17, 18, 21, 22, 27, 32, 34, 35, 36, 75, 84, 94, 100, 124, 125, 126, 130, 131, 132 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/prompt-templates.test.mjs` | 208 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/provider-auth-failure.test.mjs` | 96, 97, 99, 113 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/provider-capacity.test.mjs` | 184, 460, 810, 815, 856 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/provider-credential-probe.test.mjs` | 134 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/provider-credential-renewal.test.mjs` | 100, 101, 349 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/repo-locks-multiprocess.test.mjs` | 39, 116, 117, 118 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/run-lock-identity.test.mjs` | 32 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/run-result-source-scan.test.mjs` | 57, 66, 82, 94, 113 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/session.test.mjs` | 27, 28, 29, 31, 32, 45, 46, 47, 51, 52, 76, 92, 93, 94, 99, 115, 119, 192, 207, 282, 335, 374, 397, 508 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/spawn-worker.test.mjs` | 28, 57, 58, 59, 61, 62, 66, 155, 156, 157, 165, 175, 181, 198, 205, 256, 271 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/work-path-case-admission.test.mjs` | 21, 25, 26, 27, 29, 30, 34, 95 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/work-unit-for.test.mjs` | 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/worktree-admin-multiprocess.test.mjs` | 26, 27, 28, 42, 54, 56, 59, 69, 119, 120, 125 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/worktree-callsite-wrapper.test.mjs` | 22, 23, 24, 26, 27, 57, 58, 61, 74, 80, 84, 102, 108, 110, 112, 113, 122, 128, 129, 138, 139, 140, 142, 143, 171 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/runner/worktree.test.mjs` | 36, 37, 38, 40, 41, 51, 52, 64, 66, 68, 69, 70, 71, 72, 112, 207, 216, 219, 269, 296, 297, 402, 406, 413, 419, 427, 434, 435, 437, 445, 446, 447, 449, 450, 456, 464, 465, 466, 468, 469, 476, 485, 487, 492, 493, 498, 508, 514, 515, 518, 537, 542, 543, 544, 546, 548, 559, 560, 562, 563, 564, 569, 570, 599, 600, 627, 660, 696, 720, 780, 785, 786, 827, 829, 832, 833, 834, 835, 836, 838, 875, 876, 877, 899, 917, 926, 936, 952, 958, 960, 961, 962, 963, 964, 966, 988, 1010, 1012, 1015, 1016, 1017, 1018, 1019, 1052, 1091, 1101, 1199, 1215, 1216, 1231, 1232, 1250, 1251, 1258, 1276, 1282, 1283, 1300, 1301, 1318, 1319, 1330, 1336, 1337, 1348, 1349, 1351, 1361, 1362, 1371, 1380, 1446 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/command-routes.test.mjs` | 101, 129, 324, 332, 342 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/dev-host.test.mjs` | 78, 111, 178 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/envelope-contract.test.mjs` | 83 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-init-activation.test.mjs` | 20, 21, 22, 56, 57, 58, 107, 108, 109, 160, 161, 162, 199, 200, 201, 232, 233, 234 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-init-download-sources.test.mjs` | 96, 124, 125, 126, 183, 184, 185, 191 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-init-fixture.mjs` | 23, 37, 39, 63, 104, 105, 106, 120 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-init-preflight-tail.test.mjs` | 21, 22, 23, 74, 75, 76, 120, 124, 179, 180, 181, 225, 226, 227, 313, 339 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-init.test.mjs` | 21, 22, 23, 124, 173, 174, 175, 197, 198, 199, 227, 228, 229, 278, 308, 309, 310, 338, 379, 380, 381 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-lock-holder.mjs` | 21 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-stage.test.mjs` | 30, 42, 179, 240, 303 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fgctl-upgrade.test.mjs` | 33, 47, 49, 53, 127, 128, 129, 213, 214, 215, 280, 281, 282, 327, 328, 329, 373, 374, 375, 414, 415, 416, 456, 457, 458, 484, 485, 486, 525, 526, 527, 566, 567, 568, 603, 604, 605, 621, 622, 623, 648, 649, 650, 667, 668, 669, 707, 708, 709, 789, 790, 791, 881, 882, 883, 888, 889, 968, 969, 970 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fixtures/bin-git-caller.sh` | 2, 7 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/fixtures/divergent-child-process.mjs` | 6 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/harness.mjs` | 64, 240, 283, 670, 671 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/help-routes.test.mjs` | 50, 69 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/internal-routes.test.mjs` | 26, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/observe-store-lock.test.mjs` | 18 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/rust-host/release-tree.test.mjs` | 60, 165 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/check-decision-citation-drift.test.mjs` | 183, 235, 587, 606, 646, 668, 709, 732, 766 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/check-decision-codes.test.mjs` | 234, 255, 277, 300, 322, 341, 365, 384, 407 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/check-decision-supersession.test.mjs` | 143, 167 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/check-locked-decisions-heading-drift.test.mjs` | 129, 148, 160 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/decision-question-hook.test.mjs` | 22, 72 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/dispatch-decide-hook.test.mjs` | 18, 19, 20, 21, 31, 95, 102, 109 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/fgos-shell-integration.test.mjs` | 42, 43, 44, 47, 48, 53, 57, 66, 67, 69, 83, 84, 85, 87, 88, 132, 144, 151, 161, 176, 191, 208, 232, 255, 325, 326, 329 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/full-suite-queue.test.mjs` | 56, 73, 162 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/install-git-hooks.test.mjs` | 31, 36, 52, 55, 62, 68, 76, 88, 90, 94, 102, 104, 108, 140, 143, 146, 155 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/knowledge-migration.test.mjs` | 13, 14, 15, 19, 67, 98, 123, 178, 209, 240, 319, 320, 398, 432, 556, 595, 648, 690 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/next-doc-id.test.mjs` | 41 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/probe-storytelling-material.test.mjs` | 119 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/release-packaging.test.mjs` | 105 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/run-test-canary.test.mjs` | 334, 353 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/run-tests.test.mjs` | 251, 292, 303, 315, 415, 431, 444, 462, 779, 803, 809, 847, 853, 854, 876, 882, 883, 897 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-git-config-guard.test.mjs` | 22, 23, 29, 30, 32, 79, 86, 120, 121, 122, 128, 138, 139, 147, 150 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-plan-out.test.mjs` | 13 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-select-coverage-map.test.mjs` | 22 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-select-mutate.test.mjs` | 287, 308 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-select-promote-report.test.mjs` | 41, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/test-select.test.mjs` | 24, 25, 26, 38, 39, 88, 89, 104, 137, 138, 142, 158, 159, 160, 177, 178, 201, 202, 204, 205, 464, 466, 491, 494, 521, 524, 549, 552, 655, 658, 689, 692, 721, 808 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/scripts/write-wrapper-script.test.mjs` | 92, 109 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/active-release-drift-check.test.mjs` | 174, 175, 176, 178, 312, 350 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/agent-hooks.test.mjs` | 252 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/agy-permissions.test.mjs` | 34, 48, 66, 70, 92, 276 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-doctor-config.test.mjs` | 88, 89, 98, 99, 101, 111, 112, 604, 605, 624, 625, 628, 800, 807, 808, 815, 816, 823, 824, 831, 832, 833, 835, 836, 837, 841, 845, 851, 857, 866, 879, 892, 905, 911, 916, 1037 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-setup-config.test.mjs` | 53, 55, 59, 68 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-setup-envelope.test.mjs` | 47, 65 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-setup-hookspath.test.mjs` | 45, 56, 57, 58, 63 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-setup-idempotent.test.mjs` | 46, 51, 66 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks-setup-rc-line.test.mjs` | 45, 71 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/checks.test.mjs` | 216, 217, 231, 233, 234, 235, 257, 259, 260, 261, 284, 286, 287, 288, 302, 303, 316, 318, 319, 321, 323, 324, 892, 893, 902, 903, 905, 915, 916, 1368, 1369, 1388, 1389, 1392, 1612, 1619, 1620, 1627, 1628, 1635, 1636, 1643, 1644, 1645, 1647, 1648, 1649, 1653, 1657, 1663, 1672, 1681, 1694, 1707, 1720, 1726, 1731, 1852 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/claude-code-hooks.test.mjs` | 103, 104, 117, 122 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/confinement-doctor-checks.test.mjs` | 40, 86 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/convention-doctor-check.test.mjs` | 15, 25, 26, 27, 30, 31, 32, 34, 35 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/dir-resolution.test.mjs` | 22, 23, 24, 26, 27, 31, 41, 119, 138, 151 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/doctor-fresh-run.test.mjs` | 40, 49, 65, 77 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/doctor-strict-exit.test.mjs` | 16, 23 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/event-store-checks.test.mjs` | 32, 34, 63, 72, 80, 82, 86, 91, 93, 96, 125 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/event-store-fixes.test.mjs` | 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/git-checks.test.mjs` | 43 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/gitignore-docs-history-not-excluded.test.mjs` | 17 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/helpers/setup-checks-harness.mjs` | 110, 111, 112, 114, 115 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/holder-lock-checks.test.mjs` | 37, 54, 55, 81, 263, 298, 425 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/instruction-projections.test.mjs` | 53, 54, 260, 261, 262, 269, 270, 271 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/knowledge-doctor.test.mjs` | 70, 82, 83, 84, 86, 106 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/project-launcher.test.mjs` | 36, 154, 159 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/readme-tag-check.test.mjs` | 44, 45, 56, 57, 58, 73 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/registrations.test.mjs` | 601, 634, 669, 678, 700 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/run-supervisor-checks.test.mjs` | 31, 166, 328 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/self-uninstall-spike.test.mjs` | 36, 46, 63, 107 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/uninstall-wiring-2.test.mjs` | 27, 31, 32, 33, 44, 51 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/uninstall-wiring-3.test.mjs` | 27, 31, 32, 33, 60 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/uninstall-wiring.test.mjs` | 40, 44, 45, 46, 58, 63, 74, 79, 89, 95 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/setup/yaml-parse-failures.test.mjs` | 23, 138 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/skills/fgos-coding-knowledge.test.mjs` | 12, 13, 14, 18, 30, 34, 40, 43, 49, 54 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/skills/knowledge-canary.test.mjs` | 13, 14, 15, 19 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/skills/terminal-pane-ownership.test.mjs` | 52, 69 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/cleanup-harness.test.mjs` | 21, 22, 23, 25, 26, 31, 36, 37, 57, 87, 89, 91, 92, 93, 117, 119, 121, 122, 123, 126, 129, 140, 142, 145, 161, 177, 179, 185, 187, 189, 190, 191, 192, 197, 216, 218, 220, 222, 224, 225, 228, 252, 254, 256, 258, 260, 261, 265, 283, 285, 287, 289, 291, 292, 293, 319, 321, 328, 330, 332, 334, 335, 336, 337, 361, 363, 365, 366, 371, 387, 389, 391, 392, 393, 394, 410, 412, 414, 416, 417, 420, 421, 444, 446, 448, 449, 450, 451, 452, 455, 470, 472, 474, 475, 478, 479, 918, 973, 975, 979, 980, 983, 994, 996, 1000, 1002, 1005, 1009, 1010, 1021, 1023, 1027 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/decision-relation.test.mjs` | 43 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/decision-scope-field.test.mjs` | 28 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/discover-verdict-override.test.mjs` | 43 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/domain-registry-compiled.test.mjs` | 38, 101 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/drift-status.test.mjs` | 23, 24, 25, 27, 28, 32, 33, 37, 38, 43, 44, 66, 75, 83, 96, 107, 122, 146, 170, 195, 196, 207, 234, 235, 341, 346, 347, 357, 360, 361, 374, 376, 377, 389, 403, 405, 406 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/events-compaction.test.mjs` | 196, 197, 198, 209, 210, 243, 244, 245, 253, 254 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/events-jsonl-truncation-guard.test.mjs` | 41, 290, 291, 292, 300, 301, 311, 316, 324, 325, 326, 333, 338, 355, 356, 357, 366, 367, 386, 394, 395, 396, 408, 409, 419, 424, 473, 474, 475, 485, 486, 498, 499, 500, 511, 512, 524, 527, 537, 538, 539, 547, 548, 559, 667 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/events-shard-gitattributes-union-merge.test.mjs` | 11, 12, 17, 18, 19, 26, 27, 29, 31, 33, 35, 39 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/fgos-logs-bucket.test.mjs` | 29, 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/gate-bypass.test.mjs` | 447, 459 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/hot-lock-guard.test.mjs` | 28, 31, 34, 44, 46, 48, 65 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/hot-lock-host-judge.test.mjs` | 26, 59, 79 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/hot-lock-known-exec-sites.test.mjs` | 31, 32, 112, 113, 114, 115, 116, 136, 137, 138, 139, 141, 142, 145 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/hot-lock-multiprocess.test.mjs` | 39, 62, 177, 238, 240, 253 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/identity-before-lock.test.mjs` | 31, 32, 43, 44, 45, 47, 48, 49, 96, 139, 149 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/postland-drift.test.mjs` | 14, 15, 16, 18, 19, 23, 24, 28, 29, 34, 35, 48, 49, 70, 71, 96, 97, 121, 122, 127, 128 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/retrospective-doors.test.mjs` | 34 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/state-cutover.test.mjs` | 59, 60, 61, 62, 64, 65, 72, 87, 90, 91, 92 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/store.test.mjs` | 988, 989, 990, 992, 993, 999, 1014, 1017, 1018, 1019, 1029, 1032, 1033, 1034, 1044 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/tool-registry.test.mjs` | 134, 135, 136, 138, 139, 148 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/worker-slots.test.mjs` | 181, 182, 183, 185, 186, 281 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/state/working-tree-clean-unified.test.mjs` | 21, 22, 23, 25, 26, 30, 31, 63, 64, 80, 81 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/terminal-control/client-route.test.mjs` | 115 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/util/git-paths.test.mjs` | 15, 16, 22, 23, 24, 27, 28, 43, 49, 57, 65, 66, 75, 76, 101, 109 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/util/session-identity.test.mjs` | 59, 200, 203 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/verbs/dispatch-recovery.test.mjs` | 33 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/verbs/worktree-create.test.mjs` | 21, 48 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/verbs/worktree-remove.test.mjs` | 34, 56, 86 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/advisory-m-contracts.test.mjs` | 26, 28, 29, 35 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/case-bindings.test.mjs` | 42 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/conductor-case.test.mjs` | 34, 37 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/confined-nested-write.test.mjs` | 28, 32, 47, 58 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/discussion-workflows.test.mjs` | 269, 275, 278, 286, 291, 294, 302 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/guide-schema.test.mjs` | 200, 201 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/playbook-proposer.test.mjs` | 35, 223 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/units-runner.test.mjs` | 24, 33, 42, 58, 59, 60, 63, 64, 224, 228, 229, 310, 314, 315, 316, 334, 367, 368, 396, 609, 623, 629 | fixture owner: sandbox candidate; confirm repository provenance |
| [ ] `test/workflow/workflow-runner.test.mjs` | 51, 52, 53, 56, 57, 67, 214, 215, 365, 372, 377, 385, 397, 402, 446, 465, 493, 593, 765, 777, 873, 1182, 1183, 1205, 1234, 1246, 1251, 1252, 1253, 1254, 1255, 1400, 1412, 1414, 1647, 1700, 1732, 1787, 1801, 1802, 1817, 1863, 1877, 2116, 2134, 2135, 2147 | fixture owner: sandbox candidate; confirm repository provenance |

### setup/hooks

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `.githooks/pre-commit` | 2, 5, 10, 19, 20, 47, 51, 53, 57, 58, 63, 68, 92, 109, 110, 112, 149, 152, 153, 155, 156, 159, 165, 183, 186, 187, 188, 203, 211, 212, 228, 229, 238, 239, 251, 252, 253, 258, 259, 264, 286, 287, 298, 299, 304, 325, 327, 328, 330, 355, 365, 373, 383, 390, 396, 412, 413, 449, 453, 460, 470, 489 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/agent-hooks.mjs` | 68, 417, 430 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/git-hooks.mjs` | 18, 41, 107, 121, 146 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/instruction-registry.mjs` | 115, 156 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/registrations.mjs` | 361, 1696, 1719, 3222, 3236, 3290, 3302, 3502, 3804, 4108, 4238, 4589, 5232, 6370, 6398, 6423, 6475 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/run-supervisor-checks.mjs` | 51 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/shell-rc.mjs` | 124 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/skill-wrappers.mjs` | 111, 862 | setup: RepositoryConfig or hook read context / Inspect |
| [ ] `src/setup/terminal-control-checks.mjs` | 34 | setup: RepositoryConfig or hook read context / Inspect |

### skills

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `.agents/skills/_shared/catchup-self-recovery.md` | 73, 75, 78, 82 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/_shared/coding-cell-policy.md` | 10, 23, 55, 74, 75, 83, 88, 89, 92, 107, 111 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/_shared/coding-worker-contract.md` | 95, 109, 165, 167, 169, 181 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/_shared/executor-dispatch-fallback.md` | 109 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/_shared/private-cell-worktree.md` | 4, 9, 19, 20, 25, 27, 28, 30, 35, 46, 47, 48, 61, 62, 71, 72, 73 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/distill/SKILL.md` | 5, 21, 23, 25, 81, 106 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/distill/scripts/distill.mjs` | 45, 47, 294, 296, 299, 302, 304, 308, 309, 341, 379, 383, 453 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-architecture-panel/SKILL.md` | 46 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-discovering/SKILL.md` | 49 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-exploring/references/gate-mechanics.md` | 8 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 181 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-implement/SKILL.md` | 96 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 45, 46, 54 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-knowledge/SKILL.md` | 39, 41, 42 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 33 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 9 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-lock-fence/SKILL.md` | 48 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.agents/skills/fgos-run/SKILL.md` | 59, 80, 82 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/distill/SKILL.md` | 5, 21, 23, 25 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/distill/scripts/distill.mjs` | 45, 47, 294, 296, 299, 302, 304, 308, 309, 341, 379, 383, 453 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/fgos-coding-exploring/references/gate-mechanics.md` | 8 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 181 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 45, 46, 54 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 33 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `.claude/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 9 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/_shared/catchup-self-recovery.md` | 72, 74, 77, 81 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/_shared/coding-worker-contract.md` | 94, 108, 164, 166, 168, 180 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/_shared/executor-dispatch-fallback.md` | 108 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/_shared/private-cell-worktree.md` | 3, 8, 18, 19, 24, 26, 27, 29, 34, 45, 46, 47, 60, 61, 70, 71, 72 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/distill/SKILL.md` | 5, 21, 23, 25, 80, 105 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/distill/scripts/distill.mjs` | 45, 47, 294, 296, 299, 302, 304, 308, 309, 341, 379, 383, 453 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/fgos-architecture-panel/SKILL.md` | 45 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/fgos-lock-fence/SKILL.md` | 47 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/fgos-run/SKILL.md` | 58, 79, 81 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/instruction-audit/SKILL.md` | 10, 27, 29, 31, 82, 103, 114 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/instruction-audit/references/lane-prompts.md` | 41, 55, 82 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `core/skills/instruction-audit/scripts/instruction-audit.mjs` | 73, 90 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/_shared/catchup-self-recovery.md` | 73, 75, 78, 82 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/_shared/coding-cell-policy.md` | 10, 23, 55, 74, 75, 83, 88, 89, 92, 107, 111 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/_shared/coding-worker-contract.md` | 95, 109, 165, 167, 169, 181 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` | 109 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/_shared/private-cell-worktree.md` | 4, 9, 19, 20, 25, 27, 28, 30, 35, 46, 47, 48, 61, 62, 71, 72, 73 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/approve/SKILL.md` | 36, 48, 106, 110, 146, 162, 189 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/cleanup-loop/SKILL.md` | 26, 49 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/cleanup-next/SKILL.md` | 38 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/deliver/SKILL.md` | 81, 88, 89, 90 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/discover-next/SKILL.md` | 54 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/discover/SKILL.md` | 100 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` | 46 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-discovering/SKILL.md` | 49 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-exploring/references/gate-mechanics.md` | 8 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | 181 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` | 96 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | 45, 46, 54 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md` | 39, 41, 42 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | 33 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | 9 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-lock-fence/SKILL.md` | 48 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/fgos-run/SKILL.md` | 59, 80, 82 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/merge-loop/SKILL.md` | 42, 98 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/pick/SKILL.md` | 16, 17, 103, 112, 113, 154 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/plan-next/SKILL.md` | 40 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/plan/SKILL.md` | 62 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/retro-next/SKILL.md` | 54 | lead: source instruction or generated mirror; migrate source then render |
| [ ] `plugins/fgOS/skills/return/SKILL.md` | 42 | lead: source instruction or generated mirror; migrate source then render |

### temporary Work events

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/runner/main-fgos-checkpoint.mjs` | 9, 12, 17 | Work event adapter: ScopedCommit / Checkpoint; retained until WORK cutover |
| [ ] `src/state/events-compaction.mjs` | 186, 187 | Work event adapter: ScopedCommit / Checkpoint; retained until WORK cutover |
| [ ] `src/state/events-jsonl-truncation-guard.mjs` | 312, 421, 430 | Work event adapter: ScopedCommit / Checkpoint; retained until WORK cutover |

### verbs/merge and CLI

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `bin/fgos.mjs` | 171, 173, 197, 208, 1043, 1628, 1697, 1799, 2127, 3386, 3484, 4177, 4192, 4291, 4300, 4309, 4323, 4336, 4419, 4462, 4467, 4479, 4487, 5030 | merge verbs: typed Git ports; shared CLI edited serially |
| [ ] `src/verbs/merge/approve.mjs` | 422, 481, 533, 539 | merge verbs: typed Git ports; shared CLI edited serially |
| [ ] `src/verbs/merge/merge.mjs` | 25 | merge verbs: typed Git ports; shared CLI edited serially |
| [ ] `src/verbs/merge/review.mjs` | 89 | merge verbs: typed Git ports; shared CLI edited serially |
| [ ] `src/verbs/merge/sync-root.mjs` | 113, 221, 265 | merge verbs: typed Git ports; shared CLI edited serially |

### worktree/session/loop/claim

| File | Candidate lines | Owner / disposition |
|---|---|---|
| [ ] `src/runner/claim-port.mjs` | 109 | Worktree cluster: Worktree / Refs / Remote / SafeRestore |
| [ ] `src/runner/loop.mjs` | 233, 234, 276, 292, 300, 301, 506, 514, 849, 860, 868, 874, 875, 930, 1067 | Worktree cluster: Worktree / Refs / Remote / SafeRestore |
| [ ] `src/runner/repo-locks.mjs` | 57, 88, 89, 100, 111 | Worktree cluster: Worktree / Refs / Remote / SafeRestore |
| [ ] `src/runner/session.mjs` | 63, 64, 146, 152, 250, 285, 335, 351, 398, 406, 422, 430, 516, 535, 548, 554 | Worktree cluster: Worktree / Refs / Remote / SafeRestore |
| [ ] `src/runner/worktree.mjs` | 111, 137, 155, 156, 167, 168, 223, 225, 233, 244, 259, 269, 307, 312, 325, 327, 332, 341, 396, 415, 451, 509, 518, 553, 562, 572, 600, 624, 633, 821, 860, 883, 889, 921, 930, 935, 954, 1009, 1034, 1041, 1057, 1071, 1077, 1093, 1147, 1160, 1170, 1192, 1193, 1194, 1199, 1217, 1228, 1230, 1278, 1280, 1327, 1338, 1369, 1376, 1426, 1433, 1453, 1466, 1467 | Worktree cluster: Worktree / Refs / Remote / SafeRestore |

Status: DONE_WITH_CONCERNS
Summary: Reproducible conservative caller checklist with explicit ownership; final static data-flow probes and runtime spy remain phase-07 gate work.
Concerns/Blockers: Candidate lines require classification; this inventory does not claim zero product writers.
Context refs:
- (none)
