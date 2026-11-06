---
phase: 06
title: "T5: Execution Core, Dispatch Transport & Confinement, Seat Binding, Run Result Evaluator"
status: pending
depends_on: [05 closed, SEAT landed]
effort: ~7d (rough; largest Node block)
---

# Phase 06 — T5: Execution Core, Dispatch & Confinement, Seat Binding, Run Result (end component)

Template layer: follow the loop in [plan.md](plan.md#the-per-layer-loop). From T5 up, the Rust move uses the "gain in simplicity / cost of the move" criterion (proposal §4.3), not "move everything".

## Context links

[runner spec](../../docs/specs/runner.md), [confinement-authority](../../docs/specs/confinement-authority.md), [seat-binding spec](../../docs/specs/seat-binding.md) (after SEAT lands), [component-boundary](../../docs/platform/component-boundary.md); [audit 09-28](../reports/audit-260928-2318-dispatch-engine-stability-speed-simplicity-report.md) C1 (five shadow binders), C3, C4; SEAT plan [`plans/261020-2132-seat-binding-component/`](../261020-2132-seat-binding-component/plan.md) and its landing report.

## Received from other lanes (record here, never lose)
- **2026-11-06 17:00, owner via COOK (forgent-b7), assigned to HARDEN:** seat-start failures fail a whole round and `fgos workflow resume` does not rerun the step (backlog `p-d2dc4f2e`); `terminal:foreground-not-agent` intermittent, worse under load ~25 (board `c3b898650`); run `unit-run-1793956631940-4fd3625a`: two openai seats exited without outbox → execution-failure. DOCOS 17:0x: with omp 18.17.0 the herdr path loses the foreground 3/3 (`terminal:delivery-unknown`) while omp-cli-bwrap passes 3/3; omp 18.17.0 extracts natives to `~/.omp/natives/<ver>/` on first start, which a bwrap seat cannot write (doctor readiness check candidate). Two read-only investigations started: `plans/reports/debug-261106-1658-seat-start-failures.md`, `plans/reports/debug-261106-1658-workflow-resume-after-seat-failure.md`.
- **2026-11-06 16:2x, HARDEN smoke (own finding):** `fgos run "Reply with exactly the word ok and nothing else." --json` (read-only, bound to gemini/omp-cli-bwrap) ends `execution-failure`, exit 11, on the activated main release and on the P08 branch alike: the agent exits 0 with a valid claim, the run result is `verdict` / `verdict-inconclusive` (`confidence: no-evidence`), and the unit maps that to `execution-failure`. A plain read-only question should not fail. Look at how a read-only producer seat with no verdict is judged (P10 `runUnitBody` cut, or a P13 item); prior art first.
- **2026-11-06 15:5x, DOCOS (claude-wfgg@design-lap):** a gemini seat through omp died with `terminal:foreground-not-agent` about 10 s after start; its screen ended with omp's "Update Available / New version 18.17.0 … Run: omp update" banner (run `wf-run-1793953709917-02abe923`, unit `unit-run-1793954412001-d0f119a0`). **Corrected by DOCOS 16:0x:** the banner is most likely not the cause; the agent loses the tty foreground ~5–7 s after start (backlog `p-4bkfiw7d3j`: omp 5/83, pi 1/306, codex 0/183, claude 0/68), evidence and ranked hypotheses in `plans/reports/debug-261106-1557-omp-update-banner-seat-foreground-not-agent.md` (gate path `packages/terminal-control/rust/src/core.rs` `Core::send`, `gate/unix.rs` `spawn_agent`). Likely the same seat death COOK reported at 12:35. Owner ran `omp update`; a fresh run is confirming. For T5: the pane judge treats a CLI's own update banner/prompt as "not the agent"; check whether the launch should pass the CLI's no-update-check switch or the readiness check should name the cause. Also received (T6, not T5): `fgos workflow resume` does not rerun a step that ended `execution-failure`, so after an infra failure only a fresh run works.

- **Grace versus agent-ready rule (HARDEN T2 sub-plan D-T2-7, 2026-10-23).** The terminal config check that pane grace ≥ agent-ready timeout + 30 s uses a dispatch deadline (`src/runner/dispatch/herdr-deadlines.mjs`), not a terminal-control fact. T2 keeps it in the Node adapter and moves only the core's own rules (the 40×8 floor) into Rust. T5 decides where the rule lives. See [the T2 sub-plan](../261023-0415-harden-t2-git-terminal-control/plan.md).
- **From HARDEN T2 ([arbitration](../reports/council-261023-0402-harden-t2-arbitration.md) §5, 2026-10-23).** (1) The class-B herdr caller inventory of the T2 simplicity seat E-18 (`herdr-round.mjs`, `terminal-slot.mjs`, `assignment-runner.mjs:2009-2206`, `confinement/*`, `cli.mjs:1013-1048`, `run.mjs:107-115`, `legacy-sweep.mjs:54-57`) and its class-C stale comments. (2) `settlement.mjs:774` name-sniffing fallback; `usage-parsers.mjs:138-167` `parseHerdrUsage` returns all nulls. (3) `herdrSpawnAdapter` (`transport.mjs:676-707`): its refusal is the contract of a direct call; T5 decides. (4) E-3 consumer sites that re-parse the Git addon error outside T2 (`src/runner/merge.mjs:115,1236`, `src/runner/worktree.mjs:1098`, `src/verbs/merge/approve.mjs:165`, `src/verbs/events/migrate.mjs:242`, `src/event-store/native.mjs:33`) if T2 does not move them. (5) One `fgos doctor` run spawns 558 `internal seat-binding bind` host children (T2 speed seat F-D2).
- **H20 (HARDEN T1 arbitration, 2026-10-22):** `src/runner/lock-wait.mjs:22-24` is one default behind a module; callers `bin/fgos.mjs:3217,3291`; `test/runner/lock-wait.test.mjs` (53 lines) proves a function is called once. Inline the default at the CLI flag parsing and retire the module and test. Evidence: [T1 simplicity seat](../reports/council-261021-2338-harden-t1-seat-simplicity.md) S-E8.

- **Provider wording lists and run scan (HARDEN T3-04a [arbitration](../reports/council-261024-1947-harden-t3a-arbitration.md) §5, owner decision 30, 2026-10-24).** Delete Node's wording lists once the protocol names outcomes with evidence: `src/runner/dispatch/provider-auth-failure.mjs` and its test, `settlement.mjs:633-652` stderr rules, `provider-capacity.mjs:948-1009` text rules, `provider-credential-probe.mjs:24`, `provider-account-probe.mjs:26-27,136` (probes ask the protocol through a host route, cold path). Unify the stale-result guard (`herdr-round.mjs:351-361`) and claim lookup (`worker-artifacts.mjs:39-60`) with `newest_result` (B-A5). Note: T3 changed `packages/run-result`'s scan to a typed read of `result.json` (speed S-1), no contract change.
- **Addendum from the T3-04a [sub-plan](../261024-2035-harden-t3a-agent-protocol-observe/plan.md) (2026-10-24 21:10).** The Node outbox readers (`src/runner/dispatch/worker-artifacts.mjs:39-62,75`; `src/run-supervisor/steps/settle-attempt.mjs:186,197`) still follow symlinks, read unbounded and accept leading-zero result numbers that the protocol now refuses; B-A5's unification uses the protocol's rule and a regular-file check. 04a also deletes `UnitSummarySource`'s `ObservationSource` impl and Node `projectRunEligibility` / `isRfc3339Instant` (`assignment-layout.mjs`, owner decision 31).
- **From HARDEN T4 ([sub-plan](../261103-1347-harden-t4-run-supervisor/plan.md) hand-offs, [closing report](../reports/closing-261104-1734-harden-t4-run-supervisor.md), recorded 2026-11-04 17:54; due at T4 acceptance 2026-11-03 and recorded late).** (H-T4c) `src/run-supervisor/steps/cleanup-trust.mjs` read-modify-renames `~/.claude.json` without a lock: lost update between concurrent seats; also a `docs/backlog.md` row. (H-T4d) `src/runner/dispatch/provider-capacity.mjs` still re-judges login vs quota from stderr text; since T4 the receipt `reason` (`terminal:blocked:*`, `direct:blocked:*`) is the verdict and the classifier gets a typed `stopCause` plus `capacityEvidenceText` (reset time only), so the text judge can go. (H-T4e) `cliSpawnAdapter` runs short calls (probes, judges, goal check) outside the supervisor: decide whether short calls become `direct` attempts. (H-T4f) A pane allocated by a controller killed before its envelope is released by no close (no endpoint record yet); the allocation sits in `assignment-runner.mjs` and the release in terminal-control. (Dead door) `executeThroughConfinement` (`src/runner/dispatch/confinement/authority.mjs`) has no production caller since the non-supervised branch was deleted (`864a390fd..23740e065`); about 50 confinement tests still call it: re-home them on `prepareConfinementForLaunch` and delete the door, its export in `src/runner/dispatch.mjs` and the `test/architecture.test.mjs` call-site row. (Worker artifacts) `resolveWorkerArtifactPath` stays because the cli-spawn worker writes outside the outbox; it goes with H-T4e.

## Components, crates, Node

| Component | Rust | Node around it |
|---|---|---|
| Execution Core (Unit, `runUnit`, `bind()`, Pattern) | — | `src/runner/execution/*` 24 files, 5 162 lines |
| Dispatch Transport & Confinement | — | `src/runner/dispatch/*` 64 files, 28 579 lines (largest Node block; `assignment-runner.mjs` 2 672, `config.mjs` 1 842, `run-result.mjs` 1 379, `provider-credential-renewal.mjs` 1 250, `cli.mjs` 1 100), of which `confinement/*` 10 files, 6 011 lines |
| Seat Binding | `packages/seat-binding/rust` (on `seat-binding-wave`, not on main yet) | `src/seat-binding/client.mjs` (SEAT) |
| Run Result Evaluator | `packages/run-result/rust` (2 468) | `src/runner/dispatch/run-result.mjs` (1 379) — twin candidate |

Doctor rows in scope (many; gate 8 is the main lever here): runner/model/tier/executor rows `src/setup/registrations.mjs:1440-1518`, `dispatch-decide-hook-wired` :1600, `bwrap-available` :1746, `provider-capacity-state` :2287, executor rows :4698-4812, confinement rows :5351-5985, `runner-coordination-orgPolicy-shape` :6148, plus SEAT's rows after landing. The exact count comes from the layer's own baseline (loop step 1).

## Constraints

- Starts only after SEAT lands; takes SEAT's measured Node/test Δ (review §3 checkpoint after SEAT phase 08) as input.
- T0–T4 carry items that live in T5 files (e.g. liveness and atomic writes inside `assignment-runner.mjs`, `run.mjs`, `unit-summary.mjs`) must already be closed; T5 does not inherit them.
- One-door job owned here: config read (every `config.json` reader in `src/runner/**` through one door); T0/T1 hand-over sites in confinement probes and `recovery-planner.mjs` TTL liveness (phase 01 §A).

## Files

Filled by the T5 sub-plan with Create / Modify / **Delete** / **Tests to retire**. Delete candidates to check first: audit C1 shadow binders, `run-result.mjs` vs `fgos-run-result`, legacy seat reads SEAT leaves behind.

## Net size

Estimate before council (HARDEN commits only; SEAT's own Δ excluded): Node −2 000 to −6 000, Rust −300 to +300, tests −1 000 to −3 000. Layer total ≤ 0.

## Risks (layer-specific)

| Risk | L × I | Mitigation |
|---|---|---|
| Scope explosion in a 28 k-line block | H × H | Council ranks by gain/size; sub-plan may split T5 into tracks by file set, still one layer close. |
| Overlap with WORK, AGENT-WF callers | M × M | Board shared-file list; Work and Workflow internals stay out of scope. |

## Done when

Loop close criteria; parallel paths per job in T5 = 1; T5 net size ≤ 0.
