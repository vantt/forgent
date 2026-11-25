# Closure Report: Dead Node Execution Modules and Test Dispositions

**Plan:** `plans/261122-2108-delete-dead-node-execution-closure`  
**Phase:** 1 (Facts)  
**Base commit:** `a43e451bb2a080d60e3bdea27584be0b172a19d7`  
**Date:** 2026-11-25  

---

## 1. Executive Summary

Phase 1 recomputes the dead Node execution closure and test dispositions on the current worktree HEAD (`a43e451bb2a080d60e3bdea27584be0b172a19d7`).

### Key Facts & Counts
- **Total files in the 3 execution directories:** **89**
  - `src/runner/dispatch/`: 54 files
  - `src/runner/execution/`: 23 files
  - `src/run-supervisor/`: 12 files
- **Live-kept files:** **26** (unreachable from product code except frozen mailbox harness, S6b, S7, or tail facades)
- **Dead files:** **63** (19,471 total lines of code)
- **Verification sum:** 26 live + 63 dead = **89** total files in the three directories (matches `git ls-files src/runner/dispatch src/runner/execution src/run-supervisor | wc -l`).
- **Test files directly importing dead files:** **125**
  - Provisional `retire`: **33** (import no other product module and are not imported by any other test file)
  - Provisional `rewire`: **92**
- **Test files outside every footprint:** **0** (the list is empty; all 125 test importers are assigned to phases 2-7 and 11).

### Comparison with Base `4dffbaad4`
On the earlier base `4dffbaad4` noted in `plan.md`, there were 27 live and 62 dead files.
The difference on current HEAD `a43e451bb2a080d60e3bdea27584be0b172a19d7`:
- Plan `261121-2110-component-authority-doors` landed phase 2a (`326b79eb7`), which rewired `src/session-host/head-request.mjs` to call `nativeDoor().writeScope` instead of importing `src/runner/dispatch/write-scope.mjs`.
- As a result, `src/runner/dispatch/write-scope.mjs` lost its last live product importer and moved into the dead set, bringing the dead count from 62 to **63**, and the live count from 27 to **26**.
- Phase 11 (`phase-11-node-twin-debt.md`, moved from the doors plan per owner decision D22) covers the retirement of `src/runner/dispatch/write-scope.mjs`, its parity test (`test/git/write-scope-parity.test.mjs`), and `test/runner/write-scope.test.mjs`.

### Status of `src/runner/dispatch/session-attempt.mjs`
- **Dead set confirmation:** `src/runner/dispatch/session-attempt.mjs` **is in the dead set**.
- **Analysis:** No file in product code (`src/`, `bin/`, `scripts/`, `domains/`) imports `session-attempt.mjs`. Its only importers are 3 test files: `test/runner/dispatch-confinement-backend-p03.test.mjs`, `test/runner/dispatch-confinement-machine-private.test.mjs`, and `test/session-host/head-start.test.mjs`.
- **Manifest status:** In `packages/component-authority/model/doors/execution-s-node-seam.yaml`, it is already classified as `reason: "p-24xw2cwdvo: dead Node session attempt (the host launches head sessions); only tests import it"`.
- **Coordination with running plan 261124-0004:** Plan `261124-0004-heads-operate-without-owner` currently runs and lists `session-attempt.mjs` in its planned scope notes. Per `plan.md` Admitted notes (2026-11-25), Phase 1 records that `session-attempt.mjs` is dead, and later deletion phases (Phase 8) will respect whether 261124-0004 has landed or is parked before deleting the file.

### Tail Left by Plan `261122-0118`
Plan `261122-0118-heads-stable-and-able` is `status: done`. It was originally anticipated that `261122-0118` would make `head-stop` and `rotate` await the host cancel op, which could have freed `cancel-registry.mjs`, `assignment-layout.mjs`, and `confinement/authority.mjs`.
However, the landed state leaves 6 facade modules in the three directories:
1. `src/run-supervisor/cancel-registry.mjs` (imported by `src/session-host/head-stop.mjs`)
2. `src/runner/dispatch/assignment-layout.mjs` (imported by `src/session-host/head-request.mjs`)
3. `src/runner/dispatch/config.mjs` (imported by `src/session-host/head-start.mjs`)
4. `src/runner/dispatch/confinement/authority.mjs` (imported by `src/session-rotation/rotate.mjs`)
5. `src/runner/execution/unit-run-record.mjs` (imported by `src/session-host/head-request.mjs`)
6. `src/runner/execution/unit-summary.mjs` (imported by `src/session-host/head-request.mjs`)

These 6 modules are retained in the live-kept table under owning step **plan 261122-0118 tail / S7**. They will be removed when the session-host and session-rotation callers switch their imports to `src/native/execution-door.mjs`.

---

## 2. Method

1. **Source Set:** All `*.mjs`, `*.js`, and `*.cjs` files tracked by git (`git ls-files`), excluding `.agents/`, `plugins/`, and `node_modules/`.
2. **Import Extraction:** Using `scripts/lib/js-source-lexer.mjs` to strip comments while keeping string/template literals intact, matching:
   - Static `import ... from '...'`
   - Static `export ... from '...'`
   - Bare `import '...'`
   - Dynamic `import('...')`
   - `new URL('....mjs', import.meta.url)`
3. **Graph Resolution:** Resolving relative specifiers (`./`, `../`) to canonical repository-relative paths.
4. **Live Roots:** All files outside `test/` and outside the three directories (`src/runner/dispatch/`, `src/runner/execution/`, `src/run-supervisor/`).
5. **Reachability:** BFS traversing from live roots into the three directories, and following edges within the three directories. Files reachable via this traversal are **live**; unreachable files are **dead**.
6. **String-Scan Verification:** Running `git grep -n '<basename without .mjs>' -- src bin scripts domains packages apps` on all dead candidates to verify no dynamic string path loading occurs.

