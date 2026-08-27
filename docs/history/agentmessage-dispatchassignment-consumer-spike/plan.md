# plan.md — tsk-3rn: Spike concrete consumer for AgentMessage/DispatchAssignment

Mode: spike

**Why spike, not tiny/small.** One yes/no question decides whether the plan
is even real (per `fgos-routing`'s Mode gate): does a real consumer exist
today for `AgentMessage`/`DispatchAssignment`/mailbox/artifact refs among
the four candidates the item names (Herdr async handoff, dashboard replay,
compliance report, external provider)? None of the other flag-counted
concerns (auth, data model, audit/security, external systems, public
contracts, cross-platform, existing covered behavior, multi-domain) apply —
this is a pure `docs/history` research read, no code touched, `risk: light`
(set at discovery, `fgos edit` seq 6).

**No CONTEXT.md exists for this item.** Discovery's verdict was `clear`
(`fgos discover --verdict clear`, seq 9-ish), which by design skips
`exploring` and its CONTEXT.md — this plan is grounded directly in
`RESEARCH.md`'s Round 1 findings (discovery-stage, same feature dir) and in
`docs/history/dispatch-plan-protocol-redesign/plan.md`'s own locked D6
decision, not a locally re-derived CONTEXT.md.

**Impact-analysis posture: not applicable.** No code is touched by this
item's own execution (a written report is the only artifact) — the
Approach step's blast-radius proof-point requirement is scoped to code
changes; nothing here leans on `impact()`/blast-radius evidence.
`fgos graph --id tsk-3rn --json` was run per the mechanical Approach step
regardless: this item is a size-1 component (no dependents, its one dep
`tsk-5x7` is already `delivered`), so `criticalPath`/`topUnblock` carry no
useful ordering signal for a single-piece item.

## Approach

**Chosen path.** Re-run the same evidence-gathering discipline already
proven at discovery (repo-search-first, external-if-not-found,
file/line-cited) against each of the four named candidates individually,
then write the required consumer-candidate table (candidate, evidence,
required fields, non-goals) into `RESEARCH.md`/a dedicated report, and
close with the explicit decision this item's own acceptance criteria
demand: **defer further**, or **spin off a narrow implementation item**
naming a real producer+consumer pair.

**Alternatives rejected.**
- *Implement a minimal `AgentMessage`/mailbox now, on spec.* Rejected by
  the item's own scope line ("Không implement mailbox/artifact store
  ngay") and by `tsk-5x7`'s own D6: "AgentMessage was larger than its
  evidence... 8 of 11 message types have no named consumer" — building
  ahead of a confirmed consumer repeats exactly the mistake D6 already
  named and cut.
- *Trust `docs/architect/dispatch-control-plane-redesign.md`'s design
  prose as sufficient evidence.* Rejected — that doc states a *design
  target*, not a *shipped* consumer; RESEARCH.md Round 1 already confirmed
  zero `src/` implementation exists. A design doc naming a candidate is not
  the same as that candidate having a real, current need — each of the
  four candidates in the item's own description needs its own check.

**Risk map.**

| Component | How risky | What would prove it |
|---|---|---|
| Consumer-candidate research quality | light — wrong repo-search scope could miss a real consumer | each candidate gets its own repo-search-first pass (Herdr gateway/dashboard code, any compliance-report generator, any external-provider adapter config), cited by file/line, same discipline as discovery Round 1 |
| Over-scoping into implementation | light — spike could drift into writing schema/code | acceptance criteria's own hard line ("Không tạo schema/code nếu chưa có consumer") is the check; verify explicitly requires a report, not code |

**Files likely touched.** Only docs — no `src/` files:
- `docs/history/agentmessage-dispatchassignment-consumer-spike/RESEARCH.md` (append Round 2+)
- `docs/history/agentmessage-dispatchassignment-consumer-spike/plan.md` (this file, if the shape needs revision)
- A dedicated report may live under `plans/reports/` per this repo's own report-naming convention, if the executing session judges the RESEARCH.md accumulation itself insufficient as the final deliverable shape — that judgment belongs to `fgos-coding-implement`, not fixed here.

## Shape

**One open question (spike mode):** does a real, current consumer exist
for `AgentMessage`/`DispatchAssignment`/mailbox/artifact refs among Herdr
async handoff, dashboard replay, compliance report, or an external
provider — or does the evidence still support D6's original deferral?

Concrete cases to check per candidate (each needs its own repo-search-first
pass, not a shared assumption):
- **Herdr async handoff** — does `herdr-fgos` gateway/dashboard code
  (`herdr-plugin/src/`, `src/runner/dispatch/transport.mjs`) have any
  in-flight need for an async result/question channel beyond the
  `herdr-spawn` adapter's existing prompt/stdout contract (`tsk-5x7-3`)?
- **Dashboard replay** — does the herdr web dashboard
  (`docs/history/herdr-*dashboard*/`) read or replay any structured
  message/result shape today, or only the existing ladder
  (structured/legacy-signal/inferred)?
- **Compliance report** — does any egress-governance consumer
  (`tsk-5x7-2`'s declared-egress governance) read a message-level audit
  trail that would need `AgentMessage`'s envelope shape specifically?
- **External provider** — does any registered executor/adapter
  (`EXECUTOR_ADAPTERS`, `src/runner/dispatch/config.mjs`) already need a
  cross-process message envelope beyond today's CLI/prompt-and-stdout
  contract?

## No split

Single-piece item — the acceptance criteria describe one report with one
decision at the end, not multiple independently workable pieces. No child
specs to write.

## Outstanding questions

None
