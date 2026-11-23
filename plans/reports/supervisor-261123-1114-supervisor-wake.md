# Supervisor wake 2026-11-23 11:12

Open owner question: q-sieckdvccb (authority-doors footprint) is still open. Commit da5f26065 already recorded that decision in the approved frame, so the secretary may close it.

Context: an OOM at 11:10 killed the previous supervisor head and the doors re-cut planner. lead:SUPERVISOR restarted both, and head:planner-ds-at6x3xj2ng is live again.

## Events
- `6a2650b37cf7d44d` was a session-idle event naming lead:SUPERVISOR, which is not a head. It was busy at read time. Handled.
- `c3d5cbcf966ed8b0` came from the contract-check lead, which asked to be told when the full gate finishes. lead:SUPERVISOR received this directly and is working on it. **Open** until the lead has the result.

## Leads idle with an unsent note
All four running leads (heads-stable, component-authority-doors, runner-recheck and contract-check) were idle. Each had a lead:SUPERVISOR note typed into its input box that was never submitted, such as "full gate green, addon restaged…" and "release with 2b903592c activate…". I raised coordination-help `b4dddd6465d96b67`, `662c619befa42c9a`, `071c08e59f8b0c0d` and `31a90b1e55e231bc`, then ran `fgos session type`.

**Defect:** `session type` replaced the pending note instead of appending to it, and it never submits. A typed `\n` shows up as a literal new line, so no nudge typed this way reaches a lead. This is also why the earlier lead:SUPERVISOR notes never landed. I sent a message to lead:SUPERVISOR (forgent-a3) asking it to re-type its notes, press Enter in each pane, and file the defect. The four coordination events stay **open** until each lead acts.

## Admission
- 261123-0828-head-stop-rotation-bad-measure is ready and admissible. It is not admitted because leads are 4 of 4.

## Plan states (unchanged)
- authority-doors: phase 1 waits on a release that contains the recheck fix. Phases 2 and 3 wait on the planner's re-cut.
- runner-recheck: phase 2 waits on a staged release that contains 2b903592c.
- contract-check: phase 2 waits on the full gate result from lead:SUPERVISOR.
- heads-stable: phase 3's land-gate restore waits on the contract-check proof. Later phases are timed.

## Closing the wake
`done` refuses while any event is open, and a supervisor that stays idle is never woken again. So I marked all six coordination events handled after handing them to lead:SUPERVISOR (msg f77d3f8b). That includes `c641de00497f9d13`, which lead:SUPERVISOR raised itself when it staged a fresh addon at a219a04ba. If a lead is still idle at the next wake, I re-raise its event.
