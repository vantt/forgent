---
name: fgos-architecture-panel
user-invocable: false
description: >-
  Guide architecture advice through the registered `architecture-advisory`
  Workflow (`fgos workflow start architecture-advisory`) with config-owned
  routing, repository-grounded alternatives, and human decision authority.
  Use for architecture second opinions and competing designs, including raw
  ambiguous intent. Preserve advisory role and dialogue doctrine without
  claiming that the current five-step Workflow implements the complete
  advisory loop. This skill never implements the chosen architecture.
---

# fgos-architecture-panel

This is the specialist surface for software-architecture advice. Generic
business/product/policy panels start at
[`fgos-panel`](../fgos-panel/SKILL.md). A coding design question belongs here
when it needs repository-grounded alternatives and a recommendation; an
explicit request to implement a concrete change belongs to `fgos-run`
only after the advice/implementation boundary is clear.

Use the registered `architecture-advisory` Workflow (source-repo definition:
`core/workflows/architecture-advisory.yaml`) through `fgos workflow`.
Workflow owns the five-step DAG and execution state;
`bind()` owns executor, provider, model, invocation, transport and posture
selection. This skill owns advisory judgment and the advice/implementation
boundary, not infrastructure selection.

**Deep cognitive references:** the retained manual playbooks define role
meaning, artifact goals and quality judgment, not current CLI support:
[coordinator prompt](../../../docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md),
[role doctrine](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md),
[artifact templates](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md),
[evaluation rubric](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md).
Their historical routing/API recipes are not executable guidance. For
cognitive judgment the deep doctrine wins; for runtime capability use the
current Workflow definition and supported CLI below.

Reuse the shared [Generic Driver Discipline](../_shared/coordination-driver.md)
for evidence, disposition and continuity, within the current runtime boundary.

## Current Capability Boundary

The existing Workflow runs framing, panel shaping, reviewed critique, solo
synthesis and explanation. It does **not** yet provide end-to-end late
specialist intervention, bounded decision-dialogue/reopen, distinct
system/alternative/constraint tasks for each shaping seat, independent
red-team review of the actual final recommendation packet, or fresh-session
reconnection to interrupted Units with the complete advisory continuity
packet. Generic Workflow `answer`/`resume` are not proof of those capabilities.
Role names or objective text are not evidence that these jobs were separately
dispatched. Preserve the goals as doctrine; report a missing capability if
the case requires it, rather than inventing a result or a replacement API.

Completion belongs to the separate
[advisory-capability-completion plan](../../../plans/261006-1408-advisory-capability-completion/plan.md)
and its [preservation matrix](../../../plans/261006-1408-advisory-capability-completion/reports/advisory-preservation-matrix.md).
This binding/truth cleanup neither implements nor certifies that plan.

## Facade Hook Values

| Hook Slot | Value |
|---|---|
| `unit of iteration` | One registered `architecture-advisory` Workflow run; distinguish its five-step execution from the broader advisory dialogue goal. |
| `open inputs` | Raw case; advisory, never implementation; capabilities `architecture:frame`, `architecture:shape`, `architecture:critique`, `architecture:synthesize`, `architecture:explain`, resolved by config + bind. |
| `evidence verification` | Never describe an outcome to the person until it has come back through the real workflow door -- `fgos workflow status <workflowRunId>`, an executed unit result, or human gate questions. |
| `disposition criteria` | Findings are dispositioned as accepted, mitigated, answered, invalidated-by-evidence, deferred, or unresolved visible dissent. |
| `adaptation bounds` | Scope any material revisit to named affected claims; use only supported execution, not invented graph transitions. |
| `human-escalation triggers` | Material user-exclusive gaps, visible dissent, or a missing required capability/posture. |
| `close criteria` | Report actual run outcome and unresolved findings; Workflow completion is not a human decision or proof of full advisory quality. |
| `after-close action` | No git mutation inside PROJECT_ROOT; recommendation only. |
| `continuity artifact` | Actual Workflow status and settled Unit reports; desired advisory packet is doctrine, not an automatic runtime artifact. |

## What This Skill Does Not Require Of The Person

