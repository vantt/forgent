# Council Verdict: Mechanical Dissent/Agreement Gate for fgOS `panel`

(Phía council của thử nghiệm A/B 2026-10-04: full mode, 3 ghế Socrates/Torvalds/Meadows, tất cả Claude sonnet; Chairman Claude opus; 13 lần gọi agent: 3 restate, 3 vòng 1, 3 vòng 2 tuần tự ẩn danh, 3 enforcement, 3 vòng 3, 1 Chairman. Bản chép nguyên văn đầu ra của Chairman.)

## Problem

Should fgOS add mechanical quality gates to the `panel` collaboration pattern (`src/runner/execution/patterns/panel.mjs`)? The proposed gates come from council-of-high-intelligence:

1. a dissent quota;
2. an agreement check that forces a counterfactual above 70% agreement;
3. an anonymized cross-examination round;
4. a confidence-weighted tally that returns a genuine split.

The alternative is that provider-distinct panelists, a different-family synthesizer (`bind()`), and `reviewed.mjs`'s red-team already resist false consensus well enough.

## Council Composition

| Seat | Lens | Weight |
|---|---|---|
| Socrates | Destroying assumptions | 1.0 |
| Torvalds | Shipping and maintainability | 1.0 |
| Meadows | Feedback loops and leverage points | 1.0 |

- Mode: full. Panel size: 3.
- No seat got the 1.5x domain weight. The coordinator did not designate one before analysis, and this is recorded as a process gap.
- Members read the fgOS repo read-only and cited file and line.

## Chairman

- **Name:** Chairman (synthesizer only; did not deliberate)
- **Provider:** Anthropic / Claude
- **Model:** opus
- **Rationale:** Single-provider fallback. The Chairman shares a provider with every panelist, so it gives no provider-level independence from them. Treat this synthesis as checking the panel's reasoning, not as an independent second opinion.

## Provider Routing

- All three members ran on Claude/sonnet. The Chairman ran on Claude/opus.
- No model from another provider took part at any stage, including the enforcement counterfactuals.
- The council's own setup is therefore the correlated-priors situation it was asked to judge. Its unanimity is weak evidence about whether provider diversity matters.

## Acceptable Compromises

1. **Synthesizer contract instead of a gate.** The synthesizer prompt must: name each panelist's position verbatim; keep a material split as a split; never invent consensus. No new outcome state and no extra call. All three members endorsed this.
2. **One counterfactual line, no extra call.** When every panelist's stance matches, the synthesizer adds one line: "strongest reason this could be wrong." It goes in the same synthesizer call. This closes most of the distance between Socrates' enforcement-round alternative and the majority. Torvalds called it "a cheap prompt line, not harmful, but unproven."
3. **A non-blocking sensor with a structured stance field.** Each panelist emits a one-line `STANCE:` token. The run persists every panelist's stance and an agreement ratio computed deterministically from those tokens, not by an LLM judge. Nothing blocks on it. The structured token is the Chairman's own addition: without it, the sensor needs the same free-text "agree" judge that Torvalds costed against gate 2.
4. **Gate 2 documented only.** The forced counterfactual from two members on unanimity is written up as a default-off parameter, not built, until the kill criteria below fire.

## Kill Criteria

The decision is "no gate, add sensor." Revisit it when any of these is observed:

| ID | Condition | Action |
|---|---|---|
| K1 | The 2-vs-1 split fixture test finds that the synthesizer output drops or merges the minority position, after the contract change. | The contract alone is not enough. Escalate to a structured split field in the synthesizer output schema. |
| K2 | Over the first 30 logged panel runs, at least 90% have a unanimous stance. | Build gate 2 as a default-off parameter. Socrates' suspicion of correlated priors becomes the working assumption. |
| K3 | At least 1 logged unanimous panel is later reversed by the `reviewed.mjs` red-team or by a human revision of the decision within 14 days. | Turn on the forced counterfactual for high-rigor runs. |
| K4 | The counterfactual line appears in at least 10 unanimous-panel outputs, and it is boilerplate (no reference to the specific question) in at least 50% of them. | Drop the line. Socrates named this as his own flip condition. |
| K5 | The sensor has run 60 days and nobody has read or queried it, so K2 and K3 were never checked. | Treat the sensor as decoration. Name an owner or delete it. |

