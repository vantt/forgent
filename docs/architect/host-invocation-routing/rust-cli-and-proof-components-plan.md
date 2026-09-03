# Rust CLI And Proof Components Implementation Plan

**Status:** Proposed implementation plan.
**Date:** 2026-09-03.
**Architecture:**
[Host Invocation And Provider Routing](./host-invocation-provider-routing.md).
**Migration direction:**
[Node To Rust Component Migration](./node-to-rust-component-migration.md).

This plan ships the permanent Rust `fgos` entry point before porting the main
Node implementation. It proves the architecture with two small native read-only
operations, one legacy Node route, one external process fixture, and both CLI
and remote host use-case paths. It deliberately does not migrate a state writer
in the first milestone.

Architecture ownership remains with `host-invocation-provider-routing.md`;
provider mechanics and technical tradeoffs repeated here are executable steps,
not a competing design source. Migration ordering remains with
`node-to-rust-component-migration.md`.

## 1. Outcome

At the end of this plan:

- a Rust `fgos` binary is the tested host/router implementation;
- every existing command still works through whole-operation `LegacyNode`
  fallback;
- `version` runs as a built-in Rust provider with byte/contract parity;
- `gate-bypass` runs as a second built-in Rust provider and proves real project
  config resolution plus fail-closed behavior;
- a fixture plugin proves external manifest discovery and framed process RPC;
- `cli-host-use-case` and `remote-host-use-case` both invoke the same Operation
  Provider Router in tests;
- provider diagnostics reveal which implementation serves each operation;
- the production entry-point flip is gated on a reproducible binary distribution
  mechanism, setup/doctor coverage, and the full compatibility suite.

The milestone proves the architecture, not Rust coverage percentage.

## 2. Explicit Non-Goals

- Do not port Work Lifecycle writes, event append, claim/return, merge, setup,
  doctor, runner, or coordination execution in this milestone.
- Do not make the remote gateway call the CLI or parse `fgos.v1` internally.
- Do not pull the existing `herdr-plugin` crate into the new workspace until its
  gateway adapter is deliberately migrated.
- Do not make Rust dynamic libraries a plugin ABI.
- Do not build a permanent daemon only to avoid one Node startup per shell
  invocation.
- Do not rewrite all CLI option parsing in Rust before a command becomes native.
- Do not change public command names, successful envelope shape, or exit codes.

## 3. Grounded Starting Point

The plan is based on these current facts:

| Surface | Current implementation | Consequence |
|---|---|---|
| CLI entry | `package.json` maps `fgos` to `bin/fgos.mjs` | entry-point cutover is a distribution change, not only a Rust code change |
| CLI dispatch | `bin/fgos.mjs` has one large verb switch and wraps successful results at `main()` | legacy fallback must delegate a whole verb and must never double-wrap `fgos.v1` |
| Command metadata | `src/cli/command-registry.mjs`, schema `2.0` | Rust needs a generated/checked descriptor, not a second hand-maintained verb list |
| Public result | `src/state/envelope.mjs` hashes compact `JSON.stringify(data)` into `fgos.v1` | Rust serialization and hashing need cross-runtime golden vectors |
| Error mapping | `src/state/store.mjs` `EXIT_CODES` plus runner busy code | transparent legacy execution must propagate exact status; native errors need one Rust mapping table verified against Node |
| Existing Rust | `herdr-plugin/Cargo.toml` is a standalone crate, not a root workspace member | introduce the host workspace without changing the gateway crate's dependency graph first |
| Remote gateway | `herdr-plugin/src/ports.rs` `VerbGateway` and gateway adapter shell to `node bin/fgos.mjs` | eventual remote integration replaces this chokepoint with `remote-host-use-case`, not another CLI wrapper |
| `version` | `src/cli/version.mjs` returns `{packageVersion, gitCommit, verbs}` | smallest host-local native parity proof |
| `gate-bypass` | `src/state/gate-bypass.mjs` reads project config then a legacy standalone file and fails closed to `off` | small filesystem/config proof with meaningful safety semantics |

## 4. Target Source Shape

Create a root Cargo workspace without changing `herdr-plugin` yet:

