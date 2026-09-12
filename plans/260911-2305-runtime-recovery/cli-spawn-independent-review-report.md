NOT READY

# Independent Review - CLI Spawn Runtime Recovery Delta

Date: 2026-09-12. Scope: current P02L delta and its integration dependencies.
This is a design review, not a review of an implemented supervisor. No design,
source or test file was changed. The three amended boundaries are accepted:
Confinement Authority prepares the envelope; the supervisor produces evidence
only; the current controller owns command outcome and Run settlement. Separate
supervisor and worker process groups are also correct.

## Findings

References below are repository-relative paths and exact line numbers in the
reviewed checkout. `P02L` means
`plans/260911-2305-runtime-recovery/phase-designs/cli-spawn-reconciliation.md`;
`Catalog` means the adjacent `implementation-contract-catalog.md`.
Short source names resolve under `src/runner/dispatch/`; `confinement/*`
resolves under that same directory, and `drivers/bwrap.mjs` means
`src/runner/dispatch/confinement/drivers/bwrap.mjs`. `main-checkout-lock.mjs`
is under `src/runner/`. Short test names resolve under `test/runner/`.
`run-handle.md` is under `docs/architect/agent-coordination/architecture/`.

| ID | Severity | Claim/contract | Source evidence | Failure mode | Minimal correction |
|---|---|---|---|---|---|
| CL01 | HIGH | P02L:46-50, 77-82, 108-110: immutable envelope and supervisor receipt prove the invocation/outcome, with receipt under the Run directory. | `src/runner/dispatch/confinement/resources.mjs:173` maps the entire `context.runDir` to `run-output`; `drivers/bwrap.mjs:371` makes write grants writable mounts. `confinement/attestation-store.mjs:74` already rejects security-evidence storage overlapping any worker write grant. | A confined worker granted Run output can create or replace `adapter-receipts/<launchCommandId>.json`, its output and their digests. A digest binds bytes, not the supervisor as writer. A valid current controller can then collect forged evidence. The envelope's own storage/trust boundary is unspecified too. | Fix the physical protected-artifact layout and threat boundary. Put supervisor-owned proof and launch material outside worker write grants, reusing the existing host evidence-store isolation check; expose references/projections under the Run. Specify immutable publication and identity/digest binding. For explicitly unconfined execution, do not claim an OS-enforced anti-tamper guarantee that does not exist. No MAC is required where real filesystem/confinement isolation suffices. |
| CL02 | HIGH | P02L:29-34, 46-57: supervisor receives only an envelope path and cannot recompute environment, command or policy. | `confinement/authority.mjs:814` constructs `preparedInvocation` without cwd or limits; these are separate `adapterOpts` at :833. `transport.mjs:303`, :312 and :326 still resolve dispatch depth, environment interpolation and inherited environment inside the adapter. `confinement/request.mjs:217` explicitly rebuilds context and drops proposed launch identity fields. | Serializing today's prepared invocation does not specify cwd, timeout, idle timeout, maxBuffer or the actual worker environment. Passing only that file either changes execution or forces the supervisor to invent/re-resolve those inputs. The launch API also accepts a sealed envelope before producing pending, while the requested crash sequence places pending before envelope publication. | Define one versioned, executable envelope contract and one ordered producer algorithm, including required execution options, exactly-once depth accounting, identity and secret handling. Resolve execution inputs once on the existing preparation path; the supervisor validates and executes them. Name the structured context/API through `buildConfinementRequest`, and add its file to P02L's lease. Distinguish submission acknowledgment from completion of the existing adapter Promise. |
| CL03 | HIGH | P02L:60-66, 81-82 and 93-96: durable logs plus an exit-status/signal receipt preserve existing timeout/maxBuffer/chunk semantics and permit collection. | `transport.mjs:383` deliberately settles timeout/maxBuffer without waiting for exit/close; :401 and :412 produce different error classes/causes; :449 tees the overflow chunk but excludes it from returned capture; :506 waits for `close` on normal completion. `assignment-runner.mjs:959` overwrites `stdout.log` and `stderr.log`. | Exit/signal is insufficient to distinguish hard timeout, idle timeout, overflow, spawn failure and an ordinary signalled exit. Waiting for exit to make a receipt can hang behind an escaped descendant; writing at `exit` can truncate normal output. Unspecified log names/ownership can let the collector truncate the supervisor's append-only evidence. Live-output IPC disconnect/backpressure has no failure contract. | Specify a typed adapter-completion receipt, capture boundaries, terminal reason and publication order. Preserve normal `close` versus immediate kill-path completion; timeout completion is not proof of worker-tree death. Freeze/fsync the captured output before publishing its receipt and prevent the controller from overwriting canonical evidence logs. Define the optional live stream as non-authoritative and disconnect-safe. |
| CL04 | HIGH | P02L:96 and Catalog:222-225 permit a replacement controller to collect and settle the same Run from durable adapter evidence. | `assignment-runner.mjs:895-919` holds `dirtyBefore`, dirty-file snapshots, `gitBefore`, and their provenance only in memory. They are used by normalization at :1075-1113 and persisted only after execution at :1118. `test/runner/assignment-runresult.test.mjs:614`, :1100 and :1184 verify these facts affect verdicts. | After coordinator death, a receipt and output do not restore the evaluator's pre-launch facts. Sampling Git again loses a worker commit or an edit to a pre-existing dirty file; even a read-only review can be accepted incorrectly. This is same-Run normalization, not B03's inherited-edit attribution for a replacement Run. | Persist the minimal evaluator baseline before launch under the trusted runner owner, bind its digest to the Run, and make live/recovered collection use the same evaluator inputs. Missing/corrupt baseline must park or return an explicitly weaker unsupported result, never fabricate `pre-launch` provenance. No worker checkpoint or cumulative writable-takeover evaluator is needed for this fix. |
| CL05 | HIGH | P02L moves execution past coordinator death but names no owner for confinement finalization and temporary-resource cleanup. | `confinement/authority.mjs:735` prepares resources, :783 records a prepared attestation, :886 calls the process-local cleanup closure in `finally`, and :896 publishes completed attestation only after adapter return. `drivers/bwrap.mjs:362-368` creates owned temporary resources, potentially including copied credentials; :417 captures cleanup paths in a closure. Cleanup behavior is tested at `test/runner/dispatch-confinement-backend-p03.test.mjs:911` and :952. | Coordinator death loses the cleanup continuation and completed attestation. Conversely, treating `supervisor-started` as adapter completion can run the current `finally` while the worker still needs its private home. A receipt alone neither authorizes deletion nor reconstructs confinement finalization. | Keep Confinement Authority as lifecycle owner and persist an idempotently recoverable resource/finalization descriptor before submission. Specify who resumes that owner using the receipt, when resources may be removed, and what remains retained when worker-tree state is unknown. Mechanical cleanup may be delegated only with explicit owned resource references, never arbitrary paths. Preserve the live adapter Promise contract and legacy cleanup behavior. |
| CL06 | MEDIUM; capability gate | P02L:9-12, 43-44 cover Assignment-owned local Runs without stating a shared-cwd restriction; the new Run control lock is not the existing cwd occupancy lock. | `dispatch/cli.mjs:879-886` owns the cwd lock with a coordinator-local string identity and `releaseOnExit`; `main-checkout-lock.mjs:283-304` reclaims string holders on TTL alone. `cli.mjs:1040` releases that lock in the coordinator's `finally`. | A local worker can remain alive after its coordinator's exclusion ends, and another Assignment can enter the same cwd. This is not a duplicate of the same launch command, so per-Run fencing cannot stop it. The issue already exists in the old path; adding a supervisor does not close it. | Explicitly gate shared-cwd/mutating recovery unless workspace occupancy outlives the controller and is released only with adequate worker/quiescence proof. A genuinely isolated workspace profile can proceed without implementing P06. Do not claim the current cwd mutex is the missing workspace authority. This does not block isolated/read-only observation and collection. |
| CL07 | MEDIUM; capability gate | P02L:64-66, 94, 106-107 cover timer signals and mismatch refusal, but do not define recovered operator cancellation or the exact local capability matrix. | `run-handle.md:99`, :106, :115 and :135 require typed terminate support or refusal before effect; `transport.mjs:286` only has a parent-held `ChildProcess` group kill helper. | A new controller cannot safely turn a historical PID/PGID plus a separate inspection into the old helper: the original child handle is gone, and a later numeric group may belong to another incarnation. A dead leader also does not prove all descendants are dead. | Name the initial local supported operations. The simplest safe profile supports supervisor-owned timers and returns `capability-unsupported` for recovered destructive control until its effect-target proof/route is designed. If cancellation is enabled, specify the target, incarnation check at the effect boundary, pending receipt and coverage. Never equate signal submission with `stopped`. |
| CL08 | LOW | The top-level handoff/status projections still contain older completion claims. | `plan.md:53` says independent delta review passed; :329 says nine cells. `detailed-design.md:3` says design approved; :191 says resume launch intent can create once. The current manifest has eleven cells and a blocked delta policy; Catalog:214 and P02L:37-39 forbid ambiguous-pending resubmit. | A fresh coordinator receives inconsistent readiness and launch descriptions despite a correct higher-priority catalog. | Refresh these projections after the findings are resolved. Preserve the separate human authorization hold; do not describe review completion as permission to dispatch. |

