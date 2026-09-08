# Phase 03 - Minimal Hard Shell And Protocol

Depends on: Phase 02 placement matrix and blocker list closed.

## Objective

Build the smallest hard outside that preserves the manually proven panel:
illegal authority and visibility become impossible, evidence becomes
replayable, and rounds stay bounded, while consulting judgment remains in the
soft inside.

## Cells

### P03.1 - Conditional shared capability

Take only `new-hard-capability` rows from P02.1. A trusted external-input and
human-decision provenance door is mandatory unless P02.1 proves an equivalent
trusted door now exists. Run upstream impact analysis
before editing every symbol and record the risk. Implement each capability as a
coherent schema/write/replay/authorization/parity slice. When the blocker list
is empty, write a no-op P03.1 report citing P02.1; do not manufacture a kernel
diff.

### P03.2 - Protocol and artifact envelope

Create:

- `core/coordination-protocols/architecture-advisory-panel-v1.yaml`;
- the artifact envelope/templates at the existing registry path selected by
  P02.1;
- the pack entry in `core/protocol-packs/group-thinking.json`;
- `test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`;
- any focused definition-schema test required by the selected envelope.

The protocol declares legality and collaboration posture. It does not duplicate
the role doctrine and task prose that Phase 04 projects.

## Requirements

- Implement only Phase 02's proved runtime blockers. If none exist, record that
  result and make no kernel diff.
- Any human-input/decision provenance capability must keep source input,
  driver interpretation, advisory output, and human decision distinct and
  refuse authority impersonation.
- Session status remains CoordinationSession lifecycle truth. Advisory outcomes
  such as `needs-user-input`, `decided`, and `decision-deferred` live in typed
  advisory artifacts/views for V1 unless P02.1 separately proves a general
  session-status need; do not widen the core status enum just to mirror prose.
- Any selective-reopen capability must use predeclared bounded operations,
  immutable prior evidence, monotonic caps, and exact revision provenance; no
  arbitrary runtime edge or state deletion.
- Define and register
  `core.coordination-protocol.architecture-advisory-panel-v1` with the minimum
  graph needed for independent work, controlled reveal, typed deliberation,
  synthesis, recheck, specialists, park/resume, and bounded dialogue reopen.
- Keep the protocol portable: declare capability and minimum-tier requirements
  where warranted, but no literal executor/provider/model pins. Preserve the
  request-level per-actor `executor`/`tier`/`persona` binding, derive model from
  executor providerModel + tier policy, and use the shared governed dispatch
  path. A model override is added only if P02.1 approves it as a general gap.
- Do not encode advisory heuristics such as empathy, materiality judgment,
  reframing quality, alternative credibility, or explanation style as enums or
  transition logic.
- Artifact validation should enforce identity, type, provenance, source refs,
  and revision where safety/replay needs them. Rich artifact content remains
  governed by task prose and review, not exhaustive schema bureaucracy.
- Register the protocol in the Group Thinking pack and preserve every existing
  protocol and isolation fixture unchanged.

## Tests First

Cover premature reveal, foreign/stale refs, hidden dissent, missing actors,
unauthorized specialist, over-cap reopen, wrong recheck revision, terminal
mutation, Work isolation, crash/replay, CLI/headless parity, and human-authority
impersonation where applicable. Run the full suite after any kernel change.
Add a conformance case with heterogeneous actor bindings and assert the actual
RunResult executor/provider/model/tier provenance. A tier assertion counts only
when the selected executor's model policy maps that tier to a distinct model;
P00.1's execution-base evidence decides which configured executor can satisfy
that proof.

Kernel work requires independent Reviewer and Red-Team approval. Findings are
dispositioned and accepted fixes rechecked before the protocol cell begins.

Both cells run the focused command from `plan.md`. P03.1 additionally runs full
`npm test` whenever it changes shared runtime. P03.2 runs existing
RFC/NGT/Delphi/master-loop conformance tests beside its new tests. Before each
commit, run `detect_changes()` against `main` and refuse unexpected flow impact.

## Exit

The runtime provides a hard safety/evidence envelope and a registered protocol,
but reading the FlowDefinition alone is visibly insufficient to operate a good
Architecture Advisory Panel. That remaining intelligence is intentionally the
input to Phase 04.
