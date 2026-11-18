# Shaping: supervisor plan, owner questions (2026-11-18)

discussion: settled

Settled 2026-11-18. Planner input: section "SETTLED DESIGN" plus the later sections "Ops-metrics phase renumbering" and "Round 8". A draft plan written early is kept as input only: [draft-input-261118-1141-project-supervisor-plan.md](draft-input-261118-1141-project-supervisor-plan.md). Plan dir to use: `plans/261118-1045-project-supervisor/` (minted, empty).

Shaper for the project supervisor (plan `plans/261118-1045-project-supervisor`, not written yet). Inputs: brief
`.fgos/runtime/tmp/supervisor-shaper-brief.md`, the parked draft `plans/261117-1430-portfolio-driving-draft`, audit
`plans/reports/audit-261117-1545-supervisor-watcher-audit.md` (main checkout), plan
`plans/261117-1856-secretary-session-spine`, `packages/distribution/rust/src/timer.rs`, `src/session-host/head-grants.mjs`.

## Decided by the shaper (inside the owner's settled direction; reported, not asked)

- **D1 Portfolio source without Work.** The supervisor reads only plan files: `plans/*/plan.md` frontmatter
  (`contract: plan-v1`, `status: ready`, `blockedBy` all `done`, `priority`, then `created`), validated by the
  plan-contract check. It never reads work items (`fgos ready`/`schedule` belong to the Work layer). The running claim
  for a plan lives in holder-lock (one lead per plan) and the plan's own `status: running`. No record files, no
  generated board (the draft's open dissents stay with the draft).
- **D2 Reorder and interrupt.** Miu reorders by editing the plan's `priority` (the secretary already has `plans`
  writes). Interrupting a running lead is an owner question raised through `fgos questions --open`, not an automatic
  action.
- **D3 Lead form.** A lead is a head session `fgos session start lead --name <plan-slug>`: confined like every head
  (owner 11-18). It drives exactly one plan and ends when the plan is `done` or parked on an owner question. A new
  persona `lead` in the head grant table gets the plan's footprint as writes, plus request verbs for what must run
  outside the sandbox (worktree create, `fgos run` for phases). The supervisor knows a lead ended from Session Host
  (retired vs gone) plus the plan status. `head-gone` detection comes from ops-metrics.
- **D4 One supervisor per project.** holder-lock, registered lock name. A tick that cannot take it exits.
- **D5 Pace.** Pace is the tick schedule: active interval while a plan runs or a lead is placed, idle interval
  otherwise; both are config keys. Each tick emits span `fgos.supervisor.tick` through the Observe write door (shape
  agreed with ops-metrics, `docs/discussions/ops-metrics/DISCUSSION.md` §6.0.1/§6 E on `shape/ops-metrics`). That
  phase waits for the ops-metrics phase that registers the kind.
- **D6 New code in Rust** (owner 11-18): the tick, the plan reader and the new verbs are in Rust.

## Q1. Is the supervisor woken by a timer or kept as a long-lived session?

**Chuyện gì đang xảy ra:** The supervisor never needs to chat with the owner. It only reads the plans, starts leads and
closes them. The owner suggested an OS timer.

**Nguyên nhân:** `timer.rs` already writes per-project systemd/launchd timers for two schedules (`mailbox-sync`,
`account-probe`), with one shared check and fix in doctor. A long-lived session costs tokens while idle, needs
rotation, and still needs something to wake it.