CL01-CL05 block the present P02L implementation handoff. They also block P05's
claim that it can collect the default local adapter after interruption. They
do not invalidate P01/P04 or reopen the settled product decisions. CL06/CL07
gate particular capabilities, not all local recovery.

## A. Is A Supervisor Necessary?

Yes, for the chosen promise: retain execution evidence and timer ownership
after coordinator death while using the default local adapter. The existing
worker is detached (`transport.mjs:321-326`), so coordinator death is not proof
of worker death. The coordinator owns the stdout/stderr buffers, byte counters,
completion flags, hard/idle timers, callbacks and child-event listeners
(`transport.mjs:331-350`). Its death loses those owners even if the worker
survives. Depending on what the worker writes, a broken pipe may subsequently
kill that worker too; detachment is not a survival guarantee.

No current primitive in this call path supplies an equivalent durable
child-exit/output/timer owner. Redirecting output to files alone does not
persist exit reason, preserve idle/maxBuffer behavior or resolve the
spawn-before-binding window. Using Herdr would change the default production
dependency and does not solve the local adapter contract. A small per-launch
Node process is therefore justified. A daemon or registry is not justified.

The remaining findings concern the supervisor's boundaries, not its existence.

## B. Hexagon And SRP

The amended authority split is good:

- Application policy chooses an allowed action and acquires the Run token.
- Confinement Authority resolves/prepares execution and owns confinement facts.
- The local adapter supervises a concrete OS process and produces evidence.
- The current controller records command outcome and invokes Run settlement.
- Session linking remains in CoordinationSession, not in the supervisor.

