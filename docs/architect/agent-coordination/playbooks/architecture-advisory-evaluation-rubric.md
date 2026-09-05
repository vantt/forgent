# Architecture Advisory Evaluation Rubric

Document type: Playbook
Design status: N/A
Implementation: Active (manual)
Last reviewed: 2026-09-05
Canonical for: judging whether an advisory session actually advised well

## What This Rubric Is

Twelve questions about one advisory session, answered with evidence.

It is deliberately qualitative. There is no score, no weighting, and no total,
because a number would let a session pass by being adequate everywhere while
failing at the only thing that mattered. It would also collide directly with the
panel's own bounds, which forbid tallying and weighted scoring — a panel that
refuses to reduce advisor disagreement to a count cannot coherently reduce its
own quality to one.

Each dimension gets one of four verdicts:

- **demonstrated** — the artifacts show it happened, with a citation.
- **partially demonstrated** — it happened in part; name precisely what is
  missing.
- **not demonstrated** — no evidence it happened. Note that this is different
  from "it was done badly", and both are worth recording distinctly.
- **structurally invalid** — the session's own structure makes this dimension
  unanswerable. One session-invalidating condition (dimension 12) sits here.

Every verdict cites an artifact path. A verdict with no citation is an opinion
about a session that was supposed to be judged on evidence, which is the same
failure the rubric is testing for.

## Who Evaluates, And In What Order

Order is part of the method, not administration:

1. **The person's own assessment comes first**, before any evaluator, Reviewer,
   or Red-Team output exists or is shown to them. What they found useful,
   premature, shallow, or over-mechanized is the single highest-authority input
   here, and it is worthless if anchored.
2. **The evaluator runs second**, and **the evaluator is never the session
   driver.** A driver assessing its own session is self-assessment with an
   evaluation label on it.
3. **Reviewer and Red-Team run last**, independently of each other, after Parts
   1 and 2 exist.

Recorded in `rubric.md` per the
[artifact templates](architecture-advisory-artifact-templates.md).

## A Note On What Failure Looks Like

The failure mode this whole track exists to prevent is a session that is
impressive and useless: correct process, complete artifacts, well-written prose,
and a person who understood their problem no better afterwards. Several
dimensions below therefore ask specifically about the *false pass* — the shape a
dimension takes when a capable panel satisfies its letter and misses its point.
Read those closely. They are where sessions actually fail.

---

## 1. Understanding Improved Beyond The Initial Wording

**What it is really asking.** Did the panel end up working on a better-formed
problem than the one it was handed? Not a rephrased one — a better-formed one.

**Where to look.** `intake.md` verbatim section against `interpretation.md` and
`scout-report.md`'s "what this means for the framing"; then against the frame the
shapers were actually dispatched on.

**Strong.** The axis of the question moved for a stated reason. "One pipeline or
two" became "an unowned shared contract" because the investigator counted the
commit coupling and found duplication was low. The person can see why the
question changed and would agree it is now the right question.

**Weak.** The frame at Phase 5 is the input sentence with architecture vocabulary
substituted in. Or the frame changed with no cited observation behind the change,
which is not reframing — it is the panel preferring its own question.

**False pass.** Elaborate restatement. A page of framing that adds structure,
headings, and terminology to the original wording without adding a single fact.
It reads like understanding and contains none. The test: point at the observation
that made the frame move. If there isn't one, this is a false pass.

---

## 2. Questions Were Necessary, Consolidated, And Well Explained

**What it is really asking.** Was the person's attention treated as expensive?

**Where to look.** `decision-request.md` (or its recorded absence), the scouting
that preceded it, and the count of separate times a person was contacted.

**Strong.** Either no question was asked and the reasoning for that is recorded,
or exactly one Decision Request went out in which every question names the options
its answer eliminates, states where the panel looked and failed to find it, and
gives a default the person could accept by not replying. The *What We Are Not
Asking* section is populated.

**Weak.** Multiple contacts. A question answerable from the repository. A "why it
matters" that says "to better understand your requirements". No default, so the
panel is idle until the person responds.

