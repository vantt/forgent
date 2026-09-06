# Upstream Beegog Herding Mechanism — Rust Implementation Distillation

## 1. Exact Herdr CLI Calls and Prompt Delivery

**Pane and Agent Lifecycle CLI:**
- `herdr pane current --current` → reads caller's pane id (herding_run.rs:635)
- `herdr pane layout --pane <id>` → reads all panes in tab with rect geometry (herding_run.rs:645, extracts `result.layout.panes[]`)
- `herdr pane split <id> --direction <dir> --ratio <r> --cwd <cwd> --no-focus` → splits pane, returns `result.pane.pane_id` (herding_run.rs:649-661)
- `herdr tab create --workspace <ws> --cwd <cwd> --label <label> --no-focus` → creates new tab, returns `result.root_pane.pane_id` (herding_run.rs:664-668)
- `herdr agent start <job_id> --kind <kind> --pane <pane_id> --timeout 60000 -- <args...>` → spawns agent (herding_run.rs:697-704); **prompt is NOT argv** (herding_run.rs:471-475, herding-brief-file D1)
- `herdr pane run <pane_id> <command>` → executes one shell command, used for per-agent env exports only (herding_run.rs:671-689), carries no retry on busy shell
- `herdr agent list` → polling agent status, returns `result.agents[]` with fields: name, pane_id, agent_status (herding_run.rs:708-714)
- `herdr pane close <pane_id>` → cleanup pane (herding_run.rs:717-718)

**Prompt Delivery and Continuation:**
- **Multi-line brief**: written to disk as `.bee/mailbox/<job-id>/brief-N.txt` (herding_mailbox.rs:75-76), worker-readable absolute path
- **One-line pointer prompt**: `"Read the file <abs_path> and follow its instructions exactly."` (herding_mailbox.rs:84-88)
- **Delivery mechanism**: `herdr agent prompt <job_id> <prompt> --wait --until <state> --timeout <ms>` (herding_run.rs:721-725); `--wait` is herdr's own atomic submit-and-observe, returns `agent_prompt_stalled` on no lifecycle change (herding_run.rs:492-504)
- **Newline handling**: single Enter embedded in prompt text is never used; newlines travel in the file, not the argv (herding-brief-file D1: live failure agy with multi-line argv lost the brief entirely)
- **Ack file**: worker writes `ack-N.json` first, before any work (herding_mailbox.rs:306-325), contains `{nickname, job_id, round, agent, received_at, [cell_id]}`; proof brief was read, not proof round is done

**Status Polling:**
- `herdr agent wait <job_id> --until idle --until done --timeout <ms>` → herdr's settle-aware wait, blocks herdr-side up to timeout_ms, returns best observed status (herding_run.rs:727-733)
- `herdr pane list` → membership-tested for pane existence (herding_run.rs:735-754), fails CLOSED (not alive) on any error
- `herdr pane read <pane_id>` → raw scrollback capture, used for screen classification (herding_run.rs:756-767)
- `herdr pane process-info --pane <id>` → returns shell_pid and foreground_processes[].pid, liveness check (herding_run.rs:769-804)

**Cockpit-Only (herding_pane_verbs.rs):**
- `herdr pane send-text <pane> <text>` → types text into pane (herding_pane_verbs.rs:259-260)
- `herdr pane rename <pane> [--label <label>]` → set pane label
- `herdr pane list [--workspace <ws>] [--with-status]` → cockpit row listing (herding_pane_verbs.rs, CockpitTransport)

---

## 2. Ready-Wait State Machine

