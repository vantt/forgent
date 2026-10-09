# Discussion: advisory approach THIN (analyst for THIN, 2026-10-08)

Read-only. W = worktree `advisory-capability-completion`, diff vs `71043949d` (now 51 files, +4871/-791). Run data from `W/plans/.../reports/phase-02-execution.md` (PX).

## 1. THIN vs BASELINE on end results

**(a) Function**

| Goal | BASELINE | THIN | Proof |
|---|---|---|---|
| 3 distinct viewpoints | no: `panel.mjs:66` drops params for panelists | yes (3-line fix) | live shaping already settled 3 blind real reports (PX:188) |
| critique + red-team of FINAL packet | no: synthesis is `solo` (`architecture-advisory.yaml:44`) | yes: synthesis `reviewed` rigor high (`reviewed.mjs:27`); runner passes every transitive prior report as `unit-run:` refs (`runner.mjs:40-90`) | sha of producer = checker inputs, as PX:203 did |
| specialist on real need | no | partly: gap named, owner decides at close | test + live run |
| bounded dialogue + close | no close gate | yes: human gate step (pattern `business-discussion.yaml:52`); bounded by DAG, not driver | deterministic |
| human words verbatim | yes (request + gate-answer refs) | yes | existing |
| read-only confinement | yes | yes (gate 7 already accepted, PX:49) | done |

Losses: (1) automatic specialist. 1 of 2 real specialists was advisor-triggered (network, PX:201); the other had owner turn in its chain (PX:263). Moderate loss, costs one owner round-trip. (2) Byte capture: within one run, main already copies blind inputs with sha refusal (`handoff-refs.mjs:293-306`); loss only matters cross-run after source edits. Low. (3) Native launch-before-brief recovery: only hit when controller dies mid-round (PX:217). Low for advice quality, real for robustness.

**THIN defect found:** cross-run contextRefs exist only as `template.contextRefs` (W `definition.mjs` diff); main `workflow start` takes only id/`--plan`/`--request` (`bin/fgos.mjs:2172-2183`). With `--definition` reverted, an owner reopen CANNOT point at the parent run's reports. THIN needs one narrow new input (e.g. repeatable `--context-ref` on start, ~20 lines) or reopen loses prior analysis. Also, one registered YAML means a reopen re-runs all seats (no affected-only work) unless a second registered definition is allowed, which the red-team's kill list forbids. Must be fixed before THIN is honest.

**(b) Stability.** Kept src ≈ panel 6, definition 35, runner part, settlement ~5, cli 17, new start flag: ~100-150 lines. Single DAG, no LLM driver, no description-state. Worker death: Core fails closed (PX:265); resume is main's existing path, without receipt-collection repair (PX:113) → may refuse `run-unreconciled`; owner re-starts. Blast radius: the settlement fix is global (GitNexus CRITICAL, PX:191) and changes `business-discussion.yaml:31` and `group-cognition.yaml:27` reviewed units (no `acceptOutcomes`): real findings now fail those runs instead of silently passing. Shared with CURRENT; neither plan addresses it. Tests prove plumbing only; the live run proves advice.

**(c) Fast and light.** Normal THIN run from recorded segments: framing 78 s (PX:81) + shaping ~460 s (PX:187-188) + critique 2 rounds 782 s (PX:200) + reviewed synthesis ~700 s (est. from 958 s incl. specialist, PX:201) + explanation 143 s (PX:204) ≈ 36 min, 1 start, 5 Units, ~11-18 assignments, 1 human touch. CURRENT does the same workers over ≥3 starts plus driver reads between graphs; worker time ~equal, so THIN does not save wall time on the happy path. Specialist case: CURRENT auto-continues (+~16 min); THIN waits for owner, then a full re-run (~36 min) or reopen definition (~15 min). Size: skill ≤200 + YAML ~70 vs CURRENT 1432 src + driver skill + 4 defs.

**(d) Flexibility.** Council plan (`plans/261007-0910-.../plan.md`, "Scope — out") names exactly contextRefs on a template + findings routed out of a pattern as its missing seams: THIN's keep set. Rebuttal debate = one YAML reusing `sameSeat` + `anonymizeInputs` + `blind` rounds (`delphi.yaml:41-46`), 0 src. CURRENT's extra pieces (driver choosing graphs, `unit-outcome:` ref, per-pass budgets) are advisory-specific; each new form would need its own driver. Skill + definitions generalises better; extension stays at YAML level.

## 2. Reality check: can THIN's single live run complete on main?

Main moved 15 commits since base; only 2 dispatch (`3b6b152ee`, `e219bce85`), neither fixes the items below.

