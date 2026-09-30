# S2 Shared Confinement Adapter Contract

**Status:** DESIGN READY; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Owner:** Agent Confinement Authority plus adapter profile owners  
**Adapters:** Assignment-owned `cli-spawn`, Assignment-owned `herdr-spawn`  
**Backend:** current `local-bwrap-v1`

## Purpose

This contract is the shared seam between Confinement Authority and the adapter
profiles in S2. It prevents the same mistake in two forms:

- `cli-spawn` must not launch a raw command after Authority prepared a bwrap
  command.
- `herdr-spawn` must not ask Herdr to launch a provider default after Authority
  prepared a bwrap command.

The shared rule is:

```text
Authority prepares exactly one worker invocation.
The adapter executes exactly that worker invocation.
The adapter may add transport mechanics around it, but may not re-resolve it.
```

## Authority Prepared Invocation V1

Authority publishes one immutable prepared invocation record before any adapter
is allowed to create a worker resource:

```json
{
  "contract": "authority-prepared-invocation.v1",
  "dispatchId": "<confinement-dispatch-id>",
  "adapter": "cli-spawn|herdr-spawn",
  "run": {
    "runId": "<runId>",
    "assignmentId": "<assignmentId>",
    "attempt": 1,
    "launchCommandId": "<id>",
    "controlEpoch": 3,
    "controlTokenDigest": "sha256:<hex>",
    "dispatchPlanDigest": "sha256:<hex>",
    "evaluatorBaselineDigest": "sha256:<hex>"
  },
  "requirement": {
    "mode": "required|preferred|unconfined",
    "policyId": "<policy-id|null>",
    "policyDigest": "sha256:<hex|null>"
  },
  "backend": {
    "id": "bwrap",
    "type": "bwrap",
    "version": "local-bwrap-v1",
    "configDigest": "sha256:<hex>"
  },
  "workerInvocation": {
    "command": "<prepared executable>",
    "args": ["<prepared arg>"],
    "cwd": "<absolute cwd>",
    "env": { "KEY": "authoritative value" },
    "envDigest": "sha256:<canonical-env>",
    "workerCommandDigest": "sha256:<canonical-command-and-ordered-args>",
    "stdin": "ignore|adapter-managed",
    "encoding": "utf8",
    "timeoutMs": 900000,
    "idleTimeoutMs": null,
    "maxBuffer": 10485760
  },
  "resourceBindings": [
    {
      "resource": "run-output|private-home|executor-credentials|workspace|workspace-git-metadata",
      "access": "read|write|read-write",
      "hostTargetDigest": "sha256:<redacted-path-record>",
      "executionTarget": "<path-inside-worker>",
      "ownershipMarkerDigest": "sha256:<hex|null>"
    }
  ],
  "proof": {
    "confinementPlanDigest": "sha256:<hex>",
    "preparedAttestationDigest": "sha256:<hex>",
    "probeFingerprintDigest": "sha256:<hex|null>"
  },
  "publishedAt": "<ISO-8601>",
  "digest": "sha256:<canonical-json-without-digest>"
}
```

Object keys use the repository's canonical sorted-JSON encoding; argument order
remains significant. `workerCommandDigest` covers only `command` and ordered
`args`. `preparedInvocationDigest` covers adapter identity, invocation including
`cwd` and Authority-supplied environment, requirement, backend and plan.

The record does not store clear control tokens, credential values, raw secret
env values in public projections, or unredacted host paths. If an env value is
required for the worker and is secret-bearing, the durable artifact stores a
redacted value plus digest while the adapter receives the clear prepared env in
memory. A future secret handoff may improve this; S2 may also refuse when a
durable env digest cannot be computed safely. The adapter receives the prepared
invocation object in memory and the record path/digest for proof.

`workerInvocation.command,args,cwd,env,stdin,encoding,timeoutMs,idleTimeoutMs`
and `maxBuffer` are execution inputs. The adapter must not recompute them from
executor config, model, prompt template or process environment after this record
exists. It may only wrap them in profile-specific transport mechanics that prove
the same worker invocation reaches the worker process.

## Adapter Metadata Gate

The adapter registry must expose metadata for Assignment-owned recovery
profiles:

```js
{
  execute,
  locus: "local-process",
  preparedInvocationContract: "exact-v1",
  receiptContract: "confinement-adapter-receipt.v1"
}
```

