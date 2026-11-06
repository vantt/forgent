# HARDEN T5 closing report: Execution Core, Dispatch and Confinement, Seat Binding, Run Result

Machine fg-server2, main `57149ebe9`, measured 2026-11-06 20:07 to 20:35 (Asia/Saigon). Branch `harden/t5-p13` (worktree `forgent-worktrees/harden-t5-p13`): docs and measurements only, no code changed. Baseline: [research-261104-1755](research-261104-1755-harden-t5-baseline.md) (main `af19e6de6`), same methods where the baseline names one. Plan: [plan.md](../261106-0950-harden-t5-execution-core/plan.md). Phase reports: batches [A](lead-261104-1932-harden-t5-batch-a.md), [B](lead-261104-1958-harden-t5-batch-b-dead-code.md), [C](lead-261104-2039-harden-t5-batch-c.md), [D](lead-261104-2145-harden-t5-batch-d.md), [docs](lead-261104-2145-harden-t5-docs-batches.md); [P02](lead-261106-1028-harden-t5-p02-layering.md), [P03](lead-261106-1104-harden-t5-p03-credential-confinement-doors.md) and its [review lows](lead-261106-1350-harden-t5-p03-review-lows.md), [CLI install bind-back](lead-261106-1711-harden-t5-cli-install-bind.md), [P04 half A](lead-261106-1104-harden-t5-p04-config-tighten.md), [P05](lead-261106-1350-harden-t5-p05-claude-private-config.md), [P06](lead-261106-1750-harden-t5-p06-launch-failure-path.md), [P07](lead-261106-1104-harden-t5-p07-small-fixes.md), [P08](lead-261106-1557-harden-t5-p08-run-result-rust.md), [P09](lead-261106-1910-harden-t5-p09-dispatch-cut.md), [P10](lead-261106-1626-harden-t5-p10-execution-core-cut.md), [P11](lead-261106-1434-harden-t5-p11-config-to-schema.md), [P12](lead-261106-1910-harden-t5-p12-test-structure.md); P04 half B on `origin/harden/t5-p04b` (`git show origin/harden/t5-p04b:plans/reports/lead-261106-1626-harden-t5-p04b-executor-commands.md`). Owner-machine guide: [guide-261106-2006](guide-261106-2006-owner-machine-harden-t5-execution-core.md).

**Plan status (for the big lead):** P01–P03, P05–P12 done and on main; P04 half A on main, half B done on its branch and waiting for the owner-made config move (decision 64); P13 done on `harden/t5-p13` (this report). T5 can close with P04 half B and the seat-start follow-ups open, the way T0–T4 closed with their hand-offs.

## 1. What landed

Every hash below is an ancestor of `57149ebe9`. Landing times are the board lines.

| Part | Main commits | Landed |
|---|---|---|
| Batch A–D and the Critical write-back fix (before the plan) | `0f6843fc6`, `a56d56541` (R-1); `fc0d237d3` (B-3); `77861ee63..7b25e0b3c` (A, 6); `8dabc57d1..8af1a6b71` (B, 5); `eab8601b9..a6251673a` (C, 5); `d49de8fa4`, `3875eeb3c` (D); docs `d56701e54`, `2c9226371`, `ba0186eec`, `82c4de0f6` | 11-04 19:31 to 11-05 22:01 |
| P01 red proofs | branch `harden/t5-p01-red-proofs` only; each row landed as the first commit of its phase | 11-06 10:28 |
| P02 layering moves, lower-layer guard, undefined-name gate | `98e1c5824..7a4fa3654` (3) | 11-06 11:05 |
| P07 small fixes | `3f81fa916..36b59f731` (9) | 11-06 12:03 |
| P04 half A, project may only tighten confinement | `10a6b8425..fcdffd361` (5) | 11-06 12:19 |
| P03 credential and confinement doors | `accc31973..51d5d02dd` (12, three security reviews), review lows `c3489b61a..8d97f97be` | 11-06 13:50, 14:24 |
| P05 trust stores (decision 66) | codex/agy `de7454638..8f521eb2f`; claude `ca69911f6..6b5c80f9b` | 11-06 14:24, 15:42 |
| P11 runner config type rules to the schema | `68c426c31..e5ac48e88` | 11-06 16:11 |
| P08 Run Result derived once in Rust (OPC MERGE on the addon) | `6a546bd11..7cb2cd535` | 11-06 17:50 |
| Regression fix: CLI install trees bound back inside masked login homes | `8f8b66eb3..92095f40a` | 11-06 18:00 |
| P10 execution core cut and lost-brief retry | `59f6b6d3a..c5242df59` | 11-06 18:26 |
| P06 launch failure path | `9d70a47cd..d481b1cf0` | 11-06 19:10 |
| P12 test structure and doctor fold | `cfff2aa7f..e3de56c54` | 11-06 19:49 |
| P09 dispatch cut, decision 68, P10's `assignment.mjs` leftovers | `d3c0d0562..d3ed00d67` | 11-06 20:06 |
| P13 spec lines, backlog, close | `harden/t5-p13`: `c4d55e9f1` (spec, boundary, backlog) and the report commit | not landed (big lead) |