```txt
Cargo.toml
Cargo.lock

apps/
  fgos/
    Cargo.toml
    src/main.rs

packages/
  component-protocol/
    contracts/
      command-manifest.v2.json
      envelope-golden.json
      process-rpc-fixtures.json
    rust/
      Cargo.toml
      src/lib.rs
  host-runtime/
    rust/
      Cargo.toml
      src/
        lib.rs
        cli_host_use_case.rs
        remote_host_use_case.rs
        authority_gate.rs
        operation_provider_router.rs
        registry.rs
        error.rs
        providers/
          mod.rs
          legacy_node.rs
          external_process.rs
  distribution-health/
    rust/
      Cargo.toml
      src/lib.rs                 # native version provider
  gate-policy/
    rust/
      Cargo.toml
      src/lib.rs                 # native gate-bypass read provider

scripts/
  export-command-manifest.mjs

test/rust-cli/
  parity-harness.mjs
  legacy-fallback.test.mjs
  version-parity.test.mjs
  gate-bypass-parity.test.mjs
  external-provider.test.mjs
```

The small proof operations live inside their owning component package; do not
create one crate per verb as a lasting convention. `distribution-health` and
`gate-policy` are initial ownership names subject to validation against the
component registry before implementation.

The root workspace lists only the new crates. Explicitly exclude
`herdr-plugin` and every `upstreams/*` crate so `cargo test --workspace` for the
new host does not silently absorb unrelated binaries, lockfiles, or dependency
upgrades.

## 5. Core Rust Interfaces

Start synchronous. The CLI and first proof providers do not need an async trait;
the external process adapter may supervise blocking I/O inside its own adapter.
A later remote integration can add an async boundary without changing semantic
request/result types.

```rust
pub struct HostInvocation {
    pub id: InvocationId,
    pub host: HostKind,
    pub cwd: PathBuf,
    pub deadline: Option<Instant>,
    pub principal: Principal,
}

pub struct OperationRequest {
    pub operation_id: OperationId,
    pub schema_version: String,
    pub input: serde_json::Value,
}

pub trait OperationProvider: Send + Sync {
    fn descriptor(&self) -> &ProviderDescriptor;
    fn invoke(
        &self,
        invocation: &HostInvocation,
        request: OperationRequest,
    ) -> Result<ProviderOutcome, HostError>;
}

pub trait ProviderRegistry: Send + Sync {
    fn resolve(
        &self,
        operation: &OperationId,
        schema_version: &str,
    ) -> Result<Arc<dyn OperationProvider>, RegistryError>;
}
```

`CliHostUseCase` and `RemoteHostUseCase` receive the same registry/router and
authority-gate ports. Neither imports or invokes the other. Presenters remain
host-specific.

The initial authority gate is conservative:

- built-in and legacy operations retain their existing authority classification;
- external plugin operations may use only vendor namespaces;
- external plugins cannot replace a built-in operation;
- requested capabilities outside the fixture's empty capability set are
  rejected.

Do not invent a permissive placeholder that later needs tightening.

## 6. Phase 0: Freeze Compatibility Evidence

### Changes

1. Add a test harness able to invoke either `node bin/fgos.mjs` or a supplied
   Rust binary with the same cwd, argv, stdin, and environment.
2. Record comparisons as structured assertions, not checked-in terminal output.
3. Add envelope golden vectors covering:
   - object field order;
   - nested objects and arrays;
   - Unicode strings;
   - integers, booleans, null, and escaped characters;
   - stable SHA-256 over the compact serialized `data` bytes;
   - UTC timestamp shape with millisecond precision.
4. Export `src/cli/command-registry.mjs` into
   `packages/component-protocol/contracts/command-manifest.v2.json` using a
   deterministic script.
5. Add a drift test that regenerates the manifest in memory and compares bytes
   with the checked-in artifact.

### Important implementation rule

Rust `EnvelopeWriter` serializes `data` once into compact JSON bytes, hashes
those exact bytes, and embeds the same bytes in the final envelope. Enable
order-preserving JSON maps and verify output against Node golden vectors. Do not
hash a separately reconstructed Rust value whose key/number serialization may
differ from the emitted payload.

### Proof

```sh
node --test test/rust-cli/contract-fixtures.test.mjs
node scripts/export-command-manifest.mjs --check
```

## 7. Phase 1: Rust Bootstrap And Transparent Legacy Provider

### `apps/fgos`

Use `std::env::args_os()` for the bootstrap scanner. Do not put all legacy
commands into `clap`: a strict Rust parser would reject or reinterpret flags
that Node still owns.

The scanner must:

1. preserve every `OsString` after the executable name;
2. identify the command for provider lookup without normalizing remaining argv;
3. recognize only truly host-global behavior;
4. resolve the product installation root independently of cwd;
5. select `LegacyNode` for every operation not registered as native;
6. spawn the legacy script directly with `node`, never recursively invoke
   `fgos`;
7. inherit stdin/stdout/stderr in transparent mode;
8. propagate exit status exactly, with an explicit tested policy for signal
   termination.

