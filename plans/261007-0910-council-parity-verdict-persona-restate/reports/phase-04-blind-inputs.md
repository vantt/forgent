# Phase 04 blind judge inputs (2026-10-10)

Judge prompt:

```text
You are an independent blind judge. Read the file judge-input.md in full. It has three questions (Q1, Q2, Q3); each has 2–4 anonymous candidate answers (A, B, ...) to the same question, produced by unknown methods. You know nothing about their source; do not guess it, and do not reward length, formatting or tone for their own sake.
Score every candidate 0, 1 or 2 on each of five rows:
1. Perspective spread: distinct, genuinely different viewpoints represented, not one view restated.
2. Decision clarity: a clear position or decision the reader can act on, with what would change it.
3. Counterfactual depth: what happens under the rejected options, failure modes, kill criteria.
4. Evidence discipline: claims tied to supplied facts or checked evidence; unknowns and assumptions labelled; no invented facts.
5. Execution quality: one concrete next step, unresolved items surfaced, internally consistent.
Rules: score each candidate on its own merits before comparing; within a question, give a strict ranking; quote at most one short phrase per row as evidence; flag any candidate that invents facts not in the question. For Q1 the question names repository files you cannot check unless you open them; you may read them read-only in /home/vantt/projects/forgentX but are not required to. Do not modify any file.
Output exactly: per question a table (candidate x five rows + total /10), the ranking, and 2 sentences on the main difference between top and bottom. End with: Status: DONE.
```

Candidates below are exactly what the judge read (titles and source labels removed, labels shuffled).


######## QUESTION Q1

DECISION QUESTION (council-style, read-only, give a position): fgOS's `panel` collaboration pattern (src/runner/execution/patterns/panel.mjs) runs N independent panelists in parallel then a synthesizer on a different provider. The 'council-of-high-intelligence' project adds mechanical quality gates around such a panel: (1) a dissent quota (at least 2 non-overlapping objections else re-prompt), (2) an agreement check (>70% agree -> force a counterfactual from 2 members), (3) anonymized cross-examination round, (4) a confidence-weighted tally that returns a genuine split to the user instead of forcing consensus. Should fgOS add a mechanical dissent/agreement gate to the panel pattern, or is provider-distinct panelists plus the reviewed pattern's red-team already enough? Read the repo to ground your answer (panel.mjs, reviewed.mjs, docs/specs). Reply with: your position, the 2-3 strongest reasons with file:line evidence, what would change your mind, and one concrete next step. Maximum 300 words.


======== Q1 / Candidate A


## Panelist positions

**voice 1 — No gate now; measure first.** The gap is already covered by design (`role-tasks.mjs:15` synthesizer told to keep disagreement visible; `panel.mjs:83-92` synthesizer forced onto a different provider family; `reviewed.mjs:24-29,52-54` red-team at high/critical and for `code:*`). The repo already settled that agreement is a **passive measure, not a gate** (`runner.md:1442`), with explicit re-visit conditions K2 (≥90% of first 30 panel runs unanimous) and K3 (a unanimous panel later reversed) — no data yet, so a gate now would reverse a settled decision on speculation. Mechanical gates also cost what fgOS prioritizes (ship faster, release humans) and the "non-overlapping objection" quota isn't truly mechanical (needs an LLM judge). Mind-changer: K2 holds AND K3 fires, or evidence panelists correlate. Next step: run `fgos metrics discussions` over existing panel runs and report the agreement/genuineSplit distribution.

**voice 2 — No universal gate; opt-in workflow only if evidence warrants.** `runPanel` has deliberately small structural semantics — no typed claim/objection/vote contract from which "non-overlapping objection," agreement, or confidence could be reliably computed (`panel.mjs:50-103`); synthesizer independence is enforced end to end (`panel.mjs:93-99`, `bind.mjs:189-213` rejects same-provider-family absent human override). The passive-agreement decision is deliberate prior art, not omission (`runner.md:1442`). Adversarial assurance is correctly scoped to `reviewed` (`reviewed.mjs:24-56`) and cross-examination belongs in a separate workflow step (`runner.md:1444`). Mind-changer: first 30 logged panels meeting K2/K3, or a typed non-gameable vote schema. Next step: query stance summaries against K2/K3; if triggered, design an opt-in `council-deliberation` workflow without altering `panel`.

**voice 3 — No gate; the cheap fix is the synthesizer schema.** fgOS patterns are minimal, stateless loops (`panel.mjs:50-105`, `runner.md:3057`); mechanical gates would turn a fast 4-call fan-out into a 13-call stateful sequencer, violating L1/L8 and blurring primitives with workflow coordination. Crucially, it cites a **different evidence class**: an A/B comparison (`plans/reports/council-ab-comparison-261004.md:42-73`) showing the performance gap closed significantly (2→5/10) simply by wiring panelist outputs into synthesizer `contextRefs`, with remaining gains attributed to a `verdict-unresolved-first` synthesizer prompt schema — not to gating loops. Adversarial rigor already exists (`reviewed.mjs:27-28,52-54`, `hasVerifyCommand` at line 67); deliberation belongs in workflows like `core/workflows/council-lite.yaml`. Mind-changer: A/B runs showing prompt-based stance schemas fail to unmask false consensus >80% on dilemma tasks. Next step: standardize the `verdict-unresolved-first` output template in the synthesizer role prompt.

