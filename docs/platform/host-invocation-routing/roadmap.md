# Host Invocation Routing Roadmap

```txt
Document type: Roadmap
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Plan the remaining work needed to move host-invocation-routing from release-candidate code to released/default runtime behavior
Design status: Draft
Implementation status: Planning
Canonical: Yes, after review
Owner: Host invocation
Source type: Created after 2026-09-14 code scan of host-runtime, apps/fgos, GitHub release state, and packaging-distribution links
Last reviewed: 2026-09-14
Related:
- docs/platform/host-invocation-routing/README.md
- docs/platform/host-invocation-routing/spec.md
- docs/platform/host-invocation-routing/verification/implementation-alignment.md
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
```

## 1. Current Baseline

The codebase has a Rust-host release-candidate slice, but it is not released as the public/default installed runtime yet.

| Evidence | Current state |
| --- | --- |
| [apps/fgos](../../../apps/fgos/) | Rust CLI host code exists. |
| [packages/host-runtime/rust](../../../packages/host-runtime/rust/) | Host runtime crate implements kernel contracts, router, registry, authority gate, providers, and invocation service. |
| [packages/host-runtime/contracts/command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) | Current route matrix has 73 selectors: 71 `legacy-cli`, two native. |
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Native CLI routes project `version` to `distribution.build.show` and `gate-bypass` to `work.gate-bypass.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| GitHub Releases | No public release asset was found on 2026-09-14. |

This means host-invocation is code-ready for a partial R1 slice, while public release/default installation is still a packaging-distribution concern.

## 2. Dependency Answer

Host-invocation-routing does not need to wait for packaging-distribution to continue documenting, testing, or adding native routes. It does need packaging-distribution before any doc or product claim says the Rust host is the released/default installed `fgos`.

| Work item | Can host-invocation do alone? | Depends on packaging-distribution? | Reason |
| --- | --- | --- | --- |
| Keep Rust host/runtime tests green | Yes | No | This is local host-invocation code proof. |
| Maintain command route matrix and drift checks | Yes | No | Route descriptors are host-invocation routing inputs. |
| Add another native read route | Yes, after component ownership is clear | Only if route touches release/install/runtime selection | Native operation design is host-invocation plus owning component. |
| Decide preview vs stable public release | No | Yes | This is public release posture. |
| Decide Node fallback support window | No | Yes | This is support/rollback policy. |
| Flip installed `fgos` to Rust by default | No | Yes | Packaging-distribution owns install, activation, release assets, and rollback. |
| Prove `fgctl init` activates Rust host from release asset | No | Yes | `fgctl` and `.fgos/installation` are packaging-distribution. |
| R2 external provider preview implementation | Mostly yes | Lightly, for release packaging of provider fixtures if shipped | Protocol and routing are host-invocation; artifact delivery may involve packaging. |
| R3 remote peer | Mostly yes | Lightly, for project-local runtime adapter selection | Remote host must call selected project runtime, not become runtime selector. |
| Chat host contract | Yes | No immediate dependency | No release/install dependency until a shipped host adapter exists. |

## 3. Plan Overview

```txt
A. Close local R1 host proof
B. Close packaging release decisions
C. Cut and verify public release/default path
D. Add next native read route
E. Build R2 external provider preview
F. Build R3 remote peer
G. Define chat host contract
H. Retire legacy Node after zero-route proof
```

Phase A can happen now without waiting. Phase B/C require packaging-distribution. Phase D can proceed in parallel only if it does not claim public release status. Phase E/F can be designed now, but shipped proof may touch packaging lightly.

## 4. Phase A: Close Local R1 Host Proof

Goal: make the current Rust-host code slice mechanically verifiable as the host-invocation baseline.

Host-invocation tasks:

- Keep [command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) as the route matrix source of truth.
- Verify the matrix count in tests: 73 selectors, 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`.
- Ensure every route has owner path and compatibility tests.
- Keep native `version` proof: no Node child process, valid `fgos.v1` presentation, `distribution.build.show` typed provider output.
- Keep legacy passthrough proof: one Node child process, manifest-based legacy payload resolution, recursion guard, one lifecycle record.
- Keep kernel proof: `OperationId`, `OperationRequest`, `ProviderOutcome`, router, registry snapshot, authority gate, and `InvocationService` tests.

Packaging dependency: none.

Done when:

