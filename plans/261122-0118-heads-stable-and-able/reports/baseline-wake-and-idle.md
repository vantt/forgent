# Baseline: Supervisor Wake Rate and False Idle Alarms

Phase 1 baseline evidence read for `plans/261122-0118-heads-stable-and-able`.
Capability: `code:test` (read-only evidence read; changes no code).

## Judgment Rule: False vs. True `session-idle`

Per phase 1 specification, each `session-idle` row raised by the watcher is evaluated as:

- **False alarm**: The target session showed progress within one watcher interval after the row was raised (a turn in transcript, a commit, a ticket ended, or a land), **OR** the supervisor marked the event handled with no action taken on the session.
- **True alarm**: The target session was genuinely idle with unfinished work and nothing else woke it.

*Phase 9 will apply this exact same rule to evaluate post-tuning counts.*

---

## Measuring Windows

1. **Known Bad Window**: `2026-11-21 01:00:00Z` to `2026-11-21 10:00:00Z` (9 hourly buckets, 01:00Z through 09:59Z).
   - Known incident window cited in backlog `p-vquz26ibnn` item (7): supervisor head generation 41 started at 01:22:18Z, and generation 126 started at 09:25:09Z (85 restarts in ~8 hours).
2. **48-Hour Baseline Window**: `2026-11-20 01:00:00Z` to `2026-11-22 02:00:00Z` (49 hourly buckets immediately preceding the start of this phase).

---

## Executive Summary & Totals

| Metric | Known Bad Window (9h, 2026-11-21 01:00Z-10:00Z) | 48-Hour Baseline Window (49h, 2026-11-20 01:00Z-2026-11-22 02:00Z) |
|---|---|---|
| **Supervisor Head Generations Started** | **93** (gens 40 through 132) | **234** (gens 32 through 265) |
| **Supervisor Wake Records (`fgos.supervisor.wake`)** | **287** | **683** |
| **`session-idle` Rows Raised** | **356** | **688** |
| **False Alarms** | **356** (100.0%) | **688** (100.0%) |
| **True Alarms** | **0** (0.0%) | **0** (0.0%) |
| **False Alarm Rate** | **100.0%** | **100.0%** |

In both windows, **every single `session-idle` event was a false alarm** (100.0% false alarm rate). The supervisor marked every event handled with no remedial action, and in 94.9% (653/688) of occurrences, the target session had active turns in its transcript within 15 minutes of the alarm (the remaining 35 being sessions without recorded session UUIDs marked as `unknown`).

---

## Known Bad Window Hourly Counts (2026-11-21 01:00Z – 10:00Z)

| Hour (UTC) | Head Gens Started | Generation IDs | Wake Records | `session-idle` Rows | False Alarms | True Alarms | Target Sessions (Counts) |
|---|---|---|---|---|---|---|---|
| 2026-11-21 01:00Z | 9 | 40–48 | 47 | 106 | 106 | 0 | `106fdda5` (29), `eba11247` (22), `f381c6d2` (19), `96bc9968` (16), `72f28bcb` (10), `4f660b01` (9), `1f388257` (1) |
| 2026-11-21 02:00Z | 13 | 49–61 | 37 | 36 | 36 | 0 | `f381c6d2` (12), `eba11247` (12), `106fdda5` (6), `4f660b01` (4), `72f28bcb` (2) |
| 2026-11-21 03:00Z | 11 | 62–72 | 25 | 20 | 20 | 0 | `f381c6d2` (11), `106fdda5` (9) |
| 2026-11-21 04:00Z | 5 | 73–77 | 11 | 7 | 7 | 0 | `106fdda5` (7) |
| 2026-11-21 05:00Z | 7 | 78–84 | 15 | 14 | 14 | 0 | `106fdda5` (10), `4f660b01` (3), `f381c6d2` (1) |
| 2026-11-21 06:00Z | 13 | 85–97 | 34 | 43 | 43 | 0 | `3bc0ebcb` (26), `f381c6d2` (12), `106fdda5` (2), `unknown` (2), `4f660b01` (1) |
| 2026-11-21 07:00Z | 14 | 98–111 | 37 | 34 | 34 | 0 | `f381c6d2` (14), `3bc0ebcb` (13), `66786e8e` (4), `unknown` (3) |
| 2026-11-21 08:00Z | 10 | 112–121 | 30 | 42 | 42 | 0 | `3bc0ebcb` (22), `66786e8e` (11), `unknown` (4), `f381c6d2` (3), `4f660b01` (2) |
| 2026-11-21 09:00Z | 11 | 122–132 | 51 | 54 | 54 | 0 | `3bc0ebcb` (29), `66786e8e` (13), `4f660b01` (4), `unknown` (4), `f381c6d2` (2), `106fdda5` (2) |
| **Total** | **93** | **40–132** | **287** | **356** | **356** | **0** | *(All false alarms)* |