Do not give the supervisor a Run store, clear control token, session writer,
retry chooser, policy resolver or evaluator. It needs only validated execution
material and bounded evidence-writing capabilities. CL04 belongs in the runner;
CL05 belongs in confinement lifecycle, not in supervisor policy.

No additional port is needed merely to wrap envelope hashing or receipt
validation. Those can be pure helpers of existing owners. `LaunchRegistry` in
`detailed-design.md:59` should be understood as an adapter-neutral lookup
contract, not a requirement to build a new registry service. The current
catalog explicitly makes the fgOS web gateway unnecessary.

## C. State And Write Ownership

The logical ownership is mostly settled. Physical ownership and the evidence
schemas are not. In particular, controller-only settlement does not make every
file it reads trustworthy: CL01 remains possible without stealing its token.

The receipt must bind at least its schema, exact Run/launch command, envelope
digest, original execution incarnation and captured-output boundary. The
controller validates that original execution lineage and its own *current*
control generation separately. Requiring the receipt's old launch epoch to
equal the replacement controller's current epoch would make recovery
impossible; accepting an unrelated old receipt would be unsafe.

Historical completion proof must also be distinguished from current-process
control proof. A completed receipt can remain meaningful after the recorded
process has exited or the host has rebooted. That does not authorize signalling
a process now occupying its old PID.

## D. Process Topology And Termination

Separate groups fix the previous self-kill problem. The intended topology is:

```text
coordinator C                      controller authority; own existing group
  |
  +-- supervisor S                detached; SID=S, PGID=S
        |                         owns child streams, timers and adapter receipt
        |
        +-- worker/wrapper W      detached; SID=W, PGID=W; W != S
              |
              +-- descendant D   normally PGID=W
              |
              +-- escaped E      may create a different SID/PGID

C dies: S and W are not killed merely by parent death.
timer event in S: signal -W, never -S and never -C.
receipt publication: S remains alive to finish its evidence write.
```

The exact worker may be a Confinement Authority-prepared wrapper such as bwrap;
do not replace its argv with the inner executor command. The supervisor itself
is trusted adapter infrastructure, outside the worker sandbox. An inherited
live-output connection must not make S exit when C disappears.

Existing hard/idle/overflow handling sends SIGTERM. It does not escalate to
SIGKILL, and a successful `kill()` is not termination proof. Do not add an
escalation silently as parity work. If later enabled, its timer belongs to the
same adapter execution owner, and needs an explicit grace/force contract.

An escaped descendant is outside ordinary PGID coverage. The first profile
may report partial/unknown tree coverage and park resource reuse; it must not
pretend it enumerated or stopped every descendant. CL07 explains why fresh
controller cancellation cannot be inferred from the existing helper.

Supervisor normal completion can publish a receipt. Supervisor crash/SIGKILL
without a receipt cannot manufacture the child's exit code. Host reboot kills
the old host process tree, but does not manufacture its completion result.
Unknown output/result remains unknown. PID/start-time/boot mismatch refuses
live control; historical receipt validation is a separate question.

