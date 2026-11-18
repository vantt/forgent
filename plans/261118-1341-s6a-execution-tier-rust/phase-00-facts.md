# Phase 00: facts, census, port map, corpus

Wave 1. Depends on: `blockedBy` met (S5 phases 11 and 12 and the worktree-door plan on `main`). Effort 2d. Writes
`reports/` and the Node-era record corpus.

## Context

The planner's scan (`plans/reports/planner-261118-1347-s6a-facts-and-design.md`) was read before S5 closed, and its
seam regex missed relative sibling imports and `import()` (V1). S5 phases 11 (doctor rows; `seat-binding-route`
becomes `bridge:S6a`) and 12 (doors rows with `retiredBy: S6a`, twins D7) and the worktree-door plan change the inputs.
Every build phase reads this phase's `reports/facts.md`, not the scan.

## Requirements

Produce `reports/facts.md`; every row cites `file:line` on the recorded `main` sha. Record the integration base
(merge base of `s6a-execution/integration` with `main`) for the re-sync rule.

1. **Module port map.** Each Node file under `src/runner/execution`, `src/runner/dispatch`, `src/run-supervisor`,
   `src/verbs/dispatch`, `src/runner/dispatch.mjs` -> target crate and module (P1, P2: `fgos-execution` pure,
   `fgos-execution-engine/<module>`, `fgos-run-supervisor/controller`, host wiring, or a tier-0 move of phase 02)
   -> the phase that ports it -> the phase that deletes it (the one removing its last caller). The phase table already
   splits every group over 2 500 Node lines (6/6b/6c, 7/7b, 8/8b, 13/13b, 16/16b; counts in plan.md); if a group still
   exceeds it, split by file here and the plan lead updates the table.
2. **Consumer census (seam).** Every specifier, static or dynamic, that resolves into those paths from a file outside
   them. Commands (record them with the counts):
   - imports: the resolving scanner below over `src bin scripts` and, separately, `test` (on `b5b237534`: 197 hits in
     60 non-test files; 188 test files including 8 helpers under `test/helpers/`);
   - string paths (spawned scripts, path joins, fixtures):
     `rg -l -e "src/(runner/execution|run-supervisor|runner/dispatch|verbs/dispatch)/" -e "src/runner/dispatch\.mjs" -e "['\"]runner['\"],\s*['\"](execution|dispatch)['\"]" -e "['\"]run-supervisor['\"]" src bin scripts test`
     minus the import hits (on `b5b237534`: about 25 more files, e.g. `test/rust-host/internal-routes.test.mjs`,
     `test/cli/dispatch-retired-doors.test.mjs`, `scripts/git/e3-bench.mjs:297`).
   The resolving scanner matches `from '...'`, `import '...'` and `import('...')` in `*.mjs|*.js|*.cjs`, resolves each
   relative specifier against its file's directory and keeps targets inside the deleted paths; it is committed as
   `test/golden-recorders/seam-scan.mjs` so phases 20 and 21 rerun it (empty outside the deleted paths = done).
   Each symbol hit is classed: `host` (long operation through `src/native/execution-door.mjs`: `run-unit`,
   `launch-session`, `custody`, `verify`, `sweep-attempts`, `cancel`, P4/P14), `addon` (pure or effectful read: addon
   `execution` namespace, P4b/P15), `move-down` (tier-0 leaf moved by phase 02, P19), `move-up` (only one Node layer
   uses it: `git mv` target named), `row` (dies with a doctor row of phase 15 or 17), `script`. Owner phase per row.
   Known misses of the old scan that must appear: `src/runner/{operation-choice,fanout-batch,work-compat,operation-capability,loop,agent-definitions}.mjs`,
   `src/session-host/head-start.mjs:108,121,126`, `scripts/record-mailbox-hook-fixtures.mjs:1188`,
   `bin/fgos.mjs:2127,2314,3450,3687,3775`.
3. **Admission and Workflow calls.** For a standalone `fgos run` (read-only, `--writes`, `--case/--activity`, from a
   confined worker) and for each Workflow and Work caller of `runUnit`: which of the six peer operations
   (`resolveBinding`, `admit`, `recheckEffect`, `settle`, `activityUnitOf`, `confinedWriteRefusal`) and events
   (`unitRunCreated`, `caseAdmitted`) are used, read from `src/runner/execution/{run,unit-run-start,run-request}.mjs`
   (`run-request.mjs:321-328,351,356`; `unit-run-start.mjs:197-204`) and `bin/fgos.mjs:2544`. Every `runUnit` option
   each caller passes (Workflow `src/workflow/runner.mjs:160-180`; Work `operation-choice.mjs:2327-2341`,
   `work-dispatch.mjs:129-143`, `fanout-batch.mjs:108-118`) and every error class a caller branches on
   (e.g. `custody-predecessor-unknown`, `runner.mjs:182`): the `run-unit` request and result schema of P14.