- `cargo test -p fgos-host-runtime -p fgos --quiet` passes.
- The relevant Node route-matrix tests pass.
- [verification/implementation-alignment.md](verification/implementation-alignment.md) labels local code claims `current partial` or `implemented` with evidence.

## 5. Phase B: Close Packaging Release Decisions

Goal: decide the remaining product/release questions that code cannot decide.

Packaging-distribution decisions:

| Decision | Needed because | Output |
| --- | --- | --- |
| Preview versus stable/default | Rust host code exists, but public rollout posture is not encoded by code. | Update packaging-distribution release docs and [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md). |
| Node fallback compatibility window | Legacy fallback exists, but support duration is product/rollback policy. | Update [verification/compatibility-harness.md](verification/compatibility-harness.md) and Node-retirement criteria. |
| Installed `fgos` flip gate | The repo can build Rust host, but users need release assets and activation. | Update packaging release proof and host-invocation R1 proof. |

Host-invocation can prepare the exact ask for packaging-distribution, but it should not answer these decisions alone.

Done when:

- [architecture/release-boundaries.md](architecture/release-boundaries.md) no longer marks preview/stable or compatibility window as `unknown`.
- Packaging-distribution docs record the same decision and link back to host-invocation.

## 6. Phase C: Cut And Verify Public Release / Default Path

Goal: prove that the release a user installs actually enters the Rust host.

Packaging-distribution tasks:

- Tag a version that matches [package.json](../../../package.json).
- Run `.github/workflows/release.yml` or equivalent local release build.
- Build assets with [scripts/build-rust-distribution.mjs](../../../scripts/build-rust-distribution.mjs).
- Publish GitHub release assets for `fgos-*`, `fgctl-*`, `SHA256SUMS`, and `install.sh`.
- Verify `install.sh` installs `fgctl` from release assets.
- Verify `fgctl init` publishes workspace activation under `.fgos/installation/activation.json`.
- Verify `.fgos/installation/bin/fgos version` enters Rust host, not npm Node `bin/fgos.mjs`.
- Verify rollback/repair behavior when the active release is bad.

Host-invocation tasks:

- Verify native `version` still reaches `InvocationService` and `distribution.build.show` inside the released asset.
- Verify legacy selectors still reach the `legacy-node` payload through `components.legacyNode.root` and `components.legacyNode.entry`.
- Verify no PATH/cwd/hardcoded payload fallback is used for release-mode legacy execution.
- Record release evidence in [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md).

Done when:

- Release assets exist and are installable.
- External consumer install/init/version proof passes.
- R1 status can move from `current partial` to `implemented` for released/default runtime behavior.

## 7. Phase D: Add The Next Native Read Route

Goal: migrate one more read-only semantic route after `version`.

Candidate: `gate-bypass`. The local native read proof is now implemented:
`gate-bypass` routes to `work.gate-bypass.show` through the Rust host. The read
behavior belongs to the existing work/state read core, while setup/doctor
configuration readiness remains Packaging-Distribution's setup registry concern.
No new component such as `gate-policy` is introduced, and this does not claim a
full Work/State migration.

Ownership result:

- [src/state/gate-bypass.mjs](../../../src/state/gate-bypass.mjs) owns the pure read computation: `readGateBypassLevel`, tier coverage, open-item checks, and gate auto-approval decisions.
- [src/setup/registrations.mjs](../../../src/setup/registrations.mjs) owns config default, doctor check, and doctor fix readiness for `gateBypass.level`; this remains Packaging-Distribution support work, not the native route owner.
- [src/cli/command-registry.mjs](../../../src/cli/command-registry.mjs) owns CLI grammar/help only.
- No component-boundary change. The native operation should be treated as a work/state read proof, not as a new `gate-policy` component.

Host-invocation tasks:

- Keep `OperationId` `work.gate-bypass.show`, request/outcome contract, provider descriptor, route descriptor, projector, provider, presenter, and tests green.
- Keep writer routes out of scope.
- Do not dual-run writers.
- Do not create fake components such as `gate-policy`.

Packaging dependency: none unless this route is bundled into a public release claim.

Done when:

- A second production native route exists in [command-routes.json](../../../packages/host-runtime/contracts/command-routes.json).
- Component ownership and boundary impact are documented.
- Tests prove native and legacy semantics do not drift.

## 8. Phase E: R2 External Process Provider Preview

