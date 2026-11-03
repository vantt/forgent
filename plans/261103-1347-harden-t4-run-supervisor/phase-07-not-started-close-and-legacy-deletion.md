---
phase: 07
title: "Adopt closes an attempt that has its lock and no envelope as abandoned-not-started and its home is finalized by finalize-home; the legacy sweep, its doctor row, its fix and the abandon-legacy intent go (decision 59 answer 2a); doctor 5 → 4"
status: pending (gated on OQ-1 and OQ-2 in plan.md)
depends_on: [01, 05, 06]
parallel: "none; the only owner-gated phase; nothing waits on it but phase 08"
effort: ~1d after the answers
net_size: "Node −240 / Rust +35 / tests −160 (estimate, with OQ-1 a and OQ-2 a)"
---

# Phase 07 — Not-started close and legacy deletion

## Context

[plan.md](plan.md) facts 1, 2, 6 ("Legacy mechanism") and owner questions OQ-1, OQ-2; decision 59 answer 2a; arbitration §4 first bullet (RT4-05); red-team RT4-05; RT-P1, RT-P2, RT-P3, RT-P6.

Code read on `fcd42ecdc`:
- `adopt.rs:110-113`: no `attempt.lock`, or an `envelope.json` that is not v3 → `legacy-run`; the adopt matrix pins both (`tests/adopt_matrix.rs:151-165`).
- Controller order: admission writes `run.json` `running` (`assignment-runner.mjs:1282, :1315`), awaits (`:1364`, `:1780`), takes the lock (`:1807`), writes the evaluator baseline (`:1831-1845`), makes the capture files (`:1957`, `prepareAttemptFiles`) and the home (`:1959`, `prepareConfinementForLaunch`), the terminal pane and trust entry (`:1990-2030`), then the envelope and side file (`:2088`, `writeAttemptFiles`).
- `buildEnvelope`'s step builder `direct-launch.mjs:174-182`; steps `:217-222` (`settle-attempt`, `finalize-home`, extra `cleanup-trust` for terminal `assignment-runner.mjs:2066`, builtin `release-slot`).
- Legacy mechanism (plan.md fact 6): `src/run-supervisor/legacy-sweep.mjs`; `src/setup/run-supervisor-checks.mjs:24, 345-382`; `src/setup/registrations.mjs:2083-2087, 2100`; `src/runner/dispatch/recovery-planner.mjs:36, 44, 98-146, 167-170, 240-256, 423-424`; `src/verbs/dispatch/recover.mjs:132-133, 289-298, 377`; `src/cli/command-registry.mjs:1432`; `packages/run-supervisor/contracts/recover-actions.v1.json:12-16`, `unit-state.v1.json:18-28`; resume message `src/runner/execution/run.mjs:288-290`.
- Tests: `test/run-supervisor/legacy-sweep.test.mjs` (6 tests), `inspect-recover-adopt.test.mjs:153, 161, 183, 203`, `resume-adopts.test.mjs:215` (test 9), `direct-crash-matrix.test.mjs:201` (7b) and `:209` (7c), `test/runner/assignment-enumerator-guard.test.mjs:85`, `test/setup/run-supervisor-checks.test.mjs` (legacy cases).

## Requirements (written for OQ-1 (a) and OQ-2 (a); the variants are at the end)

