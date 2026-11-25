# Diagnosis Report: Cause of Missing Lead-Ended Event on 2026-11-23

## Outcome & Named Cause

This diagnosis identifies the root cause of why `fgos supervisor queue` remained empty after two leads completed phases at 19:29 on 2026-11-23 (described in `plans/backlog/p-iatzcg2gee-a-lead-that-finishes-raises-no-event-so-nobody-checks-its-result.md`).

**Root Cause:**
**Candidate (a) from `plans/261124-2143-head-lifecycle-events/plan.md` ("Prior art"): A finished lead stays live and idle, so no `retiredAt` is set on its placement, and `fgos.head.state` projects `live`, not `retired`.**

Because the lead processes remained alive in their terminal sessions (tmux) waiting between waves or measuring, and neither lead had been stopped via `fgos session stop`, their placements had no `retiredAt` attribute. The observe projection `head_state.rs` (`fgos.head.state`) maps a placed head to `"retired"` *only* when `retiredAt` is present in `placement.json`; otherwise it queries Session Host `alive()`, which answered `live`. Because `core/watcher/definitions/lead-ended.query.json` explicitly requires `fgos.head.state == "retired"`, the query matched 0 rows, and no `lead-ended` event was raised on the supervision queue.

Candidate (b) (window drop due to `startedAt` older than 24h) and Candidate (c) (unplaced short-role head) did not cause this failure: both leads were placed within <12 hours, and both had standard `head:lead-*` placements.

---

## 1. Identification of the Two Leads at 19:29 on 2026-11-23

From git commit history and `.fgos/runtime/session-rotation/`:

### Lead 1
- **Plan Directory**: `plans/261121-2110-component-authority-doors`
- **Role**: `head:lead-forgent-261121-2110-compon-e8af7` (role prefix `head:lead-*`)
- **Head Name / Attempt**: `head-lead-forgent-261121-2110-compon-e8af7-1` (Generation 1, run `01`, attempt ID `cmd_1795396671694_e6893104`)
- **Git Activity around 19:29 (UTC+7)**:
  - Commit `c3125be3b` (2026-11-23 19:26:44 +0700): `land component-authority-doors/p3a`
  - Commit `21a11c83a` (2026-11-23 19:29:12 +0700): `docs(plan): component-authority-doors 2c, 2e and 3a landed after the git recover`
  - At 19:38, the lead announced the next wave (2d, 2a, 2b, 4, 5) but then sat idle with no active unit running.

### Lead 2
- **Plan Directory**: `plans/261122-0118-heads-stable-and-able`
- **Role**: `head:lead-forgent-261122-0118-heads-b52f9` (role prefix `head:lead-*`)
- **Head Name / Attempt**: `head-lead-forgent-261122-0118-heads-b52f9-10` (Generation 10, run `01`, attempt ID `cmd_1795429569062_b7e851d4`)
- **Git Activity around 19:29 (UTC+7)**:
  - Commit `9e08e629e` (2026-11-23 19:21:57 +0700): `docs(plan): heads-stable phase 13 built and reviewed, land waited on another writer's interrupted land`
  - Commit `5ebc25616` (2026-11-23 19:32:19 +0700): `land heads-stable-and-able/p13b`
  - Commit `abb38cfac` (2026-11-23 19:34:33 +0700): `docs(plan): heads-stable phase 13 done, backlog-index write grant landed`
  - Phases 8 and 10 were in an external measurement window until 21:06; the lead was waiting and idle.

---

## 2. Lead Evidence & State Analysis at 19:30 (2026-11-23 12:30 UTC)

### Evidence for Lead 1 (`261121-2110-component-authority-doors`)
- **Placement**: `/home/vantt/projects/forgent/.fgos/runtime/session-rotation/lead-forgent-261121-2110-compon-e8af7/placement.json` existed on disk.
- **Role Form**: `head:lead-forgent-261121-2110-compon-e8af7` (standard `head:lead-*` form).
- **`startedAt`**: `2026-11-23T01:17:51.694Z` (08:17:51 UTC+7).
- **`retiredAt` at 19:30**: **Not set**. Gen 1 had no `retiredAt`. The lineage was only retired on generation 4 on `2026-11-24T14:32:49.273Z` (commit `9a0b8b0bf`).
- **`closed.json` at 19:30**: **Did not exist**. Gen 1 run 01 was only closed at `2026-11-23T16:34:30.206Z` (23:34:30 UTC+7) during a subsequent rotation (`head-lead-forgent-261121-2110-compon-e8af7-1/runs/01/closed.json`).
- **Session Host Liveness**: `Liveness::Live`. The tmux pane remained active (confirmed by supervisor wake report `plans/reports/report-261123-1952-supervisor-wake.md`: "the lead is working again (screen shows 'esc to interrupt')").
- **`fgos.head.state` Projection at 19:30**: Evaluated to `"live"`.

