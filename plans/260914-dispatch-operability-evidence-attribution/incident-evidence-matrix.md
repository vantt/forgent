# Incident Evidence Matrix

**Status:** D00 drafted
**Source:** [dispatch-process-incidents.md](../260911-2305-runtime-recovery/reports/dispatch-process-incidents.md)

This matrix preserves all twenty source observations. Each incident has exactly
one primary disposition for summary counting. A row may also name secondary
implications, but secondary implications do not increment the primary summary.

Disposition vocabulary:

- `addressed` means a committed DOEA capability directly covers the fgOS product
  gap.
- `supporting` means the incident motivates contract/proof work required by a
  committed capability, but is not itself a separate capability.
- `already-resolved` means the source runtime-recovery track changed practice or
  implementation before this design track began.
- `external` means fgOS does not own the root cause, but must preserve,
  classify, or explain its effects.
- `deferred` means the semantic change is explicitly outside this initiative.

Evidence strength vocabulary:

- `direct` means the incident report names the behavior and its observed
  recovery.
- `correlated` means timing or dirt changed during the window, but causation was
  not proven.
- `operator-analysis` means the root cause came from later human/git/process
  reconstruction rather than a self-contained runtime artifact.
- `external-claim` means the root cause lives in an outside tool/provider and
  fgOS can only observe consequences.

