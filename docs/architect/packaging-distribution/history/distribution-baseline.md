# Distribution Baseline And Scattered Spec Fragments

**Status:** Historical/input record for the new Packaging And Distribution
architecture.
**Date:** 2026-09-04.
**Purpose:** Preserve the current generated-spec baseline and scattered
distribution-relevant facts while the new runtime identity/activation contract
becomes the canonical V1 design target.

This file is not the target design. It is the source-context ledger: facts,
constraints, older vocabulary, and design pressure that must not be forgotten
when the generated specs are eventually updated.

## 1. Current Node/npm Baseline

`docs/specs/distribution.md` currently describes the shipped baseline:

- Install is a GitHub-backed npm package install, commonly
  `npm install -g github:vantt/forgent#v0.1.0`.
- The package exposes two public binaries: `fgos` and `fgos-runner`.
- `package.json` defines the installable surface with `bin` and `files`.
- Install runs no lifecycle script; contributor hooks are manual.
- `setup` and `doctor` exist in the old public model. `setup` writes/fixes,
  plain `doctor` reports, and `doctor --fix` runs registered fixes.
- Doctor checks, doctor fixes, and config defaults are extensible registries,
  not a hardcoded closed list.
- Global config and project config coexist; project config wins.
- A dev checkout shell helper can resolve three tiers from one sourced shell
  function: dev checkout, project-local `node_modules/.bin`, then global
  install.
- The Claude Code plugin distribution is separate from the npm CLI package and
  must ship wrapper skills plus copied coding-domain dev-skills.

This baseline works as a Node/npm distribution story. It does not solve the
new project-local runtime identity problem, worktree runtime sharing, tracked
pin, activation, or Rust CLI release path.

## 2. Scattered Spec Fragments To Preserve

| Source | Fragment To Preserve | Architecture Impact |
|---|---|---|
| `docs/specs/platform-foundations.md` D-ADR0009 | A future install story must not interfere with other harnesses on the same machine/project. Doctrine scope is by territory; hooks are path-scoped; one conductor owns a session; install detects other harness markers and yields instead of overwriting. | Project-local distribution needs coexistence checks, generated-file ownership, and fail-closed projection policy. `fgctl init` must not blindly claim `.agents/`, `.claude/`, hooks, or host-visible paths. |
| `docs/specs/platform-foundations.md` D-ADR0014 | Human-facing architecture picked an event-log/protocol contract rather than a linkable library. CLI is a local adapter; daemon/web/mobile/remote surfaces are clients around the core contract; no second write path is allowed. | The future Project Runtime Adapter should preserve one write path while updating the old daemon/client picture: shared web/gateway may front many projects, but mutating semantics cross into the selected local payload. |
| `docs/specs/platform-foundations.md` D-ADR0035 | fgOS exists for developing other projects and driving business workflows. Self-development is dogfood, not product mission. The proposed mission key is `self-dev` vs `host`. | Distribution optimizes for host work first. Self-hosting needs explicit cleanliness/isolation policy, but must not dominate the distribution model. |
| `docs/specs/system-overview.md` | MVP story is install fgOS, submit a natural-language request, and reach a merge-ready code change with minimal babysitting. Cross-area flows include pull-door claiming, runner autonomy, review/approval gates, learning/docs, and future multi-surface human interfaces. | Distribution success is not "binary exists"; it is "installed payload can drive the full workflow loop reproducibly." Runtime identity covers CLI, runner, state contracts, docs/learning, and adapters. |
| `docs/specs/reading-map.md` | Current installed surface includes `package.json`, `README.md`, `bin/fgos.mjs`, `bin/fgos-runner.mjs`, setup/doctor sources, shell helper, plugin wrapper skills, herdr dashboard, runner, end-user docs, and architecture/spec docs. | The payload manifest must classify what ships to a project, what stays source-only, what is projected into host-visible paths, and what is machine/global. |
| `docs/specs/fgos-plugin.md` | Claude Code plugin is a host-surface distribution. Slash-command wrappers shell out to the underlying `fgos`; they do not write the store directly. Old resolver prefers project-local checkout/bin, then global PATH, then clear error. | Plugin/skill distribution belongs in payload/projection model. The wrapper-shells-to-`fgos` rule should stay, but command resolution must become runtime-root/active-record based rather than PATH-based. |
| `docs/specs/herdr-web-dashboard.md` and dashboard references | Herdr is a browser dashboard/gateway surface, not workflow authority itself. It reads/mutates through fgOS verbs/contracts and must avoid becoming a second state writer. | Shared web/gateway remains future constraint only for this delivery slice. Later it must delegate through selected project runtime/adapter. |
| `docs/specs/runner.md` and runner references | `fgos-runner` is a public headless/autonomy surface tied to work-state, gates, evidence, and project config. | Runner is part of project runtime payload identity. A runner mutating project state must use the selected project's active runtime digest. |
| `docs/specs/work-state.md` and work-state references | Event log and state projections are the product truth layer for fgOS work. Direct writes outside owned contract are unsafe. | Local runtime, adapter, doctor, and runner must agree on event schema/projection logic. Distribution drift is a state-corruption risk. |
| End-user docs/index references | End-user docs and generated document indexes are part of how a stranger agent or human understands the installed system. | Docs/prose can be part of runtime workshop payload; manifest/projection ledger must define installed vs projected vs product-package-excluded material. |

## 3. Old Design Pressure From `tsk-1fp`

The `tsk-1fp` family captured the earlier pending direction:

- Move away from a shared global npm location toward a git-hosted installer
  that vendors/copies fgOS into each project.
- Installer resolves target version, copies payload, writes a baseline ledger,
  and fails closed when payload is unsafe.
- Project-vendored fgOS owns version-specific init/doctor/config/schema
  knowledge.
- Existing project honors its pinned version unless an explicit upgrade path is
  invoked.
- Downgrade is refused unless forced and both versions are known.
- Drift is reportable from `fgos doctor`; repair should flow through
  installer/re-vendor path, not ad hoc patching release files.
- Parity gate fails closed when payload files/projections disagree on
  version/fingerprint.
- `docs/specs/distribution.md` entry points must be superseded explicitly once
  the generated-spec workflow is updated.

Current interpretation:

- `install.sh`/`install.ps1` as primary mechanism is superseded by `fgctl`.
- `setup --latest` vocabulary is superseded by `fgctl upgrade` plus local
  `fgos init` / `fgos doctor --fix`.
- "fingerprint ledger" is split into `ReleaseManifest`, `ActivationRecord`,
  `Pin`, `ProjectionLedger`, and later `MigrationJournal`.

## 4. Old Install Contexts

The old model had three contexts:

| Context | Old Resolution | New Interpretation |
|---|---|---|
| Dev checkout | Shell helper runs checkout `bin/*.mjs` inside forgent. | Needs explicit dev/source activation kind, not accidental PATH precedence. |
| Project-local install | Shell helper walks up to `node_modules/.bin/fgos`. | Becomes project runtime root with stable shim and active release record. |
| Global install | PATH or cached global bin path. | Becomes `fgctl` bootstrap/control, not project workflow authority. |

## 5. Source Hygiene Note

The generated specs still contain older vocabulary such as `setup`,
Distribution Manager, runtime locator, npm/global install tiers, and
`libexec/fgos/legacy-node`. These should be treated as historical inputs until
their generated sources are updated. New architecture vocabulary lives in:

- `runtime root`;
- `release tree manifest`;
- `artifactDigest`;
- `activation.json`;
- `fgctl`;
- local `fgos`;
- stable local shim;
- projection ledger;
- workspace activation binding.