---

## 3. String-Scan Analysis (Step 3)

For each dead candidate, `git grep -n '<basename without .mjs>' -- src bin scripts domains packages apps` was executed. Every hit outside dead files was analyzed:

1. **Rust comments & docs:** Lines in `apps/fgos/src/wiring/unit_run_host/**`, `packages/execution/rust/**`, and `packages/run-supervisor/rust/**` referencing the legacy Node modules from which Rust engine behaviors were ported.
2. **Contract test fixtures & notes:** Files under `packages/execution/contracts/**` and `packages/run-supervisor/contracts/**` containing provenance metadata (e.g., `"note": "recorded from src/runner/..."`).
3. **Architecture manifests & models:** Rows in `packages/component-authority/model/**` and `packages/distribution/contracts/doctor-registry.v1.json` tracking legacy debt and retire conditions (`p-24xw2cwdvo`).
4. **Mutation Census:** Hashes in `packages/git/contracts/mutation-census.v1.json` recording file hashes (regenerated in Phase 8).
5. **Shared basenames:** Hits in unrelated files sharing generic names (e.g., `client`, `config`, `plan`, `resolve`, `adapters`, `outcome`, `unit`). None of these reference or load the execution modules.
6. **No string path loading found:** Zero instances of string-based loading (such as `spawn`, `fork`, `new Worker`, or computed `import()`) targeting any dead candidate were found.
7. **Result:** Zero candidates move from dead to live. The dead set stands at **63 files**.

---

## 4. Live-Kept Table (Step 4)

Total live files: **26**.

| # | Path | First Live Importer | Owning Step | Reason / Description |
|---|---|---|---|---|
| 1 | `src/run-supervisor/cancel-registry.mjs` | `src/session-host/head-stop.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |
| 2 | `src/run-supervisor/runtime-dir.mjs` | `src/runner/dispatch/confinement/drivers/bwrap.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 3 | `src/runner/dispatch/assignment-layout.mjs` | `src/session-host/head-request.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |
| 4 | `src/runner/dispatch/config.mjs` | `src/session-host/head-start.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |
| 5 | `src/runner/dispatch/confinement/attestation-store.mjs` | `src/runner/dispatch/confinement/drivers/bwrap.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 6 | `src/runner/dispatch/confinement/authority.mjs` | `src/session-rotation/rotate.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |
| 7 | `src/runner/dispatch/confinement/cleanup.mjs` | `src/runner/dispatch/confinement/drivers/bwrap.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 8 | `src/runner/dispatch/confinement/drivers/bwrap.mjs` | `scripts/lib/mailbox-live-confined.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 9 | `src/runner/dispatch/confinement/resources.mjs` | `scripts/lib/mailbox-live-confined.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 10 | `src/runner/dispatch/confinement/workspace-paths.mjs` | `src/runner/dispatch/confinement/drivers/bwrap.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 11 | `src/runner/dispatch/llm-accounts.mjs` | `src/runner/dispatch/confinement/resources.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 12 | `src/runner/dispatch/provider-adapter.mjs` | `src/runner/dispatch/llm-accounts.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 13 | `src/runner/dispatch/provider-capacity.mjs` | `src/session-host/head-start.mjs` | S7 | Work runner loop / session-head start callers |
| 14 | `src/runner/dispatch/provider-credential-probe.mjs` | `src/runner/dispatch/provider-credential-renewal.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 15 | `src/runner/dispatch/provider-credential-renewal.mjs` | `scripts/lib/mailbox-live-confined.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 16 | `src/runner/dispatch/run-timeout.mjs` | `src/workflow/definition.mjs` | S6b | Workflow definition / contract validation twins |
| 17 | `src/runner/dispatch/runner-config-error.mjs` | `domains/coding/harness/enrich-and-validate-contract.mjs` | S6b | Workflow definition / contract validation twins |
| 18 | `src/runner/dispatch/terminal-slot.mjs` | `src/runner/dispatch/worker-session-boot.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 19 | `src/runner/dispatch/tier-cell.mjs` | `src/runner/dispatch/provider-adapter.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 20 | `src/runner/dispatch/worker-session-boot.mjs` | `scripts/record-mailbox-hook-fixtures.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 21 | `src/runner/dispatch/worker-session.mjs` | `src/runner/dispatch/worker-session-boot.mjs` | mailbox lane re-measure | Frozen mailbox harness reach (plan Decisions) |
| 22 | `src/runner/execution/bind.mjs` | `src/runner/loop.mjs` | S7 | Work runner loop / session-head start callers |
| 23 | `src/runner/execution/legacy-seat-read.mjs` | `src/runner/execution/outcome.mjs` | S6b | Workflow definition / contract validation twins |
| 24 | `src/runner/execution/outcome.mjs` | `src/workflow/definition.mjs` | S6b | Workflow definition / contract validation twins |
| 25 | `src/runner/execution/unit-run-record.mjs` | `src/session-host/head-request.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |
| 26 | `src/runner/execution/unit-summary.mjs` | `src/session-host/head-request.mjs` | plan 261122-0118 tail / S7 | Session-host facade awaiting direct door imports |

---

## 5. Dead Table (Step 5)

Total dead files: **63** (19,471 total lines of code).

