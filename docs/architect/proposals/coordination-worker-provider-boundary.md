# Coordination Envelope — Worker, Provider, and Control Boundary

Document type: Proposal
Design status: Discussion
Implementation: Not started; supporting OS-only probes exist
Last reviewed: 2026-09-06
Canonical for: nothing until accepted; minimum boundary sketch before a live probe
State class: State

Related: [Conceptual architecture](coordination-capability-envelope.md),
[Probe contract](coordination-envelope-probe-contract.md),
[Progress](coordination-envelope-progress.md),
[Capability audit](../agent-coordination/verification/coordination-envelope/capability-fit-2026-09-06.md),
[Dispatch control plane](../agent-coordination/architecture/dispatch-control-plane.md).

## Decision proposed

This boundary is subordinate to the existing [Dispatch & Execution control
plane](../agent-coordination/architecture/dispatch-control-plane.md). It does
not introduce a parallel provider or coordination runtime. The coordinator
requests a semantic Assignment; Dispatch resolves the mechanism, including
`in-process`, and the boundary applies to that selected mechanism.

Keep provider account credentials and coordination authority outside the worker's
execution boundary. Give each worker only its materialized context, private
scratch, bounded output submission, and a Run-scoped inference capability. Do not
mount the real home, runtime ledger, shared provider cache, or complete Run
metadata directory into a worker to make its CLI start.

This is a proposed capability boundary, not a new general conversation engine or
an accepted implementation. An inference relay below means a transport adapter
capability; it does not choose cognitive steps or execute arbitrary worker tools.

## New evidence since the first capability audit

[Transport](../../../src/runner/dispatch/transport.mjs), cliSpawnAdapter, launches
with `{ ...process.env, ...resolvedEnv, FGOS_DISPATCH_DEPTH: ... }`. The herdr path
also constructs a merged fullEnv. Environment overrides therefore do not form an
allowlist. This is static evidence of inheritance, not a claim that a real secret
was leaked. An environment depth counter is a cooperative limit; a hostile child
can change its own environment, so it cannot own authoritative budget accounting.

[Assignment runner](../../../src/runner/dispatch/assignment-runner.mjs) renders an
absolute runDir for worker report/result submission. That directory also contains
runtime-authored dispatch-plan.json, run.json, and subsequent evidence/result
files. A writable bind of the entire directory would grant more than submission
rights. This is a proposed-isolation integration hazard, not a newly reproduced
metadata-forgery exploit.

A fixed Python process inside the narrow mount inherited a synthetic parent
canary. Adding `--clearenv` removed it. No actual host environment values or
credentials were read. See [raw result](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment-result.json)
and [reproduction script](../agent-coordination/verification/coordination-envelope/proofs/2026-09-06-boundary/environment.mjs).
Run the script from repo root; it calls no provider or fgOS dispatch adapter.

## Principals and resources

| Principal | Owns / may do | Must not inherit |
|---|---|---|
| Human or delegated authority owner | Objective, envelope, product decisions, explicit grant expansion | Worker assertions must not impersonate this principal |
| Coordinator agent | Propose Assignments, attenuate grants, select method, assess evidence, request close | Direct ledger/config mutation or unbounded provider credentials |
| Trusted control service | Authenticate callers, reserve bounds, issue/revoke grants, create Runs, seal receipts | It must not interpret worker text as authority |
| Trusted provider adapter | Fixed provider transport, service credential custody, per-Run accounting | No worker-directed arbitrary host commands, files, or destinations |
| Worker execution | Think, use allowed tools, read packet, produce candidate/report, request bounded inference | Other worker contexts, driver credentials, host home, runtime metadata |
| Artifact/effect owner | Safely ingest submissions; validate/integrate candidate with CAS and evidence | Worker completion cannot grant approval/merge/Work lifecycle authority |

A coordinator is not trusted simply because it is called coordinator. Its own
model/tool execution needs a scoped control channel; the service that validates
its requests is outside that context's writable resources. Existing same-user
CLI behavior remains a legacy trust profile until this separation is established.

## Worker filesystem and process envelope

| Resource | Proposed treatment |
|---|---|
| Runtime libraries/binaries | Pin required closure and mount read-only; the probe's broad /usr is only an OS experiment |
| Public requirements and sealed candidate | Materialize exact allowed snapshot under stable worker-visible paths |
| Private provider state / scratch | Fresh per-Run writable directory; no shared auth/history cache |
| Worker report submission | Dedicated bounded outbox, separate from canonical Run storage |
| Mutable candidate | Disposable granted workspace only; no shared .git pointer into the host repository |
| Runtime truth, config, sibling output | Not mounted; no endpoint access unless separately granted |
| Environment | Empty baseline plus explicit necessary values; no inherited auth/proxy/socket settings |
| Processes/descriptors | Separate process namespace; close unintended descriptors; no host process visibility or ptrace access |
| Network / sockets | Deny general egress and host sockets; only specifically mediated services |

Writable private scratch may be mapped to provider-required locations inside the
sandbox. It must not reuse host HOME/CODEX_HOME or a sibling's session history.
Provider executables and startup instructions are part of the pinned closure;
plugins, repository instructions, or test code remain untrusted inputs for effects.

Revealed knowledge cannot be revoked. A fresh independent assessment uses a new
worker context. A replaced worker does not inherit prior draft access by accident.

## Provider transport alternatives

