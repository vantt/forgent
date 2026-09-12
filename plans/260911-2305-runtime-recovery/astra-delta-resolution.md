# Astra Final Audit Delta Resolution

**Status:** A01-A08 INDEPENDENT DELTA REVIEW PASSED; P02L DEFAULT-ADAPTER GATE SEPARATE  
**Date:** 2026-09-12  
**Scope:** findings A01-A08 only; no code authorization

## Resolution Matrix

| Finding | Resolution | Normative location | Required proof |
|---|---|---|---|
| A01 control generation | `attempt` fences Run supersession; per-acquisition `controlEpoch` and random `controlToken` fence controllers of the same Run. Short synchronous mutex protects CAS only; adapter I/O is outside it. | implementation catalog `Run Control V1`; P01 Lock Protocol | distinct acquisitions, stale outcome/release, SIGSTOP/SIGKILL, async effect reconciliation |
| A02 incarnation | `agentSession` is conversation correlation. Control requires adapter-proven `resourceIncarnation`; missing proof parks. | AD-02/AD-06; implementation catalog Herdr Binding Evidence; P02 | same conversation/new process, restart, missing incarnation |
| A03 retry transaction | Session retry declares exact destination under session->Assignment lock before Run publication; crash resumes declared `nextRunId`. Standalone retry uses atomic Run supersession declaration. | P01 Commit Algorithm; assignment-run-runresult contract | crash after declaration, no leapfrog/link-count inference, schema-1 parity |
| A04 launch gate | Fresh `not-requested -> pending` transition alone permits first submit. Every resumed pending state reconciles or parks. Current adapter never claims pre-bind rebind or replacement. | P02 Ordering and Acceptance | fresh submit once, pre-bind crash parks, F-f no duplicate |
| A05 stale apply | Recommendation returns snapshot digest, expected control epoch, expiry and single-use action key; apply must echo them. | implementation catalog Dispatch Recovery Door; P04-P05 Planner Contract | missing/stale/expired refusal, concurrent single winner, idempotent replay |
| A06 leases/dependencies | P04 is pure/new-file only; P05 and P05S integrate separate dispatch/session doors in later waves; CLI router is leased; P08 closes core without waiting for P06/P07. | code-panel-cells.json; plan Waves/Leases | manifest graph/lease audit plus code-panel changed-file enforcement |
| A07 confinement | Current `local-bwrap-v1` cannot prove filtered network. P03 ships pre-delivery policy only; post-delivery repeat stays parked until positive adapter coverage exists. | P03 Effect Rules; implementation catalog Effect Attestation | current adapter unsupported branch; no advertised positive capability |
| A08 session recovery | P05 remains standalone `dispatch recover`; new P05S owns `coordination recover` through existing session write door. | session-recovery-door.md; catalog Coordination Recovery Door | C-f, current driver, no implicit close, X11 visible |

## Simplicity Recheck

The delta adds no manager, registry, health store or durable plan-token store.
It adds one unavoidable Run-control record because controller ownership has a
different lifetime from Run attempt. It adds P05S because standalone Run and
CoordinationSession have different authorities; sharing their pure evaluators
does not merge their write doors.

## Capability Boundary After Delta

- Core candidate: admission, fresh single launch, observe/park, pre-delivery
  fallback, standalone/session read-and-apply recovery.
- Still disabled: replacement/resubmit after ambiguous launch, post-delivery
  repeat on current bwrap, same-workspace writable takeover, terminal-parent
  transfer and driver replacement before engine backlog closes.
- At this intermediate point `dispatchStatus` remained blocked pending the
  independent review recorded below.

## Review Question

For each A01-A08 row, answer `closed`, `partially closed` or `open` with a
source/contract citation. Report any new blocker separately and show which
implementation cell it blocks. Do not reopen a locked product decision without
contradictory evidence.

## Delta Review Round 2

Astra closed A02, A04, A05, A07 and A08, and found A01/A03/A06 partial. The
follow-up corrections are:

| Round-2 finding | Correction |
|---|---|
| unlink-based mutex can delete successor | P01/catalog now require immutable generation records and token-specific release markers; contenders never unlink |
| P02 cannot thread `runId` inside its lease | P02 now leases `assignment-runner.mjs` and `cli.mjs` in addition to transport/Herdr files |
| P05S event would fail schema/replay | P05S now defines `recovery-command-recorded` and leases schema, replay and command registry |
| crash after directory create before `run.json` | admission now builds/fsyncs a complete staging directory and atomically renames it; final attempt directory is never empty |
| summaries duplicate control authority | mutable control fields were removed from Run; immutable generation records are authority and `control.json` is projection |
| reattach capability overstated | capability matrix now conditions reattach on adapter-proven resource incarnation; current CLI otherwise observes/parks |

## Final Independent Verdict

Astra's final verification found no remaining blocker. A01, A03 and A06 are
closed at design level; A02, A04, A05, A07 and A08 remain closed from the prior
round. The only documentation residual—P08 overstating reattach—was corrected
to require adapter-proven resource incarnation. The manifest is now
not automatically implementation-ready: this verdict covers A01-A08 only. The
later default `cli-spawn` recovery review opened the separate P02L gate, now
tracked in `cli-spawn-independent-review-report.md`,
`cli-spawn-review-resolution.md` and
`phase-designs/cli-spawn-local-contract.md`. No code-panel dispatch is
authorized until the P02L re-review passes and the person explicitly lifts the
hold.
