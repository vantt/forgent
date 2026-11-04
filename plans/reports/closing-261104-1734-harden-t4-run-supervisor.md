# HARDEN T4 closing report: Run Supervisor and Launch gate

Machine fg-server2, main `abbc4a98e`, measured 2026-11-04 17:35 to 17:55 (Asia/Saigon). Measurement and documentation only: nothing under `src/`, `packages/`, `docs/`, `test/` or any plan file was edited, nothing committed. Baseline: [research-261103-1212-harden-t4-baseline](research-261103-1212-harden-t4-baseline.md) (main `e078ca201`), same methods. Plan: [plan.md](../261103-1347-harden-t4-run-supervisor/plan.md). Phase reports: [P06](lead-261104-1620-harden-t4-p06-test-structure.md), [P07](lead-261104-1651-harden-t4-p07-not-started-close.md). No `lead-261103*` phase report exists in `plans/reports/` (P01 to P05 carry no report file there). Owner-machine guide: [guide-261104-1651-owner-machine-harden-t4-run-supervisor](guide-261104-1651-owner-machine-harden-t4-run-supervisor.md) (drafted; the big lead completes it and the board).

## 1. What landed

Every phase is on main; all hashes are ancestors of `abbc4a98e`.

| Part | Main commits | Landed |
|---|---|---|
| Before the plan (RT4-01, B-2, RT4-02, RT4-07, RT4-03, B-7, B-9, S10) | `882d84fb6`, `9c83096bf`, `4514a930f`, `5443ba3c7`, `ec76cee0e`, `0f8f0a13b`, `37a1aa794`, `5f7d4c54d` | before 2026-11-03 |
| Pane idle counts letters only (decision 58) | `16150dca1` | 2026-11-02 |
| P03 gate one door | `fa9e84c1c..8e0f53264` (6 commits) | 2026-11-03 14:36 |
| P02 one outcome authority | `0c1e509e2..231c91f51` (6) | 2026-11-03 |
| P05 controller side, non-supervised branch and `http` adapter removed | `864a390fd..23740e065` (5), `fab7438dd` | 2026-11-03 15:06 |
| P04 one watch step, hostile reads | `fad7e0fab` | 2026-11-03 15:33 |
| P01 adopt custody, sweep into client, doctor 8 to 5 | `3a940e2a8` | 2026-11-04 16:21 |
| P06 test structure | `4e86aec63`, `1dc20857b` | 2026-11-04 16:49 |
| P07 not-started close, legacy sweep deleted, doctor 5 to 4 | `7b82bf9b2`, `b6f9a545c` | 2026-11-04 17:33 |
| Dead result ladder removed (outside the phases) | `d333328ec` | 2026-11-04 17:32 |
| Workspace rustfmt (decision 60, not a T4 change; see section 3) | `c37d76811`, regressions fixed by `45e07caf2`, `b6260e061` | 2026-11-03 |

Acceptance greps of plan.md criteria 3 and 4 were re-run on `abbc4a98e`: `fn parse_args|fn report|EXIT_USAGE|EXIT_VERSION_MISMATCH` in `gate.rs`, `"/proc` in the crate src, `supervisor-heartbeat`, `httpAdapter|'http'` in `src/runner/dispatch`, and `legacy-sweep|sweepLegacy|abandon-legacy|legacy-attempts-stuck` in `src bin packages` all return nothing. `paneScreenOf` remains only in `src/run-supervisor/steps/settle-attempt.mjs:73,187` (the screen text kept for the person-facing capture, as criterion 3 allows).

## 2. Measured before / after

Method as in the baseline. Load average is `/proc/loadavg` (1 minute) at the start of each measurement. Test runs used `HERDR_*` and `CLAUDE*` variables unset.