## E. Confinement Ordering And Integrity

Pre-submission publication by Confinement Authority is the right ordering, but
the current amendment stops before the executable contract. The design needs
one explicit sequence from pending through prepared resources and envelope to
supervisor submission, including pre-spawn refusal and completion/finalization.

The source separates invocation from cwd/limits and resolves environment late.
A reviewer-only call to `buildConfinementRequest` with `runId`,
`launchCommandId`, `controlEpoch` and `controlTokenDigest` in context confirmed
that all four are dropped by the builder. `${HOME}` in invocation env also
remains unresolved there. This supports CL02; it is not a failing production
test, since the new fields do not exist in production yet.

The smallest complete contract should lock these facts, not prescribe a new
framework:

1. Exact schema and protected path for launch material; Run/command/control
   lineage; the immutable confinement plan/attestation reference.
2. Fully prepared command/argv, cwd, stdin/shell behavior, actual worker env
   identity, depth and limits. Decide where sensitive values live. Do not dump
   unrelated controller environment or the clear control token to public Run
   artifacts. A private execution capsule or inherited private delivery with a
   bound digest can avoid a public secret-bearing JSON file.
3. Authority-owned immutable publication using the existing documented
   write/fsync/non-overwriting-publication/directory-fsync rules. Verify the
   object before spawn and execute that same validated object.
4. Isolation of the envelope, supervisor receipt and identity proof from
   worker write grants; public Run files contain only appropriate references.
5. Defined outcomes for invalid material, storage failure and ambiguous
   submission, plus recoverable confinement finalization/cleanup references.

Filesystem protection is sufficient against a confined worker only when the
actual mounts exclude those writes. Mode 0600 under the same OS user does not
by itself isolate an unconfined worker. An unkeyed digest, or a MAC key stored
where that worker can read it, does not create the missing boundary. Reuse the
existing evidence-store isolation machinery before considering cryptography.

## F. Crash Semantics

The no-resubmit rule correctly prevents a second launch in the uncertain
windows. Some windows therefore park even when no worker was actually created.
That is an intentional availability tradeoff, not a reason to demand a daemon
or relax the rule. The full matrix below distinguishes settled design rules
from the missing CL01-CL05 details.

## G. Behavioral Parity

Legacy ad-hoc execution can remain byte-compatible because it keeps the
current path. Assignment-owned local execution needs **semantic** parity across
the new process boundary: decoded output/capture/error semantics and per-stream
order can be preserved, but OS chunk partitioning, cross-stream timing and
wall-clock duration cannot honestly be promised byte-for-byte.

The detailed parity matrix below names the existing behavior. Tests that pass
against the unchanged adapter are baseline evidence, not proof of a future
supervisor. Normal `close`, prompt timeout completion and orphaned live-output
connection tests must be added for the new path.

## H. Plan And Cell Feasibility

The manifest parses with **11 cells**. A mechanical dependency/wave and combined
source/test lease check found no unknown dependency, backward/same-wave
dependency, or same-wave exact/prefix-glob collision.

P02L now correctly leases Confinement Authority. It still needs the structured
request boundary at `src/runner/dispatch/confinement/request.mjs` for the
proposed launch context. Fixes to protected storage/resource finalization may
also need the existing attestation-store, resources, driver or cleanup modules;
choose the ownership first, then add the exact paths. Do not duplicate those
owners inside the supervisor merely to stay within the current lease. Add
focused confinement and Assignment normalization coverage, including the
existing `assignment-runresult.test.mjs` regression surface.

P03/P05 correctly depend on P02L. P05S inherits that dependency through P05.
P06 inherits P04 through P05, so its missing direct P04 edge is not a graph bug.
P02H may follow P02L because both edit transport/visibility and it consumes the
adapter-neutral lifecycle. It must not import or execute the local supervisor.
P03/P05 do not logically require Herdr completion: wave numbering should not
silently turn the optional W3 extension into a core availability gate.

P08 correctly excludes gated P06/P07 from conservative core completion. Its
exclusion of P02H is valid only if it advertises no unproved Herdr capability.
The new files, protected storage, Linux process-identity facilities and durable
publication assumptions require setup/doctor coverage before enablement.
P08 already owns `src/setup/checks.mjs`, but its exact lease does not list
`CHANGELOG.md` or any needed setup/config-merge/doctor-test paths. Add the
concrete touched paths after the local profile is finalized. Do not introduce
a new configuration knob merely to satisfy the checklist.

## Artifact Ownership Table

