---
name: fgos-architecture-panel
user-invocable: false
description: >-
  Start registered architecture-advisory or architecture-advisory-reopen workflows
  for repository-grounded second opinions, competing designs, and owner dialogue.
  Read settled reports, preserve dissent, and never implement the advice.
---

# Architecture Advisory Panel

Use this surface for architecture advice, including ambiguous raw intent.
Business/product/policy questions belong to [fgos-panel](../fgos-panel/SKILL.md).
Implementation belongs to `fgos-run` only after an explicit implementation request;
permission, politeness, and Workflow completion are not implementation instructions.

## Execution boundary

Start only the two registered definitions. Do not author inline definitions,
select executors/models, impersonate independent seats, or choose a continuation
step. Config and `bind()` own routing; Workflow owns execution and human gates.
This skill starts workflows and reads settled reports. Use the public CLI to show
the declared owner gate and submit only the owner's explicit answer. Do not read
or write raw run-state files, poll in a loop, resume runs, or choose gate transitions.

Preserve the person's words verbatim in `--request`. Use the actual target as
caller cwd or explicitly set `--worktree`; `--dir` is the state/config root, not
worker cwd. With the read-only safety prerequisite satisfied:

```sh
fgos workflow start architecture-advisory --request "<verbatim CASE>" --dir <repoRoot> --worktree <targetRoot>
```

The start result identifies a run, not completed advice. Read the complete settled
reports supplied by the workflow/operator; never infer success from launch metadata,
chat memory, an absent report, or a one-line summary. Missing evidence stays a gap.
Do not open workflow event logs, unit state files, or a parallel status store.

## Read-only safety prerequisite

Every advisory role must resolve `posture: "read-only"` with confinement
`mode: "required"`, `policyId: "host-write-denied"`, and
`policy.controls.hostWrite: "deny"`. Only dispatch-scoped output and private-home
writes are granted; credentials are read-only. The source product, host instructions,
and host configuration must remain unwritable. No git mutation in the target.
An empty `writes` list or prompt saying read-only is not confinement.

Before launch, require config-derived binding/posture evidence from the existing
`bind()` / `resolvePosture()` contract for every pattern seat, independence, and
blind shaping. Resolution proves policy/provenance, not live isolation. If safe
independent execution is unavailable, stop and name the prerequisite; never weaken
policy or substitute an inline panel. Do not use historical dispatch recipes.

## Registered linear advice

`architecture-advisory` follows framing → blind shaping → reviewed critique →
reviewed high-rigor synthesis → explanation → human close. The registered
capabilities remain `architecture:frame`, `architecture:shape`,
`architecture:critique`, `architecture:synthesize`, and `architecture:explain`.
Shaping seat tasks use fixed system, alternative, and constraint lenses through
registered template params; synthesis checker tasks target the producer's final packet.
No capability name is a promise of a distinct provider or isolated session.

Critique and synthesis may finish with `findings` after bounded review. Findings
remain attributed evidence, not pass/approval claims. Transport failures still block.
The synthesis reviewer/red-team challenges the actual final packet, including its
framing, authority, evidence, alternatives, dispositions, and dissent—not merely an
earlier proposal. The explanation preserves the packet's verdict and structured field.

The final recommendation report is a RAW JSON object, without Markdown fences.
Its required `"missing expertise"` field is an array of nonempty expertise names,
or `[]` when none. The packet also retains the verdict, evidence, alternatives,
attributed findings, dispositions, unresolved dissent, defaults, residual risks,
and reversal triggers. Never manufacture agreement or erase an inconvenient finding.

The same linear human close gate always asks one batched owner question: bring in
the listed expertise or not? It reads the synthesis producer's settled final packet;
it does not select a next step. An empty array is still explicit, not a skipped gate.
No specialist is automatically dispatched. The owner can decline expertise, defer,
or separately authorize a bounded consultation; record none of these as consensus.

Show the declared question and settled Unit ids, then submit the owner's words:

```sh
fgos workflow status <workflowRunId> --dir <repoRoot>
fgos workflow answer <workflowRunId> --step close --answer "<verbatim owner decision>" --dir <repoRoot> --worktree <targetRoot>
```

Malformed or missing producer expertise parks with a clear error, not an inferred
list. Read the packet manually; the owner decides and acknowledges that limitation.
Workflow owns the transition after the answer; closing is still not advice approval.

## Bounded reopen

A material revisit uses only `architecture-advisory-reopen`: reviewed high-rigor
synthesis → explanation → human close. Supply settled parent reports with repeatable
`--context-ref unit-run:<unitRunId>/<role>`, plus the new owner's words verbatim.
These references resolve from the state root; plain paths are rejected across repos:

```sh
fgos workflow start architecture-advisory-reopen --request "<verbatim revisit>" --context-ref "unit-run:<parent-synthesis-unit>/producer" --context-ref "unit-run:<parent-critique-unit>/reviewer" --dir <repoRoot> --worktree <targetRoot>
```

Use actual settled Unit ids and roles, not guessed paths, state files, or fabricated evidence.
Include the relevant parent framing, proposals, critique, and final packet when they
are load-bearing. This interface passes references, not frozen bytes or provenance.
Reopen reruns recommendation even for an explanation-only change, but never reruns
blind seats. Preserve unchanged decisions and dissent; explain what changed, what
remained, and why. No reopen graph, driver, conditional step, or automatic specialist.

## Advisory judgment

Investigate before asking for facts the repository can answer. Carry nonblocking
user-exclusive gaps as named defaults into the packet. Ask immediately only when
safe reasoning would otherwise invent the owner's obligations. A short reply is
not necessarily a decision: distinguish clarify, challenge, new context, alternative,
composition, explicit decision, and deferral by meaning rather than tone.

Shapers offer genuinely different, evidence-grounded alternatives, including smaller
or no-build options when credible. Critics attack claims and name settling evidence;
they concede falsified attacks. Diversity is a hedge, not a vote count. Report actual
attribution and what diversity bought; never manufacture disagreement.

A recommendation chooses a direction without laundering dissent. Findings may be
accepted (name the consequence), mitigated (retain residual risk), answered (cite
evidence), invalidated-by-evidence (cite a real observation), deferred (name scope
and revisit trigger), or unresolved (visible in the packet body). Do not self-clear
conduct/isolation violations or invent advisor evidence to resolve a finding.

Explain through the owner's system, trade-offs, reversal triggers, and one reversible
next action. No implementation plan, weighted score, numeric consensus, fabricated
human input, or automatic work-item claiming/approval/merge. A separately authorized
consultation remains attributed and cannot silently become panel consensus.

## Cognitive references, not runtime recipes

Retain the [coordinator prompt](../../../docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md),
[role doctrine](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md),
[artifact templates](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md),
and [evaluation rubric](../../../docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md)
for cognitive quality. Historical routing and API instructions are not executable
support and do not authorize bypassing the registered workflow or safety boundary.