| Baseline row | Before (`e078ca201`) | After (`abbc4a98e`) | Load | Note |
|---|---|---|---|---|
| Rust crate src lines (`wc -l`, 17 files) | 4 677 | 6 575 (17 files) | n/a | Raw count includes the workspace rustfmt commit `c37d76811` (+2 092 / -452 in crate src, net +1 640): about 4 935 without it. The per-commit table (section 3) is the authority |
| Rust test lines (`tests/` plus `examples/`, `.rs` only) | 4 757 | 7 147 | n/a | Same formatter effect (+2 570 / -564 in tests): about 5 140 without it. Fixtures (`.py`, `.sh`, `.mjs`) excluded in both |
| Rust test count | 134 (17 unit, 117 integration) | 149 (19 unit, 130 integration) | n/a | Red tests added by P02, P03, P04, P07 |
| Rust test wall time | 126 to 128 s (127.9, 126) | 72.9 s wall, 71.4 s summed test time | 1.9 | Criterion 9 (at most 50 s) not met. `gate_pid1` 57.2 to 19.1 s, `supervise_terminal_fake_herdr` 35.5 to 19.1 s, `gate_portable` 6.5 s, `supervise_portable` 4.4 s |
| Rust build (`cargo build -q --examples`, private target) | about 3.4 s | 3.3 s | 1.4 | |
| Node `src/run-supervisor` lines, outside `steps/` | 1 192 (plan.md count; 1 493 with `steps/`) | 1 057 (1 351 with `steps/`, 13 files, was 15) | 1.4 | Plan targets: at most 1 150 after P05 (met), at most 1 000 after P07 (not met, +57; P07 report named this) |
| Node attempt supervision in `src/runner/dispatch` (5 files) | 3 998 | 3 830 (`assignment-runner` 2 202, `transport` 646, `herdr-round` 495, `run-lock` 384, `terminal-slot` 103) | 1.4 | |
| Node `test/run-supervisor` tests, files | 171 tests in 20 files, 170 pass, 1 skipped | 138 tests in 19 files, 137 pass, 0 fail, 1 skipped (Windows) | 2.2 | |
| Node batch of those files | 158.9 s test time, 165 s wall | 118.6 s test time, 120.6 s wall | 2.2 | The batch ended with a `run-tests: ERROR: ... leaked` line naming only `.fgos/runtime/mailbox/mail-taken`, written by another session's mailbox work, not by these tests (nothing under assignments). Load rose to 5.8 near the end from other sessions |
| Node per-file loop, sum | 561 s | 321.4 s | 5.4 at start, 0.9 at end | Floor is now `terminal-cutover` (120.6 s), then `resume-adopts` 52.6, `crash-matrix-adopt-resume` 48.7, `direct-crash-matrix` 37.5, `terminal-fallback` 30.1 |
| Doctor rows of the layer | 8 (7 pass, 1 fail) | 4: `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-config`; all pass | 1.2 | `run-attempts-stuck` now reads as a warning naming the stuck attempt of 10-19 (its release was removed, 3b), no longer a fail |
| Whole `fgos doctor --json` | 51.2 s, 150 rows | 87.7 s, 147 rows (working-tree code through `npm run fgos:dev`, includes host materialization) | 1.2 | Not like for like: the activated release on this machine is still the old one (plain `fgos doctor --json`: 60.6 s, 152 rows, still lists the 8 old row ids, load 0.8). Whole-doctor time is dominated by other layers; do not attribute it to T4 |
| Doctor per-row time | not available in the baseline | route 17 to 29 ms, socket dir 2 to 5 ms, stuck attempts 188 to 217 ms (scan of 503 attempt dirs), config: not measured standalone (it needs the host-held git addon; standalone import answers a read error that the full doctor does not show) | 1.6 | Measured by calling the four check functions from a scratch script |
| `attempt-step` import time | not measured in the baseline | entry module 41.0 to 2.5 ms; entry plus its own step module: `finalize-home` 40.0 to 25.8 ms, `cleanup-trust` 40.5 to 11.7 ms, `settle-attempt` 39.8 to 37.3 ms | 1.4 | Median of 11 imports in a fresh node each, `e078ca201` extracted into a scratch directory for the old side. Import only, not process start or route work |
| One direct and one pane seat launch time | not measured in the baseline (TEST evidence about 1.2 s per real seat) | not measured | n/a | A seat launch needs a real provider dispatch (direct) or a herdr pane (pane seat); the task forbids dispatching real agents |
| Windows and macOS warnings | msvc 2 (6 dead fields), darwin 1 | not re-run here; the P06 and P07 reports record msvc and aarch64-apple-darwin `cargo check` clean for the crate and `5f7d4c54d` removed the warnings | n/a | Reported by those leads, not run by me |

The private Cargo target directory was deleted after the run (`CACHEDIR.TAG` present, literal path removed, `df -h /` after: 196 GB free, 55 percent used). `git status` shows no change from this work.

## 3. Net size per language

Counted with `git show --numstat` per commit, summed per set. Rust test code counts as tests (files under `rust/tests/` and `rust/examples/`, plus the tail of a src file from its `#[cfg(test)]` line, by before and after difference). "Other" is contracts, vectors, CHANGELOG, census, fixtures. Estimates are plan.md's per-phase columns (Node src / Rust src / tests).