| Artifact | Single writer | Reader | Atomicity | Authority or evidence | Missing/corrupt recovery |
|---|---|---|---|---|---|
| Assignment Run admission record | Assignment admission door | Run/controller/session linking | Complete staging directory, file/directory fsync, atomic final rename under Assignment generation | Authority | Never infer a Run from an empty directory; resume exact committed admission or refuse |
| Run control generation and token-specific release | Run control repository acting for generation winner | Controllers and pure observers | Exclusive immutable generation/release publication; `control.json` rebuildable | Authority | Unknown holder is not dead; no TTL-only takeover; corrupt authority refuses mutation |
| `commands/<launchCommandId>.json` pending/outcome | Current controller through Run write door | Reconcile/planner/controller | Token/epoch-guarded publication/replacement; concrete launch payload/outcome schema still required | Authority | Pending is not permission to resubmit; absent outcome means reconcile/park |
| Immutable confinement launch envelope | Confinement Authority | Supervisor; collecting controller | Immutable publication required; exact path, payload and verification still missing, CL01/CL02 | Authorized execution material and provenance | Invalid/missing material refuses worker spawn; resumed ambiguous pending parks |
| Local resource binding/incarnation | Supervisor for its execution facts; visibility refresh ownership must be explicit | Adapter inspect and controller | Atomic supervisor identity followed by bound worker identity; current `writeVisibility` is diagnostic atomic rename, not fsynced authority | Evidence | Missing/partial/corrupt binding is unknown; never second spawn |
| Append-only stdout/stderr | Supervisor for canonical capture; collector must not retain current truncating writes | Live stream and collecting controller | Capture cutoff plus log flush/fsync before receipt; not yet specified, CL03 | Evidence | Prefix may remain diagnostic; no valid receipt means no invented completed output |
| Immutable `adapter-receipts/<launchCommandId>.json` | Supervisor only | Current controller | Protected immutable publication after capture; schema/location incomplete, CL01/CL03 | Evidence, not settlement authority | Missing/corrupt/wrong lineage parks; supervisor exit alone cannot replace it |
| Pre-launch evaluator baseline | Assignment runner | Same live/recovered normalizer | Must be persisted/bound before submission; missing from delta, CL04 | Trusted evaluator input | Never re-sample and label it pre-launch; park unsupported normalization |
| Confinement finalization and resource cleanup state | Confinement Authority lifecycle owner | Recovery and doctor | Idempotent facts bound to owned resource markers; continuation missing, CL05 | Authority for confinement facts/resource lifecycle | Retain resources while liveness is unknown; no arbitrary deletion |
| Run result/settlement | Run settlement door under current token | Session linker/acceptance evaluator/observers | Exact Run/payload/incarnation checks and atomic commit | Authority | Valid uncollected evidence can be normalized; never let adapter/worker settle directly |

`visibility.json` is currently best-effort evidence: `visibility-session.mjs:88`
uses temporary write plus rename, and :116 performs read/merge/write. Reuse is
reasonable, but the new implementation must not assume those operations
already provide fsync durability or concurrent single-writer protection.

## Full Crash Matrix

In every row, collection/settlement means the *current* controller and existing
write door. A supervisor never settles. `unknown` is an adapter fact; `park` is
the application action derived from it.