Goal: make external provider protocol real as a preview after R1 host semantics are stable enough.

Host-invocation tasks:

- Implement static provider manifest validation.
- Implement length-prefixed JSON-RPC 2.0 stdio framing.
- Implement bounded supervision, cancellation, backpressure, timeout, crash, and completion-unknown mapping.
- Add duplicate claim, reserved namespace, unknown capability, and incompatible contract negative tests.
- Add one vendor-scoped fixture provider and conformance suite.

Packaging dependency: light. If preview providers ship as release artifacts, packaging-distribution must include and verify their files. If they are test fixtures only, host-invocation can proceed without packaging release work.

Done when:

- [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) names the fixture provider and conformance suite.
- External provider docs move from `planned` to `current preview` or `implemented preview` based on release posture.

## 9. Phase F: R3 Production Remote Peer

Goal: prove a project-local remote host is a peer of CLI for at least one native operation.

Host-invocation tasks:

- Add a gateway route that calls the same invocation service directly.
- Prove it does not shell through CLI.
- Prove it does not parse `fgos.v1` internally.
- Keep CLI and remote projection differences host-local.
- Keep lifecycle, authority, and provider outcome semantics aligned with the kernel.

Packaging dependency: light. The remote host must use the selected project-local runtime adapter. Packaging-distribution owns that runtime selection; host-invocation owns the route once runtime is selected.

Done when:

- [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) has production route and test evidence.
- Remote peer can be labelled `current` for that route only.

## 10. Phase G: Chat Host Contract

Goal: turn chat from planned peer-host concept into a concrete host contract.

Host-invocation tasks:

- Define chat admission contract.
- Define interruption/cancellation behavior.
- Define human-input parking semantics.
- Define presentation boundary.
- Define lifecycle evidence mapping.
- Prove chat does not shell through CLI or wrap remote host behavior.

Packaging dependency: none until a shipped host adapter is packaged.

Done when:

- A chat-host contract exists under [contracts/](contracts/README.md) or architecture host-use-cases.
- [architecture/host-use-cases.md](architecture/host-use-cases.md) moves chat from `planned` to a more precise status.

## 11. Phase H: Legacy Node Retirement

Goal: remove legacy Node only after zero-route and release-policy proof.

Host-invocation gates:

- Zero `legacy-cli` routes remain in command route descriptors.
- Replay compatibility and public host contract tests pass.
- `legacy-cli` adapter and legacy payload docs are retired to history.

Packaging-distribution gates:

- No setup/doctor/init/repair path depends on Node fallback.
- Rollback does not require the removed Node payload.
- Compatibility window is closed by release policy.
- Release manifests no longer require `components.legacyNode` for current releases, or mark it historical/compatibility only.

Done when:

- [contracts/legacy-payload.md](contracts/legacy-payload.md) becomes historical.
- [spec.md](spec.md) removes `legacy-current` for Node payload only after code and release evidence agree.

## 12. Immediate Next Actions

| Order | Action | Owner | Packaging dependency |
| --- | --- | --- | --- |
| 1 | Run route-matrix and rust-host targeted tests, fix only host-invocation failures. | Host invocation | No |
| 2 | Create a short packaging decision note asking for preview/stable, fallback window, and flip gate. | Host invocation prepares; packaging decides | Yes |
| 3 | Run packaging-distribution release proof tests already listed in packaging docs. | Packaging-distribution | Yes |
| 4 | If release proof passes, cut/publish GitHub release assets. | Packaging-distribution | Yes |
| 5 | Verify installed `.fgos/installation/bin/fgos version` enters Rust host. | Both | Yes |
| 6 | Keep the implemented native read route `gate-bypass -> work.gate-bypass.show` verified as a local proof, using the confirmed work/state read ownership and no component-boundary change. | Host invocation plus existing work/state owner | No, unless bundled into release |

## 13. Related Files

| Relationship | File |
| --- | --- |
| area portal | [README.md](README.md) |
| spec | [spec.md](spec.md) |
| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| R1 proof | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| R2 proof | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| R3 proof | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| packaging-distribution portal | [../packaging-distribution/README.md](../packaging-distribution/README.md) |
| runtime identity and activation | [../packaging-distribution/architecture/runtime-identity-and-activation.md](../packaging-distribution/architecture/runtime-identity-and-activation.md) |
