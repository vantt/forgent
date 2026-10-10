# Architecture Advisory Artifact Templates

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Registered Output Boundary

These are cognitive artifact shapes and optional manual-harness examples. They do not prescribe a session.md filesystem ledger, manual run records, storage ownership or a nine-phase runtime for the registered architecture-advisory Workflow. Its synthesis template requires a final RAW JSON packet; Workflow owns persistence, gates and resumption. Evidence: core/workflows/architecture-advisory.yaml:43-84 and core/skills/fgos-architecture-panel/SKILL.md:17-37,135-142.

| Optional manual artifact | Current registered counterpart |
|---|---|
| intake, interpretation, scout report | Verbatim request and framing report |
| proposals/system, alternative, constraint | Three blind shaping reports |
| critique / constraint findings | Reviewed critique reports and findings |
| synthesis / dispositions | Final synthesis RAW JSON packet |
| explanation | Explanation report preserving the packet |
| human turn | Actual owner close-gate answer; no fabricated user input |
| decision request / specialist / dialogue impact | No automatic graph step; material revisit requires separately authorized reopen |
| session board / prompts / runs / rubric | Optional manual trace/evaluation; not Workflow storage or completion authority |

All numbered templates below are manual shapes, not phase IDs in the registered
graph. Their local checklists are cognitive guidance, not new mandatory runtime
fields, gates, provider rosters or a requirement to write the named files.

## Current Boundary

The registered `fgos-architecture-panel` skill consumes this document for cognitive quality (`core/skills/fgos-architecture-panel/SKILL.md:135-142`). It starts only the registered architecture-advisory definitions and leaves routing to config/bind and execution/human gates to Workflow (`core/skills/fgos-architecture-panel/SKILL.md:17-24`). Provider/model strings in worked examples are dated examples, not a current roster or permission to dispatch.

