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
| `fgctl upgrade` | Implemented preview | Moves a workspace activation to a new release chosen by `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the latest GitHub release (checksum-verified against `SHA256SUMS` when downloaded), records the previous release for rollback, and updates `.fgos/distribution.json` (including `releaseVersion` when downloaded). |
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

Implementation evidence includes `packages/distribution/rust/src/fetch.rs`, `packages/distribution/rust/tests/fetch_download.rs`, the download tests in `test/rust-host/fgctl-init-download.test.mjs` and `test/rust-host/fgctl-init-download-sources.test.mjs`, `install.sh`, `.github/workflows/release.yml`, `.github/workflows/release-assets.yml`, `.github/workflows/ci.yml`, `test/install/install-sh.test.mjs`, `test/install/install-ps1.test.mjs`, `scripts/install.ps1`, `packages/distribution/rust/src/shim.rs`, `scripts/package-release-assets.mjs`, `scripts/check-glibc-ceiling.sh`, `scripts/ci-external-consumer.sh`, and `scripts/ci-external-consumer.ps1`.

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

## Retained Distribution Source Detail

Added in candidate — complete source units from `docs/specs/distribution.md` at blob `13d2e172de35a570d148022d4c859cac05223acb`, after the boundary main sync. Dated decisions, implementation rules and recorded gaps are retained; current assertions remain subject to the independent truth sample.

---
area: distribution
updated: 2026-10-13
sources: [distribution-packaging, str76-runner-bootstrap, str77-79-doc-gap-fixes, str87-fgos-install-ux, str88-fgos-pnpm-lifecycle, str87-fgos-setup-doctor]
decisions: [12aedbc8, 469f4c79, 5d669ff6, 38f7e0b8, ea8b9a8d, cbb4736a, 862ac01f, b799cbaa, 563db0a9, e52cc667, e8852403, 4cb11e46, 589eb4b0, 175cfc08, 1005dae0, 4206a0a6, 7d982955, ef531b22]
coverage: full
---

```txt
Legacy status: Promoted source
Promoted to:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/history/distribution-baseline.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Generated/curated source facts during migration
Do not use this legacy file for: Final human navigation or post-migration authority
Last reviewed: 2026-09-13
```

### Spec: Distribution

How a developer gets the `fgos` and `fgos-runner` commands running — either
onto their own machine and into their own project from outside the forgent
source repository, or directly from inside a checkout of the source
repository itself, without a separate install. Used by: a developer who
wants to run `fgos` in a project that is not this repo, and a forgent
contributor working inside this repo's own checkout (or a linked worktree
of it).

#### Entry Points & Triggers

- `npm install -g github:vantt/forgent` (run anywhere) → resolves and installs
  the `fgos` command globally from the forgent GitHub repository.
- After install, `fgos init` (run inside the target project) → the existing
  init/doctrine/marker-detection behavior, unchanged and owned by the
  coexistence area — see `docs/coexistence.md`.
- Sourcing the dev checkout's shell helper file from a contributor's own
  shell profile → makes `fgos` and `fgos-runner` available directly from any
  location inside a checkout of the forgent source repository itself
  (including a linked git worktree of it), with no separate install step.
- `fgos setup` (run anywhere) → deprecated legacy compatibility command;
  wires the shell helper's source line into every shell profile the caller
  actually has, and brings the local config file up to date with the current
  defaults. New workspace onboarding should use `fgctl init` (which
  downloads the latest release when `.fgos/distribution.json` is absent, RUL15 (fgctl init downloads a checksum-verified release when no source is given))
  plus local `fgos doctor --fix` and `fgos doctor`; `doctor --fix` runs only registered fixes, so the
  config defaults, hook wiring and Claude Code hook still come from one `fgos
  setup` in the project. Shell/global integration remains legacy setup
  compatibility until the compatibility-window decision retires it.
- `fgos doctor` (run anywhere) → reports whether the environment is set up
  correctly (Node/git present, shell helper sourced, config up to date).

#### Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

#### Behaviors & Operations

##### Install

- **Blocked when:** the installer's machine cannot reach GitHub over the
  network, or does not have Node.js 18+ available.
- **What changes:** the installer's package manager (npm, pnpm, or yarn)
  resolves the forgent GitHub repository, packages it according to the
  distribution file allowlist, and installs both CLI entry points — `fgos`
  and `fgos-runner` — into the caller's chosen install location (global or
  project-local, per the installer's own install flags), both immediately
  executable. The install resolves against whatever ref the installer's own
  command names: a tagged release commit when the command names a tag
  (`README.md`'s recommended path,
  `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md`),
  or the source repository's default branch when it doesn't (the
  bleeding-edge path README also documents) — preparing release metadata is
  scripted by `npm run release:prepare -- <tag>`, but tag-cutting itself stays
  a manual, repo-owner-judgment act (per tsk-jtb). Pushing a `v*` tag then
  triggers the release workflow that builds assets, verifies the external
  consumer path, and publishes the GitHub Release. The
  install runs
  no lifecycle script of its own — there is nothing for a package manager's
  build-script policy (e.g. pnpm's `allowBuilds`) to approve or block, so the
  install succeeds the same way regardless of which of the three package
  managers runs it (per str88-fgos-pnpm-lifecycle).
- **Side effects:** none beyond the local install; no registry account is
  created or touched, and nothing is published to the public npm registry.
- **Afterwards:** the installer has a working `fgos` command. The content
  they received is limited to the distribution file allowlist — the source
  repository's own internal data (its live event log, its own dogfood
  runner configuration, its test suite) is never part of what they receive.
  The installer also receives the end-user documentation subset (how-to
  guides, design-rationale docs, and the read-by-tag index) — every link the
  README's Documentation section points to resolves to a file that is
  actually present in what they installed; contributor/maintainer-only docs
  (decision records, area specs, the product backlog, platform foundations)
  are not part of the install and are not linked from that section — a
  reader who wants those clones the source repository instead.

##### Dev checkout shell helpers

- **Blocked when:** the current location is not inside any git repository —
  sourcing the helper file still succeeds (it only defines functions), but
  calling `fgos` or `fgos-runner` then fails immediately with a clear error
  and a non-zero exit, before anything is invoked.
- **What changes:** once sourced, `fgos` and `fgos-runner` become available
  as ordinary shell commands. Each resolves the checkout's own root the
  moment it is called — using the current location, not where the file was
  sourced from — then runs that checkout's `fgos`/`fgos-runner` entry point
  with whatever arguments were passed.
- **Side effects:** none — nothing is installed, no file outside the current
  shell session is touched, and no other install mechanism (npm or
  otherwise) is affected.
- **Afterwards:** a contributor working anywhere inside a checkout of this
  repository — the main checkout or a linked git worktree of it — has both
  commands available without a separate install, and without needing to
  remember or type the checkout's own path. Sourcing the file is always the
  contributor's own explicit action; nothing in this repository sources it
  for them.

#### Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer / contributor |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |
| Source the dev checkout shell helper file | n/a (nothing to source outside a checkout) | ✓ (opt-in, from their own shell profile) |
| Run `fgos setup` (writes shell profile + config) | ✓ | ✓ |
| Run `fgos doctor` (read-only diagnostic) | ✓ | ✓ |

#### Business Rules

- **RUL1 (distributed package never includes the source repo's own runtime data).** The distributed package never includes the source repository's own
  runtime data directory or its own dogfood runner configuration — install
  content is always limited to the distribution file allowlist.
- **RUL2 (distribution is a GitHub install, not an npm registry publish).** Distribution happens by installing directly from the GitHub
  repository, not by publishing to the public npm registry — no package
  rename and no registry publish credentials are involved.
- **RUL3 (install never changes init/doctrine/marker-detection behavior).** Installing fgos does not change init/doctrine/marker-detection
  behavior in any way — that behavior belongs entirely to the coexistence
  area and is unchanged by installation.
- **RUL4 (every README Documentation link resolves to a shipped file).** Every link in the README's Documentation section resolves to a
  file that is actually present in the distribution file allowlist — a link
  to content that isn't shipped is a defect, not an acceptable pointer to
  "clone the repo for more" (per str77-79-doc-gap-fixes / ea8b9a8d).
  Contributor/maintainer-only documentation (decision records, area specs,
  the product backlog, platform foundations) is intentionally excluded from
  both the allowlist and that section — it is out of scope for an installed
  end user, not an oversight.
- **RUL5 (dev checkout shell helper is never sourced automatically).** The dev checkout shell helper file is never sourced automatically
  by any install step or other mechanism in this repository — a contributor
  adding it to their own shell profile is always their own explicit,
  separate action.
- **RUL6 (install never runs a lifecycle script).** Installing (from any of npm, pnpm, or yarn) never runs a lifecycle
  script of its own — the contributor hooks setup is always a separate,
  manually-invoked command, never an automatic `prepare`/`postinstall` step
  (per str88-fgos-pnpm-lifecycle). This is what lets every package
  manager's own build-script approval policy stay out of the way entirely,
  rather than needing to be satisfied.
- **RUL7 (setup/doctor cover both bash and zsh).** `fgos setup` and `fgos doctor` both cover bash and zsh — neither
  shell is treated as a lesser case.
- **RUL8 (setup's config update never overwrites a customized setting).** `fgos setup`'s config update never overwrites a setting the
  caller already customized, at any nesting depth; array-valued settings
  are never partially merged, only added wholesale when entirely missing.
- **RUL9 (doctor's default path never writes anything).** `fgos doctor`'s default (no `--fix`) path never writes
  anything, under any circumstance, including when a check would
  otherwise need to create a file to check it — a missing config file is
  reported as missing, never created as a side effect of checking.
  `--fix` is the deliberate exception: it runs every registered fix
  (Data Dictionary #7b) before re-reporting checks — reversed from the
  original no-exceptions wording per `tsk-2qz`, which reverses this
  rule and RUL11 (doctor --fix exists and is real, runs every registered fix) together (`docs/history/doctor-fix-gate-bypass/
  CONTEXT.md`).
- **RUL10 (setup never asks for confirmation, acts then reports).** `fgos setup` never asks for confirmation before writing to a
  shell profile or the config file — it acts and then reports exactly what
  it changed. Every other verb, and both of these two without
  `--pretty`, still produce the same enveloped-JSON result shape as before
  this feature — `--pretty` only changes how that same result is displayed,
  never what it contains.
- **RUL11 (doctor --fix exists and is real, runs every registered fix).** `fgos doctor --fix` exists and is real: it runs every fix
  registered via `registerFix` (Data Dictionary #7b) against the current
  cwd before re-reporting checks, then returns the same checks shape as
  the no-flag path plus a `fixed` array. The fix list is a registry, not
  a fixed set — a module can register a new one the same way a check or
  config-default is registered, independent of either (per tsk-2cs). This
  supersedes the original v1 "does not exist yet, Deferred Idea" wording
  — `tsk-2qz` reverses that decision deliberately, per
  `docs/distribution-vision.md` §3's trụ cột 3.
- **RUL12 (setup also runs every registered fix, unconditionally).** Legacy `fgos setup` also runs every registered fix (the same
  `runFixes()` `doctor --fix` calls per RUL11 (doctor --fix exists and is real, runs every registered fix)), unconditionally and with no
  confirmation — consistent with RUL10 (setup never asks for confirmation, acts then reports)'s own act-then-report contract for
  this deprecated compatibility verb, not an exception to it. `setup`'s result gains a `fixed` array,
  the same per-entry `{id, changed, message}` shape RUL11 (doctor --fix exists and is real, runs every registered fix) already describes
  for `doctor --fix`'s own (per `tsk-5hi`,
  `docs/history/setup-runs-registered-fixes/CONTEXT.md`).

- **RUL13 (customer customization lives in one tracked workspace folder; fgOS reads it first and never writes it; specified 2026-10-07; the lookup, the same-tier rule and the doctor check are built (runner decision 0057), the `fgctl init` skeleton and README are not).** A customer project that wants its own agent definitions (persona, role, decision boundary) puts them in `fgos/agents/<name>.yaml` at its project root. It is not `.fgos/`: that folder is runner state, ignored by git (`/.fgos/*`), every merge that stages a change under it is refused (`fgos-write-rejected`), and a fresh worktree has it stripped (ADR0020 (the runner strips .fgos/ from every fresh worktree)). It is not `.agents/` either: that is generated skill output which `fgos setup` and `npm run build:skills` rewrite. The first scope is `agents/` only; `workflows/`, `task-specs/` and `skills/` follow the same layout when a customer needs them, not before.
  - Lookup, by name, first match wins: the workspace folder, then a domain or extension (`domains/<name>/agents/`), then the installed `core/agents`. A higher tier replaces the whole file of a lower one; fields are never merged. Two definitions of one name in the same tier are an error that `fgos doctor` reports, never a silent pick. This replaces the earlier rule that a name is unique across `core/agents` and every domain: a name is unique within a tier and a higher tier shadows a lower one.
  - fgOS creates the folder and a README once, at onboarding (`fgctl init`), and never edits it afterwards; an fgOS upgrade never touches it. The installed tier is located through the release manifest, never through the working directory or PATH.
  - Built: `src/runner/agent-definitions.mjs` is the one lookup (workspace, then `domains/*/agents/`, then `core/agents/`; a project without its own `domains/` or `core/agents/` folder reads the running package's). `fgos workflow start --seats "@name|..."` uses it and pins the text at start. The doctor check `agent-type-names-unique` now means unique within each tier, covers `fgos/agents`, and reports which definition each customization replaces. The unit-level and capability-level `persona:` names still read `core/agents` of the working project at dispatch.
  - A doctor check registers with the feature and reports each customization, which installed definition it shadows, whether it has the shape the loader needs, and a shadowed core name or an override that no longer fits the installed set after an upgrade.
  - Not customizable here: executor, model and provider policy (`config.json`) and the platform laws. An extension is treated as a domain until an extension loader exists.
  - No component-boundary change: it extends the three-tier discovery convention coordination protocols already use (project, `domains/<name>/`, packaged `core/`) to agent definitions.

- **RUL14 (the lazy-probe unlock rule: moved).** The rule that unlocks an account locked for a dead login with one real call now lives with the provider-capacity rules in `docs/specs/runner.md` (RUL74 (lazy-probe unlock: an account locked for a dead login unlocks itself after one real call that succeeds)), together with the refresh-ahead and write-back rules for a rotating login (RUL75 (a rotating provider login is renewed once at the source, in a copy fgOS holds, and a login renewed inside a private home is written back)). This document keeps only where the state lives (row 5d).
- **RUL15 (`fgctl init` needs no hand-downloaded tarball: it picks its release by a fixed precedence and downloads it checksum-verified; 2026-10-12).** The release `fgctl init` installs comes from the first of these that is set:
  1. `--from <path | URL>` on the command line;
  2. the `FGCTL_FROM=<path | URL>` environment variable (same meaning as the flag, for a non-release build: a `.tar.gz`, a release directory, or a URL);
  3. `FGCTL_VERSION=<tag>`, which downloads exactly that tag's asset (needed for a pre-release, which "latest" never selects);
  4. the release pinned by the project's committed `.fgos/distribution.json` (no network when that release is staged on the machine; otherwise see "The pin records the tag" below);
  5. otherwise the latest GitHub release, found by following `<repo>/releases/latest` to its tag.
  - An explicit source (1-3) beats a pin; the pin then only validates what was fetched (a different digest is refused as a pin mismatch, as for `--from` today). The inputs are read per invocation; nothing is remembered.
  - **The pin records the tag.** When `fgctl init` or `fgctl upgrade` installs from a download (latest or `FGCTL_VERSION`) and writes `.fgos/distribution.json`, it stores the resolved tag in `projectRuntime.releaseVersion` next to the digest (a local or URL source writes a digest-only pin with a null `releaseVersion`, never the build's own manifest version, which is not a download name; `init` never rewrites an existing pin, while `upgrade` rewrites the pin to the upgraded release). A pin with a tag whose digest is not staged on this machine (a teammate's fresh clone, or a quarantined release) makes a plain `fgctl init` download that tag, checksum-verified; the pin's digest must equal what was fetched, else `pin-mismatch` and nothing is activated. A tag written without the leading `v` (a hand-edited pin, for example `0.2.0`) is read as `v0.2.0`, the form releases are tagged in; if the download still fails, the error names the pinned tag and points to `FGCTL_VERSION` and `FGCTL_FROM` instead of surfacing a bare HTTP error. A digest-only pin (no tag) keeps the old behavior: it needs `--from`, `FGCTL_FROM` or `FGCTL_VERSION` on a machine that has not staged it.
  - A download fetches `fgos-<tag>-<target>.tar.gz` and `SHA256SUMS` through the system `curl` with the same flags, timeouts and `FGCTL_ASSET_BASE_URL` override as `install.sh`; there is no HTTP/TLS library in `fgctl`. The target is detected the way the installers do (`FGCTL_TARGET` overrides; `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` are supported, see RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)) and an unsupported target refuses before any request.
  - Verification is mandatory: the asset's own entry in `SHA256SUMS` (file name matched exactly) must equal the downloaded file's SHA-256, otherwise `fgctl init` / `fgctl upgrade` refuses and writes nothing (no staging, no pin, no activation). A URL source must have `SHA256SUMS` in the same directory; a local path is trusted as given. The download lives in a private scratch directory under `${TMPDIR:-/tmp}/fgos-work/` that is removed when the command returns, success or not.
  - The project must be inside a git repository, checked before any request is made (unchanged). `fgctl upgrade` resolves its candidate by `--from <path | URL>` > `FGCTL_FROM` > `FGCTL_VERSION` > the latest GitHub release (it ignores the current pin so a plain `fgctl upgrade` moves to the latest release). `fgctl stage` still takes only `--from <path>`; it does not download.
  - `curl` is an assumed tool (on Windows, the `curl.exe` that ships with Windows 10 and later): the `curl-available` doctor check reports it.
- **RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell; 2026-10-13).** fgOS runs from a plain PowerShell or `cmd.exe` session on Windows 10 and later, with no Git Bash and no WSL.
  - **Assets.** A release publishes, per target, `fgos-<tag>-<target>.tar.gz` and `fgctl-<tag>-<target>.tar.gz` for `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc`, one `SHA256SUMS` covering every asset, and both installers (`install.sh`, and `install.ps1`, which lives at `scripts/install.ps1` in the repository because the root-file allowlist is closed and is published under the name `install.ps1`). `tar.gz` is the one archive format on every target: Windows 10 and later ship `tar.exe` and `curl.exe`, and the Rust extractor already reads it. The Windows `fgos` tree carries the host as `bin/fgos.exe` (and `bin/fgos`, the manifest's entry name), a `bin/fgos-runner.cmd` beside the `sh` form of `bin/fgos-runner`, and declares `target: {os: windows, arch: x64}`. The Linux asset is built on `ubuntu-22.04`, and the build fails when a shipped binary needs a glibc symbol newer than `GLIBC_2.35` (`scripts/check-glibc-ceiling.sh`), so a binary never prints a loader error on the oldest supported distribution. A new platform is one row in `src/util/release-targets.mjs`, one in the Rust `host_target` table, one in each installer and one release-workflow matrix entry; macOS is not published.
  - **`install.ps1`.** Same contract as `install.sh`: `FGCTL_VERSION`, `FGCTL_INSTALL_DIR` (default `%LOCALAPPDATA%\fgos\bin`), `FGCTL_ASSET_BASE_URL` (http, https or `file://`), `FGCTL_TARGET`; the tarball's own `SHA256SUMS` entry must match or nothing is installed; a symlinked `fgctl.exe` is refused; every request is bounded by a timeout. It needs no administrator rights (an elevated session is refused unless `FGCTL_ALLOW_ROOT=1`, as `install.sh` refuses root), never changes `PATH`, and prints the commands that do. Like `install.sh`, with no `FGCTL_VERSION` it installs the latest NON-prerelease, so a pre-release needs `FGCTL_VERSION`.
  - **Workspace launchers.** `fgctl init` and `fgctl repair` write four launchers into `.fgos/installation/bin/`: the `sh` pair `fgos`, `fgos-runner` (Linux, macOS, Git Bash) and the batch pair `fgos.cmd`, `fgos-runner.cmd` (PowerShell, `cmd.exe`; no `sh` involved). Each reads `activation.json`, refuses with exit 3 unless `status` is `ready`, and runs the active release's entry. A directory on `PATH` holding them makes `fgos` resolve in PowerShell through `PATHEXT`. The post-activation tail (`init`, `doctor --fix`, `doctor`) runs the `.cmd` form on a Windows host. `fgctl verify` checks that the launchers its host needs (the `sh` pair everywhere, the batch pair too on Windows) exist and equal what this `fgctl` writes; a missing or edited one is reported with `run fgctl repair` and never quarantines the (intact) release.
  - **Proof.** Pushing a release tag builds both targets and runs a consumer proof on each, and only when both pass does the publish job run; publishing exists only in `release.yml`. The Windows proof (`scripts/ci-external-consumer.ps1`, under Windows PowerShell 5.1 and PowerShell 7) installs `fgctl` with `install.ps1`, runs `fgctl init` against a local release server, runs the activated `fgos` from PowerShell and from `cmd.exe`, and checks that a tampered download is refused by both the installer and `fgctl init`.
  - **Not covered.** Windows ARM64 and macOS have no asset. The machine release store stays at `%USERPROFILE%\.local\state\fgos` (`FGOS_STATE_HOME` moves it); relocating it to `%LOCALAPPDATA%` is a separate decision.
