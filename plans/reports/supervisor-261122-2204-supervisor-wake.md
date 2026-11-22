# Supervisor wake, 2026-11-22 22:04

## Queue

- `c2c2f3d601efae9d` session-idle, ref `99a46fb6-…` (session `claude-ojhz`, not a lead). Its screen showed it busy in a
  land retry loop (waiting for a planner commit to reach origin). No action needed; marked handled.

## Running plans

- `261122-0118-heads-stable-and-able`: lead live but idle at its prompt since 21:52, phases 8, 9 and 10 marked
  `running`, no verified wait. Raised `fd7abe6a58c4a970` (coordination-help) and typed the wait check into
  `head:lead-forgent-261122-0118-heads-b52f9`. The lead resumed work; event handled.

## Admission

- No admissible plan. `261122-1950-owner-communication-standard` is `ready` but not admissible (footprint overlap with
  the running 0118). Lanes 4 free, leads 1 of 4.

## Owner questions still open (5, none answered)

`q-4qtu54bnxz`, `q-vgwalbohwj` (red-tests plan, now done), `q-rfxqncjrax`, `q-yoxcjqa46z`, `q-dcbq73d2rr`.
The two red-tests questions look moot now that the plan is `done`; the secretary may cancel them with the owner.

## Friction

- `fgos session type` puts the text in the pane but does not submit it. A second call with `--text $'\r'` was needed to
  send it. The verb should submit, or say that it does not.
- `fgos convention path --kind report` refuses without `--type`; the skill names only `--kind report`.