| # | Path | Lines |
|---|---|---|
| 1 | `src/run-supervisor/client.mjs` | 135 |
| 2 | `src/run-supervisor/cwd-lock.mjs` | 100 |
| 3 | `src/run-supervisor/direct-launch.mjs` | 457 |
| 4 | `src/run-supervisor/dispatch-error.mjs` | 5 |
| 5 | `src/run-supervisor/gate-kill-grace.mjs` | 42 |
| 6 | `src/run-supervisor/protocol.mjs` | 9 |
| 7 | `src/run-supervisor/run-lock.mjs` | 393 |
| 8 | `src/run-supervisor/steps/cleanup-trust.mjs` | 38 |
| 9 | `src/run-supervisor/trust-store.mjs` | 689 |
| 10 | `src/run-supervisor/worker-artifacts.mjs` | 76 |
| 11 | `src/runner/dispatch/adapters.mjs` | 152 |
| 12 | `src/runner/dispatch/agent-result-claim-contract.mjs` | 121 |
| 13 | `src/runner/dispatch/assignment-layout-twin.mjs` | 117 |
| 14 | `src/runner/dispatch/assignment-normalizer.mjs` | 189 |
| 15 | `src/runner/dispatch/assignment-runner.mjs` | 1566 |
| 16 | `src/runner/dispatch/assignment.mjs` | 935 |
| 17 | `src/runner/dispatch/brief.mjs` | 182 |
| 18 | `src/runner/dispatch/cli.mjs` | 76 |
| 19 | `src/runner/dispatch/config-twin.mjs` | 780 |
| 20 | `src/runner/dispatch/confinement/authority-twin.mjs` | 1058 |
| 21 | `src/runner/dispatch/confinement/backend-registry.mjs` | 379 |
| 22 | `src/runner/dispatch/confinement/bypass-pairing.mjs` | 35 |
| 23 | `src/runner/dispatch/confinement/policies.mjs` | 734 |
| 24 | `src/runner/dispatch/confinement/probes/harness.mjs` | 861 |
| 25 | `src/runner/dispatch/confinement/request.mjs` | 537 |
| 26 | `src/runner/dispatch/effective-execution-contract.mjs` | 536 |
| 27 | `src/runner/dispatch/evidence-attribution.mjs` | 251 |
| 28 | `src/runner/dispatch/execution-contract.mjs` | 425 |
| 29 | `src/runner/dispatch/executor-governance.mjs` | 82 |
| 30 | `src/runner/dispatch/herdr-round.mjs` | 632 |
| 31 | `src/runner/dispatch/mechanism.mjs` | 96 |
| 32 | `src/runner/dispatch/operation-prompt-templates.mjs` | 563 |
| 33 | `src/runner/dispatch/plan.mjs` | 697 |
| 34 | `src/runner/dispatch/resolve.mjs` | 363 |
| 35 | `src/runner/dispatch/run-admission.mjs` | 326 |
| 36 | `src/runner/dispatch/run-result.mjs` | 1118 |
| 37 | `src/runner/dispatch/session-attempt.mjs` | 164 |
| 38 | `src/runner/dispatch/settlement.mjs` | 947 |
| 39 | `src/runner/dispatch/shipped-catalog.mjs` | 31 |
| 40 | `src/runner/dispatch/tool-providers.mjs` | 131 |
| 41 | `src/runner/dispatch/transport.mjs` | 242 |
| 42 | `src/runner/dispatch/visibility-session.mjs` | 284 |
| 43 | `src/runner/dispatch/work-item-input.mjs` | 23 |
| 44 | `src/runner/dispatch/worker-home.mjs` | 224 |
| 45 | `src/runner/dispatch/write-scope.mjs` | 175 |
| 46 | `src/runner/execution/account-rotation.mjs` | 149 |
| 47 | `src/runner/execution/custody-door.mjs` | 120 |
| 48 | `src/runner/execution/loops/debate.mjs` | 117 |
| 49 | `src/runner/execution/loops/history-outcome.mjs` | 68 |
| 50 | `src/runner/execution/loops/index.mjs` | 84 |
| 51 | `src/runner/execution/loops/panel.mjs` | 100 |
| 52 | `src/runner/execution/loops/reviewed.mjs` | 273 |
| 53 | `src/runner/execution/loops/role-tasks.mjs` | 113 |
| 54 | `src/runner/execution/loops/solo.mjs` | 64 |
| 55 | `src/runner/execution/loops/verify.mjs` | 50 |
| 56 | `src/runner/execution/patterns/retired-keys.mjs` | 117 |
| 57 | `src/runner/execution/seat-ledger.mjs` | 80 |
| 58 | `src/runner/execution/seat-resolver.mjs` | 404 |
| 59 | `src/runner/execution/unit-control.mjs` | 30 |
| 60 | `src/runner/execution/unit-run-history.mjs` | 113 |
| 61 | `src/runner/execution/unit-state.mjs` | 71 |
| 62 | `src/runner/execution/unit-summary-twin.mjs` | 220 |
| 63 | `src/runner/execution/unit.mjs` | 322 |
| **Total** | **63 files** | **19,471 lines** |

---

## 6. Test-Importer Table (Step 6)

Total test files importing dead modules: **125**.
- **Retire:** 33 files (import no other product module and are not imported by any other test file).
- **Rewire:** 92 files (import other product modules or act as fixtures/helpers imported by other tests).

### Breakdown by Owning Phase
| Phase | File Count |
|---|---|
| Phase 2 (`phase-02-tests-runner-dispatch.md`) | 26 |
| Phase 3 (`phase-03-tests-runner-execution.md`) | 22 |
| Phase 4 (`phase-04-tests-runner-assignment-run-provider.md`) | 16 |
| Phase 5 (`phase-05-tests-runner-rest.md`) | 23 |
| Phase 6 (`phase-06-tests-supervisor-setup-misc.md`) | 22 |
| Phase 7 (`phase-07-tests-workflow-helpers.md`) | 15 |
| Phase 11 (`phase-11-node-twin-debt.md`) | 1 |
| **Total** | **125** |

