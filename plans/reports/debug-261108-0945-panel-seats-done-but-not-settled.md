# Debug: two "finished" panel seats that were not settled

Date 2026-11-08 (Asia/Saigon). Read-only investigation for HARDEN on fg-server2, from COOK's report on
run `wf-run-1794101514711-1dde445a`, step `sense-making`, unit `unit-run-1794101515294-92ab75d6` (4-seat panel).
Evidence read only: `.fgos/workflow-runs/wf-run-1794101514711-1dde445a/`, `.fgos/assignments/unit-run-1794101515294-92ab75d6/`.

## Executive summary

- **Only one seat failed.** `unit-summary.json` and the `unit.complete` event give member-1 pass, **member-2
  execution-failure**, **member-3 pass**, member-4 pass. The unit failed because of member-2 alone.
- **member-3 (glm, direct/headless): no fault.** Settlement found and judged its claim
  (`worker-output/outbox/agent-result.json`, report `agent-report.md`), verdict `completed-pass`. COOK read
  `receipt.outboxPresent=false` as "not harvested"; that field only looks for the agent protocol's
  `result-<N>.json` and is false for every direct-mode seat by construction. Misleading field, not lost work.
- **member-2 (deepseek via pi, herdr pane): agent did not finish inside its 35 min budget.** It wrote
  `report-1.md` at 02:06:26Z, kept editing it (citation clean-up visible on screen), never wrote
  `result-1.json`, and the supervisor stopped it on time at the soft deadline 02:07:02Z. No race and no
  infra loss: had `result-1.json` existed, settlement would have judged it despite the timeout.

## Timeline (UTC; local = UTC+7)

| UTC | Event | Source |
|---|---|---|
| 01:31:55.390 | unit started | `unit-summary.json` startedAt |
| 01:31:55.931 | member-2 run started, `timeoutMs` 2100000 (35 min) | `member-2/1/runs/01/run.json` |
| 01:32:01.2 | member-2 `brief-1.md` written | stat |
| 01:32:17 | member-2 `ack-1.json` (`receivedAt 08:32:17+07:00`) | `outbox/ack-1.json` |
| 01:32:42 | member-4 (claude) exited with `result-1.json` | member-4 receipt |
| 01:40:37.775 | member-3 (glm, direct) exit 0, `stoppedBy: agent`; settled pass 01:40:38 | member-3 `gate-exit.json`, `result.json` |
| 02:06:26.720 | member-2 last write of `outbox/report-1.md` (= 09:06:26 local) | stat |
| ~02:07:02.1 | member-2 soft deadline: envelope `deadlines.softAt.boottimeNs` 2320494110000000 + `/proc/stat` btime | `envelope.json` |
| 02:07:02.268 | `stop-requested.json` cause `soft-deadline` | file |
| 02:07:02.526 | gate exit `stoppedBy: soft-deadline`, SIGTERM | `gate-exit.json`, `exit.json` |
| 02:07:02.638 | receipt `outcome: timeout`, `outboxPresent: false` | `receipt.json` |
| 02:07:03.38–.52 | unit settled `execution-failure`; `step.fail`, `workflow.fail` | `events.jsonl` seq 8–11 |

