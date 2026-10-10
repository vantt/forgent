# Architecture Advisory Evaluation Rubric

```txt
Document type: Guide / runbook
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Current Boundary

The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.

The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.

## What This Rubric Is

Twelve questions about one advisory session, answered with evidence.

It is deliberately qualitative. There is no score, no weighting, and no total,
because a number would let a session pass by being adequate everywhere while
failing at the only thing that mattered. It would also collide directly with the
panel's own bounds, which forbid tallying and weighted scoring — a panel that
refuses to reduce advisor disagreement to a count cannot coherently reduce its
own quality to one.

This is an optional cognitive evaluation method, not a registered Workflow
schema, mandatory post-close step or completion/approval gate. Manual filenames,
phase numbers and driver vocabulary below are examples. Current report mapping
is framing; three blind shaping reports; reviewed critique; final RAW JSON
synthesis packet with dispositions; explanation; owner missing-expertise close.
No separate Decision Request, rubric.md or directory-recovery step is scheduled.

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

For a separately chosen manual evaluation, the following order avoids anchoring; it is not the registered Workflow order:

1. **The person's own assessment comes first**, before any evaluator, Reviewer,
   or Red-Team output exists or is shown to them. What they found useful,
   premature, shallow, or over-mechanized is the single highest-authority input
   here, and it is worthless if anchored.
2. **The evaluator runs second**, and **the evaluator is never the session
   driver.** A driver assessing its own session is self-assessment with an
   evaluation label on it.
3. **Manual evaluator/reviewer feedback follows the person's assessment.**
   Registered critique and final-packet reviewer/red-team checks instead run
   where the actual Workflow declares them, before explanation and human close.

An optional `rubric.md` export can follow the
[manual templates](architecture-advisory-artifact-templates.md); it does not
replace real Unit reports or add a human gate.

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

**Where to look.** The original verbatim request against the registered framing
report and the actual context passed into blind shaping. Optional manual
intake/interpretation/scout exports are additional evidence, not required files.

**Strong.** The axis of the question moved for a stated reason. "One pipeline or
two" became "an unowned shared contract" because the investigator counted the
commit coupling and found duplication was low. The person can see why the
question changed and would agree it is now the right question.

**Weak.** The shaping frame merely replaces the input sentence with architecture
vocabulary, or changes it without evidence. That is preference, not reframing.

**False pass.** Elaborate restatement. A page of framing that adds structure,
headings, and terminology to the original wording without adding a single fact.
It reads like understanding and contains none. The test: point at the observation
that made the frame move. If there isn't one, this is a false pass.

---

## 2. Questions Were Necessary, Consolidated, And Well Explained

**What it is really asking.** Was the person's attention treated as expensive?

**Where to look.** The request, framing report, recorded user-exclusive gaps
and the actual human close answer. Optional manual Decision Requests are not
additional registered gates.

**Strong.** Repository-answerable gaps were investigated; nonblocking
user-exclusive gaps remain named defaults. Necessary unsafe-to-infer owner
obligations were made explicit. The registered close asks its declared batched
missing-expertise question; it does not silently become a mid-graph survey.

**Weak.** Multiple contacts. A question answerable from the repository. A "why it
matters" that says "to better understand your requirements". No default, so the
panel is idle until the person responds.

**False pass.** One well-formatted Decision Request containing a question that
did not need asking. Consolidation is necessary but not sufficient — a single
tidy packet of ceremonial questions passes the letter of this dimension and fails
it entirely. Check each question against the recommendation: if the panel would
recommend the same thing under every plausible answer, the question was
decoration.

**Also strong.** Investigating without unnecessary contacts. The required
registered close answer still occurs; avoiding ceremonial questions does not
authorize skipping the missing-expertise gate, even when its array is empty.

---

## 3. Alternatives Were Materially Different And Credible

**What it is really asking.** Did the person get a real option space, or a
front-runner with escorts?

**Where to look.** The three registered shaping reports, side by side, including
credible smaller/no-build alternatives. Manual proposals/ filenames are optional.

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

**Where to look.** The framing report's tested hypotheses, disconfirming
observations and their downstream effect; no separate scout-report.md is required.

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

**Where to look.** Actual reviewed critique and synthesis evidence, including
conceded attacks and any changed claim. There is no automatic re-shaping loop
or mandatory append-only v2 proposal file in the registered linear graph.

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

**Where to look.** Shaping and critique positions traced into the final RAW JSON
packet, including its attributed dissent and dispositions.

**Strong.** An unrefuted disagreement appears in the packet body — not a footnote
— attributed by role, with what would settle it, and an explicit statement that
it was not refuted. The packet carries the corresponding unresolved disposition; a manual `dispositions.md` export is optional.

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

**Where to look.** The final RAW JSON packet's recommendation and evidence. Per-claim confidence is optional quality guidance, not a required registered field.

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

**Where to look.** The registered explanation report against the settled packet,
plus actual owner feedback when available. Optional rubric.md is not required,
and the expertise close answer is not necessarily evidence of understanding.

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

## 9. A Fresh Session Can Resume Through The Registered Workflow

Evaluate whether evidence and unresolved decisions remain available through Workflow-owned records and the registered skill boundary. Do not score a session.md ledger, hand-run graph or coordinator reading raw run-state as if those were the registered runtime. The actor does not resume the Workflow itself; Workflow resume and human gates are the owning doors. Evidence: core/skills/fgos-architecture-panel/SKILL.md:17-37; core/workflows/architecture-advisory.yaml:78-84.

Evidence must preserve pending decisions, attributed findings and reversibility; losing a local terminal is not completion or approval.

## 10. Independence Is Material, Not A Decorative Model Roster

Evaluate whether the fixed shaping seats offer materially different system, alternative and constraint lenses and whether independent final-packet checks preserve dissent. Actor/model selection is governed by configuration and bind(), not a hand-written roster or manual run record. Evidence: core/workflows/architecture-advisory.yaml:18-64; core/skills/fgos-architecture-panel/SKILL.md:17-24.

Model/provider diversity alone is not proof of cognitive independence; report its demonstrated effect and limits without inventing live routing evidence.

## 11. Every Shaper Stated Falsification Criteria Before Critics Saw The Proposal

Optional quality dimension: the current shaping template does not require a
falsification-criteria field or a pre-critique timestamp. Assess only actual
recorded criteria; absence is not automatically Workflow failure.

**What it is really asking.** Did proposals expose observable conditions that
would refute them? This improves criticism but does not create a new runtime
precondition, field or gate.

**Where to look.** Actual shaping reports and cited observations. A manual
timestamp claim must be evidenced, not inferred from a template filename.

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

Optional manual assessment discipline. The registered Workflow has no required
rubric.md/evaluator step; missing that optional exercise does not invalidate
registered completion. If an assessment is performed, preserve real authorship
and acquisition order, and do not invent the person's words.

**What it is really asking.** Is the evidence about the session's usefulness
uncontaminated?

**Where to look.** Actual feedback and independent evaluator records, when collected; manual rubric.md parts are one optional format.

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

These are manual quality verdicts only, not runtime outcome enums, a substitute
for the declared human close, approval of advice, or permission to implement.

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
- **Protocol conformance.** This manual quality rubric is not a runtime
  conformance gate. The architecture-advisory Workflow and skill already ship
  (`core/workflows/architecture-advisory.yaml`, `core/skills/fgos-architecture-panel/SKILL.md`).
  Compare advice quality on the same case without treating this rubric as a
  required score the registered runtime must pass; conformance alone is not quality.