Plain-run defects (would hit THIN):
- Blind input read prompt: main copies inputs to `assignmentDir/inputs` (`run.mjs:315`) but `withRunDirReadAccess` adds only runDir (`cli.mjs:241-244`) → Claude seat stalls (PX:89). Keep W's 17 lines.
- Findings → pass (PX:191). Keep.
- Target MCP dialog (PX:71): config only (`--strict-mcp-config`, W `.fgos/config.json`), not on main.
- Per-account trust source (authority +68): operator mitigated by trust entry (PX:198); other targets UNPROVEN.
- Reaper vs concurrent sessions/HOME lifetime (cleanup, PX:141,171): plausible on this busy machine.
- Non-code: PTY (PX:111), quota quarantine (PX:95).

Gate-only: receipt collection (PX:113), unsent-brief phases (PX:217,228), absent pane B3, Unit association/capture.

Verdict: likely completes IF read-access + settlement lines are kept, the MCP flag is applied, run in foreground real PTY, quiet machine. UNPROVEN: reaper race, trust on a fresh target.

## 3. Strongest case and exit conditions

Case: advice quality (gates 1, 2, 4) came from patterns + prompts on main plus ~60 lines; 61% of src is dispatch hardening from chasing crash gates. THIN: same goals minus auto-specialist, one DAG, seams council also needs.

Abandon THIN / fall back to middle road if: live run stalls on a dispatch defect outside the keep set (then land dispatch item first); a named gap appears in >1 of first few real runs and owner finds the round-trip worse than auto-continuation; reopen without affected-only work proves too slow/costly (then allow one registered reopen definition).

Owner would miss: autonomous specialist mid-pass; crash-proof resume; byte-frozen cross-run evidence.

## Unresolved questions

1. Accept a narrow `--context-ref` start input (needed for any reopen)?
2. Allow one registered reopen definition (affected-only), or full re-run?
3. Who adds `acceptOutcomes` to business-discussion/group-cognition after the settlement fix?
4. Land or drop the 880 dispatch lines before the live run?

## Round 2

**(a) Concede.**
- MCP dialog (E:71) and selected-account trust (E:114,152) are plain-path. A live run on a NEW target or account will probably hit them on day one. For mcp-skill-hub the operator trust entry already exists (E:198), so only the MCP flag is needed there.
- The settlement fix also reaches the registered `architecture-advisory` critique (`yaml:35`), not only the two other workflows.
- The valuable part of CURRENT is its generic runtime fixes. Land them, don't drop them.

**(b) Wrong or unproven.**
- **"Baseline never completed live" (CURRENT §1c) is a harness/process artefact, not evidence about the baseline.**
  - Codex got the child tool's non-TTY environment (E:111,119).
  - The other reports were refused because a concurrently edited fgOS test file changed (E:119).
  - The run was not on clean main code either.
  - CURRENT's own row 7 calls it "process, avoidable".
- **Row 2 "caused by contextRefs" is wrong.** Main copies every blind input to `assignmentDir/inputs` (`run.mjs:315`), while `withRunDirReadAccess` grants only runDir (`cli.mjs:241-244`). Any blind Claude seat with a prior-step input hits it. That makes it plain-path (inferred from code, not run on main).
- **"4 of 6 proved" is overstated as end result.**
  - Gates 1 and 2 ran through lead-written `--definition` segments and observer scripts (E:85,240), not a registered flow or skill.
  - Some runs used caller cwd (E:218,247).
  - They prove the mechanism, not the product the owner will use.

**(c) Middle path M: accept, with 4 changes.**
1. **`acceptOutcomes`:** add `[pass, findings]` to the reviewed steps of business-discussion, group-cognition and advisory. Findings after maxRounds are dissent the synthesis should carry, not a failure.
2. **`--strict-mcp-config`:** keep it project-local; never ship it as a default. Add a doctor hint when a target has an `.mcp.json`.
3. **`--context-ref`:**
   - validate it with the same rule as `template.contextRefs`;
   - persist it in the `workflow.start` event;
   - give it to the first step's units.
   - Allow at most ONE extra registered `advisory-reopen` YAML (reviewed recommendation → explanation → close), so a reopen does not rerun the blind seats.
4. **Trust seeding (authority +68, agent-cli-trust +10):** keep it in the separate dispatch item, but land it before M's live run if that run uses a target without operator trust.

Scores for M:
- **Function:** 5/6 goals fully. The specialist need goes to the owner as one batched question at close.
- **Stability:** one fixed DAG, about 130 source lines. The only shared change is the settlement fix, which change 1 covers.
- **Fast and light:** 1 start, 5 Units, about 36 min. A reopen takes about 15 min.
- **Flexibility:** same pieces the council plan needs; a debate is one YAML with no source change.

**(d) What would change my mind.** An M live run on main against mcp-skill-hub, using the installed entry, a real terminal and a quiet machine, stalls on a dispatch defect outside M's keep set. Then the runtime item has to land first, and CURRENT's sequencing is right.

Status: DONE
Summary: M accepted with four changes: acceptOutcomes on all reviewed steps, MCP flag kept project-local, --context-ref plus one reopen YAML, and trust seeding before a new-target run. Baseline "failure" is a harness/process artefact; row 2 is a plain-path main defect.
