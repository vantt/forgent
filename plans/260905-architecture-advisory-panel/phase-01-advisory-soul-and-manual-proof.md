# Phase 01 - Advisory Soul And Manual Proof

Depends on: Phase 00 closed. No runtime, schema, protocol, or CLI change.

## Objective

Create the Architecture Advisory Panel's living operating intelligence and
prove it manually before mechanization. One self-contained playbook must let a
capable coordinator lead independent advisors through understanding,
investigation, reframing, design, debate, recommendation, recheck, and a real
decision dialogue without relying on the proposed FlowDefinition.

## Cells

### P01.1 - Author the soul

Create exactly:

- `docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md`;
- `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md`;
- `docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md`;
- `docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md`.

The coordinator prompt is self-contained: input block, authority order,
scout-before-ask rule, role routing, nine-phase cognitive loop, persistence and
recovery, Decision Dialogue, bounds, and stop conditions.

### P01.2 - Clear-input manual proof

Run the playbook with real independently dispatched roles. Persist case input,
resolved roster, assignment/result refs, artifacts, human interaction, rubric,
review, and red-team evidence under `proofs/P01.2/`. Do not revise the proof
target in this cell; disposition findings for P01.3.

### P01.3 - Unclear-input proof and soul revision

Apply accepted P01.2 findings, then run the unclear case. Demonstrate autonomous
scout, alternative frames, a consolidated user-only question only when needed,
and Decision Dialogue. Reviewer and Red-Team re-evaluate the final soul sources
and both proof cases.

## Soul Deliverables

- A one-entry manual Architecture Advisory Coordinator playbook, analogous in
  usability to `master-coordinator.md` but written for consulting and design.
- Role doctrine for lead advisor, investigator, system shaper, alternative
  shaper, constraint advocate, critic, synthesizer, red-team, and specialist.
- Artifact prose/templates that help reasoning without pretending schema alone
  creates good judgment.
- A recovery handoff that lets a fresh coordinator continue from persisted
  artifacts without being given the prior chat.
- A qualitative evaluation rubric for advisory quality.
- A role-routing roster showing how the coordinator selects a proven-safe
  executor/confinement pair, tier, and persona independently for each actor and
  records the derived provider/model.
- Driver-disposition doctrine for `accepted`, `answered`, `mitigated`,
  `deferred`, `unresolved`, and `invalidated-by-evidence`, including when the
  driver must not disposition without another advisor's evidence.
- A headless Dialogue Turn Protocol separating the person's immutable words,
  lead-advisor interpretation, driver authorization, and panel response.

## Required Doctrine

- **Understand the person:** infer a provisional intent, vocabulary, altitude,
  constraints, risk appetite, and decision burden; mark uncertainty honestly.
- **Understand the problem:** scout available evidence, distinguish symptom
  from cause, test system boundaries, and seek disconfirming evidence.
- **Ask reluctantly but clearly:** ask only after investigation, consolidate
  user-only gaps, explain why each matters, and state the panel's current
  recommendation/default.
- **Diverge honestly:** produce credible alternatives, including a smaller
  intervention or no-build path; never manufacture a weak straw option.
- **Debate claims:** attack assumptions, consequences, and evidence rather than
  actor identity; state what evidence would change a position.
- **Converge without flattening:** make a recommendation, disclose minority
  positions and unresolved objections, and calibrate confidence.
- **Explain for ownership:** translate the design into the person's language,
  show implications and reversal conditions, and identify the decision that
  remains theirs.
- **Stay in dialogue:** clarify, defend, investigate new context, compose
  options, revise when warranted, and admit no-consensus without defensiveness.

Every role specification must include purpose, posture, what to notice,
judgment heuristics, anti-patterns, handoff shape, and at least one good and bad
example. A role name plus expected-output fields is insufficient.

## Manual Proofs

Run two real advisory sessions on software projects outside `forgentX`:

1. **Clear case:** a concrete architecture decision. The panel should proceed
   without ceremonial questions, surface multiple credible options, challenge
   them, recommend one, and help the person decide or intentionally defer.
2. **Unclear case:** a symptom or under-specified request. The panel must inspect
   the project first, materially improve the problem framing, and ask only if a
   user-exclusive gap remains.

At least one session must include a real Decision Dialogue interaction that
changes or challenges the recommendation. The person's own assessment of what
was useful, premature, shallow, or over-mechanized is evidence, not decoration.

Both proofs dispatch separate agents for separate roles. At least one proof
uses two distinct safe executor/provider bindings in the same panel and records
each role's requested executor/tier/persona plus actual provider/model/tier Run
provenance.
One coordinator response pretending to be all advisors is a failed proof even
when its prose is good.

## Evaluation Rubric

The report must assess:

- understanding improved beyond the initial wording;
- questions were necessary, consolidated, and well explained;
- alternatives were materially different and credible;
- evidence contradicted as well as supported early hypotheses;
- advisors could change their minds and explain why;
- dissent survived synthesis;
- the recommendation was decisive but properly calibrated;
- explanation enabled the person to own the decision;
- a fresh coordinator could resume from artifacts alone.
- provider/model diversity improved independence or cognitive coverage rather
  than merely decorating the roster, and every claimed binding is evidenced.
- every shaper states what evidence would change its position before critics
  see the proposal;
- the person's rubric assessment is recorded before Reviewer/Red-Team receive
  it, and the evaluator is not the session driver.

## Files

May touch only the new playbook/doctrine/artifact templates and this phase's
verification reports. Do not touch production skills, protocol definitions,
runtime, schemas, contracts, CLI, pack registry, or canonical specs.

## Commands And Evidence

- Record `git status --short`, active executor configuration, and exact
  dispatch decision/result for every role.
- Use `mdview open` for all four long Markdown artifacts.
- Run relative-link checks and focused architecture/docs tests.
- Save immutable inputs, outputs, provider/model/tier provenance, and the real
  person's response; terminal narration alone is not evidence.
- Finish P01.3 with `git diff --check` and independent `APPROVE`, `REVISE`, or
  `INSUFFICIENT-EVIDENCE` verdicts from Reviewer and Red-Team.

Manual dispatch uses the Phase 00 allowlist. For every role, write an immutable
prompt file under `proofs/<cell>/prompts/<role>.md`, then run the decision door:

```sh
node src/runner/dispatch.mjs decide <safe-executor-id> --has-live-task-access
```

Obey `in-process` by using the live Agent/Task capability only when Phase 00
proved that exact mechanism's confinement; obey `out-of-process` through
`dispatch.mjs execute` with the immutable prompt/tier/cwd; treat `unavailable`
or an unproven in-process boundary as no independent dispatch rather than doing
the role inline.
Save each decision and result as
`proofs/<cell>/runs/<ordinal>-<role>.json`. Manual-mode
visibility is prompt/package isolation only, not a runtime visibility claim:
shapers receive separate prompt files containing the same frame/evidence and no
sibling output; critics receive all proposals only after every first pass has
settled. P02.1 explicitly compares this soft/manual isolation with the hard
visibility-window mechanism.

## Exit

The manual pattern works well enough that the panel's value can be described in
observed behaviors, not only planned fields and transitions. Weaknesses stay
visible in the report; Phase 02 decides whether each belongs in soul, skill,
protocol, or kernel.