**False pass.** One well-formatted Decision Request containing a question that
did not need asking. Consolidation is necessary but not sufficient — a single
tidy packet of ceremonial questions passes the letter of this dimension and fails
it entirely. Check each question against the recommendation: if the panel would
recommend the same thing under every plausible answer, the question was
decoration.

**Also strong, and often missed.** Asking nothing at all. A session that
investigated its way to a recommendation without contacting the person scores
highest here, not lowest.

---

## 3. Alternatives Were Materially Different And Credible

**What it is really asking.** Did the person get a real option space, or a
front-runner with escorts?

**Where to look.** Every file in `proposals/`, read side by side; the no-build
sub-shape; anything the alternative shaper abandoned and why.

**Strong.** The candidates differ in solution *class*, not in mechanics — build
versus buy versus delete versus duplicate versus do nothing. Each is one a
competent engineer could argue for. The no-build path has a rate, a consequence,
and an observable trigger. At least one candidate is materially smaller than the
obvious answer.

**Weak.** Two proposals that produce the same first three months of work.
Cosmetic variation. A no-build path that is one sentence.

**False pass — the important one.** The designated loser. An alternative with
five stated drawbacks and one vague benefit, which nobody could believe its own
author endorsed. This is the most damaging thing that happens in an advisory
panel and it is invisible in the final packet, which will honestly report that
alternatives were considered. Test it directly: read each alternative and ask
whether its author appears to believe it. Then check the proposal's opening line
— any alternative written *relative to* another proposal ("as an alternative to
X") was not independently produced, whatever the roster claims.

---

## 4. Evidence Contradicted As Well As Supported Early Hypotheses

**What it is really asking.** Did anyone go looking for the panel being wrong,
early, when it was still cheap?

**Where to look.** `scout-report.md`'s stated hypothesis and its
evidence-against section; whether anything downstream changed because of it.

**Strong.** The investigator wrote the hypothesis down before looking, found
something that undercut it, and the frame or the candidate set changed as a
result. The disconfirmation is specific and counted.

**Weak.** Every finding supports the framing the investigator was handed. A
codebase is large enough to confirm anything, so unanimous support is evidence of
method failure, not of a correct hypothesis.

**False pass.** A "risks and counter-evidence" section that lists generic
concerns rather than observations. Contradiction has to be about *this* system
and it has to be something the panel would rather not have found.

---

## 5. Advisors Could Change Their Minds And Explain Why

**What it is really asking.** Was the debate capable of moving anyone? A panel
where every advisor's final position equals its first is not deliberating; it is
publishing in parallel.

**Where to look.** Proposal revisions (v2 sections, since artifacts are
append-only), `critiques/` concessions, the "attacks that failed" section, and
whether any falsification criterion was actually triggered.

**Strong.** At least one advisor visibly revised, with the reason and the
triggering evidence recorded, and the superseded position still readable. A
critic that reports an attack it made and lost. A shaper that concedes a specific
claim while holding its overall position — which is more honest than wholesale
capitulation.

**Weak.** No revisions anywhere. Or revision by replacement, where v1 was
overwritten and the change is undetectable.

**False pass.** Polite accommodation — a shaper adding "the critic raises a good
point" without changing anything. Agreeing is not the same as being moved. The
test is whether a claim, a recommendation, or a criterion actually differs.

---

## 6. Dissent Survived Synthesis

**What it is really asking.** Did the tidy final document preserve the untidy
truth?

**Where to look.** Positions live at the end of `critiques/` and `proposals/`,
traced into `synthesis.md`; then `dispositions.md` for how each was handled.

**Strong.** An unrefuted disagreement appears in the packet body — not a footnote
— attributed by role, with what would settle it, and an explicit statement that
it was not refuted. `unresolved` appears in `dispositions.md` where it should.

**Weak.** "The panel is aligned" over a live disagreement. Dissent demoted to
"minor considerations". Anonymous dissent the person cannot weigh.

**False pass — check for this specifically.** Dissent laundering: an `unresolved`
objection dispositioned as `mitigated` so the packet reads clean. The tell is a
`mitigated` entry whose residual-risk line is empty or whose mitigation was
authored by the driver rather than an advisor. This conversion is forbidden by
the disposition doctrine precisely because it passes casual inspection.

---

## 7. The Recommendation Was Decisive But Properly Calibrated

**What it is really asking.** Did the panel commit, and was it honest about how
sure it was? These are both required, and they trade against each other, which is
why they are one dimension.

**Where to look.** `synthesis.md`'s recommendation and per-claim confidence.

**Strong.** One recommendation. Confidence stated per claim, so the diagnosis,
the cost estimate, and the prediction about people carry different weights. What
the recommendation costs is named. Where evidence genuinely cannot separate two
candidates, the packet says so decisively and names the one observation that
would separate them — that is decisive, not evasive.

**Weak.** A balanced menu of three options with symmetric pros and cons, which is
the panel charging the person for work it did not do. Or, at the other end,
uniform high confidence across claims of wildly different quality.

**False pass — the subtle one.** A confident recommendation resting on an
untested inference that is disclosed somewhere late in the document. The packet
is decisive, calibrated-looking, and quietly built on a guess. Trace the
recommendation back to a specific observation; if the chain passes through an
unverified claim, the calibration is cosmetic.

**Second false pass.** A merged recommendation — a fourth architecture assembled
from the proposals, that no advisor proposed, no critic attacked, and no shaper
stated falsification criteria for. It reads as decisive synthesis and is actually
untested authorship.

---

## 8. The Explanation Enabled The Person To Own The Decision

**What it is really asking.** Can they now defend this choice to someone else,
without the panel in the room?

**Where to look.** The Phase 8 explanation, and Part 1 of `rubric.md` — the
person's own words are the primary evidence for this dimension and outrank the
evaluator's reading of it.

**Strong.** The explanation uses their vocabulary and altitude, leads with
consequences rather than architecture, names the first reversible step, names the
conditions under which they should reverse it, and explicitly identifies the
judgment that remains theirs. The person's own assessment reflects understanding
rather than agreement.

**Weak.** Architecture vocabulary the person never used. No reversal conditions.
No statement of what remains their call — which lets a person drift from deciding
into complying, the failure this dimension exists to catch.

**False pass.** The person says "that sounds right". Agreement is not ownership.
Look for evidence they can reconstruct the reasoning: did they push back, ask a
second-order question, or apply the logic to something the panel did not cover?

---

## 9. A Fresh Coordinator Could Resume From Artifacts Alone

**What it is really asking.** Does the session exist on disk, or in a
conversation?

**Where to look.** `session.md`, the completeness of `runs/` against the roster,
and — ideally — an actual attempt. This dimension is testable rather than
inferable, and it should be tested.

**Strong.** `session.md` names the phase and one imperative next action.
`intake.md` and the newest `human/` turn give ground truth. Every dispatched
prompt has a matching run record. Someone genuinely unfamiliar with the session
read these and knew what to do.

**Weak.** "Next action: continue the session." Prompts with no results, so a
successor cannot tell what was interrupted. A phase ledger showing three phases
in progress at once. Critical reasoning that exists only in narration.

**False pass.** Every file exists and is well-formed, but the artifacts do not
say why the panel is where it is. Completeness is not resumability. The only
honest way to score this dimension is to try it.

---

## 10. Provider/Model Diversity Improved Independence Rather Than Decorating The Roster

**What it is really asking.** Two questions, and both must pass. Did every
claimed binding actually happen? And did the diversity buy anything?

**Where to look.** `session.md`'s roster against `runs/*.json`; then the
proposals themselves, read for whether the differently-bound actors actually
thought differently.

**Strong.** Every roster row has a matching run record with a derived
provider/model. The shapers are on different families and their proposals differ
in a way traceable to different priors, not just different wording. The session
report states plainly what the diversity bought — which advisor saw something its
counterpart did not.

**Weak.** A roster listing three providers whose outputs are interchangeable.
`tierMaterial` claimed where the executor derives the same model at every tier.

**Structurally invalid.** A claimed binding with no run record. This is an
overclaim about provenance and it contaminates the session's other evidence,
because a panel that overstates its roster may be overstating its isolation too.

**False pass.** Diversity asserted rather than demonstrated. "We used three
provider families for independence" with no account of what independence
produced. The honest answer is sometimes "nothing distinguishable this time" —
that answer scores better here than an unsupported claim, because it is checkable
and it tells the next session something.

---

## 11. Every Shaper Stated Falsification Criteria Before Critics Saw The Proposal

**What it is really asking.** Did the shapers arrive at the debate as hypotheses
or as advocates? This is the structural precondition for dimensions 4, 5, and 7 —
if it fails, honest debate was not available to the session.

**Where to look.** The falsification section of each `proposals/` file, and the
run-record timestamps of the proposals against the critique.

**Strong.** Criteria present in the v1 proposal body, not appended. Every
proposal's run completed before the critic's run started. Criteria name
conditions that could actually occur in this system and that would genuinely
change the shaper's position.

**Weak.** Criteria missing from one proposal. Criteria added in a v2 after
critique, presented as if they had preceded it — the timestamps make this
detectable and it should be reported as an integrity finding, not a formatting
one.

**False pass.** Falsification theatre: "this would be wrong if the requirements
were completely different", or "if the team disagrees". A criterion that cannot
occur, or whose occurrence nobody could observe, is not a falsification
criterion. Test each one by asking what specific observation would trigger it.

---

## 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver

**What it is really asking.** Is the evidence about the session's usefulness
uncontaminated?

**Where to look.** `rubric.md` Part 1 and Part 2: authorship, and the timestamps.

**Strong.** Part 1 is in the person's own words, timestamped before Part 2
exists, with a recorded account of how they were kept from seeing evaluator
output first. Part 2's author is identifiably not the session driver.

**Weak.** Part 1 paraphrased rather than quoted. The order recorded but not
enforceable from the timestamps.

**Structurally invalid — and this invalidates the whole rubric, not just this
row.** The evaluator is the session driver, or Part 1 was collected after the
person saw evaluator output, or Part 1 was authored by anyone other than the
person. In any of these cases the assessment is a session grading itself, and the
other eleven verdicts cannot be trusted regardless of how they read. Record the
condition, mark the rubric invalid, and re-run the assessment properly. This is
not a procedural nit; it is the difference between evidence and self-report.

---

## Overall Session Verdict

After the twelve dimensions, one verdict:

- **APPROVE** — the session advised well. No dimension is *not demonstrated*
  where it materially mattered, no structural invalidity, and the person's own
  assessment supports it. Dimension 8 and the person's Part 1 carry the most
  weight here: a session can be procedurally excellent and still not have helped,
  and if the person says it did not help, it did not help.
- **REVISE** — real advisory value, with named defects that a further round could
  fix. Name the dimensions and the specific artifact.
- **INSUFFICIENT-EVIDENCE** — the artifacts do not permit a judgment. This is a
  legitimate verdict and it must not be used as a polite `REVISE`. Its most
  common causes are dimension 9 (unresumable) and dimension 10 (unevidenced
  bindings).

## What This Rubric Deliberately Does Not Measure

- **Length or polish.** A short session that reached a good decision beats a long
  one that reached the same decision more impressively.
- **Whether the person took the recommendation.** They hold the authority. A
  session where they decided against the panel, for reasons the panel helped them
  articulate, is a success.
- **Whether the panel agreed with itself.** Preserved disagreement is a feature.
- **Volume of alternatives.** Three real candidates beat six with three escorts.
- **Protocol conformance.** A conformance pass is not on this rubric at all, and
  that is intentional. If a future productized panel conforms perfectly to its
  protocol and scores worse here than this manual playbook did on the same case,
  the productization regressed — the rubric is the thing it has to beat, and the
  protocol is not a substitute for it.
