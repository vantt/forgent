# Phase 1: Baseline, wake rate and idle alarms

Capability: `code:test` (an evidence read; changes no code).

## Inputs

- `plans/backlog/p-vquz26ibnn-make-the-secretary-and-the-supervisor-stable.md`, item (7): the supervisor head restarted
  85 times in about 8 hours on 2026-11-21 (generation 41 at 01:22Z, 126 at 09:25Z), mostly on false `session-idle` alarms.
- `core/config-standard/watcher.yaml` (thresholds and actions) and the project values under `watcher:` in
  `.fgos/config.yaml` (absent keys take the standard default).
- `core/watcher/definitions/session-idle.query.json` (what fires the row).
- The supervision event records the watcher and `fgos supervisor wake` write (`fgos supervisor wake` "records the wake";
  find the store with `rg -n "fn record_wake|wake-recorded|supervisor-woke" packages/supervision/rust/src` and read it
  through its read door; read the JSONL directly only if no door reads it, and record that as friction).
- Supervisor head generations: `.fgos/runtime/session-rotation/supervisor-*/` and the session registry.

## Footprint

`plans/261122-0118-heads-stable-and-able/reports/baseline-wake-and-idle.md` only.

## Steps

1. Fix the measuring window: the last 48 hours before this phase starts, plus 2026-11-21 01:00Z to 10:00Z as the known
   bad window.
2. Count per hour: supervisor wakes (each started supervisor head generation and each `supervisor wake` record), and
   `session-idle` rows raised, by target session.
3. Judge each `session-idle` row false or true. False: the target session showed progress within one watcher interval
   after the row (a turn, a commit, a ticket ended, a land), or the supervisor marked it handled with no action. True: the
   session was idle with unfinished work and nothing else woke it. Write the rule used at the top of the report so phase 9
   applies the same rule.
4. Write the report: the window, the counts per hour, the false and true counts, the current `watcher` values in force,
   and the exact commands used, so phase 9 can rerun them.

## Verify

The report exists, names its commands, and its counts reproduce when the commands are rerun over the same window.

## Rollback

Delete the report.