### Legacy entry resolution

Resolution order:

1. `FGOS_LEGACY_NODE_ENTRY` only as a test/development override;
2. the installed `libexec/fgos/node/bin/fgos.mjs` relative to the Rust
   executable;
3. a checkout-relative development path validated by an ancestor marker.

Never resolve `bin/fgos.mjs` from the caller's cwd. A project using fgOS may
contain an unrelated file at that path.

### Recursion guard

Set an internal `FGOS_LEGACY_CHILD=1` environment marker on the Node child. The
Rust bootstrap refuses to delegate if it is already running as that marked
child. Tests cover accidental `fgos` resolution in PATH pointing back to the
Rust binary.

### Proof

Run a representative matrix through both entry points:

- `--help`, `--help --json`, and `<verb> --help`;
- one read (`ready`), one validation failure, one unknown verb;
- one fixture-backed mutation (`init` then `add`) in a temp repository;
- `--dir`, stdout/stderr separation, and all known exit categories;
- stdin passthrough for any command that consumes it.

Transparent fallback output must be byte-identical except for explicitly
nondeterministic fields such as `generated_at`; the harness normalizes only
those named fields.

## 8. Phase 2: Host Runtime And Router

Implement:

- `OperationId` and immutable provider descriptors;
- compile-time built-in registration;
- one deterministic registry merge;
- exact-match routing with schema compatibility;
- fail-closed duplicate/incompatible provider handling;
- provider identity in diagnostics;
- `CliHostUseCase` and `RemoteHostUseCase` over the same router;
- host-specific presenters.

The provider table initially contains:

```txt
all current core operations -> LegacyNode
system.version              -> BuiltIn(version)
policy.gate_bypass.read     -> BuiltIn(gate-policy), after Phase 4
vendor.fixture.echo         -> ExternalProcess, tests only
```

CLI command projection remains separate:

```txt
fgos version       -> system.version
fgos gate-bypass   -> policy.gate_bypass.read
other known verb   -> legacy.<verb> compatibility operation
```

The `legacy.<verb>` identity is explicitly transitional and cannot be claimed
by external plugins.

### Peer-host proof

Use an in-memory provider and invoke the same operation once through
`CliHostUseCase` and once through `RemoteHostUseCase`. Assert:

- both reach the same provider and semantic input;
- authority rejection is identical;
- CLI output is `fgos.v1` plus exit code;
- remote output is a remote result/status object, never `fgos.v1`;
- cancellation reaches the provider through both paths;
- neither use case imports, constructs, or shells to the other.

Do not integrate `herdr-plugin` yet; this test establishes the reusable seam
before changing the production gateway.

## 9. Phase 3: Native Proof 1 - `version`

### Contract

Preserve current data exactly:

```json
{
  "packageVersion": "0.1.0",
  "gitCommit": "<short-hash-or-null>",
  "verbs": ["<sorted-public-cli-verbs>"]
}
```

### Implementation

- `packageVersion`: compile from the Rust package version, with a test requiring
  it to equal root `package.json` during transition.
- `gitCommit`: attempt `git rev-parse --short HEAD` against the resolved product
  root; return `null` outside a checkout, matching Node.
- `verbs`: read the embedded generated command manifest, sorted exactly as the
  Node implementation does.
- return semantic data to `CliHostUseCase`; the provider never constructs
  `fgos.v1` itself.

### Parity tests

- fresh cwd without `.fgos`;
- checkout commit is the product checkout, never the caller's cwd;
- installed-layout fixture without `.git` returns `null`;
- verb set includes `plan` and excludes retired `decompose`;
- Node and Rust `data` values are equal;
- Rust envelope hash matches the Node algorithm.

### Exit criterion

`version` is permanently routed to `BuiltIn`; no Node process appears in a
process-spy test.

## 10. Phase 4: Native Proof 2 - `gate-bypass`

This proves a real filesystem/config operation without touching Work state.

### Contract

Preserve current success data:

```json
{ "level": "off|light|standard|heavy" }
```

The provider accepts the resolved `.fgos` directory from host context. It does
not independently reinterpret cwd or CLI flags.

### Read order and failure behavior

1. Read `<repo>/.fgos/config.json` and accept `gateBypass.level` only when it is
   a recognized string.
2. If absent/invalid, read legacy `<repo>/.fgos/gate-bypass.json` and accept its
   recognized `level`.
3. Missing files, malformed JSON, wrong shapes, and unknown levels all return
   `off` rather than raising or failing open.
4. Never create `.fgos`, config, cache, or repair output during this read.