**Startup False-Idle Prevention:**
The screen classifier (src_screen.rs:125-133) uses marker-based detection over the last N non-empty lines:
- **Busy markers** (BUSY_TAIL_LINES=2): "esc to interrupt", "esc to cancel", "ctrl+c to interrupt", "press esc to" — agent is mid-turn (src_screen.rs:69-77)
- **Blocked markers** (BLOCKED_TAIL_LINES=12): "do you trust", "trust the files", "paste your api key", "press enter to submit" — dialog waiting for human (src_screen.rs:78-86)
- **Blocked beats Busy** always: dialog frequently renders with busy footer still on screen (src_screen.rs:118-133)
- Matching is case-insensitive substring containment; empty lines are skipped from the tail window (src_screen.rs:135-142)
- **No Done variant**: screen never reports done; result file is the only truth (src_screen.rs:14-17)

**Poll Loop Timing (herding_run.rs:1087-1115):**
```
decide_poll(now_ms, started_at_ms, last_heartbeat_ms, idle_timeout_secs, ceiling_secs, result_ready):
  1. if result_ready → ResultReady (exit)
  2. if now - started_at ≥ ceiling_secs → TimedOutCeiling (hard cap)
  3. if liveness_died (pid gone) → Died
  4. if now - last_heartbeat_ms ≥ idle_timeout_secs:
     - check pane text for usage limit patterns → PausedLimit if found
     - else → TimedOutIdle
  5. else → Continue
```
Default timeouts: `idle_timeout_secs=900` (15 min), `ceiling_secs=21600` (6 hours) (herding_run.rs:66-68)

**Heartbeat Sources (herding_run.rs:1161-1162):**
- Fresh heartbeat: ack-N.json presence, log.txt mtime, activity.json recency (<120s), any blocks fresh-activity-state report
- Heartbeat check: `observed.heartbeat_fresh` marks last_heartbeat_ms ← now (herding_run.rs:1161-1162)
- Activity parse: `parse_activity_text` (herding_mailbox.rs:192-216) — round-fenced (≥ current_round), timestamp-gated (≤ ACTIVITY_FRESHNESS_SECS), state vocabulary: working, waiting_input, blocked, idle, exited

**Poll Interval:** POLL_INTERVAL = 200ms (herding_run.rs:68)

---

## 3. Signal Ladder — Outcome Detection

**Enum PollDecision (herding_run.rs, type returned by decide_poll):**

| Outcome | Evidence Chain | Pane Lifecycle | Diagnosis |
|---------|---|---|---|
| **ResultReady** | result-N.json presence (herding_run.rs:1097-1098) | CLOSE (D6, valid result) | Work proved done by mailbox file |
| **Blocked** | herdr `agent_status blocked` + no result (herding_run.rs:1158-1159) | KEEP OPEN | Human must answer dialog (transport D3) |
| **Died** | process_info foreground_processes empty (herding_run.rs:1103-1104) | CLOSE | Agent process exited abnormally |
| **PausedLimit** | idle timeout + pane text contains "hit your session limit" or "usage limit" (herding_run.rs:1108-1110, LIMIT_PATTERNS) | CLOSE | Usage limit pause detected |
| **TimedOutIdle** | last_heartbeat_ms > idle_timeout_secs, no limit pattern (herding_run.rs:1106-1112) | KEEP OPEN | Stale heartbeat; diagnosis scans pane for prompt patterns (PROMPT_DIAGNOSIS_PATTERNS: "y/n", "↑/↓", "❯", line ending in "?") |
| **TimedOutCeiling** | now - started_at ≥ ceiling_secs (herding_run.rs:1100-1101) | KEEP OPEN | Hard wall-clock cap regardless of activity |
| **Continue** | none of above (herding_run.rs:1114) | KEEP POLLING | Next tick in 200ms |

**Pane Lifecycle Rule (herding_run.rs:1120-1122):**
```rust
should_close_pane(valid_result, close_always):
  close_always || valid_result
  // valid_result = (MailboxResult parsed and well-formed)
```
D6: valid result closes the pane; timeout/failure/blocked leaves it open as forensics; `--close-always` overrides every outcome.

---

## 4. Mailbox Directory Layout and Schemas