### Outside Every Footprint
*(None — the list is empty)*

### Complete Test Importers List

| # | Test File | Dead Imports | Other Prod Imports | Importers (In-degree) | Disposition | Owning Phase |
|---|---|---|---|---|---|---|
| 1 | `test/convention/seat-id.test.mjs` | `seat-resolver.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 2 | `test/golden-recorders/confinement-cleanup.recorder.mjs` | `harness.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 3 | `test/golden-recorders/confinement-driver.recorder.mjs` | `backend-registry.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 4 | `test/golden-recorders/run-supervisor-controller.recorder.mjs` | `client.mjs, trust-store.mjs` | 3 | 0 | **rewire** | Phase 6 |
| 5 | `test/helpers/declared-assignment.mjs` | `assignment.mjs` | 1 | 21 | **rewire** | Phase 7 |
| 6 | `test/helpers/executor-model-vectors.helper.mjs` | `config-twin.mjs, policies.mjs, executor-governance.mjs, mechanism.mjs, resolve.mjs, tool-providers.mjs` | 5 | 2 | **rewire** | Phase 7 |
| 7 | `test/helpers/packaged-definitions.mjs` | `execution-contract.mjs` | 6 | 2 | **rewire** | Phase 7 |
| 8 | `test/helpers/work-seat-config.mjs` | `config-twin.mjs` | 1 | 18 | **rewire** | Phase 7 |
| 9 | `test/run-supervisor/adopt-client.test.mjs` | `client.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 10 | `test/run-supervisor/direct-crash-matrix.test.mjs` | `client.mjs, cwd-lock.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 11 | `test/run-supervisor/direct-cutover.test.mjs` | `direct-launch.mjs, run-result.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 12 | `test/run-supervisor/fixtures/terminal-controller.mjs` | `assignment-runner.mjs` | 0 | 0 | **retire** | Phase 6 |
| 13 | `test/run-supervisor/pane-host.test.mjs` | `herdr-round.mjs` | 0 | 0 | **retire** | Phase 6 |
| 14 | `test/run-supervisor/prepare-seat.test.mjs` | `herdr-round.mjs` | 0 | 0 | **retire** | Phase 6 |
| 15 | `test/run-supervisor/sweep.test.mjs` | `client.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 16 | `test/run-supervisor/terminal-groups.test.mjs` | `cleanup-trust.mjs, trust-store.mjs, herdr-round.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 17 | `test/run-supervisor/windows-custody.test.mjs` | `cwd-lock.mjs, direct-launch.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 18 | `test/runner/agent-definitions.test.mjs` | `assignment.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 19 | `test/runner/agent-result-claim-contract.test.mjs` | `agent-result-claim-contract.mjs` | 0 | 0 | **retire** | Phase 5 |
| 20 | `test/runner/assignment-cwd-mutex-concurrency.test.mjs` | `assignment-runner.mjs` | 1 | 0 | **rewire** | Phase 4 |
| 21 | `test/runner/assignment-dispatch.test.mjs` | `run-lock.mjs, assignment-runner.mjs, plan.mjs, run-result.mjs` | 5 | 0 | **rewire** | Phase 4 |
| 22 | `test/runner/assignment-layout.test.mjs` | `assignment-layout-twin.mjs, visibility-session.mjs` | 0 | 0 | **retire** | Phase 4 |
| 23 | `test/runner/assignment-normalizer.test.mjs` | `assignment-normalizer.mjs` | 1 | 0 | **rewire** | Phase 4 |
| 24 | `test/runner/assignment-provenance.test.mjs` | `assignment.mjs` | 2 | 0 | **rewire** | Phase 4 |
| 25 | `test/runner/assignment-runresult.test.mjs` | `run-lock.mjs, assignment-runner.mjs, run-result.mjs, settlement.mjs` | 3 | 0 | **rewire** | Phase 4 |
| 26 | `test/runner/assignment.test.mjs` | `assignment.mjs` | 1 | 0 | **rewire** | Phase 4 |
| 27 | `test/runner/cli-spawn-reconciliation.test.mjs` | `authority-twin.mjs, request.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 28 | `test/runner/config-seat-binding-layers.test.mjs` | `config-twin.mjs` | 0 | 0 | **retire** | Phase 5 |
| 29 | `test/runner/credential-store.test.mjs` | `config-twin.mjs, request.mjs, transport.mjs` | 5 | 0 | **rewire** | Phase 5 |
| 30 | `test/runner/custody-successor-admission.test.mjs` | `cwd-lock.mjs, direct-launch.mjs` | 2 | 0 | **rewire** | Phase 5 |
| 31 | `test/runner/dead-vocabulary-guard.test.mjs` | `config-twin.mjs, plan.mjs` | 4 | 0 | **rewire** | Phase 5 |
| 32 | `test/runner/default-executor-merge.test.mjs` | `config-twin.mjs` | 0 | 0 | **retire** | Phase 5 |
| 33 | `test/runner/dispatch-assignment-id-claim-concurrency.helper.mjs` | `assignment.mjs` | 0 | 0 | **retire** | Phase 2 |
| 34 | `test/runner/dispatch-brief.test.mjs` | `assignment.mjs, brief.mjs, transport.mjs` | 0 | 0 | **retire** | Phase 2 |
| 35 | `test/runner/dispatch-config-patterns.test.mjs` | `config-twin.mjs, shipped-catalog.mjs` | 3 | 0 | **rewire** | Phase 2 |
| 36 | `test/runner/dispatch-confinement-authority.test.mjs` | `authority-twin.mjs, backend-registry.mjs, policies.mjs, request.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 37 | `test/runner/dispatch-confinement-backend-p03.test.mjs` | `authority-twin.mjs, backend-registry.mjs, harness.mjs, request.mjs, session-attempt.mjs` | 5 | 0 | **rewire** | Phase 2 |
| 38 | `test/runner/dispatch-confinement-blind.test.mjs` | `authority-twin.mjs, policies.mjs, harness.mjs, request.mjs, transport.mjs` | 3 | 0 | **rewire** | Phase 2 |
| 39 | `test/runner/dispatch-confinement-machine-private.test.mjs` | `policies.mjs, harness.mjs, request.mjs, session-attempt.mjs` | 4 | 0 | **rewire** | Phase 2 |
| 40 | `test/runner/dispatch-confinement-p04.test.mjs` | `authority-twin.mjs, backend-registry.mjs, policies.mjs, request.mjs, herdr-round.mjs, transport.mjs` | 3 | 0 | **rewire** | Phase 2 |
| 41 | `test/runner/dispatch-confinement-p05.test.mjs` | `authority-twin.mjs, bypass-pairing.mjs, policies.mjs, request.mjs, herdr-round.mjs, transport.mjs` | 0 | 0 | **retire** | Phase 2 |
| 42 | `test/runner/dispatch-confinement-policies.test.mjs` | `config-twin.mjs, backend-registry.mjs, policies.mjs, request.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 43 | `test/runner/dispatch-execute-effort.test.mjs` | `run-lock.mjs, assignment-runner.mjs, config-twin.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 44 | `test/runner/dispatch-executor-profile.test.mjs` | `assignment-runner.mjs, config-twin.mjs, resolve.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 45 | `test/runner/dispatch-governance-operability.test.mjs` | `assignment-runner.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 46 | `test/runner/dispatch-governance-provider-denylist.test.mjs` | `assignment-runner.mjs, plan.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 47 | `test/runner/dispatch-i08b-remediation.test.mjs` | `assignment-runner.mjs, run-result.mjs, transport.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 48 | `test/runner/dispatch-operability-production-door.test.mjs` | `assignment-runner.mjs` | 0 | 0 | **retire** | Phase 2 |
| 49 | `test/runner/dispatch-plan-policy.test.mjs` | `config-twin.mjs, plan.mjs, resolve.mjs` | 4 | 0 | **rewire** | Phase 2 |
| 50 | `test/runner/dispatch-policy-baseline-snapshot.test.mjs` | `config-twin.mjs, plan.mjs, resolve.mjs, transport.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 51 | `test/runner/dispatch-run-timeout.test.mjs` | `config-twin.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 52 | `test/runner/dispatch-stray-write-attribution.test.mjs` | `assignment-runner.mjs, run-result.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 53 | `test/runner/dispatch-trust-store.test.mjs` | `cleanup-trust.mjs, trust-store.mjs` | 0 | 0 | **retire** | Phase 2 |
| 54 | `test/runner/dispatch-visibility-session.test.mjs` | `assignment-runner.mjs, visibility-session.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 55 | `test/runner/dispatch-worker-home.test.mjs` | `worker-home.mjs` | 1 | 0 | **rewire** | Phase 2 |
| 56 | `test/runner/dispatch.test.mjs` | `cwd-lock.mjs, assignment-runner.mjs, config-twin.mjs, mechanism.mjs, plan.mjs, resolve.mjs, transport.mjs` | 7 | 0 | **rewire** | Phase 2 |
| 57 | `test/runner/dispatch/tool-providers.test.mjs` | `tool-providers.mjs` | 0 | 0 | **retire** | Phase 2 |
| 58 | `test/runner/dispatch/worker-env-case-context.test.mjs` | `adapters.mjs, assignment-runner.mjs` | 2 | 0 | **rewire** | Phase 2 |
| 59 | `test/runner/driver-rununit.test.mjs` | `assignment-runner.mjs` | 5 | 0 | **rewire** | Phase 5 |
| 60 | `test/runner/effective-execution-contract.test.mjs` | `assignment-runner.mjs, assignment.mjs, brief.mjs, effective-execution-contract.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 61 | `test/runner/egress-governance.test.mjs` | `resolve.mjs, transport.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 62 | `test/runner/evidence-attribution.test.mjs` | `evidence-attribution.mjs` | 0 | 0 | **retire** | Phase 5 |
| 63 | `test/runner/execution-contract.test.mjs` | `execution-contract.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 64 | `test/runner/execution/account-rotation.test.mjs` | `account-rotation.mjs` | 2 | 0 | **rewire** | Phase 3 |
| 65 | `test/runner/execution/bind-tier-composition.test.mjs` | `seat-resolver.mjs` | 0 | 0 | **retire** | Phase 3 |
| 66 | `test/runner/execution/bind.test.mjs` | `seat-ledger.mjs, seat-resolver.mjs` | 2 | 0 | **rewire** | Phase 3 |
| 67 | `test/runner/execution/custody-door.test.mjs` | `custody-door.mjs` | 0 | 0 | **retire** | Phase 3 |
| 68 | `test/runner/execution/legacy-seat-read.test.mjs` | `shipped-catalog.mjs, unit-run-history.mjs, unit-summary-twin.mjs` | 2 | 0 | **rewire** | Phase 3 |
| 69 | `test/runner/execution/loops/debate.test.mjs` | `debate.mjs, history-outcome.mjs, seat-resolver.mjs` | 0 | 0 | **retire** | Phase 3 |
| 70 | `test/runner/execution/loops/index.test.mjs` | `shipped-catalog.mjs, debate.mjs, index.mjs, panel.mjs, reviewed.mjs, solo.mjs` | 0 | 0 | **retire** | Phase 3 |
| 71 | `test/runner/execution/loops/panel.test.mjs` | `panel.mjs` | 0 | 0 | **retire** | Phase 3 |
| 72 | `test/runner/execution/loops/reviewed.test.mjs` | `shipped-catalog.mjs, reviewed.mjs, verify.mjs, seat-resolver.mjs` | 0 | 0 | **retire** | Phase 3 |
| 73 | `test/runner/execution/loops/role-tasks.test.mjs` | `shipped-catalog.mjs, role-tasks.mjs` | 0 | 0 | **retire** | Phase 3 |
| 74 | `test/runner/execution/loops/solo.test.mjs` | `history-outcome.mjs, solo.mjs` | 2 | 0 | **rewire** | Phase 3 |
| 75 | `test/runner/execution/patterns/retired-keys.test.mjs` | `retired-keys.mjs` | 0 | 0 | **retire** | Phase 3 |
| 76 | `test/runner/execution/run-gate.test.mjs` | `assignment-runner.mjs, assignment.mjs, config-twin.mjs` | 4 | 0 | **rewire** | Phase 3 |
| 77 | `test/runner/execution/run-herdr.test.mjs` | `cli.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 78 | `test/runner/execution/run-posture.test.mjs` | `policies.mjs` | 0 | 0 | **retire** | Phase 3 |
| 79 | `test/runner/execution/seat-ledger.test.mjs` | `seat-ledger.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 80 | `test/runner/execution/seat-resolver.test.mjs` | `agent-result-claim-contract.mjs, shipped-catalog.mjs, seat-resolver.mjs` | 0 | 0 | **retire** | Phase 3 |
| 81 | `test/runner/execution/unit-run-outcome.test.mjs` | `unit-run-history.mjs` | 0 | 0 | **retire** | Phase 3 |
| 82 | `test/runner/execution/unit-run-record.test.mjs` | `cwd-lock.mjs, unit-control.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 83 | `test/runner/execution/unit-summary.test.mjs` | `index.mjs, unit-run-history.mjs, unit-summary-twin.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 84 | `test/runner/execution/unit.test.mjs` | `config-twin.mjs, unit.mjs` | 1 | 0 | **rewire** | Phase 3 |
| 85 | `test/runner/herdr-private-home-trust.test.mjs` | `trust-store.mjs, cli.mjs, herdr-round.mjs` | 0 | 0 | **retire** | Phase 5 |
| 86 | `test/runner/herdr-spawn-adapter.test.mjs` | `transport.mjs` | 0 | 0 | **retire** | Phase 5 |
| 87 | `test/runner/loop.test.mjs` | `settlement.mjs` | 8 | 0 | **rewire** | Phase 5 |
| 88 | `test/runner/merge-quoted-paths.test.mjs` | `settlement.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 89 | `test/runner/operation-choice.test.mjs` | `assignment-layout-twin.mjs, assignment-runner.mjs, settlement.mjs` | 5 | 0 | **rewire** | Phase 5 |
| 90 | `test/runner/operation-prompt-templates.test.mjs` | `assignment-runner.mjs, assignment.mjs, effective-execution-contract.mjs, operation-prompt-templates.mjs` | 0 | 0 | **retire** | Phase 5 |
| 91 | `test/runner/provider-credential-renewal.test.mjs` | `assignment-runner.mjs, authority-twin.mjs` | 7 | 0 | **rewire** | Phase 4 |
| 92 | `test/runner/provider-per-cli-credential-sources.test.mjs` | `request.mjs` | 5 | 0 | **rewire** | Phase 4 |
| 93 | `test/runner/provider-pool-lease.test.mjs` | `config-twin.mjs` | 2 | 0 | **rewire** | Phase 4 |
| 94 | `test/runner/run-lock-identity.test.mjs` | `run-lock.mjs` | 1 | 0 | **rewire** | Phase 4 |
| 95 | `test/runner/run-outcome.test.mjs` | `run-result.mjs` | 0 | 0 | **retire** | Phase 4 |
| 96 | `test/runner/run-result-confinement-label.test.mjs` | `run-lock.mjs, assignment-runner.mjs` | 0 | 0 | **retire** | Phase 4 |
| 97 | `test/runner/run-result-report-complete.test.mjs` | `run-lock.mjs, assignment-runner.mjs` | 0 | 0 | **retire** | Phase 4 |
| 98 | `test/runner/run-result-v2.test.mjs` | `run-result.mjs` | 0 | 0 | **retire** | Phase 4 |
| 99 | `test/runner/run-result-v3-reader.test.mjs` | `run-result.mjs` | 0 | 0 | **retire** | Phase 4 |
| 100 | `test/runner/runner-schema-vocabulary.test.mjs` | `adapters.mjs, config-twin.mjs, index.mjs, seat-resolver.mjs` | 3 | 0 | **rewire** | Phase 5 |
| 101 | `test/runner/spawn-worker.test.mjs` | `dispatch-error.mjs, transport.mjs` | 4 | 0 | **rewire** | Phase 5 |
| 102 | `test/runner/tier-cell.test.mjs` | `config-twin.mjs` | 2 | 0 | **rewire** | Phase 5 |
| 103 | `test/runner/tier-fallback-config.test.mjs` | `config-twin.mjs` | 1 | 0 | **rewire** | Phase 5 |
| 104 | `test/runner/work-unit-for.test.mjs` | `unit.mjs` | 3 | 0 | **rewire** | Phase 5 |
| 105 | `test/runner/write-scope.test.mjs` | `write-scope.mjs` | 0 | 1 | **rewire** | Phase 11 |
| 106 | `test/seat-binding/client.test.mjs` | `config-twin.mjs` | 3 | 0 | **rewire** | Phase 6 |
| 107 | `test/session-host/head-start.test.mjs` | `session-attempt.mjs` | 7 | 0 | **rewire** | Phase 6 |
| 108 | `test/session-identity/attempt-writer-id.test.mjs` | `adapters.mjs` | 2 | 0 | **rewire** | Phase 6 |
| 109 | `test/setup/capability-catalog-doctrine.test.mjs` | `plan.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 110 | `test/setup/gate-kill-grace.test.mjs` | `gate-kill-grace.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 111 | `test/setup/packaged-definitions.test.mjs` | `operation-prompt-templates.mjs` | 4 | 0 | **rewire** | Phase 6 |
| 112 | `test/setup/seat-binding-dry-bind.test.mjs` | `config-twin.mjs, shipped-catalog.mjs` | 6 | 0 | **rewire** | Phase 6 |
| 113 | `test/state/work-size-rigor.test.mjs` | `plan.mjs` | 8 | 0 | **rewire** | Phase 6 |
| 114 | `test/util/session-identity.test.mjs` | `execution-contract.mjs` | 1 | 0 | **rewire** | Phase 6 |
| 115 | `test/workflow/case-admission-port.test.mjs` | `cwd-lock.mjs, seat-resolver.mjs` | 3 | 0 | **rewire** | Phase 7 |
| 116 | `test/workflow/case-bindings.test.mjs` | `cwd-lock.mjs` | 2 | 0 | **rewire** | Phase 7 |
| 117 | `test/workflow/case-close.test.mjs` | `unit-control.mjs` | 5 | 0 | **rewire** | Phase 7 |
| 118 | `test/workflow/case-runtime.test.mjs` | `cwd-lock.mjs` | 8 | 0 | **rewire** | Phase 7 |
| 119 | `test/workflow/case-verbs.test.mjs` | `cwd-lock.mjs` | 6 | 0 | **rewire** | Phase 7 |
| 120 | `test/workflow/conductor-case.test.mjs` | `cwd-lock.mjs` | 5 | 0 | **rewire** | Phase 7 |
| 121 | `test/workflow/core-workflow-seats.test.mjs` | `shipped-catalog.mjs, seat-resolver.mjs` | 6 | 0 | **rewire** | Phase 7 |
| 122 | `test/workflow/propose-frame.test.mjs` | `shipped-catalog.mjs` | 2 | 0 | **rewire** | Phase 7 |
| 123 | `test/workflow/propose-validate.test.mjs` | `shipped-catalog.mjs` | 5 | 0 | **rewire** | Phase 7 |
| 124 | `test/workflow/propose.test.mjs` | `shipped-catalog.mjs` | 6 | 0 | **rewire** | Phase 7 |
| 125 | `test/workflow/seats.test.mjs` | `shipped-catalog.mjs` | 4 | 0 | **rewire** | Phase 7 |