Authority admits required `local-bwrap-v1` only when the selected adapter
declares `preparedInvocationContract: "exact-v1"`. This replaces the current
hardcoded trust of only `cli-spawn`. Metadata is the preflight gate; the adapter
receipt is the post-launch proof. An adapter without this metadata receives
`confinement-adapter-unsupported` before prepare/spawn for required bwrap.

## Producer Ordering

```text
controller:
  acquire current Run control epoch/token
  write evaluator baseline when the adapter profile requires it
  commit command not-requested -> pending with preparedInvocationDigest null
  build assignmentLaunchContext from Run, command, control epoch and baseline
  call Confinement Authority with assignmentLaunchContext

Confinement Authority:
  validate request, policy, resource needs and backend support
  resolve resources and verify attestation-store isolation
  run required local-bwrap-v1 probes when needed
  prepare worker invocation and resource bindings
  persist prepared attestation
  publish authority-prepared-invocation.v1 immutably
  publish recoverable finalization descriptor for owned resources

controller:
  guarded-update pending command with preparedInvocationDigest
  call adapter profile with prepared invocation and proof refs
```

A crash before the guarded digest update leaves no adapter-owned worker resource.
A later current controller may finish Authority preparation once only if the
command is still pending with null prepared digest and no adapter binding. A
crash after the digest update but before adapter submit reconciles by the adapter
profile's launch identity; it does not prepare a different invocation.

## Adapter Consumption Rules

Each adapter receipt must bind these facts:

- `preparedInvocationDigest` from Authority;
- the adapter-specific start request digest;
- the adapter-specific worker identity or resource incarnation when available;
- the outbox/capture/result evidence used for Run settlement;
- the terminal status vocabulary of that adapter profile.

A receipt that does not bind `preparedInvocationDigest` cannot settle an
Assignment-owned Run. A stale controller may read it but cannot publish command
outcome.

The adapter may fail before worker creation. That is a structured
`submission-refused` command outcome, not a worker receipt. It must include a
stable reason, bounded failure detail and digest. Recovery resumes failed
settlement from that stored outcome without requiring worker binding.

| Condition | Result |
|---|---|
| launch context mismatches current Run/command | `confinement-launch-context-invalid`, zero spawn |
| adapter lacks `exact-v1` | `confinement-adapter-unsupported`, zero spawn |
| backend/control/grant/probe unsupported | existing `confinement-*` refusal, zero spawn |
| protected store overlaps writable grant | `confinement-grant-invalid`, zero spawn |
| prepared artifact publication fails | `confinement-publication-failed`, zero spawn |
| adapter cannot apply exact command | `confinement-adapter-unsupported`, zero worker launch |
| receipt digest differs from prepared artifact | `confinement-plan-mismatch`; if already launched, execution failed, not retroactive refusal |
| receipt or process identity unavailable after launch | attestation `unknown`; Run parks |
| explicit unconfined execution | audited `unconfined`; no bwrap enforcement claim |

`enforced` requires satisfied policy coverage, current probes, matching prepared
claims, a verified adapter receipt and matching protected evidence. Adapter
success code alone is insufficient.

## `cli-spawn` Mapping

`cli-spawn` consumes `workerInvocation` directly:

```text
spawn(workerInvocation.command, workerInvocation.args, {
  cwd: workerInvocation.cwd,
  env: workerInvocation.env,
  shell: false,
  stdio: ['ignore', 'pipe', 'pipe']
})
```

Assignment-owned `cli-spawn` adds the local supervisor from
[cli-spawn-local-contract.md](cli-spawn-local-contract.md). The supervisor owns
crash-surviving timers, protected stdout/stderr capture, worker PGID signalling
and immutable adapter receipt. Confinement Authority remains owner of prepared
attestation and resource finalization. The controller alone records command
outcome and Run settlement.

Legacy/ad-hoc `cli-spawn` keeps today's direct adapter behavior and does not use
this recovery profile.

## `herdr-spawn` Mapping

`herdr-spawn` consumes `workerInvocation` through Herdr's worker-command seam.
The required shape is:

```text
herdr transport fields: name, kind, pane, timeout, session
worker command suffix: workerInvocation.command + workerInvocation.args
worker env: workerInvocation.env plus Herdr transport env that does not alter worker confinement
```