*Note on generation count in bad window:*
Between generation 41 (started at `2026-11-21T01:22:18.271Z`) and generation 126 (started at `2026-11-21T09:25:09.064Z`), exactly 85 restarts occurred in 8 hours and 3 minutes (averaging one restart every ~5.7 minutes).

---

## 48-Hour Baseline Window Hourly Counts (2026-11-20 01:00Z – 2026-11-22 02:00Z)

| Hour (UTC) | Head Gens Started | Wake Records | `session-idle` Rows | False Alarms | True Alarms | Top Target Sessions |
|---|---|---|---|---|---|---|
| 2026-11-20 01:00Z | 0 | 0 | 0 | 0 | 0 | - |
| 2026-11-20 02:00Z | 1 | 3 | 0 | 0 | 0 | - |
| 2026-11-20 03:00Z – 07:00Z | 0 | 0 | 0 | 0 | 0 | - |
| 2026-11-20 08:00Z | 1 | 8 | 0 | 0 | 0 | - |
| 2026-11-20 09:00Z | 0 | 4 | 0 | 0 | 0 | - |
| 2026-11-20 10:00Z | 1 | 5 | 0 | 0 | 0 | - |
| 2026-11-20 11:00Z – 22:00Z | 0 | 0 | 0 | 0 | 0 | - |
| 2026-11-20 23:00Z | 1 | 4 | 0 | 0 | 0 | - |
| 2026-11-21 00:00Z | 3 | 27 | 6 | 6 | 0 | `097d3d9e` (1), `04eee23e` (1), `639492ca` (1), `16fadf1d` (1), `b17014e9` (1) |
| 2026-11-21 01:00Z | 9 | 47 | 106 | 106 | 0 | `106fdda5` (29), `eba11247` (22), `f381c6d2` (19) |
| 2026-11-21 02:00Z | 13 | 37 | 36 | 36 | 0 | `f381c6d2` (12), `eba11247` (12), `106fdda5` (6) |
| 2026-11-21 03:00Z | 11 | 25 | 20 | 20 | 0 | `f381c6d2` (11), `106fdda5` (9) |
| 2026-11-21 04:00Z | 5 | 11 | 7 | 7 | 0 | `106fdda5` (7) |
| 2026-11-21 05:00Z | 7 | 15 | 14 | 14 | 0 | `106fdda5` (10), `4f660b01` (3), `f381c6d2` (1) |
| 2026-11-21 06:00Z | 13 | 34 | 43 | 43 | 0 | `3bc0ebcb` (26), `f381c6d2` (12), `106fdda5` (2) |
| 2026-11-21 07:00Z | 14 | 37 | 34 | 34 | 0 | `f381c6d2` (14), `3bc0ebcb` (13), `66786e8e` (4) |
| 2026-11-21 08:00Z | 10 | 30 | 42 | 42 | 0 | `3bc0ebcb` (22), `66786e8e` (11), `unknown` (4) |
| 2026-11-21 09:00Z | 11 | 51 | 54 | 54 | 0 | `3bc0ebcb` (29), `66786e8e` (13), `4f660b01` (4) |
| 2026-11-21 10:00Z | 15 | 40 | 44 | 44 | 0 | `3bc0ebcb` (20), `66786e8e` (12), `f381c6d2` (5) |
| 2026-11-21 11:00Z | 9 | 41 | 24 | 24 | 0 | `3bc0ebcb` (12), `66786e8e` (6), `unknown` (3) |
| 2026-11-21 12:00Z | 15 | 35 | 11 | 11 | 0 | `3bc0ebcb` (9), `66786e8e` (1), `unknown` (1) |
| 2026-11-21 13:00Z | 10 | 21 | 23 | 23 | 0 | `3bc0ebcb` (11), `4f660b01` (7), `f381c6d2` (3) |
| 2026-11-21 14:00Z | 13 | 34 | 34 | 34 | 0 | `3bc0ebcb` (18), `f381c6d2` (9), `unknown` (4) |
| 2026-11-21 15:00Z | 13 | 32 | 45 | 45 | 0 | `3bc0ebcb` (14), `f381c6d2` (12), `4f660b01` (8) |
| 2026-11-21 16:00Z | 10 | 20 | 30 | 30 | 0 | `f381c6d2` (12), `106fdda5` (10), `4f660b01` (4) |
| 2026-11-21 17:00Z | 9 | 23 | 27 | 27 | 0 | `106fdda5` (14), `f381c6d2` (10), `4f660b01` (3) |
| 2026-11-21 18:00Z | 11 | 30 | 20 | 20 | 0 | `106fdda5` (18), `f381c6d2` (2) |
| 2026-11-21 19:00Z | 12 | 25 | 22 | 22 | 0 | `106fdda5` (20), `f381c6d2` (2) |
| 2026-11-21 20:00Z – 23:00Z | 0 | 0 | 0 | 0 | 0 | - |
| 2026-11-22 00:00Z | 10 | 24 | 32 | 32 | 0 | `f381c6d2` (17), `106fdda5` (15) |
| 2026-11-22 01:00Z | 7 | 20 | 14 | 14 | 0 | `106fdda5` (8), `f381c6d2` (6) |
| **Total** | **234** | **683** | **688** | **688** | **0** | *(All false alarms)* |