**Path Layout (herding_mailbox.rs:56-132):**
```
.bee/mailbox/<job-id>/
  job.json          ← job spec (written by orchestrator, not bee-ignorant worker)
  ack-N.json        ← round N delivery receipt (worker's FIRST step, tmp-rename)
  result-N.json     ← round N final result (worker, tmp-rename, appearance = done signal)
  report-N.md       ← round N report (worker, tmp-rename, written BEFORE result)
  brief-N.txt       ← round N task brief (orchestrator writes once)
  log.txt           ← worker's append-only log (read for heartbeat)
  activity.json     ← single agent-reported state record (tmp-rename, round-fenced)
```

**Ack Schema (herding_mailbox.rs:316-323, rendered inline in brief):**
```json
{
  "nickname": "<who_am_i>",
  "cell_id": "<cell_id>",  // OPTIONAL, omitted when None
  "job_id": "<job-id>",
  "round": 1,
  "agent": "<agent_self_name>",
  "received_at": "2026-01-01T00:00:00Z"
}
```

**Result Schema (herding_mailbox.rs:365-394):**
```json
{
  "status": "done" | "blocked",
  "summary": "<one-line summary>",
  "files_changed": ["<path>", "..."],
  "proof": "<command or evidence>",
  "report_path": "<report-file-path>",  // OPTIONAL
  "options": ["<way forward>", "..."],  // OPTIONAL (StopAndAsk D3)
  "leaning": "<one option word-for-word>",  // OPTIONAL
  "dissent": {  // OPTIONAL (slp-followup-gaps D3)
    "claim": "<what's wrong>",
    "alternative": "<what I'd do>",
    "severity": "blocker" | "consider"
  }
}
```
Parse rules: all optional fields default to absent; `options`/`leaning`/`dissent` never fail a round if absent or wrong-typed (lenient parse, herding_mailbox.rs:613-628).

**Activity Schema (herding_mailbox.rs:150-159, 192-216):**
```json
{
  "round": 1,
  "at": "2026-01-01T00:00:00Z",
  "state": "working" | "waiting_input" | "blocked" | "idle" | "exited"
}
```
Freshness gate: at most 120s old (ACTIVITY_FRESHNESS_SECS, herding_mailbox.rs:168); round must be ≥ current_round (fence).

**Round Semantics:**
- N is explicit in the brief the worker reads (herding_mailbox.rs:342-344)
- Worker writes ack-N, report-N, result-N for this round only (herding_mailbox.rs:75-101)
- Highest result-N.json in mailbox is the latest round (select_latest_round, herding_mailbox.rs:534-536)
- A re-briefed worker on round 2 never collides with round 1's files (herding_mailbox.rs:23-26)

**Atomic Write Gesture (herding_mailbox.rs:386-394):**
```
Write to {mailbox}/{result-N.tmp}
RENAME {mailbox}/{result-N.tmp} → {mailbox}/result-N.json
```
Result file's appearance at final name IS the done signal; a partial write at final name is read as finished result.

---

## 5. Liveness and Activity Tracking

**Heartbeat Sources (in priority order, herding_run.rs:1155-1162):**
1. **Ack file presence**: ack-N.json EXACT filename match (herding_mailbox.rs:545-548)
2. **Result file presence**: result-N.json EXACT filename match (herding_mailbox.rs:525-556)
3. **Activity.json freshness**: parse_activity_text (herding_mailbox.rs:192-216) returns state only if:
   - Valid JSON object with round, at, state fields
   - round ≥ current_round (fence against earlier rounds)
   - at timestamp ≤ 120s old (ACTIVITY_FRESHNESS_SECS)
   - state is in known vocabulary (no guesses)
4. **Log.txt mtime**: log file modification time checked as heartbeat signal (herding_run.rs:30, "log.txt mtime")

**Dead Detection (herding_run.rs:1103-1104, 1164-1182):**
- Process liveness: `herdr pane process-info --pane <id>` → parse_process_info (herding_run.rs:778-804)
  - Shell PID: `process_info.shell_pid`
  - Foreground processes: `process_info.foreground_processes[].pid`
  - Agent present: any foreground pid ≠ shell_pid (never name match)
  - Liveness::Alive{pid} if agent present, Liveness::Absent if not, Liveness::Unknown on parse failure