| Set | Commits | Node src | Rust src | Rust tests | Node tests | Other | Docs | Estimate (Node / Rust / tests) |
|---|---|---|---|---|---|---|---|---|
| Before the plan | 8 | +60 | +31 | +80 | +55 | +5 | 0 | not in the plan |
| P03 | 6 | +3 | -25 | +58 | +16 | +1 | 0 | +1 / -78 / +10 |
| P02 | 6 | -8 | +78 | +90 | +104 | +254 | 0 | -65 / +35 / +15 |
| P05 (with `fab7438dd`) | 6 | -860 | 0 | +33 | -1 222 | +3 | 0 | -236 / 0 / -130 |
| P04 | 1 | 0 | -4 | +55 | 0 | 0 | 0 | 0 / -69 / 0 |
| P01 | 1 | -25 | +67 | +58 | -10 | -14 | -4 | -78 / +22 / -15 |
| P06 (with `1dc20857b`) | 2 | 0 | 0 | +9 | -237 | +1 | 0 | 0 / 0 / -243 |
| P07 | 2 | -200 | +97 | +101 | -240 | +10 | -2 | -240 / +35 / -160 |
| **Phases P01 to P07** | 24 | **-1 090** | **+213** | **+404** | **-1 589** | +255 | -6 | **-618 / -55 / -523** |
| `d333328ec` dead ladder | 1 | -73 | 0 | 0 | -95 | -1 | -1 | not in the plan |
| `16150dca1` pane idle | 1 | 0 | -2 | +19 | -4 | +1 | 0 | not in the plan |
| **All T4 commits listed** | 34 | **-1 103** | **+242** | **+503** | **-1 633** | +260 | -7 | |

Layer total of the phases: code lines (Node src + Rust src + all tests) = -1 090 + 213 + (404 - 1 589) = **-2 062**, estimate -1 196, so criterion 8 (at most 0) is met by a wide margin. By language: Node src beat its estimate by 472 lines (P05 deleted more than planned: the `http` adapter, `executeExecutorCli` and the `via: api` path went together); Node tests beat it (-1 589 against an unsplit tests estimate of -523, tests total -1 185); Rust src is **+268 over** its estimate (-55 planned, +213 actual: P02 +43, P01 +45, P07 +62, P03 +53, P04 +65 each above their column), because the receipt reason wiring, the adopt custody judges and the intent reader cost more than planned. Rust tests are +404 where about -523 of the tests estimate was Node: the red tests of P02, P03, P04 and P07 were added and not offset on the Rust side.

The workspace rustfmt commit `c37d76811` is not a T4 change and is excluded above: in `packages/run-supervisor` it is +4 662 / -1 016 lines (crate src +2 092 / -452, tests +2 570 / -564). P03, P02 and P05 landed before it, P04, P01, P06 and P07 after it on formatted code.

## 4. H-T4g: docs lines for DOC

The docs tree moved: the phase file's `docs/specs/*` names now live under `docs/platform/**`; there is no `docs/specs/` directory. Lines are on main `abbc4a98e`. Spec = `docs/platform/run-supervisor/spec.md`. "Commit" is the commit that made the described behaviour true in code. The spec itself is unchanged by T4 (docs frozen until DOC Land), so every spec row is open.