## Concrete Next Step

Ship the synthesizer split-preservation contract with a 2-vs-1 split fixture test by 2026-10-11.

## Unresolved Questions

1. **Does false consensus happen in fgOS panels at all?** No incident is recorded, and no sensor exists that could record one. Socrates' point stands: silent false consensus leaves no evidence, so "no evidence" is ambiguous today.
2. **How is "agreement" measured?** On free text, an agreement ratio needs an LLM judge, which is the same cost Torvalds charged against gate 2. The council endorsed the sensor without settling this. The structured `STANCE:` token is the Chairman's suggested fix, not a council position.
3. **Who reads the sensor, and what makes them act?** Socrates' final question went unanswered. No owner, review cadence, or alert was named.
4. **What counts as "overturned"?** It could be a red-team reversal, a human edit, or a later contrary decision. The red-team may share priors with the panel (Meadows), so its verdict may not be an independent judge.
5. **Do provider-distinct panelists actually decorrelate priors?** Socrates labelled this plausible but unverified. This council was single-provider and cannot answer it.
6. **Does today's synthesizer prompt flatten splits?** Meadows confirmed that `memberResults` reach the synthesizer whole, so plumbing is not the risk. Prompt behavior has not been tested. (Ghi chú của discussion lead: khẳng định "plumbing không phải rủi ro" **sai** ở tầng `runRole`; xem báo cáo chính.)
7. **What panel size do real runs use?** At N=3 the 70% threshold can only mean 100%, as Socrates noted. The right threshold depends on the actual distribution of panel sizes.

## Recommended Next Steps

1. Change the synthesizer prompt contract: name each position verbatim; keep the split; add no invented consensus; add one counterfactual line on unanimity. Back it with a 2-vs-1 fixture test. This is the Concrete Next Step.
2. Add the `STANCE:` token to the panelist output contract. Persist the per-panelist stances and the deterministic agreement ratio on every run, non-blocking, in about 20 lines.
3. Name the sensor's reader. Either a person reviews it monthly, or `fgos doctor` (or a metrics verb) flags when K2 or K3 trips. Per AGENTS.md's install/setup/doctor gate, register this with doctor so it can be found.
4. Write the gate 2 default-off design down in the panel area spec, under its decision-history section, with K2 and K3 as the named triggers. Do not build it.
5. Leave gate 3 (an anonymized cross-examination round) and gate 4 (a confidence-weighted tally) out of panel. Gate 3 is a full extra round, which works against Ship Faster. Gate 4 depends on poorly calibrated self-reported confidence. Its useful part, returning a genuine split, is already covered by step 1.

## Consensus & Agreement

**Final positions.** All three members reached "no gate, add sensor," and none declared a dealbreaker. The agreement is real but cheap: it was 100% from Round 1, which is why the agreement check fired.

**What the council agreed on:**
- Gates 1 (dissent quota) and 3 (cross-examination round) should not be added.
- The highest-leverage change is the synthesizer's rule for handling a genuine split, not the parameters (quota of 2, 70% threshold).
- A dissent quota certifies a form of disagreement, not real disagreement. This is the Goodhart point, raised by Socrates and Meadows.

**How the sensor appeared.** In Round 2, all three rejected "log agreement first." After the enforcement step, all three adopted a sensor. The reversal came from Meadows' argument that the majority's own trigger, "a documented overturned unanimous panel," has no sensor behind it and so can never fire. That argument is valid, and the change of position was justified.

**Chairman observation (not a member position).** In this session, the mechanical dissent and agreement gates are what produced the sensor. Members' Round 2 positions did not include it. That is n=1, on the council's own protocol, with same-provider respondents, so it does not prove the gates work. It is the only evidence in the record that a forced counterfactual changed an outcome, and it slightly strengthens Socrates' minority view.

## Vote Tally

| Member | Stance | Confidence | Weight | Score |
|---|---|---|---|---|
| Socrates | no gate, add sensor | med | 1.0 | 0.75 |
| Torvalds | no gate, add sensor | high | 1.0 | 1.00 |
| Meadows | no gate, add sensor | med | 1.0 | 0.75 |
| **Total** | | | W_total 3.0 | **2.50** |

