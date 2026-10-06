# Runtime Recovery Requirements Traceability

This matrix is the coordinator's completion checklist. A row is complete only
when the owning cell's report links executable evidence; a design statement or
panel narration alone is insufficient.

| Requirement | Source | Owner cell | Required evidence | Status before implementation |
|---|---|---|---|---|
| Run is sole admission owner | runtime-recovery-design §2-3; Run contract | P01 | concurrent admission race, one committed winner | open |
| Session retry declares exact destination before publication | assignment-run-runresult admission door; Astra A03 | P01 | crash after declaration resumes same nextRunId; no link-count inference | open |
| Same-Run controller replacement is fenced | RunHandle §3; Astra A01 | P01 | distinct epoch/token; stale release/outcome refused | open |
| Shared prepared worker invocation is consumed exactly by local adapters | S2 shared confinement adapter contract; Confinement Authority spec | P02L/P02H | `authority-prepared-invocation.v1` digest is bound to cli supervisor receipt and Herdr worker-command receipt; raw provider/default command cannot claim enforced bwrap | open |
| Default cli-spawn survives coordinator crash | cli-spawn adapter; P02L local contract; F-b/F-f | P02L | sealed launch envelope plus protected supervisor binding/capture/receipt persist; distinct worker PGID; no duplicate spawn; only current controller settles | open |
| Legacy ad-hoc cli-spawn remains compatible | runner CTR009 v2 | P02L | timeout/maxBuffer/chunk/env/process-group parity | open |
| Local protected evidence cannot be worker-forged | P02L local contract; confinement evidence-store precedent | P02L | worker write grant limited to `worker-output/outbox`; protected envelope/binding/capture/receipt/controller files outside worker writable mounts; tamper/digest tests refuse | open |
| Local launch identity survives confinement request construction | Astra CL02; P02L local contract; confinement request builder | P02L | `assignmentLaunchContext` validates Run/command/control/baseline identity and is preserved into prepared plan/envelope; mismatch refuses before envelope publication | open |
| Recovered same-Run collection preserves evaluator baseline | assignment-runner current pre-launch evidence; P02L local contract | P02L | dirty-before, mutated-dirty-before and commit-before-crash recovery tests use persisted `run-evaluator-baseline.v1` | open |
| Local confinement cleanup survives coordinator death | Confinement Authority cleanup tests; P02L local contract | P02L | finalization descriptor carrying dispatch/resource/attestation identity is cleaned or retained idempotently after receipt/unknown park | open |
| Local timeout/maxBuffer receipt preserves existing answer timing | cliSpawnAdapter close/kill semantics; P02L local contract | P02L | timeout/idle/maxBuffer settle immediately even with escaped descendant; normal completion waits for close | open |
| Local live observation cannot compromise durable completion | dispatch callback-failure tests; P02L local contract | P02L | `onChunk` failure, disconnect and backpressure drop observation without blocking protected capture, timers or receipt publication | open |
| Local command collection resumes after outcome crash | Astra CL09; P02L local contract | P02L | receipt-backed and submission-refused crashes after command outcome publication and before Run settlement resume from stored outcome without rewriting outcome | open |
| Herdr worker command uses Confinement Authority prepared invocation | P02H launch reconciliation; confinement authority spec | P02H | Herdr `agent start` or equivalent runs exact prepared worker command plus env digest, including bwrap when required; fallback to provider-default command refuses required confinement | open |
| Conversation identity is not worker identity | RunHandle §3; Astra A02 | P02H | same conversation/new process parks without proven resource incarnation | open |
| Fresh launch and resumed pending are distinct | Assignment launch gate | P02L/P02H | fresh submits once; pending ambiguity never creates | open |
| Standalone recovery stays outside session authority | F6; static contract closure | P05 | `dispatch recover <runId>` works without coordination id and appends no session event | open |
| Recovery apply detects stale recommendation | Astra A05 | P05 | expected snapshot/control epoch/action key required and CAS-tested | open |
| Session recovery stays behind session authority | CP recovery contract; Astra A08 | P05S | C-f collect, current-driver check, no implicit close, X11 visible | open |
| Post-delivery repeat requires real effect proof | EF §5; Astra A07 | P03 | local-bwrap-v1 does not prove filtered network/effect delivery; positive repeat claim absent until adapter/provider proof | open |
| Exact retry destination fencing | Run amendment; review B01/R01 | P01 | late result for superseded Run is retained but never current | open |
| No TTL-only lock takeover | runtime-recovery-design §6; X01 | P01 | live holder past TTL held; dead holder reclaim; successor not deleted | open |
| Launch identity survives crash window | review B04; run-handle §4 | P02L/P02H | crash before locator, lookup by durable identity, no blind spawn | open |
| Gateway restart is not same incarnation | review Gate 2 | P02H | new agentSession yields mismatch/unknown and park | open |
| No duplicate Herdr resource | F-b/F-f | P02H | create/bind/locator crash matrix; spawn count remains one; missing deterministic name parks without absent-proven | open |
| Herdr transport resend semantics | X02/W03 | P00 then P02H | resend only while ready/unacked; no semantic duplicate after ack/working | baseline only |
| Partial capture is explicit | run-handle §5; X04 | P06 | exact manifest or explicit incomplete coverage after quiescence | open |
| Writable takeover has workspace authority | review B02 | P06 | missing issuer parks; two Assignments cannot mutate same workspace | disabled |
| Inherited edits are not falsely attributed | review B03; X05 | P06 | lineage evaluator separates inherited/current delta | disabled |
| Fallback preserves governance | EF §6; W06 | P03 | fallback candidate compiles only with scoped provenance and constraints | open |
| Unknown delivery/effect never blind-retries | EF §5; E-b/X02 | P03 | unknown branch reconciles or parks | open |
| Read-only repeat mode is explicit | Gate 3; EF §5 | P03 | allow, undeclared sink, provider-only three-branch test | open |
| Legal-next is a read evaluator | CP §2; W07 | P04 | pure deterministic evaluator reused by write doors | open |
| Recover does not auto-close | W04; runtime-recovery §7 | P05 | recover collect/observe path does not call close-after-steps | open |
| Fresh driver requires replacement door | W05/Gate 4 | P05/P07 | missing grant needs-input; authorized replacement is single-use | open |
| Terminal parent transfer policy is explicit | B01; CP §6; X08 | P07 | terminal parent returns transfer-unavailable; no post-terminal authority event | blocked by engine backlog |
| Transfer is crash/concurrency safe | CP §6; C-f/C-g | P07 | one child/grant, prepared/gated/committed replay | blocked by engine backlog |
| Schema-1 behavior unchanged | runtime-recovery §8; X10 | P08 | regression suite and old request fixtures remain green | open |
| Unsupported capability is typed | all adapter contracts | P08 | capability matrix maps unsupported to park/refuse/needs-input | open |

## Claim Rules

- `open` means design/implementation work remains; it is not a shipped claim.
- `disabled` means the capability may exist as a type but must not be advertised.
- `blocked by engine backlog` means planning may proceed but implementation must
  not merge until the named dependency is complete.
- A focused test passing without a reviewer and red-team report does not close a
  row; the code-panel handoff must contain all three proof sources.