| # | Crash point | Durable facts | Actor permitted to proceed | Typed outcome/action | Duplicate prevention and audit result |
|---|---|---|---|---|---|
| 1 | Before pending commit | Admitted Run, possibly preparation staging; no committed launch | Winning current controller | Fresh transition and one launch may proceed | Admission/pending gate wins once; baseline rule sound |
| 2 | After pending, before envelope publication | Pending launch, perhaps allocated confinement resources | Current controller may inspect/finalize proven refusal; no resumed submit | `unknown` -> park after ambiguous crash | No pending resubmit; ordering/resource disposition needs CL02/CL05 |
| 3 | After envelope, before supervisor spawn | Pending plus immutable envelope | Current controller reconciles; only original fresh submission continuation could submit | Resumed caller: `unknown` -> park | Envelope existence is not permission to create another supervisor |
| 4 | After supervisor spawn, before self-binding | Pending/envelope; supervisor may exist without locator | Original live supervisor can publish; controller can inspect/observe | Initially `unknown`/waiting; later reconcile or park | Missing binding never authorizes duplicate; self-publication durability needs CL01/CL03 |
| 5 | After supervisor binding, before worker spawn | Matching supervisor identity, no worker binding | That same live supervisor completes its one launch path | Bound supervisor/launch pending; reconcile, otherwise park | Do not treat supervisor presence as worker presence; no replacement supervisor |
| 6 | After worker spawn, before worker binding | Supervisor bound; worker may already execute | Original supervisor may publish worker binding/receipt | Live supervisor pending; dead supervisor gives unknown/park | Never infer no worker from missing worker PID; no second worker |
| 7 | Coordinator dies with worker running | Pending, envelope, binding, output prefix | Supervisor continues timers/logs; successor acquires only after holder-death proof | Observe/reconcile; later collect | Same execution retained; successful collection still needs CL01-CL05 |
| 8 | Timeout/maxBuffer with coordinator dead | Binding and captured prefix; timer owner survives | Supervisor signals worker PGID and completes adapter evidence | Typed timeout/overflow, worker-tree status independent | No launch; distinguish answer completion from death. Receipt/capture contract missing, CL03 |
| 9 | Worker exits before receipt publication | Binding and some/all output; no committed receipt | Live supervisor drains normal `close`, flushes and publishes; otherwise controller parks | Pending/unknown, not fabricated success | Dead supervisor cannot recover an exit code merely from a missing PID; CL03 |
| 10 | Receipt durable before command collection | Immutable validated receipt plus captured output and baseline | Current controller validates and normalizes exact Run | Collect/settle or typed refusal | Single guarded command outcome and idempotent settlement; CL01/CL03/CL04 must close |
| 11 | Old controller runs after successor acquisition | New authoritative control generation; old receipt may still be valid evidence | Successor/current token only | Old writer: stale/refused; new writer may collect old execution evidence | Old launch epoch is lineage, not current ownership. No stale mutation or fresh launch |
| 12 | Supervisor dies while worker survives | Last binding/output prefix; perhaps no receipt | Current controller may inspect matching worker; no replacement supervisor | Worker live/unknown -> observe or park | Supervisor death never proves worker-tree death; cleanup and cwd reuse remain gated |
| 13 | Host reboot | Only successfully durable artifacts; old boot process identities | New controller after exact old-host/boot death assessment | Collect valid historical receipt if normalization facts survive; otherwise unknown/park | No numeric-PID reattachment or fabricated output. New Run/retry requires its own admission/effect policy |
| 14 | Two concurrent recover callers | Same immutable execution evidence, competing control acquisition | One generation winner | Winner reconcile/collect; loser held/stale/already-applied | Existing P01 generation and guarded command/settlement prevent two authoritative writes |
| 15 | Same Run/command but different PID incarnation | Binding/receipt lineage for original execution, mismatching current OS process | Observer may report mismatch; no destructive actor for the new process | `incarnation-mismatch`/unknown -> park control | No absent-proven, no relaunch and no kill of the new process. Historical receipt must be evaluated separately |

For rows 9 and 13, a fully written but unpublished temporary receipt is not
automatically authoritative. Specify whether a surviving original supervisor
can finish publication; a new controller must not promote arbitrary temporary
files without the same validated evidence contract. For disk-full/fsync failure,
the safe outcome is failed evidence publication/unknown, not a success receipt
whose output was never made durable.

## Behavioral Parity Matrix

