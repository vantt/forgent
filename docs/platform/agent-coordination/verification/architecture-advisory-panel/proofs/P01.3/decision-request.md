Phase 4 — Ask Reluctantly But Clearly | Cell P01.3 | Coordinator

## Verdict: no Decision Request sent yet — reasoning below

Per SCOUT BEFORE ASK, evaluated every candidate gap surfaced by
interpretation.md and scout-report.md for (a) genuine user-exclusivity and
(b) materiality (would the recommendation actually differ by answer).

| Candidate gap | User-exclusive? | Material now? | Disposition |
|---|---|---|---|
| "EOD and intraday evolution" — joint difficulty (coordination cost at the seam) or several difficulty (each pipeline is locally hard on its own)? | Partially — the felt experience is the person's, but the mechanism is scoutable | Yes, in principle | **Largely resolved by scouting.** The commit-scope table (EOD-only 6, intraday-only 0, both 3, post-`c64de07`) shows evolution is not purely joint — most touches are EOD-only. Combined with the found context-loading/port/shared-alert-state seams, the evidence leans toward "several, plus specific real coupling points" rather than a single joint-coordination cost. Carried into Phase 5 as an evidenced lean, not a settled fact — shapers may still disagree. |
| "Difficult" — for whom, at what moment (writing, reviewing, or discovering where a change goes)? | **Yes — only the person can say** | Not material enough to block Phase 5: the three named options (A/B/C) don't turn on which sub-meaning of "difficult" is intended; a shared-contracts fix, a pluggable abstraction, and a reframe would each address some sub-meanings and not others regardless | **Not asked now** — each Phase 5 shaper states its own explicit working reading of "difficult" up front (doctrine already requires naming assumptions); divergence here is itself useful signal for Phase 6/7, sharper than asking blind now |
| "The right decision" — right in principle, or right now (timing vs design)? | **Yes — only the person can say** | Affects urgency/sequencing framing, not the underlying technical shape of what changes at the pipeline boundary | **Not asked now** — carried as an explicit named dependency into Phase 7/8, same pattern as P01.2's "product bet vs. spike" gap. Phase 8's explanation names it plainly as part of "what stays theirs." |
| The reach of "reframe the problem elsewhere" — bounded to this repo, or does it include whether both paths need to exist at all? | Partially — scout can supply candidate reframings, final acceptance is the person's | Yes | **Partially resolved by scouting, not fully closed.** Scout found the difficulty is not purely "one pipeline or two": persisted-data contracts (EOD regime/sector reads), an incomplete port boundary, and a discriminator-less shared alert dataset are all real reframing candidates already evidenced. Shapers are instructed to treat "elsewhere" as licensed by this evidence, not just the person's escape hatch — but final scope stays open into Phase 5/6/7. |
| What has already been tried at this seam, and what forces the two paths to move together? | No — scout-answerable | Scout already answered the "forces joint movement" half concretely | **Resolved by scouting.** Real forcing mechanisms found: intraday reads EOD's persisted regime/sector-rotation output directly (not through the DAG's own dependency graph, so staleness/failure there is invisible to the runner); both call the same `evaluate_buy_gate` and `score_money_flow`; alert dispatch shares one undiscriminated dataset. "What was already tried" (the C64de07 progress-registry split) is in the commit history and is carried forward as precedent, not asked. |
| Whether the intraday breadth-gate bypass (`pct_sectors_leading` defaulting to `None`) is intentional policy or a missed propagation | Not fully — could be scouted further (e.g. checking whether any doc/commit message discusses breadth for intraday specifically), but the panel judged the marginal scouting cost not worth it for a Phase 4 gate | Not material to the pipeline-architecture question itself — true under any of the three options, it is a defect/policy note orthogonal to "how many pipelines" | **Carried forward as a flagged, unresolved finding** into Phase 5/6 for shapers and critic to reason about (e.g. as evidence for "shared contract without shared enforcement" being a real failure mode a chosen architecture should address), not escalated to the person now |
| Whether duplication/drift is the dominant cost, whether it is accelerating, and current production scale/latency/failure frequency | **Yes — only the person has this** | Not blocking Phase 5: shapers can and should produce proposals that are explicit about which severity assumption they're conditioned on, and the mismatch (if any) becomes real content for Phase 9's real dialogue rather than a guess now | **Not asked now** — reserved for Phase 9's real dialogue with the actual person, where a concrete synthesis exists to react to. Phase 7 must state this dependency explicitly rather than silently assuming an answer. |

**No question meets both bars (user-exclusive AND material enough to change
what Phase 5 should produce) strongly enough to justify interrupting now.**
The panel proceeds into Phase 5 with four explicit carried-forward
defaults, stated in every shaper's prompt:

1. Scout evidence leans toward "several, plus specific real coupling
   points" rather than pure joint-coordination cost — an evidenced lean,
   not a settled fact; shapers may still disagree and should say why.
2. "Difficult" is each shaper's own to define explicitly up front —
   divergence here is useful signal, not an error.
3. "Reframe elsewhere" is licensed by real scout evidence (persisted-data
   contract, incomplete port boundary, undiscriminated shared alert
   state) — shapers are not limited to "one pipeline or two" as the axis.
4. Severity/urgency (is this worth paying to fix, and how urgently) is
   explicitly out of scope for the technical proposal itself; each
   proposal must name the severity assumption it is conditioned on, to be
   confirmed or corrected by the actual person in Phase 9.

This is a recorded decision, not a skipped step — this file exists so a
successor coordinator does not re-ask what was already reasoned through.