### Evidence for Lead 2 (`261122-0118-heads-stable-and-able`)
- **Placement**: `/home/vantt/projects/forgent/.fgos/runtime/session-rotation/lead-forgent-261122-0118-heads-b52f9/placement.json` existed on disk.
- **Role Form**: `head:lead-forgent-261122-0118-heads-b52f9` (standard `head:lead-*` form).
- **`startedAt`**: `2026-11-23T10:26:09Z` (17:26:09 UTC+7).
- **`retiredAt` at 19:30**: **Not set**. Gen 10 had no `retiredAt`. The lineage was only retired on generation 13 on `2026-11-23T19:20:21.480Z` (02:20:21 UTC+7 on 2026-11-24) when closed by owner order (commit `a6d606828`).
- **`closed.json` at 19:30**: **Did not exist**. Gen 10 run 01 was only closed at `2026-11-23T15:31:23.506Z` (22:31:23 UTC+7) during rotation (`head-lead-forgent-261122-0118-heads-b52f9-10/runs/01/closed.json`).
- **Session Host Liveness**: `Liveness::Live`. The terminal session was active in external wait.
- **`fgos.head.state` Projection at 19:30**: Evaluated to `"live"`.

---

## 3. Observe Definitions Execution (`lead-ended`, `session-gone`, `head-gone`)

Running `fgos metrics query --def <definition>` against this state (reproduced with `--until "2026-11-23T12:35:00Z"`):

1. **`core/watcher/definitions/lead-ended.query.json`**:
   - Query filter: `fgos.head.state == "retired"` AND `fgos.head.role` prefix in `["head:lead-", "lead:"]`.
   - Result: **0 rows** for both leads. Because `retiredAt` was absent on both placements, `head_state.rs` projected `state: "live"`.
   - Window retention: The caller window was `since = now - lookbackSec (86400s)`. If `lead-ended` had produced a row stamped with 19:29 (`12:29 UTC`), `12:29 UTC` was well inside `since = 2026-11-22T12:30:00Z` and would have been retained. The failure was not a window drop, but zero matching rows.

2. **`core/watcher/definitions/session-gone.query.json`**:
   - Query filter: `fgos.head.state == "gone"` with `having count > watcher.sessionGoneLimit`.
   - Result: **0 rows**. Neither lead was `gone`.

3. **`core/attention/definitions/head-gone.query.json`**:
   - Query filter: `latest_per: "subject"` with `where_latest: state == "gone"`.
   - Result: **0 rows**. Neither lead was `gone`.

---

## 4. Watcher Ticks and Supervision Event Log on 2026-11-23

Observation records under `.fgos/observe/records/pid-*.jsonl` and Event Store records in `.git/fgos/events/project/` show:

1. **Watcher Ticks between 19:20 and 19:55 UTC+7 (12:20 to 12:55 UTC)**:
   - `2026-11-23T12:20:13.888Z`: `raised: 0`, `duplicate: 236`
   - `2026-11-23T12:25:56.550Z`: `raised: 0`, `duplicate: 235`
   - `2026-11-23T12:30:09.112Z`: `raised: 0`, `duplicate: 235`
   - `2026-11-23T12:34:08.242Z`: `raised: 0`, `duplicate: 234`
   - `2026-11-23T12:39:03.714Z`: `raised: 0`, `duplicate: 234`
   - `2026-11-23T12:41:50.475Z`: `raised: 1` (event `89430b3b9a067481` for `q-ec5bdhkwoz` question answered)
   No `lead-ended` row was raised across any tick.

2. **Supervision Event Queue (`project` stream)**:
   - No `lead-ended` event was ever raised on the queue that evening.
   - The supervisor queue remained empty of lead completion events.
   - At `2026-11-23T12:50:24.665Z` (seq 4517), Miu manually raised coordination-chore `9a1a2d0fd7701329`:
     `"Owner reports two leads finished at 19:29 and nobody has checked. Read their results, handle them, and admit ready plan 261123-0828-head-stop-rotation-bad-measure if a lead slot is now free."`
   - The supervisor woke at 19:52 (commit `14c913077`, `plans/reports/report-261123-1952-supervisor-wake.md`). It inspected both leads, found both live (`leadsLive: 2`), and was forced to hold plan `261123-0828` because `leadsLive == maxLeads (2)`.
   - **Verdict**: The event was **never raised**. It was neither dropped by a window filter nor discarded as a capacity kind.

---

## 5. Architectural Confirmation & Guidance for Phase 2

Because the observed root cause matches **Candidate (a)**, the strategy defined in `plans/261124-2143-head-lifecycle-events/plan.md` and `phase-02-host-end-signal.md` is validated without needing structural redesign:

1. **Host-Side Attempt End Signal (`phase-02-host-end-signal.md`)**:
   - In `apps/fgos/src/wiring/observe_sources/head_state.rs`, when `retiredAt` is absent, inspect `runDir/closed.json`.
   - If `closed.json` exists with a valid `at`, project state `"ended"` with `ts = at` (without consulting Session Host).
   - In `core/watcher/definitions/lead-ended.query.json`, allow `fgos.head.state` to match either `"retired"` or `"ended"`.
   - Register `"ended"` in `apps/fgos/observe-kinds.json`.

2. **Complementary Plan Completion Auto-Close (`phase-03-close-finished-heads.md`)**:
   - Even with `ended`, a finished lead whose process is still idling in its terminal does not write `closed.json` until its session terminates.
   - Therefore, Phase 3's addition to the supervisor wake door (stopping an idle lead whose plan is `done`, and stopping a planner when its plan lands as `draft`/`ready`) completes the lifecycle by actively invoking `session stop` to write `retiredAt`.

No changes to Phase 2 inputs or sequence are required. Phase 2 can proceed as planned.
