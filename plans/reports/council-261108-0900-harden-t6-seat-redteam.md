# HARDEN T6 council: red-team seat (Workflow: guide and case)

Main `0291d40ed`; no file of `src/workflow/**`, `bin/fgos.mjs` or `src/setup/workflow-*.mjs` differs on `e8b5abc21`, and the activated release payload `src/` is byte-identical to main's `src/`. Written 2026-11-08 09:00 to 10:10 (Asia/Saigon) on fg-server2. Lens: adversarial. The threat model is a hostile or careless agent with a shell (conductor in the owner's session, an unconfined seat), a hostile pulled project file (workflow YAML, units file, slice list), two `fgos workflow` processes on one case, a crash at any line, and growth nobody prunes. Read-only: this report is the only repository file written.

Citations glossed once: **RUL104** (better, not bigger: harden what exists, add no mechanism without the owner), **L10** (add through the door, not alongside it: replace a path and delete the old one in the same change), **D-ADR0070** (Workflow is guide plus admission ledger; the agent picks the order, the harness admits), **design principle 8** (one owning proof per behaviour).

## What I ran

- **Read in full:** all 30 files of `src/workflow/` (7 288 lines), the `workflow` case of `bin/fgos.mjs` (2234-2371), `src/setup/workflow-case-checks.mjs`, `src/runner/execution/case-admission-port.mjs`, `domains/coding/workflows/feature.yaml`. **Read by function:** `handoff-refs.mjs` (`reportRefOf`, `gateAnswerFile`, `resolveUnitInputs`), `confinement/resources.mjs` (blind roots, run-output), `confinement/policies.mjs`, `goal-check.mjs:runCommand`, `loops/verify.mjs`, `account-pin.mjs`, `agent-definitions.mjs` (persona taste refusal), the spec sections on answer, consent and acceptance (`docs/platform/workflow/spec.md` 5.4, RUL-WF-14/-24, 11.1), `core/skills/fgos-cook/references/case-and-doors.md` 8-9.
- **Reproductions** in a scratch git repository under `/home/vantt/projects/forgent-worktrees/t6-redteam-scratch/` (removed after; no process left), importing the activated release payload with `FGOS_HOST_BIN` set and `HERDR*`/`CLAUDE*` unset, scratch `HOME` (no real config read). Scripts in the session scratchpad (`t6rt/repro.mjs`, `t6rt/load.mjs`). The loader repro was also run through the real activated `fgos` binary.
- **Measured on this checkout (read-only):** sizes of `.fgos/workflow-runs/*/{events.jsonl,advance.log}`, `.fgos/assignments`, and one `fgos workflow status --json` of a parked run.
- **Not done:** no agent, seat, pane or provider; no test file (the 420 tests are green on the baseline and none of my findings has a test that would fail today, which is the finding); no Cargo build.

## Part A: target shape (red-team view; layout and size numbers are the other seats' call)

