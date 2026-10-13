# Packaging independent review: successors 2

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_a288c743a526263c62df6ee0b67fb6e3

Binding and proposed decision:

```json
{
  "decision": {
    "claimId": "claim_a288c743a526263c62df6ee0b67fb6e3",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "44d8677f8928e78d07314600b104a33bb4ff23e84e92a7aa4077cddee98ae6bc",
    "disposition": "move",
    "targetOwner": "docs/platform/packaging-distribution/history/distribution-baseline.md",
    "targetAnchor": "unheaded-block-40",
    "targetUnitDigest": "44d8677f8928e78d07314600b104a33bb4ff23e84e92a7aa4077cddee98ae6bc",
    "authoredBy": "codex-session:8@2026-10-13",
    "reviewStatus": "pending",
    "rationale": "This native pre-existing distribution gap was displaced by main before this batch. Its complete old unit from 0b06824a7e987cb2b4574912e400c6e79f6697f2 is retained literally as dated evidence at docs/platform/packaging-distribution/history/distribution-baseline.md#unheaded-block-40. No current implementation or intentional retirement is inferred, and no identity is grafted.",
    "targetAncestry": [
      "History: Distribution Baseline",
      "Inherited Distribution Source Unit 4"
    ]
  },
  "cause": "inherited main-side distribution gap; full literal retention",
  "sourceCommit": "0b06824a7e987cb2b4574912e400c6e79f6697f2"
}
```

Source shown SHA256: `44d8677f8928e78d07314600b104a33bb4ff23e84e92a7aa4077cddee98ae6bc`

Target shown SHA256: `44d8677f8928e78d07314600b104a33bb4ff23e84e92a7aa4077cddee98ae6bc`

### Source shown text

```text
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
```

### Target shown text

```text
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
```

### Unified diff

```diff
No text difference.

```

## claim_1449f02666e99c92dd8ce3340af8a060

Binding and proposed decision:

```json
{
  "decision": {
    "claimId": "claim_1449f02666e99c92dd8ce3340af8a060",
    "sourcePath": "docs/specs/distribution.md",
    "sourceUnitDigest": "a51332b21702f71114c85f64f1c049cf198998f20e8e1fe3ae468c0c7b191c5d",
    "disposition": "move",
    "targetOwner": "docs/platform/packaging-distribution/history/distribution-baseline.md",
    "targetAnchor": "unheaded-block-42",
    "targetUnitDigest": "a51332b21702f71114c85f64f1c049cf198998f20e8e1fe3ae468c0c7b191c5d",
    "authoredBy": "codex-session:8@2026-10-13",
    "reviewStatus": "pending",
    "rationale": "This native pre-existing distribution gap was displaced by main before this batch. Its complete old unit from 0b06824a7e987cb2b4574912e400c6e79f6697f2 is retained literally as dated evidence at docs/platform/packaging-distribution/history/distribution-baseline.md#unheaded-block-42. No current implementation or intentional retirement is inferred, and no identity is grafted.",
    "targetAncestry": [
      "History: Distribution Baseline",
      "Inherited Distribution Source Unit 5"
    ]
  },
  "cause": "inherited main-side distribution gap; full literal retention",
  "sourceCommit": "0b06824a7e987cb2b4574912e400c6e79f6697f2"
}
```

Source shown SHA256: `a51332b21702f71114c85f64f1c049cf198998f20e8e1fe3ae468c0c7b191c5d`

Target shown SHA256: `a51332b21702f71114c85f64f1c049cf198998f20e8e1fe3ae468c0c7b191c5d`

### Source shown text

```text
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
```

### Target shown text

```text
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
```

### Unified diff

```diff
No text difference.

```

## claim_8eaaa820698633aedf4339ea1f923d89

Binding and proposed decision:

```json
{
  "decision": {
    "claimId": "claim_8eaaa820698633aedf4339ea1f923d89",
    "sourcePath": "docs/platform/packaging-distribution/contracts/activation-binding.md",
    "sourceUnitDigest": "feb1ffbbcdc358cd3c725515910cbc9c1d75a7fa40e3ac950a795c3d596a61a9",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/contracts/activation-binding.md",
    "targetAnchor": "unheaded-block-1",
    "targetUnitDigest": "8980fe7db4f59777813ca8119f184178e96980c3f53e001ee88ffe67c944c254",
    "authoredBy": "codex-session:8@2026-10-13",
    "reviewStatus": "pending",
    "rationale": "This exact intermediate authored metadata unit becomes a native gap when Candidate document status is separated from Frozen (V1) contract status. The real same-file successor preserves the complete frozen contract intent and schema body, with no approval or identity graft.",
    "targetAncestry": [
      "Contract: Activation Binding"
    ]
  },
  "cause": "candidate-status correction; intermediate metadata identity",
  "sourceCommit": "857ad83f84bb74770d3cd23402f859537edb7914"
}
```

