# Phase report: 6.4 P07 section A, integration, proof and T8 rerun (no landing)

Status: DONE_WITH_CONCERNS. Branch `controller-death/p07a-integration`, based on integration `304181cfe` (main `3b8d07c64` already in it). Nothing landed, no release built or activated, nothing pushed.
No component-boundary change.

## Integration
- Merged integration `304181cfe` (big lead's citation gloss + stale-wording fix) before the suite. Main had not moved.
- Host and `fgctl` built from this tree in a private target (`.fgos/runtime/phase-target`, `CARGO_BUILD_JOBS=4`); the worktree `target` link points at it so the fgctl tests run this branch's `fgctl`.

## Tests
| Run | Result |
|---|---|
| `cargo test --workspace --release --no-fail-fast` | 805 pass, 61 fail. All failures are outside this plan: `fgos-git`/`fgos-event-store` need git >= 2.53 (`git-floor-unsupported`, `--ref-format`; machine has 2.34.1), plus one lock test in `fgos-distribution` and the observe/host-runtime ones. This branch changes no `.rs` file against main. |
| Full `npm test` (`env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`, `FGOS_HOST_BIN` = the build) on `304181cfe` | 8165 tests, 8069 pass, 2 fail, 29 skipped. Fails: `skill-wrappers` projection (worktree only, wrapper absent) and `crash-matrix-adopt-resume` "direct: no-binding" ("crash never left the no-binding state in 8 tries", 498 s under load). The file alone: 30/30 pass. Same flake the big lead saw. |
| After the two fixes below: every test file naming `execution/run.mjs`, `admissionIdentityFor` or `runUnit`, plus `resume-adopts` and `architecture` | 19 files, 629 tests, 0 fail |
| Every file naming `recovery-planner`, `verbs/dispatch/recover`, `deriveRecoveryFacts`, `isActionLegal`, `legacy-sweep`, `run-supervisor-checks`, plus `architecture` | 10 files, 155 tests, 0 fail |

Not re-run in full after the two fixes (they are two small, scoped edits; scope runs above). The landing run of `npm test` must be repeated on the final tip.
The suite also leaked "Modified .fgos/runtime/npm-test.log" because my log lived under `.fgos`; keep logs outside `.fgos`.

## Independent review (Sonnet, read-only)
Six findings, ranked:
1. **CONFIRMED, fixed** (`9a0ddc751`): a run from before the supervisor that the legacy sweep settled as `abandoned-legacy` could never be resumed. `--resume` kept the dispatch retry id and `executeAssignment` refused it forever as `run-unreconciled/legacy-run`, while doctor and `inspect` told the person to resume. Red test first (resume-adopts #9), then `admissionIdentityFor` treats `settlement: abandoned-legacy` as abandoned, so resume launches a new attempt with `supersedesRunId`.
2. **Not reproduced.** Claim: controller, supervisor and gate all dead, lock free (`needs-adopt`) makes `--resume` refuse as "still needs-adopt". Test #8 (all three killed after the binding) shows the resume adopts and settles the attempt. Kept as coverage.
3. PLAUSIBLE, not fixed: after the first signal the controller only writes `cancel` and polls for `receipt.json`; `runUnit` keeps going until the process exits, so in a window the settle finishes within the 50 ms poll, `runUnit` could start a commit or reviewer. Real runs (cC, hC) exited within 1 s with receipt `cancelled` and a clean "chờ resume" line. Left as a named concern.
4. CONFIRMED, not fixed: a signal before the supervisor binds cancels nothing (exit 130 at once, no resume line). The attempt then runs uncancelled; the doctor/recover door handles it afterwards. Low.
5. LOW: a malformed `dispatch.cancelWaitMs` makes every `runUnit` throw a bare Error (doctor `cancel-wait` names the key).
6. LOW: `runUnit` installs SIGINT/SIGTERM handlers (refcounted, removed in `finally`) for the whole host process; an in-process caller loses its own signal handling while a unit runs.
Checks the brief asked for: resume never reruns a settled attempt and starts no second supervisor; recover CAS (snapshotHash, controlEpoch, actionKey) is intact; no test-only branch in `src`; second signal exits at once; legacy sweep keeps anything alive, unknown or with a v1 home; no plan or phase labels in code or tests.

## T8 rerun (real CLIs, this branch's `bin/fgos.mjs` + host build, clone of the mdview project at the trusted scratch dir `.../scratchpad/s7`)
Scripts and logs: `.fgos/runtime/tmp/t8-rerun/` (`launch.sh`, `watch.sh`, `kill.sh`, `*.meta`, `*.watch`, `*.exit`, `res.sh`). Watch lines every 15 s: controller, home, supervisor, attempt files.
Deviations from the T8 method, all because of the environment, not fgos:
- The claude trust dialog blocked the first herdr run in an untrusted path; fgos cancelled it by name (`terminal:blocked:trust-dialog`) and kept the pane. Rerun in a trusted path (big lead's choice, owner config untouched).
- The current Claude Code shell tool refuses a bare `sleep 50` (agent reported `blocked`). The herdr runs use `bash -c 'for i in $(seq 1 50); do sleep 1; done'` instead; cli runs keep `sleep 50`.
- cA, cB ran in a first clone under `.fgos/runtime/tmp/t8-rerun/tree`; the rest in the trusted clone. First launches of hB/hC/hD were killed 22-50 s after launch (hC/hD/cD ~50 s because the first kill helper found no pid and signalled nothing; the corrected helper signalled the controller).

| Case | Expected | Observed | Run id |
|---|---|---|---|
| hA | pass, all files | `pass`, receipt `exited`, steps done, pane closed, home removed | `unit-run-1792332631864-0fe348bc` |
| cA | pass, all files | `pass`, home removed | `unit-run-1792332013943-dd03dd5e` |
| hB SIGKILL 21:11:01 | worker lives to the end, settle by supervisor, home after the agent, pane `release`, `awaiting-resume`, `recover` adopt or not needed, resume without `runs/02` | agent ran to `T8-DONE-hB`, receipt `exited`, `release-slot` close, home kept until closed (removed 21:13:27+), pane gone; `show-run`: `unitState awaiting-resume`, `attemptState closed`; `recover`: park "already closed, nothing to recover"; `--resume` took 0 s, exit 0, only `runs/01`, `unit-summary.json` present | `unit-run-1792332635877-c87520bf` |
| cB SIGKILL 21:04:13 | same | worker lived (T8 original: died after ~30 s), receipt `exited` 21:06:25, home removed 21:06:33; `awaiting-resume`; `--resume` only `runs/01`, outcome pass | `unit-run-1792332224287-22aa3652` |
| hC SIGTERM | receipt `cancelled` within the wait, exit 143, `awaiting-resume`, resume = new attempt with `supersedesRunId` | exit 143 (recorded in `hC.exit`), receipt `cancelled` (gate exit 143), pane `retain`; resume 171 s, `runs/02` with `supersedesRunId` = attempt 01, pass | `unit-run-1792332919808-004e720b` |
| cC SIGTERM 21:09:51 | same | receipt `cancelled` published within 1 s of the signal, controller printed `chờ resume`; resume 184 s, `runs/02` supersedes 01, pass | `unit-run-1792332565375-9c966016` |
| hD SIGKILL, `--timeout 2m` | deadline enforced: receipt `timeout`, descendants dead, pane `retain` | receipt `timeout`, `stoppedBy soft-deadline`, 21:17:24 (about 2 min after start), pane `retain`, no process of the run left, home removed 21:17:32 | `unit-run-1792332923823-dc266b56` |
| cD SIGKILL, `--timeout 2m` | same | receipt `timeout` 21:17:28, no process left, home removed | `unit-run-1792332927845-9747d666` |
Exit codes read from `*.exit`: hC 143, hD 137, cD 137 (killed by the harness). Panes: the three retained panes (trust-blocked hA, hC, hD) were closed by hand at the end; no home left in `/tmp/fgos-confinement` against the "before" list.
Against T8 §1: every "Không" row is now "Có" (worker survives, settle, `inspect` closed, recover not parked, resume reuses the result without `runs/02`, deadline enforced, home removed after the agent, controller SIGTERM settles). cli worker survival changed Không to Có.
Open T8 §8 questions 4 and 5 are answered by the rows above (resume reuses the settled result; SIGTERM cancels instead of dying silently).

## Legacy attempts (criterion 6)
The six stuck attempts of T8 §4.1 were copied into the clone and swept with the doctor fix function (`fixLegacyAttemptsStuck`, same call the registered fix makes; `fgos doctor --fix` itself runs every registered fix, so I did not run it on a workspace):
- Before: 6 flagged, all recorded pids dead. First fix: 3 cli runs settled `abandoned-legacy`; the 3 herdr runs were **kept** with "run already settled -- nothing to recover" while `run.json` still said `running`: the recover door treated the unread `outbox/result-1.json` as settled, so the check failed forever and the fix never cleared it.
- Fixed (`ef787939d`): the recover precondition no longer parks an `abandon-legacy` of a `legacy-run` with status not `settled` (other intents unchanged, test pins both). Second fix: 3 settled; after: "no run from before the run supervisor is left running".
- On the real workspace these six, and the ~2100 old open attempts, are handled by the doctor at landing.

## Commits on this branch (after `304181cfe`)
- `9a0ddc751` fix(run): a resume launches a new attempt over one the legacy sweep settled instead of refusing it forever.
- `ef787939d` fix(recover): the legacy sweep settles a run from before the supervisor whose worker result nobody read.

## Landing steps (written, not run)
Precondition: owner/big lead go-ahead; every writer stopped in the three workspaces (forgentX, mdview, mcp-skill-hub); main still equals `3b8d07c64` or merged into integration first.
1. Rebuild nothing from this report: from the integration worktree, merge this branch (`--ff-only`), re-run the scope tests above and the full `npm test` on the final tip (private host build, env unset as above).
2. Record the decision with `fgos decision` (id `D-ADR0060`; the docs do not name it), regenerate `docs/decisions/index.md`.
3. Fast-forward main from a dedicated worktree (never switch the main checkout), record the Windows/macOS CI result of `controller-death/**` pushes (ask forgentx-95 to push; not done by this lead).
4. Build the release and stage it; `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, then forgentX; `fgos setup </dev/null` in each.
5. Old open attempts: `fgos doctor --fix` in each workspace (forgentX: ~2100 old open attempts via `run-attempts-stuck` adopt sweep; the six T8 runs via `legacy-attempts-stuck`). Check afterwards: `run-attempts-stuck`, `legacy-attempts-stuck`, `units-awaiting-resume` (warn only, lists what a person may resume), `cancel-wait`, `active-release-matches-checkout` pass; the failing set should be the owner-config set from the 6.3 landing.
   - Attempts whose envelope names a pruned `hostBin` cannot be adopted (no fallback, recorded since 6.3): doctor names them; do not prune old releases before step 5.
6. Smoke in a trusted scratch clone: one `fgos run`, Ctrl-C (exit 130, `chờ resume`), then `fgos run --resume <unit>` reaches `unit-summary.json`.
7. Landing report with `No component-boundary change`; update the program board row.

## Rollback runbook
1. With the new release still active, `fgos doctor --fix` until `run-attempts-stuck` and `legacy-attempts-stuck` are clean (so no attempt is left only this release can judge).
2. Stop writers; revert the merge on main from a dedicated worktree.
3. Activate release 6.3 (`sha256:a6bcdc29000d359ac9de82eeeaf325ef664db77a90fc59394958296882b96c08`) with `fgctl upgrade --from <6.3 tree>` or `fgctl repair`; restore `fgctl` from `.fgos/runtime/tmp/landing-6.3/fgctl.prev` only if the new `fgctl` is the problem.
4. State that stays and is safe: closed attempts (release 6.3 adopt skips `closed`), `abandoned-legacy` settlements (a run.json field the old release ignores), `unit-control` ledgers (an unused file for 6.3). `dispatch.cancelWaitMs` is read only by this release; remove it from config if it was set.

## Concerns
- Review findings 3 and 4 (signal races), 5 and 6 are open and low; none changes the safety of a settled attempt.
- `crash-matrix-adopt-resume` "direct: no-binding" is load-sensitive (fails under the full suite, 30/30 alone); not changed here.
- Credential write-back exactly-once across adopt is covered by unit tests, not by the crash matrix.
- `fgos doctor --fix` runs every registered fix; at landing run it per workspace only after the stop-everything step.

## Unresolved
- Should `binding present, agent never started` settle as `abandoned-not-started` (resume relaunches) instead of `gate-lost` (P05's question, still open for the owner).
- Windows/macOS CI for `controller-death/**` not run (needs a push by the big lead).