**Các lựa chọn:**
- (a) **A third timer schedule `supervisor-tick`.** Each tick runs a no-LLM Rust process: it takes the lock, reads the
  plans and leads, and then starts a lead, closes a plan, or does nothing. It starts a short LLM session only when it
  must judge something (for example, write a lead's brief from a plan with gaps). Gain: zero tokens when idle, survives
  reboot, and fits the existing doctor and timer code. Cost: about 300-500 lines of Rust (schedule, tick, plan reader)
  plus config keys. Harm: reaction comes at the interval, not instantly.
- (b) **A long-lived `fgos session start supervisor` session plus rotation.** Gain: it reacts at once to a message from
  Miu. Harm: it burns tokens when idle, needs rotation, and dies with the herdr/session host. It still needs a timer
  or a hook to wake it. Cost: less Rust, more operations.

**Khuyến nghị:** (a). It is cheaper, more robust, and already has a template in the code. Miu needs no instant reaction,
because a priority change only takes effect at the next lead start anyway.

**Phạm vi của câu trả lời:** "Yes (a)" authorizes adding the schedule to `timer.rs`, the config keys, a doctor row
(same template as the other two), and the Rust tick verb. It does not authorize an LLM session that runs without a
finding.

## Q2. The concurrency ceiling for leads

**Chuyện gì đang xảy ra:** The supervisor starts the next plan only below a ceiling.

**Nguyên nhân:** The secretary proposed at most 3 leads. On 11-18, 4 sessions ran fine on fg-server2. Each lead in turn
spawns phase seats and Cargo builds, so the real load can be several times the lead count.

**Các lựa chọn:**
- (a) **Config key `supervisor.maxLeads`, default 3, plus a load guard.** Skip the start when the 1-minute loadavg is
  above the core count, or when free memory is below a threshold (config). Gain: safe on a small machine and tunable
  per machine. Cost: about 50 lines.
- (b) **Only `maxLeads`, default 3, no load guard.** Simpler. Harm: one heavy plan with parallel Cargo builds can still
  choke the machine.
- (c) **Default 4**, based on 11-18, with or without the guard.

**Khuyến nghị:** (a) with default 3. Raise it per machine through config once the ops-metrics numbers show headroom.

**Phạm vi của câu trả lời:** It sets the default and whether the load guard exists. Project config still overrides
global config.

## Q3. Who lands the plan, and does this plan turn `land-branch.sh` into a door?

**Chuyện gì đang xảy ra:** Today landing runs through a hand script, `.fgos/runtime/tmp/land-branch.sh` (rebase, gate,
push, print `IN-MAIN`), plus several hand fixes (census hook, Node tests outside the sandbox, board line). It is not
an fgOS door, and a confined lead cannot push.

**Nguyên nhân:** The secretary-plan supervisor brief and the 11-17 trial record these gaps (backlog rows p-t55xjys4u5,
p-dkkodseo63). With several leads running at once, landings must be serialized.

**Các lựa chọn:**
- (a) **The lead lands each phase/wave itself through a new Rust door `fgos land <branch>`**, called as a request
  verb on the socket. The door holds a holder-lock `land` to serialize, rebases, regenerates the census, runs the
  gate and pushes. Gain: the lead has the context to fix a rebase conflict, and the supervisor only closes the plan.
  Cost: about 400-600 lines of Rust plus tests. It is a new door (RUL104: worth it, because it replaces a hand script
  every lead already uses).
- (b) **The supervisor lands**, after the lead reports done, through the same door. Gain: the lead never pushes. Harm:
  the supervisor has to handle conflicts, so it needs an LLM per landing, and the lead has already ended.
- (c) **Keep landing by hand** (the lead calls the script out of band), and only the board/close step is automatic.
  Gain: no new door. Harm: a confined lead cannot run it, so a person still has to land.

**Khuyến nghị:** (a). One landing door also serves Miu and any other project that uses fgOS, which is mission #1.

**Phạm vi của câu trả lời:** "Yes (a)" puts `fgos land` and its lock into this plan's footprint and retires
`land-branch.sh`. It does not include automatic review: the code-reviewer step before landing stays in the lead's
brief.

## Owner answers (2026-11-18)

- Q3: **(a)** the lead lands through a new Rust door `fgos land` (holder-lock `land`), and `land-branch.sh` is retired.
- Q1: reopened for discussion of the supervisor's role (see below).
- Q2: reopened. The owner asks whether the ceiling counts leads (plans in parallel) or workers. Owner's example: with
  4 lanes and a plan whose wave has only 2 parallel workers, 2 lanes stay free for another plan.

## Discussion round 1 (shaper's position)

- Role: the supervisor is a scheduler, not a driver. It has three duties: admit (pick the next ready plan and start
  its lead when a lane is free), reclaim (lead gone → restart a lead from the plan's phase table), close (plan done
  → board line, stop). It does not judge plan content, review, land or talk to the owner. None of these needs an LLM,
  so a timer fits.
- Lanes = worker slots pooled across plans (the owner's model). The check must sit where a worker starts (the seat
  start in `fgos run`/run supervisor), as a per-machine count, so leads cannot overrun it; the supervisor only reads
  free lanes to decide whether to admit a new plan. Prior art: `workerSlots.ceiling` (counts running Work items,
  Work layer: reuse its key and verb `fgos slots`, move the count to live seats) and `runner.parallel.maxRoots /
  maxLeavesPerRoot` (workflow-local).

## Owner direction, round 2 (2026-11-18, verbatim gist)

"Theo lý thì chỉ cần watcher chạy ở lớp dưới, nắm timer rồi quan sát cơ học. khi có sự việc thì nó sẽ làm các việc
business tùy case, có thể dùng tool gửi notify cho human ... và một việc quan trọng nhất mặc định là đánh thức
supervisor dậy xử lý sự việc. supervisor nên là một tiến trình llm thông minh, có thể biết cách dàn xếp. chứ nếu không
cần thông minh thì watcher là đủ."

Consequence: the timer belongs to the watcher (mechanical, lower layer, no LLM). On a detected event the watcher runs
the actions configured for that event kind (notify a human, other per-case actions); the default action is to wake the
supervisor. The supervisor is an LLM session that arbitrates (which plan next, how to share lanes, what to do with a
gone or stuck lead). Q1 is settled: timer = watcher, LLM = supervisor. The pace span moves from the supervisor to the
watcher tick; `supervisor-idle-burn` stays about the supervisor LLM.

## Owner answers, round 3 (2026-11-18)

Agreed: (1) wake = deliver to a live supervisor, else start one with `fgos session start supervisor`; it drains its
queue and exits. (2) Default wake triggers: plan-became-ready, head-gone (lead), plan-no-progress, lane-freed,
plan-done, plan-priority-changed. (3) Split: ops-metrics owns detection definitions, the attention view and the Observe
contract. This plan owns the watcher process (third timer schedule, Rust), the row-kind→action table and the
supervisor. Ops-metrics shaper informed (tick renamed `fgos.watcher.tick`, new span `fgos.supervisor.wake`).
Owner asks next: look harder at watcher vs supervisor responsibilities, and be ready to integrate with external
agent-operation UIs (example: multica).

## Responsibilities draft (shaper, round 3)

| Duty | Watcher (no LLM, timer) | Supervisor (LLM, woken) | Lead (one plan) | Mechanical door |
|---|---|---|---|---|
| Notice something happened | runs detections each tick | - | - | - |
| Remember what was already raised | records each raised event once (Event Store) | marks it handled | - | - |
| Notify a human | per-kind action through a notifier adapter | raises five-part questions (`fgos questions`) | - | - |
| Pick the next plan, share lanes | - | yes | - | - |
| Mark a plan running | - | at admit | - | holder-lock per plan |
| Start a lead | - | `fgos session start lead` | - | Session Host |
| Gone or stuck lead | detects | decides: restart, park, ask | - | Session Host stop/start |
| Run phases, review, land | - | - | yes, `fgos run`, `fgos land` | lane count at seat start; `land` lock |
| Close a plan | detects plan-done | board line, closes and checks lanes | sets `done` / parked | - |
| Watch the watcher | - | - | - | doctor timer row; supervisor checks the last tick when woken |
| Supervisor fails to wake | retries; after N tries notifies a human | - | - | - |

Gray zones to settle with the owner: the event queue and its ack (Event Store facts "raised/handled" vs a plain file);
whether some kinds bypass the supervisor (notify only); who may stop a lead (supervisor only).

## Ops-metrics agreement (2026-11-18, shape/ops-metrics DISCUSSION.md §6 E, plans/261118-0936-ops-metrics)

- This plan declares `fgos.watcher.tick` and `fgos.supervisor.wake` in its own `observe-kinds.json` (OM-D12).
- Ops-metrics defines `head-gone`, `plan-no-progress` (its phase 10, `core/attention/definitions/`). This plan defines
  `plan-became-ready`, `plan-done`, `plan-priority-changed`, `lane-freed` on events `fgos.plan.status` (attr
  `fgos.plan.change = status|priority`) and `fgos.head.state` (live|gone|unknown|retired), via
  `fgos metrics query --def <file> --since <previous tick ts>`.
- Waits: watcher + wake producers on ops-metrics phases 1 and 4; trigger definitions on phase 8.
- Open: `lane-freed` means a worker seat settled (lanes = worker seats), so it needs the run span settle event, not
  only `fgos.head.state retired`.

## Readiness for external agent-operation UIs (multica), shaper round 4

Evidence: [research-261118-1045-multica-integration-surface.md](research-261118-1045-multica-integration-surface.md).
Multica's nearest pieces are the squad leader (routes within one issue, not across a portfolio) and scheduler/wakeups.
It caps 20 runs per daemon and 6 per agent, asks humans only through free-text comments plus `blocked`, and runs
agents unsandboxed. Its stable doors are the CLI (`--output json`, PAT), plugin signed event hooks and autopilot
inbound webhooks. Its app REST API has no public contract. The best fit: fgOS keeps scheduling authority and mirrors
plans/runs out; multica (or any UI) acts only through fgOS doors.

Ports the supervisor design exposes (hexagonal; the in-house adapter first, each external UI an adapter):
1. **Portfolio read port**: one JSON read of plans, status, priority, lanes in use, leads and open questions (CLI
   `--json` and the existing gateway REST). A UI reads only this.
2. **Command port**: the same verbs Miu and the supervisor use (set priority, hold/resume a plan, answer a question).
   A UI never edits internals.
3. **Wake door**: one verb `fgos supervisor wake --trigger <kind> --ref <id>`. The watcher calls it; an external UI
   (through the gateway/webhook) calls the same door.
4. **Notifier port**: the watcher's per-kind `notify` action goes through notifier adapters (mailbox first; an
   outbound signed webhook is the generic adapter a UI such as multica consumes).