| File:line now | Change | Commit that made it true | State |
|---|---|---|---|
| Spec `:46-61` (section 2) | Add the approved Part A target shapes ([arbitration section 2](../reports/council-261103-1249-harden-t4-arbitration.md#2-part-a-target-shapes-for-owner-approval)) and the Node budget (at most 1 150, then at most 1 000 lines outside `steps/`; actual 1 057) | all phases | open |
| Spec `:82` | `supervisor-heartbeat.json` is no longer written; only `agent-binding.json` stays | `fad7e0fab` | open |
| Spec `:62-82` (layout table) and `:88` (envelope) | `attempt-intent.json` (contract `attempt-intent.v1.json`) written by the controller under the lock, replaced on each launch, removed when a run settles with no envelope; envelope v3 gains `origin` (`adopt-not-started`) | `7b82bf9b2` | open |
| Spec `:95` (section 4 step 4) | The binding wait is the three start budgets plus 15 s (45 s) | `7863809c2` | open |
| Spec `:153` (section 5.3) | Idle counts letters on the screen only, not a `working` status | `16150dca1` | open |
| Spec `:153` and `:157-159` | The screen is sampled only while idle can come before the soft deadline; a pane idle of 20 min never fires before the default 15 min soft deadline (B-13) | `fad7e0fab` | open |
| Spec `:357` (section 16, Vietnamese blind-time line, "đọc được `working`") | Replace by the letters-only rule | `16150dca1` | open |
| Spec `:169-184` (section 6 receipt, fields at `:184`) | `outboxResult` field; `reason` names `terminal:blocked:*` at a deadline stop and `direct:blocked:*` at a direct exit | `897b86938`, `f089585cb` | open |
| Spec `:186-202` (section 7 steps) | The route verifies the envelope and step; the Node entry keeps only the step environment and release-manifest checks | `864a390fd` | open |
| Spec `:205`, `:210` (section 8) | Adopt closes a lock-with-intent-without-envelope attempt as `abandoned-not-started`; `legacy-run` is only "lock without envelope and without intent" and is read-only (no doctor owner) | `7b82bf9b2` | open |
| Spec `:245`, `:257` (section 9.1) | Controller-death row for "no binding yet"; the `legacy-run` resume row loses its doctor owner (refused `attempt-legacy-run`, message points to `fgos dispatch inspect`) | `7b82bf9b2` | open |
| Spec `:281-298` (section 11, Supervisor and Gate rows `:289-290`) | Windows: the attempt lock is free once the supervisor is gone; the job held by the gate keeps the attempt; adopt refuses while the bound gate is not dead (B-1) | `3a940e2a8` | open |
| Spec `:311-332` (section 14; rows `:323`, `:327`, `:328`, `:329`, `:330`) | Four rows with the conditions of plan.md's table: `process-containment`, `gate-kill-grace`, `cancel-wait`, `units-awaiting-resume`, `legacy-attempts-stuck` rows are replaced by `run-supervisor-route`, `run-supervisor-config`, `run-attempts-stuck` (warns on a removed release and on units awaiting resume) | `3a940e2a8` (8 to 5), `7b82bf9b2` (5 to 4) | open |
| Spec `:338` (section 15) | The `lock-scan` sentence goes (the route contract no longer lists it) | `3a940e2a8` | open |
| Spec section 15 (new lines after `:345`) | The two accepted known limits (section 7 below) | `7b82bf9b2` | open |
| Spec section 16 (new Vietnamese lines after `:362`) | Decision 59 answers as settled facts (1a, 2a, 3b, 4a, 5a, 6a) and OQ-1 (a), OQ-2 (a), the accepted P07 deviation | all | open |
| `docs/reading-map.md:186` | The run-supervisor entry still names `gate-kill-grace`, `cancel-wait`, `legacy-attempts-stuck`, `units-awaiting-resume`: replace by the four row names | `3a940e2a8`, `7b82bf9b2` | open |
| `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:206` | History line of the `--resume` decision names the retired mechanism: mark superseded by adopt-closes-not-started | `7b82bf9b2` | open |
| `docs/platform/runner/decisions/h-36d872fbb0e5.md:1813` | History line names `legacy-attempts-stuck` and `abandoned-legacy` settle by doctor: mark superseded | `7b82bf9b2` | open |
| `docs/platform/component-boundary.md:94`, `:95` | Run Supervisor and Launch gate rows: Node budget, parts (adopt custody and intent close, steps launcher, gate through `route::Flags` and `envelope::read_verified`) | all | open |
| `docs/backlog.md` (no row today) | New row H-T4c (`cleanup-trust` lost update on `~/.claude.json`, T5); new row for the two accepted known limits | n/a | open |
| `docs/architecture-manifest.json` (rows `:248-260`) | Rows of deleted `sweep.mjs`, `legacy-sweep.mjs` and `result-ladder.mjs` removed | `3a940e2a8`, `b6f9a545c`, `d333328ec` | done (no such row remains) |
| `docs/platform/packaging-distribution/spec.md:554-556` (rows 7e, 7f, 7g; old 7i gone) | Doctor list: the four run-supervisor rows only | `3a940e2a8`, `b6f9a545c` | done |
| `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:140`, `:142` | Registered checks and fixes lists: four rows, `legacy-attempts-stuck` and its fix gone | `3a940e2a8`, `b6f9a545c` | done |
| `docs/platform/agent-confinement/spec.md:364` | The attempt sweep lives in `src/run-supervisor/client.mjs`, not `sweep.mjs` | `1dc20857b` | done |
| `docs/decisions/index.md` | Generated projection (`fgos decision-index`); regenerates from the spec history | n/a | open (regenerate after the spec section 16 lines) |

Repo-wide check of the retired names under `docs/` outside the spec: only `reading-map.md:186` and the two history lines above still name them.

## 5. Hand-offs H-T4a to H-T4f

From plan.md; state is what I could verify in the repo. The plan says the big lead copies H-T4c, H-T4d, H-T4e into the T5 phase file's "Received" section and H-T4a, H-T4b to TEST on the board.

| Id | What | Receiver | State |
|---|---|---|---|
| H-T4a | Every Node step process hashes the whole native addon (185 MB debug in tests) | T9/Packaging ledger H13 and TEST | H13 exists in the HARDEN plan ledger (`plans/261021-1118-harden-low-layers-bottom-up/plan.md:294`); the TEST board line is not verified by me |
| H-T4b | Confinement probe cache misses in tests; fixture sets `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH` | TEST | not verified on the board; waiting for the big lead |
| H-T4c | `cleanup-trust` read-modify-rename of `~/.claude.json` without a lock | T5 and a `docs/backlog.md` row after DOC Land | no `H-T4` entry found in the [T5 phase file](../261021-1118-harden-low-layers-bottom-up/phase-06-t5-execution-core-dispatch-seat-run-result.md) Received section (`grep` of `H-T4`: none); waiting for the big lead. No backlog row yet |
| H-T4d | `provider-capacity.mjs` re-judges login vs quota from stderr text and parses the reset time; the receipt reason is now the verdict, a pane seat's reset-time parse loses the screen | T5 | same as H-T4c: not recorded in the T5 file. `231c91f51` kept the quarantine class and printed reset time for a pane seat, so the P02 risk is reduced but the stderr re-judge is still T5's |
| H-T4e | `cliSpawnAdapter` (short calls) and whether short calls become `direct` attempts | T5 | same: not recorded in the T5 file |
| H-T4f | A pane allocated by a controller killed before its envelope is not released by any close | T2/terminal-control backlog | unchanged from today (P07 report: not covered); not recorded |

## 6. Received items of the layer phase

Answered by landed work: dead fields (`5f7d4c54d`); outcome wiring, direct `classify` and red test 8 (P02); R5 launch cost (P05 `864a390fd`: the step entry now loads only its own module, 41.0 to 2.5 ms entry import; the larger remainder is H-T4a); worker session server and hold transport settled with no work.

## 7. Accepted limits and deviation

Accepted known limits (plan.md "Phase landings", P07):
1. A kill on the instructions between the run record and the attempt lock (all synchronous, no await), or a failure of host-binary resolution just before the lock, leaves `run.json` `running` with no lock or no intent: `legacy-run`; no door closes it and `fgos run --resume` refuses it by name.
2. A kill after the private home is made but before its finalization record is published leaves a home no finalizer can find (it existed before this plan for the same edge).

Accepted deviation (P07, OQ-2 a): `attempt-intent.json` is not written once. It is replaced under the held lock on each launch, and removed by the controller when a run settles with no envelope. The adopt-written envelope is always `direct` and `mutation: read-only`.

## 8. Open items

1. H-T4g: every spec, reading-map, history, component-boundary and backlog row marked open in section 4 waits for DOC Land.
2. Criterion 2: Node `src/run-supervisor` is 1 057 lines against at most 1 000 after P07. The P07 lead asked whether to accept or schedule a trim; I found no recorded answer in plan.md.
3. Criterion 9: Rust crate test wall time is 72.9 s against at most 50 s. The two large binaries are 19 s each (real deadlines under test); the 4 s brief-delivered sleep stays by P06's reasoning.
4. Rust src grew +213 (estimate -55) and Rust tests +404; the layer total is still -2 062 lines. Owner decision needed only if the Rust growth should be traded for further trims.
5. P06 kept direct row 8 (no host test passes a cwd lease to a direct gate); to retire it, add that Rust test.
6. Not measured: seat launch time for a direct and a pane seat (needs real provider and herdr pane); per-row time of `run-supervisor-config` standalone.
7. Not run by me: full `npm test`, `cargo test --workspace`, msvc and darwin checks (big lead's gates). `test/suite-baseline.json` retire list for TEST: `test/run-supervisor/legacy-sweep.test.mjs` (P07); P06 retired tests only inside surviving files.
8. The activated release on fg-server2 still runs the old doctor (8 rows); activation of the T4 tree is the big lead's step.
9. Big lead only: board row and `log.md` line, layer phase file and HARDEN plan row, guide completion, H-T4 recording (not done by me, by instruction).

Unresolved questions: whether the 1 057 against 1 000 line miss is accepted; whether H-T4c to H-T4f were already told to T5 (not visible in the T5 file).
