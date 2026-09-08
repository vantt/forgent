# Coordination Envelope — Capability Fit, 2026-09-06

Document type: Verification
Design status: N/A
Implementation: Partial — static audit and no-provider probes completed
Last reviewed: 2026-09-06
Canonical for: evidence of this bounded audit only, not accepted architecture
State class: Log — historical findings for this run; later runs append separate reports

Related: [Probe contract](../../../proposals/coordination-envelope-probe-contract.md),
[Progress](../../../proposals/coordination-envelope-progress.md).

## Outcome

**The full native Code Panel envelope probe is not ready.** The public request
surface cannot express the required recruitment path, and the inspected baseline
read-only mount does not protect sibling-read confidentiality. A narrowly mounted
OS-only candidate mechanism passes the synthetic read/write checks, but has not
run a provider or integrated with fgOS. These findings support further boundary
work, not acceptance of family B or an implementation plan.

No production source/config or Advisory track files were changed. No agent was
dispatched; no provider calls, human dialogue, or full test suite were run. Existing
source was imported for pure request validation, not modified. Synthetic fixtures
were created under temporary directories. Only the five source files listed in
result.json were hashed before/after; hashes were stable. This is not a complete
transitive-dependency snapshot or production run manifest.

## Reproducible probes

Run from the repository root; each run creates new synthetic temporary paths and
prints fresh evidence. Do not overwrite the saved historical results.

```sh
node docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-audit/probe.mjs "$PWD"
node docs/architect/agent-coordination/verification/coordination-envelope/proofs/2026-09-06-audit/narrow-mount.mjs
```

Scripts require the local Node runtime, `/usr/bin/bwrap`, and `/usr/bin/python3`.
They are verification artifacts, not installed product dependencies or new setup
configuration. No executor dispatch is performed by either script: the subprocess
is a fixed Python canary check, not a worker agent or delegated task.

| Probe | Observed result | Meaning |
|---|---|---|
| Valid declared and agent-led controls | Both accepted by native validator | Rejections below are not malformed common envelopes |
| Public specialist/retry/cancel/replace step | All four rejected by closed step vocabulary | Those proposed action names are unavailable; source audit confirms no equivalent request branch |
| Agent-led additional actor | Rejected: only primary registered | Cannot recruit an additional actor by adding actors[] |
| Agent-led mutating task | Rejected | Mutation remains declared-operation-only through this request surface |
| Agent-led new role name | Rejected: reviewer/researcher/advisor only | Current public agent-led role vocabulary is closed |
| Declared mutating operation | Accepted by validator | Schema acceptance only; does not prove execution or safety |
| Documented broad read-only mount | Sibling canary read succeeds; write denied EROFS; original intact | Write containment holds for this case; sibling confidentiality fails |
| Narrow mount with isolated namespaces | Granted read and report write succeed; private absolute/symlink read denied; source write denied EROFS | Candidate OS mechanism passes these cases only |

Raw records:

- [Native validator and broad mount result](proofs/2026-09-06-audit/result.json).
- [Narrow mount result](proofs/2026-09-06-audit/narrow-mount-result.json).
- [First reproduction script](proofs/2026-09-06-audit/probe.mjs).
- [Narrow-mount reproduction script](proofs/2026-09-06-audit/narrow-mount.mjs).

The broad-mount test uses the mount shape documented by Advisory P00.1 and only
reads its own synthetic canary. It does not attack a live Advisory worker or show
that a particular provider read another participant's report. The narrow mount
starts with an empty root, mounts `/usr` for the fixed test program plus the
explicit workspace/report paths, uses clean child environment and isolated
namespaces, and gives no network. It is not a runnable provider recipe and does
not prove all escape classes, clean inherited descriptors under arbitrary hosts,
credential brokerage, or cloud-provider confidentiality.

## Public path versus engine-internal capability

### Public-door audit

The coordination CLI exposes `run`, `show`, `launch-master-loop`, and `chain`.
`run` is the request-to-engine mapping; `show` and `chain` are read projections;
`launch-master-loop` is a thin request builder. The headless adapter calls the
same `runCoordinationUseCase` and changes only attachment and return format.
This proves one execution core, but not a public effect-capability port.

The engine exports more capability than the public request vocabulary:

| Capability | Engine evidence | Public-door result |
|---|---|---|
| Primary Assignment | `dispatchPrimaryTask` | Agent-led `run`, limited to pre-bound `primary` and read-only roles |
| One consult specialist | `proposeConsult` | No public request step maps to it |
| Declared specialist slot | `authorizeSpecialistSlot` + `authorizeDeclaredOperation` | Requires slot and operation already present in FlowDefinition |
| Retry | `retrySessionTask` | No public CLI sub-verb or request step maps to it |
| Actor replacement | `replaceSessionActor` | Engine-only in the inspected surface |
| Cancellation | `cancelSession` | Engine-only in the inspected surface |
| Resume | Existing coordination id through `run`/group-thinking pack | Available for declared continuation, not a general adaptive checkpoint contract |

This narrows the conclusion: the system has real engine primitives for consult,
specialists, retry, replacement, cancellation, and resume. The gap is the
Coordination-to-Dispatch public seam: an adaptive coordinator cannot yet express
a new bounded Assignment and invoke the effect through one public contract while
preserving session lineage and policy checks. “Missing from `run`” does not prove
Dispatch itself lacks the capability.

