# Kongming as chair: advisory approaches CURRENT, THIN and M (2026-10-08)

Source: one autonomous run of the `claude` executor on model `fable`, given the owner's question and the full text of the two analyst reports with their round 2 rebuttals (`discussion-advisory-approach-current-261008.md`, `discussion-advisory-approach-thin-261008.md`). The chair checked the blind-input read access line itself and relied on the analysts' citations for the diff size, the YAML line numbers and every gate trace. Verdict: deploy the middle path M, bounded, with one live run as the only definition of done. Decisions in this file belong to the owner.

**Chair verdict, 2026-10-08.** Verified myself: `withRunDirReadAccess` on main grants only runDir (`src/runner/dispatch/cli.mjs:241-244`), so the blind-input stall is a plain-path main defect, as THIN's round 2 said. Main HEAD is `8a45feca1`. Not verified by me: the +4871/-791 diff size, the YAML line cites, and every gate trace. I rely on the analysts' E and R citations for those.

## 1. Scores against BASELINE

- **Function.** BASELINE fails 4 of 6 (params dropped at `panel.mjs:66`, `solo` synthesis, no close gate). CURRENT proves 4 of 6 but only through lead-written `--definition` segments, no skill exists (E:85,240). THIN gives 5 of 6 on a registered flow. M gives 5 of 6 plus affected-only reopen. M wins because its proof is a product the owner runs, not a mechanism a lead drives.
- **Stability.** CURRENT touches three GitNexus-CRITICAL dispatch symbols (E:229), has two open HIGH gaps (E:312) and an LLM driver keeping round state in description labels. THIN and M change one shared line, the settlement verdict, and that is why the acceptOutcomes question is load-bearing. M wins.
- **Fast and light.** Both analysts agree wall time is equal, 36 vs 39 min. Weight decides: CURRENT 1432 src lines plus driver plus four definitions. M about 150 src lines, two YAMLs, one skill. M wins.
- **Flexibility.** Rebuttal debate is one YAML on main's `sameSeat`/`anonymizeInputs`/`blind`. Council-lens names contextRefs and findings routing as its only missing seams. Both are in M. CURRENT's driver would cost one driver per form. M wins.

**Deploy M.** CURRENT's genuine value is its generic runtime repairs, and they ship better as their own item than bundled under an advisory feature.

## 2. Shape-shifter test on M

Weight: about 150 to 200 src lines, 2 registered YAMLs (main plus reopen, at most 60 lines), 1 skill at most 200 lines, 1 new start input, 1 new event field (the persisted `--context-ref`), 0 new durable state machines, 0 drivers.

Where a sequencer could creep back: `--context-ref` is the only seam. If it ever accepts anything but a plain reference to a prior run's artifact, or if the reopen YAML grows a conditional step, you have a scheduler again. Bound it: one flag, validated by the existing `template.contextRefs` rule, no byte capture, no provenance object.

What both analysts agreed on too easily: the trust-seeding question. THIN says "land it before a new-target run", CURRENT says "fix the source or verify manually". Neither priced it. If it is in M's critical path for the one live run, M's budget is already lying. My ruling: not in M. The live run targets mcp-skill-hub where the operator trust entry exists (E:198).

Analysts' four changes: accept reopen YAML, bounded. Accept acceptOutcomes with tests. Accept `--strict-mcp-config` project-local, reject the doctor hint, that is a new surface. Reject trust seeding inside M, send it to the dispatch item.

## 3. The five disagreements

1. **Reopen YAML: allow it, one, at most 60 lines, linear.** The kill rule was written against unregistered ad-hoc graphs and drivers choosing graphs. A second registered, linear definition is the same category as `delphi.yaml`. It becomes a sequencer in disguise only if it contains branching or a step that decides which step follows. Linear or kill.
2. **acceptOutcomes on the three reviewed steps: add `[pass, findings]` now, with one deterministic test each.** CURRENT is right on mechanics: `reviewed.mjs:150` loops first and fails only at maxRounds. But those flows feed a human gate, and dissent at maxRounds is information the human should see, not a failure. No live runs of those workflows are required. The tests prove the plumbing.
3. **Dispatch item order: Unit association first.** A controller death re-running settled seats is data corruption of a 36-minute run. Trust seeding is a stall the operator can see and fix by hand. Correctness before convenience.
4. **"Baseline never completed": harness artefact.** CURRENT's own table marks it "process, avoidable" (row 7). Non-TTY Codex and a concurrent file edit are not properties of the baseline. It proves nothing either way.
5. **"4 of 6 proved" is overstated.** Mechanism proof through lead scripts is not end-result proof. The honest claim is "mechanisms exercised, product unproven". That is exactly why M's single live run through the installed entry is the deciding test.

## 4. The meta-question

The build does not finish because the definition of done is "seven live gates, no deferral". Every environment failure, quota, trust dialog, non-TTY, concurrent writer, became in-branch runtime work, and the plan's own exclusion of transport changes was never re-read (plan.md:100 vs E:17). That is how it is run, and it is dominant. The approach part is smaller but real: an autonomous specialist needs an unavailable-expert path, which needs a new ref type, which needs a new gate. Self-feeding.

The single change: separate the person who declares done from the person who built it, and make done a fixed artifact, not a count of gates. Concretely, M is done when one named live run on main produces advice the owner rates. No gate list. Anything the run hits outside M's file list is a bug report for the dispatch item, never a patch in M's branch.

## 5. Decision list

**Next 24 hours**
1. Freeze the worktree: commit it as-is on its branch, tag it. Nothing from it merges whole.
2. Cherry-pick into a fresh branch off `8a45feca1`: panel params, acceptOutcomes, settlement fix, the 17-line read-access fix, `--context-ref`, acceptOutcomes on the three reviewed steps with tests.
3. Write the registered YAML with `reviewed` synthesis and human close, the reopen YAML, and the skill.
4. Run the one live protocol below.

**Move to the separate dispatch item, owner decides by 2026-10-12:** Unit association and reconnect, launch-before-brief recovery, trust seeding source, HOME lifetime, reaper, startup-dialog capture, receipt collection.

**Budget, checked against `8a45feca1`:** src diff at most 200 lines; test diff unbounded; docs at most 100 lines; no new file under `src/runner/dispatch/`; no new durable state; skill at most 200 lines; both YAMLs linear.

**Kill criteria:** any patch lands under dispatch, herdr or confinement; `--context-ref` gains a second field; the skill reads or writes run state; a third definition appears; not closed by 2026-10-10 end of day.

**The live-run protocol:** one run on main code, target mcp-skill-hub, through the installed `fgos workflow start`, from a real terminal, quiet machine, `--strict-mcp-config` applied project-locally. Success is the owner rating the final advice at least equal to packet `bab4742a`'s explanation. One stall outside M's files means the dispatch item goes first and M waits. One stall inside M's files means fix and rerun once. Two stalls means kill.

**Trade-offs the owner accepts:** no autonomous specialist mid-run, one batched question at close instead; a controller crash can re-run settled seats until the dispatch item lands; no byte-frozen cross-run evidence; a reopen re-runs the recommendation stage even when only explanation changed.

**Verdict: deploy M, bounded as above, with the live run as the only definition of done.**
