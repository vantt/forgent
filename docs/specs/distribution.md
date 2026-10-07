---
area: distribution
updated: 2026-10-07
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

# Spec: Distribution

How a developer gets the `fgos` and `fgos-runner` commands running — either
onto their own machine and into their own project from outside the forgent
source repository, or directly from inside a checkout of the source
repository itself, without a separate install. Used by: a developer who
wants to run `fgos` in a project that is not this repo, and a forgent
contributor working inside this repo's own checkout (or a linked worktree
of it).

## Entry Points & Triggers

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
  defaults. New workspace onboarding should use `fgctl init` (with `--from
  <source>` when `.fgos/distribution.json` is absent) plus local `fgos doctor
  --fix` and `fgos doctor`; `doctor --fix` runs only registered fixes, so the
  config defaults, hook wiring and Claude Code hook still come from one `fgos
  setup` in the project. Shell/global integration remains legacy setup
  compatibility until the compatibility-window decision retires it.
- `fgos doctor` (run anywhere) → reports whether the environment is set up
  correctly (Node/git present, shell helper sourced, config up to date).

## Data Dictionary

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
| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Specified, not built yet | directory | no | absent — the installed set alone applies |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

## Behaviors & Operations

### Install

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

### Dev checkout shell helpers

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

### Contributor hooks setup

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

### Setup

- **Blocked when:** never — running `fgos setup` always attempts its work;
  a shell profile that does not exist is simply skipped rather than
  refused.
- **What changes:** for every shell profile the caller actually has (bash's
  and/or zsh's, whichever exist), the shell helper's source line is added
  if not already present — never duplicated on a repeat run. The local
  project config file is also brought up to date: any setting present in
  the current default schema but missing from the caller's file is added,
  without ever changing a setting the caller already customized; a config
  file that already has every current default is left untouched. The same
  fill-missing-only treatment is applied to the **global** config file
  (`~/.fgos/config.json`, tsk-1ri) — `fgos setup` initializes it with the
  same default schema the project-local file gets, or fills in any missing
  key, every time it runs, regardless of which project it's run from;
  a value the caller already customized at the global level is never
  overwritten.
- **Side effects:** the caller's own shell profile file(s), local project
  config file, and global config file (`~/.fgos/config.json`) may be
  modified; nothing outside the caller's own environment is touched, and
  no network access happens.
- **Afterwards:** the caller sees exactly what changed — which profile
  file(s) gained the source line (or already had it), which project config
  settings were newly added (or that none were needed), and which global
  config settings were newly added (or that none were needed, or that the
  global file was just created). Nothing is done silently; running `fgos
  setup` again when everything is already current reports that plainly,
  without repeating any change.

### Doctor

- **Blocked when:** never — `fgos doctor` always runs every check and
  reports the result; it never fails the invocation itself, only reports
  individual checks as passing or not. Exit stays 0 because `fgctl
  init|upgrade|repair` run it as their tail and mark the install degraded on
  a non-zero exit; `--strict` is the opt-in that exits 1 when any check fails.
- **What changes:** nothing — this is a read-only diagnostic. It never
  writes a config file, never modifies a shell profile, and never installs
  anything, even when a check reports a problem (`config-not-stale`
  failing on a missing config file reports that plainly rather than
  creating one).
- **Side effects:** none.
- **Afterwards:** the caller sees each named check (Data Dictionary #7) and
  whether it passed, including enough detail to know what to do next (e.g.
  which config settings are missing, or that `fgos setup` has not been run
  yet).

## Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer / contributor |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |
| Source the dev checkout shell helper file | n/a (nothing to source outside a checkout) | ✓ (opt-in, from their own shell profile) |
| Run `fgos setup` (writes shell profile + config) | ✓ | ✓ |
| Run `fgos doctor` (read-only diagnostic) | ✓ | ✓ |

## Business Rules

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

- **RUL13 (customer customization lives in one tracked workspace folder; fgOS reads it first and never writes it; specified 2026-10-07, not built yet).** A customer project that wants its own agent definitions (persona, role, decision boundary) puts them in `fgos/agents/<name>.yaml` at its project root. It is not `.fgos/`: that folder is runner state, ignored by git (`/.fgos/*`), every merge that stages a change under it is refused (`fgos-write-rejected`), and a fresh worktree has it stripped (ADR0020 (the runner strips .fgos/ from every fresh worktree)). It is not `.agents/` either: that is generated skill output which `fgos setup` and `npm run build:skills` rewrite. The first scope is `agents/` only; `workflows/`, `task-specs/` and `skills/` follow the same layout when a customer needs them, not before.
  - Lookup, by name, first match wins: the workspace folder, then a domain or extension (`domains/<name>/agents/`), then the installed `core/agents`. A higher tier replaces the whole file of a lower one; fields are never merged. Two definitions of one name in the same tier are an error that `fgos doctor` reports, never a silent pick. This replaces the earlier rule that a name is unique across `core/agents` and every domain: a name is unique within a tier and a higher tier shadows a lower one.
  - fgOS creates the folder and a README once, at onboarding (`fgctl init`), and never edits it afterwards; an fgOS upgrade never touches it. The installed tier is located through the release manifest, never through the working directory or PATH.
  - A doctor check registers with the feature and reports each customization, which installed definition it shadows, whether it has the shape the loader needs, and a shadowed core name or an override that no longer fits the installed set after an upgrade.
  - Not customizable here: executor, model and provider policy (`config.json`) and the platform laws. An extension is treated as a domain until an extension loader exists.
  - No component-boundary change: it extends the three-tier discovery convention coordination protocols already use (project, `domains/<name>/`, packaged `core/`) to agent definitions.

## Edge Cases Settled

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

## Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

Specified by RUL13 (customer customization lives in one tracked workspace folder) but not built yet: the two-tier lookup (a persona is read today only from `core/agents/<name>.yaml` of the project being run, in `renderPersonaSection`, `src/runner/dispatch/assignment.mjs`, so an installed definition never reaches another project), the doctor check, the `fgctl init` skeleton and README, and the uniqueness check change. How an extension declares its root is undefined: no extension loader exists, only the domain layer.

## Visuals

Not applicable — no screen; this is a command-line install flow.

## Pointers (implementation)

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