`dispatchDeclaredOperation` is currently the topology-aware door. It checks
protocol membership, binding identity, authorization, context refs, windows,
bounds, mutation posture, and provenance before using the common Assignment
execution path. Any adaptive door must reuse those checks where applicable; it
must not call `createSessionAssignment` or an executor adapter as a shortcut.

| Requirement | Native surface/evidence | Classification and minimum gap |
|---|---|---|
| Unexpected specialist | Public schema has operation/fan-out/authorize/disposition/contribution only; engine has `proposeConsult` and `authorizeSpecialistSlot` | Public seam failure; expose bounded recruitment without graph-author edits, reusing Assignment/Dispatch policy |
| Retry/replacement/cancel | Engine exports `retrySessionTask`, `replaceSessionActor`, `cancelSession`; public run has no mapping | Static public-door gap; preserve engine mechanics and add authenticated effect requests or a coordinator-facing port |
| Arbitrary role doctrine | Agent-led primaryRole limited to three values; declared actors bind declared roles | Native validator failure for new role; decouple doctrine naming from permissions |
| Model/persona binding | Public run rejects declared model override and fan-out actor policy overrides | Static gap; per-assignment resolved binding with honest provenance |
| Identity | Store assertDriverIdentity compares authorizedBy.id to writerId | Static trust limitation; credential/principal boundary not proved |
| Visibility | API grants/windows exist; broad mount read escapes checkout | OS confidentiality failure for baseline mount; narrow resource mounts remain prototype-only |
| Mutation | Forwarding now present; runner explicitly describes same-user trust/post-hoc read-only grading | No new mutating execution proof; isolated candidate workspace + mediated integration needed |
| Close | run auto-attempts close; quorum takes every actor; aggregation close requires consensus | Static semantic mismatch; explicit close and applicable candidate obligations needed |
| Definition stability | definitionRef pins id/version and reload compares version | Static integrity gap; content pin is absent in inspected path |
| Resume | Execution replay exists; chain projects session progress; recovery tests use synthetic on-disk crash fixtures | Rationale, exposure history, coordinator fencing, and real crash around effects remain unproven |
| Bounds | Lock-held assignment/concurrency checks; maxRounds counts Assignments; wallTime since createdAt | Preserve proved counters; attempt/cost aggregation and park/deadline semantics require separate evidence |

Source anchors:

- [Request schema](../../../../../src/verbs/coordination/schema.mjs): validateSteps,
  validateCoordinationRequest, validateTask.
- [Public run](../../../../../src/verbs/coordination/run.mjs): model/fan-out policy
  refusals, sequential request loop, mutation forwarding, automatic close.
- [Engine](../../../../../src/runner/coordination/session-engine.mjs):
  validateConsultProposal permits one specialist; declared slots depend on a
  definition; classifySessionQuorum, closeSessionByQuorum, assertWithinWallTimeBudget.
- [Store](../../../../../src/runner/coordination/store.mjs): assertDriverIdentity,
  createSessionAssignment aggregate counters.
- [Runner](../../../../../src/runner/dispatch/assignment-runner.mjs): documented
  same-user trust boundary.
- [Recovery test source](../../../../../test/runner/coordination-recovery-and-quorum.test.mjs):
  constructed crash-state fixtures and fake subprocess executors; not rerun here.

No single rejected invented step proves that all possible encodings fail. The
conclusion is limited to the documented public request path and the inspected
routing branches. Internal imports or separately opened sessions are not the
same capability as adaptive recruitment within one native session envelope.

## Advisory evidence and concurrency update

The other chat remains active per the person. At the refreshed read, its
current-cell had advanced to P01.3: phases 1–8 complete, waiting for a genuine
Phase 9 human reaction. Do not treat that gate as process idleness or ask its
question on behalf of the other chat.

P00.1 already documents a narrower admission than the allowlist label alone
suggests: the bwrap OS mount blocked writes, but exact Claude/agy invocations may
not be able to perform useful advisory work without writable private state.
See [P00.1 Known Limitation](../architecture-advisory-panel/P00.1.md). This audit
adds a read-confidentiality result; it does not invalidate its write-denial proof.

## What can proceed and what cannot

Completed independently: public-path static inventory, ten validator cases,
broad-mount canary, and narrow-mount candidate probe. The synthetic fixtures are
boundary fixtures, not the parser/compatibility Code Panel consumer yet.

Before a live Code Panel run, establish a runnable provider binding inside the
chosen isolation boundary, safe provider credentials/transport, strict cost or
usage limit, private writable provider state, and a native bounded recruitment
path. The narrow probe intentionally has no network and no provider credentials;
adding these is a new boundary decision, not a harmless command substitution.

The smallest next design artifact is a concrete boundary sketch for the worker's
filesystem, private scratch, authenticated control access, and provider transport,
plus a public-action gap mapping. Reconcile any required source changes with the
other track's P02/P03 lease before implementation. Remaining static audits and
synthetic checks may continue independently. Do not launch an unconfined agent to
claim the full proof was completed.
