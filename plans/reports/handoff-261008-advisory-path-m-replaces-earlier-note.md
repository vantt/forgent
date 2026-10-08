# Handoff to the advisory agent: path M replaces the earlier note (2026-10-08)

To: the agent working in `/home/vantt/projects/forgentX-worktrees/advisory-capability-completion` (branch `feat/advisory-capability-completion`).
From: the lead session, on the owner's instruction. This note supersedes every earlier handoff note from the lead, including the items marked "B".

## What the owner decided

After a structured comparison (two analysts, then a chair), the owner chose a bounded middle path, called M, over finishing the current plan as written. Evidence is in `plans/reports/` on main: `discussion-advisory-approach-current-261008.md`, `discussion-advisory-approach-thin-261008.md`, `kongming-advisory-chair-verdict-261008.md`, and the owner's decisions in `advisory-m-owner-decisions-and-parked-questions-261008.md`. This is not a judgment that your work was wrong: most of your runtime repairs fix real, generic defects and are kept, but moved out of the advisory feature.

Why the current plan did not finish: the definition of done was "all seven live gates, no deferral". Every environment fault (quota, trust dialog, no real terminal, concurrent writers) became runtime work inside this branch, and the plan's own exclusion of transport and confinement changes was not re-read. The change below replaces that definition of done with one named live run.

## Do now (in this order)

1. **Freeze.** Stop adding features. Commit the working tree as it is on this branch (the work has been uncommitted for two days) and tag it, for example `advisory-pre-m-snapshot`. Do not merge this branch whole. Do not push.
2. **Fresh branch off current main** (check the HEAD at that moment; the budget below is measured against it). Take over only these pieces, as small reviewed changes:
   - panelist params reaching the panel seats (`panel.mjs` currently passes none);
   - `acceptOutcomes` for reviewed units, plus the settlement fix that keeps a reviewer's `findings` instead of turning them into a pass;
   - `acceptOutcomes: [pass, findings]` on the reviewed steps of `business-discussion`, `group-cognition` and the advisory critique step, with one deterministic test each (the settlement fix changes how these three behave);
   - the blind-input read access fix (`withRunDirReadAccess` in `src/runner/dispatch/cli.mjs` grants only the run directory, while inputs are copied to `assignmentDir/inputs`);
   - a narrow repeatable `--context-ref` input on `workflow start`: same validation as `template.contextRefs`, stored in the `workflow.start` event, delivered to the first step's units, no byte capture, no provenance object, no second field.
3. **Definitions and skill:**
   - the one registered advisory YAML: synthesis becomes a `reviewed` unit so the red-team sees the final packet, followed by a human close gate;
   - the final packet carries a required structured field `missing expertise` (empty when none); the close gate reads it and asks the owner one batched question: bring in that expertise or not;
   - one registered reopen YAML, at most 60 lines, linear: it takes the parent run through `--context-ref` and does not re-run the blind seats; no branching, no step that decides which step follows;
   - the skill, at most 200 lines. It starts workflows and reads settled reports; it must not read or write run state.
4. **Project-local MCP flag.** `--strict-mcp-config` stays a project-local setting, never a shipped default. No new `doctor` hint for it.

## Do not do

- No change under `src/runner/dispatch/`, herdr or confinement in the M branch, and no new file there, with exactly two named exceptions, both already listed under "Do now": the blind-input read access fix in `src/runner/dispatch/cli.mjs` (about 17 lines) and the settlement fix that keeps a reviewer's `findings` in `src/runner/dispatch/settlement.mjs` (about 5 lines). Take the minimal versions only, not the larger edits to those two files in the frozen branch (they also carry receipt and recovery work that belongs to the dispatch item). The stop criterion on dispatch patches does not trigger for these two; any other dispatch patch does.
- Not in M, and not to be built here: `workflow start --definition`, the request-correction store event, input byte capture, durable Unit association and reconnect, launch-before-brief recovery, trust seeding, home lifetime, the orphan reaper, startup-dialog capture, receipt collection, the automatic mid-run specialist, any driver or continuation-graph chooser. They go to a separate dispatch item the owner decides on by 2026-10-12. Order inside it: Unit association first, because a controller death can re-run settled seats (a Unit is linked to its Workflow only after the run returns).
- Do not touch the two open HIGH session-isolation gaps in M; list them in the dispatch item.

## Budget, checked against the main HEAD you branch from

- Source diff at most 200 lines. Test diff not bounded. Docs at most 100 lines.
- No new durable state. Both YAMLs linear. Skill at most 200 lines.

## Stop criteria (any one stops M; report to the owner, do not push on)

- Any patch lands under dispatch, herdr or confinement other than the two named exceptions above.
- `--context-ref` gains a second field.
- The skill reads or writes run state.
- Any definition branches, or has a step that decides which step runs next.
- Any definition beyond the two named above (main and reopen) is added without the owner's prior approval, even a linear one. The limit is for this advisory scope only; it is a tripwire against continuation graphs coming back, not a cap on the platform (a future communication form that is one linear YAML stays welcome with approval).
- M is not closed by the end of 2026-10-10.

## The single live run that decides done

One run on main code, target `mcp-skill-hub` (`/home/vantt/projects/mcp-skill-hub`, operator trust entry already present), through the installed `fgos workflow start`, from a real terminal, on a quiet machine, with `--strict-mcp-config` applied project-locally.

- Success is the owner rating the final advice at least equal to the explanation in packet `bab4742a`. You do not certify this; the owner does. One run shows that M completes, not how good its advice is; quality on a fresh topic is rated afterwards.
- A stall outside M's file list: record it as a bug for the dispatch item and stop; the dispatch item then goes first and M waits.
- A stall inside M's file list: fix and rerun once. Two stalls: stop M.
- Never patch a dispatch defect inside the M branch to get the run through.

## Trade-offs the owner has accepted

- No automatic specialist mid-run: one batched question at the close gate instead. A reopen takes about 15 minutes.
- A controller crash can re-run settled seats until the dispatch item lands.
- No byte-frozen cross-run evidence.
- A reopen re-runs the recommendation stage even when only the explanation changed.

## Reporting and rules

- Do not push, merge or edit anything on main. Tell the owner when the snapshot commit exists and when each piece is ready for review; do not self-certify.
- Report with: Status (DONE, DONE_WITH_CONCERNS, BLOCKED, NEEDS_CONTEXT), a one or two line summary, concerns. Unresolved questions at the end.
- Do not paste credential values into reports.

## Unresolved

- Whether the reopen YAML needs its own capability names or can reuse the existing ones.
- Whether `acceptOutcomes` on the three reviewed steps changes their behavior in a way the tests above do not cover; no live run of those workflows exists.
