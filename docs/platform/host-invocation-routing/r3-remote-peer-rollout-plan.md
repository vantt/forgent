# R3 Remote Peer Rollout Plan

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break R3 production remote peer proof into independently reviewable packets
Design status: Draft
Implementation status: In progress (R3-P0 frozen; R3-P1 adapter implemented preview; R3-P2+ not started)
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

Full frozen contract is recorded in [§6 R3-P0](#r3-p0-route-and-contract-freeze) below and in
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

## 4. Current Code Scan

Scan date: 2026-09-18.

| Surface | Status | Evidence | Meaning for plan |
| --- | --- | --- | --- |
| Remote projector/presenter adapter | Implemented preview | `herdr-plugin/src/remote_invocation.rs`; `herdr-plugin/src/lib.rs` exports `remote_invocation`; `herdr-plugin/Cargo.toml` depends on `fgos-host-runtime` and `fgos-distribution`. | Treat R3-P1 as code-present and verify/adjust only; do not reimplement from scratch. |
| R3-P1 focused tests | Passing | `cargo test --manifest-path herdr-plugin/Cargo.toml remote_invocation --quiet` passed 9 tests on 2026-09-18. | P1 has enough proof to be adopted as the base for P2. |
| Gateway route wiring | Not implemented | `herdr-plugin/src/gateway.rs`'s authenticated router has no `/runtime` route. | R3-P2 is the next implementation packet. |
| Gateway no-shell/no-parse proof | Not implemented for the route | No `GET /v1/runtime` route exists yet, so route-level proof cannot exist yet. | R3-P3 follows P2 and must harden the regression boundary. |
| Remaining `VerbGateway` consumer inventory | Not closed | Existing gateway routes still route through `VerbGateway`; docs do not yet list the post-R3 consumer set. | R3-P4 stays explicit; R3 must not overclaim whole-gateway migration. |

## 5. Full Execution Track

Run R3 as one code-panel track, but keep the packets independently reviewable.
The track should not stop after each packet unless a proof fails or a reviewer
finds a boundary violation.

| Packet | Goal | Required action | Required proof | Status |
| --- | --- | --- | --- | --- |
| R3-P0 | Select the first route and freeze remote contract shape | Keep `GET /v1/runtime` -> `distribution.build.show` as the selected route. Do not reopen unless code reality invalidates it. | Docs name endpoint, auth, request projection, response shape, error policy, and non-goals. | Closed docs-only. |
| R3-P1 | Add remote projector/presenter adapter around `InvocationService` | Adopt existing `herdr-plugin/src/remote_invocation.rs`; adjust only if P2 exposes a real contract mismatch. | Focused adapter tests pass; success and error presenter tests prove typed `ProviderOutcome` presentation without `fgos.v1`. | Implemented preview; verified 2026-09-18. |
| R3-P2 | Wire `GET /v1/runtime` to the adapter | Add a handler in `herdr-plugin/src/gateway.rs`; mount `/runtime` inside the existing authenticated `/v1` router; call `build_invocation_service`, `project_remote_build_show_invocation`, `InvocationService::invoke`, then `present_remote_outcome`. | Gateway route returns runtime JSON under valid auth; unauthenticated request is rejected; existing gateway tests still pass. | Next. |
| R3-P3 | Harden no-shell/no-`fgos.v1` regression proof | Add a route-level test where `VerbGateway` panics or records calls and `GET /v1/runtime` still succeeds; assert the response has no CLI envelope keys such as `contract`, `data`, or `data_hash`. Add a process-spawn assertion only if the gateway test harness already has a cheap seam for it. | At least one hard no-`VerbGateway` proof and one hard no-`fgos.v1`-parse proof. | Planned after P2. |
| R3-P4 | Inventory remaining legacy gateway consumers | List the routes still using `VerbGateway`, whether each is read/write, whether each shells to legacy Node through CLI, and migration preconditions. | R3 proof doc or linked generated/listed source has the consumer list; docs state R3 migrates only `/runtime`. | Planned after P2/P3. |
| R3-P5 | Closeout and status update | Update R3 proof, host use cases, implementation alignment, roadmap, and this plan. Mark only `GET /v1/runtime` as implemented preview. | Tests named in §9 pass; docs no longer say P1+ not started; remaining gateway migration remains partial. | Final packet. |

Packets may be combined only when the review still has one clear behavioral
claim. R3-P2 and R3-P3 are likely coupled; R3-P4 should stay explicit so R3
does not overclaim gateway migration.

**R3-P0 status (2026-09-17): closed.** Route and contract frozen (docs-only,
see [§6 R3-P0](#r3-p0-route-and-contract-freeze)).

**R3-P1 status (2026-09-18): implemented preview.** `remote_invocation.rs`
exists, exports projector/presenter/service assembly, and focused tests pass.
The remaining full-track work is R3-P2 through R3-P5.

## 6. Packet Details

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

Adopt the existing remote-host adapter that can call `InvocationService`
without going through CLI grammar or CLI presentation.

Rules:

- remote projector creates `HostInvocation` and `OperationRequest`;
- remote presenter maps `ProviderOutcome` or `ProviderError` to gateway/API
  response shape;
- no `fgos.v1` envelope appears inside the gateway adapter;
- remote host kind is visible in invocation metadata or lifecycle evidence if
  the current kernel supports it.
- do not introduce a second composition root for the same selected operation
  unless the gateway route wiring proves the current helper is insufficient.

Proof:

- unit test projects a remote request into the chosen operation id;
- unit test presents success and at least one error family;
- CLI projector/presenter tests still pass unchanged.
- focused scan command:

```sh
cargo test --manifest-path herdr-plugin/Cargo.toml remote_invocation --quiet
```

Current evidence: the focused scan passed 9 tests on 2026-09-18.

### R3-P2: Gateway Route Wiring

Wire the selected gateway endpoint to the remote adapter.

Rules:

- preserve existing gateway auth and transport contract;
- mount `GET /runtime` inside the existing authenticated router that is nested
  under `/v1`, producing external endpoint `GET /v1/runtime`;
- the handler takes no request body and no query params;
- call the adapter path in this order: project remote invocation, invoke
  `InvocationService`, present typed outcome;
- do not shell through `fgos`;
- do not call `VerbGateway` for the selected route;
- do not parse `fgos.v1`;
- consume the selected project-local runtime, do not choose/install a runtime.

Proof:

- gateway route returns the expected response for the selected read operation;
- existing gateway contract tests pass;
- selected route still respects token/auth behavior.
- no `VerbGateway` call is observed in a success path test.

### R3-P3: No-Shell / No-Parse Proof

Add a hard regression test for the selected route.

Proof options:

- fake `VerbGateway` panics if called and the selected route still passes;
- process-spawn spy proves no `fgos`, `node`, or `bin/fgos.mjs` child process is
  started for the selected route;
- fixture response intentionally differs from CLI `fgos.v1` and the gateway
  test asserts the remote response is built from `ProviderOutcome`.

At least one no-shell proof and one no-`fgos.v1`-parse proof are required.
Because the selected route uses `BuildShowProvider`, the strongest practical
first proof is `VerbGateway` panic/spy plus response-shape assertions. A
process-spawn spy is valuable but not required if adding it would require a
larger gateway process abstraction unrelated to R3.

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

## 7. Code-Panel Full-Track Prompt

Use this prompt when handing R3 to code-panel:

```text
Run the full Host Invocation R3 track from docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md.

Current state: R3-P0 is closed and selects GET /v1/runtime -> distribution.build.show. R3-P1 adapter code already exists in herdr-plugin/src/remote_invocation.rs and its focused tests passed; adopt it as the base unless implementation evidence shows a real mismatch.

Complete R3-P2 through R3-P5 in order:
- wire GET /v1/runtime into the existing authenticated /v1 gateway router;
- call InvocationService directly through the remote_invocation adapter;
- preserve the existing gateway bearer-token/Cf-Access auth boundary;
- prove the route does not call VerbGateway, does not shell to fgos/Node, and does not parse CLI fgos.v1;
- list remaining VerbGateway consumers and do not claim whole-gateway migration;
- update R3 proof, host-use-cases, implementation-alignment, roadmap, and this rollout plan.

Non-goals: do not migrate other gateway routes, do not delete VerbGateway, do not change gateway auth/CORS/transport policy, do not implement shared multi-project gateway behavior, and do not reopen the packaging runtime-selection boundary.
```

## 8. Reviewer Checklist

- Does `GET /v1/runtime` live behind the same auth layer as the other
  authenticated `/v1` routes?
- Does the route call `InvocationService` directly rather than `VerbGateway`?
- Does the response come from typed `BuildShowOutcome`/`ProviderOutcome`,
  with no CLI `fgos.v1` envelope parsing?
- Does the implementation keep `include_runtime: true` fixed and avoid adding
  caller-controlled request fields?
- Do docs say only `/runtime` migrated, with all other `VerbGateway` consumers
  still visible?
- Did tests include the focused adapter tests and the route-level gateway tests?

## 9. Suggested Test Commands

Exact commands depend on the selected gateway surface. Start with:

```sh
cargo test --manifest-path herdr-plugin/Cargo.toml remote_invocation --quiet
cargo test --manifest-path herdr-plugin/Cargo.toml runtime --quiet
cargo test -p fgos-host-runtime --quiet
cargo test -p fgos --quiet
cargo test -p herdr-fgos --quiet
node --test test/rust-host/command-routes.test.mjs
```

Add focused gateway tests for the selected route, no-shell behavior, no
`fgos.v1` parsing, auth preservation, and error mapping.

## 10. Close Criteria

R3 is done when:

- `GET /v1/runtime` calls `InvocationService` directly through the remote
  adapter;
- the route does not call `VerbGateway`, shell to CLI, spawn Node, or parse
  `fgos.v1`;
- gateway auth and transport contract stay intact;
- CLI and gateway are documented as peer hosts for the selected operation only;
- remaining `VerbGateway` consumers are listed and not silently claimed done;
- docs label R3 as partial/preview for one route, not whole-gateway migration.

## 11. Handoff Note

Use code-panel for implementation. Do not reopen R3-P0 unless code evidence
invalidates the selected route. Do not reimplement R3-P1 from scratch; adopt
the existing `remote_invocation.rs` adapter and continue with R3-P2 through
R3-P5 as one full track with separate packet closeout evidence.
