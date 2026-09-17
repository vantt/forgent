# R3 Remote Peer Rollout Plan

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break R3 production remote peer proof into independently reviewable packets
Design status: Draft
Implementation status: Planned (R3-P0 route/contract frozen; R3-P1+ not started)
Canonical: Yes, after review
Owner: Host invocation
Source type: Derived from host-invocation R3 proof gate, host use cases, and gateway context scan
Last reviewed: 2026-09-17
Related:
- docs/platform/host-invocation-routing/roadmap.md
- docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md
- docs/platform/host-invocation-routing/architecture/host-use-cases.md
- docs/platform/host-invocation-routing/architecture/invocation-kernel.md
- docs/specs/herdr-web-dashboard.md
```

## 1. Goal

R3 proves that a project-local remote host is a peer of the CLI host. One
gateway route must project a remote request into the same semantic invocation
kernel, call `InvocationService` directly, and present a gateway/API response
without shelling through `fgos`, invoking Node, or parsing CLI `fgos.v1`.

The intended result is:

```txt
gateway request -> remote projector -> OperationRequest
  -> InvocationService -> provider outcome
  -> remote presenter -> gateway/API response
```

## 2. Recommended First Use Case

Use a read-only route. Preferred order:

1. `work.gate-bypass.show`, if the gateway already has or can naturally expose
   a status/debug read for dashboard use.
2. `distribution.build.show`, if a runtime/version endpoint is easier to fit
   into the existing gateway API.
3. The R2 fixture operation, only after R2 is implemented and if the goal is to
   prove external-provider plus remote-peer composition in the same follow-up.

The first R3 route should be production-shaped, not a test-only HTTP endpoint.
It may still be hidden behind an internal/preview API status if that matches the
gateway's existing contract posture.

### 2.1 R3-P0 Decision (2026-09-17)

Selected: option 2, `distribution.build.show`, exposed as `GET /v1/runtime`.

- Option 1 (`work.gate-bypass.show`) is deferred: the gateway has no existing
  status/debug read it already maps to, so freezing that route first would
  mean inventing a new gateway concept instead of freezing a contract against
  something already shaped.
- `distribution.build.show`'s provider descriptor already declares
  `allowed_hosts: &["cli", "remote"]` (`DISTRIBUTION_BUILD_SHOW_DESCRIPTOR`,
  `packages/distribution/rust/src/lib.rs`) — the kernel-level descriptor
  already anticipates a `remote` host for this exact operation, so R3-P0
  freezes a contract the descriptor already expects rather than widening
  host allowance as part of this packet.
- `BuildShowProvider::invoke` (`packages/distribution/rust/src/lib.rs`)
  always returns `ProviderOutcome::Completed` — it reads the embedded
  `package.json` and, when `include_runtime` is set, local runtime-identity
  fields; it performs no writes and calls no external process. That makes it
  the safest available read for a first peer-host proof.
- The same operation is the one the R1 Rust CLI host already routes natively
  (`apps/fgos/src/main.rs`, `apps/fgos/src/cli_projector.rs`), so R3 proves
  peer-host equivalence on an operation R1 has already proven for the CLI
  host, instead of introducing a route neither host has exercised yet.

Full frozen contract is recorded in [§5 R3-P0](#r3-p0-route-and-contract-freeze) below and in
[verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).

## 3. Non-Goals

- Do not migrate the whole gateway.
- Do not delete `VerbGateway` or the CLI-shelling chokepoint in R3.
- Do not route writes through the new peer path.
- Do not parse CLI `fgos.v1` inside gateway code.
- Do not change gateway auth, token, CORS, or transport policy except where the
  selected route already requires existing gateway authorization.
- Do not make the gateway select or install runtimes. Packaging-distribution
  owns runtime selection; R3 consumes the selected project-local runtime.
- Do not implement chat host semantics.

## 4. Packet Queue

| Packet | Goal | Likely surfaces | Depends on |
| --- | --- | --- | --- |
| R3-P0 | Select the first route and freeze remote contract shape | R3 proof doc, gateway API contract note, host-use-cases docs | R2 decision if using R2 fixture |
| R3-P1 | Add remote projector/presenter adapter around `InvocationService` | host-runtime or gateway adapter module, unit tests | R3-P0 |
| R3-P2 | Wire one gateway route to the adapter | `herdr-plugin/src/gateway.rs` or owning gateway route module, API tests | R3-P1 |
| R3-P3 | Prove no CLI shelling or `fgos.v1` parsing for the selected route | gateway tests, spy/fake VerbGateway tests | R3-P2 |
| R3-P4 | Document consumer list for remaining `VerbGateway` routes | R3 proof doc, compatibility harness, gateway docs | R3-P2 |
| R3-P5 | Closeout and status update | implementation alignment, R3 proof, roadmap | R3-P3, R3-P4 |

Packets may be combined only when the review still has one clear behavioral
claim. R3-P2 and R3-P3 are likely coupled; R3-P4 should stay explicit so R3
does not overclaim gateway migration.

**R3-P0 status (2026-09-17): closed.** Route and contract frozen (docs-only,
see [§5 R3-P0](#r3-p0-route-and-contract-freeze)). R3-P1 through R3-P5 remain
`not started`.

## 5. Packet Details

### R3-P0: Route And Contract Freeze

Pick exactly one production-shaped read route and record:

- operation id;
- gateway endpoint or route name;
- caller/auth context used by the gateway;
- request projection fields;
- response shape;
- error mapping;
- deadline/disconnect behavior;
- why this route is read-only and safe for first peer-host proof.

Proof:

- R3 proof doc names the route.
- Host use-cases doc states the route is the first remote peer proof.
- No runtime code changes are required in this packet.

#### Frozen Contract (2026-09-17, docs-only — no code changed)

Rationale for picking this operation/route is in [§2.1](#21-r3-p0-decision-2026-09-17).

| Field | Frozen value |
| --- | --- |
| Operation id | `distribution.build.show` (`DISTRIBUTION_BUILD_SHOW_DESCRIPTOR`, `packages/distribution/rust/src/lib.rs`) |
| Gateway endpoint | `GET /v1/runtime`, added to the existing `authenticated` router in `herdr-plugin/src/gateway.rs` (same `/v1` nest every other route already sits under) |
| Caller/auth context | Same `require_token` middleware every other `authenticated` route sits behind: `Authorization: Bearer <token>` checked against `~/.fgos/config.json`'s `gateway.token` (constant-time compare), or a valid `Cf-Access-Jwt-Assertion` when cf-access (D8) is configured. No new auth path. |
| Request projection fields | None from the HTTP request. `GET /v1/runtime` takes no body and no query params in this freeze. The remote projector builds `BuildShowRequest { include_runtime: true }` unconditionally — this route exists specifically to surface runtime identity, so `include_runtime` is fixed, not caller-controlled. |
| Response shape | Gateway/API JSON built from `ProviderOutcome::Completed`'s `output`, downcast to `BuildShowOutcome` (`packageVersion`, `gitCommit`, `verbs[]`, `runtime`). `runtime` is populated (`RuntimeIdentityInfo`) because `include_runtime` is always `true` for this route. `ProviderOutcome::Parked` is not a reachable outcome for `distribution.build.show` (`BuildShowProvider::invoke` only ever returns `Completed`), so the presenter does not need Parked-handling for this route. |
| Error mapping | Policy only, not a final table: reuse the gateway's existing closed `ErrorCategory` enum (`Precondition`, `Conflict`, `Validation`, `CorruptLog`, `LockTimeout`, `SessionFail`, `MergeFail`, `Busy`, `Unexpected` — `herdr-plugin/src/gateway.rs`); add no new category (matches D7). Kernel-level `ProviderError` families that can surface for this operation are admission/routing errors (`NoBinding`, `AmbiguousBinding`, `IncompatibleContract`, `CallerAdmissionDenied`, `SelectedProviderCapabilityDenied`), since the provider's own `invoke` never fails. Exact per-variant → category mapping is decided in R3-P1/P2 when the presenter is written, not frozen here. |
| Deadline/disconnect behavior | Not a driving concern for this route: `BuildShowProvider::invoke` is synchronous, local, and does not spawn a process (reads the embedded `package.json` and local runtime-identity fields only). Disconnect/cancellation follows whatever the existing axum handlers already do for other `authenticated` routes; R3-P1/P2 add no new deadline mechanism for this route. |
| Why read-only/safe first proof | No state write, no external process, no CLI shelling, provider already declares `remote` as an allowed host, and the same operation is already proven for the CLI host in R1. See [§2.1](#21-r3-p0-decision-2026-09-17). |

This is a documentation freeze only. `herdr-plugin/src/gateway.rs` has no `/runtime` route yet — R3-P1/P2 add the remote projector/presenter and wire the route to this frozen shape.

### R3-P1: Remote Projector And Presenter

Create a remote-host adapter that can call `InvocationService` without going
through CLI grammar or CLI presentation.

Rules:

- remote projector creates `HostInvocation` and `OperationRequest`;
- remote presenter maps `ProviderOutcome` or `ProviderError` to gateway/API
  response shape;
- no `fgos.v1` envelope appears inside the gateway adapter;
- remote host kind is visible in invocation metadata or lifecycle evidence if
  the current kernel supports it.

Proof:

- unit test projects a remote request into the chosen operation id;
- unit test presents success and at least one error family;
- CLI projector/presenter tests still pass unchanged.

### R3-P2: Gateway Route Wiring

Wire the selected gateway endpoint to the remote adapter.

Rules:

- preserve existing gateway auth and transport contract;
- do not shell through `fgos`;
- do not call `VerbGateway` for the selected route;
- do not parse `fgos.v1`;
- consume the selected project-local runtime, do not choose/install a runtime.

Proof:

- gateway route returns the expected response for the selected read operation;
- existing gateway contract tests pass;
- selected route still respects token/auth behavior.

### R3-P3: No-Shell / No-Parse Proof

Add a hard regression test for the selected route.

Proof options:

- fake `VerbGateway` panics if called and the selected route still passes;
- process-spawn spy proves no `fgos`, `node`, or `bin/fgos.mjs` child process is
  started for the selected route;
- fixture response intentionally differs from CLI `fgos.v1` and the gateway
  test asserts the remote response is built from `ProviderOutcome`.

At least one no-shell proof and one no-`fgos.v1`-parse proof are required.

### R3-P4: Remaining `VerbGateway` Consumer List

R3 does not remove the legacy gateway chokepoint. It must make the remaining
legacy consumers visible.

Record:

- routes still using `VerbGateway`;
- whether each is read or write;
- whether each shells to legacy Node through CLI;
- removal or migration preconditions.

Proof:

- R3 proof doc includes the consumer list or links to a generated/listed
  source.
- No claim says the gateway as a whole has migrated.

### R3-P5: Closeout

Update status only for the selected route.

Proof:

- R3 selected route is labelled `implemented preview` or equivalent;
- R3 gateway peer model remains partial for all other routes;
- R1/R2 proofs remain true;
- roadmap moves the next frontier to either another remote route, chat contract,
  or explicit legacy-route retirement.

## 6. Suggested Test Commands

Exact commands depend on the selected gateway surface. Start with:

```sh
cargo test -p fgos-host-runtime --quiet
cargo test -p fgos --quiet
cargo test -p herdr-fgos --quiet
node --test test/rust-host/command-routes.test.mjs
```

Add focused gateway tests for the selected route, no-shell behavior, no
`fgos.v1` parsing, auth preservation, and error mapping.

## 7. Close Criteria

R3 is done when:

- one production-shaped project-local gateway route calls `InvocationService`
  directly;
- the route does not call `VerbGateway`, shell to CLI, spawn Node, or parse
  `fgos.v1`;
- gateway auth and transport contract stay intact;
- CLI and gateway are documented as peer hosts for the selected operation only;
- remaining `VerbGateway` consumers are listed and not silently claimed done;
- docs label R3 as partial/preview for one route, not whole-gateway migration.

## 8. Handoff Note

Use code-panel for implementation. Open R3-P0 first to select the route and
freeze the gateway response contract. Do not start R3-P1/R3-P2 until the first
route is named and the no-shell/no-parse proof strategy is written down.