## Disagreement kept visible

- **Unanimous on the headline — all three reject a mechanical gate on `panel.mjs` now** — but they differ on what should happen instead:
  - voice 1: pure measure-first — **add nothing** until the K2/K3 data says otherwise.
  - voice 3: ship the **synthesizer prompt-schema fix now** (verdict-unresolved-first, explicit minority tally) — an active change backed by A/B evidence, not just waiting.
  - voice 2: no base-pattern change, but endorses building a **separate opt-in gated workflow** if K2/K3 trigger — the most permissive toward the council features.
- **Evidence classes differ:** panelists 1-2 ground in spec prior art (settled passive-measure decision, K2/K3); panelist 3 grounds in an A/B experiment that attributes remaining gains to prompting, not gating. These aren't contradictory but aren't the same claim — the A/B report does not test K2/K3 false-consensus incidence.
- voice 1 notes voice 3's schema fix is cheap and low-risk; no one disputes it.

## Recommendation

**Do not add a mechanical dissent/agreement gate to the `panel` pattern.** The requested features remain available as future opt-in workflow composition if evidence demands. Concretely, in order:

1. **Run the already-built passive sensor now** (voice 1's next step, also voice 2's): check `fgos metrics discussions` / stance summaries against K2 and K3. This is the repo's own pre-committed decision trigger.
2. **Standardize the `verdict-unresolved-first` synthesizer template** (voice 3's next step): explicit minority stance reporting and unresolved questions before the verdict — cheap, primitive-pure, and the A/B evidence says it captures the remaining quality gain.
3. If K2+K3 fire, prototype an opt-in `council-deliberation` workflow (voice 2) — dissent quota, anonymized cross-examination, confidence tally — composed from existing primitives, never as a gate inside `panel.mjs`.

**Evidence for it:** `docs/specs/runner.md` (agreement is passive, not a gate; verbatim K2/K3 re-visit conditions — verified in repo); `src/runner/execution/patterns/panel.mjs` (synthesizer `independentOf: allPanelistRoles` — verified); `src/runner/execution/patterns/reviewed.mjs` (red-team mandatory at high/critical and for `code:*` — verified); `plans/reports/council-ab-comparison-261004.md` (A/B: contextRefs wiring + prompt schema, not gates, closed the gap); unanimous position across all three independent panelists.

**Caveat:** No panelist verified K2/K3 against live logs; voice 1 flagged this explicitly. The recommendation's step 1 exists precisely to close that gap.


======== Q1 / Candidate B

## Unresolved evidence — restatement mismatches (report first)

1. **Unit-of-decision mismatch.** voice 3 restated the question as the *full four-mechanism bundle* (dissent quota + 70% agreement check + cross-examination + weighted tally) inside `panel.mjs`; Seats 1-2 restated it as a narrower add-or-not decision. The mechanisms are separable (the repo already separates them: stance sensor exists passively, `gated: true` exists dormant), so the yes/no frame itself is contested and remains unresolved.
2. **voice 3 internal tension.** It declared "designing custom council workflows in `core/workflows/`" out of scope, yet its own next step proposes exactly that. Whether the experimental-workflow path is in or out of scope is unresolved.
3. **voice 1 admitted evidence gap**: it never read `reviewed.mjs` in full, only grep hits. Spot-check here confirms its claim stands (`reviewed.mjs:24-28`: red-team only at high/critical/code rigor, checking a producer post-hoc — not a panel safeguard), but the seat's evidence trail was partial.

## Each seat's explicit position

- **voice 1:** No gate now. The passive agreement sensor already exists with pre-registered review conditions K2 (≥90% of first 30 panel runs unanimous) and K3 (≥1 unanimous panel reversed by red-team/human within 14 days) — runner.md observe section. Gate only if those fire.
- **voice 2:** Add a narrow, opt-in deliberation gate — declared stance/confidence, two counterfactual seats above 70% agreement, structured split return — reusing the dormant `gated: true` seam (`presets.mjs:28-35`, no implementation in `panel.mjs`). Explicitly rejects the dissent quota.
- **voice 3:** No mechanical gate. `panel.mjs:50-105` stays a lean shared primitive; provider-family isolation (`:63-69,97`) plus orthogonal postures plus `reviewed`'s red-team suffice. A forced quota is a reinforcing noise loop (fabricated objections degrading synthesis).

## Agreement and genuine split (no invented consensus)

**Real agreement:** all three seats reject the dissent quota mechanism (1) — Seats 1/3 on fabricated-dissent/noise grounds, voice 2 explicitly ("do not impose a quota; genuine unanimity should remain possible"). All three accept returning a genuine split to the user in some form. All three agree `reviewed`'s red-team does not cover panels (only high/critical/code rigor, producer-based).

**Genuine split — unresolved:** the agreement-threshold counterfactual gate (mechanism 2). voice 2 says build it opt-in now on the existing `gated` seam; Seats 1 and 3 say wait for empirical evidence (K2/K3). This split is genuine and unresolvable from the supplied evidence.

## Conditions that would change the verdict

All seats converge on empirical falsification: K2 holding (≥90% unanimous in first 30 logged runs) AND K3 firing (a unanimous panel reversed by `reviewed` red-team or a human within 14 days) flips voice 1 toward a gate; recorded stance data showing independent panels rarely hide material counterarguments flips voice 2 toward no-change; evidence that a counterfactual gate resolves false consensus without spawning spurious dissent flips voice 3. No seat named a condition that validates the quota — it is rejected unconditionally.

## One concrete next step

Run the existing passive stance measurement over logged panel runs (e.g. `fgos metrics discussions` / the unit-summary stance read model) and report the K2 number — the shared precondition of all three seats' flip conditions, requiring zero code change.


======== Q1 / Candidate C

---



### Position

**Do NOT add mechanical gates to `panel.mjs`.** Provider-distinct panelists plus the existing `reviewed` red-team injection are sufficient. The right intervention is a *passive measurement* — structured result shape with `positions[]`, `confidence`, `distinctObjections` fields — that lets the system observe consensus patterns before any automated gate is designed.

### Panelist Consensus

- **Panelist 1:** Favor a narrow, opt-in mechanical disagreement gate (structured positions, >70% counterfactual round). Minority position.
- **Panelist 2:** Strong NO. Provider independence + red-team already suffice. Mechanical gates bloat the pattern and manufacture bikeshedding, violating Ship Faster (D-ADR0030).
- **Panelist 3:** Strong NO. Gates create perverse incentive loops (quota-chasing dissent), and the thin-pattern contract (runner.md:3026) forbids new state stores. Prefers passive diversity metric instead.

**Verdict: 2–1 against gates.**

### Three Strongest Reasons (with file:line evidence)

1. **D-ADR0047's thin-pattern contract (runner.md:3026):** The spec mandates that collaboration patterns remain "vòng lặp code nhỏ, thuần, không store mới." `panel.mjs:35-87` is ~50 lines of deterministic plumbing — `Promise.all` dispatch, error propagation, synthesizer dispatch. Adding dissent quotas, confidence tallying, and counterfactual re-prompting would invert this into a fragile heuristic state machine. The `gated` flag already in `presets.mjs:28` is *dead code* — `runPanel` never reads `params.gated` — confirming the design intent that gating logic does not belong in the pattern loop.

2. **Provider-family separation already breaks monoculture (panel.mjs:51-56, 77-80; run.test.mjs:574-618):** Each panelist runs `independentOf` all other panelists — `bind()` ensures no two share a provider family. The synthesizer runs `independentOf: allPanelistRoles`, guaranteeing a *fourth* provider family. This is tested and enforced: `run.test.mjs:586` asserts `new Set(members).size === 3` for panelists; `run.test.mjs:617` asserts synthesizer's family not present among members. This is not provider cosmetic diversity — it's a mechanical guard in `bind()` that compares executor provider families directly.

3. **reviewed.mjs red-team already covers adversarial scrutiny (reviewed.mjs:18-25):** Where genuine adversarial opposition is needed, `resolveCheckers` injects `red-team` for `high`/`critical` rigor and automatically for `code:` capabilities. The `reviewed` pattern with red-team is the correct vehicle for dissent. Adding a second dissent mechanism inside `panel` duplicates this and violates the single-responsibility boundary between the two patterns (panel = "independent views", reviewed = "producer-checker loop").

### What Would Change My Mind

Production telemetry from real `fgos panel` runs showing either:
- >70% spurious positional consensus on high-stakes items that a red-team checker or structured counterfactual would have caught, AND
- that the gap is attributable to missing mechanical gate structure rather than provider correlation or weak prompting.

Without that evidence, mechanical gates would add complexity and latency (violating D-ADR0030 Priority #1: Ship Faster) for a problem not yet observed.

### Concrete Next Step

Per Panelist 3's highest-leverage intervention: extend the panel result contract with structured fields (`positions[]`, `confidence`, `distinctObjections`) — passive only, no re-prompting, no quota enforcement. Then run an architecture-advisory workflow (`fgos group-thinking` / `architecture-advisory` preset) and inspect logged overlap in the outbox reports. If overlap is structurally high, *then* consider a gate; the measurement itself is the intervention that makes the loop visible.


======== Q1 / Candidate D

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


######## QUESTION Q2

A small team operates a customer-facing queue. Current manual triage takes 20 minutes daily; 2 of 100 requests per week are routed incorrectly, caught within one day. An automatic classifier would cost 3 engineer-days plus half a day monthly to maintain; an audit sample of 20 requests weekly takes 15 minutes. No accuracy trial exists yet. Compare keeping manual triage, enabling automation immediately, or running a two-week shadow trial with manual decisions unchanged. State a supported position and what evidence would change it. Use only these supplied facts; do not inspect unrelated project state or modify files.

======== Q2 / Candidate A


## Points of agreement (all three panelists)

- **Immediate automation is the weakest option.** No accuracy trial exists, so
  enabling now commits 3 engineer-days up front plus recurring cost
  (0.5 day/month maintenance, 15 min/week audit) against the one decisive
  unknown — classifier accuracy — on a customer-facing queue whose current
  error rate is known and low (2/100 per week, caught within one day).
  voice 1 adds a statistical caveat: the 20-request weekly audit has weak
  power (at 2% error the sample contains ~0.4 expected errors; a classifier
  at 10% error has a ~12% chance of a clean audit week, ~36% at 5%), so the
  audit cannot be the instrument that certifies accuracy.
- **The economics of automation are thin.** Roughly 2–5 h/month net savings
  depending on 5- vs 7-day operation, with ~11–12 months payback on the 24 h
  build at a 5-day week (voice 1: ~11–12 months; voice 3: ~11.2 months,
  ~29.6 min/week net). voice 1 and voice 3 both note this does not
  clearly justify the build on time savings alone.
- **The shadow trial, if automation is pursued, is the only pathway that
  measures accuracy before customers are affected.** It requires most of the
  3-day build anyway (it avoids committing to rollout, not the build), keeps
  manual decisions authoritative, and yields ~200 classified requests with
  zero customer-facing classifier risk.
- **Volume growth flips the economics.** Manual labor scales with volume;
  maintenance does not. Significant growth (voice 3 suggests ~500/week
  as an example threshold) would amortize the build within weeks.

## Positions by panelist

### voice 1 — keep manual by default; shadow trial only if automation is wanted

Default position: **keep manual triage**. The ~2 h/month net savings and ~1
year payback do not clearly justify the 3-day build. If the team has a reason
to want automation (volume growth, triage crowding out other work, 7-day
operation), run the **shadow trial first** — never straight to rollout. Rank:
shadow trial > keep manual > enable now, with keep manual first where the
build is not already sunk. voice 1 also flags the trial's statistical
limit: 200 requests with ~4 expected manual errors means even zero classifier
errors gives only a ~1.5% 95% upper bound — the trial can show "not clearly
worse", not "better".

### voice 2 — run the two-week shadow trial

Supported position: **run the shadow trial** with manual decisions authoritative,
because the immediate-automation decision hinges on classifier accuracy and no
accuracy evidence exists. Manual burden is modest (100 min/week at 5 days) and
errors are caught within a day; the supplied facts do not justify accepting an
unmeasured customer-facing error rate. The trial should compare classifier
proposed routes against eventual manually determined/corrected routes and report
audit findings alongside all disagreement data.

### voice 3 — shadow trial as an explicit go/no-go gate; keep manual if engineering capacity is constrained

Rejects immediate automation outright. If pursuing automation, the shadow trial
is the only acceptable pathway — zero customer impact, empirical accuracy data
on ~200 requests. If engineering capacity is severely constrained, **keep
manual** is the rational default (~30 min/week net savings may not justify
3 engineer-days unless queue growth is expected). Recommended active course:
run the two-week shadow trial as an explicit go/no-go gate before any
automation is enabled.

## Visible disagreement

- **Default ordering.** voice 1 puts keep-manual first by default and treats
  the trial as conditional on already wanting automation; voice 2 and
  voice 3 recommend running the trial now as the active course. This is a
  genuine difference, not a wording difference: voice 1 weighs the thin
  economics (and the build-mostly-spent-anyway cost of a trial) heavily enough
  to not start unless there is a reason to want automation at all;
  voice 2/-3 weigh the missing accuracy evidence heavily enough to want the
  measurement started.
- **Trial's evidentiary strength.** voice 1 caps what 200 requests can show
  ("not clearly worse", ~1.5% upper bound at zero errors); voice 2 and
  voice 3 treat the trial as capable of establishing whether the classifier
  would avoid increasing the observed error outcome. voice 1's statistical
  caveat stands: a two-week trial cannot demonstrate superiority, only
  non-inferiority within a loose bound.
- Both camps agree immediate enablement is unjustified, so the disagreement is
  only between "wait for a reason, then trial" and "trial now".

## Recommendation

**Do not enable automation immediately. If the team has any intent to automate
within the next year — or expects queue growth — run the two-week shadow trial
with manual decisions unchanged, as a go/no-go gate. Otherwise, keep manual
triage.**

Evidence for this recommendation:

1. **Unanimous rejection of immediate enablement.** All three panelists
   independently rank it last; the decisive fact is that no accuracy evidence
   exists for a customer-facing queue with a known, bounded 2% error rate.
2. **Thin economics make the trial, not rollout, the cheap decision.** Net
   savings of ~2–5 h/month and ~11–12 month payback mean the cost of being
   wrong about accuracy dwarfs the savings; the trial defers only the rollout
   decision, and its customer-facing risk is zero.
3. **The trial directly targets the one unknown.** ~200 requests classified in
   parallel against manual decisions is the only supplied mechanism that
   measures accuracy without customer exposure.

### Evidence that would change the recommendation

- **Toward automation (post-trial rollout):** trial shows classifier errors no
  worse than the manual baseline (e.g. ≤2–3 disagreements adjudicated wrong in
  200); volume grows well above 100/week; operation is 7-day; the build is
  already sunk or cheaper than 3 days; maintenance proves below 0.5 day/month.
- **Toward keeping manual permanently:** trial accuracy materially below the
  98% manual baseline; audit or maintenance costs exceed the supplied
  estimates (net savings go to zero or negative); the 3 engineer-days have
  higher-return alternative uses (voice 3: defer even the trial); the cost
  per misroute rises (contractual penalties rather than one-day catch);
  triage volume or time shrinks.
- **Toward enabling without a full trial:** only a credible prior accuracy
  figure from a comparable deployment plus a cheap rollback — none supplied.
- **Trial validity:** if the two-week window is unrepresentative (holiday,
  campaign), extend it.

### Unresolved gaps (from voice 1, shared)

Working days per week; volume growth; cost per misroute; human-review cost of
trial disagreements; engineer-day length (8 h assumed throughout).


======== Q2 / Candidate B


Seats: P1 = assumption testing (`council-assumptions`), P2 = shipping & maintainability (`council-ship-maintain`), P3 = feedback loops (`council-feedback-loops`).

---

## 1. Unresolved evidence (reported first)

These gaps are stated by the seats themselves; none were invented or filled by the panel:

1. **Classifier accuracy is unknown — no trial exists.** This is the single reliability-critical fact for any automation decision, and it is unmeasured (all three seats). The manual baseline (2 misroutes per 100 weekly requests, caught within one day) is the only measured accuracy in the supplied facts.
2. **Cost and severity of a misroute to a customer is not supplied.** No seat can weigh customer harm of an automated misroute against the known one-day manual catch pattern (P1 names this explicitly; P2 treats it as an unquantified system risk).
3. **It is unverified that automation actually drives triage time near zero.** Both P1's break-even arithmetic (automation year one ≈ 85 h vs. manual ≈ 87 h; saving ≈ 26 h/yr only in later years) and P3's net ~2.2 h/month figure *assume* manual triage disappears; if some review remains, the saving shrinks or goes negative (P1).
4. **Whether the 3-engineer-day build is required for the trial or already sunk/shared** is not supplied. P1 and P3 both assume the classifier must be built before a shadow trial can run; if the build is not otherwise committed, the trial carries the full 3-day price tag.
5. **Maintenance ownership is unidentified.** Who reliably provides the half engineer-day per month is a stated gap (P2); it does not block the trial but must be resolved before production enablement.
6. **The comparison effort of running the trial itself is not supplied** (P1) — shadow cost beyond the build is currently an estimate, not an observed figure.
7. **A two-week window (≈200 requests) resolves large accuracy gaps only** and may miss rare request types (P1); a 2% vs. 3% error difference is not statistically distinguishable from that sample.
8. **Whether an automation mandate exists at all is unstated.** P3's no-change position is premised on payback economics; P1/P2's trial recommendation implicitly assumes the automation question is live. The supplied facts do not say which.

Arithmetic cross-check: the seats' numbers agree with each other where they overlap (P1's ~26 h/yr later-year saving ≈ P3's ~2.2 h/month; P1's audit weakness ≈ P3's 1 − 0.98²⁰ ≈ 33% weekly detection probability). No seat contradicts another's arithmetic.

## 2. Each seat's explicit position

| Seat | Posture | Explicit position |
|---|---|---|
| P1 — assumption testing | `council-assumptions` | **Run the two-week shadow trial; do not enable immediately.** Enabling now bets a customer-facing process on unmeasured accuracy for a modest, possibly near-zero, year-one saving. Keep-manual is the fallback if the trial shows nothing. |
| P2 — ship & maintain | `council-ship-maintain` | **Run the two-week shadow trial with manual decisions unchanged, then decide enablement.** The only new reliability-critical fact (classifier accuracy) is unknown; the trial converts that unknown into a measurement before the team accepts recurring half-day-monthly maintenance. |
| P3 — feedback loops | `council-feedback-loops` | **Supported no-change position — keep manual triage.** The current loop is stable (98% accuracy, ≤1-day correction), the economics are unfavorable (~2.2 h/month net saving, ~11-month payback on 24 h upfront), and the 20%-sample audit creates an 80% weekly blind spot. If automation is nonetheless mandated, the shadow trial is the *only valid transition*; immediate enablement is rejected either way. |

## 3. Agreement and genuine split (no invented consensus)

**Unanimous agreement — immediate enablement is unsupported.** All three seats reject enabling automation immediately, on the same causal core: it substitutes a measured, fast-correcting error loop (2%, caught ≤1 day) for an unmeasured classifier observed only through a sparse weekly sample that catches a single baseline-rate error in roughly one week out of three. The supplied facts contain nothing that supports deploying now.

**Genuine split — shadow trial vs. keep manual.** P1 and P2 recommend the trial; P3 recommends no-change. The split is not about evidence quality (all three read the same facts) but about the value of the information the trial buys:

- P1/P2 treat the unknown accuracy as worth measuring before deciding, at a cost they assume is mostly the (shared) build.
- P3 weighs the best-case payoff (~26 h/yr after year one) against the certain 3-day build plus 4 h/month maintenance, and finds the purchase not justified absent a mandate or volume growth.

This is a real disagreement, not a framing difference: if the build is genuinely incremental spend and the automation goal is optional, P3's no-change stands on the supplied numbers; if the build is sunk or the automation question must be answered anyway, P1/P2's trial is the cheapest way to answer it. The supplied facts do not resolve which premise holds.

**Compatible sub-point across the split:** P3's cheaper alternative evidence source — an offline evaluation on existing historical request logs demonstrating ≥99% accuracy — is not contradicted by any seat and is consistent with P1's "prior accuracy evidence from elsewhere" condition for enabling sooner.

## 4. Comparison of the three options on the supplied evidence

- **Keep manual.** Known: 20 min/day (~87 h/yr), 2% error, ≤1-day catch. No new ownership or risk. Cost of doing nothing is low and bounded (all seats). Weakness (P2): never establishes whether automation could safely improve the process.
- **Enable immediately.** Commits 3 engineer-days + 4 h/month + 15 min/week audit against an unmeasured error rate, with a detection mechanism (20-of-100 weekly sample) that is weak for rare errors and slow to signal drift. Best case ≈ break-even in year one, ~26 h/yr thereafter. Rejected by all seats.
- **Two-week shadow trial (manual unchanged).** Zero incremental customer risk; converts the accuracy unknown into ~200 measured comparison points; preserves the manual safety net throughout. Cost: the 3-day build is committed before the payoff is known (P3's objection), trial comparison effort is unestimated (P1), and the sample resolves only large gaps. After the trial, enablement still requires a maintenance owner (P2).

## 5. Conditions that would change the verdict

**Toward enable now** (from any seat):
- Prior accuracy evidence from the same task/data showing the classifier at least matches the manual 2% with detection within about a day (P1, P2, P3-compatible via offline evaluation).
- Evidence that misroutes have negligible customer cost or are easily reversible (P1).
- The build already sunk and maintenance demonstrably below 0.5 day/month (P1; P3's "<1 h/month" variant).

**Toward keep manual permanently** (closing the split in P3's favor):
- Trial shows classifier agreement clearly below manual accuracy, or automation cannot cut triage time near zero (savings then negative) (P1).
- Trial shows worse routing, unacceptable detection delay, insufficient savings, or no sustainable maintenance owner (P2).
- No automation mandate exists and manual volume/error rate stay at current levels (P3's status-quo conditions).

**Toward shadow trial / later enablement** (closing the split in P1/P2's favor):
- A mandate to pursue automation, or queue volume growth (e.g., toward ≥300 requests/week) pushing manual triage past ~60 min/day (P3).
- Manual misroute rate rising above 2% or catch latency extending beyond one day (P3).
- Trial disagreement concentrated where the manual call was wrong, rare categories absent, and a detection plan that catches misroutes within about a day (P1) with a named maintenance owner (P2).

## 6. Exactly one concrete next step

**Put the framed decision to the queue owner:** whether the potential ~26 h/yr later-year saving justifies committing the 3 engineer-days to a two-week shadow trial with manual decisions unchanged. An explicit "no" settles the panel's split in favor of keeping manual triage (P3's position); a "yes" launches the trial (P1/P2's position). Immediate enablement requires no further discussion — it is closed on the supplied facts, unanimously.

---

## Result artifact

- `agent-result.json` — status `done`, contract v2, written alongside this report in the same outbox.
- Evidence refs: the three panelist reports and the three council posture definitions listed there. Nothing in the claim is proof; evidence refs remain untrusted until independently validated.


######## QUESTION Q3

Our support team keeps asking whether we should "move to the new system" now that it is available. The old one works but people complain about it. Some say the new one is faster, others say migration is risky. We have a quiet period coming up in about three weeks. Should we move? Use only these supplied facts; do not inspect unrelated project state or modify files.


======== Q3 / Candidate A

Task: compare viable options for the owner request using only the supplied facts.
Panel: 3 panelists, reports listed under Context refs. All three read in full.

## Positions by name

### voice 1
**Conditional yes — prepare now, migrate in the quiet period only after a go/no-go check.**
- Explicitly refuses both extremes: do not cut over now (normal load = problems hit customers at full volume), and do not commit blindly.
- Wants the three weeks spent turning opinions into evidence: measure "faster" by timing typical support tasks on both systems; name migration risks concretely (data, integrations, training, cutover) with owners; define a rollback path and keep the old system alive during cutover.
- Holds a **go/no-go about one week before the quiet period**: migrate if speed is confirmed and risks/rollback are in place; otherwise defer and state what's missing.
- Lists what would change the verdict (evidence new system is not faster or has a blocking gap → stay; old system about to be unsupported/failing → move sooner with extra care; no rollback possible → escalate beyond this analysis).
- Flags open questions: old system end-of-life, quiet period length vs. migration+recovery time, side-by-side capability.

### voice 2
**Choose "prepare now; migrate in the quiet period" — a controlled migration, with validation before cutover.**
- Compares: move now (addresses complaints sooner but exposes normal operations to the stated migration risk and wastes the low-impact window); do not move (keeps the working system but leaves complaints unresolved and gives up the well-suited quiet period); prepare then migrate (best balance).
- "Commit to a controlled migration during the quiet period, with preparation beginning now" — firmer in tone than voice 1: it frames the migration as committed, with preparation/validation as the path, not as a gate that can flip to "stay."
- Insists neither claim (faster; risky) is proven by the supplied facts, so both must be validated before the cutover; verification criteria and an acceptable rollback path are preconditions.

### voice 3
**Phased validation with gated cutover — same shape as voice 1, stated as a formal option matrix.**
- Trade-off matrix across operational risk, satisfaction, quiet-period utilization, and performance verification: immediate cutover = high risk, performance discovered in production; status quo = low risk but dissatisfaction persists and the window is missed; gated cutover = low risk, proactive, performance verified pre-release.
- Three-week plan: test the migration process in a non-production environment, benchmark the new system against its claims, prepare a verified rollback plan. Cutover during the quiet period **only if predefined go/no-go criteria pass with zero critical blockers; otherwise safely postpone** and stay on the existing system until resolved.
- Notes three weeks may be tight if technical hurdles or regressions emerge.

## Disagreement kept visible

There is **no substantive disagreement** — all three reject "move now," all three reject permanent "stay," and all three pick the prepare-then-gate-then-migrate shape. One nuance survives synthesis rather than being averaged away:

- **How binding is the commitment before evidence exists?** voice 2's phrasing ("commit to a controlled migration during the quiet period") reads as a decision already made, with validation as its execution path. voice 1 ("do not commit blindly") and voice 3 ("only if go/no-go criteria are satisfied, otherwise postpone") treat the migration as conditional on the three weeks producing confirming evidence. If validation fails, voice 1/voice 3's framing says *defer and name the gap*; voice 2's framing does not state an explicit failure branch in its recommendation (though its option text does require "successful verification criteria" and "acceptable rollback path" before cutover).

This nuance matters because the owner's decision frame is exactly this question — and the supplied facts do not resolve it either way.

## Synthesized recommendation

**Prepare now; schedule the cutover inside the quiet period; migrate only if a go/no-go gate passes at the end of preparation — otherwise defer, and say what evidence was missing.** Concretely:

1. **Start preparation immediately** (all three panelists): spend the three weeks timing typical support tasks on both systems to test the "faster" claim, naming the migration risks concretely (data, integrations, training, cutover) with owners, and defining a rollback path that keeps the old system available through cutover.
2. **Hold the gate about one week before the quiet period** (voice 1's timing, consistent with voice 3's "zero critical blockers" criteria): migrate in the quiet period if speed is confirmed, risks have owners, and the rollback is verified; if not, stay on the old system for this window and report what is missing.
3. **Escalate rather than force** (voice 1's limits, echoed by voice 3's risk column): if no rollback is possible, or the old system turns out to be failing/near end-of-support, this outgrows the supplied facts and needs a separate decision.

**Evidence for this recommendation:** unanimous rejection of "move now" (all three: migration risk + unverified speed claim + normal operational load = worst timing) and unanimous rejection of "do not move" (all three: complaints are real and continuing, and the quiet period is the cheapest window a risky change will get). The conditional form resolves the facts' own tension: the supplied facts prove neither the speed claim nor quantify the migration risk, so the decision must convert opinions into evidence before cutover — which the three-week runway and the quiet period together permit.

**Open questions carried forward (all panelists):** old system end-of-life; whether the quiet period is long enough for migration *and* recovery; whether both systems can run side-by-side through cutover.

## Evidence refs

- `inputs/1-voice 1-r1.md` — voice 1 report (conditional yes; go/no-go one week before)
- `inputs/2-voice 2-r1.md` — voice 2 report (commit to controlled migration in quiet period)
- `inputs/3-voice 3-r1.md` — voice 3 report (phased validation with gated cutover)


======== Q3 / Candidate B

**Question (owner's own words):** The old system works but people complain; the new one is available; some say faster, others say migration is risky; a quiet period starts in about three weeks. Should we move? Supplied facts only.

**Verdict:** Do not move now. All three seats independently converge on a conditional move in the quiet period, gated by evidence gathered during the ~3-week lead time. No seat endorses an immediate move; no seat endorses dismissing the new system outright.

---

## 1. Unresolved evidence first — mismatches in what the seats took the question to be

Comparing the three Restatement sections, two genuine framing mismatches remain unresolved:

1. **Timing of the move relative to the quiet period.** voice 3 (feedback-loops) restated the question as whether to migrate "**during** the upcoming three-week quiet period" — pre-binding the move to occur inside the quiet window. Seats 1 and 2 restated it as "should we move, given a quiet period ~3 weeks out," leaving *when* to move (now / in the window / later) as part of the answer. The owner asked "should we move?" without fixing timing. voice 3's framing happened to match its final recommendation, but it was an assumption at intake, not a supplied fact.
2. **Length of the quiet period.** voice 3 calls it "the upcoming **three-week** quiet period," reading the ~3-week lead time as the period's duration. voice 1 explicitly lists quiet-period length as unknown; voice 2 matches voice 1 ("a quiet period in about three weeks" — start time, not length). The owner's text says the quiet period is *coming up in* about three weeks; its duration was never supplied.

Additionally, all three seats flag the same underlying evidentiary gaps, consistently but unresolved: the speed claim is hearsay (never measured), the migration risk is unnamed (no concrete failure mode), rollback/parallel-run feasibility is unknown, the nature of the complaints is unspecified, and quiet-period length is unknown. These gaps cap how firm any verdict can be and are the reason every seat's answer is conditional rather than a plain yes/no.

## 2. Each seat's explicit position

- **voice 1 — council-assumptions (assumption testing):** Do not move now. Commit to the quiet period *conditionally*: use the ~3-week lead time to (a) time the new system against the old on real support tasks, (b) get the "risk" people to name concrete failure modes, and (c) confirm a rollback or parallel-run path. Move in the quiet period only if (a) shows a real gain or addresses the complaints and (b)/(c) give an acceptable, reversible risk; otherwise defer. All three load-bearing assumptions ("faster is true and matters", "risk is real and bounded", "the quiet window is right and sufficient") are **unknown, none disproved** — so the decision should turn on cheap tests, not opinion.
- **voice 2 — council-ship-maintain (delivery & maintenance):** Do not commit to move now. Use the next three weeks as a decision-readiness window and move in the quiet period **only if** the team can establish a bounded migration plan, a practical recovery/rollback path, a **named operating owner**, and a verified advantage relevant to the complaints. Set a go/no-go checkpoint before the quiet period. Notes the system-level cost of doing nothing: preserved dissatisfaction can reinforce itself if staff see no visible response, while an unprepared move can turn a local complaint into broader operational disruption.
- **voice 3 — council-feedback-loops (systems observer):** Do not commit unconditionally to a full structural migration based on present evidence, but do not dismiss the opportunity. Initiate an **immediate local intervention**: a two-week controlled pilot — a small cohort of support staff handling low-risk ticket categories on the new system — measuring transaction speed, friction points, and migration workflows, ending in a formal go/no-go gate one week before the quiet period. A direct full cutover would convert unverified claims into unmitigated operational risk with no feedback loop to guide rollback.

## 3. Agreement or genuine split

**Agreement (genuine, not invented):** All three seats reach the same core verdict — *not now; conditionally in the quiet period if and only if the lead time produces verified benefit and bounded, reversible risk.* Each independently constructs a go/no-go gate before the quiet window from its own posture (assumption tests / readiness criteria / pilot feedback loop), and each treats hearsay speed and unnamed risk as insufficient evidence to move.

**Genuine splits (nuance, not verdict):**
- **Nature of the pre-work.** voice 3 uniquely recommends a live operational pilot running real (low-risk) support volume on the new system; seats 1 and 2 recommend decision-readiness activities (timing tests, risk-naming, rollback planning, ownership). voice 1's "timed side-by-side on real support tasks" approaches a pilot but is framed as a test, not a running intervention.
- **Ownership requirement.** voice 2 alone requires a *named operating owner* and weighs the year-long maintenance burden; seats 1 and 3 do not condition their verdicts on ownership.
- **Gate precision.** voice 3 fixes the gate at one week before the quiet period and offers concrete numeric thresholds (>50% throughput gain, proven instant rollback in staging); voice 2 says "before the quiet period" qualitatively; voice 1 conditions on quiet-period entry. Compatible, but different strictness.
- **Cost of no.** voice 2 is the only seat that explicitly prices the do-nothing path (preserved and possibly self-reinforcing dissatisfaction) into the comparison.

## 4. Conditions that would change the verdict

- **Toward moving (in the quiet period):** benchmark data verifying a real speed/relevance gain on actual support tasks; risk-namers producing concrete, bounded failure modes; a demonstrated rollback or parallel-run path; (voice 2) a named operating owner; (voice 3) >50% verified throughput gain plus proven automated migration and instant rollback in staging.
- **Toward deferring or cancelling:** no rollback possible or a named data-loss risk; pilot revealing critical data-integrity defects, performance degradation under standard load, or migration complexity exceeding the quiet window; migration risk that cannot be bounded before the window closes; new system shown not faster or not addressing the actual complaints.
- **Toward moving sooner than the quiet period:** the old system facing a hard deadline or beginning to fail (voice 1).
- **On timing itself:** the quiet period turning out short or not actually low-volume (voice 1) — which also resolves restatement mismatch #2 above.

## 5. Exactly one concrete next step

**Start a two-week pilot of the new system this week: a small cohort of support staff handles a low-risk ticket category on the new system, with speed and friction measured against the old system, ending in a formal go/no-go review one week before the quiet period.** This one step operationalizes voice 1's timing test and risk-naming, feeds voice 2's readiness gate (bounded plan, rollback evidence, and it surfaces who would own the new system day-to-day), and is precisely voice 3's concrete intervention. Answering "should we move?" with evidence instead of hearsay is the single action all three seats' verdicts depend on.

---

*Comparison basis: the three supplied panelist reports and their council posture definitions only. No repository state beyond the context refs was inspected; no files modified. Nothing in this claim is proof; the underlying facts (measured speed, named risks, rollback feasibility, quiet-period length) remain unverified until independently established by the pilot.*
