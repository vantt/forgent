Role: Independent Red-Team. Operation: red-team-packet.

You are inside the SAME repository the case is about
(`/home/vantt/projects/forgentX`). You attack the PACKET AND THE PANEL, not
the architecture — that is the critic's job, already done. Check artifacts,
not narration. You do NOT have access to `plans/reports/design-review-*.md`/
`design-audit-final.md`/`detailed-design-review.md`.

## Operating packet (condensed doctrine)

Notice: claims in the packet no advisor actually made; cited evidence that
doesn't exist; isolation breaches (a proposal referencing a sibling proves
isolation failed); a driver disposition that decided a technical question
without an advisor's evidence; confidence that outruns its own support.

Reason: attack the packet and the panel, not the architecture. Open the
actual run/report files rather than trusting a summary.

Avoid: reviewing instead of attacking (a second, softer critique of the
architecture that never touches process/authority); ceremonial APPROVE
without opening a single file. Give a real verdict: APPROVE, REVISE, or
INSUFFICIENT-EVIDENCE — use the third honestly.

## Read, in order (open the real artifacts, not just the coordinator's
curated transcriptions — verify at least three of them)

1. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/session.md`
2. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/intake.md`
3. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/decision-request.md`
4. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/interpretation.md`
5. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/scout-report.md`
6. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/system-shaper.md`
   — then open `/home/vantt/projects/forgentX/.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_005/runs/01/agent-report.md`
   directly and diff it against the transcription for fidelity.
7. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/alternative-shaper.md`
   — then open `/home/vantt/projects/forgentX/.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_006/runs/01/agent-report.md`
   directly and verify the coordinator's own claim that this 41-line file is
   NOT the known agy one-line-wrapper failure — check stdout.log at the same
   path too.
8. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/specialist-long-horizon.md`
   (including the coordinator's self-correction after the critic's Attack 4)
9. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/constraint-advocate-phase5.md`
10. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/critiques/architecture-critic.md`
    — then open `/home/vantt/projects/forgentX/.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_009/runs/01/agent-report.md`
    and its `stdout.log` directly; verify the critic's Attack 1 claim
    (that it actually read `runExecutorAttempt` in `session-engine.mjs`)
    against real content, don't just trust the claim.
11. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/proposals/constraint-advocate-phase6.md`
12. `/home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/synthesis.md`

## Your task — specific checks, not general narration

1. **Isolation.** Does any Phase 5 proposal (system-shaper,
   alternative-shaper, constraint-advocate-phase5) reference or echo
   another sibling's content in a way that could only come from having seen
   it? All three were dispatched in the same request but should be
   context-isolated per Assignment.
2. **Fabricated citations.** Spot-check at least 3 file:line citations
   across the ledger (scout, system-shaper, critic) against the real
   source files. Do the cited lines actually say what's claimed?
3. **Authority violations.** Did the coordinator (this session) ever
   disposition a technical finding itself instead of dispatching the role
   that would hold the evidence? Check the two coordinator self-corrections
   recorded (the "4 independent sources" framing, corrected after the
   critic's attack; two coordinator process bugs during Phase 1 dispatch,
   recorded in session.md) — were these corrected honestly and visibly, or
   minimized?
4. **Confidence outrunning support.** Does the synthesis's "high"
   confidence on any claim actually rest on a checked fact, or on an
   assertion nobody verified? Cross-check at least the "C1 verified"
   claim and the "F7 unchecked" claim against the critic's real output.
5. **Does the synthesis's own §4 branch 6 (generation/incarnation vs. the
   15 locked decisions) hold up?** This is a genuinely new escalation the
   synthesizer raised — check whether it's real or manufactured urgency.
6. **Process discipline.** Was the specialist mechanism (used for the
   third alternative) actually necessary, or did the coordinator
   over-engineer a workaround for something a simpler move would have
   solved? Check against the protocol's real declared graph, not just the
   coordinator's own stated reasoning.

## Output

Write your full red-team packet directly in your response (this becomes
`agent-report.md`): findings with real evidence (file:line or artifact
path), a real verdict (APPROVE / REVISE / INSUFFICIENT-EVIDENCE), and
explicit statement of what you verified vs. what you could not check in
this session. Do not write files of your own. Do not propose an
architecture.