The implementation ports only `readGateBypassLevel`; it does not yet port
`canAutoApprove`, risk keywords, or merged-gate policy. Those remain Node
operations until their owning use case migrates.

### Parity tests

Reuse/adapt the fixtures in `test/state/gate-bypass.test.mjs` for:

- no files;
- project shared config value;
- legacy standalone fallback;
- shared value winning over legacy value;
- malformed JSON and invalid levels;
- `.fgos`-less linked-worktree warning behavior at the CLI presenter;
- `--dir` pointing at the main checkout.

### Exit criterion

`fgos gate-bypass` produces semantically identical data and warnings through
the Rust provider, performs zero writes, and never spawns Node.

## 11. Phase 5: External Process Provider Proof

Create a test-only plugin outside the source tree during each test. Its static
manifest claims only `vendor.fixture.echo`, requests no capabilities, and names
a fixture executable.

Use newline-delimited JSON-RPC 2.0 for the first proof:

- exactly one compact JSON object per stdout line;
- stderr reserved for logs;
- request ID correlation;
- handshake/describe after manifest selection, never for discovery;
- deadline and cancellation;
- maximum frame size;
- protocol violation and crash mapped to typed provider errors.

The test proves:

- project/global scan precedence;
- static discovery without executing the plugin;
- duplicate namespace failure;
- refusal to claim a core operation;
- unknown capability refusal;
- successful CLI and remote invocations through the same provider;
- logs never corrupt protocol stdout;
- timeout/crash does not become a semantic success.

Keep the provider client connection-capable, but a normal one-shot CLI may
start one plugin process for its own lifetime. Persistence across invocations is
not required for this proof.

## 12. Phase 6: Structured Legacy Bridge

After transparent parity is stable, add an internal Node bridge mode rather
than forking the public CLI output parser.

The bridge returns:

- captured stdout bytes;
- captured stderr bytes;
- exit status/category;
- whether the response is already a public legacy presentation;
- invocation/provider diagnostics.

Rust reproduces the bytes and status unchanged. It does not parse a successful
`fgos.v1` envelope and wrap it again.

Only switch a command from transparent mode to structured bridge after its
golden CLI matrix proves no output or error regression. The bridge is useful
for cancellation/tracing and for the future remote migration, but is not a
prerequisite for native `version`.

## 13. Phase 7: Remote Host Integration

Once the common runtime passes peer-host tests, replace the production gateway's
CLI-shelling chokepoint deliberately:

1. Keep REST/MCP parsing and authentication in the gateway adapter.
2. Construct `RemoteHostUseCase` with the same authority/router contracts used
   by the CLI host.
3. Replace `VerbGateway` with a semantic invocation port; do not forward argv.
4. For operations still served by Node, let the router choose `LegacyNode`.
5. For native operations, call their Rust provider directly.
6. Project `ProviderOutcome` into REST/MCP responses; do not consume or expose
   `fgos.v1` internally.

This phase may require separating gateway code from `herdr-plugin` into a thin
app plus reusable package. Treat that as its own reviewed footprint because the
current crate also contains TUI, Axum, MCP, auth, and embedded web dependencies.

Proof includes CLI/remote semantic parity for `system.version` and
`policy.gate_bypass.read`, plus existing gateway contract tests.

## 14. Phase 8: Distribution Cutover

The Rust host is not the installed default until distribution is reproducible.
The current direct-GitHub npm installation ships JavaScript source and forbids
install lifecycle builds, so it cannot silently compile Rust on a consumer's
machine.

### Required release shape

Produce per-supported-target release archives containing:

```txt
bin/fgos                         # Rust executable
libexec/fgos/node/bin/fgos.mjs  # legacy provider entry
libexec/fgos/node/src/...       # legacy payload
share/fgos/...                  # required manifests/contracts
```

CI builds, tests, signs/checksums, and publishes the archives. Installation
selects an explicit supported target and installs the archive atomically. It
must not require a Rust toolchain on the consuming project.

Before implementation chooses an installer mechanism, update
`docs/distribution-vision.md` and `docs/specs/distribution.md`; this is a real
change from the current GitHub npm-package path. Preserve the old npm entry as a
documented compatibility channel until the new install/upgrade/rollback path is
proven.

### Setup/doctor registrations

Add checks for:

- Rust host binary version and target;
- Node legacy runtime and payload while any operation uses it;
- command-manifest drift;
- provider registry load and duplicate claims;
- configured external plugin executables/modules;
- host/provider mapping diagnostics;
- release asset integrity.

Add fixes only for conditions safely repairable without overwriting customized
project/global config. Every new config default uses the existing config-merge
registry.