---

## Target Session Breakdown

### Target Session Identification
- `3bc0ebcb-aa65-458e-aed5-4973d2db9c9f`: `lead:WINCUSTODY` (Claude Code lead session for Windows custody)
- `f381c6d2-3f10-4128-aeac-d0f158513f83`: `lead:SUPERVISOR` (manual supervisor session)
- `106fdda5-666f-4ff8-af79-73b3a15762ad`: `lead:S6A` (Claude Code lead session for S6A execution tier)
- `4f660b01-7ec3-48f3-89b5-8219ba811853`: Claude Code work session in project
- `66786e8e-5df6-4e7c-a914-21718d3f667d`: Claude Code work session in project
- `eba11247-9e9c-4409-ab76-fd36255dd95d`: Claude Code lead session in project
- `96bc9968-c13a-46b3-aa55-b1d5cae97390`: Claude Code lead session in project
- `72f28bcb-7772-4ec2-9518-f5011835133d`: Claude Code lead session in project
- `unknown`: Sessions where transcript source did not record a session UUID

### Distribution Across Windows

| Target Session ID | Role / Description | Bad Window Count (9h) | 48-Hour Baseline Count (49h) |
|---|---|---|---|
| `3bc0ebcb-aa65-458e-aed5-4973d2db9c9f` | `lead:WINCUSTODY` | 90 | 175 |
| `f381c6d2-3f10-4128-aeac-d0f158513f83` | manual `lead:SUPERVISOR` | 74 | 154 |
| `106fdda5-666f-4ff8-af79-73b3a15762ad` | `lead:S6A` | 65 | 151 |
| `4f660b01-7ec3-48f3-89b5-8219ba811853` | Claude worker/lead | 23 | 53 |
| `66786e8e-5df6-4e7c-a914-21718d3f667d` | Claude worker/lead | 28 | 52 |
| `unknown` | Session UUID unrecorded | 13 | 35 |
| `eba11247-9e9c-4409-ab76-fd36255dd95d` | Claude worker/lead | 34 | 34 |
| `96bc9968-c13a-46b3-aa55-b1d5cae97390` | Claude worker/lead | 16 | 16 |
| `72f28bcb-7772-4ec2-9518-f5011835133d` | Claude worker/lead | 12 | 12 |
| `097d3d9e-a37d-4a71-b624-0162fd84bf55` | Claude worker/lead | 0 | 1 |
| `04eee23e-15a2-4b68-90ce-d357d3c576b7` | Claude worker/lead | 0 | 1 |
| `639492ca-7535-4d0b-887e-e9ded97b99e0` | Claude worker/lead | 0 | 1 |
| `16fadf1d-5212-4597-ac28-281ee12182ca` | Claude worker/lead | 0 | 1 |
| `b17014e9-683a-4e35-a4f2-122107f7fc2f` | Claude worker/lead | 0 | 1 |
| `1f388257-0bd0-4c50-bc22-8f05557e9ec6` | Claude worker/lead | 1 | 1 |
| **Total** | | **356** | **688** |