| Alternative | Benefit | Cost / failure mode | Assessment |
|---|---|---|---|
| Full host home/auth bind plus network | Existing CLIs likely need less adaptation | Exposes account credentials, shared history, and unrelated data; unbounded direct calls | Reject for this threat model |
| Narrow mounts plus direct scoped provider credential | Smaller setup where backend issues enforceable per-run credentials | Credential is visible to worker; quota/expiry/endpoint restrictions must exist and be proved | Conditional option, no backend support assumed |
| Narrow mounts plus credential-holding inference relay | Worker never receives service account secret; relay can reserve per-run budget | CLI compatibility, streaming, cancellation, auth protocol and transport need proof | Preferred candidate to evaluate |
| Trusted model client with only sandboxed tool execution | Keeps credentials outside shell by construction | Requires a host whose tool routing cannot bypass the sandbox; may replace CLI experience | Fallback candidate, no new agent loop chosen yet |

The relay must authenticate a Run-scoped endpoint, pin provider/model selection,
reject arbitrary destinations/credential forwarding, reserve usage before calls,
limit requests/bytes/output, and revoke on Run end. It is not a general HTTP proxy
or a host-tool MCP endpoint. Worker possession of its inference capability is
expected; using it must not open coordinator methods or another Run's budget.

For a CLI that hardcodes its own login/transport and cannot use a constrained
endpoint or enforceable scoped credential, record incompatibility. Do not mount
the real credential store as an automatic fallback. No claim about current
provider proxy compatibility has been verified in this document; verify the exact
installed CLI and authoritative provider documentation before choosing one.

A provider necessarily sees authorized prompt data. Local isolation does not
prove remote confidentiality or a provider's claimed model identity. Keep
requested/configured/observed provenance distinct. An application that allows
research network access needs a separate egress capability, not unrestricted
network inherited from inference access.

## Control authentication and bounded recruitment

The coordinator receives an authenticated, session-scoped process capability.
Worker credentials permit only their Run's input/output and inference services.
Human input is authenticated on a separate channel. IDs and hashes are references,
not credentials. Peer credentials alone are insufficient if all processes remain
indistinguishable under the same user; isolation and endpoint scoping must provide
the actual separation.

A specialist request is prose plus a proposed execution contract. Runtime checks
resource scope, context subset, capability, remaining aggregate budget, and
membership; the coordinator chooses the specialty and task. No new role enum or
predeclared graph node is needed for that choice. Direct child spawning must be
unavailable or accounted for at the boundary, not merely discouraged by a depth
environment variable. A worker may ask the coordinator to recruit; it cannot mint
an independent budget or credential itself.

Cancellation revokes service capabilities as well as terminating process groups.
Resume does not revive old credentials automatically. Coordinator lease/epoch
fences stale controllers; reservations and idempotency keys belong to durable
control state. A timed-out external inference may still be billable: reserve its
maximum liability until reconciled rather than refunding on local disconnect.

## Output ingestion and mutation

The worker writes only to its outbox. The trusted collector accepts bounded regular
files, rejects symlinks/path traversal/special files, and binds collected bytes to
the actual Run. Freeze the outbox or stop all writers before collecting; merely
hashing a still-mutable path invites a race. Canonical evidence and result files
are written by the collector outside the worker namespace.

A worker result is a claim, not an attestation of execution policy or success.
The collector supplies observed exit/routing/provenance and validators supply
candidate-specific evidence. Test commands execute untrusted candidate code and
need their own bounded execution rights. Integration belongs to the resource
owner, uses expected revision/CAS, and is separate from coordination close.

## Minimum public-action gaps and ownership

| Gap | Existing owner / useful capability | Smallest boundary addition to investigate |
|---|---|---|
| Dynamic recruitment | Coordination engine consult/slot machinery | Authenticated bounded Assignment creation independent of graph bindings |
| Retry, replace, cancel | Engine exports already exist | Public commands lowering to those owners, with scoped authority and shared counters |
| Context disclosure | Windows/grants and artifact lineage | Exact materialized reads; grant validation before disclosure, not only contribution linkage |
| Role/policy delivery | Assignment policy, renderer, dispatch resolver | Open doctrine refs and full resolved packet; consistent per-assignment binding |
| Safe output submission | Assignment runner/result ladder | Outbox-to-canonical ingestion boundary, preserving RunResult format where possible |
| Explicit close | Session engine/quorum | Authorized close request with applicable candidate obligations; no unconditional auto-close |
| Cold resume | Store/replay/chain | Pinned checkpoint refs, pending obligations, exposure history, controller fencing |
| Provider credential boundary | Dispatch transport/adapter | Environment allowlist and proven restricted service access; never a separate cognitive planner |

These are seams, not permission to edit listed modules. Shared source/config,
contracts, setup/doctor registration, and tests need a concrete reviewed scope
coordinated with Advisory P02/P03. No such production changes were made here.

## Readiness and next experiments

Completed: static transport/outbox audit plus two synthetic environment cases.
Full provider execution remains unready. The next independent checks can use a
synthetic broker without provider credentials to demonstrate that a worker cannot
call coordinator methods, reuse a sibling's grant, spend a revoked capability, or
submit files racing ingestion. Such results must be labeled prototype-only.

Before a real provider run, freeze one exact adapter candidate, its runtime closure,
private scratch, supported transport, scoped authentication, usage cap, and kill/
resume behavior. Test startup and useful tool execution, not just absence of
writes. Do not infer provider usability from an OS-only mount pass. If none of the
installed adapters can satisfy this, report the gap instead of silently relaxing
rights or launching outside governed dispatch.

Acceptance of this boundary sketch and a shared implementation lease are separate
from the person's authorization to investigate. A later implementation must follow
existing distribution/setup/doctor and impact-analysis requirements. No new
gateway, network listener, provider client, or production dependency was installed
or started in this work.