| Behavior | Current source/test evidence | Required new-profile acceptance | Kind |
|---|---|---|---|
| `shell:false`, argv and cwd | `transport.mjs:321-326`; authority separates cwd at :834 | Execute the prepared wrapper/argv/cwd exactly; no shell command concatenation | Semantic execution parity; legacy unchanged |
| Environment interpolation/inheritance | `transport.mjs:134-142`, :312, :326 | Freeze the same effective environment once; do not use a different supervisor startup environment to re-resolve it | Semantic parity; CL02 |
| Dispatch depth | `transport.mjs:303-308`, :326; `dispatch.test.mjs:3119`, :3133 | One worker dispatch increments once; supervisor hop is not another agent dispatch; cap refuses before worker spawn | Exact policy parity |
| Stdin ignored | `transport.mjs:315-324` | A worker checking stdin sees ignored/closed stdin, not an open unwritten pipe | Semantic parity |
| UTF-8 stdout/stderr | `transport.mjs:328-334` | Per-stream decoded output matches, including split multibyte sequences and trailing bytes | Byte content parity for equivalent input; no claim of identical OS chunks |
| Live `onChunk` | `transport.mjs:449`, :464; `dispatch.test.mjs:3185`, :3205 | Stream tags/order retained; callback exceptions swallowed; disconnected/backpressured coordinator cannot kill/block the evidence writer | Semantic parity plus intentional crash-survival behavior |
| Overflow chunk | `transport.mjs:449-475`; `dispatch.test.mjs:3220` | Offer overflow chunk to live observer before accounting, but preserve returned capture's pre-overflow cutoff | Semantic parity; CL03 |
| Combined maxBuffer | `transport.mjs:452-475`; `dispatch.test.mjs:3019` | Combined decoded-byte accounting, strict `>` threshold, stdout+stderr, exact accepted capture boundaries | Semantic parity |
| Hard timeout | `transport.mjs:422-428`; `dispatch.test.mjs:2954`, :2973 | Timer owned by supervisor; clock origin/limit preserved and not reset by replacement controller | Semantic parity; define supervisor startup overhead |
| Idle timeout | `transport.mjs:437-447`; `dispatch.test.mjs:3067`, :3088, :3105 | Absent/zero disabled; every stdout/stderr chunk resets it; coordinator death does not reset it | Exact policy parity |
| Normal completion | `transport.mjs:488-509` | Wait for normal `close`, including final buffered output, then publish the durable receipt | Semantic parity; add concurrent heavy-output regression |
| Kill-path completion with escaped pipe holder | `transport.mjs:357-400` | Timeout/overflow completion does not wait for descendant-held pipes; supervisor does not kill itself | Semantic parity; add explicit escaped-descendant test |
| Errors/result shape | `transport.mjs:401-419`, :478-509; `authority.mjs:852-918` | Preserve `worker-timeout`, `worker-spawn-fail`, cause, captured output, tier/model, normal nonzero status and confinement result wrapper | Semantic parity; receipt needs more than exit/signal |
| Process group | `transport.mjs:286-296`; `dispatch.test.mjs:3041` | W and S have distinct groups; ordinary descendants receive worker-group SIGTERM; escaped descendants never falsely declared stopped | Intentional topology change, retained termination semantics |
| Cleanup | `authority.mjs:886-910`; backend tests :911, :952 | Live completion retains current behavior; crash path has resumable owner and explicit retained/unknown state | Intentional recovery extension; CL05 |
| Logs and committed tree | `assignment-runner.mjs:959-960`; `cli.mjs:923-928` | No committed-tree logs; one canonical writer; protected proof outside worker grants; collector must not truncate evidence | Intentional durable-evidence extension; CL01/CL03 |
| Confinement reporting | `authority.mjs:783-789`, :896-918 | Recovery preserves prepared/final distinction and does not claim enforced completion from an unvalidated receipt | Intentional recovery extension; CL01/CL05 |

The topology, durable artifacts, recovery outcomes and confinement finalization
are intentional changes for Assignment-owned Runs. Name them in the plan,
tests and changelog. Do not describe the entire new profile as byte-for-byte
identical to the in-process adapter mechanics.

## Simplicity Deletion Tests

| Proposed deletion/change | Guarantee lost or retained | Judgment |
|---|---|---|
| Remove supervisor | No surviving owner for stream capture, timer state and exit/error receipt after coordinator death | Keep a small per-launch process |
| Remove pre-launch envelope | Detached execution cannot prove the authority-prepared invocation/options without a new resolve/policy path | Keep; complete and protect the contract, not another policy service |
| Put S and W in one PGID | Worker-group timeout can kill the only evidence writer before publication | Keep separate groups |
| Let S write command outcome directly | Old adapter process could authoritatively mutate a Run after controller replacement | Reject; immutable receipt plus current-controller collect is simpler authority |
| Remove process start time | PID reuse can identify another execution as this Run | Keep process-incarnation proof |
| Remove boot identity | A PID/start-time tuple can be reused across boots; dead old controller versus current host is ambiguous | Keep host/boot identity |
| Resubmit when pending lacks binding | Worker may already exist in the create/bind crash window | Reject; conservative park is necessary without a real atomic launch primitive |
| Merge P02L and P02H | No safety guarantee is lost merely by merging a work cell, but adapter-specific proofs/leases become less clear | Separate profile designs remain useful; share neutral identity/outcome helpers, not supervisor mechanics |
| Add a generic recovery daemon/registry | Adds another lifetime, deployment dependency and authority question without closing a missing requirement | Reject; no current proof requires it |

These tests support the architectural shape. Experienced simplicity requires
finishing the small number of cross-process contracts, not omitting their
irreducible state and not building a general framework around them.

## Phase Readiness

