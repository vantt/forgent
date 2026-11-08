# HARDEN T6 (Workflow) closing report

Main `1ff899aac` plus the close commit (2026-11-08, fg-server2). Release `sha256:6f1fd31f3850…0729` (built by COOK from `1ff899aac`, phases 01-14) is the one measured. Inputs: [sub-plan](../261108-0934-harden-t6-workflow/plan.md), [baseline](research-261108-0831-harden-t6-baseline.md), the phase lead reports and board lines, [owner guide](guide-261108-1230-owner-machine-harden-t6-workflow.md). Citations glossed: **RUL104** ("better, not bigger"), **L10** (extend through the door), decision 71 (owner, 2026-11-08, «1a 2a 3a 4a 5b 6a 7a»; see the HARDEN plan), decision 72 (same pin rule for `fgos run --account`).

**Verdict: behaviour acceptance met, size acceptance not met.** Every behaviour of the layer landed and was smoked on the activated release; test time is 155 s lower. The layer did not get smaller: Node is +10 lines against a target of at most -300, tests are +610 against at most -200, and four of the five component budgets are over. Details and the paying deletions below; the owner decides whether the size gate holds the layer open.

## Before / after

| Measure | Baseline (`0291d40ed`) | Now | Note |
|---|---|---|---|
| `workflow propose` p50 / p95 | 4.6 s / 6.2 s at load 34-39 (2.14 s at load 4 in the plan) | **0.232 s / 0.247 s** (19 runs after the first, load 0.6-2.4) | one slice, this checkout, `--plan` this plan. The proposal ends in `gate-command-missing` because this machine declares no `capabilities.code:implement.verify`; the refusal comes after the ledger scan (`propose.mjs:411` before `:451`), so the measured path includes the part that was slow. The checkout had no closed ledgers at measure time (history was wiped), so the scan itself was cheap; the 0.35 s at-load figure of the conductor lane stays the evidence for the scan |
| `workflow status` p50 / p95 | 0.31 s / 0.58 s (load 34-39) | **0.215 s / 0.222 s** | one small finished run (4 seats, 12 events); no large ledger exists to time (wiped) |
| New panel run ledger (`council-lite`, 4 seats) | old size not measurable (no old ledger of that preset exists) | **54.6 KB** total, `unit.complete` 22.4 KB | **Estimate, not a measurement:** the dropped field is `runResult.evidence`; each seat's `evidence.json` on disk is 684 KB here (a dirty checkout), so the old line would carry up to about 2.7 MB; the lead of the Playbook phase measured the field as nearly all of the bytes of 87 real `unit.complete` lines. 54.6 KB is about 2 percent of that estimate; the target was 5 percent |
| `advance.log` of that run | JSON results in the log | 927 bytes, 0 lines with `{` | holds progress lines and the child's stderr notes (credential refresh, herdr spawn), no result JSON |
| Tests of the layer, test time | 40 files, 420 tests, **686 s** (mixed load) | 45 files, 467 tests, **531 s** (file by file, load at most 2.1, FR) | -155 s against a 70 s target. The sets differ: one file became six, two were deleted, new owners were added; the lead of the test phase measured 734 s -> 531 s on the same machine for the 42-file set |
| Functions over 300 lines in `src/workflow` | 2 (521, 384) | **0** | largest is `projectCase` 181 (budget 120); next 96, 95, 94 |
| Doctor rows | 134 rows, 7 fail | 111 rows, 4 fail | the doctor track cut rows; none of the layer's six rows is gone (`workflow-capabilities-configured`, `domain-workflow-operations-coverage`, `domain-registry-compiled`, `workflow-case-binding-sentinel`, `workflow-case-bindings`, `blind-steps-use-proven-pools`); `seat-binding-dry-bind` replaced `workflow-pools-satisfy-independence` (doctor track). The 4 failing rows are machine state of other layers |

Load notes: baseline numbers were taken at load 34-39 for routes; the numbers above at load 0.6-2.4. Compare as upper bound against measure, not like for like.

## Size: `wc -l`, budgets and net

