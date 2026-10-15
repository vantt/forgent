# Verification: Compatibility Harness

```txt
Document type: Verification
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Preserve the planned Node/Rust compatibility harness requirements
Design status: Draft
Implementation status: Current harness plus R2/R3 preview extensions
Canonical: Yes, after review
Owner: Host invocation
Source type: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Last reviewed: 2026-09-18
Related:
- docs/platform/host-invocation-routing/contracts/command-route-descriptor.md
- docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md
Implementation: Current harness plus R2/R3 preview extensions
Provenance: Promoted from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md
Writer type: Original writer attribution not recorded; retained source provenance
Canonical for: Candidate scope: Preserve the planned Node/Rust compatibility harness requirements; authority follows transitional switchboard
Use this when: Preserve the planned Node/Rust compatibility harness requirements
Do not use this for: Authority beyond the declared scope or implementation truth without the cited verification
Supersedes: None; legacy sources remain in place during migration
Superseded by: None recorded
```

## 1. Required Proof

The harness must invoke Node or candidate Rust binary with identical argv bytes, stdin, cwd, selected environment, timeout, and capture stdout/stderr bytes, exit/signal status, filesystem diff, process evidence, and timing.

## 2. Coverage

Coverage includes every selector, descriptor uniqueness, help/syntax passthrough, exit categories, `version`, `ready`, one validation failure, unknown verb, isolated `init` plus `add`, `--dir`, distinct cwd, stdin consumer where present, and target-specific signal/process-tree behavior.

## 3. Status

Current R1 preview proof covers Node/Rust CLI compatibility for the Rust host
preview installed/default path. R2 adds external process protocol/conformance
proof, and R3 adds the first production remote peer route proof through
`GET /v1/runtime`.

Legacy Node fallback remains available only as a deprecated explicit escape
hatch for 30 calendar days after preview release publication. Public preview
tag `v0.1.0` was published on 2026-09-18, so earliest removal for this preview
release is 2026-10-18 unless a later release decision replaces that support
promise. The compatibility harness must keep distinguishing default Rust-host
use from intentional legacy fallback use until that window closes.

## 4. Related Files

| Relationship | File |
| --- | --- |
| descriptor contract | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../README.md) |

## Restored registry linker procedure and its input output formula

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/external-provider-protocol.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** The input/output formula and full validation procedure are retained selected design. The cited immutable snapshot constructor validates duplicate bindings; it does not prove every proposed namespace/capability/replacement step is implemented.

**Code evidence:** `packages/host-runtime/rust/src/registry.rs:19-69`; `packages/host-runtime/rust/src/operation_provider_router.rs:24-40`.

````md
The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.
````

````md
Its complete input/output physics:
````

````md
```txt
authored OperationCatalog
+ built-in provider descriptors
+ transitional CLI-compatibility bindings
+ validated external manifest declarations
+ explicit global/project enable-disable-replacement policy
  -> immutable RegistrySnapshot + source fingerprint
```
````

## Restored test and review gates table

Added in candidate: verbatim restoration of `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` at `83d757f4d693ae13d3fd50e0a454fb95c78f1ff4`; preservation is not a fresh implementation claim.

**Checked status:** This table is a dated proof/acceptance policy, not a claim that the current full Node/Rust/gateway suites or performance gates ran. The real Node suite entry is preserved; checkpoint evidence reports only commands actually exercised.

**Code evidence:** `package.json:27-35`.

````md
## 15. Test And Review Gates
````

````md
| Gate | Required proof |
|---|---|
| Per commit | focused tests; Rust format and lint |
| R1 integration | compatibility inventory, native no-Node proof, `npm test`, workspace tests |
| R1 release | external install/upgrade/rollback/uninstall via `fgctl`, init/doctor on every target, legacy-exec/`version` p50 latency within the P1 budget |
| R2 | protocol conformance and fail-closed negative cases |
| R3 | gateway suite, CLI/remote semantic equality, no CLI/envelope on migrated routes |
| Future writer | replay, lock, atomicity, recovery, idempotency, mutual exclusion, rollback compatibility |
````

````md
Use process-spy evidence, not timing, for no-spawn/no-Node claims — the §6/§11
performance gates are the one place timing is the proof, and they measure
wall-clock explicitly rather than inferring it from spawn evidence. Use
filesystem snapshots for zero-write claims. Use explicit timestamp
predicates; never normalize arbitrary differences.
````

````md
## 17. Risks And Controls
````

````md
| Risk | Control |
|---|---|
| Rust re-parses legacy flags | `args_os`, checked selector, argv corpus |
| Double envelope | compatibility bytes pass through; semantic outcomes alone reach presenter |
| Hash drift | Node differential corpus plus golden vectors |
| Wrong root | installation/caller/project/`.fgos` roots are distinct fixtures |
| Silent override | immutable exact binding; named replacement only |
| Capability escalation | admission then least-privilege provider grant |
| Remote wraps CLI | no-spawn/no-envelope assertions per route |
| “Ship” without install | distribution is in R1 |
| `fgos-runner` silently points at a different release | public-entry mapping and single release manifest/pointer proof |
| checkout-only success hides missing payload | staged-bundle proof before external install |
| doctor mutates or upgrades unexpectedly | read-only default; named `--fix` scope; explicit upgrade contract |
| Fake proof component | component advisory gate before package creation |
| Workspace absorbs Herdr | explicit excludes and independent build proof |
| Crash becomes success | completion-unknown; idempotency-gated retry only |
| Diagnostics break output | trace/evidence or explicit diagnostics surface |
````