- Pane presence: `herdr pane list` membership test (herding_run.rs:735-754), fails CLOSED (not alive) on any error
- Observed.liveness enum (herding_run.rs:1131): Alive{pid}, Absent, Unknown
- Absent reads = counter(absent_reads); past 3 consecutive reads, return Died (herding_run.rs:1164-1180)

**Usage Limit Detection (herding_run.rs:70-84):**
```rust
LIMIT_PATTERNS = ["hit your session limit", "usage limit"]  // case-insensitive
find_limit_match(pane_text):
  for line in pane_text.lines():
    for pattern in LIMIT_PATTERNS:
      if line.to_lowercase().contains(pattern.to_lowercase()):
        return Some(line.trim())
  return None
```

---

## 6. Identity and Pane Lifecycle Across Restart

**Pane ID Assignment (herding_run.rs:649-661):**
- Split result includes new pane_id in `result.pane.pane_id`
- Tab create result includes root pane in `result.root_pane.pane_id`
- Pane ID is opaque string in format like "w4:p4" (workspace:pane)

**Split Lock Serialization (herding_split_lock.rs):**
```
Lock file: <main_root>/.bee/locks/herding-pane-split.lock
Holder JSON: {"pid": <u32>, "ts": <i64_ms>, "token": "<random>", "job_id": "<job>"}
Acquire: create_new + AlreadyExists pattern (atomic), retries every 50ms up to wait budget
Stale takeover: soft window 30s (dead pid), hard ceiling 3600s (any holder)
Release: Drop impl removes file only if pid + token still match (prevents racer from deleting foreign holder)
```
Purpose: serialize concurrent `bee herding run` pane split operations across OS processes (herding_split_lock.rs:1-9).

**Wave Ledger (herding_wave_ledger.rs):**
```
File: <main_root>/.bee/wave-ledger.jsonl (append-only JSONL)
Per-worker record: name, pane_id, worktree, task, outcome (null while running), evidence (proof path)
Occupancy: live_worker_count(root, live_panes, now, stale_after_ms)
  - With live_panes: count unresolved workers whose pane_id ∈ live_panes (correct at any age)
  - Without live_panes: Fallback to DEFAULT_STALE_AFTER_MS (60 min) timer, report as Occupancy::Fallback
Wave fold: same wave_id appearing multiple times → later row supersedes (read-time only, disk untouched)
```
No single pane restart check; identity is the pane_id returned from herdr split/tab-create.

---

## 7. Backend Abstraction Traits

**PaneTransport Trait (herding_run.rs:420-535):**
Minimal method set for phase 1 (herding run):
- `pane_current()` → pane id caller is in
- `pane_layout(pane_id)` → Vec<PaneGeom> (geometry of all panes in tab)
- `pane_split(id, dir, ratio, cwd)` → new pane_id
- `tab_create(workspace, cwd, label)` → root pane_id
- `pane_run(pane_id, cmd)` → Result (no JSON return)
- `agent_start(job_id, kind, pane_id, args)` → Result
- `agent_status(job_id)` → Option<String> (from agent_list result)
- `pane_close(pane_id)` → Result
- `agent_prompt(job_id, prompt, until, timeout_ms)` → Result
- `agent_wait(job_id, timeout_ms)` → Option<String> (settled status)
- `pane_alive(pane_id)` → bool (membership test in pane list)
- `pane_read(pane_id)` → String (scrollback capture)
- `process_info(pane_id)` → Liveness (Alive/Absent/Unknown)
- `name()` → &'static str (returns "herdr", overridden by TmuxBackend to "tmux")

