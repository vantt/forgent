# Kongming: second opinion on the advisory plan (2026-10-08)

Source: one autonomous run of the `claude` executor on model `fable` via `fgos dispatch execute`, prompted with the owner's concern and the lead's measured numbers. **Limits stated by the run:** direct reads of the worktree diff, the Phase 02 execution report, the document-unification plan and the retirement commit were denied in its sandbox, so the size numbers are the lead's and were only cross-checked against the independent review and `main`; the document-unification comparison is inference. Verdict: CONTINUE WITH CUTS. Its adjustment was later challenged by `opus-advisory-adjustment-redteam-261008.md`.

I have what I can get: the plan set, the Opus review, and main-branch source. Direct reads of the worktree diff, the phase-02 execution report, the document-unification plan and the retirement commit were all denied in this session, so the size numbers below are the ones you supplied, cross-checked only against the review and main.

## 1. Thin design or second engine?

Measured against the plan's own kill list (plan.md:70):

| Indicator | Value | Verdict |
|---|---|---|
| New durable states | brief phase not-started/submitting/submitted/ambiguous, frozen brief proof, control epoch re-issue (review F-5, F-6, herdr-reconcile.mjs:143-213 in worktree) | New state machine, but inside an already-heavy dispatch layer. Main already carries controlEpoch, incarnation and receipt reconciliation (herdr-reconcile.mjs:66-125, 342-474). This is dispatch hardening, not an advisory engine. |
| New CLI doors | one: `workflow start --definition` | Acceptable, but it is the door through which prose-scheduling can re-enter. |
| New definition fields | contextRefs, acceptOutcomes, description-lineage labels, reopenRound | contextRefs + acceptOutcomes are small (definition.mjs +35). Lineage and round budgets are driver state kept in prose. Watch item. |
| Second store/registry/roster | none found | Pass. |
| Source split | 60% of +1432 in dispatch/confinement, 39% in the five contracts | The plan's declared scope is only the 39%. |
| Tests to source | 2.3x | Normal for this repo, but 3259 test lines for "a thin skill" shows this phase is runtime hardening wearing the advisory label. |
| Documents | plan + 4 phases + 3 reports + 190-line review + 314-line execution report, versus a 55-line YAML and 390-line skill | The paperwork about the advisory is already larger than the advisory. |

Verdict: not a second engine yet. It is a runtime-hardening track that got filed under a skill plan, and the gate structure keeps pulling it deeper. The actual engine risk is Phase 03's "skill reads reports and picks the next finite graph" (phase-03:14-20, :60). The plan itself names that shape as a sequencer if the driver holds queue, retry or transitions (phase-02:76). Nobody has yet shown the skill text, so this remains unproven either way.

## 2. Which contracts are load-bearing

- **Contract 1, panel params.** Load-bearing for "three different viewpoints". Main drops params for panelists (panel.mjs:64-69) while the synthesizer gets them (panel.mjs:92). A few lines. Keep.
- **Contract 4, acceptOutcomes.** Load-bearing for "dissent reaches explanation". reviewed.mjs:376-382 returns `findings` and the Workflow treats it as fail. Keep. It is tiny.
- **Contract 3, contextRefs + provenance.** Load-bearing only because the design splits one advisory into several Workflow runs. Within a single run, the runner already passes every prior report as `unit-run:` refs and gate answers as `gate-answer:` refs (runner.mjs:40-114). Keep the cross-run ref, cut the byte-capture-and-refuse-on-resume repair unless a test shows a changed input silently reused.
- **Contract 2, `--definition`.** Gold-plating if the continuation shapes are fixed. Three or four registered definitions under core/workflows (analysis, recommendation, specialist+recommendation, explanation+close) plus contextRefs make it unnecessary. Keep only if it is already smaller than registering definitions.
- **Contract 5, durable Unit association.** A real Workflow runner bug, but generic, not advisory. It belongs in its own item with deterministic tests. It is not one of the six goals; "recovery does not duplicate settled work" is a quality of the runner, not of the advice.

Goals met at prompt and definition level alone: three viewpoints (after contract 1), critique plus red-team of the final packet (reviewed pattern with rigor high, reviewed.mjs:24-29, with producer = synthesizer), human words verbatim (request field plus close gate, already there), read-only confinement (already there). Smallest design: contracts 1, 3-lite, 4 plus registered definitions and a skill of about 200 lines.

## 3. Launch-before-brief recovery

Out of scope. It is not among the five contracts (phase-02:28-54) and it exists because Gate 5 demanded a live interrupted-Unit proof on herdr, and the live proof exposed a dispatch bug. It is a symptom of chasing a perfect live proof. Extract it to a dispatch item on its own branch, with the two open HIGH risks (ambient namespace in reaper and recovery client) and F-3, F-5, F-6, F-7. The advisory plan does not wait for it. Gate 5 becomes a deterministic Workflow test only.

## 4. The seven-gate structure

Yes, it causes it. "ACCEPT only with evidence for all seven; phase stays blocked; no deferred foundation" (phase-02:78) plus live-only proof rewards manufacturing evidence. That is exactly what happened: a controlled worker loss and a lead-written continuation with the verdict inside the objective (review F-1). Honest and lighter:

- Deterministic tests own gates 4 and 5 and the negative half of 3.
- One live advisory run on a real external target owns gates 1, 2 and 6, judged by the owner reading the advice.
- Gate 7 is one write-denied probe, already done; do not repeat.
- Gate 3's unavailable-specialist path is a skill rule, not a live scenario: "specialist Unit not settled means explanation states the gap", tested with a fixture.

## 5. Shared root cause with document-unification

I could not open that plan, so this is inference from the advisory plan only: an all-or-nothing acceptance clause ("every row proved", "all N live") with no size or time box. When proof is hard, an agent builds tooling or scenarios to produce proof rather than report the gap. The 17k-line tool and the engineered worker loss are the same move.

## 6. Verdict

**CONTINUE WITH CUTS.**

Next two hours:

1. Freeze the branch: no new src lines. Split the dispatch hardening (herdr-round, herdr-reconcile, authority, settlement, proof-helpers, cleanup, agent-cli-trust, request, transport, their tests) to its own branch and work item, carrying F-3, F-5 to F-7 and the two HIGH risks.
2. In the advisory branch keep panel params, acceptOutcomes, contextRefs, Unit association with their deterministic tests. Apply review items 1 to 4: restate Gate 3, restore the guard test, revert the GitNexus hunks, fix runner.md and CHANGELOG.
3. Rewrite the Phase 02 exit to the four-point acceptance above and mark it done.
4. Start Phase 03 today: skill of at most 250 lines, at most four registered definitions of at most 60 lines each.

Kill criteria from here: more than 100 new src lines in the advisory branch, any new durable file or store field, a third Workflow door, a driver that tracks rounds in anything but the run description, or Phases 03 and 04 not closed by end of 2026-10-10. On any of these, ship contracts 1, 3 and 4 alone and write the skill over the existing five-step YAML.