- **Census first, read-only, both machines** (RT-P3): every attempt directory with `attempt.lock` and no `envelope.json`, split by "has `controller/commands`", "has `attempt-intent.json`" (none before this phase) and `run.json` status. The owner machine runs it through the guide with the old release. A directory the new rule would close that is not a supervisor-era attempt blocks the land until the rule excludes it.
- **The controller holds the attempt lock from admission** (OQ-1 a): `acquireAttemptLocks` moves to right after admission, before the first await (`:1364`). Its inputs are known by then (`effectiveMutation` `:1177`, `cwd`, `opts.custody`, `attemptStr` from the admission); if one is not, stop and report, because the answer does not cover moving its inputs. Nothing between the run record and the lock may await; a comment says so; the known limit (a kill between the two synchronous statements) is written in the phase report and the spec hand-off.
- **The intent record** (OQ-2 a): right after the lock the controller publishes `attempt-intent.json` once (`publishImmutableProof`), contract `packages/run-supervisor/contracts/attempt-intent.v1.json`: `v`, `attemptId`, `unitRunId`, `runDir`, `mode`, `cwd`, `launch.capture`, `launch.outboxDir`, `steps` (from the same step builder `buildEnvelope` uses, one function), `sideFile`. No secrets.
- **Adopt closes it.** `adopt_one`: lock present, `envelope.json` absent, no `controller/commands`, lock free, `attempt-intent.json` valid → under the exclusive lock, publish `envelope.json` (`publish_once`) built from the intent with `origin: "adopt-not-started"`, no `launch.command`, `hostBin`/`payloadRoot` from the intent's steps, `protocolId` 1 and a digest from `envelope::digest`; then the ordinary path (`drive` with `bound = false`): receipt `abandoned-not-started` (reason `start-refused:no-envelope`), the steps (`settle-attempt`, `finalize-home`, `cleanup-trust` when the intent names it), `closed.json`. `--probe-only` answers `needs-adopt` reason `no-envelope`. A later controller that tries `writeAttemptFiles` meets `launch-collision` (`direct-launch.mjs:240-242`) and stops; `supervise` refuses the attempt because a receipt exists (`supervise.rs:326`).
- `settle-attempt` and `finalize-home` need no change: the synthesized envelope carries `attemptId`, `cwd`, `mode`, `launch.capture`, `sideFile` (the side file does not exist, `readSideFile` returns null, `controlOf` takes a new epoch once the writer is dead, `settle-attempt.mjs:65-76`).
- Lock without intent and without envelope (only the unawaited instant between lock and intent publish, or a pre-supervisor dir): `legacy-run`, as today; resume's refusal message no longer names a doctor fix (it names `fgos dispatch inspect`).
- **Legacy deletion** (answer 2a): `legacy-sweep.mjs`; the `legacy-attempts-stuck` check, fix and registration; the `abandon-legacy` intent (planner, evidence type, recover apply, CLI intent text, contract entry). `legacy-run` stays readable in adopt; `abandoned-legacy` stays readable in `unit-state.mjs:66`, `run.mjs:307`, `show-run.mjs:180` for runs settled before.
- Doctor 5 → 4. `CHANGELOG.md`: the legacy row and `--intent abandon-legacy` removed; a dispatch killed before its launch is now closed by the next `fgos run` or `fgos doctor --fix` and its unit can be resumed.

## Files

**Create:** `packages/run-supervisor/contracts/attempt-intent.v1.json`.

**Modify:**
- `packages/run-supervisor/rust/src/adopt.rs`; `packages/run-supervisor/contracts/envelope.v3.json` (`origin`, a not-started envelope has no `launch.command`), `recover-actions.v1.json`, `unit-state.v1.json`
- `src/run-supervisor/direct-launch.mjs` (intent writer, shared step builder), `src/runner/dispatch/assignment-runner.mjs` (lock moved, intent written)
- `src/setup/run-supervisor-checks.mjs`, `src/setup/registrations.mjs`, `src/runner/dispatch/recovery-planner.mjs`, `src/verbs/dispatch/recover.mjs`, `src/cli/command-registry.mjs:1432`, `src/runner/execution/run.mjs:288-290`
- Tests: `tests/adopt_matrix.rs` (+ lock-and-intent case, + intent-without-lock-free case), `tests/support/adopt_fixture.rs`, `test/run-supervisor/direct-crash-matrix.test.mjs` (7b re-pointed), `inspect-recover-adopt.test.mjs`, `resume-adopts.test.mjs`, `test/setup/run-supervisor-checks.test.mjs`, `test/setup/checks.test.mjs`, `test/runner/assignment-enumerator-guard.test.mjs:85`, `test/run-supervisor/contracts*.test.mjs` if they list contract files
- `CHANGELOG.md`, census

**Delete:** `src/run-supervisor/legacy-sweep.mjs`; `checkLegacyAttemptsStuck`, `fixLegacyAttemptsStuck` and the import (`run-supervisor-checks.mjs:24, 345-382`); registration and fix (`registrations.mjs:2083-2087, 2100`); `abandonLegacyFacts`, the `abandon-legacy` intent and `legacy-holders` evidence (`recovery-planner.mjs`), `applyAbandonLegacy` and its dispatch (`recover.mjs`), `legacyHolders` in `buildSnapshot`; contract entry `abandon-legacy`; manifest row `docs/architecture-manifest.json:254` (ask DOC first, as in phase 01).

**Tests to retire:**
- `test/run-supervisor/legacy-sweep.test.mjs` (whole file, 6 tests): behaviour removed (decision 59, 2a); the window it covered for supervisor-era attempts is owned by `adopt_matrix` (new lock-and-intent case) and `direct-crash-matrix` 7b.
- `inspect-recover-adopt.test.mjs` "abandon-legacy settles a legacy run only on proof …" (`:161`), "abandon-legacy settles a legacy run whose worker result nobody read …" (`:183`): behaviour removed. "a unit whose only attempt the legacy sweep settled is terminal for the unit and awaits resume" (`:203`): kept if `abandoned-legacy` still reads as terminal (read path stays), else behaviour removed. "a run from before the supervisor reads legacy-run …" (`:153`): kept (read-only verdict stays).
- `resume-adopts.test.mjs` 9 "an attempt the legacy sweep settled is not carried on from": kept if `run.mjs:307` stays (it does); its setup no longer uses the sweep.
- `direct-crash-matrix` 7c (envelope, no binding): owner `adopt_matrix::adopt_no_binding_and_no_receipt_is_abandoned_not_started_and_the_steps_run_once` for the matrix and 7b (re-pointed: killed after the home, before the envelope; adopt closes it and removes the home) for the real-step wiring.
- `assignment-enumerator-guard.test.mjs:85` entry: file removed.