---

## 7. Non-Test, Non-Doc Files Naming Dead Paths (Step 7)

Total files: **62**.

### Phase 8 Assignments (Manifests, Census, Lock Registry, Recover Actions)
Phase 8 deletes the dead source files and closes the corresponding manifest entries and mutation census:

| File | Dead Paths Mentioned | Phase |
|---|---|---|
| `packages/component-authority/model/doors/list-run-directories.yaml` | 2 (client.mjs, assignment-layout-twin.mjs) | Phase 8 |
| `packages/git/contracts/mutation-census.v1.json` | 63 (client.mjs, cwd-lock.mjs, direct-launch.mjs...) | Phase 8 |
| `packages/component-authority/model/doors/agent-hook-table.yaml` | 2 (trust-store.mjs, worker-home.mjs) | Phase 8 |
| `packages/component-authority/model/doors/canonical-json-bytes.yaml` | 2 (trust-store.mjs, effective-execution-contract.mjs) | Phase 8 |
| `packages/holder-lock/contracts/lock-registry.v1.json` | 1 (trust-store.mjs) | Phase 8 |
| `packages/component-authority/model/contracts.yaml` | 3 (assignment-runner.mjs, assignment.mjs, plan.mjs) | Phase 8 |
| `packages/component-authority/model/doors/the-node-bind-facade-has-only-its-named-callers.yaml` | 3 (assignment-runner.mjs, plan.mjs, account-rotation.mjs) | Phase 8 |
| `packages/component-authority/model/doors/choose-an-executor-from-a-capability-s-prefer-only-in-the-seat-binding-crate-ask-bind.yaml` | 2 (config-twin.mjs, plan.mjs) | Phase 8 |
| `packages/component-authority/model/doors/derive-executor-facts.yaml` | 6 (config-twin.mjs, backend-registry.mjs, policies.mjs...) | Phase 8 |
| `packages/component-authority/model/doors/locate-and-read-a-project-config-file.yaml` | 1 (config-twin.mjs) | Phase 8 |
| `packages/component-authority/model/doors/global-fgos-directory.yaml` | 1 (harness.mjs) | Phase 8 |
| `packages/component-authority/model/doors/process-facts-proc.yaml` | 1 (harness.mjs) | Phase 8 |
| `packages/component-authority/model/doors/decide-a-dispatch.yaml` | 1 (plan.mjs) | Phase 8 |
| `packages/component-authority/model/doors/the-purpose-chooser-outside-bind.yaml` | 1 (plan.mjs) | Phase 8 |
| `packages/component-authority/model/doors/execution-s-node-seam.yaml` | 1 (session-attempt.mjs) | Phase 8 |
| `packages/component-authority/model/doors/tool-lookup-by-capability.yaml` | 1 (tool-providers.mjs) | Phase 8 |
| `packages/component-authority/model/components.yaml` | 3 (write-scope.mjs, seat-ledger.mjs, seat-resolver.mjs) | Phase 8 |
| `packages/component-authority/model/doors/footprint-write-scope-overlap-rule.yaml` | 1 (write-scope.mjs) | Phase 8 |