Timezone check: report 09:06 local = 02:06:26Z, i.e. 35.5 s **before** the stop; the stop came 0.16 s after
the soft deadline. The agent was still active (pane screen in `stdout.log` ends with "Let me normalize the
remaining short-form doc refs into full URLs … edit …"), so `idleMs` (20 min) did not apply.

## A. Headless seat (member-3, glm): why the receipt says outboxPresent=false

Two components look at two different things, both by design:

1. **Claim path for a confined cli-spawn (direct) worker** is decided by the effective execution contract:
   `src/runner/dispatch/effective-execution-contract.mjs:259-268` names
   `<runDir>/worker-output/outbox/agent-result.json` (the only run-output directory bwrap binds writable;
   introduced `8ec5abe61`, 2026-10-05). The direct launch sets the envelope's
   `launch.outboxDir` to the same directory (`src/run-supervisor/direct-launch.mjs:93`). A pane seat is told
   `outbox/result-<N>.json` / `report-<N>.md` by its brief (`brief-1.md` "When you finish").
2. **The receipt** (Rust supervisor) sets `outboxPresent` only when `launch.outboxDir` holds a
   `result-<N>.json` (`packages/run-supervisor/rust/src/supervise.rs:245-268`; contract
   `packages/run-supervisor/contracts/receipt.v1.json:10-11`). `agent-result.json` never matches, so every
   direct-mode seat gets `outboxPresent=false` regardless of what it wrote. It does not change the outcome:
   `outcome_for` maps `stoppedBy: agent` to `exited` without looking at the outbox (`supervise.rs:66-80`).
3. **Settlement does not depend on it.** `claimOf` uses the receipt's `outboxResult` when set, else
   `findWorkerClaim(runDir)` (`src/run-supervisor/steps/settle-attempt.mjs:109-122`), which searches
   `worker-output/outbox`, `worker-output`, `outbox` for `result-<N>.json` or `agent-result.json`
   (`src/run-supervisor/worker-artifacts.mjs:39-77`; one lookup since `a6251673a`, 2026-11-04). The comment
   at `settle-attempt.mjs:110-115` says this outright: "a receipt that names nothing is not proof of no claim".

Proof from the evidence: member-3 `result.json` has `settleReports[0].path = …/worker-output/outbox/agent-report.md`,
`agentClaim.status = done`, `classification.outcome = {ok, completed-pass}`; `unit.complete` lists member-3 `pass`.

Scope: every direct-mode (cli-spawn) seat, not only glm. In this run glm was the only direct seat; gemini
(member-1) and claude (member-4) ran as herdr panes (`envelope.mode = terminal`) and show `outboxPresent=true`.
Not a T5 regression: the path split dates from 2026-10-05 (claim path) and 2026-10-18 (`577087d1c`, receipt);
the T5 change `a6251673a` (11-04) made the fallback lookup one function and is what finds this claim today.

**Classification:** neither lost by settle nor agent fault. Observability defect only: the receipt field is
true to its contract but reads as "no output" for every direct seat, and COOK drew the wrong conclusion from it.

## B. Pane seat (member-2, deepseek via pi): report + ack, no result

- **Who writes `result-1.json`:** the agent, last, as the round's end marker. The brief
  (`member-2/1/runs/01/brief-1.md`, "When you finish") says: write `report-1.md`, then `result-1.json`, each
  `.tmp`-then-rename; "The second file is what ends this round". The supervisor never writes it; `ack-1.json`
  is the agent's brief-received marker, written at 01:32:17Z.
- **Why the soft deadline stopped it:** `soft_deadline_passed()` is a fixed wall budget from launch
  (`packages/run-supervisor/rust/src/supervise.rs:416-418`, checked in the watch loop at `:894-895`), set from
  `timeoutMs` (`src/run-supervisor/direct-launch.mjs:231-233` for direct; same deadlines shape in the terminal
  envelope). It fired on time (02:07:02.1Z ±1 s; stop 02:07:02.268Z).
- **Why outboxPresent=false:** no `result-<N>.json` existed in `outbox/` at receipt time (02:07:02.638Z);
  the field is correct.
- **No race with settlement:** `rawResultOf` judges any present claim whatever stopped the agent
  (`src/run-supervisor/steps/settle-attempt.mjs:146-156`; held by
  `test/run-supervisor/attempt-steps.test.mjs:168` "a timeout receipt with an outbox result is still judged
  from the outbox"). Here `claimOf` found nothing (`findWorkerClaim` → null), so the receipt `timeout` became
  `isTimeout: true` (`settle-attempt.mjs:169-170`) → `execution-timeout`
  (`src/runner/dispatch/settlement.mjs:257-265`), outcome category `infra / infra-exec-failed`.
- **The report was not thrown away:** `result.json` lists it in `settleReports` and `evidence.artifacts`.
  It just was not accepted as a finished round, by contract (no claim = not done).
- The agent had 29 s left when it last saved the report and spent them polishing citations instead of
  writing the claim. The brief states `Timeout: 2100000ms` but gives no wall-clock end time.

**Classification:** agent did not follow the protocol in time (finished-ish draft, no end marker before its
budget). Infra behaved per contract. Contributing factor: 35 min is tight for a deepseek-flash researcher seat
that runs web lookups; the three other seats took 0.8, 8.7 min and under 35.

## C. Fixes in the existing door (RUL104), with owning tests

| Seat | Cause | Smallest cause-aligned fix | Owning proof |
|---|---|---|---|
| member-3 | Receipt `outboxPresent` cannot see a direct seat's claim, so a passing seat looks unsettled | Make a direct seat's claim follow the one agent-protocol name: the direct prompt/contract names `worker-output/outbox/result-1.json` + `report-1.md` (the envelope's `launch.outboxDir` already is that directory), so the receipt names the claim and `claimOf` no longer needs the `findWorkerClaim` fallback for supervised attempts; delete the `agent-result.json` name for confined cli-spawn in the same change (L10). Zero new mechanism; removes a second rule. If judged not worth the churn now, at minimum operator tooling and docs must read `result.json` classification, never `receipt.outboxPresent`, as the seat verdict. | Claim path: `test/runner/assignment.test.mjs` (owns the effective contract claim path). Receipt sees it: `packages/run-supervisor/rust/tests/supervise_lifecycle.rs`. Settle judges it: `test/run-supervisor/attempt-steps.test.mjs:117` (extend to a direct envelope). |
| member-2 | Agent ran out of a fixed 35 min budget before writing its end marker | (1) Brief states the absolute deadline (local time) and the order "write `result-1.json` as soon as the report is on disk; polish after" in the existing "When you finish" section; (2) right-size `timeoutMs` for panel research seats in the existing unit/override `timeoutMs` (`src/runner/execution/bind.mjs:354-358`). Both are text/config in existing doors. | Brief text: the brief-rendering test already asserting brief content (`test/run-supervisor/terminal-groups.test.mjs:264` area). Timeout source: owning bind test for `timeoutMs` precedence. |

No infra fix is needed for member-2's settlement: `attempt-steps.test.mjs:168` already owns "claim wins over timeout".

## D. COOK's proposals

| # | Proposal | Status |
|---|---|---|
| a | Receipt states the cause class | **Mostly present.** `outcome` enum + `gateExit.cause` + `reason` already distinguish brief not received (`abandoned-before-brief`, `abandoned-not-started`), deadline (`timeout` + `cause: soft-deadline/idle/hard-ceiling`), provider stops (`terminal:blocked:*`). Missing: "report present, result marker missing". Adding it to the receipt is a **new field (RUL104 addition, owner choice)**; the cheaper truthful version is a settlement `runnerNote`/failure detail when a timeout leaves `settleReports` non-empty (fix of existing contract, no new field). For direct seats the C-fix above makes `outboxPresent` truthful, which removes COOK's "finished without outbox in place" class entirely. |
| b | Settle harvests an existing report instead of outboxPresent=false | **Already harvested as evidence** (`settleReports`, `evidence.artifacts`). Accepting a report without a claim as a finished round changes the agent-protocol contract (the claim is the end marker, `brief-1.md` "The second file is what ends this round") and would accept half-written drafts like member-2's (still being edited at the stop). **New semantics, owner choice; I recommend against.** |
| c | Soft deadline based on seat progress | **Partly present:** `idleMs` is the progress-based stop (`supervise.rs:896`), soft deadline is the fixed budget, hard ceiling = soft + 25 s. A progress-extended soft deadline is a **new mechanism (owner choice)**; the in-door alternative is a right-sized `timeoutMs` per unit/override (exists). |
| d | Panel quorum, or rerun only failed seats | **New feature.** No quorum exists (`rg -i quorum src` empty); the unit fails if any seat fails. Owner decision 71 (4a) settles resume as reopening the whole step as a fresh admitted Unit for `execution-failure`, with no new automatic retry. Per-seat rerun or quorum would extend/alter that and needs a T6 owner decision; member-2's `infra-exec-failed` outcome already makes the step resumable under 4a. |

## Hypotheses tested

1. Settle looks in the wrong directory for headless seats — **eliminated**: member-3 settled pass from `worker-output/outbox/agent-report.md`.
2. Soft deadline raced the agent's result write — **eliminated**: no `result-1.json` existed; report last written 35.5 s before the stop; screen shows the agent still editing; claim-wins rule exists and is tested.
3. Wrong timezone / early stop — **eliminated**: softAt maps to 02:07:02.1Z, exactly 35 min after the brief; stop 0.16 s later.
4. Agent ran out of budget before the end marker — **confirmed** (above).

## Recurrence prevention

- Operators and COOK must read `result.json` `classification.outcome` (or `unit-summary.json` seat outcome) as the
  seat verdict; the receipt is the physical result only (`receipt.v1.json` description says so).
- Brief deadline line + "claim first, polish after" closes the member-2 class at the protocol level.

## Unresolved questions

1. Where the 2100000 ms seat budget came from (unit field vs `runner.timeoutMs` config); not traced, config files not read per rules.
2. Whether owner wants the direct-seat claim rename (C, member-3) now or under T6.
3. Whether a "report but no claim" note belongs in settlement (no new field) or the receipt (new field).