Source shown SHA256: `feb1ffbbcdc358cd3c725515910cbc9c1d75a7fa40e3ac950a795c3d596a61a9`

Target shown SHA256: `8980fe7db4f59777813ca8119f184178e96980c3f53e001ee88ffe67c944c254`

### Source shown text

````text
```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Target shown text

````text
```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

```diff
--- source
+++ target
@@ -2,7 +2,8 @@
 Document type: Contract
 Audience: Maintainer, implementation agent, reviewer
 Purpose: Describe workspace activation records for project-local fgOS runtime selection
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution

```

## claim_99600767aa1a793a02dbdc32107693d2

Binding and proposed decision:

```json
{
  "decision": {
    "claimId": "claim_99600767aa1a793a02dbdc32107693d2",
    "sourcePath": "docs/platform/packaging-distribution/contracts/distribution-pin.md",
    "sourceUnitDigest": "4c1c662a71f24326115932c1feb1872d829ee4b09b426bcfb45f85a9f736d7d5",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/contracts/distribution-pin.md",
    "targetAnchor": "unheaded-block-1",
    "targetUnitDigest": "505a2fba8363494082231ca850d2329cd9b265990b04bb8a5c745e6e2345932c",
    "authoredBy": "codex-session:8@2026-10-13",
    "reviewStatus": "pending",
    "rationale": "This exact intermediate authored metadata unit becomes a native gap when Candidate document status is separated from Frozen (V1) contract status. The real same-file successor preserves the complete frozen contract intent and schema body, with no approval or identity graft.",
    "targetAncestry": [
      "Contract: Distribution Pin"
    ]
  },
  "cause": "candidate-status correction; intermediate metadata identity",
  "sourceCommit": "857ad83f84bb74770d3cd23402f859537edb7914"
}
```

Source shown SHA256: `4c1c662a71f24326115932c1feb1872d829ee4b09b426bcfb45f85a9f736d7d5`

Target shown SHA256: `505a2fba8363494082231ca850d2329cd9b265990b04bb8a5c745e6e2345932c`

### Source shown text

````text
```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Target shown text

````text
```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

```diff
--- source
+++ target
@@ -2,7 +2,8 @@
 Document type: Contract
 Audience: Maintainer, implementation agent, reviewer
 Purpose: Describe the tracked project runtime pin for packaging-distribution
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution

```

## claim_a4c26f8aae004f1d17d0f5be7e48b585

Binding and proposed decision:

```json
{
  "decision": {
    "claimId": "claim_a4c26f8aae004f1d17d0f5be7e48b585",
    "sourcePath": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "sourceUnitDigest": "ea2d47cd7df1f38d2e62d41f5a7ae009c009b92d67889c1b74841d2335a79560",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "unheaded-block-1",
    "targetUnitDigest": "28cfc4174a87b1d603361d312cf5c03172c5dece24c367db4bb1813341bc0ad2",
    "authoredBy": "codex-session:8@2026-10-13",
    "reviewStatus": "pending",
    "rationale": "This exact intermediate authored metadata unit becomes a native gap when Candidate document status is separated from Frozen (V1) contract status. The real same-file successor preserves the complete frozen contract intent and schema body, with no approval or identity graft.",
    "targetAncestry": [
      "Contract: Release Manifest"
    ]
  },
  "cause": "candidate-status correction; intermediate metadata identity",
  "sourceCommit": "857ad83f84bb74770d3cd23402f859537edb7914"
}
```

Source shown SHA256: `ea2d47cd7df1f38d2e62d41f5a7ae009c009b92d67889c1b74841d2335a79560`

Target shown SHA256: `28cfc4174a87b1d603361d312cf5c03172c5dece24c367db4bb1813341bc0ad2`

### Source shown text

````text
```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of scripts/build-rust-distribution.mjs, packages/distribution/rust/src/manifest.rs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- packages/distribution/rust/tests/schema_golden.rs
- scripts/build-rust-distribution.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Target shown text

````text
```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of scripts/build-rust-distribution.mjs, packages/distribution/rust/src/manifest.rs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- packages/distribution/rust/tests/schema_golden.rs
- scripts/build-rust-distribution.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

```diff
--- source
+++ target
@@ -2,7 +2,8 @@
 Document type: Contract
 Audience: Maintainer, release engineer, implementation agent
 Purpose: Describe the fgOS release manifest contract used by packaging-distribution
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution

```