5. **Session placement port**: already Session Host (`direct`, `terminal`); a UI-hosted runtime is a later adapter
   (multica's unsandboxed runs conflict with confinement, so last).
6. **Question port**: five-part questions out through `fgos questions --open`; an adapter maps them to a UI's comment +
   blocked status.

Shaper decisions on the round-3 gray zones: the event queue is Event Store facts (raised once by the watcher,
handled by the supervisor), so a UI sees the same queue; kinds that cannot wait for or concern the supervisor
(supervisor wake failed N times, watcher overdue seen by doctor) go notify-only; only the supervisor stops a lead (the
owner through Miu/questions).

## Owner direction, round 5 (2026-11-18)

"cần phải hiểu multica là projection. mỗi plan có thể là 1 task lớn, mối phase là task nhỏ. chúng ta thậm chí là một
loại runtime của nó hoặc chúng ta chạy bên trong runtime của multica"

Shaper reading, three directions the design must allow without rework:
1. **Projection**: plan → parent task, phase → sub-task, lead/worker → assignee, five-part question → comment +
   blocked. One-way from portfolio truth (D-ADR0079); a UI acts back only through the command port.
2. **fgOS as a runtime of the UI**: the UI assigns a task; its daemon calls an fgOS entry that runs a plan (lead) or one
   phase. Needs: a phase runnable cold by one command (plan + phase id → worker run, lane door applies), and the
   admission authority as a port: `internal` (our supervisor picks) or `external` (the UI's assignment admits; the
   supervisor still arbitrates lanes, reclaims and closes).
3. **fgOS inside the UI's runtime**: the UI's daemon hosts our sessions; that is a Session Host placement adapter
   (confinement must still hold).
Stable plan and phase ids plus the status vocabulary are the shared contract for all three; mapping tables belong to
each adapter (the UI owns its data).

## Round 6 (2026-11-18)

- Owner: the multica integration idea and the six ports are their own draft plan
  (`plans/261118-1117-external-ui-integration-multica/plan.md`). The supervisor plan focuses on fgOS coordinating
  its own plans.
- Handed over from ops-metrics (owner, 2026-11-18): who starts the planner once a discussion is settled. The rule
  stands (a separate planner writes the plan). The supervisor plan adds the enforcement: (1) wake trigger
  `discussion-settled` on a declared kind `fgos.discussion.status`, so the supervisor starts a planner session;
  (2) the shaper brief template drops "shaper writes the plan"; (3) the no-item planning door is
  fgos-coding-planning with a no-item path on plan-contract (ak-plan is AgentKit, not shipped to fgOS projects).
  Applied to this shaping too: a separate planner writes the supervisor plan.

## Round 7: Q2 answered (2026-11-18): i-a and ii-a

Lanes are worker seats pooled per machine. A lead takes no lane, and its own ceiling is `supervisor.maxLeads`
(default = the lane count). A wave short of lanes starts the phases that fit and the rest as lanes free up, with no
reservation.

## SETTLED DESIGN: the planner's input (supersedes the earlier rounds where they differ)

Outcome: fgOS coordinates the plans it manages with no person sitting by: it admits ready plans by priority within a
lane pool, starts a lead per plan, handles a gone or stuck lead, closes plans, and starts a planner when a discussion
settles. It asks the owner only through batched five-part questions.

1. **Watcher**: a no-LLM Rust process run by a third per-project OS timer schedule in
   `packages/distribution/rust/src/timer.rs` (same template as `mailbox-sync`/`account-probe`, doctor row included).
   Each tick runs the detection definitions through `fgos metrics query --def <file> --since <last tick>`, records
   each raised event once as an Event Store fact, and runs the actions configured per row kind (config table:
   `wake-supervisor` by default, `notify` through a notifier adapter, mailbox first). It emits span
   `fgos.watcher.tick`. Pace: an active interval while a plan runs or a lead is placed, an idle interval otherwise
   (config). It never decides, starts or stops anything.
2. **Wake triggers** (row kinds): this plan defines `plan-became-ready`, `plan-done`, `plan-priority-changed`
   (on `fgos.plan.status`), `lane-freed` (on `fgos.run.attempt` endTs), `lead-ended` (`fgos.head.state retired`),
   `discussion-settled` (new kind `fgos.discussion.status`, produced when a DISCUSSION.md marker flips). Ops-metrics
   defines `head-gone` and `plan-no-progress`. Notify-only kinds: supervisor wake failed N times. Doctor's timer row
   watches the watcher.
3. **Supervisor**: an LLM head session `fgos session start supervisor`, woken by the watcher's single door
   `fgos supervisor wake --trigger <kind> --ref <id>`. If a supervisor is alive, the event is delivered to it;
   otherwise one is started. It takes holder-lock (one per project), drains unhandled events (marks them handled),
   emits span `fgos.supervisor.wake`, and exits. Its duties:
   - Admit: plans whose `status: ready` and `blockedBy` are all done, ordered by `priority` then `created`, while
     leads < maxLeads and a lane is free. Mark the plan `running`.
   - Start a lead with `fgos session start lead --name <plan-slug>`.
   - Gone/stuck lead: restart from the phase table, park, or raise a question. Only the supervisor stops a lead.
   - Close: the plan is `done`, so add a board line.
   - `discussion-settled`: start a planner session.
   It never implements, reviews, lands or chats with the owner.
4. **Lead**: a confined head session of a new persona `lead`. Grant: the plan's footprint as writes, plus request
   verbs for what must run outside the sandbox (worktree create, `fgos run` per phase, `fgos land`). It drives one
   plan's waves, reviews each phase, lands, updates the phase table, and sets the plan `done` or parks it. Persona
   grants for `supervisor` and `planner` are added in the same grant table.
5. **Landing door**: a new Rust verb `fgos land <branch>`. It holds holder-lock `land` to serialize; rebases;
   regenerates generated files (census last); runs the gate (architecture, census, doc-health, citation-drift,
   cargo fmt for Rust diffs, the plan's tests outside the sandbox); pushes; prints the main SHA. It retires
   `.fgos/runtime/tmp/land-branch.sh` and the hand census fix (p-t55xjys4u5, p-dkkodseo63).
6. **Lane pool**: reuse `workerSlots.ceiling` and `fgos slots`, but count live worker seats per machine, not Work
   items. Default 4. Enforced at seat start in `fgos run` / the run supervisor (a lead cannot overrun it).
7. **Portfolio source**: plan frontmatter only (plan-contract, `scripts/plan-contract-check.mjs`). No Work items, no
   record files, no generated board. Miu reorders by editing `priority`.
8. **Planner door**: fgos-coding-planning gains a no-item path on plan-contract. The shaper brief template (fgos-shaping
   / secretary skill) drops "shaper writes the plan".
9. **Observe kinds** declared in this plan's own `observe-kinds.json`: `fgos.watcher.tick`, `fgos.supervisor.wake`,
   `fgos.discussion.status` (shapes in shape/ops-metrics DISCUSSION.md §6.0.1/§6 E).
10. New code in Rust where possible and non-disruptive.

Dependencies: 261117-1856-secretary-session-spine (head start, grants, request socket); 261118-0947-session-verb-
for-agent-sessions (`fgos session start` name); 261118-0936-ops-metrics phases 1 and 4 (watcher/wake producers),
6 (run span), 8 (plan/head events, trigger definitions), 10 (head-gone, plan-no-progress).
Non-goals: the Work layer; external UI integration (plan 261118-1117); defining liveness detections (ops-metrics);
alert channels beyond the mailbox notifier; automatic code review beyond the lead's brief.

## Ops-metrics phase renumbering (2026-11-18, after its validation; 16 phases)

Waits now: watcher/wake producers on ops-metrics phases 4 (write door) and 7 (`fgos metrics record|query|--def`);
trigger definitions on 8 (`fgos.run.attempt`) and 11 (`fgos.head.state`, `fgos.plan.status`); attention definitions
from 14 (`core/attention/definitions/`, key `dispatch.attention.planNoProgressMinutes`). Own kinds: crate-embedded
(`include_str!`) and injected in `apps/fgos/src/wiring/observe_declarations.rs`, or JSON under
`core|domains/**/observe/kinds/`, never loaded from `packages/`. Phase 5 proves the grammar covers watcher-overdue,
supervisor-idle-burn and lane-freed. Forwarded to the planner.

## Round 8 (2026-11-18): who plans

Owner rule: shapers stop at `discussion: settled` and hand over to the secretary (lead:HARDEN), and the secretary
starts the planner. The planner run this shaper had started was stopped; what it wrote is draft input only. Point 8
of the settled design changes: the shaper brief template fix moved to the secretary. This plan keeps the long-term
mechanism: the `discussion-settled` trigger (the supervisor starts a planner) and the no-item path in
fgos-coding-planning.