| Component | Baseline | Budget | Now | Met |
|---|---|---|---|---|
| Guide (6 files) | 1 345 | at most 1 290 | 1 216 | yes |
| Case ledger without prune | 1 251 | at most 1 200 | about 1 360 | **no (+160 over budget, +109 over baseline)** |
| Prune (in `case-close.mjs`) | 0 | at most 150 | about 245 | **no** |
| Admission (4 files) | 965 | at most 930 | 1 049 | **no (+84 over baseline)** |
| Conductor entry | 2 171 | at most 2 040 | 2 136 | **no (-35 only)** |
| Playbook runner (7 files) | 1 556 | at most 1 300 | 1 309 | no, 9 over |
| `workflow` arm of `bin/fgos.mjs` | about 145 | at most 120 | 116 | yes |
| Doctor side | 238 | at most 180 | 150 | yes |
| `src/workflow` whole | 7 288 | about 6 900 | **7 316** | no |

Function budgets: `validateWorkflow` 384 -> small named normalizers (yes); `projectWorkflowState` 195 -> 45 (yes); `advanceWorkflowRun` 521 -> 48 (yes); `admitProposal` and `createCaseAdmissionPort` 96 (yes); `propose.mjs` 631 (yes); `projectCase` **168 -> 181, budget 120 (not met)**.

Net over the T6 commits (`git show --numstat`, 28 commits: loader fix, answer branch, P01-P14; doc and data files excluded; moved test lines count on both sides):

| Language | Added | Removed | Net | Target |
|---|---|---|---|---|
| Node (src, bin, scripts) | 2 371 | 2 361 | **+10** | at most -300 |
| Rust | 5 | 4 | **+1** | at most +10 (met) |
| tests | 3 951 | 3 341 | **+610** | at most -200 |

Increases and what paid for them (per commit, Node / tests): answer and receipts +81 / +110 (new checks the drain and verb did not have: depth refusal, round re-validation, receipt merge); one case reader and path door +18 / +106 (a new path leaf in `src/runner/execution`, `invalid-case-id`, short-write handling); custody before reserve +22 / +34; case runtime and bindings +41 / +62 (release of a dead reservation, binding repair); **prune +255 / +277 and wiring +56 / +50** (estimate was +130; every branch is a red-tested safety rule: reasons, per-case re-check, link guard); pattern deviation +7 / +34; error leaf +22 (77 import lines and one new file). Deletions that paid back part of it: the integrate step -123 (and tests -163), `validateWorkflow` cut -146, door and verb fold -95, runner cut -64, dry bind -33, loader -19. The growth is behaviour the plan asked for (answer rules, release of dead reservations, prune, resume) and the plan's estimates were low: its own phase rows summed to Node -468 but the prune and runtime estimates were short by about 190. **No deletion was found that pays the remaining +310 without removing a proof-backed rule.** Not simplified in this phase: `case-close.mjs` (kept, see below) and the 9-line gap in the Playbook runner (no pure simplification provable at the reading depth of this phase).

## Acceptance criteria 1-8

1. **Items of "Where each item goes": done.** Each phase's lead report or board line carries red evidence; one item is partly done: the Playbook ledger line count above. Backlog: `p-zpgzqdoy4z` and `p-3ydqquajy2` marked done with commits; `p-tslryr3buq` and `p-d2dc4f2e` are partly done and not flipped (the retention row's `dispatch inspect` under 1 s clause and plain-run retention remain; the launch-never-starts clauses remain).
2. **Budgets: partly met** (table above). 0 functions over 300: met.
3. **Door scans** (in `src/workflow`, `bin` arm only): one reader definition `readCaseProjection` (`case-projection.mjs:296`); two thin callers match the scan text: `readCase` in `case-verbs.mjs:55` (adds `case-not-found`) and the runner's `reread()` method (drains the inbox first); `'workflow-runs'` string: none; the long scan (`renameSync|fsyncDir|writeReservationFile|mergeWorkflowBranch|...`): none except `activityUnitOf`, which stays by recorded reason (the catalog needs the activity unit before admission runs; `case-admission-port.mjs:37`, `bin/fgos.mjs:2865,2919`); `segmentRegex`: one (`write-scope.mjs:102`).
4. **Behaviour, each by its owning test** (focused sets green at each landing, full suite green except the known V7n addendum; listed in the phase reports). Live on the release: see Smokes.
5. **Measured on the release:** propose p50 0.232 s (target at most 0.35 s: met); panel ledger about 2 percent of the old estimate (target at most 5 percent: met on the estimate); `advance.log` no JSON: met; test time 531 s against 616 s (met).
6. **Retired tests name their owners:** the retired-to-owner tables are in the reports of the integrate, conductor, door and test phases and in the commit bodies.
7. **Land gate green at each land; doctor row ids and count unchanged by T6:** yes; the six rows above are all present; no condition of the arbitration doctor table was removed.
8. **Net size: not met** (table above).