- **RUL17 (one `fgos` on PATH runs each project's own activated fgos; `doctor --fix` provides it; 2026-10-13).** A release install puts only `fgctl` on PATH and `fgctl init` activates a release per project, so a plain `fgos` used to need an absolute path. `fgos doctor` check `project-fgos-launcher` and its registered fix own the answer, and `fgctl init` already ends by running `doctor --fix`:
  - The fix writes one small launcher named `fgos` (`fgos.cmd` on Windows) into the directory `fgctl` was found in on `PATH`. The launcher walks up from the working directory to the nearest `.fgos/installation/bin/fgos` and runs it with the same arguments, so each project runs the release it activated, from any subdirectory, in any shell, interactive or not; it edits no rc file. Outside a project it exits 127 and says to run `fgctl init`.
  - The launcher carries a marker line. The check reports `ready`, an out-of-date copy (rewritten by the fix), a foreign `fgos` found first on `PATH` (never overwritten; the check names it), no `fgos` with `fgctl` on `PATH` (the fix writes it), or neither on `PATH` (the check says to add the directory `fgctl` was installed into).
  - A source checkout keeps the sourced shell-integration script and needs no launcher; the check passes there.
  - Proof: `test/setup/project-launcher.test.mjs` (two projects and a nested one each run their own fgos; the `cmd` launcher runs on Windows in the focused Windows job).

#### Lịch sử quyết định

- **2026-10-12 — `fgctl init` downloads by default (RUL15 (fgctl init downloads a checksum-verified release when no source is given)).** Before this, a plain `fgctl init` in a project with no pin failed with "`--from <source>` is required", so a first install meant downloading the release tarball by hand. Owner decision: no source and no pin means the latest GitHub release; `FGCTL_VERSION` selects an exact tag; `FGCTL_FROM` and `--from` select a non-release build; checksum verification is mandatory; the transport is the system `curl` rather than a new HTTP crate (same behavior and override as `install.sh`, no TLS stack to carry in `fgctl`). Prior art: `fgctl init --from` (the release-asset door, kept unchanged and now equivalent to `FGCTL_FROM`), `install.sh`'s `FGCTL_VERSION`/`FGCTL_ASSET_BASE_URL`/`FGCTL_TARGET` (reused, not redefined). Same day, follow-up: the pin now records the tag, so a pinned workspace whose release is not staged on this machine downloads it instead of needing a source; only a digest-only legacy pin still needs `FGCTL_FROM`/`FGCTL_VERSION`/`--from`, because a digest names no download. Follow-up (2026-10-14): `fgctl upgrade` uses the same verified download pipeline (`--from` > `FGCTL_FROM` > `FGCTL_VERSION` > latest GitHub release) and records the downloaded tag in `.fgos/distribution.json`, so an upgraded project's pin keeps a downloadable `releaseVersion` for teammates instead of reverting to digest-only.
- **2026-10-13 — Windows is a native release target (RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)).** Owner decision: the level is "native, complete" (PowerShell and `cmd.exe`, no Git Bash, no WSL), with `tar.gz` kept as the single archive format and macOS left out of scope. Prior art, reused: the Windows CI hardening track made the Rust workspace build and the release-tree staging work on Windows (the `fgos.exe` entry, colon-free release store directory names, drive-letter-safe archive validation), and an earlier change wrote `.cmd` launchers on Windows that ran the `sh` shims through a `sh` on `PATH`; that required Git for Windows, so it is replaced by launchers that read `activation.json` themselves. Missing before: a Windows release asset, `install.ps1`, a Windows consumer proof, and any check that the launchers exist. Also in this change: the Linux asset moves from `ubuntu-latest` (binaries then needed glibc 2.39 and printed a loader warning on Ubuntu 22.04, glibc 2.35) to `ubuntu-22.04`, with a CI gate on the glibc symbol versions.

#### Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.
- A release tree staged for `fgctl` (`scripts/build-rust-distribution.mjs`)
  carries the legacy-node payload TOGETHER WITH its production dependencies
  (the package's `dependencies` and theirs), copied next to the sources, so
  every verb runs from the installed release alone. Before this, the staged
  tree held no dependencies and any verb that loads one (`fgos workflow`,
  found when dogfooding a project that had run `fgctl init`) failed with a
  missing-package error while `fgos version` and `fgos doctor` still passed.
  A dependency that is not installed when the tree is built fails the build
  instead of thinning the payload; two installed copies of one name are
  refused. The external-consumer CI step runs a dependency-loading verb for
  this reason, because `version` never imports one.
- An agent in a project with no `bin/` (only the installed `fgos`) finds how
  to run anything from `fgos --help --json` and `fgos <verb> [<sub>] --help
  --json`. The host's route table carries two option selectors, `--help` and
  `-h`, generated from `HELP_SELECTORS` in `src/cli/command-registry.mjs`
  like every verb route and sent to the legacy-node payload, which owns the
  verb manifest; every other leading option still has no route and exits 4.
  A Rust-native verb given an exact `--help`/`-h` token anywhere after it is
  sent to the payload too, so it prints its manifest entry instead of
  running. `fgos version` lists verbs only, never the two help selectors.

#### Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the `fgctl init` skeleton and README, and routing the unit-level and capability-level `persona:` names through the same three-tier lookup (only `--seats @name` uses it today; those names are still read from `core/agents` of the working project in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`). How an extension declares its root is undefined: no extension loader exists, only the domain layer.

#### Visuals

Not applicable — no screen; this is a command-line install flow.

#### Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