- No problem brief. Raw words, however vague ("EOD and intraday
  evolution is becoming difficult" is a real, sufficient CASE — see
  P01.3) are the whole input.
- No protocol id, role list, or roster choice. Use the registered Workflow
  and let config + `bind()` resolve infrastructure; never ask the person to
  select an executor merely to get advice.
- No answer up front to a question the repository can answer itself.
  Investigation always precedes any question reaching the person
  (SCOUT BEFORE ASK, below) — a majority of real sessions to date
  (P01.2, P01.3) sent **zero** Decision Requests and said so with
  evidence, not silence.
- No follow-up ceremony. A short, low-ceremony reply is still a complete,
  actionable dialogue turn — but getting its classification right matters
  more than treating brevity as decisiveness. Real precedent, read
  correctly: P01.2 Turn 2's "làm luôn cũng được" was classified as
  **permission, not instruction** — the lead advisor's own
  `dialogue/2-impact.md` states it explicitly: "if we proceed, we proceed
  on our own recommendation with their consent. I don't want the panel
  recording this as 'the person decided to build.'" A skill that treated
  that phrase as a decision would have misclassified it.

## Unified Workflow Execution Door

Keep the person's raw words verbatim in `--request`; distinguish your
interpretation from what they actually said. Use the actual target project
as the caller's working directory, or explicitly set `--worktree` for it.
`--dir` selects the state/config root, not the worker cwd.

- **Start, only after the safety gate below:**
  `fgos workflow start architecture-advisory --request "<verbatim CASE>" --dir <repoRoot>`.
  It returns `{ workflowRunId, detached: { pid, logPath, statusCommand } }`,
  not the finished recommendation. Read `fgos workflow status <workflowRunId>`
  until it is completed, failed, or parked. Add `--foreground` to wait in place.
- **Check status / inspect outputs:** `fgos workflow status <workflowRunId>` (or with `--dir <repoRoot>`).
  Reports status of every step (`framing`, `shaping`, `critique`, `synthesis`, `explanation`),
  active execution state, and pending questions when a gate exists.
- **Answer a declared human gate only:**
  `fgos workflow answer <workflowRunId> --step <stepId> --answer "<actual answer>"`.
  The registered five-step advisory definition declares no human gates.
- **Resume workflow execution:** `fgos workflow resume <workflowRunId>`.
  `answer` and `resume` also advance execution and return detached metadata;
  they are not read-only inspection commands.

Never describe a panel outcome until actual status and settled reports support it.

### Config Binding And Required Read-Only Safety

Follow [shared executor-dispatch fallback](../_shared/executor-dispatch-fallback.md)
for any independently dispatched reasoning: call `fgos dispatch decide --for
<capability>` first, declaring `--has-live-task-access` only if it is present.
Do not duplicate a roster, read config to choose your own executor, pin
infrastructure in a Unit, or spawn a resolved command yourself.

**Every advisory role must resolve `posture: "read-only"` and a confinement
requirement with `mode: "required"`, `policyId: "host-write-denied"` and
`policy.controls.hostWrite: "deny"`.** Only dispatch-scoped run output and
private-home writes are granted; executor credentials are read-only. The
project under advice and host instruction/configuration files must remain
unwritable. An empty `writes` list or a prompt saying "read-only" is not
confinement by itself.

Before a start, inspect current config-derived binding/posture through the
existing `bind()` / `resolvePosture()` path, including every pattern seat,
independence requirement and the shaping unit's `blind` requirement. Resolution
proves selected policy and provenance only, not live write denial or blind-read
enforcement. The execution core and Confinement Authority own enforcement.
If required safe execution cannot be supplied, report the exact prerequisite
and stop before launching workers. Do not weaken config/policy, use an
unconfined default, or follow the shared fragment's inline fallback to
impersonate independent advisory roles.

## Entry Flow: The Five Workflow Steps

The workflow executes along a clean DAG of 5 steps:

| Step | Purpose | Capability | Pattern & Roles |
|---|---|---|---|
| `framing` | Intake, context investigation & framing | `architecture:frame` | `solo` producer; advisor persona |
| `shaping` | Diverge into 3 independent proposals | `architecture:shape` | `panel`, blind; pattern panelists plus synthesizer |
| `critique` | Attack proposals & stress-test constraints | `architecture:critique` | `reviewed`; actual reviewer/red-team seats depend on pattern configuration |
| `synthesis` | Converge into coherent recommendation | `architecture:synthesize` | `solo` producer |
| `explanation` | Actionable explanation for ownership | `architecture:explain` | `solo` producer; advisor persona |

Dependencies pass prior settled reports downstream. This DAG is execution
structure, not proof that all retained cognitive jobs were realized.

## Cognitive Role Doctrine — Not An Executor Roster

| Role meaning | Cognitive job and failure to avoid |
|---|---|
| Lead advisor | Interpret intent without replacing the person's words; explain in terms of their system, reversal triggers and ownership. Never invent a candidate while explaining. |
| Context investigator | Seek facts and disconfirmation with reliable citations. Report uncertainty; do not recommend an architecture before independent shaping. |
| System shaper | Produce a coherent primary design grounded in the framed evidence, not a generic best-practice answer. |
| Alternative shaper | Bring genuinely different priors, including smaller/no-build options when credible. Never produce a designated loser to flatter the primary design. |
| Constraint advocate | Test production feasibility, security, migration and operational constraints; make those constraints influence the proposal. |
| Architecture critic | Attack cross-proposal claims with settling observations and concede falsified attacks; do not inherit a shaper's private reasoning. |
| Synthesizer | Integrate the whole ledger, recommend one direction and preserve attributed unresolved dissent rather than laundering it into consensus. |
| Independent red-team | Attack framing, authority, evidence and advisory quality as well as technical correctness. A ceremonial approval is not review. |
| Specialist | Answer one authorized bounded question when expertise is actually needed; never become a standing extra panel member. |

These are intended cognitive jobs, not registered actor IDs or provider/model
assignments. Persona is task framing, not a roster registry. Use the deep
role doctrine for posture, heuristics, good/bad examples and handoff goals.
Do not claim the current Workflow loads the historical operation templates
into each seat automatically.

**Diversity is a hedge, not a decoration.** Independence rests on actual
dispatch, task and context separation; model labels do not prove it. Report
actual binding provenance, what diversity bought, and any inability to meet
the required independent pool. If no distinguishable insight emerged, say
so rather than manufacturing disagreement. Do not collapse roles inline to
hide a missing safe independent executor.

## Lead Advisor Discipline — Scout Before Ask, In Practice

Investigation always precedes any question reaching the person. Before a
question is sent, run every candidate gap through three tests, in order
— **the third one is the one a naive reading of this discipline misses,
and getting it wrong inverts the real practice:**