## Smokes on the release (fg-server2, main checkout, plain `fgos`)

- **Doctor:** 111 rows, 4 fail (machine state: `executor-skills-installed`, `tool-registry-configured`, `work-step-vocabulary`, `agent-cli-project-trusted`); `workflow-case-bindings` pass (0 records), `workflow-case-binding-sentinel` pass, `seat-binding-dry-bind` pass (62 seats, 27 units).
- **Case runtime:** a `council-lite` run (detached, status while running, completed `pass`) wrote `reservation`, `settle`, `case.closed` events and no `reservations/` directory; `bindingsJudgment` `{ sound: true }`.
- **Resume reruns an infrastructure failure:** a `--units` run started with a `PATH` that hides the agent CLIs ended `failed / execution-failure` (`rerunnable: true`, "terminal-control could not open a pane"); `fgos workflow resume --foreground` with the normal `PATH` appended `step.fail`, `step.start`, a fresh Unit run and ended `completed / pass`.
- **Not smoked live:** a verdict run refused on resume. A unit refused by policy needs a capability tier the machine config does not offer, and a unit file may not carry a tier; the refusal is owned by `workflow-runner-resume.test.mjs` ("a unit refused by policy ... resuming refuses by name"). Stated as a gap.
- **Account rows in status:** `fgos workflow status` of a `--seats` run (`group-cognition`, two lenses) listed one row per finished seat with executor, family, model, outcome and `account` (null: no account was pinned). Runs without `--seats` print no `seatProviders` block by design of the verb. The seated run was stopped on purpose (controller terminated, case closed; its in-flight seats were cancelled and closed by their supervisors).
- **Prune:** first dry run on an empty tree: nothing. After the smoke cases closed, `--older-than 0d` listed only the first smoke case and its Unit run; `--apply --older-than 0d` once (coordinator go): `.fgos/assignments` 18 302 788 -> 8 618 110 bytes, `.fgos/workflow-runs` 55 585 -> 28 bytes; the 3 plain `fgos run` Unit runs were still there. A later dry run kept a Unit run of the stopped case as `unsettled` and the case as `unit-run-kept`: the guard works on a real half-finished run. **Real-tree cost is unmeasured:** run history was wiped by an incident earlier today; the only tree evidence is the synthetic 54-case / 540-run tree of the prune phase (dry run 50 ms, apply 76 ms for 1.6 GB). The share of plain `fgos run` Unit runs (lead question 3) is therefore also unmeasured: 3 plain runs and 0 cases existed.
- **Smoke leftovers (mine, small):** two closed smoke cases and three Unit runs remain in `.fgos` of the main checkout (one finished `--units` run, the resumed run, the stopped seated run); the next dry run lists them; the coordinator's one `--apply` was used.

## What moved where

Answer rules, gate, resume, pin, prune, reservation release and pattern deviation are written as RUL-WF-34 to RUL-WF-41 in `docs/platform/workflow/spec.md`; component shapes, budgets and measured sizes are its section 9; the decision narrative is its section 17; the stale text named by the plan (`integrate.mjs`, `plan-source.mjs`, the unregistered doctor row, the rework table, the "before cutover" wording) is gone. `docs/platform/component-boundary.md` Workflow row, the lock registry note (`case-lock.mjs`), the registry description of `fgos workflow` (no "pure git integration") and a comment in `ref-digests.mjs` were corrected. The Seat Binding pin rule lives in the Seat Binding spec; the Git spec carries the integrate decision (both written by their phases).

