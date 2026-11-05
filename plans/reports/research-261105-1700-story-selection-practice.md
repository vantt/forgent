# Story selection from engineering logs: practice and prior art

## 0. Bottom line (ranked recommendations)

1. **Split the pipeline into three stages.** (a) Deterministic signal extraction produces candidate moments with evidence pointers. (b) An LLM clusters moments into arcs and writes a one-line "claim + stakes". (c) Rank on a small rubric, then draft only the top-k. This is the cheapest design that still has judgment where judgment is needed.
2. **Use reversals, error→fix arcs and explicit human decisions as primary candidate sources.** They are cheap to detect and carry the most story value. Cost spikes and frustration are secondary, used as boosters or tiebreakers.
3. **Rank with a news-value rubric plus a "so what" gate.** A story must name what a reader outside the repo can reuse. Dramatic-but-trivial moments fail the gate.
4. **Ground every draft claim to evidence IDs, then run an independent claim-extract/verify pass.** Keep a dropped-claims ledger. Use lower-bound phrasing for counts ("at least 14 retries").
5. **Evaluate with human top-k hit rate on a small frozen set, plus pairwise preference.** About 30 candidates labelled once is enough to start. Add a cold-reader test on 5 published pieces.

## 1. Material selection from logs

### 1.1 Cheap (deterministic) signals

Each of these is computable from transcript and git metadata with no LLM.

| Signal | How to detect | Story value |
|---|---|---|
| Reversal | git: revert commits, a file or function added then deleted within N days, same hunk touched back and forth. Transcript: the agent edits file X, then undoes it. | High: "we did X, then undid it" is an arc by itself. |
| Error→fix arc | A failing test/build/tool exit code ≠ 0 followed by a later green on the same command. The arc length (turns, minutes, retries) is the measure. | High when the arc is long or the fix was non-obvious. |
| Retry/loop | The same tool call or the same error string repeated k times (hash-normalise the strings). | Medium: marks struggle; the lesson needs an LLM. |
| Cost/time spike | Tokens or wall-clock per turn above a robust z-score (median/MAD) within the session or within the repo's own history. | Medium: a booster, not a story on its own. |
| Human intervention | User message after a long autonomous run, interrupt events, rejected tool call, "no / stop / don't" lexicon. | High: explicit human decisions are the "choice" in a story. |
| Scope blow-up | Planned vs actual files or commits; a plan item count that changes mid-session. | Medium. |
| Quantitative anomaly | Commit size outliers, a session count burst, test count delta, perf numbers in output (regex for "ms", "x faster", "%"). | Medium-high if a before/after pair exists. |
| Time gaps | A long gap then a resumption on the same topic (a multi-session arc seed). | Medium: useful for linking sessions. |
| First/last | The first appearance of a new concept, file or tool; a long-lived item finally closed. | Medium: novelty and resolution. |
| Doc/decision writes | Commits touching decision records, ADRs, spec "history" sections. | High: the human already flagged these as significant. |

The user's forgentX repo already has decision-history sections, so those can be read as pre-labelled "turning points" instead of being detected from scratch.

### 1.2 Needs an LLM

- **Why it mattered:** a surprise or a belief change. Expected vs. observed needs semantic reading.
- **Whether the fix was non-obvious:** the diff is deterministic, but "obvious to whom" is not.
- **Linking moments across sessions into one arc:** embeddings for candidate links, then an LLM to confirm the link.
- **Naming the tension:** the sentence "we wanted X, but Y, so Z".
- **Frustration vs. neutral correction:** lexicon gives recall, an LLM filters precision.
- **Generalisable lesson:** whether a reader outside the project can reuse it.

Use embeddings or lexicon filters first to cut volume, then an LLM only on the surviving windows.

### 1.3 Prior art worth borrowing