| Cell | Design readiness from this delta audit | Implementation/advertisement gate |
|---|---|---|
| P00 | Ready for read-only baseline work | Record the two observed production-call-site failures; do not claim an all-green baseline |
| P01 | Not invalidated by this delta | Existing independent approval/dependencies and human authorization still apply |
| P04 | Not invalidated by this delta | Same; pure evaluator work remains independent |
| P02L | NOT READY | Close CL01-CL05; publish exact schemas/ordering, scope CL06/CL07, correct leases, then independent recheck |
| P02H | Observe/park design not invalidated | Depends on accepted adapter-neutral P02L contract/integration; replacement capability remains gated |
| P03 | Pre-delivery-only design not invalidated | Waits for P02L integration; post-delivery repeat still requires actual effect/confinement proof |
| P05 | Planner/door shape not invalidated; local receipt collection incomplete | P02L receipt plus baseline/finalization contracts must exist before default-adapter collection is implemented |
| P05S | Not invalidated | Waits for P05 and its own dependency/authorization proofs |
| P06 | Capability-gated | B02/B03, workspace issuer/quiescence and inherited-edit X05 remain required; CL04 is not a reason to broaden B03 back to all recovery |
| P07 | Capability-gated | Engine backlog and its own proofs remain required; conservative terminal-parent refusal is not reopened here |
| P08 | Cannot close core yet | P02L plus dependent acceptance, explicit unsupported matrix, setup/doctor and real baseline/full-suite proof |

No code-panel handoff or implementation permission is inferred from this report.
Human hold and technical readiness are separate gates.

## Files Requiring Design Corrections

| File | Section/change |
|---|---|
| `phase-designs/cli-spawn-reconciliation.md` | Assignment-Owned Launch Contract: concrete envelope/receipt/options and exact ordering. Supervisor Boundary/Durable Evidence: protected artifact ownership, log cutoff/publication/live stream. Add evaluator baseline and confinement finalization handoff. Expand crash and capability/termination acceptance. |
| `implementation-contract-catalog.md` | Adapter Recovery Profiles: normative versioned local envelope/receipt/baseline bindings, protected paths and typed results. Link shared publication primitives rather than restating weaker atomicity. Clarify original launch lineage versus current collection token. |
| `detailed-design.md` | S2, common data model and crash matrix: reflect the completed contracts and profile restrictions; remove Herdr-only/resubmit remnants and stale approved status. |
| `cli-spawn-impact-correction.md` | Impacted source/ownership: include request builder, evidence-store/confinement resource lifecycle, evaluator baseline and cwd occupancy scope. |
| `code-panel-cells.json` | P02L exact source/test leases for the chosen existing owners; P08 concrete changelog/doctor/setup paths. Keep current blocked status until re-review passes. |
| `plan.md` and `code-panel-requests.md` | Point to the exact contracts; identify intentional behavior changes and local capability restrictions. Refresh status/count; clarify optional P02H branch does not unnecessarily block core cells. |
| `requirements-traceability.md` | Add protected-evidence forgery refusal, recovered same-Run normalization parity, confinement cleanup/finalization and live-output disconnect proofs. Do not mark them satisfied by legacy tests. |
| `phase-designs/closeout-and-capability-matrix.md` | State actual local inspection/collection/termination/shared-cwd capabilities, prerequisites and typed unsupported outcomes. |
| `design-audit-final.md` | Incorporate this scoped verdict only after checking findings; do not preserve an older approval label for P02L. |

## Verification Performed

Source and tests were read directly; no GitNexus tool was exposed in the active
tool inventory. The existing code, not earlier review conclusions, supplied
the implementation evidence above. No service, gateway or code panel was run.

Executed against unchanged source:

```text
node --test --test-reporter=dot --test-name-pattern='spawnWorker|cliSpawnAdapter' test/runner/dispatch.test.mjs
  exit 0

node --test --test-reporter=spec test/runner/dispatch-confinement-authority.test.mjs test/runner/dispatch-production-call-sites.test.mjs test/runner/dispatch-visibility-session.test.mjs
  61 tests: 59 pass, 2 fail

node --test --test-reporter=spec --test-name-pattern='Cleanup:|R5: writeOwnershipMarker|executeAssignment captures gitBefore pre-launch|mutatedDirtyBeforeFiles' test/runner/dispatch-confinement-backend-p03.test.mjs test/runner/assignment-runresult.test.mjs
  6 tests: 6 pass
```

The two existing failures are
`dispatch-production-call-sites.test.mjs:427` and :526: expected attestation
outcome `unknown`, actual `unconfined`, asserted at :440 and :556. They are
baseline failures observed before any implementation; this review did not
diagnose their full cause or silently amend fixtures. They do not prove a
supervisor defect. The full `npm test` suite was not run for this design-only
audit. P02L's new crash tests do not exist yet and cannot be claimed passed.

The manifest check verified 11 cells and no dependency/wave/lease errors as
described in section H. Existing dirty repository files were left untouched.

```text
Status: DONE_WITH_CONCERNS
Implementation gate: CLOSED
Decision requests for owner: zero new product decisions; close the scoped engineering contracts and re-review P02L.
```