Cross-lane checks: COOK's resume rule in `core/skills/_shared/coordination-driver.md` Step 6 (main `eddb2ad14`) says what decision 71 (4a) says (reruns `execution-failure` and `not-started` once per call as a fresh admitted Unit run, writing unit in its recorded worktree and branch, verdicts terminal and refused by name, no automatic retry beyond the Execution Core's one lost-brief retry): matches. The doctor track was told the pointer row for `workflow-case-bindings`; the row is registered. DOC (lead:DOCOS, design-lap) is told by one mailbox message and a board line at push; no ack awaited (coordinator's decision).

## Review of `case-close.mjs` (+255 against +130)

Kept. It is 292 lines; each branch is the owner of one safety rule with a red test: eight keep reasons (`link`, `unsafe-path`, `unit-record-missing`, `names-other-case`, `named-by-other-case`, `controller-held`, `custody-held`, `unsettled`), the per-case re-check under the hold, the stub cleanup and `treeBytes`. One duplicate (`realpathOrNull`, the same body as `src/run-supervisor/payload-root.mjs`) now imports the existing function. Removing any other branch would drop a rule or a test. One thing to look at (idea 1 below).

## Open items handed off

- Size gate: owner decision on whether T6 closes with Node +10 and the budgets above, or opens a size pass (ideas 2-4).
- A settled Unit meeting another hold between control release and settle can be released as `not-started` (window of two adjacent statements in `runUnit`): needs a settle-wins semantic, not taken.
- Plain `fgos run` Unit runs have no retention; the run-output size cap for the Execution Core is the arbitration's addition 5 (not taken, owner decision 71 6a).
- `p-d2dc4f2e` and `p-tslryr3buq` stay open for the clauses listed.
- On every other machine: declare `capabilities.code:implement.verify` before using `fgos workflow gate`; activate with no `fgos run --case` running (guide).

## Ideas for the owner (RUL104: reason and benefit each; nothing was done)

1. **Prune of a half-finished case.** Reason: `pruneFinishedCases` deletes the Unit runs it judges safe even when another Unit run of the same case must stay, so the kept ledger can name Unit runs that are gone (seen in the dry-run lists of the stopped smoke case). Benefit: if the ledger should stay whole whenever it stays, delete Unit runs only when the whole case can go; a few lines fewer and no dangling names. Needs your choice because the current behaviour frees space sooner.
2. **Case projection split.** Reason: `projectCase` is 181 lines against a budget of 120 and grew from 168; the fold of one event kind per small function is the shape `projectWorkflowState` took (195 -> 45). Benefit: the one function over budget, easier owner proof per event kind.
3. **Ledger and admission growth.** Reason: Case ledger (+109) and Admission (+84) grew because new checks sit in `case-runtime.mjs` (+73), `case-projection.mjs` (+47) and `case-bindings.mjs` (+69). Benefit: a size pass on those three files after the coding cutover (`wf-coding-cutover`) removes the paths that cutover retires; doing it before would cut code the cutover still needs.
4. **Prune size.** Reason: 245 lines against 150. Benefit: moving the eight keep reasons into one table the judge reads would shrink the judge and make a new rule one row; no behaviour change, needs the prune tests as the guard.
5. **Status accounts for every run.** Reason: `workflow status` prints each seat's account only for a `--seats` run; the owner's decision 71 (3a) says "each seat's account". Benefit: one status for presets and `--units` runs too, without opening the Unit run on disk.
6. **Settle-wins semantic** for the open race above. Reason: a real, small window, and the only open correctness item of the case runtime. Benefit: closes it; costs one new settle rule, which is why it needs your go.
7. **Retention of plain `fgos run` Unit runs.** Reason: prune covers only Unit runs a case names; plain runs live forever; the share could not be measured today (history wiped), so the question is open. Benefit: if the share is large on the owner machine, one rule closes the rest of `p-tslryr3buq`. Measure first with `fgos workflow prune --json` there.
8. **Run-output size cap (arbitration addition 5).** Reason: a single dirty checkout makes every seat's `evidence.json` 684 KB (here, 4 seats = 2.7 MB per panel run). Benefit: a cap on the evidence the Execution Core writes would bound Unit run size at the source; T5 owns it.
9. **One repository fixture for the workflow tests** (from the test phase). Reason: `setupTestRepo` and `setupWorkflowFixtureRepo` build the same repository twice with small differences. Benefit: about 90 lines fewer; touches six test files, so it needs its own pass.
10. **Parallel order-guard presets** (from the test phase). Reason: `playbook-observable-order` runs eight presets in sequence (80 s wall here), each in its own fixture repo. Benefit: running them concurrently would cut wall time (test time is already 531 s); needs a proof that concurrency in one process is safe first.
11. **A way to test a launch failure without hiding `PATH`.** Reason: the live resume smoke needed a `PATH` without the agent CLIs to cause an infrastructure failure. Benefit: a documented doctor-level or dev hook would make activation smokes repeatable on every machine; adds a mechanism, so only if the owner wants activation smokes routine.

## Final wave (decision 73)

Owner decision 73 (2026-11-08 21:00, «Thu nhỏ rồi đóng» and all four ideas) added phases 16-20 before T6 closed. All five are on main (`21e52e58c`); docs and plan only in this close.

**What each phase delivered**

| Phase | Commit | Delivered |
|---|---|---|
| 16 | `59929ab1b` | `projectCase` 181 -> 61 lines (one fold per event kind); `setupTestRepo` is a preset over one workflow fixture repository; no behaviour change |
| 17 | `7ffd0a0e5`, `6b45c34c5` | a real settle is appended after a `not-started` release already on the ledger, so a finished Unit run is never read as never started (closes the open item of the first close); RUL-WF-37 |
| 18 | `c9aecc8e5` | prune deletes a case's Unit runs only when the whole case goes (a kept case keeps every run, `case-kept`, dry run equals apply); case-level keep reasons are one ordered table; RUL-WF-40 |
| 19 | `66567ab26` | `workflow status` returns `seatProviders` (executor, family, model, account) for every run, from the ledger bindings, no new state; RUL-WF-39 |
| 20 step 1 | `e12b0f419` | read-only recipe in the owner guide that measures plain `fgos run` Unit runs against case runs by count, bytes and age |

**Net size over all T6 commits** (same method as the table above: `git show --numstat`, doc and data files excluded; the five wave commits add to the 28 of the first close):

| Language | Added | Removed | Net | Target |
|---|---|---|---|---|
| Node (src, bin, scripts) | 2 548 | 2 504 | **+44** (+34 from the wave) | at most -300: **missed** |
| Rust | 5 | 4 | **+1** | at most +10: met |
| tests | 4 106 | 3 411 | **+695** (+85 from the wave) | at most -200: **missed** |

The wave estimate was Node about +30 and tests about +30 (range 0..+60); tests came in higher because the settle and prune cases are red-tested rules (+72 and +45 test lines) and the fixture merge removed only 33 net lines (`setupTestRepo` kept as a preset, Q-7).

**Budgets after the wave** (`wc -l`, same grouping as the table above)

| Component | Budget | Now | Met |
|---|---|---|---|
| Guide | at most 1 290 | 1 216 | yes |
| Case ledger | at most 1 200; prune at most 150 | 1 640; prune about 240 | **no** |
| Admission | at most 930 | 1 049 | **no** |
| Conductor entry | at most 2 040 | 2 135 | **no** |
| Playbook runner | at most 1 300 | 1 309 | **no (9 over)** |
| `workflow` arm of `bin/fgos.mjs` | at most 120 | 116 | yes |
| Doctor side | at most 180 | 150 | yes |
| `src/workflow` whole | about 6 900 | 7 349 | **no** |
| `projectCase` | at most 120 | **61** | yes (was 181) |
| largest function | under 300 | 96 (`createCaseAdmissionPort`) | yes |

**Verdict.** Behaviour acceptance stays met; the function budget is now met everywhere. Size acceptance (net) and four of the five component budgets stay missed. The gap is accepted under decision 73: ledger and admission growth waits for the coding cutover (`wf-coding-cutover`), because cutting before it would cut code the cutover still needs, and no remaining deletion removes a rule without dropping a proof-backed behaviour. Spec: RUL-WF-37, -39, -40, the stale `:191` reference and the decision 73 entry are written; section 9 is re-measured.

**Open items**

- **Plain `fgos run` retention** (`p-tslryr3buq`, the retention half). Waits for the owner's numbers: run the P20 recipe in the owner guide on the owner machine and fg-server and paste the output back; step 2 (the retention question, options only) follows. Not done, no rule exists.
- **P19 live smoke.** `fgos workflow status <preset run>` on an activated release; waits for the next release built from main (the guide notes that P16-P20 are not in the activated release `6f1fd31f3850…`).
- **Half-removed run.** A prune whose removal fails midway (`delete-failed`) leaves a half-removed run that later prunes keep as `unsettled` or `unit-record-missing` until it is removed by hand, and the kept ledger still names it. Accepted with no repair mechanism (lead decision Q-6; a two-phase delete or trash directory would be a new mechanism). Written in RUL-WF-40.
- **Size gap, accepted under decision 73** (Node +44, tests +695; the four budgets above). Reopens with the coding cutover.
- Still open from the first close and unchanged: `dispatch inspect --cwd .` under 1 s (not measured), `p-d2dc4f2e` launch-never-starts clauses, run-output size cap (arbitration addition 5, T5), the live smoke of a verdict refused on resume.