| Component | Authority (what it alone decides) | Contract and ports | Rust/Node, Node budget | Delete list (this lens) | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|
| **Guide** (`guide-schema`, `definition`, `steps`, `loader`, `checked`, `ref-digests`) | What a guide may say; which milestones each activity may produce; where a definition is found | Pure kernel; `loadWorkflow(id, {packageRoot})` finds shipped definitions in the payload, project ones in the project, by one rule | Node, no move (pure data, read by Work's kernel). Budget: no growth | `resolvePackageRoot` heuristic (R-2); unused `entryStep` | `domain-workflow-operations-coverage`, `workflow-capabilities-configured`, `domain-registry-compiled` (shared) | ≤ 1 300 (from 1 345); `validateWorkflow` under 300 lines |
| **Case ledger** (`store`, `case-projection`, `case-runtime`, `case-lock`, `case-frame`, `case-close`) | The append-only ledger, the fold to milestones, and **which evaluator may achieve which milestone** (today it does not decide the last one: R-1) | One append door under `advance`; inbox files are claims folded under the hold; ids validated once at the store's path builder | Node; the `advance` mutex is T1's. Budget: no growth | own `fsyncDirectory` copies (2), unused `reservationQuiet`, `CASE_EVENT_KINDS` | `workflow-case-bindings` (absorbs `workflow-case-binding-sentinel`, same fix) | ≤ 1 230 |
| **Admission** (`case-admission`, `case-admission-port`, `case-bindings`, `case-gate`) | May this activity run now; one binding per worktree; **a gate receipt binds to the declared check, not a caller string** (R-1b) | `CaseAdmissionPort` (T5 owns the interface) | Node; stays (spec 5.2: re-evaluate only if the Execution Core door moves to Rust; T5 kept it in Node) | `--verify` free text on `workflow gate` once the declared check is the only source (R-1b) | `workflow-case-bindings` | ≤ 950 |
| **Conductor entry** (`propose*`, `case-start`, `case-inherit`, `case-verbs`) | Proposal arithmetic; opening a case under a frame; the five verbs. `answer` records an **owner** answer to a **gate that exists** | CLI doors only; `answer` refuses a step that is no gate of the guide | Node | none beyond R-1 | none of its own | ≤ 2 150 |
| **Playbook runner** (`runner`, `unit-handoff`, `units-source`, `seats`, `seat-providers`, `dir-guard`, `index`) | Step order of a preset; never a merge | Execution Core `runUnit`; **no Git Land port** (merge stays at the approve door) | Node | Playbook `kind: integrate`: `mergeWorkflowBranch`, `acknowledgeWorkflowLand`, `resolveIntegrationTarget`'s merge use, integrate branch of `advanceWorkflowRun` (R-4; owner decision); duplicate `ADVANCE_DETACHED_ENV` in `dir-guard` | `blind-steps-use-proven-pools` (shared with T5) | ≤ 1 400; `advanceWorkflowRun` under 300 |
| **Doors** (`bin/fgos.mjs` `workflow`) | Parse and hand over; the detached child prints progress, not its result (R-3) | `fgos workflow start|status|answer|resume|close|gate|propose|operations` | Node | the JSON result dump into `advance.log` | none | ≤ 145 lines |

Red-team position on the Rust question: **no Rust move**. Every finding below is a wrong input or a missing check, not a language problem; a port of the fold would carry R-1 over unchanged.

## Part B: findings

### R-1 High, reproduced: `fgos workflow answer --approve` achieves any activity's milestones, including delivery milestones, so a conductor (or any unconfined process) clears `verify-receipt` MUST rows without a verify

**Where.** `case-verbs.mjs:168-185` (`recordAnswer`) accepts any `stepId` that is a path segment: no check that the step is a gate, that a decision point names it, or that it parked. `case-runtime.mjs:314-339` creates the round with `occurrence = max(1, parks)` even with zero parks. `case-projection.mjs:113-121` then achieves `p.milestones ?? activityOf(p.stepId).produces` with a `gate-answer` receipt, and never asks `isDeliveryMilestone` (the settle path at `:131-136` does). For a conductor case `currentDigests` is `{}` (`case-admission-port.mjs:49`, `case-close.mjs:18`), so the answer's digest is never compared again. Nothing checks the caller: `answer` has no dispatch-depth or confinement check (the ledger writes in `case-admission-port.mjs:138-145` do).

**Reproduction** (`repro.mjs answer-gate`, scratch repo, `coding/feature`, frame `dispatches=9,mutatingDispatches=4,seatLaunchesPerDispatch=4,rigorFloor=standard`):

```
integrate admitted before any answer: "entry-milestone-unmet"
answer on a non-gate activity from depth 1: "accepted"          # FGOS_DISPATCH_DEPTH=1, --step implement-item --approve
milestones after answer: {"request-received":"achieved", "plan-validated":"unreached", "child-verified":"achieved/gate-answer", ...}
integrate admitted after the answer: "ADMITTED"
```

`child-verified` (MUST `child-receipt`: "a worker's own claim of passing tests is not a receipt") is achieved with no Unit run, no verify, and while its own producer's entry `plan-validated` is unreached. `fgos workflow answer --step integrate --approve` achieves `integrated` the same way.

**Who can.** The conductor agent itself (the doctrine says "do not write consent", `case-and-doors.md:150`, prose only), any unconfined seat (no depth check), any shell user. Confined seats cannot: their view of `.fgos/workflow-runs` is read-only (`confinement/policies.mjs` grants no host write), so R-1 is not a confinement escape. It contradicts spec 11.1 scenario 2 and RUL-WF-14. The approve door still verifies at merge, which is why this is High and not Critical.

**Fix (moves authority, adds no mechanism):**
1. `recordAnswer` refuses a step that is neither a step with a `gate` nor the activity of a decision point that carries `gate:` (`gate-unknown`, by name), and refuses at `currentDispatchDepth() > 0` through the existing `confinedWriteRefusal` reason text. Same lines, one condition each.
2. `projectCase` `gate.answer` branch skips delivery milestones (one `isDeliveryMilestone` test, the function already exists), so only `harness-verify`/`reviewer-verdict` receipts reach them, as the settle branch already enforces.

### R-1b High, reproduced: `workflow gate` takes a caller-chosen command and writes a `harness-verify` receipt for `integrated`

**Where.** `case-gate.mjs:68-70`: `command` wins over the capability's declared `verify`; `bin/fgos.mjs:2334` passes `--verify` straight through; `propose.mjs:257` writes the slice list's agent-authored `gate` field into the printed line. The receipt carries `gate.command` (`case-gate.mjs:108-115`), but `isValidReceipt` (`case-projection.mjs:26-33`) never compares it with anything, and the approved proposal is not on the ledger, so nothing binds the run to the command the owner saw.

**Reproduction:** same case, the project's real check `check.sh` exits 1; `runCaseGate({ command: 'true', writes: ['src'] })` gave `outcome: pass` and `integrated: achieved/harness-verify`.

**Fix:** the gate runs `verifyCommandOf({ capability }, cfg)` only; `--verify` and the slice list's `gate` key go (delete), or, if the owner keeps an ad hoc gate, `case.opened` records the approved gate command (it already records the frame) and admission of `integrate` refuses a different one. Owner question Q1.

### R-2 High, reproduced through the activated `fgos`: in any project whose root has a `package.json`, every shipped workflow is "not found"

**Where.** `loader.mjs:12-28` `resolvePackageRoot` stops at the first ancestor holding `core/workflows` **or** `package.json`; `loadWorkflowWithSource` (`:146-166`) falls back to `scanWorkflows({ cwd: process.cwd() })`, i.e. the project again. The payload's own root (`:21-26`) is reached only when no ancestor has a `package.json`.

**Reproduction:** scratch repo with `{}` in `package.json`, activated release: `fgos workflow propose --slices s.json --json` → `Workflow "coding/feature" not found. Known workflows: [none]`; without `package.json` the same call returns a proposal. `loadWorkflowWithSource('council-lite')` behaves the same. So `fgos workflow start <preset>` and the whole `fgos-cook` flow fail on JavaScript projects, which is mission #1 (fgOS serves other projects). The definition comment "a preset or plan is shipped to other projects" (`definition.mjs:119-120`) is not honoured.

**Fix (deletes code):** the fallback scans the running payload's root (`OWN_PAYLOAD_ROOT`, the one door the native loader already uses), and `resolvePackageRoot` goes. Project definitions keep precedence by scanning `packageRoot` first. Owning proof: `test/workflow/workflow-loader-persona-scope.test.mjs` gains one case "a project with a package.json still finds a shipped workflow".

### R-3 Medium, reproduced by measurement: the detached advance writes its whole JSON result into `advance.log`, 341 MB of the 431 MB in `.fgos/workflow-runs`, and `status` shows that JSON as "progress"

**Where.** `case-start.mjs:170-178` spawns `fgos workflow resume --foreground` with stdout to `advance.log`; the child prints the projected state (all unit results, pretty JSON). `case-lock.mjs:88-118` tails the last 64 KB as `advance.lastLines`.

**Evidence:** `advance.log` totals 341 MB against 109 MB of `events.jsonl` over 54 runs; one run's log is 46 MB / 1 034 915 lines with two full dumps. `fgos workflow status wf-run-1792209767959-7424ddf9 --json` (parked) returns `lastLines` = 20 lines of closing braces and a gate question, not one `[ts] step ...` line.

**Fix:** the detached child's result goes nowhere (the ledger is the record); only `progressLine` reaches the log. Deletes the dump; no new code beyond the spawn's stdout target.

### R-4 Medium, reasoned (mechanism confirmed by its own test): a Playbook `integrate` step is a second merge door to the trunk, unverified, and can land half a step

**Where.** `runner.mjs:205-254`, `mergeWorkflowBranch` `:604-630`: each writing unit's branch is published to the integration target (default: the repository trunk, `unit-handoff.mjs:325-337`) through Git Land with `evidenceDigest` of the literal policy "workflow integration runs no verification command". The loop lands unit 1, then on a refusal for unit 2 breaks and records `step.fail` with only unit 2's reason: the trunk already holds unit 1, and unit 1's Land operation is never acknowledged (`acknowledgeWorkflowLand` runs only on success, `:250`). A crash after a publish and before `step.complete` leaves the same unacknowledged operation; the rerun finds the branch already an ancestor (`merged: false`, no `operationId`) and acknowledges nothing. `test/workflow/case-verbs.test.mjs:52` "an answered gate lets the integrate step land the writing unit branch on main" proves the landing exists. No shipped preset uses `kind: integrate`; units files cannot express it; only a project or domain YAML can.

Conflicts with "merge happens at the approve door" (spec 5, feature.yaml `merge-at-approve-door`) and with L10 (two doors to one effect). **Fix:** delete the Playbook integrate kind (owner question Q2); if kept, land nothing until every unit's merge is prepared, and acknowledge on every exit.

### R-5 Medium, reasoned: resume of D1 must not become a retry-until-pass door

D1 (baseline 7: `runner.mjs:124`, `store.mjs:382-397`) is the correctness seat's. Red-team constraint for its fix: re-open a failed step on `resume` only when its unit has no settled seat evidence (no `unitRunId`, or `noBriefDelivered`), never for `findings`, `refused`, an admission refusal or out-of-scope writes; the rerun is admitted again (frame and seat-launch ceiling count it). Otherwise `resume` re-rolls a reviewed `findings` until a seat says `pass`.

Related crash window (reasoned): a crash after `unit.scheduled` with a worktree and before `unit.started` (`runner.mjs:324-341` vs `:409-416`) leaves `wf/<run>/<unit>` checked out in the orphan worktree; `resume` sees no `unitRunId` (`unit-handoff.mjs:413-422`), tries a fresh worktree on the same branch, Git refuses ("already checked out"), the unit fails as `prepError`, and by D1 the run is dead. Fix: reuse `uState.worktreePath` when it exists, whatever the run id (the resume branch at `runner.mjs:293-298` already does this for a known run).

### R-6 Medium, reproduced by DOCOS: `--account` is applied to every seat unscoped and moves seats onto the pinned pool's family

`unitOverridesOf` (`unit-handoff.mjs:180-208`) adds the account to every seat-scoped entry and a trailing unscoped override; bind then moves seats to the pool's family (`account-pin.test.mjs` "a pin selects the entries its pool serves, so it can move the seat to the family that pool belongs to"). The runner's check (`runner.mjs:368-397`) only records `unit.account-unpinned` when **no** seat takes the pin. DOCOS (`debug-261106-2221-...` section 3) saw `--account gemini/tetnu` move an openai framing seat to gemini. The help text (`command-registry.mjs:2403`) says "seats whose chosen model is served by another pool run unpinned", which the code does not do, and on a panel the pin can put every seat on one family, silently undoing the family spread a panel is for. The bind rule is T5's (Seat Binding); the Workflow side owes one statement: either the run-level pin is scoped to the seats whose chosen entry is in that pool (no unscoped fallback), or the help text and spec say "moves seats". Owner question Q3.

### R-7 Medium, measured: nothing bounds `.fgos/assignments` (1.4 GB, 529 runs, 445 older than 14 days) or `.fgos/workflow-runs` (431 MB), and a worker can grow the first at will

One unit run is 31 MB, 29 MB of it the worker's own `outbox` (`driver-probe`, `terminal-probes`). The run-output grant has no quota, so a confined worker fills the project disk. Retention (`p-tslryr3buq`, Workflow's by the T5 arbitration) must key on the ledger: never prune a unit run named by a `unit-run:` ref, a `unit.started`, or a reservation of a case that is not closed, nor a run whose `advance` or cwd lease is held; deleting a referenced report turns its milestone digest `null`, which fails closed (`ref-digests.mjs:118-131`) and strands the case. R-3 alone removes about 80 % of `workflow-runs` with no retention at all.

