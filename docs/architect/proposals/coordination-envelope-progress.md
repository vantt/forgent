# Coordination Envelope — Chat Progress and Next Work

Document type: Index
Design status: Discussion
Implementation: Active — conceptual review and probe preparation only
Last reviewed: 2026-09-06
Canonical for: progress and handoff of this advisory/probe-preparation conversation only
State class: State — update to current reality; linked reviews/results retain their own history

## Objective and authority

Find and test an architecture that preserves coordinator/worker intelligence while
runtime hardens authority, capability, isolation, visibility, bounds, provenance,
evidence, replay, and mutation safety. Serve Code Panel, Plan Loop, research,
RFC/Delphi/NGT, and Architecture Advisory without a separate workflow engine per
use case.

The person agreed to the proposed next step: prepare a minimal Code Panel probe
and establish what the existing substrate can prove before a multi-phase
implementation plan. The conceptual recommendation remains Discussion; agreement
to investigate/probe does not accept new production contracts or supersede locked
trust-model decisions.

## Current status

**Initial capability-fit audit, boundary sketch, and no-provider probes completed.** Native request
validation and two synthetic mount experiments have run; see the
[dated result report](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md).
No agents/providers were dispatched and no full test suite was run. Temporary
boundary fixtures exist; the parser/compatibility Code Panel fixture does not.
No production source/config or other track state was modified. Full native
multi-agent proof remains unready because recruitment and authority/isolation
requirements are not yet met.

| Work | Status | Evidence / output |
|---|---|---|
| Reconstruct independent review and inspect current source/contracts | Complete, focused static inspection | [Independent review](../../../plans/reports/review-260905-agent-coordination-trong-mem-ngoai-cung.md), source references in conceptual proposal |
| Compare three families, walkthroughs, debate, boundary, recommendation | Complete as Discussion | [Conceptual architecture](coordination-capability-envelope.md) |
| Record migration responsibilities, reversal conditions, human decisions | Complete as recommendations, not accepted implementation scope | Sections 7–11 of conceptual architecture |
| Define minimal Code Panel probe and pass/fail criteria | Prepared; execution not started | [Probe contract](coordination-envelope-probe-contract.md) |
| Inspect relationship with concurrent Advisory work | Initial inspection complete; must refresh before shared changes | Relationship section below |
| Audit exact public-path capability and isolation | Initial audit complete | [Result report](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md) |
| Create isolated fixture and freeze execution manifest | Pending audit | No fixture/run manifest yet |
| Execute available small probes and collect evidence | Ten validator cases and two OS checks complete | Native request gaps; broad-mount read leak; narrow-mount candidate passes limited cases |
| Worker/provider/control boundary sketch | Prepared as Discussion | [Boundary sketch](coordination-worker-provider-boundary.md); environment inheritance and output-ingestion seams identified |
| Coordination ↔ Dispatch contract | Refined as Discussion | [Contract sketch](coordination-dispatch-contract.md); coordinator-facing request door and invariants are explicit |
| Synthetic environment isolation | Complete, two OS-only cases | [Raw evidence](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json); no real credentials read |
| Reconcile architecture using native/prototype/failure evidence | Pending live/integration evidence | No final family acceptance or multi-phase implementation plan |

Documentation links were checked and `git diff --check` passed for the preceding
document edits. This is documentation validation, not runtime proof. GitNexus MCP
was unavailable during initial inspection; direct source navigation was used.

## Findings to preserve

- F4 in the 2026-09-05 historical review is partially stale: public `run.mjs` now
  forwards `step.mutation`. End-to-end mutation safety has not been re-proven here.
- Inspected code still auto-attempts close, derives required actors from the roster,
  checks driver identity by writer-string equality, and derives chain hints from
  execution state rather than durable decision rationale.
- Recommend family B: capability envelope plus coordinator-owned deliberation;
  preserve FlowDefinition as an optional method, the shared Assignment/Run path,
  and a rich master-prompt/skill operating surface.
- Dispatch & Execution is the direct substrate for every capacity/role/workflow/
  stage request. A coordinator proposes semantic actions; it does not choose an
  alternate executor stack. `in-process` remains one returned mechanism.
- Read-only filesystem enforcement does not imply read confidentiality, sibling
  independence, credential isolation, or authenticated coordinator authority.
- Fake executors, configuration labels, and packet hashes cannot establish live
  cognitive quality or actual backend model identity by themselves.

## Concurrent Architecture Advisory session