## Net size

Rust: not-started close from the intent +35. Node: intent writer +15, lock move ±3, legacy-sweep −154, checks −40, registrations −6, recovery planner −45, recover −12, CLI −1 → about −240. Tests: legacy-sweep −133, inspect-recover-adopt −45, adopt_matrix +40, 7b +5, 7c −15, guard −1, doctor cases −10 → about −160.

## Steps

1. Census (both machines); stop if it finds a directory the rule must exclude and the rule does not.
2. Find the owning tests (`adopt_matrix` for verdicts, `direct-crash-matrix` 7b for the controller edge).
3. Contract and intent writer; lock move; `node --check`; FR on `direct-cutover`, `resume-adopts`, `direct-crash-matrix`.
4. Rust: adopt reads the intent, publishes the envelope, drives; the two `adopt_matrix` cases (red on main).
5. 7b re-pointed to the edge "home exists, envelope does not" (detected as `homesLeft().length === 1 && !envelope.json`); it must end `abandoned-not-started`, home removed, run settled.
6. Legacy deletion with its tests; doctor rows; CHANGELOG.
7. msvc and darwin checks; clippy; census; architecture and import-graph tests.

## Validation (focused)

- `cargo test -p fgos-run-supervisor --test adopt_matrix --test adopt_concurrency --test supervise_portable --test steps_runner`
- `cargo check -p fgos-run-supervisor --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`; clippy `-D warnings`
- FR `test/run-supervisor/direct-crash-matrix.test.mjs test/run-supervisor/resume-adopts.test.mjs test/run-supervisor/inspect-recover-adopt.test.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/sweep.test.mjs test/setup/run-supervisor-checks.test.mjs test/setup/checks.test.mjs test/runner/assignment-enumerator-guard.test.mjs test/architecture.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `rg -n "legacy-sweep|sweepLegacy|judgeLegacyHolders|abandon-legacy|legacy-attempts-stuck|legacy-holders" src bin packages test` → nothing (`abandoned-legacy` read sites stay)
- `npm run fgos:dev -- doctor --json`: four rows for this layer.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The owner machine still has a legacy run left running | M × M | Guide step: old-release `fgos doctor` and `--fix` on the three workspaces before this phase's release. |
| A pre-supervisor dir with a lock and no envelope is closed and its old run re-settled | L × H | `controller/commands` exclusion and the census gate. |
| The lock held from admission blocks a second writer on the same worktree during credential renewal | L × L | Same lease, a few seconds longer; written in the CHANGELOG line. |
| A slow controller writes its envelope after adopt closed the attempt | L × M | `publishImmutableProof` refuses (`launch-collision`); `supervise` refuses a dir with a receipt. |
| Previous release meets `attempt-intent.json` or an adopt-written envelope after a rollback | M × L | Old adopt reads the adopt-written envelope as a v3 attempt with a receipt (closed path); old legacy sweep handles intent-only dirs as before. |

## Variants

- **OQ-1 (b):** no lock move; `run.mjs` `assertAttemptsResumable` supersedes a `legacy-run` attempt with no `attempt.lock` and no `controller/commands` (the controller is already judged dead there), +8 Node; the 7a edge test asserts the resume instead of `legacy-run`.
- **OQ-1 (c):** `legacy-sweep.mjs` stays, reduced to the pre-lock window; its row stays; doctor ends at 5 rows; net Node about −60 instead of −240.
- **OQ-2 (b):** no intent file; adopt infers `attemptId` from the single directory under `protected/capture/`, takes `--payload-root` from the client, which spawns adopt with `attemptStepEnv()` moved into `client.mjs`; settle falls back to `run.json`'s `cwd`. Rust +45, Node +25; `client.mjs`, `direct-launch.mjs`, `assignment-runner.mjs` and `settle-attempt.mjs` change.

## Rollback

Revert the merge; re-activate the previous release (see the last risk row). `attempt-intent.json` files left behind are inert for the previous release.

## Done when

Census clean on both machines; the two `adopt_matrix` cases and 7b green; every legacy path gone; four doctor rows; landed with a guide section (old-release doctor check first); `wc -l src/run-supervisor/*.mjs` ≤ 1 000.

## Lead brief essentials

Starts only after OQ-1 and OQ-2 are answered (the big lead pastes the answers into the brief). Census before code. Delete list above. Find the owning test before writing a new one. Ask DOC for the manifest row. All plan.md lead rules apply.
