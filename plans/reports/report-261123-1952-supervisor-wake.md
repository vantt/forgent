# Supervisor wake 2026-11-23 19:52

Trigger: owner chore 9a1a2d0fd7701329 (two leads finished at 19:29, nobody checked; admit 261123-0828 if a slot is free).

## Leads read

- **261121-2110-component-authority-doors** (lead live). On main: 1b, 2c (24b28aa6f), 2e (b81101706), 3a (c3125be3b), plan update 21a11c83a. Lead announced the next wave (2d, 2a then 2b, phases 4 and 5) at 19:38 but sat idle with no unit running. Raised coordination-help 2c1d710e79eab324, typed a nudge; the lead is working again (screen shows "esc to interrupt").
- **261122-0118-heads-stable-and-able** (lead live). Phase 13 landed 5ebc256, plan update abb38cf. Phases 8 and 10 are a measurement window that ends 21:06 tonight; then the lead writes two reports and runs phase 11. Verified external wait, left alone. Its pane still holds an earlier unsubmitted supervisor nudge (now stale); harmless.

## Admission

261123-0828-head-stop-rotation-bad-measure is admissible but `leadsLive` 2 = `maxLeads` 2, so it is not admitted this wake. It goes in when either lead ends.

## Friction found

- `fgos session type` types the text but does not submit it; a second `type` with a carriage return was needed. The 17:50-era nudge to the heads lead was never submitted for that reason.

## Left for someone with the grant

- Stale worktrees named by the leads: `forgent-worktrees/261122-0118-heads-stable-and-able-p13` (failed unit's uncommitted edit) and component-authority `-p01 -p01b -p02 -p03 -p1b -p2e -p2f -p2g -p3b -p3d`. Removal is `fgos worktree remove`; not done here.
- About 6.2G of the component-authority lead's scratch copies (par, par2, par3) in its scratchpad under /tmp; the lead asked the owner to remove them.