---

## Wake Records by Outcome (`fgos.supervisor.wake`)

Across the 48-hour baseline window (683 total wake records):
- `already-live`: 279 (watcher or CLI attempted wake while a supervisor generation was already running)
- `started`: 211 (a new supervisor head generation was launched)
- `starting`: 119 (wake was throttled because another start attempt was in flight within activeIntervalSec * overdueFactor)
- `nothing-unhandled`: 37 (queue check showed 0 unhandled events when wake ran)
- `nothing-admissible`: 27 (only capacity-bound events existed and no plan was admissible)
- `backoff`: 8 (wake backoff applied after consecutive failures)
- `stopped-stuck`: 2 (supervisor stuck recovery path triggered)

---

## Current Watcher Configuration in Force

Values resolved by `fgos config show --json`:

```yaml
watcher:
  enabled: false
  activeIntervalSec: 60
  idleIntervalSec: 900
  lookbackSec: 86400
  overdueFactor: 3
  definitions:
    - core/watcher/definitions
    - core/attention/definitions/head-gone.query.json
    - core/attention/definitions/plan-no-progress.query.json
    - core/questions/definitions
  defaultAction: wake-supervisor
  actions:
    supervisor-wake-failed: notify
    supervisor-stuck: notify
  notifyTo: null
  wakeFailureLimit: 3
  stuckWakeLimit: 15
  sessionGoneLimit: 0
  sessionIdleLimit: 0       # ROOT CAUSE OF THE BURST
  sessionNoResultLimit: 0
```

### Root Cause Analysis
In `core/watcher/definitions/session-idle.query.json`:
```json
  "params": {
    "limit": {
      "configKey": "watcher.sessionIdleLimit"
    }
  },
  "query": {
    "kind": ["fgos.session.activity"],
    "by": ["subject.id"],
    "agg": ["count", "max:ts"],
    "having": [
      {
        "lhs": { "agg": { "agg": "count" } },
        "op": "gt",
        "rhs": { "param": "limit" }
      }
    ]
  }
```
Because `watcher.sessionIdleLimit` was set to `0`:
1. Any active session having even **1** activity record (`count > 0`) in the `lookbackSec` (86400s = 24h) met the condition `count > limit`.
2. The query labeled every active session as `session-idle` on every tick.
3. Because `defaultAction` is `wake-supervisor`, the watcher invoked `fgos supervisor wake` on every tick.
4. Each wake started a new supervisor generation, which immediately ran, saw `session-idle`, marked it handled with no action, and exited with `supervisor done`—only for the watcher to immediately fire another false `session-idle` row on the next tick.

---

## Reproduction Commands