Not landed: P04 half B (`origin/harden/t5-p04b`, `ea8d9bcf8`, `1f2ac6fa9`); seat-start follow-ups (`harden/t5-seat-start`, in progress).

## 2. Measured before / after

Load is `/proc/loadavg` (1 minute). Test runs had every `HERDR_*` and `CLAUDE*` variable unset and a private Cargo target (`forgent-worktrees/harden-t5-p13-target`).

| Row | Before (`af19e6de6`) | After (`57149ebe9`) | Note |
|---|---|---|---|
| `src/runner/execution` | 32 files, 7 670 | 33 files, 7 590 | budget ≤ 7 000: **not met** |
| `run.mjs` | 1 629 | 975 | budget ≤ 1 150: met |
| Dispatch outside `confinement/` | 54 files, 21 133 | 44 files, 16 937 | budget ≤ 19 000: met |
| `assignment-runner.mjs` | 2 202 | 1 472 | budget ≤ 1 500: met |
| `executeAssignment` | 1 135 | 277 | budget ≤ 300: met |
| `config.mjs` | 2 105 | 861 | budget ≤ 1 300: met |
| `src/runner/dispatch.mjs` | 69 (40 re-exports) | 10 (no re-export; the `decide` entry) | barrel gone, file kept as the documented alias (P11 deviation 1) |
| `confinement/` | 10 files, 6 455 | 10 files, 5 972 | budget ≤ 5 950: **not met by 22** (P03 left 5 949; the bind-back fix added 18, the lows 5) |
| `bind.mjs` | 563 | 590 | budget ≤ 520: **not met** (`askFor` +27 lives there) |
| `run-result.mjs` | 1 396 | 1 110 | budget ≤ 1 150: met |
| `src/seat-binding/client.mjs` | 173 | 181 | |
| Functions over 300 lines (`src/runner/execution`, `src/runner/dispatch`, acorn scan) | 14 (largest `executeAssignment` 1 135, `runUnitBody` 1 018) | 7: `resolveCollaboration` 515, `compileDispatchPlan` 421, `assessAndPrepare` 389, `checkCatalog` 374, `buildConfinementAttestation` 343, `settleRunOutcome` 338, `prepareConfinementForLaunch` 302 | criterion "none over 300": **not met**; none of the seven was in a phase's cut list |
| Functions scanned | 1 795 | 1 706 | |
| Rust `seat-binding` | src 2 551 (7 files), tests 170, golden 82 cases | src 2 551, tests 170, golden 96 cases | unchanged src; 14 golden cases added by P12 |
| Rust `run-result` | src 1 139, tests 1 514 | src 1 073, tests 1 514 | −66 src: rule 0 and the corrupt provenance moved in, the duplicate legacy path went |
| Layer Node test set, one batch | 134 files, 2 435 tests, 0 fail; 144.2 s test time, 162.7 s wall (load 0.6 to 8.5) | 109 files, 1 891 tests, 0 fail, 0 `run-tests: ERROR`; 163.8 s test time, 165.4 s wall (load 4.6 to 5.4) | Not the same file set: the baseline did not record its 134-file list; its name rule (`test/runner/execution/**`, `test/runner/dispatch/*`, `test/seat-binding/*`, and dispatch-, assignment-, provider-, run-result-, confinement-, tier-, credential-named files in `test/runner`, `test/setup`, `test/verbs`, `test/cli`) gives 110 files on `af19e6de6` and 109 now; files such as `spawn-worker.test.mjs` were in the baseline set and are not in this one. Retirements: P11 (about 95 config shape tests), P12 (36 seat tests, 25 failover tests, posture and exec-budget files), P09 (3) |
| Same set, file by file | 669 s summed (load ≤ 3.5) | 592.6 s summed test time, 818 s wall (load 1.4 to 35.6 from other lanes; 52 of 109 files under 0.5 s) | not the same load class; read per file below |
| `execution/run.test.mjs` | 87 tests, 139.6 s | 78 tests, 156.3 s (load 3.6) | eleven refusals moved to `run-pre-admission.test.mjs` (11 tests, 2.7 s); slower per test, cause not measured |
| `execution/run-provider-failover.test.mjs` | 30 tests, 123.6 s | 6 tests, 20.6 s (load 5.5) | decisions proven on the pure `answerProviderLimit` (9 table tests in `account-rotation.test.mjs`) |
| Other slow files | `run-sync` 36.7 s, `run-case-admission` 33.7, `assignment-dispatch` 26.8, `assignment-runresult` 25.5, `run-resume-order` 18.4, `dispatch.test` 13.9 (283 tests) | 40.9 (load 4.2), 39.7 (9.0), 50.5 (15.6), 39.3 (32.6), 20.3 (4.9), 11.9 (218 tests, 29.1) | the high-load rows are not comparable. New: `run-brief-not-delivered.test.mjs` 3 tests, 37.7 s (real host and fake herdr; three launches per case) |
| `execution/bind.test.mjs`, `tier-fallback.test.mjs` | 64 and 8 tests | 34 tests 0.8 s, 4 tests 1.0 s | seat decisions owned by the golden table |
| Rust tests of the two crates | seat-binding 13, run-result 30; wall 4.1 s and 5.8 s cold | 13 and 30 tests, all pass; 6.5 s wall for both (warm target) | |
| Doctor, whole | dev door 147 rows, 9 fail, 89 s | activated release (built 19:11 from main with P06 and P10, without P09 and P12): 134 rows, 7 fail, 58.2 s (load 1.1). Dev door on `57149ebe9`: 133 rows, 95.5 s with a 5.4 s host compile and a spawn-count hook | rows fell by the doctor plan's 12 deletions (decision 65), `shadow-binder-divergence` (batch C) and `executor-posture-coverage` (P12). The 7 fails are machine state or other layers: `executor-skills-installed`, `agent-cli-project-trusted` (both layer rows, same machine-state causes as the baseline), `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `active-release-matches-checkout`. On the dev door `confinement-probe-freshness` and `confinement-blind-read` failed only because the hook file sits under `/tmp`, which bwrap hides (the baseline hook broke the same two rows); both pass on the release |
| Doctor rows of the layer | 42 by the baseline's id pattern; 3 fail | 32 by a pattern on today's ids (seat, dispatch, executor, confinement, credential, provider, herdr, blind, runner, tier, model, capability, bwrap, account, trust): 30 pass, `executor-skills-installed` and `agent-cli-project-trusted` fail (machine state). `executor-profile-warnings` now passes as a warning (doctor plan P01) | per-row time not measured this time (no timing hook that leaves the confined probe rows working) |
| Seat host spawns per doctor | 559 | 183 (182 `bind`, 1 `ladder`), counted by a `child_process` hook on the dev door | batch A `b423adcff`; P12's fold kept the count (the dry-bind row now binds the core capabilities the posture row bound) |
| `fgos dispatch inspect --cwd .` (activated release) | 4 972 ms p50 over 912 run dirs | 3 795 ms p50 of 6 runs (3 749 to 3 971) over 526 run dirs, load 1.1 | still linear in run directories; retention is backlog `p-tslryr3buq` |
| `fgos dispatch --help` (activated release) | 123 ms p50 | 129 ms (3 runs) | |
| Launch handover, envelope written to `supervisor-binding.json` (from attempt records of today's real runs, not a fresh run) | not measured (T4: about 1.2 s per seat from TEST) | direct 0.020 to 0.512 s (7 attempts); terminal 0.445 to 1.123 s (23 attempts), 1.009 s on the release activated 19:11 | `stat` mtimes of the two files in `.fgos/assignments/**/runs/01`; no agent was dispatched for this report |

## 3. Net size per language

`git show --numstat` per commit, summed per set, report and board commits excluded. Classes by path: Node src = `.mjs/.js` under `src`, `bin`, `scripts`, `packages`, `apps`; Rust src = `.rs` outside `tests/` and `examples/` (inline `#[cfg(test)]` modules counted as src); Rust tests = `.rs` under `tests/` or `examples/`; Node tests = `.mjs/.js` under `test/`; other = contracts, vectors, golden JSON, schema YAML, census, CHANGELOG; docs = `docs/`, `plans/`, `*.md`.

| Set | Commits | Node src | Rust src | Rust tests | Node tests | Other | Estimate (Node / Rust / tests) |
|---|---|---|---|---|---|---|---|
| Batches A–D, R-1, B-3 | 21 | −1 695 | 0 | 0 | −1 764 | −6 | landed before the plan (plan: −1 699 / 0 / −1 747) |
| P02 | 2 | +190 | 0 | 0 | +68 | +1 | +80 / 0 / +20 (the scope analyzer script is +187) |
| P03 + lows | 10 | +296 | 0 | 0 | +416 | 0 | +90 / 0 / +100 (two security review rounds) |
| CLI install bind-back | 2 | +23 | 0 | 0 | +47 | 0 | not in the plan |
| P04 half A | 3 | 0 | +90 | +95 | +12 | +431 | 0 / +44 / +40 |
| P05 | 3 | +30 | 0 | 0 | +136 | +9 | −35 / 0 / −40 (estimate was decision 63; decision 66 adds a layout, a probe call and a lock) |
| P06 | 2 | +73 | +62 | +69 | +51 | +8 | +15 / +15 / +40 (coordinator accepted) |
| P07 | 8 | −255 | 0 | 0 | −190 | +6 | −310 / 0 / −50 |
| P08 | 2 | −277 | −51 | 0 | −61 | +393 | −270 / +60 / −100 |
| P09 | 8 | −375 | 0 | 0 | +9 | +1 | −300 / 0 / −50 |
| P10 | 3 | −16 | 0 | 0 | +123 | +1 | −250 / 0 / −50 |
| P11 | 1 | −1 295 | 0 | +103 | −1 874 | +39 | −600 to −1 000 / 0 / −200 |
| P12 | 5 | −74 | 0 | 0 | −933 | +546 | −85 / 0 / −1 100 |
| **Phases P02–P12 with fixes** | 49 | **−1 680** | **+101** | **+267** | **−2 196** | +1 435 | plan budget Node ≤ −1 300, Rust ≤ +150, tests ≤ −1 000 |
| **Whole HARDEN T5** | 70 | **−3 375** | **+101** | **+267** | **−3 960** | +1 429 | |

Criterion 8 (net ≤ 0 per language for the layer): Node −3 375 and tests −3 693 (Rust and Node tests together) are met; Rust src is +101, inside the plan's Rust budget (≤ +150), so Rust alone is not ≤ 0. "Other" grew by 1 435 lines: the golden cases (+547), the run-outcome vectors (+390), the config fixtures (+431, mostly the shared snapshot and scope fixtures) and the schema; none of it is counted by the plan. Over their own estimates: P02 (the analyzer), P03 (masks with refusals, host record, probe gate, two review rounds), P05 (decision 66), P06, P10 (Node −16 against −250: comments in `run.mjs` were reasons, the builder move waited for P09 and was counted there). Beat their estimates: P11, P09, P07 tests.

## 4. Spec, boundary and backlog lines

Written in this branch (`c4d55e9f1`) unless the "Written by" column names a phase commit. "Made true by" is the code commit.

| File | Line | Made true by | Written by |
|---|---|---|---|
| `docs/platform/runner/spec.md` | new section "Execution Core and Dispatch: target shape and standing rules (2026-11-06)": Part A shapes with Node budgets and current counts; layering rule; hostile-input rule stated once (`readAgentFileSync`); recover offers only adopt and liveness from the attempt lock; the assignment-record closed signal; the lost-brief retry; one-word read-only answers | `98e1c5824`, `d89028d2e`, `4597694c0`, `59f6b6d3a`, `733e3a74d`, `8a1b10706`, `68c426c31`, `d3c0d0562` | P13 |
| `docs/platform/runner/decisions/h-36d872fbb0e5.md` (runner narrative home) | note 2026-11-06: decisions 61, 62, 64, 66, 68 as settled facts | all | P13 |
| `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` | RUL75/RUL80 change notes (probe gate, host record, set-aside copies); RUL100 note that the posture row folded | `9c35308d9`, `c3489b61a`, `cfff2aa7f` | P03 (`507796274`), lows (`c3489b61a`), P12 (`cfff2aa7f`) |
| `docs/platform/agent-confinement/spec.md` | §3.2 non-goal becomes "the attempt sees only its own login" (`gh`, `~/.ssh`, abstract sockets and localhost stay reachable, `p-x4qeqdvfl5`) | `de39e9cbc`, `9c35308d9` | P13 |
| same | §9.3 `{loginStore}` and `{confinementRoot}` | `9c35308d9` | P03 (`507796274`) |
| same | §9.3 `{loginStore}`: in-place claude per decision 66; install subtrees `bin`, `install`, `packages` bound back read-only (was "the program file alone") | `9df771d3e`, `ba4925e54` | P13 |
| same | §9.3 limits: abstract sockets and localhost name backlog `p-x4qeqdvfl5` | — | P13 |
| same | §13.2: finalize-home only stages; refresh-ahead applies after the probe proves the leased account; host-only record `attempt-home.json` holds the keep count; held homes with a record settle by `doctor --fix` and at the end of `finalizeAttemptHome`; `home-unreadable`; doctor lines for staged agent copies and `set-aside` | `de39e9cbc`, `9c35308d9`, `140dd605f`, `c3489b61a` | P13 (failure-path doctor clause by P06 `6349e2c8b`) |
| `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md` | three dated rows: Q3b masks, A7/A8, CLI install bind-back | same | P13 |
| `docs/platform/seat-binding/spec.md` | §15 update 2026-11-06: golden cases are the owning proof (82 → 96), Node seat tests keep facade facts, one `askFor`, `bind.mjs` budget 520 (590 now), client exec proof; §16 pointers (doctor rows, `askFor`) | `8fa5c64b6`, `59f6b6d3a`, `cfff2aa7f` | P13 (exec-budget citation by P12) |
| `docs/platform/config/spec.md` | §4 `tighten` merge value, `confinementPolicies` global-only | `e0e2e2851`, `8bf114ed4` | P04 half A |
| same | §12 section owners keep cross-field rules, the runner schema holds every type rule | `68c426c31` | P11 |
| same | §18 history: tighten rule (decision 61 2b) with the command/args scope pending decision 64; schema owns the runner type rules | same | P13 |
| `docs/platform/agent-coordination/architecture/evidence-and-results.md` | new "Outcome derivation" row (one derivation in Rust through the addon, V3 only writer); stale `run-result.mjs:<line>` citations replaced by function names | `d40d74ea1` | P13 |
| `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` | writer V3 only, derivation owner | `d40d74ea1` | P08 |
| `docs/platform/run-supervisor/spec.md` | §2: the six leaves moved into `src/run-supervisor` are not part of the 1 000-line target (own modules 1 004); §16 history line for the moves, decision 66 and the intent's pane | `98e1c5824`, `9df771d3e`, `6349e2c8b` | P13 (intent `terminal`, release-slot row, §8 and its history line by P06; `cleanup-trust` row and known limit by P05) |
| `docs/platform/process/spec.md` | `process-identity` path under `src/native` | `98e1c5824` | P02 |
| `docs/platform/component-boundary.md` | Execution Core, Seat Binding, Dispatch Transport & Confinement and Run Result Evaluator rows with budgets and parts; Git row: the addon links `fgos-run-result` | all | P13 (Process row path by P02) |
| `docs/platform/terminal-control/spec.md` | §2: `worker-session-boot.mjs` is the one raw `herdr server` call, guarded per session by the `worker-session` lock (H-T5e); §15 history line | `8b4386443`, `212cb77cf` | P13 |
| `docs/platform/holder-lock/spec.md` | rank-80 leaves list gains `agent-trust-store` (`worker-session` was added by P07); §20 history line for both | `8b4386443`, `9df771d3e` | P13 |
| `docs/backlog.md` | H-T4c as `p-xbxdc6acdo`, created and closed; `p-a189ff31` closed with the red-team's confined read; `p-3e6b1a52` closed; `p-8da4b370` gets R-3 and the closed confinement half; `p-d2dc4f2e` annotated with the retry and what stays open; new `p-i2nsdjgwuz` (S-6, refresh-ahead on the launch path) and `p-tslryr3buq` (`.fgos/assignments` retention, Workflow) | `9df771d3e`, `b647cb2c8`, `e0e2e2851`, `733e3a74d` | P13 (ids from `fgos identity mint backlog`); `tsk-p7-shadow-binders` was already done |
| `docs/decisions/index.md` | not regenerated: no D-ADR record was added | — | — |

DOC lead: tell before merge (board shared-file rule); this report is the notice.

## 5. Hand-offs

| Id | What | Receiver | State |
|---|---|---|---|
| H-T5a | S-3 split of `run.test.mjs` and the failover file; S-4 lighter staged test addon (ledger H13) | TEST | Partly done inside T5 by P12 (pre-admission refusals file; failover 31 → 6 tests, about 138 s → 20 s). S-4 and the rest of S-3 open. TEST closed its lane at 18:57 with no open items, so no receiver confirmed this on the board: the big lead re-homes it (TEST reopens or HARDEN keeps it). |
| H-T5b | S-6 refresh-ahead on the launch path; `.fgos/assignments` retention | backlog | rows `p-i2nsdjgwuz`, `p-tslryr3buq` (this branch) |
| H-T5c | `--wait`/`--no-wait` on `take`/`pick` never reach `claimWork` | WORK | Named on the board 10:13 ("handed to WORK"); no receiver confirmation line found. WORK lane is closed (owner `lead:ES`); the big lead confirms with `lead:ES`. |
| H-T5d | `src/event-store/native.mjs:32` regex re-parse of addon errors | ES (note) | still there (`error.message.match(/^([a-z][a-z-]*)(?::|$)/)`); note owed to OPC (ES merged into OPC) |
| H-T5e | `worker-session-boot.mjs` is the one raw `herdr server` call | terminal-control spec | written (section 4) |
| H-T5f | 636 provider-state `assignments` entries written before P07 are never dropped | guide | written (guide "Trước khi cập nhật" step 5) |

## 6. Received items of the layer phase file

| Item | Answer |
|---|---|
| D-T2-7 grace rule | `READY_TIMEOUT_MS` lives in its one reader `src/setup/terminal-control-checks.mjs`; `herdr-deadlines.mjs` deleted (P07 `212cb77cf`) |
| T2 §5(1) class-B herdr callers | worker session-server start is the one raw call, guarded per session (P07, spec line H-T5e) |
| T2 §5(2) name sniff, `parseHerdrUsage` | gone (batch B `91b50c2f9`) |
| T2 §5(3) `herdrSpawnAdapter` | kept as a registration that refuses by name (batch B `8dabc57d1`, arbitration §2) |
| T2 §5(4) E-3 consumers | `merge.mjs` uses `nativeError()`; `src/event-store/native.mjs:32` left as H-T5d |
| T2 §5(5) seat spawns per doctor | 559 → 183 (batch A `b423adcff`); 183 now (section 2) |
| H20 `lock-wait.mjs` | deleted (batch B `6c5c6d979`); the dead `--wait` is H-T5c |
| T3-04a wording lists and run scan | probes share one list (batch D `d49de8fa4`); the stderr text judge of auth versus quota is gone, the receipt decides (P07 `4597694c0`); newest-result rule and links (batch C `a6251673a`). `provider-auth-failure.mjs` stays as the probes' one list |
| T3-04a addendum (outbox readers) | batch C `a6251673a` (links and zero-padded names never count); claim and report read through `readAgentFileSync` |
| H-T4c | closed by P05 (decision 66); backlog `p-xbxdc6acdo` |
| H-T4d | text judge removed (P07) |
| H-T4e | closed without change (arbitration §2: short calls stay unconfined by design) |
| H-T4f | P06 (`6349e2c8b`): a refused launch gives back pane and home; adopt releases an intent's pane by key |
| T4 dead door | batch B `8dabc57d1` |
| 16:2x smoke: one-word read-only answer failed | decision 68, P09 `d3c0d0562` |
| 15:5x and 17:00 seat-start failures; 17:1x investigation | (B) regression fixed (`ba4925e54`); lost-brief retry (P10 `733e3a74d`); (A1) omp setup-wizard classifier, (A2) `omp-natives-present` row, (A3) foreground-loss instrumentation and `workflow resume` rerun: in progress on `harden/t5-seat-start` (open item 2); omp operator steps in the guide |

## 7. Owner decisions 61–68

| No. | Answer | Where it stands |
|---|---|---|
| 61 | «1a 2b 3b 5a» | 1a superseded by 63 then 66. 2b: tighten rule landed (P04 half A); command/args half waits (64). 3b: masks landed (P03). 5a: every phase self-landed on fg-server2; owner machine by the guide |
| 62 | «a»: Part A shapes with A3, A4, A5, A7, A8 | all built; budgets in section 2 (three not met) |
| 63 | «a»: every claude pane takes the private config | superseded by 66 before its code landed |
| 64 | «UQ1 a, doctor a» | census done (`research-261106-1202`); move steps in the guide, not started; doctor audit became its own plan (paused after its phase 02, decision 67) |
| 65 | «1a 2b 3a» doctor roles | outside T5 (doctor plan); T5 kept its own rows |
| 66 | «ok» on UQ-3 (c) | landed (P05 claude half) |
| 67 | T5 first, T6/T7 after | held: T6/T7 not started |
| 68 | «c» one-word answers | landed (P09) |

## 8. Acceptance criteria of plan.md

1. **Every row done or parked with its owner question:** done except P04 half B (parked on decision 64's config move, owner question named on the board 19:10 and 20:06).
2. **Line budgets and function scan:** see section 2: `run.mjs`, Dispatch, `assignment-runner.mjs`, `executeAssignment`, `config.mjs`, `run-result.mjs` met; `src/runner/execution` 7 590 > 7 000, `confinement/` 5 972 > 5 950, `bind.mjs` 590 > 520 and seven functions over 300 lines **not met**.
3. `rg -n "runner/dispatch/" src/native src/state src/holder-lock` → nothing; in `src/run-supervisor` only `steps/settle-attempt.mjs` and `steps/finalize-home.mjs` (`cleanup-trust.mjs` no longer imports Dispatch). Met.
4. `rg -n "deriveOutcome|deriveLegacyOutcome|deriveEvidenceFloor|RUN_RESULT_CONTRACT_V4|validateRunResultV4|normalizeRunResultV2" src` → only `deriveOutcome` (the door in `run-result.mjs:965` and its callers, `unit-run-history.mjs`) and `deriveEvidenceFloor` (`run-result.mjs:969`, P08 deviation 1: no Rust twin, one consumer). `rg -n "\.claude\.json" src/runner src/run-supervisor` → the add-only seed (`trust-store.mjs`, path from `herdr-round.mjs:297` and `authority.mjs:990`) and the private home's own `.claude.json` (`worker-home.mjs`): decision 66 superseded "no write path" (fgOS still writes `~/.claude.json`, add-only). `rg -n "resume-driver|reassign-driver|dispatch\.claim|DRIVER_FRESH_MS" src` → one comment, `runtime-inspection.mjs:126`, describing the retired coordination engine (no code); `src/runner/dispatch.mjs` exists as the 10-line `decide` entry (P11 deviation 1); `herdr-deadlines.mjs` does not exist. Met with those three recorded deviations.
5. Confined read of every inventory login store returns `ENOENT`, `gh` and `~/.ssh` readable, a lowering project config refused by name: proofs `test/runner/dispatch-confinement-machine-private.test.mjs` ("a confined worker cannot read a login store the account inventory names", real bwrap; in the batch below, pass) and the shared fixtures `snapshot.v1.json` (`config-confinement-lowered`). Met.
6. Every retired test names its owner: each phase report's retire table (P03, P05, P07, P08, P09, P11 appendix, P12 tables). Met.
7. Land gate green at each land: each phase report's full suite shows only the known V7n red (P12: plus two account-lock tests that pass alone under load; see open items). Met as reported; not rerun here.
8. Net size ≤ 0 per language: section 3. Node and tests met; Rust +101, within the plan's ≤ +150.

## 9. Deviations (recorded by the phases, accepted by the coordinator)

- P02: bad `gateKillGraceMs`/`cancelWaitMs` exit 1 instead of the validation code (class changed, code kept).
- P03: record name fixed constant; settle triggers are finalize-home and `doctor --fix`, not a refresh-ahead hook; the credential probe runs on an isolated minimal copy outside bwrap.
- P04: `allowInvocationOverride` opening counts as lowering; `scope.rs` refuses an undescribed entry of a global-only map whole.
- P05: the `agent-trust-store` lock goes beyond decision 66's wording (read-back alone lost entries in 3 of 3 runs); the claude probe renewal is proven only with a fake CLI.
- P06: an intent-only adopt with an unrecorded pane counts as nothing to release (`NoRecord`); `terminal_slot.rs` changed outside the file list.
- P07: new registry row `worker-session` and six files outside the list.
- P08: `deriveEvidenceFloor` stays in Node; one import token in P09's `settlement.mjs`.
- P10: new file `unit-run-start.mjs`; `bind.mjs` and `src/runner/execution` budgets not met; the lost-brief retry added by the coordinator.
- P11: `src/runner/dispatch.mjs` kept as the documented `decide` alias; removed-key hints in `$comment`.
- P12: failover file keeps 6 tests (not 3); dry-bind row binds in the fixed headless session.

## 10. Open items, with owner

1. **P04 half B** (`origin/harden/t5-p04b`): executor `command`/`args`/`permissionMode`, launch `backend`/`privateHome`/`isolatedSession`, capability `aliases` global-only. Waits for the owner-made config move (decision 64), steps in the guide's last section. Owner: owner go, then HARDEN lands in an announced window.
2. **Seat-start follow-ups** (`harden/t5-seat-start`, in progress): omp setup-wizard screen classified as needs-human with a vector; doctor `omp-natives-present`; instrumentation of `ForegroundNotAgent`; `fgos workflow resume` rerunning a step whose seat never started (`p-d2dc4f2e`). Owner: HARDEN.
3. **Budgets not met:** `src/runner/execution` (+590), `confinement/` (+22), `bind.mjs` (+70), seven functions over 300 lines (none in a phase's cut list: `resolveCollaboration`, `checkCatalog` in patterns; `compileDispatchPlan`; three confinement functions; `settleRunOutcome`). Owner question: accept, or open one cut item per function. Owner: owner.
4. **Flaky tests seen during T5 lands** (owner: TEST or the file's lane): `test/scripts/mailbox-live-confined.test.mjs` "the orphan sweep kills a run the harness did not finish" (P03 full suite, P04b; load-dependent, green alone; MAIL); `test/event-store/triggers.test.mjs` (doctor plan P01 full suite, text assertion fixed; an earlier seal flake fixed by TEST `30a2e281d`; ES/OPC); account-lock tests under load `facade-multiprocess` (PID namespace / probe child) and `provider-capacity` (holder killed), P12 full suite, 42/42 alone (HARDEN T1 holder-lock owner). Plus `packages/run-supervisor/rust/tests/gate_portable.rs:37` under load ~20 (TEST 17:18 → HARDEN).
5. **Pane-renewed xai and claude logins need hand recovery:** their tokens carry no provider-signed account, so the A8 gate never applies them; doctor `credential-copies-retained` lists them and the leased store may hold a refresh token the pane already spent. Owner choice (P03 concern): accept hand recovery, or renew xai/claude before launch with a wider window so panes rarely renew. Owner: owner.
6. **CFG follow-up:** `launchConfinement.contract`, `controls`, `grants`, `networkFilter` stay project-settable after P04 half B and no tighten rule judges them; a project could name a weaker contract or wider grants. Owner: CFG reviewer (lane closed; big lead names one).
7. **Read-only `bin`/`install`/`packages` bind-back hardening note:** the three install subtrees of a masked login home are bound back read-only whole; the bind-back fix's evidence is that none holds a login file in today's pi and codex layouts. A CLI release that puts a login or token file under one of them would make it readable to a confined worker; the falsifier test checks only `auth.json` and `config.toml`. Owner: HARDEN (confinement), a probe case naming those subtrees when a CLI layout changes.
8. **Stale comment** `src/runner/dispatch/runtime-inspection.mjs:118-131` describes the retired coordination engine's `dispatch.claim`; one-line trim for the next phase that touches the file. Owner: HARDEN.
9. **`p-d2dc4f2e`, `p-4bkfiw7d3j`** stay open (backlog annotated). H-T5a and H-T5c receivers to confirm (section 5). DOC told before merge of the spec lines.

## 11. Inputs for T6 and T7

- **Workflow resume semantics:** `fgos workflow resume` does not rerun a step that ended `execution-failure` from a seat that never started, so one bad launch costs the whole run (`p-d2dc4f2e`, debug report `debug-261106-1658-workflow-resume-after-seat-failure` (returned in session, not on main)). The Execution Core now retries a lost brief once; resume rerunning a failed step is Workflow's (T6).
- **`--wait` on `take`/`pick`** (H-T5c): parsed and validated, never reaches `claimWork`; fix or drop the flags in the Work verbs (T7, "foundation first, Work later").
- **Work rows:** `p-tslryr3buq` (`.fgos/assignments` retention) is Workflow's; `p-zpgzqdoy4z` (pattern deviation not gated by admission) and `p-68be2ae3` (`doctor --fix` all-or-nothing) from the baseline list stay untouched by T5.
- **`fgos-cook` and the lost-brief retry** both rerun once, so a seat that always loses its brief launches up to 4 times (P10 note to COOK).
- **Doctor plan** resumes after T5 closes (decision 67); `src/setup/registrations.mjs` is free.

## 12. Checks run for this report

- `test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs` (FR one-liner, private Cargo target): 36 pass, 0 fail.
- `fgos convention check --` on the 12 changed docs and the two new reports (dev door): 14 checked, 0 violations.
- Layer test batch and per-file loop, Rust tests of the two crates, doctor (release and dev door), `dispatch inspect` timing: section 2.
- Net size: `git show --numstat` per commit, section 3. Function scan: acorn from Node's internals over `src/runner/execution`, `src/runner/dispatch`, `src/seat-binding`, on `af19e6de6` (extracted to a scratch directory) and on `57149ebe9`.
- Backlog ids minted with `fgos identity mint backlog` (activated release, main checkout).
- Not run: the full suite (no code changed), `cargo test --workspace`, a fresh direct and pane seat launch (launch handover taken from today's attempt records instead).
- Processes: every test and doctor run was a foreground or harness-tracked call and has exited; the private Cargo target `forgent-worktrees/harden-t5-p13-target` is kept for the big lead's land gate and is to be deleted when this branch lands.

Status: DONE_WITH_CONCERNS
Summary: T5 is landed on main except P04 half B (waits for the owner's config move) and the seat-start follow-ups; spec, boundary and backlog lines are written on `harden/t5-p13` with doc-health and citation drift green; three Node budgets and the 300-line function rule are not met.
Concerns/Blockers: budgets not met (open item 3) need an owner call; H-T5a and H-T5c have no receiver confirmation on the board; test timings were taken under load from other lanes.


## Addendum 2026-11-06 21:5x — phase 14 (owner decision 69)

Three parallel lots landed: lot 1 `7055cf874..477f96684` (confinement `authority.mjs` 1 314 → 984, `confinement/` 5 972 → 5 642; `run.test.mjs` split into four files, 78 tests unchanged), lot 3 `477f96684..dbec1f5f2` (`resolveCollaboration`, `checkCatalog`, `compileDispatchPlan`, `settleRunOutcome` each under 230 lines; −553 lines), lot 2 `dbec1f5f2..83e4cca9e` (seven execution files −584, `bind.mjs` 514). `src/runner/execution` is now 6 453 lines (budget 7 000), `confinement/` 5 642 (5 950), `bind.mjs` 514 (520); no T5 function is over 300 lines. Behaviour unchanged; each lot's full suite red only on the known V7n test. H-T5a (test split) done by HARDEN.
