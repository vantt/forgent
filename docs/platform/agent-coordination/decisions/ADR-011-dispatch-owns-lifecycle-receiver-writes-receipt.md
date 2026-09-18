# ADR-011: Dispatch Owns Lifecycle, Herdr Is Transport, The Receiver Writes The Receipt

Document type: ADR
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-07
Canonical for: who owns an interactive Run's lifecycle, and what may end one

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

**A receipt is an artifact the receiver wrote.** A round ends when the worker's
own result file appears in its outbox, and at no other moment. `agent_status`
is never read as completion anywhere; it says only whether it is safe to type
right now, which is the only question it was ever able to answer.

**Visibility and contact are separate capabilities.** V0 grants observation
only: any number of watchers, exactly one actor holding a pid-and-token lease.
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