### R-8 Low/Medium, reproduced: a `dependsOn` cycle is accepted and the run sits in `running` forever

`validateWorkflow({ steps: [{ id:'a', dependsOn:['b'] }, { id:'b', dependsOn:['a'] }] })` returns the definition (`definition.mjs:412-422` checks existence and self-reference only). `advanceWorkflowRun` then finds no ready step and not all done (`runner.mjs:130-149`), returns `running`, and `status` keeps suggesting `resume` after 30 s. Same for a units file. Fix: refuse the cycle in `validateWorkflow`; `propose.mjs:125-140` `orderSlices` already has the loop to reuse.

### R-9 Low, reasoned

- **Case ids are not validated at the path builder.** `workflowRunDir`, `caseDirOf`, `workflowRunDirOf` join any string (`store.mjs:42`, `case-admission-port.mjs:29`, `case-lock.mjs:19`): `fgos workflow close ../../x` or `fgos run --case ../../x` reads, locks and appends in any directory that holds an `events.jsonl`. `caseEnvOf`'s `idLike` (`case-admission-port.mjs:123`) is the rule to apply once there.
- **A reader can see a half-written line.** `statusWorkflow` and the doctor's `casesWithBindings` read the ledger with no retry while a proposer appends multi-MB `unit.complete` lines (3.8 MB measured); the reader gets `workflow-ledger-unterminated` (status error, doctor `ledger unreadable`). The port's own `readEvents` retries 3 times with no wait. Fix: one shared read that retries on that code.
- **Inbox files are trusted by content.** `drainCaseInbox` appends a `settle` from any `settle-pending/*.json` even when no `reservation` names it, and a round's `stepId` comes from the file, not its `<step>.rounds` directory (`case-runtime.mjs:225-235`, `:245-249`, `:360-399`); `readJson` follows links and blocks on a FIFO under the held `advance`. Only a writer of the case directory can plant them (not a confined seat), so this is defence in depth: refuse a settle without a reservation, take `stepId` from the directory name.
- **A pre-answer skips a final gate.** `answer --approve` before the gate parks sets the step `answered` (`store.mjs:349-373`); the runner then never parks it (`runner.mjs:166`). Downstream admission catches it through the stale digest (`entry-milestone-stale` re-parks), except for a last gate with nothing after it (the advisory presets' `close`). R-1's fix (refuse an answer with no open question for a Playbook gate) closes it.

### Hypotheses rejected (so the next review skips them)

- **Binding key reuse after a worktree is deleted:** inode numbers are reused at once on this ext4 (5 of 5), but the key is `dev-ino-birthtime` (`66306-26755268-1794103699140003191`), and a fresh worktree got its own binding in the repro.
- **Workflow YAML naming executors or taste:** G2 refuses `executor|provider|model|tier|invocation|prefer|overrides` at every level (`definition.mjs:19-27`); persona files refuse taste (`agent-definitions.mjs:234`).
- **Unit `verify` from a project YAML runs a host command unconfined:** true, and the same as `capabilities.*.verify` and the project's own `npm test`; the T5 config door kept verify project-settable on purpose. Not a bypass; worth one line in the spec's trust section.
- **Unit worktree escape:** writes are canonicalised, contextRefs refuse `..`/absolute, unit worktrees are `mkdtemp` under the temp dir; `units-source.mjs:201-247` limits ids to branch-safe names. A YAML unit id is not so limited, but Git refuses a bad ref name and the unit fails by name.
- **Concurrent `answer`s, `resume`s, admits on one case:** the kernel `advance` mutex, `installOnce` round files and the busy refusal hold; I found no lost update.
- **Confined worker forging rounds or settles:** its view of `.fgos/workflow-runs` is read-only (blind launches hide it entirely, `resources.mjs:30-36`).

### Spec and comments the code does not honour

| Claim | Where | Code |
|---|---|---|
| Consent only from a gate answer; a worker's claim is not a receipt | spec 11.1 #2, RUL-WF-14, feature.yaml `child-receipt` | R-1, R-1b |
| `approved` is consent bound to the integrated tree before merge | feature.yaml milestones and `consent-before-merge` row | no activity produces `approved`, and none is downstream of it, so `consent-before-merge` never fires; it is the approve door's in fact. Move the row to `unenforced` or name the approve door |
| Seats outside the pinned pool run unpinned | `command-registry.mjs:2403` | R-6 |
| Shipped presets serve other projects | `definition.mjs:119` | R-2 |
| Doctor row `workflow-pools-satisfy-independence` | spec (pattern `debate` paragraph) | not registered |
| `integrate.mjs`, `plan-source.mjs` | spec 18 | do not exist |
| `src/workflow/runner.mjs ADVANCE_LOCK_FILE` | `lock-registry.v1.json:52` | no such symbol (`case-lock.mjs` owns the lock) |
| "see case-inbox.mjs" | `ref-digests.mjs:5` | file is `case-runtime.mjs` |
| `advance.lastLines` is the advance's progress | spec 5.4 | R-3 |

## HARDEN tables

### Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| Gate-answer fold (`case-projection.mjs` `gate.answer`) | Which milestones an answer may reach | No | Wrong rule, not wrong language (R-1) | 1 | ±0 (one condition) |
| `recordAnswer` / round file | Who may answer what | No | R-1 | 1 | about +4 |
| `case-gate.mjs` command choice | Which check backs `integrated` | No | R-1b | 1 | −10 if `--verify` goes |
| `loader.mjs` fallback | Where shipped definitions are found | No | R-2 | 1 | about −15 |
| Detached child output | What `advance.log` holds | No | R-3 | 1 | ±0 |
| Playbook integrate (`runner.mjs`, `mergeWorkflowBranch`) | A merge to trunk | Delete (Q2) | R-4, L10 | 2 | about −110 |
| Admission, projection, bindings | Case decisions | No | Spec 5.2 keeps them in Node while the door is Node | — | other seats size |

### Delete list (this lens)

- `mergeWorkflowBranch`, `acknowledgeWorkflowLand`, the integrate branch of `advanceWorkflowRun`, the merge use of `resolveIntegrationTarget`, the `kind: integrate` step kind, and `case-verbs.test.mjs:52` plus the integrate cases of `workflow-runner`, `units-runner`, `case-admission-port` and `test/git/e2e-consumer-noncoding.test.mjs:91` (Q2; the approve door's own proofs own merging).
- `--verify` on `workflow gate` and the slice list's `gate` key (Q1, option a).
- `resolvePackageRoot` (R-2).
- The JSON result dump of the detached child (R-3).
- Unused exports `reservationQuiet`, `entryStep`, `CASE_EVENT_KINDS`; the second `ADVANCE_DETACHED_ENV` in `dir-guard.mjs:82`; the two private `fsyncDirectory` copies (`store.mjs:123`, `case-bindings.mjs:31`) in favour of the durable door.
- Doctor row `workflow-case-binding-sentinel`, merged into `workflow-case-bindings` (same fix function, condition kept).
- Stale text: spec 18 file names, the unregistered row name, the lock-registry note, the `case-inbox.mjs` comment.
- Data, not code: `advance.lock/` directories with `TOMBSTONE` in old run dirs (pre-v3 lock layout); prune once with retention.

Additions named by findings and what they replace: R-1's two conditions replace nothing (missing checks); R-8's cycle refusal reuses `orderSlices`; R-9's id rule reuses `caseEnvOf`'s pattern.

### Doctor table (conditions this lens cares about)

| Condition | Row that keeps it |
|---|---|
| Bindings directory not marked real | `workflow-case-bindings` (merged from `workflow-case-binding-sentinel`; message and fix unchanged) |
| A binding record disagrees with its ledger, or is held by a closed case | `workflow-case-bindings` |
| A ledger cannot be read | `workflow-case-bindings`, but only after the retry of R-9, so an append in flight is not a failure |
| Unbounded `.fgos/assignments` / `workflow-runs` | none needed if retention runs on its own; otherwise one warn row that replaces nothing is a proposed addition (below) |
| Shipped workflows resolvable from a project with `package.json` | none: R-2 is a code fix with one owning test |

### Tests table

| Behaviour | Owning proof (extend) | Note |
|---|---|---|
| An answer to a step that is no gate is refused by name; an answer never reaches a delivery milestone | `test/workflow/case-projection.test.mjs` (fold) + `test/workflow/case-runtime.test.mjs` (round door) | one case each; no CLI test |
| A gate receipt comes from the declared check only | `test/cli/fgos-case-doors.test.mjs:102` (the gate test) | change, not add |
| A project with `package.json` finds a shipped workflow | `test/workflow/workflow-loader-persona-scope.test.mjs` | one case |
| `advance.log` holds progress lines only | `test/workflow/case-verbs.test.mjs` (detached cases) | assert on the log of a run it already starts |
| A dependsOn cycle is refused | `test/workflow/guide-schema.test.mjs` or the definition cases | one case |
| Resume reruns only a failure with no seat evidence | `test/workflow/workflow-runner.test.mjs` (resume cases) | with D1's fix |
| Integrate lands a branch | `case-verbs.test.mjs:52` and the integrate cases | retired with Q2 |
| Time-based waits | 7 in `workflow-runner.test.mjs` | speed seat |

## Proposed additions (owner picks; kept apart from the fixes)

- **P-1. Record the approved gate command on `case.opened`.** Problem: R-1b if the owner keeps ad hoc gates (Q1 b). Evidence: the reproduction. Benefit: the receipt binds to what the owner approved. Cost: one field on an event that already carries the frame.
- **P-2. One retention door for `assignments` and `workflow-runs`** keyed on closed cases and no live lease (R-7). Problem: 1.8 GB here, unbounded, worker-driven. Benefit: disk bounded without stranding a case. It replaces the manual cleanup nobody does; it is the row `p-tslryr3buq` already asks for.
- **P-3. A size cap on the run-output grant** (T5 confinement, named here because R-7 is its consequence). Problem: a confined worker can fill the disk. Benefit: bounded worst case.

## Owner questions (decision-question form, batched)

- **Q1. Gate command (R-1b).** What: `workflow gate` accepts any `--verify` and writes a harness receipt. Cause: command precedence in `case-gate.mjs:68`. Options: (a) only the capability's declared verify, delete `--verify` and the slice `gate` key (−10 lines; a project must declare `code:implement.verify`); (b) keep ad hoc commands but bind them on `case.opened` (P-1, +5 lines). Recommendation: (a), since the proposal already refuses when neither exists. Scope: T6 sub-plan.
- **Q2. Playbook integrate (R-4).** What: a second, unverified merge door to the trunk that can land half a step. Options: (a) delete it (−110 Node, retire 5 test sites; no shipped preset uses it); (b) keep it, prepare all merges before publishing any, acknowledge on every exit (+20). Recommendation: (a). Scope: T6.
- **Q3. Run-level `--account` scope (R-6).** Options: (a) pin only seats whose chosen entry the pool serves, no unscoped fallback (Workflow side, about ±0); (b) keep "moves seats" and fix the help text and spec. Recommendation: (a); it is what the flag text promises and it keeps panel family spread. Scope: T6 plus a T5 Seat Binding check.

## Net size estimate (this seat's fixes)

Node −130 to −160 with Q1 (a) and Q2 (a) (−110 integrate, −15 loader, −10 gate, −15 dead exports and duplicate helpers, +15 for R-1/R-5/R-8/R-9 conditions); Rust 0; tests about −150 (integrate cases) +60 (five owning cases).

Status: DONE_WITH_CONCERNS
Summary: Reproduced three Highs: `workflow answer --approve` on any activity achieves its milestones including `verify-receipt` ones, `workflow gate --verify true` writes a harness receipt for `integrated`, and shipped workflows are "not found" in any project with a `package.json` (through the activated `fgos`). Also measured that 341 of 431 MB of `workflow-runs` is JSON dumped into `advance.log`, which `status` shows as progress.
Concerns/Blockers: R-4 and R-5 are reasoned, not reproduced; Q1-Q3 need the owner; R-1 is live on every conductor case and should be fixed before the rest of T6.