| # | Stable ID | Observation | Asserted cause | Evidence strength | Platform owner | Primary disposition | Secondary implication | Committed capability | Negative capability | Future proof |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | INC-01 | Worker in an isolated worktree could not read raw `.fgos/assignments/...` evidence paths from the main checkout. | Cross-worktree storage paths are not portable evidence references. | direct | Coordination/Dispatch handoff | already-resolved | contract visibility | Dispatch inspection and effective contracts use owned ids/ports. | No raw cross-worktree `.fgos` path handoff as authority. | Inspect-by-assignment/run resolves storage internally; reviewer fixture cannot require main-checkout raw path. |
| 2 | INC-02 | Fresh cell worktrees could not see an untracked plan/contract directory. | Git worktrees materialize committed content only. | direct | Track operation | already-resolved | production proof discipline | Production-door proof starts from committed design/contract inputs. | No invisible local plan directory as executable authority. | Cell-open checklist and production proof fail when required plan files are absent from HEAD. |
| 3 | INC-03 | An older unconsumed authorization could outrank a newer retry. | Coordination authorization selection is event-order/idempotency behavior. | direct | Coordination semantics | deferred | inspect must expose replay/provenance | Inspection/RunResult shows replay/delivery provenance. | No change to authorization ordering, cross-session authority, or same-key semantics. | Same-authority replay fixture documents selected authorization and requires a separate future design before behavior changes. |
| 4 | INC-04 | `contextRefs` could not cross coordination sessions. | Assignment refs are scoped to the owning coordination session. | direct | Coordination authority | supporting | boundary diagnostics | Effective contract and inspect output expose session boundary and recovery authority. | No cross-session `contextRefs` or authority inheritance. | Negative fixture proves cross-session refs refuse while inspect can still cite prior artifacts as non-authoritative evidence. |
| 5 | INC-05 | Session close status depended on exact required-actor completion shape; findings could leave quorum looking failed. | Coordination quorum and BL1 edge behavior are separate from Run execution. | direct | Coordination session | supporting | BL1 deferred | RunResult/Observation separates execution, assessment, quorum, and policy. | No quorum rule rewrite and no BL1 fix in this track. | Fixture with HIGH findings preserves completed execution plus assessment without claiming quorum clean-pass. |
| 6 | INC-06 | Session wall time and executor timeout were separate unextendable bounds. | Aggregate session bounds and executor adapter ceilings have different owners. | direct | Coordination plus Dispatch | supporting | contract visibility | Effective execution contract records both bounds and owners. | No hidden override of either bound from a cell request. | Inspect shows both limits; timeout tests classify executor timeout separately from session wall-time expiry. |
| 7 | INC-07 | A worker self-report claimed PASS despite falsifying evidence. | `agent-result.json` is a claim, not independent proof. | direct | Dispatch result evaluation | addressed | production proof | RunResult v2 preserves worker claim, independent evidence, assessment, and policy separately. | No worker self-certification of terminal success. | Normalizer fixture rejects contradictory claim while retaining artifacts and findings. |
| 8 | INC-08 | Correct isolated logic was unreachable through production dispatch. | Tests bypassed the real dispatch door and missed field-forwarding/wiring gaps. | direct | Dispatch implementation proof | supporting | proof requirement | Production-door proof matrix becomes mandatory for shipped capabilities. | No direct-unit-only proof can close implementation. | End-to-end fixture traverses config/Assignment -> DispatchPlan -> adapter -> result -> inspect. |
| 9 | INC-09 | A plausible Herdr command hypothesis failed under live execution. | Documentation/read reasoning was insufficient to prove adapter argv semantics. | direct | Adapter capability declaration | supporting | evidence attribution | Adapter capability coverage requires live executable proof and declared coverage. | No inferred adapter power from help text alone. | Adapter-positive attribution fixture can produce `proven` only inside declared live-proven coverage. |
| 10 | INC-10 | OOM kills left claims/resources behind. | External host resource pressure killed workers and left local guards. | direct + external-claim | Dispatch guard reconciliation | external | addressed: typed resource failure and guard repair | RunObservation/RunResult classify resource failure; CAS reconciliation repairs proven-stale guards. | No host OOM prevention, force-kill, or TTL-only cleanup. | Dead-holder guard fixture requires resource absence/incarnation proof and refuses live/ambiguous holders. |
| 11 | INC-11 | Hand-rolled `nohup` launch did not survive the tool-call lifetime. | Unsupported process launch path lacked managed lifetime. | direct | Operator practice | already-resolved | process boundary | Supported gateway/dispatch doors remain the process-lifetime boundary. | No new generic process manager in this design. | Operator docs/proofs reject unmanaged launch as a production-door substitute. |
| 12 | INC-12 | Restricted Bash was mistaken for total Bash denial. | Effective tool permission was not visible enough to the worker/operator. | direct | Dispatch contract compiler | supporting | prompt/contract visibility | Effective execution contract records tools and limits before launch and inspection returns it. | No prose-only permission guarantee beyond enforced policy. | Prompt/schema snapshot test fails if allowed command fields are dropped. |
| 13 | INC-13 | Status-specific worker-claim fields were missing from prompt. | Prompt and validator drifted from one another. | direct | Worker claim contract | supporting | contract generation | `agent-result-claim.v2` becomes one source for prompt and validation. | No free-form status claim accepted as terminal truth. | Invalid `blocked`/`failed` claim fixture produces typed contract failure and preserved artifacts. |
| 14 | INC-14 | Repeated `git branch -f` discarded integration history. | Destructive operator branch reset outside dispatch authority. | operator-analysis | Git/operator workflow | already-resolved | optional guardrails | Design notes history risk only where inspection observes consequences. | No arbitrary Git history protection or branch-force prevention in this initiative. | No DOEA implementation proof may rely on branch reset; separate future guardrail would need its own authority. |
| 15 | INC-15 | A live long-running coordination process was hidden by truncated process view and held the cwd dispatch lock. | Process inspection was incomplete; lock holder remained alive. | operator-analysis | Dispatch inspection | addressed | guard reconciliation | `dispatch.runtime.inspect` correlates full resource incarnation, cwd lock, Assignment, Run, and history. | No lock deletion from truncated `ps`, elapsed time, or first lookup miss. | Cwd inspect fixture reports holder details; reconcile refuses until dead/absent proof is complete. |
| 16 | INC-16 | Re-dispatching the same failed first-pass `taskKey` replayed cached failure. | Same-key idempotency replayed prior linked result. | direct | Coordination/Dispatch replay | addressed | compatibility | RunResult delivery mode includes `replayed`; inspect names the recovery authority. | No change to same-`taskKey` replay semantics. | Same-key replay fixture returns historical result without claiming a new execution. |
| 17 | INC-17 | Completed/failed dispatch sat unread for hours with orphaned visible resources. | No single inspection surface summarized completed-uncollected state. | direct | Dispatch inspection | addressed | operator UX | Inspect exposes completed-uncollected, orphan, and stale-guard states read-only. | No automatic inspect-to-recover forwarding. | Inspect fixture finds completed result and recovery-authority hint without contacting worker. |
| 18 | INC-18 | Reviewer findings appeared as generic failed quorum. | Assessment findings and execution failure were collapsed in the reader view. | direct | RunResult reader/Coordination display | addressed | compatibility projection | RunResult separates execution completion from assessment verdict and legacy status projection. | No single `status` field as sole truth for advisory operations. | Reviewer-with-HIGH fixture reads as completed execution plus findings, not provider crash. |
| 19 | INC-19 | Provider account/session limit left valuable uncommitted work. | External provider limit interrupted after workspace edits but before claim/commit. | external-claim | Dispatch result evaluation | external | addressed: salvage observation | Observation preserves workspace/evidence and classifies provider/resource failure. | No automatic retry, reimplementation, or claim that provider limit is fgOS-owned prevention. | Failure fixture with no claim but dirty leased files yields recoverable observation and not a false success. |
| 20 | INC-20 | Unrelated main-checkout dirt was attributed to the reviewer round. | Pre/post dirt check correlated concurrent external changes but could not prove authorship. | correlated | Evidence attribution/policy | addressed | guard policy | Observation, attribution strength, and policy disposition are independent. | No causal accusation from Git snapshots alone; no policy acceptance based only on worker claim. | Concurrent outside-dirt fixture records `correlated` or `unattributed`, never `proven`, while preserving substantive review result. |

