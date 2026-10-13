# History: Distribution Baseline

```txt
Document type: History
Audience: Maintainer, architecture reviewer, documentation agent
Purpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical
Design status: Draft
Implementation status: Historical source
Canonical: Yes, after review
Owner: Platform documentation
Source type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md
Last reviewed: 2026-09-13
Related:
- docs/specs/distribution.md
- docs/distribution-vision.md
- docs/platform/packaging-distribution/vision.md
- docs/architect/packaging-distribution/history/distribution-baseline.md
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

This history keeps the old baseline visible without letting it masquerade as current target design.

## 2. Legacy Baseline

The older distribution model centered on:

- GitHub npm install;
- `package.json` `bin.fgos` and `bin.fgos-runner`;
- package allowlist through `package.json` `files`;
- dev checkout shell helper;
- setup/doctor for shell/config readiness;
- no npm registry publish;
- no lifecycle install script.

Those facts remain useful, especially for compatibility behavior.

## 3. Vision Source

`docs/distribution-vision.md` introduced a stronger direction that now lives in `../vision.md`:

- install should not require cloning;
- setup/doctor should self-repair where possible;
- setup/doctor registries should be extensible;
- global/project/dev-checkout contexts should not conflict;
- CI should become part of setup confidence.

History keeps the old source trace. It is not the current authority for the living direction.

Several items that were open in that document have since been implemented or partially implemented. Do not copy its dated “not yet present” claims into current docs without checking code.

## 4. Architecture Shift

The packaging-distribution architecture stream reframed the area around:

- `fgctl` as machine/global bootstrap;
- project-local `fgos` as workflow authority;
- release tree identity through `artifactDigest`;
- workspace-local activation binding;
- stable `.fgos/installation/bin/` command surface;
- legacy Node payload as compatibility layer.

## 5. Supersession Guidance

Use old docs as source material, not final authority:

| Old source | Use |
| --- | --- |
| `docs/specs/distribution.md` | Extract implemented behavior and setup/doctor rules. |
| `docs/distribution-vision.md` | Historical source for `../vision.md`; preserve old context and supersession trail. |
| `docs/architect/packaging-distribution/**` | Promote architecture after implementation alignment is explicit. |

## 6. Do Not Lose

These old facts must stay traceable:

- setup/doctor default read-only versus fix behavior;
- global config and project config precedence;
- npm/Node compatibility;
- plugin/dev-skill distribution;
- package allowlist and end-user docs packaging;
- no lifecycle install script;
- dev checkout helper behavior;
- reason for moving from global PATH selection to workspace activation.


## Retained Distribution Baseline Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/history/distribution-baseline.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.

### Distribution Baseline And Scattered Spec Fragments

```txt
Legacy status: Promoted history source
Promoted to: docs/platform/packaging-distribution/history/distribution-baseline.md
Current reader entry: docs/platform/packaging-distribution/README.md
Use this legacy file for: Original baseline collection and source trace
Do not use this legacy file for: Current canonical history
Last reviewed: 2026-09-13
```

> Status: historical source. The active condensed history is
> [docs/platform/packaging-distribution/history/distribution-baseline.md](distribution-baseline.md).
> This file remains the full discussion-era evidence ledger and is not current
> target architecture.

**Status:** Historical/input record for the new Packaging And Distribution
architecture.
**Date:** 2026-09-04.
**Purpose:** Preserve the current generated-spec baseline and scattered
distribution-relevant facts while the new runtime identity/activation contract
becomes the canonical V1 design target.

This file is not the target design. It is the source-context ledger: facts,
constraints, older vocabulary, and design pressure that must not be forgotten
when the generated specs are eventually updated.

#### 1. Current Node/npm Baseline

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

#### 2. Scattered Spec Fragments To Preserve

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

#### 3. Old Design Pressure From `tsk-1fp`

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

#### 4. Old Install Contexts

The old model had three contexts:

| Context | Old Resolution | New Interpretation |
|---|---|---|
| Dev checkout | Shell helper runs checkout `bin/*.mjs` inside forgent. | Needs explicit dev/source activation kind, not accidental PATH precedence. |
| Project-local install | Shell helper walks up to `node_modules/.bin/fgos`. | Becomes project runtime root with stable shim and active release record. |
| Global install | PATH or cached global bin path. | Becomes `fgctl` bootstrap/control, not project workflow authority. |

#### 5. Source Hygiene Note

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

## Inherited Distribution Source Unit 1

Added in candidate — this exact earlier source unit from `docs/specs/distribution.md` at `3ea75475d911ca02c9d8b5011dca4f748cc5820f` was displaced by main-side edits before this batch. Its native identity remains an explicit gap, preserved here as dated evidence rather than a current implementation assertion.

- **Blocked when:** never — this is an explicit command a contributor runs
  themselves; it always runs when invoked.
- **What changes:** running the setup command wires up this repository's
  pre-commit hook for the person who just cloned it. It is never triggered
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle)
  — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.
- In fgOS source checkouts, the hook refuses newly staged root files outside
  its own allowlist, including linked worktrees and `fgw/*` branches. Existing
  root modifications/deletions remain permitted. Allowlist changes must land
  separately on main before root additions use them; the index cannot authorize
  itself. Merge commits skip only this root guard, never existing data-loss
  guards. `main-checkout-hook-wired` diagnoses wiring using the existing check.

## Inherited Distribution Source Unit 2

Added in candidate — this exact earlier source unit from `docs/specs/distribution.md` at `f053de033bc4399a42db3c67cfd6583412ab283e` was displaced by main-side edits before this batch. Its native identity remains an explicit gap, preserved here as dated evidence rather than a current implementation assertion.

---
area: distribution
updated: 2026-07-23
sources: [distribution-packaging, str76-runner-bootstrap, str77-79-doc-gap-fixes, str87-fgos-install-ux, str88-fgos-pnpm-lifecycle, str87-fgos-setup-doctor]
decisions: [12aedbc8, 469f4c79, 5d669ff6, 38f7e0b8, ea8b9a8d, cbb4736a, 862ac01f, b799cbaa, 563db0a9, e52cc667, e8852403, 4cb11e46, 589eb4b0, 175cfc08, 1005dae0, 4206a0a6, 7d982955, ef531b22]
coverage: full
---

## Inherited Distribution Source Unit 3

Added in candidate — this exact earlier source unit from `docs/specs/distribution.md` at `f053de033bc4399a42db3c67cfd6583412ab283e` was displaced by main-side edits before this batch. Its native identity remains an explicit gap, preserved here as dated evidence rather than a current implementation assertion.

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `README.md`, `LICENSE`, plus the end-user documentation subset: the how-to guides directory, the design-rationale (explanation) directory, and the read-by-tag documentation index file | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

## Inherited Distribution Source Unit 4

Added in candidate — this exact earlier source unit from `docs/specs/distribution.md` at `0b06824a7e987cb2b4574912e400c6e79f6697f2` was displaced by main-side edits before this batch. Its native identity remains an explicit gap, preserved here as dated evidence rather than a current implementation assertion.

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `README.md`, `LICENSE`, plus the end-user documentation subset: the how-to guides directory, the design-rationale (explanation) directory, and the read-by-tag documentation index file | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: ~35 CLI-wrapper skills (`cook`, `discover`, `plan`, `pick`, `submit`, ...) that always shipped here, plus (tsk-32b) the 14 coding-domain dev-skills (`fgos-coding-driving`, `fgos-routing`, `fgos-clarifying`, ...) those wrappers dispatch into via the `Skill` tool — before tsk-32b, the dev-skills existed only in this repo's own `.claude/skills/`, so a session in a repo that installed fgOS only as a plugin (no forgent checkout anywhere) got "Unknown skill" the first time a wrapper skill tried to dispatch into one, even though the `fgos` CLI itself was fully reachable (`plugin-skill-cli-reachable` only checks the CLI, never the dev-skill files). The 14 dev-skill copies must stay byte-identical to `.claude/skills/fgos-*` (`test/skills/fgos-mirror.test.mjs`, extended to a third leg alongside the pre-existing `.claude/skills`<->`.agents/skills` mirror) — a maintainer edits `.claude/skills/fgos-*` and copies forward, never edits the plugin copy independently; `plugin-dev-skills-packaged` (doctor check, row 7 below) catches a forgotten copy before release | 14 dev-skills + ~35 CLI-wrapper skills | yes (the wrapper skills; the dev-skill copies exist specifically so a plugin-only consumer's `/fgOS:cook`/`/fgOS:discover`/`/fgOS:plan`/`/fgOS:pick` work end to end) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

## Inherited Distribution Source Unit 5

Added in candidate — this exact earlier source unit from `docs/specs/distribution.md` at `0b06824a7e987cb2b4574912e400c6e79f6697f2` was displaced by main-side edits before this batch. Its native identity remains an explicit gap, preserved here as dated evidence rather than a current implementation assertion.

- **Blocked when:** never — this is an explicit command a contributor runs
  themselves; it always runs when invoked.
- **What changes:** running the setup command wires up this repository's
  pre-commit hook for the person who just cloned it. It is never triggered
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle)
  — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.