The person explicitly reports that the other session is still working. Do not
infer that it is idle from a parked work-item/cell document or stop its processes.

At the earlier read in this chat, its
[current-cell](../agent-coordination/verification/architecture-advisory-panel/current-cell.md)
said parked before P01.3, and its
[index](../agent-coordination/verification/architecture-advisory-panel/index.md)
recorded P00.1, P01.1, and P01.2 done. Those are a snapshot of recorded track
progress, not a live claim about what the other chat is doing now. Its plan header
was stale relative to its evidence index. Refresh the actual documents when
coordination becomes necessary.

Refreshed observation during the audit: P01.3 phases 1–8 are complete and the
track awaits a real Phase 9 human reaction. This does not imply the other session
is idle. No intervention or message was sent.

Division of work:

- Other session: Advisory soul, manual clear/unclear-input proof, decision dialogue,
  and its own authorized track work.
- This chat: public dispatch/isolation capability audit and small disposable
  Code Panel probes about adaptation, authority, evidence, and resume.
- Proposed convergence: Advisory P02 capability-fit audit, before shared-kernel/
  protocol scope is fixed in P03. This is a recommendation, not a pause instruction
  or a change imposed on the other session's plan.

Reuse its P00.1 executor and P01.2 manual-proof evidence within their actual scope.
Do not rerun its human dialogue or use vnflow/mdview as adversarial targets. No
message has been sent to the other session and no execution has been interrupted.

## Next work, in order

1. **Audit exact current public paths, read-only.** Inspect dispatch/recruitment,
   context and credential exposure, identity, closure, and resume. Distinguish an
   engine-internal primitive from a usable public capability. Recheck relevant
   source changes since the initial review and reuse existing proof artifacts.
2. **Write the capability-fit result.** For each probe requirement, record available
   native behavior, supporting source/proof, uncertainty, and minimum missing seam.
   Avoid choosing a kernel implementation before the evidence establishes need.
3. **Prepare an isolated synthetic consumer fixture.** Freeze literal paths,
   immutable source/runtime/config snapshots, role packets, bindings, evidence
   ownership, and enforceable budget in a run manifest. Use synthetic secrets only.
4. **Run the small probes that are genuinely ready.** First establish containment
   before adversarial execution. Every dispatch follows `dispatch decide` and its
   returned mechanism. Keep evidence outside the Advisory verification directory.
5. **Report native pass, native failure, prototype-only, or unproven.** Do not build
   a private runtime and present its result as native fgOS capability. If shared
   production changes are necessary, stop those dependent experiments, document
   the gap, and continue independent checks.
6. **Converge before implementation planning.** Compare with the Advisory track's
   observations and reconcile shared-file ownership and architecture assumptions.
   Only then define a concrete reviewed implementation scope if justified.

Steps 1–2, the worker/provider/control sketch, and the Coordination ↔ Dispatch
contract now have outputs. Visibility/herdr/contact is explicitly removed from
this thread and deferred to a separate discussion. The next question is whether
adaptive Coordination can lower a new specialist request through the ordinary
Dispatch path, including its `in-process` branch, with complete lineage, bounds,
retry/recheck semantics, and evidence. The conceptual coordinator-facing port is
now specified, but no public API or production implementation is accepted.
Provider compatibility remains unverified.

## Work boundaries and completion criteria

This chat also owns its separate evidence directory:
`docs/architect/agent-coordination/verification/coordination-envelope/`.

This chat currently maintains:

- `docs/architect/proposals/coordination-capability-envelope.md`
- `docs/architect/proposals/coordination-envelope-probe-contract.md`
- `docs/architect/proposals/coordination-envelope-progress.md`
- `docs/architect/proposals/coordination-worker-provider-boundary.md`
- `docs/architect/proposals/coordination-dispatch-contract.md`

Earlier navigation edits added links in the proposal index, Agent Coordination
portal, and Advisory proposal. They do not change accepted authority. Preserve
other sessions' edits and avoid further shared-portal changes unless needed.

Do not modify the other track's plan, current-cell/index, soul/playbook, evidence,
production config, or runtime files as part of the read-only audit. Before later
shared implementation, refresh track state and agree non-overlapping file scope;
a separate worktree alone does not resolve design or shared-runtime conflicts.

The investigation is done when a fresh reader can identify what works through
native public paths, what fails with reproducible evidence, what remains unproven,
and whether the envelope recommendation deserves implementation. A proposed
architecture or successful documentation check is not that result.