## Coverage Summary

| Primary disposition | Incidents | Count |
|---|---|
| Addressed directly | 7, 15, 16, 17, 18, 20 | 6 |
| Supporting contract/proof | 4, 5, 6, 8, 9, 12, 13 | 7 |
| Already resolved operationally | 1, 2, 11, 14 | 4 |
| Deferred semantic change | 3 | 1 |
| External root cause retained as typed evidence | 10, 19 | 2 |

Primary count: 6 + 7 + 4 + 1 + 2 = 20 incidents. Secondary implications do
not add rows: INC-10 and INC-19 are external root causes with addressed fgOS
consequences; INC-05 has a supporting result-model implication while its BL1
semantic change remains deferred; INC-03's replay visibility is addressed only
as inspection/provenance, not as an authorization-ordering change.

No row authorizes automatic retry, cross-session authority, force-kill or
TTL-only cleanup.

## Gap Register

| Gap | Affected incidents | Disposition |
|---|---|---|
| Exact process authorship for filesystem writes is not proven by Git snapshots. | INC-20, partly INC-10/INC-19 | Model as `correlated` or `unattributed` unless adapter/confinement coverage supplies positive proof. |
| Some external provider failures leave useful workspace edits but no valid worker claim. | INC-19 | Preserve observation and artifacts; recovery or retry stays outside this design unless a later implementation track defines it. |
| Authorization ordering and same-key replay are existing Coordination semantics. | INC-03, INC-16 | Expose through inspect/result delivery metadata; do not change semantics in DOEA. |
| BL1 auto-close behavior is a separate known defect. | INC-05 | Do not solve here; ensure RunResult does not make the reader ambiguity worse. |
| Arbitrary Git history protection is outside Dispatch authority. | INC-14 | Keep as operational learning; no DOEA capability claims prevention. |