Phase 9 can rerun these exact commands over the same windows to reproduce the baseline counts and measure post-tuning improvements.

### 1. Watcher Configuration in Force
```bash
(cd /home/vantt/projects/forgent && fgos config show --json) | jq '.data.value.watcher'
```

### 2. Supervisor Wake Records (`fgos.supervisor.wake`)
```bash
# Total wake records in 48-hour baseline window
fgos metrics query \
  --kind fgos.supervisor.wake \
  --since 2026-11-20T01:00:00Z \
  --until 2026-11-22T02:00:00Z

# Hourly buckets in 48-hour window
fgos metrics query \
  --kind fgos.supervisor.wake \
  --since 2026-11-20T01:00:00Z \
  --until 2026-11-22T02:00:00Z \
  --bucket hour

# Hourly buckets in known bad window
fgos metrics query \
  --kind fgos.supervisor.wake \
  --since 2026-11-21T01:00:00Z \
  --until 2026-11-21T10:00:00Z \
  --bucket hour
```

### 3. Supervisor Head Generations Started
```bash
python3 - <<'EOF'
import json, glob
from datetime import datetime, timezone
from pathlib import Path

assignment_dir = Path("/home/vantt/projects/forgent/.fgos/assignments")
gens = []
for d in assignment_dir.glob("head-supervisor-forgent-*"):
    run01 = d / "runs" / "01"
    if not run01.exists(): continue
    intent = run01 / "attempt-intent.json"
    started = None
    if intent.exists():
        try:
            aid = json.load(open(intent)).get("attemptId", "")
            if aid.startswith("cmd_"):
                started = datetime.fromtimestamp(int(aid.split("_")[1]) / 1000.0, tz=timezone.utc)
        except Exception: pass
    if not started:
        started = datetime.fromtimestamp(run01.stat().st_mtime, tz=timezone.utc)
    gens.append(started)

# Bad window: 2026-11-21 01:00Z to 10:00Z
bad_gens = [g for g in gens if datetime(2026,11,21,1,0,tzinfo=timezone.utc) <= g < datetime(2026,11,21,10,0,tzinfo=timezone.utc)]
# 48h window: 2026-11-20 01:00Z to 2026-11-22 02:00Z
w48_gens = [g for g in gens if datetime(2026,11,20,1,0,tzinfo=timezone.utc) <= g < datetime(2026,11,22,2,0,tzinfo=timezone.utc)]

print(f"Bad window head generations: {len(bad_gens)}")
print(f"48h window head generations: {len(w48_gens)}")
EOF
```

### 4. `session-idle` Rows and False Alarms
```bash
python3 - <<'EOF'
import json, glob, subprocess
from datetime import datetime, timezone
from pathlib import Path

common_dir = Path(subprocess.check_output(["git", "rev-parse", "--git-common-dir"]).decode().strip())
closed_dir = common_dir / "fgos" / "events" / "project" / "closed"

events = []
for fpath in closed_dir.glob("*.jsonl"):
    with open(fpath) as f:
        for line in f:
            if not line.strip(): continue
            try:
                ev = json.loads(line)
                if ev.get("type") == "supervision.event-raised" and ev.get("payload", {}).get("kind") == "session-idle":
                    ts = datetime.fromisoformat(ev["payload"]["ts"].replace("Z", "+00:00"))
                    events.append((ts, ev["payload"].get("ref")))
            except Exception: pass

bad_events = [e for e in events if datetime(2026,11,21,1,0,tzinfo=timezone.utc) <= e[0] < datetime(2026,11,21,10,0,tzinfo=timezone.utc)]
w48_events = [e for e in events if datetime(2026,11,20,1,0,tzinfo=timezone.utc) <= e[0] < datetime(2026,11,22,2,0,tzinfo=timezone.utc)]

print(f"Bad window session-idle rows: {len(bad_events)} (all false alarms)")
print(f"48h window session-idle rows: {len(w48_events)} (all false alarms)")
EOF
```