The threshold of 2.0 is cleared. There was no dealbreaker dissent and no seat carried 1.5x weight.

## Key Insights by Member

**Socrates**
- A quota is satisfied by compliance, so it certifies a form, not disagreement.
- The 70% threshold can't be reached at N=3: the only possible values are 67% and 100%.
- Of the four gates, only the split-returning tally changes what the person receives.
- Silent false consensus produces no evidence, so "wait for evidence" is not free.
- Without a named reader and a trigger, a log is decoration.

**Torvalds**
- `panel.mjs` is 88 lines, and independence is already enforced in code (`independentOf`, and `bind()` choosing a different-family synthesizer).
- Gates 1 and 2 each need an extra LLM judge plus a re-prompt loop and a new outcome state.
- The fix belongs in the synthesizer prompt, proven by one fixture test rather than a research program.
- A sensor is about 20 lines.

**Meadows**
- The real stock is independent dissent. A gate acts on a measure of that stock, not the stock itself: the "fixes that fail" pattern.
- A forced counterfactual from two members on one provider is a correlated loop.
- She verified that `memberResults` reach the synthesizer whole, so any flattening lives in the prompt contract.
- The majority's trigger had no sensor and could never fire.

## Points of Disagreement

1. **Counterfactual now or later.** In the enforcement round, Socrates argued for a counterfactual on every unanimous run now, at one extra call. In Round 3 he moved to "conditional follow-up." Torvalds considers it a harmless prompt line but unproven. *Status:* resolved by Compromise 2 (one prompt line, no extra call). The question of gating it behind an extra call stays open under K3.
2. **Log first or fix first.** In Round 2, all three called "log agreement first" delay presented as rigor. After enforcement, all three adopted a sensor. *Status:* resolved. The sensor runs alongside the fix and does not delay it.
3. **Is detection machinery worth it?** Torvalds (Round 2) called an overturned-unanimous detection pipeline speculative. Meadows and Socrates say the trigger is useless without one. *Status:* partly resolved. The sensor persists data but does no detection. Who acts on it is still open (Unresolved Question 3).

## Minority Report

No member held "add the full gates," and none is invented here.

The live minority is Socrates' enforcement-round position. The council's evidence rule has a hole: false consensus that stays silent never produces an overturned case. Provider-distinct panelists may share priors. A minimal deterministic counterfactual on unanimity is therefore justified now, at the cost of one call, paid only on unanimity.

- He would flip to "no gate" if a red-team spot-check of logged unanimous panels finds nothing, or if the counterfactual proves to be boilerplate.
- He would flip to "full gates" on even one overturned unanimous panel.

Socrates moved back to the majority stance in Round 3. Even so, the argument was never refuted on its merits, only deferred. Compromise 2 and kill criterion K3 partly carry it forward.

## Epistemic Diversity Scorecard

- **Perspective spread: 3/5.** The three lenses were distinct, but Torvalds and Meadows largely overlapped on cost and leverage, and all three converged from Round 1.
- **Provider spread: 1/5.** Single provider throughout. The Chairman is on the same provider.
- **Evidence mix:** about 36% mechanistic, 27% empirical, 18% strategic, 18% heuristic. These shares come from 11 self-labelled claims in Round 2. Only Meadows' `panel.mjs` read and Torvalds' Round 1 file reads were verified against code. Socrates labelled his own empirical claim unverified.
- **Convergence risk: High.** The panel was single-provider and agreed 100% from Round 1, so the agreement check fired. The question under debate was whether exactly this kind of panel produces false consensus, and the panel could not test that about itself.

## Follow-Up

> Run this same question again on a panel that includes at least one non-Claude provider (for example openai or xai as panelists, with the synthesizer on a third family). Designate a 1.5x seat in advance for whoever owns `src/runner/execution/patterns/`. Then compare that panel's per-member stances with this council's. If its agreement is below 100%, or a new position appears, treat that as the first data point for Unresolved Question 5 (whether provider diversity actually decorrelates priors), and decide whether K2's 90% threshold should be tightened.
