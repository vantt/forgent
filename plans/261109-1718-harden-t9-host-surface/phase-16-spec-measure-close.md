---
phase: 16
title: "Close: spec and settled shapes, re-measure, Vietnamese owner-machine guide, closing report, lessons appended"
status: pending
depends_on: ["01-04, 06, 08, 10, 12-15, 17-24, 26 landed", "05, 07, 09, 11, 25 landed, or handed off with their text intact"]
parallel: "none: last"
effort: ~1d
net_size: "0 (docs, reports, one counts recount)"
---

# Phase 16 - Spec, re-measure, guide, close (plan loop steps 8 and 9)

## Context

The layer closes only when the four conditions of the proposal §4.2 hold, no High-or-above finding is left unreproduced, and the layer's net (HARDEN commits only) is at most zero or each increase names the deletion that pays for it. Plans and reports are stateful records; the settled shapes go to the owning specs, not into this plan.

## Requirements

1. **Spec.** Settled shapes, each in the smallest owning surface (DOC told before merge):
   - `docs/platform/host-invocation-routing/` (README and `roadmap.md`): the "75 selectors / 5 native" counts at `roadmap.md:26,40,99,113` become the recounted figures (**recount `packages/host-runtime/contracts/command-routes.json` after P10**: 82 before the `preflight` retirement, so 81 selectors, 8 native, unless packaging P04 changed the routes) (T9-22); the arm rule (parse, one call, print) and the root door. **No edit to `packages/host-runtime` code**; no edit to the `external_process` docs beyond what the counts need (decision 81 Q3: kept).
   - `docs/platform/packaging-distribution/spec.md`: the doctor surface (one shim probe per run, parallel `claude` calls, no new row), the timer's binary rule.
   - `docs/reading-map.md`: the use-case layer line (tsk-49i) gains the groups that moved (worktree, events, run, workflow, setup).
   - The area `spec.md` decision-history sections: the settled decision narratives (root door L-1, fail-closed agy hook L-8, lifecycle wrapper, loopback gateway default, no fingerprint cache with the measured saving, `preflight` retired). Settled facts go into the exact area spec, resolved through `docs/platform/governance.md#decision-scope-to-holder-table`.
   - If the four proposed phases landed: the `unit-run-result` contract text is COOK's; this phase only links it from the Workflow and Execution specs.
2. **Re-measure** on the activated release, same machine and load class as the baseline (quiet), with a before/after table: host overhead per legacy call (55 ms before); `fgos --help` (133 ms before); `dispatch decide`; Agent/Task `PreToolUse` (262 ms before) and a matching Bash delete-guard call (148 ms before); entry static import closure against the 10 ms target with the Work-only allowlist named; doctor wall time with one shim probe per shim (against the 12 s target; `delivered-not-on-trunk` stays Work's gap); Rust test time of the touched crates (measured on a quiet machine, or "not measured, suite running": never invented); LOC for Node, Rust and tests per phase with the estimate next to it. If host overhead is still above 30 ms, the report says so and leaves the fingerprint-cache question to the owner (Q4 b).
3. **Vietnamese guide** for the owner machine and fg-server, name from `fgos convention name --kind report --type guide --slug owner-machine-harden-t9-host-surface --json`, started at the first landing and linked from the board; one section per landed phase: main commit, what changes for the user, commands (pull, build, stage, activate on forgentX and on `~/projects/forgent` on fg-server, doctor, smoke), expected doctor rows, rollback and the prior release id. Sections that need a step: P02 (a command from a subdirectory now reads the project's store), P06 (agy hooks refuse on an unusable config), P10 (`fgos preflight` is gone; `npm run` script for this repo), P14 (**gateway binds loopback; machines on LAN or Tailscale add one `gateway.bind` line before activating**).
4. **Closing report** `closing-...-harden-t9-host-surface.md` (name by convention): acceptance criteria one by one with evidence, the net-size table (measured against the plan's estimates; the Unit-contract line separate), what was reused and what was missing (prior-art rule), the owner-ideas list (arbitration §5, untouched), the hand-off of anything not done (proposed phases not approved, Work arms, the Work REST/MCP argv, the owner-decided leftovers), and the `## Lessons` section.
5. **Lessons.** Append the lessons proven in this layer to `plans/261021-1118-harden-low-layers-bottom-up/lessons.md` (the ledger the owner wants distilled into the hardening skill): one line each, with a stable id in the file's scheme (`HL-`, `OL-`, `Q-`), the evidence (decision, report, commit), and no rewrite of old rows. Candidates already seen: a layer whose "arms" hold logic is hardened by moving the logic down, not by hardening the arm; a security rule written twice with two outcomes is the real bug; one registry field replacing five sets ended a dead-name class; a measured number needs a stated load class.
6. **Board and plan.** One line at the top of the program board `log.md` and the HARDEN plan T9 row updated through the plan CLI (`ak plan --help` first; never edit status cells by hand). `docs/backlog.md`: a row per item filed out of scope (Work REST/MCP argv, `return` near-copies, `src/verbs/state/edit.mjs:41,48` node hint, seat-binding rows spawning the host 98 and 84 times, `lock-status` 349 ms, `getMainFgosDir` five Git processes, F12 if OPC says "not refused"), ids from `fgos identity mint backlog`.

## Files

**Create:** the closing report, the Vietnamese guide.

**Modify:** the specs and docs named in 1, `plans/261021-1118-harden-low-layers-bottom-up/lessons.md` (append), the HARDEN plan T9 row (through the CLI), `docs/backlog.md`, `plans/261017-1313-fgos-platform-program-board/log.md` (grep by lane id first; never read whole), `CHANGELOG.md` (only if a line from a phase is missing).

**Delete:** nothing.

**Tests to retire:** none.

## Steps

1. Wait for the landing list; run the re-measure on the activated release.
2. DOC told with the paths; edit specs; verify every link and claim against source, tests and live state (re-read after editing).
3. Guide, report, lessons, backlog rows, board line.
4. Compare the result with the opening outcome and the layer acceptance criteria one by one.

## Validation

`test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs`, `fgos convention check`; link check on the new files; the numbers in the report reproduce from commands written next to them.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The close waits on phases the owner has not approved | M x L | proposed phases never gate; they are handed off in the report |
| Speed targets missed and reported late | M x L | the table reports the miss plainly; no target is rewritten after the fact |

## Rollback

Docs only; revert the commit.

## Done when

All criteria of the plan checked with evidence; guide linked on the board; lessons appended; the report names every unresolved question with its owner.