The complete classified input, including the historical operational sections, is [preserved verbatim](../history/retired-engine/files/playbooks/architecture-advisory-artifact-templates.md#literal-snapshot). The former engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`; see `docs/specs/runner.md`’s historical CoordinationSession section.

## What These Templates Are For

These are reasoning aids, not forms.

A template in this document exists because there is a specific way of thinking
that the artifact is supposed to force. The Decision Request template exists so
that nobody can ask a question without first writing down what happens if it goes
unanswered. The proposal template exists so that falsification criteria get
written before critique rather than reconstructed afterwards. The Decision Packet
template exists so that dissent has a place it cannot be edited out of.

Fill them in that spirit. Every section header below is followed by *why the
section is there* and *what a bad fill looks like*, because a section filled to
satisfy the header is worse than a missing section — it looks complete and
carries nothing.

Three rules apply to every artifact here:

1. **Attribute manual evidence.** Record the actual role, source revision and
   observed run reference; do not fill executor/provider/model claims from a
   requested roster. Registered reports retain their own runtime provenance.
2. **Preserve revision trace.** Append-only manual exports can retain changed
   reasoning, but this does not define Workflow's storage or mandate a second
   ledger beside its registered run records.
3. **A section you cannot fill honestly gets "not determined" plus what would
   determine it.** Never a plausible-sounding placeholder. The gap is the
   information.

The role doctrine supplies cognitive expectations. Executable operating rules belong to the registered `fgos-architecture-panel` skill and Workflow; the coordinator companion is not a manual dispatch door.

---

## Standard Provenance Header

Optional manual provenance header; registered reports do not require this literal header or the example prompts/runs directory layout.

```text
Role: <role name>
Author: <executor id> / <provider> / <model> / <tier>
Dispatch: prompts/<role>.md -> runs/<ordinal>-<role>.json
Reads: <the exact artifacts this actor was shown>
Revision: v<n>  (supersedes v<n-1>, which stays below)
Written: <timestamp>
```

`Reads` is an explicit input claim to check against actual input/confinement
evidence. A hand-written list alone does not prove machine-enforced isolation.
Check that critique actually received the proposals it claims to examine.

---

## 1. Intake Record — `intake.md`

Registered counterpart: preserve the verbatim request and use the framing
report. This optional intake file adds no roster-selection or recovery door.

**Why this exists.** It is the only artifact that predates the panel's opinion. It
is what every later interpretation is checked against, and it is the first thing a
recovering coordinator reads. If it is contaminated by interpretation, nothing
downstream can be audited.

```text
# Intake — <case slug>

Author: external driver (coordinator)
Written: <timestamp>

## The Person's Words (verbatim, never edited)

> <exactly what they said, including the vagueness, the hedges, the asides, and
> anything that seems irrelevant>

Channel: <how this arrived — typed, pasted, relayed, transcribed>

## Who Is Asking

<who they are; what authority they hold over this decision; who else must live
with it>

## Case Boundary

Project under advice: <absolute path>
Genuinely undecided: <what is actually open>
Explicitly out of bounds: <what they ruled out, in their words>
Constraints they volunteered: <verbatim where possible>

## Coordinator's Boundary Check

Is this actually undecided, or is the person seeking ratification?
<answer, with what led you to it>

## Roster Resolved At Intake

<the routing table, fixed before any advisor has an opinion>
```

**Bad fill.** Rewriting "EOD and intraday evolution is becoming difficult" as
"the user requires a maintainability improvement for their dual-pipeline
architecture". That is an interpretation with a diagnosis in it, recorded in the
one place that is supposed to be interpretation-free. Every downstream artifact
now inherits a diagnosis nobody made and nobody can trace.

---

## 2. Interpretation — `interpretation.md`

Registered counterpart: the framing report. This optional filename is not a
separate interpretation step or mandatory runtime artifact.

**Why this exists.** To make the lead advisor's reading a separate, attributable,
challengeable object rather than an invisible assumption. This is the artifact
that keeps "what they said" and "what we think they meant" apart forever.

```text
# Interpretation — <case slug>

<provenance header>

Reading of: intake.md (verbatim section)

## Intent
<what they are actually trying to achieve>
Confidence: <high | medium | low> — <what the confidence rests on>

## Altitude
<module / boundary / service / team / product bet>
Confidence: <...>

## Vocabulary To Adopt
<their terms, and the panel terms they replace>

## Constraints
Stated: <...>
Implied, and why I infer them: <...>

## Risk Appetite
<inferred, with the observation it is inferred from>
Confidence: <...>

## Decision Burden
<what makes this hard for this person specifically>

## Largest Uncertainty
<the single uncertainty that most changes what the panel should do, and which
candidate options it would separate>

## Ambiguities I Deliberately Did Not Resolve
<readings held open for evidence to collapse, and what would collapse them>
```

**Bad fill.** Uniform confidence, or no confidence at all. If every inference
reads as equally certain, downstream roles cannot tell which one to verify, and
the "largest uncertainty" section becomes arbitrary. The section that most often
gets skipped is the last one — and skipping it means an ambiguity got resolved by
choice rather than by evidence, silently.

---

## 3. Scout Report — `scout-report.md`

Registered counterpart: repository investigation in the framing report. There
is no separately scheduled scout step in the registered advisory graph.

**Why this exists.** To separate what is observed from what is believed, and to
force disconfirmation to happen before divergence rather than during critique.

```text
# Scout Report — <case slug>

<provenance header>

## Hypothesis I Was Asked To Attack
<the panel's current belief, stated plainly>

## Evidence Against That Hypothesis
<lead with this — it is the section most likely to change the session>
<each finding: the observation, the path or command, the count or magnitude>

## Evidence Supporting It
<same standard: path, count, magnitude>

## What This Means For The Framing
<whether the question's own axis survives; state it, do not recommend>

## Magnitudes And Trends
<numbers over adjectives; rate of change over current state>

## Absences
<what is missing: no tests here, no owner there, no monitoring at all. State
"I looked and it is not there" distinctly from "I did not look">

## Could Not Determine
<each item: what it is, what I tried, and what would determine it. Flag anything
that no amount of repository reading can answer — retain it as a user-exclusive gap>
```

**Bad fill.** Adjectives with no counts ("tightly coupled", "limited coverage"),
a supporting-evidence section with no disconfirmation section, or any sentence
beginning "the architecture would benefit from". The last one is out of lane and
contaminates every shaper who reads it.

---

## 4. Decision Request — `decision-request.md`

Optional manual missing-input discipline, not a registered pre-recommendation
human gate. The current close gate asks one missing-expertise question; carry
safe defaults for nonblocking gaps and do not invent an intermediate gate.

**Why this exists.** This is the one artifact the person is asked to act on
before the recommendation exists, so it is the one place premature or ceremonial
questions do real damage. The template's job is to make an unnecessary question
hard to write: you cannot fill "what we will assume if you do not answer" for a
question that does not matter.

```text
# Decision Request — <case slug>

<provenance header — lead advisor authors, driver authorizes>
Authorized by: external driver, <timestamp>
Sent once, on: <timestamp>

## Before We Ask

We investigated first. Here is what we found on our own, so you are not being
asked to be our search engine:
<two or three sentences of what the scouting established>

## Questions

### Q1 — <the question in the person's own vocabulary>

Why it matters: <which candidate options the answer eliminates. If the answer
changes nothing, delete this question>

What we could not find: <where we looked and what was not there — this is the
proof the question survived investigation>

If you do not answer, we will assume: <the panel's default, stated so plainly
that the person can simply not reply if it is fine>

### Q2 — ...

## What We Are Doing While We Wait

<the work continuing that does not depend on these answers — a pending question
must not idle the panel>

## What We Are Not Asking

<questions the panel considered and dropped, with why. This section protects the
person from a second round and shows the discipline was real>
```

**Bad fill.** A question whose "if you do not answer" line reads "we cannot
proceed" for something the panel could have defaulted; a "why it matters" that
says "to better understand your requirements" instead of naming the options it
separates; or any question that a `git log` would have answered. If the *What We
Are Not Asking* section is empty, the filter probably was not applied.

---

## 5. Candidate Architecture Proposal — `proposals/<role>.md`

Registered counterpart: blind system/alternative/constraint shaping reports.
Falsification criteria are quality guidance, not required fields in the current
shaping template; a claimed timestamp must be backed by an actual observation.

**Why this exists.** To make a proposal into a hypothesis instead of a pitch. The
falsification section is the load-bearing part of this template and it must be
written before any critique is visible — its timestamp is checkable evidence that
the debate was honest.

```text
# Proposal — <case slug> (<role>)

<provenance header — Reads must list the frame and evidence only, no siblings>

## Priors I Am Applying
<especially for the alternative shaper and constraint advocate: what you are
weighting and why, grounded in something observed>

## The Proposal
<what to do, concretely, in this system, referencing real paths>

## Why This Follows From The Evidence
<each claim tied to a scout observation; where the chain is inference, say so>

## Load-Bearing Constraint
<the one thing that, if it changed, would change this whole proposal>

## What This Makes Harder
<every architecture trades something. Name the cost precisely, including who
feels it and how often>

## The Half-Adopted State
<what this looks like when it is 40% done, because that is where it will live
for months>

## First Reversible Step
<what could be done in about a week that validates or kills this cheaply>

## Resting On Evidence vs Resting On Assumption
Evidence: <claims backed by a cited observation>
Assumption: <claims that are not, named plainly so critics can target them>

## Falsification Criteria — written before critique
1. <a condition that could actually occur and would make this wrong>
2. ...
```

**Bad fill.** A benefits list with no cost section. A proposal that would read
identically for a different codebase (the give-away is no paths). Falsification
criteria that cannot occur ("this is wrong if the requirements were entirely
different"). And for the alternative shaper specifically: any proposal written
*relative to* another proposal ("as an alternative to X") — that phrasing is
proof the isolation failed or was imagined.

### No-Build Path — cognitive quality sub-shape

The no-build path is a candidate, not a placeholder. It gets the same treatment:

```text
## No-Build Path
Current cost of doing nothing: <observed rate × observed cost, with the source>
Trend: <is the cost rising, and how fast>
What breaks first, and how it is noticed: <or: it is not noticed, which is a
finding in itself>
Trigger to revisit: <a condition someone will actually observe>
```

**Bad fill.** "Alternatively, we could do nothing." A no-build path without a
rate, a consequence, and an observable trigger has not been offered — and it is
the option most likely to be correct.

---

## 6. Critique / Attack Record — `critiques/<role>.md`

Registered counterpart: reviewed critique. Findings remain attributed; this
manual record does not automatically reopen shaping or authorize a new run.

**Why this exists.** To turn criticism into something settleable. Every attack
carries the observation that would resolve it, so the panel can distinguish "we
argued" from "we found out".

```text
# Critique — <case slug> (<role>)

<provenance header — Reads must list every proposal, and no shaper's private notes>

## Attack <n> — on <target proposal>: <the specific claim being attacked>

Decision-changing if it lands: <yes | no> — <what flips>

The claim: <quote or cite it precisely>
Why it may be false: <the mechanism, not a vibe>
What would settle it: <a specific, bounded observation, with an effort estimate
where you can give one>

## Attacks That Failed

<attack attempted, what you checked, why it held. Reporting these is how the
packet distinguishes tested claims from untested ones>

## Contradictions Between Proposals

<where two proposals assert incompatible things about the same system — at least
one is wrong and evidence can usually say which>

## Shared Unexamined Assumption

<anything every proposal assumes without checking. You are the only role
positioned to see this>
```

**Bad fill.** Symmetric one-paragraph criticism of each proposal (conveys no
signal about which is weakest); unfalsifiable attacks ("may not scale"); attacks
on solution classes in general rather than on this system; and an empty
"attacks that failed" section, which usually means the critic attacked only what
was easy.

---

## 7. Constraint Findings — optional manual constraint/critique shape

Registered counterparts: constraint-lens shaping and reviewed critique reports,
not a separate numbered runtime phase or mandatory file.

**Why this exists.** To force ranking and reversibility judgment, which is the
entire value of this role. A flat risk list is indistinguishable from noise.

```text
## Constraint Findings — ranked

### 1. <proposal> — <the concern> (<HIGH | MEDIUM | LOW>, <reversible | IRREVERSIBLE>)

The mechanism: <what actually goes wrong, with the path>
Magnitude: <how long the exposure lasts, how many people, how it is noticed>
Cheapest mitigation: <the smallest thing that makes this survivable>

### 2. ...

## Concerns I Considered And Did Not Raise
<security, scale, supply chain — say explicitly when a candidate does not touch
them. This is more useful than listing them for completeness>
```

**Bad fill.** The generic five (security, scalability, maintainability,
operations, migration) recited without reference to any proposal or path.
Symmetric findings across candidates. No reversibility marking — which is the one
judgment nobody else in the panel is making.

---

## 8. Decision Packet — `synthesis.md`

Registered counterpart: the final RAW JSON synthesis packet. This Markdown
shape is an optional manual reading aid, not a substitute for the required
packet fields. Per-claim confidence is optional; `"missing expertise"` is a
required array in the registered packet.

**Why this exists.** This is what the person receives. It has to be decisive
enough to be useful and honest enough to be trustworthy, and those pull against
each other. The template resolves the tension by separating the recommendation
from the confidence from the dissent, so decisiveness never requires hiding
anything.

```text
# Decision Packet — <case slug>

<provenance header — Reads must list the full ledger>

## Recommendation

<one thing. If the evidence genuinely cannot separate two candidates, say that
decisively and name the one observation that would separate them — that is a
recommendation, not a hedge>

## Why This, Over The Others

<what you are choosing against, and what it costs to choose against it>

## Conditional Branches
<if the recommendation depends on an open check, give the person the branches now
so they are not left waiting on the panel>

## True Regardless Of The Outcome
<findings that stand independent of which candidate wins. These are often the
most immediately useful part of the packet>

## Confidence, Per Claim

- <claim>: <high | medium | low | unverified> — <what it rests on>
- ...

<never a single document-level confidence — a diagnosis, a cost estimate, and a
prediction about people do not deserve the same number>

## Surviving Dissent

<who holds it, what they hold, what would settle it, and the explicit statement
of whether it was refuted. Attributed by role, never anonymous — the person needs
to be able to weigh the source>

## Values Choices Evidence Cannot Settle

<where the disagreement is about what the person wants rather than what is true.
Naming these prevents the panel from pretending a preference is a finding>

## Unchecked Falsification Criteria

<criteria the shapers stated that nobody verified, recorded as open rather than
quietly treated as satisfied>

## Provenance And Gaps

<per actor: executor/provider/model/tier, which proposal revision each critique
applies to, and any actor that failed or was never dispatched>
```

**Bad fill.** A recommendation that merges the proposals into a fourth
architecture no advisor proposed and no critic attacked — this is synthesis
becoming silent authorship and it is the most dangerous single failure in the
packet. A single "Confidence: high". Dissent demoted to "minor considerations for
the future". "The panel is aligned" where there was an unrefuted disagreement.
Missing provenance.

---

## 9. Human-Facing Explanation — `explanation.md`

**Why this exists.** Explanation is a distinct registered report preserving
the final packet's verdict, expertise list and dissent. The optional manual
`explanation.md` below is a human-facing reading aid, not a required separate
filesystem export or the output of a retired Phase 8 graph.
The explanation supports ownership: the person should be able to defend the
recommendation's consequences and evidence to a colleague, without changing
the packet's verdict or laundering its unresolved dissent.

```text
# Explanation — <case slug>

<provenance header — lead advisor; Reads: synthesis.md, intake.md, and every
human/ turn. Never a shaper's private notes>

Revision: v<n> — <if v2+, what dialogue turn prompted it. Append below the
previous revision; never overwrite one>

## What We Think You Should Do

<the recommendation, in their vocabulary and at their altitude. If they said
"job" and "EOD", this section says "job" and "EOD">

## What This Means For Your System, Concretely

<name real paths and real behaviors. "You will be able to change the intraday
path without re-testing EOD" — not "this improves modularity">

## What Gets Easier

<...>

## What Gets Harder

<every architecture trades something, and the person needs to have been told
what before they commit, not after. Name who feels it and how often>

## The First Reversible Step

<what to do this week that validates or kills this cheaply, and what it costs>

## When You Should Reverse This

<the observed condition — a number, a rate, an event they will actually see —
that means this was the wrong call. "If cross-pipeline breakages exceed 3 a
month after the change, this did not work">

## What We Are Not Sure About

<the panel's live uncertainty, in plain terms, including any dissent that
survived into the packet, attributed. Do not smooth it>

## What Stays Yours

<explicitly: the judgment the panel cannot make for them, and why it is theirs.
Usually a values or appetite call — how much disruption is acceptable, how much
optionality is worth paying for. Name it as a decision, not as a caveat>
```

**Bad fill.** Restating `synthesis.md` with the provenance stripped out — that is
a shorter packet, not an explanation, and the tell is that it still uses the
panel's vocabulary rather than the person's. A "what gets harder" section that
lists only mild costs while the constraint advocate's HIGH finding stays in the
packet. Surviving dissent softened to "some considerations", which is the same
laundering the packet forbids, committed one document later where nobody is
checking. And an explanation with no "what stays yours" section, or one that
reads as a disclaimer ("of course, the final decision is yours") rather than
naming the specific judgment — that sentence is the difference between a person
owning a decision and a person complying with one.

---

## 10. Dialogue Turn — `human/<n>-person.md`

Registered counterpart: the actual human close answer. This optional transcript
file cannot replace the public Workflow answer or fabricate approval.

**Why this exists.** The person's words are evidence with the highest authority
in the session. They are stored alone, unedited, so that no later artifact can be
mistaken for them.

```text
# Dialogue Turn <n> — the person

Received: <timestamp>
Channel: <typed | pasted | relayed | transcribed>
Recorded by: external driver

## Verbatim

> <exactly what they said>

## Nothing Else Goes In This File
```

That last line is part of the template. No interpretation, no summary, no
paraphrase, no "the user is asking about…". Those go in the impact assessment.

**Absolutely forbidden.** Writing this file when no person has spoken. Not as a
placeholder, not as a best guess, not clearly labelled as simulated. If no person
is available, the session parks. A fabricated human turn invalidates the session
even if the guess was correct.

---

## 11. Dialogue Impact Assessment — `dialogue/<n>-impact.md`

Optional manual interpretation of a turn; not a conditional graph node.
Material revisit uses the separately authorized registered reopen Workflow.

**Why this exists.** A dialogue turn is not self-interpreting. This artifact is
where the lead advisor says what it thinks the turn means, what it changes, and
what it does *not* change — separately from the person's words, separately from
the driver's authorization to act, and separately from the panel's eventual
response. It is the hinge of the four-layer separation, and it is the artifact
that makes "the panel answered what was actually asked" checkable months later.

```text
# Dialogue Impact Assessment <n>

<provenance header — lead advisor; Reads: human/<n>-person.md>

## Turn Classification

<clarification | challenge | new context | alternative requested |
composition requested | decision | deferral>

Why I classify it this way: <the words that led you here — classification drives
whether anything reopens, so it must be defensible>

## What They Said, In My Reading

<interpretation, explicitly labelled, with uncertainty. Never quoted back as if
it were their words>

## What This Changes

Conclusions affected: <name them, and say how>
Conclusions NOT affected: <equally important — this is what stops a single
comment from spuriously reopening the whole session>

## What Reopens, If Anything

Affected registered report: <framing | shaping | critique | synthesis | explanation; no automatic jump>
Scope of the reopen: <bounded, specific, predeclared>
Why nothing smaller would do: <a reopen is expensive; justify it>

## Consumes A Reopen Cycle?

<clarification never does; material change does. State which and why>

## What I Would Need From The Person To Go Further

<or: nothing — we have what we need>
```

**Bad fill.** Classifying a challenge as a clarification to avoid reopening — the
tell is a "what this changes" section reading "nothing" for a turn where the
person disputed a claim. Also: an assessment that quietly folds the
interpretation into the person's voice, and a reopen with unbounded scope
("revisit the design"), which is how a bounded dialogue becomes an unbounded one.

---

## 12. Dialogue Response — `dialogue/<n>-response.md`

Optional manual response trace. Registered gates/continuation remain with
Workflow; no companion-directory crash-recovery guarantee is asserted.

**Why this exists.** This is the fourth and last layer of the Dialogue Turn
Protocol, and the one most likely to go unwritten — because a clarification
answered in conversation feels finished. It is not: a successor coordinator
reading `human/3-person.md` with no `dialogue/3-response.md` beside it cannot
tell whether the person was answered or dropped, and that is exactly the state
crash recovery is supposed to make impossible.

It is also the layer where authority leaks. The response is produced under the
driver's authorization, and naming that authorization here is what makes it
checkable later that the panel did what it was permitted to do and not more.

Every turn gets one, including the small ones. A one-paragraph response with a
citation is complete; a missing file is not.

```text
# Dialogue Response <n>

<provenance header — the role that authored the response. For a clarification
this is normally the lead advisor; for a reopen it is whichever advisors ran>

Responds to: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized by: dispositions.md § <D-id> — <the authorization in one line>

## What The Panel Says Back

<the actual response, in the person's vocabulary. If it defends a claim, it
cites the artifact the claim rests on; if it concedes, it says so plainly>

## What Ran To Produce This

<none — answered from existing artifacts | the actors dispatched, with their
run records. "None" is a legitimate and common answer for a clarification>

## What Changed As A Result

Artifacts revised: <path and revision, or: none>
Recommendation: <unchanged | changed, and how>

## What Did Not Change, And Why

<the conclusions this turn left standing. Stating these is what stops one
comment from being remembered later as having overturned more than it did>

## Still Open After This Turn

<or: nothing — the turn is closed>
```

**Bad fill.** A response with no `Authorized by` line, which means either the
authorization was never recorded or the panel answered on its own initiative —
both are findings for a red-team. A response that quietly exceeds its
authorization: authorized to answer a clarification, it also revises the
recommendation. A response that answers the impact assessment's reading rather
than the person's actual words — the tell is that it never quotes or cites
`human/<n>-person.md`. And the worst one, because it is invisible: no file at
all, for a turn the coordinator answered in conversation and considered handled.

---

## 13. Disposition Entry — `dispositions.md` (append-only)

Registered counterpart: disposition content in the final RAW JSON packet,
challenged by its reviewer/red-team. This manual append-only ledger is optional
and grants no independent driver authorization or human decision authority.

**Why this exists.** Disposition is an authority act. Recording it with its
evidence is what makes the authority auditable, and what lets a red-team catch a
driver deciding a technical question it was never shown evidence for.

```text
## <D-id> — <the finding, in one line>

Source: <role, artifact path>
Disposition: <accepted | answered | mitigated | deferred | unresolved |
invalidated-by-evidence>
Rationale: <why>
Evidence: <path or run result — REQUIRED for answered and
invalidated-by-evidence; the advisor who observed it, named>
Changes: <what actually changes as a result — required for accepted>
Residual: <required for mitigated: what risk remains after the mitigation>
Supersedes: <prior D-id, if this is a changed mind>
```

**Bad fill.** `invalidated-by-evidence` with a rationale beginning "probably" and
an empty Evidence line — that is the driver deciding a technical claim on its own
authority, which the doctrine forbids. `mitigated` with a mitigation the driver
wrote itself and no residual. `answered` with no citation. And any disposition of
a finding about the driver's own conduct — those escalate, they never
self-clear.

### Dialogue Authorization — sub-shape in the same file

A dialogue turn's authorization is recorded here too, under its own id, because
it is the same kind of act: the driver saying what the panel may do. It is not a
disposition of a finding, so it takes a shorter shape:

```text
## <D-id> — authorization for dialogue turn <n>

Turn: human/<n>-person.md
Reading applied: dialogue/<n>-impact.md
Authorized: <what the panel may do — which phase reopens, which actors run, what
the response may cover>
NOT authorized: <the adjacent thing the panel may not do on this turn. Naming it
is what makes an overreach detectable>
Reopen consumed: <yes | no>
Response: dialogue/<n>-response.md
```

**Bad fill.** An authorization phrased as an opinion about the architecture
("authorized: option B does look stronger, revisit it") — the authorization
grants permission and says nothing about which option is right, and a driver
that editorializes here is one step from its authorization being read later as
the person's decision. An empty `NOT authorized` line for a reopen, which turns
a bounded reopen into an unbounded one.

---

## 14. Session Status Board — `session.md`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** This is the crash-recovery entry point. A fresh coordinator
with no chat history reads this file first and must be oriented by it alone.

```text
# Session — <case slug>

Phase: <1-9>, <phase name>
Status: <in-progress | awaiting-person | parked | closed>
Next action: <one imperative sentence — "dispatch alternative shaper against
frame v2 using agy-bwrap/analytical">
Last updated: <timestamp>

## Case

<one line, in the person's words>
Project under advice: <path>

## Roster

| Role | Executor | Tier | Derived model | Prompt | Run |
|---|---|---|---|---|---|
| ... | ... | ... | ... | prompts/... | runs/... |

## Phase Ledger

| Phase | Status | Artifact |
|---|---|---|
| 1 Intake | done | intake.md |
| ... | | |

## Open Threads

<anything awaiting a person, an actor, or an observation>

## Recovery Note

<anything a successor genuinely could not infer from the artifacts>
```

**Bad fill.** A "Next action" like "continue the session" — that is the one field
a successor depends on, and a vague fill makes the whole recovery procedure fail.
A roster table with requested executors but no derived models. A phase ledger
that says "in progress" for three phases at once.

---

## 15. Prompt Package — `prompts/<role>.md`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** The prompt is the isolation. In manual mode, "the shapers
could not see each other" means precisely "these files contained no sibling
output", so the files are the evidence and they are immutable once dispatched.

```text
# Prompt — <role>, <case slug>

Ordinal: <n>
Executor: <id> / tier <tier>
Immutable: yes — if this prompt was wrong, dispatch a new ordinal

## Your Role

<point at the role doctrine by path; do not paste it>
Read: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md,
section <role>

## The Case

<the frame, as settled — identical across a cohort of isolated actors>

## Evidence You May Read

<paths only. Never paste documents into a prompt>

## What You Must Not Read

<for isolated cohorts: name the sibling artifacts explicitly, so a breach is
detectable rather than deniable>

## What You Produce

<artifact path, and the template section of this document that shapes it>

## Finish With

Status: DONE | DONE_WITH_CONCERNS | BLOCKED
plus a two-line summary.
```

**Bad fill.** Pasting the scout report inline instead of passing the path (bloats
context and makes revisions untraceable). Omitting the "must not read" section for
an isolated cohort. Editing a prompt after dispatch — which destroys the only
evidence that isolation held.

---

## 16. Run Record — `runs/<ordinal>-<role>.json`

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

**Why this exists.** Provenance the packet's claims are checked against. The
red-team opens these files; a roster claim with no matching run record is an
overclaim.

```json
{
  "ordinal": 3,
  "role": "alternative-shaper",
  "requested": { "executor": "agy-bwrap", "tier": "analytical", "persona": "..." },
  "decision": { "mechanism": "out-of-process", "configured": true },
  "derived": { "provider": "gemini", "model": "gemini-3.1-pro-low" },
  "tierMaterial": true,
  "promptPath": "prompts/alternative-shaper.md",
  "artifactPath": "proposals/alternative-shaper.md",
  "startedAt": "...",
  "completedAt": "...",
  "status": "DONE",
  "notes": "..."
}
```

`tierMaterial` records whether the actual derived model changed materially for the requested tier. Determine it from the current governed routing result; dated provider examples do not prove today’s tier behaviour.

---

## 17. Red-Team Report — `redteam.md`

**Why this exists.** This optional manual attack-record shape supports cognitive
red-team quality. The registered red-team checker reads the actual final RAW
JSON packet and emits concrete findings/evidence or explicitly none; it does
not require a file named `redteam.md` or a manual `APPROVE` enum.
An attack names what was actually checked, the observed result and its
consequence. Failed attacks are reported too, so a reader distinguishes tested
claims from untested ones; no check may be fabricated from a filled template.

The current target is the final producer packet. Check actual checker inputs
before claiming independence; manual file ordering alone does not prove it.

```text
# Red-Team — <case slug> (verdict: <APPROVE | REVISE | INSUFFICIENT-EVIDENCE>)

<actual observed provenance, not a mandated provider-family roster;
Reads: the actual packet and supplied evidence references>

## Attack <letter> — <what I tried to falsify>: <PASSED | FAILED | PARTIAL>

What I checked: <the files opened, by path. Not "I reviewed the artifacts">
What I found: <the observation, quoted or cited>
What it means: <not proven | false | holds — and these are different>
Severity: <HIGH | MEDIUM | LOW> — <only for FAILED and PARTIAL>
Named remedy: <the specific thing that would close it. A finding with no remedy
is harder to disposition and easier to wave away>

## Attacks That Failed, Reported

<the ones where the session held up. Omitting these makes the report look
thorough and makes it useless as evidence that anything was tested>

## Process, Authority, And Provenance

<the attacks that are not about architecture at all: did the isolation hold, do
the run records match the roster claims, did any disposition decide a technical
question without an advisor's evidence, is any human turn unsourced, do the
falsification timestamps precede the critique they claim to>

## Verdict

<APPROVE | REVISE | INSUFFICIENT-EVIDENCE>
<one paragraph: which findings drive it. INSUFFICIENT-EVIDENCE is a real verdict
for a session whose artifacts do not let you check it — never a polite REVISE>
```

**Bad fill.** A report with no file paths, which means the artifacts were never
opened. An empty "attacks that failed" section. Cosmetic findings — ordering,
conciseness, numeric confidence — presented beside an authority violation at the
same weight; note that recommending numeric confidence also pushes against the
panel's own bounds. A verdict of `APPROVE` where no attack section shows a
`runs/` file was read. And the subtle one: a red-team that only attacked the
architecture, producing a competent second critique while the process, the
provenance, and the driver's authority went unchecked.

---

## 18. Reviewer Assessment — `review.md`

**Why this exists.** The registered reviewer and red-team challenge the producer's
final synthesis packet through the reviewed pattern. This optional manual
assessment broadens process/evidence questions without adding a separate
post-explanation reviewer step, file or completion gate.

A manual directory recovery exercise may be useful when that manual harness
is actually used. It is not the registered Workflow's completion criterion.
Independence must come from the executed seat/input/confinement evidence,
not from having two filenames or asserting neither read the other.

```text
# Review — <case slug> (verdict: <PASS | REVISE | INSUFFICIENT-EVIDENCE>)

<provenance header — Reads: the full evidence directory. Explicitly NOT
redteam.md, and state that>

## Obligation Check, Per Phase

| Phase | Obligation | Met | Evidence |
|---|---|---|---|
| 1 Intake | verbatim words frozen before interpretation | <yes/no/partial> | intake.md |
| ... | | | |

<one row per phase that ran. A "partial" needs a sentence naming exactly what is
missing — "partial" with no specifics is the most common way a review says
nothing at length>

## Recovery Test

<the real test, performed rather than asserted: read session.md, then intake.md,
then the newest human/ turn, and state what you would do next. If you could not
tell, that is the finding, and it outranks everything else in this file>

## Findings

### REV-<id> (<HIGH | MEDIUM | LOW>) — <one line>

What is wrong: <the defect>
Where: <path, and line or section>
Why it matters: <what it costs the session or a successor — not "best practice">
What would close it: <concrete>

## What I Checked And Found Sound

<the same discipline the red-team owes: name what held, so the verdict is
readable as evidence rather than as a mood>

## Verdict

<PASS | REVISE | INSUFFICIENT-EVIDENCE> — <which findings drive it>
```

**Bad fill.** A review that duplicates the red-team's job — attacking the
architecture, hunting for fabrication — and never checks whether the phases met
their obligations, which leaves the one thing only the reviewer was looking for
unchecked. An obligation table filled entirely with "yes" and no evidence
column. A recovery test that says "recovery appears possible" without having
been run: the whole value of that section is that someone actually tried. And
findings phrased as preferences ("this section would read better first") at the
same severity as a missing artifact.

---

## 19. Rubric Assessment — `rubric.md`

Optional manual evaluation, not a registered graph step, schema or completion
gate. Actual owner feedback must remain attributable; do not manufacture it.

**Why this exists.** The person's own judgment of the session is evidence, and it
must be captured before any evaluator can anchor them. The file's ordering
enforces that.

```text
# Rubric Assessment — <case slug>

## Part 1 — The Person's Own Assessment

Recorded: <timestamp>
Recorded before Reviewer/Red-Team saw it: <yes — and how that was ensured>

What was useful: <their words>
What was premature: <their words>
What was shallow: <their words>
What felt over-mechanized: <their words>
What they would have wanted instead: <their words>

## Part 2 — Evaluator Assessment

Evaluator: <role/executor — and the explicit statement that this is NOT the
session driver>
Recorded: <timestamp — must be after Part 1>

<the rubric dimensions, each with evidence>

## Part 3 — Reviewer And Red-Team

<recorded last, after both Part 1 and Part 2 exist. This part is a pointer, not
a copy: the reviewer's own output lives in review.md and the red-team's in
redteam.md, each with its own provenance and verdict. Summarize here which
dimensions each one bears on, and cite the file>
```

**Bad fill.** Part 1 written by anyone other than the person. Part 1 timestamped
after Part 2. An evaluator who is also the session driver — that is
self-assessment wearing an evaluation label, and the
[rubric](architecture-advisory-evaluation-rubric.md) treats it as an automatic
failure of the whole assessment, not a procedural nit.

---

## Assembling A Session Directory

**Optional manual-harness example only; not registered Workflow storage or completion instructions.**

```text
<EVIDENCE_DIR>/
  session.md
  intake.md
  interpretation.md
  scout-report.md
  decision-request.md
  human/1-person.md
  dialogue/1-impact.md
  dialogue/1-response.md
  proposals/system-shaper.md
  proposals/alternative-shaper.md
  proposals/constraint-advocate.md
  proposals/specialist-<topic>.md
  critiques/architecture-critic.md
  synthesis.md
  explanation.md
  redteam.md
  review.md
  dispositions.md
  rubric.md
  prompts/<role>.md
  runs/<ordinal>-<role>.json
```

This is an optional manual trace layout, not the coordinator companion's fixed
PERSISTENT STATE tree: that companion is cognitive-only. Registered status,
storage, human gates and continuation belong to Workflow.

For a manual harness, a fresh reader being able to reconstruct the next action
is useful continuity evidence. For registered execution, completion follows the
declared Workflow and its close gate; neither directory completeness nor a
manual recovery exercise substitutes for it. Completion is not approval of the
advice or permission to implement.
