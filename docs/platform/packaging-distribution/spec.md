# Spec: Packaging-Distribution

```txt
Document type: Area spec
Audience: Human reviewer, maintainer, implementation agent
Purpose: State the user-visible and maintainer-visible behavior of fgOS packaging/distribution
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, README.md, code/test scan
Last reviewed: 2026-10-13
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/specs/distribution.md
- docs/distribution-vision.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

Packaging-distribution defines how fgOS is packaged, installed, selected for a workspace, repaired, upgraded, and kept compatible with the existing Node CLI payload.

The spec is written for current behavior and near-term accepted target behavior. Target-only claims must link to implementation status in `verification/implementation-alignment.md`.

## 2. Entry Points

| Entry point | Status | Purpose |
| --- | --- | --- |
| `install.sh` | Implemented | Installs `fgctl` from release assets into a machine-local install directory. |
| `install.ps1` | Implemented preview | The Windows counterpart of `install.sh` (PowerShell 5.1 or later, no administrator rights, no `PATH` change): installs `fgctl.exe` for `x86_64-pc-windows-msvc` with the same `FGCTL_VERSION` / `FGCTL_INSTALL_DIR` / `FGCTL_ASSET_BASE_URL` / `FGCTL_TARGET` semantics and a mandatory `SHA256SUMS` check (rule RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell) in `docs/specs/distribution.md`). |
| `fgctl init` | Implemented preview | Initializes a project/workspace from a release chosen by `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the committed pin > the latest GitHub release; a downloaded asset is checksum-verified against `SHA256SUMS` before staging (rule RUL15 (fgctl init downloads a checksum-verified release when no source is given) in `docs/specs/distribution.md`). |
| `fgos` launcher | Implemented preview | One `fgos` (`fgos.cmd` on Windows) written next to `fgctl` by `fgos doctor --fix` (which `fgctl init` runs): it walks up to the nearest `.fgos/installation/bin/fgos` and runs it, so each project runs its own activated release with no absolute path and no rc edit. A different `fgos` found first on `PATH` is reported, never overwritten. See distribution spec RUL17 (one fgos on PATH runs each project's own activated fgos). |
| `fgctl upgrade` | Implemented preview | Moves a workspace activation to another release when supplied; current preview proof covers no-op upgrade against the verified asset. |
| `fgctl repair` | Implemented preview | Repairs a workspace installation under the selected release model; current preview proof covers repair after activation. |
| `.fgos/installation/bin/fgos` | Implemented preview | Stable workspace command surface after activation; current preview proof reports `host: "rust"` and the activated `artifactDigest`. |
| `.fgos/installation/bin/fgos.cmd`, `fgos-runner.cmd` | Implemented preview | The same stable surface for PowerShell and `cmd.exe`, written by `fgctl init`/`repair` next to the `sh` pair and needing no POSIX shell; `fgctl verify` reports a missing or edited launcher and `fgctl repair` regenerates it. |
| `npm install -g github:vantt/forgent` | Implemented legacy deprecated | Installs the legacy Node `fgos` and `fgos-runner` entry points; explicit deprecated escape hatch during the compatibility window, not the public/default posture. |
| `scripts/fgos-shell-integration.sh` | Implemented | Contributor/dev helper that resolves fgOS command tiers from shell functions. |
| local `fgos init` | Partial target | Adopts/materializes workspace state after `fgctl` publishes a ready activation. |
| `fgos doctor` | Implemented | Reports environment checks without writing by default. |
| `fgos doctor --fix` | Implemented | Runs registered fixes and then reports checks. |
| `fgos setup` | Implemented deprecated legacy compatibility | Wires local development support and runs registered environment repairs in the current Node CLI; command surfaces point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`, while shell/global integration remains compatibility behavior through the 30-day preview fallback window unless a later release decision replaces it. |

## 3. Install Channels

**Release posture (coordinator decision, preview published 2026-09-18):** preview. External installs default `fgos` through the Rust host (3.1), and public docs may state the Rust host as the default installed runtime. The legacy Node channel (3.2) remains only as the settled, explicit deprecated escape hatch for 30 calendar days after the preview release publication date. Public preview tag `v0.1.0` was published on 2026-09-18, so the earliest removal date for this preview release is 2026-10-18 unless a later release decision replaces that support promise.

## 3.1 Recommended Native Channel

The README recommends the release install script:

```bash
curl -fsSL https://raw.githubusercontent.com/vantt/forgent/main/install.sh | sh
```

This installs `fgctl`, then the user initializes a project with:

```bash
fgctl init
```

With no pin and no explicit source, `fgctl init` downloads the latest release through the system `curl` and refuses unless the asset matches its `SHA256SUMS` entry. `FGCTL_VERSION=<tag>` selects an exact tag (pre-releases are never "latest"); `FGCTL_FROM=<path | URL>` or `--from` installs a non-release build. `install.sh` itself defaults to the latest release and takes `FGCTL_VERSION` the same way.

## 3.1.1 Windows Native Channel

On Windows 10 and later, from a plain PowerShell session (no Git Bash, no WSL, no administrator rights):

```powershell
irm https://github.com/vantt/forgent/releases/latest/download/install.ps1 | iex
fgctl init
```

`install.ps1` installs `fgctl.exe` into `%LOCALAPPDATA%\fgos\bin` (or `FGCTL_INSTALL_DIR`) and prints, without running, the commands that put that directory on `PATH`. Like `install.sh` it takes the latest NON-prerelease unless `FGCTL_VERSION` names a tag, so a pre-release such as `v0.2.0-rc.2` needs `FGCTL_VERSION`. `fgctl init` then downloads the `x86_64-pc-windows-msvc` asset through the `curl.exe` that ships with Windows, verifies it against `SHA256SUMS`, and writes the workspace launchers: `.fgos/installation/bin/fgos.cmd` and `fgos-runner.cmd` for PowerShell and `cmd.exe`, beside the `sh` pair for Git Bash. A release publishes the same asset set for `x86_64-unknown-linux-gnu` (built on `ubuntu-22.04`, with a CI gate that its binaries need no glibc newer than 2.35) and `x86_64-pc-windows-msvc`; macOS is not published. The full rule is RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell) in `docs/specs/distribution.md`.

Implementation evidence includes `packages/distribution/rust/src/fetch.rs`, `packages/distribution/rust/tests/fetch_download.rs`, the download tests in `test/rust-host/fgctl-init.test.mjs`, `install.sh`, `.github/workflows/release.yml`, `.github/workflows/release-assets.yml`, `.github/workflows/ci.yml`, `test/install/install-sh.test.mjs`, `test/install/install-ps1.test.mjs`, `scripts/install.ps1`, `packages/distribution/rust/src/shim.rs`, `scripts/package-release-assets.mjs`, `scripts/check-glibc-ceiling.sh`, `scripts/ci-external-consumer.sh`, and `scripts/ci-external-consumer.ps1`.

## 3.2 Legacy Node Compatibility Channel

The GitHub npm install path remains supported for compatibility:

```bash
npm install -g github:vantt/forgent#v0.1.0
```

This installs `fgos` and `fgos-runner` from `package.json` and `bin/*.mjs`. It is a compatibility channel, not the target architecture for project-local runtime identity.

## 3.3 Dev Checkout Channel

Contributors can source:

```bash
source /path/to/forgent/scripts/fgos-shell-integration.sh
```

The helper resolves command tiers in this order:

1. workspace installation;
2. dev checkout;
3. project-local install;
4. global install.

## 4. Runtime Selection

The target runtime selection rule is:

```txt
workspace installation > dev checkout > project-local install > global install
```

Workspace installation is the tier-zero model. When `.fgos/installation/activation.json` points to a valid release and manifest entry, commands should enter through the workspace installation binary.

Legacy global/project install remains valid but should not silently override an activated workspace runtime.

## 5. Release Tree

The native release tree contains:

```txt
bin/fgos
bin/fgos-runner
libexec/legacy-node/
manifest.json
```

The release tree builder refuses unsafe payload shapes such as source entries escaping the checkout, symlinks in release payloads, and non-empty arbitrary output directories. The manifest carries `artifactDigest`, computed from canonical manifest content rather than archive bytes.

Repository, workspace, worker-capsule, release-store, and projection layout boundaries belong to `contracts/repository-runtime-layout.md`. The spec should not inline the full tree; the contract is the source for layout details.

## 6. Doctor, Fix, And Legacy Setup

The target architecture has no separate setup verb for workspace onboarding. One-command workspace onboarding is `fgctl init`; after publishing the ready workspace activation, `fgctl` invokes the active local runtime tail:

```txt
local fgos init
local fgos doctor --fix
local fgos doctor
```

Current legacy `fgos setup` remains implemented and deprecated in the Node CLI and still:

- wires shell/helper and hook support where applicable;
- fills missing config defaults without overwriting customized values;
- applies both project-local and global config default handling;
- runs every registered fix unconditionally, using the same fix registry as `doctor --fix`;
- reports what changed;
- exposes a deprecation path in command help, command manifest JSON, and setup result payloads.

`fgos doctor`:

- runs registered checks;
- does not write by default;
- reports pass/fail and what to do next.

`fgos doctor --fix`:

- runs every registered fix;
- then reports checks;
- uses named fix registrations rather than ad hoc command-specific repair logic.

Exact registry behavior and legacy setup compatibility belong to `contracts/setup-doctor-registry.md`.

## 7. Global, Project, And Dev Contexts

fgOS recognizes multiple contexts on one machine:

| Context | Rule |
| --- | --- |
| Workspace activation | Highest-priority runtime selection when valid. |
| Dev checkout | Contributor self-hosting path. |
| Project-local install | Local `node_modules/.bin/fgos` can be selected before global install. |
| Global install | Fallback path, with cache populated by registered fix paths. |
| Project config | Overrides global config for matching keys. |
| Global config | Fills missing project config keys and stores machine-wide defaults/cache. |

## 8. Plugin And Skill Packaging

Skill packaging is a distribution concern when one canonical fgOS skill must be rendered into host-specific surfaces:

- `.agents/skills` for portable Codex/OpenAI skill projection;
- `.claude/skills` for Claude wrapper projection;
- `plugins/fgOS/skills` for plugin-only consumers;
- future Gemini extension packaging.

The canonical skill body belongs to the owning component or domain. Packaging-distribution owns only the generated/adapted host surfaces, install packaging, and stale/missing-target checks.

Current implementation assembles canonical skills from `core/skills` and `domains/*/skills`, generates `.agents/skills` and `.claude/skills`, and mirrors required `fgos-*` dev skills into the fgOS plugin. Mirror integrity is tested by `test/skills/fgos-mirror.test.mjs`; doctor/fix checks detect missing or stale plugin packaging surfaces.

Exact source-of-truth, host adapter, trigger vocabulary, and doctor/fix obligations belong to `contracts/skill-package-distribution.md`.

## 9. Instruction Composition And Projection

Instruction packaging is a distribution concern when rules from platform, component, domain, workspace, command, or skill sources must become host-visible instructions.

`AGENTS.md` is the primary portable projection when a host supports it. Host-specific files such as Claude or Gemini context files should be generated only for host syntax, plugin/extension behavior, command surfaces, or compatibility gaps.

The hard contract is merge policy, not Markdown rendering. Composition must resolve rule force, authority, specificity, valid override/refine relationships, and conflicts before rendering any projection.

Exact instruction unit fields, rule force, composition order, conflict rules, effective instruction set, and doctor/fix obligations belong to `contracts/instruction-composition-and-projection.md`.

## 10. Non-Goals

Packaging-distribution does not define:

- workflow semantics after a correct local runtime has been selected;
- shared gateway/dashboard serving many projects;
- confinement policy behavior beyond doctor/fix readiness checks;
- host invocation provider routing inside the selected runtime.

## 11. Verification

Use:

- `verification/implementation-alignment.md` for claim-by-claim status;
- `verification/install-and-release-proof.md` for proof paths and commands.


## Retained Scope Map Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/scope-map.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Packaging Distribution Scope Map

```txt
Legacy status: Promoted migration/source map
Promoted to:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original scope classification source
Do not use this legacy file for: Current canonical navigation
Last reviewed: 2026-09-13
```

> Status: historical redirect. The active area boundary now lives in
> [docs/platform/packaging-distribution/README.md](README.md),
> with preservation tracking in
> [source-preservation-audit.md](verification/source-preservation-audit.md).
> Keep this file only as the discussion-era concern map.

**Status:** Historical architecture discussion map.
**Date:** 2026-09-04.
**Purpose:** Preserve the concern split that was promoted into
`docs/platform/packaging-distribution/**` without letting this old map compete
as the current navigation surface.

Packaging distribution is not one component. It cuts across bootstrap,
runtime payload, project semantics, host surfaces, state authority, skill/prose
materialization, runner autonomy, Rust migration, and product packaging
cleanliness.

This document maps those concerns to the architecture documents that should own
or reference them.

#### 1. Concern Map

| Concern | Core Question | Primary Architecture Home | Notes |
|---|---|---|---|
| Global bootstrap/control | What can the machine-level command install, repair, upgrade, or start? | `docs/platform/packaging-distribution/README.md` | `fgctl` owns bootstrap and machine services. It must not own project workflow semantics. |
| Project-local runtime payload | What exactly is installed into a project and how is it identified? | `docs/platform/packaging-distribution/README.md` | Includes CLI, host/runtime, legacy Node payload, Rust artifacts, runner, adapter, skills, agents, prose, docs, manifest, ledger. |
| Workspace/runtime/work-state topology | How do worktrees share release content and work-state authority without forcing one active runtime or dirtying/racing each other? | `../workspace-topology.md` | Critical for coding-domain worktree isolation. Release store, workspace activation, work-state coordination, and projections have different scopes. |
| Runtime identity records | How does a project prove which fgOS runtime it is running? | `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` | Central contract for version safety, activation, drift detection, downgrade refusal, rollback, and provider identity. |
| Init/doctor/repair | Which layer may create workspace state, materialize projections, repair config, or repair runtime files? | `docs/platform/packaging-distribution/README.md` | Target architecture removes `setup` as onboarding behavior; current `fgos setup` remains deprecated legacy compatibility until a compatibility-window decision retires it. `fgctl init/repair/upgrade` may change runtime identity; local `fgos init`, `fgos doctor --fix`, and final read-only `fgos doctor` operate under the installed identity. |
| Host-visible skills/agents/prose | Where does canonical workshop material live, and how does the host discover it? | `docs/platform/packaging-distribution/README.md`, `docs/architect/component-boundary/README.md` | Canonical source belongs to the local runtime payload; host-visible files are projections with ownership/fingerprint records. |
| Shared web dashboard | Is the web UI one shared surface or one per project? | `docs/platform/packaging-distribution/architecture/future-constraints.md`, later gateway/herdr architecture | Architecture constraint only for now; not active delivery scope. |
| Shared gateway front door | Is the gateway shared or per-project? | `docs/platform/packaging-distribution/architecture/future-constraints.md`, later gateway architecture | Architecture constraint only for now; not active delivery scope. |
| Project Runtime Adapter | Who translates stable web/chat command context into local project semantics? | `docs/platform/packaging-distribution/architecture/future-constraints.md`, `host-invocation-routing/*`, `docs/architect/component-boundary/README.md` | Adapter is versioned with the local project payload. Design enough now so packaging can carry it later; do not implement shared gateway/web now. |
| Host invocation/provider routing | How does a selected payload route an operation to Rust, legacy Node, runner, plugin, or external provider? | `host-invocation-routing/*` | Distribution selects the payload/adapter first; host invocation routes inside that payload. |
| Runner/autonomy payload | Which runner version drives a project? | `docs/platform/packaging-distribution/README.md`, runner architecture/spec later | A runner that mutates project state must come from the selected project's local payload/version. |
| Global daemon/MCP substrate | Which services may be global without owning project semantics? | `docs/platform/packaging-distribution/architecture/future-constraints.md`, later gateway/substrate architecture | Allowed direction: project registry, read-model cache, event/signal/mailbox/bus, process supervision. Not all fgOS verbs as MCP. |
| Rust host release | What artifact shape is needed before Rust becomes the installed public `fgos` entry? | `host-invocation-routing/*`, `docs/platform/packaging-distribution/README.md` | Rust R1 requires install/upgrade/rollback, compatibility payload placement, and payload identity. |
| fgOS self-development cleanliness | How does fgOS dogfood itself without dirtying the product package surface? | `docs/platform/packaging-distribution/README.md`, possibly later self-hosting note | This is a special case of local workshop files coexisting with product source in the same workspace. |
| Coexistence with other harnesses | How does install avoid overwriting another tool's hooks/skills/host files? | `docs/platform/packaging-distribution/README.md`, `docs/architect/component-boundary/README.md` | Preserve D-ADR0009: detect, yield, and require explicit ownership before writing shared host-visible paths. |

#### 2. Historical Document Split

This discussion proposed the split below. The active promoted split now lives
under `docs/platform/packaging-distribution/**`.

```txt
docs/architect/
  workspace-topology.md
    repository/workspace/work-state identities, state classes, modes,
    operation-to-root matrix, lifecycle/failure modes, dirty-tree rules

docs/architect/packaging-distribution/
  README.md
    discussion spine and target model later promoted to platform docs

  scope-map.md
    this file; concern map and document routing

  runtime-identity-and-activation.md
    immutable release manifest, workspace activation binding, pin, projection
    ledger, migration journal outline, invocation lease, drift, rollback,
    quarantine

  future-constraints.md
    future shared web/gateway constraint, Project Runtime Adapter,
    out-of-process protocol, global substrate boundary

  history/distribution-baseline.md
    old Node/npm baseline and generated-spec fragments preserved as input

future optional splits, only when they outgrow runtime identity:
  fgctl-and-local-fgos-contract.md
  workshop-materialization.md
```

[Workspace Topology Architecture](../../architect/workspace-topology.md) must be read before
runtime identity, because packaging consumes topology rather than owning it.
[Runtime Identity And Activation](architecture/runtime-identity-and-activation.md)
is the promoted first packaging-specific contract. Gateway/web itself is not
active delivery scope; its constraints live in
[Future Constraints](architecture/future-constraints.md).

#### 3. Boundary Rule

Use this rule to decide whether a detail belongs in packaging/distribution:

```txt
If the detail affects which fgOS payload is selected, trusted, materialized,
started, repaired, upgraded, or allowed to mutate a project, it belongs in
packaging/distribution.
```

Use this rule to decide whether it belongs elsewhere:

```txt
If the detail assumes the correct local payload is already selected, then it
probably belongs in host invocation, runner, work-state, agent coordination,
domainization, or gateway architecture instead.
```

Examples:

- "Where is `.fgos/runtime/bin/fgos` installed?" belongs to distribution.
- "Which provider handles `work.pick` after the local payload is selected?"
  belongs to host invocation/provider routing.
- "Can shared gateway accept a remote chat command for a project?" belongs to
  gateway/host surface later. For now, distribution only records the boundary
  so local payload shape does not make that impossible.
- "How does shared gateway translate that command into this project's semantic
  verb?" belongs to Project Runtime Adapter, currently recorded under
  distribution because it affects package shape.
- "Which event schema version is valid for this project?" belongs to
  work-state semantically, but distribution must record which local payload
  owns that schema.
- "Where do generated `.agents/skills` files come from?" belongs to
  workshop materialization under distribution.

#### 4. Historical Architecture Position

The promoted direction captured from this old map is:

```txt
fgctl
  machine/global bootstrap and service control

shared web/dashboard
  future one human-visible surface for many projects
  not active delivery scope

shared gateway front door
  future stable remote/chat/UI command contract and project selection
  not active delivery scope

Project Runtime Adapter
  versioned with each project-local fgOS payload
  translates shared UI command context into local project semantics

project-local fgOS payload
  owns workflow semantics, state schema, runner version, skills/prose,
  doctor/init behavior, and provider routing for that project
```

The unresolved future deployment question is behind the shared gateway:

```txt
shared gateway front door
  -> per-request local process
  -> per-project worker process
  -> future project-local daemon
```

That execution choice should remain open until payload identity, adapter
contract, and repair semantics are clearer. Active delivery should focus on
project-local packaging/distribution and Rust `fgos` CLI correctness.

#### 5. Activation Boundary

The activation-boundary shape captured here was:

```txt
acquire artifact
  -> stage immutable release in shared release store
  -> verify release manifest
  -> prepare workspace with candidate runtime
  -> publish ready workspace activation binding atomically
  -> allow project-state mutation
```

No project workflow command should run from a payload that has not crossed the
activation boundary. `fgctl` owns acquisition, staging, verification,
workspace binding publication, repair, upgrade, rollback, and quarantine.
Local `fgos` owns project semantics only after this workspace has a ready
activation binding and the runtime is write-compatible with the selected
work-state root.



## Retained Workspace Runtime Model Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/workspace-runtime-model.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Workspace Runtime Model

```txt
Legacy status: Superseded pointer
Superseded by:
- docs/architect/workspace-topology.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Redirect only
Do not use this legacy file for: Current model detail
Last reviewed: 2026-09-13
```

> Status: historical redirect. Active topology remains
> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active
> packaging-distribution runtime records live under
> [docs/platform/packaging-distribution/](README.md).
> Keep this file only as the old pointer that explains the split.

**Status:** Moved.
**Date:** 2026-09-04.

Workspace/runtime/work-state topology is broader than packaging/distribution.
The canonical architecture document is now:

[Workspace Topology Architecture](../../architect/workspace-topology.md)

Packaging/distribution consumes that topology for release store placement,
workspace activation binding, projection ledger scope, leases, and dirty-tree
rules. Do not update this file with new topology decisions; update
`docs/architect/workspace-topology.md` instead.
