# Phase lead report: fgos-cook coordination loop

Plan: [plan](../261020-2014-cook-p5-fgos-cook-coordination-loop/plan.md). Branch `worktree-agent-a49edb90659389932`.

## Delivered

- `core/skills/fgos-cook/SKILL.md` (route of five steps, what the conductor does not do, nine hook values, boundaries) and three references: `reading-ak-plans.md` (ten reading points, check against code, frame sizing), `case-and-doors.md` (worktree, open case, status, self-check, dispatch, verify, findings, questions, handoff, notebook), `route-table-pending.md` (names the table as pending on Seat Binding, lists the inputs the loop needs, says what the loop does meanwhile).
- Serial limit stated in the skill (no safe land for parallel writers yet). No tier, provider or rigor-to-tier rule anywhere.
- `fgos-run` Mode B now points at `fgos-cook` for whole plans.
- CHANGELOG line. No spec change (no contract fact changed), no reading-map entry (the map lists no skills).
- Renders regenerated with `npm run build:skills` (`.agents/`, `.claude/skills/fgos-*`, `plugins/`), none hand-edited.
- No `src/` change, no Seat Binding files, no AgentKit files.

## Reused

Case doctrine `coordination-driver.md`; the ak:cook worker contract; decision-question and dispatch-fallback fragments; the conductor loop and ten plan-reading points of research 261016-2141 (not its table); the `fgos-advise` shape; the `coding/feature` guide; P4's worktree provisioning and `skills: ["ak:cook"]`. Old `/fgOS:cook` (now `/fgOS:deliver`) is the Work-item path and stays untouched.

## Evidence

- Probe in a scratch repo (not this repo's state): `fgos workflow start coding/feature --frame ... --worktree ...` opens a conductor case; `status` shows milestones, routes, frame, binding, `closable`. A dispatch naming that case for `implement-item` is refused `entry-milestone-unmet`.
- Gap: a conductor settle writes `achieved: []` (`src/workflow/case-admission-port.mjs:275`), so no milestone is ever recorded. Coordinator confirmed and assigned a separate lead (src/workflow). **The live run needs that fix on main.** The skill stops by name `milestone-not-recorded` if a passing settle leaves the milestone unreached.

## Tests

- Verified by me: `build:skills` clean; `test/docs/*.test.mjs` 30/30; `skill-wrappers` and `architecture` pass; `check-decision-citation-drift` 31/31 after fixing a real failure my first draft caused (local decision ids in `reading-ak-plans.md`, fixed in `fc65b1289`).
- Full suite once: 572 files, 8041 tests, 1261 s (machine heavily loaded, queue wait). Failures other than mine, all rerun alone: `run-provider-failover` 28/0, `run` 82/0, `operation-choice` 154/0, `fgctl-init` 8/0, `spawn-worker` 18/0, `loop` passes (one failure only in the loaded run), `dev-host` 10/0 (3 failed in the loaded run). `fgctl-upgrade` reports 0 pass 0 fail alone (not examined). `terminal: gate-exit-no-receipt` is in the known-failing terminal set, not rerun. The 600 s timeouts in the full run were load, not code.

## Unverified, for the live run

- What the `integrate` activity looks like on one serial branch.
- How the owner's approval of a case-integrated tree is recorded (no conductor path to the `approved` milestone exists today; the skill leaves consent and merge to the owner).
- Frame sizing arithmetic (`seatLaunchesPerDispatch`) against real refusals.
- `--unit` with `--case` for `ak:cook` slices (code path shows case flags independent of unit source; not run).

## Commits

`2b4d408a6` plan, `c1a3b7b59` skill + renders + changelog, `fc65b1289` citation fix. Plan path is `261020-2014-...` (from `fgos convention path`), not the `2010` in the brief.