### Phase 9 Assignments (Contracts, Engine Rust Comments, Skills)
Phase 9 cleans up contract JSON notes, comments in Rust files, and skills text:

| File | Dead Paths Mentioned | Phase |
|---|---|---|
| `apps/fgos/src/wiring/unit_run_host/machine.rs` | 2 (client.mjs, execution-contract.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/records.rs` | 5 (client.mjs, run-lock.mjs, write-scope.mjs...) | Phase 9 |
| `packages/run-supervisor/contracts/unit-state.v1.json` | 4 (client.mjs, gate-kill-grace.mjs, run-lock.mjs...) | Phase 9 |
| `packages/run-supervisor/rust/src/controller/adopt_scan.rs` | 1 (client.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/controller/cwd-lock.v1.json` | 1 (cwd-lock.mjs) | Phase 9 |
| `packages/run-supervisor/rust/tests/controller_cwd_lock.rs` | 1 (cwd-lock.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/execution.rs` | 5 (direct-launch.mjs, assignment-runner.mjs, policies.mjs...) | Phase 9 |
| `packages/run-supervisor/contracts/controller/launch.v1.json` | 1 (direct-launch.mjs) | Phase 9 |
| `packages/run-supervisor/rust/src/controller/launch.rs` | 1 (direct-launch.mjs) | Phase 9 |
| `packages/run-supervisor/rust/src/controller/error.rs` | 1 (dispatch-error.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/controller/config.v1.json` | 1 (gate-kill-grace.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/controller/lease.v1.json` | 1 (run-lock.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/controller/trust-store.v1.json` | 1 (trust-store.mjs) | Phase 9 |
| `packages/run-supervisor/rust/src/controller/trust_store.rs` | 1 (trust-store.mjs) | Phase 9 |
| `packages/run-supervisor/rust/tests/controller_trust_store.rs` | 1 (trust-store.mjs) | Phase 9 |
| `packages/execution/contracts/transport/adapters.v1.json` | 1 (adapters.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/worker-env-allowlist.v1.json` | 1 (adapters.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/terminal.rs` | 2 (assignment-runner.mjs, herdr-round.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/checks.rs` | 2 (assignment.mjs, unit.mjs) | Phase 9 |
| `packages/execution/contracts/confinement-driver/registry.v1.json` | 1 (backend-registry.mjs) | Phase 9 |
| `packages/execution/engine/src/confinement/cleanup/probes/mod.rs` | 1 (harness.mjs) | Phase 9 |
| `packages/execution/contracts/transport-round/round.v1.json` | 1 (herdr-round.mjs) | Phase 9 |
| `packages/execution/contracts/transport/mechanism.v1.json` | 1 (mechanism.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/dispatch_plan.rs` | 1 (plan.mjs) | Phase 9 |
| `core/skills/_shared/capability-catalog.md` | 1 (plan.mjs) | Phase 9 |
| `packages/execution/rust/src/decide.rs` | 1 (plan.mjs) | Phase 9 |
| `packages/execution/contracts/corpus/README.md` | 1 (run-result.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` | 1 (session-attempt.mjs) | Phase 9 |
| `packages/execution/contracts/execution-routes/execution-routes.v1.json` | 1 (session-attempt.mjs) | Phase 9 |
| `packages/execution/contracts/transport-round/session-attempt.v1.json` | 1 (session-attempt.mjs) | Phase 9 |
| `packages/agent-protocol/contracts/agent-protocol.v1.json` | 1 (transport.mjs) | Phase 9 |
| `packages/execution/contracts/transport-round/executor-command.v1.json` | 1 (transport.mjs) | Phase 9 |
| `packages/run-supervisor/contracts/envelope.v3.json` | 1 (transport.mjs) | Phase 9 |
| `packages/execution/contracts/transport/visibility.v1.json` | 1 (visibility-session.mjs) | Phase 9 |
| `packages/execution/contracts/transport/worker-home.v1.json` | 1 (worker-home.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/accounts.rs` | 1 (account-rotation.mjs) | Phase 9 |
| `apps/fgos/src/wiring/unit_run_host/verify.rs` | 1 (custody-door.mjs) | Phase 9 |
| `packages/execution/contracts/core-loops/seats.v1.json` | 1 (seat-resolver.mjs) | Phase 9 |
| `core/skills/_shared/capability-matching.md` | 1 (unit.mjs) | Phase 9 |
| `core/skills/fgos-run/SKILL.md` | 1 (unit.mjs) | Phase 9 |
| `packages/resource-referee/contracts/resource-referee.v1.json` | 1 (unit.mjs) | Phase 9 |

### Historical Records / Non-Modifying References
These files contain historical records or doc comments that stay as written per plan Non-goals:
- `src/native/dispatch-error.mjs`: 1 mentions (history / non-blocking comments)
- `CHANGELOG.md`: 9 mentions (history / non-blocking comments)
- `domains/coding/harness/enrich-and-validate-contract.mjs`: 1 mentions (history / non-blocking comments)

---

## 8. Verification & Gate Checklist

- [x] Base commit recorded: `a43e451bb2a080d60e3bdea27584be0b172a19d7`
- [x] Import graph parsed across all JS/MJS/CJS files
- [x] String-scan completed; zero dynamic string path loaders found
- [x] Dead table count (63) + Live-kept table count (26) = 89 (exact match of `git ls-files src/runner/dispatch src/runner/execution src/run-supervisor | wc -l`)
- [x] Test-importer table classifies all 125 test files
- [x] **Outside every footprint** list is **empty** (0 files)
- [x] `src/runner/dispatch/session-attempt.mjs` confirmed dead, and coordination with plan 261124-0004 documented
- [x] Tail facades from plan 261122-0118 identified and categorized
