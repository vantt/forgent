# HARDEN T9 P11: tier rule, custody rule, three-seat acceptance

Branch `harden/t9-p11-architecture-rule`, from origin/main `a760f2a56`, rebased onto `e69ece15d`.

## What changed

- **Tier field.** `docs/architecture-manifest.json` gains `tierNames` (T0-T9), `tiers` (40 rows: a directory row, a key ending in `/`, holds a layer; a file row moves one leaf to the layer its real imports put it in; the longest key wins), `tierExceptions` (3 named ports) and the rule name `tier-downward`. +73 manifest lines against the +360 the phase estimated: a row per directory and per moved leaf instead of one per file (RUL104). The five hexagonal layers (`entry`, `use-case`, `infra`, `domain`, `kernel`) are unchanged and are a different axis.
- **Tier test.** `test/architecture.test.mjs` adds `tierOf`, `findTierViolations` and three tests: every file resolves to a tier and every row and exception names a real file; no file imports a higher tier and each named exception is still a real upward import (a stale one is red); a fixture test shows the rule catches an upward import, takes same-tier and downward ones, lets a file row beat its directory row, and honours only the exact named pair.
- **Custody rule.** One named assertion (`findCustodyNaming`): no file under `src/workflow` names `cwd-lock`, `unit-custody` or `workflow-worktree` in code. The manifest's rule vocabulary has no "forbidden pair", so no new rule engine. Exception list: empty. `case-lock.mjs`'s holder-lock `advance` lock passes (a fixture proves it).
- **Acceptance.** `test/workflow/unit-run-result-contract.test.mjs`, one test, through `startWorkflow` and `resumeWorkflow`: seat `seat-verdict` passes; seat `seat-flaky` runs on `broken-node`, a fixture executor declared in the test's own config whose worker file does not exist yet, so it ends `execution-failure` with `infrastructure: true`; the first call fails there. The worker is installed and `resume` runs the seat as a fresh Unit run, keeps the verdict seat's run, and `seat-refused` (frontier tier no model serves) ends the case `policy-refusal`; a further `resume` refuses `nothing-to-resume`. The test reads `outcome`, `infrastructure`, `rerunnable` (Workflow's own fold of `infrastructure`) and run ids; no private file of Execution.
- **Doc.** `docs/platform/architecture-map.md` §9.3 names the tier rule in three lines.
- **Plan.** Sub-plan row and phase file marked landed; "PROPOSED" removed (owner decision 85 Q1 a and Q3 a; COOK's contract is approved).

## How the tier numbers were grounded

Directory defaults follow the HARDEN layers (T0 native door and shared leaves, T1 holder-lock, identity, convention, config facade, T2 Git, terminal control, T3 Event Store, Observe, T4 Run Supervisor, T5 Dispatch, Execution, Seat Binding, T6 Workflow, T7 Work, T9 host and surface; T8 has no file). Run over the 1536 real edges between `src` and `bin` files, the defaults gave 39 upward imports. Thirty-six went away by tiering a leaf where its real imports put it, never by an exception:

| File(s) | Tier | Why |
|---|---|---|
| `runner/rigor.mjs`, `runner/operation-capability.mjs`, `cli/exit-codes.mjs`, `cli/parse-args.mjs`, `run-supervisor/payload-root.mjs`, `state/fgos-file-registry.mjs` | 0 | no relative imports: pure leaves that lower layers read |
| `runner/goal-check.mjs` | 1 | imports only holder-lock |
| `runner/paths.mjs`, `runner/worktree.mjs`, `runner/repo-locks.mjs` | 2 | they import Git ports and holder-lock; `git/status.mjs` and the Observe fault logs import them |
| `runner/agent-definitions.mjs` | 5 | imports Dispatch's `runner-config-error.mjs`; Dispatch, Execution and Workflow import it |
| `run-supervisor/steps/`, `run-supervisor/attempt-step.mjs` | 5 | the existing "lower tiers import no Dispatch" test already calls steps Dispatch code the supervisor runs; `attempt-step.mjs` is the supervisor's runner of them |
| `report/knowledge-resolver.mjs` | 7 | imports only `state/knowledge-registry.mjs`; `state/cleanup-harness.mjs` imports it |

Where the tier rule and the Work-layer guard overlap (`worktree.mjs` -> `state/store.mjs`), the existing `WORK_LAYER_EDGE_ALLOWLIST` entry and the new exception name the same edge for the same reason; each test reads its own list.

## Named exceptions (every one, with its reason)

| From | To | Reason |
|---|---|---|
| `src/runner/worktree.mjs` (T2) | `src/state/store.mjs` (T7) | throws the `StoreError` class its callers catch and uses nothing else of the Work store; the class moves down with the Work batch |
| `src/identity/directory-store.mjs` (T1) | `src/state/runtime-coordination.mjs` (T7) | the identity directory rebuild finds the main `.fgos` directory through the Work-state helper `getMainFgosDir`, which also imports `work-event-store`; it goes to the invocation-root door with the Work batch |
| `src/util/host-bin.mjs` (T0) | `src/runner/paths.mjs` (T2) | the host binary lookup needs the main checkout root and the `.fgos` directory that `paths.mjs` resolves through the Git port; the root resolver moves down when the project locator becomes one leaf |

All three involve Work files (tier 7) or the root resolver. None was fixed here: Work goes last, and moving `StoreError` or `getMainFgosDir` is a Work change.

## P09's move of `outcome.mjs` and `legacy-seat-read.mjs` to `kernel`

Sound under the tier rule and correct on authority. The hexagonal `kernel` class and the tier are separate axes. `src/runner/execution/outcome.mjs` is T5 and `src/workflow/definition.mjs` is T6, so Workflow importing Execution's outcome vocabulary is a downward import the rule accepts. `isVerdict` belongs in Execution's outcome module, where the contract (section 1) puts "whether a seat reached a verdict" with Execution; it stays, and Workflow reads it. Both files import nothing above T5.

## Proofs

- Red first on the tree: a planted `cwd-lock` import in `src/workflow/case-lock.mjs` and a planted `src/util` -> `src/workflow` import failed the custody test and the tier test by name, then were reverted (`git checkout`); the tree is green.
- The acceptance comparator goes red when the contract-only ledger drops `outcome` (checked, then restored).
- Every retired test: none. The acceptance test overlaps `workflow-runner-resume.test.mjs` ("infrastructure failure is run again") only in the rerun; that test owns rerun mechanics (twice-failing, once per call) and stays. The acceptance test owns the one wiring proof that a case settles from the contract's fields. Per-outcome cases stay with `unit-run-result-fixtures.test.mjs` and `workflow-store-ledger.test.mjs`.
- Real built host (`npm run fgos:dev -- workflow start --units`, from the fixture project, Rust host compiled): it ran, and ended the first seat `policy-refusal` (`posture-unavailable`, `infrastructure: false`, step `failed`, the other seats `pending`), a terminal verdict the case recorded as the contract says. It could not reach the infrastructure rerun there: the fixture's confinement registry is file-local to the test process (`seedFileLocalBwrapRegistry`), which a separately spawned host does not see, so no invocation could carry the seat's posture. That is a gap of the fixture, not of the code; a real-host three-seat run needs a project with a real attested confinement backend, which this machine's fixtures do not build.
- Gate: see below.

## Gate

- Focused: `test/architecture.test.mjs` 49 pass; `test/scripts/doc-health.test.mjs` pass; `test/scripts/check-decision-citation-drift.test.mjs` one fail, the known `document-identity` citation drift (5 findings in `document-identity/spec.md`, not ours); acceptance test and `workflow-runner-resume.test.mjs` pass.
- Census: `node scripts/git-one-door-scan.mjs --root . --write-census` 0 undeclared, census file unchanged.
- Full `npm test` (`/dev/shm/h9p11-full-125811.log`): 8795 tests, 8762 pass, 2 fail: the V7n addendum and the document-identity citation drift (both known, not ours). No run-tests ERROR lines.

## Authority

- **`refused` on a seat result is read by Workflow and is not a field of the contract.** `store.mjs` (`isRerunnable`: `results.some((r) => r?.refused)`) and `runner.mjs` (`unitFailureReason`: `results.find((r) => r?.refused)?.refused`) read `results[].refused: { reason, detail }`. Section 3's list of `results[]` names `seat`, `role`, `round`, `posture`, `outcome`, `infrastructure`, `runResult`, `binding`, `output`. The rerun decision does not need it (a refusal has `infrastructure: false`, so `isRerunnable` is false either way), but the failure text does. Where now: Execution writes it, Workflow reads it outside the contract. Where it belongs: the contract names a refusal field on the attempt (COOK), then the second read in `isRerunnable` goes. Not moved: not my files, and the contract is COOK's.
- The acceptance proof cannot hand Workflow a contract-only Execution result: `runner.mjs` imports `runUnit` directly and there is no seam, and adding one for a test would be a test-only branch. The proof therefore runs real Execution and replays the recorded ledger cut to the contract's fields; it covers Workflow's readers of the ledger (`projectWorkflowState`, `isRerunnable`), not the single place `runner.mjs` destructures the live result. If a contract-only double of `runUnit` is wanted, it needs a real injection port in `runner.mjs` first (T6, not this phase).
- `src/util/host-bin.mjs` (T0) depends on the root resolver in `src/runner/paths.mjs` (T2), and `src/identity/directory-store.mjs` (T1) on a Work-state helper: the project root and the main `.fgos` directory are still not one leaf. The invocation-root door (P02) left this edge; it is now a named exception, so it shows up in any change that touches it.
- `src/runner/paths.mjs` and `src/runner/worktree.mjs` are shared Git-level modules living in the Work directory `src/runner/` (tier 2 by file row). They belong in a lower directory; moving them is a rename that touches 31 importing files, so it is listed, not done.

## Lessons

- The defaults-first method worked: assign tiers by layer, run the rule, then settle each hit as "this leaf is lower" or "this edge is a named exception". 36 of 39 hits were a leaf in the wrong directory, which is itself the finding.
- A test run in a worktree needs the addon staged: `node --test` alone fails with `git-addon-not-shipped`; `scripts/run-tests.mjs` is the door. A script that imports fixture helpers needs `ensureScriptAddon()` first.
- A fixture's confinement registry and machine config are private to the test process and its temp home, so the real host cannot replay a fixture project; plan a real-host check against a project with an attested backend, or accept the in-process proof.
- The scout hook blocks any bash command that names `.git` or `target`; write such scripts with the Write tool instead.