The Herdr adapter may create a pane, choose a deterministic name and wait for
agent readiness. Those are transport mechanics. The worker command suffix and
env digest must match the prepared invocation. The full Herdr start request has
its own digest because it includes transport fields; the worker-command digest
must equal the digest recorded by Authority.

If Herdr cannot start an arbitrary prepared executable while keeping readiness
and session tracking, required confinement refuses before launch. A legacy path
that starts by provider `kind` and only appends provider flags may continue only
outside this Assignment-owned required profile and may report partial/unknown; it
cannot claim local-bwrap-v1 `enforced`.

Herdr status is never Run truth. `settled` requires the worker outbox result and
a Herdr adapter receipt that binds the prepared invocation digest. Missing
lookup, gateway restart or name absence without `absent-proven` parks; it never
causes automatic replacement launch.

## `local-bwrap-v1` Support Matrix For S2

| Axis | First-profile claim | Required behavior |
|---|---|---|
| `hostWrite` | `deny`, except explicit resolved write grants | refuse if writable resource overlaps attestation/protected store |
| `hostRead` | `allow` only | do not claim secret-read denial |
| `networkEgress` | `allow` only | filtered/deny requests refuse or park before launch |
| `process` | `host` only | do not claim process namespace isolation |
| `home` | `host` claim; private-home resource may be supplied | `home: private` remains unverified until separately probed; required private-home control refuses unless proof exists |
| `session` | `shared`; Herdr isolated-session hygiene is context evidence | never claim OS IPC/session confinement from Herdr session alone |
| `workspace` | `shared` or context-proven own worktree | own-worktree does not grant writable takeover authority |
| `preferred` | unsupported in default v1 | refuse before launch |
| `required` | supported only inside this matrix | fail closed on unsupported/unknown controls |
| `unconfined` | explicit audited opt-out | no bwrap enforcement claim |
| writable `run-output` | adapter-specific worker outbox only | protected receipts/capture/attestation live outside worker grant |
| cleanup | Authority-owned resources only | resolve by plan/resource/ownership-marker digest; retain on uncertainty |

This matrix is intentionally smaller than a container platform. It is enough for
S2 because the selected guarantee is filesystem host-write denial around the
worker command, plus honest refusal for controls local-bwrap-v1 cannot prove.

Additional rules:

- No network filtering, network denial, PID namespace or secret-read protection
  is claimed.
- Private-home allocation and environment binding are distinct from proving the
  `home: private` control.
- `ownWorktree` requires concrete worktree identity and `cwd !== repoRoot`; it
  remains a context condition.
- Writable workspace and git metadata require explicit grants.
- Attestation/protected paths are canonicalized and checked for overlap in both
  directions against every writable mount, including symlink resolution.
- The worker may read protected evidence under `hostRead: allow`; the guarantee
  is that it cannot create, overwrite, rename, truncate or unlink it.
- Cleanup never relies on Herdr status. It requires process-incarnation/liveness
  evidence or retains resources.
- The current Codex credential special case inside the bwrap driver should not
  expand during S2; moving it into provider normalization is future cleanup
  unless it blocks a required test.

## Required Tests Before Implementation Close

Shared Authority tests:

1. required `cli-spawn` and required `herdr-spawn` both receive an
   `authority-prepared-invocation.v1` record with matching digest;
2. Authority no longer hard-refuses `herdr-spawn` merely because adapter is
   Herdr when the worker-command seam is declared available;
3. provider-kind-only Herdr path cannot claim bwrap `enforced`;
4. prepared invocation digest mismatch refuses before Run settlement;
5. attestation/protected store overlap with any writable worker grant refuses;
6. private-home/session/workspace claims follow the support matrix and do not
   overclaim process isolation or filtered network;
7. resource finalization resumes after prepared attestation, after cleanup
   success, after retained-state publication and after delete-succeeded/result-
   write-crashed.

`cli-spawn` profile tests stay in
[cli-spawn-local-contract.md](cli-spawn-local-contract.md). `herdr-spawn` profile
tests stay in [launch-reconciliation.md](launch-reconciliation.md). The code
panel may implement the shared Authority seam first, then the two adapter
profiles against it.

## Non-goals

No new daemon, backend registry, process registry, gateway socket adapter,
generic checkpoint framework, automatic Herdr replacement launch, filtered
network proof, process namespace claim, or shared-cwd writable takeover. Those
belong to later named capabilities only when their own proof exists.