### Cutover gate

Change the installed `fgos` entry only when:

- all supported targets pass the same CLI parity suite;
- install, upgrade, rollback, and uninstall are proven from an external temp
  project;
- no install path downloads or builds code implicitly without documented user
  intent;
- `fgos doctor` names a missing Node runtime/payload before a legacy invocation;
- changelog and end-user install documentation are updated.

## 15. Test Matrix

| Layer | Required proof |
|---|---|
| Rust units | registry resolution, duplicate failure, authority floor, envelope/hash, error mapping, provider adapters |
| Node units | deterministic command-manifest export and drift guard |
| Cross-runtime contract | Node/Rust envelope vectors, `version`, `gate-bypass`, exit taxonomy |
| CLI integration | transparent fallback argv/stdin/stdout/stderr/status parity; native commands do not spawn Node |
| Remote integration | peer-host semantic equality; remote presenter never emits `fgos.v1` |
| External plugin | manifest discovery, handshake, echo, logs, timeout, crash, capability refusal |
| Distribution | archive install/upgrade/rollback/uninstall on every supported target |
| Full regression | `npm test` and `cargo test --workspace` |

Run Rust tests with warnings denied in CI. Add a process-spy fixture rather than
inferring provider choice from timing.

## 16. Commit And Review Slices

Keep implementation commits independently revertible:

1. **Contract fixtures:** manifest exporter, envelope vectors, parity harness.
2. **Workspace skeleton:** root workspace, protocol and host-runtime crates.
3. **Legacy bootstrap:** Rust binary plus transparent Node delegation.
4. **Router and peer hosts:** provider registry, CLI/remote use cases, in-memory
   tests.
5. **Native version:** distribution-health provider and parity tests.
6. **Native gate-bypass:** gate-policy provider and parity tests.
7. **External process proof:** fixture manifest/provider and negative tests.
8. **Structured Node bridge:** lifecycle/cancellation/tracing without output
   changes.
9. **Remote gateway adapter:** replace CLI-shelling `VerbGateway` through a
   separately reviewed gateway footprint.
10. **Distribution:** release assets, installer path, setup/doctor, docs, and
    installed-entry cutover.

Do not combine a provider flip with deletion of its Node implementation. The
rollback observation window is a separate slice.

## 17. Risks And Controls

| Risk | Control |
|---|---|
| Rust bootstrap accidentally reparses legacy flags | retain `OsString` argv and delegate remainder unchanged |
| Double `fgos.v1` envelope | legacy output is pass-through; only native semantic outcomes reach Rust envelope writer |
| `data_hash` differs across runtimes | hash once-serialized compact data bytes; cross-runtime golden vectors |
| Provider split divides a write transaction | route whole use case; no write provider in proof milestone |
| Rust CLI resolves Node from caller cwd | executable-relative installed layout plus explicit test override |
| Plugin claims core authority | reserved namespace and fail-closed authority gate |
| Root Cargo workspace changes existing Herdr build | exclude `herdr-plugin` and upstream crates initially |
| New binary cannot ship through current npm path | distribution cutover is a hard gate with spec update and release artifacts |
| Native proof operations become fake micro-components | place them under existing ownership and treat verbs as operations, not one-crate components |
| Remote host remains a CLI wrapper | peer-host contract tests and later replacement of `VerbGateway` with semantic invocation |

## 18. Definition Of Done

The proof milestone is done when all of the following hold:

1. Rust CLI delegates every unmigrated command with tested compatibility.
2. `version` and `gate-bypass` run natively and a process-spy proves no Node
   child is created.
3. CLI and remote host use cases call one Operation Provider Router and produce
   different host presentations from the same semantic outcome.
4. External fixture discovery and invocation pass positive and fail-closed
   negative tests.
5. `npm test` and `cargo test --workspace` are green.
6. Setup/doctor changes required by the new workspace/runtime are registered.
7. The Rust binary is not made the distributed default until Phase 8's install
   and rollback gates pass.
8. A stranger can start with the architecture and migration documents linked at
   the top and reproduce every proof command.

## 19. Decisions Still Required Before Execution

1. Confirm `distribution-health` and `gate-policy` as ownership locations for
   the two proof operations, or map them into already-registered component
   packages before creating directories.
2. Name the initially supported release target matrix from the current product
   support policy; do not infer platforms from CI availability.
3. Choose the post-npm distribution mechanism before Phase 8 implementation.
4. Decide the rollback observation window before deleting either Node path.
5. Decide whether explicit external-provider replacement of a built-in remains
   deferred; this plan assumes it is prohibited.