- **Generative Agents** (Park et al., 2023, [arXiv 2304.03442](https://arxiv.org/abs/2304.03442)): log-wide memory with an LLM-assigned "importance 1-10" score per event and a reflection step over the top items. Closest analogue to a score-then-synthesise stage. Its weakness is that the importance score is uncalibrated across runs, so rescore pairwise.
- **Emotional arcs** (Reagan et al., [EPJ Data Science 2016](https://epjds.epj.org/articles/epjdata/abs/2016/01/13688_2016_Article_93/13688_2016_Article_93.html), [PDF](https://cdanfort.w3.uvm.edu/research/2016-reagan-epj.pdf)): sentiment time series over stories reduces to six basic shapes (a Vonnegut-style formalisation). They report that some shapes got more downloads, but that is for fiction. For session logs, sentiment curves can seed turning-point candidates (sharp dips followed by recoveries are man-in-a-hole shapes). Treat it as a weak signal.
- **Incident postmortem mining.** The structure is timeline, contributing factors, what went well, what went badly, action items. See Google's [SRE book chapter on postmortem culture](https://sre.google/sre-book/postmortem-culture/) and Etsy's blameless postmortem write-ups (John Allspaw, "Blameless PostMortems and a Just Culture"). Use this as the extraction schema for error→fix arcs. It makes arcs comparable and keeps the "contributing factors" honest.
- **Highlight detection** in video and esports uses a short-window anomaly in an activity signal, then a human or classifier pass. The analogue here is a burst in tool-call rate, errors or edits in a short window.
- **Data journalism story selection** (e.g. "what is the angle" in newsroom data desks) screens data for outliers or changes first, then checks them against reader relevance. That matches the two-stage design above.
- **Event summarisation / timeline summarisation** is a long-standing NLP task (e.g. TLS datasets such as Timeline17, Crisis). Its common failure is picking by frequency instead of importance. The fix is to rank by change-of-state, not by mention count.

I found no published tool that mines coding-agent transcripts for blog-post material. Expect to build the glue yourself.

## 2. Story selection frameworks

### 2.1 Frameworks, with how useful each is here

| Framework | Use | Verdict |
|---|---|---|
| **News values** (Galtung & Ruge 1965; Harcup & O'Neill 2001/2017: relevance, surprise, magnitude, conflict, bad/good news, power elite, follow-up, entertainment, shareability) | Direct rubric dimensions | Best fit for ranking. Adapt: "relevance" = reader can reuse it; "magnitude" = measured numbers; "conflict" = a reversal or failure. |
| **ABT (And-But-Therefore)** (Randy Olson, *Houston, We Have a Narrative*) | A cheap structural test: can the story be stated as "We did A and B, but C, therefore D"? | Best gate. If the "But" is missing, there is no tension. LLM can fill and a human can eyeball it in seconds. |
| **"So what" test** | The reader-reusable lesson stated in one sentence | Mandatory gate. This is what rejects dramatic-but-trivial moments. |
| **Vonnegut shapes / Reagan arcs** | Classify the arc: man-in-a-hole (error→fix), Cinderella, Icarus (success then collapse), etc. | Use as a label for the draft's shape, not for ranking. |
| **Freytag pyramid / Story Circle (Harmon)** | Setup, rising action, climax, resolution | Useful as an outline for the draft, too heavy for selection. |
| **Blameless postmortem structure** | Timeline, contributing factors, learning | Use for failure-centred stories. Good for credibility with engineering readers. |
| **Hook / tension / stakes** | The opening 2 sentences | Check on the draft, not on candidates. |

### 2.2 Ranking candidates

A concrete rubric, each scored 0-2 (or pairwise-compared by an LLM judge), summed:

1. **Reader-reusable lesson** (so-what). Hard gate: 0 means drop.
2. **Tension**: a real "But" (reversal, failure, contradiction with expectation).
3. **Evidence strength**: number of independent pointers plus a measurable before/after.
4. **Novelty**: not already covered in a published piece or commonly known advice.
5. **Stakes/magnitude**: cost, time, risk, or an impact on the product.
6. **Self-containedness**: can be told without 20 minutes of repo context.

Tiebreakers: a human decision is present, the arc is multi-session, or a number exists.

### 2.3 Avoiding dramatic-but-trivial picks

- Make the so-what gate precede scoring, and score "tension" only after the gate passes.
- Cap the weight of purely quantitative drama (cost or retry spikes) so it cannot outrank a lesson.
- Require the lesson to be stated *without* using the repo's proper nouns. If it cannot be, it is probably trivial or too local.
- Penalise candidates whose cause is a self-inflicted tooling mistake that a reader cannot reproduce, unless the fix pattern generalises.
- Rank within diverse buckets (failure, decision, perf/number, process) and take top-k per bucket, to stop one genre dominating.

### 2.4 Multi-session arcs versus single moments

- Single moments are easy to evidence and short to write, but often lack a "so what".
- Multi-session arcs hold the best stories (a hypothesis, a failed attempt, a reversal, a final design), but they are hardest to ground, so require at least 3 evidence anchors across at least 2 sessions.
- Practical approach: candidate moments feed an **arc-linking** step (same file or symbol, same decision ID, embedding similarity, temporal proximity). Score arcs and moments on the same rubric, and prefer the arc when it contains the moment and passes the gate.

## 3. Factual grounding

### 3.1 Known failure classes in LLM narrative summaries

- **Order and date errors:** events reordered, or a "then" inferred without a timestamp. Often caused by flattening several sessions.
- **Attribution errors:** a human decision credited to the agent or the other way round; the wrong model, tool or person named.
- **Overstated numbers:** "dozens of retries" when there were 7; rounding up; totals taken from a partial window.
- **Causal invention:** "because" added between events that merely co-occurred (the main failure for a postmortem-style narrative).
- **Outcome smoothing:** an unresolved or partially fixed issue told as a clean win.
- **Quote drift:** paraphrase presented as a quote.
- **Compression artefacts:** merging two similar incidents into one.

### 3.2 Practices, ranked by cost-effectiveness

1. **Evidence-pointer-first generation.** Give the writer a numbered fact sheet (ID, timestamp, source file/line, verbatim snippet, deterministic counts). Require inline `[F12]` markers per claim. This is the same idea as attributed generation (ALCE, Gao et al. 2023, [arXiv 2305.14627](https://arxiv.org/abs/2305.14627)).
2. **Deterministic numbers.** Compute every count, duration and cost in code and hand the writer finished figures. Let the LLM only quote them, never derive them.
3. **Claim extraction, then verification by an independent pass.** Break the draft into atomic claims (the FActScore idea: [Min et al., arXiv 2305.14251](https://arxiv.org/abs/2305.14251), scoring the share of atomic facts supported by the source). Verify each against the cited evidence with a *different* prompt or model that sees only the claim and the evidence, not the narrative. Chain-of-Verification (Dhuliawala et al. 2023) is the related self-correction approach, but it leans on the model's own knowledge, so evidence-based checking is stronger here.
4. **Consistency sampling** (SelfCheckGPT, Manakul et al., [arXiv 2303.08896](https://arxiv.org/abs/2303.08896)): resample the claim check and treat disagreement as a flag. It needs no external source, which makes it a weaker, secondary check.
5. **Lower-bound phrasing.** Where the evidence window may be incomplete (truncated logs, missing sessions), write "at least N". Encode the rule: counts from a partial log are always lower bounds.
6. **Dropped-claims ledger.** Record every claim removed or softened, with the reason (unsupported, contradicted, ambiguous). It audits the verifier and shows whether the writer keeps making the same error class. A rising drop rate on one class is a prompt bug.
7. **Order check in code.** Verify that the narrative's event order matches the timestamp order of its cited IDs. This is a cheap deterministic check that catches the commonest LLM error.
8. **Attribution check:** each claim must carry an actor field (human / agent / tool) drawn from the evidence, not inferred.
9. **Human spot-check** on only the claims the verifier marked "partially supported".

## 4. Evaluating story-picking quality cheaply

- **Frozen candidate set.** Take 30-50 candidates from past logs. Have the owner label each as publish / maybe / drop once (about 20-30 minutes). Keep it fixed so prompt or rubric changes can be compared.
- **Top-k hit rate.** Metric: of the owner's "publish" items, what fraction is in the system's top-k (k = 3 or 5)? Also report precision@k. Cheap and directly relevant.
- **Pairwise preference.** Show the owner pairs (system top vs. a mid-rank item); log win rate. Pairwise judgments are faster and less noisy than 1-5 scores, and they feed an Elo-style ranking if you want to tune weights.
- **LLM-as-judge as a proxy only.** Use it for rapid iteration, but calibrate on the human labels first (check agreement). Use a different model family than the picker, to avoid self-preference.
- **Outsider reader test.** Give 3-5 people (or a fresh LLM session without repo context) the finished draft and ask two questions: "what is the one thing you learned?" and "would you share this?". A failure to state the lesson is a failed so-what gate.
- **Ablation.** Re-run with a signal removed (e.g. no cost spikes, no reversal detector) and see whether the top-k changes. This shows which cheap signals earn their place.
- **Post-publication.** If posts go out, track saves and replies per story, but the sample is small and noisy, so use it for direction only.
- **Grounding metrics as a side measure.** Track the claim support rate and the dropped-claims rate per draft.

## 5. Limitations of this research

- I found no prior art that mines agent transcripts specifically for story material. The mapping from adjacent fields (postmortems, news values, summarisation) is my inference, not a tested result.
- Reagan's six arcs come from fiction and sentiment scoring. They are not validated on engineering logs.
- Only the Reagan, FActScore, CoVe and SelfCheckGPT links were confirmed by search this session. The others (Galtung & Ruge, Harcup & O'Neill, Olson, the SRE book, Park et al., Gao et al.) are cited from memory and should be opened before you quote them.
- I did not read the user's repo or the existing tool's code, so the recommendations are not checked against its current signals or rubric. The first thing to check is which of the section 1.1 signals it already computes.
- Rubric weights are untested starting points and should be tuned against the labelled set in section 4.

## 6. Unresolved questions

1. What does the tool already extract deterministically? That decides which rows of 1.1 are real additions.
2. Is the target audience engineers outside the project or a general audience? The "reader-reusable" gate changes between the two.
3. Are the logs complete, or truncated and partial? That decides how widely the lower-bound phrasing rule applies.
4. Is there already a set of past published or rejected stories to use as the frozen labelled set?
