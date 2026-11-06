# ADR-011: Dispatch Owns Lifecycle, Herdr Is Transport, The Receiver Writes The Receipt

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Accepted at atomic cutover
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Source material from `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md` at `947dc310396071a4d530216d5c06d05993d63bf5`; live routes and the explicitly stated implementation corrections are adapted here.
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/runner/spec.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Carriage note: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Implementation And Design Status

The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.

| Section | Status | Evidence / limit |
|---|---|---|
| Decision | Mixed implementation and proposal; no blanket implementation claim | herdr-round.mjs:21-24 (agent_status never concludes a round; result file is receipt); herdr-agent.mjs:385; assignment-runner.mjs:2471-2492; visibility-session.mjs:136-146 (actor lease deliberately removed) |

## Context

ADR-005 settled that herdr is visibility, not evidence. What it did not settle
was how an interactive Run is actually driven, and the gap was filled by
inference: the adapter typed the prompt into a pane, polled `agent_status`,
and treated the first stable idle reading as completion.

That inference was measured wrong twice in production, in two different ways.
An agent reported `idle` before it had started at all, so a dispatch that had
delivered nothing reported success with an unchanged HEAD. And a multi-step
turn showed an idle-looking gap between two tool calls, ending roughly a
quarter of runs mid-work. Each was patched — a "must have seen working first"
gate, then a three-poll debounce — and the second patch's own author recorded
that it was a heuristic, not a proof.

A third, separate defect had the same root. The prompt travelled as an argv
string typed into the pane as keystrokes, so every multi-line prompt was
corrupted before the agent ever saw it — and every real implementation prompt
is multi-line.

All three are the same mistake: reading the terminal as though it were the
record. No amount of tuning fixes that, because the terminal is not where the
answer is.

## Decision

**Dispatch owns lifecycle truth.** Pane, pid and agent session are bindings —
losable, rebindable, and never authoritative. They are recorded so a Run can be
found again, not so it can be judged.

**herdr is transport and failure detector, never truth and never receipt.**
Its agent API is used deliberately: `agent start` to bring an agent to ready
(which absorbs the shell boot race the old path had to guess at), `agent
prompt --wait` to confirm a submission was accepted, `agent read` to explain a
failure, `pane process-info` to ask whether a process is still there. Every one
of those answers a question about the transport. None of them answers whether
work happened.

**A receipt is an artifact the receiver wrote.** The herdr round reads the worker-written result file, not agent_status (src/runner/dispatch/herdr-round.mjs:21-24). The Assignment supervisor path instead waits for protected/adapter-receipts/<launchCommandId>.json; supervisor exit or timeout can end that wait without a success receipt, producing an explicit failure/unknown outcome (src/runner/dispatch/assignment-runner.mjs:2471-2540). Neither terminal idleness nor transport acceptance proves work.

**Visibility and contact are separate capabilities.** V0 grants observation
only. Observers do not settle Runs. The former actor-lease API was removed; current controller exclusion is fenced by run-control epoch and token, not a visibility lease (src/runner/dispatch/visibility-session.mjs:136-149; run-lock.mjs:306-412).
A mechanism that cannot support a capability refuses it by name rather than
degrading quietly.

## Consequences

- The prompt never travels on a command line. It is written to a file and a
  one-line pointer is submitted, which makes the multi-line corruption
  structurally impossible rather than unlikely. An inline delivery stays
  available as a declared per-executor choice with its own evidence.
- The `sawWorking` gate and the three-poll debounce are deleted rather than
  kept. They were patches on a reading that no longer happens, and keeping
  them would preserve the debt without the belief.
- A failure is named. `agent_not_ready`, `agent_prompt_stalled`,
  `agent_blocked`, `died`, `timed-out-idle`, `timed-out-ceiling` and
  `paused-limit` are seven different answers where there used to be one
  timeout, and each decides what happens to the pane.
- A liveness probe that fails reports `unknown`, never `absent`, and death
  requires consecutive absences. A gate may refuse on bad information; a
  decision to kill may not.
- A Run that ended says so. `run.json` is closed out at settlement, and a Run
  whose dispatch process died is reconciled to `settled`, `died` or `unknown`
  — where `unknown` is a real answer, not a retry and not a success.
- Panes of failed runs are kept. Forensics accumulate, and that cost is
  accepted in exchange for failures that stay legible.
- Closing a pane is not cancelling a worker: the foreground process dies and a
  `setsid` descendant survives it. No outcome is reported as cancelled.

## Open, and stated rather than hidden

- The worker holds a copy of the operator's provider credential. Only a relay
  closes that, and V0 does not have one.
- `blocked` and `paused-limit` both map to the coarse `worker-timeout` error
  class the recovery matrix matches on, so the matrix will retry them like any
  other timeout. The precise answer is on the result as `outcome`; giving the
  matrix its own entries is separate work.
- Hang detection remains unsolved. Upstream measured that neither CPU nor an
  output counter distinguishes a thinking agent from a stuck one, and parked
  it. V0 has an idle timeout and a ceiling, and calls that a gap rather than
  pretending otherwise.

Supersedes nothing. Extends ADR-005 (herdr is visibility, not evidence) with
who drives, and ADR-010 §3 (interactive and headless must have identical
capability, declared) with what a mechanism must declare about itself.

