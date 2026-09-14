# Supplemental D06 Panel Red-Team Report

**Assignment:** `asgn_codex_lead_op_009`  
**Session:** `dispatch-operability-design-d06-panel-r2`  
**Verdict:** **REVISE**

## Scope and evidence inspected

I inspected the four supplemental request packets, the registered protocol,
the durable session (`session.json`, `events.jsonl`, and task claims), the
eight completed assignment results/reports, and `fgos coordination show
dispatch-operability-design-d06-panel-r2 --json` at 2026-09-14T15:43Z.

The session is real and durable: it identifies the registered
`core.coordination-protocol.architecture-advisory-panel-v1` v1.0.0 protocol,
eight distinct role bindings, nine assignment references, and an append-only
30-event log. Thus the claim that *no* supplemental panel/session exists is
false. It is, however, still `active`, has no final disposition, no completed
red-team link at inspection time, and is not a completed/replayable D06
decision record.

## Findings

### HIGH — claimed staged visibility/replay is not evidenced by the actual run

The protocol promises `isolated-until-fan-in` and permits only
`artifact-refs` through named windows (`core/coordination-protocols/
architecture-advisory-panel-v1.yaml`, topology/visibility windows). Yet every
authorization in the actual event log records `grantedContextRefs: []`, every
authorized assignment has `contextGrant.refs: []`, and the event types are
only `session-opened`, `actor-bound`, `assignment-created`,
`operation-authorized`, and `result-linked`. There are no contribution links,
artifact-reference links, or any immutable report digest in the session log.

The synthesis says the registered panel can provide “staged visibility,
critique, synthesis, red-team, and replay” (op_008 report, lines 44-48), but
the durable record does not show how the critic, synthesizer, or red-team
received any allowed earlier artifact. The request prose instead points each
actor at a shared checkout. That may have let actors read files directly, but
it is not protocol-enforced isolation and cannot be replayed as an authorized
fan-in. This is a process-evidence failure, not proof that a particular actor
actually read prohibited material.

**Required disposition:** do not describe this run as satisfying staged
visibility or a complete replay. Re-run downstream steps with immutable,
hash-pinned artifact references recorded as contributions/context grants (or
state an explicitly authorized non-isolated procedure and stop claiming the
protocol's isolation property).

### HIGH — synthesized conditional READY outruns the evidence state

The op_008 synthesis correctly says that requests and worker reports alone are
not the completed panel record (lines 27-32), requires a post-synthesis
red-team/recheck (lines 173, 178-82), and lists seven prerequisites before
merge. But it still headlines `READY with named supplemental edits before
merge`. At review time those edits have no linked evidence, the red-team is
late, no explanation/close operation has occurred, and the session has no
driver disposition. `fgos coordination show` reports the same facts:
`status: active`, `dispositions: []`, red-team late, and lead advisor missing.

This must be represented as **not yet ready / pending required evidence**, not
as a READY decision with post-hoc conditions. A conditional recommendation may
remain in the advisory record, but it must not promote D06 or clear its gates.

### MEDIUM — the Codex-only limit is disclosed, but independence remains weaker

The request explicitly binds all eight actors to `codex-bwrap`; the session
records roles but not a provider/model identity per assignment. Op_008 openly
states the lack of provider-family diversity and correlated blind spots (lines
44-49, 145-49, 170). Therefore this limitation is **not hidden** in the
packet. It nevertheless cannot substantiate a claim of independently
corroborated review: role labels and sequential assignment IDs alone do not
show distinct principals, separate model executions, or independence from the
same `codex-lead` driver.

**Required disposition:** retain the explicit single-provider limitation in
the final record; call it role-separated Codex-only review, never independent
or cross-provider review. If D06's acceptance gate requires independent
review, obtain it or durably waive/alter that criterion with the authorized
owner.

### MEDIUM — assignment reports are mutable references, not evidence-bound

The event log's eight `result-linked` events contain only assignment and run
IDs. `agent-result.json` files provide short summaries; neither the session
events nor task-claim files record an artifact path, digest, report revision,
or contribution ID. I could compute report hashes from the live files, but
those hashes are external to the session and were not committed by the panel.
Consequently, a later edit can change what a replay reader sees without any
corresponding event. This leaves the summary-to-report and report-to-synthesis
chains unpinned.

**Required disposition:** link each relied-on report as a durable artifact
reference with content hash/revision before a synthesis, red-team, or final
disposition relies on it.

### MEDIUM — findings do not yet have a complete final disposition ledger

Op_006 lands a MEDIUM negative-production-route proof gap and recommends NOT
READY pending evidence. Op_008 acknowledges it, plus traceability and
promotion gaps, but the live session has `dispositions: []`; no final
HIGH/MEDIUM acceptance, remediation owner, recheck result, or closure is
durably recorded. Op_008’s own prerequisite #7 admits that the prior “no
MEDIUM findings” closure is stale.

**Required disposition:** enumerate every HIGH/MEDIUM finding in the D06
ledger, assign an owner, evidence requirement, and recheck, then record the
driver's final disposition only after the independent red-team result is
linked. The driver has **not** self-cleared this session today—there is no
disposition event—but a later driver must not convert its own unverified
summary into closure.

## Attacks that failed

- **“There is no durable session/replay at all.” Failed.** The real registered
  session and event log exist; the defect is incomplete evidence-bound replay,
  not absence of persistence.
- **“Codex-only was hidden.” Failed.** It is stated in the request and repeatedly
  disclosed by the synthesis. The remaining problem is the unsupported leap
  from role separation to independent corroboration.
- **“The packet falsely calls planned runtime behavior shipped.” Failed.** The
  critic and synthesis consistently distinguish design readiness from shipment
  and defer production drills; no contrary implementation claim was found.
- **“The driver already self-cleared the decision.” Failed at the inspected
  state.** The driver authorized operations, but no `driver-disposition-
  recorded` event or final close exists.

## Verdict and exit criteria

**REVISE.** Do not accept this supplemental packet as D06-READY or as proof of
a completed isolated advisory panel. Before a new readiness verdict: (1) bind
the reports used by each downstream role into the session with immutable
artifact references/digests and lawful visibility grants; (2) complete and
link this red-team result, explanation, any required rechecks, and closure;
(3) disposition every HIGH/MEDIUM item with owner and evidence; and (4) retain
the Codex-only/non-independent limitation and planned-not-shipped boundary in
the promoted record.
