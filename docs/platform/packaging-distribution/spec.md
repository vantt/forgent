# Spec: Packaging-Distribution

```txt
Document type: Area spec
Audience: Human reviewer, maintainer, implementation agent
Purpose: State the user-visible and maintainer-visible behavior of fgOS packaging/distribution
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, README.md, code/test scan
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/specs/distribution.md
- docs/distribution-vision.md
```

## 1. Purpose

Packaging-distribution defines how fgOS is packaged, installed, selected for a workspace, repaired, upgraded, and kept compatible with the existing Node CLI payload.

The spec is written for current behavior and near-term accepted target behavior. Target-only claims must link to implementation status in `verification/implementation-alignment.md`.

## 2. Entry Points

| Entry point | Status | Purpose |
| --- | --- | --- |
| `install.sh` | Implemented | Installs `fgctl` from release assets into a machine-local install directory. |
| `fgctl init` | Partial | Initializes a project/workspace from a staged or acquired fgOS release. |
| `fgctl upgrade` | Partial | Moves a workspace activation to another release when supplied. |
| `fgctl repair` | Partial | Repairs a workspace installation under the selected release model. |
| `.fgos/installation/bin/fgos` | Partial | Stable workspace command surface after activation. |
| `npm install -g github:vantt/forgent` | Implemented compatibility | Installs the legacy Node `fgos` and `fgos-runner` entry points. |
| `scripts/fgos-shell-integration.sh` | Implemented | Contributor/dev helper that resolves fgOS command tiers from shell functions. |
| local `fgos init` | Partial target | Adopts/materializes workspace state after `fgctl` publishes a ready activation. |
| `fgos doctor` | Implemented | Reports environment checks without writing by default. |
| `fgos doctor --fix` | Implemented | Runs registered fixes and then reports checks. |
| `fgos setup` | Implemented deprecated legacy compatibility | Wires local development support and runs registered environment repairs in the current Node CLI; command surfaces point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`, while shell/global integration remains compatibility behavior until a compatibility-window decision retires it. |

## 3. Install Channels

## 3.1 Recommended Native Channel

The README recommends the release install script:

```bash
curl -fsSL https://raw.githubusercontent.com/vantt/forgent/main/install.sh | sh
```

This installs `fgctl`, then the user initializes a project with:

```bash
fgctl init
```

Implementation evidence includes `install.sh`, `.github/workflows/release.yml`, `.github/workflows/ci.yml`, `test/install/install-sh.test.mjs`, and `scripts/ci-external-consumer.sh`.

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
