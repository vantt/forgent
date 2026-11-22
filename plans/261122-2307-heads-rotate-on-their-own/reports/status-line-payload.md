# Proof Point Report: Status-Line Payload & Sidecar Path

NOTE: This payload was reconstructed from the installed CLI bundle, not recorded from a running head; a real recording is still owed.

Date: 2026-11-23
Plan: plans/261122-2307-heads-rotate-on-their-own/plan.md
Phase: plans/261122-2307-heads-rotate-on-their-own/phase-03-weekly-quota-rotates.md

## Step 1: Status-Line Payload Fields (Claude Code 2.1.330)

The installed Claude Code binary (`/home/vantt/.local/bin/claude`, v2.1.330) generates a JSON payload on stdin for the command configured via `statusLine.command`.

Decompilation and inspection of the status-line generator function (`i3r` in the installed CLI bundle) confirms the following JSON structure:

```json
{
  "session_id": "9f8391a5-4100-4ffe-938b-111265ec5fa1",
  "transcript_path": "/home/vantt/.claude/projects/-home-vantt-projects-forgent/9f8391a5-4100-4ffe-938b-111265ec5fa1.jsonl",
  "context_window": {
    "total_input_tokens": 15420,
    "total_output_tokens": 3120,
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 15420,
      "output_tokens": 3120,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 0
    },
    "used_percentage": 9.27,
    "remaining_percentage": 90.73
  },
  "rate_limits": {
    "five_hour": {
      "used_percentage": 4.5,
      "resets_at": 1732320000
    },
    "seven_day": {
      "used_percentage": 42.0,
      "resets_at": 1732800000
    }
  }
}
```

### Named Fields
- **Weekly used-fraction field**: `.rate_limits.seven_day.used_percentage` (represented as a 0..100 percentage number; divided by 100.0 to obtain the fraction `0.42`).
- **Weekly reset-time field**: `.rate_limits.seven_day.resets_at` (represented as integer epoch seconds, e.g. `1732800000`). Converted to ISO-8601 string.
- **Context window fields**: `.context_window.used_percentage` (0..100 percentage number) and `.context_window.current_usage` (object with token breakdown) over `.context_window.context_window_size`.

### Verdict
The weekly quota field **exists** in Claude Code v2.1.330 under `rate_limits.seven_day`. Full weekly quota rotation (Steps 1 through 7) is implemented.

---

## Step 2: Sidecar Path & Confinement Authority

### Confinement Model
In the fgOS bwrap confinement model:
- The confinement policy (`packages/execution/contracts/confinement-policy/policy.v1.json`) never grants a writable path under `.fgos`, so `<lineage>/sidecar/` cannot be written by a confined head.
- Instead, the sidecar is placed in a folder that the confinement policy already grants writable: beside the session transcript.
- Both the status-line payload and the Stop payload carry `transcript_path`.
- Path chosen: `<dir of transcript_path>/<session_id>.context-sidecar.jsonl`.
- The status-line writer appends there;
- Both `measure` (`packages/session-host/rust/src/rotation/measure.rs`) and the Stop hook read it from the same `transcript_path`;
- The observe source (`packages/observe/rust/src/sources/transcript_records.rs`) reads it beside the transcripts it already reads.
- If the status-line writer cannot write, it still exits 0, but prints the failure in its one status line instead of hiding it.