**CockpitTransport Trait (herding_pane_verbs.rs:110-155):**
Built on PaneTransport, adds 6 cockpit-specific operations:
- `pane_send_text(pane, text)` → Result (types text into pane)
- `pane_rename(pane, label: Option)` → Result (set/clear label)
- `pane_list(workspace: Option)` → Vec<PaneRow> (all panes with status/cwd/agent fields)
- `tab_list(workspace: Option)` → Vec<TabRow> (all tabs)
- `tab_focus(tab)` → Result (bring tab to front)
- `pane_context()` → PaneContext (caller's own pane/tab/workspace)
- `pane_status(pane)` → Option<String> (default None; herdr returns None, tmux screens classify)
- `pane_id_by_label(label)` → Option<String> (helper, finds pane by label)

**Fake Backends (for testing):**
- FakeBackend (src_backend.rs): test seam with no running herdr/tmux
- FakeCockpit (herding_pane_verbs.rs): cockpit-level fake with scripted responses
- Test uses: ExitCode, exit-0/exit-1 JSON envelopes, no real process spawning

---

## 8. Contact, Interrupt, Failure, and Forensics

**Follow-Up Messaging (herding_run.rs:492-504, herding-prompt-stall D1/D3):**
- `herdr agent prompt <job_id> <prompt> --wait --until <state> --timeout <ms>`
- Used in `--continue` path (retried brief delivery) after an agent becomes ready again
- `--wait` is herdr's atomic submit-and-observe; stall means no lifecycle change observed within timeout_ms
- Stalls no longer end the run (D6, hps-14); folded into bounded resend like ready-with-no-ack path

**Pane Cleanup (herding_run.rs:34-36, 1120-1122):**
- Valid result: close pane (proof it worked)
- Timeout/failure: keep pane open as forensics (human can inspect)
- `--close-always` flag: close on every outcome

**Failure and Forensics Policy (herding_run.rs:27-36):**
- Start failure closes the pane it just created (role-dispatch.md §8's cleanup rule)
- Invalid result: pane stays open, caller reads the mailbox error (NotJson, MissingField, InvalidStatus, etc.)
- Timeout: pane stays open with last screen capture for diagnosis
- Diagnosis-only patterns (PROMPT_DIAGNOSIS_PATTERNS): never used to DECIDE waiting, only to EXPLAIN after giving up
  - Short tokens: "y/n", "↑/↓", "❯" (survives narrow pane clipping)
  - Lines ending in "?"

**No Built-In Interrupt/Cancel:**
- Pane can be closed with `herdr pane close` (best-effort cleanup)
- Worker reads `--continue` circuit breaker via `--idle-timeout` and `--ceiling` logic
- No explicit SIGTERM/SIGKILL to the pane itself in the run.rs phase; cockpit roles may do it separately

---

## Key Differences from fgOS herdr-spawn Adapter

| Aspect | Beegog | fgOS Known Gap |
|--------|--------|---|
| **Brief delivery** | Multi-line file + one-line pointer prompt (herdr agent prompt) | Attempts multi-line argv → agy loses brief |
| **Ack file** | Explicit ack-N.json before any work (proof brief read) | No readiness handshake |
| **Activity hook** | Agent writes activity.json (round-fenced, freshness-gated, state vocabulary) | Fallback screen classifier only |
| **Prompt resubmission** | `agent prompt --wait` detects stall, folds into bounded resend | No resend logic; false idle at startup |
| **Heartbeat** | Log mtime + ack + activity + screen (multiple signals) | Polling agent_status (sawWorking gate insufficient) |
| **Blocked handling** | Herdr's own `agent_status blocked` check (D3) | Guess from screen (unreliable) |
| **False idle recovery** | Screen classifier avoids it via busy/blocked marker lists | Relies on 3× 500ms polls |
| **Pane persistence** | Split lock serializes, wave ledger tracks occupancy | No coordination across concurrent runs |
| **Close decision** | Valid result closes; timeout/failure keeps open (D6 forensics) | Closes on every outcome (loses debug info) |