4. **Doctor rows.** The 30 `bridge:S6a` rows plus `seat-binding-route`: Node judge `file:line`, `fixes` entry, the
   Rust module that will judge it, phase 15 or 17. The live Node callers of `src/seat-binding/client.mjs` (P11).
5. **Doors rows.** Every row with S6a in `retiredBy` and every row whose `allowed`/`debt` names a path or symbol a
   phase deletes or moves, with the phase that edits it (V4). On `b5b237534` these are: "agent hook table"
   (`trust-store.mjs`, `worker-home.mjs`), "list run directories (twin)" (`assignment-layout.mjs`, `client.mjs`,
   `case-run-paths.mjs`), "process control: signal a process or group" (`provider-credential-probe.mjs`), "process facts:
   read /proc" (`runtime-dir.mjs`, `bwrap.mjs`, `probes/harness.mjs`), "canonical JSON bytes" (`recovery-planner.mjs`,
   `effective-execution-contract.mjs`, `trust-store.mjs`), "locate and read a project config file" (`dispatch/config.mjs`),
   "global fgOS directory" (`llm-accounts.mjs`, `probes/harness.mjs`), the two `capability-config.mjs` rows (job text
   names the path; phase 02 moves it), "choose an executor ... purposeSeatOf" (`dispatch/config.mjs`, `plan.mjs`),
   "tool lookup by capability" (`tool-providers.mjs`), "the raw capability section ..." (`execution/run.mjs`,
   `registrations.mjs`), "packaging doctor judgments" (`registrations.mjs` `checkBwrapAvailable`), "person's agent config
   writes", "agent definition tier directories", "per-session checkout registry" (P10), plus S5 phase 12's new rows.
6. **Tests.** Every test file and helper from §2 (import and string hits): behaviour list, its Rust owner phase, or
   "behaviour removed", and the phase whose footprint holds it (retire-with-path rule). Every
   `apps/fgos/tests/cli_tests.rs` and crate test that already covers a behaviour (no second proof).
7. **Golden recorders and corpus.** Per engine module, the Node entry the vectors are recorded from and its recorder
   path `test/golden-recorders/<module>.recorder.mjs` (written and committed by the module's phase). The corpus: sample
   real `.fgos/assignments/<id>/` and unit-run directories of this machine (pre-`seatSchema` records, legacy seat reads
   per `src/runner/execution/legacy-seat-read.mjs:1-8`, v2 and v3 run results, one open Node-era attempt, one adopt
   fixture), scrub prompt and brief bodies to fixed text, and commit it under `packages/execution/contracts/corpus/`
   with a README naming each sample's generation (F13).
8. **Prior art.** `git log -S` / `-G` on each moved exported symbol and on renamed ids; anything removed earlier and
   why (AGENTS.md "Prior art before design"). Known: `adopt` (`packages/run-supervisor/rust/src/adopt.rs:142,174`,
   `--scan`) and the `dispatch-cwd` holder-lock resource (`packages/holder-lock/rust/src/fence.rs:865`) already exist
   in Rust (V11).
9. **Collisions.** Board rows and open branches of plans 1045, 0947, 1159 touching the footprint; landed shas.
10. **Baselines.** `git-one-door-scan` count, Node line counts per directory, `test/suite-baseline.json` shares of the
    tests to retire.

## Steps

1. `git pull`; read the board rows of S5, the worktree-door plan, 1045, 0947, 1159. Record the `main` sha and cut
   `s6a-execution/integration` from it.
2. Commit `test/golden-recorders/seam-scan.mjs`; run it and the string scan; fill §2 with the counts.
3. Fill §1, §3-§10. Use `fgos dispatch decide --for impact-analysis --json`; if full, run GitNexus `impact` upstream on
   `runUnit`, `launchSessionAttempt`, `executeAssignment`, `loadRunnerConfigForDir`, `custodyHeld`, `unitRunFacts`;
   cross-check zero results with `rg`.
4. Build and commit the corpus (§7).
5. Propose phase table edits (splits, footprint corrections, test-file placement) at the end of `facts.md`; the plan
   lead applies them before wave 2.

## Validation

`reports/facts.md` exists; every section has rows; every port-map file appears once; the census row count equals the
hit count of the step 2 commands; every §6 file has an owning phase whose footprint names it.

## Risk and rollback

Risk: a missed importer surfaces at deletion time (phase 20/21 fails). Mitigation: the resolving scanner and the
string scan, rerun by 20 and 21. Risk: the corpus carries private text: scrub step, reviewed by the plan lead before
commit. Rollback: delete the report and the corpus.