1. **Scouted.** The context investigator has already run and reported;
   the question survived that investigation (write down what was looked
   for and what was or wasn't found).
2. **User-exclusive.** Could any amount of repository reading answer it?
   If yes, it is unfinished scouting, not a question.
3. **Material *now*, not material in the abstract.** This is a real
   third axis, not a restatement of #2: a gap can be genuinely
   user-exclusive AND still not block Phase 5 — because the shapers can
   produce real, evidence-grounded candidates conditioned on an explicit
   default, and the actual answer is better reserved for Phase 9, where
   a concrete synthesis already exists for the person to react to. A
   question earns interruption **now** only if the panel's own Phase 5
   output would genuinely differ depending on the answer, today, before
   any candidate exists to react to.

**A gap that fails test 3 is never deleted — it is carried forward as an
explicit named default.** This is the discriminator a naive "if not
material, delete it" rule misses, and getting it wrong inverts what the
real sessions actually did: check
[P01.3's `decision-request.md`](../../../docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/decision-request.md)
directly — three of its seven candidate gaps are marked
**user-exclusive in the source's own words** ("Yes — only the person can
say"), and every one of them is still answered "not asked now," because
each is carried forward as a named default into Phase 5-8 rather than
blocking there. The file closes with exactly this framing: "This is a
recorded decision, not a skipped step — this file exists so a successor
coordinator does not re-ask what was already reasoned through." P01.2
matches. **Both historical sessions sent zero Decision Requests, and
neither silently dropped a real gap to get there** — every surviving gap
was named, defaulted and carried into a later phase.

One narrow exception: if proceeding requires inventing a fact about the
person's own obligations (a compliance boundary, a contractual
commitment) that cannot be defaulted safely, ask immediately and say why
waiting would have been worse.

## Debate And Synthesis Discipline — Historical Quality Evidence

- **Shapers produce genuinely different candidates.** P01.2's three
  proposals genuinely diverged on ownership (two `stay-thin`, one
  primary-recommends deletion); P01.3's three independently reached the
  same option through three different mechanisms, which the panel
  reported honestly as convergence rather than manufacturing artificial
  disagreement.
- **Critics attack claims, not style, and concede when an attack
  fails.** P01.2's critique: 5 attacks, 1 conceded, 2 decision-changing.
  In P01.3, the **coordinator** independently re-verified two of the
  critique's attacks against the real repository before trusting them (a
  scheduler-deadlock claim and an alert-cap-severity misclassification,
  confirmed by reading real source) — this was the coordinator's own
  follow-up discipline, not the critic's own act: the critic's actual
  artifact only states what would settle each attack, per its own
  discipline of naming a settling observation rather than asserting one
  — see
  [P01.3's `critiques/architecture-critic.md`](../../../docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.3/critiques/architecture-critic.md).
- **Synthesizer recommends one thing without flattening dissent.** Both
  sessions' `synthesis.md` preserve attributed, unresolved disagreement
  in the packet body, not a footnote — P01.2 kept its reversibility
  dispute live through to the final dialogue response, still unresolved.
- **Red-team attacks framing and advisory quality, not just technical
  correctness.** The role doctrine's own worked example (`redteam.md`)
  shows a red-team catching a driver dispositioning a technical claim
  without an advisor's evidence — an authority violation, not an
  architecture defect; task prose for this role must check
  `dispositions.md` against `runs/`, every session, not just the
  recommendation's logic.

## Decision Dialogue Doctrine

Classify a human turn from its meaning, never its tone. These are advisory
judgment categories, not current engine operation names:

| Turn | Meaning and intended response |
|---|---|
| **clarify** | Explain from existing evidence; no new analysis if nothing is disputed. |
| **challenge** | Defend with evidence or concede; revise only conclusions the concession changes. |
| **introduce-context** | Preserve the new fact verbatim and identify affected claims. |
| **request-alternative** | Evaluate a real alternative against the evidence, with genuinely independent shaping if needed. |
| **request-composition** | Treat the combination as an explicit candidate; do not improvise advice in the driver's voice. |
| **decide / defer** | Record the person's actual decision or named deferral triggers; never convert permission into an implementation instruction. |

Explain impact before any material revisit: what changes, what does not,
what evidence is needed and why a smaller response cannot suffice. Keep
reopen scope bounded; preserve decisions and visible dissent. Never
fabricate an advisor's response or a human authorization to move forward.
An independently authorized outside consultation remains separately
attributed, and its load-bearing factual claims need verification; it is not
silently promoted into panel consensus.

## Driver Disposition — You Author This File

The disposition ledger is driver-authored bookkeeping, not an advisor's
independent output or an automatic Workflow artifact. Every finding,
objection and open point needs a rationale and evidence reference. Keep
your attribution explicit; do not invent a parallel runtime state store.

Six dispositions:

- **`accepted`** — the finding is valid and it changes the packet or the
  process. Name what changes; an `accepted` with no named consequence is
  really `answered` or `deferred`, mislabelled.
- **`answered`** — valid as a question, already addressed by evidence in
  the ledger. Cite that evidence by path — "we already considered that"
  with no citation is a dismissal, not a disposition.
- **`mitigated`** — valid, cannot be eliminated, and the packet now
  carries both the mitigation (authored by an **advisor**, never by you)
  and the residual risk, stated plainly. A `mitigated` claiming zero
  residual risk is an `accepted` in disguise.
- **`deferred`** — valid, out of scope for this decision. Name where it
  belongs and its trigger to revisit. **This is the one disposition you
  may make entirely on your own authority** — scope is an authority
  question, not a technical one.
- **`unresolved`** — valid, unsettled: nobody has produced evidence that
  settles it, and neither side has conceded. It goes to the person as
  **visible dissent**, in the packet body, not a footnote. This is a
  legitimate, often-correct outcome — not a defect to be smoothed. The
  synthesizer's dissent-laundering guard forbids converting a real
  `unresolved` into a "consideration" so the packet reads tidier.
  Contrast with a claim that
  actually *was* settled — a shaper explicitly conceding (real
  precedent: P01.2's and P01.3's own conceded critique attacks), or an
  advisor's evidence resolving it — which is `accepted`,
  `invalidated-by-evidence`, or `answered` instead, depending on which
  side moved.
- **`invalidated-by-evidence`** — a specific advisor observation refutes
  it. Cite the observation, by path or run result, from an advisor who
  actually looked — never your own reasoning about the codebase.

**You must not disposition `invalidated-by-evidence` or `answered`
alone when the claim is about PROJECT_ROOT or the panel's own
artifacts.** If no advisor has shown you the fact, obtain actual independent
evidence through supported safe execution or leave the finding unresolved
and report the gap — never self-clear it.
A finding about **your own conduct** — an
authority violation, an isolation breach, a fabricated turn — must never
be self-dispositioned as `answered`/`invalidated-by-evidence`; escalate
it to the person or an independent role. Self-clearing is never
legitimate here.

## Continuity Doctrine

Read `fgos workflow status <workflowRunId>` and the actual settled Unit
reports before interpreting a prior run. Execution state outranks a prose
status board; missing output is not agreement. Do not blindly resume a
run before checking its current state and safety requirements.

The desired fresh-session orientation packet retains the raw intake and
latest genuine human words, interpretation, attributed dispositions,
actual binding provenance and only the artifacts needed for the next
action. The historical [artifact templates](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md)
explain this cognitive goal; they are not evidence that current Workflow
execution emitted those files. Do not reconstruct evidence from chat
memory, invent a completed advisor, or blindly re-dispatch an interrupted
role.

## Bounds (condensed — full text in the coordinator prompt's own BOUNDS section)

1. Work items, if referenced, are read-only context — never claimed,
   approved, merged, or mutated by this skill.
2. No git mutation inside PROJECT_ROOT, ever. The session's own evidence
   commits (in the repository hosting this skill) are a separate thing
   and must never resolve to a path inside PROJECT_ROOT.
3. No anonymization — every artifact names its role and its real
   executor/provider/model.
4. No vote tallying, no weighted scoring, no numeric consensus.
   Disagreement is argument and evidence, never a count.
5. No implementation-plan generation. Naming the first reversible step
   is advisory; a phased build plan is a different product.
6. No fabricated human input, ever — not a placeholder, not a
   clearly-labelled guess. Park and name exactly what interaction is
   needed instead.
7. If independent dispatch is unavailable for a role, record the gap —
   never perform that role inline and present it as panel output. One
   session writing every advisor's output is a failed session even when
   the prose reads well.

## Retained Dispatch Lessons

- Doctrine-by-path can fail across a repository boundary. Relevant cognitive
  instructions must actually reach the worker's prompt; a relative path in
  this source repository does not prove delivery. Keep the reference's
  historical infrastructure recipes out of active task instructions.
- Check doctrine-example names against the live case; label example content
  explicitly so a worker cannot mistake it for evidence about this project.
- Read the complete settled report, not only a structured one-line summary.
  Missing or unusable capture is an evidence gap, never "no findings."
- A mutation observation can be confounded by another editor; attribute the
  evidence before alleging a confinement breach. Conversely, a successful
  binding is never a live confinement falsification result.

Historical sessions and their full findings remain in the retained
[verification corpus](../../../docs/platform/agent-coordination/verification/architecture-advisory-panel/).
They ground the doctrine; retired execution recipes in that corpus are not
current commands or authority to bypass the Workflow door.
